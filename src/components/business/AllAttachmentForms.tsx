// ============================================================
// ALL ATTACHMENT FORMS — Comprehensive IRS & Business Forms List
// Provides a discoverable, accessible list of all tax forms,
// attachments, and schedules relevant to a review business Corp
// and 1099 filer — including EV, trade-in, write-offs, Corp forms.
// ============================================================

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Car,
  Home,
  DollarSign,
  Briefcase,
  Heart,
  Receipt,
  Building2,
  Zap,
  RefreshCw,
} from "lucide-react";

// ─── FORM CATALOG ─────────────────────────────────────────────

export interface AttachmentForm {
  id: string;
  name: string;
  title: string;
  category: string;
  description: string;
  whoFiles: string;
  keyLines?: string;
  tags: string[];
  irsUrl?: string;
  icon: React.ReactNode;
}

const ALL_FORMS: AttachmentForm[] = [
  // ── CORE RETURNS ─────────────────────────────────────────────
  {
    id: "1040",
    name: "Form 1040",
    title: "U.S. Individual Income Tax Return",
    category: "Core Returns",
    description: "The main individual income tax return. Every filer submits this regardless of income type.",
    whoFiles: "All individuals",
    keyLines: "Lines 1–28 income, deductions, credits, tax owed",
    tags: ["required", "individual", "annual"],
    irsUrl: "https://www.irs.gov/forms-pubs/about-form-1040",
    icon: <FileText size={18} />,
  },
  {
    id: "1040-se",
    name: "Schedule SE",
    title: "Self-Employment Tax",
    category: "Core Returns",
    description: "Calculates SE tax (15.3%) on net self-employment income from Schedule C when net profit > $400.",
    whoFiles: "Self-employed, 1099-NEC/MISC recipients, Vine reviewers",
    keyLines: "Line 3 net profit, Line 12 SE tax",
    tags: ["self-employment", "1099", "vine", "review business"],
    irsUrl: "https://www.irs.gov/forms-pubs/about-schedule-se-form-1040",
    icon: <DollarSign size={18} />,
  },
  {
    id: "schedule_c",
    name: "Schedule C",
    title: "Profit or Loss from Business (Sole Proprietorship)",
    category: "Core Returns",
    description: "Reports income and expenses for sole proprietorship, gig work, or Vine / review business. Net profit flows to 1040.",
    whoFiles: "Sole props, freelancers, 1099-NEC filers, Amazon Vine reviewers",
    keyLines: "Part I: Gross income. Part II: Business expenses. Line 31: Net profit/loss",
    tags: ["schedule c", "business", "vine", "review", "1099", "write-offs"],
    irsUrl: "https://www.irs.gov/forms-pubs/about-schedule-c-form-1040",
    icon: <Briefcase size={18} />,
  },
  // ── 1099 FORMS ───────────────────────────────────────────────
  {
    id: "1099-nec",
    name: "Form 1099-NEC",
    title: "Nonemployee Compensation",
    category: "1099 Income",
    description: "Reports non-employee compensation ≥$600. Amazon issues this for Vine ETV income. Must reconcile on Schedule C.",
    whoFiles: "Received by Amazon Vine reviewers and freelancers",
    keyLines: "Box 1: Nonemployee compensation",
    tags: ["1099", "vine", "amazon", "nonemployee", "freelance"],
    irsUrl: "https://www.irs.gov/forms-pubs/about-form-1099-nec",
    icon: <Receipt size={18} />,
  },
  {
    id: "1099-misc",
    name: "Form 1099-MISC",
    title: "Miscellaneous Information",
    category: "1099 Income",
    description: "Reports royalties, prizes, rents, and other miscellaneous income ≥$600 (not NEC).",
    whoFiles: "Received by contractors, landlords, prize winners",
    tags: ["1099", "misc", "royalties", "rent"],
    irsUrl: "https://www.irs.gov/forms-pubs/about-form-1099-misc",
    icon: <Receipt size={18} />,
  },
  {
    id: "1099-k",
    name: "Form 1099-K",
    title: "Payment Card and Third Party Network Transactions",
    category: "1099 Income",
    description: "Reports payments processed via PayPal, Stripe, Amazon Pay, etc. Threshold: >$600 (2024+).",
    whoFiles: "Sellers on Amazon, eBay, Etsy; PayPal/Stripe users",
    tags: ["1099", "payment processor", "marketplace", "amazon"],
    irsUrl: "https://www.irs.gov/forms-pubs/about-form-1099-k",
    icon: <Receipt size={18} />,
  },
  {
    id: "ssa-1099",
    name: "SSA-1099",
    title: "Social Security Benefit Statement",
    category: "1099 Income",
    description: "Reports Social Security / disability benefits. Up to 85% may be taxable depending on combined income.",
    whoFiles: "Social Security / SSDI recipients",
    keyLines: "Box 5: Net benefits",
    tags: ["ssa", "disability", "social security", "ssdi"],
    icon: <Heart size={18} />,
  },
  // ── DEDUCTION SCHEDULES ──────────────────────────────────────
  {
    id: "schedule_e",
    name: "Schedule E",
    title: "Supplemental Income and Loss",
    category: "Deduction Schedules",
    description: "Reports rental property income/loss, S-Corp K-1 income, and partnership income.",
    whoFiles: "Landlords, rental property owners (e.g. Rocky Mountain Rentals)",
    keyLines: "Part I: Rental income/expenses. Line 26: Net income/loss",
    tags: ["rental", "schedule e", "passive income", "landlord"],
    irsUrl: "https://www.irs.gov/forms-pubs/about-schedule-e-form-1040",
    icon: <Home size={18} />,
  },
  {
    id: "schedule_d",
    name: "Schedule D",
    title: "Capital Gains and Losses",
    category: "Deduction Schedules",
    description: "Reports sale of capital assets — stocks, crypto, property. Short-term vs. long-term treatment.",
    whoFiles: "Anyone who sold investments, property, or business assets",
    tags: ["capital gains", "investments", "assets", "sale"],
    irsUrl: "https://www.irs.gov/forms-pubs/about-schedule-d-form-1040",
    icon: <DollarSign size={18} />,
  },
  {
    id: "form_8829",
    name: "Form 8829",
    title: "Expenses for Business Use of Your Home",
    category: "Deduction Schedules",
    description: "Calculates home office deduction. Method: actual expenses × business % OR simplified ($5/sq ft, max 300 sq ft).",
    whoFiles: "Self-employed filers with dedicated home office space",
    keyLines: "Line 7: Business sq ft. Line 8: Total home sq ft. Line 35: Deductible amount",
    tags: ["home office", "deduction", "self-employed"],
    irsUrl: "https://www.irs.gov/forms-pubs/about-form-8829",
    icon: <Home size={18} />,
  },
  // ── VEHICLE FORMS ─────────────────────────────────────────────
  {
    id: "form_8936",
    name: "Form 8936",
    title: "Clean Vehicle Credits",
    category: "Vehicle Forms",
    description: "Claims tax credit for new/used clean vehicle (EV, plug-in hybrid). Business vehicles get up to $7,500. Partial for personal use. Requires VIN, purchase date.",
    whoFiles: "Business owners who purchased a new or used EV/PHEV for business use",
    keyLines: "Part I: Vehicle info & VIN. Part II: Credit amount (business %). Line 15: Credit claimed",
    tags: ["electric vehicle", "ev", "clean vehicle", "tax credit", "tesla", "business car"],
    irsUrl: "https://www.irs.gov/forms-pubs/about-form-8936",
    icon: <Zap size={18} />,
  },
  {
    id: "form_4797",
    name: "Form 4797",
    title: "Sales of Business Property",
    category: "Vehicle Forms",
    description: "Reports gain or loss when you sell, trade-in, or dispose of business property including vehicles. Trade-in value may create taxable gain.",
    whoFiles: "Anyone selling/trading business vehicles or real property",
    keyLines: "Part I: Long-term gains. Part II: Ordinary gains. Part III: Section 1245/1250 recapture",
    tags: ["trade-in", "vehicle sale", "business property", "disposal", "section 1245"],
    irsUrl: "https://www.irs.gov/forms-pubs/about-form-4797",
    icon: <RefreshCw size={18} />,
  },
  {
    id: "form_2106",
    name: "Form 2106",
    title: "Employee Business Expenses",
    category: "Vehicle Forms",
    description: "W-2 employees deduct unreimbursed business expenses: vehicle mileage, tools, uniforms. (Post-TCJA: mainly Armed Forces, performing artists, fee-basis officials.)",
    whoFiles: "Qualifying W-2 employees with unreimbursed vehicle/uniform expenses",
    keyLines: "Part I: Employee expenses. Part II: Vehicle information",
    tags: ["vehicle", "mileage", "employee expenses", "w2", "unreimbursed"],
    irsUrl: "https://www.irs.gov/forms-pubs/about-form-2106",
    icon: <Car size={18} />,
  },
  {
    id: "form_4562",
    name: "Form 4562",
    title: "Depreciation and Amortization",
    category: "Vehicle Forms",
    description: "Claims depreciation on business property including vehicles. Section 179 expensing (up to $1.16M in 2024) and bonus depreciation for vehicles/equipment.",
    whoFiles: "Self-employed with business vehicles, equipment, or rental property",
    keyLines: "Part I: Section 179. Part V: Listed property (vehicles). Line 30: Vehicle business use %",
    tags: ["depreciation", "section 179", "vehicle", "equipment", "bonus depreciation"],
    irsUrl: "https://www.irs.gov/forms-pubs/about-form-4562",
    icon: <Car size={18} />,
  },
  // ── CORPORATION / S-CORP ─────────────────────────────────────
  {
    id: "form_1120s",
    name: "Form 1120-S",
    title: "U.S. Income Tax Return for an S Corporation",
    category: "Corporate Returns",
    description: "Annual return for S-Corporations. Income passes through to shareholders via K-1. Used if Freedom Angel Corps or review business is an S-Corp.",
    whoFiles: "S-Corporation entities",
    tags: ["s-corp", "corporate", "k-1", "pass-through", "fac"],
    irsUrl: "https://www.irs.gov/forms-pubs/about-form-1120-s",
    icon: <Building2 size={18} />,
  },
  {
    id: "form_1120s_k1",
    name: "Schedule K-1 (1120-S)",
    title: "Shareholder's Share of Income, Deductions, Credits",
    category: "Corporate Returns",
    description: "Reports each shareholder's share of S-Corp income, losses, and credits. Shareholder attaches to personal 1040.",
    whoFiles: "S-Corp shareholders",
    tags: ["s-corp", "k-1", "shareholder", "pass-through"],
    irsUrl: "https://www.irs.gov/forms-pubs/about-form-1120-s",
    icon: <Building2 size={18} />,
  },
  {
    id: "form_1065",
    name: "Form 1065",
    title: "U.S. Return of Partnership Income",
    category: "Corporate Returns",
    description: "Annual return for partnerships and multi-member LLCs. Income passes through via K-1.",
    whoFiles: "Partnerships, multi-member LLCs",
    tags: ["partnership", "llc", "k-1", "multi-member"],
    irsUrl: "https://www.irs.gov/forms-pubs/about-form-1065",
    icon: <Building2 size={18} />,
  },
  // ── HEALTH & BENEFITS ────────────────────────────────────────
  {
    id: "schedule_1_line17",
    name: "Schedule 1 (Line 17)",
    title: "Self-Employed Health Insurance Deduction",
    category: "Health & Benefits",
    description: "Self-employed filers can deduct 100% of health insurance premiums (medical, dental, vision) paid for self and family. Reduces AGI — not an itemized deduction.",
    whoFiles: "Self-employed filers who pay their own health insurance",
    tags: ["health insurance", "self-employed", "agi deduction", "schedule 1"],
    icon: <Heart size={18} />,
  },
  {
    id: "form_5498_sep",
    name: "Form 5498 / SEP-IRA",
    title: "IRA Contribution Information",
    category: "Health & Benefits",
    description: "Tracks SEP-IRA, SIMPLE IRA, Solo 401(k) contributions. Deduction up to 25% of net SE income for SEP-IRA.",
    whoFiles: "Self-employed with SEP-IRA or Solo 401(k)",
    tags: ["retirement", "sep-ira", "401k", "contribution", "deduction"],
    icon: <DollarSign size={18} />,
  },
  // ── CHARITABLE / INVENTORY ───────────────────────────────────
  {
    id: "form_8283",
    name: "Form 8283",
    title: "Noncash Charitable Contributions",
    category: "Charitable",
    description: "Required when non-cash charitable donations (goods, inventory, property) exceed $500. Appraiser signature required if > $5,000.",
    whoFiles: "Donors of noncash property, Vine reviewers donating products",
    keyLines: "Section A (≤$5,000): Donee org, description, FMV. Section B (>$5,000): Appraisal summary",
    tags: ["charitable", "donations", "vine", "inventory", "8283", "noncash"],
    irsUrl: "https://www.irs.gov/forms-pubs/about-form-8283",
    icon: <Heart size={18} />,
  },
  {
    id: "form_8582",
    name: "Form 8582",
    title: "Passive Activity Loss Limitations",
    category: "Rental / Passive",
    description: "Limits deductible passive activity losses (rental, limited partnership). Passive losses can only offset passive income unless special exception applies.",
    whoFiles: "Rental property owners, passive investors",
    tags: ["rental", "passive", "loss limitation", "landlord"],
    irsUrl: "https://www.irs.gov/forms-pubs/about-form-8582",
    icon: <Home size={18} />,
  },
];

