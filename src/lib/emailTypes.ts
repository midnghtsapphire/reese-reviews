// ============================================================
// EMAIL COLLECTION & NEWSLETTER SYSTEM
// Double opt-in, encrypted storage, LLM templates,
// affiliate link injection, subscriber management
// ============================================================

// ─── SUBSCRIBER TYPES ────────────────────────────────────────

export interface Subscriber {
  id: string;
  email: string;
  name?: string;
  interests?: string[];
  source_page: string; // Which page/app they signed up from
  source_url?: string;
  status: "pending" | "confirmed" | "unsubscribed" | "bounced";
  confirmation_token?: string;
  confirmation_sent_at?: string;
  confirmed_at?: string;
  unsubscribed_at?: string;
  bounce_reason?: string;
  created_at: string;
  last_email_sent?: string;
  email_count: number;
  open_count: number;
  click_count: number;
  tags: string[];
  metadata?: Record<string, unknown>;
}

export interface SubscriberSegment {
  id: string;
  name: string;
  description: string;
  filter_criteria: SegmentFilter;
  subscriber_count: number;
  created_at: string;
}

export interface SegmentFilter {
  source_pages?: string[];
  status?: Subscriber["status"][];
  interests?: string[];
  min_email_count?: number;
  max_email_count?: number;
  created_after?: string;
  created_before?: string;
}

// ─── NEWSLETTER TYPES ───────────────────────────────────────

export type NewsletterTemplate =
  | "new_app_launch"
  | "weekly_update"
  | "review_roundup"
  | "deal_spotlight"
  | "seasonal_promo"
  | "custom";

export interface Newsletter {
  id: string;
  name: string;
  template: NewsletterTemplate;
  subject_line: string;
  preheader: string;
  content_html: string;
  content_text: string;
  affiliate_links_used: string[];
  segments: string[]; // Segment IDs to send to
  created_at: string;
  scheduled_for?: string;
  sent_at?: string;
  status: "draft" | "scheduled" | "sent" | "failed";
  stats: NewsletterStats;
}

export interface NewsletterStats {
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  total_unsubscribed: number;
  open_rate: number;
  click_rate: number;
  unsubscribe_rate: number;
}

// ─── NEWSLETTER TRIGGER TYPES ───────────────────────────────

export interface NewsletterTrigger {
  id: string;
  name: string;
  event_type: "new_review" | "new_app" | "weekly_digest" | "manual";
  template: NewsletterTemplate;
  enabled: boolean;
  segments: string[]; // Which segments to send to
  created_at: string;
}

// ─── SUBSCRIBE FORM TYPES ───────────────────────────────────

export interface SubscribeFormConfig {
  id: string;
  placement: "footer" | "popup" | "sidebar" | "page";
  title: string;
  description: string;
  button_text: string;
  show_name_field: boolean;
  show_interests: boolean;
  interests_options: string[];
  background_color: string;
  button_color: string;
  enabled: boolean;
}

// ─── EMAIL CAMPAIGN TYPES ───────────────────────────────────

export interface EmailCampaign {
  id: string;
  newsletter_id: string;
  segment_id: string;
  subscriber_id: string;
  email: string;
  subject_line: string;
  sent_at?: string;
  opened_at?: string;
  clicked_at?: string;
  unsubscribed_at?: string;
  bounced_at?: string;
  bounce_reason?: string;
  status: "pending" | "sent" | "opened" | "clicked" | "bounced" | "failed";
  click_count: number;
  affiliate_clicks: Record<string, number>; // affiliate_link_id -> click_count
}

// ─── NEWSLETTER TEMPLATE CONTENT ─────────────────────────────

export interface NewsletterTemplateContent {
  template: NewsletterTemplate;
  subject_line: string;
  preheader: string;
  headline: string;
  body_sections: BodySection[];
  cta_text: string;
  cta_url: string;
  footer_text: string;
  unsubscribe_url: string;
}

export interface BodySection {
  type: "text" | "image" | "product" | "testimonial" | "divider";
  content: string;
  image_url?: string;
  product_name?: string;
  product_url?: string;
  alignment?: "left" | "center" | "right";
}

// ─── ENCRYPTION CONFIG ──────────────────────────────────────

export interface EncryptionConfig {
  algorithm: "AES-256-GCM";
  key_derivation: "PBKDF2";
  iterations: number;
  salt_length: number;
}

// ─── SUBSCRIBER ANALYTICS ───────────────────────────────────

export interface SubscriberAnalytics {
  total_subscribers: number;
  confirmed_subscribers: number;
  pending_subscribers: number;
  unsubscribed_count: number;
  growth_7d: number;
  growth_30d: number;
  growth_90d: number;
  segments: SegmentAnalytics[];
  top_sources: SourceAnalytics[];
}

export interface SegmentAnalytics {
  segment_id: string;
  segment_name: string;
  subscriber_count: number;
  avg_open_rate: number;
  avg_click_rate: number;
}

export interface SourceAnalytics {
  source_page: string;
  subscriber_count: number;
  percentage: number;
}

// ─── DOUBLE OPT-IN TYPES ────────────────────────────────────

export interface ConfirmationEmail {
  id: string;
  subscriber_id: string;
  email: string;
  confirmation_token: string;
  confirmation_url: string;
  sent_at: string;
  confirmed_at?: string;
  expires_at: string;
  status: "pending" | "confirmed" | "expired";
}

// ─── INTEREST CATEGORIES ────────────────────────────────────

export const DEFAULT_INTERESTS = [
  "Product Reviews",
  "Tech News",
  "Business Tips",
  "Deals & Discounts",
  "Weekly Digest",
  "App Launches",
  "Affiliate Recommendations",
  "Seasonal Promotions",
];

// ─── EMAIL VALIDATION ───────────────────────────────────────

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

// ─── UNSUBSCRIBE TOKEN GENERATION ───────────────────────────

export function generateUnsubscribeToken(subscriberId: string, email: string): string {
  const data = `${subscriberId}:${email}:${Date.now()}`;
  // In production, use crypto.subtle.digest or a proper hashing library
  return btoa(data);
}

export function verifyUnsubscribeToken(token: string, subscriberId: string, email: string): boolean {
  try {
    const decoded = atob(token);
    const [id, mail] = decoded.split(":");
    return id === subscriberId && mail === email;
  } catch {
    return false;
  }
}
