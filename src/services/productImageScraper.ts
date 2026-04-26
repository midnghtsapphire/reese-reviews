// ============================================================
// PRODUCT IMAGE SCRAPER SERVICE
// Harvests product listing images and review photos from:
//   1. Amazon product page (main listing images)
//   2. Amazon international reviews (UK, DE, JP, CA, AU)
//   3. Walmart product reviews
//   4. Target product reviews
//
// In demo/offline mode, returns realistic placeholder data.
// In production, calls a backend proxy to avoid CORS.
// ============================================================

function getProxyBase(): string {
  return import.meta.env.VITE_SCRAPER_PROXY_URL || "";
}

// ─── TYPES ──────────────────────────────────────────────────

export interface ScrapedImage {
  url: string;
  source: ScrapedImageSource;
  type: "listing" | "review" | "lifestyle";
  alt: string;
  width?: number;
  height?: number;
  casualName?: string;
}

export type ScrapedImageSource =
  | "amazon-listing"
  | "amazon-review-uk"
  | "amazon-review-de"
  | "amazon-review-jp"
  | "amazon-review-ca"
  | "amazon-review-au"
  | "amazon-review-in"
  | "walmart-listing"
  | "walmart-review"
  | "target-listing"
  | "target-review";

export interface ProductImageResult {
  asin: string;
  productName: string;
  listingImages: ScrapedImage[];
  reviewImages: ScrapedImage[];
  allImages: ScrapedImage[];
  sources: ScrapedImageSource[];
  scrapedAt: string;
  isDemo: boolean;
}

// Country domains for international Amazon review scraping
// We deliberately exclude .com (US) since the user reviews there
const AMAZON_INTERNATIONAL_DOMAINS: Array<{
  domain: string;
  country: string;
  sourceKey: ScrapedImageSource;
}> = [
  { domain: "amazon.co.uk", country: "UK", sourceKey: "amazon-review-uk" },
  { domain: "amazon.de", country: "DE", sourceKey: "amazon-review-de" },
  { domain: "amazon.co.jp", country: "JP", sourceKey: "amazon-review-jp" },
  { domain: "amazon.ca", country: "CA", sourceKey: "amazon-review-ca" },
  { domain: "amazon.com.au", country: "AU", sourceKey: "amazon-review-au" },
  { domain: "amazon.in", country: "IN", sourceKey: "amazon-review-in" },
];

// ─── ASIN EXTRACTION ────────────────────────────────────────

export function extractAsinFromUrl(url: string): string | null {
  // Match /dp/ASIN, /gp/product/ASIN, or /ASIN/ patterns
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /\/product\/([A-Z0-9]{10})/i,
    /amazon\.com.*\/([A-Z0-9]{10})(?:\/|$|\?)/i,
  ];
  for (const pat of patterns) {
    const m = url.match(pat);
    if (m) return m[1].toUpperCase();
  }
  return null;
}

export function buildAmazonUrl(asin: string, domain = "amazon.com"): string {
  return `https://www.${domain}/dp/${asin}`;
}

// ─── CASUAL FILE NAMING ─────────────────────────────────────

/**
 * Generate a casual, phone-style filename so images don't look scraped.
 * Produces names like IMG_20260425_143022.jpg or photo_3.jpg.
 */
export function casualFilename(index: number, ext = "jpg"): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad((now.getSeconds() + index) % 60)}`;
  const styles = [
    `IMG_${datePart}_${timePart}.${ext}`,
    `photo_${index + 1}.${ext}`,
    `image${index + 1}.${ext}`,
    `PXL_${datePart}_${timePart}.${ext}`,
  ];
  return styles[index % styles.length];
}

export function casualVideoFilename(index = 0, ext = "mp4"): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const styles = [
    `VID_${datePart}_${timePart}.${ext}`,
    `video_${index + 1}.${ext}`,
    `clip_${datePart}.${ext}`,
    `MOV_${timePart}.${ext}`,
  ];
  return styles[index % styles.length];
}

// ─── DEMO MODE ──────────────────────────────────────────────

function isOfflineMode(): boolean {
  return !getProxyBase();
}

function generateDemoListingImages(asin: string, productName: string): ScrapedImage[] {
  const names = ["main", "angle", "back", "detail", "lifestyle"];
  const types: Array<"listing" | "lifestyle"> = ["listing", "listing", "listing", "listing", "lifestyle"];
  return names.map((name, i) => ({
    url: `https://m.media-amazon.com/images/I/${asin}-${name}.jpg`,
    source: "amazon-listing" as const,
    type: types[i],
    alt: `${productName} - ${name}`,
    casualName: casualFilename(i),
  }));
}

