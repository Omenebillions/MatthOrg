import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Configure isolated security test harness BEFORE importing server modules
const TEMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'matthorg-sec-test-'));
const TEMP_STORE_FILE = path.join(TEMP_DIR, 'test_store.json');
process.env.NODE_ENV = 'test';
process.env.MATTHORG_SECURITY_TEST = '1';
process.env.MATTHORG_STORE_FILE = TEMP_STORE_FILE;

import { createApiApp } from '../src/server/app';
import { setSecurityTestHarness } from '../src/server/security/supabaseServer';
import { setStoredLeads } from '../src/server/growth/routes';
import { getCustomerRequests, upsertCapturedCustomerRequest, writeStoreFile } from '../src/server/commerce/store';

const TOKENS = {
  userA: 'token-valid-user-a-0000000000000001',
  userB: 'token-valid-user-b-0000000000000002',
  paidUser: 'token-valid-paid-user-0000000000003',
  admin: 'token-valid-platform-admin-00000004',
  expired: 'token-expired-session-00000000000005',
  invalid: 'token-forged-invalid-000000000000006',
};

const USERS = {
  userA: { id: '11111111-1111-4111-8111-111111111111', email: 'owner-a@example.com' },
  userB: { id: '22222222-2222-4222-8222-222222222222', email: 'owner-b@example.com' },
  paidUser: { id: '33333333-3333-4333-8333-333333333333', email: 'paid@example.com' },
  admin: { id: '99999999-9999-4999-8999-999999999999', email: 'ops@example.com' },
};

const BUSINESSES = {
  bizA: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  bizB: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  bizPaid: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
};

let server: http.Server;
let baseUrl = '';

