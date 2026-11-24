import { readStoreFile, writeStoreFile } from '../commerce/store';
import {
  ALLOWED_STORE_BUSINESS_FIELDS,
  ALLOWED_USER_PROFILE_UPDATE_FIELDS,
  ALLOWED_USER_REGISTRATION_FIELDS,
  isPlainObject,
  pickAllowedFields,
  stripForbiddenFieldsDeep,
} from './massAssignment';

export type ServerUserRole = 'user' | 'admin';
export type ServerPlanTier = 'free' | 'pro' | 'business';

export interface ServerUserAccount {
  id: string;
  user_id: string;
  email: string;
  name: string;
  business_name?: string;
  phone?: string;
  state?: string;
  city?: string;
  role: ServerUserRole;
  isAdmin: boolean;
  plan: ServerPlanTier;
  subscription_status?: string;
  subscription_expires_at?: string;
  plan_activated_at?: string;
  linked_business_ids?: string[];
  created_at: string;
  updated_at: string;
}

function getAccountsMap(store: Record<string, any>): Record<string, ServerUserAccount> {
  if (!isPlainObject(store.__user_accounts)) {
    store.__user_accounts = {};
  }
  return store.__user_accounts as Record<string, ServerUserAccount>;
}

/**
 * Registers or updates a user account strictly bound to the verified Supabase authUserId.
 * Role, isAdmin, plan, and user_id are ALWAYS set on the server.
 * Never accepts user_id/role/isAdmin/plan from req.body.
 */
export function registerUserAccountForAuthUser(
  authUserId: string,
  authEmail: string,
  rawBody: unknown,
  authPhone?: string
): { account: ServerUserAccount; isNew: boolean } {
  if (!authUserId) {
    throw new Error('Verified authenticated user ID is required.');
  }

  const safeInput = pickAllowedFields<{
    email: string;
    name: string;
    business_name: string;
    phone: string;
    state: string;
    city: string;
  }>(rawBody, ALLOWED_USER_REGISTRATION_FIELDS);

  const cleanEmail = String(authEmail || safeInput.email || '').trim().toLowerCase();
  const cleanPhone = String(authPhone || safeInput.phone || '').trim();
  const store = readStoreFile();
  const accounts = getAccountsMap(store);
  const existing = accounts[authUserId];
  const now = new Date().toISOString();

  if (existing) {
    if (safeInput.name !== undefined) existing.name = String(safeInput.name).trim() || existing.name;
    if (safeInput.business_name !== undefined) existing.business_name = String(safeInput.business_name).trim();
    if (cleanPhone) existing.phone = cleanPhone;
    if (safeInput.state !== undefined) existing.state = String(safeInput.state).trim();
    if (safeInput.city !== undefined) existing.city = String(safeInput.city).trim();
    if (cleanEmail) existing.email = cleanEmail;
    existing.updated_at = now;
    accounts[authUserId] = existing;
    writeStoreFile(store);
    return { account: existing, isNew: false };
  }

  const created: ServerUserAccount = {
    id: authUserId,
    user_id: authUserId,
    email: cleanEmail,
    name: String(
      safeInput.name ||
        safeInput.business_name ||
        (cleanEmail ? cleanEmail.split('@')[0] : cleanPhone || 'MatthOrg Member')
    ).trim(),
    business_name: safeInput.business_name ? String(safeInput.business_name).trim() : undefined,
    phone: cleanPhone || undefined,
    state: safeInput.state ? String(safeInput.state).trim() : undefined,
    city: safeInput.city ? String(safeInput.city).trim() : undefined,
    role: 'user',
    isAdmin: false,
    plan: 'free',
    subscription_status: 'inactive',
    created_at: now,
    updated_at: now,
  };

  accounts[authUserId] = created;
  writeStoreFile(store);
  return { account: created, isNew: true };
}

/**
 * Ensures an account record exists in __user_accounts for a verified authUserId.
 * Always initializes new accounts with role: 'user', isAdmin: false, plan: 'free'.
 */
