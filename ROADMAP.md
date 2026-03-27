# ROADMAP — Reese Reviews + GrowlingEyes
**Version:** 1.0.0  
**Date:** March 27, 2026  
**Horizon:** 18 months (Q2 2026 → Q3 2027)  
**Standard:** Revvel EXRUP — Required Artifact

---

## VISION STATEMENT
> By Q4 2026, Reese Reviews is the undisputed standard platform for Amazon Vine Voice business management. By Q3 2027, GrowlingEyes is the leading OSINT intelligence tool for product reviewers and brand scouts globally.

---

## Q2 2026 — PRODUCTION FOUNDATIONS (Now)

**Theme:** Get live. Get real data. Get compliant.

| Milestone | Owner | ETA |
|-----------|-------|-----|
| ✅ Unified dashboard complete (Tax, Vine, Reviews, Social) | Done | Done |
| 🚀 reesereviews.com deployed to live DNS | DevOps | April 2026 |
| 🚀 All Supabase migrations applied | DB | April 2026 |
| 🚀 Schema.org JSON-LD on all pages | SEO | April 2026 |
| 🚀 GitHub Actions CI/CD pipeline | CI/CD | April 2026 |
| 🚀 Privacy Policy + Terms of Service | Legal | April 2026 |
| 🚀 GDPR double opt-in email flow | Backend | April 2026 |
| 🚀 4 missing accessibility modes | Frontend | May 2026 |
| 🚀 Campaign generator (20/50/100/200/500) | Full-stack | May 2026 |
| 🚀 Real Make.com social webhooks | Integration | May 2026 |
| 🚀 Sitemap.xml auto-generation | DevOps | May 2026 |
| 🚀 Affiliate auto-linker utility | Frontend | May 2026 |
| 🚀 Blog system (20+ AI posts) | Content | May 2026 |
| 🚀 FAQ page (50+ questions) | Content | June 2026 |
| 🚀 15 SEO landing pages | SEO | June 2026 |
| 🚀 GrowlingEyes repo + landing page | DevOps | June 2026 |
| 🚀 Telegram collector microservice | Data | June 2026 |

**Q2 Success Metric:** reesereviews.com live, 10+ users signed up, Google indexing confirmed.

---

## Q3 2026 — INTELLIGENCE LAYER + REAL DATA

**Theme:** Connect real data streams. Launch GrowlingEyes publicly.

| Milestone | Owner | ETA |
|-----------|-------|-----|
| Plaid live bank sync | Integration | July 2026 |
| HeyGen + ElevenLabs live video test | Media | July 2026 |
| GrowlingEyes: GitHub + Gitee collectors | Data | July 2026 |
| GrowlingEyes: Wildberries stream | Data | July 2026 |
| GrowlingEyes: Reddit (r/AmazonVine) | Data | August 2026 |
| "Hot Incoming" panel in Reese Reviews Vine tab | Frontend | August 2026 |
| @googlieeyes_bot alert system | Bot | August 2026 |
| GrowlingEyes.com full launch | Marketing | September 2026 |
| E2E tests with Playwright | QA | September 2026 |
| Axe-core accessibility automated tests | QA | September 2026 |
| Provisional patent: ETV tax module | Legal | September 2026 |
| Provisional patent: FOSS stream scoring | Legal | September 2026 |
| First 50 paying subscribers | Sales | September 2026 |

**Q3 Success Metric:** 50 paying subscribers ($1,450 MRR), GrowlingEyes.com live with working stream feed.

---

## Q4 2026 — MONETIZATION + SCALE

**Theme:** Turn the intelligence engine into revenue.

| Milestone | Owner | ETA |
|-----------|-------|-----|
| GrowlingEyes SaaS subscription tiers live | Full-stack | October 2026 |
| GrowlingEyes Discord monitor | Data | October 2026 |
| 15 SEO landing pages (cities/niches) expansion to 50 | SEO | October 2026 |
| Blog: 100+ posts total | Content | October 2026 |
| Reviewer reputation score beta | Full-stack | November 2026 |
| International streams: Mercado Libre | Data | November 2026 |
| International streams: Shopee | Data | November 2026 |
| SBIR Phase I application submitted | Legal | November 2026 |
| 500 paying subscribers ($14,500 MRR) | Sales | December 2026 |
| Odoo ERP live connection | Integration | December 2026 |

**Q4 Success Metric:** $14,500 MRR, SBIR submitted, provisional patents filed, GrowlingEyes SaaS with 20 B2B subscribers.

---

## Q1 2027 — MARKETPLACE + MOBILE

**Theme:** Platform network effects kick in.

| Milestone | Owner | ETA |
|-----------|-------|-----|
| Reviewer reputation score live (public) | Full-stack | January 2027 |
| ReviewChain marketplace proof-of-concept | Architecture | January 2027 |
| Expo React Native mobile app (iOS + Android) | Mobile | February 2027 |
| International: Japan (Amazon.co.jp + Rakuten) | Data | February 2027 |
| Agent rental marketplace proof-of-concept | Full-stack | March 2027 |
| 1,000 paying subscribers ($29,000 MRR) | Sales | March 2027 |
| SBIR Phase I decision | Legal | March 2027 |
| GrowlingEyes white-label API (B2B) | API | March 2027 |

**Q1 2027 Success Metric:** $29,000 MRR, mobile app on App Store + Play Store.

---

## Q2-Q3 2027 — CATEGORY LEADERSHIP

**Theme:** Become the unambiguous industry standard.

| Milestone | Owner | ETA |
|-----------|-------|-----|
| ReviewChain marketplace v1 launch | Full-stack | April 2027 |
| International: India (Flipkart + Meesho) | Data | April 2027 |
| International: Indonesia (Tokopedia) | Data | May 2027 |
| 2,500 paying subscribers ($72,500 MRR) | Sales | June 2027 |
| SBIR Phase II application ($1M potential) | Legal | June 2027 |
| Series A conversations or strategic acquisition | Finance | June 2027 |
| 5,000 subscribers ($145,000 MRR) | Sales | September 2027 |
| ReviewChain: cross-country reviewer intelligence | Full-stack | September 2027 |

**Q3 2027 Success Metric:** $145,000 MRR, SBIR Phase II submitted, category leadership confirmed.

---

## DEPENDENCY MAP

```
reesereviews.com live (RR-001) 
  → Supabase migrations (RR-002) 
    → Real Vine data
      → GrowlingEyes "Hot Incoming" (GE-002)
        → @googlieeyes_bot alerts
          → User engagement
            → Paying subscribers

Schema.org (RR-003) + Blog (RR-016) + FAQ (RR-017) + Landing pages
  → Google indexing
    → Organic traffic
      → Free user signups
        → SaaS conversions

Provisional patents (INV-001, INV-002)
  → SBIR Phase I eligibility
    → $150K grant
      → Accelerated development
```

---

## RISK REGISTER

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Amazon changes Vine program | Medium | High | Diversify to other reviewer programs (Google, Yelp) |
| OpenRouter free models deprecated | Low | Medium | Local Llama 3.3 fallback always available |
| Wildberries API blocks crawler | Low | Low | Other international streams available |
| SBIR not approved | Medium | Medium | Revenue path exists without grants |
| Discord API changes | Medium | Low | Telegram + Reddit fill the gap |
| Competitor copies features | High | Medium | Integration depth + entity age moat |

---

*End of ROADMAP.md*  
*March 27, 2026 — MIDNGHTSAPPHIRE / Freedom Angel Corps*
