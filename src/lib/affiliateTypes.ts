// ============================================================
// AFFILIATE MARKETING AUTOMATION ENGINE
// Core types for the campaign generator, link registry,
// and social media automation system
// ============================================================

// ─── AFFILIATE LINK REGISTRY ─────────────────────────────────

export interface AffiliateLink {
  id: string;
  name: string;
  url: string;
  category: AffiliateLinkCategory;
  description: string;
  commission_rate?: string;
  cookie_duration?: string;
  active: boolean;
  clicks: number;
  conversions: number;
  revenue: number;
  last_used?: string;
}

export type AffiliateLinkCategory =
  | "automation"
  | "crm"
  | "video"
  | "banking"
  | "hosting"
  | "productivity"
  | "other";

// ─── OWNER'S AFFILIATE LINKS ─────────────────────────────────

export const OWNER_AFFILIATE_LINKS: AffiliateLink[] = [
  {
    id: "make-com",
    name: "Make.com",
    url: "https://www.make.com/en/register?pc=risingaloha",
    category: "automation",
    description: "No-code automation platform — automate workflows, connect apps, and schedule posts",
    commission_rate: "20% recurring",
    cookie_duration: "90 days",
    active: true,
    clicks: 0,
    conversions: 0,
    revenue: 0,
  },
  {
    id: "gohighlevel",
    name: "GoHighLevel",
    url: "https://www.gohighlevel.com/?fp_ref=audrey51",
    category: "crm",
    description: "All-in-one marketing platform — CRM, email, SMS, funnels, and more",
    commission_rate: "40% recurring",
    cookie_duration: "90 days",
    active: true,
    clicks: 0,
    conversions: 0,
    revenue: 0,
  },
  {
    id: "videogen",
    name: "VideoGen",
    url: "https://videogen.io/?fpr=audrey21",
    category: "video",
    description: "AI video generation tool — create product review videos automatically",
    commission_rate: "30% recurring",
    cookie_duration: "60 days",
    active: true,
    clicks: 0,
    conversions: 0,
    revenue: 0,
  },
  {
    id: "chime",
    name: "Chime",
    url: "https://www.chime.com/r/audreyevans44/?c=s",
    category: "banking",
    description: "Fee-free banking — no monthly fees, early direct deposit, and cash back",
    commission_rate: "$50 per signup",
    cookie_duration: "30 days",
    active: true,
    clicks: 0,
    conversions: 0,
    revenue: 0,
  },
  {
    id: "digitalocean",
    name: "DigitalOcean",
    url: "https://m.do.co/c/fe8240d60588",
    category: "hosting",
    description: "Cloud hosting — deploy apps, databases, and websites with ease",
    commission_rate: "$25 credit + $25 when they spend $25",
    cookie_duration: "90 days",
    active: true,
    clicks: 0,
    conversions: 0,
    revenue: 0,
  },
  {
    id: "monday-com",
    name: "Monday.com",
    url: "https://try.monday.com/9828lfh0uct0",
    category: "productivity",
    description: "Project management platform — manage reviews, campaigns, and business tasks",
    commission_rate: "20% recurring",
    cookie_duration: "90 days",
    active: true,
    clicks: 0,
    conversions: 0,
    revenue: 0,
  },
];

// ─── SOCIAL MEDIA PLATFORMS ──────────────────────────────────

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "twitter"
  | "linkedin"
  | "pinterest"
  | "email";

