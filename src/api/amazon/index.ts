// ============================================================
// AMAZON API — CLIENT-SIDE LAYER
// Simulates the /api/amazon/* endpoints in this frontend-only SPA.
// In a full-stack deployment, replace these with real fetch() calls
// to a server that holds AMAZON_SESSION_COOKIE securely.
// ============================================================

import {
  type AmazonReview,
  type ImportMode,
  DEMO_REVIEWS,
  importDemoReviews,
  importReviewsFromHtml,
  getAmazonReviews,
  publishReview,
} from "@/lib/amazonReviewStore";

// ─── GET /api/amazon/demo ─────────────────────────────────────

/** Returns the built-in demo reviews without modifying the store. */
export async function apiGetDemo(): Promise<AmazonReview[]> {
  return DEMO_REVIEWS;
}

// ─── POST /api/amazon/import ──────────────────────────────────

export interface ImportRequest {
  mode: ImportMode;
  /** Pasted HTML — required when mode === "html" */
  html?: string;
}

export interface ImportResult {
  imported: number;
  reviews: AmazonReview[];
  message: string;
}

/**
 * Import Amazon reviews.
 *
 * - mode=demo  → loads built-in demo data (always works, no credentials)
 * - mode=html  → parses the provided HTML string client-side
 * - mode=cookie → would call a server-side scraper; falls back to demo in SPA
 */
export async function apiImport(req: ImportRequest): Promise<ImportResult> {
  switch (req.mode) {
    case "demo": {
      const reviews = importDemoReviews();
      return { imported: reviews.length, reviews, message: "Demo reviews loaded." };
    }

    case "html": {
      if (!req.html?.trim()) {
        return { imported: 0, reviews: [], message: "No HTML provided." };
      }
      const imported = importReviewsFromHtml(req.html);
      if (imported.length === 0) {
        return {
          imported: 0,
          reviews: getAmazonReviews(),
          message:
            "No recognisable Amazon review blocks found. " +
            "Make sure to copy the full review page HTML.",
        };
      }
      return {
        imported: imported.length,
        reviews: getAmazonReviews(),
        message: `Imported ${imported.length} new review(s) from HTML.`,
      };
    }

    case "cookie": {
      // Cookie-based scraping requires a server-side proxy that holds the
      // AMAZON_SESSION_COOKIE env var. In this SPA deployment, fall back to demo.
      const reviews = importDemoReviews();
      return {
        imported: reviews.length,
        reviews,
        message:
          "Cookie mode requires a server-side proxy. " +
          "Demo reviews have been loaded instead. " +
          "See docs/amazon-integration.md for deployment instructions.",
      };
    }

    default:
      return { imported: 0, reviews: [], message: "Unknown import mode." };
  }
}

// ─── POST /api/amazon/publish ─────────────────────────────────

export interface PublishRequest {
  reviewId: string;
}

export interface PublishResult {
  success: boolean;
  review: AmazonReview | null;
  message: string;
}

/** Mark an imported Amazon review as published in the local store. */
export async function apiPublish(req: PublishRequest): Promise<PublishResult> {
  const review = publishReview(req.reviewId);
  if (!review) {
    return { success: false, review: null, message: "Review not found." };
  }
  return { success: true, review, message: "Review marked as published." };
}
