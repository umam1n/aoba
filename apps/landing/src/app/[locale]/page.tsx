import { getTranslations } from '@/i18n/server';
import { NavBar } from '@/components/layout/NavBar';
import { Footer } from '@/components/layout/Footer';
import { Link } from '@/i18n/routing';
import { GlassPanel } from '@aoba/ui';

export default async function LandingPage(props: { params: Promise<{locale: string}> }) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'Hero' });

  return (
    <>
      <NavBar />
      
      <main className="flex-1 pt-32 pb-16">
        {/* Section 1: Hero */}
        <section className="relative max-w-5xl mx-auto px-6 pt-20 pb-32 text-center">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--violet-600)] opacity-10 blur-[120px] rounded-full pointer-events-none" />
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
            {t('title')}
          </h1>
          <p className="text-xl md:text-2xl opacity-70 max-w-3xl mx-auto mb-12 font-light leading-relaxed">
            {t('subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/waitlist">
              <button className="bg-[var(--violet-600)] hover:bg-[var(--violet-500)] text-white px-8 py-4 rounded-xl text-lg font-medium transition-all shadow-lg shadow-[var(--violet-900)]/30 hover:shadow-[var(--violet-600)]/40 hover:-translate-y-0.5">
                {t('ctaPrimary')}
              </button>
            </Link>
            <Link href="#how-it-works">
              <button className="glass hover:bg-white/5 px-8 py-4 rounded-xl text-lg font-medium transition-colors">
                {t('ctaSecondary')}
              </button>
            </Link>
          </div>
          
          {/* Mock Dashboard Visual */}
          <div className="mt-24 relative mx-auto w-full max-w-4xl aspect-[16/9] rounded-2xl overflow-hidden glass border border-[var(--panel-border)] shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--violet-900)]/20 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center text-white/30 font-medium">
              Dashboard Interactive Preview
            </div>
          </div>
        </section>

        {/* Section 2: Problem Statement */}
        <section className="max-w-7xl mx-auto px-6 py-24 border-t border-[var(--panel-border)]">
          <div className="mb-16">
            <span className="text-[var(--violet-400)] text-sm font-semibold tracking-wider uppercase mb-4 block">The Problem</span>
            <h2 className="text-4xl font-bold tracking-tight">By the time talent leaves, you've already lost.</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <GlassPanel className="p-8">
              <div className="text-3xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-3">Reactive HR</h3>
              <p className="opacity-70 leading-relaxed">Exit interviews happen after the damage is done. Retaining top performers requires foresight, not hindsight.</p>
            </GlassPanel>
            <GlassPanel className="p-8">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-3">Fragmented Data</h3>
              <p className="opacity-70 leading-relaxed">Salary, tenure, surveys, and manager changes live in five different tools, making holistic analysis impossible.</p>
            </GlassPanel>
            <GlassPanel className="p-8">
              <div className="text-3xl mb-4">🎲</div>
              <h3 className="text-xl font-semibold mb-3">Gut Decisions</h3>
              <p className="opacity-70 leading-relaxed">Retention strategies rely on manager intuition rather than structural evidence and behavioral data.</p>
            </GlassPanel>
          </div>
        </section>

        {/* Section 3: How It Works */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-24">
          <div className="mb-16 text-center">
            <span className="text-[var(--violet-400)] text-sm font-semibold tracking-wider uppercase mb-4 block">How It Works</span>
            <h2 className="text-4xl font-bold tracking-tight">Three layers of intelligence,<br/>one clear picture.</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="border-l-2 border-[var(--violet-500)] pl-6">
                <h3 className="text-2xl font-semibold mb-2">1. Structural Signals</h3>
                <p className="opacity-70">We analyze 8 core HR signals including tenure cliffs, compensation ratios, and peer attrition rates to build a baseline.</p>
              </div>
              <div className="border-l-2 border-white/10 pl-6 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                <h3 className="text-2xl font-semibold mb-2">2. AI Risk Scoring</h3>
                <p className="opacity-70">Our dual-engine model (Rule-based + DNN) calculates a precise 0–100 flight risk score for every employee.</p>
              </div>
              <div className="border-l-2 border-white/10 pl-6 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                <h3 className="text-2xl font-semibold mb-2">3. Anomaly Detection</h3>
                <p className="opacity-70">The platform automatically detects platform-wide patterns, like sudden drops in pulse survey response rates.</p>
              </div>
            </div>
            <div className="relative aspect-square">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--violet-600)]/20 to-transparent rounded-full blur-[80px]" />
              <GlassPanel className="absolute inset-4 flex items-center justify-center">
                Visual Mockup
              </GlassPanel>
            </div>
          </div>
        </section>

        {/* Section 4: Capabilities Grid */}
        <section className="max-w-7xl mx-auto px-6 py-24 border-t border-[var(--panel-border)] bg-[var(--background)]">
          <div className="mb-16 text-center">
            <span className="text-[var(--violet-400)] text-sm font-semibold tracking-wider uppercase mb-4 block">Capabilities</span>
            <h2 className="text-4xl font-bold tracking-tight">Everything your HRBP needs.<br/>Nothing they don't.</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <GlassPanel className="p-8 hover:-translate-y-1 transition-transform">
              <div className="text-2xl mb-4">🎯</div>
              <h3 className="font-semibold mb-2">AI Risk Scoring</h3>
              <p className="text-sm opacity-70">Rule-based and DNN models provide explainable factor breakdowns for every score.</p>
            </GlassPanel>
            <GlassPanel className="p-8 hover:-translate-y-1 transition-transform">
              <div className="text-2xl mb-4">📋</div>
              <h3 className="font-semibold mb-2">Pulse Surveys</h3>
              <p className="text-sm opacity-70">Lightweight sentiment capture, directly correlated to behavioral risk signals.</p>
            </GlassPanel>
            <GlassPanel className="p-8 hover:-translate-y-1 transition-transform">
              <div className="text-2xl mb-4">🔐</div>
              <h3 className="font-semibold mb-2">UU PDP Compliance</h3>
              <p className="text-sm opacity-70">Built-in consent management, audit trails, and data subject rights handling.</p>
            </GlassPanel>
            <GlassPanel className="p-8 hover:-translate-y-1 transition-transform">
              <div className="text-2xl mb-4">📊</div>
              <h3 className="font-semibold mb-2">Department Deep Dive</h3>
              <p className="text-sm opacity-70">Drill down into any team to see risk distribution and salary bands.</p>
            </GlassPanel>
            <GlassPanel className="p-8 hover:-translate-y-1 transition-transform">
              <div className="text-2xl mb-4">📥</div>
              <h3 className="font-semibold mb-2">CSV Import Engine</h3>
              <p className="text-sm opacity-70">Bulk-load employees, compensation history, and leave records easily.</p>
            </GlassPanel>
            <GlassPanel className="p-8 hover:-translate-y-1 transition-transform">
              <div className="text-2xl mb-4">⚡</div>
              <h3 className="font-semibold mb-2">Real-time Anomalies</h3>
              <p className="text-sm opacity-70">Automatic detection of team attrition spikes and sudden manager changes.</p>
            </GlassPanel>
          </div>
        </section>

        {/* Section 6: Compliance */}
        <section className="border-y border-[var(--panel-border)] bg-[var(--violet-950)]/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 py-24 relative z-10 grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-[var(--violet-400)] text-sm font-semibold tracking-wider uppercase mb-4 block">Data Privacy</span>
              <h2 className="text-4xl font-bold tracking-tight mb-6">Your employees' data is not a product.</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 text-[var(--violet-400)]">✓</div>
                  <p className="opacity-80">AES-256 encryption at rest, TLS in transit</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 text-[var(--violet-400)]">✓</div>
                  <p className="opacity-80">Explicit consent tracking per employee</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 text-[var(--violet-400)]">✓</div>
                  <p className="opacity-80">Right to access, correct, and delete (UU PDP Ch. 4)</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 text-[var(--violet-400)]">✓</div>
                  <p className="opacity-80">Audit log of every data access event</p>
                </li>
              </ul>
            </div>
            <div className="flex justify-center">
              <div className="w-64 h-64 relative">
                <div className="absolute inset-0 border-2 border-[var(--violet-500)] rounded-full animate-[spin_10s_linear_infinite] border-t-transparent" />
                <div className="absolute inset-4 border-2 border-[var(--violet-400)] rounded-full animate-[spin_7s_linear_infinite_reverse] border-b-transparent opacity-60" />
                <div className="absolute inset-0 flex items-center justify-center text-5xl">🛡️</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 8: Final CTA */}
        <section className="max-w-3xl mx-auto px-6 py-32 text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[var(--violet-600)] opacity-10 blur-[100px] rounded-full pointer-events-none" />
          
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Join the first wave of data-driven HR in Indonesia.</h2>
          <p className="text-xl opacity-70 mb-12">AOBA is in early access. Request your spot and we'll onboard you personally.</p>
          
          <form className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto mb-6">
            <input 
              type="email" 
              placeholder="Work email address" 
              className="flex-1 bg-white/5 border border-[var(--panel-border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--violet-500)] focus:ring-1 focus:ring-[var(--violet-500)] transition-all"
              required
            />
            <button type="submit" className="bg-[var(--violet-600)] hover:bg-[var(--violet-500)] text-white px-8 py-3 rounded-xl font-medium transition-colors whitespace-nowrap">
              Request Early Access
            </button>
          </form>
          <p className="text-xs opacity-50">By submitting, you agree to our Privacy Policy. We do not sell your data.</p>
        </section>

      </main>
      
      <Footer />
    </>
  );
}
