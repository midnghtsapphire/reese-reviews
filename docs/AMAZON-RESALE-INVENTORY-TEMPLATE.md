# Amazon Resale Inventory (Reviewed NIB) — GitHub template

This is a GitHub issue template that mirrors the Notion database **Amazon Resale Inventory (Reviewed NIB)** as it works today.

- Live form: [`.github/ISSUE_TEMPLATE/amazon-resale-inventory.yml`](../.github/ISSUE_TEMPLATE/amazon-resale-inventory.yml)
- Canonical copy: `docs/reviews/amazon-resale-inventory.yml` in [revvel-standards](https://github.com/midnghtsapphire/revvel-standards)

## What it mirrors

Field names and order match the Notion Default view:

Name, ASIN, Amazon URL, Category, Condition, Current Price, Keepa Lowest Price, Last Updated, Notes, Original Price, Resale Intent, Review Preview, Review Status, Sale Price (20% off), Sheet Row, Status, Vine Tax Value.

Review **Title**, **Review**, and **Image** match the item page layout already used in Notion (“Amazon Review (publishable — edit only if needed),” then copy title and body into the Vine review form, upload the image if it is ready, and submit).

Statuses are unchanged:

- **Review Status:** To Review, Reviewed
- **Status** (resale): To List, Listed, Hold, Sold
- **Resale Intent:** Yes, Keep, Not Sure
- **Category:** Home, Kitchen, Electronics, Beauty, Tools, Other
- **Condition:** New In Box, Open Box, Used

**Sale Price (20% off)** is lowest historical Keepa price × 0.80. The database is hybrid with the Google Sheet for calculations.

There are no extra approval stages. You run this process yourself. The Amazon rules engine is an optional check, not a required gate.
