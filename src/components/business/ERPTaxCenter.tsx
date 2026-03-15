// ============================================================
// ERP TAX CENTER — FULL ENTERPRISE RESOURCE PLANNING MODULE
// Reese Reviews · GlowStar Labs
//
// Architecture (Vine-First):
//   DEFAULT TAB: "vine" — ETV tracking, 1099 reconciliation
//   Sub-tabs:
//     vine        → Vine ETV overview + 1099 reconciliation (PRIMARY)
//     bank        → Plaid bank account linking
//     transactions→ Transaction scanner + write-off detection
//     expenses    → ExpenseTracker (Keeper-like)
//     forms       → PDFiller + TaxFormViewer
//     accounting  → Odoo integration
//     documents   → Tax document upload/manage
//     quarterly   → Quarterly estimated tax payments
//     people      → Multi-person tax profiles
//     audit       → Audit trail + export
//
// All existing components are imported and reused — no duplication.
// ============================================================

import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  Leaf,
  DollarSign,
  Link2,
  Zap,
  Receipt,
  FileText,
  Building2,
  Upload,
  Calendar,
  Users,
  ShieldCheck,
  Download,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Info,
  RefreshCw,
  Package,
  BarChart3,
  ChevronRight,
  Clock,
  Loader2,
} from "lucide-react";

// ── Existing stores (lib) ─────────────────────────────────────
import {
  getETVRecords,
  get1099Forms,
  save1099Form,
  reconcile1099,
  getCapitalEvents,
  getDonations,
  calculateTaxPeriodSummary,
  generateTaxReportExport,
} from "@/lib/taxStore";
import type { ETVRecord, Form1099NEC, CapitalEvent } from "@/lib/taxTypes";
import { getExpenses, getWriteOffSummary, generateWriteOffCSV } from "@/lib/expenseStore";

// ── Plaid client ──────────────────────────────────────────────
import { getPlaidDeductionSummary, getPlaidAccounts, getPlaidTransactions } from "@/lib/plaidClient";

// ── Portable tax store (stores/) ─────────────────────────────
import {
  getPersons,
  computeIncomeSummary,
  getTaxDocuments,
  getQuarterlyEstimates,
  upsertQuarterlyEstimate,
  estimateTaxSavings,
  determineRequiredForms,
  currentTaxYear,
  genId,
  IRS_FORM_META,
  TAX_BRAND,
  addPerson,
  deletePerson,
  getIncomeSources,
} from "@/stores/taxStore";
import type { TaxPerson, QuarterlyEstimate } from "@/stores/taxStore";

// ── Sub-components (existing + new) ──────────────────────────
import { IncomeSourceManager } from "./IncomeSourceManager";
import { TaxDocumentUpload } from "./TaxDocumentUpload";
import { TaxFormViewer } from "./TaxFormViewer";
import { PlaidBankConnect } from "./PlaidBankConnect";
import { TransactionScanner } from "./TransactionScanner";
import { ExpenseTracker } from "@/components/ExpenseTracker";
import { OdooIntegration } from "@/components/OdooIntegration";
import { PDFillerIntegration } from "@/components/PDFillerIntegration";
import { IndustryWriteOffHelper } from "./IndustryWriteOffHelper";

// ─── BRAND ───────────────────────────────────────────────────
const BRAND = {
  ...TAX_BRAND,
  vine: "#7C3AED",
  green: "#4ade80",
};

// ─── QUARTERLY DUE DATES ─────────────────────────────────────
const QUARTERLY_DUE_DATES: Record<1 | 2 | 3 | 4, string> = {
  1: "April 15",
  2: "June 17",
  3: "September 16",
  4: "January 15",
};

// ─── VINE ETV OVERVIEW ───────────────────────────────────────
// This is the PRIMARY view — the first thing users see in Tax Center.

