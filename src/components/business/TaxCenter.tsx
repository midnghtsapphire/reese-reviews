// ============================================================
// Portable Tax Module — designed for reuse across ReeseReviews,
// TruthSlayer, and other apps.
//
// TAX CENTER — MAIN ORCHESTRATOR
// The top-level entry point for the portable Tax Module.
// Renders a full-featured tax preparation dashboard with:
//   • Overview dashboard with per-person summaries
//   • Income Source Manager (W-2, 1099, SSA, rental, etc.)
//   • Tax Document Upload (OCR-style extraction flow)
//   • Tax Form Viewer (1040, Schedules C/SE/E/D, 8829, etc.)
//   • Write-offs & deductions tracker with savings estimates
//   • Quarterly estimated tax tracker
//
// Drop-in usage:
//   import { TaxCenter } from "@/components/business/TaxCenter";
//   <TaxCenter taxYear={2025} />
// ============================================================

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  LayoutDashboard,
  DollarSign,
  Upload,
  FileText,
  TrendingDown,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Info,
  ChevronRight,
  Users,
  Plus,
  Trash2,
} from "lucide-react";
import {
  getPersons,
  savePersons,
  addPerson,
  deletePerson,
  computeIncomeSummary,
  getIncomeSources,
  getWriteOffs,
  getTaxDocuments,
  getQuarterlyEstimates,
  upsertQuarterlyEstimate,
  estimateTaxSavings,
  determineRequiredForms,
  currentTaxYear,
  genId,
  IRS_FORM_META,
  TAX_BRAND,
} from "@/stores/taxStore";
import type {
  TaxPerson,
  QuarterlyEstimate,
  IncomeSummary,
  IrsForm,
} from "@/stores/taxStore";

import { IncomeSourceManager } from "./IncomeSourceManager";
import { TaxDocumentUpload } from "./TaxDocumentUpload";
import { TaxFormViewer } from "./TaxFormViewer";

// ─── BRAND COLORS ────────────────────────────────────────────
const BRAND = TAX_BRAND;

// ─── QUARTERLY DUE DATES ─────────────────────────────────────
const QUARTERLY_DUE_DATES: Record<1 | 2 | 3 | 4, string> = {
  1: "April 15",
  2: "June 17",
  3: "September 16",
  4: "January 15",
};

// ─── OVERVIEW CARD ────────────────────────────────────────────

interface PersonOverviewCardProps {
  person: TaxPerson;
  taxYear: number;
  onNavigate: (tab: string, personId: string) => void;
}

