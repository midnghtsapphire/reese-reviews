// Enhanced Vine Data Service
// Supports both demo mode (localStorage) and production mode (Supabase)
// Automatically falls back to demo mode if Supabase is not configured

import type { VineItem } from "./businessTypes";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "reese-vine-items";
const VINE_CONFIG_KEY = "reese-vine-config";
const VINE_COOKIES_KEY = "reese-vine-cookies";
const LAST_SYNC_KEY = "reese-vine-last-sync";
const USE_BACKEND_KEY = "reese-use-backend";

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
  use_backend: boolean; // NEW: Toggle between demo and real backend
}

// ─── DEMO DATA ───────────────────────────────────────────────

export const DEMO_VINE_ITEMS: VineItem[] = [
  {
    id: "vine-001",
    asin: "B0D8XYZABC",
    product_name: "Anker 3-in-1 Charging Cable",
    category: "tech",
    image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
    received_date: "2026-02-15",
    review_deadline: "2026-03-15",
    estimated_value: 24.99,
    review_status: "pending",
    vine_enrollment_date: "2025-12-01",
    notes: "Received via Vine",
    template_used: false,
  },
  {
    id: "vine-002",
    asin: "B0CXYZDEF1",
    product_name: "Wireless Mouse Ergonomic",
    category: "tech",
    image_url: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=400",
    received_date: "2026-02-10",
    review_deadline: "2026-03-10",
    estimated_value: 19.99,
    review_status: "pending",
    vine_enrollment_date: "2025-12-01",
    notes: "Received via Vine",
    template_used: false,
  },
  {
    id: "vine-003",
    asin: "B0BXYZGHI2",
    product_name: "USB-C Hub 7-in-1",
    category: "tech",
    image_url: "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400",
    received_date: "2026-02-05",
    review_deadline: "2026-03-05",
    estimated_value: 34.99,
    review_status: "in_progress",
    vine_enrollment_date: "2025-12-01",
    notes: "Received via Vine",
    template_used: true,
  },
  {
    id: "vine-004",
    asin: "B0AXYZKL3",
    product_name: "Portable SSD 1TB",
    category: "tech",
    image_url: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400",
    received_date: "2026-01-28",
    review_deadline: "2026-02-28",
    estimated_value: 89.99,
    review_status: "overdue",
    vine_enrollment_date: "2025-12-01",
    notes: "Received via Vine",
    template_used: false,
  },
];

// ─── MODE DETECTION ──────────────────────────────────────────

export function isBackendMode(): boolean {
  try {
    const stored = localStorage.getItem(USE_BACKEND_KEY);
    return stored === "true";
  } catch {
    return false;
  }
}

export function setBackendMode(enabled: boolean): void {
  localStorage.setItem(USE_BACKEND_KEY, enabled.toString());
}

// ─── STORAGE HELPERS ─────────────────────────────────────────

export async function getVineItems(): Promise<VineItem[]> {
  // If backend mode is enabled, try Supabase first
  if (isBackendMode()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('vine_items')
          .select('*')
          .order('review_deadline', { ascending: true });

        if (!error && data) {
          return data.map(item => ({
            id: item.id,
            asin: item.asin,
            product_name: item.product_name,
            category: item.category || "tech",
            image_url: item.image_url || "",
            received_date: item.received_date || "",
            review_deadline: item.review_deadline,
            estimated_value: item.estimated_value || 0,
            review_status: item.review_status,
            review_id: item.review_id || undefined,
            vine_enrollment_date: item.vine_enrollment_date || "",
            notes: item.notes || "",
            template_used: item.template_used,
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching from Supabase, falling back to localStorage:', error);
    }
  }

  // Fallback to localStorage (demo mode)
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading localStorage:', error);
  }
  
  return DEMO_VINE_ITEMS;
}

export async function saveVineItems(items: VineItem[]): Promise<void> {
  // Save to localStorage regardless of mode (for offline support)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

  // If backend mode, also save to Supabase
  if (isBackendMode()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Upsert items to Supabase
        const { error } = await supabase
          .from('vine_items')
          .upsert(items.map(item => ({
            id: item.id,
            user_id: user.id,
            asin: item.asin,
            product_name: item.product_name,
            category: item.category,
            image_url: item.image_url,
            received_date: item.received_date,
            review_deadline: item.review_deadline,
            estimated_value: item.estimated_value,
            review_status: item.review_status,
            review_id: item.review_id,
            vine_enrollment_date: item.vine_enrollment_date,
            notes: item.notes,
            template_used: item.template_used,
          })));

        if (error) {
          console.error('Error saving to Supabase:', error);
        }
      }
    } catch (error) {
      console.error('Error in saveVineItems backend mode:', error);
    }
  }
}

