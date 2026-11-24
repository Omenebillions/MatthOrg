import React, { useEffect, useState } from 'react';
import {
  Check,
  ExternalLink,
  GitCompare,
  MapPin,
  MessageCircle,
  Package,
  Share2,
  ShieldCheck,
  Sparkles,
  Tag,
  X,
  Send,
  CheckCircle2,
  Phone,
  Eye,
} from 'lucide-react';
import type { CatalogProduct, ProductComparisonMatrix } from '../../types';
import { submitProductEnquiry, trackCommerceEvent } from '../../data/commerceData';

interface ProductRecommendationCardProps {
  product: CatalogProduct;
  isSponsored?: boolean;
  campaignId?: string;
  isSelectedForCompare?: boolean;
  onToggleCompare?: (product: CatalogProduct) => void;
  onViewDetails: (product: CatalogProduct, campaignId?: string) => void;
  onEnquire: (product: CatalogProduct, campaignId?: string) => void;
}

export const ProductRecommendationCard: React.FC<ProductRecommendationCardProps> = ({
  product,
  isSponsored = false,
  campaignId,
  isSelectedForCompare = false,
  onToggleCompare,
  onViewDetails,
  onEnquire,
}) => {
  const [imgError, setImgError] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const isExternal = product.listing_type === 'external_marketplace' || Boolean(product.product_url);
  const specEntries = Object.entries(product.specs || {}).slice(0, 3);

  const handleVisitSeller = () => {
    trackCommerceEvent({
      productId: product.id,
      campaignId,
      event: 'click',
    });
    if (product.product_url) {
      window.open(product.product_url, '_blank', 'noopener,noreferrer');
    } else {
      onViewDetails(product, campaignId);
    }
  };

  const handleShare = async () => {
    const shareText = `${product.name} — ${product.currency || '₦'}${product.price.toLocaleString()} (${product.seller_name})`;
    const shareUrl = product.product_url || window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text: shareText, url: shareUrl });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className={`rounded-2xl bg-white border transition-all duration-200 overflow-hidden flex flex-col ${
        isSponsored
          ? 'border-amber-300/90 shadow-sm'
          : isSelectedForCompare
            ? 'border-[#3D74D9] ring-2 ring-[#3D74D9]/15'
            : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
      }`}
    >
      {/* Product Image Header */}
      <div className="relative h-44 bg-[#F1F5F9] overflow-hidden border-b border-[#E2E8F0]">
        {product.image && !imgError ? (
          <img
            src={product.image}
            alt={product.name}
            loading="eager"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-contain bg-white p-1"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#94A3B8] p-4">
            <Package className="w-9 h-9 mb-1.5 text-[#94A3B8]" />
            <span className="text-[13px] font-medium text-center line-clamp-1">{product.category}</span>
          </div>
        )}

        {/* Explicit Sponsored Disclosure Label (required by advertising policy) */}
        {isSponsored && (
          <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-amber-400 text-[#0B192C] text-[13px] font-extrabold uppercase tracking-wider shadow-xs">
            Sponsored
          </div>
        )}

        {/* External marketplace identifier */}
        {isExternal && (
          <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-md bg-[#0B192C]/85 text-white text-[13px] font-semibold">
            {product.source_marketplace || 'External Listing'}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-2">
          {/* Brand · Model · Condition (Zero-pill clean metadata string) */}
          <div className="text-[13px] font-semibold text-[#5B6D85] flex flex-wrap items-center gap-x-1.5">
            <span>{[product.brand, product.model].filter(Boolean).join(' ') || product.category}</span>
            <span>·</span>
            <span>{product.condition || 'New'}</span>
            <span>·</span>
            <span className={product.availability === 'In Stock' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-semibold'}>
              {product.availability}
            </span>
          </div>

          <h4 className="font-heading text-lg font-bold text-[#0B192C] leading-snug line-clamp-2">
            {product.name}
          </h4>

          {/* Price */}
          <div className="pt-0.5 flex items-baseline justify-between gap-2">
            <span className="font-mono tabular-nums text-xl font-extrabold text-[#0B192C]">
              {product.price > 0
                ? `${product.currency || '₦'}${product.price.toLocaleString()}`
                : 'Price on enquiry'}
            </span>
            {product.unit && product.price > 0 && (
              <span className="text-[13px] text-[#64748B]">per {product.unit}</span>
            )}
          </div>

          {/* Key Specs (Max 3 concise rows) */}
          {specEntries.length > 0 ? (
            <dl className="pt-2 border-t border-[#F1F5F9] space-y-1 text-[14px]">
              {specEntries.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-2">
                  <dt className="text-[#64748B] truncate">{k}</dt>
                  <dd className="font-semibold text-[#0B192C] text-right truncate">{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-[14px] text-[#5B6D85] line-clamp-2 pt-0.5 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* Seller & Trust Metadata */}
        <div className="pt-3 border-t border-[#E2E8F0] space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-[13px] text-[#475569]">
            <div className="flex items-center gap-1.5 min-w-0">
              {product.seller_verified || product.verification_status === 'verified' ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <Tag className="w-4 h-4 text-[#64748B] shrink-0" />
              )}
              <span className="font-semibold text-[#0B192C] truncate">{product.seller_name}</span>
            </div>
            <div className="flex items-center gap-1 text-[#64748B] shrink-0">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate max-w-[120px]">{product.location || 'Nigeria'}</span>
            </div>
          </div>

          {(product.date_collected || product.last_verified_at) && (
            <div className="text-[13px] text-[#64748B] flex items-center justify-between">
              <span>Source: {product.source_marketplace}</span>
              <span>
                Verified {(product.last_verified_at || product.date_collected || '').split('T')[0]}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {isExternal && product.product_url ? (
              <button
                type="button"
                onClick={handleVisitSeller}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[14px] font-bold transition cursor-pointer whitespace-nowrap"
              >
                <span>Visit Seller</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onEnquire(product, campaignId)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[14px] font-bold transition cursor-pointer whitespace-nowrap"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Enquire</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onViewDetails(product, campaignId)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0B192C] text-[14px] font-bold transition cursor-pointer whitespace-nowrap"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Details</span>
            </button>

            {onToggleCompare && (
              <button
                type="button"
                onClick={() => onToggleCompare(product)}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-bold border transition cursor-pointer ${
                  isSelectedForCompare
                    ? 'bg-[#3D74D9] text-white border-[#3D74D9]'
                    : 'bg-white text-[#475569] border-[#E2E8F0] hover:border-[#0B192C]'
                }`}
              >
                {isSelectedForCompare ? <Check className="w-3.5 h-3.5" /> : <GitCompare className="w-3.5 h-3.5" />}
                <span>{isSelectedForCompare ? 'Comparing' : 'Compare'}</span>
              </button>
            )}

            {isExternal && product.product_url ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onEnquire(product, campaignId)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[13px] font-bold transition cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Enquire</span>
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  title="Share listing"
                  className="p-2 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#0B192C] text-[#475569] transition cursor-pointer"
                >
                  {copiedShare ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#0B192C] text-[#475569] text-[13px] font-bold transition cursor-pointer"
              >
                {copiedShare ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedShare ? 'Copied' : 'Share'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ProductComparisonCardProps {
  comparison: ProductComparisonMatrix;
  onVisitSeller: (product: CatalogProduct) => void;
  onEnquire: (product: CatalogProduct) => void;
}

export const ProductComparisonCard: React.FC<ProductComparisonCardProps> = ({
  comparison,
  onVisitSeller,
  onEnquire,
}) => {
  return (
    <div className="rounded-2xl bg-white border border-[#E2E8F0] overflow-hidden shadow-xs">
      <div className="px-4 py-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="font-heading text-lg font-extrabold text-[#0B192C] flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-[#3D74D9]" />
            <span>{comparison.title}</span>
          </h4>
          <p className="text-[14px] text-[#5B6D85] mt-0.5">{comparison.relationshipNote}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-[14px] sm:text-[15px]">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-white">
              <th className="p-3.5 font-bold text-[#5B6D85] w-36 align-top">Attribute</th>
              {comparison.products.map((prod) => (
                <th key={prod.id} className="p-3.5 min-w-[190px] align-top border-l border-[#F1F5F9]">
                  <div className="font-heading font-bold text-[#0B192C] line-clamp-2 leading-snug">{prod.name}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {prod.product_url ? (
                      <button
                        type="button"
                        onClick={() => onVisitSeller(prod)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B192C] text-white text-[13px] font-bold hover:bg-[#1E3E62] cursor-pointer whitespace-nowrap"
                      >
                        <span>Visit Seller</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onEnquire(prod)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B192C] text-white text-[13px] font-bold hover:bg-[#1E3E62] cursor-pointer whitespace-nowrap"
                      >
                        <span>Enquire</span>
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparison.dimensions.map((dim) => (
              <tr key={dim.label} className="border-b border-[#F1F5F9] last:border-b-0">
                <td className="p-3.5 font-semibold text-[#475569] bg-[#F8FAFC]/60">{dim.label}</td>
                {dim.values.map((val) => (
                  <td
                    key={val.productId}
                    className={`p-3.5 border-l border-[#F1F5F9] text-[#0B192C] ${
                      dim.label === 'Price' ? 'font-mono font-extrabold tabular-nums' : 'font-medium'
                    }`}
                  >
                    {val.value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] text-[14px] sm:text-[15px] text-[#334155] leading-relaxed">
        <strong className="text-[#0B192C]">Matthew AI Comparison Summary:</strong> {comparison.recommendationSummary}
      </div>
    </div>
  );
};

interface ProductDetailModalProps {
  product: CatalogProduct | null;
  campaignId?: string;
  onClose: () => void;
  onEnquire: (product: CatalogProduct, campaignId?: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  campaignId,
  onClose,
  onEnquire,
}) => {
  useEffect(() => {
    if (!product) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [product, onClose]);

  if (!product) return null;
  const specEntries = Object.entries(product.specs || {});

  const handleOpenExternal = () => {
    trackCommerceEvent({ productId: product.id, campaignId, event: 'click' });
    if (product.product_url) {
      window.open(product.product_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white border border-[#E2E8F0] shadow-2xl overflow-hidden">
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 px-5 py-4 bg-white border-b border-[#E2E8F0] shrink-0">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-[#5B6D85]">
              {product.category} · {product.condition} · {product.source_marketplace}
            </div>
            <h3 className="font-heading text-xl font-extrabold text-[#0B192C] truncate">{product.name}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0B192C] text-[14px] font-bold transition cursor-pointer shrink-0 whitespace-nowrap"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
        </div>
        <div className="overflow-y-auto flex-1">

        <div className="p-5 space-y-5">
          {product.image && (
            <div className="h-64 rounded-2xl bg-[#F1F5F9] overflow-hidden border border-[#E2E8F0]">
              <img
                src={product.image}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain bg-white"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div>
              <div className="text-[13px] font-semibold text-[#64748B]">Listed Price</div>
              <div className="font-mono tabular-nums text-2xl sm:text-3xl font-extrabold text-[#0B192C]">
                {product.price > 0
                  ? `${product.currency || '₦'}${product.price.toLocaleString()}`
                  : 'Contact Seller for Quote'}
              </div>
            </div>
            <div className="text-right text-[14px]">
              <div className="font-bold text-[#0B192C]">{product.seller_name}</div>
              <div className="text-[#5B6D85] flex items-center justify-end gap-1 mt-0.5">
                <MapPin className="w-4 h-4" />
                <span>{product.location}</span>
              </div>
            </div>
          </div>

          {product.description && (
            <div>
              <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Description</h4>
              <p className="text-[15px] sm:text-base text-[#334155] leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>
          )}

          {specEntries.length > 0 && (
            <div>
              <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#64748B] mb-2">Specifications</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {specEntries.map(([k, v]) => (
                  <div key={k} className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-2 text-[14px]">
                    <span className="text-[#64748B]">{k}</span>
                    <span className="font-bold text-[#0B192C]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[14px]">
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-[#64748B] text-[13px]">Brand / Model</div>
              <div className="font-bold text-[#0B192C] mt-0.5">
                {[product.brand, product.model].filter(Boolean).join(' ') || 'Standard'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-[#64748B] text-[13px]">Availability</div>
              <div className="font-bold text-emerald-700 mt-0.5">{product.availability}</div>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-[#64748B] text-[13px]">Warranty</div>
              <div className="font-bold text-[#0B192C] mt-0.5">{product.warranty || 'Confirm with seller'}</div>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-[#64748B] text-[13px]">Last Verified</div>
              <div className="font-bold text-[#0B192C] mt-0.5">
                {(product.last_verified_at || product.date_collected || 'Recent').split('T')[0]}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E2E8F0] flex flex-wrap items-center justify-end gap-2.5">
            {product.seller_phone && (
              <a
                href={`tel:${product.seller_phone}`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0B192C] text-[15px] font-bold transition whitespace-nowrap"
              >
                <Phone className="w-4 h-4" />
                <span>Call Seller</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => {
                onClose();
                onEnquire(product, campaignId);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[15px] font-bold transition cursor-pointer whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send Enquiry</span>
            </button>
            {product.product_url && (
              <button
                type="button"
                onClick={handleOpenExternal}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[15px] font-bold transition cursor-pointer whitespace-nowrap"
              >
                <span>Open on {product.source_marketplace}</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

interface ProductEnquiryModalProps {
  product: CatalogProduct | null;
  campaignId?: string;
  onClose: () => void;
}

export const ProductEnquiryModal: React.FC<ProductEnquiryModalProps> = ({
  product,
  campaignId,
  onClose,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerLocation, setCustomerLocation] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!product) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [product, onClose]);

  if (!product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Please enter your name and phone/WhatsApp number.');
      return;
    }
    setIsSubmitting(true);
    try {
      await submitProductEnquiry({
        product_id: product.id,
        product_name: product.name,
        listing_type: product.listing_type,
        business_id: product.business_id,
        seller_name: product.seller_name,
        seller_phone: product.seller_phone,
        product_url: product.product_url,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_whatsapp: customerPhone.trim(),
        customer_location: customerLocation.trim() || 'Nigeria',
        message: message.trim() || `Interested in purchasing ${quantity}x ${product.name}`,
        quantity,
        campaign_id: campaignId,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit enquiry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sellerWa = (product.seller_whatsapp || product.seller_phone || '').replace(/\D/g, '');
  const waHref = sellerWa
    ? `https://wa.me/${sellerWa.startsWith('0') ? '234' + sellerWa.slice(1) : sellerWa}?text=${encodeURIComponent(
        `Hello ${product.seller_name}, I found "${product.name}" on MatthOrg and would like to enquire about purchasing ${quantity} unit(s).`
      )}`
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl bg-white border border-[#E2E8F0] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-6 py-4 bg-white border-b border-[#E2E8F0] shrink-0">
          <div className="min-w-0">
            <h3 className="font-heading text-xl font-extrabold text-[#0B192C]">Enquire About Product</h3>
            <p className="text-[14px] text-[#5B6D85] line-clamp-1">{product.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0B192C] text-[14px] font-bold transition cursor-pointer shrink-0 whitespace-nowrap"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">

        {submitted ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-heading text-lg font-bold text-[#0B192C]">Enquiry Sent!</h4>
              <p className="text-[15px] text-[#5B6D85] mt-1">
                Your enquiry for <strong>{product.name}</strong> has been logged for <strong>{product.seller_name}</strong>.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 pt-2">
              {waHref && (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[15px] font-bold"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Continue Directly on WhatsApp</span>
                </a>
              )}
              {product.product_url && (
                <a
                  href={product.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[15px] font-bold"
                >
                  <span>Open Listing on {product.source_marketplace}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-[15px] font-semibold text-[#5B6D85] hover:text-[#0B192C]"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[14px]">
                {error}
              </div>
            )}
            <div>
              <label className="block text-[14px] font-semibold text-[#475569] mb-1">Your Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Chinedu Okafor"
                className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C] focus:border-[#0B192C] focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[14px] font-semibold text-[#475569] mb-1">Phone / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0801 234 5678"
                  className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C] focus:border-[#0B192C] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-[#475569] mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C] font-mono focus:border-[#0B192C] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-[14px] font-semibold text-[#475569] mb-1">Delivery / Location</label>
              <input
                type="text"
                value={customerLocation}
                onChange={(e) => setCustomerLocation(e.target.value)}
                placeholder="e.g. Ikeja, Lagos"
                className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C] focus:border-[#0B192C] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[14px] font-semibold text-[#475569] mb-1">Message to Seller</label>
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about availability, final price, warranty, or delivery timeline..."
                className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-[15px] text-[#0B192C] focus:border-[#0B192C] focus:outline-none"
              />
            </div>
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-[15px] font-semibold text-[#5B6D85] hover:text-[#0B192C]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[15px] font-bold transition cursor-pointer disabled:opacity-60 whitespace-nowrap"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Sending...' : 'Send Enquiry'}</span>
              </button>
            </div>
          </form>
        )}
        </div>
      </div>
    </div>
  );
};
