// ============================================================
// REVIEW GENERATOR
// Generates complete review text, titles, star ratings with
// justification. Supports multiple variants, tone selection,
// and inline editing before finalization.
// ============================================================

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Sparkles,
  Star,
  StarHalf,
  Edit3,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Wand2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  PenLine,
} from "lucide-react";
import {
  getReviewVariants,
  addReviewVariant,
  updateReviewVariant,
  selectReviewVariant,
  deleteReviewVariant,
  generateReviewVariants,
  getProduct,
  getSettings,
} from "@/stores/reviewAutomationStore";
import type {
  ReviewVariant,
  ReviewTone,
  ReviewLength,
  ProductInput,
} from "@/stores/reviewAutomationStore";
import { stripAITextFingerprints } from "@/utils/metadataStripper";

// ─── TYPES ──────────────────────────────────────────────────

interface ReviewGeneratorProps {
  productId: string;
  productName: string;
  onReviewUpdate?: () => void;
}

const TONE_OPTIONS: { value: ReviewTone; label: string; description: string; color: string }[] = [
  { value: "enthusiastic", label: "Enthusiastic", description: "Excited, positive, highly recommending", color: "text-green-400" },
  { value: "balanced", label: "Balanced", description: "Fair, weighing pros and cons equally", color: "text-blue-400" },
  { value: "critical", label: "Critical", description: "Honest, pointing out flaws constructively", color: "text-orange-400" },
  { value: "casual", label: "Casual", description: "Relaxed, conversational, everyday language", color: "text-purple-400" },
  { value: "detailed", label: "Detailed", description: "Thorough, technical, comprehensive analysis", color: "text-cyan-400" },
];

const LENGTH_OPTIONS: { value: ReviewLength; label: string; wordRange: string }[] = [
  { value: "short", label: "Short", wordRange: "50–100 words" },
  { value: "medium", label: "Medium", wordRange: "100–200 words" },
  { value: "long", label: "Long", wordRange: "200–400 words" },
];

// ─── STAR RATING DISPLAY ────────────────────────────────────

