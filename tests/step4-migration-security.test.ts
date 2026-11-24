import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';

const TEMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'matthorg-step4-test-'));
process.env.NODE_ENV = 'test';
process.env.MATTHORG_SECURITY_TEST = '1';
process.env.MATTHORG_STORE_FILE = path.join(TEMP_DIR, 'store.json');

import { createApiApp } from '../src/server/app';
import { setSecurityTestHarness } from '../src/server/security/supabaseServer';
import { writeStoreFile } from '../src/server/commerce/store';

const STEP4_MIGRATION_PATH = path.resolve(
  process.cwd(),
  'supabase/migrations/20261124_step4_corrected_hardening.sql'
);

function stripSqlComments(sql: string): string {
  return sql
    .replace(/--[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

describe('Step 4 Corrected Migration & Marketplace Request/Lead Security Tests', () => {
  const migrationSql = fs.readFileSync(STEP4_MIGRATION_PATH, 'utf8');
  const cleanSql = stripSqlComments(migrationSql);

  let server: http.Server;
  let baseUrl = '';

  const TOKENS = {
    freeUser: 'step4-token-free-user-000000000001',
    otherUser: 'step4-token-other-user-00000000002',
    paidUser: 'step4-token-paid-user-000000000003',
    admin: 'step4-token-admin-user-00000000004',
  };
  const USERS = {
    freeUser: { id: '11111111-1111-4111-8111-111111111111', email: 'free@example.com' },
    otherUser: { id: '22222222-2222-4222-8222-222222222222', email: 'other@example.com' },
    paidUser: { id: '33333333-3333-4333-8333-333333333333', email: 'paid@example.com' },
    admin: { id: '99999999-9999-4999-8999-999999999999', email: 'admin@example.com' },
  };
  const BUSINESSES = {
    bizFree: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    bizOther: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    bizPaid: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  };

  before(async () => {
    setSecurityTestHarness({
      verifyToken: async (token: string) => {
        if (token === TOKENS.freeUser) return USERS.freeUser;
        if (token === TOKENS.otherUser) return USERS.otherUser;
        if (token === TOKENS.paidUser) return USERS.paidUser;
        if (token === TOKENS.admin) return USERS.admin;
        return null;
      },
      isAdmin: async (userId: string) => userId === USERS.admin.id,
      getUserBusinessIds: async (userId: string) => {
        if (userId === USERS.freeUser.id) return [BUSINESSES.bizFree];
        if (userId === USERS.otherUser.id) return [BUSINESSES.bizOther];
        if (userId === USERS.paidUser.id) return [BUSINESSES.bizPaid];
        return [];
      },
      hasBusinessAccess: async (userId: string, businessId: string) => {
        if (userId === USERS.admin.id) return true;
        if (userId === USERS.freeUser.id && businessId === BUSINESSES.bizFree) return true;
        if (userId === USERS.otherUser.id && businessId === BUSINESSES.bizOther) return true;
        if (userId === USERS.paidUser.id && businessId === BUSINESSES.bizPaid) return true;
        return false;
      },
      getSubscription: async (userId: string) => {
        if (userId === USERS.paidUser.id) {
          return { plan: 'pro', status: 'active', expiresAt: new Date(Date.now() + 86400_000).toISOString() };
        }
        return { plan: 'free', status: 'inactive' };
      },
    });

    writeStoreFile({});
    const app = createApiApp();
    server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const addr = server.address();
    if (!addr || typeof addr === 'string') throw new Error('Port bind failed');
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  after(async () => {
    setSecurityTestHarness(null);
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    try {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('SQL 1: Preserves deployed admin foundation, verifies dependencies, and wraps in BEGIN/COMMIT', () => {
    assert.match(cleanSql, /^\s*BEGIN;/i);
    assert.match(cleanSql, /COMMIT;\s*$/i);
    for (const dep of ['businesses', 'business_members', 'customers', 'quotes', 'document_counters', 'platform_admins']) {
      assert.match(cleanSql, new RegExp(`to_regclass\\('public\\.${dep}'\\)`, 'i'));
    }
    assert.doesNotMatch(cleanSql, /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?public\.platform_admins/i);
    assert.doesNotMatch(cleanSql, /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+public\.is_platform_admin\b/i);
    assert.doesNotMatch(cleanSql, /public\.is_platform_admin\(\s*auth\.uid\(\)\s*\)/i);
  });

  it('SQL 2: Enforces opt-in directory visibility (DEFAULT false) and tamper-proof trust/subscription trigger without GUC bypass', () => {
    assert.match(cleanSql, /ALTER\s+TABLE\s+public\.businesses\s+ALTER\s+COLUMN\s+is_public\s+SET\s+DEFAULT\s+false/i);
    assert.doesNotMatch(cleanSql, /current_setting\('app\.allow_trust_modification'/i);
    assert.match(cleanSql, /CREATE\s+TRIGGER\s+trg_protect_business_trust_flags\s+BEFORE\s+INSERT\s+OR\s+UPDATE\s+ON\s+public\.businesses/i);
    assert.match(cleanSql, /REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.authoritative_update_business_subscription\(UUID,\s*TEXT,\s*TEXT,\s*TIMESTAMPTZ\)\s+FROM\s+PUBLIC,\s*anon,\s*authenticated;\s*GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.authoritative_update_business_subscription\(UUID,\s*TEXT,\s*TEXT,\s*TIMESTAMPTZ\)\s+TO\s+service_role;/i);
    assert.match(cleanSql, /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.admin_verify_business[\s\S]*?NOT\s+public\.is_platform_admin\(\)/i);
  });

  it('SQL 3: Secures customer_requests against PII exposure, forged inserts, and non-admin updates', () => {
    assert.match(cleanSql, /REVOKE\s+ALL\s+ON\s+public\.customer_requests\s+FROM\s+PUBLIC,\s*anon,\s*authenticated;/i);
    assert.match(cleanSql, /GRANT\s+INSERT\s+ON\s+public\.customer_requests\s+TO\s+anon,\s*authenticated;/i);
    assert.doesNotMatch(cleanSql, /GRANT\s+[^;]*SELECT[^;]*ON\s+public\.customer_requests\s+TO\s+[^;]*\banon\b/i);
    assert.doesNotMatch(cleanSql, /FOR\s+SELECT[\s\S]*?USING\s*\(\s*true\s*\)/i);
    assert.doesNotMatch(cleanSql, /FOR\s+UPDATE[\s\S]*?USING\s*\(\s*true\s*\)/i);
    assert.match(cleanSql, /chk_customer_requests_status[\s\S]*?CHECK\s*\(\s*status\s+IN\s*\('Open',\s*'Matched',\s*'Contacted',\s*'Converted',\s*'Closed'\)\)/i);
    assert.match(cleanSql, /CREATE\s+TRIGGER\s+trg_customer_requests_insert_guard\s+BEFORE\s+INSERT\s+ON\s+public\.customer_requests/i);
  });

  it('SQL 4: Aligns leads status constraint with TypeScript LeadStatus and prevents cross-tenant FK injection', () => {
    for (const status of ['New', 'Contacted', 'Qualified', 'Quote Sent', 'Quoted', 'Negotiating', 'Won', 'Lost', 'Unresponsive', 'Not Qualified']) {
      assert.match(cleanSql, new RegExp(`chk_leads_status[\\s\\S]*?'${status}'`, 'i'));
    }
    assert.match(cleanSql, /CREATE\s+TRIGGER\s+trg_protect_lead_integrity\s+BEFORE\s+INSERT\s+OR\s+UPDATE\s+ON\s+public\.leads/i);
    assert.match(cleanSql, /FROM\s+public\.customers\s+c[\s\S]*?c\.business_id\s*=\s*NEW\.business_id/i);
    assert.match(cleanSql, /FROM\s+public\.quotes\s+q[\s\S]*?q\.business_id\s*=\s*NEW\.business_id/i);
    assert.match(cleanSql, /NEW\.business_id\s+IS\s+DISTINCT\s+FROM\s+OLD\.business_id/i);
    assert.match(cleanSql, /REVOKE\s+ALL\s+ON\s+public\.leads\s+FROM\s+PUBLIC,\s*anon;/i);
  });

  it('SQL 5: Fixes matching/claim RPCs (status visibility, case-insensitive arrays, baseline counter, lock order) and safe public_professionals view', () => {
    assert.match(cleanSql, /WHERE\s+cr\.status\s+IN\s*\('Open',\s*'Matched',\s*'Contacted'\)/i);
    assert.match(cleanSql, /LOWER\(trim\(loc\)\)\s+IN\s*\('all',\s*'nationwide',\s*'nigeria'\)/i);
    assert.match(cleanSql, /lead_number\s*~\s*'\^MAT-LED-\[0-9\]\+\$'/i);
    assert.match(cleanSql, /NULLIF\(trim\(COALESCE\(v_req\.phone,\s*''\)\),\s*''\)\s+IS\s+NOT\s+NULL/i);
    assert.match(cleanSql, /CREATE\s+VIEW\s+public\.public_professionals[\s\S]*?WITH\s*\(\s*security_barrier\s*=\s*true\s*\)[\s\S]*?WHERE\s+b\.is_public\s*=\s*true/i);
    assert.doesNotMatch(cleanSql, /COALESCE\(b\.is_public,\s*true\)/i);
    for (const sensitive of ['owner_user_id', 'payment_details', 'cac_number', 'tax_rate', 'subscription_plan', 'subscription_status']) {
      const viewBlock = cleanSql.match(/CREATE\s+VIEW\s+public\.public_professionals[\s\S]*?END\s+\$\$;/i)?.[0] || '';
      assert.equal(viewBlock.includes(sensitive), false, `public_professionals must not expose ${sensitive}`);
    }
  });

  it('Runtime: Public request submission forces Open status, blocks overwrite spoofing, masks free-tier PII, and rate-limits spam', async () => {
    const req = async (method: string, route: string, token?: string, body?: any) => {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      const res = await fetch(`${baseUrl}${route}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      return { status: res.status, json: await res.json().catch(() => null) };
    };

    // 1. Anon creates request even with forged status='Closed' -> forced to 'Open'
    const created = await req('POST', '/api/customer-requests', undefined, {
      id: 'req_step4_fixed_1',
      request_number: 'REQ-445566',
      customer_name: 'Adaeze Buyer',
      phone: '+2348099988877',
      email: 'ada@example.com',
      location: 'Lekki, Lagos',
      service_required: 'Solar Inverter Maintenance',
      service_category: 'Solar Engineers',
      status: 'Closed',
      contacted_by_business_ids: [BUSINESSES.bizOther],
      conversation_session_id: 'sess_buyer_1',
    });
    assert.equal(created.status, 200);
    assert.equal(created.json.data.status, 'Open');
    assert.deepEqual(created.json.data.contacted_by_business_ids, []);

    // 2. Unauthenticated overwrite attempt with same request_number but wrong/missing session -> 409 Conflict
    const hijackAttempt = await req('POST', '/api/customer-requests', undefined, {
      request_number: 'REQ-445566',
      customer_name: 'Attacker',
      phone: '+2348000000000',
      location: 'Abuja',
      service_required: 'Overwrite Test',
      conversation_session_id: 'sess_attacker',
    });
    assert.equal(hijackAttempt.status, 409);

    // 3. Public non-PII status tracker excludes phone/whatsapp/email/customer_name
    const trackerRes = await req('GET', '/api/customer-requests/status/REQ-445566');
    assert.equal(trackerRes.status, 200);
    assert.equal(trackerRes.json.data.phone, undefined);
    assert.equal(trackerRes.json.data.email, undefined);
    assert.equal(trackerRes.json.data.customer_name, undefined);

    // 4. Anon read denied; free user masked; paid user unmasked
    assert.equal((await req('GET', '/api/customer-requests')).status, 401);
    const freeView = await req('GET', '/api/customer-requests', TOKENS.freeUser);
    assert.equal(freeView.status, 200);
    assert.equal(freeView.json.data[0].phone, '');
    assert.equal(freeView.json.data[0].is_contact_masked, true);

    const paidView = await req('GET', '/api/customer-requests', TOKENS.paidUser);
    assert.equal(paidView.status, 200);
    assert.equal(paidView.json.data[0].phone, '+2348099988877');
    assert.equal(paidView.json.data[0].is_contact_masked, false);

    // 5. Cross-business claim/status update blocked
    const crossBizPatch = await req('PATCH', '/api/customer-requests/req_step4_fixed_1', TOKENS.freeUser, {
      status: 'Contacted',
      businessId: BUSINESSES.bizPaid,
    });
    assert.equal(crossBizPatch.status, 403);

    // 6. Rate limiting triggers 429 on excessive burst
    let saw429 = false;
    for (let i = 0; i < 30; i++) {
      const burst = await req('POST', '/api/customer-requests', undefined, {
        customer_name: `Burst ${i}`,
        phone: '+2348012345678',
        location: 'Lagos',
        service_required: 'Plumbing Check',
      });
      if (burst.status === 429) {
        saw429 = true;
        break;
      }
    }
    assert.equal(saw429, true, 'Public POST /api/customer-requests should rate-limit excessive bursts');
  });
});
