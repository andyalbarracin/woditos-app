-- ============================================================
-- WODITOS — STORAGE BUCKETS
-- Archivo: 04_storage.sql
-- Ejecutar DESPUÉS de 03_rls_policies.sql
-- ============================================================

-- Crear bucket público para stories
INSERT INTO storage.buckets (id, name, public) VALUES ('stories', 'stories', true);

-- Policy: cualquier usuario autenticado puede subir a stories
CREATE POLICY "Authenticated users can upload stories" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'stories');

-- Policy: cualquiera puede leer stories (bucket público)
CREATE POLICY "Public can read stories" ON storage.objects
  FOR SELECT USING (bucket_id = 'stories');

-- Policy: usuarios pueden borrar sus propios archivos
CREATE POLICY "Users can delete own story files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'stories' AND (storage.foldername(name))[1] = auth.uid()::text);
