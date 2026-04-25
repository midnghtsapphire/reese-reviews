# Testing the Vine Review Pipeline

## Overview
The Vine Review Auto-Generator is at `/vine`. It manages Amazon Vine product reviews with 5 automation modes, AI-generated content, and product image scraping from multiple sources.

## Environment Setup

### Dev Server
```bash
cd /home/ubuntu/repos/reese-reviews
npm run dev -- --port 8081
```
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
