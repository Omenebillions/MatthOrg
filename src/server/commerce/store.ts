import fs from 'fs';
import path from 'path';
import type {
  AdControlConfig,
  CatalogProduct,
  CustomerRequest,
  CustomerRequestStatus,
  DataImportJob,
  DirectoryBusiness,
  FulfilmentRequest,
  ProductEnquiry,
  SearchSynonymEntry,
  ServiceOffering,
  SponsoredCampaign,
  UniversalDomainCategory,
} from '../../types';
import { extractNigerianPhoneKey, nigerianPhonesMatch } from '../../utils/nigerianPhone';

const DATA_DIR = path.join(process.cwd(), 'data');
const DEFAULT_DATA_FILE = path.join(DATA_DIR, 'mathorg_store.json');

function resolveDataFilePath(): string {
  if (process.env.NODE_ENV === 'test' && process.env.MATTHORG_STORE_FILE) {
    return path.resolve(process.env.MATTHORG_STORE_FILE);
  }
  return DEFAULT_DATA_FILE;
}

export function readStoreFile(): Record<string, any> {
  try {
    const filePath = resolveDataFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[CommerceStore] Error reading mathorg_store.json:', err);
  }
  return {};
}

export function writeStoreFile(data: Record<string, any>): void {
  try {
    const filePath = resolveDataFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[CommerceStore] Error writing mathorg_store.json:', err);
  }
}

export const DEFAULT_AD_CONTROLS: AdControlConfig = {
  global_ads_enabled: true,
  max_sponsored_per_response: 1,
  min_relevance_threshold: 45,
  ad_frequency: 'every_matching_response',
  allow_over_budget_ads: false,
  updated_at: new Date().toISOString(),
};

export function getCatalogProducts(): CatalogProduct[] {
  const store = readStoreFile();
  return Array.isArray(store.__catalog_products) ? store.__catalog_products : [];
}

export function saveCatalogProducts(items: CatalogProduct[]): void {
  const store = readStoreFile();
  store.__catalog_products = items;
  writeStoreFile(store);
}

