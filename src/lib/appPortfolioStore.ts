// ============================================================
// APP PORTFOLIO STORE
// Tracks every app / site being built under any entity.
// Each app has:
//   - Core metadata (name, entity, status, tech stack, URLs)
//   - Stats (users, revenue, DAU, downloads, ratings)
//   - Social media accounts (one per platform per app)
//   - Content queue (posts drafted / scheduled / published)
//
// Many-to-many: apps ↔ entities, apps ↔ social platforms
// ============================================================

const APPS_KEY   = "rr-app-portfolio";
const SOCIAL_KEY = "rr-app-social";
const QUEUE_KEY  = "rr-content-queue";

// ─── TYPES ──────────────────────────────────────────────────

export type AppStatus =
  | "idea"
  | "planning"
  | "building"
  | "beta"
  | "live"
  | "paused"
  | "sunset";

export type SocialPlatform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "twitter"
  | "facebook"
  | "linkedin"
  | "pinterest"
  | "threads"
  | "bluesky"
  | "other";

export type ContentStatus = "idea" | "draft" | "scheduled" | "posted" | "archived";

export type ContentType =
  | "post"
  | "reel"
  | "short"
  | "story"
  | "video"
  | "thread"
  | "blog"
  | "newsletter"
  | "ad"
  | "other";

export const APP_STATUS_LABELS: Record<AppStatus, string> = {
  idea:     "💡 Idea",
  planning: "📐 Planning",
  building: "🔨 Building",
  beta:     "🧪 Beta",
  live:     "🟢 Live",
  paused:   "⏸️ Paused",
  sunset:   "🌅 Sunset",
};

export const APP_STATUS_COLORS: Record<AppStatus, string> = {
  idea:     "bg-gray-500/20 text-gray-300 border-gray-500/30",
  planning: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  building: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  beta:     "bg-purple-500/20 text-purple-300 border-purple-500/30",
  live:     "bg-green-500/20 text-green-300 border-green-500/30",
  paused:   "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  sunset:   "bg-red-500/20 text-red-300 border-red-500/30",
};

export const PLATFORM_ICONS: Record<SocialPlatform, string> = {
  instagram: "📸",
  tiktok:    "🎵",
  youtube:   "▶️",
  twitter:   "🐦",
  facebook:  "📘",
  linkedin:  "💼",
  pinterest: "📌",
  threads:   "🧵",
  bluesky:   "🌐",
  other:     "🔗",
};

export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  tiktok:    "TikTok",
  youtube:   "YouTube",
  twitter:   "X / Twitter",
  facebook:  "Facebook",
  linkedin:  "LinkedIn",
  pinterest: "Pinterest",
  threads:   "Threads",
  bluesky:   "Bluesky",
  other:     "Other",
};

// ─── CORE APP RECORD ────────────────────────────────────────

