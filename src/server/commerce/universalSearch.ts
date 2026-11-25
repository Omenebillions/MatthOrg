import type {
  ArtisanRecommendation,
  CatalogProduct,
  DirectoryBusiness,
  MatchedProfessionalCandidate,
  MatchedServiceCandidate,
  PublicProfessionalProfile,
  ServiceOffering,
  UniversalDomainCategory,
} from '../../types';
import {
  getCatalogProducts,
  getDirectoryBusinesses,
  getSearchSynonyms,
  getServiceOfferings,
  readStoreFile,
} from './store';

export const NIGERIA_LOCATIONS = [
  'lagos', 'lagos island', 'abuja', 'fct', 'ikeja', 'ikeja gra', 'lekki', 'lekki phase 1', 'ikate',
  'victoria island', 'vi', 'ikoyi', 'yaba', 'surulere', 'ajah', 'gbagada', 'maryland', 'magodo',
  'festac', 'ikorodu', 'apapa', 'oshodi', 'alaba', 'mushin', 'agege', 'orile agege', 'ifako',
  'ifako-ijaiye', 'ifako agege', 'abule egba', 'ojodu', 'ogba', 'opebi', 'allen', 'isheri',
  'ikosi', 'ikosi ketu', 'ketu', 'ojota', 'agboyi', 'ilupeju', 'somolu', 'bariga', 'anthony',
  'ogudu', 'akowonjo', 'alimosho', 'ipaja', 'amuwo odofin', 'orile iganmu', 'isolo', 'sangotedo',
  'ikotun', 'egbeda', 'port harcourt', 'rivers', 'gra', 'new gra', 'ibadan', 'oyo', 'bodija',
  'kano', 'enugu', 'ogun', 'abeokuta', 'arepo', 'magboro', 'mowe', 'iju', 'akute', 'ajuwon',
  'benin', 'edo', 'delta', 'warri', 'asaba', 'owerri', 'imo', 'uyo', 'akwa ibom', 'kaduna', 'jos',
  'plateau', 'maitama', 'wuse', 'wuse 2', 'garki', 'garki 2', 'garki area 11', 'gwarinpa',
  'asokoro', 'jabi', 'utako', 'lugbe', 'kubwa', 'life camp', 'durumi', 'kaura', 'wuye', 'kuchingoro',
  'dakwo', 'kado', 'apo', 'gudu', 'deidei', 'dei-dei', 'kugbo', 'lokogoma', 'kabusa', 'katampe',
  'galadimawa', 'karshi', 'cbd', 'central business district', 'area 1', 'area 2', 'area 10', 'area 11',
  'abuloma', 'iwofe', 'rumuodara', 'rumuomasi', 'rumuagholu', 'rumuaghaolu', 'rukpokwu', 'woji',
  'trans amadi', 'ada-george', 'ada george', 'mgbuoba', 'mgbuosimiri', 'mgbuesilara', 'ozuoba',
  'd-line', 'd line', 'rumuokoro', 'rumuibekwe', 'rumuokwurusi', 'peter odili', 'eagle island',
  'nkpogu', 'obia', 'diobu', 'mile 3', 'anambra', 'awka', 'onitsha', 'nnewi', 'abia', 'aba',
  'umuahia', 'kwara', 'ilorin', 'ondo', 'akure', 'osun', 'osogbo', 'oshogbo', 'ekiti', 'ado ekiti',
  'calabar', 'cross river', 'bayelsa', 'yenagoa', 'kogi', 'lokoja', 'niger', 'minna', 'nasarawa',
  'lafia', 'benue', 'makurdi',
];

export const ADDRESS_INDICATORS =
  /\b(street|st\.?|road|rd\.?|avenue|ave\.?|close|crescent|estate|phase\s*\d*|lane|way|drive|dr\.?|plot|block|flat|no\.?\s*\d+|off\s+|opposite\s+|behind\s+|beside\s+|junction|bus\s*stop|lga|local government)\b/i;

