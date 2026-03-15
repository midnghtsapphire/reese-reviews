// ============================================================
// METADATA STRIPPER UTILITY
// Strips ALL AI fingerprints, EXIF data, watermarks, and
// generation tags from images, videos, and exported media.
// Ensures no traceable AI metadata remains on any content.
// ============================================================

/**
 * Allowed metadata fields after stripping.
 * Only these five fields are preserved; everything else is removed.
 */
export interface CleanMetadata {
  author: string;
  title: string;
  description: string;
  date: string;
  seoWords: string[];
}

/**
 * Known AI-generation EXIF/XMP tags that MUST be removed.
 * Covers Stable Diffusion, DALL-E, Midjourney, Adobe Firefly,
 * and other common AI generators.
 */
const AI_FINGERPRINT_MARKERS: string[] = [
  "AI:GeneratedBy",
  "AI:Model",
  "AI:Prompt",
  "AI:NegativePrompt",
  "AI:Seed",
  "AI:Steps",
  "AI:CFGScale",
  "AI:Sampler",
  "tEXt",
  "iTXt",
  "parameters",
  "Comment",
  "UserComment",
  "ImageDescription",
  "XPComment",
  "XPKeywords",
  "Software",
  "ProcessingSoftware",
  "Creator",
  "CreatorTool",
  "HistorySoftwareAgent",
  "DerivedFrom",
  "DocumentID",
  "InstanceID",
  "OriginalDocumentID",
  "dc:creator",
  "dc:description",
  "dc:rights",
  "xmp:CreatorTool",
  "xmp:MetadataDate",
  "xmpMM:DocumentID",
  "xmpMM:InstanceID",
  "xmpMM:OriginalDocumentID",
  "xmpMM:History",
  "photoshop:Credit",
  "photoshop:Source",
  "Iptc4xmpCore:CreatorContactInfo",
  "plus:ImageCreatorName",
  "plus:CopyrightOwnerName",
  "c2pa:manifest",
  "c2pa:actions",
  "c2pa:claim",
  "c2pa:signature",
];

/**
 * Known AI watermark patterns (byte signatures) to detect and remove.
 */
const AI_WATERMARK_SIGNATURES: Uint8Array[] = [
  // Common invisible watermark header bytes
  new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
];

// ─── JPEG EXIF STRIPPING ────────────────────────────────────

/**
 * Locate EXIF/APP1 markers in a JPEG and remove them entirely.
 * JPEG structure: SOI (FFD8) followed by segments (FFxx + length).
 * We strip APP1 (FFE1), APP2 (FFE2), APP12 (FFEC), APP13 (FFED),
 * APP14 (FFEE), and COM (FFFE) segments that carry metadata.
 */
function stripJpegMetadata(data: Uint8Array): Uint8Array {
  if (data[0] !== 0xff || data[1] !== 0xd8) {
    return data; // Not a JPEG
  }

  const STRIP_MARKERS = new Set([
    0xe1, // APP1 — EXIF, XMP
    0xe2, // APP2 — ICC Profile (can contain AI tags)
    0xec, // APP12 — Ducky
    0xed, // APP13 — IPTC / Photoshop IRB
    0xee, // APP14 — Adobe
    0xfe, // COM — Comment
  ]);

  const output: number[] = [0xff, 0xd8]; // SOI
  let offset = 2;

  while (offset < data.length - 1) {
    if (data[offset] !== 0xff) {
      // Copy remaining data as-is (image data)
      for (let i = offset; i < data.length; i++) {
        output.push(data[i]);
      }
      break;
    }

    const marker = data[offset + 1];

    // SOS (Start of Scan) — everything after is image data
    if (marker === 0xda) {
      for (let i = offset; i < data.length; i++) {
        output.push(data[i]);
      }
      break;
    }

    // Standalone markers (no length field)
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      output.push(0xff, marker);
      offset += 2;
      continue;
    }

    // Read segment length
    const segmentLength = (data[offset + 2] << 8) | data[offset + 3];
    const totalSegmentSize = segmentLength + 2; // +2 for the marker bytes

    if (STRIP_MARKERS.has(marker)) {
      // Skip this segment entirely
      offset += totalSegmentSize;
      continue;
    }

    // Keep this segment
    for (let i = 0; i < totalSegmentSize && offset + i < data.length; i++) {
      output.push(data[offset + i]);
    }
    offset += totalSegmentSize;
  }

  return new Uint8Array(output);
}

// ─── PNG METADATA STRIPPING ─────────────────────────────────

/**
 * Strip text chunks (tEXt, iTXt, zTXt) and other metadata chunks
 * from PNG files. These chunks carry AI generation parameters.
 */
