import { createClient, SupabaseClient } from '@supabase/supabase-js';

function cleanEnvVal(val?: string | null): string {
  if (!val) return '';
  let cleaned = String(val).trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned.replace(/\/+$/, '');
}

const envObj = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : ((typeof process !== 'undefined' && process.env) ? process.env : {});

export const LIVE_SUPABASE_URL = 'https://ndwuwdxcnprbrmxaxtff.supabase.co';
export const LIVE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kd3V3ZHhjbnByYnJteGF4dGZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNjMwMDEsImV4cCI6MjA5ODczOTAwMX0.xYOI_8CT_H6HRJ3G74pl5YXbLThRE_YJy4SHQflHmQ8';

const initialUrl = cleanEnvVal(envObj.VITE_SUPABASE_URL || envObj.SUPABASE_URL) || LIVE_SUPABASE_URL;
const initialKey = cleanEnvVal(envObj.VITE_SUPABASE_ANON_KEY || envObj.SUPABASE_ANON_KEY) || LIVE_SUPABASE_ANON_KEY;

export let supabase: SupabaseClient = createClient(initialUrl, initialKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

type SupabaseInitListener = (client: SupabaseClient) => void;
const listeners: SupabaseInitListener[] = [];

export function onSupabaseInit(cb: SupabaseInitListener) {
  if (supabase) {
    cb(supabase);
  } else {
    listeners.push(cb);
  }
}

/**
 * Ensures Supabase client is initialized.
 * If not already set via client environment variables, fetches /api/config from server.
 */
export async function ensureSupabase(): Promise<SupabaseClient | null> {
  if (supabase) return supabase;

  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      const url = cleanEnvVal(data.supabaseUrl);
      const key = cleanEnvVal(data.supabaseAnonKey);

      if (url && key) {
        supabase = createClient(url, key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        });
        listeners.forEach(cb => cb(supabase!));
        listeners.length = 0;
        return supabase;
      }
    }
  } catch (err) {
    console.warn('Could not load Supabase config from /api/config:', err);
  }

  return supabase;
}

// Kick off auto-initialization in the background
ensureSupabase();

export function getSupabaseDiagnostics() {
  const viteUrl = cleanEnvVal(import.meta.env.VITE_SUPABASE_URL);
  const viteKey = cleanEnvVal(import.meta.env.VITE_SUPABASE_ANON_KEY);
  return {
    hasViteUrl: Boolean(viteUrl),
    hasViteAnonKey: Boolean(viteKey),
    isInitialized: Boolean(supabase),
    projectHost: (viteUrl || '').replace(/^https?:\/\//, '').split('/')[0] || null,
  };
}

export async function getAccessToken(): Promise<string | null> {
  try {
    const client = (await ensureSupabase()) || supabase;
    if (!client?.auth) return null;
    const { data } = await client.auth.getSession();
    return data?.session?.access_token || null;
  } catch {
    return null;
  }
}

export async function getAuthHeaders(extra?: HeadersInit): Promise<Headers> {
  const headers = new Headers(extra);
  const token = await getAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = await getAuthHeaders(init.headers);
  return fetch(input, {
    ...init,
    headers,
  });
}

