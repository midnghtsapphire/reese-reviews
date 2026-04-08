// ============================================================
// SEO STORE — BLOG, FAQ, SCHEMA MARKUP, BACKLINKS
// ============================================================

import type {
  BlogPost,
  FAQ,
  AboutPage,
  BacklinkTarget,
  SEOLandingPage,
  RSSFeed,
  RSSItem,
  ArticleSchema,
  FAQPageSchema,
  BreadcrumbSchema,
} from "./seoTypes";
import type { BlogCategory, FAQCategory, AboutPageType } from "./seoTypes";

const STORAGE_KEY_BLOG = "reese-blog-posts";
const STORAGE_KEY_FAQ = "reese-faq";
const STORAGE_KEY_ABOUT = "reese-about-pages";
const STORAGE_KEY_BACKLINKS = "reese-backlinks";
const STORAGE_KEY_LANDING_PAGES = "reese-seo-landing-pages";

// ─── BLOG POST MANAGEMENT ───────────────────────────────────

export function getBlogPosts(): BlogPost[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_BLOG);
    if (stored) return JSON.parse(stored);
  } catch {
    // noop
  }
  return [];
}

export function saveBlogPost(post: BlogPost): void {
  const posts = getBlogPosts().filter((p) => p.id !== post.id);
  posts.push(post);
  localStorage.setItem(STORAGE_KEY_BLOG, JSON.stringify(posts));
}

export function getBlogPostBySlug(slug: string): BlogPost | null {
  const posts = getBlogPosts();
  return posts.find((p) => p.slug === slug) || null;
}

export function getBlogPostsByCategory(category: BlogCategory): BlogPost[] {
  return getBlogPosts().filter((p) => p.category === category);
}

export function deleteBlogPost(id: string): void {
  const posts = getBlogPosts().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY_BLOG, JSON.stringify(posts));
}

// ─── FAQ MANAGEMENT ─────────────────────────────────────────

export function getFAQs(): FAQ[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_FAQ);
    if (stored) return JSON.parse(stored);
  } catch {
    // noop
  }
  return [];
}

export function saveFAQ(faq: FAQ): void {
  const faqs = getFAQs().filter((f) => f.id !== faq.id);
  faqs.push(faq);
  localStorage.setItem(STORAGE_KEY_FAQ, JSON.stringify(faqs));
}

export function getFAQsByCategory(category: FAQCategory): FAQ[] {
  return getFAQs().filter((f) => f.category === category);
}

export function searchFAQs(query: string): FAQ[] {
  const lowercaseQuery = query.toLowerCase();
  return getFAQs().filter(
    (f) =>
      f.question.toLowerCase().includes(lowercaseQuery) ||
      f.answer.toLowerCase().includes(lowercaseQuery) ||
      f.tags.some((t) => t.toLowerCase().includes(lowercaseQuery))
  );
}

export function deleteFAQ(id: string): void {
  const faqs = getFAQs().filter((f) => f.id !== id);
  localStorage.setItem(STORAGE_KEY_FAQ, JSON.stringify(faqs));
}

// ─── ABOUT PAGE MANAGEMENT ──────────────────────────────────

export function getAboutPages(): AboutPage[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ABOUT);
    if (stored) return JSON.parse(stored);
  } catch {
    // noop
  }
  return [];
}

export function saveAboutPage(page: AboutPage): void {
  const pages = getAboutPages().filter((p) => p.id !== page.id);
  pages.push(page);
  localStorage.setItem(STORAGE_KEY_ABOUT, JSON.stringify(pages));
}

export function getAboutPageByType(type: AboutPageType): AboutPage | null {
  const pages = getAboutPages();
  return pages.find((p) => p.type === type) || null;
}

export function deleteAboutPage(id: string): void {
  const pages = getAboutPages().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY_ABOUT, JSON.stringify(pages));
}

// ─── BACKLINK MANAGEMENT ────────────────────────────────────

export function getBacklinks(): BacklinkTarget[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_BACKLINKS);
    if (stored) return JSON.parse(stored);
  } catch {
    // noop
  }
  return [];
}

export function saveBacklink(backlink: BacklinkTarget): void {
  const backlinks = getBacklinks().filter((b) => b.id !== backlink.id);
  backlinks.push(backlink);
  localStorage.setItem(STORAGE_KEY_BACKLINKS, JSON.stringify(backlinks));
}

export function getBacklinksByType(type: BacklinkTarget["source_type"]): BacklinkTarget[] {
  return getBacklinks().filter((b) => b.source_type === type);
}

export function getBacklinkStats(): {
  total: number;
  by_type: Record<string, number>;
  active_count: number;
} {
  const backlinks = getBacklinks();
  const byType: Record<string, number> = {};

  backlinks.forEach((b) => {
    byType[b.source_type] = (byType[b.source_type] || 0) + 1;
  });

  return {
    total: backlinks.length,
    by_type: byType,
    active_count: backlinks.filter((b) => b.status === "active").length,
  };
}

// ─── LANDING PAGE MANAGEMENT ────────────────────────────────

export function getLandingPages(): SEOLandingPage[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_LANDING_PAGES);
    if (stored) return JSON.parse(stored);
  } catch {
    // noop
  }
  return [];
}

export function saveLandingPage(page: SEOLandingPage): void {
  const pages = getLandingPages().filter((p) => p.id !== page.id);
  pages.push(page);
  localStorage.setItem(STORAGE_KEY_LANDING_PAGES, JSON.stringify(pages));
}

export function getLandingPageBySlug(slug: string): SEOLandingPage | null {
  const pages = getLandingPages();
  return pages.find((p) => p.slug === slug) || null;
}

