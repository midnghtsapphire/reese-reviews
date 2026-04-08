// ============================================================
// MUSIC VIDEO SERVICE
// Generates music videos with avatar, theme backgrounds,
// attire selection, and audio sync using HTML5 Canvas.
// ============================================================

export type MusicVideoTheme =
  | "sunset-rooftop"
  | "studio-session"
  | "nature-acoustic"
  | "rain-window"
  | "bonfire"
  | "neon-city"
  | "random";

export type AvatarAttire =
  | "casual"
  | "long-dress-formal"
  | "business-casual"
  | "streetwear"
  | "concert-black"
  | "random";

export interface MusicVideoConfig {
  songFile: File | null;
  songName: string;
  artistName: string;
  avatarUrl: string | null;
  theme: MusicVideoTheme;
  attire: AvatarAttire;
  lyrics: string;
}

export interface MusicVideoProgress {
  stage: string;
  percent: number;
  message: string;
}

export interface GeneratedMusicVideo {
  id: string;
  url: string;
  thumbnailUrl: string;
  songName: string;
  artistName: string;
  theme: MusicVideoTheme;
  attire: AvatarAttire;
  durationSeconds: number;
  createdAt: string;
  fileSize: number;
}

// ─── THEME DEFINITIONS ─────────────────────────────────────
export const THEMES: Record<MusicVideoTheme, {
  label: string;
  description: string;
  gradient: string;
  textColor: string;
  accentColor: string;
  particleColor: string;
}> = {
  "sunset-rooftop": {
    label: "Sunset Rooftop",
    description: "Golden hour city skyline, warm ambient glow",
    gradient: "linear-gradient(135deg, #ff6b35 0%, #f7931e 25%, #fbb040 50%, #8b5e3c 75%, #2c1810 100%)",
    textColor: "#fff8e7",
    accentColor: "#ff6b35",
    particleColor: "#ffd700",
  },
  "studio-session": {
    label: "Studio Session",
    description: "Dark recording studio, mic glow, sound panels",
    gradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #533483 100%)",
    textColor: "#e0e0ff",
    accentColor: "#00d4ff",
    particleColor: "#7b68ee",
  },
  "nature-acoustic": {
    label: "Nature Acoustic",
    description: "Forest clearing, dappled sunlight, natural greens",
    gradient: "linear-gradient(135deg, #134e5e 0%, #2d8659 30%, #71b280 60%, #a8e063 100%)",
    textColor: "#f0fff0",
    accentColor: "#a8e063",
    particleColor: "#90ee90",
  },
  "rain-window": {
    label: "Rain Window",
    description: "Cozy room, rain on window, soft blue lighting",
    gradient: "linear-gradient(135deg, #0c1445 0%, #1a237e 30%, #283593 50%, #3949ab 70%, #5c6bc0 100%)",
    textColor: "#cfd8dc",
    accentColor: "#80cbc4",
    particleColor: "#b0bec5",
  },
  "bonfire": {
    label: "Beach Bonfire",
    description: "Beach at night, bonfire, acoustic casual vibe",
    gradient: "linear-gradient(135deg, #0d1117 0%, #1a0a00 20%, #3d1c00 40%, #ff6600 70%, #ff9500 100%)",
    textColor: "#ffe4c4",
    accentColor: "#ff6600",
    particleColor: "#ff4500",
  },
  "neon-city": {
    label: "Neon City",
    description: "Cyberpunk city streets, neon lights, urban night",
    gradient: "linear-gradient(135deg, #0a0a0a 0%, #1a0033 25%, #330066 50%, #ff0066 75%, #00ffff 100%)",
    textColor: "#e0ffff",
    accentColor: "#ff0066",
    particleColor: "#00ffff",
  },
  "random": {
    label: "Random",
    description: "Randomly picks from all themes",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    textColor: "#ffffff",
    accentColor: "#667eea",
    particleColor: "#ffffff",
  },
};

export const ATTIRE_OPTIONS: Record<AvatarAttire, {
  label: string;
  description: string;
}> = {
  "casual": { label: "Casual", description: "Relaxed everyday wear" },
  "long-dress-formal": { label: "Long Dress Formal", description: "Elegant formal gown" },
  "business-casual": { label: "Business Casual", description: "Smart professional look" },
  "streetwear": { label: "Streetwear", description: "Urban trendy style" },
  "concert-black": { label: "Concert Black", description: "All-black performance outfit" },
  "random": { label: "Random", description: "Randomly picks an attire" },
};

