-- ============================================================================
-- MatthOrg AI Growth Engine Migration
-- Module: Lead Discovery, AI Research, Qualification, Outreach & Pipeline
-- ============================================================================

BEGIN;

-- 1. Growth Searches History Table
CREATE TABLE IF NOT EXISTS public.growth_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'Nigeria',
    state TEXT,
    city TEXT,
    business_size TEXT DEFAULT 'all',
    requested_limit INTEGER DEFAULT 25,
    discovered_count INTEGER DEFAULT 0,
    website_status TEXT DEFAULT 'all',
    keywords TEXT,
    customer_requirements TEXT,
    provider TEXT DEFAULT 'auto',
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Discovered Businesses Table
CREATE TABLE IF NOT EXISTS public.growth_discovered_businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_id UUID REFERENCES public.growth_searches(id) ON DELETE SET NULL,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    category TEXT NOT NULL,
    industry TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'Nigeria',
    state TEXT,
    city TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    has_website BOOLEAN DEFAULT false,
    business_size TEXT DEFAULT 'small',
    estimated_employees TEXT,
    data_source TEXT NOT NULL DEFAULT 'verified_directory',
    retrieval_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    pipeline_stage TEXT NOT NULL DEFAULT 'discovered',
    stage_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    assigned_to TEXT,
    followup_date DATE,
    converted_customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. AI Business Research Reports
CREATE TABLE IF NOT EXISTS public.growth_lead_research (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.growth_discovered_businesses(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    model_used TEXT DEFAULT 'openai-gpt4o-mini',
    researched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    verified_info JSONB DEFAULT '{}'::jsonb,
    ai_observations JSONB DEFAULT '{}'::jsonb,
    selling_opportunities JSONB DEFAULT '{}'::jsonb,
    assumptions_to_verify JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. AI Lead Qualification Scores
CREATE TABLE IF NOT EXISTS public.growth_lead_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.growth_discovered_businesses(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    qualification_category TEXT NOT NULL,
    relevance_score INTEGER DEFAULT 0,
    need_score INTEGER DEFAULT 0,
    vitality_score INTEGER DEFAULT 0,
    contactability_score INTEGER DEFAULT 0,
    icp_fit_score INTEGER DEFAULT 0,
    reasons JSONB DEFAULT '[]'::jsonb,
    potential_opportunity TEXT,
    recommended_next_action TEXT,
    icp_match_summary TEXT,
    disclaimer TEXT,
    scored_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Contact Intelligence & Enrichment
CREATE TABLE IF NOT EXISTS public.growth_enriched_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.growth_discovered_businesses(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    official_email TEXT,
    email_verification_status TEXT DEFAULT 'unverified',
    official_phone TEXT,
    whatsapp_number TEXT,
    website_url TEXT,
    public_contact_page TEXT,
    office_address TEXT,
    decision_maker_name TEXT,
    decision_maker_title TEXT,
    decision_maker_linkedin TEXT,
    lawful_basis TEXT DEFAULT 'B2B Legitimate Interest',
    last_verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    source TEXT DEFAULT 'public_registry'
);

-- 6. Outreach Messages & Campaign Studio
CREATE TABLE IF NOT EXISTS public.growth_outreach_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.growth_discovered_businesses(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    outreach_type TEXT NOT NULL,
    tone TEXT NOT NULL DEFAULT 'consultative',
    subject TEXT,
    message_body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at TIMESTAMPTZ,
    reply_received_at TIMESTAMPTZ,
    notes TEXT
);

-- 7. Lead Pipeline Activities & Notes
CREATE TABLE IF NOT EXISTS public.growth_pipeline_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.growth_discovered_businesses(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL DEFAULT 'Sales Lead',
    note_type TEXT NOT NULL DEFAULT 'general',
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Lead Suppressions & Unsubscribe List (Safety & Compliance)
CREATE TABLE IF NOT EXISTS public.growth_suppressions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    email TEXT,
    phone TEXT,
    domain TEXT,
    reason TEXT NOT NULL DEFAULT 'unsubscribed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_growth_leads_business_id ON public.growth_discovered_businesses(business_id);
CREATE INDEX IF NOT EXISTS idx_growth_leads_pipeline_stage ON public.growth_discovered_businesses(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_growth_leads_category ON public.growth_discovered_businesses(category);
CREATE INDEX IF NOT EXISTS idx_growth_leads_state_city ON public.growth_discovered_businesses(state, city);
CREATE INDEX IF NOT EXISTS idx_growth_research_lead_id ON public.growth_lead_research(lead_id);
CREATE INDEX IF NOT EXISTS idx_growth_scores_lead_id ON public.growth_lead_scores(lead_id);
CREATE INDEX IF NOT EXISTS idx_growth_contacts_lead_id ON public.growth_enriched_contacts(lead_id);
CREATE INDEX IF NOT EXISTS idx_growth_outreach_lead_id ON public.growth_outreach_messages(lead_id);

-- RLS Enforcement
ALTER TABLE public.growth_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_discovered_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_lead_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_enriched_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_outreach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_pipeline_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_suppressions ENABLE ROW LEVEL SECURITY;

-- Grants for authenticated users
GRANT ALL ON public.growth_searches TO authenticated;
GRANT ALL ON public.growth_discovered_businesses TO authenticated;
GRANT ALL ON public.growth_lead_research TO authenticated;
GRANT ALL ON public.growth_lead_scores TO authenticated;
GRANT ALL ON public.growth_enriched_contacts TO authenticated;
GRANT ALL ON public.growth_outreach_messages TO authenticated;
GRANT ALL ON public.growth_pipeline_activities TO authenticated;
GRANT ALL ON public.growth_suppressions TO authenticated;

COMMIT;
