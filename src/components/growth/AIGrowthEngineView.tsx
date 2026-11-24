// ============================================================================
// MatthOrg AI Growth Engine — Master View Component
// Integrates: Lead Discovery, AI Research, Qualification, Contact Intelligence,
// Outreach Studio, Lead Pipeline CRM, and Campaign Analytics
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Search,
  Sparkles,
  Target,
  Contact,
  Send,
  Kanban,
  BarChart3,
  Building2,
  CheckCircle2,
  RefreshCw,
  Sliders,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { DiscoveredBusiness } from '../../types/growthEngine';
import { BusinessProfile, Customer, Lead } from '../../types';
import { fetchGrowthLeads } from '../../lib/growthEngineDb';

import { LeadDiscoverySubmodule } from './LeadDiscoverySubmodule';
import { AIResearchSubmodule } from './AIResearchSubmodule';
import { LeadQualificationSubmodule } from './LeadQualificationSubmodule';
import { ContactIntelligenceSubmodule } from './ContactIntelligenceSubmodule';
import { OutreachStudioSubmodule } from './OutreachStudioSubmodule';
import { LeadPipelineSubmodule } from './LeadPipelineSubmodule';
import { CampaignAnalyticsSubmodule } from './CampaignAnalyticsSubmodule';

interface AIGrowthEngineViewProps {
  business: BusinessProfile;
  onCustomerConverted?: (customer: Customer, lead: Lead) => void;
  onNavigateToQuotes?: () => void;
}

type GrowthSubmodule =
  | 'discovery'
  | 'research'
  | 'qualification'
  | 'contact'
  | 'outreach'
  | 'pipeline'
  | 'analytics';