function generateDemoReviewImages(asin: string, productName: string): ScrapedImage[] {
  const sources: Array<{ key: ScrapedImageSource; label: string }> = [
    { key: "amazon-review-uk", label: "UK reviewer" },
    { key: "amazon-review-de", label: "DE reviewer" },
    { key: "amazon-review-jp", label: "JP reviewer" },
    { key: "walmart-review", label: "Walmart buyer" },
    { key: "target-review", label: "Target buyer" },
  ];

  let imgCounter = 5; // continue numbering after listing images
  return sources.flatMap((src, srcIdx) => {
    const imgs: ScrapedImage[] = [
      {
        url: `https://m.media-amazon.com/images/I/${asin}-review-${src.key}-1.jpg`,
        source: src.key,
        type: "review" as const,
        alt: `${productName} - Photo by ${src.label} (#1)`,
        casualName: casualFilename(imgCounter++),
      },
      {
        url: `https://m.media-amazon.com/images/I/${asin}-review-${src.key}-2.jpg`,
        source: src.key,
        type: "review" as const,
        alt: `${productName} - Photo by ${src.label} (#2)`,
        casualName: casualFilename(imgCounter++),
      },
    ];
    if (srcIdx < 2) {
      imgs.push({
        url: `https://m.media-amazon.com/images/I/${asin}-review-${src.key}-3.jpg`,
        source: src.key,
        type: "review" as const,
        alt: `${productName} - Photo by ${src.label} (#3)`,
        casualName: casualFilename(imgCounter++),
      });
    }
    return imgs;
  });
}

// ─── MAIN SCRAPER ───────────────────────────────────────────

/**
 * Scrape product images from Amazon listing + international reviews + Walmart + Target.
 *
 * In DEMO mode: returns realistic placeholder URLs.
 * In PRODUCTION mode: calls the backend proxy to fetch real images.
 */
export async function scrapeProductImages(
  asin: string,
  productName: string,
): Promise<ProductImageResult> {
  if (isOfflineMode()) {
    console.warn("[ImageScraper] No proxy configured — using demo image data");
    const listingImages = generateDemoListingImages(asin, productName);
    const reviewImages = generateDemoReviewImages(asin, productName);
    const allImages = [...listingImages, ...reviewImages];
    const sources = [...new Set(allImages.map((img) => img.source))] as ScrapedImageSource[];

    return {
      asin,
      productName,
      listingImages,
      reviewImages,
      allImages,
      sources,
      scrapedAt: new Date().toISOString(),
      isDemo: true,
    };
  }

  // Production mode: call backend proxy for each source in parallel
  const results = await Promise.allSettled([
    fetchAmazonListingImages(asin, productName),
    ...AMAZON_INTERNATIONAL_DOMAINS.map((intl) =>
      fetchAmazonReviewImages(asin, productName, intl.domain, intl.sourceKey),
    ),
    fetchWalmartImages(asin, productName),
    fetchTargetImages(asin, productName),
  ]);

  // Collect all images, then classify by type (not by array position)
  const allImages = results.flatMap((r) =>
    r.status === "fulfilled" ? r.value : [],
  );
  const listingImgs = allImages.filter((img) => img.type === "listing" || img.type === "lifestyle");
  const reviewImgs = allImages.filter((img) => img.type === "review");
  const sources = [...new Set(allImages.map((img) => img.source))] as ScrapedImageSource[];

  return {
    asin,
    productName,
    listingImages: listingImgs,
    reviewImages: reviewImgs,
    allImages,
    sources,
    scrapedAt: new Date().toISOString(),
    isDemo: false,
  };
}

// ─── AMAZON LISTING IMAGES ──────────────────────────────────

