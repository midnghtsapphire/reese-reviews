# Sources fetched for the Amazon rules engine

All official quotes in the rule packs were taken from pages fetched on **14 November 2026** (America/Denver). Recheck the live pages before relying on a rule after Amazon updates Help.

## Official Amazon pages (fetched)

| Page | URL | Used for |
| --- | --- | --- |
| Community Guidelines | https://www.amazon.com/gp/help/customer/display.html?nodeId=GLHXEX85MENUE4XF | Affiliate and referrer tags, external links, private information (email, phone, order number), compensated reviews, Vine free-product exception, profanity and personal attacks, medical prevent/cure claims, actual experience / do not review before delivery, own photos, star ratings 1–5, reviews that only focus on seller/shipping/packaging |
| Amazon Vine | https://www.amazon.com/gp/help/customer/display.html?nodeId=GPEWN3RSQPEU2HST | Vine Voices are expected to use the products they receive before submitting a review. Amazon does not verify actual use. |
| Submit a Review | https://www.amazon.com/gp/help/customer/display.html?nodeId=GL4WJF8BGV8VL6B8 | Reviewers may add text, photos, or videos; submissions must follow Community Guidelines. No character, photo-count, or file-size limits are stated on this page. |
| Understanding Customer Reviews and Ratings | https://www.amazon.com/gp/help/customer/display.html?nodeId=G8UYX7LALQC8V9KA | $50/12-month eligibility; checks against compensated reviews; Vine Voices request products, try them free, and share honest opinions; sellers and brands are not allowed to contact Voices; Amazon does not edit Vine reviews. |
| About Promotional Content | https://www.amazon.com/gp/help/customer/display.html?nodeId=T77pxIrSUKtMXsjWEy | Paid or incentivized reviews, review clubs, generally available discounts (for example a Lightning Deal). The same article also resolved at nodeId `GDSRWWGGRA2JXSNZ`. |
| KDP Content Guidelines (includes AI) | https://kdp.amazon.com/en_US/help/topic/G200672390 | Authors must inform KDP of AI-generated content (text, images, or translations). AI-generated vs AI-assisted is defined. AI-generated images include cover and interior art, even after substantial edits. |
| KDP trim, bleed, and margins | https://kdp.amazon.com/en_US/help/topic/GVBQ3CMEQW3W2VL6 | Listed paperback and hardcover trim sizes, including 8.5" × 11" and 8.25" × 11", and official page-count ranges (paperback 8.5" × 11" premium color 24–590; hardcover 75–550). |

## What those official pages do not spell out

Do not treat the following as Amazon rules in this engine:

- A required Vine review percentage (including 60% or 90% figures found in unofficial forums)
- Gold or Silver Vine tier names or thresholds
- The length of a Vine evaluation period
- A public per-item review deadline for Vine Voices
- A numeric cap on how many reviews may be posted per day
- A review character limit, a maximum number of photos, a maximum video length, or a maximum file size (use the limits the Amazon form shows at post time, if any)
- A public sentence that says “one review per ASIN” (the pages do say that if Amazon rejects or removes a review for a guidelines violation, the reviewer will not be allowed to review that product again). The ledger check is a **house rule** from Audrey’s WR.
- The exact KDP form label “One or a few AI-generated images, minimal or no editing” (house standing answer)
- A published 50-character keyword cap in KDP Help (house cap that matches the usual on-screen box)

## House rules (Audrey)

Attributed in the YAML as `source_kind: house_rule` and `house_attribution`. They come from Audrey’s WR templates and standing answers, not from a sentence on the official pages above:

- One review per ASIN; local ledger; no second WR for the same ASIN
- WR requires title, body, and a ten-character ASIN
- Stock-AI phrasing should be rewritten in her own words
- New print books: paperback 8.5" × 11", hardcover 8.25" × 11"; already-published 6" × 9" stays 6" × 9"
- Cover art has no words; typography is added afterward
- Standing AI tool is Grok Imagine or Grok Image; images disclosure and Texts/Translations standing answers as on the KDP WR
- Coloring books: black-and-white interiors on the cheapest paper
