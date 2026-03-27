// ============================================================
// BUSINESS EXPENSE TRACKER
// Dashboard for managing recurring subscriptions, AI tools,
// hosting, storage, and other business expenses per entity.
// ============================================================

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DollarSign,
  Plus,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Filter,
} from "lucide-react";
import {
  getBusinessExpenses,
  getExpenseSummary,
  addBusinessExpense,
  updateBusinessExpense,
  deleteBusinessExpense,
  toggleExpenseActive,
  monthlyCost,
  annualCost,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  ENTITY_NAMES,
  type BusinessExpense,
  type ExpenseCategory,
  type BillingPeriod,
} from "@/lib/businessExpenseStore";

// ─── HELPERS ────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const ENTITY_OPTIONS = Object.entries(ENTITY_NAMES).map(([id, name]) => ({ id, name }));

const BLANK_FORM: Omit<BusinessExpense, "id" | "createdAt" | "updatedAt"> = {
  name: "",
  description: "",
  category: "subscriptions",
  businessEntityId: "biz-reese-ventures",
  businessEntityName: "Reese Ventures LLC",
  amount: 0,
  billingPeriod: "monthly",
  nextBillingDate: null,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: null,
  isActive: true,
  url: "",
  notes: "",
};

// ─── COMPONENT ──────────────────────────────────────────────

