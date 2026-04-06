// ============================================================
// YOUTUBE MANAGER PAGE
// Route wrapper for the YouTube upload manager.
// ============================================================

import React from "react";
import { YouTubeManager } from "@/services/youtube";

export default function YouTubeManagerPage() {
  return (
    <div className="min-h-screen gradient-dark-surface py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <YouTubeManager />
      </div>
    </div>
  );
}
