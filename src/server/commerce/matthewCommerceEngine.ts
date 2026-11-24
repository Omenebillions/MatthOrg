import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type {
  CatalogProduct,
  MatchedProfessionalCandidate,
  MatchedServiceCandidate,
  ProductComparisonDimension,
  ProductComparisonMatrix,
  PublicProfessionalProfile,
  SponsoredCampaign,
  UniversalDomainCategory,
} from '../../types';
import {
  getAdControls,
  getCatalogProducts,
  getServiceOfferings,
  getSponsoredCampaigns,
  logConversationTurn,
  logSearchAnalytics,
  trackCampaignEvent,
  upsertCapturedCustomerRequest,
  upsertZeroMatchFulfilmentRequest,
} from './store';
import {
  ADDRESS_INDICATORS,
  NIGERIA_LOCATIONS,
  executeUniversalSearch,
  expandQueryWithSynonyms,
  extractLocationTokens,
} from './universalSearch';

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: 14000,
        headers: { 'User-Agent': 'aistudio-build' },
      },
    });
  }
  return aiClient;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout;
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Gemini timeout after ${ms}ms`)), ms);
    }),
  ]).finally(() => clearTimeout(timer!));
}

export interface DiscoverRequest {
  message: string;
  sessionId?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  accumulatedContext?: {
    budgetMax?: number;
    location?: string;
    category?: string;
    domain?: UniversalDomainCategory;
    requirements?: string[];
    lastKeywords?: string[];
    lastIntent?: string;
  };
  compareProductIds?: string[];
  publicProfessionals?: PublicProfessionalProfile[];
}

export interface DiscoverResponse {
  success: boolean;
  reply: string;
  intent: 'product_search' | 'product_compare' | 'service_discovery' | 'hybrid' | 'clarify';
  domain: UniversalDomainCategory;
  products: CatalogProduct[];
  sponsoredProducts: Array<CatalogProduct & { campaign_id: string; relevanceScore: number }>;
  comparison?: ProductComparisonMatrix;
  services: MatchedServiceCandidate[];
  professionals: MatchedProfessionalCandidate[];
  followUpQuestions: string[];
  needsLocation?: boolean;
  extractedContext: {
    budgetMax?: number;
    location?: string;
    category?: string;
    domain?: UniversalDomainCategory;
    requirements?: string[];
    lastKeywords?: string[];
    lastIntent?: string;
  };
  noResultsAction?: {
    canBroaden: boolean;
    broadenPrompt?: string;
    canRequestSourcing: boolean;
    serviceOrProductNeeded?: string;
    location?: string;
    category?: string;
    requestType?: UniversalDomainCategory;
  };
  storedRequest?: {
    id: string;
    request_number: string;
    isNew: boolean;
    totalFound: number;
    needsMatch: boolean;
  };
}

interface ParsedIntent {
  intent: 'product_search' | 'product_compare' | 'service_discovery' | 'hybrid' | 'clarify';
  domain: UniversalDomainCategory;
  keywords: string[];
  category?: string;
  brand?: string;
  model?: string;
  budgetMax?: number;
  budgetMin?: number;
  condition?: string;
  location?: string;
  requirements: string[];
  needsClarification: boolean;
  clarifyingQuestion?: string;
  followUpQuestions: string[];
}

const SERVICE_KEYWORDS = [
  'plumber', 'plumbing', 'electrician', 'electrical', 'installer', 'installation', 'install',
  'repair', 'technician', 'mechanic', 'carpenter', 'painter', 'painting', 'cleaner',
  'cleaning', 'fumigation', 'tiler', 'bricklayer', 'mason', 'builder', 'contractor', 'welder',
  'cctv installer', 'ac repair', 'air conditioner', 'generator', 'gen ', 'fridge', 'refrigerator',
  'find a professional', 'hire', 'artisan', 'handyman', 'solar installer',
  'website', 'web developer', 'web designer', 'graphic designer', 'logo', 'android app', 'mobile app',
  'accountant', 'bookkeeping', 'lawyer', 'architect', 'fibre internet', 'fiber internet', 'isp',
  'supplier', 'quotation', 'quote', 'not starting', 'not cooling', 'no dey start', 'no dey cool',
  'connect light', 'wire my house', 'who can', 'someone to', 'company that',
];

const PRODUCT_KEYWORDS = [
  'buy', 'price', 'cost', 'show me', 'inverter', 'battery', 'batteries', 'solar panel', 'laptop',
  'macbook', 'hp', 'dell', 'lenovo', 'phone', 'samsung', 'iphone', 'tv', 'television',
  'freezer', 'furniture', 'chair', 'desk', 'sofa', 'table',
  'router', 'starlink', 'product', 'kva', 'watt', 'compare', 'under ₦', 'how much is',
];

function isPureLocationMessage(
  message: string,
  prevCtx?: DiscoverRequest['accumulatedContext'],
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): boolean {
  const lower = message.toLowerCase().trim();
  const hasNewProductOrService =
    PRODUCT_KEYWORDS.some((kw) => lower.includes(kw)) ||
    SERVICE_KEYWORDS.some((kw) => lower.includes(kw));
  if (hasNewProductOrService) return false;

  const hasLocationSignal =
    NIGERIA_LOCATIONS.some((loc) => new RegExp(`\\b${loc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(lower)) ||
    ADDRESS_INDICATORS.test(lower);

  const lastAssistant = [...history].reverse().find((h) => h.role === 'assistant')?.content.toLowerCase() || '';
  const assistantAskedLocation =
    lastAssistant.includes('area') ||
    lastAssistant.includes('state') ||
    lastAssistant.includes('address') ||
    lastAssistant.includes('where are you') ||
    lastAssistant.includes('located');

  return Boolean(
    (prevCtx?.lastKeywords?.length || prevCtx?.category) &&
      (hasLocationSignal || (assistantAskedLocation && lower.length <= 120))
  );
}