export function upsertCatalogProduct(payload: Partial<CatalogProduct> & { name: string }): CatalogProduct {
  const items = getCatalogProducts();
  const now = new Date().toISOString();
  const existingIdx = payload.id
    ? items.findIndex((p) => p.id === payload.id)
    : payload.product_url
      ? items.findIndex((p) => p.product_url && p.product_url === payload.product_url)
      : -1;

  if (existingIdx >= 0) {
    const existing = items[existingIdx];
    const updated: CatalogProduct = {
      ...existing,
      ...payload,
      specs: payload.specs ? { ...(existing.specs || {}), ...payload.specs } : existing.specs,
      updated_at: now,
    };
    items[existingIdx] = updated;
    saveCatalogProducts(items);
    return updated;
  }

  const created: CatalogProduct = {
    id: payload.id || `cat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    listing_type: payload.listing_type || (payload.business_id ? 'business_owned' : 'admin_managed'),
    business_id: payload.business_id,
    name: String(payload.name).trim(),
    brand: payload.brand ? String(payload.brand).trim() : undefined,
    model: payload.model ? String(payload.model).trim() : undefined,
    category: payload.category ? String(payload.category).trim() : 'General',
    description: payload.description ? String(payload.description).trim() : '',
    specs: payload.specs || {},
    variations: Array.isArray(payload.variations) ? payload.variations : [],
    price: Number(payload.price) || 0,
    currency: payload.currency || '₦',
    unit: payload.unit || 'unit',
    condition: payload.condition || 'New',
    availability: payload.availability || 'In Stock',
    stock_quantity: payload.stock_quantity !== undefined ? Number(payload.stock_quantity) : undefined,
    warranty: payload.warranty,
    location: payload.location ? String(payload.location).trim() : 'Nigeria',
    state: payload.state,
    city: payload.city,
    image: payload.image,
    images: Array.isArray(payload.images) ? payload.images : payload.image ? [payload.image] : [],
    seller_name: payload.seller_name ? String(payload.seller_name).trim() : 'Verified Seller',
    seller_phone: payload.seller_phone,
    seller_whatsapp: payload.seller_whatsapp,
    seller_verified: payload.seller_verified ?? (payload.listing_type === 'business_owned'),
    source_marketplace: payload.source_marketplace || (payload.product_url?.toLowerCase().includes('jiji') ? 'Jiji.ng' : 'MatthOrg'),
    product_url: payload.product_url ? String(payload.product_url).trim() : undefined,
    date_collected: payload.date_collected || now.split('T')[0],
    last_verified_at: payload.last_verified_at || now,
    verification_status: payload.verification_status || 'approved',
    is_published: payload.is_published !== undefined ? Boolean(payload.is_published) : true,
    sku: payload.sku,
    rating: payload.rating,
    clicks: payload.clicks || 0,
    impressions: payload.impressions || 0,
    enquiries_count: payload.enquiries_count || 0,
    created_at: payload.created_at || now,
    updated_at: now,
  };

  items.unshift(created);
  saveCatalogProducts(items);
  return created;
}

export function deleteCatalogProduct(id: string): boolean {
  const items = getCatalogProducts();
  const next = items.filter((p) => p.id !== id);
  if (next.length === items.length) return false;
  saveCatalogProducts(next);
  return true;
}

export function deleteCatalogProductsBulk(ids: string[]): number {
  if (!Array.isArray(ids) || ids.length === 0) return 0;
  const idSet = new Set(ids.map(String));
  const items = getCatalogProducts();
  const next = items.filter((p) => !idSet.has(p.id));
  const deletedCount = items.length - next.length;
  if (deletedCount > 0) {
    saveCatalogProducts(next);
  }
  return deletedCount;
}

export function getSponsoredCampaigns(): SponsoredCampaign[] {
  const store = readStoreFile();
  return Array.isArray(store.__sponsored_campaigns) ? store.__sponsored_campaigns : [];
}

export function saveSponsoredCampaigns(campaigns: SponsoredCampaign[]): void {
  const store = readStoreFile();
  store.__sponsored_campaigns = campaigns;
  writeStoreFile(store);
}

export function getAdControls(): AdControlConfig {
  const store = readStoreFile();
  return {
    ...DEFAULT_AD_CONTROLS,
    ...(store.__ad_controls || {}),
  };
}

export function saveAdControls(config: Partial<AdControlConfig>): AdControlConfig {
  const store = readStoreFile();
  const next: AdControlConfig = {
    ...getAdControls(),
    ...config,
    updated_at: new Date().toISOString(),
  };
  store.__ad_controls = next;
  writeStoreFile(store);
  return next;
}

export function getProductEnquiries(): ProductEnquiry[] {
  const store = readStoreFile();
  return Array.isArray(store.__product_enquiries) ? store.__product_enquiries : [];
}

export function addProductEnquiry(enquiry: ProductEnquiry): void {
  const store = readStoreFile();
  if (!Array.isArray(store.__product_enquiries)) {
    store.__product_enquiries = [];
  }
  store.__product_enquiries.unshift(enquiry);

  // Increment product enquiries count
  if (Array.isArray(store.__catalog_products)) {
    const prod = store.__catalog_products.find((p: CatalogProduct) => p.id === enquiry.product_id);
    if (prod) {
      prod.enquiries_count = (prod.enquiries_count || 0) + 1;
    }
  }

  // Increment sponsored campaign enquiry if attributed
  if (enquiry.campaign_id && Array.isArray(store.__sponsored_campaigns)) {
    const camp = store.__sponsored_campaigns.find((c: SponsoredCampaign) => c.id === enquiry.campaign_id);
    if (camp) {
      camp.enquiries = (camp.enquiries || 0) + 1;
    }
  }

  writeStoreFile(store);
}

export function getCategories(): string[] {
  const store = readStoreFile();
  const saved: string[] = Array.isArray(store.__catalog_categories) ? store.__catalog_categories : [];
  const productCats = getCatalogProducts().map((p) => p.category).filter(Boolean);
  return Array.from(new Set([...saved, ...productCats])).sort();
}

export function saveCategories(categories: string[]): string[] {
  const store = readStoreFile();
  const cleaned = Array.from(new Set(categories.map((c) => String(c).trim()).filter(Boolean))).sort();
  store.__catalog_categories = cleaned;
  writeStoreFile(store);
  return cleaned;
}

export interface SearchAnalyticsRecord {
  id: string;
  query: string;
  intent: string;
  category?: string;
  location?: string;
  budgetMax?: number;
  productResultsCount: number;
  professionalResultsCount: number;
  sponsoredShownCount: number;
  sessionId?: string;
  created_at: string;
}

export function logSearchAnalytics(record: SearchAnalyticsRecord): void {
  const store = readStoreFile();
  if (!Array.isArray(store.__search_analytics)) {
    store.__search_analytics = [];
  }
  store.__search_analytics.unshift(record);
  if (store.__search_analytics.length > 500) {
    store.__search_analytics = store.__search_analytics.slice(0, 500);
  }
  writeStoreFile(store);
}

export function getSearchAnalytics(): SearchAnalyticsRecord[] {
  const store = readStoreFile();
  return Array.isArray(store.__search_analytics) ? store.__search_analytics : [];
}

export function logConversationTurn(payload: {
  sessionId: string;
  userMessage: string;
  assistantReply: string;
  intent: string;
  productsCount: number;
  professionalsCount: number;
  sponsoredCount: number;
}): void {
  const store = readStoreFile();
  if (!Array.isArray(store.__commerce_conversations)) {
    store.__commerce_conversations = [];
  }
  let conv = store.__commerce_conversations.find((c: any) => c.sessionId === payload.sessionId);
  const now = new Date().toISOString();
  if (!conv) {
    conv = {
      sessionId: payload.sessionId,
      title: payload.userMessage.slice(0, 64),
      turns: [],
      created_at: now,
      updated_at: now,
    };
    store.__commerce_conversations.unshift(conv);
  }
  conv.turns.push({
    userMessage: payload.userMessage,
    assistantReply: payload.assistantReply,
    intent: payload.intent,
    productsCount: payload.productsCount,
    professionalsCount: payload.professionalsCount,
    sponsoredCount: payload.sponsoredCount,
    created_at: now,
  });
  conv.updated_at = now;
  if (store.__commerce_conversations.length > 200) {
    store.__commerce_conversations = store.__commerce_conversations.slice(0, 200);
  }
  writeStoreFile(store);
}

export function getConversations(): any[] {
  const store = readStoreFile();
  return Array.isArray(store.__commerce_conversations) ? store.__commerce_conversations : [];
}

export function trackCampaignEvent(campaignId: string, event: 'impression' | 'click' | 'enquiry', productId?: string): void {
  const store = readStoreFile();
  const campaigns: SponsoredCampaign[] = Array.isArray(store.__sponsored_campaigns) ? store.__sponsored_campaigns : [];
  const camp = campaigns.find((c) => c.id === campaignId);
  if (camp) {
    if (event === 'impression') {
      camp.impressions = (camp.impressions || 0) + 1;
    } else if (event === 'click') {
      camp.clicks = (camp.clicks || 0) + 1;
      const charge = Number(camp.cpc_bid) || 0;
      camp.budget_spent = Number(((camp.budget_spent || 0) + charge).toFixed(2));
      if (camp.budget_total > 0 && camp.budget_spent >= camp.budget_total) {
        camp.status = 'exhausted';
      }
    } else if (event === 'enquiry') {
      camp.enquiries = (camp.enquiries || 0) + 1;
    }
    camp.updated_at = new Date().toISOString();
  }

  if (productId && Array.isArray(store.__catalog_products)) {
    const prod = store.__catalog_products.find((p: CatalogProduct) => p.id === productId);
    if (prod) {
      if (event === 'impression') prod.impressions = (prod.impressions || 0) + 1;
      if (event === 'click') prod.clicks = (prod.clicks || 0) + 1;
      if (event === 'enquiry') prod.enquiries_count = (prod.enquiries_count || 0) + 1;
    }
  }

  writeStoreFile(store);
}

export function trackProductClick(productId: string): void {
  const store = readStoreFile();
  if (Array.isArray(store.__catalog_products)) {
    const prod = store.__catalog_products.find((p: CatalogProduct) => p.id === productId);
    if (prod) {
      prod.clicks = (prod.clicks || 0) + 1;
      writeStoreFile(store);
    }
  }
}

export function parseCsvPrice(raw: any): number {
  if (typeof raw === 'number' && !isNaN(raw)) return raw;
  const cleaned = String(raw || '').replace(/[^0-9.]/g, '');
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

export function normalizeImportedRow(row: Record<string, any>, defaultSource = 'Jiji.ng'): Partial<CatalogProduct> | null {
  // Normalize column keys lowercase
  const map: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    map[k.trim().toLowerCase().replace(/\s+/g, '_')] = v;
  }

  const name =
    map.name ||
    map.product_name ||
    map.title ||
    map.item ||
    map.item_name ||
    '';
  if (!String(name).trim()) return null;

  const productUrl =
    map.product_url ||
    map.jiji_url ||
    map.url ||
    map.link ||
    map.purchase_url ||
    map.listing_url ||
    '';

  const price = parseCsvPrice(map.price ?? map.amount ?? map.default_price ?? map.cost ?? 0);

  const image =
    map.image ||
    map.image_url ||
    map.photo ||
    map.photo_url ||
    map.thumbnail ||
    undefined;

  const specs: Record<string, string> = {};
  const rawSpecs = map.specs || map.specifications || map.specification;
  if (typeof rawSpecs === 'string' && rawSpecs.trim()) {
    rawSpecs.split(/[;|]/).forEach((pair) => {
      const [sk, ...sv] = pair.split(':');
      if (sk && sv.length > 0) {
        specs[sk.trim()] = sv.join(':').trim();
      } else if (sk && sk.trim()) {
        specs[`Spec ${Object.keys(specs).length + 1}`] = sk.trim();
      }
    });
  } else if (rawSpecs && typeof rawSpecs === 'object') {
    Object.assign(specs, rawSpecs);
  }

  // Optional individual spec columns
  for (const specCol of ['ram', 'storage', 'capacity', 'power', 'voltage', 'processor', 'screen', 'battery', 'warranty', 'color']) {
    if (map[specCol]) {
      specs[specCol.charAt(0).toUpperCase() + specCol.slice(1)] = String(map[specCol]).trim();
    }
  }

  const rawCond = String(map.condition || 'New').trim().toLowerCase();
  const condition: CatalogProduct['condition'] =
    rawCond.includes('foreign') || rawCond.includes('uk') || rawCond.includes('tokunbo')
      ? 'Foreign Used'
      : rawCond.includes('refurb')
        ? 'Refurbished'
        : rawCond.includes('used') || rawCond.includes('nigerian')
          ? 'Used'
          : 'New';

  const rawAvail = String(map.availability || map.status || 'In Stock').trim().toLowerCase();
  const availability: CatalogProduct['availability'] =
    rawAvail.includes('out')
      ? 'Out of Stock'
      : rawAvail.includes('low')
        ? 'Low Stock'
        : rawAvail.includes('order')
          ? 'Made to Order'
          : 'In Stock';

  const source =
    map.source_marketplace ||
    map.source ||
    (String(productUrl).toLowerCase().includes('jiji') ? 'Jiji.ng' : defaultSource);

  const rawVerStatus = String(map.verification_status || map.verified || 'approved').trim().toLowerCase();
  const verification_status: CatalogProduct['verification_status'] =
    rawVerStatus === 'pending'
      ? 'pending'
      : rawVerStatus === 'rejected'
        ? 'rejected'
        : rawVerStatus === 'verified' || rawVerStatus === 'true'
          ? 'verified'
          : 'approved';

  return {
    listing_type: source.toLowerCase().includes('jiji') || productUrl ? 'external_marketplace' : 'admin_managed',
    name: String(name).trim(),
    brand: map.brand ? String(map.brand).trim() : undefined,
    model: map.model ? String(map.model).trim() : undefined,
    category: map.category ? String(map.category).trim() : 'Electronics & Equipment',
    description: map.description ? String(map.description).trim() : String(name).trim(),
    specs,
    price,
    currency: map.currency ? String(map.currency).trim() : '₦',
    unit: map.unit ? String(map.unit).trim() : 'unit',
    condition,
    availability,
    warranty: map.warranty ? String(map.warranty).trim() : undefined,
    location: map.location || map.city || map.state || 'Nigeria',
    state: map.state ? String(map.state).trim() : undefined,
    city: map.city ? String(map.city).trim() : undefined,
    image: image ? String(image).trim() : undefined,
    seller_name: map.seller_name || map.seller || map.vendor || (source === 'Jiji.ng' ? 'Jiji Verified Merchant' : 'MatthOrg Merchant'),
    seller_phone: map.seller_phone || map.phone ? String(map.seller_phone || map.phone).trim() : undefined,
    seller_whatsapp: map.seller_whatsapp || map.whatsapp ? String(map.seller_whatsapp || map.whatsapp).trim() : undefined,
    seller_verified: verification_status === 'verified',
    source_marketplace: String(source).trim(),
    product_url: productUrl ? String(productUrl).trim() : undefined,
    date_collected: map.date_collected ? String(map.date_collected).trim() : new Date().toISOString().split('T')[0],
    verification_status,
    is_published: true,
    sku: map.sku ? String(map.sku).trim() : undefined,
  };
}

// ============================================================================
// UNIVERSAL MARKETPLACE STORES (UNIFIED DIRECTORY, SERVICES, DATA HUB, FULFILMENT)
// ============================================================================

export function getDirectoryBusinesses(): DirectoryBusiness[] {
  const store = readStoreFile();
  return Array.isArray(store.__directory_businesses) ? store.__directory_businesses : [];
}

export function saveDirectoryBusinesses(items: DirectoryBusiness[]): void {
  const store = readStoreFile();
  store.__directory_businesses = items;
  writeStoreFile(store);
}

export function findDirectoryBusinessDuplicate(params: {
  phone?: string;
  ownerUserId?: string;
  linkedBusinessId?: string;
  claimDirectoryBusinessId?: string;
  claimToken?: string;
  authPhone?: string;
}): {
  existing: DirectoryBusiness | null;
  matchedBy: 'id' | 'phone' | 'none';
  ownedByCaller: boolean;
  isUnclaimed: boolean;
} {
  const list = getDirectoryBusinesses();
  const phoneKey = extractNigerianPhoneKey(params.phone);

  if (phoneKey.length >= 8) {
    const phoneMatch = list.find((b) => nigerianPhonesMatch(b.phone, params.phone) || nigerianPhonesMatch(b.whatsapp, params.phone));
    if (phoneMatch) {
      const matchOwner = (phoneMatch as any).owner_user_id;
      const isUnclaimed = !matchOwner && !phoneMatch.is_registered;
      const storedClaimToken = (phoneMatch as any).claim_token;
      const hasValidClaimToken = Boolean(
        params.claimDirectoryBusinessId &&
          phoneMatch.id === params.claimDirectoryBusinessId &&
          storedClaimToken &&
          params.claimToken &&
          params.claimToken === storedClaimToken
      );
      const matchesAuthenticatedClaim = Boolean(
        params.ownerUserId &&
          isUnclaimed &&
          (hasValidClaimToken ||
            (params.authPhone && nigerianPhonesMatch(phoneMatch.phone, params.authPhone)))
      );
      const ownedByCaller = Boolean(
        (params.ownerUserId && matchOwner && matchOwner === params.ownerUserId) ||
          (params.linkedBusinessId &&
            (phoneMatch.linked_business_id === params.linkedBusinessId || phoneMatch.id === params.linkedBusinessId)) ||
          matchesAuthenticatedClaim
      );
      return { existing: phoneMatch, matchedBy: 'phone', ownedByCaller, isUnclaimed };
    }
  }

  if (params.linkedBusinessId) {
    const idMatch = list.find(
      (b) => b.linked_business_id === params.linkedBusinessId || b.id === params.linkedBusinessId
    );
    if (idMatch) {
      const isUnclaimed = !(idMatch as any).owner_user_id && !idMatch.is_registered;
      return { existing: idMatch, matchedBy: 'id', ownedByCaller: true, isUnclaimed };
    }
  }

  return { existing: null, matchedBy: 'none', ownedByCaller: false, isUnclaimed: false };
}

export function upsertDirectoryBusiness(
  payload: Partial<DirectoryBusiness> & { business_name: string }
): DirectoryBusiness {
  const list = getDirectoryBusinesses();
  const now = new Date().toISOString();
  const normName = payload.business_name.trim().toLowerCase();
  const normPhoneKey = extractNigerianPhoneKey(payload.phone);
  const incomingOwner = (payload as any).owner_user_id;

  const existingIdx = list.findIndex((b) => {
    if (payload.id && b.id === payload.id) return true;
    if (payload.linked_business_id && b.linked_business_id === payload.linked_business_id) return true;
    if (normPhoneKey.length >= 8 && nigerianPhonesMatch(b.phone, payload.phone)) return true;

    if (b.business_name.trim().toLowerCase() === normName) {
      const existingPhoneKey = extractNigerianPhoneKey(b.phone);
      const existingOwner = (b as any).owner_user_id;
      // Avoid merging two distinct providers who share a common personal name but use different phone numbers or accounts
      if (normPhoneKey.length >= 8 && existingPhoneKey.length >= 8 && normPhoneKey !== existingPhoneKey) {
        return false;
      }
      if (incomingOwner && existingOwner && incomingOwner !== existingOwner) {
        return false;
      }
      return true;
    }
    return false;
  });

  if (existingIdx >= 0) {
    const existing = list[existingIdx];
    const mergedLocations = Array.from(
      new Set([
        ...(existing.locations_served || []),
        ...(payload.locations_served || []),
        ...(payload.city ? [payload.city] : []),
        ...(payload.lga ? [payload.lga] : []),
        ...(payload.state ? [payload.state] : []),
      ].filter(Boolean))
    );
    const mergedCategories = Array.from(
      new Set([
        ...(existing.categories_offered || []),
        ...(payload.categories_offered || []),
      ].filter(Boolean))
    );
    const mergedKeywords = Array.from(
      new Set([
        ...(existing.keywords || []),
        ...(payload.keywords || []),
      ].filter(Boolean))
    );

    const updated: DirectoryBusiness = {
      ...existing,
      ...payload,
      id: existing.id,
      ...(((existing as any).owner_user_id || (payload as any).owner_user_id)
        ? { owner_user_id: (existing as any).owner_user_id || (payload as any).owner_user_id }
        : {}),
      owner_full_name: payload.owner_full_name || existing.owner_full_name,
      lga: payload.lga || existing.lga,
      locations_served: payload.locations_served?.length ? mergedLocations : existing.locations_served,
      categories_offered: mergedCategories,
      keywords: mergedKeywords,
      last_verified_at: payload.last_verified_at || now,
      updated_at: now,
    };
    list[existingIdx] = updated;
    saveDirectoryBusinesses(list);

    // Immediately propagate updated phone / area / verified flags to linked services & products (TEST 9!)
    propagateBusinessUpdateToOfferings(updated);
    return updated;
  }

  const created: DirectoryBusiness = {
    id: payload.id || `dir_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    linked_business_id: payload.linked_business_id,
    ...((payload as any).owner_user_id ? { owner_user_id: (payload as any).owner_user_id } : {}),
    business_name: String(payload.business_name).trim(),
    owner_full_name: payload.owner_full_name ? String(payload.owner_full_name).trim() : undefined,
    provider_type: payload.provider_type || 'business',
    industry: payload.industry ? String(payload.industry).trim() : 'General Services',
    specialization: payload.specialization ? String(payload.specialization).trim() : (payload.industry || 'Commercial Services'),
    description: payload.description ? String(payload.description).trim() : '',
    tagline: payload.tagline ? String(payload.tagline).trim() : undefined,
    logo: payload.logo,
    phone: String(payload.phone || '').trim(),
    whatsapp: payload.whatsapp ? String(payload.whatsapp).trim() : String(payload.phone || '').trim(),
    email: payload.email ? String(payload.email).trim() : '',
    website: payload.website ? String(payload.website).trim() : undefined,
    cac_number: payload.cac_number ? String(payload.cac_number).trim() : undefined,
    address: payload.address ? String(payload.address).trim() : '',
    city: payload.city ? String(payload.city).trim() : '',
    lga: payload.lga ? String(payload.lga).trim() : undefined,
    state: payload.state ? String(payload.state).trim() : '',
    country: payload.country || 'Nigeria',
    locations_served: Array.from(
      new Set([
        ...(payload.locations_served || []),
        ...(payload.city ? [payload.city] : []),
        ...(payload.lga ? [payload.lga] : []),
        ...(payload.state ? [payload.state] : []),
      ].filter(Boolean))
    ),
    branches: payload.branches || [],
    contacts: payload.contacts || [],
    categories_offered: payload.categories_offered || [],
    keywords: payload.keywords || [],
    working_hours: payload.working_hours,
    delivery_available: payload.delivery_available,
    is_registered: Boolean(payload.is_registered || payload.linked_business_id),
    is_verified: Boolean(payload.is_verified ?? (payload.approval_status === 'Approved' && Boolean(payload.phone))),
    approval_status: payload.approval_status || 'Approved',
    source_type: payload.source_type || 'manual',
    source_url: payload.source_url,
    last_verified_at: payload.last_verified_at || now,
    rating: payload.rating || 4.8,
    vouches_count: payload.vouches_count || 1,
    created_at: payload.created_at || now,
    updated_at: now,
  };

  list.unshift(created);
  saveDirectoryBusinesses(list);
  return created;
}

