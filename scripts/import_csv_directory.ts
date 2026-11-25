import fs from 'fs';
import path from 'path';
import { validateAndNormalizeNigerianPhone } from '../src/utils/nigerianPhone';
import type {
  ArtisanRecommendation,
  DirectoryBusiness,
  ServiceOffering,
  UniversalDomainCategory,
} from '../src/types';

interface CsvRow {
  state: string;
  city: string;
  trade: string;
  business_name: string;
  address: string;
  phone: string;
  rating: string;
  review_count: string;
  google_place_id: string;
  notes: string;
}

function parseCsv(content: string): CsvRow[] {
  const rows: string[][] = [];
  let currentField = '';
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const next = content[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentField += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (ch === '\r' && next === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        i++;
      } else if (ch === '\n' || ch === '\r') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += ch;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  const [header, ...dataRows] = rows.filter((r) => r.some((cell) => cell.trim() !== ''));
  const cols = header.map((h) => h.trim());

  return dataRows.map((cells) => {
    const obj: Record<string, string> = {};
    cols.forEach((col, idx) => {
      obj[col] = (cells[idx] ?? '').trim();
    });
    return obj as unknown as CsvRow;
  });
}

function slugifyId(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
}

function normalizeStateForDirectory(rawState: string): string {
  const s = rawState.trim();
  if (/^(fct|abuja)$/i.test(s)) return 'Abuja';
  return s;
}

function normalizeStateForArtisans(rawState: string): string {
  const s = rawState.trim();
  if (/^(fct|abuja)$/i.test(s)) return 'Abuja (FCT)';
  return s;
}

function normalizePhoneField(rawPhone: string): {
  phone: string;
  whatsapp: string;
  isNigerian: boolean;
} {
  const clean = (rawPhone || '').trim();
  if (!clean) {
    return { phone: '', whatsapp: '', isNigerian: false };
  }
  const ng = validateAndNormalizeNigerianPhone(clean);
  if (ng.isValid) {
    return { phone: ng.normalizedE164, whatsapp: ng.normalizedE164, isNigerian: true };
  }
  // Preserve foreign / landline / special toll-free numbers cleanly (e.g. +44 ..., +234 700 ..., +234 209 ...)
  const compact = clean.replace(/[\s\-()]/g, '');
  if (/^\+234(700|209|1|9)/.test(compact)) {
    return { phone: compact, whatsapp: compact, isNigerian: true };
  }
  return { phone: compact, whatsapp: compact, isNigerian: false };
}

function extractNeighborhoodFromAddress(address: string, csvCity: string, state: string): string {
  const cleanAddr = (address || '').trim();
  if (!cleanAddr) return csvCity;

  const parts = cleanAddr
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  if (csvCity.toLowerCase() === 'abuja' || csvCity.toLowerCase() === 'lagos' || csvCity.toLowerCase() === 'port harcourt') {
    // Prefer the most specific district / area (usually the last non-state segment)
    for (let i = parts.length - 1; i >= 0; i--) {
      const seg = parts[i];
      if (!/^(lagos|abuja|fct|rivers|nigeria)$/i.test(seg)) {
        return seg;
      }
    }
  }

  return csvCity.replace(/\s*\(near Lagos\)/i, '').trim() || state;
}

function collectLocationTokens(stateDir: string, csvCity: string, area: string, address: string, notes: string): string[] {
  const set = new Set<string>();
  const addIfUseful = (val?: string) => {
    const clean = (val || '').trim();
    if (clean.length >= 2) set.add(clean);
  };

  addIfUseful(area);
  addIfUseful(csvCity.replace(/\s*\(near Lagos\)/i, '').trim());
  addIfUseful(stateDir);

  if (stateDir === 'Abuja') {
    set.add('Abuja');
    set.add('FCT');
    set.add('Abuja (FCT)');
  }
  if (stateDir === 'Rivers') {
    set.add('Port Harcourt');
    set.add('Rivers');
  }
  if (/lagos/i.test(notes)) {
    set.add('Lagos');
  }

  address
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length >= 2 && !/^\d+$/.test(p))
    .forEach((p) => set.add(p));

  return Array.from(set);
}

