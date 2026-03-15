// ============================================================
// Portable Tax Module — designed for reuse across ReeseReviews,
// TruthSlayer, and other apps.
//
// TAX FORM VIEWER
// Renders fillable previews of IRS forms auto-determined from
// each person's income sources and write-offs. Users can view,
// edit, and export form data. Forms are pre-populated from the
// taxStore and can be saved back for reference.
//
// Supported forms:
//   Form 1040, Schedule C, Schedule SE, Schedule E,
//   Schedule D, Form 8829, Form 4562
// ============================================================

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Info,
  Printer,
} from "lucide-react";
import {
  getPersons,
  getIncomeSources,
  getWriteOffs,
  computeIncomeSummary,
  determineRequiredForms,
  getWriteOffsByCategory,
  currentTaxYear,
  IRS_FORM_META,
} from "@/stores/taxStore";
import type { IrsForm, TaxPerson, IncomeSummary } from "@/stores/taxStore";

// ─── BRAND COLORS ────────────────────────────────────────────
const BRAND = {
  amber:   "#FF6B2B",
  gold:    "#FFB347",
  crimson: "#E63946",
  volt:    "#FFD93D",
};

// ─── FORM FIELD DEFINITIONS ──────────────────────────────────
// Each form is a list of sections, each section a list of fields.
// Fields are pre-populated from IncomeSummary where possible.

interface FormField {
  key: string;
  label: string;
  line?: string;
  type: "number" | "text" | "readonly" | "divider";
  hint?: string;
  computed?: (summary: IncomeSummary, fields: Record<string, string>) => string;
}

interface FormSection {
  title: string;
  fields: FormField[];
}

type FormDefinition = {
  form: IrsForm;
  sections: FormSection[];
};

