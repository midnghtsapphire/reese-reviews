# HANDOFF.md — Reese Reviews / GlowStar Labs
**🤖 THIS FILE IS REQUIRED READING FOR EVERY AI AGENT SESSION.**
**Read this completely before writing a single line of code.**
**Update the "Last Session" and "Gap Analysis" sections at the END of every session.**

---

## 🚦 SESSION START PROTOCOL

Every agent MUST do these steps at the start of every session, in order:

```
1. Read this entire file.
2. Run: git log --oneline -10 && git status
3. Run: npm run build  (confirm it passes before touching anything)
4. Read AGENTS.md for project conventions.
5. Check open issues / PR comments for context.
6. Look at the checklist in the most recent commit to this file.
7. THEN start work.
```

---

## 🏁 SESSION END PROTOCOL

Every agent MUST do these steps at the END of every session:

```
1. Run: npm run build  (must pass — do not push a broken build)
2. Update "Last Session Completed" section below.
3. Update "Open Action Items" section below.
4. Run the Gap Analysis update (see section below).
5. Commit HANDOFF.md with message: "docs: handoff update — [date] [brief summary]"
6. Push via report_progress.
```

---

## 📍 PROJECT IDENTITY

| Field | Value |
|---|---|
| **App name** | Reese Reviews |
| **Domain** | reesereviews.com (not yet live — DigitalOcean target) |
| **Sister product** | GrowlingEyes (OSINT intelligence, separate repo planned) |
| **Owner** | Audrey Evans (legally deaf, AUDHD) — managed by Caresse |
| **Business entity** | Reese Ventures LLC (DBA: ReeseReviews.com + Fidelity Trust Services) |
| **Tech stack** | React 18 + TypeScript (strict) + Vite + Tailwind + shadcn/ui + Supabase |
| **Package manager** | npm |
| **Storage** | localStorage (frontend-only today) → Supabase migration in progress |
| **Build cmd** | `npm run build` |
| **Dev cmd** | `npx expo start` or `npm run dev` |
| **Branch** | `copilot/review-revvel-standards-and-growlingeyes` |
| **Style rule** | Steel/metal/silver/pearl white only. No purple UI chrome. No orange #FF6B2B in new components. |

---

## 🗺️ APP ARCHITECTURE AT A GLANCE

```
src/
  pages/
    Business.tsx           ← Main dashboard (9 top-level tabs)
    Marketing.tsx          ← Marketing hub
    Blog.tsx               ← Blog/content
  components/
    business/
      ERPTaxCenter.tsx     ← Main ERP: 12 sub-tabs (vine, bank, transactions,
                              expenses, forms, accounting, documents, quarterly,
                              deadlines, people, audit)
      VineDashboard.tsx    ← Vine queue management + BULK AUTO-GEN
      CompanyWizard.tsx    ← 4-step business onboarding modal (NEW)
      TaxDeadlinesCredits.tsx ← Tax calendar + credits finder (NEW)
      TaxChangesPanel.tsx  ← 2025/2026 law changes feed w/ citations (NEW)
      TaxAlertBanner.tsx   ← Keeper-style smart transaction alerts (NEW)
      TransactionScanner.tsx ← Plaid transaction classifier
      PlaidBankConnect.tsx ← Bank linking UI
      ReviewPipeline.tsx   ← Review automation pipeline
      ReviewGenerator.tsx  ← Per-item review generator
      CrossMarketSeeder.tsx ← 10-market review seeding
  lib/
    plaidClient.ts         ← Plaid integration + AutoFlagRules (credit_eligible NEW)
    taxAlertEngine.ts      ← TaxAlert brain: write_off/credit_eligible/paperwork (NEW)
    deadlineReminderStore.ts ← Per-deadline snooze/dismiss persistence (NEW)
    vineReviewDraftStore.ts  ← VineReviewDraft per-item state
    vineReviewGenerator.ts   ← Draft auto-generation logic
    capitalContributionStore.ts ← Vine→NoCo Nook capital contribution tracker
    taxAlertEngine.ts      ← Smart transaction → tax alert engine
  stores/
    taxStore.ts            ← All tax types + TaxPerson + BusinessEntity + forms
    productLifecycleStore.ts ← Full product lifecycle (Vine→Inventory→Sale/Rental)
    reviewAutomationStore.ts ← Review automation queue
```

