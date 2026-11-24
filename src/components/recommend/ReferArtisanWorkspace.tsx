import React, { useState, useRef, useMemo } from 'react';
import {
  Contact,
  ClipboardPaste,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  Briefcase,
  User,
  Copy,
  Check,
  Sparkles,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { ArtisanRecommendation } from '../../types';
import {
  ARTISAN_TRADE_CATEGORIES,
  NIGERIAN_STATES,
  POPULAR_TOWNS_BY_STATE,
  buildArtisanOutreachMessage,
  saveArtisanRecommendation,
} from '../../data/recommendationsData';
import {
  AttachedContactReferral,
  createEmptyDraftReferral,
  isContactPickerSupported,
  normalizeWhatsAppDigits,
  parsePastedArtisanReferrals,
  parseVCardContacts,
  pickPhoneContacts,
} from '../../utils/contactReferralParser';

interface ReferArtisanWorkspaceProps {
  onReferralsPublished: (items: ArtisanRecommendation[]) => void;
  highlighted?: boolean;
}

export const ReferArtisanWorkspace: React.FC<ReferArtisanWorkspaceProps> = ({
  onReferralsPublished,
  highlighted = false,
}) => {
  const [rawPasteText, setRawPasteText] = useState('');
  const [drafts, setDrafts] = useState<AttachedContactReferral[]>([createEmptyDraftReferral()]);
  const [recommenderName, setRecommenderName] = useState('');
  const [statusNotice, setStatusNotice] = useState<{ type: 'info' | 'success' | 'error'; message: string } | null>(null);
  const [isPickingContacts, setIsPickingContacts] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedItems, setPublishedItems] = useState<ArtisanRecommendation[]>([]);
  const [copiedReferUrl, setCopiedReferUrl] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  const vcfInputRef = useRef<HTMLInputElement | null>(null);
  const contactPickerAvailable = useMemo(() => isContactPickerSupported(), []);

  const referShareUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/refer` : 'https://matthorg.com/refer';

  const mergeIncomingDrafts = (incoming: AttachedContactReferral[], successLabel: string) => {
    if (incoming.length === 0) return;

    setDrafts((prev) => {
      const hasOnlyBlankManual =
        prev.length === 1 &&
        prev[0].source === 'manual' &&
        !prev[0].artisanName.trim() &&
        !prev[0].phone.trim() &&
        !prev[0].town.trim();

      return hasOnlyBlankManual ? incoming : [...incoming, ...prev];
    });

    setPublishedItems([]);
    setStatusNotice({
      type: 'success',
      message: successLabel,
    });
  };

  const handleExtractFromText = (textOverride?: string) => {
    const sourceText = (textOverride ?? rawPasteText).trim();
    if (!sourceText) {
      setStatusNotice({
        type: 'error',
        message: 'Paste an artisan name, phone number, location, and profession first.',
      });
      return;
    }

    const parsed = parsePastedArtisanReferrals(sourceText);
    if (parsed.length === 0) {
      setStatusNotice({
        type: 'error',
        message: 'Could not extract contact details from the pasted text. Check the details and try again.',
      });
      return;
    }

    mergeIncomingDrafts(
      parsed,
      parsed.length === 1
        ? `Extracted ${parsed[0].artisanName || '1 artisan contact'} from pasted text. Review and publish below.`
        : `Extracted ${parsed.length} artisan contacts from pasted text. Review and publish below.`
    );
    setRawPasteText('');
  };

  const handlePasteFromClipboard = async () => {
    setStatusNotice(null);
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.readText !== 'function') {
        setStatusNotice({
          type: 'info',
          message: 'Use Ctrl+V or long-press inside the box to paste your contact details.',
        });
        return;
      }
      const clipText = await navigator.clipboard.readText();
      if (!clipText.trim()) {
        setStatusNotice({
          type: 'info',
          message: 'Your clipboard appears empty. Copy an artisan contact or message and try again.',
        });
        return;
      }
      setRawPasteText(clipText);
      handleExtractFromText(clipText);
    } catch {
      setStatusNotice({
        type: 'info',
        message: 'Browser clipboard permission was blocked. Paste directly into the text box below.',
      });
    }
  };

  const handleAccessPhoneContacts = async () => {
    setStatusNotice(null);
    if (!contactPickerAvailable) {
      setStatusNotice({
        type: 'info',
        message:
          'Direct Phone Contact Picker works on supported mobile browsers (e.g. Chrome on Android). On this browser, use "Attach .vcf Contact" or paste the contact directly.',
      });
      vcfInputRef.current?.click();
      return;
    }

    setIsPickingContacts(true);
    try {
      const picked = await pickPhoneContacts();
      if (picked.length === 0) {
        setStatusNotice({
          type: 'info',
          message: 'No phone contacts were selected.',
        });
        return;
      }
      mergeIncomingDrafts(
        picked,
        picked.length === 1
          ? `Attached ${picked[0].artisanName || '1 contact'} from your phone contacts. Add their profession and location if missing.`
          : `Attached ${picked.length} contacts from your phone contacts. Confirm profession and location below.`
      );
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setStatusNotice({
        type: 'error',
        message:
          'Could not open the phone contact picker here. Try "Attach .vcf Contact" or paste the contact details.',
      });
    } finally {
      setIsPickingContacts(false);
    }
  };

  const handleVcfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setStatusNotice(null);

    try {
      const allParsed: AttachedContactReferral[] = [];
      for (const file of Array.from(files)) {
        const content = await file.text();
        if (content.toUpperCase().includes('BEGIN:VCARD')) {
          allParsed.push(...parseVCardContacts(content));
        } else {
          allParsed.push(...parsePastedArtisanReferrals(content));
        }
      }

      if (allParsed.length === 0) {
        setStatusNotice({
          type: 'error',
          message: 'No readable contact entries were found in the selected file.',
        });
      } else {
        mergeIncomingDrafts(
          allParsed,
          `Attached ${allParsed.length} ${allParsed.length === 1 ? 'contact' : 'contacts'} from contact file.`
        );
      }
    } catch {
      setStatusNotice({
        type: 'error',
        message: 'Failed to read the contact file. Please paste the contact text instead.',
      });
    } finally {
      e.target.value = '';
    }
  };

  const updateDraft = (id: string, patch: Partial<AttachedContactReferral>) => {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const next = { ...d, ...patch };
        if (patch.phone !== undefined && (!d.whatsapp || d.whatsapp === d.phone)) {
          next.whatsapp = patch.phone;
        }
        return next;
      })
    );
  };

  const removeDraft = (id: string) => {
    setDrafts((prev) => {
      const filtered = prev.filter((d) => d.id !== id);
      return filtered.length > 0 ? filtered : [createEmptyDraftReferral()];
    });
  };

  const addBlankDraft = () => {
    setDrafts((prev) => [...prev, createEmptyDraftReferral()]);
  };

  const handlePublishReferrals = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusNotice(null);

    const nonEmptyDrafts = drafts.filter(
      (d) => d.artisanName.trim() || d.phone.trim() || d.town.trim() || d.note?.trim()
    );

    if (nonEmptyDrafts.length === 0) {
      setStatusNotice({
        type: 'error',
        message: 'Add or attach at least one artisan with their name, phone number, profession, and location.',
      });
      return;
    }

    for (let i = 0; i < nonEmptyDrafts.length; i++) {
      const item = nonEmptyDrafts[i];
      const label = item.artisanName.trim() || `Artisan #${i + 1}`;
      if (!item.artisanName.trim()) {
        setStatusNotice({ type: 'error', message: `Enter the name for ${label}.` });
        return;
      }
      if (!item.phone.trim()) {
        setStatusNotice({ type: 'error', message: `Enter a phone number for ${label}.` });
        return;
      }
      const resolvedTrade =
        item.tradeCategory === '__custom__' ? (item.customTrade || '').trim() : item.tradeCategory.trim();
      if (!resolvedTrade) {
        setStatusNotice({ type: 'error', message: `Specify the profession/trade for ${label}.` });
        return;
      }
      if (!item.state.trim() || !item.town.trim()) {
        setStatusNotice({ type: 'error', message: `Enter the town/area and state for ${label}.` });
        return;
      }
    }

    setIsPublishing(true);
    try {
      const savedList: ArtisanRecommendation[] = [];
      for (const item of nonEmptyDrafts) {
        const resolvedTrade =
          item.tradeCategory === '__custom__' ? (item.customTrade || '').trim() : item.tradeCategory.trim();
        const catMeta = ARTISAN_TRADE_CATEGORIES.find((c) => c.name === resolvedTrade);
        const servicesOffered = catMeta ? catMeta.popularServices.slice(0, 3) : [resolvedTrade];

        const created = await saveArtisanRecommendation({
          artisan_name: item.artisanName.trim(),
          trade_category: resolvedTrade,
          phone: item.phone.trim(),
          whatsapp: item.whatsapp.trim() || item.phone.trim(),
          email: item.email,
          state: item.state.trim(),
          town: item.town.trim(),
          services_offered: servicesOffered,
          level: 'experienced',
          recommender_name: recommenderName.trim() || 'Community Referral',
          recommender_relationship: 'Client Referral',
          work_done: `Referred for ${resolvedTrade} in ${item.town.trim()}, ${item.state.trim()}.`,
          recommendation_note:
            item.note?.trim() ||
            `Referred as a dependable ${resolvedTrade} serving ${item.town.trim()}, ${item.state.trim()}.`,
          rating: 5,
          pricing_tier: 'fair',
        });
        savedList.push(created);
      }

      onReferralsPublished(savedList);
      setPublishedItems(savedList);
      setDrafts([createEmptyDraftReferral()]);
      setRawPasteText('');
      setStatusNotice({
        type: 'success',
        message:
          savedList.length === 1
            ? `${savedList[0].artisan_name} has been added to MatthOrg Artisan Referrals.`
            : `${savedList.length} artisan referrals have been published to MatthOrg.`,
      });
    } catch (err: any) {
      setStatusNotice({
        type: 'error',
        message: err?.message || 'Unable to publish referral right now. Please try again.',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(referShareUrl);
      setCopiedReferUrl(true);
      setTimeout(() => setCopiedReferUrl(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopyInvite = async (rec: ArtisanRecommendation) => {
    const msg = buildArtisanOutreachMessage(rec, 'whatsapp');
    try {
      await navigator.clipboard.writeText(msg);
      setCopiedInviteId(rec.id);
      setTimeout(() => setCopiedInviteId(null), 2000);
    } catch {
      // ignore
    }
  };

  const sourceLabel = (source: AttachedContactReferral['source']) => {
    switch (source) {
      case 'phone_contacts':
        return 'Attached from Phone Contacts';
      case 'vcard':
        return 'Attached from Contact Card (.vcf)';
      case 'pasted':
        return 'Extracted from Pasted Text';
      default:
        return 'Manual Entry';
    }
  };

  return (
    <section
      id="refer-artisan-workspace"
      className={`bg-white rounded-2xl border ${
        highlighted ? 'border-[#0B192C]/35 shadow-lg' : 'border-slate-200 shadow-xs'
      } overflow-hidden`}
    >
      {/* Top Workspace Header */}
      <div className="px-5 sm:px-7 py-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[13px] font-bold text-[#1E3E62] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Quick Artisan Referral · /refer</span>
          </div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-[#0B192C] tracking-tight">
            Paste Contact Details or Attach from Your Phone
          </h2>
          <p className="text-[14px] sm:text-[15px] text-slate-600">
            Drop an artisan’s contact, location, and profession below — or pick directly from your phone contacts.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyShareLink}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[14px] font-semibold text-[#0B192C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {copiedReferUrl ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Copied /refer Link</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-500" />
              <span>Copy Refer Page Link</span>
            </>
          )}
        </button>
      </div>

      <div className="p-5 sm:p-7 space-y-6">
        {/* Step 1: Paste Box + Phone Contact Access */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Paste Contact, Location & Profession */}
          <div className="lg:col-span-7 bg-[#F4F7FB] rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="quick-paste-referral"
                className="text-[14px] font-bold text-[#0B192C] flex items-center gap-2"
              >
                <ClipboardPaste className="w-4 h-4 text-[#1E3E62] shrink-0" />
                <span>Paste Artisan Contact, Location & Profession</span>
              </label>

              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[13px] font-semibold text-[#0B192C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-[#1E3E62]" />
                <span>Paste Clipboard</span>
              </button>
            </div>

            <textarea
              id="quick-paste-referral"
              rows={3}
              value={rawPasteText}
              onChange={(e) => setRawPasteText(e.target.value)}
              onPaste={(e) => {
                const pasted = e.clipboardData?.getData('text');
                if (pasted && pasted.trim().length >= 10) {
                  setTimeout(() => handleExtractFromText(pasted), 40);
                }
              }}
              placeholder={
                'Example: Engr. Chinedu Okafor - 0803 456 7890 - Electrician in Lekki Phase 1, Lagos\nOr paste multiple lines / WhatsApp contact details.'
              }
              className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-[15px] text-[#0B192C] placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#0B192C]/20 focus:border-[#0B192C] resize-y"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[13px] text-slate-600">
                Auto-detects phone numbers, Nigerian towns/states, and trade profession.
              </p>
              <button
                type="button"
                onClick={() => handleExtractFromText()}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[14px] font-bold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Extract Details</span>
              </button>
            </div>
          </div>

          {/* Phone Contacts Attachment Panel */}
          <div className="lg:col-span-5 bg-[#F4F7FB] rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between gap-4">
            <div className="space-y-1.5">
              <div className="text-[14px] font-bold text-[#0B192C] flex items-center gap-2">
                <Contact className="w-4 h-4 text-[#1E3E62] shrink-0" />
                <span>Attach from Phone Contacts</span>
              </div>
              <p className="text-[14px] text-slate-600 leading-relaxed">
                Select one or more artisans straight from your phone address book, or attach shared{' '}
                <span className="font-semibold text-[#0B192C]">.vcf</span> contact cards from WhatsApp or iPhone/Android Contacts.
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleAccessPhoneContacts}
                disabled={isPickingContacts}
                className="w-full min-h-[44px] px-4 py-2.5 bg-[#0B192C] hover:bg-[#1E3E62] disabled:opacity-60 text-white text-[14px] font-bold rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <Contact className="w-4 h-4 shrink-0" />
                <span>{isPickingContacts ? 'Opening Phone Contacts...' : 'Pick from Phone Contacts'}</span>
              </button>

              <input
                ref={vcfInputRef}
                type="file"
                accept=".vcf,.vcard,text/vcard,text/x-vcard"
                multiple
                onChange={handleVcfUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => vcfInputRef.current?.click()}
                className="w-full min-h-[44px] px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-[#0B192C] text-[14px] font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#1E3E62] shrink-0" />
                <span>Attach .vcf Contact File</span>
              </button>

              <p className="text-[13px] text-slate-600">
                {contactPickerAvailable
                  ? 'Phone Contact Picker is ready on this device.'
                  : 'On iPhone or desktop browsers, export or share a contact as .vcf or paste it on the left.'}
              </p>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        {statusNotice && (
          <div
            role="status"
            className={`rounded-xl px-4 py-3 text-[14px] flex items-start gap-2.5 border ${
              statusNotice.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : statusNotice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            {statusNotice.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            ) : (
              <CheckCircle2
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  statusNotice.type === 'success' ? 'text-emerald-600' : 'text-[#1E3E62]'
                }`}
              />
            )}
            <span className="leading-relaxed font-medium">{statusNotice.message}</span>
          </div>
        )}

        {/* Recently Published Success Actions */}
        {publishedItems.length > 0 && (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[15px] font-bold text-[#0B192C]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Published {publishedItems.length}{' '}
                  {publishedItems.length === 1 ? 'Artisan Referral' : 'Artisan Referrals'}
                </span>
              </div>
              <span className="text-[13px] text-slate-600">Now visible on the community directory below</span>
            </div>

            <div className="divide-y divide-emerald-200/70 bg-white rounded-xl border border-emerald-200">
              {publishedItems.map((item) => {
                const waNumber = normalizeWhatsAppDigits(item.whatsapp || item.phone);
                const inviteMsg = buildArtisanOutreachMessage(item, 'whatsapp');
                const waUrl = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(inviteMsg)}` : '';
                return (
                  <div
                    key={item.id}
                    className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[14px]"
                  >
                    <div>
                      <p className="font-bold text-[#0B192C]">{item.artisan_name}</p>
                      <p className="text-slate-600 tabular-nums">
                        {item.trade_category} · {item.town}, {item.state} · {item.phone}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyInvite(item)}
                        className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#0B192C] text-[13px] font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                      >
                        {copiedInviteId === item.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copied Invite</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Invite</span>
                          </>
                        )}
                      </button>
                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold rounded-lg transition-colors whitespace-nowrap"
                        >
                          <span>Notify on WhatsApp</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Review & Edit Attached Contacts / Draft Referrals */}
        <form onSubmit={handlePublishReferrals} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-heading text-[18px] font-bold text-[#0B192C]">
                Attached Artisans to Refer ({drafts.length})
              </h3>
              <p className="text-[14px] text-slate-600">
                Confirm each artisan’s name, phone number, profession, and location before publishing.
              </p>
            </div>

            <button
              type="button"
              onClick={addBlankDraft}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#0B192C] text-[14px] font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Row</span>
            </button>
          </div>

          <div className="space-y-4">
            {drafts.map((draft, idx) => {
              const suggestedTowns = POPULAR_TOWNS_BY_STATE[draft.state] || [];
              const datalistId = `town-options-${draft.id}`;
              return (
                <div
                  key={draft.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4"
                >
                  <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-[14px] text-slate-600 font-medium">
                      <FileText className="w-4 h-4 text-[#1E3E62]" />
                      <span className="font-bold text-[#0B192C]">Artisan #{idx + 1}</span>
                      <span aria-hidden="true">·</span>
                      <span>{sourceLabel(draft.source)}</span>
                    </div>

                    {drafts.length > 1 || draft.artisanName || draft.phone ? (
                      <button
                        type="button"
                        onClick={() => removeDraft(draft.id)}
                        className="inline-flex items-center gap-1 text-[13px] font-medium text-slate-600 hover:text-rose-600 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* Artisan Name */}
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold text-slate-700 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>Artisan / Business Name *</span>
                      </label>
                      <input
                        type="text"
                        value={draft.artisanName}
                        onChange={(e) => updateDraft(draft.id, { artisanName: e.target.value })}
                        placeholder="e.g. Chinedu Okafor"
                        className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[15px] text-[#0B192C] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B192C]/20 focus:border-[#0B192C]"
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold text-slate-700 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>Phone / WhatsApp *</span>
                      </label>
                      <input
                        type="tel"
                        value={draft.phone}
                        onChange={(e) => updateDraft(draft.id, { phone: e.target.value })}
                        placeholder="e.g. 0803 456 7890"
                        className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[15px] text-[#0B192C] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B192C]/20 focus:border-[#0B192C]"
                      />
                    </div>

                    {/* Profession / Trade */}
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold text-slate-700 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                        <span>Profession / Trade *</span>
                      </label>
                      <select
                        value={draft.tradeCategory}
                        onChange={(e) => updateDraft(draft.id, { tradeCategory: e.target.value })}
                        className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[15px] text-[#0B192C] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B192C]/20 focus:border-[#0B192C]"
                      >
                        {ARTISAN_TRADE_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.shortLabel} — {cat.name}
                          </option>
                        ))}
                        <option value="__custom__">Other Profession (Specify)</option>
                      </select>
                      {draft.tradeCategory === '__custom__' && (
                        <input
                          type="text"
                          value={draft.customTrade || ''}
                          onChange={(e) => updateDraft(draft.id, { customTrade: e.target.value })}
                          placeholder="Type profession (e.g. CCTV Installer)"
                          className="w-full min-h-[40px] mt-1.5 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-[15px] text-[#0B192C] focus:outline-hidden focus:ring-2 focus:ring-[#0B192C]/20 focus:border-[#0B192C]"
                        />
                      )}
                    </div>

                    {/* Location: Town & State */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-semibold text-slate-700 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>Town / Area *</span>
                        </label>
                        <input
                          type="text"
                          list={datalistId}
                          value={draft.town}
                          onChange={(e) => updateDraft(draft.id, { town: e.target.value })}
                          placeholder="e.g. Lekki"
                          className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[15px] text-[#0B192C] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B192C]/20 focus:border-[#0B192C]"
                        />
                        {suggestedTowns.length > 0 && (
                          <datalist id={datalistId}>
                            {suggestedTowns.map((t) => (
                              <option key={t} value={t} />
                            ))}
                          </datalist>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[13px] font-semibold text-slate-700">State *</label>
                        <select
                          value={draft.state}
                          onChange={(e) => updateDraft(draft.id, { state: e.target.value })}
                          className="w-full min-h-[44px] px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[15px] text-[#0B192C] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B192C]/20 focus:border-[#0B192C]"
                        >
                          {NIGERIAN_STATES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Optional Quick Note */}
                  <div>
                    <input
                      type="text"
                      value={draft.note || ''}
                      onChange={(e) => updateDraft(draft.id, { note: e.target.value })}
                      placeholder="Optional note: what work did they do for you? (e.g. Installed our 10kVA solar inverter neatly)"
                      className="w-full min-h-[42px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[15px] text-[#0B192C] placeholder:text-slate-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B192C]/20 focus:border-[#0B192C]"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Submit Row */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-t border-slate-100">
            <div className="sm:max-w-xs w-full space-y-1.5">
              <label htmlFor="refer-by-name" className="text-[14px] font-semibold text-slate-700">
                Your Name (Optional)
              </label>
              <input
                id="refer-by-name"
                type="text"
                value={recommenderName}
                onChange={(e) => setRecommenderName(e.target.value)}
                placeholder="Defaults to Community Referral"
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[15px] text-[#0B192C] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B192C]/20 focus:border-[#0B192C]"
              />
            </div>

            <button
              type="submit"
              disabled={isPublishing}
              className="min-h-[44px] px-6 py-3 bg-[#0B192C] hover:bg-[#1E3E62] disabled:opacity-60 text-white text-[15px] font-bold rounded-xl transition-colors shadow-sm inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isPublishing
                  ? 'Publishing...'
                  : drafts.length > 1
                    ? `Publish ${drafts.length} Artisan Referrals`
                    : 'Publish Artisan Referral'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