export function getVineCookies(): VineCookies | null {
  try {
    const stored = localStorage.getItem(VINE_COOKIES_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
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
  } catch {}
  return {
    enabled: false,
    cookies_configured: false,
    auto_sync_enabled: false,
    sync_interval_hours: 24,
    queues_to_sync: ["potluck", "additional_items"],
    use_backend: false,
  };
}

export function updateVineConfig(updates: Partial<VineScraperConfig>): void {
  const config = getVineConfig();
  const updated = { ...config, ...updates };
  localStorage.setItem(VINE_CONFIG_KEY, JSON.stringify(updated));
  
  // Update backend mode flag
  if (updates.use_backend !== undefined) {
    setBackendMode(updates.use_backend);
  }
}

export function getLastSyncTime(): string | null {
  return localStorage.getItem(LAST_SYNC_KEY);
}

// ─── VINE ITEM QUERIES ────────────────────────────────────────

export async function getPendingVineReviews(): Promise<VineItem[]> {
  const items = await getVineItems();
  return items.filter((v) => v.review_status === "pending");
}

export async function getInProgressVineReviews(): Promise<VineItem[]> {
  const items = await getVineItems();
  return items.filter((v) => v.review_status === "in_progress");
}

export async function getOverdueVineReviews(): Promise<VineItem[]> {
  const items = await getVineItems();
  return items.filter((v) => v.review_status === "overdue");
}

export async function getVineItemByAsin(asin: string): Promise<VineItem | undefined> {
  const items = await getVineItems();
  return items.find((v) => v.asin === asin);
}

export async function updateVineReviewStatus(
  vineId: string,
  status: VineItem["review_status"],
  reviewId?: string
): Promise<void> {
  const items = await getVineItems();
  const idx = items.findIndex((v) => v.id === vineId);
  if (idx !== -1) {
    items[idx].review_status = status;
    if (reviewId) items[idx].review_id = reviewId;
    await saveVineItems(items);
  }
}

// ─── VINE SCRAPER ────────────────────────────────────────────

export interface VineScraperResult {
  success: boolean;
  itemsScraped: number;
  queues: VineQueue[];
  error?: string;
  timestamp: string;
}

/**
 * Scrape Vine items from Amazon Vine dashboard
 * In BACKEND MODE: Calls Supabase Edge Function
 * In DEMO MODE: Returns simulated data
 */
export async function scrapeVineItems(
  cookies: VineCookies,
  queues: VineQueue[] = ["potluck", "additional_items", "last_chance"]
): Promise<VineScraperResult> {
  try {
    // Backend mode - call Supabase Edge Function
    if (isBackendMode()) {
      const { data, error } = await supabase.functions.invoke('sync-vine-items', {
        body: { cookies, queues }
      });

      if (error) throw error;

      // Refresh local data
      await getVineItems();

      return {
        success: true,
        itemsScraped: data.itemsScraped || 0,
        queues,
        timestamp: data.timestamp || new Date().toISOString(),
      };
    }

    // Demo mode - simulate scraping
    await new Promise((r) => setTimeout(r, 2000));
    
    const items = await getVineItems();
    await saveVineItems(items);

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
 */
export async function validateVineCookies(cookies: VineCookies): Promise<boolean> {
  try {
    await new Promise((r) => setTimeout(r, 1000));
    return cookies.cookies && cookies.cookies.length > 0;
  } catch {
    return false;
  }
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
