// ============================================================
// CATEGORY MAPPER — UI COMPONENT
// Shows imported reviews with suggested categories, allows
// override via dropdown, bulk assignment, and a rules editor
// for defining custom auto-mapping rules.
// ============================================================

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tag,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  Settings2,
  ArrowRight,
  Search,
  Zap,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";
import {
  getCategoryRules,
  addCategoryRule,
  deleteCategoryRule,
  updateCategoryRule,
  resetToDefaultRules,
  SITE_CATEGORIES,
  type SiteCategory,
  type CategoryRule,
  type RuleType,
} from "@/lib/categoryRules";
import {
  getPipelineReviews,
  overrideCategory,
  bulkOverrideCategory,
  recategorize,
  type PipelineReview,
} from "@/lib/reviewPipeline";

// ─── PROPS ──────────────────────────────────────────────────

interface CategoryMapperProps {
  onRefresh?: () => void;
}

// ─── COMPONENT ──────────────────────────────────────────────

export function CategoryMapper({ onRefresh }: CategoryMapperProps) {
  const [reviews, setReviews] = useState<PipelineReview[]>([]);
  const [rules, setRules] = useState<CategoryRule[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState<SiteCategory | "">("");
  const [filterCategory, setFilterCategory] = useState<SiteCategory | "all">("all");
  const [filterConfidence, setFilterConfidence] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showRulesEditor, setShowRulesEditor] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New rule form
  const [newRuleType, setNewRuleType] = useState<RuleType>("keyword");
  const [newRulePattern, setNewRulePattern] = useState("");
  const [newRuleCategory, setNewRuleCategory] = useState<SiteCategory>("tech");
  const [newRulePriority, setNewRulePriority] = useState(75);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setReviews(getPipelineReviews());
    setRules(getCategoryRules());
  };

  // ─── FILTERED REVIEWS ──────────────────────────────────

  const filteredReviews = useMemo(() => {
    let result = reviews;

    if (filterCategory !== "all") {
      result = result.filter((r) => r.assignedCategory === filterCategory);
    }

    if (filterConfidence !== "all") {
      result = result.filter((r) => r.categoryConfidence === filterConfidence);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.productName.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.asin.toLowerCase().includes(q)
      );
    }

    return result;
  }, [reviews, filterCategory, filterConfidence, searchQuery]);

  // ─── CATEGORY STATS ────────────────────────────────────

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const cat of SITE_CATEGORIES) {
      stats[cat.value] = reviews.filter((r) => r.assignedCategory === cat.value).length;
    }
    return stats;
  }, [reviews]);

  // ─── HANDLERS ──────────────────────────────────────────

  const handleOverride = (reviewId: string, newCategory: SiteCategory) => {
    overrideCategory(reviewId, newCategory);
    loadData();
    onRefresh?.();
    showMsg("success", "Category updated");
  };

  const handleRecategorize = (reviewId: string) => {
    recategorize(reviewId);
    loadData();
    onRefresh?.();
    showMsg("success", "Re-categorized using rules engine");
  };

  const handleBulkAssign = () => {
    if (!bulkCategory || selectedIds.size === 0) return;
    bulkOverrideCategory(Array.from(selectedIds), bulkCategory as SiteCategory);
    setSelectedIds(new Set());
    setBulkCategory("");
    loadData();
    onRefresh?.();
    showMsg("success", `Updated ${selectedIds.size} reviews to ${bulkCategory}`);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredReviews.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredReviews.map((r) => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // ─── RULES EDITOR HANDLERS ────────────────────────────

  const handleAddRule = () => {
    if (!newRulePattern.trim()) return;
    addCategoryRule({
      type: newRuleType,
      pattern: newRulePattern.trim(),
      targetCategory: newRuleCategory,
      priority: newRulePriority,
      enabled: true,
    });
    setNewRulePattern("");
    setRules(getCategoryRules());
    showMsg("success", `Rule added: "${newRulePattern}" → ${newRuleCategory}`);
  };

  const handleDeleteRule = (ruleId: string) => {
    deleteCategoryRule(ruleId);
    setRules(getCategoryRules());
    showMsg("success", "Rule deleted");
  };

  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    updateCategoryRule(ruleId, { enabled });
    setRules(getCategoryRules());
  };

  const handleResetRules = () => {
    if (!window.confirm("Reset all rules to defaults? Custom rules will be lost.")) return;
    resetToDefaultRules();
    setRules(getCategoryRules());
    showMsg("success", "Rules reset to defaults");
  };

  const showMsg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // ─── CONFIDENCE BADGE ──────────────────────────────────

  const ConfidenceBadge = ({ confidence }: { confidence: string }) => {
    const colors: Record<string, string> = {
      high: "bg-green-500/20 text-green-300 border-green-500/30",
      medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      low: "bg-red-500/20 text-red-300 border-red-500/30",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colors[confidence] ?? colors.low}`}>
        {confidence}
      </span>
    );
  };

  // ─── CATEGORY ICON ─────────────────────────────────────

  const getCategoryIcon = (cat: SiteCategory): string => {
    return SITE_CATEGORIES.find((c) => c.value === cat)?.icon ?? "📦";
  };

  const getCategoryLabel = (cat: SiteCategory): string => {
    return SITE_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
  };

  // ─── RENDER ────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Tag className="h-5 w-5 text-purple-400" />
            Category Mapper
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Auto-categorized {reviews.length} reviews. Override or refine as needed.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowRulesEditor(!showRulesEditor)}
          className="border-white/20 text-gray-300 hover:text-white hover:bg-white/10"
        >
          <Settings2 className="h-4 w-4 mr-1" />
          {showRulesEditor ? "Hide Rules" : "Rules Editor"}
        </Button>
      </div>

      {/* Message */}
      {message && (
        <Alert className={message.type === "success" ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10"}>
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-green-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-400" />
          )}
          <AlertDescription className={message.type === "success" ? "text-green-300" : "text-red-300"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Category Distribution */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-300">Category Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {SITE_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setFilterCategory(filterCategory === cat.value ? "all" : cat.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filterCategory === cat.value
                    ? "bg-purple-600 text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className="ml-1 bg-white/10 px-1.5 py-0.5 rounded-full text-[10px]">
                  {categoryStats[cat.value] ?? 0}
                </span>
              </button>
            ))}
            {filterCategory !== "all" && (
              <button
                onClick={() => setFilterCategory("all")}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all"
              >
                Clear filter
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters & Bulk Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by product name, title, or ASIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
          />
        </div>

        <Select value={filterConfidence} onValueChange={setFilterConfidence}>
          <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-gray-300">
            <SelectValue placeholder="Confidence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Confidence</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-lg px-3 py-1.5">
            <span className="text-xs text-purple-300">{selectedIds.size} selected</span>
            <ArrowRight className="h-3 w-3 text-purple-400" />
            <Select value={bulkCategory} onValueChange={(v) => setBulkCategory(v as SiteCategory)}>
              <SelectTrigger className="w-[150px] h-7 text-xs bg-white/5 border-white/10 text-gray-300">
                <SelectValue placeholder="Assign to..." />
              </SelectTrigger>
              <SelectContent>
                {SITE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleBulkAssign} disabled={!bulkCategory} className="h-7 text-xs bg-purple-600 hover:bg-purple-700">
              Apply
            </Button>
          </div>
        )}
      </div>

      {/* Review List */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-300">
              Reviews ({filteredReviews.length})
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs text-gray-400 hover:text-white"
            >
              {selectedIds.size === filteredReviews.length && filteredReviews.length > 0 ? "Deselect All" : "Select All"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredReviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No reviews to categorize. Import reviews first.</p>
            </div>
          ) : (
            filteredReviews.map((review) => (
              <div
                key={review.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  selectedIds.has(review.id)
                    ? "bg-purple-500/10 border border-purple-500/30"
                    : "bg-white/5 border border-transparent hover:bg-white/10"
                }`}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedIds.has(review.id)}
                  onChange={() => toggleSelect(review.id)}
                  className="h-4 w-4 rounded border-gray-600 bg-transparent accent-purple-500 flex-shrink-0"
                />

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white truncate">{review.productName}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{review.asin}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                    <span>{review.date}</span>
                    {review.categoryOverridden && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1 border-yellow-500/30 text-yellow-400">
                        overridden
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Confidence */}
                <ConfidenceBadge confidence={review.categoryConfidence} />

                {/* Category Selector */}
                <Select
                  value={review.assignedCategory}
                  onValueChange={(v) => handleOverride(review.id, v as SiteCategory)}
                >
                  <SelectTrigger className="w-[170px] h-8 text-xs bg-white/5 border-white/10 text-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SITE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Recategorize */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRecategorize(review.id)}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-purple-400"
                  title="Re-run auto-categorization"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Rules Editor */}
      {showRulesEditor && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-purple-400" />
                  Category Rules Editor
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Define rules for automatic category mapping. Higher priority rules are checked first.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetRules}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset Defaults
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add New Rule */}
            <div className="flex flex-wrap items-end gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">Type</Label>
                <Select value={newRuleType} onValueChange={(v) => setNewRuleType(v as RuleType)}>
                  <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keyword">Keyword</SelectItem>
                    <SelectItem value="amazon-category">Amazon Category</SelectItem>
                    <SelectItem value="asin-prefix">ASIN Prefix</SelectItem>
                    <SelectItem value="custom">Custom Regex</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 flex-1 min-w-[200px]">
                <Label className="text-xs text-gray-400">
                  {newRuleType === "keyword" ? "Keyword" : newRuleType === "custom" ? "Regex Pattern" : newRuleType === "asin-prefix" ? "ASIN Prefix" : "Amazon Category"}
                </Label>
                <Input
                  value={newRulePattern}
                  onChange={(e) => setNewRulePattern(e.target.value)}
                  placeholder={
                    newRuleType === "keyword"
                      ? 'e.g., "phone" or "cable"'
                      : newRuleType === "custom"
                      ? "e.g., (phone|tablet|laptop)"
                      : newRuleType === "asin-prefix"
                      ? "e.g., B09"
                      : "e.g., electronics"
                  }
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-400">Target Category</Label>
                <Select value={newRuleCategory} onValueChange={(v) => setNewRuleCategory(v as SiteCategory)}>
                  <SelectTrigger className="w-[170px] bg-white/5 border-white/10 text-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SITE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-400">Priority (0-100)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={newRulePriority}
                  onChange={(e) => setNewRulePriority(Number(e.target.value))}
                  className="w-[80px] bg-white/5 border-white/10 text-white"
                />
              </div>

              <Button
                onClick={handleAddRule}
                disabled={!newRulePattern.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Rule
              </Button>
            </div>

            {/* Custom Rules List */}
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-gray-300 mb-2">
                Custom Rules ({rules.filter((r) => !r.id.startsWith("default-")).length})
              </h4>
              {rules
                .filter((r) => !r.id.startsWith("default-"))
                .map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center gap-3 p-2 rounded bg-white/5 hover:bg-white/10 transition"
                  >
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={(e) => handleToggleRule(rule.id, e.target.checked)}
                      className="h-3.5 w-3.5 accent-purple-500"
                    />
                    <Badge variant="outline" className="text-[10px] border-white/20 text-gray-400">
                      {rule.type}
                    </Badge>
                    <span className="text-sm text-white font-mono flex-1 truncate">
                      {rule.pattern}
                    </span>
                    <ArrowRight className="h-3 w-3 text-gray-600" />
                    <span className="text-xs text-gray-300">
                      {getCategoryIcon(rule.targetCategory)} {getCategoryLabel(rule.targetCategory)}
                    </span>
                    <span className="text-[10px] text-gray-500">P:{rule.priority}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="h-6 w-6 p-0 text-gray-500 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              {rules.filter((r) => !r.id.startsWith("default-")).length === 0 && (
                <p className="text-xs text-gray-500 py-2">No custom rules yet. Add one above.</p>
              )}
            </div>

            {/* Default Rules Summary */}
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-gray-300 mb-2">
                Default Rules ({rules.filter((r) => r.id.startsWith("default-")).length})
              </h4>
              <p className="text-xs text-gray-500">
                {rules.filter((r) => r.id.startsWith("default-") && r.type === "keyword").length} keyword rules,{" "}
                {rules.filter((r) => r.id.startsWith("default-") && r.type === "amazon-category").length} Amazon category rules.
                These are built-in and cover common product types.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
