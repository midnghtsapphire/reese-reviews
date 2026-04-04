// ============================================================
// WIZARD STEP 1: VINE IMPORT
// Select a Vine item to review. Loads from vineReviewStore
// or allows manual entry of product details.
// ============================================================

import React, { useState, useCallback, useEffect } from "react";
import {
  Package,
  Search,
  Plus,
  Check,
  CheckCircle2,
  ExternalLink,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WizardData } from "../ReviewPublishingWizard";
import { PRODUCT_CATEGORIES } from "@/stores/reviewAutomationStore";

// ─── TYPES ──────────────────────────────────────────────────

interface Props {
  data: WizardData;
  updateData: (patch: Partial<WizardData>) => void;
}

// Mock Vine items for demo (in production, these come from vineReviewStore)
const DEMO_VINE_ITEMS = [
  {
    asin: "B0CXYZ1234",
    productName: "Wireless Noise-Cancelling Headphones Pro",
    category: "electronics",
    imageUrl: "https://placehold.co/200x200/1a1a2e/f59e0b?text=Headphones",
    estimatedValue: "$149.99",
    vineQueue: "potluck",
  },
  {
    asin: "B0ABCD5678",
    productName: "Organic Matcha Green Tea Powder",
    category: "food",
    imageUrl: "https://placehold.co/200x200/1a1a2e/22c55e?text=Matcha",
    estimatedValue: "$34.99",
    vineQueue: "additional_items",
  },
  {
    asin: "B0EFGH9012",
    productName: "Smart Home Security Camera 4K",
    category: "tech",
    imageUrl: "https://placehold.co/200x200/1a1a2e/3b82f6?text=Camera",
    estimatedValue: "$89.99",
    vineQueue: "potluck",
  },
  {
    asin: "B0IJKL3456",
    productName: "Premium Bamboo Cutting Board Set",
    category: "home",
    imageUrl: "https://placehold.co/200x200/1a1a2e/a855f7?text=Bamboo",
    estimatedValue: "$42.99",
    vineQueue: "last_chance",
  },
  {
    asin: "B0MNOP7890",
    productName: "Vitamin C Brightening Serum",
    category: "beauty",
    imageUrl: "https://placehold.co/200x200/1a1a2e/ec4899?text=Serum",
    estimatedValue: "$28.99",
    vineQueue: "additional_items",
  },
];

// ─── COMPONENT ──────────────────────────────────────────────

export function WizardStepVineImport({ data, updateData }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualProduct, setManualProduct] = useState({
    asin: "",
    productName: "",
    category: "electronics",
    imageUrl: "",
    estimatedValue: "",
    vineQueue: "potluck",
  });

  const filteredItems = DEMO_VINE_ITEMS.filter(
    (item) =>
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.asin.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectItem = useCallback(
    (item: typeof DEMO_VINE_ITEMS[0]) => {
      updateData({ vineItem: item });
    },
    [updateData]
  );

  const handleManualSubmit = useCallback(() => {
    if (manualProduct.asin && manualProduct.productName) {
      updateData({
        vineItem: {
          ...manualProduct,
          imageUrl:
            manualProduct.imageUrl ||
            `https://placehold.co/200x200/1a1a2e/f59e0b?text=${encodeURIComponent(manualProduct.productName.slice(0, 10))}`,
        },
      });
    }
  }, [manualProduct, updateData]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Vine items by name or ASIN..."
          className="pl-10 bg-gray-800 border-gray-700"
        />
      </div>

      {/* Vine items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
        {filteredItems.map((item) => {
          const isSelected = data.vineItem?.asin === item.asin;
          return (
            <button
              key={item.asin}
              onClick={() => handleSelectItem(item)}
              className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all ${
                isSelected
                  ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30"
                  : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
              }`}
            >
              <img
                src={item.imageUrl}
                alt={item.productName}
                className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 line-clamp-2">
                  {item.productName}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 font-mono">
                  {item.asin}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className="text-[10px] border-gray-600 text-gray-400"
                  >
                    {item.category}
                  </Badge>
                  <span className="text-xs text-green-400">
                    {item.estimatedValue}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] border-purple-500/30 text-purple-400"
                  >
                    {item.vineQueue.replace("_", " ")}
                  </Badge>
                </div>
              </div>
              {isSelected && (
                <Check className="h-5 w-5 text-amber-400 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Manual entry toggle */}
      <div className="border-t border-gray-700 pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowManualEntry(!showManualEntry)}
          className="text-gray-400"
        >
          <Plus className="h-4 w-4 mr-1" />
          {showManualEntry ? "Hide Manual Entry" : "Enter Product Manually"}
        </Button>

        {showManualEntry && (
          <div className="mt-3 space-y-3 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-400">ASIN</Label>
                <Input
                  value={manualProduct.asin}
                  onChange={(e) =>
                    setManualProduct({ ...manualProduct, asin: e.target.value })
                  }
                  placeholder="B0XXXXXXXXX"
                  className="mt-1 bg-gray-900 border-gray-700 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-400">Category</Label>
                <Select
                  value={manualProduct.category}
                  onValueChange={(v) =>
                    setManualProduct({ ...manualProduct, category: v })
                  }
                >
                  <SelectTrigger className="mt-1 bg-gray-900 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-400">Product Name</Label>
              <Input
                value={manualProduct.productName}
                onChange={(e) =>
                  setManualProduct({
                    ...manualProduct,
                    productName: e.target.value,
                  })
                }
                placeholder="Full product name"
                className="mt-1 bg-gray-900 border-gray-700"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-400">
                  Estimated Value
                </Label>
                <Input
                  value={manualProduct.estimatedValue}
                  onChange={(e) =>
                    setManualProduct({
                      ...manualProduct,
                      estimatedValue: e.target.value,
                    })
                  }
                  placeholder="$49.99"
                  className="mt-1 bg-gray-900 border-gray-700"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-400">Image URL</Label>
                <Input
                  value={manualProduct.imageUrl}
                  onChange={(e) =>
                    setManualProduct({
                      ...manualProduct,
                      imageUrl: e.target.value,
                    })
                  }
                  placeholder="https://..."
                  className="mt-1 bg-gray-900 border-gray-700"
                />
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleManualSubmit}
              disabled={!manualProduct.asin || !manualProduct.productName}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              Use This Product
            </Button>
          </div>
        )}
      </div>

      {/* Selected item summary */}
      {data.vineItem && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-400">
              Selected: {data.vineItem.productName}
            </p>
            <p className="text-xs text-gray-400 font-mono">
              ASIN: {data.vineItem.asin}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