async function fetchAmazonListingImages(
  asin: string,
  productName: string,
): Promise<ScrapedImage[]> {
  try {
    const resp = await fetch(`${getProxyBase()}/api/scrape/amazon-listing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asin }),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data: { images: Array<{ url: string; alt?: string }> } =
      await resp.json();
    return data.images.map((img, i) => ({
      url: img.url,
      source: "amazon-listing" as const,
      type: (i === 0 ? "listing" : i >= data.images.length - 1 ? "lifestyle" : "listing") as ScrapedImage["type"],
      alt: img.alt || `${productName} - Image ${i + 1}`,
      casualName: casualFilename(i),
    }));
  } catch (err) {
    console.warn("[ImageScraper] Amazon listing fetch failed:", err);
    return [];
  }
}

// ─── AMAZON INTERNATIONAL REVIEW IMAGES ─────────────────────

async function fetchAmazonReviewImages(
  asin: string,
  productName: string,
  domain: string,
  sourceKey: ScrapedImageSource,
): Promise<ScrapedImage[]> {
  try {
    const resp = await fetch(`${getProxyBase()}/api/scrape/amazon-reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asin, domain }),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data: { images: Array<{ url: string; alt?: string }> } =
      await resp.json();
    return data.images.map((img, i) => ({
      url: img.url,
      source: sourceKey,
      type: "review" as const,
      alt:
        img.alt ||
        `${productName} - ${domain} review photo ${i + 1}`,
      casualName: casualFilename(i + 10),
    }));
  } catch (err) {
    console.warn(`[ImageScraper] ${domain} review fetch failed:`, err);
    return [];
  }
}

// ─── WALMART IMAGES ─────────────────────────────────────────

async function fetchWalmartImages(
  asin: string,
  productName: string,
): Promise<ScrapedImage[]> {
  try {
    const resp = await fetch(`${getProxyBase()}/api/scrape/walmart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asin, productName }),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data: {
      listingImages: Array<{ url: string; alt?: string }>;
      reviewImages: Array<{ url: string; alt?: string }>;
    } = await resp.json();
    return [
      ...data.listingImages.map((img, i) => ({
        url: img.url,
        source: "walmart-listing" as const,
        type: "listing" as const,
        alt: img.alt || `${productName} - Walmart listing ${i + 1}`,
        casualName: casualFilename(i + 20),
      })),
      ...data.reviewImages.map((img, i) => ({
        url: img.url,
        source: "walmart-review" as const,
        type: "review" as const,
        alt: img.alt || `${productName} - Walmart review photo ${i + 1}`,
        casualName: casualFilename(i + 25),
      })),
    ];
  } catch (err) {
    console.warn("[ImageScraper] Walmart fetch failed:", err);
    return [];
  }
}

// ─── TARGET IMAGES ──────────────────────────────────────────

async function fetchTargetImages(
  asin: string,
  productName: string,
): Promise<ScrapedImage[]> {
  try {
    const resp = await fetch(`${getProxyBase()}/api/scrape/target`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asin, productName }),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data: {
      listingImages: Array<{ url: string; alt?: string }>;
      reviewImages: Array<{ url: string; alt?: string }>;
    } = await resp.json();
    return [
      ...data.listingImages.map((img, i) => ({
        url: img.url,
        source: "target-listing" as const,
        type: "listing" as const,
        alt: img.alt || `${productName} - Target listing ${i + 1}`,
        casualName: casualFilename(i + 30),
      })),
      ...data.reviewImages.map((img, i) => ({
        url: img.url,
        source: "target-review" as const,
        type: "review" as const,
        alt: img.alt || `${productName} - Target review photo ${i + 1}`,
        casualName: casualFilename(i + 35),
      })),
    ];
  } catch (err) {
    console.warn("[ImageScraper] Target fetch failed:", err);
    return [];
  }
}

// ─── UTILITIES ──────────────────────────────────────────────

/** Human-readable label for an image source */
export function sourceLabel(source: ScrapedImageSource): string {
  const labels: Record<ScrapedImageSource, string> = {
    "amazon-listing": "Amazon Listing",
    "amazon-review-uk": "Amazon UK Review",
    "amazon-review-de": "Amazon DE Review",
    "amazon-review-jp": "Amazon JP Review",
    "amazon-review-ca": "Amazon CA Review",
    "amazon-review-au": "Amazon AU Review",
    "amazon-review-in": "Amazon IN Review",
    "walmart-listing": "Walmart Listing",
    "walmart-review": "Walmart Review",
    "target-listing": "Target Listing",
    "target-review": "Target Review",
  };
  return labels[source] || source;
}

/** Deduplicate images by URL */
export function deduplicateImages(images: ScrapedImage[]): ScrapedImage[] {
  const seen = new Set<string>();
  return images.filter((img) => {
    if (seen.has(img.url)) return false;
    seen.add(img.url);
    return true;
  });
}

/** Filter to only review images (not listing images) */
export function getReviewOnlyImages(result: ProductImageResult): ScrapedImage[] {
  return result.allImages.filter((img) => img.type === "review");
}

/** Count images by source for display */
export function countBySource(images: ScrapedImage[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const img of images) {
    const label = sourceLabel(img.source);
    counts[label] = (counts[label] || 0) + 1;
  }
  return counts;
}
