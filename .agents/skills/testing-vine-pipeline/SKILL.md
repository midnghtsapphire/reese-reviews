# Testing Vine Review Pipeline

## Overview
Reese Reviews is a React 18 + Vite + TypeScript app for Amazon Vine review automation. The Vine pipeline allows adding products, scraping images from multiple sources, generating AI reviews, and managing review workflow.

## Devin Secrets Needed
- `HEYGEN_DEVELOPER_API_KEY` — for real HeyGen video generation testing
- `HEYGEN_AGENT_API_KEY` — for interactive avatar features
- Fallback password: Set via `VITE_FALLBACK_PASSWORD` env var (used when Supabase auth is not connected)

## Dev Server
# Testing the Vine Review Pipeline

## Overview
The Vine Review Auto-Generator is at `/vine`. It manages Amazon Vine product reviews with 5 automation modes, AI-generated content, and product image scraping from multiple sources.

## Environment Setup

### Dev Server
```bash
cd /home/ubuntu/repos/reese-reviews
npm run dev -- --port 8081
```
The app runs at `http://localhost:8081`. In demo/offline mode (no Supabase or API keys), the app generates realistic placeholder data.

## Authentication
- The app uses Supabase auth with a fallback password system
- When Supabase is not connected, use the "Use access password" button on the login page
- The fallback password is set via `VITE_FALLBACK_PASSWORD` in `.env`
- **Important:** If you clear `localStorage` (e.g., `localStorage.clear()`), auth tokens are also cleared and you must re-authenticate
- Auth tokens are stored in `reese-reviews-auth` and `reese-reviews-auth-ts` in localStorage
- To bypass login programmatically:
  ```javascript
  localStorage.setItem('reese-reviews-auth', 'true');
  localStorage.setItem('reese-reviews-auth-ts', String(Date.now()));
  window.location.href = 'http://localhost:8081/vine';
  ```

## Key Data Storage
- All Vine item data is stored in localStorage under key `vine-review-items` (NOT `vine-items`)
- Data includes: item metadata, scrapedImages (with casualName fields), generated reviews, photo uploads
- The app uses a "local-first" pattern: writes to localStorage immediately, tries Supabase sync in background

## Testing the Vine Pipeline

### Navigation
- Vine AI page: Click "Vine AI" in top nav or navigate to `/vine`
- The page has tabs: Review Queue, Generated, Avatars, Video Preview

### Adding Items
1. Click "+ Add Item" button (top right)
2. Paste Amazon URL — ASIN auto-extracts from the URL
3. Fill in Product Name (required), Category, Automation Mode, ETV, dates
4. Click "+ Add Item" to submit

### Automation Modes
- **Full Auto** — generates review + video + scrapes photos + rating
- **Video Only** — generates video script + HeyGen video only
- **Photos Only** — scrapes images from Amazon/Walmart/Target only
- **Review Only** — AI generates review text + rating, you supply media
- **Manual** — no auto-generation, just tracking and organization
- Manual mode cards have NO generate or scrape buttons (only delete)

### Image Scraping
- Click "Scrape Images" button on an item card (appears for items with an ASIN)
- In demo mode, generates placeholder images from 6 sources: Amazon Listing, Amazon UK/DE/JP Review, Walmart Review, Target Review
- After scraping, source badges appear on the card
- The "Scrape Images" button disappears after successful scraping

### Verifying Casual Filenames
Casual filenames are stored as `casualName` on each `ScrapedImage` object in localStorage. They are NOT displayed in the UI — you must inspect localStorage:
```javascript
// Get the scraped images data
JSON.stringify(JSON.parse(localStorage.getItem('vine-review-items'))[0].scrapedImages).substring(0, 500)
```
Expected patterns: `IMG_YYYYMMDD_HHMMSS.jpg`, `photo_N.jpg`, `imageN.jpg`, `PXL_YYYYMMDD_HHMMSS.jpg`

The patterns rotate via `index % 4`, so you should see a mix of all 4 styles.

### Verifying Data Persistence
Reload the page after making changes. Items, reviews, scraped images, and photo uploads should all survive page reload via localStorage.

## Common Issues
- **Console tool limitations:** Complex chained JavaScript may return `undefined` in the browser console tool. Use `.substring()` on stringified JSON to read large data in chunks.
- **Password typing issues:** The `#` character in passwords might not type correctly via computer tool. Use the programmatic auth bypass above instead.
- **Clearing data:** To start fresh, remove only `vine-review-items` from localStorage (not all of localStorage, which clears auth too).

