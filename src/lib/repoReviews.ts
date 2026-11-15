import type { ReviewCategory, ReviewData } from "@/lib/reviewStore";
import { parseReviewMarkdown } from "@/review-desk/parseReview";

const PUBLISHABLE = new Set(["approved-to-post", "published", "posted-site", "posted-amazon"]);

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

function excerptFrom(body: string): string {
  const compact = body.replace(/\s+/g, " ").trim();
  if (compact.length <= 180) return compact;
  return `${compact.slice(0, 177).trim()}...`;
}

function firstImage(slug: string): string {
  const match = Object.entries(imageModules).find(([path]) => path.includes(`/reviews/${slug}/images/`));
  return match ? match[1] : "";
}

function asCategory(value: string): ReviewCategory {
  const allowed: ReviewCategory[] = [
    "products",
    "food-restaurants",
    "services",
    "entertainment",
    "tech",
  ];
  return allowed.includes(value as ReviewCategory) ? (value as ReviewCategory) : "products";
}

/** Reviews that have already been approved to appear on the website. Drafts stay hidden. */
export function getPublishedRepoReviews(): ReviewData[] {
  const reviews: ReviewData[] = [];
  for (const [path, raw] of Object.entries(markdownModules)) {
    const parsed = parseReviewMarkdown(raw);
    if (!PUBLISHABLE.has(parsed.status)) continue;
    const slug = parsed.slug || path.split("/").at(-2) || "review";
    const now = parsed.extra.published_at || new Date().toISOString();
    reviews.push({
      id: `repo-${slug}`,
      title: parsed.title || parsed.product,
      slug,
      category: asCategory(parsed.category),
      rating: parsed.rating ?? 0,
      excerpt: excerptFrom(parsed.body),
      content: parsed.body,
      pros: [],
      cons: [],
      verdict: "",
      image_url: firstImage(slug),
      product_name: parsed.product,
      product_link: parsed.url,
      affiliate_tag: "",
      reviewer_name: "Reese",
      reviewer_email: "",
      is_featured: false,
      status: "approved",
      published_at: String(now),
      created_at: String(now),
      updated_at: String(now),
    });
  }
  return reviews;
}
