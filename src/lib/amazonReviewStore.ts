// ============================================================
// AMAZON REVIEW IMPORT STORE
// Handles importing Vine/purchase reviews and publishing drafts.
// Supports demo mode (default), HTML paste mode, and cookie mode
// (cookie mode requires a backend proxy — falls back to demo in SPA).
// ============================================================

import DEMO_DATA from "./data/amazon-reviews.json";

const STORAGE_KEY = "reese-amazon-reviews";

export type ImportMode = "demo" | "cookie" | "html";
export type ReviewStatus = "draft" | "published";

export interface AmazonReview {
  id: string;
  asin: string;
  productName: string;
  productLink: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  images: string[];
  source: ImportMode;
  status: ReviewStatus;
}

// No demo/placeholder data — app starts clean
export const DEMO_REVIEWS: AmazonReview[] = [];

// ─── STORAGE HELPERS ─────────────────────────────────────────

export function getAmazonReviews(): AmazonReview[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as AmazonReview[];
  } catch {
    // ignore parse errors
  }
  return [];
}

export function saveAmazonReviews(reviews: AmazonReview[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

export function clearAmazonReviews(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ─── IMPORT FUNCTIONS ────────────────────────────────────────

/** No-op: demo reviews removed. Returns empty array. */
export function importDemoReviews(): AmazonReview[] {
  return [];
}

/**
 * Parse Amazon review HTML pasted by the user and extract reviews.
 * Tolerates minor HTML differences from different Amazon locales/versions.
 */
export function parseAmazonReviewsHtml(html: string): AmazonReview[] {
  const reviews: AmazonReview[] = [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Amazon review container selectors (tolerant of layout variants)
    const reviewNodes = doc.querySelectorAll(
      "[data-hook='review'], .review, [id^='customer_review']"
    );

    reviewNodes.forEach((node, idx) => {
      const ratingEl = node.querySelector("[data-hook='review-star-rating'] .a-icon-alt, .review-rating .a-icon-alt");
      const titleEl = node.querySelector("[data-hook='review-title'] span:not(.a-icon-alt), .review-title span");
      const bodyEl = node.querySelector("[data-hook='review-body'] span, .review-text span");
      const dateEl = node.querySelector("[data-hook='review-date'], .review-date");
      const productLinkEl = node.querySelector(".review-title a, a[data-hook='review-title']");
      const imageEls = node.querySelectorAll("[data-hook='review-image-tile'] img, .review-image-tile img");

      const ratingText = ratingEl?.textContent?.trim() ?? "";
      const rating = parseFloat(ratingText) || 0;
      const title = titleEl?.textContent?.trim() ?? "";
      const body = bodyEl?.textContent?.trim() ?? "";
      const date = dateEl?.textContent?.trim() ?? "";
      const productHref = productLinkEl?.getAttribute("href") ?? "";

      // Extract ASIN from product URL or link
      const asinMatch = productHref.match(/\/dp\/([A-Z0-9]{10})/) ??
        node.innerHTML.match(/\/dp\/([A-Z0-9]{10})/);
      const asin = asinMatch?.[1] ?? `UNKNOWN-${idx}`;

      const images = Array.from(imageEls)
        .map((img) => img.getAttribute("src") ?? "")
        .filter(Boolean);

      if (title || body) {
        reviews.push({
          id: `html-${Date.now()}-${idx}`,
          asin,
          productName: title || `Product ${asin}`,
          productLink: asin !== `UNKNOWN-${idx}` ? `https://www.amazon.com/dp/${asin}` : "",
          rating: Math.min(5, Math.max(0, Math.round(rating))),
          title,
          body,
          date,
          images,
          source: "html",
          status: "draft",
        });
      }
    });
  } catch {
    // Return whatever was parsed before the error
  }

  return reviews;
}

/** Import reviews from pasted HTML and merge into the local store. */
export function importReviewsFromHtml(html: string): AmazonReview[] {
  const parsed = parseAmazonReviewsHtml(html);
  if (parsed.length === 0) return parsed;

  const existing = getAmazonReviews();
  const existingIds = new Set(existing.map((r) => r.asin));
  const newReviews = parsed.filter((r) => !existingIds.has(r.asin));
  const merged = [...existing, ...newReviews];
  saveAmazonReviews(merged);
  return newReviews;
}

// ─── PUBLISH ─────────────────────────────────────────────────

/** Mark an imported Amazon review as published. */
export function publishReview(reviewId: string): AmazonReview | null {
  const reviews = getAmazonReviews();
  const idx = reviews.findIndex((r) => r.id === reviewId);
  if (idx === -1) return null;
  reviews[idx] = { ...reviews[idx], status: "published" };
  saveAmazonReviews(reviews);
  return reviews[idx];
}

/** Update a single review in the store. */
export function updateReview(reviewId: string, patch: Partial<AmazonReview>): AmazonReview | null {
  const reviews = getAmazonReviews();
  const idx = reviews.findIndex((r) => r.id === reviewId);
  if (idx === -1) return null;
  reviews[idx] = { ...reviews[idx], ...patch };
  saveAmazonReviews(reviews);
  return reviews[idx];
}

// ─── AFFILIATE ───────────────────────────────────────────────

export const DEFAULT_AFFILIATE_TAG = "meetaudreyeva-20";

/**
 * Build an Amazon affiliate link for a given ASIN.
 * Uses the AFFILIATE_TAG env var when available (set via Vite as
 * VITE_AFFILIATE_TAG), otherwise falls back to the default tag.
 */
export function buildAffiliateLink(asin: string, tag?: string): string {
  if (!asin.trim()) return "";
  const resolvedTag =
    tag ??
    (typeof import.meta !== "undefined" &&
      (import.meta as { env?: Record<string, string> }).env?.VITE_AFFILIATE_TAG) ??
    DEFAULT_AFFILIATE_TAG;
  return `https://www.amazon.com/dp/${asin.trim()}?tag=${resolvedTag}`;
}
