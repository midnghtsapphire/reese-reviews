/**
 * Unit Tests — Star Rating Algorithm
 * Tests: weighted average, sentiment analysis, recency bias, edge cases
 */
import { describe, it, expect } from "vitest";
import { calculateStarRating, type RatingAnalysis } from "@/services/openRouterService";

describe("Star Rating Algorithm", () => {
  describe("Basic Calculations", () => {
    it("should return default rating for empty reviews", () => {
      const result = calculateStarRating([]);
      expect(result.calculatedRating).toBe(4);
      expect(result.confidence).toBe(0.3);
    });

    it("should calculate simple average for uniform ratings", () => {
      const reviews = Array.from({ length: 5 }, (_, i) => ({
        rating: 5,
        text: "Great product!",
        date: "2026-03-01",
        helpful: 0,
      }));
      const result = calculateStarRating(reviews);
      expect(result.calculatedRating).toBe(5);
    });

    it("should calculate weighted average with helpful votes", () => {
      const reviews = [
        { rating: 5, text: "Amazing product, love it!", date: "2026-03-01", helpful: 50 },
        { rating: 1, text: "Terrible, broken on arrival", date: "2026-03-01", helpful: 0 },
      ];
      const result = calculateStarRating(reviews);
      // The helpful review (5 stars) should pull the average up
      expect(result.calculatedRating).toBeGreaterThan(3);
    });

    it("should round to nearest 0.5", () => {
      const reviews = [
        { rating: 4, text: "Good", date: "2026-03-01", helpful: 0 },
        { rating: 3, text: "Okay", date: "2026-03-01", helpful: 0 },
      ];
      const result = calculateStarRating(reviews);
      expect(result.calculatedRating % 0.5).toBe(0);
    });
  });

  describe("Sentiment Analysis", () => {
    it("should boost rating for positive sentiment", () => {
      const reviews = [
        { rating: 3, text: "This is amazing, excellent, perfect, love it!", date: "2026-03-01", helpful: 0 },
        { rating: 3, text: "Great product, wonderful quality, fantastic!", date: "2026-03-01", helpful: 0 },
      ];
      const result = calculateStarRating(reviews);
      expect(result.sentimentScore).toBeGreaterThan(0);
    });

    it("should reduce rating for negative sentiment", () => {
      const reviews = [
        { rating: 3, text: "Terrible, awful, worst product ever, broken!", date: "2026-03-01", helpful: 0 },
        { rating: 3, text: "Horrible, disappointing, cheap, useless!", date: "2026-03-01", helpful: 0 },
      ];
      const result = calculateStarRating(reviews);
      expect(result.sentimentScore).toBeLessThan(0);
    });

    it("should have neutral sentiment for mixed reviews", () => {
      const reviews = [
        { rating: 3, text: "Great product but terrible packaging", date: "2026-03-01", helpful: 0 },
      ];
      const result = calculateStarRating(reviews);
      expect(Math.abs(result.sentimentScore)).toBeLessThanOrEqual(1);
    });
  });

  describe("Confidence Score", () => {
    it("should have low confidence for few reviews", () => {
      const reviews = [
        { rating: 4, text: "Good", date: "2026-03-01", helpful: 0 },
      ];
      const result = calculateStarRating(reviews);
      expect(result.confidence).toBeLessThan(0.5);
    });

    it("should have high confidence for many reviews", () => {
      const reviews = Array.from({ length: 25 }, () => ({
        rating: 4,
        text: "Good product",
        date: "2026-03-01",
        helpful: 0,
      }));
      const result = calculateStarRating(reviews);
      expect(result.confidence).toBe(1);
    });

    it("should cap confidence at 1.0", () => {
      const reviews = Array.from({ length: 100 }, () => ({
        rating: 4,
        text: "Good",
        date: "2026-03-01",
        helpful: 0,
      }));
      const result = calculateStarRating(reviews);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe("Rating Bounds", () => {
    it("should never exceed 5 stars", () => {
      const reviews = Array.from({ length: 10 }, () => ({
        rating: 5,
        text: "Amazing excellent perfect wonderful love it best fantastic awesome recommend!",
        date: new Date().toISOString(),
        helpful: 100,
      }));
      const result = calculateStarRating(reviews);
      expect(result.calculatedRating).toBeLessThanOrEqual(5);
    });

    it("should never go below 1 star", () => {
      const reviews = Array.from({ length: 10 }, () => ({
        rating: 1,
        text: "Terrible awful worst broken waste horrible disappointing cheap useless defective",
        date: new Date().toISOString(),
        helpful: 0,
      }));
      const result = calculateStarRating(reviews);
      expect(result.calculatedRating).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Breakdown Data", () => {
    it("should include all breakdown fields", () => {
      const reviews = [
        { rating: 4, text: "Good product", date: "2026-03-01", helpful: 5 },
      ];
      const result = calculateStarRating(reviews);

      expect(result.breakdown).toBeDefined();
      expect(typeof result.breakdown.amazonAvg).toBe("number");
      expect(typeof result.breakdown.sentimentAdj).toBe("number");
      expect(typeof result.breakdown.recencyBias).toBe("number");
      expect(typeof result.breakdown.finalRating).toBe("number");
    });

    it("should have amazonAvg close to input average", () => {
      const reviews = [
        { rating: 4, text: "Good", date: "2026-03-01", helpful: 0 },
        { rating: 4, text: "Good", date: "2026-03-01", helpful: 0 },
      ];
      const result = calculateStarRating(reviews);
      expect(result.breakdown.amazonAvg).toBeCloseTo(4, 0);
    });
  });
});