export function BusinessExpenseTracker() {
  const [expenses, setExpenses] = useState<BusinessExpense[]>([]);
  const [filterEntity, setFilterEntity] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showInactive, setShowInactive] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ ...BLANK_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setExpenses(getBusinessExpenses());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const summary = getExpenseSummary();

  const showMsg = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 3000);
  };

  const filteredExpenses = expenses.filter((e) => {
    if (!showInactive && !e.isActive) return false;
    if (filterEntity !== "all" && e.businessEntityId !== filterEntity) return false;
    if (filterCategory !== "all" && e.category !== filterCategory) return false;
    return true;
  });

  const handleToggle = (id: string) => {
    toggleExpenseActive(id);
    refresh();
  };

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    deleteBusinessExpense(id);
    refresh();
    showMsg(`${name} deleted`);
  };

  const handleFormEntityChange = (entityId: string) => {
    setForm((prev) => ({
      ...prev,
      businessEntityId: entityId,
      businessEntityName: ENTITY_NAMES[entityId] ?? entityId,
    }));
  };

  const handleSubmitForm = () => {
    if (!form.name.trim()) {
      showMsg("Name is required");
      return;
    }
    if (editingId) {
      updateBusinessExpense(editingId, form);
      showMsg(`${form.name} updated`);
      setEditingId(null);
    } else {
      addBusinessExpense(form);
      showMsg(`${form.name} added`);
    }
    setForm({ ...BLANK_FORM });
    setShowAddForm(false);
    refresh();
  };

  const startEdit = (e: BusinessExpense) => {
    setForm({
      name: e.name,
      description: e.description,
      category: e.category,
      businessEntityId: e.businessEntityId,
      businessEntityName: e.businessEntityName,
      amount: e.amount,
      billingPeriod: e.billingPeriod,
      nextBillingDate: e.nextBillingDate,
      startDate: e.startDate,
      endDate: e.endDate,
      isActive: e.isActive,
      url: e.url,
      notes: e.notes,
    });
    setEditingId(e.id);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setForm({ ...BLANK_FORM });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-400" />
          Business Expense Tracker
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          Track subscriptions, AI tools, hosting, and other recurring business expenses across all entities.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-white">{fmt(summary.monthlyTotal)}</p>
            <p className="text-xs text-gray-400 mt-1">Total / month</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-white">{fmt(summary.annualTotal)}</p>
            <p className="text-xs text-gray-400 mt-1">Total / year</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{summary.activeCount}</p>
            <p className="text-xs text-gray-400 mt-1">Active services</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-500">{summary.inactiveCount}</p>
            <p className="text-xs text-gray-400 mt-1">Inactive / paused</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-entity summary */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">By Entity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(summary.byEntity)
              .sort((a, b) => b[1].annual - a[1].annual)
              .map(([entityId, data]) => (
                <div key={entityId} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-white">{ENTITY_NAMES[entityId] ?? entityId}</span>
                    <span className="text-xs text-gray-500 ml-2">({data.count} service{data.count !== 1 ? "s" : ""})</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-white">{fmt(data.monthly)}/mo</span>
                    <span className="text-xs text-gray-500 ml-2">{fmt(data.annual)}/yr</span>
                  </div>
                </div>
              ))}
            {Object.keys(summary.byEntity).length === 0 && (
              <p className="text-xs text-gray-500">No active expenses</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Toast */}
      {message && (
        <div className="fixed bottom-4 right-4 z-50 bg-green-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          {message}
        </div>
      )}

      {/* Add / Edit form */}
      {showAddForm && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white">
              {editingId ? "Edit Expense" : "Add Expense"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Digital Ocean"
                  className="bg-white/5 border-white/10 text-white text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">URL</Label>
                <Input
                  value={form.url}
                  onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                  placeholder="https://..."
                  className="bg-white/5 border-white/10 text-white text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v as ExpenseCategory }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-gray-200 text-sm h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>
                        {CATEGORY_ICONS[val as ExpenseCategory]} {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">Business Entity</Label>
                <Select value={form.businessEntityId} onValueChange={handleFormEntityChange}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-gray-200 text-sm h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">Amount ($)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
                  className="bg-white/5 border-white/10 text-white text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">Billing Period</Label>
                <Select value={form.billingPeriod} onValueChange={(v) => setForm((p) => ({ ...p, billingPeriod: v as BillingPeriod }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-gray-200 text-sm h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="one_time">One-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Description / Notes</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="What is this service for?"
                className="bg-white/5 border-white/10 text-white text-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                onClick={handleSubmitForm}
                className="bg-green-600 hover:bg-green-700 text-white text-xs"
              >
                {editingId ? "Save Changes" : "Add Expense"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={cancelForm}
                className="text-gray-400 hover:text-white text-xs"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters + Add button */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          size="sm"
          onClick={() => { setShowAddForm(true); setEditingId(null); setForm({ ...BLANK_FORM }); }}
          className="bg-green-600 hover:bg-green-700 text-white text-xs"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Expense
        </Button>
        <Select value={filterEntity} onValueChange={setFilterEntity}>
          <SelectTrigger className="w-[160px] h-8 bg-white/5 border-white/10 text-gray-300 text-xs">
            <SelectValue placeholder="All Entities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            {ENTITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[150px] h-8 bg-white/5 border-white/10 text-gray-300 text-xs">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>{CATEGORY_ICONS[val as ExpenseCategory]} {label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="accent-purple-500"
          />
          Show inactive
        </label>
      </div>

      {/* Expense list */}
      <div className="space-y-2">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No expenses match your filters.
          </div>
        ) : (
          filteredExpenses.map((e) => (
            <div
              key={e.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition ${
                e.isActive
                  ? "bg-white/5 border-white/10 hover:bg-white/8"
                  : "bg-white/[0.02] border-white/5 opacity-60"
              }`}
            >
              <div className="text-xl flex-shrink-0">{CATEGORY_ICONS[e.category]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white">{e.name}</span>
                  <Badge className="text-[10px] bg-white/10 text-gray-300 border-white/10 border">
                    {ENTITY_NAMES[e.businessEntityId] ?? e.businessEntityId}
                  </Badge>
                  {!e.isActive && (
                    <Badge className="text-[10px] bg-gray-500/20 text-gray-400 border-gray-500/30 border">paused</Badge>
                  )}
                </div>
                {e.description && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">{e.description}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0 mr-2">
                <p className="text-sm font-semibold text-white">
                  {e.amount === 0 ? "Pay-as-go" : `${fmt(e.amount)}/${e.billingPeriod === "monthly" ? "mo" : e.billingPeriod === "annual" ? "yr" : e.billingPeriod === "quarterly" ? "q" : "once"}`}
                </p>
                {e.isActive && e.amount > 0 && e.billingPeriod !== "one_time" && (
                  <p className="text-xs text-gray-500">{fmt(monthlyCost(e))}/mo equiv</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {e.url && (
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-gray-400 hover:text-white rounded transition"
                    title="Open service"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <button
                  onClick={() => handleToggle(e.id)}
                  className="p-1.5 text-gray-400 hover:text-white rounded transition"
                  title={e.isActive ? "Pause" : "Activate"}
                >
                  {e.isActive ? <ToggleRight className="h-4 w-4 text-green-400" /> : <ToggleLeft className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => startEdit(e)}
                  className="p-1.5 text-xs text-gray-400 hover:text-white rounded transition font-medium"
                  title="Edit"
                >
                  ✎
                </button>
                <button
                  onClick={() => handleDelete(e.id, e.name)}
                  className="p-1.5 text-gray-600 hover:text-red-400 rounded transition"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
