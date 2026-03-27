// ============================================================
// Portable Tax Module — designed for reuse across ReeseReviews,
// TruthSlayer, and other apps.
//
// TAX CENTER STORE
// Self-contained Zustand-style store with localStorage persistence.
// No hard dependencies on any host app — import this file and go.
//
// Covers:
//   • Multi-person tax profiles (unlimited persons)
//   • Multi-income-source tracking (W-2, 1099, SSA, rental, etc.)
//   • Uploaded tax document metadata
//   • Business write-offs & deductions with receipt tracking
//   • Auto-determination of required IRS forms
//   • Quarterly estimated tax calculations
// ============================================================

// ─── BRAND COLORS (host app can override via CSS vars) ───────
export const TAX_BRAND = {
  amber: "#FF6B2B",   // Hailstorm Amber
  gold: "#FFB347",    // Revvel Gold
  crimson: "#E63946", // Claw Crimson
  volt: "#FFD93D",    // Storm Volt
} as const;

// ─── STORAGE KEYS ────────────────────────────────────────────
const SK_PERSONS    = "taxmod-persons";
const SK_INCOME     = "taxmod-income-sources";
const SK_DOCUMENTS  = "taxmod-documents";
const SK_WRITEOFFS  = "taxmod-writeoffs";
const SK_RECEIPTS   = "taxmod-receipts";
const SK_QUARTERLY  = "taxmod-quarterly-estimates";

// ─── ENUMS & UNION TYPES ─────────────────────────────────────

export type IncomeType =
  | "w2"            // Employee wages
  | "1099_nec"      // Non-employee compensation (gig, freelance)
  | "1099_misc"     // Miscellaneous income
  | "1099_k"        // Payment card / third-party network
  | "1099_div"      // Dividends
  | "1099_int"      // Interest income
  | "ssa_1099"      // Social Security / disability
  | "rental"        // Rental property income
  | "self_employ"   // General self-employment
  | "other";

export type DocumentType =
  | "w2"
  | "1099_nec"
  | "1099_misc"
  | "1099_k"
  | "1099_div"
  | "1099_int"
  | "ssa_1099"
  | "receipt"
  | "other";

export type IrsForm =
  | "1040"
  | "schedule_c"
  | "schedule_se"
  | "schedule_e"
  | "schedule_d"
  | "form_8829"
  | "form_8283"
  | "form_4562";

export type WriteOffCategory =
  | "home_office"
  | "supplies"
  | "internet"
  | "phone"
  | "shipping"
  | "product_costs"
  | "vehicle_mileage"
  | "advertising"
  | "professional_services"
  | "equipment"
  | "education"
  | "meals_entertainment"
  | "other";

export type FilingStatus =
  | "single"
  | "married_filing_jointly"
  | "married_filing_separately"
  | "head_of_household"
  | "qualifying_widow";

// ─── CORE INTERFACES ─────────────────────────────────────────

/** A tax filer profile — one per person on the return */
export interface TaxPerson {
  id: string;
  /** Display name, e.g. "Revvel / Mom" */
  name: string;
  /** Short slug used in UI, e.g. "revvel" | "reese" */
  slug: string;
  role: "primary" | "spouse" | "dependent";
  ssn_last4?: string;
  filing_status?: FilingStatus;
  /** Pre-populated business entities for this person */
  businesses: BusinessEntity[];
  /** Notes visible to preparer */
  notes: string;
  created_at: string;
  updated_at: string;
}

/** A business or gig entity associated with a person */
export interface BusinessEntity {
  id: string;
  name: string;
  /** EIN or SSN-based */
  ein?: string;
  type: "sole_prop" | "llc" | "s_corp" | "partnership" | "rental" | "gig";
  /** Which IRS schedule this entity files on */
  schedule: "schedule_c" | "schedule_e" | "schedule_f" | "none";
  home_office_eligible: boolean;
  notes: string;
}

