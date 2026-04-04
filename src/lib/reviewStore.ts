/**
 * Local review data store for Reese Reviews.
 * Provides demo data and local storage persistence for reviews.
 * When Supabase is connected, this serves as fallback/demo data.
 * Supabase-backed with localStorage fallback for offline.
 */

import {
  loadFromSupabase,
  bulkSaveToSupabase,
  loadFromLocalStorage,
  saveToLocalStorage,
  type SupabaseStoreOptions,
} from "@/lib/supabasePersistence";
import { supabase } from "@/integrations/supabase/client";

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

export const DEMO_REVIEWS: ReviewData[] = [];

const STORAGE_KEY = "reese-reviews-data";
const SUBMISSIONS_KEY = "reese-reviews-submissions";

// ─── SUPABASE STORE OPTIONS ─────────────────────────────────

const reviewSubmissionStoreOpts: SupabaseStoreOptions<ReviewData> = {
  table: "review_submissions",
  localStorageKey: SUBMISSIONS_KEY,
  fromRow: (row) => ({
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    category: row.category as ReviewCategory,
    rating: Number(row.rating) || 5,
    excerpt: (row.excerpt as string) || "",
    content: (row.content as string) || "",
    pros: (row.pros as string[]) || [],
    cons: (row.cons as string[]) || [],
    verdict: (row.verdict as string) || "",
    image_url: (row.image_url as string) || "",
    product_name: (row.product_name as string) || "",
    product_link: (row.product_link as string) || "",
    affiliate_tag: (row.affiliate_tag as string) || "meetaudreyeva-20",
    reviewer_name: (row.reviewer_name as string) || "",
    reviewer_email: (row.reviewer_email as string) || "",
    is_featured: Boolean(row.is_featured),
    status: (row.status as ReviewData["status"]) || "pending",
    published_at: (row.published_at as string) || "",
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }),
  toRow: (item, userId) => ({
    id: item.id,
    user_id: userId,
    title: item.title,
    slug: item.slug,
    category: item.category,
    rating: item.rating,
    excerpt: item.excerpt,
    content: item.content,
    pros: item.pros,
    cons: item.cons,
    verdict: item.verdict,
    image_url: item.image_url,
    product_name: item.product_name,
    product_link: item.product_link,
    affiliate_tag: item.affiliate_tag,
    reviewer_name: item.reviewer_name,
    reviewer_email: item.reviewer_email,
    is_featured: item.is_featured,
    status: item.status,
    published_at: item.published_at || null,
  }),
  getId: (item) => item.id,
};

// ─── SYNC CRUD ──────────────────────────────────────────────

export function saveReviews(reviews: ReviewData[]): void {
  saveToLocalStorage(STORAGE_KEY, reviews);
  // Reviews in the main STORAGE_KEY are admin-managed, not user submissions
}

export function getReviews(): ReviewData[] {
  return loadFromLocalStorage<ReviewData>(STORAGE_KEY, []);
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

// ─── SUBMISSIONS (Supabase-backed) ──────────────────────────

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

  // Save to localStorage
  const submissions = getSubmissions();
  submissions.push(newReview);
  saveToLocalStorage(SUBMISSIONS_KEY, submissions);

  // Fire-and-forget Supabase insert
  submitReviewToSupabase(newReview).catch(() => {});

  return newReview;
}

async function submitReviewToSupabase(review: ReviewData): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    await (supabase.from("review_submissions") as any).insert({
      id: review.id,
      user_id: userId || null,
      title: review.title,
      slug: review.slug,
      category: review.category,
      rating: review.rating,
      excerpt: review.excerpt,
      content: review.content,
      pros: review.pros,
      cons: review.cons,
      verdict: review.verdict,
      image_url: review.image_url,
      product_name: review.product_name,
      product_link: review.product_link,
      affiliate_tag: review.affiliate_tag,
      reviewer_name: review.reviewer_name,
      reviewer_email: review.reviewer_email,
      is_featured: review.is_featured,
      status: review.status,
      published_at: review.published_at,
    });
  } catch (err) {
    console.warn("[reviewStore] Failed to submit review to Supabase:", err);
  }
}

export function getSubmissions(): ReviewData[] {
  return loadFromLocalStorage<ReviewData>(SUBMISSIONS_KEY, []);
}

export async function getSubmissionsAsync(): Promise<ReviewData[]> {
  return loadFromSupabase(reviewSubmissionStoreOpts, []);
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
