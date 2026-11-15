import { describe, expect, it } from "vitest";
import { getPublishedRepoReviews } from "./repoReviews";

describe("getPublishedRepoReviews", () => {
  it("does not publish the sample draft review on the public site", () => {
    const published = getPublishedRepoReviews();
    expect(published.find((review) => review.slug === "2-pocket-toploader-binder")).toBeUndefined();
  });
});
