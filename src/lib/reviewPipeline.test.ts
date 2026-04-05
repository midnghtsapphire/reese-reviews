import { describe, it, expect, beforeEach } from "vitest";
import {
  extractProsAndCons,
  generateExcerpt,
  generateVerdict,
  convertToPipelineReview,
  getPipelineReviews,
  savePipelineReviews,
  clearPipeline,
  enrichReview,
  markEnriched,
  publishReview,
  bulkPublish,
  unpublishReview,
  overrideCategory,
  deletePipelineReview,
  getPipelineReviewsByStatus,
  getPipelineReviewsByCategory,
  getPipelineReviewById,
  getPublishableReviews,
  getUnpublishedReviews,
  bulkImport,
  incrementalSync,
  type PipelineReview,
  type EnrichmentData,
} from "./reviewPipeline";
import type { AmazonReview } from "./amazonReviewStore";
import { saveAmazonReviews, clearAmazonReviews } from "./amazonReviewStore";

// ─── Helpers ─────────────────────────────────────────────────

/** Minimal AmazonReview for seeding tests. */
function makeAmazonReview(overrides: Partial<AmazonReview> = {}): AmazonReview {
  return {
    id: `amazon-test-${Date.now()}-${Math.random()}`,
    asin: "B09TESTASIN",
    productName: "Wireless Earbuds Pro X",
    productLink: "https://www.amazon.com/dp/B09TESTASIN",
    title: "Great sound quality with excellent battery life",
    body: "I love these earbuds. They have amazing sound quality. The battery life is excellent — over 8 hours on a single charge. No major issues found.",
    rating: 4,
    date: "2026-01-15",
    images: [],
    source: "html",
    status: "draft",
    ...overrides,
  };
}

