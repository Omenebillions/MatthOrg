// ============================================================================
// MatthOrg AI Growth Engine — Express API Router
// Protected with server-side Supabase JWT authentication & per-owner isolation
// ============================================================================

import express, { Response } from 'express';
import { discoverBusinesses } from './discoveryProvider';
import {
  researchBusiness,
  qualifyLead,
  enrichBusinessContact,
  generateOutreachMessage,
} from './aiService';
import {
  DiscoveredBusiness,
  GrowthPipelineStage,
  GrowthSearchFilter,
  OutreachType,
  OutreachTone,
} from '../../types/growthEngine';
import { ALLOWED_GROWTH_LEAD_FIELDS, pickAllowedFields } from '../security/massAssignment';
import {
  AuthenticatedRequest,
  requireAuth,
  resolveIsPlatformAdmin,
} from '../security/authMiddleware';

export const growthRouter = express.Router();

// Enforce authentication on every Growth Engine endpoint
growthRouter.use(requireAuth);

interface ScopedDiscoveredBusiness extends DiscoveredBusiness {
  owner_user_id?: string;
}

// Memory/Store Cache reference handler
let leadsStore: ScopedDiscoveredBusiness[] = [];

export function getStoredLeads(): DiscoveredBusiness[] {
  return leadsStore;
}

export function setStoredLeads(leads: DiscoveredBusiness[]): void {
  leadsStore = leads;
}

function canAccessLead(
  lead: ScopedDiscoveredBusiness,
  userId: string,
  isAdmin: boolean
): boolean {
  if (isAdmin) return true;
  return Boolean(lead.owner_user_id && lead.owner_user_id === userId);
}

// ----------------------------------------------------------------------------
// 1. Lead Discovery Endpoint
// ----------------------------------------------------------------------------
growthRouter.post('/discover', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const authUser = req.authUser!;
    const filter = pickAllowedFields<GrowthSearchFilter>(req.body, [
      'category',
      'location',
      'state',
      'city',
      'country',
      'limit',
      'keywords',
    ]) as GrowthSearchFilter;
    if (!filter.category) {
      return res.status(400).json({ error: 'Business category or industry is required.' });
    }

    const discovered = await discoverBusinesses(filter);
    const returnedItems: ScopedDiscoveredBusiness[] = [];
    let newlyAddedCount = 0;

    for (const biz of discovered) {
      const existing = leadsStore.find(
        (l) =>
          l.owner_user_id === authUser.id &&
          l.business_name.toLowerCase().trim() === biz.business_name.toLowerCase().trim()
      );
      if (!existing) {
        const scopedBiz: ScopedDiscoveredBusiness = {
          ...biz,
          owner_user_id: authUser.id,
        };
        leadsStore.unshift(scopedBiz);
        returnedItems.push(scopedBiz);
        newlyAddedCount++;
      } else {
        returnedItems.push(existing);
      }
    }

    res.json({
      success: true,
      totalDiscovered: discovered.length,
      newAdded: newlyAddedCount,
      businesses: returnedItems,
    });
  } catch (err: any) {
    console.error('[AI Growth Engine] /discover error:', err);
    res.status(500).json({ error: err?.message || 'Failed to discover businesses' });
  }
});

// ----------------------------------------------------------------------------
// Helper to locate or register owner-scoped lead (strictly allowlisted fields)
async function resolveTargetLead(
  req: AuthenticatedRequest,
  businessId?: string,
  businessData?: DiscoveredBusiness
): Promise<ScopedDiscoveredBusiness | undefined | 'forbidden'> {
  const authUser = req.authUser!;
  const isAdmin = await resolveIsPlatformAdmin(authUser);

  if (businessId) {
    const found = leadsStore.find(
      (l) => l.id === businessId || l.business_name.toLowerCase() === businessId.toLowerCase()
    );
    if (found) {
      if (!canAccessLead(found, authUser.id, isAdmin)) return 'forbidden';
      return found;
    }
  }
  if (businessData && businessData.business_name) {
    const safeData = pickAllowedFields<DiscoveredBusiness>(businessData, ALLOWED_GROWTH_LEAD_FIELDS);
    const existing = leadsStore.find(
      (l) =>
        ((businessData.id && l.id === businessData.id) ||
          l.business_name.toLowerCase() === String(businessData.business_name).toLowerCase()) &&
        canAccessLead(l, authUser.id, isAdmin)
    );
    if (existing) {
      Object.assign(existing, safeData, { updated_at: new Date().toISOString() });
      return existing;
    }
    const created: ScopedDiscoveredBusiness = {
      ...(safeData as DiscoveredBusiness),
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      owner_user_id: authUser.id,
      business_name: String(safeData.business_name),
      category: String(safeData.category || 'General'),
      country: String(safeData.country || 'Nigeria'),
      retrieval_date: new Date().toISOString(),
      pipeline_stage: safeData.pipeline_stage || 'discovered',
      stage_updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    leadsStore.unshift(created);
    return created;
  }
  return undefined;
}

// ----------------------------------------------------------------------------
// 2. AI Business Research Endpoint
// ----------------------------------------------------------------------------
growthRouter.post('/research', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { businessId, businessData, userOffering } = req.body || {};
    const targetBiz = await resolveTargetLead(req, businessId, businessData);

    if (targetBiz === 'forbidden') {
      return res.status(403).json({ error: 'Forbidden: You do not own this lead record.' });
    }
    if (!targetBiz) {
      return res.status(404).json({ error: 'Target business record not found' });
    }

    const report = await researchBusiness(targetBiz, userOffering);
    targetBiz.research_report = report;
    if (targetBiz.pipeline_stage === 'discovered') {
      targetBiz.pipeline_stage = 'researched';
      targetBiz.stage_updated_at = new Date().toISOString();
    }
    targetBiz.updated_at = new Date().toISOString();

    res.json({ success: true, report });
  } catch (err: any) {
    console.error('[AI Growth Engine] /research error:', err);
    res.status(500).json({ error: err?.message || 'Failed to conduct business research' });
  }
});

