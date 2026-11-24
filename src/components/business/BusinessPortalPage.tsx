import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  LayoutDashboard,
  Loader2,
  LogIn,
  MapPin,
  Package,
  Phone,
  Plus,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  User,
  UserPlus,
  Gift,
  Copy,
  Check,
} from 'lucide-react';
import { INITIAL_BLOG_POSTS, BlogPost } from '../../data/blogPosts';
import { getManagedArticles } from '../../lib/articlesDb';
import { BrandLogo } from '../common/BrandLogo';
import {
  NIGERIAN_LISTING_STATES,
  getLgasForState,
  normalizeNigerianStateName,
} from '../../data/nigeriaLgas';
import { validateAndNormalizeNigerianPhone } from '../../utils/nigerianPhone';
import {
  searchProfessions,
  POPULAR_PROFESSIONS,
  ProfessionCatalogItem,
} from '../../data/professionCatalog';
import {
  captureReferralFromUrl,
  getPendingReferral,
  savePendingReferral,
  validateReferralCode,
  normalizeReferralCode,
  getShareableReferralUrl,
  ValidatedReferralInfo,
} from '../../lib/referrals';
import type { BusinessProfile } from '../../types';
import type {
  UniversalBusinessListingInput,
  UniversalBusinessListingResult,
} from '../../lib/db';

export const PENDING_BUSINESS_LISTING_STORAGE_KEY = 'matthorg_pending_business_listing_v1';

export interface PendingBusinessListingDraft {
  businessName: string;
  fullName: string;
  profession: string;
  phone: string;
  state: string;
  lga: string;
  townCity: string;
  referralCode?: string;
  savedAt: string;
}

interface BusinessPortalPageProps {
  isAuthenticated?: boolean;
  userEmail?: string;
  userPhone?: string;
  currentBusiness?: BusinessProfile;
  autoSubmittingPending?: boolean;
  externalListingResult?: UniversalBusinessListingResult | null;
  externalListingError?: string | null;
  onNavigateHome: () => void;
  onPromptLogin: () => void;
  onPromptRegister: () => void;
  onEnterWorkspace: () => void;
  onSubmitListing: (input: UniversalBusinessListingInput) => Promise<UniversalBusinessListingResult>;
  onRequestAuthToPublish: (draft: PendingBusinessListingDraft) => void;
  onSelectArticle: (slug: string) => void;
  onOpenAllGuides: () => void;
  onClearExternalResult?: () => void;
}

interface FormErrors {
  fullName?: string;
  profession?: string;
  phone?: string;
  state?: string;
  lga?: string;
  townCity?: string;
}

