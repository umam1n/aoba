import { NavBar } from '@/components/layout/NavBar';
import { Footer } from '@/components/layout/Footer';
import { Link } from '@/i18n/routing';

export default function CareersPage() {
  return (
    <>
      <NavBar />
      <main className="flex-1 pt-32 pb-16 min-h-screen">
        <section className="max-w-3xl mx-auto px-6 py-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Join the Team</h1>
          <p className="text-xl opacity-80 mb-12 max-w-2xl mx-auto">
            We're on a mission to bring true intelligence and predictive capability to HR and People Ops teams globally.
          </p>

          <div className="p-8 border border-white/10 bg-black/20 rounded-2xl glass mb-12">
            <h2 className="text-2xl font-bold mb-4">No open roles right now</h2>
            <p className="opacity-70 mb-6">
              We are currently fully staffed for our early beta phase. However, we're always interested in meeting exceptional engineers and data scientists.
            </p>
            <p className="opacity-70">
              Send your resume to <a href="mailto:careers@aoba.demo" className="text-[var(--violet-400)] hover:underline">careers@aoba.demo</a>
            </p>
          </div>
          
          <Link href="/" className="text-sm opacity-60 hover:opacity-100 transition-opacity">
            &larr; Back to Home
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
