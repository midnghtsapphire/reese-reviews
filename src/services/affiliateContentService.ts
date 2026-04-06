// ============================================================
// AFFILIATE CONTENT SERVICE — REAL OPENROUTER LLM INTEGRATION
// Generates product descriptions, social media snippets,
// review summaries, and affiliate content via OpenRouter API
// ============================================================

import type { AffiliateLink, SocialPlatform } from "@/lib/affiliateTypes";
import type { ReviewData } from "@/lib/reviewStore";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-4o-mini";

function getApiKey(): string {
  return import.meta.env.VITE_OPENROUTER_API_KEY || "";
}

async function callOpenRouter(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  maxTokens = 1500,
  temperature = 0.8
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("OpenRouter API key not configured. Set VITE_OPENROUTER_API_KEY in .env");
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://reesereviews.com",
      "X-Title": "Reese Reviews Affiliate Engine",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// ─── PRODUCT DESCRIPTION GENERATOR ─────────────────────────

export interface ProductDescription {
  short_description: string;
  long_description: string;
  key_features: string[];
  target_audience: string;
  seo_title: string;
  seo_description: string;
}

export async function generateProductDescription(
  productName: string,
  category: string,
  existingReview?: string
): Promise<ProductDescription> {
  const messages = [
    {
      role: "system" as const,
      content: `You are a professional product copywriter for Reese Reviews, an honest product review platform. Generate compelling product descriptions that are SEO-optimized and conversion-focused. Return VALID JSON only.`,
    },
    {
      role: "user" as const,
      content: `Generate a product description for: "${productName}" (Category: ${category})

${existingReview ? `Existing review context:\n${existingReview.slice(0, 1000)}` : "No existing review — write based on the product name and category."}

Return VALID JSON:
{
  "short_description": "1-2 sentence hook (max 160 chars)",
  "long_description": "3-4 paragraph detailed description",
  "key_features": ["feature 1", "feature 2", "feature 3", "feature 4", "feature 5"],
  "target_audience": "Who this product is best for",
  "seo_title": "SEO-optimized title (max 60 chars)",
  "seo_description": "SEO meta description (max 160 chars)"
}`,
    },
  ];

  const raw = await callOpenRouter(messages);
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      short_description: `Discover ${productName} — an honest review from Reese Reviews.`,
      long_description: raw,
      key_features: ["Quality construction", "Great value", "Recommended by Reese"],
      target_audience: "Anyone looking for honest product reviews",
      seo_title: `${productName} Review | Reese Reviews`,
      seo_description: `Read our honest review of ${productName}. Pros, cons, and verdict from Reese Reviews.`,
    };
  }
}

// ─── SOCIAL MEDIA SNIPPET GENERATOR ────────────────────────

export interface SocialSnippet {
  platform: SocialPlatform;
  content: string;
  hashtags: string[];
  character_count: number;
}

export async function generateSocialSnippets(
  review: ReviewData,
  platforms: SocialPlatform[],
  affiliateLinks: AffiliateLink[]
): Promise<SocialSnippet[]> {
  const affiliateLinkText = affiliateLinks
    .slice(0, 3)
    .map((l) => `${l.name}: ${l.url}`)
    .join("\n");

  const messages = [
    {
      role: "system" as const,
      content: `You are a social media expert for Reese Reviews. Generate platform-specific social media posts from product reviews. Each post should be authentic, engaging, and include affiliate links naturally. Return VALID JSON array.`,
    },
    {
      role: "user" as const,
      content: `Generate social media posts for this review:

Title: ${review.title}
Product: ${review.product_name}
Rating: ${review.rating}/5
Excerpt: ${review.excerpt}
Pros: ${review.pros.join(", ")}
Cons: ${review.cons.join(", ")}
Verdict: ${review.verdict}

Platforms: ${platforms.join(", ")}

Affiliate links to include:
${affiliateLinkText}

Return VALID JSON array:
[
  {
    "platform": "facebook",
    "content": "the full post text with affiliate link",
    "hashtags": ["#review", "#honest"]
  }
]

Platform limits: Twitter=280 chars, Instagram=2200, Facebook=63206, TikTok=2200, LinkedIn=3000, Pinterest=500`,
    },
  ];

  const raw = await callOpenRouter(messages);
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return parsed.map((item: { platform: SocialPlatform; content: string; hashtags: string[] }) => ({
      platform: item.platform,
      content: item.content,
      hashtags: item.hashtags || [],
      character_count: item.content.length,
    }));
  } catch {
    return platforms.map((platform) => ({
      platform,
      content: `Check out our review of ${review.product_name}! ${review.rating}/5 stars. ${review.excerpt}`,
      hashtags: ["#ReeseReviews", "#HonestReview"],
      character_count: 0,
    }));
  }
}

