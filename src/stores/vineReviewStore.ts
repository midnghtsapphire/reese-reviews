// ============================================================
// VINE REVIEW AUTO-GENERATOR — STORE
// Manages Vine items, review generation queue, deadlines,
// CSV import, and review status tracking.
// Supabase-backed with localStorage fallback for offline.
// ============================================================

import {
  loadFromSupabase,
  deleteFromSupabase,
  bulkSaveToSupabase,
  loadFromLocalStorage,
  saveToLocalStorage,
  type SupabaseStoreOptions,
} from "@/lib/supabasePersistence";

export type VineItemStatus = "pending" | "generating" | "generated" | "edited" | "submitted" | "overdue";
export type StarRating = 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 | 5;

export interface VineItem {
  id: string;
  productName: string;
  asin: string;
  amazonUrl: string;
  category: string;
  orderDate: string;
  reviewDeadline: string;
  etv: number; // Estimated Tax Value
  imageUrl: string;
  status: VineItemStatus;
  generatedReview: GeneratedReview | null;
  scrapedData: ScrapedProductData | null;
  scrapedImages: ScrapedImageData | null;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedReview {
  id: string;
  vineItemId: string;
  title: string;
  body: string;
  rating: StarRating;
  ratingJustification: string;
  pros: string[];
  cons: string[];
  photos: ReviewPhoto[];
  videoUrl: string | null;
  videoScript: string | null;
  videoLengthSeconds: number;
  avatarId: string | null;
  ftcDisclosure: string;
  isEdited: boolean;
  createdAt: string;
  editedAt: string | null;
}

export interface ReviewPhoto {
  id: string;
  url: string;
  caption: string;
  type: "product" | "lifestyle" | "in-use" | "detail" | "unboxing";
  isSelected: boolean;
}

export interface ScrapedProductData {
  amazonReviews: ScrapedReview[];
  redditMentions: string[];
  averageRating: number;
  totalReviews: number;
  commonPros: string[];
  commonCons: string[];
  sentimentScore: number;
  scrapedAt: string;
}

export interface ScrapedReview {
  source: string;
  rating: number;
  text: string;
  date: string;
  helpful: number;
}

export interface ScrapedImageData {
  listingImages: Array<{ url: string; source: string; type: string; alt: string }>;
  reviewImages: Array<{ url: string; source: string; type: string; alt: string }>;
  sources: string[];
  scrapedAt: string;
  isDemo: boolean;
}

export interface AvatarProfile {
  id: string;
  name: string;
  imageUrl: string;
  type: "stock" | "custom";
  gender: "male" | "female" | "neutral";
}

// ─── STORAGE KEYS ───────────────────────────────────────────
const STORAGE_KEY_ITEMS = "vine-review-items";
const STORAGE_KEY_AVATARS = "vine-review-avatars";

// ─── STOCK AVATARS ──────────────────────────────────────────
export const STOCK_AVATARS: AvatarProfile[] = [
  { id: "avatar-reese", name: "Reese", imageUrl: "/avatars/reese.jpg", type: "stock", gender: "female" },
  { id: "avatar-maya", name: "Maya", imageUrl: "/avatars/maya.jpg", type: "stock", gender: "female" },
  { id: "avatar-jordan", name: "Jordan", imageUrl: "/avatars/jordan.jpg", type: "stock", gender: "male" },
  { id: "avatar-alex", name: "Alex", imageUrl: "/avatars/alex.jpg", type: "stock", gender: "male" },
  { id: "avatar-sam", name: "Sam", imageUrl: "/avatars/sam.jpg", type: "stock", gender: "neutral" },
];

// ─── SUPABASE STORE OPTIONS ─────────────────────────────────

const vineItemStoreOpts: SupabaseStoreOptions<VineItem> = {
  table: "vine_review_items",
  localStorageKey: STORAGE_KEY_ITEMS,
  fromRow: (row) => ({
    id: row.id as string,
    productName: row.product_name as string,
    asin: (row.asin as string) || "",
    amazonUrl: (row.amazon_url as string) || "",
    category: (row.category as string) || "other",
    orderDate: row.order_date as string,
    reviewDeadline: row.review_deadline as string,
    etv: Number(row.etv) || 0,
    imageUrl: (row.image_url as string) || "",
    status: (row.status as VineItemStatus) || "pending",
    generatedReview: row.generated_review as GeneratedReview | null,
    scrapedData: row.scraped_data as ScrapedProductData | null,
    scrapedImages: row.scraped_images as ScrapedImageData | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }),
  toRow: (item, userId) => ({
    id: item.id,
    user_id: userId,
    product_name: item.productName,
    asin: item.asin,
    amazon_url: item.amazonUrl,
    category: item.category,
    order_date: item.orderDate || null,
    review_deadline: item.reviewDeadline || null,
    etv: item.etv,
    image_url: item.imageUrl,
    status: item.status,
    generated_review: item.generatedReview as unknown as Record<string, unknown> | null,
    scraped_data: item.scrapedData as unknown as Record<string, unknown> | null,
    scraped_images: item.scrapedImages as unknown as Record<string, unknown> | null,
  }),
  getId: (item) => item.id,
};

const avatarStoreOpts: SupabaseStoreOptions<AvatarProfile> = {
  table: "review_avatars",
  localStorageKey: STORAGE_KEY_AVATARS,
  fromRow: (row) => ({
    id: row.id as string,
    name: row.name as string,
    imageUrl: row.image_url as string,
    type: (row.avatar_type as "stock" | "custom") || "custom",
    gender: (row.gender as "male" | "female" | "neutral") || "neutral",
  }),
  toRow: (item, userId) => ({
    id: item.id,
    user_id: userId,
    name: item.name,
    image_url: item.imageUrl,
    avatar_type: item.type,
    gender: item.gender,
  }),
  getId: (item) => item.id,
};

// ─── HELPERS ────────────────────────────────────────────────
function generateId(): string {
  return `vine-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadItems(): VineItem[] {
  return loadFromLocalStorage<VineItem>(STORAGE_KEY_ITEMS, []);
}

function saveItems(items: VineItem[]): void {
  saveToLocalStorage(STORAGE_KEY_ITEMS, items);
  // Fire-and-forget Supabase sync
  bulkSaveToSupabase(vineItemStoreOpts, items).catch(() => {});
}

function loadAvatars(): AvatarProfile[] {
  return loadFromLocalStorage<AvatarProfile>(STORAGE_KEY_AVATARS, [...STOCK_AVATARS]);
}

function saveAvatars(avatars: AvatarProfile[]): void {
  saveToLocalStorage(STORAGE_KEY_AVATARS, avatars);
  bulkSaveToSupabase(avatarStoreOpts, avatars).catch(() => {});
}

// ─── ASYNC LOADERS (Supabase-first) ────────────────────────

export async function getVineItemsAsync(): Promise<VineItem[]> {
  return loadFromSupabase(vineItemStoreOpts, []);
}

export async function getAvatarsAsync(): Promise<AvatarProfile[]> {
  return loadFromSupabase(avatarStoreOpts, [...STOCK_AVATARS]);
}

// ─── VINE ITEM CRUD ─────────────────────────────────────────
export function getVineItems(): VineItem[] {
  const items = loadItems();
  // Auto-mark overdue items
  const now = new Date();
  let changed = false;
  for (const item of items) {
    if (item.status === "pending" && new Date(item.reviewDeadline) < now) {
      item.status = "overdue";
      changed = true;
    }
  }
  if (changed) saveItems(items);
  return items;
}

export function getVineItem(id: string): VineItem | undefined {
  return loadItems().find((i) => i.id === id);
}

export function addVineItem(data: Omit<VineItem, "id" | "status" | "generatedReview" | "scrapedData" | "scrapedImages" | "createdAt" | "updatedAt">): VineItem {
  const item: VineItem = {
    ...data,
    id: generateId(),
    status: "pending",
    generatedReview: null,
    scrapedData: null,
    scrapedImages: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const items = loadItems();
  items.push(item);
  saveItems(items);
  return item;
}

export function updateVineItem(id: string, updates: Partial<VineItem>): VineItem | null {
  const items = loadItems();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
  saveItems(items);
  return items[idx];
}

export function deleteVineItem(id: string): boolean {
  const items = loadItems();
  const filtered = items.filter((i) => i.id !== id);
  if (filtered.length === items.length) return false;
  saveItems(filtered);
  deleteFromSupabase(vineItemStoreOpts, id, filtered).catch(() => {});
  return true;
}

// ─── CSV IMPORT ─────────────────────────────────────────────
export interface CSVRow {
  productName: string;
  asin: string;
  category: string;
  orderDate: string;
  reviewDeadline: string;
  etv?: number;
}

export function importFromCSV(rows: CSVRow[]): VineItem[] {
  const imported: VineItem[] = [];
  for (const row of rows) {
    const asin = row.asin || "";
    const item = addVineItem({
      productName: row.productName || "Unknown Product",
      asin,
      amazonUrl: asin ? `https://www.amazon.com/dp/${asin}` : "",
      category: row.category || "other",
      orderDate: row.orderDate || new Date().toISOString(),
      reviewDeadline: row.reviewDeadline || new Date(Date.now() + 30 * 86400000).toISOString(),
      etv: row.etv || 0,
      imageUrl: "",
    });
    imported.push(item);
  }
  return imported;
}

