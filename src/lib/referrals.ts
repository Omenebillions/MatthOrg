import { supabase, ensureSupabase, authFetch } from './supabase';

export const PENDING_REFERRAL_STORAGE_KEY = 'matthorg_pending_referral_v1';

export interface PendingReferralState {
  code: string;
  source: string;
  capturedAt: string;
  landingPath?: string;
}

export interface ValidatedReferralInfo {
  valid: boolean;
  referral_code?: string;
  referrer_business_id?: string;
  referrer_name?: string;
  referrer_industry?: string;
  referrer_location?: string;
  error?: string;
}

export interface ReferralSummaryData {
  referralCode: string;
  shareUrl: string;
  referralsCount: number;
  referredBy?: {
    referral_code: string;
    referrer_name?: string;
    attributed_at?: string;
  } | null;
  recentReferrals: Array<{
    id: string;
    referred_business_name: string;
    referred_location?: string;
    status: string;
    created_at: string;
  }>;
}

export function normalizeReferralCode(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '');
}

export function getShareableReferralUrl(code?: string | null): string {
  const clean = normalizeReferralCode(code);
  if (!clean) return '';
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/business?ref=${encodeURIComponent(clean)}`;
  }
  return `https://matthorg.com/business?ref=${encodeURIComponent(clean)}`;
}

/**
 * Captures `?ref=CODE` or `?referral=CODE` from the browser URL and persists it across
 * reloads, phone OTP verification, and email confirmation flows.
 */
