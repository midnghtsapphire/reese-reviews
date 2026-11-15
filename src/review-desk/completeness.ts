import type { Completeness, ReviewFields } from "./types";

const TITLE_MAX = 100;

/** Amazon review headline should stay within the usual 100-character cap. */
export function isTitlePresent(title: string): boolean {
  return title.trim().length > 0;
}

export function isTitleWithinLimit(title: string): boolean {
  return title.trim().length <= TITLE_MAX;
}

export function isRatingPresent(rating: number | null | undefined): boolean {
  return (
    typeof rating === "number" &&
    Number.isInteger(rating) &&
    rating >= 1 &&
    rating <= 5
  );
}

export function isReviewBodyPresent(body: string): boolean {
  return body.trim().length > 0;
}

export function hasRequiredImages(
  imageCount: number,
  textOnly: boolean,
): boolean {
  return textOnly === true || (Number.isFinite(imageCount) && imageCount >= 1);
}

/**
 * Required fields for a Review Desk submit:
 * star rating (1–5), title, written review, and at least one image
 * unless the text-only toggle is on.
 */
export function checkCompleteness(fields: ReviewFields): Completeness {
  const rating = isRatingPresent(fields.rating);
  const title = isTitlePresent(fields.title) && isTitleWithinLimit(fields.title);
  const body = isReviewBodyPresent(fields.body);
  const images = hasRequiredImages(fields.imageCount, fields.textOnly);
  return {
    rating,
    title,
    body,
    images,
    complete: rating && title && body && images,
  };
}

export const REVIEW_TITLE_MAX = TITLE_MAX;
