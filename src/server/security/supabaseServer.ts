import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface VerifiedTokenUser {
  id: string;
  email: string;
  phone?: string;
  phone_confirmed_at?: string | null;
  user_metadata?: Record<string, any>;
}

export interface SecurityTestHarness {
  verifyToken: (token: string) => Promise<VerifiedTokenUser | null>;
  isAdmin: (userId: string) => Promise<boolean>;
  hasBusinessAccess: (userId: string, businessId: string) => Promise<boolean>;
  getUserBusinessIds: (userId: string) => Promise<string[]>;
  getSubscription: (
    userId: string,
    businessId?: string
  ) => Promise<{ plan: 'free' | 'pro' | 'business'; status: string; expiresAt?: string } | null>;
}

let activeTestHarness: SecurityTestHarness | null = null;

export function isSecurityTestMode(): boolean {
  return process.env.NODE_ENV === 'test' && process.env.MATTHORG_SECURITY_TEST === '1';
}

export function setSecurityTestHarness(harness: SecurityTestHarness | null): void {
  if (!isSecurityTestMode()) {
    throw new Error('Security test harness is only allowed in isolated test mode.');
  }
  activeTestHarness = harness;
}

export function getSecurityTestHarness(): SecurityTestHarness | null {
  return isSecurityTestMode() ? activeTestHarness : null;
}

function cleanEnvVal(val?: string | null): string {
  if (!val) return '';
  let cleaned = String(val).trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned.replace(/\/+$/, '');
}

const DEFAULT_SUPABASE_URL = 'https://ndwuwdxcnprbrmxaxtff.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kd3V3ZHhjbnByYnJteGF4dGZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNjMwMDEsImV4cCI6MjA5ODczOTAwMX0.xYOI_8CT_H6HRJ3G74pl5YXbLThRE_YJy4SHQflHmQ8';

export function getSupabaseUrl(): string {
  return cleanEnvVal(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) || DEFAULT_SUPABASE_URL;
}

export function getSupabaseAnonKey(): string {
  return (
    cleanEnvVal(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY) ||
    DEFAULT_SUPABASE_ANON_KEY
  );
}

let cachedServiceClient: SupabaseClient | null = null;
let cachedAuthVerifierClient: SupabaseClient | null = null;

export function getSupabaseServiceClient(): SupabaseClient | null {
  const serviceKey = cleanEnvVal(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const url = getSupabaseUrl();
  if (!serviceKey || !url) return null;
  if (!cachedServiceClient) {
    cachedServiceClient = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return cachedServiceClient;
}

export function getSupabaseAnonClient(): SupabaseClient {
  if (!cachedAuthVerifierClient) {
    cachedAuthVerifierClient = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return cachedAuthVerifierClient;
}

export function getSupabaseUserClient(accessToken: string): SupabaseClient {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

/**
 * Verifies a Supabase Bearer JWT directly with Supabase Auth (never trusts unverified local decode).
 */
export async function verifySupabaseAccessToken(accessToken: string): Promise<VerifiedTokenUser | null> {
  if (!accessToken || typeof accessToken !== 'string' || accessToken.trim().length < 16) {
    return null;
  }

  const harness = getSecurityTestHarness();
  if (harness) {
    return harness.verifyToken(accessToken);
  }

  try {
    const client = getSupabaseServiceClient() || getSupabaseAnonClient();
    const { data, error } = await client.auth.getUser(accessToken);
    if (error || !data?.user?.id) {
      return null;
    }
    return {
      id: data.user.id,
      email: String(data.user.email || '').trim().toLowerCase(),
      phone: data.user.phone ? String(data.user.phone).trim() : undefined,
      phone_confirmed_at: (data.user as any).phone_confirmed_at || null,
      user_metadata: data.user.user_metadata,
    };
  } catch {
    return null;
  }
}
