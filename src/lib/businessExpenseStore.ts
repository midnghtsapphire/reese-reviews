// ============================================================
// BUSINESS EXPENSE STORE
// Tracks recurring subscriptions, AI tools, hosting, storage,
// professional services, and other business expenses across
// all entities. "Like Plaid, but for your tools."
//
// Entities:
//   biz-reese-ventures  Reese Ventures LLC (Caresse)
//   biz-noconook        NoCo Nook & Rentals
//   biz-vine            Amazon Vine / Review Business (Audrey)
//   biz-fac             Freedom Angel Corps
//   biz-fac-caresse     FAC (Caresse's share)
// ============================================================

const STORE_KEY = "rr-business-expenses";

// ─── TYPES ──────────────────────────────────────────────────

export type ExpenseCategory =
  | "hosting"
  | "ai_tools"
  | "subscriptions"
  | "storage"
  | "supplies"
  | "professional_services"
  | "reviews_materials"
  | "domain_registration"
  | "payment_processing"
  | "legal"
  | "marketing"
  | "food_review"
  | "other";

export type BillingPeriod = "monthly" | "annual" | "quarterly" | "one_time";

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  hosting: "Hosting / Infrastructure",
  ai_tools: "AI Tools",
  subscriptions: "Subscriptions / SaaS",
  storage: "Storage",
  supplies: "Supplies",
  professional_services: "Professional Services",
  reviews_materials: "Review Materials",
  domain_registration: "Domain Registration",
  payment_processing: "Payment Processing",
  legal: "Legal",
  marketing: "Marketing",
  food_review: "Food / Review Meals",
  other: "Other",
};

export const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  hosting: "🖥️",
  ai_tools: "🤖",
  subscriptions: "📦",
  storage: "🗄️",
  supplies: "🛒",
  professional_services: "🤝",
  reviews_materials: "📝",
  domain_registration: "🌐",
  payment_processing: "💳",
  legal: "⚖️",
  marketing: "📣",
  food_review: "🍽️",
  other: "📋",
};

