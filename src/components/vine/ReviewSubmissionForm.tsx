// ============================================================
// VINE REVIEW SUBMISSION FORM
// Pre-fills all Amazon review fields from auto-generated review.
// Copy to clipboard per field, edit before submit, export as zip.
// ============================================================
import React, { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Star, Copy, Check, Download, ExternalLink, Image as ImageIcon,
  Video, FileText, Package, ClipboardCopy, Edit3, Eye, AlertTriangle,
  CheckCircle2, Upload, X, Loader2,
} from "lucide-react";
import type { VineItem, GeneratedReview, ReviewPhoto } from "@/stores/vineReviewStore";

// ─── AMAZON REVIEW FIELD SPECS ──────────────────────────────
const AMAZON_REVIEW_SPECS = {
  starRating: { min: 1, max: 5, required: true, label: "Star Rating" },
  headline: { maxLength: 100, required: true, label: "Review Headline" },
  body: { minWords: 20, maxChars: 5000, required: true, label: "Review Body" },
  photos: { maxCount: 10, maxSizeMB: 20, formats: ["JPEG", "PNG", "GIF", "BMP", "TIFF"], required: false, label: "Photos" },
  video: { maxCount: 1, maxSizeMB: 500, formats: ["MP4", "MOV"], maxLengthMin: 15, required: false, label: "Video" },
};

interface ReviewSubmissionFormProps {
  item: VineItem;
  review: GeneratedReview;
  onClose: () => void;
  onSave: (updatedReview: GeneratedReview) => void;
}

