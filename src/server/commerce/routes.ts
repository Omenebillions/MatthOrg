import { Router, Request, Response } from 'express';
import {
  addProductEnquiry,
  deleteCatalogProduct,
  deleteCatalogProductsBulk,
  deleteDirectoryBusiness,
  deleteServiceOffering,
  findDirectoryBusinessDuplicate,
  getAdControls,
  getCatalogProducts,
  getCategories,
  getClearedRequestIds,
  getConversations,
  getCustomerRequests,
  getDataImportJobs,
  getDirectoryBusinesses,
  getFulfilmentRequests,
  getProductEnquiries,
  getSearchAnalytics,
  getSearchSynonyms,
  getServiceOfferings,
  getSponsoredCampaigns,
  normalizeImportedRow,
  readStoreFile,
  saveAdControls,
  saveCategories,
  saveDataImportJobs,
  saveFulfilmentRequests,
  saveSearchSynonym,
  saveSponsoredCampaigns,
  trackCampaignEvent,
  trackProductClick,
  upsertCapturedCustomerRequest,
  upsertCatalogProduct,
  upsertDirectoryBusiness,
  upsertServiceOffering,
  writeStoreFile,
} from './store';
import { runMatthewDiscovery } from './matthewCommerceEngine';
import { executeUniversalSearch } from './universalSearch';
import { analyzeRawDataHubInput, commitDataHubRecord } from './dataHub';
import type {
  CatalogProduct,
  FulfilmentMatch,
  FulfilmentRequest,
  ProductEnquiry,
  PublicProfessionalProfile,
  SponsoredCampaign,
} from '../../types';
import {
  ALLOWED_AD_CONTROL_FIELDS,
  ALLOWED_ADMIN_DIRECTORY_BUSINESS_FIELDS,
  ALLOWED_ADMIN_PRODUCT_FIELDS,
  ALLOWED_ADMIN_SERVICE_FIELDS,
  ALLOWED_CAMPAIGN_UPDATE_FIELDS,
  ALLOWED_DIRECTORY_BUSINESS_FIELDS,
  ALLOWED_ENQUIRY_UPDATE_FIELDS,
  ALLOWED_FULFILMENT_UPDATE_FIELDS,
  ALLOWED_PRODUCT_FIELDS,
  ALLOWED_SERVICE_FIELDS,
  ALLOWED_UNIVERSAL_LISTING_FIELDS,
  pickAllowedFields,
} from '../security/massAssignment';
import {
  attachOptionalAuth,
  AuthenticatedRequest,
  getAuthoritativeSubscription,
  getUserBusinessIds,
  maskCustomerRequestContacts,
  requireAdmin,
  requireAuth,
  resolveIsPlatformAdmin,
  resolveUserBusinessMembership,
} from '../security/authMiddleware';
import { linkBusinessToUserAccount } from '../security/userAccounts';
import { getSupabaseServiceClient } from '../security/supabaseServer';
import { attributeReferralServer, ensureBusinessReferralCodeServer } from '../referrals';
import { validateAndNormalizeNigerianPhone, extractNigerianPhoneKey } from '../../utils/nigerianPhone';
import { isValidNigerianStateAndLga, normalizeNigerianStateName } from '../../data/nigeriaLgas';
import { inferIndustryAndTypeForProfession } from '../../data/professionCatalog';

export const commerceRouter = Router();

// 1. Conversational Discovery & Comparison (Public Consumer Discovery)
commerceRouter.post('/matthew/discover', async (req: Request, res: Response) => {
  try {
    const { message, sessionId, history, accumulatedContext, compareProductIds, publicProfessionals } =
      req.body || {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Please enter a message or product query.' });
    }
    const result = await runMatthewDiscovery({
      message: message.trim(),
      sessionId,
      history,
      accumulatedContext,
      compareProductIds,
      publicProfessionals,
    });
    return res.json(result);
  } catch (err: any) {
    console.error('[CommerceRouter] Discovery error:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Discovery engine error.',
    });
  }
});

// 2. Unified Product Catalog CRUD
commerceRouter.get('/commerce/products', async (req: AuthenticatedRequest, res: Response) => {
  const { businessId, includeUnpublished } = req.query;
  let items = getCatalogProducts();

  if (includeUnpublished === 'true') {
    const authUser = await attachOptionalAuth(req);
    if (!authUser) {
      return res.status(401).json({ error: 'Authentication required to access unpublished catalog items.' });
    }
    const isAdmin = await resolveIsPlatformAdmin(authUser);
    if (!isAdmin) {
      if (businessId && typeof businessId === 'string') {
        const ownsBiz = await resolveUserBusinessMembership(authUser, businessId);
        if (!ownsBiz) {
          return res.status(403).json({ error: 'Forbidden: You do not own this business catalog.' });
        }
        items = items.filter((p) => p.business_id === businessId);
      } else {
        const ownedIds = await getUserBusinessIds(authUser);
        items = items.filter((p) => p.business_id && ownedIds.includes(p.business_id));
      }
      return res.json({ success: true, data: items });
    }
  }

  if (businessId && typeof businessId === 'string') {
    items = items.filter((p) => p.business_id === businessId);
  }
  if (includeUnpublished !== 'true') {
    items = items.filter((p) => p.is_published && p.verification_status !== 'rejected');
  }
  return res.json({ success: true, data: items });
});

commerceRouter.post('/commerce/products', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const authUser = req.authUser!;
    const isAdmin = await resolveIsPlatformAdmin(authUser);

    if (isAdmin) {
      const safePayload = pickAllowedFields<CatalogProduct>(req.body, ALLOWED_ADMIN_PRODUCT_FIELDS);
      if (!safePayload.name || !String(safePayload.name).trim()) {
        return res.status(400).json({ error: 'Product name is required.' });
      }
      const saved = upsertCatalogProduct({
        ...(safePayload as Partial<CatalogProduct>),
        name: String(safePayload.name).trim(),
      });
      return res.json({ success: true, data: saved });
    }

    const safePayload = pickAllowedFields<CatalogProduct>(req.body, ALLOWED_PRODUCT_FIELDS);
    if (!safePayload.name || !String(safePayload.name).trim()) {
      return res.status(400).json({ error: 'Product name is required.' });
    }

    const requestedBusinessId = safePayload.business_id ? String(safePayload.business_id).trim() : '';
    const ownedIds = await getUserBusinessIds(authUser);
    let targetBusinessId = requestedBusinessId || ownedIds[0] || '';

    if (requestedBusinessId) {
      const hasAccess = await resolveUserBusinessMembership(authUser, requestedBusinessId);
      if (!hasAccess) {
        return res.status(403).json({
          error: 'Forbidden: You cannot create products under another business.',
        });
      }
    }

    if (!targetBusinessId) {
      targetBusinessId = `biz_${authUser.id}`;
      linkBusinessToUserAccount(authUser.id, targetBusinessId);
    }

    const saved = upsertCatalogProduct({
      ...(safePayload as Partial<CatalogProduct>),
      business_id: targetBusinessId,
      listing_type: 'business_owned',
      verification_status: 'pending',
      name: String(safePayload.name).trim(),
    });
    return res.json({ success: true, data: saved });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to save catalog product.' });
  }
});

commerceRouter.patch('/commerce/products/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const authUser = req.authUser!;
    const isAdmin = await resolveIsPlatformAdmin(authUser);

    const existing = getCatalogProducts().find((p) => p.id === id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    if (!isAdmin) {
      if (!existing.business_id) {
        return res.status(403).json({ error: 'Forbidden: Only platform administrators can edit marketplace products.' });
      }
      const hasAccess = await resolveUserBusinessMembership(authUser, existing.business_id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Forbidden: You do not own this product.' });
      }
      const safeUpdates = pickAllowedFields<CatalogProduct>(req.body, ALLOWED_PRODUCT_FIELDS);
      // Prevent changing ownership to another business
      const saved = upsertCatalogProduct({
        ...existing,
        ...safeUpdates,
        id,
        business_id: existing.business_id,
        listing_type: existing.listing_type,
        verification_status: existing.verification_status,
      });
      return res.json({ success: true, data: saved });
    }

    const safeUpdates = pickAllowedFields<CatalogProduct>(req.body, ALLOWED_ADMIN_PRODUCT_FIELDS);
    const saved = upsertCatalogProduct({ ...existing, ...safeUpdates, id });
    return res.json({ success: true, data: saved });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to update product.' });
  }
});

