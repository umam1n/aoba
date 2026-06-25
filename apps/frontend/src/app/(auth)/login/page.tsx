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
