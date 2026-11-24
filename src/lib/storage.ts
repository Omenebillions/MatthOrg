import { authFetch, ensureSupabase, supabase } from './supabase';

/**
 * Storage helper for MatthOrg project, product, profile, and business logo images.
 * - Uploads raw, unoptimized original image files directly to the configured
 *   Supabase Storage bucket (`Products` by default).
 * - Preserves full original resolution, format, and bytes without resizing or compression.
 * - Falls back automatically to `/api/storage/upload` (local disk `/uploads/...`) or R2
 *   if the Supabase bucket SQL migration has not yet been applied remotely.
 */

function normalizeBucketName(raw?: string | null): string {
  const cleaned = String(raw || '').trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
  if (!cleaned) return 'Products';
  const bucketMatch = cleaned.match(/\/buckets\/([^/?#]+)/i);
  if (bucketMatch && bucketMatch[1]) {
    return decodeURIComponent(bucketMatch[1]);
  }
  if (/^https?:\/\//i.test(cleaned)) {
    const tail = cleaned.split('/').filter(Boolean).pop();
    return tail || 'Products';
  }
  return cleaned;
}

export const PROJECT_IMAGES_BUCKET = normalizeBucketName(
  typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_STORAGE_BUCKET : undefined
);

export interface ProjectImageUploadResult {
  publicUrl: string;
  provider: 'supabase' | 'server' | 'r2';
  bucket?: string;
  warning?: string;
}

function sanitizeFilename(name: string): string {
  const parts = String(name || 'image.png').split('.');
  const ext = parts.length > 1 ? parts.pop()!.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : 'png';
  const base = parts
    .join('.')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'image';
  return `${base}.${ext || 'png'}`;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error('Failed to read original image file bytes.'));
    reader.readAsDataURL(file);
  });
}

async function uploadRawToServer(file: File, folder: string): Promise<string> {
  const dataBase64 = await readFileAsBase64(file);
  const res = await authFetch('/api/storage/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      folder,
      dataBase64,
    }),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || !payload?.publicUrl) {
    throw new Error(payload?.error || 'Server fallback image upload failed.');
  }
  return payload.publicUrl;
}

export async function uploadProjectImage(
  file: File,
  folder: 'products' | 'profiles' | 'business-logos' | 'projects' | 'uploads' = 'products'
): Promise<ProjectImageUploadResult> {
  const safeName = sanitizeFilename(file.name);
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  let supabaseErrorMsg: string | null = null;

  // 1. Primary: Raw unoptimized upload directly to Supabase Storage bucket `Products`
  try {
    const client = (await ensureSupabase()) || supabase;
    if (client?.storage) {
      const { data: sessData } = await client.auth.getSession();
      const userId = sessData?.session?.user?.id;
      if (userId) {
        const objectPath = `${folder}/${userId}/${Date.now()}-${randomSuffix}-${safeName}`;
        const { error } = await client.storage.from(PROJECT_IMAGES_BUCKET).upload(objectPath, file, {
          contentType: file.type || 'application/octet-stream',
          cacheControl: '3600',
          upsert: false,
        });

        if (!error) {
          const { data: urlData } = client.storage.from(PROJECT_IMAGES_BUCKET).getPublicUrl(objectPath);
          if (urlData?.publicUrl) {
            return {
              publicUrl: urlData.publicUrl,
              provider: 'supabase',
              bucket: PROJECT_IMAGES_BUCKET,
            };
          }
        } else {
          supabaseErrorMsg = error.message || 'Supabase bucket unavailable';
        }
      } else {
        supabaseErrorMsg = 'Sign in required for direct storage uploads';
      }
    }
  } catch (err: any) {
    supabaseErrorMsg = err?.message || 'Supabase upload error';
  }

  // 2. Secondary: Optional Cloudflare R2 presigned upload if configured on server
  try {
    const presignRes = await authFetch('/api/storage/presigned-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
      }),
    });
    if (presignRes.ok) {
      const { uploadUrl, publicUrl } = await presignRes.json();
      if (uploadUrl && publicUrl) {
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
          body: file,
        });
        if (uploadRes.ok) {
          return {
            publicUrl,
            provider: 'r2',
            warning: supabaseErrorMsg
              ? `Saved to R2 (Supabase bucket '${PROJECT_IMAGES_BUCKET}' needs migration: ${supabaseErrorMsg})`
              : undefined,
          };
        }
      }
    }
  } catch {
    // R2 not configured; proceed to local server disk persistence
  }

  // 3. Guaranteed Server Persistence Fallback (`/uploads/...`, raw unmodified file bytes)
  const localUrl = await uploadRawToServer(file, folder);
  return {
    publicUrl: localUrl,
    provider: 'server',
    warning: supabaseErrorMsg
      ? `Saved locally to ${localUrl} (run Supabase migration for '${PROJECT_IMAGES_BUCKET}' bucket: ${supabaseErrorMsg})`
      : undefined,
  };
}

/**
 * Backwards-compatible wrapper returning the uploaded public image URL directly.
 */
export async function uploadFileToR2(
  file: File,
  folder: 'products' | 'profiles' | 'business-logos' | 'projects' | 'uploads' = 'projects'
): Promise<string> {
  const result = await uploadProjectImage(file, folder);
  return result.publicUrl;
}
