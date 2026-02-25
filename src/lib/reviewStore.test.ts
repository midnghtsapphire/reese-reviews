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
  DEMO_REVIEWS,
  CATEGORIES,
} from "./reviewStore";

describe("reviewStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getReviews", () => {
    it("returns demo reviews when no stored data", () => {
      const reviews = getReviews();
      expect(reviews.length).toBe(DEMO_REVIEWS.length);
    });
  });

  describe("getApprovedReviews", () => {
    it("returns only approved reviews", () => {
      const reviews = getApprovedReviews();
      expect(reviews.every((r) => r.status === "approved")).toBe(true);
    });
  });

  describe("getFeaturedReviews", () => {
    it("returns only featured and approved reviews", () => {
      const reviews = getFeaturedReviews();
      expect(reviews.every((r) => r.is_featured && r.status === "approved")).toBe(true);
      expect(reviews.length).toBeGreaterThan(0);
    });
  });

  describe("getReviewBySlug", () => {
    it("finds a review by slug", () => {
      const review = getReviewBySlug("best-wireless-earbuds-everyday");
      expect(review).toBeDefined();
      expect(review?.title).toContain("Wireless Earbuds");
    });

    it("returns undefined for non-existent slug", () => {
      const review = getReviewBySlug("non-existent-review");
      expect(review).toBeUndefined();
    });
  });

  describe("getReviewsByCategory", () => {
    it("filters reviews by category", () => {
      const techReviews = getReviewsByCategory("tech");
      expect(techReviews.every((r) => r.category === "tech")).toBe(true);
    });

    it("returns empty array for category with no reviews", () => {
      // All categories should have at least some reviews in demo data
      const reviews = getReviewsByCategory("products");
      expect(Array.isArray(reviews)).toBe(true);
    });
  });

  describe("searchReviews", () => {
    it("searches by title", () => {
      const results = searchReviews("earbuds");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title.toLowerCase()).toContain("earbuds");
    });

    it("searches by product name", () => {
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
