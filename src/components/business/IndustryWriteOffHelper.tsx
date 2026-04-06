// ============================================================
// INDUSTRY WRITE-OFF HELPER
// One-click add industry-specific write-off suggestions for
// every business Reese and Revvel operate:
//   • Rover (pet care) — Schedule C
//   • zTrip (rideshare) — Schedule C
//   • Home Depot / Dollar Store (retail W-2) — limited federal
//   • Home Care / caregiver — Schedule C
//   • Amazon Vine / content creator — Schedule C
//   • NoCo Nook / rental — Schedule E
//   • Freedom Angel Corps (non-profit)
//
// Maximizes legal deductions per IRS Pub 535 & 334.
// ============================================================

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TrendingDown,
  Plus,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Lightbulb,
  BookOpen,
} from "lucide-react";
import {
  getPersons,
  addWriteOff,
  currentTaxYear,
  genId,
  getIndustryWriteOffSuggestions,
  entityToIndustry,
  WRITEOFF_CATEGORY_META,
} from "@/stores/taxStore";
import type {
  TaxPerson,
  BusinessEntity,
  WriteOffSuggestion,
  BusinessIndustry,
} from "@/stores/taxStore";

// ─── INDUSTRY DISPLAY META ──────────────────────────────────

const INDUSTRY_META: Record<BusinessIndustry, { label: string; icon: string; color: string }> = {
  pet_care:        { label: "Pet Care (Rover)",           icon: "🐾", color: "bg-green-900/30 border-green-600/40" },
  rideshare:       { label: "Rideshare (zTrip)",          icon: "🚗", color: "bg-blue-900/30 border-blue-600/40" },
  retail_w2:       { label: "Retail W-2 (Home Depot / Dollar Store)", icon: "🏪", color: "bg-orange-900/30 border-orange-600/40" },
  home_care:       { label: "Home Care / Caregiver",      icon: "🏥", color: "bg-pink-900/30 border-pink-600/40" },
  content_creator: { label: "Content Creator / Amazon Vine", icon: "🎬", color: "bg-purple-900/30 border-purple-600/40" },
  rental:          { label: "Rental (NoCo Nook)",         icon: "🏠", color: "bg-yellow-900/30 border-yellow-600/40" },
  nonprofit:       { label: "Non-profit (Freedom Angel Corps)", icon: "🕊️", color: "bg-teal-900/30 border-teal-600/40" },
  general:         { label: "General Business",           icon: "💼", color: "bg-gray-900/30 border-gray-600/40" },
};

// ─── PROPS ──────────────────────────────────────────────────

interface IndustryWriteOffHelperProps {
  personId?: string;
  taxYear?: number;
  onAdded?: () => void;
}

// ─── COMPONENT ──────────────────────────────────────────────

