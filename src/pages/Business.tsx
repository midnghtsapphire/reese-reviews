import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaxDashboard } from "@/components/TaxDashboard";
import { VineDashboard } from "@/components/VineDashboard";
import { VineCookieManager } from "@/components/VineCookieManager";
import { InventoryManager } from "@/components/InventoryManager";
import { FinancialDashboard } from "@/components/FinancialDashboard";
import SEOHead from "@/components/SEOHead";

export default function Business() {
  const [activeTab, setActiveTab] = useState("tax");

  return (
    <>
      <SEOHead
        title="Business Dashboard | Reese Reviews"
        description="Manage Vine reviews, track taxes, inventory, and financial data for Reese's review business."
        keywords="Vine tracking, tax dashboard, inventory management, business analytics"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Business Dashboard</h1>
            <p className="text-gray-300">Manage Vine reviews, taxes, inventory, and finances</p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8 bg-white/10 backdrop-blur-md border border-white/20">
              <TabsTrigger value="tax" className="text-white data-[state=active]:bg-purple-600">
                💰 Taxes
              </TabsTrigger>
              <TabsTrigger value="financial" className="text-white data-[state=active]:bg-purple-600">
                💵 Financial
              </TabsTrigger>
              <TabsTrigger value="vine" className="text-white data-[state=active]:bg-purple-600">
                🍇 Vine
              </TabsTrigger>
              <TabsTrigger value="inventory" className="text-white data-[state=active]:bg-purple-600">
                📦 Inventory
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-white data-[state=active]:bg-purple-600">
                ⚙️ Settings
              </TabsTrigger>
            </TabsList>

            {/* Tax Dashboard */}
            <TabsContent value="tax" className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
                <TaxDashboard />
              </div>
            </TabsContent>

            {/* Financial Dashboard */}
            <TabsContent value="financial" className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
                <FinancialDashboard />
              </div>
            </TabsContent>

            {/* Vine Dashboard */}
            <TabsContent value="vine" className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
                <VineDashboard />
              </div>
            </TabsContent>

            {/* Inventory Manager */}
            <TabsContent value="inventory" className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
                <InventoryManager />
              </div>
            </TabsContent>

            {/* Settings */}
            <TabsContent value="settings" className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
                <VineCookieManager />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