function extractBudgetFromText(text: string): number | undefined {
  const lower = text.toLowerCase().replace(/,/g, '');
  const mMatch = lower.match(/(?:₦|n|ngn)?\s*(\d+(?:\.\d+)?)\s*(?:m|million)\b/);
  if (mMatch) return Math.round(parseFloat(mMatch[1]) * 1_000_000);

  const kMatch = lower.match(/(?:₦|n|ngn)?\s*(\d+(?:\.\d+)?)\s*k\b/);
  if (kMatch && !lower.includes(`${kMatch[1]}kva`)) {
    return Math.round(parseFloat(kMatch[1]) * 1_000);
  }
  const rawMatch = lower.match(/(?:under|below|max|within|budget|₦|ngn|naira)\s*(?:of|is|:)?\s*(?:₦|n|ngn)?\s*(\d{4,9})/);
  if (rawMatch) return parseInt(rawMatch[1], 10);

  const standaloneLarge = lower.match(/(?:₦|ngn)\s*(\d{4,9})/);
  if (standaloneLarge) return parseInt(standaloneLarge[1], 10);
  return undefined;
}

function detectDomain(text: string, synonymDomain?: UniversalDomainCategory): UniversalDomainCategory {
  const lower = text.toLowerCase();
  if (synonymDomain) return synonymDomain;
  if (/\b(website|web design|web developer|graphic|logo|android app|mobile app|ui\/ux|seo|social media|video edit|online shop|software)\b/.test(lower)) {
    return 'digital_creative';
  }
  if (/\b(repair|not cooling|no dey cool|not starting|no dey start|broken|fault|fix|mechanic|overhaul|leak|servicing)\b/.test(lower)) {
    return 'repairs';
  }
  if (/\b(accountant|lawyer|legal|architect|consultant|tax|audit|cybersecurity|structural engineer)\b/.test(lower)) {
    return 'professional_services';
  }
  if (/\b(fibre|fiber|isp|internet|supplier|building materials|cleaning|fumigation|logistics|equipment rental|borehole)\b/.test(lower)) {
    return 'business_commercial';
  }
  if (/\b(plumber|electrician|carpenter|painter|welder|tiler|mason|cctv|installer|artisan|generator)\b/.test(lower)) {
    return 'artisans';
  }
  if (PRODUCT_KEYWORDS.some((kw) => lower.includes(kw))) {
    return 'products';
  }
  return 'general';
}

