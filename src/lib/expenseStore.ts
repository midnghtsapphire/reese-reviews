// ============================================================
// EXPENSE & WRITE-OFF TRACKER
// FOSS alternative to Keeper Tax
// Tracks business expenses and auto-categorizes tax deductions
// Supabase-backed with localStorage fallback for offline.
// ============================================================

import {
  loadFromSupabase,
  deleteFromSupabase,
  bulkSaveToSupabase,
  loadFromLocalStorage,
  saveToLocalStorage,
  type SupabaseStoreOptions,
} from "@/lib/supabasePersistence";

const EXPENSE_STORAGE_KEY = "reese-expenses";

export type WriteOffCategory =
  | "home_office"
  | "equipment"
  | "software_subscriptions"
  | "advertising_marketing"
  | "professional_services"
  | "shipping_postage"
  | "office_supplies"
  | "travel_vehicle"
  | "meals_entertainment"
  | "education_training"
  | "phone_internet"
  | "other_business";

export type ExpenseSource = "manual" | "bank_import" | "amazon";

export interface Expense {
  id: string;
  date: string;
  merchant: string;
  description: string;
  amount: number;
  category: WriteOffCategory | "personal" | "uncategorized";
  is_write_off: boolean;
  write_off_percentage: number;
  source: ExpenseSource;
  receipt_url?: string;
  notes: string;
  tax_year: number;
  business_entity_id?: string;
}

export const WRITE_OFF_CATEGORIES: Record<WriteOffCategory, { label: string; description: string; typical_pct: number }> = {
  home_office: { label: "Home Office", description: "Portion of rent/mortgage for dedicated workspace", typical_pct: 100 },
  equipment: { label: "Equipment & Gear", description: "Cameras, lighting, computers, review setup", typical_pct: 100 },
  software_subscriptions: { label: "Software & Subscriptions", description: "Photo/video editing, website tools, streaming", typical_pct: 100 },
  advertising_marketing: { label: "Advertising & Marketing", description: "Amazon Sponsored Products, social ads, promotions", typical_pct: 100 },
  professional_services: { label: "Professional Services", description: "Accountant, attorney, contractors", typical_pct: 100 },
  shipping_postage: { label: "Shipping & Postage", description: "Return shipping, packaging for review items", typical_pct: 100 },
  office_supplies: { label: "Office Supplies", description: "Paper, ink, props, backdrop, organizational tools", typical_pct: 100 },
  travel_vehicle: { label: "Travel & Vehicle", description: "Business mileage, travel for review-related events", typical_pct: 50 },
  meals_entertainment: { label: "Meals & Entertainment", description: "Business meals with partners (50% deductible)", typical_pct: 50 },
  education_training: { label: "Education & Training", description: "Courses, books, conferences related to your business", typical_pct: 100 },
  phone_internet: { label: "Phone & Internet", description: "Business portion of phone/internet bills", typical_pct: 50 },
  other_business: { label: "Other Business Expense", description: "Miscellaneous ordinary and necessary business expenses", typical_pct: 100 },
};

const MERCHANT_RULES: Array<{ pattern: RegExp; category: WriteOffCategory; write_off: boolean }> = [
  { pattern: /amazon|amazon web services|aws/i, category: "advertising_marketing", write_off: true },
  { pattern: /adobe|canva|lightroom|photoshop|figma/i, category: "software_subscriptions", write_off: true },
  { pattern: /google|gsuite|workspace/i, category: "software_subscriptions", write_off: true },
  { pattern: /microsoft|office 365/i, category: "software_subscriptions", write_off: true },
  { pattern: /dropbox|notion|slack|zoom|loom/i, category: "software_subscriptions", write_off: true },
  { pattern: /ups|fedex|usps|stamps\.com|shipstation/i, category: "shipping_postage", write_off: true },
  { pattern: /staples|office depot|officemax/i, category: "office_supplies", write_off: true },
  { pattern: /best buy|b&h|adorama|bhphotovideo/i, category: "equipment", write_off: true },
  { pattern: /turbo tax|h&r block|taxact|cpa/i, category: "professional_services", write_off: true },
  { pattern: /comcast|xfinity|at&t|verizon|t-mobile|spectrum/i, category: "phone_internet", write_off: true },
  { pattern: /udemy|coursera|skillshare|linkedin learning/i, category: "education_training", write_off: true },
];

export function suggestCategory(
  merchant: string,
  _description: string
): { category: WriteOffCategory | "personal" | "uncategorized"; is_write_off: boolean } {
  const rule = MERCHANT_RULES.find((r) => r.pattern.test(merchant));
  if (rule) return { category: rule.category, is_write_off: rule.write_off };
  return { category: "uncategorized", is_write_off: false };
}

// ─── SUPABASE STORE OPTIONS ─────────────────────────────────

