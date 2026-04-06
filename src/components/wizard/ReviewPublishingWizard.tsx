// ============================================================
// REVIEW PUBLISHING WIZARD
// Step-by-step wizard for publishing reviews:
// 1. Import from Vine — Select a Vine item to review
// 2. AI Content Generation — Generate review text, pros/cons, star rating
// 3. Avatar Selection — Pick which avatar to use for the video
// 4. Media Assembly — Select product photos, generate video with overlay
// 5. SEO Check — Auto-generate meta title, description, keywords, Schema.org
// 6. Publish — Publish to site AND optionally to YouTube
// ============================================================

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Sparkles,
  User,
  Camera,
  Search,
  Send,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Step components
import { WizardStepVineImport } from "./steps/WizardStepVineImport";
import { WizardStepAIContent } from "./steps/WizardStepAIContent";
import { WizardStepAvatar } from "./steps/WizardStepAvatar";
import { WizardStepMedia } from "./steps/WizardStepMedia";
import { WizardStepSEO } from "./steps/WizardStepSEO";
import { WizardStepPublish } from "./steps/WizardStepPublish";

// ─── TYPES ──────────────────────────────────────────────────

export interface WizardData {
  // Step 1: Vine Import
  vineItem: {
    asin: string;
    productName: string;
    category: string;
    imageUrl: string;
    estimatedValue: string;
    vineQueue: string;
  } | null;

  // Step 2: AI Content
  review: {
    title: string;
    body: string;
    rating: number;
    ratingJustification: string;
    pros: string[];
    cons: string[];
    excerpt: string;
    verdict: string;
  } | null;

  // Step 3: Avatar
  avatarId: string;
  quickTake: string;

  // Step 4: Media
  mediaAssets: Array<{
    id: string;
    url: string;
    type: "photo" | "video";
    caption?: string;
  }>;
  videoUrl: string | null;
  videoDuration: number;

  // Step 5: SEO
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    slug: string;
    schemaMarkup: string;
    ogImage: string;
  } | null;

  // Step 6: Publish
  publishToSite: boolean;
  publishToYouTube: boolean;
  youTubeScheduledAt: string | null;
  affiliateLink: string;
  affiliateTag: string;
}

export type WizardStepId = "vine" | "content" | "avatar" | "media" | "seo" | "publish";

