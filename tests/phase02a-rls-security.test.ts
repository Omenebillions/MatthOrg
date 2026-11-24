import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';

const TEMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'matthorg-p02a-test-'));
process.env.NODE_ENV = 'test';
process.env.MATTHORG_SECURITY_TEST = '1';
process.env.MATTHORG_STORE_FILE = path.join(TEMP_DIR, 'store.json');

import { createApiApp } from '../src/server/app';
import { setSecurityTestHarness } from '../src/server/security/supabaseServer';
import { upsertCapturedCustomerRequest, writeStoreFile } from '../src/server/commerce/store';

const MIGRATION_PATH = path.resolve(
  process.cwd(),
  'supabase/migrations/20261123_phase02a_remaining_rls_remediation.sql'
);
const MIGRATIONS_DIR = path.resolve(process.cwd(), 'supabase/migrations');

const ALL_PUBLIC_TABLES = [
  'businesses',
  'business_members',
  'customers',
  'products',
  'quotes',
  'quote_items',
  'document_counters',
  'invoices',
  'invoice_items',
  'payments',
  'customer_requests',
  'leads',
  'growth_searches',
  'growth_discovered_businesses',
  'growth_lead_research',
  'growth_lead_scores',
  'growth_enriched_contacts',
  'growth_outreach_messages',
  'growth_pipeline_activities',
  'growth_suppressions',
  'directory_businesses',
  'business_contacts',
  'business_locations',
  'service_categories',
  'services',
  'canonical_products',
  'product_offers',
  'product_variants',
  'product_attributes',
  'product_media',
  'product_inventory',
  'product_sources',
  'data_sources',
  'data_import_jobs',
  'data_import_records',
  'search_synonyms',
  'fulfilment_requests',
  'fulfilment_matches',
  'conversations',
  'conversation_messages',
  'customer_enquiries',
  'platform_admins',
];

const PRIVATE_NO_ANON_TABLES = [
  'businesses',
  'business_members',
  'customers',
  'products',
  'quotes',
  'quote_items',
  'document_counters',
  'invoices',
  'invoice_items',
  'payments',
  'leads',
  'platform_admins',
  'growth_searches',
  'growth_discovered_businesses',
  'growth_lead_research',
  'growth_lead_scores',
  'growth_enriched_contacts',
  'growth_outreach_messages',
  'growth_pipeline_activities',
  'growth_suppressions',
  'business_contacts',
  'data_sources',
  'data_import_jobs',
  'data_import_records',
  'fulfilment_matches',
  'conversations',
  'conversation_messages',
];

const PUBLIC_SUBMISSION_TABLES = ['customer_requests', 'fulfilment_requests', 'customer_enquiries'];

const PUBLIC_APPROVED_CATALOG_TABLES = [
  'directory_businesses',
  'business_locations',
  'services',
  'canonical_products',
  'product_offers',
  'product_variants',
  'product_attributes',
  'product_media',
  'product_inventory',
  'product_sources',
];

const SECURITY_DEFINER_RPCS = [
  'user_has_business_access(UUID)',
  'has_active_subscription(UUID)',
  'admin_verify_business(UUID, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN)',
  'authoritative_update_business_subscription(UUID, TEXT, TEXT, TIMESTAMPTZ)',
  'get_next_quote_number(UUID)',
  'create_quote_atomic(UUID, JSONB)',
  'get_next_invoice_number(UUID)',
  'create_invoice_atomic(UUID, JSONB)',
  'convert_quote_to_invoice_atomic(UUID, UUID)',
  'get_matching_customer_requests(UUID)',
  'claim_customer_request_atomic(UUID, UUID)',
];

