// ============================================================
// MARKETPLACE LISTING MANAGER
// Manages listings across Facebook Marketplace, Craigslist,
// OfferUp, and other platforms for Reese Reviews resale
// ============================================================

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Tag,
  ExternalLink,
  Plus,
  Pencil,
  Check,
  X,
  RefreshCw,
  TrendingUp,
  Eye,
  MessageSquare,
  DollarSign,
  Globe,
  AlertCircle,
  Copy,
} from "lucide-react";
import {
  type ProductLifecycle,
  type MarketplacePlatform,
  type ListingStatus,
  type PlatformListing,
  PLATFORM_LABELS,
  DEFAULT_LISTING_PLATFORMS,
  updateProduct,
  calcListingPrice,
} from "@/stores/productLifecycleStore";

// ─── PLATFORM CONFIG ─────────────────────────────────────────

const PLATFORM_ICONS: Record<MarketplacePlatform, string> = {
  facebook_marketplace: "📘",
  craigslist: "📋",
  offerup: "🟠",
  ebay: "🛒",
  poshmark: "👗",
  mercari: "🏷️",
  letgo: "📦",
  nextdoor: "🏘️",
  instagram: "📸",
  other: "🌐",
};

const PLATFORM_BASE_URLS: Partial<Record<MarketplacePlatform, string>> = {
  facebook_marketplace: "https://www.facebook.com/marketplace/create/item",
  craigslist: "https://post.craigslist.org/",
  offerup: "https://offerup.com/sell/",
  ebay: "https://www.ebay.com/sl/sell",
  poshmark: "https://poshmark.com/sell",
  mercari: "https://www.mercari.com/sell/",
};

const STATUS_STYLES: Record<ListingStatus, string> = {
  pending: "bg-gray-500/20 text-gray-300 border-gray-500/40",
  active: "bg-green-500/20 text-green-300 border-green-500/40",
  paused: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  sold: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  expired: "bg-red-500/20 text-red-300 border-red-500/40",
};

// ─── LISTING COPY GENERATOR ──────────────────────────────────

function generateListingCopy(product: ProductLifecycle, platform: MarketplacePlatform): string {
  const name = product.ordered?.product_name ?? "Item";
  const price = product.listed?.listing_price ?? 0;
  const condition = product.received?.condition_notes ?? "Good condition";
  const description = product.ordered?.description ?? "";

  const platformIntros: Partial<Record<MarketplacePlatform, string>> = {
    facebook_marketplace: "🔥 For sale on Facebook Marketplace!",
    craigslist: "For sale — great deal!",
    offerup: "✅ Listed on OfferUp!",
    instagram: "📦 DM to purchase!",
  };

  const intro = platformIntros[platform] ?? "For sale!";

  return `${intro}

📦 ${name}
💵 $${price.toFixed(2)} — firm

${description ? `About this item:\n${description}\n` : ""}
Condition: ${condition}

✅ Smoke-free home
✅ Fast response
✅ Pickup or shipping available

Message me to arrange pickup or shipping. Cash, Venmo, Zelle accepted.

#forsale #${name.toLowerCase().replace(/\s+/g, "")} #deal`;
}

// ─── SINGLE PLATFORM CARD ────────────────────────────────────

interface PlatformCardProps {
  listing: PlatformListing;
  product: ProductLifecycle;
  platformIdx: number;
  onUpdate: () => void;
}

