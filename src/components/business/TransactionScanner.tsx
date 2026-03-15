// ============================================================
// TRANSACTION SCANNER
// Keeper Tax-style transaction review UI.
//
// Features:
//   • Lists all imported Plaid transactions
//   • Click/swipe to classify as Business / Personal / Vine Income
//   • Auto-highlights Amazon and Vine-related transactions
//   • Spontaneous spending flag with visual alert
//   • Receipt attachment per transaction
//   • Running totals of identified deductions
//   • "Sync to Expenses" button pushes business txns to ExpenseTracker
//   • Filter by: All / Needs Review / Business / Personal / Amazon
//   • CSV export of business transactions
// ============================================================

import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Search,
  RefreshCw,
  Zap,
  ShoppingBag,
  Receipt,
  TrendingDown,
  DollarSign,
  Filter,
  Loader2,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Leaf,
} from "lucide-react";
import {
  getPlaidTransactions,
  savePlaidTransactions,
  updatePlaidTransaction,
  syncAllBusinessTransactions,
  getPlaidDeductionSummary,
} from "@/lib/plaidClient";
import type { ClassifiedTransaction } from "@/lib/plaidClient";

// ─── BRAND ───────────────────────────────────────────────────
const BRAND = {
  amber:   "#FF6B2B",
  gold:    "#FFB347",
  crimson: "#E63946",
  volt:    "#FFD93D",
  vine:    "#7C3AED",
  green:   "#4ade80",
};

// ─── CLASSIFICATION BUTTON ───────────────────────────────────
type UserClass = ClassifiedTransaction["user_classification"];

