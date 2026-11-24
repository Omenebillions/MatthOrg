// ============================================================================
// MatthOrg AI Growth Engine — Submodule 6: Lead Pipeline CRM
// 10-stage visual sales board, activity notes, customer conversion, and CSV export
// ============================================================================

import React, { useState } from 'react';
import {
  Kanban,
  List,
  Search,
  Filter,
  Download,
  Plus,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Building2,
  Trash2,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import {
  DiscoveredBusiness,
  GrowthPipelineStage,
} from '../../types/growthEngine';
import { BusinessProfile, Customer, Lead } from '../../types';
import {
  updateLeadPipelineStage,
  addLeadActivityNote,
  convertLeadToMatthOrgCustomer,
} from '../../lib/growthEngineDb';

interface LeadPipelineSubmoduleProps {
  leads: DiscoveredBusiness[];
  business: BusinessProfile;
  onSelectLead: (lead: DiscoveredBusiness) => void;
  onRefreshLeads: () => void;
  onCustomerConverted?: (customer: Customer, lead: Lead) => void;
}

const STAGES: { id: GrowthPipelineStage; label: string; color: string; badge: string }[] = [
  { id: 'discovered', label: '1. Discovered', color: 'border-slate-300', badge: 'bg-slate-100 text-slate-800' },
  { id: 'researched', label: '2. Researched', color: 'border-purple-300', badge: 'bg-purple-100 text-purple-800' },
  { id: 'qualified', label: '3. Qualified', color: 'border-blue-300', badge: 'bg-blue-100 text-blue-800' },
  { id: 'contact_identified', label: '4. Contact Found', color: 'border-cyan-300', badge: 'bg-cyan-100 text-cyan-800' },
  { id: 'contacted', label: '5. Contacted', color: 'border-indigo-300', badge: 'bg-indigo-100 text-indigo-800' },
  { id: 'interested', label: '6. Interested', color: 'border-amber-300', badge: 'bg-amber-100 text-amber-800' },
  { id: 'meeting_scheduled', label: '7. Meeting Set', color: 'border-orange-300', badge: 'bg-orange-100 text-orange-800' },
  { id: 'proposal_sent', label: '8. Proposal Sent', color: 'border-teal-300', badge: 'bg-teal-100 text-teal-800' },
  { id: 'converted', label: '9. Converted 🎉', color: 'border-emerald-400', badge: 'bg-emerald-100 text-emerald-800' },
  { id: 'lost', label: '10. Lost', color: 'border-rose-300', badge: 'bg-rose-100 text-rose-800' },
];

export const LeadPipelineSubmodule: React.FC<LeadPipelineSubmoduleProps> = ({
  leads,
  business,
  onSelectLead,
  onRefreshLeads,
  onCustomerConverted,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | GrowthPipelineStage>('all');
  const [selectedNoteLead, setSelectedNoteLead] = useState<DiscoveredBusiness | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [convertSuccessMessage, setConvertSuccessMessage] = useState<string | null>(null);

  const filteredLeads = leads.filter((lead) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      lead.business_name.toLowerCase().includes(q) ||
      lead.industry.toLowerCase().includes(q) ||
      lead.city.toLowerCase().includes(q) ||
      lead.state.toLowerCase().includes(q);

    const matchesStage = stageFilter === 'all' || lead.pipeline_stage === stageFilter;

    return matchesSearch && matchesStage;
  });

  const handleStageChange = async (leadId: string, newStage: GrowthPipelineStage) => {
    await updateLeadPipelineStage(leadId, newStage);
    onRefreshLeads();
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNoteLead || !newNoteContent.trim()) return;

    await addLeadActivityNote(selectedNoteLead.id, newNoteContent.trim(), business.business_name || 'Admin');
    setNewNoteContent('');
    setSelectedNoteLead(null);
    onRefreshLeads();
  };

  const handleConvert = (lead: DiscoveredBusiness) => {
    const { newCustomer, newLead } = convertLeadToMatthOrgCustomer(lead, business);
    if (onCustomerConverted) {
      onCustomerConverted(newCustomer, newLead);
    }
    setConvertSuccessMessage(`🎉 ${lead.business_name} successfully converted and linked to MatthOrg Customers!`);
    setTimeout(() => setConvertSuccessMessage(null), 4000);
    onRefreshLeads();
  };

  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return;
    const headers = ['Business Name', 'Category', 'Stage', 'City', 'State', 'Phone', 'Email', 'Score'];
    const rows = filteredLeads.map((b) => [
      `"${b.business_name.replace(/"/g, '""')}"`,
      `"${b.category}"`,
      `"${b.pipeline_stage}"`,
      `"${b.city}"`,
      `"${b.state}"`,
      `"${b.phone || ''}"`,
      `"${b.email || ''}"`,
      `"${b.qualification_score?.overall_score || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `growth_pipeline_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Pipeline Control Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-xl bg-teal-50 text-teal-700">
                <Kanban className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-[#0B192C]">Lead Pipeline CRM</h2>
                <p className="text-[15px] text-[#5B6D85]">
                  Track prospects across all 10 sales milestones from initial discovery to commercial conversion.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`px-3.5 py-2 rounded-lg text-[14px] font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Kanban className="w-4 h-4" />
                <span>Kanban</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3.5 py-2 rounded-lg text-[14px] font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  viewMode === 'list' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-4 h-4" />
                <span>Table</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[14px] font-bold text-slate-700 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prospects by name, industry, city, or phone..."
              className="w-full pl-10 pr-3.5 py-2.5 text-[15px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value as any)}
              className="w-full px-3.5 py-2.5 text-[15px] rounded-xl border border-slate-200 bg-white font-medium"
            >
              <option value="all">All Stages ({leads.length})</option>
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} ({leads.filter((l) => l.pipeline_stage === s.id).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {convertSuccessMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[15px] flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{convertSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* 2. Visual Kanban Board View */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="inline-flex gap-4 min-w-full">
            {STAGES.map((stage) => {
              const stageLeads = filteredLeads.filter((l) => l.pipeline_stage === stage.id);

              return (
                <div
                  key={stage.id}
                  className="w-80 shrink-0 bg-slate-50/80 rounded-3xl border border-slate-200 p-4 flex flex-col max-h-[750px]"
                >
                  {/* Stage Header */}
                  <div className="flex items-center justify-between pb-3 px-1">
                    <span className="font-heading font-bold text-[15px] text-slate-800">{stage.label}</span>
                    <span className="text-[13px] font-mono tabular-nums font-bold px-2.5 py-0.5 rounded-full bg-white text-slate-700 shadow-2xs border border-slate-200">
                      {stageLeads.length}
                    </span>
                  </div>

                  {/* Stage Leads Cards */}
                  <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                    {stageLeads.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-[14px] italic bg-white/50 rounded-2xl border border-dashed border-slate-200">
                        No leads in this stage
                      </div>
                    ) : (
                      stageLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="font-heading font-bold text-[15px] text-slate-900 truncate">{lead.business_name}</h4>
                              <p className="text-[13px] text-slate-500 truncate">{lead.industry}</p>
                            </div>
                            {lead.qualification_score && (
                              <span className="font-mono tabular-nums font-bold text-[13px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                {lead.qualification_score.overall_score}%
                              </span>
                            )}
                          </div>

                          <div className="text-[13px] text-slate-500 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{lead.city || lead.state}</span>
                          </div>

                          {/* Quick Stage Mover Selector */}
                          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5 text-[13px]">
                            <select
                              value={lead.pipeline_stage}
                              onChange={(e) => handleStageChange(lead.id, e.target.value as GrowthPipelineStage)}
                              className="text-[13px] py-1 px-2 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700 max-w-[140px]"
                            >
                              {STAGES.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.label}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => setSelectedNoteLead(lead)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                              title="Add Activity Note"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>

                            {lead.pipeline_stage !== 'converted' && (
                              <button
                                type="button"
                                onClick={() => handleConvert(lead)}
                                className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[13px] transition cursor-pointer whitespace-nowrap"
                                title="Convert to MatthOrg Customer"
                              >
                                Convert
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Table List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[15px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[13px] font-bold">
                <tr>
                  <th className="py-3.5 px-4">Business & Category</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Opportunity Fit</th>
                  <th className="py-3.5 px-4">Current Stage</th>
                  <th className="py-3.5 px-4">Notes Count</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-heading font-bold text-slate-900 text-base">{lead.business_name}</div>
                      <div className="text-[13px] text-slate-500">{lead.industry}</div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="text-slate-700 font-medium">{lead.city || lead.state}</span>
                      <span className="block text-[13px] text-slate-500">{lead.country}</span>
                    </td>

                    <td className="py-4 px-4">
                      {lead.qualification_score ? (
                        <span className="font-mono tabular-nums font-bold text-[13px] px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                          {lead.qualification_score.overall_score}% Fit
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[13px] italic">Not scored</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <select
                        value={lead.pipeline_stage}
                        onChange={(e) => handleStageChange(lead.id, e.target.value as GrowthPipelineStage)}
                        className="text-[14px] font-semibold py-1.5 px-2.5 rounded-xl border border-slate-200 bg-white"
                      >
                        {STAGES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-4 px-4">
                      <button
                        type="button"
                        onClick={() => setSelectedNoteLead(lead)}
                        className="text-slate-600 hover:text-blue-600 font-medium text-[14px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <MessageSquare className="w-4 h-4 text-slate-400" />
                        <span className="tabular-nums">{lead.notes?.length || 0} notes</span>
                      </button>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {lead.pipeline_stage !== 'converted' ? (
                          <button
                            type="button"
                            onClick={() => handleConvert(lead)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[14px] transition cursor-pointer shadow-2xs whitespace-nowrap"
                          >
                            Convert to Customer
                          </button>
                        ) : (
                          <span className="text-[13px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg whitespace-nowrap">
                            ✓ Converted
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Activity Note Modal */}
      {selectedNoteLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-bold text-lg text-slate-900">
                  Notes & History: {selectedNoteLead.business_name}
                </h3>
                <p className="text-[14px] text-slate-500">Record sales interactions, calls, and follow-ups</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNoteLead(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                rows={3}
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Log call outcome, client objection, or follow-up commitment..."
                className="w-full p-3.5 text-[15px] rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-600"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedNoteLead(null)}
                  className="px-4 py-2 rounded-xl text-[14px] font-semibold text-slate-600 hover:bg-slate-100 whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[14px] font-bold shadow-xs cursor-pointer whitespace-nowrap"
                >
                  Add Note
                </button>
              </div>
            </form>

            {/* Note Timeline */}
            <div className="pt-2 space-y-2.5 max-h-60 overflow-y-auto">
              <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wider block">Past Log</span>
              {selectedNoteLead.notes && selectedNoteLead.notes.length > 0 ? (
                selectedNoteLead.notes.map((note) => (
                  <div key={note.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[14px] space-y-1">
                    <div className="flex items-center justify-between text-[13px] text-slate-500">
                      <span className="font-bold text-slate-700">{note.author_name}</span>
                      <span className="tabular-nums">{new Date(note.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{note.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-[14px] text-slate-500 italic">No activity notes recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
