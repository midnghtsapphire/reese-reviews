import { describe, it, expect, beforeEach } from "vitest";
import {
  getAffiliateLinks,
  saveAffiliateLinks,
  trackAffiliateLinkClick,
  getCampaigns,
  saveCampaign,
  deleteCampaign,
  getGeneratedCampaigns,
  saveGeneratedCampaigns,
  addGeneratedCampaigns,
  getWebhooks,
  saveWebhook,
} from "./affiliateStore";
import { OWNER_AFFILIATE_LINKS } from "./affiliateTypes";
import type { CampaignConfig, GeneratedCampaign, MakeWebhookConfig } from "./affiliateTypes";

const mockCampaign: CampaignConfig = {
  id: "camp-1",
  name: "Spring Campaign",
  type: "product_promotion",
  tier: 3,
  platforms: ["twitter"],
  affiliate_links: ["make-com"],
  topic: "automation tools",
  tone: "casual",
  include_hashtags: true,
  include_emoji: true,
  include_cta: true,
  created_at: new Date().toISOString(),
  status: "draft",
  generated_count: 0,
};

const mockWebhook: MakeWebhookConfig = {
  id: "wh-1",
  name: "Twitter Webhook",
  webhook_url: "https://hook.make.com/test",
  platform: "twitter",
  active: true,
  success_count: 0,
  failure_count: 0,
};