function buildFormDefinitions(summary: IncomeSummary): FormDefinition[] {
  const fmt = (n: number) => n.toFixed(2);

  return [
    // ── FORM 1040 ─────────────────────────────────────────────
    {
      form: "1040" as IrsForm,
      sections: [
        {
          title: "Filing Information",
          fields: [
            { key: "filing_status",   label: "Filing Status",                  line: "",    type: "text",     hint: "Single, MFJ, MFS, HOH, QW" },
            { key: "tax_year",        label: "Tax Year",                       line: "",    type: "text",     hint: String(summary.tax_year) },
          ],
        },
        {
          title: "Income",
          fields: [
            { key: "line1z_wages",    label: "Line 1z — Total W-2 Wages",      line: "1z",  type: "number",   hint: fmt(summary.total_w2),     computed: (s) => fmt(s.total_w2) },
            { key: "line2b_interest", label: "Line 2b — Taxable Interest",     line: "2b",  type: "number",   hint: "0.00" },
            { key: "line3b_divs",     label: "Line 3b — Ordinary Dividends",   line: "3b",  type: "number",   hint: "0.00" },
            { key: "line5a_ssa",      label: "Line 5a — Social Security",      line: "5a",  type: "number",   hint: fmt(summary.total_ssa),    computed: (s) => fmt(s.total_ssa) },
            { key: "line5b_ssa_tax",  label: "Line 5b — Taxable SS (85%)",     line: "5b",  type: "readonly", hint: "",                         computed: (s) => fmt(s.total_ssa * 0.85) },
            { key: "line8_other",     label: "Line 8 — Other Income",          line: "8",   type: "number",   hint: fmt(summary.total_other),  computed: (s) => fmt(s.total_other) },
            { key: "line9_total",     label: "Line 9 — Total Income",          line: "9",   type: "readonly", hint: "",                         computed: (s) => fmt(s.total_gross) },
          ],
        },
        {
          title: "Adjustments to Income",
          fields: [
            { key: "line10_adj",      label: "Line 10 — Adjustments",          line: "10",  type: "number",   hint: "0.00" },
            { key: "line11_agi",      label: "Line 11 — Adjusted Gross Income",line: "11",  type: "readonly", hint: "",                         computed: (s) => fmt(s.estimated_agi) },
          ],
        },
        {
          title: "Tax and Credits",
          fields: [
            { key: "line12_std_ded",  label: "Line 12 — Standard Deduction",   line: "12",  type: "number",   hint: "14600.00" },
            { key: "line15_tax_inc",  label: "Line 15 — Taxable Income",       line: "15",  type: "readonly", hint: "",                         computed: (s) => fmt(Math.max(0, s.estimated_agi - 14600)) },
            { key: "line16_tax",      label: "Line 16 — Tax",                  line: "16",  type: "number",   hint: "0.00" },
            { key: "line17_alt_min",  label: "Line 17 — Alt Min Tax",          line: "17",  type: "number",   hint: "0.00" },
            { key: "line24_total_tax",label: "Line 24 — Total Tax",            line: "24",  type: "number",   hint: "0.00" },
          ],
        },
        {
          title: "Payments",
          fields: [
            { key: "line25a_w2_wh",   label: "Line 25a — W-2 Withholding",     line: "25a", type: "readonly", hint: "",                         computed: (s) => fmt(s.total_federal_withheld) },
            { key: "line26_est_tax",  label: "Line 26 — Estimated Tax Paid",   line: "26",  type: "number",   hint: "0.00" },
            { key: "line33_total_pay",label: "Line 33 — Total Payments",       line: "33",  type: "number",   hint: "0.00" },
          ],
        },
        {
          title: "Refund / Amount Owed",
          fields: [
            { key: "line35a_refund",  label: "Line 35a — Refund",              line: "35a", type: "number",   hint: "0.00" },
            { key: "line37_owed",     label: "Line 37 — Amount Owed",          line: "37",  type: "number",   hint: "0.00" },
          ],
        },
      ],
    },

    // ── SCHEDULE C ────────────────────────────────────────────
    {
      form: "schedule_c" as IrsForm,
      sections: [
        {
          title: "Business Information",
          fields: [
            { key: "sc_business_name",  label: "Business Name",                  line: "A",   type: "text",   hint: "Freedom Angel Corps / Amazon Vine" },
            { key: "sc_ein",            label: "EIN (if applicable)",            line: "B",   type: "text",   hint: "" },
            { key: "sc_activity_code",  label: "Principal Business Code",        line: "B",   type: "text",   hint: "519130 (Internet Publishing)" },
            { key: "sc_method",         label: "Accounting Method",              line: "F",   type: "text",   hint: "Cash" },
          ],
        },
        {
          title: "Income",
          fields: [
            { key: "sc_line1_gross",    label: "Line 1 — Gross Receipts",        line: "1",   type: "number", hint: fmt(summary.total_self_employ), computed: (s) => fmt(s.total_self_employ) },
            { key: "sc_line4_cogs",     label: "Line 4 — Cost of Goods Sold",    line: "4",   type: "number", hint: "0.00" },
            { key: "sc_line7_gross_inc",label: "Line 7 — Gross Income",          line: "7",   type: "readonly",hint: "",                             computed: (s) => fmt(s.total_self_employ) },
          ],
        },
        {
          title: "Expenses",
          fields: [
            { key: "sc_line8_adv",      label: "Line 8 — Advertising",           line: "8",   type: "number", hint: "0.00" },
            { key: "sc_line9_car",      label: "Line 9 — Car & Truck",           line: "9",   type: "number", hint: "0.00" },
            { key: "sc_line13_depr",    label: "Line 13 — Depreciation",         line: "13",  type: "number", hint: "0.00" },
            { key: "sc_line18_office",  label: "Line 18 — Office Expense",       line: "18",  type: "number", hint: "0.00" },
            { key: "sc_line22_supplies",label: "Line 22 — Supplies",             line: "22",  type: "number", hint: "0.00" },
            { key: "sc_line25_util",    label: "Line 25 — Utilities",            line: "25",  type: "number", hint: "0.00" },
            { key: "sc_line28_total_exp",label: "Line 28 — Total Expenses",      line: "28",  type: "number", hint: fmt(summary.total_deductible), computed: (s) => fmt(s.total_deductible) },
          ],
        },
        {
          title: "Net Profit",
          fields: [
            { key: "sc_line30_home",    label: "Line 30 — Home Office",          line: "30",  type: "number", hint: "0.00" },
            { key: "sc_line31_net",     label: "Line 31 — Net Profit / Loss",    line: "31",  type: "readonly",hint: "",                             computed: (s) => fmt(Math.max(0, s.total_self_employ - s.total_deductible)) },
          ],
        },
      ],
    },

    // ── SCHEDULE SE ───────────────────────────────────────────
    {
      form: "schedule_se" as IrsForm,
      sections: [
        {
          title: "Self-Employment Tax",
          fields: [
            { key: "se_line2_net",      label: "Line 2 — Net SE Income",         line: "2",   type: "readonly",hint: "",                             computed: (s) => fmt(Math.max(0, s.total_self_employ - s.total_deductible)) },
            { key: "se_line3_92pct",    label: "Line 3 — 92.35% of Line 2",      line: "3",   type: "readonly",hint: "",                             computed: (s) => fmt(Math.max(0, s.total_self_employ - s.total_deductible) * 0.9235) },
            { key: "se_line4_se_tax",   label: "Line 4 — SE Tax (15.3%)",        line: "4",   type: "readonly",hint: "",                             computed: (s) => fmt(Math.max(0, s.total_self_employ - s.total_deductible) * 0.9235 * 0.153) },
            { key: "se_line6_deduct",   label: "Line 6 — Deductible SE Tax",     line: "6",   type: "readonly",hint: "",                             computed: (s) => fmt(Math.max(0, s.total_self_employ - s.total_deductible) * 0.9235 * 0.153 / 2) },
          ],
        },
      ],
    },

    // ── SCHEDULE E ────────────────────────────────────────────
    {
      form: "schedule_e" as IrsForm,
      sections: [
        {
          title: "Rental Property",
          fields: [
            { key: "se_prop_address",   label: "Property Address",               line: "A",   type: "text",   hint: "Rocky Mountain Rentals — address" },
            { key: "se_prop_type",      label: "Property Type",                  line: "B",   type: "text",   hint: "1 — Single Family Residence" },
            { key: "se_days_rented",    label: "Days Rented at Fair Rental",     line: "2",   type: "number", hint: "365" },
            { key: "se_days_personal",  label: "Days Personal Use",              line: "3",   type: "number", hint: "0" },
          ],
        },
        {
          title: "Income",
          fields: [
            { key: "se_line3_rents",    label: "Line 3 — Rents Received",        line: "3",   type: "number", hint: fmt(summary.total_rental), computed: (s) => fmt(s.total_rental) },
          ],
        },
        {
          title: "Expenses",
          fields: [
            { key: "se_line5_adv",      label: "Line 5 — Advertising",           line: "5",   type: "number", hint: "0.00" },
            { key: "se_line6_auto",     label: "Line 6 — Auto & Travel",         line: "6",   type: "number", hint: "0.00" },
            { key: "se_line9_insurance",label: "Line 9 — Insurance",             line: "9",   type: "number", hint: "0.00" },
            { key: "se_line11_legal",   label: "Line 11 — Legal & Professional", line: "11",  type: "number", hint: "0.00" },
            { key: "se_line12_mgmt",    label: "Line 12 — Management Fees",      line: "12",  type: "number", hint: "0.00" },
            { key: "se_line13_depr",    label: "Line 13 — Depreciation",         line: "13",  type: "number", hint: "0.00" },
            { key: "se_line16_taxes",   label: "Line 16 — Taxes",                line: "16",  type: "number", hint: "0.00" },
            { key: "se_line17_util",    label: "Line 17 — Utilities",            line: "17",  type: "number", hint: "0.00" },
            { key: "se_line20_total",   label: "Line 20 — Total Expenses",       line: "20",  type: "number", hint: "0.00" },
          ],
        },
        {
          title: "Net Income",
          fields: [
            { key: "se_line21_net",     label: "Line 21 — Net Rental Income",    line: "21",  type: "readonly",hint: "",                             computed: (s) => fmt(s.total_rental) },
          ],
        },
      ],
    },

    // ── SCHEDULE D ────────────────────────────────────────────
    {
      form: "schedule_d" as IrsForm,
      sections: [
        {
          title: "Short-Term Capital Gains (held ≤ 1 year)",
          fields: [
            { key: "sd_st_proceeds",    label: "Proceeds",                       line: "1b",  type: "number", hint: "0.00" },
            { key: "sd_st_basis",       label: "Cost Basis",                     line: "1b",  type: "number", hint: "0.00" },
            { key: "sd_st_gain",        label: "Short-Term Gain / Loss",         line: "7",   type: "number", hint: "0.00" },
          ],
        },
        {
          title: "Long-Term Capital Gains (held > 1 year)",
          fields: [
            { key: "sd_lt_proceeds",    label: "Proceeds",                       line: "8b",  type: "number", hint: "0.00" },
            { key: "sd_lt_basis",       label: "Cost Basis",                     line: "8b",  type: "number", hint: "0.00" },
            { key: "sd_lt_gain",        label: "Long-Term Gain / Loss",          line: "15",  type: "number", hint: "0.00" },
          ],
        },
        {
          title: "Summary",
          fields: [
            { key: "sd_net_gain",       label: "Line 16 — Net Capital Gain/Loss",line: "16",  type: "number", hint: "0.00" },
          ],
        },
      ],
    },

    // ── FORM 8829 ─────────────────────────────────────────────
    {
      form: "form_8829" as IrsForm,
      sections: [
        {
          title: "Part I — Area of Home Used for Business",
          fields: [
            { key: "f8829_business_sqft",label: "Business Area (sq ft)",         line: "1",   type: "number", hint: "0" },
            { key: "f8829_total_sqft",   label: "Total Home Area (sq ft)",       line: "2",   type: "number", hint: "0" },
            { key: "f8829_pct",          label: "Business Use %",                line: "3",   type: "readonly",hint: "0%",                           computed: (_s, f) => {
              const biz = parseFloat(f["f8829_business_sqft"] || "0");
              const tot = parseFloat(f["f8829_total_sqft"] || "0");
              return tot > 0 ? (biz / tot * 100).toFixed(1) + "%" : "0%";
            }},
          ],
        },
        {
          title: "Part II — Deductible Expenses",
          fields: [
            { key: "f8829_rent",         label: "Line 19 — Rent",                line: "19",  type: "number", hint: "0.00" },
            { key: "f8829_utilities",    label: "Line 21 — Utilities",           line: "21",  type: "number", hint: "0.00" },
            { key: "f8829_insurance",    label: "Line 14 — Insurance",           line: "14",  type: "number", hint: "0.00" },
            { key: "f8829_repairs",      label: "Line 15 — Repairs",             line: "15",  type: "number", hint: "0.00" },
            { key: "f8829_total_exp",    label: "Line 22 — Total Expenses",      line: "22",  type: "number", hint: "0.00" },
            { key: "f8829_deduction",    label: "Line 35 — Allowable Deduction", line: "35",  type: "number", hint: "0.00" },
          ],
        },
      ],
    },

    // ── FORM 4562 ─────────────────────────────────────────────
    {
      form: "form_4562" as IrsForm,
      sections: [
        {
          title: "Section 179 Deduction",
          fields: [
            { key: "f4562_sec179_cost",  label: "Line 6 — Cost of Property",     line: "6",   type: "number", hint: "0.00" },
            { key: "f4562_sec179_ded",   label: "Line 12 — Section 179 Deduction",line: "12",  type: "number", hint: "0.00" },
          ],
        },
        {
          title: "MACRS Depreciation",
          fields: [
            { key: "f4562_macrs_basis",  label: "Basis for Depreciation",        line: "19",  type: "number", hint: "0.00" },
            { key: "f4562_macrs_depr",   label: "Depreciation Deduction",        line: "22",  type: "number", hint: "0.00" },
          ],
        },
      ],
    },

    // ── FORM 8283 ─────────────────────────────────────────────
    {
      form: "form_8283" as IrsForm,
      sections: [
        {
          title: "Noncash Charitable Contributions",
          fields: [
            { key: "f8283_org_name",     label: "Organization Name",             line: "A",   type: "text",   hint: "" },
            { key: "f8283_date_acq",     label: "Date Acquired",                 line: "B",   type: "text",   hint: "" },
            { key: "f8283_date_don",     label: "Date of Contribution",          line: "C",   type: "text",   hint: "" },
            { key: "f8283_fmv",          label: "Fair Market Value",             line: "D",   type: "number", hint: "0.00" },
            { key: "f8283_cost_basis",   label: "Cost Basis",                    line: "E",   type: "number", hint: "0.00" },
            { key: "f8283_deduction",    label: "Deduction Claimed",             line: "F",   type: "number", hint: "0.00" },
          ],
        },
      ],
    },
  ];
}

