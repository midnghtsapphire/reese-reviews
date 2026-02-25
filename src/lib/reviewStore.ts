/**
 * Local review data store for Reese Reviews.
 * Provides demo data and local storage persistence for reviews.
 * When Supabase is connected, this serves as fallback/demo data.
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

export const DEMO_REVIEWS: ReviewData[] = [
  {
    id: "demo-1",
    title: "The Best Wireless Earbuds for Everyday Use",
    slug: "best-wireless-earbuds-everyday",
    category: "tech",
    rating: 5,
    excerpt: "These earbuds changed my daily routine. Crystal clear sound, amazing battery life, and they actually stay in your ears!",
    content: "I've been testing these wireless earbuds for three weeks now and I'm genuinely impressed. The sound quality is rich and balanced — bass hits hard without drowning out the mids and highs. Battery life is a solid 8 hours with the case giving you another 24. The fit is secure enough for workouts and comfortable enough for all-day wear. The noise cancellation is surprisingly effective for the price point. Pairing was instant with both my phone and laptop. The touch controls are intuitive and responsive. My only minor complaint is the case could be a bit more compact, but that's really nitpicking at this point.",
    pros: ["Crystal clear audio quality", "8+ hour battery life", "Secure comfortable fit", "Great noise cancellation", "Quick pairing"],
    cons: ["Case is slightly bulky", "No wireless charging"],
    verdict: "An absolute steal at this price point. These are my new daily drivers.",
    image_url: "",
    product_name: "SoundCore Pro Buds X3",
    product_link: "https://amazon.com/dp/example1",
    affiliate_tag: "meetaudreyeva-20",
    reviewer_name: "Reese",
    reviewer_email: "",
    is_featured: true,
    status: "approved",
    published_at: "2026-02-20T10:00:00Z",
    created_at: "2026-02-20T10:00:00Z",
    updated_at: "2026-02-20T10:00:00Z",
  },
  {
    id: "demo-2",
    title: "Sakura Ramen House — A Hidden Gem Downtown",
    slug: "sakura-ramen-house-hidden-gem",
    category: "food-restaurants",
    rating: 4,
    excerpt: "The tonkotsu ramen here is absolutely incredible. Rich, creamy broth with perfectly chewy noodles. Worth the wait!",
    content: "Found this little ramen spot tucked away on 5th Street and it instantly became my favorite. The tonkotsu broth is simmered for 18 hours — you can taste the depth. Noodles are made fresh daily and have that perfect chewy texture. The chashu pork melts in your mouth. I also tried the spicy miso and it had a great kick without being overwhelming. The space is small (maybe 20 seats) so expect a wait during peak hours. Service was friendly and attentive. Prices are reasonable for the quality — most bowls are $14-$18. They also have great appetizers; the gyoza were crispy and juicy.",
    pros: ["Incredible tonkotsu broth", "Fresh handmade noodles", "Friendly service", "Reasonable prices"],
    cons: ["Small space, long waits", "Limited parking", "Cash preferred"],
    verdict: "If you love ramen, this is a must-visit. Get there early to avoid the rush.",
    image_url: "",
    product_name: "Sakura Ramen House",
    product_link: "",
    affiliate_tag: "",
    reviewer_name: "Reese",
    reviewer_email: "",
    is_featured: true,
    status: "approved",
    published_at: "2026-02-18T14:00:00Z",
    created_at: "2026-02-18T14:00:00Z",
    updated_at: "2026-02-18T14:00:00Z",
  },
  {
    id: "demo-3",
    title: "This Standing Desk Changed My Whole Setup",
    slug: "standing-desk-changed-setup",
    category: "products",
    rating: 5,
    excerpt: "From box to beautiful in under an hour. Sturdy, smooth, and looks amazing in my room.",
    content: "I've been wanting a standing desk for months and finally pulled the trigger on this one. Assembly took about 45 minutes — the instructions were clear and all the hardware was labeled. The desk surface is a gorgeous walnut finish that looks way more expensive than it is. The motor is whisper quiet and transitions between sitting and standing height in about 10 seconds. It has 4 memory presets which is super convenient. The cable management tray underneath keeps everything clean. After a month of use, there's zero wobble even at standing height. My monitor, laptop, and all my accessories fit perfectly on the 60-inch top.",
    pros: ["Easy 45-minute assembly", "Whisper quiet motor", "4 memory presets", "Zero wobble", "Beautiful walnut finish"],
    cons: ["Heavy — need two people to flip the top", "Power cord could be longer"],
    verdict: "Best desk I've ever owned. Worth every penny for the quality and functionality.",
    image_url: "",
    product_name: "FlexiSpot E7 Pro",
    product_link: "https://amazon.com/dp/example3",
    affiliate_tag: "meetaudreyeva-20",
    reviewer_name: "Reese",
    reviewer_email: "",
    is_featured: true,
    status: "approved",
    published_at: "2026-02-15T09:00:00Z",
    created_at: "2026-02-15T09:00:00Z",
    updated_at: "2026-02-15T09:00:00Z",
  },
  {
    id: "demo-4",
    title: "Streaming Service Showdown: Which One Is Actually Worth It?",
    slug: "streaming-service-showdown",
    category: "entertainment",
    rating: 4,
    excerpt: "I tested all the major streaming services for a month each. Here's the honest breakdown of what you're actually getting.",
    content: "Over the past four months, I subscribed to every major streaming service one at a time to give each a fair shot. The winner might surprise you. Content library, interface design, streaming quality, price value, and exclusive originals were all factored in. Some services have incredible catalogs but terrible interfaces. Others look beautiful but lack depth. The sweet spot is the service that balances all five factors. I tracked what I watched, how often I opened each app, and whether I felt like I got my money's worth each month.",
    pros: ["Comprehensive comparison", "Real usage data", "Honest value assessment"],
    cons: ["Preferences are subjective", "Catalogs change monthly"],
    verdict: "There's no single best service — but there IS a best service for YOUR watching habits. Read the full breakdown.",
    image_url: "",
    product_name: "Streaming Services Comparison",
    product_link: "",
    affiliate_tag: "",
    reviewer_name: "Reese",
    reviewer_email: "",
    is_featured: false,
    status: "approved",
    published_at: "2026-02-12T16:00:00Z",
    created_at: "2026-02-12T16:00:00Z",
    updated_at: "2026-02-12T16:00:00Z",
  },
  {
    id: "demo-5",
    title: "The Phone Case That Actually Survived My Drop Test",
    slug: "phone-case-survived-drop-test",
    category: "tech",
    rating: 5,
    excerpt: "I dropped my phone from 6 feet onto concrete. Not a scratch. This case is the real deal.",
    content: "I'm notoriously hard on phone cases. I've broken three in the past year alone. So when this brand claimed military-grade drop protection, I had to test it myself. I dropped my phone (in the case) from waist height, shoulder height, and even standing-on-a-chair height onto concrete. Zero damage. The case has a slim profile that doesn't add bulk, raised edges around the camera and screen, and a satisfying grip texture. The buttons are clicky and responsive through the case. It comes in 12 colors and the matte finish resists fingerprints. At $29, it's cheaper than most premium cases too.",
    pros: ["Survived 6-foot drop test", "Slim profile", "Great grip texture", "12 color options", "Affordable"],
    cons: ["No built-in kickstand", "MagSafe version costs extra"],
    verdict: "The best phone case I've ever used. Period. Buy it before you crack another screen.",
    image_url: "",
    product_name: "ArmorShield Ultra Slim Case",
    product_link: "https://amazon.com/dp/example5",
    affiliate_tag: "meetaudreyeva-20",
    reviewer_name: "Reese",
    reviewer_email: "",
    is_featured: false,
    status: "approved",
    published_at: "2026-02-10T11:00:00Z",
    created_at: "2026-02-10T11:00:00Z",
    updated_at: "2026-02-10T11:00:00Z",
  },
  {
    id: "demo-6",
    title: "Local Pet Grooming Service Review — Paws & Claws",
    slug: "paws-claws-pet-grooming",
    category: "services",
    rating: 4,
    excerpt: "My dog actually enjoyed the grooming session. That's never happened before. These folks know what they're doing.",
    content: "My golden retriever usually hates grooming appointments. He shakes, whines, and tries to escape. But at Paws & Claws, something was different. The staff greeted him by name (we'd called ahead), gave him treats, and let him sniff around before starting. The groomer was patient and gentle, explaining everything she was doing. The bath used organic, hypoallergenic shampoo. The nail trim was quick and stress-free. They even did a cute bandana and bow tie. The whole session took about 90 minutes and cost $65 including tip. They sent me photos during the appointment which was a nice touch. Booking was easy through their app.",
    pros: ["Calm, patient staff", "Organic products", "Photo updates during session", "Easy app booking"],
    cons: ["Slightly pricier than chains", "Limited weekend availability"],
    verdict: "Worth the extra cost for the stress-free experience. My dog actually wagged his tail leaving. That says everything.",
    image_url: "",
    product_name: "Paws & Claws Grooming",
    product_link: "",
    affiliate_tag: "",
    reviewer_name: "Reese",
    reviewer_email: "",
    is_featured: false,
    status: "approved",
    published_at: "2026-02-08T13:00:00Z",
    created_at: "2026-02-08T13:00:00Z",
    updated_at: "2026-02-08T13:00:00Z",
  },
];

const STORAGE_KEY = "reese-reviews-data";
const SUBMISSIONS_KEY = "reese-reviews-submissions";

export function getReviews(): ReviewData[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEMO_REVIEWS;
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
