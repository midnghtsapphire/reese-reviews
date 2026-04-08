// ============================================================
// PRODUCT LIFECYCLE ROW
// Individual product row showing all 7 lifecycle stages
// Reese Reviews — Freedom Angel Corps / Rocky Mountain Rentals
// ============================================================

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Truck,
  Package,
  Star,
  ArrowRightLeft,
  Tag,
  DollarSign,
  Pencil,
  Check,
  X,
  ExternalLink,
  Phone,
  User,
  CreditCard,
  Calendar,
  RotateCcw,
  Archive,
  Trash2,
  ChevronRight,
} from "lucide-react";
import {
  type ProductLifecycle,
  type LifecycleStage,
  type PaymentMethod,
  type SalePlatform,
  type TransactionType,
  type ReturnStatus,
  LIFECYCLE_STAGES,
  STAGE_LABELS,
  STAGE_COLORS,
  PAYMENT_METHOD_LABELS,
  SALE_PLATFORM_LABELS,
  updateProduct,
  advanceStage,
  deleteProduct,
  calcListingPrice,
} from "@/stores/productLifecycleStore";

// ─── STAGE ICON MAP ──────────────────────────────────────────

const STAGE_ICONS: Record<LifecycleStage, React.ReactNode> = {
  ORDERED: <ShoppingCart className="w-3.5 h-3.5" />,
  SHIPPED: <Truck className="w-3.5 h-3.5" />,
  RECEIVED: <Package className="w-3.5 h-3.5" />,
  REVIEWED: <Star className="w-3.5 h-3.5" />,
  TRANSFERRED: <ArrowRightLeft className="w-3.5 h-3.5" />,
  LISTED: <Tag className="w-3.5 h-3.5" />,
  SOLD: <DollarSign className="w-3.5 h-3.5" />,
};

// ─── STAGE PILL ──────────────────────────────────────────────

function StagePill({
  stage,
  isActive,
  isCompleted,
}: {
  stage: LifecycleStage;
  isActive: boolean;
  isCompleted: boolean;
}) {
  const base = "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-all";
  let cls = "";
  if (isActive) cls = STAGE_COLORS[stage] + " ring-1 ring-offset-1 ring-offset-transparent";
  else if (isCompleted) cls = "bg-white/10 text-gray-300 border-white/20";
  else cls = "bg-white/5 text-gray-500 border-white/10";

  return (
    <span className={`${base} ${cls}`}>
      {STAGE_ICONS[stage]}
      <span className="hidden sm:inline">{STAGE_LABELS[stage]}</span>
    </span>
  );
}

// ─── FIELD EDITOR ────────────────────────────────────────────

function FieldRow({
  label,
  value,
  onSave,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string | number | undefined;
  onSave: (v: string) => void;
  type?: "text" | "number" | "date" | "url" | "tel";
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ""));

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(String(value ?? ""));
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-2 py-1 border-b border-white/5 last:border-0">
      <span className="text-gray-400 text-xs w-32 shrink-0">{label}</span>
      {editing ? (
        <div className="flex items-center gap-1 flex-1">
          <Input
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="h-6 text-xs bg-white/10 border-white/20 text-white px-2 py-0"
            placeholder={placeholder}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
          />
          <Button size="sm" variant="ghost" onClick={handleSave} className="h-6 w-6 p-0 text-green-400 hover:text-green-300">
            <Check className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel} className="h-6 w-6 p-0 text-red-400 hover:text-red-300">
            <X className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-1 flex-1 group">
          <span className="text-white text-xs flex-1 truncate">
            {value !== undefined && value !== "" ? String(value) : <span className="text-gray-600 italic">—</span>}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setDraft(String(value ?? "")); setEditing(true); }}
            className="h-5 w-5 p-0 text-gray-600 hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Pencil className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── STAGE DETAIL PANELS ─────────────────────────────────────

