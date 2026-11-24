import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  UserPlus,
} from 'lucide-react';
import type {
  DirectoryBusiness,
  FulfilmentRequest,
  FulfilmentStatus,
} from '../../types';
import {
  createFulfilmentRequest,
  deleteFulfilmentRequest,
  fetchDirectoryBusinesses,
  fetchFulfilmentRequests,
  updateFulfilmentRequest,
} from '../../data/commerceData';

const STATUS_OPTIONS: FulfilmentStatus[] = [
  'New',
  'Awaiting Sourcing',
  'Processing',
  'Matching Providers Found',
  'Customer Contacted',
  'Fulfilled',
  'Unfulfilled',
];

export const FulfilmentView: React.FC = () => {
  const [requests, setRequests] = useState<FulfilmentRequest[]>([]);
  const [businesses, setBusinesses] = useState<DirectoryBusiness[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | FulfilmentStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  // Provider match draft per request
  const [attachingRequestId, setAttachingRequestId] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [customProviderName, setCustomProviderName] = useState('');
  const [customProviderPhone, setCustomProviderPhone] = useState('');
  const [matchNote, setMatchNote] = useState('');
  const [quotedPrice, setQuotedPrice] = useState('');

  // Quick manual fulfilment request creation
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newReq, setNewReq] = useState({
    customer_name: '',
    customer_phone: '',
    request_summary: '',
    location: 'Lagos',
    budget_max: '',
  });

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const loadData = async () => {
    const [reqs, bizList] = await Promise.all([
      fetchFulfilmentRequests(),
      fetchDirectoryBusinesses(false),
    ]);
    setRequests(reqs);
    setBusinesses(bizList);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.request_summary.toLowerCase().includes(q) ||
          r.customer_name.toLowerCase().includes(q) ||
          (r.location || '').toLowerCase().includes(q) ||
          r.request_number.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [requests, statusFilter, searchQuery]);

  const handleAttachProvider = async (reqId: string) => {
    const chosenBiz = businesses.find((b) => b.id === selectedProviderId);
    const providerName = chosenBiz ? chosenBiz.business_name : customProviderName.trim();
    const providerPhone = chosenBiz ? chosenBiz.phone : customProviderPhone.trim();
    if (!providerName) return;

    await updateFulfilmentRequest(reqId, {
      attachMatch: {
        provider_id: chosenBiz?.id,
        provider_name: providerName,
        provider_phone: providerPhone || undefined,
        provider_type: chosenBiz?.provider_type || 'business',
        match_note: matchNote.trim() || undefined,
        quoted_price: quotedPrice ? Number(quotedPrice) : undefined,
        status: 'Proposed',
      },
    });

    setAttachingRequestId(null);
    setSelectedProviderId('');
    setCustomProviderName('');
    setCustomProviderPhone('');
    setMatchNote('');
    setQuotedPrice('');
    flash('Matching provider attached and status updated.');
    await loadData();
  };

  const handleCreateManualRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReq.customer_name.trim() || !newReq.customer_phone.trim() || !newReq.request_summary.trim()) return;
    const budgetNum = newReq.budget_max ? Number(newReq.budget_max) : undefined;
    await createFulfilmentRequest({
      customer_name: newReq.customer_name.trim(),
      customer_phone: newReq.customer_phone.trim(),
      request_summary: newReq.request_summary.trim(),
      location: newReq.location.trim(),
      budget_max: budgetNum,
      budget_formatted: budgetNum ? `Up to ₦${budgetNum.toLocaleString()}` : 'Open / Quote',
    });
    setNewReq({ customer_name: '', customer_phone: '', request_summary: '', location: 'Lagos', budget_max: '' });
    setShowCreateForm(false);
    flash('Fulfilment request registered and synced to Leads & Customer Tracker.');
    await loadData();
  };

  const openCount = requests.filter((r) => r.status !== 'Fulfilled' && r.status !== 'Unfulfilled').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E9F0] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-emerald-700">
            <ClipboardList className="w-4 h-4" />
            <span>MatthOrg Sourcing & Fulfilment Pipeline</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-[28px] font-bold text-[#0B192C] tracking-tight mt-1">
            Unfulfilled & Custom Customer Requests ({requests.length})
          </h2>
          <p className="text-[15px] text-[#5B6D85] mt-1 leading-relaxed">
            Capture unmet Matthew AI searches, attach verified providers, dispatch quotes, and track conversion through CRM Leads.{' '}
            <span className="font-mono tabular-nums font-bold text-[#0B192C]">{openCount}</span> active
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-[14px]">
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0B192C] font-semibold cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white font-bold cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Log Fulfilment Request</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[15px] font-semibold">
          {notice}
        </div>
      )}

      {showCreateForm && (
        <form onSubmit={handleCreateManualRequest} className="p-5 rounded-2xl bg-white border border-[#CBD5E1] grid grid-cols-1 sm:grid-cols-5 gap-3 text-[15px]">
          <input
            required
            placeholder="Customer Name *"
            value={newReq.customer_name}
            onChange={(e) => setNewReq({ ...newReq, customer_name: e.target.value })}
            className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[#0B192C]"
          />
          <input
            required
            placeholder="Phone / WhatsApp *"
            value={newReq.customer_phone}
            onChange={(e) => setNewReq({ ...newReq, customer_phone: e.target.value })}
            className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[#0B192C]"
          />
          <input
            required
            placeholder="Product or service needed *"
            value={newReq.request_summary}
            onChange={(e) => setNewReq({ ...newReq, request_summary: e.target.value })}
            className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[#0B192C]"
          />
          <input
            placeholder="Location (City, State)"
            value={newReq.location}
            onChange={(e) => setNewReq({ ...newReq, location: e.target.value })}
            className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[#0B192C]"
          />
          <button
            type="submit"
            className="rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white font-bold px-4 py-2.5 cursor-pointer whitespace-nowrap"
          >
            Save Request
          </button>
        </form>
      )}

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#E5E9F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[15px]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by reference, customer, location, or request..."
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#0B192C] text-[15px]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 font-semibold text-[#0B192C] text-[15px]"
        >
          <option value="ALL">All Statuses ({requests.length})</option>
          {STATUS_OPTIONS.map((st) => (
            <option key={st} value={st}>
              {st} ({requests.filter((r) => r.status === st).length})
            </option>
          ))}
        </select>
      </div>

      {/* Fulfilment Cards */}
      {filteredRequests.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white border border-[#E5E9F0] text-center text-[15px] text-[#5B6D85]">
          No fulfilment requests match your current filter. Unmatched customer requests submitted through Matthew AI appear here automatically.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const cleanWa = (req.customer_whatsapp || req.customer_phone || '').replace(/\D/g, '');
            const matchedText = (req.matches || [])
              .map((m) => `• ${m.provider_name}${m.provider_phone ? ` (${m.provider_phone})` : ''}${m.quoted_price ? ` — ₦${m.quoted_price.toLocaleString()}` : ''}`)
              .join('\n');
            const customerDispatchHref = cleanWa
              ? `https://wa.me/${cleanWa.startsWith('0') ? '234' + cleanWa.slice(1) : cleanWa}?text=${encodeURIComponent(
                  `Hello ${req.customer_name}, regarding your MatthOrg request (${req.request_number}) for "${req.request_summary}":\n${
                    matchedText ? `Here are matched verified providers:\n${matchedText}` : 'Our sourcing team is finalising verified options for you.'
                  }`
                )}`
              : undefined;

            return (
              <div key={req.id} className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E9F0] space-y-4 text-[15px]">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#5B6D85]">
                      <span className="font-mono tabular-nums font-bold text-[#0B192C]">{req.request_number}</span>
                      <span>·</span>
                      <span className="font-semibold text-[#0B192C]">{req.customer_name}</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">{req.customer_phone}</span>
                      <span>·</span>
                      <span>{req.location || 'Nigeria'}</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">{req.budget_formatted || 'Open Budget'}</span>
                    </div>
                    <h3 className="font-heading text-lg font-bold text-[#0B192C]">{req.request_summary}</h3>
                    {req.details && <p className="text-[15px] text-[#475569] leading-relaxed">{req.details}</p>}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <select
                      value={req.status}
                      onChange={async (e) => {
                        await updateFulfilmentRequest(req.id, { status: e.target.value as FulfilmentStatus });
                        await loadData();
                      }}
                      className="rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] px-3 py-2 font-semibold text-[#0B192C] text-[14px]"
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() =>
                        setAttachingRequestId(attachingRequestId === req.id ? null : req.id)
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[14px] font-bold cursor-pointer whitespace-nowrap"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Attach Provider</span>
                    </button>

                    {customerDispatchHref && (
                      <a
                        href={customerDispatchHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={async () => {
                          if (req.status !== 'Fulfilled') {
                            await updateFulfilmentRequest(req.id, { status: 'Customer Contacted' });
                            loadData();
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-bold whitespace-nowrap"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Send to Customer</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={async () => {
                        await deleteFulfilmentRequest(req.id);
                        await loadData();
                      }}
                      className="p-2 text-[#64748B] hover:text-rose-600 cursor-pointer"
                      title="Delete request"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Attach Provider Inline Panel */}
                {attachingRequestId === req.id && (
                  <div className="p-4 rounded-xl bg-[#FAFBFD] border border-[#CBD5E1] space-y-3">
                    <div className="font-heading font-bold text-base text-[#0B192C]">Select Approved Directory Provider or Enter External Match</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-[14px]">
                      <select
                        value={selectedProviderId}
                        onChange={(e) => setSelectedProviderId(e.target.value)}
                        className="rounded-lg bg-white border border-[#E2E8F0] px-3 py-2 text-[#0B192C]"
                      >
                        <option value="">-- Choose from Directory ({businesses.length}) --</option>
                        {businesses.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.business_name} ({b.city || b.state || 'Nigeria'} · {b.phone})
                          </option>
                        ))}
                      </select>

                      {!selectedProviderId && (
                        <>
                          <input
                            placeholder="Or External Provider Name"
                            value={customProviderName}
                            onChange={(e) => setCustomProviderName(e.target.value)}
                            className="rounded-lg bg-white border border-[#E2E8F0] px-3 py-2 text-[#0B192C]"
                          />
                          <input
                            placeholder="Provider Phone"
                            value={customProviderPhone}
                            onChange={(e) => setCustomProviderPhone(e.target.value)}
                            className="rounded-lg bg-white border border-[#E2E8F0] px-3 py-2 text-[#0B192C] font-mono tabular-nums"
                          />
                        </>
                      )}

                      <input
                        type="number"
                        placeholder="Quoted Price ₦ (optional)"
                        value={quotedPrice}
                        onChange={(e) => setQuotedPrice(e.target.value)}
                        className="rounded-lg bg-white border border-[#E2E8F0] px-3 py-2 text-[#0B192C] font-mono tabular-nums"
                      />
                      <input
                        placeholder="Sourcing Note (optional)"
                        value={matchNote}
                        onChange={(e) => setMatchNote(e.target.value)}
                        className="rounded-lg bg-white border border-[#E2E8F0] px-3 py-2 text-[#0B192C]"
                      />
                    </div>
                    <div className="flex justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setAttachingRequestId(null)}
                        className="px-3.5 py-2 text-[14px] font-semibold text-[#5B6D85] cursor-pointer whitespace-nowrap"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAttachProvider(req.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-bold cursor-pointer whitespace-nowrap"
                      >
                        <Send className="w-4 h-4" />
                        <span>Attach Match</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Attached Provider Matches */}
                {(req.matches || []).length > 0 && (
                  <div className="pt-3 border-t border-[#F1F5F9] space-y-2">
                    <div className="text-[13px] font-bold text-[#5B6D85] uppercase tracking-wider">
                      Matched Providers ({req.matches.length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {req.matches.map((m) => (
                        <div
                          key={m.id}
                          className="p-3 rounded-xl bg-[#FAFBFD] border border-[#E2E8F0] flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-heading font-bold text-[15px] text-[#0B192C] truncate">{m.provider_name}</div>
                            <div className="text-[13px] text-[#5B6D85] tabular-nums">
                              {[m.provider_phone, m.quoted_price ? `₦${m.quoted_price.toLocaleString()}` : null, m.match_note]
                                .filter(Boolean)
                                .join(' · ')}
                            </div>
                          </div>
                          <span className="text-[13px] font-bold text-emerald-700 shrink-0 flex items-center gap-1 whitespace-nowrap">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {m.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
