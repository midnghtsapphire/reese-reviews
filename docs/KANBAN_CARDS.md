# KANBAN CARDS — Reese Reviews + GrowlingEyes Ecosystem
**Version:** 1.0.0  
**Date:** March 27, 2026  
**Format:** GitHub Project Board compatible — copy each card as an Issue  
**Standard:** Revvel EXRUP Sprint Card Format

---

## HOW TO USE THIS FILE
1. Create a GitHub Project in `midnghtsapphire/reese-reviews`
2. Add columns: **Backlog** | **This Sprint** | **In Progress** | **Review** | **Done**
3. Create GitHub Issues from each card below
4. Link issues to the Project board
5. Assign to AI agents via `@mention` in issue body

---

## 🔴 EPIC 1: PRODUCTION LAUNCH

### RR-001 — Deploy reesereviews.com to Live DNS
**Epic:** Production Launch  
**Priority:** 🔴 Critical  
**Story Points:** 3  
**Agent:** DevOps Agent (GitHub Copilot / MindMappr)

**User Story:**  
As a visitor, I want to reach reesereviews.com in my browser so that I can use the platform.

**Acceptance Criteria:**
- [ ] Domain `reesereviews.com` resolves to app
- [ ] HTTPS/SSL certificate active
- [ ] Loads in < 3 seconds (Lighthouse ≥ 85)
- [ ] 404 page works
- [ ] `/generate` route works

**Technical Notes:**
- Option A: DigitalOcean App Platform (preferred — one-click from DO dashboard)
- Option B: GitHub Pages with `public/CNAME` already set
- DO App Platform: Connect `midnghtsapphire/reese-reviews` repo → auto-build `npm run build` → serve `dist/`

**Links:** STRATEGIC_MASTER_PLAN.md §Phase 5

---

### RR-002 — Deploy All Supabase Migrations
**Epic:** Production Launch  
**Priority:** 🔴 Critical  
**Story Points:** 2  
**Agent:** DB Agent

**User Story:**  
As a user, I want my Vine items, tax data, and marketing leads to persist across sessions via Supabase.

**Acceptance Criteria:**
- [ ] `supabase/migrations/20260310_amazon_vine_tables.sql` applied
- [ ] `supabase/migrations/20260318_marketing_leads.sql` applied
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] Supabase URL + anon key in `.env` and DO App Platform env vars

**Commands:**
```bash
npx supabase db push supabase/migrations/20260310_amazon_vine_tables.sql
npx supabase db push supabase/migrations/20260318_marketing_leads.sql
```

---

### RR-003 — Schema.org JSON-LD on All Pages
**Epic:** Production Launch / SEO  
**Priority:** 🔴 Critical  
**Story Points:** 2  
**Agent:** SEO Agent

**User Story:**  
As Google, I want to understand that Reese Reviews is owned by Freedom Angel Corp (2010) so I can trust and rank it.

**Acceptance Criteria:**
- [ ] Organization JSON-LD in `index.html <head>`
- [ ] WebApplication JSON-LD in `SEOHead.tsx`
- [ ] Validated via Google Rich Results Test
- [ ] FAC EIN, founding date, affiliations all present

**Template:** See revvel-standards README.md §8 — Schema.org Implementation

---

### RR-004 — GitHub Actions: CI/CD Pipeline
**Epic:** Production Launch  
**Priority:** 🔴 Critical  
**Story Points:** 3  
**Agent:** CI/CD Agent

**User Story:**  
As a developer, I want code pushed to `main` to automatically test, build, and deploy to reesereviews.com.

**Acceptance Criteria:**
- [ ] `.github/workflows/ci.yml` — runs `npm run lint && npm run test` on every PR
- [ ] `.github/workflows/deploy.yml` — runs `npm run build` + deploys to DO App Platform on push to `main`
- [ ] Build badge added to README.md
- [ ] Failed builds block merge

