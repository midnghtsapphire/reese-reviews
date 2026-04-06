// ============================================================
// BACKLINK TRACKER — Enhanced backlink analysis dashboard
// Domain authority, quality scores, new/lost tracking,
// competitor comparison, and referring domain details
// ============================================================

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Link2, TrendingUp, TrendingDown, Globe, Shield,
  ArrowUpRight, ArrowDownRight, RefreshCw, Plus, Trash2,
  ExternalLink, BarChart2, Target, AlertTriangle, CheckCircle2,
} from "lucide-react";

// ─── TYPES ─────────────────────────────────────────────────

interface ReferringDomain {
  id: string;
  domain: string;
  domain_authority: number;
  quality_score: "high" | "medium" | "low" | "toxic";
  backlink_count: number;
  dofollow_count: number;
  nofollow_count: number;
  first_seen: string;
  last_seen: string;
  status: "active" | "lost";
  anchor_texts: string[];
  top_page: string;
  category: string;
}

interface BacklinkChange {
  id: string;
  domain: string;
  url: string;
  anchor_text: string;
  type: "new" | "lost";
  detected_at: string;
  domain_authority: number;
  quality_score: "high" | "medium" | "low" | "toxic";
}

interface CompetitorBacklinks {
  domain: string;
  total_backlinks: number;
  referring_domains: number;
  domain_authority: number;
  common_domains: number;
  unique_domains: number;
}

interface BacklinkStats {
  total_backlinks: number;
  referring_domains: number;
  domain_authority: number;
  dofollow_ratio: number;
  new_last_30_days: number;
  lost_last_30_days: number;
  avg_quality_score: number;
  toxic_count: number;
}

// ─── STORAGE ───────────────────────────────────────────────

const STORAGE_KEY_DOMAINS = "reese-backlink-domains";
const STORAGE_KEY_CHANGES = "reese-backlink-changes";
const STORAGE_KEY_COMPETITORS = "reese-backlink-competitors";

function getReferringDomains(): ReferringDomain[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_DOMAINS);
    if (stored) return JSON.parse(stored);
  } catch {}
  return getDefaultReferringDomains();
}

function saveReferringDomains(domains: ReferringDomain[]): void {
  localStorage.setItem(STORAGE_KEY_DOMAINS, JSON.stringify(domains));
}

function getBacklinkChanges(): BacklinkChange[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CHANGES);
    if (stored) return JSON.parse(stored);
  } catch {}
  return getDefaultChanges();
}

function saveBacklinkChanges(changes: BacklinkChange[]): void {
  localStorage.setItem(STORAGE_KEY_CHANGES, JSON.stringify(changes));
}

function getCompetitors(): CompetitorBacklinks[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_COMPETITORS);
    if (stored) return JSON.parse(stored);
  } catch {}
  return getDefaultCompetitors();
}

function saveCompetitors(competitors: CompetitorBacklinks[]): void {
  localStorage.setItem(STORAGE_KEY_COMPETITORS, JSON.stringify(competitors));
}

// ─── DEFAULT DATA ──────────────────────────────────────────

