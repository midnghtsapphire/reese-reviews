// ============================================================
// REVIEW AUTOMATION STORE
// Zustand-pattern store with localStorage persistence for the
// Review Automation module. Manages product input, generated
// reviews, media assets, video projects, and review packages.
// ============================================================

import { stripAITextFingerprints } from "@/utils/metadataStripper";

// ─── STORAGE KEYS ───────────────────────────────────────────

const STORAGE_KEY = "reese-review-automation";
const PRODUCTS_KEY = `${STORAGE_KEY}-products`;
const REVIEWS_KEY = `${STORAGE_KEY}-reviews`;
const MEDIA_KEY = `${STORAGE_KEY}-media`;
const VIDEOS_KEY = `${STORAGE_KEY}-videos`;
const PACKAGES_KEY = `${STORAGE_KEY}-packages`;
const SETTINGS_KEY = `${STORAGE_KEY}-settings`;

// ─── TYPES ──────────────────────────────────────────────────

export type ProductCategory =
  | "electronics"
  | "home-kitchen"
  | "beauty"
  | "health"
  | "sports"
  | "toys"
  | "clothing"
  | "automotive"
  | "books"
  | "food"
  | "pet"
  | "office"
  | "garden"
  | "tools"
  | "other";

export const PRODUCT_CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: "electronics", label: "Electronics & Tech" },
  { value: "home-kitchen", label: "Home & Kitchen" },
  { value: "beauty", label: "Beauty & Personal Care" },
  { value: "health", label: "Health & Wellness" },
  { value: "sports", label: "Sports & Outdoors" },
  { value: "toys", label: "Toys & Games" },
  { value: "clothing", label: "Clothing & Fashion" },
  { value: "automotive", label: "Automotive" },
  { value: "books", label: "Books & Media" },
  { value: "food", label: "Food & Grocery" },
  { value: "pet", label: "Pet Supplies" },
  { value: "office", label: "Office Products" },
  { value: "garden", label: "Garden & Outdoor" },
  { value: "tools", label: "Tools & Hardware" },
  { value: "other", label: "Other" },
];

export type ReviewTone = "enthusiastic" | "balanced" | "critical" | "casual" | "detailed";
export type ReviewLength = "short" | "medium" | "long";
export type AvatarChoice = "revvel" | "reese";
export type VideoStyle = "unboxing" | "demo" | "lifestyle" | "comparison" | "quick-take";
export type MediaType = "product-photo" | "lifestyle" | "in-use" | "detail" | "packaging";
export type ReviewStatus = "draft" | "generating" | "ready" | "finalized" | "submitted";
export type VideoStatus = "idle" | "generating" | "ready" | "exported";
export type PackageStatus = "incomplete" | "ready" | "submitted";