commerceRouter.delete('/commerce/products/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const authUser = req.authUser!;
  const isAdmin = await resolveIsPlatformAdmin(authUser);
  const existing = getCatalogProducts().find((p) => p.id === req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  if (!isAdmin) {
    if (!existing.business_id) {
      return res.status(403).json({ error: 'Forbidden: Only administrators can delete marketplace items.' });
    }
    const hasAccess = await resolveUserBusinessMembership(authUser, existing.business_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not own this product.' });
    }
  }

  const deleted = deleteCatalogProduct(req.params.id);
  return res.json({ success: true, deleted });
});

commerceRouter.post('/commerce/products/bulk-delete', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const authUser = req.authUser!;
    const isAdmin = await resolveIsPlatformAdmin(authUser);
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No product IDs supplied for deletion.' });
    }

    if (!isAdmin) {
      const products = getCatalogProducts();
      const ownedIds = await getUserBusinessIds(authUser);
      for (const targetId of ids) {
        const prod = products.find((p) => p.id === targetId);
        if (prod && (!prod.business_id || !ownedIds.includes(prod.business_id))) {
          return res.status(403).json({
            error: 'Forbidden: One or more selected products do not belong to your business.',
          });
        }
      }
    }

    const deletedCount = deleteCatalogProductsBulk(ids);
    return res.json({ success: true, deletedCount });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Bulk delete failed.' });
  }
});

// 3. Bulk CSV / Excel Import (Admin Only)
commerceRouter.post('/commerce/import', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { rows, defaultSource = 'Jiji.ng', alreadyNormalized = false } = req.body || {};
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No product rows supplied for import.' });
    }

    const imported: CatalogProduct[] = [];
    let skipped = 0;

    for (const row of rows) {
      const normalized = alreadyNormalized
        ? pickAllowedFields<CatalogProduct>(row, ALLOWED_ADMIN_PRODUCT_FIELDS)
        : normalizeImportedRow(row, defaultSource);
      if (!normalized || !normalized.name) {
        skipped++;
        continue;
      }
      const saved = upsertCatalogProduct(normalized as Partial<CatalogProduct> & { name: string });
      imported.push(saved);
    }

    return res.json({
      success: true,
      importedCount: imported.length,
      skippedCount: skipped,
      data: imported,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Bulk import failed.' });
  }
});

// 4. Categories
commerceRouter.get('/commerce/categories', (req: Request, res: Response) => {
  return res.json({ success: true, data: getCategories() });
});

commerceRouter.post('/commerce/categories', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { categories, addCategory } = req.body || {};
  const current = getCategories();
  const next = Array.isArray(categories)
    ? saveCategories(categories)
    : addCategory
      ? saveCategories([...current, String(addCategory)])
      : current;
  return res.json({ success: true, data: next });
});

// 5. Sponsored Campaigns & Ad Controls (Admin Only)
commerceRouter.get('/commerce/campaigns', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    success: true,
    data: getSponsoredCampaigns(),
    controls: getAdControls(),
  });
});

commerceRouter.post('/commerce/campaigns', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const p = req.body || {};
    if (!p.advertiser_name || !p.target_id) {
      return res.status(400).json({ error: 'Advertiser name and target product/service are required.' });
    }
    const campaigns = getSponsoredCampaigns();
    const now = new Date().toISOString();
    const camp: SponsoredCampaign = {
      id: p.id || `camp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      advertiser_name: String(p.advertiser_name).trim(),
      campaign_title: String(p.campaign_title || p.advertiser_name).trim(),
      target_type: p.target_type || 'product',
      target_id: String(p.target_id),
      target_categories: Array.isArray(p.target_categories) ? p.target_categories : [],
      target_locations: Array.isArray(p.target_locations) ? p.target_locations : [],
      keywords: Array.isArray(p.keywords) ? p.keywords : [],
      cpc_bid: Number(p.cpc_bid) || 50,
      budget_total: Number(p.budget_total) || 10000,
      budget_spent: Number(p.budget_spent) || 0,
      min_relevance_score: Number(p.min_relevance_score) || 40,
      status: p.status || 'active',
      impressions: Number(p.impressions) || 0,
      clicks: Number(p.clicks) || 0,
      enquiries: Number(p.enquiries) || 0,
      start_date: p.start_date || now.split('T')[0],
      end_date: p.end_date,
      created_at: p.created_at || now,
      updated_at: now,
    };
    const idx = campaigns.findIndex((c) => c.id === camp.id);
    if (idx >= 0) campaigns[idx] = camp;
    else campaigns.unshift(camp);
    saveSponsoredCampaigns(campaigns);
    return res.json({ success: true, data: camp });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to save campaign.' });
  }
});

commerceRouter.patch('/commerce/campaigns/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const campaigns = getSponsoredCampaigns();
  const camp = campaigns.find((c) => c.id === id);
  if (!camp) return res.status(404).json({ error: 'Campaign not found.' });
  const safeUpdates = pickAllowedFields<SponsoredCampaign>(req.body, ALLOWED_CAMPAIGN_UPDATE_FIELDS);
  Object.assign(camp, safeUpdates, { updated_at: new Date().toISOString() });
  saveSponsoredCampaigns(campaigns);
  return res.json({ success: true, data: camp });
});

commerceRouter.delete('/commerce/campaigns/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const next = getSponsoredCampaigns().filter((c) => c.id !== req.params.id);
  saveSponsoredCampaigns(next);
  return res.json({ success: true });
});

commerceRouter.get('/commerce/ad-controls', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ success: true, data: getAdControls() });
});

commerceRouter.patch('/commerce/ad-controls', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const safeControls = pickAllowedFields(req.body, ALLOWED_AD_CONTROL_FIELDS);
  const next = saveAdControls(safeControls);
  return res.json({ success: true, data: next });
});

// 6. Event Tracking (Public Consumer Analytics Events)
commerceRouter.post('/commerce/track', (req: Request, res: Response) => {
  const { productId, campaignId, event = 'click' } = req.body || {};
  if (campaignId) {
    trackCampaignEvent(campaignId, event, productId);
  } else if (productId && event === 'click') {
    trackProductClick(productId);
  }
  return res.json({ success: true });
});

// 7. Product Enquiries (Public POST; Authenticated Owner/Admin Read & Update)
commerceRouter.get('/commerce/enquiries', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const authUser = req.authUser!;
  const isAdmin = await resolveIsPlatformAdmin(authUser);
  const { businessId } = req.query;
  let list = getProductEnquiries();

  if (isAdmin) {
    if (businessId && typeof businessId === 'string') {
      list = list.filter((e) => e.business_id === businessId);
    }
    return res.json({ success: true, data: list });
  }

  if (businessId && typeof businessId === 'string') {
    const hasAccess = await resolveUserBusinessMembership(authUser, businessId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not own this business.' });
    }
    list = list.filter((e) => e.business_id === businessId);
    return res.json({ success: true, data: list });
  }

  const ownedIds = await getUserBusinessIds(authUser);
  list = list.filter((e) => e.business_id && ownedIds.includes(e.business_id));
  return res.json({ success: true, data: list });
});

commerceRouter.post('/commerce/enquiries', (req: Request, res: Response) => {
  try {
    const p = req.body || {};
    if (!p.product_id || !p.customer_name || !p.customer_phone) {
      return res.status(400).json({ error: 'Product, customer name, and phone number are required.' });
    }
    const enquiry: ProductEnquiry = {
      id: `enq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      product_id: String(p.product_id),
      product_name: String(p.product_name || 'Catalog Item'),
      listing_type: p.listing_type === 'business_owned' ? 'business_owned' : 'external_marketplace',
      business_id: p.business_id ? String(p.business_id) : undefined,
      seller_name: String(p.seller_name || 'Seller'),
      seller_phone: p.seller_phone ? String(p.seller_phone) : undefined,
      product_url: p.product_url ? String(p.product_url) : undefined,
      customer_name: String(p.customer_name).trim(),
      customer_phone: String(p.customer_phone).trim(),
      customer_whatsapp: String(p.customer_whatsapp || p.customer_phone).trim(),
      customer_email: p.customer_email ? String(p.customer_email).trim() : undefined,
      customer_location: p.customer_location ? String(p.customer_location).trim() : undefined,
      message: String(p.message || `Interested in ${p.product_name}`).trim(),
      quantity: Number(p.quantity) || 1,
      campaign_id: p.campaign_id ? String(p.campaign_id) : undefined,
      status: 'new',
      created_at: new Date().toISOString(),
    };
    addProductEnquiry(enquiry);

    const store = readStoreFile();
    if (!Array.isArray(store.__admin_leads)) store.__admin_leads = [];
    store.__admin_leads.unshift({
      id: `lead_${enquiry.id}`,
      lead_number: `MAT-PRD-${String(Date.now()).slice(-5)}`,
      customer_name: enquiry.customer_name,
      phone: enquiry.customer_phone,
      whatsapp: enquiry.customer_whatsapp || enquiry.customer_phone,
      email: enquiry.customer_email || '',
      location: enquiry.customer_location || 'Nigeria',
      service_required: enquiry.product_name,
      service_category: 'Product Enquiry',
      budget_formatted: 'Product Enquiry',
      timeline: 'immediate',
      source: 'marketplace',
      source_name: `Matthew AI (${enquiry.seller_name})`,
      status: 'New',
      intent_score: 88,
      intent_level: 'Very High',
      is_verified: true,
      freshness: 'active',
      freshness_label: 'Active — Matthew AI Product Enquiry',
      is_locked: false,
      notes: enquiry.message,
      business_id: enquiry.business_id,
      created_at: enquiry.created_at,
    });
    writeStoreFile(store);

    return res.json({ success: true, data: enquiry });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to log product enquiry.' });
  }
});