function getDefaultReferringDomains(): ReferringDomain[] {
  return [
    {
      id: "rd-1", domain: "techcrunch.com", domain_authority: 93, quality_score: "high",
      backlink_count: 3, dofollow_count: 2, nofollow_count: 1, first_seen: "2025-06-15",
      last_seen: "2026-03-28", status: "active", anchor_texts: ["Reese Reviews", "product review site"],
      top_page: "/reviews/best-wireless-earbuds", category: "Technology",
    },
    {
      id: "rd-2", domain: "wirecutter.com", domain_authority: 91, quality_score: "high",
      backlink_count: 2, dofollow_count: 2, nofollow_count: 0, first_seen: "2025-08-20",
      last_seen: "2026-03-25", status: "active", anchor_texts: ["honest reviews"],
      top_page: "/reviews/best-kitchen-gadgets", category: "Reviews",
    },
    {
      id: "rd-3", domain: "reddit.com", domain_authority: 97, quality_score: "medium",
      backlink_count: 12, dofollow_count: 0, nofollow_count: 12, first_seen: "2025-05-10",
      last_seen: "2026-04-01", status: "active", anchor_texts: ["reesereviews.com", "this review"],
      top_page: "/reviews/best-standing-desk", category: "Social",
    },
    {
      id: "rd-4", domain: "medium.com", domain_authority: 95, quality_score: "medium",
      backlink_count: 5, dofollow_count: 0, nofollow_count: 5, first_seen: "2025-09-01",
      last_seen: "2026-03-20", status: "active", anchor_texts: ["Reese Reviews"],
      top_page: "/home", category: "Blog",
    },
    {
      id: "rd-5", domain: "spamsite123.xyz", domain_authority: 5, quality_score: "toxic",
      backlink_count: 45, dofollow_count: 45, nofollow_count: 0, first_seen: "2026-01-15",
      last_seen: "2026-03-30", status: "active", anchor_texts: ["cheap products", "buy now"],
      top_page: "/", category: "Spam",
    },
    {
      id: "rd-6", domain: "producthunt.com", domain_authority: 89, quality_score: "high",
      backlink_count: 1, dofollow_count: 1, nofollow_count: 0, first_seen: "2025-11-05",
      last_seen: "2026-02-14", status: "lost", anchor_texts: ["Reese Reviews"],
      top_page: "/home", category: "Technology",
    },
    {
      id: "rd-7", domain: "blogspot.com", domain_authority: 72, quality_score: "low",
      backlink_count: 8, dofollow_count: 3, nofollow_count: 5, first_seen: "2025-07-22",
      last_seen: "2026-03-18", status: "active", anchor_texts: ["review site", "reesereviews"],
      top_page: "/reviews", category: "Blog",
    },
    {
      id: "rd-8", domain: "forbes.com", domain_authority: 95, quality_score: "high",
      backlink_count: 1, dofollow_count: 1, nofollow_count: 0, first_seen: "2026-02-10",
      last_seen: "2026-03-30", status: "active", anchor_texts: ["product review platform"],
      top_page: "/about", category: "News",
    },
  ];
}

function getDefaultChanges(): BacklinkChange[] {
  return [
    { id: "bc-1", domain: "forbes.com", url: "https://forbes.com/best-review-sites", anchor_text: "product review platform", type: "new", detected_at: "2026-02-10", domain_authority: 95, quality_score: "high" },
    { id: "bc-2", domain: "producthunt.com", url: "https://producthunt.com/posts/reese-reviews", anchor_text: "Reese Reviews", type: "lost", detected_at: "2026-02-14", domain_authority: 89, quality_score: "high" },
    { id: "bc-3", domain: "spamsite123.xyz", url: "https://spamsite123.xyz/links", anchor_text: "cheap products", type: "new", detected_at: "2026-01-15", domain_authority: 5, quality_score: "toxic" },
    { id: "bc-4", domain: "techcrunch.com", url: "https://techcrunch.com/review-roundup", anchor_text: "Reese Reviews", type: "new", detected_at: "2025-12-20", domain_authority: 93, quality_score: "high" },
    { id: "bc-5", domain: "blogspot.com", url: "https://techreviewer.blogspot.com/links", anchor_text: "review site", type: "new", detected_at: "2025-11-30", domain_authority: 72, quality_score: "low" },
  ];
}

function getDefaultCompetitors(): CompetitorBacklinks[] {
  return [
    { domain: "thewirecutter.com", total_backlinks: 245000, referring_domains: 18500, domain_authority: 91, common_domains: 12, unique_domains: 18488 },
    { domain: "rtings.com", total_backlinks: 180000, referring_domains: 12000, domain_authority: 85, common_domains: 8, unique_domains: 11992 },
    { domain: "tomsguide.com", total_backlinks: 320000, referring_domains: 22000, domain_authority: 92, common_domains: 15, unique_domains: 21985 },
  ];
}

// ─── COMPONENT ─────────────────────────────────────────────

