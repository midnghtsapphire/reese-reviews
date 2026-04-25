/**
 * Unit Tests — Vine Review Store
 * Tests: CRUD operations, CSV parsing, deadline calculations, avatar management
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  getVineItems, addVineItem, updateVineItem, deleteVineItem,
  importFromCSV, parseCSVText, getPendingQueue, getItemStats,
  getDaysUntilDeadline, getDeadlineColor, getDeadlineBadgeVariant,
  getAvatars, addCustomAvatar, deleteAvatar,
  type VineItem,
} from "@/stores/vineReviewStore";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

describe("Vine Review Store", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("CRUD Operations", () => {
    it("should start with empty items", () => {
      const items = getVineItems();
      expect(items).toEqual([]);
    });

    it("should add a vine item", () => {
      const item = addVineItem({
        productName: "Test Wireless Mouse",
        asin: "B0TEST123",
        amazonUrl: "https://www.amazon.com/dp/B0TEST123",
        category: "electronics",
        orderDate: "2026-03-01T00:00:00.000Z",
        reviewDeadline: "2026-04-15T00:00:00.000Z",
        etv: 29.99,
        imageUrl: "",
      });

      expect(item.productName).toBe("Test Wireless Mouse");
      expect(item.asin).toBe("B0TEST123");
      expect(item.status).toBe("pending");
      expect(item.etv).toBe(29.99);

      const items = getVineItems();
      expect(items.length).toBe(1);
    });

    it("should update a vine item", () => {
      const item = addVineItem({
        productName: "Test Item",
        asin: "B0TEST456",
        amazonUrl: "https://www.amazon.com/dp/B0TEST456",
        category: "beauty",
        orderDate: "2026-03-01T00:00:00.000Z",
        reviewDeadline: "2026-04-15T00:00:00.000Z",
        etv: 15.00,
        imageUrl: "",
      });

      updateVineItem(item.id, { status: "generated", productName: "Updated Item" });
      const items = getVineItems();
      const updated = items.find((i) => i.id === item.id);
      expect(updated?.status).toBe("generated");
      expect(updated?.productName).toBe("Updated Item");
    });

    it("should delete a vine item", () => {
      const item = addVineItem({
        productName: "Delete Me",
        asin: "B0DELETE",
        amazonUrl: "https://www.amazon.com/dp/B0DELETE",
        category: "home",
        orderDate: "2026-03-01T00:00:00.000Z",
        reviewDeadline: "2026-04-15T00:00:00.000Z",
        etv: 10.00,
        imageUrl: "",
      });

      deleteVineItem(item.id);
      const items = getVineItems();
      expect(items.length).toBe(0);
    });
  });

  describe("CSV Parsing", () => {
    it("should parse valid CSV text", () => {
      const csv = `productName,asin,category,orderDate,reviewDeadline,etv
Wireless Mouse,B0MOUSE1,electronics,2026-03-01,2026-04-15,29.99
Bluetooth Speaker,B0SPEAK2,electronics,2026-03-05,2026-04-20,49.99`;

      const rows = parseCSVText(csv);
      expect(rows.length).toBe(2);
      expect(rows[0].productName).toBe("Wireless Mouse");
      expect(rows[0].asin).toBe("B0MOUSE1");
      expect(rows[1].productName).toBe("Bluetooth Speaker");
    });

    it("should handle CSV with missing optional fields", () => {
      const csv = `productName,asin,category
Just a Name,B0JUST1,home`;

      const rows = parseCSVText(csv);
      expect(rows.length).toBe(1);
      expect(rows[0].productName).toBe("Just a Name");
    });

    it("should import CSV rows as vine items", () => {
      const rows = [
        { productName: "Item 1", asin: "B0A", category: "electronics", orderDate: "2026-03-01", reviewDeadline: "2026-04-15", etv: "29.99" },
        { productName: "Item 2", asin: "B0B", category: "beauty", orderDate: "2026-03-05", reviewDeadline: "2026-04-20", etv: "15.00" },
      ];
      const imported = importFromCSV(rows);
      expect(imported.length).toBe(2);

      const items = getVineItems();
      expect(items.length).toBe(2);
    });

    it("should reject rows without productName", () => {
      const csv = `productName,asin
,B0EMPTY`;

      const rows = parseCSVText(csv);
      expect(rows.length).toBe(0);
    });
  });

  describe("Queue and Stats", () => {
    it("should return pending queue correctly", () => {
      addVineItem({ productName: "Pending 1", asin: "B01", amazonUrl: "", category: "electronics", orderDate: "2026-03-01T00:00:00.000Z", reviewDeadline: "2026-05-15T00:00:00.000Z", etv: 10, imageUrl: "" });
      addVineItem({ productName: "Pending 2", asin: "B02", amazonUrl: "", category: "beauty", orderDate: "2026-03-01T00:00:00.000Z", reviewDeadline: "2026-05-15T00:00:00.000Z", etv: 20, imageUrl: "" });

      const pending = getPendingQueue();
      expect(pending.length).toBe(2);
      expect(pending.every((i) => i.status === "pending")).toBe(true);
    });

    it("should calculate stats correctly", () => {
      addVineItem({ productName: "P1", asin: "B01", amazonUrl: "", category: "electronics", orderDate: "2026-03-01T00:00:00.000Z", reviewDeadline: "2026-05-15T00:00:00.000Z", etv: 10, imageUrl: "" });
      const item2 = addVineItem({ productName: "P2", asin: "B02", amazonUrl: "", category: "beauty", orderDate: "2026-03-01T00:00:00.000Z", reviewDeadline: "2026-05-15T00:00:00.000Z", etv: 20, imageUrl: "" });
      updateVineItem(item2.id, { status: "generated" });

      const stats = getItemStats();
      expect(stats.total).toBe(2);
      expect(stats.pending).toBe(1);
      expect(stats.generated).toBe(1);
    });
  });

  describe("Deadline Calculations", () => {
    it("should calculate days until deadline", () => {
      const futureDate = new Date(Date.now() + 10 * 86400000).toISOString();
      const days = getDaysUntilDeadline(futureDate);
      expect(days).toBeGreaterThanOrEqual(9);
      expect(days).toBeLessThanOrEqual(11);
    });

    it("should return negative for past deadlines", () => {
      const pastDate = new Date(Date.now() - 5 * 86400000).toISOString();
      const days = getDaysUntilDeadline(pastDate);
      expect(days).toBeLessThan(0);
    });

    it("should return correct color for deadlines", () => {
      const farFuture = new Date(Date.now() + 20 * 86400000).toISOString();
      const nearFuture = new Date(Date.now() + 5 * 86400000).toISOString();
      const past = new Date(Date.now() - 1 * 86400000).toISOString();

      expect(getDeadlineColor(farFuture)).toBe("text-green-500");
      expect(getDeadlineColor(nearFuture)).toBe("text-yellow-500");
      expect(getDeadlineColor(past)).toBe("text-red-500");
    });

    it("should return correct badge variant", () => {
      const farFuture = new Date(Date.now() + 20 * 86400000).toISOString();
      const past = new Date(Date.now() - 1 * 86400000).toISOString();

      expect(getDeadlineBadgeVariant(farFuture)).toBe("secondary");
      expect(getDeadlineBadgeVariant(past)).toBe("destructive");
    });
  });

  describe("Avatar Management", () => {
    it("should return stock avatars", () => {
      const avatars = getAvatars();
      expect(avatars.length).toBeGreaterThan(0);
      expect(avatars.some((a) => a.type === "stock")).toBe(true);
    });

    it("should add custom avatar", () => {
      const before = getAvatars().length;
      addCustomAvatar("My Avatar", "data:image/png;base64,test", "female");
      const after = getAvatars().length;
      expect(after).toBe(before + 1);
    });

    it("should delete custom avatar", () => {
      addCustomAvatar("Delete Me", "data:image/png;base64,test2", "male");
      const avatars = getAvatars();
      const custom = avatars.find((a) => a.name === "Delete Me");
      expect(custom).toBeDefined();

      deleteAvatar(custom!.id);
      const after = getAvatars();
      expect(after.find((a) => a.id === custom!.id)).toBeUndefined();
    });

    it("should not delete stock avatars", () => {
      const avatars = getAvatars();
      const stock = avatars.find((a) => a.type === "stock");
      expect(stock).toBeDefined();

      deleteAvatar(stock!.id);
      const after = getAvatars();
      expect(after.find((a) => a.id === stock!.id)).toBeDefined();
    });
  });
});