export const BusinessPortalPage: React.FC<BusinessPortalPageProps> = ({
  isAuthenticated = false,
  userEmail,
  userPhone,
  currentBusiness,
  autoSubmittingPending = false,
  externalListingResult = null,
  externalListingError = null,
  onNavigateHome,
  onPromptLogin,
  onPromptRegister,
  onEnterWorkspace,
  onSubmitListing,
  onRequestAuthToPublish,
  onSelectArticle,
  onOpenAllGuides,
  onClearExternalResult,
}) => {
  const [selectedGuideCategory, setSelectedGuideCategory] = useState<string>('All');

  // Form state — 7 required/optional fields
  const [businessName, setBusinessName] = useState('');
  const [fullName, setFullName] = useState('');
  const [profession, setProfession] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [lga, setLga] = useState('');
  const [townCity, setTownCity] = useState('');

  // Optional Referral Code state (captured automatically from ?ref=... or entered manually)
  const [referralCode, setReferralCode] = useState('');
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [validatedReferral, setValidatedReferral] = useState<ValidatedReferralInfo | null>(null);
  const [copiedOwnReferral, setCopiedOwnReferral] = useState(false);

  // Autocomplete combobox state for Profession / Business Activity
  const [isProfessionMenuOpen, setIsProfessionMenuOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const professionContainerRef = useRef<HTMLDivElement>(null);

  // Submission & validation state
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listingResult, setListingResult] = useState<UniversalBusinessListingResult | null>(null);
  const [hasSavedDraftBanner, setHasSavedDraftBanner] = useState(false);

  // Capture referral code from URL or storage and validate it without exposing PII
  useEffect(() => {
    const captured = captureReferralFromUrl() || getPendingReferral();
    if (captured?.code) {
      setReferralCode(captured.code);
      validateReferralCode(captured.code)
        .then((res) => {
          if (res.valid) {
            setValidatedReferral(res);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Hydrate pending draft if saved (e.g., before auth or after email confirmation reload)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PENDING_BUSINESS_LISTING_STORAGE_KEY);
      if (raw) {
        const parsed: PendingBusinessListingDraft = JSON.parse(raw);
        if (parsed) {
          setBusinessName(parsed.businessName || '');
          setFullName(parsed.fullName || '');
          setProfession(parsed.profession || '');
          setPhone(parsed.phone || '');
          const normState = normalizeNigerianStateName(parsed.state);
          if (normState) setSelectedState(normState);
          setLga(parsed.lga || '');
          setTownCity(parsed.townCity || '');
          if (parsed.referralCode) {
            setReferralCode(parsed.referralCode);
          }
          setHasSavedDraftBanner(true);
        }
      } else if (currentBusiness && currentBusiness.id !== 'biz_mathorg_demo_1') {
        // Pre-populate cleanly if user already has a real business profile and opens /business
        if (currentBusiness.business_name && currentBusiness.business_name !== 'My Business') {
          setBusinessName(currentBusiness.business_name);
        }
        if (currentBusiness.owner_full_name) setFullName(currentBusiness.owner_full_name);
        if (currentBusiness.specialization) setProfession(currentBusiness.specialization);
        if (currentBusiness.phone) setPhone(currentBusiness.phone);
        const normState = normalizeNigerianStateName(currentBusiness.state);
        if (normState) setSelectedState(normState);
        if (currentBusiness.lga) setLga(currentBusiness.lga);
        if (currentBusiness.city) setTownCity(currentBusiness.city);
      }
    } catch {
      // Ignore storage errors
    }
  }, [currentBusiness?.id]);

  // Reflect auto-completed auth continuation result from App.tsx
  useEffect(() => {
    if (externalListingResult) {
      setListingResult(externalListingResult);
      setHasSavedDraftBanner(false);
      setSubmitError(null);
    }
  }, [externalListingResult]);

  useEffect(() => {
    if (externalListingError) {
      setSubmitError(externalListingError);
    }
  }, [externalListingError]);

  // Close profession autocomplete on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        professionContainerRef.current &&
        !professionContainerRef.current.contains(event.target as Node)
      ) {
        setIsProfessionMenuOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableLgas = useMemo(() => getLgasForState(selectedState), [selectedState]);

  const handleStateChange = (newState: string) => {
    setSelectedState(newState);
    const nextLgas = getLgasForState(newState);
    if (!nextLgas.includes(lga)) {
      setLga('');
    }
    setErrors((prev) => ({ ...prev, state: undefined, lga: undefined }));
  };

  const phoneAnalysis = useMemo(() => {
    if (!phone.trim()) return null;
    return validateAndNormalizeNigerianPhone(phone);
  }, [phone]);

  const professionMatches = useMemo<ProfessionCatalogItem[]>(() => {
    if (!profession.trim()) {
      return POPULAR_PROFESSIONS.slice(0, 8);
    }
    return searchProfessions(profession, 8);
  }, [profession]);

  const showCustomProfessionOption = useMemo(() => {
    const trimmed = profession.trim();
    if (trimmed.length < 2) return false;
    return !professionMatches.some((item) => item.label.toLowerCase() === trimmed.toLowerCase());
  }, [profession, professionMatches]);

  const totalDropdownOptions = professionMatches.length + (showCustomProfessionOption ? 1 : 0);

  const selectProfessionOption = (value: string) => {
    setProfession(value);
    setIsProfessionMenuOpen(false);
    setHighlightedIndex(-1);
    setErrors((prev) => ({ ...prev, profession: undefined }));
  };

  const handleProfessionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isProfessionMenuOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsProfessionMenuOpen(true);
      setHighlightedIndex(0);
      return;
    }
    if (!isProfessionMenuOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % Math.max(1, totalDropdownOptions));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev <= 0 ? Math.max(0, totalDropdownOptions - 1) : prev - 1
      );
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      if (highlightedIndex < professionMatches.length) {
        selectProfessionOption(professionMatches[highlightedIndex].label);
      } else if (showCustomProfessionOption) {
        selectProfessionOption(profession.trim());
      }
    } else if (e.key === 'Escape') {
      setIsProfessionMenuOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};
    if (fullName.trim().length < 2) {
      nextErrors.fullName = 'Please enter your full name.';
    }
    if (profession.trim().length < 2) {
      nextErrors.profession = 'Enter or select what you do (e.g. Tailor, Lawyer, Designer).';
    }
    const phoneCheck = validateAndNormalizeNigerianPhone(phone);
    if (!phoneCheck.isValid) {
      nextErrors.phone = phoneCheck.error || 'Enter a valid Nigerian phone number.';
    }
    if (!selectedState) {
      nextErrors.state = 'Select your State or FCT Abuja.';
    }
    if (!lga) {
      nextErrors.lga = 'Select your Local Government Area (LGA).';
    }
    if (townCity.trim().length < 2) {
      nextErrors.townCity = 'Enter your town or city.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const executeSubmission = async (updateExisting = false) => {
    setSubmitError(null);
    if (!validateForm()) return;

    const cleanPhone = validateAndNormalizeNigerianPhone(phone).normalizedE164;
    const cleanRefCode = normalizeReferralCode(referralCode);
    if (cleanRefCode.length >= 4) {
      savePendingReferral(cleanRefCode, showReferralInput ? 'business_form' : 'business_link');
    }

    const draft: PendingBusinessListingDraft = {
      businessName: businessName.trim(),
      fullName: fullName.trim(),
      profession: profession.trim(),
      phone: cleanPhone,
      state: selectedState,
      lga: lga.trim(),
      townCity: townCity.trim(),
      ...(cleanRefCode ? { referralCode: cleanRefCode } : {}),
      savedAt: new Date().toISOString(),
    };

    if (!isAuthenticated) {
      try {
        localStorage.setItem(PENDING_BUSINESS_LISTING_STORAGE_KEY, JSON.stringify(draft));
      } catch {
        // Ignore storage error
      }
      setHasSavedDraftBanner(true);
      onRequestAuthToPublish(draft);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSubmitListing({
        ...draft,
        updateExisting,
      });

      if (result.status === 'auth_required') {
        try {
          localStorage.setItem(PENDING_BUSINESS_LISTING_STORAGE_KEY, JSON.stringify(draft));
        } catch {
          // ignore
        }
        onRequestAuthToPublish(draft);
        return;
      }

      if (result.status === 'duplicate_conflict') {
        setSubmitError(result.message);
        setListingResult(result);
        return;
      }

      if (result.status === 'created' || result.status === 'updated') {
        try {
          localStorage.removeItem(PENDING_BUSINESS_LISTING_STORAGE_KEY);
        } catch {
          // ignore
        }
        setHasSavedDraftBanner(false);
      }

      setListingResult(result);
    } catch (err: any) {
      setSubmitError(err?.message || 'Unable to submit your listing right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSubmission(false);
  };

  const allPosts: BlogPost[] = useMemo(() => {
    const managed: BlogPost[] = getManagedArticles()
      .filter((a) => a.status === 'published')
      .map((a) => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        seoTitle: a.seoTitle || a.title,
        seoDescription: a.seoDescription || a.excerpt,
        excerpt: a.excerpt,
        category: a.category,
        categorySlug: a.category.toLowerCase().replace(/[^\w]/g, '-'),
        featuredImage: a.featured_image,
        featuredImageAlt: a.title,
        author: { name: a.author, role: 'Contributor' },
        readTimeMinutes: Math.max(3, Math.round((a.body || '').split(' ').length / 200)),
        publishedAt: a.published_at || a.created_at,
        updatedAt: a.updated_at,
        status: 'published' as const,
        contentSections: [],
        suggestedAction: {
          serviceCategory: a.category,
          ctaHeadline: `Need a ${a.category} Specialist?`,
          ctaSubtext: 'Find verified professionals on MatthOrg.',
          findProsText: 'Find Professionals',
          postRequestText: 'Post a Request',
        },
      }));

    const combined: BlogPost[] = [...managed];
    INITIAL_BLOG_POSTS.forEach((p) => {
      if (!combined.some((c) => c.slug === p.slug)) {
        combined.push(p);
      }
    });
    return combined;
  }, []);

  const guideCategories = useMemo(
    () => ['All', ...Array.from(new Set(allPosts.map((p) => p.category)))],
    [allPosts]
  );

  const visiblePosts = useMemo(() => {
    if (selectedGuideCategory === 'All') return allPosts;
    return allPosts.filter((p) => p.category === selectedGuideCategory);
  }, [allPosts, selectedGuideCategory]);

  const busy = isSubmitting || autoSubmittingPending;

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0B192C] font-sans flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E9F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onNavigateHome}
              className="flex items-center gap-2 text-[14px] sm:text-[15px] font-semibold text-[#5B6D85] hover:text-[#0B192C] cursor-pointer whitespace-nowrap"
              title="Back to Customer Home"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Customer Home</span>
            </button>
            <div className="h-5 w-px bg-[#E5E9F0] hidden sm:block" />
            <BrandLogo size="md" />
          </div>

          <nav className="hidden md:flex items-center gap-6 text-[15px] font-medium text-[#5B6D85]">
            <a href="#get-listed-form" className="hover:text-[#0B192C] transition-colors whitespace-nowrap">
              Get Listed
            </a>
            <a href="#business-tools" className="hover:text-[#0B192C] transition-colors whitespace-nowrap">
              Tools &amp; Workflow
            </a>
            <a href="#business-guides" className="hover:text-[#0B192C] transition-colors whitespace-nowrap">
              Guides ({allPosts.length})
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={onEnterWorkspace}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[15px] font-semibold transition cursor-pointer whitespace-nowrap"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Open Workspace</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onPromptLogin}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[15px] font-semibold text-[#0B192C] transition cursor-pointer whitespace-nowrap"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={onPromptRegister}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[15px] font-semibold transition cursor-pointer whitespace-nowrap"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Sign Up</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Primary Hero & Universal Listing Collection Funnel */}
      <section id="get-listed-form" className="bg-white border-b border-[#E5E9F0] py-10 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column: Value Proposition & Inclusive Provider Positioning */}
          <div className="lg:col-span-5 space-y-6 lg:pt-2">
            <p className="text-[13px] font-bold uppercase tracking-wider text-[#3D74D9]">
              Open to Every Provider Across Nigeria
            </p>

            <h1 className="type-page-title text-[#0B192C]">
              Get Listed on MatthOrg
            </h1>

            <p className="text-base sm:text-[18px] text-[#475569] leading-relaxed">
              Showcase what you do and get discovered by customers looking for your products or services.
            </p>

            <div className="pt-2 space-y-3 text-[15px] text-[#334155]">
              <p className="font-heading font-bold text-[#0B192C] text-[16px]">
                No registered company or CAC required to get started
              </p>
              <ul className="space-y-2.5 text-[#475569]">
                {[
                  'Artisans, tradespeople, tailors, technicians & skilled craftspeople',
                  'Freelancers, creatives & independent professionals',
                  'Independent product sellers, sole proprietors & growing SMEs',
                  'Indexed directly in Matthew AI search and local Nigeria directories',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-[#E5E9F0] flex flex-wrap items-center gap-4 text-[14px]">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={onEnterWorkspace}
                  className="inline-flex items-center gap-1.5 font-bold text-[#0B192C] hover:text-[#3D74D9] transition cursor-pointer whitespace-nowrap"
                >
                  <span>Go to My Business Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onEnterWorkspace}
                  className="inline-flex items-center gap-1.5 font-bold text-[#3D74D9] hover:underline cursor-pointer whitespace-nowrap"
                >
                  <span>Preview Quotes &amp; Invoicing Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Clean 7-Field Collection Form Card */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl bg-[#FAFBFD] border border-[#E5E9F0] p-5 sm:p-8 shadow-xs">
              {/* Success / Updated Confirmation State */}
              {(listingResult?.status === 'created' || listingResult?.status === 'updated') ? (
                <div className="space-y-6">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="font-heading text-2xl font-extrabold text-[#0B192C] tracking-tight">
                        {listingResult.status === 'updated'
                          ? 'Your MatthOrg Listing Is Updated'
                          : 'You Are Listed on MatthOrg'}
                      </h2>
                      <p className="text-[15px] text-[#475569] mt-1 leading-relaxed">
                        {listingResult.message}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white border border-[#E5E9F0] p-5 space-y-3 text-[15px]">
                    <div className="font-heading text-lg font-bold text-[#0B192C]">
                      {businessName.trim() || fullName.trim()}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[14px] text-[#475569]">
                      <div>
                        <span className="block text-[13px] font-semibold text-[#64748B]">Contact Person</span>
                        <span className="font-semibold text-[#0B192C]">{fullName.trim()}</span>
                      </div>
                      <div>
                        <span className="block text-[13px] font-semibold text-[#64748B]">Profession / Activity</span>
                        <span className="font-semibold text-[#0B192C]">{profession.trim()}</span>
                      </div>
                      <div>
                        <span className="block text-[13px] font-semibold text-[#64748B]">Phone Number</span>
                        <span className="font-semibold text-[#0B192C]">
                          {phoneAnalysis?.isValid ? phoneAnalysis.display : phone}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[13px] font-semibold text-[#64748B]">Location</span>
                        <span className="font-semibold text-[#0B192C]">
                          {townCity.trim()}, {lga}, {selectedState}
                        </span>
                      </div>
                    </div>
                  </div>

                  {listingResult.referralAttribution?.success && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-[14px] text-emerald-900 flex items-center gap-2">
                      <Gift className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>
                        Referral attributed to{' '}
                        <strong>{listingResult.referralAttribution.referrer_name || listingResult.referralAttribution.referral_code}</strong>.
                      </span>
                    </div>
                  )}

                  {listingResult.referralCode && (
                    <div className="rounded-xl bg-[#F4F7FB] border border-[#E5E9F0] p-4 space-y-2.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Gift className="w-4 h-4 text-[#3D74D9]" />
                          <span className="font-heading font-bold text-[15px] text-[#0B192C]">
                            Your Referral Code: <span className="font-mono text-[#3D74D9]">{listingResult.referralCode}</span>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const url = getShareableReferralUrl(listingResult.referralCode);
                            navigator.clipboard?.writeText(url).catch(() => {});
                            setCopiedOwnReferral(true);
                            setTimeout(() => setCopiedOwnReferral(false), 2200);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#CBD5E1] text-[13px] font-bold text-[#0B192C] hover:bg-[#F8FAFC] cursor-pointer whitespace-nowrap"
                        >
                          {copiedOwnReferral ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Invite Link Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Invite Link</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-[13px] text-[#5B6D85]">
                        Invite other artisans, sellers, and service providers to list on MatthOrg using your personal link.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={onEnterWorkspace}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[16px] font-bold transition cursor-pointer whitespace-nowrap"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Open Workspace</span>
                    </button>
                    <button
                      type="button"
                      onClick={onNavigateHome}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#0B192C] text-[16px] font-semibold transition cursor-pointer whitespace-nowrap"
                    >
                      <span>View Marketplace</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setListingResult(null);
                        onClearExternalResult?.();
                      }}
                      className="px-4 py-3.5 rounded-xl text-[15px] font-semibold text-[#5B6D85] hover:text-[#0B192C] cursor-pointer whitespace-nowrap"
                    >
                      Edit Details
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} noValidate className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E5E9F0]">
                    <div>
                      <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-[#0B192C] tracking-tight">
                        Your Listing Details
                      </h2>
                      <p className="text-[14px] text-[#5B6D85] mt-0.5">
                        {isAuthenticated && (userEmail || userPhone)
                          ? `Signed in as ${userEmail || userPhone}`
                          : 'Takes less than 60 seconds to submit.'}
                      </p>
                    </div>
                  </div>

                  {hasSavedDraftBanner && !isAuthenticated && (
                    <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2.5 text-[14px] text-blue-950">
                      <Sparkles className="w-4 h-4 text-[#3D74D9] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">Your details are saved.</span> Sign in or confirm your account to publish your listing immediately.
                      </div>
                    </div>
                  )}

                  {/* Owned Duplicate Prompt */}
                  {listingResult?.status === 'duplicate_owned' && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3 text-[14px] text-amber-950">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold">Existing listing found on your account</div>
                          <p className="mt-0.5 leading-relaxed">{listingResult.message}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => executeSubmission(true)}
                          className="px-4 py-2 rounded-lg bg-[#0B192C] hover:bg-[#1E3E62] text-white font-semibold cursor-pointer whitespace-nowrap disabled:opacity-60"
                        >
                          Update My Existing Listing
                        </button>
                        <button
                          type="button"
                          onClick={() => setListingResult(null)}
                          className="px-3 py-2 rounded-lg border border-amber-300 bg-white text-amber-950 font-semibold cursor-pointer whitespace-nowrap"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {submitError && (
                    <div
                      role="alert"
                      className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-800 text-[14px] leading-relaxed"
                    >
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold">{submitError}</p>
                        {listingResult?.status === 'duplicate_conflict' && !isAuthenticated && (
                          <button
                            type="button"
                            onClick={onPromptLogin}
                            className="font-bold underline text-red-900 cursor-pointer"
                          >
                            Sign in with that account instead
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 1. Business or Brand Name — OPTIONAL */}
                  <div>
                    <label
                      htmlFor="listing-business-name"
                      className="block text-[14px] sm:text-[15px] font-semibold text-[#0B192C] mb-1.5"
                    >
                      Business or Brand Name{' '}
                      <span className="font-normal text-[#64748B]">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-[#8F9FB5] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="listing-business-name"
                        name="business_name"
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Business, brand or trading name (optional)"
                        className="w-full rounded-xl bg-white border border-[#CBD5E1] pl-10 pr-4 py-3 text-[16px] text-[#0B192C] placeholder-[#8F9FB5] focus:border-[#3D74D9] focus:ring-3 focus:ring-[#3D74D9]/15 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  {/* 2. Full Name — REQUIRED */}
                  <div>
                    <label
                      htmlFor="listing-full-name"
                      className="block text-[14px] sm:text-[15px] font-semibold text-[#0B192C] mb-1.5"
                    >
                      Full Name <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#8F9FB5] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="listing-full-name"
                        name="full_name"
                        type="text"
                        required
                        aria-invalid={Boolean(errors.fullName)}
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                        }}
                        placeholder="Enter your full name"
                        className={`w-full rounded-xl bg-white border pl-10 pr-4 py-3 text-[16px] text-[#0B192C] placeholder-[#8F9FB5] focus:border-[#3D74D9] focus:ring-3 focus:ring-[#3D74D9]/15 focus:outline-none transition ${
                          errors.fullName ? 'border-red-400' : 'border-[#CBD5E1]'
                        }`}
                      />
                    </div>
                    {errors.fullName && (
                      <p className="mt-1.5 text-[13px] font-medium text-red-600">{errors.fullName}</p>
                    )}
                  </div>

                  {/* 3. Profession / Business Activity — REQUIRED Searchable Autocomplete */}
                  <div ref={professionContainerRef} className="relative">
                    <label
                      htmlFor="listing-profession"
                      className="block text-[14px] sm:text-[15px] font-semibold text-[#0B192C] mb-1.5"
                    >
                      Profession / Business Activity <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-[#8F9FB5] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="listing-profession"
                        name="profession"
                        type="text"
                        role="combobox"
                        aria-autocomplete="list"
                        aria-expanded={isProfessionMenuOpen}
                        aria-controls="profession-autocomplete-listbox"
                        aria-invalid={Boolean(errors.profession)}
                        required
                        autoComplete="off"
                        value={profession}
                        onFocus={() => setIsProfessionMenuOpen(true)}
                        onKeyDown={handleProfessionKeyDown}
                        onChange={(e) => {
                          setProfession(e.target.value);
                          setIsProfessionMenuOpen(true);
                          setHighlightedIndex(-1);
                          if (errors.profession) setErrors((prev) => ({ ...prev, profession: undefined }));
                        }}
                        placeholder="What do you do? e.g. Tailor, Lawyer, Designer..."
                        className={`w-full rounded-xl bg-white border pl-10 pr-10 py-3 text-[16px] text-[#0B192C] placeholder-[#8F9FB5] focus:border-[#3D74D9] focus:ring-3 focus:ring-[#3D74D9]/15 focus:outline-none transition ${
                          errors.profession ? 'border-red-400' : 'border-[#CBD5E1]'
                        }`}
                      />
                      <Search className="w-4 h-4 text-[#8F9FB5] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {isProfessionMenuOpen && (
                      <div
                        id="profession-autocomplete-listbox"
                        role="listbox"
                        className="absolute z-30 left-0 right-0 mt-1.5 max-h-64 overflow-y-auto rounded-xl bg-white border border-[#CBD5E1] shadow-lg divide-y divide-[#F1F5F9]"
                      >
                        {!profession.trim() && (
                          <div className="px-3.5 py-2 text-[12px] font-bold uppercase tracking-wider text-[#64748B] bg-[#F8FAFC]">
                            Popular professions, trades &amp; activities — or type your own
                          </div>
                        )}

                        {professionMatches.map((item, idx) => (
                          <button
                            key={item.label}
                            type="button"
                            role="option"
                            aria-selected={profession.toLowerCase() === item.label.toLowerCase()}
                            onClick={() => selectProfessionOption(item.label)}
                            className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-3 transition cursor-pointer ${
                              highlightedIndex === idx
                                ? 'bg-[#EFF6FF] text-[#0B192C]'
                                : 'hover:bg-[#F8FAFC] text-[#0B192C]'
                            }`}
                          >
                            <span className="font-medium text-[15px]">{item.label}</span>
                            <span className="text-[12px] text-[#64748B] shrink-0">{item.group}</span>
                          </button>
                        ))}

                        {showCustomProfessionOption && (
                          <button
                            type="button"
                            role="option"
                            aria-selected={false}
                            onClick={() => selectProfessionOption(profession.trim())}
                            className={`w-full text-left px-3.5 py-3 flex items-center gap-2 text-[15px] font-semibold text-[#3D74D9] cursor-pointer ${
                              highlightedIndex === professionMatches.length
                                ? 'bg-[#EFF6FF]'
                                : 'bg-[#F8FAFC] hover:bg-[#EFF6FF]'
                            }`}
                          >
                            <Plus className="w-4 h-4 shrink-0" />
                            <span>Add &ldquo;{profession.trim()}&rdquo; as your profession / activity</span>
                          </button>
                        )}
                      </div>
                    )}

                    {errors.profession && (
                      <p className="mt-1.5 text-[13px] font-medium text-red-600">{errors.profession}</p>
                    )}
                  </div>

                  {/* 4. Phone Number — REQUIRED Nigerian Validation */}
                  <div>
                    <label
                      htmlFor="listing-phone"
                      className="block text-[14px] sm:text-[15px] font-semibold text-[#0B192C] mb-1.5"
                    >
                      Phone Number <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#8F9FB5] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="listing-phone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        required
                        aria-invalid={Boolean(errors.phone)}
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                        }}
                        onBlur={() => {
                          if (phone.trim()) {
                            const check = validateAndNormalizeNigerianPhone(phone);
                            if (check.isValid) {
                              setPhone(check.display);
                              setErrors((prev) => ({ ...prev, phone: undefined }));
                            }
                          }
                        }}
                        placeholder="0803 123 4567 or +234 803 123 4567"
                        className={`w-full rounded-xl bg-white border pl-10 pr-4 py-3 text-[16px] text-[#0B192C] placeholder-[#8F9FB5] focus:border-[#3D74D9] focus:ring-3 focus:ring-[#3D74D9]/15 focus:outline-none transition ${
                          errors.phone ? 'border-red-400' : 'border-[#CBD5E1]'
                        }`}
                      />
                    </div>
                    {errors.phone ? (
                      <p className="mt-1.5 text-[13px] font-medium text-red-600">{errors.phone}</p>
                    ) : phoneAnalysis?.isValid ? (
                      <p className="mt-1.5 text-[13px] text-emerald-700 font-medium">
                        Valid Nigerian number ({phoneAnalysis.display})
                      </p>
                    ) : (
                      <p className="mt-1.5 text-[13px] text-[#64748B]">
                        Customers will reach you on this Nigerian call / WhatsApp number.
                      </p>
                    )}
                  </div>

                  {/* 5. State & 6. LGA — REQUIRED */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="listing-state"
                        className="block text-[14px] sm:text-[15px] font-semibold text-[#0B192C] mb-1.5"
                      >
                        State <span className="text-red-600">*</span>
                      </label>
                      <select
                        id="listing-state"
                        name="state"
                        required
                        aria-invalid={Boolean(errors.state)}
                        value={selectedState}
                        onChange={(e) => handleStateChange(e.target.value)}
                        className={`w-full rounded-xl bg-white border px-3.5 py-3 text-[16px] text-[#0B192C] focus:border-[#3D74D9] focus:ring-3 focus:ring-[#3D74D9]/15 focus:outline-none transition cursor-pointer ${
                          errors.state ? 'border-red-400' : 'border-[#CBD5E1]'
                        }`}
                      >
                        <option value="">Select State / FCT</option>
                        {NIGERIAN_LISTING_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      {errors.state && (
                        <p className="mt-1.5 text-[13px] font-medium text-red-600">{errors.state}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="listing-lga"
                        className="block text-[14px] sm:text-[15px] font-semibold text-[#0B192C] mb-1.5"
                      >
                        LGA <span className="text-red-600">*</span>
                      </label>
                      <select
                        id="listing-lga"
                        name="lga"
                        required
                        disabled={!selectedState}
                        aria-invalid={Boolean(errors.lga)}
                        value={lga}
                        onChange={(e) => {
                          setLga(e.target.value);
                          if (errors.lga) setErrors((prev) => ({ ...prev, lga: undefined }));
                        }}
                        className={`w-full rounded-xl border px-3.5 py-3 text-[16px] focus:border-[#3D74D9] focus:ring-3 focus:ring-[#3D74D9]/15 focus:outline-none transition ${
                          !selectedState
                            ? 'bg-[#F1F5F9] text-[#64748B] cursor-not-allowed'
                            : 'bg-white text-[#0B192C] cursor-pointer'
                        } ${errors.lga ? 'border-red-400' : 'border-[#CBD5E1]'}`}
                      >
                        <option value="">
                          {selectedState ? 'Select LGA' : 'Select State first'}
                        </option>
                        {availableLgas.map((lgaName) => (
                          <option key={lgaName} value={lgaName}>
                            {lgaName}
                          </option>
                        ))}
                      </select>
                      {errors.lga && (
                        <p className="mt-1.5 text-[13px] font-medium text-red-600">{errors.lga}</p>
                      )}
                    </div>
                  </div>

                  {/* 7. Town / City — REQUIRED */}
                  <div>
                    <label
                      htmlFor="listing-town-city"
                      className="block text-[14px] sm:text-[15px] font-semibold text-[#0B192C] mb-1.5"
                    >
                      Town / City <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-[#8F9FB5] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="listing-town-city"
                        name="town_city"
                        type="text"
                        required
                        aria-invalid={Boolean(errors.townCity)}
                        value={townCity}
                        onChange={(e) => {
                          setTownCity(e.target.value);
                          if (errors.townCity) setErrors((prev) => ({ ...prev, townCity: undefined }));
                        }}
                        placeholder="e.g. Ikeja, Lekki, Wuse 2, Sabon Gari..."
                        className={`w-full rounded-xl bg-white border pl-10 pr-4 py-3 text-[16px] text-[#0B192C] placeholder-[#8F9FB5] focus:border-[#3D74D9] focus:ring-3 focus:ring-[#3D74D9]/15 focus:outline-none transition ${
                          errors.townCity ? 'border-red-400' : 'border-[#CBD5E1]'
                        }`}
                      />
                    </div>
                    {errors.townCity && (
                      <p className="mt-1.5 text-[13px] font-medium text-red-600">{errors.townCity}</p>
                    )}
                  </div>

                  {/* Captured / Optional Referral Code */}
                  {referralCode && !showReferralInput ? (
                    <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[13px] text-emerald-900">
                      <div className="flex items-center gap-2 min-w-0">
                        <Gift className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span className="truncate">
                          Referred by{' '}
                          <strong>
                            {validatedReferral?.valid && validatedReferral.referrer_name
                              ? validatedReferral.referrer_name
                              : `partner (${referralCode})`}
                          </strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowReferralInput(true)}
                        className="font-bold text-emerald-800 hover:underline shrink-0 cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  ) : !showReferralInput ? (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowReferralInput(true)}
                        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#5B6D85] hover:text-[#0B192C] cursor-pointer"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>Have a referral code? (Optional)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-white border border-[#CBD5E1] space-y-2">
                      <label
                        htmlFor="listing-referral-code"
                        className="block text-[13px] font-semibold text-[#0B192C]"
                      >
                        Referral Code <span className="font-normal text-[#64748B]">(Optional)</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="listing-referral-code"
                          type="text"
                          value={referralCode}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            setReferralCode(val);
                            setValidatedReferral(null);
                          }}
                          onBlur={() => {
                            const clean = normalizeReferralCode(referralCode);
                            if (clean.length >= 4) {
                              savePendingReferral(clean, 'business_form');
                              validateReferralCode(clean).then(setValidatedReferral).catch(() => {});
                            }
                          }}
                          placeholder="e.g. MO-AB12CD34"
                          className="flex-1 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] px-3 py-2 text-[14px] font-mono text-[#0B192C] focus:border-[#3D74D9] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowReferralInput(false)}
                          className="px-3 py-2 rounded-lg text-[13px] font-semibold text-[#5B6D85] hover:text-[#0B192C] cursor-pointer"
                        >
                          Done
                        </button>
                      </div>
                      {validatedReferral && referralCode.trim() && (
                        <p
                          className={`text-[12px] font-medium ${
                            validatedReferral.valid ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {validatedReferral.valid
                            ? `Verified referrer: ${validatedReferral.referrer_name || validatedReferral.referral_code}`
                            : validatedReferral.error || 'Referral code could not be verified yet.'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-3.5 px-6 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white font-heading font-bold text-[16px] sm:text-[17px] shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer whitespace-nowrap"
                  >
                    {busy ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Publishing your listing...</span>
                      </>
                    ) : (
                      <>
                        <span>Get Listed</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Business Features & Tools */}
      <section id="business-tools" className="py-14 border-b border-[#E5E9F0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="max-w-2xl">
            <h2 className="type-section-title text-[#0B192C]">
              Everything built for your business operations
            </h2>
            <p className="text-[15px] sm:text-base text-[#5B6D85] mt-2 leading-relaxed">
              Manage your catalogue, client enquiries, quotations, invoices, and customer follow-ups in one workspace once listed.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Package,
                title: 'Product & Service Catalogue Sync',
                desc: 'Upload products or showcase services with pricing and location coverage so buyers find you on MatthOrg.',
              },
              {
                icon: Target,
                title: 'Marketplace & Pipeline Leads',
                desc: 'Track incoming buyer enquiries, service requests, and opportunities in one structured pipeline.',
              },
              {
                icon: FileText,
                title: 'AI-Assisted Quotations',
                desc: 'Draft detailed quotations from your prices and export branded PDFs for WhatsApp or email.',
              },
              {
                icon: CreditCard,
                title: 'Invoices & Payment Tracking',
                desc: 'Convert accepted quotes into invoices in one click and monitor paid, partial, and overdue balances.',
              },
              {
                icon: Clock,
                title: 'Automated Follow-Ups',
                desc: 'Stay on top of pending quotes and client check-ins without manual reminders.',
              },
              {
                icon: TrendingUp,
                title: 'AI Growth Engine & Verification',
                desc: 'Discover B2B leads, craft outreach, and verify your profile to build buyer trust.',
              },
            ].map((feat) => (
              <div key={feat.title} className="p-6 rounded-2xl bg-white border border-[#E5E9F0] space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] text-[#0B192C] flex items-center justify-center">
                  <feat.icon className="w-5 h-5" />
                </div>
                <h3 className="type-card-title text-[#0B192C]">{feat.title}</h3>
                <p className="text-[15px] text-[#5B6D85] leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Guides & Posts */}
      <section id="business-guides" className="py-14 bg-white border-b border-[#E5E9F0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wider text-[#3D74D9]">
                <BookOpen className="w-4 h-4" />
                <span>Guides &amp; Industry Posts</span>
              </div>
              <h2 className="type-section-title text-[#0B192C] mt-1.5">
                Business Guides &amp; Project Resources
              </h2>
              <p className="text-[15px] sm:text-base text-[#5B6D85] mt-1">
                Pricing guides, trade best practices, and business growth articles.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenAllGuides}
              className="inline-flex items-center gap-1.5 text-[15px] font-bold text-[#0B192C] hover:underline cursor-pointer whitespace-nowrap"
            >
              <span>View Full Guides Hub</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 text-[14px] font-semibold">
            {guideCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedGuideCategory(cat)}
                className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
                  selectedGuideCategory === cat
                    ? 'bg-[#0B192C] text-white'
                    : 'bg-[#F1F5F9] text-[#475569] hover:text-[#0B192C]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visiblePosts.map((post) => (
              <article
                key={post.id}
                onClick={() => onSelectArticle(post.slug)}
                className="rounded-2xl bg-[#FAFBFD] border border-[#E5E9F0] hover:border-[#0B192C] transition overflow-hidden flex flex-col cursor-pointer group"
              >
                {post.featuredImage && (
                  <div className="h-44 bg-[#E2E8F0] overflow-hidden border-b border-[#E5E9F0]">
                    <img
                      src={post.featuredImage}
                      alt={post.featuredImageAlt || post.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <div className="text-[13px] font-semibold text-[#5B6D85]">
                      {post.category} · {post.readTimeMinutes} min read
                    </div>
                    <h3 className="font-heading text-lg sm:text-xl font-bold text-[#0B192C] group-hover:text-[#3D74D9] transition leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-[15px] text-[#5B6D85] line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[#E5E9F0] flex items-center justify-between text-[14px] font-bold text-[#0B192C]">
                    <span>Read Guide</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0B192C] text-white py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[14px] text-[#94A3B8]">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" inverted />
            <span>© {new Date().getFullYear()} MatthOrg Business Portal</span>
          </div>
          <div className="flex items-center gap-5">
            <button type="button" onClick={onNavigateHome} className="hover:text-white cursor-pointer">
              Customer Home
            </button>
            <button type="button" onClick={onOpenAllGuides} className="hover:text-white cursor-pointer">
              Guides
            </button>
            {isAuthenticated ? (
              <button type="button" onClick={onEnterWorkspace} className="hover:text-white cursor-pointer">
                Workspace
              </button>
            ) : (
              <>
                <button type="button" onClick={onPromptLogin} className="hover:text-white cursor-pointer">
                  Sign In
                </button>
                <button type="button" onClick={onPromptRegister} className="hover:text-white cursor-pointer">
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};
