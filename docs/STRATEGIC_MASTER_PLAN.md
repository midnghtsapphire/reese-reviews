# REESE-REVIEWS — STRATEGIC MASTER PLAN
**Author:** Audrey Evans / MIDNGHTSAPPHIRE  
**Date:** March 27, 2026  
**Status:** LIVING DOCUMENT — Update after every sprint  
**Covers:** Full cross-ecosystem review of revvel-standards + GrowlingEyes + Reese Reviews, Blue Ocean Research, FOSS Stream Intelligence, Kanban, Investor Deck Index, Agent Roster, and Full Development Lifecycle

---

## TABLE OF CONTENTS
1. [Executive Summary](#1-executive-summary)
2. [What Exists — Asset Inventory](#2-what-exists--asset-inventory)
3. [Critical Gap Analysis — What Needs Completion](#3-critical-gap-analysis--what-needs-completion)
4. [Blue Ocean Niche Research](#4-blue-ocean-niche-research)
5. [FOSS Stream Intelligence — Social Listening Engine](#5-foss-stream-intelligence--social-listening-engine)
6. [International Repository Research (Gitee / GitLab / Korea / Japan / Russia / Brazil)](#6-international-repository-research)
7. [Patent Landscape Analysis](#7-patent-landscape-analysis)
8. [Full Development Lifecycle (EXRUP 8 Phases)](#8-full-development-lifecycle-exrup-8-phases)
9. [Kanban Cards — Sprint-Ready Tasks](#9-kanban-cards--sprint-ready-tasks)
10. [Investor Slides Summary](#10-investor-slides-summary)
11. [AI Agent Roster — Maintenance & Growth](#11-ai-agent-roster--maintenance--growth)
12. [Revvel Standards Compliance Checklist](#12-revvel-standards-compliance-checklist)
13. [GrowlingEyes Integration Plan](#13-growlingeyes-integration-plan)
14. [Immediate Next Actions](#14-immediate-next-actions)

---

## 1. EXECUTIVE SUMMARY

**Reese Reviews** is currently a functional Amazon Vine reviewer dashboard with tax ERP, inventory lifecycle, review automation, and social publishing. It lives at `reesereviews.com` (not yet live-deployed) and runs under the Freedom Angel Corp (FAC) entity umbrella.

**Three parallel plays exist:**

| Play | Platform | Opportunity |
|------|----------|-------------|
| **Vine Intelligence OS** | reesereviews.com | World's only FOSS-first Vine reviewer business OS — zero competition |
| **GrowlingEyes Social Listener** | growlingeyes.com | OSINT-grade data harvester for FOSS streams (Discord/Telegram/Gitee) |
| **ReviewChain Network** | Cross-platform | Federated, cross-country reviewer intelligence marketplace |

**Revenue ceiling per play:**  
- Vine Intelligence OS: $50K–$200K/yr (SaaS subscriptions + affiliate commissions)  
- GrowlingEyes: $100K–$500K/yr (OSINT as a Service, B2B data feeds, white-label)  
- ReviewChain: $500K–$2M/yr (marketplace commissions, data licensing, enterprise contracts)

**Total TAM (Total Addressable Market):**  
$4.7B — Amazon review analytics + social listening + OSINT tooling (2025 estimates)

---

## 2. WHAT EXISTS — ASSET INVENTORY

### 2a. Reese Reviews App (steel-white repo)

| Module | Status | Quality | Notes |
|--------|--------|---------|-------|
| Tax Center ERP | ✅ Complete | High | Multi-person, multi-entity, ETV, quarterly estimates, form routing |
| Vine Dashboard | ✅ Complete | High | Cookie manager, product list, ETV tracking |
| Amazon Order Import | ✅ Complete | High | CSV import, PapaParse, entity labels |
| Inventory / Lifecycle | ✅ Complete | High | RECEIVED → REVIEWED → SOLD / DONATED |
| Financial Dashboard | ✅ Complete | Medium | P&L, revenue, expenses — needs Supabase wiring |
| Product Lifecycle Store | ✅ Complete | High | markSold, markRented, getSalesRevenue fully wired |
| Review Pipeline | ✅ Complete | High | Import → Enrich → Publish |
| Review Automation | ✅ Complete | Medium | HeyGen + ElevenLabs wired, needs live keys |
| Review Video Creator | ✅ Complete | Medium | Reese + Revvel persona, video style selection |
| Social Publishing | ✅ Complete | Medium | Facebook, LinkedIn, Instagram, TikTok — simulated |
| Affiliate Engine | ⚠️ Partial | Low | Tag `meetaudreyeva-20` hardcoded, no auto-linker |
| Email / Newsletter | ⚠️ Partial | Low | NewsletterSignup + emailStore, no double opt-in |
| Schema.org JSON-LD | ❌ Missing | — | Mandatory per revvel-standards §8 |
| Blog System | ❌ Missing | — | Mandatory per revvel-standards §4 |
| FAQ (50+ questions) | ❌ Missing | — | Mandatory per revvel-standards §4 |
| SEO Landing Pages | ❌ Missing | — | Mandatory — 15–50 city pages |
| Sitemap.xml | ❌ Missing | — | Mandatory |
| CHANGELOG.md | ✅ Present | High | Auto-update not wired |
| Accessibility Modes | ⚠️ Partial | Medium | Toggle present, missing ADHD/Dyslexic/NoBlueLight |
| OpenDyslexic Font | ❌ Missing | — | Mandatory for Dyslexic Mode |
| Plaid Bank Connect | ⚠️ Partial | Medium | UI complete, needs live Plaid token |
| Odoo Integration | ⚠️ Stub | Low | OdooClient stub, no live connection |
| Production Deploy | ❌ Missing | — | reesereviews.com pointing nowhere |
| GrowlingEyes module | ❌ Missing | — | Security/OSINT brand not yet integrated |
| Social Listening | ❌ Missing | — | Telegram/Discord monitor not built |
| Campaign Generator (20/50/100/200/500) | ❌ Missing | — | Mandatory per revvel-standards §4 |
| Supabase full wiring | ⚠️ Partial | Medium | Client present, tables not all deployed |

### 2b. GrowlingEyes (growlingeyes.com — not yet built)

**GrowlingEyes** is defined in revvel-standards as the "Security & surveillance" brand. It currently has:  
- Domain registered (growlingeyes.com → TBD DNS)  
- No repository  
- No codebase  
- Telegram bot `@googlieeyes_bot` exists in RISINGALOHA group (MindMappr)

**Opportunity:** Build GrowlingEyes as the OSINT/social listening arm that feeds data INTO Reese Reviews — creating a closed intelligence loop.

### 2c. Revvel Standards Compliance State (for reese-reviews)

| Standard | Compliant | Action Needed |
|----------|-----------|---------------|
| FOSS-first libraries | ✅ Yes | — |
| Steel/neutral brand palette | ✅ Yes | — |
| Schema.org JSON-LD on all pages | ❌ No | Add to `index.html` + SEOHead.tsx |
| Affiliate auto-linker | ❌ No | Build AffiliateLinker utility |
| Campaign generator (20/50/100/200/500) | ❌ No | Add to Generate page |
| Email collection + double opt-in | ❌ No | Update NewsletterSignup |
| Blog (20+ posts at launch) | ❌ No | Add blog system with auto-gen |
| FAQ (50+ questions) | ❌ No | Build FAQ page |
| 1000+ backlink strategy | ❌ No | Add 15–50 SEO landing pages |
| Sitemap.xml auto-generated | ❌ No | Add vite-plugin-sitemap or manual |
| Robots.txt | ✅ Yes | Present |
| CHANGELOG.md in repo | ✅ Yes | Needs auto-update webhook |
| Accessibility modes (all 7) | ⚠️ Partial | Add ADHD, Dyslexic, No Blue Light, ECO CODE |
| OpenDyslexic / Atkinson Hyperlegible fonts | ❌ No | Add via Google Fonts |
| Proprietary license | ✅ Yes | LICENSE present |
| GitHub Actions CI/CD | ❌ No | Needs workflow for build + deploy |
| Deploy to reesereviews.com | ❌ No | Setup DNS + DO App Platform or GitHub Pages |
| BLUEPRINT.md | ❌ No | Create |
| ROADMAP.md | ❌ No | Create |
| KANBAN_CARDS.md | ❌ No | See docs/KANBAN_CARDS.md (this PR) |
| INVESTORS_PACK.md | ❌ No | See docs/INVESTOR_DECK.md (this PR) |

---

## 3. CRITICAL GAP ANALYSIS — WHAT NEEDS COMPLETION

### Priority 1 — Revenue-Blocking (Fix First)

| Gap | Impact | Effort | Owner |
|-----|--------|--------|-------|
| Deploy reesereviews.com to live DNS | Users can't reach the site | 2h | DevOps agent |
| Supabase tables deployed (all migrations) | Financial data not persisting | 4h | DB agent |
| Real Amazon Vine data (Supabase sync) | Demo mode only | 8h | API agent |
| Schema.org JSON-LD on all pages | Google won't rank it | 2h | SEO agent |
| GitHub Actions CI/CD pipeline | No automated deploy | 3h | DevOps agent |

### Priority 2 — Compliance-Blocking (Fix Second)

| Gap | Impact | Effort |
|-----|--------|--------|
| Double opt-in email flow | GDPR / CAN-SPAM violation risk | 4h |
| Privacy Policy page | Legal exposure | 2h |
| Terms of Service page | Legal exposure | 2h |
| Accessibility: ADHD Mode | revvel-standards mandatory | 4h |
| Accessibility: Dyslexia Mode + OpenDyslexic | revvel-standards mandatory | 3h |
| Accessibility: No Blue Light Mode | revvel-standards mandatory | 2h |
| Accessibility: ECO CODE Mode | revvel-standards mandatory | 2h |

### Priority 3 — Growth-Blocking (Fix Third)

| Gap | Impact | Effort |
|-----|--------|--------|
| Blog system (20+ posts) | SEO authority | 8h |
| FAQ page (50+ questions) | SEO rich snippets | 4h |
| 15–50 SEO landing pages | Organic traffic | 16h |
| Sitemap.xml auto-generation | Indexability | 2h |
| Affiliate auto-linker utility | Missed revenue | 4h |
| Campaign generator (20/50/100/200/500 buttons) | Missed marketing automation | 6h |
| Social media auto-post (real, not simulated) | Make.com / GoHighLevel webhooks | 8h |
| Plaid live connection | Real bank data | 4h |
| GrowlingEyes module (social listener) | New revenue stream | 40h |
| ReviewChain marketplace concept | Future revenue | TBD |

### Priority 4 — Innovation (Build New)

| Gap | Impact | Effort |
|-----|--------|--------|
| Telegram bot integration (@googlieeyes_bot) | Real-time FOSS discovery | 16h |
| Discord monitor for FOSS streams | Competitive intelligence | 16h |
| International review stream ingestion (Gitee / JD.com / Rakuten) | Untapped data | 24h |
| AI fingerprint stripping (metadataStripper) — extend to video | Review authenticity | 8h |
| Patent alert monitor | IP protection | 8h |
| Agent reputation score system | Competitive differentiator | 32h |

---

## 4. BLUE OCEAN NICHE RESEARCH

### 4a. The Core Insight

Every existing Amazon review tool is **seller-side** (helping brands get more reviews). **Nobody is building reviewer-side tools** — tools that help the actual humans writing reviews manage their life, taxes, inventory, and content production professionally.

**Reese Reviews owns this niche entirely.**

### 4b. Niche Map

```
                    REVIEWER-SIDE TOOLS (BLUE OCEAN)
                    ┌─────────────────────────────────┐
                    │  Reese Reviews (CURRENTLY HERE) │
                    │  ✅ Tax ERP                      │
                    │  ✅ Inventory Lifecycle          │
                    │  ✅ Vine Dashboard               │
                    │  ⚠️ Review Automation            │
                    │  ⚠️ Social Publishing            │
                    │  ❌ FOSS Stream Intelligence     │
                    │  ❌ International Streams        │
                    │  ❌ Reviewer Marketplace         │
                    └─────────────────────────────────┘
                    
SELLER-SIDE (RED OCEAN — CROWDED)
├── MetricsCart
├── FeedbackFive
├── SageMailer
├── BQool
├── FeedbackWhiz
└── Vine-Reviewer.com (partial overlap)
```

### 4c. Top 10 Blue Ocean Opportunities (Ranked by ROI × Feasibility)

| Rank | Opportunity | Why Nobody Has Done This | Revenue Model |
|------|-------------|--------------------------|---------------|
| 1 | **Vine Reviewer Business OS** | Amazon doesn't provide tax/business tools to Voices | SaaS $9–$99/mo |
| 2 | **FOSS Stream Discovery Engine** | No tool mines Telegram/Discord for emerging FOSS products | Data licensing $99/mo |
| 3 | **Multi-Country Reviewer Intelligence** | No tool aggregates JD.com, Rakuten, Flipkart review streams | B2B data feed $299/mo |
| 4 | **AI Review Video Factory (Accessibility-first)** | HeyGen/ElevenLabs wired but no WCAG-AAA video tool | Per-video $2–$5 |
| 5 | **Agent Rental for Reviewers** | Reviewer-specialized agents (photo editor, tax prep, SEO) | Hourly rental $5–$20/hr |
| 6 | **Review Product Resale Optimizer** | No tool tells you what Amazon Vine items sell best where | Affiliate commissions |
| 7 | **Nonprofit ERP for Vine (Disability/FAC angle)** | Freedom Angel Corps angle — disability reviewer tools | Grant funding + SaaS |
| 8 | **GrowlingEyes OSINT Dashboard** | No FOSS-first social listener tuned to product/reviewer intelligence | SaaS $49–$299/mo |
| 9 | **Reviewer Credit Score** | Trust/reputation system for Amazon Voices | Marketplace fees |
| 10 | **Automated CLE/Education Tracker for Reviewers** | Track CE credits for reviewer-professionals (FAC/legal angle) | Premium tier add-on |

### 4d. Priority Build: FOSS Stream Discovery Engine

**The Idea:** A background agent that continuously monitors public Telegram channels, Discord servers, GitHub trending, and Gitee trending for:
- New FOSS products being launched that nobody knows about yet
- Products being discussed by reviewers before they hit Vine
- Emerging categories (niche home goods, medical devices, eco-tech)
- "One-off streams" — limited runs, beta hardware, pre-launch samples

**Data Sources:**
| Source | Method | FOSS Tool |
|--------|--------|-----------|
| Telegram public channels | Telegram Bot API | telethon (Python) |
| Discord public servers | Discord.js or discord.py | Fosscord API |
| GitHub trending | GitHub REST API | octokit |
| Gitee trending | Gitee API v5 | curl/axios |
| Reddit r/amazonvine | Reddit PRAW | praw (Python) |
| Twitter/X (X API free tier) | X API v2 | tweepy |
| Japanese: Amazon.co.jp | BeautifulSoup4 + proxies | scrapy |
| Korean: Coupang / Naver | Playwright headless | playwright |
| Chinese: JD.com / Taobao | Anti-bot → public API | requests |
| Russian: Wildberries | Public API available | requests |
| Brazilian: Mercado Libre | Official REST API | Official SDK |

**Wiring into Reese Reviews:**
```
GrowlingEyes Engine
    ↓ (WebSocket push)
Reese Reviews Dashboard
    → "Hot Incoming" panel in Vine tab
    → Auto-creates draft inventory entries
    → Alerts via Telegram (@googlieeyes_bot)
```

---

## 5. FOSS STREAM INTELLIGENCE — SOCIAL LISTENING ENGINE

### 5a. Architecture

```
┌─────────────────────────────────────────────────────────┐
│              GROWLINGEYES INTELLIGENCE ENGINE            │
│                                                         │
│  Collectors (Python microservices)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Telegram  │ │ Discord  │ │  GitHub  │ │  Gitee   │  │
│  │ Collector │ │ Monitor  │ │ Trending │ │ Trending │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
│       └─────────────┴─────────────┴────────────┘        │
│                          ↓                              │
│             Message Queue (Redis Streams)               │
│                          ↓                              │
│            NLP Classifier (local Llama 3.3)             │
│            → Category tagging                           │
│            → Relevance score                            │
│            → Fake/spam filter                           │
│                          ↓                              │
│            PostgreSQL / Supabase Store                  │
│                          ↓                              │
│            WebSocket Push → Reese Reviews UI            │
│            Telegram Push → @googlieeyes_bot             │
└─────────────────────────────────────────────────────────┘
```

### 5b. Key Telegram Channels to Monitor (FOSS-focused)

| Channel | Handle | Focus |
|---------|--------|-------|
| FOSS Post | @fosspost | Daily FOSS news |
| It's FOSS | @itsfoss_official | Linux + FOSS products |
| Foss Finds | @fossfinds | Curated FOSS discoveries |
| Open Source Software | @opensourcesoftware | Multi-category |
| Awesome FOSS | @awesomefoss | Curated lists |
| RISINGALOHA (own group) | Internal | Your own ecosystem |

### 5c. Key Discord Servers to Monitor

| Server | Focus |
|--------|-------|
| Cult of Lunatics | FOSS + Linux |
| The Linux Space | Open source dev |
| LibreDen | FOSS advocacy |
| r/AmazonVine Discord | Reviewer community |
| ProductReview.com Discord | Review community |

### 5d. Implementation Stack (FOSS-Only)

```python
# Core dependencies (all FOSS / MIT or Apache-2.0)
telethon==1.36.0          # Telegram client (Telegram-FOSS compatible)
discord.py==2.3.2         # Discord API
PyGithub==2.3.0           # GitHub API
praw==7.7.1               # Reddit API (r/amazonvine, r/vine)
scrapy==2.11.2            # Web scraping
playwright==1.44.0        # Headless browser (Korean/Japanese sites)
redis==5.0.3              # Message queue (Redis Streams)
transformers==4.40.0      # Local NLP (Llama 3.3 via HuggingFace)
fastapi==0.111.0          # REST + WebSocket API
supabase==2.5.0           # PostgreSQL store
```

### 5e. One-Off Stream Discovery Algorithm

**Problem:** "One-off streams" are products that appear in obscure community posts for 24–72 hours and are never discovered by mainstream reviewers.

**Solution:** Time-decay scoring algorithm

```
Score = Freshness × Uniqueness × Category_relevance × Source_authority

Where:
  Freshness = e^(-λ × hours_since_post)   # λ = 0.1 for 10hr half-life
  Uniqueness = 1 - (mentions_count / max_mentions_in_window)
  Category_relevance = cosine_similarity(post_embedding, vine_category_embeddings)
  Source_authority = known_source_rank (1–10 scale)

Threshold: Score > 0.7 → Alert
```

---

## 6. INTERNATIONAL REPOSITORY RESEARCH

### 6a. Gitee (China) — Hidden Gems

**Strategy:** Monitor `gitee.com/explore/repos` trending + `gitee.com/api/v5/repos/search`

| Category | What to Watch | Why |
|----------|---------------|-----|
| AI product review NLP | deepseek-review, zhipu-ai forks | CJK-language review tools that work |
| Smart home device firmware | TP-Link, Xiaomi, Tuya OSS | Vine-ready smart home products |
| Consumer electronics tools | Camera firmware, audio tools | Reviewable hardware + software |
| Social commerce integrations | Pinduoduo, JD, Taobao APIs | Cross-platform review data |

**Notable Gitee repos to track:**
- `ai-codereview-gitlab` (deepseek-powered) — adaptable for product reviews
- `FunAudioLLM` — multi-lingual TTS perfect for Revvel/Reese voice personas
- `Qwen` (Alibaba) — fastest LLM for Chinese product description translation

### 6b. GitHub (Japanese/Korean/Russian/Brazilian)

| Country | Platform | Key Discovery Strategy |
|---------|----------|------------------------|
| Japan | Amazon.co.jp + Rakuten | `github.com/topics/rakuten` + `github.com/topics/amazon-japan` |
| Korea | Coupang + Naver | `konlpy` NLP + Coupang Open API |
| Russia | Wildberries | Wildberries has full public REST API — zero auth required |
| Brazil | Mercado Libre | Official SDK + active OSS community |
| India | Flipkart + Meesho | Flipkart Affiliate API (highest margin) |

**Wildberries (Russia) is particularly notable:**
- Public REST API with no authentication for product data
- 300M+ SKUs — larger than Amazon
- Zero English coverage in review tooling space
- Brazilian Mercado Libre similar

### 6c. GitLab — Internal Intelligence

| Use | Recommendation |
|-----|---------------|
| Private infrastructure code | Host GrowlingEyes collector microservices on self-hosted GitLab |
| CI/CD for Python collectors | GitLab CI free tier with Docker runners |
| Secure credential vaulting | GitLab CI/CD Variables (encrypted) |

### 6d. Under-the-Radar Country Streams

| Country/Platform | Why it Matters | Entry Point |
|-----------------|---------------|------------|
| **Wildberries (Russia)** | 300M SKUs, public API, NO English tooling | `api.wildberries.ru/public/api/v1/info` |
| **Shopee (Southeast Asia)** | 600M users, fragmented reviews | Shopee Affiliate API |
| **Tokopedia (Indonesia)** | 100M+ products, open API | developer.tokopedia.com |
| **OLX (Eastern Europe/Africa)** | Used goods marketplace, no review tools | OLX API partners |
| **Takealot (South Africa)** | Only major review tool target in Africa | Manual scraping (no public API) |
| **AliExpress** | 150M+ products, reviews in 50 languages | AliExpress API (Admitad) |
| **Ozon (Russia)** | Second largest Russian e-commerce | Ozon Seller API |

---

## 7. PATENT LANDSCAPE ANALYSIS

### 7a. What Is Already Patented (Do Not Build Exactly)

| Patent Area | Key Filers | IPC Class | Risk Level |
|-------------|-----------|-----------|------------|
| AI-generated review text (e-commerce) | Amazon, Google, Salesforce | G06Q30/00 | HIGH — avoid direct overlap |
| Sentiment analysis of product reviews | IBM, Microsoft, Baidu | G06F40/30 | Medium — use FOSS libs |
| Review authenticity detection (fake review filter) | Amazon, Google | G06Q30/02 | LOW — different use case |
| Voice synthesis for product descriptions | Amazon (Polly), Apple | G10L13/00 | HIGH — avoid ElevenLabs clone |
| Automated tax calculation for gig economy | Intuit, H&R Block | G06Q40/00 | Medium — well-covered |
| Browser extension for e-commerce data capture | Amazon, Capital One | G06F | LOW — personal use exemption |

### 7b. Where the Patent White Space Is

| White Space | Description | Protectable? |
|-------------|-------------|-------------|
| **Vine-specific ETV tax calculator** | Amazon doesn't patent this; IRS doesn't either | YES — file provisional |
| **FOSS stream scoring algorithm** | Time-decay + uniqueness scoring for product streams | YES — software method patent |
| **Reviewer reputation score** | Composite score (review count × quality × category depth) | YES — algorithm patent |
| **Disability-accessible review workflow** | WCAG AAA + ADHD + Dyslexic mode for reviewers | YES — design + utility patent |
| **Multi-country review stream aggregation** | No prior art for Wildberries + Amazon + Rakuten combined | YES — file PCT international |

### 7c. Recommended IP Actions

1. **File provisional patent** on Vine ETV Tax Module (costs ~$800 DIY, protects 12 months)
2. **File provisional patent** on FOSS stream scoring algorithm (novel time-decay formula)
3. **Register copyright** on all custom UI/UX designs (already protected by creation, but formalize)
4. **Trademark** "GrowlingEyes" in Intl. Class 42 (SaaS) — check USPTO first
5. **Trademark** "Reese Reviews" in Intl. Class 42 + 35 — check USPTO first

### 7d. Free Patent Research Tools

- **Google Patents**: `patents.google.com` — search "amazon vine tax" "reviewer automation"
- **USPTO Full-Text**: `efts.uspto.gov` — US patent full-text search
- **Espacenet**: `worldwide.espacenet.com` — European + international
- **Patsnap Free Tier**: `patsnap.com` — semantic patent search
- **SumoLogic on Gitee**: Check Chinese patent equivalents for NLP review tools

---

## 8. FULL DEVELOPMENT LIFECYCLE (EXRUP 8 PHASES)

### Phase 0 — Inception (DONE)
- ✅ Entity: Freedom Angel Corp (EIN: 86-1209156)
- ✅ Brand: Reese Reviews + GrowlingEyes + RevvelPress
- ✅ Domain: reesereviews.com (registered, DNS TBD)
- ✅ Legal: Proprietary "All Rights Reserved" license
- ⚠️ GrowlingEyes: Domain registered, no entity/repo yet

### Phase 1 — Planning (PARTIALLY DONE)
- ✅ revvel-standards README defines architecture
- ✅ SPRINT_STATE.md tracks cross-project progress
- ❌ BLUEPRINT.md missing from reese-reviews repo
- ❌ ROADMAP.md missing from reese-reviews repo
- ❌ INVESTORS_PACK.md missing (see docs/INVESTOR_DECK.md)

### Phase 2 — Design (PARTIALLY DONE)
- ✅ Steel/neutral brand system implemented
- ✅ Wireframes implicit in Dashboard.tsx / Generate.tsx
- ❌ GrowlingEyes design not started
- ❌ Mobile wireframes not created (Expo planned, not started)

### Phase 3 — Development (IN PROGRESS)
- ✅ Core modules (Tax, Vine, Amazon, Inventory, Reviews)
- ✅ LocalStorage persistence (all stores)
- ⚠️ Supabase wiring (partial)
- ❌ GrowlingEyes collector microservices
- ❌ Real social media API connections
- ❌ Production deployment

### Phase 4 — Testing (PARTIAL)
- ✅ Vitest setup with jsdom
- ✅ Basic component tests (SEOHead, StarRating)
- ⚠️ Store tests (reviewStore, amazonStore — exist but incomplete)
- ❌ E2E tests (Playwright)
- ❌ Load tests for Supabase queries
- ❌ Accessibility automated tests (axe-core)

### Phase 5 — Deployment (NOT STARTED)
- ❌ reesereviews.com DNS → DigitalOcean App Platform
- ❌ GitHub Actions CI/CD (test → build → deploy)
- ❌ Dockerfile optimization for production
- ❌ CDN setup (Cloudflare or DO Spaces)
- ❌ SSL certificate (auto-via Caddy or DO App Platform)

### Phase 6 — Compliance (PARTIALLY DONE)
- ✅ Proprietary license on repo
- ❌ Privacy Policy page
- ❌ Terms of Service page
- ❌ Cookie consent banner
- ❌ GDPR double opt-in for newsletter
- ❌ CAN-SPAM compliant unsubscribe

### Phase 7 — Maintenance (NOT STARTED)
- ❌ Monitoring: Uptime Robot (free) or DO Monitoring
- ❌ Error tracking: Sentry free tier
- ❌ Auto-CHANGELOG updates on GitHub push
- ❌ Weekly digest newsletter auto-generation
- ❌ Dependency update bot (Dependabot or Renovate)
- ❌ GrowlingEyes agent recurring checks (cron)

---

## 9. KANBAN CARDS — SPRINT-READY TASKS

*See also: `docs/KANBAN_CARDS.md` for full card format*

### 🔴 CRITICAL (Do This Week)

| ID | Card | Story Points | Assigned Agent |
|----|------|-------------|---------------|
| RR-001 | Deploy reesereviews.com to live DNS (DO App Platform or GitHub Pages) | 3 | DevOps Agent |
| RR-002 | Run all Supabase migrations (vine tables, marketing_leads) | 2 | DB Agent |
| RR-003 | Add Schema.org JSON-LD to index.html + SEOHead.tsx | 2 | SEO Agent |
| RR-004 | Wire GitHub Actions: test → build → deploy to DO | 3 | CI/CD Agent |
| RR-005 | Create Privacy Policy + Terms of Service pages | 2 | Legal Agent |

### 🟠 HIGH (Do This Sprint)

| ID | Card | Story Points | Assigned Agent |
|----|------|-------------|---------------|
| RR-006 | Implement double opt-in email flow (GDPR compliance) | 3 | Backend Agent |
| RR-007 | Add ADHD Mode to AccessibilityContext | 2 | Frontend Agent |
| RR-008 | Add Dyslexic Mode + OpenDyslexic font | 2 | Frontend Agent |
| RR-009 | Add No Blue Light Mode (amber/sepia palette) | 1 | Frontend Agent |
| RR-010 | Add ECO CODE Mode (no animations, minimal CSS) | 1 | Frontend Agent |
| RR-011 | Build campaign generator (20/50/100/200/500 buttons) | 5 | Full-stack Agent |
| RR-012 | Wire real social media webhooks (Make.com) | 3 | Integration Agent |
| RR-013 | Build BLUEPRINT.md and ROADMAP.md | 2 | Docs Agent |
| RR-014 | Sitemap.xml auto-generation (vite plugin or script) | 1 | DevOps Agent |
| RR-015 | Affiliate auto-linker utility (meetaudreyeva-20) | 2 | Frontend Agent |

### 🟡 MEDIUM (Next Sprint)

| ID | Card | Story Points | Assigned Agent |
|----|------|-------------|---------------|
| RR-016 | Blog system with 20 AI-generated SEO posts | 8 | Content + LLM Agent |
| RR-017 | FAQ page with 50+ questions (schema markup) | 5 | Content + SEO Agent |
| RR-018 | 15 SEO landing pages (reviewer cities) | 8 | SEO Agent |
| RR-019 | Wire Plaid live connection (real bank sync) | 5 | Integration Agent |
| RR-020 | HeyGen + ElevenLabs live keys + test video | 3 | Media Agent |
| RR-021 | E2E tests with Playwright | 5 | QA Agent |
| RR-022 | Axe-core accessibility automated tests | 3 | QA Agent |
| RR-023 | GrowlingEyes repo creation + landing page | 5 | DevOps + Frontend |
| RR-024 | Telegram collector microservice (telethon) | 8 | Data Agent |
| RR-025 | Wildberries public API integration (product stream) | 5 | Data Agent |

### 🟢 FUTURE (Backlog)

| ID | Card | Story Points |
|----|------|-------------|
| RR-026 | Discord monitor for FOSS streams | 8 |
| RR-027 | Gitee trending monitor | 5 |
| RR-028 | GitHub trending monitor | 3 |
| RR-029 | Reddit r/amazonvine monitor (PRAW) | 3 |
| RR-030 | JD.com / Rakuten review stream ingestion | 13 |
| RR-031 | Reviewer reputation score system | 13 |
| RR-032 | Agent rental marketplace proof-of-concept | 21 |
| RR-033 | Provisional patent filing (ETV tax module) | 5 |
| RR-034 | Provisional patent filing (FOSS stream scoring) | 5 |
| RR-035 | GrowlingEyes OSINT dashboard (full build) | 40 |
| RR-036 | ReviewChain federated marketplace prototype | 40 |
| RR-037 | Expo (React Native) mobile app | 40 |
| RR-038 | Amazon.co.jp integration (Japanese Vine data) | 13 |
| RR-039 | Mercado Libre integration (Brazil) | 8 |
| RR-040 | Shopee integration (SEA) | 8 |

---

## 10. INVESTOR SLIDES SUMMARY

*See `docs/INVESTOR_DECK.md` for full slide content*

### Slide Structure (12-Slide Standard Deck)

| Slide | Title | Key Message |
|-------|-------|-------------|
| 1 | Cover | Reese Reviews — The Reviewer Intelligence OS |
| 2 | The Problem | 200,000 Amazon Vine Voices have zero professional tools |
| 3 | The Solution | First-ever FOSS-first reviewer business OS |
| 4 | Market Size | $4.7B TAM: Review analytics + OSINT + Social listening |
| 5 | Product Demo | Dashboard walkthrough — Tax, Vine, Lifecycle, Publishing |
| 6 | Blue Ocean Map | Why we win: reviewer-side vs. seller-side red ocean |
| 7 | Revenue Model | SaaS tiers + Affiliate + Data licensing + Agent rental |
| 8 | Traction | Freedom Angel Corp (2010), SBA certified, PMI, American Legion |
| 9 | GrowlingEyes | The OSINT engine that feeds the platform |
| 10 | Roadmap | Q2 2026: Live deploy; Q3: GrowlingEyes; Q4: ReviewChain |
| 11 | Team | Audrey Evans + AI agent workforce (OpenRouter multi-model) |
| 12 | The Ask | $250K seed: 12 months runway, team of 3 + AI agents |

### Financial Projections (Conservative)

| Year | Subscribers | MRR | ARR |
|------|-------------|-----|-----|
| 2026 Q4 | 50 | $1,450 | $17,400 |
| 2027 Q2 | 250 | $7,250 | $87,000 |
| 2027 Q4 | 1,000 | $29,000 | $348,000 |
| 2028 | 5,000 | $145,000 | $1,740,000 |

*Assumptions: 40% Starter ($9), 40% Pro ($29), 20% Business ($99) mix*

### Grant Opportunities (Non-Dilutive)

| Grant | Amount | Eligibility | Deadline |
|-------|--------|-------------|----------|
| SBA SBIR Phase I | $150K | SBA certified (✅ FAC) | Rolling |
| NSF SBIR (accessibility tech) | $250K | Minority-owned + disability tech (✅) | Rolling |
| DOD SBIR (veteran tech) | $150K | Veteran-affiliated (✅ American Legion) | Rolling |
| State of Colorado Tech Fund | $50K | Colorado entity (✅ FAC is CO) | Annual |
| Knight Foundation (media) | $35K | Investigative journalism angle (✅ Angel Reporter) | Annual |
| Mozilla Open Source | $10K–$50K | FOSS project (✅ if open-sourced) | Rolling |

---

## 11. AI AGENT ROSTER — MAINTENANCE & GROWTH

### Core Agent Stack (Active Now)

| Agent | Platform | Role | Access |
|-------|----------|------|--------|
| **MindMappr** | Telegram + Slack | Primary orchestrator + research | RISINGALOHA group + @googlieeyes_bot |
| **GitHub Copilot** | GitHub | Code generation + PR review | All repos |
| **OpenRouter Router** | API | Free-first LLM routing | MiMo → Trinity → Venice → Llama 3.3 → DeepSeek |

### Recommended New Agents

| Agent | Purpose | Build With | Priority |
|-------|---------|-----------|----------|
| **GrowlingEyes Collector** | Telegram/Discord/GitHub stream monitor | Python + telethon + discord.py | HIGH |
| **SEO Auto-Blogger** | Auto-generate 20+ blog posts weekly | OpenRouter + LangChain | HIGH |
| **Patent Scout** | Monitor USPTO/Google Patents for competitor filings | Python + requests + Google Patents API | MEDIUM |
| **Changelog Auto-Writer** | Auto-update CHANGELOG.md on every push | GitHub Actions + GPT-4o-mini | HIGH |
| **Accessibility Auditor** | Run axe-core + WAVE on every deploy | GitHub Actions + Playwright | MEDIUM |
| **Social Distributor** | Real-post to Facebook/Instagram/TikTok/LinkedIn | Make.com webhooks + GoHighLevel | HIGH |
| **Tax Filing Assistant** | Auto-prepare quarterly estimated tax packages | OpenRouter + taxStore data | MEDIUM |
| **Vine Product Recommender** | Suggest which Vine items to prioritize reviewing | Local Llama 3.3 + inventory data | LOW |
| **International Stream Monitor** | Watch Wildberries/Mercado Libre/Shopee for new products | Python + requests | MEDIUM |
| **Review Quality Guardian** | Check generated reviews for Amazon TOS compliance | OpenRouter + custom rules | HIGH |

### Agent Communication Architecture

```
User (Audrey) → Telegram (@googlieeyes_bot / RISINGALOHA)
                    ↓
              MindMappr (orchestrator)
                    ↓
    ┌───────────────┼───────────────────┐
    ↓               ↓                   ↓
GrowlingEyes   SEO Blogger      Changelog Writer
Collector      (Make.com)       (GitHub Actions)
    ↓               ↓                   ↓
Supabase DB    Reese Reviews     GitHub PR
    ↓               UI
WebSocket push
    ↓
Reese Reviews
"Hot Incoming" tab
```

### Maintenance Schedule

| Task | Frequency | Agent | Trigger |
|------|-----------|-------|---------|
| Telegram stream scan | Every 4 hours | GrowlingEyes Collector | Cron job |
| GitHub trending update | Daily | International Stream Monitor | Cron |
| Gitee trending update | Daily | International Stream Monitor | Cron |
| SEO blog post generation | Weekly | SEO Auto-Blogger | Cron Monday 9am |
| Accessibility audit | On every deploy | Accessibility Auditor | GitHub Actions |
| Dependency security scan | Weekly | Dependabot | GitHub Actions |
| CHANGELOG update | On every commit | Changelog Auto-Writer | GitHub Actions |
| Patent monitor | Weekly | Patent Scout | Cron Friday |
| Quarterly tax prep | Quarterly | Tax Filing Assistant | Calendar event |
| SPRINT_STATE.md update | End of every session | MindMappr | Manual trigger |

---

## 12. REVVEL STANDARDS COMPLIANCE CHECKLIST

**For agents working on Reese Reviews — verify ALL before closing any PR:**

### Code Standards
- [ ] TypeScript strict mode (no `any`)
- [ ] All functions have type annotations
- [ ] No hardcoded secrets in code (use env vars)
- [ ] Error handling on all async operations
- [ ] FOSS libraries only (check licenses)

### Branding
- [ ] Steel/neutral palette only (no purple, orange, green)
- [ ] CSS utilities: `gradient-steel`, `glass-card`, `steel-border` used
- [ ] Brand name consistently "Reese-Reviews" or "Reese Reviews"

### Accessibility
- [ ] WCAG AA minimum on all new pages
- [ ] Focus indicators visible
- [ ] Alt text on all images
- [ ] ARIA labels on interactive elements

### SEO
- [ ] `<title>` tag on all pages
- [ ] Meta description on all pages
- [ ] Open Graph tags on all pages
- [ ] Schema.org JSON-LD on all pages

### Documentation
- [ ] CHANGELOG.md updated
- [ ] README.md accurate
- [ ] JSDoc on exported functions
- [ ] Inline comments on non-obvious logic only

### Testing
- [ ] New functionality has unit tests
- [ ] No existing tests removed
- [ ] Vitest passes: `npm run test`
- [ ] Build succeeds: `npm run build`
- [ ] Lint passes: `npm run lint`

---

## 13. GROWLINGEYES INTEGRATION PLAN

### What GrowlingEyes Is (in context of Reese Reviews)

**GrowlingEyes** is the data intelligence arm — the "eyes" that watch the internet for:
1. New FOSS products about to appear on Vine
2. Competitor reviewer activity
3. Emerging categories nobody else is tracking
4. Potential IP infringement on Audrey's patents/trademarks

### Phase 1 — Minimal GrowlingEyes (2 weeks)
- Create `MIDNGHTSAPPHIRE/growlingeyes` repo
- Landing page at `growlingeyes.com`
- Basic Telegram stream monitor (top 5 channels)
- Push alerts to existing MindMappr bot
- Wire "Hot Incoming" panel in Reese Reviews Vine tab

### Phase 2 — GrowlingEyes Dashboard (1 month)
- Full dark OSINT dashboard (glassmorphism dark, claw-crimson accents)
- Real-time stream feed with category filters
- Product detail cards with affiliate links
- Export to CSV / Supabase

### Phase 3 — GrowlingEyes SaaS (3 months)
- Subscription tiers ($49/$149/$299/mo)
- White-label API for other reviewers
- International stream support (Wildberries, Mercado Libre, Shopee)
- Agent reputation scoring module

### GrowlingEyes Brand Colors

| Token | Hex | Use |
|-------|-----|-----|
| Claw Crimson | #E63946 | Alerts, danger indicators |
| Midnight Black | #0D0D0D | Background |
| Steel Silver | #9BA3AF | Body text |
| Storm Volt | #FFD93D | Active indicators |
| Revvel Gold | #FFB347 | Accents, CTAs |

---

## 14. IMMEDIATE NEXT ACTIONS

**For the next agent session — do these in order:**

1. **[30 min]** Create `docs/KANBAN_CARDS.md`, `docs/INVESTOR_DECK.md`, `docs/AGENT_ROSTER.md`, `docs/BLUE_OCEAN_RESEARCH.md`, `docs/FOSS_STREAMS_INTELLIGENCE.md` (companion docs to this file)

2. **[1h]** Add Schema.org JSON-LD to `index.html` and `src/components/SEOHead.tsx`

3. **[1h]** Add all 4 missing accessibility modes to `AccessibilityContext.tsx`

4. **[2h]** Wire GitHub Actions CI/CD: `.github/workflows/ci.yml` and `.github/workflows/deploy.yml`

5. **[30 min]** Create `sitemap.xml` generation script + add to build pipeline

6. **[1h]** Update `NewsletterSignup.tsx` with double opt-in flow

7. **[2h]** Build campaign generator component (20/50/100/200/500 OpenRouter-powered)

8. **[3h]** Create GrowlingEyes repo + landing page + Telegram monitor microservice stub

9. **[1h]** File this document in `docs/STRATEGIC_MASTER_PLAN.md` ← **YOU ARE HERE**

10. **[End of session]** Update `SPRINT_STATE.md` in `revvel-standards` repo

---

*Last updated: March 27, 2026 — Generated by GitHub Copilot Agent via EXRUP methodology*  
*Next review: April 3, 2026 (weekly)*  
*Owner: Audrey Evans / MIDNGHTSAPPHIRE*
