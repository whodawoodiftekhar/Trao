'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  Mail,
  Lock,
  AlertCircle,
  ShieldCheck,
  BookOpen,
  Brain,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { InputField, Badge, Button } from '@/shared/components';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { login, isLoading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Enter your correct email or password');
      return;
    }

    try {
      await login(email.trim(), password);
      router.push('/dashboard');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Enter your correct email or password');
    }
  };

  return (
    <div className="min-h-screen flex">

      <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 flex-col justify-between p-10 xl:p-14 overflow-hidden">

        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-[-80px] w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-brand-400/10 rounded-full blur-3xl pointer-events-none" />


        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/25">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">Trao</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-4">
            Ace your next<br />technical interview
          </h2>
          <p className="text-base text-slate-300 max-w-sm leading-relaxed">
            AI-powered preparation kits designed to help you practice smarter and land your dream role.
          </p>
        </div>


        <div className="relative z-10 space-y-8">
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-teal-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">AI-Generated Interview Kits</p>
                <p className="text-xs text-slate-400 mt-0.5">Tailored question sets based on role and seniority</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <Brain className="w-4 h-4 text-teal-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Smart Practice Sessions</p>
                <p className="text-xs text-slate-400 mt-0.5">Adaptive flashcards that focus on your weak spots</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4 text-teal-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Track Your Progress</p>
                <p className="text-xs text-slate-400 mt-0.5">Visualize your improvement over time with analytics</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 font-medium">
            Trusted by 500+ candidates preparing for top tech companies
          </p>
        </div>
      </div>


      <div className="w-full lg:w-[55%] flex items-center justify-center bg-white p-6 sm:p-8 relative overflow-y-auto">
        <div className="w-full max-w-md mx-auto">

          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 text-white flex items-center justify-center shadow-md shadow-brand-500/20 mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg font-bold tracking-tight text-slate-900">Trao</span>
              <Badge tone="brand" size="sm">AI Prep Kit</Badge>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-xs leading-relaxed">
              Sign in to access your personalized interview kits and practice decks.
            </p>
          </div>


          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}


          <form onSubmit={handleSubmit} className="space-y-4">

            <InputField
              label="Email Address"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="candidate@company.com"
              autoComplete="email"
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              inputSize="md"
            />


            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password <span className="text-rose-500">*</span>
                </label>
              </div>
              <InputField
                isPassword
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                inputSize="md"
              />
            </div>


            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500/20 cursor-pointer"
                />
                <span className="text-sm text-slate-600 font-medium">Keep me logged in</span>
              </label>
            </div>


            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Dashboard
            </Button>
          </form>


          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="text-brand-600 font-semibold hover:text-brand-700 hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>


          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Secure, encrypted candidate session</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