commerceRouter.patch('/commerce/enquiries/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const authUser = req.authUser!;
  const isAdmin = await resolveIsPlatformAdmin(authUser);

  const store = readStoreFile();
  const list: ProductEnquiry[] = Array.isArray(store.__product_enquiries) ? store.__product_enquiries : [];
  const item = list.find((e) => e.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Enquiry not found.' });

  if (!isAdmin) {
    if (!item.business_id) {
      return res.status(403).json({ error: 'Forbidden: Only administrators can update marketplace enquiries.' });
    }
    const hasAccess = await resolveUserBusinessMembership(authUser, item.business_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not own this enquiry.' });
    }
  }

  const safeUpdates = pickAllowedFields<ProductEnquiry>(req.body, ALLOWED_ENQUIRY_UPDATE_FIELDS);
  Object.assign(item, safeUpdates);
  writeStoreFile(store);
  return res.json({ success: true, data: item });
});

// 8. Admin Analytics & Conversations (Admin Only)
commerceRouter.get('/commerce/analytics', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const products = getCatalogProducts();
  const campaigns = getSponsoredCampaigns();
  const enquiries = getProductEnquiries();
  const searches = getSearchAnalytics();
  const conversations = getConversations();
  const controls = getAdControls();

  const termCounts: Record<string, number> = {};
  const zeroResultQueries: any[] = [];
  for (const s of searches) {
    const key = s.query.toLowerCase().trim();
    termCounts[key] = (termCounts[key] || 0) + 1;
    if (s.productResultsCount === 0 && s.professionalResultsCount === 0) {
      zeroResultQueries.push(s);
    }
  }
  const topSearchTerms = Object.entries(termCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([term, count]) => ({ term, count }));

  return res.json({
    success: true,
    summary: {
      totalProducts: products.length,
      publishedProducts: products.filter((p) => p.is_published).length,
      externalMarketplaceProducts: products.filter((p) => p.listing_type === 'external_marketplace').length,
      businessOwnedProducts: products.filter((p) => p.listing_type === 'business_owned').length,
      pendingApprovalCount: products.filter((p) => p.verification_status === 'pending').length,
      activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
      totalImpressions: campaigns.reduce((acc, c) => acc + (c.impressions || 0), 0),
      totalClicks: campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0),
      totalEnquiries: enquiries.length,
      totalAdSpend: campaigns.reduce((acc, c) => acc + (c.budget_spent || 0), 0),
      totalSearches: searches.length,
      zeroResultCount: zeroResultQueries.length,
      totalConversations: conversations.length,
    },
    topSearchTerms,
    zeroResultQueries: zeroResultQueries.slice(0, 20),
    recentSearches: searches.slice(0, 30),
    conversations: conversations.slice(0, 30),
    controls,
  });
});

// 9. Admin Unified Leads & Bulk Artisan Upload (Admin Only)
commerceRouter.get('/admin/leads', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const store = readStoreFile();
  return res.json({ success: true, data: Array.isArray(store.__admin_leads) ? store.__admin_leads : [] });
});

commerceRouter.post('/admin/leads', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { leads, ...single } = req.body || {};
    const store = readStoreFile();
    if (!Array.isArray(store.__admin_leads)) store.__admin_leads = [];
    const incoming = Array.isArray(leads) ? leads : [single];
    const saved: any[] = [];

    for (const item of incoming) {
      if (!item || (!item.customer_name && !item.service_required)) continue;
      const leadObj = {
        id: item.id || `lead_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        lead_number: item.lead_number || `MAT-ADM-${String(Date.now()).slice(-5)}`,
        customer_name: String(item.customer_name || 'Prospective Customer').trim(),
        phone: String(item.phone || '').trim(),
        whatsapp: String(item.whatsapp || item.phone || '').trim(),
        email: item.email || '',
        location: String(item.location || 'Nigeria').trim(),
        service_required: String(item.service_required || 'General Service').trim(),
        service_category: String(item.service_category || 'General').trim(),
        budget_formatted: String(item.budget_formatted || 'Flexible').trim(),
        timeline: item.timeline || 'within_7_days',
        source: item.source || 'import',
        source_name: item.source_name || 'Admin Upload',
        status: item.status || 'New',
        intent_score: Number(item.intent_score) || 78,
        intent_level: item.intent_level || 'High',
        is_verified: Boolean(item.is_verified ?? true),
        freshness: 'active',
        freshness_label: 'Active — Verified by Admin',
        is_locked: Boolean(item.is_locked ?? false),
        notes: item.notes || '',
        created_at: item.created_at || new Date().toISOString(),
      };
      store.__admin_leads.unshift(leadObj);
      saved.push(leadObj);
    }

    writeStoreFile(store);
    return res.json({ success: true, count: saved.length, data: saved });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to upload leads.' });
  }
});

commerceRouter.delete('/admin/leads/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const store = readStoreFile();
  if (Array.isArray(store.__admin_leads)) {
    store.__admin_leads = store.__admin_leads.filter((l: any) => l.id !== req.params.id);
    writeStoreFile(store);
  }
  return res.json({ success: true });
});

commerceRouter.get('/commerce/professionals', (req: Request, res: Response) => {
  const store = readStoreFile();
  const list = Array.isArray(store.__artisan_recommendations) ? store.__artisan_recommendations : [];
  const mappedArtisans = list
    .filter((a: any) => a.validation_status !== 'rejected')
    .map((a: any) => ({
      id: a.id,
      business_name: a.artisan_name,
      industry: a.trade_category,
      specialization: Array.isArray(a.services_offered) ? a.services_offered.join(', ') : a.trade_category,
      tagline: a.work_done || a.recommendation_note || '',
      logo: a.photo_url || '',
      phone: a.phone,
      whatsapp: a.whatsapp || a.phone,
      email: a.email || '',
      address: (() => {
        const raw = String(a.address || '').trim();
        const fallback = [a.town, a.state].filter(Boolean).join(', ');
        if (!raw) return fallback;
        const lower = raw.toLowerCase();
        const extras: string[] = [];
        if (a.town && !lower.includes(String(a.town).toLowerCase())) extras.push(a.town);
        if (a.state && !lower.includes(String(a.state).toLowerCase())) extras.push(a.state);
        return extras.length > 0 ? `${raw}, ${extras.join(', ')}` : raw;
      })(),
      state: a.state,
      city: a.town,
      categories_offered: [
        a.trade_category,
        ...(Array.isArray(a.services_offered) ? a.services_offered : []),
      ].filter(Boolean),
      locations_served: [a.town, a.state].filter(Boolean),
      is_public: true,
      phone_verified: Boolean(a.verified || a.validation_status === 'validated' || a.validation_status === 'claimed'),
      email_verified: Boolean(a.email && a.verified),
      identity_verified: Boolean(a.verified),
      business_verified: a.profile_type === 'professional' ? Boolean(a.verified) : a.validation_status === 'claimed',
      service_verified: Boolean(a.verified),
      is_artisan: a.profile_type !== 'professional',
      vouches_count: Number(a.vouches_count) || 1,
      rating: Number(a.rating) || 4.8,
      work_done: a.work_done,
      verification_status: a.verified ? 'verified' : 'in_review',
      created_at: a.created_at,
    }));

  const approvedDirBusinesses = getDirectoryBusinesses()
    .filter((b) => b.approval_status === 'Approved')
    .map((b) => ({
      id: b.id,
      business_name: b.business_name,
      owner_full_name: b.owner_full_name,
      industry: b.industry,
      specialization: b.specialization,
      tagline: b.tagline || b.description || '',
      logo: b.logo || '',
      phone: b.phone || '',
      whatsapp: b.whatsapp || b.phone || '',
      email: b.email || '',
      address: b.address || [b.city, b.lga, b.state].filter(Boolean).join(', '),
      state: b.state || '',
      lga: b.lga || '',
      city: b.city || '',
      categories_offered: [b.specialization, b.industry, ...(b.categories_offered || [])].filter(Boolean),
      locations_served: Array.from(new Set([...(b.locations_served || []), b.city, b.lga, b.state].filter(Boolean))),
      is_public: true,
      phone_verified: Boolean(b.is_verified),
      email_verified: Boolean(b.email && b.is_verified),
      identity_verified: Boolean(b.is_verified),
      business_verified: b.provider_type === 'business' && Boolean(b.is_verified),
      service_verified: Boolean(b.is_verified),
      is_artisan: b.provider_type === 'artisan' || b.provider_type === 'repair_technician',
      vouches_count: b.vouches_count || 1,
      rating: b.rating || 4.8,
      work_done: b.description || b.tagline,
      verification_status: b.is_verified ? ('verified' as const) : ('unverified' as const),
      created_at: b.created_at,
    }));

  const combined: PublicProfessionalProfile[] = [...approvedDirBusinesses];
  for (const item of mappedArtisans) {
    const itemPhoneKey = extractNigerianPhoneKey(item.phone);
    const exists = combined.some(
      (c) =>
        c.id === item.id ||
        (itemPhoneKey.length >= 8 && extractNigerianPhoneKey(c.phone) === itemPhoneKey) ||
        c.business_name.trim().toLowerCase() === item.business_name.trim().toLowerCase()
    );
    if (!exists) {
      combined.push({
        ...item,
        verification_status: item.verification_status === 'verified' ? ('verified' as const) : ('in_review' as const),
      });
    }
  }

  return res.json({ success: true, data: combined });
});

commerceRouter.post('/admin/artisans/bulk', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { artisans } = req.body || {};
    if (!Array.isArray(artisans) || artisans.length === 0) {
      return res.status(400).json({ error: 'No professional or artisan records supplied.' });
    }
    const store = readStoreFile();
    if (!Array.isArray(store.__artisan_recommendations)) {
      store.__artisan_recommendations = [];
    }
    const saved: any[] = [];
    for (const a of artisans) {
      if (!a || !a.artisan_name || !a.phone) continue;
      const profileType = a.profile_type === 'professional' ? 'professional' : 'artisan';
      const rec = {
        id: a.id || `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        profile_type: profileType,
        artisan_name: String(a.artisan_name).trim(),
        trade_category: String(a.trade_category || 'General Artisan').trim(),
        phone: String(a.phone).trim(),
        whatsapp: String(a.whatsapp || a.phone).trim(),
        email: a.email ? String(a.email).trim() : '',
        address: a.address ? String(a.address).trim() : '',
        cac_number: a.cac_number ? String(a.cac_number).trim() : '',
        state: String(a.state || 'Lagos').trim(),
        town: String(a.town || 'Nigeria').trim(),
        services_offered: Array.isArray(a.services_offered)
          ? a.services_offered
          : String(a.services_offered || a.trade_category || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
        level: a.level || 'experienced',
        recommender_name:
          a.recommender_name ||
          (profileType === 'professional' ? 'MatthOrg Admin Verified Business' : 'MatthOrg Admin Upload'),
        recommender_relationship:
          a.recommender_relationship ||
          (profileType === 'professional' ? 'Registered Professional' : 'Verified Onboarding'),
        work_done: a.work_done || 'Verified specialist onboarded via MatthOrg Admin.',
        recommendation_note: a.recommendation_note || 'Direct verified professional listing.',
        rating: Number(a.rating) || 4.8,
        pricing_tier: a.pricing_tier || 'fair',
        vouches_count: Number(a.vouches_count) || 1,
        verified: Boolean(a.verified ?? true),
        validation_status: a.validation_status || 'validated',
        photo_url: a.photo_url ? String(a.photo_url).trim() : undefined,
        created_at: new Date().toISOString(),
      };
      store.__artisan_recommendations.unshift(rec);
      saved.push(rec);
    }
    writeStoreFile(store);
    return res.json({ success: true, count: saved.length, data: saved });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to upload professionals/artisans.' });
  }
});