## CI Checks
The repo runs 7+ GitHub Actions checks: ESLint, TypeScript Type Check, Vitest Tests, Vite Production Build, Dependency Audit, GitGuardian Security, TypeDoc API Docs. All should pass before merging.
The app runs at `http://localhost:8081`.

### Authentication
- Fallback password: Set via `VITE_FALLBACK_PASSWORD` env var (used when Supabase auth is not connected)
- Login page is at `/` — enter the password and click Login

### Demo Mode
The app runs in **demo mode** when environment variables are not set:
- No `VITE_OPENROUTER_API_KEY` → review text generation returns realistic placeholder content
- No `VITE_SCRAPER_PROXY_URL` → image scraper returns demo data with source badges
- Supabase uses `localhost:0` placeholder → all data stored in localStorage only

Demo mode is sufficient for testing UI flows, automation modes, and data persistence.

## Devin Secrets Needed
- `HEYGEN_DEVELOPER_API_KEY` — for real video generation testing (saved org-wide)
- `HEYGEN_AGENT_API_KEY` — for interactive avatar features (saved org-wide)
- `VITE_OPENROUTER_API_KEY` — for real AI review text generation (not yet saved)
- Supabase URL + anon key — for cloud data persistence testing (not yet saved)

## Key Testing Flows

### 1. Add Item with ASIN Extraction
1. Navigate to `/vine`
2. Click "+ Add Item"
3. Paste an Amazon URL (e.g., `https://www.amazon.com/dp/B0D1XD1ZV3`)
4. Verify ASIN badge appears automatically above the URL field
5. Enter product name and submit

### 2. Automation Mode Testing
There are 5 modes — each changes button labels and behavior:

| Mode | Button Label | What It Does |
|---|---|---|
| Full Auto | "Generate All" | Review text + video + photos + rating |
| Video Only | "Generate Video" | Just video script/generation |
| Photos Only | "Scrape Photos" | Just image scraping |
| Review Only | "Generate Review" | Just text + rating |
| Manual | (no button) | Tracking only, no automation |

**Important:** The "Default Automation Mode" dropdown at the top syncs to the form's Automation Mode field when adding new items (Bug 6 fix). Always verify this sync when testing.

### 3. Image Scraping (Demo Mode)
- Click the mode-specific button (e.g., "Scrape Photos") or the standalone "Scrape Images" button
- Demo mode returns 17 images from 6 sources: Amazon Listing, Amazon UK/DE/JP Review, Walmart Review, Target Review
- Source badges appear on the item card after scraping
- The "Scrape Images" standalone button disappears after successful scraping

### 4. Data Persistence
- All data persists in localStorage
- Reload the page and verify items, mode badges, source badges, and review text survive
- This is the primary persistence mechanism when Supabase is not connected

### 5. Bulk Generate
- "Generate All Pending" button processes all non-manual pending items
- Manual items are explicitly filtered out (Bug 3 fix)
- Expect OpenRouter API error if no API key is set — this is normal in demo mode

## Known Quirks & Gotchas

1. **Manual mode hides ALL buttons** — including the standalone "Scrape Images" button. This is because the Scrape Images button is nested inside the `automationMode !== 'manual'` condition in VineItemCard. This may be intentional or a design oversight.

2. **Notification banner persists** — Success/error notifications stay visible until manually dismissed (X button). After reload, they clear automatically.

3. **Generated tab** — Items move to the "Generated" tab after generation. Check both "Review Queue" and "Generated" tabs when verifying state.

4. **ASIN field** — Can be auto-filled from URL or entered manually. The ASIN badge appears in real-time as you type.

5. **Browser tabs** — Opening a new tab to the same URL shares localStorage, so data is consistent. Use this for reload testing.

6. **EXIF stripping** — Photos uploaded through the UI have EXIF metadata stripped via Canvas API redraw. The stripped photos use `data:image/` URLs (not `blob:` URLs) so they persist across page reloads.

7. **Image/video naming** — User wants scraped image filenames and generated videos to have casual, phone-style names (e.g., `IMG_20260425_143022.jpg`) rather than formal names that look automated.

## Testing Tips

- Always test with the browser UI, not curl — auth and state management are complex
- The app uses Zustand stores with localStorage persistence — check browser DevTools → Application → Local Storage to inspect raw data
- When testing mode-specific behavior, change the "Default Automation Mode" FIRST, then add an item — the form inherits the default
- Source badges only appear after scraping, not on initial item creation
- The "Scrape Images" button only appears when an item has an ASIN and hasn't been scraped yet
