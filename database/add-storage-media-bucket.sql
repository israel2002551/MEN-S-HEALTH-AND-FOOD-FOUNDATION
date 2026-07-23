-- Supabase Storage setup for admin image/video uploads.
-- Run this once in Supabase SQL Editor.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ngo-media',
  'ngo-media',
  true,
  104857600,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/ogg']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public can read NGO media'
  ) THEN
    CREATE POLICY "Public can read NGO media"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'ngo-media');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can upload NGO media'
  ) THEN
    CREATE POLICY "Admins can upload NGO media"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'ngo-media' AND public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can update NGO media'
  ) THEN
    CREATE POLICY "Admins can update NGO media"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'ngo-media' AND public.is_admin())
    WITH CHECK (bucket_id = 'ngo-media' AND public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can delete NGO media'
  ) THEN
    CREATE POLICY "Admins can delete NGO media"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'ngo-media' AND public.is_admin());
  END IF;
END $$;
