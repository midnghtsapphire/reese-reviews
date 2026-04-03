// ============================================================
// PLAID BANK INTEGRATION CLIENT
// Reese Reviews ERP — Bank Account Linking & Transaction Import
//
// Architecture:
//   • Read-only access (no payment initiation)
//   • Scans back to January 1 of the current tax year
//   • Auto-flags Amazon / Vine-related transactions
//   • Auto-categorizes potential business write-offs
//   • Syncs flagged transactions into the ExpenseTracker store
//
// NOTE: In production, Plaid API calls must go through a
// server-side proxy (never expose secret keys in the browser).
// This client handles the frontend Link flow and stores
// account/transaction data locally for demo/dev mode.
// ============================================================

import type { PlaidAccount, BankTransaction, TransactionCategory } from "./businessTypes";
import { addExpense, suggestCategory } from "./expenseStore";
import type { WriteOffCategory } from "./expenseStore";

// ─── STORAGE KEYS ────────────────────────────────────────────

const SK_PLAID_CONFIG    = "reese-plaid-config";
const SK_PLAID_ACCOUNTS  = "reese-plaid-accounts";
const SK_PLAID_TXNS      = "reese-plaid-transactions";
const SK_PLAID_LINK_TOKEN = "reese-plaid-link-token";

// ─── CONFIG ──────────────────────────────────────────────────

export interface PlaidConfig {
  /** Plaid public/client key (safe to expose in browser) */
  client_id: string;
  /** "sandbox" | "development" | "production" */
  environment: "sandbox" | "development" | "production";
  /** Access token returned after Link flow (store server-side in prod) */
  access_token?: string;
  /** Item ID from Plaid */
  item_id?: string;
  connected: boolean;
  last_synced?: string;
  /** Tax year to scan from January 1 */
  scan_year: number;
  /** Whether to auto-push flagged transactions to ExpenseTracker */
  auto_sync_expenses: boolean;
}

export function getPlaidConfig(): PlaidConfig | null {
  try {
    const raw = localStorage.getItem(SK_PLAID_CONFIG);
    return raw ? (JSON.parse(raw) as PlaidConfig) : null;
  } catch {
    return null;
  }
}

export function savePlaidConfig(config: PlaidConfig): void {
  localStorage.setItem(SK_PLAID_CONFIG, JSON.stringify(config));
}

export function clearPlaidConfig(): void {
  localStorage.removeItem(SK_PLAID_CONFIG);
  localStorage.removeItem(SK_PLAID_ACCOUNTS);
  localStorage.removeItem(SK_PLAID_TXNS);
  localStorage.removeItem(SK_PLAID_LINK_TOKEN);
}

// ─── AMAZON / VINE AUTO-FLAG RULES ───────────────────────────
//
// These patterns are checked against merchant_name and description
// to auto-flag Amazon-related and Vine-related transactions.

export interface AutoFlagRule {
  pattern: RegExp;
  label: string;
  category: WriteOffCategory | "personal" | "uncategorized";
  is_vine_related: boolean;
  is_amazon_related: boolean;
  is_write_off: boolean;
  write_off_percentage: number;
  confidence: "high" | "medium" | "low";
}

