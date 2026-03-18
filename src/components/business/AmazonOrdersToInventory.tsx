// ============================================================
// AMAZON ORDERS TO INVENTORY
// Handles Amazon Order History CSV/Excel/PDF/image import,
// displays demo vs. real badges, and supports
// "Push to Lifecycle Tracker" for full business pipeline linkage.
// ============================================================

import React, { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Package,
  Zap,
  FileText,
  RefreshCw,
  Filter,
  ShoppingCart,
  ArrowRight,
  Info,
} from "lucide-react";
import {
  getAmazonOrders,
  saveAmazonOrders,
  DEMO_AMAZON_ORDERS,
} from "@/lib/amazonStore";
import type { AmazonOrder } from "@/lib/businessTypes";
import { addProduct } from "@/stores/productLifecycleStore";

// ─── HELPERS ──────────────────────────────────────────────────

function isDemo(order: AmazonOrder): boolean {
  return order.id.startsWith("amz-");
}

function isImported(order: AmazonOrder): boolean {
  return order.id.startsWith("import-");
}

function parseCsvRows(rows: Record<string, string>[]): AmazonOrder[] {
  return rows
    .filter((r) => r["ASIN"] || r["asin"] || r["Order ID"] || r["order_id"])
    .map((r, i) => ({
      id: `import-${Date.now()}-${i}`,
      amazon_order_id:
        r["Order ID"] || r["order_id"] || r["amazon_order_id"] || `ORD-${i}`,
      asin: r["ASIN"] || r["asin"] || "",
      product_name:
        r["Title"] || r["Product Name"] || r["product_name"] || r["name"] || "Unknown Product",
      category: "products",
      image_url: r["Image URL"] || r["image_url"] || "",
      purchase_date:
        r["Order Date"] || r["purchase_date"] || r["date"] || new Date().toISOString().slice(0, 10),
      price: parseFloat(r["Item Total"] || r["Price"] || r["price"] || "0") || 0,
      quantity: parseInt(r["Quantity"] || r["quantity"] || "1", 10) || 1,
      status: "delivered" as const,
      review_status: "not_reviewed" as const,
      source: "purchased" as const,
    }));
}

// ─── PUSH TO LIFECYCLE ────────────────────────────────────────

function pushOrderToLifecycle(order: AmazonOrder): void {
  addProduct({
    current_stage: "RECEIVED",
    ordered: {
      asin: order.asin,
      product_name: order.product_name,
      order_date: order.purchase_date,
      order_id: order.amazon_order_id,
      price_paid: order.price,
      product_images: order.image_url ? [order.image_url] : [],
      description: "",
      ein_registered: false,
    },
    received: {
      date_received: order.purchase_date,
      condition_notes: "Imported from Amazon order history.",
      photos: [],
    },
    tags: ["amazon-import", order.source],
    is_archived: false,
    internal_notes: `Imported via order import. ASIN: ${order.asin}. Order: ${order.amazon_order_id}`,
  });
}

// ─── COMPONENT ────────────────────────────────────────────────

type FilterTab = "all" | "demo" | "imported" | "unreviewed";

