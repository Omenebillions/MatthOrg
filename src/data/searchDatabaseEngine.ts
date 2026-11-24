import {
  MatchedProfessionalCandidate,
  PublicProfessionalProfile,
  DemandAdvertCampaign,
} from '../types';
import { fetchPublicProfessionals, matchProfessionalsForRequest } from '../lib/db';
import { fetchArtisanRecommendations } from './recommendationsData';
import { createDemandCampaign } from './demandCampaignsData';

export interface SearchDatabaseOptions {
  customerName?: string;
  customerPhone?: string;
  customerWhatsapp?: string;
  customerEmail?: string;
  budget?: string;
  timeline?: string;
  requestId?: string;
  requestNumber?: string;
  details?: string;
  autoTriggerDemandAdIfEmpty?: boolean;
}

export interface SearchDatabaseResult {
  candidates: MatchedProfessionalCandidate[];
  totalDatabaseChecked: number;
  isDemandAdTriggered: boolean;
  campaign?: DemandAdvertCampaign;
  searchedService: string;
  searchedLocation: string;
}

/**
 * Searches exclusively actual professionals and vetted artisans in our database.
 * Strictly excludes any demo/mock benchmark data.
 * If no matching pro is found in that location/trade, automatically logs the request
 * and triggers an Admin Demand Advert Campaign.
 */
export async function searchDatabaseArtisansAndProfessionals(
  query: {
    service: string;
    location: string;
    category?: string;
  },
  options: SearchDatabaseOptions = {}
): Promise<SearchDatabaseResult> {
  const sTerm = query.service.trim();
  const lTerm = query.location.trim();

  // 1. Fetch real registered businesses from database
  let rawProfessionals: PublicProfessionalProfile[] = [];
  try {
    rawProfessionals = await fetchPublicProfessionals({ randomize: false });
  } catch (err) {
    console.warn('[Search Engine] Could not fetch public professionals:', err);
  }

  // Strictly filter out any fake or demo records
  const realProfessionals = rawProfessionals.filter(
    (p) => !p.is_demo && !p.tagline?.includes('[Demo Directory Record]')
  );

  // 2. Fetch actual vetted artisan recommendations from database
  let rawArtisans: any[] = [];
  try {
    rawArtisans = await fetchArtisanRecommendations();
  } catch (err) {
    console.warn('[Search Engine] Could not fetch artisan recommendations:', err);
  }

  // Convert recommended artisans into professional profiles
  const artisanProfessionals: PublicProfessionalProfile[] = rawArtisans.map((rec) => ({
    id: `artisan_${rec.id}`,
    business_name: rec.artisan_name,
    industry: rec.trade_category,
    specialization: rec.trade_category,
    tagline: rec.recommendation_note || `Community-recommended ${rec.trade_category} in ${rec.town}, ${rec.state}.`,
    logo: rec.photo_url || '',
    phone: rec.phone,
    whatsapp: rec.whatsapp || rec.phone,
    email: '',
    address: `${rec.town}, ${rec.state}`,
    state: rec.state,
    city: rec.town,
    categories_offered: [rec.trade_category, ...(rec.services_offered || [])],
    locations_served: [rec.town, rec.state, 'Nationwide'],
    is_public: true,
    phone_verified: true,
    email_verified: false,
    identity_verified: true,
    business_verified: true,
    service_verified: true,
    is_demo: false,
    is_artisan: true,
    vouches_count: rec.vouches_count || 1,
    rating: rec.rating || 5,
    work_done: rec.work_done,
    verification_status: 'verified',
    subscription_plan: rec.subscription_plan || (rec.is_paid ? 'pro' : undefined),
    is_paid: Boolean(rec.is_paid || (rec.subscription_plan && rec.subscription_plan !== 'free')),
    created_at: rec.created_at,
  }));

  // Combine unique actual database providers
  const proMap = new Map<string, PublicProfessionalProfile>();
  realProfessionals.forEach((p) => proMap.set(p.id, p));
  artisanProfessionals.forEach((p) => {
    if (!proMap.has(p.id)) {
      proMap.set(p.id, p);
    }
  });

  const allActualDatabaseProviders = Array.from(proMap.values());

  // 3. Match against authoritative rules engine
  const matches = matchProfessionalsForRequest(
    {
      service: sTerm,
      location: lTerm,
      category: query.category,
    },
    allActualDatabaseProviders
  );

  // 4. If matching professionals are found, return them
  if (matches.length > 0) {
    return {
      candidates: matches,
      totalDatabaseChecked: allActualDatabaseProviders.length,
      isDemandAdTriggered: false,
      searchedService: sTerm,
      searchedLocation: lTerm,
    };
  }

  // 5. If NOT available: note the request and trigger Admin Demand Advert Campaign
  let campaign: DemandAdvertCampaign | undefined;

  if (options.autoTriggerDemandAdIfEmpty !== false && (sTerm || lTerm)) {
    try {
      campaign = await createDemandCampaign({
        request_id: options.requestId,
        request_number: options.requestNumber,
        service_required: sTerm || 'Specialist Required',
        location: lTerm || 'Nigeria',
        customer_name: options.customerName || 'Customer',
        customer_phone: options.customerPhone || '',
        customer_whatsapp: options.customerWhatsapp || options.customerPhone || '',
        customer_email: options.customerEmail || '',
        budget_formatted: options.budget || 'Negotiable / Quote requested',
        timeline: options.timeline || 'within_7_days',
        details: options.details || `Customer search on home page for ${sTerm} in ${lTerm}. No verified pro was in database.`,
        campaign_status: 'ad_needed',
      });
    } catch (err) {
      console.warn('[Search Engine] Could not create demand campaign:', err);
    }
  }

  return {
    candidates: [],
    totalDatabaseChecked: allActualDatabaseProviders.length,
    isDemandAdTriggered: true,
    campaign,
    searchedService: sTerm,
    searchedLocation: lTerm,
  };
}