// ─── FORM STATUS BADGE ────────────────────────────────────────

function FormStatusBadge({ form, fields }: { form: IrsForm; fields: Record<string, string> }) {
  const def = buildFormDefinitions({} as IncomeSummary).find((d) => d.form === form);
  if (!def) return null;

  const required = def.sections
    .flatMap((s) => s.fields)
    .filter((f) => f.type !== "readonly" && f.type !== "divider");
  const filled = required.filter((f) => (fields[f.key] ?? "").trim() !== "");
  const pct = required.length > 0 ? Math.round((filled.length / required.length) * 100) : 100;

  if (pct === 100) return <Badge className="bg-green-600 text-white text-xs">Complete</Badge>;
  if (pct >= 50)   return <Badge className="bg-yellow-600 text-white text-xs">{pct}% filled</Badge>;
  return <Badge className="bg-red-600 text-white text-xs">Needs data</Badge>;
}

// ─── SINGLE FORM PANEL ────────────────────────────────────────

interface FormPanelProps {
  form: IrsForm;
  summary: IncomeSummary;
  fields: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

function FormPanel({ form, summary, fields, onChange }: FormPanelProps) {
  const defs = buildFormDefinitions(summary);
  const def = defs.find((d) => d.form === form);
  if (!def) return null;

  const meta = IRS_FORM_META[form];

  return (
    <div className="space-y-6">
      {/* Form header */}
      <div
        className="p-4 rounded-lg border"
        style={{ background: `${BRAND.amber}11`, borderColor: `${BRAND.amber}33` }}
      >
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 shrink-0 mt-0.5" style={{ color: BRAND.amber }} />
          <div>
            <p className="text-white font-bold">{meta.label}</p>
            <p className="text-gray-400 text-sm">{meta.description}</p>
          </div>
        </div>
      </div>

      {/* Sections */}
      {def.sections.map((section) => (
        <div key={section.title} className="space-y-3">
          <h4 className="text-gray-300 text-xs font-semibold uppercase tracking-wider border-b border-white/10 pb-1">
            {section.title}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {section.fields.map((field) => {
              if (field.type === "divider") {
                return <div key={field.key} className="sm:col-span-2 border-t border-white/10" />;
              }

              // Compute value if field has a computed function and no user override
              const computedVal = field.computed ? field.computed(summary, fields) : undefined;
              const displayVal = fields[field.key] ?? computedVal ?? "";

              return (
                <div key={field.key} className="space-y-1">
                  <Label className="text-gray-400 text-xs flex items-center gap-1">
                    {field.line && (
                      <span
                        className="px-1.5 py-0.5 rounded text-xs font-mono"
                        style={{ background: `${BRAND.amber}22`, color: BRAND.amber }}
                      >
                        {field.line}
                      </span>
                    )}
                    {field.label}
                    {field.type === "readonly" && (
                      <span className="text-gray-600 text-xs ml-1">(auto)</span>
                    )}
                  </Label>
                  {field.type === "readonly" ? (
                    <div className="px-3 py-2 rounded-md bg-white/5 border border-white/10 text-gray-300 text-sm font-mono">
                      {displayVal || "—"}
                    </div>
                  ) : (
                    <Input
                      type={field.type === "number" ? "number" : "text"}
                      step={field.type === "number" ? "0.01" : undefined}
                      min={field.type === "number" ? "0" : undefined}
                      value={displayVal}
                      placeholder={field.hint}
                      onChange={(e) => onChange(field.key, e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-600 text-sm font-mono"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* IRS disclaimer */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
        <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
        <p className="text-gray-500 text-xs">
          This is a reference preview only — not an official IRS form. Consult a licensed tax
          professional or use IRS Free File for official filing. All values are estimates based on
          data entered in the Income Source Manager.
        </p>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────

interface TaxFormViewerProps {
  defaultPersonId?: string;
  taxYear?: number;
}

export function TaxFormViewer({
  defaultPersonId,
  taxYear = currentTaxYear(),
}: TaxFormViewerProps) {
  const persons = getPersons();
  const [selectedPersonId, setSelectedPersonId] = useState<string>(
    defaultPersonId ?? persons[0]?.id ?? ""
  );
  const [selectedForm, setSelectedForm] = useState<IrsForm>("1040");
  const [formFields, setFormFields] = useState<Record<IrsForm, Record<string, string>>>(
    {} as Record<IrsForm, Record<string, string>>
  );
  const [expandedForms, setExpandedForms] = useState<Set<IrsForm>>(new Set(["1040"]));

  const summary = computeIncomeSummary(selectedPersonId, taxYear);
  const requiredForms = determineRequiredForms(selectedPersonId, taxYear);

  const handlePersonChange = (id: string) => {
    setSelectedPersonId(id);
  };

  const getFieldsForForm = useCallback(
    (form: IrsForm): Record<string, string> => {
      return formFields[form] ?? {};
    },
    [formFields]
  );

  const handleFieldChange = (form: IrsForm, key: string, value: string) => {
    setFormFields((prev) => ({
      ...prev,
      [form]: { ...(prev[form] ?? {}), [key]: value },
    }));
  };

  const handleAutoFill = (form: IrsForm) => {
    const defs = buildFormDefinitions(summary);
    const def = defs.find((d) => d.form === form);
    if (!def) return;

    const autoFilled: Record<string, string> = {};
    def.sections.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.computed) {
          autoFilled[field.key] = field.computed(summary, getFieldsForForm(form));
        }
      });
    });

    setFormFields((prev) => ({
      ...prev,
      [form]: { ...(prev[form] ?? {}), ...autoFilled },
    }));
  };

  const handleExportCSV = (form: IrsForm) => {
    const fields = getFieldsForForm(form);
    const defs = buildFormDefinitions(summary);
    const def = defs.find((d) => d.form === form);
    if (!def) return;

    let csv = `Tax Form Export — ${IRS_FORM_META[form].label}\nTax Year: ${taxYear}\n\n`;
    csv += "Line,Field,Value\n";
    def.sections.forEach((section) => {
      csv += `\n[${section.title}]\n`;
      section.fields.forEach((field) => {
        if (field.type !== "divider") {
          const computedVal = field.computed ? field.computed(summary, fields) : "";
          const val = fields[field.key] ?? computedVal ?? "";
          csv += `"${field.line ?? ""}","${field.label}","${val}"\n`;
        }
      });
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${IRS_FORM_META[form].label.replace(/\s+/g, "_")}_${taxYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleFormExpand = (form: IrsForm) => {
    setExpandedForms((prev) => {
      const next = new Set(prev);
      if (next.has(form)) {
        next.delete(form);
      } else {
        next.add(form);
      }
      return next;
    });
    setSelectedForm(form);
  };

  const selectedPerson = persons.find((p) => p.id === selectedPersonId);

  // ─── RENDER ────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="p-2 rounded-lg"
          style={{ background: `${BRAND.crimson}22`, border: `1px solid ${BRAND.crimson}44` }}
        >
          <FileText className="w-5 h-5" style={{ color: BRAND.crimson }} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Tax Form Viewer</h3>
          <p className="text-sm text-gray-400">
            Auto-generated form previews based on income data · Tax Year {taxYear}
          </p>
        </div>
      </div>

      {/* Person Selector */}
      <div className="flex flex-wrap gap-2">
        {persons.map((p) => (
          <button
            key={p.id}
            onClick={() => handlePersonChange(p.id)}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all"
            style={
              selectedPersonId === p.id
                ? { background: BRAND.crimson, color: "#fff" }
                : { background: "rgba(255,255,255,0.1)", color: "#ccc" }
            }
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Required forms summary */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-gray-400 text-sm">Required forms for {selectedPerson?.name}:</span>
        {requiredForms.map((f) => (
          <button
            key={f}
            onClick={() => {
              setSelectedForm(f);
              setExpandedForms((prev) => new Set([...prev, f]));
            }}
            className="px-3 py-1 rounded-full text-xs font-medium transition-all"
            style={
              selectedForm === f
                ? { background: BRAND.crimson, color: "#fff" }
                : { background: "rgba(255,255,255,0.1)", color: "#ccc" }
            }
          >
            {IRS_FORM_META[f].label}
          </button>
        ))}
      </div>

      {/* Income summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Gross Income",     value: `$${summary.total_gross.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,     color: BRAND.amber },
          { label: "Self-Employment",  value: `$${summary.total_self_employ.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: BRAND.gold },
          { label: "Total Deductions", value: `$${summary.total_deductible.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: "#4ade80" },
          { label: "Est. AGI",         value: `$${summary.estimated_agi.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,    color: BRAND.volt },
        ].map((card) => (
          <Card key={card.label} className="bg-white/5 border-white/10">
            <CardContent className="pt-3 pb-3">
              <p className="text-gray-400 text-xs mb-1">{card.label}</p>
              <p className="text-lg font-bold" style={{ color: card.color }}>{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Form panels */}
      <div className="space-y-3">
        {requiredForms.map((form) => {
          const meta = IRS_FORM_META[form];
          const isExpanded = expandedForms.has(form);
          const fields = getFieldsForForm(form);

          return (
            <div
              key={form}
              className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
            >
              {/* Form header row */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-all"
                onClick={() => toggleFormExpand(form)}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-white font-semibold">{meta.label}</p>
                    <p className="text-gray-400 text-xs">{meta.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FormStatusBadge form={form} fields={fields} />
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded form content */}
              {isExpanded && (
                <div className="border-t border-white/10 p-4 space-y-4">
                  {/* Action bar */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAutoFill(form)}
                      className="text-black text-xs font-bold"
                      style={{ background: BRAND.amber }}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Auto-Fill from Data
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExportCSV(form)}
                      className="border-white/20 text-gray-300 hover:bg-white/10 text-xs"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Export CSV
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handlePrint}
                      className="border-white/20 text-gray-300 hover:bg-white/10 text-xs"
                    >
                      <Printer className="w-3 h-3 mr-1" />
                      Print
                    </Button>
                  </div>

                  {/* Form fields */}
                  <FormPanel
                    form={form}
                    summary={summary}
                    fields={fields}
                    onChange={(key, value) => handleFieldChange(form, key, value)}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Empty state */}
        {requiredForms.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              No income sources entered yet for {selectedPerson?.name}.
            </p>
            <p className="text-xs mt-1 text-gray-600">
              Add income sources in the Income Source Manager to generate required forms.
            </p>
          </div>
        )}
      </div>

      {/* All available forms (non-required) */}
      {requiredForms.length > 0 && (
        <div className="space-y-2">
          <p className="text-gray-500 text-xs uppercase tracking-wider">
            Other Available Forms (not currently required)
          </p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(IRS_FORM_META) as IrsForm[])
              .filter((f) => !requiredForms.includes(f))
              .map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setSelectedForm(f);
                    setExpandedForms((prev) => new Set([...prev, f]));
                  }}
                  className="px-3 py-1 rounded-full text-xs border border-white/10 text-gray-500 hover:text-white hover:border-white/30 transition-all"
                >
                  {IRS_FORM_META[f].label}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TaxFormViewer;
