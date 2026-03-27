// ============================================================
// TAX ALERT ENGINE
// Analyzes transactions + write-offs and fires structured
// TaxAlert objects.  Covers:
//   • Write-off opportunities (auto-detected high-confidence rules)
//   • Credit-eligible purchases (Form 5695, 8936, 2106, etc.)
//   • Missing paperwork prompts
//   • Deadline proximity alerts
//
// This is the Keeper-style "I saw a purchase — do you need to
// file paperwork?" brain.  Used by TaxAlertBanner.
// ============================================================

import { getPlaidTransactions, type ClassifiedTransaction } from "@/lib/plaidClient";
import { getActiveReminderCount } from "@/lib/deadlineReminderStore";

const STORAGE_KEY = "rr-tax-alerts";

// ─── TYPES ──────────────────────────────────────────────────

export type TaxAlertType =
  | "write_off"        // transaction is likely deductible — add to write-offs
  | "credit_eligible"  // purchase may qualify for a federal/state tax credit
  | "paperwork"        // user needs to save a receipt or file a form
  | "deadline"         // a tax deadline is coming up
  | "info";            // general informational

export type TaxAlertStatus = "new" | "acknowledged" | "dismissed" | "done";

export interface TaxAlert {
  id: string;
  type: TaxAlertType;
  title: string;
  /** One-liner shown in collapsed view */
  summary: string;
  /** Full explanation with action steps */
  detail: string;
  /** Dollar amount involved, if known */
  amount?: number;
  /** IRS form to file, if applicable */
  form?: string;
  /** The transaction that triggered this alert */
  transactionId?: string;
  /** Link to open in the app (tab name, etc.) */
  actionLabel?: string;
  actionTab?: string;
  /** External URL (IRS, state program) */
  sourceUrl?: string;
  status: TaxAlertStatus;
  createdAt: string;
  /** Date the transaction occurred */
  txnDate?: string;
}

// ─── STORAGE ────────────────────────────────────────────────

function loadAlerts(): TaxAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TaxAlert[]) : [];
  } catch {
    return [];
  }
}

