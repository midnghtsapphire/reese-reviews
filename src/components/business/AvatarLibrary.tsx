// ============================================================
// AVATAR LIBRARY
// Manage avatar images and voice files for review videos.
// Supports HeyGen avatar IDs, custom uploaded images,
// and ElevenLabs voice IDs.
//
// Designed AUDHD-friendly: large targets, clear labels,
// persistent localStorage storage.
// ============================================================

import React, { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  Mic,
  Upload,
  Trash2,
  CheckCircle2,
  Plus,
  Eye,
  Settings2,
  Play,
  Pause,
  Star,
  AlertCircle,
  Info,
  RefreshCw,
} from "lucide-react";
import { getSettings, updateSettings } from "@/stores/reviewAutomationStore";
import { listHeyGenAvatars, listHeyGenVoices, HeyGenError } from "@/lib/heygenClient";
import { listElevenLabsVoices, getElevenLabsUsage, ElevenLabsError } from "@/lib/elevenLabsClient";
import type { HeyGenAvatarInfo, HeyGenVoiceInfo } from "@/lib/heygenClient";
import type { ElevenLabsVoice } from "@/lib/elevenLabsClient";

// ─── STORAGE ────────────────────────────────────────────────

const SK_AVATARS = "rr-avatar-library";

export interface AvatarEntry {
  id: string;
  name: string;
  /** "reese" | "revvel" | custom */
  persona: string;
  /** HeyGen avatar ID */
  heygen_avatar_id?: string;
  /** Data URL of uploaded preview image */
  preview_image_url?: string;
  /** ElevenLabs voice ID for this avatar */
  elevenlabs_voice_id?: string;
  /** ElevenLabs voice name for display */
  voice_name?: string;
  isDefault: boolean;
  created_at: string;
}

function loadAvatars(): AvatarEntry[] {
  try {
    const raw = localStorage.getItem(SK_AVATARS);
    if (raw) return JSON.parse(raw) as AvatarEntry[];
  } catch {
    // ignore
  }
  return DEFAULT_AVATARS;
}

function saveAvatars(avatars: AvatarEntry[]): void {
  try {
    localStorage.setItem(SK_AVATARS, JSON.stringify(avatars));
  } catch {
    console.warn("[AvatarLibrary] Failed to save");
  }
}

const DEFAULT_AVATARS: AvatarEntry[] = [
  {
    id: "avatar-reese",
    name: "Reese",
    persona: "reese",
    heygen_avatar_id: "",
    preview_image_url: "",
    elevenlabs_voice_id: "",
    voice_name: "",
    isDefault: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "avatar-revvel",
    name: "Revvel",
    persona: "revvel",
    heygen_avatar_id: "",
    preview_image_url: "",
    elevenlabs_voice_id: "",
    voice_name: "",
    isDefault: false,
    created_at: new Date().toISOString(),
  },
];

// ─── COMPONENT ──────────────────────────────────────────────

