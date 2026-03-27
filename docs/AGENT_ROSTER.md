# AGENT ROSTER — Reese Reviews + GrowlingEyes Ecosystem
**Version:** 1.0.0  
**Date:** March 27, 2026  
**Owner:** Audrey Evans / MIDNGHTSAPPHIRE  
**Purpose:** Complete catalog of AI agents in use, planned, and recommended for the ecosystem.

---

## SECTION 1 — ACTIVE AGENTS

### Agent 1: MindMappr
| Field | Value |
|-------|-------|
| **Name** | MindMappr |
| **Type** | Orchestrator / General-Purpose AI Agent |
| **Status** | ✅ Active |
| **Platform** | Telegram (@googlieeyes_bot) + Slack (RISINGALOHA) |
| **Backend** | Python + FastAPI on DO droplet 164.90.148.7:8080 |
| **LLM Stack** | OpenRouter: MiMo-V2-Flash → Trinity → Venice → Llama 3.3 → DeepSeek V3.2 |
| **Capabilities** | GitHub API, shell execution, file ops, email, research, code gen |
| **Repo** | MIDNGHTSAPPHIRE/mindmappr |
| **How to invoke** | @mention @googlieeyes_bot in RISINGALOHA Telegram group |

**Use for:** Cross-project coordination, research tasks, triggering other agents, answering questions about the codebase.

---

### Agent 2: GitHub Copilot
| Field | Value |
|-------|-------|
| **Name** | GitHub Copilot Coding Agent |
| **Type** | Code Generation + PR Review |
| **Status** | ✅ Active |
| **Platform** | GitHub (all MIDNGHTSAPPHIRE repos) |
| **Capabilities** | Code generation, PR creation, code review, bug fixing, documentation |
| **How to invoke** | Open issue → Assign to Copilot, or use Copilot Chat in IDE |

**Use for:** Feature implementation, bug fixes, refactoring, test writing.

---

## SECTION 2 — PLANNED AGENTS (Build This Quarter)

### Agent 3: GrowlingEyes Collector
| Field | Value |
|-------|-------|
| **Name** | GrowlingEyes Collector |
| **Type** | Data Harvesting / Stream Monitor |
| **Status** | 🔧 In Development |
| **Build With** | Python 3.12, telethon, discord.py, PyGithub, redis, fastapi |
| **Deployment** | Docker on DO droplet 164.90.148.7 (alongside MindMappr) |
| **Trigger** | Cron every 4 hours |
| **Output** | Supabase table: `stream_intelligence` + WebSocket push to Reese Reviews |

**Responsibilities:**
- Monitor Telegram channels: @fosspost, @itsfoss_official, @fossfinds, @opensourcesoftware
- Monitor Discord: Cult of Lunatics, The Linux Space, r/AmazonVine Discord
- Monitor GitHub Trending: daily top 25 repos across 5 categories
- Monitor Gitee Trending: daily top 10 repos
- Score each item (time-decay × uniqueness × relevance × source authority)
- Push score > 0.7 to Reese Reviews "Hot Incoming" panel
- Alert @googlieeyes_bot when score > 0.9

**Data Schema:**
```typescript
interface StreamItem {
  id: string;
  source: "telegram" | "discord" | "github" | "gitee" | "reddit" | "wildberries";
  content: string;
  url?: string;
  category: string;
  relevance_score: number;
  freshness_score: number;
  unique_score: number;
  composite_score: number;
  detected_at: string;
  alerted: boolean;
}
```

---

### Agent 4: SEO Auto-Blogger
| Field | Value |
|-------|-------|
| **Name** | SEO Auto-Blogger |
| **Type** | Content Generation |
| **Status** | 📋 Planned Q2 2026 |
| **Build With** | OpenRouter API + LangChain + Supabase + GitHub Actions |
| **Trigger** | Cron: Monday 9am MT |
| **Output** | 1 new blog post per week in Supabase `blog_posts` table |

**Post types (rotate weekly):**
1. Tax tip for Amazon Vine Voices
2. Product review strategy guide
3. Vine program update / news summary
4. "Top 10 Vine items this week" (from GrowlingEyes data)
5. Accessibility + reviewer tools guide

**Prompt template:**
```
You are an expert Amazon Vine reviewer and tax professional writing for reesereviews.com.
Write a 1200-word SEO blog post about: {topic}
Target keyword: {primary_keyword}
Secondary keywords: {keyword_list}
Include: H2 headers, internal links to /dashboard and /business, affiliate link placeholder [AMAZON_LINK:{asin}]
Tone: Professional but accessible. Audience is neurodivergent-friendly (clear, concise).
Entity: Freedom Angel Corp, founded 2010, by Audrey Evans.
```

---

### Agent 5: Changelog Auto-Writer
| Field | Value |
|-------|-------|
| **Name** | Changelog Auto-Writer |
| **Type** | Documentation |
| **Status** | 📋 Planned Q2 2026 |
| **Build With** | GitHub Actions + OpenRouter (GPT-4o-mini or Llama 3.3) |
| **Trigger** | Every push to `main` |
| **Output** | Updated `CHANGELOG.md` entry |