// ─── HELPER FUNCTIONS ───────────────────────────────────────

function resolveTheme(theme: MusicVideoTheme): MusicVideoTheme {
  if (theme === "random") {
    const themes = Object.keys(THEMES).filter((t) => t !== "random") as MusicVideoTheme[];
    return themes[Math.floor(Math.random() * themes.length)];
  }
  return theme;
}

function resolveAttire(attire: AvatarAttire): AvatarAttire {
  if (attire === "random") {
    const attires = Object.keys(ATTIRE_OPTIONS).filter((a) => a !== "random") as AvatarAttire[];
    return attires[Math.floor(Math.random() * attires.length)];
  }
  return attire;
}

function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.addEventListener("loadedmetadata", () => {
      resolve(audio.duration);
    });
    audio.addEventListener("error", () => {
      reject(new Error("Failed to load audio file"));
    });
    audio.src = URL.createObjectURL(file);
  });
}

function parseLyrics(lyrics: string): { time: number; text: string }[] {
  const lines = lyrics.split("\n").filter((l) => l.trim());
  return lines.map((text, i) => ({
    time: i,
    text: text.trim(),
  }));
}

// ─── CANVAS RENDERING ──────────────────────────────────────

function drawGradientBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  theme: typeof THEMES[MusicVideoTheme],
  time: number
): void {
  // Parse gradient colors from the theme
  const colors = theme.gradient.match(/#[0-9a-fA-F]{6}/g) || ["#000000", "#333333"];

  const grd = ctx.createLinearGradient(
    Math.sin(time * 0.1) * width * 0.3,
    0,
    width + Math.cos(time * 0.1) * width * 0.3,
    height
  );

  colors.forEach((color, i) => {
    grd.addColorStop(i / (colors.length - 1), color);
  });

  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, width, height);
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  time: number,
  intensity: number
): void {
  const particleCount = Math.floor(20 * intensity);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.3;

  for (let i = 0; i < particleCount; i++) {
    const x = (Math.sin(time * 0.5 + i * 1.7) * 0.5 + 0.5) * width;
    const y = (Math.cos(time * 0.3 + i * 2.3) * 0.5 + 0.5) * height;
    const size = 2 + Math.sin(time + i) * 2;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

function drawAvatarPlaceholder(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  attire: AvatarAttire,
  time: number
): void {
  // Draw a stylized avatar silhouette
  const cx = width * 0.5;
  const cy = height * 0.55;
  const scale = Math.min(width, height) * 0.003;

  // Gentle sway animation
  const sway = Math.sin(time * 0.5) * 3;

  ctx.save();
  ctx.translate(cx + sway, cy);

  // Body
  ctx.fillStyle = attire === "concert-black" ? "#111" : "#333";
  ctx.beginPath();
  ctx.ellipse(0, 20 * scale, 30 * scale, 50 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = "#d4a574";
  ctx.beginPath();
  ctx.arc(0, -40 * scale, 18 * scale, 0, Math.PI * 2);
  ctx.fill();

  // Attire accent
  const attireColors: Record<AvatarAttire, string> = {
    "casual": "#6b8e23",
    "long-dress-formal": "#8b008b",
    "business-casual": "#2f4f4f",
    "streetwear": "#ff4500",
    "concert-black": "#1a1a1a",
    "random": "#666",
  };
  ctx.fillStyle = attireColors[attire] || "#666";
  ctx.beginPath();
  ctx.ellipse(0, 30 * scale, 28 * scale, 45 * scale, 0, 0, Math.PI);
  ctx.fill();

  ctx.restore();
}

function drawLyricLine(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: string,
  color: string,
  opacity: number
): void {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.font = `bold ${Math.max(16, width * 0.03)}px 'Segoe UI', sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Text shadow
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Word wrap
  const maxWidth = width * 0.8;
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  const lineHeight = Math.max(20, width * 0.04);
  const startY = height * 0.82 - ((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, i) => {
    ctx.fillText(line, width / 2, startY + i * lineHeight);
  });

  ctx.restore();
}

function drawSongInfo(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  songName: string,
  artistName: string,
  color: string
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.7;
  ctx.font = `${Math.max(12, width * 0.018)}px 'Segoe UI', sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText(`${artistName} — ${songName}`, width * 0.03, height * 0.05);
  ctx.restore();
}

function drawAudioVisualizerBar(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  accentColor: string,
  time: number,
  intensity: number
): void {
  const barCount = 40;
  const barWidth = (width * 0.6) / barCount;
  const startX = width * 0.2;
  const baseY = height * 0.92;

  ctx.fillStyle = accentColor;
  ctx.globalAlpha = 0.5;

  for (let i = 0; i < barCount; i++) {
    const barHeight =
      (Math.sin(time * 3 + i * 0.5) * 0.5 + 0.5) *
      20 *
      intensity *
      (Math.sin(time * 2 + i * 0.3) * 0.3 + 0.7);
    ctx.fillRect(startX + i * barWidth * 1.2, baseY - barHeight, barWidth, barHeight);
  }

  ctx.globalAlpha = 1;
}

// ─── MAIN VIDEO GENERATION ─────────────────────────────────

export async function generateMusicVideo(
  config: MusicVideoConfig,
  onProgress: (progress: MusicVideoProgress) => void
): Promise<GeneratedMusicVideo> {
  const resolvedTheme = resolveTheme(config.theme);
  const resolvedAttire = resolveAttire(config.attire);
  const themeConfig = THEMES[resolvedTheme];

  onProgress({ stage: "init", percent: 5, message: "Initializing video generation..." });

  // Get audio duration
  let durationSeconds = 180; // default 3 min
  if (config.songFile) {
    try {
      durationSeconds = await getAudioDuration(config.songFile);
    } catch {
      console.warn("Could not read audio duration, using default");
    }
  }

  onProgress({ stage: "setup", percent: 10, message: `Song duration: ${Math.round(durationSeconds)}s. Setting up canvas...` });

  // Create canvas
  const canvas = document.createElement("canvas");
  const width = 1280;
  const height = 720;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Parse lyrics
  const lyricLines = parseLyrics(config.lyrics);
  const secondsPerLine = lyricLines.length > 0 ? durationSeconds / lyricLines.length : 5;

  // Load avatar image if provided
  let avatarImg: HTMLImageElement | null = null;
  if (config.avatarUrl) {
    try {
      avatarImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = config.avatarUrl!;
      });
    } catch {
      console.warn("Could not load avatar image");
    }
  }

  onProgress({ stage: "rendering", percent: 15, message: "Rendering video frames..." });

  // Generate frames using canvas
  // For browser-based generation, we'll create a series of frame snapshots
  // and compose them into a video using MediaRecorder
  const fps = 15;
  const totalFrames = Math.ceil(durationSeconds * fps);
  const chunks: Blob[] = [];

  // Use MediaRecorder if available
  const stream = canvas.captureStream(fps);

  // Add audio track if song file provided
  let audioCtx: AudioContext | null = null;
  let audioSource: MediaElementAudioSourceNode | null = null;

  if (config.songFile) {
    try {
      audioCtx = new AudioContext();
      const audio = new Audio();
      audio.src = URL.createObjectURL(config.songFile);
      audioSource = audioCtx.createMediaElementSource(audio);
      const dest = audioCtx.createMediaStreamDestination();
      audioSource.connect(dest);
      audioSource.connect(audioCtx.destination);

      // Add audio track to the stream
      dest.stream.getAudioTracks().forEach((track) => {
        stream.addTrack(track);
      });
    } catch {
      console.warn("Could not add audio track");
    }
  }

  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: "video/webm;codecs=vp9",
    videoBitsPerSecond: 2500000,
  });

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise<GeneratedMusicVideo>((resolve, reject) => {
    mediaRecorder.onstop = () => {
      onProgress({ stage: "encoding", percent: 90, message: "Encoding video..." });

      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);

      // Generate thumbnail from first frame
      ctx.clearRect(0, 0, width, height);
      drawGradientBackground(ctx, width, height, themeConfig, 0);
      drawParticles(ctx, width, height, themeConfig.particleColor, 0, 0.5);
      if (avatarImg) {
        const avatarSize = Math.min(width, height) * 0.3;
        ctx.drawImage(
          avatarImg,
          width / 2 - avatarSize / 2,
          height * 0.35 - avatarSize / 2,
          avatarSize,
          avatarSize
        );
      } else {
        drawAvatarPlaceholder(ctx, width, height, resolvedAttire, 0);
      }
      drawSongInfo(ctx, width, height, config.songName, config.artistName, themeConfig.textColor);
      const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.8);

      onProgress({ stage: "done", percent: 100, message: "Music video generated!" });

      resolve({
        id: `mv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        url,
        thumbnailUrl,
        songName: config.songName,
        artistName: config.artistName,
        theme: resolvedTheme,
        attire: resolvedAttire,
        durationSeconds,
        createdAt: new Date().toISOString(),
        fileSize: blob.size,
      });
    };

    mediaRecorder.onerror = (e) => {
      reject(new Error("MediaRecorder error"));
    };

    mediaRecorder.start(1000); // collect data every second

    // Render frames
    let frame = 0;
    const maxRenderFrames = Math.min(totalFrames, durationSeconds * fps);

    function renderFrame() {
      if (frame >= maxRenderFrames) {
        mediaRecorder.stop();
        if (audioCtx) audioCtx.close();
        return;
      }

      const time = frame / fps;
      const progress = frame / maxRenderFrames;

      // Update progress every 10%
      if (frame % Math.floor(maxRenderFrames / 10) === 0) {
        onProgress({
          stage: "rendering",
          percent: 15 + Math.floor(progress * 70),
          message: `Rendering frame ${frame}/${maxRenderFrames}...`,
        });
      }

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Background with slow animation
      drawGradientBackground(ctx, width, height, themeConfig, time);

      // Particles (intensity based on simulated audio)
      const intensity = 0.5 + Math.sin(time * 4) * 0.3 + Math.sin(time * 7) * 0.2;
      drawParticles(ctx, width, height, themeConfig.particleColor, time, intensity);

      // Avatar
      if (avatarImg) {
        const avatarSize = Math.min(width, height) * 0.3;
        const sway = Math.sin(time * 0.8) * 5;
        ctx.save();
        ctx.translate(sway, Math.sin(time * 0.5) * 3);
        ctx.drawImage(
          avatarImg,
          width / 2 - avatarSize / 2,
          height * 0.35 - avatarSize / 2,
          avatarSize,
          avatarSize
        );
        ctx.restore();
      } else {
        drawAvatarPlaceholder(ctx, width, height, resolvedAttire, time);
      }

      // Audio visualizer bar
      drawAudioVisualizerBar(ctx, width, height, themeConfig.accentColor, time, intensity);

      // Lyrics
      if (lyricLines.length > 0) {
        const currentLineIndex = Math.min(
          Math.floor(time / secondsPerLine),
          lyricLines.length - 1
        );
        const lineProgress = (time % secondsPerLine) / secondsPerLine;
        const opacity = lineProgress < 0.1 ? lineProgress / 0.1 : lineProgress > 0.9 ? (1 - lineProgress) / 0.1 : 1;
        drawLyricLine(ctx, width, height, lyricLines[currentLineIndex].text, themeConfig.textColor, opacity);
      }

      // Song info
      drawSongInfo(ctx, width, height, config.songName, config.artistName, themeConfig.textColor);

      frame++;
      // Use requestAnimationFrame for smooth rendering, but with a throttle
      if (frame % 2 === 0) {
        requestAnimationFrame(renderFrame);
      } else {
        setTimeout(renderFrame, 1000 / fps);
      }
    }

    renderFrame();
  });
}

// ─── STORAGE ────────────────────────────────────────────────

const STORAGE_KEY = "music-videos";

export function saveMusicVideo(video: GeneratedMusicVideo): void {
  const stored = loadMusicVideos();
  stored.unshift(video);
  // Keep only metadata, not blob URLs (those expire)
  const toStore = stored.map(({ url, thumbnailUrl, ...rest }) => rest);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
}

export function loadMusicVideos(): GeneratedMusicVideo[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // noop
  }
  return [];
}

export function deleteMusicVideo(id: string): void {
  const stored = loadMusicVideos();
  const filtered = stored.filter((v) => v.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
