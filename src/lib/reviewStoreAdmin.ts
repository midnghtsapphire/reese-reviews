/**
 * Admin-level review CRUD operations.
 * Works on top of the existing reviewStore.
 */
import { ReviewData, getReviews } from "./reviewStore";

const STORAGE_KEY = "reese-reviews-data";

function saveReviews(reviews: ReviewData[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  window.dispatchEvent(new CustomEvent("reviews-updated"));
}

export function getAllReviews(): ReviewData[] {
  return getReviews();
}

export function addReview(review: Omit<ReviewData, "id" | "slug" | "created_at" | "updated_at">): ReviewData {
  const now = new Date().toISOString();
  const slug = review.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const newReview: ReviewData = {
    ...review,
    id: `admin-${Date.now()}`,
    slug,
    created_at: now,
    updated_at: now,
  };

  const reviews = getReviews();
  reviews.unshift(newReview);
  saveReviews(reviews);
  return newReview;
}

export function updateReview(id: string, updates: Partial<ReviewData>): ReviewData | null {
  const reviews = getReviews();
  const idx = reviews.findIndex((r) => r.id === id);
  if (idx === -1) return null;

  reviews[idx] = {
    ...reviews[idx],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  saveReviews(reviews);
  return reviews[idx];
}

export function deleteReview(id: string): boolean {
  const reviews = getReviews();
  const filtered = reviews.filter((r) => r.id !== id);
  if (filtered.length === reviews.length) return false;
  saveReviews(filtered);
  return true;
}

export function resetReviews(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("reviews-updated"));
}

export function initializeReviewsIfNeeded(): void {
  // No-op: reviews are managed via the Submit Review form and admin interface.
  // Nothing to initialize — the store starts empty until real reviews are added.
}
