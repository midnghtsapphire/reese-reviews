# FOSS STREAMS INTELLIGENCE — Technical Implementation Guide
**Version:** 1.0.0  
**Date:** March 27, 2026  
**Project:** GrowlingEyes Intelligence Engine  
**Owner:** MIDNGHTSAPPHIRE / Freedom Angel Corps

---

## OVERVIEW

This document covers the complete technical architecture for the **GrowlingEyes FOSS Stream Intelligence Engine** — a background data harvesting system that monitors social media, messaging platforms, and code repositories to discover FOSS products and streams that mainstream reviewers haven't found yet.

The engine feeds directly into the Reese Reviews dashboard ("Hot Incoming" panel) and sends real-time alerts via @googlieeyes_bot in the RISINGALOHA Telegram group.

---

## SECTION 1 — DATA SOURCE CATALOG

### 1a. Telegram Channels (Public — No Bot Token Needed for Basic)

| Channel | Handle | Type | Relevance | Monitor Priority |
|---------|--------|------|-----------|-----------------|
| FOSS Post | @fosspost | News channel | Daily FOSS tool/product announcements | 🔴 High |
| It's FOSS | @itsfoss_official | News channel | Linux + consumer FOSS products | 🔴 High |
| Foss Finds | @fossfinds | Curated list | Undiscovered FOSS gems | 🔴 High |
| Open Source Software | @opensourcesoftware | Aggregator | Multi-category FOSS | 🟠 Medium |
| Awesome FOSS | @awesomefoss | Curated | Quality FOSS tools | 🟠 Medium |
| Linux News | @linuxnewsofficial | News | Linux + embedded products | 🟡 Low |
| Privacy Tools | @privacytools | Niche | Privacy-first products | 🟡 Low |
| RISINGALOHA | Internal | Own group | Internal coordination | 🔴 Always on |

**Technical note:** Telegram public channel history is accessible via:
- Web scraping `t.me/s/channelname` (no API token needed)
- Telegram Bot API (needs bot in channel)
- Telethon library (user-session, needs phone verification once)

---

### 1b. Discord Servers (Public — Read-Only with Server Join)

| Server | Focus | Channel to Monitor | Auth |
|--------|-------|-------------------|------|
| Cult of Lunatics | FOSS + Linux | #software-releases | Join required |
| The Linux Space | Open source dev | #new-projects | Join required |
| LibreDen | FOSS advocacy | #announcements | Join required |
| r/AmazonVine Discord | Vine reviewers | #product-alerts | Join required |
| ProductReview.com Discord | Review community | #general | Join required |
| FOSS Developers Group | Developer FOSS | #project-showcase | Join required |

**Technical note:** Discord monitoring requires:
- Creating a Discord bot application (free, no approval needed)
- Adding bot to target servers (requires server owner approval for private servers)
- For public servers: use discord.py + read_messages intent

---

### 1c. GitHub Trending (Public REST API)

**Endpoint:** `https://api.github.com/search/repositories`

**Queries to run daily:**
```python
queries = [
    "stars:>10 created:>2026-01-01 topic:hardware",
    "stars:>10 created:>2026-01-01 topic:raspberry-pi",
    "stars:>10 created:>2026-01-01 topic:smart-home",
    "stars:>5 created:>2026-01-01 topic:iot",
    "stars:>5 created:>2026-01-01 topic:consumer-electronics",
    "stars:>5 created:>2026-01-01 language:python topic:scraper",
    "stars:>100 pushed:>2026-01-01 topic:foss",
]
```

**Rate limits:** 5,000 requests/hour with token (free). Use GitHub token from MindMappr droplet.

---

### 1d. Gitee Trending (Public API — No Auth for Basic)

**Endpoint:** `https://gitee.com/explore/trending`

**API (no auth):**
```bash
# Get trending repos
curl "https://gitee.com/api/v5/repos/search?sort=updated&limit=20&q=hardware"
curl "https://gitee.com/api/v5/repos/search?sort=updated&limit=20&q=iot"
curl "https://gitee.com/api/v5/repos/search?sort=updated&limit=20&q=open-source-product"
```

**Key categories to watch:**
- IoT / hardware devices (many become Amazon-sold products)
- AI audio/video tools (often repurposed in reviewer workflows)
- CJK NLP models (for translation pipeline)
- Open source e-commerce integrations

