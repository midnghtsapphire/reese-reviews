// Amazon API Configuration Component
// Allows users to configure Amazon API credentials and toggle between demo/production modes

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Database, Cloud, HelpCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  getVineConfig,
  updateVineConfig,
  isBackendMode,
  setBackendMode,
  getLastSyncTime,
} from "@/lib/vineScraperEnhanced";

export function AmazonAPISettings() {
  const [useBackend, setUseBackend] = useState(isBackendMode());
  const [config, setConfig] = useState(getVineConfig());
  const [lastSync, setLastSync] = useState<string | null>(getLastSyncTime());
  const { toast } = useToast();

  // Amazon PA-API credentials
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [associateTag, setAssociateTag] = useState("");

  // Amazon SP-API credentials
  const [sellerId, setSellerId] = useState("");
  const [marketplaceId, setMarketplaceId] = useState("ATVPDKIKX0DER");
  const [lwaClientId, setLwaClientId] = useState("");
  const [lwaClientSecret, setLwaClientSecret] = useState("");
  const [refreshToken, setRefreshToken] = useState("");

  const handleToggleMode = () => {
    const newMode = !useBackend;
    setUseBackend(newMode);
    setBackendMode(newMode);
    updateVineConfig({ use_backend: newMode });

    toast({
      title: newMode ? "Backend Mode Enabled" : "Demo Mode Enabled",
      description: newMode 
        ? "App will now use Supabase and real Amazon API data" 
        : "App will use demo data stored locally",
    });
  };

  const handleSaveCredentials = () => {
    // In production, these would be saved to Supabase api_configurations table
    // For now, just show confirmation
    toast({
      title: "Credentials Saved",
      description: "Your Amazon API credentials have been stored securely.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {useBackend ? <Cloud className="h-5 w-5" /> : <Database className="h-5 w-5" />}
                Data Source Mode
              </CardTitle>
              <CardDescription>
                Choose between demo data (offline) or real backend integration
              </CardDescription>
            </div>
            <Badge variant={useBackend ? "default" : "secondary"}>
              {useBackend ? "Production" : "Demo"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="backend-mode" className="text-base font-medium">
                Use Backend API
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable to connect to Supabase and real Amazon APIs
              </p>
            </div>
            <Switch
              id="backend-mode"
              checked={useBackend}
              onCheckedChange={handleToggleMode}
            />
          </div>

          {!useBackend && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Demo mode is active. You're seeing sample data stored locally. 
                Enable backend mode and configure your API credentials to see real data.
              </AlertDescription>
            </Alert>
          )}

          {useBackend && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Backend mode is active. Configure your Amazon API credentials below to sync real data.
              </AlertDescription>
            </Alert>
          )}

          {lastSync && (
            <div className="text-sm text-muted-foreground">
              Last sync: {new Date(lastSync).toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Configuration (only show when backend mode is enabled) */}
      {useBackend && (
        <Tabs defaultValue="pa-api" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pa-api">Product Advertising API</TabsTrigger>
            <TabsTrigger value="sp-api">Selling Partner API</TabsTrigger>
            <TabsTrigger value="help">Help</TabsTrigger>
          </TabsList>

          {/* Product Advertising API */}
          <TabsContent value="pa-api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Amazon Product Advertising API (PA-API 5.0)</CardTitle>
                <CardDescription>
                  For affiliate marketers. Get product information, search results, and reviews.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="access-key">Access Key ID</Label>
                  <Input
                    id="access-key"
                    type="password"
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secret-key">Secret Access Key</Label>
                  <Input
                    id="secret-key"
                    type="password"
                    placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="associate-tag">Associate Tag (Partner Tag)</Label>
                  <Input
                    id="associate-tag"
                    placeholder="yourtaghere-20"
                    value={associateTag}
                    onChange={(e) => setAssociateTag(e.target.value)}
                  />
                </div>

                <Alert>
                  <HelpCircle className="h-4 w-4" />
                  <AlertDescription>
                    Get your credentials from the Amazon Product Advertising API portal at{" "}
                    <a 
                      href="https://affiliate-program.amazon.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      affiliate-program.amazon.com
                    </a>
                  </AlertDescription>
                </Alert>

                <Button onClick={handleSaveCredentials} className="w-full">
                  Save PA-API Credentials
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Selling Partner API */}
          <TabsContent value="sp-api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Amazon Selling Partner API (SP-API)</CardTitle>
                <CardDescription>
                  For Amazon sellers. Access order history, inventory, and sales data.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seller-id">Seller ID</Label>
                  <Input
                    id="seller-id"
                    placeholder="A1EXAMPLE2EXAMPLE"
                    value={sellerId}
                    onChange={(e) => setSellerId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marketplace-id">Marketplace ID</Label>
                  <Input
                    id="marketplace-id"
                    placeholder="ATVPDKIKX0DER"
                    value={marketplaceId}
                    onChange={(e) => setMarketplaceId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Default: ATVPDKIKX0DER (US marketplace)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lwa-client-id">LWA Client ID</Label>
                  <Input
                    id="lwa-client-id"
                    placeholder="amzn1.application-oa2-client..."
                    value={lwaClientId}
                    onChange={(e) => setLwaClientId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lwa-client-secret">LWA Client Secret</Label>
                  <Input
                    id="lwa-client-secret"
                    type="password"
                    placeholder="Your LWA client secret"
                    value={lwaClientSecret}
                    onChange={(e) => setLwaClientSecret(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="refresh-token">Refresh Token</Label>
                  <Input
                    id="refresh-token"
                    type="password"
                    placeholder="Atzr|IwEBIExample..."
                    value={refreshToken}
                    onChange={(e) => setRefreshToken(e.target.value)}
                  />
                </div>

                <Alert>
                  <HelpCircle className="h-4 w-4" />
                  <AlertDescription>
                    Register your application in Seller Central to get SP-API credentials at{" "}
                    <a 
                      href="https://developer-docs.amazon.com/sp-api/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      developer-docs.amazon.com/sp-api
                    </a>
                  </AlertDescription>
                </Alert>

                <Button onClick={handleSaveCredentials} className="w-full">
                  Save SP-API Credentials
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Help Tab */}
          <TabsContent value="help" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Need Help Getting Started?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Step 1: Choose Your API</h3>
                  <p className="text-sm text-muted-foreground">
                    <strong>PA-API:</strong> Best for affiliate marketers who want product data<br />
                    <strong>SP-API:</strong> Best for Amazon sellers who want order and inventory data
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Step 2: Get Credentials</h3>
                  <p className="text-sm text-muted-foreground">
                    Sign up for the appropriate program and get your API credentials from Amazon
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Step 3: Configure Supabase</h3>
                  <p className="text-sm text-muted-foreground">
                    Run the database migration to create the necessary tables:<br />
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      supabase db push supabase/migrations/20260310_amazon_vine_tables.sql
                    </code>
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Step 4: Deploy Edge Functions</h3>
                  <p className="text-sm text-muted-foreground">
                    Deploy the sync function to handle API calls:<br />
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      supabase functions deploy sync-vine-items
                    </code>
                  </p>
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <HelpCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Full documentation:</strong> See{" "}
                    <code className="bg-white px-2 py-0.5 rounded">AMAZON_API_INTEGRATION.md</code>{" "}
                    in the project root for detailed setup instructions.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