function VineETVOverview({ taxYear }: { taxYear: number }) {
  const [etvRecords, setEtvRecords] = useState<ETVRecord[]>(() =>
    getETVRecords().filter((r) => r.tax_year === taxYear)
  );
  const [forms1099, setForms1099] = useState<Form1099NEC[]>(() =>
    get1099Forms().filter((f) => f.tax_year === taxYear)
  );
  const [capitalEvents] = useState<CapitalEvent[]>(() =>
    getCapitalEvents().filter((e) => e.tax_year === taxYear)
  );

  const periodSummary = calculateTaxPeriodSummary(taxYear);
  const plaidSummary = getPlaidDeductionSummary(taxYear);
  const expenseSummary = getWriteOffSummary(taxYear);

  // ETV stats
  const totalETV = etvRecords.reduce((s, r) => s + r.etv_amount, 0);
  const reportedETV = etvRecords.filter((r) => r.reported_on_1099).reduce((s, r) => s + r.etv_amount, 0);
  const pendingETV = etvRecords.filter((r) => !r.reported_on_1099).reduce((s, r) => s + r.etv_amount, 0);
  const pendingReviews = etvRecords.filter((r) => r.review_status === "pending").length;
  const overdueReviews = etvRecords.filter((r) => r.review_status === "overdue").length;

  // 1099 reconciliation
  const form1099 = forms1099[0] ?? null;
  const reconciled = form1099?.filing_status === "reconciled";
  const discrepancy = form1099?.discrepancy_amount ?? 0;

  // Inline 1099 edit state
  const [editing1099, setEditing1099] = useState(false);
  const [draft1099, setDraft1099] = useState({ box_1a: "", received_date: "", account_number: "", recipient_tin: "" });
  const [draft1099Error, setDraft1099Error] = useState("");

  const handleSave1099 = () => {
    if (!form1099) return;
    const amount = parseFloat(draft1099.box_1a);
    if (isNaN(amount) || amount < 0) {
      setDraft1099Error("Please enter a valid dollar amount (e.g. 89.97).");
      return;
    }
    setDraft1099Error("");
    const updated: Form1099NEC = {
      ...form1099,
      box_1_misc_income: amount,
      box_1a_etv_vine: amount,
      received_date: draft1099.received_date || form1099.received_date,
      account_number: draft1099.account_number || form1099.account_number,
      recipient_tin: draft1099.recipient_tin || form1099.recipient_tin,
      filing_status: "received",
    };
    save1099Form(updated);
    // immediately reconcile so discrepancy is recalculated
    reconcile1099(updated);
    setForms1099(get1099Forms().filter((f) => f.tax_year === taxYear));
    setEditing1099(false);
  };

  // Capital events
  const totalGains = capitalEvents.filter((e) => e.gain_loss > 0).reduce((s, e) => s + e.gain_loss, 0);
  const totalLosses = capitalEvents.filter((e) => e.gain_loss < 0).reduce((s, e) => s + Math.abs(e.gain_loss), 0);

  // Net tax position
  const totalIncome = totalETV + (periodSummary.net_capital_gain_loss > 0 ? periodSummary.net_capital_gain_loss : 0);
  const totalDeductions = (expenseSummary.write_off_amount ?? 0) + plaidSummary.total_deductible_amount;
  const netTaxableIncome = totalIncome - totalDeductions;
  const estimatedTaxOwed = netTaxableIncome > 0 ? netTaxableIncome * 0.25 : 0;

  // ETV by quarter chart data
  const etvByQuarter = [1, 2, 3, 4].map((q) => ({
    quarter: `Q${q}`,
    etv: etvRecords.filter((r) => r.tax_quarter === q).reduce((s, r) => s + r.etv_amount, 0),
    reported: etvRecords.filter((r) => r.tax_quarter === q && r.reported_on_1099).reduce((s, r) => s + r.etv_amount, 0),
  }));

  const handleReconcile = () => {
    if (!form1099) return;
    reconcile1099(form1099);
    setForms1099(get1099Forms().filter((f) => f.tax_year === taxYear));
  };

  const handleExportTaxReport = () => {
    const report = generateTaxReportExport(taxYear);
    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Tax_Report_${taxYear}.json`;
    a.click();
  };

  const handleExportExpenseCSV = () => {
    const csv = generateWriteOffCSV(taxYear);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Write_Offs_${taxYear}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* ── Vine ETV Hero ─────────────────────────────────── */}
      <div
        className="p-6 rounded-2xl border"
        style={{
          background: `linear-gradient(135deg, ${BRAND.vine}18 0%, ${BRAND.amber}10 100%)`,
          borderColor: `${BRAND.vine}44`,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div
              className="p-3 rounded-xl"
              style={{ background: `${BRAND.vine}30`, border: `1px solid ${BRAND.vine}60` }}
            >
              <Leaf className="w-7 h-7" style={{ color: "#a78bfa" }} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Amazon Vine ETV</h3>
              <p className="text-gray-400 text-sm">
                Estimated Tax Value · Tax Year {taxYear} · IRS 1099-NEC Reporting
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportExpenseCSV}
              className="border-white/20 text-gray-300 hover:bg-white/10 text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Write-Offs CSV
            </Button>
            <Button
              size="sm"
              onClick={handleExportTaxReport}
              className="font-bold text-black text-xs"
              style={{ background: BRAND.amber }}
            >
              <Download className="w-3 h-3 mr-1" />
              Tax Package
            </Button>
          </div>
        </div>

        {/* ETV KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total ETV Income",   value: `$${totalETV.toFixed(2)}`,     color: "#a78bfa", icon: <Leaf className="w-4 h-4" /> },
            { label: "Reported on 1099",   value: `$${reportedETV.toFixed(2)}`,  color: BRAND.green, icon: <CheckCircle2 className="w-4 h-4" /> },
            { label: "Pending Reporting",  value: `$${pendingETV.toFixed(2)}`,   color: BRAND.amber, icon: <Clock className="w-4 h-4" /> },
            { label: "Reviews Pending",    value: `${pendingReviews + overdueReviews}`, color: overdueReviews > 0 ? BRAND.crimson : BRAND.volt, icon: <Package className="w-4 h-4" /> },
          ].map((kpi) => (
            <div key={kpi.label} className="p-3 rounded-xl bg-black/20 border border-white/10">
              <div className="flex items-center gap-1.5 mb-1">
                <span style={{ color: kpi.color }}>{kpi.icon}</span>
                <p className="text-gray-400 text-xs">{kpi.label}</p>
              </div>
              <p className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 1099 Reconciliation ───────────────────────────── */}
      {form1099 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <FileText className="w-4 h-4" style={{ color: BRAND.amber }} />
                1099-NEC Reconciliation
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    reconciled
                      ? "bg-green-600/20 text-green-400 border-green-600/30"
                      : discrepancy !== 0
                      ? "bg-red-600/20 text-red-400 border-red-600/30"
                      : "bg-yellow-600/20 text-yellow-400 border-yellow-600/30"
                  }
                >
                  {reconciled ? "Reconciled" : discrepancy !== 0 ? "Discrepancy" : "Pending"}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!editing1099 && form1099) {
                      setDraft1099({
                        box_1a: String(form1099.box_1a_etv_vine),
                        received_date: form1099.received_date,
                        account_number: form1099.account_number ?? "",
                        recipient_tin: form1099.recipient_tin,
                      });
                      setDraft1099Error("");
                    }
                    setEditing1099((v) => !v);
                  }}
                  className="text-xs border-white/20 text-gray-300 hover:text-white"
                >
                  {editing1099 ? "Cancel" : "Enter My 1099"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Inline 1099 entry form */}
            {editing1099 && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
                <p className="text-amber-300 text-xs font-semibold uppercase tracking-wide">
                  Enter what your Amazon 1099-NEC says
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-gray-300 text-xs">Box 1 — Nonemployee Compensation ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft1099.box_1a}
                      onChange={(e) => setDraft1099((d) => ({ ...d, box_1a: e.target.value }))}
                      placeholder="e.g. 89.97"
                      className="bg-black/30 border-white/20 text-white text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-300 text-xs">Date Received</Label>
                    <Input
                      type="date"
                      value={draft1099.received_date}
                      onChange={(e) => setDraft1099((d) => ({ ...d, received_date: e.target.value }))}
                      className="bg-black/30 border-white/20 text-white text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-300 text-xs">Account Number (optional)</Label>
                    <Input
                      value={draft1099.account_number}
                      onChange={(e) => setDraft1099((d) => ({ ...d, account_number: e.target.value }))}
                      placeholder="e.g. A12345678"
                      className="bg-black/30 border-white/20 text-white text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-300 text-xs">Your SSN / TIN (for your records)</Label>
                    <Input
                      value={draft1099.recipient_tin}
                      onChange={(e) => setDraft1099((d) => ({ ...d, recipient_tin: e.target.value }))}
                      placeholder="XXX-XX-XXXX"
                      className="bg-black/30 border-white/20 text-white text-sm"
                    />
                  </div>
                </div>
                {draft1099Error && (
                  <p className="text-red-400 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {draft1099Error}
                  </p>
                )}
                <Button
                  size="sm"
                  onClick={handleSave1099}
                  disabled={!draft1099.box_1a}
                  className="font-bold text-black text-xs w-full"
                  style={{ background: BRAND.amber }}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Save & Reconcile
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Amazon Reports (Box 1a)", value: `$${form1099.box_1a_etv_vine.toFixed(2)}`, color: BRAND.amber },
                { label: "App Total ETV",           value: `$${form1099.app_total_etv.toFixed(2)}`,   color: "#a78bfa" },
                { label: "Discrepancy",             value: `$${Math.abs(discrepancy).toFixed(2)}`,    color: discrepancy === 0 ? BRAND.green : BRAND.crimson },
                { label: "Payer EIN",               value: form1099.payer_ein,                        color: "#9ca3af" },
              ].map((s) => (
                <div key={s.label} className="p-3 rounded-lg bg-white/5">
                  <p className="text-gray-500 text-xs">{s.label}</p>
                  <p className="font-bold text-sm" style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>

            {discrepancy !== 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-300 text-xs">
                  <strong>Discrepancy of ${Math.abs(discrepancy).toFixed(2)}</strong> detected.
                  Amazon reports ${form1099.box_1a_etv_vine.toFixed(2)} but your app tracked
                  ${form1099.app_total_etv.toFixed(2)}. Review your ETV records to identify
                  missing or duplicate items before filing.
                </p>
              </div>
            )}

            {!reconciled && !editing1099 && (
              <Button
                size="sm"
                onClick={handleReconcile}
                className="font-bold text-black text-xs"
                style={{ background: BRAND.amber }}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Run Reconciliation
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Net Tax Position ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4" style={{ color: BRAND.amber }} />
              Net Tax Position {taxYear}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Vine ETV Income",          value: totalETV,          color: "#a78bfa", sign: "+" },
              { label: "Capital Gains",             value: totalGains,        color: BRAND.amber, sign: "+" },
              { label: "Business Write-Offs",       value: expenseSummary.write_off_amount ?? 0, color: BRAND.green, sign: "-" },
              { label: "Bank-Imported Deductions",  value: plaidSummary.total_deductible_amount, color: BRAND.green, sign: "-" },
              { label: "Capital Losses",            value: totalLosses,       color: BRAND.green, sign: "-" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{row.label}</span>
                <span style={{ color: row.color }}>
                  {row.sign}${row.value.toFixed(2)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-white font-bold text-sm">Net Taxable Income</span>
              <span
                className="font-bold text-base"
                style={{ color: netTaxableIncome > 0 ? BRAND.crimson : BRAND.green }}
              >
                ${netTaxableIncome.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Est. Tax Owed (25%)</span>
              <span className="font-bold text-base" style={{ color: BRAND.amber }}>
                ${estimatedTaxOwed.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ETV by Quarter chart */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Leaf className="w-4 h-4" style={{ color: "#a78bfa" }} />
              ETV by Quarter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={etvByQuarter} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="quarter" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: "#1e1b4b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  formatter={(v: number) => `$${v.toFixed(2)}`}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
                <Bar dataKey="etv"      name="Total ETV"    fill="#a78bfa" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reported" name="Reported"     fill={BRAND.green} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── ETV Item List ─────────────────────────────────── */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Package className="w-4 h-4" style={{ color: "#a78bfa" }} />
              Vine ETV Records ({etvRecords.length} items)
            </CardTitle>
            <p className="text-gray-400 text-xs">
              Total: <span style={{ color: "#a78bfa" }}>${totalETV.toFixed(2)}</span>
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {etvRecords.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">
              No ETV records for {taxYear}. Add Vine items to start tracking.
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {etvRecords.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{r.product_name}</p>
                    <p className="text-gray-500 text-xs">
                      ASIN: {r.asin} · Q{r.tax_quarter} · Received {r.received_date}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="font-bold text-sm" style={{ color: "#a78bfa" }}>
                      ${r.etv_amount.toFixed(2)}
                    </p>
                    <Badge
                      className={
                        r.reported_on_1099
                          ? "bg-green-600/20 text-green-400 border-green-600/30 text-xs"
                          : r.review_status === "overdue"
                          ? "bg-red-600/20 text-red-400 border-red-600/30 text-xs"
                          : "bg-yellow-600/20 text-yellow-400 border-yellow-600/30 text-xs"
                      }
                    >
                      {r.reported_on_1099 ? "Reported" : r.review_status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Capital Events ────────────────────────────────── */}
      {capitalEvents.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: BRAND.gold }} />
              Capital Events (Resales & Donations)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {capitalEvents.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5"
                >
                  <div>
                    <p className="text-white text-sm font-medium">{e.product_name}</p>
                    <p className="text-gray-500 text-xs capitalize">
                      {e.event_type} · {e.disposition_date} · {e.long_term ? "Long-term" : "Short-term"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="font-bold text-sm"
                      style={{ color: e.gain_loss >= 0 ? BRAND.crimson : BRAND.green }}
                    >
                      {e.gain_loss >= 0 ? "+" : ""}${e.gain_loss.toFixed(2)}
                    </p>
                    <p className="text-gray-500 text-xs capitalize">{e.tax_category.replace(/_/g, " ")}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Disclaimer ────────────────────────────────────── */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
        <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
        <p className="text-gray-500 text-xs">
          Amazon Vine income (ETV) is reported on IRS Form 1099-NEC as non-employee compensation.
          All Vine items received must be reported regardless of whether a review was written.
          Consult a licensed CPA for official tax preparation. IRS Free File: irs.gov/freefile.
        </p>
      </div>
    </div>
  );
}

// ─── QUARTERLY TRACKER ───────────────────────────────────────
function QuarterlyTracker({ taxYear }: { taxYear: number }) {
  const persons = getPersons();
  const [selectedPersonId, setSelectedPersonId] = useState(persons[0]?.id ?? "");
  const [estimates, setEstimates] = useState<QuarterlyEstimate[]>(() =>
    getQuarterlyEstimates(selectedPersonId, taxYear)
  );

  const refreshEstimates = (personId: string) => {
    setEstimates(getQuarterlyEstimates(personId, taxYear));
  };

  const handleTogglePaid = (quarter: 1 | 2 | 3 | 4) => {
    const existing = estimates.find((e) => e.person_id === selectedPersonId && e.quarter === quarter);
    const updated: QuarterlyEstimate = existing
      ? { ...existing, paid: !existing.paid, paid_date: !existing.paid ? new Date().toISOString().slice(0, 10) : undefined }
      : {
          id: genId("qe"),
          person_id: selectedPersonId,
          tax_year: taxYear,
          quarter,
          due_date: QUARTERLY_DUE_DATES[quarter],
          estimated_income: 0,
          estimated_tax_owed: 0,
          amount_paid: 0,
          paid: true,
          paid_date: new Date().toISOString().slice(0, 10),
          notes: "",
        };
    upsertQuarterlyEstimate(updated);
    refreshEstimates(selectedPersonId);
  };

  const handleAmountChange = (quarter: 1 | 2 | 3 | 4, amount: string) => {
    const existing = estimates.find((e) => e.person_id === selectedPersonId && e.quarter === quarter);
    const updated: QuarterlyEstimate = existing
      ? { ...existing, amount_paid: parseFloat(amount) || 0 }
      : {
          id: genId("qe"),
          person_id: selectedPersonId,
          tax_year: taxYear,
          quarter,
          due_date: QUARTERLY_DUE_DATES[quarter],
          estimated_income: 0,
          estimated_tax_owed: 0,
          amount_paid: parseFloat(amount) || 0,
          paid: false,
          notes: "",
        };
    upsertQuarterlyEstimate(updated);
    refreshEstimates(selectedPersonId);
  };

  const totalPaid = estimates.reduce((a, e) => a + e.amount_paid, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {persons.map((p) => (
          <button
            key={p.id}
            onClick={() => { setSelectedPersonId(p.id); refreshEstimates(p.id); }}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={
              selectedPersonId === p.id
                ? { background: BRAND.volt, color: "#000" }
                : { background: "rgba(255,255,255,0.1)", color: "#ccc" }
            }
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {([1, 2, 3, 4] as const).map((q) => {
          const est = estimates.find((e) => e.person_id === selectedPersonId && e.quarter === q);
          const isPaid = est?.paid ?? false;
          const amount = est?.amount_paid ?? 0;
          return (
            <div
              key={q}
              className="p-4 rounded-xl border transition-all"
              style={{
                background: isPaid ? "#4ade8011" : `${BRAND.volt}11`,
                borderColor: isPaid ? "#4ade8033" : `${BRAND.volt}33`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white font-bold text-sm">Q{q} {taxYear}</p>
                  <p className="text-gray-400 text-xs">Due {QUARTERLY_DUE_DATES[q]}</p>
                </div>
                <button
                  onClick={() => handleTogglePaid(q)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${isPaid ? "bg-green-500" : "bg-white/10 hover:bg-white/20"}`}
                >
                  <CheckCircle2 className={`w-4 h-4 ${isPaid ? "text-white" : "text-gray-500"}`} />
                </button>
              </div>
              <div className="space-y-1">
                <Label className="text-gray-400 text-xs">Amount Paid ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount || ""}
                  onChange={(e) => handleAmountChange(q, e.target.value)}
                  placeholder="0.00"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-600 text-sm h-8"
                />
              </div>
              {isPaid && est?.paid_date && (
                <p className="text-green-400 text-xs mt-2">Paid {est.paid_date}</p>
              )}
            </div>
          );
        })}
      </div>

      <div
        className="flex items-center justify-between p-3 rounded-lg border"
        style={{ background: `${BRAND.volt}11`, borderColor: `${BRAND.volt}33` }}
      >
        <p className="text-white text-sm font-medium">Total Estimated Tax Paid ({taxYear})</p>
        <p className="font-bold text-lg" style={{ color: BRAND.volt }}>
          ${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
        <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
        <p className="text-gray-500 text-xs">
          Quarterly estimated taxes are due if you expect to owe $1,000 or more. Vine income
          (ETV) is self-employment income — quarterly payments are typically required.
          Use IRS Form 1040-ES to calculate exact amounts.
        </p>
      </div>
    </div>
  );
}

