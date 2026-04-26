# Reese Reviews — User Manual

**For Reese (and anyone helping with Vine reviews)**

This guide walks you through using the Vine Review Auto-Generator to manage your Amazon Vine products, generate reviews, scrape product images, and organize everything in one place.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [The Dashboard](#the-dashboard)
3. [Adding a Product](#adding-a-product)
4. [Understanding Automation Modes](#understanding-automation-modes)
5. [Generating a Review](#generating-a-review)
6. [Scraping Product Images](#scraping-product-images)
7. [Reviewing and Editing Generated Content](#reviewing-and-editing-generated-content)
8. [Uploading Your Own Photos](#uploading-your-own-photos)
9. [Bulk Actions](#bulk-actions)
10. [Importing Multiple Products (CSV)](#importing-multiple-products-csv)
11. [Managing Avatars](#managing-avatars)
12. [Video Preview](#video-preview)
13. [Where Your Data Lives](#where-your-data-lives)
14. [Tips and Tricks](#tips-and-tricks)
15. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Opening the App

1. Open your web browser (Chrome works best)
2. Go to the app URL (ask Mom for the current address — during development it's `localhost:8081`)
3. If you see a login screen, enter the password and click **Login**

### Finding the Vine Review Page

Once logged in, click **"Vine AI"** in the top navigation bar. This is where all the review magic happens.

---

## The Dashboard

At the top of the Vine AI page, you'll see:

### Stats Bar
A row of colored boxes showing your current numbers:
- **Total** — all products you've added
- **Pending** — waiting to be reviewed
- **Generating** — currently being processed by AI
- **Generated** — AI has created the review, ready for you to check
- **Edited** — you've made changes to the AI review
- **Submitted** — sent to Amazon
- **Overdue** — past the review deadline (these turn red!)

### Default Settings
Below the stats, you can set defaults that apply to all NEW items you add:
- **Default Automation Mode** — what level of automation you want (see [Automation Modes](#understanding-automation-modes))
- **Default Length for New Reviews** — how long the video should be (30 sec, 1 min, 2 min, etc.)
- **Default Avatar** — which AI character reads the review (default is "Reese")

### Tabs
- **Review Queue** — products waiting to be reviewed (your to-do list)
- **Generated** — products that already have AI-generated reviews
- **Avatars** — manage your AI reviewer characters
- **Video Preview** — preview generated review videos

---

## Adding a Product

When a Vine product arrives and you're ready to start the review process:

1. Click the **"+ Add Item"** button in the top right
2. Fill in the form:

### Form Fields

| Field | What to Enter | Required? |
|---|---|---|
| **Amazon Product URL** | Paste the full Amazon link to the product. The ASIN (product ID) will auto-fill! | No, but helpful |
| **Product Name** | What the product is called (e.g., "Wireless Bluetooth Earbuds") | Yes |
| **ASIN** | The Amazon product code (auto-fills from URL, or type it manually — looks like B0D1XD1ZV3) | No, but needed for image scraping |
| **Category** | Pick the closest category (Electronics, Home, Beauty, etc.) | Yes (defaults to Electronics) |
| **Automation Mode** | How much the AI should do — see next section | Yes (uses your default) |
| **ETV ($)** | The Estimated Tax Value Amazon shows for this item | No |
| **Order Date** | When you ordered it on Vine | Auto-fills to today |
| **Review Deadline** | When the review is due (usually 30 days from order) | Auto-fills to 30 days out |

3. Click **"+ Add Item"** to save it

**Pro tip:** If you paste an Amazon URL like `https://www.amazon.com/dp/B0D1XD1ZV3`, the ASIN (B0D1XD1ZV3) fills in automatically and you'll see a little blue badge confirming it!

---

## Understanding Automation Modes

This is the most important setting! It controls what the AI does for each product:

| Mode | What AI Does | When to Use |
|---|---|---|
| **Full Auto** | Everything — writes the review, generates video script, scrapes photos, assigns star rating | When you just want it all done and you'll review/edit later |
| **Video Only** | Just creates a video script and video | When you want to write your own review but need the video |
| **Photos Only** | Just finds product images from Amazon, Walmart, Target | When you have your own review written but need photos |
| **Review Only** | Writes the review text and assigns a star rating | When you already have photos and video but need the written review |
| **Manual** | Nothing! Just tracks the product for you | When you want to do everything yourself, or you're not ready yet |

### How to Set the Mode

**For all new items (default):** Change the "Default Automation Mode" dropdown at the top of the page. Every new item you add will use this mode.

**For a specific item:** When adding a new item, change the "Automation Mode" dropdown in the add form. This overrides the default for just that item.

### What Each Mode Looks Like on the Card

Each product card shows a mode badge and different buttons:

- **Full Auto** → Shows "Full Auto" badge + **"Generate All"** button
- **Video Only** → Shows "Video Only" badge + **"Generate Video"** button
- **Photos Only** → Shows "Photos Only" badge + **"Scrape Photos"** button
- **Review Only** → Shows "Review Only" badge + **"Generate Review"** button
- **Manual** → Shows "Manual" badge + **no generate button** (just the delete button)

---

## Generating a Review

Once a product is in your Review Queue:

1. Find the product card in the **Review Queue** tab
2. Click the action button on the card:
   - "Generate All" for Full Auto
   - "Generate Video" for Video Only
   - "Scrape Photos" for Photos Only
   - "Generate Review" for Review Only
3. Wait a few seconds — you'll see a spinning icon while it works
4. When done:
   - A green success message appears at the top
   - The product moves to the **Generated** tab
   - The card now shows the review text, star rating, pros/cons, and action buttons

### What Gets Generated (Full Auto Mode)

- **Review Title** — a catchy, honest headline
- **Review Body** — 2-3 paragraphs of natural-sounding review text
- **Star Rating** — 1 to 5 stars based on the product category and value
- **Pros** — 3 positive things about the product
- **Video Script** — a script for a 30-60 second review video
- **Scraped Images** — product photos from Amazon listings and international reviews

---

## Scraping Product Images

The image scraper finds real product photos from multiple sources so your review looks authentic:

### Where Images Come From
- **Amazon Listing** — the main product page images
- **Amazon UK Reviews** — buyer photos from Amazon.co.uk
- **Amazon DE Reviews** — buyer photos from Amazon.de (Germany)
- **Amazon JP Reviews** — buyer photos from Amazon.co.jp (Japan)
- **Walmart Reviews** — buyer photos from Walmart.com
- **Target Reviews** — buyer photos from Target.com

### How to Scrape Images

**Option 1 — Automatic (Full Auto or Photos Only mode):**
Click the main action button and images are scraped as part of the process.

**Option 2 — Standalone (any non-Manual mode):**
If your card shows a **"Scrape Images"** button (outline style, next to the main button), click it to just scrape images without generating a review. This button only appears when:
- The item has an ASIN
- Images haven't been scraped yet
- The item is NOT in Manual mode

### After Scraping
- You'll see a success message showing how many images were found and from which sources
- Source badges appear on the card (e.g., "Amazon Listing", "Amazon UK Review", "Walmart Review")
- The "Scrape Images" button disappears (since images are already scraped)
- A count like "5 listing + 12 review images" tells you what you got

---

## Reviewing and Editing Generated Content

After a review is generated, the product moves to the **Generated** tab. Each card shows:

### Available Actions

| Button | What It Does |
|---|---|
| **Edit** | Opens the review for editing — change the text, rating, pros/cons |
| **Copy** | Copies the review text to your clipboard so you can paste it into Amazon |
| **Photos** | Opens the photo finder to select/upload photos for this review |
| **Submit** | Marks the review as submitted (tracking purposes) |
| **Preview Video** | Shows a preview of the video that would be generated |
| **Delete** (red trash icon) | Removes the product entirely — **be careful, this can't be undone!** |

### Editing a Review

1. Click **Edit** on the product card
2. Change anything you want — the review title, body text, star rating, pros, cons
3. Save your changes
4. The status changes from "Generated" to "Edited"

**Important:** Always read through AI-generated reviews before submitting! Make sure they:
- Sound natural and like something you'd actually say
- Don't mention specific features the product doesn't have
- Match the star rating you'd give
- Include the Vine disclosure ("I received this product free through Amazon Vine")

---

## Uploading Your Own Photos

If you took your own photos of the product (great for authenticity!):

1. Click **Photos** on the product card
2. Select photos from your phone/computer (up to 10 photos)
3. The app automatically strips EXIF data from your photos (this removes location data and camera info for privacy)
4. You'll see a count like "4/8 photos selected (EXIF stripped)"

**Tips for photos:**
- Take them with good lighting (natural light is best)
- Show the product from different angles
- Include the product in use if possible
- Keep filenames casual — like how your phone names them (the app handles this)

---

## Bulk Actions

### Generate All Pending

Click **"Generate All Pending"** in the top right to process ALL pending items at once.

**Important things to know:**
- **Manual mode items are SKIPPED** — they won't be processed (this is by design)
- Each item is processed according to its own automation mode
- You'll see success/error messages for each item
- If no non-manual pending items exist, you'll see a message saying so

### When to Use Bulk Generate
- When you have a bunch of products that all arrived and you want to process them all at once
- Great for "Photos Only" mode — scrape images for everything in one click

---

## Importing Multiple Products (CSV)

If you have a lot of products to add at once:

1. Click **"Import CSV"** in the top right
2. Either upload a CSV file or paste the data directly
3. Your CSV should have these columns:

```
productName,asin,category,orderDate,reviewDeadline,etv
Wireless Mouse,B0EXAMPLE1,electronics,2026-03-01,2026-04-15,29.99
USB-C Hub,B0EXAMPLE2,electronics,2026-03-01,2026-04-15,45.00
```

4. Click **Import** to add all items at once

---

## Managing Avatars

The **Avatars** tab lets you manage the AI characters that "present" your reviews in videos:

- **Reese** is the default avatar (female, stock)
- You can add custom avatars with different names, genders, and styles
- The avatar you select is used for video generation

---

## Video Preview

The **Video Preview** tab shows a slideshow-style preview of how the review video would look:

- Each slide shows one point from the review
- Video length is configurable (30 seconds to 3 minutes)
- The default is 1 minute (6 slides at 10 seconds each)

---

## Where Your Data Lives

Your data is stored in **Supabase** (cloud database) with a **localStorage fallback** for offline use:

- When you're signed in, data is saved to Supabase and cached locally for fast access
- If Supabase is unavailable or you're offline, the app falls back to localStorage automatically
- Writes go to localStorage immediately, then sync to Supabase in the background
- Your data is protected by row-level security — only you can access your own items
- If you're not signed in or Supabase isn't configured, the app runs in localStorage-only mode

---

## Tips and Tricks

1. **Set your default mode first** — Before adding a bunch of items, set your Default Automation Mode. New items inherit this mode.

2. **Use Photos Only for quick wins** — If you just need images fast, set mode to "Photos Only" and click "Scrape Photos." It's the fastest mode.

3. **ASIN is key for image scraping** — Always include the ASIN (from the Amazon URL) when adding items. Without it, the image scraper can't find photos.

4. **Check the Generated tab** — After generating, items move from "Review Queue" to "Generated." Don't panic if they disappear from the queue!

5. **Copy to clipboard** — Use the "Copy" button to grab review text, then paste it directly into Amazon's review form.

6. **Watch deadlines** — Items turn yellow when the deadline is approaching and red when overdue. The card shows days remaining.

7. **Manual mode for tracking** — Use Manual mode for products you want to organize but aren't ready to review yet. You can always change the mode later.

8. **The app works offline** — Data is cached in localStorage, so you can view and organize your reviews without an internet connection. Changes sync to Supabase when you're back online (but you need internet for AI generation).

---

## Troubleshooting

### "OpenRouter API key not configured"
This error means the AI text generation service isn't connected yet. The app will still work in demo mode (generating placeholder reviews). Ask Mom to set up the API key.

### "Failed to generate review"
This usually happens when the AI service is down or the API key is missing. Try again later, or switch to Manual mode and write the review yourself.

### Items disappeared
Check the **Generated** tab! Items move there after being processed. If they're truly gone, the browser's local storage may have been cleared.

### Photos not showing after upload
Make sure your photos are in a standard format (JPG, PNG). Very large files may take a moment to process through the EXIF stripper.

### App shows a blank white page
Try refreshing the page. If it persists, clear the browser cache (but note this will delete your saved data) or ask for help.

### Review deadline is wrong
You can't edit the deadline after creating an item right now. If it's wrong, delete the item and re-add it with the correct date.

---

## Quick Reference Card

| I want to... | Do this |
|---|---|
| Add a product | Click **+ Add Item**, fill in the form |
| Generate everything automatically | Set mode to **Full Auto**, click **Generate All** |
| Just get images | Set mode to **Photos Only**, click **Scrape Photos** |
| Write my own review but need video | Set mode to **Video Only**, click **Generate Video** |
| Just need help with the written review | Set mode to **Review Only**, click **Generate Review** |
| Just track a product, no AI | Set mode to **Manual** |
| Process everything at once | Click **Generate All Pending** (skips Manual items) |
| Copy review to Amazon | Click **Copy** on the Generated card |
| Edit AI review | Click **Edit** on the Generated card |
| See my completed reviews | Click the **Generated** tab |
| Add lots of products at once | Click **Import CSV** |

---

*Made with love for Reese. If something doesn't make sense, just ask!*
