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
} from "lucide-react";
import { getAmazonOrders, saveAmazonOrders } from "@/lib/amazonStore";
import type { AmazonOrder } from "@/lib/businessTypes";

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
    // Store entity for routing income/revenue
    ...(entity !== "reese_reviews" && {
      notes: `entity:${entity}`,
    }),
  } as AmazonOrder & { notes?: string };
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
  const [existing, setExisting] = useState<AmazonOrder[]>(() => getAmazonOrders());

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
          <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-sm px-3 py-1">
            <Package className="w-3.5 h-3.5 mr-1.5" />
            {totalImportedInStore} orders stored
          </Badge>
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
    </div>
  );
}
