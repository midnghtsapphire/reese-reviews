import React, { useState } from "react";
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
  Cell 
} from "recharts";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  AlertCircle,
  Download,
  CreditCard,
  Wallet,
  Receipt
} from "lucide-react";

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

// Demo data for placeholder
const DEMO_MONTHLY_DATA = [
  { month: "Jan", revenue: 4200, expenses: 2100, net: 2100 },
  { month: "Feb", revenue: 3800, expenses: 1900, net: 1900 },
  { month: "Mar", revenue: 5100, expenses: 2400, net: 2700 },
  { month: "Apr", revenue: 4600, expenses: 2200, net: 2400 },
  { month: "May", revenue: 5400, expenses: 2600, net: 2800 },
  { month: "Jun", revenue: 6200, expenses: 2900, net: 3300 },
];

const DEMO_EXPENSE_BREAKDOWN = [
  { name: "Inventory", value: 8500 },
  { name: "Marketing", value: 3200 },
  { name: "Shipping", value: 2100 },
  { name: "Software", value: 1200 },
  { name: "Other", value: 800 },
];

const DEMO_TRANSACTIONS = [
  {
    id: "1",
    date: "2025-03-09",
    description: "Amazon Affiliate Commission",
    category: "Revenue",
    amount: 425.00,
    type: "income" as const,
  },
  {
    id: "2",
    date: "2025-03-08",
    description: "Product Sample Purchase",
    category: "Inventory",
    amount: -89.99,
    type: "expense" as const,
  },
  {
    id: "3",
    date: "2025-03-07",
    description: "Google Ads Campaign",
    category: "Marketing",
    amount: -150.00,
    type: "expense" as const,
  },
  {
    id: "4",
    date: "2025-03-06",
    description: "Subscription Revenue",
    category: "Revenue",
    amount: 99.00,
    type: "income" as const,
  },
  {
    id: "5",
    date: "2025-03-05",
    description: "Shipping Supplies",
    category: "Shipping",
    amount: -45.50,
    type: "expense" as const,
  },
];

