import { describe, it, expect, beforeEach } from "vitest";
import {
  getPipelineReviews,
  savePipelineReviews,
  getPipelineStats,
  extractProsAndCons,
  generateExcerpt,
  generateVerdict,
  getPipelineReviewsByStatus,
  getPipelineReviewById,
  deletePipelineReview,
  clearPipeline,
  filterPipelineReviews,
  type PipelineReview,
  type PipelineStatus,
} from "./reviewPipeline";

// ── Fixture helpers ────────────────────────────────────────────

function makePipelineReview(overrides: Partial<PipelineReview> = {}): PipelineReview {
  return {
    id: "pipeline-rev-1",
    amazonReviewId: "amz-rev-1",
    asin: "B09XS7JWHH",
    productName: "Sony WH-1000XM5 Headphones",
    title: "Great headphones",
    body: "These headphones are amazing. I love the sound quality. No issues found.",
    rating: 5,
    date: "2026-01-15",
    images: [],
    productLink: "https://www.amazon.com/dp/B09XS7JWHH",
    status: "mapped",
    suggestedCategory: "tech",
    assignedCategory: "tech",
    categoryConfidence: "high",
    categoryMatchDetails: "keyword: headphone",
    categoryOverridden: false,
    affiliateLink: "https://www.amazon.com/dp/B09XS7JWHH?tag=test-20",
    pros: ["Great sound quality"],
    cons: ["No major issues found"],
    excerpt: "These headphones are amazing.",
    verdict: "Highly recommended.",
    reviewerName: "Reese",
    reviewerAvatar: "reese",
    isFeatured: true,
    importedAt: "2026-01-15T10:00:00.000Z",
    mappedAt: "2026-01-15T10:01:00.000Z",
    enrichedAt: null,
    publishedAt: null,
    publishedReviewId: null,
    ...overrides,
  };
}

