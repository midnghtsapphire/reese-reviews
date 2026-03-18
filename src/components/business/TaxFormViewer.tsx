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

    // ── FORM 8936 — EV CLEAN VEHICLE CREDIT ──────────────────
    {
      form: "form_8936" as IrsForm,
      sections: [
        {
          title: "Vehicle Information",
          fields: [
            { key: "f8936_make",        label: "Vehicle Make / Model / Year",    line: "1",   type: "text",   hint: "e.g. 2024 Tesla Model Y" },
            { key: "f8936_vin",         label: "Vehicle Identification Number (VIN)", line: "2", type: "text", hint: "17-character VIN" },
            { key: "f8936_purchase_dt", label: "Date of Purchase",               line: "3",   type: "text",   hint: "MM/DD/YYYY" },
            { key: "f8936_battery_kwh", label: "Battery Capacity (kWh)",         line: "4",   type: "number", hint: "0" },
          ],
        },
        {
          title: "Credit Calculation",
          fields: [
            { key: "f8936_vehicle_cost",label: "Line 5 — Cost of Vehicle",       line: "5",   type: "number", hint: "0.00" },
            { key: "f8936_biz_pct",     label: "Line 6 — Business Use %",        line: "6",   type: "number", hint: "100" },
            { key: "f8936_base_credit", label: "Line 7 — Base Credit Amount",    line: "7",   type: "number", hint: "3750.00" },
            { key: "f8936_battery_cred",label: "Line 8 — Battery Credit",        line: "8",   type: "number", hint: "3750.00" },
            { key: "f8936_total_credit",label: "Line 15 — Total Credit (max $7,500)", line: "15", type: "readonly", hint: "", computed: (_s, f) => {
              // NOTE: Simplified calculation. Actual Form 8936 credit depends on
              // AGI phase-outs, manufacturer caps, new vs. used vehicle rules,
              // and transfer election. Consult IRS Pub. 946 or a tax professional.
              const base = parseFloat(f["f8936_base_credit"] || "0");
              const batt = parseFloat(f["f8936_battery_cred"] || "0");
              const pct  = parseFloat(f["f8936_biz_pct"] || "100") / 100;
              return Math.min(7500, (base + batt) * pct).toFixed(2);
            }},
          ],
        },
        {
          title: "Notes",
          fields: [
            { key: "f8936_notes",       label: "EV Purchase Notes / Dealer Name", line: "",   type: "text",   hint: "Dealership, purchase agreement number, etc." },
          ],
        },
      ],
    },

    // ── FORM 4797 — SALE / TRADE-IN OF BUSINESS PROPERTY ─────
    {
      form: "form_4797" as IrsForm,
      sections: [
        {
          title: "Part I — Long-term Capital Gains",
          fields: [
            { key: "f4797_desc",        label: "Description of Property",        line: "1a",  type: "text",   hint: "e.g. 2019 Honda CR-V (trade-in)" },
            { key: "f4797_date_acq",    label: "Date Acquired",                  line: "1b",  type: "text",   hint: "MM/DD/YYYY" },
            { key: "f4797_date_sold",   label: "Date Sold / Traded",             line: "1c",  type: "text",   hint: "MM/DD/YYYY" },
            { key: "f4797_proceeds",    label: "Gross Sales / Trade-in Value",   line: "1d",  type: "number", hint: "0.00" },
            { key: "f4797_cost_basis",  label: "Cost or Adjusted Basis",         line: "1e",  type: "number", hint: "0.00" },
            { key: "f4797_depr_allowed",label: "Depreciation Allowed",           line: "1f",  type: "number", hint: "0.00" },
          ],
        },
        {
          title: "Part II — Ordinary Gains & Losses",
          fields: [
            { key: "f4797_gain_loss",   label: "Line 11 — Gain or (Loss)",       line: "11",  type: "readonly", hint: "", computed: (_s, f) => {
              const proc = parseFloat(f["f4797_proceeds"] || "0");
              const cost = parseFloat(f["f4797_cost_basis"] || "0");
              const depr = parseFloat(f["f4797_depr_allowed"] || "0");
              return (proc - (cost - depr)).toFixed(2);
            }},
            { key: "f4797_recapture",   label: "Sec. 1245 Recapture Amount",     line: "20",  type: "number", hint: "0.00" },
            { key: "f4797_ordinary_gain",label: "Ordinary Gain (Line 22)",       line: "22",  type: "readonly", hint: "", computed: (_s, f) => {
              return Math.min(
                parseFloat(f["f4797_recapture"] || "0"),
                Math.max(0, parseFloat(f["f4797_gain_loss"] || "0"))
              ).toFixed(2);
            }},
          ],
        },
      ],
    },

    // ── FORM 2106 — EMPLOYEE BUSINESS EXPENSES ───────────────
    {
      form: "form_2106" as IrsForm,
      sections: [
        {
          title: "Part I — Employee Business Expenses",
          fields: [
            { key: "f2106_vehicle_exp",  label: "Line 1 — Vehicle Expenses",     line: "1",   type: "number", hint: "0.00" },
            { key: "f2106_parking",      label: "Line 2 — Parking / Tolls",      line: "2",   type: "number", hint: "0.00" },
            { key: "f2106_other",        label: "Line 3 — Other Business Expenses", line: "3", type: "number", hint: "0.00" },
            { key: "f2106_reimbursed",   label: "Line 7 — Employer Reimbursements", line: "7", type: "number", hint: "0.00" },
          ],
        },
        {
          title: "Part II — Vehicle Information",
          fields: [
            { key: "f2106_miles_biz",    label: "Line 11 — Business Miles",      line: "11",  type: "number", hint: "0" },
            { key: "f2106_miles_comm",   label: "Line 12 — Commuting Miles",     line: "12",  type: "number", hint: "0" },
            { key: "f2106_miles_other",  label: "Line 13 — Other Miles",         line: "13",  type: "number", hint: "0" },
            { key: "f2106_std_mileage",  label: "Standard Mileage Rate Used?",   line: "14",  type: "text",   hint: "Yes / No" },
          ],
        },
      ],
    },

    // ── FORM 8582 — PASSIVE ACTIVITY LOSS ────────────────────
    {
      form: "form_8582" as IrsForm,
      sections: [
        {
          title: "Rental / Passive Activity",
          fields: [
            { key: "f8582_net_income",   label: "Line 1a — Net rental income",   line: "1a",  type: "number", hint: "0.00" },
            { key: "f8582_net_loss",     label: "Line 1b — Net rental loss",     line: "1b",  type: "number", hint: "0.00" },
            { key: "f8582_prior_loss",   label: "Line 1c — Prior unallowed loss",line: "1c",  type: "number", hint: "0.00" },
            { key: "f8582_total",        label: "Line 4 — Total",                line: "4",   type: "readonly", hint: "", computed: (_s, f) => {
              const inc  = parseFloat(f["f8582_net_income"] || "0");
              const loss = parseFloat(f["f8582_net_loss"] || "0");
              const prior= parseFloat(f["f8582_prior_loss"] || "0");
              return (inc - loss - prior).toFixed(2);
            }},
          ],
        },
      ],
    },

    // ── FORM 1120-S — S-CORPORATION ──────────────────────────
    {
      form: "form_1120s" as IrsForm,
      sections: [
        {
          title: "Income",
          fields: [
            { key: "f1120s_gross_rec",   label: "Line 1a — Gross Receipts",      line: "1a",  type: "number", hint: "0.00" },
            { key: "f1120s_cogs",        label: "Line 2 — Cost of Goods Sold",   line: "2",   type: "number", hint: "0.00" },
            { key: "f1120s_gross_profit",label: "Line 3 — Gross Profit",         line: "3",   type: "readonly", hint: "", computed: (_s, f) => {
              return Math.max(0, parseFloat(f["f1120s_gross_rec"] || "0") - parseFloat(f["f1120s_cogs"] || "0")).toFixed(2);
            }},
          ],
        },
        {
          title: "Deductions",
          fields: [
            { key: "f1120s_compensation",label: "Line 7 — Compensation of Officers", line: "7", type: "number", hint: "0.00" },
            { key: "f1120s_depreciation",label: "Line 14 — Depreciation",        line: "14",  type: "number", hint: "0.00" },
            { key: "f1120s_total_ded",   label: "Line 20 — Total Deductions",    line: "20",  type: "number", hint: "0.00" },
          ],
        },
      ],
    },

    // ── FORM 1065 — PARTNERSHIP ───────────────────────────────
    {
      form: "form_1065" as IrsForm,
      sections: [
        {
          title: "Income",
          fields: [
            { key: "f1065_gross_rec",    label: "Line 1a — Gross Receipts",      line: "1a",  type: "number", hint: "0.00" },
            { key: "f1065_net_gain",     label: "Line 6 — Net Gain/Loss",        line: "6",   type: "number", hint: "0.00" },
          ],
        },
        {
          title: "Deductions",
          fields: [
            { key: "f1065_salaries",     label: "Line 9 — Salaries & Wages",     line: "9",   type: "number", hint: "0.00" },
            { key: "f1065_total_ded",    label: "Line 21 — Total Deductions",    line: "21",  type: "number", hint: "0.00" },
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
    <div
      className="space-y-0 rounded-lg overflow-hidden"
      style={{
        background: "#fff",
        color: "#000",
        fontFamily: "'Times New Roman', Times, serif",
        border: "2px solid #000",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      }}
      role="region"
      aria-label={`${meta.label} form`}
    >
      {/* IRS Form Header */}
      <div
        style={{
          borderBottom: "2px solid #000",
          padding: "8px 12px",
          background: "#f8f8f8",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8 }}>
          {/* Left: Dept of Treasury */}
          <div style={{ fontSize: 9, lineHeight: 1.4 }}>
            <div style={{ fontWeight: "bold" }}>DEPARTMENT OF THE TREASURY — INTERNAL REVENUE SERVICE</div>
          </div>
          {/* Center: Form name */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: "900", letterSpacing: 1 }}>{meta.label}</div>
            <div style={{ fontSize: 10, fontWeight: "bold" }}>{meta.description.split(" — ")[0]}</div>
          </div>
          {/* Right: OMB / Tax year */}
          <div style={{ textAlign: "right", fontSize: 9 }}>
            <div>OMB No. 1545-0074</div>
            <div style={{ fontWeight: "bold", fontSize: 12 }}>{summary.tax_year}</div>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div style={{ padding: "0" }}>
        {def.sections.map((section, sIdx) => (
          <div key={section.title} style={{ borderBottom: sIdx < def.sections.length - 1 ? "1px solid #999" : undefined }}>
            {/* Section header */}
            <div
              style={{
                background: "#1a1a1a",
                color: "#fff",
                padding: "3px 12px",
                fontSize: 10,
                fontWeight: "bold",
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              {section.title}
            </div>

            {/* Fields */}
            <div>
              {section.fields.map((field, fIdx) => {
                if (field.type === "divider") {
                  return (
                    <div
                      key={field.key}
                      style={{ borderTop: "1px solid #ccc", margin: "0" }}
                    />
                  );
                }

                const computedVal = field.computed ? field.computed(summary, fields) : undefined;
                const displayVal = fields[field.key] ?? computedVal ?? "";
                const isReadonly = field.type === "readonly";
                const isEvenRow = fIdx % 2 === 0;

                return (
                  <div
                    key={field.key}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      alignItems: "center",
                      borderBottom: "1px solid #e0e0e0",
                      background: isEvenRow ? "#fff" : "#fafafa",
                      minHeight: 32,
                    }}
                  >
                    {/* Line number box */}
                    <div
                      style={{
                        width: 40,
                        textAlign: "center",
                        borderRight: "1px solid #ccc",
                        padding: "4px 6px",
                        fontSize: 10,
                        fontWeight: "bold",
                        color: "#1a1a1a",
                        fontFamily: "monospace",
                        minHeight: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: field.line ? "#f0f4ff" : "transparent",
                      }}
                    >
                      {field.line || ""}
                    </div>

                    {/* Label */}
                    <div
                      style={{
                        padding: "4px 10px",
                        fontSize: 11,
                        borderRight: "1px solid #ccc",
                        lineHeight: 1.4,
                      }}
                    >
                      {field.label}
                      {isReadonly && (
                        <span style={{ color: "#666", fontSize: 9, marginLeft: 4 }}>(auto)</span>
                      )}
                    </div>

                    {/* Input / value box */}
                    <div
                      style={{
                        width: 160,
                        padding: "2px 6px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {isReadonly ? (
                        <div
                          style={{
                            width: "100%",
                            textAlign: "right",
                            fontFamily: "monospace",
                            fontSize: 12,
                            fontWeight: "bold",
                            color: "#1a1a1a",
                            borderBottom: "1px solid #666",
                            padding: "1px 4px",
                            minHeight: 22,
                          }}
                          aria-label={`${field.label}: ${displayVal || "0.00"}`}
                        >
                          {displayVal || "—"}
                        </div>
                      ) : (
                        <input
                          type={field.type === "number" ? "number" : "text"}
                          step={field.type === "number" ? "0.01" : undefined}
                          min={field.type === "number" ? "0" : undefined}
                          value={displayVal}
                          placeholder={field.hint || (field.type === "number" ? "0.00" : "")}
                          onChange={(e) => onChange(field.key, e.target.value)}
                          aria-label={field.label}
                          style={{
                            width: "100%",
                            textAlign: field.type === "number" ? "right" : "left",
                            fontFamily: "monospace",
                            fontSize: 12,
                            border: "1px solid #888",
                            background: "#fffef0",
                            padding: "2px 6px",
                            outline: "none",
                          }}
                          onFocus={(e) => { e.target.style.border = "2px solid #0066cc"; }}
                          onBlur={(e) => { e.target.style.border = "1px solid #888"; }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* IRS disclaimer footer */}
      <div
        style={{
          borderTop: "2px solid #000",
          padding: "6px 12px",
          background: "#f0f0f0",
          fontSize: 9,
          color: "#444",
          lineHeight: 1.4,
        }}
      >
        <strong>REFERENCE ONLY — NOT AN OFFICIAL IRS FORM.</strong> This preview is auto-generated from entered
        income data. Consult a licensed tax professional or use IRS Free File / commercial software for official filing.
        Accuracy of computed amounts depends on completeness of data entered in the Income Source Manager.
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
