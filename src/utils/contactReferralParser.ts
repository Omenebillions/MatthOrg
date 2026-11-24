import {
  ARTISAN_TRADE_CATEGORIES,
  NIGERIAN_STATES,
  POPULAR_TOWNS_BY_STATE,
} from '../data/recommendationsData';

export type ReferralSource = 'phone_contacts' | 'vcard' | 'pasted' | 'manual';

export interface AttachedContactReferral {
  id: string;
  artisanName: string;
  phone: string;
  whatsapp: string;
  email?: string;
  tradeCategory: string;
  customTrade?: string;
  state: string;
  town: string;
  note?: string;
  source: ReferralSource;
  rawText?: string;
}

const TRADE_KEYWORD_RULES: Array<{ categoryName: string; keywords: string[] }> = [
  {
    categoryName: 'Solar Engineers & Inverter Specialists',
    keywords: ['solar', 'inverter', 'lithium', 'lifepo4', 'felicity', 'pylontech', 'panel', 'charge controller'],
  },
  {
    categoryName: 'Electricians & Wiring Technicians',
    keywords: ['electrician', 'electrical', 'wiring', 'rewire', 'conduit', 'distribution board', 'changeover', 'sparky'],
  },
  {
    categoryName: 'Plumbers & Fluid Technicians',
    keywords: ['plumber', 'plumbing', 'borehole', 'ppr', 'piping', 'pipe', 'drainage', 'soakaway', 'water heater', 'sanitary'],
  },
  {
    categoryName: 'AC Technicians & HVAC Engineers',
    keywords: ['ac ', 'a/c', 'air condition', 'hvac', 'refrigerator', 'fridge', 'freezer', 'chiller', 'compressor', 'cooling'],
  },
  {
    categoryName: 'Carpenters & Furniture Artisans',
    keywords: ['carpenter', 'carpentry', 'furniture', 'cabinet', 'wardrobe', 'closet', 'woodwork', 'joinery', 'upholstery', 'sofa'],
  },
  {
    categoryName: 'Painters, Screeders & POP Artisans',
    keywords: ['painter', 'painting', 'screeder', 'screeding', 'pop', 'ceiling', 'wallpaper', 'epoxy', 'stucco'],
  },
  {
    categoryName: 'Auto Mechanics & Auto Electricians',
    keywords: ['mechanic', 'auto', 'rewirer', 'diagnostics', 'gearbox', 'brake', 'engine', 'panel beater', 'vulcanizer'],
  },
  {
    categoryName: 'Welders & Metal Fabricators',
    keywords: ['welder', 'welding', 'fabricator', 'iron bender', 'metal', 'iron gate', 'burglar proof', 'railing', 'steel'],
  },
  {
    categoryName: 'Fashion Designers & Bespoke Tailors',
    keywords: ['tailor', 'tailoring', 'fashion', 'seamstress', 'agbada', 'kaftan', 'senator', 'aso ebi', 'sewing'],
  },
  {
    categoryName: 'Tilers & Marble Specialists',
    keywords: ['tiler', 'tiling', 'tiles', 'marble', 'granite', 'interlock', 'paving', 'mosaic'],
  },
  {
    categoryName: 'Private Chefs & Event Caterers',
    keywords: ['chef', 'caterer', 'catering', 'cook', 'small chops', 'buffet', 'kitchen'],
  },
  {
    categoryName: 'Bakers & Custom Pastry Artists',
    keywords: ['baker', 'bakery', 'cake', 'pastry', 'pastries', 'confection', 'bread'],
  },
];

const CUSTOM_PROFESSION_KEYWORDS = [
  'cctv',
  'generator',
  'gen repair',
  'bricklayer',
  'mason',
  'aluminum',
  'aluminium',
  'glazier',
  'roofer',
  'roofing',
  'cleaner',
  'cleaning',
  'laundry',
  'fumigation',
  'pest control',
  'dispatch',
  'mover',
  'glass',
  'interior designer',
  'scaffolder',
  'borehole driller',
  'landscaper',
  'gardener',
  'photographer',
  'videographer',
  'makeup artist',
  'barber',
  'hair stylist',
  'phone repair',
  'laptop repair',
  'tv repair',
];

