// ============================================================
// AMAZON ORDERS → INVENTORY IMPORTER
// Reese Reviews — Freedom Angel Corps / NoCo Nook
//
// Parses Amazon Order History CSV exports and stores them in
// localStorage as AmazonOrder records (key: reese-amazon-orders).
//
// Entity labels:
//   fac           → Freedom Angel Corps (charged amount = income)
//   reese_reviews → Reese Reviews (review workflow)
//   noconook      → NoCo Nook (sold price = resale revenue)
// ============================================================

import React, { useCallback, useRef, useState } from "react";
import Papa from "papaparse";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  RefreshCw,
  Package,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { getAmazonOrders, saveAmazonOrders } from "@/lib/amazonStore";
import type { AmazonOrder } from "@/lib/businessTypes";
import { addProduct, getProducts } from "@/stores/productLifecycleStore";

// ─── ENTITY CONFIG ───────────────────────────────────────────

export type EntityLabel = "fac" | "reese_reviews" | "noconook";

const ENTITY_LABELS: Record<EntityLabel, { label: string; color: string; description: string }> = {
  fac: {
    label: "Freedom Angel Corps",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    description: "Non-profit (EIN 86-1209156) — charged amount = income",
  },
  reese_reviews: {
    label: "Reese Reviews",
    color: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    description: "Review workflow — Vine & purchased items",
  },
  noconook: {
    label: "NoCo Nook",
    color: "bg-green-500/20 text-green-300 border-green-500/40",
    description: "Resale entity — sold price = resale revenue",
  },
};

// ─── AMAZON CSV COLUMN NORMALIZER ────────────────────────────

// Amazon exports several report formats. We normalize column names.
type RawRow = Record<string, string>;

function col(row: RawRow, ...keys: string[]): string {
  for (const k of keys) {
    const found = Object.keys(row).find(
      (rk) => rk.trim().toLowerCase() === k.toLowerCase()
    );
    if (found && row[found]?.trim()) return row[found].trim();
  }
  return "";
}

function parsePrice(raw: string): number {
  const cleaned = raw.replace(/[^0-9.-]/g, "");
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : Math.abs(val);
}

function parseDate(raw: string): string {
  if (!raw) return new Date().toISOString().split("T")[0];
  // Try ISO first
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  return raw;
}

function mapCategory(cat: string): string {
  const c = cat.toLowerCase();
  if (c.includes("electron") || c.includes("tech") || c.includes("computer") || c.includes("phone")) return "tech";
  if (c.includes("book") || c.includes("kindle") || c.includes("entertain")) return "entertainment";
  if (c.includes("home") || c.includes("kitchen") || c.includes("appliance") || c.includes("garden")) return "home-kitchen";
  if (c.includes("food") || c.includes("grocery") || c.includes("beverage")) return "food-restaurants";
  if (c.includes("toy") || c.includes("game") || c.includes("sport") || c.includes("outdoor")) return "games-hobbies";
  if (c.includes("beauty") || c.includes("health") || c.includes("personal")) return "beauty-health";
  if (c.includes("cloth") || c.includes("apparel") || c.includes("fashion")) return "fashion";
  if (c.includes("pet")) return "pets";
  if (c.includes("auto") || c.includes("car") || c.includes("vehicle")) return "automotive";
  if (c.includes("office") || c.includes("stationary")) return "office";
  return "products";
}

// ─── ROW → AmazonOrder ───────────────────────────────────────

function rowToOrder(row: RawRow, entity: EntityLabel): AmazonOrder | null {
  const orderId = col(row, "Order ID", "order id", "order_id");
  const title = col(row, "Title", "title", "Product Name", "product_name", "Description", "Item");
  const asin = col(row, "ASIN/ISBN", "ASIN", "asin", "isbn");
  const category = col(row, "Category", "category", "Department");
  const quantityRaw = col(row, "Quantity", "quantity", "Qty");
  const unitPrice = col(row, "Unit Price", "unit price", "Item Total", "Total Owed", "Amount");
  const orderDate = col(
    row,
    "Order Date",
    "order date",
    "Purchase Date",
    "purchase date",
    "Date"
  );
  const shipDate = col(row, "Shipment Date", "shipment date", "Ship Date");

  if (!orderId || !title) return null;

  const quantity = parseInt(quantityRaw, 10) || 1;
  const price = parsePrice(unitPrice);
  const purchaseDate = parseDate(orderDate);

  // Determine status from shipment date
  const status: AmazonOrder["status"] =
    shipDate && shipDate.trim() ? "delivered" : "pending";

  return {
    id: `import-${orderId.replace(/\s+/g, "-").toLowerCase()}-${asin || "noasin"}`,
    amazon_order_id: orderId,
    asin: asin || "",
    product_name: title,
    category: mapCategory(category),
    image_url: asin
      ? `https://images.amazon.com/images/P/${asin}.01._SL250_.jpg`
      : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
    purchase_date: purchaseDate,
    price,
    quantity,
    status,
    review_status: "not_reviewed",
    source: "purchased",
    notes: `entity:${entity}`,
  };
}

// ─── IMPORT STATS ────────────────────────────────────────────

interface ImportStats {
  total: number;
  imported: number;
  skipped: number;
  duplicates: number;
}

// ─── COMPONENT ───────────────────────────────────────────────

