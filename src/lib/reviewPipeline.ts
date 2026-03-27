// ============================================================
// REVIEW PIPELINE — THE BRIDGE
// Connects amazonReviewStore (import side) to reviewStore
// (display side). Handles bulk import, incremental sync,
// category auto-mapping, review enrichment, and publishing.
// ============================================================

import type { AmazonReview } from "./amazonReviewStore";
import { getAmazonReviews, buildAffiliateLink, DEFAULT_AFFILIATE_TAG } from "./amazonReviewStore";
import type { ReviewData, ReviewCategory } from "./reviewStore";
import { getReviews } from "./reviewStore";
import {
  getBestCategory,
  categorizeProduct,
  type SiteCategory,
  type CategoryMatch,
  type ConfidenceLevel,
} from "./categoryRules";

// ─── STORAGE KEYS ───────────────────────────────────────────

const PIPELINE_KEY = "reese-review-pipeline";
const PIPELINE_STATS_KEY = "reese-pipeline-stats";

// ─── PIPELINE STATUS ────────────────────────────────────────

export type PipelineStatus = "imported" | "mapped" | "enriched" | "published" | "live";

export interface PipelineReview {
  id: string;
  // Source reference
  amazonReviewId: string;
  asin: string;
  // Core review data
  productName: string;
  title: string;
  body: string;
  rating: number;
  date: string;
  images: string[];
  productLink: string;
  // Pipeline metadata
  status: PipelineStatus;
  // Category mapping
  suggestedCategory: SiteCategory;
  assignedCategory: SiteCategory;
  categoryConfidence: ConfidenceLevel;
  categoryMatchDetails: string;
  categoryOverridden: boolean;
  // Enrichment data
  affiliateLink: string;
  pros: string[];
  cons: string[];
  excerpt: string;
  verdict: string;
  reviewerName: string;
  reviewerAvatar: "reese" | "revvel" | "caresse";
  isFeatured: boolean;
  // Timestamps
  importedAt: string;
  mappedAt: string | null;
  enrichedAt: string | null;
  publishedAt: string | null;
  // Published review ID (in reviewStore)
  publishedReviewId: string | null;
}

export interface PipelineStats {
  totalImported: number;
  totalMapped: number;
  totalEnriched: number;
  totalPublished: number;
  totalLive: number;
  lastImportAt: string | null;
  lastPublishAt: string | null;
}

// ─── STORAGE HELPERS ────────────────────────────────────────

export function getPipelineReviews(): PipelineReview[] {
  try {
    const stored = localStorage.getItem(PIPELINE_KEY);
    if (stored) return JSON.parse(stored) as PipelineReview[];
  } catch {
    // ignore
  }
  return [];
}

export function savePipelineReviews(reviews: PipelineReview[]): void {
  localStorage.setItem(PIPELINE_KEY, JSON.stringify(reviews));
  updatePipelineStats(reviews);
}

export function getPipelineStats(): PipelineStats {
  try {
    const stored = localStorage.getItem(PIPELINE_STATS_KEY);
    if (stored) return JSON.parse(stored) as PipelineStats;
  } catch {
    // ignore
  }
  return {
    totalImported: 0,
    totalMapped: 0,
    totalEnriched: 0,
    totalPublished: 0,
    totalLive: 0,
    lastImportAt: null,
    lastPublishAt: null,
  };
}

function updatePipelineStats(reviews: PipelineReview[]): void {
  const stats: PipelineStats = {
    totalImported: reviews.length,
    totalMapped: reviews.filter((r) => r.status !== "imported").length,
    totalEnriched: reviews.filter((r) => ["enriched", "published", "live"].includes(r.status)).length,
    totalPublished: reviews.filter((r) => ["published", "live"].includes(r.status)).length,
    totalLive: reviews.filter((r) => r.status === "live").length,
    lastImportAt: reviews.length > 0
      ? reviews.reduce((latest, r) => (r.importedAt > latest ? r.importedAt : latest), reviews[0].importedAt)
      : null,
    lastPublishAt: reviews.filter((r) => r.publishedAt).length > 0
      ? reviews
          .filter((r) => r.publishedAt)
          .reduce((latest, r) => (r.publishedAt! > latest ? r.publishedAt! : latest), "")
      : null,
  };
  localStorage.setItem(PIPELINE_STATS_KEY, JSON.stringify(stats));
}

// ─── PROS/CONS EXTRACTION ───────────────────────────────────

/**
 * Extract pros and cons from review text using keyword analysis.
 * Looks for positive/negative sentiment patterns.
 */
