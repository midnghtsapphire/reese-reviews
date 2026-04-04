// ============================================================
// AVATAR STORE
// Unified avatar management for Caresse (Reese) persona.
// Supports stock avatars, custom uploaded avatars, and
// avatar selection for video reviews and review detail pages.
// ============================================================

const STORAGE_KEY_AVATARS = "reese-avatar-profiles";
const STORAGE_KEY_SELECTED = "reese-avatar-selected";

// ─── TYPES ──────────────────────────────────────────────────

export type AvatarPose = "headshot" | "casual" | "professional" | "lifestyle" | "action";
export type AvatarMood = "friendly" | "confident" | "thoughtful" | "excited" | "neutral";

export interface AvatarProfile {
  id: string;
  name: string;
  displayName: string;
  imageUrl: string;
  thumbnailUrl: string;
  type: "stock" | "custom";
  pose: AvatarPose;
  mood: AvatarMood;
  gender: "male" | "female" | "neutral";
  description: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AvatarOverlayConfig {
  avatarId: string;
  position: "bottom-left" | "bottom-right" | "top-left" | "top-right";
  size: "small" | "medium" | "large";
  shape: "circle" | "rounded-square" | "square";
  borderColor: string;
  showLabel: boolean;
  labelText: string;
  opacity: number;
}

// ─── STOCK AVATARS (Caresse / Reese persona) ────────────────

export const STOCK_AVATARS: AvatarProfile[] = [
  {
    id: "avatar-reese-headshot",
    name: "reese-headshot",
    displayName: "Reese — Professional Headshot",
    imageUrl: "/avatars/reese-professional-1.png",
    thumbnailUrl: "/avatars/reese-professional-1.png",
    type: "stock",
    pose: "headshot",
    mood: "confident",
    gender: "female",
    description: "Caresse's professional headshot — warm lighting, clean background",
    isDefault: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "avatar-reese-casual",
    name: "reese-casual",
    displayName: "Reese — Casual Review",
    imageUrl: "/avatars/reese-casual-2.png",
    thumbnailUrl: "/avatars/reese-casual-2.png",
    type: "stock",
    pose: "casual",
    mood: "friendly",
    gender: "female",
    description: "Caresse in a casual setting — relatable, approachable reviewer vibe",
    isDefault: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "avatar-reese-lifestyle",
    name: "reese-lifestyle",
    displayName: "Reese — Lifestyle",
    imageUrl: "/avatars/reese-casual-1.png",
    thumbnailUrl: "/avatars/reese-casual-1.png",
    type: "stock",
    pose: "lifestyle",
    mood: "excited",
    gender: "female",
    description: "Caresse in a lifestyle setting — home, products, everyday use",
    isDefault: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "avatar-reese-professional",
    name: "reese-professional",
    displayName: "Reese — Tech Expert",
    imageUrl: "/avatars/reese-professional-2.png",
    thumbnailUrl: "/avatars/reese-professional-2.png",
    type: "stock",
    pose: "professional",
    mood: "thoughtful",
    gender: "female",
    description: "Caresse in a professional/tech expert setting — analytical, detailed",
    isDefault: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "avatar-reese-unboxing",
    name: "reese-unboxing",
    displayName: "Reese — Unboxing",
    imageUrl: "/avatars/reese-unboxing.png",
    thumbnailUrl: "/avatars/reese-unboxing.png",
    type: "stock",
    pose: "action",
    mood: "excited",
    gender: "female",
    description: "Caresse opening a product — unboxing energy, genuine excitement",
    isDefault: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

// ─── DEFAULT OVERLAY CONFIG ─────────────────────────────────

export const DEFAULT_OVERLAY_CONFIG: AvatarOverlayConfig = {
  avatarId: "avatar-reese-headshot",
  position: "bottom-right",
  size: "medium",
  shape: "circle",
  borderColor: "#F59E0B", // Hailstorm Amber
  showLabel: true,
  labelText: "Reese's Quick Take",
  opacity: 1.0,
};

// ─── STORAGE HELPERS ────────────────────────────────────────

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored) as T;
  } catch {
    // ignore parse errors
  }
  return fallback;
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save to localStorage [${key}]:`, e);
  }
}

// ─── AVATAR CRUD ────────────────────────────────────────────

export function getAvatars(): AvatarProfile[] {
  const custom = loadFromStorage<AvatarProfile[]>(STORAGE_KEY_AVATARS, []);
  return [...STOCK_AVATARS, ...custom];
}

export function getStockAvatars(): AvatarProfile[] {
  return [...STOCK_AVATARS];
}

export function getCustomAvatars(): AvatarProfile[] {
  return loadFromStorage<AvatarProfile[]>(STORAGE_KEY_AVATARS, []);
}

export function getAvatar(id: string): AvatarProfile | undefined {
  return getAvatars().find((a) => a.id === id);
}

export function getDefaultAvatar(): AvatarProfile {
  const selected = loadFromStorage<string>(STORAGE_KEY_SELECTED, "");
  if (selected) {
    const avatar = getAvatar(selected);
    if (avatar) return avatar;
  }
  return STOCK_AVATARS.find((a) => a.isDefault) ?? STOCK_AVATARS[0];
}

export function setDefaultAvatar(id: string): void {
  saveToStorage(STORAGE_KEY_SELECTED, id);
}

export function addCustomAvatar(data: {
  name: string;
  displayName: string;
  imageUrl: string;
  pose: AvatarPose;
  mood: AvatarMood;
  gender: "male" | "female" | "neutral";
  description: string;
}): AvatarProfile {
  const now = new Date().toISOString();
  const avatar: AvatarProfile = {
    id: `avatar-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: data.name,
    displayName: data.displayName,
    imageUrl: data.imageUrl,
    thumbnailUrl: data.imageUrl, // Same for custom uploads
    type: "custom",
    pose: data.pose,
    mood: data.mood,
    gender: data.gender,
    description: data.description,
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  };
  const custom = getCustomAvatars();
  custom.push(avatar);
  saveToStorage(STORAGE_KEY_AVATARS, custom);
  return avatar;
}

