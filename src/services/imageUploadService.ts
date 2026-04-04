// ============================================================
// IMAGE UPLOAD SERVICE — SUPABASE STORAGE
// Upload, resize, optimize, and manage review images.
// Supports drag-and-drop, file picker, and URL import.
// ============================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─── CONFIGURATION ──────────────────────────────────────────

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const BUCKET_NAME = "review-images";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const THUMBNAIL_SIZE = 300;
const MEDIUM_SIZE = 800;
const LARGE_SIZE = 1600;

// ─── TYPES ──────────────────────────────────────────────────

export interface UploadedImage {
  id: string;
  fileName: string;
  originalUrl: string;
  thumbnailUrl: string;
  mediumUrl: string;
  largeUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  mimeType: string;
  uploadedAt: string;
  reviewId?: string;
  caption?: string;
  altText?: string;
  sortOrder: number;
}

export interface UploadProgress {
  fileName: string;
  progress: number; // 0-100
  status: "pending" | "resizing" | "uploading" | "complete" | "error";
  error?: string;
}

export interface ImageResizeOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number; // 0-1
  format: "jpeg" | "webp" | "png";
}

// ─── SUPABASE CLIENT ────────────────────────────────────────

let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

// ─── IMAGE PROCESSING ───────────────────────────────────────

/**
 * Resize an image using Canvas API.
 * Returns a Blob of the resized image.
 */
export async function resizeImage(
  file: File | Blob,
  options: ImageResizeOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      const aspectRatio = width / height;

      // Scale down to fit within max dimensions
      if (width > options.maxWidth) {
        width = options.maxWidth;
        height = Math.round(width / aspectRatio);
      }
      if (height > options.maxHeight) {
        height = options.maxHeight;
        width = Math.round(height * aspectRatio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Use high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      const mimeType =
        options.format === "webp"
          ? "image/webp"
          : options.format === "png"
          ? "image/png"
          : "image/jpeg";

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob from canvas"));
          }
        },
        mimeType,
        options.quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Get image dimensions from a File.
 */
export async function getImageDimensions(
  file: File | Blob
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for dimensions"));
    };

    img.src = url;
  });
}

/**
 * Strip EXIF metadata from an image by re-encoding via Canvas.
 * This also sanitizes the image for privacy.
 */
export async function stripExifData(file: File): Promise<Blob> {
  return resizeImage(file, {
    maxWidth: 4096,
    maxHeight: 4096,
    quality: 0.95,
    format: file.type === "image/png" ? "png" : "jpeg",
  });
}

// ─── VALIDATION ─────────────────────────────────────────────

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Invalid file type: ${file.type}. Allowed: ${ALLOWED_TYPES.join(", ")}`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: ${MAX_FILE_SIZE / 1024 / 1024}MB`;
  }
  return null;
}

// ─── UPLOAD FUNCTIONS ───────────────────────────────────────

/**
 * Generate a unique file path for storage.
 */
function generateStoragePath(
  reviewId: string,
  fileName: string,
  variant: string
): string {
  const timestamp = Date.now();
  const sanitizedName = fileName
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .toLowerCase();
  return `reviews/${reviewId}/${variant}/${timestamp}_${sanitizedName}`;
}

/**
 * Upload a single image variant to Supabase Storage.
 */
