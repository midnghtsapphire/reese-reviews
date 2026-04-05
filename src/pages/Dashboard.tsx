/**
 * Dashboard — main unified dashboard page for Reese-Reviews.
 *
 * Two-column layout:
 *   Left (main)  — quick content draft + full business dashboard tabs
 *   Right (sidebar) — analytics summary
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  BarChart2,
  FileText,
  Users,
  TrendingUp,
  Zap,
  ArrowRight,
  Eye,
  ThumbsUp,
  Share2,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Logo } from "@/components/Logo";
import { VineDashboard } from "@/components/VineDashboard";
import { VineCookieManager } from "@/components/VineCookieManager";
import { InventoryManager } from "@/components/InventoryManager";
import { FinancialDashboard } from "@/components/FinancialDashboard";
import { AmazonAPISettings } from "@/components/AmazonAPISettings";
import { AmazonDashboard } from "@/components/AmazonDashboard";
import { AmazonAccountSettings } from "@/components/AmazonAccountSettings";
import { ProductLifecycle } from "@/components/business/ProductLifecycle";
import { ReviewAutomation } from "@/components/business/ReviewAutomation";
import { ERPTaxCenter } from "@/components/business/ERPTaxCenter";
import { ReviewPipeline } from "@/components/business/ReviewPipeline";

// Analytics pulled from real localStorage data only
function getRealAnalytics() {
  let vineItems = 0, pendingReviews = 0, submittedReviews = 0;
  try {
    const items = JSON.parse(localStorage.getItem("vine-review-items") || "[]") as Array<{ status: string }>;
    vineItems = items.length;
    pendingReviews = items.filter((i) => i.status === "pending").length;
    submittedReviews = items.filter((i) => i.status === "submitted").length;
  } catch {}
  return { vineItems, pendingReviews, submittedReviews };
}

const BIZ_TABS = [
  { value: "taxcenter",      label: "🍃 Tax Center" },
  { value: "vine",           label: "🍇 Vine" },
  { value: "amazon",         label: "🛒 Amazon" },
  { value: "inventory",      label: "📦 Inventory" },
  { value: "financial",      label: "💵 Financial" },
  { value: "integrations",   label: "⚙️ Integrations" },
  { value: "lifecycle",      label: "⚡ Lifecycle" },
  { value: "reviews",        label: "🎬 Reviews" },
  { value: "reviewpipeline", label: "🔀 Review Pipeline" },
] as const;

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<string>("taxcenter");
  const [draft, setDraft] = useState("");

  return (
    <>
      <SEOHead
        title="Dashboard | Reese-Reviews"
        description="Unified dashboard — content creation, business analytics, and review management."
      />

      <div className="min-h-screen gradient-dark-surface pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Header ─────────────────────────────────────── */}
          <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Logo size="md" showText={false} />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground text-sm">Reese-Reviews — business operations center</p>
              </div>
            </div>
            <Link to="/generate">
              <Button className="gradient-steel text-primary-foreground gap-2">
                <Zap size={15} />
                Create Content
                <ArrowRight size={15} />
              </Button>
            </Link>
          </header>

          {/* ── Two-column grid ──────────────────────────────
              Left: quick draft + business tabs
              Right: analytics sidebar
          ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

            {/* ─── LEFT COLUMN ───────────────────────────── */}
            <div className="space-y-6 min-w-0">

              {/* Quick-draft card */}
              <Card className="glass-card steel-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText size={16} className="text-muted-foreground" />
                    Quick Draft
                  </CardTitle>
                  <CardDescription>Jot down an idea — publish it from the <Link to="/generate" className="underline underline-offset-2 hover:text-foreground">Content page</Link>.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="Start typing a post, review note, or campaign idea…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="min-h-[100px] bg-transparent resize-none text-sm"
                  />
                  <div className="flex justify-end">
                    <Link to={`/generate${draft ? `?draft=${encodeURIComponent(draft)}` : ""}`}>
                      <Button size="sm" className="gradient-steel text-primary-foreground gap-1">
                        Open in Content Editor
                        <ArrowRight size={13} />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Business dashboard tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="flex flex-wrap gap-1 mb-6 glass-nav border border-white/10 p-1 rounded-lg h-auto">
                  {BIZ_TABS.map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="flex-1 min-w-[90px] text-sm data-[state=active]:gradient-steel data-[state=active]:text-primary-foreground"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="taxcenter">
                  <ERPTaxCenter defaultTab="vine" />
                </TabsContent>

                <TabsContent value="vine" className="space-y-4">
                  <div className="glass-card rounded-lg p-4"><VineDashboard /></div>
                  <div className="glass-card rounded-lg p-4"><VineCookieManager /></div>
                </TabsContent>

                <TabsContent value="amazon" className="space-y-4">
                  <div className="glass-card rounded-lg p-4"><AmazonDashboard /></div>
                </TabsContent>

                <TabsContent value="inventory" className="space-y-4">
                  <div className="glass-card rounded-lg p-4"><InventoryManager /></div>
                </TabsContent>

                <TabsContent value="financial" className="space-y-4">
                  <div className="glass-card rounded-lg p-4"><FinancialDashboard /></div>
                </TabsContent>

                <TabsContent value="integrations" className="space-y-4">
                  <div className="glass-card rounded-lg p-4"><AmazonAPISettings /></div>
                  <div className="glass-card rounded-lg p-4"><AmazonAccountSettings /></div>
                </TabsContent>

                <TabsContent value="lifecycle" className="space-y-4">
                  <div className="glass-card rounded-lg p-4"><ProductLifecycle /></div>
                </TabsContent>

                <TabsContent value="reviews" className="space-y-4">
                  <div className="glass-card rounded-lg p-4"><ReviewAutomation /></div>
                </TabsContent>

                <TabsContent value="reviewpipeline" className="space-y-4">
                  <div className="glass-card rounded-lg p-4"><ReviewPipeline /></div>
                </TabsContent>
              </Tabs>
            </div>

            {/* ─── RIGHT SIDEBAR ─────────────────────────── */}
            <aside className="space-y-4">

              <Card className="glass-card steel-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart2 size={15} className="text-muted-foreground" />
                    Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col items-center py-4 text-center">
                    <BarChart2 size={24} className="text-gray-500 mb-2" />
                    <p className="text-xs text-gray-400">Connect Google Analytics to see real metrics here.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card steel-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp size={15} className="text-muted-foreground" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vine Items</span>
                    <span className="font-medium">—</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pending Reviews</span>
                    <span className="font-medium">—</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Tax Value</span>
                    <span className="font-medium">—</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inventory Items</span>
                    <span className="font-medium">—</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card steel-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users size={15} className="text-muted-foreground" />
                    Platform Reach
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex flex-col items-center py-4 text-center">
                    <Share2 size={24} className="text-gray-500 mb-2" />
                    <p className="text-xs text-gray-400">Connect social accounts to see reach data.</p>
                  </div>
                </CardContent>
              </Card>

            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
