-- ════════════════════════════════════════════════════════════════════
-- FibraMax Orientaciones — Audit Log inmutable
-- EJECUTAR EN: Supabase Dashboard → SQL Editor
-- PREREQUISITO: 001 y 002 ejecutados
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Tabla audit_log (append-only) ─────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id              BIGSERIAL    PRIMARY KEY,            -- secuencial para orden garantizado
  table_name      TEXT         NOT NULL,
  operation       TEXT         NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id       UUID,                                -- id del registro afectado
  old_data        JSONB,                               -- estado anterior  (UPDATE / DELETE)
  new_data        JSONB,                               -- estado nuevo      (INSERT / UPDATE)
  changed_fields  TEXT[],                              -- solo campos que cambiaron (UPDATE)
  changed_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  client_addr     INET                                 -- IP del cliente vía PostgREST
);

-- ── 2. Índices para consultas eficientes ──────────────────────────
CREATE INDEX idx_audit_changed_at  ON audit_log(changed_at DESC);
CREATE INDEX idx_audit_table       ON audit_log(table_name);
CREATE INDEX idx_audit_record_id   ON audit_log(record_id);
CREATE INDEX idx_audit_operation   ON audit_log(operation);

-- ── 3. RLS: solo lectura — escritura exclusivamente vía trigger ───
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Lectura pública (la app puede mostrar el log)
CREATE POLICY "audit_select" ON audit_log
  FOR SELECT TO anon, authenticated USING (true);

-- Sin política de INSERT/UPDATE/DELETE para roles normales.
-- El trigger usa SECURITY DEFINER → bypasa RLS actuando como propietario de la función.

-- ── 4. Función trigger genérica (SECURITY DEFINER) ───────────────
CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_old           JSONB;
  v_new           JSONB;
  v_changed       TEXT[];
  v_record_id     UUID;
  v_skip_fields   TEXT[] := ARRAY['created_at', 'updated_at'];
BEGIN
  -- ── INSERT ──────────────────────────────────────────────────────
  IF TG_OP = 'INSERT' THEN
    v_new := to_jsonb(NEW);
    -- Limpiar campos de metadatos no relevantes para el audit
    SELECT jsonb_object_agg(key, value)
      INTO v_new
      FROM jsonb_each(v_new)
      WHERE key <> ALL(v_skip_fields);

    BEGIN v_record_id := (v_new->>'id')::UUID; EXCEPTION WHEN OTHERS THEN v_record_id := NULL; END;

    INSERT INTO public.audit_log (table_name, operation, record_id, new_data, changed_at, client_addr)
    VALUES (TG_TABLE_NAME, 'INSERT', v_record_id, v_new, now(), inet_client_addr());
    RETURN NEW;

  -- ── UPDATE ──────────────────────────────────────────────────────
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);

    -- Solo los campos que realmente cambiaron
    SELECT array_agg(key ORDER BY key)
      INTO v_changed
      FROM jsonb_each(v_new) AS n(key, value)
      WHERE key <> ALL(v_skip_fields)
        AND (v_old->key) IS DISTINCT FROM value;

    -- No registrar si solo cambiaron updated_at
    IF v_changed IS NULL OR array_length(v_changed, 1) = 0 THEN
      RETURN NEW;
    END IF;

    -- Guardar solo los campos relevantes (sin metadatos)
    SELECT jsonb_object_agg(key, value) INTO v_old
      FROM jsonb_each(v_old) WHERE key = ANY(v_changed);
    SELECT jsonb_object_agg(key, value) INTO v_new
      FROM jsonb_each(v_new) WHERE key = ANY(v_changed);

    BEGIN v_record_id := (to_jsonb(NEW)->>'id')::UUID; EXCEPTION WHEN OTHERS THEN v_record_id := NULL; END;

    INSERT INTO public.audit_log (table_name, operation, record_id, old_data, new_data, changed_fields, changed_at, client_addr)
    VALUES (TG_TABLE_NAME, 'UPDATE', v_record_id, v_old, v_new, v_changed, now(), inet_client_addr());
    RETURN NEW;

  -- ── DELETE ──────────────────────────────────────────────────────
  ELSIF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);

    SELECT jsonb_object_agg(key, value)
      INTO v_old
      FROM jsonb_each(v_old)
      WHERE key <> ALL(v_skip_fields);

    BEGIN v_record_id := (v_old->>'id')::UUID; EXCEPTION WHEN OTHERS THEN v_record_id := NULL; END;

    INSERT INTO public.audit_log (table_name, operation, record_id, old_data, changed_at, client_addr)
    VALUES (TG_TABLE_NAME, 'DELETE', v_record_id, v_old, now(), inet_client_addr());
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- ── 5. Triggers en las 6 tablas ───────────────────────────────────
CREATE TRIGGER trg_audit_centers
  AFTER INSERT OR UPDATE OR DELETE ON centers
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_monitors
  AFTER INSERT OR UPDATE OR DELETE ON monitors
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_orientations
  AFTER INSERT OR UPDATE OR DELETE ON orientations
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_tours
  AFTER INSERT OR UPDATE OR DELETE ON tours
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_orientation_feedback
  AFTER INSERT OR UPDATE OR DELETE ON orientation_feedback
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_tour_feedback
  AFTER INSERT OR UPDATE OR DELETE ON tour_feedback
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- ── 6. Vista resumen para consultas rápidas ───────────────────────
CREATE VIEW audit_log_summary AS
SELECT
  id,
  changed_at,
  table_name,
  operation,
  record_id,
  changed_fields,
  CASE
    WHEN operation = 'INSERT' THEN new_data
    WHEN operation = 'DELETE' THEN old_data
    WHEN operation = 'UPDATE' THEN new_data
  END AS relevant_data,
  old_data,
  new_data,
  client_addr
FROM audit_log
ORDER BY changed_at DESC;

-- ── 7. Función helper para buscar historial de un registro ────────
CREATE OR REPLACE FUNCTION fn_record_history(p_record_id UUID)
RETURNS TABLE (
  id          BIGINT,
  operation   TEXT,
  changed_at  TIMESTAMPTZ,
  old_data    JSONB,
  new_data    JSONB,
  changed_fields TEXT[]
)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, operation, changed_at, old_data, new_data, changed_fields
  FROM audit_log
  WHERE record_id = p_record_id
  ORDER BY changed_at DESC;
$$;