export function getOrInitServerAccount(
  userId: string,
  safeProfile?: { name?: string; email?: string; phone?: string }
): ServerUserAccount {
  const store = readStoreFile();
  const accounts = getAccountsMap(store);
  const existing = accounts[userId];
  if (existing) {
    if (safeProfile?.phone && !existing.phone) {
      existing.phone = String(safeProfile.phone).trim();
      existing.updated_at = new Date().toISOString();
      accounts[userId] = existing;
      writeStoreFile(store);
    }
    return existing;
  }

  const now = new Date().toISOString();
  const existingUserWorkspace = isPlainObject(store[userId]?.user) ? store[userId].user : {};
  const cleanPhone = String(safeProfile?.phone || existingUserWorkspace.phone || '').trim();
  const created: ServerUserAccount = {
    id: userId,
    user_id: userId,
    email: String(safeProfile?.email || existingUserWorkspace.email || '').trim().toLowerCase(),
    name: String(
      safeProfile?.name || existingUserWorkspace.name || cleanPhone || 'MatthOrg User'
    ).trim(),
    phone: cleanPhone || undefined,
    role: 'user',
    isAdmin: false,
    plan: 'free',
    subscription_status: 'inactive',
    created_at: now,
    updated_at: now,
  };
  accounts[userId] = created;
  writeStoreFile(store);
  return created;
}

export function getUserAccountById(userId: string): ServerUserAccount | null {
  const store = readStoreFile();
  const accounts = getAccountsMap(store);
  return accounts[userId] || null;
}

export function linkBusinessToUserAccount(userId: string, businessId: string): void {
  if (!userId || !businessId) return;
  const store = readStoreFile();
  const accounts = getAccountsMap(store);
  const account = accounts[userId] || getOrInitServerAccount(userId);
  const existing = Array.isArray(account.linked_business_ids) ? account.linked_business_ids : [];
  if (!existing.includes(businessId)) {
    account.linked_business_ids = [...existing, businessId];
    account.updated_at = new Date().toISOString();
    accounts[userId] = account;
    writeStoreFile(store);
  }
}

export function updateUserAccountProfile(userId: string, rawBody: unknown): ServerUserAccount | null {
  const safeUpdates = pickAllowedFields<{
    name: string;
    business_name: string;
    phone: string;
    state: string;
    city: string;
  }>(rawBody, ALLOWED_USER_PROFILE_UPDATE_FIELDS);

  const store = readStoreFile();
  const accounts = getAccountsMap(store);
  const existing = accounts[userId];
  if (!existing) return null;

  const updated: ServerUserAccount = {
    ...existing,
    ...(safeUpdates.name !== undefined ? { name: String(safeUpdates.name).trim() } : {}),
    ...(safeUpdates.business_name !== undefined
      ? { business_name: String(safeUpdates.business_name).trim() }
      : {}),
    ...(safeUpdates.phone !== undefined ? { phone: String(safeUpdates.phone).trim() } : {}),
    ...(safeUpdates.state !== undefined ? { state: String(safeUpdates.state).trim() } : {}),
    ...(safeUpdates.city !== undefined ? { city: String(safeUpdates.city).trim() } : {}),
    // Strictly preserve server-authoritative fields
    id: existing.id,
    user_id: existing.user_id,
    role: existing.role,
    isAdmin: existing.isAdmin,
    plan: existing.plan,
    subscription_status: existing.subscription_status,
    subscription_expires_at: existing.subscription_expires_at,
    updated_at: new Date().toISOString(),
  };

  accounts[userId] = updated;
  writeStoreFile(store);
  return updated;
}

/**
 * Only invoked by server-verified platform admins (verified via Supabase JWT + platform_admins table).
 */
