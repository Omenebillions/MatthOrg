import React, { useState, useEffect } from 'react';
import {
  AppState,
  Quote,
  Invoice,
  Customer,
  Product,
  QuoteTemplate,
  FollowUp,
  BusinessProfile,
  User,
  PlanTier,
  Lead,
  LeadStatus,
  QuoteItem,
} from './types';
import { initialData } from './data/initialData';
import { DashboardView } from './components/DashboardView';
import { QuotesView } from './components/QuotesView';
import { InvoicesView } from './components/InvoicesView';
import { CustomersView } from './components/CustomersView';
import { ProductsView } from './components/ProductsView';
import { TemplatesView } from './components/TemplatesView';
import { FollowUpsView } from './components/FollowUpsView';
import { LeadsView } from './components/LeadsView';
import { FindLeadsView } from './components/FindLeadsView';
import { MatthewView } from './components/MatthewView';
import { MatthewMessageModal, MatthewMessageModalTarget } from './components/MatthewMessageModal';
import { syncFollowUpTasks } from './lib/followups';
import { LeadEditorModal } from './components/LeadEditorModal';
import { ServiceRequestModal } from './components/ServiceRequestModal';
import { QuoteEditorModal } from './components/QuoteEditorModal';
import { InvoiceEditorModal } from './components/InvoiceEditorModal';
import { FollowUpModal } from './components/FollowUpModal';
import { SettingsModal } from './components/SettingsModal';
import { BusinessVerificationModal } from './components/BusinessVerificationModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallButton';
import { LandingPage } from './components/LandingPage';
import { LoginModal } from './components/LoginModal';
import { SplashScreen } from './components/SplashScreen';
import { LegalModal, LegalDocType } from './components/LegalModal';
import { BlogHomePage } from './components/seo/BlogHomePage';
import { BlogArticlePage } from './components/seo/BlogArticlePage';
import { ServiceLocationPage } from './components/seo/ServiceLocationPage';
import { LocationHubPage } from './components/seo/LocationHubPage';
import { ArtisanRecommendationPage } from './components/recommend/ArtisanRecommendationPage';
import { ArtisanOutreachView } from './components/admin/ArtisanOutreachView';
import { AdminConsoleView } from './components/admin/AdminConsoleView';
import {
  BusinessPortalPage,
  PENDING_BUSINESS_LISTING_STORAGE_KEY,
  PendingBusinessListingDraft,
} from './components/business/BusinessPortalPage';
import { saveCatalogProduct, removeCatalogProduct, syncBusinessProfileToDirectory } from './data/commerceData';
import { fetchDemandCampaigns } from './data/demandCampaignsData';
import { claimArtisanRecommendation } from './data/recommendationsData';
import { ProfessionalProfileModal } from './components/homepage/ProfessionalProfileModal';
import { QuickRequestModal } from './components/homepage/QuickRequestModal';
import { BrandLogo } from './components/common/BrandLogo';
import { PublicProfessionalProfile } from './types';
import { registerBusinessToDirectory } from './data/professionalsData';
import { autoCreateServicesFromBusinessProfile } from './data/serviceTaxonomy';
import { supabase, onSupabaseInit, ensureSupabase, authFetch } from './lib/supabase';
import {
  getOrCreateUserBusiness,
  mapBusinessRowToProfile,
  updateBusiness,
  fetchBusinessCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  fetchBusinessProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchBusinessQuotes,
  createQuote,
  updateQuote,
  deleteQuote,
  fetchBusinessInvoices,
  createInvoice,
  convertQuoteToInvoice,
  fetchBusinessLeads,
  createLead,
  updateLead,
  deleteLead,
  hasActiveSubscription,
  claimCustomerRequest,
  isUuid,
  submitUniversalBusinessListing,
  UniversalBusinessListingInput,
  UniversalBusinessListingResult,
} from './lib/db';
import { verifyPaystackPayment } from './lib/paystack';
import { Session } from '@supabase/supabase-js';
import {
  FileText,
  CreditCard,
  Users,
  Package,
  Layers,
  Clock,
  Settings,
  Plus,
  Sparkles,
  Zap,
  Building2,
  Menu,
  X,
  LayoutDashboard,
  LogOut,
  Target,
  Flame,
  ShieldCheck,
  Globe,
  ThumbsUp,
  Megaphone,
  TrendingUp,
  Lock,
} from 'lucide-react';
import { AIGrowthEngineView } from './components/growth/AIGrowthEngineView';
import { generateDocNumber } from './utils/formatters';
import {
  captureReferralFromUrl,
  getPendingReferral,
  attributeReferralForBusiness,
} from './lib/referrals';

const STORAGE_KEY = 'mathorg_state_v1';

