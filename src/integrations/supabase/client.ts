// Supabase client — edit this file as needed.
// Environment variables must be set either in .env (local dev) or in the
// DigitalOcean App Platform dashboard (production). Never commit real .env files.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

/**
 * Returns true when both Supabase environment variables are present.
 * Use this guard before calling any Supabase method so the app runs
 * safely in demo / localStorage mode when Supabase is not configured.
 *
 * @example
 * if (!isSupabaseConfigured()) return demoFallback();
 * const { data } = await supabase.from("reviews").select("*");
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
//
// Always check isSupabaseConfigured() before making requests if your
// feature has a demo/localStorage fallback.

const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_KEY = 'placeholder-key';

if (!isSupabaseConfigured()) {
  console.warn('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY — running in localStorage-only mode');
}

export const supabase = createClient<Database>(
  SUPABASE_URL || PLACEHOLDER_URL,
  SUPABASE_PUBLISHABLE_KEY || PLACEHOLDER_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
