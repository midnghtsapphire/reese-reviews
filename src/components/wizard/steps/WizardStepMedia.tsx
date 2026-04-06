// ============================================================
// WIZARD STEP 4: MEDIA ASSEMBLY
// Select product photos, generate video with avatar overlay.
// Supports drag-and-drop, file picker, and URL import.
// ============================================================

import React, { useState, useCallback, useRef } from "react";
import {
  Camera,
  Upload,
  Trash2,
  Plus,
  Film,
  Image as ImageIcon,
  GripVertical,
  Link2,
  Loader2,
  Play,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { WizardData } from "../ReviewPublishingWizard";

// ─── TYPES ──────────────────────────────────────────────────

interface Props {
  data: WizardData;
  updateData: (patch: Partial<WizardData>) => void;
}

interface MediaAsset {
  id: string;
  url: string;
  type: "photo" | "video";
  caption?: string;
}

// ─── COMPONENT ──────────────────────────────────────────────

export function WizardStepMedia({ data, updateData }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const newAssets: MediaAsset[] = [];
      Array.from(files).forEach((file) => {
        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");
        if (!isVideo && !isImage) return;

        const url = URL.createObjectURL(file);
        newAssets.push({
          id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          url,
          type: isVideo ? "video" : "photo",
          caption: file.name.replace(/\.[^.]+$/, ""),
        });
      });

      updateData({
        mediaAssets: [...data.mediaAssets, ...newAssets],
      });
    },
    [data.mediaAssets, updateData]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFilesSelected(e.dataTransfer.files);
    },
    [handleFilesSelected]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleAddUrl = useCallback(() => {
    if (!urlInput.trim()) return;
    const isVideo = /\.(mp4|webm|mov|avi)$/i.test(urlInput);
    const newAsset: MediaAsset = {
      id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      url: urlInput,
      type: isVideo ? "video" : "photo",
      caption: "",
    };
    updateData({
      mediaAssets: [...data.mediaAssets, newAsset],
    });
    setUrlInput("");
  }, [urlInput, data.mediaAssets, updateData]);

  const handleRemoveAsset = useCallback(
    (id: string) => {
      updateData({
        mediaAssets: data.mediaAssets.filter((a) => a.id !== id),
      });
    },
    [data.mediaAssets, updateData]
  );

  const handleUpdateCaption = useCallback(
    (id: string, caption: string) => {
      updateData({
        mediaAssets: data.mediaAssets.map((a) =>
          a.id === id ? { ...a, caption } : a
        ),
      });
    },
    [data.mediaAssets, updateData]
  );

  const handleGenerateVideo = useCallback(async () => {
    setIsGeneratingVideo(true);
    // Simulate video generation (in production, this calls the VideoService)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Create a placeholder video URL
    const videoUrl = data.mediaAssets.find((a) => a.type === "video")?.url ?? "";
    updateData({
      videoUrl: videoUrl || "generated-review-video.mp4",
      videoDuration: 45, // Simulated duration
    });
    setIsGeneratingVideo(false);
  }, [data.mediaAssets, updateData]);

  const addProductImage = useCallback(() => {
    if (!data.vineItem) return;
    const newAsset: MediaAsset = {
      id: `media-product-${Date.now()}`,
      url: data.vineItem.imageUrl,
      type: "photo",
      caption: `${data.vineItem.productName} — Product Image`,
    };
    updateData({
      mediaAssets: [...data.mediaAssets, newAsset],
    });
  }, [data.vineItem, data.mediaAssets, updateData]);

  const photoCount = data.mediaAssets.filter((a) => a.type === "photo").length;
  const videoCount = data.mediaAssets.filter((a) => a.type === "video").length;

  return (
    <div className="space-y-4">
      {/* Quick add product image */}
      {data.vineItem && (
        <div className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800/50 p-3">
          <img
            src={data.vineItem.imageUrl}
            alt={data.vineItem.productName}
            className="h-12 w-12 rounded-lg object-cover"
          />
          <div className="flex-1">
            <p className="text-sm text-gray-300">
              Add the product image from your Vine item
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={addProductImage}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-all ${
          isDragging
            ? "border-amber-500 bg-amber-500/10"
            : "border-gray-700 bg-gray-800/30 hover:border-gray-600"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="hidden"
        />
        <Upload
          className={`h-8 w-8 mx-auto mb-2 ${
            isDragging ? "text-amber-400" : "text-gray-500"
          }`}
        />
        <p className="text-sm text-gray-300 mb-1">
          Drag & drop photos or videos here
        </p>
        <p className="text-xs text-gray-500 mb-3">
          Supports JPG, PNG, WebP, MP4, WebM
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera className="h-4 w-4 mr-1" />
          Browse Files
        </Button>
      </div>

      {/* URL import */}
      <div className="flex gap-2">
        <Input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Paste image or video URL..."
          className="bg-gray-800 border-gray-700 text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
        />
        <Button variant="outline" size="sm" onClick={handleAddUrl}>
          <Link2 className="h-4 w-4 mr-1" />
          Add URL
        </Button>
      </div>

      {/* Media grid */}
      {data.mediaAssets.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-300">
              {photoCount} photo{photoCount !== 1 ? "s" : ""},{" "}
              {videoCount} video{videoCount !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {data.mediaAssets.map((asset) => (
              <div
                key={asset.id}
                className="relative group rounded-lg overflow-hidden border border-gray-700 bg-gray-800"
              >
                {asset.type === "photo" ? (
                  <img
                    src={asset.url}
                    alt={asset.caption || "Media"}
                    className="w-full aspect-square object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/200x200/1a1a2e/f59e0b?text=Image";
                    }}
                  />
                ) : (
                  <div className="w-full aspect-square bg-gray-900 flex items-center justify-center">
                    <Film className="h-8 w-8 text-gray-500" />
                  </div>
                )}

                {/* Badge */}
                <Badge
                  className={`absolute top-2 left-2 text-[10px] ${
                    asset.type === "video"
                      ? "bg-red-500/80"
                      : "bg-blue-500/80"
                  }`}
                >
                  {asset.type === "video" ? (
                    <Film className="h-3 w-3 mr-0.5" />
                  ) : (
                    <ImageIcon className="h-3 w-3 mr-0.5" />
                  )}
                  {asset.type}
                </Badge>

                {/* Delete */}
                <button
                  onClick={() => handleRemoveAsset(asset.id)}
                  className="absolute top-2 right-2 h-6 w-6 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3 text-white" />
                </button>

                {/* Caption */}
                <div className="p-2">
                  <Input
                    value={asset.caption || ""}
                    onChange={(e) =>
                      handleUpdateCaption(asset.id, e.target.value)
                    }
                    placeholder="Caption..."
                    className="bg-transparent border-0 border-b border-gray-700 rounded-none text-xs h-6 px-0 focus:ring-0"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video generation */}
      {data.mediaAssets.length > 0 && (
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
          <h4 className="text-sm font-semibold text-gray-200 mb-2 flex items-center gap-2">
            <Film className="h-4 w-4 text-amber-400" />
            Review Video
          </h4>
          <p className="text-xs text-gray-400 mb-3">
            Generate a review video from your photos with avatar overlay.
            {data.videoUrl && " Video has been generated."}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleGenerateVideo}
              disabled={isGeneratingVideo}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              {isGeneratingVideo ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-1" />
              )}
              {isGeneratingVideo
                ? "Generating..."
                : data.videoUrl
                ? "Regenerate Video"
                : "Generate Video"}
            </Button>
            {data.videoUrl && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                {data.videoDuration}s video ready
                {data.videoDuration <= 60 && " (Shorts eligible)"}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