export function AvatarLibrary() {
  const [avatars, setAvatars] = useState<AvatarEntry[]>(() => loadAvatars());
  const [settings, setSettingsState] = useState(() => getSettings());
  const [heygenAvatarList, setHeygenAvatarList] = useState<HeyGenAvatarInfo[]>([]);
  const [elevenLabsVoices, setElevenLabsVoices] = useState<ElevenLabsVoice[]>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(false);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AvatarEntry>>({});
  const [elevenLabsUsage, setElevenLabsUsage] = useState<{ character_count: number; character_limit: number } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showMessage = useCallback((type: "success" | "error" | "info", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }, []);

  function handleSaveAvatar() {
    if (!editForm.name) {
      showMessage("error", "Avatar name is required.");
      return;
    }
    const now = new Date().toISOString();
    if (editId) {
      const updated = avatars.map((a) =>
        a.id === editId ? { ...a, ...editForm, updated_at: now } as AvatarEntry : a
      );
      saveAvatars(updated);
      setAvatars(updated);
    } else {
      const newEntry: AvatarEntry = {
        id: `avatar-${Date.now()}`,
        name: editForm.name ?? "New Avatar",
        persona: editForm.persona ?? editForm.name ?? "custom",
        heygen_avatar_id: editForm.heygen_avatar_id ?? "",
        preview_image_url: editForm.preview_image_url ?? "",
        elevenlabs_voice_id: editForm.elevenlabs_voice_id ?? "",
        voice_name: editForm.voice_name ?? "",
        isDefault: false,
        created_at: now,
      };
      const updated = [...avatars, newEntry];
      saveAvatars(updated);
      setAvatars(updated);
    }
    setEditId(null);
    setEditForm({});
    showMessage("success", "Avatar saved.");
  }

  function handleDelete(id: string) {
    const updated = avatars.filter((a) => a.id !== id);
    saveAvatars(updated);
    setAvatars(updated);
    showMessage("info", "Avatar removed from library.");
  }

  function handleSetDefault(id: string) {
    const updated = avatars.map((a) => ({ ...a, isDefault: a.id === id }));
    saveAvatars(updated);
    setAvatars(updated);
    const avatar = updated.find((a) => a.id === id);
    if (avatar) {
      updateSettings({
        heygenAvatarId: avatar.heygen_avatar_id ?? "",
        elevenLabsVoiceId: avatar.elevenlabs_voice_id ?? "",
        defaultAvatar: (avatar.persona as "reese" | "revvel") ?? "reese",
      });
      setSettingsState(getSettings());
    }
    showMessage("success", `${avatar?.name} set as default avatar.`);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setEditForm((prev) => ({ ...prev, preview_image_url: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  async function handleLoadHeyGenAvatars() {
    if (!settings.heygenApiKey) {
      showMessage("error", "Enter your HeyGen API key in Settings first.");
      return;
    }
    setLoadingAvatars(true);
    try {
      const list = await listHeyGenAvatars(settings.heygenApiKey);
      setHeygenAvatarList(list);
      showMessage("success", `Loaded ${list.length} avatars from HeyGen.`);
    } catch (err) {
      showMessage("error", err instanceof HeyGenError ? err.message : "Failed to load HeyGen avatars.");
    } finally {
      setLoadingAvatars(false);
    }
  }

  async function handleLoadElevenLabsVoices() {
    if (!settings.elevenLabsApiKey) {
      showMessage("error", "Enter your ElevenLabs API key in Settings first.");
      return;
    }
    setLoadingVoices(true);
    try {
      const [voices, usage] = await Promise.all([
        listElevenLabsVoices(settings.elevenLabsApiKey),
        getElevenLabsUsage(settings.elevenLabsApiKey),
      ]);
      setElevenLabsVoices(voices);
      setElevenLabsUsage(usage);
      showMessage("success", `Loaded ${voices.length} voices from ElevenLabs.`);
    } catch (err) {
      showMessage("error", err instanceof ElevenLabsError ? err.message : "Failed to load ElevenLabs voices.");
    } finally {
      setLoadingVoices(false);
    }
  }

  async function handlePreviewVoice(previewUrl: string, voiceId: string) {
    if (playingVoice === voiceId) {
      audioRef.current?.pause();
      setPlayingVoice(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    audioRef.current = new Audio(previewUrl);
    audioRef.current.onended = () => setPlayingVoice(null);
    audioRef.current.play().catch(() => setPlayingVoice(null));
    setPlayingVoice(voiceId);
  }

  function handleSelectHeyGenAvatar(avatar: HeyGenAvatarInfo) {
    setEditForm((prev) => ({
      ...prev,
      heygen_avatar_id: avatar.avatar_id,
      preview_image_url: avatar.preview_image_url || prev.preview_image_url,
      name: prev.name || avatar.avatar_name,
    }));
  }

  function handleSelectElevenLabsVoice(voice: ElevenLabsVoice) {
    setEditForm((prev) => ({
      ...prev,
      elevenlabs_voice_id: voice.voice_id,
      voice_name: voice.name,
    }));
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <User className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">Avatar & Voice Library</CardTitle>
              <CardDescription className="text-gray-400">
                Load your HeyGen avatars and ElevenLabs voices. Set a default for new review videos.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* API Key Status */}
      <div className="grid grid-cols-2 gap-3">
        <Card className={`border ${settings.heygenApiKey ? "bg-green-900/20 border-green-600/30" : "bg-white/5 border-white/10"}`}>
          <CardContent className="pt-3 pb-3 flex items-center gap-2">
            {settings.heygenApiKey ? (
              <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-gray-400 shrink-0" />
            )}
            <div>
              <p className="text-white text-xs font-medium">HeyGen</p>
              <p className={`text-[10px] ${settings.heygenApiKey ? "text-green-400" : "text-gray-500"}`}>
                {settings.heygenApiKey ? "API key configured ✓" : "No API key — add in Settings"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className={`border ${settings.elevenLabsApiKey ? "bg-green-900/20 border-green-600/30" : "bg-white/5 border-white/10"}`}>
          <CardContent className="pt-3 pb-3 flex items-center gap-2">
            {settings.elevenLabsApiKey ? (
              <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-gray-400 shrink-0" />
            )}
            <div>
              <p className="text-white text-xs font-medium">ElevenLabs</p>
              <p className={`text-[10px] ${settings.elevenLabsApiKey ? "text-green-400" : "text-gray-500"}`}>
                {settings.elevenLabsApiKey
                  ? elevenLabsUsage
                    ? `${elevenLabsUsage.characters_remaining.toLocaleString()} chars left`
                    : "API key configured ✓"
                  : "No API key — add in Settings"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message */}
      {message && (
        <Alert
          className={
            message.type === "success"
              ? "bg-green-900/20 border-green-500/30"
              : message.type === "error"
              ? "bg-red-900/20 border-red-500/30"
              : "bg-blue-900/20 border-blue-500/30"
          }
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-green-400" />
          ) : message.type === "error" ? (
            <AlertCircle className="h-4 w-4 text-red-400" />
          ) : (
            <Info className="h-4 w-4 text-blue-400" />
          )}
          <AlertDescription
            className={
              message.type === "success" ? "text-green-200" : message.type === "error" ? "text-red-200" : "text-blue-200"
            }
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Saved Avatars */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base">Your Avatars ({avatars.length})</CardTitle>
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => {
                setEditId(null);
                setEditForm({});
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Avatar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {avatars.map((avatar) => (
            <div
              key={avatar.id}
              className={`p-3 rounded-lg border transition-all ${
                avatar.isDefault
                  ? "bg-purple-900/30 border-purple-600/40"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar preview */}
                <div className="w-14 h-14 rounded-full bg-white/10 overflow-hidden flex items-center justify-center shrink-0 border-2 border-white/20">
                  {avatar.preview_image_url ? (
                    <img src={avatar.preview_image_url} alt={avatar.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">{avatar.persona === "reese" ? "👩" : avatar.persona === "revvel" ? "⭐" : "👤"}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-white font-medium text-sm">{avatar.name}</p>
                    {avatar.isDefault && (
                      <Badge className="bg-purple-600/40 text-purple-200 text-[10px]">Default</Badge>
                    )}
                  </div>
                  {avatar.heygen_avatar_id && (
                    <p className="text-xs text-gray-500 truncate">HeyGen: {avatar.heygen_avatar_id}</p>
                  )}
                  {avatar.voice_name && (
                    <p className="text-xs text-gray-500 truncate">Voice: {avatar.voice_name}</p>
                  )}
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {!avatar.isDefault && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[10px] border-white/20 text-white hover:bg-white/10"
                        onClick={() => handleSetDefault(avatar.id)}
                      >
                        <Star className="h-3 w-3 mr-0.5" /> Set Default
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-[10px] text-gray-400 hover:text-white"
                      onClick={() => {
                        setEditId(avatar.id);
                        setEditForm({ ...avatar });
                      }}
                    >
                      <Settings2 className="h-3 w-3 mr-0.5" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-[10px] text-red-400 hover:text-red-300"
                      onClick={() => handleDelete(avatar.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Edit / Add Form */}
      {(editId !== null || Object.keys(editForm).length > 0) && (
        <Card className="bg-white/5 border-purple-600/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base">
              {editId ? "Edit Avatar" : "Add New Avatar"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-white text-sm mb-1.5 block">Avatar Name *</Label>
                <Input
                  value={editForm.name ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Reese, Revvel"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                />
              </div>
              <div>
                <Label className="text-white text-sm mb-1.5 block">Persona Slot</Label>
                <Input
                  value={editForm.persona ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, persona: e.target.value }))}
                  placeholder="reese, revvel, or custom"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                />
              </div>
              <div>
                <Label className="text-white text-sm mb-1.5 block">HeyGen Avatar ID</Label>
                <Input
                  value={editForm.heygen_avatar_id ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, heygen_avatar_id: e.target.value }))}
                  placeholder="Paste HeyGen avatar_id here"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                />
              </div>
              <div>
                <Label className="text-white text-sm mb-1.5 block">ElevenLabs Voice ID</Label>
                <Input
                  value={editForm.elevenlabs_voice_id ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, elevenlabs_voice_id: e.target.value }))}
                  placeholder="Paste ElevenLabs voice_id here"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <Label className="text-white text-sm mb-1.5 block">Preview Image (optional)</Label>
              <div className="flex items-center gap-3">
                {editForm.preview_image_url && (
                  <img
                    src={editForm.preview_image_url}
                    alt="Preview"
                    className="w-12 h-12 rounded-full object-cover border border-white/20"
                  />
                )}
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-1" /> Upload Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={handleSaveAvatar}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Save Avatar
              </Button>
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => { setEditId(null); setEditForm({}); }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* HeyGen Avatar Browser */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-white text-base">Browse HeyGen Avatars</CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={handleLoadHeyGenAvatars}
              disabled={loadingAvatars}
            >
              {loadingAvatars ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Load from HeyGen
            </Button>
          </div>
        </CardHeader>
        {heygenAvatarList.length > 0 && (
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {heygenAvatarList.map((avatar) => (
                <button
                  key={avatar.avatar_id}
                  onClick={() => handleSelectHeyGenAvatar(avatar)}
                  className={`p-2 rounded-lg border text-left transition-all hover:border-purple-500/50 ${
                    editForm.heygen_avatar_id === avatar.avatar_id
                      ? "bg-purple-900/30 border-purple-600/40"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  {avatar.preview_image_url ? (
                    <img
                      src={avatar.preview_image_url}
                      alt={avatar.avatar_name}
                      className="w-full aspect-square object-cover rounded mb-1.5"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-white/10 rounded mb-1.5 flex items-center justify-center text-2xl">
                      👤
                    </div>
                  )}
                  <p className="text-white text-xs font-medium truncate">{avatar.avatar_name}</p>
                  <p className="text-gray-500 text-[10px] truncate">{avatar.avatar_id}</p>
                  {editForm.heygen_avatar_id === avatar.avatar_id && (
                    <Badge className="mt-1 bg-purple-600/40 text-purple-200 text-[10px]">Selected</Badge>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        )}
        {heygenAvatarList.length === 0 && !loadingAvatars && (
          <CardContent>
            <p className="text-gray-500 text-sm text-center py-3">
              Click "Load from HeyGen" to browse your available avatars.
            </p>
          </CardContent>
        )}
      </Card>

      {/* ElevenLabs Voice Browser */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-white text-base">Browse ElevenLabs Voices</CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={handleLoadElevenLabsVoices}
              disabled={loadingVoices}
            >
              {loadingVoices ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Mic className="h-4 w-4 mr-1" />
              )}
              Load Voices
            </Button>
          </div>
        </CardHeader>
        {elevenLabsVoices.length > 0 && (
          <CardContent>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {elevenLabsVoices.map((voice) => (
                <button
                  key={voice.voice_id}
                  onClick={() => handleSelectElevenLabsVoice(voice)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all hover:border-purple-500/50 ${
                    editForm.elevenlabs_voice_id === voice.voice_id
                      ? "bg-purple-900/30 border-purple-600/40"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <div className="p-1.5 bg-white/10 rounded-full shrink-0">
                    <Mic className="h-3 w-3 text-gray-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{voice.name}</p>
                    <p className="text-gray-500 text-xs">
                      {voice.category} · {voice.labels?.accent ?? voice.language ?? "en"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {voice.preview_url && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewVoice(voice.preview_url, voice.voice_id);
                        }}
                        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                        title="Preview voice"
                      >
                        {playingVoice === voice.voice_id ? (
                          <Pause className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </button>
                    )}
                    {editForm.elevenlabs_voice_id === voice.voice_id && (
                      <CheckCircle2 className="h-4 w-4 text-purple-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        )}
        {elevenLabsVoices.length === 0 && !loadingVoices && (
          <CardContent>
            <p className="text-gray-500 text-sm text-center py-3">
              Click "Load Voices" to browse your ElevenLabs voice library.
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
