// ============================================================
// EMAIL STORE — SUBSCRIBER MANAGEMENT & NEWSLETTER SYSTEM
// ============================================================

import type {
  Subscriber,
  Newsletter,
  NewsletterTemplate,
  SubscriberSegment,
  SegmentFilter,
  ConfirmationEmail,
  SubscriberAnalytics,
} from "./emailTypes";
import { sanitizeEmail, isValidEmail, generateUnsubscribeToken } from "./emailTypes";
import { DEFAULT_INTERESTS } from "./emailTypes";

const STORAGE_KEY_SUBSCRIBERS = "reese-email-subscribers";
const STORAGE_KEY_NEWSLETTERS = "reese-email-newsletters";
const STORAGE_KEY_SEGMENTS = "reese-email-segments";
const STORAGE_KEY_CONFIRMATIONS = "reese-email-confirmations";

// ─── SUBSCRIBER MANAGEMENT ──────────────────────────────────

export function getSubscribers(): Subscriber[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SUBSCRIBERS);
    if (stored) return JSON.parse(stored);
  } catch {
    // noop
  }
  return [];
}

export function saveSubscribers(subscribers: Subscriber[]): void {
  localStorage.setItem(STORAGE_KEY_SUBSCRIBERS, JSON.stringify(subscribers));
}

export function addSubscriber(
  email: string,
  name: string | undefined,
  interests: string[] | undefined,
  sourcePage: string,
  sourceUrl?: string
): { subscriber: Subscriber; confirmationEmail: ConfirmationEmail } | null {
  if (!isValidEmail(email)) return null;

  const sanitized = sanitizeEmail(email);
  const subscribers = getSubscribers();

  // Check if already exists
  if (subscribers.some((s) => s.email === sanitized)) {
    return null;
  }

  const subscriber: Subscriber = {
    id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: sanitized,
    name,
    interests: interests || [],
    source_page: sourcePage,
    source_url: sourceUrl,
    status: "pending",
    confirmation_token: generateConfirmationToken(),
    confirmation_sent_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    email_count: 0,
    open_count: 0,
    click_count: 0,
    tags: [],
  };

  subscribers.push(subscriber);
  saveSubscribers(subscribers);

  const confirmationEmail: ConfirmationEmail = {
    id: `conf-${Date.now()}`,
    subscriber_id: subscriber.id,
    email: sanitized,
    confirmation_token: subscriber.confirmation_token!,
    confirmation_url: `${window.location.origin}/confirm-email?token=${subscriber.confirmation_token}`,
    sent_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "pending",
  };

  saveConfirmationEmail(confirmationEmail);

  return { subscriber, confirmationEmail };
}

export function confirmSubscriber(token: string): Subscriber | null {
  const confirmations = getConfirmationEmails();
  const confirmation = confirmations.find((c) => c.confirmation_token === token && c.status === "pending");

  if (!confirmation) return null;

  const subscribers = getSubscribers();
  const subscriber = subscribers.find((s) => s.id === confirmation.subscriber_id);

  if (!subscriber) return null;

  subscriber.status = "confirmed";
  subscriber.confirmed_at = new Date().toISOString();
  subscriber.confirmation_token = undefined;

  saveSubscribers(subscribers);

  confirmation.confirmed_at = new Date().toISOString();
  confirmation.status = "confirmed";
  saveConfirmationEmails(confirmations);

  return subscriber;
}

export function unsubscribeSubscriber(email: string): boolean {
  const sanitized = sanitizeEmail(email);
  const subscribers = getSubscribers();
  const idx = subscribers.findIndex((s) => s.email === sanitized);

  if (idx === -1) return false;

  subscribers[idx].status = "unsubscribed";
  subscribers[idx].unsubscribed_at = new Date().toISOString();
  saveSubscribers(subscribers);

  return true;
}

export function getSubscriberByEmail(email: string): Subscriber | null {
  const sanitized = sanitizeEmail(email);
  const subscribers = getSubscribers();
  return subscribers.find((s) => s.email === sanitized) || null;
}

export function updateSubscriber(id: string, updates: Partial<Subscriber>): void {
  const subscribers = getSubscribers();
  const idx = subscribers.findIndex((s) => s.id === id);
  if (idx !== -1) {
    subscribers[idx] = { ...subscribers[idx], ...updates };
    saveSubscribers(subscribers);
  }
}

