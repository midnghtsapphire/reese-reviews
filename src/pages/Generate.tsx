/**
 * Generate — content generation & social media publishing page.
 *
 * Features:
 *   - Textarea for content creation
 *   - Platform selection: Facebook, LinkedIn, Instagram, TikTok
 *   - Marketing budget input
 *   - Analytics sidebar (posts, reach, engagement)
 *   - Auto-post to selected platforms with budget control
 */

import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Facebook,
  Linkedin,
  Instagram,
  Music2,
  DollarSign,
  Send,
  BarChart2,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import SEOHead from "@/components/SEOHead";
import { SOCIAL_PLATFORMS, type SocialPlatformId } from "@/lib/branding";

// ─── Platform display config ─────────────────────────────────
const PLATFORM_ICONS: Record<SocialPlatformId, React.ElementType> = {
  facebook:  Facebook,
  linkedin:  Linkedin,
  instagram: Instagram,
  tiktok:    Music2,
};

// ─── Post state per platform ────────────────────────────────
type PostStatus = "idle" | "posting" | "done" | "error";
type PlatformStatus = Record<SocialPlatformId, PostStatus>;

const INITIAL_STATUS: PlatformStatus = {
  facebook:  "idle",
  linkedin:  "idle",
  instagram: "idle",
  tiktok:    "idle",
};