export const AMAZON_VINE_FLAG_RULES: AutoFlagRule[] = [
  // ── Amazon Vine / ETV-related ────────────────────────────
  {
    pattern: /amazon vine|vine program|vine voice/i,
    label: "Amazon Vine Program",
    category: "advertising_marketing",
    is_vine_related: true,
    is_amazon_related: true,
    is_write_off: false, // Vine items are income (ETV), not expenses
    write_off_percentage: 0,
    confidence: "high",
  },
  // ── Amazon Seller / Advertising ─────────────────────────
  {
    pattern: /amazon seller|amazon marketplace|amazon services|amazon\.com services/i,
    label: "Amazon Seller Services",
    category: "advertising_marketing",
    is_vine_related: false,
    is_amazon_related: true,
    is_write_off: true,
    write_off_percentage: 100,
    confidence: "high",
  },
  {
    pattern: /amazon advertising|amazon sponsored|amzn ads/i,
    label: "Amazon Advertising",
    category: "advertising_marketing",
    is_vine_related: false,
    is_amazon_related: true,
    is_write_off: true,
    write_off_percentage: 100,
    confidence: "high",
  },
  {
    pattern: /amazon web services|aws\.amazon/i,
    label: "Amazon Web Services",
    category: "software_subscriptions",
    is_vine_related: false,
    is_amazon_related: true,
    is_write_off: true,
    write_off_percentage: 100,
    confidence: "high",
  },
  {
    pattern: /amazon prime/i,
    label: "Amazon Prime",
    category: "software_subscriptions",
    is_vine_related: false,
    is_amazon_related: true,
    is_write_off: true,
    write_off_percentage: 50, // Business portion
    confidence: "medium",
  },
  // ── General Amazon purchases ─────────────────────────────
  {
    pattern: /^amazon(?!\.com\/gp\/video|prime video)/i,
    label: "Amazon Purchase",
    category: "uncategorized",
    is_vine_related: false,
    is_amazon_related: true,
    is_write_off: false, // Needs manual review
    write_off_percentage: 0,
    confidence: "medium",
  },
  // ── Review / Content Creation supplies ──────────────────
  {
    pattern: /best buy|b&h photo|adorama|bhphotovideo/i,
    label: "Photography / Tech Equipment",
    category: "equipment",
    is_vine_related: false,
    is_amazon_related: false,
    is_write_off: true,
    write_off_percentage: 100,
    confidence: "high",
  },
  {
    pattern: /adobe|lightroom|photoshop|canva|figma/i,
    label: "Creative Software",
    category: "software_subscriptions",
    is_vine_related: false,
    is_amazon_related: false,
    is_write_off: true,
    write_off_percentage: 100,
    confidence: "high",
  },
  {
    pattern: /google workspace|gsuite|google one/i,
    label: "Google Workspace",
    category: "software_subscriptions",
    is_vine_related: false,
    is_amazon_related: false,
    is_write_off: true,
    write_off_percentage: 100,
    confidence: "high",
  },
  {
    pattern: /microsoft 365|office 365|microsoft store/i,
    label: "Microsoft 365",
    category: "software_subscriptions",
    is_vine_related: false,
    is_amazon_related: false,
    is_write_off: true,
    write_off_percentage: 100,
    confidence: "high",
  },
  {
    pattern: /dropbox|notion|slack|zoom|loom|riverside/i,
    label: "Productivity Tools",
    category: "software_subscriptions",
    is_vine_related: false,
    is_amazon_related: false,
    is_write_off: true,
    write_off_percentage: 100,
    confidence: "high",
  },
  {
    pattern: /ups|fedex|usps|stamps\.com|shipstation|pirateship/i,
    label: "Shipping & Postage",
    category: "shipping_postage",
    is_vine_related: false,
    is_amazon_related: false,
    is_write_off: true,
    write_off_percentage: 100,
    confidence: "high",
  },
  {
    pattern: /staples|office depot|officemax/i,
    label: "Office Supplies",
    category: "office_supplies",
    is_vine_related: false,
    is_amazon_related: false,
    is_write_off: true,
    write_off_percentage: 100,
    confidence: "high",
  },
  {
    pattern: /turbotax|h&r block|taxact|taxslayer|hrblock/i,
    label: "Tax Preparation",
    category: "professional_services",
    is_vine_related: false,
    is_amazon_related: false,
    is_write_off: true,
    write_off_percentage: 100,
    confidence: "high",
  },
  {
    pattern: /comcast|xfinity|at&t|verizon|t-mobile|spectrum|cox/i,
    label: "Internet / Phone",
    category: "phone_internet",
    is_vine_related: false,
    is_amazon_related: false,
    is_write_off: true,
    write_off_percentage: 50,
    confidence: "high",
  },
  {
    pattern: /udemy|coursera|skillshare|linkedin learning|masterclass/i,
    label: "Education & Training",
    category: "education_training",
    is_vine_related: false,
    is_amazon_related: false,
    is_write_off: true,
    write_off_percentage: 100,
    confidence: "high",
  },
  // ── Spontaneous spending flags ───────────────────────────
  {
    pattern: /doordash|uber eats|grubhub|instacart|postmates/i,
    label: "Food Delivery (Spontaneous)",
    category: "meals_entertainment",
    is_vine_related: false,
    is_amazon_related: false,
    is_write_off: false,
    write_off_percentage: 0,
    confidence: "medium",
  },
  {
    pattern: /netflix|hulu|disney\+|hbo max|max|peacock|paramount\+/i,
    label: "Streaming (Personal)",
    category: "personal",
    is_vine_related: false,
    is_amazon_related: false,
    is_write_off: false,
    write_off_percentage: 0,
    confidence: "high",
  },
];

