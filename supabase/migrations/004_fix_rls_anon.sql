-- ════════════════════════════════════════════════════════════════════
-- FibraMax Orientaciones — Fix RLS: permitir anon hasta añadir auth
-- EJECUTAR EN: Supabase Dashboard → SQL Editor
-- PREREQUISITO: 001, 002 ejecutados
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Centros: añadir anon a las políticas de escritura ──────────
DROP POLICY IF EXISTS "centers_write"  ON centers;
DROP POLICY IF EXISTS "centers_update" ON centers;
DROP POLICY IF EXISTS "centers_delete" ON centers;

CREATE POLICY "centers_write"  ON centers FOR INSERT TO anon, authenticated
  WITH CHECK (
    name IS NOT NULL AND length(trim(name)) > 0 AND length(name) <= 100
    AND color ~ '^#[0-9A-Fa-f]{6}$'
    AND short_code ~ '^[A-Z0-9]{2,3}$'
  );
CREATE POLICY "centers_update" ON centers FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (
    length(name) <= 100
    AND color ~ '^#[0-9A-Fa-f]{6}$'
  );
CREATE POLICY "centers_delete" ON centers FOR DELETE TO anon, authenticated USING (true);

-- ── 2. Monitores: añadir anon a las políticas de escritura ────────
DROP POLICY IF EXISTS "monitors_write"  ON monitors;
DROP POLICY IF EXISTS "monitors_update" ON monitors;
DROP POLICY IF EXISTS "monitors_delete" ON monitors;

CREATE POLICY "monitors_write"  ON monitors FOR INSERT TO anon, authenticated
  WITH CHECK (
    name IS NOT NULL AND length(trim(name)) > 0 AND length(name) <= 100
    AND color ~ '^#[0-9A-Fa-f]{6}$'
    AND center_id IS NOT NULL
  );
CREATE POLICY "monitors_update" ON monitors FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (
    length(name) <= 100
    AND color ~ '^#[0-9A-Fa-f]{6}$'
  );
CREATE POLICY "monitors_delete" ON monitors FOR DELETE TO anon, authenticated USING (true);

-- ── 3. Re-seed monitores (pueden faltar si 001 no los insertó) ────
-- ON CONFLICT DO NOTHING = seguro ejecutar varias veces
INSERT INTO monitors (name, color, center_id) VALUES
  ('Carla Martínez', '#F59E0B', 'c1000000-0000-0000-0000-000000000001'),
  ('Rafa Soler',     '#D97706', 'c1000000-0000-0000-0000-000000000001'),
  ('Jordi Puig',     '#3B82F6', 'c1000000-0000-0000-0000-000000000002'),
  ('Neus Vidal',     '#2563EB', 'c1000000-0000-0000-0000-000000000002'),
  ('Sara López',     '#10B981', 'c1000000-0000-0000-0000-000000000003'),
  ('Marc Torrent',   '#059669', 'c1000000-0000-0000-0000-000000000003'),
  ('Laia Pons',      '#8B5CF6', 'c1000000-0000-0000-0000-000000000004'),
  ('Pau Roca',       '#7C3AED', 'c1000000-0000-0000-0000-000000000004'),
  ('Miriam Fonts',   '#EC4899', 'c1000000-0000-0000-0000-000000000005'),
  ('Toni Masó',      '#DB2777', 'c1000000-0000-0000-0000-000000000005'),
  ('Ivet Camps',     '#06B6D4', 'c1000000-0000-0000-0000-000000000006'),
  ('Gerard Batlle',  '#0891B2', 'c1000000-0000-0000-0000-000000000006'),
  ('Marta Esteve',   '#F97316', 'c1000000-0000-0000-0000-000000000007'),
  ('Dani Ferrer',    '#EA580C', 'c1000000-0000-0000-0000-000000000007')
ON CONFLICT DO NOTHING;
