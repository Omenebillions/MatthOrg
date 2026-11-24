import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  BusinessProfile,
  PublicProfessionalProfile,
  Lead,
  CatalogProduct,
  DiscoveryConversationMessage,
  DiscoveryConversationSession,
  MatchedServiceCandidate,
} from '../types';
import {
  ArrowRight,
  ShieldCheck,
  Menu,
  X,
  Phone,
  MessageCircle,
  Clock,
  Send,
  ThumbsUp,
  Bot,
  Plus,
  GitCompare,
  History,
  Trash2,
  Search,
  Megaphone,
  MapPin,
  Bookmark,
  CheckCircle2,
  Wrench,
} from 'lucide-react';
import { LegalModal, LegalDocType } from './LegalModal';
import { ProfessionalProfileModal } from './homepage/ProfessionalProfileModal';
import { QuickRequestModal } from './homepage/QuickRequestModal';
import { CustomerRequestTrackerModal } from './CustomerRequestTrackerModal';
import { fetchPublicProfessionals } from '../lib/db';
import { BrandLogo } from './common/BrandLogo';
import {
  createFulfilmentRequest,
  discoverWithMatthew,
  trackCommerceEvent,
} from '../data/commerceData';
import {
  ProductComparisonCard,
  ProductDetailModal,
  ProductEnquiryModal,
  ProductRecommendationCard,
} from './commerce/ProductCards';

export interface LandingPageProps {
  business: BusinessProfile;
  currentUser: User;
  initialService?: string;
  initialLocation?: string;
  onOpenNewQuote: (withAI?: boolean) => void;
  onOpenNewInvoice: () => void;
  onEnterApp: () => void;
  onPromptLogin: () => void;
  onPromptRegister?: () => void;
  onNewLeadCreated?: (lead: Lead) => void;
  onNavigateBusiness?: () => void;
  onNavigateBlog?: (slug?: string) => void;
  onNavigateServices?: (serviceSlug?: string, locationSlug?: string) => void;
  onNavigateLocations?: (locationSlug?: string) => void;
  onNavigateRecommend?: () => void;
}

const SUGGESTED_PROMPTS = [
  'Find me a 5KVA inverter under ₦800,000',
  'I need a plumber around Ikeja',
  'My gen no dey start in Surulere, Lagos',
  'I need someone to design a website for my company',
  'My refrigerator is not cooling in Lekki',
  'I need a graphic designer for a company logo',
  'Compare solar batteries',
];

const CHAT_SESSIONS_STORAGE_KEY = 'matthorg_discovery_chats_v1';
const SAVED_RESULTS_STORAGE_KEY = 'matthorg_saved_results_v1';

interface SavedMarketplaceItem {
  id: string;
  kind: 'product' | 'service' | 'professional';
  title: string;
  subtitle: string;
  priceText?: string;
  phone?: string;
  url?: string;
  savedAt: string;
}