export interface ProductInput {
  id: string;
  asin: string;
  productName: string;
  description: string;
  category: ProductCategory;
  price: number;
  imageUrls: string[];
  importedFromOrder: boolean;
  orderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewVariant {
  id: string;
  productId: string;
  title: string;
  body: string;
  rating: number;
  ratingJustification: string;
  pros: string[];
  cons: string[];
  tone: ReviewTone;
  length: ReviewLength;
  wordCount: number;
  status: ReviewStatus;
  isSelected: boolean;
  createdAt: string;
  editedAt?: string;
}

export interface MediaAsset {
  id: string;
  productId: string;
  type: MediaType;
  originalUrl: string;
  cleanUrl: string;
  filename: string;
  isStripped: boolean;
  width?: number;
  height?: number;
  createdAt: string;
}

export interface VideoProject {
  id: string;
  productId: string;
  avatar: AvatarChoice;
  style: VideoStyle;
  duration: number; // seconds (15-30)
  scenes: VideoScene[];
  status: VideoStatus;
  exportUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export interface VideoScene {
  id: string;
  order: number;
  imageUrl: string;
  caption: string;
  duration: number; // seconds per scene
  transition: "fade" | "slide" | "zoom" | "cut";
}

export interface ReviewPackage {
  id: string;
  productId: string;
  productName: string;
  selectedReviewId: string;
  mediaAssetIds: string[];
  videoProjectId?: string;
  status: PackageStatus;
  previewGenerated: boolean;
  createdAt: string;
  submittedAt?: string;
}

export interface AutomationSettings {
  defaultTone: ReviewTone;
  defaultLength: ReviewLength;
  defaultAvatar: AvatarChoice;
  defaultVideoStyle: VideoStyle;
  autoStripMetadata: boolean;
  variantsToGenerate: number;
  includeVideoInPackage: boolean;
  // ── AI Video & Voice Integration ──────────────────────────
  /** HeyGen API key for avatar video generation */
  heygenApiKey: string;
  /** HeyGen avatar ID — loaded from avatar library */
  heygenAvatarId: string;
  /** ElevenLabs API key for AI voice synthesis */
  elevenLabsApiKey: string;
  /** ElevenLabs voice ID — loaded from voice library */
  elevenLabsVoiceId: string;
  /** OpenAI API key for review text generation */
  openaiApiKey: string;
  /** Picasso / DALL-E: still image generation */
  picassoApiKey: string;
}

// ─── DEFAULT SETTINGS ───────────────────────────────────────

const DEFAULT_SETTINGS: AutomationSettings = {
  defaultTone: "balanced",
  defaultLength: "medium",
  defaultAvatar: "reese",
  defaultVideoStyle: "demo",
  autoStripMetadata: true,
  variantsToGenerate: 3,
  includeVideoInPackage: true,
  heygenApiKey: "",
  heygenAvatarId: "",
  elevenLabsApiKey: "",
  elevenLabsVoiceId: "",
  openaiApiKey: "",
  picassoApiKey: "",
};

// ─── DEMO DATA ──────────────────────────────────────────────

const DEMO_PRODUCT: ProductInput = {
  id: "demo-prod-001",
  asin: "B0EXAMPLE1",
  productName: "ProGrip Wireless Gaming Mouse",
  description:
    "Ergonomic wireless gaming mouse with 16K DPI sensor, RGB lighting, 70-hour battery life, and 6 programmable buttons. Lightweight at 63g with honeycomb shell design.",
  category: "electronics",
  price: 49.99,
  imageUrls: [],
  importedFromOrder: false,
  createdAt: "2026-03-10T10:00:00Z",
  updatedAt: "2026-03-10T10:00:00Z",
};

const DEMO_REVIEWS: ReviewVariant[] = [
  {
    id: "demo-rev-001",
    productId: "demo-prod-001",
    title: "Finally a wireless mouse that keeps up with my gaming",
    body: "I've been through at least four wireless gaming mice in the past two years, and this is the first one that actually delivers on all its promises. The sensor tracks flawlessly on my desk pad — no skipping, no jitter, even during fast flick shots. Battery life is genuinely impressive; I charged it once when I got it and I'm still going strong after about three weeks of daily use. The honeycomb design keeps it super light without feeling cheap. My only gripe is the scroll wheel could have a bit more resistance, but that's personal preference. The software for the programmable buttons is straightforward and doesn't require a PhD to figure out. At this price point, it punches way above its weight.",
    rating: 5,
    ratingJustification:
      "Exceptional value for the price. Sensor accuracy, battery life, and build quality all exceed expectations for a sub-$50 wireless gaming mouse.",
    pros: [
      "Flawless 16K DPI sensor tracking",
      "70+ hour battery life is real",
      "Incredibly lightweight at 63g",
      "Easy-to-use button programming software",
      "Great value under $50",
    ],
    cons: [
      "Scroll wheel could use more tactile resistance",
      "RGB lighting options are somewhat limited",
    ],
    tone: "enthusiastic",
    length: "medium",
    wordCount: 156,
    status: "ready",
    isSelected: true,
    createdAt: "2026-03-10T10:30:00Z",
  },
  {
    id: "demo-rev-002",
    productId: "demo-prod-001",
    title: "Solid wireless mouse — a few things to know before buying",
    body: "Got this mouse about two weeks ago and overall I'm satisfied with the purchase. The sensor is accurate and responsive, which is the most important thing for gaming. Build quality feels solid despite the lightweight honeycomb design. Battery life has been great — haven't needed to charge yet. Setup was plug-and-play with the USB dongle. A couple things worth mentioning: the side buttons are a little small for my hands, and the feet could be smoother out of the box (they broke in after a few days). The RGB is nice but not a selling point. For the price, this competes with mice costing twice as much. Would recommend for casual to mid-level gamers who want wireless without the premium price tag.",
    rating: 4,
    ratingJustification:
      "Very good mouse with minor ergonomic issues. Excellent value but the small side buttons and initial feet friction keep it from a perfect score.",
    pros: [
      "Accurate and responsive sensor",
      "Excellent battery life",
      "Lightweight and comfortable for long sessions",
      "Plug-and-play setup",
      "Competitive pricing",
    ],
    cons: [
      "Side buttons feel small",
      "Mouse feet need break-in period",
      "RGB is basic",
    ],
    tone: "balanced",
    length: "medium",
    wordCount: 148,
    status: "ready",
    isSelected: false,
    createdAt: "2026-03-10T10:30:00Z",
  },
  {
    id: "demo-rev-003",
    productId: "demo-prod-001",
    title: "Good mouse for the money, not perfect",
    body: "Does what it says on the box. Wireless works fine, battery lasts a long time, and the sensor is decent for gaming. It's light, which I like. The honeycomb pattern looks cool but collects dust. Programming the buttons was easy enough. I knocked off a star because the Bluetooth mode has noticeable latency — stick with the dongle for gaming. Also the charging cable is short. But honestly, for fifty bucks? Hard to complain. It replaced my old wired mouse and I don't miss the cable at all.",
    rating: 4,
    ratingJustification:
      "Good value proposition with reliable core performance. Bluetooth latency and short charging cable are minor but notable drawbacks.",
    pros: [
      "Reliable wireless via USB dongle",
      "Long battery life",
      "Lightweight design",
      "Easy button programming",
    ],
    cons: [
      "Bluetooth mode has latency",
      "Short charging cable",
      "Honeycomb collects dust",
    ],
    tone: "casual",
    length: "short",
    wordCount: 107,
    status: "ready",
    isSelected: false,
    createdAt: "2026-03-10T10:30:00Z",
  },
];

// ─── STORAGE HELPERS ────────────────────────────────────────

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored) as T;
  } catch {
    // ignore parse errors
  }
  return fallback;
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save to localStorage [${key}]:`, e);
  }
}

// ─── PRODUCT FUNCTIONS ──────────────────────────────────────

export function getProducts(): ProductInput[] {
  return loadFromStorage<ProductInput[]>(PRODUCTS_KEY, [DEMO_PRODUCT]);
}

export function getProduct(id: string): ProductInput | undefined {
  return getProducts().find((p) => p.id === id);
}

export function addProduct(
  product: Omit<ProductInput, "id" | "createdAt" | "updatedAt">
): ProductInput {
  const now = new Date().toISOString();
  const newProduct: ProductInput = {
    ...product,
    id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: now,
    updatedAt: now,
  };
  const products = getProducts();
  products.push(newProduct);
  saveToStorage(PRODUCTS_KEY, products);
  return newProduct;
}

export function updateProduct(
  id: string,
  patch: Partial<ProductInput>
): ProductInput | null {
  const products = getProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  products[idx] = {
    ...products[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  saveToStorage(PRODUCTS_KEY, products);
  return products[idx];
}

export function deleteProduct(id: string): boolean {
  const products = getProducts();
  const filtered = products.filter((p) => p.id !== id);
  if (filtered.length === products.length) return false;
  saveToStorage(PRODUCTS_KEY, filtered);
  // Also clean up related data
  deleteReviewsByProduct(id);
  deleteMediaByProduct(id);
  deleteVideosByProduct(id);
  deletePackagesByProduct(id);
  return true;
}

/**
 * Import a product from Amazon order data (productLifecycleStore or amazonStore).
 * Reads from localStorage if available.
 */
export function importFromAmazonOrder(order: {
  asin: string;
  product_name: string;
  category: string;
  image_url: string;
  price: number;
  amazon_order_id: string;
}): ProductInput {
  const categoryMap: Record<string, ProductCategory> = {
    tech: "electronics",
    "food-restaurants": "food",
    products: "other",
    services: "other",
    entertainment: "other",
  };

  return addProduct({
    asin: order.asin,
    productName: order.product_name,
    description: "",
    category: categoryMap[order.category] ?? "other",
    price: order.price,
    imageUrls: order.image_url ? [order.image_url] : [],
    importedFromOrder: true,
    orderId: order.amazon_order_id,
  });
}

// ─── REVIEW FUNCTIONS ───────────────────────────────────────

export function getReviewVariants(productId?: string): ReviewVariant[] {
  const all = loadFromStorage<ReviewVariant[]>(REVIEWS_KEY, DEMO_REVIEWS);
  if (productId) return all.filter((r) => r.productId === productId);
  return all;
}

export function getSelectedReview(productId: string): ReviewVariant | undefined {
  return getReviewVariants(productId).find((r) => r.isSelected);
}

export function addReviewVariant(
  variant: Omit<ReviewVariant, "id" | "createdAt" | "wordCount">
): ReviewVariant {
  const cleanBody = stripAITextFingerprints(variant.body);
  const cleanTitle = stripAITextFingerprints(variant.title);
  const wordCount = cleanBody.split(/\s+/).filter(Boolean).length;

  const newVariant: ReviewVariant = {
    ...variant,
    title: cleanTitle,
    body: cleanBody,
    wordCount,
    id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  const variants = loadFromStorage<ReviewVariant[]>(REVIEWS_KEY, DEMO_REVIEWS);
  variants.push(newVariant);
  saveToStorage(REVIEWS_KEY, variants);
  return newVariant;
}

export function updateReviewVariant(
  id: string,
  patch: Partial<ReviewVariant>
): ReviewVariant | null {
  const variants = loadFromStorage<ReviewVariant[]>(REVIEWS_KEY, DEMO_REVIEWS);
  const idx = variants.findIndex((r) => r.id === id);
  if (idx === -1) return null;

  // Strip AI fingerprints from edited text
  if (patch.body) patch.body = stripAITextFingerprints(patch.body);
  if (patch.title) patch.title = stripAITextFingerprints(patch.title);

  variants[idx] = {
    ...variants[idx],
    ...patch,
    editedAt: new Date().toISOString(),
    wordCount: (patch.body ?? variants[idx].body).split(/\s+/).filter(Boolean).length,
  };
  saveToStorage(REVIEWS_KEY, variants);
  return variants[idx];
}

export function selectReviewVariant(
  productId: string,
  variantId: string
): void {
  const variants = loadFromStorage<ReviewVariant[]>(REVIEWS_KEY, DEMO_REVIEWS);
  const updated = variants.map((r) => {
    if (r.productId === productId) {
      return { ...r, isSelected: r.id === variantId };
    }
    return r;
  });
  saveToStorage(REVIEWS_KEY, updated);
}

export function deleteReviewVariant(id: string): boolean {
  const variants = loadFromStorage<ReviewVariant[]>(REVIEWS_KEY, DEMO_REVIEWS);
  const filtered = variants.filter((r) => r.id !== id);
  if (filtered.length === variants.length) return false;
  saveToStorage(REVIEWS_KEY, filtered);
  return true;
}

function deleteReviewsByProduct(productId: string): void {
  const variants = loadFromStorage<ReviewVariant[]>(REVIEWS_KEY, []);
  saveToStorage(
    REVIEWS_KEY,
    variants.filter((r) => r.productId !== productId)
  );
}

// ─── MEDIA FUNCTIONS ────────────────────────────────────────

export function getMediaAssets(productId?: string): MediaAsset[] {
  const all = loadFromStorage<MediaAsset[]>(MEDIA_KEY, []);
  if (productId) return all.filter((m) => m.productId === productId);
  return all;
}

export function addMediaAsset(
  asset: Omit<MediaAsset, "id" | "createdAt">
): MediaAsset {
  const newAsset: MediaAsset = {
    ...asset,
    id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  const assets = getMediaAssets();
  assets.push(newAsset);
  saveToStorage(MEDIA_KEY, assets);
  return newAsset;
}

export function updateMediaAsset(
  id: string,
  patch: Partial<MediaAsset>
): MediaAsset | null {
  const assets = getMediaAssets();
  const idx = assets.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  assets[idx] = { ...assets[idx], ...patch };
  saveToStorage(MEDIA_KEY, assets);
  return assets[idx];
}

export function deleteMediaAsset(id: string): boolean {
  const assets = getMediaAssets();
  const filtered = assets.filter((m) => m.id !== id);
  if (filtered.length === assets.length) return false;
  saveToStorage(MEDIA_KEY, filtered);
  return true;
}

function deleteMediaByProduct(productId: string): void {
  const assets = getMediaAssets();
  saveToStorage(
    MEDIA_KEY,
    assets.filter((m) => m.productId !== productId)
  );
}

// ─── VIDEO FUNCTIONS ────────────────────────────────────────

export function getVideoProjects(productId?: string): VideoProject[] {
  const all = loadFromStorage<VideoProject[]>(VIDEOS_KEY, []);
  if (productId) return all.filter((v) => v.productId === productId);
  return all;
}

export function addVideoProject(
  project: Omit<VideoProject, "id" | "createdAt">
): VideoProject {
  const newProject: VideoProject = {
    ...project,
    id: `video-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  const projects = getVideoProjects();
  projects.push(newProject);
  saveToStorage(VIDEOS_KEY, projects);
  return newProject;
}

