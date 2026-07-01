import { NavBar } from '@/components/layout/NavBar';
import { Footer } from '@/components/layout/Footer';
import { getPostBySlug } from '@/lib/blog';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';

export default async function BlogPostPage(props: { params: Promise<{locale: string, slug: string}> }) {
  const params = await props.params;
  const { locale, slug } = params;
  const post = getPostBySlug(slug, locale);

  if (!post) {
    notFound();
  }

  return (
    <>
      <NavBar />
      <div className="fixed top-20 left-0 h-1 bg-[var(--violet-600)] z-40 w-1/3" /> {/* Fake progress bar for now */}
      
      <main className="flex-1 pt-32 pb-24 min-h-screen">
        <article className="max-w-3xl mx-auto px-6">
          <header className="mb-12 text-center">
            <div className="inline-block bg-[var(--violet-600)]/20 text-[var(--violet-400)] px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
              {post.meta.category}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-tight">{post.meta.title}</h1>
            <div className="flex items-center justify-center gap-4 text-sm opacity-60">
              <span>{post.meta.author}</span>
              <span>•</span>
              <span>{post.meta.date}</span>
              <span>•</span>
              <span>{post.meta.readTime} min read</span>
            </div>
          </header>

          <div className="aspect-video bg-[var(--violet-900)]/20 rounded-2xl mb-16" />

          <div className="prose prose-invert prose-violet prose-lg max-w-none">
            <MDXRemote source={post.content} />
          </div>
          
          <hr className="my-16 border-white/10" />
          
          <div className="bg-[var(--violet-900)]/20 rounded-2xl p-8 text-center border border-[var(--violet-500)]/20">
            <h3 className="text-2xl font-bold mb-4">See AOBA in action</h3>
            <p className="opacity-70 mb-6">Stop guessing. Start predicting retention with AI.</p>
            <a href="/waitlist" className="inline-block bg-[var(--violet-600)] hover:bg-[var(--violet-500)] text-white px-8 py-3 rounded-xl font-medium transition-colors">
              Request Early Access
            </a>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
