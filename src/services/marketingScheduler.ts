// ============================================================
// MARKETING CRON SCHEDULER SERVICE
// Automated marketing tasks: social posting, email digests,
// engagement tracking, and scheduled content management
// ============================================================

import { getApprovedReviews, type ReviewData } from "@/lib/reviewStore";
import {
  getMetaPosts,
  saveMetaPosts,
  publishMetaPost,
  refreshEngagementMetrics,
  createPostFromReview,
  scheduleForPeakTime,
  type MetaPost,
} from "@/services/metaBusinessService";
import { generateEmailDigest, generatePostFromReview } from "@/services/affiliateContentService";
import { getAffiliateLinks } from "@/lib/affiliateStore";
import { getNewsletters, saveNewsletter } from "@/lib/emailStore";
import type { Newsletter } from "@/lib/emailTypes";

// ─── TYPES ─────────────────────────────────────────────────

export interface ScheduledTask {
  id: string;
  type: "social_post" | "email_digest" | "engagement_refresh" | "review_auto_post" | "custom";
  name: string;
  description: string;
  cron_expression: string;
  cron_readable: string;
  enabled: boolean;
  last_run?: string;
  next_run?: string;
  run_count: number;
  error_count: number;
  last_error?: string;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TaskExecution {
  id: string;
  task_id: string;
  task_name: string;
  status: "running" | "completed" | "failed";
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  result?: string;
  error?: string;
}

export interface SchedulerState {
  is_running: boolean;
  tasks: ScheduledTask[];
  executions: TaskExecution[];
  started_at?: string;
}

// ─── STORAGE ───────────────────────────────────────────────

const STORAGE_KEY_TASKS = "reese-scheduler-tasks";
const STORAGE_KEY_EXECUTIONS = "reese-scheduler-executions";
const STORAGE_KEY_STATE = "reese-scheduler-state";

export function getScheduledTasks(): ScheduledTask[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_TASKS);
    if (stored) return JSON.parse(stored);
  } catch {
    // noop
  }
  return getDefaultTasks();
}

export function saveScheduledTasks(tasks: ScheduledTask[]): void {
  localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
}

export function saveScheduledTask(task: ScheduledTask): void {
  const tasks = getScheduledTasks().filter((t) => t.id !== task.id);
  tasks.push(task);
  saveScheduledTasks(tasks);
}

export function deleteScheduledTask(id: string): void {
  const tasks = getScheduledTasks().filter((t) => t.id !== id);
  saveScheduledTasks(tasks);
}

export function getTaskExecutions(): TaskExecution[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_EXECUTIONS);
    if (stored) return JSON.parse(stored);
  } catch {
    // noop
  }
  return [];
}

export function saveTaskExecution(execution: TaskExecution): void {
  const executions = getTaskExecutions();
  executions.push(execution);
  // Keep only last 100 executions
  const trimmed = executions.slice(-100);
  localStorage.setItem(STORAGE_KEY_EXECUTIONS, JSON.stringify(trimmed));
}

export function getSchedulerState(): SchedulerState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_STATE);
    if (stored) return JSON.parse(stored);
  } catch {
    // noop
  }
  return {
    is_running: false,
    tasks: getScheduledTasks(),
    executions: getTaskExecutions(),
  };
}

export function saveSchedulerState(state: SchedulerState): void {
  localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(state));
}

// ─── DEFAULT TASKS ─────────────────────────────────────────