export function parseCSVText(csvText: string): CSVRow[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const obj: Record<string, string> = {};
    headers.forEach((h, j) => { obj[h] = vals[j] || ""; });
    rows.push({
      productName: obj["productname"] || obj["product"] || obj["name"] || obj["item"] || "",
      asin: obj["asin"] || obj["id"] || "",
      category: obj["category"] || obj["type"] || "other",
      orderDate: obj["orderdate"] || obj["date"] || obj["ordered"] || "",
      reviewDeadline: obj["reviewdeadline"] || obj["deadline"] || obj["duedate"] || obj["due"] || "",
      etv: parseFloat(obj["etv"] || obj["value"] || obj["estimatedtaxvalue"] || "0") || 0,
    });
  }
  return rows.filter((r) => r.productName);
}

// ─── QUEUE & SORTING ────────────────────────────────────────
export function getPendingQueue(): VineItem[] {
  return getVineItems()
    .filter((i) => i.status === "pending" || i.status === "overdue")
    .sort((a, b) => new Date(a.reviewDeadline).getTime() - new Date(b.reviewDeadline).getTime());
}

export function getReviewedItems(): VineItem[] {
  return getVineItems().filter((i) => ["generated", "edited", "submitted"].includes(i.status));
}

export function getOverdueItems(): VineItem[] {
  return getVineItems().filter((i) => i.status === "overdue");
}

