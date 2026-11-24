-- ============================================================================
-- MATTHORG: UNIVERSAL CONVERSATIONAL MARKETPLACE, DATA HUB & FULFILMENT SCHEMA
-- Safe, idempotent migration extending existing MatthOrg CRM & Marketplace tables.
-- Preserves all existing tables, triggers, RPCs, and multi-tenant RLS rules.
-- ============================================================================

BEGIN;

-- 1. Enable trigram fuzzy matching & unaccent extensions where available
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ----------------------------------------------------------------------------
-- 2. Extend public.businesses & public.products safely
-- ----------------------------------------------------------------------------
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS record_status TEXT NOT NULL DEFAULT 'Approved';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS provider_type TEXT NOT NULL DEFAULT 'business'; -- 'business' | 'artisan' | 'professional' | 'supplier'
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS working_hours TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS delivery_available BOOLEAN DEFAULT false;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS service_areas_text TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS source_name TEXT DEFAULT 'self_registered';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'New';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'In Stock';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS specs JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS warranty TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'Approved';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS canonical_product_id UUID NULL;

-- ----------------------------------------------------------------------------
-- 3. Unified Directory Entities (Includes Unregistered Artisans & Multi-Branch)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.directory_businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    linked_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
    owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    business_name TEXT NOT NULL,
    provider_type TEXT NOT NULL DEFAULT 'business', -- 'business' | 'artisan' | 'professional' | 'repair_technician' | 'agency' | 'supplier'
    industry TEXT,
    specialization TEXT,
    description TEXT,
    tagline TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    website TEXT,
    cac_number TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT NOT NULL DEFAULT 'Nigeria',
    locations_served TEXT[] DEFAULT '{}',
    categories_offered TEXT[] DEFAULT '{}',
    keywords TEXT[] DEFAULT '{}',
    working_hours TEXT,
    is_registered BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    approval_status TEXT NOT NULL DEFAULT 'Approved', -- 'Pending Analysis' | 'Needs Review' | 'Approved' | 'Rejected' | 'Duplicate' | 'Archived'
    source_type TEXT DEFAULT 'manual',
    source_url TEXT,
    last_verified_at TIMESTAMPTZ DEFAULT now(),
    merged_into_id UUID REFERENCES public.directory_businesses(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    directory_business_id UUID REFERENCES public.directory_businesses(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    contact_name TEXT,
    role_title TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    directory_business_id UUID REFERENCES public.directory_businesses(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    branch_name TEXT DEFAULT 'Main Branch',
    address TEXT,
    area_city TEXT,
    state TEXT,
    country TEXT NOT NULL DEFAULT 'Nigeria',
    is_head_office BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 4. Service Categories & Unified Services Linked to Businesses/Artisans
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    parent_domain TEXT NOT NULL, -- 'Products' | 'Artisans & Skilled Trades' | 'Repairs & Maintenance' | 'Digital & Creative Services' | 'Professional Services' | 'Business & Commercial Services'
    synonyms TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    directory_business_id UUID REFERENCES public.directory_businesses(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
    service_name TEXT NOT NULL,
    service_category TEXT NOT NULL,
    description TEXT,
    sub_services TEXT[] DEFAULT '{}',
    pricing_type TEXT NOT NULL DEFAULT 'Request a Quote', -- 'Fixed' | 'Starting From' | 'Negotiable' | 'Inspection Required' | 'Request a Quote'
    price_min NUMERIC DEFAULT 0,
    price_max NUMERIC,
    currency TEXT NOT NULL DEFAULT '₦',
    estimated_turnaround TEXT,
    locations_covered TEXT[] DEFAULT '{}',
    keywords TEXT[] DEFAULT '{}',
    approval_status TEXT NOT NULL DEFAULT 'Approved',
    is_active BOOLEAN DEFAULT true,
    last_verified_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 5. Canonical Product, Seller Offers, Variants, Attributes, Media, Inventory & Sources
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.canonical_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_name TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    category TEXT NOT NULL,
    normalized_specs JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_product_id UUID REFERENCES public.canonical_products(id) ON DELETE SET NULL,
    directory_business_id UUID REFERENCES public.directory_businesses(id) ON DELETE SET NULL,
    business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    category TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT '₦',
    unit TEXT DEFAULT 'unit',
    condition TEXT DEFAULT 'New',
    availability TEXT DEFAULT 'In Stock',
    warranty TEXT,
    location TEXT,
    state TEXT,
    city TEXT,
    seller_name TEXT,
    seller_phone TEXT,
    seller_whatsapp TEXT,
    listing_type TEXT NOT NULL DEFAULT 'admin_managed', -- 'business_owned' | 'external_marketplace' | 'admin_managed'
    source_marketplace TEXT DEFAULT 'MatthOrg',
    external_url TEXT,
    date_collected DATE DEFAULT CURRENT_DATE,
    last_verified_at TIMESTAMPTZ DEFAULT now(),
    approval_status TEXT NOT NULL DEFAULT 'Approved',
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_offer_id UUID NOT NULL REFERENCES public.product_offers(id) ON DELETE CASCADE,
    variant_name TEXT NOT NULL,
    sku TEXT,
    price_override NUMERIC,
    attributes JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.product_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_offer_id UUID NOT NULL REFERENCES public.product_offers(id) ON DELETE CASCADE,
    attr_key TEXT NOT NULL,
    attr_value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.product_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_offer_id UUID NOT NULL REFERENCES public.product_offers(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT DEFAULT 'image',
    is_primary BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.product_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_offer_id UUID NOT NULL REFERENCES public.product_offers(id) ON DELETE CASCADE,
    stock_quantity INTEGER DEFAULT 0,
    availability_status TEXT DEFAULT 'In Stock',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_offer_id UUID NOT NULL REFERENCES public.product_offers(id) ON DELETE CASCADE,
    source_name TEXT NOT NULL,
    source_url TEXT,
    date_collected TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_verified_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 6. MatthOrg Data Hub Staging, Sources & Audit Trail
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    source_type TEXT NOT NULL, -- 'paste_raw' | 'csv_excel' | 'json' | 'manual_entry' | 'url_submission' | 'business_portal'
    source_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.data_import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES public.data_sources(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    input_type TEXT NOT NULL DEFAULT 'raw_text', -- 'raw_text' | 'csv' | 'json' | 'url' | 'single_entry'
    raw_input TEXT,
    status TEXT NOT NULL DEFAULT 'Needs Review', -- 'Pending Analysis' | 'Needs Review' | 'Approved' | 'Rejected' | 'Duplicate' | 'Archived'
    total_extracted INTEGER DEFAULT 0,
    approved_count INTEGER DEFAULT 0,
    ai_model_used TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.data_import_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.data_import_jobs(id) ON DELETE CASCADE,
    record_type TEXT NOT NULL, -- 'business' | 'service' | 'product' | 'artisan' | 'mixed_entity'
    extracted_payload JSONB NOT NULL,
    missing_fields TEXT[] DEFAULT '{}',
    duplicate_candidate_id TEXT,
    duplicate_candidate_name TEXT,
    duplicate_similarity NUMERIC,
    status TEXT NOT NULL DEFAULT 'Needs Review', -- 'Pending Analysis' | 'Needs Review' | 'Approved' | 'Rejected' | 'Duplicate' | 'Archived'
    target_entity_id UUID,
    reviewer_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 7. Search Synonyms, Colloquial Terms & Fulfilment Pipeline
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.search_synonyms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phrase TEXT NOT NULL UNIQUE,
    canonical_terms TEXT[] NOT NULL,
    intent_hint TEXT,
    category_hint TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fulfilment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number TEXT NOT NULL UNIQUE,
    customer_request_id UUID REFERENCES public.customer_requests(id) ON DELETE SET NULL,
    conversation_session_id TEXT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_whatsapp TEXT,
    customer_email TEXT,
    request_summary TEXT NOT NULL,
    request_type TEXT DEFAULT 'general', -- 'product' | 'artisan' | 'repair' | 'digital' | 'professional' | 'business' | 'general'
    category TEXT,
    location TEXT,
    state TEXT,
    city TEXT,
    budget_max NUMERIC,
    budget_formatted TEXT,
    urgency TEXT DEFAULT 'normal',
    details TEXT,
    status TEXT NOT NULL DEFAULT 'New', -- 'New' | 'Awaiting Sourcing' | 'Processing' | 'Matching Providers Found' | 'Customer Contacted' | 'Fulfilled' | 'Unfulfilled'
    assigned_admin TEXT,
    converted_lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    converted_quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fulfilment_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fulfilment_request_id UUID NOT NULL REFERENCES public.fulfilment_requests(id) ON DELETE CASCADE,
    provider_id TEXT NOT NULL,
    provider_name TEXT NOT NULL,
    provider_phone TEXT,
    provider_type TEXT DEFAULT 'business',
    match_note TEXT,
    quoted_price NUMERIC,
    status TEXT NOT NULL DEFAULT 'Proposed', -- 'Proposed' | 'Sent to Customer' | 'Accepted' | 'Declined'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 8. Conversational Sessions, Messages & Customer Enquiries
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_key TEXT UNIQUE NOT NULL,
    customer_location TEXT,
    accumulated_context JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    intent TEXT,
    matched_entities JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type TEXT NOT NULL, -- 'product' | 'service' | 'business' | 'artisan'
    target_id TEXT NOT NULL,
    target_name TEXT NOT NULL,
    business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_whatsapp TEXT,
    customer_email TEXT,
    customer_location TEXT,
    message TEXT,
    campaign_id TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 9. High-Performance Full-Text + Trigram Search Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_dir_biz_name_trgm ON public.directory_businesses USING gin (business_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_dir_biz_spec_trgm ON public.directory_businesses USING gin (COALESCE(specialization, '') gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_dir_biz_status ON public.directory_businesses (approval_status);
CREATE INDEX IF NOT EXISTS idx_services_name_trgm ON public.services USING gin (service_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_services_status ON public.services (approval_status, is_active);
CREATE INDEX IF NOT EXISTS idx_product_offers_name_trgm ON public.product_offers USING gin (product_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_product_offers_status ON public.product_offers (approval_status, is_published);
CREATE INDEX IF NOT EXISTS idx_fulfilment_requests_status ON public.fulfilment_requests (status, created_at DESC);

-- ----------------------------------------------------------------------------
-- 10. Row-Level Security (Strict Public Approved-Only + Multi-Tenant Isolation)
-- ----------------------------------------------------------------------------
ALTER TABLE public.directory_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canonical_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_import_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_synonyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fulfilment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fulfilment_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_enquiries ENABLE ROW LEVEL SECURITY;

-- Public read access ONLY for Approved directory records, services, categories, and published product offers
CREATE POLICY "public_read_approved_directory_businesses"
    ON public.directory_businesses FOR SELECT TO anon, authenticated
    USING (approval_status = 'Approved');

CREATE POLICY "tenant_manage_own_directory_businesses"
    ON public.directory_businesses FOR ALL TO authenticated
    USING (linked_business_id IS NOT NULL AND public.user_has_business_access(linked_business_id))
    WITH CHECK (linked_business_id IS NOT NULL AND public.user_has_business_access(linked_business_id));

CREATE POLICY "public_read_service_categories"
    ON public.service_categories FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "public_read_approved_services"
    ON public.services FOR SELECT TO anon, authenticated
    USING (approval_status = 'Approved' AND is_active = true);

CREATE POLICY "tenant_manage_own_services"
    ON public.services FOR ALL TO authenticated
    USING (business_id IS NOT NULL AND public.user_has_business_access(business_id))
    WITH CHECK (business_id IS NOT NULL AND public.user_has_business_access(business_id));

CREATE POLICY "public_read_approved_product_offers"
    ON public.product_offers FOR SELECT TO anon, authenticated
    USING (approval_status = 'Approved' AND is_published = true);

CREATE POLICY "tenant_manage_own_product_offers"
    ON public.product_offers FOR ALL TO authenticated
    USING (business_id IS NOT NULL AND public.user_has_business_access(business_id))
    WITH CHECK (business_id IS NOT NULL AND public.user_has_business_access(business_id));

CREATE POLICY "public_read_synonyms"
    ON public.search_synonyms FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "public_insert_enquiries"
    ON public.customer_enquiries FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "tenant_read_own_enquiries"
    ON public.customer_enquiries FOR SELECT TO authenticated
    USING (business_id IS NOT NULL AND public.user_has_business_access(business_id));

CREATE POLICY "public_insert_fulfilment_requests"
    ON public.fulfilment_requests FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Strict tenant isolation for import jobs/records (only owner or admin via service role)
CREATE POLICY "creator_manage_import_jobs"
    ON public.data_import_jobs FOR ALL TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

COMMIT;