export function AmazonOrdersToInventory() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [entity, setEntity] = useState<EntityLabel>("reese_reviews");
  const [parsedOrders, setParsedOrders] = useState<AmazonOrder[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [lifecyclePushed, setLifecyclePushed] = useState(0);
  const [existing, setExisting] = useState<AmazonOrder[]>(() => getAmazonOrders());

  // True when showing the built-in demo orders (no real CSV imported yet)
  const isShowingDemoData =
    existing.length > 0 && existing.every((o) => o.id.startsWith("amz-"));

  const handleFile = useCallback(
    (file: File) => {
      setParseError(null);
      setParsedOrders([]);
      setStats(null);
      setImportDone(false);
      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (!text) {
          setParseError("Could not read file.");
          return;
        }

        // Strip Amazon's multi-line header preamble (lines before the data header)
        // Amazon sometimes prepends 1-2 non-CSV description lines
        const lines = text.split("\n");
        let startLine = 0;
        for (let i = 0; i < Math.min(5, lines.length); i++) {
          const lower = lines[i].toLowerCase();
          if (
            lower.includes("order id") ||
            lower.includes("order date") ||
            lower.includes("asin") ||
            lower.includes("title")
          ) {
            startLine = i;
            break;
          }
        }
        const csvText = lines.slice(startLine).join("\n");

        Papa.parse<RawRow>(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h) => h.trim(),
          complete: (result) => {
            if (result.errors.length > 0 && result.data.length === 0) {
              setParseError(`CSV parse error: ${result.errors[0].message}`);
              return;
            }
            const orders: AmazonOrder[] = [];
            let skipped = 0;
            let duplicates = 0;

            for (const row of result.data) {
              const order = rowToOrder(row, entity);
              if (!order) {
                skipped++;
                continue;
              }
              // Check for duplicate by amazon_order_id + asin
              const isDuplicate = existing.some(
                (ex) =>
                  ex.amazon_order_id === order.amazon_order_id &&
                  ex.asin === order.asin
              );
              if (isDuplicate) {
                duplicates++;
                continue;
              }
              orders.push(order);
            }

            setParsedOrders(orders);
            setStats({
              total: result.data.length,
              imported: orders.length,
              skipped,
              duplicates,
            });
          },
          error: (err: Error) => {
            setParseError(`Parse failed: ${err.message}`);
          },
        });
      };
      reader.readAsText(file);
    },
    [entity, existing]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleImport = () => {
    if (parsedOrders.length === 0) return;
    setImporting(true);
    try {
      const current = getAmazonOrders();
      const merged = [...current, ...parsedOrders];
      saveAmazonOrders(merged);
      setExisting(merged);
      setImportDone(true);
      setStats((s) => (s ? { ...s, imported: parsedOrders.length } : s));
      setParsedOrders([]);
    } finally {
      setImporting(false);
    }
  };

  const handleClear = () => {
    setParsedOrders([]);
    setStats(null);
    setParseError(null);
    setFileName("");
    setImportDone(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Push all stored Amazon orders into the Lifecycle tracker as ORDERED stage products.
  // Skips orders that already have a matching lifecycle entry (by amazon_order_id).
  const handlePushToLifecycle = () => {
    const orders = getAmazonOrders();
    const existingLifecycle = getProducts();
    const existingOrderIds = new Set(
      existingLifecycle.map((p) => p.ordered?.order_id).filter(Boolean)
    );

    let pushed = 0;
    for (const order of orders) {
      if (existingOrderIds.has(order.amazon_order_id)) continue;
      addProduct({
        current_stage: order.status === "delivered" ? "RECEIVED" : "ORDERED",
        ordered: {
          asin: order.asin,
          product_name: order.product_name,
          order_date: order.purchase_date,
          order_id: order.amazon_order_id,
          price_paid: order.price,
          product_images: order.image_url ? [order.image_url] : [],
          description: "",
          ein_registered: order.notes?.startsWith("entity:fac") ?? false,
        },
        tags: [order.category],
        is_archived: false,
        internal_notes: order.notes ?? "",
      });
      pushed++;
    }
    setLifecyclePushed(pushed);
  };

  const totalImportedInStore = existing.length;

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Amazon Orders → Inventory</h2>
          <p className="text-gray-400 text-sm mt-1">
            Import your Amazon order history CSV to track orders, reviews, and resale.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            className={
              isShowingDemoData
                ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-sm px-3 py-1"
                : "bg-purple-500/20 text-purple-300 border border-purple-500/40 text-sm px-3 py-1"
            }
          >
            <Package className="w-3.5 h-3.5 mr-1.5" />
            {isShowingDemoData ? `${totalImportedInStore} demo orders` : `${totalImportedInStore} orders stored`}
          </Badge>
          {totalImportedInStore > 0 && !isShowingDemoData && (
            <Button
              size="sm"
              onClick={handlePushToLifecycle}
              className="bg-green-600 hover:bg-green-700 text-white text-xs gap-1.5"
              title="Convert all stored orders into Lifecycle tracker products"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              Push to Lifecycle
            </Button>
          )}
        </div>
      </div>

      {/* ── Entity Selector ───────────────────────────── */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base">Assign Entity</CardTitle>
          <CardDescription className="text-gray-400">
            Which business entity should these orders be attributed to?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {(Object.entries(ENTITY_LABELS) as [EntityLabel, typeof ENTITY_LABELS[EntityLabel]][]).map(
              ([key, meta]) => (
                <button
                  key={key}
                  onClick={() => setEntity(key)}
                  className={`flex-1 min-w-[180px] rounded-lg border p-3 text-left transition-all ${
                    entity === key
                      ? "border-purple-500 bg-purple-500/20 ring-1 ring-purple-500"
                      : "border-white/10 bg-white/5 hover:border-white/30"
                  }`}
                >
                  <div className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${meta.color} mb-2`}>
                    {meta.label}
                  </div>
                  <p className="text-gray-400 text-xs">{meta.description}</p>
                </button>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── File Drop Zone ────────────────────────────── */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="pt-6">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-white/20 rounded-lg p-10 text-center hover:border-purple-500/60 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-white font-medium mb-1">
              {fileName ? fileName : "Drop your Amazon CSV here"}
            </p>
            <p className="text-gray-400 text-sm mb-4">
              or click to browse — supports Amazon Order History Report CSV
            </p>
            <Button variant="outline" size="sm" className="border-white/20 text-gray-300 hover:bg-white/10" type="button">
              <FileText className="w-4 h-4 mr-2" />
              Choose CSV File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>

          {/* Download instructions */}
          <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300">
            <strong>How to get your Amazon CSV:</strong>{" "}
            Amazon.com → Account &amp; Lists → Order History Report → Request Report (CSV) → Download
          </div>
        </CardContent>
      </Card>

      {/* ── Parse Error ───────────────────────────────── */}
      {parseError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{parseError}</AlertDescription>
        </Alert>
      )}

      {/* ── Import Success ────────────────────────────── */}
      {importDone && (
        <Alert className="border-green-500/40 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-green-300">
            Successfully imported {stats?.imported ?? 0} orders into your inventory.
            {stats?.duplicates ? ` (${stats.duplicates} duplicates skipped)` : ""}
            {" "}Use the <strong>Push to Lifecycle</strong> button above to add them to the Lifecycle tracker.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Lifecycle Push Success ────────────────────── */}
      {lifecyclePushed > 0 && (
        <Alert className="border-cyan-500/40 bg-cyan-500/10">
          <CheckCircle2 className="h-4 w-4 text-cyan-400" />
          <AlertDescription className="text-cyan-300">
            {lifecyclePushed} order{lifecyclePushed !== 1 ? "s" : ""} pushed to the Lifecycle tracker. Switch to the <strong>⚡ Lifecycle</strong> tab to track stages, mark as sold, and record buyer info.
          </AlertDescription>
        </Alert>
      )}
      {lifecyclePushed === 0 && totalImportedInStore > 0 && !importDone && !isShowingDemoData && (
        <Alert className="border-blue-500/40 bg-blue-500/10">
          <ArrowRight className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-300">
            <strong>{totalImportedInStore} orders</strong> in inventory. Click <strong>Push to Lifecycle</strong> to track them through sold/rented stages, or import a new CSV above.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Stats Bar ─────────────────────────────────── */}
      {stats && !importDone && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total rows", value: stats.total, color: "text-white" },
            { label: "Ready to import", value: stats.imported, color: "text-green-400" },
            { label: "Duplicates skipped", value: stats.duplicates, color: "text-yellow-400" },
            { label: "Invalid rows", value: stats.skipped, color: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-400 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Preview Table ─────────────────────────────── */}
      {parsedOrders.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base">
                Preview — {parsedOrders.length} orders ready to import
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-gray-400 hover:text-white"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={handleImport}
                  disabled={importing}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {importing ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Import All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-gray-400">Order ID</TableHead>
                    <TableHead className="text-gray-400">Product</TableHead>
                    <TableHead className="text-gray-400">ASIN</TableHead>
                    <TableHead className="text-gray-400">Date</TableHead>
                    <TableHead className="text-gray-400 text-right">Price</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedOrders.slice(0, 50).map((o) => (
                    <TableRow key={o.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="text-gray-300 font-mono text-xs">
                        {o.amazon_order_id}
                      </TableCell>
                      <TableCell className="text-white text-sm max-w-[200px] truncate">
                        {o.product_name}
                      </TableCell>
                      <TableCell className="text-gray-400 font-mono text-xs">
                        {o.asin || "—"}
                      </TableCell>
                      <TableCell className="text-gray-400 text-xs">{o.purchase_date}</TableCell>
                      <TableCell className="text-green-400 text-right font-medium">
                        <span className="flex items-center justify-end gap-1">
                          <DollarSign className="w-3 h-3" />
                          {o.price.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            o.status === "delivered"
                              ? "bg-green-500/20 text-green-300 border-green-500/40"
                              : "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"
                          }
                        >
                          {o.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsedOrders.length > 50 && (
                <p className="text-center text-gray-400 text-sm py-3">
                  Showing first 50 of {parsedOrders.length} orders
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Current Inventory Table ───────────────────── */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base">
              Current Order Inventory ({existing.length} orders)
              {isShowingDemoData && (
                <Badge className="ml-2 bg-yellow-500/20 text-yellow-300 border-yellow-500/40 text-xs">
                  Demo Data
                </Badge>
              )}
            </CardTitle>
            {existing.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={() => {
                  if (confirm("Clear all imported orders? This cannot be undone.")) {
                    saveAmazonOrders([]);
                    setExisting([]);
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {existing.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">
              No orders imported yet. Upload a CSV above to get started.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-gray-400">Product</TableHead>
                    <TableHead className="text-gray-400">ASIN</TableHead>
                    <TableHead className="text-gray-400">Date</TableHead>
                    <TableHead className="text-gray-400 text-right">Price</TableHead>
                    <TableHead className="text-gray-400">Review</TableHead>
                    <TableHead className="text-gray-400">Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {existing.slice(0, 100).map((o) => (
                    <TableRow key={o.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="text-white text-sm max-w-[200px] truncate">
                        {o.product_name}
                      </TableCell>
                      <TableCell className="text-gray-400 font-mono text-xs">
                        {o.asin || "—"}
                      </TableCell>
                      <TableCell className="text-gray-400 text-xs">{o.purchase_date}</TableCell>
                      <TableCell className="text-green-400 text-right font-medium">
                        ${o.price.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            o.review_status === "published"
                              ? "bg-green-500/20 text-green-300 border-green-500/40"
                              : o.review_status === "draft"
                              ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"
                              : "bg-gray-500/20 text-gray-400 border-gray-500/40"
                          }
                        >
                          {o.review_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            o.source === "vine"
                              ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                              : "bg-blue-500/20 text-blue-300 border-blue-500/40"
                          }
                        >
                          {o.source}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {existing.length > 100 && (
                <p className="text-center text-gray-400 text-sm py-3">
                  Showing first 100 of {existing.length} orders
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
// AMAZON ORDERS TO INVENTORY
// Tracks Amazon orders downloaded from account as:
//   • "Charged amount" = income/acquisition cost to Freedom Angel Corps
//   • "Sold amount" = revenue when sold via NoCo Nook / resale
//   • Donatable items = capital contribution from NoCo Nook
//
// Each order becomes an inventory item.
// Designed for AUDHD / deaf-friendly UX:
//   - Large clear labels  - Color-coded status
//   - No tiny text - One action per row
// ============================================================

import React, { useState, useCallback, useEffect } from "react";
import { parseFileToRows, rowsToCsv, parseCsvText } from "@/lib/fileParser";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Package,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Gift,
  Truck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  Download,
  Upload,
  BarChart3,
  ArrowRight,
  Info,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";

// ─── TYPES ──────────────────────────────────────────────────

export type OrderStatus =
  | "ordered"       // placed, not yet received
  | "received"      // received, not yet reviewed
  | "reviewed"      // review written
  | "listed"        // listed for sale
  | "sold"          // sold — generate income entry
  | "donated"       // donated as capital contribution
  | "returned";     // returned to Amazon

export interface AmazonOrderEntry {
  id: string;
  /** Amazon order number (e.g. 113-1234567-1234567) */
  amazon_order_id: string;
  /** ASIN if known */
  asin: string;
  product_name: string;
  category: string;
  image_url: string;
  order_date: string;
  /** Amount Amazon charged (becomes acquisition cost / income to FAC) */
  charged_amount: number;
  quantity: number;
  status: OrderStatus;
  /** When sold: price sold for */
  sold_price?: number;
  sold_date?: string;
  sold_platform?: string;
  /** When donated: fair market value */
  donation_fmv?: number;
  donation_date?: string;
  donation_recipient?: string;
  /** Review tracking */
  review_written: boolean;
  review_rating?: number;
  review_title?: string;
  /** Business entity this was purchased under */
  entity: "fac" | "reese_reviews" | "noconook";
  notes: string;
  created_at: string;
  updated_at: string;
}

// ─── STORAGE KEY ────────────────────────────────────────────

const SK_ORDERS = "rr-amazon-orders";

// ─── STORAGE HELPERS ────────────────────────────────────────

function loadOrders(): AmazonOrderEntry[] {
  try {
    const raw = localStorage.getItem(SK_ORDERS);
    if (raw) return JSON.parse(raw) as AmazonOrderEntry[];
  } catch {
    // ignore
  }
  return DEMO_ORDERS;
}

function saveOrders(orders: AmazonOrderEntry[]): void {
  try {
    localStorage.setItem(SK_ORDERS, JSON.stringify(orders));
  } catch {
    console.warn("[AmazonOrders] Failed to save");
  }
}

function genOrderId(): string {
  return `order-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── DEMO DATA ──────────────────────────────────────────────

const DEMO_ORDERS: AmazonOrderEntry[] = [
  {
    id: "order-demo-1",
    amazon_order_id: "113-0000001-1234567",
    asin: "B09XYZ1234",
    product_name: "Wireless Earbuds with Noise Cancellation",
    category: "Electronics",
    image_url: "",
    order_date: "2025-01-15",
    charged_amount: 29.99,
    quantity: 1,
    status: "reviewed",
    review_written: true,
    review_rating: 4,
    review_title: "Great value earbuds for everyday use",
    entity: "fac",
    notes: "Vine item — ETV $29.99",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "order-demo-2",
    amazon_order_id: "113-0000002-1234567",
    asin: "B08ABC5678",
    product_name: "Stainless Steel Water Bottle 32oz",
    category: "Kitchen & Dining",
    image_url: "",
    order_date: "2025-02-01",
    charged_amount: 19.99,
    quantity: 2,
    status: "listed",
    review_written: true,
    review_rating: 5,
    review_title: "Best water bottle I've owned",
    entity: "noconook",
    notes: "2 units — 1 kept, 1 listed for resale",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "order-demo-3",
    amazon_order_id: "113-0000003-1234567",
    asin: "B0CDEF9012",
    product_name: "LED Desk Lamp with USB Charging Port",
    category: "Home & Kitchen",
    image_url: "",
    order_date: "2025-02-10",
    charged_amount: 35.00,
    quantity: 1,
    status: "received",
    review_written: false,
    entity: "fac",
    notes: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ─── STATUS META ────────────────────────────────────────────

const STATUS_META: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  ordered:   { label: "Ordered",       color: "bg-blue-900/30 text-blue-300",    icon: <ShoppingCart className="h-3 w-3" /> },
  received:  { label: "Received",      color: "bg-yellow-900/30 text-yellow-300",icon: <Package className="h-3 w-3" /> },
  reviewed:  { label: "Reviewed ✓",    color: "bg-purple-900/30 text-purple-300",icon: <CheckCircle2 className="h-3 w-3" /> },
  listed:    { label: "Listed",        color: "bg-orange-900/30 text-orange-300",icon: <TrendingUp className="h-3 w-3" /> },
  sold:      { label: "Sold 💰",       color: "bg-green-900/30 text-green-300",  icon: <DollarSign className="h-3 w-3" /> },
  donated:   { label: "Donated 🎁",    color: "bg-teal-900/30 text-teal-300",    icon: <Gift className="h-3 w-3" /> },
  returned:  { label: "Returned",      color: "bg-red-900/30 text-red-300",      icon: <Truck className="h-3 w-3" /> },
};

// ─── ENTITY META ────────────────────────────────────────────

const ENTITY_META = {
  fac:          { label: "Freedom Angel Corps", short: "FAC",   color: "text-teal-300" },
  reese_reviews:{ label: "Reese Reviews",        short: "RR",    color: "text-purple-300" },
  noconook:     { label: "NoCo Nook",            short: "NCN",   color: "text-orange-300" },
};

// ─── COMPONENT ──────────────────────────────────────────────

export function AmazonOrdersToInventory() {
  const [orders, setOrders] = useState<AmazonOrderEntry[]>(() => loadOrders());
  const [activeTab, setActiveTab] = useState<"orders" | "add" | "import" | "summary">("orders");
  const [editOrder, setEditOrder] = useState<AmazonOrderEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // New order form
  const [form, setForm] = useState<Partial<AmazonOrderEntry>>({
    entity: "fac",
    status: "received",
    review_written: false,
    quantity: 1,
  });

  // CSV import state
  const [csvText, setCsvText] = useState("");
  const [csvParsed, setCsvParsed] = useState<Partial<AmazonOrderEntry>[]>([]);
  const [csvError, setCsvError] = useState("");
  const [importEntity, setImportEntity] = useState<AmazonOrderEntry["entity"]>("fac");

  const refresh = useCallback(() => setOrders(loadOrders()), []);

  const showMessage = useCallback((type: "success" | "error" | "info", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }, []);

  function handleSave() {
    if (!form.product_name || !form.charged_amount || !form.order_date) {
      showMessage("error", "Product name, order date, and charged amount are required.");
      return;
    }
    const now = new Date().toISOString();
    const existingIdx = editOrder ? orders.findIndex((o) => o.id === editOrder.id) : -1;
    if (existingIdx >= 0) {
      const updated = orders.map((o, i) =>
        i === existingIdx
          ? { ...o, ...form, updated_at: now } as AmazonOrderEntry
          : o
      );
      saveOrders(updated);
      setOrders(updated);
      showMessage("success", "Order updated.");
    } else {
      const newOrder: AmazonOrderEntry = {
        id: genOrderId(),
        amazon_order_id: form.amazon_order_id ?? "",
        asin: form.asin ?? "",
        product_name: form.product_name ?? "",
        category: form.category ?? "General",
        image_url: form.image_url ?? "",
        order_date: form.order_date ?? new Date().toISOString().split("T")[0],
        charged_amount: Number(form.charged_amount) || 0,
        quantity: Number(form.quantity) || 1,
        status: form.status ?? "received",
        review_written: form.review_written ?? false,
        review_rating: form.review_rating,
        review_title: form.review_title,
        sold_price: form.sold_price ? Number(form.sold_price) : undefined,
        sold_date: form.sold_date,
        sold_platform: form.sold_platform,
        donation_fmv: form.donation_fmv ? Number(form.donation_fmv) : undefined,
        donation_date: form.donation_date,
        donation_recipient: form.donation_recipient,
        entity: form.entity ?? "fac",
        notes: form.notes ?? "",
        created_at: now,
        updated_at: now,
      };
      const newOrders = [...orders, newOrder];
      saveOrders(newOrders);
      setOrders(newOrders);
      showMessage("success", "Order added to inventory.");
    }
    setForm({ entity: "fac", status: "received", review_written: false, quantity: 1 });
    setEditOrder(null);
    setActiveTab("orders");
  }

  function handleDelete(id: string) {
    const updated = orders.filter((o) => o.id !== id);
    saveOrders(updated);
    setOrders(updated);
    showMessage("info", "Order removed.");
  }

  function handleEdit(order: AmazonOrderEntry) {
    setEditOrder(order);
    setForm({ ...order });
    setActiveTab("add");
  }

  function handleStatusChange(id: string, status: OrderStatus) {
    const updated = orders.map((o) =>
      o.id === id ? { ...o, status, updated_at: new Date().toISOString() } : o
    );
    saveOrders(updated);
    setOrders(updated);
  }

  // ─── CSV IMPORT ──────────────────────────────────────────────

  function handleParseCSV(raw: string) {
    setCsvError("");
    setCsvParsed([]);
    const text = raw.trim();
    if (!text) { setCsvError("Paste your CSV text above first."); return; }

    const rows = parseCsvText(text);
    if (rows.length < 2) { setCsvError("CSV must have a header row and at least one order row."); return; }

    // Normalize header names
    const headers = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, "_"));

    // Helper: find the first matching column index
    const col = (...names: string[]) => {
      for (const name of names) {
        const idx = headers.findIndex((h) => h.includes(name));
        if (idx >= 0) return idx;
      }
      return -1;
    };

    const idxOrderId   = col("order_id", "order_number");
    const idxDate      = col("order_date", "date", "purchase_date");
    const idxTitle     = col("title", "product", "name", "item_name");
    const idxAsin      = col("asin", "isbn");
    const idxCategory  = col("category");
    const idxQty       = col("quantity", "qty");
    const idxPrice     = col("purchase_price_per_unit", "unit_price", "price_per_unit", "charged", "amount", "item_subtotal", "subtotal");

    if (idxTitle < 0 && idxOrderId < 0) {
      setCsvError("Could not find a 'Title' or 'Order ID' column. Make sure you copied the header row too.");
      return;
    }

    const parsed: Partial<AmazonOrderEntry>[] = [];
    for (const row of rows.slice(1)) {
      if (row.every((c) => !c)) continue; // skip blank rows
      const rawPrice = idxPrice >= 0 ? row[idxPrice] ?? "" : "";
      const price = parseFloat(rawPrice.replace(/[$,]/g, "")) || 0;
      parsed.push({
        amazon_order_id: idxOrderId >= 0 ? row[idxOrderId] ?? "" : "",
        product_name:    idxTitle >= 0   ? row[idxTitle] ?? ""   : `Row ${parsed.length + 1}`,
        asin:            idxAsin >= 0    ? row[idxAsin] ?? ""    : "",
        category:        idxCategory >= 0? row[idxCategory] ?? "": "General",
        order_date:      idxDate >= 0    ? normalizeDate(row[idxDate] ?? "") : "",
        quantity:        idxQty >= 0     ? parseInt(row[idxQty] ?? "1", 10) || 1 : 1,
        charged_amount:  price,
        status:          "received" as OrderStatus,
        review_written:  false,
        image_url:       "",
        entity:          importEntity,
        notes:           "",
      });
    }

    if (parsed.length === 0) { setCsvError("No data rows found after the header."); return; }
    setCsvParsed(parsed);
  }

  /** Try to normalize various date formats to YYYY-MM-DD */
  function normalizeDate(s: string): string {
    if (!s) return "";
    // already ISO
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    // MM/DD/YYYY or MM-DD-YYYY
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) {
      const [, mo, dy, yr] = m;
      const year = yr.length === 2 ? `20${yr}` : yr;
      return `${year}-${mo.padStart(2, "0")}-${dy.padStart(2, "0")}`;
    }
    return s;
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // reset so same file can be re-uploaded
    e.target.value = "";

    setCsvError("");
    setCsvParsed([]);

    parseFileToRows(file)
      .then((result) => {
        if (result.kind === "image") {
          setCsvError(
            "Image files cannot be parsed as order data. Please upload a CSV, Excel (.xlsx), or PDF export from Amazon."
          );
          return;
        }
        if (result.rows.length < 2) {
          setCsvError(
            result.kind === "pdf"
              ? "Could not find structured order data in this PDF. Amazon order PDFs must be downloaded via Account → Order History Reports (choose 'Items' report type → CSV or Excel). If you only have a print PDF, please use the manual 'Add Order' tab instead."
              : "File must have a header row and at least one order row."
          );
          return;
        }
        // Convert rows to CSV text so the existing handleParseCSV logic is reused unchanged
        const csv = rowsToCsv(result.rows);
        setCsvText(csv);
        handleParseCSV(csv);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        setCsvError(`Could not read the file: ${msg}. Try pasting the CSV text instead.`);
      });
  }

  function handleImportConfirm() {
    if (csvParsed.length === 0) return;
    const now = new Date().toISOString();
    const existingIds = new Set(orders.map((o) => o.amazon_order_id).filter(Boolean));
    let added = 0;
    const newEntries: AmazonOrderEntry[] = [];
    for (const row of csvParsed) {
      // skip duplicates (same amazon_order_id + same product_name)
      if (row.amazon_order_id && existingIds.has(row.amazon_order_id)) continue;
      newEntries.push({
        id:               genOrderId(),
        amazon_order_id:  row.amazon_order_id ?? "",
        asin:             row.asin ?? "",
        product_name:     row.product_name ?? "Unknown",
        category:         row.category ?? "General",
        image_url:        "",
        order_date:       row.order_date ?? now.slice(0, 10),
        charged_amount:   Number(row.charged_amount) || 0,
        quantity:         Number(row.quantity) || 1,
        status:           "received",
        review_written:   false,
        entity:           importEntity,
        notes:            "",
        created_at:       now,
        updated_at:       now,
      });
      if (row.amazon_order_id) existingIds.add(row.amazon_order_id);
      added++;
    }
    const merged = [...orders, ...newEntries];
    saveOrders(merged);
    setOrders(merged);
    setCsvText("");
    setCsvParsed([]);
    setCsvError("");
    showMessage("success", `Imported ${added} order${added !== 1 ? "s" : ""}${csvParsed.length - added > 0 ? ` (${csvParsed.length - added} skipped — already existed)` : ""}.`);
    setActiveTab("orders");
  }

  function handleExportCSV() {
    const rows = [
      ["Amazon Order ID","ASIN","Product Name","Category","Order Date","Charged Amount","Qty","Status","Entity","Sold Price","Sold Date","Platform","Donation FMV","Review Written","Rating","Notes"],
      ...orders.map((o) => [
        o.amazon_order_id, o.asin, o.product_name, o.category, o.order_date,
        o.charged_amount, o.quantity, o.status,
        ENTITY_META[o.entity]?.short ?? o.entity,
        o.sold_price ?? "", o.sold_date ?? "", o.sold_platform ?? "",
        o.donation_fmv ?? "",
        o.review_written ? "Yes" : "No",
        o.review_rating ?? "",
        o.notes,
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `amazon-orders-inventory-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      !searchQuery ||
      o.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.amazon_order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.asin.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Summary stats
  const totalCharged = orders.reduce((s, o) => s + o.charged_amount * o.quantity, 0);
  const totalSold = orders.filter((o) => o.status === "sold").reduce((s, o) => s + (o.sold_price ?? 0), 0);
  const totalDonated = orders.filter((o) => o.status === "donated").reduce((s, o) => s + (o.donation_fmv ?? o.charged_amount), 0);
  const reviewedCount = orders.filter((o) => o.review_written).length;
  const pendingReview = orders.filter((o) => !o.review_written && ["received", "reviewed"].includes(o.status)).length;

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <CardTitle className="text-white text-lg">Amazon Orders → Inventory</CardTitle>
                <CardDescription className="text-gray-400">
                  Orders charged = income to Freedom Angel Corps · Sales = revenue to NoCo Nook
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={handleExportCSV}
            >
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-red-900/20 border-red-600/30">
          <CardContent className="pt-4 pb-3">
            <p className="text-red-300 text-xs font-medium mb-1">Total Charged (Income)</p>
            <p className="text-white text-xl font-bold">${totalCharged.toFixed(2)}</p>
            <p className="text-red-400/70 text-[10px]">Acquisition cost → FAC income</p>
          </CardContent>
        </Card>
        <Card className="bg-green-900/20 border-green-600/30">
          <CardContent className="pt-4 pb-3">
            <p className="text-green-300 text-xs font-medium mb-1">Total Sold (Revenue)</p>
            <p className="text-white text-xl font-bold">${totalSold.toFixed(2)}</p>
            <p className="text-green-400/70 text-[10px]">Sale revenue → NoCo Nook</p>
          </CardContent>
        </Card>
        <Card className="bg-teal-900/20 border-teal-600/30">
          <CardContent className="pt-4 pb-3">
            <p className="text-teal-300 text-xs font-medium mb-1">Donated (Capital)</p>
            <p className="text-white text-xl font-bold">${totalDonated.toFixed(2)}</p>
            <p className="text-teal-400/70 text-[10px]">Capital contribution FMV</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-900/20 border-purple-600/30">
          <CardContent className="pt-4 pb-3">
            <p className="text-purple-300 text-xs font-medium mb-1">Reviews Written</p>
            <p className="text-white text-xl font-bold">{reviewedCount}</p>
            <p className="text-purple-400/70 text-[10px]">{pendingReview} pending review</p>
          </CardContent>
        </Card>
      </div>

      {/* Message */}
      {message && (
        <Alert
          className={
            message.type === "success"
              ? "bg-green-900/20 border-green-500/30"
              : message.type === "error"
              ? "bg-red-900/20 border-red-500/30"
              : "bg-blue-900/20 border-blue-500/30"
          }
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-green-400" />
          ) : message.type === "error" ? (
            <AlertCircle className="h-4 w-4 text-red-400" />
          ) : (
            <Info className="h-4 w-4 text-blue-400" />
          )}
          <AlertDescription
            className={
              message.type === "success"
                ? "text-green-200"
                : message.type === "error"
                ? "text-red-200"
                : "text-blue-200"
            }
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="bg-white/10 border border-white/20">
          <TabsTrigger value="orders" className="data-[state=active]:bg-purple-600 text-white">
            📦 Orders ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="import" className="data-[state=active]:bg-purple-600 text-white">
            📥 Import
          </TabsTrigger>
          <TabsTrigger value="add" className="data-[state=active]:bg-purple-600 text-white">
            {editOrder ? "✏️ Edit" : "➕ Add Order"}
          </TabsTrigger>
          <TabsTrigger value="summary" className="data-[state=active]:bg-purple-600 text-white">
            📊 Summary
          </TabsTrigger>
        </TabsList>

        {/* ORDERS TAB */}
        <TabsContent value="orders" className="space-y-3 mt-3">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
              />
            </div>
            <Select
              value={filterStatus}
              onValueChange={(v) => setFilterStatus(v as OrderStatus | "all")}
            >
              <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {(Object.keys(STATUS_META) as OrderStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => {
                setEditOrder(null);
                setForm({ entity: "fac", status: "received", review_written: false, quantity: 1 });
                setActiveTab("add");
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Order
            </Button>
          </div>

          {/* Order Cards */}
          {filteredOrders.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-8 pb-8 text-center">
                <Package className="h-10 w-10 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">No orders yet. Add your first Amazon order above.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="bg-white/5 border-white/10 hover:border-white/20 transition-all">
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-start gap-3">
                      {/* Product Image placeholder */}
                      <div className="w-12 h-12 rounded bg-white/10 flex items-center justify-center shrink-0 text-2xl">
                        {order.category.toLowerCase().includes("electronic") ? "📱"
                          : order.category.toLowerCase().includes("kitchen") ? "🍳"
                          : order.category.toLowerCase().includes("home") ? "🏠"
                          : order.category.toLowerCase().includes("pet") ? "🐾"
                          : "📦"}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <p className="text-white font-medium text-sm leading-tight">{order.product_name}</p>
                            <p className="text-gray-500 text-xs">
                              {order.amazon_order_id || "No order ID"}{order.asin && ` · ${order.asin}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge className={STATUS_META[order.status].color + " text-xs"}>
                              {STATUS_META[order.status].label}
                            </Badge>
                            <Badge className="bg-white/10 text-gray-300 text-xs">
                              {ENTITY_META[order.entity]?.short}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                          <span className="text-red-300 text-xs font-medium">
                            💳 Charged: ${(order.charged_amount * order.quantity).toFixed(2)}
                          </span>
                          {order.sold_price !== undefined && (
                            <span className="text-green-300 text-xs font-medium">
                              💰 Sold: ${order.sold_price.toFixed(2)}
                              {order.sold_price > order.charged_amount * order.quantity && (
                                <span className="text-green-400 ml-1">
                                  (+${(order.sold_price - order.charged_amount * order.quantity).toFixed(2)} profit)
                                </span>
                              )}
                            </span>
                          )}
                          {order.donation_fmv !== undefined && (
                            <span className="text-teal-300 text-xs font-medium">
                              🎁 Donated FMV: ${order.donation_fmv.toFixed(2)}
                            </span>
                          )}
                          <span className="text-gray-500 text-xs">{order.order_date}</span>
                          {order.review_written && order.review_rating && (
                            <span className="text-yellow-300 text-xs">
                              {"⭐".repeat(order.review_rating)} {order.review_title}
                            </span>
                          )}
                        </div>

                        {/* Quick status change */}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <Select
                            value={order.status}
                            onValueChange={(v) => handleStatusChange(order.id, v as OrderStatus)}
                          >
                            <SelectTrigger className="h-6 text-xs bg-white/5 border-white/10 text-gray-300 w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(STATUS_META) as OrderStatus[]).map((s) => (
                                <SelectItem key={s} value={s} className="text-xs">
                                  {STATUS_META[s].label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs text-gray-400 hover:text-white"
                            onClick={() => handleEdit(order)}
                          >
                            <Edit3 className="h-3 w-3 mr-1" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs text-red-400 hover:text-red-300"
                            onClick={() => handleDelete(order.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* IMPORT TAB */}
        <TabsContent value="import" className="mt-3 space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Upload className="h-4 w-4 text-orange-400" />
                Import Orders from Amazon
              </CardTitle>
              <CardDescription className="text-gray-400">
                Download your order history from Amazon, then paste or upload the CSV here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Step 1 — Download from Amazon */}
              <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-4 space-y-2">
                <p className="text-orange-300 text-xs font-semibold uppercase tracking-wide">
                  Step 1 — Download your orders from Amazon
                </p>
                <p className="text-gray-300 text-sm">
                  Amazon lets you export your full order history as a CSV file.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href="https://www.amazon.com/gp/b2b/reports"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md bg-orange-500 hover:bg-orange-400 px-3 py-1.5 text-xs font-bold text-black no-underline"
                  >
                    <Download className="h-3 w-3" />
                    Order History Reports (amazon.com)
                  </a>
                  <a
                    href="https://www.amazon.com/gp/css/order-history"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-white/20 hover:bg-white/10 px-3 py-1.5 text-xs text-gray-300 no-underline"
                  >
                    <ArrowRight className="h-3 w-3" />
                    My Orders (alternate)
                  </a>
                </div>
                <p className="text-gray-500 text-xs">
                  On the Order History Reports page: select a date range → "Items" report type → Request Report → Download CSV.
                </p>
              </div>

              {/* Step 2 — Upload or paste */}
              <div className="space-y-3">
                <p className="text-orange-300 text-xs font-semibold uppercase tracking-wide">
                  Step 2 — Upload or paste your CSV
                </p>

                {/* Entity picker */}
                <div className="flex items-center gap-3">
                  <Label className="text-gray-300 text-xs shrink-0">Assign to business:</Label>
                  <Select
                    value={importEntity}
                    onValueChange={(v) => setImportEntity(v as AmazonOrderEntry["entity"])}
                  >
                    <SelectTrigger className="w-52 bg-white/10 border-white/20 text-white text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fac">Freedom Angel Corps (FAC)</SelectItem>
                      <SelectItem value="reese_reviews">Reese Reviews</SelectItem>
                      <SelectItem value="noconook">NoCo Nook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* File upload */}
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer rounded-md border border-white/20 hover:bg-white/10 px-3 py-1.5 text-xs text-gray-300">
                    <Upload className="h-3 w-3" />
                    Choose CSV, Excel, or PDF
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls,.pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/pdf"
                      className="sr-only"
                      onChange={handleFileUpload}
                    />
                  </label>
                  <span className="text-gray-500 text-xs">or paste below ↓</span>
                </div>

                {/* Paste area */}
                <Textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`Paste your Amazon order history CSV here.\n\nExpected columns (Amazon "Items" report):\nOrder ID, Order Date, Title, Category, ASIN/ISBN, Quantity, Purchase Price Per Unit, ...\n\nThe header row must be included.`}
                  rows={6}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-600 text-xs font-mono resize-y"
                />

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleParseCSV(csvText)}
                    disabled={!csvText.trim()}
                    className="bg-orange-600 hover:bg-orange-500 text-white text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Preview Import
                  </Button>
                  {csvParsed.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setCsvText(""); setCsvParsed([]); setCsvError(""); }}
                      className="border-white/20 text-gray-300 text-xs hover:bg-white/10"
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {csvError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                    <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                    {csvError}
                  </div>
                )}
              </div>

              {/* Step 3 — Preview & confirm */}
              {csvParsed.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-orange-300 text-xs font-semibold uppercase tracking-wide">
                      Step 3 — Confirm import ({csvParsed.length} orders found)
                    </p>
                    <Button
                      size="sm"
                      onClick={handleImportConfirm}
                      className="bg-orange-500 hover:bg-orange-400 text-black text-xs font-bold"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Import {csvParsed.length} Order{csvParsed.length !== 1 ? "s" : ""}
                    </Button>
                  </div>

                  <div className="rounded-lg border border-white/10 overflow-auto max-h-64">
                    <table className="w-full text-xs">
                      <thead className="bg-white/10 text-gray-400 sticky top-0">
                        <tr>
                          <th className="text-left px-2 py-1.5">#</th>
                          <th className="text-left px-2 py-1.5">Order ID</th>
                          <th className="text-left px-2 py-1.5">Product</th>
                          <th className="text-left px-2 py-1.5">Date</th>
                          <th className="text-left px-2 py-1.5">Qty</th>
                          <th className="text-right px-2 py-1.5">Charged</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvParsed.map((row, i) => (
                          <tr key={i} className="border-t border-white/5 hover:bg-white/5">
                            <td className="px-2 py-1 text-gray-500">{i + 1}</td>
                            <td className="px-2 py-1 text-gray-400 font-mono">{row.amazon_order_id || "—"}</td>
                            <td className="px-2 py-1 text-white max-w-[200px] truncate">{row.product_name}</td>
                            <td className="px-2 py-1 text-gray-400">{row.order_date || "—"}</td>
                            <td className="px-2 py-1 text-gray-400">{row.quantity}</td>
                            <td className="px-2 py-1 text-right text-green-300">
                              {row.charged_amount ? `$${Number(row.charged_amount).toFixed(2)}` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-gray-500 text-xs">
                    Existing orders with the same Order ID will be skipped. All imported orders are set to status "Received".
                  </p>
                </div>
              )}

            </CardContent>
          </Card>
        </TabsContent>

        {/* ADD / EDIT TAB */}
        <TabsContent value="add" className="mt-3">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">
                {editOrder ? "Edit Order" : "Add Amazon Order"}
              </CardTitle>
              <CardDescription className="text-gray-400">
                Record the item charged amount (becomes income entry) and sale/donation info when applicable.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="md:col-span-2">
                  <Label className="text-white text-sm mb-1.5 block">Product Name *</Label>
                  <Input
                    value={form.product_name ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, product_name: e.target.value }))}
                    placeholder="e.g. Wireless Earbuds with Noise Cancellation"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>

                {/* Amazon Order ID */}
                <div>
                  <Label className="text-white text-sm mb-1.5 block">Amazon Order ID</Label>
                  <Input
                    value={form.amazon_order_id ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, amazon_order_id: e.target.value }))}
                    placeholder="113-1234567-1234567"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>

                {/* ASIN */}
                <div>
                  <Label className="text-white text-sm mb-1.5 block">ASIN (optional)</Label>
                  <Input
                    value={form.asin ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, asin: e.target.value }))}
                    placeholder="B09XYZ1234"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>

                {/* Order Date */}
                <div>
                  <Label className="text-white text-sm mb-1.5 block">Order Date *</Label>
                  <Input
                    type="date"
                    value={form.order_date ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, order_date: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                {/* Charged Amount */}
                <div>
                  <Label className="text-white text-sm mb-1.5 block">
                    💳 Amount Charged (per unit) * — becomes income
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.charged_amount ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, charged_amount: parseFloat(e.target.value) }))}
                      placeholder="0.00"
                      className="pl-7 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <Label className="text-white text-sm mb-1.5 block">Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={form.quantity ?? 1}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: parseInt(e.target.value) || 1 }))}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                {/* Category */}
                <div>
                  <Label className="text-white text-sm mb-1.5 block">Category</Label>
                  <Input
                    value={form.category ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    placeholder="Electronics, Kitchen, Home, etc."
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>

                {/* Entity */}
                <div>
                  <Label className="text-white text-sm mb-1.5 block">Business Entity</Label>
                  <Select
                    value={form.entity ?? "fac"}
                    onValueChange={(v) => setForm((f) => ({ ...f, entity: v as AmazonOrderEntry["entity"] }))}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fac">Freedom Angel Corps (FAC)</SelectItem>
                      <SelectItem value="reese_reviews">Reese Reviews</SelectItem>
                      <SelectItem value="noconook">NoCo Nook / Reviewed Surplus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div>
                  <Label className="text-white text-sm mb-1.5 block">Status</Label>
                  <Select
                    value={form.status ?? "received"}
                    onValueChange={(v) => setForm((f) => ({ ...f, status: v as OrderStatus }))}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(STATUS_META) as OrderStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sold fields — show when status = sold */}
                {form.status === "sold" && (
                  <>
                    <div>
                      <Label className="text-white text-sm mb-1.5 block">
                        💰 Sold Price — becomes revenue
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={form.sold_price ?? ""}
                          onChange={(e) => setForm((f) => ({ ...f, sold_price: parseFloat(e.target.value) }))}
                          placeholder="0.00"
                          className="pl-7 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-white text-sm mb-1.5 block">Date Sold</Label>
                      <Input
                        type="date"
                        value={form.sold_date ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, sold_date: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white text-sm mb-1.5 block">Sale Platform</Label>
                      <Input
                        value={form.sold_platform ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, sold_platform: e.target.value }))}
                        placeholder="eBay, Facebook, Amazon, etc."
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                      />
                    </div>
                  </>
                )}

                {/* Donation fields — show when status = donated */}
                {form.status === "donated" && (
                  <>
                    <div>
                      <Label className="text-white text-sm mb-1.5 block">
                        🎁 Donation FMV (Fair Market Value)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={form.donation_fmv ?? ""}
                          onChange={(e) => setForm((f) => ({ ...f, donation_fmv: parseFloat(e.target.value) }))}
                          placeholder="0.00"
                          className="pl-7 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-white text-sm mb-1.5 block">Date Donated</Label>
                      <Input
                        type="date"
                        value={form.donation_date ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, donation_date: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white text-sm mb-1.5 block">Donation Recipient</Label>
                      <Input
                        value={form.donation_recipient ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, donation_recipient: e.target.value }))}
                        placeholder="NoCo Nook / Reviewed Surplus"
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                      />
                    </div>
                  </>
                )}

                {/* Review Info */}
                <div className="md:col-span-2">
                  <Label className="text-white text-sm mb-1.5 block">Review (optional)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="flex items-center gap-2 text-sm text-gray-300 col-span-3">
                      <input
                        type="checkbox"
                        checked={form.review_written ?? false}
                        onChange={(e) => setForm((f) => ({ ...f, review_written: e.target.checked }))}
                        className="rounded"
                      />
                      Review written
                    </label>
                    {form.review_written && (
                      <>
                        <div>
                          <Label className="text-gray-400 text-xs mb-1 block">Rating (1–5)</Label>
                          <Input
                            type="number"
                            min="1"
                            max="5"
                            value={form.review_rating ?? ""}
                            onChange={(e) => setForm((f) => ({ ...f, review_rating: parseInt(e.target.value) }))}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-gray-400 text-xs mb-1 block">Review Title</Label>
                          <Input
                            value={form.review_title ?? ""}
                            onChange={(e) => setForm((f) => ({ ...f, review_title: e.target.value }))}
                            placeholder="Review headline..."
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <Label className="text-white text-sm mb-1.5 block">Notes</Label>
                  <Textarea
                    value={form.notes ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Vine item, gift, special notes..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 resize-none"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={handleSave}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  {editOrder ? "Save Changes" : "Add to Inventory"}
                </Button>
                {editOrder && (
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                    onClick={() => {
                      setEditOrder(null);
                      setForm({ entity: "fac", status: "received", review_written: false, quantity: 1 });
                      setActiveTab("orders");
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SUMMARY TAB */}
        <TabsContent value="summary" className="mt-3 space-y-3">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">Income & Revenue Summary</CardTitle>
              <CardDescription className="text-gray-400">
                For tax reporting and Odoo accounting entry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-red-900/20 rounded-lg border border-red-600/30">
                  <p className="text-red-300 font-semibold text-sm">📥 Amazon Purchases — Income to FAC</p>
                  <p className="text-white text-2xl font-bold mt-1">${totalCharged.toFixed(2)}</p>
                  <p className="text-red-400/70 text-xs">
                    Record as income received by Freedom Angel Corps. {orders.length} orders × charged amounts.
                  </p>
                </div>

                <div className="p-3 bg-green-900/20 rounded-lg border border-green-600/30">
                  <p className="text-green-300 font-semibold text-sm">📤 Items Sold — Revenue to NoCo Nook</p>
                  <p className="text-white text-2xl font-bold mt-1">${totalSold.toFixed(2)}</p>
                  <p className="text-green-400/70 text-xs">
                    Record as sales revenue for NoCo Nook / Reviewed Surplus.{" "}
                    Net profit: ${(totalSold - orders.filter(o => o.status === "sold").reduce((s, o) => s + o.charged_amount * o.quantity, 0)).toFixed(2)}
                  </p>
                </div>

                <div className="p-3 bg-teal-900/20 rounded-lg border border-teal-600/30">
                  <p className="text-teal-300 font-semibold text-sm">🎁 Donated Items — Capital Contribution</p>
                  <p className="text-white text-2xl font-bold mt-1">${totalDonated.toFixed(2)}</p>
                  <p className="text-teal-400/70 text-xs">
                    FMV of donated items — track for Form 8283 if over $500 per item.
                    These become capital in NoCo Nook (managed by Reese).
                  </p>
                </div>

                <Alert className="bg-blue-900/20 border-blue-500/30">
                  <Info className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-blue-200 text-xs">
                    <strong>Odoo entry:</strong> Create a journal entry: Debit "Inventory / COGS" ${totalCharged.toFixed(2)},
                    Credit "Amazon Income" ${totalCharged.toFixed(2)} for FAC.
                    When sold: Debit "Cash/Receivable" ${totalSold.toFixed(2)},
                    Credit "Sales Revenue" ${totalSold.toFixed(2)} for NoCo Nook.
                  </AlertDescription>
                </Alert>

                {/* By entity breakdown */}
                <div>
                  <p className="text-white text-sm font-medium mb-2">By Business Entity</p>
                  {(["fac", "reese_reviews", "noconook"] as const).map((entity) => {
                    const entityOrders = orders.filter((o) => o.entity === entity);
                    if (entityOrders.length === 0) return null;
                    const charged = entityOrders.reduce((s, o) => s + o.charged_amount * o.quantity, 0);
                    const sold = entityOrders.filter(o => o.status === "sold").reduce((s, o) => s + (o.sold_price ?? 0), 0);
                    return (
                      <div key={entity} className="flex items-center justify-between py-2 border-b border-white/10">
                        <div>
                          <p className={`text-sm font-medium ${ENTITY_META[entity].color}`}>
                            {ENTITY_META[entity].label}
                          </p>
                          <p className="text-xs text-gray-500">{entityOrders.length} orders</p>
                        </div>
                        <div className="text-right">
                          <p className="text-red-300 text-xs">Charged: ${charged.toFixed(2)}</p>
                          {sold > 0 && <p className="text-green-300 text-xs">Sold: ${sold.toFixed(2)}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