export function extractLocationTokens(locationText?: string): string[] {
  if (!locationText) return [];
  const rawParts = locationText
    .toLowerCase()
    .replace(/[().]/g, ' ')
    .split(/[,\n]+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 1);

  const tokens = new Set<string>(rawParts);
  for (const loc of NIGERIA_LOCATIONS) {
    if (new RegExp(`\\b${loc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(locationText)) {
      tokens.add(loc);
    }
  }
  return Array.from(tokens);
}

/** Dice bigram coefficient for fuzzy/trigram-like matching on typos */
export function diceSimilarity(a: string, b: string): number {
  const s1 = a.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = b.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) return s1 === s2 ? 1 : 0;

  const bigrams1 = new Map<string, number>();
  for (let i = 0; i < s1.length - 1; i++) {
    const bg = s1.slice(i, i + 2);
    bigrams1.set(bg, (bigrams1.get(bg) || 0) + 1);
  }
  let overlap = 0;
  for (let i = 0; i < s2.length - 1; i++) {
    const bg = s2.slice(i, i + 2);
    const cnt = bigrams1.get(bg) || 0;
    if (cnt > 0) {
      overlap++;
      bigrams1.set(bg, cnt - 1);
    }
  }
  return (2 * overlap) / (s1.length - 1 + (s2.length - 1));
}

export interface ExpandedQueryInfo {
  originalQuery: string;
  expandedTerms: string[];
  matchedSynonyms: Array<{ phrase: string; mapped: string[] }>;
  inferredDomain?: UniversalDomainCategory;
  inferredCategory?: string;
}

const TOKEN_SYNONYM_MAP: Record<string, string[]> = {
  gen: ['generator', 'diesel generator', 'petrol generator'],
  generator: ['generator repair', 'generator mechanic', 'engine overhaul', 'perkins', 'cummins', 'lister'],
  fridge: ['refrigerator', 'freezer', 'refrigeration', 'cooling'],
  refrigerator: ['fridge', 'freezer', 'cooling', 'compressor'],
  ac: ['air conditioner', 'hvac', 'cooling', 'split ac', 'vrf'],
  website: ['web developer', 'web design', 'ecommerce', 'frontend', 'landing page', 'wordpress'],
  web: ['website', 'web development', 'web designer', 'ecommerce'],
  app: ['mobile app', 'android', 'ios', 'software developer', 'flutter'],
  android: ['mobile app developer', 'android app', 'software'],
  logo: ['graphic designer', 'branding', 'visual identity', 'flyer'],
  graphic: ['graphic designer', 'branding', 'logo', 'design'],
  mechanic: ['auto mechanic', 'car repair', 'toyota', 'diagnostic', 'engine'],
  plumber: ['plumbing', 'pipe', 'leak', 'borehole', 'sanitary', 'tap'],
  electrician: ['electrical', 'wiring', 'breaker', 'panel', 'power', 'light'],
  carpenter: ['carpentry', 'furniture', 'woodwork', 'cabinet', 'joinery', 'upholstery'],
  carpentry: ['carpenter', 'furniture', 'woodwork', 'cabinet', 'joinery'],
  furniture: ['carpenter', 'carpentry', 'woodwork', 'chair', 'desk', 'office chair', 'table', 'sofa', 'cabinet'],
  welder: ['welding', 'fabricator', 'fabrication', 'metal', 'steel', 'stainless', 'iron'],
  welding: ['welder', 'fabrication', 'metalwork', 'steel', 'iron'],
  tailor: ['tailoring', 'fashion', 'fashion designer', 'stitches', 'couture', 'bespoke', 'bridal', 'apparel'],
  fashion: ['tailor', 'fashion designer', 'couture', 'bespoke', 'bridal', 'stitches'],
  inverter: ['solar inverter', 'hybrid inverter', '5kva', 'battery', 'solar', 'solar installer'],
  solar: ['solar panel', 'solar installer', 'inverter', 'battery', 'lithium', 'renewable'],
  fibre: ['fiber', 'isp', 'internet', 'broadband'],
  fiber: ['fibre', 'isp', 'internet', 'broadband'],
  cctv: ['camera', 'surveillance', 'security camera', 'nvr', 'access control'],
  accountant: ['accounting', 'tax', 'bookkeeping', 'audit', 'finance'],
  cleaning: ['cleaner', 'fumigation', 'pest control', 'sanitization', 'janitorial'],
  laptop: ['macbook', 'hp', 'dell', 'lenovo', 'computer', 'pc'],
  phone: ['samsung', 'iphone', 'smartphone', 'android', 'mobile'],
};

const SEARCH_STOPWORDS = new Set([
  'in', 'on', 'at', 'to', 'for', 'of', 'by', 'or', 'an', 'and', 'the', 'is', 'are', 'am', 'my',
  'me', 'we', 'us', 'who', 'what', 'where', 'when', 'how', 'can', 'need', 'want', 'find', 'get',
  'show', 'give', 'tell', 'looking', 'search', 'near', 'around', 'with', 'without', 'under', 'below',
  'above', 'less', 'than', 'budget', 'price', 'cost', 'buy', 'sell', 'hire', 'someone', 'company',
  'service', 'services', 'product', 'products', 'good', 'best', 'affordable', 'cheap', 'please',
]);

const SHORT_DOMAIN_TERMS = new Set(['ac', 'tv', 'it', 'ui', 'ux', 'pc', 'hp', 'lg']);

export function expandQueryWithSynonyms(query: string, keywords: string[] = []): ExpandedQueryInfo {
  const lower = query.toLowerCase().trim();
  const synonyms = getSearchSynonyms();
  const expanded = new Set<string>(
    keywords
      .map((k) => k.toLowerCase().trim())
      .filter((k) => (k.length >= 3 || SHORT_DOMAIN_TERMS.has(k)) && !SEARCH_STOPWORDS.has(k) && !/^\d+$/.test(k))
  );
  const matchedSynonyms: Array<{ phrase: string; mapped: string[] }> = [];
  let inferredDomain: UniversalDomainCategory | undefined;
  let inferredCategory: string | undefined;

  for (const syn of synonyms) {
    if (lower.includes(syn.phrase.toLowerCase())) {
      matchedSynonyms.push({ phrase: syn.phrase, mapped: syn.canonical_terms });
      syn.canonical_terms.forEach((t) => expanded.add(t.toLowerCase()));
      if (!inferredDomain && syn.intent_hint) {
        inferredDomain = syn.intent_hint as UniversalDomainCategory;
      }
      if (!inferredCategory && syn.category_hint) {
        inferredCategory = syn.category_hint;
      }
    }
  }

  // Also check symptom regex patterns (Pidgin & natural phrases)
  if (/\b(no dey start|won'?t start|not starting|refused to start|no start)\b/i.test(lower)) {
    ['repair', 'technician', 'mechanic', 'troubleshooting', 'overhaul'].forEach((t) => expanded.add(t));
    if (!inferredDomain) inferredDomain = 'repairs';
  }
  if (/\b(no dey cool|not cooling|no cool|blowing hot|warm air)\b/i.test(lower)) {
    ['repair', 'technician', 'gas refill', 'compressor', 'cooling'].forEach((t) => expanded.add(t));
    if (!inferredDomain) inferredDomain = 'repairs';
  }
  if (/\b(leak|leaking|burst|blocked|no water|dripping)\b/i.test(lower)) {
    ['plumber', 'plumbing', 'leak detection', 'pipe repair'].forEach((t) => expanded.add(t));
    if (!inferredDomain) inferredDomain = 'repairs';
  }

  // Expand meaningful single-word tokens
  const words = lower
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => (w.length >= 3 || SHORT_DOMAIN_TERMS.has(w)) && !SEARCH_STOPWORDS.has(w) && !/^\d+$/.test(w));
  for (const w of words) {
    expanded.add(w);
    if (TOKEN_SYNONYM_MAP[w]) {
      TOKEN_SYNONYM_MAP[w].forEach((t) => expanded.add(t));
    }
  }

  return {
    originalQuery: query,
    expandedTerms: Array.from(expanded),
    matchedSynonyms,
    inferredDomain,
    inferredCategory,
  };
}

function fuzzyMatchTokens(terms: string[], haystackText: string): { hits: string[]; fuzzyScore: number } {
  const hayLower = haystackText.toLowerCase();
  const hayWords = hayLower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2);
  const hayWordSet = new Set(hayWords);
  const hits: string[] = [];
  let score = 0;

  for (const term of terms) {
    const clean = term.toLowerCase().trim();
    if (!clean || SEARCH_STOPWORDS.has(clean) || /^\d+$/.test(clean)) continue;
    if (clean.length < 3 && !SHORT_DOMAIN_TERMS.has(clean)) continue;

    // Require word-boundary match for short tokens (<= 4 chars) to avoid false substring hits
    if (clean.length <= 4 && !clean.includes(' ')) {
      if (hayWordSet.has(clean) || new RegExp(`\\b${clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(hayLower)) {
        hits.push(clean);
        score += 18;
        continue;
      }
    } else if (hayLower.includes(clean)) {
      hits.push(clean);
      score += clean.includes(' ') ? 26 : 18;
      continue;
    }

    // Check individual words inside multi-word term
    if (clean.includes(' ')) {
      const subWords = clean.split(/\s+/).filter((w) => w.length > 2 && !SEARCH_STOPWORDS.has(w));
      const subMatches = subWords.filter((sw) => hayLower.includes(sw));
      if (subMatches.length >= Math.min(2, subWords.length)) {
        hits.push(clean);
        score += 16;
        continue;
      }
    }

    // Fuzzy similarity fallback for typos (Dice >= 0.78 on >= 4-char tokens)
    if (clean.length >= 4) {
      let bestSim = 0;
      for (const hw of hayWords) {
        if (Math.abs(hw.length - clean.length) > 3) continue;
        const sim = diceSimilarity(clean, hw);
        if (sim > bestSim) bestSim = sim;
      }
      if (bestSim >= 0.78) {
        hits.push(`${clean}~`);
        score += Math.round(bestSim * 16);
      }
    }
  }

  return { hits: Array.from(new Set(hits)), fuzzyScore: score };
}

function locationMatchesText(locationQuery: string | undefined, targetLocationText: string): boolean {
  if (!locationQuery) return false;
  const locTokens = extractLocationTokens(locationQuery);
  const hay = targetLocationText.toLowerCase();
  if (hay.includes('nationwide') || hay.includes('all nigeria') || hay.includes('remote')) return true;
  return locTokens.some((tok) => hay.includes(tok));
}

export interface UniversalSearchParams {
  query: string;
  keywords?: string[];
  category?: string;
  domain?: UniversalDomainCategory;
  location?: string;
  budgetMax?: number;
  condition?: string;
  extraProfessionals?: PublicProfessionalProfile[];
  limit?: number;
}

export interface UniversalSearchOutput {
  expandedQuery: ExpandedQueryInfo;
  products: CatalogProduct[];
  services: MatchedServiceCandidate[];
  professionals: MatchedProfessionalCandidate[];
  businesses: DirectoryBusiness[];
}

export function executeUniversalSearch(params: UniversalSearchParams): UniversalSearchOutput {
  const {
    query,
    keywords = [],
    category,
    location,
    budgetMax,
    condition,
    extraProfessionals = [],
    limit = 6,
  } = params;

  const expandedInfo = expandQueryWithSynonyms(query, keywords);
  const searchTerms = expandedInfo.expandedTerms;
  const lowerQ = query.toLowerCase().trim();

  // 1. SEARCH APPROVED CATALOG PRODUCTS
  const allProducts = getCatalogProducts().filter(
    (p) =>
      p.is_published &&
      p.verification_status !== 'rejected' &&
      p.verification_status !== 'pending' &&
      p.availability !== 'Out of Stock'
  );

  const scoredProducts = allProducts
    .map((prod) => {
      const hay = [
        prod.name,
        prod.brand,
        prod.model,
        prod.category,
        prod.description,
        prod.seller_name,
        prod.location,
        prod.state,
        prod.city,
        ...Object.entries(prod.specs || {}).map(([k, v]) => `${k} ${v}`),
      ]
        .filter(Boolean)
        .join(' ');

      let score = 0;
      if (prod.name.toLowerCase().includes(lowerQ) || (lowerQ.length > 3 && lowerQ.includes(prod.name.toLowerCase()))) {
        score += 40;
      }

      const { hits, fuzzyScore } = fuzzyMatchTokens(searchTerms, hay);
      score += fuzzyScore;

      if (category && prod.category?.toLowerCase().includes(category.toLowerCase().split('&')[0].trim())) {
        score += 12;
      }

      if (hits.length === 0 && score < 15) return { product: prod, score: 0 };

      if (budgetMax && budgetMax > 0 && prod.price > 0) {
        if (prod.price <= budgetMax) score += 20;
        else if (prod.price <= budgetMax * 1.15) score += 2;
        else score -= 45;
      }

      if (location) {
        const prodLoc = `${prod.location || ''} ${prod.state || ''} ${prod.city || ''}`;
        if (locationMatchesText(location, prodLoc)) score += 20;
      }

      if (condition && prod.condition?.toLowerCase() === condition.toLowerCase()) score += 10;
      if (prod.availability === 'In Stock') score += 5;
      if (prod.seller_verified || prod.verification_status === 'verified') score += 6;

      return { product: prod, score };
    })
    .filter((item) => item.score > 14)
    .sort((a, b) => b.score - a.score);

  let matchedProducts = scoredProducts.slice(0, limit).map((s) => s.product);
  if (budgetMax && budgetMax > 0) {
    const withinBudget = scoredProducts.filter((s) => s.product.price <= budgetMax || s.product.price === 0);
    if (withinBudget.length > 0) {
      matchedProducts = withinBudget.slice(0, limit).map((s) => s.product);
    } else {
      matchedProducts = scoredProducts
        .filter((s) => s.product.price <= budgetMax * 1.2)
        .slice(0, 3)
        .map((s) => s.product);
    }
  }

  // 2. SEARCH APPROVED SERVICE OFFERINGS (Unified services linked to businesses/artisans)
  const allDirBusinesses = getDirectoryBusinesses().filter((b) => b.approval_status === 'Approved');
  const bizById = new Map<string, DirectoryBusiness>();
  allDirBusinesses.forEach((b) => {
    bizById.set(b.id, b);
    if (b.linked_business_id) bizById.set(b.linked_business_id, b);
  });

  const allServices = getServiceOfferings().filter((s) => s.approval_status === 'Approved');
  const serviceCandidatesWithSort: Array<{
    candidate: MatchedServiceCandidate;
    locMatched: boolean;
    rawScore: number;
  }> = [];

  for (const svc of allServices) {
    const parentBiz = bizById.get(svc.business_id);
    if (parentBiz && parentBiz.approval_status !== 'Approved') continue;

    const hay = [
      svc.service_name,
      svc.service_category,
      svc.description,
      svc.business_name,
      ...(svc.sub_services || []),
      ...(svc.keywords || []),
    ]
      .filter(Boolean)
      .join(' ');

    const { hits, fuzzyScore } = fuzzyMatchTokens(searchTerms, hay);
    let score = fuzzyScore;
    const reasons: string[] = [];

    if (hits.length > 0) {
      reasons.push(`Matches: ${hits.slice(0, 3).join(', ')}`);
    }
    if (category && svc.service_category.toLowerCase().includes(category.toLowerCase().split('&')[0].trim())) {
      score += 18;
      reasons.push(`Category: ${svc.service_category}`);
    }

    if (score < 16 || hits.length === 0) continue;

    // Location relevance check
    const svcLoc = [
      svc.city,
      svc.state,
      ...(svc.locations_covered || []),
      ...(parentBiz?.locations_served || []),
      parentBiz?.city,
      parentBiz?.state,
      parentBiz?.address,
    ]
      .filter(Boolean)
      .join(' ');

    let locMatched = false;
    if (location) {
      if (locationMatchesText(location, svcLoc)) {
        locMatched = true;
        score += 50;
        reasons.push(`Covers ${location}`);
      } else {
        score -= 35;
      }
    }

    if (budgetMax && budgetMax > 0 && svc.price_min && svc.price_min > 0) {
      if (svc.price_min <= budgetMax) {
        score += 12;
      } else if (svc.price_min > budgetMax * 1.25) {
        score -= 30;
      }
    }

    const isVerified = Boolean(svc.is_verified || parentBiz?.is_verified);
    if (isVerified) {
      score += 10;
      reasons.push('Verified specialist');
    }

    if (score >= 18) {
      serviceCandidatesWithSort.push({
        locMatched,
        rawScore: score,
        candidate: {
          service: {
            ...svc,
            phone: parentBiz?.phone || svc.phone,
            whatsapp: parentBiz?.whatsapp || parentBiz?.phone || svc.whatsapp,
            email: parentBiz?.email || svc.email,
            state: parentBiz?.state || svc.state,
            city: parentBiz?.city || svc.city,
          },
          business: parentBiz,
          matchScore: Math.min(99, score),
          matchReasons: reasons.length > 0 ? reasons : [`Offers ${svc.service_name}`],
          isVerified,
        },
      });
    }
  }

  serviceCandidatesWithSort.sort(
    (a, b) =>
      Number(b.locMatched) - Number(a.locMatched) ||
      b.rawScore - a.rawScore
  );
  const serviceCandidates: MatchedServiceCandidate[] = serviceCandidatesWithSort.map((s) => s.candidate);

  // 3. SEARCH UNIFIED PROVIDERS / PROFESSIONALS / ARTISANS (Approved Directory + Registered + Validated Artisans)
  const store = readStoreFile();
  const artisans: ArtisanRecommendation[] = Array.isArray(store.__artisan_recommendations)
    ? store.__artisan_recommendations
    : [];

  const unifiedPros: PublicProfessionalProfile[] = [
    // Approved Directory Businesses first (latest edits reflect immediately!)
    ...allDirBusinesses.map((b) => ({
      id: b.id,
      business_name: b.business_name,
      industry: b.industry,
      specialization: b.specialization,
      tagline: b.tagline || b.description,
      logo: b.logo,
      phone: b.phone,
      whatsapp: b.whatsapp || b.phone,
      email: b.email || '',
      address: [b.address, b.city, b.state].filter(Boolean).join(', '),
      state: b.state,
      city: b.city,
      categories_offered: [b.industry, b.specialization, ...(b.categories_offered || [])].filter(Boolean),
      locations_served: b.locations_served || [b.city || '', b.state || ''].filter(Boolean),
      is_public: true,
      phone_verified: b.is_verified,
      email_verified: Boolean(b.email && b.is_verified),
      identity_verified: b.is_verified,
      business_verified: b.provider_type === 'business' && b.is_verified,
      service_verified: b.is_verified,
      is_artisan: b.provider_type === 'artisan' || b.provider_type === 'repair_technician',
      vouches_count: b.vouches_count || 1,
      rating: b.rating || 4.8,
      work_done: b.description,
      verification_status: b.is_verified ? ('verified' as const) : ('in_review' as const),
      created_at: b.created_at,
    })),
    // Extra professionals synced from Supabase / registered accounts
    ...extraProfessionals,
    // Admin/Community validated artisans
    ...artisans
      .filter((a) => a.validation_status !== 'rejected' && a.validation_status !== 'pending')
      .map((a) => ({
        id: a.id,
        business_name: a.artisan_name,
        industry: a.trade_category,
        specialization: a.services_offered?.join(', ') || a.trade_category,
        tagline: a.work_done || a.recommendation_note,
        logo: a.photo_url,
        phone: a.phone,
        whatsapp: a.whatsapp || a.phone,
        email: a.email || '',
        address: a.address || [a.town, a.state].filter(Boolean).join(', '),
        state: a.state,
        city: a.town,
        categories_offered: [a.trade_category, ...(a.services_offered || [])].filter(Boolean),
        locations_served: [a.town, a.state].filter(Boolean),
        is_public: true,
        phone_verified: Boolean(a.verified || a.validation_status === 'validated' || a.validation_status === 'claimed'),
        email_verified: Boolean(a.email && a.verified),
        identity_verified: Boolean(a.verified),
        business_verified: a.profile_type === 'professional' ? Boolean(a.verified) : a.validation_status === 'claimed',
        service_verified: Boolean(a.verified),
        is_artisan: a.profile_type !== 'professional',
        vouches_count: a.vouches_count || 1,
        rating: a.rating || 4.8,
        work_done: a.work_done,
        verification_status: a.verified ? ('verified' as const) : ('in_review' as const),
        subscription_plan: a.subscription_plan,
        is_paid: a.is_paid,
        created_at: a.created_at,
      })),
  ];

  // Deduplicate keeping earliest (highest priority: live DirectoryBusiness / updated business first)
  const seenKey = new Set<string>();
  const dedupedPros = unifiedPros.filter((p) => {
    const key = (p.id || p.business_name).toLowerCase();
    const nameKey = p.business_name.trim().toLowerCase();
    if (!key || seenKey.has(key) || seenKey.has(nameKey)) return false;
    seenKey.add(key);
    seenKey.add(nameKey);
    return true;
  });

  const proCandidatesWithSort: Array<{
    candidate: MatchedProfessionalCandidate;
    locMatched: boolean;
    rawScore: number;
  }> = [];
  for (const pro of dedupedPros) {
    const linkedSvcs = allServices.filter((s) => s.business_id === pro.id);
    const hay = [
      pro.business_name,
      pro.industry,
      pro.specialization,
      pro.tagline,
      pro.work_done,
      ...(pro.categories_offered || []),
      ...linkedSvcs.flatMap((s) => [s.service_name, s.service_category, s.description, ...(s.sub_services || [])]),
    ]
      .filter(Boolean)
      .join(' ');

    const { hits, fuzzyScore } = fuzzyMatchTokens(searchTerms, hay);
    let score = fuzzyScore;
    const reasons: string[] = [];

    if (hits.length > 0) {
      reasons.push(`Specialist in ${pro.specialization || pro.industry}`);
    }
    if (category && hay.toLowerCase().includes(category.toLowerCase().split('&')[0].trim())) {
      score += 18;
    }

    if (score < 16 || hits.length === 0) continue;

    const proLoc = [pro.city, pro.state, pro.address, ...(pro.locations_served || [])].filter(Boolean).join(' ');
    let locMatched = false;
    if (location) {
      if (locationMatchesText(location, proLoc)) {
        locMatched = true;
        score += 50;
        reasons.push(`Serves ${location}`);
      } else {
        score -= 35;
      }
    }

    const isVerified = Boolean(pro.phone_verified || pro.business_verified || pro.verification_status === 'verified');
    if (isVerified) {
      score += 12;
      reasons.push('Verified profile');
    }

    if (score >= 18) {
      proCandidatesWithSort.push({
        locMatched,
        rawScore: score,
        candidate: {
          professional: pro,
          matchScore: Math.min(99, score),
          matchReasons: Array.from(new Set(reasons)),
          isVerified,
          isPremium: Boolean(pro.is_paid || (pro.subscription_plan && pro.subscription_plan !== 'free')),
        },
      });
    }
  }

  proCandidatesWithSort.sort(
    (a, b) =>
      Number(b.locMatched) - Number(a.locMatched) ||
      b.rawScore - a.rawScore ||
      (Number(b.candidate.professional.rating) || 0) - (Number(a.candidate.professional.rating) || 0) ||
      (Number(b.candidate.professional.vouches_count) || 0) - (Number(a.candidate.professional.vouches_count) || 0)
  );
  const proCandidates: MatchedProfessionalCandidate[] = proCandidatesWithSort.map((p) => p.candidate);

  const matchedBusinesses = proCandidates
    .map((c) => bizById.get(c.professional.id))
    .filter((b): b is DirectoryBusiness => Boolean(b));

  return {
    expandedQuery: expandedInfo,
    products: matchedProducts,
    services: serviceCandidates.slice(0, limit),
    professionals: proCandidates.slice(0, limit),
    businesses: matchedBusinesses,
  };
}
