-- ============================================================================
-- MatthOrg Phase 0.2A: Supabase RLS, SECURITY DEFINER RPC & Storage Remediation
-- Additive, idempotent hardening migration. Preserves all production data and
-- builds upon Phase 0.1 containment (public.platform_admins / is_platform_admin).
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: PLATFORM ADMIN & BUSINESS ACCESS AUTHORIZATION HELPERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.platform_admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    granted_by TEXT DEFAULT 'supabase_sql',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.platform_admins FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.platform_admins TO authenticated;

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'platform_admins'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.platform_admins', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "Users can read own platform admin status"
    ON public.platform_admins
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_platform_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT CASE
        WHEN check_user_id IS NULL THEN FALSE
        ELSE EXISTS (
            SELECT 1
            FROM public.platform_admins pa
            WHERE pa.user_id = check_user_id
              AND pa.is_active = true
        )
    END;
$$;

REVOKE ALL ON FUNCTION public.is_platform_admin(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(UUID) TO authenticated, service_role;

-- Hardened tenant membership helper: verifies only true business owners & members
-- (Admin cross-tenant access is granted explicitly in table RLS policies, not conflated with ownership.)
CREATE OR REPLACE FUNCTION public.user_has_business_access(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_uid UUID := auth.uid();
BEGIN
    IF p_business_id IS NULL OR v_uid IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.businesses b
        WHERE b.id = p_business_id
          AND b.owner_user_id = v_uid
    ) OR EXISTS (
        SELECT 1
        FROM public.business_members bm
        WHERE bm.business_id = p_business_id
          AND bm.user_id = v_uid
    );
END;
$$;

REVOKE ALL ON FUNCTION public.user_has_business_access(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_has_business_access(UUID) TO authenticated, service_role;

-- ============================================================================
-- SECTION 2: CORE CRM TABLES (businesses, business_members, customers, products)
-- Ensures explicit RLS, anon revocation, anti-hijack membership rules, and admin override.
-- ============================================================================

-- 2A. public.businesses
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.businesses FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'businesses'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.businesses', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "authenticated_select_own_businesses"
    ON public.businesses
    FOR SELECT
    TO authenticated
    USING (
        owner_user_id = auth.uid()
        OR public.user_has_business_access(id)
        OR public.is_platform_admin(auth.uid())
    );

CREATE POLICY "authenticated_insert_own_businesses"
    ON public.businesses
    FOR INSERT
    TO authenticated
    WITH CHECK (
        owner_user_id = auth.uid()
        OR public.is_platform_admin(auth.uid())
    );

CREATE POLICY "authenticated_update_own_businesses"
    ON public.businesses
    FOR UPDATE
    TO authenticated
    USING (
        owner_user_id = auth.uid()
        OR public.user_has_business_access(id)
        OR public.is_platform_admin(auth.uid())
    )
    WITH CHECK (
        owner_user_id = auth.uid()
        OR public.user_has_business_access(id)
        OR public.is_platform_admin(auth.uid())
    );

CREATE POLICY "authenticated_delete_own_businesses"
    ON public.businesses
    FOR DELETE
    TO authenticated
    USING (
        owner_user_id = auth.uid()
        OR public.is_platform_admin(auth.uid())
    );

-- Strengthen business trust & subscription protection on BOTH INSERT and UPDATE
CREATE OR REPLACE FUNCTION public.protect_business_trust_flags()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role TEXT := COALESCE(current_setting('role', true), '');
BEGIN
    -- Allow trusted system/admin bypass paths
    IF current_setting('app.allow_trust_modification', true) = 'on'
       OR v_role = 'service_role'
       OR public.is_platform_admin(auth.uid()) THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        -- Block non-admin clients from seeding paid subscriptions or verification badges on insert
        IF COALESCE(NEW.phone_verified, false) = true OR
           COALESCE(NEW.email_verified, false) = true OR
           COALESCE(NEW.identity_verified, false) = true OR
           COALESCE(NEW.business_verified, false) = true OR
           COALESCE(NEW.service_verified, false) = true OR
           LOWER(COALESCE(NEW.subscription_plan, 'free')) <> 'free' OR
           LOWER(COALESCE(NEW.subscription_status, 'active')) NOT IN ('active', 'inactive') OR
           NEW.subscription_expires_at IS NOT NULL OR
           NEW.subscription_current_period_end IS NOT NULL THEN
            RAISE EXCEPTION 'Unauthorized: New businesses cannot self-assign verification badges or paid subscriptions.'
                USING ERRCODE = '42501';
        END IF;

        NEW.subscription_plan := 'free';
        NEW.phone_verified := false;
        NEW.email_verified := false;
        NEW.identity_verified := false;
        NEW.business_verified := false;
        NEW.service_verified := false;
        RETURN NEW;
    END IF;

    -- TG_OP = 'UPDATE': prevent modifying verification badges, subscription state, or hijacking ownership
    IF NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id AND OLD.owner_user_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: Only the primary business owner or a platform admin can transfer business ownership.'
            USING ERRCODE = '42501';
    END IF;

    IF (NEW.phone_verified IS DISTINCT FROM OLD.phone_verified) OR
       (NEW.email_verified IS DISTINCT FROM OLD.email_verified) OR
       (NEW.identity_verified IS DISTINCT FROM OLD.identity_verified) OR
       (NEW.business_verified IS DISTINCT FROM OLD.business_verified) OR
       (NEW.service_verified IS DISTINCT FROM OLD.service_verified) OR
       (NEW.subscription_plan IS DISTINCT FROM OLD.subscription_plan) OR
       (NEW.subscription_status IS DISTINCT FROM OLD.subscription_status) OR
       (NEW.subscription_expires_at IS DISTINCT FROM OLD.subscription_expires_at) OR
       (NEW.subscription_current_period_end IS DISTINCT FROM OLD.subscription_current_period_end) THEN
        RAISE EXCEPTION 'Unauthorized: Verification badges and subscription authority cannot be modified directly by business users.'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_business_trust_flags() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_protect_business_trust_flags ON public.businesses;
CREATE TRIGGER trg_protect_business_trust_flags
    BEFORE INSERT OR UPDATE ON public.businesses
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_business_trust_flags();

-- 2B. public.business_members
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.business_members FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_members TO authenticated;

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'business_members'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.business_members', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "authenticated_select_business_members"
    ON public.business_members
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR public.user_has_business_access(business_id)
        OR public.is_platform_admin(auth.uid())
    );

-- Only the primary business owner or a platform admin may insert memberships (blocks cross-tenant self-join)
CREATE POLICY "owner_or_admin_insert_business_members"
    ON public.business_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_platform_admin(auth.uid())
        OR EXISTS (
            SELECT 1
            FROM public.businesses b
            WHERE b.id = business_members.business_id
              AND b.owner_user_id = auth.uid()
        )
    );