// ─── SEGMENTATION ───────────────────────────────────────────

export function getSegments(): SubscriberSegment[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SEGMENTS);
    if (stored) return JSON.parse(stored);
  } catch {
    // noop
  }
  return [];
}

export function saveSegments(segments: SubscriberSegment[]): void {
  localStorage.setItem(STORAGE_KEY_SEGMENTS, JSON.stringify(segments));
}

export function createSegment(
  name: string,
  description: string,
  filterCriteria: SegmentFilter
): SubscriberSegment {
  const segments = getSegments();
  const subscribers = getSubscribers();

  // Count matching subscribers
  const matchingCount = subscribers.filter((s) => matchesSegmentFilter(s, filterCriteria)).length;

  const segment: SubscriberSegment = {
    id: `seg-${Date.now()}`,
    name,
    description,
    filter_criteria: filterCriteria,
    subscriber_count: matchingCount,
    created_at: new Date().toISOString(),
  };

  segments.push(segment);
  saveSegments(segments);

  return segment;
}

export function getSegmentSubscribers(segmentId: string): Subscriber[] {
  const segments = getSegments();
  const segment = segments.find((s) => s.id === segmentId);
  if (!segment) return [];

  const subscribers = getSubscribers();
  return subscribers.filter((s) => matchesSegmentFilter(s, segment.filter_criteria));
}

function matchesSegmentFilter(subscriber: Subscriber, filter: SegmentFilter): boolean {
  if (filter.status && !filter.status.includes(subscriber.status)) return false;
  if (filter.source_pages && !filter.source_pages.includes(subscriber.source_page)) return false;
  if (filter.interests && subscriber.interests && filter.interests.length > 0) {
    const hasInterest = subscriber.interests.some((i) => filter.interests!.includes(i));
    if (!hasInterest) return false;
  }
  if (filter.min_email_count && subscriber.email_count < filter.min_email_count) return false;
  if (filter.max_email_count && subscriber.email_count > filter.max_email_count) return false;

  return true;
}

// ─── NEWSLETTER STORAGE ─────────────────────────────────────

export function getNewsletters(): Newsletter[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_NEWSLETTERS);
    if (stored) return JSON.parse(stored);
  } catch {
    // noop
  }
  return [];
}

export function saveNewsletter(newsletter: Newsletter): void {
  const newsletters = getNewsletters().filter((n) => n.id !== newsletter.id);
  newsletters.push(newsletter);
  localStorage.setItem(STORAGE_KEY_NEWSLETTERS, JSON.stringify(newsletters));
}

export function deleteNewsletter(id: string): void {
  const newsletters = getNewsletters().filter((n) => n.id !== id);
  localStorage.setItem(STORAGE_KEY_NEWSLETTERS, JSON.stringify(newsletters));
}

// ─── CONFIRMATION EMAIL STORAGE ─────────────────────────────

export function getConfirmationEmails(): ConfirmationEmail[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CONFIRMATIONS);
    if (stored) return JSON.parse(stored);
  } catch {
    // noop
  }
  return [];
}

export function saveConfirmationEmails(confirmations: ConfirmationEmail[]): void {
  localStorage.setItem(STORAGE_KEY_CONFIRMATIONS, JSON.stringify(confirmations));
}

export function saveConfirmationEmail(confirmation: ConfirmationEmail): void {
  const confirmations = getConfirmationEmails();
  confirmations.push(confirmation);
  saveConfirmationEmails(confirmations);
}

// ─── ANALYTICS ──────────────────────────────────────────────

