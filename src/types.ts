export type PlanTier = 'free' | 'pro' | 'business';

export type DocumentDesignTemplate = 'modern' | 'corporate' | 'technical' | 'emerald';

export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  plan: PlanTier;
  createdAt: string;
}

export interface BusinessProfile {
  id: string;
  user_id: string;
  business_name: string;
  industry?: string; // e.g., "Building, Construction & Civil Works", "Electrical & Power", "Digital & IT"
  specialization?: string; // What the business specifically specializes in
  state?: string; // e.g., "Lagos", "Abuja (FCT)", "Rivers", etc.
  lga?: string; // Official Nigerian LGA / Area Council
  city?: string; // e.g., "Ikeja", "Maitama", "Port Harcourt"
  owner_full_name?: string;
  provider_type?: string;
  referral_code?: string;
  referred_by_business_id?: string;
  referred_code_used?: string;
  referred_at?: string;
  cac_number?: string; // e.g., "RC 1234567"
  website?: string;
  tagline?: string;
  logo: string; // URL or base64
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  country: string;
  currency: string;
  tax_name: string; // e.g., "VAT", "Sales Tax"
  tax_rate: number; // percentage, e.g. 7.5
  categories_offered?: string[];
  locations_served?: string[];
  is_public?: boolean;
  phone_verified?: boolean;
  email_verified?: boolean;
  identity_verified?: boolean;
  business_verified?: boolean;
  service_verified?: boolean;
  director_name?: string;
  nin_number?: string;
  id_type?: 'nin' | 'drivers_license' | 'voters_card' | 'passport';
  cac_type?: 'business_name' | 'limited_company' | 'sole_trader' | 'incorporated_trustee';
  trade_certification?: string;
  trade_license_number?: string;
  proof_of_address_url?: string;
  cac_document_url?: string;
  id_document_url?: string;
  verification_status?: 'unverified' | 'in_review' | 'verified';
  verified_at?: string;
  subscription_plan?: string;
  subscription_status?: string;
  subscription_expires_at?: string;
  subscription_current_period_end?: string;
  working_hours?: string;
  payment_details: {
    bank_name: string;
    account_name: string;
    account_number: string;
    notes: string;
  };
  terms: string;
  invoice_design?: DocumentDesignTemplate;
  design_color?: string;
  show_logo_on_docs?: boolean;
  show_address_on_docs?: boolean;
  show_tax_on_docs?: boolean;
  show_banking_on_docs?: boolean;
  show_signature_on_docs?: boolean;
  show_terms_on_docs?: boolean;
}

export type CustomerRequestStatus = 'Open' | 'Matched' | 'Contacted' | 'Converted' | 'Closed' | 'Unfulfilled_Ad_Needed' | 'Ad_Launched' | 'Pro_Acquired';

export type DemandCampaignStatus = 'ad_needed' | 'ad_launched' | 'pro_acquired' | 'connected_to_customer';