export function extractProsAndCons(text: string): { pros: string[]; cons: string[] } {
  const pros: string[] = [];
  const cons: string[] = [];

  const sentences = text
    .replace(/([.!?])\s+/g, "$1|")
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  const positivePatterns = [
    /\b(love|loved|amazing|excellent|great|perfect|fantastic|incredible|impressive|outstanding)\b/i,
    /\b(best|favorite|recommend|solid|sturdy|comfortable|easy|quick|fast|smooth)\b/i,
    /\b(worth|value|quality|durable|reliable|effective|efficient|beautiful|gorgeous)\b/i,
    /\b(genuinely|surprisingly|actually)\s+(good|great|impressed|effective|useful)\b/i,
    /\b(no\s+(?:issues|problems|complaints))\b/i,
  ];

  const negativePatterns = [
    /\b(hate|hated|terrible|awful|worst|horrible|disappointing|poor|cheap|flimsy)\b/i,
    /\b(complaint|issue|problem|downside|drawback|con|annoying|frustrating)\b/i,
    /\b(wish|wished|could\s+be\s+better|needs\s+improvement)\b/i,
    /\b(only|minor)\s+(complaint|issue|gripe|downside|problem)\b/i,
    /\b(too\s+(?:heavy|light|big|small|loud|quiet|expensive|slow|bulky))\b/i,
    /\b(doesn't|doesn't|can't|cannot|won't|lack|lacks|missing)\b/i,
  ];

  for (const sentence of sentences) {
    const isPositive = positivePatterns.some((p) => p.test(sentence));
    const isNegative = negativePatterns.some((p) => p.test(sentence));

    if (isPositive && !isNegative && pros.length < 5) {
      // Condense to a short pro
      const condensed = condenseSentence(sentence);
      if (condensed && !pros.includes(condensed)) {
        pros.push(condensed);
      }
    } else if (isNegative && !isPositive && cons.length < 3) {
      const condensed = condenseSentence(sentence);
      if (condensed && !cons.includes(condensed)) {
        cons.push(condensed);
      }
    }
  }

  // Fallback: generate generic pros/cons from rating if extraction found nothing
  if (pros.length === 0) {
    pros.push("Quality product as described");
  }
  if (cons.length === 0) {
    cons.push("No major issues found");
  }

  return { pros, cons };
}

/**
 * Condense a sentence into a short pro/con bullet point.
 */
function condenseSentence(sentence: string): string {
  // Remove leading filler words
  let clean = sentence
    .replace(/^(I\s+|The\s+|It\s+|This\s+|My\s+|And\s+|But\s+|Also\s+|However\s+)/i, "")
    .replace(/[.!?]+$/, "")
    .trim();

  // Capitalize first letter
  if (clean.length > 0) {
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  // Truncate if too long
  if (clean.length > 80) {
    clean = clean.slice(0, 77) + "...";
  }

  return clean;
}

/**
 * Generate an excerpt from the review body.
 */
export function generateExcerpt(body: string, maxLength: number = 160): string {
  if (body.length <= maxLength) return body;

  // Try to break at a sentence boundary
  const truncated = body.slice(0, maxLength);
  const lastPeriod = truncated.lastIndexOf(".");
  const lastExcl = truncated.lastIndexOf("!");

  const breakPoint = Math.max(lastPeriod, lastExcl);
  if (breakPoint > maxLength * 0.5) {
    return truncated.slice(0, breakPoint + 1);
  }

  // Break at last space
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > maxLength * 0.5) {
    return truncated.slice(0, lastSpace) + "...";
  }

  return truncated + "...";
}

/**
 * Generate a verdict from the review body and rating.
 */
export function generateVerdict(body: string, rating: number): string {
  // Try to extract the last meaningful sentence as a verdict
  const sentences = body
    .replace(/([.!?])\s+/g, "$1|")
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  if (sentences.length > 0) {
    const lastSentence = sentences[sentences.length - 1].replace(/[.!?]+$/, "").trim();
    if (lastSentence.length > 20 && lastSentence.length < 200) {
      return lastSentence + ".";
    }
  }

  // Fallback based on rating
  const verdicts: Record<number, string> = {
    5: "Highly recommended — an excellent product that delivers on every promise.",
    4: "A solid choice with minor room for improvement. Recommended.",
    3: "Decent product but has notable drawbacks. Consider alternatives.",
    2: "Below expectations. Only recommended if no better options exist.",
    1: "Not recommended. Significant issues that outweigh any positives.",
  };

  return verdicts[Math.round(rating)] ?? verdicts[3];
}