// 10. Universal Hybrid Search API (Public Discovery)
commerceRouter.get('/search/universal', (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || req.query.query || '').trim();
    if (!q) {
      return res.status(400).json({ error: 'Search query `q` is required.' });
    }
    const result = executeUniversalSearch({
      query: q,
      location: req.query.location ? String(req.query.location) : undefined,
      category: req.query.category ? String(req.query.category) : undefined,
      budgetMax: req.query.budgetMax ? Number(req.query.budgetMax) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : 8,
    });
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Universal search failed.' });
  }
});

commerceRouter.post('/search/universal', (req: Request, res: Response) => {
  try {
    const { query, location, category, budgetMax, keywords, extraProfessionals, limit } = req.body || {};
    if (!query || !String(query).trim()) {
      return res.status(400).json({ error: 'Search query is required.' });
    }
    const result = executeUniversalSearch({
      query: String(query).trim(),
      keywords: Array.isArray(keywords) ? keywords : [],
      location,
      category,
      budgetMax: budgetMax ? Number(budgetMax) : undefined,
      extraProfessionals: Array.isArray(extraProfessionals) ? extraProfessionals : [],
      limit: limit ? Number(limit) : 8,
    });
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Universal search failed.' });
  }
});

// 11. Unified Directory Businesses & Live Sync
commerceRouter.get('/commerce/businesses', async (req: AuthenticatedRequest, res: Response) => {
  const { includeUnapproved } = req.query;
  let items = getDirectoryBusinesses();

  if (includeUnapproved === 'true') {
    const authUser = await attachOptionalAuth(req);
    if (!authUser) {
      return res.status(401).json({ error: 'Authentication required to view unapproved directory records.' });
    }
    const isAdmin = await resolveIsPlatformAdmin(authUser);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Only administrators can view unapproved businesses.' });
    }
    return res.json({ success: true, data: items });
  }

  items = items.filter((b) => b.approval_status === 'Approved');
  return res.json({ success: true, data: items });
});

commerceRouter.post('/commerce/businesses', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const safePayload = pickAllowedFields(req.body, ALLOWED_ADMIN_DIRECTORY_BUSINESS_FIELDS);
    if (!safePayload.business_name || !String(safePayload.business_name).trim()) {
      return res.status(400).json({ error: 'Business name is required.' });
    }
    const saved = upsertDirectoryBusiness({
      ...safePayload,
      business_name: String(safePayload.business_name).trim(),
    });
    if (Array.isArray(req.body?.services)) {
      for (const svc of req.body.services) {
        if (!svc?.service_name) continue;
        upsertServiceOffering({
          business_id: saved.id,
          business_name: saved.business_name,
          provider_type: saved.provider_type,
          service_name: String(svc.service_name),
          service_category: svc.service_category || saved.industry,
          domain: svc.domain || 'general',
          description: svc.description || String(svc.service_name),
          pricing_type: svc.pricing_type || 'Request a Quote',
          price_min: svc.price_min,
          price_max: svc.price_max,
          locations_covered: saved.locations_served,
          state: saved.state,
          city: saved.city,
          phone: saved.phone,
          whatsapp: saved.whatsapp,
          email: saved.email,
          is_verified: saved.is_verified,
          approval_status: saved.approval_status,
        });
      }
    }
    return res.json({ success: true, data: saved });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to save directory business.' });
  }
});

