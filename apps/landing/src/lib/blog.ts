import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface BlogPostMeta {
  title: string;
  slug: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
  cover: string;
  excerpt: string;
  lang: string;
  readTime: number;
  featured?: boolean;
}

export interface BlogPost {
  meta: BlogPostMeta;
  content: string;
}

const contentDir = path.join(process.cwd(), 'content', 'blog');

export function getPostBySlug(slug: string, locale: string): BlogPost | null {
  try {
    const realSlug = slug.replace(/\.mdx$/, '');
    const fullPath = path.join(contentDir, `${realSlug}.${locale}.mdx`);
    
    // Fallback to English if translation doesn't exist
    let fileContents;
    try {
      fileContents = fs.readFileSync(fullPath, 'utf8');
    } catch {
      const enPath = path.join(contentDir, `${realSlug}.en.mdx`);
      fileContents = fs.readFileSync(enPath, 'utf8');
    }

    const { data, content } = matter(fileContents);
    return {
      meta: { ...data, slug: realSlug } as BlogPostMeta,
      content,
    };
  } catch (error) {
    return null;
  }
}

export function getAllPosts(locale: string = 'en'): BlogPost[] {
  try {
    const files = fs.readdirSync(contentDir);
    const posts = files
      .filter((file) => file.endsWith(`.${locale}.mdx`) || file.endsWith('.en.mdx'))
      .map((file) => {
        const slug = file.replace(/\.(en|id)\.mdx$/, '');
        return getPostBySlug(slug, locale);
      })
      .filter(Boolean) as BlogPost[];

    // Sort by date descending
    return posts.sort((a, b) => (new Date(a.meta.date) > new Date(b.meta.date) ? -1 : 1));
  } catch {
    return [];
  }
}