function heuristicParseIntent(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  prevCtx?: DiscoverRequest['accumulatedContext']
): ParsedIntent {
  const combined = `${history.map((h) => h.content).join(' ')} ${message}`.toLowerCase();
  const currentLower = message.toLowerCase();
  const pureLocationReply = isPureLocationMessage(message, prevCtx, history);

  const expandedInfo = expandQueryWithSynonyms(message);
  const domain = pureLocationReply && prevCtx?.domain
    ? prevCtx.domain
    : detectDomain(message, expandedInfo.inferredDomain);

  const isCompare = /\b(compare|versus|vs\.?|difference between|which is better)\b/i.test(currentLower);
  const hasServiceWord =
    SERVICE_KEYWORDS.some((kw) => currentLower.includes(kw)) ||
    domain === 'artisans' ||
    domain === 'repairs' ||
    domain === 'digital_creative' ||
    domain === 'professional_services' ||
    domain === 'business_commercial';
  const hasProductWord = PRODUCT_KEYWORDS.some((kw) => currentLower.includes(kw));

  let intent: ParsedIntent['intent'] = (prevCtx?.lastIntent as ParsedIntent['intent']) || 'product_search';
  if (pureLocationReply && prevCtx?.lastIntent) {
    intent = prevCtx.lastIntent as ParsedIntent['intent'];
  } else if (isCompare) {
    intent = 'product_compare';
  } else if (hasServiceWord && hasProductWord) {
    intent = 'hybrid';
  } else if (hasServiceWord) {
    intent = 'service_discovery';
  } else if (hasProductWord) {
    intent = 'product_search';
  } else {
    intent = 'hybrid'; // Universal queries search both products & services/businesses
  }

  const budgetMax = extractBudgetFromText(message) ?? prevCtx?.budgetMax;

  let location = prevCtx?.location;
  if (pureLocationReply || ADDRESS_INDICATORS.test(message)) {
    location = message
      .replace(/^(i am in|i'm in|located in|at|around|my address is|address is|in)\s+/i, '')
      .trim();
  } else {
    const matchedLocs: string[] = [];
    for (const loc of NIGERIA_LOCATIONS) {
      if (new RegExp(`\\b${loc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(currentLower)) {
        let formatted = loc
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        if (loc === 'fct') formatted = 'Abuja';
        if (loc === 'vi') formatted = 'Victoria Island';
        if (!matchedLocs.includes(formatted)) matchedLocs.push(formatted);
      }
    }
    if (matchedLocs.length > 0) {
      location = matchedLocs.join(', ');
    }
  }

  let condition: string | undefined;
  if (/\bbrand new|new\b/i.test(currentLower)) condition = 'New';
  else if (/\bforeign used|uk used|tokunbo\b/i.test(currentLower)) condition = 'Foreign Used';
  else if (/\brefurbished\b/i.test(currentLower)) condition = 'Refurbished';
  else if (/\bused\b/i.test(currentLower)) condition = 'Used';

  const stopWords = new Set([
    'find', 'me', 'a', 'an', 'the', 'i', 'need', 'want', 'looking', 'for', 'where', 'can',
    'buy', 'get', 'under', 'below', 'around', 'in', 'with', 'good', 'best', 'affordable',
    'compare', 'these', 'three', 'two', 'please', 'who', 'original', 'budget', 'is', 'my',
    'to', 'power', 'and', 'or', 'on', 'at', 'of', 'show', 'listings', 'options', 'professional',
    'located', 'address', 'area', 'state', 'street', 'road', 'avenue', 'close', 'estate',
    'someone', 'company', 'that', 'provides', 'dey', 'no', 'does', 'not',
  ]);

  const tokens = currentLower
    .replace(/[₦,?!.]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !stopWords.has(t) && !/^\d+$/.test(t));

  const prevKeywords = prevCtx?.lastKeywords?.length
    ? prevCtx.lastKeywords
    : (prevCtx?.requirements || []).flatMap((r) => r.toLowerCase().split(/\s+/));

  const synonymKeywords = expandedInfo.expandedTerms.slice(0, 8);
  const keywords = pureLocationReply
    ? Array.from(new Set(prevKeywords))
    : Array.from(new Set([...tokens, ...synonymKeywords]));

  let category = prevCtx?.category || expandedInfo.inferredCategory;
  if (/\b(inverter|battery|solar|panel|kva|lithium|tubular)\b/.test(combined)) category = 'Solar & Power';
  else if (/\b(laptop|macbook|computer|desktop|pc|graphics)\b/.test(combined)) category = 'Laptops & Computing';
  else if (/\b(phone|samsung|iphone|smartphone|mobile)\b/.test(combined)) category = 'Phones & Tablets';
  else if (/\b(furniture|chair|desk|table|sofa|cabinet|office)\b/.test(combined)) category = 'Office & Home Furniture';
  else if (/\b(plumber|plumbing|pipe|leak|borehole)\b/.test(combined)) category = 'Plumbing';
  else if (/\b(electrician|wiring|electrical)\b/.test(combined)) category = 'Electrical';
  else if (/\b(generator|gen)\b/.test(combined)) category = 'Generator Repair';
  else if (/\b(fridge|refrigerator|freezer)\b/.test(combined)) category = 'Appliance & Refrigerator Repair';
  else if (/\b(ac|air conditioner|hvac|cold room)\b/.test(combined)) category = 'HVAC & AC Repair';
  else if (/\b(website|web|online shop|app|android|graphic|logo)\b/.test(combined)) category = 'Digital & Creative Services';
  else if (/\b(accountant|lawyer|architect|audit|tax)\b/.test(combined)) category = 'Professional Services';
  else if (/\b(cctv|camera|security|alarm)\b/.test(combined)) category = 'CCTV & Security';
  else if (/\b(fibre|fiber|internet|isp|cleaning|fumigation|building materials)\b/.test(combined)) category = 'Business & Commercial Services';

  const mergedReqs = pureLocationReply
    ? prevCtx?.requirements || []
    : Array.from(new Set([...(prevCtx?.requirements || []), ...tokens.slice(0, 5)])).slice(0, 8);

  return {
    intent,
    domain,
    keywords,
    category,
    budgetMax,
    condition,
    location,
    requirements: mergedReqs,
    needsClarification: false,
    followUpQuestions: [],
  };
}

async function parseIntentWithGemini(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  prevCtx?: DiscoverRequest['accumulatedContext'],
  availableCategories: string[] = []
): Promise<ParsedIntent> {
  const heuristic = heuristicParseIntent(message, history, prevCtx);
  const ai = getGeminiClient();
  if (!ai) return heuristic;

  const historySnippet = history
    .slice(-6)
    .map((h) => `${h.role === 'user' ? 'Customer' : 'Matthew AI'}: ${h.content}`)
    .join('\n');

  const prompt = `Analyze this universal marketplace customer message within an ongoing conversation.
Previous known context: ${JSON.stringify(prevCtx || {})}
Available marketplace categories: ${availableCategories.join(', ') || 'Solar & Power, Electrical, Plumbing, Generator Repair, HVAC, Digital & Creative, Professional Services, Business Services'}

Conversation history:
${historySnippet || 'None'}

Latest Customer Message:
"${message}"

Understand colloquial/Nigerian Pidgin expressions (e.g. "gen no dey start" -> generator repair, "AC no dey cool" -> HVAC/AC repair, "online shop" -> ecommerce web design). NEVER invent listings or prices. Carry forward previous context unless overridden.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      intent: {
        type: Type.STRING,
        description: 'One of: product_search, product_compare, service_discovery, hybrid, clarify',
      },
      domain: {
        type: Type.STRING,
        description: 'One of: products, artisans, repairs, digital_creative, professional_services, business_commercial, general',
      },
      keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
      category: { type: Type.STRING },
      brand: { type: Type.STRING },
      model: { type: Type.STRING },
      budgetMax: { type: Type.NUMBER },
      budgetMin: { type: Type.NUMBER },
      condition: { type: Type.STRING },
      location: { type: Type.STRING },
      requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
      needsClarification: { type: Type.BOOLEAN },
      clarifyingQuestion: { type: Type.STRING },
      followUpQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ['intent', 'domain', 'keywords', 'requirements', 'needsClarification'],
  };

  try {
    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema,
          temperature: 0.1,
        },
      }),
      8000
    );

    const parsed = JSON.parse(response.text || '{}');
    const validIntents = ['product_search', 'product_compare', 'service_discovery', 'hybrid', 'clarify'];
    const validDomains: UniversalDomainCategory[] = [
      'products', 'artisans', 'repairs', 'digital_creative',
      'professional_services', 'business_commercial', 'general',
    ];
    const pureLoc = isPureLocationMessage(message, prevCtx, history);

    return {
      intent: pureLoc && prevCtx?.lastIntent
        ? (prevCtx.lastIntent as ParsedIntent['intent'])
        : validIntents.includes(parsed.intent)
          ? parsed.intent
          : heuristic.intent,
      domain: pureLoc && prevCtx?.domain
        ? prevCtx.domain
        : validDomains.includes(parsed.domain)
          ? parsed.domain
          : heuristic.domain,
      keywords: pureLoc
        ? heuristic.keywords
        : Array.from(
            new Set([
              ...(Array.isArray(parsed.keywords) ? parsed.keywords : []).filter((k) => !/^\d+$/.test(String(k).trim())),
              ...heuristic.keywords,
            ])
          ),
      category: parsed.category || heuristic.category,
      brand: parsed.brand || undefined,
      model: parsed.model || undefined,
      budgetMax: typeof parsed.budgetMax === 'number' && parsed.budgetMax > 0 ? parsed.budgetMax : heuristic.budgetMax,
      budgetMin: typeof parsed.budgetMin === 'number' && parsed.budgetMin > 0 ? parsed.budgetMin : undefined,
      condition: parsed.condition || heuristic.condition,
      location: parsed.location || heuristic.location,
      requirements: pureLoc
        ? heuristic.requirements
        : Array.isArray(parsed.requirements) && parsed.requirements.length > 0
          ? Array.from(new Set([...(prevCtx?.requirements || []), ...parsed.requirements])).slice(0, 8)
          : heuristic.requirements,
      needsClarification: Boolean(parsed.needsClarification),
      clarifyingQuestion: parsed.clarifyingQuestion || undefined,
      followUpQuestions: Array.isArray(parsed.followUpQuestions) ? parsed.followUpQuestions.slice(0, 3) : [],
    };
  } catch (err: any) {
    console.warn('[MatthewCommerceEngine] Gemini intent fallback to heuristic:', err?.message || err);
    return heuristic;
  }
}

function buildComparisonMatrix(
  products: CatalogProduct[],
  parsed: ParsedIntent
): ProductComparisonMatrix | undefined {
  if (products.length < 2) return undefined;
  const targets = products.slice(0, 4);

  const modelKeys = targets.map((p) => `${(p.brand || '').toLowerCase()}::${(p.model || p.name).toLowerCase().trim()}`);
  const uniqueModels = new Set(modelKeys.filter((k) => k !== '::'));
  const hasIdenticalModels = uniqueModels.size < targets.length && uniqueModels.size >= 1;

  const relationshipNote = hasIdenticalModels
    ? 'Some listings compare the same brand/model across different sellers, conditions, or locations, alongside comparable alternatives.'
    : 'These are comparable alternatives across different brands, specifications, and price tiers rather than identical SKUs.';

  const allSpecKeys = Array.from(new Set(targets.flatMap((p) => Object.keys(p.specs || {})))).slice(0, 6);

  const dimensions: ProductComparisonDimension[] = [
    {
      label: 'Price',
      values: targets.map((p) => ({
        productId: p.id,
        value: p.price > 0 ? `${p.currency || '₦'}${p.price.toLocaleString()}` : 'Contact Seller',
      })),
    },
    {
      label: 'Brand / Model',
      values: targets.map((p) => ({
        productId: p.id,
        value: [p.brand, p.model].filter(Boolean).join(' ') || p.name,
      })),
    },
    {
      label: 'Condition',
      values: targets.map((p) => ({ productId: p.id, value: p.condition || 'New' })),
    },
    {
      label: 'Warranty',
      values: targets.map((p) => ({ productId: p.id, value: p.warranty || 'Not specified' })),
    },
    {
      label: 'Availability',
      values: targets.map((p) => ({ productId: p.id, value: p.availability || 'In Stock' })),
    },
    {
      label: 'Seller & Source',
      values: targets.map((p) => ({
        productId: p.id,
        value: `${p.seller_name} (${p.source_marketplace})`,
      })),
    },
    {
      label: 'Location',
      values: targets.map((p) => ({ productId: p.id, value: p.location || 'Nigeria' })),
    },
    ...allSpecKeys.map((specKey) => ({
      label: specKey,
      values: targets.map((p) => ({
        productId: p.id,
        value: p.specs?.[specKey] || '—',
      })),
    })),
  ];

  const priced = targets.filter((p) => p.price > 0).sort((a, b) => a.price - b.price);
  const recommendationSummary =
    priced.length >= 2
      ? `${priced[0].name} offers the lowest listed entry price (${priced[0].currency || '₦'}${priced[0].price.toLocaleString()}) via ${priced[0].seller_name}, while ${priced[priced.length - 1].name} (${priced[priced.length - 1].currency || '₦'}${priced[priced.length - 1].price.toLocaleString()}) may differ in condition, warranty, capacity, or seller verification.${parsed.budgetMax ? ` Filtered toward your ${priced[0].currency || '₦'}${parsed.budgetMax.toLocaleString()} ceiling.` : ''}`
      : 'Review specifications, condition, warranty, and seller verification side by side to choose the option that best fits your requirements.';

  return {
    title: `Side-by-Side Comparison (${targets.length} Products)`,
    products: targets,
    dimensions,
    relationshipNote,
    recommendationSummary,
  };
}

/**
 * PHASE 5 (TEST 11): Strict Commercial Ad Enforcement.
 * - Never violates explicit customer budgetMax (strictly price <= budgetMax).
 * - Never shows location-mismatched sponsored ads when customer explicitly gave a location.
 * - Enforces global controls & min_relevance_score threshold so irrelevant ads never render.
 */
function selectSponsoredAds(
  campaigns: SponsoredCampaign[],
  allProducts: CatalogProduct[],
  parsed: ParsedIntent,
  rawQuery: string,
  organicProductIds: Set<string>
): Array<CatalogProduct & { campaign_id: string; relevanceScore: number }> {
  const controls = getAdControls();
  if (!controls.global_ads_enabled || controls.max_sponsored_per_response <= 0) {
    return [];
  }

  const eligible: Array<{
    product: CatalogProduct;
    campaign: SponsoredCampaign;
    relevanceScore: number;
    inOrganic: boolean;
  }> = [];
  const lowerQ = rawQuery.toLowerCase();
  const requestedLocTokens = extractLocationTokens(parsed.location);

  for (const camp of campaigns) {
    if (camp.status !== 'active') continue;
    const remaining = (camp.budget_total || 0) - (camp.budget_spent || 0);
    if (!controls.allow_over_budget_ads && camp.budget_total > 0 && remaining < (camp.cpc_bid || 0)) {
      continue;
    }

    const prod = allProducts.find(
      (p) =>
        p.id === camp.target_id &&
        p.is_published &&
        p.verification_status !== 'rejected' &&
        p.verification_status !== 'pending' &&
        p.availability !== 'Out of Stock'
    );
    if (!prod) continue;

    // STRICT Budget enforcement (TEST 11): never show over-budget sponsored items
    if (parsed.budgetMax && parsed.budgetMax > 0 && prod.price > parsed.budgetMax) {
      continue;
    }

    // STRICT Location enforcement (TEST 11): if customer requested an explicit location, ad must serve that location or Nationwide
    if (requestedLocTokens.length > 0) {
      const campLocs = (camp.target_locations || []).map((l) => l.toLowerCase());
      const prodLocText = `${prod.location || ''} ${prod.state || ''} ${prod.city || ''}`.toLowerCase();
      const coversNationwide =
        campLocs.some((l) => l === 'all' || l === 'nationwide' || l === 'nigeria') ||
        prodLocText.includes('nationwide');
      const matchesLoc =
        requestedLocTokens.some((tok) => campLocs.some((cl) => cl.includes(tok))) ||
        requestedLocTokens.some((tok) => prodLocText.includes(tok));

      if (!coversNationwide && !matchesLoc) {
        continue;
      }
    }

    // Contextual relevance scoring (0-100)
    let relevance = 0;
    const prodHay = `${prod.name} ${prod.brand || ''} ${prod.model || ''} ${prod.category} ${prod.description}`.toLowerCase();

    for (const kw of Array.from(new Set([...parsed.keywords, ...(camp.keywords || [])]))) {
      const clean = kw?.toLowerCase().trim();
      if (clean && clean.length > 2 && prodHay.includes(clean) && (lowerQ.includes(clean) || parsed.keywords.includes(clean))) {
        relevance += 30;
      }
    }
    if (parsed.category && camp.target_categories.some((c) => c.toLowerCase().includes(parsed.category!.toLowerCase().split('&')[0].trim()))) {
      relevance += 30;
    } else if (parsed.category && prod.category.toLowerCase().includes(parsed.category.toLowerCase().split('&')[0].trim())) {
      relevance += 25;
    }

    if (requestedLocTokens.length > 0) {
      relevance += 15;
    }

    const cappedRelevance = Math.min(100, relevance);
    const minReq = Math.max(controls.min_relevance_threshold, camp.min_relevance_score || 0);
    if (cappedRelevance >= minReq) {
      eligible.push({
        product: prod,
        campaign: camp,
        relevanceScore: cappedRelevance,
        inOrganic: organicProductIds.has(prod.id),
      });
    }
  }

  // Prefer non-organic candidates first so sponsored slots expand discovery;
  // fall back to compliant paid campaigns even if they also appeared organically.
  const nonOrganicEligible = eligible.filter((e) => !e.inOrganic);
  const pool = nonOrganicEligible.length > 0 ? nonOrganicEligible : eligible;

  pool.sort((a, b) => b.relevanceScore - a.relevanceScore || (b.campaign.cpc_bid || 0) - (a.campaign.cpc_bid || 0));
  const selected = pool.slice(0, controls.max_sponsored_per_response);

  for (const item of selected) {
    trackCampaignEvent(item.campaign.id, 'impression', item.product.id);
  }

  return selected.map((item) => ({
    ...item.product,
    campaign_id: item.campaign.id,
    relevanceScore: item.relevanceScore,
  }));
}

async function synthesizeReplyWithGemini(params: {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  parsed: ParsedIntent;
  products: CatalogProduct[];
  sponsoredProducts: Array<CatalogProduct & { campaign_id: string }>;
  services: MatchedServiceCandidate[];
  professionals: MatchedProfessionalCandidate[];
  comparison?: ProductComparisonMatrix;
  totalCatalogCount: number;
  totalServicesCount: number;
  needsLocation?: boolean;
}): Promise<string> {
  const {
    parsed,
    products,
    sponsoredProducts,
    services,
    professionals,
    comparison,
    totalCatalogCount,
    needsLocation,
  } = params;

  const locationAskLine =
    'Could you also share your area and state (or exact street address) so I can prioritize sellers, services, or verified specialists closest to you?';

  const buildDeterministicReply = (): string => {
    if (comparison && comparison.products.length >= 2) {
      return `I compared ${comparison.products.length} listings side by side from the MatthOrg database. ${comparison.relationshipNote} ${comparison.recommendationSummary}${needsLocation ? ` ${locationAskLine}` : ''}`;
    }

    const svcCount = services.length;
    const proCount = professionals.length;
    const prodCount = products.length;

    if (prodCount > 0 && (svcCount > 0 || proCount > 0)) {
      return `I found ${prodCount} matching product listing${prodCount > 1 ? 's' : ''}${svcCount > 0 ? `, ${svcCount} service offering${svcCount > 1 ? 's' : ''}` : ''}${proCount > 0 ? ` and ${proCount} verified provider${proCount > 1 ? 's' : ''}` : ''}${parsed.location ? ` around ${parsed.location}` : ''}${parsed.budgetMax ? ` within your ₦${parsed.budgetMax.toLocaleString()} budget` : ''}. Review the verified options below.${needsLocation ? ` ${locationAskLine}` : ''}`;
    }

    if (prodCount > 0) {
      const hasExternal = products.some((p) => p.listing_type === 'external_marketplace');
      const budgetNote = parsed.budgetMax ? ` matching your ₦${parsed.budgetMax.toLocaleString()} budget` : '';
      const locNote = parsed.location ? ` around ${parsed.location}` : '';
      return `I found ${prodCount} verified product listing${prodCount > 1 ? 's' : ''}${budgetNote}${locNote}. ${hasExternal ? 'External marketplace listings show their source and link directly to the seller via "Visit Seller".' : ''} You can compare 2 or more items, save results, or send an enquiry directly.${needsLocation ? ` ${locationAskLine}` : ''}`;
    }

    if (svcCount > 0 || proCount > 0) {
      const totalProviders = Math.max(svcCount, proCount);
      return `I found ${totalProviders} verified ${parsed.domain === 'repairs' ? 'repair specialist' : parsed.domain === 'digital_creative' ? 'digital/creative specialist' : 'service provider'}${totalProviders > 1 ? 's' : ''}${parsed.location ? ` covering ${parsed.location}` : ''}. You can review pricing, contact them directly on WhatsApp or phone, or request a formal quotation below.${needsLocation ? ` ${locationAskLine}` : ''}`;
    }

    // Zero results — conversational fulfilment offer (never dead-end!)
    if (needsLocation) {
      return `I can help find "${params.message}" for you. Currently there are no exact verified matches in our public directory yet${totalCatalogCount > 0 ? '' : ''}. Share your area and state (or exact address), and let me know if you'd like me to register your request so our Sourcing & Fulfilment team finds and connects the right provider or seller for you.`;
    }

    return `I searched all verified businesses, services, artisans, and products on MatthOrg${parsed.location ? ` in ${parsed.location}` : ''} and we don't currently have a verified match for "${params.message}". Would you like me to register this request for our Fulfilment Team so we can source a verified provider or supplier and contact you? Click "Register Request for Fulfilment" below to confirm.`;
  };

  const ai = getGeminiClient();
  if (!ai) return buildDeterministicReply();

  const productFacts = products.slice(0, 5).map((p) => ({
    name: p.name,
    price: `${p.currency || '₦'}${p.price.toLocaleString()}`,
    seller: p.seller_name,
    source: p.source_marketplace,
    location: p.location,
  }));

  const serviceFacts = services.slice(0, 5).map((s) => ({
    service: s.service.service_name,
    provider: s.service.business_name,
    pricing: s.service.price_min ? `${s.service.currency || '₦'}${s.service.price_min.toLocaleString()}` : s.service.pricing_type,
    location: s.service.city || s.service.state || 'Nigeria',
  }));

  const proFacts = professionals.slice(0, 5).map((c) => ({
    name: c.professional.business_name,
    trade: c.professional.specialization || c.professional.industry,
    location: `${c.professional.city || ''} ${c.professional.state || ''}`.trim(),
  }));

  const prompt = `You are Matthew AI, MatthOrg's universal conversational marketplace assistant.
Write a crisp, friendly 2-3 sentence response using ONLY the verified database facts below.
RULES:
1. NEVER invent business names, telephone numbers, prices, availability, or URLs.
2. Known customer context: budget=${parsed.budgetMax || 'unspecified'}, location=${parsed.location || 'unspecified'}.
3. If productFacts, serviceFacts, and proFacts are all empty, honestly say no verified match exists yet and offer to register the customer's request for MatthOrg Fulfilment sourcing.
4. ${needsLocation ? 'Customer has not given a location yet — politely ask for their area and state.' : 'Be direct and helpful.'}

Customer query: "${params.message}"
Matched products (${products.length}): ${JSON.stringify(productFacts)}
Matched services (${services.length}): ${JSON.stringify(serviceFacts)}
Matched providers (${professionals.length}): ${JSON.stringify(proFacts)}
Sponsored count: ${sponsoredProducts.length}`;

  try {
    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: { temperature: 0.25 },
      }),
      8000
    );
    const text = (response.text || '').trim();
    if (text) return text;
  } catch (err: any) {
    console.warn('[MatthewCommerceEngine] Gemini synthesis fallback:', err?.message || err);
  }

  return buildDeterministicReply();
}

