// ============================================================
// PRODUCT LIFECYCLE TRACKER — MAIN COMPONENT
// Reese Reviews — Freedom Angel Corps / Rocky Mountain Rentals
// Tracks products from Amazon order through resale/rental
// All Rights Reserved — Audrey Evans / GlowStar Labs
// ============================================================

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingCart,
  Truck,
  Package,
  Star,
  ArrowRightLeft,
  Tag,
  DollarSign,
  Search,
  Plus,
  Download,
  Archive,
  Trash2,
  ChevronRight,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Filter,
  X,
  Check,
  AlertCircle,
  Globe,
} from "lucide-react";
import {
  type ProductLifecycle as ProductLifecycleType,
  type LifecycleStage,
  LIFECYCLE_STAGES,
  STAGE_LABELS,
  STAGE_COLORS,
  getProducts,
  saveProducts,
  addProduct,
  filterProducts,
  bulkArchive,
  bulkDelete,
  bulkAdvanceStage,
  exportToCSV,
  getLifecycleSummary,
  calcListingPrice,
  DEFAULT_LISTING_PLATFORMS,
  BRAND,
} from "@/stores/productLifecycleStore";
import { ProductLifecycleRow } from "./ProductLifecycleRow";
import { MarketplaceListing } from "./MarketplaceListing";

// ─── SUMMARY STAT CARD ───────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="pb-1 pt-3 px-3">
        <CardDescription className="text-gray-400 text-xs flex items-center gap-1.5">
          {icon}
          {label}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── STAGE FILTER BAR ────────────────────────────────────────

