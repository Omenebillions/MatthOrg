-- ============================================================================
-- MatthOrg Step 4 (Reviewed & Corrected):
-- Business Directory Visibility, Verification, Subscriptions, Customer Requests,
-- Multi-Tenant Leads, Matching/Claim RPCs & Public Professional Directory View
--
-- IMPORTANT EXECUTION NOTES:
--   - Designed for manual review and execution via Supabase SQL Editor AFTER
--     the Phase 0.2A baseline and administrator foundation:
--       * public.platform_admins (table)
--       * public.is_platform_admin() (0-arg function)
--       * Initial admin UUID: 6ea8dcbb-8c1e-4807-bd88-75c58d1415bb
--   - Transactional, idempotent, and non-destructive to existing data.
--   - Does NOT drop, recreate, or alter public.platform_admins or
--     public.is_platform_admin().
--   - Replaces unsafe patterns from legacy 20260918_step4_* scripts (broken view
--     column names, permissive customer_requests RLS, missing caller checks on
--     SECURITY DEFINER RPCs, wrong lead status CHECK constraint, unguarded trust
--     GUC bypass, and case-sensitive/status-broken matching RPCs).
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 0: PRE-FLIGHT DEPENDENCY VERIFICATION
-- Fail fast with clear diagnostics if core schema dependencies are missing.
-- ============================================================================

DO $$
DECLARE
    v_has_zero_arg_admin BOOLEAN;
    v_has_biz_access BOOLEAN;
BEGIN
    IF to_regclass('public.businesses') IS NULL THEN
        RAISE EXCEPTION 'Pre-check failed: public.businesses does not exist.';
    END IF;
    IF to_regclass('public.business_members') IS NULL THEN
        RAISE EXCEPTION 'Pre-check failed: public.business_members does not exist.';
    END IF;
    IF to_regclass('public.customers') IS NULL THEN
        RAISE EXCEPTION 'Pre-check failed: public.customers does not exist.';
    END IF;
    IF to_regclass('public.quotes') IS NULL THEN
        RAISE EXCEPTION 'Pre-check failed: public.quotes does not exist.';
    END IF;
    IF to_regclass('public.document_counters') IS NULL THEN
        RAISE EXCEPTION 'Pre-check failed: public.document_counters does not exist.';
    END IF;
    IF to_regclass('public.platform_admins') IS NULL THEN
        RAISE EXCEPTION 'Pre-check failed: public.platform_admins does not exist. Deploy the administrator foundation first.';
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = 'is_platform_admin'
          AND p.pronargs = 0
    ) INTO v_has_zero_arg_admin;

    IF NOT v_has_zero_arg_admin THEN
        RAISE EXCEPTION 'Pre-check failed: public.is_platform_admin() (0-arg) does not exist.';
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = 'user_has_business_access'
          AND p.pronargs = 1
    ) INTO v_has_biz_access;

    IF NOT v_has_biz_access THEN
        RAISE EXCEPTION 'Pre-check failed: public.user_has_business_access(UUID) does not exist.';
    END IF;
END $$;

-- ============================================================================
-- SECTION 1: PUBLIC.BUSINESSES DIRECTORY VISIBILITY, VERIFICATION & BILLING
-- ============================================================================

-- Opt-in privacy: new bare workspaces default to is_public = false so private
-- workspaces do not leak into public_professionals unless explicitly published.
-- Existing rows with is_public = true are preserved untouched.
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE public.businesses ALTER COLUMN is_public SET DEFAULT false;

ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT false;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS business_verified BOOLEAN DEFAULT false;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS service_verified BOOLEAN DEFAULT false;

ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ NULL;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ NULL;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ NULL DEFAULT now();

ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS cac_number TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS categories_offered TEXT[] DEFAULT '{}';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS locations_served TEXT[] DEFAULT '{}';

-- Pre-check existing subscription values before enforcing CHECK constraints
DO $$
DECLARE
    v_invalid_plans INTEGER;
    v_invalid_statuses INTEGER;
BEGIN
    SELECT count(*) INTO v_invalid_plans
    FROM public.businesses
    WHERE LOWER(COALESCE(subscription_plan, 'free')) NOT IN ('free', 'pro', 'business');

    IF v_invalid_plans > 0 THEN
        RAISE EXCEPTION 'Pre-check failed: Found % row(s) in public.businesses with invalid subscription_plan.', v_invalid_plans;
    END IF;

    SELECT count(*) INTO v_invalid_statuses
    FROM public.businesses
    WHERE LOWER(COALESCE(subscription_status, 'active')) NOT IN ('active', 'trialing', 'cancelled', 'expired', 'inactive');

    IF v_invalid_statuses > 0 THEN
        RAISE EXCEPTION 'Pre-check failed: Found % row(s) in public.businesses with invalid subscription_status.', v_invalid_statuses;
    END IF;