export interface AppRecord {
  id: string;
  /** Short display name */
  name: string;
  /** Machine-safe slug (no spaces) */
  slug: string;
  description: string;
  /** Business entity ID that owns this app */
  ownerEntityId: string;
  ownerEntityName: string;
  status: AppStatus;
  /** Tech stack summary (e.g. "React + Vite + Supabase") */
  techStack: string;
  /** Live production URL */
  liveUrl: string;
  /** GitHub repo URL */
  repoUrl: string;
  /** Staging / preview URL */
  stagingUrl: string;
  /** ISO date — when it launched (or target date if not live yet) */
  launchDate: string | null;
  /** Target launch date if not live yet */
  targetLaunchDate: string | null;
  /** Notes / next steps */
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ─── PER-APP STATS ──────────────────────────────────────────

export interface AppStats {
  appId: string;
  /** Total registered users */
  totalUsers: number;
  /** Daily active users (latest figure) */
  dau: number;
  /** Monthly active users */
  mau: number;
  /** App store downloads (mobile only) */
  downloads: number;
  /** App store / review site rating (0–5) */
  avgRating: number;
  /** Number of ratings */
  ratingCount: number;
  /** Monthly recurring revenue (USD) */
  mrr: number;
  /** All-time revenue (USD) */
  totalRevenue: number;
  /** Last updated ISO timestamp */
  updatedAt: string;
}

// ─── SOCIAL ACCOUNT ─────────────────────────────────────────

export interface SocialAccount {
  id: string;
  /** Which app this account belongs to */
  appId: string;
  platform: SocialPlatform;
  /** @handle or channel name */
  handle: string;
  /** Profile URL */
  profileUrl: string;
  /** Follower / subscriber count */
  followerCount: number;
  /** Whether this account is active */
  isActive: boolean;
  /** Notes (e.g. "needs bio update", "waiting for approval") */
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ─── CONTENT QUEUE ITEM ─────────────────────────────────────

export interface ContentQueueItem {
  id: string;
  /** Which app this content is for */
  appId: string;
  /** Which social account ID this is targeting (null = generic) */
  socialAccountId: string | null;
  platform: SocialPlatform;
  contentType: ContentType;
  /** Post caption / title */
  title: string;
  /** Full body text */
  body: string;
  /** Hashtags (space-separated or comma-separated) */
  hashtags: string;
  /** Comma-separated image/video URLs or file paths */
  mediaUrls: string;
  status: ContentStatus;
  /** ISO scheduled date-time (null if not scheduled) */
  scheduledAt: string | null;
  /** ISO posted date-time (null if not yet posted) */
  postedAt: string | null;
  /** Auto-generated or manually written */
  isAutoGenerated: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ─── DEMO SEED DATA ─────────────────────────────────────────

const TODAY = new Date().toISOString();
const TODAY_DATE = TODAY.slice(0, 10);

const DEMO_APPS: AppRecord[] = [
  {
    id: "app-reese-reviews",
    name: "Reese Reviews",
    slug: "reese-reviews",
    description: "The main business dashboard: Vine review queue, tax ERP, Amazon orders, inventory, expenses. This app.",
    ownerEntityId: "biz-reese-ventures",
    ownerEntityName: "Reese Ventures LLC",
    status: "live",
    techStack: "React + Vite + TypeScript + Tailwind + Supabase",
    liveUrl: "https://reesereviews.com",
    repoUrl: "https://github.com/midnghtsapphire/reese-reviews",
    stagingUrl: "",
    launchDate: TODAY_DATE,
    targetLaunchDate: null,
    notes: "Core app. Vine queue, tax ERP, Amazon import, review pipeline, expense tracker, app portfolio.",
    createdAt: TODAY,
    updatedAt: TODAY,
  },
  {
    id: "app-truthslayer",
    name: "TruthSlayer",
    slug: "truthslayer",
    description: "Professional product review site. Scrapes internet reviews, auto-generates polished Caresse avatar reviews. Not constrained by Amazon rules.",
    ownerEntityId: "biz-reese-ventures",
    ownerEntityName: "Reese Ventures LLC",
    status: "planning",
    techStack: "React + Next.js + Supabase + HeyGen (avatar video)",
    liveUrl: "https://truthslayer.com",
    repoUrl: "",
    stagingUrl: "",
    launchDate: null,
    targetLaunchDate: null,
    notes: "Phase 1: scrape existing Amazon/web reviews. Phase 2: auto-generate Caresse avatar video reviews. Phase 3: YouTube + social automation.",
    createdAt: TODAY,
    updatedAt: TODAY,
  },
  {
    id: "app-fac-gateway",
    name: "Freedom Angel Corps — Payment Gateway",
    slug: "fac-gateway",
    description: "FAC payment gateway + shared backend for all apps. Stripe Connect, subscription management, multi-entity billing.",
    ownerEntityId: "biz-fac",
    ownerEntityName: "Freedom Angel Corps",
    status: "planning",
    techStack: "Node.js + Fastify + Stripe Connect + Supabase",
    liveUrl: "https://freedomangelcorps.com",
    repoUrl: "",
    stagingUrl: "",
    launchDate: null,
    targetLaunchDate: null,
    notes: "Both Audrey and Caresse on this entity. Will process payments for all app launches. Requires separate entity treatment — not just a DBA.",
    createdAt: TODAY,
    updatedAt: TODAY,
  },
  {
    id: "app-noconook-site",
    name: "NoCo Nook & Rentals",
    slug: "noconook",
    description: "Resale + rental site. Lists Vine product donations after 6-month hold. Tracks gains/losses, storage fees.",
    ownerEntityId: "biz-noconook",
    ownerEntityName: "NoCo Nook & Rentals",
    status: "idea",
    techStack: "React + Vite + Supabase",
    liveUrl: "",
    repoUrl: "",
    stagingUrl: "",
    launchDate: null,
    targetLaunchDate: null,
    notes: "Receives Vine products as capital contributions. Needs inventory/listing management and buyer contact flow.",
    createdAt: TODAY,
    updatedAt: TODAY,
  },
  {
    id: "app-fidelity-trust",
    name: "Fidelity Trust Services",
    slug: "fidelity-trust",
    description: "Trust consultation + light legal word processing. DBA under Reese Ventures LLC. Client intake, document generation, consultation scheduling.",
    ownerEntityId: "biz-reese-ventures",
    ownerEntityName: "Reese Ventures LLC (DBA)",
    status: "idea",
    techStack: "React + Supabase + DocuSign / PDF generation",
    liveUrl: "",
    repoUrl: "",
    stagingUrl: "",
    launchDate: null,
    targetLaunchDate: null,
    notes: "Caresse runs it. Audrey consults. DBA under Reese Ventures — same Schedule C. Simple docs explaining business entities for clients.",
    createdAt: TODAY,
    updatedAt: TODAY,
  },
];

const DEMO_STATS: AppStats[] = [
  {
    appId: "app-reese-reviews",
    totalUsers: 1,
    dau: 1,
    mau: 1,
    downloads: 0,
    avgRating: 0,
    ratingCount: 0,
    mrr: 0,
    totalRevenue: 0,
    updatedAt: TODAY,
  },
];

const DEMO_SOCIAL: SocialAccount[] = [
  {
    id: "social-rr-ig",
    appId: "app-reese-reviews",
    platform: "instagram",
    handle: "@reesereviews",
    profileUrl: "https://instagram.com/reesereviews",
    followerCount: 0,
    isActive: false,
    notes: "Needs setup",
    createdAt: TODAY,
    updatedAt: TODAY,
  },
  {
    id: "social-rr-tiktok",
    appId: "app-reese-reviews",
    platform: "tiktok",
    handle: "@reesereviews",
    profileUrl: "https://tiktok.com/@reesereviews",
    followerCount: 0,
    isActive: false,
    notes: "Needs setup",
    createdAt: TODAY,
    updatedAt: TODAY,
  },
  {
    id: "social-rr-yt",
    appId: "app-reese-reviews",
    platform: "youtube",
    handle: "Reese Reviews",
    profileUrl: "",
    followerCount: 0,
    isActive: false,
    notes: "Vine video reviews will go here eventually",
    createdAt: TODAY,
    updatedAt: TODAY,
  },
  {
    id: "social-ts-ig",
    appId: "app-truthslayer",
    platform: "instagram",
    handle: "@truthslayer",
    profileUrl: "https://instagram.com/truthslayer",
    followerCount: 0,
    isActive: false,
    notes: "Needs setup — for professional review content",
    createdAt: TODAY,
    updatedAt: TODAY,
  },
  {
    id: "social-ts-yt",
    appId: "app-truthslayer",
    platform: "youtube",
    handle: "TruthSlayer Reviews",
    profileUrl: "",
    followerCount: 0,
    isActive: false,
    notes: "Caresse avatar video reviews",
    createdAt: TODAY,
    updatedAt: TODAY,
  },
];

const DEMO_QUEUE: ContentQueueItem[] = [
  {
    id: "cq-1",
    appId: "app-reese-reviews",
    socialAccountId: "social-rr-tiktok",
    platform: "tiktok",
    contentType: "short",
    title: "Vine haul — what I got this week",
    body: "This week's Amazon Vine haul! Honest reviews coming soon. Follow for daily reviews. #vinereviewer #amazonvine #productreview #honestreview",
    hashtags: "#vinereviewer #amazonvine #productreview #honestreview #reesereviews",
    mediaUrls: "",
    status: "idea",
    scheduledAt: null,
    postedAt: null,
    isAutoGenerated: false,
    notes: "Film quick unboxing video",
    createdAt: TODAY,
    updatedAt: TODAY,
  },
  {
    id: "cq-2",
    appId: "app-truthslayer",
    socialAccountId: "social-ts-ig",
    platform: "instagram",
    contentType: "reel",
    title: "TruthSlayer — coming soon",
    body: "Real reviews. No fluff. No sponsor bias. TruthSlayer.com is almost here. 🔪 #honestreview #productreviewer #truthslayer",
    hashtags: "#honestreview #productreviewer #truthslayer #comingsoon",
    mediaUrls: "",
    status: "draft",
    scheduledAt: null,
    postedAt: null,
    isAutoGenerated: false,
    notes: "Teaser reel for launch",
    createdAt: TODAY,
    updatedAt: TODAY,
  },
];

// ─── STORAGE HELPERS ────────────────────────────────────────

function loadApps(): AppRecord[] {
  try {
    const raw = localStorage.getItem(APPS_KEY);
    if (!raw) { localStorage.setItem(APPS_KEY, JSON.stringify(DEMO_APPS)); return DEMO_APPS; }
    return JSON.parse(raw) as AppRecord[];
  } catch { return DEMO_APPS; }
}
function saveApps(items: AppRecord[]): void { localStorage.setItem(APPS_KEY, JSON.stringify(items)); }

function loadStats(): AppStats[] {
  try {
    const raw = localStorage.getItem(APPS_KEY + "-stats");
    if (!raw) { localStorage.setItem(APPS_KEY + "-stats", JSON.stringify(DEMO_STATS)); return DEMO_STATS; }
    return JSON.parse(raw) as AppStats[];
  } catch { return DEMO_STATS; }
}
function saveStats(items: AppStats[]): void { localStorage.setItem(APPS_KEY + "-stats", JSON.stringify(items)); }

function loadSocial(): SocialAccount[] {
  try {
    const raw = localStorage.getItem(SOCIAL_KEY);
    if (!raw) { localStorage.setItem(SOCIAL_KEY, JSON.stringify(DEMO_SOCIAL)); return DEMO_SOCIAL; }
    return JSON.parse(raw) as SocialAccount[];
  } catch { return DEMO_SOCIAL; }
}
function saveSocial(items: SocialAccount[]): void { localStorage.setItem(SOCIAL_KEY, JSON.stringify(items)); }

function loadQueue(): ContentQueueItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) { localStorage.setItem(QUEUE_KEY, JSON.stringify(DEMO_QUEUE)); return DEMO_QUEUE; }
    return JSON.parse(raw) as ContentQueueItem[];
  } catch { return DEMO_QUEUE; }
}
function saveQueue(items: ContentQueueItem[]): void { localStorage.setItem(QUEUE_KEY, JSON.stringify(items)); }

