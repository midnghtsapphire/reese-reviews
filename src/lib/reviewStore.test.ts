import { describe, it, expect, beforeEach } from "vitest";
import {
  getReviews,
  getApprovedReviews,
  getFeaturedReviews,
  getReviewBySlug,
  getReviewsByCategory,
  searchReviews,
  submitReview,
  getSubmissions,
  generateAffiliateLink,
  CATEGORIES,
  type ReviewData,
} from "./reviewStore";

/** Counter to guarantee unique IDs across test helpers. */
let _seedCounter = 0;

/** Returns a base review object (does NOT save to localStorage). */
function makeBaseReview(overrides: Partial<ReviewData> = {}): ReviewData {
  return {
    id: `seed-${++_seedCounter}`,
    title: "Wireless Earbuds Review",
    slug: "best-wireless-earbuds-everyday",
    category: "tech",
    rating: 5,
    excerpt: "Great earbuds.",
    content: "Really good earbuds for everyday use.",
    pros: ["Good sound"],
    cons: ["Bulky case"],
    verdict: "Buy them.",
    image_url: "",
    product_name: "SoundCore Pro Buds X3",
    product_link: "https://amazon.com/dp/test",
    affiliate_tag: "meetaudreyeva-20",
    reviewer_name: "Reese",
    reviewer_email: "",
    is_featured: true,
    status: "approved",
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/** Helper: seed a single review directly into localStorage for tests that need data. */
function seedReview(overrides: Partial<ReviewData> = {}) {
  const review = makeBaseReview(overrides);
  localStorage.setItem("reese-reviews-data", JSON.stringify([review]));
  return review;
}

describe("reviewStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getReviews", () => {
    it("returns empty array when no stored data", () => {
      const reviews = getReviews();
      expect(Array.isArray(reviews)).toBe(true);
      expect(reviews.length).toBe(0);
    });

    it("returns stored reviews when data exists", () => {
      seedReview();
      const reviews = getReviews();
      expect(reviews.length).toBe(1);
    });
  });

  describe("getApprovedReviews", () => {
    it("returns empty array when no data", () => {
      const reviews = getApprovedReviews();
      expect(reviews.length).toBe(0);
    });

    it("returns only approved reviews", () => {
      // Seed both reviews together to avoid overwriting
      const review1 = { ...makeBaseReview(), status: "approved" as const };
      const review2 = { ...makeBaseReview(), id: "seed-2", slug: "slug-2", status: "pending" as const };
      localStorage.setItem("reese-reviews-data", JSON.stringify([review1, review2]));
      const reviews = getApprovedReviews();
      expect(reviews.every((r) => r.status === "approved")).toBe(true);
      expect(reviews.length).toBe(1);
    });
  });

  describe("getFeaturedReviews", () => {
    it("returns empty array when no data", () => {
      const reviews = getFeaturedReviews();
      expect(Array.isArray(reviews)).toBe(true);
      expect(reviews.length).toBe(0);
    });

    it("returns only featured and approved reviews", () => {
      seedReview({ is_featured: true, status: "approved" });
      const reviews = getFeaturedReviews();
      expect(reviews.every((r) => r.is_featured && r.status === "approved")).toBe(true);
      expect(reviews.length).toBeGreaterThan(0);
    });
  });

  describe("getReviewBySlug", () => {
    it("finds a review by slug", () => {
      seedReview({ slug: "best-wireless-earbuds-everyday" });
      const review = getReviewBySlug("best-wireless-earbuds-everyday");
      expect(review).toBeDefined();
      expect(review?.title.toLowerCase()).toContain("earbuds");
    });

    it("returns undefined for non-existent slug", () => {
      const review = getReviewBySlug("non-existent-review");
      expect(review).toBeUndefined();
    });
  });

  describe("getReviewsByCategory", () => {
    it("filters reviews by category", () => {
      seedReview({ category: "tech" });
      const techReviews = getReviewsByCategory("tech");
      expect(techReviews.every((r) => r.category === "tech")).toBe(true);
    });

    it("returns empty array for category with no reviews", () => {
      const reviews = getReviewsByCategory("products");
      expect(Array.isArray(reviews)).toBe(true);
    });
  });

  describe("searchReviews", () => {
    it("searches by title", () => {
      seedReview({ title: "Wireless Earbuds Review" });
      const results = searchReviews("earbuds");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title.toLowerCase()).toContain("earbuds");
    });

    it("searches by product name", () => {
      seedReview({ product_name: "SoundCore Pro Buds X3" });
      const results = searchReviews("SoundCore");
      expect(results.length).toBeGreaterThan(0);
    });

    it("returns empty for no match", () => {
      const results = searchReviews("xyznonexistent123");
      expect(results.length).toBe(0);
    });
  });

  describe("submitReview", () => {
    it("creates a new review with pending status", () => {
      const newReview = submitReview({
        title: "Test Review Title",
        category: "tech",
        rating: 4,
        excerpt: "A test excerpt",
        content: "Full test content here",
        pros: ["Good thing"],
        cons: ["Bad thing"],
        verdict: "Worth it",
        image_url: "",
        product_name: "Test Product",
        product_link: "",
        affiliate_tag: "",
        reviewer_name: "Tester",
        reviewer_email: "test@test.com",
      });

      expect(newReview.status).toBe("pending");
      expect(newReview.id).toContain("user-");
      expect(newReview.slug).toBe("test-review-title");
      expect(newReview.is_featured).toBe(false);
    });

    it("stores submission in localStorage", () => {
      submitReview({
        title: "Stored Review",
        category: "products",
        rating: 5,
        excerpt: "Stored",
        content: "Stored content",
        pros: [],
        cons: [],
        verdict: "",
        image_url: "",
        product_name: "",
        product_link: "",
        affiliate_tag: "",
        reviewer_name: "Tester",
        reviewer_email: "",
      });

      const submissions = getSubmissions();
      expect(submissions.length).toBe(1);
      expect(submissions[0].title).toBe("Stored Review");
    });
  });

  describe("generateAffiliateLink", () => {
    it("adds affiliate tag to Amazon URLs", () => {
      const url = generateAffiliateLink("https://amazon.com/dp/B123", "test-tag-20");
      expect(url).toContain("tag=test-tag-20");
    });

    it("returns empty string for empty input", () => {
      expect(generateAffiliateLink("")).toBe("");
    });

    it("returns original URL for non-Amazon links", () => {
      const url = generateAffiliateLink("https://example.com/product", "tag");
      expect(url).toContain("example.com");
    });
  });

  describe("CATEGORIES", () => {
    it("has 5 categories", () => {
      expect(CATEGORIES.length).toBe(5);
    });

    it("includes all required categories", () => {
      const values = CATEGORIES.map((c) => c.value);
      expect(values).toContain("products");
      expect(values).toContain("food-restaurants");
      expect(values).toContain("services");
      expect(values).toContain("entertainment");
      expect(values).toContain("tech");
    });
  });
});
