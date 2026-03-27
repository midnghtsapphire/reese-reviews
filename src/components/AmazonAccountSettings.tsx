import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, RefreshCw, CheckCircle2, AlertCircle, Unlink, ExternalLink } from "lucide-react";
import {
  getAmazonConfig,
  saveAmazonConfig,
  syncAmazonOrders,
} from "@/lib/amazonStore";
import type { AmazonConfig } from "@/lib/amazonStore";

const MARKETPLACES = [
  { label: "US - ATVPDKIKX0DER", value: "ATVPDKIKX0DER" },
  { label: "CA - A2EUQ1WTGCTBG2", value: "A2EUQ1WTGCTBG2" },
  { label: "UK - A1F83G8C2ARO7P", value: "A1F83G8C2ARO7P" },
  { label: "DE - A1PA6795UKMFR9", value: "A1PA6795UKMFR9" },
];

export function AmazonAccountSettings() {
  const stored = getAmazonConfig();
  const [config, setConfig] = useState<AmazonConfig>(
    stored ?? {
      seller_id: "",
      marketplace_id: "ATVPDKIKX0DER",
      lwa_client_id: "",
      lwa_client_secret: "",
      refresh_token: "",
      affiliate_tag: "",
      connected: false,
    }
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleConnect = async () => {
    if (!config.seller_id || !config.lwa_client_id || !config.lwa_client_secret || !config.refresh_token) {
      setMessage({ type: "error", text: "Seller ID, LWA Client ID, Client Secret, and Refresh Token are all required." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await syncAmazonOrders(config);
      setMessage({ type: "success", text: "Connected and synced successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Connection failed." });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    const disconnected: AmazonConfig = { ...config, connected: false, last_synced: undefined };
    saveAmazonConfig(disconnected);
    setConfig(disconnected);
    setMessage({ type: "success", text: "Disconnected from Amazon SP-API." });
  };

  const handleChange = (field: keyof AmazonConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="bg-white/10 border-white/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-orange-400" />
            <CardTitle className="text-white">Amazon SP-API Connection</CardTitle>
          </div>
          <Badge className={config.connected ? "bg-green-600 text-white" : "bg-gray-600 text-white"}>
            {config.connected ? "Connected" : "Not Connected"}
          </Badge>
        </div>
        <CardDescription className="text-gray-300">
          Connect your Amazon Seller account to sync orders and manage affiliate links.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert className={message.type === "success" ? "border-green-500/50 bg-green-500/10" : "border-red-500/50 bg-red-500/10"}>
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-green-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-400" />
            )}
            <AlertDescription className={message.type === "success" ? "text-green-300" : "text-red-300"}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Seller ID</Label>
            <Input
              value={config.seller_id}
              onChange={(e) => handleChange("seller_id", e.target.value)}
              placeholder="e.g. A1B2C3D4E5F6G7"
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Marketplace</Label>
            <select
              value={config.marketplace_id}
              onChange={(e) => handleChange("marketplace_id", e.target.value)}
              className="w-full h-10 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {MARKETPLACES.map((m) => (
                <option key={m.value} value={m.value} className="bg-slate-800 text-white">
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Refresh Token</Label>
            <Input
              type="password"
              value={config.refresh_token}
              onChange={(e) => handleChange("refresh_token", e.target.value)}
              placeholder="Atzr|..."
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">LWA Client ID</Label>
            <Input
              value={config.lwa_client_id}
              onChange={(e) => handleChange("lwa_client_id", e.target.value)}
              placeholder="amzn1.application-oa2-client...."
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
            />
            <p className="text-xs text-gray-500">From Seller Central → Apps & Services → Developer Tools → your app.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">LWA Client Secret</Label>
            <Input
              type="password"
              value={config.lwa_client_secret}
              onChange={(e) => handleChange("lwa_client_secret", e.target.value)}
              placeholder="••••••••"
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
            />
            <p className="text-xs text-gray-500">Keep private. Stored locally in your browser only — never sent to any server.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Affiliate Tag</Label>
            <Input
              value={config.affiliate_tag}
              onChange={(e) => handleChange("affiliate_tag", e.target.value)}
              placeholder="e.g. reesereviews-20"
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
            />
          </div>
        </div>

        {config.last_synced && (
          <p className="text-xs text-gray-400">
            Last synced: {new Date(config.last_synced).toLocaleString()}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleConnect}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {config.connected ? "Re-sync" : "Connect & Sync"}
          </Button>
          {config.connected && (
            <Button
              onClick={handleDisconnect}
              variant="outline"
              className="border-white/20 text-gray-300 hover:bg-white/10"
            >
              <Unlink className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10 space-y-2">
          <p className="text-sm font-medium text-gray-200 flex items-center gap-2">
            <Key className="w-4 h-4 text-orange-400" />
            How to get SP-API credentials
          </p>
          <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
            <li>Go to <span className="text-orange-300">sellercentral.amazon.com</span> → Apps &amp; Services → Develop Apps</li>
            <li>Create a new app or use an existing one with SP-API access</li>
            <li>Under Authorization, generate a Refresh Token for your seller account</li>
            <li>Copy your Seller ID from <span className="text-orange-300">Account Info → Business Information</span></li>
            <li>Select your marketplace from the dropdown above</li>
          </ol>
          <a
            href="https://developer-docs.amazon.com/sp-api/docs/get-started-with-the-selling-partner-api"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300"
          >
            <ExternalLink className="w-3 h-3" />
            SP-API Developer Documentation
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
