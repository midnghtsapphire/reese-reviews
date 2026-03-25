import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VineDashboard } from "@/components/VineDashboard";
import { VineCookieManager } from "@/components/VineCookieManager";
import { InventoryManager } from "@/components/InventoryManager";
import { FinancialDashboard } from "@/components/FinancialDashboard";
import { AmazonAPISettings } from "@/components/AmazonAPISettings";
import { AmazonDashboard } from "@/components/AmazonDashboard";
import { AmazonAccountSettings } from "@/components/AmazonAccountSettings";
import SEOHead from "@/components/SEOHead";
import { ProductLifecycle } from "@/components/business/ProductLifecycle";
import { ReviewAutomation } from "@/components/business/ReviewAutomation";
import { ERPTaxCenter } from "@/components/business/ERPTaxCenter";
import { ReviewPipeline } from "@/components/business/ReviewPipeline";
import AllAttachmentForms from "@/components/business/AllAttachmentForms";

// ─── TOP-LEVEL TABS ───────────────────────────────────────────
// Consolidated from 12 tabs → 9 tabs.
//
// REMOVED as standalone tabs (now sub-tabs inside Tax Center ERP):
//   - "Taxes"       → Tax Center > Vine ETV (primary view)
//   - "Expenses"    → Tax Center > Expenses
//   - "Accounting"  → Tax Center > Accounting
//   - "Documents"   → Tax Center > Documents
//   - "Tax Center"  → Replaced by ERPTaxCenter (the new unified module)
//
// KEPT as top-level tabs:
//   - Tax Center ERP (default, Vine-first)
//   - Vine
//   - Amazon
//   - Inventory
//   - Financial
//   - Integrations
//   - Lifecycle
//   - Reviews
//   - Review Pipeline (NEW)

const TOP_TABS = [
  { value: "taxcenter",    label: "🍃 Tax Center",   title: "Tax Center ERP — Vine-first" },
  { value: "vine",         label: "🍇 Vine",          title: "Amazon Vine Dashboard" },
  { value: "amazon",       label: "🛒 Amazon",        title: "Amazon Dashboard" },
  { value: "inventory",    label: "📦 Inventory",     title: "Inventory Manager" },
  { value: "financial",    label: "💵 Financial",     title: "Financial Dashboard" },
  { value: "integrations", label: "⚙️ Integrations", title: "Integrations & Settings" },
  { value: "lifecycle",    label: "⚡ Lifecycle",     title: "Product Lifecycle Tracker" },
  { value: "reviews",      label: "🎬 Reviews",       title: "Review Automation" },
  { value: "reviewpipeline", label: "🔀 Review Pipeline", title: "Review Pipeline" },
  { value: "forms",        label: "📋 Forms",         title: "IRS & Attachment Forms" },
] as const;

export default function Business() {
  // Default to Tax Center (Vine ETV primary view)
  const [activeTab, setActiveTab] = useState<string>("taxcenter");

  return (
    <>
      <SEOHead
        title="Business Dashboard | Reese Reviews"
        description="Manage Vine reviews, track taxes, inventory, and financial data for Reese's review business."
        keywords="Vine tracking, tax dashboard, inventory management, business analytics, Plaid bank integration"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ── Page Header ─────────────────────────────────── */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Business Dashboard</h1>
            <p className="text-gray-300">
              Amazon Vine · Tax ERP · Bank Integration · Inventory · Reviews
            </p>
          </div>

          {/* ── Top-Level Tabs ───────────────────────────────── */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex flex-wrap gap-1 mb-8 bg-white/10 backdrop-blur-md border border-white/20 p-1 rounded-lg h-auto">
              {TOP_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 min-w-[100px] text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white text-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── TAX CENTER ERP (DEFAULT) ─────────────────────
                Vine ETV is the primary/default sub-tab.
                Contains: Vine ETV, Bank (Plaid), Transactions,
                Expenses, Forms, Accounting (Odoo), Documents,
                Quarterly, People, Audit & Export.
            ─────────────────────────────────────────────────── */}
            <TabsContent value="taxcenter">
              <ERPTaxCenter defaultTab="vine" />
            </TabsContent>

            {/* ── VINE DASHBOARD ───────────────────────────────
                Full Vine product dashboard — item status,
                review deadlines, ETV summary, cookie manager.
            ─────────────────────────────────────────────────── */}
            <TabsContent value="vine" className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
                <VineDashboard />
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
                <VineCookieManager />
              </div>
            </TabsContent>

            {/* ── AMAZON DASHBOARD ─────────────────────────────
                Amazon seller metrics, ASIN tracking, BSR.
            ─────────────────────────────────────────────────── */}
            <TabsContent value="amazon" className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
                <AmazonDashboard />
              </div>
            </TabsContent>

            {/* ── INVENTORY ────────────────────────────────────
                Vine item inventory — received, reviewed,
                transferred, resold, donated.
            ─────────────────────────────────────────────────── */}
            <TabsContent value="inventory" className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
                <InventoryManager />
              </div>
            </TabsContent>

            {/* ── FINANCIAL DASHBOARD ──────────────────────────
                Revenue, P&L, cash flow, financial analytics.
            ─────────────────────────────────────────────────── */}
            <TabsContent value="financial" className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
                <FinancialDashboard />
              </div>
            </TabsContent>

            {/* ── INTEGRATIONS & SETTINGS ──────────────────────
                Amazon API keys, account settings, Plaid config.
            ─────────────────────────────────────────────────── */}
            <TabsContent value="integrations" className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
                <AmazonAPISettings />
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
                <AmazonAccountSettings />
              </div>
            </TabsContent>

            {/* ── PRODUCT LIFECYCLE ────────────────────────────
                Track Vine products from received → reviewed
                → transferred/resold/donated.
            ─────────────────────────────────────────────────── */}
            <TabsContent value="lifecycle" className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
                <ProductLifecycle />
              </div>
            </TabsContent>

            {/* ── REVIEW AUTOMATION ────────────────────────────
                Generate and manage reviews for Vine products.
            ─────────────────────────────────────────────────── */}
            <TabsContent value="reviews" className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
                <ReviewAutomation />
              </div>
            </TabsContent>

            {/* ── REVIEW PIPELINE ──────────────────────────────
                Bridge between Amazon Vine reviews and site —
                enrich, categorize, and publish review content.
            ─────────────────────────────────────────────────── */}
            <TabsContent value="reviewpipeline" className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
                <ReviewPipeline />
              </div>
            </TabsContent>

            {/* ── FORMS (ALL ATTACHMENT FORMS) ─────────────────
                Searchable, category-filtered accordion list of
                IRS forms: 1040, Schedule C, EV credit, trade-in,
                corporate, charitable, passive, etc.
            ─────────────────────────────────────────────────── */}
            <TabsContent value="forms" className="space-y-6">
              <AllAttachmentForms />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