const STATE_ALIASES: Array<{ match: RegExp; state: string; defaultTown?: string }> = [
  { match: /\b(abuja|fct|federal capital)\b/i, state: 'Abuja (FCT)' },
  { match: /\blagos\b/i, state: 'Lagos' },
  { match: /\b(rivers|port\s*harcourt|\bphc?\b)\b/i, state: 'Rivers', defaultTown: 'Port Harcourt' },
  { match: /\b(oyo|ibadan)\b/i, state: 'Oyo', defaultTown: 'Ibadan' },
  { match: /\b(edo|benin\s*city|\bbinin\b)\b/i, state: 'Edo', defaultTown: 'Benin City' },
  { match: /\b(delta|warri|asaba|effurun|ughelli)\b/i, state: 'Delta' },
  { match: /\b(ogun|abeokuta|arepo|mowe|magboro|ibafo|sagamu|ota|sango)\b/i, state: 'Ogun' },
  { match: /\bkano\b/i, state: 'Kano' },
  { match: /\benugu\b/i, state: 'Enugu' },
  { match: /\b(anambra|awka|onitsha|nnewi)\b/i, state: 'Anambra' },
  { match: /\bkaduna\b/i, state: 'Kaduna' },
  { match: /\b(akwa\s*ibom|uyo|eket)\b/i, state: 'Akwa Ibom', defaultTown: 'Uyo' },
  { match: /\b(ondo|akure)\b/i, state: 'Ondo', defaultTown: 'Akure' },
  { match: /\b(osun|osogbo|ife)\b/i, state: 'Osun', defaultTown: 'Osogbo' },
  { match: /\b(kwara|ilorin)\b/i, state: 'Kwara', defaultTown: 'Ilorin' },
  { match: /\b(plateau|jos)\b/i, state: 'Plateau', defaultTown: 'Jos' },
  { match: /\b(imo|owerri)\b/i, state: 'Imo', defaultTown: 'Owerri' },
  { match: /\b(abia|aba|umuahia)\b/i, state: 'Abia' },
  { match: /\b(bayelsa|yenagoa)\b/i, state: 'Bayelsa', defaultTown: 'Yenagoa' },
  { match: /\b(cross\s*river|calabar)\b/i, state: 'Cross River', defaultTown: 'Calabar' },
];