describe("reviewPipeline", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ── getPipelineReviews ────────────────────────────────────

  describe("getPipelineReviews", () => {
    it("returns empty array when nothing is stored", () => {
      expect(getPipelineReviews()).toEqual([]);
    });

    it("returns stored reviews", () => {
      savePipelineReviews([makePipelineReview()]);
      expect(getPipelineReviews()).toHaveLength(1);
    });

    it("returns empty array on corrupted JSON (resilience)", () => {
      localStorage.setItem("reese-review-pipeline", "NOT{VALID}JSON");
      expect(getPipelineReviews()).toEqual([]);
    });
  });

  // ── savePipelineReviews ───────────────────────────────────

  describe("savePipelineReviews", () => {
    it("persists reviews and updates pipeline stats", () => {
      const reviews = [makePipelineReview(), makePipelineReview({ id: "pipeline-rev-2", amazonReviewId: "amz-rev-2" })];
      savePipelineReviews(reviews);
      expect(getPipelineReviews()).toHaveLength(2);
    });
  });

  // ── getPipelineStats ──────────────────────────────────────

  describe("getPipelineStats", () => {
    it("returns zero counts when nothing is stored", () => {
      const stats = getPipelineStats();
      expect(stats.totalImported).toBe(0);
      expect(stats.lastImportAt).toBeNull();
    });

    it("returns stats saved on savePipelineReviews", () => {
      savePipelineReviews([makePipelineReview()]);
      const stats = getPipelineStats();
      expect(stats.totalImported).toBe(1);
      expect(stats.lastImportAt).toBeTruthy();
    });

    it("counts statuses correctly", () => {
      savePipelineReviews([
        makePipelineReview({ id: "r1", status: "mapped" }),
        makePipelineReview({ id: "r2", status: "enriched" }),
        makePipelineReview({ id: "r3", status: "live", publishedAt: new Date().toISOString() }),
      ]);
      const stats = getPipelineStats();
      expect(stats.totalImported).toBe(3);
      expect(stats.totalMapped).toBe(3); // all non-"imported" status count
      expect(stats.totalEnriched).toBe(2); // "enriched" + "live"
      expect(stats.totalLive).toBe(1);
    });

    it("returns default stats on corrupted JSON (resilience)", () => {
      localStorage.setItem("reese-pipeline-stats", "{broken:");
      const stats = getPipelineStats();
      expect(stats.totalImported).toBe(0);
    });
  });

  // ── extractProsAndCons ────────────────────────────────────

  describe("extractProsAndCons", () => {
    it("extracts pros from positive review text", () => {
      const text =
        "These headphones are amazing. The sound quality is excellent. I love how comfortable they are.";
      const { pros } = extractProsAndCons(text);
      expect(pros.length).toBeGreaterThan(0);
    });

    it("extracts cons from negative review text", () => {
      const text =
        "The build quality is terrible. The cable is too short. The packaging was disappointing.";
      const { cons } = extractProsAndCons(text);
      expect(cons.length).toBeGreaterThan(0);
    });

    it("returns fallback pros when no positive sentences found", () => {
      const { pros } = extractProsAndCons("This is a product.");
      expect(pros).toContain("Quality product as described");
    });

    it("returns fallback cons when no negative sentences found", () => {
      const { cons } = extractProsAndCons("This is a product.");
      expect(cons).toContain("No major issues found");
    });

    it("caps pros at 5 items", () => {
      const text =
        "Amazing product. Excellent quality. Great value. Perfect fit. Outstanding performance. Fantastic durability. Incredible design.";
      const { pros } = extractProsAndCons(text);
      expect(pros.length).toBeLessThanOrEqual(5);
    });

    it("caps cons at 3 items", () => {
      const text =
        "Terrible packaging. Awful smell. Horrible texture. Disappointing quality. Flimsy build. Poor instructions.";
      const { cons } = extractProsAndCons(text);
      expect(cons.length).toBeLessThanOrEqual(3);
    });

    it("handles empty string input", () => {
      const { pros, cons } = extractProsAndCons("");
      expect(pros).toHaveLength(1); // fallback
      expect(cons).toHaveLength(1); // fallback
    });
  });

  // ── generateExcerpt ───────────────────────────────────────

  describe("generateExcerpt", () => {
    it("returns the full body when it fits within maxLength", () => {
      const short = "Short review text.";
      expect(generateExcerpt(short)).toBe(short);
    });

    it("truncates at sentence boundary when possible", () => {
      const long = "This is the first sentence. " + "A".repeat(200);
      const excerpt = generateExcerpt(long, 50);
      expect(excerpt.endsWith(".")).toBe(true);
    });

    it("truncates at word boundary with ellipsis if no sentence boundary found", () => {
      const long = "A".repeat(200);
      const excerpt = generateExcerpt(long, 50);
      expect(excerpt.length).toBeLessThanOrEqual(53); // 50 + "..."
    });

    it("respects custom maxLength", () => {
      const text = "Hello world. This is a test sentence with some more words here.";
      const excerpt = generateExcerpt(text, 20);
      expect(excerpt.length).toBeLessThanOrEqual(23);
    });
  });

  // ── generateVerdict ───────────────────────────────────────

  describe("generateVerdict", () => {
    it("returns a string verdict", () => {
      const verdict = generateVerdict("Great product overall.", 5);
      expect(typeof verdict).toBe("string");
      expect(verdict.length).toBeGreaterThan(0);
    });

    it("uses fallback verdicts for each star rating", () => {
      const v5 = generateVerdict("xyz", 5);
      const v1 = generateVerdict("xyz", 1);
      expect(v5).toContain("Highly recommended");
      expect(v1).toContain("Not recommended");
    });

    it("extracts verdict from the last meaningful sentence", () => {
      const body =
        "I have been using this product for months. It works well every day. Overall, I am very satisfied with my purchase.";
      const verdict = generateVerdict(body, 5);
      // Should extract the last meaningful sentence
      expect(verdict).toContain("satisfied");
    });

    it("falls back to rating-based verdict for very short bodies", () => {
      const verdict = generateVerdict("Good.", 4);
      expect(verdict).toContain("Recommended");
    });
  });

  // ── getPipelineReviewsByStatus ────────────────────────────

  describe("getPipelineReviewsByStatus", () => {
    it("returns reviews with the matching status", () => {
      savePipelineReviews([
        makePipelineReview({ id: "r1", status: "mapped" }),
        makePipelineReview({ id: "r2", status: "enriched" }),
        makePipelineReview({ id: "r3", status: "mapped" }),
      ]);
      const mapped = getPipelineReviewsByStatus("mapped");
      expect(mapped).toHaveLength(2);
      mapped.forEach((r) => expect(r.status).toBe("mapped"));
    });

    it("returns empty array when no reviews match", () => {
      savePipelineReviews([makePipelineReview({ status: "mapped" })]);
      expect(getPipelineReviewsByStatus("live")).toHaveLength(0);
    });
  });

  // ── getPipelineReviewById ─────────────────────────────────

  describe("getPipelineReviewById", () => {
    it("finds a review by id", () => {
      savePipelineReviews([makePipelineReview({ id: "find-me" })]);
      const found = getPipelineReviewById("find-me");
      expect(found).toBeDefined();
      expect(found?.id).toBe("find-me");
    });

    it("returns undefined for an unknown id", () => {
      expect(getPipelineReviewById("ghost")).toBeUndefined();
    });
  });

  // ── deletePipelineReview ──────────────────────────────────

  describe("deletePipelineReview", () => {
    it("removes a review by id", () => {
      savePipelineReviews([makePipelineReview({ id: "del-me" })]);
      deletePipelineReview("del-me");
      expect(getPipelineReviews()).toHaveLength(0);
    });

    it("leaves other reviews intact", () => {
      savePipelineReviews([
        makePipelineReview({ id: "keep" }),
        makePipelineReview({ id: "del-me" }),
      ]);
      deletePipelineReview("del-me");
      expect(getPipelineReviews()).toHaveLength(1);
      expect(getPipelineReviews()[0].id).toBe("keep");
    });
  });

  // ── clearPipeline ─────────────────────────────────────────

  describe("clearPipeline", () => {
    it("empties the pipeline", () => {
      savePipelineReviews([makePipelineReview()]);
      clearPipeline();
      expect(getPipelineReviews()).toHaveLength(0);
    });
  });

  // ── filterPipelineReviews ─────────────────────────────────

  describe("filterPipelineReviews", () => {
    beforeEach(() => {
      savePipelineReviews([
        makePipelineReview({ id: "r1", status: "mapped", assignedCategory: "tech", rating: 5 }),
        makePipelineReview({ id: "r2", status: "enriched", assignedCategory: "products", rating: 3 }),
        makePipelineReview({ id: "r3", status: "live", assignedCategory: "tech", rating: 4, isFeatured: false }),
      ]);
    });

    it("filters by status", () => {
      const result = filterPipelineReviews({ status: "mapped" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("r1");
    });

    it("filters by category", () => {
      const result = filterPipelineReviews({ category: "tech" });
      expect(result).toHaveLength(2);
    });

    it("filters by exact rating", () => {
      const result = filterPipelineReviews({ rating: 5 });
      expect(result.every((r) => r.rating === 5)).toBe(true);
    });

    it("filters by search keyword in product name", () => {
      const result = filterPipelineReviews({ search: "sony" });
      // All fixture reviews have "Sony WH-1000XM5 Headphones" as product name
      expect(result.length).toBe(3);
    });

    it("combines multiple filters (category + rating)", () => {
      const result = filterPipelineReviews({ category: "tech", rating: 5 });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("r1");
    });

    it("returns all reviews when filter is empty", () => {
      expect(filterPipelineReviews({})).toHaveLength(3);
    });
  });
});