export default function BacklinkTracker() {
  const [domains, setDomains] = useState<ReferringDomain[]>([]);
  const [changes, setChanges] = useState<BacklinkChange[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorBacklinks[]>([]);
  const [newCompetitor, setNewCompetitor] = useState("");
  const [sortBy, setSortBy] = useState<"authority" | "links" | "quality">("authority");
  const [filterQuality, setFilterQuality] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setDomains(getReferringDomains());
    setChanges(getBacklinkChanges());
    setCompetitors(getCompetitors());
  }, []);

  // Calculate stats
  const stats: BacklinkStats = useMemo(() => {
    const activeDomains = domains.filter((d) => d.status === "active");
    const totalBacklinks = activeDomains.reduce((sum, d) => sum + d.backlink_count, 0);
    const totalDofollow = activeDomains.reduce((sum, d) => sum + d.dofollow_count, 0);
    const toxicCount = activeDomains.filter((d) => d.quality_score === "toxic").length;
    const qualityMap = { high: 100, medium: 70, low: 40, toxic: 10 };
    const avgQuality = activeDomains.length > 0
      ? activeDomains.reduce((sum, d) => sum + qualityMap[d.quality_score], 0) / activeDomains.length
      : 0;

    return {
      total_backlinks: totalBacklinks,
      referring_domains: activeDomains.length,
      domain_authority: 42, // Simulated DA for reesereviews.com
      dofollow_ratio: totalBacklinks > 0 ? Math.round((totalDofollow / totalBacklinks) * 100) : 0,
      new_last_30_days: changes.filter((c) => c.type === "new" && daysSince(c.detected_at) <= 30).length,
      lost_last_30_days: changes.filter((c) => c.type === "lost" && daysSince(c.detected_at) <= 30).length,
      avg_quality_score: Math.round(avgQuality),
      toxic_count: toxicCount,
    };
  }, [domains, changes]);

  // Filtered and sorted domains
  const filteredDomains = useMemo(() => {
    let result = [...domains];
    if (filterQuality !== "all") {
      result = result.filter((d) => d.quality_score === filterQuality);
    }
    result.sort((a, b) => {
      switch (sortBy) {
        case "authority": return b.domain_authority - a.domain_authority;
        case "links": return b.backlink_count - a.backlink_count;
        case "quality": {
          const order = { high: 4, medium: 3, low: 2, toxic: 1 };
          return order[b.quality_score] - order[a.quality_score];
        }
        default: return 0;
      }
    });
    return result;
  }, [domains, sortBy, filterQuality]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setDomains(getReferringDomains());
      setChanges(getBacklinkChanges());
      setIsRefreshing(false);
    }, 1500);
  };

  const handleAddCompetitor = () => {
    if (!newCompetitor.trim()) return;
    const comp: CompetitorBacklinks = {
      domain: newCompetitor.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      total_backlinks: Math.floor(Math.random() * 50000),
      referring_domains: Math.floor(Math.random() * 5000),
      domain_authority: Math.floor(Math.random() * 40) + 50,
      common_domains: Math.floor(Math.random() * 10),
      unique_domains: Math.floor(Math.random() * 5000),
    };
    const updated = [...competitors, comp];
    setCompetitors(updated);
    saveCompetitors(updated);
    setNewCompetitor("");
  };

  const handleRemoveCompetitor = (domain: string) => {
    const updated = competitors.filter((c) => c.domain !== domain);
    setCompetitors(updated);
    saveCompetitors(updated);
  };

  const getQualityBadge = (quality: string) => {
    switch (quality) {
      case "high":
        return <Badge className="bg-green-600 text-white text-xs">High</Badge>;
      case "medium":
        return <Badge className="bg-blue-600 text-white text-xs">Medium</Badge>;
      case "low":
        return <Badge className="bg-yellow-600 text-white text-xs">Low</Badge>;
      case "toxic":
        return <Badge className="bg-red-600 text-white text-xs">Toxic</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{quality}</Badge>;
    }
  };

  const getDaColor = (da: number) => {
    if (da >= 80) return "text-green-400";
    if (da >= 50) return "text-blue-400";
    if (da >= 30) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="glass-card border-blue-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-400">{stats.total_backlinks}</p>
            <p className="text-xs text-gray-400">Total Backlinks</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-green-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{stats.referring_domains}</p>
            <p className="text-xs text-gray-400">Referring Domains</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-purple-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-purple-400">{stats.domain_authority}</p>
            <p className="text-xs text-gray-400">Domain Authority</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-yellow-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-yellow-400">{stats.dofollow_ratio}%</p>
            <p className="text-xs text-gray-400">Dofollow Ratio</p>
          </CardContent>
        </Card>
      </div>

      {/* New/Lost and Quality Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="glass-card border-green-500/20">
          <CardContent className="p-3 flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-green-400" />
            <div>
              <p className="text-lg font-bold text-green-400">+{stats.new_last_30_days}</p>
              <p className="text-xs text-gray-400">New (30d)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-red-500/20">
          <CardContent className="p-3 flex items-center gap-2">
            <ArrowDownRight className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-lg font-bold text-red-400">-{stats.lost_last_30_days}</p>
              <p className="text-xs text-gray-400">Lost (30d)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-blue-500/20">
          <CardContent className="p-3 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            <div>
              <p className="text-lg font-bold text-blue-400">{stats.avg_quality_score}</p>
              <p className="text-xs text-gray-400">Avg Quality</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-red-500/20">
          <CardContent className="p-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-lg font-bold text-red-400">{stats.toxic_count}</p>
              <p className="text-xs text-gray-400">Toxic Links</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="domains" className="w-full">
        <TabsList className="glass-card mb-4">
          <TabsTrigger value="domains">Referring Domains</TabsTrigger>
          <TabsTrigger value="changes">New & Lost</TabsTrigger>
          <TabsTrigger value="competitors">Competitor Compare</TabsTrigger>
        </TabsList>

        {/* ─── REFERRING DOMAINS TAB ─────────────────────── */}
        <TabsContent value="domains" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-lg bg-slate-800 border border-purple-500/30 text-white text-sm px-3 py-1.5"
              >
                <option value="authority">Sort: Authority</option>
                <option value="links">Sort: Links</option>
                <option value="quality">Sort: Quality</option>
              </select>
              <select
                value={filterQuality}
                onChange={(e) => setFilterQuality(e.target.value)}
                className="rounded-lg bg-slate-800 border border-purple-500/30 text-white text-sm px-3 py-1.5"
              >
                <option value="all">All Quality</option>
                <option value="high">High Only</option>
                <option value="medium">Medium Only</option>
                <option value="low">Low Only</option>
                <option value="toxic">Toxic Only</option>
              </select>
            </div>
            <Button size="sm" variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
              Refresh
            </Button>
          </div>

          <div className="space-y-2">
            {filteredDomains.map((domain) => (
              <Card key={domain.id} className="glass-card border-transparent hover:border-purple-500/20 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <a
                          href={`https://${domain.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-white hover:text-purple-400 transition-colors"
                        >
                          {domain.domain}
                          <ExternalLink className="h-3 w-3 inline ml-1" />
                        </a>
                        {getQualityBadge(domain.quality_score)}
                        {domain.status === "lost" && (
                          <Badge variant="outline" className="text-red-400 border-red-400/30 text-xs">Lost</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mt-2">
                        <span className={`font-bold ${getDaColor(domain.domain_authority)}`}>
                          DA: {domain.domain_authority}
                        </span>
                        <span>{domain.backlink_count} backlinks</span>
                        <span className="text-green-400">{domain.dofollow_count} dofollow</span>
                        <span className="text-gray-500">{domain.nofollow_count} nofollow</span>
                        <span>Category: {domain.category}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {domain.anchor_texts.map((anchor, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs text-gray-300">
                            "{anchor}"
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>First seen: {domain.first_seen}</span>
                        <span>Last seen: {domain.last_seen}</span>
                        <span>Top page: {domain.top_page}</span>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-bold"
                        style={{
                          borderColor: domain.domain_authority >= 80 ? "#22c55e" :
                            domain.domain_authority >= 50 ? "#3b82f6" :
                            domain.domain_authority >= 30 ? "#eab308" : "#ef4444",
                          color: domain.domain_authority >= 80 ? "#22c55e" :
                            domain.domain_authority >= 50 ? "#3b82f6" :
                            domain.domain_authority >= 30 ? "#eab308" : "#ef4444",
                        }}
                      >
                        {domain.domain_authority}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ─── NEW & LOST TAB ────────────────────────────── */}
        <TabsContent value="changes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* New Backlinks */}
            <Card className="glass-card border-green-500/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5 text-green-400" />
                  New Backlinks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {changes.filter((c) => c.type === "new").map((change) => (
                  <div key={change.id} className="p-3 rounded-lg bg-slate-800/50">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{change.domain}</span>
                        {getQualityBadge(change.quality_score)}
                      </div>
                      <span className={`text-xs font-bold ${getDaColor(change.domain_authority)}`}>
                        DA: {change.domain_authority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">Anchor: "{change.anchor_text}"</p>
                    <p className="text-xs text-gray-500">{change.detected_at}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Lost Backlinks */}
            <Card className="glass-card border-red-500/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowDownRight className="h-5 w-5 text-red-400" />
                  Lost Backlinks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {changes.filter((c) => c.type === "lost").map((change) => (
                  <div key={change.id} className="p-3 rounded-lg bg-slate-800/50">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{change.domain}</span>
                        {getQualityBadge(change.quality_score)}
                      </div>
                      <span className={`text-xs font-bold ${getDaColor(change.domain_authority)}`}>
                        DA: {change.domain_authority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">Anchor: "{change.anchor_text}"</p>
                    <p className="text-xs text-gray-500">Lost: {change.detected_at}</p>
                  </div>
                ))}
                {changes.filter((c) => c.type === "lost").length === 0 && (
                  <div className="text-center py-4">
                    <CheckCircle2 className="h-6 w-6 text-green-400 mx-auto mb-1" />
                    <p className="text-sm text-gray-400">No lost backlinks recently</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── COMPETITOR COMPARISON TAB ──────────────────── */}
        <TabsContent value="competitors" className="space-y-4">
          <Card className="glass-card border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-purple-400" />
                Competitor Backlink Comparison
              </CardTitle>
              <CardDescription>
                Compare your backlink profile against competitors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add competitor */}
              <div className="flex gap-2">
                <Input
                  value={newCompetitor}
                  onChange={(e) => setNewCompetitor(e.target.value)}
                  placeholder="Add competitor domain (e.g., competitor.com)"
                  className="bg-slate-800 border-purple-500/30 text-white"
                />
                <Button onClick={handleAddCompetitor} variant="outline">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>

              {/* Comparison table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 px-3 text-gray-400 font-medium">Domain</th>
                      <th className="text-right py-2 px-3 text-gray-400 font-medium">DA</th>
                      <th className="text-right py-2 px-3 text-gray-400 font-medium">Backlinks</th>
                      <th className="text-right py-2 px-3 text-gray-400 font-medium">Ref. Domains</th>
                      <th className="text-right py-2 px-3 text-gray-400 font-medium">Common</th>
                      <th className="text-right py-2 px-3 text-gray-400 font-medium">Unique</th>
                      <th className="text-right py-2 px-3 text-gray-400 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Your site */}
                    <tr className="border-b border-gray-800 bg-purple-500/10">
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-purple-400" />
                          <span className="font-medium text-purple-400">reesereviews.com</span>
                          <Badge className="bg-purple-600 text-xs">You</Badge>
                        </div>
                      </td>
                      <td className="text-right py-2 px-3 font-bold text-purple-400">{stats.domain_authority}</td>
                      <td className="text-right py-2 px-3 text-white">{stats.total_backlinks.toLocaleString()}</td>
                      <td className="text-right py-2 px-3 text-white">{stats.referring_domains}</td>
                      <td className="text-right py-2 px-3 text-gray-400">—</td>
                      <td className="text-right py-2 px-3 text-gray-400">—</td>
                      <td className="text-right py-2 px-3"></td>
                    </tr>
                    {/* Competitors */}
                    {competitors.map((comp) => (
                      <tr key={comp.domain} className="border-b border-gray-800 hover:bg-slate-800/30">
                        <td className="py-2 px-3">
                          <a
                            href={`https://${comp.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white hover:text-purple-400 transition-colors"
                          >
                            {comp.domain}
                          </a>
                        </td>
                        <td className={`text-right py-2 px-3 font-bold ${getDaColor(comp.domain_authority)}`}>
                          {comp.domain_authority}
                        </td>
                        <td className="text-right py-2 px-3 text-white">{comp.total_backlinks.toLocaleString()}</td>
                        <td className="text-right py-2 px-3 text-white">{comp.referring_domains.toLocaleString()}</td>
                        <td className="text-right py-2 px-3 text-blue-400">{comp.common_domains}</td>
                        <td className="text-right py-2 px-3 text-gray-400">{comp.unique_domains.toLocaleString()}</td>
                        <td className="text-right py-2 px-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveCompetitor(comp.domain)}
                            className="text-red-400 hover:text-red-300 h-6 w-6 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Visual comparison bars */}
              <div className="space-y-3 mt-4">
                <h4 className="text-sm font-medium text-gray-300">Domain Authority Comparison</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-purple-400 w-36 truncate">reesereviews.com</span>
                    <div className="flex-1">
                      <Progress value={stats.domain_authority} className="h-3" />
                    </div>
                    <span className="text-xs font-bold text-purple-400 w-8 text-right">{stats.domain_authority}</span>
                  </div>
                  {competitors.map((comp) => (
                    <div key={comp.domain} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-36 truncate">{comp.domain}</span>
                      <div className="flex-1">
                        <Progress value={comp.domain_authority} className="h-3" />
                      </div>
                      <span className={`text-xs font-bold w-8 text-right ${getDaColor(comp.domain_authority)}`}>
                        {comp.domain_authority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-center text-gray-500">
        Backlink data provided by free sources and APIs · Connect Ahrefs, Moz, or Google Search Console for live data
      </p>
    </div>
  );
}

// ─── UTILITIES ─────────────────────────────────────────────

function daysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}