function StageFilterBar({
  active,
  counts,
  onChange,
}: {
  active: LifecycleStage | "ALL";
  counts: Record<string, number>;
  onChange: (s: LifecycleStage | "ALL") => void;
}) {
  const stages: Array<{ key: LifecycleStage | "ALL"; label: string }> = [
    { key: "ALL", label: "All" },
    ...LIFECYCLE_STAGES.map((s) => ({ key: s, label: STAGE_LABELS[s] })),
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {stages.map(({ key, label }) => {
        const count = key === "ALL" ? Object.values(counts).reduce((a, b) => a + b, 0) : (counts[key] ?? 0);
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              isActive
                ? key === "ALL"
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : STAGE_COLORS[key as LifecycleStage]
                : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-gray-300"
            }`}
          >
            {label}
            <span className={`text-xs px-1 rounded-full ${isActive ? "bg-white/20" : "bg-white/10"}`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── ADD PRODUCT FORM ────────────────────────────────────────

function AddProductForm({
  onAdd,
  onCancel,
}: {
  onAdd: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    asin: "",
    product_name: "",
    order_id: "",
    order_date: new Date().toISOString().slice(0, 10),
    price_paid: "",
    description: "",
    tags: "",
    discount_pct: "30",
  });

  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!form.product_name.trim()) {
      setError("Product name is required.");
      return;
    }
    const pricePaid = parseFloat(form.price_paid) || 0;
    const discountPct = Math.min(100, Math.max(0, parseFloat(form.discount_pct) || 30));
    const listingPrice = calcListingPrice(pricePaid, discountPct);

    addProduct({
      current_stage: "ORDERED",
      ordered: {
        asin: form.asin.trim(),
        product_name: form.product_name.trim(),
        order_id: form.order_id.trim(),
        order_date: form.order_date,
        price_paid: pricePaid,
        product_images: [],
        description: form.description.trim(),
        ein_registered: true,
      },
      listed: {
        listing_price: listingPrice,
        discount_percentage: discountPct,
        platforms: DEFAULT_LISTING_PLATFORMS.map((platform) => ({
          platform,
          status: "pending" as const,
          listing_price: listingPrice,
          listed_date: "",
        })),
        listed_date: "",
        listing_photos: [],
      },
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      is_archived: false,
      internal_notes: "",
    });

    onAdd();
  };

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <Card className="bg-white/5 border-amber-500/30">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-amber-300 text-base flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add New Product
        </CardTitle>
        <CardDescription className="text-gray-400 text-xs">
          Import an Amazon order to begin the lifecycle. Registered under Freedom Angel Corps EIN.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-xs">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-gray-400 text-xs">Product Name *</Label>
            <Input
              value={form.product_name}
              onChange={f("product_name")}
              placeholder="e.g. Ninja Creami Ice Cream Maker"
              className="h-8 text-sm bg-white/10 border-white/20 text-white placeholder:text-gray-600"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-gray-400 text-xs">ASIN</Label>
            <Input
              value={form.asin}
              onChange={f("asin")}
              placeholder="B0..."
              className="h-8 text-sm bg-white/10 border-white/20 text-white placeholder:text-gray-600 font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-gray-400 text-xs">Amazon Order ID</Label>
            <Input
              value={form.order_id}
              onChange={f("order_id")}
              placeholder="113-XXXXXXX-XXXXXXX"
              className="h-8 text-sm bg-white/10 border-white/20 text-white placeholder:text-gray-600 font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-gray-400 text-xs">Order Date</Label>
            <Input
              type="date"
              value={form.order_date}
              onChange={f("order_date")}
              className="h-8 text-sm bg-white/10 border-white/20 text-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-gray-400 text-xs">Price Paid ($)</Label>
            <Input
              type="number"
              value={form.price_paid}
              onChange={f("price_paid")}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="h-8 text-sm bg-white/10 border-white/20 text-white placeholder:text-gray-600"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-gray-400 text-xs">
              Resale Discount % <span className="text-gray-600">(default 30%)</span>
            </Label>
            <Input
              type="number"
              value={form.discount_pct}
              onChange={f("discount_pct")}
              min="0"
              max="100"
              className="h-8 text-sm bg-white/10 border-white/20 text-white"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-gray-400 text-xs">Description</Label>
            <Textarea
              value={form.description}
              onChange={f("description")}
              placeholder="Product description..."
              className="h-16 text-sm bg-white/10 border-white/20 text-white placeholder:text-gray-600 resize-none"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-gray-400 text-xs">Tags <span className="text-gray-600">(comma-separated)</span></Label>
            <Input
              value={form.tags}
              onChange={f("tags")}
              placeholder="electronics, kitchen, appliance..."
              className="h-8 text-sm bg-white/10 border-white/20 text-white placeholder:text-gray-600"
            />
          </div>
        </div>

        {form.price_paid && (
          <div className="flex items-center gap-2 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-xs">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-gray-300">
              Auto-listing price:{" "}
              <span className="text-amber-400 font-semibold">
                ${calcListingPrice(parseFloat(form.price_paid) || 0, parseFloat(form.discount_pct) || 30).toFixed(2)}
              </span>
              {" "}({form.discount_pct}% off ${parseFloat(form.price_paid || "0").toFixed(2)})
            </span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Product
          </Button>
          <Button variant="ghost" onClick={onCancel} className="text-gray-400 hover:text-gray-300">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── BULK ACTION BAR ─────────────────────────────────────────

function BulkActionBar({
  selectedIds,
  onAdvance,
  onArchive,
  onDelete,
  onClear,
}: {
  selectedIds: string[];
  onAdvance: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onClear: () => void;
}) {
  if (selectedIds.length === 0) return null;

  return (
    <div className="flex items-center gap-2 p-2 bg-amber-500/10 rounded-lg border border-amber-500/30 flex-wrap">
      <span className="text-amber-300 text-xs font-medium">
        {selectedIds.length} selected
      </span>
      <div className="flex gap-1.5 ml-auto">
        <Button
          size="sm"
          onClick={onAdvance}
          className="h-7 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40"
        >
          <ChevronRight className="w-3 h-3 mr-1" />
          Advance Stage
        </Button>
        <Button
          size="sm"
          onClick={onArchive}
          className="h-7 text-xs bg-white/10 hover:bg-white/15 text-gray-300 border border-white/10"
        >
          <Archive className="w-3 h-3 mr-1" />
          Archive
        </Button>
        <Button
          size="sm"
          onClick={onDelete}
          className="h-7 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Delete
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClear}
          className="h-7 w-7 p-0 text-gray-500 hover:text-gray-300"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── MARKETPLACE VIEW ────────────────────────────────────────

function MarketplaceView({
  products,
  onRefresh,
}: {
  products: ProductLifecycleType[];
  onRefresh: () => void;
}) {
  const listedProducts = products.filter(
    (p) => p.current_stage === "LISTED" || p.current_stage === "SOLD"
  );

  const [selectedProductId, setSelectedProductId] = useState<string>(
    listedProducts[0]?.id ?? ""
  );

  const selectedProduct = listedProducts.find((p) => p.id === selectedProductId);

  if (listedProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Globe className="w-10 h-10 text-gray-600 mb-3" />
        <p className="text-gray-400 text-sm">No products in LISTED or SOLD stage.</p>
        <p className="text-gray-600 text-xs mt-1">Advance products to the LISTED stage to manage marketplace listings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Product selector */}
      <div className="space-y-1">
        <Label className="text-gray-400 text-xs">Select Product</Label>
        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
          <SelectTrigger className="bg-white/10 border-white/20 text-white">
            <SelectValue placeholder="Select a product..." />
          </SelectTrigger>
          <SelectContent>
            {listedProducts.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.ordered?.product_name ?? p.id}
                {" — "}
                <span className="text-gray-400">{STAGE_LABELS[p.current_stage]}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedProduct && (
        <MarketplaceListing product={selectedProduct} onUpdate={onRefresh} />
      )}
    </div>
  );
}

// ─── ANALYTICS VIEW ──────────────────────────────────────────

function AnalyticsView({ products }: { products: ProductLifecycleType[] }) {
  const summary = useMemo(() => getLifecycleSummary(products), [products]);

  const totalProfit = summary.total_sold_value + summary.total_rental_income - summary.total_ordered_value;
  const profitPct = summary.total_ordered_value > 0
    ? ((totalProfit / summary.total_ordered_value) * 100).toFixed(1)
    : "0";

  const soldProducts = products.filter((p) => p.current_stage === "SOLD" && p.sold?.buyer_renter);
  const rentalProducts = soldProducts.filter((p) => p.sold?.buyer_renter?.transaction_type === "rental");
  const saleProducts = soldProducts.filter((p) => p.sold?.buyer_renter?.transaction_type === "sale");

  // Payment method breakdown
  const paymentBreakdown: Record<string, number> = {};
  soldProducts.forEach((p) => {
    const method = p.sold?.buyer_renter?.payment_method ?? "other";
    paymentBreakdown[method] = (paymentBreakdown[method] ?? 0) + (p.sold?.buyer_renter?.amount_paid ?? 0);
  });

  // Platform breakdown
  const platformBreakdown: Record<string, number> = {};
  soldProducts.forEach((p) => {
    const platform = p.sold?.buyer_renter?.sale_platform ?? "other";
    platformBreakdown[platform] = (platformBreakdown[platform] ?? 0) + 1;
  });

  return (
    <div className="space-y-4">
      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Total Products"
          value={summary.total}
          color="text-white"
          icon={<Package className="w-3 h-3" />}
        />
        <StatCard
          label="Total Ordered Value"
          value={`$${summary.total_ordered_value.toFixed(0)}`}
          color="text-blue-300"
          icon={<ShoppingCart className="w-3 h-3" />}
        />
        <StatCard
          label="Total Sales Revenue"
          value={`$${summary.total_sold_value.toFixed(0)}`}
          color="text-green-300"
          icon={<DollarSign className="w-3 h-3" />}
        />
        <StatCard
          label="Rental Income"
          value={`$${summary.total_rental_income.toFixed(0)}`}
          color="text-cyan-300"
          icon={<RefreshCw className="w-3 h-3" />}
        />
        <StatCard
          label="Net Profit/Loss"
          value={`${totalProfit >= 0 ? "+" : ""}$${totalProfit.toFixed(0)}`}
          sub={`${profitPct}% return`}
          color={totalProfit >= 0 ? "text-green-400" : "text-red-400"}
          icon={<TrendingUp className="w-3 h-3" />}
        />
        <StatCard
          label="Active Listings"
          value={`$${summary.total_listed_value.toFixed(0)}`}
          sub="Total listed value"
          color="text-amber-300"
          icon={<Tag className="w-3 h-3" />}
        />
        <StatCard
          label="Sales Transactions"
          value={saleProducts.length}
          color="text-white"
          icon={<DollarSign className="w-3 h-3" />}
        />
        <StatCard
          label="Rental Transactions"
          value={rentalProducts.length}
          color="text-cyan-300"
          icon={<ArrowRightLeft className="w-3 h-3" />}
        />
      </div>

      {/* Stage pipeline breakdown */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            Pipeline by Stage
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-2">
            {LIFECYCLE_STAGES.map((stage) => {
              const count = summary.by_stage[stage] ?? 0;
              const pct = summary.total > 0 ? (count / summary.total) * 100 : 0;
              return (
                <div key={stage} className="flex items-center gap-3">
                  <span className="text-gray-400 text-xs w-24 shrink-0">{STAGE_LABELS[stage]}</span>
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor:
                          stage === "SOLD" ? "#22c55e" :
                          stage === "LISTED" ? BRAND.revvelGold :
                          stage === "TRANSFERRED" ? "#06b6d4" :
                          stage === "REVIEWED" ? "#a855f7" :
                          stage === "RECEIVED" ? BRAND.hailstormAmber :
                          stage === "SHIPPED" ? BRAND.stormVolt :
                          "#3b82f6",
                      }}
                    />
                  </div>
                  <span className="text-white text-xs w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Payment method breakdown */}
      {Object.keys(paymentBreakdown).length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-white text-sm">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(paymentBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([method, total]) => (
                  <div key={method} className="bg-white/5 rounded-lg p-2 border border-white/10">
                    <p className="text-xs text-gray-400 capitalize">{method.replace(/_/g, " ")}</p>
                    <p className="text-sm font-semibold text-white">${total.toFixed(2)}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform breakdown */}
      {Object.keys(platformBreakdown).length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-white text-sm">Sales by Platform</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(platformBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([platform, count]) => (
                  <div key={platform} className="bg-white/5 rounded-lg p-2 border border-white/10">
                    <p className="text-xs text-gray-400">{platform.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</p>
                    <p className="text-sm font-semibold text-white">{count} {count === 1 ? "sale" : "sales"}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────

export function ProductLifecycle() {
  const [products, setProducts] = useState<ProductLifecycleType[]>([]);
  const [stageFilter, setStageFilter] = useState<LifecycleStage | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState("tracker");

  const refresh = () => {
    setProducts(getProducts());
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(
    () => filterProducts(products, { stage: stageFilter, search, showArchived }),
    [products, stageFilter, search, showArchived]
  );

  const summary = useMemo(() => getLifecycleSummary(products), [products]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.filter((p) => !p.is_archived).forEach((p) => {
      counts[p.current_stage] = (counts[p.current_stage] ?? 0) + 1;
    });
    return counts;
  }, [products]);

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) =>
      selected ? [...prev, id] : prev.filter((i) => i !== id)
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((p) => p.id));
    }
  };

  const handleBulkAdvance = () => {
    bulkAdvanceStage(selectedIds);
    setSelectedIds([]);
    refresh();
  };

  const handleBulkArchive = () => {
    if (window.confirm(`Archive ${selectedIds.length} products?`)) {
      bulkArchive(selectedIds);
      setSelectedIds([]);
      refresh();
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Permanently delete ${selectedIds.length} products? This cannot be undone.`)) {
      bulkDelete(selectedIds);
      setSelectedIds([]);
      refresh();
    }
  };

  const handleExportCSV = () => {
    const csv = exportToCSV(filtered);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `product-lifecycle-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* ── HEADER ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span style={{ color: BRAND.hailstormAmber }}>⚡</span>
            Product Lifecycle Tracker
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Amazon → Shipped → Received → Reviewed → Transferred → Listed → Sold
          </p>
          <p className="text-gray-600 text-xs mt-0.5">
            Freedom Angel Corps EIN · Rocky Mountain Rentals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleExportCSV}
            className="h-8 text-xs bg-white/10 hover:bg-white/15 text-gray-300 border border-white/10"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={() => { setShowAddForm(true); setActiveTab("tracker"); }}
            className="h-8 text-xs"
            style={{ backgroundColor: BRAND.hailstormAmber + "33", borderColor: BRAND.hailstormAmber + "66", color: BRAND.revvelGold }}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Product
          </Button>
        </div>
      </div>

      {/* ── QUICK STATS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard
          label="Active Products"
          value={summary.total}
          color="text-white"
          icon={<Package className="w-3 h-3" />}
        />
        <StatCard
          label="Listed Value"
          value={`$${summary.total_listed_value.toFixed(0)}`}
          color="text-amber-300"
          icon={<Tag className="w-3 h-3" />}
        />
        <StatCard
          label="Total Sales"
          value={`$${summary.total_sold_value.toFixed(0)}`}
          color="text-green-300"
          icon={<DollarSign className="w-3 h-3" />}
        />
        <StatCard
          label="Rental Income"
          value={`$${summary.total_rental_income.toFixed(0)}`}
          color="text-cyan-300"
          icon={<RefreshCw className="w-3 h-3" />}
        />
      </div>

      {/* ── TABS ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white/10 border border-white/20 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="tracker" className="text-white data-[state=active]:bg-amber-500/30 data-[state=active]:text-amber-300 text-xs">
            <Package className="w-3.5 h-3.5 mr-1" />
            Tracker
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="text-white data-[state=active]:bg-amber-500/30 data-[state=active]:text-amber-300 text-xs">
            <Globe className="w-3.5 h-3.5 mr-1" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-amber-500/30 data-[state=active]:text-amber-300 text-xs">
            <BarChart3 className="w-3.5 h-3.5 mr-1" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* ── TRACKER TAB ── */}
        <TabsContent value="tracker" className="mt-4 space-y-4">
          {/* Add product form */}
          {showAddForm && (
            <AddProductForm
              onAdd={() => { setShowAddForm(false); refresh(); }}
              onCancel={() => setShowAddForm(false)}
            />
          )}

          {/* Search & filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, ASIN, order ID..."
                className="pl-8 h-8 text-sm bg-white/10 border-white/20 text-white placeholder:text-gray-600"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="accent-amber-500"
              />
              Show archived
            </label>
          </div>

          {/* Stage filter */}
          <StageFilterBar
            active={stageFilter}
            counts={stageCounts}
            onChange={setStageFilter}
          />

          {/* Bulk action bar */}
          <BulkActionBar
            selectedIds={selectedIds}
            onAdvance={handleBulkAdvance}
            onArchive={handleBulkArchive}
            onDelete={handleBulkDelete}
            onClear={() => setSelectedIds([])}
          />

          {/* Select all / count */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-1.5 hover:text-gray-300 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.length === filtered.length && filtered.length > 0}
                  onChange={handleSelectAll}
                  className="accent-amber-500"
                  readOnly
                />
                {selectedIds.length === filtered.length ? "Deselect all" : "Select all"}
              </button>
              <span>
                {filtered.length} product{filtered.length !== 1 ? "s" : ""}
                {search || stageFilter !== "ALL" ? " (filtered)" : ""}
              </span>
            </div>
          )}

          {/* Product rows */}
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="w-10 h-10 text-gray-600 mb-3" />
                <p className="text-gray-400 text-sm">
                  {search || stageFilter !== "ALL"
                    ? "No products match your filters."
                    : "No products yet. Click \"Add Product\" to get started."}
                </p>
                {(search || stageFilter !== "ALL") && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setSearch(""); setStageFilter("ALL"); }}
                    className="mt-2 text-xs text-gray-500 hover:text-gray-300"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              filtered.map((product) => (
                <ProductLifecycleRow
                  key={product.id}
                  product={product}
                  isSelected={selectedIds.includes(product.id)}
                  onSelect={handleSelect}
                  onRefresh={refresh}
                />
              ))
            )}
          </div>
        </TabsContent>

        {/* ── MARKETPLACE TAB ── */}
        <TabsContent value="marketplace" className="mt-4">
          <MarketplaceView products={products} onRefresh={refresh} />
        </TabsContent>

        {/* ── ANALYTICS TAB ── */}
        <TabsContent value="analytics" className="mt-4">
          <AnalyticsView products={products} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