function stripSqlComments(sql: string): string {
  return sql
    .replace(/--[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

describe('Phase 0.2A Supabase RLS, RPC & Storage Remediation Audit Tests', () => {
  const migrationSql = fs.readFileSync(MIGRATION_PATH, 'utf8');
  const cleanSql = stripSqlComments(migrationSql);
  const allMigrationSql = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => fs.readFileSync(path.join(MIGRATIONS_DIR, f), 'utf8'))
    .join('\n');

  let server: http.Server;
  let baseUrl = '';

  const TOKENS = {
    userA: 'p02a-token-user-a-00000000000001',
    userB: 'p02a-token-user-b-00000000000002',
    paidUser: 'p02a-token-paid-user-00000000003',
    admin: 'p02a-token-admin-user-0000000004',
  };
  const USERS = {
    userA: { id: '11111111-1111-4111-8111-111111111111', email: 'a@example.com' },
    userB: { id: '22222222-2222-4222-8222-222222222222', email: 'b@example.com' },
    paidUser: { id: '33333333-3333-4333-8333-333333333333', email: 'paid@example.com' },
    admin: { id: '99999999-9999-4999-8999-999999999999', email: 'admin@example.com' },
  };
  const BUSINESSES = {
    bizA: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    bizB: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    bizPaid: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  };

  before(async () => {
    setSecurityTestHarness({
      verifyToken: async (token: string) => {
        if (token === TOKENS.userA) return USERS.userA;
        if (token === TOKENS.userB) return USERS.userB;
        if (token === TOKENS.paidUser) return USERS.paidUser;
        if (token === TOKENS.admin) return USERS.admin;
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
          return { plan: 'pro', status: 'active', expiresAt: new Date(Date.now() + 86400_000).toISOString() };
        }
        return { plan: 'free', status: 'inactive' };
      },
    });

    writeStoreFile({});
    upsertCapturedCustomerRequest({
      id: 'req_p02a_1',
      request_number: 'REQ-990001',
      customer_name: 'Buyer One',
      phone: '+2348011122233',
      whatsapp: '+2348011122233',
      email: 'buyer1@example.com',
      location: 'Ikeja, Lagos',
      state: 'Lagos',
      city: 'Ikeja',
      service_required: 'Solar Battery Setup',
      service_category: 'Solar Engineers',
      status: 'Open',
      source: 'direct',
    });

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

  it('SQL Check 1: Every public table has RLS enabled, deployed admin foundation is preserved non-destructively, and active policies use 0-arg is_platform_admin()', () => {
    const cleanAll = stripSqlComments(allMigrationSql);
    for (const table of ALL_PUBLIC_TABLES) {
      const rlsRegex = new RegExp(`ALTER\\s+TABLE\\s+public\\.${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i');
      assert.equal(rlsRegex.test(cleanAll), true, `Missing ENABLE ROW LEVEL SECURITY on public.${table}`);

      if (table !== 'platform_admins') {
        const polRegex = new RegExp(`CREATE\\s+POLICY\\s+"[^"]+"\\s+ON\\s+public\\.${table}\\b`, 'i');
        assert.equal(polRegex.test(cleanSql), true, `public.${table} must have explicit policy in 20261123`);
      }
    }

    // Must NEVER destructively recreate platform_admins or overload/redefine is_platform_admin(...)
    assert.doesNotMatch(cleanSql, /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?public\.platform_admins/i);
    assert.doesNotMatch(cleanSql, /DROP\s+POLICY\s+[^;]*\bON\s+public\.platform_admins/i);
    assert.doesNotMatch(cleanSql, /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+public\.is_platform_admin\b/i);
    assert.doesNotMatch(cleanSql, /public\.is_platform_admin\(\s*auth\.uid\(\)\s*\)/i);
    assert.match(cleanSql, /public\.is_platform_admin\(\)/i);
    assert.match(cleanSql, /6ea8dcbb-8c1e-4807-bd88-75c58d1415bb/i);
  });

  it('SQL Check 2: Every private table revokes PUBLIC and anon grants completely', () => {
    for (const table of PRIVATE_NO_ANON_TABLES) {
      const revokeRegex = new RegExp(`REVOKE\\s+ALL\\s+ON\\s+public\\.${table}\\s+FROM\\s+PUBLIC,\\s*anon`, 'i');
      assert.equal(revokeRegex.test(cleanSql), true, `Missing REVOKE ALL FROM PUBLIC, anon on public.${table}`);

      const anonPolicyRegex = new RegExp(
        `CREATE\\s+POLICY\\s+"[^"]+"\\s+ON\\s+public\\.${table}\\s+FOR\\s+[^;]*\\bTO\\s+[^;]*\\banon\\b`,
        'i'
      );
      assert.equal(anonPolicyRegex.test(cleanSql), false, `Private table public.${table} must not grant anon policy`);
    }
  });

  it('SQL Check 3: Public buyer-submission tables allow anon INSERT only (zero anon SELECT/UPDATE/DELETE) with safe initial checks', () => {
    for (const table of PUBLIC_SUBMISSION_TABLES) {
      const revokeRegex = new RegExp(`REVOKE\\s+ALL\\s+ON\\s+public\\.${table}\\s+FROM\\s+PUBLIC,\\s*anon,\\s*authenticated`, 'i');
      assert.equal(revokeRegex.test(cleanSql), true, `Must reset privileges on public.${table}`);

      const grantInsertRegex = new RegExp(`GRANT\\s+INSERT\\s+ON\\s+public\\.${table}\\s+TO\\s+anon,\\s*authenticated`, 'i');
      assert.equal(grantInsertRegex.test(cleanSql), true, `public.${table} must allow INSERT for anon, authenticated`);

      const grantAnonSelectRegex = new RegExp(`GRANT\\s+[^;]*\\bSELECT\\b[^;]*ON\\s+public\\.${table}\\s+TO\\s+[^;]*\\banon\\b`, 'i');
      assert.equal(grantAnonSelectRegex.test(cleanSql), false, `public.${table} must NEVER grant SELECT to anon`);
    }

    assert.match(cleanSql, /status\s*=\s*'Open'\s+AND\s+\(contacted_by_business_ids\s+IS\s+NULL\s+OR\s+cardinality\(contacted_by_business_ids\)\s*=\s*0\)/i);
    assert.match(cleanSql, /status\s*=\s*'New'\s+AND\s+converted_lead_id\s+IS\s+NULL\s+AND\s+converted_quote_id\s+IS\s+NULL/i);
    assert.match(cleanSql, /CREATE\s+POLICY\s+"public_insert_new_customer_enquiries"[\s\S]*?WITH\s+CHECK\s*\(\s*status\s*=\s*'new'\s*\)/i);
  });

  it('SQL Check 4: Public catalog/directory tables allow anon SELECT only for Approved/Published records and block self-verification/approval', () => {
    for (const table of PUBLIC_APPROVED_CATALOG_TABLES) {
      const grantAnonSelect = new RegExp(`GRANT\\s+SELECT\\s+ON\\s+public\\.${table}\\s+TO\\s+anon`, 'i');
      assert.equal(grantAnonSelect.test(cleanSql), true, `public.${table} should grant SELECT to anon`);

      const grantAnonWrite = new RegExp(`GRANT\\s+[^;]*(INSERT|UPDATE|DELETE)[^;]*ON\\s+public\\.${table}\\s+TO\\s+[^;]*\\banon\\b`, 'i');
      assert.equal(grantAnonWrite.test(cleanSql), false, `public.${table} must not grant write access to anon`);
    }

    assert.match(cleanSql, /CREATE\s+TRIGGER\s+trg_protect_directory_moderation_flags\s+BEFORE\s+INSERT\s+OR\s+UPDATE\s+ON\s+public\.directory_businesses/i);
    assert.match(cleanSql, /CREATE\s+TRIGGER\s+trg_protect_service_moderation_flags\s+BEFORE\s+INSERT\s+OR\s+UPDATE\s+ON\s+public\.services/i);
    assert.match(cleanSql, /CREATE\s+TRIGGER\s+trg_protect_product_offer_moderation_flags\s+BEFORE\s+INSERT\s+OR\s+UPDATE\s+ON\s+public\.product_offers/i);
  });

  it('SQL Check 5: Business ownership, trust flags on INSERT/UPDATE, Growth backfill, and tenant isolation are enforced', () => {
    assert.match(cleanSql, /CREATE\s+TRIGGER\s+trg_protect_business_trust_flags\s+BEFORE\s+INSERT\s+OR\s+UPDATE\s+ON\s+public\.businesses/i);
    assert.match(cleanSql, /IF\s+TG_OP\s*=\s*'INSERT'\s+THEN[\s\S]*?LOWER\(COALESCE\(NEW\.subscription_plan,\s*'free'\)\)\s*<>\s*'free'/i);
    assert.match(cleanSql, /NEW\.owner_user_id\s+IS\s+DISTINCT\s+FROM\s+OLD\.owner_user_id\s+AND\s+OLD\.owner_user_id\s+IS\s+DISTINCT\s+FROM\s+auth\.uid\(\)/i);
    assert.match(cleanSql, /CREATE\s+POLICY\s+"owner_or_admin_insert_business_members"[\s\S]*?b\.id\s*=\s*business_members\.business_id\s+AND\s+b\.owner_user_id\s*=\s*auth\.uid\(\)/i);
    assert.match(cleanSql, /REVOKE\s+ALL\s+ON\s+public\.platform_admins\s+FROM\s+PUBLIC,\s*anon;\s*REVOKE\s+INSERT,\s*UPDATE,\s*DELETE,\s*TRUNCATE\s+ON\s+public\.platform_admins\s+FROM\s+authenticated;\s*GRANT\s+SELECT\s+ON\s+public\.platform_admins\s+TO\s+authenticated;/i);
    assert.match(cleanSql, /UPDATE\s+public\.growth_searches\s+gs[\s\S]*?SET\s+owner_user_id\s*=\s*b\.owner_user_id/i);
    assert.match(cleanSql, /UPDATE\s+public\.growth_discovered_businesses\s+gdb[\s\S]*?SET\s+owner_user_id/i);
    assert.doesNotMatch(cleanSql, /owner_user_id\s+IS\s+NULL\s+OR\s+owner_user_id\s*=\s*auth\.uid\(\)/i);
  });

  it('SQL Check 6: All SECURITY DEFINER RPCs lock down PUBLIC/anon EXECUTE, set search_path, and enforce caller authorization', () => {
    for (const sig of SECURITY_DEFINER_RPCS) {
      const escapedSig = sig.replace(/[()]/g, '\\$&').replace(/\s+/g, '\\s+');
      const revokeRegex = new RegExp(`REVOKE\\s+ALL\\s+ON\\s+FUNCTION\\s+public\\.${escapedSig}\\s+FROM\\s+PUBLIC,\\s*anon`, 'i');
      assert.equal(revokeRegex.test(cleanSql), true, `Missing REVOKE ALL FROM PUBLIC, anon on public.${sig}`);
    }

    assert.match(cleanSql, /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.admin_verify_business[\s\S]*?SET\s+search_path\s*=\s*public,\s*pg_temp[\s\S]*?IF\s+v_role\s*<>\s*'service_role'\s+AND\s+NOT\s+public\.is_platform_admin\(\)/i);
    assert.match(cleanSql, /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.authoritative_update_business_subscription[\s\S]*?SET\s+search_path\s*=\s*public,\s*pg_temp[\s\S]*?IF\s+v_role\s*<>\s*'service_role'\s+AND\s+NOT\s+public\.is_platform_admin\(\)/i);
    assert.match(cleanSql, /REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.authoritative_update_business_subscription\(UUID,\s*TEXT,\s*TEXT,\s*TIMESTAMPTZ\)\s+FROM\s+PUBLIC,\s*anon,\s*authenticated;\s*GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.authoritative_update_business_subscription\(UUID,\s*TEXT,\s*TEXT,\s*TIMESTAMPTZ\)\s+TO\s+service_role;/i);
    assert.match(cleanSql, /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.maintain_lead_lifecycle_timestamps\(\)[\s\S]*?SET\s+search_path\s*=\s*public,\s*pg_temp/i);
  });

  it('SQL Check 7: Storage drops leftover 20261118 TO public write policies and enforces authenticated owner_id + owner + folder isolation', () => {
    assert.match(cleanSql, /DROP\s+POLICY\s+IF\s+EXISTS\s+"Upload access for Products bucket"\s+ON\s+storage\.objects;/i);
    assert.match(cleanSql, /DROP\s+POLICY\s+IF\s+EXISTS\s+"Update access for Products bucket"\s+ON\s+storage\.objects;/i);
    assert.match(cleanSql, /DROP\s+POLICY\s+IF\s+EXISTS\s+"Delete access for Products bucket"\s+ON\s+storage\.objects;/i);

    assert.match(cleanSql, /file_size_limit\s*=\s*10485760/i);
    assert.doesNotMatch(cleanSql, /image\/svg\+xml/i);
    assert.match(cleanSql, /CREATE\s+POLICY\s+"Authenticated user upload access for Products bucket"[\s\S]*?FOR\s+INSERT[\s\S]*?TO\s+authenticated[\s\S]*?\(storage\.foldername\(name\)\)\[2\]\s*=\s*auth\.uid\(\)::text/i);
    assert.match(cleanSql, /owner_id\s*=\s*auth\.uid\(\)::text\s+OR\s+owner\s*=\s*auth\.uid\(\)/i);
  });

  it('SQL Check 8: public_professionals view uses security_barrier, exposes ONLY explicit is_public = true rows, masks sensitive columns, and grants SELECT only', () => {
    const viewSectionMatch = cleanSql.match(/CREATE\s+VIEW\s+public\.public_professionals[\s\S]*?WITH\s*\(\s*security_barrier\s*=\s*true\s*\)\s*AS([\s\S]*?)WHERE\s+b\.is_public\s*=\s*true/i);
    assert.ok(viewSectionMatch, 'public_professionals view definition with security_barrier = true and strict b.is_public = true must exist');
    assert.doesNotMatch(cleanSql, /COALESCE\(b\.is_public,\s*true\)/i);
    const viewBody = viewSectionMatch[1];
    for (const sensitiveCol of ['owner_user_id', 'payment_details', 'cac_number', 'tax_rate', 'subscription_plan', 'subscription_status']) {
      assert.equal(viewBody.includes(sensitiveCol), false, `public_professionals must NEVER expose ${sensitiveCol}`);
    }
    assert.match(cleanSql, /REVOKE\s+ALL\s+ON\s+public\.public_professionals\s+FROM\s+PUBLIC;\s*GRANT\s+SELECT\s+ON\s+public\.public_professionals\s+TO\s+anon,\s*authenticated;/i);
  });

  it('Runtime Scenarios 1-10: Express enforcement rejects anon, isolates Business A vs B, gates paid/admin ops, and masks contacts', async () => {
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

    // Scenario 1: Anonymous denied on private data & storage
    assert.equal((await req('GET', '/api/customer-requests')).status, 401);
    assert.equal((await req('GET', `/api/store/${USERS.userA.id}`)).status, 401);
    assert.equal((await req('POST', '/api/storage/upload', undefined, { fileName: 'x.png', dataBase64: 'YQ==' })).status, 401);

    // Scenario 2 & 3: Cross-business read/write blocked (User A vs Business B)
    assert.equal((await req('GET', `/api/store/${USERS.userB.id}`, TOKENS.userA)).status, 403);
    assert.equal((await req('POST', '/api/commerce/products', TOKENS.userB, { name: 'Hijack', business_id: BUSINESSES.bizA })).status, 403);

    // Scenario 4 & 10: Free user gets masked contacts; paid user & admin get unmasked contacts
    const freeRes = await req('GET', '/api/customer-requests', TOKENS.userA);
    assert.equal(freeRes.status, 200);
    assert.equal(freeRes.json.data[0].phone, '');
    assert.equal(freeRes.json.data[0].is_contact_masked, true);

    const paidRes = await req('GET', '/api/customer-requests', TOKENS.paidUser);
    assert.equal(paidRes.status, 200);
    assert.equal(paidRes.json.data[0].phone, '+2348011122233');
    assert.equal(paidRes.json.data[0].is_contact_masked, false);

    // Scenario 5 & 6: Ordinary user cannot access admin endpoints or self-promote; admin can
    assert.equal((await req('POST', `/api/admin/users/${USERS.userA.id}/role`, TOKENS.userA, { role: 'admin' })).status, 403);
    assert.equal((await req('GET', '/api/admin/leads', TOKENS.userA)).status, 403);
    assert.equal((await req('GET', '/api/admin/leads', TOKENS.admin)).status, 200);

    // Scenario 9: Public non-PII endpoint never leaks buyer phone/email
    const publicTracker = await req('GET', '/api/customer-requests/status/REQ-990001');
    assert.equal(publicTracker.status, 200);
    assert.equal(publicTracker.json.data.phone, undefined);
    assert.equal(publicTracker.json.data.email, undefined);
  });
});