const EXTRA_KNOWN_TOWNS: Array<{ town: string; state: string; aliases?: string[] }> = [
  { town: 'Lekki Phase 1', state: 'Lagos', aliases: ['lekki', 'lekki phase 1', 'lekki phase one', 'chevron', 'ikate'] },
  { town: 'Victoria Island', state: 'Lagos', aliases: ['victoria island', 'vi'] },
  { town: 'Ikoyi', state: 'Lagos' },
  { town: 'Ajah', state: 'Lagos', aliases: ['ajah', 'sangotedo', 'badore'] },
  { town: 'Ikeja', state: 'Lagos', aliases: ['ikeja', 'ikeja gra', 'allen', 'opebi'] },
  { town: 'Yaba', state: 'Lagos' },
  { town: 'Surulere', state: 'Lagos' },
  { town: 'Maryland', state: 'Lagos' },
  { town: 'Magodo', state: 'Lagos' },
  { town: 'Gbagada', state: 'Lagos' },
  { town: 'Festac', state: 'Lagos', aliases: ['festac', 'amuwo'] },
  { town: 'Ikorodu', state: 'Lagos' },
  { town: 'Ojodu Berger', state: 'Lagos', aliases: ['ojodu', 'berger'] },
  { town: 'Ogba', state: 'Lagos' },
  { town: 'Isolo', state: 'Lagos', aliases: ['isolo', 'okota'] },
  { town: 'Agege', state: 'Lagos' },
  { town: 'Apapa', state: 'Lagos' },
  { town: 'Egbeda', state: 'Lagos' },
  { town: 'Maitama', state: 'Abuja (FCT)' },
  { town: 'Wuse 2', state: 'Abuja (FCT)', aliases: ['wuse 2', 'wuse ii', 'wuse'] },
  { town: 'Garki', state: 'Abuja (FCT)' },
  { town: 'Asokoro', state: 'Abuja (FCT)' },
  { town: 'Gwarinpa', state: 'Abuja (FCT)' },
  { town: 'Utako', state: 'Abuja (FCT)' },
  { town: 'Jabi', state: 'Abuja (FCT)' },
  { town: 'Lugbe', state: 'Abuja (FCT)' },
  { town: 'Kubwa', state: 'Abuja (FCT)' },
  { town: 'Life Camp', state: 'Abuja (FCT)' },
  { town: 'Lokogoma', state: 'Abuja (FCT)' },
  { town: 'Apo', state: 'Abuja (FCT)' },
  { town: 'Port Harcourt', state: 'Rivers', aliases: ['port harcourt', 'portharcourt', 'old gra', 'new gra', 'trans amadi', 'peter odili', 'woji', 'ada george', 'rumuokwuta'] },
  { town: 'Ibadan', state: 'Oyo', aliases: ['ibadan', 'bodija', 'oluyole', 'ring road', 'akobo', 'samonda', 'jericho'] },
  { town: 'Benin City', state: 'Edo', aliases: ['benin city', 'benin', 'uselu', 'ikpoba'] },
  { town: 'Asaba', state: 'Delta' },
  { town: 'Warri', state: 'Delta', aliases: ['warri', 'effurun'] },
  { town: 'Abeokuta', state: 'Ogun' },
  { town: 'Arepo', state: 'Ogun' },
  { town: 'Mowe', state: 'Ogun' },
  { town: 'Magboro', state: 'Ogun' },
  { town: 'Owerri', state: 'Imo' },
  { town: 'Uyo', state: 'Akwa Ibom' },
  { town: 'Awka', state: 'Anambra' },
  { town: 'Onitsha', state: 'Anambra' },
  { town: 'Nnewi', state: 'Anambra' },
  { town: 'Aba', state: 'Abia' },
  { town: 'Umuahia', state: 'Abia' },
  { town: 'Calabar', state: 'Cross River' },
  { town: 'Ilorin', state: 'Kwara' },
  { town: 'Akure', state: 'Ondo' },
  { town: 'Jos', state: 'Plateau' },
];

function createDraftId(): string {
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function normalizePhoneDisplay(raw: string): string {
  const cleaned = raw.replace(/[^\d+]/g, '');
  if (!cleaned) return raw.trim();
  if (cleaned.startsWith('234') && cleaned.length === 13) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return cleaned;
  }
  return raw.trim().replace(/\s+/g, ' ');
}

export function normalizeWhatsAppDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0') && digits.length === 11) {
    return `234${digits.slice(1)}`;
  }
  if (digits.startsWith('234')) {
    return digits;
  }
  return digits;
}

export function detectTradeAndCustom(text: string): { tradeCategory: string; customTrade?: string } {
  const lower = ` ${text.toLowerCase()} `;

  for (const rule of TRADE_KEYWORD_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return { tradeCategory: rule.categoryName };
    }
  }

  for (const cat of ARTISAN_TRADE_CATEGORIES) {
    if (
      lower.includes(cat.shortLabel.toLowerCase()) ||
      lower.includes(cat.id.toLowerCase())
    ) {
      return { tradeCategory: cat.name };
    }
  }

  for (const kw of CUSTOM_PROFESSION_KEYWORDS) {
    if (lower.includes(kw)) {
      const titleCased = kw.replace(/\b\w/g, (c) => c.toUpperCase());
      return { tradeCategory: '__custom__', customTrade: titleCased };
    }
  }

  const profLabelMatch = text.match(/(?:profession|trade|job|skill|work|role|service)\s*[:=-]\s*([^\n,|;]+)/i);
  if (profLabelMatch?.[1]) {
    const labelVal = profLabelMatch[1].trim();
    for (const rule of TRADE_KEYWORD_RULES) {
      if (rule.keywords.some((kw) => labelVal.toLowerCase().includes(kw.trim()))) {
        return { tradeCategory: rule.categoryName };
      }
    }
    if (labelVal.length >= 2) {
      return { tradeCategory: '__custom__', customTrade: labelVal };
    }
  }

  return { tradeCategory: ARTISAN_TRADE_CATEGORIES[0].name };
}

