# Reese Reviews — Complete Business Platform

A production-ready review business platform built for **Reese**, featuring tax-first Vine tracking, affiliate marketing automation, email newsletters, and comprehensive SEO infrastructure.

**Live at:** https://reesereviews.com

---

## 🎯 Core Features

### 1. **Review Platform**
- Submit reviews with photos, star ratings, and detailed descriptions
- Browse reviews by category (Products, Food/Restaurants, Services, Entertainment, Tech)
- Search and filter reviews
- Featured/trending reviews section
- Full accessibility support (Neurodivergent, ECO CODE, No Blue Light modes)

### 2. **Amazon Reviews Integration**
- Import your own Amazon Vine/purchase reviews directly into the app
- **Demo mode** — works out-of-the-box without any credentials
- **HTML import** — paste your Amazon review page source to extract reviews
- **Cookie mode** — live server-side scraper using `AMAZON_SESSION_COOKIE` (requires server proxy)
- Anonymised display — reviewer handles are never stored or shown
- Quick affiliate link generator: ASIN → `https://amazon.com/dp/{ASIN}?tag={tag}`
- See [`docs/amazon-integration.md`](docs/amazon-integration.md) for full setup instructions

### 3. **Amazon Vine & Tax Tracking**
- Native Vine scraper (no Chrome extension needed)
- Track all Vine items: pending, completed, deadline tracking
- **ETV (Estimated Tax Value) tracking** — all Vine income reported to IRS
- Tax dashboard with:
  - Annual/quarterly/monthly ETV reports
  - 1099-NEC reconciliation
  - Capital gains/losses tracking
  - Donation tracking (6-month capital contribution)
  - Tax-ready CSV/PDF exports for accountant

### 3. **Inventory Management**
- Track all products received (purchased + Vine)
- Status pipeline: In Use → Reviewed → Ready to Resell → Donated
- Cost basis and capital gains calculations
- Donation tracking with FMV (Fair Market Value) for tax deductions
- 6-month donation cycle to rental company

### 4. **Affiliate Marketing Automation Engine**
- **6 Affiliate Links** embedded throughout:
  - Make.com (20% recurring)
  - GoHighLevel (40% recurring)
  - VideoGen (30% recurring)
  - Chime ($50 per signup)
  - DigitalOcean ($25 credit + $25)
  - Monday.com (20% recurring)
- **Campaign Generator** (OpenRouter LLM):
  - 20/50/100/200/500 post tiers
  - Platform-specific formatting: Facebook, Instagram, TikTok, Twitter, LinkedIn, Pinterest
  - Auto-embed affiliate links naturally
  - Unique variations per post
- **Make.com Webhook Integration** for auto-posting
- Campaign analytics and click tracking

### 5. **Email Collection & Newsletter System**
- Subscribe forms (footer, popup, sidebar, page)
- Double opt-in with confirmation email (GDPR/CAN-SPAM compliant)
- Encrypted subscriber database
- Segmentation by source page and interests
- **Newsletter Templates** (auto-generated via OpenRouter):
  - New app launch
  - Weekly digest
  - Review roundup
  - Deal spotlight
  - Seasonal promotions
- Affiliate links auto-embedded in every newsletter
- Unsubscribe link in every email
- Subscriber dashboard with growth charts and delivery stats

### 6. **SEO Infrastructure**

#### About Section (10 Sub-Pages)
- About Us
- About the Team
- About the Technology
- About Our Mission
- About Our Partners
- Press & Media
- Careers
- Testimonials
- Awards
- Contact

#### Blog System
- 20+ auto-generated posts via OpenRouter LLM
- Categories: How-To, Industry News, Product Updates, Tips & Tricks, Case Studies
- Schema.org markup on every post
- RSS feed (XML)
- Post views and engagement tracking

#### FAQ System
- 50+ questions at launch
- 6 categories: Getting Started, Pricing, Features, Technical, Legal, Accessibility
- FAQPage schema markup for Google rich snippets
- Searchable with instant filter
- Helpful/not helpful voting

#### Technical SEO
- `sitemap.xml` auto-generated
- `robots.txt` with crawl directives
- Schema.org markup on every page
- Open Graph tags
- Twitter Cards
- Canonical URLs
- Breadcrumb navigation

