import type { FillProgress, FillStepKey, FillStepProgress, ProductReview } from "./types";

/** Audrey's fill order: title, then images, then the written review. */
export const FILL_STEP_ORDER: FillStepKey[] = ["headline", "photos", "body"];

export const FILL_STEP_LABELS: Record<FillStepKey, string> = {
  headline: "Title",
  photos: "Images",
  body: "Review",
};

/** Default pause between fields, in seconds. Randomized in this range unless a fixed delay is set. */
export const DEFAULT_FIELD_DELAY_SEC = { min: 3, max: 6 };

export function pickFieldDelaySeconds(
  range = DEFAULT_FIELD_DELAY_SEC,
  random: () => number = Math.random,
): number {
  const min = Math.min(range.min, range.max);
  const max = Math.max(range.min, range.max);
  return Math.round((min + random() * (max - min)) * 10) / 10;
}

export function initialFillProgress(
  review: Pick<ProductReview, "name" | "asin">,
  target: FillProgress["target"] = "rehearsal",
): FillProgress {
  return {
    target,
    product: review.name,
    asin: review.asin,
    steps: FILL_STEP_ORDER.map((key) => ({
      key,
      label: FILL_STEP_LABELS[key],
      state: "pending",
      detail: "",
    })),
    current: null,
    state: "idle",
    message: "All of the review data is ready. Press Start and it will fill title, then images, then the review, with a short pause between each field. You press Submit yourself.",
  };
}

export function setFillStep(
  progress: FillProgress,
  key: FillStepKey,
  state: FillStepProgress["state"],
  detail = "",
): FillProgress {
  return {
    ...progress,
    current: key,
    state: state === "failed" ? "failed" : "running",
    message: detail || `${FILL_STEP_LABELS[key]}: ${state}`,
    steps: progress.steps.map((step) =>
      step.key === key ? { ...step, state, detail } : step,
    ),
  };
}

export function markAwaitingSubmit(progress: FillProgress): FillProgress {
  return {
    ...progress,
    current: null,
    state: "awaiting_human_submit",
    message: "Title, images, and review are in. Please press Submit yourself.",
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
