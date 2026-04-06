import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  DollarSign,
  Receipt,
  TrendingDown,
  PiggyBank,
  Download,
  Trash2,
  Plus,
} from "lucide-react";
import {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getWriteOffSummary,
  generateWriteOffCSV,
  WRITE_OFF_CATEGORIES,
  suggestCategory,
} from "@/lib/expenseStore";
import type { Expense, WriteOffCategory } from "@/lib/expenseStore";

const CURRENT_YEAR = new Date().getFullYear();

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  home_office: "bg-steel-mid text-white",
  equipment: "bg-steel-mid text-white",
  software_subscriptions: "bg-cyan-600 text-white",
  advertising_marketing: "bg-orange-600 text-white",
  professional_services: "bg-steel-dark text-white",
  shipping_postage: "bg-teal-600 text-white",
  office_supplies: "bg-green-600 text-white",
  travel_vehicle: "bg-yellow-600 text-white",
  meals_entertainment: "bg-pink-600 text-white",
  education_training: "bg-emerald-600 text-white",
  phone_internet: "bg-sky-600 text-white",
  other_business: "bg-gray-600 text-white",
  personal: "bg-gray-500 text-white",
  uncategorized: "bg-gray-700 text-white",
};

const ALL_CATEGORY_OPTIONS: Array<{ value: string; label: string }> = [
  ...Object.entries(WRITE_OFF_CATEGORIES).map(([k, v]) => ({ value: k, label: v.label })),
  { value: "personal", label: "Personal" },
  { value: "uncategorized", label: "Uncategorized" },
];

interface NewExpenseForm {
  date: string;
  merchant: string;
  description: string;
  amount: string;
  category: WriteOffCategory | "personal" | "uncategorized";
  write_off_percentage: number;
  notes: string;
}

const DEFAULT_FORM: NewExpenseForm = {
  date: new Date().toISOString().slice(0, 10),
  merchant: "",
  description: "",
  amount: "",
  category: "uncategorized",
  write_off_percentage: 100,
  notes: "",
};

