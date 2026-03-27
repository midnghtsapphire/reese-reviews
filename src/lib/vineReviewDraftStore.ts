// ============================================================
// VINE REVIEW DRAFT STORE
// Tracks per-item draft state alongside VineItem records.
// Stored in localStorage under a separate key so it doesn't
// conflict with the Supabase-backed VineItem records.
//
// Workflow per item:
//   not received → received → generated/drafted → submitted
// ============================================================

const DRAFTS_KEY = "rr-vine-review-drafts";

// ─── TYPES ──────────────────────────────────────────────────

export interface VineReviewDraft {
  vineItemId: string;
  /** The review title written/generated for this item. */
  title: string;
  /** The full review body. */
  body: string;
  /** Star rating 1–5 (0 = not set). */
  rating: number;
  /** Number of product photos attached (0–8). */
  photoCount: number;
  /** True once the physical item has been received. */
  isReceived: boolean;
  /** ISO timestamp when auto-generated text was created. */
  generatedAt: string | null;
  /** ISO timestamp of last manual edit. */
  editedAt: string | null;
  /** ISO timestamp of when the review was submitted to Vine. */
  submittedAt: string | null;
  /** Calendar date string (YYYY-MM-DD) of submission — for daily counter. */
  submittedDate: string | null;
}

// ─── STORAGE ────────────────────────────────────────────────

function loadDrafts(): VineReviewDraft[] {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    return raw ? (JSON.parse(raw) as VineReviewDraft[]) : [];
  } catch {
    return [];
  }
}

function saveDrafts(drafts: VineReviewDraft[]): void {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

// ─── PUBLIC API ─────────────────────────────────────────────

/** Return all drafts. */
export function getVineReviewDrafts(): VineReviewDraft[] {
  return loadDrafts();
}

/** Return draft for a single Vine item (or undefined if none). */
export function getDraft(vineItemId: string): VineReviewDraft | undefined {
  return loadDrafts().find((d) => d.vineItemId === vineItemId);
}

/**
 * Return an existing draft or create a blank one for the given item.
 * The blank draft is persisted immediately so subsequent calls return it.
 */
export function getOrCreateDraft(vineItemId: string): VineReviewDraft {
  const existing = getDraft(vineItemId);
  if (existing) return existing;

  const blank: VineReviewDraft = {
    vineItemId,
    title: "",
    body: "",
    rating: 0,
    photoCount: 0,
    isReceived: false,
    generatedAt: null,
    editedAt: null,
    submittedAt: null,
    submittedDate: null,
  };

  const all = loadDrafts();
  all.push(blank);
  saveDrafts(all);
  return blank;
}

/** Merge a partial patch into an existing draft (or creates it first). */
export function updateDraft(
  vineItemId: string,
  patch: Partial<VineReviewDraft>
): VineReviewDraft {
  const all = loadDrafts();
  const idx = all.findIndex((d) => d.vineItemId === vineItemId);

  if (idx === -1) {
    const created = getOrCreateDraft(vineItemId);
    return updateDraft(vineItemId, patch);
  }

  all[idx] = { ...all[idx], ...patch };
  saveDrafts(all);
  return all[idx];
}

/** Mark an item as physically received. */
export function markDraftReceived(vineItemId: string): VineReviewDraft {
  return updateDraft(vineItemId, { isReceived: true });
}

/** Save generated review text for an item (title + body). */
export function saveDraftText(
  vineItemId: string,
  title: string,
  body: string
): VineReviewDraft {
  return updateDraft(vineItemId, {
    title,
    body,
    generatedAt: new Date().toISOString(),
  });
}

/** Save manually edited title/body (marks as edited, preserves generatedAt). */
export function editDraftText(
  vineItemId: string,
  title: string,
  body: string
): VineReviewDraft {
  return updateDraft(vineItemId, {
    title,
    body,
    editedAt: new Date().toISOString(),
  });
}

/** Save star rating (1–5) for the item. */
export function setDraftRating(vineItemId: string, rating: number): VineReviewDraft {
  return updateDraft(vineItemId, { rating });
}

/** Increment photo count (max 8). */
export function addDraftPhoto(vineItemId: string): VineReviewDraft {
  const draft = getOrCreateDraft(vineItemId);
  return updateDraft(vineItemId, {
    photoCount: Math.min(8, draft.photoCount + 1),
  });
}

/** Decrement photo count (min 0). */
export function removeDraftPhoto(vineItemId: string): VineReviewDraft {
  const draft = getOrCreateDraft(vineItemId);
  return updateDraft(vineItemId, {
    photoCount: Math.max(0, draft.photoCount - 1),
  });
}

/** Mark review as submitted to Vine (stamps today's date for daily counter). */
export function markDraftSubmitted(vineItemId: string): VineReviewDraft {
  const now = new Date();
  return updateDraft(vineItemId, {
    submittedAt: now.toISOString(),
    submittedDate: now.toISOString().slice(0, 10), // YYYY-MM-DD
  });
}

/** Un-submit (in case of mistakes). */
export function unsubmitDraft(vineItemId: string): VineReviewDraft {
  return updateDraft(vineItemId, {
    submittedAt: null,
    submittedDate: null,
  });
}

// ─── DAILY COUNTER ──────────────────────────────────────────

/** Returns how many reviews have been submitted today (local date). */
export function getTodaySubmittedCount(): number {
  const today = new Date().toISOString().slice(0, 10);
  return loadDrafts().filter((d) => d.submittedDate === today).length;
}

/** Returns the VINE_DAILY_GOAL constant. */
export const VINE_DAILY_GOAL = 8;

/** Returns IDs of items submitted today. */
export function getTodaySubmittedIds(): string[] {
  const today = new Date().toISOString().slice(0, 10);
  return loadDrafts()
    .filter((d) => d.submittedDate === today)
    .map((d) => d.vineItemId);
}

// ─── CLIPBOARD FORMAT ───────────────────────────────────────

/**
 * Formats the draft into the text that should be pasted into the Vine review form.
 * Title and body are kept separate since Vine has separate title and body fields.
 */
export function formatForVineClipboard(
  draft: VineReviewDraft,
  productName: string
): { title: string; body: string } {
  const disclaimer =
    "\n\nDisclaimer: I received this product free through Amazon Vine and am providing my honest, unbiased opinion.";
  return {
    title: draft.title || `My review of ${productName}`,
    body: (draft.body || "Review text not generated yet.") + disclaimer,
  };
}