export function AmazonOrdersToInventory() {
  const [orders, setOrders] = useState<AmazonOrder[]>(getAmazonOrders());
  const [filter, setFilter] = useState<FilterTab>("all");
  const [pushedIds, setPushedIds] = useState<Set<string>>(new Set());
  const [pushedAll, setPushedAll] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(() => {
    setOrders(getAmazonOrders());
  }, []);

  // ── File import ──────────────────────────────────────────────

  const handleFile = useCallback(
    async (file: File) => {
      setImporting(true);
      setImportStatus(null);

      try {
        const ext = file.name.substring(file.name.lastIndexOf(".") + 1).toLowerCase();

        if (ext === "csv" || file.type === "text/csv") {
          const text = await file.text();
          Papa.parse<Record<string, string>>(text, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => {
              const newOrders = parseCsvRows(result.data);
              if (newOrders.length === 0) {
                setImportStatus({ type: "error", text: "No valid orders found in CSV. Check column headers." });
              } else {
                const existing = getAmazonOrders();
                const merged = [
                  ...newOrders,
                  ...existing.filter(
                    (e) => !newOrders.some((n) => n.amazon_order_id === e.amazon_order_id)
                  ),
                ];
                saveAmazonOrders(merged);
                reload();
                setImportStatus({
                  type: "success",
                  text: `Imported ${newOrders.length} order${newOrders.length !== 1 ? "s" : ""} from CSV.`,
                });
              }
            },
            error: () => {
              setImportStatus({ type: "error", text: "Failed to parse CSV file." });
            },
          });
        } else if (ext === "xlsx" || ext === "xls") {
          setImportStatus({
            type: "info",
            text: "Excel import: Save your file as CSV (File → Save As → CSV), then re-upload. Direct Excel parsing coming soon.",
          });
        } else if (ext === "pdf" || ["png", "jpg", "jpeg", "webp"].includes(ext)) {
          setImportStatus({
            type: "info",
            text: "PDF/image import: Orders detected via OCR — feature in progress. Export your Amazon orders as CSV from 'Your Account → Order History' for best results.",
          });
        } else {
          setImportStatus({ type: "error", text: `Unsupported file type: .${ext}. Use CSV, Excel, PDF, or image.` });
        }
      } catch (err) {
        setImportStatus({ type: "error", text: "Import failed. Please try again." });
      } finally {
        setImporting(false);
      }
    },
    [reload]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // ── Push actions ────────────────────────────────────────────

  const handlePushOne = (order: AmazonOrder) => {
    pushOrderToLifecycle(order);
    setPushedIds((prev) => new Set([...prev, order.id]));
    setImportStatus({
      type: "success",
      text: `"${order.product_name}" pushed to Lifecycle Tracker.`,
    });
  };

  const handlePushAll = () => {
    const targets = filteredOrders.filter((o) => !pushedIds.has(o.id));
    targets.forEach(pushOrderToLifecycle);
    setPushedIds((prev) => new Set([...prev, ...targets.map((o) => o.id)]));
    setPushedAll(true);
    setImportStatus({
      type: "success",
      text: `${targets.length} order${targets.length !== 1 ? "s" : ""} pushed to Lifecycle Tracker.`,
    });
  };

  // ── Filter ───────────────────────────────────────────────────

  const filteredOrders = orders.filter((o) => {
    if (filter === "demo") return isDemo(o);
    if (filter === "imported") return isImported(o);
    if (filter === "unreviewed") return o.review_status === "not_reviewed";
    return true;
  });

  const demoCount = orders.filter(isDemo).length;
  const importedCount = orders.filter(isImported).length;
  const unreviewedCount = orders.filter((o) => o.review_status === "not_reviewed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Order Import</h2>
          <p className="text-gray-400 text-sm mt-1">
            Import Amazon orders from CSV, Excel, PDF, or image · Push to Lifecycle Tracker
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={reload}
            className="border-white/20 text-gray-300 hover:bg-white/10"
          >
            <RefreshCw size={14} className="mr-1.5" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => fileRef.current?.click()}
            className="bg-purple-600 hover:bg-purple-700 text-white"
            disabled={importing}
          >
            <Upload size={14} className="mr-1.5" />
            {importing ? "Importing…" : "Upload File"}
          </Button>
        </div>
      </div>

      {/* Upload zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Drop file to import orders, or click to browse"
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
          dragOver
            ? "border-purple-400 bg-purple-500/10"
            : "border-white/20 hover:border-white/40 hover:bg-white/5"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls,.pdf,.png,.jpg,.jpeg,.webp"
          onChange={handleFileInput}
          className="hidden"
          aria-label="Upload Amazon orders file"
        />
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2" aria-hidden="true">
            <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-gray-400">CSV</span>
            <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-gray-400">Excel</span>
            <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-gray-400">PDF</span>
            <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-gray-400">Image</span>
          </div>
          <p className="text-sm font-medium text-gray-300">
            {dragOver ? "Drop to import" : "Drag & drop your Amazon order file here"}
          </p>
          <p className="text-xs text-gray-500">
            Export from Amazon: Your Account → Order History Reports → Request Report
          </p>
        </div>
      </div>

      {/* Status message */}
      {importStatus && (
        <Alert
          className={
            importStatus.type === "success"
              ? "border-green-500/30 bg-green-500/10"
              : importStatus.type === "error"
              ? "border-red-500/30 bg-red-500/10"
              : "border-blue-500/30 bg-blue-500/10"
          }
          role="alert"
          aria-live="polite"
        >
          {importStatus.type === "success" ? (
            <CheckCircle2 size={16} className="text-green-400" />
          ) : importStatus.type === "error" ? (
            <AlertCircle size={16} className="text-red-400" />
          ) : (
            <Info size={16} className="text-blue-400" />
          )}
          <AlertDescription
            className={
              importStatus.type === "success"
                ? "text-green-300"
                : importStatus.type === "error"
                ? "text-red-300"
                : "text-blue-300"
            }
          >
            {importStatus.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Orders", value: orders.length, color: "text-white" },
          { label: "Demo", value: demoCount, color: "text-yellow-400" },
          { label: "Imported", value: importedCount, color: "text-purple-400" },
          { label: "Unreviewed", value: unreviewedCount, color: "text-orange-400" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/10 bg-white/5 p-3 text-center"
          >
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter orders">
        {(
          [
            { key: "all", label: `All (${orders.length})` },
            { key: "demo", label: `Demo (${demoCount})` },
            { key: "imported", label: `Imported (${importedCount})` },
            { key: "unreviewed", label: `Unreviewed (${unreviewedCount})` },
          ] as { key: FilterTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={filter === tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-purple-600 text-white"
                : "bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}

        {/* Push all button */}
        {filteredOrders.length > 0 && (
          <button
            onClick={handlePushAll}
            disabled={pushedAll && filteredOrders.every((o) => pushedIds.has(o.id))}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            aria-label={`Push all ${filteredOrders.length} orders to Lifecycle Tracker`}
          >
            <Zap size={14} />
            Push All to Lifecycle
          </button>
        )}
      </div>

      {/* Orders list */}
      <div className="space-y-3" role="list" aria-label="Amazon orders">
        {filteredOrders.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
            <p>No orders in this filter.</p>
            <p className="text-xs mt-1">Upload a CSV from Amazon Order History to get started.</p>
          </div>
        )}

        {filteredOrders.map((order) => {
          const pushed = pushedIds.has(order.id);
          const demo = isDemo(order);
          const imported = isImported(order);

          return (
            <div
              key={order.id}
              role="listitem"
              className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/8"
            >
              {/* Product image or icon */}
              {order.image_url ? (
                <img
                  src={order.image_url}
                  alt={order.product_name}
                  className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "rgba(124,58,237,0.2)" }}
                  aria-hidden="true"
                >
                  <Package size={22} className="text-purple-400" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-white text-sm truncate max-w-[280px]">
                    {order.product_name}
                  </span>
                  {/* Demo / Real badge */}
                  {demo && (
                    <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-[10px]">
                      DEMO
                    </Badge>
                  )}
                  {imported && (
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px]">
                      IMPORTED
                    </Badge>
                  )}
                  {!demo && !imported && (
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-[10px]">
                      REAL
                    </Badge>
                  )}
                  {/* Review status */}
                  <Badge
                    className={
                      order.review_status === "published"
                        ? "bg-green-500/20 text-green-300 border-green-500/30 text-[10px]"
                        : order.review_status === "draft"
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px]"
                        : "bg-orange-500/20 text-orange-300 border-orange-500/30 text-[10px]"
                    }
                  >
                    {order.review_status === "published"
                      ? "✓ Reviewed"
                      : order.review_status === "draft"
                      ? "Draft"
                      : "Unreviewed"}
                  </Badge>
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                  <span>ASIN: {order.asin || "—"}</span>
                  <span>{order.purchase_date}</span>
                  <span className="font-medium text-gray-400">${order.price.toFixed(2)}</span>
                </div>
              </div>

              {/* Push button */}
              <button
                onClick={() => !pushed && handlePushOne(order)}
                disabled={pushed}
                aria-label={
                  pushed
                    ? `${order.product_name} already pushed to Lifecycle`
                    : `Push ${order.product_name} to Lifecycle Tracker`
                }
                className={`flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  pushed
                    ? "bg-green-500/20 text-green-400 cursor-default"
                    : "bg-purple-600/30 text-purple-300 hover:bg-purple-600 hover:text-white"
                }`}
              >
                {pushed ? (
                  <>
                    <CheckCircle2 size={12} />
                    In Lifecycle
                  </>
                ) : (
                  <>
                    <ArrowRight size={12} />
                    Push
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-medium text-gray-400 mb-2">Legend</p>
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <span><Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 mr-1 text-[10px]">DEMO</Badge>Pre-loaded sample data</span>
          <span><Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 mr-1 text-[10px]">IMPORTED</Badge>Uploaded from your file</span>
          <span><Badge className="bg-green-500/20 text-green-300 border-green-500/30 mr-1 text-[10px]">REAL</Badge>Live Amazon SP-API data</span>
        </div>
      </div>
    </div>
  );
}

export default AmazonOrdersToInventory;
