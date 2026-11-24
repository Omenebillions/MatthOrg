import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const TEMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'matthorg-phone-ref-test-'));
const TEMP_STORE_FILE = path.join(TEMP_DIR, 'store.json');
process.env.NODE_ENV = 'test';
process.env.MATTHORG_SECURITY_TEST = '1';
process.env.MATTHORG_STORE_FILE = TEMP_STORE_FILE;

import { createApiApp } from '../src/server/app';
import { setSecurityTestHarness } from '../src/server/security/supabaseServer';
import { writeStoreFile } from '../src/server/commerce/store';

const MIGRATION_PATH = path.resolve(
  process.cwd(),
  'supabase/migrations/20261124_phone_auth_business_referral_persistence.sql'
);

function stripSqlComments(sql: string): string {
  return sql
    .replace(/--[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

const TOKENS = {
  referrer: 'token-phone-referrer-000000000001',
  artisanPhoneOnly: 'token-phone-artisan-only-00000002',
  artisanSecond: 'token-phone-artisan-two-000000003',
  selfPhoneClone: 'token-phone-self-clone-000000004',
};

const USERS = {
  referrer: {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'referrer@example.com',
    phone: '+2348031112233',
  },
  artisanPhoneOnly: {
    id: '22222222-2222-4222-8222-222222222222',
    email: '',
    phone: '+2348094445566',
  },
  artisanSecond: {
    id: '33333333-3333-4333-8333-333333333333',
    email: '',
    phone: '+2348057778899',
  },
  selfPhoneClone: {
    id: '44444444-4444-4444-8444-444444444444',
    email: '',
    phone: '+2348031112233', // same phone as referrer!
  },
};

const BIZ_IDS = {
  referrer: 'biz_11111111-1111-4111-8111-111111111111',
  artisanPhoneOnly: 'biz_22222222-2222-4222-8222-222222222222',
  artisanSecond: 'biz_33333333-3333-4333-8333-333333333333',
  selfPhoneClone: 'biz_44444444-4444-4444-8444-444444444444',
};

let server: http.Server;
let baseUrl = '';

async function apiReq(
  method: string,
  route: string,
  options?: { token?: string; body?: any }
): Promise<{ status: number; json: any }> {
  const headers: Record<string, string> = {};
  if (options?.token) headers.Authorization = `Bearer ${options.token}`;
  if (options?.body !== undefined) headers['Content-Type'] = 'application/json';

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
      if (token === TOKENS.referrer) return USERS.referrer;
      if (token === TOKENS.artisanPhoneOnly) return USERS.artisanPhoneOnly;
      if (token === TOKENS.artisanSecond) return USERS.artisanSecond;
      if (token === TOKENS.selfPhoneClone) return USERS.selfPhoneClone;
      return null;
    },
    isAdmin: async () => false,
    getUserBusinessIds: async (userId: string) => [`biz_${userId}`],
    hasBusinessAccess: async (userId: string, businessId: string) =>
      businessId === `biz_${userId}`,
    getSubscription: async () => ({ plan: 'free', status: 'inactive' }),
  });

  const app = createApiApp();
  server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const addr = server.address();
  assert(addr && typeof addr !== 'string');
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

beforeEach(() => {
  writeStoreFile({
    __directory_businesses: [],
    __service_offerings: [],
    __artisan_recommendations: [],
    __referrals: [],
  });
});

after(async () => {
  setSecurityTestHarness(null);
  await new Promise<void>((resolve) => server.close(() => resolve()));
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
});

describe('Phone-Only Artisan Auth & Registration Endpoints', () => {
  it('supports phone-only /api/auth/me and /api/users/register without requiring an email address', async () => {
    const meRes = await apiReq('GET', '/api/auth/me', { token: TOKENS.artisanPhoneOnly });
    assert.equal(meRes.status, 200);
    assert.equal(meRes.json.data.id, USERS.artisanPhoneOnly.id);
    assert.equal(meRes.json.data.email, '');
    assert.equal(meRes.json.data.phone, '+2348094445566');

    const regRes = await apiReq('POST', '/api/users/register', {
      token: TOKENS.artisanPhoneOnly,
      body: {
        name: 'Kemi Adeyemi',
        businessName: 'Kemi Fabrics & Tailoring',
        phone: '0809 444 5566',
      },
    });
    assert.equal(regRes.status, 201);
    assert.equal(regRes.json.data.email, '');
    assert.equal(regRes.json.data.phone, '+2348094445566');
    assert.equal(regRes.json.data.plan, 'free');
  });

  it('persists phone-only artisan listing via /api/business-listings without email and generates a unique referral code', async () => {
    const res = await apiReq('POST', '/api/business-listings', {
      token: TOKENS.artisanPhoneOnly,
      body: {
        business_name: '',
        full_name: 'Sadiq Ibrahim',
        profession: 'Auto Electrician',
        phone: '0809 444 5566',
        state: 'FCT - Abuja',
        lga: 'Gwagwalada',
        town_city: 'Gwagwalada',
      },
    });

    assert.equal(res.status, 201);
    assert.equal(res.json.status, 'created');
    assert.equal(res.json.data.phone, '+2348094445566');
    assert.equal(res.json.data.business_name, 'Sadiq Ibrahim');
    assert.ok(typeof res.json.referralCode === 'string' && res.json.referralCode.startsWith('MO-'));
  });
});

describe('Referral Capture, Validation, Attribution & Anti-Abuse', () => {
  it('validates a referrer code without exposing PII, attributes once, and blocks overwrites & cross-tenant tampering', async () => {
    // 1. Referrer lists business and receives referral code
    const refBizRes = await apiReq('POST', '/api/business-listings', {
      token: TOKENS.referrer,
      body: {
        business_name: 'Ikeja Solar & Power',
        full_name: 'Tunde Bakare',
        profession: 'Solar Inverter Technician',
        phone: '0803 111 2233',
        state: 'Lagos',
        lga: 'Ikeja',
        town_city: 'Alausa',
      },
    });
    assert.equal(refBizRes.status, 201);
    const refCode = refBizRes.json.referralCode as string;
    assert.ok(refCode && refCode.startsWith('MO-'));

    // 2. Public validate endpoint returns display metadata only (NO phone/email/user_id)
    const valRes = await apiReq('GET', `/api/referrals/validate?code=${encodeURIComponent(refCode)}`);
    assert.equal(valRes.status, 200);
    assert.equal(valRes.json.valid, true);
    assert.equal(valRes.json.referral_code, refCode);
    assert.equal(valRes.json.referrer_name, 'Ikeja Solar & Power');
    assert.equal(valRes.json.phone, undefined);
    assert.equal(valRes.json.email, undefined);
    assert.equal(valRes.json.owner_user_id, undefined);

    // 3. Unauthenticated attribution / summary must be rejected (401)
    const unauthAttr = await apiReq('POST', '/api/referrals/attribute', {
      body: { referral_code: refCode, business_id: BIZ_IDS.artisanPhoneOnly },
    });
    assert.equal(unauthAttr.status, 401);

    const unauthMe = await apiReq('GET', '/api/referrals/me');
    assert.equal(unauthMe.status, 401);

    // 4. Referred artisan lists business with referral_code -> attributed immediately
    const artRes = await apiReq('POST', '/api/business-listings', {
      token: TOKENS.artisanPhoneOnly,
      body: {
        business_name: '',
        full_name: 'Ngozi Eze',
        profession: 'Catering & Events',
        phone: '0809 444 5566',
        state: 'Enugu',
        lga: 'Enugu North',
        town_city: 'New Haven',
        referral_code: refCode,
      },
    });
    assert.equal(artRes.status, 201);
    assert.equal(artRes.json.referralAttribution?.success, true);
    assert.equal(artRes.json.referralAttribution?.referral_code, refCode);

    // 5. Referrer sees count = 1 in /api/referrals/me
    const refSummary = await apiReq('GET', `/api/referrals/me?businessId=${BIZ_IDS.referrer}`, {
      token: TOKENS.referrer,
    });
    assert.equal(refSummary.status, 200);
    assert.equal(refSummary.json.data.referralCode, refCode);
    assert.equal(refSummary.json.data.referralsCount, 1);

    // 6. Second business tries to overwrite artisanPhoneOnly's referral -> forbidden (403)
    const crossTenant = await apiReq('POST', '/api/referrals/attribute', {
      token: TOKENS.artisanSecond,
      body: {
        referral_code: refCode,
        business_id: BIZ_IDS.artisanPhoneOnly,
      },
    });
    assert.equal(crossTenant.status, 403);

    // 7. Re-attributing a DIFFERENT code to the already-referred business does NOT overwrite
    const secondBizRes = await apiReq('POST', '/api/business-listings', {
      token: TOKENS.artisanSecond,
      body: {
        business_name: 'Kano Plumbing Pros',
        full_name: 'Musa Danladi',
        profession: 'Plumber',
        phone: '0805 777 8899',
        state: 'Kano',
        lga: 'Nasarawa',
        town_city: 'Kano',
      },
    });
    assert.equal(secondBizRes.status, 201);
    const secondCode = secondBizRes.json.referralCode as string;

    const overwriteAttempt = await apiReq('POST', '/api/referrals/attribute', {
      token: TOKENS.artisanPhoneOnly,
      body: {
        referral_code: secondCode,
        business_id: artRes.json.data.id,
      },
    });
    assert.equal(overwriteAttempt.status, 200);
    assert.equal(overwriteAttempt.json.already_attributed, true);
    assert.equal(overwriteAttempt.json.referral_code, refCode);
  });

  it('blocks self-referral by user ID, business ID, and normalized Nigerian phone number', async () => {
    const refBizRes = await apiReq('POST', '/api/business-listings', {
      token: TOKENS.referrer,
      body: {
        business_name: 'Port Harcourt Coldroom',
        full_name: 'Chidi Amadi',
        profession: 'HVAC Technician',
        phone: '0803 111 2233',
        state: 'Rivers',
        lga: 'Port Harcourt',
        town_city: 'GRA Phase 2',
      },
    });
    const refCode = refBizRes.json.referralCode as string;

    // 1. Direct self-referral by same user
    const selfDirect = await apiReq('POST', '/api/referrals/attribute', {
      token: TOKENS.referrer,
      body: {
        referral_code: refCode,
        business_id: refBizRes.json.data.id,
        phone: '+2348031112233',
      },
    });
    assert.equal(selfDirect.status, 400);
    assert.equal(selfDirect.json.self_referral, true);

    // 2. Self-referral across a second account carrying the same normalized Nigerian phone
    const cloneRefAttr = await apiReq('POST', '/api/referrals/attribute', {
      token: TOKENS.selfPhoneClone,
      body: {
        referral_code: refCode,
        business_id: BIZ_IDS.selfPhoneClone,
        phone: '08031112233', // matches referrer +2348031112233
      },
    });
    assert.equal(cloneRefAttr.status, 400);
    assert.equal(cloneRefAttr.json.self_referral, true);
  });
});

describe('20261124 Phone Auth, Business & Referral SQL Migration Security Checks', () => {
  const migrationSql = fs.readFileSync(MIGRATION_PATH, 'utf8');
  const cleanSql = stripSqlComments(migrationSql);

  it('wraps migration in BEGIN/COMMIT, verifies dependencies, and preserves platform_admins / is_platform_admin()', () => {
    assert.match(cleanSql, /^\s*BEGIN;/i);
    assert.match(cleanSql, /COMMIT;\s*$/i);
    for (const dep of ['businesses', 'business_members', 'platform_admins']) {
      assert.match(cleanSql, new RegExp(`to_regclass\\('public\\.${dep}'\\)`, 'i'));
    }
    assert.doesNotMatch(
      cleanSql,
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?public\.platform_admins/i
    );
    assert.doesNotMatch(
      cleanSql,
      /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+public\.is_platform_admin\b/i
    );
    for (const col of [
      'is_public',
      'industry',
      'specialization',
      'categories_offered',
      'locations_served',
      'subscription_plan',
      'updated_at',
    ]) {
      assert.match(
        cleanSql,
        new RegExp(`ALTER\\s+TABLE\\s+public\\.businesses\\s+ADD\\s+COLUMN\\s+IF\\s+NOT\\s+EXISTS\\s+${col}\\b`, 'i')
      );
    }
  });

  it('locks down public.referrals with RLS, anti-self-referral constraints, and immutability guards', () => {
    assert.match(cleanSql, /ALTER\s+TABLE\s+public\.referrals\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
    assert.match(cleanSql, /REVOKE\s+ALL\s+ON\s+public\.referrals\s+FROM\s+PUBLIC,\s*anon,\s*authenticated/i);
    assert.match(cleanSql, /GRANT\s+SELECT\s+ON\s+public\.referrals\s+TO\s+authenticated/i);
    assert.match(cleanSql, /referred_business_id\s+UUID\s+NOT\s+NULL\s+UNIQUE/i);
    assert.match(cleanSql, /referred_user_id\s+UUID\s+NOT\s+NULL\s+UNIQUE/i);
    assert.match(cleanSql, /CHECK\s*\(\s*referrer_user_id\s*<>\s*referred_user_id\s*\)/i);
    assert.match(cleanSql, /CHECK\s*\(\s*referrer_business_id\s*<>\s*referred_business_id\s*\)/i);
    assert.doesNotMatch(cleanSql, /current_setting\('app\.allow_trust_modification'/i);
  });

  it('keeps public.public_professionals strictly opt-in (is_public = true) and free of owner/bank/referral PII', () => {
    const viewMatch = cleanSql.match(
      /CREATE\s+VIEW\s+public\.public_professionals[\s\S]*?WHERE\s+b\.is_public\s*=\s*true/i
    );
    assert.ok(viewMatch, 'Expected security_barrier public_professionals view filtered by b.is_public = true');
    assert.match(viewMatch[0], /WITH\s*\(\s*security_barrier\s*=\s*true\s*\)/i);

    for (const sensitive of [
      'owner_user_id',
      'payment_details',
      'cac_number',
      'tax_rate',
      'subscription_plan',
      'subscription_status',
      'referred_by_user_id',
      'referred_by_business_id',
      'referred_code_used',
    ]) {
      assert.equal(
        viewMatch[0].includes(sensitive),
        false,
        `public_professionals must not expose ${sensitive}`
      );
    }
  });
});