/**
 * Generate a URL-friendly slug from a title.
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

// ─── IMPORT FUNCTIONS ───────────────────────────────────────

/**
 * Convert a single AmazonReview to a PipelineReview.
 * Performs auto-categorization and initial enrichment.
 */
export function convertToPipelineReview(amazonReview: AmazonReview): PipelineReview {
  const now = new Date().toISOString();

  // Auto-categorize
  const bestMatch = getBestCategory(amazonReview.productName, amazonReview.asin);

  // Extract pros/cons
  const { pros, cons } = extractProsAndCons(amazonReview.body);

  // Generate excerpt and verdict
  const excerpt = generateExcerpt(amazonReview.body);
  const verdict = generateVerdict(amazonReview.body, amazonReview.rating);

  // Build affiliate link
  const affiliateLink = buildAffiliateLink(amazonReview.asin);

  return {
    id: `pipeline-${amazonReview.id}`,
    amazonReviewId: amazonReview.id,
    asin: amazonReview.asin,
    productName: amazonReview.productName,
    title: amazonReview.title,
    body: amazonReview.body,
    rating: amazonReview.rating,
    date: amazonReview.date,
    images: amazonReview.images,
    productLink: amazonReview.productLink || `https://www.amazon.com/dp/${amazonReview.asin}`,
    status: "mapped",
    suggestedCategory: bestMatch.category,
    assignedCategory: bestMatch.category,
    categoryConfidence: bestMatch.confidence,
    categoryMatchDetails: bestMatch.matchedRule,
    categoryOverridden: false,
    affiliateLink,
    pros,
    cons,
    excerpt,
    verdict,
    reviewerName: "Reese",
    reviewerAvatar: "reese",
    isFeatured: amazonReview.rating >= 4,
    importedAt: now,
    mappedAt: now,
    enrichedAt: null,
    publishedAt: null,
    publishedReviewId: null,
  };
}

/**
 * Bulk import: Pull ALL reviews from amazonReviewStore,
 * convert them, and add to the pipeline.
 * Skips reviews that are already in the pipeline.
 */
export function bulkImport(): { imported: number; skipped: number; total: number } {
  const amazonReviews = getAmazonReviews();
  const existing = getPipelineReviews();
  const existingAmazonIds = new Set(existing.map((r) => r.amazonReviewId));

  let imported = 0;
  let skipped = 0;

  const newPipelineReviews: PipelineReview[] = [];

  for (const ar of amazonReviews) {
    if (existingAmazonIds.has(ar.id)) {
      skipped++;
      continue;
    }
    newPipelineReviews.push(convertToPipelineReview(ar));
    imported++;
  }

  if (newPipelineReviews.length > 0) {
    const merged = [...existing, ...newPipelineReviews];
    savePipelineReviews(merged);
  }

  return { imported, skipped, total: amazonReviews.length };
}

/**
 * Incremental sync: Check for new reviews in amazonReviewStore
 * that aren't yet in the pipeline, and add them.
 */
export function incrementalSync(): { newReviews: number } {
  const result = bulkImport();
  return { newReviews: result.imported };
}

// ─── CATEGORY MANAGEMENT ────────────────────────────────────

/**
 * Override the category for a pipeline review.
 */
export function overrideCategory(pipelineId: string, newCategory: SiteCategory): void {
  const reviews = getPipelineReviews();
  const idx = reviews.findIndex((r) => r.id === pipelineId);
  if (idx === -1) return;

  reviews[idx] = {
    ...reviews[idx],
    assignedCategory: newCategory,
    categoryOverridden: true,
    categoryConfidence: "high",
    categoryMatchDetails: "Manual override by user",
    mappedAt: new Date().toISOString(),
    status: reviews[idx].status === "imported" ? "mapped" : reviews[idx].status,
  };

  savePipelineReviews(reviews);
}

/**
 * Bulk override categories for multiple reviews.
 */
export function bulkOverrideCategory(pipelineIds: string[], newCategory: SiteCategory): void {
  const reviews = getPipelineReviews();
  const idSet = new Set(pipelineIds);
  const now = new Date().toISOString();

  for (let i = 0; i < reviews.length; i++) {
    if (idSet.has(reviews[i].id)) {
      reviews[i] = {
        ...reviews[i],
        assignedCategory: newCategory,
        categoryOverridden: true,
        categoryConfidence: "high",
        categoryMatchDetails: "Bulk manual override",
        mappedAt: now,
        status: reviews[i].status === "imported" ? "mapped" : reviews[i].status,
      };
    }
  }

  savePipelineReviews(reviews);
}

