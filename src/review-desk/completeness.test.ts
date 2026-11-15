import { describe, expect, it } from "vitest";
import {
  REVIEW_TITLE_MAX,
  checkCompleteness,
  hasRequiredImages,
  isRatingPresent,
  isReviewBodyPresent,
  isTitlePresent,
  isTitleWithinLimit,
} from "./completeness";
import type { ReviewFields } from "./types";

const complete: ReviewFields = {
  rating: 4,
  title: "Does the job for a smaller toploader binder",
  body: "This 2-pocket binder holds 56 toploaders and the pages work as expected.",
  imageCount: 1,
  textOnly: false,
};

describe("isRatingPresent", () => {
  it("accepts integers 1 through 5", () => {
    expect(isRatingPresent(1)).toBe(true);
    expect(isRatingPresent(5)).toBe(true);
    expect(isRatingPresent(3)).toBe(true);
  });

  it("rejects missing, out-of-range, or fractional ratings", () => {
    expect(isRatingPresent(null)).toBe(false);
    expect(isRatingPresent(undefined)).toBe(false);
    expect(isRatingPresent(0)).toBe(false);
    expect(isRatingPresent(6)).toBe(false);
    expect(isRatingPresent(4.5)).toBe(false);
  });
});

describe("title and body", () => {
  it("requires a non-empty trimmed title within the Amazon headline cap", () => {
    expect(isTitlePresent("  Hello  ")).toBe(true);
    expect(isTitlePresent("   ")).toBe(false);
    expect(isTitlePresent("")).toBe(false);
    expect(isTitleWithinLimit("a".repeat(REVIEW_TITLE_MAX))).toBe(true);
    expect(isTitleWithinLimit("a".repeat(REVIEW_TITLE_MAX + 1))).toBe(false);
  });

  it("requires a non-empty trimmed review body", () => {
    expect(isReviewBodyPresent("Nice chair.")).toBe(true);
    expect(isReviewBodyPresent("\n\t ")).toBe(false);
  });
});

describe("hasRequiredImages", () => {
  it("passes when at least one image is present", () => {
    expect(hasRequiredImages(1, false)).toBe(true);
    expect(hasRequiredImages(3, false)).toBe(true);
  });

  it("fails when there are no images and text-only is off", () => {
    expect(hasRequiredImages(0, false)).toBe(false);
  });

  it("passes with zero images when the text-only toggle is on", () => {
    expect(hasRequiredImages(0, true)).toBe(true);
    expect(hasRequiredImages(2, true)).toBe(true);
  });
});

describe("checkCompleteness", () => {
  it("turns complete when rating, title, body, and an image are present", () => {
    const result = checkCompleteness(complete);
    expect(result).toEqual({
      rating: true,
      title: true,
      body: true,
      images: true,
      complete: true,
    });
  });

  it("is complete for a text-only review with no photos", () => {
    const result = checkCompleteness({ ...complete, imageCount: 0, textOnly: true });
    expect(result.images).toBe(true);
    expect(result.complete).toBe(true);
  });

  it("is incomplete when the rating is missing", () => {
    const result = checkCompleteness({ ...complete, rating: null });
    expect(result.rating).toBe(false);
    expect(result.complete).toBe(false);
  });

  it("is incomplete when the title is blank", () => {
    const result = checkCompleteness({ ...complete, title: "   " });
    expect(result.title).toBe(false);
    expect(result.complete).toBe(false);
  });

  it("is incomplete when the title is over the usual 100-character cap", () => {
    const result = checkCompleteness({
      ...complete,
      title: "a".repeat(REVIEW_TITLE_MAX + 1),
    });
    expect(result.title).toBe(false);
    expect(result.complete).toBe(false);
  });

  it("is incomplete when the review body is blank", () => {
    const result = checkCompleteness({ ...complete, body: "" });
    expect(result.body).toBe(false);
    expect(result.complete).toBe(false);
  });

  it("is incomplete when there is no image and text-only is off", () => {
    const result = checkCompleteness({ ...complete, imageCount: 0, textOnly: false });
    expect(result.images).toBe(false);
    expect(result.complete).toBe(false);
  });
});
