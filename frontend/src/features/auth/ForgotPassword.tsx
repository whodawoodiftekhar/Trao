'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  RotateCcw,
  Clock,
  Lock
} from 'lucide-react';
import { api } from '@/lib/api';
import { InputField, Button } from '@/shared/components';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 45;
const MIN_PASSWORD_LENGTH = 6;

type Step = 'email' | 'otp' | 'password' | 'done';

const STEP_ORDER: Step[] = ['email', 'otp', 'password'];

export function ForgotPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams ? searchParams.get('email') || '' : '';

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (step === 'otp') otpInputRef.current?.focus();
  }, [step]);

  const passwordsMatch = password.length > 0 && password === confirmPassword;

  /** Step 1 — does this account exist? If so the server emails a code. */
  const requestCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setNoticeMessage(null);
    try {
      const res = await api.forgotPassword(cleanEmail);
      setEmail(res.email || cleanEmail);
      setOtp('');
      setStep('otp');
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setNoticeMessage(res.message);
    } catch (err) {
      setErrorMessage((err as Error).message || 'Could not send the reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resendCode = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setOtp('');
    await requestCode();
  };

  /** Step 2 — check the code before showing the password fields. */
  const verifyCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (otp.length !== OTP_LENGTH) {
      setErrorMessage(`Please enter the ${OTP_LENGTH}-digit code from your email.`);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setNoticeMessage(null);
    try {
      await api.verifyResetOtp(email, otp);
      setStep('password');
    } catch (err) {
      setErrorMessage((err as Error).message || 'Incorrect code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /** Step 3 — set the new password. The server re-checks the code. */
  const submitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      return;
    }
    if (!passwordsMatch) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await api.resetPassword(email, otp, password);
      setStep('done');
    } catch (err) {
      const message = (err as Error).message || 'Could not reset your password.';
      setErrorMessage(message);
      // A burned or expired code means starting over, not retyping the password.
      if (/expired|request a new|too many/i.test(message)) {
        setStep('otp');
        setOtp('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    setErrorMessage(null);
    setNoticeMessage(null);
    if (step === 'otp') setStep('email');
    else if (step === 'password') setStep('otp');
  };

  const stepIndex = STEP_ORDER.indexOf(step);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      <div className="relative w-full lg:w-[45%] bg-slate-900 p-8 sm:p-12 flex flex-col justify-between overflow-hidden min-h-[240px] lg:min-h-screen">
        <div className="absolute top-[-120px] left-[-80px] w-[400px] h-[400px] bg-gradient-to-br from-brand-500/20 to-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-100px] right-[-60px] w-[350px] h-[350px] bg-gradient-to-tr from-brand-600/15 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-[250px] h-[250px] bg-teal-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/25">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Trao</span>
          </div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-3">
            Account Recovery
          </h2>
          <p className="text-slate-300 text-base leading-relaxed max-w-sm">
            Secure account recovery for your interview prep profile. We&apos;ll get you back on track in no time.
          </p>
        </div>

        <div className="relative z-10 space-y-5">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-4 h-4 text-teal-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Code valid for 10 minutes</p>
                <p className="text-xs text-slate-400 mt-0.5">Reset codes expire automatically for your security.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">One-time verification code</p>
                <p className="text-xs text-slate-400 mt-0.5">Never share your code — Trao staff will never ask for it.</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <p className="text-sm text-slate-400">
              Trusted by <span className="text-white font-semibold">500+</span> candidates
            </p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[55%] flex items-center justify-center bg-white p-6 sm:p-10">
        <div className="w-full max-w-md">

          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 flex items-center justify-center shadow-md shadow-brand-500/20">
              <KeyRound className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">Trao</span>
          </div>

          {step === 'done' ? (
            <div className="space-y-6">
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-50 via-white to-brand-50 border border-teal-200/70 flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-teal-600" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Password changed</h2>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                  Your password has been updated. You can now sign in with your new password.
                </p>
              </div>

              <Button fullWidth size="lg" onClick={() => router.push('/login')}>
                Go to Sign In
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-6" aria-hidden="true">
                {STEP_ORDER.map((s, i) => (
                  <div
                    key={s}
                    className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                      i <= stepIndex ? 'bg-brand-600' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>

              {step === 'email' && (
                <>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Forgot your password?</h2>
                  <p className="text-sm text-slate-500 mt-1.5 mb-6 leading-relaxed">
                    Enter the email address on your Trao account and we&apos;ll send you a {OTP_LENGTH}-digit verification code.
                  </p>

                  <form onSubmit={requestCode} className="space-y-4">
                    <InputField
                      label="Email address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      autoFocus
                      leftIcon={<Mail className="w-4 h-4" />}
                      disabled={isLoading}
                      fullWidth
                    />

                    {errorMessage && <ErrorBanner message={errorMessage} />}

                    <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
                      Send verification code
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </form>
                </>
              )}

              {step === 'otp' && (
                <>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Enter your code</h2>
                  <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                    We sent a {OTP_LENGTH}-digit code to
                  </p>
                  <div className="mt-3 mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-sm max-w-full">
                    <Mail className="w-4 h-4 text-brand-600 shrink-0" />
                    <span className="truncate">{email}</span>
                  </div>

                  <form onSubmit={verifyCode} className="space-y-4">
                    <InputField
                      ref={otpInputRef}
                      label="Verification code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={otp}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH);
                        setOtp(digits);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="123456"
                      maxLength={OTP_LENGTH}
                      disabled={isLoading}
                      fullWidth
                      className="text-center text-2xl font-bold tracking-[0.5em]"
                    />

                    {noticeMessage && !errorMessage && (
                      <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        {noticeMessage}
                      </p>
                    )}

                    {errorMessage && <ErrorBanner message={errorMessage} />}

                    <Button
                      type="submit"
                      fullWidth
                      size="lg"
                      isLoading={isLoading}
                      disabled={otp.length !== OTP_LENGTH}
                    >
                      Verify code
                      <ArrowRight className="w-4 h-4" />
                    </Button>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <button
                        type="button"
                        onClick={goBack}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Change email
                      </button>

                      <button
                        type="button"
                        onClick={resendCode}
                        disabled={resendCooldown > 0 || isLoading}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                      </button>
                    </div>
                  </form>
                </>
              )}

              {step === 'password' && (
                <>
                  <div className="flex items-center gap-2 text-teal-700 bg-teal-50 border border-teal-200/70 rounded-xl px-3 py-2 mb-5 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Code verified
                  </div>

                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Set a new password</h2>
                  <p className="text-sm text-slate-500 mt-1.5 mb-6 leading-relaxed">
                    Choose a new password for <span className="font-semibold text-slate-700">{email}</span>.
                  </p>

                  <form onSubmit={submitNewPassword} className="space-y-4">
                    <InputField
                      label="New password"
                      isPassword
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                      autoComplete="new-password"
                      autoFocus
                      leftIcon={<Lock className="w-4 h-4" />}
                      disabled={isLoading}
                      fullWidth
                    />

                    <InputField
                      label="Confirm new password"
                      isPassword
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Match password"
                      autoComplete="new-password"
                      leftIcon={<Lock className="w-4 h-4" />}
                      disabled={isLoading}
                      fullWidth
                      error={
                        confirmPassword.length > 0 && !passwordsMatch
                          ? 'Passwords do not match'
                          : null
                      }
                    />

                    {errorMessage && <ErrorBanner message={errorMessage} />}

                    <Button
                      type="submit"
                      fullWidth
                      size="lg"
                      isLoading={isLoading}
                      disabled={password.length < MIN_PASSWORD_LENGTH || !passwordsMatch}
                    >
                      Change password
                      <ArrowRight className="w-4 h-4" />
                    </Button>

                    <button
                      type="button"
                      onClick={goBack}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back to code
                    </button>
                  </form>
                </>
              )}

              <p className="text-sm text-slate-500 text-center mt-8">
                Remembered your password?{' '}
                <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700"
    >
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <p className="text-xs font-medium leading-relaxed">{message}</p>
    </div>
  );
}

export default ForgotPassword;
