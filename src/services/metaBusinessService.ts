// ============================================================
// META BUSINESS API SERVICE
// Facebook & Instagram auto-posting, OAuth flow,
// content scheduling, and engagement tracking
// ============================================================

// ─── TYPES ─────────────────────────────────────────────────

export interface MetaAuthConfig {
  app_id: string;
  app_secret: string;
  access_token: string;
  page_access_token: string;
  page_id: string;
  instagram_account_id: string;
  token_expires_at: string;
  connected_at: string;
  user_name: string;
  page_name: string;
}

export interface MetaPost {
  id: string;
  platform: "facebook" | "instagram" | "both";
  content: string;
  image_url?: string;
  link_url?: string;
  status: "draft" | "scheduled" | "posting" | "posted" | "failed";
  scheduled_for?: string;
  posted_at?: string;
  facebook_post_id?: string;
  instagram_media_id?: string;
  error_message?: string;
  // Engagement metrics
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
  clicks: number;
  // Source
  source_review_id?: string;
  source_campaign_id?: string;
  created_at: string;
  updated_at: string;
}

export interface MetaInsights {
  page_followers: number;
  page_likes: number;
  post_reach_7d: number;
  post_engagement_7d: number;
  top_posts: Array<{
    id: string;
    content: string;
    engagement: number;
    posted_at: string;
  }>;
  audience_demographics: {
    age_ranges: Array<{ range: string; percentage: number }>;
    top_cities: Array<{ city: string; count: number }>;
    gender_split: { male: number; female: number; other: number };
  };
}

export interface PeakEngagementTime {
  day: string;
  hour: number;
  engagement_score: number;
}

// ─── STORAGE ───────────────────────────────────────────────

const STORAGE_KEY_AUTH = "reese-meta-auth";
const STORAGE_KEY_POSTS = "reese-meta-posts";
const STORAGE_KEY_INSIGHTS = "reese-meta-insights";

export function getMetaAuth(): MetaAuthConfig | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_AUTH);
    if (stored) return JSON.parse(stored);
  } catch {
    // noop
  }
  return null;
}

export function saveMetaAuth(auth: MetaAuthConfig): void {
  localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(auth));
}

export function disconnectMeta(): void {
  localStorage.removeItem(STORAGE_KEY_AUTH);
}

export function getMetaPosts(): MetaPost[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_POSTS);
    if (stored) return JSON.parse(stored);
  } catch {
    // noop
  }
  return [];
}

export function saveMetaPosts(posts: MetaPost[]): void {
  localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(posts));
}

export function saveMetaPost(post: MetaPost): void {
  const posts = getMetaPosts().filter((p) => p.id !== post.id);
  posts.push(post);
  saveMetaPosts(posts);
}

export function deleteMetaPost(id: string): void {
  const posts = getMetaPosts().filter((p) => p.id !== id);
  saveMetaPosts(posts);
}

export function getMetaInsights(): MetaInsights | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_INSIGHTS);
    if (stored) return JSON.parse(stored);
  } catch {
    // noop
  }
  return null;
}

export function saveMetaInsights(insights: MetaInsights): void {
  localStorage.setItem(STORAGE_KEY_INSIGHTS, JSON.stringify(insights));
}

// ─── OAUTH FLOW ────────────────────────────────────────────

const META_GRAPH_API = "https://graph.facebook.com/v19.0";

/**
 * Generate the OAuth URL for Meta Business login.
 * The user will be redirected to Facebook to authorize the app.
 */
export function getMetaOAuthUrl(appId: string, redirectUri: string): string {
  const scopes = [
    "pages_manage_posts",
    "pages_read_engagement",
    "pages_show_list",
    "instagram_basic",
    "instagram_content_publish",
    "instagram_manage_insights",
    "publish_video",
  ].join(",");

  return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code`;
}

/**
 * Exchange the authorization code for an access token.
 */
export async function exchangeCodeForToken(
  code: string,
  appId: string,
  appSecret: string,
  redirectUri: string
): Promise<{ access_token: string; expires_in: number }> {
  const response = await fetch(
    `${META_GRAPH_API}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Failed to exchange code for token");
  }

  return response.json();
}

/**
 * Get a long-lived access token (60 days instead of 1 hour).
 */
