import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Sparkles,
  MapPin,
  Calendar,
  DollarSign,
  ShieldCheck,
  Flame,
  Lock,
  Unlock,
  Building,
  CheckCircle2,
  Filter,
  ArrowRight,
  MessageSquare,
  FileText,
  Clock,
  Briefcase,
  Zap,
  RefreshCw,
  Layers,
  ExternalLink,
  UserCheck,
  RotateCcw,
  Check,
  AlertCircle,
  Sliders,
  Send,
  Phone,
  Trash2,
} from 'lucide-react';
import {
  Lead,
  BusinessProfile,
  PlanTier,
  CustomerRequest,
  CustomerRequestStatus,
  PublicProfessionalProfile,
  MatchedProfessionalCandidate,
} from '../types';
import { SERVICE_CATEGORIES, POPULAR_LOCATIONS } from '../data/marketplaceData';
import {
  formatTimeline,
  buildWhatsAppLink,
  createLeadIntroWhatsAppText,
  formatDate,
} from '../utils/formatters';
import {
  hasActiveSubscription,
  fetchCustomerRequests,
  updateCustomerRequestStatus,
  clearCustomerRequests,
  convertCustomerRequestToLead,
  fetchPublicProfessionals,
  matchProfessionalsForRequest,
} from '../lib/db';
import { seedVerifiedProfessionals } from '../data/professionalsData';
import { refreshMarketplaceRequestsWithMatthew } from '../data/commerceData';

interface FindLeadsViewProps {
  leads: Lead[];
  business: BusinessProfile;
  currentUserPlan: PlanTier;
  onUnlockLead: (lead: Lead) => void;
  onConvertToQuote: (lead: Lead) => void;
  onOpenServiceRequest: () => void;
  onOpenSubscription: () => void;
  onNewLeadCreated?: (lead: Lead) => void;
}

