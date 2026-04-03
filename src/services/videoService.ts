// ============================================================
// VIDEO GENERATION SERVICE
// Creates slideshow-style review videos with:
// - Product images as slides
// - Avatar overlay thumbnail
// - Text captions/subtitles
// - Background music placeholder
// Uses Canvas API to render frames, then exports as video blob
// Supports variable video lengths from 30s to 2 hours
// ============================================================

// ─── VIDEO LENGTH PRESETS ───────────────────────────────────
export interface VideoLengthPreset {
  label: string;
  seconds: number;
  /** Minimum number of slides to generate */
  minSlides: number;
  /** Seconds each slide is shown */
  secondsPerSlide: number;
  /** How many words of caption text to show per slide */
  wordsPerSlide: number;
  /** Whether to generate multi-section content (for 30min+) */
  multiSection: boolean;
  /** Description shown in the UI */
  description: string;
}

export const VIDEO_LENGTH_PRESETS: VideoLengthPreset[] = [
  {
    label: "30 seconds",
    seconds: 30,
    minSlides: 3,
    secondsPerSlide: 10,
    wordsPerSlide: 15,
    multiSection: false,
    description: "Quick highlight reel — great for social media stories",
  },
  {
    label: "1 minute",
    seconds: 60,
    minSlides: 6,
    secondsPerSlide: 10,
    wordsPerSlide: 20,
    multiSection: false,
    description: "Standard Vine review — recommended for most products",
  },
  {
    label: "2 minutes",
    seconds: 120,
    minSlides: 10,
    secondsPerSlide: 12,
    wordsPerSlide: 30,
    multiSection: false,
    description: "Detailed review with pros, cons, and verdict",
  },
  {
    label: "5 minutes",
    seconds: 300,
    minSlides: 20,
    secondsPerSlide: 15,
    wordsPerSlide: 40,
    multiSection: true,
    description: "In-depth review with multiple product angles",
  },
  {
    label: "10 minutes",
    seconds: 600,
    minSlides: 40,
    secondsPerSlide: 15,
    wordsPerSlide: 50,
    multiSection: true,
    description: "Comprehensive review — unboxing, setup, and testing",
  },
  {
    label: "30 minutes",
    seconds: 1800,
    minSlides: 90,
    secondsPerSlide: 20,
    wordsPerSlide: 60,
    multiSection: true,
    description: "Extended deep-dive — ideal for complex products",
  },
  {
    label: "1 hour",
    seconds: 3600,
    minSlides: 120,
    secondsPerSlide: 30,
    wordsPerSlide: 80,
    multiSection: true,
    description: "Full product walkthrough with tutorial sections",
  },
  {
    label: "2 hours",
    seconds: 7200,
    minSlides: 180,
    secondsPerSlide: 40,
    wordsPerSlide: 100,
    multiSection: true,
    description: "Training / tutorial video — complete product mastery guide",
  },
];

/** Default preset for Vine reviews (1 minute) */
export const DEFAULT_VIDEO_LENGTH_PRESET = VIDEO_LENGTH_PRESETS[1];