// ─── TRANSACTION CLASSIFICATION ──────────────────────────────

export interface ClassifiedTransaction extends BankTransaction {
  /** Auto-detected flag rules that matched */
  matched_rules: AutoFlagRule[];
  /** Whether this transaction needs user review */
  needs_review: boolean;
  /** User's classification decision */
  user_classification: "business" | "personal" | "vine_income" | "pending";
  /** Whether already pushed to ExpenseTracker */
  synced_to_expenses: boolean;
  /** Receipt file URL if attached */
  receipt_url?: string;
  /** Spontaneous spending flag */
  is_spontaneous: boolean;
  /** Vine ETV item this transaction might relate to */
  related_vine_asin?: string;
}

export function classifyTransaction(
  txn: BankTransaction
): ClassifiedTransaction {
  const matchedRules = AMAZON_VINE_FLAG_RULES.filter(
    (rule) =>
      rule.pattern.test(txn.merchant_name) ||
      rule.pattern.test(txn.description)
  );

  const isVineRelated = matchedRules.some((r) => r.is_vine_related);
  const isAmazonRelated = matchedRules.some((r) => r.is_amazon_related);
  const isSpontaneous = matchedRules.some(
    (r) =>
      r.label.includes("Spontaneous") ||
      r.label.includes("Food Delivery") ||
      r.label.includes("Streaming")
  );

  // Determine best write-off category from matched rules
  const bestRule = matchedRules.find((r) => r.is_write_off) ?? null;
  const suggestedCat = suggestCategory(txn.merchant_name, txn.description);

  const category: TransactionCategory = isAmazonRelated
    ? "expense_other"
    : txn.amount < 0
    ? "expense_other"
    : "income_other";

  const taxDeductible =
    bestRule?.is_write_off ?? suggestedCat.is_write_off ?? false;

  return {
    ...txn,
    category,
    tax_deductible: taxDeductible,
    tax_write_off_category:
      bestRule?.category ?? suggestedCat.category ?? "uncategorized",
    matched_rules: matchedRules,
    needs_review: matchedRules.length === 0 || !taxDeductible,
    user_classification: isVineRelated
      ? "vine_income"
      : bestRule?.is_write_off
      ? "business"
      : "pending",
    synced_to_expenses: false,
    is_spontaneous: isSpontaneous,
  };
}

// ─── TRANSACTION STORAGE ─────────────────────────────────────

export function getPlaidTransactions(): ClassifiedTransaction[] {
  try {
    const raw = localStorage.getItem(SK_PLAID_TXNS);
    return raw ? (JSON.parse(raw) as ClassifiedTransaction[]) : [];
  } catch {
    return [];
  }
}

export function savePlaidTransactions(txns: ClassifiedTransaction[]): void {
  localStorage.setItem(SK_PLAID_TXNS, JSON.stringify(txns));
}

export function updatePlaidTransaction(
  id: string,
  updates: Partial<ClassifiedTransaction>
): void {
  const txns = getPlaidTransactions();
  const idx = txns.findIndex((t) => t.id === id);
  if (idx !== -1) {
    txns[idx] = { ...txns[idx], ...updates };
    savePlaidTransactions(txns);
  }
}

