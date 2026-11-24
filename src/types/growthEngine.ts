// ============================================================================
// MatthOrg AI Growth Engine — Data Types & Interfaces
// ============================================================================

export type GrowthPipelineStage =
  | 'discovered'
  | 'researched'
  | 'qualified'
  | 'contact_identified'
  | 'contacted'
  | 'interested'
  | 'meeting_scheduled'
  | 'proposal_sent'
  | 'converted'
  | 'lost';

export interface GrowthSearchFilter {
  id?: string;
  category: string;
  businessName?: string;
  country: string;
  state: string;
  city: string;
  businessSize: 'all' | 'micro' | 'small' | 'mid' | 'enterprise'; // 1-10, 11-50, 51-200, 200+
  limit: number;
  websiteStatus: 'all' | 'has_website' | 'no_website' | 'needs_redesign';
  additionalKeywords?: string;
  customerRequirements?: string; // e.g. "Looking for solar backup power or modern web redesign"
  provider?: 'google_places' | 'verified_directory' | 'auto';
  createdAt?: string;
}

export interface DiscoveredBusiness {
  id: string;
  search_id?: string;
  business_name: string;
  category: string;
  industry: string;
  country: string;
  state: string;
  city: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  has_website: boolean;
  business_size: 'micro' | 'small' | 'mid' | 'enterprise';
  estimated_employees?: string;
  data_source: 'google_places' | 'verified_directory' | 'registry_api' | 'manual';
  retrieval_date: string;
  pipeline_stage: GrowthPipelineStage;
  stage_updated_at: string;
  
  // Linked sub-records
  research_report?: BusinessResearchReport;
  qualification_score?: LeadQualificationScore;
  enriched_contact?: EnrichedContact;
  outreach_history?: OutreachMessage[];
  notes?: LeadActivityNote[];
  assigned_to?: string;
  followup_date?: string;
  converted_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessResearchReport {
  id: string;
  business_id: string;
  business_name: string;
  researched_at: string;
  model_used: string;
  
  // Section 1: Verified Information (Factual & Proven)
  verified_info: {
    official_name: string;
    registered_address?: string;
    primary_phone?: string;
    official_website?: string;
    operating_status: 'Active' | 'Unverified' | 'Temporarily Closed';
    primary_trade: string;
  };

  // Section 2: AI-Generated Observations
  ai_observations: {
    business_summary: string;
    core_products_services: string[];
    digital_presence_assessment: string; // e.g. "Basic mobile presence, no SSL, social inactive since 2024"
    online_visibility_level: 'High' | 'Moderate' | 'Low' | 'Minimal';
    estimated_target_market: string;
    perceived_strengths: string[];
  };

  // Section 3: Potential Business Challenges & Selling Opportunities
  selling_opportunities: {
    identified_challenges: string[];
    pitch_angle: string;
    recommended_services_to_sell: string[];
    estimated_deal_value_range?: string;
  };

  // Section 4: Assumptions Requiring Human Verification
  assumptions_to_verify: string[];
}

export type QualificationCategory = 'high_potential' | 'medium_potential' | 'low_potential' | 'needs_verification';

export interface LeadQualificationScore {
  id: string;
  business_id: string;
  overall_score: number; // 0 to 100
  qualification_category: QualificationCategory;
  scored_at: string;
  
  // Dimension Breakdown
  relevance_score: number; // 0-25
  need_score: number;      // 0-25
  vitality_score: number;  // 0-20
  contactability_score: number; // 0-20
  icp_fit_score: number;   // 0-10
  
  reasons: string[];
  potential_opportunity: string;
  recommended_next_action: string;
  icp_match_summary: string;
  disclaimer: string;
}

export interface EnrichedContact {
  id: string;
  business_id: string;
  official_email?: string;
  email_verification_status: 'verified_deliverable' | 'public_inquiry' | 'catch_all' | 'unverified';
  official_phone?: string;
  whatsapp_number?: string;
  website_url?: string;
  public_contact_page?: string;
  office_address?: string;
  decision_maker_name?: string;
  decision_maker_title?: string;
  decision_maker_linkedin?: string;
  lawful_basis: string; // e.g. "B2B Legitimate Interest / Public Commercial Directory"
  last_verified_at: string;
  source: string;
}

export type OutreachType =
  | 'cold_email'
  | 'follow_up_email'
  | 'linkedin_message'
  | 'whatsapp_intro'
  | 'sales_call_notes'
  | 'meeting_invitation';

export type OutreachTone = 'professional' | 'friendly' | 'consultative' | 'direct_sales';

export interface OutreachMessage {
  id: string;
  business_id: string;
  business_name: string;
  outreach_type: OutreachType;
  tone: OutreachTone;
  subject?: string;
  message_body: string;
  status: 'draft' | 'approved' | 'sent' | 'replied';
  generated_at: string;
  sent_at?: string;
  reply_received_at?: string;
  notes?: string;
}

export interface LeadActivityNote {
  id: string;
  business_id: string;
  author_name: string;
  note_type: 'call' | 'email' | 'meeting' | 'research' | 'stage_change' | 'general';
  content: string;
  created_at: string;
}

export interface GrowthAnalyticsSummary {
  total_discovered: number;
  total_researched: number;
  total_qualified: number;
  total_contactable: number;
  outreach_generated: number;
  outreach_sent: number;
  replies_received: number;
  meetings_booked: number;
  converted_customers: number;
  conversion_rate: number; // percentage
  stage_breakdown: Record<GrowthPipelineStage, number>;
  industry_breakdown: { industry: string; count: number }[];
  location_breakdown: { location: string; count: number }[];
}

export interface GrowthICPConfig {
  targetIndustries: string[];
  targetLocations: string[];
  targetSizes: string[];
  preferHasWebsite: boolean;
  minRevenueTier?: string;
  primaryServiceOffered: string; // e.g. "Commercial Solar & Inverters" or "Web Development & IT"
  valueProposition: string;
}
