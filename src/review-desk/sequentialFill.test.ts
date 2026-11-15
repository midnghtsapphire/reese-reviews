import { describe, expect, it } from "vitest";
import {
  DEFAULT_FIELD_DELAY_SEC,
  FILL_STEP_ORDER,
  initialFillProgress,
  markAwaitingSubmit,
  pickFieldDelaySeconds,
  setFillStep,
} from "./sequentialFill";

describe("sequential fill progress", () => {
  const start = initialFillProgress({ name: "Demo", asin: "B0HGRHWB6N" });

  it("fills title, then images, then the review — not all fields at once", () => {
    expect(FILL_STEP_ORDER).toEqual(["headline", "photos", "body"]);
    expect(start.steps.map((s) => s.key)).toEqual(FILL_STEP_ORDER);
    expect(start.steps.every((s) => s.state === "pending")).toBe(true);
    expect(start.state).toBe("idle");
  });

  it("uses a few seconds of delay between fields by default", () => {
    expect(DEFAULT_FIELD_DELAY_SEC).toEqual({ min: 3, max: 6 });
    const delay = pickFieldDelaySeconds(DEFAULT_FIELD_DELAY_SEC, () => 0.5);
    expect(delay).toBeGreaterThanOrEqual(3);
    expect(delay).toBeLessThanOrEqual(6);
  });

  it("walks one field at a time and then waits for a human Submit click", () => {
    let progress = setFillStep(start, "headline", "done", "title filled");
    expect(progress.steps[0].state).toBe("done");
    expect(progress.steps[1].state).toBe("pending");
    expect(progress.steps[2].state).toBe("pending");
    progress = setFillStep(progress, "photos", "filling", "adding images");
    expect(progress.current).toBe("photos");
    progress = setFillStep(progress, "photos", "done");
    progress = setFillStep(progress, "body", "done");
    progress = markAwaitingSubmit(progress);
    expect(progress.state).toBe("awaiting_human_submit");
    expect(progress.message.toLowerCase()).toContain("yourself");
  });
});