/** Minimal PipelineReview for direct storage tests. */
function makePipelineReview(overrides: Partial<PipelineReview> = {}): PipelineReview {
  const now = new Date().toISOString();
  return {
    id: `pipeline-test-${Date.now()}-${Math.random()}`,
    amazonReviewId: "amazon-test-123",
    asin: "B09TESTASIN",
    productName: "Wireless Earbuds Pro X",
    title: "Great sound quality",
    body: "Amazing earbuds with great battery life.",
    rating: 4,
    date: "2026-01-15",
    images: [],
    productLink: "https://www.amazon.com/dp/B09TESTASIN",
    status: "mapped",
    suggestedCategory: "tech",
    assignedCategory: "tech",
    categoryConfidence: "high",
    categoryMatchDetails: "tech keyword match",
    categoryOverridden: false,
    affiliateLink: "https://www.amazon.com/dp/B09TESTASIN?tag=reesereviews-20",
    pros: ["Great sound"],
    cons: ["No major issues found"],
    excerpt: "Amazing earbuds with great battery life.",
    verdict: "A solid choice with minor room for improvement. Recommended.",
    reviewerName: "Reese",
    reviewerAvatar: "reese",
    isFeatured: true,
    importedAt: now,
    mappedAt: now,
    enrichedAt: null,
    publishedAt: null,
    publishedReviewId: null,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────

describe("reviewPipeline", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ── extractProsAndCons ────────────────────────────────────

  describe("extractProsAndCons", () => {
    it("extracts pros from positive text", () => {
      const text = "I love this product. It is amazing and works perfectly. Outstanding quality for the price.";
      const { pros } = extractProsAndCons(text);
      expect(pros.length).toBeGreaterThan(0);
    });

    it("extracts cons from negative text", () => {
      const text = "The battery issue is frustrating. It doesn't last long enough. There is a problem with the charging case.";
      const { cons } = extractProsAndCons(text);
      expect(cons.length).toBeGreaterThan(0);
    });

    it("returns fallback pros when nothing positive is detected", () => {
      const { pros } = extractProsAndCons("A product exists.");
      expect(pros.length).toBeGreaterThan(0); // fallback
      expect(pros[0]).toContain("Quality product");
    });

    it("returns fallback cons when nothing negative detected", () => {
      const { cons } = extractProsAndCons("Everything is perfect!");
      expect(cons.length).toBeGreaterThan(0); // fallback
    });

    it("caps pros at 5 items", () => {
      const text = Array(10)
        .fill("I love this. Amazing quality. Best product. Excellent design. Perfect value. Solid build. Beautiful finish. Smooth experience. Great support. Fantastic.")
        .join(" ");
      const { pros } = extractProsAndCons(text);
      expect(pros.length).toBeLessThanOrEqual(5);
    });

    it("caps cons at 3 items", () => {
      const text = "Hate the noise. Terrible battery. Awful design. Worst build quality. Horrible support. The problem is real.";
      const { cons } = extractProsAndCons(text);
      expect(cons.length).toBeLessThanOrEqual(3);
    });

    it("handles empty string without throwing", () => {
      expect(() => extractProsAndCons("")).not.toThrow();
      const { pros, cons } = extractProsAndCons("");
      expect(Array.isArray(pros)).toBe(true);
      expect(Array.isArray(cons)).toBe(true);
    });
  });

  // ── generateExcerpt ───────────────────────────────────────

  describe("generateExcerpt", () => {
    it("returns the full body when under maxLength", () => {
      const body = "Short review.";
      expect(generateExcerpt(body, 160)).toBe(body);
    });

    it("truncates at sentence boundary when possible", () => {
      const body = "First sentence. Second sentence that makes it go longer. Third sentence to push it over the limit here.";
      const excerpt = generateExcerpt(body, 50);
      // The excerpt includes the sentence-ending period, so may be up to maxLength+1
      expect(excerpt.length).toBeLessThanOrEqual(51);
    });

    it("truncates with ellipsis when no sentence boundary", () => {
      const body = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789extra";
      const excerpt = generateExcerpt(body, 20);
      expect(excerpt.length).toBeLessThanOrEqual(23); // "..." adds 3
    });

    it("uses default maxLength of 160", () => {
      const longBody = "x".repeat(200);
      const excerpt = generateExcerpt(longBody);
      expect(excerpt.length).toBeLessThanOrEqual(163); // 160 + "..."
    });

    it("handles empty string", () => {
      expect(generateExcerpt("")).toBe("");
    });
  });

  // ── generateVerdict ───────────────────────────────────────

  describe("generateVerdict", () => {
    it("returns verdict from last meaningful sentence when available", () => {
      const body = "Setup was easy. The sound quality is exceptional and worth every penny.";
      const verdict = generateVerdict(body, 5);
      expect(typeof verdict).toBe("string");
      expect(verdict.length).toBeGreaterThan(0);
    });

    it("falls back to rating-based verdict for rating 5", () => {
      const verdict = generateVerdict("x", 5);
      expect(verdict).toContain("Highly recommended");
    });

    it("falls back to rating-based verdict for rating 1", () => {
      const verdict = generateVerdict("x", 1);
      expect(verdict).toContain("Not recommended");
    });

    it("falls back to rating 3 for rating 3", () => {
      const verdict = generateVerdict("x", 3);
      expect(verdict).toContain("Decent product");
    });

    it("returns a string ending with a period", () => {
      const verdict = generateVerdict("x", 4);
      expect(verdict.endsWith(".")).toBe(true);
    });

    it("handles decimal ratings by rounding", () => {
      expect(() => generateVerdict("x", 4.5)).not.toThrow();
    });
  });

  // ── convertToPipelineReview ───────────────────────────────

  describe("convertToPipelineReview", () => {
    it("creates a PipelineReview from an AmazonReview", () => {
      const ar = makeAmazonReview();
      const pr = convertToPipelineReview(ar);
      expect(pr.id).toBe(`pipeline-${ar.id}`);
      expect(pr.amazonReviewId).toBe(ar.id);
      expect(pr.asin).toBe(ar.asin);
      expect(pr.title).toBe(ar.title);
      expect(pr.rating).toBe(ar.rating);
      expect(pr.status).toBe("mapped");
    });

    it("auto-assigns a category", () => {
      const ar = makeAmazonReview({ productName: "Apple iPhone 15 Pro" });
      const pr = convertToPipelineReview(ar);
      expect(typeof pr.assignedCategory).toBe("string");
      expect(pr.assignedCategory.length).toBeGreaterThan(0);
    });

    it("extracts pros and cons from review body", () => {
      const ar = makeAmazonReview({
        body: "I love this product. Amazing quality. No issues at all.",
      });
      const pr = convertToPipelineReview(ar);
      expect(Array.isArray(pr.pros)).toBe(true);
      expect(Array.isArray(pr.cons)).toBe(true);
      expect(pr.pros.length).toBeGreaterThan(0);
    });

    it("generates a non-empty excerpt", () => {
      const ar = makeAmazonReview();
      const pr = convertToPipelineReview(ar);
      expect(typeof pr.excerpt).toBe("string");
      expect(pr.excerpt.length).toBeGreaterThan(0);
    });

    it("generates a non-empty verdict", () => {
      const ar = makeAmazonReview();
      const pr = convertToPipelineReview(ar);
      expect(typeof pr.verdict).toBe("string");
      expect(pr.verdict.length).toBeGreaterThan(0);
    });

    it("builds affiliate link from ASIN", () => {
      const ar = makeAmazonReview({ asin: "B09AFFILIATE" });
      const pr = convertToPipelineReview(ar);
      expect(pr.affiliateLink).toContain("B09AFFILIATE");
    });

    it("sets isFeatured=true for rating >= 4", () => {
      expect(convertToPipelineReview(makeAmazonReview({ rating: 4 })).isFeatured).toBe(true);
      expect(convertToPipelineReview(makeAmazonReview({ rating: 5 })).isFeatured).toBe(true);
    });

    it("sets isFeatured=false for rating < 4", () => {
      expect(convertToPipelineReview(makeAmazonReview({ rating: 3 })).isFeatured).toBe(false);
    });

    it("sets reviewerAvatar to reese by default", () => {
      const pr = convertToPipelineReview(makeAmazonReview());
      expect(pr.reviewerAvatar).toBe("reese");
    });

    it("publishedAt and publishedReviewId are null on creation", () => {
      const pr = convertToPipelineReview(makeAmazonReview());
      expect(pr.publishedAt).toBeNull();
      expect(pr.publishedReviewId).toBeNull();
    });
  });

  // ── getPipelineReviews / savePipelineReviews / clearPipeline ─

  describe("getPipelineReviews / savePipelineReviews / clearPipeline", () => {
    it("returns empty array when nothing stored", () => {
      expect(getPipelineReviews()).toEqual([]);
    });

    it("saves and retrieves reviews", () => {
      const pr = makePipelineReview({ id: "stored-pipe-1" });
      savePipelineReviews([pr]);
      const result = getPipelineReviews();
      expect(result.length).toBe(1);
      expect(result[0].id).toBe("stored-pipe-1");
    });

    it("clearPipeline removes all pipeline data", () => {
      savePipelineReviews([makePipelineReview()]);
      clearPipeline();
      expect(getPipelineReviews()).toEqual([]);
    });

    it("returns empty array on corrupted localStorage", () => {
      localStorage.setItem("reese-review-pipeline", "{{bad-json");
      expect(getPipelineReviews()).toEqual([]);
    });
  });

  // ── enrichReview ─────────────────────────────────────────

  describe("enrichReview", () => {
    it("applies EnrichmentData to a pipeline review", () => {
      const pr = makePipelineReview({ id: "enrich-1", status: "mapped" });
      savePipelineReviews([pr]);

      const data: EnrichmentData = {
        pros: ["Updated pro"],
        cons: ["Updated con"],
        verdict: "Highly recommended.",
        reviewerName: "Caresse",
        reviewerAvatar: "revvel",
      };
      enrichReview("enrich-1", data);

      const updated = getPipelineReviews().find((r) => r.id === "enrich-1");
      expect(updated?.pros).toEqual(["Updated pro"]);
      expect(updated?.cons).toEqual(["Updated con"]);
      expect(updated?.verdict).toBe("Highly recommended.");
      expect(updated?.reviewerName).toBe("Caresse");
      expect(updated?.reviewerAvatar).toBe("revvel");
    });

    it("advances status from mapped to enriched", () => {
      const pr = makePipelineReview({ id: "enrich-2", status: "mapped" });
      savePipelineReviews([pr]);
      enrichReview("enrich-2", { verdict: "Worth it." });
      const updated = getPipelineReviews().find((r) => r.id === "enrich-2");
      expect(updated?.status).toBe("enriched");
    });

    it("sets enrichedAt timestamp", () => {
      const pr = makePipelineReview({ id: "enrich-3" });
      savePipelineReviews([pr]);
      enrichReview("enrich-3", {});
      const updated = getPipelineReviews().find((r) => r.id === "enrich-3");
      expect(typeof updated?.enrichedAt).toBe("string");
    });

    it("does nothing for non-existent id", () => {
      savePipelineReviews([makePipelineReview({ id: "real-id" })]);
      expect(() => enrichReview("nonexistent-id", { verdict: "x" })).not.toThrow();
      expect(getPipelineReviews().length).toBe(1);
    });

    it("supports AvatarChoice: reese | revvel", () => {
      const pr = makePipelineReview({ id: "avatar-test" });
      savePipelineReviews([pr]);
      enrichReview("avatar-test", { reviewerAvatar: "reese" });
      expect(
        getPipelineReviews().find((r) => r.id === "avatar-test")?.reviewerAvatar
      ).toBe("reese");
    });
  });

  // ── markEnriched ─────────────────────────────────────────

  describe("markEnriched", () => {
    it("sets status to enriched and enrichedAt timestamp", () => {
      const pr = makePipelineReview({ id: "mark-1", status: "mapped", enrichedAt: null });
      savePipelineReviews([pr]);
      markEnriched("mark-1");
      const updated = getPipelineReviews().find((r) => r.id === "mark-1");
      expect(updated?.status).toBe("enriched");
      expect(typeof updated?.enrichedAt).toBe("string");
    });

    it("does nothing for non-existent id", () => {
      expect(() => markEnriched("bad-id")).not.toThrow();
    });
  });

  // ── publishReview ────────────────────────────────────────

  describe("publishReview", () => {
    it("returns null for non-existent pipeline id", () => {
      expect(publishReview("not-found")).toBeNull();
    });

    it("returns ReviewData on success", () => {
      const pr = makePipelineReview({ id: "pub-1", status: "enriched" });
      savePipelineReviews([pr]);
      const result = publishReview("pub-1");
      expect(result).not.toBeNull();
      expect(typeof result!.id).toBe("string");
      expect(result!.status).toBe("approved");
    });

    it("marks pipeline review as published with timestamp", () => {
      const pr = makePipelineReview({ id: "pub-2", status: "enriched" });
      savePipelineReviews([pr]);
      publishReview("pub-2");
      const updated = getPipelineReviews().find((r) => r.id === "pub-2");
      expect(updated?.status).toBe("published");
      expect(typeof updated?.publishedAt).toBe("string");
      expect(typeof updated?.publishedReviewId).toBe("string");
    });

    it("saves review to reviewStore (localStorage)", () => {
      const pr = makePipelineReview({ id: "pub-3", status: "enriched" });
      savePipelineReviews([pr]);
      publishReview("pub-3");
      const siteReviews = JSON.parse(
        localStorage.getItem("reese-reviews-data") ?? "[]"
      );
      expect(siteReviews.length).toBeGreaterThan(0);
    });

    it("does not create duplicate entries when publishing same review twice", () => {
      const pr = makePipelineReview({ id: "pub-4", status: "enriched" });
      savePipelineReviews([pr]);
      publishReview("pub-4");
      publishReview("pub-4");
      const siteReviews = JSON.parse(
        localStorage.getItem("reese-reviews-data") ?? "[]"
      );
      // Same review should be upserted, not duplicated
      const ids = siteReviews.map((r: { id: string }) => r.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });
  });

  // ── bulkPublish ─────────────────────────────────────────

  describe("bulkPublish", () => {
    it("publishes multiple reviews and returns counts", () => {
      const p1 = makePipelineReview({ id: "bulk-1", status: "enriched" });
      const p2 = makePipelineReview({ id: "bulk-2", status: "enriched" });
      savePipelineReviews([p1, p2]);
      const result = bulkPublish(["bulk-1", "bulk-2"]);
      expect(result.published).toBe(2);
      expect(result.failed).toBe(0);
    });

    it("counts failed for non-existent ids", () => {
      const result = bulkPublish(["fake-1", "fake-2"]);
      expect(result.failed).toBe(2);
      expect(result.published).toBe(0);
    });

    it("returns { published: 0, failed: 0 } for empty array", () => {
      const result = bulkPublish([]);
      expect(result.published).toBe(0);
      expect(result.failed).toBe(0);
    });
  });

  // ── unpublishReview ──────────────────────────────────────

  describe("unpublishReview", () => {
    it("reverts status to enriched", () => {
      const pr = makePipelineReview({ id: "unpub-1", status: "enriched" });
      savePipelineReviews([pr]);
      publishReview("unpub-1");
      unpublishReview("unpub-1");
      const updated = getPipelineReviews().find((r) => r.id === "unpub-1");
      expect(updated?.status).toBe("enriched");
      expect(updated?.publishedAt).toBeNull();
    });

    it("does nothing for non-existent id", () => {
      expect(() => unpublishReview("bad-id")).not.toThrow();
    });
  });

  // ── overrideCategory ────────────────────────────────────

  describe("overrideCategory", () => {
    it("overrides the assigned category", () => {
      const pr = makePipelineReview({ id: "cat-1", assignedCategory: "tech" });
      savePipelineReviews([pr]);
      overrideCategory("cat-1", "home-garden");
      const updated = getPipelineReviews().find((r) => r.id === "cat-1");
      expect(updated?.assignedCategory).toBe("home-garden");
      expect(updated?.categoryOverridden).toBe(true);
    });

    it("does nothing for non-existent id", () => {
      expect(() => overrideCategory("bad-id", "tech")).not.toThrow();
    });
  });

  // ── deletePipelineReview ────────────────────────────────

  describe("deletePipelineReview", () => {
    it("removes the review from the pipeline", () => {
      const pr1 = makePipelineReview({ id: "del-1" });
      const pr2 = makePipelineReview({ id: "del-2" });
      savePipelineReviews([pr1, pr2]);
      deletePipelineReview("del-1");
      const remaining = getPipelineReviews();
      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe("del-2");
    });

    it("does not throw for non-existent id", () => {
      savePipelineReviews([makePipelineReview({ id: "keep-this" })]);
      expect(() => deletePipelineReview("nonexistent")).not.toThrow();
      expect(getPipelineReviews().length).toBe(1);
    });
  });

  // ── Query helpers ────────────────────────────────────────

  describe("getPipelineReviewsByStatus", () => {
    it("returns only reviews with the given status", () => {
      savePipelineReviews([
        makePipelineReview({ id: "q1", status: "mapped" }),
        makePipelineReview({ id: "q2", status: "enriched" }),
        makePipelineReview({ id: "q3", status: "published" }),
      ]);
      const enriched = getPipelineReviewsByStatus("enriched");
      expect(enriched.length).toBe(1);
      expect(enriched[0].id).toBe("q2");
    });
  });

  describe("getPipelineReviewsByCategory", () => {
    it("returns only reviews with the given category", () => {
      savePipelineReviews([
        makePipelineReview({ id: "c1", assignedCategory: "tech" }),
        makePipelineReview({ id: "c2", assignedCategory: "products" }),
      ]);
      const techReviews = getPipelineReviewsByCategory("tech");
      expect(techReviews.length).toBe(1);
      expect(techReviews[0].id).toBe("c1");
    });
  });

  describe("getPipelineReviewById", () => {
    it("returns the matching review", () => {
      savePipelineReviews([makePipelineReview({ id: "find-me" })]);
      const found = getPipelineReviewById("find-me");
      expect(found?.id).toBe("find-me");
    });

    it("returns undefined for non-existent id", () => {
      expect(getPipelineReviewById("does-not-exist")).toBeUndefined();
    });
  });

  describe("getPublishableReviews", () => {
    it("returns mapped and enriched reviews only", () => {
      savePipelineReviews([
        makePipelineReview({ id: "pub-a", status: "mapped" }),
        makePipelineReview({ id: "pub-b", status: "enriched" }),
        makePipelineReview({ id: "pub-c", status: "published" }),
        makePipelineReview({ id: "pub-d", status: "imported" }),
      ]);
      const publishable = getPublishableReviews();
      expect(publishable.map((r) => r.id).sort()).toEqual(["pub-a", "pub-b"]);
    });
  });

  describe("getUnpublishedReviews", () => {
    it("excludes published and live reviews", () => {
      savePipelineReviews([
        makePipelineReview({ id: "unp-1", status: "mapped" }),
        makePipelineReview({ id: "unp-2", status: "published" }),
        makePipelineReview({ id: "unp-3", status: "live" }),
      ]);
      const unpublished = getUnpublishedReviews();
      expect(unpublished.length).toBe(1);
      expect(unpublished[0].id).toBe("unp-1");
    });
  });

  // ── bulkImport ───────────────────────────────────────────

  describe("bulkImport", () => {
    beforeEach(() => {
      clearAmazonReviews();
    });

    it("imports 0 when amazonReviewStore is empty", () => {
      const result = bulkImport();
      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.total).toBe(0);
    });

    it("imports reviews from amazonReviewStore", () => {
      const ar = makeAmazonReview({ id: "bulk-import-1" });
      saveAmazonReviews([ar]);
      const result = bulkImport();
      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(0);
      expect(getPipelineReviews().length).toBe(1);
    });

    it("skips reviews already in the pipeline", () => {
      const ar = makeAmazonReview({ id: "already-in-pipeline" });
      saveAmazonReviews([ar]);
      bulkImport(); // first import
      const result = bulkImport(); // second import
      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(1);
    });

    it("returns correct total count", () => {
      const reviews = [
        makeAmazonReview({ id: "ti-1" }),
        makeAmazonReview({ id: "ti-2" }),
      ];
      saveAmazonReviews(reviews);
      const result = bulkImport();
      expect(result.total).toBe(2);
    });
  });

  // ── incrementalSync ──────────────────────────────────────

  describe("incrementalSync", () => {
    beforeEach(() => {
      clearAmazonReviews();
    });

    it("returns 0 new reviews when nothing new in amazonReviewStore", () => {
      const result = incrementalSync();
      expect(result.newReviews).toBe(0);
    });

    it("adds only new reviews not already in pipeline", () => {
      const ar1 = makeAmazonReview({ id: "sync-existing" });
      saveAmazonReviews([ar1]);
      bulkImport(); // ar1 is now in pipeline

      const ar2 = makeAmazonReview({ id: "sync-new" });
      saveAmazonReviews([ar1, ar2]);

      const result = incrementalSync();
      expect(result.newReviews).toBe(1);
    });
  });
});