export default function Generate() {
  const [params] = useSearchParams();

  // Pre-fill content from ?draft= URL param (set by Dashboard quick-draft)
  const [content, setContent]             = useState(() => {
    const d = params.get("draft");
    return d ? decodeURIComponent(d) : "";
  });
  const [budget, setBudget]               = useState<string>("");
  const [selected, setSelected]           = useState<Set<SocialPlatformId>>(new Set());
  const [platformStatus, setPlatformStatus] = useState<PlatformStatus>(INITIAL_STATUS);
  const [isPosting, setIsPosting]         = useState(false);
  const [globalError, setGlobalError]     = useState<string | null>(null);

  const togglePlatform = (id: SocialPlatformId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAutoPost = async () => {
    if (!content.trim()) {
      setGlobalError("Please enter content before posting.");
      return;
    }
    if (selected.size === 0) {
      setGlobalError("Select at least one platform.");
      return;
    }
    setGlobalError(null);
    setIsPosting(true);

    // Reset statuses for selected platforms
    const nextStatus = { ...INITIAL_STATUS };
    selected.forEach((p) => { nextStatus[p] = "posting"; });
    setPlatformStatus(nextStatus);

    // Simulate posting with staggered delay
    const platforms = Array.from(selected);
    for (const platform of platforms) {
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
      setPlatformStatus((prev) => ({ ...prev, [platform]: "done" }));
    }

    setIsPosting(false);
  };

  const handleReset = () => {
    setContent("");
    setBudget("");
    setSelected(new Set());
    setPlatformStatus(INITIAL_STATUS);
    setGlobalError(null);
  };

  const allDone =
    selected.size > 0 &&
    Array.from(selected).every((p) => platformStatus[p] === "done");

  return (
    <>
      <SEOHead
        title="Content — Reese-Reviews"
        description="Generate and publish social media content across Facebook, LinkedIn, Instagram, and TikTok."
      />

      <div className="min-h-screen gradient-dark-surface pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Header ───────────────────────────────────── */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Content Creation</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Write your post, choose platforms, set a budget, and auto-publish.
            </p>
          </header>

          {/* ── Two-column layout ────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

            {/* ─── LEFT: content editor + platform controls ─ */}
            <div className="space-y-5">

              {/* Content textarea */}
              <Card className="glass-card steel-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText size={16} className="text-muted-foreground" />
                    Post Content
                  </CardTitle>
                  <CardDescription>Write the copy that will be published to your selected platforms.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Write your post here…"
                    value={content}
                    onChange={(e) => { setContent(e.target.value); setGlobalError(null); }}
                    className="min-h-[160px] bg-transparent resize-none text-sm"
                    aria-label="Post content"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">{content.length} characters</p>
                </CardContent>
              </Card>

              {/* Platform selection */}
              <Card className="glass-card steel-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Select Platforms</CardTitle>
                  <CardDescription>Choose where to publish this post.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {SOCIAL_PLATFORMS.map(({ id, label }) => {
                      const Icon = PLATFORM_ICONS[id];
                      const status = platformStatus[id];
                      const active = selected.has(id);

                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => togglePlatform(id)}
                          aria-pressed={active}
                          className={`relative flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                            active
                              ? "gradient-steel text-primary-foreground border-transparent steel-glow"
                              : "glass-card border-border text-muted-foreground hover:border-steel-mid/50"
                          }`}
                        >
                          {status === "posting" && (
                            <Loader2 size={14} className="absolute top-2 right-2 animate-spin" />
                          )}
                          {status === "done" && (
                            <CheckCircle2 size={14} className="absolute top-2 right-2 text-success" />
                          )}
                          {status === "error" && (
                            <AlertCircle size={14} className="absolute top-2 right-2 text-danger" />
                          )}
                          <Icon size={22} />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Marketing budget */}
              <Card className="glass-card steel-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign size={16} className="text-muted-foreground" />
                    Marketing Budget
                  </CardTitle>
                  <CardDescription>Optional daily spend cap for boosted posts.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 max-w-xs">
                    <span className="text-muted-foreground font-medium">$</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="bg-transparent"
                      aria-label="Daily marketing budget in USD"
                    />
                    <Label className="text-muted-foreground text-sm whitespace-nowrap">/ day</Label>
                  </div>
                  {budget && parseFloat(budget) > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {/* ~30.44 avg days/month */}
                      Estimated monthly spend: <strong className="text-foreground">${(parseFloat(budget) * 30.44).toFixed(2)}</strong>
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Error message */}
              {globalError && (
                <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger-foreground" role="alert">
                  <AlertCircle size={15} />
                  {globalError}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={handleAutoPost}
                  disabled={isPosting || allDone}
                  className="gradient-steel text-primary-foreground gap-2"
                >
                  {isPosting ? (
                    <><Loader2 size={15} className="animate-spin" /> Posting…</>
                  ) : allDone ? (
                    <><CheckCircle2 size={15} /> Posted!</>
                  ) : (
                    <><Send size={15} /> Auto-Post to {selected.size > 0 ? `${selected.size} Platform${selected.size > 1 ? "s" : ""}` : "Platforms"}</>
                  )}
                </Button>

                {(allDone || isPosting) && (
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    New Post
                  </Button>
                )}
              </div>

              {/* Per-platform status summary */}
              {Array.from(selected).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Array.from(selected).map((id) => {
                    const { label } = SOCIAL_PLATFORMS.find((p) => p.id === id)!;
                    const status = platformStatus[id];
                    return (
                      <Badge
                        key={id}
                        variant={status === "done" ? "default" : "secondary"}
                        className={
                          status === "done"
                            ? "gradient-steel text-primary-foreground border-transparent"
                            : ""
                        }
                      >
                        {status === "posting" && <Loader2 size={11} className="mr-1 animate-spin" />}
                        {status === "done"    && <CheckCircle2 size={11} className="mr-1" />}
                        {label}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ─── RIGHT: analytics sidebar ─────────────── */}
            <aside className="space-y-4">
              <Card className="glass-card steel-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart2 size={15} className="text-muted-foreground" />
                    Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Analytics will appear once connected.
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card steel-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Budget Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily Budget</span>
                    <span className="font-medium">{budget ? `$${parseFloat(budget).toFixed(2)}` : "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platforms</span>
                    <span className="font-medium">{selected.size || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Est.</span>
                    <span className="font-medium">
                      {budget && parseFloat(budget) > 0
                        ? `$${(parseFloat(budget) * 30.44).toFixed(2)}`
                        : "—"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card steel-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground">
                  <p>• Facebook posts with images get 2× more engagement than text-only.</p>
                  <p>• Instagram performs best with 3–5 hashtags.</p>
                  <p>• LinkedIn posts with questions get 3× more engagement.</p>
                  <p>• TikTok captions under 150 chars drive higher completion rates.</p>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
