import React, { useState, useMemo, useEffect } from 'react';
import { AppState, Quote, Invoice, FollowUp, Lead, ArtisanRecommendation } from '../types';
import {
  FileText,
  CreditCard,
  Sparkles,
  Clock,
  MessageCircle,
  FileDown,
  ArrowRight,
  CheckCircle2,
  Plus,
  Search,
  LayoutGrid,
  List,
  TrendingUp,
  Send,
  AlertCircle,
  Layers,
  ChevronRight,
  Flame,
  ShieldCheck,
  Lock,
  Unlock,
  UserPlus,
  Trash2,
  Check,
  Share2,
  Printer,
  ThumbsUp,
  Smartphone,
  Upload,
  Users,
  Settings,
  Star,
  Gem,
  Circle,
  Gift,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  buildWhatsAppLink,
  createFollowUpWhatsAppText,
  createQuoteWhatsAppText,
  createInvoiceWhatsAppText,
  createLeadIntroWhatsAppText,
} from '../utils/formatters';
import {
  generateQuotePDF,
  generateInvoicePDF,
  printQuotePDF,
  printInvoicePDF,
} from '../utils/pdfGenerator';
import { computeDailyBriefing } from '../lib/followups';
import { hasActiveSubscription, isProfessionalVerified } from '../lib/db';
import { getShareableIntakeLink } from '../lib/leadGenerator';
import { fetchMyReferralSummary, getShareableReferralUrl } from '../lib/referrals';
import {
  fetchArtisanRecommendations,
  updateArtisanRecommendation,
  buildArtisanOutreachMessage,
} from '../data/recommendationsData';

interface DashboardViewProps {
  state: AppState;
  onOpenNewQuote: (withAI?: boolean) => void;
  onOpenNewInvoice: () => void;
  onOpenQuote: (quote: Quote) => void;
  onOpenInvoice: (invoice: Invoice) => void;
  onUpdateQuoteStatus: (quoteId: string, status: Quote['status']) => void;
  onUpdateFollowUpStatus: (followUpId: string, status: FollowUp['status']) => void;
  onRescheduleFollowUp: (followUp: FollowUp) => void;
  onConvertToInvoice: (quote: Quote) => void;
  onOpenSubscription: () => void;
  onOpenVerificationModal?: () => void;
  onNavigateToLeads?: () => void;
  onNavigateToMarketplace?: () => void;
  onNavigateToQuotes?: () => void;
  onNavigateToInvoices?: () => void;
  onNavigateToSettings?: () => void;
  onOpenNewLead?: () => void;
  onOpenServiceRequest?: () => void;
  onConvertToQuoteForLead?: (lead: Lead) => void;
  onNavigateToMatthew?: (initialPrompt?: string) => void;
  onOpenMessageModal?: (target: any) => void;
  onOpenLeadModal?: (lead: Lead) => void;
  onDeleteQuote?: (id: string) => void;
  onDeleteInvoice?: (id: string) => void;
  onDeleteFollowUp?: (id: string) => void;
  onOpenFollowUpsTab?: () => void;
  onNavigateToRecommendations?: () => void;
}

const getInitials = (name?: string) => {
  if (!name) return 'MO';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
};