/** A single income source for a person in a given tax year */
export interface IncomeSource {
  id: string;
  person_id: string;
  tax_year: number;
  /** Human-readable label, e.g. "Home Depot W-2" */
  label: string;
  /** Payer name, e.g. "Home Depot USA Inc." */
  payer_name: string;
  payer_ein?: string;
  income_type: IncomeType;
  /** Gross income amount */
  gross_amount: number;
  /** Federal tax withheld (W-2 box 2, etc.) */
  federal_withheld: number;
  /** State tax withheld */
  state_withheld: number;
  /** For W-2: Social Security wages; for 1099: self-employment income */
  ss_wages?: number;
  /** Medicare wages */
  medicare_wages?: number;
  /** Linked uploaded document ID */
  document_id?: string;
  /** Business entity this income belongs to (for Schedule C/E) */
  business_entity_id?: string;
  /** Whether this source has been reconciled against a physical document */
  reconciled: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

/** An uploaded or scanned tax document */
export interface TaxDocument {
  id: string;
  person_id: string;
  tax_year: number;
  document_type: DocumentType;
  /** Original file name */
  file_name: string;
  /** Data URL or object URL for preview */
  file_data_url?: string;
  file_size_bytes: number;
  mime_type: string;
  /** OCR / user-confirmed extracted fields */
  extracted_fields: Record<string, string>;
  /** Whether user has confirmed the extracted data */
  confirmed: boolean;
  /** Linked income source ID after confirmation */
  linked_income_source_id?: string;
  uploaded_at: string;
  notes: string;
}

/** A business expense / write-off */
export interface WriteOff {
  id: string;
  person_id: string;
  /** Business entity this expense belongs to */
  business_entity_id?: string;
  tax_year: number;
  date: string;
  description: string;
  vendor: string;
  category: WriteOffCategory;
  amount: number;
  /** Percentage deductible (e.g. 50 for meals, 100 for supplies) */
  deductible_pct: number;
  /** Computed: amount * deductible_pct / 100 */
  deductible_amount: number;
  /** Linked receipt document ID */
  receipt_document_id?: string;
  /** Mileage-specific fields */
  mileage_miles?: number;
  mileage_rate?: number;
  notes: string;
  created_at: string;
}

/** Quarterly estimated tax payment record */
export interface QuarterlyEstimate {
  id: string;
  person_id: string;
  tax_year: number;
  quarter: 1 | 2 | 3 | 4;
  due_date: string;
  estimated_income: number;
  estimated_tax_owed: number;
  amount_paid: number;
  paid_date?: string;
  paid: boolean;
  notes: string;
}

// ─── WRITE-OFF CATEGORY METADATA ─────────────────────────────

export const WRITEOFF_CATEGORY_META: Record<WriteOffCategory, {
  label: string;
  description: string;
  default_pct: number;
  icon: string;
}> = {
  home_office:           { label: "Home Office",             description: "Dedicated workspace sq ft / total sq ft of home",  default_pct: 100, icon: "🏠" },
  supplies:              { label: "Office Supplies",          description: "Paper, ink, pens, props, organizers",              default_pct: 100, icon: "📎" },
  internet:              { label: "Internet",                 description: "Business portion of internet bill",                default_pct: 50,  icon: "🌐" },
  phone:                 { label: "Phone",                    description: "Business portion of cell/phone bill",              default_pct: 50,  icon: "📱" },
  shipping:              { label: "Shipping & Postage",       description: "Packaging, postage, return shipping",              default_pct: 100, icon: "📦" },
  product_costs:         { label: "Product / COGS",           description: "Cost of goods sold, product purchases",           default_pct: 100, icon: "🛍️" },
  vehicle_mileage:       { label: "Vehicle / Mileage",        description: "Business mileage at IRS standard rate",           default_pct: 100, icon: "🚗" },
  advertising:           { label: "Advertising & Marketing",  description: "Ads, promotions, social media tools",             default_pct: 100, icon: "📣" },
  professional_services: { label: "Professional Services",    description: "Accountant, attorney, bookkeeper",                default_pct: 100, icon: "💼" },
  equipment:             { label: "Equipment & Tech",         description: "Computers, cameras, peripherals, software",       default_pct: 100, icon: "💻" },
  education:             { label: "Education & Training",     description: "Courses, books, conferences",                     default_pct: 100, icon: "📚" },
  meals_entertainment:   { label: "Meals & Entertainment",    description: "Business meals (50% deductible)",                 default_pct: 50,  icon: "🍽️" },
  other:                 { label: "Other Business Expense",   description: "Ordinary and necessary business expenses",        default_pct: 100, icon: "📋" },
};

// ─── IRS FORM METADATA ───────────────────────────────────────

export const IRS_FORM_META: Record<IrsForm, {
  label: string;
  description: string;
  triggered_by: IncomeType[];
}> = {
  "1040":        { label: "Form 1040",      description: "U.S. Individual Income Tax Return — required for everyone",                        triggered_by: ["w2","1099_nec","1099_misc","1099_k","1099_div","1099_int","ssa_1099","rental","self_employ","other"] },
  "schedule_c":  { label: "Schedule C",     description: "Profit or Loss from Business — for self-employment / gig / Vine / review income",  triggered_by: ["1099_nec","1099_misc","1099_k","self_employ"] },
  "schedule_se": { label: "Schedule SE",    description: "Self-Employment Tax — required when Schedule C net profit > $400",                 triggered_by: ["1099_nec","1099_misc","1099_k","self_employ"] },
  "schedule_e":  { label: "Schedule E",     description: "Supplemental Income — rental income (Rocky Mountain Rentals)",                     triggered_by: ["rental"] },
  "schedule_d":  { label: "Schedule D",     description: "Capital Gains and Losses — if any assets sold",                                    triggered_by: ["1099_div","other"] },
  "form_8829":   { label: "Form 8829",      description: "Home Office Deduction — business use of home",                                     triggered_by: ["1099_nec","self_employ"] },
  "form_8283":   { label: "Form 8283",      description: "Noncash Charitable Contributions — if donated property > $500",                    triggered_by: ["other"] },
  "form_4562":   { label: "Form 4562",      description: "Depreciation and Amortization — for business equipment",                           triggered_by: ["1099_nec","self_employ","rental"] },
};

// ─── PRE-SEEDED PERSON PROFILES ──────────────────────────────

export const DEFAULT_PERSONS: TaxPerson[] = [
  {
    id: "person-revvel",
    name: "Revvel / Mom",
    slug: "revvel",
    role: "primary",
    filing_status: "head_of_household",
    businesses: [
      {
        id: "biz-vine",
        name: "Amazon Vine / Review Business",
        type: "sole_prop",
        schedule: "schedule_c",
        home_office_eligible: true,
        notes: "Amazon Vine ETV income + review business income",
      },
      {
        id: "biz-fac",
        name: "Freedom Angel Corps",
        type: "sole_prop",
        schedule: "schedule_c",
        home_office_eligible: true,
        notes: "Review business / content creation entity",
      },
      {
        id: "biz-rmr",
        name: "Rocky Mountain Rentals",
        type: "llc",
        schedule: "schedule_e",
        home_office_eligible: false,
        notes: "Rental company — Schedule E income",
      },
    ],
    notes: "Disability income (SSA-1099), Amazon Vine, Freedom Angel Corps, Rocky Mountain Rentals",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "person-reese",
    name: "Reese / Daughter",
    slug: "reese",
    role: "dependent",
    filing_status: "single",
    businesses: [],
    notes: "Multiple W-2 jobs (Rover, Home Depot, Dollar Store, zTrip) + potential 1099 gig work",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "person-caresse",
    name: "Caresse",
    slug: "caresse",
    role: "primary",
    filing_status: "single",
    businesses: [
      {
        id: "biz-reese-ventures",
        name: "Reese Ventures LLC",
        type: "llc",
        schedule: "schedule_c",
        home_office_eligible: true,
        notes: "SOS active LLC. DBA: ReeseReviews.com (review site), DBA: Fidelity Trust Services (trust consulting + light legal word processing). Bank: connected to Caresse's business checking.",
      },
      {
        id: "biz-noconook",
        name: "NoCo Nook & Rentals",
        type: "llc",
        schedule: "schedule_e",
        home_office_eligible: false,
        notes: "Resale + rental entity. Receives Vine product capital contributions after 6-month hold period. Tracks inventory, resale gains/losses, storage fees.",
      },
      {
        id: "biz-fac-caresse",
        name: "Freedom Angel Corps (shared)",
        type: "nonprofit",
        schedule: "schedule_c",
        home_office_eligible: false,
        notes: "Non-profit 501(c) entity shared with Audrey (person-revvel). EIN: 86-1209156. Payment gateway for all app launches. Both Caresse and Audrey are on this entity.",
      },
    ],
    notes: "App owner, site manager, caregiver. Reese Ventures LLC is her primary business entity with two DBAs. Consults for Fidelity Trust Services under Reese Ventures.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const DEFAULT_INCOME_SOURCES: IncomeSource[] = [
  // ── Revvel ──────────────────────────────────────────────────
  {
    id: "inc-revvel-ssa",
    person_id: "person-revvel",
    tax_year: 2025,
    label: "Social Security Disability (SSA-1099)",
    payer_name: "Social Security Administration",
    payer_ein: "52-0858003",
    income_type: "ssa_1099",
    gross_amount: 0,
    federal_withheld: 0,
    state_withheld: 0,
    reconciled: false,
    notes: "Disability income — up to 85% may be taxable depending on total income",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "inc-revvel-vine",
    person_id: "person-revvel",
    tax_year: 2025,
    label: "Amazon Vine ETV Income",
    payer_name: "Amazon.com Services LLC",
    payer_ein: "91-1646860",
    income_type: "1099_nec",
    gross_amount: 0,
    federal_withheld: 0,
    state_withheld: 0,
    business_entity_id: "biz-vine",
    reconciled: false,
    notes: "Estimated Tax Value from Vine program — reported on 1099-NEC",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "inc-revvel-fac",
    person_id: "person-revvel",
    tax_year: 2025,
    label: "Freedom Angel Corps — Review Business",
    payer_name: "Freedom Angel Corps",
    income_type: "self_employ",
    gross_amount: 0,
    federal_withheld: 0,
    state_withheld: 0,
    business_entity_id: "biz-fac",
    reconciled: false,
    notes: "Self-employment income from review business",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "inc-revvel-rmr",
    person_id: "person-revvel",
    tax_year: 2025,
    label: "Rocky Mountain Rentals — Rental Income",
    payer_name: "Rocky Mountain Rentals LLC",
    income_type: "rental",
    gross_amount: 0,
    federal_withheld: 0,
    state_withheld: 0,
    business_entity_id: "biz-rmr",
    reconciled: false,
    notes: "Rental income — Schedule E. Track expenses separately for net rental income.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // ── Reese ───────────────────────────────────────────────────
  {
    id: "inc-reese-rover",
    person_id: "person-reese",
    tax_year: 2025,
    label: "Rover — W-2",
    payer_name: "Rover Group Inc.",
    income_type: "w2",
    gross_amount: 0,
    federal_withheld: 0,
    state_withheld: 0,
    reconciled: false,
    notes: "Pet sitting / dog walking platform",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "inc-reese-homedepot",
    person_id: "person-reese",
    tax_year: 2025,
    label: "Home Depot — W-2",
    payer_name: "Home Depot U.S.A. Inc.",
    payer_ein: "58-0628465",
    income_type: "w2",
    gross_amount: 0,
    federal_withheld: 0,
    state_withheld: 0,
    reconciled: false,
    notes: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "inc-reese-dollarstore",
    person_id: "person-reese",
    tax_year: 2025,
    label: "Dollar Store — W-2",
    payer_name: "Dollar Tree Stores Inc.",
    income_type: "w2",
    gross_amount: 0,
    federal_withheld: 0,
    state_withheld: 0,
    reconciled: false,
    notes: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "inc-reese-ztrip",
    person_id: "person-reese",
    tax_year: 2025,
    label: "zTrip — W-2 / 1099",
    payer_name: "zTrip",
    income_type: "w2",
    gross_amount: 0,
    federal_withheld: 0,
    state_withheld: 0,
    reconciled: false,
    notes: "Rideshare — confirm if W-2 employee or 1099 contractor",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // ── Caresse ─────────────────────────────────────────────────
  {
    id: "inc-caresse-rv",
    person_id: "person-caresse",
    tax_year: 2025,
    label: "Reese Ventures LLC — Review Site / Content",
    payer_name: "Reese Ventures LLC (self)",
    income_type: "self_employ",
    gross_amount: 0,
    federal_withheld: 0,
    state_withheld: 0,
    business_entity_id: "biz-reese-ventures",
    reconciled: false,
    notes: "Self-employment income from ReeseReviews.com DBA — Schedule C",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "inc-caresse-fidelity",
    person_id: "person-caresse",
    tax_year: 2025,
    label: "Fidelity Trust Services (DBA) — Consulting",
    payer_name: "Fidelity Trust Services (DBA under Reese Ventures LLC)",
    income_type: "1099_nec",
    gross_amount: 0,
    federal_withheld: 0,
    state_withheld: 0,
    business_entity_id: "biz-reese-ventures",
    reconciled: false,
    notes: "Trust consultation + light legal word processing income. DBA under Reese Ventures LLC — flows to same Schedule C.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "inc-caresse-noconook",
    person_id: "person-caresse",
    tax_year: 2025,
    label: "NoCo Nook & Rentals — Resale + Rental",
    payer_name: "NoCo Nook & Rentals LLC",
    income_type: "rental",
    gross_amount: 0,
    federal_withheld: 0,
    state_withheld: 0,
    business_entity_id: "biz-noconook",
    reconciled: false,
    notes: "Resale income (Schedule C) and rental income (Schedule E) from NoCo Nook. Receives Vine product capital contributions after 6-month hold.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ─── UTILITY: Generate IDs ────────────────────────────────────

export function genId(prefix = "id"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── UTILITY: Current tax year ───────────────────────────────

export function currentTaxYear(): number {
  const now = new Date();
  // Before April 15, the prior year is still the active filing year
  return now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
}

// ─── STORAGE HELPERS ─────────────────────────────────────────

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // corrupted storage — return fallback
  }
  return fallback;
}

function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn(`[TaxModule] Failed to persist key: ${key}`);
  }
}

// ─── PERSONS ─────────────────────────────────────────────────

export function getPersons(): TaxPerson[] {
  return load<TaxPerson[]>(SK_PERSONS, DEFAULT_PERSONS);
}

export function savePersons(persons: TaxPerson[]): void {
  save(SK_PERSONS, persons);
}

export function addPerson(person: Omit<TaxPerson, "id" | "created_at" | "updated_at">): TaxPerson {
  const persons = getPersons();
  const newPerson: TaxPerson = {
    ...person,
    id: genId("person"),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  persons.push(newPerson);
  savePersons(persons);
  return newPerson;
}

export function updatePerson(id: string, updates: Partial<TaxPerson>): void {
  const persons = getPersons();
  const idx = persons.findIndex((p) => p.id === id);
  if (idx !== -1) {
    persons[idx] = { ...persons[idx], ...updates, updated_at: new Date().toISOString() };
    savePersons(persons);
  }
}

export function deletePerson(id: string): void {
  savePersons(getPersons().filter((p) => p.id !== id));
}

// ─── INCOME SOURCES ──────────────────────────────────────────

export function getIncomeSources(personId?: string, taxYear?: number): IncomeSource[] {
  let sources = load<IncomeSource[]>(SK_INCOME, DEFAULT_INCOME_SOURCES);
  if (personId) sources = sources.filter((s) => s.person_id === personId);
  if (taxYear)  sources = sources.filter((s) => s.tax_year === taxYear);
  return sources;
}

export function saveIncomeSources(sources: IncomeSource[]): void {
  save(SK_INCOME, sources);
}

export function addIncomeSource(source: Omit<IncomeSource, "id" | "created_at" | "updated_at">): IncomeSource {
  const all = load<IncomeSource[]>(SK_INCOME, DEFAULT_INCOME_SOURCES);
  const newSource: IncomeSource = {
    ...source,
    id: genId("inc"),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  all.push(newSource);
  saveIncomeSources(all);
  return newSource;
}

export function updateIncomeSource(id: string, updates: Partial<IncomeSource>): void {
  const all = load<IncomeSource[]>(SK_INCOME, DEFAULT_INCOME_SOURCES);
  const idx = all.findIndex((s) => s.id === id);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...updates, updated_at: new Date().toISOString() };
    saveIncomeSources(all);
  }
}

export function deleteIncomeSource(id: string): void {
  const all = load<IncomeSource[]>(SK_INCOME, DEFAULT_INCOME_SOURCES);
  saveIncomeSources(all.filter((s) => s.id !== id));
}

// ─── TAX DOCUMENTS ───────────────────────────────────────────

export function getTaxDocuments(personId?: string, taxYear?: number): TaxDocument[] {
  let docs = load<TaxDocument[]>(SK_DOCUMENTS, []);
  if (personId) docs = docs.filter((d) => d.person_id === personId);
  if (taxYear)  docs = docs.filter((d) => d.tax_year === taxYear);
  return docs;
}

export function saveTaxDocuments(docs: TaxDocument[]): void {
  save(SK_DOCUMENTS, docs);
}

export function addTaxDocument(doc: Omit<TaxDocument, "id" | "uploaded_at">): TaxDocument {
  const all = load<TaxDocument[]>(SK_DOCUMENTS, []);
  const newDoc: TaxDocument = {
    ...doc,
    id: genId("doc"),
    uploaded_at: new Date().toISOString(),
  };
  all.push(newDoc);
  saveTaxDocuments(all);
  return newDoc;
}

export function updateTaxDocument(id: string, updates: Partial<TaxDocument>): void {
  const all = load<TaxDocument[]>(SK_DOCUMENTS, []);
  const idx = all.findIndex((d) => d.id === id);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...updates };
    saveTaxDocuments(all);
  }
}

export function deleteTaxDocument(id: string): void {
  const all = load<TaxDocument[]>(SK_DOCUMENTS, []);
  saveTaxDocuments(all.filter((d) => d.id !== id));
}

// ─── WRITE-OFFS ──────────────────────────────────────────────

export function getWriteOffs(personId?: string, taxYear?: number): WriteOff[] {
  let items = load<WriteOff[]>(SK_WRITEOFFS, []);
  if (personId) items = items.filter((w) => w.person_id === personId);
  if (taxYear)  items = items.filter((w) => w.tax_year === taxYear);
  return items;
}

export function saveWriteOffs(items: WriteOff[]): void {
  save(SK_WRITEOFFS, items);
}

export function addWriteOff(item: Omit<WriteOff, "id" | "created_at" | "deductible_amount">): WriteOff {
  const all = load<WriteOff[]>(SK_WRITEOFFS, []);
  const deductible_amount = parseFloat(((item.amount * item.deductible_pct) / 100).toFixed(2));
  const newItem: WriteOff = {
    ...item,
    id: genId("wo"),
    deductible_amount,
    created_at: new Date().toISOString(),
  };
  all.push(newItem);
  saveWriteOffs(all);
  return newItem;
}

export function updateWriteOff(id: string, updates: Partial<WriteOff>): void {
  const all = load<WriteOff[]>(SK_WRITEOFFS, []);
  const idx = all.findIndex((w) => w.id === id);
  if (idx !== -1) {
    const merged = { ...all[idx], ...updates };
    merged.deductible_amount = parseFloat(((merged.amount * merged.deductible_pct) / 100).toFixed(2));
    all[idx] = merged;
    saveWriteOffs(all);
  }
}

export function deleteWriteOff(id: string): void {
  const all = load<WriteOff[]>(SK_WRITEOFFS, []);
  saveWriteOffs(all.filter((w) => w.id !== id));
}

// ─── QUARTERLY ESTIMATES ─────────────────────────────────────

export function getQuarterlyEstimates(personId?: string, taxYear?: number): QuarterlyEstimate[] {
  let items = load<QuarterlyEstimate[]>(SK_QUARTERLY, []);
  if (personId) items = items.filter((q) => q.person_id === personId);
  if (taxYear)  items = items.filter((q) => q.tax_year === taxYear);
  return items;
}

export function saveQuarterlyEstimates(items: QuarterlyEstimate[]): void {
  save(SK_QUARTERLY, items);
}

export function upsertQuarterlyEstimate(estimate: QuarterlyEstimate): void {
  const all = load<QuarterlyEstimate[]>(SK_QUARTERLY, []);
  const idx = all.findIndex(
    (q) => q.person_id === estimate.person_id &&
           q.tax_year === estimate.tax_year &&
           q.quarter === estimate.quarter
  );
  if (idx !== -1) {
    all[idx] = estimate;
  } else {
    all.push(estimate);
  }
  saveQuarterlyEstimates(all);
}

// ─── CALCULATIONS ─────────────────────────────────────────────

/** Determine which IRS forms are required for a given person/year */
export function determineRequiredForms(personId: string, taxYear: number): IrsForm[] {
  const sources = getIncomeSources(personId, taxYear);
  const writeoffs = getWriteOffs(personId, taxYear);
  const forms = new Set<IrsForm>(["1040"]);

  const incomeTypes = new Set(sources.map((s) => s.income_type));

  // Schedule C: any self-employment / gig / 1099 income
  if (
    incomeTypes.has("1099_nec") ||
    incomeTypes.has("1099_misc") ||
    incomeTypes.has("1099_k") ||
    incomeTypes.has("self_employ")
  ) {
    forms.add("schedule_c");
    forms.add("schedule_se");
  }

  // Schedule E: rental income
  if (incomeTypes.has("rental")) {
    forms.add("schedule_e");
  }

  // Schedule D: dividends or capital events
  if (incomeTypes.has("1099_div")) {
    forms.add("schedule_d");
  }

  // Form 8829: home office deduction
  const hasHomeOffice = writeoffs.some((w) => w.category === "home_office");
  if (hasHomeOffice && (forms.has("schedule_c") || forms.has("schedule_e"))) {
    forms.add("form_8829");
  }

  // Form 4562: equipment depreciation
  const hasEquipment = writeoffs.some((w) => w.category === "equipment" && w.amount > 500);
  if (hasEquipment) {
    forms.add("form_4562");
  }

  return Array.from(forms);
}

/** Summarize income totals for a person/year */
export interface IncomeSummary {
  person_id: string;
  tax_year: number;
  total_gross: number;
  total_w2: number;
  total_self_employ: number;
  total_rental: number;
  total_ssa: number;
  total_other: number;
  total_federal_withheld: number;
  total_state_withheld: number;
  total_writeoffs: number;
  total_deductible: number;
  estimated_agi: number;
  required_forms: IrsForm[];
}

export function computeIncomeSummary(personId: string, taxYear: number): IncomeSummary {
  const sources = getIncomeSources(personId, taxYear);
  const writeoffs = getWriteOffs(personId, taxYear);

  const w2Types: IncomeType[] = ["w2"];
  const selfTypes: IncomeType[] = ["1099_nec", "1099_misc", "1099_k", "self_employ"];
  const rentalTypes: IncomeType[] = ["rental"];
  const ssaTypes: IncomeType[] = ["ssa_1099"];

  const total_w2 = sources.filter((s) => w2Types.includes(s.income_type)).reduce((a, s) => a + s.gross_amount, 0);
  const total_self_employ = sources.filter((s) => selfTypes.includes(s.income_type)).reduce((a, s) => a + s.gross_amount, 0);
  const total_rental = sources.filter((s) => rentalTypes.includes(s.income_type)).reduce((a, s) => a + s.gross_amount, 0);
  const total_ssa = sources.filter((s) => ssaTypes.includes(s.income_type)).reduce((a, s) => a + s.gross_amount, 0);
  const total_other = sources
    .filter((s) => ![...w2Types, ...selfTypes, ...rentalTypes, ...ssaTypes].includes(s.income_type))
    .reduce((a, s) => a + s.gross_amount, 0);

  const total_gross = total_w2 + total_self_employ + total_rental + total_ssa + total_other;
  const total_federal_withheld = sources.reduce((a, s) => a + s.federal_withheld, 0);
  const total_state_withheld = sources.reduce((a, s) => a + s.state_withheld, 0);
  const total_writeoffs = writeoffs.reduce((a, w) => a + w.amount, 0);
  const total_deductible = writeoffs.reduce((a, w) => a + w.deductible_amount, 0);

  // Simplified AGI estimate (does not account for all above-the-line deductions)
  const se_deduction = total_self_employ > 0 ? total_self_employ * 0.5 * 0.1530 : 0; // ~half of SE tax
  const estimated_agi = Math.max(0, total_gross - total_deductible - se_deduction);

  return {
    person_id: personId,
    tax_year: taxYear,
    total_gross,
    total_w2,
    total_self_employ,
    total_rental,
    total_ssa,
    total_other,
    total_federal_withheld,
    total_state_withheld,
    total_writeoffs,
    total_deductible,
    estimated_agi,
    required_forms: determineRequiredForms(personId, taxYear),
  };
}

/** Estimate quarterly tax due for a person/year */
export function estimateQuarterlyTax(
  personId: string,
  taxYear: number,
  quarter: 1 | 2 | 3 | 4
): number {
  const summary = computeIncomeSummary(personId, taxYear);
  // Rough estimate: 25% effective rate on self-employment + 15.3% SE tax
  const annualEstimate = summary.total_self_employ * (0.25 + 0.1530) + summary.total_w2 * 0.22;
  return parseFloat((annualEstimate / 4).toFixed(2));
}

/** Compute write-off totals by category */
export function getWriteOffsByCategory(
  personId: string,
  taxYear: number
): Record<WriteOffCategory, { total: number; deductible: number; count: number }> {
  const writeoffs = getWriteOffs(personId, taxYear);
  const result = {} as Record<WriteOffCategory, { total: number; deductible: number; count: number }>;

  for (const cat of Object.keys(WRITEOFF_CATEGORY_META) as WriteOffCategory[]) {
    const items = writeoffs.filter((w) => w.category === cat);
    result[cat] = {
      total: items.reduce((a, w) => a + w.amount, 0),
      deductible: items.reduce((a, w) => a + w.deductible_amount, 0),
      count: items.length,
    };
  }
  return result;
}

/** Estimated tax savings from deductions (rough 25% bracket) */
export function estimateTaxSavings(personId: string, taxYear: number): number {
  const writeoffs = getWriteOffs(personId, taxYear);
  const totalDeductible = writeoffs.reduce((a, w) => a + w.deductible_amount, 0);
  return parseFloat((totalDeductible * 0.25).toFixed(2));
}

// ─── EXPORT ALL ──────────────────────────────────────────────
// Named exports above cover the full public API.
// Host apps should import from this file only — no internal
// dependencies on Reese Reviews or TruthSlayer-specific code.
