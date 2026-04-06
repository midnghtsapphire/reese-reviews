import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Package, TrendingUp, Gift, Trash2, Plus } from "lucide-react";

interface InventoryItem {
  id: string;
  product_name: string;
  status: string;
  acquisition_cost: number;
  acquisition_date: string;
  source: string;
  reviewed_date?: string;
  sale_price?: number;
  sale_date?: string;
  estimated_value?: number;
}

export function InventoryManager() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddForm, setShowAddForm] = useState(false);

  // Demo inventory items
  const inventoryItems: InventoryItem[] = [
    {
      id: "inv-001",
      product_name: "Anker 3-in-1 Charging Cable",
      status: "reviewed",
      acquisition_cost: 24.99,
      acquisition_date: "2025-12-15",
      source: "vine",
      reviewed_date: "2026-01-10",
    },
    {
      id: "inv-002",
      product_name: "Ninja Creami Ice Cream Maker",
      status: "ready_to_resell",
      acquisition_cost: 199.99,
      acquisition_date: "2025-08-10",
      source: "purchased",
      reviewed_date: "2025-09-15",
      estimated_value: 175.0,
    },
    {
      id: "inv-003",
      product_name: "Ring Video Doorbell 4",
      status: "sold",
      acquisition_cost: 149.99,
      acquisition_date: "2025-10-15",
      source: "purchased",
      sale_price: 120.0,
      sale_date: "2026-02-01",
    },
    {
      id: "inv-004",
      product_name: "USB-C Hub 7-in-1",
      status: "in_use",
      acquisition_cost: 34.99,
      acquisition_date: "2026-01-05",
      source: "vine",
      reviewed_date: "2026-02-05",
    },
  ];

  const statusColors: Record<string, string> = {
    in_use: "bg-blue-100 text-blue-800",
    reviewed: "bg-green-100 text-green-800",
    ready_to_resell: "bg-yellow-100 text-yellow-800",
    listed_for_sale: "bg-steel-shine/20 text-steel-shine",
    sold: "bg-emerald-100 text-emerald-800",
    donated: "bg-pink-100 text-pink-800",
    rented_out: "bg-orange-100 text-orange-800",
  };

  const statusLabels: Record<string, string> = {
    in_use: "In Use",
    reviewed: "Reviewed",
    ready_to_resell: "Ready to Resell",
    listed_for_sale: "Listed for Sale",
    sold: "Sold",
    donated: "Donated",
    rented_out: "Rented Out",
  };

  // Calculate metrics
  const totalItems = inventoryItems.length;
  const itemsInUse = inventoryItems.filter((i) => i.status === "in_use").length;
  const itemsReviewed = inventoryItems.filter((i) => i.status === "reviewed").length;
  const itemsReadyToResell = inventoryItems.filter((i) => i.status === "ready_to_resell").length;
  const totalAcquisitionCost = inventoryItems.reduce((sum, i) => sum + i.acquisition_cost, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Inventory Management</h2>
          <p className="text-gray-600">Track products through their lifecycle: review → resale → donation</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-gray-500 mt-1">In inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">In Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{itemsInUse}</div>
            <p className="text-xs text-gray-500 mt-1">Being used/tested</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Ready to Resell</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{itemsReadyToResell}</div>
            <p className="text-xs text-gray-500 mt-1">Reviewed & ready</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Cost Basis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAcquisitionCost.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">Acquisition cost</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Item Form */}
      {showAddForm && (
        <Card className="border-steel-shine/20 bg-gradient-to-br from-steel-shine/5 to-transparent">
          <CardHeader>
            <CardTitle>Add New Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product-name">Product Name</Label>
                <Input id="product-name" placeholder="Product name" />
              </div>
              <div>
                <Label htmlFor="asin">ASIN (optional)</Label>
                <Input id="asin" placeholder="B0..." />
              </div>
              <div>
                <Label htmlFor="cost">Acquisition Cost</Label>
                <Input id="cost" type="number" placeholder="0.00" />
              </div>
              <div>
                <Label htmlFor="source">Source</Label>
                <Select defaultValue="purchased">
                  <SelectTrigger id="source">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchased">Purchased</SelectItem>
                    <SelectItem value="vine">Vine</SelectItem>
                    <SelectItem value="gifted">Gifted</SelectItem>
                    <SelectItem value="sample">Sample</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1">Add Item</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">All Items</TabsTrigger>
          <TabsTrigger value="resale">For Resale</TabsTrigger>
          <TabsTrigger value="donations">Donations</TabsTrigger>
          <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Inventory Items ({totalItems})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inventoryItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.product_name}</h3>
                      <div className="flex gap-2 mt-1 text-sm text-gray-600">
                        <span>{item.source === "vine" ? "🍇 Vine" : "🛒 Purchased"}</span>
                        <span>•</span>
                        <span>Added {new Date(item.acquisition_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={statusColors[item.status]}>{statusLabels[item.status]}</Badge>
                      <p className="text-sm text-gray-600 mt-1">${item.acquisition_cost.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resale Tab */}
        <TabsContent value="resale" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Items for Resale</CardTitle>
              <CardDescription>Items reviewed and ready to sell or already sold</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {inventoryItems
                .filter((i) => ["ready_to_resell", "listed_for_sale", "sold"].includes(i.status))
                .map((item) => (
                  <div key={item.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{item.product_name}</h3>
                      <Badge className={statusColors[item.status]}>{statusLabels[item.status]}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Cost Basis</p>
                        <p className="font-semibold">${item.acquisition_cost.toFixed(2)}</p>
                      </div>
                      {item.status === "sold" && (
                        <>
                          <div>
                            <p className="text-gray-600">Sale Price</p>
                            <p className="font-semibold">${item.sale_price?.toFixed(2) || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Gain/Loss</p>
                            <p className={`font-semibold ${(item.sale_price || 0) - item.acquisition_cost >= 0 ? "text-green-600" : "text-red-600"}`}>
                              ${((item.sale_price || 0) - item.acquisition_cost).toFixed(2)}
                            </p>
                          </div>
                        </>
                      )}
                      {item.status !== "sold" && (
                        <div>
                          <p className="text-gray-600">Est. Value</p>
                          <p className="font-semibold">${item.estimated_value?.toFixed(2) || "TBD"}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              {inventoryItems.filter((i) => ["ready_to_resell", "listed_for_sale", "sold"].includes(i.status)).length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No items ready for resale</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Donations Tab */}
        <TabsContent value="donations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Donation Tracking</CardTitle>
              <CardDescription>Items donated to rental company (capital contributions - tax deductible)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <Gift className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Items not reviewed after 6 months can be donated to your rental company as a capital contribution. These are tax deductible.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {inventoryItems
                  .filter((i) => i.status === "donated")
                  .map((item) => (
                    <div key={item.id} className="p-4 border rounded-lg bg-pink-50">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{item.product_name}</h3>
                        <Badge className="bg-pink-100 text-pink-800">Donated</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Acquisition Cost</p>
                          <p className="font-semibold">${item.acquisition_cost.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Fair Market Value</p>
                          <p className="font-semibold">$[FMV]</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Tax Deduction</p>
                          <p className="font-semibold text-green-600">$[FMV]</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {inventoryItems.filter((i) => i.status === "donated").length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No donations recorded yet</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lifecycle Tab */}
        <TabsContent value="lifecycle" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Item Lifecycle Flow</CardTitle>
              <CardDescription>How items move through your business</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">1. Acquisition</h3>
                  <p className="text-sm text-blue-800">Item purchased or received via Vine</p>
                </div>

                <div className="text-center text-gray-400">↓</div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-2">2. Review & Testing</h3>
                  <p className="text-sm text-green-800">Use and review the product</p>
                </div>

                <div className="text-center text-gray-400">↓</div>

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-yellow-900 mb-2">3. Disposition Decision</h3>
                  <p className="text-sm text-yellow-800">Choose: Resell, Donate, or Keep</p>
                </div>

                <div className="text-center text-gray-400">↓</div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-steel-shine/10 rounded-lg border border-steel-shine/30">
                    <h3 className="font-semibold text-steel-shine text-sm mb-2">Resale</h3>
                    <p className="text-xs text-steel-mid">Sell on marketplace</p>
                    <p className="text-xs text-steel-mid mt-1">Track capital gains/losses</p>
                  </div>
                  <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
                    <h3 className="font-semibold text-pink-900 text-sm mb-2">Donate</h3>
                    <p className="text-xs text-pink-800">After 6 months</p>
                    <p className="text-xs text-pink-800 mt-1">Tax deductible contribution</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h3 className="font-semibold text-orange-900 text-sm mb-2">Rent Out</h3>
                    <p className="text-xs text-orange-800">Rental company</p>
                    <p className="text-xs text-orange-800 mt-1">Track rental income</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tax Info */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>💰 Inventory & Tax Implications</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Cost Basis:</strong> The price you paid for the item. Used to calculate capital gains/losses when sold.
          </p>
          <p>
              <strong>Capital Gains/Losses:</strong> Difference between sale price and cost basis. Short-term (&le;365 days) vs. long-term (&gt;365 days).
          </p>
          <p>
            <strong>Donations:</strong> Items donated after 6 months are capital contributions. Fair market value is tax deductible.
          </p>
          <p>
            <strong>Rental Income:</strong> Items rented to your rental company generate income. Track separately for tax reporting.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