function OrderedPanel({ product, onUpdate }: { product: ProductLifecycle; onUpdate: () => void }) {
  const o = product.ordered;
  const save = (field: string) => (v: string) => {
    updateProduct(product.id, {
      ordered: {
        ...product.ordered!,
        [field]: field === "price_paid" ? parseFloat(v) || 0 : v,
        ein_registered: product.ordered?.ein_registered ?? true,
        product_images: product.ordered?.product_images ?? [],
      },
    });
    onUpdate();
  };

  return (
    <div className="space-y-0">
      <FieldRow label="ASIN" value={o?.asin} onSave={save("asin")} placeholder="B0..." />
      <FieldRow label="Product Name" value={o?.product_name} onSave={save("product_name")} />
      <FieldRow label="Order ID" value={o?.order_id} onSave={save("order_id")} />
      <FieldRow label="Order Date" value={o?.order_date} onSave={save("order_date")} type="date" />
      <FieldRow label="Price Paid ($)" value={o?.price_paid} onSave={save("price_paid")} type="number" />
      <FieldRow label="Description" value={o?.description} onSave={save("description")} />
      <div className="flex items-center gap-2 py-1">
        <span className="text-gray-400 text-xs w-32 shrink-0">EIN Registered</span>
        <Switch
          checked={o?.ein_registered ?? true}
          onCheckedChange={(v) => {
            updateProduct(product.id, { ordered: { ...product.ordered!, ein_registered: v } });
            onUpdate();
          }}
        />
        <span className="text-xs text-gray-400">Freedom Angel Corps</span>
      </div>
    </div>
  );
}

function ShippedPanel({ product, onUpdate }: { product: ProductLifecycle; onUpdate: () => void }) {
  const s = product.shipped;
  const save = (field: string) => (v: string) => {
    updateProduct(product.id, { shipped: { ...product.shipped!, [field]: v } });
    onUpdate();
  };
  return (
    <div className="space-y-0">
      <FieldRow label="Carrier" value={s?.carrier} onSave={save("carrier")} placeholder="UPS, FedEx, USPS..." />
      <FieldRow label="Tracking #" value={s?.tracking_number} onSave={save("tracking_number")} />
      <FieldRow label="Shipped Date" value={s?.shipped_date} onSave={save("shipped_date")} type="date" />
      <FieldRow label="Est. Delivery" value={s?.estimated_delivery} onSave={save("estimated_delivery")} type="date" />
    </div>
  );
}

function ReceivedPanel({ product, onUpdate }: { product: ProductLifecycle; onUpdate: () => void }) {
  const r = product.received;
  const save = (field: string) => (v: string) => {
    updateProduct(product.id, { received: { ...product.received!, [field]: v } });
    onUpdate();
  };
  return (
    <div className="space-y-0">
      <FieldRow label="Date Received" value={r?.date_received} onSave={save("date_received")} type="date" />
      <FieldRow label="Condition Notes" value={r?.condition_notes} onSave={save("condition_notes")} />
    </div>
  );
}

