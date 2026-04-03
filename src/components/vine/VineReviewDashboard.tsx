// ============================================================
// VINE REVIEW AUTO-GENERATOR — MAIN DASHBOARD
// Priority 1 feature: CSV import, review queue, generation,
// avatar selection, video creation, export
// ============================================================
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Upload, FileText, Star, Clock, AlertTriangle, CheckCircle2,
  Zap, Trash2, Edit3, Copy, Download, Play, Pause, SkipForward,
  Camera, Video, User, Plus, Search, RefreshCw, Package,
  BarChart2, Calendar, ArrowRight, Loader2, X, Eye,
} from "lucide-react";
import {
  getVineItems, addVineItem, updateVineItem, deleteVineItem,
  importFromCSV, parseCSVText, getPendingQueue, getItemStats,
  getDaysUntilDeadline, getDeadlineColor, getDeadlineBadgeVariant,
  getAvatars, addCustomAvatar, deleteAvatar,
  type VineItem, type GeneratedReview, type AvatarProfile, type ReviewPhoto,
} from "@/stores/vineReviewStore";
import {
  generateReview, scrapeProductReviews, calculateStarRating,
  generateVideoScript, type GeneratedReviewData,
} from "@/services/openRouterService";
import {
  parseScriptToScenes, renderVideoPreview,
  type VideoConfig, type VideoScene,
} from "@/services/videoService";

// ─── SUB-COMPONENTS ─────────────────────────────────────────