const CLASS_CONFIG: Record<
  UserClass,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  business:    { label: "Business",    color: BRAND.green,   bg: "#4ade8020", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  personal:    { label: "Personal",    color: "#9ca3af",     bg: "#9ca3af20", icon: <XCircle className="w-3.5 h-3.5" /> },
  vine_income: { label: "Vine Income", color: BRAND.volt,    bg: `${BRAND.volt}20`, icon: <Leaf className="w-3.5 h-3.5" /> },
  pending:     { label: "Pending",     color: BRAND.amber,   bg: `${BRAND.amber}20`, icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

// ─── FILTER TABS ─────────────────────────────────────────────
type FilterTab = "all" | "pending" | "business" | "personal" | "amazon" | "vine";

const FILTER_TABS: Array<{ value: FilterTab; label: string; icon: React.ReactNode }> = [
  { value: "all",      label: "All",         icon: <Filter className="w-3 h-3" /> },
  { value: "pending",  label: "Needs Review",icon: <AlertCircle className="w-3 h-3" /> },
  { value: "business", label: "Business",    icon: <CheckCircle2 className="w-3 h-3" /> },
  { value: "amazon",   label: "Amazon",      icon: <ShoppingBag className="w-3 h-3" /> },
  { value: "vine",     label: "Vine",        icon: <Leaf className="w-3 h-3" /> },
  { value: "personal", label: "Personal",    icon: <XCircle className="w-3 h-3" /> },
];

// ─── TRANSACTION ROW ─────────────────────────────────────────
function TransactionRow({
  txn,
  onClassify,
  onAttachReceipt,
}: {
  txn: ClassifiedTransaction;
  onClassify: (id: string, cls: UserClass) => void;
  onAttachReceipt: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cls = CLASS_CONFIG[txn.user_classification];
  const isExpense = txn.amount < 0;
  const isAmazon = txn.matched_rules.some((r) => r.is_amazon_related);
  const isVine = txn.matched_rules.some((r) => r.is_vine_related);
  const bestRule = txn.matched_rules.find((r) => r.is_write_off);

  return (
    <div
      className={`rounded-xl border transition-all ${
        txn.user_classification === "business"
          ? "border-green-500/30 bg-green-500/5"
          : txn.user_classification === "vine_income"
          ? "border-purple-500/30 bg-purple-500/5"
          : txn.is_spontaneous
          ? "border-yellow-500/30 bg-yellow-500/5"
          : "border-white/10 bg-white/5"
      }`}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 p-3">
        {/* Amount */}
        <div className="w-20 text-right shrink-0">
          <p
            className="font-bold text-sm"
            style={{
              color: isExpense
                ? txn.user_classification === "business"
                  ? BRAND.green
                  : BRAND.crimson
                : BRAND.amber,
            }}
          >
            {isExpense ? "-" : "+"}${Math.abs(txn.amount).toFixed(2)}
          </p>
          <p className="text-gray-500 text-xs">{txn.date}</p>
        </div>

        {/* Merchant + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-white text-sm font-medium truncate">
              {txn.merchant_name}
            </p>
            {isAmazon && (
              <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30 text-xs px-1.5 py-0">
                <ShoppingBag className="w-2.5 h-2.5 mr-0.5" />
                Amazon
              </Badge>
            )}
            {isVine && (
              <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/30 text-xs px-1.5 py-0">
                <Leaf className="w-2.5 h-2.5 mr-0.5" />
                Vine
              </Badge>
            )}
            {txn.is_spontaneous && (
              <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30 text-xs px-1.5 py-0">
                ⚡ Impulse
              </Badge>
            )}
            {txn.synced_to_expenses && (
              <Badge className="bg-green-600/20 text-green-400 border-green-600/30 text-xs px-1.5 py-0">
                ✓ Synced
              </Badge>
            )}
          </div>
          <p className="text-gray-400 text-xs truncate">{txn.description}</p>
          {bestRule && (
            <p className="text-xs mt-0.5" style={{ color: BRAND.gold }}>
              {bestRule.label} · {bestRule.write_off_percentage}% deductible
            </p>
          )}
        </div>

        {/* Classification buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {(["business", "personal", "vine_income"] as UserClass[]).map((c) => (
            <button
              key={c}
              onClick={() => onClassify(txn.id, c)}
              title={CLASS_CONFIG[c].label}
              className="p-1.5 rounded-lg transition-all text-xs font-medium"
              style={
                txn.user_classification === c
                  ? { background: CLASS_CONFIG[c].bg, color: CLASS_CONFIG[c].color, border: `1px solid ${CLASS_CONFIG[c].color}44` }
                  : { background: "transparent", color: "#6b7280", border: "1px solid transparent" }
              }
            >
              {CLASS_CONFIG[c].icon}
            </button>
          ))}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-white/5 pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-gray-500">Account</p>
              <p className="text-gray-300">{txn.account_id}</p>
            </div>
            <div>
              <p className="text-gray-500">Transaction ID</p>
              <p className="text-gray-300 font-mono">{txn.plaid_transaction_id}</p>
            </div>
            <div>
              <p className="text-gray-500">Classification</p>
              <p style={{ color: cls.color }}>{cls.label}</p>
            </div>
          </div>

          {txn.matched_rules.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs mb-1">Auto-detected rules:</p>
              <div className="flex flex-wrap gap-1">
                {txn.matched_rules.map((r, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full text-xs"
                    style={{
                      background: r.is_write_off ? "#4ade8015" : "#9ca3af15",
                      color: r.is_write_off ? BRAND.green : "#9ca3af",
                      border: `1px solid ${r.is_write_off ? "#4ade8030" : "#9ca3af30"}`,
                    }}
                  >
                    {r.label} ({r.confidence})
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {txn.receipt_url ? (
              <a
                href={txn.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
              >
                <Receipt className="w-3 h-3" />
                View Receipt
              </a>
            ) : (
              <button
                onClick={() => onAttachReceipt(txn.id)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                <Paperclip className="w-3 h-3" />
                Attach Receipt
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────

interface TransactionScannerProps {
  taxYear?: number;
}

export function TransactionScanner({ taxYear = new Date().getFullYear() }: TransactionScannerProps) {
  const [transactions, setTransactions] = useState<ClassifiedTransaction[]>(
    () => getPlaidTransactions().filter((t) => new Date(t.date).getFullYear() === taxYear)
  );
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const summary = getPlaidDeductionSummary(taxYear);

  const refreshTransactions = useCallback(() => {
    setTransactions(
      getPlaidTransactions().filter((t) => new Date(t.date).getFullYear() === taxYear)
    );
  }, [taxYear]);

  // ── Classify ─────────────────────────────────────────────
  const handleClassify = useCallback(
    (id: string, cls: UserClass) => {
      updatePlaidTransaction(id, { user_classification: cls });
      refreshTransactions();
    },
    [refreshTransactions]
  );

  // ── Attach receipt (file input simulation) ────────────────
  const handleAttachReceipt = useCallback((id: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,application/pdf";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      updatePlaidTransaction(id, { receipt_url: url });
      refreshTransactions();
    };
    input.click();
  }, [refreshTransactions]);

  // ── Sync to expenses ─────────────────────────────────────
  const handleSyncToExpenses = async () => {
    setSyncing(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      const count = syncAllBusinessTransactions();
      refreshTransactions();
      setSyncMessage(
        count > 0
          ? `${count} business transaction${count !== 1 ? "s" : ""} synced to Expenses.`
          : "All business transactions already synced."
      );
      setTimeout(() => setSyncMessage(null), 4000);
    } finally {
      setSyncing(false);
    }
  };

  // ── CSV export ───────────────────────────────────────────
  const handleExportCSV = () => {
    const business = transactions.filter((t) => t.user_classification === "business");
    const header = "Date,Merchant,Description,Amount,Category,Deductible,Write-Off %,Synced";
    const rows = business.map((t) => {
      const rule = t.matched_rules.find((r) => r.is_write_off);
      return [
        t.date,
        `"${t.merchant_name}"`,
        `"${t.description}"`,
        Math.abs(t.amount).toFixed(2),
        t.tax_write_off_category ?? "uncategorized",
        t.tax_deductible ? "Yes" : "No",
        rule?.write_off_percentage ?? 0,
        t.synced_to_expenses ? "Yes" : "No",
      ].join(",");
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Business_Transactions_${taxYear}.csv`;
    a.click();
  };

  // ── Filtered transactions ─────────────────────────────────
  const filtered = useMemo(() => {
    let result = transactions;

    switch (filter) {
      case "pending":
        result = result.filter((t) => t.user_classification === "pending");
        break;
      case "business":
        result = result.filter((t) => t.user_classification === "business");
        break;
      case "personal":
        result = result.filter((t) => t.user_classification === "personal");
        break;
      case "amazon":
        result = result.filter((t) =>
          t.matched_rules.some((r) => r.is_amazon_related)
        );
        break;
      case "vine":
        result = result.filter((t) =>
          t.matched_rules.some((r) => r.is_vine_related) ||
          t.user_classification === "vine_income"
        );
        break;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.merchant_name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filter, search]);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
          style={{ background: `${BRAND.amber}15`, border: `2px dashed ${BRAND.amber}44` }}
        >
          <RefreshCw className="w-8 h-8" style={{ color: BRAND.amber }} />
        </div>
        <p className="text-white font-semibold">No transactions imported yet</p>
        <p className="text-gray-400 text-sm">
          Connect a bank account in the Bank Accounts tab to start scanning for write-offs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ background: `${BRAND.amber}22`, border: `1px solid ${BRAND.amber}44` }}
          >
            <Zap className="w-5 h-5" style={{ color: BRAND.amber }} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Transaction Scanner</h3>
            <p className="text-gray-400 text-sm">
              {summary.pending_review_count} need review ·{" "}
              {summary.business_count} business ·{" "}
              ${summary.total_deductible_amount.toFixed(2)} deductible
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="border-white/20 text-gray-300 hover:bg-white/10 text-xs"
          >
            <Download className="w-3 h-3 mr-1" />
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={handleSyncToExpenses}
            disabled={syncing}
            className="font-bold text-black text-xs"
            style={{ background: BRAND.amber }}
          >
            {syncing ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3 mr-1" />
            )}
            Sync to Expenses
          </Button>
        </div>
      </div>

      {/* ── Sync message ─────────────────────────────────────── */}
      {syncMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <p className="text-green-300 text-sm">{syncMessage}</p>
        </div>
      )}

      {/* ── KPI strip ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Total Txns",     value: summary.total_transactions, color: BRAND.amber },
          { label: "Business",       value: summary.business_count,     color: BRAND.green },
          { label: "Amazon",         value: summary.amazon_transaction_count, color: "#f97316" },
          { label: "Needs Review",   value: summary.pending_review_count, color: BRAND.volt },
        ].map((s) => (
          <div
            key={s.label}
            className="p-3 rounded-lg bg-white/5 border border-white/10 text-center"
          >
            <p className="text-gray-500 text-xs">{s.label}</p>
            <p className="font-bold text-lg" style={{ color: s.color }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Spontaneous spending alert ────────────────────────── */}
      {summary.spontaneous_spend_total > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
          <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-300 text-sm font-semibold">
              Spontaneous Spending Alert
            </p>
            <p className="text-gray-400 text-xs">
              ${summary.spontaneous_spend_total.toFixed(2)} in food delivery, streaming, and
              impulse purchases detected. These are typically not deductible.
            </p>
          </div>
        </div>
      )}

      {/* ── Deduction breakdown ──────────────────────────────── */}
      {summary.by_category.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <TrendingDown className="w-4 h-4" style={{ color: BRAND.green }} />
              Deduction Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.by_category.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: BRAND.green }}
                    />
                    <span className="text-gray-300 text-xs">{cat.label}</span>
                    <span className="text-gray-500 text-xs">({cat.count})</span>
                  </div>
                  <span className="text-green-400 text-xs font-semibold">
                    ${cat.amount.toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-white text-xs font-bold">Total Deductible</span>
                <span className="font-bold text-sm" style={{ color: BRAND.green }}>
                  ${summary.total_deductible_amount.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Filter tabs ──────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1">
        {FILTER_TABS.map((tab) => {
          const count =
            tab.value === "all"
              ? transactions.length
              : tab.value === "pending"
              ? summary.pending_review_count
              : tab.value === "business"
              ? summary.business_count
              : tab.value === "personal"
              ? summary.personal_count
              : tab.value === "amazon"
              ? summary.amazon_transaction_count
              : summary.vine_income_count;

          return (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={
                filter === tab.value
                  ? { background: BRAND.amber, color: "#000" }
                  : { background: "rgba(255,255,255,0.05)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.1)" }
              }
            >
              {tab.icon}
              {tab.label}
              <span
                className="px-1.5 py-0.5 rounded-full text-xs"
                style={
                  filter === tab.value
                    ? { background: "rgba(0,0,0,0.2)", color: "#000" }
                    : { background: "rgba(255,255,255,0.1)", color: "#9ca3af" }
                }
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Search ───────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search merchant or description…"
          className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
        />
      </div>

      {/* ── Transaction list ─────────────────────────────────── */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No transactions match this filter.
          </div>
        ) : (
          filtered.map((txn) => (
            <TransactionRow
              key={txn.id}
              txn={txn}
              onClassify={handleClassify}
              onAttachReceipt={handleAttachReceipt}
            />
          ))
        )}
      </div>

      {/* ── Legend ───────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-500 pt-2 border-t border-white/10">
        <span>Click to classify:</span>
        {(["business", "personal", "vine_income"] as UserClass[]).map((c) => (
          <span key={c} className="flex items-center gap-1" style={{ color: CLASS_CONFIG[c].color }}>
            {CLASS_CONFIG[c].icon} {CLASS_CONFIG[c].label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default TransactionScanner;