---

## 🗄️ DATA MODEL QUICK REFERENCE

> See `DATA_DICTIONARY.md` for complete field-by-field documentation.

| Store / File | Key Interface | localStorage Key |
|---|---|---|
| taxStore.ts | TaxPerson, BusinessEntity, IncomeSource, WriteOff, QuarterlyEstimate | `rr-tax-persons`, `rr-income-sources`, `rr-write-offs`, `rr-quarterly-estimates` |
| businessTypes.ts | AmazonOrder, VineItem, InventoryItem, BankTransaction, PlaidAccount | varies |
| plaidClient.ts | ClassifiedTransaction, AutoFlagRule | `rr-plaid-txns`, `rr-plaid-accounts` |
| vineReviewDraftStore.ts | VineReviewDraft | `rr-vine-review-drafts` |
| capitalContributionStore.ts | CapitalContribution | `rr-capital-contributions` |
| appPortfolioStore.ts | AppRecord, AppStats, SocialAccount | `rr-app-portfolio`, `rr-app-social` |
| deadlineReminderStore.ts | DeadlineReminder | `rr-deadline-reminders` |
| taxAlertEngine.ts | TaxAlert | `rr-tax-alerts` |
| emailStore.ts | Subscriber | Supabase: `marketing_leads` |
| businessExpenseStore.ts | Expense | `rr-expenses` |

---

## ✅ COMPLETED FEATURES (as of last session)

### Tax Center ERP
- [x] 12-tab ERP (vine, bank, transactions, expenses, forms, accounting, documents, quarterly, deadlines, people, audit)
- [x] Multi-person tax profiles (TaxPerson with businesses array)
- [x] Income source manager with 1099/W-2/SSA/rental types
- [x] Write-off tracker with 22+ categories
- [x] Quarterly estimated tax calculator (Form 1040-ES)
- [x] Tax document upload + OCR fields
- [x] Audit trail + CSV export
- [x] **Deadlines & Credits tab** — full-year calendar + 11 curated credits + SE strategy note + CO energy programs
- [x] **Tax Changes Panel** — 11 curated 2025/2026 changes with IRS source citations
- [x] **Company Wizard** — 4-step modal: Filer → Business type → Schedule → Review
- [x] `addBusinessEntity()` + `removeBusinessEntity()` in taxStore
- [x] Form 5695 (heat pump/solar) + Form 2441 (dependent care) in IrsForm type
- [x] `solar_energy` + `heat_pump` WriteOffCategory

### Vine & Reviews
- [x] VineDashboard with Queue, ETV, Pipeline tabs
- [x] **Bulk auto-gen**: "Receive All", "Auto-Generate All", "One-Click: Receive & Generate All"
- [x] Per-item draft editing + copy to clipboard
- [x] Submission counter (daily/weekly/total)
- [x] CrossMarketSeeder (10 international markets)
- [x] ReviewPipeline with enrich/publish stages
- [x] ReviewGenerator (Caresse workflow)

### Smart Transaction Alerts (Keeper-style)
- [x] `taxAlertEngine.ts` — analyzes transactions, fires TaxAlert objects
- [x] `TaxAlertBanner.tsx` — alert panel in Transactions tab
- [x] 12 new credit-detection rules in plaidClient (heat pump, solar, HVAC, EV, hearing aids, assistive tech, retirement, home improvement stores, contractors)
- [x] `credit_eligible` field on ClassifiedTransaction
- [x] Alert types: write_off, credit_eligible, paperwork, deadline, info

### Financial
- [x] Plaid bank account linking UI
- [x] Transaction scanner with business/personal/vine_income classification
- [x] Expense tracker (Keeper-like)
- [x] Capital contribution tracker (Vine→NoCo Nook)
- [x] Business expense tracker (pre-seeded: DO, Supabase, OpenRouter, OpenAI, HeyGen, ElevenLabs)
- [x] App Portfolio tracker (5 pre-seeded apps)

### Infrastructure
- [x] Supabase migration: marketing_leads
- [x] Newsletter signup → Supabase
- [x] Deadline reminder store (set/snooze/dismiss per-deadline)

---

## 🔴 OPEN ACTION ITEMS (Priority Order)