// ─── ACCOUNT STORAGE ─────────────────────────────────────────

export function getPlaidAccounts(): PlaidAccount[] {
  try {
    const raw = localStorage.getItem(SK_PLAID_ACCOUNTS);
    return raw ? (JSON.parse(raw) as PlaidAccount[]) : [];
  } catch {
    return [];
  }
}

export function savePlaidAccounts(accounts: PlaidAccount[]): void {
  localStorage.setItem(SK_PLAID_ACCOUNTS, JSON.stringify(accounts));
}

// ─── SYNC TO EXPENSE TRACKER ─────────────────────────────────

export function syncTransactionToExpenses(txn: ClassifiedTransaction): void {
  if (txn.synced_to_expenses) return;
  if (txn.user_classification !== "business") return;
  if (txn.amount >= 0) return; // Only expenses (negative amounts)

  const cat = txn.tax_write_off_category as WriteOffCategory | "personal" | "uncategorized";
  const writeOffCat: WriteOffCategory =
    cat in
    {
      home_office: 1,
      equipment: 1,
      software_subscriptions: 1,
      advertising_marketing: 1,
      professional_services: 1,
      shipping_postage: 1,
      office_supplies: 1,
      travel_vehicle: 1,
      meals_entertainment: 1,
      education_training: 1,
      phone_internet: 1,
      other_business: 1,
    }
      ? (cat as WriteOffCategory)
      : "other_business";

  addExpense({
    date: txn.date,
    merchant: txn.merchant_name,
    description: txn.description,
    amount: Math.abs(txn.amount),
    category: writeOffCat,
    is_write_off: txn.tax_deductible,
    write_off_percentage: txn.matched_rules.find((r) => r.is_write_off)?.write_off_percentage ?? 100,
    source: "bank_import",
    receipt_url: txn.receipt_url,
    notes: `Auto-imported from Plaid · ${txn.plaid_transaction_id}`,
    tax_year: new Date(txn.date).getFullYear(),
  });

  updatePlaidTransaction(txn.id, { synced_to_expenses: true });
}

export function syncAllBusinessTransactions(): number {
  const txns = getPlaidTransactions().filter(
    (t) => t.user_classification === "business" && !t.synced_to_expenses
  );
  txns.forEach(syncTransactionToExpenses);
  return txns.length;
}

// ─── DEDUCTION SUMMARY ───────────────────────────────────────

export interface PlaidDeductionSummary {
  total_transactions: number;
  business_count: number;
  personal_count: number;
  pending_review_count: number;
  vine_income_count: number;
  total_business_spend: number;
  total_deductible_amount: number;
  amazon_transaction_count: number;
  spontaneous_spend_total: number;
  by_category: Array<{
    category: string;
    label: string;
    amount: number;
    count: number;
  }>;
}

export function getPlaidDeductionSummary(taxYear?: number): PlaidDeductionSummary {
  let txns = getPlaidTransactions();
  if (taxYear) {
    txns = txns.filter((t) => new Date(t.date).getFullYear() === taxYear);
  }

  const business = txns.filter((t) => t.user_classification === "business");
  const personal = txns.filter((t) => t.user_classification === "personal");
  const pending = txns.filter((t) => t.user_classification === "pending");
  const vineIncome = txns.filter((t) => t.user_classification === "vine_income");
  const amazon = txns.filter((t) =>
    t.matched_rules.some((r) => r.is_amazon_related)
  );
  const spontaneous = txns.filter((t) => t.is_spontaneous);

  const totalBusinessSpend = business
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const totalDeductible = business
    .filter((t) => t.amount < 0 && t.tax_deductible)
    .reduce((s, t) => {
      const pct =
        t.matched_rules.find((r) => r.is_write_off)?.write_off_percentage ?? 100;
      return s + Math.abs(t.amount) * (pct / 100);
    }, 0);

  const spontaneousTotal = spontaneous
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  // Group by write-off category
  const catMap: Record<string, { label: string; amount: number; count: number }> = {};
  for (const t of business.filter((t) => t.amount < 0 && t.tax_deductible)) {
    const cat = t.tax_write_off_category ?? "other_business";
    const rule = t.matched_rules.find((r) => r.is_write_off);
    const label = rule?.label ?? cat;
    if (!catMap[cat]) catMap[cat] = { label, amount: 0, count: 0 };
    catMap[cat].amount += Math.abs(t.amount);
    catMap[cat].count += 1;
  }

  return {
    total_transactions: txns.length,
    business_count: business.length,
    personal_count: personal.length,
    pending_review_count: pending.length,
    vine_income_count: vineIncome.length,
    total_business_spend: totalBusinessSpend,
    total_deductible_amount: totalDeductible,
    amazon_transaction_count: amazon.length,
    spontaneous_spend_total: spontaneousTotal,
    by_category: Object.entries(catMap)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.amount - a.amount),
  };
}

