// ============================================================
// TAX DEADLINES & CREDITS FINDER
// Full-year tax calendar with urgency alerts + curated credits
// checklist for SE-income / disability / solar filers.
// ============================================================

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle2, AlertCircle, Clock, Zap, Sun, Heart, Home, DollarSign, TrendingUp, Info } from "lucide-react";

// ─── TYPES ──────────────────────────────────────────────────

interface TaxDeadline {
  id: string;
  date: string; // YYYY-MM-DD
  label: string;
  description: string;
  forms: string[];
  category: "filing" | "payment" | "issuer" | "election" | "contribution" | "planning";
}

interface TaxCredit {
  id: string;
  title: string;
  form: string;
  maxBenefit: string;
  description: string;
  applies: string;
  icon: React.ReactNode;
  category: "se" | "disability" | "energy" | "retirement" | "care";
  actionNote: string;
}

// ─── DEADLINE DATA ──────────────────────────────────────────

function buildDeadlines(taxYear: number): TaxDeadline[] {
  const y = taxYear;
  const ny = taxYear + 1;
  return [
    // Previous-year filings (issued in Jan/Feb of ny)
    {
      id: "w2-issue",
      date: `${ny}-01-31`,
      label: "W-2s & 1099-NECs Due to Recipients",
      description: "Employers and payers must issue W-2s and 1099-NECs to workers. Amazon issues Vine 1099-NECs by this date.",
      forms: ["1099-NEC", "W-2"],
      category: "issuer",
    },
    {
      id: "q4-est",
      date: `${ny}-01-15`,
      label: `Q4 ${y} Estimated Tax Due`,
      description: `Final quarterly estimated payment for ${y} income. Covers Oct–Dec ${y}. Pay via IRS Direct Pay.`,
      forms: ["1040-ES"],
      category: "payment",
    },
    {
      id: "1099-irs-paper",
      date: `${ny}-02-28`,
      label: "1099s to IRS (Paper)",
      description: "If you file paper 1099s with the IRS, they are due by Feb 28. Electronic filers have until March 31.",
      forms: ["1099-NEC", "1099-MISC"],
      category: "issuer",
    },
    {
      id: "1099-irs-efile",
      date: `${ny}-03-31`,
      label: "1099s to IRS (E-file)",
      description: "Electronic 1099 submissions to IRS are due March 31. This is Audrey's Vine 1099-NEC deadline.",
      forms: ["1099-NEC"],
      category: "issuer",
    },
    {
      id: "return-q1-est",
      date: `${ny}-04-15`,
      label: `Q1 ${ny} Estimated Tax Due + ${y} Return Due`,
      description: `Both your ${y} federal return AND Q1 ${ny} estimated payment are due April 15. File Form 4868 for a 6-month extension (moves return to Oct 15 but does NOT extend payment).`,
      forms: ["1040", "1040-ES", "4868"],
      category: "payment",
    },
    {
      id: "ira-hsa",
      date: `${ny}-04-15`,
      label: `IRA / HSA Contributions for ${y}`,
      description: `You can contribute to a Traditional or Roth IRA for ${y} until April 15. Same deadline for HSA contributions. Solo 401(k) contributions must be made by Dec 31 ${y}.`,
      forms: ["1040", "8889"],
      category: "contribution",
    },
    {
      id: "scorp-election",
      date: `${ny}-03-15`,
      label: "S-Corp Election (Form 2553) Deadline",
      description: `To elect S-Corp status effective Jan 1 ${ny}, Form 2553 must be filed by March 15. Miss this and you wait until ${ny + 1} (unless late election relief applies).`,
      forms: ["2553"],
      category: "election",
    },
    {
      id: "q2-est",
      date: `${ny}-06-16`,
      label: `Q2 ${ny} Estimated Tax Due`,
      description: `Covers Apr–May ${ny} income. Note: only ~2 months of income, not 3.`,
      forms: ["1040-ES"],
      category: "payment",
    },
    {
      id: "q3-est",
      date: `${ny}-09-15`,
      label: `Q3 ${ny} Estimated Tax Due`,
      description: `Covers Jun–Aug ${ny} income.`,
      forms: ["1040-ES"],
      category: "payment",
    },
    {
      id: "extended-return",
      date: `${ny}-10-15`,
      label: `${y} Extended Return Due`,
      description: `If you filed Form 4868 by April 15, your ${y} return is now due. All taxes must have been paid by April 15 to avoid penalties.`,
      forms: ["1040"],
      category: "filing",
    },
    {
      id: "solo-401k",
      date: `${ny}-12-31`,
      label: `Solo 401(k) Plan Setup Deadline`,
      description: `To make ${ny} Solo 401(k) contributions, the plan must be established by Dec 31 ${ny}. Contributions can be made up to the filing deadline. Max contribution: $70k (2026).`,
      forms: ["1040"],
      category: "contribution",
    },
    {
      id: "year-end-charity",
      date: `${ny}-12-31`,
      label: `Charitable Contributions Cut-Off`,
      description: `Cash and noncash charitable donations must be made by Dec 31 to be deductible on ${ny} taxes.`,
      forms: ["1040", "Sch A", "8283"],
      category: "planning",
    },
    {
      id: "q4-next-est",
      date: `${ny + 1}-01-15`,
      label: `Q4 ${ny} Estimated Tax Due`,
      description: `Next year's Q4 estimated payment. Plan ahead — this comes right after the holidays.`,
      forms: ["1040-ES"],
      category: "payment",
    },
  ];
}

