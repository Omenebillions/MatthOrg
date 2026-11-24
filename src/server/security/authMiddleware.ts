import type { Request, Response, NextFunction } from 'express';
import { readStoreFile } from '../commerce/store';
import {
  getSecurityTestHarness,
  getSupabaseServiceClient,
  getSupabaseUserClient,
  verifySupabaseAccessToken,
} from './supabaseServer';
import { getUserAccountById, ServerPlanTier } from './userAccounts';

export interface AuthUserContext {
  id: string;
  email: string;
  phone?: string;
  accessToken: string;
}

export interface AuthenticatedRequest extends Request {
  authUser?: AuthUserContext;
  authIsAdmin?: boolean;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuidString(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value.trim());
}

export function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || typeof header !== 'string') return null;
  const parts = header.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return null;
  const token = parts[1].trim();
  return token.length > 0 ? token : null;
}

async function authenticateRequest(req: Request): Promise<AuthUserContext | null> {
  const token = extractBearerToken(req);
  if (!token) return null;
  const verified = await verifySupabaseAccessToken(token);
  if (!verified) return null;
  return {
    id: verified.id,
    email: verified.email || '',
    phone: verified.phone ? String(verified.phone).trim() : undefined,
    accessToken: token,
  };
}

/**
 * Middleware: Requires a valid, non-expired Supabase Bearer token.
 * Sets req.authUser from Supabase verification — NEVER trusts x-actor-user-id or body user IDs.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (req.authUser?.id) {
    return next();
  }
  const authUser = await authenticateRequest(req);
  if (!authUser) {
    res.status(401).json({ error: 'Authentication required. Please sign in with a valid session token.' });
    return;
  }
  req.authUser = authUser;
  next();
}

/**
 * Resolves platform admin status strictly from server-side DB (`public.platform_admins`).
 * Fails closed (`false`) if missing, inactive, or unreachable.
 */
export async function resolveIsPlatformAdmin(authUser: AuthUserContext): Promise<boolean> {
  const harness = getSecurityTestHarness();
  if (harness) {
    return harness.isAdmin(authUser.id);
  }

  try {
    const client = getSupabaseServiceClient() || getSupabaseUserClient(authUser.accessToken);
    const { data, error } = await client
      .from('platform_admins')
      .select('user_id, role, is_active')
      .eq('user_id', authUser.id)
      .eq('is_active', true)
      .maybeSingle();

    if (!error && data?.user_id === authUser.id && data.is_active === true) {
      return true;
    }

    // Fallback check via SECURITY DEFINER RPC (0-arg function evaluating auth.uid() from JWT)
    const userClient = getSupabaseUserClient(authUser.accessToken);
    const rpcRes = await userClient.rpc('is_platform_admin');
    if (!rpcRes.error && rpcRes.data === true) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * Optional auth resolver for mixed endpoints (e.g., public catalog vs unpublished business view).
 * Never sets req.authUser from headers/body without Supabase JWT verification.
 */
export async function attachOptionalAuth(req: AuthenticatedRequest): Promise<AuthUserContext | null> {
  if (req.authUser?.id) return req.authUser;
  const user = await authenticateRequest(req);
  if (user) {
    req.authUser = user;
  }
  return user;
}

/**
 * Middleware: Requires both valid authentication and server-verified platform admin membership.
 */
export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.authUser?.id) {
    const authUser = await authenticateRequest(req);
    if (!authUser) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    req.authUser = authUser;
  }

  const isAdmin = await resolveIsPlatformAdmin(req.authUser);
  req.authIsAdmin = isAdmin;
  if (!isAdmin) {
    res.status(403).json({ error: 'Forbidden: Platform administrator privileges required.' });
    return;
  }
  next();
}

/**
 * Returns all business IDs legitimately owned or member-linked to the authenticated user.
 */