function genId(prefix = "id"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── APP API ────────────────────────────────────────────────

export function getApps(): AppRecord[] { return loadApps(); }
export function getApp(id: string): AppRecord | undefined { return loadApps().find((a) => a.id === id); }
export function getAppsByEntity(entityId: string): AppRecord[] { return loadApps().filter((a) => a.ownerEntityId === entityId); }
export function getLiveApps(): AppRecord[] { return loadApps().filter((a) => a.status === "live"); }

export function addApp(params: Omit<AppRecord, "id" | "createdAt" | "updatedAt">): AppRecord {
  const now = new Date().toISOString();
  const app: AppRecord = { ...params, id: genId("app"), createdAt: now, updatedAt: now };
  const all = loadApps(); all.push(app); saveApps(all);
  return app;
}

export function updateApp(id: string, patch: Partial<AppRecord>): AppRecord | null {
  const all = loadApps();
  const idx = all.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  saveApps(all);
  return all[idx];
}

export function deleteApp(id: string): boolean {
  const all = loadApps();
  const next = all.filter((a) => a.id !== id);
  if (next.length === all.length) return false;
  saveApps(next);
  // Also remove associated social accounts and queue items
  saveSocial(loadSocial().filter((s) => s.appId !== id));
  saveQueue(loadQueue().filter((q) => q.appId !== id));
  return true;
}

// ─── STATS API ──────────────────────────────────────────────

export function getStats(appId: string): AppStats | undefined { return loadStats().find((s) => s.appId === appId); }

export function upsertStats(appId: string, patch: Partial<Omit<AppStats, "appId">>): AppStats {
  const all = loadStats();
  const idx = all.findIndex((s) => s.appId === appId);
  const now = new Date().toISOString();
  if (idx === -1) {
    const fresh: AppStats = {
      appId, totalUsers: 0, dau: 0, mau: 0, downloads: 0,
      avgRating: 0, ratingCount: 0, mrr: 0, totalRevenue: 0, updatedAt: now,
      ...patch,
    };
    all.push(fresh); saveStats(all); return fresh;
  }
  all[idx] = { ...all[idx], ...patch, updatedAt: now };
  saveStats(all); return all[idx];
}

// ─── SOCIAL API ─────────────────────────────────────────────

export function getSocialAccounts(appId?: string): SocialAccount[] {
  const all = loadSocial();
  return appId ? all.filter((s) => s.appId === appId) : all;
}

export function addSocialAccount(params: Omit<SocialAccount, "id" | "createdAt" | "updatedAt">): SocialAccount {
  const now = new Date().toISOString();
  const acc: SocialAccount = { ...params, id: genId("social"), createdAt: now, updatedAt: now };
  const all = loadSocial(); all.push(acc); saveSocial(all);
  return acc;
}

export function updateSocialAccount(id: string, patch: Partial<SocialAccount>): SocialAccount | null {
  const all = loadSocial();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  saveSocial(all); return all[idx];
}

export function deleteSocialAccount(id: string): boolean {
  const all = loadSocial();
  const next = all.filter((s) => s.id !== id);
  if (next.length === all.length) return false;
  saveSocial(next); return true;
}

// ─── CONTENT QUEUE API ──────────────────────────────────────

export function getContentQueue(appId?: string): ContentQueueItem[] {
  const all = loadQueue();
  return appId ? all.filter((q) => q.appId === appId) : all;
}

export function getContentByStatus(status: ContentStatus, appId?: string): ContentQueueItem[] {
  return getContentQueue(appId).filter((q) => q.status === status);
}

export function addContentQueueItem(params: Omit<ContentQueueItem, "id" | "createdAt" | "updatedAt">): ContentQueueItem {
  const now = new Date().toISOString();
  const item: ContentQueueItem = { ...params, id: genId("cq"), createdAt: now, updatedAt: now };
  const all = loadQueue(); all.push(item); saveQueue(all);
  return item;
}

export function updateContentQueueItem(id: string, patch: Partial<ContentQueueItem>): ContentQueueItem | null {
  const all = loadQueue();
  const idx = all.findIndex((q) => q.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  saveQueue(all); return all[idx];
}

export function deleteContentQueueItem(id: string): boolean {
  const all = loadQueue();
  const next = all.filter((q) => q.id !== id);
  if (next.length === all.length) return false;
  saveQueue(next); return true;
}

export function markContentPosted(id: string): ContentQueueItem | null {
  return updateContentQueueItem(id, { status: "posted", postedAt: new Date().toISOString() });
}

// ─── PORTFOLIO SUMMARY ──────────────────────────────────────

export interface PortfolioSummary {
  totalApps: number;
  byStatus: Record<AppStatus, number>;
  totalMrr: number;
  totalUsers: number;
  totalSocialAccounts: number;
  activeSocialAccounts: number;
  contentQueueTotal: number;
  contentDrafts: number;
  contentScheduled: number;
  contentPosted: number;
}

export function getPortfolioSummary(): PortfolioSummary {
  const apps = loadApps();
  const stats = loadStats();
  const social = loadSocial();
  const queue = loadQueue();

  const byStatus = Object.keys(APP_STATUS_LABELS).reduce(
    (acc, k) => { acc[k as AppStatus] = 0; return acc; },
    {} as Record<AppStatus, number>
  );
  for (const a of apps) byStatus[a.status]++;

  let totalMrr = 0, totalUsers = 0;
  for (const s of stats) { totalMrr += s.mrr; totalUsers += s.totalUsers; }

  return {
    totalApps: apps.length,
    byStatus,
    totalMrr,
    totalUsers,
    totalSocialAccounts: social.length,
    activeSocialAccounts: social.filter((s) => s.isActive).length,
    contentQueueTotal: queue.length,
    contentDrafts: queue.filter((q) => q.status === "draft").length,
    contentScheduled: queue.filter((q) => q.status === "scheduled").length,
    contentPosted: queue.filter((q) => q.status === "posted").length,
  };
}