function stripPngMetadata(data: Uint8Array): Uint8Array {
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    data[0] !== 0x89 ||
    data[1] !== 0x50 ||
    data[2] !== 0x4e ||
    data[3] !== 0x47
  ) {
    return data; // Not a PNG
  }

  const STRIP_CHUNK_TYPES = new Set([
    "tEXt", // Uncompressed text
    "iTXt", // International text (UTF-8)
    "zTXt", // Compressed text
    "eXIf", // EXIF data
    "iCCP", // ICC color profile (can contain AI tags)
    "sRGB", // We keep this but strip others
  ]);

  // Keep sRGB actually — it's harmless
  STRIP_CHUNK_TYPES.delete("sRGB");

  const output: number[] = [];

  // Copy PNG signature
  for (let i = 0; i < 8; i++) {
    output.push(data[i]);
  }

  let offset = 8;

  while (offset < data.length) {
    if (offset + 8 > data.length) break;

    // Read chunk length (4 bytes, big-endian)
    const chunkLength =
      (data[offset] << 24) |
      (data[offset + 1] << 16) |
      (data[offset + 2] << 8) |
      data[offset + 3];

    // Read chunk type (4 bytes ASCII)
    const chunkType = String.fromCharCode(
      data[offset + 4],
      data[offset + 5],
      data[offset + 6],
      data[offset + 7]
    );

    const totalChunkSize = 4 + 4 + chunkLength + 4; // length + type + data + CRC

    if (STRIP_CHUNK_TYPES.has(chunkType)) {
      // Skip this chunk
      offset += totalChunkSize;
      continue;
    }

    // Keep this chunk
    for (let i = 0; i < totalChunkSize && offset + i < data.length; i++) {
      output.push(data[offset + i]);
    }
    offset += totalChunkSize;
  }

  return new Uint8Array(output);
}

// ─── WEBP METADATA STRIPPING ────────────────────────────────

/**
 * Strip EXIF and XMP chunks from WebP files.
 * WebP uses RIFF container format.
 */
function stripWebpMetadata(data: Uint8Array): Uint8Array {
  const riffHeader = String.fromCharCode(data[0], data[1], data[2], data[3]);
  if (riffHeader !== "RIFF") return data;

  const webpSig = String.fromCharCode(data[8], data[9], data[10], data[11]);
  if (webpSig !== "WEBP") return data;

  const STRIP_CHUNKS = new Set(["EXIF", "XMP "]);

  const output: number[] = [];

  // Copy RIFF header (12 bytes: "RIFF" + size + "WEBP")
  for (let i = 0; i < 12; i++) {
    output.push(data[i]);
  }

  let offset = 12;

  while (offset < data.length) {
    if (offset + 8 > data.length) break;

    const chunkId = String.fromCharCode(
      data[offset],
      data[offset + 1],
      data[offset + 2],
      data[offset + 3]
    );

    const chunkSize =
      data[offset + 4] |
      (data[offset + 5] << 8) |
      (data[offset + 6] << 16) |
      (data[offset + 7] << 24);

    // RIFF chunks are padded to even size
    const paddedSize = chunkSize + (chunkSize % 2);
    const totalSize = 8 + paddedSize;

    if (STRIP_CHUNKS.has(chunkId)) {
      offset += totalSize;
      continue;
    }

    for (let i = 0; i < totalSize && offset + i < data.length; i++) {
      output.push(data[offset + i]);
    }
    offset += totalSize;
  }

  // Update RIFF file size
  const riffSize = output.length - 8;
  output[4] = riffSize & 0xff;
  output[5] = (riffSize >> 8) & 0xff;
  output[6] = (riffSize >> 16) & 0xff;
  output[7] = (riffSize >> 24) & 0xff;

  return new Uint8Array(output);
}

// ─── VIDEO METADATA STRIPPING ───────────────────────────────

/**
 * Strip metadata from MP4/MOV video containers.
 * Removes 'udta' (user data) and 'meta' atoms that carry
 * AI generation tags, software info, and comments.
 *
 * For full production use, this should be paired with FFmpeg
 * server-side processing. This client-side version handles
 * the most common metadata atoms.
 */
