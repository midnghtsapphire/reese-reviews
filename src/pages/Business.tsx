import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaxDashboard } from "@/components/TaxDashboard";
import { VineDashboard } from "@/components/VineDashboard";
import { VineCookieManager } from "@/components/VineCookieManager";
import { InventoryManager } from "@/components/InventoryManager";
import { FinancialDashboard } from "@/components/FinancialDashboard";
import { AmazonAPISettings } from "@/components/AmazonAPISettings";
import { AmazonDashboard } from "@/components/AmazonDashboard";
import { AmazonAccountSettings } from "@/components/AmazonAccountSettings";
import { OdooIntegration } from "@/components/OdooIntegration";
import { PDFillerIntegration } from "@/components/PDFillerIntegration";
import { ExpenseTracker } from "@/components/ExpenseTracker";
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
            <TabsList className="flex flex-wrap gap-1 mb-8 bg-white/10 backdrop-blur-md border border-white/20 p-1 rounded-lg h-auto">
              <TabsTrigger value="tax" className="flex-1 min-w-[100px] text-white data-[state=active]:bg-purple-600">
                💰 Taxes
              </TabsTrigger>
              <TabsTrigger value="financial" className="flex-1 min-w-[100px] text-white data-[state=active]:bg-purple-600">
                💵 Financial
              </TabsTrigger>
              <TabsTrigger value="vine" className="flex-1 min-w-[100px] text-white data-[state=active]:bg-purple-600">
                🍇 Vine
              </TabsTrigger>
              <TabsTrigger value="amazon" className="flex-1 min-w-[100px] text-white data-[state=active]:bg-purple-600">
                🛒 Amazon
              </TabsTrigger>
              <TabsTrigger value="inventory" className="flex-1 min-w-[100px] text-white data-[state=active]:bg-purple-600">
                📦 Inventory
              </TabsTrigger>
              <TabsTrigger value="accounting" className="flex-1 min-w-[100px] text-white data-[state=active]:bg-purple-600">
                📊 Accounting
              </TabsTrigger>
              <TabsTrigger value="expenses" className="flex-1 min-w-[100px] text-white data-[state=active]:bg-purple-600">
                💸 Expenses
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex-1 min-w-[100px] text-white data-[state=active]:bg-purple-600">
                📄 Documents
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex-1 min-w-[100px] text-white data-[state=active]:bg-purple-600">
                ⚙️ Integrations
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

            {/* Amazon Dashboard */}
            <TabsContent value="amazon" className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
                <AmazonDashboard />
              </div>
            </TabsContent>

            {/* Inventory Manager */}
            <TabsContent value="inventory" className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
                <InventoryManager />
              </div>
            </TabsContent>

            {/* Accounting (Odoo) */}
            <TabsContent value="accounting" className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
                <OdooIntegration />
              </div>
            </TabsContent>

            {/* Expenses */}
            <TabsContent value="expenses" className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
                <ExpenseTracker />
              </div>
            </TabsContent>

            {/* Documents (PDFiller) */}
            <TabsContent value="documents" className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
                <PDFillerIntegration />
              </div>
            </TabsContent>

            {/* Integrations / Settings */}
            <TabsContent value="integrations" className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
                <AmazonAPISettings />
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
                <AmazonAccountSettings />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
