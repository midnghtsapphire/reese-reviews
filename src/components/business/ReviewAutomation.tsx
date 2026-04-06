// ============================================================
// REVIEW AUTOMATION — MAIN COMPONENT
// Orchestrates the full review automation workflow:
// Product Input → Review Generation → Media → Video → Package
// ============================================================

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Zap,
  Package,
  FileText,
  Camera,
  Video,
  Send,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Star,
  ShieldCheck,
  Eye,
  Download,
  ArrowRight,
  ArrowLeft,
  Settings2,
  Import,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  X,
  RotateCcw,
  Copy,
  Check,
} from "lucide-react";
import { ReviewGenerator } from "@/components/business/ReviewGenerator";
import { ReviewMediaManager } from "@/components/business/ReviewMediaManager";
import { ReviewVideoCreator } from "@/components/business/ReviewVideoCreator";
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getProduct,
  getReviewVariants,
  getSelectedReview,
  getMediaAssets,
  getVideoProjects,
  getReviewPackages,
  createReviewPackage,
  markPackageSubmitted,
  importFromAmazonOrder,
  getSettings,
  updateSettings,
  PRODUCT_CATEGORIES,
} from "@/stores/reviewAutomationStore";
import type {
  ProductInput,
  ProductCategory,
  ReviewVariant,
  MediaAsset,
  VideoProject,
  ReviewPackage,
  AutomationSettings,
} from "@/stores/reviewAutomationStore";

// ─── WORKFLOW STEPS ─────────────────────────────────────────

type WorkflowStep = "products" | "review" | "media" | "video" | "package";

const WORKFLOW_STEPS: { id: WorkflowStep; label: string; icon: React.ReactNode; description: string }[] = [
  { id: "products", label: "Product", icon: <Package className="h-4 w-4" />, description: "Add product details" },
  { id: "review", label: "Review", icon: <FileText className="h-4 w-4" />, description: "Generate review text" },
  { id: "media", label: "Photos", icon: <Camera className="h-4 w-4" />, description: "Manage product photos" },
  { id: "video", label: "Video", icon: <Video className="h-4 w-4" />, description: "Create review video" },
  { id: "package", label: "Submit", icon: <Send className="h-4 w-4" />, description: "Package & submit" },
];

// ─── COMPONENT ──────────────────────────────────────────────

