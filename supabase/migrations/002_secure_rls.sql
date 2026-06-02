-- ════════════════════════════════════════════════════════════════════
-- FibraMax Orientaciones — RLS restrictivo (reemplaza public_all)
-- EJECUTAR EN: supabase.com/dashboard/project/trhoxscxatxgrtyfefby/sql
-- PREREQUISITO: haber ejecutado 001_initial_schema.sql
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Eliminar políticas permisivas anteriores ────────────────────
DROP POLICY IF EXISTS "public_all" ON centers;
DROP POLICY IF EXISTS "public_all" ON monitors;
DROP POLICY IF EXISTS "public_all" ON orientations;
DROP POLICY IF EXISTS "public_all" ON tours;
DROP POLICY IF EXISTS "public_all" ON orientation_feedback;
DROP POLICY IF EXISTS "public_all" ON tour_feedback;

-- ── 2. CENTROS — solo lectura pública; escritura requiere service_role ──
-- Recepción necesita ver centros para crear orientaciones
CREATE POLICY "centers_read"   ON centers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "centers_write"  ON centers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "centers_update" ON centers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "centers_delete" ON centers FOR DELETE TO authenticated USING (true);

-- ── 3. MONITORES — solo lectura pública; escritura requiere auth ───
CREATE POLICY "monitors_read"   ON monitors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "monitors_write"  ON monitors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "monitors_update" ON monitors FOR UPDATE TO authenticated USING (true);
CREATE POLICY "monitors_delete" ON monitors FOR DELETE TO authenticated USING (true);

-- ── 4. ORIENTACIONES — lectura y escritura para usuarios de la app ──
-- Mientras no haya auth de usuarios: permitir anon para operaciones de negocio
-- NOTA: cuando se añada auth, cambiar TO anon → TO authenticated
CREATE POLICY "orientations_read"   ON orientations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "orientations_insert" ON orientations FOR INSERT TO anon, authenticated
  WITH CHECK (
    subscriber_name IS NOT NULL
    AND length(trim(subscriber_name)) > 0
    AND length(subscriber_name) <= 200
    AND monitor_id IS NOT NULL
    AND date IS NOT NULL
    AND start_time IS NOT NULL
    AND end_time IS NOT NULL
    AND end_time > start_time
    AND (notes IS NULL OR length(notes) <= 2000)
  );
CREATE POLICY "orientations_update" ON orientations FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (
    subscriber_name IS NOT NULL
    AND length(trim(subscriber_name)) > 0
    AND length(subscriber_name) <= 200
    AND (notes IS NULL OR length(notes) <= 2000)
  );
CREATE POLICY "orientations_delete" ON orientations FOR DELETE TO anon, authenticated USING (true);

-- ── 5. TOURS ──────────────────────────────────────────────────────
CREATE POLICY "tours_read"   ON tours FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "tours_insert" ON tours FOR INSERT TO anon, authenticated
  WITH CHECK (
    monitor_id IS NOT NULL
    AND date IS NOT NULL
    AND date <= CURRENT_DATE + INTERVAL '1 day'
    AND (notes IS NULL OR length(notes) <= 500)
  );
CREATE POLICY "tours_delete" ON tours FOR DELETE TO anon, authenticated USING (true);

-- ── 6. FEEDBACK — solo insertar/actualizar si la orientación existe ─
CREATE POLICY "ofeedback_read"   ON orientation_feedback FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ofeedback_write"  ON orientation_feedback FOR INSERT TO anon, authenticated
  WITH CHECK (
    rating IS NOT NULL
    AND rating >= 1
    AND rating <= 5
    AND (comment IS NULL OR length(comment) <= 1000)
    AND EXISTS (SELECT 1 FROM orientations WHERE id = orientation_id AND status = 'completed')
  );
CREATE POLICY "ofeedback_update" ON orientation_feedback FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (
    rating >= 1
    AND rating <= 5
    AND (comment IS NULL OR length(comment) <= 1000)
  );

CREATE POLICY "tfeedback_read"   ON tour_feedback FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "tfeedback_write"  ON tour_feedback FOR INSERT TO anon, authenticated
  WITH CHECK (
    rating IS NOT NULL
    AND rating >= 1
    AND rating <= 5
    AND (comment IS NULL OR length(comment) <= 1000)
    AND EXISTS (SELECT 1 FROM tours WHERE id = tour_id)
  );
CREATE POLICY "tfeedback_update" ON tour_feedback FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (
    rating >= 1
    AND rating <= 5
    AND (comment IS NULL OR length(comment) <= 1000)
  );

-- ── 7. Fix CHECK constraint en feedback — no permitir NULL en rating ─
ALTER TABLE orientation_feedback DROP CONSTRAINT IF EXISTS orientation_feedback_rating_check;
ALTER TABLE orientation_feedback ADD CONSTRAINT orientation_feedback_rating_check
  CHECK (rating IS NOT NULL AND rating >= 1 AND rating <= 5);

ALTER TABLE tour_feedback DROP CONSTRAINT IF EXISTS tour_feedback_rating_check;
ALTER TABLE tour_feedback ADD CONSTRAINT tour_feedback_rating_check
  CHECK (rating IS NOT NULL AND rating >= 1 AND rating <= 5);

-- ── 8. Límites de longitud a nivel de BD (segunda línea de defensa) ─
ALTER TABLE orientations ADD CONSTRAINT subscriber_name_length CHECK (length(subscriber_name) <= 200);
ALTER TABLE orientations ADD CONSTRAINT notes_length CHECK (notes IS NULL OR length(notes) <= 2000);
ALTER TABLE tours        ADD CONSTRAINT tours_notes_length CHECK (notes IS NULL OR length(notes) <= 500);
ALTER TABLE monitors     ADD CONSTRAINT monitor_name_length CHECK (length(name) <= 100);
ALTER TABLE centers      ADD CONSTRAINT center_name_length CHECK (length(name) <= 100);
ALTER TABLE orientation_feedback ADD CONSTRAINT ofeedback_comment_length CHECK (comment IS NULL OR length(comment) <= 1000);
ALTER TABLE tour_feedback        ADD CONSTRAINT tfeedback_comment_length CHECK (comment IS NULL OR length(comment) <= 1000);

-- ── 9. Color hex validation (evita inyección de CSS malicioso) ────
ALTER TABLE centers  ADD CONSTRAINT center_color_format  CHECK (color ~ '^#[0-9A-Fa-f]{6}$');
ALTER TABLE monitors ADD CONSTRAINT monitor_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$');

-- ── 10. Short code validation ─────────────────────────────────────
ALTER TABLE centers ADD CONSTRAINT short_code_format CHECK (short_code ~ '^[A-Z0-9]{2,3}$');
