-- ════════════════════════════════════════════════════════════════════
-- FibraMax Orientaciones — Schema inicial
-- Ejecutar en: Supabase Dashboard → SQL Editor del proyecto
-- ════════════════════════════════════════════════════════════════════

-- ── Enums ─────────────────────────────────────────────────────────────
CREATE TYPE orientation_status AS ENUM (
  'pending', 'confirmed', 'completed', 'cancelled', 'no_show'
);

CREATE TYPE service_type AS ENUM (
  'general', 'advanced', 'maintenance', 'specific_equipment', 'group'
);

-- ── Centros ────────────────────────────────────────────────────────────
CREATE TABLE centers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#DF3E6F',
  short_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Monitores ──────────────────────────────────────────────────────────
CREATE TABLE monitors (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name      TEXT NOT NULL,
  color     TEXT NOT NULL DEFAULT '#DF3E6F',
  center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Orientaciones ──────────────────────────────────────────────────────
CREATE TABLE orientations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_name TEXT NOT NULL,
  monitor_id      UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  status          orientation_status NOT NULL DEFAULT 'pending',
  service_type    service_type NOT NULL DEFAULT 'general',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_orientations_date       ON orientations(date);
CREATE INDEX idx_orientations_monitor_id ON orientations(monitor_id);
CREATE INDEX idx_orientations_status     ON orientations(status);

-- ── Tours ──────────────────────────────────────────────────────────────
CREATE TABLE tours (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tours_date       ON tours(date);
CREATE INDEX idx_tours_monitor_id ON tours(monitor_id);

-- ── Feedback orientaciones ─────────────────────────────────────────────
CREATE TABLE orientation_feedback (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orientation_id UUID NOT NULL REFERENCES orientations(id) ON DELETE CASCADE UNIQUE,
  rating         INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment        TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ── Feedback tours ─────────────────────────────────────────────────────
CREATE TABLE tour_feedback (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id    UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE UNIQUE,
  rating     INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Trigger updated_at ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_centers_updated_at    BEFORE UPDATE ON centers    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_monitors_updated_at   BEFORE UPDATE ON monitors   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orientations_updated_at BEFORE UPDATE ON orientations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── RLS (permisivo sin auth por ahora) ────────────────────────────────
ALTER TABLE centers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitors             ENABLE ROW LEVEL SECURITY;
ALTER TABLE orientations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours                ENABLE ROW LEVEL SECURITY;
ALTER TABLE orientation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_feedback        ENABLE ROW LEVEL SECURITY;

-- Política pública (sin auth): acceso total con anon key
CREATE POLICY "public_all" ON centers              FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON monitors             FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON orientations         FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON tours                FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON orientation_feedback FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON tour_feedback        FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ════════════════════════════════════════════════════════════════════
-- SEED DATA — Centros y Monitores de FibraMax
-- ════════════════════════════════════════════════════════════════════
INSERT INTO centers (id, name, color, short_code) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Granollers', '#F59E0B', 'GR'),
  ('c1000000-0000-0000-0000-000000000002', 'Mollet',     '#3B82F6', 'ML'),
  ('c1000000-0000-0000-0000-000000000003', 'Blanes',     '#10B981', 'BL'),
  ('c1000000-0000-0000-0000-000000000004', 'Mataró',     '#8B5CF6', 'MT'),
  ('c1000000-0000-0000-0000-000000000005', 'Cabrera',    '#EC4899', 'CB'),
  ('c1000000-0000-0000-0000-000000000006', 'Sabadell',   '#06B6D4', 'SB'),
  ('c1000000-0000-0000-0000-000000000007', 'Premià',     '#F97316', 'PM');

INSERT INTO monitors (name, color, center_id) VALUES
  -- Granollers
  ('Carla Martínez', '#F59E0B', 'c1000000-0000-0000-0000-000000000001'),
  ('Rafa Soler',     '#D97706', 'c1000000-0000-0000-0000-000000000001'),
  -- Mollet
  ('Jordi Puig',     '#3B82F6', 'c1000000-0000-0000-0000-000000000002'),
  ('Neus Vidal',     '#2563EB', 'c1000000-0000-0000-0000-000000000002'),
  -- Blanes
  ('Sara López',     '#10B981', 'c1000000-0000-0000-0000-000000000003'),
  ('Marc Torrent',   '#059669', 'c1000000-0000-0000-0000-000000000003'),
  -- Mataró
  ('Laia Pons',      '#8B5CF6', 'c1000000-0000-0000-0000-000000000004'),
  ('Pau Roca',       '#7C3AED', 'c1000000-0000-0000-0000-000000000004'),
  -- Cabrera
  ('Miriam Fonts',   '#EC4899', 'c1000000-0000-0000-0000-000000000005'),
  ('Toni Masó',      '#DB2777', 'c1000000-0000-0000-0000-000000000005'),
  -- Sabadell
  ('Ivet Camps',     '#06B6D4', 'c1000000-0000-0000-0000-000000000006'),
  ('Gerard Batlle',  '#0891B2', 'c1000000-0000-0000-0000-000000000006'),
  -- Premià
  ('Marta Esteve',   '#F97316', 'c1000000-0000-0000-0000-000000000007'),
  ('Dani Ferrer',    '#EA580C', 'c1000000-0000-0000-0000-000000000007');
