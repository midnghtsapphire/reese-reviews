// ============================================================
// EXIF STRIPPER — Remove metadata from images for privacy
// Strips GPS, camera info, timestamps, and other EXIF data
// before photos are submitted with reviews.
// Uses Canvas API (no external dependencies).
// ============================================================

interface StripResult {
  blob: Blob;
  url: string;
  originalSize: number;
  strippedSize: number;
  hadExif: boolean;
}

/**
 * Strip EXIF/metadata from an image file by redrawing it on Canvas.
 * Canvas.toBlob() produces a clean image with no embedded metadata.
 */
export async function stripExifFromFile(
  file: File,
  quality = 0.92,
  maxDimension?: number
): Promise<StripResult> {
  const originalSize = file.size;
  const hadExif = await hasExifData(file);

  const bitmap = await createImageBitmap(file);
  let width = bitmap.width;
  let height = bitmap.height;

  if (maxDimension && (width > maxDimension || height > maxDimension)) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to create canvas context");

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await canvas.convertToBlob({
    type: outputType,
    quality: outputType === "image/jpeg" ? quality : undefined,
  });

  const url = URL.createObjectURL(blob);

  return {
    blob,
    url,
    originalSize,
    strippedSize: blob.size,
    hadExif,
  };
}

/**
 * Strip EXIF from multiple files in parallel.
 */
export async function stripExifFromFiles(
  files: File[],
  quality = 0.92,
  maxDimension?: number
): Promise<StripResult[]> {
  return Promise.all(files.map((f) => stripExifFromFile(f, quality, maxDimension)));
}

/**
 * Check if a JPEG file likely contains EXIF data by looking for the marker.
 * EXIF data starts with bytes FF E1 after the JPEG SOI marker (FF D8).
 */
async function hasExifData(file: File): Promise<boolean> {
  if (!file.type.includes("jpeg") && !file.type.includes("jpg")) {
    return false;
  }

  const buffer = await file.slice(0, 64).arrayBuffer();
  const view = new DataView(buffer);

  // JPEG starts with FF D8
  if (view.getUint16(0) !== 0xffd8) return false;

  // Scan for APP1 marker (FF E1) which contains EXIF
  for (let i = 2; i < Math.min(view.byteLength - 1, 60); i++) {
    if (view.getUint8(i) === 0xff && view.getUint8(i + 1) === 0xe1) {
      return true;
    }
  }

  return false;
}

/**
 * Strip EXIF from a Blob URL (fetches, strips, returns new URL).
 */
export async function stripExifFromUrl(url: string, quality = 0.92): Promise<StripResult> {
  const response = await fetch(url);
  const blob = await response.blob();
  const file = new File([blob], "image.jpg", { type: blob.type });
  return stripExifFromFile(file, quality);
}

/**
 * Revoke a previously created object URL to free memory.
 */
export function revokeStrippedUrl(url: string): void {
  URL.revokeObjectURL(url);
}