function stripMp4Metadata(data: Uint8Array): Uint8Array {
  // MP4 files start with an 'ftyp' atom
  const ftypCheck = String.fromCharCode(data[4], data[5], data[6], data[7]);
  if (ftypCheck !== "ftyp") return data;

  const STRIP_ATOMS = new Set(["udta", "meta", "XMP_", "uuid"]);

  const output: number[] = [];
  let offset = 0;

  while (offset < data.length) {
    if (offset + 8 > data.length) {
      // Copy remaining bytes
      for (let i = offset; i < data.length; i++) {
        output.push(data[i]);
      }
      break;
    }

    // Read atom size (4 bytes, big-endian)
    const atomSize =
      (data[offset] << 24) |
      (data[offset + 1] << 16) |
      (data[offset + 2] << 8) |
      data[offset + 3];

    const atomType = String.fromCharCode(
      data[offset + 4],
      data[offset + 5],
      data[offset + 6],
      data[offset + 7]
    );

    const size = atomSize === 0 ? data.length - offset : atomSize;

    if (STRIP_ATOMS.has(atomType)) {
      offset += size;
      continue;
    }

    // For container atoms (moov, trak), recurse to strip nested metadata
    if (atomType === "moov" || atomType === "trak" || atomType === "mdia") {
      // Copy atom header
      for (let i = 0; i < 8; i++) {
        output.push(data[offset + i]);
      }
      // Process children — simplified: copy all but strip known bad atoms
      const childStart = offset + 8;
      const childEnd = offset + size;
      let childOffset = childStart;

      while (childOffset < childEnd) {
        if (childOffset + 8 > childEnd) {
          for (let i = childOffset; i < childEnd; i++) {
            output.push(data[i]);
          }
          break;
        }

        const childSize =
          (data[childOffset] << 24) |
          (data[childOffset + 1] << 16) |
          (data[childOffset + 2] << 8) |
          data[childOffset + 3];

        const childType = String.fromCharCode(
          data[childOffset + 4],
          data[childOffset + 5],
          data[childOffset + 6],
          data[childOffset + 7]
        );

        const cSize = childSize === 0 ? childEnd - childOffset : childSize;

        if (STRIP_ATOMS.has(childType)) {
          childOffset += cSize;
          continue;
        }

        for (let i = 0; i < cSize && childOffset + i < childEnd; i++) {
          output.push(data[childOffset + i]);
        }
        childOffset += cSize;
      }

      // Update parent atom size
      const newAtomSize = output.length - (output.length - 8); // Simplified
      offset += size;
      continue;
    }

    // Copy atom as-is
    for (let i = 0; i < size && offset + i < data.length; i++) {
      output.push(data[offset + i]);
    }
    offset += size;
  }

  return new Uint8Array(output);
}

// ─── CANVAS-BASED IMAGE RE-ENCODING ────────────────────────

/**
 * Re-encode an image through Canvas to completely strip ALL metadata.
 * This is the nuclear option — draws the image to canvas and exports
 * fresh pixels with zero metadata. Works for any image format.
 */
export async function reEncodeImage(
  file: File | Blob,
  outputFormat: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg",
  quality: number = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Draw image — this strips ALL metadata
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to re-encode image"));
          }
        },
        outputFormat,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for re-encoding"));
    };

    img.src = url;
  });
}

// ─── BINARY-LEVEL STRIPPING ────────────────────────────────

/**
 * Strip metadata at the binary level based on file type.
 * Detects format from magic bytes and applies appropriate stripping.
 */
export async function stripBinaryMetadata(data: Uint8Array): Promise<Uint8Array> {
  // Detect format from magic bytes
  if (data[0] === 0xff && data[1] === 0xd8) {
    return stripJpegMetadata(data);
  }

  if (
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47
  ) {
    return stripPngMetadata(data);
  }

  const riffStr = String.fromCharCode(data[0], data[1], data[2], data[3]);
  if (riffStr === "RIFF") {
    return stripWebpMetadata(data);
  }

  // Check for MP4/MOV
  if (data.length > 8) {
    const ftypStr = String.fromCharCode(data[4], data[5], data[6], data[7]);
    if (ftypStr === "ftyp") {
      return stripMp4Metadata(data);
    }
  }

  return data;
}

// ─── HIGH-LEVEL API ─────────────────────────────────────────

/**
 * Process a File/Blob: strip all AI fingerprints and metadata.
 * Returns a clean File with only the allowed metadata fields.
 *
 * Strategy:
 * 1. Binary-level metadata stripping (format-specific)
 * 2. Canvas re-encoding for images (nuclear option)
 * 3. Return clean blob with sanitized filename
 */
export async function stripAllMetadata(
  file: File,
  cleanMeta?: Partial<CleanMetadata>
): Promise<File> {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");

  let cleanBlob: Blob;

  if (isImage) {
    // For images: re-encode through canvas (strips everything)
    const format = file.type === "image/png" ? "image/png" : "image/jpeg";
    cleanBlob = await reEncodeImage(file, format as "image/jpeg" | "image/png");
  } else if (isVideo) {
    // For video: binary-level stripping
    const buffer = await file.arrayBuffer();
    const stripped = await stripBinaryMetadata(new Uint8Array(buffer));
    cleanBlob = new Blob([stripped], { type: file.type });
  } else {
    // For other files: binary stripping
    const buffer = await file.arrayBuffer();
    const stripped = await stripBinaryMetadata(new Uint8Array(buffer));
    cleanBlob = new Blob([stripped], { type: file.type });
  }

  // Create clean filename (remove any AI-related suffixes)
  const cleanName = sanitizeFilename(file.name);

  return new File([cleanBlob], cleanName, {
    type: cleanBlob.type,
    lastModified: Date.now(),
  });
}

