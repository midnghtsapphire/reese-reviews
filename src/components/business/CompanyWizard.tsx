// ============================================================
// COMPANY ONBOARDING WIZARD
// Multi-step modal for adding a new business entity to a person.
//
// Steps:
//   1. Select or create the person (filer)
//   2. Business details (name, type, EIN)
//   3. Tax schedule + home office
//   4. Review & confirm
// ============================================================

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Building2, ChevronRight, ChevronLeft, X } from "lucide-react";
import {
  getPersons,
  addPerson,
  addBusinessEntity,
  type TaxPerson,
  type BusinessEntity,
} from "@/stores/taxStore";

// ─── TYPES ──────────────────────────────────────────────────

type BizType = BusinessEntity["type"];
type BizSchedule = BusinessEntity["schedule"];

interface WizardState {
  // Step 1 — person
  mode: "existing" | "new";
  selectedPersonId: string;
  newPersonName: string;
  newPersonRole: TaxPerson["role"];
  newPersonFiling: TaxPerson["filing_status"];
  newPersonNotes: string;

  // Step 2 — business info
  bizName: string;
  bizType: BizType;
  bizEin: string;

  // Step 3 — tax setup
  schedule: BizSchedule;
  homeOffice: boolean;
  bizNotes: string;
}

const BUSINESS_TYPES: { value: BizType; label: string; desc: string }[] = [
  { value: "sole_prop",   label: "Sole Proprietorship",  desc: "Single owner, no formal entity. Files on Schedule C." },
  { value: "llc",         label: "LLC",                  desc: "Limited Liability Company. Can file as sole prop, partnership, or S-Corp." },
  { value: "s_corp",      label: "S-Corporation",        desc: "Pass-through entity. Payroll required for owner." },
  { value: "partnership", label: "Partnership",           desc: "Two or more owners. Files Form 1065." },
  { value: "rental",      label: "Rental / Real Estate",  desc: "Rental income property. Files on Schedule E." },
  { value: "gig",         label: "Gig / Freelance",       desc: "Platform gigs (Uber, DoorDash, Fiverr). Files on Schedule C." },
];

const SCHEDULE_OPTS: { value: BizSchedule; label: string; for: BizType[] }[] = [
  { value: "schedule_c", label: "Schedule C — Profit/Loss from Business", for: ["sole_prop","llc","gig","s_corp"] },
  { value: "schedule_e", label: "Schedule E — Supplemental Income",       for: ["rental","partnership","llc","s_corp"] },
  { value: "schedule_f", label: "Schedule F — Farm Income",               for: ["sole_prop","llc"] },
  { value: "none",       label: "None / Handled by Separate Return",      for: ["s_corp","partnership","llc"] },
];

function defaultSchedule(type: BizType): BizSchedule {
  if (type === "rental")      return "schedule_e";
  if (type === "partnership") return "schedule_e";
  if (type === "s_corp")      return "none";
  return "schedule_c";
}

const STEPS = ["Filer", "Business", "Tax Setup", "Review"] as const;

// ─── COMPONENT ───────────────────────────────────────────────

interface Props {
  onClose: () => void;
  onComplete: (personId: string) => void;
  defaultPersonId?: string;
}