export function detectLocation(text: string): { state: string; town: string } {
  let detectedState = '';
  let detectedTown = '';

  // 1. Explicit Location/Address label if available
  const locLabelMatch = text.match(/(?:location|address|area|town|city|based in|from)\s*[:=-]\s*([^\n;|]+)/i);
  const searchArea = locLabelMatch?.[1] ? `${locLabelMatch[1]} ${text}` : text;

  // 2. Match known towns first (they imply the state accurately)
  const lowerArea = searchArea.toLowerCase();
  for (const entry of EXTRA_KNOWN_TOWNS) {
    const terms = entry.aliases || [entry.town.toLowerCase()];
    for (const term of terms) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(lowerArea)) {
        detectedTown = entry.town;
        detectedState = entry.state;
        break;
      }
    }
    if (detectedTown) break;
  }

  // 3. Match POPULAR_TOWNS_BY_STATE if still empty
  if (!detectedTown) {
    for (const [stateName, towns] of Object.entries(POPULAR_TOWNS_BY_STATE)) {
      for (const town of towns) {
        const core = town.split('(')[0].trim();
        const escaped = core.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (core.length >= 3 && new RegExp(`\\b${escaped}\\b`, 'i').test(lowerArea)) {
          detectedTown = town;
          detectedState = stateName;
          break;
        }
      }
      if (detectedTown) break;
    }
  }

  // 4. Match state aliases
  if (!detectedState) {
    for (const alias of STATE_ALIASES) {
      if (alias.match.test(searchArea)) {
        detectedState = alias.state;
        if (!detectedTown && alias.defaultTown) {
          detectedTown = alias.defaultTown;
        }
        break;
      }
    }
  }

  // 5. Fallback direct Nigerian state names
  if (!detectedState) {
    for (const st of NIGERIAN_STATES) {
      const core = st.split('(')[0].trim();
      if (core.length >= 3 && new RegExp(`\\b${core}\\b`, 'i').test(searchArea)) {
        detectedState = st;
        break;
      }
    }
  }

  // 6. If explicit location label existed and town wasn't extracted, grab clean label snippet
  if (!detectedTown && locLabelMatch?.[1]) {
    const rawLoc = locLabelMatch[1]
      .replace(/\b(nigeria|state)\b/gi, '')
      .replace(/[,]+$/g, '')
      .trim();
    if (rawLoc && rawLoc.toLowerCase() !== detectedState.toLowerCase()) {
      detectedTown = rawLoc.split(',')[0].trim();
    }
  }

  // 7. Try "in/around/at <Place>" phrase if town is still empty
  if (!detectedTown) {
    const prepMatch = text.match(/\b(?:in|at|around|near)\s+([A-Z][a-zA-Z0-9\s]{2,26})(?:,|\s*-|\s*\||\n|$)/);
    if (prepMatch?.[1]) {
      const candidate = prepMatch[1].trim();
      if (candidate.toLowerCase() !== detectedState.toLowerCase()) {
        detectedTown = candidate;
      }
    }
  }

  return {
    state: detectedState || 'Lagos',
    town: detectedTown,
  };
}