export interface BusinessExpense {
  id: string;
  name: string;
  description: string;
  category: ExpenseCategory;
  /** Which business entity this expense belongs to */
  businessEntityId: string;
  businessEntityName: string;
  /** Amount per billing cycle */
  amount: number;
  billingPeriod: BillingPeriod;
  /** ISO date string — next billing date (null for one-time or unknown) */
  nextBillingDate: string | null;
  /** ISO date string — when the subscription/service started */
  startDate: string;
  /** ISO date string — when it ended (null = still active) */
  endDate: string | null;
  isActive: boolean;
  /** URL to the service/tool (for quick access) */
  url: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/** Returns the annualized cost of an expense record. */
export function annualCost(expense: BusinessExpense): number {
  if (!expense.isActive) return 0;
  switch (expense.billingPeriod) {
    case "monthly": return expense.amount * 12;
    case "annual": return expense.amount;
    case "quarterly": return expense.amount * 4;
    case "one_time": return expense.amount;
    default: return expense.amount;
  }
}

/** Returns the monthly equivalent cost of an expense record. */
export function monthlyCost(expense: BusinessExpense): number {
  if (!expense.isActive) return 0;
  switch (expense.billingPeriod) {
    case "monthly": return expense.amount;
    case "annual": return expense.amount / 12;
    case "quarterly": return expense.amount / 3;
    case "one_time": return 0;
    default: return expense.amount;
  }
}

// ─── DEMO / SEED DATA ────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10);

const DEMO_EXPENSES: BusinessExpense[] = [
  // ── Hosting / Infrastructure ─────────────────────────────
  {
    id: "exp-digitalocean",
    name: "DigitalOcean",
    description: "Droplets, managed databases, App Platform for app hosting",
    category: "hosting",
    businessEntityId: "biz-fac",
    businessEntityName: "Freedom Angel Corps",
    amount: 48,
    billingPeriod: "monthly",
    nextBillingDate: null,
    startDate: TODAY,
    endDate: null,
    isActive: true,
    url: "https://cloud.digitalocean.com",
    notes: "Hosts all FAC apps. Upgrade billing in DigitalOcean portal.",
    createdAt: TODAY,
    updatedAt: TODAY,
  },
  {
    id: "exp-supabase",
    name: "Supabase",
    description: "Database, auth, edge functions for app backends",
    category: "hosting",
    businessEntityId: "biz-fac",
    businessEntityName: "Freedom Angel Corps",
    amount: 25,
    billingPeriod: "monthly",
    nextBillingDate: null,
    startDate: TODAY,
    endDate: null,
    isActive: true,
    url: "https://supabase.com/dashboard",
    notes: "Pro plan — postgres + realtime + edge functions",
    createdAt: TODAY,
    updatedAt: TODAY,
  },
  // ── AI Tools ─────────────────────────────────────────────
  {
    id: "exp-openrouter",
    name: "OpenRouter",
    description: "API gateway to multiple LLM providers (Claude, GPT, Mistral, etc.)",
    category: "ai_tools",
    businessEntityId: "biz-vine",
    businessEntityName: "Amazon Vine / Review Business",
    amount: 0,
    billingPeriod: "monthly",
    nextBillingDate: null,
    startDate: TODAY,
    endDate: null,
    isActive: true,
    url: "https://openrouter.ai",
    notes: "Pay-as-you-go. Track monthly API spend here.",
    createdAt: TODAY,
    updatedAt: TODAY,
  },
  {
    id: "exp-openai",
    name: "OpenAI API",
    description: "GPT-4o, DALL-E, Whisper for review generation and media",
    category: "ai_tools",
    businessEntityId: "biz-vine",
    businessEntityName: "Amazon Vine / Review Business",
    amount: 0,
    billingPeriod: "monthly",
    nextBillingDate: null,
    startDate: TODAY,
    endDate: null,
    isActive: true,
    url: "https://platform.openai.com",
    notes: "Pay-as-you-go. Update monthly amount from usage dashboard.",
    createdAt: TODAY,
    updatedAt: TODAY,
  },
  {
    id: "exp-heygen",
    name: "HeyGen",
    description: "Avatar video generation for professional review content",
    category: "ai_tools",
    businessEntityId: "biz-reese-ventures",
    businessEntityName: "Reese Ventures LLC",
    amount: 29,
    billingPeriod: "monthly",
    nextBillingDate: null,
    startDate: TODAY,
    endDate: null,
    isActive: true,
    url: "https://app.heygen.com",
    notes: "Caresse avatar for ReeseReviews.com and TruthSlayer professional content.",
    createdAt: TODAY,
    updatedAt: TODAY,
  },
  {
    id: "exp-elevenlabs",
    name: "ElevenLabs",
    description: "AI voice synthesis for review voiceovers",
    category: "ai_tools",
    businessEntityId: "biz-reese-ventures",
    businessEntityName: "Reese Ventures LLC",
    amount: 11,
    billingPeriod: "monthly",
    nextBillingDate: null,
    startDate: TODAY,
    endDate: null,
    isActive: true,
    url: "https://elevenlabs.io",
    notes: "Voice cloning for Caresse avatar videos.",
    createdAt: TODAY,
    updatedAt: TODAY,
  },
  // ── Subscriptions / SaaS ─────────────────────────────────
  {
    id: "exp-github",
    name: "GitHub",
    description: "Source code hosting and GitHub Copilot",
    category: "subscriptions",
    businessEntityId: "biz-fac",
    businessEntityName: "Freedom Angel Corps",
    amount: 21,
    billingPeriod: "monthly",
    nextBillingDate: null,
    startDate: TODAY,
    endDate: null,
    isActive: true,
    url: "https://github.com",
    notes: "Team plan + Copilot. All app code hosted here.",
    createdAt: TODAY,
    updatedAt: TODAY,
  },
  {
    id: "exp-plaid",
    name: "Plaid",
    description: "Bank account connection API for financial integration",
    category: "subscriptions",
    businessEntityId: "biz-fac",
    businessEntityName: "Freedom Angel Corps",
    amount: 0,
    billingPeriod: "monthly",
    nextBillingDate: null,
    startDate: TODAY,
    endDate: null,
    isActive: false,
    url: "https://plaid.com",
    notes: "Pay-per-connection. Enable when bank integrations are live.",
    createdAt: TODAY,
    updatedAt: TODAY,
  },
  // ── Domain Registration ───────────────────────────────────
  {
    id: "exp-domain-reesereviews",
    name: "ReeseReviews.com domain",
    description: "Annual domain registration",
    category: "domain_registration",
    businessEntityId: "biz-reese-ventures",
    businessEntityName: "Reese Ventures LLC",
    amount: 12,
    billingPeriod: "annual",
    nextBillingDate: null,
    startDate: TODAY,
    endDate: null,
    isActive: true,
    url: "https://namecheap.com",
    notes: "DBA of Reese Ventures LLC",
    createdAt: TODAY,
    updatedAt: TODAY,
  },
  {
    id: "exp-domain-truthslayer",
    name: "TruthSlayer.com domain",
    description: "Annual domain registration for professional review site",
    category: "domain_registration",
    businessEntityId: "biz-reese-ventures",
    businessEntityName: "Reese Ventures LLC",
    amount: 12,
    billingPeriod: "annual",
    nextBillingDate: null,
    startDate: TODAY,
    endDate: null,
    isActive: true,
    url: "https://namecheap.com",
    notes: "Professional review site — Caresse's full reviews",
    createdAt: TODAY,
    updatedAt: TODAY,
  },
  // ── Storage ───────────────────────────────────────────────
  {
    id: "exp-storage-unit",
    name: "Storage Unit",
    description: "Physical storage for Vine products before resale/donation",
    category: "storage",
    businessEntityId: "biz-noconook",
    businessEntityName: "NoCo Nook & Rentals",
    amount: 0,
    billingPeriod: "monthly",
    nextBillingDate: null,
    startDate: TODAY,
    endDate: null,
    isActive: false,
    url: "",
    notes: "Add monthly fee when storage unit is rented.",
    createdAt: TODAY,
    updatedAt: TODAY,
  },
];

// ─── STORAGE ────────────────────────────────────────────────

function load(): BusinessExpense[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      save(DEMO_EXPENSES);
      return DEMO_EXPENSES;
    }
    return JSON.parse(raw) as BusinessExpense[];
  } catch {
    return DEMO_EXPENSES;
  }
}