export default function ReviewSubmissionForm({ item, review, onClose, onSave }: ReviewSubmissionFormProps) {
  // ─── Editable fields ──────────────────────────────────────
  const [rating, setRating] = useState<number>(review.rating);
  const [headline, setHeadline] = useState(review.title);
  const [body, setBody] = useState(review.body);
  const [selectedPhotos, setSelectedPhotos] = useState<ReviewPhoto[]>(
    review.photos.filter((p) => p.isSelected)
  );
  const [includeVideo, setIncludeVideo] = useState(!!review.videoUrl);
  const [isEditing, setIsEditing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // ─── Validation ───────────────────────────────────────────
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
  const charCount = body.length;
  const headlineValid = headline.length > 0 && headline.length <= AMAZON_REVIEW_SPECS.headline.maxLength;
  const bodyValid = wordCount >= AMAZON_REVIEW_SPECS.body.minWords && charCount <= AMAZON_REVIEW_SPECS.body.maxChars;
  const photosValid = selectedPhotos.length <= AMAZON_REVIEW_SPECS.photos.maxCount;
  const allValid = headlineValid && bodyValid && photosValid && rating >= 1 && rating <= 5;

  // ─── Copy to clipboard ───────────────────────────────────
  const copyToClipboard = useCallback(async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  }, []);

  // ─── Export as ZIP ────────────────────────────────────────
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      // Build the review package as a text manifest + photos
      const manifest = [
        `AMAZON VINE REVIEW PACKAGE`,
        `========================`,
        ``,
        `Product: ${item.productName}`,
        `ASIN: ${item.asin}`,
        `Category: ${item.category}`,
        ``,
        `── STAR RATING ──`,
        `${rating} out of 5 stars`,
        ``,
        `── HEADLINE ──`,
        headline,
        ``,
        `── REVIEW BODY ──`,
        body,
        ``,
        `── FTC DISCLOSURE ──`,
        review.ftcDisclosure,
        ``,
        `── PROS ──`,
        ...review.pros.map((p) => `• ${p}`),
        ``,
        `── CONS ──`,
        ...review.cons.map((c) => `• ${c}`),
        ``,
        `── PHOTOS (${selectedPhotos.length}/${AMAZON_REVIEW_SPECS.photos.maxCount} max) ──`,
        ...selectedPhotos.map((p, i) => `${i + 1}. ${p.caption} (${p.type})`),
        ``,
        `── VIDEO ──`,
        includeVideo && review.videoUrl ? `Included: ${review.videoUrl}` : "Not included",
        ``,
        `── METADATA ──`,
        `Generated: ${review.createdAt}`,
        `Rating Justification: ${review.ratingJustification}`,
        `Word Count: ${wordCount}`,
        `Character Count: ${charCount}`,
      ].join("\n");

      // Create a downloadable text file (zip would require JSZip library)
      const blob = new Blob([manifest], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vine-review-${item.asin}-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }, [item, review, rating, headline, body, selectedPhotos, includeVideo, wordCount, charCount]);

  // ─── Save edits ───────────────────────────────────────────
  const handleSave = useCallback(() => {
    onSave({
      ...review,
      title: headline,
      body,
      rating: rating as GeneratedReview["rating"],
      photos: review.photos.map((p) => ({
        ...p,
        isSelected: selectedPhotos.some((sp) => sp.id === p.id),
      })),
      isEdited: true,
      editedAt: new Date().toISOString(),
    });
    setIsEditing(false);
  }, [review, headline, body, rating, selectedPhotos, onSave]);

  // ─── Star rating component ───────────────────────────────
  const StarRatingInput = () => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          onClick={() => isEditing && setRating(s)}
          className={`transition-colors ${isEditing ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
          disabled={!isEditing}
        >
          <Star
            size={24}
            className={s <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-500"}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-muted-foreground">{rating} out of 5</span>
    </div>
  );

  // ─── Copy button helper ───────────────────────────────────
  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => copyToClipboard(text, field)}
      className="h-7 px-2 text-xs gap-1"
    >
      {copiedField === field ? (
        <><Check size={12} className="text-green-400" /> Copied</>
      ) : (
        <><Copy size={12} /> Copy</>
      )}
    </Button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-card border-white/10">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardCopy size={18} className="text-primary" />
              Review Submission Form
            </CardTitle>
            <CardDescription>
              Pre-filled from auto-generated review. Edit, copy fields, or export the package.
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Product info banner */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/20 border border-white/5">
            <Package size={16} className="text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.productName}</p>
              <p className="text-xs text-muted-foreground">ASIN: {item.asin} · {item.category}</p>
            </div>
            <a
              href={`https://www.amazon.com/dp/${item.asin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View on Amazon <ExternalLink size={10} />
            </a>
          </div>

          {/* Amazon requirements info */}
          <Alert className="border-blue-500/30 bg-blue-500/5">
            <AlertTriangle size={14} className="text-blue-400" />
            <AlertDescription className="text-xs">
              Amazon Vine reviews require: star rating (1-5), headline (max 100 chars),
              review body (min ~20 words), up to 10 photos (max 20MB each), and 1 optional video (MP4/MOV, max 500MB).
            </AlertDescription>
          </Alert>

          {/* Edit/Preview toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="gap-1"
            >
              {isEditing ? <><Check size={14} /> Editing</> : <><Edit3 size={14} /> Edit Fields</>}
            </Button>
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(`${headline}\n\n${body}`, "all")} className="gap-1">
              <ClipboardCopy size={14} /> Copy All Text
            </Button>
          </div>

          <Separator />

          {/* ── Field 1: Star Rating ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold flex items-center gap-1">
                <Star size={14} className="text-yellow-400" />
                {AMAZON_REVIEW_SPECS.starRating.label}
                <Badge variant="destructive" className="text-[10px] ml-1">Required</Badge>
              </Label>
              <CopyButton text={`${rating} out of 5 stars`} field="rating" />
            </div>
            <StarRatingInput />
            <p className="text-xs text-muted-foreground">
              Algorithm rating: {review.rating} — {review.ratingJustification}
            </p>
          </div>

          <Separator />

          {/* ── Field 2: Headline ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold flex items-center gap-1">
                <FileText size={14} />
                {AMAZON_REVIEW_SPECS.headline.label}
                <Badge variant="destructive" className="text-[10px] ml-1">Required</Badge>
              </Label>
              <CopyButton text={headline} field="headline" />
            </div>
            {isEditing ? (
              <Input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                maxLength={AMAZON_REVIEW_SPECS.headline.maxLength}
                className="bg-background/50"
              />
            ) : (
              <p className="text-sm p-2 rounded bg-accent/10 border border-white/5">{headline}</p>
            )}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{headlineValid ? <CheckCircle2 size={12} className="inline text-green-400" /> : <AlertTriangle size={12} className="inline text-red-400" />} {headline.length}/{AMAZON_REVIEW_SPECS.headline.maxLength} characters</span>
            </div>
          </div>

          <Separator />

          {/* ── Field 3: Review Body ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold flex items-center gap-1">
                <FileText size={14} />
                {AMAZON_REVIEW_SPECS.body.label}
                <Badge variant="destructive" className="text-[10px] ml-1">Required</Badge>
              </Label>
              <CopyButton text={body} field="body" />
            </div>
            {isEditing ? (
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                className="bg-background/50 resize-y"
              />
            ) : (
              <div className="text-sm p-3 rounded bg-accent/10 border border-white/5 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {body}
              </div>
            )}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {bodyValid ? <CheckCircle2 size={12} className="inline text-green-400" /> : <AlertTriangle size={12} className="inline text-red-400" />}
                {" "}{wordCount} words · {charCount}/{AMAZON_REVIEW_SPECS.body.maxChars} chars
              </span>
              <span>Min {AMAZON_REVIEW_SPECS.body.minWords} words recommended</span>
            </div>
          </div>

          <Separator />

          {/* ── Field 4: Pros & Cons ── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-green-400">Pros</Label>
                <CopyButton text={review.pros.join("\n")} field="pros" />
              </div>
              <ul className="text-xs space-y-1">
                {review.pros.map((p, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <CheckCircle2 size={10} className="text-green-400 mt-0.5 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
                {review.pros.length === 0 && <li className="text-muted-foreground italic">No pros listed</li>}
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-red-400">Cons</Label>
                <CopyButton text={review.cons.join("\n")} field="cons" />
              </div>
              <ul className="text-xs space-y-1">
                {review.cons.map((c, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <AlertTriangle size={10} className="text-red-400 mt-0.5 shrink-0" />
                    <span>{c}</span>
                  </li>
                ))}
                {review.cons.length === 0 && <li className="text-muted-foreground italic">No cons listed</li>}
              </ul>
            </div>
          </div>

          <Separator />

          {/* ── Field 5: Photos ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold flex items-center gap-1">
                <ImageIcon size={14} />
                {AMAZON_REVIEW_SPECS.photos.label}
                <Badge variant="outline" className="text-[10px] ml-1">Optional</Badge>
              </Label>
              <span className="text-xs text-muted-foreground">
                {selectedPhotos.length}/{AMAZON_REVIEW_SPECS.photos.maxCount} max
              </span>
            </div>
            {review.photos.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {review.photos.map((photo) => {
                  const isSelected = selectedPhotos.some((sp) => sp.id === photo.id);
                  return (
                    <button
                      key={photo.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedPhotos(selectedPhotos.filter((sp) => sp.id !== photo.id));
                        } else if (selectedPhotos.length < AMAZON_REVIEW_SPECS.photos.maxCount) {
                          setSelectedPhotos([...selectedPhotos, photo]);
                        }
                      }}
                      className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all ${
                        isSelected ? "border-primary ring-2 ring-primary/30" : "border-white/10 opacity-50 hover:opacity-80"
                      }`}
                    >
                      <div className="absolute inset-0 bg-accent/30 flex items-center justify-center">
                        <ImageIcon size={20} className="text-muted-foreground" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                        <p className="text-[9px] text-white truncate">{photo.caption}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check size={10} className="text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 rounded-lg border border-dashed border-white/10">
                <ImageIcon size={20} className="mx-auto text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">No photos generated yet. Use the Photo Finder to search for product images.</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Accepted formats: {AMAZON_REVIEW_SPECS.photos.formats.join(", ")} · Max {AMAZON_REVIEW_SPECS.photos.maxSizeMB}MB each
            </p>
          </div>

          <Separator />

          {/* ── Field 6: Video ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold flex items-center gap-1">
                <Video size={14} />
                {AMAZON_REVIEW_SPECS.video.label}
                <Badge variant="outline" className="text-[10px] ml-1">Optional</Badge>
              </Label>
              <Button
                variant={includeVideo ? "default" : "outline"}
                size="sm"
                onClick={() => setIncludeVideo(!includeVideo)}
                className="h-6 text-xs"
              >
                {includeVideo ? "Included" : "Not Included"}
              </Button>
            </div>
            {review.videoUrl ? (
              <div className={`p-2 rounded-lg border ${includeVideo ? "border-primary/30 bg-primary/5" : "border-white/5 bg-accent/5 opacity-50"}`}>
                <p className="text-xs">Video review generated ({Math.round(review.videoLengthSeconds / 60)}min)</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Max {AMAZON_REVIEW_SPECS.video.maxSizeMB}MB · Formats: {AMAZON_REVIEW_SPECS.video.formats.join(", ")}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No video generated. Generate one from the Vine dashboard.</p>
            )}
          </div>

          <Separator />

          {/* ── FTC Disclosure ── */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-1">
              <AlertTriangle size={14} className="text-amber-400" />
              FTC Disclosure
            </Label>
            <div className="flex items-center gap-2">
              <p className="text-xs p-2 rounded bg-amber-500/10 border border-amber-500/20 flex-1">
                {review.ftcDisclosure}
              </p>
              <CopyButton text={review.ftcDisclosure} field="ftc" />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Note: Amazon automatically adds a Vine disclosure badge. This is for your records.
            </p>
          </div>

          <Separator />

          {/* ── Validation Summary ── */}
          <div className="p-3 rounded-lg bg-accent/10 border border-white/5">
            <p className="text-sm font-semibold mb-2">Submission Checklist</p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="flex items-center gap-1">
                {rating >= 1 && rating <= 5 ? <CheckCircle2 size={12} className="text-green-400" /> : <AlertTriangle size={12} className="text-red-400" />}
                Star rating set
              </div>
              <div className="flex items-center gap-1">
                {headlineValid ? <CheckCircle2 size={12} className="text-green-400" /> : <AlertTriangle size={12} className="text-red-400" />}
                Headline valid
              </div>
              <div className="flex items-center gap-1">
                {bodyValid ? <CheckCircle2 size={12} className="text-green-400" /> : <AlertTriangle size={12} className="text-red-400" />}
                Body text valid
              </div>
              <div className="flex items-center gap-1">
                {photosValid ? <CheckCircle2 size={12} className="text-green-400" /> : <AlertTriangle size={12} className="text-red-400" />}
                Photos within limit
              </div>
            </div>
          </div>

          {/* ── Action buttons ── */}
          <div className="flex items-center gap-2 pt-2">
            {isEditing && (
              <Button onClick={handleSave} className="gap-1" disabled={!allValid}>
                <Check size={14} /> Save Changes
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isExporting}
              className="gap-1"
            >
              {isExporting ? (
                <><Loader2 size={14} className="animate-spin" /> Exporting...</>
              ) : exportSuccess ? (
                <><CheckCircle2 size={14} className="text-green-400" /> Exported!</>
              ) : (
                <><Download size={14} /> Export Review Package</>
              )}
            </Button>
            <a
              href={`https://www.amazon.com/review/create-review?asin=${item.asin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors"
            >
              <ExternalLink size={14} /> Open Amazon Review Form
            </a>
            <Button variant="ghost" onClick={onClose} className="ml-auto">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
