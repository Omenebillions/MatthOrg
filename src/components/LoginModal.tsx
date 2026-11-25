import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  LogIn,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Building,
  Briefcase,
  Phone,
  Sparkles,
  Loader2,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';
import { supabase, ensureSupabase } from '../lib/supabase';
import { BUSINESS_INDUSTRIES, NIGERIAN_STATES } from '../data/businessIndustries';
import { BrandLogo } from './common/BrandLogo';
import { validateAndNormalizeNigerianPhone } from '../utils/nigerianPhone';
import { sendNigerianPhoneOtp, verifyNigerianPhoneOtp } from '../lib/authPhone';
import { getPendingReferral } from '../lib/referrals';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGuestAccess?: () => void;
  onLoginSuccess?: (session: any, registeredBiz?: any) => void;
  initialMode?: 'login' | 'register';
  initialBusinessName?: string;
  initialFullName?: string;
  allowOptionalBusinessName?: boolean;
  claimSubmittedListing?: boolean;
  continuationNotice?: string;
  initialPhone?: string;
  initialTrade?: string;
  initialState?: string;
  initialCity?: string;
  claimNotice?: string;
  claimRecommendationId?: string;
}

export function LoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
  initialBusinessName,
  initialFullName,
  allowOptionalBusinessName = false,
  claimSubmittedListing = false,
  continuationNotice,
  initialPhone,
  initialTrade,
  initialState,
  initialCity,
  claimNotice,
}: LoginModalProps) {
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(initialMode !== 'register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [smsProviderUnavailable, setSmsProviderUnavailable] = useState(false);

  // SMS OTP verification states
  const [otpStep, setOtpStep] = useState<'input' | 'verify'>('input');
  const [otpCode, setOtpCode] = useState('');
  const [otpPhoneE164, setOtpPhoneE164] = useState('');
  const [otpPhoneDisplay, setOtpPhoneDisplay] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Business / Artisan Categorization States for standalone registration
  const [businessName, setBusinessName] = useState(initialBusinessName || '');
  const [fullName, setFullName] = useState(initialFullName || '');
  const [selectedIndustry, setSelectedIndustry] = useState(BUSINESS_INDUSTRIES[0].name);
  const [specialization, setSpecialization] = useState(
    initialTrade || BUSINESS_INDUSTRIES[0].defaultSpecializations[0]
  );
  const [phone, setPhone] = useState(initialPhone || '');
  const [businessState, setBusinessState] = useState(initialState || 'Lagos State');
  const [city, setCity] = useState(initialCity || 'Lagos');

  const isFromBusinessFunnel = Boolean(allowOptionalBusinessName && continuationNotice);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Initialize fields & saved preferences on open
  useEffect(() => {
    if (isOpen) {
      setIsLogin(initialMode !== 'register');
      const savedEmail = localStorage.getItem('mathorg_last_email') || '';
      const savedPhone = localStorage.getItem('mathorg_last_phone') || '';
      const lastMethod = localStorage.getItem('mathorg_last_auth_method');

      setEmail(savedEmail);
      setPassword('');
      setError(null);
      setSuccessNotice(null);
      setSmsProviderUnavailable(false);
      setOtpStep('input');
      setOtpCode('');
      setOtpPhoneE164('');
      setOtpPhoneDisplay('');
      setResendCooldown(0);

      // Default to Phone Number (SMS OTP) for registration/claim/business continuation,
      // or when phone was last used; preserve Email default for returning email users.
      if (
        initialPhone ||
        continuationNotice ||
        claimNotice ||
        initialMode === 'register' ||
        lastMethod === 'phone'
      ) {
        setAuthMethod('phone');
      } else if (savedEmail && lastMethod === 'email') {
        setAuthMethod('email');
      } else {
        setAuthMethod('phone');
      }

      if (initialBusinessName !== undefined) setBusinessName(initialBusinessName);
      if (initialFullName !== undefined) setFullName(initialFullName);
      if (initialPhone !== undefined) {
        setPhone(initialPhone);
      } else if (savedPhone && !phone) {
        setPhone(savedPhone);
      }
      if (initialTrade !== undefined) {
        setSpecialization(initialTrade);
        const matched = BUSINESS_INDUSTRIES.find(
          (b) =>
            b.name.toLowerCase().includes(initialTrade.toLowerCase()) ||
            b.defaultSpecializations.some((s) =>
              s.toLowerCase().includes(initialTrade.toLowerCase())
            )
        );
        if (matched) setSelectedIndustry(matched.name);
      }
      if (initialState !== undefined) setBusinessState(initialState);
      if (initialCity !== undefined) setCity(initialCity);
    }
  }, [
    isOpen,
    initialMode,
    initialBusinessName,
    initialFullName,
    initialPhone,
    initialTrade,
    initialState,
    initialCity,
    continuationNotice,
    claimNotice,
  ]);

  if (!isOpen) return null;

  const handleIndustryChange = (indName: string) => {
    setSelectedIndustry(indName);
    const found = BUSINESS_INDUSTRIES.find((b) => b.name === indName);
    if (found && found.defaultSpecializations.length > 0) {
      setSpecialization(found.defaultSpecializations[0]);
    }
  };

  const buildRegistrationMetadata = (normalizedPhone?: string) => {
    const cleanFullName =
      fullName.trim() || initialFullName?.trim() || businessName.trim() || 'MatthOrg Partner';
    const cleanBusinessName =
      businessName.trim() || initialBusinessName?.trim() || cleanFullName;
    const cleanSpec = (specialization || initialTrade || selectedIndustry).trim();
    const cleanState = businessState || initialState || 'Lagos State';
    const cleanCity = (city || initialCity || 'Lagos').trim();
    const pendingRef = getPendingReferral();

    return {
      full_name: cleanFullName,
      business_name: cleanBusinessName,
      phone: normalizedPhone || phone.trim(),
      state: cleanState,
      city: cleanCity,
      industry: selectedIndustry,
      specialization: cleanSpec,
      services: Array.from(new Set([cleanSpec, selectedIndustry].filter(Boolean))),
      ...(pendingRef?.code ? { referral_code: pendingRef.code } : {}),
    };
  };

  const handleSendPhoneOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessNotice(null);
    setSmsProviderUnavailable(false);

    const phoneCheck = validateAndNormalizeNigerianPhone(phone);
    if (!phoneCheck.isValid) {
      setError(phoneCheck.error || 'Please enter a valid Nigerian phone number (e.g. 0803 123 4567).');
      return;
    }

    if (!isLogin && !isFromBusinessFunnel) {
      if (!businessName.trim() && !fullName.trim()) {
        setError('Please enter your full name or business/brand name.');
        return;
      }
    }

    setLoading(true);
    try {
      const metadata = isLogin ? { phone: phoneCheck.normalizedE164 } : buildRegistrationMetadata(phoneCheck.normalizedE164);
      const res = await sendNigerianPhoneOtp({
        phone: phoneCheck.normalizedE164,
        metadata,
      });

      if (!res.sent) {
        if (!res.providerConfigured) {
          setSmsProviderUnavailable(true);
        }
        setError(res.error || 'Could not send verification code to this phone number.');
        return;
      }

      try {
        localStorage.setItem('mathorg_last_phone', phoneCheck.display);
        localStorage.setItem('mathorg_last_auth_method', 'phone');
      } catch {
        // ignore
      }

      setOtpPhoneE164(res.normalizedPhone);
      setOtpPhoneDisplay(res.displayPhone);
      setOtpStep('verify');
      setOtpCode('');
      setResendCooldown(60);
      setSuccessNotice(`We sent a 6-digit SMS verification code to ${res.displayPhone}.`);
    } catch (err: any) {
      setError(err?.message || 'Could not start phone verification. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const targetPhone = otpPhoneE164 || phone;
    setLoading(true);
    try {
      const res = await verifyNigerianPhoneOtp({
        phone: targetPhone,
        token: otpCode,
      });

      if (!res.verified || !res.session) {
        setError(res.error || 'Invalid or expired verification code.');
        return;
      }

      const meta = buildRegistrationMetadata(res.normalizedPhone);
      const bizPayload = !isLogin
        ? meta
        : {
            phone: res.normalizedPhone,
          };

      if (onLoginSuccess) {
        onLoginSuccess(res.session, bizPayload);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Phone OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!isLogin && !isFromBusinessFunnel) {
      if (!businessName.trim() && !fullName.trim() && !allowOptionalBusinessName) {
        setError('Please enter your business, brand, or full name.');
        return;
      }
      const phoneCheck = validateAndNormalizeNigerianPhone(phone);
      if (!phoneCheck.isValid) {
        setError(phoneCheck.error || 'Please enter a valid Nigerian phone or WhatsApp number.');
        return;
      }
    }

    setLoading(true);
    setError(null);
    setSuccessNotice(null);

    try {
      const client = supabase || (await ensureSupabase());
      if (!client) {
        setError('Authentication client is unavailable. Please reload the page.');
        return;
      }

      localStorage.setItem('mathorg_last_email', email.trim());
      localStorage.setItem('mathorg_last_auth_method', 'email');

      if (isLogin) {
        const { data, error: signInErr } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInErr) {
          setError(
            signInErr.message ||
              'Invalid email or password. Please verify your credentials or register a new account.'
          );
          return;
        }

        if (data?.session) {
          if (onLoginSuccess) {
            onLoginSuccess(data.session);
          }
          onClose();
          return;
        }
      } else {
        const phoneCheck = phone.trim() ? validateAndNormalizeNigerianPhone(phone) : null;
        const normalizedPhone = phoneCheck?.isValid ? phoneCheck.normalizedE164 : phone.trim();
        const meta = buildRegistrationMetadata(normalizedPhone);
        const effectiveDisplayName =
          meta.business_name || meta.full_name || email.trim().split('@')[0];

        const { data, error: signUpErr } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              ...meta,
              business_name: effectiveDisplayName,
            },
          },
        });

        if (signUpErr) {
          setError(
            signUpErr.message ||
              'Could not register account. Please check your details and try again.'
          );
          return;
        }

        if (data?.session) {
          if (onLoginSuccess) {
            onLoginSuccess(data.session, {
              ...meta,
              business_name: effectiveDisplayName,
              email: email.trim(),
            });
          }
          onClose();
          return;
        } else if (data?.user) {
          setSuccessNotice(
            `Registration successful for ${email.trim()}! Please check your inbox to confirm your email, then sign in.`
          );
          setIsLogin(true);
          return;
        }
      }
    } catch (err: any) {
      console.error('Supabase authentication error:', err);
      setError(err?.message || 'Authentication error. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B192C]/75 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${
          isLogin || isFromBusinessFunnel ? 'max-w-md' : 'max-w-lg'
        } rounded-[32px] bg-white border border-[#E5E9F0] shadow-2xl overflow-hidden relative my-4 max-h-[92vh] flex flex-col`}
      >
        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
          {/* Header */}
          <div className="flex justify-between items-center mb-5 gap-3">
            <div className="flex items-center gap-3">
              <BrandLogo size="md" showText={false} />
              <div>
                <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-[#0B192C] tracking-tight">
                  {isLogin ? 'Sign In to MatthOrg' : 'Create Your MatthOrg Account'}
                </h2>
                <p className="text-[14px] text-[#5B6D85] mt-0.5">
                  {isLogin
                    ? 'Sign in with your phone number or email address'
                    : 'Register with your Nigerian phone number — email optional'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0B192C] text-[14px] font-bold transition cursor-pointer shrink-0 whitespace-nowrap"
              title="Close"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>

          {/* Primary Mode Switcher (Sign In / Register) */}
          <div className="grid grid-cols-2 p-1 bg-[#F4F7FB] border border-[#E5E9F0] rounded-2xl mb-4">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError(null);
                setSuccessNotice(null);
                setOtpStep('input');
              }}
              className={`py-2.5 text-[15px] font-bold rounded-xl transition cursor-pointer whitespace-nowrap ${
                isLogin ? 'bg-white text-[#0B192C] shadow-xs' : 'text-[#5B6D85] hover:text-[#0B192C]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError(null);
                setSuccessNotice(null);
                setOtpStep('input');
              }}
              className={`py-2.5 text-[15px] font-bold rounded-xl transition cursor-pointer whitespace-nowrap ${
                !isLogin ? 'bg-white text-[#0B192C] shadow-xs' : 'text-[#5B6D85] hover:text-[#0B192C]'
              }`}
            >
              Register Free
            </button>
          </div>

          {/* Identifier Switcher: Phone Number (OTP) vs Email & Password */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('phone');
                setError(null);
                setSuccessNotice(null);
                setSmsProviderUnavailable(false);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-[14px] font-bold transition cursor-pointer whitespace-nowrap ${
                authMethod === 'phone'
                  ? 'bg-[#0B192C] text-white border-[#0B192C] shadow-xs'
                  : 'bg-[#F8FAFC] text-[#5B6D85] border-[#E5E9F0] hover:text-[#0B192C]'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>Phone Number</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('email');
                setError(null);
                setSuccessNotice(null);
                setOtpStep('input');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-[14px] font-bold transition cursor-pointer whitespace-nowrap ${
                authMethod === 'email'
                  ? 'bg-[#0B192C] text-white border-[#0B192C] shadow-xs'
                  : 'bg-[#F8FAFC] text-[#5B6D85] border-[#E5E9F0] hover:text-[#0B192C]'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Email &amp; Password</span>
            </button>
          </div>

          {/* Continuation Notice from /business (preserves all 7 fields without re-entry) */}
          {continuationNotice && (
            <div className="mb-4 p-4 rounded-2xl bg-[#F4F7FB] border border-[#CBD5E1] text-[#0B192C] text-[14px] space-y-1.5">
              <strong className="font-heading block font-bold text-[#0B192C]">
                {claimSubmittedListing
                  ? 'Claim & Update Your MatthOrg Profile'
                  : 'Publish Your MatthOrg Listing'}
              </strong>
              <p className="text-[#475569] leading-relaxed">{continuationNotice}</p>
              <div className="pt-1 text-[13px] font-semibold text-[#0B192C]">
                {initialBusinessName || initialFullName} • {initialTrade} • {initialCity}, {initialState}
              </div>
            </div>
          )}

          {/* Artisan Claim Invitation Banner */}
          {claimNotice && !isLogin && (
            <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 text-blue-900 text-[15px]">
              <div className="flex gap-2.5 items-start">
                <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <strong className="font-heading block font-bold text-[#0B192C]">
                    Recommendation Claim
                  </strong>
                  <p className="mt-0.5 text-[14px] text-blue-800 leading-relaxed">{claimNotice}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Notice */}
          {successNotice && (
            <div className="mb-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-[14px]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{successNotice}</span>
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-2.5 text-red-700 text-[14px] font-medium leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <div className="space-y-2">
                <div>{error}</div>
                {smsProviderUnavailable && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod('email');
                      setError(null);
                      setSmsProviderUnavailable(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B192C] text-white text-[13px] font-bold cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Continue with Email &amp; Password</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* PHONE NUMBER (SMS OTP) FLOW */}
          {authMethod === 'phone' ? (
            otpStep === 'verify' ? (
              <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-[#F4F7FB] border border-[#E5E9F0] flex items-center justify-between gap-2 text-[14px]">
                  <div>
                    <span className="text-[#5B6D85] block text-[12px] font-bold uppercase tracking-wider">
                      Verifying Phone Number
                    </span>
                    <span className="font-bold text-[#0B192C]">{otpPhoneDisplay || phone}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep('input');
                      setOtpCode('');
                      setError(null);
                      setSuccessNotice(null);
                    }}
                    className="inline-flex items-center gap-1 text-[13px] font-bold text-[#3D74D9] hover:underline cursor-pointer whitespace-nowrap"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[13px] font-bold uppercase tracking-wider text-[#5B6D85] mb-1.5">
                    6-Digit SMS Verification Code *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#8F9FB5] absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      className="w-full rounded-2xl bg-[#F4F7FB] border border-[#E5E9F0] pl-11 pr-4 py-3 text-[18px] font-bold tracking-[0.25em] text-[#0B192C] placeholder-[#8F9FB5] placeholder:tracking-normal placeholder:font-normal placeholder:text-[15px] focus:bg-white focus:border-[#3D74D9] focus:ring-4 focus:ring-[#3D74D9]/10 focus:outline-none transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.length < 6}
                  className="w-full py-3.5 rounded-2xl bg-[#0B192C] hover:bg-[#152744] text-white font-bold text-base shadow-md transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isFromBusinessFunnel
                          ? claimSubmittedListing
                            ? 'Verify & Claim My Profile'
                            : 'Verify & Publish My Listing'
                          : isLogin
                          ? 'Verify & Sign In'
                          : 'Verify & Enter Workspace'}
                      </span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-[13px] text-[#5B6D85] pt-1">
                  <span>Didn&apos;t receive the SMS?</span>
                  <button
                    type="button"
                    disabled={loading || resendCooldown > 0}
                    onClick={() => handleSendPhoneOtp()}
                    className="font-bold text-[#3D74D9] hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                {!isLogin && !isFromBusinessFunnel && (
                  <>
                    <div>
                      <label className="block text-[13px] font-bold uppercase tracking-wider text-[#5B6D85] mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full rounded-2xl bg-[#F4F7FB] border border-[#E5E9F0] px-4 py-3 text-[15px] text-[#0B192C] placeholder-[#8F9FB5] focus:bg-white focus:border-[#3D74D9] focus:outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] font-bold uppercase tracking-wider text-[#5B6D85] mb-1.5">
                        Business or Brand Name (Optional)
                      </label>
                      <div className="relative">
                        <Building className="w-4 h-4 text-[#8F9FB5] absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="e.g. Tunde Electricals (optional)"
                          className="w-full rounded-2xl bg-[#F4F7FB] border border-[#E5E9F0] pl-11 pr-4 py-3 text-[15px] text-[#0B192C] placeholder-[#8F9FB5] focus:bg-white focus:border-[#3D74D9] focus:outline-none transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[13px] font-bold uppercase tracking-wider text-[#5B6D85] mb-1.5">
                          Trade / Category *
                        </label>
                        <div className="relative">
                          <Briefcase className="w-4 h-4 text-[#8F9FB5] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <select
                            value={selectedIndustry}
                            onChange={(e) => handleIndustryChange(e.target.value)}
                            className="w-full rounded-2xl bg-[#F4F7FB] border border-[#E5E9F0] pl-10 pr-4 py-2.5 text-[14px] text-[#0B192C] focus:bg-white focus:border-[#3D74D9] focus:outline-none cursor-pointer"
                          >
                            {BUSINESS_INDUSTRIES.map((ind) => (
                              <option key={ind.name} value={ind.name}>
                                {ind.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[13px] font-bold uppercase tracking-wider text-[#5B6D85] mb-1.5">
                          What You Do *
                        </label>
                        <input
                          type="text"
                          required
                          value={specialization}
                          onChange={(e) => setSpecialization(e.target.value)}
                          placeholder="e.g. Tailor, Plumber"
                          className="w-full rounded-2xl bg-[#F4F7FB] border border-[#E5E9F0] px-3.5 py-2.5 text-[14px] text-[#0B192C] focus:bg-white focus:border-[#3D74D9] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[13px] font-bold uppercase tracking-wider text-[#5B6D85] mb-1.5">
                          State *
                        </label>
                        <select
                          value={businessState}
                          onChange={(e) => setBusinessState(e.target.value)}
                          className="w-full rounded-2xl bg-[#F4F7FB] border border-[#E5E9F0] px-3.5 py-2.5 text-[14px] text-[#0B192C] focus:bg-white focus:border-[#3D74D9] focus:outline-none cursor-pointer"
                        >
                          {NIGERIAN_STATES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[13px] font-bold uppercase tracking-wider text-[#5B6D85] mb-1.5">
                          Town / City *
                        </label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Ikeja, Wuse 2"
                          className="w-full rounded-2xl bg-[#F4F7FB] border border-[#E5E9F0] px-3.5 py-2.5 text-[14px] text-[#0B192C] focus:bg-white focus:border-[#3D74D9] focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[13px] font-bold uppercase tracking-wider text-[#5B6D85] mb-1.5">
                    Nigerian Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#8F9FB5] absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      inputMode="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0803 123 4567 or +234 803 123 4567"
                      className="w-full rounded-2xl bg-[#F4F7FB] border border-[#E5E9F0] pl-11 pr-4 py-3 text-[15px] text-[#0B192C] placeholder-[#8F9FB5] focus:bg-white focus:border-[#3D74D9] focus:ring-4 focus:ring-[#3D74D9]/10 focus:outline-none transition"
                    />
                  </div>
                  <p className="text-[13px] text-[#5B6D85] mt-1.5">
                    We normalize Nigerian numbers to +234 and send a 6-digit SMS verification code. No email required.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-[#0B192C] hover:bg-[#152744] text-white font-bold text-base shadow-md transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2.5 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>Sending SMS Verification Code...</span>
                    </>
                  ) : (
                    <>
                      <Phone className="w-4 h-4 text-cyan-400" />
                      <span>
                        {isFromBusinessFunnel
                          ? claimSubmittedListing
                            ? 'Send Verification Code & Claim'
                            : 'Send Verification Code & Publish'
                          : isLogin
                          ? 'Send SMS Login Code'
                          : 'Send SMS Verification Code'}
                      </span>
                    </>
                  )}
                </button>
              </form>
            )
          ) : (
            /* EMAIL & PASSWORD FLOW */
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {!isLogin && !isFromBusinessFunnel && (
                <>
                  <div>
                    <label className="block text-[13px] font-bold uppercase tracking-wider text-[#5B6D85] mb-1.5">
                      {allowOptionalBusinessName
                        ? 'Business or Brand Name (Optional)'
                        : 'Business / Brand / Full Name *'}
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-[#8F9FB5] absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required={!allowOptionalBusinessName && !initialFullName}
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder={
                          allowOptionalBusinessName
                            ? 'Business, brand or trading name (optional)'
                            : 'e.g. Apex Power Systems or Tunde Adebayo'
                        }
                        className="w-full rounded-2xl bg-[#F4F7FB] border border-[#E5E9F0] pl-11 pr-4 py-3 text-[15px] text-[#0B192C] placeholder-[#8F9FB5] focus:bg-white focus:border-[#3D74D9] focus:ring-4 focus:ring-[#3D74D9]/10 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold uppercase tracking-wider text-[#5B6D85] mb-1.5">
                      Primary Trade / Industry *
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-[#8F9FB5] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={selectedIndustry}
                        onChange={(e) => handleIndustryChange(e.target.value)}
                        className="w-full rounded-2xl bg-[#F4F7FB] border border-[#E5E9F0] pl-11 pr-8 py-3 text-[15px] text-[#0B192C] focus:bg-white focus:border-[#3D74D9] focus:outline-none transition cursor-pointer appearance-none"
                      >
                        {BUSINESS_INDUSTRIES.map((ind) => (
                          <option key={ind.name} value={ind.name}>
                            {ind.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold uppercase tracking-wider text-[#5B6D85] mb-1.5">
                      Primary Specialization *
                    </label>
                    <input
                      type="text"
                      required
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="e.g. Solar Inverter Installation, Residential Plumbing"
                      className="w-full rounded-2xl bg-[#F4F7FB] border border-[#E5E9F0] px-4 py-3 text-[15px] text-[#0B192C] placeholder-[#8F9FB5] focus:bg-white focus:border-[#3D74D9] focus:ring-4 focus:ring-[#3D74D9]/10 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold uppercase tracking-wider text-[#5B6D85] mb-1.5">
                      Business Phone / WhatsApp Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#8F9FB5] absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+234 803 123 4567"
                        className="w-full rounded-2xl bg-[#F4F7FB] border border-[#E5E9F0] pl-11 pr-4 py-3 text-[15px] text-[#0B192C] placeholder-[#8F9FB5] focus:bg-white focus:border-[#3D74D9] focus:ring-4 focus:ring-[#3D74D9]/10 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[13px] font-bold uppercase tracking-wider text-[#5B6D85] mb-1.5">
                        Operating State *
                      </label>
                      <select
                        value={businessState}
                        onChange={(e) => setBusinessState(e.target.value)}
                        className="w-full rounded-2xl bg-[#F4F7FB] border border-[#E5E9F0] px-3.5 py-2.5 text-[15px] text-[#0B192C] focus:bg-white focus:border-[#3D74D9] focus:outline-none cursor-pointer"
                      >
                        {NIGERIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold uppercase tracking-wider text-[#5B6D85] mb-1.5">
                        City / Area *
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Ikeja, Lekki, Wuse 2"
                        className="w-full rounded-2xl bg-[#F4F7FB] border border-[#E5E9F0] px-3.5 py-2.5 text-[15px] text-[#0B192C] focus:bg-white focus:border-[#3D74D9] focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[13px] font-bold uppercase tracking-wider text-[#5B6D85] mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8F9FB5] absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@business.com"
                    className="w-full rounded-2xl bg-[#F4F7FB] border border-[#E5E9F0] pl-11 pr-4 py-3 text-[15px] text-[#0B192C] placeholder-[#8F9FB5] focus:bg-white focus:border-[#3D74D9] focus:ring-4 focus:ring-[#3D74D9]/10 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold uppercase tracking-wider text-[#5B6D85] mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8F9FB5] absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl bg-[#F4F7FB] border border-[#E5E9F0] pl-11 pr-4 py-3 text-[15px] text-[#0B192C] placeholder-[#8F9FB5] focus:bg-white focus:border-[#3D74D9] focus:ring-4 focus:ring-[#3D74D9]/10 focus:outline-none transition"
                  />
                </div>
                <span className="text-[13px] text-[#5B6D85] mt-1.5 block">Minimum 6 characters</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-[#0B192C] hover:bg-[#152744] text-white font-bold text-base shadow-md transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:active:scale-100 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>
                      {isLogin
                        ? 'Authenticating with Supabase...'
                        : 'Creating Account in Supabase...'}
                    </span>
                  </>
                ) : isLogin ? (
                  <>
                    <LogIn className="w-4 h-4 text-cyan-400" />
                    <span>Sign In with Email</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>
                      {isFromBusinessFunnel
                        ? claimSubmittedListing
                          ? 'Create Account & Update Profile'
                          : 'Create Account & Publish Listing'
                        : 'Register & Enter Workspace'}
                    </span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Security & Cloud Badge */}
          <div className="mt-6 pt-4 border-t border-[#E5E9F0] text-center flex items-center justify-center gap-2 text-[13px] text-[#5B6D85]">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Secured with Supabase Authentication • Phone &amp; Email Supported</span>
          </div>
        </div>
      </div>
    </div>
  );
}
