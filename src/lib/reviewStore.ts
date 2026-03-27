/**
 * Local review data store for Reese Reviews.
 * Reviews are persisted in localStorage and submitted via the SubmitReview form.
 * When Supabase is connected, this will be replaced by real database queries.
 */

export type ReviewCategory = "products" | "food-restaurants" | "services" | "entertainment" | "tech";

export interface ReviewData {
  id: string;
  title: string;
  slug: string;
  category: ReviewCategory;
  rating: number;
  excerpt: string;
  content: string;
  pros: string[];
  cons: string[];
  verdict: string;
  image_url: string;
  product_name: string;
  product_link: string;
  affiliate_tag: string;
  reviewer_name: string;
  reviewer_email: string;
  is_featured: boolean;
  status: "pending" | "approved" | "rejected";
  published_at: string;
  created_at: string;
  updated_at: string;
}

export const CATEGORIES: { value: ReviewCategory; label: string; icon: string; description: string }[] = [
  { value: "products", label: "Products", icon: "📦", description: "Gadgets, home goods, beauty, and everything unboxed" },
  { value: "food-restaurants", label: "Food & Restaurants", icon: "🍽️", description: "Restaurant visits, food delivery, snacks, and recipes" },
  { value: "services", label: "Services", icon: "🛠️", description: "Subscriptions, apps, customer service, and more" },
  { value: "entertainment", label: "Entertainment", icon: "🎬", description: "Movies, shows, games, books, and live events" },
  { value: "tech", label: "Tech", icon: "💻", description: "Phones, laptops, software, and smart devices" },
];


const STORAGE_KEY = "reese-reviews-data";
const SUBMISSIONS_KEY = "reese-reviews-submissions";

export function getReviews(): ReviewData[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export function getApprovedReviews(): ReviewData[] {
  return getReviews().filter((r) => r.status === "approved");
}

export function getFeaturedReviews(): ReviewData[] {
  return getApprovedReviews().filter((r) => r.is_featured);
}

export function getReviewBySlug(slug: string): ReviewData | undefined {
  return getReviews().find((r) => r.slug === slug);
}

export function getReviewsByCategory(category: ReviewCategory): ReviewData[] {
  return getApprovedReviews().filter((r) => r.category === category);
}

export function searchReviews(query: string): ReviewData[] {
  const q = query.toLowerCase();
  return getApprovedReviews().filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      r.excerpt.toLowerCase().includes(q) ||
      r.content.toLowerCase().includes(q) ||
      r.product_name.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
  );
}

export function submitReview(review: Omit<ReviewData, "id" | "slug" | "is_featured" | "status" | "published_at" | "created_at" | "updated_at">): ReviewData {
  const now = new Date().toISOString();
  const slug = review.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const newReview: ReviewData = {
    ...review,
    id: `user-${Date.now()}`,
    slug,
    is_featured: false,
    status: "pending",
    published_at: now,
    created_at: now,
    updated_at: now,
  };

  const submissions = getSubmissions();
  submissions.push(newReview);
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));

  return newReview;
}

export function getSubmissions(): ReviewData[] {
  try {
    const stored = localStorage.getItem(SUBMISSIONS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export function generateAffiliateLink(baseUrl: string, tag: string = "meetaudreyeva-20"): string {
  if (!baseUrl) return "";
  try {
    const url = new URL(baseUrl);
    if (url.hostname.includes("amazon")) {
      url.searchParams.set("tag", tag);
    }
    return url.toString();
  } catch {
    return baseUrl;
  }
}