commerceRouter.post('/commerce/businesses/sync', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const authUser = req.authUser!;
    const p = req.body || {};
    if (!p.business_name) {
      return res.status(400).json({ error: 'business_name is required to sync.' });
    }

    const isAdmin = await resolveIsPlatformAdmin(authUser);
    const requestedLinkedId = p.id ? String(p.id).trim() : '';
    const existingList = getDirectoryBusinesses();
    const existing = existingList.find(
      (b) => (requestedLinkedId && (b.linked_business_id === requestedLinkedId || b.id === requestedLinkedId))
    );

    if (requestedLinkedId && existing && !isAdmin) {
      const owns =
        (existing as any).owner_user_id === authUser.id ||
        (await resolveUserBusinessMembership(authUser, requestedLinkedId));
      if (!owns) {
        return res.status(403).json({
          error: 'Forbidden: You cannot sync or overwrite another user’s business profile.',
        });
      }
    }

    const effectiveBusinessId = requestedLinkedId || `biz_${authUser.id}`;
    linkBusinessToUserAccount(authUser.id, effectiveBusinessId);

    const saved = upsertDirectoryBusiness({
      ...(existing || {}),
      linked_business_id: effectiveBusinessId,
      owner_user_id: (existing as any)?.owner_user_id || authUser.id,
      business_name: String(p.business_name).trim(),
      provider_type: p.provider_type === 'artisan' ? 'artisan' : 'business',
      industry: String(p.industry || 'Commercial Services'),
      specialization: String(p.specialization || p.tagline || 'General Services'),
      description: String(p.description || p.tagline || ''),
      tagline: p.tagline,
      logo: p.logo,
      phone: p.phone || '',
      whatsapp: p.whatsapp || p.phone || '',
      email: p.email || authUser.email || '',
      website: p.website,
      cac_number: p.cac_number,
      address: p.address || '',
      city: p.city || '',
      state: p.state || '',
      country: p.country || 'Nigeria',
      locations_served: Array.isArray(p.locations_served)
        ? p.locations_served
        : [p.city, p.state].filter(Boolean),
      categories_offered: Array.isArray(p.categories_offered) ? p.categories_offered : [],
      working_hours: p.working_hours,
      is_registered: true,
      // Never trust verification/approval flags from req.body for non-admins
      is_verified: isAdmin ? Boolean(existing?.is_verified) : Boolean(existing?.is_verified),
      approval_status: existing?.approval_status || 'Pending',
      source_type: 'business_portal',
    } as any);

    return res.json({ success: true, data: saved });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to sync business profile.' });
  }
});

commerceRouter.patch('/commerce/businesses/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const authUser = req.authUser!;
    const isAdmin = await resolveIsPlatformAdmin(authUser);

    const existing = getDirectoryBusinesses().find(
      (b) => b.id === req.params.id || b.linked_business_id === req.params.id
    );
    if (!existing) {
      return res.status(404).json({ error: 'Business not found.' });
    }

    if (!isAdmin) {
      const owns =
        (existing as any).owner_user_id === authUser.id ||
        (existing.linked_business_id && (await resolveUserBusinessMembership(authUser, existing.linked_business_id))) ||
        (await resolveUserBusinessMembership(authUser, existing.id));
      if (!owns) {
        return res.status(403).json({ error: 'Forbidden: You do not own this business directory record.' });
      }
      const safeUpdates = pickAllowedFields(req.body, ALLOWED_DIRECTORY_BUSINESS_FIELDS);
      const saved = upsertDirectoryBusiness({
        ...existing,
        ...safeUpdates,
        id: existing.id,
        approval_status: existing.approval_status,
        is_verified: existing.is_verified,
      });
      return res.json({ success: true, data: saved });
    }

    const safeUpdates = pickAllowedFields(req.body, ALLOWED_ADMIN_DIRECTORY_BUSINESS_FIELDS);
    const saved = upsertDirectoryBusiness({ ...existing, ...safeUpdates, id: existing.id });
    return res.json({ success: true, data: saved });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to update business.' });
  }
});

commerceRouter.delete('/commerce/businesses/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const deleted = deleteDirectoryBusiness(req.params.id);
  return res.json({ success: true, deleted });
});

// 12. Unified Services CRUD (Attached to Businesses)
commerceRouter.get('/commerce/services', async (req: AuthenticatedRequest, res: Response) => {
  const { businessId, includeUnapproved } = req.query;
  let items = getServiceOfferings();

  if (includeUnapproved === 'true') {
    const authUser = await attachOptionalAuth(req);
    if (!authUser) {
      return res.status(401).json({ error: 'Authentication required to view unapproved services.' });
    }
    const isAdmin = await resolveIsPlatformAdmin(authUser);
    if (!isAdmin) {
      if (businessId && typeof businessId === 'string') {
        const ownsBiz = await resolveUserBusinessMembership(authUser, businessId);
        if (!ownsBiz) {
          return res.status(403).json({ error: 'Forbidden: You do not own this business services list.' });
        }
        items = items.filter((s) => s.business_id === businessId);
      } else {
        const ownedIds = await getUserBusinessIds(authUser);
        items = items.filter((s) => s.business_id && ownedIds.includes(s.business_id));
      }
      return res.json({ success: true, data: items });
    }
  }

  if (businessId && typeof businessId === 'string') {
    items = items.filter((s) => s.business_id === businessId);
  }
  if (includeUnapproved !== 'true') {
    items = items.filter((s) => s.approval_status === 'Approved');
  }
  return res.json({ success: true, data: items });
});

commerceRouter.post('/commerce/services', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const authUser = req.authUser!;
    const isAdmin = await resolveIsPlatformAdmin(authUser);

    if (isAdmin) {
      const safePayload = pickAllowedFields(req.body, ALLOWED_ADMIN_SERVICE_FIELDS);
      if (!safePayload.business_id || !safePayload.service_name) {
        return res.status(400).json({ error: 'business_id and service_name are required.' });
      }
      const saved = upsertServiceOffering({
        ...safePayload,
        business_id: String(safePayload.business_id),
        service_name: String(safePayload.service_name),
      });
      return res.json({ success: true, data: saved });
    }

    const safePayload = pickAllowedFields(req.body, ALLOWED_SERVICE_FIELDS);
    if (!safePayload.business_id || !safePayload.service_name) {
      return res.status(400).json({ error: 'business_id and service_name are required.' });
    }

    const targetBizId = String(safePayload.business_id);
    const hasAccess = await resolveUserBusinessMembership(authUser, targetBizId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: You cannot add services to another business.' });
    }

    const saved = upsertServiceOffering({
      ...safePayload,
      business_id: targetBizId,
      service_name: String(safePayload.service_name),
      is_verified: false,
      approval_status: 'Needs Review',
    });
    return res.json({ success: true, data: saved });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to save service.' });
  }
});

commerceRouter.patch('/commerce/services/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const authUser = req.authUser!;
  const isAdmin = await resolveIsPlatformAdmin(authUser);
  const existing = getServiceOfferings().find((s) => s.id === req.params.id);
  if (!existing) return res.status(404).json({ error: 'Service not found.' });

  if (!isAdmin) {
    const hasAccess = existing.business_id
      ? await resolveUserBusinessMembership(authUser, existing.business_id)
      : false;
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not own this service.' });
    }
    const safeUpdates = pickAllowedFields(req.body, ALLOWED_SERVICE_FIELDS);
    const saved = upsertServiceOffering({
      ...existing,
      ...safeUpdates,
      id: existing.id,
      business_id: existing.business_id,
      approval_status: existing.approval_status,
      is_verified: existing.is_verified,
    });
    return res.json({ success: true, data: saved });
  }

  const safeUpdates = pickAllowedFields(req.body, ALLOWED_ADMIN_SERVICE_FIELDS);
  const saved = upsertServiceOffering({ ...existing, ...safeUpdates, id: existing.id });
  return res.json({ success: true, data: saved });
});

commerceRouter.delete('/commerce/services/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const authUser = req.authUser!;
  const isAdmin = await resolveIsPlatformAdmin(authUser);
  const existing = getServiceOfferings().find((s) => s.id === req.params.id);
  if (!existing) return res.status(404).json({ error: 'Service not found.' });

  if (!isAdmin) {
    const hasAccess = existing.business_id
      ? await resolveUserBusinessMembership(authUser, existing.business_id)
      : false;
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not own this service.' });
    }
  }

  const deleted = deleteServiceOffering(req.params.id);
  return res.json({ success: true, deleted });
});

// 13. MatthOrg Data Hub Routes (Admin Only)
commerceRouter.post('/admin/data-hub/analyze', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { rawText, inputType = 'raw_text', sourceName = 'Admin Raw Paste', sourceUrl } = req.body || {};
    if (!rawText || !String(rawText).trim()) {
      return res.status(400).json({ error: 'Please paste raw business, product, or service text to analyze.' });
    }
    const job = await analyzeRawDataHubInput({
      rawText: String(rawText),
      inputType,
      sourceName,
      sourceUrl,
    });
    return res.json({ success: true, data: job });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Data Hub analysis failed.' });
  }
});

commerceRouter.get('/admin/data-hub/jobs', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ success: true, data: getDataImportJobs() });
});