// ----------------------------------------------------------------------------
// 3. AI Lead Qualification & Opportunity Scoring Endpoint
// ----------------------------------------------------------------------------
growthRouter.post('/qualify', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { businessId, businessData, icpConfig } = req.body || {};
    const targetBiz = await resolveTargetLead(req, businessId, businessData);

    if (targetBiz === 'forbidden') {
      return res.status(403).json({ error: 'Forbidden: You do not own this lead record.' });
    }
    if (!targetBiz) {
      return res.status(404).json({ error: 'Business not found in pipeline' });
    }

    if (!targetBiz.research_report) {
      targetBiz.research_report = await researchBusiness(targetBiz, icpConfig?.primaryServiceOffered);
    }

    const score = await qualifyLead(targetBiz, targetBiz.research_report, icpConfig);
    targetBiz.qualification_score = score;

    if (targetBiz.pipeline_stage === 'discovered' || targetBiz.pipeline_stage === 'researched') {
      targetBiz.pipeline_stage = 'qualified';
      targetBiz.stage_updated_at = new Date().toISOString();
    }
    targetBiz.updated_at = new Date().toISOString();

    res.json({ success: true, score });
  } catch (err: any) {
    console.error('[AI Growth Engine] /qualify error:', err);
    res.status(500).json({ error: err?.message || 'Failed to qualify lead' });
  }
});

// ----------------------------------------------------------------------------
// 4. Contact Intelligence & Enrichment Endpoint
// ----------------------------------------------------------------------------
growthRouter.post('/enrich-contact', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { businessId, businessData } = req.body || {};
    const targetBiz = await resolveTargetLead(req, businessId, businessData);

    if (targetBiz === 'forbidden') {
      return res.status(403).json({ error: 'Forbidden: You do not own this lead record.' });
    }
    if (!targetBiz) {
      return res.status(404).json({ error: 'Business not found in pipeline' });
    }

    const contact = await enrichBusinessContact(targetBiz);
    targetBiz.enriched_contact = contact;

    if (
      targetBiz.pipeline_stage === 'discovered' ||
      targetBiz.pipeline_stage === 'researched' ||
      targetBiz.pipeline_stage === 'qualified'
    ) {
      targetBiz.pipeline_stage = 'contact_identified';
      targetBiz.stage_updated_at = new Date().toISOString();
    }
    targetBiz.updated_at = new Date().toISOString();

    res.json({ success: true, contact });
  } catch (err: any) {
    console.error('[AI Growth Engine] /enrich-contact error:', err);
    res.status(500).json({ error: err?.message || 'Failed to enrich contact' });
  }
});