export const FindLeadsView: React.FC<FindLeadsViewProps> = ({
  leads,
  business,
  currentUserPlan,
  onUnlockLead,
  onConvertToQuote,
  onOpenServiceRequest,
  onOpenSubscription,
  onNewLeadCreated,
}) => {
  // Command Centre View Mode
  const [activeMode, setActiveMode] = useState<'requests' | 'leads'>('requests');

  // Customer Requests State
  const [customerRequests, setCustomerRequests] = useState<CustomerRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | CustomerRequestStatus>('all');
  const [requestSearchQuery, setRequestSearchQuery] = useState('');
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);

  // Directory Professionals for live matching preview
  const [directoryPros, setDirectoryPros] = useState<PublicProfessionalProfile[]>([]);
  const [seedingFeedback, setSeedingFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<'success' | 'error'>('success');
  const [isRefreshingMatthew, setIsRefreshingMatthew] = useState(false);
  const [isClearingRequests, setIsClearingRequests] = useState(false);
  const [pendingClearMode, setPendingClearMode] = useState<'outdated' | 'all' | null>(null);

  // Lead Feed State (Traditional marketplace leads)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [intentFilter, setIntentFilter] = useState<'all' | 'hot' | 'high'>('all');

  const isPaidPlan = hasActiveSubscription(
    business.id,
    currentUserPlan,
    business.subscription_status,
    business.subscription_expires_at
  );

  const showBanner = (msg: string, tone: 'success' | 'error' = 'success', durationMs = 5500) => {
    setFeedbackTone(tone);
    setSeedingFeedback(msg);
    if (durationMs > 0) {
      setTimeout(() => setSeedingFeedback(null), durationMs);
    }
  };

  // Load customer requests from Supabase & local cache
  const loadRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const data = await fetchCustomerRequests();
      setCustomerRequests(data);
    } catch (err) {
      console.warn('[Mathorg] Load requests notice:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  // Ask Matthew AI to search the database for new/unmatched requests & post them here
  const handleMatthewRefreshAndPost = async () => {
    setIsRefreshingMatthew(true);
    try {
      const res = await refreshMarketplaceRequestsWithMatthew({
        businessId: business.id,
        businessName: business.business_name,
        industry: business.industry,
        specialization: business.specialization,
        categories: business.categories_offered || [],
        location: [business.city, business.state].filter(Boolean).join(', ') || business.address,
        state: business.state,
        city: business.city,
      });
      await loadRequests();
      showBanner(res.summary || 'Matthew scanned the database for new customer requests.', 'success', 7000);
    } catch (err: any) {
      showBanner(err?.message || 'Unable to run Matthew database refresh right now.', 'error', 6000);
    } finally {
      setIsRefreshingMatthew(false);
    }
  };

  // Clear outdated (Closed / Converted / 7d+ old) or all requests
  const outdatedCount = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return customerRequests.filter((r) => {
      if (r.status === 'Closed' || r.status === 'Converted') return true;
      const ts = new Date(r.updated_at || r.created_at || 0).getTime();
      return Number.isFinite(ts) && ts > 0 && ts < cutoff;
    }).length;
  }, [customerRequests]);

  const handleConfirmClearRequests = async (mode: 'outdated' | 'all') => {
    setIsClearingRequests(true);
    try {
      const result = await clearCustomerRequests(mode, {
        olderThanDays: 7,
        currentRequests: customerRequests,
      });
      setCustomerRequests(result.requests);
      setPendingClearMode(null);
      if (mode === 'all') {
        showBanner(`Cleared ${result.clearedCount} request${result.clearedCount === 1 ? '' : 's'} from Buyers Marketplace.`, 'success');
      } else if (result.clearedCount > 0) {
        showBanner(`Cleared ${result.clearedCount} outdated or completed request${result.clearedCount === 1 ? '' : 's'}.`, 'success');
      } else {
        showBanner('No outdated requests older than 7 days or closed/converted were found. Use "Clear All" to reset the board.', 'success');
      }
    } catch (err: any) {
      showBanner(err?.message || 'Failed to clear requests.', 'error');
    } finally {
      setIsClearingRequests(false);
    }
  };

  // Load directory professionals for rules-based matching
  const loadDirectoryPros = async () => {
    try {
      const list = await fetchPublicProfessionals({ randomize: false });
      setDirectoryPros(list || []);
    } catch (err) {
      console.warn('[Mathorg] Load pros notice:', err);
    }
  };

  useEffect(() => {
    loadRequests();
    loadDirectoryPros();
  }, []);

  // Handle Seeding of Demo Directory Benchmark Professionals
  const handleSeedProfessionals = () => {
    const seeded = seedVerifiedProfessionals();
    setDirectoryPros(seeded);
    showBanner(`Successfully synchronized ${seeded.length} demo directory contractors (clearly labeled unverified demo records).`, 'success');
  };

  // Handle status update for a request
  const handleUpdateStatus = async (requestId: string, newStatus: CustomerRequestStatus) => {
    setUpdatingRequestId(requestId);
    try {
      await updateCustomerRequestStatus(requestId, newStatus, business.id);
      setCustomerRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: newStatus,
                contacted_by_business_ids: r.contacted_by_business_ids?.includes(business.id)
                  ? r.contacted_by_business_ids
                  : [...(r.contacted_by_business_ids || []), business.id],
                updated_at: new Date().toISOString(),
              }
            : r
        )
      );
    } catch (err) {
      console.error('Failed to update request status:', err);
    } finally {
      setUpdatingRequestId(null);
    }
  };

  // Handle converting request into business lead
  const handleClaimRequestAsLead = async (req: CustomerRequest) => {
    setUpdatingRequestId(req.id);
    try {
      const createdLead = await convertCustomerRequestToLead(business.id, req, undefined, {
        isLocked: !isPaidPlan,
      });
      if (createdLead && onNewLeadCreated) {
        onNewLeadCreated(createdLead);
      }
      await handleUpdateStatus(req.id, 'Contacted');
      showBanner(
        isPaidPlan
          ? `Request #${req.request_number} claimed and added to your Leads pipeline.`
          : `Request #${req.request_number} saved to your Leads pipeline (upgrade plan to unlock phone number and call).`,
        'success'
      );
    } catch (err: any) {
      showBanner(`Could not convert request: ${err?.message || 'Unknown error'}`, 'error');
    } finally {
      setUpdatingRequestId(null);
    }
  };

  // Filtered Customer Requests
  const filteredCustomerRequests = useMemo(() => {
    return customerRequests.filter((req) => {
      if (statusFilter !== 'all' && req.status !== statusFilter) {
        return false;
      }
      if (requestSearchQuery.trim()) {
        const q = requestSearchQuery.toLowerCase();
        const matchNum = req.request_number.toLowerCase().includes(q);
        const matchService = req.service_required.toLowerCase().includes(q);
        const matchLoc = req.location.toLowerCase().includes(q);
        const matchCustomer = req.customer_name.toLowerCase().includes(q);
        const matchPhone = isPaidPlan && (req.phone || '').includes(q);
        if (!matchNum && !matchService && !matchLoc && !matchCustomer && !matchPhone) {
          return false;
        }
      }
      return true;
    });
  }, [customerRequests, statusFilter, requestSearchQuery, isPaidPlan]);

  // Filtered marketplace leads for provider feed
  const marketplaceLeads = leads.filter((l) => l.source === 'marketplace');

  const filteredMarketplaceLeads = marketplaceLeads.filter((lead) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = lead.customer_name.toLowerCase().includes(q);
      const matchService = lead.service_required.toLowerCase().includes(q);
      const matchLoc = lead.location.toLowerCase().includes(q);
      const matchNotes = (lead.notes || '').toLowerCase().includes(q);
      if (!matchName && !matchService && !matchLoc && !matchNotes) return false;
    }

    if (selectedCategory !== 'all' && lead.service_category !== selectedCategory) {
      return false;
    }

    if (selectedLocation !== 'all' && !lead.location.includes(selectedLocation)) {
      return false;
    }

    if (intentFilter === 'hot' && lead.intent_score < 80) return false;
    if (intentFilter === 'high' && lead.intent_score < 60) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Marketplace & Command Centre Header */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0B192C] via-[#152744] to-[#1E3E62] text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[13px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>MatthOrg Marketplace & Matching Command Centre</span>
          </div>

          <h1 className="type-dashboard-title text-white">
            Customer Requests & Professional Distribution
          </h1>

          <p className="text-[15px] sm:text-base text-slate-300 leading-relaxed">
            Monitor incoming customer service requests, execute rules-based professional matching across Nigerian cities, track lifecycle status transitions, and dispatch notifications.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* View Mode Toggle */}
            <div className="inline-flex rounded-xl bg-white/10 p-1 border border-white/15">
              <button
                type="button"
                onClick={() => setActiveMode('requests')}
                className={`px-3.5 py-2 rounded-lg text-[14px] font-bold transition flex items-center gap-1.5 ${
                  activeMode === 'requests'
                    ? 'bg-white text-[#0B192C] shadow-sm'
                    : 'text-white hover:text-emerald-300'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Request Command Board ({customerRequests.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('leads')}
                className={`px-3.5 py-2 rounded-lg text-[14px] font-bold transition flex items-center gap-1.5 ${
                  activeMode === 'leads'
                    ? 'bg-white text-[#0B192C] shadow-sm'
                    : 'text-white hover:text-emerald-300'
                }`}
              >
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Buyer Lead Feed ({marketplaceLeads.length})</span>
              </button>
            </div>

            {/* Matthew DB Refresh & Post Action */}
            <button
              type="button"
              onClick={handleMatthewRefreshAndPost}
              disabled={isRefreshingMatthew}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500/25 hover:bg-blue-500/40 border border-blue-400/40 text-white text-[14px] font-bold transition cursor-pointer disabled:opacity-60"
              title="Ask Matthew AI to scan the database for new user requests and post them here"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-300 ${isRefreshingMatthew ? 'animate-spin' : ''}`} />
              <span>{isRefreshingMatthew ? 'Matthew Searching DB...' : 'Matthew: Refresh & Post Requests'}</span>
            </button>

            {/* Quick Seeding Tool */}
            <button
              type="button"
              onClick={handleSeedProfessionals}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[14px] font-bold transition cursor-pointer"
              title="Seed 8 demo directory trade companies (unverified benchmark records) for matching test"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Seed Demo Directory Contractors</span>
            </button>

            <button
              type="button"
              onClick={onOpenServiceRequest}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[14px] font-bold transition cursor-pointer"
            >
              <span>+ Post Customer Request</span>
            </button>
          </div>
        </div>
      </div>

      {/* Free Plan Preview Notice */}
      {!isPaidPlan && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-[14px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start sm:items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-bold">Free Plan Preview:</span>{' '}
              <span>
                You can browse all customer requests and buyer leads in Buyers Marketplace. Phone numbers stay masked until you upgrade so you can unlock and call customers directly.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenSubscription}
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[14px] font-bold shadow-sm transition cursor-pointer whitespace-nowrap"
          >
            <Unlock className="w-4 h-4" />
            <span>Upgrade to Call Buyers</span>
          </button>
        </div>
      )}

      {/* Feedback banner */}
      {seedingFeedback && (
        <div
          className={`p-4 rounded-2xl border text-[14px] flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-sm ${
            feedbackTone === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackTone === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span className="font-semibold">{seedingFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setSeedingFeedback(null)}
            className={`font-bold hover:underline cursor-pointer ${
              feedbackTone === 'error' ? 'text-rose-700' : 'text-emerald-700'
            }`}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* MODE 1: REQUEST COMMAND BOARD */}
      {activeMode === 'requests' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E5E9F0] shadow-sm space-y-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <div className="flex flex-1 items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#5B6D85] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="Search by Request #, service, location, or customer..."
                    value={requestSearchQuery}
                    onChange={(e) => setRequestSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[15px] text-[#0B192C] focus:bg-white focus:border-[#3D74D9] focus:outline-none transition"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleMatthewRefreshAndPost}
                  disabled={isRefreshingMatthew || isLoadingRequests}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-[14px] font-bold transition cursor-pointer disabled:opacity-60 whitespace-nowrap"
                  title="Ask Matthew AI to search the database for new user requests & post them"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshingMatthew || isLoadingRequests ? 'animate-spin text-blue-600' : ''}`} />
                  <span>{isRefreshingMatthew ? 'Searching DB...' : 'Matthew Refresh'}</span>
                </button>
              </div>

              {/* Clear Outdated / Clear All Actions */}
              {customerRequests.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {pendingClearMode ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-[14px]">
                      <span className="font-bold text-rose-900">
                        {pendingClearMode === 'all'
                          ? `Clear all ${customerRequests.length} requests?`
                          : `Clear ${outdatedCount} outdated requests?`}
                      </span>
                      <button
                        type="button"
                        disabled={isClearingRequests}
                        onClick={() => handleConfirmClearRequests(pendingClearMode)}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer disabled:opacity-60"
                      >
                        {isClearingRequests ? 'Clearing...' : 'Confirm'}
                      </button>
                      <button
                        type="button"
                        disabled={isClearingRequests}
                        onClick={() => setPendingClearMode(null)}
                        className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setPendingClearMode('outdated')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[14px] font-bold transition cursor-pointer whitespace-nowrap"
                        title="Remove Closed, Converted, or older-than-7-days requests"
                      >
                        <Trash2 className="w-4 h-4 text-amber-700" />
                        <span>Clear Outdated ({outdatedCount})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingClearMode('all')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-[#F8FAFC] hover:bg-rose-50 hover:border-rose-200 hover:text-rose-800 text-slate-700 text-[14px] font-bold transition cursor-pointer whitespace-nowrap"
                        title="Clear all current requests from Buyers Marketplace"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Clear All</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#F1F5F9]">
              <span className="text-[13px] font-bold text-[#64748B] mr-1">Status:</span>
              {(['all', 'Open', 'Matched', 'Contacted', 'Converted', 'Closed'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3.5 py-1.5 rounded-lg text-[14px] font-bold transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#0B192C] text-white shadow-xs'
                      : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                  }`}
                >
                  {st === 'all' ? 'All Requests' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Requests Board Grid */}
          <div className="space-y-4">
            {filteredCustomerRequests.map((req) => {
              // Run matching engine for this request
              const matches = matchProfessionalsForRequest(
                {
                  service: req.service_required,
                  location: req.location,
                  category: req.service_category,
                },
                directoryPros
              );

              const isClaimedByMe = req.contacted_by_business_ids?.includes(business.id);
              const topMatch = matches[0];

              // Direct WhatsApp notification link
              const whatsAppCustomerText = `Hello ${req.customer_name}, this is regarding your MatthOrg request #${req.request_number} for ${req.service_required} in ${req.location}.`;
              const customerWhatsAppLink = buildWhatsAppLink(req.whatsapp || req.phone, whatsAppCustomerText);

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-[#E5E9F0] p-5 shadow-sm hover:border-[#CBD5E1] transition space-y-4"
                >
                  {/* Top Bar: Request Number, Status Pill, Created Date */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono tabular-nums text-[13px] font-bold text-[#0B192C] px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                        {req.request_number}
                      </span>
                      <span className="text-[13px] font-bold text-[#5B6D85]">
                        {req.service_category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {/* Lifecycle Status Pill */}
                      <span
                        className={`text-[13px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                          req.status === 'Open'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : req.status === 'Matched'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : req.status === 'Contacted'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : req.status === 'Converted'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {req.status}
                      </span>

                      <span className="text-[13px] tabular-nums text-[#5B6D85]">
                        {formatDate(req.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Main Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    <div className="md:col-span-2 space-y-2.5">
                      <h3 className="font-heading text-lg sm:text-xl font-bold text-[#0B192C]">
                        {req.service_required}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-[14px] text-[#475569]">
                        <span className="flex items-center gap-1.5 font-semibold text-[#0B192C]">
                          <MapPin className="w-4 h-4 text-[#3D74D9]" />
                          <span>{req.location}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-[#64748B]" />
                          <span>{req.customer_name}</span>
                        </span>
                        {(req.whatsapp || req.phone) ? (
                          isPaidPlan ? (
                            <span className="flex items-center gap-1.5 text-emerald-700 font-mono tabular-nums font-bold">
                              <Phone className="w-4 h-4" />
                              <span>{req.whatsapp || req.phone}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[13px] text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md font-mono font-semibold">
                              <Lock className="w-3.5 h-3.5 text-amber-600" />
                              <span>+234 ••• ••• ••••</span>
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[13px] text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md font-semibold">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Via Matthew AI Search</span>
                          </span>
                        )}
                        {req.timeline && (
                          <span className="flex items-center gap-1.5 text-[#5B6D85]">
                            <Clock className="w-4 h-4" />
                            <span>{formatTimeline(req.timeline)}</span>
                          </span>
                        )}
                      </div>

                      {req.details && (
                        <p className="text-[14px] sm:text-[15px] text-[#475569] bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0] leading-relaxed">
                          "{req.details}"
                        </p>
                      )}
                    </div>

                    {/* Matching Engine Insights */}
                    <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-2.5">
                      <div className="flex items-center justify-between gap-2 text-[14px]">
                        <span className="font-heading font-bold text-[#0B192C] flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Matching Engine</span>
                        </span>
                        <span className="text-[13px] font-bold tabular-nums text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {matches.length} Eligible
                        </span>
                      </div>

                      {topMatch ? (
                        <div className="space-y-2 pt-1 text-[14px]">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-semibold text-[#0B192C] truncate max-w-[140px]">
                                {topMatch.professional.business_name}
                              </span>
                              {topMatch.professional.is_demo ? (
                                <span className="text-[13px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                                  Demo (Unverified)
                                </span>
                              ) : topMatch.isVerified ? (
                                <span className="inline-flex items-center gap-1 text-[13px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Verified</span>
                                </span>
                              ) : (
                                <span className="text-[13px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                                  Unverified
                                </span>
                              )}
                            </div>
                            <span className="font-mono tabular-nums text-[13px] font-bold text-emerald-700 shrink-0">
                              {topMatch.matchScore}% Match
                            </span>
                          </div>
                          <p className="text-[13px] text-[#5B6D85] truncate">
                            {topMatch.professional.city ? `${topMatch.professional.city}, ` : ''}{topMatch.professional.state}
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {topMatch.matchReasons.slice(0, 2).map((r, i) => (
                              <span key={i} className="text-[13px] bg-white border border-[#CBD5E1] px-2 py-0.5 rounded text-slate-600">
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[14px] text-slate-500 italic">
                          No matching local contractors registered yet.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Operational Action Strip */}
                  <div className="pt-3 border-t border-[#E5E9F0] flex flex-wrap items-center justify-between gap-3 text-[14px]">
                    {/* Status lifecycle transition selector */}
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#5B6D85]">Transition Status:</span>
                      <select
                        value={req.status}
                        disabled={updatingRequestId === req.id}
                        onChange={(e) => handleUpdateStatus(req.id, e.target.value as CustomerRequestStatus)}
                        className="py-1.5 px-3 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] text-[14px] font-bold text-[#0B192C] focus:bg-white cursor-pointer"
                      >
                        <option value="Open">1. Open / Submitted</option>
                        <option value="Matched">2. Matched with Pros</option>
                        <option value="Contacted">3. Contacted Buyer</option>
                        <option value="Converted">4. Converted to Deal</option>
                        <option value="Closed">5. Closed / Completed</option>
                      </select>
                    </div>

                    {/* Notification & Claim Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {!isPaidPlan ? (
                        <button
                          type="button"
                          onClick={onOpenSubscription}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[14px] font-bold transition shadow-xs cursor-pointer whitespace-nowrap"
                        >
                          <Lock className="w-4 h-4" />
                          <span>Upgrade to Call &amp; Unlock Phone</span>
                        </button>
                      ) : (req.phone || req.whatsapp) ? (
                        <>
                          <a
                            href={`tel:${(req.phone || req.whatsapp || '').replace(/[^\d+]/g, '')}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-bold transition shadow-xs whitespace-nowrap"
                          >
                            <Phone className="w-4 h-4" />
                            <span>Call Buyer</span>
                          </a>
                          <a
                            href={customerWhatsAppLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-bold transition shadow-xs whitespace-nowrap"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>Chat Customer</span>
                          </a>
                        </>
                      ) : (
                        <span className="text-[13px] text-[#5B6D85] font-medium px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                          Awaiting buyer phone
                        </span>
                      )}

                      {/* Convert to Lead for Business */}
                      <button
                        type="button"
                        disabled={updatingRequestId === req.id || isClaimedByMe}
                        onClick={() => handleClaimRequestAsLead(req)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[14px] font-bold transition cursor-pointer whitespace-nowrap ${
                          isClaimedByMe
                            ? 'bg-slate-100 text-slate-500 border border-slate-200'
                            : 'bg-[#0B192C] hover:bg-[#1E3E62] text-white shadow-xs'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        <span>{isClaimedByMe ? 'Already In Leads' : 'Claim as Lead'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Notification Honest Status Indicator */}
                  <div className="text-[13px] text-[#5B6D85] bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                    <span>
                      Source: <strong>{req.source === 'matthew_ai' ? 'Matthew AI Capture' : req.source === 'fulfilment' ? 'Matthew Fulfilment' : 'Direct Request'}</strong> •{' '}
                      {isPaidPlan ? 'Direct Call & WhatsApp Ready' : 'Phone Masked on Free Plan'}
                    </span>
                    <span className="font-mono tabular-nums text-slate-500">ID: {req.id}</span>
                  </div>
                </div>
              );
            })}

            {filteredCustomerRequests.length === 0 && (
              <div className="py-16 px-4 text-center bg-white rounded-3xl border border-dashed border-[#CBD5E1]">
                <Layers className="w-9 h-9 text-[#8F9FB5] mx-auto mb-2.5" />
                <h3 className="font-heading text-lg font-bold text-[#0B192C]">No Customer Requests Found</h3>
                <p className="text-[15px] text-[#5B6D85] mt-1.5 max-w-md mx-auto">
                  Submit a new request from the homepage or use the button below to test the database workflow.
                </p>
                <button
                  type="button"
                  onClick={onOpenServiceRequest}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[14px] font-bold transition cursor-pointer"
                >
                  + Post Customer Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: HIGH-INTENT BUYER LEAD FEED */}
      {activeMode === 'leads' && (
        <div className="space-y-6">
          {/* Filter & Search Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E9F0] shadow-sm space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="relative sm:col-span-2">
                <Search className="w-4 h-4 text-[#5B6D85] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search by service (e.g. Solar, CCTV, Cleaning), area..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[15px] text-[#0B192C] focus:bg-white focus:border-[#3D74D9] focus:outline-none transition"
                />
              </div>

              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[15px] text-[#0B192C] focus:bg-white focus:border-[#3D74D9] focus:outline-none transition"
                >
                  <option value="all">All Service Categories</option>
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[15px] text-[#0B192C] focus:bg-white focus:border-[#3D74D9] focus:outline-none transition"
                >
                  <option value="all">All Locations (Nigeria)</option>
                  <option value="Abuja">Abuja (FCT)</option>
                  <option value="Lagos">Lagos State</option>
                  <option value="Port Harcourt">Port Harcourt</option>
                  <option value="Ibadan">Ibadan</option>
                  <option value="Kano">Kano</option>
                </select>
              </div>
            </div>

            {/* Intent Score Filters & Matthew Refresh */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[14px] text-[#5B6D85] font-semibold">Intent Level:</span>
                <button
                  type="button"
                  onClick={() => setIntentFilter('all')}
                  className={`px-3.5 py-1.5 rounded-lg text-[14px] font-semibold transition cursor-pointer whitespace-nowrap ${
                    intentFilter === 'all'
                      ? 'bg-[#0B192C] text-white'
                      : 'text-[#5B6D85] bg-[#F1F5F9] hover:text-[#0B192C]'
                  }`}
                >
                  All Intent
                </button>
                <button
                  type="button"
                  onClick={() => setIntentFilter('hot')}
                  className={`px-3.5 py-1.5 rounded-lg text-[14px] font-semibold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    intentFilter === 'hot'
                      ? 'bg-amber-500 text-white'
                      : 'text-[#5B6D85] bg-[#F1F5F9] hover:text-[#0B192C]'
                  }`}
                >
                  <Flame className={`w-4 h-4 ${intentFilter === 'hot' ? 'text-white' : 'text-amber-500'}`} />
                  <span>🔥 Very High (&ge; 80)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIntentFilter('high')}
                  className={`px-3.5 py-1.5 rounded-lg text-[14px] font-semibold transition cursor-pointer whitespace-nowrap ${
                    intentFilter === 'high'
                      ? 'bg-emerald-600 text-white'
                      : 'text-[#5B6D85] bg-[#F1F5F9] hover:text-[#0B192C]'
                  }`}
                >
                  High &amp; Above (&ge; 60)
                </button>
              </div>

              <button
                type="button"
                onClick={handleMatthewRefreshAndPost}
                disabled={isRefreshingMatthew}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-[14px] font-bold transition cursor-pointer disabled:opacity-60 whitespace-nowrap"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshingMatthew ? 'animate-spin text-blue-600' : ''}`} />
                <span>{isRefreshingMatthew ? 'Matthew Scanning...' : 'Matthew: Scan DB & Post Requests'}</span>
              </button>
            </div>
          </div>

          {/* Leads Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredMarketplaceLeads.map((lead) => {
              const isLocked = !isPaidPlan || lead.is_locked;
              const rawPhone = lead.whatsapp || lead.phone;
              const displayPhone = isLocked ? '+234 ••• ••• ••••' : rawPhone || 'No phone provided';

              const whatsAppText = createLeadIntroWhatsAppText(
                lead.customer_name,
                business.business_name,
                lead.service_required,
                lead.location
              );
              const whatsAppLink = buildWhatsAppLink(lead.whatsapp || lead.phone, whatsAppText);

              return (
                <div
                  key={lead.id}
                  className="bg-white rounded-2xl border border-[#E5E9F0] p-5 sm:p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-mono tabular-nums font-bold text-[#5B6D85]">{lead.lead_number}</span>
                        <span className="text-[13px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {lead.service_category}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-bold tabular-nums text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-amber-600" />
                          <span>{lead.intent_score}/100 {lead.intent_level}</span>
                        </span>
                      </div>
                    </div>

                    <h3 className="font-heading text-lg sm:text-xl font-bold text-[#0B192C] mb-1.5 leading-snug">
                      {lead.service_required}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[14px] text-[#5B6D85] mb-3.5">
                      <span className="flex items-center gap-1.5 text-[#0B192C] font-semibold">
                        <MapPin className="w-4 h-4 text-[#3D74D9]" />
                        <span>{lead.location}</span>
                      </span>
                      {lead.property_type && (
                        <span className="flex items-center gap-1.5">
                          <Building className="w-4 h-4 text-[#8F9FB5]" />
                          <span>{lead.property_type}</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E5E9F0] mb-3.5">
                      <div>
                        <div className="text-[13px] uppercase font-bold text-[#5B6D85]">Budget Range</div>
                        <div className="font-heading text-[15px] font-extrabold tabular-nums text-emerald-700 mt-0.5">{lead.budget_formatted}</div>
                      </div>
                      <div>
                        <div className="text-[13px] uppercase font-bold text-[#5B6D85]">Timeline</div>
                        <div className="text-[14px] font-bold text-[#0B192C] mt-0.5">
                          {formatTimeline(lead.timeline)}
                        </div>
                      </div>
                    </div>

                    {lead.notes && (
                      <p className="text-[14px] text-[#5B6D85] mb-3.5 line-clamp-2 leading-relaxed">
                        {lead.notes}
                      </p>
                    )}

                    <div className="text-[14px] text-emerald-700 font-semibold mb-4 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{lead.freshness_label || '🔥 Verified Marketplace Buyer'}</span>
                    </div>
                  </div>

                  <div className="pt-3.5 border-t border-[#E5E9F0]">
                    {isLocked ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-[14px] text-[#5B6D85]">
                          <span className="flex items-center gap-1.5">
                            <Lock className="w-4 h-4 text-amber-600" /> Phone Hidden:
                          </span>
                          <span className="font-mono tabular-nums font-semibold text-amber-900">{displayPhone}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => (!isPaidPlan ? onOpenSubscription() : onUnlockLead(lead))}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-bold shadow-md transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                        >
                          <Unlock className="w-4 h-4" />
                          <span>{!isPaidPlan ? 'Upgrade to Call & Unlock Phone' : 'Unlock Verified Buyer Contact'}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-50 px-3.5 py-2.5 rounded-xl border border-emerald-200">
                          <div>
                            <div className="text-[14px] font-bold text-emerald-950">{lead.customer_name}</div>
                            <div className="text-[13px] font-mono tabular-nums text-emerald-800">{rawPhone || 'No phone provided'}</div>
                          </div>

                          <div className="flex items-center gap-2">
                            {rawPhone && (
                              <a
                                href={`tel:${rawPhone.replace(/[^\d+]/g, '')}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-bold shadow-sm transition whitespace-nowrap"
                              >
                                <Phone className="w-4 h-4" />
                                <span>Call</span>
                              </a>
                            )}
                            <a
                              href={whatsAppLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-bold shadow-sm transition whitespace-nowrap"
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onConvertToQuote(lead)}
                          className="w-full py-2.5 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[14px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Prepare Quotation for Client</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredMarketplaceLeads.length === 0 && (
              <div className="col-span-full py-16 px-4 text-center bg-white rounded-3xl border border-dashed border-[#CBD5E1]">
                <Sparkles className="w-9 h-9 text-[#8F9FB5] mx-auto mb-2.5" />
                <h3 className="font-heading text-lg font-bold text-[#0B192C]">No marketplace leads match your filter</h3>
                <p className="text-[15px] text-[#5B6D85] mt-1.5 max-w-md mx-auto">
                  Try selecting "All Categories" or "All Locations", or switch to the Request Command Board above.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
