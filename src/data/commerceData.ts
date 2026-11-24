import * as XLSX from 'xlsx';
import { authFetch } from '../lib/supabase';
import type {
  AdControlConfig,
  CatalogProduct,
  CustomerRequest,
  DataImportJob,
  DataImportRecord,
  DirectoryBusiness,
  FulfilmentRequest,
  MatchedProfessionalCandidate,
  MatchedServiceCandidate,
  ProductComparisonMatrix,
  ProductEnquiry,
  PublicProfessionalProfile,
  SearchSynonymEntry,
  ServiceOffering,
  SponsoredCampaign,
  UniversalDomainCategory,
} from '../types';

export async function discoverWithMatthew(payload: {
  message: string;
  sessionId?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  accumulatedContext?: {
    budgetMax?: number;
    location?: string;
    category?: string;
    domain?: UniversalDomainCategory;
    requirements?: string[];
    lastKeywords?: string[];
    lastIntent?: string;
  };
  compareProductIds?: string[];
  publicProfessionals?: PublicProfessionalProfile[];
}): Promise<{
  success: boolean;
  reply: string;
  intent: 'product_search' | 'product_compare' | 'service_discovery' | 'hybrid' | 'clarify';
  domain?: UniversalDomainCategory;
  needsLocation?: boolean;
  products: CatalogProduct[];
  sponsoredProducts: Array<CatalogProduct & { campaign_id: string; relevanceScore: number }>;
  comparison?: ProductComparisonMatrix;
  services?: MatchedServiceCandidate[];
  professionals: MatchedProfessionalCandidate[];
  followUpQuestions: string[];
  extractedContext: {
    budgetMax?: number;
    location?: string;
    category?: string;
    domain?: UniversalDomainCategory;
    requirements?: string[];
    lastKeywords?: string[];
    lastIntent?: string;
  };
  noResultsAction?: {
    canBroaden: boolean;
    broadenPrompt?: string;
    canRequestSourcing: boolean;
    serviceOrProductNeeded?: string;
    location?: string;
    category?: string;
    requestType?: UniversalDomainCategory;
  };
  storedRequest?: {
    id: string;
    request_number: string;
    isNew: boolean;
    totalFound: number;
    needsMatch: boolean;
  };
}> {
  const res = await fetch('/api/matthew/discover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to query Matthew AI.');
  }
  return data;
}

export async function fetchCatalogProducts(params?: {
  businessId?: string;
  includeUnpublished?: boolean;
}): Promise<CatalogProduct[]> {
  const qs = new URLSearchParams();
  if (params?.businessId) qs.set('businessId', params.businessId);
  if (params?.includeUnpublished) qs.set('includeUnpublished', 'true');
  const fetcher = params?.includeUnpublished ? authFetch : fetch;
  const res = await fetcher(`/api/commerce/products?${qs.toString()}`);
  const data = await res.json();
  return Array.isArray(data?.data) ? data.data : [];
}

export async function saveCatalogProduct(payload: Partial<CatalogProduct> & { name: string }): Promise<CatalogProduct> {
  const res = await authFetch('/api/commerce/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to save product.');
  return data.data;
}

export async function updateCatalogProduct(id: string, updates: Partial<CatalogProduct>): Promise<CatalogProduct> {
  const res = await authFetch(`/api/commerce/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to update product.');
  return data.data;
}

export async function removeCatalogProduct(id: string): Promise<boolean> {
  const res = await authFetch(`/api/commerce/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const data = await res.json();
  return Boolean(data?.success);
}

export async function removeCatalogProductsBulk(ids: string[]): Promise<number> {
  const res = await authFetch('/api/commerce/products/bulk-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to delete selected products.');
  return Number(data?.deletedCount) || 0;
}

export async function importProductsBatch(rows: Record<string, any>[], defaultSource = 'Jiji.ng') {
  const res = await authFetch('/api/commerce/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows, defaultSource }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Bulk import failed.');
  return data;
}

export async function parseSpreadsheetFile(file: File): Promise<Record<string, any>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];
  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
}

export async function fetchSponsoredCampaigns(): Promise<{
  campaigns: SponsoredCampaign[];
  controls: AdControlConfig;
}> {
  const res = await authFetch('/api/commerce/campaigns');
  const data = await res.json();
  return {
    campaigns: Array.isArray(data?.data) ? data.data : [],
    controls: data?.controls || {
      global_ads_enabled: true,
      max_sponsored_per_response: 1,
      min_relevance_threshold: 45,
      ad_frequency: 'every_matching_response',
      allow_over_budget_ads: false,
    },
  };
}

