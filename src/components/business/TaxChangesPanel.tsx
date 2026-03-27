// ============================================================
// TAX CHANGES PANEL
// Curated feed of relevant 2025/2026 federal and Colorado tax
// law changes with source citations. Displayed in the
// Deadlines & Credits tab.
// ============================================================

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ExternalLink, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";

// ─── TYPES ──────────────────────────────────────────────────

export interface TaxChange {
  id: string;
  title: string;
  summary: string;
  detail: string;
  effectiveYear: number;
  jurisdiction: "federal" | "colorado";
  impact: "beneficial" | "neutral" | "adverse" | "watch";
  category: "income" | "credits" | "deductions" | "retirement" | "energy" | "se" | "estate" | "corporate";
  sources: { label: string; url: string }[];
}

// ─── CURATED CHANGES ─────────────────────────────────────────

export const TAX_CHANGES_2025_2026: TaxChange[] = [
  // ── ENERGY CREDITS ─────────────────────────────────────
  {
    id: "irc-25c-2026",
    title: "Heat Pump Credit (§25C) — $2,000 Cap Continues",
    summary: "The Energy Efficient Home Improvement Credit remains 30% of cost, capped at $2,000 for heat pump HVAC. Annual cap — you can claim it every year you install qualifying equipment.",
    detail: "Under the Inflation Reduction Act (IRA), Section 25C credits reset each year. You can claim $2,000 for a heat pump heat/cool system, plus up to $600 each for windows, doors, and insulation, for a potential $3,200 total per year. Requires professional installation and the unit must meet CEE Tier 1 or higher efficiency standard. Claim on Form 5695 Part II.",
    effectiveYear: 2026,
    jurisdiction: "federal",
    impact: "beneficial",
    category: "energy",
    sources: [
      { label: "IRS — Energy Efficient Home Improvement Credit", url: "https://www.irs.gov/credits-deductions/energy-efficient-home-improvement-credit" },
      { label: "IRS Publication 5886 — Clean Energy Tax Incentives", url: "https://www.irs.gov/pub/irs-pdf/p5886.pdf" },
    ],
  },
  {
    id: "irc-25d-2026",
    title: "Solar ITC (§25D) — 30% Through 2032",
    summary: "The Residential Clean Energy Credit stays at 30% with no dollar cap through 2032. Covers solar panels, batteries, and geothermal. Carries forward to future years.",
    detail: "Section 25D provides a 30% nonrefundable credit for solar PV, wind, geothermal, and battery storage installed at your primary or secondary residence. The credit drops to 26% in 2033, then 22% in 2034, and expires after 2034 for residential. Unused credit carries forward indefinitely. Claim on Form 5695 Part I.",
    effectiveYear: 2026,
    jurisdiction: "federal",
    impact: "beneficial",
    category: "energy",
    sources: [
      { label: "IRS — Residential Clean Energy Credit", url: "https://www.irs.gov/credits-deductions/residential-clean-energy-credit" },
      { label: "EnergyStar — Tax Credits for Energy Efficiency", url: "https://www.energystar.gov/about/federal_tax_credits" },
    ],
  },
  {
    id: "heehra-co",
    title: "HEEHRA Rebates — Colorado Rolling Out",
    summary: "The High-Efficiency Electric Home Rebate Act (HEEHRA) provides up to $8,000 for heat pumps and $4,000 for panel upgrades for income-qualified households. Colorado is implementing through CDPHE.",
    detail: "HEEHRA is separate from and stackable with §25C tax credits. Rebates reduce the upfront cost of equipment — you pay less at installation and the rebate goes to the contractor or comes as a check. Income qualification: up to 150% AMI for partial rebates, under 80% AMI for maximum rebates. Colorado AMI for Larimer County (2025) is ~$98,100 for a family of 4. Apply through the Colorado Energy Office or your utility.",
    effectiveYear: 2025,
    jurisdiction: "colorado",
    impact: "beneficial",
    category: "energy",
    sources: [
      { label: "Colorado Energy Office — HEEHRA", url: "https://energyoffice.colorado.gov/climate-programs/clean-energy-incentives/home-energy-rebates" },
      { label: "DOE — HEEHRA Explainer", url: "https://www.energy.gov/scep/home-efficiency-rebates" },
    ],
  },
  // ── SE / SMALL BIZ ──────────────────────────────────────
  {
    id: "se-tax-rate-2026",
    title: "SE Tax Rate — 15.3% Unchanged",
    summary: "Self-employment tax rate remains 15.3% (12.4% Social Security + 2.9% Medicare) on net SE income up to the SS wage base ($176,100 for 2025). 2.9% Medicare continues above the cap.",
    detail: "The SE wage base for Social Security adjusts annually for inflation. For 2025 it is $176,100 (up from $168,600 in 2024). Medicare has no cap. The 0.9% Additional Medicare Tax applies to SE income over $200k single/$250k joint. Remember: 50% of SE tax is deductible from gross income on Schedule 1 Line 15.",
    effectiveYear: 2025,
    jurisdiction: "federal",
    impact: "neutral",
    category: "se",
    sources: [
      { label: "IRS — Self-Employment Tax", url: "https://www.irs.gov/businesses/small-businesses-self-employed/self-employment-tax-social-security-and-medicare-taxes" },
      { label: "SSA — 2025 OASDI Wage Base", url: "https://www.ssa.gov/news/press/factsheets/colafacts2025.pdf" },
    ],
  },
  {
    id: "solo-401k-2025",
    title: "Solo 401(k) Limit — $70,000 in 2025",
    summary: "Solo 401(k) combined employer + employee contribution limit increased to $70,000 for 2025 ($77,500 if age 50+). This is the most powerful retirement shelter for SE filers.",
    detail: "Employee elective deferral: up to $23,500 ($31,000 if 50+). Employer profit-sharing: up to 25% of net SE income. Combined max: $70,000/$77,500. Contributions reduce income tax (not SE tax). Plan must be established by Dec 31 of the tax year; contributions can be made until the filing deadline including extensions. Fidelity, Vanguard, and Schwab offer no-fee Solo 401(k) plans.",
    effectiveYear: 2025,
    jurisdiction: "federal",
    impact: "beneficial",
    category: "retirement",
    sources: [
      { label: "IRS — One-Participant 401(k) Plans", url: "https://www.irs.gov/retirement-plans/one-participant-401k-plans" },
      { label: "IRS Notice 2024-80 — 2025 Retirement Plan Limits", url: "https://www.irs.gov/pub/irs-drop/n-24-80.pdf" },
    ],
  },
  {
    id: "qbi-2026",
    title: "QBI Deduction (§199A) — Expires After 2025 Without Action",
    summary: "The 20% Qualified Business Income deduction for pass-through businesses (Schedule C, S-Corp, partnerships) is currently set to expire Dec 31, 2025 under TCJA sunset rules.",
    detail: "If Congress does not extend the TCJA provisions, the §199A deduction disappears for tax year 2026. This could raise effective SE income tax rates significantly. The deduction currently allows up to 20% of qualified business income to be deducted, subject to W-2 wage and property limitations at higher income levels. Watch for legislation in late 2025.",
    effectiveYear: 2026,
    jurisdiction: "federal",
    impact: "watch",
    category: "se",
    sources: [
      { label: "IRS — Qualified Business Income Deduction", url: "https://www.irs.gov/newsroom/qualified-business-income-deduction" },
      { label: "Tax Policy Center — TCJA Sunset Analysis", url: "https://www.taxpolicycenter.org/briefing-book/what-are-main-provisions-tcja-expire" },
    ],
  },
  // ── STANDARD DEDUCTION ──────────────────────────────────
  {
    id: "std-deduction-2025",
    title: "Standard Deduction — $15,000 Single / $30,000 MFJ (2025)",
    summary: "Standard deduction increased for inflation: $15,000 single (up $400), $30,000 married filing jointly. Head of Household: $22,500.",
    detail: "If your itemized deductions (mortgage interest, charitable contributions, state/local taxes capped at $10k, medical expenses >7.5% AGI) don't exceed the standard deduction, take the standard deduction. For most SE filers with home office and vehicle deductions already taken on Schedule C, the standard deduction is often optimal.",
    effectiveYear: 2025,
    jurisdiction: "federal",
    impact: "beneficial",
    category: "deductions",
    sources: [
      { label: "IRS Rev. Proc. 2024-40 — 2025 Inflation Adjustments", url: "https://www.irs.gov/pub/irs-drop/rp-24-40.pdf" },
    ],
  },
  {
    id: "salt-cap",
    title: "SALT Cap — $10,000 Per Return Through 2025",
    summary: "The $10,000 cap on State and Local Tax (SALT) deductions for itemizers continues through 2025. Scheduled to expire if TCJA sunsets after 2025.",
    detail: "If you itemize, you can deduct state income taxes + property taxes up to $10,000 ($5,000 MFS). This cap particularly hurts high-property-tax states, but is less relevant for standard deduction filers. After 2025, the pre-TCJA unlimited SALT deduction would return — watch for legislative changes.",
    effectiveYear: 2025,
    jurisdiction: "federal",
    impact: "neutral",
    category: "deductions",
    sources: [
      { label: "IRS — SALT Deduction Limit", url: "https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2025" },
    ],
  },
  // ── DISABILITY / ABLE ────────────────────────────────────
  {
    id: "able-age-expansion-2026",
    title: "ABLE Account — Age of Onset Expanded to 46 (2026)",
    summary: "Starting Jan 1, 2026, ABLE accounts are available to individuals with disabilities with onset before age 46 (expanded from age 26). This is a huge change — millions more people qualify.",
    detail: "Under prior law, ABLE accounts required disability onset before age 26. The SECURE 2.0 Act expanded this to age 46, effective January 1, 2026. Colorado's ABLE program is CollegeInvest ABLE. Annual contribution limit: $18,000 (2025). ABLE to Work: employed ABLE beneficiaries can contribute additional earned income up to $15,060 (2025 poverty line). Funds don't affect SSI asset limits.",
    effectiveYear: 2026,
    jurisdiction: "federal",
    impact: "beneficial",
    category: "credits",
    sources: [
      { label: "ABLE National Resource Center — SECURE 2.0", url: "https://www.ablenrc.org/state-review-tool/" },
      { label: "Colorado ABLE Program", url: "https://www.coloradoable.org/" },
      { label: "IRS — ABLE Accounts", url: "https://www.irs.gov/individuals/able-accounts-tax-benefit-for-people-with-disabilities" },
    ],
  },
  // ── COLORADO ─────────────────────────────────────────────
  {
    id: "co-income-tax-2025",
    title: "Colorado Income Tax Rate — 4.25% (Flat)",
    summary: "Colorado's flat income tax rate is 4.25% for 2025 (reduced from 4.4% in 2024 under TABOR refund mechanism). This applies to all Colorado taxable income.",
    detail: "Colorado Proposition HH failed, so the TABOR mechanism reduces the state income tax rate. The 4.25% rate applies to your federal AGI with Colorado modifications. Colorado does not have a separate SE tax. Colorado standard deduction mirrors federal. Colorado also offers a Colorado Earned Income Tax Credit (COEITC) = 25% of federal EITC.",
    effectiveYear: 2025,
    jurisdiction: "colorado",
    impact: "beneficial",
    category: "income",
    sources: [
      { label: "Colorado DOR — Individual Income Tax", url: "https://tax.colorado.gov/individual-income-tax" },
      { label: "COEITC Information", url: "https://tax.colorado.gov/colorado-earned-income-credit" },
    ],
  },
  {
    id: "leap-2025",
    title: "LEAP — Low-Income Energy Assistance Program (Oct–Apr)",
    summary: "LEAP helps with heating bills Oct 1–Apr 30. Apply through Larimer County Human Services. Income limit ~200% FPL ($29,160 for single household in 2025).",
    detail: "LEAP is a federally funded heating assistance program. One payment per season, applied directly to your heating account. You must own or rent your primary residence and pay for your own heating. Eligible fuel types: natural gas, electricity, propane, wood, coal. Larimer County office: (970) 498-7700 or online at larimerhumanservices.org.",
    effectiveYear: 2025,
    jurisdiction: "colorado",
    impact: "beneficial",
    category: "energy",
    sources: [
      { label: "CDHS — LEAP Program", url: "https://cdhs.colorado.gov/leap" },
      { label: "Larimer County Human Services", url: "https://www.larimer.org/humanservices/money-assistance/energy" },
    ],
  },
];