const expenseStoreOpts: SupabaseStoreOptions<Expense> = {
  table: "expenses",
  localStorageKey: EXPENSE_STORAGE_KEY,
  fromRow: (row) => ({
    id: row.id as string,
    date: row.date as string,
    merchant: row.merchant as string,
    description: (row.description as string) || "",
    amount: Number(row.amount) || 0,
    category: row.category as Expense["category"],
    is_write_off: Boolean(row.is_write_off),
    write_off_percentage: Number(row.write_off_percentage) || 0,
    source: (row.source as ExpenseSource) || "manual",
    receipt_url: row.receipt_url as string | undefined,
    notes: (row.notes as string) || "",
    tax_year: row.tax_year as number,
    business_entity_id: row.business_entity_id as string | undefined,
  }),
  toRow: (item, userId) => ({
    id: item.id,
    user_id: userId,
    date: item.date,
    merchant: item.merchant,
    description: item.description,
    amount: item.amount,
    category: item.category,
    is_write_off: item.is_write_off,
    write_off_percentage: item.write_off_percentage,
    source: item.source,
    receipt_url: item.receipt_url || null,
    notes: item.notes,
    tax_year: item.tax_year,
    business_entity_id: item.business_entity_id || null,
  }),
  getId: (item) => item.id,
};

// ─── CRUD OPERATIONS ────────────────────────────────────────

export const DEMO_EXPENSES: Expense[] = [];

export function getExpenses(tax_year?: number): Expense[] {
  try {
    const stored = localStorage.getItem(EXPENSE_STORAGE_KEY);
    const expenses: Expense[] = stored ? (JSON.parse(stored) as Expense[]) : [];
    if (tax_year !== undefined) return expenses.filter((e) => e.tax_year === tax_year);
    return expenses;
  } catch {
    return [];
  }
}

export async function getExpensesAsync(tax_year?: number): Promise<Expense[]> {
  const filters: Record<string, unknown> = {};
  if (tax_year !== undefined) filters.tax_year = tax_year;
  return loadFromSupabase(expenseStoreOpts, [], filters);
}

export function saveExpenses(expenses: Expense[]): void {
  saveToLocalStorage(EXPENSE_STORAGE_KEY, expenses);
  // Fire-and-forget Supabase sync
  bulkSaveToSupabase(expenseStoreOpts, expenses).catch(() => {});
}

export function addExpense(expense: Omit<Expense, "id">): Expense {
  const expenses = getExpenses();
  const newExpense: Expense = { ...expense, id: `exp-${Date.now()}` };
  saveExpenses([newExpense, ...expenses]);
  return newExpense;
}

export function updateExpense(id: string, updates: Partial<Expense>): void {
  const expenses = getExpenses();
  const idx = expenses.findIndex((e) => e.id === id);
  if (idx !== -1) {
    expenses[idx] = { ...expenses[idx], ...updates };
    saveExpenses(expenses);
  }
}

export function deleteExpense(id: string): void {
  const remaining = getExpenses().filter((e) => e.id !== id);
  saveExpenses(remaining);
  deleteFromSupabase(expenseStoreOpts, id, remaining).catch(() => {});
}

// ─── SUMMARY ────────────────────────────────────────────────

export function getWriteOffSummary(tax_year: number): {
  total_expenses: number;
  total_write_offs: number;
  write_off_amount: number;
  by_category: Array<{ category: string; label: string; amount: number; count: number }>;
} {
  const expenses = getExpenses(tax_year);
  const writeOffs = expenses.filter((e) => e.is_write_off);

  const byCategoryMap: Record<string, { label: string; amount: number; count: number }> = {};
  for (const exp of writeOffs) {
    const catKey = exp.category as WriteOffCategory;
    const label = catKey in WRITE_OFF_CATEGORIES ? WRITE_OFF_CATEGORIES[catKey].label : exp.category;
    if (!byCategoryMap[exp.category]) byCategoryMap[exp.category] = { label, amount: 0, count: 0 };
    byCategoryMap[exp.category].amount += (exp.amount * (exp.write_off_percentage / 100));
    byCategoryMap[exp.category].count += 1;
  }

  return {
    total_expenses: expenses.reduce((s, e) => s + e.amount, 0),
    total_write_offs: writeOffs.length,
    write_off_amount: writeOffs.reduce((s, e) => s + (e.amount * (e.write_off_percentage / 100)), 0),
    by_category: Object.entries(byCategoryMap)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.amount - a.amount),
  };
}

export function generateWriteOffCSV(tax_year: number): string {
  const expenses = getExpenses(tax_year).filter((e) => e.is_write_off);
  const header = "Date,Merchant,Description,Amount,Write-Off %,Deductible Amount,Category,Notes";
  const rows = expenses.map((e) =>
    [
      e.date,
      `"${e.merchant}"`,
      `"${e.description}"`,
      e.amount.toFixed(2),
      e.write_off_percentage,
      (e.amount * (e.write_off_percentage / 100)).toFixed(2),
      e.category,
      `"${e.notes}"`,
    ].join(",")
  );
  return [header, ...rows].join("\n");
}
