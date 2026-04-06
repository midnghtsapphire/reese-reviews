// ============================================================
// Portable Tax Module — designed for reuse across ReeseReviews,
// TruthSlayer, and other apps.
//
// TAX CENTER STORE
// Supabase-backed store with localStorage fallback for offline.
// No hard dependencies on any host app — import this file and go.
//
// Covers:
//   • Multi-person tax profiles (unlimited persons)
//   • Multi-entity business profiles (LLCs, S-Corps, sole props)
//   • Multi-income-source tracking (W-2, 1099, SSA, rental, etc.)
//   • Uploaded tax document metadata
//   • Business write-offs & deductions with receipt tracking
//   • Auto-determination of required IRS forms
//   • Quarterly estimated tax calculations
// ============================================================

import {
  loadFromSupabase,
  saveToSupabase,
  deleteFromSupabase,
  bulkSaveToSupabase,
  loadFromLocalStorage,
  saveToLocalStorage,
  type SupabaseStoreOptions,
} from "@/lib/supabasePersistence";

// ─── BRAND COLORS (host app can override via CSS vars) ───────
export const TAX_BRAND = {
  amber: "#FF6B2B",   // Hailstorm Amber
  gold: "#FFB347",    // Revvel Gold
  crimson: "#E63946", // Claw Crimson
  volt: "#FFD93D",    // Storm Volt
} as const;

// ─── STORAGE KEYS ────────────────────────────────────────────
const SK_PERSONS    = "taxmod-persons";
const SK_ENTITIES   = "taxmod-business-entities";
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
  | "uniform_ppe"
  | "pet_supplies"
  | "vehicle_actual"
  | "health_insurance"
  | "platform_fees"
  | "licensing_certs"
  | "other";

/** Industry types for write-off suggestion engine */
export type BusinessIndustry =
  | "pet_care"           // Rover: pet sitting / dog walking
  | "rideshare"          // zTrip, Uber, Lyft: rideshare driver
  | "retail_w2"          // Home Depot, Dollar Store: W-2 retail employee
  | "home_care"          // Home Care: in-home caregiver / CNA
  | "content_creator"    // Amazon Vine, review business, social media
  | "rental"             // NoCo Nook / rental company
  | "nonprofit"          // Freedom Angel Corps
  | "general";

export type FilingStatus =
  | "single"
  | "married_filing_jointly"
  | "married_filing_separately"
  | "head_of_household"
  | "qualifying_widow";

