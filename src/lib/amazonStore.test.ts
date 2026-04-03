import { describe, it, expect, beforeEach } from "vitest";
import {
  getAmazonOrders,
  saveAmazonOrders,
  getAmazonConfig,
  saveAmazonConfig,
  getUnreviewedOrders,
  getDraftOrders,
  getReviewedOrders,
  getOrderById,
  updateOrderReviewStatus,
  generateReviewDraft,
  getAmazonAffiliateLink,
  DEMO_AMAZON_ORDERS,
  type AmazonConfig,
  type AmazonOrder,
} from "./amazonStore";

// ── Test data helpers ─────────────────────────────────────────

function makeOrder(overrides: Partial<AmazonOrder> = {}): AmazonOrder {
  return {
    id: `amz-test-${Date.now()}-${Math.random()}`,
    asin: "B09JQMJHXY",
    product_name: "Test Wireless Earbuds",
    category: "electronics",
    price: 29.99,
    order_date: "2024-01-15",
    status: "delivered",
    review_status: "not_reviewed",
    affiliate_link: "https://www.amazon.com/dp/B09JQMJHXY?tag=meetaudreyeva-20",
    ...overrides,
  };
}

describe("amazonStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ── getAmazonOrders ───────────────────────────────────────

  describe("getAmazonOrders", () => {
    it("returns empty array when no stored data (DEMO_AMAZON_ORDERS is empty)", () => {
      const orders = getAmazonOrders();
      expect(orders.length).toBe(DEMO_AMAZON_ORDERS.length); // both 0
      expect(Array.isArray(orders)).toBe(true);
    });

    it("returns stored orders when data exists", () => {
      const testOrders = [makeOrder({ id: "amz-001" }), makeOrder({ id: "amz-002" })];
      saveAmazonOrders(testOrders);
      const orders = getAmazonOrders();
      expect(orders.length).toBe(2);
    });
  });

  // ── getAmazonConfig ───────────────────────────────────────

  describe("getAmazonConfig", () => {
    it("returns null when no config is stored", () => {
      expect(getAmazonConfig()).toBeNull();
    });

    it("returns stored config", () => {
      const cfg: AmazonConfig = {
        seller_id: "TESTSELLERID",
        marketplace_id: "ATVPDKIKX0DER",
        refresh_token: "Atzr|test",
        affiliate_tag: "meetaudreyeva-20",
        connected: true,
      };
      saveAmazonConfig(cfg);
      const stored = getAmazonConfig();
      expect(stored?.seller_id).toBe("TESTSELLERID");
      expect(stored?.affiliate_tag).toBe("meetaudreyeva-20");
      expect(stored?.connected).toBe(true);
    });
  });

  // ── order filters ────────────────────────────────────────

  describe("getUnreviewedOrders", () => {
    it("returns only delivered + not_reviewed orders", () => {
      const delivered = makeOrder({ id: "d1", status: "delivered", review_status: "not_reviewed" });
      const draft = makeOrder({ id: "d2", status: "delivered", review_status: "draft" });
      saveAmazonOrders([delivered, draft]);
      const orders = getUnreviewedOrders();
      orders.forEach((o) => {
        expect(o.review_status).toBe("not_reviewed");
        expect(o.status).toBe("delivered");
      });
    });
  });

  describe("getDraftOrders", () => {
    it("returns only draft orders", () => {
      const draft = makeOrder({ id: "dr1", review_status: "draft" });
      const notReviewed = makeOrder({ id: "nr1", review_status: "not_reviewed" });
      saveAmazonOrders([draft, notReviewed]);
      const orders = getDraftOrders();
      orders.forEach((o) => expect(o.review_status).toBe("draft"));
    });
  });

  describe("getReviewedOrders", () => {
    it("returns only published orders", () => {
      const published = makeOrder({ id: "pub1", review_status: "published" });
      const draft = makeOrder({ id: "dr2", review_status: "draft" });
      saveAmazonOrders([published, draft]);
      const orders = getReviewedOrders();
      orders.forEach((o) => expect(o.review_status).toBe("published"));
    });
  });

  // ── getOrderById ─────────────────────────────────────────

  describe("getOrderById", () => {
    it("finds an existing order by id", () => {
      const order = makeOrder({ id: "amz-001", asin: "B09JQMJHXY" });
      saveAmazonOrders([order]);
      const found = getOrderById("amz-001");
      expect(found).toBeDefined();
      expect(found?.asin).toBe("B09JQMJHXY");
    });

    it("returns undefined for a missing id", () => {
      expect(getOrderById("nonexistent")).toBeUndefined();
    });
  });

  // ── updateOrderReviewStatus ───────────────────────────────

  describe("updateOrderReviewStatus", () => {
    it("updates review status to draft", () => {
      saveAmazonOrders([makeOrder({ id: "amz-003" })]);
      updateOrderReviewStatus("amz-003", "draft");
      const order = getOrderById("amz-003");
      expect(order?.review_status).toBe("draft");
    });

    it("updates review status to published with a review id", () => {
      saveAmazonOrders([makeOrder({ id: "amz-003" })]);
      updateOrderReviewStatus("amz-003", "published", "my-review-slug");
      const order = getOrderById("amz-003");
      expect(order?.review_status).toBe("published");
      expect(order?.review_id).toBe("my-review-slug");
    });

    it("does nothing for unknown order id", () => {
      expect(() => updateOrderReviewStatus("nonexistent", "draft")).not.toThrow();
    });
  });

  // ── generateReviewDraft ──────────────────────────────────

  describe("generateReviewDraft", () => {
    it("includes the product name in the draft", () => {
      const order = makeOrder({ product_name: "Test Wireless Earbuds Pro" });
      const draft = generateReviewDraft(order);
      expect(draft).toContain(order.product_name);
    });

    it("includes the purchase price in the draft", () => {
      const order = makeOrder({ price: 49.99 });
      const draft = generateReviewDraft(order);
      expect(draft).toContain(order.price.toFixed(2));
    });

    it("produces non-empty text for a test order", () => {
      const order = makeOrder();
      const draft = generateReviewDraft(order);
      expect(draft.length).toBeGreaterThan(50);
    });
  });

  // ── getAmazonAffiliateLink ────────────────────────────────

  describe("getAmazonAffiliateLink", () => {
    it("generates a correctly formatted affiliate URL", () => {
      const link = getAmazonAffiliateLink("B09JQMJHXY", "meetaudreyeva-20");
      expect(link).toBe("https://www.amazon.com/dp/B09JQMJHXY?tag=meetaudreyeva-20");
    });

    it("uses the provided tag verbatim", () => {
      const link = getAmazonAffiliateLink("B0001", "custom-tag-99");
      expect(link).toContain("tag=custom-tag-99");
    });
  });

  // ── affiliate tag compliance ──────────────────────────────

  describe("default affiliate tag compliance", () => {
    it("affiliate links use meetaudreyeva-20 tag", () => {
      const link = getAmazonAffiliateLink("B09JQMJHXY");
      expect(link).toContain("meetaudreyeva-20");
    });
  });
});
