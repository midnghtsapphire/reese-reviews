// ============================================================
// VINE REVIEW AUTO-GENERATOR — STORE
// Manages Vine items, review generation queue, deadlines,
// CSV import, and review status tracking.
// ============================================================

export type VineItemStatus = "pending" | "generating" | "generated" | "edited" | "submitted" | "overdue";
export type StarRating = 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 | 5;

export interface VineItem {
  id: string;
  productName: string;
  asin: string;
  category: string;
  orderDate: string;
  reviewDeadline: string;
  etv: number; // Estimated Tax Value
  imageUrl: string;
  status: VineItemStatus;
  generatedReview: GeneratedReview | null;
  scrapedData: ScrapedProductData | null;
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
  sentimentScore: number; // -1 to 1
  scrapedAt: string;
}

export interface ScrapedReview {
  source: string;
  rating: number;
  text: string;
  date: string;
  helpful: number;
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

// ─── HELPERS ────────────────────────────────────────────────
function generateId(): string {
  return `vine-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadItems(): VineItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ITEMS);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function saveItems(items: VineItem[]): void {
  localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
}

function loadAvatars(): AvatarProfile[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_AVATARS);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [...STOCK_AVATARS];
}

function saveAvatars(avatars: AvatarProfile[]): void {
  localStorage.setItem(STORAGE_KEY_AVATARS, JSON.stringify(avatars));
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

export function addVineItem(data: Omit<VineItem, "id" | "status" | "generatedReview" | "scrapedData" | "createdAt" | "updatedAt">): VineItem {
  const item: VineItem = {
    ...data,
    id: generateId(),
    status: "pending",
    generatedReview: null,
    scrapedData: null,
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
    const item = addVineItem({
      productName: row.productName || "Unknown Product",
      asin: row.asin || "",
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
