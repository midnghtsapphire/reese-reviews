// ============================================================
// WIZARD STEP 5: SEO CHECK
// Auto-generate meta title, description, keywords, slug,
// and Schema.org markup for the review.
// ============================================================

import React, { useState, useCallback, useEffect } from "react";
import {
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Code2,
  Globe,
  Tag,
  FileText,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { WizardData } from "../ReviewPublishingWizard";

// ─── TYPES ──────────────────────────────────────────────────

interface Props {
  data: WizardData;
  updateData: (patch: Partial<WizardData>) => void;
}

interface SEOScore {
  score: number;
  issues: string[];
  passed: string[];
}

// ─── SEO GENERATION ─────────────────────────────────────────

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function generateMetaTitle(productName: string, rating: number): string {
  const templates = [
    `${productName} Review (${rating}/5 Stars) — Reese Reviews`,
    `${productName} — Honest Review ${rating}/5 | Reese Reviews`,
    `Is ${productName} Worth It? ${rating}-Star Review — Reese Reviews`,
  ];
  const title = templates[Math.floor(Math.random() * templates.length)];
  return title.slice(0, 60); // Google truncates at ~60 chars
}

function generateMetaDescription(
  productName: string,
  excerpt: string,
  rating: number
): string {
  const desc = `${excerpt} Rated ${rating}/5 stars. Read the full honest review of ${productName} on Reese Reviews — from box to beautiful.`;
  return desc.slice(0, 155); // Google truncates at ~155 chars
}

function generateKeywords(
  productName: string,
  category: string,
  pros: string[]
): string[] {
  const base = [
    productName.toLowerCase(),
    `${productName.toLowerCase()} review`,
    `${category} review`,
    "reese reviews",
    "honest review",
    "amazon vine review",
    `best ${category}`,
    `${productName.toLowerCase()} pros and cons`,
  ];
  const proKeywords = pros.slice(0, 3).map((p) => p.toLowerCase());
  return [...new Set([...base, ...proKeywords])].slice(0, 15);
}

function generateSchemaMarkup(data: WizardData): string {
  const review = data.review;
  const vine = data.vineItem;
  if (!review || !vine) return "{}";

  const schema = {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": "Product",
      name: vine.productName,
      image: vine.imageUrl,
      sku: vine.asin,
      brand: {
        "@type": "Brand",
        name: "See product listing",
      },
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    author: {
      "@type": "Person",
      name: "Caresse (Reese)",
      url: "https://reesereviews.com/about",
    },
    publisher: {
      "@type": "Organization",
      name: "Reese Reviews",
      url: "https://reesereviews.com",
    },
    reviewBody: review.excerpt,
    headline: review.title,
    datePublished: new Date().toISOString().split("T")[0],
    positiveNotes: {
      "@type": "ItemList",
      itemListElement: review.pros.map((pro, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: pro,
      })),
    },
    negativeNotes: {
      "@type": "ItemList",
      itemListElement: review.cons.map((con, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: con,
      })),
    },
  };

  return JSON.stringify(schema, null, 2);
}

function scoreSEO(seo: WizardData["seo"], data: WizardData): SEOScore {
  if (!seo) return { score: 0, issues: ["No SEO data generated"], passed: [] };

  const issues: string[] = [];
  const passed: string[] = [];

  // Title checks
  if (!seo.metaTitle) {
    issues.push("Missing meta title");
  } else if (seo.metaTitle.length > 60) {
    issues.push(`Meta title too long (${seo.metaTitle.length}/60 chars)`);
  } else {
    passed.push(`Meta title length OK (${seo.metaTitle.length}/60)`);
  }

  // Description checks
  if (!seo.metaDescription) {
    issues.push("Missing meta description");
  } else if (seo.metaDescription.length > 155) {
    issues.push(`Meta description too long (${seo.metaDescription.length}/155 chars)`);
  } else if (seo.metaDescription.length < 70) {
    issues.push(`Meta description too short (${seo.metaDescription.length}/155 chars)`);
  } else {
    passed.push(`Meta description length OK (${seo.metaDescription.length}/155)`);
  }

  // Keywords
  if (seo.keywords.length === 0) {
    issues.push("No keywords defined");
  } else if (seo.keywords.length < 5) {
    issues.push(`Only ${seo.keywords.length} keywords (recommend 5+)`);
  } else {
    passed.push(`${seo.keywords.length} keywords defined`);
  }

  // Slug
  if (!seo.slug) {
    issues.push("Missing URL slug");
  } else {
    passed.push("URL slug defined");
  }

  // Schema markup
  if (!seo.schemaMarkup || seo.schemaMarkup === "{}") {
    issues.push("Missing Schema.org markup");
  } else {
    passed.push("Schema.org markup generated");
  }

  // Affiliate link check
  if (data.affiliateLink) {
    passed.push("Affiliate link present");
  } else {
    issues.push("No affiliate link — consider adding one for monetization");
  }

  // OG Image
  if (seo.ogImage) {
    passed.push("Open Graph image set");
  } else {
    issues.push("No Open Graph image for social sharing");
  }

  const total = issues.length + passed.length;
  const score = total > 0 ? Math.round((passed.length / total) * 100) : 0;

  return { score, issues, passed };
}

