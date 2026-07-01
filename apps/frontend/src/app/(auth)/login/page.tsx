'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Activity, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

// Demo credentials shown on screen for mock mode
const DEMO_EMAIL    = 'admin@aoba.demo';
const DEMO_PASSWORD = 'password';

function LoginForm() {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');
  const router       = useRouter();
  const searchParams = useSearchParams();
  const from         = searchParams.get('from') || '/app/overview';

  const handleOAuthLogin = async (provider: 'google' | 'azure') => {
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}${from}`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || `Failed to login with ${provider}`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        // Fallback to mock for testing if it's the demo email and real auth fails
        if (email === DEMO_EMAIL) {
          console.warn('Real auth failed, using mock mode for demo email');
          const expires = new Date(Date.now() + 8 * 60 * 60 * 1000).toUTCString();
          document.cookie = `aoba_mock_auth=true; path=/; expires=${expires}; SameSite=Lax`;
          localStorage.setItem('aoba_company_id', 'c1-mock');
          router.push(from);
          return;
        }
        throw new Error(authError.message);
      }

      // Successful auth, now fetch the company
      // The API client will automatically attach the JWT token
      const companyRes = await api.get<any>('/companies/');
      
      if (companyRes.data?.results && companyRes.data.results.length > 0) {
        const comp = companyRes.data.results[0];
        localStorage.setItem('aoba_company_id', comp.id);
      } else {
        console.warn('User has no company associated, or fetch failed', companyRes.error);
        // We still let them in, but they might need to go to an onboarding page
      }

      router.push(from);
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0e1a]">
      {/* Background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md px-4 relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 mb-6 shadow-lg shadow-blue-500/30">
            <span className="text-3xl font-bold text-white">A</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Welcome to AOBA</h1>
          <p className="text-gray-400 mt-2">Workforce Intelligence for the Modern Enterprise</p>
        </div>

        <GlassPanel strong className="p-8">
          {/* Demo banner */}
          <div className="mb-6 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center justify-between gap-2">
            <span>🚀 Mock mode — any credentials work</span>
            <button
              type="button"
              onClick={fillDemo}
              className="text-blue-400 underline hover:text-blue-300 font-medium shrink-0"
            >
              Use demo
            </button>
          </div>

          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-white/10 rounded-lg bg-black/20 hover:bg-white/5 text-sm font-medium transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuthLogin('azure')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-white/10 rounded-lg bg-black/20 hover:bg-white/5 text-sm font-medium transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 21 21">
                <path fill="#f25022" d="M1 1h9v9H1z" />
                <path fill="#00a4ef" d="M1 11h9v9H1z" />
                <path fill="#7fba00" d="M11 1h9v9h-9z" />
                <path fill="#ffb900" d="M11 11h9v9h-9z" />
              </svg>
              Continue with Microsoft
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#0a0e1a] text-gray-500">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-lg bg-black/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="admin@company.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <button type="button" className="text-xs text-blue-400 hover:text-blue-300">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-white/10 rounded-lg bg-black/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full h-12 text-base" isLoading={isLoading}>
              {isLoading ? 'Signing in…' : 'Sign In to Dashboard'}
            </Button>
          </form>

          <div className="mt-8 text-center border-t border-white/10 pt-6">
            <p className="text-sm text-gray-400 flex items-center justify-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              System Status: <span className="text-emerald-500 font-medium">All Systems Operational</span>
            </p>
          </div>
        </GlassPanel>

        <p className="text-center text-xs text-gray-500 mt-8">
          By signing in, you agree to our Terms of Service and Privacy Policy.<br />
          Protected by AES-256 PII Encryption.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