interface TradeMetadata {
  industry: string;
  artisanTradeCategory: string;
  domain: UniversalDomainCategory;
  defaultServices: string[];
  defaultProviderType: DirectoryBusiness['provider_type'];
}

const TRADE_MAP: Record<string, TradeMetadata> = {
  plumber: {
    industry: 'Plumbing & Water Systems',
    artisanTradeCategory: 'Plumbers & Fluid Technicians',
    domain: 'repairs',
    defaultServices: ['Plumber', 'Pipefitting & Leak Repair', 'Sanitary Installations'],
    defaultProviderType: 'artisan',
  },
  electrician: {
    industry: 'Electrical & Power Systems',
    artisanTradeCategory: 'Electricians & Wiring Technicians',
    domain: 'repairs',
    defaultServices: ['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance'],
    defaultProviderType: 'artisan',
  },
  carpenter: {
    industry: 'Carpentry, Furniture & Joinery',
    artisanTradeCategory: 'Carpenters & Furniture Artisans',
    domain: 'artisans',
    defaultServices: ['Carpenter', 'Custom Woodwork & Cabinetry', 'Furniture Fabrication'],
    defaultProviderType: 'artisan',
  },
  welder: {
    industry: 'Welding, Metalwork & Fabrication',
    artisanTradeCategory: 'Welders & Metal Fabricators',
    domain: 'artisans',
    defaultServices: ['Welder', 'Metal Fabrication', 'Steel Construction & Gates'],
    defaultProviderType: 'artisan',
  },
  'tailor / fashion designer': {
    industry: 'Fashion, Tailoring & Apparel',
    artisanTradeCategory: 'Fashion Designers & Bespoke Tailors',
    domain: 'artisans',
    defaultServices: ['Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture'],
    defaultProviderType: 'artisan',
  },
  'solar installer': {
    industry: 'Solar & Renewable Power',
    artisanTradeCategory: 'Solar Engineers & Inverter Specialists',
    domain: 'artisans',
    defaultServices: ['Solar Installer', 'Solar Inverter Installation', 'Battery & Panel Setup'],
    defaultProviderType: 'business',
  },
  'graphic designer': {
    industry: 'Branding, Design & Digital Media',
    artisanTradeCategory: 'Graphic Designers & Brand Studios',
    domain: 'digital_creative',
    defaultServices: ['Graphic Designer', 'Branding & Visual Identity', 'Print & Digital Design'],
    defaultProviderType: 'professional',
  },
};

