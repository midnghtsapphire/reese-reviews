// ============================================================
// AFFILIATE MARKETING AUTOMATION ENGINE — STORE & SERVICES
// OpenRouter LLM integration for campaign generation
// Make.com webhook integration for auto-posting
// ============================================================

import type {
  AffiliateLink,
  CampaignConfig,
  GeneratedCampaign,
  MakeWebhookConfig,
  SocialPlatform,
  CampaignTier,
} from "./affiliateTypes";
import { OWNER_AFFILIATE_LINKS, PLATFORM_CONFIGS } from "./affiliateTypes";

const STORAGE_KEY_LINKS = "reese-affiliate-links";
const STORAGE_KEY_CAMPAIGNS = "reese-affiliate-campaigns";
const STORAGE_KEY_GENERATED = "reese-affiliate-generated";
const STORAGE_KEY_WEBHOOKS = "reese-affiliate-webhooks";

// ─── AFFILIATE LINK REGISTRY ─────────────────────────────────

export function getAffiliateLinks(): AffiliateLink[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_LINKS);
    if (stored) return JSON.parse(stored);
  } catch {}
  return OWNER_AFFILIATE_LINKS;
}

export function saveAffiliateLinks(links: AffiliateLink[]): void {
  localStorage.setItem(STORAGE_KEY_LINKS, JSON.stringify(links));
}

export function trackAffiliateLinkClick(id: string): void {
  const links = getAffiliateLinks();
  const idx = links.findIndex((l) => l.id === id);
  if (idx !== -1) {
    links[idx].clicks++;
    links[idx].last_used = new Date().toISOString();
    saveAffiliateLinks(links);
  }
}

// ─── CAMPAIGN CONFIG STORAGE ─────────────────────────────────

export function getCampaigns(): CampaignConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CAMPAIGNS);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export function saveCampaign(campaign: CampaignConfig): void {
  const campaigns = getCampaigns().filter((c) => c.id !== campaign.id);
  campaigns.push(campaign);
  localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(campaigns));
}

export function deleteCampaign(id: string): void {
  const campaigns = getCampaigns().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(campaigns));
}

// ─── GENERATED CONTENT STORAGE ───────────────────────────────

export function getGeneratedCampaigns(): GeneratedCampaign[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_GENERATED);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export function saveGeneratedCampaigns(campaigns: GeneratedCampaign[]): void {
  localStorage.setItem(STORAGE_KEY_GENERATED, JSON.stringify(campaigns));
}

export function addGeneratedCampaigns(campaigns: GeneratedCampaign[]): void {
  const existing = getGeneratedCampaigns();
  const updated = [...existing, ...campaigns];
  saveGeneratedCampaigns(updated);
}

// ─── WEBHOOK CONFIG ──────────────────────────────────────────

export function getWebhooks(): MakeWebhookConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_WEBHOOKS);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export function saveWebhook(webhook: MakeWebhookConfig): void {
  const webhooks = getWebhooks().filter((w) => w.id !== webhook.id);
  webhooks.push(webhook);
  localStorage.setItem(STORAGE_KEY_WEBHOOKS, JSON.stringify(webhooks));
}

// ─── OPENROUTER LLM CAMPAIGN GENERATOR ───────────────────────

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

interface GenerationRequest {
  platform: SocialPlatform;
  campaignType: string;
  topic: string;
  productName?: string;
  productCategory?: string;
  tone: string;
  affiliateLinks: AffiliateLink[];
  index: number;
  total: number;
  includeHashtags: boolean;
  includeEmoji: boolean;
  customCta?: string;
}