function StatsBar() {
  const stats = getItemStats();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {[
        { label: "Total", value: stats.total, icon: Package, color: "text-blue-400" },
        { label: "Pending", value: stats.pending, icon: Clock, color: "text-yellow-400" },
        { label: "Generating", value: stats.generating, icon: Loader2, color: "text-purple-400" },
        { label: "Generated", value: stats.generated, icon: CheckCircle2, color: "text-green-400" },
        { label: "Edited", value: stats.edited, icon: Edit3, color: "text-cyan-400" },
        { label: "Submitted", value: stats.submitted, icon: Zap, color: "text-emerald-400" },
        { label: "Overdue", value: stats.overdue, icon: AlertTriangle, color: "text-red-400" },
      ].map(({ label, value, icon: Icon, color }) => (
        <Card key={label} className="glass-card steel-border">
          <CardContent className="p-3 flex items-center gap-2">
            <Icon className={`h-4 w-4 ${color}`} />
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-bold">{value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────
export default function VineReviewDashboard() {
  const [items, setItems] = useState<VineItem[]>([]);
  const [activeTab, setActiveTab] = useState("queue");
  const [selectedItem, setSelectedItem] = useState<VineItem | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add item form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    productName: "", asin: "", category: "electronics",
    orderDate: new Date().toISOString().split("T")[0],
    reviewDeadline: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    etv: "",
  });

  // CSV import
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [csvText, setCsvText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Avatar
  const [avatars, setAvatars] = useState<AvatarProfile[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<string>("avatar-reese");
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [avatarForm, setAvatarForm] = useState({ name: "", gender: "female" as const });

  // Video preview
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoScenes, setVideoScenes] = useState<VideoScene[]>([]);
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Review editor
  const [editingReview, setEditingReview] = useState<GeneratedReview | null>(null);
  const [editForm, setEditForm] = useState({ title: "", body: "", rating: 5 });

  const refresh = useCallback(() => {
    setItems(getVineItems());
    setAvatars(getAvatars());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // ─── CSV IMPORT ─────────────────────────────────────────
  const handleCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleCSVImport = () => {
    if (!csvText.trim()) return;
    const rows = parseCSVText(csvText);
    if (rows.length === 0) {
      setError("No valid rows found in CSV. Ensure headers include: productName, asin, category, orderDate, reviewDeadline");
      return;
    }
    const imported = importFromCSV(rows);
    setSuccess(`Imported ${imported.length} Vine items successfully!`);
    setCsvText("");
    setShowCSVImport(false);
    refresh();
  };

  // ─── ADD ITEM ───────────────────────────────────────────
  const handleAddItem = () => {
    if (!addForm.productName.trim()) return;
    addVineItem({
      productName: addForm.productName,
      asin: addForm.asin,
      category: addForm.category,
      orderDate: new Date(addForm.orderDate).toISOString(),
      reviewDeadline: new Date(addForm.reviewDeadline).toISOString(),
      etv: parseFloat(addForm.etv) || 0,
      imageUrl: "",
    });
    setAddForm({
      productName: "", asin: "", category: "electronics",
      orderDate: new Date().toISOString().split("T")[0],
      reviewDeadline: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      etv: "",
    });
    setShowAddForm(false);
    setSuccess("Item added to queue!");
    refresh();
  };

  // ─── GENERATE REVIEW ───────────────────────────────────
  const handleGenerateReview = async (item: VineItem) => {
    setIsGenerating(true);
    setError(null);
    try {
      // Step 1: Research product
      updateVineItem(item.id, { status: "generating" });
      refresh();

      const scraped = await scrapeProductReviews(item.productName, item.asin);

      // Step 2: Calculate star rating
      const ratingAnalysis = calculateStarRating(scraped.reviews);

      // Step 3: Generate review text
      const context = scraped.reviews.map((r) => `[${r.source}] ${r.rating}★: ${r.text}`).join("\n");
      const reviewData = await generateReview(item.productName, item.asin, item.category, context);

      // Step 4: Generate video script
      const videoScript = await generateVideoScript(
        item.productName, reviewData.body, reviewData.rating, reviewData.pros, reviewData.cons
      );

      // Step 5: Generate placeholder photos
      const photos: ReviewPhoto[] = [
        { id: `photo-${Date.now()}-1`, url: "", caption: "Product front view", type: "product", isSelected: true },
        { id: `photo-${Date.now()}-2`, url: "", caption: "Product in use", type: "in-use", isSelected: true },
        { id: `photo-${Date.now()}-3`, url: "", caption: "Product detail", type: "detail", isSelected: true },
        { id: `photo-${Date.now()}-4`, url: "", caption: "Unboxing shot", type: "unboxing", isSelected: false },
        { id: `photo-${Date.now()}-5`, url: "", caption: "Lifestyle shot", type: "lifestyle", isSelected: false },
      ];

      const generatedReview: GeneratedReview = {
        id: `review-${Date.now()}`,
        vineItemId: item.id,
        title: reviewData.title,
        body: reviewData.body,
        rating: ratingAnalysis.calculatedRating as any,
        ratingJustification: reviewData.ratingJustification,
        pros: reviewData.pros,
        cons: reviewData.cons,
        photos,
        videoUrl: null,
        videoScript,
        avatarId: selectedAvatar,
        ftcDisclosure: "I received this product free through Amazon Vine and am providing my honest opinion.",
        isEdited: false,
        createdAt: new Date().toISOString(),
        editedAt: null,
      };

      updateVineItem(item.id, {
        status: "generated",
        generatedReview,
        scrapedData: {
          amazonReviews: scraped.reviews,
          redditMentions: [],
          averageRating: scraped.averageRating,
          totalReviews: scraped.reviews.length,
          commonPros: scraped.commonPros,
          commonCons: scraped.commonCons,
          sentimentScore: ratingAnalysis.sentimentScore,
          scrapedAt: new Date().toISOString(),
        },
      });

      setSuccess(`Review generated for "${item.productName}"!`);
      refresh();
    } catch (err: any) {
      setError(`Failed to generate review: ${err.message}`);
      updateVineItem(item.id, { status: "pending" });
      refresh();
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── BULK GENERATE ─────────────────────────────────────
  const handleBulkGenerate = async () => {
    const pending = getPendingQueue();
    if (pending.length === 0) {
      setError("No pending items to generate.");
      return;
    }
    setIsBulkGenerating(true);
    setBulkProgress(0);
    for (let i = 0; i < pending.length; i++) {
      await handleGenerateReview(pending[i]);
      setBulkProgress(((i + 1) / pending.length) * 100);
    }
    setIsBulkGenerating(false);
    setSuccess(`Generated reviews for ${pending.length} items!`);
  };

  // ─── EDIT REVIEW ────────────────────────────────────────
  const startEditing = (item: VineItem) => {
    if (!item.generatedReview) return;
    setEditingReview(item.generatedReview);
    setEditForm({
      title: item.generatedReview.title,
      body: item.generatedReview.body,
      rating: item.generatedReview.rating,
    });
  };

  const saveEdit = () => {
    if (!editingReview) return;
    const item = items.find((i) => i.id === editingReview.vineItemId);
    if (!item) return;
    updateVineItem(item.id, {
      status: "edited",
      generatedReview: {
        ...editingReview,
        title: editForm.title,
        body: editForm.body,
        rating: editForm.rating as any,
        isEdited: true,
        editedAt: new Date().toISOString(),
      },
    });
    setEditingReview(null);
    setSuccess("Review updated!");
    refresh();
  };

  // ─── COPY TO CLIPBOARD ─────────────────────────────────
  const copyReview = (item: VineItem) => {
    if (!item.generatedReview) return;
    const r = item.generatedReview;
    const text = `${r.title}\n\n${r.body}\n\n${r.ftcDisclosure}`;
    navigator.clipboard.writeText(text);
    setSuccess("Review copied to clipboard — ready to paste into Amazon!");
  };

  // ─── AVATAR UPLOAD ─────────────────────────────────────
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      addCustomAvatar(avatarForm.name || "Custom Avatar", url, avatarForm.gender);
      setShowAvatarUpload(false);
      refresh();
    };
    reader.readAsDataURL(file);
  };

  // ─── VIDEO PREVIEW ─────────────────────────────────────
  const previewVideo = (item: VineItem) => {
    if (!item.generatedReview?.videoScript || !canvasRef.current) return;
    const scenes = parseScriptToScenes(item.generatedReview.videoScript, [item.imageUrl]);
    setVideoScenes(scenes);
    setCurrentScene(0);
    const avatar = avatars.find((a) => a.id === item.generatedReview?.avatarId);
    renderVideoPreview(canvasRef.current, {
      productName: item.productName,
      rating: item.generatedReview.rating,
      script: item.generatedReview.videoScript,
      productImages: [item.imageUrl],
      avatarImage: avatar?.imageUrl || "",
      duration: 30,
      width: 640,
      height: 360,
    }, scenes, 0);
  };

  // ─── RENDER ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold gradient-steel-text">Vine Review Auto-Generator</h2>
          <p className="text-sm text-muted-foreground">
            Import Vine orders, auto-generate authentic reviews, and manage your review queue
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setShowCSVImport(true)}>
            <Upload className="h-4 w-4 mr-1" /> Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Item
          </Button>
          <Button
            size="sm"
            className="gradient-steel"
            onClick={handleBulkGenerate}
            disabled={isBulkGenerating || isGenerating}
          >
            {isBulkGenerating ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating...</>
            ) : (
              <><Zap className="h-4 w-4 mr-1" /> Generate All Pending</>
            )}
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex justify-between items-center">
            {error}
            <Button variant="ghost" size="sm" onClick={() => setError(null)}><X className="h-3 w-3" /></Button>
          </AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="flex justify-between items-center text-green-400">
            {success}
            <Button variant="ghost" size="sm" onClick={() => setSuccess(null)}><X className="h-3 w-3" /></Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Bulk progress */}
      {isBulkGenerating && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Generating reviews...</span>
            <span>{Math.round(bulkProgress)}%</span>
          </div>
          <Progress value={bulkProgress} className="h-2" />
        </div>
      )}

      {/* Stats */}
      <StatsBar />

      {/* CSV Import Modal */}
      {showCSVImport && (
        <Card className="glass-card steel-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" /> Import Vine Orders from CSV
            </CardTitle>
            <CardDescription>
              Upload a CSV file or paste CSV data. Headers should include: productName, asin, category, orderDate, reviewDeadline, etv
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Upload CSV File</Label>
              <Input type="file" accept=".csv,.txt" onChange={handleCSVFile} ref={fileInputRef} />
            </div>
            <div>
              <Label>Or Paste CSV Data</Label>
              <Textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={`productName,asin,category,orderDate,reviewDeadline,etv\nWireless Mouse,B0EXAMPLE1,electronics,2026-03-01,2026-04-15,29.99\nBluetooth Speaker,B0EXAMPLE2,electronics,2026-03-05,2026-04-20,49.99`}
                rows={8}
                className="font-mono text-xs"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCSVImport} className="gradient-steel">
                <Upload className="h-4 w-4 mr-1" /> Import
              </Button>
              <Button variant="outline" onClick={() => { setShowCSVImport(false); setCsvText(""); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Item Form */}
      {showAddForm && (
        <Card className="glass-card steel-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" /> Add Vine Item
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Product Name *</Label>
                <Input
                  value={addForm.productName}
                  onChange={(e) => setAddForm({ ...addForm, productName: e.target.value })}
                  placeholder="e.g., Wireless Bluetooth Earbuds"
                />
              </div>
              <div>
                <Label>ASIN</Label>
                <Input
                  value={addForm.asin}
                  onChange={(e) => setAddForm({ ...addForm, asin: e.target.value })}
                  placeholder="e.g., B0EXAMPLE1"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={addForm.category} onValueChange={(v) => setAddForm({ ...addForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["electronics","beauty","home","kitchen","clothing","health","sports","toys","automotive","books","food","pet","office","garden","tools","other"].map((c) => (
                      <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ETV ($)</Label>
                <Input
                  type="number"
                  value={addForm.etv}
                  onChange={(e) => setAddForm({ ...addForm, etv: e.target.value })}
                  placeholder="29.99"
                />
              </div>
              <div>
                <Label>Order Date</Label>
                <Input
                  type="date"
                  value={addForm.orderDate}
                  onChange={(e) => setAddForm({ ...addForm, orderDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Review Deadline</Label>
                <Input
                  type="date"
                  value={addForm.reviewDeadline}
                  onChange={(e) => setAddForm({ ...addForm, reviewDeadline: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddItem} className="gradient-steel">
                <Plus className="h-4 w-4 mr-1" /> Add to Queue
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="glass-card">
          <TabsTrigger value="queue">
            <Clock className="h-4 w-4 mr-1" /> Review Queue
          </TabsTrigger>
          <TabsTrigger value="generated">
            <CheckCircle2 className="h-4 w-4 mr-1" /> Generated
          </TabsTrigger>
          <TabsTrigger value="avatars">
            <User className="h-4 w-4 mr-1" /> Avatars
          </TabsTrigger>
          <TabsTrigger value="video">
            <Video className="h-4 w-4 mr-1" /> Video Preview
          </TabsTrigger>
        </TabsList>

        {/* ─── REVIEW QUEUE TAB ──────────────────────────── */}
        <TabsContent value="queue" className="space-y-4">
          {items.filter((i) => ["pending", "overdue", "generating"].includes(i.status)).length === 0 ? (
            <Card className="glass-card steel-border">
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No pending reviews</p>
                <p className="text-sm text-muted-foreground mb-4">Import Vine orders or add items manually to get started.</p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => setShowCSVImport(true)}>
                    <Upload className="h-4 w-4 mr-1" /> Import CSV
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Add Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {items
                .filter((i) => ["pending", "overdue", "generating"].includes(i.status))
                .sort((a, b) => new Date(a.reviewDeadline).getTime() - new Date(b.reviewDeadline).getTime())
                .map((item) => (
                  <Card key={item.id} className="glass-card steel-border">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{item.productName}</h3>
                            <Badge variant={getDeadlineBadgeVariant(item.reviewDeadline)}>
                              {item.status === "overdue" ? "OVERDUE" : item.status === "generating" ? "Generating..." : `${getDaysUntilDeadline(item.reviewDeadline)}d left`}
                            </Badge>
                          </div>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            {item.asin && <span>ASIN: {item.asin}</span>}
                            <span>Category: {item.category}</span>
                            {item.etv > 0 && <span>ETV: ${item.etv.toFixed(2)}</span>}
                            <span className={getDeadlineColor(item.reviewDeadline)}>
                              Due: {new Date(item.reviewDeadline).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="gradient-steel"
                            onClick={() => handleGenerateReview(item)}
                            disabled={isGenerating || item.status === "generating"}
                          >
                            {item.status === "generating" ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <><Zap className="h-4 w-4 mr-1" /> Generate</>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { deleteVineItem(item.id); refresh(); }}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        {/* ─── GENERATED REVIEWS TAB ─────────────────────── */}
        <TabsContent value="generated" className="space-y-4">
          {items.filter((i) => ["generated", "edited", "submitted"].includes(i.status)).length === 0 ? (
            <Card className="glass-card steel-border">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No generated reviews yet</p>
                <p className="text-sm text-muted-foreground">Generate reviews from the queue tab to see them here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {items
                .filter((i) => ["generated", "edited", "submitted"].includes(i.status))
                .map((item) => (
                  <Card key={item.id} className="glass-card steel-border">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{item.productName}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant={item.status === "submitted" ? "default" : "secondary"}>
                            {item.status}
                          </Badge>
                          {item.generatedReview && (
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < Math.floor(item.generatedReview!.rating)
                                      ? "fill-yellow-400 text-yellow-400"
                                      : i < item.generatedReview!.rating
                                      ? "fill-yellow-400/50 text-yellow-400"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              ))}
                              <span className="text-sm ml-1">{item.generatedReview.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    {item.generatedReview && (
                      <CardContent className="space-y-3">
                        {/* Review Title */}
                        <h4 className="font-medium text-sm">{item.generatedReview.title}</h4>

                        {/* Review Body (truncated) */}
                        <p className="text-sm text-muted-foreground line-clamp-4">
                          {item.generatedReview.body}
                        </p>

                        {/* Pros & Cons */}
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="font-medium text-green-400 mb-1">Pros</p>
                            <ul className="space-y-1">
                              {item.generatedReview.pros.map((p, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-green-400 mt-0.5 shrink-0" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="font-medium text-red-400 mb-1">Cons</p>
                            <ul className="space-y-1">
                              {item.generatedReview.cons.map((c, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <AlertTriangle className="h-3 w-3 text-red-400 mt-0.5 shrink-0" />
                                  <span>{c}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* FTC Disclosure */}
                        <p className="text-xs italic text-muted-foreground border-t border-border/50 pt-2">
                          {item.generatedReview.ftcDisclosure}
                        </p>

                        {/* Actions */}
                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => copyReview(item)}>
                            <Copy className="h-3 w-3 mr-1" /> Copy for Amazon
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => startEditing(item)}>
                            <Edit3 className="h-3 w-3 mr-1" /> Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { previewVideo(item); setActiveTab("video"); }}>
                            <Video className="h-3 w-3 mr-1" /> Video
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              updateVineItem(item.id, { status: "submitted" });
                              refresh();
                            }}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Submitted
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        {/* ─── AVATARS TAB ───────────────────────────────── */}
        <TabsContent value="avatars" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Avatar Profiles</h3>
            <Button size="sm" variant="outline" onClick={() => setShowAvatarUpload(true)}>
              <Plus className="h-4 w-4 mr-1" /> Upload Avatar
            </Button>
          </div>

          {showAvatarUpload && (
            <Card className="glass-card steel-border">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Avatar Name</Label>
                    <Input
                      value={avatarForm.name}
                      onChange={(e) => setAvatarForm({ ...avatarForm, name: e.target.value })}
                      placeholder="My Avatar"
                    />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select
                      value={avatarForm.gender}
                      onValueChange={(v: any) => setAvatarForm({ ...avatarForm, gender: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Upload Photo</Label>
                  <Input type="file" accept="image/*" onChange={handleAvatarUpload} />
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowAvatarUpload(false)}>Cancel</Button>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {avatars.map((avatar) => (
              <Card
                key={avatar.id}
                className={`glass-card steel-border cursor-pointer transition-all ${
                  selectedAvatar === avatar.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedAvatar(avatar.id)}
              >
                <CardContent className="p-4 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-2 overflow-hidden">
                    {avatar.imageUrl && !avatar.imageUrl.startsWith("/avatars/") ? (
                      <img src={avatar.imageUrl} alt={avatar.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm font-medium">{avatar.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{avatar.gender} · {avatar.type}</p>
                  {selectedAvatar === avatar.id && (
                    <Badge className="mt-1" variant="default">Selected</Badge>
                  )}
                  {avatar.type === "custom" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-1"
                      onClick={(e) => { e.stopPropagation(); deleteAvatar(avatar.id); refresh(); }}
                    >
                      <Trash2 className="h-3 w-3 text-red-400" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ─── VIDEO PREVIEW TAB ─────────────────────────── */}
        <TabsContent value="video" className="space-y-4">
          <Card className="glass-card steel-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" /> Video Review Preview
              </CardTitle>
              <CardDescription>
                Preview the auto-generated video review. Select a generated review to preview its video.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={360}
                  className="rounded-lg border border-border/50 bg-black max-w-full"
                />
              </div>
              {videoScenes.length > 0 && (
                <div className="flex items-center justify-center gap-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const prev = Math.max(0, currentScene - 1);
                      setCurrentScene(prev);
                      if (canvasRef.current) {
                        const item = items.find((i) => i.generatedReview?.videoScript);
                        if (item?.generatedReview) {
                          const avatar = avatars.find((a) => a.id === item.generatedReview?.avatarId);
                          renderVideoPreview(canvasRef.current, {
                            productName: item.productName,
                            rating: item.generatedReview.rating,
                            script: item.generatedReview.videoScript || "",
                            productImages: [item.imageUrl],
                            avatarImage: avatar?.imageUrl || "",
                            duration: 30, width: 640, height: 360,
                          }, videoScenes, prev);
                        }
                      }
                    }}
                    disabled={currentScene === 0}
                  >
                    <SkipForward className="h-4 w-4 rotate-180" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Scene {currentScene + 1} / {videoScenes.length}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const next = Math.min(videoScenes.length - 1, currentScene + 1);
                      setCurrentScene(next);
                      if (canvasRef.current) {
                        const item = items.find((i) => i.generatedReview?.videoScript);
                        if (item?.generatedReview) {
                          const avatar = avatars.find((a) => a.id === item.generatedReview?.avatarId);
                          renderVideoPreview(canvasRef.current, {
                            productName: item.productName,
                            rating: item.generatedReview.rating,
                            script: item.generatedReview.videoScript || "",
                            productImages: [item.imageUrl],
                            avatarImage: avatar?.imageUrl || "",
                            duration: 30, width: 640, height: 360,
                          }, videoScenes, next);
                        }
                      }
                    }}
                    disabled={currentScene >= videoScenes.length - 1}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {videoScenes.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  Generate a review first, then click "Video" on a generated review to preview it here.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── REVIEW EDITOR MODAL ───────────────────────────── */}
      {editingReview && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="glass-card steel-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Edit Review</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setEditingReview(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Rating</Label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <Star
                      key={r}
                      className={`h-6 w-6 cursor-pointer ${
                        r <= editForm.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                      }`}
                      onClick={() => setEditForm({ ...editForm, rating: r })}
                    />
                  ))}
                  <span className="text-sm ml-2">{editForm.rating} stars</span>
                </div>
              </div>
              <div>
                <Label>Review Body</Label>
                <Textarea
                  value={editForm.body}
                  onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                  rows={12}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveEdit} className="gradient-steel">
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditingReview(null)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attribution footer */}
      <p className="text-xs text-center text-muted-foreground/50 mt-8">
        Review generation powered by free and open-source APIs · Star ratings calculated algorithmically
      </p>
    </div>
  );
}