export const AIGrowthEngineView: React.FC<AIGrowthEngineViewProps> = ({
  business,
  onCustomerConverted,
  onNavigateToQuotes,
}) => {
  const [activeSubmodule, setActiveSubmodule] = useState<GrowthSubmodule>('discovery');
  const [leads, setLeads] = useState<DiscoveredBusiness[]>([]);
  const [activeLead, setActiveLead] = useState<DiscoveredBusiness | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      const data = await fetchGrowthLeads();
      setLeads(data);
      if (data.length > 0 && !activeLead) {
        setActiveLead(data[0]);
      }
    } catch (err) {
      console.error('Error loading growth leads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleSelectLeadForResearch = (lead: DiscoveredBusiness) => {
    setActiveLead(lead);
    setActiveSubmodule('research');
  };

  const handleSelectLeadForQualification = (lead: DiscoveredBusiness) => {
    setActiveLead(lead);
    setActiveSubmodule('qualification');
  };

  const handleSelectLeadForContact = (lead: DiscoveredBusiness) => {
    setActiveLead(lead);
    setActiveSubmodule('contact');
  };

  const handleSelectLeadForOutreach = (lead: DiscoveredBusiness) => {
    setActiveLead(lead);
    setActiveSubmodule('outreach');
  };

  const handleSelectLeadForPipeline = (lead: DiscoveredBusiness) => {
    setActiveLead(lead);
    setActiveSubmodule('pipeline');
  };

  const submodules = [
    {
      id: 'discovery' as const,
      label: 'Lead Discovery',
      icon: Search,
      badge: leads.length > 0 ? leads.length : undefined,
    },
    {
      id: 'research' as const,
      label: 'AI Research',
      icon: Sparkles,
      badge: leads.filter((l) => Boolean(l.research_report)).length || undefined,
    },
    {
      id: 'qualification' as const,
      label: 'Lead Qualification',
      icon: Target,
      badge: leads.filter((l) => Boolean(l.qualification_score)).length || undefined,
    },
    {
      id: 'contact' as const,
      label: 'Contact Intelligence',
      icon: Contact,
      badge: leads.filter((l) => Boolean(l.enriched_contact)).length || undefined,
    },
    {
      id: 'outreach' as const,
      label: 'Outreach Studio',
      icon: Send,
    },
    {
      id: 'pipeline' as const,
      label: 'Lead Pipeline',
      icon: Kanban,
      badge: leads.filter((l) => l.pipeline_stage === 'converted').length
        ? `${leads.filter((l) => l.pipeline_stage === 'converted').length} Won`
        : undefined,
    },
    {
      id: 'analytics' as const,
      label: 'Campaign Analytics',
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Global Header for AI Growth Engine */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#152744] to-[#1E3E62] text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-2xl bg-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-400/20">
                <TrendingUp className="w-5 h-5" />
              </span>
              <span className="inline-flex items-center gap-1.5 text-[13px] font-bold px-3 py-1 rounded-full bg-cyan-400/20 text-cyan-200 border border-cyan-400/30">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                MatthOrg B2B Intelligence & Sales Automation
              </span>
            </div>

            <h1 className="type-dashboard-title text-white">
              AI Growth Engine
            </h1>
            <p className="text-[15px] sm:text-base text-blue-200/90 max-w-2xl leading-relaxed">
              Discover commercial prospects, investigate company footprints with AI, evaluate sales opportunities,
              retrieve verified decision-maker contacts, and orchestrate personalized outreach across channels.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-[14px] text-white">
              <span className="text-slate-300 block text-[13px] font-semibold">Workspace Pipeline</span>
              <span className="font-heading font-extrabold text-lg font-mono tabular-nums">{leads.length} Discovered Leads</span>
            </div>
            <button
              type="button"
              onClick={loadLeads}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Refresh Pipeline"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 2. Submodule Navigation Tabs */}
        <div className="pt-6 mt-6 border-t border-white/10 overflow-x-auto relative z-10">
          <div className="flex items-center gap-2 min-w-max pb-1">
            {submodules.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubmodule === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSubmodule(tab.id)}
                  className={`px-4 py-2.5 rounded-2xl text-[14px] font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-400 text-slate-950 shadow-md scale-[1.02]'
                      : 'bg-white/10 hover:bg-white/20 text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-cyan-300'}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`text-[13px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-slate-900 text-white' : 'bg-white/20 text-white'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Lead Context Sticky Pill (When a lead is selected across submodules) */}
      {activeLead && activeSubmodule !== 'discovery' && activeSubmodule !== 'analytics' && (
        <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[14px]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-heading font-bold shrink-0">
              {activeLead.business_name.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-heading font-extrabold text-[15px] text-slate-900">{activeLead.business_name}</span>
                <span className="text-[13px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {activeLead.category}
                </span>
                <span className="text-[13px] text-slate-500">
                  {activeLead.city || activeLead.state}, {activeLead.country}
                </span>
              </div>
              <p className="text-[13px] text-slate-600 mt-0.5">
                Pipeline Stage:{' '}
                <strong className="text-slate-900 uppercase">{activeLead.pipeline_stage.replace('_', ' ')}</strong>
                {activeLead.qualification_score && (
                  <span className="ml-2 font-mono font-bold text-emerald-700">
                    • Score: {activeLead.qualification_score.overall_score}%
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSubmodule('discovery')}
              className="text-[14px] font-semibold text-blue-700 hover:underline cursor-pointer whitespace-nowrap"
            >
              Change Prospect
            </button>
          </div>
        </div>
      )}

      {/* 3. Submodule Body Router */}
      <div className="transition-all duration-200">
        {activeSubmodule === 'discovery' && (
          <LeadDiscoverySubmodule
            onSelectLeadForResearch={handleSelectLeadForResearch}
            onSelectLeadForQualification={handleSelectLeadForQualification}
            onSelectLeadForContact={handleSelectLeadForContact}
            onSelectLeadForOutreach={handleSelectLeadForOutreach}
            onRefreshLeads={loadLeads}
          />
        )}

        {activeSubmodule === 'research' && (
          <AIResearchSubmodule
            leads={leads}
            activeLead={activeLead}
            onSelectLead={(l) => setActiveLead(l)}
            onProceedToQualification={handleSelectLeadForQualification}
            onProceedToOutreach={handleSelectLeadForOutreach}
          />
        )}

        {activeSubmodule === 'qualification' && (
          <LeadQualificationSubmodule
            leads={leads}
            activeLead={activeLead}
            onSelectLead={(l) => setActiveLead(l)}
            onProceedToContact={handleSelectLeadForContact}
            onProceedToOutreach={handleSelectLeadForOutreach}
          />
        )}

        {activeSubmodule === 'contact' && (
          <ContactIntelligenceSubmodule
            leads={leads}
            activeLead={activeLead}
            onSelectLead={(l) => setActiveLead(l)}
            onProceedToOutreach={handleSelectLeadForOutreach}
          />
        )}

        {activeSubmodule === 'outreach' && (
          <OutreachStudioSubmodule
            leads={leads}
            activeLead={activeLead}
            onSelectLead={(l) => setActiveLead(l)}
            onProceedToPipeline={handleSelectLeadForPipeline}
          />
        )}

        {activeSubmodule === 'pipeline' && (
          <LeadPipelineSubmodule
            leads={leads}
            business={business}
            onSelectLead={(l) => setActiveLead(l)}
            onRefreshLeads={loadLeads}
            onCustomerConverted={onCustomerConverted}
          />
        )}

        {activeSubmodule === 'analytics' && <CampaignAnalyticsSubmodule />}
      </div>
    </div>
  );
};