---

### 1e. Reddit (PRAW — Free Tier)

**Subreddits to monitor:**
| Subreddit | Monitor For |
|-----------|-------------|
| r/AmazonVine | Vine Voice community posts, product tips |
| r/FOSS | New FOSS project announcements |
| r/opensource | General FOSS + product launches |
| r/selfhosted | Self-hosted software (often pre-Amazon) |
| r/linux | Hardware + software product announcements |
| r/DIY | Physical product innovations |
| r/homeautomation | Smart home devices (prime Vine candidates) |

**PRAW setup:**
```python
import praw

reddit = praw.Reddit(
    client_id="YOUR_CLIENT_ID",
    client_secret="YOUR_CLIENT_SECRET",
    user_agent="GrowlingEyes/1.0"
)

vine = reddit.subreddit("AmazonVine")
for post in vine.new(limit=25):
    process_post(post)
```

---

### 1f. Wildberries (Russia) — Public REST API — NO AUTH

**This is the most underexploited data source in existence for English-language tools.**

**Base URL:** `https://catalog.wb.ru`

**Key endpoints (all public, no auth, no rate limits found):**
```bash
# Get popular products in a category (electronics)
GET https://catalog.wb.ru/catalog/elektronika/v2/catalog?appType=1&curr=rub&dest=-455203&limit=25&sort=popular

# Get new products
GET https://catalog.wb.ru/catalog/elektronika/v2/catalog?appType=1&curr=rub&dest=-455203&limit=25&sort=newly

# Search
GET https://search.wb.ru/exactmatch/ru/common/v5/search?appType=1&curr=rub&dest=-1257786&query={search_term}&resultset=catalog&sort=popular
```

**Data you get back:**
```json
{
  "data": {
    "products": [
      {
        "id": 12345678,
        "name": "Product Name",
        "brand": "Brand Name",
        "price": 1500,
        "rating": 4.8,
        "feedbacks": 1234,
        "reviewRating": 4.9,
        "supplierId": 789
      }
    ]
  }
}
```

**Translation pipeline:** Use DeepL API (free tier: 500K chars/mo) or LibreTranslate (100% FOSS, self-hostable)

---

### 1g. Mercado Libre (Official SDK — Free)

```python
# pip install mercadolibre
from mercadolibre import MercadoLibre

ml = MercadoLibre()

# Get trending in Brazil
items = ml.search_items(site_id="MLB", query="electronics", sort="relevance", limit=25)
```

---

## SECTION 2 — SCORING ALGORITHM

### 2a. Time-Decay × Relevance Scoring

Every stream item receives a composite score (0.0 → 1.0):

```python
import math
from datetime import datetime, timedelta

def score_stream_item(item: StreamItem) -> float:
    """
    Composite score = Freshness × Uniqueness × Relevance × Authority
    
    Threshold:
    - score > 0.9: CRITICAL alert (Telegram + UI banner)
    - score > 0.7: HIGH alert (UI panel)
    - score > 0.5: MEDIUM (UI list)
    - score <= 0.5: LOG only (not shown)
    """
    
    # 1. Freshness: exponential decay with 10-hour half-life
    hours_old = (datetime.now() - item.detected_at).total_seconds() / 3600
    freshness = math.exp(-0.069 * hours_old)  # λ = ln(2)/10 = 0.069
    
    # 2. Uniqueness: inverse of normalized mention count
    # How rare is this item across our entire monitored corpus?
    global_mentions = get_mention_count(item.url or item.title, window_hours=72)
    max_mentions = get_max_mentions_in_window(window_hours=72)
    uniqueness = 1.0 - min(global_mentions / max_mentions, 1.0)
    
    # 3. Category Relevance: cosine similarity to Vine category embeddings
    # Pre-compute embeddings for: electronics, home, beauty, health, sports, toys
    item_embedding = embed_text(item.content)
    relevance = max(
        cosine_similarity(item_embedding, VINE_CATEGORY_EMBEDDINGS[cat])
        for cat in VINE_CATEGORY_EMBEDDINGS
    )
    
    # 4. Source Authority: pre-defined trust scores
    authority_map = {
        "telegram:fosspost": 0.95,
        "telegram:itsfoss_official": 0.90,
        "telegram:fossfinds": 0.88,
        "github:trending": 0.85,
        "gitee:trending": 0.75,
        "reddit:AmazonVine": 0.95,
        "reddit:opensource": 0.70,
        "wildberries:trending": 0.80,
        "discord:announcement": 0.65,
    }
    authority = authority_map.get(f"{item.source}:{item.channel}", 0.5)
    
    # Composite (weighted)
    composite = (
        freshness * 0.30 +
        uniqueness * 0.25 +
        relevance * 0.30 +
        authority * 0.15
    )
    
    return round(composite, 4)
```