interface WizardStep {
  id: WizardStepId;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const WIZARD_STEPS: WizardStep[] = [
  { id: "vine", label: "Import", icon: <Package className="h-4 w-4" />, description: "Select Vine item" },
  { id: "content", label: "Content", icon: <Sparkles className="h-4 w-4" />, description: "AI-generate review" },
  { id: "avatar", label: "Avatar", icon: <User className="h-4 w-4" />, description: "Choose avatar" },
  { id: "media", label: "Media", icon: <Camera className="h-4 w-4" />, description: "Photos & video" },
  { id: "seo", label: "SEO", icon: <Search className="h-4 w-4" />, description: "Optimize metadata" },
  { id: "publish", label: "Publish", icon: <Send className="h-4 w-4" />, description: "Go live" },
];

// ─── INITIAL STATE ──────────────────────────────────────────

const INITIAL_WIZARD_DATA: WizardData = {
  vineItem: null,
  review: null,
  avatarId: "avatar-reese-headshot",
  quickTake: "",
  mediaAssets: [],
  videoUrl: null,
  videoDuration: 0,
  seo: null,
  publishToSite: true,
  publishToYouTube: false,
  youTubeScheduledAt: null,
  affiliateLink: "",
  affiliateTag: "meetaudreyeva-20",
};

// ─── COMPONENT ──────────────────────────────────────────────

export function ReviewPublishingWizard() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [data, setData] = useState<WizardData>({ ...INITIAL_WIZARD_DATA });
  const [stepValidation, setStepValidation] = useState<Record<WizardStepId, boolean>>({
    vine: false,
    content: false,
    avatar: true, // Has default
    media: false,
    seo: false,
    publish: false,
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{
    success: boolean;
    siteUrl?: string;
    youtubeUrl?: string;
    errors?: string[];
  } | null>(null);

  const currentStep = WIZARD_STEPS[currentStepIndex];
  const progress = ((currentStepIndex + 1) / WIZARD_STEPS.length) * 100;

  // Update data from a step
  const updateData = useCallback((patch: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  // Validate current step
  const validateStep = useCallback(
    (stepId: WizardStepId): boolean => {
      switch (stepId) {
        case "vine":
          return data.vineItem !== null && !!data.vineItem.asin && !!data.vineItem.productName;
        case "content":
          return (
            data.review !== null &&
            !!data.review.title &&
            !!data.review.body &&
            data.review.rating >= 1 &&
            data.review.rating <= 5 &&
            data.review.pros.length > 0 &&
            data.review.cons.length > 0
          );
        case "avatar":
          return !!data.avatarId;
        case "media":
          return data.mediaAssets.length > 0;
        case "seo":
          return (
            data.seo !== null &&
            !!data.seo.metaTitle &&
            !!data.seo.metaDescription &&
            data.seo.keywords.length > 0 &&
            !!data.seo.slug
          );
        case "publish":
          return data.publishToSite || data.publishToYouTube;
        default:
          return false;
      }
    },
    [data]
  );

  // Update validation when data changes
  useEffect(() => {
    const newValidation: Record<WizardStepId, boolean> = {
      vine: validateStep("vine"),
      content: validateStep("content"),
      avatar: validateStep("avatar"),
      media: validateStep("media"),
      seo: validateStep("seo"),
      publish: validateStep("publish"),
    };
    setStepValidation(newValidation);
  }, [data, validateStep]);

  const canGoNext = stepValidation[currentStep.id];
  const canGoPrev = currentStepIndex > 0;

  const handleNext = useCallback(() => {
    if (canGoNext && currentStepIndex < WIZARD_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  }, [canGoNext, currentStepIndex]);

  const handlePrev = useCallback(() => {
    if (canGoPrev) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [canGoPrev]);

  const handleGoToStep = useCallback(
    (index: number) => {
      // Can only go to completed steps or the next incomplete step
      if (index <= currentStepIndex) {
        setCurrentStepIndex(index);
      } else {
        // Check all previous steps are valid
        const allPreviousValid = WIZARD_STEPS.slice(0, index).every(
          (step) => stepValidation[step.id]
        );
        if (allPreviousValid) {
          setCurrentStepIndex(index);
        }
      }
    },
    [currentStepIndex, stepValidation]
  );

  const handleReset = useCallback(() => {
    setData({ ...INITIAL_WIZARD_DATA });
    setCurrentStepIndex(0);
    setPublishResult(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            Review Publishing Wizard
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Step-by-step guide to publish a complete review
          </p>
        </div>
        {currentStepIndex > 0 && (
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-gray-400">
            <X className="h-4 w-4 mr-1" />
            Start Over
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <Progress value={progress} className="h-2" />

      {/* Step indicators */}
      <div className="flex items-center justify-between">
        {WIZARD_STEPS.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = stepValidation[step.id] && index < currentStepIndex;
          const isAccessible =
            index <= currentStepIndex ||
            WIZARD_STEPS.slice(0, index).every((s) => stepValidation[s.id]);

          return (
            <button
              key={step.id}
              onClick={() => handleGoToStep(index)}
              disabled={!isAccessible}
              className={`flex flex-col items-center gap-1 transition-all ${
                isAccessible ? "cursor-pointer" : "cursor-not-allowed opacity-50"
              }`}
            >
              <div
                className={`flex items-center justify-center h-10 w-10 rounded-full border-2 transition-all ${
                  isActive
                    ? "border-amber-500 bg-amber-500/20 text-amber-400"
                    : isCompleted
                    ? "border-green-500 bg-green-500/20 text-green-400"
                    : "border-gray-700 bg-gray-800 text-gray-500"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.icon
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  isActive
                    ? "text-amber-400"
                    : isCompleted
                    ? "text-green-400"
                    : "text-gray-500"
                }`}
              >
                {step.label}
              </span>
              {/* Connector line */}
              {index < WIZARD_STEPS.length - 1 && (
                <div
                  className={`hidden sm:block absolute h-0.5 w-full ${
                    isCompleted ? "bg-green-500" : "bg-gray-700"
                  }`}
                  style={{ top: "50%", left: "50%" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Step content */}
      <Card className="border-gray-800 bg-gray-900/50 min-h-[400px]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              {currentStep.icon}
              <span>
                Step {currentStepIndex + 1}: {currentStep.label}
              </span>
            </CardTitle>
            <Badge
              variant="outline"
              className={
                stepValidation[currentStep.id]
                  ? "text-green-400 border-green-500/30"
                  : "text-gray-400 border-gray-600"
              }
            >
              {stepValidation[currentStep.id] ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Valid
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Incomplete
                </>
              )}
            </Badge>
          </div>
          <p className="text-sm text-gray-400">{currentStep.description}</p>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentStep.id === "vine" && (
                <WizardStepVineImport data={data} updateData={updateData} />
              )}
              {currentStep.id === "content" && (
                <WizardStepAIContent data={data} updateData={updateData} />
              )}
              {currentStep.id === "avatar" && (
                <WizardStepAvatar data={data} updateData={updateData} />
              )}
              {currentStep.id === "media" && (
                <WizardStepMedia data={data} updateData={updateData} />
              )}
              {currentStep.id === "seo" && (
                <WizardStepSEO data={data} updateData={updateData} />
              )}
              {currentStep.id === "publish" && (
                <WizardStepPublish
                  data={data}
                  updateData={updateData}
                  isPublishing={isPublishing}
                  publishResult={publishResult}
                  onPublish={async () => {
                    setIsPublishing(true);
                    // Publishing logic handled in WizardStepPublish
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={!canGoPrev}
          className="border-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <div className="text-sm text-gray-500">
          Step {currentStepIndex + 1} of {WIZARD_STEPS.length}
        </div>

        {currentStepIndex < WIZARD_STEPS.length - 1 ? (
          <Button
            onClick={handleNext}
            disabled={!canGoNext}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <div /> // Publish button is inside the step
        )}
      </div>

      {/* Publish result */}
      {publishResult && (
        <Alert
          className={
            publishResult.success
              ? "border-green-500/30 bg-green-500/5"
              : "border-red-500/30 bg-red-500/5"
          }
        >
          {publishResult.success ? (
            <CheckCircle2 className="h-4 w-4 text-green-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-400" />
          )}
          <AlertDescription>
            {publishResult.success ? (
              <div className="space-y-1">
                <p className="text-green-400 font-medium">Review published successfully!</p>
                {publishResult.siteUrl && (
                  <p className="text-xs text-gray-400">
                    Site:{" "}
                    <a href={publishResult.siteUrl} className="text-amber-400 hover:underline">
                      {publishResult.siteUrl}
                    </a>
                  </p>
                )}
                {publishResult.youtubeUrl && (
                  <p className="text-xs text-gray-400">
                    YouTube:{" "}
                    <a href={publishResult.youtubeUrl} className="text-red-400 hover:underline">
                      {publishResult.youtubeUrl}
                    </a>
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-red-400 font-medium">Publishing failed</p>
                {publishResult.errors?.map((err, i) => (
                  <p key={i} className="text-xs text-gray-400">
                    {err}
                  </p>
                ))}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default ReviewPublishingWizard;
