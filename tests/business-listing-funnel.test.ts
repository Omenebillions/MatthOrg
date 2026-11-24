import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const TEMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'matthorg-listing-test-'));
const TEMP_STORE_FILE = path.join(TEMP_DIR, 'listing_store.json');
process.env.NODE_ENV = 'test';
process.env.MATTHORG_SECURITY_TEST = '1';
process.env.MATTHORG_STORE_FILE = TEMP_STORE_FILE;

import { createApiApp } from '../src/server/app';
import { setSecurityTestHarness } from '../src/server/security/supabaseServer';
import { writeStoreFile } from '../src/server/commerce/store';
import {
  ALLOWED_UNIVERSAL_LISTING_FIELDS,
  pickAllowedFields,
} from '../src/server/security/massAssignment';
import {
  validateAndNormalizeNigerianPhone,
  nigerianPhonesMatch,
} from '../src/utils/nigerianPhone';
import {
  NIGERIA_STATE_LGAS,
  NIGERIAN_LISTING_STATES,
  getLgasForState,
  isValidNigerianStateAndLga,
  normalizeNigerianStateName,
} from '../src/data/nigeriaLgas';
import {
  searchProfessions,
  inferIndustryAndTypeForProfession,
} from '../src/data/professionCatalog';

const TOKENS = {
  userA: 'token-listing-user-a-0000000000001',
  userB: 'token-listing-user-b-0000000000002',
};

const USERS = {
  userA: { id: '11111111-1111-4111-8111-111111111111', email: 'artisan-a@example.com' },
  userB: { id: '22222222-2222-4222-8222-222222222222', email: 'seller-b@example.com' },
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
      if (token === TOKENS.userA) return USERS.userA;
      if (token === TOKENS.userB) return USERS.userB;
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
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const addr = server.address();
  assert(addr && typeof addr !== 'string');
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

beforeEach(() => {
  writeStoreFile({
    __directory_businesses: [],
    __service_offerings: [],
    __artisan_recommendations: [],
  });
});

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
});

describe('Nigerian Phone Validation & Normalization', () => {
  it('normalizes local 0xxx, 234xxx, and +234xxx numbers to canonical E.164', () => {
    const a = validateAndNormalizeNigerianPhone('0803 123 4567');
    const b = validateAndNormalizeNigerianPhone('+234-803-123-4567');
    const c = validateAndNormalizeNigerianPhone('2348031234567');
    const d = validateAndNormalizeNigerianPhone('8031234567');

    assert.equal(a.isValid, true);
    assert.equal(a.normalizedE164, '+2348031234567');
    assert.equal(b.normalizedE164, '+2348031234567');
    assert.equal(c.normalizedE164, '+2348031234567');
    assert.equal(d.normalizedE164, '+2348031234567');
    assert.equal(nigerianPhonesMatch('08031234567', '+234 803 123 4567'), true);
  });

  it('rejects foreign country codes, dummy digits, and malformed numbers', () => {
    assert.equal(validateAndNormalizeNigerianPhone('+447911123456').isValid, false);
    assert.equal(validateAndNormalizeNigerianPhone('08000000000').isValid, false);
    assert.equal(validateAndNormalizeNigerianPhone('080312').isValid, false);
    assert.equal(validateAndNormalizeNigerianPhone('06031234567').isValid, false);
  });
});

describe('Nigeria States & 774 Official LGAs Dataset', () => {
  it('covers all 36 states + FCT Abuja totaling 774 LGAs', () => {
    assert.equal(NIGERIAN_LISTING_STATES.length, 37);
    const totalLgas = Object.values(NIGERIA_STATE_LGAS).reduce((sum, list) => sum + list.length, 0);
    assert.equal(totalLgas, 774);
  });

  it('normalizes state aliases and validates LGAs strictly per state', () => {
    assert.equal(normalizeNigerianStateName('Abuja'), 'FCT - Abuja');
    assert.equal(normalizeNigerianStateName('Lagos State'), 'Lagos');
    assert.ok(getLgasForState('Lagos').includes('Eti-Osa'));
    assert.ok(getLgasForState('FCT - Abuja').includes('Abuja Municipal Area Council (AMAC)'));
    assert.equal(isValidNigerianStateAndLga('Lagos', 'Ikeja'), true);
    assert.equal(isValidNigerianStateAndLga('Lagos', 'Gwagwalada'), false);
  });
});

describe('Profession Catalog & Custom Activity Support', () => {
  it('finds matching trades, freelancers, professionals, and sellers', () => {
    assert.ok(searchProfessions('Tailor').some((p) => p.label.includes('Tailor')));
    assert.ok(searchProfessions('Lawyer').some((p) => p.label.includes('Lawyer')));
    assert.ok(searchProfessions('Designer').some((p) => p.label.includes('Designer')));
  });

  it('infers industry and provider type for newly entered custom professions', () => {
    const seller = inferIndustryAndTypeForProfession('Bespoke Ankara Boutique Seller');
    assert.equal(seller.providerType, 'merchant');
    const legal = inferIndustryAndTypeForProfession('Maritime Lawyer');
    assert.equal(legal.providerType, 'professional');
  });
});