export type EntityType = "sole_prop" | "llc" | "s_corp" | "partnership" | "rental" | "gig";
export type EntitySchedule = "schedule_c" | "schedule_e" | "schedule_f" | "none";

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
  /** Pre-populated business entities for this person (kept for backward compat) */
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
  /** Contact email for this entity */
  email?: string;
  type: "sole_prop" | "llc" | "s_corp" | "partnership" | "rental" | "gig";
  type: EntityType;
  /** Which IRS schedule this entity files on */
  schedule: EntitySchedule;
  home_office_eligible: boolean;
  /** State of formation */
  state?: string;
  /** Date of formation */
  formation_date?: string;
  /** Entity status */
  status?: "active" | "suspended" | "dissolved";
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
  /** Supabase storage path */
  file_storage_path?: string;
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
  uniform_ppe:           { label: "Uniform / PPE",            description: "Required work uniforms, safety gear, scrubs, PPE",default_pct: 100, icon: "👔" },
  pet_supplies:          { label: "Pet Supplies",             description: "Pet care supplies used for client animals",       default_pct: 100, icon: "🐾" },
  vehicle_actual:        { label: "Vehicle Actual Expenses",  description: "Gas, oil, insurance, repairs, registration (business %)", default_pct: 60, icon: "⛽" },
  health_insurance:      { label: "Health Insurance Premium", description: "Self-employed health insurance deduction (100%)", default_pct: 100, icon: "🏥" },
  platform_fees:         { label: "Platform / App Fees",      description: "Service platform fees, booking app commissions",  default_pct: 100, icon: "📲" },
  licensing_certs:       { label: "Licenses & Certifications",description: "Professional licenses, certifications, background checks", default_pct: 100, icon: "🎓" },
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
  // ── Caresse — PRIMARY (this is her app) ──────────────────────
  {
    id: "person-caresse",
    name: "Caresse",
    slug: "caresse",
    role: "primary",
    filing_status: "single",
    businesses: [
      {
        id: "biz-caresse-homecare",
        name: "Home Care — Caregiver (Full-Time)",
        type: "gig",
        schedule: "schedule_c",
        home_office_eligible: false,
        notes: "Full-time in-home caregiver for Audrey/Mom. Confirm 1099-NEC vs W-2 each year. If self-employed/1099: deduct mileage between clients, scrubs/uniforms, PPE, certification fees, phone (work use %).",
      },
      {
        id: "biz-caresse-sitemgmt",
        name: "Digital Business Manager — Audrey's Sites & Businesses",
        type: "sole_prop",
        schedule: "schedule_c",
        home_office_eligible: true,
        notes: "Managing Audrey's online properties: Reese Reviews, TruthSlayer, Freedom Angel Corps, Amazon Vine tracking, NoCo Nook, social media, etc. Self-employment income — Schedule C. Deduct: internet, home office %, phone, software, computer equipment.",
      },
      {
        id: "biz-rmr-caresse",
        name: "Rocky Mountain Rentals — 20% Owner",
        type: "llc",
        schedule: "schedule_e",
        home_office_eligible: false,
        notes: "Caresse owns 20% of Rocky Mountain Rentals LLC. Audrey owns 80%. Her share of rental income and expenses flows to her Schedule E. Keep records of her proportional share of any rental expenses.",
      },
      {
        id: "biz-caresse-rover",
        name: "Rover — Pet Care",
        type: "gig",
        schedule: "schedule_c",
        home_office_eligible: false,
        notes: "Dog walking & pet sitting via Rover app. Rover pays via 1099-K (or 1099-NEC depending on year) — confirm each January. Schedule C self-employment. Deductible: mileage to/from client homes, leashes/pet supplies used on jobs, Rover platform fees (~20% commission), phone app use %.",
      },
      {
        id: "biz-caresse-homedepot",
        name: "Home Depot — W-2",
        type: "w2_employer",
        schedule: "none",
        home_office_eligible: false,
        notes: "W-2 retail employee at Home Depot. Taxes withheld by employer — no Schedule C. Keep your W-2 from January. Enter Box 1 wages and Box 2 federal withheld.",
      },
      {
        id: "biz-caresse-dollarstore",
        name: "Dollar Store — W-2",
        type: "w2_employer",
        schedule: "none",
        home_office_eligible: false,
        notes: "W-2 retail employee. Taxes withheld by employer — no Schedule C. Keep your W-2 from January. Limited federal deductions post-TCJA 2017 for W-2 workers, but may qualify for CO state deductions.",
      },
    ],
    notes: "Primary user of this app. Six income streams: (1) home care/caregiver, (2) digital business manager for Audrey's sites, (3) Rocky Mountain Rentals 20% share (Schedule E), (4) Rover pet care (1099-K, Schedule C), (5) Dollar Store W-2, (6) Home Depot W-2.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // ── Audrey (Mom) — passive income only ───────────────────────
  {
    id: "person-revvel",
    name: "Audrey / Mom",
    slug: "revvel",
    role: "dependent",
    filing_status: "head_of_household",
    businesses: [
      {
        id: "biz-vine",
        name: "Amazon Vine / Review Business",
        type: "sole_prop",
        schedule: "schedule_c",
        home_office_eligible: true,
        notes: "Amazon Vine ETV income — passive. Caresse manages tracking and reporting.",
      },
      {
        id: "biz-fac",
        name: "Freedom Angel Corps",
        ein: "86-1209156",
        email: "audrey@freedomangelcorps.com",
        type: "sole_prop",
        schedule: "schedule_c",
        home_office_eligible: true,
        notes: "Non-Profit Corporation (EIN 86-1209156). Payment gateway for apps. Amazon Vine/inventory income flows through here. Caresse manages day-to-day.",
      },
      {
        id: "biz-noconook",
        name: "NoCo Nook / Reviewed Surplus",
        type: "llc",
        schedule: "schedule_c",
        home_office_eligible: false,
        notes: "Resale company — sells reviewed/surplus inventory. Passive for Audrey; Caresse assists with management.",
      },
      {
        id: "biz-rmr",
        name: "Rocky Mountain Rentals — 80% Owner",
        type: "llc",
        schedule: "schedule_e",
        home_office_eligible: false,
        notes: "Audrey owns 80% of Rocky Mountain Rentals LLC. Caresse owns 20%. Audrey's 80% share of rental income and expenses goes on her Schedule E.",
      },
      {
        id: "biz-truthslayer",
        name: "TruthSlayer.com",
        type: "sole_prop",
        schedule: "schedule_c",
        home_office_eligible: true,
        notes: "Review marketplace — in development. Caresse will manage site. This tax module will be reused in TruthSlayer.",
      },
    ],
    notes: "♿ Accessibility: Legally deaf · AUDHD · Cognitive issues. Caresse manages all sites and handles all data entry.\n\n💰 Income — 2 items:\n  1. SSA-1099: Monthly disability check from Social Security (not a job, not passive — it is disability support)\n  2. Amazon Vine: Passive income — receives free products to review, IRS counts their value as income\n\nNo active job. Caresse manages everything.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // ── Reese / Daughter ─────────────────────────────────────────
  {
    id: "person-reese",
    name: "Reese / Daughter",
    slug: "reese",
    role: "dependent",
    filing_status: "single",
    businesses: [
      {
        id: "biz-reese-rover",
        name: "Rover — Pet Care",
        type: "gig",
        schedule: "schedule_c",
        home_office_eligible: false,
        notes: "Dog walking & pet sitting via Rover app. Likely 1099-K or 1099-NEC — confirm contractor vs employee status each year. MAXIMIZE write-offs as self-employed.",
      },
      {
        id: "biz-reese-ztrip",
        name: "zTrip — Rideshare",
        type: "gig",
        schedule: "schedule_c",
        home_office_eligible: false,
        notes: "Rideshare driving. Confirm W-2 vs 1099 each year. If 1099, all vehicle + phone expenses deductible on Sch C.",
      },
      {
        id: "biz-reese-homedepot",
        name: "Home Depot — W-2",
        type: "sole_prop",
        schedule: "none",
        home_office_eligible: false,
        notes: "W-2 employment. Post-TCJA 2017, unreimbursed employee expenses are NOT federally deductible. Check CO state rules — CO may still allow.",
      },
      {
        id: "biz-reese-homecare",
        name: "Home Care — Caregiver",
        type: "gig",
        schedule: "schedule_c",
        home_office_eligible: false,
        notes: "In-home caregiver. Confirm 1099 vs W-2. If 1099/self-employed, deduct all uniforms, mileage between clients, PPE, certifications.",
      },
      {
        id: "biz-reese-dollarstore",
        name: "Dollar Store — W-2",
        type: "sole_prop",
        schedule: "none",
        home_office_eligible: false,
        notes: "W-2 employment. Limited federal deductions post-TCJA. Check CO state rules.",
      },
    ],
    notes: "5 income sources: Rover (pet care), zTrip (rideshare), Home Depot (W-2), Home Care (caregiver), Dollar Store (W-2). Legally deaf — uses captions/ASL. AUDHD.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const DEFAULT_INCOME_SOURCES: IncomeSource[] = [
  // ── Caresse (PRIMARY — her app) ─────────────────────────────
  {
    id: "inc-caresse-homecare",
    person_id: "person-caresse",
    tax_year: 2025,
    label: "Home Care — Caregiver Income",
    payer_name: "Home Care Agency / Client",
    income_type: "1099_nec",
    gross_amount: 0,
    federal_withheld: 0,
    state_withheld: 0,
    business_entity_id: "biz-caresse-homecare",
    reconciled: false,
    notes: "Full-time caregiver for Audrey/Mom. If paid via agency: confirm W-2 vs 1099-NEC. If 1099/self-employed → Schedule C. Deductible: mileage between client visits, scrubs/uniforms, PPE, certification fees.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "inc-caresse-sitemgmt",
    person_id: "person-caresse",
    tax_year: 2025,
    label: "Digital Business Manager — Audrey's Sites & Businesses",
    payer_name: "Audrey Evans / Freedom Angel Corps",
    income_type: "self_employ",
    gross_amount: 0,
    federal_withheld: 0,
    state_withheld: 0,
    business_entity_id: "biz-caresse-sitemgmt",
    reconciled: false,
    notes: "Managing Audrey's online properties: Reese Reviews, TruthSlayer, Freedom Angel Corps, Amazon Vine tracking, NoCo Nook, social media, etc.\n\nThis is self-employment income — goes on Schedule C. Deductible expenses: internet bill (work %), home office (work %), phone (work %), software subscriptions, computer equipment.\n\nHow to enter: total what Audrey pays you for managing her stuff across the year. If informal/no formal pay yet, note $0 — still track the business entity for future deductions.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "inc-caresse-rmr",
    person_id: "person-caresse",
    tax_year: 2025,
    label: "Rocky Mountain Rentals — 20% Rental Income",
    payer_name: "Rocky Mountain Rentals LLC",
    income_type: "rental",
    gross_amount: 0,
    federal_withheld: 0,
    state_withheld: 0,
    business_entity_id: "biz-rmr-caresse",
    reconciled: false,
    notes: "Caresse owns 20% of Rocky Mountain Rentals LLC — Audrey owns the other 80%.\n\nThis goes on Schedule E (Rental Income), NOT Schedule C.\n\nHow to enter: take the total rental income for the year and multiply by 0.20 (20%). That is your share. Also multiply any rental expenses by 0.20 to get your deductible share.\n\nExample: if the property earns $10,000/yr → your share is $2,000. If expenses are $4,000 → your deductible share is $800.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "inc-caresse-rover",
    person_id: "person-caresse",
    tax_year: 2025,
    label: "Rover — Pet Care Income",
    payer_name: "Rover Group Inc.",
    income_type: "1099_k",
    gross_amount: 0,
    federal_withheld: 0,
    state_withheld: 0,
    business_entity_id: "biz-caresse-rover",
    reconciled: false,
    notes: "Pet sitting / dog walking via Rover. Rover issues a 1099-K (or 1099-NEC) in January — check which one arrived.\n\nThis is self-employment income → Schedule C. The gross amount on the 1099 is BEFORE Rover's ~20% commission cut. Rover's fee is itself a deductible expense.\n\nDeductible expenses: mileage to/from client homes, pet supplies used on jobs (leashes, treats, waste bags), Rover platform fees, phone (app use %), background check fees.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "inc-caresse-homedepot",
    person_id: "person-caresse",
    tax_year: 2025,
    label: "Home Depot — W-2",
    payer_name: "Home Depot U.S.A. Inc.",
    payer_ein: "58-0628465",
    income_type: "w2",
    gross_amount: 0,
    federal_withheld: 0,
    state_withheld: 0,
    business_entity_id: "biz-caresse-homedepot",
    reconciled: false,
    notes: "W-2 retail employee at Home Depot — taxes withheld by employer.\n\nHow to enter: get your W-2 paper (or login to Home Depot's MyTHDHR portal / ADP). Enter Box 1 (Wages) in Gross Amount. Enter Box 2 (Federal income tax withheld) in Federal Withheld. Enter Box 17 (State income tax) in State Withheld.\n\nNo Schedule C for W-2 jobs. Limited federal deductions since 2018 tax reform.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "inc-caresse-dollarstore",
    person_id: "person-caresse",
    tax_year: 2025,
    label: "Dollar Store — W-2",
    payer_name: "Dollar Tree Stores Inc.",
    income_type: "w2",
    gross_amount: 0,
    federal_withheld: 0,
    state_withheld: 0,
    business_entity_id: "biz-caresse-dollarstore",
    reconciled: false,
    notes: "W-2 retail employee — taxes withheld by employer.\n\nHow to enter: get your W-2 paper (or login to Dollar Tree's payroll portal). Enter Box 1 (Wages) in Gross Amount. Enter Box 2 (Federal income tax withheld) in Federal Withheld. Enter Box 17 (State income tax) in State Withheld.\n\nNo Schedule C for W-2 jobs. Limited federal deductions since 2018 tax reform, but CO may allow some employee expense deductions on the state return.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // ── Audrey / Mom — passive income only (2 items) ────────────
  {
    id: "inc-revvel-ssa",
    person_id: "person-revvel",
    tax_year: 2025,
    label: "Social Security Disability Check (SSA-1099)",
    payer_name: "Social Security Administration",
    payer_ein: "52-0858003",
    income_type: "ssa_1099",
    gross_amount: 0,
    federal_withheld: 0,
    state_withheld: 0,
    reconciled: false,
    notes: "💙 DISABILITY INCOME — this is Audrey's monthly check from Social Security because she is disabled. It is NOT a job and NOT passive income — it is disability support.\n\nHow to enter this: Get the SSA-1099 paper that arrives in January. Find Box 5 (called 'Net Benefits for 2025'). Type that dollar amount in the Gross Amount field above.\n\nNote: The IRS may tax up to 85% of this depending on total income — the app calculates that automatically.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "inc-revvel-vine",
    person_id: "person-revvel",
    tax_year: 2025,
    label: "Amazon Vine — Passive Income from Product Reviews (1099-NEC)",
    payer_name: "Amazon.com Services LLC",
    payer_ein: "91-1646860",
    income_type: "1099_nec",
    gross_amount: 0,
    federal_withheld: 0,
    state_withheld: 0,
    business_entity_id: "biz-vine",
    reconciled: false,
    notes: "🌿 PASSIVE INCOME — this is Audrey's Vine income. Amazon sends her free products to review. The IRS treats the value of those products as income, even though it's just stuff she received.\n\nHow to enter this: Amazon mails a 1099-NEC form in January. Find Box 1 — that's the total value of all Vine products for the year. Enter it in the Gross Amount field above.\n\nTip: Caresse tracks Vine items in the Vine tab automatically — check there first. The total ETV there should match Box 1 on the 1099-NEC.",
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
    label: "Rocky Mountain Rentals — 80% Rental Income",
    payer_name: "Rocky Mountain Rentals LLC",
    income_type: "rental",
    gross_amount: 0,
    federal_withheld: 0,
    state_withheld: 0,
    business_entity_id: "biz-rmr",
    reconciled: false,
    notes: "Audrey owns 80% of Rocky Mountain Rentals LLC — Caresse owns 20%.\n\nThis goes on Schedule E (Rental Income). Passive income.\n\nHow to enter: take the total rental income for the year and multiply by 0.80 (80%). That is Audrey's share. Also multiply any rental expenses by 0.80 for her deductible share.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // ── Reese / Daughter ─────────────────────────────────────────
  {
    id: "inc-reese-rover",
    person_id: "person-reese",
    tax_year: 2025,
    label: "Rover — Pet Care Income",
    payer_name: "Rover Group Inc.",
    income_type: "1099_k",
    gross_amount: 0,
    federal_withheld: 0,
    state_withheld: 0,
    business_entity_id: "biz-reese-rover",
    reconciled: false,
    notes: "Pet sitting / dog walking platform. Rover pays via 1099-K if over threshold. Track ALL pet care expenses as Schedule C deductions.",
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
    business_entity_id: "biz-reese-homedepot",
    reconciled: false,
    notes: "W-2 employee. Limited federal deductions post-TCJA 2017. Keep receipts for CO state return.",
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
    business_entity_id: "biz-reese-dollarstore",
    reconciled: false,
    notes: "W-2 employee. Limited federal deductions post-TCJA 2017.",
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
    business_entity_id: "biz-reese-ztrip",
    reconciled: false,
    notes: "Rideshare — confirm if W-2 employee or 1099 contractor",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "inc-reese-homecare",
    person_id: "person-reese",
    tax_year: 2025,
    label: "Home Care — Caregiver Income",
    payer_name: "Home Care Agency / Client",
    income_type: "1099_nec",
    gross_amount: 0,
    federal_withheld: 0,
    state_withheld: 0,
    business_entity_id: "biz-reese-homecare",
    reconciled: false,
    notes: "In-home caregiver. If 1099-NEC/self-employed → Schedule C. Track mileage between clients, scrubs, PPE.",
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

// ─── SUPABASE STORE OPTIONS ─────────────────────────────────

const personStoreOpts: SupabaseStoreOptions<TaxPerson> = {
  table: "tax_persons",
  localStorageKey: SK_PERSONS,
  fromRow: (row) => ({
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    role: row.role as TaxPerson["role"],
    ssn_last4: row.ssn_last4 as string | undefined,
    filing_status: row.filing_status as FilingStatus | undefined,
    businesses: [], // loaded separately from business_entities table
    notes: (row.notes as string) || "",
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }),
  toRow: (item, userId) => ({
    id: item.id,
    user_id: userId,
    name: item.name,
    slug: item.slug,
    role: item.role,
    ssn_last4: item.ssn_last4 || null,
    filing_status: item.filing_status || "single",
    notes: item.notes,
  }),
  getId: (item) => item.id,
};

const incomeStoreOpts: SupabaseStoreOptions<IncomeSource> = {
  table: "income_sources",
  localStorageKey: SK_INCOME,
  fromRow: (row) => ({
    id: row.id as string,
    person_id: row.person_id as string,
    tax_year: row.tax_year as number,
    label: row.label as string,
    payer_name: row.payer_name as string,
    payer_ein: row.payer_ein as string | undefined,
    income_type: row.income_type as IncomeType,
    gross_amount: Number(row.gross_amount) || 0,
    federal_withheld: Number(row.federal_withheld) || 0,
    state_withheld: Number(row.state_withheld) || 0,
    ss_wages: row.ss_wages != null ? Number(row.ss_wages) : undefined,
    medicare_wages: row.medicare_wages != null ? Number(row.medicare_wages) : undefined,
    document_id: row.document_id as string | undefined,
    business_entity_id: row.business_entity_id as string | undefined,
    reconciled: Boolean(row.reconciled),
    notes: (row.notes as string) || "",
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }),
  toRow: (item, userId) => ({
    id: item.id,
    user_id: userId,
    person_id: item.person_id,
    tax_year: item.tax_year,
    label: item.label,
    payer_name: item.payer_name,
    payer_ein: item.payer_ein || null,
    income_type: item.income_type,
    gross_amount: item.gross_amount,
    federal_withheld: item.federal_withheld,
    state_withheld: item.state_withheld,
    ss_wages: item.ss_wages ?? null,
    medicare_wages: item.medicare_wages ?? null,
    document_id: item.document_id || null,
    business_entity_id: item.business_entity_id || null,
    reconciled: item.reconciled,
    notes: item.notes,
  }),
  getId: (item) => item.id,
};

const writeOffStoreOpts: SupabaseStoreOptions<WriteOff> = {
  table: "write_offs",
  localStorageKey: SK_WRITEOFFS,
  fromRow: (row) => ({
    id: row.id as string,
    person_id: row.person_id as string,
    business_entity_id: row.business_entity_id as string | undefined,
    tax_year: row.tax_year as number,
    date: row.date as string,
    description: row.description as string,
    vendor: (row.vendor as string) || "",
    category: row.category as WriteOffCategory,
    amount: Number(row.amount) || 0,
    deductible_pct: Number(row.deductible_pct) || 100,
    deductible_amount: Number(row.deductible_amount) || 0,
    receipt_document_id: row.receipt_document_id as string | undefined,
    mileage_miles: row.mileage_miles != null ? Number(row.mileage_miles) : undefined,
    mileage_rate: row.mileage_rate != null ? Number(row.mileage_rate) : undefined,
    notes: (row.notes as string) || "",
    created_at: row.created_at as string,
  }),
  toRow: (item, userId) => ({
    id: item.id,
    user_id: userId,
    person_id: item.person_id,
    business_entity_id: item.business_entity_id || null,
    tax_year: item.tax_year,
    date: item.date,
    description: item.description,
    vendor: item.vendor,
    category: item.category,
    amount: item.amount,
    deductible_pct: item.deductible_pct,
    deductible_amount: item.deductible_amount,
    receipt_document_id: item.receipt_document_id || null,
    mileage_miles: item.mileage_miles ?? null,
    mileage_rate: item.mileage_rate ?? null,
    notes: item.notes,
  }),
  getId: (item) => item.id,
};

const quarterlyStoreOpts: SupabaseStoreOptions<QuarterlyEstimate> = {
  table: "quarterly_estimates",
  localStorageKey: SK_QUARTERLY,
  fromRow: (row) => ({
    id: row.id as string,
    person_id: row.person_id as string,
    tax_year: row.tax_year as number,
    quarter: row.quarter as 1 | 2 | 3 | 4,
    due_date: row.due_date as string,
    estimated_income: Number(row.estimated_income) || 0,
    estimated_tax_owed: Number(row.estimated_tax_owed) || 0,
    amount_paid: Number(row.amount_paid) || 0,
    paid_date: row.paid_date as string | undefined,
    paid: Boolean(row.paid),
    notes: (row.notes as string) || "",
  }),
  toRow: (item, userId) => ({
    id: item.id,
    user_id: userId,
    person_id: item.person_id,
    tax_year: item.tax_year,
    quarter: item.quarter,
    due_date: item.due_date,
    estimated_income: item.estimated_income,
    estimated_tax_owed: item.estimated_tax_owed,
    amount_paid: item.amount_paid,
    paid_date: item.paid_date || null,
    paid: item.paid,
    notes: item.notes,
  }),
  getId: (item) => item.id,
};

const documentStoreOpts: SupabaseStoreOptions<TaxDocument> = {
  table: "tax_documents",
  localStorageKey: SK_DOCUMENTS,
  fromRow: (row) => ({
    id: row.id as string,
    person_id: row.person_id as string,
    tax_year: row.tax_year as number,
    document_type: row.document_type as DocumentType,
    file_name: row.file_name as string,
    file_storage_path: row.file_storage_path as string | undefined,
    file_size_bytes: Number(row.file_size_bytes) || 0,
    mime_type: (row.mime_type as string) || "",
    extracted_fields: (row.extracted_fields as Record<string, string>) || {},
    confirmed: Boolean(row.confirmed),
    linked_income_source_id: row.linked_income_source_id as string | undefined,
    uploaded_at: row.uploaded_at as string,
    notes: (row.notes as string) || "",
  }),
  toRow: (item, userId) => ({
    id: item.id,
    user_id: userId,
    person_id: item.person_id,
    tax_year: item.tax_year,
    document_type: item.document_type,
    file_name: item.file_name,
    file_storage_path: item.file_storage_path || null,
    file_size_bytes: item.file_size_bytes,
    mime_type: item.mime_type,
    extracted_fields: item.extracted_fields,
    confirmed: item.confirmed,
    linked_income_source_id: item.linked_income_source_id || null,
    notes: item.notes,
  }),
  getId: (item) => item.id,
};

// ─── SYNCHRONOUS STORAGE HELPERS (backward compat) ──────────

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

// ─── PERSONS (sync API — backward compatible) ───────────────

export function getPersons(): TaxPerson[] {
  return load<TaxPerson[]>(SK_PERSONS, DEFAULT_PERSONS);
}

export function savePersons(persons: TaxPerson[]): void {
  save(SK_PERSONS, persons);
  // Fire-and-forget Supabase sync
  bulkSaveToSupabase(personStoreOpts, persons).catch(() => {});
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

// ─── ASYNC PERSONS (Supabase-first) ────────────────────────

export async function getPersonsAsync(): Promise<TaxPerson[]> {
  return loadFromSupabase(personStoreOpts, DEFAULT_PERSONS);
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
  bulkSaveToSupabase(incomeStoreOpts, sources).catch(() => {});
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

// ─── ASYNC INCOME SOURCES ───────────────────────────────────

export async function getIncomeSourcesAsync(personId?: string, taxYear?: number): Promise<IncomeSource[]> {
  const filters: Record<string, unknown> = {};
  if (personId) filters.person_id = personId;
  if (taxYear) filters.tax_year = taxYear;
  return loadFromSupabase(incomeStoreOpts, DEFAULT_INCOME_SOURCES, filters);
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
  bulkSaveToSupabase(documentStoreOpts, docs).catch(() => {});
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
  bulkSaveToSupabase(writeOffStoreOpts, items).catch(() => {});
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
  bulkSaveToSupabase(quarterlyStoreOpts, items).catch(() => {});
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

// ─── INDUSTRY WRITE-OFF SUGGESTIONS ──────────────────────────

/**
 * A suggested write-off for a specific business industry.
 * Used to pre-populate write-offs for each of Reese's jobs
 * and Revvel's businesses, maximizing legal deductions.
 */
export interface WriteOffSuggestion {
  description: string;
  vendor: string;
  category: WriteOffCategory;
  deductible_pct: number;
  /** Rough monthly estimate for budgeting — 0 = user enters amount */
  estimated_monthly: number;
  note: string;
  /** Federal deductibility note */
  federal_note: string;
}

/**
 * Returns industry-specific write-off suggestions.
 * Always consult a tax professional — these are starting-point
 * suggestions based on IRS Publication 535 and common practice.
 */
export function getIndustryWriteOffSuggestions(
  industry: BusinessIndustry
): WriteOffSuggestion[] {
  switch (industry) {
    // ── Pet Care (Rover) ──────────────────────────────────────
    // Schedule C self-employment — maximize ALL business expenses
    case "pet_care":
      return [
        { description: "Dog treats & chews for client dogs",         vendor: "Pet store",          category: "pet_supplies",     deductible_pct: 100, estimated_monthly: 20,  note: "Must be used in the course of pet care services", federal_note: "Sch C deductible if self-employed" },
        { description: "Poop bags (bulk purchase)",                  vendor: "Amazon/Chewy",       category: "pet_supplies",     deductible_pct: 100, estimated_monthly: 10,  note: "Consumable supplies used for client dogs", federal_note: "Sch C deductible" },
        { description: "Leashes, harnesses for client dogs",         vendor: "Pet store",          category: "pet_supplies",     deductible_pct: 100, estimated_monthly: 5,   note: "Equipment used in service delivery", federal_note: "Sch C deductible" },
        { description: "Pet first aid kit",                          vendor: "Pet store",          category: "pet_supplies",     deductible_pct: 100, estimated_monthly: 2,   note: "Safety equipment required for pet care", federal_note: "Sch C deductible" },
        { description: "Mileage to/from client homes",               vendor: "Vehicle",            category: "vehicle_mileage",  deductible_pct: 100, estimated_monthly: 50,  note: "IRS standard rate (2025: 70¢/mile). Log every trip.", federal_note: "Sch C deductible — MUST keep mileage log" },
        { description: "Phone data plan (Rover app use)",            vendor: "Phone carrier",      category: "phone",            deductible_pct: 50,  estimated_monthly: 25,  note: "50% for business use of phone for app", federal_note: "Sch C deductible — estimate business %" },
        { description: "Pet CPR / first aid certification",          vendor: "Red Cross / NAPPS",  category: "licensing_certs",  deductible_pct: 100, estimated_monthly: 5,   note: "Annual certification — divide by 12 for monthly", federal_note: "Sch C deductible" },
        { description: "Pet sitter liability insurance",             vendor: "Pet Sitters Intl",   category: "professional_services", deductible_pct: 100, estimated_monthly: 15, note: "Professional liability insurance", federal_note: "Sch C deductible" },
        { description: "Dog carrier / crate for transport",         vendor: "Amazon/Petco",       category: "equipment",        deductible_pct: 100, estimated_monthly: 5,   note: "Equipment used in service", federal_note: "Sch C — may depreciate if > $2,500" },
        { description: "Rover platform service fees / commissions",  vendor: "Rover Group",        category: "platform_fees",    deductible_pct: 100, estimated_monthly: 30,  note: "Rover keeps ~20% commission — track on 1099-K", federal_note: "Sch C deductible" },
        { description: "Self-employed health insurance premium",     vendor: "Insurance carrier",  category: "health_insurance", deductible_pct: 100, estimated_monthly: 0,   note: "If not eligible for employer coverage from any job", federal_note: "Above-the-line deduction on Form 1040" },
        { description: "Pet care reference books / courses",         vendor: "Amazon / NAPPS",     category: "education",        deductible_pct: 100, estimated_monthly: 5,   note: "Education directly related to pet care business", federal_note: "Sch C deductible" },
      ];

    // ── Rideshare (zTrip) ────────────────────────────────────
    // Schedule C if 1099 contractor — vehicle expenses are biggest deduction
    case "rideshare":
      return [
        { description: "Business mileage (IRS standard rate method)", vendor: "Vehicle",           category: "vehicle_mileage",  deductible_pct: 100, estimated_monthly: 150, note: "2025 IRS rate: 70¢/mile. Log ALL business miles with app.", federal_note: "Sch C — CANNOT also deduct actual expenses if using standard rate" },
        { description: "Vehicle cleaning / car wash",                 vendor: "Car wash",           category: "vehicle_actual",   deductible_pct: 100, estimated_monthly: 20,  note: "Keep car clean for passenger ratings", federal_note: "Sch C deductible (actual expense method only)" },
        { description: "Phone data plan — navigation + app",          vendor: "Phone carrier",      category: "phone",            deductible_pct: 70,  estimated_monthly: 35,  note: "Estimate business use % for navigation/dispatching", federal_note: "Sch C deductible" },
        { description: "Phone mount for navigation",                  vendor: "Amazon",             category: "equipment",        deductible_pct: 100, estimated_monthly: 2,   note: "Dashboard phone mount", federal_note: "Sch C deductible" },
        { description: "Car charger / USB hub for passengers",        vendor: "Amazon",             category: "equipment",        deductible_pct: 100, estimated_monthly: 2,   note: "Passenger amenity equipment", federal_note: "Sch C deductible" },
        { description: "Bottled water / mints for passengers",        vendor: "Costco / grocery",   category: "supplies",         deductible_pct: 100, estimated_monthly: 15,  note: "Passenger amenities — keeps ratings high", federal_note: "Sch C deductible as supplies" },
        { description: "Toll fees",                                   vendor: "Toll authority",     category: "vehicle_actual",   deductible_pct: 100, estimated_monthly: 20,  note: "E-ZPass / toll booth fees incurred on trips", federal_note: "Sch C deductible" },
        { description: "Rideshare platform fees / commissions",       vendor: "zTrip",              category: "platform_fees",    deductible_pct: 100, estimated_monthly: 50,  note: "Company's cut of each fare", federal_note: "Sch C deductible" },
        { description: "Rideshare / TNC commercial insurance",        vendor: "Rideshare insurance",category: "vehicle_actual",   deductible_pct: 100, estimated_monthly: 40,  note: "Gap insurance or TNC rider required between rides", federal_note: "Sch C deductible (actual method)" },
        { description: "Self-employed health insurance premium",      vendor: "Insurance carrier",  category: "health_insurance", deductible_pct: 100, estimated_monthly: 0,   note: "If not covered by another employer", federal_note: "Above-the-line deduction on Form 1040" },
        { description: "Spotify / music streaming for passengers",    vendor: "Spotify",            category: "supplies",         deductible_pct: 100, estimated_monthly: 10,  note: "Passenger experience / ratings", federal_note: "Sch C deductible" },
        { description: "Background check renewal fee",               vendor: "Checkr / zTrip",    category: "licensing_certs",  deductible_pct: 100, estimated_monthly: 2,   note: "Required for platform access", federal_note: "Sch C deductible" },
      ];

    // ── Retail W-2 (Home Depot, Dollar Store) ────────────────
    // Very limited FEDERAL deductions post-TCJA 2017
    // Colorado may still allow itemized employee deductions — check CO DR 0104
    case "retail_w2":
      return [
        { description: "Required safety boots / steel-toed shoes",   vendor: "Boot Barn / Amazon", category: "uniform_ppe",      deductible_pct: 100, estimated_monthly: 5,   note: "ONLY if required by employer AND not reimbursed. NOT federally deductible for W-2 post-2017. May be CO state deductible.", federal_note: "NOT federally deductible (W-2 employee post-TCJA). Check CO state." },
        { description: "Required work uniform / vest",               vendor: "Employer store",     category: "uniform_ppe",      deductible_pct: 100, estimated_monthly: 3,   note: "Only if uniform is required AND cannot be worn off-duty", federal_note: "NOT federally deductible for W-2. Check CO state." },
        { description: "Work gloves / safety gear",                  vendor: "Home Depot / Amazon",category: "uniform_ppe",      deductible_pct: 100, estimated_monthly: 5,   note: "Required PPE not reimbursed by employer", federal_note: "NOT federally deductible for W-2. Possible CO state deduction." },
        { description: "Union dues (if applicable)",                 vendor: "Union",              category: "professional_services", deductible_pct: 100, estimated_monthly: 20, note: "Union dues are no longer federally deductible for employees post-2017", federal_note: "NOT federally deductible. Some states allow." },
        { description: "Job search expenses (same field)",           vendor: "Various",            category: "other",            deductible_pct: 100, estimated_monthly: 0,   note: "Currently not federally deductible for W-2. Track for future changes.", federal_note: "NOT federally deductible post-TCJA." },
      ];

    // ── Home Care / Caregiver ────────────────────────────────
    // Schedule C if 1099-NEC self-employed
    case "home_care":
      return [
        { description: "Scrubs / medical uniforms",                  vendor: "Walmart / Amazon",   category: "uniform_ppe",      deductible_pct: 100, estimated_monthly: 15,  note: "Required distinctive work clothing", federal_note: "Sch C deductible if self-employed" },
        { description: "Gloves, masks, PPE supplies",                vendor: "Amazon / Costco",    category: "uniform_ppe",      deductible_pct: 100, estimated_monthly: 20,  note: "Personal protective equipment for client care", federal_note: "Sch C deductible" },
        { description: "Mileage between client homes",               vendor: "Vehicle",            category: "vehicle_mileage",  deductible_pct: 100, estimated_monthly: 60,  note: "IRS 70¢/mile (2025). Log every client-to-client trip.", federal_note: "Sch C deductible — mileage log required" },
        { description: "Phone (client coordination / scheduling)",   vendor: "Phone carrier",      category: "phone",            deductible_pct: 50,  estimated_monthly: 25,  note: "Scheduling, care app use", federal_note: "Sch C deductible — estimate business %" },
        { description: "CNA license / state certification renewal",  vendor: "State health dept",  category: "licensing_certs",  deductible_pct: 100, estimated_monthly: 5,   note: "Required professional license", federal_note: "Sch C deductible" },
        { description: "CPR / First Aid certification",              vendor: "Red Cross",          category: "licensing_certs",  deductible_pct: 100, estimated_monthly: 3,   note: "Required certification for caregivers", federal_note: "Sch C deductible" },
        { description: "Background check fee",                       vendor: "Checkr / state",     category: "licensing_certs",  deductible_pct: 100, estimated_monthly: 2,   note: "Required by employer or platform annually", federal_note: "Sch C deductible" },
        { description: "Continuing education / CE credits",          vendor: "CE provider",        category: "education",        deductible_pct: 100, estimated_monthly: 10,  note: "Continuing education to maintain licensure", federal_note: "Sch C deductible" },
        { description: "First aid kit / medical supplies",           vendor: "CVS / Amazon",       category: "supplies",         deductible_pct: 100, estimated_monthly: 10,  note: "Supplies used during client care", federal_note: "Sch C deductible" },
        { description: "Medical reference books / apps",            vendor: "Amazon / App store", category: "education",        deductible_pct: 100, estimated_monthly: 5,   note: "Medical reference materials used on the job", federal_note: "Sch C deductible" },
        { description: "Home care platform fees",                    vendor: "Care.com / agency",  category: "platform_fees",    deductible_pct: 100, estimated_monthly: 20,  note: "Booking platform or agency fees", federal_note: "Sch C deductible" },
        { description: "Self-employed health insurance premium",     vendor: "Insurance carrier",  category: "health_insurance", deductible_pct: 100, estimated_monthly: 0,   note: "If not eligible for employer plan from other jobs", federal_note: "Above-the-line deduction on 1040" },
      ];

    // ── Content Creator / Amazon Vine ────────────────────────
    // Schedule C — broad range of deductible creative expenses
    case "content_creator":
      return [
        { description: "Home office (dedicated review/recording space)", vendor: "Home",            category: "home_office",      deductible_pct: 100, estimated_monthly: 100, note: "Sq ft of office / total home sq ft × monthly rent/mortgage interest", federal_note: "Form 8829 + Sch C" },
        { description: "Internet bill (business portion)",            vendor: "ISP",                category: "internet",         deductible_pct: 80,  estimated_monthly: 60,  note: "High % business use for streaming, uploads", federal_note: "Sch C deductible" },
        { description: "Phone plan (content posting, app use)",       vendor: "Phone carrier",      category: "phone",            deductible_pct: 70,  estimated_monthly: 35,  note: "Used for review app, posting, communication", federal_note: "Sch C deductible" },
        { description: "Camera / photography equipment",             vendor: "Amazon / B&H",       category: "equipment",        deductible_pct: 100, estimated_monthly: 20,  note: "Camera, tripod, ring light for product reviews", federal_note: "Sch C deductible — Form 4562 if > $2,500" },
        { description: "Microphone / audio gear",                    vendor: "Amazon",              category: "equipment",        deductible_pct: 100, estimated_monthly: 10,  note: "Microphone for video reviews", federal_note: "Sch C deductible" },
        { description: "Lighting equipment",                         vendor: "Amazon",              category: "equipment",        deductible_pct: 100, estimated_monthly: 5,   note: "Ring light, LED panels for review photos/videos", federal_note: "Sch C deductible" },
        { description: "Computer / laptop (business portion)",       vendor: "Apple / Dell",        category: "equipment",        deductible_pct: 80,  estimated_monthly: 30,  note: "Used for review writing, video editing, uploads", federal_note: "Sch C — Form 4562 for depreciation" },
        { description: "HeyGen AI video subscription",               vendor: "HeyGen",              category: "advertising",      deductible_pct: 100, estimated_monthly: 30,  note: "AI video creation for review content", federal_note: "Sch C deductible" },
        { description: "ElevenLabs AI voice subscription",           vendor: "ElevenLabs",          category: "advertising",      deductible_pct: 100, estimated_monthly: 22,  note: "AI voice generation for review videos", federal_note: "Sch C deductible" },
        { description: "OpenAI / ChatGPT subscription",              vendor: "OpenAI",              category: "advertising",      deductible_pct: 100, estimated_monthly: 20,  note: "AI writing assistance for review content", federal_note: "Sch C deductible" },
        { description: "Amazon Prime (product research)",            vendor: "Amazon",              category: "supplies",         deductible_pct: 50,  estimated_monthly: 7,   note: "Business use portion of Prime for Vine research", federal_note: "Sch C deductible — estimate business %" },
        { description: "Video editing software (DaVinci, Premiere)", vendor: "Adobe / Blackmagic",  category: "equipment",        deductible_pct: 100, estimated_monthly: 25,  note: "Software for review video production", federal_note: "Sch C deductible" },
        { description: "Product photography supplies (backdrop, props)", vendor: "Amazon",          category: "supplies",         deductible_pct: 100, estimated_monthly: 20,  note: "Staging supplies for product review photos", federal_note: "Sch C deductible" },
        { description: "Mileage to post office / shipping supplies", vendor: "Post office",         category: "vehicle_mileage",  deductible_pct: 100, estimated_monthly: 15,  note: "Shipping returned/donated items, getting supplies", federal_note: "Sch C deductible" },
        { description: "Packaging supplies for donation/resale",     vendor: "Uline / Amazon",      category: "shipping",         deductible_pct: 100, estimated_monthly: 20,  note: "Boxes, tape, bubble wrap for transferred inventory", federal_note: "Sch C deductible" },
      ];

    // ── Rental (NoCo Nook) ───────────────────────────────────
    // Schedule E — rental income and expenses
    case "rental":
      return [
        { description: "Mortgage interest (rental property)",        vendor: "Lender",             category: "other",            deductible_pct: 100, estimated_monthly: 0,   note: "Interest portion of mortgage — from Form 1098", federal_note: "Sch E deductible" },
        { description: "Property taxes (rental property)",           vendor: "County",             category: "other",            deductible_pct: 100, estimated_monthly: 0,   note: "Annual property tax / 12", federal_note: "Sch E deductible" },
        { description: "Property insurance",                         vendor: "Insurance carrier",  category: "other",            deductible_pct: 100, estimated_monthly: 100, note: "Landlord / rental property insurance", federal_note: "Sch E deductible" },
        { description: "Repairs and maintenance",                    vendor: "Contractor / store", category: "supplies",         deductible_pct: 100, estimated_monthly: 50,  note: "Repairs to keep property in rentable condition", federal_note: "Sch E deductible — NOT capital improvements" },
        { description: "Property management fees",                   vendor: "Property manager",   category: "professional_services", deductible_pct: 100, estimated_monthly: 0, note: "If using a property management company", federal_note: "Sch E deductible" },
        { description: "Advertising / listing fees",                 vendor: "Zillow / VRBO",      category: "advertising",      deductible_pct: 100, estimated_monthly: 20,  note: "Listing fees on rental platforms", federal_note: "Sch E deductible" },
        { description: "Cleaning between tenants",                   vendor: "Cleaning service",   category: "supplies",         deductible_pct: 100, estimated_monthly: 50,  note: "Professional cleaning for turnovers", federal_note: "Sch E deductible" },
        { description: "Depreciation (Form 4562)",                   vendor: "IRS",                category: "other",            deductible_pct: 100, estimated_monthly: 0,   note: "27.5-year depreciation on residential rental property — requires Form 4562", federal_note: "Sch E — use Form 4562" },
        { description: "Professional services (CPA, attorney)",      vendor: "CPA / attorney",     category: "professional_services", deductible_pct: 100, estimated_monthly: 20, note: "Tax prep and legal fees related to rental", federal_note: "Sch E deductible" },
      ];

    // ── Non-profit (Freedom Angel Corps) ────────────────────
    case "nonprofit":
      return [
        { description: "Bank service fees",                          vendor: "Bank",               category: "professional_services", deductible_pct: 100, estimated_monthly: 10, note: "Operating account fees", federal_note: "Non-profit operating expense" },
        { description: "Website / domain hosting",                   vendor: "Cloudflare / DO",    category: "internet",         deductible_pct: 100, estimated_monthly: 20,  note: "Non-profit website hosting", federal_note: "Non-profit operating expense" },
        { description: "Program supplies (trafficking victim services)", vendor: "Various",          category: "supplies",         deductible_pct: 100, estimated_monthly: 50,  note: "Supplies for reskilling program", federal_note: "Non-profit program expense" },
        { description: "Payment gateway / processing fees",          vendor: "Stripe / PayPal",    category: "platform_fees",    deductible_pct: 100, estimated_monthly: 15,  note: "Payment processing fees for donations", federal_note: "Non-profit operating expense" },
        { description: "State registration fees",                   vendor: "State",               category: "licensing_certs",  deductible_pct: 100, estimated_monthly: 5,   note: "Annual non-profit registration fees", federal_note: "Non-profit administrative expense" },
      ];

    default:
      return [
        { description: "General business supplies",                  vendor: "Various",            category: "supplies",         deductible_pct: 100, estimated_monthly: 30,  note: "Ordinary and necessary business supplies", federal_note: "Sch C deductible" },
        { description: "Phone (business portion)",                   vendor: "Phone carrier",      category: "phone",            deductible_pct: 50,  estimated_monthly: 25,  note: "Estimate business use %", federal_note: "Sch C deductible" },
        { description: "Mileage (business trips)",                   vendor: "Vehicle",            category: "vehicle_mileage",  deductible_pct: 100, estimated_monthly: 30,  note: "IRS standard mileage rate 2025: 70¢/mile", federal_note: "Sch C deductible with mileage log" },
        { description: "Professional services (CPA, legal)",         vendor: "CPA / attorney",     category: "professional_services", deductible_pct: 100, estimated_monthly: 30, note: "Tax prep and legal fees", federal_note: "Sch C deductible" },
      ];
  }
}

/** Map a BusinessEntity to its closest BusinessIndustry */
export function entityToIndustry(entity: BusinessEntity): BusinessIndustry {
  const name = entity.name.toLowerCase();
  const notes = entity.notes.toLowerCase();
  if (name.includes("rover") || name.includes("pet") || notes.includes("pet"))                            return "pet_care";
  if (name.includes("ztrip") || name.includes("rideshare") || notes.includes("rideshare"))                return "rideshare";
  if (name.includes("home care") || name.includes("caregiver") || notes.includes("caregiver"))            return "home_care";
  if (name.includes("home depot") || name.includes("dollar") || notes.includes("w-2 retail"))            return "retail_w2";
  if (name.includes("vine") || name.includes("review") || notes.includes("content"))                     return "content_creator";
  if (name.includes("rental") || name.includes("nook") || entity.schedule === "schedule_e")              return "rental";
  if (name.includes("freedom") || name.includes("non") || name.includes("angel"))                       return "nonprofit";
  if (entity.type === "gig") return "general";
  return "general";
}


