import React, { useState } from 'react';
import {
  Phone,
  MessageCircle,
  ThumbsUp,
  Share2,
  Check,
  Star,
  MapPin,
  FileText,
  ShieldCheck,
  Sun,
  Zap,
  Droplets,
  UtensilsCrossed,
  Cake,
  Hammer,
  Wind,
  Paintbrush,
  Wrench,
  Shield,
  Scissors,
  Grid,
} from 'lucide-react';
import { ArtisanRecommendation } from '../../types';
import { hasUserVouched, vouchForArtisan } from '../../data/recommendationsData';

interface ArtisanRecommendationCardProps {
  recommendation: ArtisanRecommendation;
  onVouchUpdated?: (id: string, newCount: number) => void;
  onRequestQuote?: (artisanName: string, trade: string, location: string) => void;
}

export const ArtisanRecommendationCard: React.FC<ArtisanRecommendationCardProps> = ({
  recommendation,
  onVouchUpdated,
  onRequestQuote,
}) => {
  const [vouches, setVouches] = useState<number>(recommendation.vouches_count || 1);
  const [isVouched, setIsVouched] = useState<boolean>(() => hasUserVouched(recommendation.id));
  const [isVouching, setIsVouching] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Helper for category icons
  const getTradeIcon = (trade: string) => {
    const t = trade.toLowerCase();
    if (t.includes('solar')) return <Sun className="w-4 h-4 text-amber-600" />;
    if (t.includes('electr')) return <Zap className="w-4 h-4 text-amber-500" />;
    if (t.includes('plumb')) return <Droplets className="w-4 h-4 text-blue-600" />;
    if (t.includes('chef') || t.includes('cater')) return <UtensilsCrossed className="w-4 h-4 text-orange-600" />;
    if (t.includes('bake') || t.includes('pastry')) return <Cake className="w-4 h-4 text-rose-500" />;
    if (t.includes('carpent') || t.includes('wood')) return <Hammer className="w-4 h-4 text-amber-700" />;
    if (t.includes('hvac') || t.includes('ac')) return <Wind className="w-4 h-4 text-cyan-600" />;
    if (t.includes('paint') || t.includes('pop')) return <Paintbrush className="w-4 h-4 text-indigo-600" />;
    if (t.includes('mechanic') || t.includes('auto')) return <Wrench className="w-4 h-4 text-slate-700" />;
    if (t.includes('weld') || t.includes('metal')) return <Shield className="w-4 h-4 text-slate-800" />;
    if (t.includes('tailor') || t.includes('fashion')) return <Scissors className="w-4 h-4 text-purple-600" />;
    if (t.includes('tile') || t.includes('marble')) return <Grid className="w-4 h-4 text-teal-600" />;
    return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
  };

  const handleVouch = async () => {
    if (isVouched || isVouching) return;
    setIsVouching(true);
    try {
      const updatedCount = await vouchForArtisan(recommendation.id);
      setVouches(updatedCount);
      setIsVouched(true);
      if (onVouchUpdated) onVouchUpdated(recommendation.id, updatedCount);
    } catch {
      // optimistic fallback
      setVouches((prev) => prev + 1);
      setIsVouched(true);
    } finally {
      setIsVouching(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/recommend#${recommendation.id}`;
    const shareText = `Check out this recommendation for ${recommendation.artisan_name} (${recommendation.trade_category}) in ${recommendation.town}, ${recommendation.state} on MatthOrg!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${recommendation.artisan_name} - Recommended on MatthOrg`,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // ignore
    }
  };

  // WhatsApp prefilled message
  const rawWhatsapp = (recommendation.whatsapp || recommendation.phone || '').replace(/[^0-9]/g, '');
  const cleanPhone = recommendation.phone.trim();
  const whatsappMsg = encodeURIComponent(
    `Hello ${recommendation.artisan_name},\n\nI saw your strong recommendation on MatthOrg for ${recommendation.trade_category} in ${recommendation.town}, ${recommendation.state}.\n\nI have a project and would like to discuss your availability and rates.`
  );
  const whatsappUrl = `https://wa.me/${rawWhatsapp}?text=${whatsappMsg}`;

  return (
    <article
      id={recommendation.id}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
    >
      <div className="p-5 sm:p-6 space-y-4">
        {/* Header: Trade kicker + Vouch count */}
        <div className="flex items-center justify-between gap-2 text-[14px] text-slate-600 font-medium">
          <div className="flex items-center gap-1.5 min-w-0">
            {getTradeIcon(recommendation.trade_category)}
            <span className="font-semibold text-slate-800 truncate">
              {recommendation.trade_category}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 text-slate-600 tabular-nums text-[13px]">
            <ThumbsUp className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-900">{vouches}</span>
            <span>{vouches === 1 ? 'vouch' : 'vouches'}</span>
          </div>
        </div>

        {/* Artisan Name & Location (Clean Unboxed Typography) */}
        <div>
          <h3 className="font-heading text-xl font-bold text-slate-900 tracking-tight leading-snug">
            {recommendation.artisan_name}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-slate-600 mt-1.5 font-medium">
            <span className="flex items-center gap-1 text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              {recommendation.town}, {recommendation.state}
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Community Verified
            </span>
            {recommendation.rating && (
              <>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="flex items-center gap-1 text-amber-700 font-semibold tabular-nums">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  {recommendation.rating}.0 Rating
                </span>
              </>
            )}
          </div>
        </div>

        {/* Services Offered (Clean bulleted list / subtle dividers, NO static pills) */}
        {recommendation.services_offered && recommendation.services_offered.length > 0 && (
          <div className="pt-2.5 border-t border-slate-100">
            <p className="text-[13px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">
              Services They Offer
            </p>
            <ul className="text-[14px] text-slate-700 space-y-1">
              {recommendation.services_offered.slice(0, 4).map((service, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">▪</span>
                  <span className="line-clamp-1">{service}</span>
                </li>
              ))}
              {recommendation.services_offered.length > 4 && (
                <li className="text-[13px] text-slate-500 pl-3 tabular-nums">
                  +{recommendation.services_offered.length - 4} more specialized services
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Recommender's Endorsement Quote Box */}
        <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100/90 space-y-2">
          <div className="flex items-center justify-between text-[13px] text-slate-600 font-medium">
            <span className="font-semibold text-slate-800">
              Recommended by {recommendation.recommender_name}
            </span>
            {recommendation.recommender_relationship && (
              <span className="text-slate-500">
                ({recommendation.recommender_relationship})
              </span>
            )}
          </div>

          {recommendation.work_done && (
            <p className="text-[14px] text-slate-600 italic">
              <span className="font-semibold text-slate-700 not-italic">Work Done: </span>
              "{recommendation.work_done}"
            </p>
          )}

          <p className="text-[15px] text-slate-800 leading-relaxed font-normal">
            "{recommendation.recommendation_note}"
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 sm:p-5 bg-slate-50/60 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Call button */}
          <a
            href={`tel:${cleanPhone}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-[14px] font-semibold whitespace-nowrap rounded-lg bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 hover:border-slate-400 transition-colors shadow-2xs"
            title={`Call ${recommendation.artisan_name}`}
          >
            <Phone className="w-4 h-4 text-[#0B192C]" />
            <span>Call</span>
          </a>

          {/* WhatsApp button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-[14px] font-semibold whitespace-nowrap rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs"
            title={`Chat on WhatsApp with ${recommendation.artisan_name}`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </a>

          {/* Request Quote button */}
          {onRequestQuote && (
            <button
              type="button"
              onClick={() =>
                onRequestQuote(
                  recommendation.artisan_name,
                  recommendation.trade_category,
                  `${recommendation.town}, ${recommendation.state}`
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[14px] font-semibold whitespace-nowrap rounded-lg bg-[#0B192C] hover:bg-[#1E3E62] text-white transition-colors shadow-2xs cursor-pointer"
              title="Request a customized proposal from this artisan"
            >
              <FileText className="w-4 h-4 text-cyan-300" />
              <span className="hidden sm:inline">Request</span> Quote
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Vouch button */}
          <button
            type="button"
            onClick={handleVouch}
            disabled={isVouched || isVouching}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-[14px] font-semibold whitespace-nowrap rounded-lg transition-colors cursor-pointer ${
              isVouched
                ? 'bg-[#0B192C]/10 text-[#0B192C] border border-[#0B192C]/20'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
            title={isVouched ? 'You have vouched for this artisan' : 'Vouch for this artisan'}
          >
            <ThumbsUp className={`w-4 h-4 ${isVouched ? 'fill-[#0B192C] text-[#0B192C]' : ''}`} />
            <span>{isVouched ? 'Vouched' : 'Vouch'}</span>
          </button>

          {/* Share button */}
          <button
            type="button"
            onClick={handleShare}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
            title="Share this recommendation"
            aria-label="Share recommendation"
          >
            {copiedLink ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
};
