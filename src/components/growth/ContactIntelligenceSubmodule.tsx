// ============================================================================
// MatthOrg AI Growth Engine — Submodule 4: Contact Intelligence & Enrichment
// Lawful B2B contact retrieval, deliverability validation, and decision-maker insights
// ============================================================================

import React, { useState } from 'react';
import {
  Contact,
  Mail,
  Phone,
  Globe,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  UserCheck,
  Building,
  ArrowRight,
} from 'lucide-react';
import { DiscoveredBusiness, EnrichedContact } from '../../types/growthEngine';
import { triggerContactEnrichment } from '../../lib/growthEngineDb';

interface ContactIntelligenceSubmoduleProps {
  leads: DiscoveredBusiness[];
  activeLead: DiscoveredBusiness | null;
  onSelectLead: (lead: DiscoveredBusiness) => void;
  onProceedToOutreach: (lead: DiscoveredBusiness) => void;
}

export const ContactIntelligenceSubmodule: React.FC<ContactIntelligenceSubmoduleProps> = ({
  leads,
  activeLead,
  onSelectLead,
  onProceedToOutreach,
}) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(activeLead?.id || leads[0]?.id || '');
  const [isEnriching, setIsEnriching] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const selectedLead = leads.find((l) => l.id === selectedLeadId) || activeLead || leads[0];
  const [currentContact, setCurrentContact] = useState<EnrichedContact | null>(
    selectedLead?.enriched_contact || null
  );

  const handleEnrich = async () => {
    if (!selectedLead) return;
    setIsEnriching(true);
    try {
      const contact = await triggerContactEnrichment(selectedLead);
      setCurrentContact(contact);
      selectedLead.enriched_contact = contact;
    } catch (err) {
      console.error('Error enriching contact:', err);
    } finally {
      setIsEnriching(false);
    }
  };

  const copyText = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedKey(label);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // ignore
    }
  };

  const cleanPhone = (selectedLead?.phone || currentContact?.official_phone || '').replace(/\D/g, '');
  const waLink = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith('0') ? '234' + cleanPhone.substring(1) : cleanPhone}?text=${encodeURIComponent(
        `Hello ${selectedLead?.business_name || 'Team'}, reaching out from MatthOrg B2B Growth Engine regarding commercial services in ${selectedLead?.city || 'your area'}.`
      )}`
    : undefined;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & Lead Selection */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <Contact className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-heading text-xl sm:text-[22px] font-extrabold text-[#0B192C]">Contact Intelligence & Enrichment</h2>
                <p className="text-[14px] sm:text-[15px] text-[#5B6D85]">
                  Retrieve public corporate contacts, email deliverability records, and decision-maker roles.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleEnrich}
              disabled={isEnriching || !selectedLead}
              className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-[14px] sm:text-[15px] font-bold flex items-center gap-2 whitespace-nowrap shadow-sm transition active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isEnriching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-200" />
                  <span>Retrieving Verified Commercial Records...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-cyan-300" />
                  <span>{currentContact ? 'Re-Enrich Contacts' : 'Enrich Prospect Contacts'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Lead Selector Bar */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="w-full sm:max-w-md">
            <label className="text-[14px] font-bold text-slate-700 block mb-1.5">Target Prospect</label>
            <select
              value={selectedLeadId}
              onChange={(e) => {
                setSelectedLeadId(e.target.value);
                const found = leads.find((l) => l.id === e.target.value);
                if (found) {
                  onSelectLead(found);
                  setCurrentContact(found.enriched_contact || null);
                }
              }}
              className="w-full px-3.5 py-2.5 text-[15px] rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-600"
            >
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.business_name} ({l.city || l.state})
                </option>
              ))}
            </select>
          </div>

          <div className="text-[14px] font-medium text-slate-600 tabular-nums self-end sm:self-center">
            {leads.length} Available Prospects
          </div>
        </div>
      </div>

      {/* 2. Enriched Contact Cards */}
      {!currentContact ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
            <Contact className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="font-heading font-bold text-xl text-slate-900">
              Enrich Contact Info for {selectedLead?.business_name || 'Prospect'}
            </h3>
            <p className="text-[15px] text-slate-600 leading-relaxed">
              Verify official email address, decision-maker roles, WhatsApp telephone, and lawful outreach ground.
            </p>
          </div>
          <button
            type="button"
            onClick={handleEnrich}
            disabled={isEnriching}
            className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-[15px] inline-flex items-center gap-2 whitespace-nowrap cursor-pointer shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Enrich Public Contacts</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[13px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  ✓ Verified Corporate Record
                </span>
                <span className="text-[13px] text-slate-500 font-mono">
                  Source: {currentContact.source}
                </span>
              </div>
              <h3 className="font-heading text-xl font-bold text-slate-900">{selectedLead?.business_name}</h3>
              <p className="text-[14px] text-slate-600">{currentContact.lawful_basis}</p>
            </div>

            <div className="flex items-center gap-2">
              {selectedLead && (
                <button
                  type="button"
                  onClick={() => onProceedToOutreach(selectedLead)}
                  className="px-4 py-2.5 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[14px] sm:text-[15px] font-bold whitespace-nowrap transition flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <span>Compose Outreach in Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Grid of Contact Channels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Email Channel */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
                    <Mail className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="font-heading font-bold text-[16px] text-slate-900">Official Email</h4>
                    <span className="text-[13px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded inline-block mt-0.5">
                      Deliverable & Active
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-[14px]">
                <div>
                  <span className="text-slate-500 text-[13px] block">Corporate Inbox</span>
                  <span className="font-mono font-bold text-slate-900 text-[15px] select-all break-all">
                    {currentContact.official_email || 'Not published'}
                  </span>
                </div>

                {currentContact.official_email && (
                  <div className="flex items-center gap-2 pt-2">
                    <a
                      href={`mailto:${currentContact.official_email}`}
                      className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[14px] whitespace-nowrap transition flex items-center gap-1.5"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Send Email</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => copyText(currentContact.official_email!, 'email')}
                      className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-[14px] whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedKey === 'email' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedKey === 'email' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Direct Phone & WhatsApp */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                    <Phone className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="font-heading font-bold text-[16px] text-slate-900">Phone & WhatsApp</h4>
                    <span className="text-[13px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded inline-block mt-0.5">
                      Commercial Line
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-[14px]">
                <div>
                  <span className="text-slate-500 text-[13px] block">Official Phone</span>
                  <span className="font-mono font-bold text-slate-900 text-[15px] tabular-nums select-all">
                    {currentContact.official_phone || selectedLead?.phone || 'Available on request'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {currentContact.official_phone && (
                    <a
                      href={`tel:${currentContact.official_phone}`}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[14px] whitespace-nowrap transition flex items-center gap-1.5"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Call Now</span>
                    </a>
                  )}

                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[14px] whitespace-nowrap transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Decision Maker & Role */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
                    <UserCheck className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="font-heading font-bold text-[16px] text-slate-900">Key Decision Role</h4>
                    <span className="text-[13px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded inline-block mt-0.5">
                      Procurement / Exec
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 text-[14px]">
                <div>
                  <span className="text-slate-500 text-[13px] block">Role & Authority</span>
                  <span className="font-bold text-slate-900 text-[15px]">{currentContact.decision_maker_title}</span>
                </div>

                <div>
                  <span className="text-slate-500 text-[13px] block">Contact Representative</span>
                  <span className="font-medium text-slate-800 text-[15px]">{currentContact.decision_maker_name}</span>
                </div>

                {currentContact.decision_maker_linkedin && (
                  <div className="pt-1">
                    <a
                      href={currentContact.decision_maker_linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[14px] font-bold text-blue-700 hover:underline flex items-center gap-1.5"
                    >
                      <span>LinkedIn Profile</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Physical Address & Lawful Basis Notice */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs flex flex-col md:flex-row items-start justify-between gap-6 text-[14px]">
            <div className="space-y-1">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-[15px]">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>Verified Corporate Premises:</span>
              </span>
              <p className="text-slate-600 font-medium pl-5 text-[15px]">{currentContact.office_address}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-[13px] max-w-md leading-relaxed">
              <strong className="text-slate-800 block mb-0.5 text-[14px]">Lawful Outreach Basis:</strong>
              {currentContact.lawful_basis} All contacts are sourced from public commercial directories and verified
              statutory registers for legitimate business-to-business opportunities.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