export function updateVideoProject(
  id: string,
  patch: Partial<VideoProject>
): VideoProject | null {
  const projects = getVideoProjects();
  const idx = projects.findIndex((v) => v.id === id);
  if (idx === -1) return null;
  projects[idx] = { ...projects[idx], ...patch };
  saveToStorage(VIDEOS_KEY, projects);
  return projects[idx];
}

export function deleteVideoProject(id: string): boolean {
  const projects = getVideoProjects();
  const filtered = projects.filter((v) => v.id !== id);
  if (filtered.length === projects.length) return false;
  saveToStorage(VIDEOS_KEY, filtered);
  return true;
}

function deleteVideosByProduct(productId: string): void {
  const projects = getVideoProjects();
  saveToStorage(
    VIDEOS_KEY,
    projects.filter((v) => v.productId !== productId)
  );
}

// ─── PACKAGE FUNCTIONS ──────────────────────────────────────

export function getReviewPackages(productId?: string): ReviewPackage[] {
  const all = loadFromStorage<ReviewPackage[]>(PACKAGES_KEY, []);
  if (productId) return all.filter((p) => p.productId === productId);
  return all;
}

export function createReviewPackage(
  productId: string,
  reviewId: string,
  mediaIds: string[],
  videoId?: string
): ReviewPackage {
  const product = getProduct(productId);
  const pkg: ReviewPackage = {
    id: `pkg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    productId,
    productName: product?.productName ?? "Unknown Product",
    selectedReviewId: reviewId,
    mediaAssetIds: mediaIds,
    videoProjectId: videoId,
    status: "ready",
    previewGenerated: false,
    createdAt: new Date().toISOString(),
  };
  const packages = getReviewPackages();
  packages.push(pkg);
  saveToStorage(PACKAGES_KEY, packages);
  return pkg;
}

export function updateReviewPackage(
  id: string,
  patch: Partial<ReviewPackage>
): ReviewPackage | null {
  const packages = getReviewPackages();
  const idx = packages.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  packages[idx] = { ...packages[idx], ...patch };
  saveToStorage(PACKAGES_KEY, packages);
  return packages[idx];
}

export function markPackageSubmitted(id: string): ReviewPackage | null {
  return updateReviewPackage(id, {
    status: "submitted",
    submittedAt: new Date().toISOString(),
  });
}

function deletePackagesByProduct(productId: string): void {
  const packages = getReviewPackages();
  saveToStorage(
    PACKAGES_KEY,
    packages.filter((p) => p.productId !== productId)
  );
}

// ─── SETTINGS ───────────────────────────────────────────────

export function getSettings(): AutomationSettings {
  return loadFromStorage<AutomationSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
}

export function updateSettings(
  patch: Partial<AutomationSettings>
): AutomationSettings {
  const current = getSettings();
  const updated = { ...current, ...patch };
  saveToStorage(SETTINGS_KEY, updated);
  return updated;
}

export function resetSettings(): AutomationSettings {
  saveToStorage(SETTINGS_KEY, DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

// ─── REVIEW GENERATION HELPERS ──────────────────────────────

/**
 * Generate review text variants for a product.
 * In production this would call an AI API; here we use templates
 * with randomization for authentic-sounding output.
 */
export function generateReviewVariants(
  product: ProductInput,
  count: number = 3,
  tones: ReviewTone[] = ["enthusiastic", "balanced", "casual"]
): ReviewVariant[] {
  const variants: ReviewVariant[] = [];

  const titleTemplates: Record<ReviewTone, string[]> = {
    enthusiastic: [
      `Love this ${product.productName} — exceeded all expectations`,
      `${product.productName} is a game changer for me`,
      `Why I can't stop recommending the ${product.productName}`,
    ],
    balanced: [
      `${product.productName} — honest thoughts after two weeks`,
      `My experience with the ${product.productName} so far`,
      `${product.productName} review: the good and the not-so-good`,
    ],
    critical: [
      `${product.productName} — some things to consider before buying`,
      `Honest take on the ${product.productName}`,
      `${product.productName}: worth the price? My verdict`,
    ],
    casual: [
      `Got the ${product.productName} and here's the deal`,
      `Quick thoughts on the ${product.productName}`,
      `${product.productName} — is it actually good?`,
    ],
    detailed: [
      `In-depth ${product.productName} review after 30 days of use`,
      `${product.productName} comprehensive breakdown`,
      `Everything you need to know about the ${product.productName}`,
    ],
  };

  const bodyTemplates: Record<ReviewTone, (name: string, desc: string) => string> = {
    enthusiastic: (name, desc) =>
      `I picked up the ${name} about two weeks ago and honestly, I'm impressed. ${desc ? `For context, ${desc.slice(0, 100)}...` : ""} Right out of the box, the build quality stood out to me. It feels premium without the premium price tag. I've been using it daily and it's held up great. The performance is consistently solid — no hiccups, no complaints. If you're on the fence about this one, I'd say go for it. It's one of those purchases where you feel like you got more than what you paid for. Already recommended it to a couple friends.`,
    balanced: (name, desc) =>
      `I've had the ${name} for about two weeks now, so I feel like I can give a fair assessment. ${desc ? `The product is described as ${desc.slice(0, 80)}.` : ""} Overall, it delivers on its main promises. Build quality is good for the price range, and day-to-day performance has been reliable. There are a couple of minor things I'd change — nothing dealbreaking, but worth mentioning. The setup was straightforward and I was up and running in minutes. For what you're paying, I think it's a solid choice, especially if you're looking for something dependable without spending a fortune.`,
    critical: (name, desc) =>
      `I wanted to like the ${name} more than I do. ${desc ? `It's marketed as ${desc.slice(0, 80)}.` : ""} Don't get me wrong — it works, and it does most things adequately. But at this price point, I expected a bit more polish. The core functionality is fine, but there are some rough edges that more established competitors have already smoothed out. That said, if you can look past those issues, there's decent value here. I just think it needs another iteration to really nail it. Not a bad product, just not a great one yet.`,
    casual: (name, desc) =>
      `So I got the ${name} and wanted to share my thoughts. ${desc ? `Basically it's ${desc.slice(0, 60)}.` : ""} It works well for what I need it for. Nothing fancy, just does the job. Setup took like five minutes. Been using it every day and no issues so far. The price was right and it does what it says. Could it be better? Sure, everything could. But for the money? No complaints. Would buy again if I needed another one.`,
    detailed: (name, desc) =>
      `After using the ${name} extensively for the past month, I want to provide a thorough breakdown of my experience. ${desc ? `The manufacturer describes it as: ${desc.slice(0, 100)}.` : ""} Starting with build quality: the materials feel durable and well-assembled. I inspected the construction closely and found no obvious weak points. Performance-wise, it consistently delivers as advertised. I tested it across multiple scenarios and conditions. Battery life (if applicable) meets or slightly exceeds the stated specs. The user interface and controls are intuitive. Documentation could be better, but it's not hard to figure out. In terms of value, it sits comfortably in the mid-range and offers features you'd typically find in higher-priced alternatives.`,
  };

  const prosTemplates: Record<ReviewTone, string[][]> = {
    enthusiastic: [
      ["Excellent build quality", "Outstanding performance", "Great value for money", "Easy setup", "Looks premium"],
      ["Impressive battery life", "Comfortable to use daily", "Fast and responsive", "Solid construction", "Exceeded expectations"],
    ],
    balanced: [
      ["Good build quality for the price", "Reliable daily performance", "Straightforward setup", "Decent feature set", "Fair pricing"],
      ["Consistent performance", "Comfortable design", "Good battery life", "Intuitive controls", "Solid value"],
    ],
    critical: [
      ["Core functionality works", "Reasonable price point", "Adequate build quality"],
      ["Basic features are solid", "Setup is simple enough", "Decent for casual use"],
    ],
    casual: [
      ["Works great", "Easy to set up", "Good price", "Does what it says"],
      ["No issues so far", "Comfortable to use", "Solid build", "Quick setup"],
    ],
    detailed: [
      ["Durable construction with quality materials", "Consistent performance across conditions", "Intuitive user interface", "Competitive pricing vs alternatives", "Good documentation"],
      ["Thorough feature set", "Reliable long-term performance", "Energy efficient", "Ergonomic design", "Strong warranty support"],
    ],
  };

  const consTemplates: Record<ReviewTone, string[][]> = {
    enthusiastic: [
      ["Minor cosmetic detail could be improved", "Wish it came in more colors"],
      ["Packaging could be better", "Manual is a bit sparse"],
    ],
    balanced: [
      ["A few minor fit and finish issues", "Could use better documentation", "Some features feel basic"],
      ["Slight learning curve", "Accessories sold separately", "Average packaging"],
    ],
    critical: [
      ["Needs more polish overall", "Some features feel underdeveloped", "Build quality inconsistencies", "Customer support could improve"],
      ["Missing features competitors offer", "Feels like a first-gen product", "Instructions are lacking"],
    ],
    casual: [
      ["Nothing major", "Could be slightly better"],
      ["Minor nitpick or two", "Wish it was a tiny bit cheaper"],
    ],
    detailed: [
      ["Documentation could be more comprehensive", "Some advanced features have a learning curve", "Accessories are basic"],
      ["Software updates needed for full feature parity", "Packaging doesn't protect well enough", "Limited color options"],
    ],
  };

  for (let i = 0; i < count; i++) {
    const tone = tones[i % tones.length];
    const titles = titleTemplates[tone];
    const title = titles[Math.floor(Math.random() * titles.length)];
    const body = bodyTemplates[tone](product.productName, product.description);
    const prosOptions = prosTemplates[tone];
    const consOptions = consTemplates[tone];
    const pros = prosOptions[Math.floor(Math.random() * prosOptions.length)];
    const cons = consOptions[Math.floor(Math.random() * consOptions.length)];

    const ratingMap: Record<ReviewTone, number> = {
      enthusiastic: 5,
      balanced: 4,
      critical: 3,
      casual: 4,
      detailed: 4,
    };

    variants.push(
      addReviewVariant({
        productId: product.id,
        title,
        body,
        rating: ratingMap[tone],
        ratingJustification: `Rating based on ${tone} assessment of build quality, performance, and value.`,
        pros,
        cons,
        tone,
        length: body.split(/\s+/).length > 150 ? "long" : body.split(/\s+/).length > 80 ? "medium" : "short",
        status: "ready",
        isSelected: i === 0,
      })
    );
  }

  return variants;
}

// ─── CLEAR ALL DATA ─────────────────────────────────────────

export function clearAllAutomationData(): void {
  localStorage.removeItem(PRODUCTS_KEY);
  localStorage.removeItem(REVIEWS_KEY);
  localStorage.removeItem(MEDIA_KEY);
  localStorage.removeItem(VIDEOS_KEY);
  localStorage.removeItem(PACKAGES_KEY);
}
