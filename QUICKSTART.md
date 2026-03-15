# Quick Start: Adding Real Amazon Vine Data

## TL;DR - 3 Simple Steps

### Step 1: Enable Backend Mode (30 seconds)

1. Open your app: `http://localhost:8080/reesereviews/business`
2. Click the **⚙️ Settings** tab
3. Toggle **"Use Backend API"** to ON
4. You'll see a green badge showing "Production" mode

### Step 2: Set Up Supabase Tables (2 minutes)

You already have Supabase configured! Just run this command:

```bash
cd /home/runner/work/steel-white/steel-white
npx supabase db push supabase/migrations/20260310_amazon_vine_tables.sql
```

This creates 3 tables:
- `vine_items` - Your Vine products
- `amazon_orders` - Your Amazon purchases
- `api_configurations` - Your API credentials (encrypted)

### Step 3: Add Your Data (Choose One Method)

#### Option A: Manual Entry (Easiest)
1. Go to Supabase Dashboard → Table Editor
2. Click `vine_items` table
3. Click "Insert" → "Insert row"
4. Fill in your Vine product details:
   - `asin`: Product ASIN (e.g., "B0D8XYZABC")
   - `product_name`: "Your product name"
   - `review_deadline`: "2026-03-15"
   - `estimated_value`: 24.99
   - `review_status`: "pending"
5. Save and refresh your Vine Dashboard!

#### Option B: Amazon API (Advanced)

**If you have Amazon Product Advertising API:**
1. Go to Settings tab in your app
2. Click "Product Advertising API" tab
3. Enter your credentials:
   - Access Key ID
   - Secret Access Key
   - Associate Tag
4. Click "Save PA-API Credentials"

**If you have Amazon SP-API (Seller Account):**
1. Go to Settings tab
2. Click "Selling Partner API" tab
3. Enter your credentials:
   - Seller ID
   - LWA Client ID/Secret
   - Refresh Token
4. Click "Save SP-API Credentials"

## What Happens Next?

### In Demo Mode (Default)
- Shows 4 sample Vine items
- Data stored in browser localStorage
- Perfect for testing and development

### In Production Mode (After Toggle)
- Shows YOUR real Vine items from Supabase
- Data synced across devices
- Ready for Amazon API integration
- Can add/edit/delete items
- Multi-user support with authentication

## Where Are My Vine Items?

The app automatically fetches from:

**Demo Mode:**
```
localStorage → DEMO_VINE_ITEMS → Your Dashboard
```

**Production Mode:**
```
Supabase → vine_items table → Your Dashboard
```

## Troubleshooting

### "No items found" after enabling backend mode

**Cause:** Your `vine_items` table is empty

**Fix:** Add some items manually or via API

```sql
-- Run this in Supabase SQL Editor
INSERT INTO vine_items (
  user_id, 
  asin, 
  product_name, 
  review_deadline, 
  estimated_value, 
  review_status
) VALUES (
  auth.uid(), -- Your user ID
  'B0D8XYZABC',
  'Anker 3-in-1 Charging Cable',
  '2026-03-15',
  24.99,
  'pending'
);
```

### "Error loading Vine data"

**Cause:** Supabase tables don't exist yet

**Fix:** Run the migration:
```bash
npx supabase db push supabase/migrations/20260310_amazon_vine_tables.sql
```

### "Backend mode toggle doesn't save"

**Cause:** localStorage might be disabled

**Fix:** Check browser settings, enable localStorage for your domain

## Testing Backend Mode

1. Enable backend mode in Settings
2. Open browser console (F12)
3. Run: `localStorage.getItem('reese-use-backend')`
4. Should return: `"true"`

## Real Amazon API Integration (Coming Soon)

The infrastructure is ready! To complete the integration:

1. **Create Edge Function:**
   ```bash
   cd supabase/functions
   # Create sync-vine-items/index.ts
   # See AMAZON_API_INTEGRATION.md for full code
   ```

2. **Deploy Function:**
   ```bash
   supabase functions deploy sync-vine-items
   ```

3. **Call from App:**
   The app will automatically use the function when you click "Sync Now"

## Current Features Working

✅ Switch between demo/production modes
✅ Supabase database ready to use
✅ Manual data entry
✅ VineDashboard displays real data
✅ Update review status
✅ Generate review templates
✅ Track deadlines
✅ Multi-user support (with RLS)

## Next Features to Add

🔜 Automatic Amazon API sync
🔜 Vine scraping with Puppeteer
🔜 Order history import
🔜 Affiliate link generation
🔜 ETV calculation automation

## Need Help?

1. Check `AMAZON_API_INTEGRATION.md` for detailed docs
2. Settings tab has a "Help" section
3. All functions have JSDoc comments

## Quick Test

Want to see it work right now?

1. Enable backend mode
2. Run migration
3. Add one item via Supabase
4. Refresh Vine Dashboard
5. See your real item! 🎉
