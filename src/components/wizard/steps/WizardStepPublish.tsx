// ============================================================
// WIZARD STEP 6: PUBLISH
// Publish to reesereviews.com site AND optionally to YouTube.
// Includes final validation checklist, affiliate link check,
// star rating verification, and AI fingerprint stripping.
// ============================================================

import React, { useState, useCallback } from "react";
import {
  Send,
  Globe,
  Youtube,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Calendar,
  Link2,
  Star,
  Shield,
  Eye,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import type { WizardData } from "../ReviewPublishingWizard";
import { stripAIFingerprints } from "@/utils/metadataStripper";
import {
  generateVideoMetadata,
  addToUploadQueue,
  isAuthenticated as isYouTubeAuthenticated,
} from "@/services/youtube/youtubeService";

// ─── TYPES ──────────────────────────────────────────────────

interface Props {
  data: WizardData;
  updateData: (patch: Partial<WizardData>) => void;
  isPublishing: boolean;
  publishResult: {
    success: boolean;
    siteUrl?: string;
    youtubeUrl?: string;
    errors?: string[];
  } | null;
  onPublish: () => void;
}

interface ValidationCheck {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  message: string;
}

// ─── VALIDATION ─────────────────────────────────────────────

function runValidationChecks(data: WizardData): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  // 1. Product selected
  checks.push({
    id: "product",
    label: "Product Selected",
    status: data.vineItem ? "pass" : "fail",
    message: data.vineItem
      ? `${data.vineItem.productName} (${data.vineItem.asin})`
      : "No product selected",
  });

  // 2. Review content
  checks.push({
    id: "content",
    label: "Review Content",
    status: data.review?.body && data.review.body.length > 100 ? "pass" : "fail",
    message: data.review
      ? `${data.review.body.split(/\s+/).length} words, ${data.review.rating}/5 stars`
      : "No review content",
  });

  // 3. Star rating verification
  if (data.review) {
    const rating = data.review.rating;
    checks.push({
      id: "rating",
      label: "Star Rating",
      status: rating >= 1 && rating <= 5 ? "pass" : "fail",
      message:
        rating >= 1 && rating <= 5
          ? `${rating}/5 stars — ${data.review.ratingJustification}`
          : "Invalid rating",
    });
  }

  // 4. AI fingerprint check
  if (data.review?.body) {
    const stripResult = stripAIFingerprints(data.review.body);
    checks.push({
      id: "ai-fingerprint",
      label: "AI Fingerprint Check",
      status:
        stripResult.humanScore >= 0.8
          ? "pass"
          : stripResult.humanScore >= 0.5
          ? "warn"
          : "fail",
      message: `${(stripResult.humanScore * 100).toFixed(0)}% human-like${
        stripResult.flagsFound.length > 0
          ? ` (${stripResult.flagsFound.length} markers detected)`
          : ""
      }`,
    });
  }

  // 5. Affiliate link check
  checks.push({
    id: "affiliate",
    label: "Affiliate Link",
    status: data.affiliateLink
      ? data.affiliateLink.includes("tag=")
        ? "pass"
        : "warn"
      : "warn",
    message: data.affiliateLink
      ? data.affiliateLink.includes("tag=")
        ? "Affiliate link with tag present"
        : "Affiliate link missing tag parameter"
      : "No affiliate link (optional but recommended)",
  });

  // 6. Media assets
  checks.push({
    id: "media",
    label: "Media Assets",
    status: data.mediaAssets.length > 0 ? "pass" : "fail",
    message: `${data.mediaAssets.length} media file(s)${
      data.videoUrl ? ", video ready" : ""
    }`,
  });

  // 7. Avatar selected
  checks.push({
    id: "avatar",
    label: "Avatar Selected",
    status: data.avatarId ? "pass" : "warn",
    message: data.avatarId ? "Avatar configured" : "No avatar selected",
  });

  // 8. SEO metadata
  checks.push({
    id: "seo",
    label: "SEO Metadata",
    status: data.seo?.metaTitle && data.seo?.slug ? "pass" : "fail",
    message: data.seo
      ? `Title: ${data.seo.metaTitle.length} chars, ${data.seo.keywords.length} keywords`
      : "No SEO metadata",
  });

  // 9. YouTube connection (if publishing to YouTube)
  if (data.publishToYouTube) {
    checks.push({
      id: "youtube",
      label: "YouTube Connection",
      status: isYouTubeAuthenticated() ? "pass" : "fail",
      message: isYouTubeAuthenticated()
        ? "YouTube account connected"
        : "YouTube account not connected — go to Settings to connect",
    });
  }

  return checks;
}