CREATE POLICY "owner_or_admin_update_business_members"
    ON public.business_members
    FOR UPDATE
    TO authenticated
    USING (
        public.is_platform_admin(auth.uid())
        OR EXISTS (
            SELECT 1
            FROM public.businesses b
            WHERE b.id = business_members.business_id
              AND b.owner_user_id = auth.uid()
        )
    )
    WITH CHECK (
        public.is_platform_admin(auth.uid())
        OR EXISTS (
            SELECT 1
            FROM public.businesses b
            WHERE b.id = business_members.business_id
              AND b.owner_user_id = auth.uid()
        )
    );

CREATE POLICY "owner_or_self_delete_business_members"
    ON public.business_members
    FOR DELETE
    TO authenticated
    USING (
        user_id = auth.uid()
        OR public.is_platform_admin(auth.uid())
        OR EXISTS (
            SELECT 1
            FROM public.businesses b
            WHERE b.id = business_members.business_id
              AND b.owner_user_id = auth.uid()
        )
    );

-- 2C. public.customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.customers FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'customers'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.customers', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "tenant_or_admin_select_customers"
    ON public.customers
    FOR SELECT
    TO authenticated
    USING (public.user_has_business_access(business_id) OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_or_admin_insert_customers"
    ON public.customers
    FOR INSERT
    TO authenticated
    WITH CHECK (public.user_has_business_access(business_id) OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_or_admin_update_customers"
    ON public.customers
    FOR UPDATE
    TO authenticated
    USING (public.user_has_business_access(business_id) OR public.is_platform_admin(auth.uid()))
    WITH CHECK (public.user_has_business_access(business_id) OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_or_admin_delete_customers"
    ON public.customers
    FOR DELETE
    TO authenticated
    USING (public.user_has_business_access(business_id) OR public.is_platform_admin(auth.uid()));

-- 2D. public.products (Business private SKU/quotation catalog; marketplace public items live in product_offers)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.products FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'products'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.products', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "tenant_or_admin_select_products"
    ON public.products
    FOR SELECT
    TO authenticated
    USING (public.user_has_business_access(business_id) OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_or_admin_insert_products"
    ON public.products
    FOR INSERT
    TO authenticated
    WITH CHECK (public.user_has_business_access(business_id) OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_or_admin_update_products"
    ON public.products
    FOR UPDATE
    TO authenticated
    USING (public.user_has_business_access(business_id) OR public.is_platform_admin(auth.uid()))
    WITH CHECK (public.user_has_business_access(business_id) OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_or_admin_delete_products"
    ON public.products
    FOR DELETE
    TO authenticated
    USING (public.user_has_business_access(business_id) OR public.is_platform_admin(auth.uid()));

-- ============================================================================
-- SECTION 3: RECONCILE CRM, COUNTER, LEAD & CUSTOMER REQUEST POLICIES
-- Revoke PUBLIC inheritance + add explicit platform_admin support + tighten INSERTs
-- ============================================================================

REVOKE ALL ON public.quotes FROM PUBLIC, anon;
REVOKE ALL ON public.quote_items FROM PUBLIC, anon;
REVOKE ALL ON public.document_counters FROM PUBLIC, anon;
REVOKE ALL ON public.invoices FROM PUBLIC, anon;
REVOKE ALL ON public.invoice_items FROM PUBLIC, anon;
REVOKE ALL ON public.payments FROM PUBLIC, anon;
REVOKE ALL ON public.leads FROM PUBLIC, anon;

DROP POLICY IF EXISTS "admin_manage_quotes" ON public.quotes;
CREATE POLICY "admin_manage_quotes" ON public.quotes FOR ALL TO authenticated
    USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "admin_manage_quote_items" ON public.quote_items;
CREATE POLICY "admin_manage_quote_items" ON public.quote_items FOR ALL TO authenticated
    USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "admin_manage_document_counters" ON public.document_counters;
CREATE POLICY "admin_manage_document_counters" ON public.document_counters FOR ALL TO authenticated
    USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "admin_manage_invoices" ON public.invoices;
CREATE POLICY "admin_manage_invoices" ON public.invoices FOR ALL TO authenticated
    USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "admin_manage_invoice_items" ON public.invoice_items;
CREATE POLICY "admin_manage_invoice_items" ON public.invoice_items FOR ALL TO authenticated
    USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "admin_manage_payments" ON public.payments;
CREATE POLICY "admin_manage_payments" ON public.payments FOR ALL TO authenticated
    USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "admin_manage_leads" ON public.leads;
CREATE POLICY "admin_manage_leads" ON public.leads FOR ALL TO authenticated
    USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

-- Fix search_path on maintain_lead_lifecycle_timestamps trigger function
CREATE OR REPLACE FUNCTION public.maintain_lead_lifecycle_timestamps()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at := now();

    IF NEW.status = 'Won' THEN
        IF OLD IS NULL OR OLD.status IS DISTINCT FROM 'Won' THEN
            NEW.won_at := now();
        END IF;
        NEW.lost_at := NULL;
    ELSIF NEW.status = 'Lost' THEN
        IF OLD IS NULL OR OLD.status IS DISTINCT FROM 'Lost' THEN
            NEW.lost_at := now();
        END IF;
        NEW.won_at := NULL;
    ELSE
        IF OLD IS NOT NULL AND OLD.status = 'Won' THEN
            NEW.won_at := NULL;
        END IF;
        IF OLD IS NOT NULL AND OLD.status = 'Lost' THEN
            NEW.lost_at := NULL;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Tighten public.customer_requests: prevent anon/client forging claimed IDs or Closed status,
-- deny non-admin UPDATE/DELETE, deny anon SELECT, preserve claimed-business + admin read.
ALTER TABLE public.customer_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.customer_requests FROM PUBLIC, anon, authenticated;
GRANT INSERT ON public.customer_requests TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.customer_requests TO authenticated;

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'customer_requests'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.customer_requests', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "anyone_can_insert_open_customer_requests"
    ON public.customer_requests
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        status = 'Open'
        AND (contacted_by_business_ids IS NULL OR cardinality(contacted_by_business_ids) = 0)
    );

CREATE POLICY "claimed_business_or_admin_select_customer_requests"
    ON public.customer_requests
    FOR SELECT
    TO authenticated
    USING (
        public.is_platform_admin(auth.uid())
        OR EXISTS (
            SELECT 1
            FROM public.businesses b
            WHERE public.user_has_business_access(b.id)
              AND b.id = ANY(contacted_by_business_ids)
        )
    );

CREATE POLICY "admin_update_customer_requests"
    ON public.customer_requests
    FOR UPDATE
    TO authenticated
    USING (public.is_platform_admin(auth.uid()))
    WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "admin_delete_customer_requests"
    ON public.customer_requests
    FOR DELETE
    TO authenticated
    USING (public.is_platform_admin(auth.uid()));

-- ============================================================================
-- SECTION 4: HARDEN ALL SECURITY DEFINER RPCS (CALLER AUTHZ + REVOKE PUBLIC)
-- ============================================================================

-- 4A. admin_verify_business: MUST verify caller is service_role or platform_admin!
CREATE OR REPLACE FUNCTION public.admin_verify_business(
    p_business_id UUID,
    p_phone_verified BOOLEAN DEFAULT NULL,
    p_email_verified BOOLEAN DEFAULT NULL,
    p_identity_verified BOOLEAN DEFAULT NULL,
    p_business_verified BOOLEAN DEFAULT NULL,
    p_service_verified BOOLEAN DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role TEXT := COALESCE(current_setting('role', true), '');
    v_updated public.businesses;
BEGIN
    IF v_role <> 'service_role' AND NOT public.is_platform_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Forbidden: Only verified platform administrators may verify businesses.'
            USING ERRCODE = '42501';
    END IF;

    PERFORM set_config('app.allow_trust_modification', 'on', true);

    UPDATE public.businesses
    SET
        phone_verified = COALESCE(p_phone_verified, phone_verified),
        email_verified = COALESCE(p_email_verified, email_verified),
        identity_verified = COALESCE(p_identity_verified, identity_verified),
        business_verified = COALESCE(p_business_verified, business_verified),
        service_verified = COALESCE(p_service_verified, service_verified),
        updated_at = now()
    WHERE id = p_business_id
    RETURNING * INTO v_updated;

    PERFORM set_config('app.allow_trust_modification', 'off', true);

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Business % not found', p_business_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'business_id', v_updated.id,
        'phone_verified', v_updated.phone_verified,
        'email_verified', v_updated.email_verified,
        'identity_verified', v_updated.identity_verified,
        'business_verified', v_updated.business_verified,
        'service_verified', v_updated.service_verified
    );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_verify_business(UUID, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_verify_business(UUID, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN) TO authenticated, service_role;

-- 4B. authoritative_update_business_subscription: Strictly server-side (service_role) or verified platform admin
CREATE OR REPLACE FUNCTION public.authoritative_update_business_subscription(
    p_business_id UUID,
    p_plan TEXT,
    p_status TEXT DEFAULT 'active',
    p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role TEXT := COALESCE(current_setting('role', true), '');
    v_clean_plan TEXT := LOWER(COALESCE(p_plan, 'free'));
    v_clean_status TEXT := LOWER(COALESCE(p_status, 'active'));
    v_updated public.businesses;
BEGIN
    IF v_role <> 'service_role' AND NOT public.is_platform_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Forbidden: Authoritative subscription updates require backend service_role or platform admin.'
            USING ERRCODE = '42501';
    END IF;

    IF v_clean_plan NOT IN ('free', 'pro', 'business') THEN
        RAISE EXCEPTION 'Invalid subscription plan: %', p_plan USING ERRCODE = '22023';
    END IF;

    IF v_clean_status NOT IN ('active', 'trialing', 'cancelled', 'expired', 'inactive') THEN
        RAISE EXCEPTION 'Invalid subscription status: %', p_status USING ERRCODE = '22023';
    END IF;

    PERFORM set_config('app.allow_trust_modification', 'on', true);

    UPDATE public.businesses
    SET
        subscription_plan = v_clean_plan,
        subscription_status = v_clean_status,
        subscription_expires_at = p_expires_at,
        subscription_current_period_end = p_expires_at,
        updated_at = now()
    WHERE id = p_business_id
    RETURNING * INTO v_updated;

    PERFORM set_config('app.allow_trust_modification', 'off', true);

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Business % not found', p_business_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'business_id', v_updated.id,
        'subscription_plan', v_updated.subscription_plan,
        'subscription_status', v_updated.subscription_status,
        'subscription_expires_at', v_updated.subscription_expires_at
    );
END;
$$;

REVOKE ALL ON FUNCTION public.authoritative_update_business_subscription(UUID, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.authoritative_update_business_subscription(UUID, TEXT, TEXT, TIMESTAMPTZ) TO service_role;

-- 4C. Revoke PUBLIC & anon execute on all remaining SECURITY DEFINER RPCs
REVOKE ALL ON FUNCTION public.has_active_subscription(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_next_quote_number(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_next_quote_number(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.create_quote_atomic(UUID, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_quote_atomic(UUID, JSONB) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_next_invoice_number(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_next_invoice_number(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.create_invoice_atomic(UUID, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_invoice_atomic(UUID, JSONB) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.convert_quote_to_invoice_atomic(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.convert_quote_to_invoice_atomic(UUID, UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_matching_customer_requests(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_matching_customer_requests(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.claim_customer_request_atomic(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_customer_request_atomic(UUID, UUID) TO authenticated, service_role;

-- ============================================================================
-- SECTION 5: STORAGE BUCKET & OBJECT POLICY REMEDIATION (Products BUCKET)
-- Drops leftover 20261118 `TO public` write policies whose names differed from 20261121.
-- ============================================================================

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

-- Drop BOTH legacy 20261118 and 20261121 policy names idempotently
DROP POLICY IF EXISTS "Upload access for Products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Update access for Products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Delete access for Products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public upload access for Products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public update access for Products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public delete access for Products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for Products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated user upload access for Products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated owner update access for Products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated owner delete access for Products bucket" ON storage.objects;

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

-- ============================================================================
-- SECTION 6: AI GROWTH ENGINE TABLES (REMEDIATE 8 ZERO-POLICY TABLES)
-- ============================================================================

ALTER TABLE public.growth_searches ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE public.growth_discovered_businesses ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE public.growth_lead_research ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE public.growth_lead_scores ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE public.growth_enriched_contacts ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE public.growth_outreach_messages ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE public.growth_pipeline_activities ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE public.growth_suppressions ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

REVOKE ALL ON public.growth_searches FROM PUBLIC, anon;
REVOKE ALL ON public.growth_discovered_businesses FROM PUBLIC, anon;
REVOKE ALL ON public.growth_lead_research FROM PUBLIC, anon;
REVOKE ALL ON public.growth_lead_scores FROM PUBLIC, anon;
REVOKE ALL ON public.growth_enriched_contacts FROM PUBLIC, anon;
REVOKE ALL ON public.growth_outreach_messages FROM PUBLIC, anon;
REVOKE ALL ON public.growth_pipeline_activities FROM PUBLIC, anon;
REVOKE ALL ON public.growth_suppressions FROM PUBLIC, anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.growth_searches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.growth_discovered_businesses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.growth_lead_research TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.growth_lead_scores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.growth_enriched_contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.growth_outreach_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.growth_pipeline_activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.growth_suppressions TO authenticated;

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN (
              'growth_searches',
              'growth_discovered_businesses',
              'growth_lead_research',
              'growth_lead_scores',
              'growth_enriched_contacts',
              'growth_outreach_messages',
              'growth_pipeline_activities',
              'growth_suppressions'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

CREATE POLICY "owner_or_business_manage_growth_searches"
    ON public.growth_searches FOR ALL TO authenticated
    USING (
        public.is_platform_admin(auth.uid())
        OR owner_user_id = auth.uid()
        OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
    )
    WITH CHECK (
        public.is_platform_admin(auth.uid())
        OR (
            (owner_user_id IS NULL OR owner_user_id = auth.uid())
            AND (business_id IS NULL OR public.user_has_business_access(business_id))
        )
    );

CREATE POLICY "owner_or_business_manage_growth_leads"
    ON public.growth_discovered_businesses FOR ALL TO authenticated
    USING (
        public.is_platform_admin(auth.uid())
        OR owner_user_id = auth.uid()
        OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
    )
    WITH CHECK (
        public.is_platform_admin(auth.uid())
        OR (
            (owner_user_id IS NULL OR owner_user_id = auth.uid())
            AND (business_id IS NULL OR public.user_has_business_access(business_id))
        )
    );

CREATE POLICY "owner_or_business_manage_growth_research"
    ON public.growth_lead_research FOR ALL TO authenticated
    USING (
        public.is_platform_admin(auth.uid())
        OR owner_user_id = auth.uid()
        OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
    )
    WITH CHECK (
        public.is_platform_admin(auth.uid())
        OR (
            (owner_user_id IS NULL OR owner_user_id = auth.uid())
            AND (business_id IS NULL OR public.user_has_business_access(business_id))
            AND EXISTS (
                SELECT 1 FROM public.growth_discovered_businesses gl
                WHERE gl.id = growth_lead_research.lead_id
                  AND (gl.owner_user_id = auth.uid() OR (gl.business_id IS NOT NULL AND public.user_has_business_access(gl.business_id)))
            )
        )
    );

CREATE POLICY "owner_or_business_manage_growth_scores"
    ON public.growth_lead_scores FOR ALL TO authenticated
    USING (
        public.is_platform_admin(auth.uid())
        OR owner_user_id = auth.uid()
        OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
    )
    WITH CHECK (
        public.is_platform_admin(auth.uid())
        OR (
            (owner_user_id IS NULL OR owner_user_id = auth.uid())
            AND (business_id IS NULL OR public.user_has_business_access(business_id))
            AND EXISTS (
                SELECT 1 FROM public.growth_discovered_businesses gl
                WHERE gl.id = growth_lead_scores.lead_id
                  AND (gl.owner_user_id = auth.uid() OR (gl.business_id IS NOT NULL AND public.user_has_business_access(gl.business_id)))
            )
        )
    );

CREATE POLICY "owner_or_business_manage_growth_contacts"
    ON public.growth_enriched_contacts FOR ALL TO authenticated
    USING (
        public.is_platform_admin(auth.uid())
        OR owner_user_id = auth.uid()
        OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
    )
    WITH CHECK (
        public.is_platform_admin(auth.uid())
        OR (
            (owner_user_id IS NULL OR owner_user_id = auth.uid())
            AND (business_id IS NULL OR public.user_has_business_access(business_id))
            AND EXISTS (
                SELECT 1 FROM public.growth_discovered_businesses gl
                WHERE gl.id = growth_enriched_contacts.lead_id
                  AND (gl.owner_user_id = auth.uid() OR (gl.business_id IS NOT NULL AND public.user_has_business_access(gl.business_id)))
            )
        )
    );

CREATE POLICY "owner_or_business_manage_growth_outreach"
    ON public.growth_outreach_messages FOR ALL TO authenticated
    USING (
        public.is_platform_admin(auth.uid())
        OR owner_user_id = auth.uid()
        OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
    )
    WITH CHECK (
        public.is_platform_admin(auth.uid())
        OR (
            (owner_user_id IS NULL OR owner_user_id = auth.uid())
            AND (business_id IS NULL OR public.user_has_business_access(business_id))
            AND EXISTS (
                SELECT 1 FROM public.growth_discovered_businesses gl
                WHERE gl.id = growth_outreach_messages.lead_id
                  AND (gl.owner_user_id = auth.uid() OR (gl.business_id IS NOT NULL AND public.user_has_business_access(gl.business_id)))
            )
        )
    );

CREATE POLICY "owner_or_business_manage_growth_activities"
    ON public.growth_pipeline_activities FOR ALL TO authenticated
    USING (
        public.is_platform_admin(auth.uid())
        OR owner_user_id = auth.uid()
        OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
    )
    WITH CHECK (
        public.is_platform_admin(auth.uid())
        OR (
            (owner_user_id IS NULL OR owner_user_id = auth.uid())
            AND (business_id IS NULL OR public.user_has_business_access(business_id))
            AND EXISTS (
                SELECT 1 FROM public.growth_discovered_businesses gl
                WHERE gl.id = growth_pipeline_activities.lead_id
                  AND (gl.owner_user_id = auth.uid() OR (gl.business_id IS NOT NULL AND public.user_has_business_access(gl.business_id)))
            )
        )
    );

CREATE POLICY "owner_or_business_manage_growth_suppressions"
    ON public.growth_suppressions FOR ALL TO authenticated
    USING (
        public.is_platform_admin(auth.uid())
        OR owner_user_id = auth.uid()
        OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
    )
    WITH CHECK (
        public.is_platform_admin(auth.uid())
        OR (
            (owner_user_id IS NULL OR owner_user_id = auth.uid())
            AND (business_id IS NULL OR public.user_has_business_access(business_id))
        )
    );

-- ============================================================================
-- SECTION 7: UNIVERSAL MARKETPLACE, DATA HUB & FULFILMENT TABLES (20261114)
-- Adds missing grants, moderation locks, admin overrides & fills all 13 policy gaps.
-- ============================================================================

-- 7A. Least-privilege table grants across all 21 marketplace/hub tables
REVOKE ALL ON public.directory_businesses FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.business_contacts FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.business_locations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.service_categories FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.services FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.canonical_products FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.product_offers FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.product_variants FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.product_attributes FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.product_media FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.product_inventory FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.product_sources FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.data_sources FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.data_import_jobs FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.data_import_records FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.search_synonyms FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.fulfilment_requests FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.fulfilment_matches FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.conversations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.conversation_messages FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.customer_enquiries FROM PUBLIC, anon, authenticated;

-- Publicly browsable catalog/directory tables (SELECT only for anon; CRUD for authenticated controlled by RLS)
GRANT SELECT ON public.directory_businesses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.directory_businesses TO authenticated;

GRANT SELECT ON public.business_locations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_locations TO authenticated;

GRANT SELECT ON public.service_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_categories TO authenticated;

GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;

GRANT SELECT ON public.canonical_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.canonical_products TO authenticated;

GRANT SELECT ON public.product_offers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_offers TO authenticated;

GRANT SELECT ON public.product_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;

GRANT SELECT ON public.product_attributes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_attributes TO authenticated;

GRANT SELECT ON public.product_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_media TO authenticated;

GRANT SELECT ON public.product_inventory TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_inventory TO authenticated;

GRANT SELECT ON public.product_sources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_sources TO authenticated;

GRANT SELECT ON public.search_synonyms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.search_synonyms TO authenticated;

-- Private / sensitive PII tables (anon has ZERO SELECT, or INSERT-only for public enquiries/fulfilment)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.data_sources TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.data_import_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.data_import_records TO authenticated;
GRANT INSERT ON public.fulfilment_requests TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.fulfilment_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fulfilment_matches TO authenticated;

ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid();
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_messages TO authenticated;

GRANT INSERT ON public.customer_enquiries TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.customer_enquiries TO authenticated;

-- Reset policies on all 21 tables cleanly
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN (
              'directory_businesses',
              'business_contacts',
              'business_locations',
              'service_categories',
              'services',
              'canonical_products',
              'product_offers',
              'product_variants',
              'product_attributes',
              'product_media',
              'product_inventory',
              'product_sources',
              'data_sources',
              'data_import_jobs',
              'data_import_records',
              'search_synonyms',
              'fulfilment_requests',
              'fulfilment_matches',
              'conversations',
              'conversation_messages',
              'customer_enquiries'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 7B. directory_businesses + moderation protection trigger
CREATE OR REPLACE FUNCTION public.protect_directory_moderation_flags()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role TEXT := COALESCE(current_setting('role', true), '');
BEGIN
    IF v_role = 'service_role' OR public.is_platform_admin(auth.uid()) THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        IF COALESCE(NEW.is_verified, false) = true THEN
            RAISE EXCEPTION 'Unauthorized: Only platform administrators may verify directory listings.'
                USING ERRCODE = '42501';
        END IF;
        IF NEW.approval_status = 'Approved' THEN
            NEW.approval_status := 'Needs Review';
        END IF;
        RETURN NEW;
    END IF;

    IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
        RAISE EXCEPTION 'Unauthorized: Only platform administrators may modify listing verification.'
            USING ERRCODE = '42501';
    END IF;

    IF NEW.approval_status IS DISTINCT FROM OLD.approval_status AND NEW.approval_status = 'Approved' THEN
        RAISE EXCEPTION 'Unauthorized: Only platform administrators may approve directory listings.'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_directory_moderation_flags() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_protect_directory_moderation_flags ON public.directory_businesses;
CREATE TRIGGER trg_protect_directory_moderation_flags
    BEFORE INSERT OR UPDATE ON public.directory_businesses
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_directory_moderation_flags();

CREATE POLICY "public_read_approved_directory_businesses"
    ON public.directory_businesses FOR SELECT TO anon, authenticated
    USING (approval_status = 'Approved');

CREATE POLICY "tenant_manage_own_directory_businesses"
    ON public.directory_businesses FOR ALL TO authenticated
    USING (
        owner_user_id = auth.uid()
        OR (linked_business_id IS NOT NULL AND public.user_has_business_access(linked_business_id))
        OR public.is_platform_admin(auth.uid())
    )
    WITH CHECK (
        public.is_platform_admin(auth.uid())
        OR owner_user_id = auth.uid()
        OR (linked_business_id IS NOT NULL AND public.user_has_business_access(linked_business_id))
    );

-- 7C. business_contacts (Direct contact records: private to owner/business/admin, NOT anon!)
CREATE POLICY "tenant_or_admin_manage_business_contacts"
    ON public.business_contacts FOR ALL TO authenticated
    USING (
        public.is_platform_admin(auth.uid())
        OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
        OR EXISTS (
            SELECT 1 FROM public.directory_businesses db
            WHERE db.id = business_contacts.directory_business_id
              AND (db.owner_user_id = auth.uid() OR (db.linked_business_id IS NOT NULL AND public.user_has_business_access(db.linked_business_id)))
        )
    )
    WITH CHECK (
        public.is_platform_admin(auth.uid())
        OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
        OR EXISTS (
            SELECT 1 FROM public.directory_businesses db
            WHERE db.id = business_contacts.directory_business_id
              AND (db.owner_user_id = auth.uid() OR (db.linked_business_id IS NOT NULL AND public.user_has_business_access(db.linked_business_id)))
        )
    );

-- 7D. business_locations (Public read ONLY if parent directory_business is Approved or business is_public)
CREATE POLICY "public_read_approved_business_locations"
    ON public.business_locations FOR SELECT TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.directory_businesses db
            WHERE db.id = business_locations.directory_business_id
              AND db.approval_status = 'Approved'
        ) OR EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = business_locations.business_id
              AND COALESCE(b.is_public, true) = true
        )
    );

CREATE POLICY "tenant_or_admin_manage_business_locations"
    ON public.business_locations FOR ALL TO authenticated
    USING (
        public.is_platform_admin(auth.uid())
        OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
        OR EXISTS (
            SELECT 1 FROM public.directory_businesses db
            WHERE db.id = business_locations.directory_business_id
              AND (db.owner_user_id = auth.uid() OR (db.linked_business_id IS NOT NULL AND public.user_has_business_access(db.linked_business_id)))
        )
    )
    WITH CHECK (
        public.is_platform_admin(auth.uid())
        OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
        OR EXISTS (
            SELECT 1 FROM public.directory_businesses db
            WHERE db.id = business_locations.directory_business_id
              AND (db.owner_user_id = auth.uid() OR (db.linked_business_id IS NOT NULL AND public.user_has_business_access(db.linked_business_id)))
        )
    );

-- 7E. service_categories & search_synonyms (Public read; admin-only write)
CREATE POLICY "public_read_service_categories"
    ON public.service_categories FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "admin_manage_service_categories"
    ON public.service_categories FOR ALL TO authenticated
    USING (public.is_platform_admin(auth.uid()))
    WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "public_read_synonyms"
    ON public.search_synonyms FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "admin_manage_synonyms"
    ON public.search_synonyms FOR ALL TO authenticated
    USING (public.is_platform_admin(auth.uid()))
    WITH CHECK (public.is_platform_admin(auth.uid()));

-- 7F. services + moderation protection
CREATE OR REPLACE FUNCTION public.protect_service_moderation_flags()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role TEXT := COALESCE(current_setting('role', true), '');
BEGIN
    IF v_role = 'service_role' OR public.is_platform_admin(auth.uid()) THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        IF NEW.approval_status = 'Approved' THEN
            NEW.approval_status := 'Needs Review';
        END IF;
        RETURN NEW;
    END IF;

    IF NEW.approval_status IS DISTINCT FROM OLD.approval_status AND NEW.approval_status = 'Approved' THEN
        RAISE EXCEPTION 'Unauthorized: Only platform administrators may approve service listings.'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_service_moderation_flags() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_protect_service_moderation_flags ON public.services;
CREATE TRIGGER trg_protect_service_moderation_flags
    BEFORE INSERT OR UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_service_moderation_flags();

CREATE POLICY "public_read_approved_services"
    ON public.services FOR SELECT TO anon, authenticated
    USING (approval_status = 'Approved' AND is_active = true);

CREATE POLICY "tenant_or_admin_manage_services"
    ON public.services FOR ALL TO authenticated
    USING (
        public.is_platform_admin(auth.uid())
        OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
        OR EXISTS (
            SELECT 1 FROM public.directory_businesses db
            WHERE db.id = services.directory_business_id
              AND (db.owner_user_id = auth.uid() OR (db.linked_business_id IS NOT NULL AND public.user_has_business_access(db.linked_business_id)))
        )
    )
    WITH CHECK (
        public.is_platform_admin(auth.uid())
        OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
        OR EXISTS (
            SELECT 1 FROM public.directory_businesses db
            WHERE db.id = services.directory_business_id
              AND (db.owner_user_id = auth.uid() OR (db.linked_business_id IS NOT NULL AND public.user_has_business_access(db.linked_business_id)))
        )
    );

-- 7G. canonical_products (Public read only when at least one published approved offer exists)
CREATE POLICY "public_read_canonical_products_with_approved_offers"
    ON public.canonical_products FOR SELECT TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.product_offers po
            WHERE po.canonical_product_id = canonical_products.id
              AND po.approval_status = 'Approved'
              AND po.is_published = true
        )
    );

CREATE POLICY "admin_manage_canonical_products"
    ON public.canonical_products FOR ALL TO authenticated
    USING (public.is_platform_admin(auth.uid()))
    WITH CHECK (public.is_platform_admin(auth.uid()));

-- 7H. product_offers + moderation protection
CREATE OR REPLACE FUNCTION public.protect_product_offer_moderation_flags()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role TEXT := COALESCE(current_setting('role', true), '');
BEGIN
    IF v_role = 'service_role' OR public.is_platform_admin(auth.uid()) THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        IF NEW.listing_type = 'admin_managed' OR NEW.listing_type = 'external_marketplace' THEN
            NEW.listing_type := 'business_owned';
        END IF;
        IF NEW.approval_status = 'Approved' THEN
            NEW.approval_status := 'Needs Review';
        END IF;
        RETURN NEW;
    END IF;

    IF NEW.listing_type IS DISTINCT FROM OLD.listing_type THEN
        RAISE EXCEPTION 'Unauthorized: Cannot alter offer listing_type.'
            USING ERRCODE = '42501';
    END IF;

    IF NEW.approval_status IS DISTINCT FROM OLD.approval_status AND NEW.approval_status = 'Approved' THEN
        RAISE EXCEPTION 'Unauthorized: Only platform administrators may approve marketplace offers.'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_product_offer_moderation_flags() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_protect_product_offer_moderation_flags ON public.product_offers;
CREATE TRIGGER trg_protect_product_offer_moderation_flags
    BEFORE INSERT OR UPDATE ON public.product_offers
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_product_offer_moderation_flags();

CREATE POLICY "public_read_approved_product_offers"
    ON public.product_offers FOR SELECT TO anon, authenticated
    USING (approval_status = 'Approved' AND is_published = true);

CREATE POLICY "tenant_or_admin_manage_product_offers"
    ON public.product_offers FOR ALL TO authenticated
    USING (
        public.is_platform_admin(auth.uid())
        OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
    )
    WITH CHECK (
        public.is_platform_admin(auth.uid())
        OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
    );

-- 7I. Product offer child tables (variants, attributes, media, inventory, sources)
CREATE POLICY "public_read_approved_product_variants"
    ON public.product_variants FOR SELECT TO anon, authenticated
    USING (EXISTS (SELECT 1 FROM public.product_offers po WHERE po.id = product_offer_id AND po.approval_status = 'Approved' AND po.is_published = true));
CREATE POLICY "tenant_or_admin_manage_product_variants"
    ON public.product_variants FOR ALL TO authenticated
    USING (public.is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.product_offers po WHERE po.id = product_offer_id AND po.business_id IS NOT NULL AND public.user_has_business_access(po.business_id)))
    WITH CHECK (public.is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.product_offers po WHERE po.id = product_offer_id AND po.business_id IS NOT NULL AND public.user_has_business_access(po.business_id)));

CREATE POLICY "public_read_approved_product_attributes"
    ON public.product_attributes FOR SELECT TO anon, authenticated
    USING (EXISTS (SELECT 1 FROM public.product_offers po WHERE po.id = product_offer_id AND po.approval_status = 'Approved' AND po.is_published = true));
CREATE POLICY "tenant_or_admin_manage_product_attributes"
    ON public.product_attributes FOR ALL TO authenticated
    USING (public.is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.product_offers po WHERE po.id = product_offer_id AND po.business_id IS NOT NULL AND public.user_has_business_access(po.business_id)))
    WITH CHECK (public.is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.product_offers po WHERE po.id = product_offer_id AND po.business_id IS NOT NULL AND public.user_has_business_access(po.business_id)));

CREATE POLICY "public_read_approved_product_media"
    ON public.product_media FOR SELECT TO anon, authenticated
    USING (EXISTS (SELECT 1 FROM public.product_offers po WHERE po.id = product_offer_id AND po.approval_status = 'Approved' AND po.is_published = true));
CREATE POLICY "tenant_or_admin_manage_product_media"
    ON public.product_media FOR ALL TO authenticated
    USING (public.is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.product_offers po WHERE po.id = product_offer_id AND po.business_id IS NOT NULL AND public.user_has_business_access(po.business_id)))
    WITH CHECK (public.is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.product_offers po WHERE po.id = product_offer_id AND po.business_id IS NOT NULL AND public.user_has_business_access(po.business_id)));

CREATE POLICY "public_read_approved_product_inventory"
    ON public.product_inventory FOR SELECT TO anon, authenticated
    USING (EXISTS (SELECT 1 FROM public.product_offers po WHERE po.id = product_offer_id AND po.approval_status = 'Approved' AND po.is_published = true));
CREATE POLICY "tenant_or_admin_manage_product_inventory"
    ON public.product_inventory FOR ALL TO authenticated
    USING (public.is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.product_offers po WHERE po.id = product_offer_id AND po.business_id IS NOT NULL AND public.user_has_business_access(po.business_id)))
    WITH CHECK (public.is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.product_offers po WHERE po.id = product_offer_id AND po.business_id IS NOT NULL AND public.user_has_business_access(po.business_id)));

CREATE POLICY "public_read_approved_product_sources"
    ON public.product_sources FOR SELECT TO anon, authenticated
    USING (EXISTS (SELECT 1 FROM public.product_offers po WHERE po.id = product_offer_id AND po.approval_status = 'Approved' AND po.is_published = true));
CREATE POLICY "tenant_or_admin_manage_product_sources"
    ON public.product_sources FOR ALL TO authenticated
    USING (public.is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.product_offers po WHERE po.id = product_offer_id AND po.business_id IS NOT NULL AND public.user_has_business_access(po.business_id)))
    WITH CHECK (public.is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.product_offers po WHERE po.id = product_offer_id AND po.business_id IS NOT NULL AND public.user_has_business_access(po.business_id)));

-- 7J. Data Hub Staging & Audit Tables (Admin / Job Creator ONLY)
CREATE POLICY "admin_manage_data_sources"
    ON public.data_sources FOR ALL TO authenticated
    USING (public.is_platform_admin(auth.uid()))
    WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "creator_or_admin_manage_data_import_jobs"
    ON public.data_import_jobs FOR ALL TO authenticated
    USING (created_by = auth.uid() OR public.is_platform_admin(auth.uid()))
    WITH CHECK (created_by = auth.uid() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "creator_or_admin_manage_data_import_records"
    ON public.data_import_records FOR ALL TO authenticated
    USING (
        public.is_platform_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.data_import_jobs j
            WHERE j.id = data_import_records.job_id
              AND j.created_by = auth.uid()
        )
    )
    WITH CHECK (
        public.is_platform_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.data_import_jobs j
            WHERE j.id = data_import_records.job_id
              AND j.created_by = auth.uid()
        )
    );

-- 7K. Fulfilment Pipeline (Buyer PII & Provider Matches: Public INSERT only; Admin-only Read/Manage)
CREATE POLICY "public_insert_new_fulfilment_requests"
    ON public.fulfilment_requests FOR INSERT TO anon, authenticated
    WITH CHECK (
        status = 'New'
        AND converted_lead_id IS NULL
        AND converted_quote_id IS NULL
        AND assigned_admin IS NULL
    );

CREATE POLICY "admin_manage_fulfilment_requests"
    ON public.fulfilment_requests FOR SELECT TO authenticated
    USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "admin_update_fulfilment_requests"
    ON public.fulfilment_requests FOR UPDATE TO authenticated
    USING (public.is_platform_admin(auth.uid()))
    WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "admin_delete_fulfilment_requests"
    ON public.fulfilment_requests FOR DELETE TO authenticated
    USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "admin_manage_fulfilment_matches"
    ON public.fulfilment_matches FOR ALL TO authenticated
    USING (public.is_platform_admin(auth.uid()))
    WITH CHECK (public.is_platform_admin(auth.uid()));

-- 7L. Conversational Sessions & Messages (Owner or Admin ONLY; anon sessions route via server API)
CREATE POLICY "owner_or_admin_manage_conversations"
    ON public.conversations FOR ALL TO authenticated
    USING (owner_user_id = auth.uid() OR public.is_platform_admin(auth.uid()))
    WITH CHECK (owner_user_id = auth.uid() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "owner_or_admin_manage_conversation_messages"
    ON public.conversation_messages FOR ALL TO authenticated
    USING (
        public.is_platform_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_messages.conversation_id
              AND c.owner_user_id = auth.uid()
        )
    )
    WITH CHECK (
        public.is_platform_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_messages.conversation_id
              AND c.owner_user_id = auth.uid()
        )
    );

-- 7M. Customer Enquiries (Buyer PII: Public INSERT allowed, Select/Manage ONLY target business owner or Admin)
CREATE POLICY "public_insert_new_customer_enquiries"
    ON public.customer_enquiries FOR INSERT TO anon, authenticated
    WITH CHECK (status = 'new');

CREATE POLICY "tenant_or_admin_select_enquiries"
    ON public.customer_enquiries FOR SELECT TO authenticated
    USING (
        public.is_platform_admin(auth.uid())
        OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
    );

CREATE POLICY "tenant_or_admin_update_enquiries"
    ON public.customer_enquiries FOR UPDATE TO authenticated
    USING (
        public.is_platform_admin(auth.uid())
        OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
    )
    WITH CHECK (
        public.is_platform_admin(auth.uid())
        OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
    );

CREATE POLICY "admin_delete_enquiries"
    ON public.customer_enquiries FOR DELETE TO authenticated
    USING (public.is_platform_admin(auth.uid()));

-- ============================================================================
-- SECTION 8: SAFE PUBLIC PROFESSIONAL DIRECTORY VIEW RECONCILIATION
-- Never exposes owner_user_id, payment_details, cac_number, tax_rate, or billing fields.
-- Handles schema variance between businesses.name vs businesses.business_name safely.
-- ============================================================================

DO $$
DECLARE
    v_has_biz_name BOOLEAN;
    v_has_logo BOOLEAN;
    v_name_expr TEXT;
    v_logo_expr TEXT;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'business_name'
    ) INTO v_has_biz_name;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'logo'
    ) INTO v_has_logo;

    v_name_expr := CASE WHEN v_has_biz_name THEN 'b.business_name' ELSE 'b.name AS business_name' END;
    v_logo_expr := CASE WHEN v_has_logo THEN 'b.logo' ELSE 'b.logo_url AS logo' END;

    EXECUTE 'DROP VIEW IF EXISTS public.public_professionals';
    EXECUTE format($v$
        CREATE VIEW public.public_professionals AS
        SELECT
            b.id,
            %s,
            b.industry,
            b.specialization,
            b.tagline,
            %s,
            b.phone,
            b.whatsapp,
            b.email,
            b.address,
            b.state,
            b.city,
            b.categories_offered,
            b.locations_served,
            b.is_public,
            b.phone_verified,
            b.email_verified,
            b.identity_verified,
            b.business_verified,
            b.service_verified,
            b.created_at
        FROM public.businesses b
        WHERE COALESCE(b.is_public, true) = true
    $v$, v_name_expr, v_logo_expr);
END $$;

REVOKE ALL ON public.public_professionals FROM PUBLIC;
GRANT SELECT ON public.public_professionals TO anon, authenticated;

COMMIT;
