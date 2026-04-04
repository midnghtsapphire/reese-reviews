// ============================================================
// YOUTUBE AUTO-POSTING SERVICE
// Full YouTube Data API v3 integration for:
// - OAuth2 flow for connecting a YouTube account
// - Auto-generate video titles, descriptions, tags
// - FTC disclosure compliance
// - Upload queue with scheduled posting
// - YouTube Shorts support (< 60s)
// ============================================================

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const YOUTUBE_UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos";
const YOUTUBE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const YOUTUBE_TOKEN_URL = "https://oauth2.googleapis.com/token";

// Scopes required for video upload and channel management
const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/youtube.readonly",
].join(" ");

// ─── TYPES ──────────────────────────────────────────────────

export interface YouTubeCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface YouTubeTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
  channelId?: string;
  channelTitle?: string;
}

export interface YouTubeVideoMetadata {
  title: string;
  description: string;
  tags: string[];
  categoryId: string; // YouTube category ID
  privacyStatus: "public" | "private" | "unlisted";
  madeForKids: boolean;
  isShort: boolean;
  scheduledPublishAt?: string; // ISO date for scheduled publish
  playlistId?: string;
  defaultLanguage?: string;
  thumbnailUrl?: string;
}

export interface YouTubeUploadResult {
  videoId: string;
  videoUrl: string;
  channelUrl: string;
  status: "uploaded" | "processing" | "published" | "failed";
  publishedAt?: string;
  error?: string;
}

export interface UploadQueueItem {
  id: string;
  videoBlob: Blob | null;
  videoUrl: string; // Local blob URL or remote URL
  metadata: YouTubeVideoMetadata;
  reviewId: string;
  productName: string;
  status: "queued" | "uploading" | "uploaded" | "scheduled" | "published" | "failed";
  progress: number; // 0-100
  scheduledAt?: string; // ISO date
  result?: YouTubeUploadResult;
  createdAt: string;
  error?: string;
}

// YouTube video categories relevant to product reviews
export const YOUTUBE_CATEGORIES = [
  { id: "22", label: "People & Blogs" },
  { id: "26", label: "Howto & Style" },
  { id: "28", label: "Science & Technology" },
  { id: "24", label: "Entertainment" },
  { id: "20", label: "Gaming" },
  { id: "19", label: "Travel & Events" },
] as const;

// ─── STORAGE ────────────────────────────────────────────────

