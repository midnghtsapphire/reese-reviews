// ============================================================
// ELEVENLABS CLIENT — AI Voice Synthesis
// Wraps ElevenLabs API for generating realistic voice-overs
// for review videos. Supports voice cloning (custom voices),
// pre-built voices, and voice library management.
//
// ElevenLabs docs: https://elevenlabs.io/docs/api-reference
//
// All API keys stored in localStorage (AutomationSettings).
// NEVER commit API keys to source code.
// ============================================================

// ─── TYPES ──────────────────────────────────────────────────

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  preview_url: string;
  category: "premade" | "cloned" | "generated";
  labels: Record<string, string>;
  description?: string;
  samples?: Array<{ sample_id: string; file_name: string; mime_type: string }>;
  settings?: { stability: number; similarity_boost: number; style: number };
}

export interface ElevenLabsTTSRequest {
  /** ElevenLabs voice ID */
  voice_id: string;
  /** Text to synthesize */
  text: string;
  /** Model ID — use eleven_multilingual_v2 for best quality */
  model_id?: string;
  voice_settings?: {
    /** 0–1: Higher = more consistent, lower = more variable */
    stability?: number;
    /** 0–1: Higher = closer to original voice */
    similarity_boost?: number;
    /** 0–1: Speaking style exaggeration */
    style?: number;
    /** Use speaker boost for enhanced clarity */
    use_speaker_boost?: boolean;
  };
  output_format?:
    | "mp3_44100_128"
    | "mp3_22050_32"
    | "pcm_16000"
    | "pcm_22050"
    | "pcm_24000"
    | "pcm_44100";
}

export interface ElevenLabsUsage {
  character_count: number;
  character_limit: number;
  characters_remaining: number;
}

// ─── ERROR ──────────────────────────────────────────────────

export class ElevenLabsError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "ElevenLabsError";
  }
}

// ─── CLIENT ─────────────────────────────────────────────────

const ELEVEN_BASE_URL = "https://api.elevenlabs.io/v1";

/**
 * Convert text to speech using a specified voice.
 * Returns audio as a Blob (MP3 or PCM).
 */
export async function textToSpeech(
  apiKey: string,
  request: ElevenLabsTTSRequest
): Promise<Blob> {
  if (!apiKey) throw new ElevenLabsError("ElevenLabs API key is not configured. Add it in Review Settings.");

  const { voice_id, text, model_id, voice_settings, output_format } = request;

  const response = await fetch(
    `${ELEVEN_BASE_URL}/text-to-speech/${voice_id}${output_format ? `?output_format=${output_format}` : ""}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: model_id ?? "eleven_multilingual_v2",
        voice_settings: {
          stability: voice_settings?.stability ?? 0.5,
          similarity_boost: voice_settings?.similarity_boost ?? 0.75,
          style: voice_settings?.style ?? 0.0,
          use_speaker_boost: voice_settings?.use_speaker_boost ?? true,
        },
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new ElevenLabsError(
      `ElevenLabs TTS error ${response.status}: ${body}`,
      response.status
    );
  }

  return await response.blob();
}

/**
 * Convert text to speech and return a browser-playable URL.
 * The caller is responsible for revoking the URL with URL.revokeObjectURL()
 * when done.
 */
export async function textToSpeechUrl(
  apiKey: string,
  request: ElevenLabsTTSRequest
): Promise<string> {
  const blob = await textToSpeech(apiKey, request);
  return URL.createObjectURL(blob);
}

/**
 * List all available voices for the account (both premade and cloned).
 */
export async function listElevenLabsVoices(apiKey: string): Promise<ElevenLabsVoice[]> {
  if (!apiKey) throw new ElevenLabsError("ElevenLabs API key is not configured.");

  const response = await fetch(`${ELEVEN_BASE_URL}/voices`, {
    headers: { "xi-api-key": apiKey },
  });

  if (!response.ok) {
    throw new ElevenLabsError(`Failed to list voices: ${response.status}`, response.status);
  }

  const data = (await response.json()) as { voices: ElevenLabsVoice[] };
  return data.voices ?? [];
}

/**
 * Get current character usage (billing).
 */
export async function getElevenLabsUsage(apiKey: string): Promise<ElevenLabsUsage> {
  if (!apiKey) throw new ElevenLabsError("ElevenLabs API key is not configured.");

  const response = await fetch(`${ELEVEN_BASE_URL}/user/subscription`, {
    headers: { "xi-api-key": apiKey },
  });

  if (!response.ok) {
    throw new ElevenLabsError(`Failed to get usage: ${response.status}`, response.status);
  }

  const data = (await response.json()) as {
    character_count: number;
    character_limit: number;
  };

  return {
    character_count: data.character_count,
    character_limit: data.character_limit,
    characters_remaining: data.character_limit - data.character_count,
  };
}

/**
 * Build a clean review voice-over script from a review text.
 * Strips markdown, normalizes whitespace, keeps it under ~500 chars
 * for 30-second videos.
 */
export function buildVoiceOverScript(
  reviewTitle: string,
  reviewBody: string,
  rating: number,
  productName: string,
  maxChars = 500
): string {
  const ratingText =
    rating >= 5
      ? "five stars"
      : rating >= 4
      ? "four stars"
      : rating >= 3
      ? "three stars"
      : rating >= 2
      ? "two stars"
      : "one star";

  // Strip markdown and extra whitespace
  const cleanBody = reviewBody
    .replace(/[*_`#>]/g, "")
    .replace(/\n+/g, " ")
    .trim();

  const script = `${reviewTitle}. I'm giving ${productName} ${ratingText}. ${cleanBody}`;

  // Truncate to maxChars at word boundary
  if (script.length <= maxChars) return script;
  const truncated = script.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(" ");
  return truncated.slice(0, lastSpace) + "...";
}
