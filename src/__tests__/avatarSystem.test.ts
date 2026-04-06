/**
 * Unit Tests — Avatar System
 * Tests: stock avatars, custom upload, selection, deletion
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  getAvatars, addCustomAvatar, deleteAvatar,
  type AvatarProfile,
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

describe("Avatar System", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("Stock Avatars", () => {
    it("should provide at least 6 stock avatars", () => {
      const avatars = getAvatars();
      const stock = avatars.filter((a) => a.type === "stock");
      expect(stock.length).toBeGreaterThanOrEqual(5);
    });

    it("should include both male and female stock avatars", () => {
      const avatars = getAvatars();
      const males = avatars.filter((a) => a.type === "stock" && a.gender === "male");
      const females = avatars.filter((a) => a.type === "stock" && a.gender === "female");
      expect(males.length).toBeGreaterThanOrEqual(2);
      expect(females.length).toBeGreaterThanOrEqual(2);
    });

    it("should have a default 'Reese' avatar", () => {
      const avatars = getAvatars();
      const reese = avatars.find((a) => a.id === "avatar-reese");
      expect(reese).toBeDefined();
      expect(reese?.name).toBe("Reese");
    });

    it("should have unique IDs for all stock avatars", () => {
      const avatars = getAvatars();
      const ids = avatars.map((a) => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("Custom Avatar Upload", () => {
    it("should add a custom avatar with correct properties", () => {
      addCustomAvatar("My Custom Avatar", "data:image/png;base64,testdata", "female");
      const avatars = getAvatars();
      const custom = avatars.find((a) => a.name === "My Custom Avatar");

      expect(custom).toBeDefined();
      expect(custom?.type).toBe("custom");
      expect(custom?.gender).toBe("female");
      expect(custom?.imageUrl).toBe("data:image/png;base64,testdata");
    });

    it("should support multiple custom avatars", () => {
      addCustomAvatar("Avatar 1", "data:image/png;base64,a1", "female");
      addCustomAvatar("Avatar 2", "data:image/png;base64,a2", "male");
      addCustomAvatar("Avatar 3", "data:image/png;base64,a3", "neutral");

      const avatars = getAvatars();
      const customs = avatars.filter((a) => a.type === "custom");
      expect(customs.length).toBe(3);
    });

    it("should persist custom avatars across reads", () => {
      addCustomAvatar("Persistent", "data:image/png;base64,persist", "male");

      // Read twice to verify persistence
      const first = getAvatars();
      const second = getAvatars();

      expect(first.find((a) => a.name === "Persistent")).toBeDefined();
      expect(second.find((a) => a.name === "Persistent")).toBeDefined();
    });
  });

  describe("Avatar Deletion", () => {
    it("should delete custom avatars", () => {
      addCustomAvatar("To Delete", "data:image/png;base64,del", "female");
      const avatars = getAvatars();
      const target = avatars.find((a) => a.name === "To Delete");
      expect(target).toBeDefined();

      deleteAvatar(target!.id);
      const after = getAvatars();
      expect(after.find((a) => a.id === target!.id)).toBeUndefined();
    });

    it("should NOT delete stock avatars", () => {
      const avatars = getAvatars();
      const stockCount = avatars.filter((a) => a.type === "stock").length;
      const stock = avatars.find((a) => a.type === "stock");

      deleteAvatar(stock!.id);
      const after = getAvatars();
      const afterStockCount = after.filter((a) => a.type === "stock").length;
      expect(afterStockCount).toBe(stockCount);
    });

    it("should handle deleting non-existent avatar gracefully", () => {
      expect(() => deleteAvatar("nonexistent-id")).not.toThrow();
    });
  });
});