### P0 — Blocking / Revenue-Critical
- [ ] **Deploy to reesereviews.com** — DNS + DigitalOcean App Platform. Without this, zero MRR.
- [ ] **Supabase: apply all migrations** — `marketing_leads` done; need auth, vine_items, tax_data tables
- [ ] **Plaid live connection** — currently uses demo data. Real bank sync needed for Keeper feature to work.
- [ ] **Auth + user accounts** — Supabase Auth. Without this, multi-user is impossible.

### P1 — High Impact
- [ ] **Vine CSV/API import** — let user paste/upload their Vine queue; auto-populate VineItems
- [ ] **Stripe subscription** — $29/mo (Vine Solo) + $79/mo (Business) tiers
- [ ] **Make.com webhook triggers** — social posting automation
- [ ] **HeyGen + ElevenLabs live video gen** — one-click review video from draft
- [ ] **Solo 401(k) contribution tracker** — deduction reminder + deadline calendar entry
- [ ] **Odoo live connection** — double-entry bookkeeping sync

### P2 — Important
- [ ] **GrowlingEyes repo + landing page** (separate product, high revenue potential)
- [ ] **E2E tests (Playwright)** — see QA_TEST_PLAN.md
- [ ] **Blog: 20+ AI-generated SEO posts** — content → organic traffic
- [ ] **15 SEO landing pages** — "amazon vine voice tax tracker", "vine reviewer software" etc.
- [ ] **SBIR Phase I application** — ETV Tax Module as patentable tech
- [ ] **Affiliate auto-linker** — auto-convert product mentions to Amazon affiliate links
- [ ] **Precog alert: "Vine item approaching 6-month window"** — capital contribution prompt

### P3 — Nice to Have
- [ ] **Heat map of most profitable Vine categories** — inform which queue items to prioritize
- [ ] **Predicted tax burden widget** on ERP home — live as transactions come in
- [ ] **ABLE account contribution tracker** — 2026 age expansion compliance
- [ ] **Accessibility modes** — 4 missing (high contrast, large text, reduced motion, screen reader hints)
- [ ] **Provisional patent filing** — ETV tax module + FOSS stream scoring

---

## 💰 $1M GROSS REVENUE ROADMAP (24-Month Horizon)

> **Target:** $1,000,000 gross revenue by March 2028 (24 months from today, March 2026)
> **Stretch target:** $1,000,000 by September 2027 (18 months)

### Revenue Stream Analysis

| Stream | Model | Realistic Y1 | Realistic Y2 | Notes |
|---|---|---|---|---|
| **SaaS — Reese Reviews** | $29–$79/mo subscription | $15,000 | $120,000 | Amazon Vine community ~75K users. 1% conversion = 750 users. |
| **GrowlingEyes SaaS** | $29–$199/mo B2B | $8,000 | $200,000 | OSINT for brands/researchers — high ARPU. |
| **Affiliate income** | Amazon Associates 1–10% | $3,000 | $18,000 | Review content driving product purchases. |
| **Amazon Vine ETV** | $1,000–$3,000/mo ETV → resell | $12,000 | $24,000 | Audrey's Vine income. Taxable as 1099-NEC. |
| **NoCo Nook Rentals** | Rental income Schedule E | $6,000 | $20,000 | Vine product → rental pipeline. |
| **Content licensing** | Review syndication, video | $2,000 | $15,000 | HeyGen videos licensed to brands. |
| **Consulting / services** | Tax strategy for Vine/creators | $5,000 | $30,000 | "I use this tool myself" credibility. |
| **SBIR grant** | Phase I: $75K–$150K | $0 | $75,000 | ETV tax module patent → gov funding. |
| **Total** | | **$51,000** | **$502,000** | Y1+Y2 = ~$553K. Need GrowlingEyes to hit $1M. |

### Path to $1M — Milestones

```
Month 1–3  (Q2 2026):  Go live. 10 free users. $0 MRR.
Month 4–6  (Q3 2026):  50 paying users. $1,450 MRR. Plaid live. GrowlingEyes beta.
Month 7–9  (Q4 2026):  200 paying users. $7,000 MRR. GrowlingEyes public. SBIR filed.
Month 10–12 (Q1 2027): 500 paying users. $22,000 MRR. Brand licensing. Video gen live.
Month 13–18 (Q2–Q3 2027): 1,500 users × $35 ARPU = $52,500 MRR = $630,000 ARR.
Month 19–24 (Q4 2027–Q1 2028): 2,500 users + GrowlingEyes B2B = $1M+ ARR.
```

