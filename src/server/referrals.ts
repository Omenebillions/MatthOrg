import crypto from 'crypto';
import {
  getDirectoryBusinesses,
  readStoreFile,
  saveDirectoryBusinesses,
  writeStoreFile,
} from './commerce/store';
import { AuthUserContext, getUserBusinessIds, isUuidString } from './security/authMiddleware';
import { getSupabaseServiceClient, getSupabaseUserClient } from './security/supabaseServer';
import { getOrInitServerAccount, getUserAccountById } from './security/userAccounts';
import { nigerianPhonesMatch, validateAndNormalizeNigerianPhone } from '../utils/nigerianPhone';

export interface ServerReferralAttribution {
  id: string;
  referral_code: string;
  referrer_user_id: string;
  referrer_business_id: string;
  referrer_business_name: string;
  referrer_phone?: string;
  referred_user_id: string;
  referred_business_id: string;
  referred_business_name?: string;
  referred_phone?: string;
  referred_location?: string;
  source: string;
  status: 'attributed' | 'verified';
  created_at: string;
}

export function normalizeReferralCodeServer(raw?: unknown): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '');
}

export function generateDeterministicReferralCode(seed: string): string {
  const digest = crypto.createHash('sha256').update(`matthorg-ref:${seed}`).digest('hex');
  return `MO-${digest.slice(0, 8).toUpperCase()}`;
}

function getAttributionsList(store: Record<string, any>): ServerReferralAttribution[] {
  return Array.isArray(store.__referral_attributions) ? store.__referral_attributions : [];
}

function getCodeRegistry(store: Record<string, any>): Record<
  string,
  {
    referral_code: string;
    owner_user_id: string;
    business_id: string;
    business_name: string;
    phone?: string;
    location?: string;
    industry?: string;
    created_at: string;
  }
> {
  if (!store.__referral_codes || typeof store.__referral_codes !== 'object' || Array.isArray(store.__referral_codes)) {
    store.__referral_codes = {};
  }
  return store.__referral_codes;
}

/**
 * Ensures an authoritative referral code is registered for a business/user in local store & Supabase.
 */
export async function ensureBusinessReferralCodeServer(params: {
  authUser: AuthUserContext;
  businessId?: string;
  businessName?: string;
  phone?: string;
  location?: string;
  industry?: string;
}): Promise<string> {
  const { authUser } = params;
  const store = readStoreFile();
  const codes = getCodeRegistry(store);
  const dirList = getDirectoryBusinesses();

  let targetBizId = params.businessId || '';
  if (!targetBizId) {
    const ownedIds = await getUserBusinessIds(authUser);
    targetBizId = ownedIds[0] || `biz_${authUser.id}`;
  }

  // 1. Check Supabase first if UUID exists
  const client = getSupabaseServiceClient() || getSupabaseUserClient(authUser.accessToken);
  if (isUuidString(targetBizId)) {
    try {
      const { data: supaBiz } = await client
        .from('businesses')
        .select('id, name, phone, state, city, industry, referral_code')
        .eq('id', targetBizId)
        .maybeSingle();
      if (supaBiz?.referral_code) {
        const cleanCode = normalizeReferralCodeServer(supaBiz.referral_code);
        codes[cleanCode] = {
          referral_code: cleanCode,
          owner_user_id: authUser.id,
          business_id: supaBiz.id,
          business_name: supaBiz.name || params.businessName || 'MatthOrg Business',
          phone: supaBiz.phone || params.phone || authUser.phone || undefined,
          location: [supaBiz.city, supaBiz.state].filter(Boolean).join(', ') || params.location,
          industry: supaBiz.industry || params.industry,
          created_at: new Date().toISOString(),
        };
        writeStoreFile(store);
        return cleanCode;
      }
    } catch {
      // ignore if migration column is pending
    }
  }

  // 2. Check existing registered code in store for this user/business
  const existingEntry = Object.values(codes).find(
    (entry) => entry.business_id === targetBizId || entry.owner_user_id === authUser.id
  );
  if (existingEntry?.referral_code) {
    return existingEntry.referral_code;
  }

  // 3. Check directory business
  const dirMatch = dirList.find(
    (b: any) =>
      b.id === targetBizId ||
      b.linked_business_id === targetBizId ||
      b.owner_user_id === authUser.id
  );
  if (dirMatch && (dirMatch as any).referral_code) {
    const cleanCode = normalizeReferralCodeServer((dirMatch as any).referral_code);
    codes[cleanCode] = {
      referral_code: cleanCode,
      owner_user_id: authUser.id,
      business_id: dirMatch.linked_business_id || dirMatch.id,
      business_name: dirMatch.business_name,
      phone: dirMatch.phone || params.phone || authUser.phone || undefined,
      location: [dirMatch.city, dirMatch.state].filter(Boolean).join(', ') || params.location,
      industry: dirMatch.industry || params.industry,
      created_at: new Date().toISOString(),
    };
    writeStoreFile(store);
    return cleanCode;
  }

  // 4. Generate deterministic unique code
  const newCode = generateDeterministicReferralCode(`${authUser.id}:${targetBizId}`);
  const account = getUserAccountById(authUser.id);
  const resolvedName =
    params.businessName ||
    dirMatch?.business_name ||
    account?.business_name ||
    account?.name ||
    'MatthOrg Provider';
  const resolvedPhone =
    params.phone || dirMatch?.phone || authUser.phone || account?.phone || undefined;
  const resolvedLoc =
    params.location ||
    (dirMatch ? [dirMatch.city, dirMatch.state].filter(Boolean).join(', ') : undefined) ||
    (account ? [account.city, account.state].filter(Boolean).join(', ') : undefined);

  codes[newCode] = {
    referral_code: newCode,
    owner_user_id: authUser.id,
    business_id: targetBizId,
    business_name: resolvedName,
    phone: resolvedPhone,
    location: resolvedLoc,
    industry: params.industry || dirMatch?.industry,
    created_at: new Date().toISOString(),
  };

  if (dirMatch) {
    (dirMatch as any).referral_code = newCode;
    saveDirectoryBusinesses(dirList);
  }
  writeStoreFile(store);
  return newCode;
}

