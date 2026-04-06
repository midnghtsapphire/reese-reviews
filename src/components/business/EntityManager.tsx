// ============================================================
// ENTITY MANAGER — Multi-Entity Business Management UI
// Add, edit, delete business entities (LLCs, S-Corps, etc.)
// Shows per-entity financial summaries.
// ============================================================

import { useState, FormEvent } from "react";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Star,
  ChevronDown,
  ChevronUp,
  X,
  Save,
  DollarSign,
  Package,
} from "lucide-react";
import {
  getEntities,
  addEntity,
  updateEntity,
  deleteEntity,
  type BusinessEntity,
  type EntityType,
  type EntityStatus,
  ENTITY_TYPE_LABELS,
  ENTITY_STATUS_LABELS,
  computeEntitySummaries,
  type EntityFinancialSummary,
} from "@/stores/businessEntityStore";
import { getExpenses } from "@/lib/expenseStore";
import { getProducts } from "@/stores/productLifecycleStore";

// ─── Color palette for entities ─────────────────────────────

const ENTITY_COLORS = [
  "#FF6B2B", "#22c55e", "#3b82f6", "#a855f7", "#ec4899",
  "#f59e0b", "#06b6d4", "#ef4444", "#8b5cf6", "#14b8a6",
];

// ─── Entity Form ────────────────────────────────────────────

interface EntityFormProps {
  entity?: BusinessEntity;
  onSave: (data: Omit<BusinessEntity, "id" | "created_at" | "updated_at">) => void;
  onCancel: () => void;
}

