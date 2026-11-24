import { supabase, ensureSupabase } from './supabase';
import { validateAndNormalizeNigerianPhone } from '../utils/nigerianPhone';

export interface PhoneOtpRequestResult {
  sent: boolean;
  normalizedPhone: string;
  displayPhone: string;
  providerConfigured: boolean;
  error?: string;
}

export interface PhoneOtpVerifyResult {
  verified: boolean;
  session: any | null;
  user: any | null;
  normalizedPhone: string;
  error?: string;
}

export function formatPhoneAuthError(rawMessage?: string): {
  message: string;
  providerUnconfigured: boolean;
} {
  const msg = String(rawMessage || '').trim();
  const lower = msg.toLowerCase();

  if (
    lower.includes('phone provider') ||
    lower.includes('unsupported phone provider') ||
    lower.includes('sms provider') ||
    lower.includes('sms_send_failed') ||
    lower.includes('twilio') ||
    lower.includes('messagebird') ||
    lower.includes('vonage') ||
    lower.includes('phone signups are disabled') ||
    lower.includes('phone logins are disabled')
  ) {
    return {
      providerUnconfigured: true,
      message:
        'SMS OTP delivery is not currently enabled on the Supabase project SMS provider. Please try again once an SMS provider (Twilio/Termii/MessageBird) is enabled in Supabase Auth, or continue with Email & Password below.',
    };
  }

  if (lower.includes('rate limit') || lower.includes('too many') || lower.includes('60 seconds')) {
    return {
      providerUnconfigured: false,
      message: 'Please wait a moment before requesting another verification code.',
    };
  }

  if (lower.includes('invalid') && (lower.includes('otp') || lower.includes('token') || lower.includes('expired'))) {
    return {
      providerUnconfigured: false,
      message: 'Invalid or expired verification code. Please check the 6-digit SMS code or request a new one.',
    };
  }

  return {
    providerUnconfigured: false,
    message: msg || 'Could not complete phone verification. Please check your phone number and try again.',
  };
}

/**
 * Initiates Supabase Auth phone signup/login via SMS OTP using canonical +234 E.164 format.
 */
export async function sendNigerianPhoneOtp(params: {
  phone: string;
  metadata?: Record<string, any>;
}): Promise<PhoneOtpRequestResult> {
  const phoneCheck = validateAndNormalizeNigerianPhone(params.phone);
  if (!phoneCheck.isValid) {
    return {
      sent: false,
      normalizedPhone: '',
      displayPhone: '',
      providerConfigured: true,
      error: phoneCheck.error || 'Please enter a valid Nigerian phone number.',
    };
  }

  const client = supabase || (await ensureSupabase());
  if (!client) {
    return {
      sent: false,
      normalizedPhone: phoneCheck.normalizedE164,
      displayPhone: phoneCheck.display,
      providerConfigured: false,
      error: 'Authentication client is unavailable. Please reload and try again.',
    };
  }

  const { error } = await client.auth.signInWithOtp({
    phone: phoneCheck.normalizedE164,
    options: {
      shouldCreateUser: true,
      data: {
        ...(params.metadata || {}),
        phone: phoneCheck.normalizedE164,
      },
    },
  });

  if (error) {
    const formatted = formatPhoneAuthError(error.message);
    return {
      sent: false,
      normalizedPhone: phoneCheck.normalizedE164,
      displayPhone: phoneCheck.display,
      providerConfigured: !formatted.providerUnconfigured,
      error: formatted.message,
    };
  }

  return {
    sent: true,
    normalizedPhone: phoneCheck.normalizedE164,
    displayPhone: phoneCheck.display,
    providerConfigured: true,
  };
}

/**
 * Verifies a 6-digit Supabase SMS OTP and establishes an authenticated Supabase session.
 */
export async function verifyNigerianPhoneOtp(params: {
  phone: string;
  token: string;
}): Promise<PhoneOtpVerifyResult> {
  const phoneCheck = validateAndNormalizeNigerianPhone(params.phone);
  if (!phoneCheck.isValid) {
    return {
      verified: false,
      session: null,
      user: null,
      normalizedPhone: '',
      error: phoneCheck.error || 'Please enter a valid Nigerian phone number.',
    };
  }

  const cleanToken = String(params.token || '').replace(/\s+/g, '').trim();
  if (!/^\d{6}$/.test(cleanToken)) {
    return {
      verified: false,
      session: null,
      user: null,
      normalizedPhone: phoneCheck.normalizedE164,
      error: 'Enter the 6-digit OTP code sent to your phone.',
    };
  }

  const client = supabase || (await ensureSupabase());
  if (!client) {
    return {
      verified: false,
      session: null,
      user: null,
      normalizedPhone: phoneCheck.normalizedE164,
      error: 'Authentication client is unavailable.',
    };
  }

  const { data, error } = await client.auth.verifyOtp({
    phone: phoneCheck.normalizedE164,
    token: cleanToken,
    type: 'sms',
  });

  if (error || !data?.session) {
    const formatted = formatPhoneAuthError(error?.message);
    return {
      verified: false,
      session: null,
      user: null,
      normalizedPhone: phoneCheck.normalizedE164,
      error: formatted.message,
    };
  }

  return {
    verified: true,
    session: data.session,
    user: data.user || data.session.user || null,
    normalizedPhone: phoneCheck.normalizedE164,
  };
}

/**
 * Allows phone-only users to add or update a verified email address later from Settings.
 */
export async function addOrUpdateUserEmail(email: string): Promise<{
  ok: boolean;
  message: string;
}> {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { ok: false, message: 'Please enter a valid email address.' };
  }

  const client = supabase || (await ensureSupabase());
  if (!client) {
    return { ok: false, message: 'Authentication client is unavailable.' };
  }

  const { error } = await client.auth.updateUser({ email: cleanEmail });
  if (error) {
    return {
      ok: false,
      message: error.message || 'Could not update your email address.',
    };
  }

  return {
    ok: true,
    message: `Verification link sent to ${cleanEmail}. Check your inbox to confirm your email address.`,
  };
}