/**
 * Resolves a referral code to its referrer business without exposing PII publicly.
 */
export async function validateReferralCodeServer(rawCode: unknown): Promise<{
  valid: boolean;
  referral_code?: string;
  referrer_business_id?: string;
  referrer_user_id?: string;
  referrer_name?: string;
  referrer_industry?: string;
  referrer_location?: string;
  referrer_phone?: string;
  error?: string;
}> {
  const cleanCode = normalizeReferralCodeServer(rawCode);
  if (!cleanCode || cleanCode.length < 4) {
    return { valid: false, error: 'Invalid referral code format.' };
  }

  // 1. Check Supabase RPC / service table first
  const svcClient = getSupabaseServiceClient();
  if (svcClient) {
    try {
      const { data: supaBiz } = await svcClient
        .from('businesses')
        .select('id, owner_user_id, name, phone, phone_e164, industry, state, city, referral_code')
        .ilike('referral_code', cleanCode)
        .maybeSingle();

      if (supaBiz?.id) {
        return {
          valid: true,
          referral_code: normalizeReferralCodeServer(supaBiz.referral_code),
          referrer_business_id: supaBiz.id,
          referrer_user_id: supaBiz.owner_user_id,
          referrer_name: supaBiz.name || 'MatthOrg Partner',
          referrer_industry: supaBiz.industry || undefined,
          referrer_location: [supaBiz.city, supaBiz.state].filter(Boolean).join(', ') || undefined,
          referrer_phone: supaBiz.phone_e164 || supaBiz.phone || undefined,
        };
      }
    } catch {
      // fall through to store check
    }
  }

  // 2. Check local registry & directory businesses
  const store = readStoreFile();
  const codes = getCodeRegistry(store);
  const regHit = codes[cleanCode];
  if (regHit) {
    return {
      valid: true,
      referral_code: regHit.referral_code,
      referrer_business_id: regHit.business_id,
      referrer_user_id: regHit.owner_user_id,
      referrer_name: regHit.business_name,
      referrer_industry: regHit.industry,
      referrer_location: regHit.location,
      referrer_phone: regHit.phone,
    };
  }

  const dirList = getDirectoryBusinesses();
  const dirHit = dirList.find(
    (b: any) => normalizeReferralCodeServer(b?.referral_code) === cleanCode
  );
  if (dirHit) {
    return {
      valid: true,
      referral_code: cleanCode,
      referrer_business_id: dirHit.linked_business_id || dirHit.id,
      referrer_user_id: (dirHit as any).owner_user_id,
      referrer_name: dirHit.business_name,
      referrer_industry: dirHit.industry,
      referrer_location: [dirHit.city, dirHit.state].filter(Boolean).join(', ') || undefined,
      referrer_phone: dirHit.phone,
    };
  }

  return { valid: false, error: 'Referral code not found.' };
}