export async function getUserBusinessIds(authUser: AuthUserContext): Promise<string[]> {
  const harness = getSecurityTestHarness();
  if (harness) {
    return harness.getUserBusinessIds(authUser.id);
  }

  const ids = new Set<string>();
  const store = readStoreFile();

  // 1. Check authenticated user's own workspace store in mathorg_store.json
  const userWorkspace = store[authUser.id];
  if (userWorkspace?.business?.id) {
    ids.add(String(userWorkspace.business.id));
  }
  const account = getUserAccountById(authUser.id);
  if (account?.linked_business_ids) {
    account.linked_business_ids.forEach((bid) => ids.add(bid));
  }

  // 2. Check directory businesses explicitly owned by this user ID
  const dirList = Array.isArray(store.__directory_businesses) ? store.__directory_businesses : [];
  for (const b of dirList) {
    if (b?.owner_user_id === authUser.id) {
      if (b.id) ids.add(String(b.id));
      if (b.linked_business_id) ids.add(String(b.linked_business_id));
    }
  }

  // 3. Check Supabase businesses + business_members
  try {
    const client = getSupabaseServiceClient() || getSupabaseUserClient(authUser.accessToken);
    const [ownedRes, memberRes] = await Promise.all([
      client.from('businesses').select('id').eq('owner_user_id', authUser.id),
      client.from('business_members').select('business_id').eq('user_id', authUser.id),
    ]);

    if (!ownedRes.error && Array.isArray(ownedRes.data)) {
      ownedRes.data.forEach((row: any) => {
        if (row?.id) ids.add(String(row.id));
      });
    }
    if (!memberRes.error && Array.isArray(memberRes.data)) {
      memberRes.data.forEach((row: any) => {
        if (row?.business_id) ids.add(String(row.business_id));
      });
    }
  } catch {
    // non-blocking
  }

  return Array.from(ids);
}

/**
 * Verifies whether the authenticated user owns or belongs to targetBusinessId.
 */
export async function resolveUserBusinessMembership(
  authUser: AuthUserContext,
  targetBusinessId: string
): Promise<boolean> {
  if (!targetBusinessId || typeof targetBusinessId !== 'string') return false;
  const cleanTarget = targetBusinessId.trim();
  if (!cleanTarget) return false;

  const harness = getSecurityTestHarness();
  if (harness) {
    return harness.hasBusinessAccess(authUser.id, cleanTarget);
  }

  // Check local workspace + linked account records first
  const ownedIds = await getUserBusinessIds(authUser);
  if (ownedIds.includes(cleanTarget)) {
    return true;
  }

  // Direct Supabase check for UUID business IDs
  if (isUuidString(cleanTarget)) {
    try {
      const client = getSupabaseServiceClient() || getSupabaseUserClient(authUser.accessToken);
      const { data: bizRow } = await client
        .from('businesses')
        .select('id, owner_user_id')
        .eq('id', cleanTarget)
        .maybeSingle();

      if (bizRow?.owner_user_id === authUser.id) return true;

      const { data: memberRow } = await client
        .from('business_members')
        .select('id')
        .eq('business_id', cleanTarget)
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (memberRow?.id) return true;
    } catch {
      return false;
    }
  }

  return false;
}

export interface AuthoritativeSubscription {
  plan: ServerPlanTier;
  status: string;
  isPaid: boolean;
  expiresAt?: string;
}

function isPlanActive(planRaw: unknown, statusRaw: unknown, expiresAt?: unknown): boolean {
  const plan = String(planRaw || 'free').toLowerCase().trim();
  if (plan !== 'pro' && plan !== 'business') return false;
  const status = String(statusRaw || '').toLowerCase().trim();
  if (status && status !== 'active' && status !== 'trialing') return false;
  if (expiresAt) {
    const ts = new Date(String(expiresAt)).getTime();
    if (!Number.isNaN(ts) && ts < Date.now()) return false;
  }
  return true;
}

/**
 * Computes active subscription tier strictly from server DB & server-verified account records.
 * NEVER trusts client-supplied subscription_plan, userPlan, subscription_status, or expiry dates.
 */
