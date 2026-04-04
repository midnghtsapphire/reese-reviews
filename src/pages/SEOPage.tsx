import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SEOHead from "@/components/SEOHead";
import SEODashboard from "@/components/seo/SEODashboard";
import BacklinkTracker from "@/components/seo/BacklinkTracker";
import SitemapManager from "@/components/seo/SitemapManager";
import SchemaValidator from "@/components/seo/SchemaValidator";

export default function SEOPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <>
      <SEOHead
        title="SEO / SEM / Marketing | Reese Reviews"
        description="Monitor SEO health, manage meta tags, track backlinks, and schedule social media content."
        keywords="SEO dashboard, meta tags, backlinks, content scheduling, social media marketing"
      />
      <div className="min-h-screen gradient-dark-surface pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold gradient-steel-text">SEO & Marketing Tools</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Comprehensive SEO monitoring, backlink analysis, sitemap management, and structured data validation
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="glass-card mb-6 grid w-full grid-cols-4">
              <TabsTrigger value="dashboard">SEO Dashboard</TabsTrigger>
              <TabsTrigger value="backlinks">Backlink Tracker</TabsTrigger>
              <TabsTrigger value="sitemap">Sitemap</TabsTrigger>
              <TabsTrigger value="schema">Schema.org</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <SEODashboard />
            </TabsContent>

            <TabsContent value="backlinks">
              <BacklinkTracker />
            </TabsContent>

            <TabsContent value="sitemap">
              <SitemapManager />
            </TabsContent>

            <TabsContent value="schema">
              <SchemaValidator />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