function getDefaultTasks(): ScheduledTask[] {
  const now = new Date().toISOString();
  return [
    {
      id: "task-social-auto-post",
      type: "review_auto_post",
      name: "Auto-Post New Reviews",
      description: "Automatically create social media posts when new reviews are published",
      cron_expression: "0 10 * * *",
      cron_readable: "Every day at 10:00 AM",
      enabled: true,
      run_count: 0,
      error_count: 0,
      config: { platforms: ["facebook", "instagram"], max_posts_per_run: 3 },
      created_at: now,
      updated_at: now,
    },
    {
      id: "task-weekly-digest",
      type: "email_digest",
      name: "Weekly Review Digest",
      description: "Send a weekly email digest of new reviews to subscribers",
      cron_expression: "0 9 * * 1",
      cron_readable: "Every Monday at 9:00 AM",
      enabled: true,
      run_count: 0,
      error_count: 0,
      config: { digest_type: "weekly", include_affiliate_links: true },
      created_at: now,
      updated_at: now,
    },
    {
      id: "task-monthly-digest",
      type: "email_digest",
      name: "Monthly Review Roundup",
      description: "Send a monthly email roundup of top reviews and deals",
      cron_expression: "0 9 1 * *",
      cron_readable: "1st of every month at 9:00 AM",
      enabled: false,
      run_count: 0,
      error_count: 0,
      config: { digest_type: "monthly", include_affiliate_links: true },
      created_at: now,
      updated_at: now,
    },
    {
      id: "task-engagement-refresh",
      type: "engagement_refresh",
      name: "Refresh Engagement Metrics",
      description: "Update likes, comments, shares, and reach for all posted content",
      cron_expression: "0 */6 * * *",
      cron_readable: "Every 6 hours",
      enabled: true,
      run_count: 0,
      error_count: 0,
      config: {},
      created_at: now,
      updated_at: now,
    },
    {
      id: "task-scheduled-posts",
      type: "social_post",
      name: "Process Scheduled Posts",
      description: "Publish any social media posts that are due based on their schedule",
      cron_expression: "*/15 * * * *",
      cron_readable: "Every 15 minutes",
      enabled: true,
      run_count: 0,
      error_count: 0,
      config: {},
      created_at: now,
      updated_at: now,
    },
  ];
}

// ─── TASK EXECUTION ENGINE ─────────────────────────────────

/**
 * Execute a specific scheduled task.
 */
export async function executeTask(task: ScheduledTask): Promise<TaskExecution> {
  const execution: TaskExecution = {
    id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    task_id: task.id,
    task_name: task.name,
    status: "running",
    started_at: new Date().toISOString(),
  };

  try {
    let result: string;

    switch (task.type) {
      case "review_auto_post":
        result = await executeAutoPostTask(task);
        break;
      case "email_digest":
        result = await executeEmailDigestTask(task);
        break;
      case "engagement_refresh":
        result = await executeEngagementRefreshTask();
        break;
      case "social_post":
        result = await executeScheduledPostsTask();
        break;
      default:
        result = "Unknown task type";
    }

    execution.status = "completed";
    execution.result = result;
    execution.completed_at = new Date().toISOString();
    execution.duration_ms = Date.now() - new Date(execution.started_at).getTime();

    // Update task stats
    task.last_run = new Date().toISOString();
    task.run_count += 1;
    task.next_run = calculateNextRun(task.cron_expression);
    task.updated_at = new Date().toISOString();
    saveScheduledTask(task);
  } catch (error) {
    execution.status = "failed";
    execution.error = error instanceof Error ? error.message : "Unknown error";
    execution.completed_at = new Date().toISOString();
    execution.duration_ms = Date.now() - new Date(execution.started_at).getTime();

    task.error_count += 1;
    task.last_error = execution.error;
    task.updated_at = new Date().toISOString();
    saveScheduledTask(task);
  }

  saveTaskExecution(execution);
  return execution;
}

/**
 * Auto-post new reviews to social media.
 */