export async function getAuthoritativeSubscription(
  authUser: AuthUserContext,
  targetBusinessId?: string
): Promise<AuthoritativeSubscription> {
  const harness = getSecurityTestHarness();
  if (harness) {
    const mocked = await harness.getSubscription(authUser.id, targetBusinessId);
    if (!mocked) {
      return { plan: 'free', status: 'inactive', isPaid: false };
    }
    const isPaid = isPlanActive(mocked.plan, mocked.status, mocked.expiresAt);
    return {
      plan: isPaid ? mocked.plan : 'free',
      status: mocked.status || 'inactive',
      isPaid,
      expiresAt: mocked.expiresAt,
    };
  }

  // 1. Check Supabase businesses table for owned/member businesses
  try {
    const client = getSupabaseServiceClient() || getSupabaseUserClient(authUser.accessToken);
    if (targetBusinessId && isUuidString(targetBusinessId)) {
      const hasAccess = await resolveUserBusinessMembership(authUser, targetBusinessId);
      if (hasAccess) {
        const { data: biz } = await client
          .from('businesses')
          .select('subscription_plan, subscription_status, subscription_expires_at')
          .eq('id', targetBusinessId)
          .maybeSingle();

        if (biz && isPlanActive(biz.subscription_plan, biz.subscription_status, biz.subscription_expires_at)) {
          const plan = String(biz.subscription_plan).toLowerCase() as ServerPlanTier;
          return {
            plan,
            status: String(biz.subscription_status || 'active'),
            isPaid: true,
            expiresAt: biz.subscription_expires_at || undefined,
          };
        }
      }
    }

    const { data: ownedBusinesses } = await client
      .from('businesses')
      .select('id, subscription_plan, subscription_status, subscription_expires_at')
      .eq('owner_user_id', authUser.id);

    if (Array.isArray(ownedBusinesses)) {
      for (const biz of ownedBusinesses) {
        if (isPlanActive(biz.subscription_plan, biz.subscription_status, biz.subscription_expires_at)) {
          const plan = String(biz.subscription_plan).toLowerCase() as ServerPlanTier;
          return {
            plan,
            status: String(biz.subscription_status || 'active'),
            isPaid: true,
            expiresAt: biz.subscription_expires_at || undefined,
          };
        }
      }
    }
  } catch {
    // Fall through to server account check
  }

  // 2. Check server-verified account store (__user_accounts, mutated ONLY by Paystack webhook/verify)
  const account = getUserAccountById(authUser.id);
  if (account && isPlanActive(account.plan, account.subscription_status || 'active', account.subscription_expires_at)) {
    return {
      plan: account.plan,
      status: account.subscription_status || 'active',
      isPaid: true,
      expiresAt: account.subscription_expires_at,
    };
  }

  return {
    plan: account?.plan === 'pro' || account?.plan === 'business' ? account.plan : 'free',
    status: account?.subscription_status || 'inactive',
    isPaid: false,
    expiresAt: account?.subscription_expires_at,
  };
}

function maskDisplayName(name: unknown): string {
  const clean = String(name || 'Verified Buyer').trim();
  if (!clean) return 'Verified Buyer';
  const parts = clean.split(/\s+/);
  if (parts.length === 1) {
    return parts[0].length <= 2 ? `${parts[0][0]}***` : `${parts[0].slice(0, 2)}***`;
  }
  return `${parts[0]} ${parts[1][0]}.`;
}

/**
 * Strips/masks buyer private contact details (phone, WhatsApp, email, full surname)
 * server-side whenever the caller does not have an active paid subscription or admin role.
 */
export function maskCustomerRequestContacts<T extends Record<string, any>>(
  requestRecord: T,
  canViewFullContacts: boolean
): T & { is_contact_masked: boolean } {
  if (canViewFullContacts) {
    return {
      ...requestRecord,
      is_contact_masked: false,
    };
  }

  return {
    ...requestRecord,
    customer_name: maskDisplayName(requestRecord.customer_name),
    phone: '',
    whatsapp: '',
    email: '',
    is_contact_masked: true,
  };
}
