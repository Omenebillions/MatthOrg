-- ============================================================================
-- MatthOrg Additive Migration:
-- Artisan Phone Signup Support, Immediate Business Listing Persistence,
-- Duplicate Phone Protection & Server-Enforced Referral Attribution
--
-- EXECUTION NOTES:
--   - Designed for manual review and execution in Supabase SQL Editor.
--   - Self-contained with respect to directory, verification & subscription
--     columns on public.businesses (safe whether Step 4
--     `20261124_step4_corrected_hardening.sql` was already executed or not).
--   - Non-destructive, idempotent, and wrapped in BEGIN / COMMIT.
--   - Preserves public.platform_admins and public.is_platform_admin() (0-arg).
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 0: PRE-FLIGHT DEPENDENCY CHECKS
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
    IF to_regclass('public.platform_admins') IS NULL THEN
        RAISE EXCEPTION 'Pre-check failed: public.platform_admins does not exist.';
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

    IF NOT COALESCE(v_has_biz_access, false) THEN
        RAISE EXCEPTION 'Pre-check failed: public.user_has_business_access(UUID) does not exist.';
    END IF;
END $$;

-- ============================================================================
-- SECTION 1: NIGERIAN PHONE NORMALIZATION & LISTING / REFERRAL COLUMNS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.normalize_nigerian_phone(p_raw TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
    v_stripped TEXT;
    v_national TEXT;
BEGIN
    IF p_raw IS NULL THEN
        RETURN NULL;
    END IF;

    v_stripped := regexp_replace(trim(p_raw), '[\s\-().]', '', 'g');
    IF v_stripped = '' OR v_stripped !~ '^\+?\d+$' THEN
        RETURN NULL;
    END IF;

    IF left(v_stripped, 1) = '+' AND left(v_stripped, 4) <> '+234' THEN
        RETURN NULL;
    END IF;

    IF left(v_stripped, 4) = '+234' THEN
        v_national := substr(v_stripped, 5);
    ELSIF left(v_stripped, 3) = '234' AND length(v_stripped) >= 12 THEN
        v_national := substr(v_stripped, 4);
    ELSIF left(v_stripped, 1) = '0' THEN
        v_national := substr(v_stripped, 2);
    ELSE
        v_national := v_stripped;
    END IF;

    IF left(v_national, 1) = '0' AND length(v_national) = 11 THEN
        v_national := substr(v_national, 2);
    END IF;

    -- Standard 10-digit Nigerian GSM numbers (070x, 080x, 081x, 090x, 091x)
    IF length(v_national) = 10
       AND v_national ~ '^(70[1-9]|80[2-9]|81[0-9]|90[1-9]|91[1-9])\d{7}$' THEN
        RETURN '+234' || v_national;
    END IF;

    -- Nigerian office landlines (8 or 9 national digits)
    IF length(v_national) IN (8, 9)
       AND v_national ~ '^(1|2|9|[3-8][0-9])\d{7,8}$' THEN
        RETURN '+234' || v_national;
    END IF;

    RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.normalize_nigerian_phone(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.normalize_nigerian_phone(TEXT) TO anon, authenticated, service_role;

-- Ensure baseline & Step 4 directory/trust/subscription columns exist on public.businesses
-- so this migration runs cleanly even if 20261124_step4_corrected_hardening.sql has not run yet.
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
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
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS cac_number TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS categories_offered TEXT[] DEFAULT '{}';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS locations_served TEXT[] DEFAULT '{}';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Additive columns on public.businesses for universal /business funnel & referrals
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS owner_full_name TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS lga TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS phone_e164 TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS provider_type TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS referred_by_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS referred_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS referred_code_used TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS referred_at TIMESTAMPTZ;

-- Safely backfill normalized phone_e164 and unique referral codes for existing businesses
UPDATE public.businesses
SET
    phone_e164 = COALESCE(phone_e164, public.normalize_nigerian_phone(phone)),
    whatsapp = COALESCE(NULLIF(trim(whatsapp), ''), public.normalize_nigerian_phone(phone), phone),
    referral_code = COALESCE(
        NULLIF(UPPER(trim(referral_code)), ''),
        'MO-' || UPPER(substr(md5(id::text || '-' || COALESCE(owner_user_id::text, '') || '-' || COALESCE(created_at::text, '')), 1, 8))
    )
WHERE phone_e164 IS NULL
   OR referral_code IS NULL
   OR trim(referral_code) = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_referral_code_unique
    ON public.businesses (UPPER(referral_code))
    WHERE referral_code IS NOT NULL AND trim(referral_code) <> '';

CREATE INDEX IF NOT EXISTS idx_businesses_phone_e164
    ON public.businesses (phone_e164)
    WHERE phone_e164 IS NOT NULL;

-- ============================================================================
-- SECTION 2: AUTHORITATIVE REFERRAL ATTRIBUTIONS TABLE & RLS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code TEXT NOT NULL,
    referrer_phone_e164 TEXT,
    referred_phone_e164 TEXT,
    source TEXT NOT NULL DEFAULT 'link',
    status TEXT NOT NULL DEFAULT 'attributed' CHECK (status IN ('attributed', 'verified', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_referrals_no_self_user CHECK (referrer_user_id <> referred_user_id),
    CONSTRAINT chk_referrals_no_self_business CHECK (referrer_business_id <> referred_business_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_business
    ON public.referrals (referrer_business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_user
    ON public.referrals (referrer_user_id, created_at DESC);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.referrals FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;

DROP POLICY IF EXISTS "authenticated_select_own_referrals" ON public.referrals;
CREATE POLICY "authenticated_select_own_referrals"
    ON public.referrals
    FOR SELECT
    TO authenticated
    USING (
        referrer_user_id = auth.uid()
        OR referred_user_id = auth.uid()
        OR public.user_has_business_access(referrer_business_id)
        OR public.user_has_business_access(referred_business_id)
        OR public.is_platform_admin()
    );

-- ============================================================================
-- SECTION 3: TAMPER-PROOF BUSINESS TRIGGERS (TRUST, DUPLICATES & REFERRALS)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.businesses_phone_and_referral_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_norm_phone TEXT;
    v_role TEXT := COALESCE(current_setting('role', true), '');
    v_is_privileged BOOLEAN := (
        v_role = 'service_role'
        OR public.is_platform_admin()
        OR session_user IN ('postgres', 'supabase_admin')
    );
    v_candidate_code TEXT;
BEGIN
    v_norm_phone := public.normalize_nigerian_phone(NEW.phone);
    IF v_norm_phone IS NOT NULL THEN
        NEW.phone := v_norm_phone;
        NEW.phone_e164 := v_norm_phone;
        IF NULLIF(trim(COALESCE(NEW.whatsapp, '')), '') IS NULL THEN
            NEW.whatsapp := v_norm_phone;
        END IF;
    ELSE
        NEW.phone_e164 := NULL;
    END IF;

    -- Prevent cross-account duplicate Nigerian phone listings on new/changed phone values
    IF NEW.phone_e164 IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.phone_e164 IS DISTINCT FROM OLD.phone_e164) THEN
        IF EXISTS (
            SELECT 1
            FROM public.businesses b
            WHERE b.phone_e164 = NEW.phone_e164
              AND b.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
              AND b.owner_user_id <> NEW.owner_user_id
        ) THEN
            RAISE EXCEPTION 'Duplicate phone listing: This Nigerian phone number is already linked to another MatthOrg business.'
                USING ERRCODE = '23505';
        END IF;
    END IF;

    -- Auto-generate referral code on insert (or backfill if null), immutable for non-privileged callers
    IF TG_OP = 'INSERT' THEN
        IF NOT v_is_privileged OR NULLIF(trim(COALESCE(NEW.referral_code, '')), '') IS NULL THEN
            LOOP
                v_candidate_code := 'MO-' || UPPER(substr(md5(COALESCE(NEW.id::text, gen_random_uuid()::text) || '-' || random()::text || clock_timestamp()::text), 1, 8));
                EXIT WHEN NOT EXISTS (
                    SELECT 1 FROM public.businesses b WHERE UPPER(b.referral_code) = v_candidate_code
                );
            END LOOP;
            NEW.referral_code := v_candidate_code;
        ELSE
            NEW.referral_code := UPPER(trim(NEW.referral_code));
        END IF;
    ELSE
        IF NOT v_is_privileged AND OLD.referral_code IS NOT NULL AND NEW.referral_code IS DISTINCT FROM OLD.referral_code THEN
            NEW.referral_code := OLD.referral_code;
        ELSIF NEW.referral_code IS NULL OR trim(NEW.referral_code) = '' THEN
            LOOP
                v_candidate_code := 'MO-' || UPPER(substr(md5(NEW.id::text || '-' || random()::text || clock_timestamp()::text), 1, 8));
                EXIT WHEN NOT EXISTS (
                    SELECT 1 FROM public.businesses b WHERE UPPER(b.referral_code) = v_candidate_code
                );
            END LOOP;
            NEW.referral_code := v_candidate_code;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.businesses_phone_and_referral_defaults() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_01_businesses_phone_and_referral_defaults ON public.businesses;
CREATE TRIGGER trg_01_businesses_phone_and_referral_defaults
    BEFORE INSERT OR UPDATE ON public.businesses
    FOR EACH ROW
    EXECUTE FUNCTION public.businesses_phone_and_referral_defaults();

-- Strengthen trust, subscription & referral attribution protection on public.businesses
-- Preserves all Step 4 protections without any client-settable GUC bypass.
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
    v_valid_referral_record BOOLEAN := false;
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

        IF NEW.referred_by_business_id IS NOT NULL
           OR NEW.referred_by_user_id IS NOT NULL
           OR NEW.referred_code_used IS NOT NULL
           OR NEW.referred_at IS NOT NULL THEN
            RAISE EXCEPTION 'Unauthorized: Referral attribution must be applied through verified referral attribution.'
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

    -- Referral attribution lock: immutable once set, and initial transition requires an authoritative public.referrals row
    IF (NEW.referred_by_business_id IS DISTINCT FROM OLD.referred_by_business_id) OR
       (NEW.referred_by_user_id IS DISTINCT FROM OLD.referred_by_user_id) OR
       (NEW.referred_code_used IS DISTINCT FROM OLD.referred_code_used) OR
       (NEW.referred_at IS DISTINCT FROM OLD.referred_at) THEN
        IF OLD.referred_by_business_id IS NOT NULL THEN
            RAISE EXCEPTION 'Unauthorized: Existing referral attribution is locked and cannot be overwritten.'
                USING ERRCODE = '42501';
        END IF;

        SELECT EXISTS (
            SELECT 1
            FROM public.referrals r
            WHERE r.referred_business_id = NEW.id
              AND r.referrer_business_id = NEW.referred_by_business_id
              AND r.referrer_user_id = NEW.referred_by_user_id
              AND UPPER(r.referral_code) = UPPER(COALESCE(NEW.referred_code_used, ''))
        ) INTO v_valid_referral_record;

        IF NOT v_valid_referral_record THEN
            RAISE EXCEPTION 'Unauthorized: Direct client modification of referral attribution is not permitted.'
                USING ERRCODE = '42501';
        END IF;
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

-- ============================================================================
-- SECTION 4: SAFE DUPLICATE CHECK & REFERRAL ATTRIBUTION RPCs
-- ============================================================================

-- Checks if a Nigerian phone number belongs to another business without exposing directory tables
CREATE OR REPLACE FUNCTION public.check_business_phone_conflict(
    p_phone TEXT,
    p_exclude_business_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_norm TEXT;
    v_match RECORD;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    v_norm := public.normalize_nigerian_phone(p_phone);
    IF v_norm IS NULL THEN
        RETURN jsonb_build_object(
            'valid', false,
            'has_conflict', false,
            'owned_by_caller', false
        );
    END IF;

    SELECT id, owner_user_id, name, state, city
    INTO v_match
    FROM public.businesses b
    WHERE (b.phone_e164 = v_norm OR public.normalize_nigerian_phone(b.phone) = v_norm)
      AND (p_exclude_business_id IS NULL OR b.id <> p_exclude_business_id)
    ORDER BY (b.owner_user_id = v_uid) DESC, b.created_at ASC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'valid', true,
            'normalized_phone', v_norm,
            'has_conflict', false,
            'owned_by_caller', false
        );
    END IF;

    RETURN jsonb_build_object(
        'valid', true,
        'normalized_phone', v_norm,
        'has_conflict', v_match.owner_user_id <> v_uid,
        'owned_by_caller', (v_match.owner_user_id = v_uid OR public.user_has_business_access(v_match.id)),
        'existing_business_id', v_match.id,
        'existing_business_name', CASE WHEN v_match.owner_user_id = v_uid THEN v_match.name ELSE NULL END
    );
END;
$$;

REVOKE ALL ON FUNCTION public.check_business_phone_conflict(TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_business_phone_conflict(TEXT, UUID) TO authenticated, service_role;

-- Public non-PII referral code lookup (returns business name & area only; never phone/email)
CREATE OR REPLACE FUNCTION public.lookup_referral_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_clean TEXT := UPPER(trim(COALESCE(p_code, '')));
    v_ref RECORD;
BEGIN
    IF v_clean = '' THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Referral code is empty.');
    END IF;

    SELECT
        b.id,
        b.referral_code,
        b.name AS business_name,
        b.industry,
        b.state,
        b.city
    INTO v_ref
    FROM public.businesses b
    WHERE UPPER(b.referral_code) = v_clean
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Referral code not found.');
    END IF;

    RETURN jsonb_build_object(
        'valid', true,
        'referral_code', v_ref.referral_code,
        'referrer_business_id', v_ref.id,
        'referrer_name', v_ref.business_name,
        'referrer_industry', v_ref.industry,
        'referrer_location', NULLIF(trim(concat_ws(', ', v_ref.city, v_ref.state)), '')
    );
END;
$$;

REVOKE ALL ON FUNCTION public.lookup_referral_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_referral_code(TEXT) TO anon, authenticated, service_role;

-- Atomic server-enforced referral attribution RPC
-- Prevents self-referral (by user ID, business ID, or normalized phone) and blocks duplicate/overwrite attempts.
CREATE OR REPLACE FUNCTION public.apply_referral_attribution(
    p_referral_code TEXT,
    p_referred_business_id UUID,
    p_source TEXT DEFAULT 'link'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_clean_code TEXT := UPPER(trim(COALESCE(p_referral_code, '')));
    v_referrer RECORD;
    v_referred RECORD;
    v_existing RECORD;
    v_referrer_auth_phone TEXT;
    v_referred_auth_phone TEXT;
    v_referrer_phone TEXT;
    v_referred_phone TEXT;
    v_referral_id UUID;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required to attribute a referral.' USING ERRCODE = '42501';
    END IF;

    IF v_clean_code = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Referral code is required.');
    END IF;

    IF p_referred_business_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Referred business ID is required.');
    END IF;

    -- Caller must own or belong to the referred business
    IF NOT (public.user_has_business_access(p_referred_business_id) OR public.is_platform_admin()) THEN
        RAISE EXCEPTION 'Unauthorized: Caller does not own or belong to business %', p_referred_business_id
            USING ERRCODE = '42501';
    END IF;

    -- Lock referred business row to avoid race conditions
    SELECT *
    INTO v_referred
    FROM public.businesses b
    WHERE b.id = p_referred_business_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Business record not found.');
    END IF;

    -- Check existing immutable attribution on business or referrals ledger
    SELECT *
    INTO v_existing
    FROM public.referrals r
    WHERE r.referred_business_id = p_referred_business_id
       OR r.referred_user_id = v_referred.owner_user_id
    LIMIT 1;

    IF FOUND OR v_referred.referred_by_business_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'already_attributed', true,
            'locked', true,
            'referral_code', COALESCE(v_existing.referral_code, v_referred.referred_code_used),
            'referrer_business_id', COALESCE(v_existing.referrer_business_id, v_referred.referred_by_business_id),
            'message', 'Referral attribution is already recorded and cannot be overwritten.'
        );
    END IF;

    -- Resolve referrer strictly from code
    SELECT *
    INTO v_referrer
    FROM public.businesses b
    WHERE UPPER(b.referral_code) = v_clean_code
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or unrecognized referral code.');
    END IF;

    -- Anti-self-referral checks (business ID, user ID, and normalized phone numbers)
    IF v_referrer.id = v_referred.id OR v_referrer.owner_user_id = v_referred.owner_user_id OR v_referrer.owner_user_id = v_uid THEN
        RETURN jsonb_build_object('success', false, 'self_referral', true, 'error', 'Self-referral is not allowed.');
    END IF;

    SELECT public.normalize_nigerian_phone(u.phone) INTO v_referrer_auth_phone FROM auth.users u WHERE u.id = v_referrer.owner_user_id;
    SELECT public.normalize_nigerian_phone(u.phone) INTO v_referred_auth_phone FROM auth.users u WHERE u.id = v_referred.owner_user_id;

    v_referrer_phone := COALESCE(v_referrer.phone_e164, public.normalize_nigerian_phone(v_referrer.phone), v_referrer_auth_phone);
    v_referred_phone := COALESCE(v_referred.phone_e164, public.normalize_nigerian_phone(v_referred.phone), v_referred_auth_phone);

    IF v_referrer_phone IS NOT NULL AND v_referred_phone IS NOT NULL AND v_referrer_phone = v_referred_phone THEN
        RETURN jsonb_build_object('success', false, 'self_referral', true, 'error', 'Self-referral using the same phone number is not allowed.');
    END IF;

    INSERT INTO public.referrals (
        referrer_business_id,
        referrer_user_id,
        referred_business_id,
        referred_user_id,
        referral_code,
        referrer_phone_e164,
        referred_phone_e164,
        source,
        status
    ) VALUES (
        v_referrer.id,
        v_referrer.owner_user_id,
        v_referred.id,
        v_referred.owner_user_id,
        v_referrer.referral_code,
        v_referrer_phone,
        v_referred_phone,
        COALESCE(NULLIF(trim(p_source), ''), 'link'),
        'attributed'
    )
    RETURNING id INTO v_referral_id;

    UPDATE public.businesses
    SET
        referred_by_business_id = v_referrer.id,
        referred_by_user_id = v_referrer.owner_user_id,
        referred_code_used = v_referrer.referral_code,
        referred_at = now(),
        updated_at = now()
    WHERE id = v_referred.id;

    RETURN jsonb_build_object(
        'success', true,
        'already_attributed', false,
        'referral_id', v_referral_id,
        'referral_code', v_referrer.referral_code,
        'referrer_business_id', v_referrer.id,
        'referrer_name', v_referrer.name
    );
END;
$$;

REVOKE ALL ON FUNCTION public.apply_referral_attribution(TEXT, UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_referral_attribution(TEXT, UUID, TEXT) TO authenticated, service_role;

-- ============================================================================
-- SECTION 5: REFRESH PUBLIC PROFESSIONAL DIRECTORY VIEW (WITH LGA & SAFE COLUMNS)
-- ============================================================================

DO $$
DECLARE
    v_has_biz_name BOOLEAN;
    v_has_name BOOLEAN;
    v_has_logo BOOLEAN;
    v_has_logo_url BOOLEAN;
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
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'name'
    ) INTO v_has_name;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'logo'
    ) INTO v_has_logo;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'logo_url'
    ) INTO v_has_logo_url;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'whatsapp'
    ) INTO v_has_whatsapp;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'record_status'
    ) INTO v_has_record_status;

    v_name_expr := CASE
        WHEN v_has_biz_name THEN 'b.business_name'
        WHEN v_has_name THEN 'b.name AS business_name'
        ELSE 'NULL::text AS business_name'
    END;
    v_logo_expr := CASE
        WHEN v_has_logo THEN 'b.logo'
        WHEN v_has_logo_url THEN 'b.logo_url AS logo'
        ELSE 'NULL::text AS logo'
    END;
    v_whatsapp_expr := CASE WHEN v_has_whatsapp THEN 'b.whatsapp' ELSE 'b.phone AS whatsapp' END;
    v_status_filter := CASE WHEN v_has_record_status THEN ' AND COALESCE(b.record_status, ''Approved'') = ''Approved''' ELSE '' END;

    EXECUTE 'DROP VIEW IF EXISTS public.public_professionals';
    EXECUTE format($v$
        CREATE VIEW public.public_professionals
        WITH (security_barrier = true) AS
        SELECT
            b.id,
            %s,
            b.owner_full_name,
            b.provider_type,
            b.industry,
            b.specialization,
            b.tagline,
            %s,
            b.phone,
            %s,
            b.email,
            b.address,
            b.state,
            b.lga,
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
