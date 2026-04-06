// ============================================================
// SITEMAP MANAGER — Dynamic sitemap generation & management UI
// ============================================================

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Download, RefreshCw, Globe, FileText, ExternalLink,
  CheckCircle2, Map, Copy, Send,
} from "lucide-react";
import {
  generateSitemapXML,
  generateRobotsTxt,
  downloadSitemap,
  downloadRobotsTxt,
  getSitemapStats,
  getSearchConsoleInstructions,
  getSearchEnginePingUrls,
} from "@/services/sitemapService";

export default function SitemapManager() {
  const [stats, setStats] = useState(getSitemapStats());
  const [sitemapPreview, setSitemapPreview] = useState("");
  const [robotsPreview, setRobotsPreview] = useState("");
  const [showPreview, setShowPreview] = useState<"sitemap" | "robots" | null>(null);
  const [pingResults, setPingResults] = useState<Array<{ engine: string; status: string }>>([]);
  const [isPinging, setIsPinging] = useState(false);

  useEffect(() => {
    setStats(getSitemapStats());
  }, []);

  const handleRefresh = () => {
    setStats(getSitemapStats());
  };

  const handlePreviewSitemap = () => {
    if (showPreview === "sitemap") {
      setShowPreview(null);
      return;
    }
    setSitemapPreview(generateSitemapXML());
    setShowPreview("sitemap");
  };

  const handlePreviewRobots = () => {
    if (showPreview === "robots") {
      setShowPreview(null);
      return;
    }
    setRobotsPreview(generateRobotsTxt());
    setShowPreview("robots");
  };

  const handleCopyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handlePingSearchEngines = async () => {
    setIsPinging(true);
    const urls = getSearchEnginePingUrls();
    const results: Array<{ engine: string; status: string }> = [];

    for (const { engine, url } of urls) {
      try {
        // Note: These pings may be blocked by CORS in browser
        // In production, this would be done server-side
        await fetch(url, { mode: "no-cors" });
        results.push({ engine, status: "Pinged" });
      } catch {
        results.push({ engine, status: "Sent (verify manually)" });
      }
    }

    setPingResults(results);
    setIsPinging(false);
  };

  const instructions = getSearchConsoleInstructions();

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="glass-card border-purple-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-purple-400">{stats.total_urls}</p>
            <p className="text-xs text-gray-400">Total URLs</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-blue-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-400">{stats.review_urls}</p>
            <p className="text-xs text-gray-400">Review Pages</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-green-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{stats.blog_urls}</p>
            <p className="text-xs text-gray-400">Blog Posts</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-yellow-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-yellow-400">{stats.static_urls}</p>
            <p className="text-xs text-gray-400">Static Pages</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-pink-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-pink-400">{stats.category_urls}</p>
            <p className="text-xs text-gray-400">Categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Sitemap Actions */}
      <Card className="glass-card border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-purple-400" />
            Dynamic Sitemap
          </CardTitle>
          <CardDescription>
            Auto-generated from all published reviews, blog posts, and pages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => downloadSitemap()} className="gradient-steel">
              <Download className="h-4 w-4 mr-1" /> Download sitemap.xml
            </Button>
            <Button onClick={() => downloadRobotsTxt()} variant="outline">
              <Download className="h-4 w-4 mr-1" /> Download robots.txt
            </Button>
            <Button onClick={handlePreviewSitemap} variant="outline">
              <FileText className="h-4 w-4 mr-1" /> {showPreview === "sitemap" ? "Hide" : "Preview"} Sitemap
            </Button>
            <Button onClick={handlePreviewRobots} variant="outline">
              <FileText className="h-4 w-4 mr-1" /> {showPreview === "robots" ? "Hide" : "Preview"} Robots.txt
            </Button>
            <Button onClick={handleRefresh} variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh Stats
            </Button>
          </div>

          <div className="text-xs text-gray-400">
            Last generated: {new Date(stats.last_generated).toLocaleString()}
          </div>

          {showPreview === "sitemap" && (
            <div className="relative">
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => handleCopyToClipboard(sitemapPreview)}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <pre className="p-4 rounded-lg bg-slate-900 text-green-400 text-xs overflow-auto max-h-96 font-mono">
                {sitemapPreview}
              </pre>
            </div>
          )}

          {showPreview === "robots" && (
            <div className="relative">
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => handleCopyToClipboard(robotsPreview)}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <pre className="p-4 rounded-lg bg-slate-900 text-green-400 text-xs overflow-auto max-h-96 font-mono">
                {robotsPreview}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Engine Ping */}
      <Card className="glass-card border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-400" />
            Search Engine Notification
          </CardTitle>
          <CardDescription>
            Ping search engines to notify them of your updated sitemap
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handlePingSearchEngines}
            disabled={isPinging}
            className="gradient-steel"
          >
            {isPinging ? (
              <><RefreshCw className="h-4 w-4 animate-spin mr-1" /> Pinging...</>
            ) : (
              <><Globe className="h-4 w-4 mr-1" /> Ping Google & Bing</>
            )}
          </Button>

          {pingResults.length > 0 && (
            <div className="space-y-2">
              {pingResults.map((result, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded bg-slate-800/50">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-white">{result.engine}</span>
                  <Badge variant="outline" className="text-green-400 border-green-400/30">
                    {result.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Search Console Instructions */}
      <Card className="glass-card border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-400" />
            Google Search Console Setup
          </CardTitle>
          <CardDescription>
            Follow these steps to submit your sitemap to Google
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {instructions.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 p-2 rounded bg-slate-800/50">
                <Badge variant="outline" className="mt-0.5 text-purple-400 border-purple-400/30 shrink-0">
                  {idx + 1}
                </Badge>
                <p className="text-sm text-gray-300">{step.replace(/^\d+\.\s*/, "")}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Button variant="outline" asChild>
              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-1" /> Open Google Search Console
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Alert className="border-blue-500/30 bg-blue-500/10">
        <Globe className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-200 text-sm">
          The sitemap auto-updates whenever new reviews are published. Download and upload the
          sitemap.xml to your web server's root directory, or configure your hosting to serve it
          dynamically. For Vercel/Netlify deployments, place it in the <code>public/</code> folder.
        </AlertDescription>
      </Alert>
    </div>
  );
}