const EntityForm = ({ entity, onSave, onCancel }: EntityFormProps) => {
  const [name, setName] = useState(entity?.name || "");
  const [legalName, setLegalName] = useState(entity?.legal_name || "");
  const [entityType, setEntityType] = useState<EntityType>(entity?.entity_type || "llc");
  const [status, setStatus] = useState<EntityStatus>(entity?.status || "active");
  const [ein, setEin] = useState(entity?.ein || "");
  const [stateOfFormation, setStateOfFormation] = useState(entity?.state_of_formation || "");
  const [formationDate, setFormationDate] = useState(entity?.formation_date || "");
  const [description, setDescription] = useState(entity?.description || "");
  const [primaryContact, setPrimaryContact] = useState(entity?.primary_contact || "");
  const [email, setEmail] = useState(entity?.email || "");
  const [phone, setPhone] = useState(entity?.phone || "");
  const [website, setWebsite] = useState(entity?.website || "");
  const [color, setColor] = useState(entity?.color || ENTITY_COLORS[0]);
  const [isDefault, setIsDefault] = useState(entity?.is_default || false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim() || "Untitled Entity",
      legal_name: legalName.trim(),
      entity_type: entityType,
      status,
      ein: ein.trim(),
      state_of_formation: stateOfFormation,
      formation_date: formationDate,
      fiscal_year_end: "12/31",
      address: "",
      description: description.trim(),
      primary_contact: primaryContact.trim(),
      phone: phone.trim(),
      email: email.trim(),
      website: website.trim(),
      color,
      is_default: isDefault,
      parent_entity_id: entity?.parent_entity_id || null,
      tags: entity?.tags || [],
    });
  };

  const inputClass =
    "w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all";
  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.9)",
  };
  const labelClass =
    "block text-xs font-semibold uppercase tracking-wider mb-1.5";
  const labelStyle = { color: "rgba(255,255,255,0.5)" };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} style={labelStyle}>Business Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Freedom Angel Corps"
            className={inputClass}
            style={inputStyle}
            required
          />
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Legal Name</label>
          <input
            type="text"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            placeholder="e.g. Freedom Angel Corps LLC"
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Entity Type</label>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value as EntityType)}
            className={inputClass}
            style={inputStyle}
          >
            {Object.entries(ENTITY_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as EntityStatus)}
            className={inputClass}
            style={inputStyle}
          >
            {Object.entries(ENTITY_STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>EIN</label>
          <input
            type="text"
            value={ein}
            onChange={(e) => setEin(e.target.value)}
            placeholder="XX-XXXXXXX"
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>State of Formation</label>
          <input
            type="text"
            value={stateOfFormation}
            onChange={(e) => setStateOfFormation(e.target.value)}
            placeholder="e.g. CO"
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Formation Date</label>
          <input
            type="date"
            value={formationDate}
            onChange={(e) => setFormationDate(e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Primary Contact</label>
          <input
            type="text"
            value={primaryContact}
            onChange={(e) => setPrimaryContact(e.target.value)}
            placeholder="Contact name"
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="business@example.com"
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Website</label>
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="example.com"
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Color</label>
          <div className="flex items-center gap-2">
            {ENTITY_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                style={{
                  background: c,
                  border: color === c ? "2px solid white" : "2px solid transparent",
                  boxShadow: color === c ? `0 0 8px ${c}` : "none",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className={labelClass} style={labelStyle}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this business do?"
          rows={2}
          className={inputClass}
          style={inputStyle}
        />
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
            Set as default entity
          </span>
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02]"
          style={{
            background: "linear-gradient(135deg, #FF6B2B 0%, #E63946 100%)",
            color: "#fff",
          }}
        >
          <Save size={16} />
          {entity ? "Update Entity" : "Create Entity"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          <X size={16} />
          Cancel
        </button>
      </div>
    </form>
  );
};

// ─── Main Component ─────────────────────────────────────────

const EntityManager = () => {
  const [entities, setEntities] = useState<BusinessEntity[]>(getEntities());
  const [showForm, setShowForm] = useState(false);
  const [editingEntity, setEditingEntity] = useState<BusinessEntity | undefined>();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Compute financial summaries
  const expenses = getExpenses();
  const products = getProducts();
  const summaries = computeEntitySummaries(entities, [], expenses, products);

  const getSummary = (entityId: string): EntityFinancialSummary | undefined =>
    summaries.find((s) => s.entityId === entityId);

  const refresh = () => setEntities(getEntities());

  const handleAdd = (data: Omit<BusinessEntity, "id" | "created_at" | "updated_at">) => {
    addEntity(data);
    refresh();
    setShowForm(false);
  };

  const handleUpdate = (data: Omit<BusinessEntity, "id" | "created_at" | "updated_at">) => {
    if (editingEntity) {
      updateEntity(editingEntity.id, data);
      refresh();
      setEditingEntity(undefined);
      setShowForm(false);
    }
  };

  const handleDelete = (id: string) => {
    deleteEntity(id);
    refresh();
    setConfirmDeleteId(null);
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-xl font-bold flex items-center gap-2"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            <Building2 size={22} style={{ color: "#FF6B2B" }} />
            Business Entities
          </h2>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Manage your LLCs, S-Corps, and business profiles
          </p>
        </div>
        <button
          onClick={() => {
            setEditingEntity(undefined);
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02]"
          style={{
            background: "linear-gradient(135deg, #FF6B2B 0%, #E63946 100%)",
            color: "#fff",
          }}
        >
          <Plus size={16} />
          Add Entity
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingEntity ? "Edit Entity" : "New Business Entity"}
          </h3>
          <EntityForm
            entity={editingEntity}
            onSave={editingEntity ? handleUpdate : handleAdd}
            onCancel={() => {
              setShowForm(false);
              setEditingEntity(undefined);
            }}
          />
        </div>
      )}

      {/* Entity Cards */}
      {entities.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Building2 size={40} className="mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            No business entities yet. Add your first entity to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entities.map((entity) => {
            const summary = getSummary(entity.id);
            const isExpanded = expandedId === entity.id;

            return (
              <div
                key={entity.id}
                className="rounded-2xl overflow-hidden transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${entity.color}22`,
                }}
              >
                {/* Header row */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : entity.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: entity.color }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{entity.name}</span>
                        {entity.is_default && (
                          <Star size={12} style={{ color: "#FFD93D" }} fill="#FFD93D" />
                        )}
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: `${entity.color}15`,
                            color: entity.color,
                            border: `1px solid ${entity.color}30`,
                          }}
                        >
                          {ENTITY_TYPE_LABELS[entity.entity_type]}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: entity.status === "active"
                              ? "rgba(34,197,94,0.1)"
                              : "rgba(255,255,255,0.05)",
                            color: entity.status === "active" ? "#22c55e" : "rgba(255,255,255,0.4)",
                          }}
                        >
                          {ENTITY_STATUS_LABELS[entity.status]}
                        </span>
                      </div>
                      {entity.description && (
                        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                          {entity.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Quick stats */}
                    {summary && (
                      <div className="hidden md:flex items-center gap-4 mr-4">
                        <div className="text-right">
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Expenses</p>
                          <p className="text-sm font-semibold" style={{ color: "#ef4444" }}>
                            {formatCurrency(summary.totalExpenses)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Products</p>
                          <p className="text-sm font-semibold text-white">
                            {summary.productCount}
                          </p>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingEntity(entity);
                        setShowForm(true);
                      }}
                      className="p-2 rounded-lg transition-colors hover:bg-white/5"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(entity.id);
                      }}
                      className="p-2 rounded-lg transition-colors hover:bg-red-500/10"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      <Trash2 size={14} />
                    </button>
                    {isExpanded ? (
                      <ChevronUp size={16} style={{ color: "rgba(255,255,255,0.3)" }} />
                    ) : (
                      <ChevronDown size={16} style={{ color: "rgba(255,255,255,0.3)" }} />
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div
                    className="px-4 pb-4 pt-0 space-y-3"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
                      {entity.ein && (
                        <div>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>EIN</p>
                          <p className="text-sm text-white">{entity.ein}</p>
                        </div>
                      )}
                      {entity.state_of_formation && (
                        <div>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>State</p>
                          <p className="text-sm text-white">{entity.state_of_formation}</p>
                        </div>
                      )}
                      {entity.formation_date && (
                        <div>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Formed</p>
                          <p className="text-sm text-white">{entity.formation_date}</p>
                        </div>
                      )}
                      {entity.primary_contact && (
                        <div>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Contact</p>
                          <p className="text-sm text-white">{entity.primary_contact}</p>
                        </div>
                      )}
                    </div>

                    {/* Financial summary */}
                    {summary && (
                      <div
                        className="rounded-xl p-4 mt-2"
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                          Financial Summary
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2">
                            <DollarSign size={14} style={{ color: "#22c55e" }} />
                            <div>
                              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Income</p>
                              <p className="text-sm font-semibold" style={{ color: "#22c55e" }}>
                                {formatCurrency(summary.totalIncome)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign size={14} style={{ color: "#ef4444" }} />
                            <div>
                              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Expenses</p>
                              <p className="text-sm font-semibold" style={{ color: "#ef4444" }}>
                                {formatCurrency(summary.totalExpenses)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign size={14} style={{ color: "#f59e0b" }} />
                            <div>
                              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Write-Offs</p>
                              <p className="text-sm font-semibold" style={{ color: "#f59e0b" }}>
                                {formatCurrency(summary.totalWriteOffs)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package size={14} style={{ color: "#3b82f6" }} />
                            <div>
                              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Products</p>
                              <p className="text-sm font-semibold text-white">
                                {summary.productCount}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Delete confirmation */}
                {confirmDeleteId === entity.id && (
                  <div
                    className="px-4 pb-4 flex items-center gap-3"
                    style={{ borderTop: "1px solid rgba(230,57,70,0.2)" }}
                  >
                    <p className="text-xs flex-1 pt-3" style={{ color: "#E63946" }}>
                      Delete "{entity.name}"? This cannot be undone.
                    </p>
                    <button
                      onClick={() => handleDelete(entity.id)}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold mt-3"
                      style={{ background: "rgba(230,57,70,0.2)", color: "#E63946" }}
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium mt-3"
                      style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Attribution */}
      <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>
        Multi-entity management provided by free and open-source tools
      </p>
    </div>
  );
};

export default EntityManager;
