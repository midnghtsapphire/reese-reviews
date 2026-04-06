// ============================================================
// PLAID BANK CONNECT
// UI for linking bank accounts and credit cards via Plaid Link.
// Read-only access — no payment initiation.
//
// Features:
//   • Connect bank accounts / credit cards via Plaid Link
//   • Display connected accounts with balances
//   • Disconnect / re-link accounts
//   • Show last sync time and trigger manual sync
//   • Amazon / Vine auto-flag status badge
// ============================================================

import React, { useState, useCallback, useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Building2,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Unlink,
  Link2,
  ShieldCheck,
  Loader2,
  Wifi,
  WifiOff,
  DollarSign,
  TrendingDown,
  Zap,
} from "lucide-react";
import {
  getPlaidConfig,
  savePlaidConfig,
  clearPlaidConfig,
  getPlaidAccounts,
  savePlaidAccounts,
  getPlaidTransactions,
  savePlaidTransactions,
  createLinkToken,
  exchangePublicToken,
  importTransactions,
  getPlaidDeductionSummary,
  DEMO_ACCOUNTS,
} from "@/lib/plaidClient";
import type { PlaidConfig } from "@/lib/plaidClient";
import type { PlaidAccount } from "@/lib/businessTypes";

// ─── BRAND ───────────────────────────────────────────────────
const BRAND = {
  amber:   "#FF6B2B",
  gold:    "#FFB347",
  crimson: "#E63946",
  volt:    "#FFD93D",
  vine:    "#7C3AED",
};

// ─── ACCOUNT TYPE ICON ───────────────────────────────────────
function AccountIcon({ type }: { type: PlaidAccount["account_type"] }) {
  if (type === "credit") return <CreditCard className="w-5 h-5" />;
  return <Building2 className="w-5 h-5" />;
}

