// ============================================================
// PRODUCT PHOTO FINDER
// Searches for product images from Amazon, Reddit, YouTube,
// and web. Allows user to select which photos to include.
// ============================================================
import React, { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Search, Image as ImageIcon, Check, X, Upload, Loader2,
  RefreshCw, CheckCircle2, Download, ExternalLink,
} from "lucide-react";
import {
  searchProductPhotos, togglePhotoSelection, selectAllPhotos,
  deselectAllPhotos, getSelectedPhotos, addUserPhoto,
  getSourceIcon, getSourceLabel,
  type ProductPhoto, type PhotoSearchResult,
} from "@/services/productPhotoService";
import type { VineItem, ReviewPhoto } from "@/stores/vineReviewStore";

interface ProductPhotoFinderProps {
  item: VineItem;
  onPhotosSelected: (photos: ReviewPhoto[]) => void;
  onClose: () => void;
}

export default function ProductPhotoFinder({ item, onPhotosSelected, onClose }: ProductPhotoFinderProps) {
  const [photos, setPhotos] = useState<ProductPhoto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [sources, setSources] = useState({
    amazon: true,
    reddit: true,
    youtube: true,
    web: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Search for photos ────────────────────────────────────
  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    setSearchProgress(10);
    try {
      setSearchProgress(30);
      const result = await searchProductPhotos(item.productName, item.asin, {
        maxResults: 8,
        includeAmazon: sources.amazon,
        includeReddit: sources.reddit,
        includeYouTube: sources.youtube,
        includeWeb: sources.web,
      });
      setSearchProgress(80);
      setPhotos(result.photos);
      setSearchProgress(100);
      setSearchDone(true);
    } catch (err) {
      console.error("Photo search failed:", err);
    } finally {
      setIsSearching(false);
    }
  }, [item, sources]);

  // ─── Toggle photo selection ───────────────────────────────
  const handleToggle = useCallback((photoId: string) => {
    setPhotos((prev) => togglePhotoSelection(prev, photoId));
  }, []);

  // ─── Select/deselect all ──────────────────────────────────
  const handleSelectAll = useCallback(() => {
    setPhotos((prev) => selectAllPhotos(prev));
  }, []);

  const handleDeselectAll = useCallback(() => {
    setPhotos((prev) => deselectAllPhotos(prev));
  }, []);

  // ─── Upload user photo ────────────────────────────────────
  const handleUserUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const photo = await addUserPhoto(file);
      setPhotos((prev) => [...prev, photo]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // ─── Confirm selection ────────────────────────────────────
  const handleConfirm = useCallback(() => {
    const selected = getSelectedPhotos(photos);
    const reviewPhotos: ReviewPhoto[] = selected.map((p) => ({
      id: p.id,
      url: p.url,
      caption: p.caption,
      type: p.source === "user" ? "in-use" : "product",
      isSelected: true,
    }));
    onPhotosSelected(reviewPhotos);
  }, [photos, onPhotosSelected]);

  const selectedCount = photos.filter((p) => p.isSelected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-3xl max-h-[85vh] overflow-y-auto glass-card border-white/10">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ImageIcon size={18} className="text-primary" />
              Product Photo Finder
            </CardTitle>
            <CardDescription>
              Find product images from Amazon, Reddit, YouTube, and the web for "{item.productName}"
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Source toggles */}
          <div className="flex flex-wrap gap-3">
            {(Object.keys(sources) as Array<keyof typeof sources>).map((src) => (
              <label key={src} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={sources[src]}
                  onCheckedChange={(checked) => setSources((prev) => ({ ...prev, [src]: !!checked }))}
                />
                <span className="capitalize">{src}</span>
              </label>
            ))}
          </div>

          {/* Search button */}
          <div className="flex items-center gap-2">
            <Button onClick={handleSearch} disabled={isSearching} className="gap-1">
              {isSearching ? (
                <><Loader2 size={14} className="animate-spin" /> Searching...</>
              ) : searchDone ? (
                <><RefreshCw size={14} /> Search Again</>
              ) : (
                <><Search size={14} /> Find Product Photos</>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1"
            >
              <Upload size={14} /> Upload Your Own
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleUserUpload}
              className="hidden"
            />
          </div>

          {/* Progress bar */}
          {isSearching && (
            <Progress value={searchProgress} className="h-1" />
          )}

          {/* Photo grid */}
          {photos.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Found {photos.length} photos · {selectedCount} selected (max 10)
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleSelectAll} className="h-7 text-xs">
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDeselectAll} className="h-7 text-xs">
                    Deselect All
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {photos.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => handleToggle(photo.id)}
                    className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all group ${
                      photo.isSelected
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    {/* Image or placeholder */}
                    {photo.url.startsWith("data:") ? (
                      <img
                        src={photo.url}
                        alt={photo.caption}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-accent/40 to-accent/20 flex items-center justify-center">
                        <ImageIcon size={24} className="text-muted-foreground" />
                      </div>
                    )}

                    {/* Source badge */}
                    <div className="absolute top-1 left-1">
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                        {getSourceIcon(photo.source)} {getSourceLabel(photo.source)}
                      </Badge>
                    </div>

                    {/* Selection indicator */}
                    {photo.isSelected && (
                      <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                        <Check size={12} className="text-white" />
                      </div>
                    )}

                    {/* Caption */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
                      <p className="text-[10px] text-white truncate">{photo.caption}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Empty state */}
          {!isSearching && !searchDone && photos.length === 0 && (
            <div className="text-center py-8 rounded-lg border border-dashed border-white/10">
              <Search size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Click "Find Product Photos" to search for images of this product
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Or upload your own photos using the upload button
              </p>
            </div>
          )}

          {/* Confirm button */}
          {photos.length > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
              <Button onClick={handleConfirm} disabled={selectedCount === 0} className="gap-1">
                <CheckCircle2 size={14} />
                Use {selectedCount} Selected Photo{selectedCount !== 1 ? "s" : ""}
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