function buildPlatformPrompt(req: GenerationRequest): string {
  const platformConfig = PLATFORM_CONFIGS[req.platform];
  const affiliateLinkText = req.affiliateLinks
    .map((l) => `- ${l.name}: ${l.url} (${l.description})`)
    .join("\n");

  const platformInstructions: Record<SocialPlatform, string> = {
    facebook: `Write a Facebook post (max ${platformConfig.max_chars} chars). Be conversational and engaging. End with a question to drive comments.`,
    instagram: `Write an Instagram caption (max 2200 chars). Start with a hook. Use line breaks for readability. Put hashtags at the end.`,
    tiktok: `Write a TikTok video caption (max 2200 chars). Very casual, trendy language. Use trending sounds reference if relevant. Keep it short and punchy.`,
    twitter: `Write a Tweet (STRICT max 280 chars including spaces). Punchy, direct, no fluff. Max 3 hashtags.`,
    linkedin: `Write a LinkedIn post (max 3000 chars). Professional but personable. Start with a bold statement. Include a lesson or insight.`,
    pinterest: `Write a Pinterest pin description (max 500 chars). Inspirational and descriptive. Focus on the visual/product benefit.`,
    email: `Write a complete marketing email with subject line, preheader, and body. Include a clear CTA button text. Format with HTML-friendly structure.`,
  };

  return `You are a professional social media copywriter and affiliate marketing expert.

TASK: Generate campaign post #${req.index} of ${req.total} for ${platformConfig.name}.

PLATFORM: ${platformConfig.name}
${platformInstructions[req.platform]}

CAMPAIGN DETAILS:
- Type: ${req.campaignType}
- Topic: ${req.topic}
${req.productName ? `- Product: ${req.productName}` : ""}
${req.productCategory ? `- Category: ${req.productCategory}` : ""}
- Tone: ${req.tone}

AFFILIATE LINKS TO EMBED (include at least 1-2 naturally in the content):
${affiliateLinkText}

REQUIREMENTS:
${req.includeHashtags ? `- Include ${Math.min(platformConfig.hashtag_limit, 15)} relevant hashtags` : "- No hashtags"}
${req.includeEmoji ? "- Use relevant emojis throughout" : "- No emojis"}
${req.customCta ? `- Custom CTA: "${req.customCta}"` : "- Include a compelling call-to-action"}
- Make each post UNIQUE — this is post #${req.index} of ${req.total}, so vary the angle, hook, and structure
- Naturally weave in the affiliate links — don't just dump them at the end
- For email: provide subject line on first line as "SUBJECT: ..." and preheader as "PREHEADER: ..."

OUTPUT FORMAT:
Return ONLY the post content. No explanations, no meta-commentary. Just the ready-to-post content.`;
}

