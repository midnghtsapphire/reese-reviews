# Review image process

Turn an **Original Product Photo** into a **Final Review Photo** the same way Audrey’s Notion item pages do:

1. Crop to the product (auto subject box with padding, or a manual `--crop`).
2. Remove the background with free, local **rembg** (`u2net`). If rembg is not installed, a local OpenCV threshold / GrabCut fallback is used.
3. Apply a **light filter** (gentle brightness, contrast, and warmth).
4. Resize and pad so the result is **exactly** the original photo’s pixel dimensions, without changing the product’s shape. The product’s color is only adjusted by the light filter.

The default output is `<name>-final-review.jpg` next to the input (or `--out`).

This is a manual, one-photo tool. It does not post anything to Amazon.

## Your own photo only

Amazon’s community guidelines say review photos must be **your own** photos of the product you received. Pass the Original Product Photo you took. This tool will not download Walmart, Target, or Amazon listing images.

## What was already in the repos (and what was not)

There is **no working Notion image-ingest script** in the Amazon Resale Inventory database, and no ready-to-run crop / background / light-filter script in GitHub.

Searched:

- Notion: the Amazon Resale Inventory (Reviewed NIB) database (`af0be9fedf614e469f0d383641b756c5`), item pages including 2 Pocket Toploader Binder and Garvee camping chair (“Processed version already attached”), plus workspace searches for ingest, script, python, rembg, Pillow, upload, and image process. Those pages record the **steps** and hold photos. They do not contain a code block or attached script.
- GitHub (midnghtsapphire): rembg, background removal, light filter, Original / Final Review Photo, Notion upload, Keepa, Sheet Row. Hits that are **not** this process:
  - [`midnghtsapphire/VineFlow`](https://github.com/midnghtsapphire/VineFlow) — design only. README / PROMPT.md say “download product image, remove background with rembg, apply glassmorphic filter.” `cli/image.py` is a **stub** that writes an empty file. This tool uses rembg like VineFlow planned, and adds an optional `--filter glass` preset named after that filter. VineFlow was not modified. The stub idea of pulling retailer or listing images is **not** implemented, because Amazon requires your own photo.
  - `reese-reviews/app/stages/s1_ingest.py` and `s5_images.py` — a different pipeline: order ingest, then Leonardo AI **generated** images, not Notion product-photo processing.
  - Photo scrapers and uploaders in `reese-reviews/src/services/` and Unsplash/Pexels helpers in `affiliate-marketing-system` — search and stock/listing images, not this process.

So this folder is the working implementation of the Notion item-page process, using VineFlow’s rembg choice.

## On your computer

From a checkout of `reese-reviews`:

```bash
cd tools/review-image
python3 -m pip install -r requirements.txt
python3 -m pip install "rembg[cpu]"   # optional, recommended; skip to use the OpenCV fallback
PYTHONPATH=. python3 -m review_image /path/to/your-original.jpg
```

That writes `/path/to/your-original-final-review.jpg`.

Useful flags:

```bash
# Manual crop (left, top, width, height in pixels)
PYTHONPATH=. python3 -m review_image --crop 40,20,800,1000 /path/to/your-original.jpg

# Transparent background (saves PNG)
PYTHONPATH=. python3 -m review_image --bg transparent --out /tmp/final.png /path/to/your-original.jpg

# Skip the light filter, or use the VineFlow-inspired glass preset
PYTHONPATH=. python3 -m review_image --filter none /path/to/your-original.jpg
PYTHONPATH=. python3 -m review_image --filter glass /path/to/your-original.jpg
```

### Notion page (optional)

```bash
export NOTION_TOKEN="ntn_..."   # integration token; never commit this
PYTHONPATH=. python3 -m review_image --notion https://app.notion.com/p/YOUR_PAGE_ID
```

With a token, the tool reads the **Original Product Photo** image block from the item page and writes a local Final Review Photo. To also append the result as **Final Review Photo (matches original size + light filter)** on that page, add `--upload-notion`. If `NOTION_TOKEN` is unset, the command prints setup instructions and exits. Create an integration at [notion.so/my-integrations](https://www.notion.so/my-integrations) and grant it access to the inventory pages.

You can also pass an image URL (a direct photo URL, not a listing scrape):

```bash
PYTHONPATH=. python3 -m review_image https://example.com/your-own-photo.jpg --out ./final.jpg
```

### Tests

```bash
cd tools/review-image
PYTHONPATH=. REVIEW_IMAGE_FORCE_OPENCV=1 python3 -m pytest -q
```

Tests use synthetic images and never call live Notion or download rembg models.

## CircleCI

A manual / branch-only job in the repo `.circleci/config.yml` runs the tests. It does not run on every push to `main` (free plan). Trigger it with the pipeline parameter `run_review_image=true`, or it runs automatically on non-`main` branches. The job sets `REVIEW_IMAGE_FORCE_OPENCV=1` so CI does not download the u2net model.

## Alternatives not wired in

- **YouCam / Perfect Corp** — Audrey already has this as a paid/cloud option for retouching. It is not called by default, so the tool stays free and local.
- **remove.bg** and similar paid APIs are also not wired in.

## Related docs

The Amazon review work-request flow is described in `docs/AMAZON-REVIEWS-REFERENCE.md`.