describe("affiliateStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ── getAffiliateLinks ─────────────────────────────────────

  describe("getAffiliateLinks", () => {
    it("returns OWNER_AFFILIATE_LINKS when nothing is stored", () => {
      const links = getAffiliateLinks();
      expect(links.length).toBe(OWNER_AFFILIATE_LINKS.length);
    });

    it("returns stored links when data exists", () => {
      saveAffiliateLinks(OWNER_AFFILIATE_LINKS.slice(0, 2));
      expect(getAffiliateLinks()).toHaveLength(2);
    });

    it("returns OWNER_AFFILIATE_LINKS on corrupted JSON (resilience)", () => {
      localStorage.setItem("reese-affiliate-links", "CORRUPT{{{");
      const links = getAffiliateLinks();
      expect(links.length).toBe(OWNER_AFFILIATE_LINKS.length);
    });
  });

  // ── trackAffiliateLinkClick ───────────────────────────────

  describe("trackAffiliateLinkClick", () => {
    it("increments clicks count for a known link id", () => {
      const initialLinks = getAffiliateLinks();
      const firstId = initialLinks[0].id;
      const initialClicks = initialLinks[0].clicks;
      trackAffiliateLinkClick(firstId);
      const updated = getAffiliateLinks().find((l) => l.id === firstId);
      expect(updated?.clicks).toBe(initialClicks + 1);
    });

    it("sets last_used timestamp on click", () => {
      const firstId = getAffiliateLinks()[0].id;
      trackAffiliateLinkClick(firstId);
      const link = getAffiliateLinks().find((l) => l.id === firstId);
      expect(link?.last_used).toBeTruthy();
    });

    it("does nothing for an unknown link id", () => {
      const countBefore = getAffiliateLinks().length;
      trackAffiliateLinkClick("non-existent-id");
      expect(getAffiliateLinks().length).toBe(countBefore);
    });
  });

  // ── getCampaigns / saveCampaign / deleteCampaign ──────────

  describe("getCampaigns", () => {
    it("returns empty array when nothing is stored", () => {
      expect(getCampaigns()).toEqual([]);
    });

    it("returns stored campaigns", () => {
      saveCampaign(mockCampaign);
      expect(getCampaigns()).toHaveLength(1);
    });

    it("returns empty array on corrupted JSON (resilience)", () => {
      localStorage.setItem("reese-affiliate-campaigns", "BROKEN{{JSON");
      expect(getCampaigns()).toEqual([]);
    });
  });

  describe("saveCampaign", () => {
    it("saves a new campaign", () => {
      saveCampaign(mockCampaign);
      const campaigns = getCampaigns();
      expect(campaigns[0].name).toBe("Spring Campaign");
    });

    it("updates an existing campaign by id", () => {
      saveCampaign(mockCampaign);
      saveCampaign({ ...mockCampaign, name: "Updated Campaign" });
      const campaigns = getCampaigns();
      expect(campaigns).toHaveLength(1);
      expect(campaigns[0].name).toBe("Updated Campaign");
    });
  });

  describe("deleteCampaign", () => {
    it("removes a campaign by id", () => {
      saveCampaign(mockCampaign);
      deleteCampaign("camp-1");
      expect(getCampaigns()).toHaveLength(0);
    });

    it("leaves other campaigns intact", () => {
      saveCampaign(mockCampaign);
      saveCampaign({ ...mockCampaign, id: "camp-2", name: "Second" });
      deleteCampaign("camp-1");
      expect(getCampaigns()).toHaveLength(1);
      expect(getCampaigns()[0].id).toBe("camp-2");
    });
  });

  // ── getGeneratedCampaigns / saveGeneratedCampaigns ────────

  describe("getGeneratedCampaigns", () => {
    it("returns empty array when nothing is stored", () => {
      expect(getGeneratedCampaigns()).toEqual([]);
    });

    it("returns empty array on corrupted JSON (resilience)", () => {
      localStorage.setItem("reese-affiliate-generated", "{broken:");
      expect(getGeneratedCampaigns()).toEqual([]);
    });
  });

  describe("saveGeneratedCampaigns", () => {
    it("saves and retrieves generated campaigns", () => {
      const gen: GeneratedCampaign = {
        id: "gen-1",
        campaign_id: "camp-1",
        platform: "twitter",
        index: 1,
        headline: "Test",
        body: "Body content",
        hashtags: ["#test"],
        cta: "Click here",
        affiliate_links_used: [],
        full_content: "Test Body content",
        char_count: 20,
        generated_at: new Date().toISOString(),
        status: "draft",
        clicks: 0,
        conversions: 0,
        engagement: 0,
      };
      saveGeneratedCampaigns([gen]);
      expect(getGeneratedCampaigns()).toHaveLength(1);
      expect(getGeneratedCampaigns()[0].headline).toBe("Test");
    });
  });

  describe("addGeneratedCampaigns", () => {
    it("appends campaigns to existing ones", () => {
      const gen1: GeneratedCampaign = {
        id: "gen-1", campaign_id: "camp-1", platform: "twitter", index: 1,
        headline: "First", body: "b", hashtags: [], cta: "cta", affiliate_links_used: [],
        full_content: "First b", char_count: 7, generated_at: new Date().toISOString(),
        status: "draft", clicks: 0, conversions: 0, engagement: 0,
      };
      const gen2: GeneratedCampaign = {
        id: "gen-2", campaign_id: "camp-1", platform: "twitter", index: 2,
        headline: "Second", body: "b", hashtags: [], cta: "cta", affiliate_links_used: [],
        full_content: "Second b", char_count: 8, generated_at: new Date().toISOString(),
        status: "draft", clicks: 0, conversions: 0, engagement: 0,
      };
      saveGeneratedCampaigns([gen1]);
      addGeneratedCampaigns([gen2]);
      expect(getGeneratedCampaigns()).toHaveLength(2);
    });
  });

  // ── getWebhooks / saveWebhook ─────────────────────────────

  describe("getWebhooks", () => {
    it("returns empty array when nothing is stored", () => {
      expect(getWebhooks()).toEqual([]);
    });

    it("returns empty array on corrupted JSON (resilience)", () => {
      localStorage.setItem("reese-affiliate-webhooks", "{{bad");
      expect(getWebhooks()).toEqual([]);
    });
  });

  describe("saveWebhook", () => {
    it("saves a new webhook", () => {
      saveWebhook(mockWebhook);
      expect(getWebhooks()).toHaveLength(1);
    });

    it("updates an existing webhook by id", () => {
      saveWebhook(mockWebhook);
      saveWebhook({ ...mockWebhook, name: "Updated Webhook" });
      expect(getWebhooks()).toHaveLength(1);
      expect(getWebhooks()[0].name).toBe("Updated Webhook");
    });

    it("preserves other webhooks when updating one", () => {
      saveWebhook(mockWebhook);
      saveWebhook({ ...mockWebhook, id: "wh-2", name: "Second Webhook" });
      expect(getWebhooks()).toHaveLength(2);
    });
  });
});