function extractPhonesFromText(text: string): string[] {
  const results: string[] = [];
  const seenDigits = new Set<string>();

  // Match wa.me links too
  const waMatches = text.matchAll(/wa\.me\/(\d{10,15})/gi);
  for (const m of waMatches) {
    const normalized = normalizePhoneDisplay(`+${m[1]}`);
    const digits = normalized.replace(/\D/g, '');
    if (!seenDigits.has(digits)) {
      seenDigits.add(digits);
      results.push(normalized);
    }
  }

  // Match Nigerian or general international phone numbers
  const phoneRegex = /(?:\+?234[\s.-]?\(?\d{1,3}\)?[\s.-]?\d{3}[\s.-]?\d{3,4}[\s.-]?\d{0,4}|0(?:70|80|81|90|91|71|89)\d(?:[\s.-]?\d){7,8}|\+\d{1,3}[\s.-]?(?:\(?\d{1,4}\)?[\s.-]?){2,4}\d{2,4})/g;
  const matches = text.match(phoneRegex) || [];
  for (const raw of matches) {
    const digits = raw.replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 15 && !seenDigits.has(digits)) {
      seenDigits.add(digits);
      results.push(normalizePhoneDisplay(raw));
    }
  }

  return results;
}

function extractNameFromBlock(
  block: string,
  phones: string[],
  email: string | undefined,
  town: string,
  state: string,
  tradeCategory: string,
  customTrade?: string
): string {
  const labeledMatch = block.match(/(?:^|\n)\s*(?:name|artisan|contact|business|person)\s*[:=-]\s*([^\n,|;]+)/im);
  if (labeledMatch?.[1]) {
    return labeledMatch[1].trim();
  }

  let cleaned = block;
  // Remove URLs and emails
  cleaned = cleaned.replace(/https?:\/\/\S+/gi, ' ');
  if (email) cleaned = cleaned.replace(email, ' ');
  for (const p of phones) {
    const digits = p.replace(/\D/g, '');
    if (digits.length >= 8) {
      // Remove phone strings roughly matching
      const flexRegex = new RegExp(`\\+?${digits.split('').join('[\\s.-]*')}`, 'g');
      cleaned = cleaned.replace(flexRegex, ' ');
    }
    cleaned = cleaned.replace(p, ' ');
  }
  // Remove any leftover long digit runs
  cleaned = cleaned.replace(/(?:\+?\d[\s.-]?){9,15}/g, ' ');

  // Remove explicit field labels like "Location: ..." or "Profession: ..."
  cleaned = cleaned.replace(/(?:location|address|area|town|city|profession|trade|job|skill|service|phone|tel|whatsapp|mobile|email|note)\s*[:=-]\s*[^\n]*/gi, ' ');

  // Remove known town & state mentions and common prepositions around them
  if (town) {
    const escTown = town.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(`\\b(?:in|at|around|near|from)?\\s*${escTown}\\b`, 'gi'), ' ');
  }
  if (state) {
    const coreState = state.split('(')[0].trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(`\\b(?:in|at|around|near|from)?\\s*${coreState}(?:\\s*state)?\\b`, 'gi'), ' ');
  }

  // Remove trade words so what remains is likely the person's name
  const allTradeWords = [
    ...TRADE_KEYWORD_RULES.flatMap((r) => r.keywords),
    ...CUSTOM_PROFESSION_KEYWORDS,
    customTrade || '',
    tradeCategory.split('&')[0],
  ].filter((w) => w && w.trim().length > 2);

  for (const kw of allTradeWords) {
    const escKw = kw.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(`\\b${escKw}s?\\b`, 'gi'), ' ');
  }

  // Pick first meaningful segment split by delimiters or newlines
  const segments = cleaned
    .split(/[\n|—–\-•/]+/)
    .map((s) => s.replace(/^[,.:;\s]+|[,.:;\s]+$/g, '').trim())
    .filter((s) => s.length >= 2 && /[a-zA-Z]{2,}/.test(s));

  if (segments.length > 0) {
    return segments[0].replace(/\s{2,}/g, ' ').slice(0, 70);
  }

  return '';
}

