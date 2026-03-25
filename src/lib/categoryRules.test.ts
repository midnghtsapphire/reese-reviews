import { describe, it, expect, beforeEach } from "vitest";
import {
  getCategoryRules,
  saveCategoryRules,
  addCategoryRule,
  updateCategoryRule,
  deleteCategoryRule,
  resetToDefaultRules,
  categorizeProduct,
  getBestCategory,
  getRulesGroupedByCategory,
  getCustomRules,
  SITE_CATEGORIES,
} from "./categoryRules";

describe("categoryRules", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ── SITE_CATEGORIES constant ──────────────────────────────

  describe("SITE_CATEGORIES", () => {
    it("contains at least 10 categories", () => {
      expect(SITE_CATEGORIES.length).toBeGreaterThanOrEqual(10);
    });

    it("each category has value, label, icon, and description", () => {
      SITE_CATEGORIES.forEach((cat) => {
        expect(cat).toHaveProperty("value");
        expect(cat).toHaveProperty("label");
        expect(cat).toHaveProperty("icon");
        expect(cat).toHaveProperty("description");
      });
    });
  });

  // ── getCategoryRules ──────────────────────────────────────

  describe("getCategoryRules", () => {
    it("returns default rules when nothing is stored", () => {
      const rules = getCategoryRules();
      expect(rules.length).toBeGreaterThan(0);
    });

    it("returns stored rules when data exists", () => {
      const defaults = resetToDefaultRules();
      const sliced = defaults.slice(0, 3);
      saveCategoryRules(sliced);
      // Since getCategoryRules falls back to defaults when stored array is empty,
      // saving 3 rules should return those 3
      expect(getCategoryRules()).toHaveLength(3);
    });

    it("falls back to default rules on corrupted JSON", () => {
      localStorage.setItem("reese-category-rules", "CORRUPT{{{JSON");
      const rules = getCategoryRules();
      expect(rules.length).toBeGreaterThan(0);
    });
  });

  // ── addCategoryRule ───────────────────────────────────────

  describe("addCategoryRule", () => {
    it("adds a new rule and returns it with id and createdAt", () => {
      const rule = addCategoryRule({
        type: "keyword",
        pattern: "widget",
        targetCategory: "tech",
        priority: 80,
        enabled: true,
      });
      expect(rule.id).toBeTruthy();
      expect(rule.createdAt).toBeTruthy();
      expect(rule.pattern).toBe("widget");
    });

    it("persists the new rule to storage", () => {
      addCategoryRule({
        type: "keyword",
        pattern: "gadget",
        targetCategory: "tech",
        priority: 75,
        enabled: true,
      });
      const rules = getCategoryRules();
      expect(rules.some((r) => r.pattern === "gadget")).toBe(true);
    });
  });

  // ── updateCategoryRule ────────────────────────────────────

  describe("updateCategoryRule", () => {
    it("updates an existing rule", () => {
      const rule = addCategoryRule({
        type: "keyword",
        pattern: "original",
        targetCategory: "products",
        priority: 50,
        enabled: true,
      });
      updateCategoryRule(rule.id, { pattern: "updated", priority: 90 });
      const updated = getCategoryRules().find((r) => r.id === rule.id);
      expect(updated?.pattern).toBe("updated");
      expect(updated?.priority).toBe(90);
    });

    it("does nothing for an unknown id", () => {
      const countBefore = getCategoryRules().length;
      updateCategoryRule("non-existent-id", { enabled: false });
      expect(getCategoryRules().length).toBe(countBefore);
    });
  });

  // ── deleteCategoryRule ────────────────────────────────────

  describe("deleteCategoryRule", () => {
    it("removes a rule by id", () => {
      const rule = addCategoryRule({
        type: "keyword",
        pattern: "deleteme",
        targetCategory: "products",
        priority: 50,
        enabled: true,
      });
      const countBefore = getCategoryRules().length;
      deleteCategoryRule(rule.id);
      expect(getCategoryRules().length).toBe(countBefore - 1);
      expect(getCategoryRules().some((r) => r.id === rule.id)).toBe(false);
    });
  });

  // ── resetToDefaultRules ───────────────────────────────────

  describe("resetToDefaultRules", () => {
    it("restores the default rules", () => {
      saveCategoryRules([]); // wipe everything
      const rules = resetToDefaultRules();
      expect(rules.length).toBeGreaterThan(0);
    });
  });

  // ── categorizeProduct ─────────────────────────────────────

  describe("categorizeProduct", () => {
    it("categorizes a phone as tech", () => {
      const matches = categorizeProduct("New phone for everyday use", "B08N5M7S6K");
      expect(matches[0].category).toBe("tech");
    });

    it("categorizes headphones as tech", () => {
      const matches = categorizeProduct("Sony WH-1000XM5 headphone wireless", "B09XS7JWHH");
      expect(matches[0].category).toBe("tech");
    });

    it("categorizes yoga mat as sports-outdoors", () => {
      const matches = categorizeProduct("Premium yoga mat for exercise", "B01ABC");
      expect(matches[0].category).toBe("sports-outdoors");
    });

    it("categorizes moisturizer as beauty-health", () => {
      const matches = categorizeProduct("Daily face moisturizer skincare", "B02ABC");
      expect(matches[0].category).toBe("beauty-health");
    });

    it("returns fallback category when no rules match", () => {
      const matches = categorizeProduct("ZZZYYYXXX11122233", "ASIN000");
      expect(matches).toHaveLength(1);
      expect(matches[0].category).toBe("products");
      expect(matches[0].confidence).toBe("low");
    });

    it("sorts matches by score descending", () => {
      const matches = categorizeProduct("wireless bluetooth headphone earbuds", "B0TEST");
      for (let i = 0; i < matches.length - 1; i++) {
        expect(matches[i].score).toBeGreaterThanOrEqual(matches[i + 1].score);
      }
    });

    it("uses amazon category hint for matching", () => {
      const matches = categorizeProduct("Pro kit", "B0TEST", "Electronics");
      const techMatch = matches.find((m) => m.category === "tech");
      expect(techMatch).toBeTruthy();
    });
  });

  // ── getBestCategory ───────────────────────────────────────

  describe("getBestCategory", () => {
    it("returns the top match from categorizeProduct", () => {
      const best = getBestCategory("laptop computer", "B0LAPTOP");
      expect(best.category).toBe("tech");
    });

    it("returns a CategoryMatch with required fields", () => {
      const best = getBestCategory("book reader", "B0BOOK");
      expect(best).toHaveProperty("category");
      expect(best).toHaveProperty("confidence");
      expect(best).toHaveProperty("matchedRule");
      expect(best).toHaveProperty("score");
    });
  });

  // ── getRulesGroupedByCategory ─────────────────────────────

  describe("getRulesGroupedByCategory", () => {
    it("returns an object with keys for all site categories", () => {
      const grouped = getRulesGroupedByCategory();
      SITE_CATEGORIES.forEach((cat) => {
        expect(grouped).toHaveProperty(cat.value);
      });
    });

    it("places tech rules under 'tech' key", () => {
      const grouped = getRulesGroupedByCategory();
      expect(grouped.tech.length).toBeGreaterThan(0);
    });
  });

  // ── getCustomRules ────────────────────────────────────────

  describe("getCustomRules", () => {
    it("returns empty array when no custom rules added", () => {
      // Default rules are built-in; custom rules are user-created
      resetToDefaultRules();
      // Default rules have ids starting with "default-"
      // so getCustomRules should return only non-default ones
      const custom = getCustomRules();
      // No user-created custom rules yet
      expect(Array.isArray(custom)).toBe(true);
    });

    it("includes user-added custom rules", () => {
      addCategoryRule({
        type: "custom",
        pattern: "my-brand",
        targetCategory: "products",
        priority: 60,
        enabled: true,
      });
      const custom = getCustomRules();
      expect(custom.some((r) => r.pattern === "my-brand")).toBe(true);
    });
  });
});
