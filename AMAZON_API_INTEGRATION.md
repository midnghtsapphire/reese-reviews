# Amazon Vine & Backend Data Integration Guide

## Overview

This guide explains how to connect your Reese Reviews app to real Amazon data using your Amazon API credentials.

## Current State

Your app currently uses **mock data** stored in localStorage:
- `vineScraper.ts` - Contains demo Vine items (4 sample products)
- `amazonStore.ts` - Contains demo Amazon orders (5 sample orders)
- All data is client-side only (no backend persistence)

## Integration Options

### Option 1: Amazon Product Advertising API (PA-API 5.0)
**Best for:** Affiliate marketers, product research, getting product details

**What you get:**
- Product information (title, price, images, ratings)
- Browse node data (categories)
- Search results
- Customer reviews data

**What you DON'T get:**
- Your personal Vine items
- Your order history
- Real-time inventory

**Credentials needed:**
- Access Key ID
- Secret Access Key  
- Associate Tag (Partner Tag)

### Option 2: Amazon Selling Partner API (SP-API)
**Best for:** Amazon sellers with seller accounts

**What you get:**
- Order history
- Inventory data
- Product listings
- Sales reports
- Returns data

**What you DON'T get:**
- Vine program data (Vine is separate)

**Credentials needed:**
- LWA Client ID
- LWA Client Secret
- Refresh Token
- Seller ID

### Option 3: Manual Vine Scraping (Current Approach)
**Best for:** Getting actual Vine queue data

**What you get:**
- Real Vine items from your queue
- Review deadlines
- Product details
- ETV values

**How it works:**
1. Export your Vine session cookies from browser
2. Backend uses Puppeteer to scrape Vine dashboard
3. Extracts item data from HTML

**Credentials needed:**
- Amazon session cookies (exported from browser)

## Recommended Architecture

```
┌─────────────────┐
│   React App     │
│  (Frontend)     │
└────────┬────────┘
         │
         │ HTTPS
         │
┌────────▼────────┐
│  Supabase       │
│  Edge Functions │ ← Already configured!
└────────┬────────┘
         │
         ├──────────┐
         │          │
┌────────▼──────┐  │
│ Amazon PA-API │  │
│ or SP-API     │  │
└───────────────┘  │
         │          │
         │    ┌─────▼──────┐
         │    │ Puppeteer  │
         │    │ (Vine      │
         │    │  Scraper)  │
         │    └────────────┘
         │
┌────────▼────────┐
│  Supabase       │
│  PostgreSQL     │
│  (Data Storage) │
└─────────────────┘
```

## Implementation Steps

### Step 1: Set up Supabase Database Tables

Create these tables in your Supabase project:

```sql
-- Vine Items Table
CREATE TABLE vine_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  asin TEXT NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT,
  image_url TEXT,
  received_date DATE,
  review_deadline DATE NOT NULL,
  estimated_value DECIMAL(10,2),
  review_status TEXT CHECK (review_status IN ('pending', 'in_progress', 'submitted', 'published', 'overdue')),
  review_id TEXT,
  vine_enrollment_date DATE,
  notes TEXT,
  template_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Amazon Orders Table
CREATE TABLE amazon_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  amazon_order_id TEXT UNIQUE NOT NULL,
  asin TEXT NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT,
  image_url TEXT,
  purchase_date DATE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  status TEXT CHECK (status IN ('pending', 'shipped', 'delivered', 'returned')),
  review_status TEXT CHECK (review_status IN ('not_reviewed', 'draft', 'published')),
  review_id TEXT,
  affiliate_link TEXT,
  source TEXT CHECK (source IN ('purchased', 'vine')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Configuration Table (encrypted)
CREATE TABLE api_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users UNIQUE NOT NULL,
  amazon_access_key TEXT, -- encrypted
  amazon_secret_key TEXT, -- encrypted
  amazon_associate_tag TEXT,
  amazon_seller_id TEXT,
  amazon_marketplace_id TEXT DEFAULT 'ATVPDKIKX0DER', -- US marketplace
  vine_cookies JSONB, -- encrypted session cookies
  last_vine_sync TIMESTAMP WITH TIME ZONE,
  last_orders_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE vine_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_configurations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own vine items"
  ON vine_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vine items"
  ON vine_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vine items"
  ON vine_items FOR UPDATE
  USING (auth.uid() = user_id);

-- Similar policies for amazon_orders and api_configurations
```

### Step 2: Create Supabase Edge Function for Vine Sync

Create `supabase/functions/sync-vine-items/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface VineSyncRequest {
  cookies: any;
  queues: string[];
}

serve(async (req) => {
  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify user
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { cookies, queues }: VineSyncRequest = await req.json()

    // Here you would implement Puppeteer scraping
    // For now, return placeholder
    const scrapedItems = await scrapeVineItems(cookies, queues)

    // Save to database
    const { data, error } = await supabaseClient
      .from('vine_items')
      .upsert(scrapedItems.map(item => ({
        ...item,
        user_id: user.id
      })), { onConflict: 'asin,user_id' })

    if (error) throw error

    return new Response(
      JSON.stringify({
        success: true,
        itemsScraped: scrapedItems.length,
        timestamp: new Date().toISOString()
      }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
})

async function scrapeVineItems(cookies: any, queues: string[]) {
  // TODO: Implement Puppeteer scraping
  // This would run Puppeteer in Deno to scrape https://www.amazon.com/vine/vine-reviews
  // For now, return empty array
  return []
}
```