export function propagateBusinessUpdateToOfferings(biz: DirectoryBusiness): void {
  const store = readStoreFile();
  let changed = false;

  if (Array.isArray(store.__service_offerings)) {
    store.__service_offerings = store.__service_offerings.map((svc: ServiceOffering) => {
      if (svc.business_id === biz.id || (biz.linked_business_id && svc.business_id === biz.linked_business_id)) {
        changed = true;
        return {
          ...svc,
          business_name: biz.business_name,
          phone: biz.phone || svc.phone,
          whatsapp: biz.whatsapp || biz.phone || svc.whatsapp,
          email: biz.email || svc.email,
          state: biz.state || svc.state,
          city: biz.city || svc.city,
          locations_covered: Array.from(new Set([...(biz.locations_served || []), ...(svc.locations_covered || [])])),
          is_verified: biz.is_verified,
          updated_at: new Date().toISOString(),
        };
      }
      return svc;
    });
  }

  if (Array.isArray(store.__catalog_products)) {
    store.__catalog_products = store.__catalog_products.map((prod: CatalogProduct) => {
      if (prod.business_id === biz.id || (biz.linked_business_id && prod.business_id === biz.linked_business_id)) {
        changed = true;
        return {
          ...prod,
          seller_name: biz.business_name,
          seller_phone: biz.phone || prod.seller_phone,
          seller_whatsapp: biz.whatsapp || biz.phone || prod.seller_whatsapp,
          location: [biz.city, biz.state].filter(Boolean).join(', ') || prod.location,
          state: biz.state || prod.state,
          city: biz.city || prod.city,
          seller_verified: biz.is_verified,
          updated_at: new Date().toISOString(),
        };
      }
      return prod;
    });
  }

  if (changed) writeStoreFile(store);
}

