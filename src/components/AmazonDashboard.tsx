// ============================================================
// AMAZON DASHBOARD — SP-API Connection & Order Management
// Connects Amazon purchases to the Reese Reviews workflow
// Auto-generates affiliate links via meetaudreyeva-20 tag
// ============================================================

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ShoppingCart,
  Link2,
  FileText,
  Zap,
  Copy,
  ExternalLink,
  Package,
} from "lucide-react";
import {
  getAmazonOrders,
  getAmazonConfig,
  saveAmazonConfig,
  syncAmazonOrders,
  getUnreviewedOrders,
  getDraftOrders,
  getReviewedOrders,
  updateOrderReviewStatus,
  generateReviewDraft,
  getAmazonAffiliateLink,
  type AmazonConfig,
} from "@/lib/amazonStore";
import type { AmazonOrder } from "@/lib/businessTypes";

const DEFAULT_AFFILIATE_TAG = "meetaudreyeva-20";

export function AmazonDashboard() {
  const [config, setConfig] = useState<AmazonConfig>(
    getAmazonConfig() ?? {
      seller_id: "",
      marketplace_id: "ATVPDKIKX0DER",
      lwa_client_id: "",
      lwa_client_secret: "",
      refresh_token: "",
      affiliate_tag: DEFAULT_AFFILIATE_TAG,
      connected: false,
    }
  );
  const [orders, setOrders] = useState<AmazonOrder[]>(getAmazonOrders());
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AmazonOrder | null>(null);
  const [draftCopied, setDraftCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState<string | null>(null);

  const unreviewedOrders = getUnreviewedOrders();
  const draftOrders = getDraftOrders();
  const reviewedOrders = getReviewedOrders();

  const handleSaveConfig = () => {
    if (!config.seller_id.trim() || !config.lwa_client_id.trim() || !config.lwa_client_secret.trim() || !config.refresh_token.trim()) {
      setMessage({ type: "error", text: "Seller ID, LWA Client ID, Client Secret, and Refresh Token are all required." });
      return;
    }
    saveAmazonConfig({ ...config, connected: true });
    setMessage({ type: "success", text: "Amazon SP-API credentials saved successfully." });
  };

  const handleSync = async () => {
    if (!config.seller_id || !config.connected) {
      setMessage({ type: "error", text: "Please configure and save your Amazon credentials first." });
      return;
    }
    setSyncing(true);
    setMessage(null);
    try {
      const synced = await syncAmazonOrders(config);
      setOrders(synced);
      setMessage({ type: "success", text: `Synced ${synced.length} orders from Amazon.` });
    } catch {
      setMessage({ type: "error", text: "Sync failed. Please check your credentials and try again." });
    } finally {
      setSyncing(false);
    }
  };

  const handleCopyDraft = (order: AmazonOrder) => {
    const draft = generateReviewDraft(order);
    navigator.clipboard.writeText(draft);
    setDraftCopied(true);
    setTimeout(() => setDraftCopied(false), 2000);
  };

  const handleCopyAffiliateLink = (order: AmazonOrder) => {
    const tag = config.affiliate_tag || DEFAULT_AFFILIATE_TAG;
    const link = order.affiliate_link || getAmazonAffiliateLink(order.asin, tag);
    navigator.clipboard.writeText(link);
    setLinkCopied(order.id);
    setTimeout(() => setLinkCopied(null), 2000);
  };

  const handleMarkDraft = (order: AmazonOrder) => {
    updateOrderReviewStatus(order.id, "draft");
    setOrders(getAmazonOrders());
    setMessage({ type: "success", text: `"${order.product_name}" moved to draft.` });
  };

  const handleMarkPublished = (order: AmazonOrder) => {
    updateOrderReviewStatus(order.id, "published");
    setOrders(getAmazonOrders());
    setMessage({ type: "success", text: `"${order.product_name}" marked as published.` });
  };

  const statusBadge = (status: AmazonOrder["review_status"]) => {
    const map: Record<AmazonOrder["review_status"], { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      not_reviewed: { label: "Not Reviewed", variant: "outline" },
      draft: { label: "Draft", variant: "secondary" },
      published: { label: "Published", variant: "default" },
    };
    const { label, variant } = map[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const OrderCard = ({ order }: { order: AmazonOrder }) => {
    const affiliateTag = config.affiliate_tag || DEFAULT_AFFILIATE_TAG;
    const affiliateUrl = order.affiliate_link || getAmazonAffiliateLink(order.asin, affiliateTag);

    return (
      <div
        className={`p-4 border rounded-lg cursor-pointer transition hover:bg-gray-50 ${selectedOrder?.id === order.id ? "ring-2 ring-purple-500" : ""}`}
        onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
      >
        <div className="flex gap-4">
          <img
            src={order.image_url}
            alt={order.product_name}
            className="w-16 h-16 object-cover rounded flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{order.product_name}</h3>
              {statusBadge(order.review_status)}
            </div>
            <p className="text-xs text-gray-500 mb-1">ASIN: {order.asin}</p>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span>${order.price.toFixed(2)}</span>
              <span>{new Date(order.purchase_date).toLocaleDateString()}</span>
              <Badge variant="outline" className="text-xs py-0">{order.category}</Badge>
            </div>
          </div>
        </div>

        {selectedOrder?.id === order.id && (
          <div className="mt-4 pt-3 border-t space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => { e.stopPropagation(); handleCopyAffiliateLink(order); }}
                className="text-xs"
              >
                <Link2 className="mr-1 h-3 w-3" />
                {linkCopied === order.id ? "Copied!" : "Copy Affiliate Link"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => { e.stopPropagation(); handleCopyDraft(order); }}
                className="text-xs"
              >
                <FileText className="mr-1 h-3 w-3" />
                {draftCopied ? "Draft Copied!" : "Copy Review Draft"}
              </Button>
              <a
                href={affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border rounded-md hover:bg-gray-100 transition"
              >
                <ExternalLink className="h-3 w-3" />
                View on Amazon
              </a>
            </div>
            {order.review_status === "not_reviewed" && (
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => { e.stopPropagation(); handleMarkDraft(order); }}
                className="text-xs"
              >
                <Zap className="mr-1 h-3 w-3" />
                Start Draft
              </Button>
            )}
            {order.review_status === "draft" && (
              <Button
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleMarkPublished(order); }}
                className="text-xs"
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Mark Published
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: orders.length, icon: ShoppingCart, color: "text-blue-400" },
          { label: "Needs Review", value: unreviewedOrders.length, icon: AlertCircle, color: "text-yellow-400" },
          { label: "In Draft", value: draftOrders.length, icon: FileText, color: "text-orange-400" },
          { label: "Published", value: reviewedOrders.length, icon: CheckCircle2, color: "text-green-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-white/5 border-white/10">
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className={`h-8 w-8 ${color}`} />
              <div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Message */}
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          {message.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="orders">
        <TabsList className="bg-white/10">
          <TabsTrigger value="orders" className="text-white data-[state=active]:bg-purple-600">
            📦 Orders ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="connection" className="text-white data-[state=active]:bg-purple-600">
            🔌 Connection
          </TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-300">
              {config.connected ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  Connected · Last synced: {config.last_synced ? new Date(config.last_synced).toLocaleString() : "never"}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-yellow-400">
                  <AlertCircle className="h-4 w-4" />
                  Not connected — configure SP-API in the Connection tab
                </span>
              )}
            </p>
            <Button
              size="sm"
              onClick={handleSync}
              disabled={syncing}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing…" : "Sync Orders"}
            </Button>
          </div>

          <Tabs defaultValue="unreviewed">
            <TabsList className="bg-white/10">
              <TabsTrigger value="unreviewed" className="text-white data-[state=active]:bg-orange-600">
                Needs Review ({unreviewedOrders.length})
              </TabsTrigger>
              <TabsTrigger value="draft" className="text-white data-[state=active]:bg-orange-600">
                Drafts ({draftOrders.length})
              </TabsTrigger>
              <TabsTrigger value="published" className="text-white data-[state=active]:bg-orange-600">
                Published ({reviewedOrders.length})
              </TabsTrigger>
              <TabsTrigger value="all" className="text-white data-[state=active]:bg-orange-600">
                All ({orders.length})
              </TabsTrigger>
            </TabsList>

            {[
              { value: "unreviewed", items: unreviewedOrders },
              { value: "draft", items: draftOrders },
              { value: "published", items: reviewedOrders },
              { value: "all", items: orders },
            ].map(({ value, items }) => (
              <TabsContent key={value} value={value} className="space-y-3 mt-4">
                {items.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <Package className="mx-auto h-10 w-10 mb-2 opacity-40" />
                    <p>No orders in this category.</p>
                  </div>
                ) : (
                  items.map((order) => <OrderCard key={order.id} order={order} />)
                )}
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>

        {/* Connection Tab */}
        <TabsContent value="connection" className="space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Link2 className="h-5 w-5 text-yellow-400" />
                Amazon SP-API Connection
              </CardTitle>
              <CardDescription className="text-gray-400">
                Connect your Amazon Seller account to automatically import purchased orders and generate
                affiliate links. Your credentials are stored locally and never sent to third parties.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-gray-300">Seller ID</Label>
                  <Input
                    placeholder="e.g. A2EUQ1WTGCTBG2"
                    value={config.seller_id}
                    onChange={(e) => setConfig({ ...config, seller_id: e.target.value })}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Marketplace ID</Label>
                  <Input
                    placeholder="ATVPDKIKX0DER (US)"
                    value={config.marketplace_id}
                    onChange={(e) => setConfig({ ...config, marketplace_id: e.target.value })}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-gray-300">LWA Client ID</Label>
                  <Input
                    placeholder="amzn1.application-oa2-client...."
                    value={config.lwa_client_id}
                    onChange={(e) => setConfig({ ...config, lwa_client_id: e.target.value })}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                  />
                  <p className="text-xs text-gray-500">From your app in Seller Central → Developer Tools → Apps & Services.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">LWA Client Secret</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={config.lwa_client_secret}
                    onChange={(e) => setConfig({ ...config, lwa_client_secret: e.target.value })}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                  />
                  <p className="text-xs text-gray-500">Keep this private — never share it. Stored locally in your browser only.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">LWA Refresh Token</Label>
                <Input
                  type="password"
                  placeholder="Atzr|..."
                  value={config.refresh_token}
                  onChange={(e) => setConfig({ ...config, refresh_token: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-500">
                  Obtain via{" "}
                  <a
                    href="https://developer-docs.amazon.com/sp-api/docs/authorizing-selling-partner-api-applications"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:underline"
                  >
                    Amazon SP-API Authorization Guide
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Amazon Affiliate Tag</Label>
                <Input
                  placeholder="meetaudreyeva-20"
                  value={config.affiliate_tag}
                  onChange={(e) => setConfig({ ...config, affiliate_tag: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-500">
                  Default: <code className="text-purple-400">meetaudreyeva-20</code>. Appended to every Amazon
                  product link to earn affiliate commissions.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSaveConfig}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Save & Connect
                </Button>
                {config.connected && (
                  <Button
                    variant="outline"
                    onClick={handleSync}
                    disabled={syncing}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                    {syncing ? "Syncing…" : "Sync Now"}
                  </Button>
                )}
              </div>

              {config.connected && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    Connected to Amazon SP-API. Affiliate tag: <strong>{config.affiliate_tag || DEFAULT_AFFILIATE_TAG}</strong>
                  </AlertDescription>
                </Alert>
              )}

              <Alert variant="destructive" className="bg-yellow-900/20 border-yellow-600/40 text-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <AlertDescription>
                  <strong>Production Note:</strong> Live SP-API calls require a backend proxy to handle
                  AWS SigV4 signing and LWA token refresh. Currently running in demo mode with sample data.
                  Configure your backend at <code>/api/amazon/orders</code> to enable live sync.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Affiliate Link Generator */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Link2 className="h-4 w-4 text-orange-400" />
                Quick Affiliate Link Generator
              </CardTitle>
              <CardDescription className="text-gray-400">
                Paste any Amazon ASIN to generate an affiliate link with your tag.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AffiliateQuickGen affiliateTag={config.affiliate_tag || DEFAULT_AFFILIATE_TAG} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AffiliateQuickGen({ affiliateTag }: { affiliateTag: string }) {
  const [asin, setAsin] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const trimmed = asin.trim().toUpperCase();
    if (!trimmed) return;
    setGeneratedLink(getAmazonAffiliateLink(trimmed, affiliateTag));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Enter ASIN (e.g. B09JQMJHXY)"
          value={asin}
          onChange={(e) => setAsin(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
        />
        <Button onClick={handleGenerate} className="bg-orange-600 hover:bg-orange-700 text-white flex-shrink-0">
          Generate
        </Button>
      </div>
      {generatedLink && (
        <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
          <code className="text-xs text-green-400 flex-1 break-all">{generatedLink}</code>
          <Button size="sm" variant="ghost" onClick={handleCopy} className="text-white flex-shrink-0">
            <Copy className="h-4 w-4 mr-1" />
            {copied ? "Copied!" : "Copy"}
          </Button>
          <a
            href={generatedLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  );
}