### Step 3: Update Frontend to Use Real API

Update `src/lib/vineScraper.ts`:

```typescript
// Add at the top
import { supabase } from '@/integrations/supabase/client';

// Replace getVineItems function
export async function getVineItems(): Promise<VineItem[]> {
  try {
    // Try to get from Supabase first
    const { data, error } = await supabase
      .from('vine_items')
      .select('*')
      .order('review_deadline', { ascending: true });

    if (error) {
      console.error('Error fetching vine items:', error);
      // Fallback to localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
      return DEMO_VINE_ITEMS;
    }

    // Map database records to VineItem type
    return data.map(item => ({
      id: item.id,
      asin: item.asin,
      product_name: item.product_name,
      category: item.category,
      image_url: item.image_url,
      received_date: item.received_date,
      review_deadline: item.review_deadline,
      estimated_value: item.estimated_value,
      review_status: item.review_status,
      review_id: item.review_id,
      vine_enrollment_date: item.vine_enrollment_date,
      notes: item.notes,
      template_used: item.template_used,
    }));
  } catch (error) {
    console.error('Error in getVineItems:', error);
    return DEMO_VINE_ITEMS;
  }
}

// Replace scrapeVineItems function
export async function scrapeVineItems(
  cookies: VineCookies,
  queues: VineQueue[] = ["potluck", "additional_items", "last_chance"]
): Promise<VineScraperResult> {
  try {
    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('sync-vine-items', {
      body: { cookies, queues }
    });

    if (error) throw error;

    // Refresh local data
    await getVineItems();

    return {
      success: true,
      itemsScraped: data.itemsScraped,
      queues,
      timestamp: data.timestamp,
    };
  } catch (error) {
    return {
      success: false,
      itemsScraped: 0,
      queues,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    };
  }
}
```

### Step 4: Update VineDashboard Component

Update `src/components/VineDashboard.tsx`:

```typescript
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

export function VineDashboard() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<VineItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadVineItems();
  }, []);

  const loadVineItems = async () => {
    try {
      setLoading(true);
      const data = await getVineItems();
      setItems(data);
    } catch (error) {
      toast({
        title: "Error loading Vine items",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const pendingReviews = items.filter(v => v.review_status === "pending");
  const inProgressReviews = items.filter(v => v.review_status === "in_progress");
  const overdueReviews = items.filter(v => v.review_status === "overdue");

  if (loading) {
    return <div>Loading Vine items...</div>;
  }

  // ... rest of component
}
```

## Quick Start Guide

### For Amazon Product Advertising API

1. **Get API Credentials:**
   - Go to https://affiliate-program.amazon.com/
   - Sign up for Associates Program
   - Go to Product Advertising API section
   - Get your Access Key, Secret Key, and Associate Tag

2. **Add to .env:**
   ```bash
   VITE_AMAZON_ACCESS_KEY=your_access_key
   VITE_AMAZON_SECRET_KEY=your_secret_key
   VITE_AMAZON_ASSOCIATE_TAG=your_tag
   ```

3. **Never commit .env to git!** Add it to .gitignore

### For Vine Scraping

**Amazon Vine & Account URLs:**
| Page | URL |
|------|-----|
| Vine Reviews (main queue) | https://www.amazon.com/vine/vine-reviews |
| Vine Orders | https://www.amazon.com/vine/orders |
| Vine Account | https://www.amazon.com/vine/account |
| Amazon Account (login) | https://www.amazon.com/gp/css/homepage.html?ref_=nav_AccountFlyout_ya |

1. **Export Cookies:**
   - Install "Cookie Editor" browser extension
   - Log in at https://www.amazon.com/gp/css/homepage.html?ref_=nav_AccountFlyout_ya
   - Go to https://www.amazon.com/vine/vine-reviews
   - Click Cookie Editor → Export → Copy as JSON

2. **Paste in App:**
   - Go to Business Dashboard → Vine → Settings
   - Paste cookies in "Configure Vine Cookies" section
   - Click "Save Cookies"

3. **Manual Sync:**
   - Click "Sync Now" button
   - Wait for scraping to complete
   - Your real Vine items will appear!

## Security Best Practices

1. **Never store API keys in frontend code**
2. **Always use environment variables**
3. **Encrypt sensitive data in database**
4. **Use Supabase Row Level Security (RLS)**
5. **Implement rate limiting for API calls**
6. **Validate all inputs on backend**
7. **Use HTTPS only**
8. **Rotate API keys regularly**

## Troubleshooting

### "No items found"
- Check if you have Vine items in your queue at https://www.amazon.com/vine/vine-reviews
- Verify cookies are valid (not expired)
- Check browser console for errors

### "API credentials invalid"
- Double-check your Access Key and Secret Key
- Verify your Associate Tag is correct
- Make sure you're approved for PA-API

### "Scraping failed"
- Amazon may have changed their HTML structure
- Cookies may have expired (re-export them)
- Check if you're logged into https://www.amazon.com/vine/vine-reviews

## Next Steps

1. Choose your integration method (PA-API, SP-API, or scraping)
2. Get your API credentials
3. Set up Supabase tables
4. Create Edge Functions
5. Update frontend code
6. Test with real data
7. Deploy to production

## Need Help?

Check these resources:
- [Amazon PA-API Docs](https://webservices.amazon.com/paapi5/documentation/)
- [Amazon SP-API Docs](https://developer-docs.amazon.com/sp-api/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Puppeteer Scraping Guide](https://pptr.dev/)