function ReviewedPanel({ product, onUpdate }: { product: ProductLifecycle; onUpdate: () => void }) {
  const rv = product.reviewed;
  const save = (field: string) => (v: string) => {
    updateProduct(product.id, { reviewed: { ...product.reviewed!, [field]: v } });
    onUpdate();
  };
  return (
    <div className="space-y-0">
      <FieldRow label="Review Link" value={rv?.review_link} onSave={save("review_link")} type="url" />
      <div className="flex items-center gap-2 py-1 border-b border-white/5">
        <span className="text-gray-400 text-xs w-32 shrink-0">Review Status</span>
        <Select
          value={rv?.review_status ?? "pending"}
          onValueChange={(v) => {
            updateProduct(product.id, { reviewed: { ...product.reviewed!, review_status: v as string } });
            onUpdate();
          }}
        >
          <SelectTrigger className="h-6 text-xs bg-white/10 border-white/20 text-white w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="posted">Posted</SelectItem>
          </SelectContent>
        </Select>
        {rv?.review_link && (
          <a href={rv.review_link} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300">
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
      <FieldRow label="Review Date" value={rv?.review_date} onSave={save("review_date")} type="date" />
      <FieldRow label="Platform" value={rv?.review_platform} onSave={save("review_platform")} placeholder="Amazon, blog..." />
    </div>
  );
}

function TransferredPanel({ product, onUpdate }: { product: ProductLifecycle; onUpdate: () => void }) {
  const t = product.transferred;
  const save = (field: string) => (v: string) => {
    updateProduct(product.id, {
      transferred: {
        ...product.transferred!,
        [field]: field === "fair_market_value" ? parseFloat(v) || 0 : v,
      },
    });
    onUpdate();
  };
  return (
    <div className="space-y-0">
      <FieldRow label="Transfer Date" value={t?.transfer_date} onSave={save("transfer_date")} type="date" />
      <FieldRow label="Recipient" value={t?.recipient ?? "Rocky Mountain Rentals"} onSave={save("recipient")} />
      <FieldRow label="Fair Market Value ($)" value={t?.fair_market_value} onSave={save("fair_market_value")} type="number" />
      <FieldRow label="Document Ref" value={t?.transfer_document_ref} onSave={save("transfer_document_ref")} placeholder="RMR-CAP-2026-XXX" />
      <FieldRow label="Notes" value={t?.notes} onSave={save("notes")} />
    </div>
  );
}

function ListedPanel({ product, onUpdate }: { product: ProductLifecycle; onUpdate: () => void }) {
  const l = product.listed;
  const amazonPrice = product.ordered?.price_paid ?? 0;

  const handleDiscountChange = (v: string) => {
    const pct = Math.min(100, Math.max(0, parseFloat(v) || 0));
    const newPrice = calcListingPrice(amazonPrice, pct);
    updateProduct(product.id, {
      listed: {
        ...product.listed!,
        discount_percentage: pct,
        listing_price: newPrice,
      },
    });
    onUpdate();
  };

  const handlePriceChange = (v: string) => {
    updateProduct(product.id, { listed: { ...product.listed!, listing_price: parseFloat(v) || 0 } });
    onUpdate();
  };

  return (
    <div className="space-y-0">
      <FieldRow label="Listed Date" value={l?.listed_date} onSave={(v) => { updateProduct(product.id, { listed: { ...product.listed!, listed_date: v } }); onUpdate(); }} type="date" />
      <FieldRow label="Discount %" value={l?.discount_percentage ?? 30} onSave={handleDiscountChange} type="number" />
      <FieldRow label="Listing Price ($)" value={l?.listing_price} onSave={handlePriceChange} type="number" />
      <FieldRow label="Amazon Price ($)" value={amazonPrice} onSave={() => {}} />
      <div className="pt-1 space-y-1">
        {(l?.platforms ?? []).map((pl, i) => (
          <div key={pl.platform} className="flex items-center justify-between py-0.5">
            <span className="text-gray-400 text-xs w-40 shrink-0">{pl.platform.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
            <Select
              value={pl.status}
              onValueChange={(v) => {
                const platforms = [...(product.listed?.platforms ?? [])];
                platforms[i] = { ...platforms[i], status: v as string };
                updateProduct(product.id, { listed: { ...product.listed!, platforms } });
                onUpdate();
              }}
            >
              <SelectTrigger className="h-6 text-xs bg-white/10 border-white/20 text-white w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}

function SoldPanel({ product, onUpdate }: { product: ProductLifecycle; onUpdate: () => void }) {
  const br = product.sold?.buyer_renter;
  const isRental = br?.transaction_type === "rental";

  const saveBR = (field: string) => (v: string | number | boolean) => {
    updateProduct(product.id, {
      sold: {
        buyer_renter: {
          transaction_type: "sale",
          full_name: "",
          phone_number: "",
          social_media_handle: "",
          social_media_platform: "",
          amount_paid: 0,
          payment_method: "cash",
          transaction_date: new Date().toISOString().slice(0, 10),
          sale_platform: "facebook_marketplace",
          shipping_or_pickup: "pickup",
          ...product.sold?.buyer_renter,
          [field]: v,
        },
      },
    });
    onUpdate();
  };

  return (
    <div className="space-y-1">
      {/* Sale vs Rental Toggle */}
      <div className="flex items-center gap-3 py-1 border-b border-white/10 mb-2">
        <span className="text-xs font-semibold text-amber-400">Transaction Type</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${!isRental ? "text-white font-medium" : "text-gray-500"}`}>Sale</span>
          <Switch
            checked={isRental}
            onCheckedChange={(v) => saveBR("transaction_type")(v ? "rental" : "sale")}
          />
          <span className={`text-xs ${isRental ? "text-white font-medium" : "text-gray-500"}`}>Rental</span>
        </div>
        {isRental && (
          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-xs">Rocky Mountain Rentals</Badge>
        )}
      </div>

      {/* Buyer / Renter Contact */}
      <div className="grid grid-cols-1 gap-0">
        <FieldRow label="Full Name" value={br?.full_name} onSave={saveBR("full_name")} placeholder="First Last" />
        <FieldRow label="Phone" value={br?.phone_number} onSave={saveBR("phone_number")} type="tel" placeholder="720-555-0100" />
        <FieldRow label="Social Platform" value={br?.social_media_platform} onSave={saveBR("social_media_platform")} placeholder="Instagram, Facebook..." />
        <FieldRow label="Social Handle/URL" value={br?.social_media_handle} onSave={saveBR("social_media_handle")} placeholder="@username or profile URL" />
      </div>

      {/* Payment */}
      <div className="border-t border-white/10 pt-1 space-y-0">
        <FieldRow label="Amount Paid ($)" value={br?.amount_paid} onSave={(v) => saveBR("amount_paid")(parseFloat(v) || 0)} type="number" />
        <div className="flex items-center gap-2 py-1 border-b border-white/5">
          <span className="text-gray-400 text-xs w-32 shrink-0">Payment Method</span>
          <Select
            value={br?.payment_method ?? "cash"}
            onValueChange={(v) => saveBR("payment_method")(v)}
          >
            <SelectTrigger className="h-6 text-xs bg-white/10 border-white/20 text-white w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <FieldRow label="Payment Ref" value={br?.payment_reference} onSave={saveBR("payment_reference")} placeholder="Venmo @handle, check #..." />
        <FieldRow label="Transaction Date" value={br?.transaction_date} onSave={saveBR("transaction_date")} type="date" />
      </div>

      {/* Sale Details */}
      <div className="border-t border-white/10 pt-1 space-y-0">
        <div className="flex items-center gap-2 py-1 border-b border-white/5">
          <span className="text-gray-400 text-xs w-32 shrink-0">Sold On</span>
          <Select
            value={br?.sale_platform ?? "facebook_marketplace"}
            onValueChange={(v) => saveBR("sale_platform")(v)}
          >
            <SelectTrigger className="h-6 text-xs bg-white/10 border-white/20 text-white w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SALE_PLATFORM_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 py-1 border-b border-white/5">
          <span className="text-gray-400 text-xs w-32 shrink-0">Fulfillment</span>
          <Select
            value={br?.shipping_or_pickup ?? "pickup"}
            onValueChange={(v) => saveBR("shipping_or_pickup")(v)}
          >
            <SelectTrigger className="h-6 text-xs bg-white/10 border-white/20 text-white w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pickup">Pickup</SelectItem>
              <SelectItem value="shipping">Shipping</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {br?.shipping_or_pickup === "shipping" && (
          <FieldRow label="Tracking Out" value={br?.tracking_number_out} onSave={saveBR("tracking_number_out")} />
        )}
        <FieldRow label="Notes" value={br?.notes} onSave={saveBR("notes")} />
      </div>

      {/* Rental-only fields */}
      {isRental && (
        <div className="border-t border-cyan-500/30 pt-2 space-y-0">
          <p className="text-xs font-semibold text-cyan-400 mb-1">Rental Details</p>
          <FieldRow label="Rental Company" value={br?.rental_company ?? "Rocky Mountain Rentals"} onSave={saveBR("rental_company")} />
          <FieldRow label="Rental Start" value={br?.rental_start_date} onSave={saveBR("rental_start_date")} type="date" />
          <FieldRow label="Rental End" value={br?.rental_end_date} onSave={saveBR("rental_end_date")} type="date" />
          <FieldRow label="Deposit ($)" value={br?.deposit_amount} onSave={(v) => saveBR("deposit_amount")(parseFloat(v) || 0)} type="number" />
          <div className="flex items-center gap-2 py-1 border-b border-white/5">
            <span className="text-gray-400 text-xs w-32 shrink-0">Deposit Returned</span>
            <Switch
              checked={br?.deposit_returned ?? false}
              onCheckedChange={(v) => saveBR("deposit_returned")(v)}
            />
          </div>
          <div className="flex items-center gap-2 py-1 border-b border-white/5">
            <span className="text-gray-400 text-xs w-32 shrink-0">Return Status</span>
            <Select
              value={br?.return_status ?? "not_returned"}
              onValueChange={(v) => saveBR("return_status")(v)}
            >
              <SelectTrigger className="h-6 text-xs bg-white/10 border-white/20 text-white w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_returned">Not Returned</SelectItem>
                <SelectItem value="returned_good">Returned — Good</SelectItem>
                <SelectItem value="returned_damaged">Returned — Damaged</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <FieldRow label="Condition on Return" value={br?.condition_on_return} onSave={saveBR("condition_on_return")} placeholder="Describe condition..." />
        </div>
      )}
    </div>
  );
}

// ─── STAGE PANEL ROUTER ──────────────────────────────────────

function StagePanel({
  stage,
  product,
  onUpdate,
}: {
  stage: LifecycleStage;
  product: ProductLifecycle;
  onUpdate: () => void;
}) {
  switch (stage) {
    case "ORDERED": return <OrderedPanel product={product} onUpdate={onUpdate} />;
    case "SHIPPED": return <ShippedPanel product={product} onUpdate={onUpdate} />;
    case "RECEIVED": return <ReceivedPanel product={product} onUpdate={onUpdate} />;
    case "REVIEWED": return <ReviewedPanel product={product} onUpdate={onUpdate} />;
    case "TRANSFERRED": return <TransferredPanel product={product} onUpdate={onUpdate} />;
    case "LISTED": return <ListedPanel product={product} onUpdate={onUpdate} />;
    case "SOLD": return <SoldPanel product={product} onUpdate={onUpdate} />;
    default: return null;
  }
}

// ─── MAIN ROW COMPONENT ──────────────────────────────────────

interface ProductLifecycleRowProps {
  product: ProductLifecycle;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onRefresh: () => void;
}

export function ProductLifecycleRow({
  product,
  isSelected,
  onSelect,
  onRefresh,
}: ProductLifecycleRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeStage, setActiveStage] = useState<LifecycleStage>(product.current_stage);

  const currentStageIdx = LIFECYCLE_STAGES.indexOf(product.current_stage);
  const isLastStage = currentStageIdx === LIFECYCLE_STAGES.length - 1;

  const handleAdvance = () => {
    advanceStage(product.id);
    onRefresh();
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${product.ordered?.product_name ?? product.id}"? This cannot be undone.`)) {
      deleteProduct(product.id);
      onRefresh();
    }
  };

  const handleArchive = () => {
    updateProduct(product.id, { is_archived: true });
    onRefresh();
  };

  const handleUpdate = () => {
    onRefresh();
  };

  const soldBR = product.sold?.buyer_renter;
  const isRental = soldBR?.transaction_type === "rental";

  return (
    <div
      className={`rounded-lg border transition-all duration-200 ${
        isSelected
          ? "border-amber-500/60 bg-amber-500/5"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
      }`}
    >
      {/* ── COLLAPSED HEADER ── */}
      <div className="flex items-center gap-3 p-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(product.id, e.target.checked)}
          className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
        />

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Product info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-medium text-sm truncate">
              {product.ordered?.product_name ?? "Unnamed Product"}
            </span>
            {product.ordered?.asin && (
              <span className="text-gray-500 text-xs font-mono">{product.ordered.asin}</span>
            )}
            {product.tags.map((tag) => (
              <Badge key={tag} className="bg-white/10 text-gray-400 border-white/10 text-xs px-1.5 py-0">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
            {product.ordered?.order_date && <span>{product.ordered.order_date}</span>}
            {product.ordered?.price_paid && (
              <span className="text-amber-400/80">${product.ordered.price_paid.toFixed(2)}</span>
            )}
            {product.current_stage === "SOLD" && soldBR && (
              <span className={`${isRental ? "text-cyan-400" : "text-green-400"}`}>
                {isRental ? "Rented" : "Sold"} for ${soldBR.amount_paid.toFixed(2)} via {PAYMENT_METHOD_LABELS[soldBR.payment_method]}
              </span>
            )}
          </div>
        </div>

        {/* Stage pipeline — compact */}
        <div className="hidden md:flex items-center gap-1 flex-shrink-0">
          {LIFECYCLE_STAGES.map((stage, idx) => (
            <React.Fragment key={stage}>
              <StagePill
                stage={stage}
                isActive={stage === product.current_stage}
                isCompleted={idx < currentStageIdx}
              />
              {idx < LIFECYCLE_STAGES.length - 1 && (
                <ChevronRight className="w-2.5 h-2.5 text-gray-600 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Current stage badge — mobile */}
        <div className="md:hidden">
          <StagePill stage={product.current_stage} isActive={true} isCompleted={false} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {!isLastStage && (
            <Button
              size="sm"
              onClick={handleAdvance}
              className="h-7 text-xs px-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40"
            >
              Advance →
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleArchive}
            className="h-7 w-7 p-0 text-gray-500 hover:text-gray-300"
            title="Archive"
          >
            <Archive className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            className="h-7 w-7 p-0 text-gray-500 hover:text-red-400"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* ── EXPANDED DETAIL ── */}
      {expanded && (
        <div className="border-t border-white/10 p-3">
          {/* Stage tabs */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {LIFECYCLE_STAGES.map((stage, idx) => {
              const isCompleted = idx < currentStageIdx;
              const isCurrent = stage === product.current_stage;
              const isFuture = idx > currentStageIdx;
              return (
                <button
                  key={stage}
                  onClick={() => setActiveStage(stage)}
                  disabled={isFuture}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                    activeStage === stage
                      ? STAGE_COLORS[stage] + " ring-1 ring-offset-1 ring-offset-transparent"
                      : isCurrent
                      ? "bg-white/10 text-gray-200 border-white/20 hover:bg-white/15"
                      : isCompleted
                      ? "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                      : "bg-white/3 text-gray-600 border-white/5 cursor-not-allowed opacity-50"
                  }`}
                >
                  {STAGE_ICONS[stage]}
                  {STAGE_LABELS[stage]}
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  )}
                  {isCompleted && (
                    <Check className="w-3 h-3 text-green-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Active stage panel */}
          <div className="bg-white/5 rounded-lg border border-white/10 p-3">
            <h4 className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider flex items-center gap-1.5">
              {STAGE_ICONS[activeStage]}
              {STAGE_LABELS[activeStage]} Details
              {activeStage === product.current_stage && (
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs ml-1">Current Stage</Badge>
              )}
            </h4>
            <StagePanel stage={activeStage} product={product} onUpdate={handleUpdate} />
          </div>

          {/* Internal notes */}
          <div className="mt-3">
            <Label className="text-gray-400 text-xs">Internal Notes</Label>
            <Textarea
              value={product.internal_notes}
              onChange={(e) => {
                updateProduct(product.id, { internal_notes: e.target.value });
              }}
              onBlur={handleUpdate}
              className="mt-1 h-16 text-xs bg-white/5 border-white/10 text-white placeholder:text-gray-600 resize-none"
              placeholder="Private notes visible only in admin..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