/**
 * Intelligent Recommendation Strategy for Matthew AI matching:
 * - First recommendation: The highest-ranked eligible paid professional (if available).
 * - Second recommendation: The best remaining eligible professional, whether paid or free.
 * - Fair rotation among similarly scored eligible candidates to prevent monopoly.
 * - If only one suitable professional exists, return one. Never fabricate a second.
 */
export function selectTopCustomerRecommendations(
  candidates: MatchedProfessionalCandidate[],
  maxCount: number = 2
): MatchedProfessionalCandidate[] {
  if (!candidates || candidates.length === 0) return [];
  if (candidates.length === 1) return candidates;

  const paidCandidates = candidates.filter((c) => c.isPremium);
  const freeOrRemainingCandidates = candidates.filter((c) => !c.isPremium);

  const selected: MatchedProfessionalCandidate[] = [];
  const selectedIds = new Set<string>();

  // 1. First Recommendation: The highest-ranked eligible paid professional (with fair rotation among top-tier ties)
  if (paidCandidates.length > 0) {
    // Check if there is a tie at the highest match score among paid candidates
    const topPaidScore = paidCandidates[0].matchScore;
    const tiedPaid = paidCandidates.filter((c) => Math.abs(c.matchScore - topPaidScore) <= 5);

    // Apply fair pseudo-random rotation among tied paid professionals
    const chosenPaid = tiedPaid[Math.floor(Math.random() * tiedPaid.length)] || paidCandidates[0];
    selected.push(chosenPaid);
    selectedIds.add(chosenPaid.professional.id);
  } else if (candidates.length > 0) {
    // If no suitable paid candidate exists, recommend the best available verified professional
    selected.push(candidates[0]);
    selectedIds.add(candidates[0].professional.id);
  }

  if (selected.length >= maxCount) return selected;

  // 2. Second Recommendation: The best remaining eligible professional, whether paid or free
  const poolForSecond = candidates.filter((c) => !selectedIds.has(c.professional.id));
  if (poolForSecond.length > 0) {
    // If top candidates in remaining pool have very close scores, rotate fairly among them
    const topRemainingScore = poolForSecond[0].matchScore;
    const tiedSecond = poolForSecond.filter((c) => Math.abs(c.matchScore - topRemainingScore) <= 5);
    const chosenSecond = tiedSecond[Math.floor(Math.random() * tiedSecond.length)] || poolForSecond[0];
    selected.push(chosenSecond);
  }

  return selected;
}
