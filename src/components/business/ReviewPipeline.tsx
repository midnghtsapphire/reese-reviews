// ============================================================
// REVIEW PIPELINE — MAIN DASHBOARD COMPONENT
// The central hub that connects Amazon Vine reviews to the
// Reese Reviews website. Provides a tabbed interface for:
// 1. Import — Pull reviews from amazonReviewStore
// 2. Map — Auto-categorize and manually assign categories
// 3. Enrich — Add images, affiliate links, pros/cons
// 4. Publish — Push to reviewStore for the live site
// ============================================================

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowRight,
  Download,
  Tag,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  Eye,
  BarChart3,
  Package,
  Zap,
  ArrowUpRight,
  Clock,
  Star,
  XCircle,
} from "lucide-react";
import {
  bulkImport,
  incrementalSync,
  getPipelineReviews,
  getPipelineStats,
  filterPipelineReviews,
  publishReview,
  bulkPublish,
  unpublishReview,
  deletePipelineReview,
  clearPipeline,
  type PipelineReview,
  type PipelineStatus,
  type PipelineStats,
  type PipelineFilter,
} from "@/lib/reviewPipeline";
import { getAmazonReviews } from "@/lib/amazonReviewStore";
import { SITE_CATEGORIES, type SiteCategory } from "@/lib/categoryRules";
import { CategoryMapper } from "./CategoryMapper";
import { ReviewEnricher } from "./ReviewEnricher";

// ─── TAB TYPE ───────────────────────────────────────────────

type PipelineTab = "overview" | "import" | "map" | "enrich" | "publish";

// ─── COMPONENT ──────────────────────────────────────────────