---

### 2b. NLP Classifier (Local Llama 3.3 or MiMo-V2-Flash)

**Prompt for classification:**
```
You are a product intelligence system for Amazon Vine reviewers.

Classify this post into ONE category:
- PRODUCT: Mentions a physical or digital product available for purchase/review
- TOOL: A software tool useful for reviewers (image editing, writing, etc.)
- NEWS: Industry news with no specific product mention
- OPPORTUNITY: An open call for reviewers or testers
- SPAM: Promotional, irrelevant, or low-quality content

Post: {content}

Reply with ONLY the category word.
```

---

## SECTION 3 — MICROSERVICE ARCHITECTURE

### 3a. Docker Compose (runs on 164.90.148.7)

```yaml
# docker-compose.yml for GrowlingEyes on existing droplet
version: "3.9"

services:
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  telegram-collector:
    build: ./collectors/telegram
    environment:
      - TELEGRAM_API_ID=${TELEGRAM_API_ID}
      - TELEGRAM_API_HASH=${TELEGRAM_API_HASH}
      - REDIS_URL=redis://redis:6379
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_SERVICE_KEY}
    depends_on:
      - redis
    restart: unless-stopped

  github-collector:
    build: ./collectors/github
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    restart: unless-stopped

  wildberries-collector:
    build: ./collectors/wildberries
    environment:
      - REDIS_URL=redis://redis:6379
      - SUPABASE_URL=${SUPABASE_URL}
    depends_on:
      - redis
    restart: unless-stopped

  classifier:
    build: ./classifier
    environment:
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - REDIS_URL=redis://redis:6379
      - SUPABASE_URL=${SUPABASE_URL}
    depends_on:
      - redis
    restart: unless-stopped

  api:
    build: ./api
    ports:
      - "8090:8090"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_ANON_KEY}
    depends_on:
      - redis
    restart: unless-stopped

volumes:
  redis_data:
```

---

### 3b. Telegram Collector (telethon)

```python
# collectors/telegram/main.py
import asyncio
import json
import redis.asyncio as redis
from telethon import TelegramClient, events
from datetime import datetime

CHANNELS = [
    "fosspost",
    "itsfoss_official",
    "fossfinds",
    "opensourcesoftware",
    "awesomefoss",
]

async def main():
    client = TelegramClient("growlingeyes_session", API_ID, API_HASH)
    r = redis.from_url(REDIS_URL)
    
    await client.start()
    
    @client.on(events.NewMessage(chats=CHANNELS))
    async def handler(event):
        item = {
            "source": "telegram",
            "channel": event.chat.username,
            "content": event.message.message,
            "url": f"https://t.me/{event.chat.username}/{event.message.id}",
            "detected_at": datetime.utcnow().isoformat(),
        }
        await r.lpush("stream:raw", json.dumps(item))
    
    await client.run_until_disconnected()

asyncio.run(main())
```

---

### 3c. FastAPI WebSocket Endpoint (push to Reese Reviews UI)

```python
# api/main.py
from fastapi import FastAPI, WebSocket
from supabase import create_client
import asyncio
import json

app = FastAPI()

@app.websocket("/ws/hot-incoming")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    # Listen for new inserts to stream_intelligence table
    subscription = supabase.table("stream_intelligence") \
        .on("INSERT", lambda payload: asyncio.create_task(
            websocket.send_json(payload["new"])
        )).subscribe()
    
    try:
        while True:
            await asyncio.sleep(1)
    finally:
        supabase.remove_channel(subscription)
```

---

### 3d. Reese Reviews UI Hook (TypeScript)

