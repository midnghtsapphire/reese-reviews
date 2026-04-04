// ============================================================
// DYNAMIC SITEMAP GENERATION SERVICE
// Auto-generates sitemap.xml from all published reviews,
// blog posts, and static pages with proper SEO attributes
// ============================================================

import { getApprovedReviews, CATEGORIES, type ReviewData } from "@/lib/reviewStore";
import { getBlogPosts } from "@/lib/seoStore";
import type { SitemapEntry } from "@/lib/seoTypes";

const SITE_URL = "https://reesereviews.com";

// ─── SITEMAP ENTRY BUILDERS ────────────────────────────────

/**
 * Generate sitemap entries for all static pages.
 */
function getStaticPageEntries(): SitemapEntry[] {
  const now = new Date().toISOString().split("T")[0];
  return [
    { loc: `${SITE_URL}/`, lastmod: now, changefreq: "daily", priority: 1.0 },
    { loc: `${SITE_URL}/home`, lastmod: now, changefreq: "daily", priority: 0.9 },
    { loc: `${SITE_URL}/reviews`, lastmod: now, changefreq: "daily", priority: 0.9 },
    { loc: `${SITE_URL}/categories`, lastmod: now, changefreq: "weekly", priority: 0.8 },
    { loc: `${SITE_URL}/about`, lastmod: now, changefreq: "monthly", priority: 0.6 },
    { loc: `${SITE_URL}/contact`, lastmod: now, changefreq: "monthly", priority: 0.5 },
    { loc: `${SITE_URL}/submit`, lastmod: now, changefreq: "monthly", priority: 0.5 },
    { loc: `${SITE_URL}/blog`, lastmod: now, changefreq: "weekly", priority: 0.8 },
    { loc: `${SITE_URL}/faq`, lastmod: now, changefreq: "monthly", priority: 0.6 },
  ];
}

/**
 * Generate sitemap entries for all category pages.
 */
function getCategoryEntries(): SitemapEntry[] {
  const now = new Date().toISOString().split("T")[0];
  return CATEGORIES.map((cat) => ({
    loc: `${SITE_URL}/categories?category=${cat.value}`,
    lastmod: now,
    changefreq: "weekly" as const,
    priority: 0.7,
  }));
}

/**
 * Generate sitemap entries for all approved reviews.
 */
function getReviewEntries(): SitemapEntry[] {
  const reviews = getApprovedReviews();
  return reviews.map((review) => ({
    loc: `${SITE_URL}/reviews/${review.slug}`,
    lastmod: (review.updated_at || review.published_at || review.created_at).split("T")[0],
    changefreq: "weekly" as const,
    priority: review.is_featured ? 0.9 : 0.8,
  }));
}

/**
 * Generate sitemap entries for all blog posts.
 */
function getBlogEntries(): SitemapEntry[] {
  const posts = getBlogPosts();
  return posts.map((post) => ({
    loc: `${SITE_URL}/blog/${post.slug}`,
    lastmod: (post.updated_at || post.published_at).split("T")[0],
    changefreq: "weekly" as const,
    priority: 0.7,
  }));
}

// ─── SITEMAP XML GENERATION ────────────────────────────────

/**
 * Generate the complete sitemap.xml content.
 */
export function generateSitemapXML(): string {
  const entries: SitemapEntry[] = [
    ...getStaticPageEntries(),
    ...getCategoryEntries(),
    ...getReviewEntries(),
    ...getBlogEntries(),
  ];

  const urlEntries = entries
    .map(
      (entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlEntries}
</urlset>`;
}

/**
 * Generate a sitemap index for large sites with multiple sitemaps.
 */
export function generateSitemapIndex(): string {
  const now = new Date().toISOString().split("T")[0];
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap-pages.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-reviews.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-blog.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;
}

/**
 * Generate robots.txt content.
 */
export function generateRobotsTxt(): string {
  return `# Robots.txt for Reese Reviews
# https://reesereviews.com

User-agent: *
Allow: /
Allow: /home
Allow: /reviews
Allow: /reviews/*
Allow: /categories
Allow: /blog
Allow: /blog/*
Allow: /about
Allow: /contact
Allow: /faq
Allow: /submit

# Disallow admin and auth pages
Disallow: /admin
Disallow: /admin-legacy
Disallow: /login
Disallow: /profile
Disallow: /generate
Disallow: /business
Disallow: /marketing
Disallow: /marketing-hub
Disallow: /vine
Disallow: /seo
Disallow: /payments
Disallow: /music-video
Disallow: /publish-wizard
Disallow: /youtube
Disallow: /email-confirmation

# Sitemaps
Sitemap: ${SITE_URL}/sitemap.xml

# Crawl delay
Crawl-delay: 1
`;
}

// ─── DOWNLOAD HELPERS ──────────────────────────────────────

/**
 * Download the sitemap.xml file.
 */
export function downloadSitemap(): void {
  const xml = generateSitemapXML();
  downloadFile(xml, "sitemap.xml", "application/xml");
}

/**
 * Download the robots.txt file.
 */
export function downloadRobotsTxt(): void {
  const txt = generateRobotsTxt();
  downloadFile(txt, "robots.txt", "text/plain");
}

/**
 * Get sitemap statistics.
 */
export function getSitemapStats(): {
  total_urls: number;
  review_urls: number;
  blog_urls: number;
  static_urls: number;
  category_urls: number;
  last_generated: string;
} {
  const reviews = getReviewEntries();
  const blogs = getBlogEntries();
  const statics = getStaticPageEntries();
  const categories = getCategoryEntries();

  return {
    total_urls: reviews.length + blogs.length + statics.length + categories.length,
    review_urls: reviews.length,
    blog_urls: blogs.length,
    static_urls: statics.length,
    category_urls: categories.length,
    last_generated: new Date().toISOString(),
  };
}

// ─── GOOGLE SEARCH CONSOLE SUBMISSION GUIDE ────────────────

/**
 * Get instructions for submitting the sitemap to Google Search Console.
 */
export function getSearchConsoleInstructions(): string[] {
  return [
    "1. Go to Google Search Console: https://search.google.com/search-console",
    "2. Add your property: https://reesereviews.com",
    "3. Verify ownership via DNS TXT record, HTML file, or Google Analytics",
    "4. Navigate to 'Sitemaps' in the left sidebar",
    "5. Enter 'sitemap.xml' in the 'Add a new sitemap' field",
    "6. Click 'Submit'",
    "7. Google will crawl and index your sitemap within 24-48 hours",
    "8. Monitor the 'Coverage' report for any indexing issues",
    "9. Re-submit the sitemap whenever you publish new reviews",
    "10. Use the 'URL Inspection' tool to request indexing of specific pages",
  ];
}

/**
 * Generate a ping URL for search engine sitemap notification.
 */
export function getSearchEnginePingUrls(): Array<{ engine: string; url: string }> {
  const sitemapUrl = encodeURIComponent(`${SITE_URL}/sitemap.xml`);
  return [
    { engine: "Google", url: `https://www.google.com/ping?sitemap=${sitemapUrl}` },
    { engine: "Bing", url: `https://www.bing.com/ping?sitemap=${sitemapUrl}` },
  ];
}

// ─── UTILITIES ─────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