export function CompanyWizard({ onClose, onComplete, defaultPersonId }: Props) {
  const persons = getPersons();

  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>({
    mode: defaultPersonId ? "existing" : (persons.length > 0 ? "existing" : "new"),
    selectedPersonId: defaultPersonId ?? persons[0]?.id ?? "",
    newPersonName: "",
    newPersonRole: "primary",
    newPersonFiling: "single",
    newPersonNotes: "",

    bizName: "",
    bizType: "sole_prop",
    bizEin: "",

    schedule: "schedule_c",
    homeOffice: false,
    bizNotes: "",
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [createdPersonId, setCreatedPersonId] = useState<string | null>(null);

  const patch = (p: Partial<WizardState>) => setState((prev) => ({ ...prev, ...p }));

  // ── Validation ────────────────────────────────────────────

  function canAdvance(): boolean {
    if (step === 0) {
      if (state.mode === "existing") return !!state.selectedPersonId;
      return !!state.newPersonName.trim();
    }
    if (step === 1) return !!state.bizName.trim();
    if (step === 2) return true;
    return true;
  }

  // ── Submit ────────────────────────────────────────────────

  function handleSubmit() {
    setSaving(true);
    try {
      let personId = state.selectedPersonId;

      if (state.mode === "new") {
        const p = addPerson({
          name: state.newPersonName.trim(),
          slug: state.newPersonName.trim().toLowerCase().replace(/\s+/g, "-"),
          role: state.newPersonRole,
          filing_status: state.newPersonFiling,
          businesses: [],
          notes: state.newPersonNotes,
        });
        personId = p.id;
        setCreatedPersonId(p.id);
      }

      addBusinessEntity(personId, {
        name: state.bizName.trim(),
        type: state.bizType,
        ein: state.bizEin.trim() || undefined,
        schedule: state.schedule,
        home_office_eligible: state.homeOffice,
        notes: state.bizNotes,
      });

      setDone(true);
      onComplete(personId);
    } finally {
      setSaving(false);
    }
  }

  const selectedPerson =
    state.mode === "existing"
      ? persons.find((p) => p.id === state.selectedPersonId)
      : null;

  // ── Done Screen ───────────────────────────────────────────

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8 px-6 text-center">
        <div className="p-3 rounded-full bg-green-500/20 border border-green-500/30">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <div>
          <p className="text-lg font-bold text-white">Business Added!</p>
          <p className="text-sm text-gray-400 mt-1">
            <span className="text-white font-medium">{state.bizName}</span> has been added
            {createdPersonId
              ? " and a new filer profile was created."
              : ` to ${selectedPerson?.name ?? "the filer"}.`}
          </p>
        </div>
        <p className="text-xs text-gray-500 bg-white/5 rounded-lg p-3 border border-white/10">
          Next step: go to <span className="text-amber-300">People → Manage Income</span> to add income sources for this business, then <span className="text-amber-300">Tax Forms</span> to see what's required.
        </p>
        <Button
          onClick={onClose}
          className="mt-2 text-black font-bold bg-amber-400 hover:bg-amber-300"
        >
          Done
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0" style={{ maxHeight: "90vh" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-amber-400" />
          <p className="text-sm font-bold text-white">New Company / Business</p>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-0 px-5 py-3 border-b border-white/10">
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <div className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={
                  i < step
                    ? { background: "#4ade80", color: "#000" }
                    : i === step
                    ? { background: "#fbbf24", color: "#000" }
                    : { background: "#ffffff18", color: "#6b7280" }
                }
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span
                className="text-[11px] font-medium hidden sm:block"
                style={{ color: i === step ? "#fbbf24" : i < step ? "#4ade80" : "#6b7280" }}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px mx-2" style={{ background: i < step ? "#4ade8060" : "#ffffff18" }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ minHeight: 0 }}>

        {/* ── STEP 0: Filer ──────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400">Which tax filer does this business belong to?</p>

            {persons.length > 0 && (
              <div className="space-y-2">
                <Label className="text-gray-300 text-xs">Existing Filer</Label>
                <div className="space-y-1.5">
                  {persons.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => patch({ mode: "existing", selectedPersonId: p.id })}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition ${
                        state.mode === "existing" && state.selectedPersonId === p.id
                          ? "border-amber-400/60 bg-amber-400/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: "#fbbf2430", color: "#fbbf24" }}
                      >
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{p.name}</p>
                        <p className="text-[10px] text-gray-500 capitalize">{p.role} · {p.businesses.length} business{p.businesses.length !== 1 ? "es" : ""}</p>
                      </div>
                      {state.mode === "existing" && state.selectedPersonId === p.id && (
                        <CheckCircle2 className="w-4 h-4 text-amber-400 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] text-gray-500">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <button
              onClick={() => patch({ mode: "new" })}
              className={`w-full p-3 rounded-lg border text-left transition text-sm ${
                state.mode === "new"
                  ? "border-amber-400/60 bg-amber-400/10 text-white"
                  : "border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40"
              }`}
            >
              + Create a new filer profile
            </button>

            {state.mode === "new" && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <Label className="text-gray-300 text-xs">Full Name *</Label>
                    <Input
                      required
                      value={state.newPersonName}
                      onChange={(e) => patch({ newPersonName: e.target.value })}
                      placeholder="e.g. Jane Smith"
                      className="bg-white/10 border-white/20 text-white mt-1 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-gray-300 text-xs">Role</Label>
                      <select
                        value={state.newPersonRole}
                        onChange={(e) => patch({ newPersonRole: e.target.value as TaxPerson["role"] })}
                        className="w-full mt-1 px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white text-sm"
                      >
                        <option value="primary" className="bg-slate-800">Primary Filer</option>
                        <option value="spouse" className="bg-slate-800">Spouse</option>
                        <option value="dependent" className="bg-slate-800">Dependent</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-gray-300 text-xs">Filing Status</Label>
                      <select
                        value={state.newPersonFiling}
                        onChange={(e) => patch({ newPersonFiling: e.target.value as TaxPerson["filing_status"] })}
                        className="w-full mt-1 px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white text-sm"
                      >
                        <option value="single" className="bg-slate-800">Single</option>
                        <option value="married_filing_jointly" className="bg-slate-800">MFJ</option>
                        <option value="married_filing_separately" className="bg-slate-800">MFS</option>
                        <option value="head_of_household" className="bg-slate-800">HOH</option>
                        <option value="qualifying_widow" className="bg-slate-800">Qual. Widow</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-300 text-xs">Notes (optional)</Label>
                    <Input
                      value={state.newPersonNotes}
                      onChange={(e) => patch({ newPersonNotes: e.target.value })}
                      placeholder="Any notes about this filer's tax situation…"
                      className="bg-white/10 border-white/20 text-white mt-1 text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── STEP 1: Business Info ────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400">Tell us about the business.</p>

            <div>
              <Label className="text-gray-300 text-xs">Business / DBA Name *</Label>
              <Input
                required
                value={state.bizName}
                onChange={(e) => patch({ bizName: e.target.value })}
                placeholder="e.g. Reese Ventures LLC"
                className="bg-white/10 border-white/20 text-white mt-1 text-sm"
                autoFocus
              />
            </div>

            <div>
              <Label className="text-gray-300 text-xs">EIN (optional — leave blank to use SSN)</Label>
              <Input
                value={state.bizEin}
                onChange={(e) => patch({ bizEin: e.target.value })}
                placeholder="XX-XXXXXXX"
                maxLength={10}
                className="bg-white/10 border-white/20 text-white mt-1 text-sm font-mono"
              />
            </div>

            <div>
              <Label className="text-gray-300 text-xs mb-2 block">Business Type *</Label>
              <div className="space-y-2">
                {BUSINESS_TYPES.map((bt) => (
                  <button
                    key={bt.value}
                    onClick={() =>
                      patch({ bizType: bt.value, schedule: defaultSchedule(bt.value) })
                    }
                    className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition ${
                      state.bizType === bt.value
                        ? "border-amber-400/60 bg-amber-400/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{bt.label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{bt.desc}</p>
                    </div>
                    {state.bizType === bt.value && (
                      <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Tax Setup ────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400">Set up the tax filing details for this business.</p>

            <div>
              <Label className="text-gray-300 text-xs mb-2 block">IRS Schedule *</Label>
              <div className="space-y-1.5">
                {SCHEDULE_OPTS.filter((s) => s.for.includes(state.bizType)).map((s) => (
                  <button
                    key={s.value}
                    onClick={() => patch({ schedule: s.value })}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition text-sm ${
                      state.schedule === s.value
                        ? "border-amber-400/60 bg-amber-400/10 text-white"
                        : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    {s.label}
                    {state.schedule === s.value && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-white/5">
              <input
                type="checkbox"
                id="home-office"
                checked={state.homeOffice}
                onChange={(e) => patch({ homeOffice: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded accent-amber-400 flex-shrink-0"
              />
              <label htmlFor="home-office" className="cursor-pointer select-none">
                <p className="text-sm text-white">Home Office Eligible</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Check if you have a dedicated workspace at home for this business. Enables Form 8829 deduction.
                </p>
              </label>
            </div>

            <div>
              <Label className="text-gray-300 text-xs">Notes (optional)</Label>
              <Input
                value={state.bizNotes}
                onChange={(e) => patch({ bizNotes: e.target.value })}
                placeholder="e.g. DBA: ReeseReviews.com, Amazon affiliate + Vine"
                className="bg-white/10 border-white/20 text-white mt-1 text-sm"
              />
            </div>
          </div>
        )}

        {/* ── STEP 3: Review ───────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400">Review before saving.</p>

            <div className="space-y-2 text-sm">
              {[
                {
                  label: "Filer",
                  value:
                    state.mode === "new"
                      ? `${state.newPersonName} (new — ${state.newPersonRole})`
                      : (selectedPerson?.name ?? "—"),
                },
                { label: "Business Name", value: state.bizName || "—" },
                { label: "Type", value: BUSINESS_TYPES.find((b) => b.value === state.bizType)?.label ?? state.bizType },
                { label: "EIN", value: state.bizEin || "Uses SSN" },
                { label: "Schedule", value: state.schedule.replace("_", " ").toUpperCase() },
                { label: "Home Office", value: state.homeOffice ? "Yes — Form 8829 eligible" : "No" },
                ...(state.bizNotes ? [{ label: "Notes", value: state.bizNotes }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-gray-500 w-28 flex-shrink-0 text-xs pt-0.5">{label}</span>
                  <span className="text-white flex-1">{value}</span>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-amber-400/10 border border-amber-400/20 p-3 text-xs text-amber-300">
              After saving, go to <strong>Manage Income</strong> to add income sources for this business, and <strong>Tax Forms</strong> to see which forms are required.
            </div>
          </div>
        )}
      </div>

      {/* Footer buttons */}
      <div className="flex items-center justify-between gap-3 px-5 pb-5 pt-3 border-t border-white/10">
        <Button
          variant="outline"
          onClick={step === 0 ? onClose : () => setStep((s) => s - 1)}
          className="border-white/20 text-gray-300 hover:bg-white/10"
          disabled={saving}
        >
          {step === 0 ? (
            "Cancel"
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </>
          )}
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance()}
            className="font-bold text-black bg-amber-400 hover:bg-amber-300 disabled:opacity-40"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={saving || !canAdvance()}
            className="font-bold text-black bg-amber-400 hover:bg-amber-300 disabled:opacity-40"
          >
            {saving ? "Saving…" : "Add Business"}
            <CheckCircle2 className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
