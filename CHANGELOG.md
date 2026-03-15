# Changelog

All notable changes to Reese Reviews are documented in this file.

## [2.1.0] — 2026-03-03 — AMAZON REVIEWS INTEGRATION

### ✨ New Features

#### Amazon Reviews Integration (`feature/amazon-integration`)
- ✅ **AmazonDashboard component** — new 🛒 Amazon tab in Business Dashboard
  - Connection tab: demo / HTML paste / cookie import modes
  - Reviews tab: list imported reviews with Copy, Create Draft, Publish, and Open on Amazon actions
  - Affiliate Links tab: ASIN → affiliate URL generator with quick links for all imported reviews
- ✅ **`src/lib/amazonReviewStore.ts`** — store module for import, persist, publish, and affiliate helpers
- ✅ **`src/api/amazon/index.ts`** — client-side API layer simulating `GET /api/amazon/demo`, `POST /api/amazon/import`, `POST /api/amazon/publish`
- ✅ **`src/lib/data/amazon-reviews.json`** — committed demo review data
- ✅ **Demo mode** — active by default when no `AMAZON_SESSION_COOKIE` is set
- ✅ **HTML import** — client-side DOMParser extracts reviews from pasted Amazon page source
- ✅ **Cookie mode** — documented server-side scraper path (falls back to demo in SPA)
- ✅ **Anonymisation** — reviewer handles are never stored or displayed
- ✅ **Affiliate links** — `buildAffiliateLink(asin, tag)` with `VITE_AFFILIATE_TAG` env override
- ✅ **Unit tests** — `src/lib/amazonReviewStore.test.ts` (Vitest)
- ✅ **`.env.example`** — documents `AMAZON_SESSION_COOKIE` and `VITE_AFFILIATE_TAG`
- ✅ **`docs/amazon-integration.md`** — full setup guide (demo, HTML, cookie, DigitalOcean/GitHub secrets, privacy)

---

## [2.0.0] — 2024-02-25 — PRODUCTION LAUNCH

### ✨ Major Features Added

#### Review Platform
- ✅ Complete review submission system with photo uploads and star ratings
- ✅ Review browsing by 5 categories (Products, Food, Services, Entertainment, Tech)
- ✅ Search and filter functionality
- ✅ Featured/trending reviews section
- ✅ Individual review detail pages with schema markup

#### Amazon Vine & Tax Tracking (HIGHEST PRIORITY)
- ✅ **Native Vine scraper** — no Chrome extension required
- ✅ **ETV (Estimated Tax Value) tracking** — IRS-compliant income reporting
- ✅ **Tax Dashboard** with:
  - Annual, quarterly, and monthly ETV reports
  - 1099-NEC reconciliation
  - Capital gains/losses calculations
  - Donation tracking with FMV (Fair Market Value)
  - Tax-ready CSV/PDF exports for accountant
- ✅ Vine queue tracking (potluck, additional items, last chance)
- ✅ Review deadline tracking and notifications
- ✅ Cookie-based session management for Vine scraping

#### Inventory Management
- ✅ Product tracking (purchased + Vine)
- ✅ Status pipeline (In Use → Reviewed → Ready to Resell → Donated)
- ✅ Cost basis tracking
- ✅ Capital gains/losses calculations
- ✅ 6-month donation cycle tracking
- ✅ Tax deduction calculations

#### Affiliate Marketing Automation Engine
- ✅ **6 Affiliate Links** with tracking:
  - Make.com (20% recurring)
  - GoHighLevel (40% recurring)
  - VideoGen (30% recurring)
  - Chime ($50 per signup)
  - DigitalOcean ($25 credit + $25)
  - Monday.com (20% recurring)
- ✅ **Campaign Generator** (OpenRouter LLM):
  - 20/50/100/200/500 post tier buttons
  - Platform-specific formatting for 6 platforms
  - Auto-embed affiliate links naturally
  - Unique variations per post
  - Tone selection (professional, casual, fun, urgent, educational)
- ✅ **Make.com Webhook Integration** for auto-posting
- ✅ Campaign analytics and click tracking
- ✅ Affiliate link performance dashboard

#### Email Collection & Newsletter System
- ✅ Subscribe forms (footer, popup, sidebar, page placements)
- ✅ Double opt-in with confirmation email
- ✅ GDPR/CAN-SPAM compliance
- ✅ Encrypted subscriber database
- ✅ Segmentation by source page and interests
- ✅ **Newsletter Templates** (auto-generated via OpenRouter):
  - New app launch
  - Weekly digest
  - Review roundup
  - Deal spotlight
  - Seasonal promotions
- ✅ Auto-embed affiliate links in every newsletter
- ✅ Unsubscribe link in every email
- ✅ Subscriber dashboard with:
  - Growth charts (7d, 30d, 90d)
  - Segmentation analytics
  - Top source tracking
  - One-click send functionality