function PersonOverviewCard({ person, taxYear, onNavigate }: PersonOverviewCardProps) {
  const summary = computeIncomeSummary(person.id, taxYear);
  const docs = getTaxDocuments(person.id, taxYear);
  const reconciledDocs = docs.filter((d) => d.confirmed).length;
  const taxSavings = estimateTaxSavings(person.id, taxYear);
  const requiredForms = determineRequiredForms(person.id, taxYear);

  const completionItems = [
    { label: "Income sources",    done: summary.total_gross > 0 },
    { label: "Documents uploaded",done: docs.length > 0 },
    { label: "Write-offs tracked",done: summary.total_deductible > 0 },
    { label: "Forms reviewed",    done: requiredForms.length > 0 && summary.total_gross > 0 },
  ];
  const completionPct = Math.round(
    (completionItems.filter((i) => i.done).length / completionItems.length) * 100
  );

  return (
    <Card className="bg-white/5 border-white/10 hover:bg-white/8 transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white text-base">{person.name}</CardTitle>
            <CardDescription className="text-gray-400 text-xs capitalize">
              {person.role} · {person.filing_status?.replace(/_/g, " ") ?? "filing status TBD"}
            </CardDescription>
          </div>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold"
            style={{
              background: completionPct === 100
                ? "#4ade8022"
                : completionPct >= 50
                ? `${BRAND.gold}22`
                : `${BRAND.crimson}22`,
              border: `2px solid ${
                completionPct === 100
                  ? "#4ade80"
                  : completionPct >= 50
                  ? BRAND.gold
                  : BRAND.crimson
              }`,
              color: completionPct === 100 ? "#4ade80" : completionPct >= 50 ? BRAND.gold : BRAND.crimson,
            }}
          >
            {completionPct}%
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key figures */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Gross Income",    value: `$${summary.total_gross.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,     color: BRAND.amber },
            { label: "Deductions",      value: `$${summary.total_deductible.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: "#4ade80" },
            { label: "Est. AGI",        value: `$${summary.estimated_agi.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,    color: BRAND.volt },
            { label: "Tax Savings Est.",value: `$${taxSavings.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,               color: BRAND.gold },
          ].map((stat) => (
            <div key={stat.label} className="p-2 rounded-lg bg-white/5">
              <p className="text-gray-500 text-xs">{stat.label}</p>
              <p className="font-bold text-sm" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Completion checklist */}
        <div className="space-y-1">
          {completionItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-xs">
              {item.done ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              )}
              <span className={item.done ? "text-gray-300" : "text-gray-500"}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Required forms */}
        {requiredForms.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {requiredForms.map((f) => (
              <Badge key={f} className="bg-white/10 text-gray-300 text-xs">
                {IRS_FORM_META[f].label}
              </Badge>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 text-xs font-bold text-black"
            style={{ background: BRAND.amber }}
            onClick={() => onNavigate("income", person.id)}
          >
            <DollarSign className="w-3 h-3 mr-1" />
            Income
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs border-white/20 text-gray-300 hover:bg-white/10"
            onClick={() => onNavigate("forms", person.id)}
          >
            <FileText className="w-3 h-3 mr-1" />
            Forms
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── QUARTERLY TRACKER ────────────────────────────────────────

interface QuarterlyTrackerProps {
  taxYear: number;
}

function QuarterlyTracker({ taxYear }: QuarterlyTrackerProps) {
  const persons = getPersons();
  const [selectedPersonId, setSelectedPersonId] = useState(persons[0]?.id ?? "");
  const [estimates, setEstimates] = useState<QuarterlyEstimate[]>(() =>
    getQuarterlyEstimates(selectedPersonId, taxYear)
  );

  const refreshEstimates = (personId: string) => {
    setEstimates(getQuarterlyEstimates(personId, taxYear));
  };

  const handleTogglePaid = (quarter: 1 | 2 | 3 | 4) => {
    const existing = estimates.find(
      (e) => e.person_id === selectedPersonId && e.quarter === quarter
    );
    const updated: QuarterlyEstimate = existing
      ? { ...existing, paid: !existing.paid, paid_date: !existing.paid ? new Date().toISOString().slice(0, 10) : undefined }
      : {
          id: genId("qe"),
          person_id: selectedPersonId,
          tax_year: taxYear,
          quarter,
          due_date: QUARTERLY_DUE_DATES[quarter],
          estimated_income: 0,
          estimated_tax_owed: 0,
          amount_paid: 0,
          paid: true,
          paid_date: new Date().toISOString().slice(0, 10),
          notes: "",
        };
    upsertQuarterlyEstimate(updated);
    refreshEstimates(selectedPersonId);
  };

  const handleAmountChange = (quarter: 1 | 2 | 3 | 4, amount: string) => {
    const existing = estimates.find(
      (e) => e.person_id === selectedPersonId && e.quarter === quarter
    );
    const updated: QuarterlyEstimate = existing
      ? { ...existing, amount_paid: parseFloat(amount) || 0 }
      : {
          id: genId("qe"),
          person_id: selectedPersonId,
          tax_year: taxYear,
          quarter,
          due_date: QUARTERLY_DUE_DATES[quarter],
          estimated_income: 0,
          estimated_tax_owed: 0,
          amount_paid: parseFloat(amount) || 0,
          paid: false,
          notes: "",
        };
    upsertQuarterlyEstimate(updated);
    refreshEstimates(selectedPersonId);
  };

  const totalPaid = estimates.reduce((a, e) => a + e.amount_paid, 0);

  return (
    <div className="space-y-4">
      {/* Person selector */}
      <div className="flex flex-wrap gap-2">
        {persons.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setSelectedPersonId(p.id);
              refreshEstimates(p.id);
            }}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={
              selectedPersonId === p.id
                ? { background: BRAND.volt, color: "#000" }
                : { background: "rgba(255,255,255,0.1)", color: "#ccc" }
            }
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Quarters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {([1, 2, 3, 4] as const).map((q) => {
          const est = estimates.find(
            (e) => e.person_id === selectedPersonId && e.quarter === q
          );
          const isPaid = est?.paid ?? false;
          const amount = est?.amount_paid ?? 0;

          return (
            <div
              key={q}
              className="p-4 rounded-xl border transition-all"
              style={{
                background: isPaid ? "#4ade8011" : `${BRAND.volt}11`,
                borderColor: isPaid ? "#4ade8033" : `${BRAND.volt}33`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white font-bold text-sm">Q{q} {taxYear}</p>
                  <p className="text-gray-400 text-xs">Due {QUARTERLY_DUE_DATES[q]}</p>
                </div>
                <button
                  onClick={() => handleTogglePaid(q)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    isPaid ? "bg-green-500" : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  <CheckCircle2 className={`w-4 h-4 ${isPaid ? "text-white" : "text-gray-500"}`} />
                </button>
              </div>
              <div className="space-y-1">
                <Label className="text-gray-400 text-xs">Amount Paid ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount || ""}
                  onChange={(e) => handleAmountChange(q, e.target.value)}
                  placeholder="0.00"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-600 text-sm h-8"
                />
              </div>
              {isPaid && est?.paid_date && (
                <p className="text-green-400 text-xs mt-2">Paid {est.paid_date}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div
        className="flex items-center justify-between p-3 rounded-lg border"
        style={{ background: `${BRAND.volt}11`, borderColor: `${BRAND.volt}33` }}
      >
        <p className="text-white text-sm font-medium">Total Estimated Tax Paid ({taxYear})</p>
        <p className="font-bold text-lg" style={{ color: BRAND.volt }}>
          ${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
        <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
        <p className="text-gray-500 text-xs">
          Quarterly estimated taxes are due if you expect to owe $1,000 or more. Self-employed
          individuals (Schedule C) typically must pay quarterly. Underpayment may result in
          penalties. Consult IRS Form 1040-ES for exact amounts.
        </p>
      </div>
    </div>
  );
}

// ─── OVERVIEW CHARTS ─────────────────────────────────────────

function OverviewCharts({ taxYear }: { taxYear: number }) {
  const persons = getPersons();

  // Income by person
  const incomeByPerson = persons.map((p) => {
    const s = computeIncomeSummary(p.id, taxYear);
    return {
      name: p.name.split("/")[0].trim(),
      w2: s.total_w2,
      selfEmploy: s.total_self_employ,
      rental: s.total_rental,
      ssa: s.total_ssa,
      other: s.total_other,
    };
  });

  // Deductions by person
  const deductionsByPerson = persons.map((p) => {
    const s = computeIncomeSummary(p.id, taxYear);
    return {
      name: p.name.split("/")[0].trim(),
      deductions: s.total_deductible,
      savings: parseFloat((s.total_deductible * 0.25).toFixed(2)),
    };
  });

  // Combined totals for pie
  const allSources = persons.flatMap((p) => getIncomeSources(p.id, taxYear));
  const incomeTypeTotals: Record<string, number> = {};
  allSources.forEach((s) => {
    const label = s.income_type.replace(/_/g, " ").toUpperCase();
    incomeTypeTotals[label] = (incomeTypeTotals[label] ?? 0) + s.gross_amount;
  });
  const pieData = Object.entries(incomeTypeTotals)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const PIE_COLORS = [BRAND.amber, BRAND.gold, BRAND.crimson, BRAND.volt, "#8b5cf6", "#06b6d4", "#10b981"];

  const hasData = allSources.some((s) => s.gross_amount > 0);

  if (!hasData) {
    return (
      <div className="text-center py-10 text-gray-500">
        <LayoutDashboard className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Enter income data to see charts</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Income by person stacked bar */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm">Income by Person & Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={incomeByPerson} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "#1e1b4b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                labelStyle={{ color: "#fff" }}
                formatter={(v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
              <Bar dataKey="w2"         name="W-2"          stackId="a" fill={BRAND.amber}   />
              <Bar dataKey="selfEmploy" name="Self-Employ"  stackId="a" fill={BRAND.gold}    />
              <Bar dataKey="rental"     name="Rental"       stackId="a" fill={BRAND.crimson} />
              <Bar dataKey="ssa"        name="SSA"          stackId="a" fill="#8b5cf6"       />
              <Bar dataKey="other"      name="Other"        stackId="a" fill="#6b7280"       />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Income type pie */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm">Income Mix</CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#1e1b4b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  formatter={(v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-500 text-sm">
              No income data
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deductions bar */}
      <Card className="bg-white/5 border-white/10 lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm">Write-Offs & Estimated Tax Savings</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={deductionsByPerson} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 10 }} tickFormatter={(v) => `$${v.toLocaleString()}`} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} width={80} />
              <Tooltip
                contentStyle={{ background: "#1e1b4b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                formatter={(v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
              <Bar dataKey="deductions" name="Total Deductions" fill={BRAND.gold}    radius={[0, 4, 4, 0]} />
              <Bar dataKey="savings"    name="Est. Tax Savings" fill="#4ade80"       radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── ADD PERSON FORM ─────────────────────────────────────────

function AddPersonForm({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<TaxPerson["role"]>("primary");
  const [filingStatus, setFilingStatus] = useState<TaxPerson["filing_status"]>("single");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPerson({
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      role,
      filing_status: filingStatus,
      businesses: [],
      notes,
    });
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1">
          <Label className="text-gray-300 text-xs">Full Name / Display Name *</Label>
          <Input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Revvel / Mom"
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-gray-300 text-xs">Role</Label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as TaxPerson["role"])}
            className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white text-sm"
          >
            <option value="primary" className="bg-slate-800">Primary Filer</option>
            <option value="spouse" className="bg-slate-800">Spouse</option>
            <option value="dependent" className="bg-slate-800">Dependent</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-gray-300 text-xs">Filing Status</Label>
          <select
            value={filingStatus}
            onChange={(e) => setFilingStatus(e.target.value as TaxPerson["filing_status"])}
            className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white text-sm"
          >
            <option value="single" className="bg-slate-800">Single</option>
            <option value="married_filing_jointly" className="bg-slate-800">Married Filing Jointly</option>
            <option value="married_filing_separately" className="bg-slate-800">Married Filing Separately</option>
            <option value="head_of_household" className="bg-slate-800">Head of Household</option>
            <option value="qualifying_widow" className="bg-slate-800">Qualifying Widow(er)</option>
          </select>
        </div>
        <div className="sm:col-span-2 space-y-1">
          <Label className="text-gray-300 text-xs">Notes</Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about this person's tax situation…"
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
          />
        </div>
      </div>
      <div className="flex gap-3">
        <Button type="submit" className="flex-1 font-bold text-black" style={{ background: BRAND.amber }}>
          <Plus className="w-4 h-4 mr-2" /> Add Person
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="border-white/20 text-gray-300 hover:bg-white/10">
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────

interface TaxCenterProps {
  /** Default tax year; defaults to current filing year */
  taxYear?: number;
  /** If provided, the module starts on this tab */
  defaultTab?: string;
  /** If provided, the module starts focused on this person */
  defaultPersonId?: string;
}

export function TaxCenter({
  taxYear = currentTaxYear(),
  defaultTab = "overview",
  defaultPersonId,
}: TaxCenterProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [focusedPersonId, setFocusedPersonId] = useState<string | undefined>(defaultPersonId);
  const [persons, setPersons] = useState<TaxPerson[]>(() => getPersons());
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [selectedYear, setSelectedYear] = useState(taxYear);

  const refreshPersons = useCallback(() => {
    setPersons(getPersons());
  }, []);

  const handleNavigate = (tab: string, personId?: string) => {
    setActiveTab(tab);
    if (personId) setFocusedPersonId(personId);
  };

  const handleDeletePerson = (id: string) => {
    if (window.confirm("Remove this person from the tax center? Their income data will be preserved.")) {
      deletePerson(id);
      refreshPersons();
    }
  };

  // Combined totals across all persons
  const allSummaries = persons.map((p) => computeIncomeSummary(p.id, selectedYear));
  const totalGross = allSummaries.reduce((a, s) => a + s.total_gross, 0);
  const totalDeductible = allSummaries.reduce((a, s) => a + s.total_deductible, 0);
  const totalSavings = allSummaries.reduce((a, s) => a + parseFloat((s.total_deductible * 0.25).toFixed(2)), 0);
  const totalDocs = persons.reduce((a, p) => a + getTaxDocuments(p.id, selectedYear).length, 0);

  // ─── RENDER ────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Module Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="p-3 rounded-xl"
            style={{ background: `${BRAND.amber}22`, border: `1px solid ${BRAND.amber}44` }}
          >
            <LayoutDashboard className="w-6 h-6" style={{ color: BRAND.amber }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Tax Center</h2>
            <p className="text-gray-400 text-sm">
              Multi-person tax preparation · {persons.length} filer{persons.length !== 1 ? "s" : ""} · Tax Year {selectedYear}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y} className="bg-slate-800">{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Top-level KPI strip ───────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <DollarSign className="w-4 h-4" />, label: "Combined Gross",    value: `$${totalGross.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,     color: BRAND.amber },
          { icon: <TrendingDown className="w-4 h-4" />, label: "Total Deductions", value: `$${totalDeductible.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: "#4ade80" },
          { icon: <FileText className="w-4 h-4" />, label: "Documents",          value: String(totalDocs),                                                            color: BRAND.gold },
          { icon: <CheckCircle2 className="w-4 h-4" />, label: "Est. Tax Savings", value: `$${totalSavings.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,    color: BRAND.volt },
        ].map((kpi) => (
          <Card key={kpi.label} className="bg-white/5 border-white/10">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <span style={{ color: kpi.color }}>{kpi.icon}</span>
                <p className="text-gray-400 text-xs">{kpi.label}</p>
              </div>
              <p className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main Tabs ─────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap gap-1 bg-white/10 backdrop-blur-md border border-white/20 p-1 rounded-lg h-auto mb-6">
          {[
            { value: "overview",   icon: <LayoutDashboard className="w-4 h-4" />, label: "Overview" },
            { value: "income",     icon: <DollarSign className="w-4 h-4" />,      label: "Income & Write-Offs" },
            { value: "documents",  icon: <Upload className="w-4 h-4" />,           label: "Documents" },
            { value: "forms",      icon: <FileText className="w-4 h-4" />,         label: "Tax Forms" },
            { value: "quarterly",  icon: <Calendar className="w-4 h-4" />,         label: "Quarterly" },
            { value: "people",     icon: <Users className="w-4 h-4" />,            label: "People" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-1.5 text-white data-[state=active]:text-black text-xs sm:text-sm px-3 py-2 flex-1 min-w-[80px]"
              style={activeTab === tab.value ? { background: BRAND.amber } : {}}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── OVERVIEW TAB ──────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-6">
          {/* Person cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {persons.map((p) => (
              <PersonOverviewCard
                key={p.id}
                person={p}
                taxYear={selectedYear}
                onNavigate={handleNavigate}
              />
            ))}
          </div>

          {/* Charts */}
          <OverviewCharts taxYear={selectedYear} />

          {/* Quick actions */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Add Income Source",  tab: "income",    icon: <DollarSign className="w-4 h-4" />,  color: BRAND.amber },
                  { label: "Upload Document",    tab: "documents", icon: <Upload className="w-4 h-4" />,       color: BRAND.gold },
                  { label: "View Tax Forms",     tab: "forms",     icon: <FileText className="w-4 h-4" />,     color: BRAND.crimson },
                  { label: "Track Quarterly",    tab: "quarterly", icon: <Calendar className="w-4 h-4" />,     color: BRAND.volt },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => setActiveTab(action.tab)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-center"
                  >
                    <span style={{ color: action.color }}>{action.icon}</span>
                    <span className="text-gray-300 text-xs font-medium">{action.label}</span>
                    <ChevronRight className="w-3 h-3 text-gray-500" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-4 rounded-lg bg-white/5 border border-white/10">
            <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
            <p className="text-gray-500 text-xs">
              Tax Center provides estimates and organizational tools only — not professional tax
              advice. All figures are approximate. Consult a licensed CPA or enrolled agent for
              official tax preparation and filing. IRS Free File is available at irs.gov/freefile.
            </p>
          </div>
        </TabsContent>

        {/* ── INCOME & WRITE-OFFS TAB ───────────────────────── */}
        <TabsContent value="income">
          <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
            <IncomeSourceManager
              defaultPersonId={focusedPersonId}
              taxYear={selectedYear}
            />
          </div>
        </TabsContent>

        {/* ── DOCUMENTS TAB ─────────────────────────────────── */}
        <TabsContent value="documents">
          <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
            <TaxDocumentUpload
              defaultPersonId={focusedPersonId}
              taxYear={selectedYear}
            />
          </div>
        </TabsContent>

        {/* ── FORMS TAB ─────────────────────────────────────── */}
        <TabsContent value="forms">
          <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
            <TaxFormViewer
              defaultPersonId={focusedPersonId}
              taxYear={selectedYear}
            />
          </div>
        </TabsContent>

        {/* ── QUARTERLY TAB ─────────────────────────────────── */}
        <TabsContent value="quarterly">
          <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ background: `${BRAND.volt}22`, border: `1px solid ${BRAND.volt}44` }}
              >
                <Calendar className="w-5 h-5" style={{ color: BRAND.volt }} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Quarterly Estimated Taxes</h3>
                <p className="text-sm text-gray-400">
                  Track IRS Form 1040-ES payments · Tax Year {selectedYear}
                </p>
              </div>
            </div>
            <QuarterlyTracker taxYear={selectedYear} />
          </div>
        </TabsContent>

        {/* ── PEOPLE TAB ────────────────────────────────────── */}
        <TabsContent value="people">
          <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ background: `${BRAND.amber}22`, border: `1px solid ${BRAND.amber}44` }}
                >
                  <Users className="w-5 h-5" style={{ color: BRAND.amber }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Tax Filer Profiles</h3>
                  <p className="text-sm text-gray-400">
                    Manage the people included in this tax preparation
                  </p>
                </div>
              </div>
              {!showAddPerson && (
                <Button
                  onClick={() => setShowAddPerson(true)}
                  className="font-bold text-black text-sm"
                  style={{ background: BRAND.amber }}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Person
                </Button>
              )}
            </div>

            {/* Add person form */}
            {showAddPerson && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-base">New Tax Filer</CardTitle>
                </CardHeader>
                <CardContent>
                  <AddPersonForm
                    onSave={() => {
                      setShowAddPerson(false);
                      refreshPersons();
                    }}
                    onCancel={() => setShowAddPerson(false)}
                  />
                </CardContent>
              </Card>
            )}

            {/* Person list */}
            <div className="space-y-3">
              {persons.map((p) => {
                const summary = computeIncomeSummary(p.id, selectedYear);
                const sources = getIncomeSources(p.id, selectedYear);
                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white font-semibold">{p.name}</p>
                        <p className="text-gray-400 text-xs capitalize">
                          {p.role} · {p.filing_status?.replace(/_/g, " ") ?? "—"}
                        </p>
                        {p.notes && (
                          <p className="text-gray-500 text-xs mt-1">{p.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeletePerson(p.id)}
                        className="p-1.5 rounded hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition-colors"
                        title="Remove person"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Business entities */}
                    {p.businesses.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-gray-500 text-xs uppercase tracking-wider">Business Entities</p>
                        <div className="flex flex-wrap gap-2">
                          {p.businesses.map((biz) => (
                            <div
                              key={biz.id}
                              className="px-2 py-1 rounded-lg bg-white/5 border border-white/10"
                            >
                              <p className="text-gray-300 text-xs font-medium">{biz.name}</p>
                              <p className="text-gray-500 text-xs">{biz.schedule.replace("_", " ").toUpperCase()}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick stats */}
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className="text-gray-400">
                        {sources.length} income source{sources.length !== 1 ? "s" : ""}
                      </span>
                      <span className="text-gray-400">
                        Gross: <span style={{ color: BRAND.amber }}>${summary.total_gross.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                      </span>
                      <span className="text-gray-400">
                        Deductions: <span style={{ color: "#4ade80" }}>${summary.total_deductible.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                      </span>
                    </div>

                    {/* Navigate buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="text-xs font-bold text-black"
                        style={{ background: BRAND.amber }}
                        onClick={() => handleNavigate("income", p.id)}
                      >
                        Manage Income
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-white/20 text-gray-300 hover:bg-white/10"
                        onClick={() => handleNavigate("forms", p.id)}
                      >
                        View Forms
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default TaxCenter;
