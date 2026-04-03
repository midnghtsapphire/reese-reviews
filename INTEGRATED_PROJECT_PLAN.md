# INTEGRATED PROJECT PLAN: reesereviews.com (Phase 2)
**Goal:** Build on the existing foundation to create a production-ready, high-growth review platform for Reese.

## 1. Project Overview
This plan **incorporates and enhances** the hours of work already invested in `reesereviews.com`. We are moving from a "Local Demo" state to a "Production Cloud" state, with a focus on Caresse's avatar-driven reviews and full business automation.

---

## 2. Lovable Build Spec

### pages
- **slug:** `/`
  **title:** Home - Reese Reviews
  **sections:** [Hero, CategoriesPreview, FeaturedReviews, SocialProof]
  **primaryCTA:** "Read Latest Reviews"
  **SEOtitle:** Reese Reviews — Honest Product Reviews From Box to Beautiful
  **SEOmeta:** Real, unfiltered product reviews by a teen reviewer. Covering tech, beauty, food, and more.

- **slug:** `/dashboard`
  **title:** Business Dashboard
  **sections:** [VineSync, TaxCenter, ProductLifecycle, ReviewAutomation]
  **primaryCTA:** "Sync Amazon Orders"
  **SEOtitle:** Business Dashboard — Reese Reviews Admin
  **SEOmeta:** Internal management for Amazon Vine, tax tracking, and review automation.

- **slug:** `/reviews/:slug`
  **title:** Review Detail
  **sections:** [ProductHeader, StarRating, FullReview, ProsCons, AffiliateCTA, RelatedReviews]
  **primaryCTA:** "Buy on Amazon"
  **SEOtitle:** [Product Name] Review — Reese Reviews
  **SEOmeta:** Honest take on [Product Name]. Is it worth it?

### components
- **name:** `AvatarReviewOverlay`
  **props:** `{ avatar: "reese" | "revvel", text: string, position: "corner" | "center" }`
  **copy:** "Reese's Quick Take"
- **name:** `SupabaseSyncIndicator`
  **props:** `{ status: "synced" | "syncing" | "error" }`
  **copy:** "Cloud Backup: [Status]"
- **name:** `TaxFormGenerator`
  **props:** `{ formType: "1099-NEC" | "Schedule-C", data: any }`
  **copy:** "Generate IRS-Ready PDF"

### flows
- **wizardName:** `ReviewPublishingWizard`
  **steps:** [Import from Vine, AI Content Generation, Avatar Selection, SEO Check, Publish to Site]
  **validations:** [Check for affiliate link, Verify star rating, Strip AI fingerprints]
  **disclosures:** [Amazon Affiliate Disclosure, Genuine Opinion Guarantee]

- **wizardName:** `TaxYearClosing`
  **steps:** [Review All Income, Categorize Write-Offs, Reconcile Vine ETV, Export to PDFiller]
  **validations:** [Check for missing receipts, Verify 1099-K totals]
  **disclosures:** [Not Professional Tax Advice, Data Privacy Notice]

### dataModels
- **entity:** `Review`
  **fields:** [id, title, body, rating, category, asin, affiliate_link, images, status, created_at]
- **entity:** `IncomeSource`
  **fields:** [id, person_id, type, amount, payer_name, tax_year, category]
- **entity:** `WriteOff`
  **fields:** [id, income_source_id, category, amount, description, receipt_url, date]

### automations
- **trigger:** "New Amazon Vine Order Detected"
  **action:** "Create Draft Review in Pipeline & Set Deadline Alert"
  **toolsNeeded:** [VineScraper, Supabase, EmailNotifier]
- **trigger:** "Review Published"
  **action:** "Generate Social Media Snippets & Post to Queue"
  **toolsNeeded:** [OpenRouter, SocialMediaScheduler]

---

## 3. SEO & Branding Strategy
- **SEO Branding:** "Honest Reviews From Box to Beautiful"
- **High-Volume Keywords:** `Amazon Vine Reviews`, `Teen Product Reviews`, `Accessible Tech Reviews`, `Honest Beauty Takes`.
- **Domain Strategy:** `reesereviews.com` is the primary. We will leverage `meetaudreyevans.com` for cross-linking.

---

## 4. Implementation Phases (Building on Existing Work)

### Phase 1: Security & Cloud Migration (KEEP + ENHANCE)
- [ ] Rotate Supabase keys and secure `.env`.
- [ ] Refactor `taxStore.ts` to sync with Supabase tables.
- [ ] Refactor `reviewStore.ts` to sync with Supabase tables.
- [ ] Implement Supabase Auth for the `/dashboard` and `/admin` routes.

### Phase 2: Avatar & Media Enhancement (ENHANCE)
- [ ] Integrate Caresse's avatar assets into the `ReviewVideoCreator`.
- [ ] Implement the `AvatarReviewOverlay` component for review details.
- [ ] Add image upload support to Supabase Storage for review photos.

### Phase 3: Automation & Monetization (ENHANCE + ADD)
- [ ] Fully activate the `affiliateStore` OpenRouter calls for content generation.
- [ ] Implement a Stripe-powered "Supporter" tier or affiliate tracking dashboard.
- [ ] Add automated Sitemap generation and SEO optimization tools.

### Phase 4: CI/CD & Standards Alignment (ADD)
- [ ] Create GitHub Actions for automated testing and deployment.
- [ ] Generate full `AUTO_DOCUMENTATION` per `revvel-standards`.
- [ ] Final QA sweep for ADHD-friendly UI compliance.
