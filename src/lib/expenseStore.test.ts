import { describe, it, expect, beforeEach } from "vitest";
import {
  getExpenses,
  saveExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  suggestCategory,
  getWriteOffSummary,
  generateWriteOffCSV,
  DEMO_EXPENSES,
  WRITE_OFF_CATEGORIES,
  type Expense,
} from "./expenseStore";

describe("expenseStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ── WRITE_OFF_CATEGORIES constant ────────────────────────

  describe("WRITE_OFF_CATEGORIES", () => {
    it("contains all expected category keys", () => {
      const expected = [
        "home_office",
        "equipment",
        "software_subscriptions",
        "advertising_marketing",
        "professional_services",
        "shipping_postage",
        "office_supplies",
        "travel_vehicle",
        "meals_entertainment",
        "education_training",
        "phone_internet",
        "other_business",
      ];
      expected.forEach((key) => {
        expect(WRITE_OFF_CATEGORIES).toHaveProperty(key);
      });
    });

    it("each category has label, description, and typical_pct", () => {
      Object.values(WRITE_OFF_CATEGORIES).forEach((cat) => {
        expect(cat).toHaveProperty("label");
        expect(cat).toHaveProperty("description");
        expect(typeof cat.typical_pct).toBe("number");
      });
    });
  });

  // ── suggestCategory ───────────────────────────────────────

  describe("suggestCategory", () => {
    it("categorizes Adobe as software_subscriptions", () => {
      const result = suggestCategory("Adobe", "Lightroom subscription");
      expect(result.category).toBe("software_subscriptions");
      expect(result.is_write_off).toBe(true);
    });

    it("categorizes Best Buy as equipment", () => {
      const result = suggestCategory("Best Buy", "Camera kit");
      expect(result.category).toBe("equipment");
      expect(result.is_write_off).toBe(true);
    });

    it("categorizes UPS as shipping_postage", () => {
      const result = suggestCategory("UPS Store", "Return shipping");
      expect(result.category).toBe("shipping_postage");
      expect(result.is_write_off).toBe(true);
    });

    it("categorizes Comcast as phone_internet", () => {
      const result = suggestCategory("Comcast", "Internet bill");
      expect(result.category).toBe("phone_internet");
      expect(result.is_write_off).toBe(true);
    });

    it("categorizes Udemy as education_training", () => {
      const result = suggestCategory("Udemy", "Online course");
      expect(result.category).toBe("education_training");
      expect(result.is_write_off).toBe(true);
    });

    it("returns uncategorized for unknown merchant", () => {
      const result = suggestCategory("Random Store XYZ", "Misc purchase");
      expect(result.category).toBe("uncategorized");
      expect(result.is_write_off).toBe(false);
    });

    it("is case-insensitive for merchant matching", () => {
      const result = suggestCategory("ADOBE SYSTEMS", "Photoshop");
      expect(result.category).toBe("software_subscriptions");
    });
  });

  // ── getExpenses ───────────────────────────────────────────

  describe("getExpenses", () => {
    it("returns demo expenses when nothing is stored", () => {
      const expenses = getExpenses();
      expect(expenses.length).toBe(DEMO_EXPENSES.length);
    });

    it("returns stored expenses", () => {
      saveExpenses(DEMO_EXPENSES.slice(0, 2));
      expect(getExpenses()).toHaveLength(2);
    });

    it("filters by tax_year", () => {
      const yearExpenses = getExpenses(2026);
      yearExpenses.forEach((e) => {
        expect(e.tax_year).toBe(2026);
      });
    });

    it("returns demo expenses on corrupted JSON (resilience)", () => {
      localStorage.setItem("reese-expenses", "NOT{VALID}JSON");
      const expenses = getExpenses();
      expect(expenses.length).toBe(DEMO_EXPENSES.length);
    });
  });

  // ── addExpense ────────────────────────────────────────────

  describe("addExpense", () => {
    it("adds a new expense and returns it with an id", () => {
      saveExpenses([]); // start clean
      const newExp: Omit<Expense, "id"> = {
        date: "2026-03-01",
        merchant: "Test Merchant",
        description: "Test purchase",
        amount: 99.99,
        category: "equipment",
        is_write_off: true,
        write_off_percentage: 100,
        source: "manual",
        notes: "",
        tax_year: 2026,
      };
      const result = addExpense(newExp);
      expect(result.id).toMatch(/^exp-/);
      expect(getExpenses()).toHaveLength(1);
    });

    it("prepends new expense to the list", () => {
      saveExpenses([]);
      addExpense({
        date: "2026-01-01",
        merchant: "First",
        description: "",
        amount: 10,
        category: "equipment",
        is_write_off: true,
        write_off_percentage: 100,
        source: "manual",
        notes: "",
        tax_year: 2026,
      });
      addExpense({
        date: "2026-01-02",
        merchant: "Second",
        description: "",
        amount: 20,
        category: "equipment",
        is_write_off: true,
        write_off_percentage: 100,
        source: "manual",
        notes: "",
        tax_year: 2026,
      });
      const expenses = getExpenses();
      expect(expenses[0].merchant).toBe("Second");
    });
  });

  // ── updateExpense ─────────────────────────────────────────

  describe("updateExpense", () => {
    it("updates an existing expense", () => {
      saveExpenses([]);
      const exp = addExpense({
        date: "2026-01-01",
        merchant: "Old",
        description: "",
        amount: 50,
        category: "equipment",
        is_write_off: true,
        write_off_percentage: 100,
        source: "manual",
        notes: "",
        tax_year: 2026,
      });
      updateExpense(exp.id, { merchant: "Updated", amount: 75 });
      const updated = getExpenses().find((e) => e.id === exp.id);
      expect(updated?.merchant).toBe("Updated");
      expect(updated?.amount).toBe(75);
    });

    it("does nothing for an unknown id", () => {
      saveExpenses([]);
      updateExpense("non-existent-id", { merchant: "Ghost" });
      expect(getExpenses()).toHaveLength(0);
    });
  });

  // ── deleteExpense ─────────────────────────────────────────

  describe("deleteExpense", () => {
    it("removes an expense by id", () => {
      saveExpenses([]);
      const exp = addExpense({
        date: "2026-01-01",
        merchant: "ToDelete",
        description: "",
        amount: 10,
        category: "equipment",
        is_write_off: true,
        write_off_percentage: 100,
        source: "manual",
        notes: "",
        tax_year: 2026,
      });
      deleteExpense(exp.id);
      expect(getExpenses()).toHaveLength(0);
    });

    it("leaves other expenses intact", () => {
      const e1: Expense = {
        id: "exp-keep",
        date: "2026-01-01",
        merchant: "Keep",
        description: "",
        amount: 10,
        category: "equipment",
        is_write_off: true,
        write_off_percentage: 100,
        source: "manual",
        notes: "",
        tax_year: 2026,
      };
      const e2: Expense = {
        id: "exp-delete",
        date: "2026-01-02",
        merchant: "Delete",
        description: "",
        amount: 20,
        category: "equipment",
        is_write_off: true,
        write_off_percentage: 100,
        source: "manual",
        notes: "",
        tax_year: 2026,
      };
      saveExpenses([e1, e2]);
      deleteExpense(e2.id);
      const remaining = getExpenses();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(e1.id);
    });
  });

  // ── getWriteOffSummary ────────────────────────────────────

  describe("getWriteOffSummary", () => {
    it("returns totals for write-off expenses", () => {
      saveExpenses([
        {
          id: "e1",
          date: "2026-01-01",
          merchant: "Adobe",
          description: "",
          amount: 100,
          category: "software_subscriptions",
          is_write_off: true,
          write_off_percentage: 100,
          source: "manual",
          notes: "",
          tax_year: 2026,
        },
        {
          id: "e2",
          date: "2026-01-02",
          merchant: "Whole Foods",
          description: "",
          amount: 50,
          category: "personal",
          is_write_off: false,
          write_off_percentage: 0,
          source: "manual",
          notes: "",
          tax_year: 2026,
        },
      ]);
      const summary = getWriteOffSummary(2026);
      expect(summary.total_expenses).toBe(150);
      expect(summary.total_write_offs).toBe(1);
      expect(summary.write_off_amount).toBe(100);
    });

    it("handles partial write-off percentage", () => {
      saveExpenses([
        {
          id: "e1",
          date: "2026-01-01",
          merchant: "Comcast",
          description: "",
          amount: 60,
          category: "phone_internet",
          is_write_off: true,
          write_off_percentage: 50,
          source: "manual",
          notes: "",
          tax_year: 2026,
        },
      ]);
      const summary = getWriteOffSummary(2026);
      expect(summary.write_off_amount).toBe(30);
    });

    it("returns empty by_category when no write-offs", () => {
      saveExpenses([]);
      const summary = getWriteOffSummary(2026);
      expect(summary.by_category).toEqual([]);
    });
  });

  // ── generateWriteOffCSV ───────────────────────────────────

  describe("generateWriteOffCSV", () => {
    it("generates a CSV with header row", () => {
      saveExpenses(DEMO_EXPENSES);
      const csv = generateWriteOffCSV(2026);
      expect(csv).toContain("Date,Merchant,Description");
    });

    it("includes write-off expenses in the CSV", () => {
      saveExpenses(DEMO_EXPENSES);
      const csv = generateWriteOffCSV(2026);
      expect(csv).toContain("Adobe");
    });

    it("excludes personal expenses from the CSV", () => {
      saveExpenses(DEMO_EXPENSES);
      const csv = generateWriteOffCSV(2026);
      // "Whole Foods" is a personal expense in the demo data
      expect(csv).not.toContain("Whole Foods");
    });

    it("returns only header when no write-offs for the year", () => {
      saveExpenses([]);
      const csv = generateWriteOffCSV(2025);
      const lines = csv.split("\n").filter(Boolean);
      expect(lines).toHaveLength(1); // header only
    });
  });
});