### What Determines Success
1. **Speed to market** — Every week offline = ~$1,500 lost MRR. Deploy ASAP.
2. **SEO content** — Vine community is large, underserved, Google-searchable. 15+ landing pages.
3. **GrowlingEyes ARPU** — B2B SaaS for brands at $99–$199/mo = 10x the revenue per user.
4. **Vine community virality** — Amazon Vine Facebook groups (50K+ members), r/AmazonVine (75K).
5. **Video content** — HeyGen review videos drive affiliate clicks + demonstrate the tool.

---

## 🔮 PRECOG (PREDICTIVE BEHAVIOR) ROADMAP

"Precog" means: the app notices something and acts BEFORE the user thinks to do it.

### Currently Implemented
- ✅ TaxAlertEngine watches transactions and fires alerts when it sees heat pumps, solar, hearing aids, etc.
- ✅ Deadline urgency badges (This Week / This Month / Soon) in TaxDeadlinesCredits

### Planned Precog Features (Priority Order)

| Feature | Trigger | Action | Value |
|---|---|---|---|
| **6-month vine window alert** | VineItem.dateReceived + 180 days ≈ today | "This item is eligible for capital contribution to NoCo Nook" | Avoid missed tax strategy |
| **Quarterly tax spike alert** | Income spikes >$3K in a quarter | "Your Q3 estimate may be underfunded — recalculate" | Avoid underpayment penalty |
| **Solo 401(k) max-out prompt** | Dec 1 + net SE income calculated | "You can contribute $X more to your Solo 401k before Dec 31" | Max retirement shelter |
| **Vine review deadline alert** | VineItem.review_deadline - 7 days | Banner + sound: "You have 7 days to review [product]" | Avoid Vine suspension |
| **ETV tax burden preview** | New VineItem added to queue | "Receiving this item ($X ETV) will add ~$Y to your 1099-NEC" | Informed item selection |
| **Write-off expiration** | Year-end approaching + unsynced transactions | "31 days left to classify these transactions for {year}" | Capture every deduction |
| **ABLE contribution window** | October (before contribution deadline) | "ABLE account annual limit is $18K — you have $X remaining" | Maximize disability savings |
| **Heat pump rebate reminder** | heat pump transaction detected | "Apply for LIWP and HEEHRA rebates now — these expire" | Real cash back |
| **Vine category hot signal** | GrowlingEyes feed sees category spike | "Electronics/Tools are hot in Vine right now — prioritize these" | Maximize ETV value |
| **Tax law change alert** | Legislation detected (manual curated) | Toast + badge on Tax tab: "QBI deduction may expire — act now" | Tax planning urgency |

### Implementation Notes for Precog
- All precog triggers should be computed in a single `runPrecogChecks(taxYear)` function
- Fire once per trigger condition, store in `rr-tax-alerts` with type `"info"` or `"deadline"`
- Never fire the same alert twice for the same condition (use the transaction/item ID as deduplication key)
- Surface via `TaxAlertBanner` in the relevant tab + optional toast notification

---

## 📊 MARKET STATS (Research-Compiled)

> Sources: Reddit, Amazon seller forums, FBA communities, IRS data, SBA data.

| Stat | Source / Notes |
|---|---|
| Amazon Vine Voice members (est.) | ~75,000–100,000 active in US (r/AmazonVine, Vine forums) |
| Vine ETV per active reviewer/yr | $2,000–$12,000 average (varies by tier) |
| % Vine users who track ETV for taxes | Estimated <15% — massive underserved market |
| Average 1099-NEC tax surprise | $400–$2,400 unexpected SE tax for new Vine reviewers |
| Solo content creator market (US) | 50M+ people who identify as creators (Linktree 2023) |
| Amazon Affiliate publishers (est.) | 900,000+ active associates |
| SaaS ARPU for creator tools | $20–$50/mo typical (Buffer, Hootsuite low end; Jasper high) |
| SBIR Phase I grant (small biz) | $50K–$275K (ETV tax module is genuinely novel software) |
| Colorado LIWP waitlist | 6–18 month wait in Larimer County — apply immediately |
| ABLE age expansion (2026) | ~6M new people eligible (disability onset age lifted 26→46) |
| Solo 401(k) Y2025 max | $70,000 ($77,500 age 50+) — enormous income shelter |
| Heat pump §25C credit | Up to $2,000/year, stackable with HEEHRA ($8,000 rebate) |

