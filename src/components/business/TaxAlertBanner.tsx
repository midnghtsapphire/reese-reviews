// ============================================================
// TAX ALERT BANNER
// Keeper-style smart notification panel.  Shows alerts fired
// by TaxAlertEngine: write-off opportunities, credit-eligible
// purchases, paperwork reminders.
//
// Used inside TransactionScanner + ERPTaxCenter header.
// ============================================================

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Sun,
  Receipt,
  Bell,
  X,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertCircle,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import {
  getAllAlerts,
  getActiveAlerts,
  getActiveAlertCount,
  acknowledgeAlert,
  dismissAlert,
  markAlertDone,
  dismissAllAlerts,
  runAlertEngine,
  type TaxAlert,
  type TaxAlertType,
} from "@/lib/taxAlertEngine";

// ─── TYPES ───────────────────────────────────────────────────

const ALERT_STYLE: Record<
  TaxAlertType,
  { icon: React.ReactNode; color: string; bg: string; label: string }
> = {
  write_off: {
    icon: <TrendingDown className="w-4 h-4" />,
    color: "#4ade80",
    bg: "#4ade8015",
    label: "Write-Off",
  },
  credit_eligible: {
    icon: <Sun className="w-4 h-4" />,
    color: "#fbbf24",
    bg: "#fbbf2415",
    label: "Tax Credit",
  },
  paperwork: {
    icon: <Receipt className="w-4 h-4" />,
    color: "#60a5fa",
    bg: "#60a5fa15",
    label: "Paperwork",
  },
  deadline: {
    icon: <Bell className="w-4 h-4" />,
    color: "#f87171",
    bg: "#f8717115",
    label: "Deadline",
  },
  info: {
    icon: <AlertCircle className="w-4 h-4" />,
    color: "#94a3b8",
    bg: "#94a3b815",
    label: "Info",
  },
};

// ─── COMPONENT ───────────────────────────────────────────────

interface Props {
  taxYear: number;
  /** If provided, show only alerts for this transaction */
  transactionId?: string;
  /** Compact single-line mode for use in transaction rows */
  compact?: boolean;
  onNavigate?: (tab: string) => void;
}

export function TaxAlertBanner({ taxYear, transactionId, compact, onNavigate }: Props) {
  const [alerts, setAlerts] = useState<TaxAlert[]>([]);
  const [expanded, setExpanded] = useState(!compact);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const reload = useCallback(() => {
    if (transactionId) {
      setAlerts(getAllAlerts().filter((a) => a.transactionId === transactionId && a.status !== "dismissed"));
    } else {
      setAlerts(getActiveAlerts());
    }
  }, [transactionId]);

  useEffect(() => { reload(); }, [reload]);

  const handleRun = async () => {
    setRunning(true);
    runAlertEngine(taxYear);
    reload();
    setRunning(false);
  };

  const handleAck = (id: string) => { acknowledgeAlert(id); reload(); };
  const handleDismiss = (id: string) => { dismissAlert(id); reload(); };
  const handleDone = (id: string) => { markAlertDone(id); reload(); };
  const handleDismissAll = () => { dismissAllAlerts(); reload(); };

  // ── Compact (per-row) mode ─────────────────────────────────
  if (compact) {
    if (alerts.length === 0) return null;
    const a = alerts[0];
    const style = ALERT_STYLE[a.type];
    return (
      <div
        className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium cursor-pointer hover:opacity-90"
        style={{ color: style.color, background: style.bg, border: `1px solid ${style.color}30` }}
        onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
        title={a.summary}
      >
        {style.icon}
        <span>{style.label}</span>
        {alerts.length > 1 && <span className="opacity-60">+{alerts.length - 1}</span>}
      </div>
    );
  }

  // ── Full panel mode ────────────────────────────────────────
  const activeCount = alerts.filter((a) => a.status === "new").length;
  const totalCount = alerts.length;

  if (totalCount === 0) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          No pending tax alerts for {taxYear}
        </div>
        <button
          onClick={handleRun}
          disabled={running}
          className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-white transition px-2 py-1 rounded hover:bg-white/10"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${running ? "animate-spin" : ""}`} />
          Scan
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <button
          className="flex items-center gap-2 text-left hover:opacity-80 transition"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-white">Smart Tax Alerts</span>
          </div>
          {activeCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-amber-400 text-black">
              {activeCount} new
            </span>
          )}
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white transition px-2 py-1 rounded hover:bg-white/10"
          >
            <RefreshCw className={`w-3 h-3 ${running ? "animate-spin" : ""}`} />
            Rescan
          </button>
          {totalCount > 1 && (
            <button
              onClick={handleDismissAll}
              className="text-[11px] text-gray-500 hover:text-gray-300 transition px-2 py-1 rounded hover:bg-white/10"
            >
              Dismiss all
            </button>
          )}
        </div>
      </div>

      {/* Alert list */}
      {expanded && (
        <div className="divide-y divide-white/5">
          {alerts.map((alert) => {
            const style = ALERT_STYLE[alert.type];
            const isExpanded = expandedId === alert.id;

            return (
              <div key={alert.id} className="transition" style={{ background: alert.status === "new" ? style.bg : "transparent" }}>
                {/* Collapsed row */}
                <button
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/5 transition"
                  onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                >
                  <div
                    className="flex-shrink-0 p-1.5 rounded-lg mt-0.5"
                    style={{ color: style.color, background: `${style.color}25` }}
                  >
                    {style.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-white leading-tight">{alert.title}</p>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 font-medium"
                        style={{ color: style.color, background: `${style.color}20` }}
                      >
                        {style.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{alert.summary}</p>
                    {alert.amount && alert.amount > 0 && (
                      <p className="text-xs font-semibold mt-0.5" style={{ color: style.color }}>
                        Est. benefit: ${alert.amount.toFixed(0)}
                      </p>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-1" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-1" />
                  )}
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                    <p className="text-xs text-gray-300 leading-relaxed">{alert.detail}</p>

                    {alert.form && (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Receipt className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>File: <span className="text-white font-medium">{alert.form}</span></span>
                      </div>
                    )}

                    {alert.txnDate && (
                      <p className="text-[11px] text-gray-500">
                        Transaction date: {new Date(alert.txnDate + "T12:00:00").toLocaleDateString()}
                      </p>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {alert.actionLabel && alert.actionTab && onNavigate && (
                        <Button
                          size="sm"
                          className="text-xs font-bold text-black"
                          style={{ background: style.color }}
                          onClick={() => {
                            handleAck(alert.id);
                            onNavigate(alert.actionTab!);
                          }}
                        >
                          {alert.actionLabel}
                        </Button>
                      )}
                      {alert.sourceUrl && (
                        <a
                          href={alert.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition px-2 py-1 rounded border border-blue-400/20 hover:bg-blue-400/10"
                        >
                          <ExternalLink className="w-3 h-3" />
                          IRS Source
                        </a>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-green-500/30 text-green-400 hover:bg-green-500/10"
                        onClick={() => handleDone(alert.id)}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Done
                      </Button>
                      <button
                        onClick={() => handleDismiss(alert.id)}
                        className="text-[11px] text-gray-500 hover:text-gray-300 transition ml-auto"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── MINI BADGE (for tab headers) ────────────────────────────

export function TaxAlertBadge({ taxYear }: { taxYear: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(getActiveAlertCount());
    // Refresh every 30 seconds
    const iv = setInterval(() => setCount(getActiveAlertCount()), 30_000);
    return () => clearInterval(iv);
  }, [taxYear]);

  if (count === 0) return null;

  return (
    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-amber-400 text-black ml-0.5">
      {count}
    </span>
  );
}
