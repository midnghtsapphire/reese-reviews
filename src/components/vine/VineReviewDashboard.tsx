// ============================================================
// VINE REVIEW AUTO-GENERATOR — MAIN DASHBOARD
// Priority 1 feature: CSV import, review queue, generation,
// avatar selection, video creation with length selector, export
// ============================================================
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Upload, FileText, Star, Clock, AlertTriangle, CheckCircle2,
  Zap, Trash2, Edit3, Copy, Download, Play, Pause, SkipForward,
  Camera, Video, User, Plus, Search, RefreshCw, Package,
  BarChart2, Calendar, ArrowRight, Loader2, X, Eye, Timer,
} from "lucide-react";
import {
  getVineItems, addVineItem, updateVineItem, deleteVineItem,
  importFromCSV, parseCSVText, getPendingQueue, getItemStats,
  getDaysUntilDeadline, getDeadlineColor, getDeadlineBadgeVariant,
  getAvatars, addCustomAvatar, deleteAvatar,
  type VineItem, type VineItemStatus, type GeneratedReview, type AvatarProfile, type ReviewPhoto, type StarRating,
  type AutomationMode, AUTOMATION_MODES,
} from "@/stores/vineReviewStore";
import {
  generateReview, scrapeProductReviews, calculateStarRating,
  generateVideoScript, type GeneratedReviewData,
} from "@/services/openRouterService";
import {
  parseScriptToScenes, renderVideoPreview, formatDuration,
  VIDEO_LENGTH_PRESETS, DEFAULT_VIDEO_LENGTH_PRESET, getPresetBySeconds,
  type VideoConfig, type VideoScene, type VideoLengthPreset,
} from "@/services/videoService";
import ProductPhotoFinder from "@/components/vine/ProductPhotoFinder";
import ReviewSubmissionForm from "@/components/vine/ReviewSubmissionForm";
import {
  scrapeProductImages, extractAsinFromUrl, sourceLabel,
  countBySource, type ProductImageResult, type ScrapedImage,
} from "@/services/productImageScraper";
import { createHeyGenVideo, waitForHeyGenVideo } from "@/lib/heygenClient";
import { stripExifFromFile } from "@/lib/exifStripper";

function safeAmazonHref(url: string | undefined, asin: string): string {
  const fallback = `https://www.amazon.com/dp/${encodeURIComponent(asin)}`;
  if (!url) return fallback;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return fallback;
    return parsed.href;
  } catch {
    return fallback;
  }
}

// ─── VIDEO LENGTH SELECTOR COMPONENT ────────────────────────
interface VideoLengthSelectorProps {
  value: number; // seconds
  onChange: (seconds: number) => void;
  label?: string;
  className?: string;
}