function parseSingleReferralBlock(block: string, source: ReferralSource = 'pasted'): AttachedContactReferral {
  const phones = extractPhonesFromText(block);
  const emailMatch = block.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const email = emailMatch?.[0];
  const { tradeCategory, customTrade } = detectTradeAndCustom(block);
  const { state, town } = detectLocation(block);
  const primaryPhone = phones[0] || '';
  const artisanName = extractNameFromBlock(block, phones, email, town, state, tradeCategory, customTrade);

  const noteMatch = block.match(/(?:note|work|review|comment|details)\s*[:=-]\s*([^\n]+)/i);

  return {
    id: createDraftId(),
    artisanName,
    phone: primaryPhone,
    whatsapp: phones[1] || primaryPhone,
    email,
    tradeCategory,
    customTrade,
    state,
    town,
    note: noteMatch?.[1]?.trim() || '',
    source,
    rawText: block.trim(),
  };
}

/**
 * Parses pasted raw text (single artisan or multiple lines/cards) into structured referral drafts.
 */
export function parsePastedArtisanReferrals(rawText: string): AttachedContactReferral[] {
  const trimmed = rawText.trim();
  if (!trimmed) return [];

  // Check if multiple distinct contacts were pasted (multiple non-empty blocks or lines each with a phone number)
  const doubleNewlineBlocks = trimmed
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (doubleNewlineBlocks.length > 1 && doubleNewlineBlocks.every((b) => extractPhonesFromText(b).length >= 1)) {
    return doubleNewlineBlocks.map((block) => parseSingleReferralBlock(block, 'pasted'));
  }

  const lines = trimmed
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // If 2+ lines and each line contains its own phone number, parse line-by-line (WhatsApp list style)
  if (lines.length > 1) {
    const linesWithPhones = lines.filter((l) => extractPhonesFromText(l).length >= 1);
    if (linesWithPhones.length >= 2) {
      return linesWithPhones.map((line) => parseSingleReferralBlock(line, 'pasted'));
    }
  }

  return [parseSingleReferralBlock(trimmed, 'pasted')];
}

/**
 * Checks whether the browser supports the native Web Contact Picker API.
 */
export function isContactPickerSupported(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return 'contacts' in navigator && typeof (navigator as any).contacts?.select === 'function';
}

/**
 * Triggers the native Phone Contact Picker (`navigator.contacts.select`) and converts
 * chosen contacts into AttachedContactReferral drafts.
 */
export async function pickPhoneContacts(): Promise<AttachedContactReferral[]> {
  if (!isContactPickerSupported()) {
    throw new Error('Phone Contact Picker is not available in this browser.');
  }

  const contactsApi = (navigator as any).contacts;
  let props: string[] = ['name', 'tel'];
  if (typeof contactsApi.getProperties === 'function') {
    try {
      const supported: string[] = await contactsApi.getProperties();
      const desired = ['name', 'tel', 'email', 'address'];
      const filtered = desired.filter((p) => supported.includes(p));
      if (filtered.length > 0) props = filtered;
    } catch {
      // fallback to default ['name', 'tel']
    }
  }

  const selected = await contactsApi.select(props, { multiple: true });
  if (!Array.isArray(selected) || selected.length === 0) {
    return [];
  }

  return selected.map((contact: any) => {
    const rawName = Array.isArray(contact.name) ? contact.name[0] || '' : String(contact.name || '');
    const tels: string[] = Array.isArray(contact.tel) ? contact.tel.filter(Boolean) : [];
    const primaryPhone = tels[0] ? normalizePhoneDisplay(String(tels[0])) : '';
    const secondaryPhone = tels[1] ? normalizePhoneDisplay(String(tels[1])) : primaryPhone;
    const email = Array.isArray(contact.email) && contact.email[0] ? String(contact.email[0]) : undefined;

    const addressParts: string[] = [];
    if (Array.isArray(contact.address)) {
      for (const addr of contact.address) {
        if (typeof addr === 'string') addressParts.push(addr);
        else if (addr && typeof addr === 'object') {
          const piece = [addr.city, addr.region, addr.addressLine?.[0], addr.dependentLocality]
            .filter(Boolean)
            .join(', ');
          if (piece) addressParts.push(piece);
        }
      }
    }

    const combinedText = [rawName, addressParts.join(' ')].filter(Boolean).join(' ');
    const { tradeCategory, customTrade } = detectTradeAndCustom(combinedText);
    const { state, town } = detectLocation(combinedText);

    return {
      id: createDraftId(),
      artisanName: rawName.trim(),
      phone: primaryPhone,
      whatsapp: secondaryPhone || primaryPhone,
      email,
      tradeCategory,
      customTrade,
      state,
      town,
      note: '',
      source: 'phone_contacts',
      rawText: [rawName, primaryPhone, addressParts.join(', ')].filter(Boolean).join(' · '),
    };
  });
}

