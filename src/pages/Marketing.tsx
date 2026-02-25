import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Zap, Mail, Share2, TrendingUp } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { OWNER_AFFILIATE_LINKS, PLATFORM_CONFIGS } from "@/lib/affiliateTypes";
import { getAffiliateLinks, trackAffiliateLinkClick } from "@/lib/affiliateStore";

export default function Marketing() {
  const [activeTab, setActiveTab] = useState("affiliate-links");
  const [generatingTier, setGeneratingTier] = useState<number | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const affiliateLinks = getAffiliateLinks();

  const handleCampaignGeneration = async (tier: 20 | 50 | 100 | 200 | 500) => {
    if (!apiKey) {
      setShowApiKeyInput(true);
      return;
    }
    setGeneratingTier(tier);
    // Simulation - in production, call generateCampaignBatch from affiliateStore
    setTimeout(() => {
      setGeneratingTier(null);
      alert(`Generated ${tier} campaigns! Check the Campaigns tab.`);
    }, 2000);
  };

  const handleAffiliateClick = (linkId: string) => {
    trackAffiliateLinkClick(linkId);
  };

  return (
    <>
      <SEOHead
        title="Marketing & Affiliate Dashboard | Reese Reviews"
        description="Generate campaigns, manage affiliate links, and automate social media posting"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Marketing & Affiliate Hub</h1>
            <p className="text-gray-300">Generate campaigns, manage affiliate links, and automate your marketing</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 glass-nav mb-6">
              <TabsTrigger value="affiliate-links">Affiliate Links</TabsTrigger>
              <TabsTrigger value="campaign-generator">Campaign Generator</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* AFFILIATE LINKS TAB */}
            <TabsContent value="affiliate-links" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {affiliateLinks.map((link) => (
                  <Card key={link.id} className="glass-card border-purple-500/20">
                    <CardHeader>
                      <CardTitle className="text-lg">{link.name}</CardTitle>
                      <CardDescription>{link.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Commission</p>
                          <p className="font-semibold text-white">{link.commission_rate}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Cookie Duration</p>
                          <p className="font-semibold text-white">{link.cookie_duration}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Clicks</p>
                          <p className="font-semibold text-white">{link.clicks}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Conversions</p>
                          <p className="font-semibold text-white">{link.conversions}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAffiliateClick(link.id)}
                        className="w-full gradient-steel"
                        asChild
                      >
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          Visit {link.name}
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* CAMPAIGN GENERATOR TAB */}
            <TabsContent value="campaign-generator" className="space-y-6">
              {showApiKeyInput && (
                <Alert className="border-amber-500 bg-amber-500/10">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-amber-200">
                    Enter your OpenRouter API key to generate campaigns. Get one at{" "}
                    <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="underline">
                      openrouter.ai
                    </a>
                  </AlertDescription>
                </Alert>
              )}

              {showApiKeyInput && (
                <Card className="glass-card border-purple-500/20">
                  <CardHeader>
                    <CardTitle>API Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <input
                      type="password"
                      placeholder="Paste your OpenRouter API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-800 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                    <Button onClick={() => setShowApiKeyInput(false)} className="w-full gradient-steel">
                      Save API Key
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card className="glass-card border-purple-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    Generate Campaign Batch
                  </CardTitle>
                  <CardDescription>Select a tier to auto-generate social media campaigns</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[20, 50, 100, 200, 500].map((tier) => (
                      <Button
                        key={tier}
                        onClick={() => handleCampaignGeneration(tier as 20 | 50 | 100 | 200 | 500)}
                        disabled={generatingTier === tier}
                        className="gradient-steel"
                      >
                        {generatingTier === tier ? "Generating..." : `${tier} Posts`}
                      </Button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-400">
                    Each tier generates posts for all 6 platforms (Facebook, Instagram, TikTok, Twitter, LinkedIn, Pinterest)
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card border-purple-500/20">
                <CardHeader>
                  <CardTitle>Campaign Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Campaign Type</label>
                    <select className="w-full px-4 py-2 bg-slate-800 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500">
                      <option>Product Review</option>
                      <option>Affiliate Promo</option>
                      <option>Seasonal Deal</option>
                      <option>Recommendation</option>
                      <option>Giveaway</option>
                      <option>Comparison</option>
                      <option>Tutorial</option>
                      <option>Testimonial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Topic</label>
                    <input
                      type="text"
                      placeholder="e.g., Best productivity tools for remote work"
                      className="w-full px-4 py-2 bg-slate-800 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Tone</label>
                    <select className="w-full px-4 py-2 bg-slate-800 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500">
                      <option>Professional</option>
                      <option>Casual</option>
                      <option>Fun</option>
                      <option>Urgent</option>
                      <option>Educational</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* CAMPAIGNS TAB */}
            <TabsContent value="campaigns" className="space-y-6">
              <Card className="glass-card border-purple-500/20">
                <CardHeader>
                  <CardTitle>Recent Campaigns</CardTitle>
                  <CardDescription>Your generated campaigns and scheduling</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">No campaigns generated yet. Use the Campaign Generator tab to create your first batch.</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ANALYTICS TAB */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="glass-card border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-400">Total Clicks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-white">{affiliateLinks.reduce((sum, l) => sum + l.clicks, 0)}</p>
                  </CardContent>
                </Card>
                <Card className="glass-card border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-400">Total Conversions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-white">{affiliateLinks.reduce((sum, l) => sum + l.conversions, 0)}</p>
                  </CardContent>
                </Card>
                <Card className="glass-card border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-white">${affiliateLinks.reduce((sum, l) => sum + l.revenue, 0).toFixed(2)}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="glass-card border-purple-500/20">
                <CardHeader>
                  <CardTitle>Top Performing Links</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {affiliateLinks
                      .sort((a, b) => b.clicks - a.clicks)
                      .slice(0, 5)
                      .map((link) => (
                        <div key={link.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                          <div>
                            <p className="font-medium text-white">{link.name}</p>
                            <p className="text-sm text-gray-400">{link.clicks} clicks, {link.conversions} conversions</p>
                          </div>
                          <TrendingUp className="h-5 w-5 text-green-400" />
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