export function getPresetBySeconds(seconds: number): VideoLengthPreset {
  return VIDEO_LENGTH_PRESETS.find((p) => p.seconds === seconds) ?? DEFAULT_VIDEO_LENGTH_PRESET;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

// ─── VIDEO CONFIG ───────────────────────────────────────────
export interface VideoConfig {
  productName: string;
  rating: number;
  script: string;
  productImages: string[];
  avatarImage: string;
  duration: number; // total seconds
  width: number;
  height: number;
  preset?: VideoLengthPreset;
}

export interface VideoScene {
  imageUrl: string;
  caption: string;
  duration: number; // seconds per slide
  sectionTitle?: string; // for multi-section long-form videos
}

// ─── SECTION TEMPLATES FOR LONG-FORM VIDEOS ─────────────────
const LONG_FORM_SECTIONS = [
  "Introduction & First Impressions",
  "Unboxing & What's in the Box",
  "Design & Build Quality",
  "Setup & Installation",
  "Key Features Overview",
  "Performance Testing",
  "Pros & Advantages",
  "Cons & Limitations",
  "Comparison with Alternatives",
  "Value for Money",
  "Who Should Buy This",
  "Final Verdict & Rating",
];

// ─── PARSE SCRIPT INTO SCENES ───────────────────────────────
export function parseScriptToScenes(
  script: string,
  productImages: string[],
  preset?: VideoLengthPreset
): VideoScene[] {
  const p = preset ?? DEFAULT_VIDEO_LENGTH_PRESET;

  // Split script into segments
  const rawSegments = script
    .split(/\[SHOW PRODUCT\]|\n\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const scenes: VideoScene[] = [];

  if (p.multiSection) {
    // For long-form videos, generate structured sections
    const sectionsNeeded = Math.min(LONG_FORM_SECTIONS.length, Math.ceil(p.minSlides / 3));
    const slidesPerSection = Math.ceil(p.minSlides / sectionsNeeded);

    for (let s = 0; s < sectionsNeeded; s++) {
      const sectionTitle = LONG_FORM_SECTIONS[s];
      const sectionText = rawSegments[s] ?? `${sectionTitle} — detailed analysis of ${script.slice(0, 80)}...`;

      // Break section text into individual slides
      const words = sectionText.split(" ");
      const chunkSize = p.wordsPerSlide;
      const chunks: string[] = [];
      for (let i = 0; i < words.length; i += chunkSize) {
        chunks.push(words.slice(i, i + chunkSize).join(" "));
      }

      // Ensure at least slidesPerSection slides per section
      while (chunks.length < slidesPerSection) {
        chunks.push(`${sectionTitle} — continued analysis and key takeaways.`);
      }

      for (let c = 0; c < Math.min(chunks.length, slidesPerSection); c++) {
        scenes.push({
          imageUrl: productImages[(s * slidesPerSection + c) % Math.max(productImages.length, 1)] || "",
          caption: chunks[c],
          duration: p.secondsPerSlide,
          sectionTitle: c === 0 ? sectionTitle : undefined,
        });
      }
    }
  } else {
    // Short-form: simple segment-per-slide
    for (let i = 0; i < Math.max(rawSegments.length, p.minSlides); i++) {
      const text = rawSegments[i] ?? script.slice(0, p.wordsPerSlide * 6);
      const words = text.split(" ").slice(0, p.wordsPerSlide).join(" ");
      scenes.push({
        imageUrl: productImages[i % Math.max(productImages.length, 1)] || "",
        caption: words,
        duration: p.secondsPerSlide,
      });
    }
  }

  // Ensure we meet minimum slide count
  while (scenes.length < p.minSlides) {
    scenes.push({
      imageUrl: productImages[scenes.length % Math.max(productImages.length, 1)] || "",
      caption: script.slice(0, p.wordsPerSlide * 6) || "Product review continues...",
      duration: p.secondsPerSlide,
    });
  }

  return scenes;
}

// ─── RENDER VIDEO PREVIEW (Canvas-based) ────────────────────
export async function renderVideoPreview(
  canvas: HTMLCanvasElement,
  config: VideoConfig,
  scenes: VideoScene[],
  currentSceneIndex: number
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { width, height } = config;
  canvas.width = width;
  canvas.height = height;

  const scene = scenes[currentSceneIndex] || scenes[0];

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#1a1a2e");
  gradient.addColorStop(1, "#16213e");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Section title banner (for long-form multi-section videos)
  if (scene?.sectionTitle) {
    ctx.fillStyle = "rgba(99, 102, 241, 0.85)";
    ctx.fillRect(0, 0, width, 36);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(scene.sectionTitle, width / 2, 24);
  }

  // Product image (if available)
  if (scene?.imageUrl) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = scene.imageUrl;
      });
      // Center and fit image
      const topOffset = scene.sectionTitle ? 0.15 : 0.1;
      const scale = Math.min((width * 0.7) / img.width, (height * 0.5) / img.height);
      const iw = img.width * scale;
      const ih = img.height * scale;
      ctx.drawImage(img, (width - iw) / 2, height * topOffset, iw, ih);
    } catch {
      // Draw placeholder
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.fillRect(width * 0.15, height * 0.1, width * 0.7, height * 0.4);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "24px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("📦 Product Image", width / 2, height * 0.3);
    }
  }

  // Caption area (bottom third)
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, height * 0.65, width, height * 0.35);

  // Caption text
  if (scene?.caption) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px 'Inter', sans-serif";
    ctx.textAlign = "center";
    const words = scene.caption.split(" ");
    const lines: string[] = [];
    let currentLine = "";
    for (const word of words) {
      const test = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(test).width > width * 0.85) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = test;
      }
    }
    if (currentLine) lines.push(currentLine);
    const lineHeight = 24;
    const startY = height * 0.72;
    for (let i = 0; i < Math.min(lines.length, 4); i++) {
      ctx.fillText(lines[i], width / 2, startY + i * lineHeight);
    }
  }

  // Avatar overlay (bottom-right corner)
  if (config.avatarImage) {
    try {
      const avatar = new Image();
      avatar.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        avatar.onload = () => resolve();
        avatar.onerror = () => reject();
        avatar.src = config.avatarImage;
      });
      const size = 64;
      const x = width - size - 16;
      const y = height - size - 16;
      // Circular clip
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatar, x, y, size, size);
      ctx.restore();
      // Border
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.stroke();
    } catch {
      // Draw placeholder avatar circle
      const size = 64;
      const x = width - size - 16;
      const y = height - size - 16;
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a1a2e";
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("R", x + size / 2, y + size / 2 + 8);
    }
  }

  // Star rating (top-right)
  ctx.fillStyle = "#f59e0b";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "right";
  const stars = "★".repeat(Math.floor(config.rating)) + (config.rating % 1 >= 0.5 ? "½" : "");
  ctx.fillText(stars, width - 16, 32);

  // Product name (top-left)
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 16px 'Inter', sans-serif";
  ctx.textAlign = "left";
  const truncName = config.productName.length > 40 ? config.productName.slice(0, 37) + "..." : config.productName;
  ctx.fillText(truncName, 16, 32);

  // Duration badge (top-center)
  if (config.preset) {
    ctx.fillStyle = "rgba(99, 102, 241, 0.9)";
    const badge = `⏱ ${config.preset.label}`;
    const bw = ctx.measureText(badge).width + 16;
    ctx.fillRect(width / 2 - bw / 2, 8, bw, 22);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(badge, width / 2, 23);
  }

  // Scene indicator
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`${currentSceneIndex + 1}/${scenes.length}`, width - 16, height - 8);
}

// ─── EXPORT VIDEO AS BLOB (using MediaRecorder) ─────────────
export async function exportVideoBlob(
  canvas: HTMLCanvasElement,
  config: VideoConfig,
  scenes: VideoScene[]
): Promise<Blob | null> {
  try {
    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
      videoBitsPerSecond: 2500000,
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    return new Promise((resolve) => {
      recorder.onstop = () => {
        resolve(new Blob(chunks, { type: "video/webm" }));
      };

      recorder.start();

      // Render each scene
      let sceneIdx = 0;
      const renderNext = () => {
        if (sceneIdx >= scenes.length) {
          recorder.stop();
          return;
        }
        renderVideoPreview(canvas, config, scenes, sceneIdx);
        sceneIdx++;
        setTimeout(renderNext, (scenes[sceneIdx - 1]?.duration || 5) * 1000);
      };
      renderNext();
    });
  } catch {
    return null;
  }
}