```typescript
// src/hooks/useHotIncoming.ts
import { useState, useEffect } from "react";

export interface StreamItem {
  id: string;
  source: string;
  channel: string;
  content: string;
  url?: string;
  category: string;
  composite_score: number;
  detected_at: string;
}

export function useHotIncoming() {
  const [items, setItems] = useState<StreamItem[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(
      import.meta.env.VITE_GROWLINGEYES_WS_URL || "ws://localhost:8090/ws/hot-incoming"
    );

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event) => {
      const item: StreamItem = JSON.parse(event.data);
      setItems((prev) => [item, ...prev].slice(0, 50)); // Keep last 50
    };

    return () => ws.close();
  }, []);

  return { items, connected };
}
```

---

## SECTION 4 — SUPABASE SCHEMA

```sql
-- supabase/migrations/20260327_growlingeyes_streams.sql

CREATE TABLE IF NOT EXISTS stream_intelligence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,        -- 'telegram' | 'discord' | 'github' | 'gitee' | 'wildberries'
  channel TEXT NOT NULL,       -- channel/server/repo name
  content TEXT NOT NULL,       -- raw post/description text
  url TEXT,                    -- link to original
  category TEXT NOT NULL DEFAULT 'NEWS',  -- PRODUCT | TOOL | NEWS | OPPORTUNITY | SPAM
  freshness_score DECIMAL(5,4),
  uniqueness_score DECIMAL(5,4),
  relevance_score DECIMAL(5,4),
  authority_score DECIMAL(5,4),
  composite_score DECIMAL(5,4),
  alerted BOOLEAN DEFAULT FALSE,
  dismissed BOOLEAN DEFAULT FALSE,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast dashboard queries
CREATE INDEX idx_stream_score ON stream_intelligence(composite_score DESC);
CREATE INDEX idx_stream_detected ON stream_intelligence(detected_at DESC);
CREATE INDEX idx_stream_category ON stream_intelligence(category);

-- RLS: anyone can read, only service role can insert
ALTER TABLE stream_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stream items are publicly readable"
  ON stream_intelligence FOR SELECT
  USING (dismissed = FALSE AND category != 'SPAM');

CREATE POLICY "Only service role can insert"
  ON stream_intelligence FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
```

---

## SECTION 5 — COST ANALYSIS (FOSS-FIRST, ZERO LICENSE FEES)

| Component | Tool | Cost/Mo | Alternative |
|-----------|------|---------|-------------|
| Telegram monitoring | telethon (MIT) | $0 | — |
| Discord monitoring | discord.py (MIT) | $0 | — |
| GitHub API | PyGithub (LGPL) | $0 (5K req/hr free) | — |
| Gitee API | requests + curl | $0 | — |
| Wildberries | requests (no auth) | $0 | — |
| Mercado Libre | official SDK (Apache 2) | $0 | — |
| NLP classification | OpenRouter free tier | $0 | Local Llama 3.3 |
| Redis queue | Redis 7 (BSD) | $0 (self-hosted) | — |
| Translation | LibreTranslate (AGPL) | $0 (self-hosted) | DeepL free 500K/mo |
| Hosting | Existing DO droplet | $0 (already paid) | +$4/mo if new droplet |
| Supabase DB | Supabase free tier | $0 | — |
| **Total** | | **$0/mo** | |

**The entire GrowlingEyes intelligence engine costs $0/month in additional infrastructure.**

---

## SECTION 6 — TIMELINE

| Week | Milestone |
|------|-----------|
| Week 1 | GrowlingEyes repo created, Telegram collector running, Redis queue working |
| Week 2 | GitHub + Gitee + Wildberries collectors running |
| Week 3 | NLP classifier integrated, scoring algorithm live |
| Week 4 | FastAPI WebSocket + Reese Reviews "Hot Incoming" panel wired |
| Month 2 | Reddit + Discord monitors added |
| Month 2 | @googlieeyes_bot alert system wired |
| Month 3 | GrowlingEyes.com landing page live |
| Month 4 | Mercado Libre + Shopee collectors |
| Month 6 | Full GrowlingEyes SaaS dashboard launch |

---

*End of FOSS_STREAMS_INTELLIGENCE.md*  
*March 27, 2026 — MIDNGHTSAPPHIRE / Freedom Angel Corps*
