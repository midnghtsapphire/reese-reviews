// ============================================================
// STRIPE CLIENT
// Reese Reviews — Subscription checkout and subscription state
//
// Architecture:
//   • Uses @stripe/stripe-js to redirect to Stripe Checkout
//   • Stripe Checkout requires a server-side session ID in
//     production; for this app we use pre-configured Payment
//     Link URLs per tier (set via environment variables).
//   • In demo mode (keys not set), returns descriptive errors
//     so the UI can show a helpful message instead of crashing.
//   • Subscription tier is persisted in localStorage and
//     synced to Supabase user_profiles.preferences.
//
// Environment variables (set in .env / DigitalOcean):
//   VITE_STRIPE_PUBLISHABLE_KEY  — your pk_live_* or pk_test_* key
//   VITE_STRIPE_LINK_PRO         — Stripe Payment Link URL for Pro tier
//   VITE_STRIPE_LINK_BUSINESS    — Stripe Payment Link URL for Business tier
// ============================================================

import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "./supabasePersistence";

// ─── CONSTANTS ───────────────────────────────────────────────

const SK_SUBSCRIPTION = "reese-subscription";

// ─── TYPES ───────────────────────────────────────────────────

export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing" | "none";

export interface SubscriptionState {
  tier: "free" | "pro" | "business";
  status: SubscriptionStatus;
  /** Stripe subscription ID if available */
  stripeSubscriptionId?: string;
  /** ISO date of current period end */
  currentPeriodEnd?: string;
  /** When the record was last updated */
  updatedAt: string;
}

// ─── STRIPE INSTANCE ─────────────────────────────────────────

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Lazily load the Stripe.js singleton.
 * Returns `null` in demo mode (publishable key not configured).
 */
export function getStripe(): Promise<Stripe | null> {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
  if (!key || key.startsWith("pk_live_your") || key.startsWith("pk_test_your")) {
    return Promise.resolve(null);
  }
  if (!stripePromise) {
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

/** Whether Stripe is configured with real keys (not demo placeholders). */
export function isStripeConfigured(): boolean {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
  return Boolean(key && !key.startsWith("pk_live_your") && !key.startsWith("pk_test_your"));
}

// ─── PAYMENT LINK REDIRECT ───────────────────────────────────

/**
 * Redirect the browser to the Stripe-hosted Checkout / Payment Link
 * for the given subscription tier.
 *
 * In production: set VITE_STRIPE_LINK_PRO / VITE_STRIPE_LINK_BUSINESS
 * to your Stripe Payment Link URLs (https://buy.stripe.com/...).
 *
 * @param tierId   - "pro" | "business"
 * @param successPath - path to redirect to on success (default "/payments?success=true")
 * @param cancelPath  - path to redirect to on cancel  (default "/payments?canceled=true")
 * @returns "redirect" if redirecting, "demo" if in demo mode, "error" on failure
 */
export async function redirectToCheckout(
  tierId: "pro" | "business",
  successPath: string = "/payments?success=true",
  cancelPath: string = "/payments?canceled=true"
): Promise<"redirect" | "demo" | "error"> {
  // ── Demo mode ──────────────────────────────────────────────
  if (!isStripeConfigured()) {
    return "demo";
  }

  // ── Payment Link mode (recommended for frontend-only apps) ─
  const linkEnvKey =
    tierId === "pro"
      ? (import.meta.env.VITE_STRIPE_LINK_PRO as string | undefined)
      : (import.meta.env.VITE_STRIPE_LINK_BUSINESS as string | undefined);

  if (linkEnvKey && linkEnvKey.startsWith("https://")) {
    const origin = window.location.origin;
    const url = new URL(linkEnvKey);
    url.searchParams.set("success_url", `${origin}${successPath}`);
    url.searchParams.set("cancel_url", `${origin}${cancelPath}`);
    window.location.href = url.toString();
    return "redirect";
  }

  // ── Stripe.js redirectToCheckout (needs a server session ID) ─
  // In a full-stack setup, call your backend here to create a
  // Checkout Session and get back a sessionId, then redirect.
  // For now, surface a descriptive error so the UI can prompt
  // the developer to set VITE_STRIPE_LINK_PRO / VITE_STRIPE_LINK_BUSINESS.
  console.warn(
    `[StripeClient] VITE_STRIPE_LINK_${tierId.toUpperCase()} is not set. ` +
    "Create a Stripe Payment Link and set this env var, or add a server-side " +
    "/api/stripe/create-checkout-session endpoint."
  );
  return "error";
}

// ─── SUBSCRIPTION STATE ──────────────────────────────────────

/** Return the default (free) subscription state. */
function defaultState(): SubscriptionState {
  return {
    tier: "free",
    status: "none",
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Load the user's current subscription state from localStorage.
 */
export function getSubscriptionState(): SubscriptionState {
  try {
    const raw = localStorage.getItem(SK_SUBSCRIPTION);
    return raw ? (JSON.parse(raw) as SubscriptionState) : defaultState();
  } catch {
    return defaultState();
  }
}

/**
 * Persist subscription state to localStorage and (async) to
 * Supabase `user_profiles.preferences.subscription`.
 */
export function saveSubscriptionState(state: SubscriptionState): void {
  const updated = { ...state, updatedAt: new Date().toISOString() };
  localStorage.setItem(SK_SUBSCRIPTION, JSON.stringify(updated));
  void _syncSubscriptionToSupabase(updated);
}

async function _syncSubscriptionToSupabase(state: SubscriptionState): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return;

    // Store in user_profiles.preferences JSONB column
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic table
    const { error } = await (supabase.from("user_profiles") as any).upsert(
      {
        user_id: userId,
        preferences: { subscription: state },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (error) {
      console.warn("[StripeClient] Failed to sync subscription to Supabase:", error.message);
    }
  } catch (err) {
    console.warn("[StripeClient] Supabase subscription sync error:", err);
  }
}

/**
 * Handle the Stripe Checkout return URL.
 * Call this when the page loads and `?success=true` or `?canceled=true`
 * is present in the URL.
 *
 * @returns "success" | "canceled" | null
 */
export function handleCheckoutReturn(): "success" | "canceled" | null {
  const params = new URLSearchParams(window.location.search);
  if (params.get("success") === "true") return "success";
  if (params.get("canceled") === "true") return "canceled";
  return null;
}

/**
 * Mark a tier as active after a successful checkout.
 * In production this should be driven by a Stripe webhook,
 * but this client-side update provides immediate UI feedback.
 */
export function activateTier(tier: "pro" | "business"): void {
  saveSubscriptionState({
    tier,
    status: "active",
    updatedAt: new Date().toISOString(),
  });
}