**Workflow triggers:**
```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

---

### RR-005 — Privacy Policy + Terms of Service Pages
**Epic:** Production Launch / Legal  
**Priority:** 🔴 Critical  
**Story Points:** 2  
**Agent:** Legal Agent / Content Agent

**User Story:**  
As a user, I need to read the Privacy Policy and Terms of Service before signing up.

**Acceptance Criteria:**
- [ ] `/privacy` route with Privacy Policy page
- [ ] `/terms` route with Terms of Service page
- [ ] Links in footer
- [ ] GDPR-compliant data processing disclosure
- [ ] Cookie disclosure
- [ ] Amazon Associate disclosure (FTC required for affiliate links)

---

## 🟠 EPIC 2: ACCESSIBILITY COMPLIANCE

### RR-007 — Add ADHD Mode
**Epic:** Accessibility  
**Priority:** 🟠 High  
**Story Points:** 2  
**Agent:** Frontend Agent

**User Story:**  
As a neurodivergent user with ADHD, I want a simplified layout with Pomodoro timer and reduced visual noise.

**Acceptance Criteria:**
- [ ] ADHD mode toggle in AccessibilityContext
- [ ] Simplified single-column layout when active
- [ ] Pomodoro timer widget (25min work / 5min break)
- [ ] Reduced number of visible menu items
- [ ] No auto-playing animations
- [ ] Stored in localStorage

---

### RR-008 — Add Dyslexia Mode + OpenDyslexic Font
**Epic:** Accessibility  
**Priority:** 🟠 High  
**Story Points:** 2  
**Agent:** Frontend Agent

**User Story:**  
As a user with dyslexia, I want a font that makes reading easier and more comfortable.

**Acceptance Criteria:**
- [ ] OpenDyslexic or Atkinson Hyperlegible font loaded via Google Fonts / CDN
- [ ] Line height ≥ 1.9 when mode active
- [ ] Letter spacing 0.2em when mode active
- [ ] Word spacing 0.4em when mode active
- [ ] Toggle in AccessibilityToggle component
- [ ] Persists in localStorage

---

### RR-009 — No Blue Light Mode
**Epic:** Accessibility  
**Priority:** 🟠 High  
**Story Points:** 1  
**Agent:** Frontend Agent

**Acceptance Criteria:**
- [ ] Warm amber/sepia color palette swap when active
- [ ] All blues replaced with amber/gold tones
- [ ] Brightness reduced by ~20%
- [ ] Toggle in AccessibilityToggle
- [ ] CSS class `no-blue-light` applied to `<body>`

---

### RR-010 — ECO CODE Mode
**Epic:** Accessibility / Performance  
**Priority:** 🟠 High  
**Story Points:** 1  
**Agent:** Frontend Agent

**Acceptance Criteria:**
- [ ] All CSS animations disabled (`animation: none !important`)
- [ ] All `box-shadow` removed
- [ ] All `filter` / `backdrop-filter` removed
- [ ] Favicon changes to low-energy indicator
- [ ] CSS class `eco-mode` applied to `<body>`

---

## 🟠 EPIC 3: MARKETING AUTOMATION

### RR-011 — Campaign Generator (20/50/100/200/500)
**Epic:** Marketing Automation  
**Priority:** 🟠 High  
**Story Points:** 5  
**Agent:** Full-stack Agent

**User Story:**  
As Audrey, I want to click a button and have the AI generate 20/50/100/200/500 social media campaigns with my affiliate links embedded automatically.

**Acceptance Criteria:**
- [ ] 5 buttons (20/50/100/200/500) in Generate page
- [ ] Each click sends product context + affiliate tag to OpenRouter
- [ ] Returns: post text + hashtags + platform-specific formatting
- [ ] Affiliate links auto-embedded (`meetaudreyeva-20` tag)
- [ ] Campaigns displayed in scrollable list
- [ ] Copy-to-clipboard on each campaign
- [ ] Export all as CSV

**OpenRouter Model:** `deepseek/deepseek-chat` (free tier) → fallback to `mistralai/mistral-7b-instruct`

---

### RR-012 — Real Social Media Webhooks (Make.com)
**Epic:** Marketing Automation  
**Priority:** 🟠 High  
**Story Points:** 3  
**Agent:** Integration Agent

**User Story:**  
As Audrey, I want the "Auto-Post" button in Generate page to actually post to my connected social accounts.

**Acceptance Criteria:**
- [ ] Make.com webhook URL stored in AutomationSettings
- [ ] GoHighLevel API key option as alternative
- [ ] POST to webhook with: platform, content, scheduled_time
- [ ] Response handling with success/error status
- [ ] Retry logic on failure

---

### RR-015 — Affiliate Auto-Linker Utility
**Epic:** Revenue  
**Priority:** 🟠 High  
**Story Points:** 2  
**Agent:** Frontend Agent

**User Story:**  
As the system, I want any Amazon product URL or ASIN mentioned in content to automatically get the affiliate tag appended.

**Acceptance Criteria:**
- [ ] `src/utils/affiliateLinker.ts` utility
- [ ] `addAffiliateTag(url: string): string` function
- [ ] Supports: `amazon.com/dp/ASIN`, `amzn.to/xxx`, plain ASINs
- [ ] Tag: `meetaudreyeva-20`
- [ ] Applied in: ReviewEnricher, ReviewGenerator, campaign generator
- [ ] Unit tests: 8+ cases

---

## 🟡 EPIC 4: CONTENT & SEO

### RR-016 — Blog System (20+ AI-Generated Posts)
**Epic:** SEO  
**Priority:** 🟡 Medium  
**Story Points:** 8  
**Agent:** Content + LLM Agent

**Acceptance Criteria:**
- [ ] `/blog` route
- [ ] `/blog/:slug` route
- [ ] 20 AI-generated SEO posts at launch
- [ ] Categories: How-To, Tax Tips, Review Strategy, Vine Updates, Product Spotlights
- [ ] Schema.org `Article` markup on each post
- [ ] Internal linking to dashboard features
- [ ] RSS feed at `/blog/feed.xml`
- [ ] Posts stored in Supabase or static JSON

---

### RR-017 — FAQ Page (50+ Questions)
**Epic:** SEO  
**Priority:** 🟡 Medium  
**Story Points:** 5  
**Agent:** Content + SEO Agent

**Acceptance Criteria:**
- [ ] `/faq` route
- [ ] 50+ questions in categories: Getting Started, Tax, Vine Program, Features, Legal
- [ ] FAQPage schema markup (Google rich snippets)
- [ ] Searchable/filterable
- [ ] Accordion UI (already have shadcn Accordion)

---

### RR-014 — Sitemap.xml Auto-Generation
**Epic:** SEO  
**Priority:** 🟠 High  
**Story Points:** 1  
**Agent:** DevOps Agent

**Acceptance Criteria:**
- [ ] `public/sitemap.xml` generated at build time
- [ ] All static routes included
- [ ] Blog post URLs included (dynamic)
- [ ] Updated on every deploy

**Implementation:** `vite-plugin-sitemap` or custom build script

---

## 🟡 EPIC 5: INTEGRATIONS

### RR-019 — Plaid Live Bank Connection
**Epic:** Integrations  
**Priority:** 🟡 Medium  
**Story Points:** 5  
**Agent:** Integration Agent

**Acceptance Criteria:**
- [ ] Plaid Link token flow working
- [ ] Transaction sync to Supabase
- [ ] Auto-categorization via `categoryRules.ts`
- [ ] Display in Financial Dashboard
- [ ] Plaid credentials stored in DO env vars (never in code)

---

### RR-020 — HeyGen + ElevenLabs Live Test
**Epic:** Integrations  
**Priority:** 🟡 Medium  
**Story Points:** 3  
**Agent:** Media Agent

**Acceptance Criteria:**
- [ ] HeyGen API key configurable in AutomationSettings
- [ ] ElevenLabs API key configurable
- [ ] Test video generated for a sample Vine product
- [ ] Both Reese + Revvel avatar tested
- [ ] Error handling if API limit hit

---

## 🟢 EPIC 6: GROWLINGEYES

### GE-001 — GrowlingEyes Repo + Landing Page
**Epic:** GrowlingEyes  
**Priority:** 🟢 Future  
**Story Points:** 5  
**Agent:** DevOps + Frontend Agent

**Acceptance Criteria:**
- [ ] `MIDNGHTSAPPHIRE/growlingeyes` repo created
- [ ] Stack: Vite + React + TypeScript (same as reese-reviews)
- [ ] Dark glassmorphism theme (midnight black + claw crimson)
- [ ] Hero section: "Eyes on the Internet. Always."
- [ ] Feature list: Telegram monitor, Discord monitor, GitHub trending
- [ ] Email signup (connects to master list)
- [ ] Schema.org markup
- [ ] Deployed to `growlingeyes.com`

---

### GE-002 — Telegram Stream Monitor Microservice
**Epic:** GrowlingEyes  
**Priority:** 🟢 Future  
**Story Points:** 8  
**Agent:** Data Agent

**Tech Stack:**
```python
# Python microservice
telethon==1.36.0     # Telegram client
redis==5.0.3         # Message queue
fastapi==0.111.0     # WebSocket API
supabase-py==2.5.0   # Storage
```

**Acceptance Criteria:**
- [ ] Monitors 5+ Telegram channels (FOSS Post, It's FOSS, Foss Finds, etc.)
- [ ] NLP classifier tags each message (product | tool | news | spam)
- [ ] High-score items pushed to Supabase + WebSocket
- [ ] Alerts via @googlieeyes_bot in RISINGALOHA group
- [ ] Runs on existing DO droplet (164.90.148.7) as systemd service
- [ ] Cron: every 4 hours

---

### GE-003 — Wildberries Product Stream Integration
**Epic:** GrowlingEyes  
**Priority:** 🟢 Future  
**Story Points:** 5  
**Agent:** Data Agent

**Notes:**
- Wildberries (Russia) has a 100% public REST API
- No authentication required for product catalog
- 300M+ SKUs — massive untapped data source
- API: `https://catalog.wb.ru/catalog/{category}/v2/catalog`

