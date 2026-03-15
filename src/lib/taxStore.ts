// ============================================================
// TAX STORE & CALCULATIONS
// Handles ETV tracking, 1099 reconciliation, capital gains,
// and tax-ready report generation
// ============================================================

import type {
  ETVRecord,
  Form1099NEC,
  CapitalEvent,
  DonationForTax,
  TaxPeriodSummary,
  TaxReportExport,
  QuarterlyEstimatedTax,
  TaxDocument,
} from "./taxTypes";

const STORAGE_KEY_ETV = "reese-tax-etv-records";
const STORAGE_KEY_1099 = "reese-tax-1099-forms";
const STORAGE_KEY_CAPITAL = "reese-tax-capital-events";
const STORAGE_KEY_DONATIONS = "reese-tax-donations";
const STORAGE_KEY_DOCUMENTS = "reese-tax-documents";

// ─── DEMO DATA ───────────────────────────────────────────────

export const DEMO_ETV_RECORDS: ETVRecord[] = [
  {
    id: "etv-001",
    vine_item_id: "vine-001",
    asin: "B0D8XYZABC",
    product_name: "Anker 3-in-1 Charging Cable",
    etv_amount: 24.99,
    received_date: "2025-12-15",
    review_deadline: "2026-01-15",
    review_status: "completed",
    review_date: "2026-01-10",
    tax_year: 2025,
    tax_quarter: 4,
    reported_on_1099: true,
    amazon_1099_reference: "1099-NEC-2025-001",
    notes: "Reported on 2025 1099-NEC",
  },
  {
    id: "etv-002",
    vine_item_id: "vine-002",
    asin: "B0CXYZDEF1",
    product_name: "Wireless Mouse Ergonomic",
    etv_amount: 19.99,
    received_date: "2025-12-20",
    review_deadline: "2026-01-20",
    review_status: "completed",
    review_date: "2026-01-15",
    tax_year: 2025,
    tax_quarter: 4,
    reported_on_1099: true,
    amazon_1099_reference: "1099-NEC-2025-001",
    notes: "Reported on 2025 1099-NEC",
  },
  {
    id: "etv-003",
    vine_item_id: "vine-003",
    asin: "B0BXYZGHI2",
    product_name: "USB-C Hub 7-in-1",
    etv_amount: 34.99,
    received_date: "2026-01-05",
    review_deadline: "2026-02-05",
    review_status: "pending",
    tax_year: 2026,
    tax_quarter: 1,
    reported_on_1099: false,
    notes: "Pending review",
  },
];

export const DEMO_1099_FORM: Form1099NEC = {
  id: "1099-001",
  tax_year: 2025,
  box_1_misc_income: 89.97,
  box_1a_etv_vine: 89.97,
  received_date: "2026-01-31",
  payer_name: "Amazon.com Services LLC",
  payer_ein: "91-1646860",
  recipient_tin: "123-45-6789",
  account_number: "A12345678",
  filing_status: "received",
  app_total_etv: 89.97,
  discrepancy_amount: 0,
  discrepancy_notes: "No discrepancy - all items reconciled",
  reconciliation_date: "2026-02-15",
};

export const DEMO_CAPITAL_EVENTS: CapitalEvent[] = [
  {
    id: "cap-001",
    inventory_item_id: "inv-001",
    product_name: "Ring Video Doorbell 4",
    event_type: "resale",
    acquisition_date: "2025-10-15",
    acquisition_cost: 149.99,
    disposition_date: "2026-02-01",
    disposition_amount: 120.0,
    gain_loss: -29.99,
    holding_period_days: 109,
    long_term: false,
    tax_year: 2026,
    tax_category: "short_term_loss",
    notes: "Sold on Facebook Marketplace",
  },
];

