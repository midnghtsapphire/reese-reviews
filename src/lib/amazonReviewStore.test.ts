import { describe, it, expect, beforeEach } from "vitest";
import {
  getAmazonReviews,
  saveAmazonReviews,
  clearAmazonReviews,
  importDemoReviews,
  importReviewsFromHtml,
  parseAmazonReviewsHtml,
  publishReview,
  updateReview,
  buildAffiliateLink,
  DEFAULT_AFFILIATE_TAG,
  DEMO_REVIEWS,
} from "./amazonReviewStore";

// ─── Helpers ─────────────────────────────────────────────────

/** Minimal Amazon-style review HTML for testing the HTML parser. */
function makeReviewHtml(opts: {
  asin: string;
  rating: string;
  title: string;
  body: string;
  date: string;
}): string {
  return `
    <div data-hook="review" id="customer_review_R1">
      <a href="/dp/${opts.asin}?ref=test" data-hook="review-title">
        <span class="a-icon-alt">${opts.rating} out of 5 stars</span>
        <span>${opts.title}</span>
      </a>
      <span data-hook="review-star-rating" class="review-rating">
        <span class="a-icon-alt">${opts.rating} out of 5 stars</span>
      </span>
      <span data-hook="review-date">${opts.date}</span>
      <div data-hook="review-body"><span>${opts.body}</span></div>
    </div>
  `;
}

// ─── Tests ───────────────────────────────────────────────────

