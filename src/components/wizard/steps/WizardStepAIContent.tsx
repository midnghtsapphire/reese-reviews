// ============================================================
// WIZARD STEP 2: AI CONTENT GENERATION
// Generate review text, pros/cons, star rating using OpenRouter.
// Includes AI fingerprint stripping via metadataStripper.
// ============================================================

import React, { useState, useCallback } from "react";
import {
  Sparkles,
  Star,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Trash2,
  Plus,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import type { WizardData } from "../ReviewPublishingWizard";
import { stripAIFingerprints, humanizeText, type StripResult } from "@/utils/metadataStripper";

// ─── TYPES ──────────────────────────────────────────────────

interface Props {
  data: WizardData;
  updateData: (patch: Partial<WizardData>) => void;
}

// ─── AI GENERATION ──────────────────────────────────────────

async function generateReviewContent(
  productName: string,
  category: string,
  estimatedValue: string
): Promise<WizardData["review"]> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || "";

  const prompt = `You are Caresse "Reese" — a witty, thorough Amazon Vine reviewer who runs reesereviews.com. Write a detailed product review for:

Product: ${productName}
Category: ${category}
Estimated Value: ${estimatedValue}

Return a JSON object with these fields:
{
  "title": "Catchy review title (max 80 chars)",
  "body": "Detailed review body (300-500 words, conversational tone, include specific details about build quality, functionality, value for money)",
  "rating": <number 1-5>,
  "ratingJustification": "One sentence explaining the rating",
  "pros": ["pro1", "pro2", "pro3", "pro4"],
  "cons": ["con1", "con2"],
  "excerpt": "One-sentence summary for preview cards (max 160 chars)",
  "verdict": "Final verdict in 1-2 sentences"
}

Be honest, specific, and conversational. Use Reese's voice — direct, helpful, occasionally funny. Do NOT use generic filler phrases.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://reesereviews.com",
        "X-Title": "Reese Reviews",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content ?? "";

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    const parsed = JSON.parse(jsonMatch[0]);

    // Strip AI fingerprints from all text fields
    const strippedBody = stripAIFingerprints(parsed.body || "");
    const strippedTitle = stripAIFingerprints(parsed.title || "");
    const strippedExcerpt = stripAIFingerprints(parsed.excerpt || "");
    const strippedVerdict = stripAIFingerprints(parsed.verdict || "");

    return {
      title: strippedTitle.cleanedText,
      body: humanizeText(strippedBody.cleanedText),
      rating: Math.min(5, Math.max(1, Math.round(parsed.rating || 3))),
      ratingJustification: parsed.ratingJustification || "",
      pros: (parsed.pros || []).slice(0, 6),
      cons: (parsed.cons || []).slice(0, 4),
      excerpt: strippedExcerpt.cleanedText.slice(0, 160),
      verdict: strippedVerdict.cleanedText,
    };
  } catch (error) {
    console.error("AI generation failed:", error);
    // Return a template for manual editing
    return {
      title: `${productName} Review — My Honest Take`,
      body: `I received the ${productName} through Amazon Vine and have been testing it for a few days. Here are my thoughts...\n\n[Write your detailed review here]`,
      rating: 3,
      ratingJustification: "Decent product with room for improvement",
      pros: ["Good build quality", "Fair price point"],
      cons: ["Could be improved"],
      excerpt: `My honest review of the ${productName}`,
      verdict: `The ${productName} is a solid choice for the price.`,
    };
  }
}

// ─── COMPONENT ──────────────────────────────────────────────

export function WizardStepAIContent({ data, updateData }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [stripReport, setStripReport] = useState<StripResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newPro, setNewPro] = useState("");
  const [newCon, setNewCon] = useState("");

  const review = data.review;

  const handleGenerate = useCallback(async () => {
    if (!data.vineItem) return;

    setIsGenerating(true);
    setError(null);

    try {
      const generated = await generateReviewContent(
        data.vineItem.productName,
        data.vineItem.category,
        data.vineItem.estimatedValue
      );
      updateData({ review: generated });

      // Run strip report on the body
      const report = stripAIFingerprints(generated?.body ?? "");
      setStripReport(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  }, [data.vineItem, updateData]);

  const handleUpdateReview = useCallback(
    (field: string, value: unknown) => {
      if (!review) return;
      updateData({
        review: { ...review, [field]: value },
      });
    },
    [review, updateData]
  );

  const handleAddPro = useCallback(() => {
    if (!review || !newPro.trim()) return;
    handleUpdateReview("pros", [...review.pros, newPro.trim()]);
    setNewPro("");
  }, [review, newPro, handleUpdateReview]);

  const handleAddCon = useCallback(() => {
    if (!review || !newCon.trim()) return;
    handleUpdateReview("cons", [...review.cons, newCon.trim()]);
    setNewCon("");
  }, [review, newCon, handleUpdateReview]);

  const handleRemovePro = useCallback(
    (index: number) => {
      if (!review) return;
      handleUpdateReview(
        "pros",
        review.pros.filter((_, i) => i !== index)
      );
    },
    [review, handleUpdateReview]
  );

  const handleRemoveCon = useCallback(
    (index: number) => {
      if (!review) return;
      handleUpdateReview(
        "cons",
        review.cons.filter((_, i) => i !== index)
      );
    },
    [review, handleUpdateReview]
  );

  return (
    <div className="space-y-4">
      {/* Generate button */}
      {!review && (
        <div className="text-center py-8">
          <Sparkles className="h-10 w-10 text-amber-400 mx-auto mb-3" />
          <p className="text-gray-300 mb-4">
            Generate an AI-powered review for{" "}
            <span className="text-amber-400 font-medium">
              {data.vineItem?.productName ?? "your product"}
            </span>
          </p>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !data.vineItem}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            {isGenerating ? "Generating..." : "Generate Review with AI"}
          </Button>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Review content editor */}
      {review && (
        <div className="space-y-4">
          {/* AI Fingerprint Report */}
          {stripReport && stripReport.flagsFound.length > 0 && (
            <Alert className="border-amber-500/30 bg-amber-500/5">
              <Shield className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-xs">
                <span className="text-amber-400 font-medium">
                  AI Fingerprint Stripping:
                </span>{" "}
                Removed {stripReport.flagsFound.length} AI markers ({stripReport.flagsFound.join(", ")}).
                Confidence score: {(stripReport.humanScore * 100).toFixed(0)}% human-like.
              </AlertDescription>
            </Alert>
          )}

          {/* Title */}
          <div>
            <Label className="text-xs text-gray-400">Review Title</Label>
            <Input
              value={review.title}
              onChange={(e) => handleUpdateReview("title", e.target.value)}
              className="mt-1 bg-gray-800 border-gray-700 text-lg font-semibold"
            />
          </div>

          {/* Star Rating */}
          <div>
            <Label className="text-xs text-gray-400">Star Rating</Label>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleUpdateReview("rating", star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= review.rating
                          ? "text-amber-400 fill-amber-400"
                          : "text-gray-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-2xl font-bold text-amber-400">
                {review.rating}/5
              </span>
            </div>
            <Input
              value={review.ratingJustification}
              onChange={(e) =>
                handleUpdateReview("ratingJustification", e.target.value)
              }
              placeholder="Why this rating?"
              className="mt-2 bg-gray-800 border-gray-700 text-sm"
            />
          </div>

          {/* Review Body */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-gray-400">Review Body</Label>
              <span className="text-xs text-gray-500">
                {review.body.split(/\s+/).length} words
              </span>
            </div>
            <Textarea
              value={review.body}
              onChange={(e) => handleUpdateReview("body", e.target.value)}
              rows={8}
              className="mt-1 bg-gray-800 border-gray-700 text-sm leading-relaxed"
            />
          </div>

          {/* Pros & Cons */}
          <div className="grid grid-cols-2 gap-4">
            {/* Pros */}
            <div>
              <Label className="text-xs text-gray-400 flex items-center gap-1">
                <ThumbsUp className="h-3 w-3 text-green-400" />
                Pros
              </Label>
              <div className="mt-2 space-y-1">
                {review.pros.map((pro, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 rounded px-2 py-1"
                  >
                    <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                    <span className="flex-1">{pro}</span>
                    <button
                      onClick={() => handleRemovePro(i)}
                      className="text-gray-500 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-1">
                  <Input
                    value={newPro}
                    onChange={(e) => setNewPro(e.target.value)}
                    placeholder="Add a pro..."
                    className="bg-gray-800 border-gray-700 text-xs h-7"
                    onKeyDown={(e) => e.key === "Enter" && handleAddPro()}
                  />
                  <Button size="sm" variant="ghost" onClick={handleAddPro} className="h-7 px-2">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Cons */}
            <div>
              <Label className="text-xs text-gray-400 flex items-center gap-1">
                <ThumbsDown className="h-3 w-3 text-red-400" />
                Cons
              </Label>
              <div className="mt-2 space-y-1">
                {review.cons.map((con, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 rounded px-2 py-1"
                  >
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    <span className="flex-1">{con}</span>
                    <button
                      onClick={() => handleRemoveCon(i)}
                      className="text-gray-500 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-1">
                  <Input
                    value={newCon}
                    onChange={(e) => setNewCon(e.target.value)}
                    placeholder="Add a con..."
                    className="bg-gray-800 border-gray-700 text-xs h-7"
                    onKeyDown={(e) => e.key === "Enter" && handleAddCon()}
                  />
                  <Button size="sm" variant="ghost" onClick={handleAddCon} className="h-7 px-2">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Excerpt & Verdict */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label className="text-xs text-gray-400">
                Excerpt (preview card text)
              </Label>
              <Input
                value={review.excerpt}
                onChange={(e) =>
                  handleUpdateReview("excerpt", e.target.value.slice(0, 160))
                }
                className="mt-1 bg-gray-800 border-gray-700 text-sm"
              />
              <span className="text-[10px] text-gray-500">
                {review.excerpt.length}/160
              </span>
            </div>
            <div>
              <Label className="text-xs text-gray-400">Final Verdict</Label>
              <Textarea
                value={review.verdict}
                onChange={(e) => handleUpdateReview("verdict", e.target.value)}
                rows={2}
                className="mt-1 bg-gray-800 border-gray-700 text-sm"
              />
            </div>
          </div>

          {/* Regenerate */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="border-gray-700"
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${isGenerating ? "animate-spin" : ""}`}
              />
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
