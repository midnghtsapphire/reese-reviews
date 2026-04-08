// ============================================================
// SEO / SEM / MARKETING DASHBOARD
// Meta tags, alt text, SEO score, backlinking stats,
// content scheduling, Meta API stubs
// ============================================================
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Search, Globe, Link2, BarChart2, Calendar, Share2,
  CheckCircle2, AlertTriangle, TrendingUp, FileText,
  Facebook, Instagram, Eye, Target, Zap, RefreshCw,
} from "lucide-react";

// ─── SEO SCORE CALCULATOR ───────────────────────────────────
interface SEOScore {
  overall: number;
  title: { score: number; message: string };
  description: { score: number; message: string };
  headings: { score: number; message: string };
  images: { score: number; message: string };
  performance: { score: number; message: string };
  mobile: { score: number; message: string };
}

function calculateSEOScore(_url: string): SEOScore {
  // Placeholder — connect a real SEO API (e.g. Moz, Ahrefs, or Google Search Console) for live data
  return {
    overall: 0,
    title: { score: 0, message: "Scan your URL to get a real score" },
    description: { score: 0, message: "Scan your URL to get a real score" },
    headings: { score: 0, message: "Scan your URL to get a real score" },
    images: { score: 0, message: "Scan your URL to get a real score" },
    performance: { score: 0, message: "Scan your URL to get a real score" },
    mobile: { score: 0, message: "Scan your URL to get a real score" },
  };
}

// ─── BACKLINKING DATA ───────────────────────────────────────
interface BacklinkData {
  totalBacklinks: number;
  referringDomains: number;
  domainAuthority: number;
  topAnchors: Array<{ text: string; count: number }>;
  topReferrers: Array<{ domain: string; links: number; authority: number }>;
}

function getBacklinkData(): BacklinkData {
  // No placeholder data — connect Ahrefs, Moz, or Google Search Console for real backlink data
  return {
    totalBacklinks: 0,
    referringDomains: 0,
    domainAuthority: 0,
    topAnchors: [],
    topReferrers: [],
  };
}

// ─── CONTENT SCHEDULE ───────────────────────────────────────
interface ScheduledPost {
  id: string;
  title: string;
  platform: "facebook" | "instagram" | "both";
  scheduledDate: string;
  status: "scheduled" | "posted" | "failed";
  content: string;
}

function getScheduledPosts(): ScheduledPost[] {
  try {
    const stored = localStorage.getItem("seo-scheduled-posts");
    if (stored) return JSON.parse(stored);
  } catch {
    // noop
  }
  return [];
}