export function setTargetUserRoleAsVerifiedAdmin(params: {
  targetUserId: string;
  nextRole: ServerUserRole;
}): { ok: true; account: ServerUserAccount } | { ok: false; status: number; error: string } {
  const { targetUserId, nextRole } = params;
  if (nextRole !== 'user' && nextRole !== 'admin') {
    return { ok: false, status: 400, error: 'Invalid role. Allowed values: "user" or "admin".' };
  }

  const store = readStoreFile();
  const accounts = getAccountsMap(store);
  const target = accounts[targetUserId];
  if (!target) {
    return { ok: false, status: 404, error: 'Target user account not found.' };
  }

  target.role = nextRole;
  target.isAdmin = nextRole === 'admin';
  target.updated_at = new Date().toISOString();
  accounts[targetUserId] = target;

  if (isPlainObject(store[targetUserId]) && isPlainObject(store[targetUserId].user)) {
    store[targetUserId].user.role = target.role;
    store[targetUserId].user.isAdmin = target.isAdmin;
  }

  writeStoreFile(store);
  return { ok: true, account: target };
}

/**
 * Called strictly by server-verified Paystack payment confirmation / webhook.
 */
export function setAuthoritativeUserPlan(
  userId: string,
  plan: ServerPlanTier,
  durationDays = 30
): void {
  const store = readStoreFile();
  const accounts = getAccountsMap(store);
  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAtIso =
    plan === 'free'
      ? undefined
      : new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  if (accounts[userId]) {
    accounts[userId].plan = plan;
    accounts[userId].subscription_status = plan === 'free' ? 'inactive' : 'active';
    accounts[userId].subscription_expires_at = expiresAtIso;
    accounts[userId].plan_activated_at = nowIso;
    accounts[userId].updated_at = nowIso;
  }

  if (isPlainObject(store[userId])) {
    if (!isPlainObject(store[userId].user)) {
      store[userId].user = { id: userId, role: 'user', isAdmin: false, plan };
    } else {
      store[userId].user.plan = plan;
      store[userId].user.plan_activated_at = nowIso;
    }
    if (isPlainObject(store[userId].business)) {
      store[userId].business.subscription_plan = plan;
      store[userId].business.subscription_status = plan === 'free' ? 'inactive' : 'active';
      store[userId].business.subscription_expires_at = expiresAtIso;
    }
  }

  writeStoreFile(store);
}

/**
 * Tracks monthly AI quote generation usage strictly on the server (never trusts client usedCount).
 */
export function getServerAiUsage(userId: string): { month: string; count: number } {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const store = readStoreFile();
  const existing = store[userId]?.aiUsage;
  if (isPlainObject(existing) && existing.month === currentMonth) {
    return { month: currentMonth, count: Number(existing.count) || 0 };
  }
  return { month: currentMonth, count: 0 };
}

export function incrementServerAiUsage(userId: string): { month: string; count: number } {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const store = readStoreFile();
  if (!isPlainObject(store[userId])) {
    store[userId] = {};
  }
  const current = getServerAiUsage(userId);
  const next = { month: currentMonth, count: current.count + 1 };
  store[userId].aiUsage = next;
  writeStoreFile(store);
  return next;
}

/**
 * Sanitizes POST /api/store/:userId payloads so raw req.body is NEVER written straight into storage.
 * Strips forbidden privileged fields (role, isAdmin, plan, userId/user_id, verification flags)
 * and restores authoritative server values.
 */
