// ============================================================
// AVATAR REVIEW OVERLAY
// Displays Caresse's avatar on review detail pages with a
// "Reese's Quick Take" overlay badge. Supports configurable
// position, size, shape, and label text.
// ============================================================

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Play, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getAvatar,
  getDefaultAvatar,
  getOverlayConfig,
  getAvatarSizePixels,
  type AvatarProfile,
  type AvatarOverlayConfig,
} from "@/stores/avatarStore";

// ─── TYPES ──────────────────────────────────────────────────

interface AvatarReviewOverlayProps {
  /** Override avatar ID (otherwise uses default) */
  avatarId?: string;
  /** Quick take text shown on expand */
  quickTake?: string;
  /** Star rating to display */
  rating?: number;
  /** Video URL if review has video */
  videoUrl?: string;
  /** Product name for context */
  productName?: string;
  /** Override overlay config */
  configOverride?: Partial<AvatarOverlayConfig>;
  /** Additional CSS classes */
  className?: string;
}

// ─── COMPONENT ──────────────────────────────────────────────

export function AvatarReviewOverlay({
  avatarId,
  quickTake,
  rating,
  videoUrl,
  productName,
  configOverride,
  className = "",
}: AvatarReviewOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [avatar, setAvatar] = useState<AvatarProfile | null>(null);
  const [config, setConfig] = useState<AvatarOverlayConfig>(getOverlayConfig());
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const resolvedAvatar = avatarId ? getAvatar(avatarId) : getDefaultAvatar();
    setAvatar(resolvedAvatar ?? getDefaultAvatar());
    if (configOverride) {
      setConfig({ ...getOverlayConfig(), ...configOverride });
    }
  }, [avatarId, configOverride]);

  if (!avatar) return null;

  const size = getAvatarSizePixels(config.size);
  const positionStyles = getPositionStyles(config.position);
  const shapeClass = getShapeClass(config.shape);

  return (
    <div
      className={`fixed z-50 ${className}`}
      style={positionStyles}
    >
      <AnimatePresence>
        {isExpanded && (quickTake || rating || videoUrl) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full mb-3 right-0 w-72 rounded-xl border border-amber-500/30 bg-gray-900/95 backdrop-blur-lg shadow-2xl shadow-amber-500/10 p-4"
          >
            {/* Close button */}
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Close quick take"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400">
                {config.labelText || "Reese's Quick Take"}
              </span>
            </div>

            {/* Rating */}
            {rating !== undefined && (
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(rating)
                        ? "fill-amber-400 text-amber-400"
                        : i < rating
                        ? "fill-amber-400/50 text-amber-400"
                        : "text-gray-600"
                    }`}
                  />
                ))}
                <span className="ml-1 text-sm text-gray-300">{rating}/5</span>
              </div>
            )}

            {/* Quick take text */}
            {quickTake && (
              <p className="text-sm text-gray-300 leading-relaxed mb-3">
                {quickTake}
              </p>
            )}

            {/* Video CTA */}
            {videoUrl && (
              <Button
                size="sm"
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                onClick={() => {
                  // Open video in modal or navigate
                  window.open(videoUrl, "_blank");
                }}
              >
                <Play className="h-4 w-4 mr-1" />
                Watch Video Review
              </Button>
            )}

            {/* Product name */}
            {productName && (
              <p className="text-xs text-gray-500 mt-2 truncate">
                Reviewing: {productName}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar bubble */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className={`relative group cursor-pointer ${shapeClass} overflow-hidden shadow-lg shadow-amber-500/20 border-2 transition-all duration-300`}
        style={{
          width: size,
          height: size,
          borderColor: config.borderColor,
          opacity: config.opacity,
        }}
        aria-label={`${config.labelText || "Reese's Quick Take"} — click to ${isExpanded ? "close" : "expand"}`}
      >
        {/* Avatar image */}
        {!imageError ? (
          <img
            src={avatar.imageUrl}
            alt={avatar.displayName}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {avatar.displayName.charAt(0)}
            </span>
          </div>
        )}

        {/* Hover glow */}
        <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/10 transition-colors" />

        {/* Pulse indicator when collapsed and has content */}
        {!isExpanded && (quickTake || rating) && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500" />
          </span>
        )}
      </motion.button>

      {/* Label badge */}
      {config.showLabel && !isExpanded && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute -left-2 top-1/2 -translate-y-1/2 -translate-x-full"
        >
          <span className="whitespace-nowrap rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-black shadow-lg">
            {config.labelText || "Reese's Quick Take"}
          </span>
        </motion.div>
      )}
    </div>
  );
}

// ─── INLINE AVATAR OVERLAY (for embedding in review content) ─

interface InlineAvatarOverlayProps {
  avatarId?: string;
  quickTake: string;
  rating?: number;
  className?: string;
}

export function InlineAvatarOverlay({
  avatarId,
  quickTake,
  rating,
  className = "",
}: InlineAvatarOverlayProps) {
  const [avatar, setAvatar] = useState<AvatarProfile | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const resolvedAvatar = avatarId ? getAvatar(avatarId) : getDefaultAvatar();
    setAvatar(resolvedAvatar ?? getDefaultAvatar());
  }, [avatarId]);

  if (!avatar) return null;

  return (
    <div
      className={`rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-transparent p-4 ${className}`}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {!imageError ? (
            <img
              src={avatar.imageUrl}
              alt={avatar.displayName}
              className="h-14 w-14 rounded-full object-cover border-2 border-amber-500"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center border-2 border-amber-500">
              <span className="text-white font-bold text-lg">
                {avatar.displayName.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-amber-400">
              Reese's Quick Take
            </span>
            {rating !== undefined && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.floor(rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-600"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{quickTake}</p>
        </div>
      </div>
    </div>
  );
}

// ─── VIDEO PIP OVERLAY (for video player) ───────────────────

interface VideoPiPOverlayProps {
  avatarId?: string;
  position?: AvatarOverlayConfig["position"];
  size?: AvatarOverlayConfig["size"];
  className?: string;
}

export function VideoPiPOverlay({
  avatarId,
  position = "bottom-right",
  size = "medium",
  className = "",
}: VideoPiPOverlayProps) {
  const [avatar, setAvatar] = useState<AvatarProfile | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const resolvedAvatar = avatarId ? getAvatar(avatarId) : getDefaultAvatar();
    setAvatar(resolvedAvatar ?? getDefaultAvatar());
  }, [avatarId]);

  if (!avatar) return null;

  const sizePixels = getAvatarSizePixels(size);
  const posStyles = getPositionStyles(position);

  return (
    <div
      className={`absolute z-10 ${className}`}
      style={{ ...posStyles, position: "absolute" }}
    >
      <div
        className="rounded-full overflow-hidden border-2 border-amber-500 shadow-lg shadow-black/50"
        style={{ width: sizePixels, height: sizePixels }}
      >
        {!imageError ? (
          <img
            src={avatar.imageUrl}
            alt={avatar.displayName}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
            <span className="text-white font-bold">
              {avatar.displayName.charAt(0)}
            </span>
          </div>
        )}
      </div>
      {/* Name badge */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/30">
        {avatar.displayName.split("—")[0].trim()}
      </div>
    </div>
  );
}

// ─── HELPERS ────────────────────────────────────────────────

function getPositionStyles(
  position: AvatarOverlayConfig["position"]
): React.CSSProperties {
  switch (position) {
    case "bottom-left":
      return { bottom: 24, left: 24 };
    case "bottom-right":
      return { bottom: 24, right: 24 };
    case "top-left":
      return { top: 24, left: 24 };
    case "top-right":
      return { top: 24, right: 24 };
    default:
      return { bottom: 24, right: 24 };
  }
}

function getShapeClass(shape: AvatarOverlayConfig["shape"]): string {
  switch (shape) {
    case "circle":
      return "rounded-full";
    case "rounded-square":
      return "rounded-xl";
    case "square":
      return "rounded-none";
    default:
      return "rounded-full";
  }
}

export default AvatarReviewOverlay;