function PlatformCard({ listing, product, platformIdx, onUpdate }: PlatformCardProps) {
  const [editingPrice, setEditingPrice] = useState(false);
  const [draftPrice, setDraftPrice] = useState(String(listing.listing_price));
  const [editingUrl, setEditingUrl] = useState(false);
  const [draftUrl, setDraftUrl] = useState(listing.listing_url ?? "");
  const [showCopy, setShowCopy] = useState(false);
  const [copied, setCopied] = useState(false);

  const saveField = (field: keyof PlatformListing, value: string | number) => {
    const platforms = [...(product.listed?.platforms ?? [])];
    platforms[platformIdx] = { ...platforms[platformIdx], [field]: value };
    updateProduct(product.id, { listed: { ...product.listed!, platforms } });
    onUpdate();
  };

  const handleCopyText = () => {
    const text = generateListingCopy(product, listing.platform);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const openPlatform = () => {
    const url = listing.listing_url || PLATFORM_BASE_URLS[listing.platform];
    if (url) window.open(url, "_blank");
  };

  return (
    <Card className="bg-white/5 border-white/10 hover:border-white/20 transition-all">
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{PLATFORM_ICONS[listing.platform]}</span>
            <div>
              <CardTitle className="text-white text-sm">{PLATFORM_LABELS[listing.platform]}</CardTitle>
              {listing.listed_date && (
                <CardDescription className="text-gray-500 text-xs">Listed {listing.listed_date}</CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Select
              value={listing.status}
              onValueChange={(v) => saveField("status", v)}
            >
              <SelectTrigger className="h-6 text-xs bg-transparent border-0 p-0 w-auto">
                <Badge className={`${STATUS_STYLES[listing.status]} text-xs cursor-pointer`}>
                  {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                </Badge>
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
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-3 space-y-2">
        {/* Price */}
        <div className="flex items-center gap-2">
          <DollarSign className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          {editingPrice ? (
            <div className="flex items-center gap-1 flex-1">
              <Input
                type="number"
                value={draftPrice}
                onChange={(e) => setDraftPrice(e.target.value)}
                className="h-6 text-xs bg-white/10 border-white/20 text-white px-2 py-0 w-24"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    saveField("listing_price", parseFloat(draftPrice) || 0);
                    setEditingPrice(false);
                  }
                  if (e.key === "Escape") setEditingPrice(false);
                }}
              />
              <Button size="sm" variant="ghost" onClick={() => { saveField("listing_price", parseFloat(draftPrice) || 0); setEditingPrice(false); }} className="h-6 w-6 p-0 text-green-400">
                <Check className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingPrice(false)} className="h-6 w-6 p-0 text-red-400">
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1 group flex-1">
              <span className="text-white font-semibold text-sm">${listing.listing_price.toFixed(2)}</span>
              <Button size="sm" variant="ghost" onClick={() => { setDraftPrice(String(listing.listing_price)); setEditingPrice(true); }} className="h-5 w-5 p-0 text-gray-600 hover:text-amber-400 opacity-0 group-hover:opacity-100">
                <Pencil className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        {(listing.views !== undefined || listing.inquiries !== undefined) && (
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {listing.views !== undefined && (
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" /> {listing.views} views
              </span>
            )}
            {listing.inquiries !== undefined && (
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> {listing.inquiries} inquiries
              </span>
            )}
          </div>
        )}

        {/* Listing URL */}
        <div className="flex items-center gap-1">
          {editingUrl ? (
            <div className="flex items-center gap-1 flex-1">
              <Input
                type="url"
                value={draftUrl}
                onChange={(e) => setDraftUrl(e.target.value)}
                placeholder="https://..."
                className="h-6 text-xs bg-white/10 border-white/20 text-white px-2 py-0 flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") { saveField("listing_url", draftUrl); setEditingUrl(false); }
                  if (e.key === "Escape") setEditingUrl(false);
                }}
              />
              <Button size="sm" variant="ghost" onClick={() => { saveField("listing_url", draftUrl); setEditingUrl(false); }} className="h-6 w-6 p-0 text-green-400">
                <Check className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1 group flex-1">
              {listing.listing_url ? (
                <a href={listing.listing_url} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 truncate">
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">View listing</span>
                </a>
              ) : (
                <span className="text-xs text-gray-600 italic">No URL yet</span>
              )}
              <Button size="sm" variant="ghost" onClick={() => { setDraftUrl(listing.listing_url ?? ""); setEditingUrl(true); }} className="h-5 w-5 p-0 text-gray-600 hover:text-amber-400 opacity-0 group-hover:opacity-100 ml-1">
                <Pencil className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Notes */}
        {listing.notes && (
          <p className="text-xs text-gray-500 italic">{listing.notes}</p>
        )}

        {/* Action buttons */}
        <div className="flex gap-1 pt-1">
          <Button
            size="sm"
            onClick={openPlatform}
            className="flex-1 h-7 text-xs bg-white/10 hover:bg-white/15 text-gray-300 border border-white/10"
          >
            <Globe className="w-3 h-3 mr-1" />
            {listing.listing_url ? "Open" : "Post"}
          </Button>
          <Button
            size="sm"
            onClick={() => setShowCopy((v) => !v)}
            className="flex-1 h-7 text-xs bg-white/10 hover:bg-white/15 text-gray-300 border border-white/10"
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy Text
          </Button>
        </div>

        {/* Listing copy text */}
        {showCopy && (
          <div className="mt-1">
            <div className="relative">
              <Textarea
                readOnly
                value={generateListingCopy(product, listing.platform)}
                className="h-32 text-xs bg-white/5 border-white/10 text-gray-300 resize-none font-mono"
              />
              <Button
                size="sm"
                onClick={handleCopyText}
                className={`absolute top-1 right-1 h-6 text-xs px-2 ${copied ? "bg-green-600 text-white" : "bg-white/20 text-gray-300"}`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── ADD PLATFORM FORM ───────────────────────────────────────

function AddPlatformForm({
  product,
  onAdd,
  onCancel,
}: {
  product: ProductLifecycle;
  onAdd: () => void;
  onCancel: () => void;
}) {
  const existingPlatforms = new Set(product.listed?.platforms.map((p) => p.platform) ?? []);
  const availablePlatforms = (Object.keys(PLATFORM_LABELS) as MarketplacePlatform[]).filter(
    (p) => !existingPlatforms.has(p)
  );

  const [platform, setPlatform] = useState<MarketplacePlatform>(availablePlatforms[0] ?? "other");
  const [price, setPrice] = useState(String(product.listed?.listing_price ?? 0));
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");

  const handleAdd = () => {
    const newListing: PlatformListing = {
      platform,
      status: "pending",
      listing_price: parseFloat(price) || (product.listed?.listing_price ?? 0),
      listed_date: new Date().toISOString().slice(0, 10),
      listing_url: url || undefined,
      notes: notes || undefined,
    };
    const platforms = [...(product.listed?.platforms ?? []), newListing];
    updateProduct(product.id, { listed: { ...product.listed!, platforms } });
    onAdd();
  };

  return (
    <Card className="bg-amber-500/5 border-amber-500/30">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-amber-300 text-sm flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Platform
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-2">
        <div className="space-y-1">
          <Label className="text-gray-400 text-xs">Platform</Label>
          <Select value={platform} onValueChange={(v) => setPlatform(v as MarketplacePlatform)}>
            <SelectTrigger className="h-7 text-xs bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availablePlatforms.map((p) => (
                <SelectItem key={p} value={p}>{PLATFORM_ICONS[p]} {PLATFORM_LABELS[p]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-gray-400 text-xs">Listing Price ($)</Label>
          <Input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-7 text-xs bg-white/10 border-white/20 text-white"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-gray-400 text-xs">Listing URL (optional)</Label>
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="h-7 text-xs bg-white/10 border-white/20 text-white"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-gray-400 text-xs">Notes (optional)</Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes..."
            className="h-7 text-xs bg-white/10 border-white/20 text-white"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={handleAdd} className="flex-1 h-7 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40">
            Add Platform
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 text-xs text-gray-400">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── GLOBAL DISCOUNT EDITOR ──────────────────────────────────

function GlobalDiscountEditor({
  product,
  onUpdate,
}: {
  product: ProductLifecycle;
  onUpdate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(product.listed?.discount_percentage ?? 30));

  const amazonPrice = product.ordered?.price_paid ?? 0;
  const currentPct = product.listed?.discount_percentage ?? 30;
  const currentPrice = product.listed?.listing_price ?? calcListingPrice(amazonPrice, currentPct);

  const applyDiscount = () => {
    const pct = Math.min(100, Math.max(0, parseFloat(draft) || 0));
    const newPrice = calcListingPrice(amazonPrice, pct);
    const platforms = (product.listed?.platforms ?? []).map((pl) => ({
      ...pl,
      listing_price: newPrice,
    }));
    updateProduct(product.id, {
      listed: {
        ...product.listed!,
        discount_percentage: pct,
        listing_price: newPrice,
        platforms,
      },
    });
    setEditing(false);
    onUpdate();
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
      <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
      <div className="flex-1">
        <p className="text-xs text-gray-400">Global Discount from Amazon Price</p>
        <p className="text-xs text-gray-500">
          Amazon: <span className="text-white">${amazonPrice.toFixed(2)}</span>
          {" → "}
          Listing: <span className="text-amber-400 font-semibold">${currentPrice.toFixed(2)}</span>
          {" "}
          <span className="text-gray-500">({currentPct}% off)</span>
        </p>
      </div>
      {editing ? (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            min="0"
            max="100"
            className="h-7 w-16 text-xs bg-white/10 border-white/20 text-white text-center px-1"
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") applyDiscount(); if (e.key === "Escape") setEditing(false); }}
          />
          <span className="text-gray-400 text-xs">%</span>
          <Button size="sm" variant="ghost" onClick={applyDiscount} className="h-7 w-7 p-0 text-green-400">
            <Check className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-7 w-7 p-0 text-red-400">
            <X className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          onClick={() => { setDraft(String(currentPct)); setEditing(true); }}
          className="h-7 text-xs bg-white/10 hover:bg-white/15 text-gray-300 border border-white/10"
        >
          <Pencil className="w-3 h-3 mr-1" />
          Edit %
        </Button>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────

interface MarketplaceListingProps {
  product: ProductLifecycle;
  onUpdate: () => void;
}

export function MarketplaceListing({ product, onUpdate }: MarketplaceListingProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [autoListAll, setAutoListAll] = useState(false);

  const platforms = product.listed?.platforms ?? [];
  const activePlatforms = platforms.filter((p) => p.status === "active").length;
  const soldPlatforms = platforms.filter((p) => p.status === "sold").length;

  const handleAutoList = () => {
    if (!product.listed) return;
    const existingPlatforms = new Set(platforms.map((p) => p.platform));
    const toAdd = DEFAULT_LISTING_PLATFORMS.filter((p) => !existingPlatforms.has(p));
    if (toAdd.length === 0) return;

    const newPlatforms: PlatformListing[] = toAdd.map((platform) => ({
      platform,
      status: "pending" as ListingStatus,
      listing_price: product.listed!.listing_price,
      listed_date: new Date().toISOString().slice(0, 10),
    }));

    updateProduct(product.id, {
      listed: {
        ...product.listed!,
        platforms: [...platforms, ...newPlatforms],
      },
    });
    onUpdate();
  };

  const handleRefreshAll = () => {
    onUpdate();
  };

  if (!product.listed) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="w-8 h-8 text-gray-600 mb-2" />
        <p className="text-gray-400 text-sm">Product not yet in LISTED stage.</p>
        <p className="text-gray-600 text-xs mt-1">Advance the product to the LISTED stage to manage marketplace listings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/5 rounded-lg border border-white/10 p-2 text-center">
          <p className="text-2xl font-bold text-white">{platforms.length}</p>
          <p className="text-xs text-gray-400">Platforms</p>
        </div>
        <div className="bg-green-500/10 rounded-lg border border-green-500/20 p-2 text-center">
          <p className="text-2xl font-bold text-green-300">{activePlatforms}</p>
          <p className="text-xs text-gray-400">Active</p>
        </div>
        <div className="bg-blue-500/10 rounded-lg border border-blue-500/20 p-2 text-center">
          <p className="text-2xl font-bold text-blue-300">{soldPlatforms}</p>
          <p className="text-xs text-gray-400">Sold</p>
        </div>
      </div>

      {/* Global discount editor */}
      <GlobalDiscountEditor product={product} onUpdate={onUpdate} />

      {/* Action bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          onClick={handleAutoList}
          className="h-7 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Auto-Add Default Platforms
        </Button>
        <Button
          size="sm"
          onClick={() => setShowAddForm(true)}
          className="h-7 text-xs bg-white/10 hover:bg-white/15 text-gray-300 border border-white/10"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Platform
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRefreshAll}
          className="h-7 text-xs text-gray-500 hover:text-gray-300"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Add platform form */}
      {showAddForm && (
        <AddPlatformForm
          product={product}
          onAdd={() => { setShowAddForm(false); onUpdate(); }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Platform cards grid */}
      {platforms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-white/10 rounded-lg">
          <Tag className="w-6 h-6 text-gray-600 mb-2" />
          <p className="text-gray-400 text-sm">No platforms added yet.</p>
          <p className="text-gray-600 text-xs mt-1">Click "Auto-Add Default Platforms" to add Facebook Marketplace, Craigslist, and OfferUp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {platforms.map((pl, idx) => (
            <PlatformCard
              key={`${pl.platform}-${idx}`}
              listing={pl}
              product={product}
              platformIdx={idx}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}

      {/* Listing description editor */}
      <div className="space-y-1">
        <Label className="text-gray-400 text-xs">Master Listing Description</Label>
        <Textarea
          value={product.listed?.listing_description ?? ""}
          onChange={(e) => {
            updateProduct(product.id, {
              listed: { ...product.listed!, listing_description: e.target.value },
            });
          }}
          onBlur={onUpdate}
          placeholder="Write a master description to use across all platforms..."
          className="h-24 text-xs bg-white/5 border-white/10 text-white placeholder:text-gray-600 resize-none"
        />
      </div>
    </div>
  );
}