commerceRouter.post('/admin/data-hub/commit', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { jobId, recordId, action = 'approve_new', editedPayload, mergeTargetBusinessId, reviewerNotes, approveAll } =
      req.body || {};
    if (!jobId) {
      return res.status(400).json({ error: 'jobId is required.' });
    }

    if (approveAll) {
      const jobs = getDataImportJobs();
      const job = jobs.find((j) => j.id === jobId);
      if (!job) return res.status(404).json({ error: 'Import job not found.' });

      const results = [];
      for (const rec of job.records) {
        if (rec.status === 'Rejected' || rec.status === 'Archived') continue;
        const commitAction = rec.duplicate_candidate_id ? 'merge' : 'approve_new';
        results.push(
          commitDataHubRecord({
            jobId,
            recordId: rec.id,
            action: commitAction,
            mergeTargetBusinessId: rec.duplicate_candidate_id,
          })
        );
      }
      const updatedJob = getDataImportJobs().find((j) => j.id === jobId);
      return res.json({ success: true, approvedCount: results.length, data: updatedJob });
    }

    if (!recordId) {
      return res.status(400).json({ error: 'recordId is required when approveAll is not true.' });
    }

    const result = commitDataHubRecord({
      jobId,
      recordId,
      action,
      editedPayload,
      mergeTargetBusinessId,
      reviewerNotes,
    });
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to commit Data Hub record.' });
  }
});

commerceRouter.delete('/admin/data-hub/jobs/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const jobs = getDataImportJobs().filter((j) => j.id !== req.params.id);
  saveDataImportJobs(jobs);
  return res.json({ success: true });
});

// 14. Lead Fulfilment Pipeline & Search Synonyms
// Admin reads/updates/deletes fulfilment pipeline; public can submit new fulfilment requests
commerceRouter.get('/fulfilment/requests', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ success: true, data: getFulfilmentRequests() });
});

commerceRouter.post('/fulfilment/requests', (req: Request, res: Response) => {
  try {
    const p = req.body || {};
    if (!p.request_summary || !p.customer_name || !p.customer_phone) {
      return res.status(400).json({ error: 'Request description, customer name, and phone are required.' });
    }
    const list = getFulfilmentRequests();
    const now = new Date().toISOString();
    const reqNum = p.request_number || `FUL-${String(Date.now()).slice(-6)}`;
    const item: FulfilmentRequest = {
      id: `ful_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      request_number: reqNum,
      customer_request_id: p.customer_request_id,
      conversation_session_id: p.conversation_session_id,
      customer_name: String(p.customer_name).trim(),
      customer_phone: String(p.customer_phone).trim(),
      customer_whatsapp: String(p.customer_whatsapp || p.customer_phone).trim(),
      customer_email: p.customer_email ? String(p.customer_email).trim() : '',
      request_summary: String(p.request_summary).trim(),
      request_type: p.request_type || 'general',
      category: p.category || 'General Sourcing',
      location: p.location || [p.city, p.state].filter(Boolean).join(', ') || 'Nigeria',
      state: p.state || '',
      city: p.city || '',
      budget_max: p.budget_max ? Number(p.budget_max) : undefined,
      budget_formatted:
        p.budget_formatted || (p.budget_max ? `Up to ₦${Number(p.budget_max).toLocaleString()}` : 'Open / Quote'),
      urgency: p.urgency || 'within_7_days',
      details: p.details || '',
      status: 'New',
      matches: [],
      created_at: now,
      updated_at: now,
    };

    list.unshift(item);
    saveFulfilmentRequests(list);

    upsertCapturedCustomerRequest({
      id: item.customer_request_id || item.id,
      request_number: item.request_number,
      customer_name: item.customer_name,
      phone: item.customer_phone,
      whatsapp: item.customer_whatsapp,
      email: item.customer_email,
      location: item.location,
      state: item.state,
      city: item.city,
      service_required: item.request_summary,
      service_category: item.category || 'General Sourcing',
      budget_max: item.budget_max,
      budget_formatted: item.budget_formatted,
      timeline: item.urgency,
      details: item.details,
      status: 'Open',
      conversation_session_id: item.conversation_session_id,
      source: 'fulfilment',
      isFollowUpRefinement: Boolean(item.conversation_session_id),
    });

    const store = readStoreFile();
    if (!Array.isArray(store.__admin_leads)) store.__admin_leads = [];
    store.__admin_leads.unshift({
      id: `lead_${item.id}`,
      lead_number: item.request_number,
      customer_name: item.customer_name,
      phone: item.customer_phone,
      whatsapp: item.customer_whatsapp,
      email: item.customer_email,
      location: item.location,
      service_required: item.request_summary,
      service_category: item.category || 'Fulfilment Request',
      budget_formatted: item.budget_formatted,
      timeline: item.urgency,
      source: 'marketplace',
      source_name: 'Matthew AI Fulfilment',
      status: 'New',
      intent_score: 92,
      intent_level: 'Very High',
      is_verified: true,
      freshness: 'active',
      freshness_label: 'Active — Matthew AI Fulfilment Request',
      is_locked: false,
      notes: item.details,
      created_at: now,
    });
    writeStoreFile(store);

    return res.json({ success: true, data: item });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to create fulfilment request.' });
  }
});

commerceRouter.patch('/fulfilment/requests/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const list = getFulfilmentRequests();
  const item = list.find((r) => r.id === req.params.id || r.request_number === req.params.id);
  if (!item) return res.status(404).json({ error: 'Fulfilment request not found.' });

  const { attachMatch } = req.body || {};
  const safeUpdates = pickAllowedFields<FulfilmentRequest>(req.body, ALLOWED_FULFILMENT_UPDATE_FIELDS);
  Object.assign(item, safeUpdates, { updated_at: new Date().toISOString() });

  if (attachMatch && attachMatch.provider_name) {
    const newMatch: FulfilmentMatch = {
      id: `fm_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      provider_id: String(attachMatch.provider_id || `prov_${Date.now()}`),
      provider_name: String(attachMatch.provider_name).trim(),
      provider_phone: attachMatch.provider_phone,
      provider_type: attachMatch.provider_type || 'business',
      match_note: attachMatch.match_note,
      quoted_price: attachMatch.quoted_price ? Number(attachMatch.quoted_price) : undefined,
      status: attachMatch.status || 'Proposed',
      created_at: new Date().toISOString(),
    };
    item.matches = [newMatch, ...(item.matches || [])];
    if (item.status === 'New' || item.status === 'Awaiting Sourcing' || item.status === 'Processing') {
      item.status = 'Matching Providers Found';
    }
  }

  saveFulfilmentRequests(list);
  return res.json({ success: true, data: item });
});

commerceRouter.delete('/fulfilment/requests/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const next = getFulfilmentRequests().filter((r) => r.id !== req.params.id);
  saveFulfilmentRequests(next);
  return res.json({ success: true });
});

commerceRouter.get('/commerce/synonyms', (req: Request, res: Response) => {
  return res.json({ success: true, data: getSearchSynonyms() });
});

commerceRouter.post('/commerce/synonyms', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { phrase, canonical_terms, intent_hint, category_hint } = req.body || {};
  if (!phrase || !Array.isArray(canonical_terms)) {
    return res.status(400).json({ error: 'phrase and canonical_terms array are required.' });
  }
  const updated = saveSearchSynonym({
    id: `syn_${Date.now()}`,
    phrase: String(phrase).trim().toLowerCase(),
    canonical_terms: canonical_terms.map((t: any) => String(t).trim().toLowerCase()).filter(Boolean),
    intent_hint,
    category_hint,
  });
  return res.json({ success: true, data: updated });
});