// ─── SCHEMA MARKUP GENERATION ───────────────────────────────

export function generateArticleSchema(post: BlogPost): ArticleSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: post.featured_image || "https://reesereviews.com/og-image.png",
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Reese Reviews",
      logo: {
        "@type": "ImageObject",
        url: "https://reesereviews.com/logo.png",
      },
    },
  };
}

export function generateFAQPageSchema(faqs: FAQ[]): FAQPageSchema {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function generateBreadcrumbSchema(path: Array<{ name: string; url: string }>): BreadcrumbSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: path.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ─── RSS FEED GENERATION ────────────────────────────────────

export function generateRSSFeed(): RSSFeed {
  const posts = getBlogPosts().sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

  const items: RSSItem[] = posts.slice(0, 20).map((post) => ({
    title: post.title,
    link: `https://reesereviews.com/blog/${post.slug}`,
    description: post.description,
    pubDate: new Date(post.published_at).toUTCString(),
    author: post.author,
    category: post.category,
    guid: `https://reesereviews.com/blog/${post.slug}`,
  }));

  return {
    channel: {
      title: "Reese Reviews Blog",
      link: "https://reesereviews.com/blog",
      description: "Latest reviews, tips, and insights from Reese Reviews",
      language: "en-us",
      lastBuildDate: new Date().toUTCString(),
      items,
    },
  };
}

export function generateRSSXML(): string {
  const feed = generateRSSFeed();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXML(feed.channel.title)}</title>
    <link>${feed.channel.link}</link>
    <description>${escapeXML(feed.channel.description)}</description>
    <language>${feed.channel.language}</language>
    <lastBuildDate>${feed.channel.lastBuildDate}</lastBuildDate>
`;

  feed.channel.items.forEach((item) => {
    xml += `
    <item>
      <title>${escapeXML(item.title)}</title>
      <link>${item.link}</link>
      <description>${escapeXML(item.description)}</description>
      <pubDate>${item.pubDate}</pubDate>
      <author>${escapeXML(item.author)}</author>
      <category>${escapeXML(item.category)}</category>
      <guid>${item.guid}</guid>
    </item>
`;
  });

  xml += `
  </channel>
</rss>`;

  return xml;
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ─── SITEMAP GENERATION ─────────────────────────────────────

export function generateSitemapXML(): string {
  const baseUrl = "https://reesereviews.com";
  const now = new Date().toISOString().split("T")[0];

  const pages = [
    { url: "/", priority: 1.0, changefreq: "weekly" },
    { url: "/reviews", priority: 0.9, changefreq: "daily" },
    { url: "/categories", priority: 0.8, changefreq: "weekly" },
    { url: "/about", priority: 0.7, changefreq: "monthly" },
    { url: "/contact", priority: 0.6, changefreq: "yearly" },
    { url: "/blog", priority: 0.8, changefreq: "daily" },
    { url: "/faq", priority: 0.7, changefreq: "monthly" },
  ];

  // Add blog posts
  const posts = getBlogPosts();
  posts.forEach((post) => {
    pages.push({
      url: `/blog/${post.slug}`,
      priority: 0.7,
      changefreq: "monthly",
    });
  });

  // Add about pages
  const aboutPages = getAboutPages();
  aboutPages.forEach((page) => {
    pages.push({
      url: `/about/${page.type}`,
      priority: 0.6,
      changefreq: "monthly",
    });
  });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  pages.forEach((page) => {
    xml += `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  });

  xml += `
</urlset>`;

  return xml;
}

// ─── ROBOTS.TXT GENERATION ──────────────────────────────────

export function generateRobotsTxt(): string {
  return `User-agent: *
Allow: /
Allow: /blog/
Allow: /reviews/
Allow: /categories/
Allow: /about/
Allow: /faq/
Disallow: /admin/
Disallow: /api/
Disallow: /business/
Disallow: /*.json$
Disallow: /*.pdf$

User-agent: Googlebot
Allow: /

Crawl-delay: 1
Request-rate: 30/1m

Sitemap: https://reesereviews.com/sitemap.xml
Sitemap: https://reesereviews.com/blog/feed.xml
`;
}

// ─── INTERNAL LINK GENERATION ───────────────────────────────

export function generateInternalLinks(currentPage: string): Array<{ url: string; anchor_text: string }> {
  const links: Array<{ url: string; anchor_text: string }> = [];

  // Always include main navigation
  links.push({ url: "/", anchor_text: "Home" });
  links.push({ url: "/reviews", anchor_text: "All Reviews" });
  links.push({ url: "/blog", anchor_text: "Blog" });
  links.push({ url: "/faq", anchor_text: "FAQ" });

  // Add contextual links based on current page
  if (currentPage.includes("/blog/")) {
    links.push({ url: "/blog", anchor_text: "Back to Blog" });
    links.push({ url: "/reviews", anchor_text: "See Our Reviews" });
  }

  if (currentPage.includes("/reviews/")) {
    links.push({ url: "/reviews", anchor_text: "All Reviews" });
    links.push({ url: "/categories", anchor_text: "Browse by Category" });
  }

  return links;
}

// ─── EXPORT FUNCTIONS ───────────────────────────────────────

export function exportBlogPostsJSON(): string {
  return JSON.stringify(getBlogPosts(), null, 2);
}

export function exportFAQsJSON(): string {
  return JSON.stringify(getFAQs(), null, 2);
}

export function exportBacklinksJSON(): string {
  return JSON.stringify(getBacklinks(), null, 2);
}
