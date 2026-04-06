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
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.placeholder';

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.warn('[Supabase] VITE_SUPABASE_URL not set — using placeholder. Auth features will not work.');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
//
// Always check isSupabaseConfigured() before making requests if your
// feature has a demo/localStorage fallback.

export const supabase = createClient<Database>(
  SUPABASE_URL ?? '',
  SUPABASE_PUBLISHABLE_KEY ?? '',
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
