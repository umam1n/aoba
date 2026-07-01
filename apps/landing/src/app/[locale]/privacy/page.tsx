import { NavBar } from '@/components/layout/NavBar';
import { Footer } from '@/components/layout/Footer';

export default function PrivacyPage() {
  return (
    <>
      <NavBar />
      <main className="flex-1 pt-32 pb-16 min-h-screen">
        <section className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">Privacy Policy</h1>
          <div className="prose prose-invert prose-violet max-w-none">
            <p className="text-sm opacity-60 mb-8">Last Updated: June 2026</p>
            
            <p className="opacity-80 mb-6">
              At AOBA, we treat your workforce data with the highest level of security and respect. 
              This policy explains how we collect, use, and protect your information.
            </p>

            <h2 id="uupdp" className="text-2xl font-bold mt-12 mb-6">UU PDP Compliance Charter (Indonesia)</h2>
            <p className="opacity-80 mb-6">
              AOBA is fully compliant with Indonesia's Personal Data Protection Law (UU PDP / Undang-Undang Pelindungan Data Pribadi). 
              We act as a Data Processor on behalf of our enterprise customers (Data Controllers). 
            </p>
            <ul className="list-disc pl-6 space-y-2 opacity-80 mb-8">
              <li><strong>Data Localization:</strong> Data can be stored locally in Indonesian data centers upon request.</li>
              <li><strong>Encryption:</strong> All PII (Personally Identifiable Information) is encrypted at rest using AES-256 and in transit using TLS 1.3.</li>
              <li><strong>Data Subject Rights:</strong> We provide tools for Data Controllers to fulfill requests for data access, correction, and erasure within the mandated 72-hour window.</li>
              <li><strong>Consent Management:</strong> Our platform includes built-in audit trails for employee consent regarding data processing for analytics.</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-6">Information We Collect</h2>
            <p className="opacity-80 mb-6">
              We process human resources data provided by your employer, which may include names, roles, compensation history, and performance metrics. We also collect aggregated survey responses.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
