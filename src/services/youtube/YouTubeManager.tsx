// ============================================================
// YOUTUBE MANAGER COMPONENT
// Full UI for YouTube account connection, upload queue
// management, and video publishing. Integrates with the
// YouTube service for OAuth2 and upload operations.
// ============================================================

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Youtube,
  Link2,
  Unlink,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Play,
  Settings2,
  ExternalLink,
  RefreshCw,
  Calendar,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getStoredCredentials,
  saveCredentials,
  getStoredTokens,
  isAuthenticated,
  getAuthorizationUrl,
  exchangeCodeForTokens,
  disconnectYouTube,
  getUploadQueue,
  removeFromQueue,
  clearCompletedFromQueue,
  processUploadQueue,
  type YouTubeCredentials,
  type UploadQueueItem,
  YOUTUBE_CATEGORIES,
} from "./youtubeService";

// ─── COMPONENT ──────────────────────────────────────────────

export function YouTubeManager() {
  const [isConnected, setIsConnected] = useState(isAuthenticated());
  const [showSetup, setShowSetup] = useState(false);
  const [credentials, setCredentials] = useState<YouTubeCredentials>(
    getStoredCredentials() ?? { clientId: "", clientSecret: "", redirectUri: window.location.origin + "/business" }
  );
  const [authCode, setAuthCode] = useState("");
  const [queue, setQueue] = useState<UploadQueueItem[]>(getUploadQueue());
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState(false);

  const tokens = getStoredTokens();

  // Refresh queue periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setQueue(getUploadQueue());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveCredentials = useCallback(() => {
    if (!credentials.clientId || !credentials.clientSecret) {
      setError("Client ID and Client Secret are required");
      return;
    }
    saveCredentials(credentials);
    setError(null);
  }, [credentials]);

  const handleStartOAuth = useCallback(() => {
    const creds = getStoredCredentials();
    if (!creds) {
      setError("Save credentials first");
      return;
    }
    const url = getAuthorizationUrl(creds);
    window.open(url, "_blank", "width=600,height=700");
  }, []);

  const handleExchangeCode = useCallback(async () => {
    if (!authCode.trim()) {
      setError("Enter the authorization code");
      return;
    }
    try {
      setError(null);
      const creds = getStoredCredentials();
      if (!creds) throw new Error("No credentials saved");
      await exchangeCodeForTokens(authCode, creds);
      setIsConnected(true);
      setAuthCode("");
      setShowSetup(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to exchange code");
    }
  }, [authCode]);

  const handleDisconnect = useCallback(() => {
    disconnectYouTube();
    setIsConnected(false);
  }, []);

  const handleProcessQueue = useCallback(async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await processUploadQueue(
        (itemId, progress) => {
          setQueue((prev) =>
            prev.map((q) => (q.id === itemId ? { ...q, progress } : q))
          );
        },
        (itemId) => {
          setQueue(getUploadQueue());
        },
        (itemId, err) => {
          setQueue(getUploadQueue());
          setError(`Upload failed for ${itemId}: ${err}`);
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Queue processing failed");
    } finally {
      setIsProcessing(false);
      setQueue(getUploadQueue());
    }
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    removeFromQueue(id);
    setQueue(getUploadQueue());
  }, []);

  const handleClearCompleted = useCallback(() => {
    clearCompletedFromQueue();
    setQueue(getUploadQueue());
  }, []);

  const queuedCount = queue.filter((q) => q.status === "queued" || q.status === "scheduled").length;
  const completedCount = queue.filter((q) => q.status === "uploaded" || q.status === "published").length;
  const failedCount = queue.filter((q) => q.status === "failed").length;

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card className="border-gray-800 bg-gray-900/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isConnected ? "bg-red-500/20" : "bg-gray-800"}`}>
                <Youtube className={`h-5 w-5 ${isConnected ? "text-red-500" : "text-gray-400"}`} />
              </div>
              <div>
                <CardTitle className="text-base">YouTube Connection</CardTitle>
                <CardDescription>
                  {isConnected
                    ? `Connected as ${tokens?.channelTitle ?? "YouTube Channel"}`
                    : "Connect your YouTube account to auto-post reviews"}
                </CardDescription>
              </div>
            </div>
            <Badge variant={isConnected ? "default" : "outline"} className={isConnected ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}>
              {isConnected ? "Connected" : "Not Connected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleDisconnect} className="text-red-400 border-red-500/30 hover:bg-red-500/10">
                <Unlink className="h-4 w-4 mr-1" />
                Disconnect
              </Button>
              {tokens?.channelId && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={`https://www.youtube.com/channel/${tokens.channelId}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Channel
                  </a>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Button variant="outline" size="sm" onClick={() => setShowSetup(!showSetup)}>
                <Settings2 className="h-4 w-4 mr-1" />
                {showSetup ? "Hide Setup" : "Setup Connection"}
              </Button>

              <AnimatePresence>
                {showSetup && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 rounded-lg border border-gray-700 bg-gray-800/50 p-4"
                  >
                    <p className="text-xs text-gray-400">
                      Create a project in the{" "}
                      <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">
                        Google Cloud Console
                      </a>
                      , enable the YouTube Data API v3, and create OAuth 2.0 credentials.
                    </p>

                    <div>
                      <Label className="text-xs text-gray-400">Client ID</Label>
                      <Input
                        value={credentials.clientId}
                        onChange={(e) => setCredentials({ ...credentials, clientId: e.target.value })}
                        placeholder="your-client-id.apps.googleusercontent.com"
                        className="mt-1 bg-gray-900 border-gray-700 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-gray-400">Client Secret</Label>
                      <div className="relative mt-1">
                        <Input
                          type={showSecrets ? "text" : "password"}
                          value={credentials.clientSecret}
                          onChange={(e) => setCredentials({ ...credentials, clientSecret: e.target.value })}
                          placeholder="GOCSPX-..."
                          className="bg-gray-900 border-gray-700 font-mono text-xs pr-10"
                        />
                        <button
                          onClick={() => setShowSecrets(!showSecrets)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-400">Redirect URI</Label>
                      <Input
                        value={credentials.redirectUri}
                        onChange={(e) => setCredentials({ ...credentials, redirectUri: e.target.value })}
                        className="mt-1 bg-gray-900 border-gray-700 font-mono text-xs"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveCredentials} className="bg-amber-500 hover:bg-amber-600 text-black">
                        Save Credentials
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleStartOAuth}>
                        <Link2 className="h-4 w-4 mr-1" />
                        Authorize
                      </Button>
                    </div>

                    {/* Code exchange */}
                    <div className="border-t border-gray-700 pt-3">
                      <Label className="text-xs text-gray-400">Authorization Code (from redirect)</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={authCode}
                          onChange={(e) => setAuthCode(e.target.value)}
                          placeholder="Paste the code from the redirect URL"
                          className="bg-gray-900 border-gray-700 font-mono text-xs"
                        />
                        <Button size="sm" onClick={handleExchangeCode}>
                          Exchange
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FTC Compliance Notice */}
      <Alert className="border-amber-500/30 bg-amber-500/5">
        <Shield className="h-4 w-4 text-amber-400" />
        <AlertDescription className="text-xs text-gray-300">
          All uploaded videos automatically include FTC-compliant disclosures for Amazon Vine products and affiliate links in the description.
        </AlertDescription>
      </Alert>

      {/* Upload Queue */}
      <Card className="border-gray-800 bg-gray-900/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4 text-amber-400" />
                Upload Queue
              </CardTitle>
              <CardDescription>
                {queuedCount} queued, {completedCount} completed, {failedCount} failed
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {completedCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearCompleted}>
                  Clear Completed
                </Button>
              )}
              {queuedCount > 0 && (
                <Button
                  size="sm"
                  onClick={handleProcessQueue}
                  disabled={isProcessing || !isConnected}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  {isProcessing ? (
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-1" />
                  )}
                  {isProcessing ? "Uploading..." : "Upload All"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No videos in the upload queue</p>
              <p className="text-xs mt-1">Videos will appear here when you publish from the Review Wizard</p>
            </div>
          ) : (
            <div className="space-y-3">
              {queue.map((item) => (
                <QueueItemCard
                  key={item.id}
                  item={item}
                  onRemove={() => handleRemoveItem(item.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// ─── QUEUE ITEM CARD ────────────────────────────────────────

function QueueItemCard({
  item,
  onRemove,
}: {
  item: UploadQueueItem;
  onRemove: () => void;
}) {
  const statusConfig: Record<UploadQueueItem["status"], { color: string; icon: React.ReactNode; label: string }> = {
    queued: { color: "text-blue-400", icon: <Clock className="h-3 w-3" />, label: "Queued" },
    uploading: { color: "text-amber-400", icon: <RefreshCw className="h-3 w-3 animate-spin" />, label: "Uploading" },
    uploaded: { color: "text-green-400", icon: <CheckCircle2 className="h-3 w-3" />, label: "Uploaded" },
    scheduled: { color: "text-purple-400", icon: <Calendar className="h-3 w-3" />, label: "Scheduled" },
    published: { color: "text-green-400", icon: <CheckCircle2 className="h-3 w-3" />, label: "Published" },
    failed: { color: "text-red-400", icon: <AlertCircle className="h-3 w-3" />, label: "Failed" },
  };

  const cfg = statusConfig[item.status];

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/30 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-200 truncate">
            {item.metadata.title}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {item.productName}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={`text-[10px] ${cfg.color} border-current/30`}>
              {cfg.icon}
              <span className="ml-1">{cfg.label}</span>
            </Badge>
            {item.metadata.isShort && (
              <Badge variant="outline" className="text-[10px] text-red-400 border-red-400/30">
                Short
              </Badge>
            )}
            {item.scheduledAt && (
              <span className="text-[10px] text-gray-500">
                {new Date(item.scheduledAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onRemove} className="text-gray-400 hover:text-red-400">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress bar */}
      {item.status === "uploading" && (
        <div className="mt-2">
          <Progress value={item.progress} className="h-1" />
          <p className="text-[10px] text-gray-500 mt-0.5">{item.progress}%</p>
        </div>
      )}

      {/* Result link */}
      {item.result?.videoUrl && (
        <a
          href={item.result.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs text-red-400 hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          View on YouTube
        </a>
      )}

      {/* Error */}
      {item.error && (
        <p className="mt-1 text-xs text-red-400">{item.error}</p>
      )}
    </div>
  );
}

export default YouTubeManager;
