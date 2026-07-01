import { NavBar } from '@/components/layout/NavBar';
import { Footer } from '@/components/layout/Footer';
import { Link } from '@/i18n/routing';
import { GlassPanel } from '@aoba/ui';
import { getAllPosts } from '@/lib/blog';

export default async function BlogListingPage(props: { params: Promise<{locale: string}> }) {
  const params = await props.params;
  const { locale } = params;
  const posts = getAllPosts(locale);
  const featuredPost = posts.find(p => p.meta.featured) || posts[0];
  const regularPosts = posts.filter(p => p !== featuredPost);

  return (
    <>
      <NavBar />
      <main className="flex-1 pt-32 pb-16 min-h-screen">
        <section className="bg-gradient-to-b from-[var(--violet-900)]/20 to-transparent py-20 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Insights on People, Data,<br/>and the Future of HR</h1>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex gap-4 mb-12 overflow-x-auto pb-4 hide-scrollbar">
            {['All', 'HR Strategy', 'AI & Analytics', 'Indonesia Market', 'Product Updates', 'Case Studies'].map(cat => (
              <button key={cat} className="whitespace-nowrap px-4 py-2 rounded-full border border-[var(--panel-border)] hover:border-[var(--violet-500)] text-sm transition-colors glass">
                {cat}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-12">
              {featuredPost && (
                <Link href={`/blog/${featuredPost.meta.slug}`}>
                  <GlassPanel className="p-0 overflow-hidden hover:border-[var(--violet-500)] transition-colors group">
                    <div className="aspect-[2/1] bg-[var(--violet-900)]/30 relative">
                      <div className="absolute top-4 left-4 bg-[var(--violet-600)] text-white text-xs px-3 py-1 rounded-full font-medium z-10">
                        {featuredPost.meta.category}
                      </div>
                    </div>
                    <div className="p-8">
                      <h2 className="text-3xl font-bold mb-4 group-hover:text-[var(--violet-400)] transition-colors">{featuredPost.meta.title}</h2>
                      <p className="opacity-70 mb-6 text-lg">{featuredPost.meta.excerpt}</p>
                      <div className="flex items-center gap-4 text-sm opacity-60">
                        <span>{featuredPost.meta.author}</span>
                        <span>•</span>
                        <span>{featuredPost.meta.date}</span>
                        <span>•</span>
                        <span>{featuredPost.meta.readTime} min read</span>
                      </div>
                    </div>
                  </GlassPanel>
                </Link>
              )}

              <div className="grid md:grid-cols-2 gap-8">
                {regularPosts.map((post) => (
                  <Link key={post.meta.slug} href={`/blog/${post.meta.slug}`}>
                    <GlassPanel className="h-full p-0 overflow-hidden hover:border-[var(--violet-500)] transition-colors group flex flex-col">
                      <div className="aspect-video bg-[var(--violet-900)]/20 relative">
                        <div className="absolute top-4 left-4 bg-[var(--violet-600)] text-white text-xs px-3 py-1 rounded-full font-medium">
                          {post.meta.category}
                        </div>
                      </div>
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold mb-3 group-hover:text-[var(--violet-400)] transition-colors">{post.meta.title}</h3>
                        <div className="mt-auto flex items-center gap-2 text-xs opacity-60 pt-4">
                          <span>{post.meta.author}</span>
                          <span>•</span>
                          <span>{post.meta.date}</span>
                        </div>
                      </div>
                    </GlassPanel>
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="hidden lg:block space-y-8">
              <GlassPanel className="p-6">
                <h3 className="font-semibold mb-4">Get HR insights in your inbox</h3>
                <input type="email" placeholder="Email address" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 mb-4 text-sm focus:outline-none focus:border-[var(--violet-500)]" />
                <button className="w-full bg-[var(--violet-600)] hover:bg-[var(--violet-500)] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Subscribe</button>
              </GlassPanel>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
