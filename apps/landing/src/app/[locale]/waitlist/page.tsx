'use client';

import { useState } from 'react';
import { NavBar } from '@/components/layout/NavBar';
import { Footer } from '@/components/layout/Footer';
import { GlassPanel } from '@aoba/ui';
import { supabase } from '@/lib/supabase'; // We'll need to make sure this lib exists in landing app, or just mock for now, but user said "wire it to supabase". Wait, does landing app have supabase client?

export default function WaitlistPage() {
  const [formData, setFormData] = useState({ name: '', email: '', company: '', role: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      // Assuming a waitlist_signups table in Supabase
      const { error } = await supabase.from('waitlist_signups').insert([
        {
          name: formData.name,
          email: formData.email,
          company: formData.company,
          role: formData.role,
        }
      ]);

      if (error) throw error;
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <>
      <NavBar />
      <main className="flex-1 pt-32 pb-16 min-h-screen relative flex items-center justify-center">
        {/* Background glows */}
        <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-[var(--violet-600)]/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] rounded-full bg-[#4C1D95]/20 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-xl px-6 relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Request Early Access</h1>
            <p className="text-lg opacity-70">Join the waitlist to get early access to AOBA Workforce Intelligence.</p>
          </div>

          <GlassPanel className="p-8 md:p-10">
            {status === 'success' ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-[var(--violet-600)]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-[var(--violet-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-2">You're on the list!</h3>
                <p className="opacity-70 mb-8">We'll be in touch soon with your early access invite.</p>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                >
                  Return Home
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-2 opacity-80">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.name}
                      onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--violet-500)] transition-colors"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 opacity-80">Work Email</label>
                    <input 
                      type="email" 
                      required 
                      value={formData.email}
                      onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--violet-500)] transition-colors"
                      placeholder="jane@company.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 opacity-80">Company Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.company}
                    onChange={e => setFormData(p => ({ ...p, company: e.target.value }))}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--violet-500)] transition-colors"
                    placeholder="Acme Corp"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 opacity-80">Your Role</label>
                  <select 
                    required
                    value={formData.role}
                    onChange={e => setFormData(p => ({ ...p, role: e.target.value }))}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--violet-500)] transition-colors appearance-none"
                  >
                    <option value="" disabled>Select your role...</option>
                    <option value="HR Leader">HR Leader / CHRO</option>
                    <option value="People Analytics">People Analytics</option>
                    <option value="Finance/Ops">Finance / Operations</option>
                    <option value="Founder/CEO">Founder / CEO</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {status === 'error' && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
                    {errorMsg}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full bg-[var(--violet-600)] hover:bg-[var(--violet-500)] disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-[var(--violet-900)]/20 mt-4"
                >
                  {status === 'loading' ? 'Submitting...' : 'Request Early Access'}
                </button>
              </form>
            )}
          </GlassPanel>
        </div>
      </main>
      <Footer />
    </>
  );
}