async function uploadToStorage(
  blob: Blob,
  path: string,
  contentType: string
): Promise<string> {
  const supabase = getSupabase();

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, blob, {
      contentType,
      cacheControl: "31536000", // 1 year cache
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Upload an image with automatic resizing to multiple variants.
 * Creates thumbnail, medium, and large versions.
 */
export async function uploadReviewImage(
  file: File,
  reviewId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadedImage> {
  const progressUpdate = (status: UploadProgress["status"], progress: number, error?: string) => {
    onProgress?.({
      fileName: file.name,
      progress,
      status,
      error,
    });
  };

  // Validate
  const validationError = validateImageFile(file);
  if (validationError) {
    progressUpdate("error", 0, validationError);
    throw new Error(validationError);
  }

  progressUpdate("resizing", 10);

  // Get original dimensions
  const dimensions = await getImageDimensions(file);

  // Strip EXIF and create variants
  const [strippedOriginal, thumbnail, medium, large] = await Promise.all([
    stripExifData(file),
    resizeImage(file, {
      maxWidth: THUMBNAIL_SIZE,
      maxHeight: THUMBNAIL_SIZE,
      quality: 0.8,
      format: "webp",
    }),
    resizeImage(file, {
      maxWidth: MEDIUM_SIZE,
      maxHeight: MEDIUM_SIZE,
      quality: 0.85,
      format: "webp",
    }),
    resizeImage(file, {
      maxWidth: LARGE_SIZE,
      maxHeight: LARGE_SIZE,
      quality: 0.9,
      format: "webp",
    }),
  ]);

  progressUpdate("uploading", 40);

  // Upload all variants
  const baseName = file.name.replace(/\.[^.]+$/, "") + ".webp";
  const originalName = file.name.replace(/\.[^.]+$/, "") + (file.type === "image/png" ? ".png" : ".jpg");

  const [originalUrl, thumbnailUrl, mediumUrl, largeUrl] = await Promise.all([
    uploadToStorage(
      strippedOriginal,
      generateStoragePath(reviewId, originalName, "original"),
      file.type
    ),
    uploadToStorage(
      thumbnail,
      generateStoragePath(reviewId, baseName, "thumbnail"),
      "image/webp"
    ),
    uploadToStorage(
      medium,
      generateStoragePath(reviewId, baseName, "medium"),
      "image/webp"
    ),
    uploadToStorage(
      large,
      generateStoragePath(reviewId, baseName, "large"),
      "image/webp"
    ),
  ]);

  progressUpdate("complete", 100);

  const imageId = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id: imageId,
    fileName: file.name,
    originalUrl,
    thumbnailUrl,
    mediumUrl,
    largeUrl,
    width: dimensions.width,
    height: dimensions.height,
    sizeBytes: file.size,
    mimeType: file.type,
    uploadedAt: new Date().toISOString(),
    reviewId,
    sortOrder: 0,
  };
}

/**
 * Upload multiple images in parallel with progress tracking.
 */
export async function uploadMultipleImages(
  files: File[],
  reviewId: string,
  onProgress?: (fileName: string, progress: UploadProgress) => void
): Promise<UploadedImage[]> {
  const results: UploadedImage[] = [];
  const errors: Array<{ fileName: string; error: string }> = [];

  // Process in batches of 3 to avoid overwhelming the network
  const BATCH_SIZE = 3;
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map((file, batchIndex) =>
        uploadReviewImage(file, reviewId, (progress) => {
          onProgress?.(file.name, progress);
        }).then((result) => ({
          ...result,
          sortOrder: i + batchIndex,
        }))
      )
    );

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        errors.push({
          fileName: batch[batchResults.indexOf(result)]?.name ?? "unknown",
          error: result.reason?.message ?? "Upload failed",
        });
      }
    }
  }

  if (errors.length > 0) {
    console.warn("Some uploads failed:", errors);
  }

  return results;
}

/**
 * Delete an image and all its variants from Supabase Storage.
 */
export async function deleteReviewImage(
  image: UploadedImage
): Promise<boolean> {
  const supabase = getSupabase();

  // Extract paths from URLs
  const extractPath = (url: string): string => {
    const bucketPrefix = `${BUCKET_NAME}/`;
    const idx = url.indexOf(bucketPrefix);
    return idx >= 0 ? url.slice(idx + bucketPrefix.length) : "";
  };

  const paths = [
    extractPath(image.originalUrl),
    extractPath(image.thumbnailUrl),
    extractPath(image.mediumUrl),
    extractPath(image.largeUrl),
  ].filter(Boolean);

  if (paths.length === 0) return false;

  const { error } = await supabase.storage.from(BUCKET_NAME).remove(paths);

  if (error) {
    console.error("Delete failed:", error);
    return false;
  }

  return true;
}

/**
 * Download an image from a URL and upload it to Supabase Storage.
 */
export async function uploadFromUrl(
  url: string,
  reviewId: string,
  fileName?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadedImage> {
  onProgress?.({
    fileName: fileName ?? "remote-image",
    progress: 5,
    status: "pending",
  });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const blob = await response.blob();
  const name = fileName ?? url.split("/").pop() ?? "image.jpg";
  const file = new File([blob], name, { type: blob.type || "image/jpeg" });

  return uploadReviewImage(file, reviewId, onProgress);
}

// ─── BUCKET MANAGEMENT ──────────────────────────────────────

/**
 * Ensure the review-images bucket exists.
 * Should be called once during app initialization.
 */
export async function ensureBucketExists(): Promise<void> {
  const supabase = getSupabase();

  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET_NAME);

  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: ALLOWED_TYPES,
    });

    if (error && !error.message.includes("already exists")) {
      console.error("Failed to create bucket:", error);
    }
  }
}

/**
 * List all images for a specific review.
 */
export async function listReviewImages(
  reviewId: string
): Promise<string[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(`reviews/${reviewId}/original`);

  if (error) {
    console.error("Failed to list images:", error);
    return [];
  }

  return (data ?? []).map((file) => {
    const {
      data: { publicUrl },
    } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(`reviews/${reviewId}/original/${file.name}`);
    return publicUrl;
  });
}
