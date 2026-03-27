// ============================================================
// CROSS-MARKET REVIEW SEEDER
// Lets you paste real reviews from international Amazon markets
// (UK, CA, AU, etc.) and synthesize an original review in the
// chosen reviewer's voice.
//
// Props:
//   asin            — the product ASIN
//   productName     — product display name
//   productDescription — optional product description
//   defaultVoice    — pre-select a voice ("caresse"|"reese"|"revvel")
//   onGenerated     — callback with the synthesized SeededReviewResult
//   onClose         — callback to dismiss the modal
// ============================================================

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Globe,
  X,
  Wand2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Globe2,
} from "lucide-react";
import {
  AMAZON_MARKETS,
  buildMarketUrl,
  synthesizeSeededReview,
  type MarketSeed,
  type SeededReviewResult,
} from "@/lib/crossMarketReviews";

// ─── TYPES ──────────────────────────────────────────────────

export type ReviewerVoice = "caresse" | "reese" | "revvel";

interface CrossMarketSeederProps {
  asin: string;
  productName: string;
  productDescription?: string;
  defaultVoice?: ReviewerVoice;
  onGenerated: (result: SeededReviewResult) => void;
  onClose: () => void;
}

const VOICE_OPTIONS: { value: ReviewerVoice; label: string; description: string }[] = [
  {
    value: "caresse",
    label: "Caresse",
    description: "Confident, authentic — app owner perspective",
  },
  {
    value: "reese",
    label: "Reese",
    description: "Casual, enthusiastic — relatable everyday reviewer",
  },
  {
    value: "revvel",
    label: "Revvel",
    description: "Tech-focused, analytical — sharp and detailed",
  },
];

const DEFAULT_MARKETS = ["UK", "CA", "AU"];

// ─── COMPONENT ──────────────────────────────────────────────