const TOKENS_KEY = "reese-youtube-tokens";
const CREDENTIALS_KEY = "reese-youtube-credentials";
const QUEUE_KEY = "reese-youtube-upload-queue";

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save [${key}]:`, e);
  }
}

// ─── OAUTH2 FLOW ────────────────────────────────────────────

export function getStoredCredentials(): YouTubeCredentials | null {
  return loadJSON<YouTubeCredentials | null>(CREDENTIALS_KEY, null);
}

export function saveCredentials(creds: YouTubeCredentials): void {
  saveJSON(CREDENTIALS_KEY, creds);
}

export function getStoredTokens(): YouTubeTokens | null {
  return loadJSON<YouTubeTokens | null>(TOKENS_KEY, null);
}

export function saveTokens(tokens: YouTubeTokens): void {
  saveJSON(TOKENS_KEY, tokens);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKENS_KEY);
}

export function isAuthenticated(): boolean {
  const tokens = getStoredTokens();
  if (!tokens) return false;
  return tokens.expiresAt > Date.now();
}

/**
 * Generate the OAuth2 authorization URL.
 * User should be redirected to this URL to grant access.
 */
export function getAuthorizationUrl(credentials: YouTubeCredentials): string {
  const params = new URLSearchParams({
    client_id: credentials.clientId,
    redirect_uri: credentials.redirectUri,
    response_type: "code",
    scope: YOUTUBE_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state: generateState(),
  });
  return `${YOUTUBE_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access + refresh tokens.
 */
export async function exchangeCodeForTokens(
  code: string,
  credentials: YouTubeCredentials
): Promise<YouTubeTokens> {
  const response = await fetch(YOUTUBE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      redirect_uri: credentials.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const data = await response.json();
  const tokens: YouTubeTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  // Fetch channel info
  try {
    const channelInfo = await fetchChannelInfo(tokens.accessToken);
    tokens.channelId = channelInfo.id;
    tokens.channelTitle = channelInfo.title;
  } catch {
    // Non-fatal: channel info is optional
  }

  saveTokens(tokens);
  return tokens;
}

/**
 * Refresh the access token using the refresh token.
 */
export async function refreshAccessToken(): Promise<YouTubeTokens> {
  const tokens = getStoredTokens();
  const credentials = getStoredCredentials();
  if (!tokens?.refreshToken || !credentials) {
    throw new Error("No refresh token or credentials available");
  }

  const response = await fetch(YOUTUBE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: tokens.refreshToken,
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Token refresh failed");
  }

  const data = await response.json();
  const updated: YouTubeTokens = {
    ...tokens,
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  saveTokens(updated);
  return updated;
}

/**
 * Get a valid access token, refreshing if needed.
 */
async function getValidToken(): Promise<string> {
  let tokens = getStoredTokens();
  if (!tokens) throw new Error("Not authenticated with YouTube");

  // Refresh if token expires within 5 minutes
  if (tokens.expiresAt < Date.now() + 300000) {
    tokens = await refreshAccessToken();
  }

  return tokens.accessToken;
}

// ─── CHANNEL INFO ───────────────────────────────────────────

async function fetchChannelInfo(
  accessToken: string
): Promise<{ id: string; title: string; subscriberCount: string }> {
  const response = await fetch(
    `${YOUTUBE_API_BASE}/channels?part=snippet,statistics&mine=true`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) throw new Error("Failed to fetch channel info");

  const data = await response.json();
  const channel = data.items?.[0];
  if (!channel) throw new Error("No channel found");

  return {
    id: channel.id,
    title: channel.snippet.title,
    subscriberCount: channel.statistics?.subscriberCount ?? "0",
  };
}

export async function getChannelInfo() {
  const token = await getValidToken();
  return fetchChannelInfo(token);
}

// ─── FTC DISCLOSURE ─────────────────────────────────────────

const FTC_VINE_DISCLOSURE =
  "I received this product free of charge through the Amazon Vine program. All opinions expressed are my own honest assessment.";

const FTC_AFFILIATE_DISCLOSURE =
  "This video contains affiliate links. As an Amazon Associate, I earn from qualifying purchases.";

/**
 * Build a compliant video description with FTC disclosures.
 */
export function buildCompliantDescription(
  reviewBody: string,
  productName: string,
  affiliateLink?: string,
  isVineProduct: boolean = true,
  customDisclosure?: string
): string {
  const sections: string[] = [];

  // Main review content
  sections.push(reviewBody.slice(0, 4500)); // YouTube description limit is ~5000 chars

  // Product link
  if (affiliateLink) {
    sections.push(`\n\nCheck it out here: ${affiliateLink}`);
  }

  // Timestamps placeholder
  sections.push("\n\n--- TIMESTAMPS ---");
  sections.push("0:00 Introduction");
  sections.push("0:15 First Impressions");
  sections.push("0:30 Pros & Cons");
  sections.push("0:45 Final Verdict");

  // FTC Disclosures
  sections.push("\n\n--- DISCLOSURE ---");
  if (isVineProduct) {
    sections.push(FTC_VINE_DISCLOSURE);
  }
  if (affiliateLink) {
    sections.push(FTC_AFFILIATE_DISCLOSURE);
  }
  if (customDisclosure) {
    sections.push(customDisclosure);
  }

  // Channel branding
  sections.push("\n\n--- ABOUT REESE REVIEWS ---");
  sections.push(
    "Reese Reviews Everything — honest, unfiltered reviews on products, food, services, entertainment, and tech. From box to beautiful."
  );
  sections.push("Website: https://reesereviews.com");

  // Hashtags
  sections.push(
    `\n#ReeseReviews #${productName.replace(/[^a-zA-Z0-9]/g, "")} #ProductReview #HonestReview #AmazonVine`
  );

  return sections.join("\n");
}

// ─── AUTO-METADATA GENERATION ───────────────────────────────

export interface ReviewMetadataInput {
  productName: string;
  category: string;
  rating: number;
  pros: string[];
  cons: string[];
  reviewBody: string;
  affiliateLink?: string;
  isVineProduct?: boolean;
  videoDurationSeconds?: number;
}

/**
 * Auto-generate YouTube video metadata from review data.
 */
export function generateVideoMetadata(
  input: ReviewMetadataInput
): YouTubeVideoMetadata {
  const isShort = (input.videoDurationSeconds ?? 61) <= 60;

  // Generate title (max 100 chars)
  const titleVariants = [
    `${input.productName} Review — ${input.rating} Stars! Honest Take`,
    `Is the ${input.productName} Worth It? My Honest Review`,
    `${input.productName} — The Good, Bad & Ugly | Reese Reviews`,
    `I Tried the ${input.productName} So You Don't Have To`,
    `${input.rating}/5 Stars — ${input.productName} Review`,
  ];
  const title = isShort
    ? `${input.productName} in 60 Seconds #shorts`
    : titleVariants[Math.floor(Math.random() * titleVariants.length)];

  // Generate description with FTC compliance
  const description = buildCompliantDescription(
    input.reviewBody,
    input.productName,
    input.affiliateLink,
    input.isVineProduct ?? true
  );

  // Generate tags (max 500 chars total)
  const baseTags = [
    "reese reviews",
    "product review",
    "honest review",
    input.productName.toLowerCase(),
    input.category.toLowerCase(),
    "amazon vine",
    "unboxing",
  ];
  const proTags = input.pros.slice(0, 3).map((p) => p.toLowerCase().slice(0, 30));
  const tags = [...baseTags, ...proTags].slice(0, 15);

  // Map category to YouTube category ID
  const categoryMap: Record<string, string> = {
    tech: "28",
    electronics: "28",
    gaming: "20",
    food: "26",
    beauty: "26",
    home: "26",
    fashion: "26",
    entertainment: "24",
    travel: "19",
  };
  const categoryId =
    categoryMap[input.category.toLowerCase()] ?? "22"; // Default: People & Blogs

  return {
    title: title.slice(0, 100),
    description,
    tags,
    categoryId,
    privacyStatus: "public",
    madeForKids: false,
    isShort,
    defaultLanguage: "en",
  };
}

// ─── VIDEO UPLOAD ───────────────────────────────────────────

/**
 * Upload a video to YouTube using resumable upload protocol.
 */
export async function uploadVideo(
  videoBlob: Blob,
  metadata: YouTubeVideoMetadata,
  onProgress?: (percent: number) => void
): Promise<YouTubeUploadResult> {
  const token = await getValidToken();

  // Step 1: Initialize resumable upload
  const snippet: Record<string, unknown> = {
    title: metadata.title,
    description: metadata.description,
    tags: metadata.tags,
    categoryId: metadata.categoryId,
    defaultLanguage: metadata.defaultLanguage ?? "en",
  };

  const status: Record<string, unknown> = {
    privacyStatus: metadata.privacyStatus,
    madeForKids: metadata.madeForKids,
    selfDeclaredMadeForKids: metadata.madeForKids,
  };

  if (metadata.scheduledPublishAt) {
    status.publishAt = metadata.scheduledPublishAt;
    status.privacyStatus = "private"; // Must be private for scheduled
  }

  const initResponse = await fetch(
    `${YOUTUBE_UPLOAD_URL}?uploadType=resumable&part=snippet,status`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Length": String(videoBlob.size),
        "X-Upload-Content-Type": videoBlob.type || "video/mp4",
      },
      body: JSON.stringify({ snippet, status }),
    }
  );

  if (!initResponse.ok) {
    const err = await initResponse.text();
    throw new Error(`Upload init failed: ${err}`);
  }

  const uploadUrl = initResponse.headers.get("Location");
  if (!uploadUrl) throw new Error("No upload URL returned");

  // Step 2: Upload the video data
  const xhr = new XMLHttpRequest();

  return new Promise<YouTubeUploadResult>((resolve, reject) => {
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({
            videoId: data.id,
            videoUrl: `https://www.youtube.com/watch?v=${data.id}`,
            channelUrl: `https://www.youtube.com/channel/${data.snippet?.channelId ?? ""}`,
            status: "uploaded",
            publishedAt: data.snippet?.publishedAt,
          });
        } catch {
          resolve({
            videoId: "",
            videoUrl: "",
            channelUrl: "",
            status: "failed",
            error: "Failed to parse upload response",
          });
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Upload network error"));
    });

    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", videoBlob.type || "video/mp4");
    xhr.send(videoBlob);
  });
}

