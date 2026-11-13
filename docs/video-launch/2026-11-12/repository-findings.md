# Reese repository findings

**Reese branding and avatar-video scaffolding already exist, but an end-to-end daughter-based video storefront is not verified.** Audrey’s reported thousands of reviewed products and likes, and nearly 200,000 views, remain user-reported claims; this inspection found no supporting account export or analytics snapshot.

Inspected `midnghtsapphire/reese-reviews` read-only via enabled `gh` GET APIs on November 12, 2026. The default branch is `main`, pinned to `dd7bebb7a2d9acaf6c7d2bdab56cd15c8bce9dcc` dated August 12, 2026. Its recursive tree was complete: 427 entries. Other branch names were listed, but their contents were not audited. No repository code was executed, no browser was used, and nothing was changed or published. [1]

## Branding already reusable

`README.md` describes a Reese business dashboard, review pipeline, and YouTube publishing. `BRAND_GUIDELINES.md` prescribes **“Reese Reviews”** for public branding, **Reese** as the platform face, and **Caresse** as the generated-review persona. It specifies steel/neutral colors, a dark navy gradient, Playfair Display headings, Inter body text, and the tagline “Review smarter. Earn honestly.” These are repository specifications, not proof of deployed behavior. [2] [3]

The existing logo is `src/assets/reese-logo.png`; additional assets are `src/assets/hero-bg.jpg`, `src/assets/review-1.jpg` through `review-3.jpg`, and `public/og-image.png`. The public hero and editable copy already say Reese Reviews and use “From Box to Beautiful.” Branding is inconsistent: `src/lib/branding.ts` sets `BRAND_NAME = "Reese-Reviews"`, while the guidelines require two words. The content-generation persona also needs a decision: should public narration be Reese rather than Caresse? [3] [4] [5]

Declared site: https://reesereviews.com. Source routes include `/reviews`, `/about`, `/vine`, `/publish-wizard`, and `/youtube`; the README’s `/publish` claim does not match the current router. These URLs were not visited. No specific Amazon storefront/profile URL was established in the inspected material. [2] [6]

## Avatar images and daughter reference inputs

Five tracked PNG assets are present, totaling roughly 5.5–6.6 MB each:

