import { NavBar } from '@/components/layout/NavBar';
import { Footer } from '@/components/layout/Footer';
import { GlassPanel } from '@aoba/ui';

export default function PricingPage() {
  return (
    <>
      <NavBar />
      <main className="flex-1 pt-32 pb-16">
        <section className="max-w-5xl mx-auto px-6 py-20 text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-6">Transparent pricing.<br/>No per-seat traps.</h1>
          <p className="text-xl opacity-70 max-w-2xl mx-auto">Scale your structural HR intelligence without punishing your budget as your team grows.</p>
        </section>

        <section className="max-w-7xl mx-auto px-6 pb-32">
          <div className="grid md:grid-cols-3 gap-8">
            <GlassPanel className="p-8 flex flex-col">
              <h3 className="text-xl font-bold mb-2">Starter</h3>
              <p className="opacity-70 text-sm mb-6">For emerging teams up to 100 employees building their baseline.</p>
              <div className="text-4xl font-bold mb-8">IDR 2.5M<span className="text-lg font-normal opacity-50">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-2"><span className="text-[var(--violet-400)]">✓</span> 100 Employee limit</li>
                <li className="flex items-center gap-2"><span className="text-[var(--violet-400)]">✓</span> 8 Core HR Signals</li>
                <li className="flex items-center gap-2"><span className="text-[var(--violet-400)]">✓</span> Basic Pulse Surveys</li>
              </ul>
              <button className="w-full glass hover:bg-white/5 py-3 rounded-xl font-medium transition-colors">Start Free Trial</button>
            </GlassPanel>
            
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-b from-[var(--violet-500)] to-[var(--violet-900)] rounded-[1.5rem] blur-sm opacity-50" />
              <GlassPanel className="p-8 flex flex-col relative h-full border-[var(--violet-500)]/50 bg-[var(--panel-bg)]">
                <div className="absolute top-0 right-0 bg-[var(--violet-600)] text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl">RECOMMENDED</div>
                <h3 className="text-xl font-bold mb-2">Growth</h3>
                <p className="opacity-70 text-sm mb-6">For scaling teams up to 500 employees requiring advanced analytics.</p>
                <div className="text-4xl font-bold mb-8">IDR 7.5M<span className="text-lg font-normal opacity-50">/mo</span></div>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-center gap-2"><span className="text-[var(--violet-400)]">✓</span> 500 Employee limit</li>
                  <li className="flex items-center gap-2"><span className="text-[var(--violet-400)]">✓</span> AI Risk Scoring Engine</li>
                  <li className="flex items-center gap-2"><span className="text-[var(--violet-400)]">✓</span> Department Deep Dives</li>
                  <li className="flex items-center gap-2"><span className="text-[var(--violet-400)]">✓</span> CSV Bulk Import</li>
                </ul>
                <button className="w-full bg-[var(--violet-600)] hover:bg-[var(--violet-500)] text-white py-3 rounded-xl font-medium transition-colors shadow-lg shadow-[var(--violet-900)]/30">Request Access</button>
              </GlassPanel>
            </div>
            
            <GlassPanel className="p-8 flex flex-col">
              <h3 className="text-xl font-bold mb-2">Enterprise</h3>
              <p className="opacity-70 text-sm mb-6">For large organizations requiring SLA, SSO, and custom models.</p>
              <div className="text-4xl font-bold mb-8">Custom</div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-2"><span className="text-[var(--violet-400)]">✓</span> Unlimited Employees</li>
                <li className="flex items-center gap-2"><span className="text-[var(--violet-400)]">✓</span> Custom AI Models</li>
                <li className="flex items-center gap-2"><span className="text-[var(--violet-400)]">✓</span> Dedicated Success Manager</li>
                <li className="flex items-center gap-2"><span className="text-[var(--violet-400)]">✓</span> Enterprise SSO (SAML)</li>
              </ul>
              <button className="w-full glass hover:bg-white/5 py-3 rounded-xl font-medium transition-colors">Contact Sales</button>
            </GlassPanel>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