// ─── IMPACT STYLES ───────────────────────────────────────────

const IMPACT_META: Record<TaxChange["impact"], { label: string; color: string; icon: React.ReactNode }> = {
  beneficial: { label: "Beneficial",  color: "#4ade80", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  neutral:    { label: "Neutral",     color: "#94a3b8", icon: <Clock className="w-3.5 h-3.5" /> },
  adverse:    { label: "Adverse",     color: "#f87171", icon: <AlertCircle className="w-3.5 h-3.5" /> },
  watch:      { label: "Watch",       color: "#fbbf24", icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

const CATEGORY_LABELS: Record<TaxChange["category"], string> = {
  income:      "Income Tax",
  credits:     "Credits",
  deductions:  "Deductions",
  retirement:  "Retirement",
  energy:      "Energy",
  se:          "Self-Employment",
  estate:      "Estate",
  corporate:   "Corporate",
};

// ─── COMPONENT ───────────────────────────────────────────────

export function TaxChangesPanel() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaxChange["category"] | "all">("all");

  const filtered =
    filter === "all" ? TAX_CHANGES_2025_2026 : TAX_CHANGES_2025_2026.filter((c) => c.category === filter);

  const categories = Array.from(new Set(TAX_CHANGES_2025_2026.map((c) => c.category)));

  return (
    <Card className="glass-card border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-400" />
          Tax Changes &amp; Updates — 2025/2026
        </CardTitle>
        <p className="text-xs text-gray-400 mt-1">
          Curated changes relevant to SE income, energy, disability, and Colorado filers.
          All items include source citations — click any link to verify.
        </p>
      </CardHeader>
      <CardContent>
        {/* Category filter */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(["all", ...categories] as const).map((cat) => {
            const active = filter === cat;
            const label = cat === "all" ? "All" : CATEGORY_LABELS[cat];
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat as typeof filter)}
                className="text-[11px] px-2.5 py-1 rounded-full border transition"
                style={
                  active
                    ? { background: "#ffffff20", color: "#ffffff", borderColor: "#ffffff40" }
                    : { background: "transparent", color: "#6b7280", borderColor: "#ffffff18" }
                }
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Change cards */}
        <div className="space-y-2">
          {filtered.map((change) => {
            const impact = IMPACT_META[change.impact];
            const isExpanded = expandedId === change.id;

            return (
              <div key={change.id} className="rounded-lg border border-white/10 overflow-hidden">
                <button
                  className="w-full flex items-start gap-3 p-3 text-left hover:bg-white/5 transition"
                  onClick={() => setExpandedId(isExpanded ? null : change.id)}
                >
                  {/* Impact icon */}
                  <div
                    className="flex-shrink-0 mt-0.5 p-1 rounded-md"
                    style={{ color: impact.color, background: `${impact.color}18` }}
                  >
                    {impact.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{change.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                        style={{ color: impact.color, background: `${impact.color}15` }}
                      >
                        {impact.label}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {change.jurisdiction === "federal" ? "🇺🇸 Federal" : "🏔️ Colorado"}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {CATEGORY_LABELS[change.category]}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {change.effectiveYear}+
                      </span>
                    </div>
                    {!isExpanded && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{change.summary}</p>
                    )}
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
                    <p className="text-xs text-gray-300">{change.summary}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{change.detail}</p>

                    {/* Source citations */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Sources</p>
                      {change.sources.map((src) => (
                        <a
                          key={src.url}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 transition"
                        >
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          {src.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
