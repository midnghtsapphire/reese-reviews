// ============================================================
// ENTITY SELECTOR — Dropdown for selecting a business entity
// Used in expense forms, product lifecycle, tax forms, etc.
// ============================================================

import { getEntities, type BusinessEntity } from "@/stores/businessEntityStore";

interface EntitySelectorProps {
  value: string;
  onChange: (entityId: string) => void;
  label?: string;
  showAll?: boolean;
  className?: string;
}

const EntitySelector = ({
  value,
  onChange,
  label = "Business Entity",
  showAll = true,
  className = "",
}: EntitySelectorProps) => {
  const entities = getEntities();

  return (
    <div className={className}>
      {label && (
        <label
          className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all appearance-none"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.9)",
          }}
        >
          {showAll && <option value="">All Entities</option>}
          {entities.map((entity: BusinessEntity) => (
            <option key={entity.id} value={entity.id}>
              {entity.name} ({entity.entity_type.toUpperCase()})
            </option>
          ))}
        </select>
        {/* Color indicator */}
        {value && (
          <div
            className="absolute right-10 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
            style={{
              background: entities.find((e) => e.id === value)?.color || "#FF6B2B",
            }}
          />
        )}
      </div>
    </div>
  );
};

export default EntitySelector;
