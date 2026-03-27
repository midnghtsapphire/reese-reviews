// ============================================================
// CAPITAL CONTRIBUTION STORE
// Tracks Vine products donated to NoCo Nook & Rentals as
// capital contributions after the 6-month hold period.
//
// Tax context:
//   - Vine ETV is already taxable income to Audrey (1099-NEC)
//   - When donated as capital after 6 months, the product's
//     FMV (fair market value, typically close to ETV) is the
//     capital contribution amount to the LLC/entity
//   - If NoCo Nook eventually sells it, track:
//       Gain = sale price - ETV  (report on Schedule D / flow-through)
//       Loss = ETV - sale price  (deductible if business property)
//   - Storage fees between receipt and donation are deductible
//     business expenses for the Vine business
// ============================================================

const STORE_KEY = "rr-capital-contributions";

// ─── TYPES ──────────────────────────────────────────────────

export interface CapitalContribution {
  id: string;
  /** ID from VineItem — links back to the original Vine product */
  vineItemId: string;
  asin: string;
  productName: string;
  /** Estimated Tax Value from Vine (reported on 1099-NEC) */
  etv: number;
  /** ISO date string — when the physical item was received from Vine */
  dateReceived: string;
  /** ISO date string — when it was donated/contributed to NoCo Nook */
  dateDonated: string;
  /** Recipient entity ID */
  recipientEntityId: "biz-noconook";
  recipientEntityName: "NoCo Nook & Rentals";
  /** Any storage fees accrued between receipt and donation */
  storageFeesAccrued: number;
  /** Sale price if NoCo Nook eventually sells it (null until sold) */
  salePrice: number | null;
  /** ISO date string when NoCo Nook sold it (null until sold) */
  saleDateStr: string | null;
  /** Freeform notes */
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/** Computed gain/loss for a contribution (null if not yet sold). */
export function computeGainLoss(c: CapitalContribution): number | null {
  if (c.salePrice === null) return null;
  return c.salePrice - (c.etv + c.storageFeesAccrued);
}

/** True if this is a taxable gain (positive). */
export function isGain(c: CapitalContribution): boolean {
  const gl = computeGainLoss(c);
  return gl !== null && gl > 0;
}

/** True if this is a deductible loss (negative). */
export function isLoss(c: CapitalContribution): boolean {
  const gl = computeGainLoss(c);
  return gl !== null && gl < 0;
}

// ─── STORAGE ────────────────────────────────────────────────

function load(): CapitalContribution[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as CapitalContribution[]) : [];
  } catch {
    return [];
  }
}

function save(items: CapitalContribution[]): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(items));
}

