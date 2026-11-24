import React, { useState } from 'react';
import {
  X,
  MessageCircle,
  Smartphone,
  Copy,
  Check,
  Send,
  ExternalLink,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { ArtisanRecommendation } from '../../types';
import {
  buildArtisanOutreachMessage,
  updateArtisanRecommendation,
} from '../../data/recommendationsData';
import { BrandLogo } from '../common/BrandLogo';

interface ArtisanOutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: ArtisanRecommendation | null;
  onOutreachRecorded?: (updatedRec: ArtisanRecommendation) => void;
}

export const ArtisanOutreachModal: React.FC<ArtisanOutreachModalProps> = ({
  isOpen,
  onClose,
  recommendation,
  onOutreachRecorded,
}) => {
  if (!isOpen || !recommendation) return null;

  const [channel, setChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [copied, setCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [customNotes, setCustomNotes] = useState('');

  // Generate initial invitation message
  const [message, setMessage] = useState(() =>
    buildArtisanOutreachMessage(recommendation, 'whatsapp')
  );

  // Switch channel updates message formatting if not manually heavily modified
  const handleChannelSwitch = (newChannel: 'whatsapp' | 'sms') => {
    setChannel(newChannel);
    setMessage(buildArtisanOutreachMessage(recommendation, newChannel));
  };

  const rawPhone = (recommendation.whatsapp || recommendation.phone || '').replace(/[^0-9]/g, '');
  const cleanPhone = recommendation.phone.trim();

  // Generate URLs
  const whatsappUrl = `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`;
  const smsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(message)}`;

  // Copy message to clipboard
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  // Record outreach sent
  const handleRecordOutreach = async (usedChannel: 'whatsapp' | 'sms') => {
    setIsUpdating(true);
    try {
      const updated = await updateArtisanRecommendation(recommendation.id, {
        outreach_status: usedChannel === 'whatsapp' ? 'whatsapp_sent' : 'sms_sent',
        outreach_channel: usedChannel,
        outreach_sent_at: new Date().toISOString(),
        outreach_notes: customNotes.trim() || undefined,
        validation_status: recommendation.validation_status === 'pending' ? 'validated' : recommendation.validation_status,
      });

      if (updated && onOutreachRecorded) {
        onOutreachRecorded(updated);
      }
    } catch (e) {
      console.error('Failed to record outreach:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  // Launch WhatsApp and mark sent
  const handleLaunchWhatsApp = async () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    await handleRecordOutreach('whatsapp');
  };

  // Launch SMS and mark sent
  const handleLaunchSMS = async () => {
    window.location.href = smsUrl;
    await handleRecordOutreach('sms');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <BrandLogo size="xs" showText={false} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold uppercase tracking-wider text-blue-600">
                  Outreach Campaign
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-[13px] text-slate-600 font-medium">Invitation Dispatch</span>
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                Invite {recommendation.artisan_name}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Artisan Summary Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[14px]">
              <span className="font-heading font-bold text-slate-900 text-lg">
                {recommendation.artisan_name}
              </span>
              <span className="font-semibold text-slate-700 text-[14px]">
                {recommendation.trade_category}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[14px] text-slate-600">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-slate-400" />
                {recommendation.town}, {recommendation.state}
              </span>
              <span>·</span>
              <span>Phone: <strong className="text-slate-900 font-mono tabular-nums">{recommendation.phone}</strong></span>
              {recommendation.whatsapp && (
                <>
                  <span>·</span>
                  <span>WhatsApp: <strong className="text-slate-900 font-mono tabular-nums">{recommendation.whatsapp}</strong></span>
                </>
              )}
            </div>
            {recommendation.recommender_name && (
              <div className="pt-2 border-t border-slate-200/60 text-[14px] text-slate-600">
                <span className="font-semibold text-slate-700">Recommended by: </span>
                {recommendation.recommender_name} ({recommendation.recommender_relationship || 'Client'})
                {recommendation.work_done && (
                  <span className="italic text-slate-500"> — "{recommendation.work_done}"</span>
                )}
              </div>
            )}
          </div>

          {/* Previous Outreach Status banner if already sent */}
          {recommendation.outreach_status && recommendation.outreach_status !== 'not_contacted' && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-[14px] text-blue-900 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Previous outreach sent via{' '}
                  <strong className="uppercase">{recommendation.outreach_channel || 'Channel'}</strong>
                  {recommendation.outreach_sent_at && (
                    <span className="tabular-nums"> on {new Date(recommendation.outreach_sent_at).toLocaleDateString()}</span>
                  )}
                </span>
              </div>
              <span className="text-[13px] font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-md whitespace-nowrap">
                {recommendation.outreach_status}
              </span>
            </div>
          )}

          {/* Channel Selector */}
          <div className="space-y-2">
            <label className="block text-[14px] font-semibold uppercase tracking-wider text-slate-700">
              Select Outreach Channel
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleChannelSwitch('whatsapp')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-[15px] font-bold transition-all whitespace-nowrap ${
                  channel === 'whatsapp'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <MessageCircle className={`w-4 h-4 ${channel === 'whatsapp' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>WhatsApp Message</span>
              </button>

              <button
                type="button"
                onClick={() => handleChannelSwitch('sms')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-[15px] font-bold transition-all whitespace-nowrap ${
                  channel === 'sms'
                    ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Smartphone className={`w-4 h-4 ${channel === 'sms' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>SMS Invitation</span>
              </button>
            </div>
          </div>

          {/* Invitation Message Preview & Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[14px] font-semibold uppercase tracking-wider text-slate-700">
                Invitation Message Copy
              </label>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="inline-flex items-center gap-1.5 text-[14px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer whitespace-nowrap"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-[15px] text-slate-900 font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
            />
            <p className="text-[13px] text-slate-600 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Includes personalized claim link for {recommendation.artisan_name} to verify and claim their business on MatthOrg.</span>
            </p>
          </div>

          {/* Custom Campaign Notes (optional) */}
          <div className="space-y-1.5">
            <label className="block text-[14px] font-semibold text-slate-700">
              Admin Outreach Notes <span className="text-slate-500 font-normal">(Optional internal tracking)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Spoke briefly, promised to review profile link this evening."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleRecordOutreach(channel)}
              className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[14px] font-semibold rounded-xl transition-colors w-full sm:w-auto text-center whitespace-nowrap"
            >
              {isUpdating ? 'Saving...' : 'Mark as Contacted Manually'}
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[15px] font-semibold rounded-xl transition-colors whitespace-nowrap"
            >
              Cancel
            </button>

            {channel === 'whatsapp' ? (
              <button
                type="button"
                onClick={handleLaunchWhatsApp}
                disabled={isUpdating}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[15px] font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Launch WhatsApp & Mark Sent</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLaunchSMS}
                disabled={isUpdating}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[15px] font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Smartphone className="w-4 h-4" />
                <span>Send SMS & Mark Sent</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