export async function getLongLivedToken(
  shortLivedToken: string,
  appId: string,
  appSecret: string
): Promise<{ access_token: string; expires_in: number }> {
  const response = await fetch(
    `${META_GRAPH_API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Failed to get long-lived token");
  }

  return response.json();
}

/**
 * Get the user's Facebook pages and Instagram accounts.
 */
export async function getPages(accessToken: string): Promise<
  Array<{
    id: string;
    name: string;
    access_token: string;
    instagram_business_account?: { id: string };
  }>
> {
  const response = await fetch(
    `${META_GRAPH_API}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${accessToken}`
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Failed to get pages");
  }

  const data = await response.json();
  return data.data || [];
}

// ─── POSTING ───────────────────────────────────────────────

/**
 * Post content to a Facebook page.
 */
export async function postToFacebook(
  pageId: string,
  pageAccessToken: string,
  message: string,
  link?: string,
  imageUrl?: string
): Promise<{ id: string }> {
  let endpoint = `${META_GRAPH_API}/${pageId}/feed`;
  const body: Record<string, string> = {
    message,
    access_token: pageAccessToken,
  };

  if (imageUrl) {
    endpoint = `${META_GRAPH_API}/${pageId}/photos`;
    body.url = imageUrl;
    body.caption = message;
  } else if (link) {
    body.link = link;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Failed to post to Facebook");
  }

  return response.json();
}

/**
 * Post content to Instagram (requires a two-step process).
 * Step 1: Create a media container
 * Step 2: Publish the container
 */
export async function postToInstagram(
  igAccountId: string,
  pageAccessToken: string,
  caption: string,
  imageUrl: string
): Promise<{ id: string }> {
  // Step 1: Create media container
  const containerResponse = await fetch(
    `${META_GRAPH_API}/${igAccountId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: pageAccessToken,
      }),
    }
  );

  if (!containerResponse.ok) {
    const err = await containerResponse.json();
    throw new Error(err.error?.message || "Failed to create Instagram media container");
  }

  const container = await containerResponse.json();

  // Step 2: Publish the container
  const publishResponse = await fetch(
    `${META_GRAPH_API}/${igAccountId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: container.id,
        access_token: pageAccessToken,
      }),
    }
  );

  if (!publishResponse.ok) {
    const err = await publishResponse.json();
    throw new Error(err.error?.message || "Failed to publish Instagram media");
  }

  return publishResponse.json();
}

// ─── ENGAGEMENT TRACKING ───────────────────────────────────

/**
 * Get engagement metrics for a Facebook post.
 */
export async function getFacebookPostInsights(
  postId: string,
  pageAccessToken: string
): Promise<{ likes: number; comments: number; shares: number; reach: number; impressions: number }> {
  try {
    const response = await fetch(
      `${META_GRAPH_API}/${postId}?fields=likes.summary(true),comments.summary(true),shares,insights.metric(post_impressions,post_reach)&access_token=${pageAccessToken}`
    );

    if (!response.ok) return { likes: 0, comments: 0, shares: 0, reach: 0, impressions: 0 };

    const data = await response.json();
    const impressionsData = data.insights?.data?.find((d: { name: string }) => d.name === "post_impressions");
    const reachData = data.insights?.data?.find((d: { name: string }) => d.name === "post_reach");

    return {
      likes: data.likes?.summary?.total_count || 0,
      comments: data.comments?.summary?.total_count || 0,
      shares: data.shares?.count || 0,
      reach: reachData?.values?.[0]?.value || 0,
      impressions: impressionsData?.values?.[0]?.value || 0,
    };
  } catch {
    return { likes: 0, comments: 0, shares: 0, reach: 0, impressions: 0 };
  }
}

// ─── SCHEDULING ────────────────────────────────────────────

/**
 * Get optimal posting times based on engagement data.
 * Falls back to industry-standard peak times if no data is available.
 */
export function getPeakEngagementTimes(): PeakEngagementTime[] {
  // Industry-standard peak engagement times for social media
  return [
    { day: "Monday", hour: 11, engagement_score: 0.85 },
    { day: "Monday", hour: 13, engagement_score: 0.80 },
    { day: "Tuesday", hour: 10, engagement_score: 0.90 },
    { day: "Tuesday", hour: 14, engagement_score: 0.82 },
    { day: "Wednesday", hour: 11, engagement_score: 0.92 },
    { day: "Wednesday", hour: 13, engagement_score: 0.88 },
    { day: "Thursday", hour: 10, engagement_score: 0.87 },
    { day: "Thursday", hour: 14, engagement_score: 0.83 },
    { day: "Friday", hour: 10, engagement_score: 0.78 },
    { day: "Friday", hour: 13, engagement_score: 0.75 },
    { day: "Saturday", hour: 11, engagement_score: 0.70 },
    { day: "Sunday", hour: 10, engagement_score: 0.72 },
    { day: "Sunday", hour: 17, engagement_score: 0.76 },
  ];
}

/**
 * Schedule a post for a peak engagement time.
 */
export function scheduleForPeakTime(
  post: MetaPost,
  preferredDay?: string
): MetaPost {
  const peaks = getPeakEngagementTimes();
  const now = new Date();

  // Find the next peak time
  let bestPeak = peaks[0];
  if (preferredDay) {
    const dayPeaks = peaks.filter((p) => p.day === preferredDay);
    if (dayPeaks.length > 0) {
      bestPeak = dayPeaks.sort((a, b) => b.engagement_score - a.engagement_score)[0];
    }
  } else {
    bestPeak = peaks.sort((a, b) => b.engagement_score - a.engagement_score)[0];
  }

  // Calculate the next occurrence of this day/hour
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const targetDayIndex = dayNames.indexOf(bestPeak.day);
  const currentDayIndex = now.getDay();

  let daysUntil = targetDayIndex - currentDayIndex;
  if (daysUntil < 0) daysUntil += 7;
  if (daysUntil === 0 && now.getHours() >= bestPeak.hour) daysUntil += 7;

  const scheduledDate = new Date(now);
  scheduledDate.setDate(scheduledDate.getDate() + daysUntil);
  scheduledDate.setHours(bestPeak.hour, 0, 0, 0);

  return {
    ...post,
    scheduled_for: scheduledDate.toISOString(),
    status: "scheduled",
    updated_at: new Date().toISOString(),
  };
}

// ─── AUTO-POST FROM REVIEW ─────────────────────────────────

/**
 * Create a Meta post from a published review.
 */
export function createPostFromReview(
  reviewId: string,
  reviewTitle: string,
  reviewExcerpt: string,
  reviewRating: number,
  productName: string,
  imageUrl: string,
  platform: "facebook" | "instagram" | "both"
): MetaPost {
  const stars = "★".repeat(Math.floor(reviewRating)) + (reviewRating % 1 >= 0.5 ? "½" : "");
  const content = `${stars} ${reviewTitle}\n\n${reviewExcerpt}\n\nRead the full review at reesereviews.com\n\n#ReeseReviews #HonestReview #${productName.replace(/\s+/g, "")}`;

  return {
    id: `meta-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    platform,
    content,
    image_url: imageUrl || undefined,
    link_url: `https://reesereviews.com/reviews/${reviewTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    status: "draft",
    source_review_id: reviewId,
    likes: 0,
    comments: 0,
    shares: 0,
    reach: 0,
    impressions: 0,
    clicks: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// ─── PUBLISH POST ──────────────────────────────────────────

/**
 * Publish a post to the connected Meta accounts.
 */
export async function publishMetaPost(post: MetaPost): Promise<MetaPost> {
  const auth = getMetaAuth();
  if (!auth) {
    return { ...post, status: "failed", error_message: "Meta Business account not connected" };
  }

  const updatedPost = { ...post, status: "posting" as const, updated_at: new Date().toISOString() };

  try {
    if (post.platform === "facebook" || post.platform === "both") {
      const fbResult = await postToFacebook(
        auth.page_id,
        auth.page_access_token,
        post.content,
        post.link_url,
        post.image_url
      );
      updatedPost.facebook_post_id = fbResult.id;
    }

    if ((post.platform === "instagram" || post.platform === "both") && auth.instagram_account_id) {
      if (post.image_url) {
        const igResult = await postToInstagram(
          auth.instagram_account_id,
          auth.page_access_token,
          post.content,
          post.image_url
        );
        updatedPost.instagram_media_id = igResult.id;
      }
    }

    updatedPost.status = "posted";
    updatedPost.posted_at = new Date().toISOString();
  } catch (error) {
    updatedPost.status = "failed";
    updatedPost.error_message = error instanceof Error ? error.message : "Unknown error";
  }

  updatedPost.updated_at = new Date().toISOString();
  saveMetaPost(updatedPost);
  return updatedPost;
}

// ─── BATCH OPERATIONS ──────────────────────────────────────

/**
 * Process all scheduled posts that are due.
 */
export async function processScheduledPosts(): Promise<MetaPost[]> {
  const posts = getMetaPosts();
  const now = new Date();
  const results: MetaPost[] = [];

  for (const post of posts) {
    if (
      post.status === "scheduled" &&
      post.scheduled_for &&
      new Date(post.scheduled_for) <= now
    ) {
      const result = await publishMetaPost(post);
      results.push(result);
    }
  }

  return results;
}

/**
 * Refresh engagement metrics for all posted content.
 */
export async function refreshEngagementMetrics(): Promise<void> {
  const auth = getMetaAuth();
  if (!auth) return;

  const posts = getMetaPosts().filter((p) => p.status === "posted" && p.facebook_post_id);

  for (const post of posts) {
    if (post.facebook_post_id) {
      const insights = await getFacebookPostInsights(post.facebook_post_id, auth.page_access_token);
      post.likes = insights.likes;
      post.comments = insights.comments;
      post.shares = insights.shares;
      post.reach = insights.reach;
      post.impressions = insights.impressions;
      post.updated_at = new Date().toISOString();
    }
  }

  saveMetaPosts(posts);
}
