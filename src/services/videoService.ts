// ============================================================
// VIDEO GENERATION SERVICE
// Creates slideshow-style review videos with:
// - Product images as slides
// - Avatar overlay thumbnail
// - Text captions/subtitles
// - Background music placeholder
// Uses Canvas API to render frames, then exports as video blob
// ============================================================

export interface VideoConfig {
  productName: string;
  rating: number;
  script: string;
  productImages: string[];
  avatarImage: string;
  duration: number; // total seconds
  width: number;
  height: number;
}

export interface VideoScene {
  imageUrl: string;
  caption: string;
  duration: number; // seconds
}

// ─── PARSE SCRIPT INTO SCENES ───────────────────────────────
export function parseScriptToScenes(script: string, productImages: string[]): VideoScene[] {
  // Split script into segments
  const segments = script
    .split(/\[SHOW PRODUCT\]|\n\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const scenes: VideoScene[] = [];
  const totalDuration = Math.max(30, segments.length * 5);
  const perScene = totalDuration / Math.max(segments.length, 1);

  for (let i = 0; i < segments.length; i++) {
    scenes.push({
      imageUrl: productImages[i % productImages.length] || "",
      caption: segments[i],
      duration: perScene,
    });
  }

  // If no scenes, create a default
  if (scenes.length === 0) {
    scenes.push({
      imageUrl: productImages[0] || "",
      caption: script.slice(0, 200),
      duration: 15,
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
      const scale = Math.min((width * 0.7) / img.width, (height * 0.5) / img.height);
      const iw = img.width * scale;
      const ih = img.height * scale;
      ctx.drawImage(img, (width - iw) / 2, height * 0.1, iw, ih);
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