**Workflow:**
```yaml
# .github/workflows/changelog.yml
on:
  push:
    branches: [main]
jobs:
  update-changelog:
    steps:
      - Get commit diff (git diff HEAD~1)
      - Send to OpenRouter: "Summarize these code changes as a CHANGELOG entry"
      - Prepend to CHANGELOG.md
      - Commit: "chore: auto-update CHANGELOG [skip ci]"
```

---

### Agent 6: Social Distributor
| Field | Value |
|-------|-------|
| **Name** | Social Distributor |
| **Type** | Marketing Automation |
| **Status** | 📋 Planned Q2 2026 |
| **Build With** | Make.com webhooks + GoHighLevel API |
| **Trigger** | User clicks "Auto-Post" in Generate page |
| **Platforms** | Facebook, Instagram, TikTok, LinkedIn, Pinterest, Twitter/X |

**Make.com Scenario:**
```
Webhook (from Reese Reviews Generate page)
  → Parse: {platform, content, hashtags, scheduled_time, image_url}
  → Route by platform
  → Post via platform API
  → Return: {status, post_url}
```

---

### Agent 7: Accessibility Auditor
| Field | Value |
|-------|-------|
| **Name** | Accessibility Auditor |
| **Type** | QA / Compliance |
| **Status** | 📋 Planned Q2 2026 |
| **Build With** | GitHub Actions + Playwright + axe-core |
| **Trigger** | Every deploy |
| **Output** | Accessibility report in PR comment |

**Checks:**
- WCAG 2.1 AA compliance (axe-core)
- Color contrast ratios
- Keyboard navigation
- Screen reader announcements (ARIA)
- Focus indicators
- Alt text coverage

---

### Agent 8: Tax Filing Assistant
| Field | Value |
|-------|-------|
| **Name** | Tax Filing Assistant |
| **Type** | Financial Intelligence |
| **Status** | 📋 Planned Q3 2026 |
| **Build With** | OpenRouter + taxStore data + PDFiller API |
| **Trigger** | Quarterly (April 15, June 15, Sept 15, Jan 15) |
| **Output** | Pre-filled PDF tax forms + quarterly estimate calculations |

**Capabilities:**
- Pull all income sources from taxStore
- Calculate quarterly estimated tax (Form 1040-ES)
- Pre-fill Schedule C, SE, 8829, 4562
- Generate PDF via PDFiller API
- Send reminder via Telegram + email
- Flag anomalies (ETV spike, missing receipts, deduction opportunities)

---

### Agent 9: Patent Scout
| Field | Value |
|-------|-------|
| **Name** | Patent Scout |
| **Type** | IP Intelligence |
| **Status** | 📋 Planned Q3 2026 |
| **Build With** | Python + Google Patents API + USPTO EFT-S API |
| **Trigger** | Weekly (Friday) |
| **Output** | Patent alert email + Telegram message |

**Monitors for:**
- New patents mentioning: "amazon vine", "reviewer automation", "ETV tax", "FOSS stream scoring"
- Competitor patent filings (Amazon, Google, Intuit, H&R Block)
- International PCT filings in CPC class G06Q30 and G06Q40

---

### Agent 10: Review Quality Guardian
| Field | Value |
|-------|-------|
| **Name** | Review Quality Guardian |
| **Type** | Compliance + Quality |
| **Status** | 📋 Planned Q3 2026 |
| **Build With** | OpenRouter + Amazon TOS ruleset |
| **Trigger** | Before any review is published |
| **Output** | Compliance score + flagged phrases |

**Checks:**
- Amazon Community Guidelines compliance
- FTC disclosure requirements (affiliate disclosure if needed)
- Factual accuracy against product data
- AI fingerprint detection (runs metadataStripper before final)
- Length/quality threshold (minimum 150 words for Pro tier)

---

## SECTION 3 — FUTURE AGENTS (Backlog)

### Agent 11: International Stream Monitor
| Field | Value |
|-------|-------|
| **Name** | International Stream Monitor |
| **Type** | Global Market Intelligence |
| **Priority** | 🟡 Medium |
| **Build With** | Python + requests + playwright |

**Sources:**
| Source | Country | API | Method |
|--------|---------|-----|--------|
| Wildberries | Russia | Public REST (no auth) | requests |
| Mercado Libre | Brazil | Official SDK | mercadolibre-python |
| Shopee | SEA | Affiliate API | requests |
| JD.com | China | JD Open Platform | requests + HMAC auth |
| Rakuten | Japan | Rakuten API | requests |
| Flipkart | India | Flipkart Affiliate API | requests |

---

### Agent 12: Vine Product Recommender
| Field | Value |
|-------|-------|
| **Name** | Vine Product Recommender |
| **Type** | Intelligence / UX |
| **Priority** | 🟢 Low |
| **Build With** | Local Llama 3.3 + inventory history |