function save(items: BusinessExpense[]): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(items));
}

function genId(): string {
  return `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── PUBLIC API ─────────────────────────────────────────────

export function getBusinessExpenses(): BusinessExpense[] {
  return load();
}

export function getActiveExpenses(): BusinessExpense[] {
  return load().filter((e) => e.isActive);
}

export function getExpensesByEntity(entityId: string): BusinessExpense[] {
  return load().filter((e) => e.businessEntityId === entityId);
}

export function getExpensesByCategory(cat: ExpenseCategory): BusinessExpense[] {
  return load().filter((e) => e.category === cat);
}

export function addBusinessExpense(
  params: Omit<BusinessExpense, "id" | "createdAt" | "updatedAt">
): BusinessExpense {
  const now = new Date().toISOString();
  const expense: BusinessExpense = {
    ...params,
    id: genId(),
    createdAt: now,
    updatedAt: now,
  };
  const all = load();
  all.push(expense);
  save(all);
  return expense;
}

export function updateBusinessExpense(
  id: string,
  patch: Partial<BusinessExpense>
): BusinessExpense | null {
  const all = load();
  const idx = all.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  save(all);
  return all[idx];
}

export function deleteBusinessExpense(id: string): boolean {
  const all = load();
  const next = all.filter((e) => e.id !== id);
  if (next.length === all.length) return false;
  save(next);
  return true;
}

export function toggleExpenseActive(id: string): BusinessExpense | null {
  const all = load();
  const idx = all.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  all[idx] = {
    ...all[idx],
    isActive: !all[idx].isActive,
    updatedAt: new Date().toISOString(),
  };
  save(all);
  return all[idx];
}

// ─── SUMMARY ────────────────────────────────────────────────

export interface ExpenseSummary {
  monthlyTotal: number;
  annualTotal: number;
  byEntity: Record<string, { monthly: number; annual: number; count: number }>;
  byCategory: Record<ExpenseCategory, { monthly: number; annual: number; count: number }>;
  activeCount: number;
  inactiveCount: number;
}

export function getExpenseSummary(): ExpenseSummary {
  const all = getActiveExpenses();
  let monthlyTotal = 0;
  let annualTotal = 0;
  const byEntity: ExpenseSummary["byEntity"] = {};
  const byCategory: ExpenseSummary["byCategory"] = {} as ExpenseSummary["byCategory"];
  const allRaw = load();

  for (const e of all) {
    const mc = monthlyCost(e);
    const ac = annualCost(e);
    monthlyTotal += mc;
    annualTotal += ac;

    if (!byEntity[e.businessEntityId]) {
      byEntity[e.businessEntityId] = { monthly: 0, annual: 0, count: 0 };
    }
    byEntity[e.businessEntityId].monthly += mc;
    byEntity[e.businessEntityId].annual += ac;
    byEntity[e.businessEntityId].count++;

    if (!byCategory[e.category]) {
      byCategory[e.category] = { monthly: 0, annual: 0, count: 0 };
    }
    byCategory[e.category].monthly += mc;
    byCategory[e.category].annual += ac;
    byCategory[e.category].count++;
  }

  return {
    monthlyTotal,
    annualTotal,
    byEntity,
    byCategory,
    activeCount: all.length,
    inactiveCount: allRaw.length - all.length,
  };
}

// ─── ENTITY NAME MAP (for display) ───────────────────────────

export const ENTITY_NAMES: Record<string, string> = {
  "biz-reese-ventures": "Reese Ventures LLC",
  "biz-noconook": "NoCo Nook & Rentals",
  "biz-vine": "Amazon Vine / Review Biz",
  "biz-fac": "Freedom Angel Corps",
  "biz-fac-caresse": "FAC (Caresse)",
  "biz-rmr": "Rocky Mountain Rentals",
};
