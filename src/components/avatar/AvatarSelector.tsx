// ============================================================
// AVATAR SELECTOR
// Reusable component for selecting an avatar from stock or
// custom avatars. Used in ReviewVideoCreator, Publishing Wizard,
// and avatar management settings.
// ============================================================

import React, { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Check,
  Plus,
  Trash2,
  User,
  Camera,
  Image as ImageIcon,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAvatars,
  getStockAvatars,
  getCustomAvatars,
  addCustomAvatar,
  deleteCustomAvatar,
  setDefaultAvatar,
  getDefaultAvatar,
  type AvatarProfile,
  type AvatarPose,
  type AvatarMood,
} from "@/stores/avatarStore";

// ─── TYPES ──────────────────────────────────────────────────

interface AvatarSelectorProps {
  selectedAvatarId?: string;
  onSelect: (avatar: AvatarProfile) => void;
  showUpload?: boolean;
  showDelete?: boolean;
  compact?: boolean;
  className?: string;
}

// ─── COMPONENT ──────────────────────────────────────────────

export function AvatarSelector({
  selectedAvatarId,
  onSelect,
  showUpload = true,
  showDelete = true,
  compact = false,
  className = "",
}: AvatarSelectorProps) {
  const [avatars, setAvatars] = useState<AvatarProfile[]>(getAvatars());
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadPose, setUploadPose] = useState<AvatarPose>("headshot");
  const [uploadMood, setUploadMood] = useState<AvatarMood>("friendly");
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resolvedSelectedId =
    selectedAvatarId ?? getDefaultAvatar().id;

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleUploadSubmit = useCallback(() => {
    if (!uploadPreview || !uploadName.trim()) return;

    const newAvatar = addCustomAvatar({
      name: uploadName.toLowerCase().replace(/\s+/g, "-"),
      displayName: uploadName,
      imageUrl: uploadPreview,
      pose: uploadPose,
      mood: uploadMood,
      gender: "female",
      description: `Custom avatar: ${uploadName}`,
    });

    setAvatars(getAvatars());
    onSelect(newAvatar);
    setShowUploadForm(false);
    setUploadPreview(null);
    setUploadName("");
  }, [uploadPreview, uploadName, uploadPose, uploadMood, onSelect]);

  const handleDelete = useCallback(
    (id: string) => {
      deleteCustomAvatar(id);
      setAvatars(getAvatars());
      if (resolvedSelectedId === id) {
        const defaultAvatar = getDefaultAvatar();
        onSelect(defaultAvatar);
      }
    },
    [resolvedSelectedId, onSelect]
  );

  const handleSetDefault = useCallback(
    (id: string) => {
      setDefaultAvatar(id);
    },
    []
  );

  const handleImageError = useCallback((id: string) => {
    setImageErrors((prev) => new Set(prev).add(id));
  }, []);

  const stockAvatars = avatars.filter((a) => a.type === "stock");
  const customAvatars = avatars.filter((a) => a.type === "custom");

  if (compact) {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {avatars.map((avatar) => (
          <button
            key={avatar.id}
            onClick={() => onSelect(avatar)}
            className={`relative h-12 w-12 rounded-full overflow-hidden border-2 transition-all ${
              resolvedSelectedId === avatar.id
                ? "border-amber-500 ring-2 ring-amber-500/30"
                : "border-gray-700 hover:border-gray-500"
            }`}
            title={avatar.displayName}
          >
            {!imageErrors.has(avatar.id) ? (
              <img
                src={avatar.imageUrl}
                alt={avatar.displayName}
                className="w-full h-full object-cover"
                onError={() => handleImageError(avatar.id)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
            )}
            {resolvedSelectedId === avatar.id && (
              <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                <Check className="h-4 w-4 text-white drop-shadow" />
              </div>
            )}
          </button>
        ))}
        {showUpload && (
          <button
            onClick={() => setShowUploadForm(true)}
            className="h-12 w-12 rounded-full border-2 border-dashed border-gray-600 hover:border-amber-500 flex items-center justify-center transition-colors"
            title="Upload custom avatar"
          >
            <Plus className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Stock Avatars */}
      <div>
        <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <Camera className="h-4 w-4 text-amber-400" />
          Stock Avatars
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {stockAvatars.map((avatar) => (
            <AvatarCard
              key={avatar.id}
              avatar={avatar}
              isSelected={resolvedSelectedId === avatar.id}
              hasImageError={imageErrors.has(avatar.id)}
              onSelect={() => onSelect(avatar)}
              onSetDefault={() => handleSetDefault(avatar.id)}
              onImageError={() => handleImageError(avatar.id)}
            />
          ))}
        </div>
      </div>

      {/* Custom Avatars */}
      {customAvatars.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-blue-400" />
            Custom Avatars
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {customAvatars.map((avatar) => (
              <AvatarCard
                key={avatar.id}
                avatar={avatar}
                isSelected={resolvedSelectedId === avatar.id}
                hasImageError={imageErrors.has(avatar.id)}
                onSelect={() => onSelect(avatar)}
                onSetDefault={() => handleSetDefault(avatar.id)}
                onDelete={showDelete ? () => handleDelete(avatar.id) : undefined}
                onImageError={() => handleImageError(avatar.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upload Form */}
      {showUpload && (
        <div>
          {!showUploadForm ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUploadForm(true)}
              className="border-dashed border-gray-600 hover:border-amber-500"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Custom Avatar
            </Button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-lg border border-gray-700 bg-gray-800/50 p-4 space-y-3"
            >
              <h4 className="text-sm font-semibold text-gray-200">
                Upload Custom Avatar
              </h4>

              {/* File input */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {uploadPreview ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={uploadPreview}
                      alt="Preview"
                      className="h-16 w-16 rounded-full object-cover border-2 border-amber-500"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change Image
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-24 rounded-lg border-2 border-dashed border-gray-600 hover:border-amber-500 flex flex-col items-center justify-center gap-1 transition-colors"
                  >
                    <Upload className="h-6 w-6 text-gray-400" />
                    <span className="text-xs text-gray-400">
                      Click to upload image
                    </span>
                  </button>
                )}
              </div>

              {/* Name */}
              <div>
                <Label className="text-xs text-gray-400">Display Name</Label>
                <Input
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g. Reese — Kitchen Review"
                  className="mt-1 bg-gray-900 border-gray-700"
                />
              </div>

              {/* Pose & Mood */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-400">Pose</Label>
                  <Select
                    value={uploadPose}
                    onValueChange={(v) => setUploadPose(v as AvatarPose)}
                  >
                    <SelectTrigger className="mt-1 bg-gray-900 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="headshot">Headshot</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="lifestyle">Lifestyle</SelectItem>
                      <SelectItem value="action">Action</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Mood</Label>
                  <Select
                    value={uploadMood}
                    onValueChange={(v) => setUploadMood(v as AvatarMood)}
                  >
                    <SelectTrigger className="mt-1 bg-gray-900 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="confident">Confident</SelectItem>
                      <SelectItem value="thoughtful">Thoughtful</SelectItem>
                      <SelectItem value="excited">Excited</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleUploadSubmit}
                  disabled={!uploadPreview || !uploadName.trim()}
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Save Avatar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowUploadForm(false);
                    setUploadPreview(null);
                    setUploadName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── AVATAR CARD ────────────────────────────────────────────

function AvatarCard({
  avatar,
  isSelected,
  hasImageError,
  onSelect,
  onSetDefault,
  onDelete,
  onImageError,
}: {
  avatar: AvatarProfile;
  isSelected: boolean;
  hasImageError: boolean;
  onSelect: () => void;
  onSetDefault: () => void;
  onDelete?: () => void;
  onImageError: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`relative rounded-xl overflow-hidden border-2 transition-all text-left ${
        isSelected
          ? "border-amber-500 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10"
          : "border-gray-700 hover:border-gray-500"
      }`}
    >
      {/* Image */}
      <div className="aspect-square bg-gray-800">
        {!hasImageError ? (
          <img
            src={avatar.imageUrl}
            alt={avatar.displayName}
            className="w-full h-full object-cover"
            onError={onImageError}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-500/20 to-amber-700/20 flex items-center justify-center">
            <User className="h-8 w-8 text-amber-400/50" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2 bg-gray-800/80">
        <p className="text-xs font-medium text-gray-200 truncate">
          {avatar.displayName.split("—")[0].trim()}
        </p>
        <div className="flex items-center gap-1 mt-1">
          <Badge
            variant="outline"
            className="text-[10px] px-1 py-0 border-gray-600 text-gray-400"
          >
            {avatar.pose}
          </Badge>
          <Badge
            variant="outline"
            className="text-[10px] px-1 py-0 border-gray-600 text-gray-400"
          >
            {avatar.mood}
          </Badge>
        </div>
      </div>

      {/* Selected checkmark */}
      {isSelected && (
        <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center shadow">
          <Check className="h-4 w-4 text-black" />
        </div>
      )}

      {/* Type badge */}
      {avatar.type === "custom" && (
        <Badge className="absolute top-2 left-2 bg-blue-500/80 text-[10px]">
          Custom
        </Badge>
      )}

      {/* Delete button for custom avatars */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute bottom-12 right-2 h-6 w-6 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete avatar"
        >
          <Trash2 className="h-3 w-3 text-white" />
        </button>
      )}
    </motion.button>
  );
}

export default AvatarSelector;