**Logic:**
- Analyze reviewer's history (reviewed categories, ratings, time-to-review)
- Cross-reference with GrowlingEyes stream scores
- Recommend: "These 5 products match your review history + are trending in your categories"

---

### Agent 13: Reviewer Reputation Engine
| Field | Value |
|-------|-------|
| **Name** | Reviewer Reputation Engine |
| **Type** | Trust / Marketplace |
| **Priority** | 🔵 Innovation |
| **Build With** | Python + PostgreSQL + OpenRouter |

**Composite Score Formula:**
```
ReputationScore = (
  (review_count × 0.2) +
  (avg_review_length × 0.1) +
  (category_depth × 0.2) +
  (time_consistency × 0.15) +
  (media_quality_score × 0.15) +
  (affiliate_performance × 0.1) +
  (compliance_score × 0.1)
) × 100
```

---

## SECTION 4 — AGENT ORCHESTRATION DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                   USER (Audrey Evans)                        │
│         Telegram: @googlieeyes_bot or direct UI             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
              ┌─────────────────┐
              │   MindMappr     │ ← Primary Orchestrator
              │ (Telegram/Slack)│
              └────────┬────────┘
                       │
        ┌──────────────┼──────────────────────┐
        ↓              ↓                       ↓
┌───────────────┐ ┌──────────────┐  ┌────────────────────┐
│  GitHub       │ │ GrowlingEyes │  │  SEO Auto-Blogger  │
│  Copilot      │ │ Collector    │  │  (Make.com)        │
│  (Code PRs)   │ │ (Data)       │  │  (Blog posts)      │
└───────┬───────┘ └──────┬───────┘  └─────────┬──────────┘
        │                │                     │
        ↓                ↓                     ↓
┌───────────────┐ ┌──────────────┐  ┌────────────────────┐
│  GitHub Repo  │ │  Supabase DB │  │  Supabase          │
│  (Code)       │ │  stream_intel│  │  blog_posts table  │
└───────────────┘ └──────┬───────┘  └────────────────────┘
                         │
                         ↓
                 ┌───────────────┐
                 │ Reese Reviews │
                 │ "Hot Incoming"│
                 │ UI Panel      │
                 └───────────────┘
                         │
                         ↓
              ┌──────────────────────┐
              │  Social Distributor  │
              │  (Make.com webhooks) │
              └──────────────────────┘
                         │
            ┌────────────┼─────────────┐
            ↓            ↓             ↓
       Facebook    Instagram      TikTok/LinkedIn
```

---

## SECTION 5 — AGENT MAINTENANCE SCHEDULE

| Day/Time | Agent | Task |
|----------|-------|------|
| Every 4 hours | GrowlingEyes Collector | Scan Telegram/Discord/GitHub/Gitee |
| Daily 6am | International Stream Monitor | Wildberries + Shopee + Mercado Libre scan |
| Monday 9am | SEO Auto-Blogger | Generate + publish weekly blog post |
| On every commit | Changelog Auto-Writer | Update CHANGELOG.md |
| On every deploy | Accessibility Auditor | WCAG + axe-core scan |
| Weekly (Friday) | Patent Scout | USPTO + Google Patents monitor |
| Weekly (Sunday) | Dependabot | Dependency security scan |
| Quarterly | Tax Filing Assistant | Quarterly estimated tax prep |
| End of every sprint | MindMappr | Update SPRINT_STATE.md in revvel-standards |

---

## SECTION 6 — LLM MODEL ROUTING (FREE-FIRST)

**Priority order for all agents (cost-optimized):**

| Priority | Model | Provider | Cost | Use For |
|----------|-------|----------|------|---------|
| 1 | MiMo-V2-Flash | OpenRouter | Free | Fast tasks, classifications |
| 2 | Trinity | OpenRouter | Free | Multi-step reasoning |
| 3 | Venice-LLM | Venice.ai | Free | Privacy-sensitive tasks |
| 4 | Llama 3.3 70B | OpenRouter | Free | Large context, research |
| 5 | DeepSeek V3.2 | OpenRouter | Free tier | Code generation |
| 6 | Mistral 7B Instruct | OpenRouter | Free | Blog posts, summaries |
| 7 | GPT-4o-mini | OpenAI | $0.15/1M | Premium fallback |
| 8 | Claude Sonnet 4.5 | Anthropic | $3/1M | Complex reasoning only |

**Router logic:**
```python
def route_llm(task_type: str, context_length: int) -> str:
    if task_type == "classification" and context_length < 1000:
        return "mimo-v2-flash"
    elif task_type == "code_generation":
        return "deepseek/deepseek-v3-2"
    elif task_type == "blog_post" and context_length < 4000:
        return "mistralai/mistral-7b-instruct"
    elif task_type == "research" and context_length > 8000:
        return "meta-llama/llama-3.3-70b-instruct"
    else:
        return "gpt-4o-mini"  # premium fallback
```

---

*End of AGENT_ROSTER.md*  
*March 27, 2026 — MIDNGHTSAPPHIRE / Freedom Angel Corp*