export function FinancialDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<"month" | "quarter" | "year">("month");

  // Calculate summary metrics (from demo data)
  const totalRevenue = DEMO_MONTHLY_DATA.reduce((sum, d) => sum + d.revenue, 0);
  const totalExpenses = DEMO_MONTHLY_DATA.reduce((sum, d) => sum + d.expenses, 0);
  const netIncome = totalRevenue - totalExpenses;
  const profitMargin = ((netIncome / totalRevenue) * 100).toFixed(1);

  const handleExportData = () => {
    const csvContent = `Month,Revenue,Expenses,Net Income\n${DEMO_MONTHLY_DATA.map(
      (d) => `"${d.month}","${d.revenue}","${d.expenses}","${d.net}"`
    ).join("\n")}`;
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

  return (
    <div className="space-y-6">
      {/* Plaid Integration Alert */}
      <Alert className="bg-purple-900/30 border-purple-500/50">
        <AlertCircle className="h-4 w-4 text-purple-400" />
        <AlertDescription className="text-purple-200">
          <strong>Plaid Integration Placeholder:</strong> This dashboard is currently using demo data. 
          Connect your bank accounts via Plaid to see real-time financial data and automated transaction tracking.
        </AlertDescription>
      </Alert>

      {/* Period Selector */}
      <div className="flex gap-2">
        <Button
          variant={selectedPeriod === "month" ? "default" : "outline"}
          onClick={() => setSelectedPeriod("month")}
          size="sm"
        >
          This Month
        </Button>
        <Button
          variant={selectedPeriod === "quarter" ? "default" : "outline"}
          onClick={() => setSelectedPeriod("quarter")}
          size="sm"
        >
          This Quarter
        </Button>
        <Button
          variant={selectedPeriod === "year" ? "default" : "outline"}
          onClick={() => setSelectedPeriod("year")}
          size="sm"
        >
          This Year
        </Button>
        <div className="ml-auto">
          <Button onClick={handleExportData} variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Card */}
        <Card className="glass-card border-purple-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-gray-400">Total Revenue</CardDescription>
              <DollarSign className="h-5 w-5 text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">${totalRevenue.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-2 text-sm text-green-400">
              <ArrowUpRight className="h-4 w-4" />
              <span>+12.5%</span>
              <span className="text-gray-400">vs last period</span>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Card */}
        <Card className="glass-card border-purple-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-gray-400">Total Expenses</CardDescription>
              <Receipt className="h-5 w-5 text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">${totalExpenses.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-2 text-sm text-red-400">
              <ArrowUpRight className="h-4 w-4" />
              <span>+8.2%</span>
              <span className="text-gray-400">vs last period</span>
            </div>
          </CardContent>
        </Card>

        {/* Net Income Card */}
        <Card className="glass-card border-purple-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-gray-400">Net Income</CardDescription>
              <TrendingUp className="h-5 w-5 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">${netIncome.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-2 text-sm text-green-400">
              <ArrowUpRight className="h-4 w-4" />
              <span>+18.3%</span>
              <span className="text-gray-400">vs last period</span>
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow Card */}
        <Card className="glass-card border-purple-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-gray-400">Profit Margin</CardDescription>
              <Wallet className="h-5 w-5 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{profitMargin}%</div>
            <div className="flex items-center gap-1 mt-2 text-sm text-green-400">
              <ArrowUpRight className="h-4 w-4" />
              <span>+3.2%</span>
              <span className="text-gray-400">vs last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-md border border-white/20">
          <TabsTrigger value="overview" className="text-white data-[state=active]:bg-purple-600">
            Overview
          </TabsTrigger>
          <TabsTrigger value="transactions" className="text-white data-[state=active]:bg-purple-600">
            Transactions
          </TabsTrigger>
          <TabsTrigger value="pl-report" className="text-white data-[state=active]:bg-purple-600">
            P&L Report
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue & Expenses Chart */}
            <Card className="glass-card border-purple-500/20">
              <CardHeader>
                <CardTitle>Revenue vs Expenses</CardTitle>
                <CardDescription>Monthly comparison (last 6 months)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={DEMO_MONTHLY_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="month" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1e1e2e", border: "1px solid #8b5cf6" }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                    <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Expense Breakdown Chart */}
            <Card className="glass-card border-purple-500/20">
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>Category distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={DEMO_EXPENSE_BREAKDOWN}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: $${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {DEMO_EXPENSE_BREAKDOWN.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1e1e2e", border: "1px solid #8b5cf6" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Net Income Trend */}
          <Card className="glass-card border-purple-500/20">
            <CardHeader>
              <CardTitle>Net Income Trend</CardTitle>
              <CardDescription>Monthly net profit over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={DEMO_MONTHLY_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="month" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e1e2e", border: "1px solid #8b5cf6" }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="net" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    name="Net Income"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6 mt-6">
          <Card className="glass-card border-purple-500/20">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest financial activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {DEMO_TRANSACTIONS.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:border-purple-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        transaction.type === "income" ? "bg-green-500/20" : "bg-red-500/20"
                      }`}>
                        {transaction.type === "income" ? (
                          <TrendingUp className="h-5 w-5 text-green-400" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">{transaction.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {transaction.category}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {new Date(transaction.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`text-lg font-semibold ${
                      transaction.type === "income" ? "text-green-400" : "text-red-400"
                    }`}>
                      {transaction.type === "income" ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* P&L Report Tab */}
        <TabsContent value="pl-report" className="space-y-6 mt-6">
          <Card className="glass-card border-purple-500/20">
            <CardHeader>
              <CardTitle>Profit & Loss Statement</CardTitle>
              <CardDescription>Year-to-date summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Revenue Section */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Revenue</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between p-3 bg-white/5 rounded">
                      <span className="text-gray-300">Affiliate Commissions</span>
                      <span className="text-white font-medium">$18,500</span>
                    </div>
                    <div className="flex justify-between p-3 bg-white/5 rounded">
                      <span className="text-gray-300">Sponsorships</span>
                      <span className="text-white font-medium">$8,200</span>
                    </div>
                    <div className="flex justify-between p-3 bg-white/5 rounded">
                      <span className="text-gray-300">Subscription Revenue</span>
                      <span className="text-white font-medium">$2,500</span>
                    </div>
                    <div className="flex justify-between p-3 bg-green-500/20 rounded border border-green-500/30">
                      <span className="text-white font-semibold">Total Revenue</span>
                      <span className="text-green-400 font-bold">${totalRevenue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Expenses Section */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Expenses</h3>
                  <div className="space-y-2">
                    {DEMO_EXPENSE_BREAKDOWN.map((expense) => (
                      <div key={expense.name} className="flex justify-between p-3 bg-white/5 rounded">
                        <span className="text-gray-300">{expense.name}</span>
                        <span className="text-white font-medium">${expense.value.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between p-3 bg-red-500/20 rounded border border-red-500/30">
                      <span className="text-white font-semibold">Total Expenses</span>
                      <span className="text-red-400 font-bold">${totalExpenses.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Net Income */}
                <div className="pt-4 border-t border-white/20">
                  <div className="flex justify-between p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
                    <div>
                      <p className="text-white font-bold text-xl">Net Income</p>
                      <p className="text-gray-400 text-sm mt-1">Profit Margin: {profitMargin}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-purple-400 font-bold text-2xl">${netIncome.toLocaleString()}</p>
                      <div className="flex items-center gap-1 mt-1 text-green-400 text-sm">
                        <ArrowUpRight className="h-4 w-4" />
                        <span>+18.3% YoY</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