export function getSubscriberAnalytics(): SubscriberAnalytics {
  const subscribers = getSubscribers();
  const segments = getSegments();

  const confirmed = subscribers.filter((s) => s.status === "confirmed").length;
  const pending = subscribers.filter((s) => s.status === "pending").length;
  const unsubscribed = subscribers.filter((s) => s.status === "unsubscribed").length;

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;

  const growth7d = subscribers.filter((s) => new Date(s.created_at).getTime() > sevenDaysAgo).length;
  const growth30d = subscribers.filter((s) => new Date(s.created_at).getTime() > thirtyDaysAgo).length;
  const growth90d = subscribers.filter((s) => new Date(s.created_at).getTime() > ninetyDaysAgo).length;

  // Source analytics
  const sourceMap = new Map<string, number>();
  subscribers.forEach((s) => {
    sourceMap.set(s.source_page, (sourceMap.get(s.source_page) || 0) + 1);
  });

  const topSources = Array.from(sourceMap.entries())
    .map(([source, count]) => ({
      source_page: source,
      subscriber_count: count,
      percentage: (count / subscribers.length) * 100,
    }))
    .sort((a, b) => b.subscriber_count - a.subscriber_count);

  return {
    total_subscribers: subscribers.length,
    confirmed_subscribers: confirmed,
    pending_subscribers: pending,
    unsubscribed_count: unsubscribed,
    growth_7d,
    growth_30d,
    growth_90d,
    segments: segments.map((seg) => ({
      segment_id: seg.id,
      segment_name: seg.name,
      subscriber_count: seg.subscriber_count,
      avg_open_rate: 0, // Would be calculated from campaign stats
      avg_click_rate: 0,
    })),
    top_sources: topSources,
  };
}

// ─── CONFIRMATION TOKEN GENERATION ──────────────────────────

function generateConfirmationToken(): string {
  return `token_${Date.now()}_${Math.random().toString(36).substr(2, 20)}`;
}

// ─── NEWSLETTER GENERATION VIA OPENROUTER ──────────────────

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function generateNewsletterContent(
  template: NewsletterTemplate,
  topic: string,
  affiliateLinks: string[],
  apiKey: string
): Promise<{
  subject_line: string;
  preheader: string;
  content_html: string;
  content_text: string;
}> {
  const prompt = buildNewsletterPrompt(template, topic, affiliateLinks);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://reesereviews.com",
        "X-Title": "Reese Reviews Newsletter Engine",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the response
    const subjectMatch = content.match(/^SUBJECT:\s*(.+)$/m);
    const preheaderMatch = content.match(/^PREHEADER:\s*(.+)$/m);
    const htmlMatch = content.match(/^HTML:\s*([\s\S]+?)(?=^TEXT:|$)/m);
    const textMatch = content.match(/^TEXT:\s*([\s\S]+?)$/m);

    return {
      subject_line: subjectMatch ? subjectMatch[1].trim() : "Check out what's new!",
      preheader: preheaderMatch ? preheaderMatch[1].trim() : "Latest updates from Reese Reviews",
      content_html: htmlMatch ? htmlMatch[1].trim() : content,
      content_text: textMatch ? textMatch[1].trim() : content,
    };
  } catch (error) {
    console.error("Newsletter generation failed:", error);
    return {
      subject_line: "Latest from Reese Reviews",
      preheader: "Check out what's new",
      content_html: "<p>Newsletter generation failed. Please try again.</p>",
      content_text: "Newsletter generation failed. Please try again.",
    };
  }
}

function buildNewsletterPrompt(
  template: NewsletterTemplate,
  topic: string,
  affiliateLinks: string[]
): string {
  const templates: Record<NewsletterTemplate, string> = {
    new_app_launch: `Write a newsletter announcing a new app launch. Make it exciting and include a clear CTA to check out the new app.`,
    weekly_update: `Write a weekly digest newsletter summarizing the week's top reviews, news, and recommendations.`,
    review_roundup: `Write a newsletter highlighting the best reviews from this week, organized by category.`,
    deal_spotlight: `Write a newsletter featuring the best deals and discounts discovered this week.`,
    seasonal_promo: `Write a seasonal promotional newsletter with timely offers and recommendations.`,
    custom: `Write a newsletter about: ${topic}`,
  };

  return `You are a professional email marketing copywriter for Reese Reviews.

TASK: Generate a newsletter using the ${template} template.

TEMPLATE INSTRUCTIONS: ${templates[template]}

TOPIC: ${topic}

AFFILIATE LINKS TO INCLUDE (naturally weave 2-3 into the content):
${affiliateLinks.join("\n")}

REQUIREMENTS:
- Write compelling subject line (max 50 chars)
- Write preheader text (max 100 chars)
- Format with HTML structure (use semantic tags)
- Include clear call-to-action
- Add unsubscribe link placeholder: {{UNSUBSCRIBE_LINK}}
- Make it mobile-friendly
- Include 1-2 affiliate links naturally in the body
- Professional but friendly tone

OUTPUT FORMAT:
SUBJECT: [subject line here]
PREHEADER: [preheader here]
HTML: [HTML content here]
TEXT: [Plain text version here]`;
}
