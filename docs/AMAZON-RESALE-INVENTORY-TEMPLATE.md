# Amazon Resale Inventory (Reviewed NIB) — GitHub template

This is a GitHub issue template that mirrors the Notion database **Amazon Resale Inventory (Reviewed NIB)** as it works today.

- Live form: [`.github/ISSUE_TEMPLATE/amazon-resale-inventory.yml`](../.github/ISSUE_TEMPLATE/amazon-resale-inventory.yml)
- Canonical copy: `docs/reviews/amazon-resale-inventory.yml` in [revvel-standards](https://github.com/midnghtsapphire/revvel-standards)
- Rules: [Amazon Rules](https://app.notion.com/p/4182aa319908811288d7cc88a4304b8b)

## What it mirrors

Field names and order match the Notion Default view:

Name, ASIN, Amazon URL, Category, Condition, Current Price, Keepa Lowest Price, Last Updated, Notes, Original Price, Resale Intent, Review Preview, Review Status, Sale Price (20% off), Sheet Row, Status, Vine Tax Value.

Review **Title**, **Review**, **Original Product Photo**, and **Final Review Photo (matches original size + light filter)** match the item page layout already used in Notion (“Amazon Review (publishable — edit only if needed),” then copy title and body into the Vine review form, upload the processed image if it is ready, and submit).

The image process is the same one recorded on the Notion item pages: start with Audrey’s own **Original Product Photo** (Amazon community guidelines), then crop, remove the background, and apply a light filter. The **Final Review Photo** should match the original size plus the light filter, and the product must still look like what she received. If the processed photo is not ready, mark **Image still needed**. Text-only is still allowed.

Statuses are unchanged:

- **Review Status:** To Review, Reviewed
- **Status** (resale): To List, Listed, Hold, Sold
- **Resale Intent:** Yes, Keep, Not Sure
- **Category:** Home, Kitchen, Electronics, Beauty, Tools, Other
- **Condition:** New In Box, Open Box, Used

**Sale Price (20% off)** is lowest historical Keepa price × 0.80. The database is hybrid with the Google Sheet for calculations.