// ─── COMPONENT ──────────────────────────────────────────────

export function WizardStepSEO({ data, updateData }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showSchema, setShowSchema] = useState(false);

  const seoScore = scoreSEO(data.seo, data);

  // Auto-generate SEO on mount if not already done
  useEffect(() => {
    if (!data.seo && data.review && data.vineItem) {
      handleGenerate();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = useCallback(async () => {
    if (!data.review || !data.vineItem) return;

    setIsGenerating(true);
    // Small delay to show loading state
    await new Promise((r) => setTimeout(r, 500));

    const metaTitle = generateMetaTitle(
      data.vineItem.productName,
      data.review.rating
    );
    const metaDescription = generateMetaDescription(
      data.vineItem.productName,
      data.review.excerpt,
      data.review.rating
    );
    const keywords = generateKeywords(
      data.vineItem.productName,
      data.vineItem.category,
      data.review.pros
    );
    const slug = generateSlug(data.review.title);
    const schemaMarkup = generateSchemaMarkup(data);

    updateData({
      seo: {
        metaTitle,
        metaDescription,
        keywords,
        slug,
        schemaMarkup,
        ogImage: data.vineItem.imageUrl,
      },
    });

    setIsGenerating(false);
  }, [data, updateData]);

  const handleUpdateSEO = useCallback(
    (field: string, value: unknown) => {
      if (!data.seo) return;
      updateData({
        seo: { ...data.seo, [field]: value },
      });
    },
    [data.seo, updateData]
  );

  const handleCopy = useCallback((field: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const handleAddKeyword = useCallback(
    (keyword: string) => {
      if (!data.seo || !keyword.trim()) return;
      handleUpdateSEO("keywords", [...data.seo.keywords, keyword.trim().toLowerCase()]);
    },
    [data.seo, handleUpdateSEO]
  );

  const handleRemoveKeyword = useCallback(
    (index: number) => {
      if (!data.seo) return;
      handleUpdateSEO(
        "keywords",
        data.seo.keywords.filter((_, i) => i !== index)
      );
    },
    [data.seo, handleUpdateSEO]
  );

  if (!data.seo) {
    return (
      <div className="text-center py-8">
        <Search className="h-10 w-10 text-amber-400 mx-auto mb-3" />
        <p className="text-gray-300 mb-4">
          Generate SEO metadata for your review
        </p>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !data.review}
          className="bg-amber-500 hover:bg-amber-600 text-black"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Search className="h-4 w-4 mr-2" />
          )}
          Generate SEO Metadata
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* SEO Score */}
      <div className="flex items-center gap-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
        <div
          className={`h-16 w-16 rounded-full flex items-center justify-center text-lg font-bold border-4 ${
            seoScore.score >= 80
              ? "border-green-500 text-green-400"
              : seoScore.score >= 50
              ? "border-amber-500 text-amber-400"
              : "border-red-500 text-red-400"
          }`}
        >
          {seoScore.score}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-200">SEO Score</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {seoScore.passed.map((p, i) => (
              <Badge
                key={i}
                variant="outline"
                className="text-[10px] text-green-400 border-green-500/30"
              >
                <CheckCircle2 className="h-2 w-2 mr-0.5" />
                {p}
              </Badge>
            ))}
            {seoScore.issues.map((issue, i) => (
              <Badge
                key={i}
                variant="outline"
                className="text-[10px] text-amber-400 border-amber-500/30"
              >
                <AlertCircle className="h-2 w-2 mr-0.5" />
                {issue}
              </Badge>
            ))}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleGenerate}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Regenerate
        </Button>
      </div>

      {/* Meta Title */}
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-xs text-gray-400 flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Meta Title
          </Label>
          <span
            className={`text-[10px] ${
              data.seo.metaTitle.length > 60 ? "text-red-400" : "text-gray-500"
            }`}
          >
            {data.seo.metaTitle.length}/60
          </span>
        </div>
        <div className="flex gap-1 mt-1">
          <Input
            value={data.seo.metaTitle}
            onChange={(e) => handleUpdateSEO("metaTitle", e.target.value)}
            className="bg-gray-800 border-gray-700 text-sm"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopy("title", data.seo!.metaTitle)}
          >
            {copiedField === "title" ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Meta Description */}
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-xs text-gray-400 flex items-center gap-1">
            <Globe className="h-3 w-3" />
            Meta Description
          </Label>
          <span
            className={`text-[10px] ${
              data.seo.metaDescription.length > 155
                ? "text-red-400"
                : "text-gray-500"
            }`}
          >
            {data.seo.metaDescription.length}/155
          </span>
        </div>
        <Textarea
          value={data.seo.metaDescription}
          onChange={(e) => handleUpdateSEO("metaDescription", e.target.value)}
          rows={2}
          className="mt-1 bg-gray-800 border-gray-700 text-sm"
        />
      </div>

      {/* URL Slug */}
      <div>
        <Label className="text-xs text-gray-400">URL Slug</Label>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs text-gray-500">reesereviews.com/reviews/</span>
          <Input
            value={data.seo.slug}
            onChange={(e) =>
              handleUpdateSEO("slug", generateSlug(e.target.value))
            }
            className="bg-gray-800 border-gray-700 text-sm font-mono"
          />
        </div>
      </div>

      {/* Keywords */}
      <div>
        <Label className="text-xs text-gray-400 flex items-center gap-1">
          <Tag className="h-3 w-3" />
          Keywords ({data.seo.keywords.length})
        </Label>
        <div className="flex flex-wrap gap-1 mt-2">
          {data.seo.keywords.map((kw, i) => (
            <Badge
              key={i}
              variant="outline"
              className="text-xs border-gray-600 text-gray-300 cursor-pointer hover:border-red-500 hover:text-red-400"
              onClick={() => handleRemoveKeyword(i)}
            >
              {kw}
              <span className="ml-1 text-gray-500">×</span>
            </Badge>
          ))}
        </div>
        <div className="flex gap-1 mt-2">
          <Input
            placeholder="Add keyword..."
            className="bg-gray-800 border-gray-700 text-xs h-7"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddKeyword((e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).value = "";
              }
            }}
          />
        </div>
      </div>

      {/* Affiliate Link */}
      <div>
        <Label className="text-xs text-gray-400">Affiliate Link</Label>
        <div className="grid grid-cols-3 gap-2 mt-1">
          <div className="col-span-2">
            <Input
              value={data.affiliateLink}
              onChange={(e) => updateData({ affiliateLink: e.target.value })}
              placeholder="https://amazon.com/dp/B0XXXXXXXXX?tag=..."
              className="bg-gray-800 border-gray-700 text-xs font-mono"
            />
          </div>
          <Input
            value={data.affiliateTag}
            onChange={(e) => updateData({ affiliateTag: e.target.value })}
            placeholder="affiliate-tag-20"
            className="bg-gray-800 border-gray-700 text-xs font-mono"
          />
        </div>
        {data.affiliateLink && !data.affiliateLink.includes("tag=") && (
          <Alert className="mt-2 border-amber-500/30 bg-amber-500/5">
            <AlertCircle className="h-3 w-3 text-amber-400" />
            <AlertDescription className="text-[10px]">
              Affiliate link is missing the tag parameter. Add ?tag={data.affiliateTag} to the URL.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Schema.org Markup */}
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-xs text-gray-400 flex items-center gap-1">
            <Code2 className="h-3 w-3" />
            Schema.org Markup (JSON-LD)
          </Label>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSchema(!showSchema)}
              className="text-xs h-6"
            >
              {showSchema ? "Hide" : "Show"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy("schema", data.seo!.schemaMarkup)}
              className="text-xs h-6"
            >
              {copiedField === "schema" ? (
                <Check className="h-3 w-3 text-green-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
        {showSchema && (
          <Textarea
            value={data.seo.schemaMarkup}
            onChange={(e) => handleUpdateSEO("schemaMarkup", e.target.value)}
            rows={12}
            className="mt-1 bg-gray-900 border-gray-700 text-xs font-mono"
          />
        )}
      </div>
    </div>
  );
}
