import type { ProductReview } from "./types";
import { parseReviewMarkdown } from "./parseReview";
import sampleMarkdown from "../../reviews/2-pocket-toploader-binder/review.md?raw";

const PLACEHOLDER = "/review-desk/demo-placeholder.svg";

function fromMarkdown(
  raw: string,
  images: ProductReview["images"],
  branch = "feat/review-desk-2026-11-14",
): ProductReview {
  const parsed = parseReviewMarkdown(raw);
  const slug = parsed.slug || "sample";
  return {
    id: slug,
    slug,
    branch,
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
    images,
    textOnly: parsed.textOnly,
    markdownPath: `reviews/${slug}/review.md`,
    markdown: raw,
  };
}

/** Offline demo data used when no review PRs are available. */
export function getSampleReviews(): ProductReview[] {
  return [
    fromMarkdown(sampleMarkdown, [
      {
        id: "final-review",
        label: "Final Review Photo (demo placeholder — replace with your own)",
        url: PLACEHOLDER,
        path: "reviews/2-pocket-toploader-binder/images/final-review.svg",
        isFinal: true,
      },
    ]),
  ];
}
