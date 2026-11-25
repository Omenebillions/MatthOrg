import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const REAL_STORE_FILE = path.resolve(process.cwd(), 'data/mathorg_store.json');
const CSV_FILE = path.resolve(
  process.cwd(),
  'public/assets/aistudio/Paste_November_25__2026_-_9_21AM_0bb7b710'
);
const SQL_FILE = path.resolve(
  process.cwd(),
  'supabase/migrations/20261125_seed_nigerian_directory_entities.sql'
);

process.env.NODE_ENV = 'test';
process.env.MATTHORG_SECURITY_TEST = '1';
process.env.MATTHORG_STORE_FILE = REAL_STORE_FILE;

import { createApiApp } from '../src/server/app';
import { executeMatthewTool } from '../src/server/matthew/tools';

let server: http.Server;
let baseUrl = '';

async function apiGet(route: string): Promise<{ status: number; json: any }> {
  const res = await fetch(`${baseUrl}${route}`);
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

describe('Imported Nigerian Businesses, Artisans & Professionals Directory', () => {
  before(async () => {
    const app = createApiApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as { port: number };
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('persists all 191 CSV entries in mathorg_store.json across directory businesses, artisans/professionals, and service offerings', () => {
    const store = JSON.parse(fs.readFileSync(REAL_STORE_FILE, 'utf-8'));
    const csvLines = fs
      .readFileSync(CSV_FILE, 'utf-8')
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);
    const expectedCsvCount = csvLines.length - 1;
    assert.equal(expectedCsvCount, 191);

    const dirs = store.__directory_businesses || [];
    const artisans = store.__artisan_recommendations || [];
    const services = store.__service_offerings || [];

    const importedDirs = dirs.filter((d: any) => d.source_type === 'google_directory_import');
    assert.equal(importedDirs.length, 191);
    assert.ok(dirs.length >= 191);
    assert.ok(artisans.length >= 191);
    assert.ok(services.length >= 191);

    // Distinct classifications present
    const providerTypes = new Set(importedDirs.map((d: any) => d.provider_type));
    assert.ok(providerTypes.has('business'));
    assert.ok(providerTypes.has('artisan'));
    assert.ok(providerTypes.has('professional'));

    const profileTypes = new Set(artisans.map((a: any) => a.profile_type));
    assert.ok(profileTypes.has('artisan'));
    assert.ok(profileTypes.has('professional'));

    // Handles Nigerian normalization, UK phone preservation, and missing-phone entries safely
    const yidris = dirs.find((d: any) => d.business_name === 'YIDRIS PLUMBING SERVICE');
    assert.equal(yidris?.phone, '+2349021606286');

    const richwood = dirs.find((d: any) => d.business_name === 'Richwood Carpentry Nigeria Ltd');
    assert.equal(richwood?.phone, '+447404380349');
    assert.equal(richwood?.provider_type, 'business');

    const bwari = dirs.find((d: any) => d.business_name === 'ABUJA ELECTRICAL CONTRACTORS BWARI');
    assert.equal(bwari?.phone, '');
    assert.equal(bwari?.state, 'Abuja');
  });

  it('exposes all imported entities via /api/commerce/businesses, /api/commerce/professionals, and /api/recommendations without truncating shared-phone branches', async () => {
    const [bizRes, proRes, recRes] = await Promise.all([
      apiGet('/api/commerce/businesses'),
      apiGet('/api/commerce/professionals'),
      apiGet('/api/recommendations'),
    ]);

    assert.equal(bizRes.status, 200);
    assert.equal(proRes.status, 200);
    assert.equal(recRes.status, 200);

    assert.ok(bizRes.json.data.length >= 191);
    assert.ok(proRes.json.data.length >= 191);
    assert.ok(recRes.json.data.length >= 191);

    // Both branches sharing a phone number must remain distinct & visible
    const proNames = new Set(proRes.json.data.map((p: any) => p.business_name));
    assert.ok(proNames.has('JP2 Solar Technologies Limited (Abuja)'));
    assert.ok(proNames.has('JP2 Solar Technologies Limited (Port Harcourt)'));
    assert.ok(proNames.has('HakunaSolar'));
    assert.ok(proNames.has('Felicity Solar Port Harcourt'));
  });

  it('enables universal search and Matthew AI discovery across Lagos, Ogun, FCT Abuja, and Rivers trades', async () => {
    const [lagosTailor, abujaSolar, phWelder, ogunTailor, matthewAbuja] = await Promise.all([
      apiGet('/api/search/universal?q=Tailor&location=Somolu'),
      apiGet('/api/search/universal?q=Solar&location=Utako'),
      apiGet('/api/search/universal?q=Welder&location=Woji'),
      apiGet('/api/search/universal?q=Tailor&location=Akute'),
      executeMatthewTool('get_all_businesses_data', { location: 'Abuja' }, { businessId: 'demo' }),
    ]);

    assert.equal(lagosTailor.status, 200);
    assert.ok(
      lagosTailor.json.professionals.some(
        (p: any) => (p.professional?.business_name || p.business_name) === 'A&K Stitches'
      )
    );

    assert.equal(abujaSolar.status, 200);
    assert.ok(
      abujaSolar.json.professionals.some(
        (p: any) =>
          (p.professional?.business_name || p.business_name) === 'BASOL ENERGY SERVICES LIMITED'
      )
    );

    assert.equal(phWelder.status, 200);
    assert.ok(
      phWelder.json.professionals.some(
        (p: any) =>
          (p.professional?.business_name || p.business_name) === 'ZEBAS WELDING AND FABRICATION'
      )
    );

    assert.equal(ogunTailor.status, 200);
    assert.ok(
      ogunTailor.json.professionals.some(
        (p: any) => (p.professional?.business_name || p.business_name) === 'Hatamo Bespoke Fashion'
      )
    );

    assert.ok(matthewAbuja.total_registered_businesses >= 50);
  });

  it('produces an idempotent, security-compliant Supabase seed migration SQL file', () => {
    const sql = fs.readFileSync(SQL_FILE, 'utf-8');
    assert.match(sql, /^[\s\S]*BEGIN;/);
    assert.match(sql, /COMMIT;\s*$/);
    assert.match(sql, /public\.directory_businesses/);
    assert.match(sql, /public\.services/);
    assert.match(sql, /WHERE NOT EXISTS/);
    assert.match(sql, /ChIJBZi6DMT0OxAR9cEQrAHc5Jk/);
    assert.match(sql, /ChIJRTPK84DRaRARMjKfr3cqZRY/);
  });
});
