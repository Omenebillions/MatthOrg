import { DemandAdvertCampaign, DemandCampaignStatus } from '../types';
import { authFetch } from '../lib/supabase';

const LOCAL_STORAGE_DEMAND_KEY = 'matthorg_demand_campaigns_v1';

/**
 * Generate targeted Nigerian ad copies across multiple channels
 */
export function generateDemandAdCopies(
  service: string,
  location: string,
  requestNumber?: string,
  budget?: string
) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://matthorg.com';
  const cleanService = service.trim() || 'Service Specialist';
  const cleanLocation = location.trim() || 'Nigeria';
  const refCode = requestNumber || `REQ-${Math.floor(100000 + Math.random() * 900000)}`;
  const claimUrl = `${origin}/business?demand_ref=${refCode}&service=${encodeURIComponent(cleanService)}&location=${encodeURIComponent(cleanLocation)}`;

  const headline = `⚡ Immediate Job: Verified ${cleanService} Needed in ${cleanLocation}!`;

  const whatsapp = `*🚨 URGENT CLIENT JOB AVAILABLE ON MATTHORG!*
*Target Location:* ${cleanLocation}
*Trade Needed:* ${cleanService}
*Request Code:* ${refCode}${budget ? `\n*Budget Indication:* ${budget}` : ''}

A verified customer has just registered a request for *${cleanService}* in *${cleanLocation}* on MatthOrg.
We are currently recruiting and validating local technicians to take on this job directly.

👉 *Are you a reliable ${cleanService} professional in ${cleanLocation}?*
Claim this customer lead and showcase your services with zero commission cuts:
🔗 ${claimUrl}

_MatthOrg Technologies — Connecting verified Nigerian artisans directly with clients._`;

  const social = `🚨 NEW CLIENT WORK ALERT: Calling all ${cleanService} specialists in ${cleanLocation}! 🇳🇬

A client on MatthOrg has just posted a direct request for ${cleanService} in ${cleanLocation} (Job Ref: ${refCode}). We don't have enough verified technicians in this area yet to handle the volume.

If you are a serious, skilled artisan or registered service business:
1. Tap the link below to claim your free MatthOrg business profile.
2. Get verified in under 5 minutes.
3. Receive the direct customer contact and quotation brief.

👉 Claim this job request now: ${claimUrl}

#MatthOrg #NigerianArtisans #Handyman #ContractorJobs #${cleanService.replace(/[^a-zA-Z0-9]/g, '')} #${cleanLocation.replace(/[^a-zA-Z0-9]/g, '')}`;

  const sms = `MatthOrg Job Alert: Client seeking ${cleanService} in ${cleanLocation}. Immediate work available. Claim profile to contact client: ${claimUrl}`;

  return {
    headline,
    whatsapp,
    social,
    sms,
    claimUrl,
  };
}

/**
 * Fetch all unfulfilled demand campaigns from server with local store fallback
 */
export async function fetchDemandCampaigns(): Promise<DemandAdvertCampaign[]> {
  let serverList: DemandAdvertCampaign[] = [];

  try {
    const res = await authFetch('/api/demand-campaigns');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.data)) {
        serverList = data.data;
      }
    }
  } catch (err) {
    console.warn('[Demand Campaigns] Server fetch error (falling back to local):', err);
  }

  let localList: DemandAdvertCampaign[] = [];
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_STORAGE_DEMAND_KEY);
      if (raw) {
        localList = JSON.parse(raw);
      }
    }
  } catch {
    // ignore
  }

  // Merge unique by id
  const map = new Map<string, DemandAdvertCampaign>();
  serverList.forEach((c) => map.set(c.id, c));
  localList.forEach((c) => {
    if (!map.has(c.id)) {
      map.set(c.id, c);
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Create an unfulfilled demand advert campaign when a customer search yields no pro
 */
export async function createDemandCampaign(
  payload: Partial<DemandAdvertCampaign> & { service_required: string; location: string }
): Promise<DemandAdvertCampaign> {
  const adCopies = generateDemandAdCopies(
    payload.service_required,
    payload.location,
    payload.request_number,
    payload.budget_formatted
  );

  const newCampaign: DemandAdvertCampaign = {
    id: payload.id || `camp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    request_id: payload.request_id || `req_${Date.now()}`,
    request_number: payload.request_number || `REQ-${Math.floor(100000 + Math.random() * 900000)}`,
    service_required: payload.service_required.trim(),
    location: payload.location.trim(),
    state: payload.state || '',
    town: payload.town || '',
    customer_name: payload.customer_name || 'Customer',
    customer_phone: payload.customer_phone || '',
    customer_whatsapp: payload.customer_whatsapp || payload.customer_phone || '',
    customer_email: payload.customer_email || '',
    budget_formatted: payload.budget_formatted || 'Negotiable / Quote requested',
    timeline: payload.timeline || 'within_7_days',
    details: payload.details || '',
    campaign_status: payload.campaign_status || 'ad_needed',
    ad_headline: payload.ad_headline || adCopies.headline,
    ad_copy_whatsapp: payload.ad_copy_whatsapp || adCopies.whatsapp,
    ad_copy_social: payload.ad_copy_social || adCopies.social,
    ad_copy_sms: payload.ad_copy_sms || adCopies.sms,
    campaign_channel: payload.campaign_channel || 'whatsapp_broadcast',
    notes: payload.notes || '',
    created_at: payload.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 1. Save to local storage
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_STORAGE_DEMAND_KEY);
      const existing: DemandAdvertCampaign[] = raw ? JSON.parse(raw) : [];
      existing.unshift(newCampaign);
      localStorage.setItem(LOCAL_STORAGE_DEMAND_KEY, JSON.stringify(existing));
    }
  } catch (e) {
    console.warn('[Demand Campaigns] Local save error:', e);
  }

  // 2. Persist to server API
  try {
    await fetch('/api/demand-campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCampaign),
    });
  } catch (err) {
    console.warn('[Demand Campaigns] Server persist error:', err);
  }

  return newCampaign;
}

/**
 * Update a demand campaign status or link newly acquired artisan
 */
export async function updateDemandCampaign(
  id: string,
  updates: Partial<DemandAdvertCampaign>
): Promise<DemandAdvertCampaign | null> {
  let updatedItem: DemandAdvertCampaign | null = null;

  // Local store update
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_STORAGE_DEMAND_KEY);
      if (raw) {
        const list: DemandAdvertCampaign[] = JSON.parse(raw);
        const idx = list.findIndex((c) => c.id === id || c.request_id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
          updatedItem = list[idx];
          localStorage.setItem(LOCAL_STORAGE_DEMAND_KEY, JSON.stringify(list));
        }
      }
    }
  } catch (e) {
    console.warn('[Demand Campaigns] Local update error:', e);
  }

  // Server update
  try {
    const res = await authFetch(`/api/demand-campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.data) updatedItem = data.data;
    }
  } catch (err) {
    console.warn('[Demand Campaigns] Server PATCH error:', err);
  }

  return updatedItem;
}

/**
 * Delete a demand campaign
 */
export async function deleteDemandCampaign(id: string): Promise<boolean> {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_STORAGE_DEMAND_KEY);
      if (raw) {
        const list: DemandAdvertCampaign[] = JSON.parse(raw);
        const filtered = list.filter((c) => c.id !== id && c.request_id !== id);
        localStorage.setItem(LOCAL_STORAGE_DEMAND_KEY, JSON.stringify(filtered));
      }
    }
  } catch {
    // ignore
  }

  try {
    await authFetch(`/api/demand-campaigns/${id}`, { method: 'DELETE' });
    return true;
  } catch {
    return true;
  }
}
