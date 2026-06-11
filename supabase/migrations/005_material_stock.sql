-- ════════════════════════════════════════════════════════════════════
-- FibraMax — Control de material / stock por recuentos periódicos
-- EJECUTAR EN: Supabase Dashboard → SQL Editor
-- PREREQUISITO: 001..004 ejecutados
-- ════════════════════════════════════════════════════════════════════

-- ── Materiales (catálogo por centro) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS materials (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id    UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  category     TEXT,
  expected_qty INTEGER NOT NULL DEFAULT 0 CHECK (expected_qty >= 0),  -- stock objetivo
  min_qty      INTEGER NOT NULL DEFAULT 0 CHECK (min_qty >= 0),       -- umbral para reponer
  unit         TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_materials_center ON materials(center_id);

-- ── Recuentos de stock (uno por material y fecha) ───────────────────────
CREATE TABLE IF NOT EXISTS stock_counts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  counted_qty INTEGER NOT NULL CHECK (counted_qty >= 0),
  counted_at  DATE NOT NULL DEFAULT current_date,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stock_counts_material ON stock_counts(material_id, counted_at DESC);

-- ── Trigger updated_at (reutiliza la función creada en 001) ──────────────
DROP TRIGGER IF EXISTS trg_materials_updated ON materials;
CREATE TRIGGER trg_materials_updated BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── RLS (acceso anónimo, como el resto de tablas mientras no hay auth) ───
ALTER TABLE materials    ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_counts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_all" ON materials;
DROP POLICY IF EXISTS "public_all" ON stock_counts;
CREATE POLICY "public_all" ON materials    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON stock_counts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ── Realtime (actualización instantánea, igual que el resto) ────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.materials, public.stock_counts;
