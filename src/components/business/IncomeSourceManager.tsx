// ============================================================
// Portable Tax Module — designed for reuse across ReeseReviews,
// TruthSlayer, and other apps.
//
// INCOME SOURCE MANAGER
// Manage unlimited income sources per person (W-2, 1099, SSA,
// rental, self-employment, etc.) and track business write-offs
// with receipt linking. All data persisted via taxStore.
// ============================================================

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  DollarSign,
  Briefcase,
  TrendingDown,
  Receipt,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Info,
} from "lucide-react";
import {
  getPersons,
  getIncomeSources,
  addIncomeSource,
  updateIncomeSource,
  deleteIncomeSource,
  getWriteOffs,
  addWriteOff,
  updateWriteOff,
  deleteWriteOff,
  computeIncomeSummary,
  getWriteOffsByCategory,
  estimateTaxSavings,
  currentTaxYear,
  genId,
  WRITEOFF_CATEGORY_META,
} from "@/stores/taxStore";
import type {
  IncomeSource,
  IncomeType,
  WriteOff,
  WriteOffCategory,
  TaxPerson,
} from "@/stores/taxStore";

// ─── BRAND COLORS ────────────────────────────────────────────
const BRAND = {
  amber:   "#FF6B2B",
  gold:    "#FFB347",
  crimson: "#E63946",
  volt:    "#FFD93D",
};

// ─── INCOME TYPE METADATA ────────────────────────────────────

const INCOME_TYPE_META: Record<IncomeType, { label: string; badge: string; description: string }> = {
  w2:          { label: "W-2",           badge: "bg-blue-600",    description: "Employee wages — taxes withheld by employer" },
  "1099_nec":  { label: "1099-NEC",      badge: "bg-orange-600",  description: "Non-employee compensation — self-employment tax applies" },
  "1099_misc": { label: "1099-MISC",     badge: "bg-yellow-600",  description: "Miscellaneous income" },
  "1099_k":    { label: "1099-K",        badge: "bg-purple-600",  description: "Payment network income (PayPal, Stripe, etc.)" },
  "1099_div":  { label: "1099-DIV",      badge: "bg-green-600",   description: "Dividend income" },
  "1099_int":  { label: "1099-INT",      badge: "bg-teal-600",    description: "Interest income" },
  ssa_1099:    { label: "SSA-1099",      badge: "bg-indigo-600",  description: "Social Security / disability benefits" },
  rental:      { label: "Rental",        badge: "bg-pink-600",    description: "Rental property income — Schedule E" },
  self_employ: { label: "Self-Employ",   badge: "bg-red-600",     description: "General self-employment income — Schedule C" },
  other:       { label: "Other",         badge: "bg-gray-600",    description: "Other taxable income" },
};

// ─── BLANK FORMS ─────────────────────────────────────────────

const blankIncomeForm = (personId: string, taxYear: number): Omit<IncomeSource, "id" | "created_at" | "updated_at"> => ({
  person_id: personId,
  tax_year: taxYear,
  label: "",
  payer_name: "",
  payer_ein: "",
  income_type: "w2",
  gross_amount: 0,
  federal_withheld: 0,
  state_withheld: 0,
  ss_wages: 0,
  medicare_wages: 0,
  reconciled: false,
  notes: "",
});

const blankWriteOffForm = (personId: string, taxYear: number): Omit<WriteOff, "id" | "created_at" | "deductible_amount"> => ({
  person_id: personId,
  tax_year: taxYear,
  date: new Date().toISOString().slice(0, 10),
  description: "",
  vendor: "",
  category: "supplies",
  amount: 0,
  deductible_pct: 100,
  notes: "",
});

// ─── INCOME SOURCE FORM ───────────────────────────────────────

interface IncomeFormProps {
  personId: string;
  taxYear: number;
  initial?: IncomeSource;
  onSave: () => void;
  onCancel: () => void;
}