// ─── REVIEW-TO-POST CONVERTER ──────────────────────────────

export async function generatePostFromReview(
  review: ReviewData,
  platform: SocialPlatform,
  affiliateLinks: AffiliateLink[],
  tone: "professional" | "casual" | "fun" | "urgent" | "educational" = "casual"
): Promise<string> {
  const platformLimits: Record<SocialPlatform, number> = {
    facebook: 63206,
    instagram: 2200,
    tiktok: 2200,
    twitter: 280,
    linkedin: 3000,
    pinterest: 500,
    email: 100000,
  };

  const affiliateLinkText = affiliateLinks
    .slice(0, 2)
    .map((l) => `${l.name}: ${l.url}`)
    .join("\n");

  const messages = [
    {
      role: "system" as const,
      content: `You are a social media copywriter for Reese Reviews. Write a ${tone} ${platform} post based on a product review. Max ${platformLimits[platform]} characters. Include affiliate links naturally. Return ONLY the post content — no explanations.`,
    },
    {
      role: "user" as const,
      content: `Convert this review into a ${platform} post:

Product: ${review.product_name}
Rating: ${review.rating}/5
Title: ${review.title}
Key points: ${review.excerpt}
Pros: ${review.pros.slice(0, 3).join(", ")}
Cons: ${review.cons.slice(0, 2).join(", ")}
Verdict: ${review.verdict}

Affiliate links:
${affiliateLinkText}

Write a compelling ${platform} post that drives engagement and clicks.`,
    },
  ];

  return callOpenRouter(messages, 1000, 0.9);
}

// ─── EMAIL DIGEST GENERATOR ────────────────────────────────

export interface EmailDigest {
  subject: string;
  preheader: string;
  html_body: string;
  plain_text: string;
}

export async function generateEmailDigest(
  reviews: ReviewData[],
  digestType: "weekly" | "monthly",
  affiliateLinks: AffiliateLink[]
): Promise<EmailDigest> {
  const reviewSummaries = reviews
    .slice(0, 10)
    .map(
      (r) =>
        `- "${r.title}" (${r.product_name}, ${r.rating}/5): ${r.excerpt}`
    )
    .join("\n");

  const affiliateLinkText = affiliateLinks
    .slice(0, 3)
    .map((l) => `${l.name}: ${l.url}`)
    .join("\n");

  const messages = [
    {
      role: "system" as const,
      content: `You are an email marketing expert for Reese Reviews. Generate a ${digestType} email digest newsletter. Include engaging subject line, preheader, and HTML-formatted body. Return VALID JSON.`,
    },
    {
      role: "user" as const,
      content: `Generate a ${digestType} review digest email:

Recent reviews:
${reviewSummaries}

Affiliate links to include:
${affiliateLinkText}

Return VALID JSON:
{
  "subject": "email subject line (max 50 chars)",
  "preheader": "preheader text (max 100 chars)",
  "html_body": "HTML formatted email body",
  "plain_text": "plain text version"
}

Include:
- Engaging intro
- Review highlights with ratings
- 1-2 affiliate links woven in naturally
- Clear CTA to read full reviews on reesereviews.com
- Unsubscribe placeholder: {{UNSUBSCRIBE_LINK}}`,
    },
  ];

  const raw = await callOpenRouter(messages, 2000, 0.8);
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      subject: `Your ${digestType} review digest from Reese Reviews`,
      preheader: `${reviews.length} new reviews this ${digestType === "weekly" ? "week" : "month"}`,
      html_body: `<h1>Reese Reviews ${digestType} Digest</h1><p>${reviewSummaries}</p>`,
      plain_text: `Reese Reviews ${digestType} Digest\n\n${reviewSummaries}`,
    };
  }
}

// ─── AFFILIATE CONTENT ENHANCER ────────────────────────────

export async function enhanceAffiliateContent(
  linkName: string,
  linkUrl: string,
  linkDescription: string,
  contentType: "blog_mention" | "sidebar_ad" | "email_cta" | "social_post"
): Promise<string> {
  const messages = [
    {
      role: "system" as const,
      content: `You are a conversion copywriter. Generate compelling ${contentType} content for an affiliate product. Be authentic and persuasive without being pushy. Return ONLY the content — no explanations.`,
    },
    {
      role: "user" as const,
      content: `Generate ${contentType} content for:
Product: ${linkName}
URL: ${linkUrl}
Description: ${linkDescription}

Make it compelling, authentic, and include a natural CTA.`,
    },
  ];

  return callOpenRouter(messages, 500, 0.85);
}

export { callOpenRouter as callOpenRouterDirect };
