/**
 * Unit Tests — Product Image Scraper Service
 * Tests: ASIN extraction, demo mode scraping, utility functions
 */
import { describe, it, expect } from "vitest";
import {
  extractAsinFromUrl,
  buildAmazonUrl,
  scrapeProductImages,
  sourceLabel,
  deduplicateImages,
  getReviewOnlyImages,
  countBySource,
  type ScrapedImage,
  type ProductImageResult,
} from "@/services/productImageScraper";

describe("Product Image Scraper", () => {
  describe("extractAsinFromUrl", () => {
    it("should extract ASIN from /dp/ URL", () => {
      expect(extractAsinFromUrl("https://www.amazon.com/dp/B0EXAMPLE1")).toBe("B0EXAMPLE1");
    });

    it("should extract ASIN from /dp/ URL with trailing path", () => {
      expect(extractAsinFromUrl("https://www.amazon.com/dp/B0EXAMPLE1/ref=abc")).toBe("B0EXAMPLE1");
    });

    it("should extract ASIN from /gp/product/ URL", () => {
      expect(extractAsinFromUrl("https://www.amazon.com/gp/product/B09TESTXYZ")).toBe("B09TESTXYZ");
    });

    it("should extract ASIN from URL with query params", () => {
      expect(extractAsinFromUrl("https://www.amazon.com/dp/B0EXAMPLE1?ref=sr_1")).toBe("B0EXAMPLE1");
    });

    it("should extract ASIN from long product URL", () => {
      const url = "https://www.amazon.com/Some-Product-Name-Here/dp/B0EXAMPLE1/ref=sr_1_1";
      expect(extractAsinFromUrl(url)).toBe("B0EXAMPLE1");
    });

    it("should return null for non-Amazon URLs", () => {
      expect(extractAsinFromUrl("https://www.google.com")).toBeNull();
    });

    it("should return null for empty string", () => {
      expect(extractAsinFromUrl("")).toBeNull();
    });

    it("should handle case-insensitive ASIN", () => {
      expect(extractAsinFromUrl("https://www.amazon.com/dp/b0example1")).toBe("B0EXAMPLE1");
    });
  });

  describe("buildAmazonUrl", () => {
    it("should build US Amazon URL", () => {
      expect(buildAmazonUrl("B0EXAMPLE1")).toBe("https://www.amazon.com/dp/B0EXAMPLE1");
    });

    it("should build UK Amazon URL", () => {
      expect(buildAmazonUrl("B0EXAMPLE1", "amazon.co.uk")).toBe("https://www.amazon.co.uk/dp/B0EXAMPLE1");
    });
  });

  describe("scrapeProductImages (demo mode)", () => {
    it("should return demo data when no proxy is configured", async () => {
      const result = await scrapeProductImages("B0TEST123", "Test Product");

      expect(result.isDemo).toBe(true);
      expect(result.asin).toBe("B0TEST123");
      expect(result.productName).toBe("Test Product");
      expect(result.listingImages.length).toBeGreaterThan(0);
      expect(result.reviewImages.length).toBeGreaterThan(0);
      expect(result.allImages.length).toBe(result.listingImages.length + result.reviewImages.length);
      expect(result.sources.length).toBeGreaterThan(0);
    });

    it("should include multiple sources in demo data", async () => {
      const result = await scrapeProductImages("B0TEST123", "Test Product");

      expect(result.sources).toContain("amazon-listing");
      expect(result.sources).toContain("amazon-review-uk");
      expect(result.sources).toContain("walmart-review");
      expect(result.sources).toContain("target-review");
    });

    it("should have listing images from Amazon listing", async () => {
      const result = await scrapeProductImages("B0TEST123", "Test Product");
      const listingSources = result.listingImages.map((img) => img.source);
      expect(listingSources.every((s) => s === "amazon-listing")).toBe(true);
    });

    it("should have review images from international sources", async () => {
      const result = await scrapeProductImages("B0TEST123", "Test Product");
      const reviewSources = new Set(result.reviewImages.map((img) => img.source));
      expect(reviewSources.has("amazon-review-uk")).toBe(true);
      expect(reviewSources.has("walmart-review")).toBe(true);
    });
  });

  describe("sourceLabel", () => {
    it("should return human-readable label", () => {
      expect(sourceLabel("amazon-listing")).toBe("Amazon Listing");
      expect(sourceLabel("amazon-review-uk")).toBe("Amazon UK Review");
      expect(sourceLabel("walmart-review")).toBe("Walmart Review");
      expect(sourceLabel("target-listing")).toBe("Target Listing");
    });
  });

  describe("deduplicateImages", () => {
    it("should remove duplicate URLs", () => {
      const images: ScrapedImage[] = [
        { url: "http://a.jpg", source: "amazon-listing", type: "listing", alt: "A" },
        { url: "http://a.jpg", source: "amazon-listing", type: "listing", alt: "A dup" },
        { url: "http://b.jpg", source: "walmart-review", type: "review", alt: "B" },
      ];
      const deduped = deduplicateImages(images);
      expect(deduped.length).toBe(2);
      expect(deduped[0].url).toBe("http://a.jpg");
      expect(deduped[1].url).toBe("http://b.jpg");
    });

    it("should handle empty array", () => {
      expect(deduplicateImages([])).toEqual([]);
    });
  });

  describe("getReviewOnlyImages", () => {
    it("should filter to review type only", () => {
      const result: ProductImageResult = {
        asin: "B0TEST",
        productName: "Test",
        listingImages: [{ url: "http://a.jpg", source: "amazon-listing", type: "listing", alt: "A" }],
        reviewImages: [{ url: "http://b.jpg", source: "amazon-review-uk", type: "review", alt: "B" }],
        allImages: [
          { url: "http://a.jpg", source: "amazon-listing", type: "listing", alt: "A" },
          { url: "http://b.jpg", source: "amazon-review-uk", type: "review", alt: "B" },
        ],
        sources: ["amazon-listing", "amazon-review-uk"],
        scrapedAt: new Date().toISOString(),
        isDemo: true,
      };

      const reviewOnly = getReviewOnlyImages(result);
      expect(reviewOnly.length).toBe(1);
      expect(reviewOnly[0].type).toBe("review");
    });
  });

  describe("countBySource", () => {
    it("should count images by source label", () => {
      const images: ScrapedImage[] = [
        { url: "http://1.jpg", source: "amazon-listing", type: "listing", alt: "" },
        { url: "http://2.jpg", source: "amazon-listing", type: "listing", alt: "" },
        { url: "http://3.jpg", source: "walmart-review", type: "review", alt: "" },
      ];
      const counts = countBySource(images);
      expect(counts["Amazon Listing"]).toBe(2);
      expect(counts["Walmart Review"]).toBe(1);
    });
  });
});