**Acceptance Criteria:**
- [ ] Fetch trending products by category from Wildberries
- [ ] Map to standard ProductStream schema
- [ ] Detect items that may be Amazon-crosslistable
- [ ] Display in GrowlingEyes "Global Streams" panel

---

## 🔵 EPIC 7: INNOVATION (Research Phase)

### INV-001 — Provisional Patent: Vine ETV Tax Module
**Epic:** IP Protection  
**Priority:** 🔵 Innovation  
**Story Points:** 5  
**Agent:** Legal Research Agent

**Notes:**
- File as provisional patent application (PPA) with USPTO
- 12-month protection window
- Cost: ~$800 DIY (micro-entity discount available for individuals)
- Covers: Method of calculating ETV-based tax liability for Amazon Vine Voices

---

### INV-002 — FOSS Stream Scoring Algorithm
**Epic:** IP Protection  
**Priority:** 🔵 Innovation  
**Story Points:** 5  
**Agent:** Legal Research Agent

**Notes:**
- Time-decay × uniqueness × relevance × source authority formula
- No prior art found in USPTO/Google Patents
- File as method patent + software patent

---

### INV-003 — Reviewer Reputation Score System
**Epic:** Innovation  
**Priority:** 🔵 Innovation  
**Story Points:** 13  
**Agent:** Full-stack Agent

**Concept:**
- Public score for Amazon Vine Voices based on:
  - Review count × category depth × quality signals × time consistency
- Like a credit score but for reviewer credibility
- Used as trust signal in ReviewChain marketplace

---

### INV-004 — ReviewChain Federated Marketplace Prototype
**Epic:** Innovation  
**Priority:** 🔵 Innovation  
**Story Points:** 40  
**Agent:** Architecture Agent

**Concept:**
- Federated network of reviewers sharing product intelligence
- Cross-country review aggregation (Amazon US + JP + UK + Wildberries + Shopee)
- Marketplace: Reviewers sell curated product lists to brands
- Revenue: 10% commission on marketplace transactions

---

*End of KANBAN_CARDS.md*  
*Generated: March 27, 2026 — EXRUP Sprint 1 Planning*
