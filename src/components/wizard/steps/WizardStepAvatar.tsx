// ============================================================
// WIZARD STEP 3: AVATAR SELECTION
// Pick which avatar to use for the video review.
// Supports stock avatars and custom uploads.
// ============================================================

import React, { useState, useCallback } from "react";
import { User, MessageSquare } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AvatarSelector } from "@/components/avatar/AvatarSelector";
import { getAvatarById, type AvatarProfile } from "@/stores/avatarStore";
import type { WizardData } from "../ReviewPublishingWizard";

// ─── TYPES ──────────────────────────────────────────────────

interface Props {
  data: WizardData;
  updateData: (patch: Partial<WizardData>) => void;
}

// ─── COMPONENT ──────────────────────────────────────────────

export function WizardStepAvatar({ data, updateData }: Props) {
  const selectedAvatar = getAvatarById(data.avatarId);

  const handleSelectAvatar = useCallback(
    (avatar: AvatarProfile) => {
      updateData({ avatarId: avatar.id });
    },
    [updateData]
  );

  const handleQuickTakeChange = useCallback(
    (value: string) => {
      updateData({ quickTake: value });
    },
    [updateData]
  );

  // Auto-generate quick take from review data
  const autoGenerateQuickTake = useCallback(() => {
    if (!data.review) return;
    const rating = data.review.rating;
    const productName = data.vineItem?.productName ?? "this product";
    const templates = [
      `${rating >= 4 ? "Love" : rating >= 3 ? "Mixed feelings about" : "Not impressed with"} ${productName}. ${data.review.verdict}`,
      `${rating}/5 stars — ${data.review.excerpt}`,
      `Quick take: ${data.review.ratingJustification}. ${data.review.pros[0] ? `Best part: ${data.review.pros[0]}.` : ""}`,
    ];
    const quickTake = templates[Math.floor(Math.random() * templates.length)];
    updateData({ quickTake });
  }, [data.review, data.vineItem, updateData]);

  return (
    <div className="space-y-6">
      {/* Avatar Selection */}
      <div>
        <h3 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
          <User className="h-4 w-4 text-amber-400" />
          Select Avatar for Video Review
        </h3>
        <AvatarSelector
          selectedAvatarId={data.avatarId}
          onSelect={handleSelectAvatar}
          showUpload={true}
          showDelete={true}
        />
      </div>

      {/* Quick Take */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-amber-400" />
            Reese&apos;s Quick Take
          </Label>
          {data.review && (
            <button
              onClick={autoGenerateQuickTake}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              Auto-generate from review
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 mb-2">
          A short, punchy summary that appears as an overlay on the review page
          and in the video thumbnail.
        </p>
        <Textarea
          value={data.quickTake}
          onChange={(e) => handleQuickTakeChange(e.target.value)}
          placeholder="e.g., 'These headphones are a game-changer for the price — but the mic could be better.'"
          rows={3}
          className="bg-gray-800 border-gray-700 text-sm"
          maxLength={200}
        />
        <span className="text-[10px] text-gray-500">
          {data.quickTake.length}/200 characters
        </span>
      </div>

      {/* Preview */}
      {selectedAvatar && (
        <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
          <h4 className="text-xs text-gray-400 mb-3 uppercase tracking-wider">
            Preview
          </h4>
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-amber-500 shadow-lg shadow-amber-500/20">
                <img
                  src={selectedAvatar.imageUrl}
                  alt={selectedAvatar.displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://placehold.co/100x100/1a1a2e/f59e0b?text=R";
                  }}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center">
                <span className="text-[10px] font-bold text-black">R</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-400">
                Reese&apos;s Quick Take
              </p>
              <p className="text-sm text-gray-300 mt-1 leading-relaxed">
                {data.quickTake || (
                  <span className="text-gray-500 italic">
                    Your quick take will appear here...
                  </span>
                )}
              </p>
              {data.review && (
                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-sm ${
                        star <= data.review!.rating
                          ? "text-amber-400"
                          : "text-gray-600"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
