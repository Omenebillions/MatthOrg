// ============================================================================
// MatthOrg AI Growth Engine — Submodule 3: Lead Qualification & Opportunity Scoring
// High-fidelity 0-100 scoring with customizable ICP criteria and category tiers
// ============================================================================

import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Sliders,
  RefreshCw,
  Building2,
  Target,
  ShieldCheck,
  Check,
} from 'lucide-react';
import {
  DiscoveredBusiness,
  LeadQualificationScore,
  QualificationCategory,
  GrowthICPConfig,
} from '../../types/growthEngine';
import {
  triggerLeadQualification,
  getSavedICPConfig,
  saveICPConfig,
} from '../../lib/growthEngineDb';

interface LeadQualificationSubmoduleProps {
  leads: DiscoveredBusiness[];
  activeLead: DiscoveredBusiness | null;
  onSelectLead: (lead: DiscoveredBusiness) => void;
  onProceedToContact: (lead: DiscoveredBusiness) => void;
  onProceedToOutreach: (lead: DiscoveredBusiness) => void;
}

export const LeadQualificationSubmodule: React.FC<LeadQualificationSubmoduleProps> = ({
  leads,
  activeLead,
  onSelectLead,
  onProceedToContact,
  onProceedToOutreach,
}) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(activeLead?.id || leads[0]?.id || '');
  const [icpConfig, setIcpConfig] = useState<GrowthICPConfig>(getSavedICPConfig);
  const [isScoring, setIsScoring] = useState(false);
  const [isEditingICP, setIsEditingICP] = useState(false);
  const [saveIcpSuccess, setSaveIcpSuccess] = useState(false);

  const selectedLead = leads.find((l) => l.id === selectedLeadId) || activeLead || leads[0];
  const [currentScore, setCurrentScore] = useState<LeadQualificationScore | null>(
    selectedLead?.qualification_score || null
  );

  const handleScoreLead = async () => {
    if (!selectedLead) return;
    setIsScoring(true);
    try {
      const score = await triggerLeadQualification(selectedLead, icpConfig);
      setCurrentScore(score);
      selectedLead.qualification_score = score;
    } catch (err) {
      console.error('Error during lead scoring:', err);
    } finally {
      setIsScoring(false);
    }
  };

  const handleSaveICP = () => {
    saveICPConfig(icpConfig);
    setSaveIcpSuccess(true);
    setTimeout(() => {
      setSaveIcpSuccess(false);
      setIsEditingICP(false);
    }, 1200);
  };

  const getCategoryBadge = (cat?: QualificationCategory) => {
    switch (cat) {
      case 'high_potential':
        return {
          label: '🔥 High Potential',
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          barColor: 'bg-emerald-500',
        };
      case 'medium_potential':
        return {
          label: '⚡ Medium Potential',
          bg: 'bg-blue-100 text-blue-900 border-blue-300',
          barColor: 'bg-blue-500',
        };
      case 'low_potential':
        return {
          label: '⚠️ Low Potential',
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          barColor: 'bg-amber-500',
        };
      default:
        return {
          label: '🔍 Needs Verification',
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          barColor: 'bg-slate-400',
        };
    }
  };

  const badge = getCategoryBadge(currentScore?.qualification_category);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Submodule Header & Controls */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                <Target className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-[#0B192C]">AI Lead Qualification</h2>
                <p className="text-[15px] text-[#5B6D85]">
                  Automated opportunity assessment (0-100) benchmarked against your Ideal Customer Profile.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsEditingICP(!isEditingICP)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            >
              <Sliders className="w-4 h-4 text-slate-500" />
              <span>{isEditingICP ? 'Close ICP Criteria' : 'Customize ICP'}</span>
            </button>

            <button
              type="button"
              onClick={handleScoreLead}
              disabled={isScoring || !selectedLead}
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-[15px] font-bold flex items-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-60 cursor-pointer whitespace-nowrap"
            >
              {isScoring ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
                  <span>Computing Opportunity Fit...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>{currentScore ? 'Re-Score Prospect' : 'Calculate Opportunity Score'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Lead Selector Bar */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="w-full sm:max-w-md">
            <label className="text-[14px] font-bold text-slate-700 block mb-1.5">Select Prospect to Qualify</label>
            <select
              value={selectedLeadId}
              onChange={(e) => {
                setSelectedLeadId(e.target.value);
                const found = leads.find((l) => l.id === e.target.value);
                if (found) {
                  onSelectLead(found);
                  setCurrentScore(found.qualification_score || null);
                }
              }}
              className="w-full px-3.5 py-2.5 text-[15px] rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-emerald-600"
            >
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.business_name} — {l.category} ({l.city || l.state})
                </option>
              ))}
            </select>
          </div>

          <div className="text-[14px] text-slate-500 self-end sm:self-center tabular-nums">
            {leads.length} Total Prospects in Workspace
          </div>
        </div>

        {/* Customizable ICP Panel (Drawer) */}
        {isEditingICP && (
          <div className="mt-5 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
              <span className="font-bold text-[14px] uppercase tracking-wider text-slate-700">
                Ideal Customer Profile (ICP) Weights & Target Criteria
              </span>
              <span className="text-[13px] text-slate-500">Customizes AI Opportunity Scoring</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[14px]">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Primary Service/Product You Offer *</label>
                <input
                  type="text"
                  value={icpConfig.primaryServiceOffered}
                  onChange={(e) => setIcpConfig({ ...icpConfig, primaryServiceOffered: e.target.value })}
                  placeholder="e.g. Commercial Solar Installation, Inverters, Web IT Solutions"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-[15px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Core Value Proposition *</label>
                <input
                  type="text"
                  value={icpConfig.valueProposition}
                  onChange={(e) => setIcpConfig({ ...icpConfig, valueProposition: e.target.value })}
                  placeholder="e.g. 99.8% power uptime with certified engineer SLAs"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-[15px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Target Commercial Hubs</label>
                <input
                  type="text"
                  value={icpConfig.targetLocations.join(', ')}
                  onChange={(e) =>
                    setIcpConfig({
                      ...icpConfig,
                      targetLocations: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-[15px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Target Industries</label>
                <input
                  type="text"
                  value={icpConfig.targetIndustries.join(', ')}
                  onChange={(e) =>
                    setIcpConfig({
                      ...icpConfig,
                      targetIndustries: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-[15px]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveICP}
                className="px-4 py-2.5 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[14px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
              >
                {saveIcpSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>ICP Settings Saved!</span>
                  </>
                ) : (
                  <span>Save ICP Benchmark</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Qualification Scorecard Display */}
      {!currentScore ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
            <Target className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="font-heading font-bold text-xl text-slate-900">
              Score Opportunity for {selectedLead?.business_name || 'Prospect'}
            </h3>
            <p className="text-[15px] text-slate-500 leading-relaxed">
              Our AI evaluates 5 commercial dimensions (Relevance, Need, Vitality, Contactability, and ICP Fit) to assign
              a score from 0 to 100 with actionable next steps.
            </p>
          </div>
          <button
            type="button"
            onClick={handleScoreLead}
            disabled={isScoring}
            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[15px] inline-flex items-center gap-2 cursor-pointer shadow-sm whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            <span>Calculate Score Now</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Score Banner */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5 w-full md:w-auto">
              {/* Circular / Big Score Dial */}
              <div className="relative w-24 h-24 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center shrink-0 shadow-md">
                <span className="font-heading text-3xl font-extrabold text-emerald-400 font-mono tabular-nums tracking-tight">
                  {currentScore.overall_score}
                </span>
                <span className="text-[13px] text-slate-300 uppercase tracking-wider font-semibold">/ 100</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`text-[13px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border whitespace-nowrap ${badge.bg}`}
                  >
                    {badge.label}
                  </span>
                  <span className="text-[13px] text-slate-500 font-mono tabular-nums">
                    Scored {new Date(currentScore.scored_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-heading text-xl font-bold text-slate-900">{selectedLead?.business_name}</h3>
                <p className="text-[15px] text-slate-600">{currentScore.icp_match_summary}</p>
              </div>
            </div>

            {/* Quick Next Action Callout */}
            <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-end">
              {selectedLead && (
                <>
                  <button
                    type="button"
                    onClick={() => onProceedToContact(selectedLead)}
                    className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-[14px] font-bold transition cursor-pointer whitespace-nowrap"
                  >
                    Enrich Contacts
                  </button>
                  <button
                    type="button"
                    onClick={() => onProceedToOutreach(selectedLead)}
                    className="px-4 py-2.5 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[14px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm whitespace-nowrap"
                  >
                    <span>Launch Outreach</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 5-Dimension Scoring Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-[14px]">
                <span className="font-bold text-slate-700">1. Relevance</span>
                <span className="font-mono tabular-nums font-bold text-slate-900">{currentScore.relevance_score}/25</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(currentScore.relevance_score / 25) * 100}%` }}
                />
              </div>
              <p className="text-[13px] text-slate-500">Industry & commercial fit</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-[14px]">
                <span className="font-bold text-slate-700">2. Urgent Need</span>
                <span className="font-mono tabular-nums font-bold text-slate-900">{currentScore.need_score}/25</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${(currentScore.need_score / 25) * 100}%` }}
                />
              </div>
              <p className="text-[13px] text-slate-500">Bottlenecks & operational pain</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-[14px]">
                <span className="font-bold text-slate-700">3. Vitality</span>
                <span className="font-mono tabular-nums font-bold text-slate-900">{currentScore.vitality_score}/20</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{ width: `${(currentScore.vitality_score / 20) * 100}%` }}
                />
              </div>
              <p className="text-[13px] text-slate-500">Activity & facility presence</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-[14px]">
                <span className="font-bold text-slate-700">4. Reachability</span>
                <span className="font-mono tabular-nums font-bold text-slate-900">{currentScore.contactability_score}/20</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-600 h-2 rounded-full"
                  style={{ width: `${(currentScore.contactability_score / 20) * 100}%` }}
                />
              </div>
              <p className="text-[13px] text-slate-500">Phone, WhatsApp, email</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-[14px]">
                <span className="font-bold text-slate-700">5. ICP Match</span>
                <span className="font-mono tabular-nums font-bold text-slate-900">{currentScore.icp_fit_score}/10</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-cyan-600 h-2 rounded-full"
                  style={{ width: `${(currentScore.icp_fit_score / 10) * 100}%` }}
                />
              </div>
              <p className="text-[13px] text-slate-500">Matches target benchmarks</p>
            </div>
          </div>

          {/* Details & Recommended Next Action Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h4 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Reasons for Opportunity Score</span>
              </h4>
              <ul className="space-y-2.5 text-[15px] text-slate-700">
                {currentScore.reasons.map((r, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                    <span className="leading-relaxed">{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h4 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#3D74D9]" />
                <span>Recommended Action & Opportunity</span>
              </h4>

              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/60 space-y-1 text-[15px]">
                <span className="font-bold text-blue-950 block">Potential Sales Opportunity:</span>
                <p className="text-blue-900 leading-relaxed">{currentScore.potential_opportunity}</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 space-y-1 text-[15px]">
                <span className="font-bold text-emerald-950 block">Immediate Recommended Next Action:</span>
                <p className="text-emerald-900 font-semibold leading-relaxed">
                  {currentScore.recommended_next_action}
                </p>
              </div>
            </div>
          </div>

          {/* Compliance & Truthful Disclaimer Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-[13px] leading-relaxed flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              <strong>Truthful AI Transparency:</strong> {currentScore.disclaimer}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