function classifyRow(row: CsvRow): {
  providerType: DirectoryBusiness['provider_type'];
  profileType: 'artisan' | 'professional';
  industry: string;
  specialization: string;
  artisanTradeCategory: string;
  domain: UniversalDomainCategory;
  trades: string[];
  services: string[];
  hasCautionNote: boolean;
  isUnconfirmedTrade: boolean;
} {
  const trades = row.trade
    .split(';')
    .map((t) => t.trim())
    .filter(Boolean);

  const primaryTradeKey = (trades[0] || '').toLowerCase();
  const primaryMeta = TRADE_MAP[primaryTradeKey] || TRADE_MAP.electrician;

  const combinedTrades = new Set<string>(trades);
  const serviceList = new Set<string>();
  trades.forEach((t) => {
    const meta = TRADE_MAP[t.toLowerCase()];
    serviceList.add(t);
    if (meta) {
      meta.defaultServices.forEach((s) => serviceList.add(s));
    }
  });

  const notesLower = (row.notes || '').toLowerCase();
  if (/plumbing and ac|\bhvac\b/i.test(notesLower)) {
    combinedTrades.add('AC & HVAC Technician');
    serviceList.add('AC Installation & Maintenance');
    serviceList.add('HVAC Services');
  }
  if (/solar/i.test(notesLower)) {
    combinedTrades.add('Solar installer');
    serviceList.add('Solar Inverter Installation');
  }
  if (/cctv|smart home|security/i.test(notesLower)) {
    serviceList.add('CCTV & Smart Home Systems');
  }
  if (/web/i.test(notesLower)) {
    serviceList.add('Web Design');
  }
  if (/print|signage/i.test(notesLower)) {
    serviceList.add('Print & Signage Production');
  }
  if (/branding/i.test(notesLower)) {
    serviceList.add('Branding & Identity');
  }
  if (/digital marketing/i.test(notesLower)) {
    serviceList.add('Digital Marketing');
  }
  if (/3d animation|vfx/i.test(notesLower)) {
    serviceList.add('3D Animation & VFX');
  }
  if (/training|academy|school/i.test(notesLower)) {
    serviceList.add('Vocational Training & Academy');
  }
  if (/furniture/i.test(notesLower)) {
    serviceList.add('Custom Furniture');
  }
  if (/interior design/i.test(notesLower)) {
    serviceList.add('Interior Design & Cabinetry');
  }
  if (/salon|spa/i.test(notesLower)) {
    serviceList.add('Beauty Salon & Spa');
  }
  if (/video editing|photo/i.test(notesLower)) {
    serviceList.add('Photography & Video Editing');
  }

  const nameLower = row.business_name.toLowerCase();
  const isRegisteredCompanyName =
    /\b(ltd|limited|enterprises?|company|co\.?|inc\.?|ventures|global resources|investment|technologies|contractors|engineering|concepts|media|agency|projects|solutions|construct|industries)\b/i.test(
      nameLower
    );
  const isSupplier = /\b(supplier|distributor|manufacturer)\b/i.test(notesLower);
  const isCreativeOrProfessionalStudio =
    primaryTradeKey === 'graphic designer' ||
    /\b(studio|studios|academy|institute|fashion house|couture|bridal|empire|designs?|clothiers|koncept|signature)\b/i.test(
      nameLower
    );

  let providerType: DirectoryBusiness['provider_type'] = primaryMeta.defaultProviderType;
  if (isSupplier) {
    providerType = 'supplier';
  } else if (isRegisteredCompanyName) {
    providerType = 'business';
  } else if (primaryTradeKey === 'graphic designer' || isCreativeOrProfessionalStudio) {
    providerType = 'professional';
  } else {
    providerType = 'artisan';
  }

  const profileType: 'artisan' | 'professional' = providerType === 'artisan' ? 'artisan' : 'professional';

  let industry = primaryMeta.industry;
  if (trades.length > 1) {
    industry = trades.map((t) => t.replace(' installer', '')).join(' & ') + ' Contracting';
  }

  const specialization = Array.from(combinedTrades).join(' · ');

  const hasCautionNote = /\b(complaint|fraud|non-delivery|dishonesty|stopped picking calls|faulty)\b/i.test(
    notesLower
  );
  const isUnconfirmedTrade = /\b(trade unconfirmed|listed as car repair|no phone listed)\b/i.test(notesLower);

  return {
    providerType,
    profileType,
    industry,
    specialization,
    artisanTradeCategory: primaryMeta.artisanTradeCategory,
    domain: primaryMeta.domain,
    trades: Array.from(combinedTrades),
    services: Array.from(serviceList),
    hasCautionNote,
    isUnconfirmedTrade,
  };
}

function sqlEscape(val: string): string {
  return `'${val.replace(/'/g, "''")}'`;
}

function sqlTextArray(arr: string[]): string {
  if (arr.length === 0) return `ARRAY[]::TEXT[]`;
  return `ARRAY[${arr.map((s) => sqlEscape(s)).join(', ')}]::TEXT[]`;
}