function IncomeSourceForm({ personId, taxYear, initial, onSave, onCancel }: IncomeFormProps) {
  const [form, setForm] = useState<Omit<IncomeSource, "id" | "created_at" | "updated_at">>(
    initial
      ? { ...initial }
      : blankIncomeForm(personId, taxYear)
  );

  const set = (key: keyof typeof form, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initial) {
      updateIncomeSource(initial.id, form);
    } else {
      addIncomeSource(form);
    }
    onSave();
  };

  const meta = INCOME_TYPE_META[form.income_type];
  const isSelfEmploy = ["1099_nec", "1099_misc", "1099_k", "self_employ"].includes(form.income_type);
  const isW2 = form.income_type === "w2";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Label */}
        <div className="sm:col-span-2 space-y-1">
          <Label className="text-gray-300 text-xs">Source Label *</Label>
          <Input
            required
            value={form.label}
            onChange={(e) => set("label", e.target.value)}
            placeholder="e.g. Home Depot W-2, Amazon Vine 1099-NEC"
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Income Type */}
        <div className="space-y-1">
          <Label className="text-gray-300 text-xs">Income Type *</Label>
          <select
            value={form.income_type}
            onChange={(e) => set("income_type", e.target.value as IncomeType)}
            className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white text-sm"
          >
            {(Object.keys(INCOME_TYPE_META) as IncomeType[]).map((t) => (
              <option key={t} value={t} className="bg-slate-800">
                {INCOME_TYPE_META[t].label} — {INCOME_TYPE_META[t].description}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">{meta.description}</p>
        </div>

        {/* Payer Name */}
        <div className="space-y-1">
          <Label className="text-gray-300 text-xs">Payer / Employer Name *</Label>
          <Input
            required
            value={form.payer_name}
            onChange={(e) => set("payer_name", e.target.value)}
            placeholder="Amazon.com Services LLC"
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Payer EIN */}
        <div className="space-y-1">
          <Label className="text-gray-300 text-xs">Payer EIN</Label>
          <Input
            value={form.payer_ein ?? ""}
            onChange={(e) => set("payer_ein", e.target.value)}
            placeholder="XX-XXXXXXX"
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Gross Amount */}
        <div className="space-y-1">
          <Label className="text-gray-300 text-xs">Gross Income ($) *</Label>
          <Input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.gross_amount || ""}
            onChange={(e) => set("gross_amount", parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Federal Withheld */}
        <div className="space-y-1">
          <Label className="text-gray-300 text-xs">Federal Tax Withheld ($)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.federal_withheld || ""}
            onChange={(e) => set("federal_withheld", parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
          />
        </div>

        {/* State Withheld */}
        <div className="space-y-1">
          <Label className="text-gray-300 text-xs">State Tax Withheld ($)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.state_withheld || ""}
            onChange={(e) => set("state_withheld", parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
          />
        </div>

        {/* W-2 specific */}
        {isW2 && (
          <>
            <div className="space-y-1">
              <Label className="text-gray-300 text-xs">SS Wages (Box 3)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.ss_wages || ""}
                onChange={(e) => set("ss_wages", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-gray-300 text-xs">Medicare Wages (Box 5)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.medicare_wages || ""}
                onChange={(e) => set("medicare_wages", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
              />
            </div>
          </>
        )}

        {/* Self-employment note */}
        {isSelfEmploy && (
          <div className="sm:col-span-2 flex items-start gap-2 p-3 rounded-lg bg-orange-900/20 border border-orange-500/30">
            <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <p className="text-orange-300 text-xs">
              Self-employment income requires Schedule C and Schedule SE. You will owe self-employment
              tax (~15.3%) on net profit. Track your write-offs to reduce taxable income.
            </p>
          </div>
        )}

        {/* Reconciled */}
        <div className="sm:col-span-2 flex items-center gap-3">
          <input
            type="checkbox"
            id="reconciled"
            checked={form.reconciled}
            onChange={(e) => set("reconciled", e.target.checked)}
            className="w-4 h-4 accent-orange-500"
          />
          <Label htmlFor="reconciled" className="text-gray-300 text-sm cursor-pointer">
            Reconciled against physical document
          </Label>
        </div>

        {/* Notes */}
        <div className="sm:col-span-2 space-y-1">
          <Label className="text-gray-300 text-xs">Notes</Label>
          <Input
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Any notes about this income source…"
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          className="flex-1 font-bold text-black"
          style={{ background: BRAND.amber }}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          {initial ? "Update Source" : "Add Source"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-white/20 text-gray-300 hover:bg-white/10"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ─── WRITE-OFF FORM ───────────────────────────────────────────

interface WriteOffFormProps {
  personId: string;
  taxYear: number;
  initial?: WriteOff;
  onSave: () => void;
  onCancel: () => void;
}

function WriteOffForm({ personId, taxYear, initial, onSave, onCancel }: WriteOffFormProps) {
  const [form, setForm] = useState<Omit<WriteOff, "id" | "created_at" | "deductible_amount">>(
    initial
      ? { ...initial }
      : blankWriteOffForm(personId, taxYear)
  );

  const set = (key: keyof typeof form, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initial) {
      updateWriteOff(initial.id, form);
    } else {
      addWriteOff(form);
    }
    onSave();
  };

  const catMeta = WRITEOFF_CATEGORY_META[form.category];
  const deductibleAmount = parseFloat(((form.amount * form.deductible_pct) / 100).toFixed(2));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Description */}
        <div className="sm:col-span-2 space-y-1">
          <Label className="text-gray-300 text-xs">Description *</Label>
          <Input
            required
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="e.g. Monthly internet bill, Office chair, Mileage to client"
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Category */}
        <div className="space-y-1">
          <Label className="text-gray-300 text-xs">Category *</Label>
          <select
            value={form.category}
            onChange={(e) => {
              const cat = e.target.value as WriteOffCategory;
              set("category", cat);
              set("deductible_pct", WRITEOFF_CATEGORY_META[cat].default_pct);
            }}
            className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white text-sm"
          >
            {(Object.keys(WRITEOFF_CATEGORY_META) as WriteOffCategory[]).map((cat) => (
              <option key={cat} value={cat} className="bg-slate-800">
                {WRITEOFF_CATEGORY_META[cat].icon} {WRITEOFF_CATEGORY_META[cat].label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">{catMeta.description}</p>
        </div>

        {/* Vendor */}
        <div className="space-y-1">
          <Label className="text-gray-300 text-xs">Vendor / Merchant</Label>
          <Input
            value={form.vendor}
            onChange={(e) => set("vendor", e.target.value)}
            placeholder="Staples, Comcast, etc."
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Date */}
        <div className="space-y-1">
          <Label className="text-gray-300 text-xs">Date *</Label>
          <Input
            required
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            className="bg-white/10 border-white/20 text-white"
          />
        </div>

        {/* Amount */}
        <div className="space-y-1">
          <Label className="text-gray-300 text-xs">Amount ($) *</Label>
          <Input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.amount || ""}
            onChange={(e) => set("amount", parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Deductible % */}
        <div className="space-y-1">
          <Label className="text-gray-300 text-xs">
            Deductible % — Deductible: ${deductibleAmount.toFixed(2)}
          </Label>
          <Input
            type="number"
            min="0"
            max="100"
            step="1"
            value={form.deductible_pct}
            onChange={(e) => set("deductible_pct", parseInt(e.target.value) || 0)}
            className="bg-white/10 border-white/20 text-white"
          />
        </div>

        {/* Mileage fields */}
        {form.category === "vehicle_mileage" && (
          <>
            <div className="space-y-1">
              <Label className="text-gray-300 text-xs">Miles Driven</Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={form.mileage_miles || ""}
                onChange={(e) => {
                  const miles = parseFloat(e.target.value) || 0;
                  const rate = form.mileage_rate ?? 0.67;
                  set("mileage_miles", miles);
                  set("amount", parseFloat((miles * rate).toFixed(2)));
                }}
                placeholder="0"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-gray-300 text-xs">IRS Rate ($/mile)</Label>
              <Input
                type="number"
                min="0"
                step="0.001"
                value={form.mileage_rate ?? 0.67}
                onChange={(e) => {
                  const rate = parseFloat(e.target.value) || 0;
                  const miles = form.mileage_miles ?? 0;
                  set("mileage_rate", rate);
                  set("amount", parseFloat((miles * rate).toFixed(2)));
                }}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </>
        )}

        {/* Notes */}
        <div className="sm:col-span-2 space-y-1">
          <Label className="text-gray-300 text-xs">Notes</Label>
          <Input
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Any notes…"
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          className="flex-1 font-bold text-black"
          style={{ background: BRAND.gold }}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          {initial ? "Update Write-Off" : "Add Write-Off"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-white/20 text-gray-300 hover:bg-white/10"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────

interface IncomeSourceManagerProps {
  defaultPersonId?: string;
  taxYear?: number;
}

export function IncomeSourceManager({
  defaultPersonId,
  taxYear = currentTaxYear(),
}: IncomeSourceManagerProps) {
  const persons = getPersons();
  const [selectedPersonId, setSelectedPersonId] = useState<string>(
    defaultPersonId ?? persons[0]?.id ?? ""
  );

  // Income source state
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>(() =>
    getIncomeSources(selectedPersonId, taxYear)
  );
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeSource | null>(null);
  const [expandedIncome, setExpandedIncome] = useState<string | null>(null);

  // Write-off state
  const [writeOffs, setWriteOffs] = useState<WriteOff[]>(() =>
    getWriteOffs(selectedPersonId, taxYear)
  );
  const [showWriteOffForm, setShowWriteOffForm] = useState(false);
  const [editingWriteOff, setEditingWriteOff] = useState<WriteOff | null>(null);

  const refreshAll = useCallback((personId: string) => {
    setIncomeSources(getIncomeSources(personId, taxYear));
    setWriteOffs(getWriteOffs(personId, taxYear));
  }, [taxYear]);

  const handlePersonChange = (id: string) => {
    setSelectedPersonId(id);
    setShowIncomeForm(false);
    setEditingIncome(null);
    setShowWriteOffForm(false);
    setEditingWriteOff(null);
    refreshAll(id);
  };

  const summary = computeIncomeSummary(selectedPersonId, taxYear);
  const catTotals = getWriteOffsByCategory(selectedPersonId, taxYear);
  const taxSavings = estimateTaxSavings(selectedPersonId, taxYear);
  const selectedPerson = persons.find((p) => p.id === selectedPersonId);

  // ─── RENDER ────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="p-2 rounded-lg"
          style={{ background: `${BRAND.gold}22`, border: `1px solid ${BRAND.gold}44` }}
        >
          <Briefcase className="w-5 h-5" style={{ color: BRAND.gold }} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Income Source Manager</h3>
          <p className="text-sm text-gray-400">
            Track all income sources and business write-offs per person · Tax Year {taxYear}
          </p>
        </div>
      </div>

      {/* Person Tabs */}
      <div className="flex flex-wrap gap-2">
        {persons.map((p) => {
          const isSelected = selectedPersonId === p.id;
          const isPrimary = p.role === "primary";
          return (
            <button
              key={p.id}
              onClick={() => handlePersonChange(p.id)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={
                isSelected
                  ? { background: BRAND.gold, color: "#000" }
                  : { background: "rgba(255,255,255,0.1)", color: "#ccc" }
              }
            >
              {isPrimary ? "⭐ " : ""}{p.name}{isPrimary ? " (You)" : ""}
            </button>
          );
        })}
      </div>

      {/* Person Context Banner — who you're viewing right now */}
      {selectedPerson && (
        <div
          className="rounded-xl border p-4 space-y-2"
          style={{ background: "rgba(255,255,255,0.04)", borderColor: `${BRAND.gold}33` }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {selectedPerson.role === "primary" ? "⭐" : selectedPerson.id === "person-revvel" ? "💙" : "👤"}
            </span>
            <div>
              <p className="text-white font-semibold text-sm">{selectedPerson.name}</p>
              <p className="text-gray-400 text-xs capitalize">
                {selectedPerson.role === "primary" ? "Primary filer — this is your section" : selectedPerson.role}
                {" · "}
                {selectedPerson.filing_status?.replace(/_/g, " ")}
              </p>
            </div>
          </div>
          {selectedPerson.notes && (
            <div className="space-y-1">
              {selectedPerson.notes.split("\n").filter(Boolean).map((line, i) => (
                <p key={i} className="text-gray-400 text-xs leading-relaxed">{line}</p>
              ))}
            </div>
          )}
          {selectedPerson.businesses.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {selectedPerson.businesses.map((biz) => (
                <span
                  key={biz.id}
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={{ background: `${BRAND.gold}22`, color: BRAND.gold, border: `1px solid ${BRAND.gold}44` }}
                >
                  {biz.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Gross Income",      value: `$${summary.total_gross.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,      color: BRAND.amber },
          { label: "Fed. Withheld",     value: `$${summary.total_federal_withheld.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: BRAND.volt },
          { label: "Total Deductions",  value: `$${summary.total_deductible.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,  color: BRAND.gold },
          { label: "Est. Tax Savings",  value: `$${taxSavings.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,               color: "#4ade80" },
        ].map((card) => (
          <Card key={card.label} className="bg-white/5 border-white/10">
            <CardContent className="pt-4 pb-3">
              <p className="text-gray-400 text-xs mb-1">{card.label}</p>
              <p className="text-xl font-bold" style={{ color: card.color }}>
                {card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Required Forms Alert */}
      {summary.required_forms.length > 0 && (
        <div
          className="flex items-start gap-3 p-4 rounded-lg border"
          style={{ background: `${BRAND.amber}11`, borderColor: `${BRAND.amber}33` }}
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: BRAND.amber }} />
          <div>
            <p className="text-white text-sm font-medium mb-1">Required IRS Forms</p>
            <div className="flex flex-wrap gap-2">
              {summary.required_forms.map((f) => (
                <Badge key={f} className="bg-white/10 text-gray-200 text-xs">
                  {f.replace("_", " ").toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="income">
        <TabsList className="bg-white/10 border border-white/10 p-1 rounded-lg">
          <TabsTrigger value="income" className="text-white data-[state=active]:bg-white/20 text-sm">
            <DollarSign className="w-4 h-4 mr-1" />
            Income Sources ({incomeSources.length})
          </TabsTrigger>
          <TabsTrigger value="writeoffs" className="text-white data-[state=active]:bg-white/20 text-sm">
            <TrendingDown className="w-4 h-4 mr-1" />
            Write-Offs ({writeOffs.length})
          </TabsTrigger>
          <TabsTrigger value="summary" className="text-white data-[state=active]:bg-white/20 text-sm">
            <Receipt className="w-4 h-4 mr-1" />
            Summary
          </TabsTrigger>
        </TabsList>

        {/* ── INCOME SOURCES TAB ──────────────────────────────── */}
        <TabsContent value="income" className="space-y-4 mt-4">
          {/* Add form toggle */}
          {!showIncomeForm && !editingIncome && (
            <Button
              onClick={() => setShowIncomeForm(true)}
              className="font-bold text-black"
              style={{ background: BRAND.amber }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Income Source
            </Button>
          )}

          {/* Add / Edit form */}
          {(showIncomeForm || editingIncome) && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-base">
                  {editingIncome ? "Edit Income Source" : "New Income Source"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <IncomeSourceForm
                  personId={selectedPersonId}
                  taxYear={taxYear}
                  initial={editingIncome ?? undefined}
                  onSave={() => {
                    setShowIncomeForm(false);
                    setEditingIncome(null);
                    refreshAll(selectedPersonId);
                  }}
                  onCancel={() => {
                    setShowIncomeForm(false);
                    setEditingIncome(null);
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Income list */}
          {incomeSources.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No income sources yet for {selectedPerson?.name}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {incomeSources.map((src) => {
                const meta = INCOME_TYPE_META[src.income_type];
                const isExpanded = expandedIncome === src.id;
                return (
                  <div
                    key={src.id}
                    className="rounded-lg border border-white/10 bg-white/5 overflow-hidden"
                  >
                    {/* Row header */}
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-all"
                      onClick={() => setExpandedIncome(isExpanded ? null : src.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge className={`${meta.badge} text-white text-xs shrink-0`}>
                          {meta.label}
                        </Badge>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{src.label}</p>
                          <p className="text-gray-400 text-xs">{src.payer_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <div className="text-right hidden sm:block">
                          <p className="text-white text-sm font-bold">
                            ${src.gross_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-gray-400 text-xs">
                            Withheld: ${src.federal_withheld.toFixed(2)}
                          </p>
                        </div>
                        {src.reconciled ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-400" />
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="border-t border-white/10 p-3 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-gray-400 text-xs">Gross Income</p>
                            <p className="text-white font-medium">
                              ${src.gross_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs">Federal Withheld</p>
                            <p className="text-white font-medium">${src.federal_withheld.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs">State Withheld</p>
                            <p className="text-white font-medium">${src.state_withheld.toFixed(2)}</p>
                          </div>
                          {src.ss_wages !== undefined && (
                            <div>
                              <p className="text-gray-400 text-xs">SS Wages</p>
                              <p className="text-white font-medium">${src.ss_wages.toFixed(2)}</p>
                            </div>
                          )}
                          {src.payer_ein && (
                            <div>
                              <p className="text-gray-400 text-xs">Payer EIN</p>
                              <p className="text-white font-medium">{src.payer_ein}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-400 text-xs">Reconciled</p>
                            <p className={src.reconciled ? "text-green-400 font-medium" : "text-yellow-400 font-medium"}>
                              {src.reconciled ? "Yes" : "Pending"}
                            </p>
                          </div>
                        </div>
                        {src.notes && (
                          <p className="text-gray-400 text-xs border-t border-white/10 pt-2">
                            {src.notes}
                          </p>
                        )}
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingIncome(src);
                              setShowIncomeForm(false);
                            }}
                            className="border-white/20 text-gray-300 hover:bg-white/10 text-xs"
                          >
                            <Pencil className="w-3 h-3 mr-1" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              deleteIncomeSource(src.id);
                              refreshAll(selectedPersonId);
                            }}
                            className="border-red-500/30 text-red-400 hover:bg-red-900/20 text-xs"
                          >
                            <Trash2 className="w-3 h-3 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── WRITE-OFFS TAB ──────────────────────────────────── */}
        <TabsContent value="writeoffs" className="space-y-4 mt-4">
          {/* Running totals by category */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {(Object.keys(WRITEOFF_CATEGORY_META) as WriteOffCategory[])
              .filter((cat) => catTotals[cat].count > 0)
              .map((cat) => {
                const meta = WRITEOFF_CATEGORY_META[cat];
                const totals = catTotals[cat];
                return (
                  <div
                    key={cat}
                    className="p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <p className="text-lg mb-1">{meta.icon}</p>
                    <p className="text-gray-300 text-xs font-medium">{meta.label}</p>
                    <p className="text-white text-sm font-bold">
                      ${totals.deductible.toFixed(2)}
                    </p>
                    <p className="text-gray-500 text-xs">{totals.count} item{totals.count !== 1 ? "s" : ""}</p>
                  </div>
                );
              })}
          </div>

          {/* Add form toggle */}
          {!showWriteOffForm && !editingWriteOff && (
            <Button
              onClick={() => setShowWriteOffForm(true)}
              className="font-bold text-black"
              style={{ background: BRAND.gold }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Write-Off
            </Button>
          )}

          {/* Add / Edit form */}
          {(showWriteOffForm || editingWriteOff) && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-base">
                  {editingWriteOff ? "Edit Write-Off" : "New Write-Off"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WriteOffForm
                  personId={selectedPersonId}
                  taxYear={taxYear}
                  initial={editingWriteOff ?? undefined}
                  onSave={() => {
                    setShowWriteOffForm(false);
                    setEditingWriteOff(null);
                    refreshAll(selectedPersonId);
                  }}
                  onCancel={() => {
                    setShowWriteOffForm(false);
                    setEditingWriteOff(null);
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Write-offs list */}
          {writeOffs.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <TrendingDown className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No write-offs tracked yet — add expenses to reduce your tax bill</p>
            </div>
          ) : (
            <div className="space-y-2">
              {writeOffs.map((wo) => {
                const meta = WRITEOFF_CATEGORY_META[wo.category];
                return (
                  <div
                    key={wo.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">{meta.icon}</span>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{wo.description}</p>
                        <p className="text-gray-400 text-xs">
                          {meta.label} · {wo.vendor || "—"} · {wo.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <div className="text-right">
                        <p className="text-white text-sm font-bold">
                          ${wo.deductible_amount.toFixed(2)}
                        </p>
                        {wo.deductible_pct < 100 && (
                          <p className="text-gray-400 text-xs">{wo.deductible_pct}% of ${wo.amount.toFixed(2)}</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setEditingWriteOff(wo);
                          setShowWriteOffForm(false);
                        }}
                        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          deleteWriteOff(wo.id);
                          refreshAll(selectedPersonId);
                        }}
                        className="p-1 rounded hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Total row */}
              <div
                className="flex items-center justify-between p-3 rounded-lg border font-bold"
                style={{ background: `${BRAND.gold}11`, borderColor: `${BRAND.gold}33` }}
              >
                <p className="text-white">Total Deductible</p>
                <p style={{ color: BRAND.gold }}>
                  ${summary.total_deductible.toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── SUMMARY TAB ─────────────────────────────────────── */}
        <TabsContent value="summary" className="space-y-4 mt-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-base">
                {selectedPerson?.name} — {taxYear} Tax Summary
              </CardTitle>
              <CardDescription className="text-gray-400">
                Estimated figures — consult a tax professional for final numbers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Income breakdown */}
              <div className="space-y-2">
                <p className="text-gray-300 text-sm font-semibold uppercase tracking-wide">Income</p>
                {[
                  { label: "W-2 Wages",           value: summary.total_w2,           show: summary.total_w2 > 0 },
                  { label: "Self-Employment",      value: summary.total_self_employ,  show: summary.total_self_employ > 0 },
                  { label: "Rental Income",        value: summary.total_rental,       show: summary.total_rental > 0 },
                  { label: "Social Security",      value: summary.total_ssa,          show: summary.total_ssa > 0 },
                  { label: "Other Income",         value: summary.total_other,        show: summary.total_other > 0 },
                ].filter((r) => r.show).map((row) => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-gray-400">{row.label}</span>
                    <span className="text-white">${row.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold border-t border-white/10 pt-2">
                  <span className="text-white">Total Gross Income</span>
                  <span style={{ color: BRAND.amber }}>
                    ${summary.total_gross.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Deductions */}
              <div className="space-y-2">
                <p className="text-gray-300 text-sm font-semibold uppercase tracking-wide">Deductions</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Business Write-Offs</span>
                  <span className="text-green-400">
                    -${summary.total_deductible.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-white/10 pt-2">
                  <span className="text-white">Estimated AGI</span>
                  <span style={{ color: BRAND.volt }}>
                    ${summary.estimated_agi.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Withholding */}
              <div className="space-y-2">
                <p className="text-gray-300 text-sm font-semibold uppercase tracking-wide">Withholding</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Federal Withheld</span>
                  <span className="text-white">${summary.total_federal_withheld.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">State Withheld</span>
                  <span className="text-white">${summary.total_state_withheld.toFixed(2)}</span>
                </div>
              </div>

              {/* Estimated savings */}
              <div
                className="flex items-center justify-between p-3 rounded-lg border"
                style={{ background: "#4ade8011", borderColor: "#4ade8033" }}
              >
                <div>
                  <p className="text-green-300 text-sm font-medium">Estimated Tax Savings</p>
                  <p className="text-gray-400 text-xs">From write-offs at ~25% effective rate</p>
                </div>
                <p className="text-green-400 text-xl font-bold">${taxSavings.toFixed(2)}</p>
              </div>

              {/* Required forms */}
              <div className="space-y-2">
                <p className="text-gray-300 text-sm font-semibold uppercase tracking-wide">Required Forms</p>
                <div className="flex flex-wrap gap-2">
                  {summary.required_forms.map((f) => (
                    <Badge key={f} className="bg-white/10 text-gray-200 text-xs">
                      {f.replace(/_/g, " ").toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default IncomeSourceManager;
