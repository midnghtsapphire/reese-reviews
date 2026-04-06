// ============================================================
// META BUSINESS CONNECT — OAuth flow & account management
// ============================================================

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2, XCircle, ExternalLink, RefreshCw, LogOut,
  Facebook, Instagram, Shield, AlertCircle,
} from "lucide-react";
import {
  getMetaAuth,
  saveMetaAuth,
  disconnectMeta,
  getMetaOAuthUrl,
  exchangeCodeForToken,
  getLongLivedToken,
  getPages,
  type MetaAuthConfig,
} from "@/services/metaBusinessService";

export default function MetaBusinessConnect() {
  const [auth, setAuth] = useState<MetaAuthConfig | null>(null);
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"config" | "authorize" | "connected">("config");

  useEffect(() => {
    const stored = getMetaAuth();
    if (stored) {
      setAuth(stored);
      setStep("connected");
    }
  }, []);

  // Check for OAuth callback code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      setAuthCode(code);
      setStep("authorize");
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleStartOAuth = () => {
    if (!appId.trim()) {
      setError("Please enter your Meta App ID");
      return;
    }

    const redirectUri = `${window.location.origin}/marketing`;
    const oauthUrl = getMetaOAuthUrl(appId, redirectUri);
    window.open(oauthUrl, "_blank", "width=600,height=700");
    setStep("authorize");
    setError("");
  };

  const handleExchangeToken = async () => {
    if (!authCode.trim()) {
      setError("Please paste the authorization code from the Meta popup");
      return;
    }

    setIsConnecting(true);
    setError("");

    try {
      const redirectUri = `${window.location.origin}/marketing`;

      // Exchange code for short-lived token
      const tokenResult = await exchangeCodeForToken(authCode, appId, appSecret, redirectUri);

      // Get long-lived token
      const longLivedResult = await getLongLivedToken(tokenResult.access_token, appId, appSecret);

      // Get pages
      const pages = await getPages(longLivedResult.access_token);

      if (pages.length === 0) {
        throw new Error("No Facebook Pages found. Make sure you have admin access to at least one page.");
      }

      const page = pages[0]; // Use first page
      const authConfig: MetaAuthConfig = {
        app_id: appId,
        app_secret: appSecret,
        access_token: longLivedResult.access_token,
        page_access_token: page.access_token,
        page_id: page.id,
        instagram_account_id: page.instagram_business_account?.id || "",
        token_expires_at: new Date(Date.now() + longLivedResult.expires_in * 1000).toISOString(),
        connected_at: new Date().toISOString(),
        user_name: "Connected User",
        page_name: page.name,
      };

      saveMetaAuth(authConfig);
      setAuth(authConfig);
      setStep("connected");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect Meta account");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleManualConnect = () => {
    // Allow manual token entry for testing/development
    if (!appId.trim()) {
      setError("Please enter at least an App ID");
      return;
    }

    const authConfig: MetaAuthConfig = {
      app_id: appId,
      app_secret: appSecret || "manual-entry",
      access_token: authCode || "manual-token",
      page_access_token: authCode || "manual-token",
      page_id: "manual-page-id",
      instagram_account_id: "",
      token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      connected_at: new Date().toISOString(),
      user_name: "Manual Connection",
      page_name: "Reese Reviews Page",
    };

    saveMetaAuth(authConfig);
    setAuth(authConfig);
    setStep("connected");
  };

  const handleDisconnect = () => {
    disconnectMeta();
    setAuth(null);
    setStep("config");
    setAppId("");
    setAppSecret("");
    setAuthCode("");
  };

  const isTokenExpired = auth
    ? new Date(auth.token_expires_at) < new Date()
    : false;

  if (step === "connected" && auth) {
    return (
      <Card className="glass-card border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-blue-500" />
            Meta Business Connected
          </CardTitle>
          <CardDescription>Your Facebook and Instagram accounts are linked</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-slate-800/50">
              <div className="flex items-center gap-2 mb-1">
                <Facebook className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-white">Facebook Page</span>
              </div>
              <p className="text-sm text-gray-400">{auth.page_name}</p>
              <Badge variant="outline" className="mt-1 text-green-400 border-green-400/30">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
              </Badge>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50">
              <div className="flex items-center gap-2 mb-1">
                <Instagram className="h-4 w-4 text-pink-500" />
                <span className="text-sm font-medium text-white">Instagram</span>
              </div>
              <p className="text-sm text-gray-400">
                {auth.instagram_account_id ? "Business Account" : "Not linked"}
              </p>
              <Badge
                variant="outline"
                className={auth.instagram_account_id ? "mt-1 text-green-400 border-green-400/30" : "mt-1 text-gray-400 border-gray-400/30"}
              >
                {auth.instagram_account_id ? (
                  <><CheckCircle2 className="h-3 w-3 mr-1" /> Connected</>
                ) : (
                  <><XCircle className="h-3 w-3 mr-1" /> Not Linked</>
                )}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
            <div>
              <p className="text-sm font-medium text-white">Token Status</p>
              <p className="text-xs text-gray-400">
                Expires: {new Date(auth.token_expires_at).toLocaleDateString()}
              </p>
            </div>
            {isTokenExpired ? (
              <Badge variant="destructive">Expired</Badge>
            ) : (
              <Badge variant="outline" className="text-green-400 border-green-400/30">Valid</Badge>
            )}
          </div>

          <div className="flex gap-2">
            {isTokenExpired && (
              <Button
                variant="outline"
                onClick={() => { setStep("config"); }}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-1" /> Reconnect
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              className="flex-1"
            >
              <LogOut className="h-4 w-4 mr-1" /> Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-blue-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Facebook className="h-5 w-5 text-blue-500" />
          Connect Meta Business
        </CardTitle>
        <CardDescription>
          Link your Facebook Page and Instagram Business account for auto-posting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert className="border-red-500 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        <Alert className="border-blue-500/30 bg-blue-500/10">
          <Shield className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-200 text-sm">
            To connect, you need a{" "}
            <a
              href="https://developers.facebook.com/apps/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Meta Developer App <ExternalLink className="h-3 w-3 inline" />
            </a>{" "}
            with Pages and Instagram permissions. Your credentials are stored locally and never sent to our servers.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div>
            <Label htmlFor="meta-app-id">Meta App ID *</Label>
            <Input
              id="meta-app-id"
              type="text"
              placeholder="Enter your Meta App ID"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              className="bg-slate-800 border-purple-500/30 text-white"
            />
          </div>
          <div>
            <Label htmlFor="meta-app-secret">App Secret (for full OAuth)</Label>
            <Input
              id="meta-app-secret"
              type="password"
              placeholder="Enter your App Secret"
              value={appSecret}
              onChange={(e) => setAppSecret(e.target.value)}
              className="bg-slate-800 border-purple-500/30 text-white"
            />
          </div>

          {step === "authorize" && (
            <div>
              <Label htmlFor="meta-auth-code">Authorization Code</Label>
              <Input
                id="meta-auth-code"
                type="text"
                placeholder="Paste the code from the Meta popup"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
              />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {step === "config" && (
            <>
              <Button onClick={handleStartOAuth} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <Facebook className="h-4 w-4 mr-1" /> Connect with Facebook
              </Button>
              <Button onClick={handleManualConnect} variant="outline" className="flex-1">
                Manual Setup
              </Button>
            </>
          )}
          {step === "authorize" && (
            <Button
              onClick={handleExchangeToken}
              disabled={isConnecting}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isConnecting ? (
                <><RefreshCw className="h-4 w-4 animate-spin mr-1" /> Connecting...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 mr-1" /> Complete Connection</>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
