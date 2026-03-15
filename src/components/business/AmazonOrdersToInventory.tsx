// ============================================================
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
  const [activeTab, setActiveTab] = useState<"orders" | "add" | "summary">("orders");
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
