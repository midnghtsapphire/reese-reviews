// ============================================================
// HEYGEN CLIENT — AI Avatar Video Generation
// Wraps HeyGen's REST API for creating avatar-driven review
// videos. Uses the user's configured avatar and voice.
//
// HeyGen docs: https://docs.heygen.com/reference/v2-video-generate
//
// All API keys are stored in localStorage (AutomationSettings)
// and NEVER committed to source code.
// ============================================================

// ─── TYPES ──────────────────────────────────────────────────

export interface HeyGenAvatarInfo {
  avatar_id: string;
  avatar_name: string;
  preview_image_url: string;
  preview_video_url: string;
  gender: "male" | "female" | "unknown";
}

export interface HeyGenVoiceInfo {
  voice_id: string;
  name: string;
  language: string;
  preview_audio: string;
  gender: string;
}

export interface HeyGenVideoRequest {
  /** HeyGen avatar ID */
  avatar_id: string;
  /** Avatar pose style */
  avatar_style?: "normal" | "circle" | "closeUp";
  /** Script text for the avatar to speak */
  script: string;
  /** Optional ElevenLabs voice ID (pass via voice_id field) */
  voice_id?: string;
  /** Video title for organization */
  title: string;
  /** Background color or image URL */
  background?: string;
  /** Output dimensions */
  width?: number;
  height?: number;
  /** Video speed (0.5–2.0) */
  speed?: number;
}

export interface HeyGenVideoStatus {
  video_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  error?: string;
  created_at: string;
}

// ─── ERROR TYPE ─────────────────────────────────────────────

export class HeyGenError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "HeyGenError";
  }
}

// ─── CLIENT ─────────────────────────────────────────────────

const HEYGEN_BASE_URL = "https://api.heygen.com";

/**
 * Create a HeyGen avatar video from a review script.
 * Returns immediately with a video_id; poll getVideoStatus()
 * until status === "completed" to get the video URL.
 */
export async function createHeyGenVideo(
  apiKey: string,
  request: HeyGenVideoRequest
): Promise<{ video_id: string }> {
  if (!apiKey) throw new HeyGenError("HeyGen API key is not configured. Add it in Review Settings.");

  const payload = {
    video_inputs: [
      {
        character: {
          type: "avatar",
          avatar_id: request.avatar_id,
          avatar_style: request.avatar_style ?? "normal",
        },
        voice: {
          type: request.voice_id ? "elevenlabs" : "text",
          ...(request.voice_id
            ? { voice_id: request.voice_id }
            : { voice_id: "en-US-Neural2-F" }),
          input_text: request.script,
          speed: request.speed ?? 1.0,
        },
        background: {
          type: "color",
          value: request.background ?? "#1e1b4b",
        },
      },
    ],
    dimension: {
      width: request.width ?? 1280,
      height: request.height ?? 720,
    },
    title: request.title,
  };

  const response = await fetch(`${HEYGEN_BASE_URL}/v2/video/generate`, {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new HeyGenError(`HeyGen API error ${response.status}: ${body}`, response.status);
  }

  const data = (await response.json()) as { data: { video_id: string } };
  return { video_id: data.data.video_id };
}

/**
 * Poll for video generation status.
 * status === "completed" → video_url is available.
 * status === "failed"    → error message is available.
 */
export async function getHeyGenVideoStatus(
  apiKey: string,
  videoId: string
): Promise<HeyGenVideoStatus> {
  if (!apiKey) throw new HeyGenError("HeyGen API key is not configured.");

  const response = await fetch(`${HEYGEN_BASE_URL}/v1/video_status.get?video_id=${videoId}`, {
    headers: { "X-Api-Key": apiKey },
  });

  if (!response.ok) {
    throw new HeyGenError(`HeyGen status check failed: ${response.status}`, response.status);
  }

  const data = (await response.json()) as {
    data: {
      video_id: string;
      status: string;
      video_url?: string;
      thumbnail_url?: string;
      duration?: number;
      error?: string;
      created_at: string;
    };
  };

  return {
    video_id: data.data.video_id,
    status: data.data.status as HeyGenVideoStatus["status"],
    video_url: data.data.video_url,
    thumbnail_url: data.data.thumbnail_url,
    duration: data.data.duration,
    error: data.data.error,
    created_at: data.data.created_at,
  };
}

/**
 * List available avatars for the authenticated account.
 * Includes both built-in HeyGen avatars and any custom avatars
 * uploaded by the user.
 */
export async function listHeyGenAvatars(apiKey: string): Promise<HeyGenAvatarInfo[]> {
  if (!apiKey) throw new HeyGenError("HeyGen API key is not configured.");

  const response = await fetch(`${HEYGEN_BASE_URL}/v2/avatars`, {
    headers: { "X-Api-Key": apiKey },
  });

  if (!response.ok) {
    throw new HeyGenError(`Failed to list HeyGen avatars: ${response.status}`, response.status);
  }

  const data = (await response.json()) as { data: { avatars: HeyGenAvatarInfo[] } };
  return data.data.avatars ?? [];
}

/**
 * List available voices for the account.
 */
export async function listHeyGenVoices(apiKey: string): Promise<HeyGenVoiceInfo[]> {
  if (!apiKey) throw new HeyGenError("HeyGen API key is not configured.");

  const response = await fetch(`${HEYGEN_BASE_URL}/v2/voices`, {
    headers: { "X-Api-Key": apiKey },
  });

  if (!response.ok) {
    throw new HeyGenError(`Failed to list HeyGen voices: ${response.status}`, response.status);
  }

  const data = (await response.json()) as { data: { voices: HeyGenVoiceInfo[] } };
  return data.data.voices ?? [];
}

/**
 * Poll until video is complete or failed (or timeout).
 * Returns the completed status with video URL.
 */
export async function waitForHeyGenVideo(
  apiKey: string,
  videoId: string,
  onProgress?: (status: HeyGenVideoStatus) => void,
  maxWaitMs = 300_000,
  pollIntervalMs = 5_000
): Promise<HeyGenVideoStatus> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const status = await getHeyGenVideoStatus(apiKey, videoId);
    onProgress?.(status);
    if (status.status === "completed" || status.status === "failed") {
      return status;
    }
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }
  throw new HeyGenError(`HeyGen video timed out after ${maxWaitMs / 1000}s`);
}