export function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>(() => getExpenses());
  const [form, setForm] = useState<NewExpenseForm>(DEFAULT_FORM);
  const [formMessage, setFormMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const summary = getWriteOffSummary(CURRENT_YEAR);

  const refreshExpenses = () => setExpenses(getExpenses());

  const handleToggleWriteOff = (id: string, value: boolean) => {
    updateExpense(id, { is_write_off: value });
    refreshExpenses();
  };

  const handleDelete = (id: string) => {
    deleteExpense(id);
    refreshExpenses();
  };

  const handleMerchantBlur = () => {
    if (form.merchant) {
      const suggestion = suggestCategory(form.merchant, form.description);
      setForm((f) => ({
        ...f,
        category: suggestion.category,
        write_off_percentage:
          suggestion.is_write_off && suggestion.category in WRITE_OFF_CATEGORIES
            ? WRITE_OFF_CATEGORIES[suggestion.category as WriteOffCategory].typical_pct
            : f.write_off_percentage,
      }));
    }
  };

  const handleAddExpense = () => {
    const amount = parseFloat(form.amount);
    if (!form.date || !form.merchant || !form.description || isNaN(amount) || amount <= 0) {
      setFormMessage({ text: "Please fill in all required fields with a valid amount.", isError: true });
      return;
    }
    const is_write_off = form.category !== "personal" && form.category !== "uncategorized";
    addExpense({
      date: form.date,
      merchant: form.merchant,
      description: form.description,
      amount,
      category: form.category,
      is_write_off,
      write_off_percentage: is_write_off ? form.write_off_percentage : 0,
      source: "manual",
      notes: form.notes,
      tax_year: parseInt(form.date.slice(0, 4), 10) || CURRENT_YEAR,
    });
    setForm(DEFAULT_FORM);
    setFormMessage({ text: "Expense added!", isError: false });
    refreshExpenses();
    setTimeout(() => setFormMessage(null), 3000);
  };

  const handleExportCSV = () => {
    const csv = generateWriteOffCSV(CURRENT_YEAR);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `write-offs-${CURRENT_YEAR}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const writeOffExpenses = expenses.filter((e) => e.is_write_off && e.tax_year === CURRENT_YEAR);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 border-white/20">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-400 text-xs">Total Expenses</CardDescription>
            <CardTitle className="text-white text-2xl">
              ${summary.total_expenses.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Receipt className="w-5 h-5 text-gray-400" />
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-white/20">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-400 text-xs">Write-Off Amount</CardDescription>
            <CardTitle className="text-white text-2xl">
              ${summary.write_off_amount.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TrendingDown className="w-5 h-5 text-green-400" />
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-white/20">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-400 text-xs">Write-Offs</CardDescription>
            <CardTitle className="text-white text-2xl">{summary.total_write_offs}</CardTitle>
          </CardHeader>
          <CardContent>
            <DollarSign className="w-5 h-5 text-blue-400" />
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-white/20">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-400 text-xs">Est. Tax Savings (22%)</CardDescription>
            <CardTitle className="text-white text-2xl">
              ${(summary.write_off_amount * 0.22).toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PiggyBank className="w-5 h-5 text-steel-shine" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="writeoffs" className="w-full">
        <TabsList className="bg-white/10 border border-white/20">
          <TabsTrigger value="writeoffs" className="text-white data-[state=active]:bg-steel-mid">
            Write-Offs
          </TabsTrigger>
          <TabsTrigger value="all" className="text-white data-[state=active]:bg-steel-mid">
            All Expenses
          </TabsTrigger>
          <TabsTrigger value="add" className="text-white data-[state=active]:bg-steel-mid">
            Add Expense
          </TabsTrigger>
        </TabsList>

        {/* Write-Offs Tab */}
        <TabsContent value="writeoffs" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-white font-medium">
              {CURRENT_YEAR} Deductible Expenses
            </h3>
            <Button
              size="sm"
              onClick={handleExportCSV}
              className="bg-green-600 hover:bg-green-700 text-white text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Export CSV
            </Button>
          </div>

          {/* By category breakdown */}
          {summary.by_category.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {summary.by_category.map((cat) => (
                <div
                  key={cat.category}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs text-gray-400">{cat.label}</p>
                    <p className="text-sm font-medium text-white">${cat.amount.toFixed(2)}</p>
                  </div>
                  <Badge className="bg-white/10 text-gray-300 text-xs">{cat.count}</Badge>
                </div>
              ))}
            </div>
          )}

          <Card className="bg-white/10 border-white/20">
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 px-3 text-gray-400 font-medium">Date</th>
                      <th className="text-left py-2 px-3 text-gray-400 font-medium">Merchant</th>
                      <th className="text-right py-2 px-3 text-gray-400 font-medium">Amount</th>
                      <th className="text-left py-2 px-3 text-gray-400 font-medium">Category</th>
                      <th className="text-right py-2 px-3 text-gray-400 font-medium">WO%</th>
                      <th className="text-right py-2 px-3 text-gray-400 font-medium">Deductible</th>
                    </tr>
                  </thead>
                  <tbody>
                    {writeOffExpenses.map((exp) => (
                      <tr key={exp.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-2 px-3 text-gray-300">{exp.date}</td>
                        <td className="py-2 px-3 text-white">{exp.merchant}</td>
                        <td className="py-2 px-3 text-right text-white">${exp.amount.toFixed(2)}</td>
                        <td className="py-2 px-3">
                          <Badge className={CATEGORY_BADGE_COLORS[exp.category] ?? "bg-gray-600 text-white"}>
                            {exp.category in WRITE_OFF_CATEGORIES
                              ? WRITE_OFF_CATEGORIES[exp.category as WriteOffCategory].label
                              : exp.category}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-right text-gray-300">{exp.write_off_percentage}%</td>
                        <td className="py-2 px-3 text-right text-green-400">
                          ${(exp.amount * (exp.write_off_percentage / 100)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Expenses Tab */}
        <TabsContent value="all" className="mt-4">
          <Card className="bg-white/10 border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">All Expenses</CardTitle>
              <CardDescription className="text-gray-400 text-xs">
                Toggle write-off status per expense. Personal expenses are shown muted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 px-3 text-gray-400 font-medium">Date</th>
                      <th className="text-left py-2 px-3 text-gray-400 font-medium">Merchant</th>
                      <th className="text-left py-2 px-3 text-gray-400 font-medium">Description</th>
                      <th className="text-right py-2 px-3 text-gray-400 font-medium">Amount</th>
                      <th className="text-center py-2 px-3 text-gray-400 font-medium">Write-Off</th>
                      <th className="text-center py-2 px-3 text-gray-400 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((exp) => (
                      <tr
                        key={exp.id}
                        className={`border-b border-white/5 hover:bg-white/5 ${exp.category === "personal" ? "opacity-50" : ""}`}
                      >
                        <td className="py-2 px-3 text-gray-300">{exp.date}</td>
                        <td className="py-2 px-3 text-white">{exp.merchant}</td>
                        <td className="py-2 px-3 text-gray-300 max-w-[200px] truncate">{exp.description}</td>
                        <td className="py-2 px-3 text-right text-white">${exp.amount.toFixed(2)}</td>
                        <td className="py-2 px-3 text-center">
                          <Switch
                            checked={exp.is_write_off}
                            onCheckedChange={(v) => handleToggleWriteOff(exp.id, v)}
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(exp.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-1 h-auto"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add Expense Tab */}
        <TabsContent value="add" className="mt-4">
          <Card className="bg-white/10 border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Expense
              </CardTitle>
              <CardDescription className="text-gray-400 text-xs">
                Merchant name auto-suggests a category when you leave the field.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formMessage && (
                <p className={`text-sm ${formMessage.isError ? "text-red-400" : "text-green-400"}`}>
                  {formMessage.text}
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-gray-300 text-xs">Date *</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-300 text-xs">Amount ($) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-300 text-xs">Merchant *</Label>
                  <Input
                    value={form.merchant}
                    onChange={(e) => setForm((f) => ({ ...f, merchant: e.target.value }))}
                    onBlur={handleMerchantBlur}
                    placeholder="e.g. Adobe, Best Buy, UPS"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-300 text-xs">Description *</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Brief description of the expense"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-300 text-xs">Category</Label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        category: e.target.value as WriteOffCategory | "personal" | "uncategorized",
                        write_off_percentage:
                          e.target.value in WRITE_OFF_CATEGORIES
                            ? WRITE_OFF_CATEGORIES[e.target.value as WriteOffCategory].typical_pct
                            : 0,
                      }))
                    }
                    className="w-full h-10 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-steel-shine"
                  >
                    {ALL_CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-slate-800 text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300 text-xs">
                    Write-Off %: <span className="text-white font-medium">{form.write_off_percentage}%</span>
                  </Label>
                  <Slider
                    value={[form.write_off_percentage]}
                    onValueChange={([v]) => setForm((f) => ({ ...f, write_off_percentage: v }))}
                    min={0}
                    max={100}
                    step={5}
                    className="py-1"
                  />
                  <p className="text-xs text-gray-500">
                    Deductible: ${form.amount ? (parseFloat(form.amount) * (form.write_off_percentage / 100)).toFixed(2) : "0.00"}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-gray-300 text-xs">Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional notes or receipt details"
                  rows={2}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 text-sm resize-none"
                />
              </div>

              <Button
                onClick={handleAddExpense}
                className="bg-steel-mid hover:bg-steel-dark text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