export const DEMO_DONATIONS: DonationForTax[] = [
  {
    id: "don-001",
    inventory_item_id: "inv-002",
    product_name: "Ninja Creami Ice Cream Maker",
    acquisition_date: "2025-08-10",
    acquisition_cost: 199.99,
    donation_date: "2026-02-15",
    fair_market_value: 175.0,
    recipient: "Reese's Rental Company",
    recipient_type: "related_party",
    tax_year: 2026,
    tax_deductible: true,
    deduction_amount: 175.0,
    form_8283_required: false,
    receipt_obtained: true,
    notes: "Capital contribution to rental company after 6+ months",
  },
];

// ─── ETV STORAGE ─────────────────────────────────────────────

export function getETVRecords(): ETVRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ETV);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEMO_ETV_RECORDS;
}

export function saveETVRecords(records: ETVRecord[]): void {
  localStorage.setItem(STORAGE_KEY_ETV, JSON.stringify(records));
}

export function addETVRecord(record: ETVRecord): void {
  const records = getETVRecords();
  records.push(record);
  saveETVRecords(records);
}

export function updateETVRecord(id: string, updates: Partial<ETVRecord>): void {
  const records = getETVRecords();
  const idx = records.findIndex((r) => r.id === id);
  if (idx !== -1) {
    records[idx] = { ...records[idx], ...updates };
    saveETVRecords(records);
  }
}

// ─── 1099 RECONCILIATION ─────────────────────────────────────

export function get1099Forms(): Form1099NEC[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_1099);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [DEMO_1099_FORM];
}

export function save1099Form(form: Form1099NEC): void {
  const forms = get1099Forms().filter((f) => f.id !== form.id);
  forms.push(form);
  localStorage.setItem(STORAGE_KEY_1099, JSON.stringify(forms));
}

export function reconcile1099(form: Form1099NEC): void {
  const records = getETVRecords().filter((r) => r.tax_year === form.tax_year);
  const appTotal = records.reduce((sum, r) => sum + r.etv_amount, 0);
  const discrepancy = form.box_1a_etv_vine - appTotal;

  const updated: Form1099NEC = {
    ...form,
    app_total_etv: appTotal,
    discrepancy_amount: discrepancy,
    filing_status: discrepancy === 0 ? "reconciled" : "discrepancy",
    reconciliation_date: new Date().toISOString().split("T")[0],
  };

  save1099Form(updated);
}

// ─── CAPITAL GAINS/LOSSES ───────────────────────────────────

export function getCapitalEvents(): CapitalEvent[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CAPITAL);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEMO_CAPITAL_EVENTS;
}

export function saveCapitalEvents(events: CapitalEvent[]): void {
  localStorage.setItem(STORAGE_KEY_CAPITAL, JSON.stringify(events));
}

export function addCapitalEvent(event: CapitalEvent): void {
  const events = getCapitalEvents();
  events.push(event);
  saveCapitalEvents(events);
}

// ─── DONATIONS ───────────────────────────────────────────────

export function getDonations(): DonationForTax[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_DONATIONS);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEMO_DONATIONS;
}

export function saveDonations(donations: DonationForTax[]): void {
  localStorage.setItem(STORAGE_KEY_DONATIONS, JSON.stringify(donations));
}

export function addDonation(donation: DonationForTax): void {
  const donations = getDonations();
  donations.push(donation);
  saveDonations(donations);
}

// ─── TAX CALCULATIONS ────────────────────────────────────────

