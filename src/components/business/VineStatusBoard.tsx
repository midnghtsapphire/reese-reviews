// ============================================================
// VINE STATUS BOARD
// One-stop view of ALL Vine items:
//   • Color-coded status (reviewed ✓ / needs review 🔴 / overdue ⚠)
//   • One-click auto-create review for any item
//   • Manual item entry form
//   • Paste/import from text (one ASIN + name per line)
//   • Summary stats at top
// ============================================================

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Plus,
  Upload,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Star,
  Package,
} from "lucide-react";
import {
  getVineItems,
  saveVineItems,
  daysUntilDeadline,
} from "@/lib/vineScraperEnhanced";
import type { VineItem } from "@/lib/businessTypes";
import {
  getOrCreateDraft,
  saveDraftText,
  setDraftRating,
  markDraftReceived,
  type VineReviewDraft,
} from "@/lib/vineReviewDraftStore";
import { generateVineReview } from "@/lib/vineReviewGenerator";

// ─── STATUS STYLE ────────────────────────────────────────────

const STATUS_META: Record<
  VineItem["review_status"],
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  pending:     { label: "Needs Review",  color: "#f87171", bg: "#f8717115", icon: <AlertCircle className="w-3.5 h-3.5" /> },
  in_progress: { label: "In Progress",   color: "#fbbf24", bg: "#fbbf2415", icon: <Clock className="w-3.5 h-3.5" /> },
  submitted:   { label: "Submitted",     color: "#60a5fa", bg: "#60a5fa15", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  published:   { label: "Published ✓",   color: "#4ade80", bg: "#4ade8015", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  overdue:     { label: "OVERDUE",       color: "#ef4444", bg: "#ef444420", icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

// ─── ADD ITEM FORM ────────────────────────────────────────────

const EMPTY_FORM = {
  product_name: "",
  asin: "",
  category: "",
  estimated_value: "",
  received_date: new Date().toISOString().slice(0, 10),
  review_deadline: "",
};

function deadlineFromReceived(received: string): string {
  const d = new Date(received + "T12:00:00");
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

// ─── PARSE PASTE TEXT ─────────────────────────────────────────
// Accepts lines in any of these formats:
//   ASIN | Product Name | Category | ETV | Received Date
//   B0ABCDEF   Wireless Mouse   Electronics   29.99   2025-03-01
//   or simpler: ASIN [tab/pipe] Name

function parsePasteText(text: string): Partial<VineItem>[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 3)
    .map((line) => {
      // Split on tab, pipe, or 2+ spaces
      const parts = line.split(/\t|\s{2,}|\s*\|\s*/).map((p) => p.trim());
      const asin = parts[0]?.match(/^B[A-Z0-9]{9}$/i) ? parts[0].toUpperCase() : undefined;
      const product_name = asin ? (parts[1] ?? line) : line;
      const category = parts[2] ?? "General";
      const etv = parts[3] ? parseFloat(parts[3]) : 0;
      const received = parts[4] ?? new Date().toISOString().slice(0, 10);
      return {
        asin: asin ?? `MANUAL-${Date.now()}`,
        product_name,
        category,
        estimated_value: isNaN(etv) ? 0 : etv,
        received_date: received,
        review_deadline: deadlineFromReceived(received),
      };
    })
    .filter((item) => item.product_name && item.product_name.length > 2);
}

// ─── COMPONENT ───────────────────────────────────────────────

interface Props {
  onAutoCreate?: (itemId: string) => void;
}

export function VineStatusBoard({ onAutoCreate }: Props) {
  const [items, setItems] = useState<VineItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, VineReviewDraft>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Add item form
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // Paste import
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pastePreview, setPastePreview] = useState<Partial<VineItem>[]>([]);
  const [importing, setImporting] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const all = await getVineItems();
    all.sort((a, b) => {
      // Overdue first, then by deadline ascending
      const da = daysUntilDeadline(a.review_deadline);
      const db = daysUntilDeadline(b.review_deadline);
      return da - db;
    });
    const draftMap: Record<string, VineReviewDraft> = {};
    for (const item of all) {
      draftMap[item.id] = getOrCreateDraft(item.id);
    }
    setItems(all);
    setDrafts(draftMap);
    setLoading(false);
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  // ── Stats ────────────────────────────────────────────────
  const reviewed   = items.filter((i) => i.review_status === "submitted" || i.review_status === "published");
  const needsReview = items.filter((i) => i.review_status === "pending" || i.review_status === "overdue");
  const inProgress = items.filter((i) => i.review_status === "in_progress");
  const totalETV   = items.reduce((s, i) => s + i.estimated_value, 0);

  // ── Auto-create review for one item ─────────────────────
  const handleAutoCreate = async (item: VineItem) => {
    setGenerating((prev) => new Set([...prev, item.id]));
    try {
      markDraftReceived(item.id);
      const { title, body, suggestedRating } = generateVineReview(item);
      saveDraftText(item.id, title, body);
      setDraftRating(item.id, suggestedRating);

      // Update review_status → in_progress
      const all = await getVineItems();
      const idx = all.findIndex((i) => i.id === item.id);
      if (idx !== -1) {
        all[idx] = { ...all[idx], review_status: "in_progress" };
        await saveVineItems(all);
      }

      await loadItems();
      onAutoCreate?.(item.id);
    } finally {
      setGenerating((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  // ── Add item manually ────────────────────────────────────
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const all = await getVineItems();
    const newItem: VineItem = {
      id: `vine-manual-${Date.now()}`,
      asin: form.asin.trim() || `MANUAL-${Date.now()}`,
      product_name: form.product_name.trim(),
      category: form.category.trim() || "General",
      image_url: "",
      received_date: form.received_date,
      review_deadline: form.review_deadline || deadlineFromReceived(form.received_date),
      estimated_value: parseFloat(form.estimated_value) || 0,
      review_status: "pending",
      vine_enrollment_date: new Date().toISOString().slice(0, 10),
      notes: "",
      template_used: false,
    };
    await saveVineItems([...all, newItem]);
    setForm(EMPTY_FORM);
    setShowAddForm(false);
    await loadItems();
  };

  // ── Paste import ─────────────────────────────────────────
  const handlePasteChange = (text: string) => {
    setPasteText(text);
    setPastePreview(parsePasteText(text));
  };

  const handleImportPaste = async () => {
    if (pastePreview.length === 0) return;
    setImporting(true);
    const all = await getVineItems();
    const existingAsins = new Set(all.map((i) => i.asin));
    const newItems: VineItem[] = pastePreview
      .filter((p) => p.asin && !existingAsins.has(p.asin!))
      .map((p, idx) => ({
        id: `vine-import-${Date.now()}-${idx}`,
        asin: p.asin ?? `IMPORT-${idx}`,
        product_name: p.product_name ?? "Imported Item",
        category: p.category ?? "General",
        image_url: "",
        received_date: p.received_date ?? new Date().toISOString().slice(0, 10),
        review_deadline: p.review_deadline ?? deadlineFromReceived(p.received_date ?? new Date().toISOString().slice(0, 10)),
        estimated_value: p.estimated_value ?? 0,
        review_status: "pending" as const,
        vine_enrollment_date: new Date().toISOString().slice(0, 10),
        notes: "Imported via paste",
        template_used: false,
      }));

    if (newItems.length > 0) {
      await saveVineItems([...all, ...newItems]);
    }
    setPasteText("");
    setPastePreview([]);
    setShowPaste(false);
    setImporting(false);
    await loadItems();
  };

  // ── Render ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading Vine items…</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Stats bar ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Items",   value: items.length,        color: "#94a3b8" },
          { label: "Needs Review",  value: needsReview.length,  color: "#f87171" },
          { label: "In Progress",   value: inProgress.length,   color: "#fbbf24" },
          { label: "Reviewed ✓",    value: reviewed.length,     color: "#4ade80" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── ETV summary ─────────────────────────────────── */}
      <div className="flex items-center gap-3 text-xs text-gray-400 px-1">
        <span>Total ETV: <span className="text-amber-400 font-bold">${totalETV.toFixed(2)}</span></span>
        <span className="opacity-40">·</span>
        <span>Taxable income when received — report on 1099-NEC</span>
      </div>

      {/* ── Action bar ──────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          className="text-xs font-bold text-black bg-amber-400 hover:bg-amber-300"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Item
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-xs border-white/20 text-gray-300 hover:bg-white/10"
          onClick={() => setShowPaste(!showPaste)}
        >
          <Upload className="w-3.5 h-3.5 mr-1" />
          Paste / Import Queue
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-xs border-white/20 text-gray-300 hover:bg-white/10"
          onClick={loadItems}
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          Refresh
        </Button>
      </div>

      {/* ── Add item form ────────────────────────────────── */}
      {showAddForm && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold text-white mb-3">Add Vine Item</p>
          <form onSubmit={handleAddItem} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label className="text-gray-300 text-xs">Product Name *</Label>
                <Input
                  required
                  value={form.product_name}
                  onChange={(e) => setForm((f) => ({ ...f, product_name: e.target.value }))}
                  placeholder="e.g. Anker USB-C Hub 7-in-1"
                  className="bg-white/10 border-white/20 text-white mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs">ASIN (optional)</Label>
                <Input
                  value={form.asin}
                  onChange={(e) => setForm((f) => ({ ...f, asin: e.target.value.toUpperCase() }))}
                  placeholder="B0XXXXXXXXX"
                  maxLength={10}
                  className="bg-white/10 border-white/20 text-white mt-1 text-sm font-mono"
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs">Category</Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="Electronics, Kitchen, Beauty…"
                  className="bg-white/10 border-white/20 text-white mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs">ETV (Estimated Tax Value $)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.estimated_value}
                  onChange={(e) => setForm((f) => ({ ...f, estimated_value: e.target.value }))}
                  placeholder="29.99"
                  className="bg-white/10 border-white/20 text-white mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs">Date Received</Label>
                <Input
                  type="date"
                  value={form.received_date}
                  onChange={(e) => setForm((f) => ({
                    ...f,
                    received_date: e.target.value,
                    review_deadline: deadlineFromReceived(e.target.value),
                  }))}
                  className="bg-white/10 border-white/20 text-white mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs">Review Deadline (auto-set to +30 days)</Label>
                <Input
                  type="date"
                  value={form.review_deadline}
                  onChange={(e) => setForm((f) => ({ ...f, review_deadline: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white mt-1 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1 text-xs font-bold text-black bg-amber-400 hover:bg-amber-300">
                Add to Queue
              </Button>
              <Button type="button" variant="outline" className="text-xs border-white/20 text-gray-300" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Paste import ─────────────────────────────────── */}
      {showPaste && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-white">Paste Your Vine Queue</p>
            <p className="text-xs text-gray-400 mt-0.5">
              One item per line. Format (tab or pipe separated):<br />
              <code className="text-amber-300">ASIN  Product Name  Category  ETV  Date Received</code><br />
              Or just paste product names — ASIN and other fields are optional.
            </p>
          </div>
          <textarea
            value={pasteText}
            onChange={(e) => handlePasteChange(e.target.value)}
            className="w-full h-32 bg-white/10 border border-white/20 rounded-lg p-3 text-sm text-white font-mono resize-none focus:outline-none focus:border-amber-400/50"
            placeholder={"B08N5WRWNW\tAnker USB-C Hub\tElectronics\t39.99\t2025-03-01\nMy Coffee Maker\tKitchen\t29.99"}
          />
          {pastePreview.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-gray-400">{pastePreview.length} item{pastePreview.length !== 1 ? "s" : ""} detected:</p>
              {pastePreview.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-amber-400 font-mono">{p.asin}</span>
                  <span className="text-gray-300">{p.product_name}</span>
                  {p.estimated_value ? <span className="text-green-400">${p.estimated_value}</span> : null}
                </div>
              ))}
              {pastePreview.length > 5 && <p className="text-xs text-gray-500">…and {pastePreview.length - 5} more</p>}
            </div>
          )}
          <div className="flex gap-2">
            <Button
              className="flex-1 text-xs font-bold text-black bg-amber-400 hover:bg-amber-300 disabled:opacity-40"
              onClick={handleImportPaste}
              disabled={pastePreview.length === 0 || importing}
            >
              {importing ? "Importing…" : `Import ${pastePreview.length} Item${pastePreview.length !== 1 ? "s" : ""}`}
            </Button>
            <Button
              variant="outline"
              className="text-xs border-white/20 text-gray-300"
              onClick={() => { setShowPaste(false); setPasteText(""); setPastePreview([]); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ── Items list ───────────────────────────────────── */}
      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-500 space-y-2">
          <Package className="w-8 h-8 mx-auto opacity-30" />
          <p className="text-sm">No Vine items yet.</p>
          <p className="text-xs">Add items manually or paste your queue above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const draft = drafts[item.id];
            const hasDraft = !!(draft?.title && draft?.body);
            const days = daysUntilDeadline(item.review_deadline);
            const isExpanded = expandedId === item.id;
            const isGenerating = generating.has(item.id);
            const status = STATUS_META[item.review_status];

            return (
              <div
                key={item.id}
                className="rounded-xl border border-white/10 overflow-hidden transition"
                style={{ background: "#ffffff08" }}
              >
                {/* Row */}
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/5 transition"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  {/* Status dot */}
                  <div
                    className="flex-shrink-0 w-2 h-2 rounded-full"
                    style={{ background: status.color }}
                  />

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.product_name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-gray-500">{item.category}</span>
                      {item.asin && item.asin !== `MANUAL-${item.id}` && (
                        <span className="text-[10px] text-gray-600 font-mono">{item.asin}</span>
                      )}
                      <span className="text-[10px] text-amber-400 font-medium">
                        ${item.estimated_value.toFixed(2)} ETV
                      </span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="hidden sm:flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ color: status.color, background: status.bg }}
                    >
                      {status.icon}
                      {status.label}
                    </span>

                    {/* Deadline pill */}
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                      style={{
                        color: days < 0 ? "#ef4444" : days <= 7 ? "#fbbf24" : "#94a3b8",
                        background: days < 0 ? "#ef444420" : days <= 7 ? "#fbbf2420" : "#ffffff10",
                      }}
                    >
                      {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                    </span>

                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-white/10 p-4 space-y-3">
                    {/* Draft preview */}
                    {hasDraft && (
                      <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-white flex-1 truncate">{draft.title}</p>
                          {draft.rating > 0 && (
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: draft.rating }).map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2">{draft.body}</p>
                        <p className="text-[10px] text-gray-600">
                          {draft.submittedAt ? "✓ Submitted to Amazon" : draft.editedAt ? "Edited" : "Auto-generated"}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {/* Auto-create / regenerate */}
                      {item.review_status !== "submitted" && item.review_status !== "published" && (
                        <Button
                          size="sm"
                          className="text-xs font-bold text-black bg-amber-400 hover:bg-amber-300 disabled:opacity-40"
                          disabled={isGenerating}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAutoCreate(item);
                          }}
                        >
                          <Zap className="w-3.5 h-3.5 mr-1" />
                          {isGenerating ? "Generating…" : hasDraft ? "Regenerate" : "Auto-Create Review"}
                        </Button>
                      )}

                      {/* Go to full editor in Queue tab */}
                      {hasDraft && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-white/20 text-gray-300 hover:bg-white/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAutoCreate?.(item.id);
                          }}
                        >
                          Open in Editor →
                        </Button>
                      )}
                    </div>

                    {/* Received date / deadline */}
                    <div className="flex gap-4 text-[11px] text-gray-500">
                      <span>Received: {item.received_date}</span>
                      <span>Deadline: <span style={{ color: days < 0 ? "#ef4444" : days <= 7 ? "#fbbf24" : "#94a3b8" }}>{item.review_deadline}</span></span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
