/**
 * MATTHORG — MASS ASSIGNMENT & PRIVILEGE ESCALATION PROTECTION
 *
 * Security Rules:
 * 1. Never save a raw request body (req.body) straight into the database.
 * 2. Only fields explicitly listed in an endpoint's allowlist are accepted.
 * 3. Privileged fields (role, isAdmin, plan, userId/user_id, verification & billing authority)
 *    can NEVER be set by user-supplied request bodies.
 */

export const FORBIDDEN_PRIVILEGED_FIELDS = [
  'role',
  'user_role',
  'userRole',
  'roles',
  'isAdmin',
  'is_admin',
  'admin',
  'isSuperAdmin',
  'is_super_admin',
  'permissions',
  'plan',
  'userPlan',
  'user_plan',
  'subscription_plan',
  'subscriptionPlan',
  'subscription_status',
  'subscriptionStatus',
  'subscription_expires_at',
  'subscriptionExpiresAt',
  'subscription_current_period_end',
  'subscription_started_at',
  'plan_activated_at',
  'is_paid',
  'isPaid',
  'userId',
  'user_id',
  'owner_user_id',
  'ownerId',
  'owner_id',
  'account_id',
  'accountId',
] as const;

const FORBIDDEN_SET = new Set<string>(FORBIDDEN_PRIVILEGED_FIELDS);
const PROTO_KEYS = new Set<string>(['__proto__', 'constructor', 'prototype']);

export function isPlainObject(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Picks ONLY explicitly allowed fields from untrusted input,
 * while strictly ignoring prototype keys and any forbidden privileged fields.
 */
export function pickAllowedFields<T extends Record<string, any>>(
  input: unknown,
  allowedFields: readonly string[],
  extraForbidden: readonly string[] = []
): Partial<T> {
  if (!isPlainObject(input)) return {};

  const blocked = new Set<string>([...FORBIDDEN_SET, ...extraForbidden]);
  const out: Record<string, any> = {};

  for (const key of allowedFields) {
    if (PROTO_KEYS.has(key) || blocked.has(key)) continue;
    if (Object.prototype.hasOwnProperty.call(input, key) && input[key] !== undefined) {
      out[key] = input[key];
    }
  }

  return out as Partial<T>;
}

/**
 * Deeply strips forbidden privileged fields (role, isAdmin, plan, userId/user_id, etc.)
 * from nested payloads or arrays before persistence.
 */
export function stripForbiddenFieldsDeep<T>(value: T, extraForbidden: readonly string[] = []): T {
  const blocked = new Set<string>([...FORBIDDEN_SET, ...extraForbidden]);

  if (Array.isArray(value)) {
    return value.map((item) => stripForbiddenFieldsDeep(item, extraForbidden)) as unknown as T;
  }

  if (isPlainObject(value)) {
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      if (PROTO_KEYS.has(key) || blocked.has(key)) continue;
      clean[key] = stripForbiddenFieldsDeep(val, extraForbidden);
    }
    return clean as T;
  }

  return value;
}

// ============================================================================
// EXPLICIT FIELD ALLOWLISTS PER RESOURCE
// ============================================================================

export const ALLOWED_USER_REGISTRATION_FIELDS = [
  'email',
  'name',
  'business_name',
  'phone',
  'state',
  'city',
] as const;

export const ALLOWED_USER_PROFILE_UPDATE_FIELDS = [
  'name',
  'business_name',
  'phone',
  'state',
  'city',
] as const;

export const ALLOWED_STORE_BUSINESS_FIELDS = [
  'business_name',
  'owner_full_name',
  'industry',
  'specialization',
  'state',
  'lga',
  'city',
  'cac_number',
  'website',
  'tagline',
  'logo',
  'phone',
  'whatsapp',
  'email',
  'address',
  'country',
  'currency',
  'tax_name',
  'tax_rate',
  'categories_offered',
  'locations_served',
  'is_public',
  'director_name',
  'nin_number',
  'id_type',
  'cac_type',
  'trade_certification',
  'trade_license_number',
  'proof_of_address_url',
  'cac_document_url',
  'id_document_url',
  'working_hours',
  'payment_details',
  'terms',
  'invoice_design',
  'design_color',
  'show_logo_on_docs',
  'show_address_on_docs',
  'show_tax_on_docs',
  'show_banking_on_docs',
  'show_signature_on_docs',
  'show_terms_on_docs',
] as const;

export const ALLOWED_PRODUCT_FIELDS = [
  'business_id',
  'name',
  'brand',
  'model',
  'category',
  'description',
  'specs',
  'variations',
  'price',
  'currency',
  'unit',
  'condition',
  'availability',
  'stock_quantity',
  'warranty',
  'location',
  'state',
  'city',
  'image',
  'images',
  'seller_name',
  'seller_phone',
  'seller_whatsapp',
  'is_published',
  'sku',
] as const;

export const ALLOWED_ADMIN_PRODUCT_FIELDS = [
  ...ALLOWED_PRODUCT_FIELDS,
  'listing_type',
  'source_marketplace',
  'product_url',
  'date_collected',
  'verification_status',
  'rating',
] as const;

export const ALLOWED_CAMPAIGN_UPDATE_FIELDS = [
  'advertiser_name',
  'campaign_title',
  'target_type',
  'target_id',
  'target_categories',
  'target_locations',
  'keywords',
  'cpc_bid',
  'budget_total',
  'min_relevance_score',
  'status',
  'start_date',
  'end_date',
] as const;

