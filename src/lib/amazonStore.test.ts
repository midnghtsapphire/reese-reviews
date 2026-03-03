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
} from "./amazonStore";

describe("amazonStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ── getAmazonOrders ───────────────────────────────────────

  describe("getAmazonOrders", () => {
    it("returns demo orders when no stored data", () => {
      const orders = getAmazonOrders();
      expect(orders.length).toBe(DEMO_AMAZON_ORDERS.length);
    });

    it("returns stored orders when data exists", () => {
      saveAmazonOrders(DEMO_AMAZON_ORDERS.slice(0, 2));
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
      const orders = getUnreviewedOrders();
      orders.forEach((o) => {
        expect(o.review_status).toBe("not_reviewed");
        expect(o.status).toBe("delivered");
      });
    });
  });

  describe("getDraftOrders", () => {
    it("returns only draft orders", () => {
      const orders = getDraftOrders();
      orders.forEach((o) => expect(o.review_status).toBe("draft"));
    });
  });

  describe("getReviewedOrders", () => {
    it("returns only published orders", () => {
      const orders = getReviewedOrders();
      orders.forEach((o) => expect(o.review_status).toBe("published"));
    });
  });

  // ── getOrderById ─────────────────────────────────────────

  describe("getOrderById", () => {
    it("finds an existing order by id", () => {
      const order = getOrderById("amz-001");
      expect(order).toBeDefined();
      expect(order?.asin).toBe("B09JQMJHXY");
    });

    it("returns undefined for a missing id", () => {
      expect(getOrderById("nonexistent")).toBeUndefined();
    });
  });

  // ── updateOrderReviewStatus ───────────────────────────────

  describe("updateOrderReviewStatus", () => {
    it("updates review status to draft", () => {
      updateOrderReviewStatus("amz-003", "draft");
      const order = getOrderById("amz-003");
      expect(order?.review_status).toBe("draft");
    });

    it("updates review status to published with a review id", () => {
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
      const order = DEMO_AMAZON_ORDERS[0];
      const draft = generateReviewDraft(order);
      expect(draft).toContain(order.product_name);
    });

    it("includes the purchase price in the draft", () => {
      const order = DEMO_AMAZON_ORDERS[0];
      const draft = generateReviewDraft(order);
      expect(draft).toContain(order.price.toFixed(2));
    });

    it("produces non-empty text for every demo order", () => {
      DEMO_AMAZON_ORDERS.forEach((order) => {
        const draft = generateReviewDraft(order);
        expect(draft.length).toBeGreaterThan(50);
      });
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

  // ── affiliate tag is meetaudreyeva-20 ─────────────────────

  describe("default affiliate tag compliance", () => {
    it("demo order amz-001 uses meetaudreyeva-20 affiliate tag", () => {
      const order = DEMO_AMAZON_ORDERS.find((o) => o.id === "amz-001");
      expect(order?.affiliate_link).toContain("meetaudreyeva-20");
    });
  });
});