export function deleteDirectoryBusiness(id: string): boolean {
  const store = readStoreFile();
  const prevLen = Array.isArray(store.__directory_businesses) ? store.__directory_businesses.length : 0;
  if (!prevLen) return false;
  store.__directory_businesses = store.__directory_businesses.filter((b: DirectoryBusiness) => b.id !== id);
  if (Array.isArray(store.__service_offerings)) {
    store.__service_offerings = store.__service_offerings.filter((s: ServiceOffering) => s.business_id !== id);
  }
  writeStoreFile(store);
  return store.__directory_businesses.length < prevLen;
}

export function getServiceOfferings(): ServiceOffering[] {
  const store = readStoreFile();
  return Array.isArray(store.__service_offerings) ? store.__service_offerings : [];
}

export function saveServiceOfferings(items: ServiceOffering[]): void {
  const store = readStoreFile();
  store.__service_offerings = items;
  writeStoreFile(store);
}

export function upsertServiceOffering(
  payload: Partial<ServiceOffering> & { business_id: string; service_name: string }
): ServiceOffering {
  const list = getServiceOfferings();
  const now = new Date().toISOString();
  const normName = payload.service_name.trim().toLowerCase();

  const existingIdx = list.findIndex(
    (s) =>
      (payload.id && s.id === payload.id) ||
      (s.business_id === payload.business_id && s.service_name.trim().toLowerCase() === normName)
  );

  if (existingIdx >= 0) {
    const existing = list[existingIdx];
    const updated: ServiceOffering = {
      ...existing,
      ...payload,
      id: existing.id,
      locations_covered: Array.from(
        new Set([...(existing.locations_covered || []), ...(payload.locations_covered || [])].filter(Boolean))
      ),
      sub_services: Array.from(
        new Set([...(existing.sub_services || []), ...(payload.sub_services || [])].filter(Boolean))
      ),
      updated_at: now,
    };
    list[existingIdx] = updated;
    saveServiceOfferings(list);
    return updated;
  }

  const created: ServiceOffering = {
    id: payload.id || `svc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    business_id: payload.business_id,
    business_name: payload.business_name || 'Verified Provider',
    provider_type: payload.provider_type || 'business',
    service_name: String(payload.service_name).trim(),
    service_category: payload.service_category || 'General Service',
    domain: payload.domain || 'general',
    description: payload.description || String(payload.service_name).trim(),
    sub_services: payload.sub_services || [],
    pricing_type: payload.pricing_type || 'Request a Quote',
    price_min: payload.price_min !== undefined ? Number(payload.price_min) : undefined,
    price_max: payload.price_max !== undefined ? Number(payload.price_max) : undefined,
    currency: payload.currency || '₦',
    estimated_turnaround: payload.estimated_turnaround,
    locations_covered: payload.locations_covered || [],
    state: payload.state,
    city: payload.city,
    phone: payload.phone,
    whatsapp: payload.whatsapp || payload.phone,
    email: payload.email,
    website: payload.website,
    keywords: payload.keywords || [],
    is_verified: Boolean(payload.is_verified),
    approval_status: payload.approval_status || 'Approved',
    source_type: payload.source_type || 'manual',
    last_verified_at: payload.last_verified_at || now,
    created_at: payload.created_at || now,
    updated_at: now,
  };

  list.unshift(created);
  saveServiceOfferings(list);
  return created;
}

export function deleteServiceOffering(id: string): boolean {
  const list = getServiceOfferings();
  const next = list.filter((s) => s.id !== id);
  if (next.length === list.length) return false;
  saveServiceOfferings(next);
  return true;
}

// ============================================================================
// DATA HUB IMPORT JOBS & RECORDS
// ============================================================================

export function getDataImportJobs(): DataImportJob[] {
  const store = readStoreFile();
  return Array.isArray(store.__data_import_jobs) ? store.__data_import_jobs : [];
}

export function saveDataImportJobs(jobs: DataImportJob[]): void {
  const store = readStoreFile();
  store.__data_import_jobs = jobs.slice(0, 100);
  writeStoreFile(store);
}

// ============================================================================
// FULFILMENT PIPELINE REQUESTS
// ============================================================================

export function getFulfilmentRequests(): FulfilmentRequest[] {
  const store = readStoreFile();
  return Array.isArray(store.__fulfilment_requests) ? store.__fulfilment_requests : [];
}

export function saveFulfilmentRequests(items: FulfilmentRequest[]): void {
  const store = readStoreFile();
  store.__fulfilment_requests = items;
  writeStoreFile(store);
}

// ============================================================================
// COLLOQUIAL / PIDGIN / SYMPTOM SEARCH SYNONYM DICTIONARY
// ============================================================================

export const DEFAULT_SEARCH_SYNONYMS: SearchSynonymEntry[] = [
  { id: 'syn_1', phrase: 'gen', canonical_terms: ['generator', 'diesel generator', 'petrol generator', 'power plant'], intent_hint: 'repairs', category_hint: 'Generator Repair' },
  { id: 'syn_2', phrase: 'gen no dey start', canonical_terms: ['generator repair', 'generator mechanic', 'engine overhaul', 'carburetor', 'starter coil', 'generator technician'], intent_hint: 'repairs', category_hint: 'Generator Repair' },
  { id: 'syn_3', phrase: 'generator not starting', canonical_terms: ['generator repair', 'generator mechanic', 'generator technician', 'overhaul'], intent_hint: 'repairs', category_hint: 'Generator Repair' },
  { id: 'syn_4', phrase: 'ac no dey cool', canonical_terms: ['ac repair', 'air conditioner technician', 'hvac', 'gas refill', 'compressor'], intent_hint: 'repairs', category_hint: 'HVAC & AC Repair' },
  { id: 'syn_5', phrase: 'fridge not cooling', canonical_terms: ['refrigerator repair', 'fridge technician', 'freezer repair', 'compressor', 'hvac'], intent_hint: 'repairs', category_hint: 'Appliance & Refrigerator Repair' },
  { id: 'syn_6', phrase: 'connect light', canonical_terms: ['electrician', 'electrical wiring', 'house wiring', 'distribution board'], intent_hint: 'artisans', category_hint: 'Electrical & Wiring' },
  { id: 'syn_7', phrase: 'wire my house', canonical_terms: ['electrician', 'electrical installation', 'conduit wiring', 'wiring'], intent_hint: 'artisans', category_hint: 'Electrical & Wiring' },
  { id: 'syn_8', phrase: 'online shop', canonical_terms: ['ecommerce website', 'web design', 'website developer', 'online store'], intent_hint: 'digital_creative', category_hint: 'Web Development & Digital' },
  { id: 'syn_9', phrase: 'website', canonical_terms: ['web developer', 'website design', 'web agency', 'frontend', 'ui ux'], intent_hint: 'digital_creative', category_hint: 'Web Development & Digital' },
  { id: 'syn_10', phrase: 'logo', canonical_terms: ['graphic designer', 'brand identity', 'logo design', 'branding'], intent_hint: 'digital_creative', category_hint: 'Graphic Design & Branding' },
  { id: 'syn_11', phrase: 'pipe burst', canonical_terms: ['plumber', 'plumbing repair', 'leak detection', 'piping'], intent_hint: 'artisans', category_hint: 'Plumbing' },
  { id: 'syn_12', phrase: 'water no dey flow', canonical_terms: ['plumber', 'borehole repair', 'pumping machine', 'plumbing'], intent_hint: 'artisans', category_hint: 'Plumbing & Borehole' },
  { id: 'syn_13', phrase: 'toyota mechanic', canonical_terms: ['auto mechanic', 'automobile repair', 'toyota specialist', 'car diagnostic'], intent_hint: 'repairs', category_hint: 'Automobile Mechanic' },
  { id: 'syn_14', phrase: 'fibre internet', canonical_terms: ['fiber isp', 'internet service provider', 'broadband', 'dedicated internet'], intent_hint: 'business_commercial', category_hint: 'Internet & Telecoms' },
  { id: 'syn_15', phrase: 'cctv', canonical_terms: ['cctv installation', 'surveillance camera', 'security camera', 'nvr', 'access control'], intent_hint: 'artisans', category_hint: 'CCTV & Security' },
  { id: 'syn_16', phrase: 'accountant', canonical_terms: ['accounting', 'bookkeeping', 'tax consultant', 'audit', 'financial advisory'], intent_hint: 'professional_services', category_hint: 'Accounting & Finance' },
  { id: 'syn_17', phrase: 'android app', canonical_terms: ['mobile app developer', 'android developer', 'flutter', 'software engineering'], intent_hint: 'digital_creative', category_hint: 'Mobile & Software Development' },
  { id: 'syn_18', phrase: 'building materials', canonical_terms: ['cement', 'iron rods', 'granite', 'tiles', 'roofing', 'building supply'], intent_hint: 'business_commercial', category_hint: 'Building Materials Supply' },
  { id: 'syn_19', phrase: 'fumigation', canonical_terms: ['pest control', 'fumigation', 'deep cleaning', 'sanitization'], intent_hint: 'business_commercial', category_hint: 'Cleaning & Pest Control' },
];

export function getSearchSynonyms(): SearchSynonymEntry[] {
  const store = readStoreFile();
  const custom: SearchSynonymEntry[] = Array.isArray(store.__search_synonyms) ? store.__search_synonyms : [];
  const merged = [...custom];
  for (const def of DEFAULT_SEARCH_SYNONYMS) {
    if (!merged.some((s) => s.phrase.toLowerCase() === def.phrase.toLowerCase())) {
      merged.push(def);
    }
  }
  return merged;
}

export function saveSearchSynonym(entry: SearchSynonymEntry): SearchSynonymEntry[] {
  const store = readStoreFile();
  const list: SearchSynonymEntry[] = Array.isArray(store.__search_synonyms) ? store.__search_synonyms : [];
  const idx = list.findIndex((s) => s.id === entry.id || s.phrase.toLowerCase() === entry.phrase.toLowerCase());
  if (idx >= 0) list[idx] = entry;
  else list.unshift(entry);
  store.__search_synonyms = list;
  writeStoreFile(store);
  return getSearchSynonyms();
}

// ============================================================================
// CUSTOMER REQUESTS CAPTURE, CLEAR & MARKETPLACE PROMOTION
// ============================================================================

export function getClearedRequestIds(): string[] {
  const store = readStoreFile();
  return Array.isArray(store.__cleared_customer_request_ids) ? store.__cleared_customer_request_ids : [];
}

export function markClearedRequestIds(ids: string[]): void {
  if (!Array.isArray(ids) || ids.length === 0) return;
  const store = readStoreFile();
  const existing: string[] = Array.isArray(store.__cleared_customer_request_ids)
    ? store.__cleared_customer_request_ids
    : [];
  const merged = Array.from(new Set([...ids, ...existing])).slice(0, 600);
  store.__cleared_customer_request_ids = merged;
  writeStoreFile(store);
}

export function getCustomerRequests(includeCleared = false): CustomerRequest[] {
  const store = readStoreFile();
  const list: CustomerRequest[] = Array.isArray(store.__customer_requests) ? store.__customer_requests : [];
  if (includeCleared) return list;
  const clearedSet = new Set(getClearedRequestIds());
  return list.filter((r) => !clearedSet.has(r.id) && !clearedSet.has(r.request_number));
}

export function saveCustomerRequests(requests: CustomerRequest[]): void {
  const store = readStoreFile();
  store.__customer_requests = requests.slice(0, 500);
  writeStoreFile(store);
}

function shareTopicWords(a: string, b: string): boolean {
  const stop = new Set(['need', 'want', 'find', 'looking', 'for', 'around', 'near', 'good', 'best', 'someone', 'company', 'please']);
  const tokensA = a
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !stop.has(t));
  const setB = new Set(
    b
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 3 && !stop.has(t))
  );
  return tokensA.some((t) => setB.has(t));
}

export function upsertCapturedCustomerRequest(input: {
  id?: string;
  request_number?: string;
  customer_name?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  location?: string;
  state?: string;
  city?: string;
  service_required: string;
  service_category?: string;
  budget_min?: number;
  budget_max?: number;
  budget_formatted?: string;
  timeline?: CustomerRequest['timeline'];
  details?: string;
  status?: CustomerRequestStatus;
  matched_count?: number;
  matched_business_names?: string[];
  conversation_session_id?: string;
  source?: CustomerRequest['source'];
  isFollowUpRefinement?: boolean;
}): { request: CustomerRequest; isNew: boolean } {
  const store = readStoreFile();
  const list: CustomerRequest[] = Array.isArray(store.__customer_requests) ? store.__customer_requests : [];
  const clearedIds = new Set<string>(
    Array.isArray(store.__cleared_customer_request_ids) ? store.__cleared_customer_request_ids : []
  );
  const now = new Date().toISOString();
  const cleanService = String(input.service_required || '').trim();
  const cleanLoc = String(input.location || '').trim() || 'Location not specified';

  let existingIdx = -1;
  if (input.id) {
    existingIdx = list.findIndex((r) => r.id === input.id);
  }
  if (existingIdx < 0 && input.request_number) {
    existingIdx = list.findIndex((r) => r.request_number === input.request_number);
  }
  if (existingIdx < 0 && input.conversation_session_id) {
    existingIdx = list.findIndex((r) => {
      if (r.conversation_session_id !== input.conversation_session_id) return false;
      if (r.status === 'Closed' || r.status === 'Converted') return false;
      if (input.isFollowUpRefinement) return true;
      return shareTopicWords(r.service_required || '', cleanService);
    });
  }

  if (existingIdx >= 0) {
    const existing = list[existingIdx];
    const resolvedLocation =
      cleanLoc !== 'Location not specified' && cleanLoc !== 'Location pending'
        ? cleanLoc
        : existing.location;
    const updatedDetails = input.details
      ? existing.details && !existing.details.includes(input.details)
        ? `${existing.details} | ${input.details}`.slice(0, 500)
        : input.details
      : existing.details;
    const updatedService =
      !input.isFollowUpRefinement && cleanService.length > (existing.service_required || '').length
        ? cleanService
        : existing.service_required;

    const updated: CustomerRequest = {
      ...existing,
      customer_name:
        input.customer_name && input.customer_name !== 'Matthew AI Visitor'
          ? input.customer_name
          : existing.customer_name,
      phone: input.phone ? input.phone : existing.phone,
      whatsapp: input.whatsapp || input.phone || existing.whatsapp,
      email: input.email || existing.email,
      location: resolvedLocation,
      state: input.state || existing.state,
      city: input.city || existing.city,
      service_required: updatedService,
      service_category: input.service_category || existing.service_category,
      budget_min: input.budget_min ?? existing.budget_min,
      budget_max: input.budget_max ?? existing.budget_max,
      budget_formatted: input.budget_formatted || existing.budget_formatted,
      timeline: input.timeline || existing.timeline,
      details: updatedDetails,
      status: input.status || existing.status,
      matched_count: input.matched_count ?? existing.matched_count,
      matched_business_names:
        input.matched_business_names && input.matched_business_names.length > 0
          ? input.matched_business_names
          : existing.matched_business_names,
      updated_at: now,
    };

    list[existingIdx] = updated;
    clearedIds.delete(updated.id);
    clearedIds.delete(updated.request_number);
    store.__cleared_customer_request_ids = Array.from(clearedIds);
    store.__customer_requests = list;
    writeStoreFile(store);
    return { request: updated, isNew: false };
  }

  const reqNum = input.request_number || `REQ-${Math.floor(100000 + Math.random() * 900000)}`;
  const newReq: CustomerRequest = {
    id: input.id || `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    request_number: reqNum,
    customer_name: input.customer_name?.trim() || 'Matthew AI Visitor',
    phone: input.phone?.trim() || '',
    whatsapp: input.whatsapp?.trim() || input.phone?.trim() || '',
    email: input.email?.trim() || undefined,
    location: cleanLoc,
    state: input.state?.trim() || undefined,
    city: input.city?.trim() || undefined,
    service_required: cleanService || 'General Customer Request',
    service_category: input.service_category?.trim() || 'General',
    budget_min: input.budget_min,
    budget_max: input.budget_max,
    budget_formatted:
      input.budget_formatted ||
      (input.budget_max ? `Up to ₦${Number(input.budget_max).toLocaleString()}` : 'Open / Negotiable'),
    timeline: input.timeline || 'flexible',
    details: input.details?.trim() || undefined,
    status: input.status || 'Open',
    contacted_by_business_ids: [],
    matched_count: input.matched_count,
    matched_business_names: input.matched_business_names,
    conversation_session_id: input.conversation_session_id,
    source: input.source || 'matthew_ai',
    created_at: now,
    updated_at: now,
  };

  list.unshift(newReq);
  store.__customer_requests = list.slice(0, 500);
  writeStoreFile(store);
  return { request: newReq, isNew: true };
}