// ─── THUMBNAIL UPLOAD ───────────────────────────────────────

export async function uploadThumbnail(
  videoId: string,
  thumbnailBlob: Blob
): Promise<void> {
  const token = await getValidToken();

  const response = await fetch(
    `${YOUTUBE_UPLOAD_URL.replace("/videos", "/thumbnails/set")}?videoId=${videoId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": thumbnailBlob.type || "image/jpeg",
      },
      body: thumbnailBlob,
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Thumbnail upload failed: ${err}`);
  }
}

// ─── UPLOAD QUEUE ───────────────────────────────────────────

export function getUploadQueue(): UploadQueueItem[] {
  return loadJSON<UploadQueueItem[]>(QUEUE_KEY, []);
}

export function addToUploadQueue(item: Omit<UploadQueueItem, "id" | "createdAt" | "status" | "progress">): UploadQueueItem {
  const queue = getUploadQueue();
  const newItem: UploadQueueItem = {
    ...item,
    id: `yt-upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    status: item.scheduledAt ? "scheduled" : "queued",
    progress: 0,
    createdAt: new Date().toISOString(),
  };
  queue.push(newItem);
  saveJSON(QUEUE_KEY, queue);
  return newItem;
}

export function updateQueueItem(id: string, patch: Partial<UploadQueueItem>): void {
  const queue = getUploadQueue();
  const idx = queue.findIndex((q) => q.id === id);
  if (idx !== -1) {
    queue[idx] = { ...queue[idx], ...patch };
    saveJSON(QUEUE_KEY, queue);
  }
}

export function removeFromQueue(id: string): void {
  const queue = getUploadQueue().filter((q) => q.id !== id);
  saveJSON(QUEUE_KEY, queue);
}

export function clearCompletedFromQueue(): void {
  const queue = getUploadQueue().filter(
    (q) => q.status !== "uploaded" && q.status !== "published"
  );
  saveJSON(QUEUE_KEY, queue);
}

/**
 * Process the upload queue — uploads all queued items.
 */
export async function processUploadQueue(
  onItemProgress?: (itemId: string, progress: number) => void,
  onItemComplete?: (itemId: string, result: YouTubeUploadResult) => void,
  onItemError?: (itemId: string, error: string) => void
): Promise<void> {
  const queue = getUploadQueue();
  const now = new Date();

  for (const item of queue) {
    // Skip non-ready items
    if (item.status !== "queued") {
      // Check if scheduled item is due
      if (item.status === "scheduled" && item.scheduledAt) {
        const scheduledDate = new Date(item.scheduledAt);
        if (scheduledDate > now) continue; // Not yet due
      } else {
        continue;
      }
    }

    try {
      updateQueueItem(item.id, { status: "uploading" });

      // Fetch the video blob if we have a URL but no blob
      let blob = item.videoBlob;
      if (!blob && item.videoUrl) {
        const response = await fetch(item.videoUrl);
        blob = await response.blob();
      }
      if (!blob) {
        throw new Error("No video data available");
      }

      const result = await uploadVideo(blob, item.metadata, (progress) => {
        updateQueueItem(item.id, { progress });
        onItemProgress?.(item.id, progress);
      });

      updateQueueItem(item.id, {
        status: "uploaded",
        progress: 100,
        result,
      });
      onItemComplete?.(item.id, result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      updateQueueItem(item.id, {
        status: "failed",
        error: errorMsg,
      });
      onItemError?.(item.id, errorMsg);
    }
  }
}

// ─── HELPERS ────────────────────────────────────────────────

function generateState(): string {
  return Math.random().toString(36).slice(2, 15);
}

/**
 * Parse the OAuth callback URL to extract the authorization code.
 */
export function parseCallbackCode(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("code");
  } catch {
    return null;
  }
}

/**
 * Disconnect YouTube account.
 */
export function disconnectYouTube(): void {
  clearTokens();
  localStorage.removeItem(CREDENTIALS_KEY);
  localStorage.removeItem(QUEUE_KEY);
}

/**
 * Get YouTube Shorts-specific metadata adjustments.
 */
export function adjustForShorts(metadata: YouTubeVideoMetadata): YouTubeVideoMetadata {
  return {
    ...metadata,
    isShort: true,
    title: metadata.title.includes("#shorts")
      ? metadata.title
      : `${metadata.title.slice(0, 90)} #shorts`,
    tags: [...metadata.tags.filter((t) => t !== "shorts"), "shorts"],
  };
}
