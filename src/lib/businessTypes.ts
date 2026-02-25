// ============================================================
// REESE REVIEWS — BUSINESS PLATFORM TYPES
// All Rights Reserved — Audrey Evans / GlowStar Labs
// ============================================================

// ─── AMAZON ORDERS ──────────────────────────────────────────

export type AmazonOrderStatus = "pending" | "shipped" | "delivered" | "returned";

export interface AmazonOrder {
  id: string;
  amazon_order_id: string;
  asin: string;
  product_name: string;
  category: string;
  image_url: string;
  purchase_date: string;
  price: number;
  quantity: number;
  status: AmazonOrderStatus;
  review_status: "not_reviewed" | "draft" | "published";
  review_id?: string;
  affiliate_link?: string;
  source: "purchased" | "vine";
}

// ─── AMAZON VINE ─────────────────────────────────────────────

export type VineReviewStatus = "pending" | "in_progress" | "submitted" | "published" | "overdue";

export interface VineItem {
  id: string;
  asin: string;
  product_name: string;
  category: string;
  image_url: string;
  received_date: string;
  review_deadline: string;
  estimated_value: number;
  review_status: VineReviewStatus;
  review_id?: string;
  vine_enrollment_date: string;
  notes: string;
  template_used: boolean;
}

// ─── INVENTORY ───────────────────────────────────────────────

export type InventoryStatus =
  | "in_use"
  | "reviewed"
  | "ready_to_resell"
  | "listed_for_sale"
  | "sold"
  | "donated"
  | "rented_out"
  | "returned_from_rental";

export type InventorySource = "purchased" | "vine" | "gifted" | "sample";

export interface InventoryItem {
  id: string;
  product_name: string;
  asin?: string;
  category: string;
  image_url: string;
  source: InventorySource;
  acquisition_date: string;
  acquisition_cost: number;
  estimated_value: number;
  status: InventoryStatus;
  review_id?: string;
  reviewed_date?: string;
  // Resale
  sale_price?: number;
  sale_date?: string;
  sale_platform?: string;
  // Rental
  rental_company?: string;
  rental_start_date?: string;
  rental_end_date?: string;
  rental_income?: number;
  // Donation (capital contribution)
  donation_date?: string;
  donation_value?: number;
  donation_recipient?: string;
  // Tax
  tax_deductible: boolean;
  tax_category?: string;
  notes: string;
}

// ─── RESALE & RENTAL ─────────────────────────────────────────

export type TransactionType = "sale" | "rental";

export interface ResaleRentalTransaction {
  id: string;
  inventory_item_id: string;
  product_name: string;
  type: TransactionType;
  amount: number;
  date: string;
  platform?: string;
  rental_company?: string;
  rental_period_days?: number;
  notes: string;
  tax_reported: boolean;
}

// ─── PLAID / BANKING ─────────────────────────────────────────

export type PlaidConnectionStatus = "connected" | "disconnected" | "pending" | "error";

export interface PlaidAccount {
  id: string;
  plaid_account_id: string;
  institution_name: string;
  account_name: string;
  account_type: "checking" | "savings" | "credit" | "investment";
  mask: string;
  balance_current: number;
  balance_available: number;
  currency: string;
  status: PlaidConnectionStatus;
  last_synced: string;
}

export type TransactionCategory =
  | "income_resale"
  | "income_rental"
  | "income_affiliate"
  | "income_other"
  | "expense_shipping"
  | "expense_supplies"
  | "expense_platform_fees"
  | "expense_equipment"
  | "expense_other"
  | "transfer"
  | "uncategorized";

export interface BankTransaction {
  id: string;
  plaid_transaction_id: string;
  account_id: string;
  date: string;
  amount: number; // positive = income, negative = expense
  merchant_name: string;
  description: string;
  category: TransactionCategory;
  tax_deductible: boolean;
  tax_write_off_category?: string;
  notes: string;
  is_manual: boolean;
}

// ─── FINANCIAL SUMMARY ───────────────────────────────────────

export interface FinancialSummary {
  period: string;
  total_revenue: number;
  revenue_resale: number;
  revenue_rental: number;
  revenue_affiliate: number;
  total_expenses: number;
  expense_shipping: number;
  expense_supplies: number;
  expense_platform_fees: number;
  expense_other: number;
  net_profit: number;
  tax_write_offs: number;
  donated_value: number;
  pending_tax_items: number;
}

// ─── DONATION RECORD ─────────────────────────────────────────

export interface DonationRecord {
  id: string;
  inventory_item_id: string;
  product_name: string;
  donation_date: string;
  fair_market_value: number;
  recipient: string;
  recipient_type: "rental_company" | "charity" | "individual";
  tax_year: number;
  receipt_obtained: boolean;
  notes: string;
}
