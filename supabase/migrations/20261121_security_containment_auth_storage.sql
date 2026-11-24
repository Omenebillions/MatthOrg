-- ============================================================================
-- MatthOrg Phase 0.1: Critical Security Containment Migration
-- 1. Server-authoritative platform admin role table (public.platform_admins)
-- 2. Strict owner-scoped write policies on Products storage bucket
-- ============================================================================

-- 1. Platform Administrators Table (no client self-promotion; service_role/SQL-managed only)
CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active boolean NOT NULL DEFAULT true,
  granted_by text DEFAULT 'supabase_sql',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.platform_admins FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.platform_admins TO authenticated;

DROP POLICY IF EXISTS "Users can read own platform admin status" ON public.platform_admins;
CREATE POLICY "Users can read own platform admin status"
ON public.platform_admins
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_platform_admin(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_admins pa
    WHERE pa.user_id = check_user_id
      AND pa.is_active = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_platform_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO authenticated, service_role;

-- 2. Lock down Products storage bucket write permissions (keep public SELECT only)
UPDATE storage.buckets
SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif'
  ]
WHERE id = 'Products';

DROP POLICY IF EXISTS "Public upload access for Products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public update access for Products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public delete access for Products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated user upload access for Products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated owner update access for Products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated owner delete access for Products bucket" ON storage.objects;

DROP POLICY IF EXISTS "Public read access for Products bucket" ON storage.objects;
CREATE POLICY "Public read access for Products bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'Products');

CREATE POLICY "Authenticated user upload access for Products bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Products'
  AND (storage.foldername(name))[1] IN ('products', 'profiles', 'business-logos', 'projects', 'uploads')
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Authenticated owner update access for Products bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'Products'
  AND (
    (owner = auth.uid() AND (storage.foldername(name))[2] = auth.uid()::text)
    OR public.is_platform_admin(auth.uid())
  )
)
WITH CHECK (
  bucket_id = 'Products'
  AND (
    (owner = auth.uid() AND (storage.foldername(name))[2] = auth.uid()::text)
    OR public.is_platform_admin(auth.uid())
  )
);

CREATE POLICY "Authenticated owner delete access for Products bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'Products'
  AND (
    (owner = auth.uid() AND (storage.foldername(name))[2] = auth.uid()::text)
    OR public.is_platform_admin(auth.uid())
  )
);