// 15. Matthew AI Buyers Marketplace DB Refresh & Post Scanner (Authenticated + Server-Side PII Masking)
commerceRouter.post(
  '/commerce/marketplace/refresh-requests',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const authUser = req.authUser!;
      const {
        businessId = '',
        businessName = '',
        industry = '',
        specialization = '',
        categories = [],
        location = '',
        state = '',
        city = '',
      } = req.body || {};

      const [isAdmin, subscription] = await Promise.all([
        resolveIsPlatformAdmin(authUser),
        getAuthoritativeSubscription(authUser, businessId ? String(businessId) : undefined),
      ]);
      const canViewContacts = isAdmin || subscription.isPaid;

      const store = readStoreFile();
      const clearedSet = new Set<string>(getClearedRequestIds());
      const existingRequests = getCustomerRequests();
      const existingKeys = new Set<string>();
      for (const r of existingRequests) {
        if (r.id) existingKeys.add(r.id);
        if (r.request_number) existingKeys.add(r.request_number);
        if (r.service_required) {
          existingKeys.add(`${r.service_required.toLowerCase().trim()}::${(r.location || '').toLowerCase().trim()}`);
        }
      }

      let newlyPostedCount = 0;

      // 1. Scan Fulfilment Pipeline Requests
      const fulfilments = getFulfilmentRequests();
      for (const f of fulfilments) {
        if (f.status === 'Fulfilled' || f.status === 'Unfulfilled') continue;
        const targetId = f.customer_request_id || f.id;
        if (clearedSet.has(targetId) || clearedSet.has(f.request_number)) continue;

        const normalizedKey = `${(f.request_summary || '').toLowerCase().trim()}::${(f.location || '').toLowerCase().trim()}`;
        if (existingKeys.has(targetId) || existingKeys.has(f.request_number) || existingKeys.has(normalizedKey)) {
          continue;
        }

        const resCap = upsertCapturedCustomerRequest({
          id: targetId,
          request_number: f.request_number,
          customer_name: f.customer_name || 'Matthew AI Visitor',
          phone: f.customer_phone || '',
          whatsapp: f.customer_whatsapp || f.customer_phone || '',
          email: f.customer_email,
          location: f.location || 'Nigeria',
          state: f.state,
          city: f.city,
          service_required: f.request_summary,
          service_category: f.category || 'General Sourcing',
          budget_max: f.budget_max,
          budget_formatted: f.budget_formatted || 'Open / Negotiable',
          timeline: f.urgency || 'within_7_days',
          details: f.details,
          status: 'Open',
          conversation_session_id: f.conversation_session_id,
          source: f.customer_phone ? 'fulfilment' : 'matthew_ai',
        });
        if (resCap.isNew) {
          newlyPostedCount += 1;
          existingKeys.add(resCap.request.id);
          existingKeys.add(resCap.request.request_number);
          existingKeys.add(normalizedKey);
        }
      }

      // 2. Scan Demand Campaigns (__demand_campaigns)
      const demandCampaigns: any[] = Array.isArray(store.__demand_campaigns) ? store.__demand_campaigns : [];
      for (const c of demandCampaigns) {
        if (!c?.service_required) continue;
        const reqId = c.request_id || c.id;
        if (clearedSet.has(reqId) || clearedSet.has(c.request_number)) continue;

        const normalizedKey = `${String(c.service_required).toLowerCase().trim()}::${String(c.location || '').toLowerCase().trim()}`;
        if (existingKeys.has(reqId) || existingKeys.has(c.request_number) || existingKeys.has(normalizedKey)) {
          continue;
        }

        const resCap = upsertCapturedCustomerRequest({
          id: reqId,
          request_number: c.request_number,
          customer_name: c.customer_name || 'Verified Buyer',
          phone: c.customer_phone || '',
          whatsapp: c.customer_whatsapp || c.customer_phone || '',
          email: c.customer_email,
          location: c.location || 'Nigeria',
          state: c.state,
          city: c.town,
          service_required: c.service_required,
          service_category: c.service_category || 'Marketplace Demand',
          budget_formatted: c.budget_formatted || 'Negotiable',
          timeline: c.timeline || 'within_7_days',
          details: c.details || 'Promoted from MatthOrg Demand Campaign queue.',
          status: 'Open',
          source: 'matthew_ai',
        });
        if (resCap.isNew) {
          newlyPostedCount += 1;
          existingKeys.add(resCap.request.id);
          existingKeys.add(resCap.request.request_number);
          existingKeys.add(normalizedKey);
        }
      }

      // 3. Scan recent Search Analytics
      const analytics = getSearchAnalytics();
      for (const sa of analytics.slice(0, 80)) {
        const q = String(sa.query || '').trim();
        if (q.length < 6) continue;
        if (/^(hi|hello|hey|compare|filter|show all|ok|thanks)/i.test(q)) continue;

        const syntheticId = `sa_req_${sa.id}`;
        if (clearedSet.has(syntheticId) || clearedSet.has(sa.id)) continue;

        const loc = sa.location || 'Location pending';
        const normalizedKey = `${q.toLowerCase()}::${loc.toLowerCase()}`;
        const sameQueryExists = Array.from(existingKeys).some((k) => k.startsWith(`${q.toLowerCase()}::`));
        if (existingKeys.has(syntheticId) || existingKeys.has(normalizedKey) || sameQueryExists) continue;

        const unmatched = (sa.productResultsCount || 0) + (sa.professionalResultsCount || 0) === 0;
        const resCap = upsertCapturedCustomerRequest({
          id: syntheticId,
          customer_name: 'Matthew AI Visitor',
          phone: '',
          whatsapp: '',
          location: loc,
          service_required: q,
          service_category: sa.category || 'General Discovery',
          budget_max: sa.budgetMax,
          budget_formatted: sa.budgetMax ? `Up to ₦${Number(sa.budgetMax).toLocaleString()}` : 'Open / Negotiable',
          timeline: 'within_7_days',
          details: unmatched
            ? `Discovered by Matthew AI from an unmatched customer search ("${q}"). Ready for verified business response.`
            : `Discovered by Matthew AI from recent customer search ("${q}").`,
          status: 'Open',
          matched_count: (sa.productResultsCount || 0) + (sa.professionalResultsCount || 0),
          conversation_session_id: sa.sessionId,
          source: 'matthew_ai',
        });
        if (resCap.isNew) {
          newlyPostedCount += 1;
          existingKeys.add(resCap.request.id);
          existingKeys.add(normalizedKey);
        }
      }

      const refreshedRequests = getCustomerRequests();
      const maskedRequests = refreshedRequests.map((r) => maskCustomerRequestContacts(r, canViewContacts));

      const profileTokens = [
        businessName,
        industry,
        specialization,
        ...(Array.isArray(categories) ? categories : []),
        location,
        state,
        city,
      ]
        .join(' ')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length >= 3);

      let relevantCount = 0;
      for (const r of refreshedRequests) {
        if (r.status === 'Closed' || r.status === 'Converted') continue;
        const hay = `${r.service_required} ${r.service_category} ${r.location} ${r.details || ''}`.toLowerCase();
        if (profileTokens.some((tok) => hay.includes(tok))) {
          relevantCount += 1;
        }
      }

      const summary =
        newlyPostedCount > 0
          ? `Matthew searched the database and posted ${newlyPostedCount} new customer request${newlyPostedCount === 1 ? '' : 's'} (${refreshedRequests.length} total open/tracked, ${relevantCount} matching your business profile).`
          : `Matthew scanned the database: all ${refreshedRequests.length} customer request${refreshedRequests.length === 1 ? '' : 's'} are up to date (${relevantCount} matching your business profile).`;

      return res.json({
        success: true,
        requests: maskedRequests,
        newlyPostedCount,
        totalRequests: maskedRequests.length,
        relevantCount,
        summary,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Matthew marketplace refresh failed.' });
    }
  }
);

