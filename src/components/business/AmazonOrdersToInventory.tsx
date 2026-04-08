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
    const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="bg-white/10 border border-white/20">
          <TabsTrigger value="orders" className="data-[state=active]:bg-white/20 text-gray-300">
            <Package className="h-3.5 w-3.5 mr-1" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="add" className="data-[state=active]:bg-white/20 text-gray-300">
            <Plus className="h-3.5 w-3.5 mr-1" />
            {editOrder ? "Edit" : "Add"}
          </TabsTrigger>
          <TabsTrigger value="import" className="data-[state=active]:bg-white/20 text-gray-300">
            <Upload className="h-3.5 w-3.5 mr-1" />
            Import
          </TabsTrigger>
          <TabsTrigger value="summary" className="data-[state=active]:bg-white/20 text-gray-300">
            <BarChart3 className="h-3.5 w-3.5 mr-1" />
            Summary
          </TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-3 mt-3">
          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by product name, order ID, or ASIN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 bg-white/5 border-white/20 text-white placeholder:text-gray-500"
              />
            </div>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
              <SelectTrigger className="w-full sm:w-44 bg-white/5 border-white/20 text-white">
                <Filter className="h-3.5 w-3.5 mr-1 text-gray-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {(Object.keys(STATUS_META) as OrderStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Orders List */}
          <div className="space-y-2">
            {filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
                <p>No orders found.</p>
                <p className="text-xs mt-1">Use the Import tab to load from an Amazon CSV, or Add to enter manually.</p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const sm = STATUS_META[order.status];
                const em = ENTITY_META[order.entity];
                return (
                  <div
                    key={order.id}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/8 transition-colors"
                  >
                    {/* Icon */}
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-500/20"
                      aria-hidden="true"
                    >
                      <Package size={18} className="text-orange-400" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white text-sm truncate max-w-[240px]">
                          {order.product_name}
                        </span>
                        <Badge className={`${sm.color} flex items-center gap-1 text-[10px]`}>
                          {sm.icon} {sm.label}
                        </Badge>
                        {order.review_written && (
                          <Badge className="bg-purple-900/30 text-purple-300 text-[10px]">✓ Reviewed</Badge>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span>{order.order_date}</span>
                        <span className="font-medium text-gray-400">${order.charged_amount.toFixed(2)}</span>
                        <span className={em.color}>{em.short}</span>
                        {order.asin && <span>ASIN: {order.asin}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Select
                        value={order.status}
                        onValueChange={(v) => handleStatusChange(order.id, v as OrderStatus)}
                      >
                        <SelectTrigger className="h-7 w-32 bg-white/5 border-white/10 text-xs text-white px-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(STATUS_META) as OrderStatus[]).map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">{STATUS_META[s].label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                        onClick={() => handleEdit(order)}
                        aria-label={`Edit ${order.product_name}`}
                      >
                        <Edit3 size={13} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => handleDelete(order.id)}
                        aria-label={`Delete ${order.product_name}`}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Add / Edit Tab */}
        <TabsContent value="add" className="space-y-3 mt-3">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base">
                {editOrder ? "Edit Order" : "Add Order"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-gray-300 text-xs">Product Name *</Label>
                  <Input
                    value={form.product_name ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, product_name: e.target.value }))}
                    placeholder="e.g. Wireless Earbuds"
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-300 text-xs">Amazon Order ID</Label>
                  <Input
                    value={form.amazon_order_id ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, amazon_order_id: e.target.value }))}
                    placeholder="113-XXXXXXX-XXXXXXX"
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-300 text-xs">ASIN</Label>
                  <Input
                    value={form.asin ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, asin: e.target.value }))}
                    placeholder="B0XXXXXXXXX"
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-300 text-xs">Category</Label>
                  <Input
                    value={form.category ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    placeholder="Electronics"
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-300 text-xs">Order Date *</Label>
                  <Input
                    type="date"
                    value={form.order_date ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, order_date: e.target.value }))}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-300 text-xs">Charged Amount *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.charged_amount ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, charged_amount: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-300 text-xs">Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={form.quantity ?? 1}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: parseInt(e.target.value, 10) || 1 }))}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-300 text-xs">Status</Label>
                  <Select
                    value={form.status ?? "received"}
                    onValueChange={(v) => setForm((f) => ({ ...f, status: v as OrderStatus }))}
                  >
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(STATUS_META) as OrderStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-300 text-xs">Entity</Label>
                  <Select
                    value={form.entity ?? "fac"}
                    onValueChange={(v) => setForm((f) => ({ ...f, entity: v as AmazonOrderEntry["entity"] }))}
                  >
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ENTITY_META) as (keyof typeof ENTITY_META)[]).map((k) => (
                        <SelectItem key={k} value={k}>{ENTITY_META[k].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-gray-300 text-xs">Notes</Label>
                <Textarea
                  value={form.notes ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Any notes about this order..."
                  className="bg-white/5 border-white/20 text-white resize-none"
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {editOrder ? "Save Changes" : "Add Order"}
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

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-3 mt-3">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base">Import from Amazon CSV</CardTitle>
              <CardDescription className="text-gray-400 text-xs">
                Download your order history from Amazon → Account → Order History Reports (Items CSV)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-gray-300 text-xs">Entity</Label>
                <Select value={importEntity} onValueChange={(v) => setImportEntity(v as AmazonOrderEntry["entity"])}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white w-full sm:w-60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ENTITY_META) as (keyof typeof ENTITY_META)[]).map((k) => (
                      <SelectItem key={k} value={k}>{ENTITY_META[k].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-gray-300 text-xs">Upload File (CSV or Excel)</Label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors">
                    <Upload className="h-4 w-4 text-gray-400" />
                    Choose File
                    <input type="file" accept=".csv,.xlsx,.xls,.pdf" className="hidden" onChange={handleFileUpload} />
                  </label>
                  <span className="text-xs text-gray-500">or paste CSV below</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-gray-300 text-xs">Paste CSV Text</Label>
                <Textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={"Order ID,Order Date,Title,ASIN,Category,Quantity,Purchase Price Per Unit\n113-XXX,2025-01-01,My Product,B0XXXXXXX,Electronics,1,29.99"}
                  className="bg-white/5 border-white/20 text-white resize-none font-mono text-xs"
                  rows={5}
                />
              </div>

              {csvError && (
                <Alert className="bg-red-900/20 border-red-500/30">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-200 text-xs">{csvError}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => handleParseCSV(csvText)}
                >
                  <RefreshCw className="h-4 w-4 mr-1" /> Parse
                </Button>
                {csvParsed.length > 0 && (
                  <Button
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={handleImportConfirm}
                  >
                    <ArrowRight className="h-4 w-4 mr-1" /> Import {csvParsed.length} Row{csvParsed.length !== 1 ? "s" : ""}
                  </Button>
                )}
              </div>

              {csvParsed.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-gray-300">{csvParsed.length} row{csvParsed.length !== 1 ? "s" : ""} ready to import:</p>
                  <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-white/10 bg-black/20 p-2">
                    {csvParsed.map((row, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                        <span className="w-5 text-gray-600 text-right">{i + 1}.</span>
                        <span className="flex-1 truncate">{row.product_name ?? "Unknown"}</span>
                        <span className="text-gray-500 flex-shrink-0">{row.order_date}</span>
                        <span className="text-gray-400 flex-shrink-0">${(row.charged_amount ?? 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-3 mt-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(Object.keys(STATUS_META) as OrderStatus[]).map((s) => {
              const count = orders.filter((o) => o.status === s).length;
              return (
                <div key={s} className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                  <div className="text-2xl font-bold text-white">{count}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{STATUS_META[s].label}</div>
                </div>
              );
            })}
          </div>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm">Review Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-500"
                    style={{ width: orders.length ? `${(reviewedCount / orders.length) * 100}%` : "0%" }}
                  />
                </div>
                <span className="text-sm text-white font-medium">
                  {orders.length ? Math.round((reviewedCount / orders.length) * 100) : 0}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {reviewedCount} of {orders.length} orders have a review written
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={handleExportCSV}
            >
              <Download className="h-4 w-4 mr-1" /> Export All Orders (CSV)
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AmazonOrdersToInventory;