export function IndustryWriteOffHelper({
  personId: initialPersonId,
  taxYear: initialTaxYear,
  onAdded,
}: IndustryWriteOffHelperProps) {
  const taxYear = initialTaxYear ?? currentTaxYear();
  const persons = getPersons();

  const [selectedPersonId, setSelectedPersonId] = useState<string>(
    initialPersonId ?? persons[0]?.id ?? ""
  );
  const [expandedIndustry, setExpandedIndustry] = useState<BusinessIndustry | null>(null);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const selectedPerson = persons.find((p) => p.id === selectedPersonId);

  const showMessage = useCallback((type: "success" | "error" | "info", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }, []);

  // Build list of [entity, industry, suggestions] for selected person
  const businessSections = (selectedPerson?.businesses ?? []).map((entity) => {
    const industry = entityToIndustry(entity);
    const suggestions = getIndustryWriteOffSuggestions(industry);
    return { entity, industry, suggestions };
  });

  function getItemKey(entityId: string, suggestionDesc: string): string {
    return `${entityId}::${suggestionDesc}`;
  }

  function handleAddSuggestion(
    entity: BusinessEntity,
    suggestion: WriteOffSuggestion,
    person: TaxPerson
  ) {
    const key = getItemKey(entity.id, suggestion.description);
    const amountStr = customAmounts[key];
    const amount = amountStr ? parseFloat(amountStr) : suggestion.estimated_monthly * 12;

    if (isNaN(amount) || amount <= 0) {
      showMessage("error", "Please enter a valid dollar amount first.");
      return;
    }

    try {
      addWriteOff({
        person_id: person.id,
        business_entity_id: entity.id,
        tax_year: taxYear,
        date: `${taxYear}-01-01`,
        description: suggestion.description,
        vendor: suggestion.vendor,
        category: suggestion.category,
        amount,
        deductible_pct: suggestion.deductible_pct,
        notes: `${suggestion.note} | ${suggestion.federal_note}`,
      });

      setAddedItems((prev) => new Set([...prev, key]));
      showMessage("success", `Added: ${suggestion.description}`);
      onAdded?.();
    } catch {
      showMessage("error", "Failed to add write-off. Please try again.");
    }
  }

  function handleAddAll(entity: BusinessEntity, suggestions: WriteOffSuggestion[], person: TaxPerson) {
    let addedCount = 0;
    for (const suggestion of suggestions) {
      const key = getItemKey(entity.id, suggestion.description);
      if (addedItems.has(key)) continue;
      const amountStr = customAmounts[key];
      const amount = amountStr ? parseFloat(amountStr) : suggestion.estimated_monthly * 12;
      if (isNaN(amount) || amount <= 0) continue;

      try {
        addWriteOff({
          person_id: person.id,
          business_entity_id: entity.id,
          tax_year: taxYear,
          date: `${taxYear}-01-01`,
          description: suggestion.description,
          vendor: suggestion.vendor,
          category: suggestion.category,
          amount,
          deductible_pct: suggestion.deductible_pct,
          notes: `${suggestion.note} | ${suggestion.federal_note}`,
        });
        setAddedItems((prev) => new Set([...prev, key]));
        addedCount++;
      } catch {
        // skip item
      }
    }
    if (addedCount > 0) {
      showMessage("success", `Added ${addedCount} write-offs for ${entity.name}`);
      onAdded?.();
    } else {
      showMessage("info", "Enter amounts first, then click Add All.");
    }
  }

  if (!selectedPerson) {
    return (
      <Card className="bg-white/10 border-white/20">
        <CardContent className="pt-6">
          <p className="text-gray-400 text-center">No tax profiles found. Add a person in the People tab first.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Lightbulb className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">Industry Write-Off Helper</CardTitle>
              <CardDescription className="text-gray-400">
                One-click add IRS-approved write-offs specific to each business. Maximizes legal deductions.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Person Selector */}
          <div className="flex flex-wrap gap-2 mb-4">
            {persons.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPersonId(p.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedPersonId === p.id
                    ? "bg-purple-600 text-white"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                {p.slug === "revvel" ? "👑 " : "⭐ "}{p.name}
              </button>
            ))}
          </div>

          <Alert className="bg-blue-900/20 border-blue-500/30">
            <Info className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200 text-sm">
              <strong>Tax tip:</strong> Rover and zTrip income may be 1099 (Schedule C) — confirm each year.
              W-2 jobs (Home Depot, Dollar Store) have very limited federal deductions post-TCJA 2017, but
              Colorado may still allow some. Always keep receipts.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Message toast */}
      {message && (
        <Alert
          className={
            message.type === "success"
              ? "bg-green-900/20 border-green-500/30"
              : message.type === "error"
              ? "bg-red-900/20 border-red-500/30"
              : "bg-blue-900/20 border-blue-500/30"
          }
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-green-400" />
          ) : message.type === "error" ? (
            <AlertCircle className="h-4 w-4 text-red-400" />
          ) : (
            <Info className="h-4 w-4 text-blue-400" />
          )}
          <AlertDescription
            className={
              message.type === "success"
                ? "text-green-200"
                : message.type === "error"
                ? "text-red-200"
                : "text-blue-200"
            }
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Business sections */}
      {businessSections.length === 0 ? (
        <Card className="bg-white/10 border-white/20">
          <CardContent className="pt-6 text-center text-gray-400">
            No businesses found for {selectedPerson.name}. Add business entities in the People tab.
          </CardContent>
        </Card>
      ) : (
        businessSections.map(({ entity, industry, suggestions }) => {
          const meta = INDUSTRY_META[industry];
          const isExpanded = expandedIndustry === industry || businessSections.length === 1;
          const addedCount = suggestions.filter((s) =>
            addedItems.has(getItemKey(entity.id, s.description))
          ).length;
          const totalPotential = suggestions.reduce(
            (sum, s) => sum + (s.estimated_monthly * 12 * s.deductible_pct) / 100,
            0
          );

          return (
            <Card key={entity.id} className={`border ${meta.color}`}>
              <CardHeader
                className="pb-2 cursor-pointer"
                onClick={() =>
                  setExpandedIndustry(
                    expandedIndustry === industry && businessSections.length > 1
                      ? null
                      : industry
                  )
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{meta.icon}</span>
                    <div>
                      <CardTitle className="text-white text-base">{entity.name}</CardTitle>
                      <CardDescription className="text-gray-400 text-xs">
                        {meta.label} · {entity.schedule === "none" ? "W-2 employee" : entity.schedule.replace("_", " ").toUpperCase()}
                        {addedCount > 0 && (
                          <span className="ml-2 text-green-400">✓ {addedCount} added</span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {totalPotential > 0 && (
                      <Badge className="bg-green-900/40 text-green-300 text-xs">
                        ~${totalPotential.toFixed(0)}/yr potential
                      </Badge>
                    )}
                    {businessSections.length > 1 && (
                      isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )
                    )}
                  </div>
                </div>
                {entity.notes && (
                  <p className="text-xs text-gray-500 mt-1">{entity.notes}</p>
                )}
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  {/* W-2 note */}
                  {industry === "retail_w2" && (
                    <Alert className="mb-3 bg-orange-900/20 border-orange-500/30">
                      <AlertCircle className="h-4 w-4 text-orange-400" />
                      <AlertDescription className="text-orange-200 text-xs">
                        <strong>Important:</strong> For W-2 employees, the 2017 Tax Cuts and Jobs Act eliminated most
                        miscellaneous itemized deductions at the federal level through 2025. However, Colorado (CO)
                        may still allow some employee business expenses on the state return. Track ALL receipts.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Add All button */}
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-xs text-gray-400">
                      Enter annual amounts, then click + to add each item (or Add All)
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10 text-xs"
                      onClick={() => handleAddAll(entity, suggestions, selectedPerson)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add All
                    </Button>
                  </div>

                  {/* Suggestions list */}
                  <div className="space-y-2">
                    {suggestions.map((suggestion) => {
                      const key = getItemKey(entity.id, suggestion.description);
                      const isAdded = addedItems.has(key);
                      const catMeta = WRITEOFF_CATEGORY_META[suggestion.category];

                      return (
                        <div
                          key={key}
                          className={`flex items-start gap-3 p-2.5 rounded-lg transition-all ${
                            isAdded
                              ? "bg-green-900/20 border border-green-600/30"
                              : "bg-white/5 border border-white/10 hover:border-white/20"
                          }`}
                        >
                          <span className="text-base mt-0.5">{catMeta.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${isAdded ? "text-green-300" : "text-white"}`}>
                              {suggestion.description}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{suggestion.vendor}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{suggestion.note}</p>
                            {suggestion.deductible_pct < 100 && (
                              <Badge className="mt-1 bg-yellow-900/30 text-yellow-300 text-[10px]">
                                {suggestion.deductible_pct}% deductible
                              </Badge>
                            )}
                            <p className={`text-[10px] mt-1 ${
                              suggestion.federal_note.startsWith("NOT")
                                ? "text-orange-400"
                                : "text-green-400"
                            }`}>
                              {suggestion.federal_note}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {suggestion.estimated_monthly > 0 && (
                              <p className="text-[10px] text-gray-500">
                                Est. ${suggestion.estimated_monthly * 12}/yr
                              </p>
                            )}
                            {!isAdded ? (
                              <div className="flex items-center gap-1">
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                  <Input
                                    type="number"
                                    placeholder={
                                      suggestion.estimated_monthly > 0
                                        ? String(suggestion.estimated_monthly * 12)
                                        : "0.00"
                                    }
                                    value={customAmounts[key] ?? ""}
                                    onChange={(e) =>
                                      setCustomAmounts((prev) => ({
                                        ...prev,
                                        [key]: e.target.value,
                                      }))
                                    }
                                    className="w-20 h-7 pl-5 pr-1 text-xs bg-black/30 border-white/20 text-white"
                                  />
                                </div>
                                <Button
                                  size="sm"
                                  className="h-7 w-7 p-0 bg-purple-600 hover:bg-purple-700"
                                  onClick={() => handleAddSuggestion(entity, suggestion, selectedPerson)}
                                  title="Add this write-off"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <CheckCircle2 className="h-5 w-5 text-green-400" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* IRS Resources */}
                  <div className="mt-3 p-2 bg-black/20 rounded flex items-start gap-2">
                    <BookOpen className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-gray-500">
                      <strong className="text-gray-400">IRS Resources:</strong>{" "}
                      {industry === "pet_care" || industry === "rideshare" || industry === "home_care"
                        ? "Publication 535 (Business Expenses) · Schedule C Instructions"
                        : industry === "retail_w2"
                        ? "Publication 529 (Misc. Deductions) · CO DR 0104 Instructions"
                        : industry === "rental"
                        ? "Publication 527 (Residential Rental Property) · Schedule E Instructions"
                        : industry === "content_creator"
                        ? "Publication 535 (Business Expenses) · Schedule C · Form 8829"
                        : "Publication 535 (Business Expenses)"}{" "}
                      · Always consult a CPA for your specific situation.
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })
      )}

      {/* Summary callout */}
      {addedItems.size > 0 && (
        <Card className="bg-green-900/20 border-green-600/30">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-green-400 shrink-0" />
            <div>
              <p className="text-green-300 font-semibold">{addedItems.size} write-offs added this session</p>
              <p className="text-green-400/70 text-xs">
                Review in Tax Center → Expenses tab. Every deduction reduces taxable income.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
