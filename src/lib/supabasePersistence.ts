// ============================================================
// SUPABASE PERSISTENCE HELPER
// Shared utility for all stores migrating from localStorage
// to Supabase with localStorage fallback for offline support.
// ============================================================

import { supabase } from "@/integrations/supabase/client";

/**
 * Get the current authenticated user's ID, or null if not logged in.
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Check if Supabase is reachable and user is authenticated.
 */
export async function isSupabaseAvailable(): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    return userId !== null;
  } catch {
    return false;
  }
}

/**
 * Generic Supabase CRUD operations with localStorage fallback.
 * Each store can use these helpers to read/write data.
 */

export interface SupabaseStoreOptions<T> {
  table: string;
  localStorageKey: string;
  /** Transform a Supabase row into the app's local type */
  fromRow: (row: Record<string, unknown>) => T;
  /** Transform a local item into a Supabase insert/update payload */
  toRow: (item: T, userId: string) => Record<string, unknown>;
  /** Get the ID field from a local item */
  getId: (item: T) => string;
}

/**
 * Load items from Supabase if available, otherwise from localStorage.
 * Also syncs Supabase data to localStorage for offline cache.
 */
export async function loadFromSupabase<T>(
  opts: SupabaseStoreOptions<T>,
  fallback: T[],
  filters?: Record<string, unknown>
): Promise<T[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return loadFromLocalStorage<T>(opts.localStorageKey, fallback);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic table name: Supabase generated types require a literal table name
    let query = (supabase.from(opts.table) as any).select("*").eq("user_id", userId);

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.warn(`[SupabasePersistence] Error loading from ${opts.table}:`, error.message);
      return loadFromLocalStorage<T>(opts.localStorageKey, fallback);
    }

    if (data && data.length > 0) {
      const items = (data as Record<string, unknown>[]).map(opts.fromRow);
      // Cache to localStorage for offline support
      saveToLocalStorage(opts.localStorageKey, items);
      return items;
    }

    // No data in Supabase yet — return localStorage data
    return loadFromLocalStorage<T>(opts.localStorageKey, fallback);
  } catch {
    return loadFromLocalStorage<T>(opts.localStorageKey, fallback);
  }
}

/**
 * Save a single item to Supabase (upsert) with localStorage fallback.
 */
export async function saveToSupabase<T>(
  opts: SupabaseStoreOptions<T>,
  item: T,
  allItems: T[]
): Promise<void> {
  // Always save to localStorage first (immediate, offline-safe)
  saveToLocalStorage(opts.localStorageKey, allItems);

  try {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const row = opts.toRow(item, userId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic table name
    const { error } = await (supabase.from(opts.table) as any).upsert(row, { onConflict: "id" });

    if (error) {
      console.warn(`[SupabasePersistence] Error saving to ${opts.table}:`, error.message);
    }
  } catch (err) {
    console.warn(`[SupabasePersistence] Failed to sync to ${opts.table}:`, err);
  }
}

/**
 * Delete an item from Supabase with localStorage fallback.
 */
export async function deleteFromSupabase<T>(
  opts: SupabaseStoreOptions<T>,
  id: string,
  remainingItems: T[]
): Promise<void> {
  // Always update localStorage first
  saveToLocalStorage(opts.localStorageKey, remainingItems);

  try {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const { error } = await (supabase.from(opts.table) as any)
      .delete()
      .eq("id", id)
      .eq("user_id", userId); // eslint-disable-line @typescript-eslint/no-explicit-any

    if (error) {
      console.warn(`[SupabasePersistence] Error deleting from ${opts.table}:`, error.message);
    }
  } catch (err) {
    console.warn(`[SupabasePersistence] Failed to delete from ${opts.table}:`, err);
  }
}

/**
 * Bulk save all items to Supabase (replaces all user's rows).
 */
export async function bulkSaveToSupabase<T>(
  opts: SupabaseStoreOptions<T>,
  items: T[]
): Promise<void> {
  // Always save to localStorage first
  saveToLocalStorage(opts.localStorageKey, items);

  try {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const rows = items.map((item) => opts.toRow(item, userId));
    if (rows.length === 0) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic table name
    const { error } = await (supabase.from(opts.table) as any).upsert(rows, { onConflict: "id" });

    if (error) {
      console.warn(`[SupabasePersistence] Error bulk saving to ${opts.table}:`, error.message);
    }
  } catch (err) {
    console.warn(`[SupabasePersistence] Failed to bulk sync to ${opts.table}:`, err);
  }
}

// ─── localStorage helpers ───────────────────────────────────

export function loadFromLocalStorage<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T[];
  } catch {
    // corrupted storage
  }
  return fallback;
}

export function saveToLocalStorage<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    console.warn(`[SupabasePersistence] Failed to persist to localStorage key: ${key}`);
  }
}