export function CrossMarketSeeder({
  asin,
  productName,
  productDescription = "",
  defaultVoice = "caresse",
  onGenerated,
  onClose,
}: CrossMarketSeederProps) {
  const [selectedMarkets, setSelectedMarkets] = useState<Set<string>>(
    new Set(DEFAULT_MARKETS)
  );
  const [pastedTexts, setPastedTexts] = useState<Record<string, string>>({});
  const [voice, setVoice] = useState<ReviewerVoice>(defaultVoice);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedMarkets, setExpandedMarkets] = useState<Set<string>>(
    new Set(DEFAULT_MARKETS)
  );

  const toggleMarket = (code: string) => {
    setSelectedMarkets((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
        setExpandedMarkets((em) => {
          const e = new Set(em);
          e.delete(code);
          return e;
        });
      } else {
        next.add(code);
        setExpandedMarkets((em) => new Set([...em, code]));
      }
      return next;
    });
  };

  const toggleExpanded = (code: string) => {
    setExpandedMarkets((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const setPastedText = useCallback((code: string, text: string) => {
    setPastedTexts((prev) => ({ ...prev, [code]: text }));
  }, []);

  const seedCount = Object.values(pastedTexts).filter((t) => t.trim().length > 0).length;

  const handleGenerate = () => {
    setIsGenerating(true);

    const seeds: MarketSeed[] = Array.from(selectedMarkets)
      .map((code) => {
        const market = AMAZON_MARKETS.find((m) => m.code === code);
        return {
          marketCode: code,
          marketLabel: market?.label ?? code,
          pastedText: pastedTexts[code] ?? "",
        };
      })
      .filter((s) => s.pastedText.trim().length > 0);

    setTimeout(() => {
      const result = synthesizeSeededReview(
        productName,
        productDescription,
        seeds,
        voice
      );
      setIsGenerating(false);
      onGenerated(result);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-[#0f1117] border-white/10 shadow-2xl">
        {/* Header */}
        <CardHeader className="flex-shrink-0 pb-3 border-b border-white/10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white text-base">
              <Globe2 className="h-5 w-5 text-sky-400" />
              Seed from Cross-Market Reviews
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-white/10 h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Open the product on other Amazon markets, copy their top reviews, paste below.
            We'll synthesize an original review in your chosen voice.
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-gray-300">
              {asin}
            </span>
            <span className="truncate text-gray-400">{productName}</span>
          </div>
        </CardHeader>

        <div className="flex-1 overflow-y-auto">
          <CardContent className="pt-4 space-y-5">
            {/* Voice Selector */}
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-xs">Reviewer Voice</Label>
              <Select
                value={voice}
                onValueChange={(v) => setVoice(v as ReviewerVoice)}
              >
                <SelectTrigger className="h-8 bg-white/5 border-white/10 text-gray-200 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOICE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="font-medium">{opt.label}</span>
                      <span className="ml-2 text-gray-400 text-xs">{opt.description}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Market Selector */}
            <div className="space-y-2">
              <Label className="text-gray-300 text-xs">Markets to Seed From</Label>
              <div className="flex flex-wrap gap-2">
                {AMAZON_MARKETS.map((market) => {
                  const active = selectedMarkets.has(market.code);
                  const hasPaste = (pastedTexts[market.code] ?? "").trim().length > 0;
                  return (
                    <button
                      key={market.code}
                      onClick={() => toggleMarket(market.code)}
                      className={[
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition",
                        active
                          ? hasPaste
                            ? "bg-sky-500/20 border-sky-500/50 text-sky-300"
                            : "bg-white/10 border-white/20 text-white"
                          : "bg-transparent border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-400",
                      ].join(" ")}
                    >
                      <span>{market.flag}</span>
                      <span>{market.code}</span>
                      {hasPaste && (
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Per-Market Paste Areas */}
            {AMAZON_MARKETS.filter((m) => selectedMarkets.has(m.code)).map((market) => {
              const isExpanded = expandedMarkets.has(market.code);
              const hasPaste = (pastedTexts[market.code] ?? "").trim().length > 0;
              return (
                <div
                  key={market.code}
                  className="rounded-lg border border-white/10 overflow-hidden"
                >
                  {/* Market row header */}
                  <div
                    className="flex items-center gap-3 px-3 py-2 bg-white/5 cursor-pointer hover:bg-white/8 transition"
                    onClick={() => toggleExpanded(market.code)}
                  >
                    <span className="text-base">{market.flag}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-white">
                        {market.label}
                      </span>
                      {hasPaste && (
                        <Badge className="ml-2 text-[10px] bg-sky-500/20 text-sky-300 border-sky-500/30 border">
                          Seeded
                        </Badge>
                      )}
                    </div>
                    <a
                      href={buildMarketUrl(asin, market.domain)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-sky-400 transition"
                    >
                      <span>Open</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                    )}
                  </div>

                  {/* Paste area */}
                  {isExpanded && (
                    <div className="p-3 space-y-2 bg-white/[0.02]">
                      <p className="text-xs text-gray-500">
                        Paste 1–5 top reviews from{" "}
                        <span className="font-mono text-gray-400">{market.domain}</span>
                      </p>
                      <Textarea
                        value={pastedTexts[market.code] ?? ""}
                        onChange={(e) => setPastedText(market.code, e.target.value)}
                        placeholder={`Paste review text from ${market.domain} here...`}
                        className="min-h-[100px] bg-white/5 border-white/10 text-gray-200 text-xs placeholder:text-gray-600 resize-none"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-white/10 flex items-center justify-between gap-3">
          <div className="text-xs text-gray-500">
            {seedCount > 0 ? (
              <span className="text-sky-400">
                {seedCount} market{seedCount !== 1 ? "s" : ""} seeded
              </span>
            ) : (
              <span>Paste reviews above to seed, or generate blank</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-sky-600 hover:bg-sky-500 text-white text-xs px-4"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full mr-1.5" />
                  Synthesizing...
                </>
              ) : (
                <>
                  <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                  Generate Seeded Review
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
