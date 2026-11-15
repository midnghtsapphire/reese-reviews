# Product image process

A reusable, local tool for turning a product photo into clean versions you can use in a review, on social, as a cutout, or anywhere else.

1. **Copy** the image (local file, direct URL, Amazon listing URL, or ASIN).
2. **Crop** to the product (auto subject box with padding, or a manual `--crop`).
3. **Remove the background** with free, local **rembg** (`u2net`). If rembg is not installed, a local OpenCV threshold / GrabCut fallback is used.
4. **Remove overlaid text, watermarks, and badges** (`--remove-text`) — corner banners, SALE / Best Seller style marks. Lettering printed on the product is left alone.
5. **Apply a filter** (`light` by default, or `none` / `glass`).
6. **Write output presets** (`--preset`):
   - `review` — original-size, white background (default).
   - `social` — square 1:1 (1080, or `--size`).
   - `cutout` — tight transparent PNG.
   - `all` — write every preset.
7. **Optional Notion upload** of the review version, without changing existing page content.

Selectable GitHub work request: **[Product Image Process (WR)](https://github.com/midnghtsapphire/reese-reviews/issues/new?template=product-image-process-wr.yml)**.

This tool does not post anything to Amazon.

## On your computer

From a checkout of `reese-reviews`:

```bash
cd tools/review-image
python3 -m pip install -r requirements.txt
python3 -m pip install "rembg[cpu]"   # optional, recommended; skip to use the OpenCV fallback
PYTHONPATH=. python3 -m review_image /path/to/your-original.jpg
```

That writes `/path/to/your-original-final-review.jpg`.

### Copy the product image

```bash
# Direct photo URL
PYTHONPATH=. python3 -m review_image --from-url https://example.com/photo.jpg --out-dir ./out

# Amazon listing (copies the main hi-res image)
PYTHONPATH=. python3 -m review_image --asin B0XXXXXXXX --preset all --out-dir ./out --remove-text
PYTHONPATH=. python3 -m review_image --from-url https://www.amazon.com/dp/B0XXXXXXXX --preset review
```

A bare ASIN or Amazon URL can also be the first argument. `--save-original` stores the copied file (default `original.jpg` in `--out-dir`).

Amazon sometimes shows a captcha page to non-browser clients. The tool uses a browser User-Agent and prefers `curl`. If a listing cannot be read, pass a direct image URL or a local file instead.

### Crop, background, text, filter

```bash
# Manual crop (left, top, width, height in pixels)
PYTHONPATH=. python3 -m review_image --crop 40,20,800,1000 /path/to/your-original.jpg

# Skip auto-crop or background removal
PYTHONPATH=. python3 -m review_image --no-crop --no-background /path/to/your-original.jpg

# Remove overlaid text / watermarks / badges
PYTHONPATH=. python3 -m review_image --remove-text /path/to/your-original.jpg

# Filter: light (default), none, or glass (gentle VineFlow-inspired preset)
PYTHONPATH=. python3 -m review_image --filter none /path/to/your-original.jpg
PYTHONPATH=. python3 -m review_image --filter glass /path/to/your-original.jpg
```

### Output presets

```bash
# Review photo: original pixel size, white background
PYTHONPATH=. python3 -m review_image --preset review /path/to/your-original.jpg

# Square 1:1 for social (default 1080; override with --size)
PYTHONPATH=. python3 -m review_image --preset social --size 1080 /path/to/your-original.jpg

# Transparent PNG cutout (tight crop + padding)
PYTHONPATH=. python3 -m review_image --preset cutout /path/to/your-original.jpg

# All three
PYTHONPATH=. python3 -m review_image --preset all --remove-text --out-dir ./out /path/to/your-original.jpg
```

Files are named `<stem>-final-review.jpg`, `<stem>-social-square.jpg`, and `<stem>-cutout.png`.

### Notion upload

Two paths, same result (a **Final Review Photo** heading and image, existing content left in place):

**Token path (your computer, or CircleCI):**

```bash
export NOTION_TOKEN="ntn_..."   # integration token; never commit this
PYTHONPATH=. python3 -m review_image --notion https://www.notion.so/YOUR_PAGE_ID --upload-notion
```

Create an integration at [notion.so/my-integrations](https://www.notion.so/my-integrations) and grant it access to the page. If `NOTION_TOKEN` is unset, the command prints setup instructions and exits.

**Connector-run path (Grok Bot / Cursor with the Notion connector):** the CLI does not store connector credentials. The agent should:

1. Run the CLI locally to write the finished file (no `--upload-notion`).
2. Call `notion-create-file-upload` with the filename, then send **one** multipart POST to `upload_url`.
3. Call `notion-update-page` with `insert_content` at the **start** of the page, under a heading `Final Review Photo`, using the returned `suggested_markdown` or `markdown_source`.
4. Never remove or overwrite existing blocks (including the review text).

### Tests

```bash
cd tools/review-image
PYTHONPATH=. REVIEW_IMAGE_FORCE_OPENCV=1 REVIEW_IMAGE_NO_NETWORK=1 python3 -m pytest -q
```

Tests use synthetic images and fixture issue bodies. They never call live Notion, Amazon, or GitHub, and they do not download rembg models.

## Use it from a GitHub work request

Open **[Product Image Process (WR)](https://github.com/midnghtsapphire/reese-reviews/issues/new?template=product-image-process-wr.yml)** and fill in:

- a product URL or ASIN, **or** an attached / linked image
- steps to run (copy, crop, remove background, remove text/watermarks, filter) — leave them unchecked for the full process
- filter preset (`light`, `none`, `glass`)
- output presets (review, square social, transparent PNG)
- optional Notion page URL
- notes

The form applies the `image-process` label. For a full Amazon review WR, use **[WR: Amazon review](https://github.com/midnghtsapphire/reese-reviews/issues/new?template=amazon-review-wr.yml)** and follow the link in **Stage 3 — Image process** (that form is unchanged aside from the link).

The queue is documented in [SETUP.md](SETUP.md). Until the CircleCI schedule and token are in place, open a WR and run the CLI yourself, or ask the queue to be triggered once.

## Use it from n8n or Zapier

There is no bundled n8n or Zapier workflow in this repo. Use either entry below.

### A. Execute the CLI (n8n Execute Command, or any shell)

On a machine that has this repo and the dependencies:

```bash
cd /path/to/reese-reviews/tools/review-image
PYTHONPATH=. python3 -m review_image \
  --asin B0XXXXXXXX \
  --remove-text \
  --preset all \
  --out-dir /tmp/product-out
```

Swap `--asin` for `--from-url URL` or a local file. This is the same command a human would run. n8n can then upload the files from `--out-dir`.

### B. Webhook → CircleCI pipeline (Zapier or n8n HTTP Request)

1. Open a Product Image Process WR (manually, or via the GitHub API) with the form fields filled in.
2. Trigger the queue:

```bash
curl -X POST https://circleci.com/api/v2/project/github/midnghtsapphire/reese-reviews/pipeline \
  -H "Circle-Token: $CIRCLECI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"branch":"main","parameters":{"run_image_process_queue":true}}'
```

Store `CIRCLECI_TOKEN` in n8n / Zapier credentials, not in this repo. The pipeline processes every open `image-process` issue that is not yet `image-done`.

You can also schedule that same pipeline every 15 minutes in the CircleCI UI (see [SETUP.md](SETUP.md)) so a new WR is picked up without Zapier.

## CircleCI tests

A manual / branch-only job in `.circleci/config.yml` runs the tests. It does not run on every push to `main` (free plan). Trigger it with `run_review_image=true`, or it runs automatically on non-`main` branches. The job sets `REVIEW_IMAGE_FORCE_OPENCV=1` and `REVIEW_IMAGE_NO_NETWORK=1`.

The image-process **queue** job only runs when `run_image_process_queue=true`. It is not a GitHub Actions workflow.

## Alternative lane: ops/self-hosted-ci

Because GitHub Actions is billing-locked, event-shaped jobs belong on CircleCI or on `ops/self-hosted-ci` (the act dispatcher) running on a machine Audrey controls — not on the bot box. To process the queue there, export `IMAGE_PROCESS_GITHUB_TOKEN` (and optional `NOTION_TOKEN`) and run `python3 -m review_image.queue` from a checkout. Details are in [SETUP.md](SETUP.md).

## Amazon review photos

For photos you will **post as an Amazon review**, Amazon’s community guidelines say the photos should be **your own** photos of the product you received. Listing photos can still be copied for inventory pages, social, cutouts, and other uses; Amazon may reject a listing image if you upload it as a review photo.

## What was already in the repos (and what was not)

There is **no working Notion image-ingest script** in the Amazon Resale Inventory database, and no n8n or Zapier workflow for this process was found in `reese-reviews`, `ecommerce-automation`, or `marketing-automation-standalone`. This folder is the working implementation, and the GitHub issue form plus CircleCI queue are the selectable stand-in for that kind of automation.

Earlier notes (VineFlow’s rembg design, `cli/image.py` being a stub, and other pipelines that generate or scrape images) still apply. VineFlow was not modified.

## Alternatives not wired in

- **YouCam / Perfect Corp** — already available as a paid/cloud option for retouching. It is not called by default, so the tool stays free and local.
- **remove.bg** and similar paid APIs are also not wired in.

## Related docs

- [SETUP.md](SETUP.md) — labels, CircleCI context, schedule, tokens.
- Amazon review work-request flow: `docs/AMAZON-REVIEWS-REFERENCE.md`.