// ----------------------------------------------------------------------------
// 5. Outreach Studio Message Generator Endpoint
// ----------------------------------------------------------------------------
growthRouter.post('/generate-outreach', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      businessId,
      businessData,
      outreachType,
      tone,
      senderName,
      senderBusiness,
      userOffering,
    } = (req.body || {}) as {
      businessId: string;
      businessData?: DiscoveredBusiness;
      outreachType: OutreachType;
      tone: OutreachTone;
      senderName?: string;
      senderBusiness?: string;
      userOffering?: string;
    };

    const targetBiz = await resolveTargetLead(req, businessId, businessData);
    if (targetBiz === 'forbidden') {
      return res.status(403).json({ error: 'Forbidden: You do not own this lead record.' });
    }
    if (!targetBiz) {
      return res.status(404).json({ error: 'Business not found in pipeline' });
    }

    if (!targetBiz.research_report) {
      targetBiz.research_report = await researchBusiness(targetBiz, userOffering);
    }

    const generated = await generateOutreachMessage(
      targetBiz,
      targetBiz.research_report,
      outreachType || 'cold_email',
      tone || 'consultative',
      senderName || 'Business Executive',
      senderBusiness || 'MatthOrg Partner',
      userOffering || 'Commercial Services & Facility Management'
    );

    const messageRecord = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      business_id: targetBiz.id,
      business_name: targetBiz.business_name,
      outreach_type: outreachType || 'cold_email',
      tone: tone || 'consultative',
      subject: generated.subject,
      message_body: generated.message_body,
      status: 'draft' as const,
      generated_at: new Date().toISOString(),
    };

    if (!targetBiz.outreach_history) {
      targetBiz.outreach_history = [];
    }
    targetBiz.outreach_history.unshift(messageRecord);
    targetBiz.updated_at = new Date().toISOString();

    res.json({ success: true, message: messageRecord });
  } catch (err: any) {
    console.error('[AI Growth Engine] /generate-outreach error:', err);
    res.status(500).json({ error: err?.message || 'Failed to generate outreach message' });
  }
});

// ----------------------------------------------------------------------------
// 6. Lead Pipeline CRUD & Stage Updates (Owner-Scoped)
// ----------------------------------------------------------------------------
growthRouter.get('/leads', async (req: AuthenticatedRequest, res: Response) => {
  const authUser = req.authUser!;
  const isAdmin = await resolveIsPlatformAdmin(authUser);
  const visible = isAdmin ? leadsStore : leadsStore.filter((l) => l.owner_user_id === authUser.id);
  res.json({ success: true, count: visible.length, leads: visible });
});

growthRouter.post('/leads', (req: AuthenticatedRequest, res: Response) => {
  const authUser = req.authUser!;
  const safeLead = pickAllowedFields<DiscoveredBusiness>(req.body, ALLOWED_GROWTH_LEAD_FIELDS);
  if (!safeLead.business_name || !String(safeLead.business_name).trim()) {
    return res.status(400).json({ error: 'Business name is required' });
  }

  const now = new Date().toISOString();
  const completeLead: ScopedDiscoveredBusiness = {
    ...(safeLead as DiscoveredBusiness),
    id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    owner_user_id: authUser.id,
    business_name: String(safeLead.business_name).trim(),
    category: String(safeLead.category || 'General'),
    country: String(safeLead.country || 'Nigeria'),
    retrieval_date: now,
    pipeline_stage: safeLead.pipeline_stage || 'discovered',
    stage_updated_at: now,
    created_at: now,
    updated_at: now,
  };

  leadsStore.unshift(completeLead);
  res.status(201).json({ success: true, lead: completeLead });
});

growthRouter.put('/leads/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const authUser = req.authUser!;
  const isAdmin = await resolveIsPlatformAdmin(authUser);
  const index = leadsStore.findIndex((l) => l.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  if (!canAccessLead(leadsStore[index], authUser.id, isAdmin)) {
    return res.status(403).json({ error: 'Forbidden: You do not own this lead.' });
  }

  const safeUpdates = pickAllowedFields<DiscoveredBusiness>(req.body, ALLOWED_GROWTH_LEAD_FIELDS);
  leadsStore[index] = {
    ...leadsStore[index],
    ...safeUpdates,
    id: leadsStore[index].id,
    owner_user_id: leadsStore[index].owner_user_id,
    updated_at: new Date().toISOString(),
  };

  res.json({ success: true, lead: leadsStore[index] });
});

growthRouter.post('/leads/:id/stage', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { stage } = (req.body || {}) as { stage: GrowthPipelineStage };
  const authUser = req.authUser!;
  const isAdmin = await resolveIsPlatformAdmin(authUser);

  const target = leadsStore.find((l) => l.id === id);
  if (!target) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  if (!canAccessLead(target, authUser.id, isAdmin)) {
    return res.status(403).json({ error: 'Forbidden: You do not own this lead.' });
  }

  const previousStage = target.pipeline_stage;
  target.pipeline_stage = stage;
  target.stage_updated_at = new Date().toISOString();
  target.updated_at = new Date().toISOString();

  if (!target.notes) target.notes = [];
  target.notes.unshift({
    id: `note_${Date.now()}`,
    business_id: target.id,
    author_name: 'System User',
    note_type: 'stage_change',
    content: `Pipeline stage moved from "${previousStage.replace('_', ' ')}" to "${stage.replace('_', ' ')}".`,
    created_at: new Date().toISOString(),
  });

  res.json({ success: true, lead: target });
});

