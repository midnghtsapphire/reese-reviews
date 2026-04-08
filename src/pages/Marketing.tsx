import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle, Zap, TrendingUp, Copy, Download, Send,
  CheckCircle2, Clock, XCircle, RefreshCw, Sparkles,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { OWNER_AFFILIATE_LINKS, PLATFORM_CONFIGS } from "@/lib/affiliateTypes";
import type { CampaignConfig, CampaignType, CampaignTier, SocialPlatform, GeneratedCampaign } from "@/lib/affiliateTypes";
import {
  getAffiliateLinks,
  trackAffiliateLinkClick,
  generateCampaignBatch,
  addGeneratedCampaigns,
  getGeneratedCampaigns,
  scheduleCampaignPosts,
  saveGeneratedCampaigns,
  exportCampaignsCSV,
  exportCampaignsJSON,
  saveCampaign,
  getCampaigns,
} from "@/lib/affiliateStore";
import { generateSocialSnippets, generatePostFromReview } from "@/services/affiliateContentService";
import { getApprovedReviews } from "@/lib/reviewStore";
import type { ReviewData } from "@/lib/reviewStore";

export default function Marketing() {
  const [activeTab, setActiveTab] = useState("affiliate-links");
  const [generatingTier, setGeneratingTier] = useState<CampaignTier | null>(null);
  const [generationProgress, setGenerationProgress] = useState({ completed: 0, total: 0 });
  const [apiKey] = useState(() => import.meta.env.VITE_OPENROUTER_API_KEY || "");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [customApiKey, setCustomApiKey] = useState("");

  // Campaign config state
  const [campaignType, setCampaignType] = useState<CampaignType>("product_review");
  const [campaignTopic, setCampaignTopic] = useState("");
  const [campaignTone, setCampaignTone] = useState<"professional" | "casual" | "fun" | "urgent" | "educational">("casual");
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(["facebook", "instagram", "twitter", "linkedin"]);

  // Generated campaigns
  const [generatedCampaigns, setGeneratedCampaigns] = useState<GeneratedCampaign[]>([]);
  const [savedCampaigns, setSavedCampaigns] = useState<CampaignConfig[]>([]);

  // Quick post from review
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [selectedReview, setSelectedReview] = useState<string>("");
  const [quickPostPlatform, setQuickPostPlatform] = useState<SocialPlatform>("facebook");
  const [quickPostContent, setQuickPostContent] = useState("");
  const [isGeneratingQuickPost, setIsGeneratingQuickPost] = useState(false);

  const affiliateLinks = getAffiliateLinks();
  const subscribers = getSubscribers();

  useEffect(() => {
    setGeneratedCampaigns(getGeneratedCampaigns());
    setSavedCampaigns(getCampaigns());
    setReviews(getApprovedReviews());
  }, []);

  const effectiveApiKey = customApiKey || apiKey;

  const handleCampaignGeneration = async (tier: CampaignTier) => {
    if (!effectiveApiKey) {
      setShowApiKeyInput(true);
      return;
    }

    if (!campaignTopic.trim()) {
      alert("Please enter a campaign topic before generating.");
      return;
    }

    setGeneratingTier(tier);
    setGenerationProgress({ completed: 0, total: tier * selectedPlatforms.length });

    const config: CampaignConfig = {
      id: `campaign-${Date.now()}`,
      name: `${campaignType} — ${campaignTopic}`,
      type: campaignType,
      tier,
      platforms: selectedPlatforms,
      affiliate_links: affiliateLinks.filter((l) => l.active).map((l) => l.id),
      topic: campaignTopic,
      tone: campaignTone,
      include_hashtags: true,
      include_emoji: true,
      include_cta: true,
      created_at: new Date().toISOString(),
      status: "generating",
      generated_count: 0,
    };

    try {
      const results = await generateCampaignBatch(config, effectiveApiKey, (completed, total) => {
        setGenerationProgress({ completed, total });
      });

      config.status = "ready";
      config.generated_count = results.length;
      saveCampaign(config);
      addGeneratedCampaigns(results);
      setGeneratedCampaigns(getGeneratedCampaigns());
      setSavedCampaigns(getCampaigns());
      setActiveTab("campaigns");
    } catch (error) {
      console.error("Campaign generation failed:", error);
      alert(`Generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setGeneratingTier(null);
      setGenerationProgress({ completed: 0, total: 0 });
    }
  };

  const handleAffiliateClick = (linkId: string) => {
    trackAffiliateLinkClick(linkId);
  };

  const handleQuickPostGenerate = async () => {
    if (!effectiveApiKey) {
      setShowApiKeyInput(true);
      return;
    }

    const review = reviews.find((r) => r.id === selectedReview);
    if (!review) return;

    setIsGeneratingQuickPost(true);
    try {
      const content = await generatePostFromReview(
        review,
        quickPostPlatform,
        affiliateLinks.filter((l) => l.active),
        campaignTone
      );
      setQuickPostContent(content);
    } catch (error) {
      console.error("Quick post generation failed:", error);
      setQuickPostContent(`Failed to generate: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsGeneratingQuickPost(false);
    }
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleExportCSV = () => {
    const csv = exportCampaignsCSV(generatedCampaigns);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaigns-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const json = exportCampaignsJSON(generatedCampaigns);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaigns-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleScheduleAll = () => {
    const drafts = generatedCampaigns.filter((c) => c.status === "draft");
    if (drafts.length === 0) return;
    const scheduled = scheduleCampaignPosts(drafts, new Date(), 4);
    const others = generatedCampaigns.filter((c) => c.status !== "draft");
    const updated = [...others, ...scheduled];
    saveGeneratedCampaigns(updated);
    setGeneratedCampaigns(updated);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "posted": return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case "scheduled": return <Clock className="h-4 w-4 text-blue-400" />;
      case "failed": return <XCircle className="h-4 w-4 text-red-400" />;
      default: return <Sparkles className="h-4 w-4 text-purple-400" />;
    }
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
            <p className="text-gray-300">
              Generate AI-powered campaigns, manage affiliate links, and automate your marketing
            </p>
            {effectiveApiKey && (
              <Badge variant="outline" className="mt-2 text-green-400 border-green-400/30">
                <CheckCircle2 className="h-3 w-3 mr-1" /> OpenRouter Connected
              </Badge>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 glass-nav mb-6">
              <TabsTrigger value="affiliate-links">Affiliate Links</TabsTrigger>
              <TabsTrigger value="campaign-generator">Campaign Generator</TabsTrigger>
              <TabsTrigger value="quick-post">Quick Post</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns ({generatedCampaigns.length})</TabsTrigger>
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
              {showApiKeyInput && !effectiveApiKey && (
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

              {showApiKeyInput && !effectiveApiKey && (
                <Card className="glass-card border-purple-500/20">
                  <CardHeader>
                    <CardTitle>API Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <input
                      type="password"
                      placeholder="Paste your OpenRouter API key"
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-800 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
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
                  <CardDescription>Configure your campaign before generating</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="campaign-type">Campaign Type</Label>
                    <Select value={campaignType} onValueChange={(v) => setCampaignType(v as CampaignType)}>
                      <SelectTrigger id="campaign-type" className="bg-slate-800 border-purple-500/30 text-white">
                        <SelectValue placeholder="Select campaign type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product_review">Product Review</SelectItem>
                        <SelectItem value="affiliate_promo">Affiliate Promo</SelectItem>
                        <SelectItem value="seasonal_deal">Seasonal Deal</SelectItem>
                        <SelectItem value="recommendation">Recommendation</SelectItem>
                        <SelectItem value="giveaway">Giveaway</SelectItem>
                        <SelectItem value="comparison">Comparison</SelectItem>
                        <SelectItem value="tutorial">Tutorial</SelectItem>
                        <SelectItem value="testimonial">Testimonial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="campaign-topic">Topic *</Label>
                    <Input
                      id="campaign-topic"
                      type="text"
                      placeholder="e.g., Best productivity tools for remote work"
                      className="bg-slate-800 border-purple-500/30 text-white placeholder-gray-500"
                      value={campaignTopic}
                      onChange={(e) => setCampaignTopic(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="campaign-tone">Tone</Label>
                    <Select value={campaignTone} onValueChange={(v) => setCampaignTone(v as typeof campaignTone)}>
                      <SelectTrigger id="campaign-tone" className="bg-slate-800 border-purple-500/30 text-white">
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

              <Card className="glass-card border-purple-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    Generate Campaign Batch
                  </CardTitle>
                  <CardDescription>
                    Select a tier to auto-generate social media campaigns via OpenRouter AI
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {([20, 50, 100, 200, 500] as CampaignTier[]).map((tier) => (
                      <Button
                        key={tier}
                        onClick={() => handleCampaignGeneration(tier)}
                        disabled={generatingTier !== null}
                        className="gradient-steel"
                      >
                        {generatingTier === tier ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-1" />
                        )}
                        {generatingTier === tier ? "Generating..." : `${tier} Posts`}
                      </Button>
                    ))}
                  </div>

                  {generatingTier && generationProgress.total > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>Generating posts via OpenRouter AI...</span>
                        <span>{generationProgress.completed}/{generationProgress.total}</span>
                      </div>
                      <Progress
                        value={(generationProgress.completed / generationProgress.total) * 100}
                        className="h-2"
                      />
                    </div>
                  )}

                  <p className="text-sm text-gray-400">
                    Each tier generates posts for {selectedPlatforms.length} platforms using real AI content generation.
                    Powered by OpenRouter (GPT-4o-mini).
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* QUICK POST FROM REVIEW TAB */}
            <TabsContent value="quick-post" className="space-y-6">
              <Card className="glass-card border-purple-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-blue-400" />
                    Quick Post from Review
                  </CardTitle>
                  <CardDescription>
                    Select a published review and generate a social media post instantly
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Select Review</Label>
                    <Select value={selectedReview} onValueChange={setSelectedReview}>
                      <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                        <SelectValue placeholder="Choose a review..." />
                      </SelectTrigger>
                      <SelectContent>
                        {reviews.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.title} ({r.rating}/5)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Platform</Label>
                    <Select value={quickPostPlatform} onValueChange={(v) => setQuickPostPlatform(v as SocialPlatform)}>
                      <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PLATFORM_CONFIGS).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.emoji} {config.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleQuickPostGenerate}
                    disabled={!selectedReview || isGeneratingQuickPost}
                    className="w-full gradient-steel"
                  >
                    {isGeneratingQuickPost ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Generating with AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Post
                      </>
                    )}
                  </Button>

                  {quickPostContent && (
                    <div className="space-y-3">
                      <Textarea
                        value={quickPostContent}
                        onChange={(e) => setQuickPostContent(e.target.value)}
                        rows={8}
                        className="bg-slate-800 border-purple-500/30 text-white"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyContent(quickPostContent)}
                        >
                          <Copy className="h-4 w-4 mr-1" /> Copy
                        </Button>
                        <Badge variant="outline" className="text-gray-400">
                          {quickPostContent.length} chars
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* CAMPAIGNS TAB */}
            <TabsContent value="campaigns" className="space-y-6">
              <div className="flex gap-3 flex-wrap">
                <Button onClick={handleScheduleAll} variant="outline" size="sm" disabled={!generatedCampaigns.some((c) => c.status === "draft")}>
                  <Clock className="h-4 w-4 mr-1" /> Schedule All Drafts
                </Button>
                <Button onClick={handleExportCSV} variant="outline" size="sm" disabled={generatedCampaigns.length === 0}>
                  <Download className="h-4 w-4 mr-1" /> Export CSV
                </Button>
                <Button onClick={handleExportJSON} variant="outline" size="sm" disabled={generatedCampaigns.length === 0}>
                  <Download className="h-4 w-4 mr-1" /> Export JSON
                </Button>
              </div>

              {generatedCampaigns.length === 0 ? (
                <Card className="glass-card border-purple-500/20">
                  <CardContent className="py-12 text-center">
                    <Sparkles className="h-10 w-10 text-gray-500 mx-auto mb-3" />
                    <p className="text-white font-medium mb-1">No campaigns generated yet</p>
                    <p className="text-gray-400 text-sm">
                      Use the Campaign Generator tab to create your first AI-powered batch.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {generatedCampaigns.slice(-20).reverse().map((campaign) => (
                    <Card key={campaign.id} className="glass-card border-purple-500/20">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {getStatusIcon(campaign.status)}
                              <Badge
                                variant="outline"
                                style={{ borderColor: PLATFORM_CONFIGS[campaign.platform]?.color }}
                              >
                                {PLATFORM_CONFIGS[campaign.platform]?.emoji} {PLATFORM_CONFIGS[campaign.platform]?.name}
                              </Badge>
                              <Badge variant="secondary">{campaign.status}</Badge>
                              {campaign.scheduled_for && (
                                <span className="text-xs text-gray-400">
                                  {new Date(campaign.scheduled_for).toLocaleString()}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-white truncate">{campaign.headline}</p>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{campaign.body.slice(0, 200)}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyContent(campaign.full_content)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ANALYTICS TAB */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="glass-card border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="glass-card border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-400">Total Clicks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-white">
                      {affiliateLinks.reduce((sum, l) => sum + l.clicks, 0)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="glass-card border-white/10">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-400">Total Conversions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-white">
                      {affiliateLinks.reduce((sum, l) => sum + l.conversions, 0)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="glass-card border-white/10">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-white">
                      ${affiliateLinks.reduce((sum, l) => sum + l.revenue, 0).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="glass-card border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-400">Generated Posts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-white">{generatedCampaigns.length}</p>
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
                            <p className="text-sm text-gray-400">
                              {link.clicks} clicks, {link.conversions} conversions
                            </p>
                          </div>
                          <TrendingUp className="h-5 w-5 text-green-400" />
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-purple-500/20">
                <CardHeader>
                  <CardTitle>Posts by Platform</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(PLATFORM_CONFIGS).map(([key, config]) => {
                      const count = generatedCampaigns.filter((c) => c.platform === key).length;
                      return (
                        <div key={key} className="p-3 rounded-lg bg-slate-800/50 text-center">
                          <p className="text-2xl mb-1">{config.emoji}</p>
                          <p className="text-lg font-bold text-white">{count}</p>
                          <p className="text-xs text-gray-400">{config.name}</p>
                        </div>
                      );
                    })}
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

          <p className="text-xs text-center text-gray-500 mt-8">
            AI content generation provided by OpenRouter API (GPT-4o-mini) · Affiliate links managed locally
          </p>
        </div>
      </div>
    </>
  );
}