function StarRatingDisplay({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" };
  const iconSize = sizeMap[size];

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${iconSize} ${
            star <= rating
              ? "fill-[#FFD93D] text-[#FFD93D]"
              : "fill-transparent text-gray-500"
          }`}
        />
      ))}
    </div>
  );
}

// ─── COMPONENT ──────────────────────────────────────────────

export function ReviewGenerator({
  productId,
  productName,
  onReviewUpdate,
}: ReviewGeneratorProps) {
  const [variants, setVariants] = useState<ReviewVariant[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    body: string;
    rating: number;
    pros: string[];
    cons: string[];
  }>({ title: "", body: "", rating: 5, pros: [], cons: [] });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [genSettings, setGenSettings] = useState({
    count: 3,
    tones: ["enthusiastic", "balanced", "casual"] as ReviewTone[],
  });
  const [newPro, setNewPro] = useState("");
  const [newCon, setNewCon] = useState("");

  const settings = getSettings();

  const refreshVariants = useCallback(() => {
    const updated = getReviewVariants(productId);
    setVariants(updated);
    onReviewUpdate?.();
  }, [productId, onReviewUpdate]);

  useEffect(() => {
    refreshVariants();
  }, [refreshVariants]);

  // ─── GENERATE REVIEWS ──────────────────────────────────

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const product = getProduct(productId);
      if (!product) {
        setIsGenerating(false);
        return;
      }

      // Simulate AI generation delay for realistic UX
      await new Promise((resolve) => setTimeout(resolve, 1500));

      generateReviewVariants(product, genSettings.count, genSettings.tones);
      refreshVariants();
    } catch (error) {
      console.error("Failed to generate reviews:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── SELECT VARIANT ────────────────────────────────────

  const handleSelect = (variantId: string) => {
    selectReviewVariant(productId, variantId);
    refreshVariants();
  };

  // ─── EDIT VARIANT ──────────────────────────────────────

  const startEditing = (variant: ReviewVariant) => {
    setEditingId(variant.id);
    setEditForm({
      title: variant.title,
      body: variant.body,
      rating: variant.rating,
      pros: [...variant.pros],
      cons: [...variant.cons],
    });
  };

  const saveEdit = () => {
    if (!editingId) return;

    updateReviewVariant(editingId, {
      title: stripAITextFingerprints(editForm.title),
      body: stripAITextFingerprints(editForm.body),
      rating: editForm.rating,
      pros: editForm.pros,
      cons: editForm.cons,
      status: "ready",
    });

    setEditingId(null);
    refreshVariants();
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  // ─── COPY TO CLIPBOARD ────────────────────────────────

  const handleCopy = async (variant: ReviewVariant) => {
    const text = `${variant.title}\n\n${variant.body}\n\nPros:\n${variant.pros
      .map((p) => `+ ${p}`)
      .join("\n")}\n\nCons:\n${variant.cons.map((c) => `- ${c}`).join("\n")}`;

    await navigator.clipboard.writeText(text);
    setCopiedId(variant.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ─── DELETE VARIANT ────────────────────────────────────

  const handleDelete = (id: string) => {
    deleteReviewVariant(id);
    refreshVariants();
  };

  // ─── FINALIZE VARIANT ──────────────────────────────────

  const handleFinalize = (id: string) => {
    updateReviewVariant(id, { status: "finalized" });
    handleSelect(id);
    refreshVariants();
  };

  // ─── PROS/CONS EDITING ─────────────────────────────────

  const addPro = () => {
    if (newPro.trim()) {
      setEditForm((prev) => ({ ...prev, pros: [...prev.pros, newPro.trim()] }));
      setNewPro("");
    }
  };

  const removePro = (idx: number) => {
    setEditForm((prev) => ({
      ...prev,
      pros: prev.pros.filter((_, i) => i !== idx),
    }));
  };

  const addCon = () => {
    if (newCon.trim()) {
      setEditForm((prev) => ({ ...prev, cons: [...prev.cons, newCon.trim()] }));
      setNewCon("");
    }
  };

  const removeCon = (idx: number) => {
    setEditForm((prev) => ({
      ...prev,
      cons: prev.cons.filter((_, i) => i !== idx),
    }));
  };

  // ─── TOGGLE TONE ───────────────────────────────────────

  const toggleTone = (tone: ReviewTone) => {
    setGenSettings((prev) => {
      const tones = prev.tones.includes(tone)
        ? prev.tones.filter((t) => t !== tone)
        : [...prev.tones, tone];
      return { ...prev, tones: tones.length > 0 ? tones : [tone] };
    });
  };

  // ─── RENDER ───────────────────────────────────────────

  const selectedVariant = variants.find((v) => v.isSelected);

  return (
    <div className="space-y-6">
      {/* Generation Controls */}
      <Card className="bg-white/5 backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Wand2 className="h-5 w-5 text-[#FFB347]" />
            Generate Review Variants
          </CardTitle>
          <CardDescription className="text-gray-400">
            Create multiple review versions with different tones and styles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Tone Selection */}
          <div>
            <Label className="text-gray-300 mb-3 block">Review Tones</Label>
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS.map((tone) => (
                <Button
                  key={tone.value}
                  size="sm"
                  variant={genSettings.tones.includes(tone.value) ? "default" : "outline"}
                  className={
                    genSettings.tones.includes(tone.value)
                      ? "bg-[#FF6B2B] hover:bg-[#FF6B2B]/80 text-white border-transparent"
                      : "border-white/20 text-gray-300 hover:bg-white/10"
                  }
                  onClick={() => toggleTone(tone.value)}
                >
                  {tone.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {genSettings.tones.map((t) => TONE_OPTIONS.find((o) => o.value === t)?.description).join(" • ")}
            </p>
          </div>

          {/* Variant Count */}
          <div>
            <Label className="text-gray-300 mb-2 block">
              Number of Variants: {genSettings.count}
            </Label>
            <Slider
              value={[genSettings.count]}
              onValueChange={([v]) => setGenSettings((prev) => ({ ...prev, count: v }))}
              min={1}
              max={6}
              step={1}
              className="w-full max-w-xs"
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-gradient-to-r from-[#FF6B2B] to-[#FFB347] text-white font-semibold hover:opacity-90 px-8"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Generating {genSettings.count} variants...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate {genSettings.count} Review{genSettings.count > 1 ? "s" : ""}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Selected Review Summary */}
      {selectedVariant && (
        <Card className="bg-gradient-to-br from-[#FF6B2B]/10 to-[#FFB347]/10 backdrop-blur-md border-[#FF6B2B]/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              Selected Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <StarRatingDisplay rating={selectedVariant.rating} size="lg" />
                <Badge
                  variant="outline"
                  className={
                    selectedVariant.status === "finalized"
                      ? "border-green-500 text-green-400"
                      : "border-[#FFB347] text-[#FFB347]"
                  }
                >
                  {selectedVariant.status === "finalized" ? "Finalized" : "Ready"}
                </Badge>
              </div>
              <h3 className="text-lg font-semibold text-white">
                {selectedVariant.title}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                {selectedVariant.body}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>{selectedVariant.wordCount} words</span>
                <span>•</span>
                <span className="capitalize">{selectedVariant.tone} tone</span>
                <span>•</span>
                <span>{selectedVariant.pros.length} pros, {selectedVariant.cons.length} cons</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Variants List */}
      <Card className="bg-white/5 backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <FileText className="h-5 w-5 text-[#FFD93D]" />
            Review Variants
            <Badge variant="outline" className="ml-2 border-white/20 text-gray-300">
              {variants.length}
            </Badge>
          </CardTitle>
          <CardDescription className="text-gray-400">
            Choose, edit, and finalize the best review for submission
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {variants.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No review variants yet</p>
              <p className="text-gray-500 text-sm mt-1">
                Generate variants using the controls above
              </p>
            </div>
          ) : (
            variants.map((variant) => (
              <div
                key={variant.id}
                className={`rounded-lg border transition-all ${
                  variant.isSelected
                    ? "border-[#FF6B2B]/50 bg-[#FF6B2B]/5"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                {/* Variant Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <StarRatingDisplay rating={variant.rating} size="sm" />
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            TONE_OPTIONS.find((t) => t.value === variant.tone)?.color ?? "text-gray-400"
                          } border-current/30`}
                        >
                          {variant.tone}
                        </Badge>
                        <Badge variant="outline" className="text-xs text-gray-400 border-white/10">
                          {variant.wordCount}w
                        </Badge>
                        {variant.isSelected && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                            Selected
                          </Badge>
                        )}
                        {variant.status === "finalized" && (
                          <Badge className="bg-[#FFD93D]/20 text-[#FFD93D] border-[#FFD93D]/30 text-xs">
                            Finalized
                          </Badge>
                        )}
                      </div>

                      {editingId === variant.id ? (
                        /* ─── EDIT MODE ─── */
                        <div className="space-y-4">
                          <div>
                            <Label className="text-gray-300 text-xs mb-1 block">Title</Label>
                            <Input
                              value={editForm.title}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  title: e.target.value,
                                }))
                              }
                              className="bg-white/10 border-white/20 text-white"
                            />
                          </div>

                          <div>
                            <Label className="text-gray-300 text-xs mb-1 block">Review Body</Label>
                            <Textarea
                              value={editForm.body}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  body: e.target.value,
                                }))
                              }
                              rows={6}
                              className="bg-white/10 border-white/20 text-white resize-y"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {editForm.body.split(/\s+/).filter(Boolean).length} words
                            </p>
                          </div>

                          <div>
                            <Label className="text-gray-300 text-xs mb-1 block">
                              Rating: {editForm.rating} / 5
                            </Label>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      rating: star,
                                    }))
                                  }
                                  className="p-0.5"
                                >
                                  <Star
                                    className={`h-6 w-6 transition-colors ${
                                      star <= editForm.rating
                                        ? "fill-[#FFD93D] text-[#FFD93D]"
                                        : "fill-transparent text-gray-500 hover:text-[#FFD93D]/50"
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Pros Editor */}
                          <div>
                            <Label className="text-gray-300 text-xs mb-1 block">
                              <ThumbsUp className="inline h-3 w-3 mr-1" />
                              Pros
                            </Label>
                            <div className="space-y-1 mb-2">
                              {editForm.pros.map((pro, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <span className="text-green-400">+</span>
                                  <span className="text-gray-300 flex-1">{pro}</span>
                                  <button
                                    onClick={() => removePro(idx)}
                                    className="text-gray-500 hover:text-red-400"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                value={newPro}
                                onChange={(e) => setNewPro(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && addPro()}
                                placeholder="Add a pro..."
                                className="bg-white/10 border-white/20 text-white text-sm h-8"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={addPro}
                                className="border-green-500/30 text-green-400 hover:bg-green-500/10 h-8"
                              >
                                +
                              </Button>
                            </div>
                          </div>

                          {/* Cons Editor */}
                          <div>
                            <Label className="text-gray-300 text-xs mb-1 block">
                              <ThumbsDown className="inline h-3 w-3 mr-1" />
                              Cons
                            </Label>
                            <div className="space-y-1 mb-2">
                              {editForm.cons.map((con, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <span className="text-red-400">-</span>
                                  <span className="text-gray-300 flex-1">{con}</span>
                                  <button
                                    onClick={() => removeCon(idx)}
                                    className="text-gray-500 hover:text-red-400"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                value={newCon}
                                onChange={(e) => setNewCon(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && addCon()}
                                placeholder="Add a con..."
                                className="bg-white/10 border-white/20 text-white text-sm h-8"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={addCon}
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-8"
                              >
                                +
                              </Button>
                            </div>
                          </div>

                          {/* Edit Actions */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              onClick={saveEdit}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Check className="mr-1 h-3 w-3" />
                              Save Changes
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEdit}
                              className="border-white/20 text-gray-300 hover:bg-white/10"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* ─── VIEW MODE ─── */
                        <>
                          <h4 className="text-white font-medium mb-1">
                            {variant.title}
                          </h4>
                          <p
                            className={`text-gray-300 text-sm leading-relaxed ${
                              expandedId === variant.id ? "" : "line-clamp-3"
                            }`}
                          >
                            {variant.body}
                          </p>

                          {expandedId === variant.id && (
                            <div className="mt-3 space-y-3">
                              {/* Rating Justification */}
                              <div className="bg-white/5 rounded-lg p-3">
                                <p className="text-xs text-gray-400 mb-1 font-medium">
                                  Rating Justification
                                </p>
                                <p className="text-sm text-gray-300">
                                  {variant.ratingJustification}
                                </p>
                              </div>

                              {/* Pros & Cons */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-3">
                                  <p className="text-xs text-green-400 mb-2 font-medium flex items-center gap-1">
                                    <ThumbsUp className="h-3 w-3" /> Pros
                                  </p>
                                  <ul className="space-y-1">
                                    {variant.pros.map((pro, idx) => (
                                      <li
                                        key={idx}
                                        className="text-sm text-gray-300 flex items-start gap-1.5"
                                      >
                                        <span className="text-green-400 mt-0.5">+</span>
                                        {pro}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                                  <p className="text-xs text-red-400 mb-2 font-medium flex items-center gap-1">
                                    <ThumbsDown className="h-3 w-3" /> Cons
                                  </p>
                                  <ul className="space-y-1">
                                    {variant.cons.map((con, idx) => (
                                      <li
                                        key={idx}
                                        className="text-sm text-gray-300 flex items-start gap-1.5"
                                      >
                                        <span className="text-red-400 mt-0.5">-</span>
                                        {con}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {editingId !== variant.id && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setExpandedId(
                            expandedId === variant.id ? null : variant.id
                          )
                        }
                        className="text-gray-400 hover:text-white hover:bg-white/10"
                      >
                        {expandedId === variant.id ? (
                          <ChevronUp className="mr-1 h-3 w-3" />
                        ) : (
                          <ChevronDown className="mr-1 h-3 w-3" />
                        )}
                        {expandedId === variant.id ? "Less" : "More"}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(variant)}
                        className="text-gray-400 hover:text-white hover:bg-white/10"
                      >
                        <Edit3 className="mr-1 h-3 w-3" />
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(variant)}
                        className="text-gray-400 hover:text-white hover:bg-white/10"
                      >
                        {copiedId === variant.id ? (
                          <>
                            <Check className="mr-1 h-3 w-3 text-green-400" />
                            <span className="text-green-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1 h-3 w-3" />
                            Copy
                          </>
                        )}
                      </Button>

                      <div className="flex-1" />

                      {!variant.isSelected && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSelect(variant.id)}
                          className="border-[#FFB347]/30 text-[#FFB347] hover:bg-[#FFB347]/10"
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Select
                        </Button>
                      )}

                      {variant.status !== "finalized" && variant.isSelected && (
                        <Button
                          size="sm"
                          onClick={() => handleFinalize(variant.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Finalize
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(variant.id)}
                        className="text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* AI Fingerprint Notice */}
      <Alert className="bg-green-500/5 border-green-500/20">
        <CheckCircle2 className="h-4 w-4 text-green-400" />
        <AlertDescription className="text-green-300 text-sm">
          All generated review text is automatically processed through the AI fingerprint
          stripper. No AI disclosure phrases, generation tags, or identifiable patterns
          remain in the output.
        </AlertDescription>
      </Alert>
    </div>
  );
}