growthRouter.post('/leads/:id/note', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { content, note_type, author_name } = req.body || {};
  const authUser = req.authUser!;
  const isAdmin = await resolveIsPlatformAdmin(authUser);

  const target = leadsStore.find((l) => l.id === id);
  if (!target) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  if (!canAccessLead(target, authUser.id, isAdmin)) {
    return res.status(403).json({ error: 'Forbidden: You do not own this lead.' });
  }

  if (!target.notes) target.notes = [];
  const note = {
    id: `note_${Date.now()}`,
    business_id: target.id,
    author_name: author_name || 'Sales Representative',
    note_type: note_type || 'general',
    content: content || '',
    created_at: new Date().toISOString(),
  };

  target.notes.unshift(note);
  target.updated_at = new Date().toISOString();

  res.json({ success: true, note, lead: target });
});

growthRouter.delete('/leads/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const authUser = req.authUser!;
  const isAdmin = await resolveIsPlatformAdmin(authUser);

  const target = leadsStore.find((l) => l.id === id);
  if (!target) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  if (!canAccessLead(target, authUser.id, isAdmin)) {
    return res.status(403).json({ error: 'Forbidden: You do not own this lead.' });
  }

  leadsStore = leadsStore.filter((l) => l.id !== id);
  res.json({ success: true, deleted: true });
});

// ----------------------------------------------------------------------------
// 7. Campaign Analytics Endpoint (Owner-Scoped)
// ----------------------------------------------------------------------------
growthRouter.get('/analytics', async (req: AuthenticatedRequest, res: Response) => {
  const authUser = req.authUser!;
  const isAdmin = await resolveIsPlatformAdmin(authUser);
  const scopedLeads = isAdmin
    ? leadsStore
    : leadsStore.filter((l) => l.owner_user_id === authUser.id);

  const total_discovered = scopedLeads.length;
  const total_researched = scopedLeads.filter((l) => Boolean(l.research_report)).length;
  const total_qualified = scopedLeads.filter((l) => Boolean(l.qualification_score)).length;
  const total_contactable = scopedLeads.filter((l) =>
    Boolean(l.phone || l.email || l.enriched_contact?.official_email)
  ).length;

  let outreach_generated = 0;
  let outreach_sent = 0;
  let replies_received = 0;

  scopedLeads.forEach((l) => {
    if (l.outreach_history) {
      outreach_generated += l.outreach_history.length;
      outreach_sent += l.outreach_history.filter((m) => m.status === 'sent' || m.status === 'replied').length;
      replies_received += l.outreach_history.filter((m) => m.status === 'replied').length;
    }
  });

  const meetings_booked = scopedLeads.filter(
    (l) =>
      l.pipeline_stage === 'meeting_scheduled' ||
      l.pipeline_stage === 'proposal_sent' ||
      l.pipeline_stage === 'converted'
  ).length;
  const converted_customers = scopedLeads.filter((l) => l.pipeline_stage === 'converted').length;

  const conversion_rate =
    total_discovered > 0 ? Number(((converted_customers / total_discovered) * 100).toFixed(1)) : 0;

  const stage_breakdown: Record<GrowthPipelineStage, number> = {
    discovered: 0,
    researched: 0,
    qualified: 0,
    contact_identified: 0,
    contacted: 0,
    interested: 0,
    meeting_scheduled: 0,
    proposal_sent: 0,
    converted: 0,
    lost: 0,
  };

  scopedLeads.forEach((l) => {
    if (stage_breakdown[l.pipeline_stage] !== undefined) {
      stage_breakdown[l.pipeline_stage]++;
    }
  });

  const industryMap: Record<string, number> = {};
  const locationMap: Record<string, number> = {};

  scopedLeads.forEach((l) => {
    industryMap[l.category] = (industryMap[l.category] || 0) + 1;
    const loc = `${l.city || l.state}, ${l.country}`;
    locationMap[loc] = (locationMap[loc] || 0) + 1;
  });

  const industry_breakdown = Object.entries(industryMap).map(([industry, count]) => ({ industry, count }));
  const location_breakdown = Object.entries(locationMap).map(([location, count]) => ({ location, count }));

  res.json({
    total_discovered,
    total_researched,
    total_qualified,
    total_contactable,
    outreach_generated,
    outreach_sent,
    replies_received,
    meetings_booked,
    converted_customers,
    conversion_rate,
    stage_breakdown,
    industry_breakdown,
    location_breakdown,
  });
});