export function sanitizeStoreSaveForUser(
  userId: string,
  rawBody: unknown,
  existingWorkspace: Record<string, any> | undefined
): Record<string, any> {
  const bodyObj = isPlainObject(rawBody) ? rawBody : {};
  const existing = isPlainObject(existingWorkspace) ? existingWorkspace : {};

  // Pick only safe profile fields from incoming user object
  const safeUserFields = pickAllowedFields<{ name: string; email: string }>(bodyObj.user, ['name', 'email']);
  const serverAccount = getOrInitServerAccount(userId, {
    name: safeUserFields.name ? String(safeUserFields.name).trim() : undefined,
    email: safeUserFields.email ? String(safeUserFields.email).trim() : undefined,
  });

  if (safeUserFields.name || safeUserFields.email) {
    const store = readStoreFile();
    const accounts = getAccountsMap(store);
    if (accounts[userId]) {
      if (safeUserFields.name) accounts[userId].name = String(safeUserFields.name).trim();
      if (safeUserFields.email) accounts[userId].email = String(safeUserFields.email).trim().toLowerCase();
      accounts[userId].updated_at = new Date().toISOString();
      writeStoreFile(store);
    }
  }

  const sanitizedUser = {
    ...(isPlainObject(existing.user) ? existing.user : {}),
    id: userId,
    user_id: userId,
    name: String(safeUserFields.name ?? existing.user?.name ?? serverAccount.name ?? 'MatthOrg User'),
    email: String(safeUserFields.email ?? existing.user?.email ?? serverAccount.email ?? ''),
    // Authoritative server privileges — NEVER accepted from req.body
    role: serverAccount.role,
    isAdmin: serverAccount.isAdmin,
    plan: serverAccount.plan,
    createdAt: existing.user?.createdAt || serverAccount.created_at,
  };

  // Pick only editable BusinessProfile fields; preserve server-owned identity, billing & verification flags
  const existingBiz = isPlainObject(existing.business) ? existing.business : {};
  const allowedBizUpdates = pickAllowedFields(bodyObj.business, ALLOWED_STORE_BUSINESS_FIELDS);
  const sanitizedBusiness = {
    ...existingBiz,
    ...allowedBizUpdates,
    id: existingBiz.id || `biz_${userId}`,
    user_id: userId,
    subscription_plan: serverAccount.plan,
    subscription_status: existingBiz.subscription_status || serverAccount.subscription_status || 'inactive',
    subscription_expires_at: existingBiz.subscription_expires_at || serverAccount.subscription_expires_at,
    subscription_current_period_end: existingBiz.subscription_current_period_end,
    phone_verified: Boolean(existingBiz.phone_verified),
    email_verified: Boolean(existingBiz.email_verified),
    identity_verified: Boolean(existingBiz.identity_verified),
    business_verified: Boolean(existingBiz.business_verified),
    service_verified: Boolean(existingBiz.service_verified),
    verification_status: existingBiz.verification_status || 'unverified',
  };

  // Preserve server-authoritative monthly AI usage count
  const currentMonth = new Date().toISOString().slice(0, 7);
  const serverAiUsage =
    isPlainObject(existing.aiUsage) && existing.aiUsage.month === currentMonth
      ? { month: currentMonth, count: Number(existing.aiUsage.count) || 0 }
      : { month: currentMonth, count: 0 };

  const sanitizedWorkspace: Record<string, any> = {
    user: sanitizedUser,
    business: sanitizedBusiness,
    quotes: Array.isArray(bodyObj.quotes)
      ? stripForbiddenFieldsDeep(bodyObj.quotes)
      : Array.isArray(existing.quotes)
        ? existing.quotes
        : [],
    invoices: Array.isArray(bodyObj.invoices)
      ? stripForbiddenFieldsDeep(bodyObj.invoices)
      : Array.isArray(existing.invoices)
        ? existing.invoices
        : [],
    customers: Array.isArray(bodyObj.customers)
      ? stripForbiddenFieldsDeep(bodyObj.customers)
      : Array.isArray(existing.customers)
        ? existing.customers
        : [],
    products: Array.isArray(bodyObj.products)
      ? stripForbiddenFieldsDeep(bodyObj.products)
      : Array.isArray(existing.products)
        ? existing.products
        : [],
    templates: Array.isArray(bodyObj.templates)
      ? stripForbiddenFieldsDeep(bodyObj.templates)
      : Array.isArray(existing.templates)
        ? existing.templates
        : [],
    followups: Array.isArray(bodyObj.followups)
      ? stripForbiddenFieldsDeep(bodyObj.followups)
      : Array.isArray(existing.followups)
        ? existing.followups
        : [],
    leads: Array.isArray(bodyObj.leads)
      ? stripForbiddenFieldsDeep(bodyObj.leads)
      : Array.isArray(existing.leads)
        ? existing.leads
        : [],
    aiUsage: serverAiUsage,
    matthewMessages: Array.isArray(bodyObj.matthewMessages)
      ? stripForbiddenFieldsDeep(bodyObj.matthewMessages)
      : Array.isArray(existing.matthewMessages)
        ? existing.matthewMessages
        : [],
    updated_at: new Date().toISOString(),
  };

  return sanitizedWorkspace;
}
