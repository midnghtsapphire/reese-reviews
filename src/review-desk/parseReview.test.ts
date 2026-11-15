import { describe, expect, it } from "vitest";
import { parseReviewMarkdown, serializeReviewMarkdown } from "./parseReview";

const sample = `---
product: "2 Pocket Toploader Binder (Holds 56)"
asin: B0HGRHWB6N
url: https://www.amazon.com/dp/B0HGRHWB6N
rating: 4
title: "Does the job for a smaller toploader binder"
status: draft
slug: 2-pocket-toploader-binder
text_only: false
category: products
notion_url: https://www.notion.so/4002aa319908810f9ce4df3f07ac55df
---

This 2-pocket binder holds 56 toploaders and the side-loading pages work as expected.
`;

describe("parseReviewMarkdown", () => {
  it("reads front matter and the written review body", () => {
    const parsed = parseReviewMarkdown(sample);
    expect(parsed.product).toBe("2 Pocket Toploader Binder (Holds 56)");
    expect(parsed.asin).toBe("B0HGRHWB6N");
    expect(parsed.url).toBe("https://www.amazon.com/dp/B0HGRHWB6N");
    expect(parsed.rating).toBe(4);
    expect(parsed.title).toBe("Does the job for a smaller toploader binder");
    expect(parsed.status).toBe("draft");
    expect(parsed.slug).toBe("2-pocket-toploader-binder");
    expect(parsed.textOnly).toBe(false);
    expect(parsed.body).toContain("side-loading pages");
  });

  it("treats a missing document as a body-only draft", () => {
    const parsed = parseReviewMarkdown("Just some notes.");
    expect(parsed.rating).toBeNull();
    expect(parsed.title).toBe("");
    expect(parsed.body.trim()).toBe("Just some notes.");
  });

  it("parses text_only: true and a null rating", () => {
    const parsed = parseReviewMarkdown(`---
product: "Test"
asin: B000000000
url: https://www.amazon.com/dp/B000000000
rating: null
title: "A title"
status: draft
slug: test
text_only: true
---

Body text.
`);
    expect(parsed.rating).toBeNull();
    expect(parsed.textOnly).toBe(true);
    expect(parsed.body.trim()).toBe("Body text.");
  });
});

describe("serializeReviewMarkdown", () => {
  it("round-trips the fields used in a review PR", () => {
    const raw = serializeReviewMarkdown({
      product: "Demo",
      asin: "B0HGRHWB6N",
      url: "https://www.amazon.com/dp/B0HGRHWB6N",
      rating: 5,
      title: "Solid binder",
      status: "ready-for-proofy",
      slug: "demo",
      textOnly: false,
      body: "It works well.",
    });
    const parsed = parseReviewMarkdown(raw);
    expect(parsed.product).toBe("Demo");
    expect(parsed.rating).toBe(5);
    expect(parsed.title).toBe("Solid binder");
    expect(parsed.status).toBe("ready-for-proofy");
    expect(parsed.body.trim()).toBe("It works well.");
  });
});

  it("reads order_date and reviews-to-do priority", () => {
    const parsed = parseReviewMarkdown(`---
product: "Example Night Light"
asin: B0EXAMPL01
url: https://www.amazon.com/dp/B0EXAMPL01
rating: null
title: ""
status: draft
slug: example-night-light
text_only: false
category: products
order_date: "2026-11-01"
priority: "reviews-to-do"
---

`);
    expect(parsed.orderDate).toBe("2026-11-01");
    expect(parsed.priority).toBe("reviews-to-do");
    expect(parsed.body.trim()).toBe("");
    const raw = serializeReviewMarkdown({
      product: parsed.product,
      asin: parsed.asin,
      url: parsed.url,
      rating: parsed.rating,
      title: parsed.title,
      status: parsed.status,
      slug: parsed.slug,
      textOnly: parsed.textOnly,
      category: parsed.category,
      orderDate: parsed.orderDate,
      priority: parsed.priority,
      body: parsed.body,
    });
    expect(raw).toContain('order_date: "2026-11-01"');
    expect(raw).toContain('priority: "reviews-to-do"');
  });

