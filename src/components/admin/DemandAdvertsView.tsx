import React, { useState, useEffect, useMemo } from 'react';
import {
  Megaphone,
  Search,
  Filter,
  MapPin,
  Calendar,
  Share2,
  Copy,
  Check,
  Send,
  MessageCircle,
  Phone,
  UserCheck,
  Sparkles,
  ArrowRight,
  Clock,
  AlertCircle,
  ThumbsUp,
  Trash2,
  ExternalLink,
  CheckCircle2,
  X,
} from 'lucide-react';
import { DemandAdvertCampaign, DemandCampaignStatus, CustomerRequest } from '../../types';
import {
  fetchDemandCampaigns,
  updateDemandCampaign,
  deleteDemandCampaign,
  generateDemandAdCopies,
} from '../../data/demandCampaignsData';
import { BrandLogo } from '../common/BrandLogo';
import { NIGERIAN_STATES } from '../../data/recommendationsData';
import { fetchCustomerRequests } from '../../lib/db';

interface DemandAdvertsViewProps {
  onNavigateToOutreach?: () => void;
  onNavigateToArtisans?: () => void;
  onNavigateToMarketplace?: () => void;
  onOpenRecommendWall?: () => void;
}

export const DemandAdvertsView: React.FC<DemandAdvertsViewProps> = ({
  onNavigateToOutreach,
  onNavigateToArtisans,
  onNavigateToMarketplace,
  onOpenRecommendWall,
}) => {
  const [campaigns, setCampaigns] = useState<DemandAdvertCampaign[]>([]);
  const [customerRequests, setCustomerRequests] = useState<CustomerRequest[]>([]);
  const [viewMode, setViewMode] = useState<'demand_adverts' | 'customer_requests'>('demand_adverts');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DemandCampaignStatus>('all');
  const [selectedState, setSelectedState] = useState('all');

  // Modal states
  const [selectedCampaign, setSelectedCampaign] = useState<DemandAdvertCampaign | null>(null);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  // Connect artisan form
  const [artisanNameInput, setArtisanNameInput] = useState('');
  const [artisanPhoneInput, setArtisanPhoneInput] = useState('');
  const [connectNotes, setConnectNotes] = useState('');

  // Copy feedbacks
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Load campaigns and requests
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [campaignData, requestData] = await Promise.all([
        fetchDemandCampaigns(),
        fetchCustomerRequests(),
      ]);
      setCampaigns(campaignData || []);
      setCustomerRequests(requestData || []);
    } catch (err) {
      console.error('Failed to load demand campaigns & requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!isAdModalOpen && !isConnectModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAdModalOpen(false);
        setIsConnectModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAdModalOpen, isConnectModalOpen]);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // KPIs
  const totalCampaigns = campaigns.length;
  const totalRequestsCount = customerRequests.length;
  const needsAdCount = campaigns.filter((c) => c.campaign_status === 'ad_needed').length;
  const adLaunchedCount = campaigns.filter((c) => c.campaign_status === 'ad_launched').length;
  const proAcquiredCount = campaigns.filter((c) => c.campaign_status === 'pro_acquired').length;
  const connectedCount = campaigns.filter((c) => c.campaign_status === 'connected_to_customer').length;

  // Filtered list
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((item) => {
      if (statusFilter !== 'all' && item.campaign_status !== statusFilter) {
        return false;
      }
      if (selectedState !== 'all' && item.state?.toLowerCase() !== selectedState.toLowerCase() && !item.location.toLowerCase().includes(selectedState.toLowerCase())) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesService = item.service_required.toLowerCase().includes(q);
        const matchesLoc = item.location.toLowerCase().includes(q);
        const matchesCust = item.customer_name.toLowerCase().includes(q);
        const matchesRef = item.request_number.toLowerCase().includes(q);
        if (!matchesService && !matchesLoc && !matchesCust && !matchesRef) {
          return false;
        }
      }
      return true;
    });
  }, [campaigns, statusFilter, selectedState, searchQuery]);

  // Handle Mark as Ad Launched
  const handleMarkAdLaunched = async (
    campaign: DemandAdvertCampaign,
    channel: 'whatsapp_broadcast' | 'instagram_meta' | 'sms_union' = 'whatsapp_broadcast'
  ) => {
    const updated = await updateDemandCampaign(campaign.id, {
      campaign_status: 'ad_launched',
      campaign_channel: channel,
      campaign_launched_at: new Date().toISOString(),
    });
    if (updated) {
      setCampaigns((prev) => prev.map((c) => (c.id === campaign.id ? updated : c)));
      showNotice(`Campaign for "${campaign.service_required} in ${campaign.location}" marked as Launched!`);
      if (selectedCampaign?.id === campaign.id) {
        setSelectedCampaign(updated);
      }
    }
  };

  // Handle Connect to Customer
  const handleConnectCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;

    if (!artisanNameInput.trim() || !artisanPhoneInput.trim()) {
      alert('Please provide the artisan/professional name and phone number.');
      return;
    }

    const updated = await updateDemandCampaign(selectedCampaign.id, {
      campaign_status: 'connected_to_customer',
      connected_artisan_name: artisanNameInput.trim(),
      connected_artisan_phone: artisanPhoneInput.trim(),
      connected_at: new Date().toISOString(),
      notes: connectNotes.trim() || selectedCampaign.notes,
    });

    if (updated) {
      setCampaigns((prev) => prev.map((c) => (c.id === selectedCampaign.id ? updated : c)));
      showNotice(`Successfully connected ${artisanNameInput} with ${selectedCampaign.customer_name}!`);
      setIsConnectModalOpen(false);

      // Offer direct WhatsApp introduction launch
      const custPhone = (selectedCampaign.customer_whatsapp || selectedCampaign.customer_phone || '').replace(/[^0-9]/g, '');
      if (custPhone) {
        const introText = encodeURIComponent(
          `Hello ${selectedCampaign.customer_name},\n\nGreat news regarding your MatthOrg request #${selectedCampaign.request_number} for *${selectedCampaign.service_required}* in *${selectedCampaign.location}*.\n\nWe have verified and connected *${artisanNameInput.trim()}* (${artisanPhoneInput.trim()}) to handle your job.\n\nThey have been briefed and will reach out to you shortly to finalize project details.`
        );
        window.open(`https://wa.me/${custPhone}?text=${introText}`, '_blank', 'noopener,noreferrer');
      }
    }
  };

  // Handle Delete
  const handleDelete = async (campaign: DemandAdvertCampaign) => {
    if (!window.confirm(`Are you sure you want to remove request #${campaign.request_number}?`)) {
      return;
    }
    await deleteDemandCampaign(campaign.id);
    setCampaigns((prev) => prev.filter((c) => c.id !== campaign.id));
    showNotice(`Removed campaign #${campaign.request_number}.`);
  };

  // Clipboard helper
  const handleCopy = (text: string, sectionKey: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedSection(sectionKey);
      setTimeout(() => setCopiedSection(null), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Notice Toast */}
      {actionNotice && (
        <div className="p-4 bg-slate-900 text-white text-[14px] font-semibold rounded-xl flex items-center justify-between shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button type="button" onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <BrandLogo size="xs" showText={false} />
            <span className="text-[13px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200/60">
              Demand Acquisition Engine
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-[14px] text-slate-500">Unfulfilled Search Campaigns</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Megaphone className="w-6 h-6 text-amber-600 shrink-0" />
            Demand Adverts & Pro Acquisition
          </h1>
          <p className="text-[15px] text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
            When customers search for an artisan or service in an area where no pro is currently registered, the engine logs the demand here. Generate targeted WhatsApp broadcasts, social media adverts, and flyer campaigns to recruit pros and fulfill the request.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {onNavigateToOutreach && (
            <button
              type="button"
              onClick={onNavigateToOutreach}
              className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[14px] font-bold rounded-xl transition-colors border border-blue-200 inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Artisan Outreach ({totalCampaigns})</span>
            </button>
          )}
          {onOpenRecommendWall && (
            <button
              type="button"
              onClick={onOpenRecommendWall}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-[14px] font-semibold rounded-xl transition-colors border border-slate-300 inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Public Directory</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode Switcher: Demand Sourcing Adverts vs All Customer Service Requests */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setViewMode('demand_adverts')}
          className={`px-4 py-2 rounded-xl text-[14px] font-bold transition flex items-center gap-2 whitespace-nowrap ${
            viewMode === 'demand_adverts'
              ? 'bg-[#0B192C] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Megaphone className="w-4 h-4 text-amber-400" />
          <span>Demand Sourcing Adverts ({totalCampaigns})</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('customer_requests')}
          className={`px-4 py-2 rounded-xl text-[14px] font-bold transition flex items-center gap-2 whitespace-nowrap ${
            viewMode === 'customer_requests'
              ? 'bg-[#0B192C] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>Incoming Service Enquiries ({totalRequestsCount})</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[13px] font-bold uppercase tracking-wider text-slate-500">Total Unfulfilled</p>
          <p className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tabular-nums">{totalCampaigns}</p>
          <span className="text-[13px] text-slate-500">Active customer searches</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <p className="text-[13px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            Ad Needed
          </p>
          <p className="font-heading text-2xl sm:text-3xl font-extrabold text-amber-900 mt-1 tabular-nums">{needsAdCount}</p>
          <span className="text-[13px] text-amber-700">Requires local advert</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-blue-200 bg-blue-50/20 shadow-2xs">
          <p className="text-[13px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
            <Megaphone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            Ad Launched
          </p>
          <p className="font-heading text-2xl sm:text-3xl font-extrabold text-blue-900 mt-1 tabular-nums">{adLaunchedCount}</p>
          <span className="text-[13px] text-blue-600">Active broadcasts</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-purple-200 bg-purple-50/20 shadow-2xs">
          <p className="text-[13px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            Pro Acquired
          </p>
          <p className="font-heading text-2xl sm:text-3xl font-extrabold text-purple-900 mt-1 tabular-nums">{proAcquiredCount}</p>
          <span className="text-[13px] text-purple-600">Artisan registered</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <p className="text-[13px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            Connected
          </p>
          <p className="font-heading text-2xl sm:text-3xl font-extrabold text-emerald-900 mt-1 tabular-nums">{connectedCount}</p>
          <span className="text-[13px] text-emerald-600">Customer matched</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Free text search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trade, town, state, or client..."
              className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* State selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[15px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All States</option>
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status segmentation buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[14px]">
          {[
            { id: 'all', label: `All Requests (${totalCampaigns})` },
            { id: 'ad_needed', label: `Ad Needed (${needsAdCount})` },
            { id: 'ad_launched', label: `Ad Launched (${adLaunchedCount})` },
            { id: 'pro_acquired', label: `Pro Acquired (${proAcquiredCount})` },
            { id: 'connected_to_customer', label: `Connected (${connectedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`shrink-0 px-3.5 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns List (When in demand_adverts viewMode) */}
      {viewMode === 'demand_adverts' && (
        isLoading ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[15px] text-slate-500 font-medium">Scanning demand acquisition database...</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-lg font-bold text-slate-900">No Unfulfilled Search Requests</h3>
            <p className="text-[15px] text-slate-500 max-w-md mx-auto leading-relaxed">
              Every customer search has matching professionals in our database! When a customer searches for a trade in an area without a pro, it will appear here automatically.
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCampaigns.map((item) => {
            const isAdLaunched = item.campaign_status === 'ad_launched';
            const isConnected = item.campaign_status === 'connected_to_customer';
            const isProAcquired = item.campaign_status === 'pro_acquired';
            const isAdNeeded = item.campaign_status === 'ad_needed';

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar: Status + Reference Code */}
                  <div className="flex items-center justify-between gap-2 text-[13px]">
                    <span className="font-mono text-[13px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded tabular-nums">
                      {item.request_number}
                    </span>

                    <span
                      className={`text-[13px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full whitespace-nowrap ${
                        isAdNeeded
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : isAdLaunched
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : isProAcquired
                          ? 'bg-purple-100 text-purple-800 border border-purple-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {item.campaign_status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Service & Location Headline */}
                  <div>
                    <h3 className="font-heading text-lg font-bold text-slate-900 tracking-tight leading-snug">
                      {item.service_required}
                    </h3>
                    <p className="text-[14px] text-slate-600 font-semibold flex items-center gap-1.5 mt-1">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{item.location}</span>
                    </p>
                  </div>

                  {/* Customer Information Card */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-[14px] text-slate-600 space-y-1">
                    <p>
                      <strong className="text-slate-800">Customer:</strong> {item.customer_name}
                    </p>
                    <p className="tabular-nums">
                      <strong className="text-slate-800">Phone:</strong> {item.customer_phone}
                      {item.customer_whatsapp && item.customer_whatsapp !== item.customer_phone && (
                        <span> (WA: {item.customer_whatsapp})</span>
                      )}
                    </p>
                    {item.budget_formatted && (
                      <p>
                        <strong className="text-slate-800">Budget:</strong> {item.budget_formatted}
                      </p>
                    )}
                    <p className="text-[13px] text-slate-500 pt-1.5 border-t border-slate-200/60 tabular-nums">
                      Logged {new Date(item.created_at).toLocaleDateString()} at{' '}
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Connected Pro Badge if available */}
                  {item.connected_artisan_name && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[14px] text-emerald-950 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[13px] font-bold uppercase text-emerald-700 block">Connected Pro</span>
                        <strong className="font-bold">{item.connected_artisan_name}</strong>
                        {item.connected_artisan_phone && (
                          <span className="text-[13px] block text-emerald-800 tabular-nums">{item.connected_artisan_phone}</span>
                        )}
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Launch / View Advert Campaign */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCampaign(item);
                        setIsAdModalOpen(true);
                      }}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[13px] rounded-xl shadow-xs transition inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Megaphone className="w-3.5 h-3.5" />
                      <span>{isAdLaunched ? 'View Ad' : 'Launch Ad'}</span>
                    </button>

                    {/* Connect to Customer Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCampaign(item);
                        setArtisanNameInput(item.connected_artisan_name || '');
                        setArtisanPhoneInput(item.connected_artisan_phone || '');
                        setConnectNotes(item.notes || '');
                        setIsConnectModalOpen(true);
                      }}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[13px] rounded-xl transition inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isConnected ? 'Update Pro' : 'Connect Pro'}</span>
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Remove demand record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* CUSTOMER SERVICE REQUESTS LIST (When in customer_requests viewMode) */}
      {viewMode === 'customer_requests' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900">All Registered Customer Enquiries</h3>
              <p className="text-[14px] text-slate-500">Live service enquiries captured via homepage Matthew AI discovery</p>
            </div>
            <span className="text-[13px] font-mono font-bold px-3 py-1 rounded-md bg-blue-100 text-blue-800 tabular-nums whitespace-nowrap">
              {customerRequests.length} Total Enquiries
            </span>
          </div>

          {customerRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-[15px]">
              No customer requests logged yet. Search on the homepage to register customer enquiries.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[15px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[13px] font-bold">
                  <tr>
                    <th className="py-3 px-4">Ref Code</th>
                    <th className="py-3 px-4">Service & Property</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 text-[14px] tabular-nums">
                        {req.request_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{req.service_required}</span>
                        {req.property_type && (
                          <span className="text-[13px] text-slate-500 capitalize">{req.property_type} property</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {req.location}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 block">{req.customer_name}</span>
                        <span className="text-slate-500 font-mono text-[13px] tabular-nums">{req.phone || req.whatsapp || 'No phone'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[13px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 uppercase whitespace-nowrap">
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[14px] tabular-nums">
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ADVERT GENERATOR & CAMPAIGN MODAL */}
      {isAdModalOpen && selectedCampaign && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsAdModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-amber-50/90 shrink-0 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <BrandLogo size="xs" showText={false} />
                <div className="min-w-0">
                  <span className="text-[13px] font-bold uppercase tracking-wider text-amber-800 block">
                    Auto-Generated Advert Campaign
                  </span>
                  <h2 className="font-heading text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-0.5 truncate">
                    {selectedCampaign.service_required} in {selectedCampaign.location}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdModalOpen(false)}
                aria-label="Close modal"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-[14px] font-bold rounded-xl cursor-pointer shrink-0 whitespace-nowrap"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Campaign Quick Summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-[14px] text-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="tabular-nums">
                    <strong className="text-slate-900">Job Ref:</strong> {selectedCampaign.request_number}
                  </p>
                  <p className="tabular-nums">
                    <strong className="text-slate-900">Client:</strong> {selectedCampaign.customer_name} ({selectedCampaign.customer_phone})
                  </p>
                </div>
                <div>
                  <span className="text-[13px] uppercase font-extrabold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md whitespace-nowrap">
                    Status: {selectedCampaign.campaign_status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* 1. WHATSAPP BROADCAST ADVERT */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[14px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    1. WhatsApp Status & Group Broadcast Copy
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedCampaign.ad_copy_whatsapp, 'whatsapp')}
                      className="text-[13px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition flex items-center gap-1 whitespace-nowrap"
                    >
                      {copiedSection === 'whatsapp' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSection === 'whatsapp' ? 'Copied!' : 'Copy WhatsApp Copy'}</span>
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(selectedCampaign.ad_copy_whatsapp)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleMarkAdLaunched(selectedCampaign, 'whatsapp_broadcast')}
                      className="text-[13px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-lg transition flex items-center gap-1 shadow-2xs whitespace-nowrap"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Launch to WhatsApp</span>
                    </a>
                  </div>
                </div>
                <textarea
                  readOnly
                  rows={6}
                  value={selectedCampaign.ad_copy_whatsapp}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-mono text-slate-800 leading-relaxed focus:outline-none"
                />
              </div>

              {/* 2. SOCIAL MEDIA & INSTAGRAM/META AD COPY */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[14px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-blue-600" />
                    2. Social Media / Instagram / Facebook Caption
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedCampaign.ad_copy_social, 'social')}
                    className="text-[13px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition flex items-center gap-1 whitespace-nowrap"
                  >
                    {copiedSection === 'social' ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'social' ? 'Copied!' : 'Copy Social Copy'}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={5}
                  value={selectedCampaign.ad_copy_social}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-mono text-slate-800 leading-relaxed focus:outline-none"
                />
              </div>

              {/* 3. SMS BROADCAST FOR ARTISAN ASSOCIATIONS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[14px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-slate-500" />
                    3. SMS Blast / Union Association Dispatch
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedCampaign.ad_copy_sms, 'sms')}
                    className="text-[13px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1 whitespace-nowrap"
                  >
                    {copiedSection === 'sms' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'sms' ? 'Copied!' : 'Copy SMS'}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={2}
                  value={selectedCampaign.ad_copy_sms}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-mono text-slate-800 leading-relaxed focus:outline-none"
                />
              </div>

              {/* Status Update Button */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3">
                <p className="text-[14px] text-slate-500">
                  Marking as launched records timestamp and notifies admin team.
                </p>
                <button
                  type="button"
                  onClick={() => handleMarkAdLaunched(selectedCampaign)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[14px] rounded-xl transition shadow-xs whitespace-nowrap"
                >
                  Mark Campaign as Launched
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONNECT PRO TO CUSTOMER MODAL */}
      {isConnectModalOpen && selectedCampaign && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsConnectModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-emerald-50/90 shrink-0 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <BrandLogo size="xs" showText={false} />
                <div className="min-w-0">
                  <span className="text-[13px] font-bold uppercase tracking-wider text-emerald-800 block tabular-nums">
                    Fulfill Request #{selectedCampaign.request_number}
                  </span>
                  <h2 className="font-heading text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">
                    Connect Pro with {selectedCampaign.customer_name}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConnectModalOpen(false)}
                aria-label="Close modal"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-[14px] font-bold rounded-xl cursor-pointer shrink-0 whitespace-nowrap"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>

            <form onSubmit={handleConnectCustomer} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 space-y-1">
                <p>
                  <strong className="text-slate-900">Required Trade:</strong> {selectedCampaign.service_required}
                </p>
                <p>
                  <strong className="text-slate-900">Location:</strong> {selectedCampaign.location}
                </p>
                <p className="tabular-nums">
                  <strong className="text-slate-900">Customer Phone:</strong> {selectedCampaign.customer_phone}
                </p>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Artisan / Professional Name *
                </label>
                <input
                  type="text"
                  required
                  value={artisanNameInput}
                  onChange={(e) => setArtisanNameInput(e.target.value)}
                  placeholder="e.g. Engr. Tunde Solar Tech"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Artisan Phone / WhatsApp Number *
                </label>
                <input
                  type="text"
                  required
                  value={artisanPhoneInput}
                  onChange={(e) => setArtisanPhoneInput(e.target.value)}
                  placeholder="e.g. +234 803 123 4567"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Notes & Job Scope
                </label>
                <textarea
                  rows={3}
                  value={connectNotes}
                  onChange={(e) => setConnectNotes(e.target.value)}
                  placeholder="Notes on availability, negotiated milestone, or job schedule..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[14px] font-semibold rounded-xl whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 whitespace-nowrap"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Connect & Launch WhatsApp Intro</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
