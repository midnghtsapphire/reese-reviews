import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  AlertCircle,
  Download,
  CreditCard,
  Wallet,
  Receipt,
  Link2,
  BarChart2,
} from "lucide-react";
import { getPlaidTransactions, getPlaidAccounts } from "@/lib/plaidClient";

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

export function FinancialDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<"month" | "quarter" | "year">("month");

  const transactions = getPlaidTransactions();
  const accounts = getPlaidAccounts();
  const isConnected = accounts.length > 0;

  // Compute real metrics from actual transaction data
  const income = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const netIncome = income - expenses;
  const profitMargin = income > 0 ? ((netIncome / income) * 100).toFixed(1) : "0.0";

  // Build monthly chart data from real transactions
  const monthlyMap: Record<string, { month: string; revenue: number; expenses: number; net: number }> = {};
  for (const t of transactions) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("default", { month: "short" });
    if (!monthlyMap[key]) monthlyMap[key] = { month: label, revenue: 0, expenses: 0, net: 0 };
    if (t.amount > 0) monthlyMap[key].revenue += t.amount;
    else monthlyMap[key].expenses += Math.abs(t.amount);
  }
  const monthlyData = Object.values(monthlyMap)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((m) => ({ ...m, net: m.revenue - m.expenses }));

  // Build expense breakdown from real transactions
  const categoryMap: Record<string, number> = {};
  for (const t of transactions.filter((t) => t.amount < 0)) {
    const cat = t.category || "Other";
    categoryMap[cat] = (categoryMap[cat] || 0) + Math.abs(t.amount);
  }
  const expenseBreakdown = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  const handleExportData = () => {
    if (!monthlyData.length) return;
    const csvContent = `Month,Revenue,Expenses,Net Income\n${monthlyData
      .map((d) => `"${d.month}",${d.revenue.toFixed(2)},${d.expenses.toFixed(2)},${d.net.toFixed(2)}`)
      .join("\n")}`;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "financial-report.csv";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // ── Empty state ──────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-6 text-center">
        <div className="p-6 rounded-full bg-purple-500/10 border border-purple-500/30">
          <BarChart2 className="h-12 w-12 text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">No Financial Data Yet</h2>
          <p className="text-gray-400 max-w-md">
            Connect your bank accounts via Plaid to see real-time revenue, expenses, and profit analytics here.
          </p>
        </div>
        <Button
          className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
          onClick={() => window.location.href = "/payments"}
        >
          <Link2 className="h-4 w-4" />
          Connect Bank via Plaid
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        <Button variant={selectedPeriod === "month" ? "default" : "outline"} onClick={() => setSelectedPeriod("month")} size="sm">This Month</Button>
        <Button variant={selectedPeriod === "quarter" ? "default" : "outline"} onClick={() => setSelectedPeriod("quarter")} size="sm">This Quarter</Button>
        <Button variant={selectedPeriod === "year" ? "default" : "outline"} onClick={() => setSelectedPeriod("year")} size="sm">This Year</Button>
        <div className="ml-auto">
          <Button onClick={handleExportData} variant="outline" size="sm" className="flex items-center gap-2" disabled={!monthlyData.length}>
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-purple-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-gray-400">Total Revenue</CardDescription>
              <DollarSign className="h-5 w-5 text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">${income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-purple-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-gray-400">Total Expenses</CardDescription>
              <Receipt className="h-5 w-5 text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">${expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-purple-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-gray-400">Net Income</CardDescription>
              <TrendingUp className="h-5 w-5 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${netIncome >= 0 ? "text-green-400" : "text-red-400"}`}>
              ${netIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-purple-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-gray-400">Profit Margin</CardDescription>
              <Wallet className="h-5 w-5 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{profitMargin}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-md border border-white/20">
          <TabsTrigger value="overview" className="text-white data-[state=active]:bg-purple-600">Overview</TabsTrigger>
          <TabsTrigger value="transactions" className="text-white data-[state=active]:bg-purple-600">Transactions</TabsTrigger>
          <TabsTrigger value="pl-report" className="text-white data-[state=active]:bg-purple-600">P&L Report</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {monthlyData.length === 0 ? (
            <Card className="glass-card border-purple-500/20">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <BarChart2 className="h-10 w-10 text-gray-500 mb-3" />
                <p className="text-gray-400">No transaction history yet. Sync your accounts to see charts.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card border-purple-500/20">
                <CardHeader>
                  <CardTitle>Revenue vs Expenses</CardTitle>
                  <CardDescription>Monthly comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="month" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip contentStyle={{ backgroundColor: "#1e1e2e", border: "1px solid #8b5cf6" }} labelStyle={{ color: "#fff" }} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                      <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {expenseBreakdown.length > 0 && (
                <Card className="glass-card border-purple-500/20">
                  <CardHeader>
                    <CardTitle>Expense Breakdown</CardTitle>
                    <CardDescription>Category distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={expenseBreakdown} cx="50%" cy="50%" labelLine={false} label={(e) => `${e.name}: $${e.value.toFixed(0)}`} outerRadius={80} fill="#8884d8" dataKey="value">
                          {expenseBreakdown.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#1e1e2e", border: "1px solid #8b5cf6" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6 mt-6">
          <Card className="glass-card border-purple-500/20">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest financial activity from connected accounts</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CreditCard className="h-10 w-10 text-gray-500 mb-3" />
                  <p className="text-gray-400">No transactions yet. Sync your bank to see activity here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.slice(0, 20).map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:border-purple-500/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${t.amount > 0 ? "bg-green-500/20" : "bg-red-500/20"}`}>
                          {t.amount > 0 ? <TrendingUp className="h-5 w-5 text-green-400" /> : <TrendingDown className="h-5 w-5 text-red-400" />}
                        </div>
                        <div>
                          <p className="font-medium text-white">{t.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {t.category && <Badge variant="outline" className="text-xs">{t.category}</Badge>}
                            <span className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className={`text-lg font-semibold ${t.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                        {t.amount > 0 ? "+" : ""}${Math.abs(t.amount).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pl-report" className="space-y-6 mt-6">
          <Card className="glass-card border-purple-500/20">
            <CardHeader>
              <CardTitle>Profit & Loss Statement</CardTitle>
              <CardDescription>Based on connected account data</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BarChart2 className="h-10 w-10 text-gray-500 mb-3" />
                  <p className="text-gray-400">Connect your bank and sync transactions to generate a P&L report.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Revenue</h3>
                    <div className="space-y-2">
                      {transactions.filter((t) => t.amount > 0).slice(0, 5).map((t) => (
                        <div key={t.id} className="flex justify-between p-3 bg-white/5 rounded">
                          <span className="text-gray-300">{t.description}</span>
                          <span className="text-white font-medium">${t.amount.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between p-3 bg-green-500/20 rounded border border-green-500/30">
                        <span className="text-white font-semibold">Total Revenue</span>
                        <span className="text-green-400 font-bold">${income.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Expenses</h3>
                    <div className="space-y-2">
                      {expenseBreakdown.map((e) => (
                        <div key={e.name} className="flex justify-between p-3 bg-white/5 rounded">
                          <span className="text-gray-300">{e.name}</span>
                          <span className="text-white font-medium">${e.value.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between p-3 bg-red-500/20 rounded border border-red-500/30">
                        <span className="text-white font-semibold">Total Expenses</span>
                        <span className="text-red-400 font-bold">${expenses.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/20">
                    <div className="flex justify-between p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
                      <div>
                        <p className="text-white font-bold text-xl">Net Income</p>
                        <p className="text-gray-400 text-sm mt-1">Profit Margin: {profitMargin}%</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-2xl ${netIncome >= 0 ? "text-purple-400" : "text-red-400"}`}>${netIncome.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
