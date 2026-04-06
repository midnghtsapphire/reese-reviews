// ============================================================
// BUSINESS ENTITY STORE
// Manages multiple business entities (LLCs, S-Corps, Sole Props)
// for multi-entity tax tracking and financial separation.
// Supabase-backed with localStorage fallback for offline.
// ============================================================

import {
  loadFromSupabase,
  deleteFromSupabase,
  bulkSaveToSupabase,
  loadFromLocalStorage,
  saveToLocalStorage,
  type SupabaseStoreOptions,
} from "@/lib/supabasePersistence";

const STORAGE_KEY = "reese-business-entities";

// ─── Types ──────────────────────────────────────────────────

export type EntityType = "llc" | "s_corp" | "c_corp" | "sole_prop" | "partnership" | "nonprofit" | "other";

export type EntityStatus = "active" | "inactive" | "dissolved" | "pending";

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  llc: "LLC",
  s_corp: "S-Corp",
  c_corp: "C-Corp",
  sole_prop: "Sole Proprietorship",
  partnership: "Partnership",
  nonprofit: "Nonprofit",
  other: "Other",
};

export const ENTITY_STATUS_LABELS: Record<EntityStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  dissolved: "Dissolved",
  pending: "Pending Formation",
};

export interface BusinessEntity {
  id: string;
  name: string;
  legal_name: string;
  entity_type: EntityType;
  status: EntityStatus;
  ein: string;
  state_of_formation: string;
  formation_date: string;
  fiscal_year_end: string; // "12/31", "06/30", etc.
  address: string;
  description: string;
  primary_contact: string;
  phone: string;
  email: string;
  website: string;
  color: string; // hex color for UI differentiation
  is_default: boolean;
  parent_entity_id: string | null; // for entity hierarchy
  tags: string[];
  created_at: string;
  updated_at: string;
}

// ─── Default entities ───────────────────────────────────────

