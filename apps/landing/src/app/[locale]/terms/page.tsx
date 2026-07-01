import { NavBar } from '@/components/layout/NavBar';
import { Footer } from '@/components/layout/Footer';

export default function TermsPage() {
  return (
    <>
      <NavBar />
      <main className="flex-1 pt-32 pb-16 min-h-screen">
        <section className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">Terms of Service</h1>
          <div className="prose prose-invert prose-violet max-w-none">
            <p className="text-sm opacity-60 mb-8">Last Updated: June 2026</p>
            
            <p className="opacity-80 mb-6">
              Welcome to AOBA. By using our Workforce Intelligence Platform, you agree to these terms.
            </p>

            <h2 className="text-2xl font-bold mt-12 mb-6">1. Enterprise Subscription</h2>
            <p className="opacity-80 mb-6">
              AOBA is a B2B SaaS platform. Access is granted through enterprise subscriptions. 
              You are responsible for maintaining the confidentiality of your account credentials.
            </p>

            <h2 className="text-2xl font-bold mt-12 mb-6">2. Acceptable Use</h2>
            <p className="opacity-80 mb-6">
              You agree not to misuse our services. This includes not attempting to bypass security measures, reverse-engineer the platform, or upload malicious code.
            </p>

            <h2 className="text-2xl font-bold mt-12 mb-6">3. Data Ownership</h2>
            <p className="opacity-80 mb-6">
              You retain all rights and ownership of the data you upload to AOBA. We claim no ownership over your employee data.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