const AVATAR_TONES = [
  'bg-blue-100 text-[#0B192C]',
  'bg-emerald-100 text-emerald-900',
  'bg-cyan-100 text-cyan-900',
  'bg-slate-200 text-[#0B192C]',
  'bg-amber-100 text-amber-900',
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  onOpenNewQuote,
  onOpenNewInvoice,
  onOpenQuote,
  onOpenInvoice,
  onUpdateQuoteStatus,
  onUpdateFollowUpStatus,
  onConvertToInvoice,
  onOpenSubscription,
  onOpenVerificationModal,
  onNavigateToLeads,
  onNavigateToMarketplace,
  onNavigateToQuotes,
  onNavigateToInvoices,
  onNavigateToSettings,
  onOpenNewLead,
  onConvertToQuoteForLead,
  onNavigateToMatthew,
  onOpenMessageModal,
  onOpenLeadModal,
  onDeleteQuote,
  onDeleteInvoice,
  onNavigateToRecommendations,
}) => {
  const { business, quotes = [], invoices = [], followups = [], user, leads = [], customers = [] } = state || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'quotes' | 'invoices'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [chartWindow, setChartWindow] = useState<'6m' | '12m'>('12m');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [copiedIntake, setCopiedIntake] = useState(false);
  const [referralCode, setReferralCode] = useState<string>(business.referral_code || '');
  const [copiedReferral, setCopiedReferral] = useState(false);

  useEffect(() => {
    if (business.referral_code) {
      setReferralCode(business.referral_code);
      return;
    }
    if (!business.id || business.id === 'biz_mathorg_demo_1') return;
    let mounted = true;
    fetchMyReferralSummary(business.id)
      .then((res) => {
        if (mounted && res?.referralCode) {
          setReferralCode(res.referralCode);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [business.id, business.referral_code]);

  const [artisanRecs, setArtisanRecs] = useState<ArtisanRecommendation[]>([]);
  useEffect(() => {
    let isMounted = true;
    fetchArtisanRecommendations()
      .then((data) => {
        if (isMounted) setArtisanRecs(data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState<'all' | 'New' | 'Contacted' | 'Qualified' | 'Won'>('all');
  const [leadSortBy, setLeadSortBy] = useState<'intent' | 'date' | 'budget'>('intent');

  const profileCompletion = useMemo(() => {
    let score = 0;
    const checks = [
      Boolean(business.business_name?.trim()),
      Boolean(business.phone?.trim()),
      Boolean(business.email?.trim()),
      Boolean(business.address?.trim()),
      Boolean(business.industry?.trim()),
      Boolean(business.specialization?.trim()),
      Boolean(business.categories_offered && business.categories_offered.length > 0),
      Boolean(business.locations_served && business.locations_served.length > 0),
      Boolean(business.cac_number?.trim()),
      Boolean(business.logo?.trim()),
    ];
    checks.forEach((c) => {
      if (c) score += 10;
    });
    return score;
  }, [business]);

  const planInfo = useMemo(() => {
    const planName = (business.subscription_plan || user?.plan || 'free').toLowerCase();
    const isPro = planName.includes('pro') || planName.includes('premium') || planName.includes('enterprise') || planName.includes('business');
    return {
      name: planName.toUpperCase(),
      isPro,
    };
  }, [business, user]);

  const filteredLeads = useMemo(() => {
    return (leads || [])
      .filter((l) => {
        if (leadStatusFilter !== 'all' && l.status !== leadStatusFilter) return false;
        const effectiveQuery = (leadSearchQuery || searchQuery).trim().toLowerCase();
        if (!effectiveQuery) return true;
        return (
          l.customer_name.toLowerCase().includes(effectiveQuery) ||
          l.lead_number.toLowerCase().includes(effectiveQuery) ||
          (l.service_required && l.service_required.toLowerCase().includes(effectiveQuery)) ||
          (l.location && l.location.toLowerCase().includes(effectiveQuery)) ||
          (l.phone && l.phone.includes(effectiveQuery))
        );
      })
      .sort((a, b) => {
        if (leadSortBy === 'intent') return b.intent_score - a.intent_score;
        if (leadSortBy === 'date') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (leadSortBy === 'budget') return (b.estimated_value || 0) - (a.estimated_value || 0);
        return 0;
      });
  }, [leads, leadStatusFilter, leadSearchQuery, searchQuery, leadSortBy]);

  const briefing = useMemo(() => computeDailyBriefing(state), [state]);

  const totalInvoicesCount = invoices.length;
  const totalQuotesCount = quotes.length;
  const unpaidInvoices = invoices.filter((inv) => inv.status !== 'Paid' && inv.status !== 'Draft');
  const paidInvoices = invoices.filter((inv) => inv.status === 'Paid' || (inv.amount_paid && inv.amount_paid > 0));

  const outstandingInvoicesAmount = unpaidInvoices.reduce((acc, inv) => acc + Math.max(0, inv.total - (inv.amount_paid || 0)), 0);
  const realizedRevenueAmount = paidInvoices.reduce((acc, inv) => acc + (inv.amount_paid || (inv.status === 'Paid' ? inv.total : 0)), 0);
  const pipelineValueAmount = quotes
    .filter((q) => q.status === 'Sent' || q.status === 'Draft' || q.status === 'Awaiting Response')
    .reduce((acc, q) => acc + (q.total || 0), 0);

  const acceptedQuotesCount = quotes.filter((q) => q.status === 'Accepted').length;
  const conversionRate = totalQuotesCount > 0 ? Math.round((acceptedQuotesCount / totalQuotesCount) * 100) : 0;
  const pendingFollowUps = followups.filter((f) => f.status === 'pending');

  const monthlyStats = useMemo(() => {
    const count = chartWindow === '12m' ? 12 : 6;
    const months: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthNum = d.getMonth() + 1;
      const key = `${year}-${String(monthNum).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short' }).toUpperCase();
      months.push({ key, label });
    }

    return months.map(({ key, label }) => {
      const monthInvoices = invoices.filter((inv) => (inv.issue_date || inv.created_at || '').startsWith(key));
      const invoicedTotal = monthInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const paidTotal = monthInvoices.reduce(
        (sum, inv) => sum + (inv.amount_paid || (inv.status === 'Paid' ? inv.total : 0)),
        0
      );
      return {
        month: label,
        key,
        invoiced: invoicedTotal,
        paid: paidTotal,
      };
    });
  }, [invoices, chartWindow]);

  const maxChartRevenue = Math.max(...monthlyStats.map((m) => Math.max(m.paid, m.invoiced)), 1);
  const chartPoints = useMemo(() => {
    const startX = 24;
    const endX = 536;
    const span = monthlyStats.length > 1 ? (endX - startX) / (monthlyStats.length - 1) : 0;
    return monthlyStats.map((m, idx) => {
      const val = m.paid > 0 ? m.paid : m.invoiced;
      const x = startX + idx * span;
      const normalized = val / maxChartRevenue;
      const y = 148 - normalized * 114;
      return { x, y, val: formatCurrency(val, business.currency), raw: val, month: m.month };
    });
  }, [monthlyStats, maxChartRevenue, business.currency]);

  const linePathD = chartPoints.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    return `${acc} L ${pt.x} ${pt.y}`;
  }, '');
  const lastPt = chartPoints[chartPoints.length - 1];
  const firstPt = chartPoints[0];
  const areaPathD =
    chartPoints.length > 0
      ? `${linePathD} L ${lastPt.x} 160 L ${firstPt.x} 160 Z`
      : '';

  // Unified Action Items list (real quotes, invoices, followups, verification)
  const actionItems = useMemo(() => {
    const items: Array<{
      id: string;
      label: string;
      sublabel: string;
      onClick: () => void;
    }> = [];

    for (const inv of unpaidInvoices.slice(0, 2)) {
      items.push({
        id: `inv_${inv.id}`,
        label: `Follow up invoice ${inv.invoice_number} (${inv.customer_name})`,
        sublabel: `${formatCurrency(Math.max(0, inv.total - (inv.amount_paid || 0)), business.currency)} due`,
        onClick: () => onOpenInvoice(inv),
      });
    }

    for (const fu of pendingFollowUps.slice(0, 2)) {
      items.push({
        id: `fu_${fu.id}`,
        label: `Follow up ${fu.quote_number || 'quote'} — ${fu.customer_name}`,
        sublabel: formatCurrency(fu.amount, business.currency),
        onClick: () => {
          const q = quotes.find((item) => item.id === fu.quote_id);
          if (q) onOpenQuote(q);
          else onUpdateFollowUpStatus(fu.id, 'completed');
        },
      });
    }

    for (const q of quotes.filter((item) => item.status === 'Draft' || item.status === 'Sent').slice(0, 2)) {
      if (items.length >= 4) break;
      items.push({
        id: `q_${q.id}`,
        label: `Review quote ${q.quote_number} for ${q.customer_name}`,
        sublabel: `${q.status} · ${formatCurrency(q.total, business.currency)}`,
        onClick: () => onOpenQuote(q),
      });
    }

    if (!isProfessionalVerified(business) && items.length < 4 && onOpenVerificationModal) {
      items.push({
        id: 'verify_biz',
        label: 'Complete CAC & NIN business verification',
        sublabel: 'Boost trust in Matthew AI search',
        onClick: onOpenVerificationModal,
      });
    }

    return items.slice(0, 4);
  }, [unpaidInvoices, pendingFollowUps, quotes, business, onOpenInvoice, onOpenQuote, onUpdateFollowUpStatus, onOpenVerificationModal]);

  // Recent Activity Feed (derived strictly from live invoices, quotes, and leads)
  const recentActivity = useMemo(() => {
    const feed: Array<{
      id: string;
      initials: string;
      title: string;
      meta: string;
      sortDate: string;
      onClick: () => void;
    }> = [];

    for (const inv of invoices) {
      feed.push({
        id: `act_inv_${inv.id}`,
        initials: getInitials(inv.customer_name),
        title:
          inv.status === 'Paid'
            ? `${inv.customer_name} paid ${inv.invoice_number}`
            : `Invoice ${inv.invoice_number} sent to ${inv.customer_name}`,
        meta: formatCurrency(inv.total, business.currency),
        sortDate: inv.created_at || inv.issue_date || '',
        onClick: () => onOpenInvoice(inv),
      });
    }

    for (const q of quotes) {
      feed.push({
        id: `act_q_${q.id}`,
        initials: getInitials(q.customer_name),
        title:
          q.status === 'Accepted'
            ? `${q.customer_name} accepted ${q.quote_number}`
            : `Quotation ${q.quote_number} for ${q.customer_name}`,
        meta: formatCurrency(q.total, business.currency),
        sortDate: q.created_at || q.issue_date || '',
        onClick: () => onOpenQuote(q),
      });
    }

    for (const lead of leads) {
      feed.push({
        id: `act_lead_${lead.id}`,
        initials: getInitials(lead.customer_name),
        title: `${lead.customer_name} requested ${lead.service_required}`,
        meta: lead.location || lead.status,
        sortDate: lead.created_at || '',
        onClick: () => onOpenLeadModal && onOpenLeadModal(lead),
      });
    }

    return feed
      .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())
      .slice(0, 4);
  }, [invoices, quotes, leads, business.currency, onOpenInvoice, onOpenQuote, onOpenLeadModal]);

  // Combined documents list for below-the-fold table/grid
  type CombinedDoc =
    | { type: 'quote'; data: Quote; sortDate: string }
    | { type: 'invoice'; data: Invoice; sortDate: string };

  const combinedDocs: CombinedDoc[] = [
    ...(activeCategoryFilter === 'all' || activeCategoryFilter === 'quotes'
      ? quotes.map((q) => ({ type: 'quote' as const, data: q, sortDate: q.created_at || q.issue_date }))
      : []),
    ...(activeCategoryFilter === 'all' || activeCategoryFilter === 'invoices'
      ? invoices.map((inv) => ({ type: 'invoice' as const, data: inv, sortDate: inv.created_at || inv.issue_date }))
      : []),
  ]
    .filter((doc) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      if (doc.type === 'quote') {
        return (
          (doc.data.quote_number || '').toLowerCase().includes(q) ||
          (doc.data.customer_name || '').toLowerCase().includes(q) ||
          (doc.data.notes && doc.data.notes.toLowerCase().includes(q))
        );
      }
      return (
        (doc.data.invoice_number || '').toLowerCase().includes(q) ||
        (doc.data.customer_name || '').toLowerCase().includes(q) ||
        (doc.data.notes && doc.data.notes.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());

  const handleExportReport = () => {
    const rows: string[][] = [['Type', 'Reference', 'Client', 'Status', 'Date', 'Total']];
    quotes.forEach((q) => {
      rows.push(['Quote', q.quote_number, q.customer_name, q.status, q.issue_date || '', String(q.total)]);
    });
    invoices.forEach((inv) => {
      rows.push(['Invoice', inv.invoice_number, inv.customer_name, inv.status, inv.issue_date || '', String(inv.total)]);
    });
    const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(business.business_name || 'matthorg').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShareIntake = () => {
    const { webLink } = getShareableIntakeLink(business);
    navigator.clipboard?.writeText(webLink).catch(() => {});
    setCopiedIntake(true);
    setTimeout(() => setCopiedIntake(false), 2400);
  };

  const getStatusTextTone = (status: string) => {
    switch (status) {
      case 'Paid':
      case 'Accepted':
        return 'text-emerald-700';
      case 'Sent':
        return 'text-[#3D74D9]';
      case 'Partially Paid':
      case 'Awaiting Response':
        return 'text-amber-700';
      case 'Overdue':
      case 'Rejected':
      case 'Expired':
        return 'text-rose-600';
      default:
        return 'text-[#5B6D85]';
    }
  };

  const handleSendQuoteWhatsApp = (q: Quote) => {
    const text = createQuoteWhatsAppText(
      q.customer_name,
      business.business_name,
      q.quote_number,
      formatCurrency(q.total, business.currency),
      q.notes ? q.notes.substring(0, 100) : undefined
    );
    window.open(buildWhatsAppLink(q.customer_whatsapp || q.customer_phone, text), '_blank');
  };

  const handleSendInvoiceWhatsApp = (inv: Invoice) => {
    const balance = Math.max(0, inv.total - (inv.amount_paid || 0));
    const text = createInvoiceWhatsAppText(
      inv.customer_name,
      business.business_name,
      inv.invoice_number,
      formatCurrency(balance > 0 ? balance : inv.total, business.currency),
      formatDate(inv.due_date),
      inv.payment_details
    );
    window.open(buildWhatsAppLink(inv.customer_whatsapp || inv.customer_phone, text), '_blank');
  };

  const avatarPeople = useMemo(() => {
    const names = [
      ...customers.map((c) => c.name),
      ...leads.map((l) => l.customer_name),
      ...artisanRecs.map((a) => a.artisan_name),
    ].filter(Boolean);
    return Array.from(new Set(names)).slice(0, 6);
  }, [customers, leads, artisanRecs]);

  return (
    <div className="w-full min-w-0 space-y-5 pb-12 max-w-[1220px] mx-auto overflow-x-hidden">
      {/* 1. Top Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8F9FB5]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search clients, leads, quotes, invoices..."
          className="w-full pl-11 pr-10 py-3 rounded-xl bg-white border border-[#E5E9F0] text-[15px] text-[#0B192C] placeholder-[#8F9FB5] focus:outline-none focus:border-[#3D74D9] transition"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5B6D85] hover:text-[#0B192C] text-[13px] px-1.5 py-0.5 cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* 2. Action Strip (Export, Share, Upgrade on left · Primary CTA on right) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-[#E5E9F0] text-[14px] font-semibold text-[#0B192C] transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#5B6D85]" />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={handleShareIntake}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-[#E5E9F0] text-[14px] font-semibold text-[#0B192C] transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copiedIntake ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Share2 className="w-4 h-4 text-[#5B6D85]" />
            )}
            <span>{copiedIntake ? 'Link copied' : 'Share'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenSubscription}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-[#E5E9F0] text-[14px] font-semibold text-[#0B192C] transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Gem className="w-4 h-4 text-amber-500" />
            <span>{planInfo.isPro ? `${planInfo.name} Plan` : 'Upgrade'}</span>
          </button>

          {onOpenVerificationModal && (
            <button
              type="button"
              onClick={onOpenVerificationModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-[#E5E9F0] text-[14px] font-semibold text-[#0B192C] transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShieldCheck
                className={`w-4 h-4 ${
                  isProfessionalVerified(business)
                    ? 'text-emerald-600'
                    : business.verification_status === 'in_review'
                    ? 'text-[#3D74D9]'
                    : 'text-amber-600'
                }`}
              />
              <span>
                {isProfessionalVerified(business)
                  ? 'Verified'
                  : business.verification_status === 'in_review'
                  ? 'In Review'
                  : 'Get Verified'}
              </span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
          <button
            type="button"
            onClick={() => onOpenNewQuote(false)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-[#E5E9F0] text-[14px] font-semibold text-[#0B192C] transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#3D74D9]" />
            <span>New quote</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewInvoice}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B192C] hover:bg-[#152744] text-white text-[14px] font-semibold transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Send invoices</span>
          </button>
        </div>
      </div>

      {/* 3. 2x3 KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Revenue */}
        <div
          onClick={onNavigateToInvoices}
          className="bg-white rounded-2xl border border-[#E5E9F0] p-5 flex flex-col justify-between hover:border-[#3D74D9]/40 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold uppercase tracking-wider text-[#5B6D85]">
              Revenue
            </span>
            <TrendingUp className="w-4 h-4 text-[#8F9FB5]" />
          </div>
          <div className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight tabular-nums mt-2.5">
            {formatCurrency(realizedRevenueAmount, business.currency)}
          </div>
          <div className="text-[13px] font-medium text-emerald-700 mt-1.5 tabular-nums">
            {paidInvoices.length} paid {paidInvoices.length === 1 ? 'invoice' : 'invoices'}
          </div>
        </div>

        {/* Card 2: Pipeline / Win Rate */}
        <div
          onClick={onNavigateToQuotes}
          className="bg-white rounded-2xl border border-[#E5E9F0] p-5 flex flex-col justify-between hover:border-[#3D74D9]/40 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold uppercase tracking-wider text-[#5B6D85]">
              Quote Pipeline
            </span>
            <FileText className="w-4 h-4 text-[#8F9FB5]" />
          </div>
          <div className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight tabular-nums mt-2.5">
            {formatCurrency(pipelineValueAmount, business.currency)}
          </div>
          <div className="text-[13px] font-medium text-emerald-700 mt-1.5 tabular-nums">
            {conversionRate}% quote win rate
          </div>
        </div>

        {/* Card 3: Overdue / Awaiting Payment */}
        <div
          onClick={onNavigateToInvoices}
          className="bg-white rounded-2xl border border-[#E5E9F0] p-5 flex flex-col justify-between hover:border-[#3D74D9]/40 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold uppercase tracking-wider text-[#5B6D85]">
              Overdue &amp; Due
            </span>
            <AlertCircle className="w-4 h-4 text-[#8F9FB5]" />
          </div>
          <div className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight tabular-nums mt-2.5">
            {formatCurrency(outstandingInvoicesAmount, business.currency)}
          </div>
          <div className="text-[13px] font-medium text-rose-600 mt-1.5 tabular-nums">
            {unpaidInvoices.length} {unpaidInvoices.length === 1 ? 'invoice' : 'invoices'}
          </div>
        </div>

        {/* Card 4: Clients & Leads */}
        <div
          onClick={onNavigateToLeads}
          className="bg-white rounded-2xl border border-[#E5E9F0] p-5 flex flex-col justify-between hover:border-[#3D74D9]/40 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold uppercase tracking-wider text-[#5B6D85]">
              Clients &amp; Leads
            </span>
            <Users className="w-4 h-4 text-[#8F9FB5]" />
          </div>
          <div className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight tabular-nums mt-2.5">
            {customers.length + leads.length}
          </div>
          <div className="text-[13px] font-medium text-emerald-700 mt-1.5 tabular-nums">
            +{leads.filter((l) => l.status === 'New').length} new leads
          </div>
        </div>

        {/* Card 5: Quotes Issued */}
        <div
          onClick={onNavigateToQuotes}
          className="bg-white rounded-2xl border border-[#E5E9F0] p-5 flex flex-col justify-between hover:border-[#3D74D9]/40 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold uppercase tracking-wider text-[#5B6D85]">
              Quotations
            </span>
            <Clock className="w-4 h-4 text-[#8F9FB5]" />
          </div>
          <div className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight tabular-nums mt-2.5">
            {totalQuotesCount}
          </div>
          <div className="text-[13px] text-[#5B6D85] mt-1.5 tabular-nums">
            {totalInvoicesCount} invoices issued
          </div>
        </div>

        {/* Card 6: Attention / Profile Score */}
        <div
          onClick={() => onNavigateToMatthew && onNavigateToMatthew('Give me my daily briefing and top priority follow-ups.')}
          className="bg-white rounded-2xl border border-[#E5E9F0] p-5 flex flex-col justify-between hover:border-[#3D74D9]/40 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold uppercase tracking-wider text-[#5B6D85]">
              Follow-Ups
            </span>
            <Star className="w-4 h-4 text-[#8F9FB5]" />
          </div>
          <div className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight tabular-nums mt-2.5">
            {pendingFollowUps.length}
          </div>
          <div className="text-[13px] text-[#5B6D85] mt-1.5 tabular-nums">
            {briefing.totalAttentionItems} total items
          </div>
        </div>
      </div>

      {/* 4. Middle Row: Revenue Trend Chart (8 cols) + Action Items Checklist (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left: Revenue Line Chart */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E5E9F0] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-baseline gap-2.5">
              <h2 className="font-heading text-lg sm:text-xl font-bold text-[#0B192C]">Revenue</h2>
              <span className="text-[13px] font-semibold uppercase tracking-wider text-[#8F9FB5]">
                Last {chartWindow === '12m' ? '12' : '6'} months
              </span>
            </div>

            <div className="flex items-center gap-1 p-0.5 bg-[#F4F7FB] rounded-lg border border-[#E5E9F0]">
              <button
                type="button"
                onClick={() => setChartWindow('6m')}
                className={`px-3 py-1 text-[13px] font-semibold rounded-md transition cursor-pointer ${
                  chartWindow === '6m' ? 'bg-white text-[#0B192C] shadow-2xs' : 'text-[#5B6D85] hover:text-[#0B192C]'
                }`}
              >
                6M
              </button>
              <button
                type="button"
                onClick={() => setChartWindow('12m')}
                className={`px-3 py-1 text-[13px] font-semibold rounded-md transition cursor-pointer ${
                  chartWindow === '12m' ? 'bg-white text-[#0B192C] shadow-2xs' : 'text-[#5B6D85] hover:text-[#0B192C]'
                }`}
              >
                12M
              </button>
            </div>
          </div>

          <div className="relative w-full h-48">
            <svg className="w-full h-40 overflow-visible" viewBox="0 0 560 168" preserveAspectRatio="none">
              <defs>
                <linearGradient id="dashRevenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3D74D9" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#3D74D9" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <line x1="20" y1="30" x2="540" y2="30" stroke="#EEF2F6" strokeDasharray="3 3" />
              <line x1="20" y1="74" x2="540" y2="74" stroke="#EEF2F6" strokeDasharray="3 3" />
              <line x1="20" y1="118" x2="540" y2="118" stroke="#EEF2F6" strokeDasharray="3 3" />
              <line x1="20" y1="160" x2="540" y2="160" stroke="#E5E9F0" />

              {areaPathD && <path d={areaPathD} fill="url(#dashRevenueFill)" />}
              {linePathD && (
                <path
                  d={linePathD}
                  fill="none"
                  stroke="#3D74D9"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {chartPoints.map((pt, i) => {
                const isLast = i === chartPoints.length - 1;
                return (
                  <g key={pt.month + i} className="cursor-pointer">
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredPoint === i ? 5.5 : isLast ? 4.5 : 3}
                      fill={isLast ? '#3D74D9' : '#FFFFFF'}
                      stroke="#3D74D9"
                      strokeWidth="2"
                      onMouseEnter={() => setHoveredPoint(i)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    {hoveredPoint === i && (
                      <text
                        x={pt.x}
                        y={pt.y - 10}
                        textAnchor="middle"
                        fill="#0B192C"
                        fontSize="12"
                        fontWeight="700"
                      >
                        {pt.val}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            <div className="flex justify-between px-3 pt-1 text-[13px] font-semibold text-[#8F9FB5] tabular-nums">
              {monthlyStats
                .filter((_, idx) => (chartWindow === '6m' ? true : idx % 2 === 0 || idx === monthlyStats.length - 1))
                .map((m) => (
                  <span key={m.key}>{m.month}</span>
                ))}
            </div>
          </div>
        </div>

        {/* Right: Action Items */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E5E9F0] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg font-bold text-[#0B192C]">Action items</h2>
                <span className="text-[13px] font-semibold text-[#5B6D85] tabular-nums">{actionItems.length}</span>
              </div>
              {onNavigateToMatthew && (
                <button
                  type="button"
                  onClick={() => onNavigateToMatthew('Prioritize my pending follow-ups and overdue invoices.')}
                  className="text-[13px] font-semibold text-[#3D74D9] hover:underline cursor-pointer"
                >
                  Ask Matthew
                </button>
              )}
            </div>

            {actionItems.length === 0 ? (
              <div className="py-8 text-center text-[14px] text-[#5B6D85]">
                All caught up. No urgent actions due.
              </div>
            ) : (
              <div className="divide-y divide-[#F1F5F9]">
                {actionItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.onClick}
                    className="w-full py-2.5 flex items-start gap-2.5 text-left hover:bg-[#F8FAFC] rounded-lg px-1.5 -mx-1.5 transition cursor-pointer group"
                  >
                    <Circle className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#3D74D9] shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-semibold text-[#0B192C] truncate">{item.label}</div>
                      <div className="text-[13px] text-[#5B6D85] tabular-nums">{item.sublabel}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {briefing.potentialValueRequiringAttention > 0 && (
            <div className="pt-3 mt-3 border-t border-[#F1F5F9] flex items-center justify-between text-[14px]">
              <span className="text-[#5B6D85]">Value at stake</span>
              <span className="font-bold text-[#0B192C] tabular-nums">
                {formatCurrency(briefing.potentialValueRequiringAttention, business.currency)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 5. Bottom Row: Recent Activity + Network Strip (8 cols) & Quick Links (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-[#E5E9F0] p-5 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading text-lg font-bold text-[#0B192C]">Recent activity</h2>
              <span className="text-[13px] text-[#8F9FB5] tabular-nums">
                {recentActivity.length} latest
              </span>
            </div>

            {recentActivity.length === 0 ? (
              <div className="py-6 text-center text-[14px] text-[#5B6D85]">
                No quotes, invoices, or buyer leads logged yet. Create a quote or add a lead to begin.
              </div>
            ) : (
              <div className="divide-y divide-[#F1F5F9]">
                {recentActivity.map((act, idx) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={act.onClick}
                    className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-[#F8FAFC] rounded-lg px-1.5 -mx-1.5 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 ${
                          AVATAR_TONES[idx % AVATAR_TONES.length]
                        }`}
                      >
                        {act.initials}
                      </span>
                      <span className="text-[14px] font-medium text-[#0B192C] truncate">{act.title}</span>
                    </div>
                    <span className="text-[14px] font-semibold text-[#5B6D85] tabular-nums shrink-0">
                      {act.meta}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clients & Profile Strip (matching Team card structure) */}
          <div className="bg-white rounded-2xl border border-[#E5E9F0] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 min-w-0">
              <span className="font-heading text-base font-bold text-[#0B192C] whitespace-nowrap">Network</span>

              <div className="flex items-center -space-x-2">
                {(avatarPeople.length > 0 ? avatarPeople : [business.business_name || 'MO']).map((person, idx) => (
                  <div
                    key={person + idx}
                    title={person}
                    className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[13px] font-bold ${
                      AVATAR_TONES[idx % AVATAR_TONES.length]
                    }`}
                  >
                    {getInitials(person)}
                  </div>
                ))}
              </div>

              <div className="text-[13px] font-semibold uppercase tracking-wider text-[#5B6D85] tabular-nums">
                {customers.length} Clients · {profileCompletion}% Profile
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {referralCode && (
                <button
                  type="button"
                  onClick={() => {
                    const url = getShareableReferralUrl(referralCode);
                    navigator.clipboard?.writeText(url).catch(() => {});
                    setCopiedReferral(true);
                    setTimeout(() => setCopiedReferral(false), 2200);
                  }}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0B192C] bg-[#F4F7FB] hover:bg-[#E5E9F0] border border-[#E5E9F0] px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap"
                  title="Copy your personal MatthOrg referral invite link"
                >
                  {copiedReferral ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Gift className="w-3.5 h-3.5 text-[#3D74D9]" />
                  )}
                  <span>{copiedReferral ? 'Invite link copied' : `Refer · ${referralCode}`}</span>
                </button>
              )}

              {onNavigateToSettings && (
                <button
                  type="button"
                  onClick={onNavigateToSettings}
                  className="text-[14px] font-semibold text-[#3D74D9] hover:underline cursor-pointer whitespace-nowrap"
                >
                  Edit profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Links */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E5E9F0] p-5 flex flex-col justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-[#0B192C] mb-3">Quick links</h2>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => onOpenNewQuote(false)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EEF3FA] text-[14px] font-semibold text-[#0B192C] flex items-center gap-2.5 transition cursor-pointer text-left"
              >
                <FileText className="w-4 h-4 text-[#5B6D85]" />
                <span>New quote</span>
              </button>

              <button
                type="button"
                onClick={onOpenNewInvoice}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EEF3FA] text-[14px] font-semibold text-[#0B192C] flex items-center gap-2.5 transition cursor-pointer text-left"
              >
                <CreditCard className="w-4 h-4 text-[#5B6D85]" />
                <span>New invoice</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenNewQuote(true)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EEF3FA] text-[14px] font-semibold text-[#0B192C] flex items-center gap-2.5 transition cursor-pointer text-left"
              >
                <Sparkles className="w-4 h-4 text-[#3D74D9]" />
                <span>AI draft quote</span>
              </button>

              {onOpenNewLead && (
                <button
                  type="button"
                  onClick={onOpenNewLead}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EEF3FA] text-[14px] font-semibold text-[#0B192C] flex items-center gap-2.5 transition cursor-pointer text-left"
                >
                  <UserPlus className="w-4 h-4 text-[#5B6D85]" />
                  <span>Add lead</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleExportReport}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EEF3FA] text-[14px] font-semibold text-[#0B192C] flex items-center gap-2.5 transition cursor-pointer text-left"
              >
                <FileDown className="w-4 h-4 text-[#5B6D85]" />
                <span>Export report</span>
              </button>

              {onNavigateToSettings && (
                <button
                  type="button"
                  onClick={onNavigateToSettings}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EEF3FA] text-[14px] font-semibold text-[#0B192C] flex items-center gap-2.5 transition cursor-pointer text-left"
                >
                  <Settings className="w-4 h-4 text-[#5B6D85]" />
                  <span>Settings</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 6. Authorised Lead Inbox (Compact Operational Table) */}
      <div className="bg-white rounded-2xl border border-[#E5E9F0] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-lg font-bold text-[#0B192C]">Lead Inbox &amp; Customer Requests</h3>
              <span className="text-[13px] text-[#5B6D85] tabular-nums">· {leads.length} records</span>
            </div>
            <p className="text-[14px] text-[#5B6D85] mt-0.5">
              Authorised buyer inquiries, customer requests, and quote conversions
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenNewLead && (
              <button
                type="button"
                onClick={onOpenNewLead}
                className="px-3.5 py-2 rounded-xl bg-[#0B192C] hover:bg-[#152744] text-white text-[14px] font-semibold transition cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Add Lead</span>
              </button>
            )}
            {onNavigateToLeads && (
              <button
                type="button"
                onClick={onNavigateToLeads}
                className="px-3.5 py-2 rounded-xl bg-[#F4F7FB] hover:bg-[#E5E9F0] text-[#0B192C] text-[14px] font-semibold transition cursor-pointer inline-flex items-center gap-1 whitespace-nowrap"
              >
                <span>Full Pipeline</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-[#F4F7FB] rounded-xl overflow-x-auto text-[14px]">
            {[
              { id: 'all', label: `All (${leads.length})` },
              { id: 'New', label: `New (${leads.filter((l) => l.status === 'New').length})` },
              { id: 'Contacted', label: `Contacted (${leads.filter((l) => l.status === 'Contacted').length})` },
              { id: 'Qualified', label: `Qualified (${leads.filter((l) => l.status === 'Qualified').length})` },
              { id: 'Won', label: `Won (${leads.filter((l) => l.status === 'Won').length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setLeadStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition shrink-0 cursor-pointer ${
                  leadStatusFilter === tab.id
                    ? 'bg-white text-[#0B192C] shadow-2xs'
                    : 'text-[#5B6D85] hover:text-[#0B192C]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#8F9FB5]" />
              <input
                type="text"
                value={leadSearchQuery}
                onChange={(e) => setLeadSearchQuery(e.target.value)}
                placeholder="Filter leads..."
                className="pl-9 pr-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E5E9F0] text-[14px] text-[#0B192C] focus:outline-none focus:border-[#3D74D9] w-44"
              />
            </div>

            <select
              value={leadSortBy}
              onChange={(e) => setLeadSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E5E9F0] text-[14px] font-semibold text-[#0B192C] focus:outline-none cursor-pointer"
            >
              <option value="intent">Sort: Hot Intent</option>
              <option value="date">Sort: Newest</option>
              <option value="budget">Sort: Budget</option>
            </select>
          </div>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="py-8 text-center bg-[#F8FAFC] rounded-xl border border-[#E5E9F0] p-6 space-y-2.5">
            <p className="text-[15px] font-semibold text-[#0B192C]">No leads match your active filters</p>
            {onNavigateToMarketplace && (
              <button
                type="button"
                onClick={onNavigateToMarketplace}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-semibold transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Find Buyer Leads</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#F1F5F9] rounded-xl border border-[#E5E9F0] overflow-hidden">
            {filteredLeads.slice(0, 5).map((lead) => {
              const isPaid = hasActiveSubscription(
                business.id,
                user?.plan,
                business.subscription_status,
                business.subscription_expires_at
              );
              const isLocked = !isPaid && (lead.is_locked || lead.source === 'marketplace');

              return (
                <div
                  key={lead.id}
                  className="px-4 py-3.5 hover:bg-[#F8FAFC] transition flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div
                    className="flex items-start gap-3 cursor-pointer flex-1 min-w-0"
                    onClick={() => {
                      if (isLocked) {
                        onOpenSubscription();
                        return;
                      }
                      if (onOpenLeadModal) onOpenLeadModal(lead);
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-[14px]">
                        <span className="font-bold text-[#0B192C] truncate">{lead.customer_name}</span>
                        <span className="text-[#8F9FB5] font-mono text-[13px] tabular-nums">{lead.lead_number}</span>
                        <span aria-hidden="true" className="text-[#CBD5E1]">·</span>
                        <span className={`font-semibold ${lead.status === 'Won' ? 'text-emerald-700' : 'text-[#3D74D9]'}`}>
                          {lead.status}
                        </span>
                        {isLocked && (
                          <span className="inline-flex items-center gap-1 text-[13px] text-amber-700 font-semibold">
                            <Lock className="w-3.5 h-3.5" /> Locked
                          </span>
                        )}
                        {lead.intent_score >= 80 && (
                          <span className="inline-flex items-center gap-1 text-[13px] text-amber-700 font-semibold tabular-nums">
                            <Flame className="w-3.5 h-3.5" /> {lead.intent_score}/100
                          </span>
                        )}
                      </div>
                      <p className="text-[14px] text-[#5B6D85] truncate mt-0.5">
                        <span className="font-medium text-[#0B192C]">{lead.service_required}</span> · {lead.location} ·{' '}
                        {lead.budget_formatted || 'Budget Negotiable'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (isLocked) {
                          onOpenSubscription();
                          return;
                        }
                        if (onConvertToQuoteForLead) onConvertToQuoteForLead(lead);
                        else onOpenNewQuote(false);
                      }}
                      className="px-3.5 py-2 rounded-lg bg-[#0B192C] hover:bg-[#152744] text-white text-[14px] font-semibold transition cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                      <span>{isLocked ? 'Unlock' : 'Create Quote'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const text = createLeadIntroWhatsAppText(
                          lead.customer_name,
                          business.business_name,
                          lead.service_required
                        );
                        window.open(buildWhatsAppLink(lead.whatsapp || lead.phone, text), '_blank');
                      }}
                      className="p-2 rounded-lg text-emerald-700 hover:bg-emerald-50 border border-[#E5E9F0] transition cursor-pointer"
                      title="WhatsApp Follow-Up"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>

                    {onOpenLeadModal && (
                      <button
                        type="button"
                        onClick={() => onOpenLeadModal(lead)}
                        className="px-3 py-2 rounded-lg bg-[#F4F7FB] hover:bg-[#E5E9F0] text-[#0B192C] text-[14px] font-semibold transition cursor-pointer"
                      >
                        Details
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. Recent Quotes & Invoices */}
      <div className="bg-white rounded-2xl border border-[#E5E9F0] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F4F7FB] rounded-xl text-[14px] max-w-full">
            {[
              { id: 'all' as const, label: `All Documents (${quotes.length + invoices.length})` },
              { id: 'quotes' as const, label: `Quotes (${quotes.length})` },
              { id: 'invoices' as const, label: `Invoices (${invoices.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategoryFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  activeCategoryFilter === tab.id
                    ? 'bg-white text-[#0B192C] shadow-2xs'
                    : 'text-[#5B6D85] hover:text-[#0B192C]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-1 bg-[#F4F7FB] border border-[#E5E9F0] p-0.5 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-[#0B192C] shadow-2xs' : 'text-[#5B6D85]'
              }`}
              title="Compact List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-[#0B192C] shadow-2xs' : 'text-[#5B6D85]'
              }`}
              title="Grid Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {combinedDocs.length === 0 ? (
          <div className="py-10 text-center bg-[#F8FAFC] rounded-xl border border-[#E5E9F0] p-6">
            <Layers className="w-8 h-8 text-[#8F9FB5] mx-auto mb-2" />
            <h4 className="font-heading text-base font-bold text-[#0B192C]">No matching documents found</h4>
            <p className="text-[14px] text-[#5B6D85] mt-1">Create a quotation or invoice to manage active deals.</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="divide-y divide-[#F1F5F9] rounded-xl border border-[#E5E9F0] overflow-hidden">
            {combinedDocs.slice(0, 8).map((doc) => {
              const isQuote = doc.type === 'quote';
              const docNum = isQuote ? (doc.data as Quote).quote_number : (doc.data as Invoice).invoice_number;
              const status = doc.data.status;
              const total = doc.data.total;
              const customerName = doc.data.customer_name;

              return (
                <div
                  key={`${doc.type}_${doc.data.id}`}
                  className="px-4 py-3.5 hover:bg-[#F8FAFC] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div
                    onClick={() => (isQuote ? onOpenQuote(doc.data as Quote) : onOpenInvoice(doc.data as Invoice))}
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isQuote ? 'bg-blue-50 text-[#3D74D9]' : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {isQuote ? <FileText className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[15px]">
                        <span className="font-bold text-[#0B192C] truncate">{customerName}</span>
                        <span className="font-mono text-[13px] text-[#5B6D85] tabular-nums">{docNum}</span>
                      </div>
                      <span className="text-[13px] text-[#5B6D85]">
                        {isQuote ? 'Quotation' : 'Invoice'} · Issued {formatDate(doc.data.issue_date)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <span className={`text-[14px] font-semibold ${getStatusTextTone(status)}`}>{status}</span>
                    <div className="font-mono text-[15px] font-bold text-[#0B192C] tabular-nums">
                      {formatCurrency(total, business.currency)}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          isQuote
                            ? handleSendQuoteWhatsApp(doc.data as Quote)
                            : handleSendInvoiceWhatsApp(doc.data as Invoice)
                        }
                        className="p-1.5 text-[#5B6D85] hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
                        title="Send via WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          isQuote
                            ? printQuotePDF(doc.data as Quote, business)
                            : printInvoicePDF(doc.data as Invoice, business)
                        }
                        className="p-1.5 text-[#5B6D85] hover:text-[#0B192C] rounded-lg hover:bg-slate-100 transition cursor-pointer"
                        title="Print"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          isQuote
                            ? generateQuotePDF(doc.data as Quote, business)
                            : generateInvoicePDF(doc.data as Invoice, business)
                        }
                        className="p-1.5 text-[#5B6D85] hover:text-[#0B192C] rounded-lg hover:bg-slate-100 transition cursor-pointer"
                        title="Download PDF"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>
                      {((isQuote && onDeleteQuote) || (!isQuote && onDeleteInvoice)) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Remove ${isQuote ? 'quotation' : 'invoice'} ${docNum}?`)) {
                              if (isQuote && onDeleteQuote) onDeleteQuote(doc.data.id);
                              if (!isQuote && onDeleteInvoice) onDeleteInvoice(doc.data.id);
                            }
                          }}
                          className="p-1.5 text-[#8F9FB5] hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {combinedDocs.slice(0, 6).map((doc) => {
              const isQuote = doc.type === 'quote';
              const docNum = isQuote ? (doc.data as Quote).quote_number : (doc.data as Invoice).invoice_number;
              const status = doc.data.status;
              const total = doc.data.total;
              const customerName = doc.data.customer_name;

              return (
                <div
                  key={`${doc.type}_${doc.data.id}`}
                  className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E9F0] hover:border-[#3D74D9]/50 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[13px] mb-2">
                      <span className={`font-semibold ${getStatusTextTone(status)}`}>{status}</span>
                      <span className="font-mono text-[#5B6D85] tabular-nums">{docNum}</span>
                    </div>
                    <h4
                      onClick={() => (isQuote ? onOpenQuote(doc.data as Quote) : onOpenInvoice(doc.data as Invoice))}
                      className="font-heading text-base font-bold text-[#0B192C] hover:text-[#3D74D9] cursor-pointer truncate"
                    >
                      {customerName}
                    </h4>
                    <p className="text-[13px] text-[#5B6D85] mt-0.5">
                      {isQuote ? 'Quotation' : 'Invoice'} · {formatDate(doc.data.issue_date)}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[#E5E9F0] flex items-center justify-between">
                    <span className="font-mono text-base font-bold text-[#0B192C] tabular-nums">
                      {formatCurrency(total, business.currency)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          isQuote
                            ? handleSendQuoteWhatsApp(doc.data as Quote)
                            : handleSendInvoiceWhatsApp(doc.data as Invoice)
                        }
                        className="p-1.5 text-[#5B6D85] hover:text-emerald-700 rounded-lg transition cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          isQuote
                            ? generateQuotePDF(doc.data as Quote, business)
                            : generateInvoicePDF(doc.data as Invoice, business)
                        }
                        className="p-1.5 text-[#5B6D85] hover:text-[#0B192C] rounded-lg transition cursor-pointer"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 8. Artisan Outreach Quick Summary (if recommendations exist) */}
      {artisanRecs.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E5E9F0] p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-[#3D74D9]" />
              <h3 className="font-heading text-lg font-bold text-[#0B192C]">Recommended Professionals &amp; Outreach</h3>
              <span className="text-[13px] text-[#5B6D85] tabular-nums">· {artisanRecs.length} profiles</span>
            </div>
            {onNavigateToRecommendations && (
              <button
                type="button"
                onClick={onNavigateToRecommendations}
                className="text-[14px] font-semibold text-[#3D74D9] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Manage Outreach</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {artisanRecs.slice(0, 3).map((artisan) => {
              const isContacted =
                artisan.outreach_status === 'whatsapp_sent' ||
                artisan.outreach_status === 'sms_sent' ||
                artisan.outreach_status === 'email_sent';

              return (
                <div
                  key={artisan.id}
                  className="p-4 rounded-xl border border-[#E5E9F0] bg-[#F8FAFC] flex flex-col justify-between gap-2.5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-heading text-[15px] font-bold text-[#0B192C] truncate">{artisan.artisan_name}</h4>
                      <span className="text-[13px] text-[#5B6D85] tabular-nums shrink-0">
                        {artisan.vouches_count || 1} vouches
                      </span>
                    </div>
                    <p className="text-[13px] text-[#3D74D9] font-medium mt-0.5">
                      {artisan.trade_category} · {artisan.town}, {artisan.state}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#E5E9F0]">
                    <span className={`text-[13px] font-semibold ${isContacted ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {isContacted ? 'Invited' : 'Needs outreach'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const rawPhone = (artisan.whatsapp || artisan.phone || '').replace(/[^0-9]/g, '');
                          const msg = buildArtisanOutreachMessage(artisan, 'whatsapp');
                          window.open(`https://wa.me/${rawPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                          updateArtisanRecommendation(artisan.id, {
                            outreach_status: 'whatsapp_sent',
                            outreach_channel: 'whatsapp',
                            outreach_sent_at: new Date().toISOString(),
                          }).then(() => {
                            setArtisanRecs((prev) =>
                              prev.map((r) =>
                                r.id === artisan.id ? { ...r, outreach_status: 'whatsapp_sent' } : r
                              )
                            );
                          });
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold cursor-pointer"
                      >
                        WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const msg = buildArtisanOutreachMessage(artisan, 'sms');
                          window.location.href = `sms:${artisan.phone.trim()}?body=${encodeURIComponent(msg)}`;
                          updateArtisanRecommendation(artisan.id, {
                            outreach_status: 'sms_sent',
                            outreach_channel: 'sms',
                            outreach_sent_at: new Date().toISOString(),
                          }).catch(() => {});
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#3D74D9] hover:bg-[#2F62C2] text-white text-[13px] font-semibold cursor-pointer inline-flex items-center gap-1"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>SMS</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
