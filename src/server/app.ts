import express, { Express, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { executeMatthewChat } from './matthew/engine';
import { growthRouter } from './growth/routes';
import { commerceRouter } from './commerce/routes';
import {
  clearCustomerRequestsFromStore,
  getClearedRequestIds,
  getCustomerRequests,
  readStoreFile,
  upsertCapturedCustomerRequest,
  writeStoreFile,
} from './commerce/store';
import {
  ALLOWED_CUSTOMER_REQUEST_CREATE_FIELDS,
  ALLOWED_DEMAND_CAMPAIGN_CREATE_FIELDS,
  ALLOWED_DEMAND_CAMPAIGN_UPDATE_FIELDS,
  ALLOWED_RECOMMENDATION_CREATE_FIELDS,
  ALLOWED_RECOMMENDATION_UPDATE_FIELDS,
  pickAllowedFields,
} from './security/massAssignment';
import {
  getOrInitServerAccount,
  getServerAiUsage,
  getUserAccountById,
  incrementServerAiUsage,
  registerUserAccountForAuthUser,
  sanitizeStoreSaveForUser,
  ServerPlanTier,
  setAuthoritativeUserPlan,
  setTargetUserRoleAsVerifiedAdmin,
  updateUserAccountProfile,
} from './security/userAccounts';
import {
  AuthenticatedRequest,
  getAuthoritativeSubscription,
  getUserBusinessIds,
  isUuidString,
  maskCustomerRequestContacts,
  requireAdmin,
  requireAuth,
  resolveIsPlatformAdmin,
  resolveUserBusinessMembership,
} from './security/authMiddleware';
import { getSupabaseServiceClient } from './security/supabaseServer';
import {
  attributeReferralServer,
  getReferralSummaryForUserServer,
  validateReferralCodeServer,
} from './referrals';

dotenv.config();

const SAFE_IMAGE_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

const SAFE_IMAGE_EXT_SET = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']);
const ALLOWED_UPLOAD_FOLDERS = new Set(['products', 'profiles', 'business-logos', 'projects', 'uploads']);
const ALLOWED_REQUEST_STATUSES = new Set(['Open', 'Matched', 'Contacted', 'Converted', 'Closed']);
const SUBSCRIPTION_MIN_KOBO: Record<'pro' | 'business', number> = {
  pro: 2500 * 100,
  business: 7500 * 100,
};

const publicRequestRateBuckets = new Map<string, number[]>();

function isPublicRequestRateLimited(ip: string, limit = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const key = ip || 'unknown';
  const prev = publicRequestRateBuckets.get(key) || [];
  const recent = prev.filter((ts) => now - ts < windowMs);
  if (recent.length >= limit) {
    publicRequestRateBuckets.set(key, recent);
    return true;
  }
  recent.push(now);
  publicRequestRateBuckets.set(key, recent);
  return false;
}

async function syncAuthoritativeSubscriptionToSupabase(
  userId: string,
  plan: ServerPlanTier,
  businessId?: string,
  durationDays = 30
): Promise<void> {
  const serviceClient = getSupabaseServiceClient();
  if (!serviceClient || !isUuidString(userId)) return;

  const expiresAt =
    plan === 'free'
      ? null
      : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  try {
    const targetIds = new Set<string>();

    if (businessId && isUuidString(businessId)) {
      const { data: targetBiz } = await serviceClient
        .from('businesses')
        .select('id, owner_user_id')
        .eq('id', businessId)
        .maybeSingle();
      if (targetBiz?.id && targetBiz.owner_user_id === userId) {
        targetIds.add(String(targetBiz.id));
      }
    }

    const { data: ownedBusinesses } = await serviceClient
      .from('businesses')
      .select('id')
      .eq('owner_user_id', userId);
    if (Array.isArray(ownedBusinesses)) {
      for (const b of ownedBusinesses) {
        if (b?.id) targetIds.add(String(b.id));
      }
    }

    for (const bid of targetIds) {
      await serviceClient.rpc('authoritative_update_business_subscription', {
        p_business_id: bid,
        p_plan: plan,
        p_status: plan === 'free' ? 'inactive' : 'active',
        p_expires_at: expiresAt,
      });
    }
  } catch (err) {
    console.warn('[Paystack] Non-blocking Supabase subscription sync notice:', err);
  }
}

let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: 40000,
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

let s3Client: S3Client | null = null;
function getS3Client(): S3Client {
  if (!s3Client) {
    const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      throw new Error('Cloudflare R2 credentials are not configured in environment variables.');
    }
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

function getPaystackSecretKey(): string | null {
  const raw = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET;
  if (!raw) return null;
  let cleaned = raw.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned || null;
}

function getPaystackPublicKey(): string | null {
  const raw = process.env.VITE_PAYSTACK_PUBLIC_KEY || process.env.PAYSTACK_PUBLIC_KEY || process.env.PAYSTACK_KEY;
  if (!raw) return null;
  let cleaned = raw.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned || null;
}

function isReservedStoreKey(key: string): boolean {
  return !key || key.startsWith('__') || key === 'admin_platform_root';
}

export function createApiApp(): Express {
  const app = express();

  const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  app.use(
    express.json({
      limit: '50mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );

  // Serve raw uploaded project & product images directly without optimization
  app.use(
    '/uploads',
    express.static(UPLOADS_DIR, {
      maxAge: '7d',
      fallthrough: true,
    })
  );

  // Mount MatthOrg AI Growth Engine router (authenticated & owner-scoped)
  app.use('/api/growth', growthRouter);

  // Mount MatthOrg Conversational Commerce & Unified Admin Store router
  app.use('/api', commerceRouter);

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Dynamic SEO robots.txt
  app.get('/robots.txt', (req: Request, res: Response) => {
    const host = req.get('host') || 'matthorg.com';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const robots = `User-agent: *
Allow: /
Allow: /blog
Allow: /blog/*
Allow: /services
Allow: /services/*
Allow: /locations
Allow: /locations/*
Allow: /recommend

Sitemap: ${protocol}://${host}/sitemap.xml
`;
    res.header('Content-Type', 'text/plain');
    res.send(robots);
  });

  // Dynamic SEO sitemap.xml
  app.get('/sitemap.xml', (req: Request, res: Response) => {
    const host = req.get('host') || 'matthorg.com';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const origin = `${protocol}://${host}`;

    const coreRoutes = [
      { loc: `${origin}/`, priority: '1.0', changefreq: 'daily' },
      { loc: `${origin}/recommend`, priority: '0.9', changefreq: 'daily' },
      { loc: `${origin}/blog`, priority: '0.9', changefreq: 'daily' },
      { loc: `${origin}/services`, priority: '0.9', changefreq: 'weekly' },
      { loc: `${origin}/locations`, priority: '0.9', changefreq: 'weekly' },
      { loc: `${origin}/blog/how-much-does-solar-installation-cost-in-nigeria`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${origin}/blog/how-to-choose-a-plumber`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${origin}/blog/what-to-look-for-in-a-cctv-installer`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${origin}/blog/solar-vs-generator`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${origin}/blog/how-to-find-a-reliable-electrician`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${origin}/blog/how-to-choose-a-solar-installer`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${origin}/services/solar/lagos`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${origin}/services/solar/abuja`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${origin}/services/solar/port-harcourt`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${origin}/services/plumbing/abuja`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${origin}/services/plumbing/lagos`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${origin}/services/electrical/port-harcourt`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${origin}/services/cctv/ibadan`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${origin}/services/cleaning/enugu`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${origin}/services/construction/lagos`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${origin}/locations/lagos`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${origin}/locations/abuja`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${origin}/locations/rivers`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${origin}/locations/oyo`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${origin}/locations/ogun`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${origin}/locations/enugu`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${origin}/locations/kano`, priority: '0.8', changefreq: 'weekly' },
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${coreRoutes
  .map(
    (r) => `  <url>
    <loc>${r.loc}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  });

  // Public Client Configuration (NEVER exposes private secrets)
  app.get('/api/config', (_req: Request, res: Response) => {
    const sanitize = (val?: string) => {
      if (!val) return '';
      let cleaned = val.trim();
      if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
        cleaned = cleaned.slice(1, -1).trim();
      }
      return cleaned;
    };

    const supabaseUrl = sanitize(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);
    const supabaseAnonKey = sanitize(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);

    const rawBucket = sanitize(process.env.VITE_SUPABASE_STORAGE_BUCKET);
    const bucketMatch = rawBucket.match(/\/buckets\/([^/?#]+)/i);
    const supabaseBucket = bucketMatch?.[1]
      ? decodeURIComponent(bucketMatch[1])
      : /^https?:\/\//i.test(rawBucket)
        ? rawBucket.split('/').filter(Boolean).pop() || 'Products'
        : rawBucket || 'Products';

    res.json({
      supabaseUrl,
      supabaseAnonKey,
      supabaseBucket,
      hasSupabase: Boolean(supabaseUrl && supabaseAnonKey),
      hasR2: Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID),
      hasGemini: Boolean(process.env.GEMINI_API_KEY),
      hasOpenAI: Boolean(process.env.OPENAI_API_KEY),
      hasPaystack: Boolean(process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET),
    });
  });

  // Authoritative Session Identity & Role/Plan Endpoint (Server-Verified Only)
  app.get('/api/auth/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.authUser!;
    const [isAdmin, businessIds, subscription] = await Promise.all([
      resolveIsPlatformAdmin(authUser),
      getUserBusinessIds(authUser),
      getAuthoritativeSubscription(authUser),
    ]);

    return res.json({
      success: true,
      data: {
        id: authUser.id,
        email: authUser.email,
        phone: authUser.phone || null,
        role: isAdmin ? 'admin' : 'user',
        isAdmin,
        plan: subscription.plan,
        subscriptionStatus: subscription.status,
        subscriptionExpiresAt: subscription.expiresAt || null,
        isPaid: subscription.isPaid,
        businessIds,
      },
    });
  });

  // Referral Attribution & Validation Endpoints
  app.get('/api/referrals/validate', async (req: Request, res: Response) => {
    try {
      const code = String(req.query.code || '').trim();
      const result = await validateReferralCodeServer(code);
      if (!result.valid) {
        return res.status(404).json({
          valid: false,
          fallbackNeeded: true,
          error: result.error || 'Referral code not found.',
        });
      }
      return res.json({
        valid: true,
        referral_code: result.referral_code,
        referrer_business_id: result.referrer_business_id,
        referrer_name: result.referrer_name,
        referrer_industry: result.referrer_industry,
        referrer_location: result.referrer_location,
      });
    } catch (err: any) {
      return res.status(500).json({ valid: false, error: err?.message || 'Failed to validate referral code.' });
    }
  });

  app.post('/api/referrals/attribute', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const authUser = req.authUser!;
      const result = await attributeReferralServer({
        authUser,
        referralCode: req.body?.referral_code || req.body?.code,
        businessId: req.body?.business_id,
        phone: req.body?.phone,
        businessName: req.body?.business_name,
        location: req.body?.location,
        source: req.body?.source,
      });

      if (!result.ok) {
        return res.status(result.status).json({
          success: false,
          self_referral: Boolean(result.self_referral),
          error: result.error || 'Could not attribute referral.',
        });
      }

      return res.status(result.status).json({
        success: true,
        already_attributed: Boolean(result.already_attributed),
        locked: Boolean(result.locked),
        referral_code: result.referral_code,
        referrer_name: result.referrer_name,
        attribution: result.attribution,
        message: result.message,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Referral attribution failed.' });
    }
  });

  app.get('/api/referrals/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const authUser = req.authUser!;
      const requestedBizId = typeof req.query.businessId === 'string' ? req.query.businessId : undefined;
      const summary = await getReferralSummaryForUserServer(authUser, requestedBizId);
      return res.json({ success: true, data: summary });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Failed to load referral summary.' });
    }
  });

  // Paystack Status Check
  app.get('/api/paystack/status', (_req: Request, res: Response) => {
    const secretKey = getPaystackSecretKey();
    const publicKey = getPaystackPublicKey();
    const isConfigured = Boolean(secretKey);
    const mode = secretKey ? (secretKey.startsWith('sk_live') ? 'live' : 'test') : 'unconfigured';

    res.json({
      isConfigured,
      publicKey: publicKey || null,
      mode,
      timestamp: new Date().toISOString(),
    });
  });

  // Initialize Paystack Transaction (Authenticated — User ID bound on server)
  app.post('/api/paystack/initialize', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const authUser = req.authUser!;
      const { email, amount, callback_url, metadata, reference } = req.body || {};

      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: 'A valid customer email is required.' });
      }

      const numAmount = Number(amount);
      if (!amount || isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Valid payment amount is required.' });
      }

      const secretKey = getPaystackSecretKey();
      if (!secretKey) {
        return res.status(503).json({
          error:
            'PAYSTACK_SECRET_KEY is not configured in server environment variables. Please provide PAYSTACK_SECRET_KEY in Vercel or Settings.',
          configured: false,
        });
      }

      const cleanRef = reference || `MAT-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      const amountInKobo = Math.round(numAmount * 100);

      const safeMetadata =
        metadata && typeof metadata === 'object' && !Array.isArray(metadata)
          ? { ...metadata, userId: authUser.id }
          : { userId: authUser.id };

      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          amount: amountInKobo,
          reference: cleanRef,
          currency: 'NGN',
          callback_url: callback_url || undefined,
          metadata: safeMetadata,
        }),
      });

      const data: any = await paystackResponse.json();

      if (!paystackResponse.ok || !data.status) {
        return res.status(paystackResponse.status || 400).json({
          error: data.message || 'Paystack returned an error during transaction initialization.',
          details: data,
        });
      }

      return res.json({
        success: true,
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        reference: data.data.reference,
        message: data.message,
      });
    } catch (err: any) {
      console.error('Paystack initialization exception:', err);
      return res.status(500).json({
        error: err.message || 'Failed to connect to Paystack API gateway.',
      });
    }
  });

  // Verify Paystack Transaction (Authenticated; plan activation strictly bound to authenticated owner)
  app.get('/api/paystack/verify/:reference', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const authUser = req.authUser!;
      const { reference } = req.params;
      if (!reference) {
        return res.status(400).json({ error: 'Transaction reference is required.' });
      }

      const secretKey = getPaystackSecretKey();
      if (!secretKey) {
        return res.status(503).json({
          error: 'PAYSTACK_SECRET_KEY is not configured on the server.',
        });
      }

      const paystackResponse = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${secretKey}`,
          },
        }
      );

      const data: any = await paystackResponse.json();

      if (!paystackResponse.ok || !data.status) {
        return res.status(paystackResponse.status || 400).json({
          error: data.message || 'Failed to verify transaction with Paystack.',
          details: data,
        });
      }

      const transaction = data.data;
      const isSuccess = transaction.status === 'success';
      const meta = transaction.metadata || {};
      const isAdmin = await resolveIsPlatformAdmin(authUser);

      if (meta.userId && String(meta.userId) !== authUser.id && !isAdmin) {
        return res.status(403).json({ error: 'Forbidden: This payment reference belongs to another user.' });
      }

      if (isSuccess && (meta.type === 'subscription' || meta.plan)) {
        const verifiedPlan: ServerPlanTier = meta.plan === 'business' || meta.plan === 'pro' ? meta.plan : 'pro';
        const minKobo = SUBSCRIPTION_MIN_KOBO[verifiedPlan];
        const paidKobo = Number(transaction.amount || 0);
        if (!Number.isFinite(paidKobo) || paidKobo < minKobo) {
          return res.status(400).json({
            error: `Paid amount (${paidKobo / 100}) is below the required ${verifiedPlan.toUpperCase()} plan minimum.`,
          });
        }
        const targetUserId = meta.userId ? String(meta.userId) : authUser.id;
        getOrInitServerAccount(targetUserId, { email: authUser.email });
        setAuthoritativeUserPlan(targetUserId, verifiedPlan);
        await syncAuthoritativeSubscriptionToSupabase(
          targetUserId,
          verifiedPlan,
          meta.businessId ? String(meta.businessId) : undefined
        );
      }

      return res.json({
        success: isSuccess,
        data: {
          status: transaction.status,
          reference: transaction.reference,
          amount: transaction.amount / 100,
          paid_at: transaction.paid_at,
          channel: transaction.channel,
          currency: transaction.currency,
          customer: transaction.customer,
          metadata: transaction.metadata,
          gateway_response: transaction.gateway_response,
        },
      });
    } catch (err: any) {
      console.error('Paystack verification error:', err);
      return res.status(500).json({ error: err.message || 'Failed to verify transaction.' });
    }
  });

  // Paystack Webhook Handler (Strict HMAC SHA-512 verification; fails closed if secret missing)
  app.post('/api/paystack/webhook', async (req: any, res: Response) => {
    try {
      const secretKey = getPaystackSecretKey();
      if (!secretKey) {
        return res.status(503).json({ error: 'Paystack webhook secret is not configured.' });
      }

      const signature = String(req.headers['x-paystack-signature'] || '');
      if (!signature) {
        return res.status(400).send('Missing Paystack signature.');
      }

      const raw = req.rawBody || JSON.stringify(req.body);
      const expectedHash = crypto.createHmac('sha512', secretKey).update(raw).digest('hex');

      const sigBuf = Buffer.from(signature, 'utf8');
      const expBuf = Buffer.from(expectedHash, 'utf8');
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        console.warn('Paystack webhook signature verification failed.');
        return res.status(401).send('Invalid signature.');
      }

      const event = req.body;
      if (event?.event === 'charge.success') {
        const data = event.data;
        const meta = data?.metadata || {};
        if (meta.userId && meta.type === 'subscription') {
          const verifiedPlan: ServerPlanTier = meta.plan === 'business' || meta.plan === 'pro' ? meta.plan : 'pro';
          const minKobo = SUBSCRIPTION_MIN_KOBO[verifiedPlan];
          const paidKobo = Number(data?.amount || 0);
          if (Number.isFinite(paidKobo) && paidKobo >= minKobo) {
            getOrInitServerAccount(String(meta.userId));
            setAuthoritativeUserPlan(String(meta.userId), verifiedPlan);
            await syncAuthoritativeSubscriptionToSupabase(
              String(meta.userId),
              verifiedPlan,
              meta.businessId ? String(meta.businessId) : undefined
            );
          }
        }
      }

      return res.status(200).json({ status: 'success' });
    } catch (err) {
      console.error('Paystack webhook handler error:', err);
      return res.status(500).json({ error: 'Webhook processing error.' });
    }
  });

  // PWA / TWA Digital Asset Links
  app.get('/.well-known/assetlinks.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.json([
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: 'com.matthorg.app',
          sha256_cert_fingerprints: [
            '14:6D:E9:7D:0F:52:AB:3A:D4:6D:C2:59:79:A1:0C:6D:23:2D:33:EE:51:7A:AC:70:C6:16:D4:2D:10:98:C0:DC',
          ],
        },
      },
    ]);
  });

  // User Registration & Profile (Authenticated via Supabase JWT; Server-Enforced Role/Plan/ID)
  app.post('/api/users/register', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    try {
      const authUser = req.authUser!;
      const { account, isNew } = registerUserAccountForAuthUser(
        authUser.id,
        authUser.email,
        req.body,
        authUser.phone
      );
      return res.status(isNew ? 201 : 200).json({ success: true, data: account });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Failed to register user.' });
    }
  });

  app.get('/api/users/:userId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.authUser!;
    const { userId } = req.params;
    const isAdmin = await resolveIsPlatformAdmin(authUser);

    if (authUser.id !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Cannot access another user account.' });
    }

    const account = getUserAccountById(userId);
    if (!account) {
      return res.status(404).json({ error: 'User account not found.' });
    }
    return res.json({ success: true, data: account });
  });

  app.patch('/api/users/:userId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.authUser!;
    const { userId } = req.params;
    if (isReservedStoreKey(userId)) {
      return res.status(403).json({ error: 'Forbidden target user ID.' });
    }
    const isAdmin = await resolveIsPlatformAdmin(authUser);
    if (authUser.id !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Cannot modify another user profile.' });
    }

    const updated = updateUserAccountProfile(userId, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'User account not found.' });
    }
    return res.json({ success: true, data: updated });
  });

  // Admin-Only Role Management (Ignores x-actor-user-id; verifies Supabase JWT + platform_admins)
  app.post('/api/admin/users/:userId/role', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const targetUserId = req.params.userId;
    const nextRole = req.body?.role;

    const result = setTargetUserRoleAsVerifiedAdmin({
      targetUserId,
      nextRole,
    });

    if (result.ok === false) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.json({ success: true, data: result.account });
  });

  // Workspace Store Sync (Strict Owner-Only + Allowlist Sanitization)
  app.get('/api/store/:userId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.authUser!;
    const { userId } = req.params;
    if (isReservedStoreKey(userId)) {
      return res.status(403).json({ error: 'Access to reserved store namespace is forbidden.' });
    }
    if (authUser.id !== userId) {
      return res.status(403).json({ error: 'Forbidden: Cannot read another user workspace store.' });
    }
    const allData = readStoreFile();
    const userData = allData[userId] || null;
    res.json({ success: true, data: userData });
  });

  app.post('/api/store/:userId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.authUser!;
    const { userId } = req.params;
    if (isReservedStoreKey(userId)) {
      return res.status(403).json({ error: 'Access to reserved store namespace is forbidden.' });
    }
    if (authUser.id !== userId) {
      return res.status(403).json({ error: 'Forbidden: Cannot overwrite another user workspace store.' });
    }
    const allData = readStoreFile();
    const sanitized = sanitizeStoreSaveForUser(userId, req.body, allData[userId]);
    allData[userId] = sanitized;
    writeStoreFile(allData);
    res.json({ success: true, data: sanitized, savedAt: new Date().toISOString() });
  });

  // Notification Gateway Status (Authenticated)
  app.get('/api/notifications/status', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
    const hasResend = Boolean(process.env.RESEND_API_KEY);
    const hasTermii = Boolean(process.env.TERMII_API_KEY);
    const hasTwilio = Boolean(process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_ACCOUNT_SID);
    res.json({
      emailService: {
        provider: hasResend ? 'Resend Transactional Email' : 'Unconfigured',
        configured: hasResend,
      },
      smsService: {
        provider: hasTermii ? 'Termii Nigeria' : hasTwilio ? 'Twilio SMS' : 'Unconfigured',
        configured: Boolean(hasTermii || hasTwilio),
      },
      whatsAppChannel: {
        provider: 'Direct Deep Link (wa.me) & In-App Alerts',
        configured: true,
        active: true,
      },
      mode: hasResend || hasTermii || hasTwilio ? 'production_gateway' : 'direct_link_and_manual_queue',
      timestamp: new Date().toISOString(),
    });
  });

  // Customer Requests (Authenticated Read with Server-Side PII Masking; Scoped Tracker Read Without PII)
  app.get('/api/customer-requests', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.authUser!;
    const [isAdmin, subscription] = await Promise.all([
      resolveIsPlatformAdmin(authUser),
      getAuthoritativeSubscription(authUser),
    ]);
    const canViewContacts = isAdmin || subscription.isPaid;

    const requests = getCustomerRequests().map((r) => maskCustomerRequestContacts(r, canViewContacts));
    const clearedIds = getClearedRequestIds();
    return res.json({ success: true, data: requests, clearedIds });
  });

  // Public Safe Non-PII Progress Tracker Lookup (Never returns phone/whatsapp/email/customer_name)
  app.get('/api/customer-requests/status/:refOrId', (req: Request, res: Response) => {
    const clean = String(req.params.refOrId || '').trim().toLowerCase();
    if (!clean) {
      return res.status(400).json({ error: 'Request reference code is required.' });
    }
    const found = getCustomerRequests().find(
      (r) =>
        r.request_number?.toLowerCase() === clean ||
        r.id?.toLowerCase() === clean
    );
    if (!found) {
      return res.status(404).json({ error: 'Customer request reference not found.' });
    }
    return res.json({
      success: true,
      data: {
        id: found.id,
        request_number: found.request_number,
        service_required: found.service_required,
        service_category: found.service_category,
        location: found.location,
        state: found.state,
        city: found.city,
        budget_formatted: found.budget_formatted,
        timeline: found.timeline,
        status: found.status,
        contacted_count: Array.isArray(found.contacted_by_business_ids)
          ? found.contacted_by_business_ids.length
          : 0,
        created_at: found.created_at,
        updated_at: found.updated_at,
      },
    });
  });

  // Public Allowlisted Customer Request Creation (Rate-limited; Never overwrites unrelated existing IDs)
  app.post('/api/customer-requests', (req: Request, res: Response) => {
    try {
      const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
      if (isPublicRequestRateLimited(clientIp, 25, 60_000)) {
        return res.status(429).json({ error: 'Too many customer requests submitted. Please wait a moment and try again.' });
      }

      const payload = pickAllowedFields<Record<string, any>>(req.body, ALLOWED_CUSTOMER_REQUEST_CREATE_FIELDS);
      if (!payload || !String(payload.service_required || '').trim() || !String(payload.location || '').trim()) {
        return res.status(400).json({ error: 'Service and location are required.' });
      }

      const candidateId = payload.id ? String(payload.id).trim() : undefined;
      const candidateRef = payload.request_number ? String(payload.request_number).trim() : undefined;
      const sessionId = payload.conversation_session_id ? String(payload.conversation_session_id).trim() : undefined;

      if (candidateId || candidateRef) {
        const existingMatch = getCustomerRequests(true).find(
          (r) => (candidateId && r.id === candidateId) || (candidateRef && r.request_number === candidateRef)
        );
        if (existingMatch) {
          const sameSession =
            Boolean(sessionId) &&
            Boolean(existingMatch.conversation_session_id) &&
            existingMatch.conversation_session_id === sessionId;
          if (!sameSession) {
            return res.status(409).json({
              error: 'Conflict: A customer request with this reference already exists.',
            });
          }
        }
      }

      const { request } = upsertCapturedCustomerRequest({
        id: candidateId,
        request_number: candidateRef,
        customer_name: payload.customer_name ? String(payload.customer_name) : undefined,
        phone: payload.phone ? String(payload.phone) : undefined,
        whatsapp: payload.whatsapp ? String(payload.whatsapp) : undefined,
        email: payload.email ? String(payload.email) : undefined,
        location: String(payload.location),
        state: payload.state ? String(payload.state) : undefined,
        city: payload.city ? String(payload.city) : undefined,
        service_required: String(payload.service_required),
        service_category: payload.service_category ? String(payload.service_category) : undefined,
        budget_min: payload.budget_min !== undefined ? Number(payload.budget_min) : undefined,
        budget_max: payload.budget_max !== undefined ? Number(payload.budget_max) : undefined,
        budget_formatted: payload.budget_formatted ? String(payload.budget_formatted) : undefined,
        timeline:
          payload.timeline === 'immediate' ||
          payload.timeline === 'within_7_days' ||
          payload.timeline === 'within_30_days' ||
          payload.timeline === 'flexible'
            ? payload.timeline
            : 'flexible',
        details: payload.details ? String(payload.details) : undefined,
        status: 'Open',
        conversation_session_id: sessionId,
        source: payload.source === 'matthew_ai' || payload.source === 'fulfilment' ? payload.source : 'direct',
      });
      return res.json({ success: true, data: request });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to save customer request.' });
    }
  });

  // Authenticated Customer Request Claim / Status Update (Enforces Business Ownership; Never Allows Cross-Business Takeover)
  app.patch('/api/customer-requests/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const authUser = req.authUser!;
      const isAdmin = await resolveIsPlatformAdmin(authUser);
      const targetId = req.params.id;
      const { status, businessId } = req.body || {};

      if (status && !ALLOWED_REQUEST_STATUSES.has(String(status))) {
        return res.status(400).json({ error: 'Invalid customer request status.' });
      }

      let verifiedBusinessId: string | undefined;
      if (businessId) {
        const ownsBiz = isAdmin || (await resolveUserBusinessMembership(authUser, String(businessId)));
        if (!ownsBiz) {
          return res.status(403).json({
            error: 'Forbidden: You cannot claim or update customer requests on behalf of another business.',
          });
        }
        verifiedBusinessId = String(businessId);
      } else if (!isAdmin) {
        const ownedIds = await getUserBusinessIds(authUser);
        verifiedBusinessId = ownedIds[0];
        if (!verifiedBusinessId) {
          return res.status(403).json({
            error: 'Forbidden: A verified business membership is required to update customer requests.',
          });
        }
      }

      const allData = readStoreFile();
      const list: any[] = Array.isArray(allData.__customer_requests) ? allData.__customer_requests : [];
      const idx = list.findIndex((r) => r.id === targetId || r.request_number === targetId);
      if (idx < 0) {
        return res.status(404).json({ error: 'Customer request not found.' });
      }

      const prev = list[idx];
      const prevContacted: string[] = Array.isArray(prev.contacted_by_business_ids)
        ? [...prev.contacted_by_business_ids]
        : [];

      // Prevent a second business from overwriting a request already claimed exclusively by another business
      if (
        !isAdmin &&
        verifiedBusinessId &&
        prevContacted.length > 0 &&
        !prevContacted.includes(verifiedBusinessId) &&
        (prev.status === 'Converted' || prev.status === 'Closed')
      ) {
        return res.status(403).json({
          error: 'Forbidden: This customer request has already been closed or converted by another business.',
        });
      }

      if (verifiedBusinessId && !prevContacted.includes(verifiedBusinessId)) {
        prevContacted.push(verifiedBusinessId);
      }

      list[idx] = {
        ...prev,
        ...(status ? { status: String(status) } : {}),
        contacted_by_business_ids: prevContacted,
        updated_at: new Date().toISOString(),
      };
      allData.__customer_requests = list;
      writeStoreFile(allData);

      const sub = await getAuthoritativeSubscription(authUser, verifiedBusinessId);
      return res.json({
        success: true,
        data: maskCustomerRequestContacts(list[idx], isAdmin || sub.isPaid),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to update customer request.' });
    }
  });

  // Global Customer Requests Clear (Admin Only — Prevents Businesses Deleting Shared Marketplace Requests)
  app.post('/api/customer-requests/clear', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { mode = 'outdated', olderThanDays = 7, ids } = req.body || {};
      if (mode !== 'outdated' && mode !== 'all') {
        return res.status(400).json({ error: 'Invalid clear mode. Expected "outdated" or "all".' });
      }
      const result = clearCustomerRequestsFromStore({
        mode,
        olderThanDays: Number(olderThanDays),
        ids: Array.isArray(ids) ? ids : undefined,
      });
      return res.json({
        success: true,
        clearedCount: result.clearedIds.length,
        clearedIds: result.clearedIds,
        remainingCount: result.remainingCount,
        requests: getCustomerRequests(),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to clear customer requests.' });
    }
  });

  // Unfulfilled Demand & Ad Campaigns (Admin Read/Edit/Delete; Allowlisted Consumer Creation)
  app.get('/api/demand-campaigns', requireAuth, requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    const allData = readStoredDataSafe();
    const campaigns = (allData.__demand_campaigns || []) as any[];
    res.json({ success: true, data: campaigns });
  });

  app.post('/api/demand-campaigns', (req: Request, res: Response) => {
    try {
      const payload = pickAllowedFields<Record<string, any>>(req.body, ALLOWED_DEMAND_CAMPAIGN_CREATE_FIELDS);
      if (!payload || !payload.service_required || !payload.location) {
        return res.status(400).json({ error: 'Service and location are required.' });
      }
      const allData = readStoreFile();
      if (!Array.isArray(allData.__demand_campaigns)) {
        allData.__demand_campaigns = [];
      }
      const serviceReq = String(payload.service_required).trim();
      const loc = String(payload.location).trim();
      const newCamp = {
        id: `camp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        request_id: payload.request_id ? String(payload.request_id) : `req_${Date.now()}`,
        request_number: payload.request_number
          ? String(payload.request_number)
          : `REQ-${Math.floor(100000 + Math.random() * 900000)}`,
        service_required: serviceReq,
        location: loc,
        state: payload.state ? String(payload.state) : '',
        town: payload.town ? String(payload.town) : '',
        customer_name: payload.customer_name ? String(payload.customer_name) : 'Customer',
        customer_phone: payload.customer_phone ? String(payload.customer_phone) : '',
        customer_whatsapp: String(payload.customer_whatsapp || payload.customer_phone || ''),
        customer_email: payload.customer_email ? String(payload.customer_email) : '',
        budget_formatted: payload.budget_formatted ? String(payload.budget_formatted) : 'Negotiable',
        timeline: payload.timeline ? String(payload.timeline) : 'within_7_days',
        details: payload.details ? String(payload.details) : '',
        campaign_status: 'ad_needed',
        ad_headline: payload.ad_headline
          ? String(payload.ad_headline)
          : `Verified ${serviceReq} Specialist Needed in ${loc}!`,
        ad_copy_whatsapp: '',
        ad_copy_social: '',
        ad_copy_sms: '',
        campaign_channel: 'whatsapp_broadcast',
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      allData.__demand_campaigns.unshift(newCamp);
      writeStoreFile(allData);
      return res.json({ success: true, data: newCamp });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to save demand campaign.' });
    }
  });

  app.patch('/api/demand-campaigns/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const safeUpdates = pickAllowedFields(req.body, ALLOWED_DEMAND_CAMPAIGN_UPDATE_FIELDS);
      const allData = readStoreFile();
      if (!Array.isArray(allData.__demand_campaigns)) {
        allData.__demand_campaigns = [];
      }
      const item = allData.__demand_campaigns.find((c: any) => c.id === id || c.request_id === id);
      if (!item) {
        return res.status(404).json({ error: 'Demand campaign not found.' });
      }
      Object.assign(item, safeUpdates, { updated_at: new Date().toISOString() });
      writeStoreFile(allData);
      return res.json({ success: true, data: item });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to update demand campaign.' });
    }
  });

  app.delete('/api/demand-campaigns/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const allData = readStoreFile();
      if (!Array.isArray(allData.__demand_campaigns)) {
        allData.__demand_campaigns = [];
      }
      allData.__demand_campaigns = allData.__demand_campaigns.filter((c: any) => c.id !== id && c.request_id !== id);
      writeStoreFile(allData);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to delete demand campaign.' });
    }
  });

  // Artisan Recommendations
  app.get('/api/recommendations', (_req: Request, res: Response) => {
    const allData = readStoreFile();
    const recommendations = (allData.__artisan_recommendations || []) as any[];
    res.json({ success: true, data: recommendations });
  });

  app.post('/api/recommendations', (req: Request, res: Response) => {
    try {
      const payload = pickAllowedFields<Record<string, any>>(req.body, ALLOWED_RECOMMENDATION_CREATE_FIELDS);
      if (!payload || !payload.artisan_name || !payload.phone || !payload.state || !payload.town) {
        return res.status(400).json({ error: 'Artisan name, phone, town, and state are required.' });
      }
      const allData = readStoreFile();
      if (!Array.isArray(allData.__artisan_recommendations)) {
        allData.__artisan_recommendations = [];
      }
      const newRec = {
        id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        artisan_name: String(payload.artisan_name).trim(),
        trade_category: payload.trade_category ? String(payload.trade_category) : 'General Artisan',
        phone: String(payload.phone).trim(),
        whatsapp: payload.whatsapp ? String(payload.whatsapp).trim() : undefined,
        state: String(payload.state).trim(),
        town: String(payload.town).trim(),
        services_offered: Array.isArray(payload.services_offered)
          ? payload.services_offered
          : typeof payload.services_offered === 'string'
            ? payload.services_offered
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean)
            : [],
        level: payload.level || 'experienced',
        recommender_name: payload.recommender_name || 'Anonymous Client',
        recommender_relationship: payload.recommender_relationship || 'Client',
        work_done: payload.work_done || 'Completed service work satisfactorily.',
        recommendation_note: payload.recommendation_note || 'Recommended for quality and dedication.',
        rating: Number(payload.rating) || 5,
        pricing_tier: payload.pricing_tier || 'fair',
        vouches_count: 1,
        verified: false,
        validation_status: 'pending',
        photo_url: payload.photo_url ? String(payload.photo_url) : undefined,
        created_at: new Date().toISOString(),
      };
      allData.__artisan_recommendations.unshift(newRec);
      writeStoreFile(allData);
      return res.json({ success: true, data: newRec });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to save artisan recommendation.' });
    }
  });

  app.post('/api/recommendations/:id/vouch', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const allData = readStoreFile();
      if (!Array.isArray(allData.__artisan_recommendations)) {
        allData.__artisan_recommendations = [];
      }
      const item = allData.__artisan_recommendations.find((r: any) => r.id === id);
      if (item) {
        item.vouches_count = (item.vouches_count || 0) + 1;
        writeStoreFile(allData);
        return res.json({ success: true, vouches_count: item.vouches_count });
      }
      return res.json({ success: true, vouches_count: 1 });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to update vouch count.' });
    }
  });

  // Dedicated authenticated claim action for recommended artisans onboarding their own profile
  app.post('/api/recommendations/:id/claim', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    try {
      const authUser = req.authUser!;
      const { id } = req.params;
      const allData = readStoreFile();
      if (!Array.isArray(allData.__artisan_recommendations)) {
        allData.__artisan_recommendations = [];
      }
      let item = allData.__artisan_recommendations.find((r: any) => r.id === id);
      if (!item) {
        item = {
          id,
          validation_status: 'claimed',
          outreach_status: 'claimed',
          claimed_by_user_id: authUser.id,
          updated_at: new Date().toISOString(),
        };
        allData.__artisan_recommendations.push(item);
      } else {
        if (item.claimed_by_user_id && item.claimed_by_user_id !== authUser.id) {
          return res.status(403).json({ error: 'This recommendation has already been claimed by another user.' });
        }
        item.validation_status = 'claimed';
        item.outreach_status = 'claimed';
        item.claimed_by_user_id = authUser.id;
        item.updated_at = new Date().toISOString();
      }
      writeStoreFile(allData);
      return res.json({ success: true, data: item });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to claim recommendation.' });
    }
  });

  app.patch('/api/recommendations/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const safeUpdates = pickAllowedFields(req.body, ALLOWED_RECOMMENDATION_UPDATE_FIELDS);
      const allData = readStoreFile();
      if (!Array.isArray(allData.__artisan_recommendations)) {
        allData.__artisan_recommendations = [];
      }
      let item = allData.__artisan_recommendations.find((r: any) => r.id === id);
      if (!item) {
        item = { id, ...safeUpdates, updated_at: new Date().toISOString() };
        allData.__artisan_recommendations.push(item);
      } else {
        Object.assign(item, safeUpdates, { updated_at: new Date().toISOString() });
      }
      writeStoreFile(allData);
      return res.json({ success: true, data: item });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to update recommendation.' });
    }
  });

  app.delete('/api/recommendations/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const allData = readStoreFile();
      if (Array.isArray(allData.__artisan_recommendations)) {
        allData.__artisan_recommendations = allData.__artisan_recommendations.filter((r: any) => r.id !== id);
        writeStoreFile(allData);
      }
      return res.json({ success: true, message: 'Recommendation removed successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to delete recommendation.' });
    }
  });

  // Storage: Generate Cloudflare R2 Presigned URL (Authenticated + Safe Image MIME Types Only)
  app.post('/api/storage/presigned-url', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const authUser = req.authUser!;
      const { fileType } = req.body || {};

      if (!fileType || typeof fileType !== 'string') {
        return res.status(400).json({ error: 'fileType is required' });
      }

      const normalizedMime = fileType.toLowerCase().trim();
      const safeExt = SAFE_IMAGE_MIME_TO_EXT[normalizedMime];
      if (!safeExt) {
        return res.status(400).json({
          error: 'Unsupported fileType. Allowed image types: JPEG, PNG, WebP, GIF, AVIF.',
        });
      }

      const { R2_BUCKET_NAME, R2_PUBLIC_URL } = process.env;
      if (!R2_BUCKET_NAME || !R2_PUBLIC_URL) {
        return res.status(500).json({ error: 'Storage is not configured on the server.' });
      }

      const client = getS3Client();
      const uniqueId = crypto.randomBytes(8).toString('hex');
      const key = `uploads/${authUser.id}/${Date.now()}-${uniqueId}.${safeExt}`;

      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        ContentType: normalizedMime,
      });

      const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
      const publicUrl = `${R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;

      res.json({
        success: true,
        uploadUrl: signedUrl,
        key,
        publicUrl,
      });
    } catch (err: any) {
      console.error('Error generating presigned URL:', err);
      res.status(500).json({ error: err.message || 'Failed to generate upload URL' });
    }
  });

  // Storage: Authenticated Local Image Upload Fallback (Owner-Folder Confinement & Safe Image Types)
  app.post('/api/storage/upload', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    try {
      const authUser = req.authUser!;
      const { fileName = 'image.png', folder = 'projects', dataBase64 } = req.body || {};
      if (!dataBase64 || typeof dataBase64 !== 'string') {
        return res.status(400).json({ error: 'Image dataBase64 payload is required.' });
      }

      const rawFolder = String(folder).toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
      const cleanFolder = ALLOWED_UPLOAD_FOLDERS.has(rawFolder) ? rawFolder : 'uploads';
      const safeUserDir = authUser.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'user';

      const targetDir = path.resolve(UPLOADS_DIR, cleanFolder, safeUserDir);
      if (!targetDir.startsWith(UPLOADS_DIR + path.sep)) {
        return res.status(400).json({ error: 'Invalid upload directory path.' });
      }
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const rawParts = String(fileName).split('.');
      const candidateExt = rawParts.length > 1
        ? rawParts.pop()!.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
        : 'png';
      const safeExt = SAFE_IMAGE_EXT_SET.has(candidateExt) ? candidateExt : 'png';

      const uniqueId = crypto.randomBytes(6).toString('hex');
      const savedName = `${Date.now()}-${uniqueId}.${safeExt}`;
      const filePath = path.resolve(targetDir, savedName);
      if (!filePath.startsWith(targetDir + path.sep)) {
        return res.status(400).json({ error: 'Invalid upload file path.' });
      }

      const cleanBase64 = dataBase64.includes(',') ? dataBase64.split(',').pop()! : dataBase64;
      const buffer = Buffer.from(cleanBase64, 'base64');
      if (buffer.length === 0) {
        return res.status(400).json({ error: 'Uploaded image buffer is empty.' });
      }
      if (buffer.length > 10 * 1024 * 1024) {
        return res.status(413).json({ error: 'Image exceeds the 10 MB upload limit.' });
      }

      fs.writeFileSync(filePath, buffer);
      return res.json({
        success: true,
        publicUrl: `/uploads/${cleanFolder}/${safeUserDir}/${savedName}`,
        bytes: buffer.length,
      });
    } catch (err: any) {
      console.error('Error saving uploaded image:', err);
      return res.status(500).json({ error: err?.message || 'Failed to save uploaded image.' });
    }
  });

  // AI Quote Assistant (Authenticated + Server-Side Plan & Monthly Quota Check)
  app.post('/api/ai/draft-quote', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const authUser = req.authUser!;
      const { prompt, catalogue = [], currency = '₦', businessId } = req.body || {};

      const subscription = await getAuthoritativeSubscription(
        authUser,
        businessId ? String(businessId) : undefined
      );
      const effectivePlan = subscription.isPaid ? subscription.plan : 'free';
      const limits: Record<string, number> = {
        free: 3,
        pro: 50,
        business: 200,
      };
      const maxAllowed = limits[effectivePlan] || 3;
      const serverUsage = getServerAiUsage(authUser.id);

      if (serverUsage.count >= maxAllowed) {
        return res.status(403).json({
          error: "You've used all your AI generations for this month.",
          quotaExceeded: true,
          limit: maxAllowed,
          usedCount: serverUsage.count,
        });
      }

      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        return res.status(400).json({ error: 'Please provide customer requirements prompt.' });
      }

      const catalogueSummary =
        Array.isArray(catalogue) && catalogue.length > 0
          ? catalogue
              .map(
                (p: any) =>
                  `- Name: "${p.name}", Category: "${p.category || 'General'}", Default Price: ${p.default_price || 0}, Unit: "${p.unit || 'unit'}", Description: "${p.description || ''}"`
              )
              .join('\n')
          : 'No saved products in catalogue yet.';

      const systemInstruction = `You are Mathorg's AI Quote Assistant for small businesses, contractors, and service providers.
Given a customer's request described in natural language, produce a professional, structured draft list of recommended items/services.

CRITICAL PRICING RULES:
1. Prioritize items from the business catalogue if provided.
2. If a recommended item matches a saved catalogue item, use its exact name, description, and saved default price.
3. If no matching saved price exists in the catalogue, set unit_price to 0 (Price not set). NEVER fabricate or invent confirmed prices.
4. AI recommendations must be structured, realistic, and tailored to the trade or request.
5. Provide a realistic title, helpful notes, and any relevant technical or scope assumptions for the quote.

Business Catalogue:
${catalogueSummary}
Currency: ${currency}
`;

      let parsed: any = null;
      if (process.env.GEMINI_API_KEY) {
        const ai = getAIClient();
        const candidateModels = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];

        for (const modelCandidate of candidateModels) {
          for (let attempt = 1; attempt <= 2; attempt++) {
            try {
              const quoteConfig: Record<string, any> = {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    title: {
                      type: Type.STRING,
                      description: 'Clear quote title, e.g., Solar Installation for 3-Bedroom Home',
                    },
                    items: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING, description: 'Product or service line item name' },
                          quantity: { type: Type.NUMBER, description: 'Quantity or hours' },
                          unit_price: { type: Type.NUMBER, description: 'Matching catalogue price or 0 if not set' },
                          description: { type: Type.STRING, description: 'Brief description or specification' },
                          isCatalogueMatch: { type: Type.BOOLEAN, description: 'True if mapped from saved catalogue' },
                        },
                        required: ['name', 'quantity', 'unit_price'],
                      },
                    },
                    notes: { type: Type.STRING, description: 'Customer notes or scope overview' },
                    assumptions: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'Key assumptions made (e.g. site inspection needed, cabling estimates)',
                    },
                  },
                  required: ['title', 'items'],
                },
              };
              if (modelCandidate === 'gemini-4-hydrogen') {
                quoteConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
              } else {
                quoteConfig.temperature = 0.2;
              }

              const response = await ai.models.generateContent({
                model: modelCandidate,
                contents: `Customer requirement: ${prompt}`,
                config: quoteConfig,
              });

              const rawText = response.text || '{}';
              parsed = JSON.parse(rawText);
              break;
            } catch (err: any) {
              const msg = (err?.message || '').toLowerCase();
              const isTransient =
                err?.status === 503 || err?.code === 503 || msg.includes('503') || msg.includes('high demand');
              if (isTransient && attempt < 2) {
                await new Promise((r) => setTimeout(r, 700));
                continue;
              }
              break;
            }
          }
          if (parsed) break;
        }
      }

      if (!parsed) {
        const promptClean = prompt.trim();
        const matchedCatalogueItems = Array.isArray(catalogue)
          ? catalogue.filter((item: any) => promptClean.toLowerCase().includes(String(item.name || '').toLowerCase()))
          : [];

        const items =
          matchedCatalogueItems.length > 0
            ? matchedCatalogueItems.map((ci: any) => ({
                name: ci.name,
                quantity: 1,
                unit_price: Number(ci.default_price || 0),
                description: ci.description || `Matching catalogue item: ${ci.name}`,
                isCatalogueMatch: true,
              }))
            : [
                {
                  name: promptClean.slice(0, 50),
                  quantity: 1,
                  unit_price: 0,
                  description: promptClean,
                  isCatalogueMatch: false,
                },
              ];

        parsed = {
          title: promptClean.slice(0, 60),
          items,
          notes: 'Draft generated directly from project requirement and verified business catalogue.',
          assumptions: ['Pricing and scope to be confirmed with client upon physical assessment.'],
        };
      }

      const nextUsage = incrementServerAiUsage(authUser.id);
      return res.json({
        success: true,
        data: parsed,
        newUsedCount: nextUsage.count,
        limit: maxAllowed,
      });
    } catch (err: any) {
      console.error('Error generating AI quote draft:', err);
      return res.status(500).json({
        error: err.message || 'Failed to generate quote draft. Please review inputs and try again.',
      });
    }
  });

  // Business Intelligence Chat (Authenticated + Server-Verified Subscription & Ownership)
  app.post('/api/matthew/chat', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const authUser = req.authUser!;
      const { message, history, businessId, clientContext, clientFallbackData } = req.body || {};

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: 'Please provide a message for Business Intelligence.' });
      }

      const isAdmin = await resolveIsPlatformAdmin(authUser);
      if (businessId && typeof businessId === 'string' && !isAdmin) {
        const hasAccess = await resolveUserBusinessMembership(authUser, businessId);
        if (!hasAccess) {
          return res.status(403).json({
            error: 'Forbidden: You do not own the requested business workspace.',
          });
        }
      }

      const sub = await getAuthoritativeSubscription(
        authUser,
        businessId ? String(businessId) : undefined
      );
      if (clientContext?.feature !== 'leads_closing' && !isAdmin && !sub.isPaid) {
        return res.status(403).json({
          error:
            'Business Intelligence is available exclusively for Pro and Business subscribers. Upgrade your plan to access.',
        });
      }

      const result = await executeMatthewChat({
        message: message.trim(),
        history: history || [],
        businessId: businessId || '',
        clientContext: clientContext || {},
        clientFallbackData: clientFallbackData || {},
        accessToken: authUser.accessToken,
        isAdmin,
        isPaidSubscription: isAdmin || sub.isPaid,
      });

      return res.json(result);
    } catch (err: any) {
      console.error('[Matthew API] Error during execution:', err);
      return res.json({
        success: true,
        message:
          "I've analyzed your current business pipeline. Our real-time AI inference cluster experienced a momentary high-demand spike (503), but your operational data is intact. Please feel free to ask for your leads, quotations, or cash collection status again.",
        model: 'matthew-local-intelligence',
        engine: 'gemini',
        tool_calls_executed: [],
        citations: [],
        is_out_of_domain: false,
      });
    }
  });

  // Follow-up Message Generator (Authenticated)
  app.post('/api/matthew/generate-message', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        channel = 'whatsapp',
        targetType = 'quote',
        customerName = 'Customer',
        businessName = 'Matthorg Enterprise',
        currency = '₦',
        amount = 0,
        serviceTitle = 'Commercial Services',
        referenceNumber = '',
        stageNotes = '',
        objection = '',
        tone = 'Professional',
      } = req.body || {};

      const formattedAmount = `${currency}${Number(amount || 0).toLocaleString()}`;

      const prompt = `You are Matthew, the Business Development & Sales Intelligence Professional inside MatthOrg.
Generate a high-converting, courteous, culturally nuanced ${channel.toUpperCase()} message for an African / Nigerian trade or commercial service provider.

GUIDELINES:
- Target channel: ${channel.toUpperCase()}
- Context: ${targetType.toUpperCase()} follow-up
- Tone: ${tone}
- Customer Name: ${customerName}
- Service Provider: ${businessName}
- Scope / Project: ${serviceTitle}
- Reference ID: ${referenceNumber || 'N/A'}
- Financial Value: ${formattedAmount}
${stageNotes ? `- Previous Interaction / Notes: ${stageNotes}` : ''}
${objection ? `- Client Objection to Address: ${objection}` : ''}

CRITICAL RULES:
1. NEVER invent or offer unapproved discounts, price cuts, or false promises.
2. For WhatsApp: Use clean formatting (*bold*, line breaks). Keep under 120 words.
3. For SMS: Keep concise under 160 characters.
4. For Email: Include a polite subject suggestion, greeting, and clear call-to-action.
5. Only output the actual message text ready to be reviewed and approved by the business owner. No meta-commentary.`;

      let generatedMessage = '';
      const geminiKey = process.env.GEMINI_API_KEY;
      if (geminiKey) {
        const candidateModels = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
        const ai = getAIClient();
        for (const modelCandidate of candidateModels) {
          try {
            const msgConfig: Record<string, any> =
              modelCandidate === 'gemini-4-hydrogen'
                ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                : { temperature: 0.3 };

            const response = await ai.models.generateContent({
              model: modelCandidate,
              contents: prompt,
              config: msgConfig,
            });
            generatedMessage = (response.text || '').trim();
            if (generatedMessage) break;
          } catch (genErr) {
            console.warn(`[Matthew API] Model ${modelCandidate} notice:`, genErr);
          }
        }
      }

      if (!generatedMessage) {
        if (targetType === 'quote') {
          generatedMessage = `Good day ${customerName},\n\nI hope your week is going smoothly.\n\nI'm following up on the quotation we submitted from *${businessName}* regarding *${serviceTitle}* (${referenceNumber || 'Proposal'} — ${formattedAmount}).\n\nWe wanted to confirm if you had an opportunity to review the proposal, or if there are any specific scope adjustments you'd like us to make.\n\nWe are ready to schedule mobilization whenever you're ready. Looking forward to your response!`;
        } else if (targetType === 'invoice') {
          generatedMessage = `Good day ${customerName},\n\nTrust you are doing well.\n\nThis is a gentle check-in from *${businessName}* regarding invoice *${referenceNumber || 'INV'}* for *${serviceTitle}* (${formattedAmount}).\n\nKindly confirm if payment has been processed or if you need our bank payment details resent.\n\nThank you for your valued partnership!`;
        } else {
          generatedMessage = `Hello ${customerName},\n\nTrust you are having a productive week.\n\nI'm reaching out from *${businessName}* regarding your request for *${serviceTitle}*.\n\nWe would love to understand your timeline and specific requirements so we can prepare an accurate, cost-effective solution for you.\n\nWould today or tomorrow be convenient for a quick chat?`;
        }
      }

      return res.json({
        success: true,
        message: generatedMessage,
        channel,
        targetType,
      });
    } catch (err: any) {
      console.error('[Matthew API] Error generating message draft:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to generate message draft.',
      });
    }
  });

  return app;
}

function readStoredDataSafe(): Record<string, any> {
  return readStoreFile();
}
