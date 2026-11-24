import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Phone,
  MapPin,
  Briefcase,
  User,
  ThumbsUp,
  Plus,
  Trash2,
} from 'lucide-react';
import { ArtisanRecommendation } from '../../types';
import {
  ARTISAN_TRADE_CATEGORIES,
  NIGERIAN_STATES,
  POPULAR_TOWNS_BY_STATE,
  saveArtisanRecommendation,
} from '../../data/recommendationsData';
import { BrandLogo } from '../common/BrandLogo';

interface RecommendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecommendationCreated?: (newRec: ArtisanRecommendation) => void;
}

export const RecommendModal: React.FC<RecommendModalProps> = ({
  isOpen,
  onClose,
  onRecommendationCreated,
}) => {
  // Form fields
  const [artisanName, setArtisanName] = useState('');
  const [tradeCategory, setTradeCategory] = useState(ARTISAN_TRADE_CATEGORIES[0].name);
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [state, setState] = useState('Lagos');
  const [town, setTown] = useState('');
  const [customServices, setCustomServices] = useState<string[]>([
    'Solar Inverter Installation',
    'Battery Wiring & Balancing',
  ]);
  const [newServiceInput, setNewServiceInput] = useState('');
  const [recommenderName, setRecommenderName] = useState('');
  const [recommenderRelationship, setRecommenderRelationship] = useState('Client / Homeowner');
  const [workDone, setWorkDone] = useState('');
  const [recommendationNote, setRecommendationNote] = useState('');
  const [rating, setRating] = useState(5);
  const [pricingTier, setPricingTier] = useState<'fair' | 'budget_friendly' | 'premium_quality'>('fair');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdItem, setCreatedItem] = useState<ArtisanRecommendation | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSuccess(false);
        setCreatedItem(null);
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Selected trade category quick suggestion
  const currentCategoryObj = ARTISAN_TRADE_CATEGORIES.find((c) => c.name === tradeCategory);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setTradeCategory(selected);
    const cat = ARTISAN_TRADE_CATEGORIES.find((c) => c.name === selected);
    if (cat && cat.popularServices.length > 0) {
      setCustomServices(cat.popularServices.slice(0, 3));
    }
  };

  const handleAddService = () => {
    const trimmed = newServiceInput.trim();
    if (trimmed && !customServices.includes(trimmed)) {
      setCustomServices([...customServices, trimmed]);
      setNewServiceInput('');
    }
  };

  const handleRemoveService = (index: number) => {
    setCustomServices(customServices.filter((_, i) => i !== index));
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (sameAsPhone) {
      setWhatsapp(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (!artisanName.trim()) {
      setErrorMsg('Please enter the artisan’s name or business name.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Please provide a working phone number for this artisan.');
      return;
    }
    if (!state.trim()) {
      setErrorMsg('Please select the state where this artisan operates.');
      return;
    }
    if (!town.trim()) {
      setErrorMsg('Please specify the town or city area (e.g. Lekki, Maitama, Ikeja).');
      return;
    }
    if (!recommenderName.trim()) {
      setErrorMsg('Please enter your name so clients know who is recommending them.');
      return;
    }
    if (!recommendationNote.trim() || recommendationNote.length < 15) {
      setErrorMsg('Please write a brief note (at least 15 characters) explaining why you recommend them.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalServices = customServices.length > 0 ? customServices : [tradeCategory];
      const newRec = await saveArtisanRecommendation({
        artisan_name: artisanName.trim(),
        trade_category: tradeCategory,
        phone: phone.trim(),
        whatsapp: sameAsPhone ? phone.trim() : whatsapp.trim() || phone.trim(),
        state: state.trim(),
        town: town.trim(),
        services_offered: finalServices,
        level: 'master_artisan',
        recommender_name: recommenderName.trim(),
        recommender_relationship: recommenderRelationship.trim(),
        work_done: workDone.trim() || `Hired for ${tradeCategory} services.`,
        recommendation_note: recommendationNote.trim(),
        rating,
        pricing_tier: pricingTier,
      });

      setCreatedItem(newRec);
      setIsSuccess(true);
      if (onRecommendationCreated) {
        onRecommendationCreated(newRec);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit recommendation. Please check your network.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setCreatedItem(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={handleResetAndClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-3">
            <BrandLogo size="xs" showText={false} />
            <div>
              <h2 className="font-heading text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Recommend an Outstanding Artisan
              </h2>
              <p className="text-[13px] text-slate-600 mt-0.5">
                Help top electricians, plumbers, solar engineers, chefs, and builders get recognized on MatthOrg.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-200/80 hover:bg-slate-300 text-slate-800 text-[14px] font-bold whitespace-nowrap rounded-xl transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {isSuccess && createdItem ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-heading text-2xl font-bold text-slate-900">
                Thank You for Recommending {createdItem.artisan_name}!
              </h3>
              <p className="text-[15px] text-slate-600 max-w-md mx-auto leading-relaxed">
                Your recommendation has been verified and published to the MatthOrg community directory.
                Fellow clients in {createdItem.town}, {createdItem.state} can now discover and reach out to them directly.
              </p>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 text-left max-w-md mx-auto text-[14px] text-slate-700 space-y-2">
                <p>
                  <strong className="text-slate-900">Artisan:</strong> {createdItem.artisan_name}
                </p>
                <p>
                  <strong className="text-slate-900">Trade:</strong> {createdItem.trade_category}
                </p>
                <p>
                  <strong className="text-slate-900">Location:</strong> {createdItem.town}, {createdItem.state}
                </p>
                <p className="tabular-nums">
                  <strong className="text-slate-900">Phone:</strong> {createdItem.phone}
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[15px] font-bold whitespace-nowrap rounded-xl transition-colors"
                >
                  View in Directory
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSuccess(false);
                    setArtisanName('');
                    setPhone('');
                    setWorkDone('');
                    setRecommendationNote('');
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-[15px] font-semibold whitespace-nowrap rounded-xl transition-colors"
                >
                  Recommend Another Artisan
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[14px] flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Context Banner with Artisan Handshake Image */}
              <div className="flex items-center gap-3.5 p-3.5 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 rounded-xl border border-blue-100">
                <img
                  src="/WhatsApp Image 2026-10-23 at 11.06.06 AM.jpeg"
                  onError={(e) => {
                    e.currentTarget.src = '/artisan-handshake.jpg';
                  }}
                  alt="Homeowner greeting artisan"
                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-blue-200/80 shadow-xs"
                />
                <div className="text-[14px] text-slate-700 space-y-0.5">
                  <p className="font-bold text-slate-900">
                    Reward exceptional local work
                  </p>
                  <p className="text-[13px] text-slate-600 leading-relaxed">
                    Have an electrician, solar engineer, plumber, or baker whose work gave you peace of mind? Share their details so more clients can reach them.
                  </p>
                </div>
              </div>

              {/* Section 1: Artisan Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span className="text-[13px] font-bold uppercase tracking-wider text-slate-800">
                    1. The Artisan You Are Recommending
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Business Name or Artisan Name */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-[14px] font-semibold text-slate-800">
                      Artisan Name or Business Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Engr. Dapo Alabi, Apex Solar Dynamics, or Pa Johnson Adeyemi"
                      value={artisanName}
                      onChange={(e) => setArtisanName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[15px] text-slate-900 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  {/* Trade Category */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-[14px] font-semibold text-slate-800">
                      Trade / Profession <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={tradeCategory}
                      onChange={handleCategoryChange}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[15px] text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      {ARTISAN_TRADE_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="block text-[14px] font-semibold text-slate-800">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 0803 441 8920"
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[15px] text-slate-900 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* WhatsApp Number */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[14px] font-semibold text-slate-800">
                        WhatsApp Number
                      </label>
                      <label className="flex items-center gap-1.5 text-[13px] text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sameAsPhone}
                          onChange={(e) => {
                            setSameAsPhone(e.target.checked);
                            if (e.target.checked) setWhatsapp(phone);
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>Same as phone</span>
                      </label>
                    </div>
                    <input
                      type="tel"
                      disabled={sameAsPhone}
                      placeholder="e.g. 0803 441 8920"
                      value={sameAsPhone ? phone : whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className={`w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[15px] text-slate-900 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                        sameAsPhone ? 'opacity-60 bg-slate-50 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>

                  {/* State */}
                  <div className="space-y-1.5">
                    <label className="block text-[14px] font-semibold text-slate-800">
                      State <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={state}
                      onChange={(e) => {
                        setState(e.target.value);
                        // prefill suggested town if exists
                        const towns = POPULAR_TOWNS_BY_STATE[e.target.value];
                        if (towns && towns.length > 0) setTown(towns[0]);
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[15px] text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      {NIGERIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Town / City / Neighborhood */}
                  <div className="space-y-1.5">
                    <label className="block text-[14px] font-semibold text-slate-800">
                      Town / City / Area <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Lekki, Ikeja, Maitama, Bodija, Port Harcourt"
                        value={town}
                        onChange={(e) => setTown(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[15px] text-slate-900 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    {/* Quick suggestions for selected state */}
                    {POPULAR_TOWNS_BY_STATE[state] && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {POPULAR_TOWNS_BY_STATE[state].slice(0, 4).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTown(t)}
                            className="text-[13px] text-slate-600 hover:text-blue-700 underline underline-offset-2"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Services They Offer */}
                <div className="space-y-2 pt-2">
                  <label className="block text-[14px] font-semibold text-slate-800">
                    Services They Offer <span className="text-slate-500 font-normal">(Add specific tasks)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 5kVA Solar Inverter Setup, Conduit Pipe Flaring, Baking 3-tier Wedding Cakes"
                      value={newServiceInput}
                      onChange={(e) => setNewServiceInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddService();
                        }
                      }}
                      className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[15px] text-slate-900 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddService}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[14px] font-semibold whitespace-nowrap rounded-xl transition-colors inline-flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>

                  {/* List of services (Unboxed list with remove action) */}
                  {customServices.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {customServices.map((srv, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-3.5 py-2 bg-slate-50 rounded-lg text-[14px] text-slate-700 border border-slate-100"
                        >
                          <span className="truncate">▪ {srv}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveService(idx)}
                            className="text-slate-500 hover:text-rose-600 p-1"
                            title="Remove service"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Recommender Experience & Review */}
              <div className="space-y-4 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <User className="w-4 h-4 text-[#0B192C]" />
                  <span className="text-[13px] font-bold uppercase tracking-wider text-slate-800">
                    2. Your Recommendation & Review
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Recommender Name */}
                  <div className="space-y-1.5">
                    <label className="block text-[14px] font-semibold text-slate-800">
                      Your Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Your Full Name or Organization"
                      value={recommenderName}
                      onChange={(e) => setRecommenderName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[15px] text-slate-900 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  {/* Relationship */}
                  <div className="space-y-1.5">
                    <label className="block text-[14px] font-semibold text-slate-800">
                      Your Relationship / Context
                    </label>
                    <select
                      value={recommenderRelationship}
                      onChange={(e) => setRecommenderRelationship(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[15px] text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="Client / Homeowner">Client / Homeowner</option>
                      <option value="Project Manager / Engineer">Project Manager / Engineer</option>
                      <option value="Real Estate Developer">Real Estate Developer</option>
                      <option value="Interior Designer">Interior Designer</option>
                      <option value="Long-term Regular Client">Long-term Regular Client</option>
                      <option value="Corporate Facility Manager">Corporate Facility Manager</option>
                    </select>
                  </div>

                  {/* Work Done / Project description */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-[14px] font-semibold text-slate-800">
                      What Did They Do For You? <span className="text-slate-500 font-normal">(Brief project description)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Installed a complete 10kVA solar inverter with lithium batteries at my duplex in Lekki."
                      value={workDone}
                      onChange={(e) => setWorkDone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[15px] text-slate-900 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  {/* Why do you recommend them? (Review note) */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-[14px] font-semibold text-slate-800">
                      Why Do You Recommend Them? <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Mention their punctuality, honesty, quality of finish, transparent pricing, or after-sales service..."
                      value={recommendationNote}
                      onChange={(e) => setRecommendationNote(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[15px] text-slate-900 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  {/* Star Rating */}
                  <div className="space-y-1.5">
                    <label className="block text-[14px] font-semibold text-slate-800">
                      Overall Rating
                    </label>
                    <div className="flex items-center gap-1.5 py-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 text-slate-300 hover:text-amber-400 transition-colors"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= rating
                                ? 'fill-amber-400 text-amber-500'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-[14px] font-semibold text-slate-700 ml-2 tabular-nums">
                        {rating} out of 5 stars
                      </span>
                    </div>
                  </div>

                  {/* Pricing Assessment */}
                  <div className="space-y-1.5">
                    <label className="block text-[14px] font-semibold text-slate-800">
                      Pricing & Value
                    </label>
                    <select
                      value={pricingTier}
                      onChange={(e) => setPricingTier(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[15px] text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="fair">Fair & Honest Pricing</option>
                      <option value="budget_friendly">Budget-Friendly / Great Value</option>
                      <option value="premium_quality">Premium Quality / High End</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[15px] font-semibold whitespace-nowrap rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-7 py-2.5 bg-[#0B192C] hover:bg-[#1E3E62] disabled:opacity-50 text-white text-[15px] font-bold whitespace-nowrap rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting Recommendation...' : 'Publish Recommendation'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