export function updateCustomAvatar(
  id: string,
  patch: Partial<AvatarProfile>
): AvatarProfile | null {
  const custom = getCustomAvatars();
  const idx = custom.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  custom[idx] = { ...custom[idx], ...patch, updatedAt: new Date().toISOString() };
  saveToStorage(STORAGE_KEY_AVATARS, custom);
  return custom[idx];
}

export function deleteCustomAvatar(id: string): boolean {
  const custom = getCustomAvatars();
  const filtered = custom.filter((a) => a.id !== id);
  if (filtered.length === custom.length) return false;
  saveToStorage(STORAGE_KEY_AVATARS, filtered);
  // If this was the selected default, reset
  const selected = loadFromStorage<string>(STORAGE_KEY_SELECTED, "");
  if (selected === id) {
    saveToStorage(STORAGE_KEY_SELECTED, "");
  }
  return true;
}

// ─── OVERLAY CONFIG ─────────────────────────────────────────

const OVERLAY_CONFIG_KEY = "reese-avatar-overlay-config";

export function getOverlayConfig(): AvatarOverlayConfig {
  return loadFromStorage<AvatarOverlayConfig>(OVERLAY_CONFIG_KEY, DEFAULT_OVERLAY_CONFIG);
}

export function updateOverlayConfig(patch: Partial<AvatarOverlayConfig>): AvatarOverlayConfig {
  const current = getOverlayConfig();
  const updated = { ...current, ...patch };
  saveToStorage(OVERLAY_CONFIG_KEY, updated);
  return updated;
}

export function resetOverlayConfig(): AvatarOverlayConfig {
  saveToStorage(OVERLAY_CONFIG_KEY, DEFAULT_OVERLAY_CONFIG);
  return DEFAULT_OVERLAY_CONFIG;
}

// ─── AVATAR SIZE HELPERS ────────────────────────────────────

export function getAvatarSizePixels(size: AvatarOverlayConfig["size"]): number {
  switch (size) {
    case "small": return 64;
    case "medium": return 96;
    case "large": return 128;
    default: return 96;
  }
}

export function getAvatarPositionCSS(position: AvatarOverlayConfig["position"]): React.CSSProperties {
  switch (position) {
    case "bottom-left": return { bottom: 16, left: 16 };
    case "bottom-right": return { bottom: 16, right: 16 };
    case "top-left": return { top: 16, left: 16 };
    case "top-right": return { top: 16, right: 16 };
    default: return { bottom: 16, right: 16 };
  }
}
