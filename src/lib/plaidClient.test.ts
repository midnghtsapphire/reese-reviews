import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  classifyTransaction,
  getPlaidTransactions,
  savePlaidTransactions,
  getPlaidAccounts,
  savePlaidAccounts,
  getPlaidConfig,
  savePlaidConfig,
  clearPlaidConfig,
  updatePlaidTransaction,
  getPlaidDeductionSummary,
  AMAZON_VINE_FLAG_RULES,
  DEMO_ACCOUNTS,
  DEMO_TRANSACTIONS,
  type AutoFlagRule,
  type ClassifiedTransaction,
} from "./plaidClient";
import type { BankTransaction } from "./businessTypes";

// ─── Mock Supabase (prevent real network calls) ─────────────
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    from: vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

// ─── Helpers ─────────────────────────────────────────────────

/** Build a minimal BankTransaction for testing. */
function makeTxn(
  overrides: Partial<BankTransaction> = {}
): BankTransaction {
  return {
    id: `txn-test-${Date.now()}-${Math.random()}`,
    plaid_transaction_id: `plaid-${Date.now()}`,
    account_id: "acc-001",
    date: "2026-01-15",
    amount: -50, // expense
    merchant_name: "Generic Store",
    description: "Generic purchase",
    category: "expense_other",
    tax_deductible: false,
    tax_write_off_category: undefined,
    notes: "",
    is_manual: false,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────

describe("plaidClient", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ── AMAZON_VINE_FLAG_RULES integrity ──────────────────────

  describe("AMAZON_VINE_FLAG_RULES", () => {
    it("is a non-empty array", () => {
      expect(Array.isArray(AMAZON_VINE_FLAG_RULES)).toBe(true);
      expect(AMAZON_VINE_FLAG_RULES.length).toBeGreaterThan(0);
    });

    it("every rule has required fields", () => {
      for (const rule of AMAZON_VINE_FLAG_RULES) {
        expect(rule.pattern).toBeInstanceOf(RegExp);
        expect(typeof rule.label).toBe("string");
        expect(typeof rule.is_vine_related).toBe("boolean");
        expect(typeof rule.is_amazon_related).toBe("boolean");
        expect(typeof rule.is_write_off).toBe("boolean");
        expect(typeof rule.write_off_percentage).toBe("number");
        expect(["high", "medium", "low"]).toContain(rule.confidence);
      }
    });

    it("Amazon Vine rule is flagged vine_related and not write_off", () => {
      const vineRule = AMAZON_VINE_FLAG_RULES.find((r) =>
        r.pattern.test("amazon vine")
      );
      expect(vineRule).toBeDefined();
      expect(vineRule!.is_vine_related).toBe(true);
      expect(vineRule!.is_write_off).toBe(false); // ETV is income, not expense
    });

    it("Amazon Seller rule is write_off at 100%", () => {
      const rule = AMAZON_VINE_FLAG_RULES.find((r) =>
        r.pattern.test("amazon seller")
      );
      expect(rule).toBeDefined();
      expect(rule!.is_write_off).toBe(true);
      expect(rule!.write_off_percentage).toBe(100);
    });

    it("Amazon Prime rule is partial write_off (50%)", () => {
      const rule = AMAZON_VINE_FLAG_RULES.find((r) =>
        r.pattern.test("amazon prime")
      );
      expect(rule).toBeDefined();
      expect(rule!.is_write_off).toBe(true);
      expect(rule!.write_off_percentage).toBe(50);
    });
  });

  // ── classifyTransaction ───────────────────────────────────

  describe("classifyTransaction", () => {
    it("returns a ClassifiedTransaction with all required fields", () => {
      const txn = makeTxn();
      const result = classifyTransaction(txn);
      expect(result).toMatchObject({
        id: txn.id,
        plaid_transaction_id: txn.plaid_transaction_id,
        account_id: txn.account_id,
        date: txn.date,
        amount: txn.amount,
        merchant_name: txn.merchant_name,
        description: txn.description,
        notes: txn.notes,
        is_manual: txn.is_manual,
        matched_rules: expect.any(Array),
        needs_review: expect.any(Boolean),
        user_classification: expect.any(String),
        synced_to_expenses: false,
        is_spontaneous: expect.any(Boolean),
      });
    });

    it("matches Amazon Vine rule on merchant_name", () => {
      const txn = makeTxn({ merchant_name: "Amazon Vine Program" });
      const result = classifyTransaction(txn);
      expect(result.matched_rules.length).toBeGreaterThan(0);
      expect(result.matched_rules.some((r: AutoFlagRule) => r.is_vine_related)).toBe(true);
      expect(result.user_classification).toBe("vine_income");
    });

    it("matches Amazon Vine rule on description (case-insensitive)", () => {
      const txn = makeTxn({ merchant_name: "", description: "vine voice credit" });
      const result = classifyTransaction(txn);
      expect(result.matched_rules.some((r: AutoFlagRule) => r.is_vine_related)).toBe(true);
    });

    it("classifies Amazon Seller as business with write_off", () => {
      const txn = makeTxn({ merchant_name: "Amazon Seller Services", amount: -100 });
      const result = classifyTransaction(txn);
      expect(result.user_classification).toBe("business");
      expect(result.tax_deductible).toBe(true);
    });

    it("classifies unrecognized transaction as pending with needs_review=true", () => {
      const txn = makeTxn({
        merchant_name: "Random Coffee Shop",
        description: "Latte",
      });
      const result = classifyTransaction(txn);
      expect(result.matched_rules.length).toBe(0);
      expect(result.needs_review).toBe(true);
      expect(result.user_classification).toBe("pending");
    });

    it("matches Adobe as creative software write_off", () => {
      const txn = makeTxn({ merchant_name: "Adobe Creative Cloud", amount: -55 });
      const result = classifyTransaction(txn);
      const adobeRule = result.matched_rules.find((r: AutoFlagRule) =>
        r.pattern.test("Adobe")
      );
      expect(adobeRule).toBeDefined();
      expect(adobeRule!.is_write_off).toBe(true);
      expect(result.tax_deductible).toBe(true);
    });

    it("matches AWS on description", () => {
      const txn = makeTxn({ merchant_name: "", description: "Amazon Web Services bill" });
      const result = classifyTransaction(txn);
      expect(result.matched_rules.some((r: AutoFlagRule) =>
        r.label === "Amazon Web Services"
      )).toBe(true);
      expect(result.tax_deductible).toBe(true);
    });

    it("preserves original transaction fields", () => {
      const txn = makeTxn({ id: "preserve-me", amount: -200, date: "2026-03-01" });
      const result = classifyTransaction(txn);
      expect(result.id).toBe("preserve-me");
      expect(result.amount).toBe(-200);
      expect(result.date).toBe("2026-03-01");
    });

    it("sets synced_to_expenses to false on new classification", () => {
      const txn = makeTxn();
      expect(classifyTransaction(txn).synced_to_expenses).toBe(false);
    });

    it("matches Best Buy as equipment write_off", () => {
      const txn = makeTxn({ merchant_name: "Best Buy" });
      const result = classifyTransaction(txn);
      expect(result.matched_rules.some((r: AutoFlagRule) =>
        r.category === "equipment" && r.is_write_off
      )).toBe(true);
    });
  });

  // ── getPlaidTransactions / savePlaidTransactions ──────────

  describe("getPlaidTransactions / savePlaidTransactions", () => {
    it("returns empty array when localStorage is empty", () => {
      expect(getPlaidTransactions()).toEqual([]);
    });

    it("returns stored transactions", () => {
      const txn = classifyTransaction(makeTxn({ id: "stored-1" }));
      savePlaidTransactions([txn]);
      const result = getPlaidTransactions();
      expect(result.length).toBe(1);
      expect(result[0].id).toBe("stored-1");
    });

    it("overwrites previous data on save", () => {
      const t1 = classifyTransaction(makeTxn({ id: "old-txn" }));
      const t2 = classifyTransaction(makeTxn({ id: "new-txn" }));
      savePlaidTransactions([t1]);
      savePlaidTransactions([t2]);
      const result = getPlaidTransactions();
      expect(result.length).toBe(1);
      expect(result[0].id).toBe("new-txn");
    });

    it("returns empty array on corrupted localStorage", () => {
      localStorage.setItem("reese-plaid-transactions", "not-valid-json{{");
      expect(getPlaidTransactions()).toEqual([]);
    });
  });

  // ── updatePlaidTransaction ────────────────────────────────

  describe("updatePlaidTransaction", () => {
    it("updates a specific transaction by id", () => {
      const txn = classifyTransaction(makeTxn({ id: "upd-txn-1" }));
      savePlaidTransactions([txn]);
      updatePlaidTransaction("upd-txn-1", { user_classification: "personal" });
      const updated = getPlaidTransactions().find((t) => t.id === "upd-txn-1");
      expect(updated?.user_classification).toBe("personal");
    });

    it("does nothing when id does not exist", () => {
      const txn = classifyTransaction(makeTxn({ id: "real-id" }));
      savePlaidTransactions([txn]);
      updatePlaidTransaction("fake-id", { user_classification: "business" });
      const txns = getPlaidTransactions();
      expect(txns.length).toBe(1);
      expect(txns[0].user_classification).not.toBe("business");
    });

    it("merges partial updates without overwriting other fields", () => {
      const txn = classifyTransaction(makeTxn({ id: "merge-test", amount: -99 }));
      savePlaidTransactions([txn]);
      updatePlaidTransaction("merge-test", { synced_to_expenses: true });
      const updated = getPlaidTransactions().find((t) => t.id === "merge-test");
      expect(updated?.synced_to_expenses).toBe(true);
      expect(updated?.amount).toBe(-99); // untouched
    });
  });

  // ── getPlaidAccounts / savePlaidAccounts ──────────────────

  describe("getPlaidAccounts / savePlaidAccounts", () => {
    it("returns empty array when no data stored", () => {
      expect(getPlaidAccounts()).toEqual([]);
    });

    it("stores and retrieves accounts", () => {
      const account = {
        id: "acc-001",
        plaid_account_id: "plaid-acc-001",
        institution_name: "Test Bank",
        account_name: "Checking",
        account_type: "depository" as const,
        account_subtype: "checking",
        balance_available: 1000,
        balance_current: 1050,
        currency: "USD",
        mask: "1234",
        last_synced: new Date().toISOString(),
      };
      savePlaidAccounts([account]);
      const accounts = getPlaidAccounts();
      expect(accounts.length).toBe(1);
      expect(accounts[0].account_name).toBe("Checking");
    });

    it("returns empty array on corrupted localStorage", () => {
      localStorage.setItem("reese-plaid-accounts", "{corrupt}");
      expect(getPlaidAccounts()).toEqual([]);
    });
  });

  // ── PlaidConfig ──────────────────────────────────────────

  describe("getPlaidConfig / savePlaidConfig / clearPlaidConfig", () => {
    it("returns null when no config stored", () => {
      expect(getPlaidConfig()).toBeNull();
    });

    it("stores and retrieves config", () => {
      const config = {
        client_id: "test-client-id",
        environment: "sandbox" as const,
        linked_at: new Date().toISOString(),
        institution_name: "Chase",
        account_count: 2,
      };
      savePlaidConfig(config);
      const retrieved = getPlaidConfig();
      expect(retrieved?.client_id).toBe("test-client-id");
      expect(retrieved?.environment).toBe("sandbox");
    });

    it("clearPlaidConfig removes all plaid keys", () => {
      const config = {
        client_id: "x",
        environment: "sandbox" as const,
        linked_at: "2026-01-01",
        institution_name: "Bank",
        account_count: 1,
      };
      savePlaidConfig(config);
      clearPlaidConfig();
      expect(getPlaidConfig()).toBeNull();
      expect(getPlaidAccounts()).toEqual([]);
      expect(getPlaidTransactions()).toEqual([]);
    });
  });

  // ── getPlaidDeductionSummary ─────────────────────────────

  describe("getPlaidDeductionSummary", () => {
    function seedTransactions(overrides: Partial<ClassifiedTransaction>[] = []) {
      const txns: ClassifiedTransaction[] = overrides.map((o, i) => ({
        id: `sum-${i}`,
        plaid_transaction_id: `plaid-sum-${i}`,
        account_id: "acc-001",
        date: o.date ?? "2026-02-15",
        amount: o.amount ?? -100,
        merchant_name: o.merchant_name ?? "Adobe",
        description: o.description ?? "Creative Cloud",
        category: "expense_other" as const,
        tax_deductible: o.tax_deductible ?? true,
        tax_write_off_category: o.tax_write_off_category ?? "software_subscriptions",
        notes: "",
        is_manual: false,
        matched_rules: o.matched_rules ?? [
          {
            pattern: /adobe/i,
            label: "Creative Software",
            category: "software_subscriptions",
            is_vine_related: false,
            is_amazon_related: false,
            is_write_off: true,
            write_off_percentage: 100,
            confidence: "high",
          } as AutoFlagRule,
        ],
        needs_review: false,
        user_classification: o.user_classification ?? "business",
        synced_to_expenses: false,
        is_spontaneous: false,
        ...o,
      }));
      savePlaidTransactions(txns);
    }

    it("returns zero counts on empty data", () => {
      const summary = getPlaidDeductionSummary();
      expect(summary.total_transactions).toBe(0);
      expect(summary.business_count).toBe(0);
      expect(summary.total_business_spend).toBe(0);
    });

    it("counts business vs personal transactions correctly", () => {
      seedTransactions([
        { user_classification: "business", amount: -100 },
        { user_classification: "personal", amount: -50 },
        { user_classification: "pending", amount: -30 },
      ]);
      const summary = getPlaidDeductionSummary();
      expect(summary.total_transactions).toBe(3);
      expect(summary.business_count).toBe(1);
      expect(summary.personal_count).toBe(1);
      expect(summary.pending_review_count).toBe(1);
    });

    it("calculates total_business_spend from negative business transactions", () => {
      seedTransactions([
        { user_classification: "business", amount: -100 },
        { user_classification: "business", amount: -250 },
        { user_classification: "business", amount: 500 }, // income, not expense
      ]);
      const summary = getPlaidDeductionSummary();
      expect(summary.total_business_spend).toBeCloseTo(350);
    });

    it("calculates deductible amount respecting write_off_percentage", () => {
      seedTransactions([
        {
          user_classification: "business",
          amount: -200,
          tax_deductible: true,
          matched_rules: [
            {
              pattern: /prime/i,
              label: "Amazon Prime",
              category: "software_subscriptions",
              is_vine_related: false,
              is_amazon_related: true,
              is_write_off: true,
              write_off_percentage: 50,
              confidence: "medium",
            } as AutoFlagRule,
          ],
        },
      ]);
      const summary = getPlaidDeductionSummary();
      // 50% of $200 = $100 deductible
      expect(summary.total_deductible_amount).toBeCloseTo(100);
    });

    it("filters by taxYear when provided", () => {
      seedTransactions([
        { date: "2025-06-01", user_classification: "business", amount: -100 },
        { date: "2026-03-01", user_classification: "business", amount: -200 },
      ]);
      const summary2026 = getPlaidDeductionSummary(2026);
      expect(summary2026.total_transactions).toBe(1);
      expect(summary2026.total_business_spend).toBeCloseTo(200);
    });

    it("counts vine_income transactions", () => {
      seedTransactions([
        { user_classification: "vine_income", amount: 50 },
        { user_classification: "vine_income", amount: 75 },
      ]);
      const summary = getPlaidDeductionSummary();
      expect(summary.vine_income_count).toBe(2);
    });

    it("counts amazon transactions from matched_rules", () => {
      seedTransactions([
        {
          user_classification: "business",
          amount: -100,
          matched_rules: [
            {
              pattern: /amazon/i,
              label: "Amazon Seller",
              category: "advertising_marketing",
              is_vine_related: false,
              is_amazon_related: true,
              is_write_off: true,
              write_off_percentage: 100,
              confidence: "high",
            } as AutoFlagRule,
          ],
        },
        { user_classification: "personal", amount: -20, matched_rules: [] },
      ]);
      const summary = getPlaidDeductionSummary();
      expect(summary.amazon_transaction_count).toBe(1);
    });

    it("groups deductible transactions by_category", () => {
      seedTransactions([
        {
          user_classification: "business",
          amount: -100,
          tax_deductible: true,
          tax_write_off_category: "software_subscriptions",
          matched_rules: [
            {
              pattern: /adobe/i,
              label: "Creative Software",
              category: "software_subscriptions",
              is_vine_related: false,
              is_amazon_related: false,
              is_write_off: true,
              write_off_percentage: 100,
              confidence: "high",
            } as AutoFlagRule,
          ],
        },
      ]);
      const summary = getPlaidDeductionSummary();
      expect(summary.by_category.length).toBeGreaterThan(0);
      expect(summary.by_category[0].category).toBe("software_subscriptions");
      expect(summary.by_category[0].amount).toBeCloseTo(100);
      expect(summary.by_category[0].count).toBe(1);
    });
  });

  // ── DEMO_ACCOUNTS / DEMO_TRANSACTIONS ────────────────────

  describe("DEMO_ACCOUNTS / DEMO_TRANSACTIONS", () => {
    it("DEMO_ACCOUNTS is an empty array (cleared of placeholder data)", () => {
      expect(Array.isArray(DEMO_ACCOUNTS)).toBe(true);
      expect(DEMO_ACCOUNTS.length).toBe(0);
    });

    it("DEMO_TRANSACTIONS is an empty array (cleared of placeholder data)", () => {
      expect(Array.isArray(DEMO_TRANSACTIONS)).toBe(true);
      expect(DEMO_TRANSACTIONS.length).toBe(0);
    });
  });
});