export const ALLOWED_AD_CONTROL_FIELDS = [
  'global_ads_enabled',
  'max_sponsored_per_response',
  'min_relevance_threshold',
  'ad_frequency',
  'allow_over_budget_ads',
] as const;

export const ALLOWED_ENQUIRY_UPDATE_FIELDS = [
  'status',
  'message',
  'quantity',
  'customer_location',
] as const;

export const ALLOWED_DIRECTORY_BUSINESS_FIELDS = [
  'linked_business_id',
  'business_name',
  'provider_type',
  'industry',
  'specialization',
  'description',
  'tagline',
  'logo',
  'phone',
  'whatsapp',
  'email',
  'website',
  'cac_number',
  'address',
  'city',
  'state',
  'country',
  'locations_served',
  'branches',
  'contacts',
  'categories_offered',
  'keywords',
  'working_hours',
  'delivery_available',
] as const;

export const ALLOWED_ADMIN_DIRECTORY_BUSINESS_FIELDS = [
  ...ALLOWED_DIRECTORY_BUSINESS_FIELDS,
  'approval_status',
  'is_verified',
  'source_type',
  'source_url',
] as const;

export const ALLOWED_SERVICE_FIELDS = [
  'business_id',
  'business_name',
  'provider_type',
  'service_name',
  'service_category',
  'domain',
  'description',
  'sub_services',
  'pricing_type',
  'price_min',
  'price_max',
  'currency',
  'estimated_turnaround',
  'locations_covered',
  'state',
  'city',
  'phone',
  'whatsapp',
  'email',
  'website',
  'keywords',
] as const;

export const ALLOWED_ADMIN_SERVICE_FIELDS = [
  ...ALLOWED_SERVICE_FIELDS,
  'approval_status',
  'is_verified',
  'source_type',
] as const;

export const ALLOWED_DEMAND_CAMPAIGN_UPDATE_FIELDS = [
  'campaign_status',
  'campaign_channel',
  'campaign_launched_at',
  'ad_headline',
  'ad_copy_whatsapp',
  'ad_copy_social',
  'ad_copy_sms',
  'connected_artisan_id',
  'connected_artisan_name',
  'connected_artisan_phone',
  'connected_at',
  'notes',
] as const;

export const ALLOWED_RECOMMENDATION_UPDATE_FIELDS = [
  'artisan_name',
  'trade_category',
  'phone',
  'whatsapp',
  'email',
  'address',
  'cac_number',
  'state',
  'town',
  'services_offered',
  'level',
  'work_done',
  'recommendation_note',
  'rating',
  'pricing_tier',
  'validation_status',
  'outreach_status',
  'outreach_channel',
  'outreach_sent_at',
  'verified',
  'photo_url',
] as const;

export const ALLOWED_FULFILMENT_UPDATE_FIELDS = [
  'status',
  'request_summary',
  'request_type',
  'category',
  'location',
  'state',
  'city',
  'budget_max',
  'budget_formatted',
  'urgency',
  'details',
] as const;

export const ALLOWED_GROWTH_LEAD_FIELDS = [
  'business_name',
  'category',
  'sub_category',
  'description',
  'phone',
  'whatsapp',
  'email',
  'website',
  'address',
  'city',
  'state',
  'country',
  'source',
  'source_url',
  'rating',
  'review_count',
  'services_offered',
  'pipeline_stage',
  'research_report',
  'qualification_score',
  'enriched_contact',
  'outreach_history',
  'notes',
] as const;

export const ALLOWED_DATA_HUB_EDIT_FIELDS = [
  'business_name',
  'provider_type',
  'industry',
  'specialization',
  'description',
  'phone',
  'whatsapp',
  'email',
  'website',
  'address',
  'city',
  'state',
  'locations_served',
  'working_hours',
  'delivery_available',
  'services',
  'products',
] as const;

export const ALLOWED_CUSTOMER_REQUEST_CREATE_FIELDS = [
  'id',
  'request_number',
  'customer_name',
  'phone',
  'whatsapp',
  'email',
  'location',
  'state',
  'city',
  'service_required',
  'service_category',
  'budget_min',
  'budget_max',
  'budget_formatted',
  'timeline',
  'details',
  'conversation_session_id',
  'source',
] as const;

export const ALLOWED_DEMAND_CAMPAIGN_CREATE_FIELDS = [
  'request_id',
  'request_number',
  'service_required',
  'location',
  'state',
  'town',
  'customer_name',
  'customer_phone',
  'customer_whatsapp',
  'customer_email',
  'budget_formatted',
  'timeline',
  'details',
  'ad_headline',
] as const;

export const ALLOWED_RECOMMENDATION_CREATE_FIELDS = [
  'artisan_name',
  'trade_category',
  'phone',
  'whatsapp',
  'state',
  'town',
  'services_offered',
  'level',
  'recommender_name',
  'recommender_relationship',
  'work_done',
  'recommendation_note',
  'rating',
  'pricing_tier',
  'photo_url',
] as const;

export const ALLOWED_UNIVERSAL_LISTING_FIELDS = [
  'business_name',
  'full_name',
  'profession',
  'industry',
  'provider_type',
  'phone',
  'state',
  'lga',
  'town_city',
  'update_existing',
  'supabase_business_id',
  'referral_code',
  'referral_source',
] as const;

