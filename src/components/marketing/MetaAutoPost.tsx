// ============================================================
// META AUTO-POST — Generate & publish posts from reviews
// ============================================================

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Send, Clock, Sparkles, RefreshCw, CheckCircle2, Image,
} from "lucide-react";
import { getApprovedReviews, type ReviewData } from "@/lib/reviewStore";
import {
  getMetaAuth,
  getMetaPosts,
  saveMetaPost,
  createPostFromReview,
  publishMetaPost,
  scheduleForPeakTime,
  getPeakEngagementTimes,
  type MetaPost,
} from "@/services/metaBusinessService";
import { generatePostFromReview } from "@/services/affiliateContentService";
import { getAffiliateLinks } from "@/lib/affiliateStore";

export default function MetaAutoPost() {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [selectedReviewId, setSelectedReviewId] = useState("");
  const [platform, setPlatform] = useState<"facebook" | "instagram" | "both">("both");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [recentPosts, setRecentPosts] = useState<MetaPost[]>([]);
  const [postResult, setPostResult] = useState<{ success: boolean; message: string } | null>(null);

  const auth = getMetaAuth();
  const peakTimes = getPeakEngagementTimes();

  useEffect(() => {
    setReviews(getApprovedReviews());
    setRecentPosts(getMetaPosts().slice(-5).reverse());
  }, []);

  const selectedReview = reviews.find((r) => r.id === selectedReviewId);

  const handleGenerateContent = async () => {
    if (!selectedReview) return;

    setIsGenerating(true);
    setPostResult(null);

    try {
      const affiliateLinks = getAffiliateLinks().filter((l) => l.active);
      const content = await generatePostFromReview(
        selectedReview,
        platform === "both" ? "facebook" : platform,
        affiliateLinks,
        "casual"
      );
      setGeneratedContent(content);
    } catch (error) {
      // Fallback to template-based content
      const stars = "★".repeat(Math.floor(selectedReview.rating));
      setGeneratedContent(
        `${stars} ${selectedReview.title}\n\n${selectedReview.excerpt}\n\n` +
        `Pros: ${selectedReview.pros.slice(0, 3).join(", ")}\n\n` +
        `Read the full review: https://reesereviews.com/reviews/${selectedReview.slug}\n\n` +
        `#ReeseReviews #HonestReview #${selectedReview.category.replace(/-/g, "")}`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePostNow = async () => {
    if (!selectedReview || !generatedContent) return;

    setIsPosting(true);
    setPostResult(null);

    const post = createPostFromReview(
      selectedReview.id,
      selectedReview.title,
      generatedContent,
      selectedReview.rating,
      selectedReview.product_name,
      selectedReview.image_url,
      platform
    );
    post.content = generatedContent;

    if (auth) {
      const result = await publishMetaPost(post);
      if (result.status === "posted") {
        setPostResult({ success: true, message: "Post published successfully!" });
      } else {
        setPostResult({ success: false, message: result.error_message || "Failed to publish" });
      }
    } else {
      // Save as draft when not connected
      post.status = "draft";
      saveMetaPost(post);
      setPostResult({ success: true, message: "Saved as draft (connect Meta account to publish)" });
    }

    setRecentPosts(getMetaPosts().slice(-5).reverse());
    setIsPosting(false);
  };

  const handleSchedule = () => {
    if (!selectedReview || !generatedContent) return;

    const post = createPostFromReview(
      selectedReview.id,
      selectedReview.title,
      generatedContent,
      selectedReview.rating,
      selectedReview.product_name,
      selectedReview.image_url,
      platform
    );
    post.content = generatedContent;

    const scheduled = scheduleForPeakTime(post);
    saveMetaPost(scheduled);
    setRecentPosts(getMetaPosts().slice(-5).reverse());
    setPostResult({
      success: true,
      message: `Scheduled for ${new Date(scheduled.scheduled_for!).toLocaleString()}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Post Creator */}
      <Card className="glass-card steel-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Auto-Generate Social Post
          </CardTitle>
          <CardDescription>
            Select a review and AI will generate a platform-optimized social media post
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Select Review</Label>
              <Select value={selectedReviewId} onValueChange={setSelectedReviewId}>
                <SelectTrigger className="glass-card steel-border">
                  <SelectValue placeholder="Choose a review..." />
                </SelectTrigger>
                <SelectContent>
                  {reviews.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.title} ({r.rating}/5)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Platform</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as typeof platform)}>
                <SelectTrigger className="glass-card steel-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facebook">📘 Facebook Only</SelectItem>
                  <SelectItem value="instagram">📸 Instagram Only</SelectItem>
                  <SelectItem value="both">📘📸 Both Platforms</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedReview && (
            <div className="p-3 rounded-lg glass-card">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">{selectedReview.category}</Badge>
                <span className="text-yellow-400 text-sm">
                  {"★".repeat(Math.floor(selectedReview.rating))}
                </span>
              </div>
              <p className="text-sm text-white font-medium">{selectedReview.title}</p>
              <p className="text-xs text-gray-400 mt-1">{selectedReview.excerpt.slice(0, 150)}...</p>
              {selectedReview.image_url && (
                <div className="flex items-center gap-1 mt-1 text-xs text-green-400">
                  <Image className="h-3 w-3" /> Image available
                </div>
              )}
            </div>
          )}

          <Button
            onClick={handleGenerateContent}
            disabled={!selectedReviewId || isGenerating}
            className="w-full gradient-steel"
          >
            {isGenerating ? (
              <><RefreshCw className="h-4 w-4 animate-spin mr-2" /> Generating with AI...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Generate Post Content</>
            )}
          </Button>

          {generatedContent && (
            <>
              <Textarea
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                rows={6}
                className="glass-card steel-border"
                placeholder="Generated content will appear here..."
              />
              <div className="flex gap-2">
                <Button
                  onClick={handlePostNow}
                  disabled={isPosting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isPosting ? (
                    <><RefreshCw className="h-4 w-4 animate-spin mr-1" /> Posting...</>
                  ) : (
                    <><Send className="h-4 w-4 mr-1" /> Post Now</>
                  )}
                </Button>
                <Button
                  onClick={handleSchedule}
                  variant="outline"
                  className="flex-1"
                >
                  <Clock className="h-4 w-4 mr-1" /> Schedule Peak Time
                </Button>
              </div>
            </>
          )}

          {postResult && (
            <div className={`p-3 rounded-lg ${postResult.success ? "bg-green-500/10 border border-green-500/30" : "bg-red-500/10 border border-red-500/30"}`}>
              <div className="flex items-center gap-2">
                {postResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                ) : (
                  <span className="text-red-400">⚠️</span>
                )}
                <p className={`text-sm ${postResult.success ? "text-green-400" : "text-red-400"}`}>
                  {postResult.message}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Peak Engagement Times */}
      <Card className="glass-card steel-border">
        <CardHeader>
          <CardTitle className="text-lg">Peak Engagement Times</CardTitle>
          <CardDescription>Best times to post based on engagement data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {peakTimes.slice(0, 8).map((peak, idx) => (
              <div key={idx} className="p-2 rounded-lg glass-card text-center">
                <p className="text-xs font-medium text-gray-400">{peak.day}</p>
                <p className="text-sm font-bold text-white">
                  {peak.hour > 12 ? `${peak.hour - 12}:00 PM` : `${peak.hour}:00 AM`}
                </p>
                <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                  <div
                    className="bg-primary h-1.5 rounded-full"
                    style={{ width: `${peak.engagement_score * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Posts */}
      {recentPosts.length > 0 && (
        <Card className="glass-card steel-border">
          <CardHeader>
            <CardTitle className="text-lg">Recent Posts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentPosts.map((post) => (
              <div key={post.id} className="p-3 rounded-lg glass-card flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{post.platform === "facebook" ? "📘" : post.platform === "instagram" ? "📸" : "📘📸"}</span>
                    <Badge variant="outline" className={`text-xs ${
                      post.status === "posted" ? "text-green-400 border-green-400/30" :
                      post.status === "scheduled" ? "text-blue-400 border-blue-400/30" :
                      "text-primary border-primary/30"
                    }`}>
                      {post.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-300 truncate">{post.content.slice(0, 100)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