export const PLATFORM_CONFIGS: Record<SocialPlatform, PlatformConfig> = {
  facebook: {
    name: "Facebook",
    emoji: "📘",
    max_chars: 63206,
    hashtag_limit: 30,
    supports_images: true,
    supports_video: true,
    tone: "conversational",
    cta_style: "comment_below",
    color: "#1877F2",
  },
  instagram: {
    name: "Instagram",
    emoji: "📸",
    max_chars: 2200,
    hashtag_limit: 30,
    supports_images: true,
    supports_video: true,
    tone: "visual_first",
    cta_style: "link_in_bio",
    color: "#E4405F",
  },
  tiktok: {
    name: "TikTok",
    emoji: "🎵",
    max_chars: 2200,
    hashtag_limit: 10,
    supports_images: false,
    supports_video: true,
    tone: "casual_trendy",
    cta_style: "follow_for_more",
    color: "#000000",
  },
  twitter: {
    name: "Twitter / X",
    emoji: "🐦",
    max_chars: 280,
    hashtag_limit: 3,
    supports_images: true,
    supports_video: true,
    tone: "punchy_direct",
    cta_style: "retweet_share",
    color: "#1DA1F2",
  },
  linkedin: {
    name: "LinkedIn",
    emoji: "💼",
    max_chars: 3000,
    hashtag_limit: 5,
    supports_images: true,
    supports_video: true,
    tone: "professional",
    cta_style: "connect_discuss",
    color: "#0A66C2",
  },
  pinterest: {
    name: "Pinterest",
    emoji: "📌",
    max_chars: 500,
    hashtag_limit: 20,
    supports_images: true,
    supports_video: false,
    tone: "inspirational",
    cta_style: "save_pin",
    color: "#E60023",
  },
  email: {
    name: "Email",
    emoji: "📧",
    max_chars: 100000,
    hashtag_limit: 0,
    supports_images: true,
    supports_video: false,
    tone: "personal_direct",
    cta_style: "click_here",
    color: "#6B7280",
  },
};

export interface PlatformConfig {
  name: string;
  emoji: string;
  max_chars: number;
  hashtag_limit: number;
  supports_images: boolean;
  supports_video: boolean;
  tone: string;
  cta_style: string;
  color: string;
}

// ─── CAMPAIGN TYPES ──────────────────────────────────────────

export type CampaignType =
  | "product_review"
  | "affiliate_promo"
  | "seasonal_deal"
  | "recommendation"
  | "giveaway"
  | "comparison"
  | "tutorial"
  | "testimonial";

export type CampaignTier = 20 | 50 | 100 | 200 | 500;

export interface CampaignConfig {
  id: string;
  name: string;
  type: CampaignType;
  tier: CampaignTier;
  platforms: SocialPlatform[];
  affiliate_links: string[]; // IDs from OWNER_AFFILIATE_LINKS
  topic: string;
  product_name?: string;
  product_category?: string;
  tone: "professional" | "casual" | "fun" | "urgent" | "educational";
  include_hashtags: boolean;
  include_emoji: boolean;
  include_cta: boolean;
  custom_cta?: string;
  created_at: string;
  status: "draft" | "generating" | "ready" | "scheduled" | "sent";
  generated_count: number;
}

// ─── GENERATED CAMPAIGN CONTENT ──────────────────────────────

export interface GeneratedCampaign {
  id: string;
  campaign_id: string;
  platform: SocialPlatform;
  index: number; // 1-N within the batch
  // Content
  headline: string;
  body: string;
  hashtags: string[];
  cta: string;
  affiliate_links_used: string[];
  full_content: string; // Assembled final post
  // Email-specific
  email_subject?: string;
  email_preheader?: string;
  email_html?: string;
  // Metadata
  char_count: number;
  generated_at: string;
  // Scheduling
  scheduled_for?: string;
  posted_at?: string;
  status: "draft" | "scheduled" | "posted" | "failed";
  // Analytics
  clicks: number;
  conversions: number;
  engagement: number;
}

// ─── MAKE.COM WEBHOOK CONFIG ─────────────────────────────────

export interface MakeWebhookConfig {
  id: string;
  name: string;
  webhook_url: string;
  platform: SocialPlatform;
  active: boolean;
  last_triggered?: string;
  success_count: number;
  failure_count: number;
}

// ─── CAMPAIGN ANALYTICS ──────────────────────────────────────

export interface CampaignAnalytics {
  campaign_id: string;
  total_posts: number;
  total_clicks: number;
  total_conversions: number;
  total_revenue: number;
  best_platform: SocialPlatform;
  best_post_id: string;
  click_through_rate: number;
  conversion_rate: number;
  revenue_per_click: number;
}
