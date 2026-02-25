// ============================================================
// TAX TRACKING & RECONCILIATION TYPES
// CRITICAL: Vine income (ETV) is reported to IRS on 1099-NEC
// All tracking must be tax-accurate and audit-ready
// ============================================================

// ─── ETV (ESTIMATED TAX VALUE) TRACKING ──────────────────────

export interface ETVRecord {
  id: string;
  vine_item_id: string;
  asin: string;
  product_name: string;
  etv_amount: number; // Reported to IRS
  received_date: string;
  review_deadline: string;
  review_status: "pending" | "completed" | "overdue";
  review_date?: string;
  tax_year: number;
  tax_quarter: number;
  reported_on_1099: boolean;
  amazon_1099_reference?: string;
  notes: string;
}

// ─── 1099-NEC RECONCILIATION ─────────────────────────────────

export interface Form1099NEC {
  id: string;
  tax_year: number;
  box_1_misc_income: number; // Total ETV reported by Amazon
  box_1a_etv_vine: number; // Vine ETV specifically
  received_date: string;
  payer_name: string; // "Amazon.com Services LLC"
  payer_ein: string;
  recipient_tin: string; // User's SSN/EIN
  account_number?: string;
  filing_status: "received" | "pending" | "reconciled" | "discrepancy";
  app_total_etv: number; // What the app calculated
  discrepancy_amount: number; // box_1a_etv_vine - app_total_etv
  discrepancy_notes: string;
  uploaded_file_path?: string;
  reconciliation_date?: string;
}

// ─── CAPITAL GAINS / LOSSES ──────────────────────────────────

export type CapitalEventType = "resale" | "donation" | "loss" | "gifted";

export interface CapitalEvent {
  id: string;
  inventory_item_id: string;
  asin?: string;
  product_name: string;
  event_type: CapitalEventType;
  acquisition_date: string;
  acquisition_cost: number; // Cost basis
  disposition_date: string;
  disposition_amount: number; // Sale price or FMV for donation
  gain_loss: number; // disposition_amount - acquisition_cost
  holding_period_days: number;
  long_term: boolean; // > 365 days = long-term
  tax_year: number;
  tax_category: "short_term_gain" | "short_term_loss" | "long_term_gain" | "long_term_loss" | "charitable_contribution";
  notes: string;
}

// ─── DONATION TRACKING (CAPITAL CONTRIBUTION) ────────────────

export interface DonationForTax {
  id: string;
  inventory_item_id: string;
  product_name: string;
  asin?: string;
  acquisition_date: string;
  acquisition_cost: number;
  donation_date: string;
  fair_market_value: number; // FMV for tax purposes
  recipient: string; // Rental company name
  recipient_type: "business" | "charity" | "related_party";
  tax_year: number;
  tax_deductible: boolean;
  deduction_amount: number; // Usually = FMV
  form_8283_required: boolean; // If FMV > $5,000
  appraiser_name?: string;
  appraisal_date?: string;
  receipt_obtained: boolean;
  receipt_file_path?: string;
  notes: string;
}

// ─── TAX SUMMARY BY PERIOD ───────────────────────────────────

export interface TaxPeriodSummary {
  period: string; // "2025-Q1", "2025-12", "2025"
  period_type: "year" | "quarter" | "month";
  tax_year: number;
  quarter?: number;
  month?: number;
  // Income
  total_etv_vine: number; // All Vine ETV
  vine_items_completed: number;
  vine_items_pending: number;
  vine_items_overdue: number;
  // Capital Events
  short_term_gains: number;
  short_term_losses: number;
  long_term_gains: number;
  long_term_losses: number;
  net_capital_gain_loss: number;
  // Donations
  charitable_donations: number;
  donation_count: number;
  // Expenses
  business_expenses: number;
  // Net
  net_income: number;
}

// ─── TAX REPORT EXPORT ───────────────────────────────────────

export interface TaxReportExport {
  id: string;
  report_type: "etv_summary" | "1099_reconciliation" | "capital_gains" | "donations" | "full_year";
  tax_year: number;
  quarter?: number;
  month?: number;
  generated_date: string;
  export_format: "csv" | "pdf";
  file_path: string;
  record_count: number;
  total_amount: number;
  notes: string;
}

// ─── ESTIMATED TAXES (QUARTERLY) ────────────────────────────

export interface QuarterlyEstimatedTax {
  id: string;
  tax_year: number;
  quarter: number; // 1-4
  due_date: string;
  estimated_income: number;
  estimated_tax_liability: number;
  payment_amount: number;
  payment_date?: string;
  payment_method?: string;
  paid: boolean;
  notes: string;
}

// ─── TAX DEDUCTION CATEGORIES ────────────────────────────────

export const TAX_DEDUCTION_CATEGORIES = {
  SHIPPING_SUPPLIES: "Shipping & Packaging Supplies",
  OFFICE_SUPPLIES: "Office Supplies",
  EQUIPMENT: "Equipment & Software",
  PLATFORM_FEES: "Platform & Service Fees",
  PHOTOGRAPHY: "Product Photography",
  STORAGE: "Storage & Organization",
  UTILITIES: "Utilities (Home Office %)",
  INTERNET: "Internet & Phone",
  PROFESSIONAL_SERVICES: "Professional Services (Accounting, Legal)",
  ADVERTISING: "Advertising & Marketing",
  TRAVEL: "Travel & Transportation",
  MEALS: "Meals & Entertainment (50%)",
  INSURANCE: "Business Insurance",
  VEHICLE: "Vehicle Expenses",
  DEPRECIATION: "Depreciation",
  OTHER: "Other Business Expenses",
} as const;

// ─── TAX DOCUMENT STORAGE ───────────────────────────────────

export interface TaxDocument {
  id: string;
  document_type: "1099_nec" | "form_8283" | "appraisal" | "receipt" | "invoice" | "other";
  tax_year: number;
  uploaded_date: string;
  file_path: string;
  file_name: string;
  file_size: number;
  related_record_id?: string; // Links to ETV, Donation, etc.
  notes: string;
}

// ─── AUDIT TRAIL ────────────────────────────────────────────

export interface AuditTrailEntry {
  id: string;
  timestamp: string;
  action: string;
  record_type: string;
  record_id: string;
  old_value?: string;
  new_value?: string;
  user: string;
  ip_address?: string;
  notes: string;
}