/**
 * Unfolds RFC 2425/6350 folded lines and parses one or multiple vCard entries (.vcf)
 * exported from iPhone, Android, WhatsApp, or macOS Contacts.
 */
export function parseVCardContacts(vcfContent: string): AttachedContactReferral[] {
  const unfolded = vcfContent.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
  const cards = unfolded.match(/BEGIN:VCARD[\s\S]*?END:VCARD/gi) || [];

  const results: AttachedContactReferral[] = [];

  for (const card of cards) {
    const lines = card.split(/\r?\n/);
    let fn = '';
    let nField = '';
    let org = '';
    let title = '';
    let note = '';
    let email = '';
    const tels: string[] = [];
    const addresses: string[] = [];

    for (const rawLine of lines) {
      const colonIdx = rawLine.indexOf(':');
      if (colonIdx === -1) continue;
      const keyPart = rawLine.slice(0, colonIdx).toUpperCase();
      let valuePart = rawLine.slice(colonIdx + 1).trim();
      if (!valuePart) continue;

      // Basic Quoted-Printable decoding if ENCODING=QUOTED-PRINTABLE
      if (keyPart.includes('QUOTED-PRINTABLE')) {
        try {
          valuePart = valuePart
            .replace(/=\r?\n/g, '')
            .replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
        } catch {
          // ignore
        }
      }

      const propName = keyPart.split(';')[0].replace(/^ITEM\d+\./, '');
      if (propName === 'FN') fn = valuePart;
      else if (propName === 'N' && !nField) {
        nField = valuePart
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean)
          .reverse()
          .join(' ');
      } else if (propName === 'TEL') {
        const normalized = normalizePhoneDisplay(valuePart);
        if (normalized) tels.push(normalized);
      } else if (propName === 'EMAIL' && !email) {
        email = valuePart;
      } else if (propName === 'ADR') {
        const adrClean = valuePart
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean)
          .join(', ');
        if (adrClean) addresses.push(adrClean);
      } else if (propName === 'ORG') {
        org = valuePart.replace(/;/g, ' ').trim();
      } else if (propName === 'TITLE') {
        title = valuePart;
      } else if (propName === 'NOTE') {
        note = valuePart.replace(/\\n/g, ' ').trim();
      }
    }

    const displayName = (fn || nField || org || '').trim();
    const primaryPhone = tels[0] || '';
    if (!displayName && !primaryPhone) continue;

    const hintCorpus = [displayName, org, title, note, ...addresses].filter(Boolean).join(' ');
    const { tradeCategory, customTrade } = detectTradeAndCustom(hintCorpus);
    const { state, town } = detectLocation(hintCorpus);

    results.push({
      id: createDraftId(),
      artisanName: displayName,
      phone: primaryPhone,
      whatsapp: tels[1] || primaryPhone,
      email: email || undefined,
      tradeCategory,
      customTrade,
      state,
      town,
      note,
      source: 'vcard',
      rawText: [displayName, primaryPhone, ...addresses].filter(Boolean).join(' · '),
    });
  }

  return results;
}

export function createEmptyDraftReferral(): AttachedContactReferral {
  return {
    id: createDraftId(),
    artisanName: '',
    phone: '',
    whatsapp: '',
    tradeCategory: ARTISAN_TRADE_CATEGORIES[0].name,
    state: 'Lagos',
    town: '',
    note: '',
    source: 'manual',
  };
}
