/**
 * MATTHORG — NIGERIAN PHONE VALIDATION & NORMALIZATION
 * Supports local Nigerian mobile & landline formats:
 * - 0803 123 4567 -> +2348031234567
 * - +234 803 123 4567 -> +2348031234567
 * - 2348031234567 -> +2348031234567
 * - 8031234567 -> +2348031234567
 */

export interface NigerianPhoneResult {
  isValid: boolean;
  normalizedE164: string;
  localZero: string;
  display: string;
  whatsappDigits: string;
  last10: string;
  error?: string;
}

const VALID_GSM_PREFIXES = new Set([
  // 070x
  '701', '702', '703', '704', '705', '706', '707', '708', '709',
  // 080x
  '802', '803', '804', '805', '806', '807', '808', '809',
  // 081x
  '810', '811', '812', '813', '814', '815', '816', '817', '818', '819',
  // 090x
  '901', '902', '903', '904', '905', '906', '907', '908', '909',
  // 091x
  '911', '912', '913', '914', '915', '916', '917', '918', '919',
]);

// Nigerian fixed-line area prefixes (1–2 digits after 0, total 9–10 national digits)
const VALID_LANDLINE_REGEX = /^(?:1|2|9|[3-8][0-9])\d{7,8}$/;

export function validateAndNormalizeNigerianPhone(rawInput: string): NigerianPhoneResult {
  const emptyResult: NigerianPhoneResult = {
    isValid: false,
    normalizedE164: '',
    localZero: '',
    display: '',
    whatsappDigits: '',
    last10: '',
  };

  if (!rawInput || typeof rawInput !== 'string') {
    return { ...emptyResult, error: 'Phone number is required.' };
  }

  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { ...emptyResult, error: 'Phone number is required.' };
  }

  // Strip common formatting characters: spaces, hyphens, parentheses, dots
  const stripped = trimmed.replace(/[\s\-().]/g, '');

  // Reject clearly non-phone characters or foreign country codes
  if (!/^\+?\d+$/.test(stripped)) {
    return {
      ...emptyResult,
      error: 'Enter digits only (e.g. 0803 123 4567 or +234 803 123 4567).',
    };
  }

  if (stripped.startsWith('+') && !stripped.startsWith('+234')) {
    return {
      ...emptyResult,
      error: 'Please enter a valid Nigerian phone number (+234 or 080/081/070/090/091).',
    };
  }

  let national = '';
  if (stripped.startsWith('+234')) {
    national = stripped.slice(4);
  } else if (stripped.startsWith('234') && stripped.length >= 12) {
    national = stripped.slice(3);
  } else if (stripped.startsWith('0')) {
    national = stripped.slice(1);
  } else {
    national = stripped;
  }

  // Strip an accidental extra leading 0 after +234 (e.g. +2340803...)
  if (national.startsWith('0') && national.length === 11) {
    national = national.slice(1);
  }

  // Standard 10-digit Nigerian mobile number (after removing leading 0 / +234)
  if (national.length === 10) {
    const prefix3 = national.slice(0, 3);
    if (!VALID_GSM_PREFIXES.has(prefix3)) {
      return {
        ...emptyResult,
        error: 'Enter a valid Nigerian mobile number starting with 070, 080, 081, 090, or 091.',
      };
    }

    // Reject obvious dummy repeated digits like 08000000000 or 08011111111
    if (/^(\d)\1{6,}$/.test(national.slice(3))) {
      return {
        ...emptyResult,
        error: 'Please enter a real, reachable Nigerian phone number.',
      };
    }

    const normalizedE164 = `+234${national}`;
    const localZero = `0${national}`;
    const whatsappDigits = `234${national}`;
    const display = `+234 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;

    return {
      isValid: true,
      normalizedE164,
      localZero,
      display,
      whatsappDigits,
      last10: national,
    };
  }

  // Nigerian office landline support (e.g. 01 453 1234 or 09 291 1234 -> 8 or 9 digits without 0)
  if ((national.length === 8 || national.length === 9) && VALID_LANDLINE_REGEX.test(national)) {
    const normalizedE164 = `+234${national}`;
    const localZero = `0${national}`;
    const whatsappDigits = `234${national}`;
    const display = `+234 ${national}`;

    return {
      isValid: true,
      normalizedE164,
      localZero,
      display,
      whatsappDigits,
      last10: national,
    };
  }

  if (national.length < 10) {
    return {
      ...emptyResult,
      error: 'Phone number appears too short. Enter an 11-digit Nigerian number (e.g. 0803 123 4567).',
    };
  }

  return {
    ...emptyResult,
    error: 'Phone number appears too long. Enter an 11-digit Nigerian number or +234 followed by 10 digits.',
  };
}

/**
 * Extracts canonical comparison key (last 10 digits for mobile, or normalized digits) for duplicate checks.
 */
export function extractNigerianPhoneKey(rawPhone?: string | null): string {
  if (!rawPhone) return '';
  const parsed = validateAndNormalizeNigerianPhone(rawPhone);
  if (parsed.isValid) return parsed.last10;
  const digits = String(rawPhone).replace(/\D/g, '');
  if (digits.startsWith('234') && digits.length >= 12) {
    return digits.slice(3).replace(/^0+/, '').slice(-10);
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return digits.slice(1);
  }
  return digits.slice(-10);
}

export function nigerianPhonesMatch(phoneA?: string | null, phoneB?: string | null): boolean {
  const keyA = extractNigerianPhoneKey(phoneA);
  const keyB = extractNigerianPhoneKey(phoneB);
  return keyA.length >= 8 && keyA === keyB;
}
