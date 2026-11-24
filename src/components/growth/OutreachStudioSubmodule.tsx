// ============================================================================
// MatthOrg AI Growth Engine — Submodule 5: Outreach Studio
// Personalized multi-channel sales copywriting with tone controls and live editing
// ============================================================================

import React, { useState } from 'react';
import {
  Send,
  Mail,
  MessageCircle,
  Linkedin,
  PhoneCall,
  Calendar,
  Sparkles,
  Copy,
  Check,
  Edit3,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  DiscoveredBusiness,
  OutreachType,
  OutreachTone,
  OutreachMessage,
} from '../../types/growthEngine';
import { triggerOutreachGeneration, updateLeadPipelineStage } from '../../lib/growthEngineDb';

interface OutreachStudioSubmoduleProps {
  leads: DiscoveredBusiness[];
  activeLead: DiscoveredBusiness | null;
  onSelectLead: (lead: DiscoveredBusiness) => void;
  onProceedToPipeline: (lead: DiscoveredBusiness) => void;
}

const OUTREACH_CHANNELS: { type: OutreachType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { type: 'cold_email', label: 'Cold Email', icon: Mail },
  { type: 'whatsapp_intro', label: 'WhatsApp Intro', icon: MessageCircle },
  { type: 'linkedin_message', label: 'LinkedIn Note', icon: Linkedin },
  { type: 'follow_up_email', label: 'Follow-Up Email', icon: Clock },
  { type: 'sales_call_notes', label: 'Sales Call Battlecard', icon: PhoneCall },
  { type: 'meeting_invitation', label: 'Meeting Invitation', icon: Calendar },
];

const TONES: { tone: OutreachTone; label: string; desc: string }[] = [
  { tone: 'consultative', label: 'Consultative', desc: 'Focuses on solving specific facility and operational pain points' },
  { tone: 'professional', label: 'Executive Professional', desc: 'Formal, concise B2B language for C-suite decision makers' },
  { tone: 'friendly', label: 'Friendly & Warm', desc: 'Approachable, relationship-driven introduction' },
  { tone: 'direct_sales', label: 'Direct Sales', desc: 'Value and ROI proposition with immediate commercial CTA' },
];