export const DEFAULT_ENTITIES: BusinessEntity[] = [
  {
    id: "entity-freedom-angel",
    name: "Freedom Angel Corps",
    legal_name: "Freedom Angel Corps LLC",
    entity_type: "llc",
    status: "active",
    ein: "",
    state_of_formation: "CO",
    formation_date: "",
    fiscal_year_end: "12/31",
    address: "",
    description: "Amazon Vine reviews, product testing, and content creation",
    primary_contact: "Audrey Evans",
    phone: "",
    email: "",
    website: "reesereviews.com",
    color: "#FF6B2B",
    is_default: true,
    parent_entity_id: null,
    tags: ["reviews", "vine", "content"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "entity-rocky-mountain",
    name: "Rocky Mountain Rentals",
    legal_name: "Rocky Mountain Rentals LLC",
    entity_type: "llc",
    status: "active",
    ein: "",
    state_of_formation: "CO",
    formation_date: "",
    fiscal_year_end: "12/31",
    address: "",
    description: "Product resale and rental operations",
    primary_contact: "Audrey Evans",
    phone: "",
    email: "",
    website: "",
    color: "#22c55e",
    is_default: false,
    parent_entity_id: null,
    tags: ["resale", "rental", "marketplace"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ─── Supabase Store Options ─────────────────────────────────

const entityStoreOpts: SupabaseStoreOptions<BusinessEntity> = {
  table: "business_entities",
  localStorageKey: STORAGE_KEY,
  fromRow: (row) => ({
    id: row.id as string,
    name: row.name as string,
    legal_name: (row.legal_name as string) || "",
    entity_type: (row.entity_type as EntityType) || "llc",
    status: (row.status as EntityStatus) || "active",
    ein: (row.ein as string) || "",
    state_of_formation: (row.state_of_formation as string) || "",
    formation_date: (row.formation_date as string) || "",
    fiscal_year_end: (row.fiscal_year_end as string) || "12/31",
    address: (row.address as string) || "",
    description: (row.description as string) || "",
    primary_contact: (row.primary_contact as string) || "",
    phone: (row.phone as string) || "",
    email: (row.email as string) || "",
    website: (row.website as string) || "",
    color: (row.color as string) || "#FF6B2B",
    is_default: Boolean(row.is_default),
    parent_entity_id: (row.parent_entity_id as string) || null,
    tags: (row.tags as string[]) || [],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }),
  toRow: (item, userId) => ({
    id: item.id,
    user_id: userId,
    name: item.name,
    legal_name: item.legal_name,
    entity_type: item.entity_type,
    status: item.status,
    ein: item.ein || null,
    state_of_formation: item.state_of_formation,
    formation_date: item.formation_date || null,
    fiscal_year_end: item.fiscal_year_end,
    address: item.address,
    description: item.description,
    primary_contact: item.primary_contact,
    phone: item.phone,
    email: item.email,
    website: item.website,
    color: item.color,
    is_default: item.is_default,
    parent_entity_id: item.parent_entity_id,
    tags: item.tags,
  }),
  getId: (item) => item.id,
};

// ─── CRUD ───────────────────────────────────────────────────

export function getEntities(): BusinessEntity[] {
  const stored = loadFromLocalStorage<BusinessEntity>(STORAGE_KEY, []);
  if (stored.length === 0) {
    // Seed with defaults on first load
    saveEntities(DEFAULT_ENTITIES);
    return [...DEFAULT_ENTITIES];
  }
  return stored;
}

export async function getEntitiesAsync(): Promise<BusinessEntity[]> {
  return loadFromSupabase(entityStoreOpts, DEFAULT_ENTITIES);
}

export function saveEntities(entities: BusinessEntity[]): void {
  saveToLocalStorage(STORAGE_KEY, entities);
  bulkSaveToSupabase(entityStoreOpts, entities).catch(() => {});
}

export function addEntity(entity: Omit<BusinessEntity, "id" | "created_at" | "updated_at">): BusinessEntity {
  const entities = getEntities();
  const now = new Date().toISOString();
  const newEntity: BusinessEntity = {
    ...entity,
    id: `entity-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    created_at: now,
    updated_at: now,
  };

  // If this is set as default, unset others
  if (newEntity.is_default) {
    entities.forEach((e) => { e.is_default = false; });
  }

  saveEntities([...entities, newEntity]);
  return newEntity;
}

export function updateEntity(id: string, updates: Partial<BusinessEntity>): BusinessEntity | null {
  const entities = getEntities();
  const idx = entities.findIndex((e) => e.id === id);
  if (idx === -1) return null;

  // If setting as default, unset others
  if (updates.is_default) {
    entities.forEach((e) => { e.is_default = false; });
  }

  entities[idx] = {
    ...entities[idx],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  saveEntities(entities);
  return entities[idx];
}

export function deleteEntity(id: string): boolean {
  const entities = getEntities();
  const filtered = entities.filter((e) => e.id !== id);
  if (filtered.length === entities.length) return false;
  saveEntities(filtered);
  deleteFromSupabase(entityStoreOpts, id, filtered).catch(() => {});
  return true;
}

export function getDefaultEntity(): BusinessEntity | undefined {
  return getEntities().find((e) => e.is_default);
}

export function getEntityById(id: string): BusinessEntity | undefined {
  return getEntities().find((e) => e.id === id);
}

export function getActiveEntities(): BusinessEntity[] {
  return getEntities().filter((e) => e.status === "active");
}

// ─── Per-Entity Financial Summary ───────────────────────────

export interface EntityFinancialSummary {
  entityId: string;
  entityName: string;
  entityColor: string;
  totalIncome: number;
  totalExpenses: number;
  totalWriteOffs: number;
  netProfit: number;
  productCount: number;
}

/**
 * Compute per-entity financial summaries.
 * This function accepts pre-loaded data to avoid circular imports.
 */
export function computeEntitySummaries(
  entities: BusinessEntity[],
  incomes: Array<{ business_entity_id?: string; amount: number }>,
  expenses: Array<{ business_entity_id?: string; amount: number; is_write_off: boolean; write_off_percentage: number }>,
  products: Array<{ business_entity_id?: string }>
): EntityFinancialSummary[] {
  return entities.map((entity) => {
    const entityIncomes = incomes.filter((i) => i.business_entity_id === entity.id);
    const entityExpenses = expenses.filter((e) => e.business_entity_id === entity.id);
    const entityProducts = products.filter((p) => p.business_entity_id === entity.id);

    const totalIncome = entityIncomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = entityExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalWriteOffs = entityExpenses
      .filter((e) => e.is_write_off)
      .reduce((sum, e) => sum + (e.amount * (e.write_off_percentage / 100)), 0);

    return {
      entityId: entity.id,
      entityName: entity.name,
      entityColor: entity.color,
      totalIncome,
      totalExpenses,
      totalWriteOffs,
      netProfit: totalIncome - totalExpenses,
      productCount: entityProducts.length,
    };
  });
}