// ─── ACCOUNT CARD ────────────────────────────────────────────
function AccountCard({
  account,
  onDisconnect,
}: {
  account: PlaidAccount;
  onDisconnect: (id: string) => void;
}) {
  const isCredit = account.account_type === "credit";
  const balance = isCredit
    ? Math.abs(account.balance_current)
    : account.balance_current;
  const balanceLabel = isCredit ? "Balance Owed" : "Current Balance";
  const availableLabel = isCredit ? "Available Credit" : "Available";

  return (
    <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{
              background: `${isCredit ? BRAND.crimson : BRAND.amber}22`,
              border: `1px solid ${isCredit ? BRAND.crimson : BRAND.amber}44`,
              color: isCredit ? BRAND.crimson : BRAND.amber,
            }}
          >
            <AccountIcon type={account.account_type} />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{account.account_name}</p>
            <p className="text-gray-400 text-xs">
              {account.institution_name} ···· {account.mask}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className={
              account.status === "connected"
                ? "bg-green-600/20 text-green-400 border-green-600/30"
                : "bg-red-600/20 text-red-400 border-red-600/30"
            }
          >
            {account.status === "connected" ? (
              <Wifi className="w-3 h-3 mr-1" />
            ) : (
              <WifiOff className="w-3 h-3 mr-1" />
            )}
            {account.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded-lg bg-white/5">
          <p className="text-gray-500 text-xs">{balanceLabel}</p>
          <p
            className="font-bold text-sm"
            style={{ color: isCredit ? BRAND.crimson : BRAND.amber }}
          >
            ${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="p-2 rounded-lg bg-white/5">
          <p className="text-gray-500 text-xs">{availableLabel}</p>
          <p className="font-bold text-sm text-green-400">
            ${account.balance_available.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-xs">
          Synced {new Date(account.last_synced).toLocaleDateString()}
        </p>
        <button
          onClick={() => onDisconnect(account.id)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors"
        >
          <Unlink className="w-3 h-3" />
          Disconnect
        </button>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────

interface PlaidBankConnectProps {
  onTransactionsImported?: (count: number) => void;
  taxYear?: number;
}

export function PlaidBankConnect({
  onTransactionsImported,
  taxYear = new Date().getFullYear(),
}: PlaidBankConnectProps) {
  const [config, setConfig] = useState<PlaidConfig | null>(getPlaidConfig);
  const [accounts, setAccounts] = useState<PlaidAccount[]>(getPlaidAccounts);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(!config?.connected);

  const summary = getPlaidDeductionSummary(taxYear);

  // ── Fetch link token on mount ─────────────────────────────
  useEffect(() => {
    if (!config?.connected) {
      createLinkToken().then((res) => setLinkToken(res.link_token));
    }
  }, [config?.connected]);

  // ── Plaid Link config ─────────────────────────────────────
  const { open: openPlaidLink, ready: plaidReady } = usePlaidLink({
    token: linkToken ?? "",
    onSuccess: useCallback(
      async (publicToken: string, metadata: { institution: { name: string } | null; accounts: Array<{ id: string; name: string; type: string; subtype: string; mask: string }> }) => {
        setLoading(true);
        try {
          const { access_token, item_id } = await exchangePublicToken(publicToken);

          const newConfig: PlaidConfig = {
            client_id: "demo",
            environment: "sandbox",
            access_token,
            item_id,
            connected: true,
            last_synced: new Date().toISOString(),
            scan_year: taxYear,
            auto_sync_expenses: true,
          };
          savePlaidConfig(newConfig);
          setConfig(newConfig);
          setIsDemoMode(false);

          // Build account objects from metadata
          const newAccounts: PlaidAccount[] = metadata.accounts.map((a, i) => ({
            id: `acct-${Date.now()}-${i}`,
            plaid_account_id: a.id,
            institution_name: metadata.institution?.name ?? "Your Bank",
            account_name: a.name,
            account_type: (a.subtype as PlaidAccount["account_type"]) ?? "checking",
            mask: a.mask ?? "****",
            balance_current: 0,
            balance_available: 0,
            currency: "USD",
            status: "connected",
            last_synced: new Date().toISOString(),
          }));
          savePlaidAccounts(newAccounts);
          setAccounts(newAccounts);

          // Import transactions
          const txns = await importTransactions(access_token, taxYear);
          setMessage({
            type: "success",
            text: `Connected! Imported ${txns.length} transactions from Jan 1, ${taxYear}.`,
          });
          onTransactionsImported?.(txns.length);
        } catch (err) {
          setMessage({ type: "error", text: "Failed to connect account. Please try again." });
        } finally {
          setLoading(false);
        }
      },
      [taxYear, onTransactionsImported]
    ),
    onExit: useCallback((err: { error_code?: string; error_message?: string } | null) => {
      if (err) {
        setMessage({ type: "error", text: `Plaid Link exited: ${err.error_message ?? "Unknown error"}` });
      }
    }, []),
  });

  // Demo mode removed — users must connect a real bank account via Plaid Link

  // ── Manual sync ───────────────────────────────────────────
  const handleSync = async () => {
    if (!config?.access_token) return;
    setSyncing(true);
    try {
      const txns = await importTransactions(config.access_token, taxYear);
      const updated: PlaidConfig = {
        ...config,
        last_synced: new Date().toISOString(),
      };
      savePlaidConfig(updated);
      setConfig(updated);
      setMessage({
        type: "success",
        text: `Synced ${txns.length} transactions.`,
      });
      onTransactionsImported?.(txns.length);
    } finally {
      setSyncing(false);
    }
  };

  // ── Disconnect ────────────────────────────────────────────
  const handleDisconnect = (accountId: string) => {
    if (!window.confirm("Disconnect this account? Transaction history will be preserved.")) return;
    const updated = accounts.filter((a) => a.id !== accountId);
    savePlaidAccounts(updated);
    setAccounts(updated);
    if (updated.length === 0) {
      clearPlaidConfig();
      setConfig(null);
      setIsDemoMode(true);
      createLinkToken().then((res) => setLinkToken(res.link_token));
    }
  };

  const isConnected = config?.connected && accounts.length > 0;

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="p-3 rounded-xl"
            style={{ background: `${BRAND.amber}22`, border: `1px solid ${BRAND.amber}44` }}
          >
            <Link2 className="w-6 h-6" style={{ color: BRAND.amber }} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Bank Accounts</h3>
            <p className="text-gray-400 text-sm">
              {isConnected
                ? `${accounts.length} account${accounts.length !== 1 ? "s" : ""} connected · read-only`
                : "Connect your bank to auto-scan for write-offs"}
            </p>
          </div>
        </div>

        {isConnected && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSync}
              disabled={syncing}
              className="border-white/20 text-gray-300 hover:bg-white/10 text-xs"
            >
              {syncing ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3 mr-1" />
              )}
              Sync Now
            </Button>
            <Button
              size="sm"
              onClick={() => plaidReady && openPlaidLink()}
              disabled={!plaidReady || loading}
              className="font-bold text-black text-xs"
              style={{ background: BRAND.amber }}
            >
              <Link2 className="w-3 h-3 mr-1" />
              Add Account
            </Button>
          </div>
        )}
      </div>

      {/* ── Security notice ──────────────────────────────────── */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
        <ShieldCheck className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
        <p className="text-green-300 text-xs">
          <strong>Read-only access only.</strong> Plaid connects securely using bank-grade 256-bit
          encryption. We can view transactions but cannot move money or make payments.
          Powered by Plaid (plaid.com).
        </p>
      </div>

      {/* ── Message ──────────────────────────────────────────── */}
      {message && (
        <Alert
          className={
            message.type === "success"
              ? "border-green-500/50 bg-green-500/10"
              : "border-red-500/50 bg-red-500/10"
          }
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-green-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-400" />
          )}
          <AlertDescription
            className={message.type === "success" ? "text-green-300" : "text-red-300"}
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* ── Not connected state ───────────────────────────────── */}
      {!isConnected && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="flex justify-center">
              <div
                className="p-6 rounded-full"
                style={{ background: `${BRAND.amber}15`, border: `2px dashed ${BRAND.amber}44` }}
              >
                <Building2 className="w-12 h-12" style={{ color: BRAND.amber }} />
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold text-lg mb-2">
                Connect Your Bank Account
              </h4>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                Link your checking and credit card accounts to automatically scan for
                Amazon Vine expenses, business write-offs, and spontaneous spending.
                Transactions are imported back to January 1, {taxYear}.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
              {[
                {
                  icon: <Zap className="w-4 h-4" />,
                  color: BRAND.volt,
                  title: "Auto-flag Amazon",
                  desc: "Vine, advertising, and seller fees detected automatically",
                },
                {
                  icon: <TrendingDown className="w-4 h-4" />,
                  color: "#4ade80",
                  title: "Find Write-Offs",
                  desc: "Software, shipping, equipment — flagged instantly",
                },
                {
                  icon: <DollarSign className="w-4 h-4" />,
                  color: BRAND.amber,
                  title: "Track Deductions",
                  desc: "Running total of deductible business expenses",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="p-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <span style={{ color: f.color }}>{f.icon}</span>
                  <p className="text-white text-xs font-semibold mt-1">{f.title}</p>
                  <p className="text-gray-500 text-xs">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => plaidReady && openPlaidLink()}
                disabled={!plaidReady || loading}
                className="font-bold text-black px-8"
                style={{ background: BRAND.amber }}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4 mr-2" />
                )}
                Connect Real Bank Account
              </Button>

            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Connected accounts ────────────────────────────────── */}
      {isConnected && (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: "Transactions",
                value: summary.total_transactions.toString(),
                color: BRAND.amber,
                icon: <RefreshCw className="w-4 h-4" />,
              },
              {
                label: "Business Expenses",
                value: `$${summary.total_business_spend.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                color: BRAND.crimson,
                icon: <TrendingDown className="w-4 h-4" />,
              },
              {
                label: "Deductible Amount",
                value: `$${summary.total_deductible_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                color: "#4ade80",
                icon: <DollarSign className="w-4 h-4" />,
              },
              {
                label: "Needs Review",
                value: summary.pending_review_count.toString(),
                color: BRAND.volt,
                icon: <AlertCircle className="w-4 h-4" />,
              },
            ].map((kpi) => (
              <Card key={kpi.label} className="bg-white/5 border-white/10">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ color: kpi.color }}>{kpi.icon}</span>
                    <p className="text-gray-400 text-xs">{kpi.label}</p>
                  </div>
                  <p className="text-xl font-bold" style={{ color: kpi.color }}>
                    {kpi.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Amazon / Vine highlight */}
          {summary.amazon_transaction_count > 0 && (
            <div
              className="flex items-center gap-3 p-3 rounded-lg border"
              style={{
                background: `${BRAND.vine}15`,
                borderColor: `${BRAND.vine}44`,
              }}
            >
              <Zap className="w-5 h-5 shrink-0" style={{ color: BRAND.volt }} />
              <p className="text-gray-300 text-sm">
                <strong style={{ color: BRAND.volt }}>
                  {summary.amazon_transaction_count} Amazon-related transactions
                </strong>{" "}
                detected — including potential Vine expenses, advertising fees, and seller
                costs. Review in the Transactions tab.
              </p>
            </div>
          )}

          {/* Spontaneous spending alert */}
          {summary.spontaneous_spend_total > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
              <AlertCircle className="w-5 h-5 shrink-0 text-yellow-400" />
              <p className="text-gray-300 text-sm">
                <strong className="text-yellow-400">
                  Spontaneous spending alert:
                </strong>{" "}
                ${summary.spontaneous_spend_total.toFixed(2)} detected in food delivery,
                streaming, and impulse purchases this period.
              </p>
            </div>
          )}

          {/* Account cards */}
          <div className="space-y-3">
            <h4 className="text-gray-400 text-xs uppercase tracking-wider font-medium">
              Connected Accounts
            </h4>
            {accounts.map((acct) => (
              <AccountCard
                key={acct.id}
                account={acct}
                onDisconnect={handleDisconnect}
              />
            ))}
          </div>

          {/* Last sync */}
          {config?.last_synced && (
            <p className="text-gray-500 text-xs text-center">
              Last synced: {new Date(config.last_synced).toLocaleString()} ·{" "}
              <button
                onClick={handleSync}
                className="underline hover:text-gray-300 transition-colors"
              >
                Sync now
              </button>
            </p>
          )}
        </>
      )}

      {/* Attribution footer */}
      <p className="text-gray-600 text-xs text-center">
        Bank connectivity provided by{" "}
        <a
          href="https://plaid.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-400"
        >
          Plaid
        </a>{" "}
        · Read-only access · 256-bit encryption
      </p>
    </div>
  );
}

export default PlaidBankConnect;