async function executeAutoPostTask(task: ScheduledTask): Promise<string> {
  const reviews = getApprovedReviews();
  const existingPosts = getMetaPosts();
  const postedReviewIds = new Set(existingPosts.filter((p) => p.source_review_id).map((p) => p.source_review_id));

  // Find reviews that haven't been posted yet
  const unpostedReviews = reviews.filter((r) => !postedReviewIds.has(r.id));
  const maxPosts = (task.config.max_posts_per_run as number) || 3;
  const reviewsToPost = unpostedReviews.slice(0, maxPosts);

  if (reviewsToPost.length === 0) {
    return "No new reviews to post";
  }

  const results: string[] = [];
  const affiliateLinks = getAffiliateLinks().filter((l) => l.active);

  for (const review of reviewsToPost) {
    try {
      // Generate AI content for the post
      const content = await generatePostFromReview(review, "facebook", affiliateLinks, "casual");

      const post = createPostFromReview(
        review.id,
        review.title,
        content,
        review.rating,
        review.product_name,
        review.image_url,
        "both"
      );

      // Schedule for peak time instead of posting immediately
      const scheduled = scheduleForPeakTime(post);
      const posts = getMetaPosts();
      posts.push(scheduled);
      saveMetaPosts(posts);

      results.push(`Scheduled: ${review.title}`);
    } catch (error) {
      results.push(`Failed: ${review.title} — ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  return `Processed ${reviewsToPost.length} reviews: ${results.join("; ")}`;
}

/**
 * Generate and save an email digest newsletter.
 */
async function executeEmailDigestTask(task: ScheduledTask): Promise<string> {
  const digestType = (task.config.digest_type as "weekly" | "monthly") || "weekly";
  const reviews = getApprovedReviews();

  // Get reviews from the relevant period
  const now = Date.now();
  const periodMs = digestType === "weekly" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
  const recentReviews = reviews.filter(
    (r) => new Date(r.published_at || r.created_at).getTime() > now - periodMs
  );

  if (recentReviews.length === 0) {
    return `No new reviews in the past ${digestType === "weekly" ? "week" : "month"}`;
  }

  const affiliateLinks = getAffiliateLinks().filter((l) => l.active);

  try {
    const digest = await generateEmailDigest(recentReviews, digestType, affiliateLinks);

    const newsletter: Newsletter = {
      id: `newsletter-${Date.now()}`,
      subject: digest.subject,
      preheader: digest.preheader,
      content_html: digest.html_body,
      content_text: digest.plain_text,
      template: digestType === "weekly" ? "weekly_update" : "review_roundup",
      status: "draft",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      stats: {
        sent_count: 0,
        open_count: 0,
        click_count: 0,
        bounce_count: 0,
        unsubscribe_count: 0,
        open_rate: 0,
        click_rate: 0,
      },
    };

    saveNewsletter(newsletter);
    return `Generated ${digestType} digest: "${digest.subject}" with ${recentReviews.length} reviews`;
  } catch (error) {
    return `Digest generation failed: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

/**
 * Refresh engagement metrics for all posted content.
 */
async function executeEngagementRefreshTask(): Promise<string> {
  try {
    await refreshEngagementMetrics();
    const posts = getMetaPosts().filter((p) => p.status === "posted");
    return `Refreshed engagement metrics for ${posts.length} posts`;
  } catch (error) {
    return `Engagement refresh failed: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

/**
 * Process and publish any scheduled posts that are due.
 */
async function executeScheduledPostsTask(): Promise<string> {
  const posts = getMetaPosts();
  const now = new Date();
  const duePosts = posts.filter(
    (p) => p.status === "scheduled" && p.scheduled_for && new Date(p.scheduled_for) <= now
  );

  if (duePosts.length === 0) {
    return "No scheduled posts due";
  }

  let published = 0;
  let failed = 0;

  for (const post of duePosts) {
    const result = await publishMetaPost(post);
    if (result.status === "posted") {
      published++;
    } else {
      failed++;
    }
  }

  return `Processed ${duePosts.length} scheduled posts: ${published} published, ${failed} failed`;
}

// ─── CRON UTILITIES ────────────────────────────────────────

/**
 * Parse a simple cron expression and calculate the next run time.
 * Supports: minute hour day-of-month month day-of-week
 */
export function calculateNextRun(cronExpression: string): string {
  const parts = cronExpression.split(" ");
  if (parts.length !== 5) return new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  const now = new Date();
  const next = new Date(now);

  // Simple next-run calculation for common patterns
  if (minute.startsWith("*/")) {
    const interval = parseInt(minute.slice(2));
    const minutesUntilNext = interval - (now.getMinutes() % interval);
    next.setMinutes(now.getMinutes() + minutesUntilNext, 0, 0);
    if (next <= now) next.setMinutes(next.getMinutes() + interval);
    return next.toISOString();
  }

  const targetMinute = minute === "*" ? 0 : parseInt(minute);
  const targetHour = hour === "*" ? now.getHours() : parseInt(hour);

  if (hour.startsWith("*/")) {
    const interval = parseInt(hour.slice(2));
    const hoursUntilNext = interval - (now.getHours() % interval);
    next.setHours(now.getHours() + hoursUntilNext, targetMinute, 0, 0);
    if (next <= now) next.setHours(next.getHours() + interval);
    return next.toISOString();
  }

  next.setHours(targetHour, targetMinute, 0, 0);

  if (dayOfWeek !== "*") {
    const targetDay = parseInt(dayOfWeek);
    let daysUntil = targetDay - now.getDay();
    if (daysUntil < 0) daysUntil += 7;
    if (daysUntil === 0 && next <= now) daysUntil += 7;
    next.setDate(next.getDate() + daysUntil);
  } else if (dayOfMonth !== "*") {
    const targetDate = parseInt(dayOfMonth);
    next.setDate(targetDate);
    if (next <= now) next.setMonth(next.getMonth() + 1);
  } else {
    if (next <= now) next.setDate(next.getDate() + 1);
  }

  return next.toISOString();
}

/**
 * Get a human-readable description of a cron expression.
 */
export function cronToReadable(cron: string): string {
  const parts = cron.split(" ");
  if (parts.length !== 5) return cron;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  if (minute.startsWith("*/")) return `Every ${minute.slice(2)} minutes`;
  if (hour.startsWith("*/")) return `Every ${hour.slice(2)} hours at :${minute.padStart(2, "0")}`;

  const timeStr = `${parseInt(hour) > 12 ? parseInt(hour) - 12 : hour}:${minute.padStart(2, "0")} ${parseInt(hour) >= 12 ? "PM" : "AM"}`;

  if (dayOfWeek !== "*") {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return `Every ${days[parseInt(dayOfWeek)]} at ${timeStr}`;
  }

  if (dayOfMonth !== "*") {
    return `${dayOfMonth}${getOrdinalSuffix(parseInt(dayOfMonth))} of every month at ${timeStr}`;
  }

  return `Every day at ${timeStr}`;
}

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// ─── CLIENT-SIDE SCHEDULER ─────────────────────────────────

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start the client-side scheduler that checks for due tasks.
 * Runs every 60 seconds.
 */
export function startScheduler(): void {
  if (schedulerInterval) return;

  const state = getSchedulerState();
  state.is_running = true;
  state.started_at = new Date().toISOString();
  saveSchedulerState(state);

  // Initialize next_run for all tasks
  const tasks = getScheduledTasks();
  for (const task of tasks) {
    if (!task.next_run) {
      task.next_run = calculateNextRun(task.cron_expression);
      saveScheduledTask(task);
    }
  }

  schedulerInterval = setInterval(async () => {
    const currentTasks = getScheduledTasks();
    const now = new Date();

    for (const task of currentTasks) {
      if (!task.enabled || !task.next_run) continue;

      if (new Date(task.next_run) <= now) {
        await executeTask(task);
      }
    }
  }, 60_000); // Check every minute

  console.log("[MarketingScheduler] Started — checking tasks every 60 seconds");
}

/**
 * Stop the client-side scheduler.
 */
export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }

  const state = getSchedulerState();
  state.is_running = false;
  saveSchedulerState(state);

  console.log("[MarketingScheduler] Stopped");
}

/**
 * Check if the scheduler is currently running.
 */
export function isSchedulerRunning(): boolean {
  return schedulerInterval !== null;
}
