// ============================================================
// REVIEW ENRICHER — UI COMPONENT
// Enhance reviews before publishing: edit title/body, add
// images, affiliate links, extract pros/cons, choose avatar,
// and preview the final review card.
// ============================================================

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Sparkles,
  Star,
  Image as ImageIcon,
  Link2,
  ThumbsUp,
  ThumbsDown,
  User,
  Eye,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Zap,
  X,
} from "lucide-react";
import {
  getPipelineReviews,
  enrichReview,
  markEnriched,
  extractProsAndCons,
  generateExcerpt,
  generateVerdict,
  type PipelineReview,
  type EnrichmentData,
} from "@/lib/reviewPipeline";
import { buildAffiliateLink, DEFAULT_AFFILIATE_TAG } from "@/lib/amazonReviewStore";
import { SITE_CATEGORIES, type SiteCategory } from "@/lib/categoryRules";

// ─── PROPS ──────────────────────────────────────────────────

interface ReviewEnricherProps {
  selectedReviewId?: string | null;
  onRefresh?: () => void;
  onSelectReview?: (id: string | null) => void;
}

// ─── COMPONENT ──────────────────────────────────────────────

export function ReviewEnricher({ selectedReviewId, onRefresh, onSelectReview }: ReviewEnricherProps) {
  const [reviews, setReviews] = useState<PipelineReview[]>([]);
  const [editingId, setEditingId] = useState<string | null>(selectedReviewId ?? null);
  const [showPreview, setShowPreview] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editRating, setEditRating] = useState(5);
  const [editPros, setEditPros] = useState<string[]>([]);
  const [editCons, setEditCons] = useState<string[]>([]);
  const [editExcerpt, setEditExcerpt] = useState("");
  const [editVerdict, setEditVerdict] = useState("");
  const [editAffiliateLink, setEditAffiliateLink] = useState("");
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editReviewerName, setEditReviewerName] = useState("Reese");
  const [editReviewerAvatar, setEditReviewerAvatar] = useState<"reese" | "revvel">("reese");
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newPro, setNewPro] = useState("");
  const [newCon, setNewCon] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedReviewId && selectedReviewId !== editingId) {
      setEditingId(selectedReviewId);
      const review = getPipelineReviews().find((r) => r.id === selectedReviewId);
      if (review) loadReviewIntoForm(review);
    }
  }, [selectedReviewId]);

  const loadData = () => {
    const all = getPipelineReviews();
    setReviews(all);

    // If we have an editing ID, load it
    if (editingId) {
      const review = all.find((r) => r.id === editingId);
      if (review) loadReviewIntoForm(review);
    }
  };

  const loadReviewIntoForm = (review: PipelineReview) => {
    setEditTitle(review.title);
    setEditBody(review.body);
    setEditRating(review.rating);
    setEditPros([...review.pros]);
    setEditCons([...review.cons]);
    setEditExcerpt(review.excerpt);
    setEditVerdict(review.verdict);
    setEditAffiliateLink(review.affiliateLink);
    setEditImages([...review.images]);
    setEditReviewerName(review.reviewerName);
    setEditReviewerAvatar(review.reviewerAvatar);
    setEditIsFeatured(review.isFeatured);
  };

  const enrichableReviews = useMemo(() => {
    return reviews.filter((r) => r.status !== "published" && r.status !== "live");
  }, [reviews]);

  const currentReview = useMemo(() => {
    return reviews.find((r) => r.id === editingId) ?? null;
  }, [reviews, editingId]);

  // ─── HANDLERS ──────────────────────────────────────────

  const handleSelectReview = (id: string) => {
    setEditingId(id);
    setShowPreview(false);
    const review = reviews.find((r) => r.id === id);
    if (review) loadReviewIntoForm(review);
    onSelectReview?.(id);
  };

  const handleSave = () => {
    if (!editingId) return;

    const data: EnrichmentData = {
      title: editTitle,
      body: editBody,
      rating: editRating,
      pros: editPros,
      cons: editCons,
      excerpt: editExcerpt,
      verdict: editVerdict,
      affiliateLink: editAffiliateLink,
      images: editImages,
      reviewerName: editReviewerName,
      reviewerAvatar: editReviewerAvatar,
      isFeatured: editIsFeatured,
    };

    enrichReview(editingId, data);
    loadData();
    onRefresh?.();
    showMsg("success", "Review enriched and saved");
  };

  const handleMarkReady = () => {
    if (!editingId) return;
    handleSave();
    markEnriched(editingId);
    loadData();
    onRefresh?.();
    showMsg("success", "Review marked as enriched and ready to publish");
  };

  const handleAutoExtractPros = () => {
    const { pros, cons } = extractProsAndCons(editBody);
    setEditPros(pros);
    setEditCons(cons);
    showMsg("success", `Extracted ${pros.length} pros and ${cons.length} cons`);
  };

  const handleAutoExcerpt = () => {
    setEditExcerpt(generateExcerpt(editBody));
    showMsg("success", "Excerpt generated from review body");
  };

  const handleAutoVerdict = () => {
    setEditVerdict(generateVerdict(editBody, editRating));
    showMsg("success", "Verdict generated from review");
  };

  const handleGenerateAffiliateLink = () => {
    if (!currentReview) return;
    const link = buildAffiliateLink(currentReview.asin);
    setEditAffiliateLink(link);
    showMsg("success", "Affiliate link generated with meetaudreyeva-20 tag");
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setEditImages([...editImages, newImageUrl.trim()]);
    setNewImageUrl("");
  };

  const handleRemoveImage = (idx: number) => {
    setEditImages(editImages.filter((_, i) => i !== idx));
  };

  const handleAddPro = () => {
    if (!newPro.trim()) return;
    setEditPros([...editPros, newPro.trim()]);
    setNewPro("");
  };

  const handleRemovePro = (idx: number) => {
    setEditPros(editPros.filter((_, i) => i !== idx));
  };

  const handleAddCon = () => {
    if (!newCon.trim()) return;
    setEditCons([...editCons, newCon.trim()]);
    setNewCon("");
  };

  const handleRemoveCon = (idx: number) => {
    setEditCons(editCons.filter((_, i) => i !== idx));
  };

  // Navigate between reviews
  const handleNavigate = (direction: "prev" | "next") => {
    const idx = enrichableReviews.findIndex((r) => r.id === editingId);
    if (idx === -1) return;
    const newIdx = direction === "prev" ? idx - 1 : idx + 1;
    if (newIdx >= 0 && newIdx < enrichableReviews.length) {
      handleSelectReview(enrichableReviews[newIdx].id);
    }
  };

  const showMsg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const getCategoryMeta = (cat: SiteCategory) => {
    return SITE_CATEGORIES.find((c) => c.value === cat);
  };

  // ─── STAR RATING COMPONENT ─────────────────────────────

  const StarRating = ({ rating, onChange }: { rating: number; onChange: (r: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star)}
          className={`text-xl transition-colors ${
            star <= rating ? "text-yellow-400" : "text-gray-600"
          } hover:text-yellow-300`}
        >
          ★
        </button>
      ))}
    </div>
  );

  // ─── PREVIEW CARD ──────────────────────────────────────

  const PreviewCard = () => {
    if (!currentReview) return null;
    const catMeta = getCategoryMeta(currentReview.assignedCategory);

    return (
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10 overflow-hidden">
        {/* Image */}
        {editImages.length > 0 && (
          <div className="h-48 bg-gradient-to-br from-purple-900/50 to-slate-800 flex items-center justify-center overflow-hidden">
            <img
              src={editImages[0]}
              alt={editTitle}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}

        <div className="p-5">
          {/* Category & Rating */}
          <div className="flex items-center justify-between mb-3">
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
              {catMeta?.icon} {catMeta?.label}
            </Badge>
            <div className="flex items-center gap-1">
              <span className="text-yellow-400 text-sm">{"★".repeat(editRating)}</span>
              <span className="text-gray-600 text-sm">{"★".repeat(5 - editRating)}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-white mb-2">{editTitle}</h3>

          {/* Excerpt */}
          <p className="text-sm text-gray-400 mb-4 line-clamp-3">{editExcerpt}</p>

          {/* Pros & Cons */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-xs font-semibold text-green-400 mb-1 flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" /> Pros
              </p>
              {editPros.slice(0, 3).map((pro, i) => (
                <p key={i} className="text-xs text-gray-400 truncate">+ {pro}</p>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-red-400 mb-1 flex items-center gap-1">
                <ThumbsDown className="h-3 w-3" /> Cons
              </p>
              {editCons.slice(0, 3).map((con, i) => (
                <p key={i} className="text-xs text-gray-400 truncate">- {con}</p>
              ))}
            </div>
          </div>

          {/* Verdict */}
          <div className="bg-white/5 rounded-lg p-3 mb-4">
            <p className="text-xs font-semibold text-purple-300 mb-1">Verdict</p>
            <p className="text-sm text-gray-300">{editVerdict}</p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                editReviewerAvatar === "reese"
                  ? "bg-purple-500/30 text-purple-300"
                  : "bg-blue-500/30 text-blue-300"
              }`}>
                {editReviewerAvatar === "reese" ? "R" : "V"}
              </div>
              <span className="text-xs text-gray-400">by {editReviewerName}</span>
            </div>
            {editIsFeatured && (
              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-[10px]">
                Featured
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ─── RENDER ────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-400" />
          Review Enricher
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          Enhance reviews with images, affiliate links, pros/cons, and more before publishing.
        </p>
      </div>

      {/* Message */}
      {message && (
        <Alert className={message.type === "success" ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10"}>
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-green-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-400" />
          )}
          <AlertDescription className={message.type === "success" ? "text-green-300" : "text-red-300"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Review Selector */}
      {!selectedReviewId && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Select a Review to Enrich ({enrichableReviews.length} available)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {enrichableReviews.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  No reviews to enrich. Import reviews first.
                </p>
              ) : (
                enrichableReviews.map((review) => (
                  <button
                    key={review.id}
                    onClick={() => handleSelectReview(review.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all flex items-center gap-3 ${
                      editingId === review.id
                        ? "bg-purple-500/10 border border-purple-500/30"
                        : "bg-white/5 hover:bg-white/10 border border-transparent"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{review.productName}</p>
                      <p className="text-xs text-gray-500 truncate">{review.title}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        review.status === "enriched"
                          ? "border-green-500/30 text-green-400"
                          : review.status === "mapped"
                          ? "border-blue-500/30 text-blue-400"
                          : "border-gray-500/30 text-gray-400"
                      }`}
                    >
                      {review.status}
                    </Badge>
                    <span className="text-yellow-400 text-xs">{"★".repeat(review.rating)}</span>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editor */}
      {currentReview && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Edit Form */}
          <div className="space-y-4">
            {/* Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavigate("prev")}
                  disabled={enrichableReviews.findIndex((r) => r.id === editingId) <= 0}
                  className="text-gray-400 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-gray-500">
                  {enrichableReviews.findIndex((r) => r.id === editingId) + 1} / {enrichableReviews.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavigate("next")}
                  disabled={enrichableReviews.findIndex((r) => r.id === editingId) >= enrichableReviews.length - 1}
                  className="text-gray-400 hover:text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="border-white/20 text-gray-300 hover:text-white hover:bg-white/10 lg:hidden"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {showPreview ? "Edit" : "Preview"}
                </Button>
              </div>
            </div>

            {/* Product Info (read-only) */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300 text-lg">
                    {getCategoryMeta(currentReview.assignedCategory)?.icon ?? "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{currentReview.productName}</p>
                    <p className="text-xs text-gray-500">ASIN: {currentReview.asin} · {currentReview.date}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      currentReview.status === "enriched"
                        ? "border-green-500/30 text-green-400"
                        : "border-blue-500/30 text-blue-400"
                    }`}
                  >
                    {currentReview.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Title & Rating */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400">Review Title</Label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400">Rating</Label>
                  <StarRating rating={editRating} onChange={setEditRating} />
                </div>
              </CardContent>
            </Card>

            {/* Body */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400">Review Body</Label>
                  <Textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={6}
                    className="bg-white/5 border-white/10 text-white text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAutoExcerpt}
                    className="text-xs border-white/20 text-gray-300 hover:text-white hover:bg-white/10"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Auto-Excerpt
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAutoVerdict}
                    className="text-xs border-white/20 text-gray-300 hover:text-white hover:bg-white/10"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Auto-Verdict
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAutoExtractPros}
                    className="text-xs border-white/20 text-gray-300 hover:text-white hover:bg-white/10"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Extract Pros/Cons
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Excerpt & Verdict */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400">Excerpt (shown in review cards)</Label>
                  <Textarea
                    value={editExcerpt}
                    onChange={(e) => setEditExcerpt(e.target.value)}
                    rows={2}
                    className="bg-white/5 border-white/10 text-white text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400">Verdict</Label>
                  <Textarea
                    value={editVerdict}
                    onChange={(e) => setEditVerdict(e.target.value)}
                    rows={2}
                    className="bg-white/5 border-white/10 text-white text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pros & Cons */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 space-y-4">
                {/* Pros */}
                <div className="space-y-2">
                  <Label className="text-xs text-green-400 flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" /> Pros
                  </Label>
                  {editPros.map((pro, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-green-400 text-xs">+</span>
                      <Input
                        value={pro}
                        onChange={(e) => {
                          const updated = [...editPros];
                          updated[i] = e.target.value;
                          setEditPros(updated);
                        }}
                        className="flex-1 bg-white/5 border-white/10 text-white text-sm h-8"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePro(i)}
                        className="h-8 w-8 p-0 text-gray-500 hover:text-red-400"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <Input
                      value={newPro}
                      onChange={(e) => setNewPro(e.target.value)}
                      placeholder="Add a pro..."
                      onKeyDown={(e) => e.key === "Enter" && handleAddPro()}
                      className="flex-1 bg-white/5 border-white/10 text-white text-sm h-8 placeholder:text-gray-600"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAddPro}
                      disabled={!newPro.trim()}
                      className="h-8 w-8 p-0 text-green-400 hover:text-green-300"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Cons */}
                <div className="space-y-2">
                  <Label className="text-xs text-red-400 flex items-center gap-1">
                    <ThumbsDown className="h-3 w-3" /> Cons
                  </Label>
                  {editCons.map((con, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-red-400 text-xs">-</span>
                      <Input
                        value={con}
                        onChange={(e) => {
                          const updated = [...editCons];
                          updated[i] = e.target.value;
                          setEditCons(updated);
                        }}
                        className="flex-1 bg-white/5 border-white/10 text-white text-sm h-8"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCon(i)}
                        className="h-8 w-8 p-0 text-gray-500 hover:text-red-400"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <Input
                      value={newCon}
                      onChange={(e) => setNewCon(e.target.value)}
                      placeholder="Add a con..."
                      onKeyDown={(e) => e.key === "Enter" && handleAddCon()}
                      className="flex-1 bg-white/5 border-white/10 text-white text-sm h-8 placeholder:text-gray-600"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAddCon}
                      disabled={!newCon.trim()}
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 space-y-3">
                <Label className="text-xs text-gray-400 flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" /> Product Images
                </Label>
                {editImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {editImages.map((url, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={url}
                          alt={`Product ${i + 1}`}
                          className="w-16 h-16 object-cover rounded-lg border border-white/10"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect fill='%23333' width='64' height='64'/%3E%3Ctext fill='%23666' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='10'%3ENo img%3C/text%3E%3C/svg%3E";
                          }}
                        />
                        <button
                          onClick={() => handleRemoveImage(i)}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-2.5 w-2.5 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Paste image URL..."
                    onKeyDown={(e) => e.key === "Enter" && handleAddImage()}
                    className="flex-1 bg-white/5 border-white/10 text-white text-sm h-8 placeholder:text-gray-600"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddImage}
                    disabled={!newImageUrl.trim()}
                    className="h-8 text-xs text-purple-400 hover:text-purple-300"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Affiliate Link */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 space-y-3">
                <Label className="text-xs text-gray-400 flex items-center gap-1">
                  <Link2 className="h-3 w-3" /> Affiliate Link
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={editAffiliateLink}
                    onChange={(e) => setEditAffiliateLink(e.target.value)}
                    placeholder="Amazon affiliate link..."
                    className="flex-1 bg-white/5 border-white/10 text-white text-sm h-8 placeholder:text-gray-600"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateAffiliateLink}
                    className="h-8 text-xs border-white/20 text-gray-300 hover:text-white hover:bg-white/10"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Generate
                  </Button>
                </div>
                <p className="text-[10px] text-gray-600">
                  Tag: {DEFAULT_AFFILIATE_TAG}
                </p>
              </CardContent>
            </Card>

            {/* Reviewer & Featured */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">Reviewer Name</Label>
                    <Input
                      value={editReviewerName}
                      onChange={(e) => setEditReviewerName(e.target.value)}
                      className="bg-white/5 border-white/10 text-white text-sm h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">Avatar</Label>
                    <Select value={editReviewerAvatar} onValueChange={(v) => setEditReviewerAvatar(v as "reese" | "revvel")}>
                      <SelectTrigger className="h-8 bg-white/5 border-white/10 text-gray-300 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reese">Reese</SelectItem>
                        <SelectItem value="revvel">Revvel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsFeatured}
                    onChange={(e) => setEditIsFeatured(e.target.checked)}
                    className="h-4 w-4 accent-purple-500"
                  />
                  <span className="text-sm text-gray-300">Featured Review</span>
                </label>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button
                onClick={handleMarkReady}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark Ready to Publish
              </Button>
            </div>
          </div>

          {/* Right: Preview (desktop) / Toggle (mobile) */}
          <div className={`space-y-4 ${showPreview ? "" : "hidden lg:block"}`}>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Eye className="h-4 w-4 text-purple-400" />
                Live Preview
              </h4>
              <Badge variant="outline" className="text-[10px] border-white/20 text-gray-500">
                As it will appear on site
              </Badge>
            </div>
            <PreviewCard />
          </div>
        </div>
      )}

      {/* Empty State */}
      {!currentReview && enrichableReviews.length === 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-600" />
            <h3 className="text-lg font-bold text-gray-400 mb-2">No Reviews to Enrich</h3>
            <p className="text-sm text-gray-500">
              Import reviews from the pipeline first, then come back here to enrich them before publishing.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
