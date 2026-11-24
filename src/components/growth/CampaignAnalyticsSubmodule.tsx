// ============================================================================
// MatthOrg AI Growth Engine — Submodule 7: Campaign Analytics Dashboard
// Real-time commercial conversion funnel, stage velocity, and territory breakdown
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Send,
  MessageSquare,
  Calendar,
  CheckCircle2,
  Filter,
  PieChart,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { GrowthAnalyticsSummary } from '../../types/growthEngine';
import { fetchGrowthAnalytics } from '../../lib/growthEngineDb';

export const CampaignAnalyticsSubmodule: React.FC = () => {
  const [analytics, setAnalytics] = useState<GrowthAnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIndustryFilter, setSelectedIndustryFilter] = useState('all');

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await fetchGrowthAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & Quick Controls */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-50 text-cyan-700">
              <BarChart3 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-heading text-xl sm:text-[22px] font-extrabold text-[#0B192C]">Campaign & Growth Analytics</h2>
              <p className="text-[14px] sm:text-[15px] text-[#5B6D85]">
                Live performance data across discovery, AI research, qualification, and commercial conversion.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadAnalytics}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[14px] font-bold text-slate-700 flex items-center gap-2 whitespace-nowrap transition cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Metrics</span>
          </button>
        </div>
      </div>

      {/* 2. Top-Line KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Discovered */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <span className="text-[13px] font-bold uppercase tracking-wider text-slate-500 block">
            1. Total Discovered
          </span>
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-heading text-3xl font-extrabold text-slate-900 tabular-nums">
              {analytics?.total_discovered || 0}
            </span>
            <span className="text-[13px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full whitespace-nowrap">
              Sourced
            </span>
          </div>
          <p className="text-[13px] text-slate-600">Commercial directory & Google Places</p>
        </div>

        {/* KPI 2: AI Researched & Qualified */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <span className="text-[13px] font-bold uppercase tracking-wider text-slate-500 block">
            2. AI Evaluated
          </span>
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-heading text-3xl font-extrabold text-purple-700 tabular-nums">
              {analytics?.total_qualified || 0}
            </span>
            <span className="text-[13px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full whitespace-nowrap">
              Qualified
            </span>
          </div>
          <p className="text-[13px] text-slate-600 tabular-nums">
            {analytics?.total_researched || 0} deep reports generated
          </p>
        </div>

        {/* KPI 3: Outreach Generated & Sent */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <span className="text-[13px] font-bold uppercase tracking-wider text-slate-500 block">
            3. Outreach Pitches
          </span>
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-heading text-3xl font-extrabold text-indigo-700 tabular-nums">
              {analytics?.outreach_generated || 0}
            </span>
            <span className="text-[13px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full tabular-nums whitespace-nowrap">
              {analytics?.outreach_sent || 0} Dispatched
            </span>
          </div>
          <p className="text-[13px] text-slate-600">Emails, WhatsApps & Call cards</p>
        </div>

        {/* KPI 4: Converted Customers */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <span className="text-[13px] font-bold uppercase tracking-wider text-slate-500 block">
            4. Converted Customers
          </span>
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-heading text-3xl font-extrabold text-emerald-600 tabular-nums">
              {analytics?.converted_customers || 0}
            </span>
            <span className="text-[13px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full font-mono tabular-nums whitespace-nowrap">
              {analytics?.conversion_rate || 0}% Rate
            </span>
          </div>
          <p className="text-[13px] text-slate-600">Live MatthOrg client contracts</p>
        </div>
      </div>

      {/* 3. Conversion Funnel Visualizer */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-heading font-bold text-lg text-[#0B192C]">Sales Milestone Conversion Funnel</h3>
            <p className="text-[14px] text-slate-600">Progression from discovery to signed customer contract</p>
          </div>
          <span className="text-[13px] font-mono font-bold tabular-nums text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full whitespace-nowrap">
            {analytics?.conversion_rate || 0}% Overall Conversion
          </span>
        </div>

        <div className="space-y-3.5 pt-2">
          {[
            { label: 'Discovered Prospects', count: analytics?.total_discovered || 0, color: 'bg-slate-800' },
            { label: 'AI Researched Reports', count: analytics?.total_researched || 0, color: 'bg-purple-600' },
            { label: 'Qualified Leads (Score 50+)', count: analytics?.total_qualified || 0, color: 'bg-blue-600' },
            { label: 'Verified Contact Channels', count: analytics?.total_contactable || 0, color: 'bg-cyan-600' },
            { label: 'Outreach Initiated', count: analytics?.outreach_sent || 0, color: 'bg-indigo-600' },
            { label: 'Meetings & Proposals Active', count: analytics?.meetings_booked || 0, color: 'bg-amber-600' },
            { label: 'Converted MatthOrg Customers', count: analytics?.converted_customers || 0, color: 'bg-emerald-600' },
          ].map((step, idx) => {
            const maxVal = Math.max(analytics?.total_discovered || 1, 1);
            const pct = Math.min(100, Math.round((step.count / maxVal) * 100));

            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-[14px]">
                  <span className="font-semibold text-slate-700">{step.label}</span>
                  <span className="font-mono text-slate-900 font-bold tabular-nums">
                    {step.count} ({pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div className={`${step.color} h-3 rounded-full transition-all duration-500`} style={{ width: `${Math.max(pct, step.count > 0 ? 4 : 0)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Industry & Territory Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Industry Breakdown Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="font-heading font-bold text-lg text-[#0B192C]">Leads by Industry Sector</h3>
          {analytics?.industry_breakdown && analytics.industry_breakdown.length > 0 ? (
            <div className="space-y-2">
              {analytics.industry_breakdown.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[14px] py-2 border-b border-slate-50">
                  <span className="font-medium text-slate-700">{item.industry}</span>
                  <span className="text-[13px] font-mono font-bold tabular-nums text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded">
                    {item.count} leads
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[14px] text-slate-500 italic">No industry breakdown data available.</p>
          )}
        </div>

        {/* Territory / Location Breakdown Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="font-heading font-bold text-lg text-[#0B192C]">Leads by Commercial Territory</h3>
          {analytics?.location_breakdown && analytics.location_breakdown.length > 0 ? (
            <div className="space-y-2">
              {analytics.location_breakdown.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[14px] py-2 border-b border-slate-50">
                  <span className="font-medium text-slate-700">{item.location}</span>
                  <span className="text-[13px] font-mono font-bold tabular-nums text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded">
                    {item.count} leads
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[14px] text-slate-500 italic">No territory breakdown data available.</p>
          )}
        </div>
      </div>
    </div>
  );
};