#### SEO Infrastructure

##### About Section (10 Sub-Pages)
- ✅ About Us
- ✅ About the Team
- ✅ About the Technology
- ✅ About Our Mission
- ✅ About Our Partners
- ✅ Press & Media
- ✅ Careers
- ✅ Testimonials
- ✅ Awards
- ✅ Contact

##### Blog System
- ✅ 20+ auto-generated posts via OpenRouter LLM
- ✅ 5 categories (How-To, Industry News, Product Updates, Tips & Tricks, Case Studies)
- ✅ Article schema markup
- ✅ RSS feed (XML)
- ✅ Post views and engagement tracking
- ✅ Category filtering
- ✅ Search functionality

##### FAQ System
- ✅ 50+ questions at launch
- ✅ 6 categories (Getting Started, Features, Technical, Legal, Accessibility)
- ✅ FAQPage schema markup for Google rich snippets
- ✅ Searchable with instant filter
- ✅ Helpful/not helpful voting
- ✅ Related FAQ suggestions

##### Technical SEO
- ✅ `sitemap.xml` auto-generated
- ✅ `robots.txt` with crawl directives
- ✅ Schema.org markup on every page
- ✅ Open Graph tags
- ✅ Twitter Card tags
- ✅ Canonical URLs
- ✅ Breadcrumb navigation

##### Backlink Strategy (1000+ links)
- ✅ Internal backlinks (5-10 per page)
- ✅ Cross-app backlinks to Revvel ecosystem
- ✅ Blog-to-page links
- ✅ 15-50 SEO landing pages (framework)
- ✅ Directory submission templates
- ✅ Social profile backlink strategy
- ✅ Guest post templates

#### Accessibility
- ✅ **Neurodivergent Mode** — simplified layout, reduced cognitive load
- ✅ **ECO CODE Mode** — reduced animations, minimal data usage
- ✅ **No Blue Light Mode** — warm color scheme, eye strain reduction
- ✅ Accessibility toggle in navbar
- ✅ Settings persistence in localStorage
- ✅ WCAG 2.1 AA compliance

#### Business Dashboard
- ✅ Vine tracking and sync controls
- ✅ Inventory management interface
- ✅ Tax reporting dashboard
- ✅ Financial P&L summary (Plaid stub)
- ✅ Resale/rental pipeline tracking

### 🏗️ Technical Improvements
- ✅ React 18 + TypeScript + Vite
- ✅ Glassmorphism dark theme UI
- ✅ Tailwind CSS + shadcn-ui components
- ✅ Framer Motion animations
- ✅ OpenRouter LLM integration
- ✅ localStorage state management
- ✅ Responsive design (mobile-first)
- ✅ Performance optimized (Vite)

### 🧪 Testing & Quality
- ✅ 33+ unit and integration tests
- ✅ Vitest + React Testing Library
- ✅ Component tests (StarRating, AccessibilityToggle, SEOHead)
- ✅ Store tests (reviewStore, affiliateStore, emailStore, seoStore)
- ✅ 100% TypeScript coverage
- ✅ Production build passes all checks

### 📚 Documentation
- ✅ Comprehensive README.md
- ✅ CHANGELOG.md (this file)
- ✅ Proprietary LICENSE (All Rights Reserved)
- ✅ Inline code documentation
- ✅ Type definitions for all data models

### 🚀 Deployment Ready
- ✅ Production build optimized
- ✅ SEO meta tags on all pages
- ✅ Accessibility compliance
- ✅ Performance metrics optimized
- ✅ Security best practices implemented

---

## [1.0.0] — 2024-02-01 — Initial Release

### ✨ Initial Features
- Basic review submission and browsing
- Category browsing
- About and Contact pages
- Responsive design
- Accessibility modes (initial implementation)

---

## Future Roadmap

### Phase 3 (Q2 2024)
- [ ] Plaid bank integration for income/expense tracking
- [ ] Resale/rental pipeline UI enhancements
- [ ] Advanced financial reporting
- [ ] Tax form auto-generation (1099, 8283, etc.)

### Phase 4 (Q3 2024)
- [ ] Mobile app (React Native)
- [ ] Video review support
- [ ] AI-powered review recommendations
- [ ] Influencer collaboration tools

### Phase 5 (Q4 2024)
- [ ] Premium tier with advanced analytics
- [ ] API for third-party integrations
- [ ] Marketplace for review templates
- [ ] Community features (forums, discussions)

---

## Known Issues

None at this time. Please report issues via the Contact form.

---

## Credits

**Built for:** Reese (daughter of Audrey Evans)

**Built by:** Audrey Evans / GlowStarLabs

**Technology Stack:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn-ui
- Framer Motion
- OpenRouter API
- Vitest

---

## License

All Rights Reserved © 2024 Audrey Evans / GlowStarLabs

This software is proprietary and confidential.