// ─── BACKUP / RESTORE ────────────────────────────────────────
/** All localStorage keys that contain tax / business data for this app. */
const BACKUP_KEYS = [
  // taxStore (stores/)
  "taxmod-persons",
  "taxmod-income-sources",
  "taxmod-documents",
  "taxmod-writeoffs",
  "taxmod-receipts",
  "taxmod-quarterly-estimates",
  // taxStore (lib/)
  "reese-tax-etv-records",
  "reese-tax-1099-forms",
  "reese-tax-capital-events",
  "reese-tax-donations",
  "reese-tax-documents",
  // expenses
  "reese-expenses",
  // Plaid
  "reese-plaid-config",
  "reese-plaid-accounts",
  "reese-plaid-transactions",
  // Vine
  "reese-vine-items",
  "reese-vine-config",
  "reese-vine-cookies",
  // Amazon
  "reese-amazon-orders",
  "reese-amazon-config",
  // Product lifecycle
  "reese-product-lifecycle",
  // Review pipeline
  "reese-review-pipeline",
  "reese-pipeline-stats",
  // Automation settings
  "rr-automation-settings",
  "rr-avatar-library",
] as const;

function BackupRestore() {
  const [restoreStatus, setRestoreStatus] = useState<"idle" | "success" | "error">("idle");
  const [restoreMsg, setRestoreMsg]       = useState("");
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleBackup = () => {
    const snapshot: Record<string, unknown> = {
      _meta: {
        app: "Reese Reviews Tax Center",
        exported_at: new Date().toISOString(),
        version: 1,
      },
    };
    for (const key of BACKUP_KEYS) {
      const val = localStorage.getItem(key);
      if (val !== null) {
        try { snapshot[key] = JSON.parse(val); }
        catch { snapshot[key] = val; }
      }
    }
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `ReeseReviews_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as Record<string, unknown>;
        let count = 0;
        for (const key of BACKUP_KEYS) {
          if (key in data) {
            localStorage.setItem(key, JSON.stringify(data[key]));
            count++;
          }
        }
        setRestoreStatus("success");
        setRestoreMsg(`✅ Restored ${count} data sets. Reloading…`);
        setTimeout(() => window.location.reload(), 1500);
      } catch {
        setRestoreStatus("error");
        setRestoreMsg("❌ Could not read backup file. Make sure it's a valid Reese Reviews backup JSON.");
      }
    };
    reader.readAsText(file);
    // reset so same file can be re-selected
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Backup */}
        <button
          onClick={handleBackup}
          className="flex flex-col items-start gap-2 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-left"
        >
          <Download className="w-5 h-5" style={{ color: BRAND.volt }} />
          <p className="text-white text-sm font-semibold">💾 Save Backup File</p>
          <p className="text-gray-400 text-xs">
            Downloads all income sources, SSA data, ETV records, write-offs, and business data to a
            JSON file you can save to email or a USB drive.
          </p>
        </button>

        {/* Restore */}
        <button
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-start gap-2 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-left"
        >
          <Upload className="w-5 h-5" style={{ color: BRAND.amber }} />
          <p className="text-white text-sm font-semibold">📥 Restore from Backup</p>
          <p className="text-gray-400 text-xs">
            Open a backup file from your old computer to restore all your tax and business data on
            this device.
          </p>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleRestore}
        />
      </div>

      {restoreStatus !== "idle" && (
        <div
          className="p-3 rounded-lg text-sm font-medium"
          style={{
            background: restoreStatus === "success" ? "#16a34a22" : "#dc262622",
            border: `1px solid ${restoreStatus === "success" ? "#16a34a66" : "#dc262666"}`,
            color: restoreStatus === "success" ? "#4ade80" : "#f87171",
          }}
        >
          {restoreMsg}
        </div>
      )}

      <p className="text-gray-600 text-xs">
        Tip: email the backup file to audrey@freedomangelcorps.com to keep a safe copy, or save it
        to your iCloud / Google Drive.
      </p>
    </div>
  );
}

// ─── AUDIT TRAIL ─────────────────────────────────────────────
function AuditTrail({ taxYear }: { taxYear: number }) {
  const etvRecords = getETVRecords().filter((r) => r.tax_year === taxYear);
  const expenses = getExpenses().filter((e) => e.tax_year === taxYear);
  const plaidTxns = getPlaidTransactions().filter((t) => new Date(t.date).getFullYear() === taxYear);
  const forms1099 = get1099Forms().filter((f) => f.tax_year === taxYear);
  const capitalEvents = getCapitalEvents().filter((e) => e.tax_year === taxYear);
  const donations = getDonations().filter((d) => d.tax_year === taxYear);

  const handleFullExport = () => {
    const report = generateTaxReportExport(taxYear);
    const data = {
      generated: new Date().toISOString(),
      tax_year: taxYear,
      etv_records: etvRecords,
      forms_1099: forms1099,
      expenses: expenses,
      plaid_transactions: plaidTxns,
      capital_events: capitalEvents,
      donations: donations,
      summary: report,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Audit_Package_${taxYear}.json`;
    a.click();
  };

  const handleExpenseCSV = () => {
    const csv = generateWriteOffCSV(taxYear);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Expenses_${taxYear}.csv`;
    a.click();
  };

  const handlePlaidCSV = () => {
    const business = plaidTxns.filter((t) => t.user_classification === "business");
    const header = "Date,Merchant,Description,Amount,Category,Deductible,Classification";
    const rows = business.map((t) =>
      [t.date, `"${t.merchant_name}"`, `"${t.description}"`, Math.abs(t.amount).toFixed(2),
       t.tax_write_off_category ?? "", t.tax_deductible ? "Yes" : "No", t.user_classification].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Bank_Transactions_${taxYear}.csv`;
    a.click();
  };

  const auditItems = [
    { label: "ETV Records",          count: etvRecords.length,    color: "#a78bfa" },
    { label: "1099-NEC Forms",        count: forms1099.length,     color: BRAND.amber },
    { label: "Expense Records",       count: expenses.length,      color: BRAND.green },
    { label: "Bank Transactions",     count: plaidTxns.length,     color: BRAND.gold },
    { label: "Capital Events",        count: capitalEvents.length, color: BRAND.crimson },
    { label: "Donation Records",      count: donations.length,     color: BRAND.volt },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ background: `${BRAND.amber}22`, border: `1px solid ${BRAND.amber}44` }}
          >
            <ShieldCheck className="w-5 h-5" style={{ color: BRAND.amber }} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Audit Trail & Exports</h3>
            <p className="text-gray-400 text-sm">Complete record of all tax data for {taxYear}</p>
          </div>
        </div>
        <Button
          onClick={handleFullExport}
          className="font-bold text-black text-sm"
          style={{ background: BRAND.amber }}
        >
          <Download className="w-4 h-4 mr-2" />
          Full Audit Package
        </Button>
      </div>

      {/* Record counts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {auditItems.map((item) => (
          <div key={item.label} className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-gray-500 text-xs">{item.label}</p>
            <p className="font-bold text-xl" style={{ color: item.color }}>
              {item.count}
            </p>
          </div>
        ))}
      </div>

      {/* Export buttons */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm">Export Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Expense Write-Offs CSV",    desc: `${expenses.length} records`,       fn: handleExpenseCSV,  color: BRAND.green },
              { label: "Bank Transactions CSV",     desc: `${plaidTxns.length} transactions`, fn: handlePlaidCSV,    color: BRAND.gold },
              { label: "Full Audit Package (JSON)", desc: "All data combined",                fn: handleFullExport,  color: BRAND.amber },
            ].map((exp) => (
              <button
                key={exp.label}
                onClick={exp.fn}
                className="flex flex-col items-start gap-1 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-left"
              >
                <Download className="w-4 h-4" style={{ color: exp.color }} />
                <p className="text-white text-xs font-semibold">{exp.label}</p>
                <p className="text-gray-500 text-xs">{exp.desc}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Backup & Restore */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4" style={{ color: BRAND.volt }} />
            Backup &amp; Restore — Transfer to New Computer
          </CardTitle>
          <CardDescription className="text-gray-400 text-xs">
            Save all your tax data to a file, then import it on any device. Your income sources, write-offs, ETV records, and all business data are included.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BackupRestore />
        </CardContent>
      </Card>

      {/* Audit log */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm">Recent Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[
              ...etvRecords.slice(0, 5).map((r) => ({
                date: r.received_date,
                action: `ETV recorded: ${r.product_name}`,
                amount: `+$${r.etv_amount.toFixed(2)}`,
                color: "#a78bfa",
              })),
              ...expenses.slice(0, 5).map((e) => ({
                date: e.date,
                action: `Expense: ${e.merchant} — ${e.description}`,
                amount: `-$${e.amount.toFixed(2)}`,
                color: BRAND.green,
              })),
              ...capitalEvents.slice(0, 3).map((e) => ({
                date: e.disposition_date,
                action: `Capital event: ${e.product_name} (${e.event_type})`,
                amount: `${e.gain_loss >= 0 ? "+" : ""}$${e.gain_loss.toFixed(2)}`,
                color: e.gain_loss >= 0 ? BRAND.crimson : BRAND.green,
              })),
            ]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 20)
              .map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-mono">{item.date}</span>
                    <span className="text-gray-300">{item.action}</span>
                  </div>
                  <span style={{ color: item.color }} className="font-semibold shrink-0">
                    {item.amount}
                  </span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── PEOPLE MANAGER ──────────────────────────────────────────
function PeopleManager({ taxYear, onNavigate }: { taxYear: number; onNavigate: (tab: string, personId?: string) => void }) {
  const [persons, setPersons] = useState<TaxPerson[]>(() => getPersons());
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<TaxPerson["role"]>("primary");
  const [filingStatus, setFilingStatus] = useState<TaxPerson["filing_status"]>("single");
  const [notes, setNotes] = useState("");

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    addPerson({
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      role,
      filing_status: filingStatus,
      businesses: [],
      notes,
    });
    setPersons(getPersons());
    setShowAddForm(false);
    setName(""); setNotes("");
  };

  const handleDeletePerson = (id: string) => {
    if (window.confirm("Remove this person? Their income data will be preserved.")) {
      deletePerson(id);
      setPersons(getPersons());
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: `${BRAND.amber}22`, border: `1px solid ${BRAND.amber}44` }}>
            <Users className="w-5 h-5" style={{ color: BRAND.amber }} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Tax Filer Profiles</h3>
            <p className="text-gray-400 text-sm">{persons.length} filer{persons.length !== 1 ? "s" : ""} · Tax Year {taxYear}</p>
          </div>
        </div>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)} className="font-bold text-black text-sm" style={{ background: BRAND.amber }}>
            + Add Person
          </Button>
        )}
      </div>

      {showAddForm && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-4">
            <form onSubmit={handleAddPerson} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <Label className="text-gray-300 text-xs">Full Name *</Label>
                  <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Revvel / Mom" className="bg-white/10 border-white/20 text-white mt-1" />
                </div>
                <div>
                  <Label className="text-gray-300 text-xs">Role</Label>
                  <select value={role} onChange={(e) => setRole(e.target.value as TaxPerson["role"])} className="w-full mt-1 px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white text-sm">
                    <option value="primary" className="bg-slate-800">Primary Filer</option>
                    <option value="spouse" className="bg-slate-800">Spouse</option>
                    <option value="dependent" className="bg-slate-800">Dependent</option>
                  </select>
                </div>
                <div>
                  <Label className="text-gray-300 text-xs">Filing Status</Label>
                  <select value={filingStatus} onChange={(e) => setFilingStatus(e.target.value as TaxPerson["filing_status"])} className="w-full mt-1 px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white text-sm">
                    <option value="single" className="bg-slate-800">Single</option>
                    <option value="married_filing_jointly" className="bg-slate-800">Married Filing Jointly</option>
                    <option value="married_filing_separately" className="bg-slate-800">Married Filing Separately</option>
                    <option value="head_of_household" className="bg-slate-800">Head of Household</option>
                    <option value="qualifying_widow" className="bg-slate-800">Qualifying Widow(er)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-gray-300 text-xs">Notes</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes about this person's tax situation…" className="bg-white/10 border-white/20 text-white mt-1" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 font-bold text-black" style={{ background: BRAND.amber }}>Add Person</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="border-white/20 text-gray-300 hover:bg-white/10">Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {persons.map((p) => {
          const summary = computeIncomeSummary(p.id, taxYear);
          const sources = getIncomeSources(p.id, taxYear);
          return (
            <div key={p.id} className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-semibold">{p.name}</p>
                  <p className="text-gray-400 text-xs capitalize">{p.role} · {p.filing_status?.replace(/_/g, " ") ?? "—"}</p>
                  {p.notes && <p className="text-gray-500 text-xs mt-1">{p.notes}</p>}
                </div>
                <button onClick={() => handleDeletePerson(p.id)} className="p-1.5 rounded hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition-colors">
                  ✕
                </button>
              </div>
              {p.businesses.length > 0 && (
                <div className="space-y-1">
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Business Entities</p>
                  <div className="flex flex-wrap gap-2">
                    {p.businesses.map((biz) => (
                      <div key={biz.id} className="px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-gray-300 text-xs font-medium">{biz.name}</p>
                        <p className="text-gray-500 text-xs">{biz.schedule.replace("_", " ").toUpperCase()}</p>
                        {biz.ein && <p className="text-gray-500 text-xs font-mono">EIN {biz.ein}</p>}
                        {biz.email && <p className="text-gray-500 text-xs">{biz.email}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="text-gray-400">{sources.length} income source{sources.length !== 1 ? "s" : ""}</span>
                <span className="text-gray-400">Gross: <span style={{ color: BRAND.amber }}>${summary.total_gross.toFixed(2)}</span></span>
                <span className="text-gray-400">Deductions: <span style={{ color: BRAND.green }}>${summary.total_deductible.toFixed(2)}</span></span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="text-xs font-bold text-black" style={{ background: BRAND.amber }} onClick={() => onNavigate("people", p.id)}>Manage Income</Button>
                <Button size="sm" variant="outline" className="text-xs border-white/20 text-gray-300 hover:bg-white/10" onClick={() => onNavigate("forms", p.id)}>View Forms</Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TAB DEFINITIONS ─────────────────────────────────────────
type ERPTab =
  | "vine"
  | "bank"
  | "transactions"
  | "expenses"
  | "forms"
  | "accounting"
  | "documents"
  | "quarterly"
  | "people"
  | "writeoffs"
  | "audit";

const ERP_TABS: Array<{
  value: ERPTab;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  color: string;
  badge?: string;
}> = [
  { value: "vine",         label: "Vine ETV",       shortLabel: "Vine",     icon: <Leaf className="w-4 h-4" />,        color: "#a78bfa", badge: "PRIMARY" },
  { value: "bank",         label: "Bank Accounts",  shortLabel: "Bank",     icon: <Link2 className="w-4 h-4" />,       color: BRAND.amber },
  { value: "transactions", label: "Transactions",   shortLabel: "Txns",     icon: <Zap className="w-4 h-4" />,         color: BRAND.gold },
  { value: "expenses",     label: "Expenses",       shortLabel: "Expenses", icon: <Receipt className="w-4 h-4" />,     color: BRAND.green },
  { value: "writeoffs",    label: "Write-Off Helper", shortLabel: "Write-Offs", icon: <TrendingDown className="w-4 h-4" />, color: BRAND.gold, badge: "NEW" },
  { value: "forms",        label: "Tax Forms",      shortLabel: "Forms",    icon: <FileText className="w-4 h-4" />,    color: BRAND.crimson },
  { value: "accounting",   label: "Accounting",     shortLabel: "Odoo",     icon: <Building2 className="w-4 h-4" />,   color: "#06b6d4" },
  { value: "documents",    label: "Documents",      shortLabel: "Docs",     icon: <Upload className="w-4 h-4" />,      color: BRAND.volt },
  { value: "quarterly",    label: "Quarterly",      shortLabel: "Q-Tax",    icon: <Calendar className="w-4 h-4" />,    color: BRAND.volt },
  { value: "people",       label: "People",         shortLabel: "People",   icon: <Users className="w-4 h-4" />,       color: BRAND.amber },
  { value: "audit",        label: "Audit & Export", shortLabel: "Audit",    icon: <ShieldCheck className="w-4 h-4" />, color: BRAND.green },
];

// ─── MAIN ERP TAX CENTER ─────────────────────────────────────

interface ERPTaxCenterProps {
  taxYear?: number;
  defaultTab?: ERPTab;
  defaultPersonId?: string;
}

export function ERPTaxCenter({
  taxYear = currentTaxYear(),
  defaultTab = "vine",
  defaultPersonId,
}: ERPTaxCenterProps) {
  const [activeTab, setActiveTab] = useState<ERPTab>(defaultTab);
  const [focusedPersonId, setFocusedPersonId] = useState<string | undefined>(defaultPersonId);
  const [selectedYear, setSelectedYear] = useState(taxYear);
  const [plaidTxnCount, setPlaidTxnCount] = useState(0);

  // Combined KPIs
  const persons = getPersons();
  const allSummaries = persons.map((p) => computeIncomeSummary(p.id, selectedYear));
  const totalGross = allSummaries.reduce((a, s) => a + s.total_gross, 0);
  const totalDeductible = allSummaries.reduce((a, s) => a + s.total_deductible, 0);
  const etvRecords = getETVRecords().filter((r) => r.tax_year === selectedYear);
  const totalETV = etvRecords.reduce((s, r) => s + r.etv_amount, 0);
  const plaidSummary = getPlaidDeductionSummary(selectedYear);
  const plaidAccounts = getPlaidAccounts();
  const isPlaidConnected = plaidAccounts.length > 0;

  const handleNavigate = (tab: string, personId?: string) => {
    setActiveTab(tab as ERPTab);
    if (personId) setFocusedPersonId(personId);
  };

  return (
    <div className="space-y-6">
      {/* ── ERP Header ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="p-3 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${BRAND.vine}30 0%, ${BRAND.amber}20 100%)`,
              border: `1px solid ${BRAND.vine}60`,
            }}
          >
            <Leaf className="w-7 h-7" style={{ color: "#a78bfa" }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              Tax Center ERP
            </h2>
            <p className="text-gray-400 text-sm">
              Amazon Vine · Bank · Expenses · Accounting · Forms · {persons.length} filer{persons.length !== 1 ? "s" : ""} · {selectedYear}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isPlaidConnected && (
            <Badge className="bg-green-600/20 text-green-400 border-green-600/30 text-xs">
              <Link2 className="w-3 h-3 mr-1" />
              Bank Connected
            </Badge>
          )}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y} className="bg-slate-800">{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Top KPI Strip ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: <Leaf className="w-4 h-4" />,        label: "Vine ETV",          value: `$${totalETV.toFixed(2)}`,                                                             color: "#a78bfa" },
          { icon: <DollarSign className="w-4 h-4" />,  label: "Total Income",      value: `$${totalGross.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,                color: BRAND.amber },
          { icon: <TrendingDown className="w-4 h-4" />,label: "Write-Offs",        value: `$${(totalDeductible + plaidSummary.total_deductible_amount).toFixed(2)}`,             color: BRAND.green },
          { icon: <Zap className="w-4 h-4" />,         label: "Bank Deductions",   value: `$${plaidSummary.total_deductible_amount.toFixed(2)}`,                                 color: BRAND.gold },
          { icon: <AlertCircle className="w-4 h-4" />, label: "Needs Review",      value: `${plaidSummary.pending_review_count}`,                                                color: BRAND.volt },
        ].map((kpi) => (
          <Card key={kpi.label} className="bg-white/5 border-white/10">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <span style={{ color: kpi.color }}>{kpi.icon}</span>
                <p className="text-gray-400 text-xs">{kpi.label}</p>
              </div>
              <p className="text-lg font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main ERP Tabs ─────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ERPTab)} className="w-full">
        <TabsList className="flex flex-wrap gap-1 bg-white/10 backdrop-blur-md border border-white/20 p-1 rounded-xl h-auto mb-6">
          {ERP_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-1.5 text-white data-[state=active]:text-black text-xs px-2.5 py-2 flex-1 min-w-[60px] relative"
              style={activeTab === tab.value ? { background: tab.color } : {}}
            >
              <span style={activeTab === tab.value ? { color: "#000" } : { color: tab.color }}>
                {tab.icon}
              </span>
              <span className="hidden sm:inline">{tab.shortLabel}</span>
              {tab.badge && activeTab !== tab.value && (
                <span
                  className="hidden lg:inline absolute -top-1 -right-1 text-[9px] px-1 rounded-full font-bold"
                  style={{ background: tab.color, color: "#000" }}
                >
                  {tab.badge}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── VINE ETV (PRIMARY) ────────────────────────────── */}
        <TabsContent value="vine">
          <VineETVOverview taxYear={selectedYear} />
        </TabsContent>

        {/* ── BANK ACCOUNTS ─────────────────────────────────── */}
        <TabsContent value="bank">
          <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
            <PlaidBankConnect
              taxYear={selectedYear}
              onTransactionsImported={(count) => {
                setPlaidTxnCount(count);
                // Auto-navigate to transactions tab after import
                setTimeout(() => setActiveTab("transactions"), 1500);
              }}
            />
          </div>
        </TabsContent>

        {/* ── TRANSACTIONS ──────────────────────────────────── */}
        <TabsContent value="transactions">
          <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
            <TransactionScanner taxYear={selectedYear} />
          </div>
        </TabsContent>

        {/* ── EXPENSES ──────────────────────────────────────── */}
        <TabsContent value="expenses">
          <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
            <ExpenseTracker />
          </div>
        </TabsContent>

        {/* ── TAX FORMS ─────────────────────────────────────── */}
        <TabsContent value="forms">
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg" style={{ background: `${BRAND.crimson}22`, border: `1px solid ${BRAND.crimson}44` }}>
                  <FileText className="w-5 h-5" style={{ color: BRAND.crimson }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Tax Forms</h3>
                  <p className="text-gray-400 text-sm">IRS form viewer + PDFiller integration</p>
                </div>
              </div>
              <Tabs defaultValue="viewer" className="w-full">
                <TabsList className="bg-white/10 border border-white/20 mb-4">
                  <TabsTrigger value="viewer" className="text-white data-[state=active]:text-black data-[state=active]:bg-orange-500 text-xs">
                    IRS Form Viewer
                  </TabsTrigger>
                  <TabsTrigger value="pdfiller" className="text-white data-[state=active]:text-black data-[state=active]:bg-orange-500 text-xs">
                    PDFiller
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="viewer">
                  <TaxFormViewer defaultPersonId={focusedPersonId} taxYear={selectedYear} />
                </TabsContent>
                <TabsContent value="pdfiller">
                  <PDFillerIntegration />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </TabsContent>

        {/* ── ACCOUNTING (ODOO) ─────────────────────────────── */}
        <TabsContent value="accounting">
          <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
            <OdooIntegration />
          </div>
        </TabsContent>

        {/* ── DOCUMENTS ─────────────────────────────────────── */}
        <TabsContent value="documents">
          <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
            <TaxDocumentUpload defaultPersonId={focusedPersonId} taxYear={selectedYear} />
          </div>
        </TabsContent>

        {/* ── QUARTERLY ─────────────────────────────────────── */}
        <TabsContent value="quarterly">
          <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: `${BRAND.volt}22`, border: `1px solid ${BRAND.volt}44` }}>
                <Calendar className="w-5 h-5" style={{ color: BRAND.volt }} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Quarterly Estimated Taxes</h3>
                <p className="text-sm text-gray-400">IRS Form 1040-ES · Tax Year {selectedYear}</p>
              </div>
            </div>
            <QuarterlyTracker taxYear={selectedYear} />
          </div>
        </TabsContent>

        {/* ── WRITE-OFF HELPER ────────────────────────────── */}
        <TabsContent value="writeoffs">
          <div className="space-y-4">
            <IndustryWriteOffHelper taxYear={selectedYear} />
          </div>
        </TabsContent>

        {/* ── PEOPLE ────────────────────────────────────────── */}
        <TabsContent value="people">
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
              <PeopleManager taxYear={selectedYear} onNavigate={handleNavigate} />
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
              <IncomeSourceManager key={focusedPersonId ?? "default"} defaultPersonId={focusedPersonId} taxYear={selectedYear} />
            </div>
          </div>
        </TabsContent>

        {/* ── AUDIT & EXPORT ────────────────────────────────── */}
        <TabsContent value="audit">
          <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
            <AuditTrail taxYear={selectedYear} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ERPTaxCenter;