/**
 * Re-run auto-categorization on a review (resets manual override).
 */
export function recategorize(pipelineId: string): CategoryMatch | null {
  const reviews = getPipelineReviews();
  const idx = reviews.findIndex((r) => r.id === pipelineId);
  if (idx === -1) return null;

  const review = reviews[idx];
  const bestMatch = getBestCategory(review.productName, review.asin);

  reviews[idx] = {
    ...reviews[idx],
    suggestedCategory: bestMatch.category,
    assignedCategory: bestMatch.category,
    categoryConfidence: bestMatch.confidence,
    categoryMatchDetails: bestMatch.matchedRule,
    categoryOverridden: false,
    mappedAt: new Date().toISOString(),
  };

  savePipelineReviews(reviews);
  return bestMatch;
}

// ─── ENRICHMENT ─────────────────────────────────────────────

export interface EnrichmentData {
  pros?: string[];
  cons?: string[];
  excerpt?: string;
  verdict?: string;
  affiliateLink?: string;
  images?: string[];
  reviewerName?: string;
  reviewerAvatar?: "reese" | "revvel" | "caresse";
  isFeatured?: boolean;
  title?: string;
  body?: string;
  rating?: number;
}

/**
 * Enrich a pipeline review with additional data.
 */
export function enrichReview(pipelineId: string, data: EnrichmentData): void {
  const reviews = getPipelineReviews();
  const idx = reviews.findIndex((r) => r.id === pipelineId);
  if (idx === -1) return;

  const now = new Date().toISOString();
  reviews[idx] = {
    ...reviews[idx],
    ...data,
    enrichedAt: now,
    status: reviews[idx].status === "imported" || reviews[idx].status === "mapped" ? "enriched" : reviews[idx].status,
  };

  savePipelineReviews(reviews);
}

/**
 * Mark a review as enriched (ready for publishing).
 */
export function markEnriched(pipelineId: string): void {
  const reviews = getPipelineReviews();
  const idx = reviews.findIndex((r) => r.id === pipelineId);
  if (idx === -1) return;

  reviews[idx] = {
    ...reviews[idx],
    enrichedAt: new Date().toISOString(),
    status: "enriched",
  };

  savePipelineReviews(reviews);
}

// ─── PUBLISHING ─────────────────────────────────────────────

/**
 * Convert a PipelineReview to the ReviewData format used by reviewStore.
 */
export function toReviewData(pipelineReview: PipelineReview): ReviewData {
  const now = new Date().toISOString();
  const slug = generateSlug(pipelineReview.title);

  // Map expanded categories back to the base ReviewCategory type
  // The reviewStore only supports the original 5 categories
  const categoryMap: Record<SiteCategory, ReviewCategory> = {
    "tech": "tech",
    "food-restaurants": "food-restaurants",
    "products": "products",
    "entertainment": "entertainment",
    "services": "services",
    "home-garden": "products",
    "beauty-health": "products",
    "automotive": "products",
    "books-media": "entertainment",
    "sports-outdoors": "products",
  };

  const reviewCategory = categoryMap[pipelineReview.assignedCategory] ?? "products";

  return {
    id: `published-${pipelineReview.id}`,
    title: pipelineReview.title,
    slug,
    category: reviewCategory,
    rating: pipelineReview.rating,
    excerpt: pipelineReview.excerpt,
    content: pipelineReview.body,
    pros: pipelineReview.pros,
    cons: pipelineReview.cons,
    verdict: pipelineReview.verdict,
    image_url: pipelineReview.images[0] ?? "",
    product_name: pipelineReview.productName,
    product_link: pipelineReview.affiliateLink || pipelineReview.productLink,
    affiliate_tag: DEFAULT_AFFILIATE_TAG,
    reviewer_name: pipelineReview.reviewerName,
    reviewer_email: "",
    is_featured: pipelineReview.isFeatured,
    status: "approved",
    published_at: now,
    created_at: pipelineReview.date || now,
    updated_at: now,
  };
}

/**
 * Publish a single review: converts it and adds to the site reviewStore.
 */