END $$;

ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS chk_businesses_subscription_plan;
ALTER TABLE public.businesses ADD CONSTRAINT chk_businesses_subscription_plan
    CHECK (LOWER(COALESCE(subscription_plan, 'free')) IN ('free', 'pro', 'business'));

ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS chk_businesses_subscription_status;
ALTER TABLE public.businesses ADD CONSTRAINT chk_businesses_subscription_status
    CHECK (LOWER(COALESCE(subscription_status, 'active')) IN ('active', 'trialing', 'cancelled', 'expired', 'inactive'));

-- Harden trust & subscription trigger:
-- Never allow a custom session GUC (app.allow_trust_modification) alone to authorize
-- trust/billing mutations; require verified service_role, platform admin, or SQL admin session.
CREATE OR REPLACE FUNCTION public.protect_business_trust_flags()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role TEXT := COALESCE(current_setting('role', true), '');
    v_is_privileged BOOLEAN := (
        v_role = 'service_role'
        OR public.is_platform_admin()
        OR session_user IN ('postgres', 'supabase_admin')
    );
BEGIN
    IF v_is_privileged THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
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

-- Authoritative subscription status helper
CREATE OR REPLACE FUNCTION public.has_active_subscription(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role TEXT := COALESCE(current_setting('role', true), '');
    v_plan TEXT;
    v_status TEXT;
    v_expires_at TIMESTAMPTZ;
    v_period_end TIMESTAMPTZ;
    v_has_access BOOLEAN;
BEGIN
    IF p_business_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- 1. Caller must be service_role, platform admin, or a legitimate business owner/member
    v_has_access := (
        v_role = 'service_role'
        OR public.is_platform_admin()
        OR session_user IN ('postgres', 'supabase_admin')
        OR public.user_has_business_access(p_business_id)
    );
    IF NOT v_has_access THEN
        RETURN FALSE;
    END IF;

    -- 2. Read authoritative business subscription state
    SELECT
        LOWER(COALESCE(subscription_plan, 'free')),
        LOWER(COALESCE(subscription_status, 'inactive')),
        subscription_expires_at,
        subscription_current_period_end
    INTO
        v_plan,
        v_status,
        v_expires_at,
        v_period_end
    FROM public.businesses
    WHERE id = p_business_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- 3. Paid plan verification
    IF v_plan NOT IN ('pro', 'business') THEN
        RETURN FALSE;
    END IF;

    -- 4. Active status verification
    IF v_status NOT IN ('active', 'trialing') THEN
        RETURN FALSE;
    END IF;

    -- 5. Expiry checks (expired at or before now() fails closed)
    IF v_expires_at IS NOT NULL AND v_expires_at <= now() THEN
        RETURN FALSE;
    END IF;

    IF v_period_end IS NOT NULL AND v_period_end <= now() THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.has_active_subscription(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(UUID) TO authenticated, service_role;

-- Authoritative business verification RPC (platform admin or service_role only)
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
    IF v_role <> 'service_role'
       AND NOT public.is_platform_admin()
       AND session_user NOT IN ('postgres', 'supabase_admin') THEN
        RAISE EXCEPTION 'Forbidden: Only verified platform administrators may verify businesses.'
            USING ERRCODE = '42501';
    END IF;

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

-- Authoritative subscription update RPC (strictly backend service_role or platform admin)
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
    IF v_role <> 'service_role'
       AND NOT public.is_platform_admin()
       AND session_user NOT IN ('postgres', 'supabase_admin') THEN
        RAISE EXCEPTION 'Forbidden: Authoritative subscription updates require backend service_role or platform admin.'
            USING ERRCODE = '42501';
    END IF;

    IF v_clean_plan NOT IN ('free', 'pro', 'business') THEN
        RAISE EXCEPTION 'Invalid subscription plan: %', p_plan USING ERRCODE = '22023';
    END IF;

    IF v_clean_status NOT IN ('active', 'trialing', 'cancelled', 'expired', 'inactive') THEN
        RAISE EXCEPTION 'Invalid subscription status: %', p_status USING ERRCODE = '22023';
    END IF;

    UPDATE public.businesses
    SET
        subscription_plan = v_clean_plan,
        subscription_status = v_clean_status,
        subscription_expires_at = p_expires_at,
        subscription_current_period_end = p_expires_at,
        subscription_started_at = CASE
            WHEN v_clean_plan IN ('pro', 'business') AND v_clean_status IN ('active', 'trialing')
                THEN COALESCE(subscription_started_at, now())
            ELSE subscription_started_at
        END,
        updated_at = now()
    WHERE id = p_business_id
    RETURNING * INTO v_updated;

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

-- ============================================================================
-- SECTION 2: PUBLIC.CUSTOMER_REQUESTS HARDENING & PRIVACY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.customer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    email TEXT,
    location TEXT NOT NULL,
    state TEXT,
    city TEXT,
    service_required TEXT NOT NULL,
    service_category TEXT NOT NULL DEFAULT 'General Service',
    property_type TEXT,
    budget_min NUMERIC,
    budget_max NUMERIC,
    budget_formatted TEXT,
    timeline TEXT DEFAULT 'flexible',
    details TEXT,
    status TEXT NOT NULL DEFAULT 'Open',
    contacted_by_business_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_requests_service_category ON public.customer_requests(service_category);
CREATE INDEX IF NOT EXISTS idx_customer_requests_status ON public.customer_requests(status);
CREATE INDEX IF NOT EXISTS idx_customer_requests_created_at ON public.customer_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_requests_request_number ON public.customer_requests(request_number);

-- Pre-check existing customer_requests status values before adding CHECK constraint
DO $$
DECLARE
    v_invalid_req_status INTEGER;
BEGIN
    SELECT count(*) INTO v_invalid_req_status
    FROM public.customer_requests
    WHERE status NOT IN ('Open', 'Matched', 'Contacted', 'Converted', 'Closed');

    IF v_invalid_req_status > 0 THEN
        RAISE EXCEPTION 'Pre-check failed: Found % row(s) with invalid status in public.customer_requests.', v_invalid_req_status;
    END IF;
END $$;

ALTER TABLE public.customer_requests DROP CONSTRAINT IF EXISTS chk_customer_requests_status;
ALTER TABLE public.customer_requests ADD CONSTRAINT chk_customer_requests_status
    CHECK (status IN ('Open', 'Matched', 'Contacted', 'Converted', 'Closed'));

-- Validate & normalize public request submissions before RLS checks run
CREATE OR REPLACE FUNCTION public.enforce_customer_request_insert_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role TEXT := COALESCE(current_setting('role', true), '');
    v_is_privileged BOOLEAN := (
        v_role = 'service_role'
        OR public.is_platform_admin()
        OR session_user IN ('postgres', 'supabase_admin')
    );
BEGIN
    NEW.customer_name := left(trim(COALESCE(NEW.customer_name, '')), 160);
    NEW.phone := left(trim(COALESCE(NEW.phone, '')), 40);
    NEW.whatsapp := NULLIF(left(trim(COALESCE(NEW.whatsapp, NEW.phone, '')), 40), '');
    NEW.email := NULLIF(left(trim(COALESCE(NEW.email, '')), 254), '');
    NEW.location := left(trim(COALESCE(NEW.location, '')), 200);
    NEW.state := NULLIF(left(trim(COALESCE(NEW.state, '')), 80), '');
    NEW.city := NULLIF(left(trim(COALESCE(NEW.city, '')), 120), '');
    NEW.service_required := left(trim(COALESCE(NEW.service_required, '')), 240);
    NEW.service_category := COALESCE(NULLIF(left(trim(COALESCE(NEW.service_category, '')), 120), ''), 'General Service');
    NEW.details := NULLIF(left(trim(COALESCE(NEW.details, '')), 2000), '');

    IF NEW.customer_name = '' OR NEW.location = '' OR NEW.service_required = '' THEN
        RAISE EXCEPTION 'Validation failed: customer_name, location, and service_required are required.'
            USING ERRCODE = '22023';
    END IF;

    IF NULLIF(trim(COALESCE(NEW.request_number, '')), '') IS NULL THEN
        NEW.request_number := 'REQ-' || lpad(((floor(random() * 900000) + 100000)::int)::text, 6, '0');
    ELSE
        NEW.request_number := left(trim(NEW.request_number), 64);
    END IF;

    IF NOT v_is_privileged THEN
        IF COALESCE(NEW.status, 'Open') <> 'Open' THEN
            RAISE EXCEPTION 'Unauthorized: Public customer requests must be created with status Open.'
                USING ERRCODE = '42501';
        END IF;
        IF NEW.contacted_by_business_ids IS NOT NULL AND cardinality(NEW.contacted_by_business_ids) > 0 THEN
            RAISE EXCEPTION 'Unauthorized: contacted_by_business_ids cannot be pre-populated on creation.'
                USING ERRCODE = '42501';
        END IF;
        NEW.status := 'Open';
        NEW.contacted_by_business_ids := '{}';
    ELSE
        NEW.status := COALESCE(NULLIF(trim(NEW.status), ''), 'Open');
        NEW.contacted_by_business_ids := COALESCE(NEW.contacted_by_business_ids, '{}');
    END IF;

    NEW.created_at := COALESCE(NEW.created_at, now());
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_customer_requests_insert_guard ON public.customer_requests;
CREATE TRIGGER trg_customer_requests_insert_guard
    BEFORE INSERT ON public.customer_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_customer_request_insert_defaults();

CREATE OR REPLACE FUNCTION public.maintain_customer_request_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_customer_requests_updated_at ON public.customer_requests;
CREATE TRIGGER trg_customer_requests_updated_at
    BEFORE UPDATE ON public.customer_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.maintain_customer_request_updated_at();

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
        AND length(trim(COALESCE(customer_name, ''))) > 0
        AND length(trim(COALESCE(location, ''))) > 0
        AND length(trim(COALESCE(service_required, ''))) > 0
    );

CREATE POLICY "claimed_business_or_admin_select_customer_requests"
    ON public.customer_requests
    FOR SELECT
    TO authenticated
    USING (
        public.is_platform_admin()
        OR EXISTS (
            SELECT 1
            FROM public.businesses b
            WHERE public.user_has_business_access(b.id)
              AND b.id = ANY(COALESCE(contacted_by_business_ids, '{}'))
        )
    );

CREATE POLICY "admin_update_customer_requests"
    ON public.customer_requests
    FOR UPDATE
    TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

CREATE POLICY "admin_delete_customer_requests"
    ON public.customer_requests
    FOR DELETE
    TO authenticated
    USING (public.is_platform_admin());

-- ============================================================================
-- SECTION 3: PUBLIC.LEADS MULTI-TENANT ISOLATION, LIFECYCLE & CONSTRAINTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_request_id UUID REFERENCES public.customer_requests(id) ON DELETE SET NULL,
    lead_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    company TEXT,
    location TEXT,
    service_required TEXT,
    service_category TEXT,
    property_type TEXT,
    budget_min NUMERIC,
    budget_max NUMERIC,
    budget_formatted TEXT,
    estimated_value NUMERIC,
    timeline TEXT,
    source TEXT NOT NULL DEFAULT 'manual',
    source_name TEXT,
    status TEXT NOT NULL DEFAULT 'New',
    intent_score INTEGER DEFAULT 50,
    intent_level TEXT DEFAULT 'Medium',
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    freshness TEXT DEFAULT 'active',
    freshness_label TEXT,
    is_locked BOOLEAN DEFAULT false,
    notes TEXT,
    quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
    won_at TIMESTAMPTZ NULL,
    lost_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_business_lead_number UNIQUE (business_id, lead_number)
);

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS won_at TIMESTAMPTZ NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lost_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_leads_business_id ON public.leads(business_id);
CREATE INDEX IF NOT EXISTS idx_leads_customer_id ON public.leads(customer_id);
CREATE INDEX IF NOT EXISTS idx_leads_customer_request_id ON public.leads(customer_request_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_business_customer_request_unique
    ON public.leads (business_id, customer_request_id)
    WHERE customer_request_id IS NOT NULL;

-- Pre-check lead statuses against ALL valid LeadStatus values in src/types.ts
-- (includes Quote Sent, Quoted, Negotiating, Unresponsive, Not Qualified, plus Proposal Sent legacy)
DO $$
DECLARE
    v_invalid_count INTEGER;
BEGIN
    SELECT count(*) INTO v_invalid_count
    FROM public.leads
    WHERE status NOT IN (
        'New',
        'Contacted',
        'Qualified',
        'Quote Sent',
        'Quoted',
        'Negotiating',
        'Proposal Sent',
        'Won',
        'Lost',
        'Unresponsive',
        'Not Qualified'
    );

    IF v_invalid_count > 0 THEN
        RAISE EXCEPTION 'Pre-check failed: Found % existing row(s) with invalid lead status in public.leads.', v_invalid_count;
    END IF;
END $$;

ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS chk_leads_status;
ALTER TABLE public.leads ADD CONSTRAINT chk_leads_status
    CHECK (status IN (
        'New',
        'Contacted',
        'Qualified',
        'Quote Sent',
        'Quoted',
        'Negotiating',
        'Proposal Sent',
        'Won',
        'Lost',
        'Unresponsive',
        'Not Qualified'
    ));

-- Lead lifecycle timestamps (search_path hardened)
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

DROP TRIGGER IF EXISTS trg_leads_lifecycle_timestamps ON public.leads;
CREATE TRIGGER trg_leads_lifecycle_timestamps
    BEFORE INSERT OR UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.maintain_lead_lifecycle_timestamps();

-- Prevent cross-tenant FK injection (customer_id / quote_id from another business)
-- and prevent mutating business_id or customer_request_id after creation.
CREATE OR REPLACE FUNCTION public.protect_lead_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role TEXT := COALESCE(current_setting('role', true), '');
    v_is_privileged BOOLEAN := (
        v_role = 'service_role'
        OR public.is_platform_admin()
        OR session_user IN ('postgres', 'supabase_admin')
    );
BEGIN
    IF TG_OP = 'UPDATE' AND NOT v_is_privileged THEN
        IF NEW.business_id IS DISTINCT FROM OLD.business_id THEN
            RAISE EXCEPTION 'Unauthorized: Lead business_id is immutable.'
                USING ERRCODE = '42501';
        END IF;
        IF OLD.customer_request_id IS NOT NULL AND NEW.customer_request_id IS DISTINCT FROM OLD.customer_request_id THEN
            RAISE EXCEPTION 'Unauthorized: Lead customer_request_id linkage cannot be altered.'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    IF NEW.customer_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1
            FROM public.customers c
            WHERE c.id = NEW.customer_id
              AND c.business_id = NEW.business_id
        ) THEN
            RAISE EXCEPTION 'Forbidden: customer_id % does not belong to business %.', NEW.customer_id, NEW.business_id
                USING ERRCODE = '42501';
        END IF;
    END IF;

    IF NEW.quote_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1
            FROM public.quotes q
            WHERE q.id = NEW.quote_id
              AND q.business_id = NEW.business_id
        ) THEN
            RAISE EXCEPTION 'Forbidden: quote_id % does not belong to business %.', NEW.quote_id, NEW.business_id
                USING ERRCODE = '42501';
        END IF;
    END IF;

    NEW.intent_score := LEAST(100, GREATEST(0, COALESCE(NEW.intent_score, 50)));
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_lead_integrity() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_protect_lead_integrity ON public.leads;
CREATE TRIGGER trg_protect_lead_integrity
    BEFORE INSERT OR UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_lead_integrity();

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.leads FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'leads'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.leads', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "authenticated_select_leads"
    ON public.leads
    FOR SELECT
    TO authenticated
    USING (public.user_has_business_access(business_id));