function createEmptySession(initialPrompt?: string): DiscoveryConversationSession {
  const now = new Date().toISOString();
  return {
    id: `conv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: initialPrompt ? initialPrompt.slice(0, 48) : 'New Chat',
    created_at: now,
    updated_at: now,
    messages: [],
    accumulatedContext: {},
  };
}

export function LandingPage({
  initialService = '',
  initialLocation = '',
  onNewLeadCreated,
  onNavigateBusiness,
  onNavigateRecommend,
}: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [sessions, setSessions] = useState<DiscoveryConversationSession[]>(() => {
    try {
      const raw = localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [createEmptySession()];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions[0]?.id || '';
  });

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0] || createEmptySession();

  const [inputText, setInputText] = useState('');
  const [locationDraft, setLocationDraft] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [compareSelection, setCompareSelection] = useState<CatalogProduct[]>([]);
  const [publicProfessionals, setPublicProfessionals] = useState<PublicProfessionalProfile[]>([]);
  const [savedOpen, setSavedOpen] = useState(false);
  const [savedItems, setSavedItems] = useState<SavedMarketplaceItem[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_RESULTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Inline fulfilment registration drawer inside noResultsAction
  const [fulfilmentMessageId, setFulfilmentMessageId] = useState<string | null>(null);
  const [fulfilmentDraft, setFulfilmentDraft] = useState({
    customer_name: '',
    customer_phone: '',
    budget_max: '',
    details: '',
  });
  const [isSubmittingFulfilment, setIsSubmittingFulfilment] = useState(false);

  // Product Detail & Enquiry Modals
  const [detailProduct, setDetailProduct] = useState<{ product: CatalogProduct; campaignId?: string } | null>(null);
  const [enquiryProduct, setEnquiryProduct] = useState<{ product: CatalogProduct; campaignId?: string } | null>(null);

  // Customer Request & Professional Profile Modals
  const [selectedProfessional, setSelectedProfessional] = useState<PublicProfessionalProfile | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestPrefillService, setRequestPrefillService] = useState('');
  const [requestPrefillLocation, setRequestPrefillLocation] = useState('');

  // Tracker & Legal Modals
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<LegalDocType>('privacy');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPublicProfessionals()
      .then((list) => {
        if (Array.isArray(list)) setPublicProfessionals(list);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(sessions.slice(0, 20)));
    } catch {
      // ignore
    }
  }, [sessions]);

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_RESULTS_STORAGE_KEY, JSON.stringify(savedItems.slice(0, 50)));
    } catch {
      // ignore
    }
  }, [savedItems]);

  const toggleSaveItem = (item: Omit<SavedMarketplaceItem, 'savedAt'>) => {
    setSavedItems((prev) => {
      const exists = prev.some((s) => s.id === item.id);
      if (exists) return prev.filter((s) => s.id !== item.id);
      return [{ ...item, savedAt: new Date().toISOString() }, ...prev];
    });
  };

  useEffect(() => {
    if ((initialService || initialLocation) && activeSession.messages.length === 0) {
      const q = [initialService, initialLocation ? `in ${initialLocation}` : ''].filter(Boolean).join(' ');
      if (q) setInputText(q);
    }
  }, [initialService, initialLocation]);

  const scrollToLatest = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 80);
  };

  const handleGoToBusiness = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (onNavigateBusiness) onNavigateBusiness();
    else window.location.assign('/business');
  };

  const startNewChat = () => {
    const fresh = createEmptySession();
    setSessions((prev) => [fresh, ...prev.slice(0, 19)]);
    setActiveSessionId(fresh.id);
    setCompareSelection([]);
    setChatError(null);
    setHistoryOpen(false);
    inputRef.current?.focus();
  };

  const deleteChatSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (next.length === 0) {
        const fresh = createEmptySession();
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (id === activeSessionId) {
        setActiveSessionId(next[0].id);
      }
      return next;
    });
  };

  const handleToggleCompare = (product: CatalogProduct) => {
    setCompareSelection((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) return prev.filter((p) => p.id !== product.id);
      if (prev.length >= 4) return [...prev.slice(1), product];
      return [...prev, product];
    });
  };

  const sendDiscoveryMessage = async (
    overrideText?: string,
    explicitCompareIds?: string[]
  ) => {
    const textToSend = (overrideText ?? inputText).trim();
    if (!textToSend || isSearching) return;

    setChatError(null);
    if (!overrideText) setInputText('');

    const userMsg: DiscoveryConversationMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: textToSend,
      created_at: new Date().toISOString(),
    };

    const currentHistory = activeSession.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const targetSessionId = activeSession.id;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === targetSessionId
          ? {
              ...s,
              title: s.messages.length === 0 ? textToSend.slice(0, 48) : s.title,
              updated_at: new Date().toISOString(),
              messages: [...s.messages, userMsg],
            }
          : s
      )
    );
    scrollToLatest();
    setIsSearching(true);

    try {
      const res = await discoverWithMatthew({
        message: textToSend,
        sessionId: targetSessionId,
        history: currentHistory,
        accumulatedContext: activeSession.accumulatedContext,
        compareProductIds: explicitCompareIds,
        publicProfessionals,
      });

      const assistantMsg: DiscoveryConversationMessage = {
        id: `msg_a_${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        created_at: new Date().toISOString(),
        products: res.products,
        sponsoredProducts: res.sponsoredProducts,
        comparison: res.comparison,
        services: res.services,
        professionals: res.professionals,
        followUpQuestions: res.followUpQuestions,
        needsLocation: res.needsLocation,
        noResultsAction: res.noResultsAction,
        extractedContext: res.extractedContext,
        storedRequest: res.storedRequest,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? {
                ...s,
                updated_at: new Date().toISOString(),
                accumulatedContext: {
                  ...s.accumulatedContext,
                  ...res.extractedContext,
                },
                messages: [...s.messages, assistantMsg],
              }
            : s
        )
      );
      if (explicitCompareIds) {
        setCompareSelection([]);
      }
      scrollToLatest();
    } catch (err: any) {
      setChatError(err?.message || 'Unable to reach Matthew AI right now. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleTriggerCompareSelection = () => {
    if (compareSelection.length < 2) return;
    const names = compareSelection.map((p) => p.name).join(' vs ');
    sendDiscoveryMessage(
      `Compare these selected products: ${names}`,
      compareSelection.map((p) => p.id)
    );
  };

  const handleOpenSourcingRequest = (prefillService?: string, prefillLoc?: string) => {
    setRequestPrefillService(prefillService || '');
    setRequestPrefillLocation(prefillLoc || activeSession.accumulatedContext?.location || '');
    setIsRequestModalOpen(true);
  };

  const handleInlineFulfilmentSubmit = async (
    e: React.FormEvent,
    msg: DiscoveryConversationMessage
  ) => {
    e.preventDefault();
    if (!fulfilmentDraft.customer_name.trim() || !fulfilmentDraft.customer_phone.trim()) return;
    setIsSubmittingFulfilment(true);
    try {
      const actionMeta = msg.noResultsAction;
      const summary =
        actionMeta?.serviceOrProductNeeded ||
        activeSession.title ||
        'Custom Sourcing Request';
      const loc =
        actionMeta?.location ||
        activeSession.accumulatedContext?.location ||
        'Nigeria';
      const budgetVal = fulfilmentDraft.budget_max
        ? Number(fulfilmentDraft.budget_max)
        : activeSession.accumulatedContext?.budgetMax;

      const created = await createFulfilmentRequest({
        customer_name: fulfilmentDraft.customer_name.trim(),
        customer_phone: fulfilmentDraft.customer_phone.trim(),
        request_summary: summary,
        request_type: actionMeta?.requestType || activeSession.accumulatedContext?.domain || 'general',
        category: actionMeta?.category || activeSession.accumulatedContext?.category || 'General Sourcing',
        location: loc,
        budget_max: budgetVal,
        budget_formatted: budgetVal ? `Up to ₦${budgetVal.toLocaleString()}` : 'Open / Quote',
        details: fulfilmentDraft.details.trim() || undefined,
        conversation_session_id: activeSession.id,
      });

      const confirmMsg: DiscoveryConversationMessage = {
        id: `msg_a_${Date.now()}`,
        role: 'assistant',
        content: `Your sourcing & fulfilment request (${created.request_number}) has been registered for "${created.request_summary}" in ${created.location}. Our sourcing team will contact you on ${created.customer_phone} with verified matching options.`,
        created_at: new Date().toISOString(),
      };

      const targetSessionId = activeSession.id;
      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? { ...s, updated_at: new Date().toISOString(), messages: [...s.messages, confirmMsg] }
            : s
        )
      );
      setFulfilmentMessageId(null);
      setFulfilmentDraft({ customer_name: '', customer_phone: '', budget_max: '', details: '' });
      scrollToLatest();
    } catch (err: any) {
      setChatError(err?.message || 'Unable to register fulfilment request right now.');
    } finally {
      setIsSubmittingFulfilment(false);
    }
  };

  const ctx = activeSession.accumulatedContext || {};
  const hasContextPills = Boolean(ctx.budgetMax || ctx.location || ctx.category);

  return (
    <div className="min-h-screen bg-[#FAFBFD] text-[#0B192C] font-sans flex flex-col overflow-x-hidden">
      {/* ========================================================================= */}
      {/* MINIMAL CUSTOMER-FIRST TOP BAR                                            */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E9F0]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              startNewChat();
            }}
            className="flex items-center focus:outline-none shrink-0"
            title="MatthOrg — Ask Matthew"
          >
            <BrandLogo size="md" />
          </a>

          <div className="hidden sm:flex items-center gap-2.5 text-[15px]">
            <button
              type="button"
              onClick={() => setIsTrackerModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold text-[#475569] hover:text-[#0B192C] hover:bg-[#F1F5F9] transition cursor-pointer whitespace-nowrap"
            >
              <Clock className="w-4 h-4" />
              <span>Track Request</span>
            </button>
            <button
              type="button"
              onClick={() => (onNavigateRecommend ? onNavigateRecommend() : window.location.assign('/recommend'))}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold text-[#475569] hover:text-[#0B192C] hover:bg-[#F1F5F9] transition cursor-pointer whitespace-nowrap"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Recommend Artisan</span>
            </button>
            <button
              type="button"
              onClick={handleGoToBusiness}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[15px] font-bold transition cursor-pointer whitespace-nowrap"
            >
              <span>For Businesses</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile toggle */}
          <div className="flex items-center gap-1.5 sm:hidden">
            <button
              type="button"
              onClick={() => setHistoryOpen(!historyOpen)}
              className="p-2 rounded-xl text-[#0B192C] hover:bg-[#F1F5F9]"
              aria-label="Chat history"
            >
              <History className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#0B192C] hover:bg-[#F1F5F9]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-[#E5E9F0] bg-white px-4 py-3.5 space-y-2 text-[15px]">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setIsTrackerModalOpen(true);
              }}
              className="w-full text-left py-2.5 font-semibold text-[#0B192C] flex items-center gap-2"
            >
              <Clock className="w-4 h-4 text-[#5B6D85]" />
              <span>Track Request</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                if (onNavigateRecommend) onNavigateRecommend();
                else window.location.assign('/recommend');
              }}
              className="w-full text-left py-2.5 font-semibold text-[#0B192C] flex items-center gap-2"
            >
              <ThumbsUp className="w-4 h-4 text-[#5B6D85]" />
              <span>Recommend an Artisan</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                setMobileMenuOpen(false);
                handleGoToBusiness(e);
              }}
              className="w-full py-3 rounded-xl bg-[#0B192C] text-white text-base font-bold text-center"
            >
              For Businesses (Sign In / Sign Up)
            </button>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* CLEAN CUSTOMER "WHAT DO YOU WANT?" CONVERSATIONAL HOME                    */}
      {/* ========================================================================= */}
      <main id="top" className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col">
        <div className="flex-1 bg-white rounded-2xl border border-[#E5E9F0] flex flex-col overflow-hidden relative min-h-[78vh]">
          {/* Subtle Chat Controls Bar */}
          <div className="px-4 sm:px-6 py-3.5 border-b border-[#E5E9F0] flex items-center justify-between gap-2 bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0B192C] text-cyan-300 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <span className="font-heading text-base font-extrabold text-[#0B192C]">Matthew AI</span>
              <span className="text-[14px] text-[#5B6D85] hidden sm:inline">
                · Products, artisans, repairs & verified services
              </span>
            </div>

            <div className="flex items-center gap-2">
              {compareSelection.length > 0 && (
                <button
                  type="button"
                  onClick={handleTriggerCompareSelection}
                  disabled={compareSelection.length < 2 || isSearching}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[14px] font-bold transition cursor-pointer whitespace-nowrap ${
                    compareSelection.length >= 2
                      ? 'bg-[#3D74D9] hover:bg-[#2F62C2] text-white'
                      : 'bg-[#F1F5F9] text-[#5B6D85] cursor-not-allowed'
                  }`}
                >
                  <GitCompare className="w-4 h-4" />
                  <span>
                    {compareSelection.length >= 2
                      ? `Compare (${compareSelection.length})`
                      : 'Pick 1 more'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setSavedOpen(!savedOpen);
                  setHistoryOpen(false);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0B192C] text-[14px] font-semibold transition cursor-pointer whitespace-nowrap"
              >
                <Bookmark className="w-4 h-4" />
                <span className="hidden sm:inline">Saved ({savedItems.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setHistoryOpen(!historyOpen);
                  setSavedOpen(false);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0B192C] text-[14px] font-semibold transition cursor-pointer whitespace-nowrap"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">History ({sessions.length})</span>
              </button>

              <button
                type="button"
                onClick={startNewChat}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[14px] font-bold transition cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>New Chat</span>
              </button>
            </div>
          </div>

          {/* Slide-over Saved Results Drawer */}
          {savedOpen && (
            <div className="border-b border-[#E5E9F0] bg-[#FAFBFD] px-4 sm:px-6 py-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-[15px] font-bold text-[#0B192C]">
                <span>Saved Products & Service Providers ({savedItems.length})</span>
                <button
                  type="button"
                  onClick={() => setSavedOpen(false)}
                  className="text-sm text-[#5B6D85] hover:text-[#0B192C] cursor-pointer"
                >
                  Close
                </button>
              </div>
              {savedItems.length === 0 ? (
                <p className="text-[15px] text-[#5B6D85]">No saved results yet. Tap Save on any service or provider card.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {savedItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-between gap-2 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-[#0B192C] truncate">{item.title}</div>
                        <div className="text-[13px] text-[#5B6D85] truncate">
                          {item.subtitle}{item.priceText ? ` · ${item.priceText}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.phone && (
                          <a
                            href={`tel:${item.phone}`}
                            className="px-2.5 py-1.5 rounded-lg bg-[#0B192C] text-white text-[13px] font-bold"
                          >
                            Call
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleSaveItem(item)}
                          className="p-1.5 text-[#5B6D85] hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Slide-over Conversation History Drawer */}
          {historyOpen && (
            <div className="border-b border-[#E5E9F0] bg-[#FAFBFD] px-4 sm:px-6 py-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-[15px] font-bold text-[#0B192C]">
                <span>Saved Conversations</span>
                <button
                  type="button"
                  onClick={() => setHistoryOpen(false)}
                  className="text-sm text-[#5B6D85] hover:text-[#0B192C] cursor-pointer"
                >
                  Close
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {sessions.map((sess) => {
                  const isActive = sess.id === activeSession.id;
                  return (
                    <div
                      key={sess.id}
                      onClick={() => {
                        setActiveSessionId(sess.id);
                        setHistoryOpen(false);
                        setCompareSelection([]);
                      }}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm cursor-pointer border transition ${
                        isActive
                          ? 'bg-[#0B192C] text-white border-[#0B192C] font-bold'
                          : 'bg-white text-[#475569] border-[#E2E8F0] hover:border-[#0B192C]'
                      }`}
                    >
                      <span className="truncate max-w-[180px]">{sess.title}</span>
                      {sessions.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => deleteChatSession(sess.id, e)}
                          className="opacity-70 hover:opacity-100"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Remembered Context Strip */}
          {hasContextPills && (
            <div className="px-4 sm:px-6 py-2.5 bg-[#F8FAFC] border-b border-[#E5E9F0] flex flex-wrap items-center gap-2 text-[13px] text-[#475569]">
              <span className="font-bold text-[#0B192C]">Remembered:</span>
              {ctx.category && <span>{ctx.category}</span>}
              {ctx.budgetMax && (
                <>
                  <span>·</span>
                  <span>Budget ≤ <strong className="font-mono">₦{ctx.budgetMax.toLocaleString()}</strong></span>
                </>
              )}
              {ctx.location && (
                <>
                  <span>·</span>
                  <span><strong>{ctx.location}</strong></span>
                </>
              )}
            </div>
          )}

          {/* Chat Message Stream */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-8 py-6 space-y-6 bg-[#FAFBFD]">
            {activeSession.messages.length === 0 ? (
              <div className="w-full max-w-3xl mx-auto py-8 sm:py-14 space-y-8 text-center min-w-0">
                <div className="space-y-4">
                  <h1 className="type-hero text-[#0B192C]">
                    Hello, I'm Matthew. What are you looking for today?
                  </h1>
                  <p className="text-base sm:text-lg text-[#475569] max-w-2xl mx-auto leading-relaxed font-normal">
                    Whether it's a product, artisan, repair technician, digital creator, or business service — tell me what you need and I'll match verified results and prices.
                  </p>
                </div>

                {/* Clean Inline Search Input Right Under Welcome Headline too (synchronized with bottom bar) */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendDiscoveryMessage();
                  }}
                  className="w-full max-w-full flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded-2xl bg-white border border-[#CBD5E1] shadow-sm focus-within:border-[#0B192C] transition overflow-hidden"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="e.g. 5KVA inverter price, electrician in Lekki, my fridge is not cooling..."
                    className="w-full min-w-0 flex-1 px-4 py-3 text-base text-[#0B192C] placeholder-[#94A3B8] focus:outline-none bg-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSearching}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] disabled:opacity-50 text-white text-base font-bold transition cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    <span>Ask Matthew</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                </form>

                {/* Suggested Customer Queries */}
                <div className="space-y-3 text-left">
                  <div className="text-[13px] font-bold uppercase tracking-wider text-[#5B6D85] text-center">
                    Popular customer requests
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {SUGGESTED_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => sendDiscoveryMessage(prompt)}
                        className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] hover:border-[#0B192C] text-[14px] sm:text-[15px] font-medium text-[#0B192C] transition cursor-pointer"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-6">
                {activeSession.messages.map((msg) => {
                  if (msg.role === 'user') {
                    return (
                      <div key={msg.id} className="flex justify-end">
                        <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-sm bg-[#0B192C] text-white px-5 py-3.5 text-base leading-relaxed">
                          {msg.content}
                        </div>
                      </div>
                    );
                  }

                  const hasProducts = (msg.products || []).length > 0;
                  const hasSponsored = (msg.sponsoredProducts || []).length > 0;
                  const hasServices = (msg.services || []).length > 0;
                  const hasPros = (msg.professionals || []).length > 0;

                  return (
                    <div key={msg.id} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#0B192C] text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-4">
                        <div className="rounded-2xl rounded-tl-sm bg-white border border-[#E2E8F0] px-5 py-4 text-base text-[#0B192C] leading-relaxed">
                          {msg.content}
                        </div>

                        {msg.needsLocation && !activeSession.accumulatedContext?.location && (
                          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-3">
                            <div className="flex items-center gap-1.5 text-[15px] font-bold text-[#0B192C]">
                              <MapPin className="w-4 h-4 text-[#3D74D9]" />
                              <span>Share your Area & State (or Exact Address)</span>
                            </div>
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (!locationDraft.trim() || isSearching) return;
                                const loc = locationDraft.trim();
                                setLocationDraft('');
                                sendDiscoveryMessage(loc);
                              }}
                              className="flex flex-col sm:flex-row gap-2"
                            >
                              <input
                                type="text"
                                value={locationDraft}
                                onChange={(e) => setLocationDraft(e.target.value)}
                                placeholder="e.g. Ikeja, Lagos or 14 Admiralty Way, Lekki Phase 1, Lagos"
                                className="w-full min-w-0 flex-1 rounded-xl bg-white border border-[#E2E8F0] focus:border-[#0B192C] px-3.5 py-2.5 text-[15px] text-[#0B192C] placeholder-[#94A3B8] focus:outline-none"
                              />
                              <button
                                type="submit"
                                disabled={!locationDraft.trim() || isSearching}
                                className="px-5 py-2.5 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] disabled:opacity-50 text-white text-[15px] font-bold transition cursor-pointer shrink-0 whitespace-nowrap"
                              >
                                Use Location
                              </button>
                            </form>
                            <div className="flex flex-wrap gap-2">
                              {['Ikeja, Lagos', 'Lekki Phase 1, Lagos', 'Wuse 2, Abuja', 'Port Harcourt, Rivers'].map((locPreset) => (
                                <button
                                  key={locPreset}
                                  type="button"
                                  onClick={() => sendDiscoveryMessage(locPreset)}
                                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[13px] font-semibold text-[#334155] cursor-pointer"
                                >
                                  {locPreset}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {msg.comparison && (
                          <ProductComparisonCard
                            comparison={msg.comparison}
                            onVisitSeller={(prod) => {
                              trackCommerceEvent({ productId: prod.id, event: 'click' });
                              if (prod.product_url) {
                                window.open(prod.product_url, '_blank', 'noopener,noreferrer');
                              } else {
                                setDetailProduct({ product: prod });
                              }
                            }}
                            onEnquire={(prod) => setEnquiryProduct({ product: prod })}
                          />
                        )}

                        {hasProducts && (
                          <div className="space-y-3">
                            <div className="font-heading text-sm font-bold uppercase tracking-wider text-[#5B6D85]">
                              Matching Products ({msg.products!.length})
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                              {msg.products!.map((prod) => (
                                <ProductRecommendationCard
                                  key={prod.id}
                                  product={prod}
                                  isSelectedForCompare={compareSelection.some((c) => c.id === prod.id)}
                                  onToggleCompare={handleToggleCompare}
                                  onViewDetails={(p, cId) => setDetailProduct({ product: p, campaignId: cId })}
                                  onEnquire={(p, cId) => setEnquiryProduct({ product: p, campaignId: cId })}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {hasSponsored && (
                          <div className="space-y-3 pt-2 border-t border-[#E5E9F0]">
                            <div className="flex items-center justify-between text-[13px] font-bold uppercase tracking-wider text-amber-800">
                              <span>Sponsored Recommendation</span>
                              <span className="font-normal text-[#5B6D85] normal-case">Paid placement</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                              {msg.sponsoredProducts!.map((sp) => (
                                <ProductRecommendationCard
                                  key={`sp_${sp.id}`}
                                  product={sp}
                                  isSponsored
                                  campaignId={sp.campaign_id}
                                  isSelectedForCompare={compareSelection.some((c) => c.id === sp.id)}
                                  onToggleCompare={handleToggleCompare}
                                  onViewDetails={(p, cId) => setDetailProduct({ product: p, campaignId: cId })}
                                  onEnquire={(p, cId) => setEnquiryProduct({ product: p, campaignId: cId })}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {hasServices && (
                          <div className="space-y-3">
                            <div className="font-heading text-sm font-bold uppercase tracking-wider text-[#5B6D85]">
                              Matching Services ({msg.services!.length})
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                              {msg.services!.map(({ service: svc, matchScore, matchReasons, isVerified }: MatchedServiceCandidate) => {
                                const phone = svc.whatsapp || svc.phone || '';
                                const cleanPhone = phone.replace(/\D/g, '');
                                const waHref = cleanPhone
                                  ? `https://wa.me/${cleanPhone.startsWith('0') ? '234' + cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(
                                      `Hello ${svc.business_name}, Matthew AI matched your "${svc.service_name}" service on MatthOrg.`
                                    )}`
                                  : undefined;
                                const priceLabel =
                                  svc.price_min && svc.price_min > 0
                                    ? `${svc.pricing_type === 'Starting From' ? 'From ' : ''}₦${svc.price_min.toLocaleString()}${
                                        svc.price_max && svc.price_max > svc.price_min ? ` – ₦${svc.price_max.toLocaleString()}` : ''
                                      }`
                                    : svc.pricing_type || 'Request a Quote';
                                const isSaved = savedItems.some((s) => s.id === svc.id);

                                return (
                                  <div
                                    key={svc.id}
                                    className="p-4 rounded-2xl bg-white border border-[#E2E8F0] space-y-3"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <Wrench className="w-4 h-4 text-[#3D74D9] shrink-0" />
                                          <h4 className="font-heading text-lg font-bold text-[#0B192C] truncate">
                                            {svc.service_name}
                                          </h4>
                                          {isVerified && (
                                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                          )}
                                        </div>
                                        <div className="text-[14px] text-[#5B6D85] mt-0.5 truncate">
                                          {svc.business_name} · {svc.city || svc.state || (svc.locations_covered || [])[0] || 'Nigeria'}
                                        </div>
                                      </div>
                                      <span className="font-mono text-[15px] font-extrabold text-[#0B192C] shrink-0 tabular-nums">
                                        {priceLabel}
                                      </span>
                                    </div>

                                    {svc.description && (
                                      <p className="text-[15px] text-[#475569] line-clamp-2 leading-relaxed">{svc.description}</p>
                                    )}

                                    <div className="text-[13px] text-[#5B6D85]">
                                      {[svc.service_category, svc.estimated_turnaround, matchReasons?.[0]]
                                        .filter(Boolean)
                                        .join(' · ')}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F1F5F9]">
                                      {svc.phone && (
                                        <a
                                          href={`tel:${svc.phone}`}
                                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-sm font-bold"
                                        >
                                          <Phone className="w-4 h-4" />
                                          <span>Call</span>
                                        </a>
                                      )}
                                      {waHref && (
                                        <a
                                          href={waHref}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold"
                                        >
                                          <MessageCircle className="w-4 h-4" />
                                          <span>WhatsApp</span>
                                        </a>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleOpenSourcingRequest(
                                            svc.service_name,
                                            [svc.city, svc.state].filter(Boolean).join(', ')
                                          )
                                        }
                                        className="px-3.5 py-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0B192C] text-sm font-bold cursor-pointer"
                                      >
                                        Request Quote
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          toggleSaveItem({
                                            id: svc.id,
                                            kind: 'service',
                                            title: svc.service_name,
                                            subtitle: `${svc.business_name} (${svc.city || svc.state || 'Nigeria'})`,
                                            priceText: priceLabel,
                                            phone: svc.phone,
                                          })
                                        }
                                        className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl border text-sm font-bold cursor-pointer ${
                                          isSaved
                                            ? 'bg-amber-50 border-amber-300 text-amber-900'
                                            : 'bg-white border-[#E2E8F0] text-[#475569]'
                                        }`}
                                      >
                                        <Bookmark className="w-3.5 h-3.5" />
                                        <span>{isSaved ? 'Saved' : 'Save'}</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {hasPros && (
                          <div className="space-y-3">
                            <div className="font-heading text-sm font-bold uppercase tracking-wider text-[#5B6D85]">
                              Verified Professionals & Providers ({msg.professionals!.length})
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                              {msg.professionals!.map(({ professional: pro, matchScore, matchReasons, isVerified }) => {
                                const cleanPhone = (pro.whatsapp || pro.phone || '').replace(/\D/g, '');
                                const waHref = cleanPhone
                                  ? `https://wa.me/${cleanPhone.startsWith('0') ? '234' + cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(
                                      `Hello ${pro.business_name}, Matthew AI matched your profile on MatthOrg for my service request.`
                                    )}`
                                  : undefined;
                                const isSaved = savedItems.some((s) => s.id === pro.id);

                                return (
                                  <div
                                    key={pro.id}
                                    className="p-4 rounded-2xl bg-white border border-[#E2E8F0] space-y-3"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <h4 className="font-heading text-lg font-bold text-[#0B192C] truncate">
                                            {pro.business_name}
                                          </h4>
                                          {isVerified && (
                                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                          )}
                                        </div>
                                        <div className="text-[14px] text-[#5B6D85] mt-0.5">
                                          {pro.specialization || pro.industry} · {pro.city || pro.state || 'Nigeria'}
                                        </div>
                                      </div>
                                      <span className="font-mono text-[13px] font-bold text-emerald-700 shrink-0">
                                        {matchScore}% match
                                      </span>
                                    </div>

                                    {matchReasons?.length > 0 && (
                                      <p className="text-[13px] text-[#475569]">
                                        {matchReasons.slice(0, 2).join(' · ')}
                                      </p>
                                    )}

                                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F1F5F9]">
                                      {pro.phone && (
                                        <a
                                          href={`tel:${pro.phone}`}
                                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-sm font-bold"
                                        >
                                          <Phone className="w-4 h-4" />
                                          <span>Call</span>
                                        </a>
                                      )}
                                      {waHref && (
                                        <a
                                          href={waHref}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold"
                                        >
                                          <MessageCircle className="w-4 h-4" />
                                          <span>WhatsApp</span>
                                        </a>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => setSelectedProfessional(pro)}
                                        className="px-3.5 py-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0B192C] text-sm font-bold cursor-pointer"
                                      >
                                        View Profile
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          toggleSaveItem({
                                            id: pro.id,
                                            kind: 'professional',
                                            title: pro.business_name,
                                            subtitle: `${pro.specialization || pro.industry} · ${pro.city || pro.state || 'Nigeria'}`,
                                            phone: pro.phone,
                                          })
                                        }
                                        className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl border text-sm font-bold cursor-pointer ${
                                          isSaved
                                            ? 'bg-amber-50 border-amber-300 text-amber-900'
                                            : 'bg-white border-[#E2E8F0] text-[#475569]'
                                        }`}
                                      >
                                        <Bookmark className="w-3.5 h-3.5" />
                                        <span>{isSaved ? 'Saved' : 'Save'}</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {msg.noResultsAction && (
                          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-3">
                            {msg.storedRequest && (
                              <div className="flex items-center gap-2 text-[14px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 rounded-xl">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>
                                  Request <strong className="font-mono">#{msg.storedRequest.request_number}</strong> saved in the MatthOrg database for sourcing. Add your phone below so matched providers can reach you.
                                </span>
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-2.5">
                              {msg.noResultsAction.canBroaden && msg.noResultsAction.broadenPrompt && (
                                <button
                                  type="button"
                                  onClick={() => sendDiscoveryMessage(msg.noResultsAction!.broadenPrompt)}
                                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-[#CBD5E1] hover:border-[#0B192C] text-[15px] font-bold text-[#0B192C] cursor-pointer"
                                >
                                  <Search className="w-4 h-4" />
                                  <span>Broaden Search</span>
                                </button>
                              )}
                              {msg.noResultsAction.canRequestSourcing && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFulfilmentMessageId(
                                        fulfilmentMessageId === msg.id ? null : msg.id
                                      )
                                    }
                                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[15px] font-bold cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Yes, Register Request for Fulfilment</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleOpenSourcingRequest(
                                        msg.noResultsAction!.serviceOrProductNeeded,
                                        msg.noResultsAction!.location
                                      )
                                    }
                                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-[#CBD5E1] hover:border-[#0B192C] text-[#0B192C] text-[15px] font-bold cursor-pointer"
                                  >
                                    <Megaphone className="w-4 h-4" />
                                    <span>Open Full Request Form</span>
                                  </button>
                                </>
                              )}
                            </div>

                            {fulfilmentMessageId === msg.id && (
                              <form
                                onSubmit={(e) => handleInlineFulfilmentSubmit(e, msg)}
                                className="p-4 rounded-xl bg-white border border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-2 gap-3 text-[15px]"
                              >
                                <div className="sm:col-span-2 font-bold text-[#0B192C]">
                                  Register Fulfilment Request: {msg.noResultsAction.serviceOrProductNeeded || 'Custom Sourcing'}{' '}
                                  {msg.noResultsAction.location ? `(${msg.noResultsAction.location})` : ''}
                                </div>
                                <input
                                  required
                                  placeholder="Your Name *"
                                  value={fulfilmentDraft.customer_name}
                                  onChange={(e) =>
                                    setFulfilmentDraft((prev) => ({ ...prev, customer_name: e.target.value }))
                                  }
                                  className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
                                />
                                <input
                                  required
                                  placeholder="Phone / WhatsApp *"
                                  value={fulfilmentDraft.customer_phone}
                                  onChange={(e) =>
                                    setFulfilmentDraft((prev) => ({ ...prev, customer_phone: e.target.value }))
                                  }
                                  className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C] font-mono"
                                />
                                <input
                                  type="number"
                                  placeholder="Target Budget ₦ (optional)"
                                  value={fulfilmentDraft.budget_max}
                                  onChange={(e) =>
                                    setFulfilmentDraft((prev) => ({ ...prev, budget_max: e.target.value }))
                                  }
                                  className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C] font-mono"
                                />
                                <input
                                  placeholder="Extra specs / preferred timing (optional)"
                                  value={fulfilmentDraft.details}
                                  onChange={(e) =>
                                    setFulfilmentDraft((prev) => ({ ...prev, details: e.target.value }))
                                  }
                                  className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
                                />
                                <div className="sm:col-span-2 flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setFulfilmentMessageId(null)}
                                    className="px-4 py-2 text-[15px] text-[#5B6D85] font-semibold cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={isSubmittingFulfilment}
                                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[15px] font-bold cursor-pointer"
                                  >
                                    {isSubmittingFulfilment ? 'Registering...' : 'Confirm & Register'}
                                  </button>
                                </div>
                              </form>
                            )}
                          </div>
                        )}

                        {msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            {msg.followUpQuestions.map((fq) => (
                              <button
                                key={fq}
                                type="button"
                                onClick={() => sendDiscoveryMessage(fq)}
                                className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[14px] font-semibold text-[#334155] transition cursor-pointer"
                              >
                                {fq}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isSearching && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#0B192C] text-cyan-300 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-white border border-[#E2E8F0] px-5 py-3.5 text-[15px] text-[#475569] flex items-center gap-2.5">
                      <span className="w-4 h-4 border-2 border-[#0B192C] border-t-transparent rounded-full animate-spin" />
                      <span>Matthew AI is searching verified listings and professionals...</span>
                    </div>
                  </div>
                )}

                {chatError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[15px]">
                    {chatError}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Sticky Bottom Chat Input (shown once conversation starts) */}
          {activeSession.messages.length > 0 && (
            <div className="p-3 sm:p-4 bg-white border-t border-[#E5E9F0]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendDiscoveryMessage();
                }}
                className="max-w-4xl w-full mx-auto flex items-center gap-2 min-w-0"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Refine budget, ask to compare, or ask for anything else..."
                  className="w-full min-w-0 flex-1 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0B192C] focus:bg-white px-4 py-3 text-base text-[#0B192C] placeholder-[#94A3B8] focus:outline-none transition"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSearching}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#0B192C] hover:bg-[#1E3E62] disabled:opacity-50 text-white text-base font-bold transition cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <Send className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* MINIMAL CUSTOMER FOOTER                                                   */}
      {/* ========================================================================= */}
      <footer className="py-5 px-4 sm:px-6 text-center text-[14px] text-[#5B6D85]">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
          <span>© {new Date().getFullYear()} MatthOrg</span>
          <button
            type="button"
            onClick={() => {
              setLegalModalType('privacy');
              setLegalModalOpen(true);
            }}
            className="hover:text-[#0B192C] cursor-pointer"
          >
            Privacy
          </button>
          <button
            type="button"
            onClick={() => {
              setLegalModalType('terms');
              setLegalModalOpen(true);
            }}
            className="hover:text-[#0B192C] cursor-pointer"
          >
            Terms
          </button>
          <button
            type="button"
            onClick={handleGoToBusiness}
            className="font-semibold text-[#0B192C] hover:underline cursor-pointer"
          >
            For Businesses & Guides &rarr;
          </button>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}
      <ProductDetailModal
        product={detailProduct?.product || null}
        campaignId={detailProduct?.campaignId}
        onClose={() => setDetailProduct(null)}
        onEnquire={(p, cId) => setEnquiryProduct({ product: p, campaignId: cId })}
      />

      <ProductEnquiryModal
        product={enquiryProduct?.product || null}
        campaignId={enquiryProduct?.campaignId}
        onClose={() => setEnquiryProduct(null)}
      />

      <ProfessionalProfileModal
        professional={selectedProfessional}
        isOpen={Boolean(selectedProfessional)}
        onClose={() => setSelectedProfessional(null)}
        onRequestQuote={(pro) => {
          setSelectedProfessional(null);
          handleOpenSourcingRequest(
            pro.specialization || pro.business_name,
            pro.city ? `${pro.city}, ${pro.state}` : pro.state
          );
        }}
      />

      <QuickRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        prefilledService={requestPrefillService}
        prefilledLocation={requestPrefillLocation}
        onSuccessSubmit={(newLead) => {
          if (onNewLeadCreated) onNewLeadCreated(newLead);
        }}
      />

      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        type={legalModalType}
      />

      <CustomerRequestTrackerModal
        isOpen={isTrackerModalOpen}
        onClose={() => setIsTrackerModalOpen(false)}
        onSelectProfessional={(pro) => setSelectedProfessional(pro)}
        onRequestQuote={(s, l) => handleOpenSourcingRequest(s, l)}
      />
    </div>
  );
}