- [`public/avatars/reese-professional-1.png`](https://github.com/midnghtsapphire/reese-reviews/blob/dd7bebb7a2d9acaf6c7d2bdab56cd15c8bce9dcc/public/avatars/reese-professional-1.png): documented professional headshot; default stock avatar.
- [`public/avatars/reese-professional-2.png`](https://github.com/midnghtsapphire/reese-reviews/blob/dd7bebb7a2d9acaf6c7d2bdab56cd15c8bce9dcc/public/avatars/reese-professional-2.png): documented tech-expert pose.
- [`public/avatars/reese-casual-1.png`](https://github.com/midnghtsapphire/reese-reviews/blob/dd7bebb7a2d9acaf6c7d2bdab56cd15c8bce9dcc/public/avatars/reese-casual-1.png): documented lifestyle/desk pose.
- [`public/avatars/reese-casual-2.png`](https://github.com/midnghtsapphire/reese-reviews/blob/dd7bebb7a2d9acaf6c7d2bdab56cd15c8bce9dcc/public/avatars/reese-casual-2.png): documented casual/thumbs-up pose.
- [`public/avatars/reese-unboxing.png`](https://github.com/midnghtsapphire/reese-reviews/blob/dd7bebb7a2d9acaf6c7d2bdab56cd15c8bce9dcc/public/avatars/reese-unboxing.png): documented unboxing pose.

`docs/TEAM_B_CHANGELOG.md` and `src/stores/avatarStore.ts` label these **stock Caresse/Reese personas**. Their existence and source references are verified; their visual provenance and relationship to Audrey’s daughter are not. Images were not visually inspected. No separately identified daughter reference-photo set, likeness permission, voice sample, or completed video appeared in the main-branch filename inventory. [7] [8]

Reusable UI includes `src/components/avatar/AvatarSelector.tsx`, `AvatarReviewOverlay.tsx`, and `src/components/business/AvatarLibrary.tsx`. There are **two separate avatar stores**: `avatarStore.ts` holds stock/custom images under `reese-avatar-profiles`; AvatarLibrary uses `rr-avatar-library` and optional HeyGen/ElevenLabs IDs. Its default Reese entry has empty avatar, voice, and preview-image values. Uploading a preview photo stores a data URL locally—it does **not** create or train a daughter-specific talking avatar. [8] [9]

## Video workflow: implemented source versus placeholders

Useful workflow docs are `docs/USER_MANUAL.md`, `docs/TEAM_B_CHANGELOG.md`, `.agents/skills/testing-vine-pipeline/SKILL.md`, `docs/BACKLOG.md`, and `docs/scrum/HANDOFF.md`. They describe Vine import, script generation, avatar selection, media assembly, SEO, and publishing. The testing notes explicitly distinguish offline/demo behavior. The old `docs/REESE_REVIEWS_DELIVERY.md` references an old repository name and a 2024 delivery; its “production ready” statements are not current runtime evidence. No other repository was accessed. [7] [10] [11] [12]

Concrete source findings:

- **Wizard is not a working full video publisher:** `WizardStepMedia.tsx:128–137` delays, then supplies an existing video URL or `generated-review-video.mp4` and a simulated 45-second duration. `WizardStepPublish.tsx:195–235` logs site content rather than saving it, and optionally adds a YouTube queue entry. The parent callback only sets `isPublishing`; it does not persist a review or establish a successful result. [13] [14]
- **Video creator has both real-call scaffolding and simulation:** `ReviewVideoCreator.tsx:219–255` simulates generation and makes a thumbnail; `:519–569` simulates export and produces a JPEG, not a video. A separate action at `:390–449` calls `createHeyGenVideo`, polls completion, and saves the returned URL to the local video project. `src/lib/heygenClient.ts` implements REST requests. No successful external job or Supabase video upload was verified. [15]
- **Reusable backend pipeline:** `app/stages/s3_review_gen.py` generates structured review/script/rating data and pauses at `awaiting_approval`; `app/routers/webhooks.py` contains the approval callback. `s4_voice.py`, `s6_video.py`, and `s7_assembly.py` contain voice, HeyGen video, FFmpeg assembly, and object-storage upload paths. `docker-compose.yml` defines API, RQ worker, Redis, and PostgreSQL infrastructure. This is source implementation, not evidence that those services are running. `s8_distribute.py` marks the job done and sends its asset link through Telegram; it does not publish to Amazon, YouTube, or Meta. [16]

The current backlog still marks **RR-602 real HeyGen video generation** and **RR-603 live YouTube OAuth refresh** To Do. Source is ahead of those descriptions in places, but backlog completion and live functionality must not be assumed. The backend review prompt also lacks the blanket FTC disclosure that the brand guide claims is built into every generated review. [3] [11] [16]

## Product/review data and analytics evidence

`src/lib/data/amazon-reviews.json` contains **five records**, not thousands. Only identifiers were retained in findings: `ar-001 / B09JQMJHXY`, `ar-002 / B0BDHX8Z63`, `ar-003 / B0C2QWXYZ1`, `ar-004 / B0BW2JQXYZ`, and `ar-005 / B0BXYZ1234`. Its schema includes review text, rating, images, date, source, and status, but no like/view totals. `amazonReviewStore.ts` imports this file as `DEMO_DATA`; its actual demo list is empty and `importDemoReviews()` returns an empty array. These five identifiers are not verified customer-review history. [17]

Existing import/persistence pieces include HTML review parsing in `src/lib/amazonReviewStore.ts`, bulk import/enrichment/local publishing in `src/lib/reviewPipeline.ts`, and review-submission Supabase mapping in `src/lib/reviewStore.ts`. Relevant storage identifiers are `reese-amazon-reviews`, `reese-review-pipeline`, `reese-reviews-data`, `reese-reviews-submissions`, and `vine-review-items`. Database migrations define `orders.order_id/asin`, `jobs.job_id/order_id`, `vine_items.asin/review_id`, and `amazon_orders.amazon_order_id/asin/review_id`. No database or browser storage records were accessed. The root `Itemized_Report_2026 (1).pdf` exists but was deliberately not opened because it may contain private financial/personal data. [17] [18]

`src/pages/Dashboard.tsx` explicitly sets `HAS_ANALYTICS_DATA = false`; `/generate` also displays an analytics-not-connected message. YouTube source requests channel statistics, and Meta source contains post-insight calls, but no returned account data, dated metric export, or dashboard screenshot was found. Counts of imported/submitted items in local storage are not evidence of reach, likes, or views. [19]

## Publishing automation and actual verification

`src/services/youtube/youtubeService.ts` contains OAuth authorization/code exchange, `refreshAccessToken()`, automatic refresh before token use, resumable uploads, metadata generation, and a local upload queue. It supports YouTube’s `publishAt`, but no connected channel or successful upload was verified. Credentials/tokens are persisted client-side in this implementation; secrets were neither requested nor read. [20]

`src/services/metaBusinessService.ts` contains Facebook/Instagram API publishing and scheduled-post processing. `src/services/marketingScheduler.ts:495–533` runs its scheduler with a browser `setInterval` every minute, backed by local storage—not a proven unattended server scheduler. Separately, the `/generate` post action is explicitly simulated. [19] [21]

GitHub Actions automate **code CI/deployment**, not review-video publishing. API metadata verifies the main commit’s CI run succeeded on August 12, 2026, but its deployment run failed at **Install doctl**. A November 12 CodeQL Setup run also failed. These results neither prove the custom domain is down nor establish functioning production integrations; the site was not probed. [22] [23] [24]

## Missing inputs before using her daughter as Reese

Needed inputs are an approved daughter reference set and confirmation of who the existing stock images represent; permission to use her likeness and any voice replication, with age/guardian requirements clarified if applicable; the selected public persona/name; and a usable avatar/voice enrollment or provider ID. No consent/enrollment record was identified in the inspected source.

Also missing are the specific Amazon storefront/profile and destination channels, a rights-cleared export of the actual review/product history, dated platform analytics supporting the reported totals, authentic product-use notes and approved scripts, and verification of secure provider configuration plus a successfully generated, assembled, and published test video. The handoff additionally reports a previously exposed OpenRouter key and says rotation is needed; this was a documentation warning, not a secret value inspected or an independently verified rotation status. [11]

## References

[1]: https://github.com/midnghtsapphire/reese-reviews/tree/dd7bebb7a2d9acaf6c7d2bdab56cd15c8bce9dcc "Inspected main-branch snapshot"
[2]: https://github.com/midnghtsapphire/reese-reviews/blob/dd7bebb7a2d9acaf6c7d2bdab56cd15c8bce9dcc/README.md "README feature and runtime claims"
[3]: https://github.com/midnghtsapphire/reese-reviews/blob/dd7bebb7a2d9acaf6c7d2bdab56cd15c8bce9dcc/BRAND_GUIDELINES.md "Brand identity and review voice guidelines"
[4]: https://github.com/midnghtsapphire/reese-reviews/tree/dd7bebb7a2d9acaf6c7d2bdab56cd15c8bce9dcc/src/assets "Existing logo and public review artwork"
[5]: https://github.com/midnghtsapphire/reese-reviews/tree/dd7bebb7a2d9acaf6c7d2bdab56cd15c8bce9dcc/src/lib "Branding constants and editable site copy"
[6]: https://github.com/midnghtsapphire/reese-reviews/blob/dd7bebb7a2d9acaf6c7d2bdab56cd15c8bce9dcc/src/App.tsx "Actual application routes"
[7]: https://github.com/midnghtsapphire/reese-reviews/blob/dd7bebb7a2d9acaf6c7d2bdab56cd15c8bce9dcc/docs/TEAM_B_CHANGELOG.md "Avatar assets and publishing implementation notes"
[8]: https://github.com/midnghtsapphire/reese-reviews/blob/dd7bebb7a2d9acaf6c7d2bdab56cd15c8bce9dcc/src/stores/avatarStore.ts "Stock avatar identifiers and local custom-image store"
[9]: https://github.com/midnghtsapphire/reese-reviews/blob/dd7bebb7a2d9acaf6c7d2bdab56cd15c8bce9dcc/src/components/business/AvatarLibrary.tsx "Provider avatar and voice library with empty defaults"
[10]: https://github.com/midnghtsapphire/reese-reviews/blob/dd7bebb7a2d9acaf6c7d2bdab56cd15c8bce9dcc/docs/USER_MANUAL.md "Review workflow and manual approval guidance"
[11]: https://github.com/midnghtsapphire/reese-reviews/blob/dd7bebb7a2d9acaf6c7d2bdab56cd15c8bce9dcc/docs/scrum/HANDOFF.md "Current handoff and outstanding integration warnings"
[12]: https://github.com/midnghtsapphire/reese-reviews/blob/dd7bebb7a2d9acaf6c7d2bdab56cd15c8bce9dcc/.agents/skills/testing-vine-pipeline/SKILL.md "Explicit offline and demo testing behavior"
[13]: https://github.com/midnghtsapphire/reese-reviews/blob/dd7bebb7a2d9acaf6c7d2bdab56cd15c8bce9dcc/src/components/wizard/steps/WizardStepMedia.tsx#L128-L140 "Simulated wizard video generation"
[14]: https://github.com/midnghtsapphire/reese-reviews/tree/dd7bebb7a2d9acaf6c7d2bdab56cd15c8bce9dcc/src/components/wizard "Wizard and publish-step source"
[15]: https://github.com/midnghtsapphire/reese-reviews/blob/dd7bebb7a2d9acaf6c7d2bdab56cd15c8bce9dcc/src/components/business/ReviewVideoCreator.tsx "Simulated export and separate HeyGen REST action"
[16]: https://github.com/midnghtsapphire/reese-reviews/tree/dd7bebb7a2d9acaf6c7d2bdab56cd15c8bce9dcc/app "Backend approval, voice, video, assembly, and distribution source"
[17]: https://github.com/midnghtsapphire/reese-reviews/blob/dd7bebb7a2d9acaf6c7d2bdab56cd15c8bce9dcc/src/lib/amazonReviewStore.ts "Demo dataset reference and HTML review importer"
[18]: https://github.com/midnghtsapphire/reese-reviews/tree/dd7bebb7a2d9acaf6c7d2bdab56cd15c8bce9dcc/supabase/migrations "Product, review, order, and job schema definitions"
[19]: https://github.com/midnghtsapphire/reese-reviews/tree/dd7bebb7a2d9acaf6c7d2bdab56cd15c8bce9dcc/src/pages "Dashboard analytics flag and simulated Generate posting"
[20]: https://github.com/midnghtsapphire/reese-reviews/blob/dd7bebb7a2d9acaf6c7d2bdab56cd15c8bce9dcc/src/services/youtube/youtubeService.ts "YouTube OAuth, refresh, uploads, and queue source"
[21]: https://github.com/midnghtsapphire/reese-reviews/tree/dd7bebb7a2d9acaf6c7d2bdab56cd15c8bce9dcc/src/services "Meta publishing and client-side marketing scheduler"
[22]: https://github.com/midnghtsapphire/reese-reviews/actions/runs/31605607234 "Verified successful main-commit CI run"
[23]: https://github.com/midnghtsapphire/reese-reviews/actions/runs/31605607506 "Verified deployment failure at Install doctl"
[24]: https://github.com/midnghtsapphire/reese-reviews/actions/runs/43324243283 "Verified failed November 12 CodeQL Setup run"
