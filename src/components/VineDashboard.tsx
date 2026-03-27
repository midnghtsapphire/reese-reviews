import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, Clock, Zap, Copy, ChevronDown, ChevronUp, Star, Camera, Package, Send, Gift } from "lucide-react";
import {
  getPendingVineReviews,
  getInProgressVineReviews,
  getOverdueVineReviews,
  updateVineReviewStatus,
  generateVineReviewTemplate,
  daysUntilDeadline,
  getVineItems,
} from "@/lib/vineScraperEnhanced";
import type { VineItem } from "@/lib/businessTypes";
import {
  getOrCreateDraft,
  getTodaySubmittedCount,
  getTodaySubmittedIds,
  markDraftReceived,
  markDraftSubmitted,
  unsubmitDraft,
  saveDraftText,
  editDraftText,
  setDraftRating,
  addDraftPhoto,
  removeDraftPhoto,
  formatForVineClipboard,
  VINE_DAILY_GOAL,
  type VineReviewDraft,
} from "@/lib/vineReviewDraftStore";
import { generateVineReview } from "@/lib/vineReviewGenerator";
import {
  addCapitalContribution,
  hasContribution,
  isEligibleForCapitalContribution,
  monthsHeld,
} from "@/lib/capitalContributionStore";

export function VineDashboard() {
  const [selectedItem, setSelectedItem] = useState<VineItem | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingReviews, setPendingReviews] = useState<VineItem[]>([]);
  const [inProgressReviews, setInProgressReviews] = useState<VineItem[]>([]);
  const [overdueReviews, setOverdueReviews] = useState<VineItem[]>([]);
  const [allItems, setAllItems] = useState<VineItem[]>([]);

  // Queue-specific state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, VineReviewDraft>>({});
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [todayCount, setTodayCount] = useState(0);
  const [donatedIds, setDonatedIds] = useState<Set<string>>(new Set());
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkReceiveCount, setBulkReceiveCount] = useState(0);
  const [bulkGenCount, setBulkGenCount] = useState(0);

  useEffect(() => {
    loadVineData();
  }, []);

  const loadVineData = async () => {
    try {
      setLoading(true);
      const [pending, inProgress, overdue, all] = await Promise.all([
        getPendingVineReviews(),
        getInProgressVineReviews(),
        getOverdueVineReviews(),
        getVineItems(),
      ]);
      setPendingReviews(pending);
      setInProgressReviews(inProgress);
      setOverdueReviews(overdue);
      setAllItems(all);

      // Load draft state for all items
      const draftMap: Record<string, VineReviewDraft> = {};
      for (const item of all) {
        draftMap[item.id] = getOrCreateDraft(item.id);
      }
      setDrafts(draftMap);
      setTodayCount(getTodaySubmittedCount());
    } catch (error) {
      console.error("Error loading Vine data:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshDraft = (itemId: string) => {
    setDrafts((prev) => ({ ...prev, [itemId]: getOrCreateDraft(itemId) }));
    setTodayCount(getTodaySubmittedCount());
  };

  const handleCopyTemplate = (item: VineItem) => {
    const template = generateVineReviewTemplate(item);
    navigator.clipboard.writeText(template);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const handleMarkCompleted = async (itemId: string) => {
    await updateVineReviewStatus(itemId, "submitted");
    await loadVineData();
  };

  // ─── QUEUE HANDLERS ──────────────────────────────────────

  const handleMarkReceived = (itemId: string) => {
    markDraftReceived(itemId);
    refreshDraft(itemId);
  };

  const handleGenerate = (item: VineItem) => {
    setGeneratingId(item.id);
    setTimeout(() => {
      const { title, body, suggestedRating } = generateVineReview(item);
      saveDraftText(item.id, title, body);
      setDraftRating(item.id, suggestedRating);
      refreshDraft(item.id);
      setGeneratingId(null);
    }, 400);
  };

  const handleTitleChange = (itemId: string, title: string) => {
    const draft = drafts[itemId];
    if (!draft) return;
    editDraftText(itemId, title, draft.body);
    refreshDraft(itemId);
  };

  const handleBodyChange = (itemId: string, body: string) => {
    const draft = drafts[itemId];
    if (!draft) return;
    editDraftText(itemId, draft.title, body);
    refreshDraft(itemId);
  };

  const handleSetRating = (itemId: string, rating: number) => {
    setDraftRating(itemId, rating);
    refreshDraft(itemId);
  };

  const handleAddPhoto = (itemId: string) => {
    addDraftPhoto(itemId);
    refreshDraft(itemId);
  };

  const handleRemovePhoto = (itemId: string) => {
    removeDraftPhoto(itemId);
    refreshDraft(itemId);
  };

  const handleCopyForVine = (item: VineItem) => {
    const draft = drafts[item.id];
    if (!draft) return;
    const { title, body } = formatForVineClipboard(draft, item.product_name);
    const combined = `TITLE:\n${title}\n\nREVIEW:\n${body}`;
    navigator.clipboard.writeText(combined);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleMarkSubmitted = async (item: VineItem) => {
    markDraftSubmitted(item.id);
    await updateVineReviewStatus(item.id, "submitted");
    setExpandedId(null);
    await loadVineData();
  };

  const handleUnsubmit = async (item: VineItem) => {
    unsubmitDraft(item.id);
    await updateVineReviewStatus(item.id, "in_progress");
    await loadVineData();
  };

  const handleDonateAsCapital = (item: VineItem) => {
    if (hasContribution(item.id)) return;
    addCapitalContribution({
      vineItemId: item.id,
      asin: item.asin,
      productName: item.product_name,
      etv: item.estimated_value,
      dateReceived: item.received_date,
    });
    setDonatedIds((prev) => new Set([...prev, item.id]));
  };

  const refreshAllDrafts = () => {
    const draftMap: Record<string, VineReviewDraft> = {};
    for (const item of allItems) {
      draftMap[item.id] = getOrCreateDraft(item.id);
    }
    setDrafts(draftMap);
    setTodayCount(getTodaySubmittedCount());
  };

  const handleReceiveAll = () => {
    const unReceived = allItems.filter((item) => {
      const d = getOrCreateDraft(item.id);
      return !d.isReceived;
    });
    unReceived.forEach((item) => markDraftReceived(item.id));
    setBulkReceiveCount(unReceived.length);
    refreshAllDrafts();
    setTimeout(() => setBulkReceiveCount(0), 3000);
  };

  const handleGenerateAll = () => {
    setBulkGenerating(true);
    const needsGen = allItems.filter((item) => {
      const d = getOrCreateDraft(item.id);
      return d.isReceived && !d.title && !d.body;
    });
    needsGen.forEach((item) => {
      const { title, body, suggestedRating } = generateVineReview(item);
      saveDraftText(item.id, title, body);
      setDraftRating(item.id, suggestedRating);
    });
    setBulkGenCount(needsGen.length);
    refreshAllDrafts();
    setBulkGenerating(false);
    setTimeout(() => setBulkGenCount(0), 3000);
  };

  const handleReceiveAndGenerateAll = () => {
    setBulkGenerating(true);
    let receivedCount = 0;
    let generatedCount = 0;
    allItems.forEach((item) => {
      const d = getOrCreateDraft(item.id);
      if (!d.isReceived) {
        markDraftReceived(item.id);
        receivedCount++;
      }
      const afterReceive = getOrCreateDraft(item.id);
      if (!afterReceive.title && !afterReceive.body) {
        const { title, body, suggestedRating } = generateVineReview(item);
        saveDraftText(item.id, title, body);
        setDraftRating(item.id, suggestedRating);
        generatedCount++;
      }
    });
    setBulkReceiveCount(receivedCount);
    setBulkGenCount(generatedCount);
    refreshAllDrafts();
    setBulkGenerating(false);
    setTimeout(() => { setBulkReceiveCount(0); setBulkGenCount(0); }, 3500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Vine items...</p>
        </div>
      </div>
    );
  }

  const VineItemCard = ({ item }: { item: VineItem }) => {
    const daysLeft = daysUntilDeadline(item.review_deadline);
    const isUrgent = daysLeft < 7;
    const isOverdue = daysLeft < 0;

    return (
      <div className="p-4 border rounded-lg hover:bg-gray-50 transition">
        <div className="flex gap-4">
          <img src={item.image_url} alt={item.product_name} className="w-20 h-20 object-cover rounded" />
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold">{item.product_name}</h3>
                <p className="text-sm text-gray-600">{item.asin}</p>
              </div>
              <Badge
                variant={
                  isOverdue ? "destructive" : isUrgent ? "secondary" : item.review_status === "submitted" ? "default" : "outline"
                }
              >
                {isOverdue ? "OVERDUE" : isUrgent ? `${daysLeft} days left` : item.review_status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div>
                <p className="text-gray-600">ETV Value</p>
                <p className="font-semibold">${item.estimated_value.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">Deadline</p>
                <p className="font-semibold">{new Date(item.review_deadline).toLocaleDateString()}</p>
              </div>
            </div>

            {item.review_status === "pending" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    handleCopyTemplate(item);
                    setSelectedItem(item);
                  }}
                >
                  <Zap className="mr-1 h-4 w-4" />
                  Generate Template
                </Button>
                <Button size="sm" onClick={() => handleMarkCompleted(item.id)}>
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Mark Completed
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Amazon Vine Dashboard</h2>
        <p className="text-gray-600">Track your Vine reviews and deadlines</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{allItems.length}</div>
            <p className="text-xs text-gray-500 mt-1">Vine items received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Reviews</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-blue-600">{pendingReviews.length}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting your review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-yellow-600">{inProgressReviews.length}</div>
            <p className="text-xs text-gray-500 mt-1">Being reviewed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Overdue</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className={`text-2xl font-bold ${overdueReviews.length > 0 ? "text-red-600" : "text-green-600"}`}>
              {overdueReviews.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Past deadline</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {overdueReviews.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {overdueReviews.length} item{overdueReviews.length !== 1 ? "s" : ""} past deadline. Complete reviews ASAP to maintain Vine eligibility.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="queue" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="queue">📋 Queue</TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pendingReviews.length})
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            In Progress ({inProgressReviews.length})
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Overdue ({overdueReviews.length})
          </TabsTrigger>
        </TabsList>

        {/* ── QUEUE TAB ──────────────────────────────────────── */}
        <TabsContent value="queue" className="space-y-4 mt-4">
          {/* Daily progress */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-white">Today's Vine Reviews</p>
                <p className="text-xs text-gray-400">
                  {todayCount} of {VINE_DAILY_GOAL} completed today
                  {todayCount >= VINE_DAILY_GOAL ? " 🎉 Goal reached!" : ` · ${VINE_DAILY_GOAL - todayCount} remaining`}
                </p>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-bold ${todayCount >= VINE_DAILY_GOAL ? "text-green-400" : "text-white"}`}>
                  {todayCount}/{VINE_DAILY_GOAL}
                </span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${todayCount >= VINE_DAILY_GOAL ? "bg-green-500" : "bg-purple-500"}`}
                style={{ width: `${Math.min(100, (todayCount / VINE_DAILY_GOAL) * 100)}%` }}
              />
            </div>
          </div>

          {/* ── BULK ACTIONS TOOLBAR ──────────────────────── */}
          {allItems.length > 0 && (
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs font-semibold text-purple-300">⚡ Bulk Actions</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {allItems.filter((i) => { const d = getOrCreateDraft(i.id); return !d.isReceived; }).length} unReceived ·{" "}
                    {allItems.filter((i) => { const d = getOrCreateDraft(i.id); return d.isReceived && !d.title; }).length} need auto-gen
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleReceiveAll}
                    disabled={bulkGenerating}
                    className="text-xs border-blue-500/40 text-blue-300 hover:bg-blue-500/10"
                  >
                    <Package className="h-3.5 w-3.5 mr-1" />
                    {bulkReceiveCount > 0 ? `Marked ${bulkReceiveCount} received ✓` : "Receive All"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateAll}
                    disabled={bulkGenerating}
                    className="text-xs border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
                  >
                    <Zap className="h-3.5 w-3.5 mr-1" />
                    {bulkGenerating ? "Generating..." : bulkGenCount > 0 ? `Generated ${bulkGenCount} reviews ✓` : "Auto-Generate All"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleReceiveAndGenerateAll}
                    disabled={bulkGenerating}
                    className="text-xs bg-purple-600 hover:bg-purple-700 text-white"
                    title="Marks all items as received AND generates review text for any missing drafts in one click"
                  >
                    <Zap className="h-3.5 w-3.5 mr-1" />
                    {bulkGenerating
                      ? "Running..."
                      : bulkReceiveCount > 0 || bulkGenCount > 0
                      ? `Done — ${bulkReceiveCount} received, ${bulkGenCount} generated ✓`
                      : "One-Click: Receive & Generate All"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Sorted item list */}
          {allItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No Vine items yet. Sync your Vine dashboard to import items.</p>
            </div>
          ) : (
            (() => {
              // Sort: overdue first (most overdue first), then by deadline asc, submitted today at bottom
              const todayIds = new Set(getTodaySubmittedIds());
              const sorted = [...allItems].sort((a, b) => {
                const aSubmittedToday = todayIds.has(a.id);
                const bSubmittedToday = todayIds.has(b.id);
                if (aSubmittedToday !== bSubmittedToday) return aSubmittedToday ? 1 : -1;
                return daysUntilDeadline(a.review_deadline) - daysUntilDeadline(b.review_deadline);
              });

              return (
                <div className="space-y-2">
                  {sorted.map((item) => {
                    const draft = drafts[item.id] ?? getOrCreateDraft(item.id);
                    const daysLeft = daysUntilDeadline(item.review_deadline);
                    const isOverdue = daysLeft < 0;
                    const isUrgent = daysLeft >= 0 && daysLeft < 7;
                    const isExpanded = expandedId === item.id;
                    const isGenerating = generatingId === item.id;
                    const isSubmittedToday = todayIds.has(item.id);
                    const hasDraft = draft.title.length > 0 || draft.body.length > 0;

                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border overflow-hidden transition ${
                          isSubmittedToday
                            ? "border-green-500/20 bg-green-500/5"
                            : isOverdue
                            ? "border-red-500/30 bg-red-500/5"
                            : isUrgent
                            ? "border-amber-500/30 bg-amber-500/5"
                            : "border-white/10 bg-white/5"
                        }`}
                      >
                        {/* Collapsed row */}
                        <button
                          className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition"
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        >
                          <img
                            src={item.image_url}
                            alt={item.product_name}
                            className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{item.product_name}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-xs text-gray-500">{item.asin}</span>
                              <span className="text-xs text-gray-400">${item.estimated_value.toFixed(2)} ETV</span>
                              {draft.isReceived ? (
                                <Badge className="text-[10px] bg-blue-500/20 text-blue-300 border-blue-500/30 border">received</Badge>
                              ) : (
                                <Badge className="text-[10px] bg-gray-500/20 text-gray-400 border-gray-500/30 border">not received</Badge>
                              )}
                              {hasDraft && (
                                <Badge className="text-[10px] bg-purple-500/20 text-purple-300 border-purple-500/30 border">draft</Badge>
                              )}
                              {isSubmittedToday && (
                                <Badge className="text-[10px] bg-green-500/20 text-green-300 border-green-500/30 border">✓ submitted today</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right mr-1">
                            <span className={`text-xs font-semibold ${isOverdue ? "text-red-400" : isUrgent ? "text-amber-400" : "text-gray-400"}`}>
                              {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          )}
                        </button>

                        {/* Expanded editor */}
                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
                            {/* Received toggle */}
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleMarkReceived(item.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                                  draft.isReceived
                                    ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                                }`}
                              >
                                <Package className="h-3.5 w-3.5" />
                                {draft.isReceived ? "Item Received ✓" : "Mark as Received"}
                              </button>
                              {!draft.isReceived && (
                                <p className="text-xs text-gray-500">Mark received before generating review</p>
                              )}
                            </div>

                            {/* Stars */}
                            <div className="space-y-1">
                              <p className="text-xs text-gray-400">Star Rating</p>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    onClick={() => handleSetRating(item.id, star)}
                                    className="p-0.5 transition hover:scale-110"
                                  >
                                    <Star
                                      className={`h-6 w-6 ${
                                        star <= draft.rating
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "fill-transparent text-gray-600"
                                      }`}
                                    />
                                  </button>
                                ))}
                                {draft.rating > 0 && (
                                  <span className="text-xs text-gray-400 ml-2">{draft.rating} star{draft.rating !== 1 ? "s" : ""}</span>
                                )}
                              </div>
                            </div>

                            {/* Title */}
                            <div className="space-y-1">
                              <p className="text-xs text-gray-400">Review Title</p>
                              <input
                                type="text"
                                value={draft.title}
                                onChange={(e) => handleTitleChange(item.id, e.target.value)}
                                placeholder="Review title..."
                                className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 placeholder:text-gray-600 focus:outline-none focus:border-white/20"
                              />
                            </div>

                            {/* Body */}
                            <div className="space-y-1">
                              <p className="text-xs text-gray-400">Review Text</p>
                              <Textarea
                                value={draft.body}
                                onChange={(e) => handleBodyChange(item.id, e.target.value)}
                                placeholder="Write your review..."
                                className="min-h-[100px] bg-white/5 border-white/10 text-gray-200 text-xs placeholder:text-gray-600 resize-none"
                              />
                            </div>

                            {/* Photo counter */}
                            <div className="flex items-center gap-3">
                              <p className="text-xs text-gray-400 flex items-center gap-1">
                                <Camera className="h-3.5 w-3.5" />
                                Photos ({draft.photoCount}/8)
                              </p>
                              <button
                                onClick={() => handleRemovePhoto(item.id)}
                                disabled={draft.photoCount === 0}
                                className="h-6 w-6 rounded bg-white/5 border border-white/10 text-gray-300 text-sm disabled:opacity-30 hover:bg-white/10"
                              >
                                –
                              </button>
                              <div className="flex gap-1">
                                {Array.from({ length: 8 }).map((_, i) => (
                                  <div
                                    key={i}
                                    className={`h-3 w-3 rounded-sm ${i < draft.photoCount ? "bg-purple-400" : "bg-white/10"}`}
                                  />
                                ))}
                              </div>
                              <button
                                onClick={() => handleAddPhoto(item.id)}
                                disabled={draft.photoCount === 8}
                                className="h-6 w-6 rounded bg-white/5 border border-white/10 text-gray-300 text-sm disabled:opacity-30 hover:bg-white/10"
                              >
                                +
                              </button>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 flex-wrap pt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleGenerate(item)}
                                disabled={isGenerating || !draft.isReceived}
                                className="text-xs border-white/20 text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-50"
                                title={!draft.isReceived ? "Mark as received first" : "Auto-generate review text"}
                              >
                                {isGenerating ? (
                                  <>
                                    <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full mr-1" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Zap className="h-3.5 w-3.5 mr-1" />
                                    Auto-Generate
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopyForVine(item)}
                                disabled={!hasDraft}
                                className="text-xs border-purple-500/40 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200 disabled:opacity-40"
                              >
                                <Copy className="h-3.5 w-3.5 mr-1" />
                                {copiedId === item.id ? "Copied!" : "Copy for Vine"}
                              </Button>
                              {isSubmittedToday ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleUnsubmit(item)}
                                  className="text-xs text-gray-500 hover:text-white"
                                >
                                  Undo Submit
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handleMarkSubmitted(item)}
                                  className="text-xs bg-green-600 hover:bg-green-700 text-white ml-auto"
                                >
                                  <Send className="h-3.5 w-3.5 mr-1" />
                                  Mark Submitted
                                </Button>
                              )}
                              {/* Donate to NoCo Nook — only show for 6+ month items */}
                              {isEligibleForCapitalContribution(item.received_date) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDonateAsCapital(item)}
                                  disabled={donatedIds.has(item.id) || hasContribution(item.id)}
                                  className="text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/10 disabled:opacity-40"
                                  title={`Held ${monthsHeld(item.received_date)} months — eligible to donate as capital to NoCo Nook`}
                                >
                                  <Gift className="h-3.5 w-3.5 mr-1" />
                                  {donatedIds.has(item.id) || hasContribution(item.id)
                                    ? "Donated to NoCo Nook ✓"
                                    : `Donate to NoCo Nook (${monthsHeld(item.received_date)}mo held)`}
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}
        </TabsContent>

        {/* Pending Tab */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Reviews</CardTitle>
              <CardDescription>Items waiting for your review</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingReviews.length > 0 ? (
                pendingReviews.map((item) => <VineItemCard key={item.id} item={item} />)
              ) : (
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>No pending reviews! Great work!</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* In Progress Tab */}
        <TabsContent value="in-progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>In Progress</CardTitle>
              <CardDescription>Items you're currently reviewing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {inProgressReviews.length > 0 ? (
                inProgressReviews.map((item) => <VineItemCard key={item.id} item={item} />)
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No items in progress</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overdue Tab */}
        <TabsContent value="overdue" className="space-y-4">
          {overdueReviews.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                These items are past their review deadline. Complete them immediately to avoid Vine suspension.
              </AlertDescription>
            </Alert>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Overdue Reviews</CardTitle>
              <CardDescription>Items past their deadline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {overdueReviews.length > 0 ? (
                overdueReviews.map((item) => <VineItemCard key={item.id} item={item} />)
              ) : (
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>No overdue items!</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Template */}
      {selectedItem && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Review Template: {selectedItem.product_name}</span>
              <Button
                size="sm"
                onClick={() => handleCopyTemplate(selectedItem)}
                variant={copiedTemplate ? "default" : "outline"}
              >
                <Copy className="mr-1 h-4 w-4" />
                {copiedTemplate ? "Copied!" : "Copy Template"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              readOnly
              value={generateVineReviewTemplate(selectedItem)}
              className="w-full h-64 p-3 border rounded-lg font-mono text-sm bg-white"
            />
            <p className="text-xs text-gray-600 mt-2">
              This template is copied to your clipboard. Paste it into Amazon Vine and customize with your experience.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tax Info */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>💰 Tax Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>ETV (Estimated Tax Value)</strong> is reported to the IRS on Form 1099-NEC as miscellaneous income. Each Vine item's ETV is automatically tracked in the Tax Dashboard.
          </p>
          <p>
            <strong>Completed reviews</strong> count toward your Vine eligibility. Missing deadlines can result in suspension.
          </p>
          <p>
            <strong>Items not reviewed</strong> after 6 months can be donated to your rental company as a capital contribution (tax deductible).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