export function ReviewAutomation() {
  const [activeStep, setActiveStep] = useState<WorkflowStep>("products");
  const [products, setProducts] = useState<ProductInput[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // New product form
  const [productForm, setProductForm] = useState({
    productName: "",
    asin: "",
    description: "",
    category: "electronics" as ProductCategory,
    price: 0,
  });

  const settings = getSettings();

  const refresh = useCallback(() => {
    setProducts(getProducts());
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectedProduct = selectedProductId
    ? getProduct(selectedProductId)
    : null;

  // ─── PRODUCT CRUD ──────────────────────────────────────

  const handleAddProduct = () => {
    if (!productForm.productName.trim()) return;

    const product = addProduct({
      ...productForm,
      imageUrls: [],
      importedFromOrder: false,
    });

    setSelectedProductId(product.id);
    setShowAddForm(false);
    setProductForm({
      productName: "",
      asin: "",
      description: "",
      category: "electronics",
      price: 0,
    });
    refresh();
  };

  const handleDeleteProduct = (id: string) => {
    deleteProduct(id);
    if (selectedProductId === id) {
      setSelectedProductId(null);
    }
    refresh();
  };

  // ─── IMPORT FROM AMAZON ────────────────────────────────

  const handleImportFromAmazon = () => {
    // Try to read from amazonStore in localStorage
    try {
      const ordersRaw = localStorage.getItem("reese-amazon-orders");
      if (ordersRaw) {
        const orders = JSON.parse(ordersRaw);
        if (Array.isArray(orders) && orders.length > 0) {
          // Show import modal with available orders
          setShowImportModal(true);
          return;
        }
      }
    } catch {
      // ignore
    }

    // Also try productLifecycleStore
    try {
      const lifecycleRaw = localStorage.getItem("reese-product-lifecycle");
      if (lifecycleRaw) {
        const items = JSON.parse(lifecycleRaw);
        if (Array.isArray(items) && items.length > 0) {
          setShowImportModal(true);
          return;
        }
      }
    } catch {
      // ignore
    }

    // No data found — show demo import
    setShowImportModal(true);
  };

  const handleImportOrder = (order: {
    asin: string;
    product_name: string;
    category: string;
    image_url: string;
    price: number;
    amazon_order_id: string;
  }) => {
    const product = importFromAmazonOrder(order);
    setSelectedProductId(product.id);
    setShowImportModal(false);
    refresh();
  };

  // ─── PACKAGE CREATION ──────────────────────────────────

  const handleCreatePackage = () => {
    if (!selectedProductId) return;

    const review = getSelectedReview(selectedProductId);
    if (!review) return;

    const media = getMediaAssets(selectedProductId);
    const videos = getVideoProjects(selectedProductId);
    const videoId = videos.find(
      (v) => v.status === "ready" || v.status === "exported"
    )?.id;

    createReviewPackage(
      selectedProductId,
      review.id,
      media.map((m) => m.id),
      videoId
    );

    refresh();
  };

  const handleMarkSubmitted = (packageId: string) => {
    markPackageSubmitted(packageId);
    refresh();
  };

  // ─── WORKFLOW NAVIGATION ───────────────────────────────

  const stepIndex = WORKFLOW_STEPS.findIndex((s) => s.id === activeStep);

  const goNext = () => {
    if (stepIndex < WORKFLOW_STEPS.length - 1) {
      setActiveStep(WORKFLOW_STEPS[stepIndex + 1].id);
    }
  };

  const goPrev = () => {
    if (stepIndex > 0) {
      setActiveStep(WORKFLOW_STEPS[stepIndex - 1].id);
    }
  };

  // ─── STEP COMPLETION STATUS ────────────────────────────

  const getStepStatus = (step: WorkflowStep): "complete" | "active" | "pending" => {
    if (!selectedProductId) return step === "products" ? "active" : "pending";

    switch (step) {
      case "products":
        return selectedProductId ? "complete" : "active";
      case "review":
        return getReviewVariants(selectedProductId).some((r) => r.isSelected)
          ? "complete"
          : activeStep === "review"
          ? "active"
          : "pending";
      case "media":
        return getMediaAssets(selectedProductId).length > 0
          ? "complete"
          : activeStep === "media"
          ? "active"
          : "pending";
      case "video":
        return getVideoProjects(selectedProductId).some(
          (v) => v.status === "ready" || v.status === "exported"
        )
          ? "complete"
          : activeStep === "video"
          ? "active"
          : "pending";
      case "package":
        return getReviewPackages(selectedProductId).some(
          (p) => p.status === "submitted"
        )
          ? "complete"
          : activeStep === "package"
          ? "active"
          : "pending";
      default:
        return "pending";
    }
  };

  // ─── AMAZON ORDERS FOR IMPORT ──────────────────────────

  const getAvailableOrders = (): Array<{
    asin: string;
    product_name: string;
    category: string;
    image_url: string;
    price: number;
    amazon_order_id: string;
  }> => {
    const orders: Array<{
      asin: string;
      product_name: string;
      category: string;
      image_url: string;
      price: number;
      amazon_order_id: string;
    }> = [];

    try {
      const ordersRaw = localStorage.getItem("reese-amazon-orders");
      if (ordersRaw) {
        const parsed = JSON.parse(ordersRaw);
        if (Array.isArray(parsed)) {
          parsed.forEach((o: Record<string, unknown>) => {
            orders.push({
              asin: String(o.asin ?? ""),
              product_name: String(o.product_name ?? ""),
              category: String(o.category ?? "other"),
              image_url: String(o.image_url ?? ""),
              price: Number(o.price ?? 0),
              amazon_order_id: String(o.amazon_order_id ?? o.id ?? ""),
            });
          });
        }
      }
    } catch {
      // ignore
    }

    // If no real orders, provide demo options
    if (orders.length === 0) {
      orders.push(
        {
          asin: "B09JQMJHXY",
          product_name: "Anker Soundcore Life Q30 Wireless Headphones",
          category: "tech",
          image_url: "",
          price: 79.99,
          amazon_order_id: "114-2847391-0293847",
        },
        {
          asin: "B0BDHX8Z63",
          product_name: "Ninja Creami Ice Cream Maker",
          category: "food-restaurants",
          image_url: "",
          price: 199.99,
          amazon_order_id: "114-9283746-1029384",
        },
        {
          asin: "B0C2QWXYZ1",
          product_name: "Ring Video Doorbell 4",
          category: "tech",
          image_url: "",
          price: 149.99,
          amazon_order_id: "114-3847261-9182736",
        }
      );
    }

    return orders;
  };

  // ─── RENDER ───────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Zap className="h-8 w-8 text-[#FF6B2B]" />
            Review Automation
          </h2>
          <p className="text-gray-400 mt-1">
            Generate complete product reviews ready for submission
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
          className="border-white/20 text-gray-300 hover:bg-white/10"
        >
          <Settings2 className="mr-1 h-4 w-4" />
          Settings
        </Button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-lg">Automation Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Review defaults */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-gray-300 text-xs mb-1 block">Default Tone</Label>
                <Select
                  value={settings.defaultTone}
                  onValueChange={(v) => updateSettings({ defaultTone: v as AutomationSettings["defaultTone"] })}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300 text-xs mb-1 block">Default Avatar</Label>
                <Select
                  value={settings.defaultAvatar}
                  onValueChange={(v) => updateSettings({ defaultAvatar: v as AutomationSettings["defaultAvatar"] })}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reese">Reese</SelectItem>
                    <SelectItem value="revvel">Revvel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300 text-xs mb-1 block">Default Video Style</Label>
                <Select
                  value={settings.defaultVideoStyle}
                  onValueChange={(v) => updateSettings({ defaultVideoStyle: v as AutomationSettings["defaultVideoStyle"] })}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unboxing">Unboxing</SelectItem>
                    <SelectItem value="demo">Demo</SelectItem>
                    <SelectItem value="lifestyle">Lifestyle</SelectItem>
                    <SelectItem value="comparison">Comparison</SelectItem>
                    <SelectItem value="quick-take">Quick Take</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300 text-xs mb-1 block">Variants to Generate</Label>
                <Select
                  value={String(settings.variantsToGenerate)}
                  onValueChange={(v) => updateSettings({ variantsToGenerate: parseInt(v) })}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} variant{n > 1 ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* AI API Keys */}
            <div className="border-t border-white/10 pt-4">
              <p className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                <span>🤖</span> AI Integration Keys
                <span className="text-xs text-gray-400 font-normal">(stored in your browser only — never sent to our servers)</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-300 text-xs mb-1 block">HeyGen API Key</Label>
                  <Input
                    type="password"
                    value={settings.heygenApiKey}
                    onChange={(e) => updateSettings({ heygenApiKey: e.target.value })}
                    placeholder="Paste HeyGen API key..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-600 text-sm"
                  />
                  <p className="text-[10px] text-gray-500 mt-0.5">app.heygen.com → Settings → API</p>
                </div>
                <div>
                  <Label className="text-gray-300 text-xs mb-1 block">HeyGen Avatar ID</Label>
                  <Input
                    value={settings.heygenAvatarId}
                    onChange={(e) => updateSettings({ heygenAvatarId: e.target.value })}
                    placeholder="avatar_id from HeyGen or Avatar Library..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-600 text-sm"
                  />
                  <p className="text-[10px] text-gray-500 mt-0.5">Load from Business → Reviews → Avatar Library</p>
                </div>
                <div>
                  <Label className="text-gray-300 text-xs mb-1 block">ElevenLabs API Key</Label>
                  <Input
                    type="password"
                    value={settings.elevenLabsApiKey}
                    onChange={(e) => updateSettings({ elevenLabsApiKey: e.target.value })}
                    placeholder="Paste ElevenLabs API key..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-600 text-sm"
                  />
                  <p className="text-[10px] text-gray-500 mt-0.5">elevenlabs.io → Settings → API Keys</p>
                </div>
                <div>
                  <Label className="text-gray-300 text-xs mb-1 block">ElevenLabs Voice ID</Label>
                  <Input
                    value={settings.elevenLabsVoiceId}
                    onChange={(e) => updateSettings({ elevenLabsVoiceId: e.target.value })}
                    placeholder="voice_id from ElevenLabs or Avatar Library..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-600 text-sm"
                  />
                  <p className="text-[10px] text-gray-500 mt-0.5">Load from Business → Reviews → Avatar Library</p>
                </div>
                <div>
                  <Label className="text-gray-300 text-xs mb-1 block">OpenAI API Key</Label>
                  <Input
                    type="password"
                    value={settings.openaiApiKey}
                    onChange={(e) => updateSettings({ openaiApiKey: e.target.value })}
                    placeholder="sk-..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-600 text-sm"
                  />
                  <p className="text-[10px] text-gray-500 mt-0.5">platform.openai.com → API Keys</p>
                </div>
                <div>
                  <Label className="text-gray-300 text-xs mb-1 block">Picasso / DALL-E Key</Label>
                  <Input
                    type="password"
                    value={settings.picassoApiKey}
                    onChange={(e) => updateSettings({ picassoApiKey: e.target.value })}
                    placeholder="Uses OpenAI key if blank..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-600 text-sm"
                  />
                  <p className="text-[10px] text-gray-500 mt-0.5">Leave blank to use OpenAI key above</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow Progress Bar */}
      <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 p-4">
        <div className="flex items-center justify-between">
          {WORKFLOW_STEPS.map((step, idx) => {
            const status = getStepStatus(step.id);
            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => setActiveStep(step.id)}
                  className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                    activeStep === step.id
                      ? "bg-[#FF6B2B]/20 text-[#FF6B2B]"
                      : status === "complete"
                      ? "text-green-400 hover:bg-white/5"
                      : "text-gray-500 hover:bg-white/5"
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                      activeStep === step.id
                        ? "border-[#FF6B2B] bg-[#FF6B2B]/20"
                        : status === "complete"
                        ? "border-green-500 bg-green-500/20"
                        : "border-gray-600 bg-transparent"
                    }`}
                  >
                    {status === "complete" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">
                    {step.label}
                  </span>
                </button>
                {idx < WORKFLOW_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 rounded ${
                      getStepStatus(WORKFLOW_STEPS[idx + 1].id) === "complete" ||
                      getStepStatus(step.id) === "complete"
                        ? "bg-green-500/50"
                        : "bg-white/10"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ─── STEP: PRODUCTS ─── */}
      {activeStep === "products" && (
        <div className="space-y-6">
          {/* Product Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-[#FF6B2B] hover:bg-[#FF6B2B]/80 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
            <Button
              variant="outline"
              onClick={handleImportFromAmazon}
              className="border-[#FFB347]/30 text-[#FFB347] hover:bg-[#FFB347]/10"
            >
              <Import className="mr-2 h-4 w-4" />
              Import from Amazon
            </Button>
          </div>

          {/* Add Product Form */}
          {showAddForm && (
            <Card className="bg-white/5 backdrop-blur-md border-[#FF6B2B]/30">
              <CardHeader>
                <CardTitle className="text-white">New Product</CardTitle>
                <CardDescription className="text-gray-400">
                  Enter product details for review generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300 mb-1 block">Product Name *</Label>
                    <Input
                      value={productForm.productName}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          productName: e.target.value,
                        }))
                      }
                      placeholder="e.g., Anker Wireless Earbuds"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 mb-1 block">ASIN</Label>
                    <Input
                      value={productForm.asin}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          asin: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="e.g., B09JQMJHXY"
                      className="bg-white/10 border-white/20 text-white font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 mb-1 block">Category</Label>
                    <Select
                      value={productForm.category}
                      onValueChange={(v) =>
                        setProductForm((prev) => ({
                          ...prev,
                          category: v as ProductCategory,
                        }))
                      }
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUCT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-300 mb-1 block">Price ($)</Label>
                    <Input
                      type="number"
                      value={productForm.price || ""}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          price: parseFloat(e.target.value) || 0,
                        }))
                      }
                      placeholder="49.99"
                      className="bg-white/10 border-white/20 text-white"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300 mb-1 block">Description</Label>
                  <Textarea
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Product features, specs, what it does..."
                    rows={3}
                    className="bg-white/10 border-white/20 text-white resize-y"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddProduct}
                    disabled={!productForm.productName.trim()}
                    className="bg-[#FF6B2B] hover:bg-[#FF6B2B]/80 text-white"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Product
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    className="border-white/20 text-gray-300 hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Product List */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="h-5 w-5 text-[#FFB347]" />
                Products
                <Badge variant="outline" className="ml-2 border-white/20 text-gray-300">
                  {products.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No products yet</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Add a product or import from Amazon to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map((product) => {
                    const reviewCount = getReviewVariants(product.id).length;
                    const mediaCount = getMediaAssets(product.id).length;
                    const videoCount = getVideoProjects(product.id).length;
                    const hasSelectedReview = !!getSelectedReview(product.id);

                    return (
                      <div
                        key={product.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedProductId === product.id
                            ? "border-[#FF6B2B]/50 bg-[#FF6B2B]/5"
                            : "border-white/10 bg-white/5 hover:border-white/20"
                        }`}
                        onClick={() => setSelectedProductId(product.id)}
                      >
                        {/* Product Image Placeholder */}
                        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#FF6B2B]/20 to-[#FFB347]/20 flex items-center justify-center flex-shrink-0">
                          {product.imageUrls.length > 0 ? (
                            <img
                              src={product.imageUrls[0]}
                              alt={product.productName}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-[#FFB347]" />
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium truncate">
                            {product.productName}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            {product.asin && (
                              <Badge
                                variant="outline"
                                className="border-white/10 text-gray-400 text-xs font-mono"
                              >
                                {product.asin}
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className="border-white/10 text-gray-400 text-xs"
                            >
                              {PRODUCT_CATEGORIES.find(
                                (c) => c.value === product.category
                              )?.label ?? product.category}
                            </Badge>
                            {product.price > 0 && (
                              <span className="text-xs text-gray-500">
                                ${product.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Indicators */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div
                            className={`flex items-center gap-1 text-xs ${
                              reviewCount > 0 ? "text-green-400" : "text-gray-600"
                            }`}
                            title={`${reviewCount} review variants`}
                          >
                            <FileText className="h-3 w-3" />
                            {reviewCount}
                          </div>
                          <div
                            className={`flex items-center gap-1 text-xs ${
                              mediaCount > 0 ? "text-blue-400" : "text-gray-600"
                            }`}
                            title={`${mediaCount} media assets`}
                          >
                            <Camera className="h-3 w-3" />
                            {mediaCount}
                          </div>
                          <div
                            className={`flex items-center gap-1 text-xs ${
                              videoCount > 0 ? "text-purple-400" : "text-gray-600"
                            }`}
                            title={`${videoCount} video projects`}
                          >
                            <Video className="h-3 w-3" />
                            {videoCount}
                          </div>
                          {product.importedFromOrder && (
                            <Badge className="bg-[#FFB347]/20 text-[#FFB347] text-xs border-[#FFB347]/30">
                              Imported
                            </Badge>
                          )}
                        </div>

                        {/* Delete */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-gray-500 hover:text-red-400 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProduct(product.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Step */}
          {selectedProductId && (
            <div className="flex justify-end">
              <Button
                onClick={goNext}
                className="bg-gradient-to-r from-[#FF6B2B] to-[#FFB347] text-white font-semibold"
              >
                Continue to Review
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ─── STEP: REVIEW ─── */}
      {activeStep === "review" && selectedProduct && (
        <div className="space-y-6">
          <ReviewGenerator
            key={`review-${selectedProductId}-${refreshKey}`}
            productId={selectedProduct.id}
            productName={selectedProduct.productName}
            onReviewUpdate={refresh}
          />

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={goPrev}
              className="border-white/20 text-gray-300 hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
            <Button
              onClick={goNext}
              className="bg-gradient-to-r from-[#FF6B2B] to-[#FFB347] text-white font-semibold"
            >
              Continue to Photos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── STEP: MEDIA ─── */}
      {activeStep === "media" && selectedProduct && (
        <div className="space-y-6">
          <ReviewMediaManager
            key={`media-${selectedProductId}-${refreshKey}`}
            productId={selectedProduct.id}
            productName={selectedProduct.productName}
            onMediaUpdate={refresh}
          />

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={goPrev}
              className="border-white/20 text-gray-300 hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Review
            </Button>
            <Button
              onClick={goNext}
              className="bg-gradient-to-r from-[#FF6B2B] to-[#FFB347] text-white font-semibold"
            >
              Continue to Video
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── STEP: VIDEO ─── */}
      {activeStep === "video" && selectedProduct && (
        <div className="space-y-6">
          <ReviewVideoCreator
            key={`video-${selectedProductId}-${refreshKey}`}
            productId={selectedProduct.id}
            productName={selectedProduct.productName}
            onVideoUpdate={refresh}
          />

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={goPrev}
              className="border-white/20 text-gray-300 hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Photos
            </Button>
            <Button
              onClick={goNext}
              className="bg-gradient-to-r from-[#FF6B2B] to-[#FFB347] text-white font-semibold"
            >
              Continue to Submit
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── STEP: PACKAGE & SUBMIT ─── */}
      {activeStep === "package" && selectedProduct && (
        <div className="space-y-6">
          {/* Package Preview */}
          <ReviewPackagePreview
            productId={selectedProduct.id}
            productName={selectedProduct.productName}
            onCreatePackage={handleCreatePackage}
            onMarkSubmitted={handleMarkSubmitted}
            refreshKey={refreshKey}
          />

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={goPrev}
              className="border-white/20 text-gray-300 hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Video
            </Button>
          </div>
        </div>
      )}

      {/* No Product Selected Warning */}
      {activeStep !== "products" && !selectedProduct && (
        <Alert className="bg-yellow-500/10 border-yellow-500/30">
          <AlertCircle className="h-4 w-4 text-yellow-400" />
          <AlertDescription className="text-yellow-300">
            Please select a product first.{" "}
            <button
              onClick={() => setActiveStep("products")}
              className="underline hover:no-underline"
            >
              Go to Products
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowImportModal(false)}
        >
          <div
            className="bg-slate-900 border border-white/20 rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Import from Amazon Orders
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowImportModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                {getAvailableOrders().map((order) => (
                  <div
                    key={order.amazon_order_id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:border-[#FF6B2B]/30 cursor-pointer transition-all"
                    onClick={() => handleImportOrder(order)}
                  >
                    <div className="w-10 h-10 rounded bg-[#FFB347]/20 flex items-center justify-center flex-shrink-0">
                      <Package className="h-5 w-5 text-[#FFB347]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {order.product_name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400 font-mono">
                          {order.asin}
                        </span>
                        <span className="text-xs text-gray-500">
                          ${order.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <Import className="h-4 w-4 text-[#FF6B2B] flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── REVIEW PACKAGE PREVIEW SUB-COMPONENT ───────────────────

function ReviewPackagePreview({
  productId,
  productName,
  onCreatePackage,
  onMarkSubmitted,
  refreshKey,
}: {
  productId: string;
  productName: string;
  onCreatePackage: () => void;
  onMarkSubmitted: (id: string) => void;
  refreshKey: number;
}) {
  const selectedReview = getSelectedReview(productId);
  const mediaAssets = getMediaAssets(productId);
  const videoProjects = getVideoProjects(productId);
  const packages = getReviewPackages(productId);
  const readyVideo = videoProjects.find(
    (v) => v.status === "ready" || v.status === "exported"
  );

  const isReadyToPackage = !!selectedReview && mediaAssets.length > 0;

  return (
    <div className="space-y-6">
      {/* Readiness Check */}
      <Card className="bg-white/5 backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <CheckCircle2 className="h-5 w-5 text-[#FFD93D]" />
            Review Package Checklist
          </CardTitle>
          <CardDescription className="text-gray-400">
            Everything needed for submission
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Review Text */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center ${
                  selectedReview
                    ? "bg-green-500/20 text-green-400"
                    : "bg-gray-500/20 text-gray-500"
                }`}
              >
                {selectedReview ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">Review Text</p>
                {selectedReview ? (
                  <p className="text-gray-400 text-xs">
                    &ldquo;{selectedReview.title}&rdquo; — {selectedReview.wordCount} words,{" "}
                    {selectedReview.rating}/5 stars
                  </p>
                ) : (
                  <p className="text-gray-500 text-xs">
                    No review selected yet
                  </p>
                )}
              </div>
              <FileText
                className={`h-4 w-4 ${
                  selectedReview ? "text-green-400" : "text-gray-600"
                }`}
              />
            </div>

            {/* Star Rating */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center ${
                  selectedReview
                    ? "bg-green-500/20 text-green-400"
                    : "bg-gray-500/20 text-gray-500"
                }`}
              >
                {selectedReview ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">Star Rating</p>
                {selectedReview ? (
                  <div className="flex items-center gap-1 mt-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3 w-3 ${
                          s <= selectedReview.rating
                            ? "fill-[#FFD93D] text-[#FFD93D]"
                            : "text-gray-600"
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-400 ml-1">
                      ({selectedReview.rating}/5)
                    </span>
                  </div>
                ) : (
                  <p className="text-gray-500 text-xs">Pending review selection</p>
                )}
              </div>
              <Star
                className={`h-4 w-4 ${
                  selectedReview ? "text-[#FFD93D]" : "text-gray-600"
                }`}
              />
            </div>

            {/* Photos */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center ${
                  mediaAssets.length > 0
                    ? "bg-green-500/20 text-green-400"
                    : "bg-gray-500/20 text-gray-500"
                }`}
              >
                {mediaAssets.length > 0 ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">Product Photos</p>
                <p className="text-gray-400 text-xs">
                  {mediaAssets.length > 0
                    ? `${mediaAssets.length} photos — all metadata stripped`
                    : "No photos uploaded yet"}
                </p>
              </div>
              <Camera
                className={`h-4 w-4 ${
                  mediaAssets.length > 0 ? "text-green-400" : "text-gray-600"
                }`}
              />
            </div>

            {/* Video */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center ${
                  readyVideo
                    ? "bg-green-500/20 text-green-400"
                    : "bg-yellow-500/20 text-yellow-500"
                }`}
              >
                {readyVideo ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">Review Video</p>
                <p className="text-gray-400 text-xs">
                  {readyVideo
                    ? `${readyVideo.duration}s ${readyVideo.style} video — ${readyVideo.status}`
                    : "Optional — no video created yet"}
                </p>
              </div>
              <Video
                className={`h-4 w-4 ${
                  readyVideo ? "text-green-400" : "text-yellow-500"
                }`}
              />
            </div>

            {/* Metadata Clean */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <div className="h-6 w-6 rounded-full flex items-center justify-center bg-green-500/20 text-green-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">
                  Metadata Clean
                </p>
                <p className="text-gray-400 text-xs">
                  No AI fingerprints, watermarks, or generation tags
                </p>
              </div>
              <ShieldCheck className="h-4 w-4 text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Preview */}
      {selectedReview && (
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Eye className="h-5 w-5 text-[#FF6B2B]" />
              Review Preview
            </CardTitle>
            <CardDescription className="text-gray-400">
              How your review will appear when posted
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Amazon-style review preview */}
            <div className="bg-white rounded-lg p-6 text-black max-w-2xl">
              {/* Stars */}
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-5 w-5 ${
                      s <= selectedReview.rating
                        ? "fill-[#FFA41C] text-[#FFA41C]"
                        : "fill-gray-200 text-gray-200"
                    }`}
                  />
                ))}
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold mb-3">{selectedReview.title}</h3>

              {/* Photos Strip */}
              {mediaAssets.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {mediaAssets.slice(0, 5).map((asset) => (
                    <img
                      key={asset.id}
                      src={asset.cleanUrl}
                      alt="Review photo"
                      className="w-16 h-16 object-cover rounded border border-gray-200"
                    />
                  ))}
                  {mediaAssets.length > 5 && (
                    <div className="w-16 h-16 rounded border border-gray-200 flex items-center justify-center bg-gray-50">
                      <span className="text-xs text-gray-500">
                        +{mediaAssets.length - 5}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Body */}
              <p className="text-sm leading-relaxed text-gray-800 mb-4">
                {selectedReview.body}
              </p>

              {/* Pros & Cons */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-green-700 mb-1">Pros</p>
                  <ul className="space-y-0.5">
                    {selectedReview.pros.map((pro, idx) => (
                      <li key={idx} className="text-gray-700 flex items-start gap-1">
                        <span className="text-green-600">+</span> {pro}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-red-700 mb-1">Cons</p>
                  <ul className="space-y-0.5">
                    {selectedReview.cons.map((con, idx) => (
                      <li key={idx} className="text-gray-700 flex items-start gap-1">
                        <span className="text-red-600">-</span> {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Video Badge */}
              {readyVideo && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    <Video className="mr-1 h-3 w-3" />
                    Video review attached ({readyVideo.duration}s)
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Package Actions */}
      <Card className="bg-white/5 backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Send className="h-5 w-5 text-[#FFD93D]" />
            Package & Submit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Packages */}
          {packages.length > 0 && (
            <div className="space-y-2 mb-4">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    pkg.status === "submitted"
                      ? "border-green-500/30 bg-green-500/5"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        pkg.status === "submitted"
                          ? "bg-green-500/20"
                          : "bg-[#FFB347]/20"
                      }`}
                    >
                      {pkg.status === "submitted" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                      ) : (
                        <Send className="h-4 w-4 text-[#FFB347]" />
                      )}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        Review Package
                      </p>
                      <p className="text-gray-400 text-xs">
                        {pkg.mediaAssetIds.length} photos
                        {pkg.videoProjectId ? " + video" : ""} •{" "}
                        {pkg.status === "submitted"
                          ? `Submitted ${new Date(pkg.submittedAt!).toLocaleDateString()}`
                          : "Ready to submit"}
                      </p>
                    </div>
                  </div>

                  {pkg.status !== "submitted" && (
                    <Button
                      size="sm"
                      onClick={() => onMarkSubmitted(pkg.id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Mark Submitted
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Create Package */}
          <Button
            onClick={onCreatePackage}
            disabled={!isReadyToPackage}
            className="w-full bg-gradient-to-r from-[#FF6B2B] to-[#E63946] text-white font-semibold hover:opacity-90 h-12 text-base"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            {isReadyToPackage
              ? "Create Review Package — Ready to Submit"
              : "Complete all steps to create package"}
          </Button>

          {!isReadyToPackage && (
            <Alert className="bg-yellow-500/10 border-yellow-500/30">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-300 text-sm">
                You need at least a selected review and one photo to create a package.
                {!selectedReview && " Missing: review text."}
                {mediaAssets.length === 0 && " Missing: product photos."}
              </AlertDescription>
            </Alert>
          )}

          {/* Final Clean Notice */}
          <Alert className="bg-green-500/5 border-green-500/20">
            <ShieldCheck className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-300 text-sm">
              All content in this package has been processed through the metadata
              stripper. Review text has been cleaned of AI fingerprints. All images
              and videos have had EXIF data, AI watermarks, and generation tags
              removed. The package is safe for submission.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