// ─── DEMO DATA ───────────────────────────────────────────────

export const DEMO_ACCOUNTS: PlaidAccount[] = [];

function makeDemoTxn(
  id: string,
  date: string,
  merchant: string,
  description: string,
  amount: number,
  accountId = "acct-001"
): ClassifiedTransaction {
  const base: BankTransaction = {
    id,
    plaid_transaction_id: `plaid_${id}`,
    account_id: accountId,
    date,
    amount,
    merchant_name: merchant,
    description,
    category: amount < 0 ? "expense_other" : "income_other",
    tax_deductible: false,
    notes: "",
    is_manual: false,
  };
  return classifyTransaction(base);
}

export const DEMO_TRANSACTIONS: ClassifiedTransaction[] = [];

// ─── LINK TOKEN HELPERS ──────────────────────────────────────
// In production, the link token is fetched from your server.
// For demo/sandbox mode, we simulate the flow.

export interface PlaidLinkTokenResponse {
  link_token: string;
  expiration: string;
  request_id: string;
}

/**
 * In production: call your backend `/api/plaid/create-link-token`
 * For sandbox demo: returns a mock token
 */
export async function createLinkToken(
  userId: string = "reese-user-001"
): Promise<PlaidLinkTokenResponse> {
  // Production: replace with actual API call
  // const res = await fetch("/api/plaid/create-link-token", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ user_id: userId }),
  // });
  // return res.json();

  // Demo mode: simulate token
  return {
    link_token: `link-sandbox-demo-${Date.now()}`,
    expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    request_id: `req-${Date.now()}`,
  };
}

/**
 * In production: exchange public token for access token on server
 * For demo: simulate successful exchange
 */
export async function exchangePublicToken(
  publicToken: string
): Promise<{ access_token: string; item_id: string }> {
  // Production:
  // const res = await fetch("/api/plaid/exchange-token", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ public_token: publicToken }),
  // });
  // return res.json();

  return {
    access_token: `access-sandbox-demo-${Date.now()}`,
    item_id: `item-sandbox-demo-${Date.now()}`,
  };
}

/**
 * Simulate importing transactions for the current tax year.
 * In production: call your backend `/api/plaid/transactions`
 */
export async function importTransactions(
  _accessToken: string,
  scanYear: number = new Date().getFullYear()
): Promise<ClassifiedTransaction[]> {
  // Production:
  // const startDate = `${scanYear}-01-01`;
  // const endDate = new Date().toISOString().slice(0, 10);
  // const res = await fetch("/api/plaid/transactions", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ access_token: _accessToken, start_date: startDate, end_date: endDate }),
  // });
  // const raw = await res.json();
  // return raw.transactions.map(classifyTransaction);

  // Demo: return classified demo transactions for the given year
  const filtered = DEMO_TRANSACTIONS.filter(
    (t) => new Date(t.date).getFullYear() === scanYear
  );
  savePlaidTransactions(filtered);
  return filtered;
}
