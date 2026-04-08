// ============================================================
// AMAZON VINE SCRAPER SERVICE
// Scrapes Vine queues directly from Amazon Vine dashboard
// Uses Puppeteer with user's session cookies
// ============================================================

import type { VineItem } from "./businessTypes";

const STORAGE_KEY = "reese-vine-items";
const VINE_CONFIG_KEY = "reese-vine-config";
const VINE_COOKIES_KEY = "reese-vine-cookies";
const LAST_SYNC_KEY = "reese-vine-last-sync";

/** Canonical Amazon Vine & account URLs */
export const VINE_URLS = {
  reviews:  "https://www.amazon.com/vine/vine-reviews",
  orders:   "https://www.amazon.com/vine/orders",
  account:  "https://www.amazon.com/vine/account",
  amazonAccount: "https://www.amazon.com/gp/css/homepage.html?ref_=nav_AccountFlyout_ya",
} as const;

export type VineQueue = "potluck" | "additional_items" | "last_chance";

export interface VineCookies {
  cookies: Array<{
    name: string;
    value: string;
    domain?: string;
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: string;
  }>;
  lastUpdated: string;
}

export interface VineScraperConfig {
  enabled: boolean;
  cookies_configured: boolean;
  auto_sync_enabled: boolean;
  sync_interval_hours: number;
  last_sync?: string;
  queues_to_sync: VineQueue[];
}

// ─── DEMO DATA ───────────────────────────────────────────────

export const DEMO_VINE_ITEMS: VineItem[] = [];

// ─── STORAGE HELPERS ─────────────────────────────────────────

export function getVineItems(): VineItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // noop
  }
  return [];
}

export function saveVineItems(items: VineItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
}

export function getVineCookies(): VineCookies | null {
  try {
    const stored = localStorage.getItem(VINE_COOKIES_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // noop
  }
  return null;
}

export function saveVineCookies(cookies: VineCookies): void {
  localStorage.setItem(VINE_COOKIES_KEY, JSON.stringify(cookies));
  updateVineConfig({ cookies_configured: true });
}

export function getVineConfig(): VineScraperConfig {
  try {
    const stored = localStorage.getItem(VINE_CONFIG_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // noop
  }
  return {
    enabled: false,
    cookies_configured: false,
    auto_sync_enabled: false,
    sync_interval_hours: 24,
    queues_to_sync: ["potluck", "additional_items"],
  };
}

export function updateVineConfig(updates: Partial<VineScraperConfig>): void {
  const config = getVineConfig();
  const updated = { ...config, ...updates };
  localStorage.setItem(VINE_CONFIG_KEY, JSON.stringify(updated));
}

export function getLastSyncTime(): string | null {
  return localStorage.getItem(LAST_SYNC_KEY);
}

// ─── VINE ITEM QUERIES ────────────────────────────────────────

export function getPendingVineReviews(): VineItem[] {
  return getVineItems().filter((v) => v.review_status === "pending");
}

export function getInProgressVineReviews(): VineItem[] {
  return getVineItems().filter((v) => v.review_status === "in_progress");
}

export function getOverdueVineReviews(): VineItem[] {
  return getVineItems().filter((v) => v.review_status === "overdue");
}

export function getVineItemByAsin(asin: string): VineItem | undefined {
  return getVineItems().find((v) => v.asin === asin);
}

export function updateVineReviewStatus(
  vineId: string,
  status: VineItem["review_status"],
  reviewId?: string
): void {
  const items = getVineItems();
  const idx = items.findIndex((v) => v.id === vineId);
  if (idx !== -1) {
    items[idx].review_status = status;
    if (reviewId) items[idx].review_id = reviewId;
    saveVineItems(items);
  }
}

// ─── VINE SCRAPER (CLIENT-SIDE SIMULATION) ────────────────────
// In production, this calls a backend service that uses Puppeteer
// The backend handles:
// 1. Cookie management (secure storage)
// 2. Puppeteer headless browser automation
// 3. Vine page scraping
// 4. Data extraction and parsing

export interface VineScraperResult {
  success: boolean;
  itemsScraped: number;
  queues: VineQueue[];
  error?: string;
  timestamp: string;
}

/**
 * Scrape Vine items from Amazon Vine dashboard (https://www.amazon.com/vine/vine-reviews)
 * In production: POST /api/vine/scrape with cookies
 * Client-side: Simulates the scrape with demo data
 */
export async function scrapeVineItems(
  cookies: VineCookies,
  queues: VineQueue[] = ["potluck", "additional_items", "last_chance"]
): Promise<VineScraperResult> {
  try {
    // Simulate API call delay
    await new Promise((r) => setTimeout(r, 2000));

    // In production:
    // const response = await fetch('/api/vine/scrape', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ cookies, queues })
    // });
    // const data = await response.json();
    // if (data.success) saveVineItems(data.items);
    // return data;

    // For now, return demo data with updated sync time
    const items = getVineItems();
    saveVineItems(items);

    return {
      success: true,
      itemsScraped: items.length,
      queues,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      itemsScraped: 0,
      queues,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Validate Amazon cookies by testing a request
 * In production: POST /api/vine/validate-cookies
 */
export async function validateVineCookies(cookies: VineCookies): Promise<boolean> {
  try {
    // Simulate validation delay
    await new Promise((r) => setTimeout(r, 1000));

    // In production:
    // const response = await fetch('/api/vine/validate-cookies', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ cookies })
    // });
    // return response.ok;

    return cookies.cookies && cookies.cookies.length > 0;
  } catch {
    return false;
  }
}

/**
 * Schedule automatic Vine syncs
 * In production: Backend handles scheduling with cron jobs
 */
export function scheduleVineSync(): void {
  const config = getVineConfig();
  if (!config.auto_sync_enabled || !config.cookies_configured) {
    return;
  }

  const cookies = getVineCookies();
  if (!cookies) return;

  // Set up interval (in production, backend handles this)
  const intervalMs = config.sync_interval_hours * 60 * 60 * 1000;
  setInterval(() => {
    scrapeVineItems(cookies, config.queues_to_sync);
  }, intervalMs);
}

/**
 * Generate a Vine review template
 */
export function generateVineReviewTemplate(item: VineItem): string {
  return `I received the ${item.product_name} (ASIN: ${item.asin}) through Amazon Vine on ${new Date(item.received_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.

[DESCRIBE YOUR FIRST IMPRESSIONS HERE]

[ADD YOUR DETAILED EXPERIENCE AND OBSERVATIONS HERE]

[DESCRIBE THE PRODUCT'S STRENGTHS]

[DESCRIBE ANY WEAKNESSES OR AREAS FOR IMPROVEMENT]

Overall, I would rate this product [RATING]/5 stars because [EXPLAIN YOUR RATING].

[ADD YOUR FINAL RECOMMENDATION HERE]

---
Disclaimer: I received this product free through Amazon Vine and am providing my honest opinion.`;
}

/**
 * Calculate days until review deadline
 */
export function daysUntilDeadline(deadline: string): number {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Determine review status based on deadline
 */
export function getReviewStatusFromDeadline(deadline: string, hasReview: boolean): VineItem["review_status"] {
  if (hasReview) return "submitted";
  const daysLeft = daysUntilDeadline(deadline);
  if (daysLeft < 0) return "overdue";
  if (daysLeft < 7) return "in_progress";
  return "pending";
}