function VideoLengthSelector({ value, onChange, label = "Video Length", className = "" }: VideoLengthSelectorProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label className="flex items-center gap-1 text-xs">
        <Timer className="h-3 w-3" /> {label}
      </Label>
      <Select
        value={String(value)}
        onValueChange={(v) => onChange(Number(v))}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {VIDEO_LENGTH_PRESETS.map((preset) => (
            <SelectItem key={preset.seconds} value={String(preset.seconds)}>
              <div className="flex flex-col">
                <span className="font-medium">{preset.label}</span>
                <span className="text-xs text-muted-foreground">{preset.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* Show pacing info for the selected preset */}
      {(() => {
        const preset = getPresetBySeconds(value);
        return (
          <p className="text-xs text-muted-foreground">
            {preset.minSlides} slides · {preset.secondsPerSlide}s/slide
            {preset.multiSection ? " · multi-section" : ""}
          </p>
        );
      })()}
    </div>
  );
}

// ─── STATS BAR ──────────────────────────────────────────────
function StatsBar() {
  const stats = getItemStats();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {[
        { label: "Total", value: stats.total, icon: Package, color: "text-blue-400" },
        { label: "Pending", value: stats.pending, icon: Clock, color: "text-yellow-400" },
        { label: "Generating", value: stats.generating, icon: Loader2, color: "text-purple-400" },
        { label: "Generated", value: stats.generated, icon: CheckCircle2, color: "text-green-400" },
        { label: "Edited", value: stats.edited, icon: Edit3, color: "text-cyan-400" },
        { label: "Submitted", value: stats.submitted, icon: Zap, color: "text-emerald-400" },
        { label: "Overdue", value: stats.overdue, icon: AlertTriangle, color: "text-red-400" },
      ].map(({ label, value, icon: Icon, color }) => (
        <Card key={label} className="glass-card steel-border">
          <CardContent className="p-3 flex items-center gap-2">
            <Icon className={`h-4 w-4 ${color}`} />
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-bold">{value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────
export default function VineReviewDashboard() {
  const [items, setItems] = useState<VineItem[]>([]);
  const [activeTab, setActiveTab] = useState("queue");
  const [selectedItem, setSelectedItem] = useState<VineItem | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Video length — default 60s (1 minute) for Vine reviews
  const [videoLengthSeconds, setVideoLengthSeconds] = useState<number>(60);
  // Per-item video length overrides
  const [itemVideoLengths, setItemVideoLengths] = useState<Record<string, number>>({});

  // Add item form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    productName: "", asin: "", amazonUrl: "", category: "electronics",
    automationMode: "full_auto" as AutomationMode,
    orderDate: new Date().toISOString().split("T")[0],
    reviewDeadline: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    etv: "",
  });

  // Global default automation mode
  const [defaultAutomationMode, setDefaultAutomationMode] = useState<AutomationMode>("full_auto");

  // Image scraping
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedImageResult, setScrapedImageResult] = useState<ProductImageResult | null>(null);

  // CSV import
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [csvText, setCsvText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Avatar
  const [avatars, setAvatars] = useState<AvatarProfile[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<string>("avatar-reese");
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [avatarForm, setAvatarForm] = useState<{ name: string; gender: "male" | "female" | "neutral" }>({ name: "", gender: "female" });

  // Video preview
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoScenes, setVideoScenes] = useState<VideoScene[]>([]);
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewItem, setPreviewItem] = useState<VineItem | null>(null);

  // Review editor
  const [editingReview, setEditingReview] = useState<GeneratedReview | null>(null);
  const [editForm, setEditForm] = useState({ title: "", body: "", rating: 5 });

  // Photo finder modal
  const [photoFinderItem, setPhotoFinderItem] = useState<VineItem | null>(null);
  // Submission form modal
  const [submissionItem, setSubmissionItem] = useState<VineItem | null>(null);

  const refresh = useCallback(() => {
    setItems(getVineItems());
    setAvatars(getAvatars());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // ─── CSV IMPORT ─────────────────────────────────────────
  const handleCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleCSVImport = () => {
    if (!csvText.trim()) return;
    const rows = parseCSVText(csvText);
    if (rows.length === 0) {
      setError("No valid rows found in CSV. Ensure headers include: productName, asin, category, orderDate, reviewDeadline");
      return;
    }
    const imported = importFromCSV(rows, defaultAutomationMode);
    setSuccess(`Imported ${imported.length} Vine items successfully!`);
    setCsvText("");
    setShowCSVImport(false);
    refresh();
  };

  // ─── ADD ITEM ───────────────────────────────────────────
  const handleAmazonUrlChange = (url: string) => {
    setAddForm((prev) => {
      const updates: typeof prev = { ...prev, amazonUrl: url };
      const extracted = extractAsinFromUrl(url);
      if (extracted) updates.asin = extracted;
      return updates;
    });
  };

  const handleAddItem = () => {
    if (!addForm.productName.trim()) return;
    const asin = addForm.asin || extractAsinFromUrl(addForm.amazonUrl) || "";
    const amazonUrl = addForm.amazonUrl || (asin ? `https://www.amazon.com/dp/${asin}` : "");
    addVineItem({
      productName: addForm.productName,
      asin,
      amazonUrl,
      category: addForm.category,
      automationMode: addForm.automationMode,
      orderDate: new Date(addForm.orderDate).toISOString(),
      reviewDeadline: new Date(addForm.reviewDeadline).toISOString(),
      etv: parseFloat(addForm.etv) || 0,
      imageUrl: "",
    });
    setAddForm({
      productName: "", asin: "", amazonUrl: "", category: "electronics",
      automationMode: defaultAutomationMode,
      orderDate: new Date().toISOString().split("T")[0],
      reviewDeadline: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      etv: "",
    });
    setShowAddForm(false);
    setSuccess("Item added to queue!");
    refresh();
  };

  // ─── GENERATE REVIEW ───────────────────────────────────
  const handleGenerateReview = async (item: VineItem) => {
    const mode = item.automationMode || "full_auto";
    if (mode === "manual") {
      setError("This item is set to Manual mode — nothing to auto-generate.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    const itemLength = itemVideoLengths[item.id] ?? videoLengthSeconds;
    const preset = getPresetBySeconds(itemLength);

    const doReview = mode === "full_auto" || mode === "review_only";
    const doPhotos = mode === "full_auto" || mode === "photos_only";
    const doVideo = mode === "full_auto" || mode === "video_only";

    try {
      updateVineItem(item.id, { status: "generating" });
      refresh();

      // Conditionally scrape review text + product images in parallel
      const emptyScraped = { reviews: [], commonPros: [], commonCons: [], averageRating: 0 };
      const [scraped, imageResult] = await Promise.all([
        (doReview || doVideo) ? scrapeProductReviews(item.productName, item.asin) : Promise.resolve(emptyScraped),
        doPhotos ? scrapeProductImages(item.asin, item.productName) : Promise.resolve(null),
      ]);

      // Review text + rating (for full_auto, review_only, and video_only which needs text for script)
      let reviewData: GeneratedReviewData | null = null;
      let ratingAnalysis: ReturnType<typeof calculateStarRating> | null = null;
      if (doReview || doVideo) {
        ratingAnalysis = calculateStarRating(scraped.reviews);
        const context = scraped.reviews.map((r) => `[${r.source}] ${r.rating}★: ${r.text}`).join("\n");
        reviewData = await generateReview(item.productName, item.asin, item.category, context);
      }

      // Video script
      let videoScript: string | null = null;
      if (doVideo && reviewData) {
        videoScript = await generateVideoScript(
          item.productName, reviewData.body, reviewData.rating,
          reviewData.pros, reviewData.cons, preset
        );
      }

      // Build photos from scraped images
      const typeMap: Record<string, ReviewPhoto["type"]> = {
        listing: "product",
        lifestyle: "lifestyle",
        review: "in-use",
      };
      let photos: ReviewPhoto[] = [];
      if (imageResult && imageResult.allImages.length > 0) {
        photos = imageResult.allImages.slice(0, 8).map((img, i) => ({
          id: `photo-${Date.now()}-${i}`,
          url: img.url,
          caption: `${img.alt} (${sourceLabel(img.source)})`,
          type: typeMap[img.type] || "product",
          isSelected: i < 5,
        }));
      } else if (doPhotos || doReview) {
        photos = [
          { id: `photo-${Date.now()}-1`, url: "", caption: "Product front view", type: "product", isSelected: true },
          { id: `photo-${Date.now()}-2`, url: "", caption: "Product in use", type: "in-use", isSelected: true },
          { id: `photo-${Date.now()}-3`, url: "", caption: "Product detail", type: "detail", isSelected: true },
        ];
      }

      const imageSources = imageResult ? countBySource(imageResult.allImages) : {};
      const sourcesSummary = Object.entries(imageSources).map(([s, n]) => `${n} from ${s}`).join(", ");

      const generatedReview: GeneratedReview = {
        id: `review-${Date.now()}`,
        vineItemId: item.id,
        title: reviewData?.title || `${item.productName} Review`,
        body: reviewData?.body || "",
        rating: (ratingAnalysis?.calculatedRating ?? 4) as StarRating,
        ratingJustification: reviewData?.ratingJustification || "",
        pros: reviewData?.pros || [],
        cons: reviewData?.cons || [],
        photos,
        videoUrl: null,
        videoScript: videoScript || null,
        videoLengthSeconds: doVideo ? itemLength : 0,
        avatarId: selectedAvatar,
        ftcDisclosure: "I received this product free through Amazon Vine and am providing my honest opinion.",
        isEdited: false,
        createdAt: new Date().toISOString(),
        editedAt: null,
      };

      const updatePayload: Partial<VineItem> = {
        status: "generated" as VineItemStatus,
        generatedReview,
      };
      if (doReview || doVideo) {
        updatePayload.scrapedData = {
          amazonReviews: scraped.reviews,
          redditMentions: [],
          averageRating: scraped.averageRating,
          totalReviews: scraped.reviews.length,
          commonPros: scraped.commonPros,
          commonCons: scraped.commonCons,
          sentimentScore: ratingAnalysis?.sentimentScore ?? 0,
          scrapedAt: new Date().toISOString(),
        };
      }
      if (imageResult) {
        updatePayload.scrapedImages = {
          listingImages: imageResult.listingImages,
          reviewImages: imageResult.reviewImages,
          sources: imageResult.sources,
          scrapedAt: imageResult.scrapedAt,
          isDemo: imageResult.isDemo,
        };
      }
      updateVineItem(item.id, updatePayload);

      const parts: string[] = [];
      const modeLabel = AUTOMATION_MODES.find((m) => m.value === mode)?.label || mode;
      parts.push(`"${item.productName}" (${modeLabel})`);
      if (doVideo) parts.push(`${preset.label} video`);
      if (imageResult && imageResult.allImages.length > 0) parts.push(`${imageResult.allImages.length} images (${sourcesSummary})`);
      setSuccess(`Generated: ${parts.join(" | ")}`);
      refresh();
    } catch (err: unknown) {
      setError(`Failed to generate review: ${err instanceof Error ? err.message : "Unknown error"}`);
      updateVineItem(item.id, { status: "pending" });
      refresh();
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── BULK GENERATE ─────────────────────────────────────
  const handleBulkGenerate = async () => {
    const pending = getPendingQueue().filter((i) => (i.automationMode || "full_auto") !== "manual");
    if (pending.length === 0) {
      setError("No pending items to generate (manual items are excluded).");
      return;
    }
    setIsBulkGenerating(true);
    setBulkProgress(0);
    for (let i = 0; i < pending.length; i++) {
      await handleGenerateReview(pending[i]);
      setBulkProgress(((i + 1) / pending.length) * 100);
    }
    setIsBulkGenerating(false);
    setSuccess(`Generated reviews for ${pending.length} items!`);
  };

  // ─── SCRAPE IMAGES (standalone) ─────────────────────────
  const handleScrapeImages = async (item: VineItem) => {
    if (!item.asin) {
      setError("No ASIN — cannot scrape images without a product identifier.");
      return;
    }
    setIsScraping(true);
    setError(null);
    try {
      const result = await scrapeProductImages(item.asin, item.productName);
      const imageSources = countBySource(result.allImages);
      const sourcesSummary = Object.entries(imageSources).map(([s, n]) => `${n} from ${s}`).join(", ");
      updateVineItem(item.id, {
        scrapedImages: {
          listingImages: result.listingImages,
          reviewImages: result.reviewImages,
          sources: result.sources,
          scrapedAt: result.scrapedAt,
          isDemo: result.isDemo,
        },
      });
      setSuccess(`Scraped ${result.allImages.length} images for "${item.productName}" (${sourcesSummary})`);
      refresh();
    } catch (err: unknown) {
      setError(`Failed to scrape images: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsScraping(false);
    }
  };

  // ─── EDIT REVIEW ────────────────────────────────────────
  const startEditing = (item: VineItem) => {
    if (!item.generatedReview) return;
    setEditingReview(item.generatedReview);
    setEditForm({
      title: item.generatedReview.title,
      body: item.generatedReview.body,
      rating: item.generatedReview.rating,
    });
  };

  const saveEdit = () => {
    if (!editingReview) return;
    const item = items.find((i) => i.id === editingReview.vineItemId);
    if (!item) return;
    updateVineItem(item.id, {
      status: "edited",
      generatedReview: {
        ...editingReview,
        title: editForm.title,
        body: editForm.body,
        rating: editForm.rating as StarRating,
        isEdited: true,
        editedAt: new Date().toISOString(),
      },
    });
    setEditingReview(null);
    setSuccess("Review updated!");
    refresh();
  };

  // ─── COPY TO CLIPBOARD ─────────────────────────────────
  const copyReview = (item: VineItem) => {
    if (!item.generatedReview) return;
    const r = item.generatedReview;
    const text = `${r.title}\n\n${r.body}\n\n${r.ftcDisclosure}`;
    navigator.clipboard.writeText(text);
    setSuccess("Review copied to clipboard — ready to paste into Amazon!");
  };

  // ─── PHOTO FINDER CALLBACK ─────────────────────────────
  const handlePhotosSelected = (photos: ReviewPhoto[]) => {
    if (!photoFinderItem?.generatedReview) return;
    updateVineItem(photoFinderItem.id, {
      generatedReview: {
        ...photoFinderItem.generatedReview,
        photos,
      },
    });
    setPhotoFinderItem(null);
    setSuccess(`${photos.length} photos added to "${photoFinderItem.productName}"!`);
    refresh();
  };

  // ─── SUBMISSION FORM SAVE ──────────────────────────────
  const handleSubmissionSave = (updatedReview: GeneratedReview) => {
    if (!submissionItem) return;
    updateVineItem(submissionItem.id, {
      generatedReview: updatedReview,
      status: "submitted",
    });
    setSubmissionItem(null);
    setSuccess(`Review for "${submissionItem.productName}" marked as submitted!`);
    refresh();
  };

  // ─── HEYGEN VIDEO GENERATION ─────────────────────────────
  const [generatingVideoItemId, setGeneratingVideoItemId] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState<string | null>(null);

  const handleGenerateHeyGenVideo = async (item: VineItem) => {
    if (!item.generatedReview?.videoScript) {
      setError("Generate a review first to get a video script.");
      return;
    }
    const heygenKey = localStorage.getItem("heygen_api_key") || import.meta.env.VITE_HEYGEN_API_KEY || "";
    if (!heygenKey) {
      setError("HeyGen API key not configured. Add it in settings or set VITE_HEYGEN_API_KEY.");
      return;
    }
    setGeneratingVideoItemId(item.id);
    setVideoProgress("Sending script to HeyGen...");
    setError(null);
    try {
      const avatar = avatars.find((a) => a.id === item.generatedReview?.avatarId) || avatars[0];
      const { video_id } = await createHeyGenVideo(heygenKey, {
        avatar_id: avatar?.id || "avatar-reese",
        script: item.generatedReview.videoScript,
        title: `Review: ${item.productName}`,
        background: "#1e1b4b",
      });
      setVideoProgress("Video queued — waiting for HeyGen to render...");

      const result = await waitForHeyGenVideo(heygenKey, video_id, (status) => {
        setVideoProgress(`Video status: ${status.status}...`);
      });

      if (result.status === "completed" && result.video_url) {
        const freshItems = getVineItems();
        const freshItem = freshItems.find(i => i.id === item.id);
        const freshReview = freshItem?.generatedReview || item.generatedReview;
        updateVineItem(item.id, {
          generatedReview: {
            ...freshReview,
            videoUrl: result.video_url,
          },
        });
        setSuccess(`Video generated for "${item.productName}"!`);
      } else {
        setError(`HeyGen video failed: ${result.error || "Unknown error"}`);
      }
    } catch (err: unknown) {
      setError(`HeyGen error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setGeneratingVideoItemId(null);
      setVideoProgress(null);
      refresh();
    }
  };

  // ─── EXIF STRIPPING FOR PHOTO UPLOADS ─────────────────
  const handlePhotoUpload = async (item: VineItem, files: FileList) => {
    if (!item.generatedReview) return;
    const strippedPhotos: ReviewPhoto[] = [...(item.generatedReview.photos || [])];

    for (let i = 0; i < files.length && strippedPhotos.length < 8; i++) {
      const result = await stripExifFromFile(files[i], 0.92);
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(result.blob);
      });
      URL.revokeObjectURL(result.url);
      strippedPhotos.push({
        id: `photo-${Date.now()}-${i}`,
        url: dataUrl,
        caption: `Photo ${strippedPhotos.length + 1}`,
        type: i === 0 ? "product" : "in-use",
        isSelected: true,
      });
    }

    const freshItems = getVineItems();
    const freshItem = freshItems.find(i => i.id === item.id);
    const freshReview = freshItem?.generatedReview || item.generatedReview;
    updateVineItem(item.id, {
      generatedReview: {
        ...freshReview,
        photos: strippedPhotos,
      },
    });
    const addedCount = strippedPhotos.length - (item.generatedReview.photos || []).length;
    setSuccess(`${addedCount} photo(s) added with EXIF data stripped for privacy!`);
    refresh();
  };

  // ─── AVATAR UPLOAD ─────────────────────────────────────
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      addCustomAvatar(avatarForm.name || "Custom Avatar", url, avatarForm.gender);
      setShowAvatarUpload(false);
      refresh();
    };
    reader.readAsDataURL(file);
  };

  // ─── VIDEO PREVIEW ─────────────────────────────────────
  const previewVideo = (item: VineItem) => {
    if (!item.generatedReview?.videoScript || !canvasRef.current) return;
    const itemLength = item.generatedReview.videoLengthSeconds ?? videoLengthSeconds;
    const preset = getPresetBySeconds(itemLength);
    const scenes = parseScriptToScenes(item.generatedReview.videoScript, [item.imageUrl], preset);
    setVideoScenes(scenes);
    setCurrentScene(0);
    setPreviewItem(item);
    const avatar = avatars.find((a) => a.id === item.generatedReview?.avatarId);
    renderVideoPreview(canvasRef.current, {
      productName: item.productName,
      rating: item.generatedReview.rating,
      script: item.generatedReview.videoScript,
      productImages: [item.imageUrl],
      avatarImage: avatar?.imageUrl || "",
      duration: itemLength,
      width: 640,
      height: 360,
      preset,
    }, scenes, 0);
    setActiveTab("video");
  };

  // ─── RENDER ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold gradient-steel-text">Vine Review Auto-Generator</h2>
          <p className="text-sm text-muted-foreground">
            Import Vine orders, auto-generate authentic reviews, and manage your review queue
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setShowCSVImport(true)}>
            <Upload className="h-4 w-4 mr-1" /> Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setAddForm((f) => ({ ...f, automationMode: defaultAutomationMode })); setShowAddForm(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Item
          </Button>
          <Button
            size="sm"
            className="gradient-steel"
            onClick={handleBulkGenerate}
            disabled={isBulkGenerating || isGenerating}
          >
            {isBulkGenerating ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating...</>
            ) : (
              <><Zap className="h-4 w-4 mr-1" /> Generate All Pending</>
            )}
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex justify-between items-center">
            {error}
            <Button variant="ghost" size="sm" onClick={() => setError(null)}><X className="h-3 w-3" /></Button>
          </AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="flex justify-between items-center text-green-400">
            {success}
            <Button variant="ghost" size="sm" onClick={() => setSuccess(null)}><X className="h-3 w-3" /></Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Bulk progress */}
      {isBulkGenerating && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Generating reviews...</span>
            <span>{Math.round(bulkProgress)}%</span>
          </div>
          <Progress value={bulkProgress} className="h-2" />
        </div>
      )}

      {/* Stats */}
      <StatsBar />

      {/* Bulk Settings Bar */}
      <Card className="glass-card steel-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Video className="h-4 w-4 text-purple-400" />
              <span>Default Video Settings</span>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Default Automation Mode</Label>
                <Select
                  value={defaultAutomationMode}
                  onValueChange={(v) => setDefaultAutomationMode(v as AutomationMode)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTOMATION_MODES.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {AUTOMATION_MODES.find((m) => m.value === defaultAutomationMode)?.description}
                </p>
              </div>
              <VideoLengthSelector
                value={videoLengthSeconds}
                onChange={setVideoLengthSeconds}
                label="Default Length for New Reviews"
              />
              <div className="space-y-1">
                <Label className="text-xs">Default Avatar</Label>
                <Select value={selectedAvatar} onValueChange={setSelectedAvatar}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {avatars.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} · {a.gender} · {a.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CSV Import Modal */}
      {showCSVImport && (
        <Card className="glass-card steel-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" /> Import Vine Orders from CSV
            </CardTitle>
            <CardDescription>
              Upload a CSV file or paste CSV data. Headers should include: productName, asin, category, orderDate, reviewDeadline, etv
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Upload CSV File</Label>
              <Input type="file" accept=".csv,.txt" onChange={handleCSVFile} ref={fileInputRef} />
            </div>
            <div>
              <Label>Or Paste CSV Data</Label>
              <Textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={`productName,asin,category,orderDate,reviewDeadline,etv\nWireless Mouse,B0EXAMPLE1,electronics,2026-03-01,2026-04-15,29.99`}
                rows={8}
                className="font-mono text-xs"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCSVImport} className="gradient-steel">
                <Upload className="h-4 w-4 mr-1" /> Import
              </Button>
              <Button variant="outline" onClick={() => { setShowCSVImport(false); setCsvText(""); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Item Form */}
      {showAddForm && (
        <Card className="glass-card steel-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" /> Add Vine Item
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label>Amazon Product URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={addForm.amazonUrl}
                    onChange={(e) => handleAmazonUrlChange(e.target.value)}
                    placeholder="Paste Amazon URL — ASIN auto-extracted"
                    className="flex-1"
                  />
                  {addForm.asin && (
                    <Badge variant="outline" className="whitespace-nowrap self-center">
                      ASIN: {addForm.asin}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Product Name *</Label>
                <Input
                  value={addForm.productName}
                  onChange={(e) => setAddForm({ ...addForm, productName: e.target.value })}
                  placeholder="e.g., Wireless Bluetooth Earbuds"
                />
              </div>
              <div>
                <Label>ASIN</Label>
                <Input
                  value={addForm.asin}
                  onChange={(e) => setAddForm({ ...addForm, asin: e.target.value })}
                  placeholder="Auto-filled from URL or enter manually"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={addForm.category} onValueChange={(v) => setAddForm({ ...addForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["electronics","beauty","home","kitchen","clothing","health","sports","toys","automotive","books","food","pet","office","garden","tools","other"].map((c) => (
                      <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Automation Mode</Label>
                <Select
                  value={addForm.automationMode}
                  onValueChange={(v) => setAddForm({ ...addForm, automationMode: v as AutomationMode })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AUTOMATION_MODES.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{m.label}</span>
                          <span className="text-xs text-muted-foreground">{m.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ETV ($)</Label>
                <Input
                  type="number"
                  value={addForm.etv}
                  onChange={(e) => setAddForm({ ...addForm, etv: e.target.value })}
                  placeholder="29.99"
                />
              </div>
              <div>
                <Label>Order Date</Label>
                <Input
                  type="date"
                  value={addForm.orderDate}
                  onChange={(e) => setAddForm({ ...addForm, orderDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Review Deadline</Label>
                <Input
                  type="date"
                  value={addForm.reviewDeadline}
                  onChange={(e) => setAddForm({ ...addForm, reviewDeadline: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddItem} className="gradient-steel">
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Editor */}
      {editingReview && (
        <Card className="glass-card steel-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" /> Edit Review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Review Title</Label>
              <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div>
              <Label>Review Body</Label>
              <Textarea value={editForm.body} onChange={(e) => setEditForm({ ...editForm, body: e.target.value })} rows={8} />
            </div>
            <div>
              <Label>Star Rating</Label>
              <Select value={String(editForm.rating)} onValueChange={(v) => setEditForm({ ...editForm, rating: parseFloat(v) })}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((r) => (
                    <SelectItem key={r} value={String(r)}>{"★".repeat(Math.floor(r))}{r % 1 ? "½" : ""} ({r})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveEdit} className="gradient-steel">Save Changes</Button>
              <Button variant="outline" onClick={() => setEditingReview(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="glass-card">
          <TabsTrigger value="queue"><Clock className="h-3 w-3 mr-1" /> Review Queue</TabsTrigger>
          <TabsTrigger value="generated"><CheckCircle2 className="h-3 w-3 mr-1" /> Generated</TabsTrigger>
          <TabsTrigger value="avatars"><User className="h-3 w-3 mr-1" /> Avatars</TabsTrigger>
          <TabsTrigger value="video"><Video className="h-3 w-3 mr-1" /> Video Preview</TabsTrigger>
        </TabsList>

        {/* QUEUE TAB */}
        <TabsContent value="queue" className="space-y-4">
          {items.filter((i) => ["pending", "generating", "overdue"].includes(i.status)).length === 0 ? (
            <Card className="glass-card steel-border">
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
                <h3 className="text-lg font-semibold mb-2">No pending reviews</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Import Vine orders via CSV or add items manually to get started.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={() => setShowCSVImport(true)}>
                    <Upload className="h-4 w-4 mr-1" /> Import CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setAddForm((f) => ({ ...f, automationMode: defaultAutomationMode })); setShowAddForm(true); }}>
                    <Plus className="h-4 w-4 mr-1" /> Add Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            items
              .filter((i) => ["pending", "generating", "overdue"].includes(i.status))
              .sort((a, b) => new Date(a.reviewDeadline).getTime() - new Date(b.reviewDeadline).getTime())
              .map((item) => (
                <VineItemCard
                  key={item.id}
                  item={item}
                  avatars={avatars}
                  isGenerating={isGenerating}
                  isScraping={isScraping}
                  videoLength={itemVideoLengths[item.id] ?? videoLengthSeconds}
                  onVideoLengthChange={(s) => setItemVideoLengths((prev) => ({ ...prev, [item.id]: s }))}
                  onGenerate={() => handleGenerateReview(item)}
                  onScrapeImages={() => handleScrapeImages(item)}
                  onDelete={() => { deleteVineItem(item.id); refresh(); }}
                  onPreview={() => previewVideo(item)}
                  onEdit={() => startEditing(item)}
                  onCopy={() => copyReview(item)}
                  onFindPhotos={() => setPhotoFinderItem(item)}
                  onSubmit={() => setSubmissionItem(item)}
                  onGenerateVideo={() => handleGenerateHeyGenVideo(item)}
                  onPhotoUpload={(files) => handlePhotoUpload(item, files)}
                  isGeneratingVideo={generatingVideoItemId === item.id}
                  videoProgress={generatingVideoItemId === item.id ? videoProgress : null}
                />
              ))
          )}
        </TabsContent>

        {/* GENERATED TAB */}
        <TabsContent value="generated" className="space-y-4">
          {items.filter((i) => ["generated", "edited", "submitted"].includes(i.status)).length === 0 ? (
            <Card className="glass-card steel-border">
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
                <h3 className="text-lg font-semibold mb-2">No generated reviews yet</h3>
                <p className="text-sm text-muted-foreground">
                  Add items to your queue and click "Generate" to create AI-powered reviews.
                </p>
              </CardContent>
            </Card>
          ) : (
            items
              .filter((i) => ["generated", "edited", "submitted"].includes(i.status))
              .map((item) => (
                <VineItemCard
                  key={item.id}
                  item={item}
                  avatars={avatars}
                  isGenerating={isGenerating}
                  isScraping={isScraping}
                  videoLength={itemVideoLengths[item.id] ?? (item.generatedReview?.videoLengthSeconds ?? videoLengthSeconds)}
                  onVideoLengthChange={(s) => setItemVideoLengths((prev) => ({ ...prev, [item.id]: s }))}
                  onGenerate={() => handleGenerateReview(item)}
                  onScrapeImages={() => handleScrapeImages(item)}
                  onDelete={() => { deleteVineItem(item.id); refresh(); }}
                  onPreview={() => previewVideo(item)}
                  onEdit={() => startEditing(item)}
                  onCopy={() => copyReview(item)}
                  onFindPhotos={() => setPhotoFinderItem(item)}
                  onSubmit={() => setSubmissionItem(item)}
                  onGenerateVideo={() => handleGenerateHeyGenVideo(item)}
                  onPhotoUpload={(files) => handlePhotoUpload(item, files)}
                  isGeneratingVideo={generatingVideoItemId === item.id}
                  videoProgress={generatingVideoItemId === item.id ? videoProgress : null}
                />
              ))
          )}
        </TabsContent>

        {/* AVATARS TAB */}
        <TabsContent value="avatars">
          <Card className="glass-card steel-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Avatar Profiles</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setShowAvatarUpload(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Upload Avatar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAvatarUpload && (
                <div className="mb-4 p-4 border border-dashed border-slate-600 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Avatar Name</Label>
                      <Input
                        value={avatarForm.name}
                        onChange={(e) => setAvatarForm({ ...avatarForm, name: e.target.value })}
                        placeholder="e.g., My Avatar"
                      />
                    </div>
                    <div>
                      <Label>Gender</Label>
                      <Select value={avatarForm.gender} onValueChange={(v: "male" | "female" | "neutral") => setAvatarForm({ ...avatarForm, gender: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Upload Photo (JPG, PNG, WebP)</Label>
                    <Input type="file" accept="image/*" onChange={handleAvatarUpload} />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowAvatarUpload(false)}>Cancel</Button>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {avatars.map((avatar) => (
                  <div
                    key={avatar.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedAvatar === avatar.id
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-slate-700 hover:border-slate-500"
                    }`}
                    onClick={() => setSelectedAvatar(avatar.id)}
                  >
                    <div className="w-16 h-16 mx-auto rounded-full bg-slate-700 flex items-center justify-center mb-2 overflow-hidden">
                      {avatar.imageUrl && !avatar.imageUrl.startsWith("/avatars/") ? (
                        <img src={avatar.imageUrl} alt={avatar.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-slate-400" />
                      )}
                    </div>
                    <p className="text-xs font-medium text-center">{avatar.name}</p>
                    <p className="text-xs text-muted-foreground text-center capitalize">{avatar.gender} · {avatar.type}</p>
                    {selectedAvatar === avatar.id && (
                      <Badge variant="secondary" className="w-full justify-center mt-1 text-xs">Selected</Badge>
                    )}
                    {avatar.type === "custom" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-1 h-6 text-xs text-red-400 hover:text-red-300"
                        onClick={(e) => { e.stopPropagation(); deleteAvatar(avatar.id); refresh(); }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VIDEO PREVIEW TAB */}
        <TabsContent value="video">
          <Card className="glass-card steel-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" /> Video Preview
              </CardTitle>
              <CardDescription>
                {previewItem
                  ? `Previewing: ${previewItem.productName} · ${getPresetBySeconds(previewItem.generatedReview?.videoLengthSeconds ?? videoLengthSeconds).label}`
                  : "Select a generated review and click Preview to see the video"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {videoScenes.length > 0 ? (
                <>
                  <div className="flex items-center gap-3 flex-wrap">
                    <VideoLengthSelector
                      value={previewItem ? (previewItem.generatedReview?.videoLengthSeconds ?? videoLengthSeconds) : videoLengthSeconds}
                      onChange={(s) => {
                        if (previewItem) {
                          setItemVideoLengths((prev) => ({ ...prev, [previewItem.id]: s }));
                          // Re-render with new preset
                          const preset = getPresetBySeconds(s);
                          const scenes = parseScriptToScenes(
                            previewItem.generatedReview?.videoScript ?? "",
                            [previewItem.imageUrl],
                            preset
                          );
                          setVideoScenes(scenes);
                          setCurrentScene(0);
                          if (canvasRef.current && previewItem.generatedReview) {
                            const avatar = avatars.find((a) => a.id === previewItem.generatedReview?.avatarId);
                            renderVideoPreview(canvasRef.current, {
                              productName: previewItem.productName,
                              rating: previewItem.generatedReview.rating,
                              script: previewItem.generatedReview.videoScript ?? "",
                              productImages: [previewItem.imageUrl],
                              avatarImage: avatar?.imageUrl ?? "",
                              duration: s,
                              width: 640,
                              height: 360,
                              preset,
                            }, scenes, 0);
                          }
                        }
                      }}
                      label="Change Video Length"
                      className="w-48"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentScene === 0}
                        onClick={() => {
                          const next = Math.max(0, currentScene - 1);
                          setCurrentScene(next);
                          if (canvasRef.current && previewItem?.generatedReview) {
                            const preset = getPresetBySeconds(previewItem.generatedReview?.videoLengthSeconds ?? videoLengthSeconds);
                            const avatar = avatars.find((a) => a.id === previewItem.generatedReview?.avatarId);
                            renderVideoPreview(canvasRef.current, {
                              productName: previewItem.productName,
                              rating: previewItem.generatedReview.rating,
                              script: previewItem.generatedReview.videoScript ?? "",
                              productImages: [previewItem.imageUrl],
                              avatarImage: avatar?.imageUrl ?? "",
                              duration: previewItem.generatedReview?.videoLengthSeconds ?? videoLengthSeconds,
                              width: 640, height: 360, preset,
                            }, videoScenes, next);
                          }
                        }}
                      >
                        ← Prev
                      </Button>
                      <span className="text-sm self-center text-muted-foreground">
                        {currentScene + 1} / {videoScenes.length}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentScene >= videoScenes.length - 1}
                        onClick={() => {
                          const next = Math.min(videoScenes.length - 1, currentScene + 1);
                          setCurrentScene(next);
                          if (canvasRef.current && previewItem?.generatedReview) {
                            const preset = getPresetBySeconds(previewItem.generatedReview?.videoLengthSeconds ?? videoLengthSeconds);
                            const avatar = avatars.find((a) => a.id === previewItem.generatedReview?.avatarId);
                            renderVideoPreview(canvasRef.current, {
                              productName: previewItem.productName,
                              rating: previewItem.generatedReview.rating,
                              script: previewItem.generatedReview.videoScript ?? "",
                              productImages: [previewItem.imageUrl],
                              avatarImage: avatar?.imageUrl ?? "",
                              duration: previewItem.generatedReview?.videoLengthSeconds ?? videoLengthSeconds,
                              width: 640, height: 360, preset,
                            }, videoScenes, next);
                          }
                        }}
                      >
                        Next →
                      </Button>
                    </div>
                  </div>
                  <canvas
                    ref={canvasRef}
                    className="w-full rounded-lg border border-slate-700"
                    style={{ maxWidth: 640, display: "block", margin: "0 auto" }}
                  />
                  {videoScenes[currentScene]?.sectionTitle && (
                    <Badge variant="secondary" className="text-xs">
                      Section: {videoScenes[currentScene].sectionTitle}
                    </Badge>
                  )}
                  <p className="text-xs text-muted-foreground text-center">
                    Scene {currentScene + 1} of {videoScenes.length} · {videoScenes[currentScene]?.duration}s per slide
                  </p>
                </>
              ) : (
                <div className="text-center py-12">
                  <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
                  <p className="text-sm text-muted-foreground">
                    Generate a review first, then click the Preview button on any item to see it here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground text-center">
        Review generation powered by free and open-source APIs · Star ratings calculated algorithmically
      </p>

      {/* Photo Finder Modal */}
      {photoFinderItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-background border border-white/10 shadow-2xl">
            <ProductPhotoFinder
              item={photoFinderItem}
              onPhotosSelected={handlePhotosSelected}
              onClose={() => setPhotoFinderItem(null)}
            />
          </div>
        </div>
      )}

      {/* Review Submission Form Modal */}
      {submissionItem && submissionItem.generatedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-background border border-white/10 shadow-2xl">
            <ReviewSubmissionForm
              item={submissionItem}
              review={submissionItem.generatedReview}
              onSave={handleSubmissionSave}
              onClose={() => setSubmissionItem(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── VINE ITEM CARD ─────────────────────────────────────────
interface VineItemCardProps {
  item: VineItem;
  avatars: AvatarProfile[];
  isGenerating: boolean;
  isScraping: boolean;
  videoLength: number;
  onVideoLengthChange: (seconds: number) => void;
  onGenerate: () => void;
  onScrapeImages: () => void;
  onDelete: () => void;
  onPreview: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onFindPhotos: () => void;
  onSubmit: () => void;
  onGenerateVideo: () => void;
  onPhotoUpload: (files: FileList) => void;
  isGeneratingVideo: boolean;
  videoProgress: string | null;
}

function VineItemCard({
  item, avatars, isGenerating, isScraping, videoLength,
  onVideoLengthChange, onGenerate, onScrapeImages, onDelete, onPreview, onEdit, onCopy,
  onFindPhotos, onSubmit, onGenerateVideo, onPhotoUpload,
  isGeneratingVideo, videoProgress,
}: VineItemCardProps) {
  const days = getDaysUntilDeadline(item.reviewDeadline);
  const deadlineColor = getDeadlineColor(item.reviewDeadline);
  const badgeVariant = getDeadlineBadgeVariant(item.reviewDeadline);
  const review = item.generatedReview;

  const statusColors: Record<string, string> = {
    pending: "text-yellow-400",
    generating: "text-purple-400",
    generated: "text-green-400",
    edited: "text-cyan-400",
    submitted: "text-emerald-400",
    overdue: "text-red-400",
  };

  return (
    <Card className="glass-card steel-border">
      <CardContent className="p-4 space-y-3">
        {/* Item header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{item.productName}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {item.asin && (
                <a
                  href={safeAmazonHref(item.amazonUrl, item.asin)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 font-mono"
                >
                  {item.asin}
                </a>
              )}
              <Badge variant="outline" className="text-xs capitalize">{item.category}</Badge>
              <span className={`text-xs font-medium capitalize ${statusColors[item.status]}`}>{item.status}</span>
              <Badge variant="outline" className="text-xs">
                {AUTOMATION_MODES.find((m) => m.value === item.automationMode)?.label || "Full Auto"}
              </Badge>
              {item.etv > 0 && <span className="text-xs text-muted-foreground">ETV: ${item.etv.toFixed(2)}</span>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <Badge variant={badgeVariant} className="text-xs">
              {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`}
            </Badge>
            <p className={`text-xs mt-1 ${deadlineColor}`}>
              {new Date(item.reviewDeadline).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Video length selector per item */}
        <div className="flex items-center gap-3 p-2 bg-slate-800/40 rounded-lg">
          <VideoLengthSelector
            value={videoLength}
            onChange={onVideoLengthChange}
            label="Video Length"
            className="flex-1"
          />
          {review && (
            <div className="text-xs text-muted-foreground text-right">
              <p>Rating: {"★".repeat(Math.floor(review.rating))}{review.rating % 1 ? "½" : ""}</p>
              <p className="mt-1 line-clamp-1">{review.title}</p>
            </div>
          )}
        </div>

        {/* Scraped image sources */}
        {item.scrapedImages && item.scrapedImages.sources.length > 0 && (
          <div className="p-2 bg-slate-800/30 rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-1">Scraped Images:</p>
            <div className="flex gap-1 flex-wrap">
              {item.scrapedImages.sources.map((src) => (
                <Badge key={src} variant="secondary" className="text-xs">
                  {sourceLabel(src)}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {item.scrapedImages.listingImages.length} listing + {item.scrapedImages.reviewImages.length} review images
              {item.scrapedImages.isDemo && " (demo)"}
            </p>
          </div>
        )}

        {/* Review preview */}
        {review && (
          <div className="p-3 bg-slate-800/50 rounded-lg space-y-2">
            <p className="text-xs font-medium">{review.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-3">{review.body}</p>
            {review.pros.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {review.pros.slice(0, 3).map((pro, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">+ {pro}</Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {(item.status === "pending" || item.status === "overdue") && item.automationMode !== "manual" && (
            <>
              <Button size="sm" className="gradient-steel" onClick={onGenerate} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Zap className="h-3 w-3 mr-1" />}
                {item.automationMode === "video_only" ? "Generate Video" :
                 item.automationMode === "photos_only" ? "Scrape Photos" :
                 item.automationMode === "review_only" ? "Generate Review" :
                 "Generate All"}
              </Button>
              {!item.scrapedImages && item.asin && (
                <Button size="sm" variant="outline" onClick={onScrapeImages} disabled={isScraping}>
                  {isScraping ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Search className="h-3 w-3 mr-1" />}
                  Scrape Images
                </Button>
              )}
            </>
          )}
          {review && (
            <>
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Edit3 className="h-3 w-3 mr-1" /> Edit
              </Button>
              <Button size="sm" variant="outline" onClick={onCopy}>
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
              <Button size="sm" variant="outline" onClick={onFindPhotos}>
                <Camera className="h-3 w-3 mr-1" /> Photos
              </Button>
              <Button size="sm" variant="outline" onClick={onSubmit}>
                <FileText className="h-3 w-3 mr-1" /> Submit
              </Button>
              {review.videoScript && !review.videoUrl && (
                <Button size="sm" variant="outline" onClick={onGenerateVideo} disabled={isGeneratingVideo}>
                  {isGeneratingVideo ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Video className="h-3 w-3 mr-1" />}
                  {isGeneratingVideo ? "Generating..." : "HeyGen Video"}
                </Button>
              )}
              {review.videoUrl && (
                <a href={review.videoUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="text-green-400">
                    <Play className="h-3 w-3 mr-1" /> Watch Video
                  </Button>
                </a>
              )}
              {review.videoScript && (
                <Button size="sm" variant="outline" onClick={onPreview}>
                  <Eye className="h-3 w-3 mr-1" /> Preview
                </Button>
              )}
              <label className="inline-flex">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && onPhotoUpload(e.target.files)}
                />
                <Button size="sm" variant="outline" asChild>
                  <span><Upload className="h-3 w-3 mr-1" /> Upload Photos</span>
                </Button>
              </label>
            </>
          )}
          <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 ml-auto" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Video generation progress */}
        {isGeneratingVideo && videoProgress && (
          <div className="flex items-center gap-2 p-2 bg-purple-900/30 rounded text-xs text-purple-300">
            <Loader2 className="h-3 w-3 animate-spin" />
            {videoProgress}
          </div>
        )}

        {/* Photo count indicator */}
        {review && (review.photos || []).filter(p => p.isSelected).length > 0 && (
          <div className="text-xs text-muted-foreground">
            {(review.photos || []).filter(p => p.isSelected).length}/8 photos selected
            {(review.photos || []).some(p => p.url) && " (EXIF stripped)"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