export function getItemStats() {
  const items = getVineItems();
  return {
    total: items.length,
    pending: items.filter((i) => i.status === "pending").length,
    generating: items.filter((i) => i.status === "generating").length,
    generated: items.filter((i) => i.status === "generated").length,
    edited: items.filter((i) => i.status === "edited").length,
    submitted: items.filter((i) => i.status === "submitted").length,
    overdue: items.filter((i) => i.status === "overdue").length,
    totalETV: items.reduce((sum, i) => sum + (i.etv || 0), 0),
  };
}

// ─── AVATAR MANAGEMENT ──────────────────────────────────────
export function getAvatars(): AvatarProfile[] {
  return loadAvatars();
}

export function addCustomAvatar(name: string, imageUrl: string, gender: "male" | "female" | "neutral"): AvatarProfile {
  const avatar: AvatarProfile = {
    id: `avatar-custom-${Date.now()}`,
    name,
    imageUrl,
    type: "custom",
    gender,
  };
  const avatars = loadAvatars();
  avatars.push(avatar);
  saveAvatars(avatars);
  return avatar;
}

export function deleteAvatar(id: string): boolean {
  const avatars = loadAvatars();
  const filtered = avatars.filter((a) => a.id !== id || a.type === "stock");
  if (filtered.length === avatars.length) return false;
  saveAvatars(filtered);
  deleteFromSupabase(avatarStoreOpts, id, filtered).catch(() => {});
  return true;
}

// ─── DEADLINE HELPERS ───────────────────────────────────────
export function getDaysUntilDeadline(deadline: string): number {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

export function getDeadlineColor(deadline: string): string {
  const days = getDaysUntilDeadline(deadline);
  if (days < 0) return "text-red-500";
  if (days <= 3) return "text-orange-500";
  if (days <= 7) return "text-yellow-500";
  return "text-green-500";
}

export function getDeadlineBadgeVariant(deadline: string): "destructive" | "outline" | "secondary" | "default" {
  const days = getDaysUntilDeadline(deadline);
  if (days < 0) return "destructive";
  if (days <= 3) return "destructive";
  if (days <= 7) return "outline";
  return "secondary";
}