export async function generateCampaignBatch(
  config: CampaignConfig,
  apiKey: string,
  onProgress?: (completed: number, total: number) => void
): Promise<GeneratedCampaign[]> {
  const affiliateLinks = getAffiliateLinks().filter((l) =>
    config.affiliate_links.includes(l.id)
  );

  const totalPosts = config.tier * config.platforms.length;
  const results: GeneratedCampaign[] = [];
  let completed = 0;

  for (const platform of config.platforms) {
    for (let i = 1; i <= config.tier; i++) {
      const req: GenerationRequest = {
        platform,
        campaignType: config.type,
        topic: config.topic,
        productName: config.product_name,
        productCategory: config.product_category,
        tone: config.tone,
        affiliateLinks,
        index: i,
        total: config.tier,
        includeHashtags: config.include_hashtags,
        includeEmoji: config.include_emoji,
        customCta: config.custom_cta,
      };

      try {
        const prompt = buildPlatformPrompt(req);
        const response = await fetch(OPENROUTER_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://reesereviews.com",
            "X-Title": "Reese Reviews Affiliate Engine",
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1500,
            temperature: 0.9,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";

        // Parse email-specific fields
        let emailSubject: string | undefined;
        let emailPreheader: string | undefined;
        let body = content;

        if (platform === "email") {
          const subjectMatch = content.match(/^SUBJECT:\s*(.+)$/m);
          const preheaderMatch = content.match(/^PREHEADER:\s*(.+)$/m);
          if (subjectMatch) emailSubject = subjectMatch[1].trim();
          if (preheaderMatch) emailPreheader = preheaderMatch[1].trim();
          body = content
            .replace(/^SUBJECT:.+$/m, "")
            .replace(/^PREHEADER:.+$/m, "")
            .trim();
        }

        // Extract hashtags
        const hashtagMatches = content.match(/#\w+/g) || [];
        const hashtags = hashtagMatches.slice(0, PLATFORM_CONFIGS[platform].hashtag_limit);

        const generated: GeneratedCampaign = {
          id: `gen-${Date.now()}-${platform}-${i}`,
          campaign_id: config.id,
          platform,
          index: i,
          headline: body.split("\n")[0].replace(/^#+\s*/, "").substring(0, 100),
          body,
          hashtags,
          cta: config.custom_cta || "Click the link to learn more!",
          affiliate_links_used: affiliateLinks.map((l) => l.id),
          full_content: content,
          email_subject: emailSubject,
          email_preheader: emailPreheader,
          char_count: content.length,
          generated_at: new Date().toISOString(),
          status: "draft",
          clicks: 0,
          conversions: 0,
          engagement: 0,
        };

        results.push(generated);
        completed++;
        onProgress?.(completed, totalPosts);

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Failed to generate post ${i} for ${platform}:`, error);
        // Add a placeholder on failure
        results.push({
          id: `gen-${Date.now()}-${platform}-${i}-failed`,
          campaign_id: config.id,
          platform,
          index: i,
          headline: "Generation failed",
          body: `Failed to generate: ${error instanceof Error ? error.message : "Unknown error"}`,
          hashtags: [],
          cta: "",
          affiliate_links_used: [],
          full_content: "",
          char_count: 0,
          generated_at: new Date().toISOString(),
          status: "failed",
          clicks: 0,
          conversions: 0,
          engagement: 0,
        });
        completed++;
        onProgress?.(completed, totalPosts);
      }
    }
  }

  return results;
}

// ─── MAKE.COM WEBHOOK TRIGGER ─────────────────────────────────

export async function triggerMakeWebhook(
  webhookUrl: string,
  campaign: GeneratedCampaign,
  platform: SocialPlatform
): Promise<boolean> {
  try {
    const payload = {
      platform,
      content: campaign.full_content,
      hashtags: campaign.hashtags.join(" "),
      scheduled_for: campaign.scheduled_for || new Date().toISOString(),
      campaign_id: campaign.campaign_id,
      post_id: campaign.id,
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch {
    return false;
  }
}

// ─── BULK SCHEDULE ───────────────────────────────────────────

export function scheduleCampaignPosts(
  campaigns: GeneratedCampaign[],
  startDate: Date,
  postsPerDay: number
): GeneratedCampaign[] {
  return campaigns.map((campaign, index) => {
    const dayOffset = Math.floor(index / postsPerDay);
    const hourOffset = (index % postsPerDay) * Math.floor(24 / postsPerDay);
    const scheduledDate = new Date(startDate);
    scheduledDate.setDate(scheduledDate.getDate() + dayOffset);
    scheduledDate.setHours(hourOffset, 0, 0, 0);

    return {
      ...campaign,
      scheduled_for: scheduledDate.toISOString(),
      status: "scheduled" as const,
    };
  });
}

// ─── EXPORT CAMPAIGNS ────────────────────────────────────────

export function exportCampaignsCSV(campaigns: GeneratedCampaign[]): string {
  let csv = "ID,Platform,Index,Headline,Content,Hashtags,CTA,Char Count,Status,Generated At\n";
  campaigns.forEach((c) => {
    const safeBody = c.body.replace(/"/g, '""').replace(/\n/g, " ");
    csv += `"${c.id}","${c.platform}",${c.index},"${c.headline}","${safeBody}","${c.hashtags.join(" ")}","${c.cta}",${c.char_count},"${c.status}","${c.generated_at}"\n`;
  });
  return csv;
}

export function exportCampaignsJSON(campaigns: GeneratedCampaign[]): string {
  return JSON.stringify(campaigns, null, 2);
}
