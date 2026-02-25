import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, RefreshCw, Trash2, Copy } from "lucide-react";
import {
  getVineCookies,
  saveVineCookies,
  getVineConfig,
  updateVineConfig,
  validateVineCookies,
  scrapeVineItems,
  getLastSyncTime,
} from "@/lib/vineScraper";
import type { VineCookies, VineQueue } from "@/lib/vineScraper";

export function VineCookieManager() {
  const [cookies, setCookies] = useState<VineCookies | null>(getVineCookies());
  const [config, setConfig] = useState(getVineConfig());
  const [cookieJson, setCookieJson] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastSync, setLastSync] = useState(getLastSyncTime());

  const handlePasteCookies = async () => {
    try {
      const parsed = JSON.parse(cookieJson);
      if (!Array.isArray(parsed)) {
        setMessage({ type: "error", text: "Cookies must be a JSON array" });
        return;
      }

      const vineCookies: VineCookies = {
        cookies: parsed,
        lastUpdated: new Date().toISOString(),
      };

      setLoading(true);
      const isValid = await validateVineCookies(vineCookies);

      if (isValid) {
        saveVineCookies(vineCookies);
        setCookies(vineCookies);
        setCookieJson("");
        setMessage({ type: "success", text: "Cookies saved and validated successfully!" });
      } else {
        setMessage({ type: "error", text: "Cookies validation failed. Please check and try again." });
      }
    } catch (error) {
      setMessage({ type: "error", text: `Error: ${error instanceof Error ? error.message : "Invalid JSON"}` });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    if (!cookies) {
      setMessage({ type: "error", text: "Please configure cookies first" });
      return;
    }

    setLoading(true);
    try {
      const result = await scrapeVineItems(cookies, config.queues_to_sync);
      if (result.success) {
        setLastSync(new Date().toISOString());
        setMessage({
          type: "success",
          text: `Synced ${result.itemsScraped} Vine items from ${result.queues.join(", ")}`,
        });
      } else {
        setMessage({ type: "error", text: `Sync failed: ${result.error}` });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoSync = () => {
    const updated = { ...config, auto_sync_enabled: !config.auto_sync_enabled };
    updateVineConfig(updated);
    setConfig(updated);
    setMessage({
      type: "success",
      text: `Auto-sync ${updated.auto_sync_enabled ? "enabled" : "disabled"}`,
    });
  };

  const handleToggleQueue = (queue: VineQueue) => {
    const updated = { ...config };
    if (updated.queues_to_sync.includes(queue)) {
      updated.queues_to_sync = updated.queues_to_sync.filter((q) => q !== queue);
    } else {
      updated.queues_to_sync.push(queue);
    }
    updateVineConfig(updated);
    setConfig(updated);
  };

  const handleClearCookies = () => {
    if (confirm("Are you sure? This will disconnect Vine syncing.")) {
      setCookies(null);
      updateVineConfig({ ...config, cookies_configured: false });
      setMessage({ type: "success", text: "Cookies cleared" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Cookie Configuration */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🔐 Amazon Vine Cookies</span>
            {cookies && <Badge className="bg-green-500">Connected</Badge>}
          </CardTitle>
          <CardDescription>
            Paste your Amazon session cookies to enable automatic Vine item syncing. Your cookies are stored locally and never sent to external servers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cookies ? (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Cookies configured on {new Date(cookies.lastUpdated).toLocaleDateString()}
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClearCookies} className="w-full">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Cookies
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  To get your cookies: Open Amazon Vine in your browser, open DevTools (F12), go to Application → Cookies → amazon.com, and copy the cookie data as JSON.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="cookies">Paste Cookie JSON</Label>
                <Textarea
                  id="cookies"
                  placeholder='[{"name":"ubid-main","value":"...","domain":".amazon.com",...}]'
                  value={cookieJson}
                  onChange={(e) => setCookieJson(e.target.value)}
                  className="font-mono text-sm"
                  rows={6}
                />
              </div>

              <Button onClick={handlePasteCookies} disabled={loading || !cookieJson} className="w-full">
                {loading ? "Validating..." : "Save & Validate Cookies"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Queue Selection */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📦 Vine Queues to Sync</span>
          </CardTitle>
          <CardDescription>Select which Vine queues to monitor and sync automatically</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {(["potluck", "additional_items", "last_chance"] as VineQueue[]).map((queue) => (
              <label key={queue} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-blue-100 transition">
                <input
                  type="checkbox"
                  checked={config.queues_to_sync.includes(queue)}
                  onChange={() => handleToggleQueue(queue)}
                  className="w-4 h-4"
                  disabled={!cookies}
                />
                <span className="font-medium capitalize">{queue.replace("_", " ")}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Auto-Sync Configuration */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>⏰ Auto-Sync Settings</span>
            {config.auto_sync_enabled && <Badge className="bg-blue-500">Active</Badge>}
          </CardTitle>
          <CardDescription>Configure automatic synchronization of your Vine items</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-white border">
            <div>
              <p className="font-medium">Auto-Sync Enabled</p>
              <p className="text-sm text-gray-600">Sync every {config.sync_interval_hours} hours</p>
            </div>
            <Button
              variant={config.auto_sync_enabled ? "default" : "outline"}
              onClick={handleToggleAutoSync}
              disabled={!cookies}
            >
              {config.auto_sync_enabled ? "Disable" : "Enable"}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-white border">
            <div>
              <p className="font-medium">Manual Sync</p>
              <p className="text-sm text-gray-600">
                Last synced: {lastSync ? new Date(lastSync).toLocaleString() : "Never"}
              </p>
            </div>
            <Button onClick={handleManualSync} disabled={loading || !cookies} variant="outline">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Syncing..." : "Sync Now"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      {message && (
        <Alert className={message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
