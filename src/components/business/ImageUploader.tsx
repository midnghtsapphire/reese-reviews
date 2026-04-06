// ============================================================
// IMAGE UPLOADER COMPONENT
// Drag-and-drop + file picker for review images.
// Auto-resizes, optimizes, and uploads to Supabase Storage.
// ============================================================

import React, { useState, useCallback, useRef } from "react";
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  GripVertical,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Link2,
  X,
  ZoomIn,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  uploadReviewImage,
  uploadFromUrl,
  deleteReviewImage,
  validateImageFile,
  type UploadedImage,
  type UploadProgress,
} from "@/services/imageUploadService";

// ─── TYPES ──────────────────────────────────────────────────

interface Props {
  reviewId: string;
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  className?: string;
}

// ─── COMPONENT ──────────────────────────────────────────────

export function ImageUploader({
  reviewId,
  images,
  onImagesChange,
  maxImages = 20,
  className = "",
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<
    Record<string, UploadProgress>
  >({});
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [previewImage, setPreviewImage] = useState<UploadedImage | null>(null);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploading = Object.values(uploadProgress).some(
    (p) => p.status === "uploading" || p.status === "resizing"
  );

  // Handle file selection
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = maxImages - images.length;

      if (remaining <= 0) {
        alert(`Maximum ${maxImages} images allowed`);
        return;
      }

      const filesToUpload = fileArray.slice(0, remaining);

      for (const file of filesToUpload) {
        const error = validateImageFile(file);
        if (error) {
          setUploadProgress((prev) => ({
            ...prev,
            [file.name]: {
              fileName: file.name,
              progress: 0,
              status: "error",
              error,
            },
          }));
          continue;
        }

        try {
          const uploaded = await uploadReviewImage(
            file,
            reviewId,
            (progress) => {
              setUploadProgress((prev) => ({
                ...prev,
                [file.name]: progress,
              }));
            }
          );

          onImagesChange([...images, uploaded]);

          // Clear progress after a delay
          setTimeout(() => {
            setUploadProgress((prev) => {
              const next = { ...prev };
              delete next[file.name];
              return next;
            });
          }, 2000);
        } catch (err) {
          setUploadProgress((prev) => ({
            ...prev,
            [file.name]: {
              fileName: file.name,
              progress: 0,
              status: "error",
              error: err instanceof Error ? err.message : "Upload failed",
            },
          }));
        }
      }
    },
    [images, maxImages, reviewId, onImagesChange]
  );

  // Handle URL import
  const handleUrlImport = useCallback(async () => {
    if (!urlInput.trim()) return;

    try {
      setUploadProgress((prev) => ({
        ...prev,
        [urlInput]: {
          fileName: "URL import",
          progress: 0,
          status: "pending",
        },
      }));

      const uploaded = await uploadFromUrl(
        urlInput,
        reviewId,
        undefined,
        (progress) => {
          setUploadProgress((prev) => ({
            ...prev,
            [urlInput]: progress,
          }));
        }
      );

      onImagesChange([...images, uploaded]);
      setUrlInput("");
      setShowUrlInput(false);

      setTimeout(() => {
        setUploadProgress((prev) => {
          const next = { ...prev };
          delete next[urlInput];
          return next;
        });
      }, 2000);
    } catch (err) {
      setUploadProgress((prev) => ({
        ...prev,
        [urlInput]: {
          fileName: "URL import",
          progress: 0,
          status: "error",
          error: err instanceof Error ? err.message : "Import failed",
        },
      }));
    }
  }, [urlInput, reviewId, images, onImagesChange]);

  // Handle delete
  const handleDelete = useCallback(
    async (image: UploadedImage) => {
      await deleteReviewImage(image);
      onImagesChange(images.filter((img) => img.id !== image.id));
    },
    [images, onImagesChange]
  );

  // Handle caption update
  const handleCaptionUpdate = useCallback(
    (imageId: string, caption: string) => {
      onImagesChange(
        images.map((img) =>
          img.id === imageId ? { ...img, caption } : img
        )
      );
      setEditingCaption(null);
    },
    [images, onImagesChange]
  );

  // Handle alt text update
  const handleAltTextUpdate = useCallback(
    (imageId: string, altText: string) => {
      onImagesChange(
        images.map((img) =>
          img.id === imageId ? { ...img, altText } : img
        )
      );
    },
    [images, onImagesChange]
  );

  // Drag and drop handlers
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Reorder images
  const handleMoveImage = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (toIndex < 0 || toIndex >= images.length) return;
      const newImages = [...images];
      const [moved] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, moved);
      onImagesChange(
        newImages.map((img, i) => ({ ...img, sortOrder: i }))
      );
    },
    [images, onImagesChange]
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
          isDragging
            ? "border-amber-500 bg-amber-500/10"
            : "border-gray-700 bg-gray-800/30 hover:border-gray-600"
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={(e) => handleFiles(e.target.files ?? [])}
          className="hidden"
        />

        <Upload
          className={`h-8 w-8 mx-auto mb-2 ${
            isDragging ? "text-amber-400" : "text-gray-500"
          }`}
        />
        <p className="text-sm text-gray-300">
          Drag & drop images here, or click to browse
        </p>
        <p className="text-xs text-gray-500 mt-1">
          JPG, PNG, WebP, GIF — Max {MAX_FILE_SIZE_MB}MB per file —{" "}
          {images.length}/{maxImages} images
        </p>

        {/* URL import toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 text-xs text-gray-400"
          onClick={(e) => {
            e.stopPropagation();
            setShowUrlInput(!showUrlInput);
          }}
        >
          <Link2 className="h-3 w-3 mr-1" />
          Import from URL
        </Button>
      </div>

      {/* URL input */}
      {showUrlInput && (
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste image URL..."
            className="bg-gray-800 border-gray-700 text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleUrlImport()}
          />
          <Button size="sm" onClick={handleUrlImport} disabled={!urlInput.trim()}>
            Import
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowUrlInput(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Upload progress */}
      {Object.entries(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([key, progress]) => (
            <div
              key={key}
              className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800/50 p-2"
            >
              {progress.status === "complete" ? (
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              ) : progress.status === "error" ? (
                <AlertCircle className="h-4 w-4 text-red-400" />
              ) : (
                <Loader2 className="h-4 w-4 text-amber-400 animate-spin" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 truncate">
                  {progress.fileName}
                </p>
                {progress.error && (
                  <p className="text-[10px] text-red-400">{progress.error}</p>
                )}
              </div>
              <Badge
                className={`text-[10px] ${
                  progress.status === "complete"
                    ? "bg-green-500/20 text-green-400"
                    : progress.status === "error"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}
              >
                {progress.status === "complete"
                  ? "Done"
                  : progress.status === "error"
                  ? "Failed"
                  : `${progress.progress}%`}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative group rounded-lg overflow-hidden border border-gray-700 bg-gray-800"
            >
              {/* Image */}
              <div className="relative aspect-square">
                <img
                  src={image.thumbnailUrl || image.originalUrl}
                  alt={image.altText || image.caption || image.fileName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {/* Overlay controls */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPreviewImage(image)}
                    className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
                  >
                    <ZoomIn className="h-4 w-4 text-white" />
                  </button>
                  <button
                    onClick={() => handleDelete(image)}
                    className="h-8 w-8 rounded-full bg-red-500/60 hover:bg-red-500/80 flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4 text-white" />
                  </button>
                </div>

                {/* Sort order badge */}
                <Badge className="absolute top-1 left-1 text-[10px] bg-black/60">
                  {index + 1}
                </Badge>

                {/* Reorder buttons */}
                <div className="absolute top-1 right-1 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {index > 0 && (
                    <button
                      onClick={() => handleMoveImage(index, index - 1)}
                      className="h-5 w-5 rounded bg-black/60 hover:bg-black/80 flex items-center justify-center text-white text-[10px]"
                    >
                      ↑
                    </button>
                  )}
                  {index < images.length - 1 && (
                    <button
                      onClick={() => handleMoveImage(index, index + 1)}
                      className="h-5 w-5 rounded bg-black/60 hover:bg-black/80 flex items-center justify-center text-white text-[10px]"
                    >
                      ↓
                    </button>
                  )}
                </div>
              </div>

              {/* Caption / Alt text */}
              <div className="p-2 space-y-1">
                {editingCaption === image.id ? (
                  <Input
                    defaultValue={image.caption || ""}
                    placeholder="Caption..."
                    className="bg-transparent border-0 border-b border-gray-700 rounded-none text-xs h-6 px-0"
                    autoFocus
                    onBlur={(e) =>
                      handleCaptionUpdate(image.id, e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleCaptionUpdate(
                          image.id,
                          (e.target as HTMLInputElement).value
                        );
                      }
                    }}
                  />
                ) : (
                  <p
                    className="text-[10px] text-gray-400 truncate cursor-pointer hover:text-gray-300"
                    onClick={() => setEditingCaption(image.id)}
                  >
                    {image.caption || (
                      <span className="italic text-gray-600">
                        Add caption...
                      </span>
                    )}
                  </p>
                )}
                <p className="text-[9px] text-gray-600">
                  {image.width}×{image.height} •{" "}
                  {(image.sizeBytes / 1024).toFixed(0)}KB
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox preview */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
            onClick={() => setPreviewImage(null)}
          >
            <X className="h-6 w-6 text-white" />
          </button>
          <img
            src={previewImage.largeUrl || previewImage.originalUrl}
            alt={previewImage.altText || previewImage.caption || "Preview"}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {previewImage.caption && (
            <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-sm bg-black/60 px-4 py-2 rounded-lg">
              {previewImage.caption}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const MAX_FILE_SIZE_MB = 10;
