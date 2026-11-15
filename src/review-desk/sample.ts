import type { ProductReview, ReviewImage } from "./types";
import { parseReviewMarkdown } from "./parseReview";

const markdownModules = import.meta.glob("../../reviews/*/review.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

const imageModules = import.meta.glob("../../reviews/*/images/*", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const PLACEHOLDER = "/review-desk/demo-placeholder.svg";
const PLACEHOLDER_NAMES = new Set([
  "final-review.svg",
  "demo-placeholder.svg",
]);

function imagesFor(slug: string): ReviewImage[] {
  const images: ReviewImage[] = [];
  for (const [path, url] of Object.entries(imageModules)) {
    if (!path.includes(`/reviews/${slug}/images/`)) continue;
    const fileName = path.split("/").at(-1) || "image";
    if (fileName.toUpperCase().startsWith("REVVEL-DISABLED")) {
      continue;
    }
    const isPlaceholder = PLACEHOLDER_NAMES.has(fileName.toLowerCase());
    const isFinal = /final/i.test(fileName) || isPlaceholder;
    images.push({
      id: fileName.replace(/\.[^.]+$/, ""),
      label: isPlaceholder
        ? "Final Review Photo (demo placeholder — replace with your own)"
        : isFinal
          ? "Final Review Photo"
          : fileName,
      url: isPlaceholder ? PLACEHOLDER : url,
      path: `reviews/${slug}/images/${fileName}`,
      isFinal,
    });
  }
  images.sort((a, b) => Number(Boolean(b.isFinal)) - Number(Boolean(a.isFinal)));
  return images;
}

function fromMarkdown(raw: string, slugHint: string): ProductReview {
  const parsed = parseReviewMarkdown(raw);
  const slug = parsed.slug || slugHint || "review";
  return {
    id: slug,
    slug,
    branch: `review/${slug}`,
    prNumber: null,
    prUrl: null,
    notionUrl: parsed.notionUrl || null,
    name: parsed.product || slug,
    asin: parsed.asin,
    amazonUrl: parsed.url,
    category: parsed.category || null,
    status: parsed.status,
    rating: parsed.rating,
    title: parsed.title,
    body: parsed.body,
    images: imagesFor(slug),
    textOnly: parsed.textOnly,
    markdownPath: `reviews/${slug}/review.md`,
    markdown: raw,
    orderDate: parsed.orderDate || null,
    priority: parsed.priority || null,
  };
}

/** Local reviews/<slug> folders, skipping archived demo copies. */
export function getLocalReviews(): ProductReview[] {
  const reviews: ProductReview[] = [];
  for (const [path, raw] of Object.entries(markdownModules)) {
    if (path.includes("/reviews/_")) continue;
    const slugHint = path.split("/").at(-2) || "review";
    reviews.push(fromMarkdown(raw, slugHint));
  }
  reviews.sort((a, b) => {
    const pa = a.priority === "reviews-to-do" ? 0 : 1;
    const pb = b.priority === "reviews-to-do" ? 0 : 1;
    if (pa !== pb) return pa - pb;
    if (a.orderDate && b.orderDate && a.orderDate !== b.orderDate) {
      return a.orderDate < b.orderDate ? 1 : -1;
    }
    return a.name.localeCompare(b.name);
  });
  return reviews;
}

/** Offline data used when no review PRs are available. */
export function getSampleReviews(): ProductReview[] {
  return getLocalReviews();
}