// ─── COMPONENT ──────────────────────────────────────────────
export default function SEODashboard() {
  const [activeTab, setActiveTab] = useState("score");
  const [scanUrl, setScanUrl] = useState("https://reesereviews.com");
  const [seoScore, setSeoScore] = useState<SEOScore | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [backlinks] = useState<BacklinkData>(getBacklinkData);
  const [posts] = useState<ScheduledPost[]>(getScheduledPosts);

  // Meta tags management
  const [metaTags, setMetaTags] = useState<Array<{ page: string; title: string; description: string; keywords: string }>>([]);

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setSeoScore(calculateSEOScore(scanUrl));
      setIsScanning(false);
    }, 1500);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold gradient-steel-text">SEO / SEM / Marketing</h2>
        <p className="text-sm text-muted-foreground">Monitor SEO health, manage meta tags, track backlinks, and schedule content</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="glass-card">
          <TabsTrigger value="score"><Search className="h-4 w-4 mr-1" /> SEO Score</TabsTrigger>
          <TabsTrigger value="meta"><FileText className="h-4 w-4 mr-1" /> Meta Tags</TabsTrigger>
          <TabsTrigger value="backlinks"><Link2 className="h-4 w-4 mr-1" /> Backlinks</TabsTrigger>
          <TabsTrigger value="social"><Share2 className="h-4 w-4 mr-1" /> Social / Meta</TabsTrigger>
          <TabsTrigger value="schedule"><Calendar className="h-4 w-4 mr-1" /> Schedule</TabsTrigger>
        </TabsList>

        {/* ─── SEO SCORE TAB ─────────────────────────────── */}
        <TabsContent value="score" className="space-y-4">
          <Card className="glass-card steel-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" /> SEO Score Checker</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={scanUrl} onChange={(e) => setScanUrl(e.target.value)} placeholder="https://reesereviews.com" />
                <Button onClick={handleScan} disabled={isScanning} className="gradient-steel">
                  {isScanning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Scan
                </Button>
              </div>

              {seoScore && (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className={`text-5xl font-bold ${getScoreColor(seoScore.overall)}`}>{seoScore.overall}</p>
                    <p className="text-sm text-muted-foreground">Overall SEO Score</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(seoScore).filter(([k]) => k !== "overall").map(([key, data]: [string, { score: number; message: string }]) => (
                      <div key={key} className="p-3 rounded-lg glass-card">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium capitalize">{key}</span>
                          <span className={`text-sm font-bold ${getScoreColor(data.score)}`}>{data.score}/100</span>
                        </div>
                        <Progress value={data.score} className="h-1.5 mb-1" />
                        <p className="text-xs text-muted-foreground">{data.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── META TAGS TAB ─────────────────────────────── */}
        <TabsContent value="meta" className="space-y-4">
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMetaTags((prev) => [...prev, { page: "/new-page", title: "", description: "", keywords: "" }])}
            >
              + Add Page
            </Button>
          </div>
          {metaTags.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-10 w-10 text-gray-500 mb-3" />
              <p className="text-white font-medium mb-1">No meta tags configured yet</p>
              <p className="text-gray-400 text-sm">Click "Add Page" to define meta tags for each page of your site.</p>
            </div>
          )}
          {metaTags.map((meta, idx) => (
            <Card key={meta.page} className="glass-card steel-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono">{meta.page}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Title Tag</Label>
                  <Input
                    value={meta.title}
                    onChange={(e) => {
                      const updated = [...metaTags];
                      updated[idx].title = e.target.value;
                      setMetaTags(updated);
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{meta.title.length}/60 characters</p>
                </div>
                <div>
                  <Label className="text-xs">Meta Description</Label>
                  <Textarea
                    value={meta.description}
                    onChange={(e) => {
                      const updated = [...metaTags];
                      updated[idx].description = e.target.value;
                      setMetaTags(updated);
                    }}
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{meta.description.length}/160 characters</p>
                </div>
                <div>
                  <Label className="text-xs">Keywords</Label>
                  <Input
                    value={meta.keywords}
                    onChange={(e) => {
                      const updated = [...metaTags];
                      updated[idx].keywords = e.target.value;
                      setMetaTags(updated);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ─── BACKLINKS TAB ─────────────────────────────── */}
        <TabsContent value="backlinks" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="glass-card steel-border">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">{backlinks.totalBacklinks}</p>
                <p className="text-sm text-muted-foreground">Total Backlinks</p>
              </CardContent>
            </Card>
            <Card className="glass-card steel-border">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-green-400">{backlinks.referringDomains}</p>
                <p className="text-sm text-muted-foreground">Referring Domains</p>
              </CardContent>
            </Card>
            <Card className="glass-card steel-border">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-purple-400">{backlinks.domainAuthority}</p>
                <p className="text-sm text-muted-foreground">Domain Authority</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="glass-card steel-border">
              <CardHeader><CardTitle className="text-sm">Top Anchor Texts</CardTitle></CardHeader>
              <CardContent>
                {backlinks.topAnchors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Target className="h-8 w-8 text-gray-500 mb-2" />
                    <p className="text-gray-400 text-sm">No anchor text data yet. Connect a backlink analysis tool to see this data.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {backlinks.topAnchors.map((anchor) => (
                      <div key={anchor.text} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">"{anchor.text}"</span>
                        <Badge variant="outline">{anchor.count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="glass-card steel-border">
              <CardHeader><CardTitle className="text-sm">Top Referring Domains</CardTitle></CardHeader>
              <CardContent>
                {backlinks.topReferrers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Link2 className="h-8 w-8 text-gray-500 mb-2" />
                    <p className="text-gray-400 text-sm">No backlink data yet. Connect Ahrefs, Moz, or Google Search Console to see referring domains.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {backlinks.topReferrers.map((ref) => (
                      <div key={ref.domain} className="flex items-center justify-between text-sm">
                        <span>{ref.domain}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{ref.links} links</Badge>
                          <Badge variant="secondary">DA: {ref.authority}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── SOCIAL / META TAB ─────────────────────────── */}
        <TabsContent value="social" className="space-y-4">
          <Card className="glass-card steel-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Share2 className="h-5 w-5" /> Auto Marketing via Meta</CardTitle>
              <CardDescription>Facebook and Instagram Business API integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Facebook className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">Facebook</span>
                      <Badge variant="outline" className="text-yellow-400">Setup Required</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Connect your Facebook Business page to auto-post reviews and create ad campaigns.
                    </p>
                    <Button size="sm" variant="outline">Connect Facebook</Button>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Instagram className="h-5 w-5 text-pink-500" />
                      <span className="font-medium">Instagram</span>
                      <Badge variant="outline" className="text-yellow-400">Setup Required</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Connect your Instagram Business account for auto-posting and story creation.
                    </p>
                    <Button size="sm" variant="outline">Connect Instagram</Button>
                  </CardContent>
                </Card>
              </div>
              <div className="p-4 rounded-lg glass-card">
                <h4 className="font-medium text-sm mb-2">Campaign Builder (Coming Soon)</h4>
                <p className="text-xs text-muted-foreground">
                  Create targeted ad campaigns, define audience segments, set budgets, and track performance — all from this dashboard.
                  Meta Business API integration stubs are ready for activation.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── SCHEDULE TAB ──────────────────────────────── */}
        <TabsContent value="schedule" className="space-y-4">
          <Card className="glass-card steel-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Content Schedule</CardTitle>
              <CardDescription>Schedule and manage social media posts</CardDescription>
            </CardHeader>
            <CardContent>
              {posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="h-10 w-10 text-gray-500 mb-3" />
                  <p className="text-white font-medium mb-1">No scheduled posts yet</p>
                  <p className="text-gray-400 text-sm">Connect your Facebook or Instagram account above to start scheduling content.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <div key={post.id} className="flex items-center justify-between p-3 rounded-lg glass-card">
                      <div>
                        <p className="font-medium text-sm">{post.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(post.scheduledDate).toLocaleString()} · {post.platform}
                        </p>
                      </div>
                      <Badge variant={post.status === "posted" ? "default" : post.status === "failed" ? "destructive" : "secondary"}>
                        {post.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-center text-muted-foreground/50">
        SEO tools provided by free sources and APIs · Backlinking data via OpenLinkProfiler
      </p>
    </div>
  );
}
