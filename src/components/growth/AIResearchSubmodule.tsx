// ============================================================================
// MatthOrg AI Growth Engine — Submodule 2: AI Business Researcher
// Structured deep research distinguishing Verified vs Observations vs Assumptions
// ============================================================================

import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Eye,
  AlertTriangle,
  Lightbulb,
  Building2,
  Globe,
  MapPin,
  Phone,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  CheckCircle2,
} from 'lucide-react';
import { DiscoveredBusiness, BusinessResearchReport } from '../../types/growthEngine';
import { triggerLeadResearch } from '../../lib/growthEngineDb';

interface AIResearchSubmoduleProps {
  leads: DiscoveredBusiness[];
  activeLead: DiscoveredBusiness | null;
  onSelectLead: (lead: DiscoveredBusiness) => void;
  onProceedToQualification: (lead: DiscoveredBusiness) => void;
  onProceedToOutreach: (lead: DiscoveredBusiness) => void;
}

export const AIResearchSubmodule: React.FC<AIResearchSubmoduleProps> = ({
  leads,
  activeLead,
  onSelectLead,
  onProceedToQualification,
  onProceedToOutreach,
}) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(activeLead?.id || leads[0]?.id || '');
  const [userOffering, setUserOffering] = useState(
    'Commercial Solar Power, Inverter Backup, and Facility Modernization'
  );
  const [isResearching, setIsResearching] = useState(false);
  const [currentReport, setCurrentReport] = useState<BusinessResearchReport | null>(
    activeLead?.research_report || leads.find((l) => l.id === selectedLeadId)?.research_report || null
  );

  const selectedLead = leads.find((l) => l.id === selectedLeadId) || activeLead || leads[0];

  const handleRunResearch = async () => {
    if (!selectedLead) return;
    setIsResearching(true);
    try {
      const report = await triggerLeadResearch(selectedLead, userOffering);
      setCurrentReport(report);
      selectedLead.research_report = report;
    } catch (err) {
      console.error('Error running AI research:', err);
    } finally {
      setIsResearching(false);
    }
  };

  const handleLeadChange = (newId: string) => {
    setSelectedLeadId(newId);
    const found = leads.find((l) => l.id === newId);
    if (found) {
      onSelectLead(found);
      setCurrentReport(found.research_report || null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Prospect Selector & Research Trigger */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-heading text-xl sm:text-[22px] font-extrabold text-[#0B192C]">AI Business Researcher</h2>
                <p className="text-[14px] sm:text-[15px] text-[#5B6D85]">
                  Automated background investigation of company background, operating footprint, and pain points.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRunResearch}
              disabled={isResearching || !selectedLead}
              className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-[14px] sm:text-[15px] font-bold flex items-center gap-2 whitespace-nowrap shadow-sm transition active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isResearching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Investigating Company Footprint...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{currentReport ? 'Re-run AI Research' : 'Generate Research Report'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Lead Selection Controls */}
        <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[14px] font-bold text-slate-700">Target Prospect Company</label>
            <select
              value={selectedLeadId}
              onChange={(e) => handleLeadChange(e.target.value)}
              className="w-full px-3.5 py-2.5 text-[15px] rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-purple-600"
            >
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.business_name} ({l.category} • {l.city || l.state})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[14px] font-bold text-slate-700">Your Business Offering to Pitch</label>
            <input
              type="text"
              value={userOffering}
              onChange={(e) => setUserOffering(e.target.value)}
              placeholder="e.g. Commercial Solar Installation, Web Development, or HVAC Service Maintenance"
              className="w-full px-3.5 py-2.5 text-[15px] rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-600"
            />
          </div>
        </div>
      </div>

      {/* 2. Structured Report Content */}
      {!currentReport ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mx-auto">
            <Building2 className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="font-heading font-bold text-xl text-slate-900">
              Ready to Research {selectedLead?.business_name || 'Selected Company'}
            </h3>
            <p className="text-[15px] text-slate-600 leading-relaxed">
              Click <strong>Generate Research Report</strong> to examine public trade presence, evaluate facility
              footprint, identify potential challenges, and generate pitch angles.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRunResearch}
            disabled={isResearching}
            className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-[15px] inline-flex items-center gap-2 whitespace-nowrap cursor-pointer shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>Start Investigation</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Summary Card */}
          <div className="bg-gradient-to-r from-[#0B192C] to-[#1E3E62] text-white p-6 rounded-3xl shadow-md space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[13px] font-bold uppercase tracking-wider text-purple-200 bg-purple-900/60 px-3 py-0.5 rounded-full border border-purple-400/30">
                  Model: {currentReport.model_used}
                </span>
                <h3 className="font-heading text-2xl font-extrabold text-white mt-2">{currentReport.business_name}</h3>
                <p className="text-[14px] text-slate-300 tabular-nums mt-0.5">
                  Research report conducted on {new Date(currentReport.researched_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {selectedLead && (
                  <>
                    <button
                      type="button"
                      onClick={() => onProceedToQualification(selectedLead)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[14px] font-bold whitespace-nowrap transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <span>Proceed to Score & Qualify</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onProceedToOutreach(selectedLead)}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#0B192C] text-[14px] font-bold whitespace-nowrap transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <span>Draft Outreach</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 4 Pillars of the Research Report */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Pillar 1: Verified Information */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-heading font-bold text-[17px] text-slate-900">1. Verified Information (Factual)</h4>
                  <p className="text-[13px] text-slate-500">Documented commercial and geographical records</p>
                </div>
              </div>

              <div className="space-y-3 text-[14px]">
                <div className="flex items-start justify-between py-1 border-b border-slate-50 gap-3">
                  <span className="text-slate-600">Official Registered Name:</span>
                  <span className="font-bold text-slate-900 text-right">{currentReport.verified_info.official_name}</span>
                </div>
                <div className="flex items-start justify-between py-1 border-b border-slate-50 gap-3">
                  <span className="text-slate-600">Primary Industry / Trade:</span>
                  <span className="font-bold text-slate-900 text-right">{currentReport.verified_info.primary_trade}</span>
                </div>
                <div className="flex items-start justify-between py-1 border-b border-slate-50 gap-3">
                  <span className="text-slate-600">Operating Status:</span>
                  <span className="text-[13px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded">
                    {currentReport.verified_info.operating_status}
                  </span>
                </div>
                <div className="flex items-start justify-between py-1 border-b border-slate-50 gap-3">
                  <span className="text-slate-600">Physical Address:</span>
                  <span className="font-medium text-slate-800 text-right max-w-[65%]">
                    {currentReport.verified_info.registered_address || 'Regional premises'}
                  </span>
                </div>
                <div className="flex items-start justify-between py-1 gap-3">
                  <span className="text-slate-600">Official Website:</span>
                  <span className="font-medium text-blue-700 truncate max-w-[65%]">
                    {currentReport.verified_info.official_website || 'None registered'}
                  </span>
                </div>
              </div>
            </div>

            {/* Pillar 2: AI-Generated Observations */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <span className="p-2 rounded-lg bg-blue-50 text-blue-700">
                  <Eye className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-heading font-bold text-[17px] text-slate-900">2. AI-Generated Observations</h4>
                  <p className="text-[13px] text-slate-500">Synthesized footprint and digital visibility assessment</p>
                </div>
              </div>

              <div className="space-y-3.5 text-[15px]">
                <div className="p-3.5 rounded-xl bg-slate-50 text-slate-700 leading-relaxed">
                  {currentReport.ai_observations.business_summary}
                </div>

                <div>
                  <span className="text-[14px] font-bold text-slate-800 block mb-1.5">Core Offerings Identified:</span>
                  <ul className="list-disc list-inside space-y-1 text-[14px] text-slate-600">
                    {currentReport.ai_observations.core_products_services.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[14px]">
                  <span className="text-slate-600">Online Visibility Level:</span>
                  <span className="text-[13px] font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-md">
                    {currentReport.ai_observations.online_visibility_level}
                  </span>
                </div>
              </div>
            </div>

            {/* Pillar 3: Selling Opportunities & Pitch Angle */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <span className="p-2 rounded-lg bg-amber-50 text-amber-700">
                  <Lightbulb className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-heading font-bold text-[17px] text-slate-900">3. Selling Opportunities & Pitch Angle</h4>
                  <p className="text-[13px] text-slate-500">Actionable service entry points for your sales team</p>
                </div>
              </div>

              <div className="space-y-3.5 text-[15px]">
                <div>
                  <span className="text-[14px] font-bold text-slate-800 block mb-1.5">Identified Business Bottlenecks:</span>
                  <ul className="space-y-2 text-[14px]">
                    {currentReport.selling_opportunities.identified_challenges.map((ch, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                        <span>{ch}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60 space-y-1">
                  <span className="text-[14px] font-bold text-amber-950 block">Strategic Pitch Angle:</span>
                  <p className="text-[15px] text-amber-900 leading-relaxed">
                    {currentReport.selling_opportunities.pitch_angle}
                  </p>
                </div>

                {currentReport.selling_opportunities.estimated_deal_value_range && (
                  <div className="flex items-center justify-between pt-1 text-[14px]">
                    <span className="text-slate-600">Estimated Deal Opportunity:</span>
                    <span className="font-mono font-bold text-emerald-700 text-[15px] tabular-nums">
                      {currentReport.selling_opportunities.estimated_deal_value_range}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Pillar 4: Assumptions Requiring Verification */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <span className="p-2 rounded-lg bg-rose-50 text-rose-700">
                  <AlertTriangle className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-heading font-bold text-[17px] text-slate-900">4. Assumptions Requiring Human Check</h4>
                  <p className="text-[13px] text-slate-500">Unconfirmed points to validate during initial discovery</p>
                </div>
              </div>

              <div className="space-y-3 text-[14px]">
                <p className="text-slate-600 text-[13px] leading-relaxed">
                  To ensure 100% truthful sales positioning, verify these points before presenting final binding proposals:
                </p>

                <ul className="space-y-2">
                  {currentReport.assumptions_to_verify.map((assump, idx) => (
                    <li key={idx} className="p-3 rounded-xl bg-rose-50/60 border border-rose-200/60 flex items-start gap-2.5 text-rose-950">
                      <span className="font-mono font-bold text-rose-600 shrink-0">?</span>
                      <span>{assump}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
