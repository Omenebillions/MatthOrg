import React, { useState, useEffect, useMemo } from 'react';
import {
  ThumbsUp,
  MessageCircle,
  Smartphone,
  Phone,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Send,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Plus,
  ArrowUpDown,
  MapPin,
  Star,
  Sparkles,
  Users,
  Megaphone,
} from 'lucide-react';
import { ArtisanRecommendation } from '../../types';
import {
  ARTISAN_TRADE_CATEGORIES,
  NIGERIAN_STATES,
  fetchArtisanRecommendations,
  updateArtisanRecommendation,
  deleteArtisanRecommendation,
  buildArtisanOutreachMessage,
} from '../../data/recommendationsData';
import { ArtisanOutreachModal } from './ArtisanOutreachModal';
import { BrandLogo } from '../common/BrandLogo';

interface ArtisanOutreachViewProps {
  onOpenRecommendWall?: () => void;
  onNavigateToBusinessPortal?: () => void;
  onNavigateToDemandAdverts?: () => void;
}

export const ArtisanOutreachView: React.FC<ArtisanOutreachViewProps> = ({
  onOpenRecommendWall,
  onNavigateToBusinessPortal,
  onNavigateToDemandAdverts,
}) => {
  const [recommendations, setRecommendations] = useState<ArtisanRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeModalItem, setActiveModalItem] = useState<ArtisanRecommendation | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'needs_outreach' | 'contacted' | 'validated' | 'pending' | 'claimed'>('all');
  const [tradeFilter, setTradeFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Load recommendations
  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchArtisanRecommendations();
      setRecommendations(data);
    } catch (e) {
      console.error('Failed to load artisan recommendations:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered list
  const filteredList = useMemo(() => {
    return recommendations.filter((rec) => {
      // Status filter
      if (statusFilter === 'needs_outreach') {
        const notContacted = !rec.outreach_status || rec.outreach_status === 'not_contacted';
        if (!notContacted) return false;
      } else if (statusFilter === 'contacted') {
        const isContacted = rec.outreach_status === 'whatsapp_sent' || rec.outreach_status === 'sms_sent' || rec.outreach_status === 'email_sent';
        if (!isContacted) return false;
      } else if (statusFilter === 'validated') {
        if (rec.validation_status !== 'validated') return false;
      } else if (statusFilter === 'pending') {
        if (rec.validation_status && rec.validation_status !== 'pending') return false;
      } else if (statusFilter === 'claimed') {
        if (rec.validation_status !== 'claimed' && rec.outreach_status !== 'claimed') return false;
      }

      // Trade filter
      if (tradeFilter !== 'all') {
        const cat = ARTISAN_TRADE_CATEGORIES.find((c) => c.id === tradeFilter);
        if (cat) {
          const match =
            rec.trade_category.toLowerCase().includes(cat.shortLabel.toLowerCase()) ||
            rec.trade_category.toLowerCase().includes(cat.id.toLowerCase());
          if (!match) return false;
        }
      }

      // State filter
      if (stateFilter !== 'all' && rec.state.toLowerCase() !== stateFilter.toLowerCase()) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = rec.artisan_name.toLowerCase().includes(q);
        const matchesPhone = rec.phone.toLowerCase().includes(q) || (rec.whatsapp || '').toLowerCase().includes(q);
        const matchesTrade = rec.trade_category.toLowerCase().includes(q);
        const matchesTown = rec.town.toLowerCase().includes(q) || rec.state.toLowerCase().includes(q);
        const matchesRecommender = rec.recommender_name.toLowerCase().includes(q);
        const matchesServices = (rec.services_offered || []).some((s) => s.toLowerCase().includes(q));

        if (!matchesName && !matchesPhone && !matchesTrade && !matchesTown && !matchesRecommender && !matchesServices) {
          return false;
        }
      }

      return true;
    });
  }, [recommendations, statusFilter, tradeFilter, stateFilter, searchQuery]);

  // Aggregate Metrics
  const totalCount = recommendations.length;
  const needsOutreachCount = recommendations.filter(
    (r) => !r.outreach_status || r.outreach_status === 'not_contacted'
  ).length;
  const contactedCount = recommendations.filter(
    (r) => r.outreach_status === 'whatsapp_sent' || r.outreach_status === 'sms_sent' || r.outreach_status === 'email_sent'
  ).length;
  const validatedCount = recommendations.filter((r) => r.validation_status === 'validated').length;
  const pendingCount = recommendations.filter((r) => !r.validation_status || r.validation_status === 'pending').length;

  // 1-Click Validation toggle
  const handleToggleValidation = async (rec: ArtisanRecommendation) => {
    const nextStatus = rec.validation_status === 'validated' ? 'pending' : 'validated';
    try {
      const updated = await updateArtisanRecommendation(rec.id, {
        validation_status: nextStatus,
      });
      if (updated) {
        setRecommendations((prev) => prev.map((item) => (item.id === rec.id ? { ...item, validation_status: nextStatus } : item)));
        showNotice(`Artisan "${rec.artisan_name}" marked as ${nextStatus.toUpperCase()}.`);
      }
    } catch {
      showNotice('Failed to update validation status.');
    }
  };

  // Direct quick WhatsApp launch
  const handleQuickWhatsApp = (rec: ArtisanRecommendation) => {
    const rawPhone = (rec.whatsapp || rec.phone || '').replace(/[^0-9]/g, '');
    const message = buildArtisanOutreachMessage(rec, 'whatsapp');
    const url = `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');

    // Auto update status
    updateArtisanRecommendation(rec.id, {
      outreach_status: 'whatsapp_sent',
      outreach_channel: 'whatsapp',
      outreach_sent_at: new Date().toISOString(),
    }).then((updated) => {
      if (updated) {
        setRecommendations((prev) =>
          prev.map((item) =>
            item.id === rec.id
              ? { ...item, outreach_status: 'whatsapp_sent', outreach_sent_at: new Date().toISOString() }
              : item
          )
        );
      }
    });
    showNotice(`WhatsApp invitation launched for ${rec.artisan_name}.`);
  };

  // Direct quick SMS launch
  const handleQuickSMS = (rec: ArtisanRecommendation) => {
    const cleanPhone = rec.phone.trim();
    const message = buildArtisanOutreachMessage(rec, 'sms');
    const url = `sms:${cleanPhone}?body=${encodeURIComponent(message)}`;
    window.location.href = url;

    // Auto update status
    updateArtisanRecommendation(rec.id, {
      outreach_status: 'sms_sent',
      outreach_channel: 'sms',
      outreach_sent_at: new Date().toISOString(),
    }).then((updated) => {
      if (updated) {
        setRecommendations((prev) =>
          prev.map((item) =>
            item.id === rec.id
              ? { ...item, outreach_status: 'sms_sent', outreach_sent_at: new Date().toISOString() }
              : item
          )
        );
      }
    });
    showNotice(`SMS invitation launched for ${rec.artisan_name}.`);
  };

  // Delete recommendation
  const handleDelete = async (rec: ArtisanRecommendation) => {
    if (!window.confirm(`Are you sure you want to remove recommendation for "${rec.artisan_name}"?`)) {
      return;
    }
    await deleteArtisanRecommendation(rec.id);
    setRecommendations((prev) => prev.filter((r) => r.id !== rec.id));
    showNotice(`Removed recommendation for ${rec.artisan_name}.`);
  };

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      {actionNotice && (
        <div className="p-4 bg-slate-900 text-white text-[14px] font-semibold rounded-xl flex items-center justify-between shadow-lg animate-in fade-in duration-200">
          <span>{actionNotice}</span>
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
            <span className="text-[13px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md">
              Admin & Growth Engine
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-[14px] text-slate-500">Artisan Onboarding</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <ThumbsUp className="w-6 h-6 text-blue-600 shrink-0" />
            Recommended Professionals & Outreach
          </h1>
          <p className="text-[15px] text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
            Review artisans recommended by clients at <strong className="text-slate-700">mthorg.com/recommend</strong>. Validate credentials and dispatch automated WhatsApp & SMS campaigns inviting them to claim their profile and receive verified job requests.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onNavigateToDemandAdverts && (
            <button
              type="button"
              onClick={onNavigateToDemandAdverts}
              className="px-4 py-2.5 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-900 text-[14px] font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
            >
              <Megaphone className="w-4 h-4 text-amber-700" />
              <span>Demand Adverts Engine &rarr;</span>
            </button>
          )}
          {onOpenRecommendWall && (
            <button
              type="button"
              onClick={onOpenRecommendWall}
              className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-[14px] font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Public Recommend Wall</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'all'
              ? 'bg-blue-50/70 border-blue-400 shadow-2xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Total Recommended</p>
          <p className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tabular-nums">{totalCount}</p>
          <p className="text-[13px] text-slate-500 mt-0.5">Artisans on platform</p>
        </div>

        <div
          onClick={() => setStatusFilter('needs_outreach')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'needs_outreach'
              ? 'bg-amber-50/70 border-amber-400 shadow-2xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-bold text-amber-800 uppercase tracking-wider">Needs Outreach</p>
            {needsOutreachCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </div>
          <p className="font-heading text-2xl sm:text-3xl font-extrabold text-amber-900 mt-1 tabular-nums">{needsOutreachCount}</p>
          <p className="text-[13px] text-amber-700 mt-0.5">Not contacted yet</p>
        </div>

        <div
          onClick={() => setStatusFilter('contacted')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'contacted'
              ? 'bg-emerald-50/70 border-emerald-400 shadow-2xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <p className="text-[13px] font-bold text-emerald-800 uppercase tracking-wider">Invited / Sent</p>
          <p className="font-heading text-2xl sm:text-3xl font-extrabold text-emerald-900 mt-1 tabular-nums">{contactedCount}</p>
          <p className="text-[13px] text-emerald-700 mt-0.5">WhatsApp / SMS sent</p>
        </div>

        <div
          onClick={() => setStatusFilter('validated')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'validated'
              ? 'bg-blue-50/70 border-blue-400 shadow-2xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <p className="text-[13px] font-bold text-blue-800 uppercase tracking-wider">Validated</p>
          <p className="font-heading text-2xl sm:text-3xl font-extrabold text-blue-900 mt-1 tabular-nums">{validatedCount}</p>
          <p className="text-[13px] text-blue-700 mt-0.5">Verified & active</p>
        </div>

        <div
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'pending'
              ? 'bg-slate-100 border-slate-400 shadow-2xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <p className="text-[13px] font-bold text-slate-600 uppercase tracking-wider">Pending Review</p>
          <p className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1 tabular-nums">{pendingCount}</p>
          <p className="text-[13px] text-slate-500 mt-0.5">Awaiting validation</p>
        </div>
      </div>

      {/* Filter Tabs Bar (Interactive segmented controls) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 text-[14px] font-semibold rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Artisans ({totalCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('needs_outreach')}
            className={`px-3.5 py-1.5 text-[14px] font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === 'needs_outreach'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            <span>Needs Outreach</span>
            <span className="text-[13px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 font-mono tabular-nums">
              {needsOutreachCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('contacted')}
            className={`px-3.5 py-1.5 text-[14px] font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === 'contacted'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            <span>Outreach Sent</span>
            <span className="text-[13px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-900 font-mono tabular-nums">
              {contactedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('validated')}
            className={`px-3.5 py-1.5 text-[14px] font-semibold rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === 'validated'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-blue-800 hover:bg-blue-50'
            }`}
          >
            Validated ({validatedCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3.5 py-1.5 text-[14px] font-semibold rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === 'pending'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Pending Review ({pendingCount})
          </button>
        </div>

        {/* Search & Location Selectors */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by artisan name, trade, town, phone, or recommender..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[15px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[13px] font-semibold text-slate-400 hover:text-slate-700 absolute right-3 top-2.5"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Trade category */}
            <select
              value={tradeFilter}
              onChange={(e) => setTradeFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="all">All Trades</option>
              {ARTISAN_TRADE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.shortLabel}
                </option>
              ))}
            </select>

            {/* State filter */}
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
      </div>

      {/* Recommended Professionals List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[15px] text-slate-500">Loading recommended professionals...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <Filter className="w-5 h-5" />
            </div>
            <h3 className="font-heading text-lg font-bold text-slate-900">No recommended artisans match your filters</h3>
            <p className="text-[15px] text-slate-500 max-w-sm mx-auto">
              Try adjusting your trade, location, or search keywords to view other submissions.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredList.map((rec) => {
              const isContacted =
                rec.outreach_status === 'whatsapp_sent' ||
                rec.outreach_status === 'sms_sent' ||
                rec.outreach_status === 'email_sent';
              const isValidated = rec.validation_status === 'validated';

              return (
                <article
                  key={rec.id}
                  className="p-5 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5"
                >
                  {/* Left: Artisan Info */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading text-lg font-bold text-slate-900 tracking-tight">
                        {rec.artisan_name}
                      </h3>
                      {/* Clean typographic validation status */}
                      <span className="text-slate-300">·</span>
                      <button
                        type="button"
                        onClick={() => handleToggleValidation(rec)}
                        className={`text-[14px] font-semibold cursor-pointer underline underline-offset-2 whitespace-nowrap ${
                          isValidated ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                        title="Click to toggle validation status"
                      >
                        {isValidated ? '✓ Validated' : '⏳ Pending Review'}
                      </button>
                      <span className="text-slate-300">·</span>
                      <span className="text-[14px] text-slate-500 tabular-nums">
                        {rec.vouches_count || 1} {rec.vouches_count === 1 ? 'vouch' : 'vouches'}
                      </span>
                    </div>

                    {/* Trade & Location */}
                    <div className="flex flex-wrap items-center gap-2 text-[14px] text-slate-600 font-medium">
                      <span className="font-semibold text-slate-800">{rec.trade_category}</span>
                      <span className="text-slate-300">·</span>
                      <span className="flex items-center gap-1 text-slate-700">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        {rec.town}, {rec.state}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="tabular-nums">
                        Phone: <strong className="text-slate-900">{rec.phone || 'Not listed'}</strong>
                      </span>
                    </div>

                    {/* Services Offered */}
                    {rec.services_offered && rec.services_offered.length > 0 && (
                      <p className="text-[14px] text-slate-600 line-clamp-1">
                        <strong className="text-slate-700">Services: </strong>
                        {rec.services_offered.join(', ')}
                      </p>
                    )}

                    {/* Recommender review snippet */}
                    <div className="bg-slate-50 rounded-lg p-3 text-[14px] text-slate-700 border border-slate-100 flex items-start gap-2">
                      <ThumbsUp className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-900">
                          {rec.recommender_name} ({rec.recommender_relationship || 'Client'}):
                        </span>{' '}
                        <span className="italic">"{rec.recommendation_note}"</span>
                      </div>
                    </div>

                    {/* Outreach Status Indicator */}
                    <div className="flex flex-wrap items-center gap-3 text-[13px]">
                      {isContacted ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1.5 tabular-nums">
                          <CheckCircle2 className="w-4 h-4" />
                          Invitation sent via {rec.outreach_channel?.toUpperCase() || 'MESSAGE'}
                          {rec.outreach_sent_at && (
                            <span className="text-slate-500 font-normal">
                              ({new Date(rec.outreach_sent_at).toLocaleDateString()})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-amber-700 font-semibold flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          Needs Outreach (Not invited yet)
                        </span>
                      )}
                      {rec.outreach_notes && (
                        <span className="text-slate-500 italic">Note: {rec.outreach_notes}</span>
                      )}
                    </div>
                  </div>

                  {/* Right: Outreach Action Buttons */}
                  <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 shrink-0 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Quick WhatsApp Send */}
                    <button
                      type="button"
                      disabled={!rec.whatsapp && !rec.phone}
                      onClick={() => handleQuickWhatsApp(rec)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-[14px] font-bold rounded-xl transition-colors shadow-2xs inline-flex items-center gap-1.5 whitespace-nowrap"
                      title={rec.whatsapp || rec.phone ? 'Send WhatsApp Invitation directly' : 'No phone number listed'}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </button>

                    {/* Quick SMS Send */}
                    <button
                      type="button"
                      disabled={!rec.phone}
                      onClick={() => handleQuickSMS(rec)}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-[14px] font-bold rounded-xl transition-colors shadow-2xs inline-flex items-center gap-1.5 whitespace-nowrap"
                      title={rec.phone ? 'Send SMS Invitation directly' : 'No phone number listed'}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>SMS</span>
                    </button>

                    {/* Open Full Campaign Composer */}
                    <button
                      type="button"
                      onClick={() => setActiveModalItem(rec)}
                      className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-[14px] font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
                      title="Open full invitation composer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Campaign</span>
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(rec)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete recommendation"
                      aria-label="Delete recommendation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Outreach Campaign Composer Modal */}
      <ArtisanOutreachModal
        isOpen={Boolean(activeModalItem)}
        onClose={() => setActiveModalItem(null)}
        recommendation={activeModalItem}
        onOutreachRecorded={(updated) => {
          setRecommendations((prev) =>
            prev.map((r) => (r.id === updated.id ? updated : r))
          );
          setActiveModalItem(null);
          showNotice(`Invitation outreach recorded for ${updated.artisan_name}.`);
        }}
      />
    </div>
  );
};