export const OutreachStudioSubmodule: React.FC<OutreachStudioSubmoduleProps> = ({
  leads,
  activeLead,
  onSelectLead,
  onProceedToPipeline,
}) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(activeLead?.id || leads[0]?.id || '');
  const [selectedChannel, setSelectedChannel] = useState<OutreachType>('cold_email');
  const [selectedTone, setSelectedTone] = useState<OutreachTone>('consultative');
  const [senderName, setSenderName] = useState('Ejaeta Omene');
  const [senderBusiness, setSenderBusiness] = useState('MatthOrg Commercial Partners');
  const [userOffering, setUserOffering] = useState('Commercial Solar, Inverter Backup & Facility Services');

  const [isGenerating, setIsGenerating] = useState(false);
  const [editableSubject, setEditableSubject] = useState('');
  const [editableBody, setEditableBody] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [sendSuccessToast, setSendSuccessToast] = useState(false);

  const selectedLead = leads.find((l) => l.id === selectedLeadId) || activeLead || leads[0];

  const handleGenerate = async () => {
    if (!selectedLead) return;
    setIsGenerating(true);
    setIsCopied(false);
    try {
      const msg = await triggerOutreachGeneration(
        selectedLead,
        selectedChannel,
        selectedTone,
        senderName,
        senderBusiness,
        userOffering
      );
      setEditableSubject(msg.subject || '');
      setEditableBody(msg.message_body || '');
    } catch (err) {
      console.error('Error generating outreach:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    const fullText = editableSubject ? `Subject: ${editableSubject}\n\n${editableBody}` : editableBody;
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleMarkAsSent = () => {
    if (!selectedLead) return;
    updateLeadPipelineStage(selectedLead.id, 'contacted');
    setSendSuccessToast(true);
    setTimeout(() => setSendSuccessToast(false), 3000);
  };

  const cleanPhone = (selectedLead?.phone || selectedLead?.enriched_contact?.official_phone || '').replace(/\D/g, '');
  const waSendUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith('0') ? '234' + cleanPhone.substring(1) : cleanPhone}?text=${encodeURIComponent(
        editableBody
      )}`
    : undefined;

  const mailtoUrl = selectedLead?.email || selectedLead?.enriched_contact?.official_email
    ? `mailto:${selectedLead.email || selectedLead.enriched_contact?.official_email}?subject=${encodeURIComponent(
        editableSubject
      )}&body=${encodeURIComponent(editableBody)}`
    : undefined;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Studio Controls Panel */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                <Send className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-heading text-xl sm:text-[22px] font-extrabold text-[#0B192C]">Outreach Studio</h2>
                <p className="text-[14px] sm:text-[15px] text-[#5B6D85]">
                  Generate tailored, highly persuasive B2B sales copy referencing actual company research findings.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !selectedLead}
              className="px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-[14px] sm:text-[15px] font-bold flex items-center gap-2 whitespace-nowrap shadow-sm transition active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-200" />
                  <span>Synthesizing Copy...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>Generate Personalized Message</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Lead & Channel Selector */}
        <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[14px] font-bold text-slate-700">Target Prospect</label>
            <select
              value={selectedLeadId}
              onChange={(e) => {
                setSelectedLeadId(e.target.value);
                const found = leads.find((l) => l.id === e.target.value);
                if (found) {
                  onSelectLead(found);
                  setEditableSubject('');
                  setEditableBody('');
                }
              }}
              className="w-full px-3.5 py-2.5 text-[15px] rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-600"
            >
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.business_name} ({l.city || l.state})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[14px] font-bold text-slate-700">Sender Identity</label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Your Name"
              className="w-full px-3.5 py-2.5 text-[15px] rounded-xl border border-slate-200"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[14px] font-bold text-slate-700">Your Business / Brand</label>
            <input
              type="text"
              value={senderBusiness}
              onChange={(e) => setSenderBusiness(e.target.value)}
              placeholder="Your Business Name"
              className="w-full px-3.5 py-2.5 text-[15px] rounded-xl border border-slate-200"
            />
          </div>
        </div>

        {/* Channel Format Buttons */}
        <div className="pt-5 space-y-2">
          <label className="text-[13px] font-bold uppercase tracking-wider text-slate-500 block">
            Select Outreach Channel & Format
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {OUTREACH_CHANNELS.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedChannel(type)}
                className={`p-3 rounded-2xl border text-[14px] font-bold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                  selectedChannel === type
                    ? 'bg-[#0B192C] text-white border-[#0B192C] shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${selectedChannel === type ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span className="text-[13px] text-center leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tone Selector */}
        <div className="pt-5 space-y-2">
          <label className="text-[13px] font-bold uppercase tracking-wider text-slate-500 block">
            Select Communication Tone
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {TONES.map(({ tone, label, desc }) => (
              <button
                key={tone}
                type="button"
                onClick={() => setSelectedTone(tone)}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                  selectedTone === tone
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-950 shadow-2xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <span className="font-bold block text-[14px]">{label}</span>
                <span className="text-[13px] text-slate-600 block mt-1 leading-snug">{desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Live Editable Message Canvas */}
      {!editableBody ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto">
            <Edit3 className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="font-heading font-bold text-xl text-slate-900">
              Generate Sales Copy for {selectedLead?.business_name || 'Prospect'}
            </h3>
            <p className="text-[15px] text-slate-600 leading-relaxed">
              Click <strong>Generate Personalized Message</strong> above to synthesize outreach referencing this prospect’s
              specific verified location, industry challenges, and strategic pitch angle.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-[15px] inline-flex items-center gap-2 whitespace-nowrap cursor-pointer shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Copy Now</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[13px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full bg-indigo-100 text-indigo-900">
                {selectedChannel.replace('_', ' ')}
              </span>
              <span className="text-[14px] text-slate-600">Tone: {selectedTone}</span>
              <span className="text-[14px] text-slate-500">• For: {selectedLead?.business_name}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-[14px] font-bold text-slate-700 flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span>{isCopied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
              </button>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-[14px] font-bold text-slate-700 flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>Regenerate</span>
              </button>
            </div>
          </div>

          {/* Subject Line (if applicable) */}
          {editableSubject !== undefined && selectedChannel !== 'whatsapp_intro' && selectedChannel !== 'linkedin_message' && (
            <div className="space-y-1.5">
              <label className="text-[14px] font-bold text-slate-700">Subject Line (Editable)</label>
              <input
                type="text"
                value={editableSubject}
                onChange={(e) => setEditableSubject(e.target.value)}
                className="w-full px-4 py-2.5 text-[15px] font-semibold rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          )}

          {/* Message Body (Editable) */}
          <div className="space-y-1.5">
            <label className="text-[14px] font-bold text-slate-700">Message Content (Editable Draft)</label>
            <textarea
              rows={11}
              value={editableBody}
              onChange={(e) => setEditableBody(e.target.value)}
              className="w-full p-4 text-[15px] font-normal leading-relaxed rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 font-sans"
            />
          </div>

          {/* Action Launch Bar */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2.5">
              {mailtoUrl && (
                <a
                  href={mailtoUrl}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[14px] font-bold whitespace-nowrap transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send via Email Client</span>
                </a>
              )}

              {waSendUrl && (
                <a
                  href={waSendUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[14px] font-bold whitespace-nowrap transition flex items-center gap-1.5 shadow-2xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send via WhatsApp</span>
                </a>
              )}

              <button
                type="button"
                onClick={handleMarkAsSent}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[14px] font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Mark Contacted in Pipeline</span>
              </button>
            </div>

            {selectedLead && (
              <button
                type="button"
                onClick={() => onProceedToPipeline(selectedLead)}
                className="text-[14px] font-bold text-indigo-700 hover:underline flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <span>View CRM Pipeline</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {sendSuccessToast && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[14px] flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Outreach recorded! <strong>{selectedLead?.business_name}</strong> has been updated to &quot;Contacted&quot;
                in the CRM pipeline.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
