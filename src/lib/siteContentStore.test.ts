import { describe, it, expect, beforeEach } from "vitest";
import {
  getSiteContent,
  saveSiteContent,
  resetSiteContent,
  DEFAULT_SITE_CONTENT,
} from "./siteContentStore";

describe("siteContentStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ── getSiteContent ────────────────────────────────────────

  describe("getSiteContent", () => {
    it("returns DEFAULT_SITE_CONTENT when nothing is stored", () => {
      const content = getSiteContent();
      expect(content.heroTitle).toBe(DEFAULT_SITE_CONTENT.heroTitle);
      expect(content.footerBrand).toBe(DEFAULT_SITE_CONTENT.footerBrand);
    });

    it("merges stored partial data with defaults", () => {
      localStorage.setItem(
        "reese-reviews-site-content",
        JSON.stringify({ heroTitle: "Custom Title" })
      );
      const content = getSiteContent();
      expect(content.heroTitle).toBe("Custom Title");
      // Other fields should remain as defaults
      expect(content.footerBrand).toBe(DEFAULT_SITE_CONTENT.footerBrand);
    });

    it("falls back to defaults on corrupted JSON (json parse resilience)", () => {
      localStorage.setItem("reese-reviews-site-content", "NOT{VALID}JSON{{");
      const content = getSiteContent();
      expect(content.heroTitle).toBe(DEFAULT_SITE_CONTENT.heroTitle);
    });
  });

  // ── saveSiteContent ───────────────────────────────────────

  describe("saveSiteContent", () => {
    it("saves partial updates and returns merged content", () => {
      const result = saveSiteContent({ heroTitle: "My Reviews" });
      expect(result.heroTitle).toBe("My Reviews");
      expect(result.footerBrand).toBe(DEFAULT_SITE_CONTENT.footerBrand);
    });

    it("persists changes to localStorage", () => {
      saveSiteContent({ heroSubtitle: "The Best Reviews" });
      const content = getSiteContent();
      expect(content.heroSubtitle).toBe("The Best Reviews");
    });

    it("dispatches a site-content-updated custom event", () => {
      let eventFired = false;
      window.addEventListener("site-content-updated", () => {
        eventFired = true;
      });
      saveSiteContent({ heroTitle: "Event Test" });
      expect(eventFired).toBe(true);
    });

    it("saves complex nested updates (aboutValues)", () => {
      const newValues = [{ title: "Test Value", description: "A test" }];
      saveSiteContent({ aboutValues: newValues });
      expect(getSiteContent().aboutValues).toEqual(newValues);
    });
  });

  // ── resetSiteContent ──────────────────────────────────────

  describe("resetSiteContent", () => {
    it("resets content back to defaults", () => {
      saveSiteContent({ heroTitle: "Custom Title" });
      resetSiteContent();
      expect(getSiteContent().heroTitle).toBe(DEFAULT_SITE_CONTENT.heroTitle);
    });

    it("removes the localStorage key on reset", () => {
      saveSiteContent({ heroTitle: "Custom Title" });
      resetSiteContent();
      expect(localStorage.getItem("reese-reviews-site-content")).toBeNull();
    });

    it("dispatches a site-content-updated event on reset", () => {
      let eventFired = false;
      window.addEventListener("site-content-updated", () => {
        eventFired = true;
      });
      resetSiteContent();
      expect(eventFired).toBe(true);
    });
  });

  // ── DEFAULT_SITE_CONTENT ──────────────────────────────────

  describe("DEFAULT_SITE_CONTENT", () => {
    it("has required fields populated", () => {
      expect(DEFAULT_SITE_CONTENT.heroTitle).toBeTruthy();
      expect(DEFAULT_SITE_CONTENT.heroSubtitle).toBeTruthy();
      expect(DEFAULT_SITE_CONTENT.footerBrand).toBeTruthy();
    });

    it("has at least one category", () => {
      expect(DEFAULT_SITE_CONTENT.categories.length).toBeGreaterThan(0);
    });

    it("has at least one aboutValue", () => {
      expect(DEFAULT_SITE_CONTENT.aboutValues.length).toBeGreaterThan(0);
    });
  });
});