describe("amazonReviewStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ── getAmazonReviews / demo fallback ──

  describe("getAmazonReviews", () => {
    it("returns demo reviews when localStorage is empty", () => {
      const reviews = getAmazonReviews();
      expect(reviews.length).toBe(DEMO_REVIEWS.length);
    });

    it("returns stored reviews when localStorage has data", () => {
      saveAmazonReviews([DEMO_REVIEWS[0]]);
      const reviews = getAmazonReviews();
      expect(reviews.length).toBe(1);
      expect(reviews[0].id).toBe(DEMO_REVIEWS[0].id);
    });
  });

  // ── clearAmazonReviews ──

  describe("clearAmazonReviews", () => {
    it("removes stored reviews and falls back to demo", () => {
      saveAmazonReviews([DEMO_REVIEWS[0]]);
      clearAmazonReviews();
      expect(getAmazonReviews().length).toBe(DEMO_REVIEWS.length);
    });
  });

  // ── importDemoReviews ──

  describe("importDemoReviews", () => {
    it("loads all demo reviews into the store", () => {
      const reviews = importDemoReviews();
      expect(reviews.length).toBe(DEMO_REVIEWS.length);
      expect(getAmazonReviews().length).toBe(DEMO_REVIEWS.length);
    });

    it("each demo review has required fields", () => {
      importDemoReviews();
      getAmazonReviews().forEach((r) => {
        expect(r.id).toBeTruthy();
        expect(r.asin).toBeTruthy();
        expect(r.productName).toBeTruthy();
        expect(r.rating).toBeGreaterThanOrEqual(1);
        expect(r.rating).toBeLessThanOrEqual(5);
      });
    });
  });

  // ── parseAmazonReviewsHtml ──

  describe("parseAmazonReviewsHtml", () => {
    it("parses a single review from Amazon-style HTML", () => {
      const html = makeReviewHtml({
        asin: "B09JQMJHXY",
        rating: "5",
        title: "Great product",
        body: "Really enjoyed this item.",
        date: "Reviewed in the United States on January 1, 2026",
      });
      const reviews = parseAmazonReviewsHtml(html);
      expect(reviews.length).toBe(1);
      expect(reviews[0].asin).toBe("B09JQMJHXY");
      expect(reviews[0].title).toBe("Great product");
      expect(reviews[0].body).toBe("Really enjoyed this item.");
      expect(reviews[0].source).toBe("html");
      expect(reviews[0].status).toBe("draft");
    });

    it("parses multiple reviews", () => {
      const html =
        makeReviewHtml({ asin: "B0000000001", rating: "4", title: "Good", body: "Works well.", date: "Jan 2026" }) +
        makeReviewHtml({ asin: "B0000000002", rating: "3", title: "Okay", body: "Average.", date: "Feb 2026" });
      const reviews = parseAmazonReviewsHtml(html);
      expect(reviews.length).toBe(2);
    });

    it("returns empty array for empty HTML", () => {
      expect(parseAmazonReviewsHtml("")).toEqual([]);
    });

    it("returns empty array for HTML with no review blocks", () => {
      expect(parseAmazonReviewsHtml("<html><body><p>No reviews here</p></body></html>")).toEqual([]);
    });

    it("clamps star ratings to 1-5", () => {
      const html = makeReviewHtml({ asin: "B0000000001", rating: "6", title: "Overflow", body: "Body", date: "" });
      const reviews = parseAmazonReviewsHtml(html);
      if (reviews.length > 0) {
        expect(reviews[0].rating).toBeLessThanOrEqual(5);
      }
    });
  });

  // ── importReviewsFromHtml ──

  describe("importReviewsFromHtml", () => {
    it("returns imported reviews and stores them", () => {
      clearAmazonReviews();
      // Start with empty store (clear demo)
      saveAmazonReviews([]);
      const html = makeReviewHtml({ asin: "B0HTMLTEST", rating: "4", title: "HTML Test", body: "Test body", date: "Mar 2026" });
      const imported = importReviewsFromHtml(html);
      expect(imported.length).toBe(1);
      expect(imported[0].asin).toBe("B0HTMLTEST");
    });

    it("does not duplicate reviews with same ASIN", () => {
      clearAmazonReviews();
      saveAmazonReviews([]);
      const html = makeReviewHtml({ asin: "B0DUPTEST1", rating: "5", title: "Dup", body: "Body", date: "Mar 2026" });
      importReviewsFromHtml(html);
      const secondImport = importReviewsFromHtml(html);
      expect(secondImport.length).toBe(0); // no new ones
    });

    it("returns empty array for empty HTML", () => {
      const result = importReviewsFromHtml("");
      expect(result).toEqual([]);
    });
  });

  // ── publishReview ──

  describe("publishReview", () => {
    it("marks a review as published", () => {
      importDemoReviews();
      const reviews = getAmazonReviews();
      const target = reviews[0];
      const updated = publishReview(target.id);
      expect(updated?.status).toBe("published");
      expect(getAmazonReviews().find((r) => r.id === target.id)?.status).toBe("published");
    });

    it("returns null for non-existent review id", () => {
      importDemoReviews();
      expect(publishReview("non-existent-id")).toBeNull();
    });
  });

  // ── updateReview ──

  describe("updateReview", () => {
    it("updates specified fields on a review", () => {
      importDemoReviews();
      const target = getAmazonReviews()[0];
      const updated = updateReview(target.id, { title: "Updated Title" });
      expect(updated?.title).toBe("Updated Title");
    });

    it("returns null for non-existent id", () => {
      importDemoReviews();
      expect(updateReview("fake-id", { title: "x" })).toBeNull();
    });
  });

  // ── buildAffiliateLink ──

  describe("buildAffiliateLink", () => {
    it("generates a correct Amazon affiliate URL", () => {
      const link = buildAffiliateLink("B09JQMJHXY", "test-tag-20");
      expect(link).toBe("https://www.amazon.com/dp/B09JQMJHXY?tag=test-tag-20");
    });

    it("uses the default affiliate tag when none provided", () => {
      const link = buildAffiliateLink("B09JQMJHXY");
      expect(link).toContain(DEFAULT_AFFILIATE_TAG);
    });

    it("returns empty string for empty ASIN", () => {
      expect(buildAffiliateLink("")).toBe("");
      expect(buildAffiliateLink("   ")).toBe("");
    });

    it("trims whitespace from ASIN", () => {
      const link = buildAffiliateLink("  B09JQMJHXY  ", "tag-20");
      expect(link).toContain("/dp/B09JQMJHXY");
    });
  });

  // ── DEMO_REVIEWS integrity ──

  describe("DEMO_REVIEWS", () => {
    it("has at least 3 reviews", () => {
      expect(DEMO_REVIEWS.length).toBeGreaterThanOrEqual(3);
    });

    it("each review has a valid rating (1-5)", () => {
      DEMO_REVIEWS.forEach((r) => {
        expect(r.rating).toBeGreaterThanOrEqual(1);
        expect(r.rating).toBeLessThanOrEqual(5);
      });
    });

    it("each review has a non-empty productName", () => {
      DEMO_REVIEWS.forEach((r) => {
        expect(r.productName.trim().length).toBeGreaterThan(0);
      });
    });

    it("each review has a valid ASIN format", () => {
      DEMO_REVIEWS.forEach((r) => {
        // ASIN is 10 alphanumeric chars
        expect(r.asin).toMatch(/^[A-Z0-9]{10}$/);
      });
    });
  });
});