function genId(): string {
  return `cap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── PUBLIC API ─────────────────────────────────────────────

/** Return all capital contributions. */
export function getCapitalContributions(): CapitalContribution[] {
  return load();
}

/** Return contributions that have NOT yet been sold. */
export function getUnsoldContributions(): CapitalContribution[] {
  return load().filter((c) => c.salePrice === null);
}

/** Return contributions that have been sold. */
export function getSoldContributions(): CapitalContribution[] {
  return load().filter((c) => c.salePrice !== null);
}

/** Check if a Vine item already has a contribution record. */
export function hasContribution(vineItemId: string): boolean {
  return load().some((c) => c.vineItemId === vineItemId);
}

/** Get the contribution for a specific Vine item (if any). */
export function getContributionByVineItem(
  vineItemId: string
): CapitalContribution | undefined {
  return load().find((c) => c.vineItemId === vineItemId);
}

/**
 * Record a new capital contribution (Vine item donated to NoCo Nook).
 * Call this when the item has been held for 6+ months.
 */
export function addCapitalContribution(params: {
  vineItemId: string;
  asin: string;
  productName: string;
  etv: number;
  dateReceived: string;
  storageFeesAccrued?: number;
  notes?: string;
}): CapitalContribution {
  const now = new Date().toISOString();
  const contribution: CapitalContribution = {
    id: genId(),
    vineItemId: params.vineItemId,
    asin: params.asin,
    productName: params.productName,
    etv: params.etv,
    dateReceived: params.dateReceived,
    dateDonated: now,
    recipientEntityId: "biz-noconook",
    recipientEntityName: "NoCo Nook & Rentals",
    storageFeesAccrued: params.storageFeesAccrued ?? 0,
    salePrice: null,
    saleDateStr: null,
    notes: params.notes ?? "",
    createdAt: now,
    updatedAt: now,
  };

  const all = load();
  all.push(contribution);
  save(all);
  return contribution;
}

/** Update storage fees for an existing contribution. */
export function updateStorageFees(
  id: string,
  storageFeesAccrued: number
): CapitalContribution | null {
  const all = load();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  all[idx] = {
    ...all[idx],
    storageFeesAccrued,
    updatedAt: new Date().toISOString(),
  };
  save(all);
  return all[idx];
}

/** Record sale price when NoCo Nook sells the item. */
export function recordSale(
  id: string,
  salePrice: number,
  saleDate?: string
): CapitalContribution | null {
  const all = load();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const now = saleDate ?? new Date().toISOString();
  all[idx] = {
    ...all[idx],
    salePrice,
    saleDateStr: now,
    updatedAt: new Date().toISOString(),
  };
  save(all);
  return all[idx];
}

/** Clear sale data (undo a sale record). */
export function clearSale(id: string): CapitalContribution | null {
  const all = load();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  all[idx] = {
    ...all[idx],
    salePrice: null,
    saleDateStr: null,
    updatedAt: new Date().toISOString(),
  };
  save(all);
  return all[idx];
}

/** Update notes on a contribution. */
export function updateContributionNotes(
  id: string,
  notes: string
): CapitalContribution | null {
  const all = load();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], notes, updatedAt: new Date().toISOString() };
  save(all);
  return all[idx];
}

/** Delete a contribution record (use with care). */
export function deleteContribution(id: string): boolean {
  const all = load();
  const next = all.filter((c) => c.id !== id);
  if (next.length === all.length) return false;
  save(next);
  return true;
}

// ─── SUMMARY HELPERS ────────────────────────────────────────

export interface ContributionSummary {
  totalContributed: number;       // sum of all ETVs
  totalStorageFees: number;       // sum of all storage fees
  totalSaleRevenue: number;       // sum of all sale prices (sold items only)
  totalGains: number;             // sum of gains on sold items
  totalLosses: number;            // sum of losses (as positive number) on sold items
  netGainLoss: number;            // totalGains - totalLosses
  unsoldCount: number;
  soldCount: number;
  unsoldEtv: number;              // ETV of items not yet sold (asset value)
}

export function getContributionSummary(): ContributionSummary {
  const all = load();
  let totalContributed = 0;
  let totalStorageFees = 0;
  let totalSaleRevenue = 0;
  let totalGains = 0;
  let totalLosses = 0;
  let unsoldCount = 0;
  let soldCount = 0;
  let unsoldEtv = 0;

  for (const c of all) {
    totalContributed += c.etv;
    totalStorageFees += c.storageFeesAccrued;

    const gl = computeGainLoss(c);
    if (gl === null) {
      unsoldCount++;
      unsoldEtv += c.etv;
    } else {
      soldCount++;
      totalSaleRevenue += c.salePrice ?? 0;
      if (gl > 0) totalGains += gl;
      else totalLosses += Math.abs(gl);
    }
  }

  return {
    totalContributed,
    totalStorageFees,
    totalSaleRevenue,
    totalGains,
    totalLosses,
    netGainLoss: totalGains - totalLosses,
    unsoldCount,
    soldCount,
    unsoldEtv,
  };
}

// ─── 6-MONTH ELIGIBILITY ────────────────────────────────────

/**
 * Returns true if the item was received at least 6 months ago
 * and therefore can be donated as a capital contribution.
 */
export function isEligibleForCapitalContribution(dateReceived: string): boolean {
  const received = new Date(dateReceived);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return received <= sixMonthsAgo;
}

/**
 * Returns how many months ago the item was received (rounded down).
 * Negative means in the future (shouldn't happen but guards against it).
 */
export function monthsHeld(dateReceived: string): number {
  const received = new Date(dateReceived);
  const now = new Date();
  const months =
    (now.getFullYear() - received.getFullYear()) * 12 +
    (now.getMonth() - received.getMonth());
  return Math.max(0, months);
}