export function captureReferralFromUrl(searchString?: string): PendingReferralState | null {
  if (typeof window === 'undefined' && !searchString) return null;

  try {
    const rawSearch = searchString ?? window.location.search ?? '';
    const params = new URLSearchParams(rawSearch);
    const rawCode =
      params.get('ref') ||
      params.get('referral') ||
      params.get('referral_code') ||
      params.get('r');

    const cleanCode = normalizeReferralCode(rawCode);
    if (!cleanCode || cleanCode.length < 4) {
      return getPendingReferral();
    }

    const payload: PendingReferralState = {
      code: cleanCode,
      source: window.location?.pathname?.startsWith('/business') ? 'business_link' : 'url_param',
      capturedAt: new Date().toISOString(),
      landingPath: typeof window !== 'undefined' ? window.location.pathname : '/business',
    };

    try {
      localStorage.setItem(PENDING_REFERRAL_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
    try {
      sessionStorage.setItem(PENDING_REFERRAL_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
    return payload;
  } catch {
    return getPendingReferral();
  }
}

export function savePendingReferral(code: string, source = 'manual_entry'): PendingReferralState | null {
  const cleanCode = normalizeReferralCode(code);
  if (!cleanCode || cleanCode.length < 4) return null;
  const payload: PendingReferralState = {
    code: cleanCode,
    source,
    capturedAt: new Date().toISOString(),
    landingPath: typeof window !== 'undefined' ? window.location.pathname : '/business',
  };
  try {
    localStorage.setItem(PENDING_REFERRAL_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
  try {
    sessionStorage.setItem(PENDING_REFERRAL_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
  return payload;
}

export function getPendingReferral(): PendingReferralState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      localStorage.getItem(PENDING_REFERRAL_STORAGE_KEY) ||
      sessionStorage.getItem(PENDING_REFERRAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingReferralState;
    const cleanCode = normalizeReferralCode(parsed?.code);
    if (!cleanCode) return null;
    return {
      ...parsed,
      code: cleanCode,
    };
  } catch {
    return null;
  }
}

export function clearPendingReferral(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PENDING_REFERRAL_STORAGE_KEY);
  } catch {
    // ignore
  }
  try {
    sessionStorage.removeItem(PENDING_REFERRAL_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Validates a referral code via server endpoint and Supabase lookup RPC without exposing PII.
 */
export async function validateReferralCode(code: string): Promise<ValidatedReferralInfo> {
  const cleanCode = normalizeReferralCode(code);
  if (!cleanCode) {
    return { valid: false, error: 'Please enter a referral code.' };
  }

  try {
    const res = await fetch(`/api/referrals/validate?code=${encodeURIComponent(cleanCode)}`);
    const json = await res.json().catch(() => null);
    if (res.ok && json?.valid) {
      return json as ValidatedReferralInfo;
    }
    if (json && json.valid === false && !json.fallbackNeeded) {
      // Fall through to Supabase lookup in case the referrer exists in Supabase only
    }
  } catch {
    // Fallback to Supabase RPC below
  }

  try {
    const client = supabase || (await ensureSupabase());
    if (client) {
      const { data, error } = await client.rpc('lookup_referral_code', { p_code: cleanCode });
      if (!error && data && typeof data === 'object' && (data as any).valid) {
        return data as ValidatedReferralInfo;
      }
    }
  } catch {
    // ignore
  }

  return { valid: false, error: 'Referral code not found. Please check and try again.' };
}

/**
 * Attributes a pending or explicit referral code to the authenticated user's persisted business.
 * Persists via Supabase `apply_referral_attribution` RPC (when UUID) AND server API `/api/referrals/attribute`.
 */
export async function attributeReferralForBusiness(params: {
  businessId: string;
  referralCode?: string;
  phone?: string;
  source?: string;
}): Promise<{
  success: boolean;
  attributed?: boolean;
  already_attributed?: boolean;
  self_referral?: boolean;
  referral_code?: string;
  referrer_name?: string;
  message?: string;
  error?: string;
}> {
  const pending = getPendingReferral();
  const cleanCode = normalizeReferralCode(params.referralCode || pending?.code);
  if (!cleanCode) {
    return { success: false, error: 'No referral code to attribute.' };
  }

  const cleanSource = params.source || pending?.source || 'link';
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(params.businessId || '').trim()
  );

  let supabaseAttributed = false;
  let supabaseResult: any = null;

  // 1. Apply authoritatively inside Supabase PostgreSQL when a persisted UUID exists
  if (isUuid) {
    try {
      const client = supabase || (await ensureSupabase());
      if (client) {
        const { data, error } = await client.rpc('apply_referral_attribution', {
          p_referral_code: cleanCode,
          p_referred_business_id: params.businessId,
          p_source: cleanSource,
        });
        if (!error && data && typeof data === 'object') {
          supabaseResult = data;
          if ((data as any).success) {
            supabaseAttributed = true;
          } else if ((data as any).self_referral) {
            clearPendingReferral();
            return {
              success: false,
              self_referral: true,
              error: (data as any).error || 'Self-referral is not allowed.',
            };
          }
        }
      }
    } catch {
      // Continue to server API check/sync
    }
  }

  // 2. Also persist/sync via Express server API (/api/referrals/attribute)
  try {
    const res = await authFetch('/api/referrals/attribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referral_code: cleanCode,
        business_id: params.businessId,
        phone: params.phone,
        source: cleanSource,
      }),
    });
    const json = await res.json().catch(() => ({}));

    if (res.ok && json?.success) {
      clearPendingReferral();
      return {
        success: true,
        attributed: !json.already_attributed,
        already_attributed: Boolean(json.already_attributed),
        referral_code: json.referral_code || cleanCode,
        referrer_name: json.referrer_name || supabaseResult?.referrer_name,
        message: json.message,
      };
    }

    if (json?.self_referral) {
      clearPendingReferral();
      return {
        success: false,
        self_referral: true,
        error: json.error || 'Self-referral is not allowed.',
      };
    }

    if (supabaseAttributed) {
      clearPendingReferral();
      return {
        success: true,
        attributed: !supabaseResult?.already_attributed,
        already_attributed: Boolean(supabaseResult?.already_attributed),
        referral_code: supabaseResult?.referral_code || cleanCode,
        referrer_name: supabaseResult?.referrer_name,
        message: supabaseResult?.message,
      };
    }

    return {
      success: false,
      error: json?.error || supabaseResult?.error || 'Could not attribute referral code.',
    };
  } catch (err: any) {
    if (supabaseAttributed) {
      clearPendingReferral();
      return {
        success: true,
        attributed: !supabaseResult?.already_attributed,
        already_attributed: Boolean(supabaseResult?.already_attributed),
        referral_code: supabaseResult?.referral_code || cleanCode,
        referrer_name: supabaseResult?.referrer_name,
      };
    }
    return {
      success: false,
      error: err?.message || 'Failed to save referral attribution.',
    };
  }
}

/**
 * Loads the authenticated user's own referral code, share link, and referral counts.
 */
export async function fetchMyReferralSummary(businessId?: string): Promise<ReferralSummaryData | null> {
  try {
    const query = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
    const res = await authFetch(`/api/referrals/me${query}`);
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success && json?.data) {
      const data = json.data as ReferralSummaryData;
      return {
        ...data,
        shareUrl: getShareableReferralUrl(data.referralCode) || data.shareUrl,
      };
    }
  } catch {
    // fallback to Supabase direct read below
  }

  try {
    const client = supabase || (await ensureSupabase());
    if (!client) return null;
    const { data: sessData } = await client.auth.getSession();
    const uid = sessData?.session?.user?.id;
    if (!uid) return null;

    let bizQuery = client
      .from('businesses')
      .select('id, referral_code, referred_code_used, referred_at')
      .eq('owner_user_id', uid)
      .limit(1);
    if (businessId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(businessId)) {
      bizQuery = client
        .from('businesses')
        .select('id, referral_code, referred_code_used, referred_at')
        .eq('id', businessId)
        .limit(1);
    }
    const { data: bizRows } = await bizQuery;
    const biz = bizRows?.[0];
    if (!biz?.referral_code) return null;

    const { data: sentRefs } = await client
      .from('referrals')
      .select('id, status, created_at, referred_business_id')
      .eq('referrer_business_id', biz.id)
      .order('created_at', { ascending: false })
      .limit(20);

    return {
      referralCode: biz.referral_code,
      shareUrl: getShareableReferralUrl(biz.referral_code),
      referralsCount: Array.isArray(sentRefs) ? sentRefs.length : 0,
      referredBy: biz.referred_code_used
        ? {
            referral_code: biz.referred_code_used,
            attributed_at: biz.referred_at || undefined,
          }
        : null,
      recentReferrals: Array.isArray(sentRefs)
        ? sentRefs.map((r: any) => ({
            id: r.id,
            referred_business_name: 'Referred MatthOrg Business',
            status: r.status || 'attributed',
            created_at: r.created_at,
          }))
        : [],
    };
  } catch {
    return null;
  }
}