CREATE POLICY "authenticated_insert_leads"
    ON public.leads
    FOR INSERT
    TO authenticated
    WITH CHECK (public.user_has_business_access(business_id));

CREATE POLICY "authenticated_update_leads"
    ON public.leads
    FOR UPDATE
    TO authenticated
    USING (public.user_has_business_access(business_id))
    WITH CHECK (public.user_has_business_access(business_id));

CREATE POLICY "authenticated_delete_leads"
    ON public.leads
    FOR DELETE
    TO authenticated
    USING (public.user_has_business_access(business_id));

CREATE POLICY "admin_manage_leads"
    ON public.leads
    FOR ALL
    TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- ============================================================================
-- SECTION 4: MATCHING DISCOVERY & ATOMIC REQUEST CLAIM RPCS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_matching_customer_requests(p_business_id UUID)
RETURNS TABLE (
    id UUID,
    request_number TEXT,
    service_required TEXT,
    service_category TEXT,
    location TEXT,
    state TEXT,
    city TEXT,
    property_type TEXT,
    budget_min NUMERIC,
    budget_max NUMERIC,
    budget_formatted TEXT,
    timeline TEXT,
    details TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    is_claimed BOOLEAN,
    customer_name TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role TEXT := COALESCE(current_setting('role', true), '');
    v_has_access BOOLEAN;
    v_has_sub BOOLEAN;
    v_biz RECORD;
BEGIN
    -- 1. Security: Caller must belong to the business, be platform admin, or service_role
    v_has_access := (
        v_role = 'service_role'
        OR public.is_platform_admin()
        OR session_user IN ('postgres', 'supabase_admin')
        OR public.user_has_business_access(p_business_id)
    );
    IF NOT v_has_access THEN
        RAISE EXCEPTION 'Access denied: caller does not belong to business %', p_business_id
            USING ERRCODE = '42501';
    END IF;

    -- 2. Security: Business must have an active paid subscription
    v_has_sub := public.has_active_subscription(p_business_id);
    IF NOT v_has_sub THEN
        RETURN;
    END IF;

    -- 3. Fetch business matching profile
    SELECT
        categories_offered,
        specialization,
        industry,
        state,
        city,
        locations_served
    INTO v_biz
    FROM public.businesses
    WHERE businesses.id = p_business_id;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- 4. Return active matching requests (Open / Matched / Contacted).
    -- Buyer PII is masked unless this business has claimed the request.
    RETURN QUERY
    SELECT
        cr.id,
        cr.request_number,
        cr.service_required,
        cr.service_category,
        cr.location,
        cr.state,
        cr.city,
        cr.property_type,
        cr.budget_min,
        cr.budget_max,
        cr.budget_formatted,
        cr.timeline,
        cr.details,
        cr.status,
        cr.created_at,
        COALESCE(p_business_id = ANY(COALESCE(cr.contacted_by_business_ids, '{}')), false) AS is_claimed,
        CASE
            WHEN COALESCE(p_business_id = ANY(COALESCE(cr.contacted_by_business_ids, '{}')), false) THEN cr.customer_name
            ELSE 'Verified Buyer'
        END AS customer_name,
        CASE
            WHEN COALESCE(p_business_id = ANY(COALESCE(cr.contacted_by_business_ids, '{}')), false) THEN cr.phone
            ELSE '+234 ••• ••• ••••'
        END AS phone,
        CASE
            WHEN COALESCE(p_business_id = ANY(COALESCE(cr.contacted_by_business_ids, '{}')), false) THEN cr.whatsapp
            ELSE NULL
        END AS whatsapp,
        CASE
            WHEN COALESCE(p_business_id = ANY(COALESCE(cr.contacted_by_business_ids, '{}')), false) THEN cr.email
            ELSE NULL
        END AS email
    FROM public.customer_requests cr
    WHERE cr.status IN ('Open', 'Matched', 'Contacted')
      AND (
          v_biz.categories_offered IS NULL
          OR cardinality(v_biz.categories_offered) = 0
          OR EXISTS (
              SELECT 1
              FROM unnest(v_biz.categories_offered) AS cat
              WHERE NULLIF(trim(cat), '') IS NOT NULL
                AND (
                    cr.service_category ILIKE '%' || trim(cat) || '%'
                    OR trim(cat) ILIKE '%' || cr.service_category || '%'
                    OR cr.service_required ILIKE '%' || trim(cat) || '%'
                )
          )
          OR (NULLIF(trim(COALESCE(v_biz.specialization, '')), '') IS NOT NULL AND (
              cr.service_required ILIKE '%' || trim(v_biz.specialization) || '%'
              OR cr.service_category ILIKE '%' || trim(v_biz.specialization) || '%'
              OR trim(v_biz.specialization) ILIKE '%' || cr.service_category || '%'
          ))
          OR (NULLIF(trim(COALESCE(v_biz.industry, '')), '') IS NOT NULL AND (
              cr.service_category ILIKE '%' || trim(v_biz.industry) || '%'
              OR trim(v_biz.industry) ILIKE '%' || cr.service_category || '%'
          ))
      )
      AND (
          v_biz.locations_served IS NULL
          OR cardinality(v_biz.locations_served) = 0
          OR EXISTS (
              SELECT 1
              FROM unnest(v_biz.locations_served) AS loc
              WHERE NULLIF(trim(loc), '') IS NOT NULL
                AND (
                    LOWER(trim(loc)) IN ('all', 'nationwide', 'nigeria')
                    OR cr.location ILIKE '%' || trim(loc) || '%'
                    OR COALESCE(cr.state, '') ILIKE '%' || trim(loc) || '%'
                    OR COALESCE(cr.city, '') ILIKE '%' || trim(loc) || '%'
                )
          )
          OR (NULLIF(trim(COALESCE(v_biz.state, '')), '') IS NOT NULL AND (
              cr.location ILIKE '%' || trim(v_biz.state) || '%'
              OR COALESCE(cr.state, '') ILIKE '%' || trim(v_biz.state) || '%'
          ))
          OR (NULLIF(trim(COALESCE(v_biz.city, '')), '') IS NOT NULL AND (
              cr.location ILIKE '%' || trim(v_biz.city) || '%'
              OR COALESCE(cr.city, '') ILIKE '%' || trim(v_biz.city) || '%'
          ))
      )
    ORDER BY cr.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_matching_customer_requests(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_matching_customer_requests(UUID) TO authenticated, service_role;

-- Atomic marketplace request claim RPC
CREATE OR REPLACE FUNCTION public.claim_customer_request_atomic(
    p_business_id UUID,
    p_request_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role TEXT := COALESCE(current_setting('role', true), '');
    v_has_access BOOLEAN;
    v_has_sub BOOLEAN;
    v_req RECORD;
    v_existing_lead RECORD;
    v_cust_id UUID;
    v_new_lead_id UUID;
    v_lead_number TEXT;
    v_seq_num BIGINT;
    v_baseline BIGINT;
BEGIN
    -- 1. Verify caller access to business
    v_has_access := (
        v_role = 'service_role'
        OR public.is_platform_admin()
        OR session_user IN ('postgres', 'supabase_admin')
        OR public.user_has_business_access(p_business_id)
    );
    IF NOT v_has_access THEN
        RAISE EXCEPTION 'Unauthorized: User does not belong to business %', p_business_id
            USING ERRCODE = '42501';
    END IF;

    -- 2. Verify active paid subscription at database level
    v_has_sub := public.has_active_subscription(p_business_id);
    IF NOT v_has_sub THEN
        RAISE EXCEPTION 'Active Pro or Business subscription required to unlock marketplace leads'
            USING ERRCODE = '42501';
    END IF;

    -- 3. Pessimistic lock on customer_request first to serialize concurrent claims
    SELECT * INTO v_req
    FROM public.customer_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Customer request % not found', p_request_id;
    END IF;

    -- 4. Idempotent duplicate check for this business + request
    SELECT * INTO v_existing_lead
    FROM public.leads
    WHERE business_id = p_business_id
      AND customer_request_id = p_request_id
    LIMIT 1;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'is_duplicate', true,
            'message', 'Request already claimed by this business',
            'lead_id', v_existing_lead.id,
            'lead_number', v_existing_lead.lead_number
        );
    END IF;

    IF v_req.status IN ('Closed', 'Converted') THEN
        RAISE EXCEPTION 'Customer request % is % and can no longer be unlocked', p_request_id, v_req.status;
    END IF;

    -- 5. Find or create customer record for this business (skip blank phone/email matches)
    SELECT id INTO v_cust_id
    FROM public.customers
    WHERE business_id = p_business_id
      AND (
          (NULLIF(trim(COALESCE(v_req.phone, '')), '') IS NOT NULL AND (phone = v_req.phone OR whatsapp = v_req.phone))
          OR (NULLIF(trim(COALESCE(v_req.email, '')), '') IS NOT NULL AND LOWER(email) = LOWER(v_req.email))
      )
    LIMIT 1;

    IF v_cust_id IS NULL THEN
        INSERT INTO public.customers (
            business_id,
            name,
            phone,
            whatsapp,
            email,
            address,
            notes
        ) VALUES (
            p_business_id,
            v_req.customer_name,
            NULLIF(trim(COALESCE(v_req.phone, '')), ''),
            NULLIF(trim(COALESCE(v_req.whatsapp, v_req.phone, '')), ''),
            NULLIF(trim(COALESCE(v_req.email, '')), ''),
            v_req.location,
            'Converted from Marketplace Customer Request: ' || v_req.request_number
        )
        RETURNING id INTO v_cust_id;
    END IF;

    -- 6. Generate next lead number atomically with historical baseline awareness
    UPDATE public.document_counters
    SET next_val = next_val + 1,
        updated_at = now()
    WHERE business_id = p_business_id
      AND document_type = 'lead'
    RETURNING (next_val - 1) INTO v_seq_num;

    IF NOT FOUND THEN
        SELECT COALESCE(
            MAX(
                CASE
                    WHEN lead_number ~ '^MAT-LED-[0-9]+$'
                    THEN substring(lead_number from '[0-9]+$')::BIGINT
                    ELSE 0
                END
            ),
            0
        ) + 1
        INTO v_baseline
        FROM public.leads
        WHERE business_id = p_business_id;

        INSERT INTO public.document_counters (business_id, document_type, next_val, created_at, updated_at)
        VALUES (p_business_id, 'lead', v_baseline + 1, now(), now())
        ON CONFLICT (business_id, document_type)
        DO UPDATE SET
            next_val = public.document_counters.next_val + 1,
            updated_at = now()
        RETURNING (public.document_counters.next_val - 1) INTO v_seq_num;
    END IF;

    v_lead_number := 'MAT-LED-' || lpad(v_seq_num::text, 6, '0');

    -- 7. Insert the Lead into public.leads
    INSERT INTO public.leads (
        business_id,
        customer_id,
        customer_request_id,
        lead_number,
        customer_name,
        phone,
        whatsapp,
        email,
        location,
        service_required,
        service_category,
        property_type,
        budget_min,
        budget_max,
        budget_formatted,
        estimated_value,
        timeline,
        source,
        source_name,
        status,
        intent_score,
        intent_level,
        is_verified,
        verified_at,
        freshness,
        freshness_label,
        is_locked,
        notes
    ) VALUES (
        p_business_id,
        v_cust_id,
        p_request_id,
        v_lead_number,
        v_req.customer_name,
        NULLIF(trim(COALESCE(v_req.phone, '')), ''),
        NULLIF(trim(COALESCE(v_req.whatsapp, v_req.phone, '')), ''),
        NULLIF(trim(COALESCE(v_req.email, '')), ''),
        v_req.location,
        v_req.service_required,
        v_req.service_category,
        v_req.property_type,
        v_req.budget_min,
        v_req.budget_max,
        v_req.budget_formatted,
        COALESCE(v_req.budget_max, v_req.budget_min, 0),
        v_req.timeline,
        'marketplace',
        'Customer Request Portal',
        'New',
        95,
        'Very High',
        true,
        now(),
        'active',
        'Verified Direct Request',
        false,
        v_req.details
    )
    RETURNING id INTO v_new_lead_id;

    -- 8. Record claim on customer_requests cleanly without hiding from eligible feeds
    UPDATE public.customer_requests
    SET
        contacted_by_business_ids = array_append(
            array_remove(COALESCE(contacted_by_business_ids, '{}'), p_business_id),
            p_business_id
        ),
        status = CASE
            WHEN status IN ('Open', 'Matched') THEN 'Contacted'
            ELSE status
        END,
        updated_at = now()
    WHERE id = p_request_id;

    RETURN jsonb_build_object(
        'success', true,
        'is_duplicate', false,
        'lead_id', v_new_lead_id,
        'lead_number', v_lead_number,
        'customer_id', v_cust_id,
        'customer_name', v_req.customer_name,
        'phone', v_req.phone,
        'whatsapp', COALESCE(v_req.whatsapp, v_req.phone),
        'email', v_req.email
    );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_customer_request_atomic(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_customer_request_atomic(UUID, UUID) TO authenticated, service_role;

-- ============================================================================
-- SECTION 5: PUBLIC PROFESSIONAL DIRECTORY VIEW (EXPLICIT OPT-IN & SAFE COLUMNS)
-- ============================================================================

REVOKE ALL ON public.businesses FROM PUBLIC, anon;

DO $$
DECLARE
    v_has_biz_name BOOLEAN;
    v_has_logo BOOLEAN;
    v_has_whatsapp BOOLEAN;
    v_has_record_status BOOLEAN;
    v_name_expr TEXT;
    v_logo_expr TEXT;
    v_whatsapp_expr TEXT;
    v_status_filter TEXT;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'business_name'
    ) INTO v_has_biz_name;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'logo'
    ) INTO v_has_logo;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'whatsapp'
    ) INTO v_has_whatsapp;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'record_status'
    ) INTO v_has_record_status;

    v_name_expr := CASE WHEN v_has_biz_name THEN 'b.business_name' ELSE 'b.name AS business_name' END;
    v_logo_expr := CASE WHEN v_has_logo THEN 'b.logo' ELSE 'b.logo_url AS logo' END;
    v_whatsapp_expr := CASE WHEN v_has_whatsapp THEN 'b.whatsapp' ELSE 'b.phone AS whatsapp' END;
    v_status_filter := CASE WHEN v_has_record_status THEN ' AND COALESCE(b.record_status, ''Approved'') = ''Approved''' ELSE '' END;

    EXECUTE 'DROP VIEW IF EXISTS public.public_professionals';
    EXECUTE format($v$
        CREATE VIEW public.public_professionals
        WITH (security_barrier = true) AS
        SELECT
            b.id,
            %s,
            b.industry,
            b.specialization,
            b.tagline,
            %s,
            b.phone,
            %s,
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
        WHERE b.is_public = true%s
    $v$, v_name_expr, v_logo_expr, v_whatsapp_expr, v_status_filter);
END $$;

REVOKE ALL ON public.public_professionals FROM PUBLIC;
GRANT SELECT ON public.public_professionals TO anon, authenticated;

COMMIT;