export interface DemandAdvertCampaign {
  id: string;
  request_id: string;
  request_number: string;
  service_required: string;
  location: string;
  state?: string;
  town?: string;
  customer_name: string;
  customer_phone: string;
  customer_whatsapp?: string;
  customer_email?: string;
  budget_formatted?: string;
  timeline?: string;
  details?: string;
  campaign_status: DemandCampaignStatus;
  ad_headline: string;
  ad_copy_whatsapp: string;
  ad_copy_social: string;
  ad_copy_sms: string;
  campaign_channel?: 'whatsapp_broadcast' | 'instagram_meta' | 'sms_union' | 'artisan_association';
  campaign_launched_at?: string;
  connected_artisan_id?: string;
  connected_artisan_name?: string;
  connected_artisan_phone?: string;
  connected_at?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface MatchedProfessionalCandidate {
  professional: PublicProfessionalProfile;
  matchScore: number; // 0-100
  matchReasons: string[];
  isVerified: boolean;
  isPremium: boolean;
}

export interface CustomerRequest {
  id: string;
  request_number: string;
  customer_name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  location: string;
  state?: string;
  city?: string;
  service_required: string;
  service_category: string;
  property_type?: string;
  budget_min?: number;
  budget_max?: number;
  budget_formatted?: string;
  timeline?: 'immediate' | 'within_7_days' | 'within_30_days' | 'flexible';
  details?: string;
  status: CustomerRequestStatus;
  contacted_by_business_ids?: string[];
  user_id?: string;
  consent_given?: boolean;
  matched_count?: number;
  matched_candidates?: MatchedProfessionalCandidate[];
  matched_business_names?: string[];
  quote_id?: string;
  notification_dispatched?: boolean;
  notification_status?: 'pending' | 'whatsapp_link_ready' | 'email_sent' | 'sms_sent' | 'manual_review';
  ad_campaign_id?: string;
  conversation_session_id?: string;
  source?: 'direct' | 'matthew_ai' | 'fulfilment';
  is_archived?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface PublicProfessionalProfile {
  id: string;
  business_name: string;
  industry?: string;
  specialization?: string;
  tagline?: string;
  logo?: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  state?: string;
  lga?: string;
  city?: string;
  owner_full_name?: string;
  categories_offered?: string[];
  locations_served?: string[];
  is_public: boolean;
  phone_verified: boolean;
  email_verified: boolean;
  identity_verified: boolean;
  business_verified: boolean;
  service_verified: boolean;
  is_demo?: boolean;
  is_artisan?: boolean;
  vouches_count?: number;
  rating?: number;
  work_done?: string;
  verification_status?: 'unverified' | 'in_review' | 'verified';
  subscription_plan?: string;
  is_paid?: boolean;
  created_at: string;
}

export type LeadSource =
  | 'marketplace'
  | 'manual'
  | 'referral'
  | 'website'
  | 'Google Ads'
  | 'Meta Ads'
  | 'WhatsApp'
  | 'partner'
  | 'import';

export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'Quote Sent'
  | 'Quoted'
  | 'Negotiating'
  | 'Won'
  | 'Lost'
  | 'Unresponsive'
  | 'Not Qualified';

export type IntentLevel = 'Very High' | 'High' | 'Medium' | 'Low';

export type LeadFreshness = 'active' | 'recently_verified' | 'aging' | 'expired' | 'closed';

export interface Lead {
  id: string;
  lead_number: string; // e.g. MAT-000124
  customer_name: string;
  phone: string;
  whatsapp: string;
  email?: string;
  company?: string;
  location: string; // e.g. "Abuja", "Lekki, Lagos"
  service_required: string; // e.g. "Solar Installation"
  service_category: string; // e.g. "Power & Technology"
  property_type?: string; // e.g. "3-bedroom house"
  budget_min?: number;
  budget_max?: number;
  budget_formatted: string; // e.g. "₦1m–₦1.5m"
  estimated_value?: number;
  timeline: 'immediate' | 'within_7_days' | 'within_30_days' | 'flexible';
  source: LeadSource;
  source_name?: string; // e.g. "ABC Properties", "Google Search"
  status: LeadStatus;
  intent_score: number; // 0 - 100
  intent_level: IntentLevel;
  is_verified: boolean;
  verified_at?: string;
  freshness: LeadFreshness;
  freshness_label: string; // e.g. "🔥 Active — verified 15m ago"
  is_locked: boolean; // if marketplace lead & locked, contact details are hidden
  unlocked_at?: string;
  notes?: string;
  requirements_list?: string[];
  next_follow_up?: string;
  assigned_user?: string;
  quote_id?: string;
  customer_id?: string;
  customer_request_id?: string;
  address?: string; // Street / Site Address
  city?: string;
  state?: string;
  attached_products?: Array<{
    product_id: string;
    name: string;
    category?: string;
    unit?: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  created_at: string;
  updated_at?: string;
  won_at?: string;
  lost_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  notes: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  unit: string; // e.g., "unit", "pcs", "hrs", "sqm", "service"
  default_price: number;
  category: string;
  sku?: string;
  image?: string;
  rating?: number;
  rating_count?: number;
  // Extended commerce metadata (optional so existing Quote/Invoice code stays compatible)
  brand?: string;
  model?: string;
  condition?: 'New' | 'Foreign Used' | 'Refurbished' | 'Used';
  availability?: 'In Stock' | 'Low Stock' | 'Made to Order' | 'Out of Stock';
  stock_quantity?: number;
  specs?: Record<string, string>;
  variations?: string[];
  warranty?: string;
  location?: string;
  is_published?: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected';
}

export type CatalogListingType = 'business_owned' | 'external_marketplace' | 'admin_managed';

export interface CatalogProduct {
  id: string;
  listing_type: CatalogListingType;
  business_id?: string;
  name: string;
  brand?: string;
  model?: string;
  category: string;
  description: string;
  specs?: Record<string, string>;
  variations?: string[];
  price: number;
  currency: string;
  unit?: string;
  condition: 'New' | 'Foreign Used' | 'Refurbished' | 'Used';
  availability: 'In Stock' | 'Low Stock' | 'Made to Order' | 'Out of Stock';
  stock_quantity?: number;
  warranty?: string;
  location: string;
  state?: string;
  city?: string;
  image?: string;
  images?: string[];
  seller_name: string;
  seller_phone?: string;
  seller_whatsapp?: string;
  seller_verified?: boolean;
  source_marketplace: string; // e.g. 'MatthOrg Verified Seller', 'Jiji.ng', 'Admin Catalogue'
  product_url?: string; // Preserved original Jiji URL for external marketplace listings
  date_collected?: string;
  last_verified_at?: string;
  verification_status: 'pending' | 'approved' | 'rejected' | 'verified';
  is_published: boolean;
  sku?: string;
  rating?: number;
  clicks?: number;
  impressions?: number;
  enquiries_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface SponsoredCampaign {
  id: string;
  advertiser_name: string;
  campaign_title: string;
  target_type: 'product' | 'service' | 'business';
  target_id: string;
  target_categories: string[];
  target_locations: string[];
  keywords: string[];
  cpc_bid: number; // cost per click in currency
  budget_total: number;
  budget_spent: number;
  min_relevance_score: number; // 0-100
  status: 'active' | 'paused' | 'exhausted' | 'ended';
  impressions: number;
  clicks: number;
  enquiries: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at?: string;
}

export interface AdControlConfig {
  global_ads_enabled: boolean;
  max_sponsored_per_response: number;
  min_relevance_threshold: number; // 0-100
  ad_frequency: 'every_matching_response' | 'high_intent_only' | 'capped_per_session';
  allow_over_budget_ads: boolean;
  updated_at?: string;
}

export interface ProductEnquiry {
  id: string;
  product_id: string;
  product_name: string;
  listing_type: CatalogListingType;
  business_id?: string;
  seller_name: string;
  seller_phone?: string;
  product_url?: string;
  customer_name: string;
  customer_phone: string;
  customer_whatsapp?: string;
  customer_email?: string;
  customer_location?: string;
  message: string;
  quantity?: number;
  campaign_id?: string;
  status: 'new' | 'contacted' | 'quoted' | 'converted';
  created_at: string;
}

export interface ProductComparisonDimension {
  label: string;
  values: Array<{
    productId: string;
    value: string;
    highlight?: boolean;
  }>;
}

export interface ProductComparisonMatrix {
  title: string;
  products: CatalogProduct[];
  dimensions: ProductComparisonDimension[];
  relationshipNote: string; // Clearly states whether items are identical models or alternatives
  recommendationSummary: string;
}

export type UniversalDomainCategory =
  | 'products'
  | 'artisans'
  | 'repairs'
  | 'digital_creative'
  | 'professional_services'
  | 'business_commercial'
  | 'general';

export type ApprovalStatus =
  | 'Pending Analysis'
  | 'Needs Review'
  | 'Approved'
  | 'Rejected'
  | 'Duplicate'
  | 'Archived';

export type ServicePricingType =
  | 'Fixed'
  | 'Starting From'
  | 'Negotiable'
  | 'Inspection Required'
  | 'Request a Quote';

export interface ServiceOffering {
  id: string;
  business_id: string; // Points to unified DirectoryBusiness or registered BusinessProfile ID
  business_name: string;
  provider_type: 'business' | 'artisan' | 'professional' | 'repair_technician' | 'agency' | 'supplier' | 'merchant';
  service_name: string;
  service_category: string;
  domain: UniversalDomainCategory;
  description: string;
  sub_services?: string[];
  pricing_type: ServicePricingType;
  price_min?: number;
  price_max?: number;
  currency?: string;
  estimated_turnaround?: string;
  locations_covered: string[];
  state?: string;
  city?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  keywords?: string[];
  is_verified?: boolean;
  approval_status: ApprovalStatus;
  source_type?: string;
  last_verified_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface DirectoryBusiness {
  id: string;
  linked_business_id?: string;
  business_name: string;
  owner_full_name?: string;
  provider_type: 'business' | 'artisan' | 'professional' | 'repair_technician' | 'agency' | 'supplier' | 'merchant';
  industry: string;
  specialization: string;
  description: string;
  tagline?: string;
  logo?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  cac_number?: string;
  address?: string;
  city?: string;
  lga?: string;
  state?: string;
  country?: string;
  locations_served: string[];
  branches?: Array<{ branch_name: string; address: string; city: string; state: string }>;
  contacts?: Array<{ name?: string; role?: string; phone: string; whatsapp?: string; email?: string }>;
  categories_offered: string[];
  keywords?: string[];
  working_hours?: string;
  delivery_available?: boolean;
  is_registered: boolean;
  is_verified: boolean;
  approval_status: ApprovalStatus;
  source_type: string;
  source_url?: string;
  last_verified_at?: string;
  merged_into_id?: string;
  rating?: number;
  vouches_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface MatchedServiceCandidate {
  service: ServiceOffering;
  business?: DirectoryBusiness;
  matchScore: number;
  matchReasons: string[];
  isVerified: boolean;
}

export interface DataImportRecord {
  id: string;
  job_id: string;
  record_type: 'business' | 'service' | 'product' | 'artisan' | 'mixed_entity';
  extracted_payload: {
    business_name?: string;
    provider_type?: DirectoryBusiness['provider_type'];
    industry?: string;
    specialization?: string;
    description?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    website?: string;
    address?: string;
    city?: string;
    state?: string;
    locations_served?: string[];
    working_hours?: string;
    delivery_available?: boolean;
    services?: Array<{
      service_name: string;
      service_category?: string;
      domain?: UniversalDomainCategory;
      description?: string;
      pricing_type?: ServicePricingType;
      price_min?: number;
      price_max?: number;
      estimated_turnaround?: string;
      sub_services?: string[];
    }>;
    products?: Array<{
      name: string;
      brand?: string;
      model?: string;
      category?: string;
      price?: number;
      currency?: string;
      condition?: CatalogProduct['condition'];
      availability?: CatalogProduct['availability'];
      description?: string;
      specs?: Record<string, string>;
      warranty?: string;
      product_url?: string;
    }>;
  };
  missing_fields: string[];
  duplicate_candidate_id?: string;
  duplicate_candidate_name?: string;
  duplicate_candidate_type?: 'business' | 'product' | 'artisan';
  duplicate_similarity?: number;
  status: ApprovalStatus;
  target_entity_id?: string;
  reviewer_notes?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface DataImportJob {
  id: string;
  input_type: 'raw_text' | 'csv' | 'json' | 'url' | 'single_entry';
  source_name: string;
  source_url?: string;
  raw_input: string;
  status: ApprovalStatus;
  total_extracted: number;
  approved_count: number;
  ai_model_used?: string;
  records: DataImportRecord[];
  created_at: string;
  updated_at?: string;
}

export type FulfilmentStatus =
  | 'New'
  | 'Awaiting Sourcing'
  | 'Processing'
  | 'Matching Providers Found'
  | 'Customer Contacted'
  | 'Fulfilled'
  | 'Unfulfilled';

export interface FulfilmentMatch {
  id: string;
  provider_id: string;
  provider_name: string;
  provider_phone?: string;
  provider_type: string;
  match_note?: string;
  quoted_price?: number;
  status: 'Proposed' | 'Sent to Customer' | 'Accepted' | 'Declined';
  created_at: string;
}

export interface FulfilmentRequest {
  id: string;
  request_number: string;
  customer_request_id?: string;
  conversation_session_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_whatsapp?: string;
  customer_email?: string;
  request_summary: string;
  request_type: UniversalDomainCategory;
  category?: string;
  location?: string;
  state?: string;
  city?: string;
  budget_max?: number;
  budget_formatted?: string;
  urgency?: 'immediate' | 'within_7_days' | 'within_30_days' | 'flexible';
  details?: string;
  status: FulfilmentStatus;
  assigned_admin?: string;
  matches: FulfilmentMatch[];
  converted_lead_id?: string;
  converted_quote_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface SearchSynonymEntry {
  id: string;
  phrase: string;
  canonical_terms: string[];
  intent_hint?: string;
  category_hint?: string;
}

export interface DiscoveryConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  products?: CatalogProduct[];
  sponsoredProducts?: Array<CatalogProduct & { campaign_id: string; relevanceScore: number }>;
  comparison?: ProductComparisonMatrix;
  services?: MatchedServiceCandidate[];
  professionals?: MatchedProfessionalCandidate[];
  followUpQuestions?: string[];
  needsLocation?: boolean;
  noResultsAction?: {
    canBroaden: boolean;
    broadenPrompt?: string;
    canRequestSourcing: boolean;
    serviceOrProductNeeded?: string;
    location?: string;
    category?: string;
    requestType?: UniversalDomainCategory;
  };
  extractedContext?: {
    budgetMax?: number;
    location?: string;
    category?: string;
    domain?: UniversalDomainCategory;
    requirements?: string[];
    lastKeywords?: string[];
    lastIntent?: string;
  };
  storedRequest?: {
    id: string;
    request_number: string;
    isNew: boolean;
    totalFound: number;
    needsMatch: boolean;
  };
}

export interface DiscoveryConversationSession {
  id: string;
  title: string;
  updated_at: string;
  created_at: string;
  messages: DiscoveryConversationMessage[];
  accumulatedContext?: {
    budgetMax?: number;
    location?: string;
    category?: string;
    domain?: UniversalDomainCategory;
    requirements?: string[];
    lastKeywords?: string[];
    lastIntent?: string;
  };
}

export interface QuoteItem {
  id: string;
  product_id?: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  unit?: string;
  total: number;
  isCatalogueMatch?: boolean;
  image?: string;
}

export interface InvoiceItem {
  id: string;
  product_id?: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  unit?: string;
  total: number;
  image?: string;
}

export interface QuoteTemplateItem {
  id: string;
  product_id?: string;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  unit?: string;
}

export interface QuoteTemplate {
  id: string;
  name: string;
  description: string;
  category?: string;
  items: QuoteTemplateItem[];
}

export type QuoteStatus = 'Draft' | 'Sent' | 'Awaiting Response' | 'Accepted' | 'Rejected' | 'Expired';

export interface Quote {
  id: string;
  quote_number: string; // e.g. MAT-Q-000124
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_whatsapp: string;
  customer_email: string;
  customer_address: string;
  status: QuoteStatus;
  issue_date: string;
  expiry_date: string;
  items: QuoteItem[];
  subtotal: number;
  discount_type: 'percent' | 'fixed';
  discount_val: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string;
  terms: string;
  follow_up_id?: string;
  converted_invoice_id?: string;
  design_template?: DocumentDesignTemplate;
  design_color?: string;
  hide_fields?: string[];
  created_at: string;
}

export type InvoiceStatus = 'Draft' | 'Sent' | 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue';

export interface Invoice {
  id: string;
  invoice_number: string; // e.g. MAT-INV-000082
  quote_id?: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_whatsapp: string;
  customer_email: string;
  customer_address: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  items: InvoiceItem[];
  subtotal: number;
  discount_type: 'percent' | 'fixed';
  discount_val: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  amount_paid: number;
  notes: string;
  payment_details: string;
  design_template?: DocumentDesignTemplate;
  design_color?: string;
  hide_fields?: string[];
  created_at: string;
}

export type FollowUpStatus = 'pending' | 'completed' | 'cancelled' | 'snoozed';

export interface FollowUp {
  id: string;
  business_id?: string;
  quote_id?: string;
  quote_number?: string;
  lead_id?: string;
  lead_number?: string;
  invoice_id?: string;
  invoice_number?: string;
  customer_id?: string;
  customer_name: string;
  customer_whatsapp?: string;
  customer_phone?: string;
  customer_email?: string;
  title: string;
  amount: number;
  reminder_date: string;
  status: FollowUpStatus;
  priority?: 'high' | 'medium' | 'low';
  channel?: 'whatsapp' | 'call' | 'email' | 'sms';
  task_type?: 'quote_followup' | 'lead_contact' | 'lead_qualify' | 'invoice_overdue' | 'invoice_due' | 'customer_retention' | 'deal_stale';
  target_type?: 'quote' | 'lead' | 'invoice' | 'customer';
  sequence_number?: number;
  generated_message?: string;
  approved_message?: string;
  sent_at?: string;
  completed_at?: string;
  snoozed_until?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

export interface DailyBriefingItem {
  id: string;
  type: 'quote' | 'lead' | 'invoice' | 'customer';
  title: string;
  entityNumber: string;
  customerName: string;
  customer_name?: string;
  amount: number;
  daysAgo?: number;
  reason: string;
  recommendedAction: string;
  targetId: string;
  phone?: string;
  whatsapp?: string;
}

export interface DailyBriefing {
  greeting: string;
  totalAttentionItems: number;
  quotesNeedingFollowupCount: number;
  leadsGoingColdCount: number;
  invoicesOverdueCount: number;
  potentialValueRequiringAttention: number;
  priorityTitle: string;
  priorityDescription: string;
  topActionableItem?: DailyBriefingItem;
  topItems: DailyBriefingItem[];
  topFollowUpItems: DailyBriefingItem[];
}

export interface AIUsageState {
  month: string; // YYYY-MM
  count: number;
}

export interface MatthewToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
  result?: any;
}

export interface MatthewCitation {
  type: 'lead' | 'deal' | 'invoice' | 'customer' | 'metric' | 'marketplace';
  title: string;
  detail?: string;
  id?: string;
}

export interface MatthewMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  is_out_of_domain?: boolean;
  tool_calls_executed?: string[];
  citations?: MatthewCitation[];
  model?: string;
  engine?: 'openai' | 'gemini' | 'local';
}

export interface AppState {
  user: User;
  business: BusinessProfile;
  leads: Lead[];
  customers: Customer[];
  products: Product[];
  templates: QuoteTemplate[];
  quotes: Quote[];
  invoices: Invoice[];
  followups: FollowUp[];
  aiUsage: AIUsageState;
  matthewMessages?: MatthewMessage[];
}

export interface ArtisanRecommendation {
  id: string;
  profile_type?: 'artisan' | 'professional';
  artisan_name: string; // Business name or individual artisan name
  trade_category: string; // e.g. 'Electrician', 'Plumber', 'Solar Engineer', 'Chef', 'Baker', etc.
  phone: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  cac_number?: string;
  state: string; // e.g. 'Lagos', 'Abuja (FCT)', 'Rivers', etc.
  town: string; // e.g. 'Lekki', 'Ikeja', 'Maitama', 'Port Harcourt', etc.
  services_offered: string[]; // Specific services offered (e.g. ['Inverter Installation', 'Battery Maintenance'])
  level?: 'master_artisan' | 'experienced' | 'certified' | 'rising_talent';
  recommender_name: string; // Name of client recommending
  recommender_relationship?: string; // e.g. 'Client / Homeowner', 'Project Manager', 'Regular Customer'
  work_done: string; // Description of service delivered
  recommendation_note: string; // Why they recommend them
  rating: number; // 1 to 5
  pricing_tier?: 'fair' | 'budget_friendly' | 'premium_quality';
  vouches_count: number; // Number of community vouches
  verified?: boolean;
  validation_status?: 'pending' | 'validated' | 'rejected' | 'claimed';
  outreach_status?: 'not_contacted' | 'whatsapp_sent' | 'sms_sent' | 'email_sent' | 'claimed';
  outreach_sent_at?: string;
  outreach_channel?: 'whatsapp' | 'sms' | 'email';
  outreach_notes?: string;
  claim_token?: string;
  photo_url?: string;
  subscription_plan?: string;
  is_paid?: boolean;
  created_at: string;
  updated_at?: string;
}