// ─── CREDITS DATA ────────────────────────────────────────────

const CREDITS: TaxCredit[] = [
  {
    id: "se-deduction",
    title: "SE Tax Deduction (50%)",
    form: "Sch 1 Line 15",
    maxBenefit: "~$2,825 if SE tax = $5,650",
    description: "You can deduct 50% of your self-employment tax as an above-the-line adjustment. This reduces your adjusted gross income before income tax is calculated — does NOT reduce SE tax itself.",
    applies: "Anyone paying SE tax on Schedule C income",
    icon: <TrendingUp className="w-4 h-4" />,
    category: "se",
    actionNote: "Automatic on Schedule SE → 1040 Sch 1. TurboTax handles this.",
  },
  {
    id: "se-health-ins",
    title: "Self-Employed Health Insurance",
    form: "Sch 1 Line 17",
    maxBenefit: "100% of premiums paid",
    description: "If you pay your own health, dental, or vision insurance and are not eligible for employer coverage, 100% of premiums are deductible above the line. Reduces AGI dollar-for-dollar.",
    applies: "SE filers who pay their own insurance",
    icon: <Heart className="w-4 h-4" />,
    category: "se",
    actionNote: "Enter total premiums paid in TurboTax Self-Employed under health insurance.",
  },
  {
    id: "home-office",
    title: "Home Office Deduction",
    form: "Form 8829",
    maxBenefit: "Percentage of rent/mortgage, utilities, insurance",
    description: "A portion of your home expenses equal to the percentage of your home used exclusively and regularly for business. Can be calculated on actual expenses (8829) or simplified method ($5/sq ft, max 300 sq ft = $1,500 max).",
    applies: "SE filers with a dedicated workspace",
    icon: <Home className="w-4 h-4" />,
    category: "se",
    actionNote: "Measure your dedicated workspace square footage vs. total home square footage.",
  },
  {
    id: "eitc",
    title: "Earned Income Tax Credit (EITC)",
    form: "1040 Sch EIC",
    maxBenefit: "Up to $632 (no children, 2026 est.)",
    description: "Refundable credit for lower-income workers. SE income counts as earned income. Being disabled does not disqualify you. Check the IRS EITC Assistant each year since income thresholds adjust.",
    applies: "SE filers with income below IRS threshold (~$18k single, no kids)",
    icon: <DollarSign className="w-4 h-4" />,
    category: "se",
    actionNote: "TurboTax runs the EITC check automatically. Income and filing status determine eligibility.",
  },
  {
    id: "disability-work-expenses",
    title: "Impairment-Related Work Expenses",
    form: "Sch A / Form 2106",
    maxBenefit: "Actual cost of disability-related work items",
    description: "Expenses you must incur because of your disability to do your job — assistive technology, screen readers, mobility aids, personal attendant costs, etc. These are deductible on Schedule A as a misc. itemized deduction NOT subject to the 2% AGI floor.",
    applies: "Disabled workers (any filing status)",
    icon: <CheckCircle2 className="w-4 h-4" />,
    category: "disability",
    actionNote: "Document every disability-related expense with receipts. Tell your CPA about your disability status.",
  },
  {
    id: "able-account",
    title: "ABLE Account (Tax-Free Savings)",
    form: "State varies",
    maxBenefit: "$18,000/year contribution (2026 est.)",
    description: "ABLE accounts let disabled individuals save up to $18k/year tax-free without affecting SSI asset limits. Colorado's program is CollegeInvest ABLE. Funds can be used for qualified disability expenses. If you work, the ABLE to Work Act lets you contribute your earned income on top of the $18k limit.",
    applies: "Disabled individuals (onset before age 26, or before 46 with 2026 law change)",
    icon: <CheckCircle2 className="w-4 h-4" />,
    category: "disability",
    actionNote: "Open at: ColoradoABLE.com. Doesn't affect SSDI. Helps SSI recipients hold savings above $2k.",
  },
  {
    id: "solar-itc",
    title: "Residential Clean Energy Credit (Solar ITC)",
    form: "Form 5695 Part I",
    maxBenefit: "30% of total solar installation cost — no cap",
    description: "Federal Investment Tax Credit covers 30% of solar panel system cost including installation, batteries, and inverters. On a $20k system = $6,000 credit. It's nonrefundable (can't exceed your tax liability) but carries forward unlimited years. Colorado adds the CBET rebate on top from your utility.",
    applies: "Homeowners installing solar on primary or secondary residence",
    icon: <Sun className="w-4 h-4" />,
    category: "energy",
    actionNote: "Best installed in a high-income year to maximize the credit use. Ask installer for itemized cost breakdown.",
  },
  {
    id: "heat-pump",
    title: "Heat Pump Energy Credit",
    form: "Form 5695 Part II",
    maxBenefit: "Up to $2,000 (30% of cost, max $2k)",
    description: "The Energy Efficient Home Improvement Credit covers 30% of heat pump HVAC installation cost, capped at $2,000. Heat pumps replace gas furnaces and run on electricity — eligible for this credit PLUS potentially LEAP and HEEHRA rebates (see notes). Stackable with solar credit in same year.",
    applies: "Homeowners replacing HVAC with heat pump",
    icon: <Zap className="w-4 h-4" />,
    category: "energy",
    actionNote: "LEAP (Colorado energy assistance) helps pay heating bills. LIWP (Low-Income Weatherization Program) may install heat pump for free — apply through Larimer/Weld County Human Services.",
  },
  {
    id: "ev-credit",
    title: "Clean Vehicle Credit (EV)",
    form: "Form 8936",
    maxBenefit: "Up to $7,500",
    description: "New clean vehicle credit for qualifying EVs. Income limit: $150k single / $300k joint (MAGI). Vehicle MSRP limit: $55k cars, $80k trucks/SUVs. Used EVs get a separate credit up to $4,000. Credit transfers available at dealerships (point-of-sale).",
    applies: "Buyers of new or used qualifying EVs below MAGI threshold",
    icon: <Zap className="w-4 h-4" />,
    category: "energy",
    actionNote: "Confirm vehicle eligibility on fueleconomy.gov before purchase. Dealer can apply credit at sale.",
  },
  {
    id: "solo-401k",
    title: "Solo 401(k) Contributions",
    form: "Sch 1 Line 16",
    maxBenefit: "Up to $70,000/year (2026 est.)",
    description: "As an SE business owner you can contribute as both employee ($23,500 elective deferral) AND employer (up to 25% of net SE income) for a combined max of $70k. All of it is deductible. Reduces income tax but NOT SE tax — so your SS wage record stays high while your income tax drops.",
    applies: "SE filers with net profit. Plan must be established by Dec 31.",
    icon: <DollarSign className="w-4 h-4" />,
    category: "retirement",
    actionNote: "Open a Solo 401(k) through Fidelity, Vanguard, or Schwab before Dec 31. Contributions can be made until filing deadline.",
  },
  {
    id: "sep-ira",
    title: "SEP-IRA Contributions",
    form: "Sch 1 Line 16",
    maxBenefit: "Up to 25% of net SE income, max $69k",
    description: "Simpler alternative to Solo 401(k). Employer-only contributions (up to 25% of net SE income). Easier to set up but lower max than Solo 401(k) for lower income levels. Same SE tax effect — reduces income tax, preserves SS wages.",
    applies: "SE filers who want simplicity over maximum contribution amount",
    icon: <DollarSign className="w-4 h-4" />,
    category: "retirement",
    actionNote: "Can open and fund a SEP-IRA up until your tax filing deadline (including extension).",
  },
  {
    id: "dependent-care",
    title: "Dependent Care Credit",
    form: "Form 2441",
    maxBenefit: "Up to $1,050 (no income limit for SE)",
    description: "Credit for expenses paid so you could work — child care for dependents under 13, OR adult dependent care for a disabled dependent (like a parent). 20–35% of up to $3,000 (one dependent) or $6,000 (two+). You must have earned income to claim it.",
    applies: "Filers with a qualifying dependent and paid care expenses",
    icon: <Heart className="w-4 h-4" />,
    category: "care",
    actionNote: "If Audrey qualifies as your dependent, her care costs may count. Ask your CPA about the dependency test.",
  },
];