export function upsertZeroMatchFulfilmentRequest(input: {
  customer_request_id: string;
  request_number: string;
  conversation_session_id?: string;
  request_summary: string;
  request_type?: UniversalDomainCategory;
  category?: string;
  location?: string;
  budget_max?: number;
  budget_formatted?: string;
  details?: string;
}): FulfilmentRequest {
  const list = getFulfilmentRequests();
  const now = new Date().toISOString();
  const existingIdx = list.findIndex(
    (f) =>
      f.customer_request_id === input.customer_request_id ||
      f.request_number === input.request_number ||
      (input.conversation_session_id &&
        f.conversation_session_id === input.conversation_session_id &&
        shareTopicWords(f.request_summary || '', input.request_summary || ''))
  );

  if (existingIdx >= 0) {
    const existing = list[existingIdx];
    const updated: FulfilmentRequest = {
      ...existing,
      location:
        input.location && input.location !== 'Location pending' && input.location !== 'Location not specified'
          ? input.location
          : existing.location,
      budget_max: input.budget_max ?? existing.budget_max,
      budget_formatted: input.budget_formatted || existing.budget_formatted,
      details: input.details || existing.details,
      updated_at: now,
    };
    list[existingIdx] = updated;
    saveFulfilmentRequests(list);
    return updated;
  }

  const created: FulfilmentRequest = {
    id: `ful_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    request_number: input.request_number,
    customer_request_id: input.customer_request_id,
    conversation_session_id: input.conversation_session_id,
    customer_name: 'Matthew AI Visitor',
    customer_phone: '',
    customer_whatsapp: '',
    customer_email: '',
    request_summary: input.request_summary,
    request_type: input.request_type || 'general',
    category: input.category || 'General Sourcing',
    location: input.location || 'Nigeria',
    budget_max: input.budget_max,
    budget_formatted:
      input.budget_formatted ||
      (input.budget_max ? `Up to ₦${Number(input.budget_max).toLocaleString()}` : 'Open / Quote'),
    urgency: 'within_7_days',
    details: input.details || 'Automatically logged from Matthew AI when instant database match returned 0 results.',
    status: 'Awaiting Sourcing',
    matches: [],
    created_at: now,
    updated_at: now,
  };

  list.unshift(created);
  saveFulfilmentRequests(list);
  return created;
}

export function clearCustomerRequestsFromStore(params: {
  mode: 'outdated' | 'all';
  olderThanDays?: number;
  ids?: string[];
}): { clearedIds: string[]; remainingCount: number } {
  const store = readStoreFile();
  const list: CustomerRequest[] = Array.isArray(store.__customer_requests) ? store.__customer_requests : [];
  const days = typeof params.olderThanDays === 'number' && params.olderThanDays >= 0 ? params.olderThanDays : 7;
  const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;
  const explicitIds = new Set(params.ids || []);

  const clearedIds: string[] = [];
  const remaining: CustomerRequest[] = [];

  for (const req of list) {
    const reqTs = new Date(req.updated_at || req.created_at || 0).getTime();
    const isClosedOrConverted = req.status === 'Closed' || req.status === 'Converted';
    const isAged = Number.isFinite(reqTs) && reqTs > 0 && reqTs < cutoffMs;
    const isOutdated = isClosedOrConverted || isAged;

    const shouldRemove =
      params.mode === 'all' ||
      explicitIds.has(req.id) ||
      explicitIds.has(req.request_number) ||
      (params.mode === 'outdated' && isOutdated);

    if (shouldRemove) {
      clearedIds.push(req.id);
      if (req.request_number) clearedIds.push(req.request_number);
    } else {
      remaining.push(req);
    }
  }

  // Also ensure any explicit IDs passed by client (e.g. Supabase/localStorage-only outdated rows) are tracked
  if (params.ids) {
    for (const id of params.ids) {
      if (id) clearedIds.push(id);
    }
  }

  const existingCleared: string[] = Array.isArray(store.__cleared_customer_request_ids)
    ? store.__cleared_customer_request_ids
    : [];
  store.__cleared_customer_request_ids = Array.from(new Set([...clearedIds, ...existingCleared])).slice(0, 600);
  store.__customer_requests = remaining;
  writeStoreFile(store);

  return {
    clearedIds: Array.from(new Set(clearedIds)),
    remainingCount: remaining.length,
  };
}


