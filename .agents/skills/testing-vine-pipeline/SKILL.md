# Testing Vine Review Pipeline

## Overview
Reese Reviews is a React 18 + Vite + TypeScript app for Amazon Vine review automation. The Vine pipeline allows adding products, scraping images from multiple sources, generating AI reviews, and managing review workflow.

## Devin Secrets Needed
- `HEYGEN_DEVELOPER_API_KEY` — for real HeyGen video generation testing
- `HEYGEN_AGENT_API_KEY` — for interactive avatar features
- Fallback password: Set via `VITE_FALLBACK_PASSWORD` env var (used when Supabase auth is not connected)

## Dev Server
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