function main() {
  const csvPath = path.resolve(process.cwd(), 'public/assets/aistudio/Paste_November_25__2026_-_9_21AM_0bb7b710');
  const storePath = path.resolve(process.cwd(), 'data/mathorg_store.json');
  const sqlOutPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20261125_seed_nigerian_directory_entities.sql'
  );

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const csvRows = parseCsv(csvContent);
  console.log(`Parsed ${csvRows.length} rows from CSV attachment.`);

  const store = JSON.parse(fs.readFileSync(storePath, 'utf-8')) as Record<string, any>;
  const existingDirs: DirectoryBusiness[] = Array.isArray(store.__directory_businesses)
    ? store.__directory_businesses
    : [];
  const existingArtisans: ArtisanRecommendation[] = Array.isArray(store.__artisan_recommendations)
    ? store.__artisan_recommendations
    : [];
  const existingServices: ServiceOffering[] = Array.isArray(store.__service_offerings)
    ? store.__service_offerings
    : [];

  // Preserve custom non-CSV seed rows cleanly (and replace earlier 10-row Lagos plumber subset cleanly so no duplicates remain)
  const csvNameSet = new Set(csvRows.map((r) => r.business_name.trim().toLowerCase()));
  const preservedDirs = existingDirs.filter(
    (d) => d.source_type !== 'google_directory_import' && !csvNameSet.has(d.business_name.trim().toLowerCase())
  );
  const preservedArtisans = existingArtisans.filter(
    (a) =>
      !(a as any).google_place_id &&
      !csvNameSet.has(a.artisan_name.trim().toLowerCase())
  );
  const preservedDirIds = new Set(preservedDirs.map((d) => d.id));
  const preservedServices = existingServices.filter((s) => preservedDirIds.has(s.business_id));

  const now = '2026-11-25T08:00:00.000Z';
  const importedDirs: DirectoryBusiness[] = [];
  const importedArtisans: ArtisanRecommendation[] = [];
  const importedServices: ServiceOffering[] = [];
  const sqlStatements: string[] = [];

  const usedIds = new Set<string>();

  for (let idx = 0; idx < csvRows.length; idx++) {
    const row = csvRows[idx];
    const dirState = normalizeStateForDirectory(row.state);
    const artState = normalizeStateForArtisans(row.state);
    const areaCity = extractNeighborhoodFromAddress(row.address, row.city, dirState);
    const phoneInfo = normalizePhoneField(row.phone);
    const cls = classifyRow(row);
    const locationsServed = collectLocationTokens(dirState, row.city, areaCity, row.address, row.notes);

    const parsedRating = row.rating ? Number(row.rating) : 4.6;
    const rating = Number.isFinite(parsedRating) && parsedRating > 0 ? parsedRating : 4.6;
    const parsedReviews = row.review_count ? parseInt(row.review_count, 10) : 1;
    const vouchesCount = Number.isFinite(parsedReviews) && parsedReviews > 0 ? parsedReviews : 1;

    let baseSlug = slugifyId(`${row.business_name}_${dirState}`);
    if (!baseSlug) baseSlug = `entry_${idx + 1}`;
    let dirId = `dir_${baseSlug}`;
    let suffix = 2;
    while (usedIds.has(dirId)) {
      dirId = `dir_${baseSlug}_${suffix++}`;
    }
    usedIds.add(dirId);

    const fullAddress = [row.address, dirState === 'Abuja' ? 'Abuja (FCT)' : dirState].filter(Boolean).join(', ');
    const noteSuffix = row.notes ? ` Note: ${row.notes}.` : '';
    const ratingSummary =
      row.rating && row.review_count
        ? ` Rated ${row.rating}/5 across ${row.review_count} customer reviews.`
        : '';

    const description = `${row.business_name} provides ${cls.specialization} services at ${row.address || areaCity}, ${dirState}.${ratingSummary}${noteSuffix}`.trim();

    const keywords = Array.from(
      new Set(
        [
          ...cls.trades.map((t) => t.toLowerCase()),
          ...cls.services.map((s) => s.toLowerCase()),
          ...locationsServed.map((l) => l.toLowerCase()),
          row.business_name.toLowerCase(),
          row.google_place_id.toLowerCase(),
        ].filter(Boolean)
      )
    );

    const dirEntry: DirectoryBusiness & { metadata?: Record<string, any> } = {
      id: dirId,
      business_name: row.business_name,
      owner_full_name: row.business_name,
      provider_type: cls.providerType,
      industry: cls.industry,
      specialization: cls.specialization,
      description,
      tagline: `${cls.specialization} in ${areaCity}, ${dirState}`,
      phone: phoneInfo.phone,
      whatsapp: phoneInfo.whatsapp,
      email: '',
      address: fullAddress,
      city: areaCity,
      lga: areaCity,
      state: dirState,
      country: 'Nigeria',
      locations_served: locationsServed,
      categories_offered: Array.from(new Set([...cls.trades, cls.industry, ...cls.services])),
      keywords,
      is_registered: false,
      is_verified: false,
      approval_status: 'Approved',
      source_type: 'google_directory_import',
      rating,
      vouches_count: vouchesCount,
      created_at: now,
      updated_at: now,
      metadata: {
        google_place_id: row.google_place_id || undefined,
        google_rating: row.rating ? Number(row.rating) : undefined,
        google_review_count: row.review_count ? Number(row.review_count) : undefined,
        notes: row.notes || undefined,
        has_caution_note: cls.hasCautionNote,
        is_unconfirmed_trade: cls.isUnconfirmedTrade,
      },
    };

    importedDirs.push(dirEntry);

    const isValidatedEntry = Boolean(phoneInfo.phone) && !cls.hasCautionNote && !cls.isUnconfirmedTrade;
    const artEntry: ArtisanRecommendation & { google_place_id?: string; notes?: string } = {
      id: `rec_${baseSlug}`,
      profile_type: cls.profileType,
      artisan_name: row.business_name,
      trade_category: cls.artisanTradeCategory,
      phone: phoneInfo.phone,
      whatsapp: phoneInfo.whatsapp,
      email: '',
      address: fullAddress,
      state: artState,
      town: areaCity,
      services_offered: cls.services.slice(0, 6),
      level: vouchesCount >= 30 && rating >= 4.7 ? 'master_artisan' : 'experienced',
      recommender_name: 'Google Directory & Customer Reviews',
      recommender_relationship:
        cls.profileType === 'professional' ? 'Verified Business Directory' : 'Customer Directory',
      work_done: `${cls.specialization} operating from ${row.address || areaCity}, ${dirState}.`,
      recommendation_note: row.notes
        ? `${row.notes}${row.rating ? ` (${row.rating}★ across ${row.review_count || 1} reviews)` : ''}`
        : `${row.business_name} has ${row.rating ? `${row.rating}★ rating across ${row.review_count || 1} reviews` : 'an active customer listing'} in ${areaCity}, ${dirState}.`,
      rating,
      pricing_tier: 'fair',
      vouches_count: vouchesCount,
      verified: false,
      validation_status: isValidatedEntry ? 'validated' : 'pending',
      outreach_status: 'not_contacted',
      created_at: now,
      updated_at: now,
      google_place_id: row.google_place_id || undefined,
      notes: row.notes || undefined,
    };

    importedArtisans.push(artEntry);

    // Create linked ServiceOffering per listed trade (so "Electrician; Solar installer" matches BOTH trades cleanly)
    cls.trades.forEach((tradeName, tIdx) => {
      const tradeMeta = TRADE_MAP[tradeName.toLowerCase()];
      const svcProviderType: ServiceOffering['provider_type'] =
        cls.providerType === 'merchant' ? 'supplier' : cls.providerType;
      const svc: ServiceOffering = {
        id: `svc_${baseSlug}_${tIdx + 1}`,
        business_id: dirId,
        business_name: row.business_name,
        provider_type: svcProviderType,
        service_name: tradeName,
        service_category: tradeMeta?.industry || cls.industry,
        domain: tradeMeta?.domain || cls.domain,
        description,
        sub_services: cls.services,
        pricing_type: 'Request a Quote',
        locations_covered: locationsServed,
        state: dirState,
        city: areaCity,
        phone: phoneInfo.phone,
        whatsapp: phoneInfo.whatsapp,
        email: '',
        keywords,
        is_verified: false,
        approval_status: 'Approved',
        source_type: 'google_directory_import',
        created_at: now,
        updated_at: now,
      };
      importedServices.push(svc);
    });

    // Generate idempotent PostgreSQL INSERT for public.directory_businesses + public.services
    const metaJson = JSON.stringify({
      lga: areaCity,
      owner_full_name: row.business_name,
      google_place_id: row.google_place_id || null,
      google_rating: row.rating ? Number(row.rating) : null,
      google_review_count: row.review_count ? Number(row.review_count) : null,
      notes: row.notes || null,
      has_caution_note: cls.hasCautionNote,
    });

    const primaryTrade = cls.trades[0] || row.trade;

    sqlStatements.push(`
WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    ${sqlEscape(row.business_name)},
    ${sqlEscape(cls.providerType)},
    ${sqlEscape(cls.industry)},
    ${sqlEscape(cls.specialization)},
    ${sqlEscape(description)},
    ${sqlEscape(`${cls.specialization} in ${areaCity}, ${dirState}`)},
    ${phoneInfo.phone ? sqlEscape(phoneInfo.phone) : 'NULL'},
    ${phoneInfo.whatsapp ? sqlEscape(phoneInfo.whatsapp) : 'NULL'},
    NULL,
    ${sqlEscape(fullAddress)},
    ${sqlEscape(areaCity)},
    ${sqlEscape(dirState)},
    'Nigeria',
    ${sqlTextArray(locationsServed)},
    ${sqlTextArray(Array.from(new Set([...cls.trades, cls.industry])))},
    ${sqlTextArray(keywords.slice(0, 20))},
    false,
    false,
    'Approved',
    'google_directory_import',
    ${sqlEscape(metaJson)}::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      ${row.google_place_id ? `db.metadata->>'google_place_id' = ${sqlEscape(row.google_place_id)} OR ` : ''}
      (lower(trim(db.business_name)) = lower(trim(${sqlEscape(row.business_name)})) AND lower(trim(COALESCE(db.state, ''))) = lower(trim(${sqlEscape(dirState)})))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim(${sqlEscape(row.business_name)}))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim(${sqlEscape(dirState)}))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  ${sqlEscape(primaryTrade)},
  ${sqlEscape(cls.industry)},
  ${sqlEscape(description)},
  ${sqlTextArray(cls.services.slice(0, 6))},
  'Request a Quote',
  ${sqlTextArray(locationsServed)},
  ${sqlTextArray(keywords.slice(0, 20))},
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim(${sqlEscape(primaryTrade)}))
);`);
  }

  store.__directory_businesses = [...importedDirs, ...preservedDirs];
  store.__artisan_recommendations = [...importedArtisans, ...preservedArtisans];
  store.__service_offerings = [...importedServices, ...preservedServices];

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2) + '\n', 'utf-8');

  const migrationSql = `-- ============================================================================
-- MatthOrg Additive Directory Seed Migration:
-- Imports ${csvRows.length} Nigerian Businesses, Artisans & Professionals across
-- Lagos, Ogun (Iju/Akute), FCT Abuja, and Rivers (Port Harcourt).
--
-- EXECUTION NOTES:
--   - Safe, idempotent, non-destructive, wrapped in BEGIN / COMMIT.
--   - Run manually in Supabase SQL Editor after 20261114_universal_conversational_marketplace.sql.
--   - Preserves existing records using NOT EXISTS deduplication by google_place_id and business_name+state.
-- ============================================================================

BEGIN;

DO $$
BEGIN
    IF to_regclass('public.directory_businesses') IS NULL THEN
        RAISE EXCEPTION 'Pre-check failed: public.directory_businesses does not exist.';
    END IF;
    IF to_regclass('public.services') IS NULL THEN
        RAISE EXCEPTION 'Pre-check failed: public.services does not exist.';
    END IF;
END $$;

${sqlStatements.join('\n')}

COMMIT;
`;

  fs.writeFileSync(sqlOutPath, migrationSql, 'utf-8');

  const countsByProviderType: Record<string, number> = {};
  importedDirs.forEach((d) => {
    countsByProviderType[d.provider_type] = (countsByProviderType[d.provider_type] || 0) + 1;
  });
  const countsByProfileType: Record<string, number> = {};
  importedArtisans.forEach((a) => {
    const k = a.profile_type || 'artisan';
    countsByProfileType[k] = (countsByProfileType[k] || 0) + 1;
  });

  console.log('Import complete!');
  console.log('Directory businesses imported:', importedDirs.length, '(total in store:', store.__directory_businesses.length + ')');
  console.log('Breakdown by DirectoryBusiness.provider_type:', countsByProviderType);
  console.log('Artisan/Professional records imported:', importedArtisans.length, '(total in store:', store.__artisan_recommendations.length + ')');
  console.log('Breakdown by ArtisanRecommendation.profile_type:', countsByProfileType);
  console.log('Service offerings generated:', importedServices.length);
  console.log('SQL migration written to:', sqlOutPath);
}

main();
