-- ============================================================================
-- MATTHORG: SUPABASE STORAGE RLS POLICIES FOR `Products` BUCKET
-- Configures the public `Products` bucket for raw, unoptimized image uploads
-- and public reads without requiring image transformations.
-- Idempotent and safe to run multiple times in Supabase SQL Editor.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'Products',
  'Products',
  true,
  52428800, -- 50 MB max per raw original image
  NULL      -- Allow any original image MIME type without re-encoding
)
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read access for all files in Products bucket
DROP POLICY IF EXISTS "Public read access for Products bucket" ON storage.objects;
CREATE POLICY "Public read access for Products bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'Products');

-- Allow uploads to Products bucket
DROP POLICY IF EXISTS "Upload access for Products bucket" ON storage.objects;
CREATE POLICY "Upload access for Products bucket"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'Products');

-- Allow updating/replacing uploaded images in Products bucket
DROP POLICY IF EXISTS "Update access for Products bucket" ON storage.objects;
CREATE POLICY "Update access for Products bucket"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'Products')
WITH CHECK (bucket_id = 'Products');

-- Allow deleting images from Products bucket
DROP POLICY IF EXISTS "Delete access for Products bucket" ON storage.objects;
CREATE POLICY "Delete access for Products bucket"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'Products');