export function publishReview(pipelineId: string): ReviewData | null {
  const reviews = getPipelineReviews();
  const idx = reviews.findIndex((r) => r.id === pipelineId);
  if (idx === -1) return null;

  const pipelineReview = reviews[idx];
  const reviewData = toReviewData(pipelineReview);

  // Add to reviewStore (localStorage)
  const siteReviews = getReviews();
  // Check for duplicate
  const existingIdx = siteReviews.findIndex(
    (r) => r.id === reviewData.id || r.slug === reviewData.slug
  );
  if (existingIdx !== -1) {
    siteReviews[existingIdx] = reviewData;
  } else {
    siteReviews.push(reviewData);
  }
  localStorage.setItem("reese-reviews-data", JSON.stringify(siteReviews));

  // Update pipeline status
  const now = new Date().toISOString();
  reviews[idx] = {
    ...reviews[idx],
    status: "published",
    publishedAt: now,
    publishedReviewId: reviewData.id,
  };
  savePipelineReviews(reviews);

  return reviewData;
}

/**
 * Bulk publish multiple reviews at once.
 */
export function bulkPublish(pipelineIds: string[]): { published: number; failed: number } {
  let published = 0;
  let failed = 0;

  for (const id of pipelineIds) {
    const result = publishReview(id);
    if (result) {
      published++;
    } else {
      failed++;
    }
  }

  return { published, failed };
}

/**
 * Unpublish a review (remove from site, revert to enriched status).
 */
export function unpublishReview(pipelineId: string): void {
  const reviews = getPipelineReviews();
  const idx = reviews.findIndex((r) => r.id === pipelineId);
  if (idx === -1) return;

  const pipelineReview = reviews[idx];

  // Remove from site reviewStore
  if (pipelineReview.publishedReviewId) {
    const siteReviews = getReviews().filter(
      (r) => r.id !== pipelineReview.publishedReviewId
    );
    localStorage.setItem("reese-reviews-data", JSON.stringify(siteReviews));
  }

  // Revert pipeline status
  reviews[idx] = {
    ...reviews[idx],
    status: "enriched",
    publishedAt: null,
    publishedReviewId: null,
  };
  savePipelineReviews(reviews);
}

// ─── QUERY HELPERS ──────────────────────────────────────────

export function getPipelineReviewsByStatus(status: PipelineStatus): PipelineReview[] {
  return getPipelineReviews().filter((r) => r.status === status);
}

export function getPipelineReviewsByCategory(category: SiteCategory): PipelineReview[] {
  return getPipelineReviews().filter((r) => r.assignedCategory === category);
}

export function getPipelineReviewById(id: string): PipelineReview | undefined {
  return getPipelineReviews().find((r) => r.id === id);
}

export function getUnpublishedReviews(): PipelineReview[] {
  return getPipelineReviews().filter((r) => r.status !== "published" && r.status !== "live");
}

export function getPublishableReviews(): PipelineReview[] {
  return getPipelineReviews().filter((r) =>
    r.status === "mapped" || r.status === "enriched"
  );
}

/**
 * Delete a pipeline review (does not affect amazonReviewStore or reviewStore).
 */
export function deletePipelineReview(pipelineId: string): void {
  const reviews = getPipelineReviews().filter((r) => r.id !== pipelineId);
  savePipelineReviews(reviews);
}

/**
 * Clear the entire pipeline (for testing/reset).
 */
export function clearPipeline(): void {
  localStorage.removeItem(PIPELINE_KEY);
  localStorage.removeItem(PIPELINE_STATS_KEY);
}

// ─── FILTER & SORT ──────────────────────────────────────────

export interface PipelineFilter {
  status?: PipelineStatus | "all";
  category?: SiteCategory | "all";
  rating?: number | "all";
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function filterPipelineReviews(filter: PipelineFilter): PipelineReview[] {
  let reviews = getPipelineReviews();

  if (filter.status && filter.status !== "all") {
    reviews = reviews.filter((r) => r.status === filter.status);
  }

  if (filter.category && filter.category !== "all") {
    reviews = reviews.filter((r) => r.assignedCategory === filter.category);
  }

  if (filter.rating && filter.rating !== "all") {
    reviews = reviews.filter((r) => r.rating === filter.rating);
  }

  if (filter.search) {
    const q = filter.search.toLowerCase();
    reviews = reviews.filter(
      (r) =>
        r.productName.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.body.toLowerCase().includes(q) ||
        r.asin.toLowerCase().includes(q)
    );
  }

  if (filter.dateFrom) {
    reviews = reviews.filter((r) => r.date >= filter.dateFrom!);
  }

  if (filter.dateTo) {
    reviews = reviews.filter((r) => r.date <= filter.dateTo!);
  }

  // Sort by date descending (newest first)
  reviews.sort((a, b) => b.date.localeCompare(a.date));

  return reviews;
}
