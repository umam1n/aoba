import { Link } from '@/i18n/routing';

import { Button } from '@aoba/ui';

export function NavBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b-0 border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            AOBA
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/#how-it-works" className="opacity-80 hover:opacity-100 transition-opacity">Product</Link>
            <Link href="/pricing" className="opacity-80 hover:opacity-100 transition-opacity">Pricing</Link>
            <Link href="/blog" className="opacity-80 hover:opacity-100 transition-opacity">Blog</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/en" className="text-sm font-medium opacity-60 hover:opacity-100">EN</Link>
          <span className="opacity-30">|</span>
          <Link href="/id" className="text-sm font-medium opacity-60 hover:opacity-100">ID</Link>
          
          <div className="w-px h-4 bg-white/20 mx-2" />
          
          <Link href="https://app.aoba.com/login" className="hidden sm:block text-sm font-medium opacity-80 hover:opacity-100 mr-2">
            Sign In
          </Link>
          <Link href="/waitlist">
            <button className="bg-[var(--violet-600)] hover:bg-[var(--violet-500)] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-[var(--violet-900)]/20">
              Request Access
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}