export async function runMatthewDiscovery(req: DiscoverRequest): Promise<DiscoverResponse> {
  const message = (req.message || '').trim();
  const history = req.history || [];
  const allProducts = getCatalogProducts();
  const allServices = getServiceOfferings();
  const categories = Array.from(new Set(allProducts.map((p) => p.category).filter(Boolean)));

  const parsed = await parseIntentWithGemini(message, history, req.accumulatedContext, categories);
  const needsLocation = !parsed.location && parsed.domain !== 'digital_creative';

  let products: CatalogProduct[] = [];
  let comparison: ProductComparisonMatrix | undefined;
  let services: MatchedServiceCandidate[] = [];
  let professionals: MatchedProfessionalCandidate[] = [];

  if (req.compareProductIds && req.compareProductIds.length >= 2) {
    const selectedForCompare = req.compareProductIds
      .map((id) => allProducts.find((p) => p.id === id))
      .filter((p): p is CatalogProduct => Boolean(p));
    if (selectedForCompare.length >= 2) {
      comparison = buildComparisonMatrix(selectedForCompare, parsed);
      parsed.intent = 'product_compare';
    }
  }

  if (!comparison) {
    const searchRes = executeUniversalSearch({
      query: message,
      keywords: parsed.keywords,
      category: parsed.category,
      domain: parsed.domain,
      location: parsed.location,
      budgetMax: parsed.budgetMax,
      condition: parsed.condition,
      extraProfessionals: req.publicProfessionals || [],
      limit: 6,
    });

    if (parsed.intent === 'service_discovery') {
      services = searchRes.services;
      professionals = searchRes.professionals;
      // Include product listings only if no service match or user wants both
      if (services.length === 0 && professionals.length === 0) {
        products = searchRes.products;
      }
    } else if (parsed.intent === 'product_search' || parsed.intent === 'product_compare') {
      products = searchRes.products;
      if (parsed.intent === 'product_compare' && products.length >= 2) {
        comparison = buildComparisonMatrix(products, parsed);
      }
      if (products.length === 0) {
        services = searchRes.services;
        professionals = searchRes.professionals;
      }
    } else {
      // Universal hybrid query: surface both matched products and services/providers!
      products = searchRes.products;
      services = searchRes.services;
      professionals = searchRes.professionals;
    }
  }

  const organicIds = new Set(products.map((p) => p.id));
  const campaigns = getSponsoredCampaigns();
  const sponsoredProducts =
    parsed.intent !== 'service_discovery'
      ? selectSponsoredAds(campaigns, allProducts, parsed, message, organicIds)
      : [];

  if (sponsoredProducts.length > 0) {
    const sponsoredIds = new Set(sponsoredProducts.map((sp) => sp.id));
    products = products.filter((p) => !sponsoredIds.has(p.id));
  }

  const reply = await synthesizeReplyWithGemini({
    message,
    history,
    parsed,
    products,
    sponsoredProducts,
    services,
    professionals,
    comparison,
    totalCatalogCount: allProducts.filter((p) => p.is_published).length,
    totalServicesCount: allServices.filter((s) => s.approval_status === 'Approved').length,
    needsLocation,
  });

  const followUps: string[] = [...(parsed.followUpQuestions || [])];
  if (followUps.length === 0) {
    if (needsLocation) {
      followUps.push('Ikeja, Lagos', 'Lekki Phase 1, Lagos', 'Wuse 2, Abuja');
    }
    if (products.length >= 2 && !comparison) {
      followUps.push('Compare top options side by side');
    }
    if (!parsed.budgetMax && products.length > 0) {
      followUps.push('Filter under ₦500,000');
    }
    if ((services.length > 0 || professionals.length > 0) && !parsed.location) {
      followUps.push('Show providers in Lagos');
    }
  }

  const totalFound =
    products.length +
    sponsoredProducts.length +
    services.length +
    professionals.length +
    (comparison ? comparison.products.length : 0);

  const noResultsAction =
    totalFound === 0
      ? {
          canBroaden: Boolean(parsed.budgetMax || parsed.location || parsed.condition),
          broadenPrompt:
            parsed.keywords.length > 0
              ? `Show all ${parsed.keywords.slice(0, 2).join(' ')} without filters`
              : 'Show all available listings',
          canRequestSourcing: true,
          serviceOrProductNeeded: message,
          location: parsed.location || '',
          category: parsed.category || 'General',
          requestType: parsed.domain,
        }
      : undefined;

  logSearchAnalytics({
    id: `sa_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    query: message,
    intent: parsed.intent,
    category: parsed.category,
    location: parsed.location,
    budgetMax: parsed.budgetMax,
    productResultsCount: products.length,
    professionalResultsCount: professionals.length + services.length,
    sponsoredShownCount: sponsoredProducts.length,
    sessionId: req.sessionId,
    created_at: new Date().toISOString(),
  });

  if (req.sessionId) {
    logConversationTurn({
      sessionId: req.sessionId,
      userMessage: message,
      assistantReply: reply,
      intent: parsed.intent,
      productsCount: products.length,
      professionalsCount: professionals.length + services.length,
      sponsoredCount: sponsoredProducts.length,
    });
  }

  const isGreetingOnly =
    /^(hi|hello|hey|good morning|good afternoon|good evening|thanks|thank you|ok|okay)[!.\s]*$/i.test(message);

  let storedRequest: DiscoverResponse['storedRequest'] = undefined;
  const isCompareCommand =
    Boolean(req.compareProductIds && req.compareProductIds.length >= 2) ||
    message.toLowerCase().startsWith('compare these selected products');

  if (!isGreetingOnly && !isCompareCommand && message.length >= 3) {
    const isRefinement = isPureLocationMessage(message, req.accumulatedContext, history) ||
      /^(filter|show all|under|below|above|compare)\b/i.test(message);

    const priorRequirement =
      req.accumulatedContext?.requirements?.[0] ||
      [...history].reverse().find((h) => h.role === 'user')?.content ||
      message;

    const serviceSummary = isRefinement ? priorRequirement : message;
    const matchedNames = [
      ...services.map((s) => s.business?.business_name || s.service.business_name),
      ...professionals.map((p) => p.professional.business_name),
      ...products.map((p) => p.seller_name),
    ].filter(Boolean);

    try {
      const { request: captured, isNew } = upsertCapturedCustomerRequest({
        service_required: serviceSummary,
        service_category: parsed.category || 'General',
        location: parsed.location || req.accumulatedContext?.location || 'Location pending',
        budget_max: parsed.budgetMax,
        budget_formatted: parsed.budgetMax ? `Up to ₦${parsed.budgetMax.toLocaleString()}` : 'Open / Negotiable',
        details: isRefinement
          ? `Follow-up refinement: "${message}" (Matched ${totalFound} instant result${totalFound === 1 ? '' : 's'})`
          : totalFound === 0
          ? `No instant match found when searched via Matthew AI ("${message}"). Open for verified business sourcing.`
          : `Requested via Matthew AI (${totalFound} instant match${totalFound === 1 ? '' : 'es'} shown).`,
        status: 'Open',
        matched_count: totalFound,
        matched_business_names: Array.from(new Set(matchedNames)).slice(0, 6),
        conversation_session_id: req.sessionId,
        source: 'matthew_ai',
        isFollowUpRefinement: isRefinement,
      });

      if (totalFound === 0) {
        upsertZeroMatchFulfilmentRequest({
          customer_request_id: captured.id,
          request_number: captured.request_number,
          conversation_session_id: req.sessionId,
          request_summary: captured.service_required,
          request_type: parsed.domain,
          category: captured.service_category,
          location: captured.location,
          budget_max: captured.budget_max,
          budget_formatted: captured.budget_formatted,
          details: captured.details,
        });
      }

      storedRequest = {
        id: captured.id,
        request_number: captured.request_number,
        isNew,
        totalFound,
        needsMatch: totalFound === 0,
      };
    } catch (captureErr) {
      console.warn('[MatthewCommerceEngine] Non-blocking request capture warning:', captureErr);
    }
  }

  return {
    success: true,
    reply,
    intent: parsed.intent,
    domain: parsed.domain,
    products,
    sponsoredProducts,
    comparison,
    services,
    professionals,
    followUpQuestions: followUps.slice(0, 3),
    needsLocation,
    extractedContext: {
      budgetMax: parsed.budgetMax,
      location: parsed.location,
      category: parsed.category,
      domain: parsed.domain,
      requirements: parsed.requirements,
      lastKeywords: parsed.keywords,
      lastIntent: parsed.intent,
    },
    noResultsAction,
    storedRequest,
  };
}