// 16. Universal /business Listing Funnel Registration Endpoint (Strict Allowlist + Server Identity)
commerceRouter.post('/business-listings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const authUser = req.authUser!;
    const safeInput = pickAllowedFields(req.body, ALLOWED_UNIVERSAL_LISTING_FIELDS);

    const businessNameRaw = String(safeInput.business_name || '').trim();
    const fullName = String(safeInput.full_name || '').trim();
    const profession = String(safeInput.profession || '').trim();
    const rawPhone = String(safeInput.phone || '').trim();
    const rawState = String(safeInput.state || '').trim();
    const rawLga = String(safeInput.lga || '').trim();
    const townCity = String(safeInput.town_city || '').trim();
    const updateExisting = Boolean(safeInput.update_existing);
    const suppliedSupaBizId = String(safeInput.supabase_business_id || '').trim();

    if (fullName.length < 2) {
      return res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
    }
    if (profession.length < 2) {
      return res.status(400).json({ error: 'Please enter or select your profession or business activity.' });
    }

    const phoneCheck = validateAndNormalizeNigerianPhone(rawPhone);
    if (!phoneCheck.isValid) {
      return res.status(400).json({ error: phoneCheck.error || 'Please enter a valid Nigerian phone number.' });
    }

    const canonicalState = normalizeNigerianStateName(rawState);
    if (!canonicalState) {
      return res.status(400).json({ error: 'Please select a valid Nigerian state or FCT Abuja.' });
    }
    if (!isValidNigerianStateAndLga(canonicalState, rawLga)) {
      return res.status(400).json({ error: `Please select a valid Local Government Area (LGA) in ${canonicalState}.` });
    }
    if (townCity.length < 2) {
      return res.status(400).json({ error: 'Please enter your town or city.' });
    }

    const displayName = businessNameRaw || fullName;
    const inferred = inferIndustryAndTypeForProfession(profession);
    const resolvedIndustry = String(safeInput.industry || '').trim() || inferred.industry;
    const resolvedProviderType = inferred.providerType;
    const isAdmin = await resolveIsPlatformAdmin(authUser);

    const linkedBusinessId =
      suppliedSupaBizId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(suppliedSupaBizId)
        ? suppliedSupaBizId
        : `biz_${authUser.id}`;

    // Verify ownership if client referenced an existing Supabase UUID
    if (suppliedSupaBizId && suppliedSupaBizId !== `biz_${authUser.id}` && !isAdmin) {
      const ownsSupaBiz = await resolveUserBusinessMembership(authUser, suppliedSupaBizId);
      if (!ownsSupaBiz) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to update this business.' });
      }
    }

    // Duplicate detection by normalized Nigerian phone number (local store + Supabase check)
    const dupCheck = findDirectoryBusinessDuplicate({
      phone: phoneCheck.normalizedE164,
      ownerUserId: authUser.id,
      linkedBusinessId,
    });

    if (dupCheck.existing && dupCheck.matchedBy === 'phone') {
      if (!dupCheck.ownedByCaller && !isAdmin) {
        return res.status(409).json({
          success: false,
          duplicate: true,
          ownedByCaller: false,
          error:
            'A listing with this Nigerian phone number already exists on MatthOrg. Please sign in with that account or use a different contact number.',
          existingListing: {
            business_name: dupCheck.existing.business_name,
            profession: dupCheck.existing.specialization,
            state: dupCheck.existing.state,
            lga: dupCheck.existing.lga,
            town_city: dupCheck.existing.city,
          },
        });
      }

      if (!updateExisting) {
        return res.status(200).json({
          success: true,
          status: 'duplicate',
          duplicate: true,
          ownedByCaller: true,
          message: `You already have an active listing (${dupCheck.existing.business_name}) with ${phoneCheck.display}. Would you like to update it with these details?`,
          data: dupCheck.existing,
        });
      }
    }

    // Check Supabase businesses table for cross-account phone conflicts
    const svcClient = getSupabaseServiceClient();
    if (svcClient) {
      try {
        const { data: supaMatches } = await svcClient
          .from('businesses')
          .select('id, owner_user_id, name, state, city')
          .or(`phone.eq.${phoneCheck.normalizedE164},phone_e164.eq.${phoneCheck.normalizedE164}`)
          .limit(5);

        if (Array.isArray(supaMatches)) {
          const foreignMatch = supaMatches.find(
            (row: any) => row.owner_user_id !== authUser.id && row.id !== linkedBusinessId
          );
          if (foreignMatch && !isAdmin) {
            return res.status(409).json({
              success: false,
              duplicate: true,
              ownedByCaller: false,
              error:
                'A listing with this Nigerian phone number already exists on MatthOrg. Please sign in with that account or use a different contact number.',
              existingListing: {
                business_name: foreignMatch.name,
                state: foreignMatch.state,
                town_city: foreignMatch.city,
              },
            });
          }
        }
      } catch {
        // Ignore if phone_e164 migration column hasn't been applied yet
      }
    }

    const locationsServed = Array.from(
      new Set([townCity, rawLga, `${townCity}, ${rawLga}`, canonicalState].filter(Boolean))
    );
    const formattedAddress = `${townCity}, ${rawLga}, ${canonicalState}`;

    linkBusinessToUserAccount(authUser.id, linkedBusinessId);

    const wasUpdated = Boolean(dupCheck.existing);
    const savedBusiness = upsertDirectoryBusiness({
      ...(dupCheck.existing || {}),
      linked_business_id: linkedBusinessId,
      owner_user_id: (dupCheck.existing as any)?.owner_user_id || authUser.id,
      business_name: displayName,
      owner_full_name: fullName,
      provider_type: resolvedProviderType,
      industry: resolvedIndustry,
      specialization: profession,
      description: `${displayName} offers ${profession} services in ${townCity}, ${rawLga}, ${canonicalState}.`,
      tagline: `${profession} in ${townCity}, ${rawLga} (${canonicalState})`,
      phone: phoneCheck.normalizedE164,
      whatsapp: phoneCheck.normalizedE164,
      email: authUser.email || dupCheck.existing?.email || '',
      address: formattedAddress,
      city: townCity,
      lga: rawLga,
      state: canonicalState,
      country: 'Nigeria',
      locations_served: locationsServed,
      categories_offered: Array.from(new Set([profession, resolvedIndustry].filter(Boolean))),
      keywords: [profession.toLowerCase(), townCity.toLowerCase(), rawLga.toLowerCase(), canonicalState.toLowerCase()],
      is_registered: true,
      is_verified: Boolean(dupCheck.existing?.is_verified),
      approval_status: dupCheck.existing?.approval_status || 'Approved',
      source_type: 'business_portal',
    } as any);

    const savedService = upsertServiceOffering({
      business_id: savedBusiness.id,
      business_name: savedBusiness.business_name,
      provider_type:
        savedBusiness.provider_type === 'merchant' ? 'supplier' : savedBusiness.provider_type,
      service_name: profession,
      service_category: resolvedIndustry,
      domain: 'general',
      description: `${profession} serving ${townCity}, ${rawLga}, ${canonicalState}.`,
      sub_services: [profession],
      pricing_type: 'Request a Quote',
      locations_covered: locationsServed,
      state: canonicalState,
      city: townCity,
      phone: phoneCheck.normalizedE164,
      whatsapp: phoneCheck.normalizedE164,
      email: authUser.email || '',
      keywords: [profession.toLowerCase(), fullName.toLowerCase(), rawLga.toLowerCase(), townCity.toLowerCase()],
      is_verified: Boolean(savedBusiness.is_verified),
      approval_status: savedBusiness.approval_status,
      source_type: 'business_portal',
    });

    // Authoritative server-side sync to Supabase businesses table if service client is configured & UUID exists
    if (svcClient && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(linkedBusinessId)) {
      const fullPayload: Record<string, any> = {
        name: displayName,
        owner_full_name: fullName,
        provider_type: resolvedProviderType,
        phone: phoneCheck.normalizedE164,
        whatsapp: phoneCheck.normalizedE164,
        phone_e164: phoneCheck.normalizedE164,
        email: authUser.email || null,
        industry: resolvedIndustry,
        specialization: profession,
        tagline: savedBusiness.tagline,
        address: formattedAddress,
        state: canonicalState,
        lga: rawLga,
        city: townCity,
        locations_served: locationsServed,
        categories_offered: savedBusiness.categories_offered,
        is_public: true,
        updated_at: new Date().toISOString(),
      };

      const { error: svcErr } = await svcClient
        .from('businesses')
        .update(fullPayload)
        .eq('id', linkedBusinessId)
        .eq('owner_user_id', authUser.id);

      if (svcErr && (svcErr.code === 'PGRST204' || svcErr.code === '42703')) {
        // Fallback for pre-migration schema without new optional columns
        await svcClient
          .from('businesses')
          .update({
            name: displayName,
            phone: phoneCheck.normalizedE164,
            email: authUser.email || null,
            industry: resolvedIndustry,
            specialization: profession,
            tagline: savedBusiness.tagline,
            address: formattedAddress,
            state: canonicalState,
            city: townCity,
            locations_served: locationsServed,
            categories_offered: savedBusiness.categories_offered,
            is_public: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', linkedBusinessId)
          .eq('owner_user_id', authUser.id);
      }
    }

    // Generate/ensure referral code & optionally attribute referral_code if provided
    const referralCodeOwn = await ensureBusinessReferralCodeServer({
      authUser,
      businessId: linkedBusinessId,
      businessName: displayName,
      phone: phoneCheck.normalizedE164,
      location: `${townCity}, ${canonicalState}`,
      industry: resolvedIndustry,
    });

    let referralAttribution: any = null;
    if (safeInput.referral_code) {
      const attrRes = await attributeReferralServer({
        authUser,
        referralCode: safeInput.referral_code,
        businessId: linkedBusinessId,
        phone: phoneCheck.normalizedE164,
        businessName: displayName,
        location: `${townCity}, ${rawLga}, ${canonicalState}`,
        source: safeInput.referral_source || 'business_portal',
      });
      referralAttribution = {
        success: attrRes.ok,
        already_attributed: Boolean(attrRes.already_attributed),
        self_referral: Boolean(attrRes.self_referral),
        referral_code: attrRes.referral_code,
        referrer_name: attrRes.referrer_name,
        error: attrRes.error,
      };
    }

    return res.status(wasUpdated ? 200 : 201).json({
      success: true,
      status: wasUpdated ? 'updated' : 'created',
      duplicate: false,
      data: savedBusiness,
      service: savedService,
      referralCode: referralCodeOwn,
      referralAttribution,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to create listing.' });
  }
});

