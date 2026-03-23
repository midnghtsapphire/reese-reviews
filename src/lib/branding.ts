/**
 * Reese-Reviews — Centralized Brand Constants
 *
 * Steel / neutral palette.  All UI components should reference these values
 * (or their corresponding CSS custom-property names) instead of hard-coding
 * colour literals.
 */

export const BRAND_NAME = "Reese-Reviews";

/** Tailwind/CSS slate-50  (#f8fafc) — light surface, text-on-dark */
export const COLOR_LIGHT = "slate-50";

/** Tailwind/CSS slate-600  (#475569) — mid-tone, borders, accents */
export const COLOR_MID = "slate-600";

/** Tailwind/CSS slate-900  (#0f172a) — primary dark background */
export const COLOR_DARK = "slate-900";

export const PALETTE = {
  light: COLOR_LIGHT,
  mid: COLOR_MID,
  dark: COLOR_DARK,
} as const;

/** CSS custom-property names that map to the steel palette in index.css */
export const CSS_VARS = {
  background: "--background",
  foreground: "--foreground",
  steelShine: "--steel-shine",
  steelMid: "--steel-mid",
  steelDark: "--steel-dark",
} as const;

/** Social platform identifiers used by the content generator */
export const SOCIAL_PLATFORMS = [
  { id: "facebook",  label: "Facebook",  icon: "facebook" },
  { id: "linkedin",  label: "LinkedIn",  icon: "linkedin" },
  { id: "instagram", label: "Instagram", icon: "instagram" },
  { id: "tiktok",    label: "TikTok",    icon: "tiktok" },
] as const;

export type SocialPlatformId = typeof SOCIAL_PLATFORMS[number]["id"];