export function ReviewPipeline() {
  const [activeTab, setActiveTab] = useState<PipelineTab>("overview");
  const [reviews, setReviews] = useState<PipelineReview[]>([]);
  const [stats, setStats] = useState<PipelineStats>(getPipelineStats());
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [enrichReviewId, setEnrichReviewId] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<PipelineStatus | "all">("all");
  const [filterCategory, setFilterCategory] = useState<SiteCategory | "all">("all");
  const [filterRating, setFilterRating] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const refreshData = useCallback(() => {
    setReviews(getPipelineReviews());
    setStats(getPipelineStats());
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // ─── FILTERED REVIEWS ──────────────────────────────────

  const filteredReviews = useMemo(() => {
    const filter: PipelineFilter = {
      status: filterStatus,
      category: filterCategory,
      rating: filterRating,
      search: searchQuery,
    };
    return filterPipelineReviews(filter);
  }, [filterStatus, filterCategory, filterRating, searchQuery]);

  // ─── AMAZON REVIEW COUNT ──────────────────────────────

  const amazonReviewCount = useMemo(() => {
    try {
      return getAmazonReviews().length;
    } catch {
      return 0;
    }
  }, []);

  // ─── HANDLERS ──────────────────────────────────────────

  const handleBulkImport = () => {
    const result = bulkImport();
    refreshData();
    if (result.imported > 0) {
      showMsg("success", `Imported ${result.imported} new reviews (${result.skipped} already in pipeline)`);
    } else if (result.skipped > 0) {
      showMsg("info", `All ${result.skipped} reviews already in pipeline`);
    } else {
      showMsg("info", "No reviews found in Amazon Review Store. Import reviews there first.");
    }
  };

  const handleSync = () => {
    const result = incrementalSync();
    refreshData();
    if (result.newReviews > 0) {
      showMsg("success", `Synced ${result.newReviews} new reviews`);
    } else {
      showMsg("info", "Pipeline is up to date — no new reviews to sync");
    }
  };

  const handlePublish = (id: string) => {
    const result = publishReview(id);
    refreshData();
    if (result) {
      showMsg("success", `Published: "${result.title}"`);
    } else {
      showMsg("error", "Failed to publish review");
    }
  };

  const handleBulkPublish = () => {
    if (selectedIds.size === 0) return;
    const result = bulkPublish(Array.from(selectedIds));
    setSelectedIds(new Set());
    refreshData();
    showMsg("success", `Published ${result.published} reviews (${result.failed} failed)`);
  };

  const handleUnpublish = (id: string) => {
    unpublishReview(id);
    refreshData();
    showMsg("success", "Review unpublished and reverted to enriched status");
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this review from the pipeline? This cannot be undone.")) return;
    deletePipelineReview(id);
    refreshData();
    showMsg("success", "Review removed from pipeline");
  };

  const handleClearPipeline = () => {
    if (!window.confirm("Clear the ENTIRE pipeline? This will remove all pipeline data but won't affect Amazon reviews or published site reviews.")) return;
    clearPipeline();
    refreshData();
    showMsg("success", "Pipeline cleared");
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAllFiltered = () => {
    if (selectedIds.size === filteredReviews.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredReviews.map((r) => r.id)));
    }
  };

  const handleEnrichReview = (id: string) => {
    setEnrichReviewId(id);
    setActiveTab("enrich");
  };

  const showMsg = (type: "success" | "error" | "info", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // ─── STATUS HELPERS ────────────────────────────────────

  const statusColor = (status: PipelineStatus): string => {
    const colors: Record<PipelineStatus, string> = {
      imported: "bg-gray-500/20 text-gray-300 border-gray-500/30",
      mapped: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      enriched: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      published: "bg-green-500/20 text-green-300 border-green-500/30",
      live: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    };
    return colors[status] ?? colors.imported;
  };

  const confidenceColor = (confidence: string): string => {
    const colors: Record<string, string> = {
      high: "text-green-400",
      medium: "text-yellow-400",
      low: "text-red-400",
    };
    return colors[confidence] ?? "text-gray-400";
  };

  // ─── TABS CONFIG ───────────────────────────────────────

  const tabs: { id: PipelineTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "overview", label: "Overview", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "import", label: "Import", icon: <Download className="h-4 w-4" />, count: amazonReviewCount },
    { id: "map", label: "Map Categories", icon: <Tag className="h-4 w-4" />, count: stats.totalMapped },
    { id: "enrich", label: "Enrich", icon: <Sparkles className="h-4 w-4" />, count: stats.totalEnriched },
    { id: "publish", label: "Publish", icon: <Send className="h-4 w-4" />, count: stats.totalPublished },
  ];

  // ─── RENDER: OVERVIEW TAB ──────────────────────────────

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Pipeline Flow Visualization */}
      <Card className="bg-white/5 border-white/10 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base font-bold text-white">Review Pipeline Flow</CardTitle>
          <CardDescription className="text-gray-400">
            Amazon Vine reviews flow through this pipeline to become published reviews on reesereviews.com
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
            {[
              { label: "Amazon Store", count: amazonReviewCount, color: "from-orange-500/20 to-orange-600/10", border: "border-orange-500/30", icon: <Package className="h-5 w-5 text-orange-400" /> },
              { label: "Imported", count: stats.totalImported, color: "from-gray-500/20 to-gray-600/10", border: "border-gray-500/30", icon: <Download className="h-5 w-5 text-gray-400" /> },
              { label: "Mapped", count: stats.totalMapped, color: "from-blue-500/20 to-blue-600/10", border: "border-blue-500/30", icon: <Tag className="h-5 w-5 text-blue-400" /> },
              { label: "Enriched", count: stats.totalEnriched, color: "from-purple-500/20 to-purple-600/10", border: "border-purple-500/30", icon: <Sparkles className="h-5 w-5 text-purple-400" /> },
              { label: "Published", count: stats.totalPublished, color: "from-green-500/20 to-green-600/10", border: "border-green-500/30", icon: <Send className="h-5 w-5 text-green-400" /> },
            ].map((step, i) => (
              <React.Fragment key={step.label}>
                <div className={`flex-1 min-w-[120px] p-4 rounded-xl bg-gradient-to-br ${step.color} border ${step.border} text-center`}>
                  <div className="flex justify-center mb-2">{step.icon}</div>
                  <p className="text-2xl font-bold text-white">{step.count}</p>
                  <p className="text-xs text-gray-400 mt-1">{step.label}</p>
                </div>
                {i < 4 && (
                  <ArrowRight className="h-5 w-5 text-gray-600 flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Pending Import</p>
            <p className="text-xl font-bold text-orange-400">
              {Math.max(0, amazonReviewCount - stats.totalImported)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Needs Enrichment</p>
            <p className="text-xl font-bold text-blue-400">
              {stats.totalMapped - stats.totalEnriched}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Ready to Publish</p>
            <p className="text-xl font-bold text-purple-400">
              {stats.totalEnriched - stats.totalPublished}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Live on Site</p>
            <p className="text-xl font-bold text-green-400">
              {stats.totalPublished}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-300">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleBulkImport}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Import All Reviews
            </Button>
            <Button
              onClick={handleSync}
              variant="outline"
              className="border-white/20 text-gray-300 hover:text-white hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync New Reviews
            </Button>
            <Button
              onClick={() => {
                const publishable = reviews.filter((r) => r.status === "enriched" || r.status === "mapped");
                if (publishable.length === 0) {
                  showMsg("info", "No reviews ready to publish");
                  return;
                }
                const result = bulkPublish(publishable.map((r) => r.id));
                refreshData();
                showMsg("success", `Published ${result.published} reviews`);
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              Publish All Ready
            </Button>
            <Button
              onClick={handleClearPipeline}
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Pipeline
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-300">Recent Pipeline Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No reviews in the pipeline yet.</p>
              <p className="text-xs mt-1">Click "Import All Reviews" to get started.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {reviews.slice(0, 20).map((review) => (
                <div
                  key={review.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{review.productName}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span className="text-yellow-400">{"★".repeat(review.rating)}</span>
                      <span>{review.date}</span>
                      <span className={confidenceColor(review.categoryConfidence)}>
                        {review.categoryConfidence}
                      </span>
                    </div>
                  </div>
                  <Badge className={`text-[10px] border ${statusColor(review.status)}`}>
                    {review.status}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-white/20 text-gray-400">
                    {SITE_CATEGORIES.find((c) => c.value === review.assignedCategory)?.icon}{" "}
                    {SITE_CATEGORIES.find((c) => c.value === review.assignedCategory)?.label}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timestamps */}
      {(stats.lastImportAt || stats.lastPublishAt) && (
        <div className="flex items-center gap-4 text-xs text-gray-600">
          {stats.lastImportAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last import: {new Date(stats.lastImportAt).toLocaleString()}
            </span>
          )}
          {stats.lastPublishAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last publish: {new Date(stats.lastPublishAt).toLocaleString()}
            </span>
          )}
        </div>
      )}
    </div>
  );

  // ─── RENDER: IMPORT TAB ────────────────────────────────

  const renderImport = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Download className="h-5 w-5 text-orange-400" />
          Import Reviews
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          Pull reviews from the Amazon Review Store into the pipeline. Reviews are auto-categorized on import.
        </p>
      </div>

      {/* Import Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-6 text-center">
            <Package className="h-8 w-8 mx-auto mb-2 text-orange-400" />
            <p className="text-3xl font-bold text-white">{amazonReviewCount}</p>
            <p className="text-xs text-gray-400 mt-1">In Amazon Store</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-6 text-center">
            <Download className="h-8 w-8 mx-auto mb-2 text-blue-400" />
            <p className="text-3xl font-bold text-white">{stats.totalImported}</p>
            <p className="text-xs text-gray-400 mt-1">In Pipeline</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="p-6 text-center">
            <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
            <p className="text-3xl font-bold text-white">
              {Math.max(0, amazonReviewCount - stats.totalImported)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Pending Import</p>
          </CardContent>
        </Card>
      </div>

      {/* Import Actions */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleBulkImport}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white h-12"
            >
              <Download className="h-5 w-5 mr-2" />
              Bulk Import All Reviews
            </Button>
            <Button
              onClick={handleSync}
              variant="outline"
              className="flex-1 border-white/20 text-gray-300 hover:text-white hover:bg-white/10 h-12"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Incremental Sync (New Only)
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Bulk import pulls all reviews. Incremental sync only adds new ones not already in the pipeline.
          </p>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-300">How Import Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: "1", title: "Source", desc: "Reviews from Amazon Review Store (demo, HTML paste, or cookie import)" },
              { step: "2", title: "Auto-Map", desc: "Category rules engine assigns a site category based on product name and ASIN" },
              { step: "3", title: "Extract", desc: "Pros/cons, excerpt, and verdict are auto-extracted from review text" },
              { step: "4", title: "Ready", desc: "Review enters pipeline as 'mapped' — ready for enrichment or direct publishing" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-2">
                  <span className="text-sm font-bold text-purple-300">{item.step}</span>
                </div>
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ─── RENDER: PUBLISH TAB ───────────────────────────────

  const renderPublish = () => {
    const publishable = reviews.filter((r) => r.status === "mapped" || r.status === "enriched");
    const published = reviews.filter((r) => r.status === "published" || r.status === "live");

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Send className="h-5 w-5 text-green-400" />
              Publish Reviews
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Push enriched reviews to reesereviews.com. Published reviews appear in the site's review store.
            </p>
          </div>
          {selectedIds.size > 0 && (
            <Button
              onClick={handleBulkPublish}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              Publish {selectedIds.size} Selected
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as PipelineStatus | "all")}>
            <SelectTrigger className="w-[130px] bg-white/5 border-white/10 text-gray-300">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="imported">Imported</SelectItem>
              <SelectItem value="mapped">Mapped</SelectItem>
              <SelectItem value="enriched">Enriched</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as SiteCategory | "all")}>
            <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-gray-300">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {SITE_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(filterRating)} onValueChange={(v) => setFilterRating(v === "all" ? "all" : Number(v))}>
            <SelectTrigger className="w-[120px] bg-white/5 border-white/10 text-gray-300">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ready to Publish */}
        {publishable.length > 0 && (
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Ready to Publish ({publishable.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllFiltered}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    {selectedIds.size === filteredReviews.length && filteredReviews.length > 0 ? "Deselect All" : "Select All"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const result = bulkPublish(publishable.map((r) => r.id));
                      refreshData();
                      showMsg("success", `Published ${result.published} reviews`);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Publish All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {publishable.map((review) => (
                <div
                  key={review.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(review.id)}
                    onChange={() => toggleSelect(review.id)}
                    className="h-4 w-4 accent-purple-500 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{review.productName}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span className="text-yellow-400">{"★".repeat(review.rating)}</span>
                      <span>{review.date}</span>
                      <span>{SITE_CATEGORIES.find((c) => c.value === review.assignedCategory)?.icon} {SITE_CATEGORIES.find((c) => c.value === review.assignedCategory)?.label}</span>
                    </div>
                  </div>
                  <Badge className={`text-[10px] border ${statusColor(review.status)}`}>
                    {review.status}
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => handleEnrichReview(review.id)}
                    variant="outline"
                    className="text-xs border-white/20 text-gray-300 hover:text-white hover:bg-white/10"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Enrich
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handlePublish(review.id)}
                    className="text-xs bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Publish
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Already Published */}
        {published.length > 0 && (
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                Published ({published.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {published.map((review) => (
                <div
                  key={review.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/10 hover:bg-green-500/10 transition"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{review.productName}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span className="text-yellow-400">{"★".repeat(review.rating)}</span>
                      <span>{SITE_CATEGORIES.find((c) => c.value === review.assignedCategory)?.icon} {SITE_CATEGORIES.find((c) => c.value === review.assignedCategory)?.label}</span>
                      {review.publishedAt && (
                        <span>Published {new Date(review.publishedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleUnpublish(review.id)}
                    variant="outline"
                    className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Unpublish
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {publishable.length === 0 && published.length === 0 && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-12 text-center">
              <Send className="h-12 w-12 mx-auto mb-4 text-gray-600" />
              <h3 className="text-lg font-bold text-gray-400 mb-2">No Reviews to Publish</h3>
              <p className="text-sm text-gray-500">
                Import and enrich reviews first, then come here to publish them to the site.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // ─── MAIN RENDER ───────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Pipeline Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            Review Pipeline
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Amazon Vine → Auto-Categorize → Enrich → Publish to reesereviews.com
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshData}
          className="border-white/20 text-gray-300 hover:text-white hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Message */}
      {message && (
        <Alert
          className={
            message.type === "success"
              ? "border-green-500/30 bg-green-500/10"
              : message.type === "error"
              ? "border-red-500/30 bg-red-500/10"
              : "border-blue-500/30 bg-blue-500/10"
          }
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-green-400" />
          ) : message.type === "error" ? (
            <AlertCircle className="h-4 w-4 text-red-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-blue-400" />
          )}
          <AlertDescription
            className={
              message.type === "success"
                ? "text-green-300"
                : message.type === "error"
                ? "text-red-300"
                : "text-blue-300"
            }
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id !== "enrich") setEnrichReviewId(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === tab.id ? "bg-white/20" : "bg-white/10"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "overview" && renderOverview()}
        {activeTab === "import" && renderImport()}
        {activeTab === "map" && <CategoryMapper onRefresh={refreshData} />}
        {activeTab === "enrich" && (
          <ReviewEnricher
            selectedReviewId={enrichReviewId}
            onRefresh={refreshData}
            onSelectReview={setEnrichReviewId}
          />
        )}
        {activeTab === "publish" && renderPublish()}
      </div>
    </div>
  );
}