#### Backlink Strategy (1000+ links)
- Internal backlinks (every page links to 5-10 others)
- Cross-app backlinks to all Revvel apps
- Blog-to-page links
- 15-50 SEO landing pages
- Directory submissions
- Social profile backlinks
- Guest post templates

### 7. **Business Dashboard**
- Vine tracking and auto-sync
- Inventory management
- Tax reporting
- Financial P&L (stub for Plaid integration)
- Resale/rental pipeline

---

## 🏗️ Architecture

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite
- **UI:** Tailwind CSS + shadcn-ui + Framer Motion
- **Styling:** Glassmorphism dark theme with accessibility modes
- **State:** React hooks + localStorage (production: Supabase)
- **LLM:** OpenRouter API (GPT-4o-mini)
- **Automation:** Make.com webhooks, Puppeteer (Vine scraping)
- **Testing:** Vitest + React Testing Library

### File Structure
```
src/
├── pages/
│   ├── Index.tsx              # Home page
│   ├── Reviews.tsx            # Review listing
│   ├── ReviewDetail.tsx        # Single review
│   ├── Categories.tsx          # Category browser
│   ├── About.tsx              # About page
│   ├── Contact.tsx            # Contact form
│   ├── SubmitReview.tsx        # Review submission
│   ├── Business.tsx           # Business dashboard
│   ├── Marketing.tsx          # Marketing hub
│   ├── Blog.tsx               # Blog listing
│   ├── FAQ.tsx                # FAQ page
│   └── NotFound.tsx           # 404 page
├── components/
│   ├── Navbar.tsx             # Navigation
│   ├── Footer.tsx             # Footer
│   ├── HeroSection.tsx         # Hero banner
│   ├── ReviewCard.tsx          # Review card component
│   ├── StarRating.tsx          # Star rating component
│   ├── AccessibilityToggle.tsx # Accessibility mode switcher
│   ├── TaxDashboard.tsx        # Tax tracking UI
│   ├── VineDashboard.tsx       # Vine tracking UI
│   ├── VineCookieManager.tsx   # Vine scraper settings
│   ├── InventoryManager.tsx    # Inventory tracking
│   └── SEOHead.tsx             # SEO meta tags
├── contexts/
│   └── AccessibilityContext.tsx # Accessibility mode provider
├── lib/
│   ├── reviewStore.ts          # Review state management
│   ├── businessTypes.ts        # Business data types
│   ├── amazonStore.ts          # Amazon integration
│   ├── taxStore.ts             # Tax tracking
│   ├── taxTypes.ts             # Tax types
│   ├── vineScraper.ts          # Vine scraper service
│   ├── affiliateTypes.ts        # Affiliate link types
│   ├── affiliateStore.ts        # Campaign generator & affiliate links
│   ├── emailTypes.ts            # Email/newsletter types
│   ├── emailStore.ts            # Email management
│   ├── seoTypes.ts              # SEO/blog/FAQ types
│   ├── seoStore.ts              # Blog/FAQ/sitemap generation
│   └── utils.ts                 # Utility functions
├── test/
│   ├── setup.ts                 # Test configuration
│   └── *.test.tsx               # Component tests
├── index.css                     # Global styles + accessibility modes
├── App.tsx                       # Main app component
└── main.tsx                      # Entry point
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm
- OpenRouter API key (for campaign generation)

### Installation
```bash
git clone https://github.com/MIDNGHTSAPPHIRE/steel-white.git
cd steel-white
npm install
```

### Development
```bash
npm run dev
```
Open http://localhost:5173

### Production Build
```bash
npm run build
npm run preview
```

---

## 📊 Key Data Models

### Review
```typescript
{
  id: string
  slug: string
  title: string
  content: string
  category: "products" | "food" | "services" | "entertainment" | "tech"
  rating: 1-5
  images: string[]
  author: string
  created_at: ISO string
  updated_at: ISO string
}
```

### Vine Item (Tax-First)
```typescript
{
  id: string
  asin: string
  product_name: string
  category: string
  etv: number  // Estimated Tax Value — CRITICAL for IRS reporting
  status: "pending" | "completed" | "expired"
  received_date: ISO string
  review_deadline: ISO string
  reviewed_at?: ISO string
  donated_at?: ISO string  // After 6 months
  donation_value: number   // FMV for tax deduction
}
```

### Campaign
```typescript
{
  id: string
  type: "product_review" | "affiliate_promo" | ...
  tier: 20 | 50 | 100 | 200 | 500
  platforms: ["facebook", "instagram", ...]
  affiliate_links: string[]
  status: "draft" | "generating" | "ready" | "scheduled" | "sent"
  generated_count: number
}
```

### Subscriber
```typescript
{
  id: string
  email: string
  name?: string
  interests?: string[]
  source_page: string
  status: "pending" | "confirmed" | "unsubscribed"
  confirmation_token?: string
  confirmed_at?: ISO string
  email_count: number
  open_count: number
  click_count: number
}
```

---

## 🔐 Accessibility

Three priority modes:
1. **Neurodivergent** — Simplified layout, reduced cognitive load, clear hierarchy
2. **ECO CODE** — Reduced animations, minimal data usage, performance optimized
3. **No Blue Light** — Warm color scheme, reduced eye strain

Toggle via the accessibility button in the navbar. Settings persist in localStorage.

---

## 💰 Monetization

### Affiliate Links
- 6 affiliate programs embedded throughout the platform
- Auto-embedded in every campaign and newsletter
- Click and conversion tracking
- Analytics dashboard

### Revenue Streams
1. **Affiliate commissions** — 20-40% recurring on SaaS, flat fees on others
2. **Sponsored reviews** — Direct partnerships with brands
3. **Premium features** (future) — Advanced analytics, priority reviews
4. **Email sponsorships** — Sponsored segments in newsletters

---

## 📈 SEO Strategy

### On-Page
- Schema.org markup on every page
- Open Graph and Twitter Card tags
- Canonical URLs
- Meta descriptions
- Keyword optimization

### Technical
- Sitemap.xml (auto-generated)
- Robots.txt with crawl directives
- Mobile-responsive design
- Fast load times (Vite optimization)
- Accessibility (WCAG 2.1 AA)

### Off-Page
- 1000+ backlinks via:
  - Internal linking (5-10 per page)
  - Cross-app links to Revvel ecosystem
  - Blog-to-page links
  - SEO landing pages (15-50)
  - Directory submissions
  - Social profiles
  - Guest post templates

---

## 🧪 Testing

```bash
npm run test                    # Run all tests
npm run test:watch             # Watch mode
npm run test:coverage          # Coverage report
```

**Test Coverage:**
- Unit tests for stores (reviewStore, affiliateStore, emailStore, seoStore)
- Component tests (StarRating, AccessibilityToggle, SEOHead)
- Integration tests for accessibility modes

---

## 📝 Documentation

- **CHANGELOG.md** — Version history and feature releases
- **LICENSE** — Proprietary (All Rights Reserved, Audrey Evans / GlowStarLabs)
- **API Documentation** — See `/docs/API.md` (future)
- **Deployment Guide** — See `/docs/DEPLOYMENT.md` (future)

---

## 🔗 Affiliate Links

- **Make.com:** https://www.make.com/en/register?pc=risingaloha
- **GoHighLevel:** https://www.gohighlevel.com/?fp_ref=audrey51
- **VideoGen:** https://videogen.io/?fpr=audrey21
- **Chime:** https://www.chime.com/r/audreyevans44/?c=s
- **DigitalOcean:** https://m.do.co/c/fe8240d60588
- **Monday.com:** https://try.monday.com/9828lfh0uct0

---

## 🤝 Contributing

This is a proprietary platform. Contributions are not accepted at this time.

---

## 📞 Support

- **Email:** support@reesereviews.com
- **Contact Form:** https://reesereviews.com/contact
- **FAQ:** https://reesereviews.com/faq

---

## 📄 License

All Rights Reserved © 2024 Audrey Evans / GlowStarLabs

This software is proprietary and confidential. Unauthorized copying, modification, or distribution is prohibited.

---

## 🙏 Acknowledgments

- Built with [React](https://react.dev)
- Styled with [Tailwind CSS](https://tailwindcss.com) and [shadcn-ui](https://ui.shadcn.com)
- Animations with [Framer Motion](https://www.framer.com/motion)
- LLM integration via [OpenRouter](https://openrouter.ai)
- Accessibility testing with [axe DevTools](https://www.deque.com/axe/devtools/)

---

**Built with ❤️ for Reese**