function saveAlerts(alerts: TaxAlert[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

function genId(): string {
  return `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── PUBLIC READ API ─────────────────────────────────────────

export function getAllAlerts(): TaxAlert[] {
  return loadAlerts();
}

export function getActiveAlerts(): TaxAlert[] {
  return loadAlerts().filter((a) => a.status === "new");
}

export function getAlertsByType(type: TaxAlertType): TaxAlert[] {
  return loadAlerts().filter((a) => a.type === type && a.status !== "dismissed");
}

export function getActiveAlertCount(): number {
  return loadAlerts().filter((a) => a.status === "new").length;
}

// ─── ALERT ACTIONS ───────────────────────────────────────────

export function acknowledgeAlert(id: string): void {
  const all = loadAlerts();
  const idx = all.findIndex((a) => a.id === id);
  if (idx !== -1) { all[idx] = { ...all[idx], status: "acknowledged" }; saveAlerts(all); }
}

export function dismissAlert(id: string): void {
  const all = loadAlerts();
  const idx = all.findIndex((a) => a.id === id);
  if (idx !== -1) { all[idx] = { ...all[idx], status: "dismissed" }; saveAlerts(all); }
}

export function markAlertDone(id: string): void {
  const all = loadAlerts();
  const idx = all.findIndex((a) => a.id === id);
  if (idx !== -1) { all[idx] = { ...all[idx], status: "done" }; saveAlerts(all); }
}

export function dismissAllAlerts(): void {
  const all = loadAlerts().map((a) => ({ ...a, status: "dismissed" as TaxAlertStatus }));
  saveAlerts(all);
}

// ─── ALERT ENGINE ────────────────────────────────────────────

/**
 * Runs the alert engine against all transactions for the given tax year.
 * Only creates alerts for transactions that don't already have one.
 * Returns the number of NEW alerts created.
 */
export function runAlertEngine(taxYear: number): number {
  const txns = getPlaidTransactions().filter(
    (t) => new Date(t.date).getFullYear() === taxYear
  );
  const existing = loadAlerts();
  const existingTxnIds = new Set(existing.map((a) => a.transactionId).filter(Boolean));

  const newAlerts: TaxAlert[] = [];

  for (const txn of txns) {
    if (existingTxnIds.has(txn.id)) continue; // already processed

    const alerts = analyzeTransaction(txn);
    newAlerts.push(...alerts);
  }

  if (newAlerts.length > 0) {
    saveAlerts([...existing, ...newAlerts]);
  }

  return newAlerts.length;
}

/** Clear all alerts and re-run from scratch. */
export function rerunAlertEngine(taxYear: number): number {
  // Keep dismissed alerts (user explicitly dismissed them)
  const kept = loadAlerts().filter((a) => a.status === "dismissed");
  saveAlerts(kept);
  return runAlertEngine(taxYear);
}

// ─── TRANSACTION ANALYZER ────────────────────────────────────

function analyzeTransaction(txn: ClassifiedTransaction): TaxAlert[] {
  const alerts: TaxAlert[] = [];
  const absAmt = Math.abs(txn.amount);
  const isExpense = txn.amount < 0;

  // ── Write-off opportunity ──────────────────────────────────
  const writeOffRule = txn.matched_rules.find(
    (r) => r.is_write_off && r.confidence === "high"
  );
  if (
    isExpense &&
    writeOffRule &&
    txn.user_classification !== "business"
  ) {
    const deductibleAmt = (absAmt * writeOffRule.write_off_percentage) / 100;
    alerts.push({
      id: genId(),
      type: "write_off",
      title: `${writeOffRule.label} — Deductible Expense`,
      summary: `$${absAmt.toFixed(2)} at ${txn.merchant_name} is likely a business write-off.`,
      detail: `This ${writeOffRule.label} purchase (${writeOffRule.write_off_percentage}% deductible) could save you ~$${(deductibleAmt * 0.25).toFixed(0)}–$${(deductibleAmt * 0.35).toFixed(0)} in taxes. Classify it as "Business" and it will automatically flow into your Expense Tracker.`,
      amount: deductibleAmt,
      transactionId: txn.id,
      txnDate: txn.date,
      actionLabel: "Classify as Business",
      actionTab: "transactions",
      status: "new",
      createdAt: new Date().toISOString(),
    });
  }

  // ── Credit-eligible purchase ───────────────────────────────
  const creditRule = txn.matched_rules.find((r) => r.credit_eligible);
  if (creditRule) {
    const estimatedCredit = estimateCreditAmount(creditRule, absAmt);
    alerts.push({
      id: genId(),
      type: "credit_eligible",
      title: `💡 Possible Tax Credit: ${creditRule.label}`,
      summary: `$${absAmt.toFixed(2)} at ${txn.merchant_name} may qualify for ${creditRule.credit_form ?? "a tax credit"}.`,
      detail: buildCreditDetail(creditRule, txn, absAmt),
      amount: estimatedCredit,
      form: creditRule.credit_form,
      transactionId: txn.id,
      txnDate: txn.date,
      actionLabel: "View Credits & Deadlines",
      actionTab: "deadlines",
      sourceUrl: getCreditSourceUrl(creditRule.credit_form),
      status: "new",
      createdAt: new Date().toISOString(),
    });
  }

  // ── Large unclassified expense (>$100) ────────────────────
  if (
    isExpense &&
    absAmt > 100 &&
    txn.user_classification === "pending" &&
    txn.matched_rules.length === 0
  ) {
    alerts.push({
      id: genId(),
      type: "paperwork",
      title: `Review: $${absAmt.toFixed(2)} at ${txn.merchant_name}`,
      summary: `Large unclassified expense — save a receipt and classify as Business or Personal.`,
      detail: `This $${absAmt.toFixed(2)} transaction on ${new Date(txn.date + "T12:00:00").toLocaleDateString()} has not been classified. If any portion is business-related, classify it now to capture the deduction. Save your receipt in the Documents tab.`,
      transactionId: txn.id,
      txnDate: txn.date,
      actionLabel: "Classify Transaction",
      actionTab: "transactions",
      status: "new",
      createdAt: new Date().toISOString(),
    });
  }

  return alerts;
}

// ─── HELPERS ─────────────────────────────────────────────────

function estimateCreditAmount(
  rule: { credit_form?: string },
  purchaseAmount: number
): number {
  const form = rule.credit_form ?? "";
  if (form.includes("5695 Part I") || form.toLowerCase().includes("solar")) {
    // 30% no cap
    return purchaseAmount * 0.3;
  }
  if (form.includes("5695 Part II") || form.toLowerCase().includes("heat pump")) {
    // 30% capped at $2,000
    return Math.min(purchaseAmount * 0.3, 2000);
  }
  if (form.includes("8936")) {
    // Max $7,500 EV credit
    return 7500;
  }
  if (form.includes("Schedule A")) {
    // Medical — estimated at 25% effective tax rate benefit
    return purchaseAmount * 0.25;
  }
  return purchaseAmount * 0.2; // generic 20% estimate
}

function buildCreditDetail(
  rule: { label: string; credit_hint?: string; credit_form?: string; confidence: string },
  txn: ClassifiedTransaction,
  absAmt: number
): string {
  const baseHint = rule.credit_hint ?? "This purchase may qualify for a tax credit.";
  const savingsEst = estimateCreditAmount(rule, absAmt);
  const savingsStr = savingsEst > 0 ? ` Estimated credit: $${savingsEst.toFixed(0)}.` : "";

  const form = rule.credit_form ?? "";
  let actionStep = "";
  if (form.includes("5695")) {
    actionStep = " Keep your contractor invoice and product model number. File Form 5695 with your return to claim the credit.";
  } else if (form.includes("8936")) {
    actionStep = " Confirm vehicle MSRP and your MAGI eligibility. The credit can be applied at the dealer (point of sale transfer) or on your return.";
  } else if (form.includes("2106")) {
    actionStep = " Document the disability necessity and file Form 2106 for impairment-related work expenses.";
  }

  const confidenceNote =
    rule.confidence === "low"
      ? " (Low confidence — review receipt to confirm this qualifies.)"
      : rule.confidence === "medium"
      ? " (Medium confidence — check the item qualifies before filing.)"
      : "";

  return `${baseHint}${savingsStr}${actionStep}${confidenceNote} Transaction: ${txn.merchant_name} on ${new Date(txn.date + "T12:00:00").toLocaleDateString()}.`;
}

function getCreditSourceUrl(form?: string): string {
  if (!form) return "https://www.irs.gov/credits-deductions";
  if (form.includes("5695")) return "https://www.irs.gov/credits-deductions/energy-efficient-home-improvement-credit";
  if (form.includes("8936")) return "https://www.irs.gov/credits-deductions/credits-for-new-clean-vehicles-purchased-in-2023-or-after";
  if (form.includes("2106")) return "https://www.irs.gov/forms-pubs/about-form-2106";
  return "https://www.irs.gov/credits-deductions";
}