export function App() {
  const [session, setSession] = useState<Session | any>(() => {
    try {
      const saved = localStorage.getItem('mathorg_custom_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isServerVerifiedAdmin, setIsServerVerifiedAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
  const [adminRouteRequested, setAdminRouteRequested] = useState<boolean>(() => {
    try {
      const path = window.location.pathname.toLowerCase().replace(/\/$/, '');
      const search = window.location.search;
      return (
        path === '/admin' ||
        search.includes('view=admin') ||
        search.includes('tab=demand-adverts') ||
        search.includes('tab=adverts')
      );
    } catch {
      return false;
    }
  });

  // Application persistent state
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          const fakeIds = new Set(['lead_1', 'lead_2', 'lead_3', 'lead_4', 'lead_5', 'q_1', 'q_2', 'q_3', 'inv_1', 'inv_2', 'cust_1', 'cust_2', 'cust_3']);
          parsed.quotes = Array.isArray(parsed.quotes) ? parsed.quotes.filter((q: any) => !fakeIds.has(q.id)) : [];
          parsed.invoices = Array.isArray(parsed.invoices) ? parsed.invoices.filter((i: any) => !fakeIds.has(i.id)) : [];
          parsed.leads = Array.isArray(parsed.leads) ? parsed.leads.filter((l: any) => !fakeIds.has(l.id)) : [];
          parsed.customers = Array.isArray(parsed.customers) ? parsed.customers.filter((c: any) => !fakeIds.has(c.id)) : [];
          parsed.products = Array.isArray(parsed.products) ? parsed.products : [];
          parsed.templates = Array.isArray(parsed.templates) ? parsed.templates : [];
          parsed.followups = Array.isArray(parsed.followups) ? parsed.followups : [];
          if (parsed.user?.name === 'Engr. David Okon' || parsed.user?.email === 'david@matthorg.com') {
            parsed.user.name = 'Business Professional';
            parsed.user.email = '';
          }
          if (parsed.business?.business_name?.includes('Apex Solar')) {
            parsed.business.business_name = 'My Service Business';
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved state from localStorage:', e);
    }
    return initialData;
  });

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'matthew' | 'growth-engine' | 'leads' | 'marketplace' | 'quotes' | 'invoices' | 'customers' | 'products' | 'templates' | 'followups' | 'recommendations' | 'demand-adverts'
  >(() => {
    try {
      const search = window.location.search;
      if (search.includes('tab=growth-engine') || search.includes('tab=growth')) {
        return 'growth-engine';
      }
    } catch {}
    return 'dashboard';
  });

  // Verify user role & admin permission authoritatively on the server via GET /api/auth/me
  useEffect(() => {
    const token = session?.access_token;
    if (!token) {
      setIsServerVerifiedAdmin(false);
      setIsCheckingAdmin(false);
      return;
    }

    let active = true;
    setIsCheckingAdmin(true);
    authFetch('/api/auth/me')
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((me) => {
        if (!active) return;
        const verifiedAdmin = Boolean(me?.isAdmin === true);
        setIsServerVerifiedAdmin(verifiedAdmin);
        if (verifiedAdmin && adminRouteRequested) {
          setActiveTab('demand-adverts');
        }
      })
      .catch(() => {
        if (active) setIsServerVerifiedAdmin(false);
      })
      .finally(() => {
        if (active) setIsCheckingAdmin(false);
      });

    return () => {
      active = false;
    };
  }, [session?.access_token, adminRouteRequested]);

  // Demand advert campaigns count (verified platform admins only)
  const [demandCampaignsCount, setDemandCampaignsCount] = useState<number>(0);

  useEffect(() => {
    if (!session?.access_token || !isServerVerifiedAdmin) {
      setDemandCampaignsCount(0);
      return;
    }

    let isMounted = true;
    const updateCount = () => {
      fetchDemandCampaigns()
        .then((campaigns) => {
          if (!isMounted) return;
          const unfulfilled = (campaigns || []).filter(
            (c) => c.campaign_status === 'ad_needed' || c.campaign_status === 'ad_launched'
          ).length;
          setDemandCampaignsCount(unfulfilled);
        })
        .catch(() => {});
    };

    updateCount();
    window.addEventListener('matthorg_demand_campaign_created', updateCount);
    window.addEventListener('matthorg_demand_campaigns_updated', updateCount);

    return () => {
      isMounted = false;
      window.removeEventListener('matthorg_demand_campaign_created', updateCount);
      window.removeEventListener('matthorg_demand_campaigns_updated', updateCount);
    };
  }, [session?.access_token, isServerVerifiedAdmin]);

  // Artisan claim prefill state
  const [claimArtisanDetails, setClaimArtisanDetails] = useState<{
    claimId?: string;
    artisanName?: string;
    phone?: string;
    trade?: string;
    state?: string;
    town?: string;
  } | null>(null);

  // Mobile menu drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Matthew Assistant & Message Generation State
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [activeMessageTarget, setActiveMessageTarget] = useState<MatthewMessageModalTarget | null>(null);
  const [matthewInitialPrompt, setMatthewInitialPrompt] = useState<string | undefined>(undefined);

  // Auto-sync follow-up tasks on mount
  useEffect(() => {
    setState((prev) => {
      if (!prev || typeof prev !== 'object' || Array.isArray(prev)) return initialData;
      return {
        ...prev,
        followups: syncFollowUpTasks(prev),
      };
    });
  }, []);

  // Modals state
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [isServiceRequestModalOpen, setIsServiceRequestModalOpen] = useState(false);

  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [activeQuote, setActiveQuote] = useState<Quote | null>(null);
  const [quoteInitialAIOpen, setQuoteInitialAIOpen] = useState(false);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);

  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [activeFollowUpQuote, setActiveFollowUpQuote] = useState<Quote | null>(null);
  const [activeFollowUpItem, setActiveFollowUpItem] = useState<FollowUp | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState<'login' | 'register'>('login');
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<LegalDocType>('privacy');
  const [isGuest, setIsGuest] = useState(() => {
    try {
      const path = window.location.pathname.toLowerCase().replace(/\/$/, '');
      const search = window.location.search;
      if (path === '/app' || search.includes('action=workspace')) {
        return true;
      }
    } catch {}
    return false;
  });

  // SEO Navigation and Dynamic Routing State
  const [currentRoute, setCurrentRoute] = useState<{
    view: 'landing' | 'app' | 'business-portal' | 'blog' | 'blog-article' | 'services' | 'locations' | 'recommend';
    blogSlug?: string;
    serviceSlug?: string;
    locationSlug?: string;
    citySlug?: string;
  }>(() => {
    try {
      const path = window.location.pathname.toLowerCase().replace(/\/$/, '');
      const search = window.location.search;
      if (path === '/admin' || search.includes('view=admin')) {
        if (localStorage.getItem('mathorg_custom_session')) return { view: 'app' };
        return { view: 'landing' };
      }
      if (path === '/recommend' || path === '/recommendations' || search.includes('view=recommend')) {
        return { view: 'recommend' };
      }
      if (path === '/business' || path.startsWith('/business') || search.includes('view=business')) {
        if (search.includes('action=workspace')) return { view: 'app' };
        return { view: 'business-portal' };
      }
      if (path === '/app' || search.includes('action=workspace')) {
        return { view: 'app' };
      }
      if (path.startsWith('/blog/')) {
        const slug = path.replace('/blog/', '').split('/')[0];
        return { view: 'blog-article', blogSlug: slug };
      }
      if (path === '/blog') {
        return { view: 'blog' };
      }
      if (path.startsWith('/services')) {
        const parts = path.replace(/^\/services\/?/, '').split('/').filter(Boolean);
        const sSlug = parts[0] || 'all';
        const lSlug = parts[1];
        const cSlug = parts[2];
        return { view: 'services', serviceSlug: sSlug, locationSlug: lSlug, citySlug: cSlug };
      }
      if (path.startsWith('/locations')) {
        const parts = path.replace(/^\/locations\/?/, '').split('/').filter(Boolean);
        const lSlug = parts[0];
        const sSlug = parts[1];
        if (sSlug) {
          return { view: 'services', serviceSlug: sSlug, locationSlug: lSlug };
        }
        return { view: 'locations', locationSlug: lSlug };
      }
      if (localStorage.getItem('mathorg_custom_session')) return { view: 'app' };
    } catch {
      // ignore
    }
    return { view: 'landing' };
  });

  const [currentView, setCurrentView] = useState<'landing' | 'app'>(() => {
    try {
      const path = window.location.pathname.toLowerCase().replace(/\/$/, '');
      const search = window.location.search;
      if (path === '/app' || search.includes('action=workspace')) {
        return 'app';
      }
    } catch {}
    if (currentRoute.view === 'app') return 'app';
    return 'landing';
  });

  // Modal helpers for SEO Pages
  const [seoSelectedProfessional, setSeoSelectedProfessional] = useState<PublicProfessionalProfile | null>(null);
  const [isSeoQuickRequestOpen, setIsSeoQuickRequestOpen] = useState(false);
  const [seoPrefillService, setSeoPrefillService] = useState('');
  const [seoPrefillLocation, setSeoPrefillLocation] = useState('');

  // Browser popstate listener for back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      try {
        const path = window.location.pathname.toLowerCase().replace(/\/$/, '');
        const search = window.location.search;
        if (path === '/admin' || search.includes('view=admin')) {
          setAdminRouteRequested(true);
          if (session?.access_token) {
            setCurrentRoute({ view: 'app' });
            setCurrentView('app');
          } else {
            setCurrentRoute({ view: 'landing' });
            setCurrentView('landing');
          }
        } else if (path === '/recommend' || path === '/recommendations') {
          setCurrentRoute({ view: 'recommend' });
        } else if (path === '/business' || path.startsWith('/business') || search.includes('view=business')) {
          if (search.includes('action=workspace')) {
            setCurrentRoute({ view: 'app' });
            setCurrentView('app');
          } else {
            setCurrentRoute({ view: 'business-portal' });
          }
        } else if (path === '/app') {
          setIsGuest(true);
          setCurrentRoute({ view: 'app' });
          setCurrentView('app');
        } else if (path.startsWith('/blog/')) {
          const slug = path.replace('/blog/', '').split('/')[0];
          setCurrentRoute({ view: 'blog-article', blogSlug: slug });
        } else if (path === '/blog') {
          setCurrentRoute({ view: 'blog' });
        } else if (path.startsWith('/services')) {
          const parts = path.replace(/^\/services\/?/, '').split('/').filter(Boolean);
          setCurrentRoute({ view: 'services', serviceSlug: parts[0] || 'all', locationSlug: parts[1], citySlug: parts[2] });
        } else if (path.startsWith('/locations')) {
          const parts = path.replace(/^\/locations\/?/, '').split('/').filter(Boolean);
          if (parts[1]) {
            setCurrentRoute({ view: 'services', serviceSlug: parts[1], locationSlug: parts[0] });
          } else {
            setCurrentRoute({ view: 'locations', locationSlug: parts[0] });
          }
        } else {
          setCurrentRoute({ view: 'landing' });
          setCurrentView('landing');
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Paystack payment feedback toast banner
  const [paystackToast, setPaystackToast] = useState<{
    status: 'loading' | 'success' | 'failed';
    message: string;
    details?: string;
  } | null>(null);

  // Auto-verify Paystack transactions if returning from checkout (?reference=... or ?trxref=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paystackRef = params.get('reference') || params.get('trxref');

    if (paystackRef) {
      setPaystackToast({
        status: 'loading',
        message: 'Verifying payment with Paystack...',
      });

      verifyPaystackPayment(paystackRef).then((res) => {
        if (res.success && res.data) {
          const meta = res.data.metadata || {};
          const plan = meta.plan as PlanTier;
          const invoiceId = meta.invoiceId as string;

          if (plan) {
            setState((prev) => ({
              ...prev,
              user: {
                ...prev.user,
                plan: plan,
              },
            }));
            setPaystackToast({
              status: 'success',
              message: `Payment confirmed! Mathorg account upgraded to ${plan.toUpperCase()}.`,
              details: `Reference: ${paystackRef} • Paid: ₦${res.data.amount.toLocaleString()}`,
            });
          } else if (invoiceId) {
            setState((prev) => ({
              ...prev,
              invoices: prev.invoices.map((inv) =>
                inv.id === invoiceId
                  ? {
                      ...inv,
                      status: 'Paid',
                      amount_paid: res.data?.amount || inv.total,
                    }
                  : inv
              ),
            }));
            setPaystackToast({
              status: 'success',
              message: `Payment confirmed! Invoice marked as Paid.`,
              details: `Reference: ${paystackRef} • Paid: ₦${res.data.amount.toLocaleString()}`,
            });
          } else {
            setPaystackToast({
              status: 'success',
              message: 'Paystack payment confirmed successfully.',
              details: `Reference: ${paystackRef} • ₦${res.data.amount.toLocaleString()}`,
            });
          }
        } else {
          setPaystackToast({
            status: 'failed',
            message: 'Payment verification could not be confirmed.',
            details: res.error || 'Please check your transaction reference in Paystack.',
          });
        }

        // Clean query parameters from URL without full page reload
        try {
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        } catch {
          // ignore
        }
      });
    }
  }, []);

  const openLegalModal = (type: LegalDocType) => {
    setLegalModalType(type);
    setIsLegalModalOpen(true);
  };

  // Initialize Supabase Auth with dynamic callback support
  useEffect(() => {
    onSupabaseInit((client) => {
      client.auth.getSession().then(({ data: { session: sbSession } }) => {
        if (sbSession) {
          setSession(sbSession);
          try {
            localStorage.setItem('mathorg_custom_session', JSON.stringify(sbSession));
          } catch {
            // ignore
          }
          setCurrentView('app');
        }
      });

      const {
        data: { subscription },
      } = client.auth.onAuthStateChange((_event, sbSession) => {
        if (sbSession) {
          setSession(sbSession);
          try {
            localStorage.setItem('mathorg_custom_session', JSON.stringify(sbSession));
          } catch {
            // ignore
          }
          setCurrentView('app');
        } else if (!isGuest && !localStorage.getItem('mathorg_custom_session')) {
          setSession(null);
          setCurrentView('landing');
        }
      });
    });

    ensureSupabase();
  }, [isGuest]);

  // Handle PWA / TWA deep link shortcuts, referral capture, and route synchronization
  useEffect(() => {
    const handleUrlRouting = () => {
      captureReferralFromUrl(window.location.search);
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      const view = params.get('view');

      const claim = params.get('claim');
      if (claim) {
        setClaimArtisanDetails({
          claimId: claim,
          artisanName: params.get('artisan') || undefined,
          phone: params.get('phone') || undefined,
          trade: params.get('trade') || undefined,
          state: params.get('state') || undefined,
          town: params.get('town') || undefined,
        });
        setLoginModalMode('register');
        setIsLoginModalOpen(true);
      }

      const cleanPath = path.toLowerCase().replace(/\/$/, '');
      if (cleanPath === '/app' || action === 'workspace') {
        setIsGuest(true);
        setCurrentRoute({ view: 'app' });
        setCurrentView('app');
      } else if (cleanPath === '/business' || cleanPath.startsWith('/business') || view === 'business') {
        setCurrentRoute({ view: 'business-portal' });
      } else if (cleanPath === '' || cleanPath === '/') {
        if (!action && !view && !session && !isGuest && !localStorage.getItem('mathorg_custom_session') && !claim) {
          setCurrentView('landing');
        }
      }

      if (action === 'new-quote') {
        setCurrentView('app');
        handleOpenNewQuote(false);
      } else if (action === 'new-invoice') {
        setCurrentView('app');
        handleOpenNewInvoice();
      }
    };

    handleUrlRouting();
    window.addEventListener('popstate', handleUrlRouting);
    return () => window.removeEventListener('popstate', handleUrlRouting);
  }, [session, isGuest]);

  // Update user state if session changes (supports both phone-only and email sessions)
  useEffect(() => {
    if (session?.user) {
      setState((prev) => ({
        ...prev,
        user: {
          ...prev.user,
          id: session.user.id,
          email: session.user.email || prev.user.email || '',
          phone: session.user.phone || prev.user.phone || prev.business.phone || '',
        },
        business: {
          ...prev.business,
          phone: prev.business.phone || session.user.phone || '',
        },
      }));
    }
  }, [session]);

  // Bootstrap & load real business from Supabase when user is authenticated
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    let isMounted = true;

    const bootstrapBusiness = async () => {
      try {
        const result = await getOrCreateUserBusiness(userId, session.user.email);
        if (result?.business && isMounted) {
          // If user signed up via referral link outside /business auto-submit, attribute referral once
          const pendingRef = getPendingReferral();
          const hasPendingDraft = Boolean(localStorage.getItem(PENDING_BUSINESS_LISTING_STORAGE_KEY));
          if (pendingRef?.code && !hasPendingDraft && !result.business.referred_by_business_id) {
            attributeReferralForBusiness({
              businessId: result.business.id,
              referralCode: pendingRef.code,
              phone: session.user.phone || result.business.phone || undefined,
              source: pendingRef.source,
            }).catch(() => {});
          }

          const mappedProfile = mapBusinessRowToProfile(result.business, state.business);
          
          // Fetch live customers, products, quotes, invoices & leads belonging to this authenticated business from Supabase
          let liveCustomers: Customer[] = [];
          let liveProducts: Product[] = [];
          let liveQuotes: Quote[] = [];
          let liveInvoices: Invoice[] = [];
          let liveLeads: Lead[] = [];
          try {
            const [custData, prodData, quoteData, invData, leadData] = await Promise.all([
              fetchBusinessCustomers(result.business.id),
              fetchBusinessProducts(result.business.id),
              fetchBusinessQuotes(result.business.id),
              fetchBusinessInvoices(result.business.id),
              fetchBusinessLeads(result.business.id),
            ]);
            liveCustomers = custData;
            liveProducts = prodData;
            liveQuotes = quoteData;
            liveInvoices = invData;
            liveLeads = leadData;
          } catch (fetchErr) {
            console.warn('[Mathorg] Notice fetching business records:', fetchErr);
          }

          if (isMounted) {
            setState((prev) => {
              const updatedState = {
                ...prev,
                business: mappedProfile,
                // Replace demo data with live Supabase records if available; otherwise retain current records
                customers: liveCustomers.length > 0 ? liveCustomers : prev.customers,
                products: liveProducts.length > 0 ? liveProducts : prev.products,
                quotes: liveQuotes.length > 0 ? liveQuotes : prev.quotes,
                invoices: liveInvoices.length > 0 ? liveInvoices : prev.invoices,
                leads: liveLeads.length > 0 ? liveLeads : prev.leads,
              };
              return {
                ...updatedState,
                followups: syncFollowUpTasks(updatedState),
              };
            });
          }
        }
      } catch (err: any) {
        console.warn('[Mathorg] Database notice during business bootstrap:', err?.message || err);
      }
    };

    bootstrapBusiness();

    return () => {
      isMounted = false;
    };
  }, [session?.user?.id]);

  const handleLoginSuccess = (userSession: any, registeredBizData?: any) => {
    setSession(userSession);
    const pendingRaw = localStorage.getItem('mathorg_pending_registration_biz');
    let pendingBiz: any = null;
    if (pendingRaw) {
      try {
        pendingBiz = JSON.parse(pendingRaw);
      } catch {}
      localStorage.removeItem('mathorg_pending_registration_biz');
    }
    const bizToApply = registeredBizData || pendingBiz;

    if (userSession?.user?.id || userSession?.user?.email || userSession?.user?.phone) {
      const effectivePhone = bizToApply?.phone || userSession?.user?.phone || '';
      const effectiveEmail = userSession?.user?.email || '';
      setState((prev) => {
        const updatedBusiness = bizToApply
          ? {
              ...prev.business,
              id: bizToApply.id || prev.business.id,
              business_name: bizToApply.business_name || prev.business.business_name,
              owner_full_name: bizToApply.full_name || prev.business.owner_full_name,
              industry: bizToApply.industry || prev.business.industry,
              specialization: bizToApply.specialization || prev.business.specialization,
              phone: effectivePhone || prev.business.phone,
              whatsapp: bizToApply.whatsapp || effectivePhone || prev.business.whatsapp,
              city: bizToApply.city || prev.business.city,
              state: bizToApply.state || prev.business.state,
              email: effectiveEmail || prev.business.email || '',
            }
          : {
              ...prev.business,
              phone: prev.business.phone || effectivePhone,
              email: effectiveEmail || prev.business.email || '',
            };

        if (bizToApply) {
          registerBusinessToDirectory(updatedBusiness);
          autoCreateServicesFromBusinessProfile(updatedBusiness);
        }

        return {
          ...prev,
          user: {
            ...prev.user,
            id: userSession?.user?.id || prev.user.id,
            email: effectiveEmail || prev.user.email || '',
            phone: effectivePhone || prev.user.phone || '',
            name: bizToApply?.full_name || bizToApply?.business_name || prev.user.name,
          },
          business: updatedBusiness,
        };
      });
    }

    if (claimArtisanDetails?.claimId) {
      claimArtisanRecommendation(claimArtisanDetails.claimId).catch(console.error);
      setClaimArtisanDetails(null);
    }

    setCurrentView('app');
    setIsLoginModalOpen(false);
  };

  // Universal /business Listing Funnel State & Auth Continuation
  const [pendingListingDraft, setPendingListingDraft] = useState<PendingBusinessListingDraft | null>(null);
  const [businessPortalResult, setBusinessPortalResult] = useState<UniversalBusinessListingResult | null>(null);
  const [businessPortalError, setBusinessPortalError] = useState<string | null>(null);
  const [isAutoSubmittingPendingListing, setIsAutoSubmittingPendingListing] = useState(false);

  const handleUniversalListingSubmit = async (
    input: UniversalBusinessListingInput
  ): Promise<UniversalBusinessListingResult> => {
    const res = await submitUniversalBusinessListing(input);
    if ((res.status === 'created' || res.status === 'updated') && res.businessProfile) {
      setState((prev) => ({
        ...prev,
        business: {
          ...prev.business,
          ...res.businessProfile,
        },
        user: {
          ...prev.user,
          name: input.fullName.trim() || prev.user.name,
        },
      }));
    }
    return res;
  };

  // Automatically finalize any pending /business listing draft once user has an active session
  useEffect(() => {
    if (currentRoute.view !== 'business-portal' || !session?.user?.id || isAutoSubmittingPendingListing) {
      return;
    }

    let rawDraft: string | null = null;
    try {
      rawDraft = localStorage.getItem(PENDING_BUSINESS_LISTING_STORAGE_KEY);
    } catch {
      rawDraft = null;
    }
    if (!rawDraft) return;

    let parsed: PendingBusinessListingDraft | null = null;
    try {
      parsed = JSON.parse(rawDraft);
    } catch {
      localStorage.removeItem(PENDING_BUSINESS_LISTING_STORAGE_KEY);
      return;
    }
    if (!parsed || !parsed.fullName || !parsed.phone) return;

    let cancelled = false;
    setIsAutoSubmittingPendingListing(true);
    setBusinessPortalError(null);

    handleUniversalListingSubmit({
      businessName: parsed.businessName,
      fullName: parsed.fullName,
      profession: parsed.profession,
      phone: parsed.phone,
      state: parsed.state,
      lga: parsed.lga,
      townCity: parsed.townCity,
      updateExisting: Boolean(parsed.submittedToDirectory),
      claimDirectoryBusinessId: parsed.directoryBusinessId,
      claimToken: parsed.claimToken,
      referralCode: parsed.referralCode,
    })
      .then((result) => {
        if (cancelled) return;
        if (result.status !== 'auth_required') {
          try {
            localStorage.removeItem(PENDING_BUSINESS_LISTING_STORAGE_KEY);
          } catch {
            // ignore
          }
          setPendingListingDraft(null);
        }
        setBusinessPortalResult(result);
        if (result.status === 'duplicate_conflict') {
          setBusinessPortalError(result.message);
        } else if (
          parsed?.openProfileAfterClaim &&
          (result.status === 'created' || result.status === 'updated')
        ) {
          setCurrentRoute({ view: 'app' });
          setCurrentView('app');
          setIsSettingsOpen(true);
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setBusinessPortalError(err?.message || 'Could not finalize your saved listing.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsAutoSubmittingPendingListing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentRoute.view, session?.user?.id]);

  // Listen for direct client inquiries from MatthOrg Homepage
  useEffect(() => {
    const handleNewClientLead = (e: any) => {
      const { lead } = e.detail || {};
      if (lead) {
        setState((prev) => {
          const already = (prev.leads || []).some(
            (l) => l.id === lead.id || l.lead_number === lead.lead_number
          );
          if (already) return prev;
          return {
            ...prev,
            leads: [lead, ...(prev.leads || [])],
          };
        });
      }
    };

    window.addEventListener('matthorg_new_client_lead', handleNewClientLead);
    return () => {
      window.removeEventListener('matthorg_new_client_lead', handleNewClientLead);
    };
  }, []);

  // Merge any local direct client inquiries for the active business
  useEffect(() => {
    if (!state.business?.id) return;
    try {
      const storageKey = `matthorg_leads_${state.business.id}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const storedLeads: Lead[] = JSON.parse(raw);
        if (storedLeads && storedLeads.length > 0) {
          setState((prev) => {
            const currentIds = new Set((prev.leads || []).map((l) => l.id));
            const newToMerge = storedLeads.filter((l) => !currentIds.has(l.id));
            if (newToMerge.length === 0) return prev;
            return {
              ...prev,
              leads: [...newToMerge, ...(prev.leads || [])],
            };
          });
        }
      }
    } catch {
      // ignore
    }
  }, [state.business?.id]);

  const handleLogout = async () => {
    setIsGuest(false);
    setIsServerVerifiedAdmin(false);
    setAdminRouteRequested(false);
    try {
      localStorage.removeItem('mathorg_custom_session');
    } catch {
      // ignore
    }
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    const isBizPath = window.location.pathname.toLowerCase().startsWith('/business');
    setCurrentRoute({ view: isBizPath ? 'business-portal' : 'landing' });
    setCurrentView('landing');
  };

  const handleEnterAppClick = () => {
    if (session || isGuest) {
      setCurrentView('app');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  // Sync state to localStorage on every update
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
  }, [state]);

  // Quote Handlers
  const handleOpenNewQuote = (withAI = false) => {
    setActiveQuote(null);
    setQuoteInitialAIOpen(withAI);
    setIsQuoteModalOpen(true);
  };

  const handleOpenQuote = (quote: Quote) => {
    setActiveQuote(quote);
    setQuoteInitialAIOpen(false);
    setIsQuoteModalOpen(true);
  };

  const handleSaveQuote = async (savedQuote: Quote) => {
    const businessId = state.business?.id;
    const isAuthenticated = !!(session?.user?.id && businessId);

    if (isAuthenticated) {
      try {
        const isExistingDbQuote = isUuid(savedQuote.id) && state.quotes.some((q) => q.id === savedQuote.id);

        let persistedQuote: Quote | null = null;
        if (isExistingDbQuote) {
          persistedQuote = await updateQuote(savedQuote.id, savedQuote);
        } else {
          persistedQuote = await createQuote(businessId, savedQuote);
        }

        if (persistedQuote) {
          const finalQuote = persistedQuote;
          setState((prev) => {
            const exists = prev.quotes.some((q) => q.id === finalQuote.id || q.id === savedQuote.id);
            const updatedQuotes = exists
              ? prev.quotes.map((q) => (q.id === finalQuote.id || q.id === savedQuote.id ? finalQuote : q))
              : [finalQuote, ...prev.quotes];
            return { ...prev, quotes: updatedQuotes };
          });
          setActiveQuote(finalQuote);
        }
      } catch (err: any) {
        console.error('[Mathorg] Error persisting quote to database:', err?.message || err);
        alert(`Failed to save quote: ${err?.message || 'Database permission error'}`);
        throw err;
      }
    } else {
      // Local/demo fallback
      setState((prev) => {
        const exists = prev.quotes.some((q) => q.id === savedQuote.id);
        const updatedQuotes = exists
          ? prev.quotes.map((q) => (q.id === savedQuote.id ? savedQuote : q))
          : [savedQuote, ...prev.quotes];
        return { ...prev, quotes: updatedQuotes };
      });
    }
  };

  const handleDeleteQuote = async (id: string) => {
    const businessId = state.business?.id;
    const isAuthenticated = !!(session?.user?.id && businessId);

    if (isAuthenticated && isUuid(id) && !id.startsWith('q_')) {
      try {
        const success = await deleteQuote(id);
        if (success) {
          setState((prev) => ({
            ...prev,
            quotes: prev.quotes.filter((q) => q.id !== id),
            followups: prev.followups.filter((f) => f.quote_id !== id),
          }));
        }
      } catch (err: any) {
        console.error('[Mathorg] Error deleting quote from database:', err?.message || err);
        alert(`Failed to delete quote: ${err?.message || 'Database error'}`);
      }
    } else {
      // Local removal
      setState((prev) => ({
        ...prev,
        quotes: prev.quotes.filter((q) => q.id !== id),
        followups: prev.followups.filter((f) => f.quote_id !== id),
      }));
    }
  };

  const handleUpdateQuoteStatus = async (quoteId: string, status: Quote['status']) => {
    const businessId = state.business?.id;
    const isAuthenticated = !!(session?.user?.id && businessId);

    if (isAuthenticated && isUuid(quoteId) && !quoteId.startsWith('q_')) {
      try {
        await updateQuote(quoteId, { status });
        setState((prev) => ({
          ...prev,
          quotes: prev.quotes.map((q) => (q.id === quoteId ? { ...q, status } : q)),
        }));
      } catch (err: any) {
        console.error('[Mathorg] Error updating quote status in database:', err?.message || err);
        alert(`Failed to update quote status: ${err?.message || 'Database error'}`);
      }
    } else {
      // Local update
      setState((prev) => ({
        ...prev,
        quotes: prev.quotes.map((q) => (q.id === quoteId ? { ...q, status } : q)),
      }));
    }
  };

  // Convert Quote -> Invoice
  const handleConvertToInvoice = async (quote: Quote) => {
    if (session?.user && isUuid(state.business.id) && isUuid(quote.id)) {
      try {
        const { invoice: liveInvoice, quote: liveQuote } = await convertQuoteToInvoice(state.business.id, quote.id);
        setState((prev) => ({
          ...prev,
          invoices: [liveInvoice, ...prev.invoices.filter((inv) => inv.id !== liveInvoice.id)],
          quotes: prev.quotes.map((q) =>
            q.id === quote.id ? liveQuote : q
          ),
        }));
        setActiveInvoice(liveInvoice);
        setIsInvoiceModalOpen(true);
        return;
      } catch (err: any) {
        console.error('[Mathorg] Database error converting quote to invoice:', err);
        alert(`Failed to convert quote to invoice: ${err?.message || 'Database error'}`);
        return;
      }
    }

    const newInvoice: Invoice = {
      id: 'inv_' + Date.now(),
      invoice_number: generateDocNumber('MAT-INV', state.invoices.length),
      quote_id: quote.id,
      customer_id: quote.customer_id,
      customer_name: quote.customer_name,
      customer_phone: quote.customer_phone,
      customer_whatsapp: quote.customer_whatsapp,
      customer_email: quote.customer_email,
      customer_address: quote.customer_address,
      status: 'Unpaid',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: quote.expiry_date,
      items: quote.items.map((it) => ({
        id: 'inv_it_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        product_id: it.product_id,
        name: it.name,
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unit_price,
        unit: it.unit,
        total: it.total,
      })),
      subtotal: quote.subtotal,
      discount_type: quote.discount_type,
      discount_val: quote.discount_val,
      discount_amount: quote.discount_amount,
      tax_rate: quote.tax_rate,
      tax_amount: quote.tax_amount,
      total: quote.total,
      amount_paid: 0,
      notes: quote.notes ? `Converted from Quote #${quote.quote_number}.\n${quote.notes}` : `Converted from Quote #${quote.quote_number}`,
      payment_details: `Bank: ${state.business.payment_details.bank_name} | Account Name: ${state.business.payment_details.account_name} | Account No: ${state.business.payment_details.account_number}`,
      created_at: new Date().toISOString(),
    };

    // Update quote with converted invoice id
    setState((prev) => ({
      ...prev,
      invoices: [newInvoice, ...prev.invoices],
      quotes: prev.quotes.map((q) =>
        q.id === quote.id ? { ...q, converted_invoice_id: newInvoice.id, status: 'Accepted' } : q
      ),
    }));

    setActiveInvoice(newInvoice);
    setIsInvoiceModalOpen(true);
  };

  // Invoice Handlers
  const handleOpenNewInvoice = () => {
    setActiveInvoice(null);
    setIsInvoiceModalOpen(true);
  };

  const handleOpenInvoice = (invoice: Invoice) => {
    setActiveInvoice(invoice);
    setIsInvoiceModalOpen(true);
  };

  const handleSaveInvoice = async (savedInvoice: Invoice) => {
    if (session?.user && isUuid(state.business.id) && !isUuid(savedInvoice.id)) {
      try {
        const liveInvoice = await createInvoice(state.business.id, savedInvoice);
        setState((prev) => ({
          ...prev,
          invoices: [liveInvoice, ...prev.invoices.filter((i) => i.id !== savedInvoice.id)],
        }));
        return;
      } catch (err: any) {
        console.error('[Mathorg] Database error creating invoice:', err);
        alert(`Failed to save invoice: ${err?.message || 'Database error'}`);
        return;
      }
    }

    setState((prev) => {
      const exists = prev.invoices.some((i) => i.id === savedInvoice.id);
      const updatedInvoices = exists
        ? prev.invoices.map((i) => (i.id === savedInvoice.id ? savedInvoice : i))
        : [savedInvoice, ...prev.invoices];
      return { ...prev, invoices: updatedInvoices };
    });
  };

  const handleDeleteInvoice = (id: string) => {
    setState((prev) => ({
      ...prev,
      invoices: prev.invoices.filter((i) => i.id !== id),
    }));
  };

  const handleMarkPaid = (invoiceId: string) => {
    setState((prev) => ({
      ...prev,
      invoices: prev.invoices.map((inv) => {
        if (inv.id === invoiceId) {
          return { ...inv, status: 'Paid', amount_paid: inv.total };
        }
        return inv;
      }),
    }));
  };

  // Follow-Up Handlers
  const handleOpenFollowUpModal = (quote?: Quote | null, fu?: FollowUp | null) => {
    setActiveFollowUpQuote(quote || null);
    setActiveFollowUpItem(fu || null);
    setIsFollowUpModalOpen(true);
  };

  const handleSaveFollowUp = (savedFu: FollowUp) => {
    setState((prev) => {
      const exists = prev.followups.some((f) => f.id === savedFu.id);
      const updated = exists
        ? prev.followups.map((f) => (f.id === savedFu.id ? savedFu : f))
        : [savedFu, ...prev.followups];

      // Also link follow-up id to quote if quote exists
      const updatedQuotes = prev.quotes.map((q) =>
        q.id === savedFu.quote_id ? { ...q, follow_up_id: savedFu.id } : q
      );

      return { ...prev, followups: updated, quotes: updatedQuotes };
    });
  };

  const handleUpdateFollowUpStatus = (id: string, status: FollowUp['status']) => {
    setState((prev) => ({
      ...prev,
      followups: prev.followups.map((f) => (f.id === id ? { ...f, status } : f)),
    }));
  };

  const handleDeleteFollowUp = (id: string) => {
    setState((prev) => ({
      ...prev,
      followups: prev.followups.filter((f) => f.id !== id),
    }));
  };

  // Customer Handlers
  const handleSaveCustomer = async (customer: Customer) => {
    // Determine active authenticated business
    const activeBizId = state.business.id;
    const exists = state.customers.some((c) => c.id === customer.id);

    // If an authenticated business is loaded and has a valid ID, persist to Supabase
    if (activeBizId && session?.user) {
      try {
        if (exists) {
          // Update existing customer in Supabase
          const updated = await updateCustomer(customer.id, customer);
          if (updated) {
            setState((prev) => ({
              ...prev,
              customers: prev.customers.map((c) => (c.id === updated.id ? updated : c)),
            }));
          }
        } else {
          // Create new customer in Supabase under active business_id
          const created = await createCustomer(activeBizId, customer);
          if (created) {
            setState((prev) => ({
              ...prev,
              customers: [created, ...prev.customers.filter((c) => c.id !== customer.id)],
            }));
          }
        }
      } catch (err: any) {
        console.error('[Mathorg] Error persisting customer to database:', err?.message || err);
        // Do not silently pretend local success if database fails
        alert(`Failed to save customer to database: ${err?.message || 'Permission denied or network error'}`);
      }
    } else {
      // Local/offline state fallback
      setState((prev) => {
        const updated = exists
          ? prev.customers.map((c) => (c.id === customer.id ? customer : c))
          : [customer, ...prev.customers];
        return { ...prev, customers: updated };
      });
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    // If authenticated business exists, delete from Supabase first
    if (session?.user && id && !id.startsWith('cust_demo')) {
      try {
        const success = await deleteCustomer(id);
        if (success) {
          setState((prev) => ({
            ...prev,
            customers: prev.customers.filter((c) => c.id !== id),
          }));
        }
      } catch (err: any) {
        console.error('[Mathorg] Error deleting customer from database:', err?.message || err);
        alert(`Failed to delete customer from database: ${err?.message || 'Permission denied or network error'}`);
      }
    } else {
      // Local removal
      setState((prev) => ({
        ...prev,
        customers: prev.customers.filter((c) => c.id !== id),
      }));
    }
  };

  const handleNewQuoteForCustomer = (customer: Customer) => {
    setActiveQuote({
      id: 'quote_' + Date.now(),
      quote_number: generateDocNumber('MAT-Q', state.quotes.length),
      customer_id: customer.id,
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_whatsapp: customer.whatsapp || customer.phone,
      customer_email: customer.email,
      customer_address: customer.address,
      status: 'Draft',
      issue_date: new Date().toISOString().split('T')[0],
      expiry_date: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d.toISOString().split('T')[0];
      })(),
      items: [
        {
          id: 'item_' + Date.now(),
          name: '',
          description: '',
          quantity: 1,
          unit_price: 0,
          unit: 'unit',
          total: 0,
        },
      ],
      subtotal: 0,
      discount_type: 'percent',
      discount_val: 0,
      discount_amount: 0,
      tax_rate: state.business.tax_rate,
      tax_amount: 0,
      total: 0,
      notes: '',
      terms: state.business.terms,
      created_at: new Date().toISOString(),
    });
    setQuoteInitialAIOpen(false);
    setIsQuoteModalOpen(true);
  };

  // Product Handlers (Synced with both Supabase and Unified Matthew AI Commerce Catalog)
  const syncProductToUnifiedCatalog = (savedProd: Product, biz: BusinessProfile) => {
    saveCatalogProduct({
      id: savedProd.id,
      listing_type: 'business_owned',
      business_id: biz.id,
      name: savedProd.name,
      brand: savedProd.brand,
      model: savedProd.model,
      category: savedProd.category || 'General',
      description: savedProd.description || '',
      specs: savedProd.specs || {},
      variations: savedProd.variations || [],
      price: Number(savedProd.default_price) || 0,
      currency: biz.currency || '₦',
      unit: savedProd.unit || 'unit',
      condition: savedProd.condition || 'New',
      availability: savedProd.availability || 'In Stock',
      stock_quantity: savedProd.stock_quantity,
      warranty: savedProd.warranty,
      location: savedProd.location || (biz.city ? `${biz.city}, ${biz.state || ''}`.replace(/,\s*$/, '') : biz.state || 'Nigeria'),
      state: biz.state,
      city: biz.city,
      image: savedProd.image,
      seller_name: biz.business_name || 'Verified Seller',
      seller_phone: biz.phone,
      seller_whatsapp: biz.whatsapp || biz.phone,
      seller_verified: Boolean(biz.business_verified || biz.phone_verified || biz.verification_status === 'verified'),
      source_marketplace: 'MatthOrg Verified Seller',
      verification_status: savedProd.approval_status === 'pending' ? 'pending' : 'approved',
      is_published: savedProd.is_published !== false,
      sku: savedProd.sku,
    }).catch(() => {});
  };

  const handleSaveProduct = async (product: Product) => {
    const activeBizId = state.business.id;
    const exists = state.products.some((p) => p.id === product.id);

    if (activeBizId && isUuid(activeBizId) && session?.user) {
      try {
        if (exists && isUuid(product.id)) {
          const updated = await updateProduct(product.id, product);
          const merged: Product = updated ? { ...product, ...updated } : product;
          setState((prev) => ({
            ...prev,
            products: prev.products.map((p) => (p.id === merged.id ? merged : p)),
          }));
          syncProductToUnifiedCatalog(merged, state.business);
        } else {
          const created = await createProduct(activeBizId, product);
          const merged: Product = created ? { ...product, ...created } : product;
          setState((prev) => ({
            ...prev,
            products: [merged, ...prev.products.filter((p) => p.id !== product.id)],
          }));
          if (created?.id && created.id !== product.id) {
            removeCatalogProduct(product.id).catch(() => {});
          }
          syncProductToUnifiedCatalog(merged, state.business);
        }
        setPaystackToast({
          status: 'success',
          message: `Saved "${product.name}" to your product catalogue.`,
        });
      } catch (err: any) {
        console.error('[Mathorg] Error persisting product to database:', err?.message || err);
        setPaystackToast({
          status: 'failed',
          message: 'Failed to save product to database.',
          details: err?.message || 'Permission denied or network error',
        });
      }
    } else {
      setState((prev) => {
        const updated = exists
          ? prev.products.map((p) => (p.id === product.id ? product : p))
          : [product, ...prev.products];
        return { ...prev, products: updated };
      });
      syncProductToUnifiedCatalog(product, state.business);
      setPaystackToast({
        status: 'success',
        message: `Saved "${product.name}" to your product catalogue.`,
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      if (session?.user && isUuid(id)) {
        await deleteProduct(id);
      }
      setState((prev) => ({
        ...prev,
        products: prev.products.filter((p) => p.id !== id),
      }));
      await removeCatalogProduct(id).catch(() => false);
      setPaystackToast({
        status: 'success',
        message: 'Product removed from your catalogue and discovery directory.',
      });
    } catch (err: any) {
      console.error('[Mathorg] Error deleting product from database:', err?.message || err);
      setPaystackToast({
        status: 'failed',
        message: 'Failed to delete product from database.',
        details: err?.message || 'Permission denied or network error',
      });
    }
  };

  // Template Handlers
  const handleSaveTemplate = (template: QuoteTemplate) => {
    setState((prev) => {
      const exists = prev.templates.some((t) => t.id === template.id);
      const updated = exists
        ? prev.templates.map((t) => (t.id === template.id ? template : t))
        : [template, ...prev.templates];
      return { ...prev, templates: updated };
    });
  };

  const handleDeleteTemplate = (id: string) => {
    setState((prev) => ({
      ...prev,
      templates: prev.templates.filter((t) => t.id !== id),
    }));
  };

  const handleUseTemplateInQuote = (template: QuoteTemplate) => {
    const quoteItems = template.items.map((it, idx) => ({
      id: 'item_' + Date.now() + '_' + idx,
      product_id: it.product_id,
      name: it.name,
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unit_price,
      unit: it.unit || 'unit',
      total: it.quantity * it.unit_price,
      isCatalogueMatch: true,
    }));

    const sub = quoteItems.reduce((acc, it) => acc + it.total, 0);
    const tax = (sub * state.business.tax_rate) / 100;

    setActiveQuote({
      id: 'quote_' + Date.now(),
      quote_number: generateDocNumber('MAT-Q', state.quotes.length),
      customer_id: '',
      customer_name: '',
      customer_phone: '',
      customer_whatsapp: '',
      customer_email: '',
      customer_address: '',
      status: 'Draft',
      issue_date: new Date().toISOString().split('T')[0],
      expiry_date: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d.toISOString().split('T')[0];
      })(),
      items: quoteItems,
      subtotal: sub,
      discount_type: 'percent',
      discount_val: 0,
      discount_amount: 0,
      tax_rate: state.business.tax_rate,
      tax_amount: tax,
      total: sub + tax,
      notes: template.description ? `Package: ${template.name} - ${template.description}` : '',
      terms: state.business.terms,
      created_at: new Date().toISOString(),
    });
    setQuoteInitialAIOpen(false);
    setIsQuoteModalOpen(true);
  };

  // Lead & Marketplace Handlers
  const handleOpenNewLead = () => {
    setActiveLead(null);
    setIsLeadModalOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setActiveLead(lead);
    setIsLeadModalOpen(true);
  };

  const handleSaveLead = async (lead: Lead) => {
    if (session?.user && isUuid(state.business.id)) {
      try {
        if (isUuid(lead.id)) {
          const updated = await updateLead(lead.id, lead);
          if (updated) {
            setState((prev) => ({
              ...prev,
              leads: (prev.leads || []).map((l) => (l.id === updated.id ? updated : l)),
            }));
          }
        } else {
          const created = await createLead(state.business.id, lead);
          if (created) {
            setState((prev) => ({
              ...prev,
              leads: [created, ...(prev.leads || []).filter((l) => l.id !== lead.id)],
            }));
          }
        }
      } catch (err: any) {
        console.warn('[Mathorg] Notice saving lead to database:', err?.message || err);
      }
    } else {
      setState((prev) => {
        const currentLeads = prev.leads || [];
        const exists = currentLeads.some((l) => l.id === lead.id);
        const updated = exists
          ? currentLeads.map((l) => (l.id === lead.id ? lead : l))
          : [lead, ...currentLeads];
        return { ...prev, leads: updated };
      });
    }

    setPaystackToast({
      status: 'success',
      message: `Lead "${lead.customer_name}" added to pipeline!`,
      details: `${lead.lead_number} • Stage: ${lead.status} • Value: ${lead.budget_formatted || 'Open'}`,
    });
  };

  const handleDeleteLead = async (leadId: string) => {
    if (session?.user && isUuid(leadId)) {
      try {
        await deleteLead(leadId);
      } catch (err: any) {
        console.warn('[Mathorg] Notice deleting lead from database:', err?.message || err);
      }
    }
    setState((prev) => ({
      ...prev,
      leads: (prev.leads || []).filter((l) => l.id !== leadId),
    }));
  };

  const handleUpdateLeadStatus = async (leadId: string, status: LeadStatus) => {
    if (session?.user && isUuid(leadId)) {
      try {
        await updateLead(leadId, {
          status,
          won_at: status === 'Won' ? new Date().toISOString() : undefined,
          lost_at: status === 'Lost' ? new Date().toISOString() : undefined,
        });
      } catch (err: any) {
        console.warn('[Mathorg] Notice updating lead status in database:', err?.message || err);
      }
    }

    setState((prev) => ({
      ...prev,
      leads: (prev.leads || []).map((l) =>
        l.id === leadId
          ? {
              ...l,
              status,
              updated_at: new Date().toISOString(),
              won_at: status === 'Won' ? new Date().toISOString() : l.won_at,
              lost_at: status === 'Lost' ? new Date().toISOString() : l.lost_at,
            }
          : l
      ),
    }));
  };

  const handleUnlockLead = async (lead: Lead) => {
    // Authoritative subscription verification (tier + active status + expiry)
    const isPaid = hasActiveSubscription(
      state.business.id,
      state.user.plan,
      state.business.subscription_status,
      state.business.subscription_expires_at
    );
    if (!isPaid) {
      setIsSubscriptionOpen(true);
      return;
    }

    // Atomic claim via database RPC if this lead originates from a customer request
    if (session?.user && isUuid(state.business.id) && lead.customer_request_id && isUuid(lead.customer_request_id)) {
      try {
        const claimResult = await claimCustomerRequest(state.business.id, lead.customer_request_id);
        if (claimResult.lead) {
          setState((prev) => {
            const existingIdx = (prev.leads || []).findIndex((l) => l.id === lead.id || l.id === claimResult.lead!.id);
            const updatedLeads = [...(prev.leads || [])];
            if (existingIdx >= 0) {
              updatedLeads[existingIdx] = claimResult.lead!;
            } else {
              updatedLeads.unshift(claimResult.lead!);
            }
            return {
              ...prev,
              leads: updatedLeads,
            };
          });
          return;
        }
      } catch (err: any) {
        console.warn('[Mathorg] Notice claiming customer request via atomic RPC:', err?.message || err);
      }
    }

    if (session?.user && isUuid(state.business.id) && !isUuid(lead.id)) {
      try {
        const persistedLead = await createLead(state.business.id, {
          ...lead,
          is_locked: false,
          status: lead.status === 'New' ? 'Contacted' : lead.status,
        });
        if (persistedLead) {
          setState((prev) => ({
            ...prev,
            leads: (prev.leads || []).map((l) => (l.id === lead.id ? persistedLead : l)),
          }));
          return;
        }
      } catch (err: any) {
        console.warn('[Mathorg] Notice persisting unlocked lead:', err?.message || err);
      }
    }

    setState((prev) => ({
      ...prev,
      leads: (prev.leads || []).map((l) =>
        l.id === lead.id
          ? {
              ...l,
              is_locked: false,
              status: l.status === 'New' ? 'Contacted' : l.status,
            }
          : l
      ),
    }));
  };

  const handleConvertToQuoteForLead = (lead: Lead) => {
    if (
      lead.is_locked &&
      !hasActiveSubscription(
        state.business.id,
        state.user.plan,
        state.business.subscription_status,
        state.business.subscription_expires_at
      )
    ) {
      setIsSubscriptionOpen(true);
      return;
    }

    const quoteNumber = generateDocNumber('MAT-Q', state.quotes.length);
    const hasAttachedProducts = Array.isArray(lead.attached_products) && lead.attached_products.length > 0;
    
    // If products were attached in lead, populate quote items with them
    const items: QuoteItem[] = hasAttachedProducts
      ? lead.attached_products!.map((p, idx) => ({
          id: 'item_' + Date.now() + '_' + idx,
          product_id: p.product_id,
          name: p.name,
          description: p.category ? `Catalogue category: ${p.category}` : (lead.notes || ''),
          quantity: p.quantity,
          unit_price: p.unit_price,
          unit: p.unit || 'unit',
          total: p.total || (p.quantity * p.unit_price),
          isCatalogueMatch: true,
        }))
      : [
          {
            id: 'item_' + Date.now(),
            name: lead.service_required,
            description: lead.notes || (lead.requirements_list ? lead.requirements_list.join(', ') : ''),
            quantity: 1,
            unit_price: lead.budget_min || 0,
            unit: 'job',
            total: lead.budget_min || 0,
          },
        ];

    const subtotal: number = hasAttachedProducts
      ? items.reduce((sum: number, item: QuoteItem) => sum + (item.total || 0), 0)
      : (lead.budget_min || 0);
    const tax: number = (subtotal * state.business.tax_rate) / 100;

    const fullAddress = lead.address
      ? `${lead.address}${lead.location ? ', ' + lead.location : ''}`
      : lead.location;

    const newQuote: Quote = {
      id: 'quote_' + Date.now(),
      quote_number: quoteNumber,
      customer_id: lead.customer_id || '',
      customer_name: lead.customer_name,
      customer_phone: lead.phone,
      customer_whatsapp: lead.whatsapp || lead.phone,
      customer_email: lead.email || '',
      customer_address: fullAddress,
      status: 'Draft',
      issue_date: new Date().toISOString().split('T')[0],
      expiry_date: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d.toISOString().split('T')[0];
      })(),
      items,
      subtotal,
      discount_type: 'percent',
      discount_val: 0,
      discount_amount: 0,
      tax_rate: state.business.tax_rate,
      tax_amount: tax,
      total: subtotal + tax,
      notes: `Quotation prepared for Lead ${lead.lead_number}. Timeline: ${lead.timeline || 'Flexible'}. Location: ${fullAddress}.`,
      terms: state.business.terms,
      created_at: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      leads: (prev.leads || []).map((l) =>
        l.id === lead.id
          ? {
              ...l,
              status: 'Quoted',
              quote_id: newQuote.id,
              quote_number: newQuote.quote_number,
              updated_at: new Date().toISOString(),
            }
          : l
      ),
    }));

    setActiveQuote(newQuote);
    setQuoteInitialAIOpen(false);
    setIsQuoteModalOpen(true);
  };

  const handleSubmitServiceRequest = (newLead: Lead) => {
    setState((prev) => ({
      ...prev,
      leads: [newLead, ...(prev.leads || [])],
    }));
    setIsServiceRequestModalOpen(false);
    setActiveTab('leads');
  };

  // Settings & Plan Handlers
  const handleSaveBusiness = (updatedBiz: BusinessProfile) => {
    setState((prev) => ({ ...prev, business: updatedBiz }));
    registerBusinessToDirectory(updatedBiz);
    autoCreateServicesFromBusinessProfile(updatedBiz);
    syncBusinessProfileToDirectory(updatedBiz);
    if (session?.user?.id && updatedBiz.id && updatedBiz.id !== 'biz_mathorg_demo_1') {
      updateBusiness(updatedBiz.id, {
        name: updatedBiz.business_name,
        owner_full_name: updatedBiz.owner_full_name || null,
        email: updatedBiz.email || null,
        phone: updatedBiz.phone || null,
        whatsapp: updatedBiz.whatsapp || updatedBiz.phone || null,
        address: updatedBiz.address || null,
        country: updatedBiz.country || null,
        city: updatedBiz.city || null,
        lga: updatedBiz.lga || null,
        state: updatedBiz.state || null,
        industry: updatedBiz.industry || null,
        specialization: updatedBiz.specialization || null,
        tagline: updatedBiz.tagline || null,
        locations_served: Array.isArray(updatedBiz.locations_served) ? updatedBiz.locations_served : null,
        categories_offered: Array.isArray(updatedBiz.categories_offered) ? updatedBiz.categories_offered : null,
        currency: updatedBiz.currency || null,
        tax_rate: updatedBiz.tax_rate,
        logo_url: updatedBiz.logo || null,
        terms: updatedBiz.terms || null,
        payment_details: JSON.stringify(updatedBiz.payment_details),
      }).catch(err => {
        console.error('[Mathorg] Failed to sync business update to Supabase:', err);
      });
    }
  };

  const handleUpdateUser = (updatedUser: User) => {
    setState((prev) => ({ ...prev, user: updatedUser }));
  };

  const handleSelectPlan = (newPlan: PlanTier) => {
    setState((prev) => ({
      ...prev,
      user: { ...prev.user, plan: newPlan },
    }));
  };

  const handleIncrementAICount = () => {
    setState((prev) => ({
      ...prev,
      aiUsage: {
        ...prev.aiUsage,
        count: prev.aiUsage.count + 1,
      },
    }));
  };

  const handleResetData = () => {
    setState(initialData);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Navigation items config
  const isPremiumUser = hasActiveSubscription(
    state.business.id,
    state.user.plan,
    state.business.subscription_status,
    state.business.subscription_expires_at
  );
  const marketplaceCount = (state.leads || []).filter((l) => l.source === 'marketplace').length;
  const totalLeadsCount = (state.leads || []).length;

  const navItems: Array<{
    id:
      | 'dashboard'
      | 'matthew'
      | 'growth-engine'
      | 'quotes'
      | 'invoices'
      | 'products'
      | 'templates'
      | 'leads'
      | 'marketplace'
      | 'customers'
      | 'followups'
      | 'recommendations'
      | 'demand-adverts';
    label: string;
    icon: any;
    count?: number;
    group: 'core' | 'billing' | 'clients' | 'system';
    isPremium?: boolean;
  }> = [
    { id: 'dashboard' as const, label: 'Overview', icon: LayoutDashboard, group: 'core' },
    { id: 'matthew' as const, label: 'Business Intelligence', icon: Sparkles, group: 'core', isPremium: true },
    { id: 'growth-engine' as const, label: 'AI Growth Engine', icon: TrendingUp, group: 'core' },
    { id: 'quotes' as const, label: 'Quotes', icon: FileText, count: (state.quotes || []).length, group: 'billing' },
    { id: 'invoices' as const, label: 'Invoices', icon: CreditCard, count: (state.invoices || []).length, group: 'billing' },
    { id: 'products' as const, label: 'Catalogue', icon: Package, count: (state.products || []).length, group: 'billing' },
    { id: 'templates' as const, label: 'Templates', icon: Layers, count: (state.templates || []).length, group: 'billing' },
    { id: 'leads' as const, label: 'Leads & Pipeline', icon: Target, count: totalLeadsCount, group: 'clients' },
    { id: 'marketplace' as const, label: 'Buyer Marketplace', icon: Sparkles, count: marketplaceCount, group: 'clients' },
    { id: 'customers' as const, label: 'Customers', icon: Users, count: (state.customers || []).length, group: 'clients' },
    {
      id: 'followups' as const,
      label: 'Follow-Ups',
      icon: Clock,
      count: (state.followups || []).filter((f) => f.status === 'pending').length,
      group: 'clients',
    },
    { id: 'recommendations' as const, label: 'Artisan Outreach', icon: ThumbsUp, group: 'clients' },
    ...(session && isServerVerifiedAdmin
      ? [
          {
            id: 'demand-adverts' as const,
            label: 'Admin Console',
            icon: ShieldCheck,
            count: demandCampaignsCount > 0 ? demandCampaignsCount : undefined,
            group: 'system' as const,
          },
        ]
      : []),
  ];

  const isAuthorized = Boolean(session || isGuest);

  // SEO Navigation Handlers
  const navigateToBlog = (slug?: string) => {
    if (slug) {
      window.history.pushState({}, '', `/blog/${slug}`);
      setCurrentRoute({ view: 'blog-article', blogSlug: slug });
    } else {
      window.history.pushState({}, '', '/blog');
      setCurrentRoute({ view: 'blog' });
    }
  };

  const navigateToServices = (serviceSlug?: string, locationSlug?: string) => {
    const s = serviceSlug || 'all';
    if (s === 'all') {
      if (locationSlug) {
        window.history.pushState({}, '', `/services?location=${locationSlug}`);
        setCurrentRoute({ view: 'services', serviceSlug: 'all', locationSlug });
      } else {
        window.history.pushState({}, '', `/services`);
        setCurrentRoute({ view: 'services', serviceSlug: 'all' });
      }
    } else {
      if (locationSlug) {
        window.history.pushState({}, '', `/services/${s}/${locationSlug}`);
        setCurrentRoute({ view: 'services', serviceSlug: s, locationSlug });
      } else {
        window.history.pushState({}, '', `/services/${s}`);
        setCurrentRoute({ view: 'services', serviceSlug: s });
      }
    }
  };

  const navigateToLocations = (locationSlug?: string) => {
    if (locationSlug) {
      window.history.pushState({}, '', `/locations/${locationSlug}`);
      setCurrentRoute({ view: 'locations', locationSlug });
    } else {
      window.history.pushState({}, '', '/locations');
      setCurrentRoute({ view: 'locations' });
    }
  };

  const navigateToHome = () => {
    window.history.pushState({}, '', '/');
    setCurrentRoute({ view: 'landing' });
    setCurrentView('landing');
  };

  const navigateToRecommend = () => {
    setAdminRouteRequested(false);
    window.history.pushState({}, '', '/recommend');
    setCurrentRoute({ view: 'recommend' });
  };

  // SEO Service Request Handler
  const handleOpenSeoRequest = (serviceName?: string, locationName?: string) => {
    setSeoPrefillService(serviceName || '');
    setSeoPrefillLocation(locationName || '');
    setIsSeoQuickRequestOpen(true);
  };

  // 1. Blog Article View (/blog/[slug])
  if (currentRoute.view === 'blog-article' && currentRoute.blogSlug) {
    return (
      <>
        <SplashScreen />
        <BlogArticlePage
          slug={currentRoute.blogSlug}
          onNavigateHome={navigateToHome}
          onNavigateBlog={() => navigateToBlog()}
          onSelectArticle={(slug) => navigateToBlog(slug)}
          onNavigateServiceLocation={(s, l) => navigateToServices(s, l)}
          onFindPros={(cat) => navigateToServices(cat)}
          onPostRequest={(serv) => handleOpenSeoRequest(serv)}
          onJoinAsBusiness={() => {
            if (isAuthorized) {
              setCurrentRoute({ view: 'app' });
              setCurrentView('app');
            } else {
              setIsLoginModalOpen(true);
            }
          }}
        />

        {/* Quick Request Modal for SEO conversions */}
        <QuickRequestModal
          isOpen={isSeoQuickRequestOpen}
          onClose={() => setIsSeoQuickRequestOpen(false)}
          prefilledService={seoPrefillService}
          prefilledLocation={seoPrefillLocation}
          onSuccessSubmit={handleSubmitServiceRequest}
        />

        {/* Login Modal */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          onGuestAccess={() => {
            setIsGuest(true);
            setCurrentRoute({ view: 'app' });
            setCurrentView('app');
          }}
        />
      </>
    );
  }

  // 2. Blog Homepage View (/blog)
  if (currentRoute.view === 'blog') {
    return (
      <>
        <SplashScreen />
        <BlogHomePage
          onSelectArticle={(slug) => navigateToBlog(slug)}
          onNavigateHome={navigateToHome}
          onNavigateServices={(s, l) => navigateToServices(s, l)}
          onNavigateLocations={(l) => navigateToLocations(l)}
          onPostRequest={() => handleOpenSeoRequest()}
        />

        <QuickRequestModal
          isOpen={isSeoQuickRequestOpen}
          onClose={() => setIsSeoQuickRequestOpen(false)}
          prefilledService={seoPrefillService}
          prefilledLocation={seoPrefillLocation}
          onSuccessSubmit={handleSubmitServiceRequest}
        />

        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          onGuestAccess={() => {
            setIsGuest(true);
            setCurrentRoute({ view: 'app' });
            setCurrentView('app');
          }}
        />
      </>
    );
  }

  // 3. Local Service Discovery Page (/services/[service]/[location])
  if (currentRoute.view === 'services') {
    return (
      <>
        <SplashScreen />
        <ServiceLocationPage
          serviceSlug={currentRoute.serviceSlug || 'all'}
          locationSlug={currentRoute.locationSlug}
          citySlug={currentRoute.citySlug}
          onNavigateHome={navigateToHome}
          onNavigateService={(s, l) => navigateToServices(s, l)}
          onNavigateLocation={(l, s) => (s ? navigateToServices(s, l) : navigateToLocations(l))}
          onNavigateArticle={(slug) => navigateToBlog(slug)}
          onSelectProfessional={(pro) => setSeoSelectedProfessional(pro)}
          onPostRequest={(serv, loc) => handleOpenSeoRequest(serv, loc)}
          onJoinAsBusiness={() => {
            if (isAuthorized) {
              setCurrentRoute({ view: 'app' });
              setCurrentView('app');
            } else {
              setIsLoginModalOpen(true);
            }
          }}
        />

        <ProfessionalProfileModal
          professional={seoSelectedProfessional}
          isOpen={Boolean(seoSelectedProfessional)}
          onClose={() => setSeoSelectedProfessional(null)}
          onRequestQuote={(prof) => {
            handleOpenSeoRequest(
              prof.specialization || prof.business_name,
              prof.city ? `${prof.city}, ${prof.state}` : prof.state
            );
          }}
        />

        <QuickRequestModal
          isOpen={isSeoQuickRequestOpen}
          onClose={() => setIsSeoQuickRequestOpen(false)}
          prefilledService={seoPrefillService}
          prefilledLocation={seoPrefillLocation}
          onSuccessSubmit={handleSubmitServiceRequest}
        />

        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          onGuestAccess={() => {
            setIsGuest(true);
            setCurrentRoute({ view: 'app' });
            setCurrentView('app');
          }}
        />
      </>
    );
  }

  // 4. Locations Hub Page (/locations and /locations/[location])
  if (currentRoute.view === 'locations') {
    return (
      <>
        <SplashScreen />
        <LocationHubPage
          locationSlug={currentRoute.locationSlug}
          onNavigateHome={navigateToHome}
          onNavigateLocation={(l) => navigateToLocations(l)}
          onNavigateServiceLocation={(s, l) => navigateToServices(s, l)}
          onNavigateArticle={(slug) => navigateToBlog(slug)}
          onSelectProfessional={(pro) => setSeoSelectedProfessional(pro)}
          onPostRequest={(serv, loc) => handleOpenSeoRequest(serv, loc)}
          onJoinAsBusiness={() => {
            if (isAuthorized) {
              setCurrentRoute({ view: 'app' });
              setCurrentView('app');
            } else {
              setIsLoginModalOpen(true);
            }
          }}
        />

        <ProfessionalProfileModal
          professional={seoSelectedProfessional}
          isOpen={Boolean(seoSelectedProfessional)}
          onClose={() => setSeoSelectedProfessional(null)}
          onRequestQuote={(prof) => {
            handleOpenSeoRequest(
              prof.specialization || prof.business_name,
              prof.city ? `${prof.city}, ${prof.state}` : prof.state
            );
          }}
        />

        <QuickRequestModal
          isOpen={isSeoQuickRequestOpen}
          onClose={() => setIsSeoQuickRequestOpen(false)}
          prefilledService={seoPrefillService}
          prefilledLocation={seoPrefillLocation}
          onSuccessSubmit={handleSubmitServiceRequest}
        />

        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          onGuestAccess={() => {
            setIsGuest(true);
            setCurrentRoute({ view: 'app' });
            setCurrentView('app');
          }}
        />
      </>
    );
  }

  // 5. Artisan Recommendations View (/recommend)
  if (currentRoute.view === 'recommend') {
    return (
      <>
        <SplashScreen />
        <ArtisanRecommendationPage
          onNavigateHome={navigateToHome}
          onNavigateServices={(s, l) => navigateToServices(s, l)}
          onNavigateBlog={() => navigateToBlog()}
          onJoinAsBusiness={() => {
            if (isAuthorized) {
              setCurrentRoute({ view: 'app' });
              setCurrentView('app');
            } else {
              setLoginModalMode('register');
              setIsLoginModalOpen(true);
            }
          }}
          onRequestQuoteForArtisan={(artisanName, trade, loc) => {
            handleOpenSeoRequest(`${trade} (${artisanName})`, loc);
          }}
        />

        <QuickRequestModal
          isOpen={isSeoQuickRequestOpen}
          onClose={() => setIsSeoQuickRequestOpen(false)}
          prefilledService={seoPrefillService}
          prefilledLocation={seoPrefillLocation}
          onSuccessSubmit={handleSubmitServiceRequest}
        />

        <LoginModal
          isOpen={isLoginModalOpen}
          initialMode={loginModalMode}
          initialBusinessName={claimArtisanDetails?.artisanName}
          initialPhone={claimArtisanDetails?.phone}
          initialTrade={claimArtisanDetails?.trade}
          initialState={claimArtisanDetails?.state}
          initialCity={claimArtisanDetails?.town}
          claimNotice={
            claimArtisanDetails?.artisanName
              ? `Someone has recommended your work as ${claimArtisanDetails.trade || 'an artisan'} in ${
                  claimArtisanDetails.town ? `${claimArtisanDetails.town}, ` : ''
                }${claimArtisanDetails.state || 'Nigeria'}. Claim your profile to showcase your services, build trust, and receive client inquiries!`
              : undefined
          }
          claimRecommendationId={claimArtisanDetails?.claimId}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          onGuestAccess={() => {
            setIsGuest(true);
            setCurrentRoute({ view: 'app' });
            setCurrentView('app');
          }}
        />
      </>
    );
  }

  // 5b. Dedicated Universal /business Funnel & Portal (/business)
  if (currentRoute.view === 'business-portal') {
    return (
      <>
        <SplashScreen />
        <BusinessPortalPage
          isAuthenticated={Boolean(session?.user)}
          userEmail={session?.user?.email}
          userPhone={session?.user?.phone || state.business.phone}
          currentBusiness={state.business}
          autoSubmittingPending={isAutoSubmittingPendingListing}
          externalListingResult={businessPortalResult}
          externalListingError={businessPortalError}
          onClearExternalResult={() => {
            setBusinessPortalResult(null);
            setBusinessPortalError(null);
          }}
          onNavigateHome={navigateToHome}
          onPromptLogin={() => {
            setPendingListingDraft(null);
            setLoginModalMode('login');
            setIsLoginModalOpen(true);
          }}
          onPromptRegister={() => {
            setPendingListingDraft(null);
            setLoginModalMode('register');
            setIsLoginModalOpen(true);
          }}
          onEnterWorkspace={() => {
            setIsGuest(true);
            setCurrentRoute({ view: 'app' });
            setCurrentView('app');
          }}
          onOpenProfileSettings={() => {
            setCurrentRoute({ view: 'app' });
            setCurrentView('app');
            setIsSettingsOpen(true);
          }}
          onSubmitListing={handleUniversalListingSubmit}
          onRequestAuthToPublish={(draft, mode = 'register') => {
            setPendingListingDraft(draft);
            setLoginModalMode(mode);
            setIsLoginModalOpen(true);
          }}
          onSelectArticle={(slug) => navigateToBlog(slug)}
          onOpenAllGuides={() => navigateToBlog()}
        />

        <LoginModal
          isOpen={isLoginModalOpen}
          initialMode={loginModalMode}
          initialBusinessName={pendingListingDraft?.businessName || claimArtisanDetails?.artisanName}
          initialFullName={pendingListingDraft?.fullName}
          allowOptionalBusinessName={Boolean(pendingListingDraft)}
          claimSubmittedListing={Boolean(pendingListingDraft?.submittedToDirectory)}
          continuationNotice={
            pendingListingDraft
              ? pendingListingDraft.submittedToDirectory
                ? `Your listing (${pendingListingDraft.profession} in ${pendingListingDraft.townCity}, ${pendingListingDraft.state}) is saved in our database! Sign up or sign in to claim your profile so more customers can see you, verify & trust you.`
                : `Create an account or sign in to publish your listing (${pendingListingDraft.profession} in ${pendingListingDraft.townCity}, ${pendingListingDraft.state}). All details you entered are preserved.`
              : undefined
          }
          initialPhone={pendingListingDraft?.phone || claimArtisanDetails?.phone}
          initialTrade={pendingListingDraft?.profession || claimArtisanDetails?.trade}
          initialState={pendingListingDraft?.state || claimArtisanDetails?.state}
          initialCity={pendingListingDraft?.townCity || claimArtisanDetails?.town}
          claimNotice={
            !pendingListingDraft && claimArtisanDetails?.artisanName
              ? `Someone has recommended your work as ${claimArtisanDetails.trade || 'an artisan'} in ${
                  claimArtisanDetails.town ? `${claimArtisanDetails.town}, ` : ''
                }${claimArtisanDetails.state || 'Nigeria'}. Claim your profile to showcase your services, build trust, and receive client inquiries!`
              : undefined
          }
          claimRecommendationId={claimArtisanDetails?.claimId}
          onClose={() => {
            setIsLoginModalOpen(false);
            setPendingListingDraft(null);
          }}
          onLoginSuccess={(sess, biz) => {
            if (pendingListingDraft) {
              // Stay on /business so the auto-submission effect finalizes the 7-field draft and displays confirmation
              setSession(sess);
              setIsLoginModalOpen(false);
            } else {
              handleLoginSuccess(sess, biz);
              setCurrentRoute({ view: 'app' });
              setCurrentView('app');
            }
          }}
          onGuestAccess={() => {
            setIsGuest(true);
            setCurrentRoute({ view: 'app' });
            setCurrentView('app');
          }}
        />
      </>
    );
  }

  // 5c. Protected Administrator Route Gate (/admin or ?view=admin) when unauthenticated
  if (adminRouteRequested && !session?.access_token) {
    return (
      <>
        <SplashScreen />
        <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-[#E5E9F0] p-6 sm:p-8 shadow-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0B192C] text-white flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight">Administrator Sign-In Required</h1>
            <p className="text-[15px] sm:text-base text-[#5B6D85] leading-relaxed">
              The MatthOrg Admin Console is restricted to verified platform administrators. Sign in with an authorized administrator account to continue.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setLoginModalMode('login');
                  setIsLoginModalOpen(true);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[15px] font-bold transition cursor-pointer whitespace-nowrap"
              >
                Sign In as Administrator
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdminRouteRequested(false);
                  navigateToHome();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-[#F4F7FB] hover:bg-[#E5E9F0] text-[#0B192C] text-[15px] font-bold transition cursor-pointer whitespace-nowrap"
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
        <LoginModal
          isOpen={isLoginModalOpen}
          initialMode="login"
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      </>
    );
  }

  // 6. Landing Page / Clean Customer Discovery Homepage
  if (currentView === 'landing' || !isAuthorized) {
    return (
      <>
        <SplashScreen />
        <LandingPage
          business={state.business}
          currentUser={state.user}
          initialService={seoPrefillService}
          initialLocation={seoPrefillLocation}
          onOpenNewQuote={(withAI) => {
            if (isAuthorized) {
              setCurrentView('app');
              handleOpenNewQuote(withAI);
            } else {
              setIsLoginModalOpen(true);
            }
          }}
          onOpenNewInvoice={() => {
            if (isAuthorized) {
              setCurrentView('app');
              handleOpenNewInvoice();
            } else {
              setIsLoginModalOpen(true);
            }
          }}
          onEnterApp={handleEnterAppClick}
          onNavigateBusiness={() => {
            try {
              window.history.pushState({}, '', '/business');
            } catch {
              // ignore
            }
            setCurrentRoute({ view: 'business-portal' });
          }}
          onNavigateBlog={(slug) => navigateToBlog(slug)}
          onNavigateServices={(s, l) => navigateToServices(s, l)}
          onNavigateLocations={(l) => navigateToLocations(l)}
          onNavigateRecommend={navigateToRecommend}
          onPromptLogin={() => {
            setLoginModalMode('login');
            setIsLoginModalOpen(true);
          }}
          onPromptRegister={() => {
            setLoginModalMode('register');
            setIsLoginModalOpen(true);
          }}
          onNewLeadCreated={handleSubmitServiceRequest}
        />

        {/* Login & Business Registration Modal */}
        <LoginModal
          isOpen={isLoginModalOpen}
          initialMode={loginModalMode}
          initialBusinessName={claimArtisanDetails?.artisanName}
          initialPhone={claimArtisanDetails?.phone}
          initialTrade={claimArtisanDetails?.trade}
          initialState={claimArtisanDetails?.state}
          initialCity={claimArtisanDetails?.town}
          claimNotice={
            claimArtisanDetails?.artisanName
              ? `Someone has recommended your work as ${claimArtisanDetails.trade || 'an artisan'} in ${
                  claimArtisanDetails.town ? `${claimArtisanDetails.town}, ` : ''
                }${claimArtisanDetails.state || 'Nigeria'}. Claim your profile to showcase your services, build trust, and receive client inquiries!`
              : undefined
          }
          claimRecommendationId={claimArtisanDetails?.claimId}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          onGuestAccess={() => {
            setIsGuest(true);
            setCurrentView('app');
          }}
        />

        {/* Quote Editor Modal */}
        {isQuoteModalOpen && (
          <QuoteEditorModal
            isOpen={isQuoteModalOpen}
            onClose={() => setIsQuoteModalOpen(false)}
            quote={activeQuote}
            state={state}
            onSaveQuote={handleSaveQuote}
            onConvertToInvoice={handleConvertToInvoice}
            onOpenFollowUpModal={(q) => handleOpenFollowUpModal(q, null)}
            onSaveNewCustomer={handleSaveCustomer}
            onIncrementAICount={handleIncrementAICount}
            initialAIPromptOpen={quoteInitialAIOpen}
          />
        )}

        {/* Invoice Editor Modal */}
        {isInvoiceModalOpen && (
          <InvoiceEditorModal
            isOpen={isInvoiceModalOpen}
            onClose={() => setIsInvoiceModalOpen(false)}
            invoice={activeInvoice}
            state={state}
            onSaveInvoice={handleSaveInvoice}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0B192C] flex flex-col lg:flex-row selection:bg-[#3D74D9] selection:text-white overflow-x-hidden">
      <SplashScreen />
      <OfflineIndicator />

      {/* Mobile Header (< lg) */}
      <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E5E9F0] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BrandLogo
            size="sm"
            subtitle={activeTab === 'demand-adverts' && session && isServerVerifiedAdmin ? 'Admin' : 'Business'}
            onClick={() => setIsSettingsOpen(true)}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenNewQuote(false)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B192C] text-white px-3.5 py-2 text-[15px] font-semibold whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Quote</span>
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-[#F4F7FB] text-[#5B6D85] hover:text-[#0B192C] border border-[#E5E9F0]"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Desktop Deep-Navy Left Sidebar Rail */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-[#0B192C] text-white sticky top-0 h-screen border-r border-[#152844]">
        {/* Brand Top Lockup */}
        <div className="px-5 pt-5 pb-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={navigateToHome}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
            title="Return to MatthOrg Public Marketplace"
          >
            <div className="w-8 h-8 rounded-lg bg-[#152844] border border-white/15 flex items-center justify-center text-white font-heading font-extrabold text-[15px]">
              M
            </div>
            <span className="font-heading text-lg font-extrabold tracking-tight text-white whitespace-nowrap">
              MatthOrg
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="text-[13px] font-medium text-slate-300/85 hover:text-white truncate max-w-[92px] cursor-pointer"
            title={state.business.business_name}
          >
            {state.business.business_name}
          </button>
        </div>

        {/* Grouped Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
          {(['core', 'billing', 'clients', 'system'] as const).map((groupKey) => {
            const groupItems = navItems.filter((item) => item.group === groupKey);
            return (
              <div key={groupKey} className="space-y-0.5">
                {groupItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[15px] transition cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-white/12 text-white font-semibold'
                          : 'text-slate-300/90 hover:text-white hover:bg-white/6 font-medium'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#3D74D9]' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </span>
                      <span className="flex items-center gap-1.5 ml-2 shrink-0">
                        {item.isPremium && (
                          <span
                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[13px] font-bold uppercase tracking-wider leading-none ${
                              isPremiumUser
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                            }`}
                          >
                            {!isPremiumUser && <Lock className="w-3 h-3" />}
                            PRO
                          </span>
                        )}
                        {item.count !== undefined && item.count > 0 && (
                          <span className="text-[13px] text-slate-300 tabular-nums">
                            {item.count}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}

          {/* System / Utility Links */}
          <div className="pt-3 border-t border-white/10 space-y-0.5">
            <button
              type="button"
              onClick={navigateToHome}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[15px] font-medium text-slate-300/90 hover:text-white hover:bg-white/6 transition cursor-pointer whitespace-nowrap"
            >
              <Globe className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Public Marketplace</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[15px] font-medium text-slate-300/90 hover:text-white hover:bg-white/6 transition cursor-pointer whitespace-nowrap"
            >
              <Settings className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Settings</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSubscriptionOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[15px] font-medium text-slate-300/90 hover:text-white hover:bg-white/6 transition cursor-pointer whitespace-nowrap"
            >
              <span className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Plans &amp; Billing</span>
              </span>
              <span className="text-[13px] uppercase font-bold text-slate-300">{state.user.plan}</span>
            </button>
          </div>
        </nav>

        {/* Bottom Session / Account Footer */}
        <div className="p-3 border-t border-white/10 space-y-2">
          {!session ? (
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setLoginModalMode('login');
                  setIsLoginModalOpen(true);
                }}
                className="py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-[15px] font-semibold transition cursor-pointer whitespace-nowrap"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginModalMode('register');
                  setIsLoginModalOpen(true);
                }}
                className="py-2.5 rounded-lg bg-[#3D74D9] hover:bg-[#2F62C2] text-white text-[15px] font-semibold transition cursor-pointer whitespace-nowrap"
              >
                Register
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/8 hover:bg-white/12 text-[14px] text-slate-200 transition cursor-pointer"
            >
              <span className="truncate font-medium">{state.user.name || state.business.business_name}</span>
              <LogOut className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 min-w-0 max-w-full flex flex-col overflow-x-hidden">
        {/* Paystack Payment Status Banner Toast */}
        {paystackToast && (
          <div className="max-w-[1220px] w-full mx-auto px-4 sm:px-6 pt-4">
            <div
              className={`p-4 rounded-2xl flex items-center justify-between gap-3 shadow-sm border text-[15px] transition-all ${
                paystackToast.status === 'loading'
                  ? 'bg-blue-50 border-blue-200 text-blue-950'
                  : paystackToast.status === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-center gap-3">
                <div>
                  <strong className="font-heading font-bold text-base block">{paystackToast.message}</strong>
                  {paystackToast.details && (
                    <p className="text-[13px] opacity-85 mt-0.5 font-mono">{paystackToast.details}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setPaystackToast(null)}
                className="p-2 rounded-lg hover:bg-black/5 text-slate-600 hover:text-slate-900 transition text-sm font-semibold cursor-pointer whitespace-nowrap"
              >
                ✕ Dismiss
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 w-full min-w-0 overflow-x-hidden px-4 sm:px-7 py-5 pb-20 lg:pb-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              state={state}
              onOpenNewQuote={handleOpenNewQuote}
              onOpenNewInvoice={handleOpenNewInvoice}
              onOpenQuote={handleOpenQuote}
              onOpenInvoice={handleOpenInvoice}
              onUpdateQuoteStatus={handleUpdateQuoteStatus}
              onUpdateFollowUpStatus={handleUpdateFollowUpStatus}
              onRescheduleFollowUp={(fu) => handleOpenFollowUpModal(null, fu)}
              onConvertToInvoice={handleConvertToInvoice}
              onOpenSubscription={() => setIsSubscriptionOpen(true)}
              onOpenVerificationModal={() => setIsVerificationModalOpen(true)}
              onNavigateToLeads={() => setActiveTab('leads')}
              onNavigateToMarketplace={() => setActiveTab('marketplace')}
              onNavigateToQuotes={() => setActiveTab('quotes')}
              onNavigateToInvoices={() => setActiveTab('invoices')}
              onNavigateToSettings={() => setIsSettingsOpen(true)}
              onOpenNewLead={handleOpenNewLead}
              onOpenServiceRequest={() => setIsServiceRequestModalOpen(true)}
              onConvertToQuoteForLead={handleConvertToQuoteForLead}
              onNavigateToMatthew={(prompt) => {
                setMatthewInitialPrompt(isPremiumUser ? prompt : '');
                setActiveTab('matthew');
              }}
              onOpenMessageModal={(target) => {
                setActiveMessageTarget(target);
                setIsMessageModalOpen(true);
              }}
              onOpenLeadModal={(lead) => {
                setActiveLead(lead);
                setIsLeadModalOpen(true);
              }}
              onOpenFollowUpsTab={() => setActiveTab('followups')}
              onDeleteQuote={handleDeleteQuote}
              onDeleteInvoice={handleDeleteInvoice}
              onDeleteFollowUp={handleDeleteFollowUp}
              onNavigateToRecommendations={() => setActiveTab('recommendations')}
            />
          )}

          {activeTab === 'matthew' && (
            <MatthewView
              state={state}
              initialPrompt={matthewInitialPrompt}
              onOpenLead={(lead) => {
                setActiveLead(lead);
                setIsLeadModalOpen(true);
              }}
              onOpenQuote={(quote) => {
                setActiveQuote(quote);
                setIsQuoteModalOpen(true);
              }}
              onOpenInvoice={(invoice) => {
                setActiveInvoice(invoice);
                setIsInvoiceModalOpen(true);
              }}
              onNavigateTab={(tab) => setActiveTab(tab as any)}
              onOpenSubscription={() => setIsSubscriptionOpen(true)}
            />
          )}

          {activeTab === 'leads' && (
            <LeadsView
              leads={state.leads || []}
              business={state.business}
              currentUserPlan={state.user.plan}
              state={state}
              onOpenNewLead={handleOpenNewLead}
              onEditLead={handleEditLead}
              onDeleteLead={handleDeleteLead}
              onUpdateLeadStatus={handleUpdateLeadStatus}
              onUnlockLead={handleUnlockLead}
              onConvertToQuote={handleConvertToQuoteForLead}
              onOpenServiceRequest={() => setIsServiceRequestModalOpen(true)}
              onOpenSubscription={() => setIsSubscriptionOpen(true)}
              onNavigateToMatthew={(prompt) => {
                setMatthewInitialPrompt(isPremiumUser ? prompt : '');
                setActiveTab('matthew');
              }}
              onOpenMessageModal={(target) => {
                setActiveMessageTarget(target);
                setIsMessageModalOpen(true);
              }}
            />
          )}

          {activeTab === 'growth-engine' && (
            <AIGrowthEngineView
              business={state.business}
              onCustomerConverted={(newCustomer, newLead) => {
                setState((prev) => ({
                  ...prev,
                  customers: [newCustomer, ...(prev.customers || [])],
                  leads: [newLead, ...(prev.leads || [])],
                }));
              }}
              onNavigateToQuotes={() => setActiveTab('quotes')}
            />
          )}

          {activeTab === 'marketplace' && (
            <FindLeadsView
              leads={state.leads || []}
              business={state.business}
              currentUserPlan={state.user.plan}
              onUnlockLead={handleUnlockLead}
              onConvertToQuote={handleConvertToQuoteForLead}
              onOpenServiceRequest={() => setIsServiceRequestModalOpen(true)}
              onOpenSubscription={() => setIsSubscriptionOpen(true)}
              onNewLeadCreated={handleSubmitServiceRequest}
            />
          )}

          {activeTab === 'quotes' && (
            <QuotesView
              quotes={state.quotes}
              business={state.business}
              onOpenQuote={handleOpenQuote}
              onNewQuote={handleOpenNewQuote}
              onDeleteQuote={handleDeleteQuote}
              onConvertToInvoice={handleConvertToInvoice}
              onOpenFollowUpModal={(q) => handleOpenFollowUpModal(q, null)}
            />
          )}

          {activeTab === 'invoices' && (
            <InvoicesView
              invoices={state.invoices}
              business={state.business}
              onOpenInvoice={handleOpenInvoice}
              onNewInvoice={handleOpenNewInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onMarkPaid={handleMarkPaid}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersView
              customers={state.customers}
              quotes={state.quotes}
              invoices={state.invoices}
              business={state.business}
              onSaveCustomer={handleSaveCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onNewQuoteForCustomer={handleNewQuoteForCustomer}
            />
          )}

          {activeTab === 'products' && (
            <ProductsView
              products={state.products}
              business={state.business}
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
              onConvertEnquiryToQuote={(enq) => {
                const matchedProd = state.products.find((p) => p.id === enq.product_id);
                const unitPrice = matchedProd?.default_price || 0;
                const qty = enq.quantity || 1;
                setActiveQuote({
                  id: 'q_' + Date.now(),
                  quote_number: generateDocNumber('MAT-Q', state.quotes.length),
                  customer_id: '',
                  customer_name: enq.customer_name,
                  customer_phone: enq.customer_phone,
                  customer_whatsapp: enq.customer_whatsapp || enq.customer_phone,
                  customer_email: enq.customer_email || '',
                  customer_address: enq.customer_location || 'Nigeria',
                  status: 'Draft',
                  issue_date: new Date().toISOString().split('T')[0],
                  expiry_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                  items: [
                    {
                      id: 'qi_' + Date.now(),
                      product_id: enq.product_id,
                      name: enq.product_name,
                      description: enq.message,
                      quantity: qty,
                      unit_price: unitPrice,
                      unit: matchedProd?.unit || 'unit',
                      total: qty * unitPrice,
                      isCatalogueMatch: Boolean(matchedProd),
                    },
                  ],
                  subtotal: qty * unitPrice,
                  discount_type: 'percent',
                  discount_val: 0,
                  discount_amount: 0,
                  tax_rate: state.business.tax_rate || 0,
                  tax_amount: 0,
                  total: qty * unitPrice,
                  notes: `Converted from Matthew AI product enquiry: ${enq.message}`,
                  terms: state.business.terms || '',
                  created_at: new Date().toISOString(),
                });
                setQuoteInitialAIOpen(false);
                setIsQuoteModalOpen(true);
              }}
            />
          )}

          {activeTab === 'templates' && (
            <TemplatesView
              templates={state.templates}
              products={state.products}
              business={state.business}
              onSaveTemplate={handleSaveTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              onUseTemplate={handleUseTemplateInQuote}
            />
          )}

          {activeTab === 'followups' && (
            <FollowUpsView
              followups={state.followups}
              quotes={state.quotes}
              business={state.business}
              onUpdateStatus={handleUpdateFollowUpStatus}
              onReschedule={(fu) => handleOpenFollowUpModal(null, fu)}
              onDeleteFollowUp={handleDeleteFollowUp}
              onConvertToInvoice={handleConvertToInvoice}
              onOpenMessageModal={(target) => {
                setActiveMessageTarget(target);
                setIsMessageModalOpen(true);
              }}
            />
          )}

          {activeTab === 'recommendations' && (
            <ArtisanOutreachView
              onOpenRecommendWall={navigateToRecommend}
              onNavigateToBusinessPortal={() => setActiveTab('dashboard')}
              onNavigateToDemandAdverts={
                session && isServerVerifiedAdmin ? () => setActiveTab('demand-adverts') : undefined
              }
            />
          )}

          {activeTab === 'demand-adverts' && (
            session && isServerVerifiedAdmin ? (
              <AdminConsoleView
                onNavigateToMarketplace={() => setActiveTab('marketplace')}
                onNavigateToArtisans={() => setActiveTab('recommendations')}
                onOpenRecommendWall={navigateToRecommend}
                onProductDeleted={async (deletedIds) => {
                  const idSet = new Set(deletedIds);
                  setState((prev) => ({
                    ...prev,
                    products: prev.products.filter((p) => !idSet.has(p.id)),
                  }));
                  if (session?.user) {
                    for (const did of deletedIds) {
                      if (isUuid(did)) {
                        await deleteProduct(did).catch(() => false);
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="bg-white rounded-2xl border border-[#E5E9F0] p-8 max-w-lg mx-auto text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-[#0B192C]">
                  {isCheckingAdmin ? 'Verifying Administrator Access...' : 'Administrator Access Restricted'}
                </h2>
                <p className="text-[15px] text-[#5B6D85]">
                  {isCheckingAdmin
                    ? 'Confirming your server-side administrator permissions.'
                    : 'Only verified platform administrators can access the MatthOrg Admin Console.'}
                </p>
                {!isCheckingAdmin && (
                  <div className="flex justify-center gap-2 pt-1">
                    {!session?.access_token && (
                      <button
                        type="button"
                        onClick={() => {
                          setLoginModalMode('login');
                          setIsLoginModalOpen(true);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-[#0B192C] text-white text-[15px] font-bold cursor-pointer"
                      >
                        Sign In
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setAdminRouteRequested(false);
                        setActiveTab('dashboard');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#F4F7FB] text-[#0B192C] text-[15px] font-bold cursor-pointer"
                    >
                      Return to Dashboard
                    </button>
                  </div>
                )}
              </div>
            )
          )}

          {/* Workspace Footer with Legal, Terms, and Status */}
          <footer className="mt-12 pt-6 pb-20 lg:pb-6 border-t border-[#E5E9F0] flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[#5B6D85]">
            <div className="flex items-center gap-2.5">
              <BrandLogo size="xs" showText={false} />
              <span>© {new Date().getFullYear()} MatthOrg Technologies • Quotations. Invoices. Follow Ups.</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <button
                type="button"
                onClick={() => openLegalModal('privacy')}
                className="hover:text-[#0B192C] transition font-medium"
              >
                Privacy Policy
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => openLegalModal('terms')}
                className="hover:text-[#0B192C] transition font-medium"
              >
                Terms of Service
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => openLegalModal('refund')}
                className="hover:text-[#0B192C] transition font-medium"
              >
                Refund Policy
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => openLegalModal('security')}
                className="hover:text-[#0B192C] transition font-medium"
              >
                Security & Compliance
              </button>
            </div>
          </footer>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E9F0] px-3 py-1.5 flex items-center justify-around pb-safe">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="flex flex-col items-center py-1 px-2 rounded-xl transition relative group"
        >
          <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'text-[#3D74D9]' : 'text-[#8F9FB5]'}`} />
          <span className={`text-[13px] mt-0.5 ${activeTab === 'dashboard' ? 'text-[#0B192C] font-bold' : 'text-[#5B6D85]'}`}>Home</span>
        </button>

        <button
          onClick={() => setActiveTab('leads')}
          className="flex flex-col items-center py-1 px-2 rounded-xl transition relative group"
        >
          <div className="relative">
            <Target className={`w-5 h-5 ${activeTab === 'leads' ? 'text-emerald-600' : 'text-[#8F9FB5]'}`} />
            {(state.leads || []).length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </div>
          <span className={`text-[13px] mt-0.5 ${activeTab === 'leads' ? 'text-[#0B192C] font-bold' : 'text-[#5B6D85]'}`}>Leads</span>
        </button>

        {/* Center Primary Action Button */}
        <button
          onClick={() => handleOpenNewQuote(false)}
          className="flex flex-col items-center -mt-6 bg-[#0B192C] text-white p-3.5 rounded-2xl shadow-lg shadow-[#0B192C]/20 active:scale-95 transition border-4 border-white"
          title="Create New Quote"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>

        <button
          onClick={() => setActiveTab('quotes')}
          className="flex flex-col items-center py-1 px-2 rounded-xl transition relative group"
        >
          <div className="relative">
            <FileText className={`w-5 h-5 ${activeTab === 'quotes' ? 'text-[#3D74D9]' : 'text-[#8F9FB5]'}`} />
            {(state.quotes || []).length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#3D74D9]" />
            )}
          </div>
          <span className={`text-[13px] mt-0.5 ${activeTab === 'quotes' ? 'text-[#0B192C] font-bold' : 'text-[#5B6D85]'}`}>Quotes</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center py-1 px-2 rounded-xl transition relative group"
        >
          <Menu className={`w-5 h-5 ${isMobileMenuOpen ? 'text-[#3D74D9]' : 'text-[#8F9FB5]'}`} />
          <span className="text-[13px] text-[#5B6D85] mt-0.5">More</span>
        </button>
      </nav>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B192C]/80 backdrop-blur-sm lg:hidden flex justify-end">
          <div className="w-80 max-w-[90vw] bg-white border-l border-[#E5E9F0] h-full p-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E9F0]">
                <BrandLogo size="xs" subtitle="Workspace Menu" />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-[#5B6D85] hover:text-[#0B192C] bg-[#F4F7FB]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[15px] font-semibold transition ${
                        isActive
                          ? 'bg-[#3D74D9]/10 text-[#3D74D9]'
                          : 'text-[#5B6D85] hover:bg-[#F4F7FB]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#3D74D9]' : 'text-[#8F9FB5]'}`} />
                        <span>{item.label}</span>
                      </div>
                      <span className="flex items-center gap-1.5">
                        {item.isPremium && (
                          <span
                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[13px] font-bold uppercase tracking-wider leading-none ${
                              isPremiumUser
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {!isPremiumUser && <Lock className="w-3 h-3" />}
                            PRO
                          </span>
                        )}
                        {item.count !== undefined && (
                          <span className="text-[13px] px-2 py-0.5 rounded-full bg-white font-mono text-[#5B6D85] border border-[#E5E9F0]">
                            {item.count}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-[#E5E9F0] space-y-2">
                <button
                  onClick={() => {
                    setIsSettingsOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[15px] font-semibold text-[#5B6D85] hover:bg-[#F4F7FB] transition"
                >
                  <Settings className="w-4 h-4 text-[#8F9FB5]" />
                  <span>Business Settings</span>
                </button>
                <button
                  onClick={() => {
                    setIsSubscriptionOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[15px] font-semibold text-[#5B6D85] hover:bg-[#F4F7FB] transition"
                >
                  <Zap className="w-4 h-4 text-[#3D74D9]" />
                  <span>Plans & Pricing</span>
                </button>
                {!session ? (
                  <div className="pt-2 space-y-2">
                    <button
                      onClick={() => {
                        setLoginModalMode('login');
                        setIsLoginModalOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl text-base font-bold text-[#0B192C] bg-[#F4F7FB] border border-[#E5E9F0] hover:bg-[#E8EEF5] transition"
                    >
                      <span>Sign In</span>
                    </button>
                    <button
                      onClick={() => {
                        setLoginModalMode('register');
                        setIsLoginModalOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl text-base font-bold text-white bg-[#0B192C] hover:bg-[#1E3E62] transition shadow-xs"
                    >
                      <span>Register Business</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[15px] font-semibold text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Log out</span>
                  </button>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E9F0] text-[13px] text-[#5B6D85]">
              Mathorg V1 • Create. Send. Follow Up. Get Paid.
            </div>
          </div>
        </div>
      )}

      {/* Lead Editor Modal */}
      {isLeadModalOpen && (
        <LeadEditorModal
          isOpen={isLeadModalOpen}
          onClose={() => setIsLeadModalOpen(false)}
          lead={activeLead}
          state={state}
          business={state.business}
          existingProducts={state.products}
          onSaveLead={handleSaveLead}
          onConvertToQuote={handleConvertToQuoteForLead}
          onSaveProduct={handleSaveProduct}
        />
      )}

      {/* Service Request / Consumer Marketplace Portal Modal */}
      {isServiceRequestModalOpen && (
        <ServiceRequestModal
          isOpen={isServiceRequestModalOpen}
          onClose={() => setIsServiceRequestModalOpen(false)}
          business={state.business}
          onSubmitRequest={handleSubmitServiceRequest}
        />
      )}

      {/* Quote Editor Modal */}
      {isQuoteModalOpen && (
        <QuoteEditorModal
          isOpen={isQuoteModalOpen}
          onClose={() => setIsQuoteModalOpen(false)}
          quote={activeQuote}
          state={state}
          onSaveQuote={handleSaveQuote}
          onConvertToInvoice={handleConvertToInvoice}
          onOpenFollowUpModal={(q) => handleOpenFollowUpModal(q, null)}
          onSaveNewCustomer={handleSaveCustomer}
          onSaveProduct={handleSaveProduct}
          onIncrementAICount={handleIncrementAICount}
          initialAIPromptOpen={quoteInitialAIOpen}
        />
      )}

      {/* Invoice Editor Modal */}
      {isInvoiceModalOpen && (
        <InvoiceEditorModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          invoice={activeInvoice}
          state={state}
          onSaveInvoice={handleSaveInvoice}
          onSaveProduct={handleSaveProduct}
        />
      )}

      {/* Follow-Up Scheduler Modal */}
      {isFollowUpModalOpen && (
        <FollowUpModal
          isOpen={isFollowUpModalOpen}
          onClose={() => setIsFollowUpModalOpen(false)}
          quote={activeFollowUpQuote}
          existingFollowUp={activeFollowUpItem}
          business={state.business}
          onSaveFollowUp={handleSaveFollowUp}
        />
      )}

      {/* Matthew Message Drafting & Approval Modal */}
      {isMessageModalOpen && activeMessageTarget && (
        <MatthewMessageModal
          isOpen={isMessageModalOpen}
          onClose={() => {
            setIsMessageModalOpen(false);
            setActiveMessageTarget(null);
          }}
          target={activeMessageTarget}
          business={state.business}
          onCompleteFollowUp={(id) => handleUpdateFollowUpStatus(id, 'completed')}
          onSnoozeFollowUp={(id, days) => {
            setState((prev) => ({
              ...prev,
              followups: prev.followups.map((f) => {
                if (f.id === id) {
                  const d = new Date();
                  d.setDate(d.getDate() + days);
                  return { ...f, reminder_date: d.toISOString().split('T')[0], status: 'snoozed' as const };
                }
                return f;
              }),
            }));
          }}
          onMarkWonClosed={(target) => {
            if (target.targetType === 'lead') {
              handleUpdateLeadStatus(target.targetId, 'Won');
            } else if (target.targetType === 'quote') {
              handleUpdateQuoteStatus(target.targetId, 'Accepted');
            } else if (target.targetType === 'invoice') {
              handleMarkPaid(target.targetId);
            }
          }}
        />
      )}

      {/* Business Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          business={state.business}
          user={state.user}
          onSaveBusiness={handleSaveBusiness}
          onUpdateUser={handleUpdateUser}
          onResetData={handleResetData}
          onOpenVerificationModal={() => setIsVerificationModalOpen(true)}
          onViewPublicArticle={(slug) => navigateToBlog(slug)}
        />
      )}

      {/* Business Verification Modal */}
      {isVerificationModalOpen && (
        <BusinessVerificationModal
          isOpen={isVerificationModalOpen}
          onClose={() => setIsVerificationModalOpen(false)}
          business={state.business}
          onUpdateBusiness={handleSaveBusiness}
        />
      )}

      {/* Subscription Plans Modal */}
      {isSubscriptionOpen && (
        <SubscriptionModal
          isOpen={isSubscriptionOpen}
          onClose={() => setIsSubscriptionOpen(false)}
          state={state}
          onSelectPlan={handleSelectPlan}
        />
      )}

      {/* Login & Account Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onGuestAccess={() => {
          setIsGuest(true);
          setCurrentView('app');
        }}
      />

      {/* Privacy, Terms, Refund & Security Legal Modal */}
      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        type={legalModalType}
      />
    </div>
  );
}

export default App;