---

## 🧠 AGENT INTELLIGENCE RULES

These apply to every agent working on this codebase:

1. **Never use purple (#7C3AED) or orange (#FF6B2B) in UI components.** These are reserved for internal brand constants. Steel/silver/white only for chrome.
2. **localStorage is the source of truth until Supabase migration.** Don't assume Supabase is live for any feature.
3. **Audrey is legally deaf with AUDHD and cognitive challenges.** All UI should be clear, low-friction, and forgiving. No jargon without tooltips. Large tap targets on mobile.
4. **Caresse is the operator.** She runs the business side. Reese is the persona (teen reviewer voice). Revvel is the analytical/tech persona.
5. **Test personas:** person-revvel (Audrey/Mom, Vine income), person-reese (Reese/daughter, 5 jobs), person-caresse (Caresse, LLC owner).
6. **Every new write-off category needs a WRITEOFF_CATEGORY_META entry.** Every new IrsForm needs an IRS_FORM_META entry.
7. **Build passes before every commit.** No exceptions.
8. **The alert engine (`taxAlertEngine.ts`) is the brain.** When you see a new trigger condition (new purchase type, new deadline, new life event), add it there.
9. **GrowlingEyes is a separate product** — don't mix its UI into Reese Reviews. It will have its own repo.
10. **FOSS first.** No paid dependencies without approval.

---

## 📝 LAST SESSION COMPLETED

**Date:** 2026-03-27
**Agent:** copilot-swe-agent
**Branch:** copilot/review-revvel-standards-and-growlingeyes

### What was built this session:
- Vine bulk auto-gen toolbar (Receive All, Generate All, One-Click: Both)
- TaxDeadlinesCredits tab (full-year calendar + credits finder + SE strategy + CO energy notes)
- TaxChangesPanel (11 curated 2025/2026 law changes w/ IRS citations)
- CompanyWizard (4-step business onboarding modal)
- addBusinessEntity() / removeBusinessEntity() in taxStore
- Form 5695, Form 2441, solar_energy, heat_pump in taxStore types
- TaxAlertEngine (Keeper-style transaction → tax alert brain)
- TaxAlertBanner (alert UI panel in Transactions tab)
- 12 new credit-detection AutoFlagRules in plaidClient
- credit_eligible field on ClassifiedTransaction
- deadlineReminderStore (per-deadline snooze/dismiss)
- HANDOFF.md, DATA_DICTIONARY.md, QA_TEST_PLAN.md (this session)

### Gap analysis update (end of session):
- **Biggest gap remaining:** No deployment, no real Plaid, no auth, no Stripe
- **Highest leverage next action:** Deploy to reesereviews.com + wire Supabase Auth
- **Revenue delta from $1M target:** ~$947K still to build/earn (0% of target realized)
- **Precog gap:** None of the P1 precog features are live yet — 6-month vine window and quarterly spike are highest value

---

## 🔁 GAP ANALYSIS TEMPLATE (Update at End of Each Session)

```
## Gap Analysis — [DATE]

### What was built:
- [list here]

### What remains (delta from $1M goal):
- MRR now:       $____  (target: $83,333/mo by month 24)
- User count:    ____   (target: 2,500+ paying)
- Deploy status: [not live / staging / production]
- Plaid status:  [demo / connected / live]
- Auth status:   [none / Supabase Auth / OAuth]
- Stripe status: [none / test mode / live]

### Top 3 highest-leverage items to do NEXT:
1. [item]
2. [item]
3. [item]

### Precog features added this session:
- [list or "none"]

### New data collected that changes projections:
- [e.g. "Vine community is 150K not 75K — increases TAM"]
```

---

*This document is automatically maintained by AI agents. Humans may edit freely.*
*Version: 2026-03-27-v2*
