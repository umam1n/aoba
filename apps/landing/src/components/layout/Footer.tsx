import { Link } from '@/i18n/routing';

export function Footer() {
  return (
    <footer className="border-t border-[var(--panel-border)] bg-[var(--background)] mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="font-semibold mb-4 text-[var(--foreground)]">AOBA</h3>
            <ul className="space-y-3 text-sm opacity-70">
              <li><Link href="/about" className="hover:opacity-100 transition-opacity">About</Link></li>
              <li><Link href="/blog" className="hover:opacity-100 transition-opacity">Blog</Link></li>
              <li><Link href="/careers" className="hover:opacity-100 transition-opacity">Careers</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-[var(--foreground)]">Product</h3>
            <ul className="space-y-3 text-sm opacity-70">
              <li><Link href="/#how-it-works" className="hover:opacity-100 transition-opacity">Features</Link></li>
              <li><Link href="/pricing" className="hover:opacity-100 transition-opacity">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-[var(--foreground)]">Resources</h3>
            <ul className="space-y-3 text-sm opacity-70">
              <li><Link href="https://docs.aoba.com" className="hover:opacity-100 transition-opacity">Documentation</Link></li>
              <li><Link href="https://status.aoba.com" className="hover:opacity-100 transition-opacity">Status</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-[var(--foreground)]">Legal</h3>
            <ul className="space-y-3 text-sm opacity-70">
              <li><Link href="/privacy" className="hover:opacity-100 transition-opacity">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:opacity-100 transition-opacity">Terms of Service</Link></li>
              <li><Link href="/privacy#uupdp" className="hover:opacity-100 transition-opacity">UU PDP Charter</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs opacity-50">
          <p>© {new Date().getFullYear()} AOBA. Made with intent in Indonesia. 🇮🇩</p>
          <div className="flex gap-4">
            <a href="#" className="hover:opacity-100 transition-opacity">LinkedIn</a>
            <a href="#" className="hover:opacity-100 transition-opacity">Twitter</a>
            <a href="#" className="hover:opacity-100 transition-opacity">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
