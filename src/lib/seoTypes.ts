// ============================================================
// SEO INFRASTRUCTURE — TYPES & SCHEMA MARKUP
// Blog system, FAQ, backlinks, technical SEO
// ============================================================

// ─── BLOG POST TYPES ────────────────────────────────────────

export type BlogCategory = "how-to" | "industry-news" | "product-updates" | "tips-tricks" | "case-studies";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  category: BlogCategory;
  author: string;
  featured_image?: string;
  tags: string[];
  seo_keywords: string[];
  canonical_url?: string;
  published_at: string;
  updated_at: string;
  read_time_minutes: number;
  view_count: number;
  schema_markup: SchemaMarkup;
}

// ─── FAQ TYPES ──────────────────────────────────────────────

export type FAQCategory = "getting-started" | "pricing" | "features" | "technical" | "legal" | "accessibility";

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
  tags: string[];
  helpful_count: number;
  not_helpful_count: number;
  related_faqs: string[]; // IDs of related FAQs
  schema_markup: SchemaMarkup;
}

// ─── SCHEMA MARKUP TYPES ────────────────────────────────────

export interface SchemaMarkup {
  "@context": string;
  "@type": string;
  [key: string]: unknown;
}

export interface ArticleSchema extends SchemaMarkup {
  "@type": "Article";
  headline: string;
  description: string;
  image: string | string[];
  datePublished: string;
  dateModified: string;
  author: {
    "@type": "Person";
    name: string;
  };
  publisher: {
    "@type": "Organization";
    name: string;
    logo: {
      "@type": "ImageObject";
      url: string;
    };
  };
}

export interface FAQPageSchema extends SchemaMarkup {
  "@type": "FAQPage";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
}

export interface OrganizationSchema extends SchemaMarkup {
  "@type": "Organization";
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs: string[];
  contactPoint: {
    "@type": "ContactPoint";
    contactType: string;
    telephone: string;
    email: string;
  };
}

export interface BreadcrumbSchema extends SchemaMarkup {
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
}

// ─── OPEN GRAPH TYPES ───────────────────────────────────────

export interface OpenGraphTags {
  og_title: string;
  og_description: string;
  og_image: string;
  og_url: string;
  og_type: "website" | "article" | "profile";
  og_site_name: string;
  article_published_time?: string;
  article_modified_time?: string;
  article_author?: string;
  article_section?: string;
  article_tag?: string[];
}

// ─── TWITTER CARD TYPES ─────────────────────────────────────

export interface TwitterCardTags {
  twitter_card: "summary" | "summary_large_image" | "app" | "player";
  twitter_site: string;
  twitter_creator: string;
  twitter_title: string;
  twitter_description: string;
  twitter_image: string;
}

// ─── BACKLINK STRATEGY TYPES ────────────────────────────────

export interface BacklinkTarget {
  id: string;
  url: string;
  anchor_text: string;
  source_page: string;
  source_type: "internal" | "cross-app" | "blog" | "landing-page" | "directory" | "social" | "guest-post";
  created_at: string;
  status: "active" | "pending" | "broken";
}

export interface InternalLink {
  from_page: string;
  to_page: string;
  anchor_text: string;
  context: string;
}

export interface CrossAppLink {
  from_app: string;
  to_app: string;
  from_url: string;
  to_url: string;
  anchor_text: string;
}

export interface SEOLandingPage {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  keywords: string[];
  target_search_intent: string;
  backlinks_count: number;
  created_at: string;
}

// ─── TECHNICAL SEO TYPES ────────────────────────────────────

export interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
}

export interface RobotsConfig {
  user_agents: Array<{
    user_agent: string;
    allow: string[];
    disallow: string[];
    crawl_delay?: number;
  }>;
  sitemaps: string[];
}

// ─── ABOUT PAGE TYPES ───────────────────────────────────────

export type AboutPageType =
  | "about-us"
  | "about-team"
  | "about-technology"
  | "about-mission"
  | "about-partners"
  | "press-media"
  | "careers"
  | "testimonials"
  | "awards"
  | "contact";

export interface AboutPage {
  id: string;
  type: AboutPageType;
  title: string;
  description: string;
  content: string;
  featured_image?: string;
  sections: ContentSection[];
  seo_keywords: string[];
  canonical_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentSection {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  video_url?: string;
  cta_text?: string;
  cta_url?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image_url: string;
  social_links: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
}

// ─── SEO METADATA ────────────────────────────────────────────

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonical_url: string;
  robots: string;
  og_tags: OpenGraphTags;
  twitter_tags: TwitterCardTags;
  schema_markup: SchemaMarkup;
}

// ─── RSS FEED TYPES ─────────────────────────────────────────

export interface RSSFeed {
  channel: {
    title: string;
    link: string;
    description: string;
    language: string;
    lastBuildDate: string;
    items: RSSItem[];
  };
}

export interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  author: string;
  category: string;
  guid: string;
}

// ─── GUEST POST TEMPLATE ────────────────────────────────────

export interface GuestPostTemplate {
  id: string;
  title: string;
  description: string;
  word_count_min: number;
  word_count_max: number;
  topics: string[];
  guidelines: string;
  author_bio_template: string;
  backlink_anchor_text: string;
  backlink_url: string;
  created_at: string;
}

// ─── DIRECTORY SUBMISSION ───────────────────────────────────

export interface DirectorySubmission {
  id: string;
  directory_name: string;
  directory_url: string;
  category: string;
  submission_url: string;
  status: "pending" | "submitted" | "approved" | "rejected";
  submitted_at?: string;
  approved_at?: string;
  backlink_url?: string;
  created_at: string;
}