// ─── COMPONENT ──────────────────────────────────────────────

export function WizardStepPublish({
  data,
  updateData,
  isPublishing,
  publishResult,
  onPublish,
}: Props) {
  const [isProcessing, setIsProcessing] = useState(false);

  const checks = runValidationChecks(data);
  const hasFailures = checks.some((c) => c.status === "fail");
  const hasWarnings = checks.some((c) => c.status === "warn");
  const allPassed = !hasFailures;

  const handlePublish = useCallback(async () => {
    setIsProcessing(true);

    try {
      // Publish to site (store in local state / Supabase)
      if (data.publishToSite) {
        // In production, this would call the review store to save
        console.log("Publishing to site:", {
          title: data.review?.title,
          slug: data.seo?.slug,
          body: data.review?.body,
          rating: data.review?.rating,
          seo: data.seo,
        });
      }

      // Add to YouTube upload queue
      if (data.publishToYouTube && data.review && data.vineItem) {
        const videoMetadata = generateVideoMetadata({
          productName: data.vineItem.productName,
          category: data.vineItem.category,
          rating: data.review.rating,
          pros: data.review.pros,
          cons: data.review.cons,
          reviewBody: data.review.body,
          affiliateLink: data.affiliateLink || undefined,
          isVineProduct: true,
          videoDurationSeconds: data.videoDuration,
        });

        // Apply scheduled time if set
        if (data.youTubeScheduledAt) {
          videoMetadata.scheduledPublishAt = data.youTubeScheduledAt;
        }

        addToUploadQueue({
          videoBlob: null,
          videoUrl: data.videoUrl ?? "",
          metadata: videoMetadata,
          reviewId: data.seo?.slug ?? `review-${Date.now()}`,
          productName: data.vineItem.productName,
          scheduledAt: data.youTubeScheduledAt ?? undefined,
        });
      }

      // Trigger parent callback
      onPublish();
    } catch (err) {
      console.error("Publish failed:", err);
    } finally {
      setIsProcessing(false);
    }
  }, [data, onPublish]);

  return (
    <div className="space-y-4">
      {/* Publish targets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Site */}
        <div
          className={`rounded-lg border p-4 transition-all ${
            data.publishToSite
              ? "border-amber-500/50 bg-amber-500/5"
              : "border-gray-700 bg-gray-800/30"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-amber-400" />
              <span className="text-sm font-medium text-gray-200">
                reesereviews.com
              </span>
            </div>
            <Switch
              checked={data.publishToSite}
              onCheckedChange={(v) => updateData({ publishToSite: v })}
            />
          </div>
          <p className="text-xs text-gray-400">
            Publish the review to your website with full SEO metadata and
            Schema.org markup.
          </p>
          {data.publishToSite && data.seo?.slug && (
            <p className="text-xs text-amber-400 mt-2 font-mono">
              /reviews/{data.seo.slug}
            </p>
          )}
        </div>

        {/* YouTube */}
        <div
          className={`rounded-lg border p-4 transition-all ${
            data.publishToYouTube
              ? "border-red-500/50 bg-red-500/5"
              : "border-gray-700 bg-gray-800/30"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Youtube className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium text-gray-200">
                YouTube
              </span>
            </div>
            <Switch
              checked={data.publishToYouTube}
              onCheckedChange={(v) => updateData({ publishToYouTube: v })}
            />
          </div>
          <p className="text-xs text-gray-400">
            Upload the review video to YouTube with auto-generated metadata and
            FTC disclosures.
          </p>
          {data.publishToYouTube && (
            <div className="mt-2">
              <Label className="text-[10px] text-gray-500">
                Schedule (optional)
              </Label>
              <Input
                type="datetime-local"
                value={data.youTubeScheduledAt ?? ""}
                onChange={(e) =>
                  updateData({
                    youTubeScheduledAt: e.target.value || null,
                  })
                }
                className="mt-1 bg-gray-900 border-gray-700 text-xs h-7"
              />
            </div>
          )}
        </div>
      </div>

      {/* Validation Checklist */}
      <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
        <h4 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-amber-400" />
          Pre-Publish Checklist
        </h4>
        <div className="space-y-2">
          {checks.map((check) => (
            <div
              key={check.id}
              className="flex items-start gap-2 text-sm"
            >
              {check.status === "pass" ? (
                <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
              ) : check.status === "warn" ? (
                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <span
                  className={`font-medium ${
                    check.status === "pass"
                      ? "text-green-400"
                      : check.status === "warn"
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}
                >
                  {check.label}
                </span>
                <p className="text-xs text-gray-400">{check.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      {data.review && data.vineItem && (
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
          <h4 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
            <Eye className="h-4 w-4 text-amber-400" />
            Review Summary
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-500">Product:</span>
              <p className="text-gray-200 font-medium">
                {data.vineItem.productName}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Rating:</span>
              <p className="text-amber-400 font-medium flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-3 w-3 ${
                      s <= data.review!.rating
                        ? "text-amber-400 fill-amber-400"
                        : "text-gray-600"
                    }`}
                  />
                ))}
                <span className="ml-1">{data.review.rating}/5</span>
              </p>
            </div>
            <div>
              <span className="text-gray-500">Title:</span>
              <p className="text-gray-200">{data.review.title}</p>
            </div>
            <div>
              <span className="text-gray-500">Word Count:</span>
              <p className="text-gray-200">
                {data.review.body.split(/\s+/).length} words
              </p>
            </div>
            <div>
              <span className="text-gray-500">Pros:</span>
              <p className="text-green-400">{data.review.pros.length} listed</p>
            </div>
            <div>
              <span className="text-gray-500">Cons:</span>
              <p className="text-red-400">{data.review.cons.length} listed</p>
            </div>
            <div>
              <span className="text-gray-500">Media:</span>
              <p className="text-gray-200">
                {data.mediaAssets.length} files
                {data.videoUrl ? " + video" : ""}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Publish To:</span>
              <p className="text-gray-200">
                {[
                  data.publishToSite && "Site",
                  data.publishToYouTube && "YouTube",
                ]
                  .filter(Boolean)
                  .join(", ") || "None selected"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {hasWarnings && !hasFailures && (
        <Alert className="border-amber-500/30 bg-amber-500/5">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <AlertDescription className="text-xs text-gray-300">
            Some optional checks have warnings. You can still publish, but
            consider addressing them for the best results.
          </AlertDescription>
        </Alert>
      )}

      {/* Publish button */}
      <div className="flex items-center justify-center pt-4">
        <Button
          size="lg"
          onClick={handlePublish}
          disabled={
            hasFailures ||
            isProcessing ||
            isPublishing ||
            (!data.publishToSite && !data.publishToYouTube)
          }
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold px-8 py-3 text-base shadow-lg shadow-amber-500/20"
        >
          {isProcessing || isPublishing ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <Send className="h-5 w-5 mr-2" />
          )}
          {isProcessing || isPublishing
            ? "Publishing..."
            : hasFailures
            ? "Fix Issues to Publish"
            : "Publish Review"}
        </Button>
      </div>

      {/* Failure explanation */}
      {hasFailures && (
        <p className="text-center text-xs text-red-400">
          Fix the failed checks above before publishing.
        </p>
      )}
    </div>
  );
}