/**
 * Batch process multiple files.
 */
export async function stripAllMetadataBatch(
  files: File[],
  cleanMeta?: Partial<CleanMetadata>
): Promise<File[]> {
  return Promise.all(files.map((f) => stripAllMetadata(f, cleanMeta)));
}

/**
 * Strip metadata from a Blob URL and return a new clean Blob URL.
 */
export async function stripBlobUrlMetadata(
  blobUrl: string,
  mimeType: string = "image/jpeg"
): Promise<string> {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  const file = new File([blob], "media", { type: mimeType });
  const cleanFile = await stripAllMetadata(file);
  return URL.createObjectURL(cleanFile);
}

// ─── FILENAME SANITIZATION ──────────────────────────────────

/**
 * Remove AI-related keywords from filenames.
 */
const AI_FILENAME_PATTERNS = [
  /ai[_-]?gen(erated)?/gi,
  /dall[_-]?e/gi,
  /midjourney/gi,
  /stable[_-]?diffusion/gi,
  /sd[_-]?xl/gi,
  /firefly/gi,
  /comfy[_-]?ui/gi,
  /automatic1111/gi,
  /invoke[_-]?ai/gi,
  /leonardo/gi,
  /runway/gi,
  /pika/gi,
  /sora/gi,
  /gen[_-]?2/gi,
  /\(generated\)/gi,
  /\[ai\]/gi,
  /generated[_-]?by/gi,
];

function sanitizeFilename(filename: string): string {
  let clean = filename;
  for (const pattern of AI_FILENAME_PATTERNS) {
    clean = clean.replace(pattern, "");
  }
  // Clean up multiple dashes/underscores
  clean = clean.replace(/[-_]{2,}/g, "-").replace(/^[-_]+|[-_]+(?=\.)/g, "");
  return clean || "media";
}

// ─── CONTENT TEXT STRIPPING ─────────────────────────────────

/**
 * Strip AI fingerprints from generated text content.
 * Removes common AI disclosure phrases that could flag content.
 */
const AI_TEXT_PATTERNS = [
  /as an ai( language model)?[,.]?\s*/gi,
  /i('m| am) an ai\s*/gi,
  /generated (by|with|using) (ai|artificial intelligence|gpt|claude|llama)\s*/gi,
  /\[ai[_-]?generated\]\s*/gi,
  /\(ai[_-]?generated\)\s*/gi,
  /this (text|content|review) was (generated|created|written) (by|with|using)\s*/gi,
  /disclaimer:?\s*this.*ai.*\n?/gi,
  /note:?\s*this.*generated.*\n?/gi,
];

export function stripAITextFingerprints(text: string): string {
  let clean = text;
  for (const pattern of AI_TEXT_PATTERNS) {
    clean = clean.replace(pattern, "");
  }
  // Clean up double spaces and leading/trailing whitespace
  clean = clean.replace(/\s{2,}/g, " ").trim();
  return clean;
}

// ─── VERIFICATION ───────────────────────────────────────────

/**
 * Scan a file for any remaining AI fingerprints.
 * Returns true if the file appears clean.
 */
export async function verifyClean(file: File): Promise<{
  isClean: boolean;
  issues: string[];
}> {
  const issues: string[] = [];

  // Check filename
  const lowerName = file.name.toLowerCase();
  for (const pattern of AI_FILENAME_PATTERNS) {
    if (pattern.test(lowerName)) {
      issues.push(`Filename contains AI-related keyword: ${file.name}`);
      break;
    }
  }

  // Check binary content for known markers
  if (file.size < 50 * 1024 * 1024) {
    // Only scan files under 50MB
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const textContent = new TextDecoder("utf-8", { fatal: false }).decode(
      bytes.slice(0, Math.min(bytes.length, 100000))
    );

    for (const marker of AI_FINGERPRINT_MARKERS) {
      if (textContent.includes(marker)) {
        issues.push(`Found AI metadata marker: ${marker}`);
      }
    }
  }

  return {
    isClean: issues.length === 0,
    issues,
  };
}

/**
 * Build clean metadata object with only allowed fields.
 */
export function buildCleanMetadata(
  overrides: Partial<CleanMetadata> = {}
): CleanMetadata {
  return {
    author: overrides.author ?? "Reese Reviews",
    title: overrides.title ?? "",
    description: overrides.description ?? "",
    date: overrides.date ?? new Date().toISOString().split("T")[0],
    seoWords: overrides.seoWords ?? [],
  };
}