export function calculateTaxPeriodSummary(
  taxYear: number,
  quarter?: number,
  month?: number
): TaxPeriodSummary {
  let etvRecords = getETVRecords().filter((r) => r.tax_year === taxYear);
  let capitalEvents = getCapitalEvents().filter((e) => e.tax_year === taxYear);
  let donations = getDonations().filter((d) => d.tax_year === taxYear);

  if (quarter) {
    etvRecords = etvRecords.filter((r) => r.tax_quarter === quarter);
    capitalEvents = capitalEvents.filter((e) => {
      const q = new Date(e.disposition_date).getMonth() / 3 + 1;
      return Math.floor(q) === quarter;
    });
    donations = donations.filter((d) => {
      const q = new Date(d.donation_date).getMonth() / 3 + 1;
      return Math.floor(q) === quarter;
    });
  }

  if (month) {
    etvRecords = etvRecords.filter((r) => {
      const m = new Date(r.received_date).getMonth() + 1;
      return m === month;
    });
    capitalEvents = capitalEvents.filter((e) => {
      const m = new Date(e.disposition_date).getMonth() + 1;
      return m === month;
    });
    donations = donations.filter((d) => {
      const m = new Date(d.donation_date).getMonth() + 1;
      return m === month;
    });
  }

  const totalETV = etvRecords.reduce((sum, r) => sum + r.etv_amount, 0);
  const completedCount = etvRecords.filter((r) => r.review_status === "completed").length;
  const pendingCount = etvRecords.filter((r) => r.review_status === "pending").length;
  const overdueCount = etvRecords.filter((r) => r.review_status === "overdue").length;

  const shortTermGains = capitalEvents
    .filter((e) => e.tax_category === "short_term_gain")
    .reduce((sum, e) => sum + e.gain_loss, 0);
  const shortTermLosses = capitalEvents
    .filter((e) => e.tax_category === "short_term_loss")
    .reduce((sum, e) => sum + e.gain_loss, 0);
  const longTermGains = capitalEvents
    .filter((e) => e.tax_category === "long_term_gain")
    .reduce((sum, e) => sum + e.gain_loss, 0);
  const longTermLosses = capitalEvents
    .filter((e) => e.tax_category === "long_term_loss")
    .reduce((sum, e) => sum + e.gain_loss, 0);
  const netCapitalGainLoss = shortTermGains + shortTermLosses + longTermGains + longTermLosses;

  const charitableDonations = donations
    .filter((d) => d.tax_deductible)
    .reduce((sum, d) => sum + d.deduction_amount, 0);

  const period = month ? `${taxYear}-${String(month).padStart(2, "0")}` : quarter ? `${taxYear}-Q${quarter}` : `${taxYear}`;

  return {
    period,
    period_type: month ? "month" : quarter ? "quarter" : "year",
    tax_year: taxYear,
    quarter,
    month,
    total_etv_vine: totalETV,
    vine_items_completed: completedCount,
    vine_items_pending: pendingCount,
    vine_items_overdue: overdueCount,
    short_term_gains: shortTermGains,
    short_term_losses: shortTermLosses,
    long_term_gains: longTermGains,
    long_term_losses: longTermLosses,
    net_capital_gain_loss: netCapitalGainLoss,
    charitable_donations: charitableDonations,
    donation_count: donations.length,
    business_expenses: 0, // Calculated from bank transactions
    net_income: totalETV + netCapitalGainLoss - charitableDonations,
  };
}

// ─── TAX REPORT GENERATION ───────────────────────────────────

export function generateETVSummaryCSV(taxYear: number): string {
  const records = getETVRecords().filter((r) => r.tax_year === taxYear);

  let csv = "ASIN,Product Name,ETV Amount,Received Date,Review Status,Review Date,Reported on 1099\n";
  records.forEach((r) => {
    csv += `"${r.asin}","${r.product_name}",${r.etv_amount},"${r.received_date}","${r.review_status}","${r.review_date || ""}","${r.reported_on_1099}"\n`;
  });

  return csv;
}

export function generateCapitalGainsCSV(taxYear: number): string {
  const events = getCapitalEvents().filter((e) => e.tax_year === taxYear);

  let csv = "Product Name,Event Type,Acquisition Date,Acquisition Cost,Disposition Date,Disposition Amount,Gain/Loss,Holding Period,Long-term,Tax Category\n";
  events.forEach((e) => {
    csv += `"${e.product_name}","${e.event_type}","${e.acquisition_date}",${e.acquisition_cost},"${e.disposition_date}",${e.disposition_amount},${e.gain_loss},${e.holding_period_days},"${e.long_term}","${e.tax_category}"\n`;
  });

  return csv;
}

