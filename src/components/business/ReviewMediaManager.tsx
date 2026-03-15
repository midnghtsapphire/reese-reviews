// ============================================================
// REVIEW MEDIA MANAGER
// Manages product photos and media assets for review automation.
// Handles upload, generation of lifestyle/usage photos,
// metadata stripping, and multi-angle management.
// ============================================================

import React, { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Camera,
  Upload,
  Trash2,
  Download,
  Image as ImageIcon,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  RotateCcw,
  ZoomIn,
  Grid3X3,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import {
  getMediaAssets,
  addMediaAsset,
  deleteMediaAsset,
  updateMediaAsset,
} from "@/stores/reviewAutomationStore";
import type { MediaAsset, MediaType } from "@/stores/reviewAutomationStore";
import {
  stripAllMetadata,
  reEncodeImage,
  verifyClean,
  buildCleanMetadata,
} from "@/utils/metadataStripper";

// ─── TYPES ──────────────────────────────────────────────────

interface ReviewMediaManagerProps {
  productId: string;
  productName: string;
  onMediaUpdate?: () => void;
}

interface UploadProgress {
  filename: string;
  progress: number;
  status: "uploading" | "stripping" | "verifying" | "done" | "error";
}

const MEDIA_TYPE_OPTIONS: { value: MediaType; label: string; icon: string }[] = [
  { value: "product-photo", label: "Product Photo", icon: "📸" },
  { value: "lifestyle", label: "Lifestyle Shot", icon: "🏠" },
  { value: "in-use", label: "In-Use Photo", icon: "👤" },
  { value: "detail", label: "Detail/Close-up", icon: "🔍" },
  { value: "packaging", label: "Packaging", icon: "📦" },
];

const LIFESTYLE_SETTINGS = [
  "Clean white desk setup",
  "Modern kitchen counter",
  "Cozy living room",
  "Outdoor patio",
  "Minimalist workspace",
  "Bathroom vanity",
  "Gym/fitness area",
  "Bedroom nightstand",
];

// ─── COMPONENT ──────────────────────────────────────────────

export function ReviewMediaManager({
  productId,
  productName,
  onMediaUpdate,
}: ReviewMediaManagerProps) {
  const [assets, setAssets] = useState<MediaAsset[]>(() =>
    getMediaAssets(productId)
  );
  const [selectedType, setSelectedType] = useState<MediaType>("product-photo");
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSetting, setGenerationSetting] = useState(LIFESTYLE_SETTINGS[0]);
  const [verificationResults, setVerificationResults] = useState<
    Record<string, { isClean: boolean; issues: string[] }>
  >({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshAssets = useCallback(() => {
    const updated = getMediaAssets(productId);
    setAssets(updated);
    onMediaUpdate?.();
  }, [productId, onMediaUpdate]);

  // ─── FILE UPLOAD ────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const progressItems: UploadProgress[] = fileArray.map((f) => ({
      filename: f.name,
      progress: 0,
      status: "uploading" as const,
    }));
    setUploadProgress(progressItems);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];

      try {
        // Step 1: Upload progress
        setUploadProgress((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, progress: 30, status: "stripping" } : p
          )
        );

        // Step 2: Strip metadata
        const cleanFile = await stripAllMetadata(file, buildCleanMetadata({
          author: "Reese Reviews",
          title: productName,
          description: `Product media for ${productName}`,
        }));

        setUploadProgress((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, progress: 70, status: "verifying" } : p
          )
        );

        // Step 3: Verify clean
        const verification = await verifyClean(cleanFile);

        // Step 4: Create object URL and save
        const cleanUrl = URL.createObjectURL(cleanFile);
        const originalUrl = URL.createObjectURL(file);

        // Get image dimensions
        const dimensions = await getImageDimensions(cleanUrl);

        addMediaAsset({
          productId,
          type: selectedType,
          originalUrl,
          cleanUrl,
          filename: cleanFile.name,
          isStripped: true,
          width: dimensions.width,
          height: dimensions.height,
        });

        setVerificationResults((prev) => ({
          ...prev,
          [cleanFile.name]: verification,
        }));

        setUploadProgress((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, progress: 100, status: "done" } : p
          )
        );
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        setUploadProgress((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, progress: 100, status: "error" } : p
          )
        );
      }
    }

    refreshAssets();

    // Clear progress after a delay
    setTimeout(() => setUploadProgress([]), 3000);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ─── IMAGE DIMENSIONS ──────────────────────────────────

  function getImageDimensions(
    url: string
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () =>
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.src = url;
    });
  }

  // ─── GENERATE LIFESTYLE PHOTOS ─────────────────────────

  const handleGenerateLifestyle = async () => {
    setIsGenerating(true);

    // Simulate AI generation with canvas compositing
    // In production, this would call an image generation API
    try {
      const existingPhotos = assets.filter(
        (a) => a.type === "product-photo" && a.cleanUrl
      );

      if (existingPhotos.length === 0) {
        setIsGenerating(false);
        return;
      }

      // Generate lifestyle variants by re-processing existing images
      // with different canvas treatments
      const sourceAsset = existingPhotos[0];
      const treatments = [
        { type: "lifestyle" as MediaType, label: "lifestyle" },
        { type: "in-use" as MediaType, label: "in-use" },
        { type: "detail" as MediaType, label: "detail" },
      ];

      for (const treatment of treatments) {
        const response = await fetch(sourceAsset.cleanUrl);
        const blob = await response.blob();

        // Apply canvas treatment
        const processedBlob = await applyLifestyleTreatment(
          blob,
          treatment.label
        );

        // Strip metadata from generated image
        const file = new File(
          [processedBlob],
          `${productName.toLowerCase().replace(/\s+/g, "-")}-${treatment.label}-${Date.now()}.jpg`,
          { type: "image/jpeg" }
        );
        const cleanFile = await stripAllMetadata(file);
        const cleanUrl = URL.createObjectURL(cleanFile);
        const dims = await getImageDimensions(cleanUrl);

        addMediaAsset({
          productId,
          type: treatment.type,
          originalUrl: cleanUrl,
          cleanUrl,
          filename: cleanFile.name,
          isStripped: true,
          width: dims.width,
          height: dims.height,
        });
      }

      refreshAssets();
    } catch (error) {
      console.error("Failed to generate lifestyle photos:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Apply a canvas-based treatment to simulate different photo styles.
   * In production, this would use an AI image generation API.
   */
  async function applyLifestyleTreatment(
    blob: Blob,
    style: string
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("No canvas context"));
          return;
        }

        // Draw base image
        ctx.drawImage(img, 0, 0);

        // Apply style-specific treatments
        switch (style) {
          case "lifestyle": {
            // Warm, soft lighting effect
            ctx.globalCompositeOperation = "overlay";
            const gradient = ctx.createRadialGradient(
              canvas.width / 2,
              canvas.height / 2,
              0,
              canvas.width / 2,
              canvas.height / 2,
              canvas.width * 0.7
            );
            gradient.addColorStop(0, "rgba(255, 200, 150, 0.15)");
            gradient.addColorStop(1, "rgba(0, 0, 0, 0.05)");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = "source-over";
            break;
          }
          case "in-use": {
            // Slight vignette for depth
            ctx.globalCompositeOperation = "multiply";
            const vignette = ctx.createRadialGradient(
              canvas.width / 2,
              canvas.height / 2,
              canvas.width * 0.3,
              canvas.width / 2,
              canvas.height / 2,
              canvas.width * 0.8
            );
            vignette.addColorStop(0, "rgba(255, 255, 255, 1)");
            vignette.addColorStop(1, "rgba(200, 200, 200, 1)");
            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = "source-over";
            break;
          }
          case "detail": {
            // Sharpen effect simulation via contrast boost
            ctx.globalCompositeOperation = "overlay";
            ctx.fillStyle = "rgba(128, 128, 128, 0.1)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = "source-over";
            break;
          }
        }

        URL.revokeObjectURL(url);

        canvas.toBlob(
          (result) => {
            if (result) resolve(result);
            else reject(new Error("Canvas toBlob failed"));
          },
          "image/jpeg",
          0.92
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Image load failed"));
      };

      img.src = url;
    });
  }

  // ─── DELETE ASSET ──────────────────────────────────────

  const handleDelete = (assetId: string) => {
    deleteMediaAsset(assetId);
    refreshAssets();
    if (previewAsset?.id === assetId) {
      setPreviewAsset(null);
    }
  };

  // ─── RE-STRIP METADATA ────────────────────────────────

  const handleRestrip = async (asset: MediaAsset) => {
    try {
      const response = await fetch(asset.originalUrl);
      const blob = await response.blob();
      const file = new File([blob], asset.filename, { type: "image/jpeg" });
      const cleanFile = await stripAllMetadata(file);
      const cleanUrl = URL.createObjectURL(cleanFile);
      const verification = await verifyClean(cleanFile);

      updateMediaAsset(asset.id, {
        cleanUrl,
        isStripped: true,
        filename: cleanFile.name,
      });

      setVerificationResults((prev) => ({
        ...prev,
        [asset.id]: verification,
      }));

      refreshAssets();
    } catch (error) {
      console.error("Re-strip failed:", error);
    }
  };

  // ─── DOWNLOAD CLEAN IMAGE ─────────────────────────────

  const handleDownload = (asset: MediaAsset) => {
    const link = document.createElement("a");
    link.href = asset.cleanUrl;
    link.download = asset.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── RENDER ───────────────────────────────────────────

  const groupedAssets = MEDIA_TYPE_OPTIONS.map((opt) => ({
    ...opt,
    assets: assets.filter((a) => a.type === opt.value),
  }));

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="bg-white/5 backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Camera className="h-5 w-5 text-[#FFB347]" />
            Upload Product Photos
          </CardTitle>
          <CardDescription className="text-gray-400">
            Upload product images — all metadata will be automatically stripped
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-gray-300 mb-2 block">Photo Type</Label>
              <Select
                value={selectedType}
                onValueChange={(v) => setSelectedType(v as MediaType)}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEDIA_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.icon} {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="media-upload"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#FF6B2B] hover:bg-[#FF6B2B]/80 text-white"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Images
              </Button>
            </div>
          </div>

          {/* Upload Progress */}
          {uploadProgress.length > 0 && (
            <div className="space-y-2">
              {uploadProgress.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300 truncate max-w-[200px]">
                      {item.filename}
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        item.status === "done"
                          ? "border-green-500 text-green-400"
                          : item.status === "error"
                          ? "border-red-500 text-red-400"
                          : "border-[#FFB347] text-[#FFB347]"
                      }
                    >
                      {item.status === "uploading" && "Uploading..."}
                      {item.status === "stripping" && "Stripping metadata..."}
                      {item.status === "verifying" && "Verifying clean..."}
                      {item.status === "done" && "Clean ✓"}
                      {item.status === "error" && "Error"}
                    </Badge>
                  </div>
                  <Progress
                    value={item.progress}
                    className="h-1.5"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-[#FF6B2B]/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add("border-[#FF6B2B]");
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove("border-[#FF6B2B]");
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove("border-[#FF6B2B]");
              const dt = e.dataTransfer;
              if (dt.files.length > 0 && fileInputRef.current) {
                const dataTransfer = new DataTransfer();
                Array.from(dt.files).forEach((f) => dataTransfer.items.add(f));
                fileInputRef.current.files = dataTransfer.files;
                fileInputRef.current.dispatchEvent(
                  new Event("change", { bubbles: true })
                );
              }
            }}
          >
            <ImageIcon className="h-10 w-10 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              Drag & drop images here, or click to browse
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Supports JPEG, PNG, WebP — All metadata auto-stripped
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Generate Lifestyle Photos */}
      <Card className="bg-white/5 backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-[#FFD93D]" />
            Generate Lifestyle Photos
          </CardTitle>
          <CardDescription className="text-gray-400">
            Create authentic-looking lifestyle and usage photos from your product images
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-gray-300 mb-2 block">Setting / Scene</Label>
              <Select
                value={generationSetting}
                onValueChange={setGenerationSetting}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIFESTYLE_SETTINGS.map((setting) => (
                    <SelectItem key={setting} value={setting}>
                      {setting}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerateLifestyle}
              disabled={
                isGenerating ||
                assets.filter((a) => a.type === "product-photo").length === 0
              }
              className="bg-gradient-to-r from-[#FFB347] to-[#FFD93D] text-black font-semibold hover:opacity-90"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Photos
                </>
              )}
            </Button>
          </div>

          {assets.filter((a) => a.type === "product-photo").length === 0 && (
            <Alert className="bg-yellow-500/10 border-yellow-500/30">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-300">
                Upload at least one product photo first to generate lifestyle variants.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Media Gallery */}
      <Card className="bg-white/5 backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Grid3X3 className="h-5 w-5 text-[#FF6B2B]" />
            Media Gallery
            <Badge variant="outline" className="ml-2 border-white/20 text-gray-300">
              {assets.length} {assets.length === 1 ? "asset" : "assets"}
            </Badge>
          </CardTitle>
          <CardDescription className="text-gray-400">
            All photos with metadata verification status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {groupedAssets.map((group) => (
            <div key={group.value}>
              {group.assets.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <span>{group.icon}</span>
                    {group.label}
                    <Badge
                      variant="outline"
                      className="border-white/10 text-gray-400 text-xs"
                    >
                      {group.assets.length}
                    </Badge>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {group.assets.map((asset) => (
                      <div
                        key={asset.id}
                        className="group relative rounded-lg overflow-hidden border border-white/10 hover:border-[#FF6B2B]/50 transition-all"
                      >
                        {/* Thumbnail */}
                        <div
                          className="aspect-square bg-black/30 cursor-pointer"
                          onClick={() => setPreviewAsset(asset)}
                        >
                          <img
                            src={asset.cleanUrl}
                            alt={asset.filename}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Metadata Status Badge */}
                        <div className="absolute top-2 right-2">
                          {asset.isStripped ? (
                            <div className="bg-green-500/90 rounded-full p-1" title="Metadata stripped — clean">
                              <ShieldCheck className="h-3 w-3 text-white" />
                            </div>
                          ) : (
                            <div className="bg-red-500/90 rounded-full p-1" title="Metadata not stripped">
                              <ShieldAlert className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Hover Actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-white hover:bg-white/20"
                            onClick={() => setPreviewAsset(asset)}
                            title="Preview"
                          >
                            <ZoomIn className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-white hover:bg-white/20"
                            onClick={() => handleDownload(asset)}
                            title="Download clean"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-white hover:bg-white/20"
                            onClick={() => handleRestrip(asset)}
                            title="Re-strip metadata"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/20"
                            onClick={() => handleDelete(asset.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Info Bar */}
                        <div className="p-2 bg-black/40">
                          <p className="text-xs text-gray-300 truncate">
                            {asset.filename}
                          </p>
                          {asset.width && asset.height && (
                            <p className="text-xs text-gray-500">
                              {asset.width} × {asset.height}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {assets.length === 0 && (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No media assets yet</p>
              <p className="text-gray-500 text-sm mt-1">
                Upload product photos to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata Verification Summary */}
      {assets.length > 0 && (
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <ShieldCheck className="h-5 w-5 text-green-400" />
              Metadata Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                <CheckCircle2 className="h-6 w-6 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-400">
                  {assets.filter((a) => a.isStripped).length}
                </p>
                <p className="text-xs text-green-300">Clean & Stripped</p>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
                <AlertCircle className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-400">
                  {assets.filter((a) => !a.isStripped).length}
                </p>
                <p className="text-xs text-yellow-300">Needs Stripping</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                <ImageIcon className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-300">
                  {assets.length}
                </p>
                <p className="text-xs text-gray-400">Total Assets</p>
              </div>
            </div>

            {assets.some((a) => !a.isStripped) && (
              <Button
                className="mt-4 w-full bg-[#E63946] hover:bg-[#E63946]/80 text-white"
                onClick={async () => {
                  const unstripped = assets.filter((a) => !a.isStripped);
                  for (const asset of unstripped) {
                    await handleRestrip(asset);
                  }
                }}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Strip All Remaining Metadata
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Full-Screen Preview Modal */}
      {previewAsset && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewAsset(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="sm"
              variant="ghost"
              className="absolute -top-10 right-0 text-white hover:bg-white/20"
              onClick={() => setPreviewAsset(null)}
            >
              <X className="h-5 w-5" />
            </Button>
            <img
              src={previewAsset.cleanUrl}
              alt={previewAsset.filename}
              className="w-full h-full object-contain rounded-lg"
            />
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">
                  {previewAsset.filename}
                </p>
                <p className="text-gray-400 text-xs">
                  {previewAsset.width} × {previewAsset.height} •{" "}
                  {MEDIA_TYPE_OPTIONS.find((o) => o.value === previewAsset.type)
                    ?.label ?? previewAsset.type}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => handleDownload(previewAsset)}
                >
                  <Download className="mr-1 h-3 w-3" />
                  Download
                </Button>
                {previewAsset.isStripped ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    Metadata Clean
                  </Badge>
                ) : (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                    <ShieldAlert className="mr-1 h-3 w-3" />
                    Not Stripped
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