export async function saveSponsoredCampaign(payload: Partial<SponsoredCampaign>): Promise<SponsoredCampaign> {
  const res = await authFetch('/api/commerce/campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to save campaign.');
  return data.data;
}

export async function updateSponsoredCampaign(id: string, updates: Partial<SponsoredCampaign>): Promise<SponsoredCampaign> {
  const res = await authFetch(`/api/commerce/campaigns/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to update campaign.');
  return data.data;
}

export async function deleteSponsoredCampaign(id: string): Promise<void> {
  await authFetch(`/api/commerce/campaigns/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function updateAdControls(updates: Partial<AdControlConfig>): Promise<AdControlConfig> {
  const res = await authFetch('/api/commerce/ad-controls', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  return data.data;
}

export async function trackCommerceEvent(payload: {
  productId?: string;
  campaignId?: string;
  event: 'impression' | 'click' | 'enquiry';
}): Promise<void> {
  try {
    await fetch('/api/commerce/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // non-blocking analytics beacon
  }
}

export async function fetchProductEnquiries(businessId?: string): Promise<ProductEnquiry[]> {
  const qs = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
  const res = await authFetch(`/api/commerce/enquiries${qs}`);
  const data = await res.json();
  return Array.isArray(data?.data) ? data.data : [];
}

export async function submitProductEnquiry(payload: {
  product_id: string;
  product_name: string;
  listing_type: CatalogProduct['listing_type'];
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
}): Promise<ProductEnquiry> {
  const res = await fetch('/api/commerce/enquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to send enquiry.');
  return data.data;
}

export async function updateEnquiryStatus(id: string, status: ProductEnquiry['status']): Promise<ProductEnquiry> {
  const res = await authFetch(`/api/commerce/enquiries/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  return data.data;
}

export async function fetchCommerceAnalytics() {
  const res = await authFetch('/api/commerce/analytics');
  return res.json();
}

export async function fetchCategories(): Promise<string[]> {
  const res = await fetch('/api/commerce/categories');
  const data = await res.json();
  return Array.isArray(data?.data) ? data.data : [];
}

export async function saveCategoriesList(categories: string[]): Promise<string[]> {
  const res = await authFetch('/api/commerce/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categories }),
  });
  const data = await res.json();
  return Array.isArray(data?.data) ? data.data : [];
}

export async function fetchAdminLeads() {
  const res = await authFetch('/api/admin/leads');
  const data = await res.json();
  return Array.isArray(data?.data) ? data.data : [];
}

export async function uploadAdminLeads(leads: any[]) {
  const res = await authFetch('/api/admin/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ leads }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to upload leads.');
  return data;
}

export async function deleteAdminLead(id: string) {
  await authFetch(`/api/admin/leads/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function uploadBulkArtisans(artisans: any[]) {
  const res = await authFetch('/api/admin/artisans/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ artisans }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to upload artisans.');
  return data;
}

// ============================================================================
// MATTHORG DATA HUB, FULFILMENT & UNIFIED DIRECTORY CLIENTS
// ============================================================================

export async function analyzeRawDataHubInput(payload: {
  rawText: string;
  inputType?: DataImportJob['input_type'];
  sourceName?: string;
  sourceUrl?: string;
}): Promise<DataImportJob> {
  const res = await authFetch('/api/admin/data-hub/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to analyse raw input.');
  return data.data;
}

export async function fetchDataHubJobs(): Promise<DataImportJob[]> {
  const res = await authFetch('/api/admin/data-hub/jobs');
  const data = await res.json();
  return Array.isArray(data?.data) ? data.data : [];
}

export async function commitDataHubRecord(payload: {
  jobId: string;
  recordId?: string;
  action?: 'approve_new' | 'merge' | 'reject' | 'archive' | 'save_draft';
  editedPayload?: DataImportRecord['extracted_payload'];
  mergeTargetBusinessId?: string;
  reviewerNotes?: string;
  approveAll?: boolean;
}) {
  const res = await authFetch('/api/admin/data-hub/commit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to commit Data Hub record.');
  return data;
}

export async function deleteDataHubJob(id: string): Promise<void> {
  await authFetch(`/api/admin/data-hub/jobs/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function fetchFulfilmentRequests(): Promise<FulfilmentRequest[]> {
  const res = await authFetch('/api/fulfilment/requests');
  const data = await res.json();
  return Array.isArray(data?.data) ? data.data : [];
}

export async function createFulfilmentRequest(payload: {
  customer_name: string;
  customer_phone: string;
  customer_whatsapp?: string;
  customer_email?: string;
  request_summary: string;
  request_type?: UniversalDomainCategory;
  category?: string;
  location?: string;
  state?: string;
  city?: string;
  budget_max?: number;
  budget_formatted?: string;
  urgency?: FulfilmentRequest['urgency'];
  details?: string;
  conversation_session_id?: string;
}): Promise<FulfilmentRequest> {
  const res = await fetch('/api/fulfilment/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to register fulfilment request.');
  return data.data;
}

export async function updateFulfilmentRequest(
  id: string,
  updates: Partial<FulfilmentRequest> & {
    attachMatch?: {
      provider_id?: string;
      provider_name: string;
      provider_phone?: string;
      provider_type?: string;
      match_note?: string;
      quoted_price?: number;
      status?: 'Proposed' | 'Sent to Customer' | 'Accepted' | 'Declined';
    };
  }
): Promise<FulfilmentRequest> {
  const res = await authFetch(`/api/fulfilment/requests/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to update fulfilment request.');
  return data.data;
}

export async function deleteFulfilmentRequest(id: string): Promise<void> {
  await authFetch(`/api/fulfilment/requests/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function fetchDirectoryBusinesses(includeUnapproved = false): Promise<DirectoryBusiness[]> {
  const fetcher = includeUnapproved ? authFetch : fetch;
  const res = await fetcher(`/api/commerce/businesses${includeUnapproved ? '?includeUnapproved=true' : ''}`);
  const data = await res.json();
  return Array.isArray(data?.data) ? data.data : [];
}

export async function saveDirectoryBusiness(payload: Partial<DirectoryBusiness> & { business_name: string }): Promise<DirectoryBusiness> {
  const res = await authFetch('/api/commerce/businesses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to save directory business.');
  return data.data;
}

export async function syncBusinessProfileToDirectory(businessProfile: any): Promise<void> {
  try {
    await authFetch('/api/commerce/businesses/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(businessProfile),
    });
  } catch {
    // Non-blocking sync
  }
}

export async function fetchServiceOfferings(businessId?: string, includeUnapproved = false): Promise<ServiceOffering[]> {
  const qs = new URLSearchParams();
  if (businessId) qs.set('businessId', businessId);
  if (includeUnapproved) qs.set('includeUnapproved', 'true');
  const fetcher = includeUnapproved ? authFetch : fetch;
  const res = await fetcher(`/api/commerce/services?${qs.toString()}`);
  const data = await res.json();
  return Array.isArray(data?.data) ? data.data : [];
}

export async function saveServiceOffering(payload: Partial<ServiceOffering> & { business_id: string; service_name: string }): Promise<ServiceOffering> {
  const res = await authFetch('/api/commerce/services', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to save service offering.');
  return data.data;
}

export async function fetchSearchSynonyms(): Promise<SearchSynonymEntry[]> {
  const res = await fetch('/api/commerce/synonyms');
  const data = await res.json();
  return Array.isArray(data?.data) ? data.data : [];
}

export async function saveSearchSynonymEntry(payload: {
  phrase: string;
  canonical_terms: string[];
  intent_hint?: string;
  category_hint?: string;
}): Promise<SearchSynonymEntry[]> {
  const res = await authFetch('/api/commerce/synonyms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return Array.isArray(data?.data) ? data.data : [];
}

export async function refreshMarketplaceRequestsWithMatthew(payload?: {
  businessId?: string;
  businessName?: string;
  industry?: string;
  specialization?: string;
  categories?: string[];
  location?: string;
  state?: string;
  city?: string;
}): Promise<{
  success: boolean;
  requests: CustomerRequest[];
  newlyPostedCount: number;
  totalRequests: number;
  relevantCount: number;
  summary: string;
}> {
  const res = await authFetch('/api/commerce/marketplace/refresh-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Matthew database refresh failed.');
  return data;
}