describe('POST /api/business-listings Security, Creation & Duplicate Protection', () => {
  it('requires authentication and strips privileged mass-assignment fields', async () => {
    const unauth = await apiReq('POST', '/api/business-listings', {
      body: {
        full_name: 'Tunde Adebayo',
        profession: 'Tailor',
        phone: '08031234567',
        state: 'Lagos',
        lga: 'Surulere',
        town_city: 'Bode Thomas',
      },
    });
    assert.equal(unauth.status, 401);

    const picked = pickAllowedFields(
      {
        full_name: 'Tunde',
        role: 'admin',
        isAdmin: true,
        plan: 'business',
        user_id: '99999999-9999-9999-9999-999999999999',
        owner_user_id: '99999999-9999-9999-9999-999999999999',
      },
      ALLOWED_UNIVERSAL_LISTING_FIELDS
    );
    assert.equal((picked as any).role, undefined);
    assert.equal((picked as any).isAdmin, undefined);
    assert.equal((picked as any).plan, undefined);
    assert.equal((picked as any).user_id, undefined);
    assert.equal((picked as any).owner_user_id, undefined);
  });

  it('lists an independent artisan WITHOUT optional business_name and surfaces in discovery', async () => {
    const res = await apiReq('POST', '/api/business-listings', {
      token: TOKENS.userA,
      body: {
        business_name: '',
        full_name: 'Chinedu Okafor',
        profession: 'Bespoke Bridal Tailor',
        phone: '0803 555 0199',
        state: 'Lagos',
        lga: 'Eti-Osa',
        town_city: 'Lekki Phase 1',
        // Adversarial privileged fields that must be ignored
        role: 'superadmin',
        isAdmin: true,
        plan: 'business',
        owner_user_id: USERS.userB.id,
        is_verified: true,
      },
    });

    assert.equal(res.status, 201);
    assert.equal(res.json.status, 'created');
    assert.equal(res.json.data.business_name, 'Chinedu Okafor');
    assert.equal(res.json.data.owner_full_name, 'Chinedu Okafor');
    assert.equal(res.json.data.phone, '+2348035550199');
    assert.equal(res.json.data.lga, 'Eti-Osa');
    assert.equal(res.json.data.city, 'Lekki Phase 1');
    assert.equal(res.json.data.state, 'Lagos');
    assert.equal(res.json.data.owner_user_id, USERS.userA.id);
    assert.equal(res.json.data.is_verified, false);

    // Must immediately surface in public professionals and universal search
    const prosRes = await apiReq('GET', '/api/commerce/professionals');
    assert.equal(prosRes.status, 200);
    assert.ok(
      prosRes.json.data.some(
        (p: any) => p.business_name === 'Chinedu Okafor' && p.lga === 'Eti-Osa'
      )
    );

    const searchRes = await apiReq('GET', '/api/search/universal?q=Bridal+Tailor&location=Lekki');
    assert.equal(searchRes.status, 200);
    assert.ok(searchRes.json.professionals.length >= 1);
  });

  it('blocks duplicate phone listing by another account and supports safe update by original owner', async () => {
    // 1. User A creates initial listing
    const first = await apiReq('POST', '/api/business-listings', {
      token: TOKENS.userA,
      body: {
        business_name: 'Amina Styles',
        full_name: 'Amina Bello',
        profession: 'Tailor / Fashion Designer',
        phone: '0812 345 6789',
        state: 'FCT - Abuja',
        lga: 'Bwari',
        town_city: 'Kubwa',
      },
    });
    assert.equal(first.status, 201);

    // 2. User B tries to register the exact same phone (formatted differently) -> 409 duplicate conflict
    const crossUserDup = await apiReq('POST', '/api/business-listings', {
      token: TOKENS.userB,
      body: {
        full_name: 'Another Person',
        profession: 'Tailor',
        phone: '+2348123456789',
        state: 'FCT - Abuja',
        lga: 'Bwari',
        town_city: 'Kubwa',
      },
    });
    assert.equal(crossUserDup.status, 409);
    assert.equal(crossUserDup.json.duplicate, true);
    assert.equal(crossUserDup.json.ownedByCaller, false);

    // 3. User A re-submits without update_existing -> prompts duplicate_owned
    const sameUserDup = await apiReq('POST', '/api/business-listings', {
      token: TOKENS.userA,
      body: {
        business_name: 'Amina Couture',
        full_name: 'Amina Bello',
        profession: 'Tailor / Fashion Designer',
        phone: '+234 812 345 6789',
        state: 'FCT - Abuja',
        lga: 'Bwari',
        town_city: 'Gwarinpa',
      },
    });
    assert.equal(sameUserDup.status, 200);
    assert.equal(sameUserDup.json.status, 'duplicate');
    assert.equal(sameUserDup.json.ownedByCaller, true);

    // 4. User A confirms update_existing -> updates existing entry without creating duplicate
    const updated = await apiReq('POST', '/api/business-listings', {
      token: TOKENS.userA,
      body: {
        business_name: 'Amina Couture',
        full_name: 'Amina Bello',
        profession: 'Tailor / Fashion Designer',
        phone: '+2348123456789',
        state: 'FCT - Abuja',
        lga: 'Bwari',
        town_city: 'Gwarinpa',
        update_existing: true,
      },
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.json.status, 'updated');
    assert.equal(updated.json.data.business_name, 'Amina Couture');
    assert.equal(updated.json.data.city, 'Gwarinpa');

    const bizRes = await apiReq('GET', '/api/commerce/businesses');
    const matchingPhoneCount = bizRes.json.data.filter((b: any) =>
      nigerianPhonesMatch(b.phone, '08123456789')
    ).length;
    assert.equal(matchingPhoneCount, 1);
  });
});
