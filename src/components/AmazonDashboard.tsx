import React, { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Star, Copy, FileText, ExternalLink, RefreshCw, Link, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  type AmazonReview,
  type ImportMode,
  getAmazonReviews,
  buildAffiliateLink,
  DEFAULT_AFFILIATE_TAG,
} from "@/lib/amazonReviewStore";
import { apiImport, apiPublish } from "@/api/amazon";

// ─── HELPERS ─────────────────────────────────────────────────

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={14}
          className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}
        />
      ))}
    </span>
  );
}

function SourceBadge({ source }: { source: ImportMode }) {
  const map: Record<ImportMode, { label: string; className: string }> = {
    demo: { label: "Demo", className: "bg-purple-600/20 text-purple-300 border-purple-600/30" },
    html: { label: "HTML Import", className: "bg-blue-600/20 text-blue-300 border-blue-600/30" },
    cookie: { label: "Live Import", className: "bg-green-600/20 text-green-300 border-green-600/30" },
  };
  const { label, className } = map[source] ?? map.demo;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${className}`}>{label}</span>
  );
}

// ─── REVIEW CARD ─────────────────────────────────────────────

interface ReviewCardProps {
  review: AmazonReview;
  affiliateTag: string;
  onCopy: (review: AmazonReview) => void;
  onCreateDraft: (review: AmazonReview) => void;
  onPublish: (review: AmazonReview) => void;
}

function ReviewCard({ review, affiliateTag, onCopy, onCreateDraft, onPublish }: ReviewCardProps) {
  const affiliateLink = buildAffiliateLink(review.asin, affiliateTag);

  return (
    <div className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="font-semibold text-white truncate">{review.productName}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <StarRow rating={review.rating} />
            <span className="text-xs text-gray-400">{review.date}</span>
            <SourceBadge source={review.source} />
            {review.status === "published" && (
              <Badge className="bg-green-600/20 text-green-300 border-green-600/30 text-xs">Published</Badge>
            )}
          </div>
        </div>
        <span className="text-xs text-gray-500 shrink-0 font-mono">{review.asin}</span>
      </div>

      {review.title && (
        <p className="text-sm font-medium text-gray-200 italic">"{review.title}"</p>
      )}

      <p className="text-sm text-gray-300 line-clamp-3">{review.body}</p>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs border-white/20 text-gray-300 hover:bg-white/10"
          onClick={() => onCopy(review)}
          aria-label={`Copy review text for ${review.productName}`}
        >
          <Copy size={12} className="mr-1" />
          Copy text
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs border-white/20 text-gray-300 hover:bg-white/10"
          onClick={() => onCreateDraft(review)}
          aria-label={`Create draft for ${review.productName}`}
        >
          <FileText size={12} className="mr-1" />
          Create Draft
        </Button>

        {review.status !== "published" && (
          <Button
            size="sm"
            className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => onPublish(review)}
            aria-label={`Publish review for ${review.productName}`}
          >
            <CheckCircle2 size={12} className="mr-1" />
            Publish
          </Button>
        )}

        {affiliateLink && (
          <a
            href={affiliateLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs h-7 px-2 rounded border border-white/20 text-gray-300 hover:bg-white/10 transition"
            aria-label={`Open ${review.productName} on Amazon`}
          >
            <ExternalLink size={12} />
            Open on Amazon
          </a>
        )}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────

export function AmazonDashboard() {
  const [activeTab, setActiveTab] = useState("connection");
  const [importMode, setImportMode] = useState<ImportMode>("demo");
  const [pastedHtml, setPastedHtml] = useState("");
  const [reviews, setReviews] = useState<AmazonReview[]>(getAmazonReviews);
  const [statusMsg, setStatusMsg] = useState<{ type: "info" | "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Affiliate tab state
  const [asinInput, setAsinInput] = useState("");
  const [affiliateTag, setAffiliateTag] = useState(DEFAULT_AFFILIATE_TAG);
  const [generatedLink, setGeneratedLink] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  const refreshReviews = useCallback(() => {
    setReviews(getAmazonReviews());
  }, []);

  // ─── Import handler ──────────────────────────────────────

  const handleImport = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const result = await apiImport({ mode: importMode, html: pastedHtml });
      setReviews(result.reviews);
      setStatusMsg({ type: "success", text: result.message });
      if (result.imported > 0) setActiveTab("reviews");
    } catch (err) {
      setStatusMsg({ type: "error", text: String(err) });
    } finally {
      setLoading(false);
    }
  };

  // ─── Review actions ──────────────────────────────────────

  const handleCopy = (review: AmazonReview) => {
    const text = `${review.title}\n\n${review.body}`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(review.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateDraft = (review: AmazonReview) => {
    // Persist as draft (already stored) and show confirmation
    setStatusMsg({ type: "success", text: `Draft saved for "${review.productName}".` });
  };

  const handlePublish = async (review: AmazonReview) => {
    const result = await apiPublish({ reviewId: review.id });
    if (result.success) {
      refreshReviews();
      setStatusMsg({ type: "success", text: `"${review.productName}" marked as published.` });
    } else {
      setStatusMsg({ type: "error", text: result.message });
    }
  };

  // ─── Affiliate generator ─────────────────────────────────

  const handleGenerateLink = () => {
    const link = buildAffiliateLink(asinInput, affiliateTag);
    setGeneratedLink(link);
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // ─── Render ──────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Amazon Reviews</h2>
          <p className="text-gray-400 text-sm">Import Vine/purchase reviews, manage drafts, and generate affiliate links</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshReviews}
          className="border-white/20 text-gray-300 hover:bg-white/10"
          aria-label="Refresh review list"
        >
          <RefreshCw size={14} className="mr-1" />
          Refresh
        </Button>
      </div>

      {statusMsg && (
        <Alert className={`border ${statusMsg.type === "error" ? "border-red-500/40 bg-red-500/10" : "border-green-500/40 bg-green-500/10"}`}>
          <AlertCircle size={14} className={statusMsg.type === "error" ? "text-red-400" : "text-green-400"} />
          <AlertDescription className={statusMsg.type === "error" ? "text-red-300" : "text-green-300"}>
            {statusMsg.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/10 border border-white/20">
          <TabsTrigger value="connection" className="text-gray-300 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            🔗 Connection
          </TabsTrigger>
          <TabsTrigger value="reviews" className="text-gray-300 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            ⭐ Reviews {reviews.length > 0 && <span className="ml-1 text-xs">({reviews.length})</span>}
          </TabsTrigger>
          <TabsTrigger value="affiliate" className="text-gray-300 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            🔗 Affiliate Links
          </TabsTrigger>
        </TabsList>

        {/* ── Connection Tab ── */}
        <TabsContent value="connection" className="mt-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Import Amazon Reviews</CardTitle>
              <CardDescription className="text-gray-400">
                Choose how to import your reviews. Demo mode works without any credentials.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mode selector */}
              <div className="space-y-3">
                <p className="text-sm text-gray-300 font-medium">Import Mode</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(["demo", "html", "cookie"] as ImportMode[]).map((mode) => {
                    const info = {
                      demo: { icon: "🎭", label: "Demo", desc: "Pre-loaded sample reviews. No credentials needed." },
                      html: { icon: "📄", label: "Paste HTML", desc: "Copy your Amazon review page source and paste it here." },
                      cookie: { icon: "🍪", label: "Session Cookie", desc: "Requires a server-side proxy. Falls back to demo in SPA mode." },
                    }[mode];
                    return (
                      <button
                        key={mode}
                        onClick={() => setImportMode(mode)}
                        className={`p-3 rounded-lg border text-left transition ${
                          importMode === mode
                            ? "border-purple-500 bg-purple-600/20"
                            : "border-white/20 bg-white/5 hover:bg-white/10"
                        }`}
                        aria-pressed={importMode === mode}
                      >
                        <div className="text-lg mb-1">{info.icon}</div>
                        <div className="text-sm font-medium text-white">{info.label}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{info.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* HTML paste area */}
              {importMode === "html" && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-300 font-medium">Paste Amazon Review Page HTML</p>
                  <p className="text-xs text-gray-500">
                    Open your Amazon review page, right-click → "View Page Source", select all, and paste below.
                  </p>
                  <Textarea
                    placeholder="Paste the full page HTML here…"
                    value={pastedHtml}
                    onChange={(e) => setPastedHtml(e.target.value)}
                    className="bg-white/5 border-white/20 text-gray-200 placeholder:text-gray-600 font-mono text-xs min-h-[120px]"
                    aria-label="Amazon review page HTML"
                  />
                </div>
              )}

              {/* Cookie mode notice */}
              {importMode === "cookie" && (
                <Alert className="border-yellow-500/40 bg-yellow-500/10">
                  <AlertCircle size={14} className="text-yellow-400" />
                  <AlertDescription className="text-yellow-300 text-sm">
                    Cookie mode scrapes Amazon using your session cookie stored in the{" "}
                    <code className="bg-yellow-500/20 px-1 rounded">AMAZON_SESSION_COOKIE</code> environment variable.
                    This requires a server-side proxy. In this demo deployment it falls back to demo data.
                    See <em>docs/amazon-integration.md</em> for full setup instructions.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleImport}
                disabled={loading || (importMode === "html" && !pastedHtml.trim())}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {loading ? (
                  <>
                    <RefreshCw size={14} className="mr-2 animate-spin" />
                    Importing…
                  </>
                ) : (
                  <>Import Reviews</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Reviews Tab ── */}
        <TabsContent value="reviews" className="mt-4">
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-3">No reviews imported yet.</p>
              <Button
                variant="outline"
                className="border-white/20 text-gray-300 hover:bg-white/10"
                onClick={() => setActiveTab("connection")}
              >
                Import Reviews
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  affiliateTag={affiliateTag}
                  onCopy={handleCopy}
                  onCreateDraft={handleCreateDraft}
                  onPublish={handlePublish}
                />
              ))}
            </div>
          )}

          {copiedId && (
            <div className="fixed bottom-4 right-4 bg-green-600 text-white text-sm px-4 py-2 rounded shadow-lg" role="status">
              Review text copied!
            </div>
          )}
        </TabsContent>

        {/* ── Affiliate Tab ── */}
        <TabsContent value="affiliate" className="mt-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Link size={18} />
                Affiliate Link Generator
              </CardTitle>
              <CardDescription className="text-gray-400">
                Generate Amazon affiliate links from any ASIN.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm text-gray-300" htmlFor="asin-input">ASIN</label>
                  <Input
                    id="asin-input"
                    placeholder="e.g. B09JQMJHXY"
                    value={asinInput}
                    onChange={(e) => setAsinInput(e.target.value)}
                    className="bg-white/5 border-white/20 text-gray-200 placeholder:text-gray-600 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-gray-300" htmlFor="affiliate-tag">Affiliate Tag</label>
                  <Input
                    id="affiliate-tag"
                    placeholder={DEFAULT_AFFILIATE_TAG}
                    value={affiliateTag}
                    onChange={(e) => setAffiliateTag(e.target.value)}
                    className="bg-white/5 border-white/20 text-gray-200 placeholder:text-gray-600 font-mono"
                  />
                </div>
              </div>

              <Button
                onClick={handleGenerateLink}
                disabled={!asinInput.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Generate Link
              </Button>

              {generatedLink && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-300 font-medium">Generated Link</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-green-300 break-all">
                      {generatedLink}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 border-white/20 text-gray-300 hover:bg-white/10"
                      onClick={handleCopyLink}
                      aria-label="Copy affiliate link"
                    >
                      {copiedLink ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={14} />}
                    </Button>
                  </div>
                </div>
              )}

              {/* Quick links from imported reviews */}
              {reviews.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <p className="text-sm text-gray-300 font-medium">Quick Links — Imported Reviews</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {reviews.map((r) => (
                      <div key={r.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-gray-400 truncate flex-1">{r.productName}</span>
                        <a
                          href={buildAffiliateLink(r.asin, affiliateTag)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 shrink-0 flex items-center gap-1"
                          aria-label={`Affiliate link for ${r.productName}`}
                        >
                          <ExternalLink size={12} />
                          {r.asin}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
