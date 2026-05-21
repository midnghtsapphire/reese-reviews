# Brand Guidelines — Reese Reviews

**Standard:** revvel-standards/BRAND_GUIDELINES.md  
**Project:** Reese Reviews (reesereviews.com)  
**Owner:** Audrey Evans / MIDNGHTSAPPHIRE  
**Last Updated:** May 2026

---

## Table of Contents

1. [Brand Identity](#1-brand-identity)
2. [Color Palette](#2-color-palette)
3. [Typography](#3-typography)
4. [Voice & Tone](#4-voice--tone)
5. [Logo Usage](#5-logo-usage)
6. [UI Component Standards](#6-ui-component-standards)
7. [Accessibility](#7-accessibility)
8. [Do and Don't](#8-do-and-dont)

---

## 1. Brand Identity

### Brand Name

**Reese Reviews** — always two words, always capitalized. Never "ReeseReviews", "reese-reviews", or "reese reviews" in public-facing content.

### Brand Persona

Reese Reviews uses a named persona — **Reese** — as the face of the platform. The associated reviewer persona for content generation is **Caresse**. Both personas are:

- **Authoritative but approachable** — expert-level knowledge, conversational delivery
- **Transparent** — FTC disclosures are built into every AI-generated review by default
- **Neurodivergent-friendly** — the platform offers a dedicated Neurodivergent accessibility mode

### Mission Statement

> Empowering Amazon Vine reviewers to create high-quality, FTC-compliant content — and manage every aspect of their review business — in less time, with less stress.

### Tagline

> "Review smarter. Earn honestly."

---

## 2. Color Palette

All UI components **must** reference CSS custom properties or the `BRAND_*` constants from `src/lib/branding.ts`. **Never hard-code hex or HSL color literals** in component code.

### Primary Steel/Neutral Palette (Light Mode)

| Token | CSS Variable | HSL Value | Tailwind Class | Use |
| :--- | :--- | :--- | :--- | :--- |
| Steel Shine | `--steel-shine` | `220 15% 82%` | `steel-shine` | Light surface highlight, subtle accents |
| Steel Mid | `--steel-mid` | `220 10% 52%` | `steel-mid` | Borders, secondary text, dividers |
| Steel Dark | `--steel-dark` | `220 16% 18%` | `steel-dark` | Primary surface, sidebar background |
| Pearl | `--pearl` | `30 20% 92%` | `pearl` | Warm white for text on dark backgrounds |
| Chrome | `--chrome` | `220 8% 70%` | `chrome` | Inactive states, disabled UI elements |

### Page Background Gradient

The site background uses the logo backdrop gradient to create a unified cinematic look:

```css
/* Logo-matched gradient: deep navy → dark navy → dark blue */
background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
```

Applied via the `gradient-dark-surface` CSS class defined in `src/index.css`.

### ECO Mode / Warm Palette (ECO accessibility mode)

| Token | CSS Variable | HSL Value | Use |
| :--- | :--- | :--- | :--- |
| Steel Shine (eco) | `--steel-shine` | `35 40% 70%` | Warm amber highlights |
| Steel Mid (eco) | `--steel-mid` | `35 30% 45%` | Warm mid-tone |
| Steel Dark (eco) | `--steel-dark` | `30 25% 15%` | Dark warm background |

### Semantic Colors

| Purpose | Token | Class |
| :--- | :--- | :--- |
| Success | `--success` | `text-success`, `bg-success` |
| Warning | `--warning` | `text-warning`, `bg-warning` |
| Danger/Error | `--danger` | `text-danger`, `bg-danger` |
| Primary action | `--primary` | `bg-primary`, `text-primary` |
| Muted/Secondary | `--muted` | `bg-muted`, `text-muted-foreground` |

### ❌ Banned Colors

The following color values **must never appear** in component code:
- `purple-*` (Tailwind purple scale)
- `slate-700`, `slate-800` (hard-coded slate, use `bg-muted` or `glass-card` instead)
- Any raw hex `#` or `rgb()` color literals (use CSS vars or Tailwind tokens)

---

## 3. Typography

### Font Stack

| Category | Font | Fallback | Use |
| :--- | :--- | :--- | :--- |
| **Display / Headings** | Playfair Display | serif | Page titles, section headers, hero text |
| **Body / UI** | Inter | sans-serif | Body copy, labels, buttons, UI text |

Applied via `tailwind.config.ts`:
```js
fontFamily: {
  serif: ['Playfair Display', 'serif'],   // font-serif
  sans: ['Inter', 'sans-serif'],           // font-sans (default)
}
```

### Type Scale

| Level | Tailwind | Use |
| :--- | :--- | :--- |
| Page title | `text-4xl font-serif font-bold` | Main page headings (H1) |
| Section header | `text-2xl font-serif font-semibold` | Section titles (H2) |
| Card title | `text-lg font-semibold` | Card headings, widget titles |
| Body | `text-base` | Default body copy |
| Caption / helper | `text-sm text-muted-foreground` | Helper text, meta, timestamps |
| Micro | `text-xs` | Badges, tags, fine print |

---

## 4. Voice & Tone

### Adjectives That Describe Our Voice
- **Clear** — no jargon unless necessary; define terms on first use
- **Confident** — we know what we're talking about; no hedging
- **Warm** — this platform was built by a reviewer for reviewers; we get it
- **Practical** — every feature solves a real problem; we don't add fluff

### Tone by Context

| Context | Tone | Example |
| :--- | :--- | :--- |
| Onboarding | Encouraging, brief | "You're in! Let's import your first Vine item." |
| Error messages | Calm, actionable | "Couldn't connect to Supabase — check your internet connection and try again." |
| Tax dashboard | Professional, precise | "Your estimated 2026 Vine income: $12,480 (ETV). Schedule C deduction estimate: $3,200." |
| Success states | Celebratory but efficient | "Review published to YouTube ✓" |
| Empty states | Helpful, inviting action | "No Vine items yet. Import your order CSV to get started." |

### Review Content Voice (AI-generated reviews)

AI-generated review text is written in first person as the **Caresse** persona:
- Honest and specific (product features, use cases observed)
- Conversational but not casual
- Always includes FTC disclosure: *"I received this product as part of the Amazon Vine program in exchange for my honest review."*
- Pros/cons format for transparency; never purely promotional

---

## 5. Logo Usage

### Primary Logo

Located at `src/assets/reese-logo.png`. The logo features a dark cinematic backdrop (#0f0f1a gradient) which is why the page background matches it.

### Usage Rules

- **Minimum size:** 32×32px (inline), 128×128px (standalone)
- **Clear space:** Minimum 1× logo height on all sides
- **On light backgrounds:** Use with a dark container/card (`steel-dark` background)
- **On dark backgrounds:** Use directly — the logo is designed for dark mode first

### Don'ts

- Do not recolor the logo
- Do not stretch or distort
- Do not place on busy photographic backgrounds without a backing card
- Do not add drop shadows, gradients, or effects

---

## 6. UI Component Standards

### Card Style

Use the `glass-card` CSS class for all primary content cards. This applies the glassmorphism effect consistent with the brand aesthetic:

```html
<div class="glass-card rounded-xl p-6">
  <!-- content -->
</div>
```

### Buttons

| Variant | Use |
| :--- | :--- |
| `default` (primary) | Primary CTA actions |
| `secondary` | Secondary/alternative actions |
| `outline` | Tertiary/less-important actions |
| `ghost` | Icon-only buttons, nav items |
| `destructive` | Delete, remove, danger actions |

### Status Badges

Review status badges use semantic colors from `src/stores/vineReviewStore.ts`:

| Status | Badge Color |
| :--- | :--- |
| `pending` | `bg-muted` |
| `generating` | `bg-warning` |
| `generated` | `bg-success` |
| `edited` | `bg-primary` |
| `submitted` | `bg-success` (outline) |
| `overdue` | `bg-destructive` |

### Icons

Use `lucide-react` exclusively for UI icons. No mixing of icon libraries. Icon size: `h-4 w-4` (default), `h-5 w-5` (emphasized), `h-6 w-6` (standalone).

---

## 7. Accessibility

### Accessibility Modes

The platform supports three accessibility modes via `src/components/AccessibilityToggle.tsx`:

1. **Standard** — Default steel/neutral palette
2. **Neurodivergent Mode** — Increased contrast, reduced animation, larger touch targets (ADHD/dyslexia-friendly)
3. **ECO Mode** — Warm amber palette, reduced blue light

### WCAG 2.1 AA Requirements

All UI must meet WCAG 2.1 AA:
- **Contrast:** Minimum 4.5:1 for body text, 3:1 for large text
- **Focus indicators:** Visible keyboard focus on all interactive elements
- **Alt text:** All `<img>` elements have descriptive `alt` attributes
- **Form labels:** All inputs have associated `<label>` elements
- **ARIA:** Use ARIA roles/labels for custom interactive components

### Motion

- Respect `prefers-reduced-motion` media query; disable animations in Neurodivergent mode
- Framer Motion animations should have a `duration` ≤300ms for UI transitions

---

## 8. Do and Don't

### Writing

| ✅ Do | ❌ Don't |
| :--- | :--- |
| "Sign in" | "Login" (use "Sign in" throughout) |
| "Vine item" | "Amazon listing" (be specific) |
| "AI-generated review" | "Bot-written content" |
| "ETV (Estimated Tax Value)" | "free product value" (imprecise) |
| "Published to YouTube" | "Uploaded" (consistent verb) |

### Code

| ✅ Do | ❌ Don't |
| :--- | :--- |
| `className="bg-muted border steel-border"` | `className="bg-slate-800 border-purple-500"` |
| `import { COLOR_DARK } from "@/lib/branding"` | Hardcode `"#0f172a"` anywhere |
| Use `glass-card` class for content cards | Create one-off background color classes |
| Reference `--steel-shine` CSS var | Use `hsl(220 15% 82%)` directly |

---

*This document is maintained per revvel-standards/BRAND_GUIDELINES.md requirements. Update whenever palette or typography changes are made.*