async function apiReq(
  method: string,
  route: string,
  options?: {
    token?: string;
    body?: any;
    headers?: Record<string, string>;
  }
): Promise<{ status: number; json: any }> {
  const headers: Record<string, string> = {
    ...(options?.headers || {}),
  };
  if (options?.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  if (options?.body !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${baseUrl}${route}`, {
    method,
    headers,
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

before(async () => {
  setSecurityTestHarness({
    verifyToken: async (token: string) => {
      if (token === TOKENS.userA) return USERS.userA;
      if (token === TOKENS.userB) return USERS.userB;
      if (token === TOKENS.paidUser) return USERS.paidUser;
      if (token === TOKENS.admin) return USERS.admin;
      // Expired and invalid tokens fail Supabase verification
      return null;
    },
    isAdmin: async (userId: string) => userId === USERS.admin.id,
    getUserBusinessIds: async (userId: string) => {
      if (userId === USERS.userA.id) return [BUSINESSES.bizA];
      if (userId === USERS.userB.id) return [BUSINESSES.bizB];
      if (userId === USERS.paidUser.id) return [BUSINESSES.bizPaid];
      return [];
    },
    hasBusinessAccess: async (userId: string, businessId: string) => {
      if (userId === USERS.admin.id) return true;
      if (userId === USERS.userA.id && businessId === BUSINESSES.bizA) return true;
      if (userId === USERS.userB.id && businessId === BUSINESSES.bizB) return true;
      if (userId === USERS.paidUser.id && businessId === BUSINESSES.bizPaid) return true;
      return false;
    },
    getSubscription: async (userId: string) => {
      if (userId === USERS.paidUser.id) {
        return {
          plan: 'pro',
          status: 'active',
          expiresAt: new Date(Date.now() + 86400_000).toISOString(),
        };
      }
      return { plan: 'free', status: 'inactive' };
    },
  });

  const app = createApiApp();
  server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const addr = server.address();
  if (!addr || typeof addr === 'string') {
    throw new Error('Failed to bind ephemeral test port');
  }
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

beforeEach(() => {
  writeStoreFile({});
  setStoredLeads([]);
  upsertCapturedCustomerRequest({
    id: 'req_test_buyer_1',
    request_number: 'REQ-880011',
    customer_name: 'Chinedu Okafor',
    phone: '+2348099988877',
    whatsapp: '+2348099988877',
    email: 'chinedu@example.com',
    location: 'Lekki Phase 1, Lagos',
    state: 'Lagos',
    city: 'Lekki Phase 1',
    service_required: '5kVA Solar Hybrid Inverter Installation',
    service_category: 'Solar Engineers',
    budget_formatted: '₦1,200,000',
    details: 'Need full hybrid setup',
    status: 'Open',
    source: 'direct',
  });
});

after(async () => {
  setSecurityTestHarness(null);
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  try {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  } catch {
    // ignore cleanup error
  }
});

describe('Phase 0.1 Security Containment Test Suite', () => {
  it('1. Rejects missing JWT tokens with 401 across all protected routes', async () => {
    const protectedEndpoints: Array<[string, string, any?]> = [
      ['GET', '/api/auth/me'],
      ['GET', '/api/admin/leads'],
      ['POST', '/api/admin/users/' + USERS.userA.id + '/role', { role: 'admin' }],
      ['GET', '/api/customer-requests'],
      ['PATCH', '/api/customer-requests/req_test_buyer_1', { status: 'Contacted' }],
      ['POST', '/api/customer-requests/clear', { mode: 'all' }],
      ['GET', '/api/store/' + USERS.userA.id],
      ['POST', '/api/store/' + USERS.userA.id, { business: { id: BUSINESSES.bizA } }],
      ['POST', '/api/commerce/products', { name: 'Solar Panel 450W' }],
      ['POST', '/api/matthew/chat', { message: 'Show pipeline', businessId: BUSINESSES.bizA }],
      ['GET', '/api/growth/leads'],
      ['POST', '/api/storage/upload', { fileName: 'pic.png', dataBase64: 'aGVsbG8=' }],
      ['GET', '/api/admin/data-hub/jobs'],
      ['GET', '/api/fulfilment/requests'],
      ['GET', '/api/demand-campaigns'],
    ];

    for (const [method, route, body] of protectedEndpoints) {
      const res = await apiReq(method, route, { body });
      assert.equal(res.status, 401, `${method} ${route} must return 401 without JWT`);
    }
  });

  it('2. Rejects invalid JWT tokens with 401', async () => {
    const res1 = await apiReq('GET', '/api/auth/me', { token: TOKENS.invalid });
    assert.equal(res1.status, 401);

    const res2 = await apiReq('GET', '/api/customer-requests', { token: TOKENS.invalid });
    assert.equal(res2.status, 401);

    const res3 = await apiReq('GET', '/api/admin/leads', { token: TOKENS.invalid });
    assert.equal(res3.status, 401);
  });

  it('3. Rejects expired JWT tokens with 401', async () => {
    const res1 = await apiReq('GET', '/api/auth/me', { token: TOKENS.expired });
    assert.equal(res1.status, 401);

    const res2 = await apiReq('POST', '/api/commerce/products', {
      token: TOKENS.expired,
      body: { name: 'Inverter' },
    });
    assert.equal(res2.status, 401);
  });

  it('4 & 13. Enforces role boundaries for ordinary users vs admin endpoints', async () => {
    const meRes = await apiReq('GET', '/api/auth/me', { token: TOKENS.userA });
    assert.equal(meRes.status, 200);
    assert.equal(meRes.json?.data?.isAdmin, false);
    assert.equal(meRes.json?.data?.role, 'user');

    const adminRoutes: Array<[string, string, any?]> = [
      ['GET', '/api/admin/leads'],
      ['POST', '/api/admin/leads', { leads: [{ customer_name: 'Test' }] }],
      ['DELETE', '/api/admin/leads/lead_123'],
      ['POST', '/api/admin/artisans/bulk', { artisans: [] }],
      ['GET', '/api/admin/data-hub/jobs'],
      ['POST', '/api/admin/data-hub/analyze', { rawText: 'Plumber Lagos 08012345678' }],
      ['POST', '/api/admin/data-hub/commit', { jobId: 'j1', action: 'approve_new' }],
      ['GET', '/api/commerce/campaigns'],
      ['POST', '/api/commerce/campaigns', { business_name: 'Ad' }],
      ['PATCH', '/api/commerce/ad-controls', { global_ads_enabled: false }],
      ['GET', '/api/commerce/analytics'],
      ['POST', '/api/commerce/categories', { categories: ['Solar'] }],
      ['POST', '/api/commerce/businesses', { business_name: 'Fake Corp' }],
      ['DELETE', '/api/commerce/businesses/dir_1'],
      ['GET', '/api/fulfilment/requests'],
      ['PATCH', '/api/fulfilment/requests/ful_1', { status: 'Closed' }],
      ['DELETE', '/api/fulfilment/requests/ful_1'],
      ['GET', '/api/demand-campaigns'],
      ['PATCH', '/api/demand-campaigns/camp_1', { notes: 'x' }],
      ['DELETE', '/api/demand-campaigns/camp_1'],
      ['PATCH', '/api/recommendations/rec_1', { verified: true }],
      ['DELETE', '/api/recommendations/rec_1'],
    ];

    for (const [method, route, body] of adminRoutes) {
      const res = await apiReq(method, route, { token: TOKENS.userA, body });
      assert.equal(res.status, 403, `Ordinary user on ${method} ${route} must get 403`);
    }
  });

  it('5. Allows valid business owner to create and update their own products and workspace store', async () => {
    const createRes = await apiReq('POST', '/api/commerce/products', {
      token: TOKENS.userA,
      body: {
        name: '5kVA Lithium Battery Pack',
        business_id: BUSINESSES.bizA,
        price: 850000,
        category: 'Solar',
        verification_status: 'verified', // attempt privilege escalation field should be overridden
        listing_type: 'admin_curated',
      },
    });
    assert.equal(createRes.status, 200);
    assert.equal(createRes.json?.data?.business_id, BUSINESSES.bizA);
    assert.equal(createRes.json?.data?.verification_status, 'pending');
    assert.equal(createRes.json?.data?.listing_type, 'business_owned');

    const prodId = createRes.json.data.id;
    const patchRes = await apiReq('PATCH', `/api/commerce/products/${prodId}`, {
      token: TOKENS.userA,
      body: { price: 890000, verification_status: 'verified' },
    });
    assert.equal(patchRes.status, 200);
    assert.equal(patchRes.json?.data?.price, 890000);
    assert.equal(patchRes.json?.data?.verification_status, 'pending');

    const storeSave = await apiReq('POST', `/api/store/${USERS.userA.id}`, {
      token: TOKENS.userA,
      body: {
        business: { id: BUSINESSES.bizA, business_name: 'Owner A Solar' },
        quotes: [],
      },
    });
    assert.equal(storeSave.status, 200);
    assert.equal(storeSave.json?.data?.business?.business_name, 'Owner A Solar');
  });

  it('6. Allows valid server-verified platform admin to access admin endpoints & manage roles', async () => {
    const meRes = await apiReq('GET', '/api/auth/me', { token: TOKENS.admin });
    assert.equal(meRes.status, 200);
    assert.equal(meRes.json?.data?.isAdmin, true);

    const leadsRes = await apiReq('GET', '/api/admin/leads', { token: TOKENS.admin });
    assert.equal(leadsRes.status, 200);

    const reqRes = await apiReq('GET', '/api/customer-requests', { token: TOKENS.admin });
    assert.equal(reqRes.status, 200);
    assert.equal(reqRes.json.data[0].phone, '+2348099988877');
    assert.equal(reqRes.json.data[0].is_contact_masked, false);

    // Register userA server account then promote via admin endpoint
    await apiReq('POST', '/api/users/register', { token: TOKENS.userA, body: { name: 'User A' } });
    const roleRes = await apiReq('POST', `/api/admin/users/${USERS.userA.id}/role`, {
      token: TOKENS.admin,
      body: { role: 'admin' },
    });
    assert.equal(roleRes.status, 200);
    assert.equal(roleRes.json?.data?.role, 'admin');

    const demoteRes = await apiReq('POST', `/api/admin/users/${USERS.userA.id}/role`, {
      token: TOKENS.admin,
      body: { role: 'user' },
    });
    assert.equal(demoteRes.status, 200);
    assert.equal(demoteRes.json?.data?.role, 'user');
  });

  it('7. Blocks spoofed x-actor-user-id header regardless of value', async () => {
    // Unauthenticated + spoofed x-actor-user-id -> 401
    const unauthSpoof = await apiReq('GET', '/api/admin/leads', {
      headers: { 'x-actor-user-id': 'admin_platform_root' },
    });
    assert.equal(unauthSpoof.status, 401);

    // Ordinary user + spoofed x-actor-user-id -> 403
    const userSpoof = await apiReq('POST', `/api/admin/users/${USERS.userA.id}/role`, {
      token: TOKENS.userA,
      headers: { 'x-actor-user-id': 'admin_platform_root' },
      body: { role: 'admin' },
    });
    assert.equal(userSpoof.status, 403);

    // Ordinary user spoofing actor ID to another user's store -> 403
    const crossStoreSpoof = await apiReq('GET', `/api/store/${USERS.userB.id}`, {
      token: TOKENS.userA,
      headers: { 'x-actor-user-id': USERS.userB.id },
    });
    assert.equal(crossStoreSpoof.status, 403);
  });

  it('8. Blocks cross-business modification across products, services, leads, and requests', async () => {
    // Business A creates product & service
    const prodRes = await apiReq('POST', '/api/commerce/products', {
      token: TOKENS.userA,
      body: { name: 'Biz A Exclusive Panel', business_id: BUSINESSES.bizA, price: 200000 },
    });
    assert.equal(prodRes.status, 200);
    const prodId = prodRes.json.data.id;

    // Business B cannot PATCH or DELETE Business A's product
    const crossPatch = await apiReq('PATCH', `/api/commerce/products/${prodId}`, {
      token: TOKENS.userB,
      body: { price: 1 },
    });
    assert.equal(crossPatch.status, 403);

    const crossDelete = await apiReq('DELETE', `/api/commerce/products/${prodId}`, {
      token: TOKENS.userB,
    });
    assert.equal(crossDelete.status, 403);

    // Business B cannot create product under Business A
    const crossCreate = await apiReq('POST', '/api/commerce/products', {
      token: TOKENS.userB,
      body: { name: 'Spoofed Product', business_id: BUSINESSES.bizA },
    });
    assert.equal(crossCreate.status, 403);

    // Business B cannot create/modify service under Business A
    const crossService = await apiReq('POST', '/api/commerce/services', {
      token: TOKENS.userB,
      body: { business_id: BUSINESSES.bizA, service_name: 'Hijacked Service' },
    });
    assert.equal(crossService.status, 403);

    // Business B cannot claim customer request on behalf of Business A
    const crossClaim = await apiReq('PATCH', '/api/customer-requests/req_test_buyer_1', {
      token: TOKENS.userB,
      body: { status: 'Contacted', businessId: BUSINESSES.bizA },
    });
    assert.equal(crossClaim.status, 403);

    // Business A creates a growth lead -> Business B cannot qualify/research/update it
    const discoverRes = await apiReq('POST', '/api/growth/discover', {
      token: TOKENS.userA,
      body: { category: 'Solar & Inverter', location: 'Lagos' },
    });
    assert.equal(discoverRes.status, 200);
    const leadsA = discoverRes.json.businesses;
    if (Array.isArray(leadsA) && leadsA.length > 0) {
      const targetLeadId = leadsA[0].id;
      const crossLeadStage = await apiReq('POST', `/api/growth/leads/${targetLeadId}/stage`, {
        token: TOKENS.userB,
        body: { stage: 'converted' },
      });
      assert.equal(crossLeadStage.status, 403);
    }
  });

  it('9. Prevents self-assigning admin role across registration, profile update, and store sync', async () => {
    // 1. Register with injected admin fields
    const regRes = await apiReq('POST', '/api/users/register', {
      token: TOKENS.userA,
      body: {
        id: USERS.admin.id,
        name: 'Attacker',
        role: 'admin',
        isAdmin: true,
        plan: 'business',
        subscription_status: 'active',
      },
    });
    assert.equal(regRes.status === 200 || regRes.status === 201, true);
    assert.equal(regRes.json.data.id, USERS.userA.id);
    assert.equal(regRes.json.data.role, 'user');
    assert.equal(regRes.json.data.isAdmin, false);
    assert.equal(regRes.json.data.plan, 'free');

    // 2. PATCH own profile trying to elevate role
    const patchRes = await apiReq('PATCH', `/api/users/${USERS.userA.id}`, {
      token: TOKENS.userA,
      body: { role: 'admin', isAdmin: true, plan: 'business', name: 'Updated Name' },
    });
    assert.equal(patchRes.status, 200);
    assert.equal(patchRes.json.data.role, 'user');
    assert.equal(patchRes.json.data.isAdmin, false);
    assert.equal(patchRes.json.data.plan, 'free');

    // 3. Direct POST to /api/admin/users/:id/role as self -> 403
    const selfAdminRes = await apiReq('POST', `/api/admin/users/${USERS.userA.id}/role`, {
      token: TOKENS.userA,
      body: { role: 'admin' },
    });
    assert.equal(selfAdminRes.status, 403);

    // 4. Cannot write to reserved admin store key
    const reservedStoreRes = await apiReq('POST', '/api/store/admin_platform_root', {
      token: TOKENS.userA,
      body: { hacked: true },
    });
    assert.equal(reservedStoreRes.status, 403);
  });

  it('10. Prevents client-supplied plan upgrades or AI quota bypass via API bodies', async () => {
    // Save store attempting to inject plan: 'business' and aiUsage: 0
    const storeRes = await apiReq('POST', `/api/store/${USERS.userA.id}`, {
      token: TOKENS.userA,
      body: {
        user: { plan: 'business', role: 'admin', isAdmin: true },
        business: {
          id: BUSINESSES.bizA,
          subscription_plan: 'business',
          subscription_status: 'active',
        },
        aiUsage: { month: '2026-11', count: 0 },
      },
    });
    assert.equal(storeRes.status, 200);
    assert.equal(storeRes.json.data.user.plan, 'free');
    assert.equal(storeRes.json.data.user.role, 'user');
    assert.equal(storeRes.json.data.user.isAdmin, false);
    assert.equal(storeRes.json.data.business.subscription_plan, 'free');

    // Free user attempting Business Intelligence chat while spoofing clientContext/plan -> 403
    const biRes = await apiReq('POST', '/api/matthew/chat', {
      token: TOKENS.userA,
      body: {
        message: 'Summarize my revenue',
        businessId: BUSINESSES.bizA,
        clientContext: { plan: 'business', userPlan: 'business' },
      },
    });
    assert.equal(biRes.status, 403);

    // Free user AI quote quota enforced server-side (max 3/month regardless of client payload)
    for (let i = 1; i <= 3; i++) {
      const quoteRes = await apiReq('POST', '/api/ai/draft-quote', {
        token: TOKENS.userA,
        body: {
          prompt: `Install 3kVA solar backup #${i}`,
          userPlan: 'business', // spoofed client field must be ignored
          usedCount: 0, // spoofed client counter must be ignored
          businessId: BUSINESSES.bizA,
        },
      });
      assert.equal(quoteRes.status, 200);
      assert.equal(quoteRes.json.limit, 3);
      assert.equal(quoteRes.json.newUsedCount, i);
    }

    const fourthRes = await apiReq('POST', '/api/ai/draft-quote', {
      token: TOKENS.userA,
      body: {
        prompt: '4th generation should fail on free tier',
        userPlan: 'business',
        usedCount: 0,
        businessId: BUSINESSES.bizA,
      },
    });
    assert.equal(fourthRes.status, 403);
    assert.equal(fourthRes.json.quotaExceeded, true);
  });

  it('11. Masks buyer private contacts server-side for free/unauth users and unmasks for paid/admin', async () => {
    // Public status endpoint never leaks buyer phone/whatsapp/email/customer_name
    const statusRes = await apiReq('GET', '/api/customer-requests/status/REQ-880011');
    assert.equal(statusRes.status, 200);
    assert.equal(statusRes.json.data.request_number, 'REQ-880011');
    assert.equal(statusRes.json.data.phone, undefined);
    assert.equal(statusRes.json.data.whatsapp, undefined);
    assert.equal(statusRes.json.data.email, undefined);
    assert.equal(statusRes.json.data.customer_name, undefined);

    // Free user gets masked contacts on GET /api/customer-requests
    const freeRes = await apiReq('GET', '/api/customer-requests', { token: TOKENS.userA });
    assert.equal(freeRes.status, 200);
    assert.equal(freeRes.json.data.length, 1);
    assert.equal(freeRes.json.data[0].phone, '');
    assert.equal(freeRes.json.data[0].whatsapp, '');
    assert.equal(freeRes.json.data[0].email, '');
    assert.equal(freeRes.json.data[0].is_contact_masked, true);
    assert.notEqual(freeRes.json.data[0].customer_name, 'Chinedu Okafor');

    // Free user also gets masked contacts on marketplace refresh-requests even if spoofing userPlan in body
    const refreshFree = await apiReq('POST', '/api/commerce/marketplace/refresh-requests', {
      token: TOKENS.userA,
      body: { userPlan: 'business', subscription_status: 'active', isPaid: true },
    });
    assert.equal(refreshFree.status, 200);
    assert.equal(refreshFree.json.requests[0].phone, '');
    assert.equal(refreshFree.json.requests[0].is_contact_masked, true);

    // Paid subscriber receives unmasked buyer contact info
    const paidRes = await apiReq('GET', '/api/customer-requests', { token: TOKENS.paidUser });
    assert.equal(paidRes.status, 200);
    assert.equal(paidRes.json.data[0].phone, '+2348099988877');
    assert.equal(paidRes.json.data[0].whatsapp, '+2348099988877');
    assert.equal(paidRes.json.data[0].is_contact_masked, false);
  });

  it('12. Blocks customer request deletion/clearing by non-admins and allows admin', async () => {
    const freeClear = await apiReq('POST', '/api/customer-requests/clear', {
      token: TOKENS.userA,
      body: { mode: 'all' },
    });
    assert.equal(freeClear.status, 403);
    assert.equal(getCustomerRequests().length, 1);

    const paidClear = await apiReq('POST', '/api/customer-requests/clear', {
      token: TOKENS.paidUser,
      body: { mode: 'all' },
    });
    assert.equal(paidClear.status, 403);
    assert.equal(getCustomerRequests().length, 1);

    const adminClear = await apiReq('POST', '/api/customer-requests/clear', {
      token: TOKENS.admin,
      body: { mode: 'all' },
    });
    assert.equal(adminClear.status, 200);
    assert.equal(getCustomerRequests().length, 0);
  });

  it('Storage & Path Hardening: rejects unsafe upload types and path traversal attempts', async () => {
    const svgUpload = await apiReq('POST', '/api/storage/presigned-url', {
      token: TOKENS.userA,
      body: { fileType: 'image/svg+xml' },
    });
    assert.equal(svgUpload.status, 400);

    const uploadSafe = await apiReq('POST', '/api/storage/upload', {
      token: TOKENS.userA,
      body: {
        fileName: '../../evil.html',
        folder: '../../etc',
        dataBase64: Buffer.from('fake-png-bytes').toString('base64'),
      },
    });
    assert.equal(uploadSafe.status, 200);
    assert.equal(uploadSafe.json.publicUrl.startsWith(`/uploads/uploads/${USERS.userA.id}/`), true);
    assert.equal(uploadSafe.json.publicUrl.endsWith('.png'), true);
    // Clean up uploaded test file from public/uploads/uploads/{userA.id}
    const relPath = uploadSafe.json.publicUrl.replace(/^\//, '');
    const absUploaded = path.resolve(process.cwd(), 'public', relPath);
    if (fs.existsSync(absUploaded)) {
      fs.unlinkSync(absUploaded);
    }
    const userUploadDir = path.dirname(absUploaded);
    if (fs.existsSync(userUploadDir) && fs.readdirSync(userUploadDir).length === 0) {
      fs.rmdirSync(userUploadDir);
    }
  });
});