// ─── HELPERS ─────────────────────────────────────────────────

function daysFromNow(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyLabel(days: number): { label: string; color: string; bg: string } {
  if (days < 0)   return { label: "Past",      color: "#6b7280", bg: "#6b728018" };
  if (days <= 7)  return { label: "This Week",  color: "#ef4444", bg: "#ef444418" };
  if (days <= 30) return { label: "This Month", color: "#f59e0b", bg: "#f59e0b18" };
  if (days <= 90) return { label: "Soon",       color: "#3b82f6", bg: "#3b82f618" };
  return           { label: "Upcoming",         color: "#6b7280", bg: "#6b728010" };
}

const CATEGORY_META: Record<TaxCredit["category"], { label: string; color: string }> = {
  se:         { label: "Self-Employment",  color: "#a78bfa" },
  disability: { label: "Disability",       color: "#34d399" },
  energy:     { label: "Energy",           color: "#fbbf24" },
  retirement: { label: "Retirement",       color: "#60a5fa" },
  care:       { label: "Dependent Care",   color: "#f472b6" },
};

const DEADLINE_CATEGORY_COLORS: Record<TaxDeadline["category"], string> = {
  filing:       "#a78bfa",
  payment:      "#ef4444",
  issuer:       "#60a5fa",
  election:     "#f59e0b",
  contribution: "#34d399",
  planning:     "#6b7280",
};

// ─── COMPONENT ───────────────────────────────────────────────

interface Props {
  taxYear: number;
}

export function TaxDeadlinesCredits({ taxYear }: Props) {
  const [creditFilter, setCreditFilter] = useState<TaxCredit["category"] | "all">("all");
  const [expandedDeadline, setExpandedDeadline] = useState<string | null>(null);
  const [expandedCredit, setExpandedCredit] = useState<string | null>(null);

  const deadlines = useMemo(() => buildDeadlines(taxYear), [taxYear]);

  const sortedDeadlines = useMemo(() => {
    return [...deadlines].sort((a, b) => {
      const da = daysFromNow(a.date);
      const db = daysFromNow(b.date);
      // Put past at bottom, future ascending
      if (da < 0 && db >= 0) return 1;
      if (db < 0 && da >= 0) return -1;
      return da - db;
    });
  }, [deadlines]);

  const filteredCredits = useMemo(() =>
    creditFilter === "all" ? CREDITS : CREDITS.filter((c) => c.category === creditFilter),
    [creditFilter]
  );

  const upcoming = sortedDeadlines.filter((d) => {
    const days = daysFromNow(d.date);
    return days >= 0 && days <= 30;
  });

  return (
    <div className="space-y-6">
      {/* ── Banner ───────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30 flex-shrink-0">
            <Bell className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Tax Deadlines &amp; Credits Finder</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Tax Year {taxYear} calendar + curated credits for SE income, disability, energy, and retirement.
            </p>
          </div>
        </div>

        {upcoming.length > 0 && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-300">
                {upcoming.length} deadline{upcoming.length !== 1 ? "s" : ""} in the next 30 days
              </p>
              <ul className="mt-1 space-y-0.5">
                {upcoming.map((d) => (
                  <li key={d.id} className="text-xs text-gray-400">
                    <span className="text-white font-medium">{new Date(d.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    {" — "}{d.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* ── Tax Calendar ─────────────────────────────────────── */}
      <Card className="glass-card border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Tax Calendar — {taxYear} / {taxYear + 1}
          </CardTitle>
          <CardDescription className="text-gray-400">
            All key dates for the {taxYear} tax year and {taxYear + 1} filings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {sortedDeadlines.map((dl) => {
            const days = daysFromNow(dl.date);
            const urgency = urgencyLabel(days);
            const isExpanded = expandedDeadline === dl.id;
            const catColor = DEADLINE_CATEGORY_COLORS[dl.category];

            return (
              <div
                key={dl.id}
                className="rounded-lg border border-white/10 overflow-hidden"
                style={{ background: urgency.bg }}
              >
                <button
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition"
                  onClick={() => setExpandedDeadline(isExpanded ? null : dl.id)}
                >
                  {/* Date pill */}
                  <div className="flex-shrink-0 w-14 text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                      {new Date(dl.date + "T12:00:00").toLocaleDateString("en-US", { month: "short" })}
                    </p>
                    <p className="text-lg font-bold text-white leading-none">
                      {new Date(dl.date + "T12:00:00").getDate()}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {new Date(dl.date + "T12:00:00").getFullYear()}
                    </p>
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${days < 0 ? "text-gray-500" : "text-white"} truncate`}>
                      {dl.label}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {dl.forms.map((f) => (
                        <span key={f} className="text-[10px] text-gray-500 bg-white/5 border border-white/10 rounded px-1.5 py-0.5">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Urgency badge */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ color: urgency.color, background: urgency.bg, border: `1px solid ${urgency.color}44` }}
                    >
                      {urgency.label}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ color: catColor, background: `${catColor}18` }}
                    >
                      {dl.category}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-3 pt-1 border-t border-white/10">
                    <p className="text-xs text-gray-300">{dl.description}</p>
                    <p className="text-[10px] text-gray-500 mt-2">
                      {days < 0
                        ? `${Math.abs(days)} days ago`
                        : days === 0
                        ? "Due TODAY"
                        : `${days} days from today`}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ── Credits Finder ───────────────────────────────────── */}
      <Card className="glass-card border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            Credits &amp; Deductions Finder
          </CardTitle>
          <CardDescription className="text-gray-400">
            Curated for SE income, disability, energy improvements, and retirement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(["all", "se", "disability", "energy", "retirement", "care"] as const).map((cat) => {
              const meta = cat === "all" ? { label: "All Credits", color: "#e2e8f0" } : CATEGORY_META[cat];
              const active = creditFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCreditFilter(cat)}
                  className="text-xs px-3 py-1 rounded-full border transition"
                  style={
                    active
                      ? { background: meta.color, color: "#000", borderColor: meta.color }
                      : { background: "transparent", color: meta.color, borderColor: `${meta.color}44` }
                  }
                >
                  {meta.label}
                </button>
              );
            })}
          </div>

          {/* Credit cards */}
          <div className="space-y-2">
            {filteredCredits.map((credit) => {
              const meta = CATEGORY_META[credit.category];
              const isExpanded = expandedCredit === credit.id;

              return (
                <div
                  key={credit.id}
                  className="rounded-lg border border-white/10 overflow-hidden"
                >
                  <button
                    className="w-full flex items-start gap-3 p-3 text-left hover:bg-white/5 transition"
                    onClick={() => setExpandedCredit(isExpanded ? null : credit.id)}
                  >
                    <div
                      className="mt-0.5 p-1.5 rounded-lg flex-shrink-0"
                      style={{ background: `${meta.color}18`, color: meta.color }}
                    >
                      {credit.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-white">{credit.title}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: meta.color, background: `${meta.color}18` }}>
                          {meta.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-gray-500">{credit.form}</span>
                        <span className="text-[10px] font-semibold" style={{ color: meta.color }}>
                          {credit.maxBenefit}
                        </span>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-3 pt-1 border-t border-white/10 space-y-2">
                      <p className="text-xs text-gray-300">{credit.description}</p>
                      <p className="text-xs text-gray-500">
                        <span className="text-gray-400 font-medium">Applies to: </span>
                        {credit.applies}
                      </p>
                      <div className="flex items-start gap-2 rounded-lg bg-white/5 p-2">
                        <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-300">{credit.actionNote}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── SE Tax Strategy Note ─────────────────────────────── */}
      <Card className="glass-card border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            Your SE Tax Strategy: Max It Out
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-gray-400">
          <p>
            <span className="text-white font-medium">Why pay MORE SE tax?</span>{" "}
            Every dollar of SE tax goes onto your Social Security earnings record. Higher lifetime earnings = higher SSDI benefit base + higher future retirement benefit. For someone with a disability history, this is often the opposite of standard advice.
          </p>
          <p>
            <span className="text-white font-medium">The move:</span>{" "}
            Keep income flowing through Schedule C (not S-Corp election yet), maximize your SE tax, take the 50% SE deduction on income tax, and stack retirement contributions (Solo 401k/SEP-IRA) to lower income tax without affecting your SS wages.
          </p>
          <p>
            <span className="text-white font-medium">Software stack when revenue arrives:</span>{" "}
            QuickBooks Self-Employed (~$15/mo) + TurboTax Self-Employed (~$130/yr filing) + Gusto ($40/mo) for payroll when you add employees or put yourself on S-Corp payroll. All of it is 100% deductible as professional services.
          </p>
          <div className="rounded-lg bg-white/5 border border-white/10 p-2 text-[11px] text-gray-500">
            <span className="text-amber-400 font-medium">Colorado programs for energy help:</span>{" "}
            LEAP (Low-income Energy Assistance) helps with heating bills — apply Oct–Apr through Larimer/Weld County. LIWP (Low-Income Weatherization Program) through CDHS may install a heat pump at low/no cost. HEEHRA (federal) provides up to $8,000 rebate on heat pump installation for income-qualified households.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
