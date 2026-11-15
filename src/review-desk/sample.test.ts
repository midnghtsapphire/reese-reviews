import { getSampleReviews } from "./sample";

describe("getSampleReviews", () => {
  it("loads every reviews/<slug> folder, including the demo product", () => {
    const reviews = getSampleReviews();
    const slugs = reviews.map((review) => review.slug);
    expect(slugs).toContain("2-pocket-toploader-binder");
    expect(new Set(slugs).size).toBe(slugs.length);
    const demo = reviews.find((review) => review.slug === "2-pocket-toploader-binder");
    expect(demo?.name).toMatch(/Toploader Binder/i);
    expect(demo?.title).toBeTruthy();
    expect(demo?.body).toBeTruthy();
  });
});