/**
 * Attributes a referral server-side with strict ownership, anti-self-referral,
 * and no-overwrite immutability protections.
 */
export async function attributeReferralServer(params: {
  authUser: AuthUserContext;
  referralCode: unknown;
  businessId?: unknown;
  phone?: unknown;
  businessName?: unknown;
  location?: unknown;
  source?: unknown;
}): Promise<{
  ok: boolean;
  status: number;
  already_attributed?: boolean;
  self_referral?: boolean;
  locked?: boolean;
  referral_code?: string;
  referrer_name?: string;
  attribution?: ServerReferralAttribution;
  error?: string;
  message?: string;
}> {
  const { authUser } = params;
  const cleanCode = normalizeReferralCodeServer(params.referralCode);
  if (!cleanCode) {
    return { ok: false, status: 400, error: 'Referral code is required.' };
  }

  const ownedIds = await getUserBusinessIds(authUser);
  const dirListForOwnership = getDirectoryBusinesses();
  const ownedDirIds = dirListForOwnership
    .filter((b: any) => b?.owner_user_id === authUser.id)
    .flatMap((b: any) => [b.id, b.linked_business_id].filter(Boolean));
  const allOwnedIds = new Set<string>([...ownedIds, ...ownedDirIds, `biz_${authUser.id}`]);

  const requestedBizId = params.businessId ? String(params.businessId).trim() : '';
  const targetBizId = requestedBizId || ownedIds[0] || ownedDirIds[0] || `biz_${authUser.id}`;

  if (requestedBizId && !allOwnedIds.has(requestedBizId)) {
    return {
      ok: false,
      status: 403,
      error: 'Forbidden: You can only attribute a referral to your own business.',
    };
  }

  const store = readStoreFile();
  const existingList = getAttributionsList(store);

  // 1. Immutability guard: never overwrite an already-attributed user or business
  const existingAttribution = existingList.find(
    (a) => a.referred_user_id === authUser.id || a.referred_business_id === targetBizId
  );
  if (existingAttribution) {
    return {
      ok: true,
      status: 200,
      already_attributed: true,
      locked: true,
      referral_code: existingAttribution.referral_code,
      referrer_name: existingAttribution.referrer_business_name,
      attribution: existingAttribution,
      message: 'Referral attribution is already locked and cannot be overwritten.',
    };
  }

  // 2. Resolve referrer strictly from code
  const referrer = await validateReferralCodeServer(cleanCode);
  if (!referrer.valid || !referrer.referral_code) {
    return {
      ok: false,
      status: 404,
      error: referrer.error || 'Referral code not found.',
    };
  }

  // 3. Anti-self-referral validation (user_id, business_id, and normalized Nigerian phone)
  if (
    (referrer.referrer_user_id && referrer.referrer_user_id === authUser.id) ||
    (referrer.referrer_business_id && referrer.referrer_business_id === targetBizId)
  ) {
    return {
      ok: false,
      status: 400,
      self_referral: true,
      error: 'Self-referral is not allowed.',
    };
  }

  const callerAccount = getOrInitServerAccount(authUser.id, {
    email: authUser.email,
    phone: authUser.phone,
  });
  const dirList = getDirectoryBusinesses();
  const referredDirBiz = dirList.find(
    (b: any) =>
      b.id === targetBizId ||
      b.linked_business_id === targetBizId ||
      b.owner_user_id === authUser.id
  );

  const rawCallerPhone =
    (params.phone ? String(params.phone).trim() : '') ||
    authUser.phone ||
    referredDirBiz?.phone ||
    callerAccount.phone ||
    '';

  const normalizedCallerPhone = rawCallerPhone
    ? validateAndNormalizeNigerianPhone(rawCallerPhone).normalizedE164 || rawCallerPhone
    : '';

  if (
    referrer.referrer_phone &&
    normalizedCallerPhone &&
    nigerianPhonesMatch(referrer.referrer_phone, normalizedCallerPhone)
  ) {
    return {
      ok: false,
      status: 400,
      self_referral: true,
      error: 'Self-referral using the same phone number is not allowed.',
    };
  }

  // 4. Sync with Supabase via service client if UUID + service key available
  const svcClient = getSupabaseServiceClient();
  if (svcClient && isUuidString(targetBizId) && isUuidString(referrer.referrer_business_id || '')) {
    try {
      const { data: existingSupa } = await svcClient
        .from('businesses')
        .select('id, referred_by_business_id, referred_code_used, referred_at')
        .eq('id', targetBizId)
        .maybeSingle();

      if (existingSupa?.referred_by_business_id) {
        return {
          ok: true,
          status: 200,
          already_attributed: true,
          locked: true,
          referral_code: existingSupa.referred_code_used || referrer.referral_code,
          referrer_name: referrer.referrer_name,
          message: 'Referral attribution is already locked in database.',
        };
      }

      if (referrer.referrer_user_id) {
        await svcClient.from('referrals').insert({
          referrer_business_id: referrer.referrer_business_id,
          referrer_user_id: referrer.referrer_user_id,
          referred_business_id: targetBizId,
          referred_user_id: authUser.id,
          referral_code: referrer.referral_code,
          referrer_phone_e164: referrer.referrer_phone || null,
          referred_phone_e164: normalizedCallerPhone || null,
          source: String(params.source || 'link'),
          status: 'attributed',
        });

        await svcClient
          .from('businesses')
          .update({
            referred_by_business_id: referrer.referrer_business_id,
            referred_by_user_id: referrer.referrer_user_id,
            referred_code_used: referrer.referral_code,
            referred_at: new Date().toISOString(),
          })
          .eq('id', targetBizId)
          .is('referred_by_business_id', null);
      }
    } catch {
      // Non-fatal if client also calls apply_referral_attribution RPC or migration pending
    }
  }

  // 5. Persist immutable attribution record in server store
  const record: ServerReferralAttribution = {
    id: `ref_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    referral_code: referrer.referral_code,
    referrer_user_id: referrer.referrer_user_id || '',
    referrer_business_id: referrer.referrer_business_id || '',
    referrer_business_name: referrer.referrer_name || 'MatthOrg Partner',
    referrer_phone: referrer.referrer_phone,
    referred_user_id: authUser.id,
    referred_business_id: targetBizId,
    referred_business_name:
      (params.businessName ? String(params.businessName).trim() : '') ||
      referredDirBiz?.business_name ||
      callerAccount.business_name ||
      callerAccount.name,
    referred_phone: normalizedCallerPhone || undefined,
    referred_location:
      (params.location ? String(params.location).trim() : '') ||
      (referredDirBiz
        ? [referredDirBiz.city, referredDirBiz.lga, referredDirBiz.state].filter(Boolean).join(', ')
        : undefined),
    source: String(params.source || 'link').slice(0, 40),
    status: 'attributed',
    created_at: new Date().toISOString(),
  };

  store.__referral_attributions = [record, ...existingList];
  writeStoreFile(store);

  return {
    ok: true,
    status: 201,
    already_attributed: false,
    referral_code: record.referral_code,
    referrer_name: record.referrer_business_name,
    attribution: record,
  };
}

export async function getReferralSummaryForUserServer(
  authUser: AuthUserContext,
  requestedBusinessId?: string
) {
  const store = readStoreFile();
  const list = getAttributionsList(store);
  const ownedIds = await getUserBusinessIds(authUser);
  const primaryBizId = requestedBusinessId || ownedIds[0] || `biz_${authUser.id}`;

  const referralCode = await ensureBusinessReferralCodeServer({
    authUser,
    businessId: primaryBizId,
  });

  const sent = list.filter(
    (r) =>
      r.referrer_user_id === authUser.id ||
      r.referrer_business_id === primaryBizId ||
      r.referral_code === referralCode
  );
  const received = list.find(
    (r) => r.referred_user_id === authUser.id || r.referred_business_id === primaryBizId
  );

  return {
    referralCode,
    shareUrl: `/business?ref=${encodeURIComponent(referralCode)}`,
    referralsCount: sent.length,
    referredBy: received
      ? {
          referral_code: received.referral_code,
          referrer_name: received.referrer_business_name,
          attributed_at: received.created_at,
        }
      : null,
    recentReferrals: sent.slice(0, 20).map((r) => ({
      id: r.id,
      referred_business_name: r.referred_business_name || 'Listed Provider',
      referred_location: r.referred_location,
      status: r.status,
      created_at: r.created_at,
    })),
  };
}
