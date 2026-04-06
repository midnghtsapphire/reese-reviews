// ============================================================
// SCHEMA VALIDATOR — Preview and validate Schema.org JSON-LD
// ============================================================

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckCircle2, XCircle, ExternalLink, Code, Copy, AlertTriangle,
} from "lucide-react";
import { getApprovedReviews, type ReviewData } from "@/lib/reviewStore";
import {
  generateReviewSchema,
  generateProductSchema,
  generateBreadcrumbSchema,
  getReviewBreadcrumbs,
  generateOrganizationSchema,
  generateWebSiteSchema,
  serializeJsonLd,
} from "@/services/schemaOrgService";

interface ValidationResult {
  field: string;
  status: "pass" | "warn" | "fail";
  message: string;
}

export default function SchemaValidator() {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [selectedReviewId, setSelectedReviewId] = useState("");
  const [schemaType, setSchemaType] = useState<"review" | "product" | "breadcrumb" | "organization" | "website">("review");
  const [jsonPreview, setJsonPreview] = useState("");
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);

  useEffect(() => {
    setReviews(getApprovedReviews());
  }, []);

  const selectedReview = reviews.find((r) => r.id === selectedReviewId);

  const handleGenerate = () => {
    if (!selectedReview && (schemaType === "review" || schemaType === "product" || schemaType === "breadcrumb")) {
      return;
    }

    let schema: object;
    switch (schemaType) {
      case "review":
        schema = generateReviewSchema(selectedReview!);
        break;
      case "product":
        schema = generateProductSchema(selectedReview!);
        break;
      case "breadcrumb":
        schema = generateBreadcrumbSchema(getReviewBreadcrumbs(selectedReview!));
        break;
      case "organization":
        schema = generateOrganizationSchema();
        break;
      case "website":
        schema = generateWebSiteSchema();
        break;
    }

    const json = serializeJsonLd(schema);
    setJsonPreview(JSON.stringify(JSON.parse(json), null, 2));
    setValidationResults(validateSchema(schema, schemaType));
  };

  const validateSchema = (schema: object, type: string): ValidationResult[] => {
    const results: ValidationResult[] = [];
    const s = schema as Record<string, unknown>;

    // Common checks
    if (s["@context"] === "https://schema.org") {
      results.push({ field: "@context", status: "pass", message: "Valid Schema.org context" });
    } else {
      results.push({ field: "@context", status: "fail", message: "Missing or invalid @context" });
    }

    if (s["@type"]) {
      results.push({ field: "@type", status: "pass", message: `Type: ${s["@type"]}` });
    } else {
      results.push({ field: "@type", status: "fail", message: "Missing @type" });
    }

    // Type-specific validation
    if (type === "review") {
      if (s.name) results.push({ field: "name", status: "pass", message: `Review name: "${(s.name as string).slice(0, 50)}"` });
      else results.push({ field: "name", status: "fail", message: "Missing review name" });

      if (s.reviewBody) results.push({ field: "reviewBody", status: "pass", message: "Review body present" });
      else results.push({ field: "reviewBody", status: "warn", message: "Missing reviewBody — recommended for rich results" });

      if (s.reviewRating) results.push({ field: "reviewRating", status: "pass", message: "Rating present" });
      else results.push({ field: "reviewRating", status: "fail", message: "Missing reviewRating — required for rich results" });

      if (s.author) results.push({ field: "author", status: "pass", message: "Author present" });
      else results.push({ field: "author", status: "fail", message: "Missing author" });

      if (s.datePublished) results.push({ field: "datePublished", status: "pass", message: "Date published present" });
      else results.push({ field: "datePublished", status: "warn", message: "Missing datePublished" });

      if (s.publisher) results.push({ field: "publisher", status: "pass", message: "Publisher present" });
      else results.push({ field: "publisher", status: "warn", message: "Missing publisher" });

      if (s.image) results.push({ field: "image", status: "pass", message: "Image present" });
      else results.push({ field: "image", status: "warn", message: "Missing image — recommended for rich results" });

      if (s.positiveNotes) results.push({ field: "positiveNotes", status: "pass", message: "Pros listed" });
      if (s.negativeNotes) results.push({ field: "negativeNotes", status: "pass", message: "Cons listed" });
    }

    if (type === "product") {
      if (s.name) results.push({ field: "name", status: "pass", message: `Product: "${(s.name as string).slice(0, 50)}"` });
      else results.push({ field: "name", status: "fail", message: "Missing product name" });

      if (s.aggregateRating) results.push({ field: "aggregateRating", status: "pass", message: "Aggregate rating present" });
      else results.push({ field: "aggregateRating", status: "warn", message: "Missing aggregateRating" });

      if (s.offers) results.push({ field: "offers", status: "pass", message: "Price/offer present" });
      else results.push({ field: "offers", status: "warn", message: "Missing offers — recommended for product rich results" });

      if (s.brand) results.push({ field: "brand", status: "pass", message: "Brand present" });
      else results.push({ field: "brand", status: "warn", message: "Missing brand" });

      if (s.image) results.push({ field: "image", status: "pass", message: "Product image present" });
      else results.push({ field: "image", status: "warn", message: "Missing image" });
    }

    if (type === "breadcrumb") {
      const items = (s as Record<string, unknown>).itemListElement as Array<Record<string, unknown>> | undefined;
      if (items && items.length > 0) {
        results.push({ field: "itemListElement", status: "pass", message: `${items.length} breadcrumb items` });
        items.forEach((item, idx) => {
          if (item.name && item.item) {
            results.push({ field: `item[${idx}]`, status: "pass", message: `"${item.name}" → ${item.item}` });
          }
        });
      } else {
        results.push({ field: "itemListElement", status: "fail", message: "No breadcrumb items" });
      }
    }

    if (type === "organization") {
      if (s.name) results.push({ field: "name", status: "pass", message: `Organization: "${s.name}"` });
      if (s.url) results.push({ field: "url", status: "pass", message: `URL: ${s.url}` });
      if (s.logo) results.push({ field: "logo", status: "pass", message: "Logo present" });
      else results.push({ field: "logo", status: "warn", message: "Missing logo" });
      if (s.sameAs) results.push({ field: "sameAs", status: "pass", message: "Social profiles linked" });
      if (s.contactPoint) results.push({ field: "contactPoint", status: "pass", message: "Contact point present" });
    }

    return results;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonPreview);
  };

  const passCount = validationResults.filter((r) => r.status === "pass").length;
  const warnCount = validationResults.filter((r) => r.status === "warn").length;
  const failCount = validationResults.filter((r) => r.status === "fail").length;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="glass-card border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-purple-400" />
            Schema.org JSON-LD Validator
          </CardTitle>
          <CardDescription>
            Preview and validate structured data markup for rich search results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Select value={schemaType} onValueChange={(v) => setSchemaType(v as typeof schemaType)}>
                <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="review">Review Schema</SelectItem>
                  <SelectItem value="product">Product Schema</SelectItem>
                  <SelectItem value="breadcrumb">Breadcrumb Schema</SelectItem>
                  <SelectItem value="organization">Organization Schema</SelectItem>
                  <SelectItem value="website">WebSite Schema</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(schemaType === "review" || schemaType === "product" || schemaType === "breadcrumb") && (
              <div>
                <Select value={selectedReviewId} onValueChange={setSelectedReviewId}>
                  <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                    <SelectValue placeholder="Select a review..." />
                  </SelectTrigger>
                  <SelectContent>
                    {reviews.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.title} ({r.rating}/5)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Button onClick={handleGenerate} className="w-full gradient-steel">
                Generate & Validate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationResults.length > 0 && (
        <Card className="glass-card border-purple-500/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Validation Results</CardTitle>
              <div className="flex gap-2">
                <Badge className="bg-green-600">{passCount} Pass</Badge>
                {warnCount > 0 && <Badge className="bg-yellow-600">{warnCount} Warn</Badge>}
                {failCount > 0 && <Badge className="bg-red-600">{failCount} Fail</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {validationResults.map((result, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 rounded bg-slate-800/50">
                {result.status === "pass" && <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />}
                {result.status === "warn" && <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0" />}
                {result.status === "fail" && <XCircle className="h-4 w-4 text-red-400 shrink-0" />}
                <span className="text-xs font-mono text-purple-300 w-32 shrink-0">{result.field}</span>
                <span className={`text-sm ${
                  result.status === "pass" ? "text-gray-300" :
                  result.status === "warn" ? "text-yellow-300" :
                  "text-red-300"
                }`}>
                  {result.message}
                </span>
              </div>
            ))}

            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://search.google.com/test/rich-results"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3 w-3 mr-1" /> Google Rich Results Test
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://validator.schema.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3 w-3 mr-1" /> Schema.org Validator
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* JSON-LD Preview */}
      {jsonPreview && (
        <Card className="glass-card border-purple-500/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">JSON-LD Output</CardTitle>
              <Button size="sm" variant="ghost" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-1" /> Copy
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="p-4 rounded-lg bg-slate-900 text-green-400 text-xs overflow-auto max-h-96 font-mono">
              {`<script type="application/ld+json">\n${jsonPreview}\n</script>`}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
