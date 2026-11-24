import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Zap,
  CheckCircle2,
  MapPin,
  Calendar,
  MessageSquare,
  DollarSign,
  Send,
  Building,
  ShieldCheck,
  Flame,
  Search,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Lead, BusinessProfile } from '../types';
import { createCustomerRequest } from '../lib/db';
import {
  SERVICE_CATEGORIES,
  POPULAR_LOCATIONS,
  calculateIntentScore,
  parseNaturalLanguageRequest,
} from '../data/marketplaceData';

interface ServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitRequest: (newLead: Lead) => void;
  business?: BusinessProfile;
}

export const ServiceRequestModal: React.FC<ServiceRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmitRequest,
}) => {
  const [activeTab, setActiveTab] = useState<'smart' | 'form'>('smart');

  // "Request Anything" NLP input
  const [naturalText, setNaturalText] = useState(
    'I just moved into a 3-bedroom house in Abuja and need solar, CCTV, and internet setup with lithium battery backup.'
  );
  const [isExtracted, setIsExtracted] = useState(false);

  // Form Fields
  const [serviceRequired, setServiceRequired] = useState('Solar Installation');
  const [serviceCategory, setServiceCategory] = useState('Power & Technology');
  const [location, setLocation] = useState('Abuja (FCT)');
  const [propertyType, setPropertyType] = useState('3-bedroom house');
  const [budgetFormatted, setBudgetFormatted] = useState('₦1,500,000 – ₦2,500,000');
  const [timeline, setTimeline] = useState<'immediate' | 'within_7_days' | 'within_30_days' | 'flexible'>('within_7_days');
  const [customerName, setCustomerName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [detectedServicesList, setDetectedServicesList] = useState<string[]>([]);

  // Verification Simulation Modal State
  const [submittedLead, setSubmittedLead] = useState<Lead | null>(null);
  const [showVerificationStep, setShowVerificationStep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const [consentGiven, setConsentGiven] = useState(true);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRunSmartExtraction = () => {
    if (!naturalText.trim()) return;
    const parsed = parseNaturalLanguageRequest(naturalText);
    setDetectedServicesList(parsed.services);
    setServiceRequired(parsed.services.join(', '));
    setServiceCategory(parsed.category);
    setLocation(parsed.location);
    setPropertyType(parsed.property);
    setBudgetFormatted(parsed.budget);
    setTimeline(parsed.timeline);
    setNotes(naturalText);
    setIsExtracted(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    if (!consentGiven) {
      setSubmissionError('Please confirm consent to be contacted by verified trade contractors.');
      return;
    }

    setIsSubmitting(true);
    setIsSubmitSuccess(false);

    try {
      // 1. Authoritative request persistence in backend
      const persistedReq = await createCustomerRequest({
        customer_name: customerName.trim() || 'Prospective Seeker',
        phone: whatsapp.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim() || undefined,
        location,
        service_required: serviceRequired,
        service_category: serviceCategory,
        property_type: propertyType,
        budget_formatted: budgetFormatted,
        timeline,
        details: notes.trim() || naturalText.trim(),
        status: 'Open',
        consent_given: consentGiven,
      });

      const { score, level } = calculateIntentScore({
        service_required: serviceRequired,
        phone: whatsapp,
        whatsapp,
        location,
        budget_formatted: budgetFormatted,
        timeline,
        is_verified: true,
        notes: notes || naturalText,
      });

      const leadNum = persistedReq?.request_number || `MAT-${Math.floor(100000 + Math.random() * 900000)}`;
      const newLead: Lead = {
        id: `lead_market_${Date.now()}`,
        lead_number: leadNum,
        customer_name: customerName.trim() || 'Prospective Seeker',
        phone: whatsapp.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim() || undefined,
        location,
        service_required: serviceRequired,
        service_category: serviceCategory,
        property_type: propertyType,
        budget_formatted: budgetFormatted,
        timeline,
        source: 'marketplace',
        source_name: 'MatthOrg Marketplace Portal',
        status: 'New',
        intent_score: score,
        intent_level: level,
        is_verified: true,
        verified_at: new Date().toISOString(),
        freshness: 'active',
        freshness_label: '🔥 Active — verified just now',
        is_locked: true,
        notes: notes.trim() || naturalText.trim(),
        requirements_list: detectedServicesList.length > 0 ? detectedServicesList : [serviceRequired],
        customer_request_id: persistedReq?.id,
        created_at: new Date().toISOString(),
      };

      setIsSubmitSuccess(true);
      setTimeout(() => {
        setSubmittedLead(newLead);
        setShowVerificationStep(true);
        setIsSubmitSuccess(false);
      }, 600);
    } catch (err: any) {
      console.error('Customer request persistence error:', err);
      setIsSubmitSuccess(false);
      setSubmissionError(
        err?.message || 'Failed to persist customer request to the database. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmVerification = (stillLooking: boolean) => {
    if (!submittedLead) return;

    if (stillLooking) {
      const verifiedLead: Lead = {
        ...submittedLead,
        intent_score: Math.min(100, submittedLead.intent_score + 10),
        intent_level: 'Very High',
        is_verified: true,
        verified_at: new Date().toISOString(),
        freshness_label: '🔥 Active — verified 1 minute ago',
      };
      onSubmitRequest(verifiedLead);
    } else {
      const closedLead: Lead = {
        ...submittedLead,
        status: 'Lost',
        freshness: 'closed',
        freshness_label: 'Closed by Seeker',
      };
      onSubmitRequest(closedLead);
    }

    setShowVerificationStep(false);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white border border-[#E5E9F0] shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#E5E9F0] bg-gradient-to-r from-emerald-900 to-[#0B192C] text-white flex items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-0.5 text-[13px] font-bold uppercase tracking-wider text-emerald-300 border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Free Consumer Portal
              </span>
              <span className="text-[13px] text-emerald-200/90">No subscription required</span>
            </div>
            <h2 className="font-heading text-xl sm:text-2xl font-bold mt-1.5 text-white tracking-tight">Find Verified Service Providers</h2>
            <p className="text-[14px] text-emerald-100/80 mt-0.5">
              Submit your request to receive competitive quotes from rated businesses in your area.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[14px] font-bold transition cursor-pointer shrink-0 whitespace-nowrap"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
        </div>

        {/* Verification Step Overlay Simulation */}
        {showVerificationStep && submittedLead ? (
          <div className="p-6 md:p-8 space-y-6 text-center animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="max-w-md mx-auto space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[13px] font-bold border border-emerald-200">
                <Flame className="w-4 h-4 text-emerald-600" /> Intent Verification (PRD Engine)
              </div>
              <h3 className="font-heading text-xl font-bold text-[#0B192C]">
                Simulated WhatsApp Verification Ping
              </h3>
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-left text-[14px] space-y-2 text-[#334155] shadow-inner font-sans">
                <div className="flex items-center gap-2 text-emerald-600 font-bold">
                  <MessageSquare className="w-4 h-4" /> WhatsApp Prompt to {submittedLead.customer_name}:
                </div>
                <p className="italic text-[#475569] leading-relaxed">
                  "Hi {submittedLead.customer_name}, you recently requested a quote for *{submittedLead.service_required}* in *{submittedLead.location}* on Mathorg. Are you still looking for this service?"
                </p>
              </div>
              <p className="text-[14px] text-[#5B6D85]">
                Confirming customer freshness protects providers from stale inquiries and guarantees high intent score (<span className="tabular-nums font-semibold">{submittedLead.intent_score}/100</span>).
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleConfirmVerification(true)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[15px] shadow-md transition active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Yes, I'm still looking (Confirm Request)</span>
              </button>
              <button
                type="button"
                onClick={() => handleConfirmVerification(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[15px] transition whitespace-nowrap"
              >
                No, I've sorted it
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Mode Switch Tabs */}
            <div className="flex border-b border-[#E5E9F0] bg-[#F8FAFC]">
              <button
                type="button"
                onClick={() => setActiveTab('smart')}
                className={`flex-1 py-3.5 px-3 text-[14px] font-bold transition flex items-center justify-center gap-2 border-b-2 whitespace-nowrap ${
                  activeTab === 'smart'
                    ? 'border-emerald-600 text-emerald-800 bg-white'
                    : 'border-transparent text-[#5B6D85] hover:text-[#0B192C]'
                }`}
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>"Request Anything" (Smart AI Parser)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`flex-1 py-3.5 px-3 text-[14px] font-bold transition flex items-center justify-center gap-2 border-b-2 whitespace-nowrap ${
                  activeTab === 'form'
                    ? 'border-emerald-600 text-emerald-800 bg-white'
                    : 'border-transparent text-[#5B6D85] hover:text-[#0B192C]'
                }`}
              >
                <Zap className="w-4 h-4 text-[#3D74D9]" />
                <span>Standard Request Form</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
              {activeTab === 'smart' && (
                <div className="space-y-3 bg-[#F0FDF4] p-4 rounded-xl border border-emerald-200">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="text-[14px] font-bold text-emerald-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" /> Describe what you need in plain words:
                    </label>
                    <span className="text-[13px] font-medium text-emerald-700">PRD Section 19 Feature</span>
                  </div>
                  <textarea
                    rows={3}
                    value={naturalText}
                    onChange={(e) => {
                      setNaturalText(e.target.value);
                      setIsExtracted(false);
                    }}
                    placeholder="e.g. I just moved into a 3-bedroom house in Abuja and need solar, CCTV, internet and curtains."
                    className="w-full rounded-xl bg-white border border-emerald-300 p-3 text-[15px] text-[#0B192C] focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleRunSmartExtraction}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-bold shadow-sm transition active:scale-95 whitespace-nowrap"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{isExtracted ? 'Re-Analyze Request' : 'Auto-Extract Requirements'}</span>
                    </button>
                    {isExtracted && (
                      <span className="text-[13px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Extracted successfully below
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Service & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[14px] font-semibold text-[#0B192C] mb-1.5">
                    Service Category
                  </label>
                  <select
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value)}
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C] focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                  >
                    {SERVICE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[14px] font-semibold text-[#0B192C] mb-1.5">
                    What Service Do You Need? <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Solar Hybrid Installation, CCTV Setup"
                    value={serviceRequired}
                    onChange={(e) => setServiceRequired(e.target.value)}
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C] focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Location & Property */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[14px] font-semibold text-[#0B192C] mb-1.5">
                    Location (City / Area) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#5B6D85] absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Abuja - Maitama"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      list="seeker-locations"
                      className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] pl-10 pr-3.5 py-2.5 text-[15px] text-[#0B192C] focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                    />
                    <datalist id="seeker-locations">
                      {POPULAR_LOCATIONS.map((loc) => (
                        <option key={loc} value={loc} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block text-[14px] font-semibold text-[#0B192C] mb-1.5">
                    Property / Facility Type
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3-bedroom house, Duplex, Office"
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C] focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Budget & Timeline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[14px] font-semibold text-[#0B192C] mb-1.5">
                    Estimated Budget Range
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₦1,000,000 – ₦1,500,000"
                    value={budgetFormatted}
                    onChange={(e) => setBudgetFormatted(e.target.value)}
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C] focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-semibold text-[#0B192C] mb-1.5">
                    When Do You Need This Done?
                  </label>
                  <select
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value as any)}
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C] focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                  >
                    <option value="immediate">Immediately / Urgent</option>
                    <option value="within_7_days">Within 7 Days</option>
                    <option value="within_30_days">Within 30 Days</option>
                    <option value="flexible">Flexible / Exploring Options</option>
                  </select>
                </div>
              </div>

              {/* Contact Info */}
              <div className="border-t border-[#E5E9F0] pt-4 space-y-4">
                <div className="font-heading text-[13px] font-bold uppercase tracking-wider text-[#0B192C] flex items-center justify-between gap-2 flex-wrap">
                  <span>Your Contact Details (Confidential)</span>
                  <span className="font-sans text-[13px] text-[#5B6D85] font-normal normal-case tracking-normal">
                    🔒 Kept private until matched with verified providers
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[14px] font-semibold text-[#0B192C] mb-1.5">
                      Your Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Okafor"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C] focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[14px] font-semibold text-[#0B192C] mb-1.5">
                      WhatsApp / Phone <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <MessageSquare className="w-4 h-4 text-[#5B6D85] absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="+234 802 123 4567"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] pl-10 pr-3.5 py-2.5 text-[15px] text-[#0B192C] focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[14px] font-semibold text-[#0B192C] mb-1.5">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C] focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Consent Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 text-[14px] text-[#475569] cursor-pointer select-none leading-relaxed">
                    <input
                      type="checkbox"
                      checked={consentGiven}
                      onChange={(e) => setConsentGiven(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span>
                      I consent to verified trade contractors and MatthOrg contacting me via WhatsApp/Phone regarding this service inquiry.
                    </span>
                  </label>
                </div>

                {/* Submission Error Banner */}
                {submissionError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[14px] flex items-start gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{submissionError}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E5E9F0]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-[15px] font-semibold text-[#5B6D85] hover:text-[#0B192C] transition whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isSubmitSuccess}
                  className={`inline-flex items-center gap-2 rounded-xl text-white px-6 py-2.5 text-[15px] font-bold shadow-md transition-all duration-300 cursor-pointer active:scale-95 disabled:opacity-85 whitespace-nowrap ${
                    isSubmitSuccess
                      ? 'bg-emerald-700 ring-2 ring-emerald-400/50 scale-[1.02]'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : isSubmitSuccess ? (
                    <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white text-emerald-700 shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <span>Request Submitted!</span>
                    </div>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Service Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
