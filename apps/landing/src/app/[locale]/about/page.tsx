import { NavBar } from '@/components/layout/NavBar';
import { Footer } from '@/components/layout/Footer';

export default function AboutPage() {
  return (
    <>
      <NavBar />
      <main className="flex-1 pt-32 pb-16 min-h-screen">
        <section className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">About AOBA</h1>
          <div className="prose prose-invert prose-violet max-w-none">
            <p className="text-lg opacity-80 mb-6">
              AOBA was born from a simple observation: modern enterprises have more data about their people than ever before, yet struggle to answer the most basic questions about workforce health and risk.
            </p>
            <p className="text-lg opacity-80 mb-6">
              We are building the intelligence layer for the modern workforce. By combining continuous listening, predictive analytics, and enterprise-grade privacy controls, we help organizations move from reactive HR to proactive talent strategy.
            </p>
            
            <h2 className="text-2xl font-bold mt-12 mb-6">Our Mission</h2>
            <p className="opacity-80 mb-6">
              To empower organizations to build thriving workplaces through deep, predictive intelligence—always respecting employee privacy and the ethical use of data.
            </p>

            <h2 className="text-2xl font-bold mt-12 mb-6">Made in Indonesia</h2>
            <p className="opacity-80 mb-6">
              Proudly engineered in Indonesia, built for global scale. We understand the nuances of the APAC market while maintaining the highest global standards for data security and privacy.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
