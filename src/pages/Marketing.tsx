import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Zap, Mail, TrendingUp, Users } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { getAffiliateLinks, trackAffiliateLinkClick } from "@/lib/affiliateStore";
import { getSubscribers } from "@/lib/emailStore";

export default function Marketing() {
  const [activeTab, setActiveTab] = useState("affiliate-links");
  const [generatingTier, setGeneratingTier] = useState<number | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const affiliateLinks = getAffiliateLinks();
  const subscribers = getSubscribers();

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
      <div className="min-h-screen gradient-dark-surface pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Marketing & Affiliate Hub</h1>
            <p className="text-gray-300">Generate campaigns, manage affiliate links, and automate your marketing</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 glass-nav mb-6">
              <TabsTrigger value="affiliate-links">Affiliate Links</TabsTrigger>
              <TabsTrigger value="campaign-generator">Campaign Generator</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
            </TabsList>

            {/* AFFILIATE LINKS TAB */}
            <TabsContent value="affiliate-links" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {affiliateLinks.map((link) => (
                  <Card key={link.id} className="glass-card border-white/10">
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
                <Card className="glass-card border-white/10">
                  <CardHeader>
                    <CardTitle>API Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <input
                      type="password"
                      placeholder="Paste your OpenRouter API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-steel-shine/40"
                    />
                    <Button onClick={() => setShowApiKeyInput(false)} className="w-full gradient-steel">
                      Save API Key
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card className="glass-card border-white/10">
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

              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle>Campaign Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="campaign-type">Campaign Type</Label>
                    <Select defaultValue="product">
                      <SelectTrigger id="campaign-type" className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select campaign type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product">Product Review</SelectItem>
                        <SelectItem value="affiliate">Affiliate Promo</SelectItem>
                        <SelectItem value="seasonal">Seasonal Deal</SelectItem>
                        <SelectItem value="recommendation">Recommendation</SelectItem>
                        <SelectItem value="giveaway">Giveaway</SelectItem>
                        <SelectItem value="comparison">Comparison</SelectItem>
                        <SelectItem value="tutorial">Tutorial</SelectItem>
                        <SelectItem value="testimonial">Testimonial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="campaign-topic">Topic</Label>
                    <Input
                      id="campaign-topic"
                      type="text"
                      placeholder="e.g., Best productivity tools for remote work"
                      className="bg-white/5 border-white/10 text-white placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="campaign-tone">Tone</Label>
                    <Select defaultValue="professional">
                      <SelectTrigger id="campaign-tone" className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="fun">Fun</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* CAMPAIGNS TAB */}
            <TabsContent value="campaigns" className="space-y-6">
              <Card className="glass-card border-white/10">
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
                <Card className="glass-card border-white/10">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-400">Total Clicks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-white">{affiliateLinks.reduce((sum, l) => sum + l.clicks, 0)}</p>
                  </CardContent>
                </Card>
                <Card className="glass-card border-white/10">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-400">Total Conversions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-white">{affiliateLinks.reduce((sum, l) => sum + l.conversions, 0)}</p>
                  </CardContent>
                </Card>
                <Card className="glass-card border-white/10">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-white">${affiliateLinks.reduce((sum, l) => sum + l.revenue, 0).toFixed(2)}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle>Top Performing Links</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {affiliateLinks
                      .sort((a, b) => b.clicks - a.clicks)
                      .slice(0, 5)
                      .map((link) => (
                        <div key={link.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
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

            {/* SUBSCRIBERS TAB */}
            <TabsContent value="subscribers" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="glass-card border-white/10">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" /> Total Subscribers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold gradient-steel-text">{subscribers.length}</p>
                  </CardContent>
                </Card>
                <Card className="glass-card border-white/10">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold gradient-steel-text">
                      {subscribers.filter((s) => s.status === "confirmed").length}
                    </p>
                  </CardContent>
                </Card>
                <Card className="glass-card border-white/10">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold gradient-steel-text">
                      {subscribers.filter((s) => s.status === "pending").length}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-steel-shine" /> Subscriber List
                  </CardTitle>
                  <CardDescription>Leads captured via the newsletter signup form</CardDescription>
                </CardHeader>
                <CardContent>
                  {subscribers.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No subscribers yet. Share your site to collect leads via the newsletter signup section on the home page.</p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {subscribers.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div>
                            <p className="font-medium text-foreground text-sm">{sub.email}</p>
                            {sub.name && <p className="text-xs text-muted-foreground">{sub.name}</p>}
                            <p className="text-xs text-muted-foreground">Source: {sub.source_page} · {new Date(sub.created_at).toLocaleDateString()}</p>
                          </div>
                          <span className={`text-xs rounded-full px-2 py-1 ${
                            sub.status === "confirmed"
                              ? "bg-steel-dark text-steel-shine border border-steel-shine/30"
                              : sub.status === "unsubscribed"
                              ? "bg-white/5 text-muted-foreground"
                              : "bg-white/5 text-muted-foreground border border-white/10"
                          }`}>
                            {sub.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
