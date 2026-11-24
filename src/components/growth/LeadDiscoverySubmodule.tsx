// ============================================================================
// MatthOrg AI Growth Engine — Submodule 1: Lead Discovery
// High-density business discovery with Google Places & Verified Directory
// ============================================================================

import React, { useState } from 'react';
import {
  Search,
  Filter,
  MapPin,
  Globe,
  Building2,
  Users,
  Sparkles,
  Download,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Database,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { DiscoveredBusiness, GrowthSearchFilter } from '../../types/growthEngine';
import { performLeadDiscovery } from '../../lib/growthEngineDb';

interface LeadDiscoverySubmoduleProps {
  onSelectLeadForResearch: (lead: DiscoveredBusiness) => void;
  onSelectLeadForQualification: (lead: DiscoveredBusiness) => void;
  onSelectLeadForOutreach: (lead: DiscoveredBusiness) => void;
  onSelectLeadForContact: (lead: DiscoveredBusiness) => void;
  onRefreshLeads: () => void;
}

const CATEGORY_PRESETS = [
  'Real Estate',
  'Solar & Energy',
  'Construction & Civil',
  'Healthcare & Hospitals',
  'Hospitality & Hotels',
  'Logistics & Freight',
  'Education & Schools',
  'Professional Services',
  'Information Technology',
  'Manufacturing & Industrial',
];

const NIGERIAN_STATES = [
  'Lagos',
  'FCT Abuja',
  'Rivers',
  'Oyo',
  'Delta',
  'Enugu',
  'Kano',
  'Kaduna',
  'Ogun',
  'Edo',
  'Anambra',
];

export const LeadDiscoverySubmodule: React.FC<LeadDiscoverySubmoduleProps> = ({
  onSelectLeadForResearch,
  onSelectLeadForQualification,
  onSelectLeadForOutreach,
  onSelectLeadForContact,
  onRefreshLeads,
}) => {
  const [category, setCategory] = useState('Real Estate');
  const [businessName, setBusinessName] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [state, setState] = useState('Lagos');
  const [city, setCity] = useState('');
  const [businessSize, setBusinessSize] = useState<'all' | 'micro' | 'small' | 'mid' | 'enterprise'>('all');
  const [limit, setLimit] = useState(25);
  const [websiteStatus, setWebsiteStatus] = useState<'all' | 'has_website' | 'no_website'>('all');
  const [keywords, setKeywords] = useState('');
  const [customerRequirements, setCustomerRequirements] = useState(
    'Find companies that need commercial solar power or modernized facility contracts'
  );
  const [provider, setProvider] = useState<'auto' | 'google_places' | 'verified_directory'>('auto');

  const [isLoading, setIsLoading] = useState(false);
  const [discoveredResults, setDiscoveredResults] = useState<DiscoveredBusiness[]>([]);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const handleExecuteDiscovery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!category.trim()) {
      setSearchFeedback('Please select or specify a business category.');
      return;
    }

    setIsLoading(true);
    setSearchFeedback(null);

    const filter: GrowthSearchFilter = {
      category: category.trim(),
      businessName: businessName.trim() || undefined,
      country,
      state,
      city: city.trim() || state,
      businessSize,
      limit,
      websiteStatus,
      additionalKeywords: keywords.trim() || undefined,
      customerRequirements: customerRequirements.trim() || undefined,
      provider,
    };

    try {
      const res = await performLeadDiscovery(filter);
      setDiscoveredResults(res.businesses || []);
      setSearchFeedback(`Discovered ${res.totalDiscovered} matching commercial enterprises (${res.newAdded} new added to pipeline).`);
      onRefreshLeads();
    } catch (err: any) {
      setSearchFeedback(err?.message || 'Error occurred during discovery.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleExportCSV = () => {
    const listToExport =
      selectedIds.length > 0 ? discoveredResults.filter((r) => selectedIds.includes(r.id)) : discoveredResults;

    if (listToExport.length === 0) return;

    const headers = ['Business Name', 'Category', 'Industry', 'State', 'City', 'Phone', 'Email', 'Website', 'Source', 'Date'];
    const rows = listToExport.map((b) => [
      `"${b.business_name.replace(/"/g, '""')}"`,
      `"${b.category}"`,
      `"${b.industry}"`,
      `"${b.state}"`,
      `"${b.city}"`,
      `"${b.phone || ''}"`,
      `"${b.email || ''}"`,
      `"${b.website || ''}"`,
      `"${b.data_source}"`,
      `"${b.retrieval_date.split('T')[0]}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `matthorg_leads_${category.toLowerCase()}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Search & Discovery Command Panel */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-xl bg-blue-50 text-[#3D74D9]">
                <Search className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-[#0B192C]">Business Lead Discovery</h2>
                <p className="text-[15px] text-[#5B6D85]">
                  Search authorised commercial directories, corporate registries, and Google Places data.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer whitespace-nowrap"
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              <span>{showAdvancedFilters ? 'Hide Advanced' : 'Advanced Filters'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleExecuteDiscovery()}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[15px] font-bold flex items-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-60 cursor-pointer whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Discovering...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Discover Leads</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Discovery Form */}
        <form onSubmit={handleExecuteDiscovery} className="pt-5 space-y-4">
          {/* Quick Category Chips */}
          <div>
            <label className="text-[13px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">
              Popular Target Sectors
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_PRESETS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3.5 py-2 rounded-lg text-[14px] font-semibold transition cursor-pointer whitespace-nowrap ${
                    category === cat
                      ? 'bg-[#0B192C] text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Search Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
            {/* Category / Industry Input */}
            <div className="space-y-1.5">
              <label className="text-[14px] font-bold text-slate-700">Target Industry / Trade *</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Real Estate, Solar, Hospitals..."
                  className="w-full pl-10 pr-3.5 py-2.5 text-[15px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3D74D9]"
                  required
                />
              </div>
            </div>

            {/* State Selection */}
            <div className="space-y-1.5">
              <label className="text-[14px] font-bold text-slate-700">State / Region</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-[15px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3D74D9] bg-white"
                >
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s} State
                    </option>
                  ))}
                  <option value="All Nigeria">All Nigeria</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="United States">United States</option>
                  <option value="Ghana">Ghana</option>
                </select>
              </div>
            </div>

            {/* City or District */}
            <div className="space-y-1.5">
              <label className="text-[14px] font-bold text-slate-700">City / District</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Lekki, Ikeja, Maitama..."
                className="w-full px-3.5 py-2.5 text-[15px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3D74D9]"
              />
            </div>

            {/* Number of Leads to Discover */}
            <div className="space-y-1.5">
              <label className="text-[14px] font-bold text-slate-700">Batch Quantity</label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-[15px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3D74D9] bg-white tabular-nums"
              >
                <option value={10}>10 Prospects</option>
                <option value={25}>25 Prospects</option>
                <option value={50}>50 Prospects</option>
                <option value={100}>100 Prospects</option>
              </select>
            </div>
          </div>

          {/* Specific Customer Requirements / Selling Context */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[14px] font-bold text-slate-700 flex items-center justify-between gap-2">
              <span>Specific Opportunity Requirements (Context for AI Researcher & Scoring)</span>
              <span className="text-[13px] text-slate-500 font-normal">Guides opportunity identification</span>
            </label>
            <input
              type="text"
              value={customerRequirements}
              onChange={(e) => setCustomerRequirements(e.target.value)}
              placeholder="e.g. Find commercial establishments that could benefit from inverter backup power, high-volume laundry, or web renovation"
              className="w-full px-3.5 py-2.5 text-[15px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3D74D9]"
            />
          </div>

          {/* Advanced Filters Drawer */}
          {showAdvancedFilters && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3.5 animate-in fade-in text-[14px]">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Company Name (Optional)</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. LandWey, Hilton..."
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-[15px]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Business Size</label>
                <select
                  value={businessSize}
                  onChange={(e) => setBusinessSize(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-[15px]"
                >
                  <option value="all">All Sizes</option>
                  <option value="micro">Micro (1-10 staff)</option>
                  <option value="small">Small (11-50 staff)</option>
                  <option value="mid">Mid-Market (51-200)</option>
                  <option value="enterprise">Enterprise (200+)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Website Filter</label>
                <select
                  value={websiteStatus}
                  onChange={(e) => setWebsiteStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-[15px]"
                >
                  <option value="all">Any Domain Status</option>
                  <option value="has_website">Has Live Website</option>
                  <option value="no_website">No Live Website (High Pitch Need)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Discovery Source</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-[15px]"
                >
                  <option value="auto">Auto (Google Places + Verified Directory)</option>
                  <option value="google_places">Google Places API Only</option>
                  <option value="verified_directory">Verified Commercial Directory</option>
                </select>
              </div>
            </div>
          )}

          {searchFeedback && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[15px] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{searchFeedback}</span>
              </div>
              <button
                type="button"
                onClick={handleExportCSV}
                className="text-[14px] font-bold text-blue-700 hover:underline flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>
          )}
        </form>
      </div>

      {/* 2. Discovered Businesses Live Grid / Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-heading font-bold text-lg text-[#0B192C]">
              Discovered Prospects ({discoveredResults.length})
            </h3>
            <span className="text-[13px] font-mono bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap">
              Target: {category}
            </span>
          </div>

          {discoveredResults.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[14px] font-bold text-slate-700 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Export Selected ({selectedIds.length > 0 ? selectedIds.length : 'All'})</span>
              </button>
            </div>
          )}
        </div>

        {discoveredResults.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Database className="w-6 h-6" />
            </div>
            <h4 className="font-heading text-lg font-bold text-slate-800">No Prospects Discovered Yet</h4>
            <p className="text-[15px] text-slate-500 max-w-md mx-auto leading-relaxed">
              Select your target industry and location above, then click <strong>Discover Leads</strong> to query verified
              commercial directories and Google Places data.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[15px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[13px] font-bold">
                <tr>
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === discoveredResults.length && discoveredResults.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(discoveredResults.map((r) => r.id));
                        else setSelectedIds([]);
                      }}
                      className="rounded text-blue-600 cursor-pointer h-4 w-4"
                    />
                  </th>
                  <th className="py-3.5 px-4">Business & Trade</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Size & Web</th>
                  <th className="py-3.5 px-4">Data Source & Date</th>
                  <th className="py-3.5 px-4">Stage</th>
                  <th className="py-3.5 px-4 text-right">Intelligence Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {discoveredResults.map((lead) => {
                  const isChecked = selectedIds.includes(lead.id);

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(lead.id)}
                          className="rounded text-blue-600 cursor-pointer h-4 w-4"
                        />
                      </td>

                      <td className="py-4 px-4 min-w-[200px]">
                        <div className="font-heading font-bold text-slate-900 text-base">{lead.business_name}</div>
                        <div className="text-[13px] text-slate-500 mt-0.5">{lead.industry}</div>
                        {lead.phone && (
                          <div className="text-[13px] font-mono tabular-nums text-emerald-700 mt-0.5">{lead.phone}</div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-medium text-slate-700 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{lead.city || lead.state}</span>
                        </div>
                        <span className="text-[13px] text-slate-500">{lead.country}</span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="capitalize text-[13px] font-semibold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 w-fit whitespace-nowrap">
                            {lead.business_size} size
                          </span>
                          {lead.has_website && lead.website ? (
                            <a
                              href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[13px] font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                            >
                              <Globe className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[120px]">Visit site</span>
                            </a>
                          ) : (
                            <span className="text-[13px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded w-fit whitespace-nowrap">
                              No domain
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-[14px] font-medium text-slate-700">
                          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="capitalize">{lead.data_source.replace('_', ' ')}</span>
                        </div>
                        <div className="text-[13px] text-slate-500 font-mono tabular-nums mt-0.5">
                          {lead.retrieval_date ? lead.retrieval_date.split('T')[0] : 'Today'}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`text-[13px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full whitespace-nowrap ${
                            lead.pipeline_stage === 'converted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : lead.pipeline_stage === 'qualified'
                              ? 'bg-blue-100 text-blue-800'
                              : lead.pipeline_stage === 'researched'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {lead.pipeline_stage.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectLeadForResearch(lead)}
                            className="px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[13px] font-bold transition cursor-pointer flex items-center gap-1 whitespace-nowrap"
                            title="Run AI Business Research"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Research</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectLeadForQualification(lead)}
                            className="px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[13px] font-bold transition cursor-pointer whitespace-nowrap"
                            title="Score and Qualify"
                          >
                            <span>Score</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectLeadForOutreach(lead)}
                            className="px-3 py-2 rounded-lg bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[13px] font-bold transition cursor-pointer whitespace-nowrap"
                            title="Draft Personalized Outreach"
                          >
                            <span>Pitch</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