export function generateDonationCSV(taxYear: number): string {
  const donations = getDonations().filter((d) => d.tax_year === taxYear);

  let csv = "Product Name,Acquisition Cost,Donation Date,Fair Market Value,Recipient,Tax Deductible,Deduction Amount,Form 8283 Required\n";
  donations.forEach((d) => {
    csv += `"${d.product_name}",${d.acquisition_cost},"${d.donation_date}",${d.fair_market_value},"${d.recipient}","${d.tax_deductible}",${d.deduction_amount},"${d.form_8283_required}"\n`;
  });

  return csv;
}

// ─── 1099 RECONCILIATION REPORT ──────────────────────────────

export function generate1099ReconciliationReport(taxYear: number): string {
  const forms = get1099Forms().filter((f) => f.tax_year === taxYear);
  const records = getETVRecords().filter((r) => r.tax_year === taxYear);

  let report = `1099-NEC RECONCILIATION REPORT\nTax Year: ${taxYear}\nGenerated: ${new Date().toISOString().split("T")[0]}\n\n`;

  forms.forEach((form) => {
    report += `Payer: ${form.payer_name}\n`;
    report += `Box 1a (ETV - Vine): $${form.box_1a_etv_vine.toFixed(2)}\n`;
    report += `App Calculated Total: $${form.app_total_etv.toFixed(2)}\n`;
    report += `Discrepancy: $${form.discrepancy_amount.toFixed(2)}\n`;
    report += `Status: ${form.filing_status}\n\n`;
  });

  report += `\nDETAIL BY ITEM:\n`;
  report += `ASIN,Product,ETV,Received Date,Review Status,Reported\n`;
  records.forEach((r) => {
    report += `${r.asin},"${r.product_name}",${r.etv_amount},"${r.received_date}","${r.review_status}","${r.reported_on_1099}"\n`;
  });

  return report;
}

// ─── DOCUMENT STORAGE ────────────────────────────────────────

export function getTaxDocuments(): TaxDocument[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_DOCUMENTS);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export function saveTaxDocument(doc: TaxDocument): void {
  const docs = getTaxDocuments();
  docs.push(doc);
  localStorage.setItem(STORAGE_KEY_DOCUMENTS, JSON.stringify(docs));
}

// ─── FULL YEAR TAX REPORT EXPORT ─────────────────────────────

export function generateTaxReportExport(taxYear: number): {
  tax_year: number;
  generated: string;
  etv_summary: ReturnType<typeof calculateTaxPeriodSummary>;
  etv_records: ReturnType<typeof getETVRecords>;
  forms_1099: ReturnType<typeof get1099Forms>;
  capital_events: ReturnType<typeof getCapitalEvents>;
  donations: ReturnType<typeof getDonations>;
  total_resale_income: number;
  total_rental_income: number;
} {
  const etvRecords = getETVRecords().filter((r) => r.tax_year === taxYear);
  const capitalEvents = getCapitalEvents().filter((e) => e.tax_year === taxYear);
  const resaleIncome = capitalEvents
    .filter((e) => e.event_type === "resale" && e.gain_loss > 0)
    .reduce((s, e) => s + e.disposition_amount, 0);

  return {
    tax_year: taxYear,
    generated: new Date().toISOString(),
    etv_summary: calculateTaxPeriodSummary(taxYear),
    etv_records: etvRecords,
    forms_1099: get1099Forms().filter((f) => f.tax_year === taxYear),
    capital_events: capitalEvents,
    donations: getDonations().filter((d) => d.tax_year === taxYear),
    total_resale_income: resaleIncome,
    total_rental_income: 0, // Populated from IncomeSourceManager
  };
}