const CATEGORIES = [...new Set(ALL_FORMS.map((f) => f.category))];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Core Returns": <FileText size={16} />,
  "1099 Income": <Receipt size={16} />,
  "Deduction Schedules": <DollarSign size={16} />,
  "Vehicle Forms": <Car size={16} />,
  "Corporate Returns": <Building2 size={16} />,
  "Health & Benefits": <Heart size={16} />,
  "Charitable": <Heart size={16} />,
  "Rental / Passive": <Home size={16} />,
};

// ─── COMPONENT ────────────────────────────────────────────────

interface Props {
  compact?: boolean;
}

export function AllAttachmentForms({ compact = false }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = ALL_FORMS.filter((f) => {
    const matchCat = activeCategory === "All" || f.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      f.name.toLowerCase().includes(q) ||
      f.title.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q) ||
      f.tags.some((t) => t.includes(q));
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: "linear-gradient(135deg, #FF6B2B, #FFB347)" }}
        >
          <FileText size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Tax Attachment Forms</h2>
          <p className="text-sm text-gray-400">
            All IRS forms & schedules for your review business · 1099 · Corp · EV
          </p>
        </div>
        <Badge className="ml-auto bg-orange-500/20 text-orange-300 border-orange-500/30">
          {ALL_FORMS.length} forms
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search forms… (e.g. vehicle, 1099, EV, home office)"
          className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
          aria-label="Search tax forms"
        />
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        {["All", ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeCategory === cat
                ? "bg-orange-500 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
            aria-pressed={activeCategory === cat}
          >
            {cat !== "All" && CATEGORY_ICONS[cat]}
            {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-500" aria-live="polite">
        Showing {filtered.length} of {ALL_FORMS.length} forms
      </p>

      {/* Form list */}
      <div className="space-y-2" role="list" aria-label="Tax forms list">
        {filtered.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            No forms match your search. Try a different keyword.
          </div>
        )}
        {filtered.map((form) => {
          const isExpanded = expandedIds.has(form.id);
          return (
            <div
              key={form.id}
              role="listitem"
              className="rounded-xl border border-white/10 bg-white/5 transition-colors hover:bg-white/8"
            >
              <button
                className="flex w-full items-center gap-3 p-4 text-left"
                onClick={() => toggleExpand(form.id)}
                aria-expanded={isExpanded}
                aria-controls={`form-detail-${form.id}`}
              >
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-white"
                  style={{ background: "rgba(255,107,43,0.2)", border: "1px solid rgba(255,107,43,0.3)" }}
                  aria-hidden="true"
                >
                  {form.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white text-sm">{form.name}</span>
                    <Badge variant="outline" className="border-white/20 text-gray-400 text-xs px-1.5 py-0">
                      {form.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{form.title}</p>
                </div>
                <div className="flex-shrink-0 text-gray-500" aria-hidden="true">
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {/* Expanded detail */}
              <div
                id={`form-detail-${form.id}`}
                hidden={!isExpanded}
                className="border-t border-white/10 px-4 pb-4 pt-3"
              >
                <div className="space-y-3 text-sm">
                  <p className="text-gray-300">{form.description}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Who Files</span>
                      <p className="text-gray-300 mt-0.5">{form.whoFiles}</p>
                    </div>
                    {form.keyLines && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Key Lines</span>
                        <p className="text-gray-300 mt-0.5">{form.keyLines}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {form.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded px-2 py-0.5 text-xs bg-white/10 text-gray-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {form.irsUrl && (
                    <a
                      href={form.irsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors"
                      aria-label={`View ${form.name} on IRS.gov`}
                    >
                      <ExternalLink size={12} />
                      View on IRS.gov
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AllAttachmentForms;
