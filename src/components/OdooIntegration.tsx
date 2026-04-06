import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Package,
  DollarSign,
  BarChart3,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  getOdooConfig,
  saveOdooConfig,
  connectOdoo,
  DEMO_ODOO_EXPENSES,
  DEMO_ODOO_PRODUCTS,
} from "@/lib/odooClient";
import type { OdooConfig, OdooExpense, OdooProduct } from "@/lib/odooClient";

const PAYMENT_STATE_COLORS: Record<OdooExpense["payment_state"], string> = {
  paid: "bg-green-600 text-white",
  not_paid: "bg-red-600 text-white",
  in_payment: "bg-blue-600 text-white",
  partial: "bg-yellow-600 text-white",
  reversed: "bg-gray-600 text-white",
};

export function OdooIntegration() {
  const [config, setConfig] = useState<OdooConfig | null>(getOdooConfig());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<OdooConfig, "uid" | "connected" | "last_synced">>({
    url: "",
    database: "",
    username: "",
    api_key: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const expenses: OdooExpense[] = [];
  const products: OdooProduct[] = [];

  const totalSpent = expenses.reduce((s, e) => s + e.total_amount, 0);
  const inStockCount = products.filter((p) => p.qty_available > 0).length;

  const handleConnect = async () => {
    if (!form.url || !form.database || !form.username || !form.api_key) {
      setMessage({ type: "error", text: "All fields are required." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const updated = await connectOdoo({ ...form, connected: false });
      setConfig(updated);
      setShowForm(false);
      setMessage({ type: "success", text: "Connected to Odoo successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Connection failed." });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    const blank: OdooConfig = { ...form, connected: false };
    saveOdooConfig(blank);
    setConfig(null);
    setMessage({ type: "success", text: "Disconnected from Odoo." });
  };

  return (
    <div className="space-y-4">
      {/* Connection banner */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center gap-2">
          {config?.connected ? (
            <Wifi className="w-4 h-4 text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-gray-400" />
          )}
          <span className="text-sm text-gray-300">
            {config?.connected
              ? `Connected to ${config.url}`
              : "Not connected — connect Odoo to see your data"}
          </span>
        </div>
        <div className="flex gap-2">
          {config?.connected ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDisconnect}
              className="border-white/20 text-gray-300 hover:bg-white/10 text-xs"
            >
              Disconnect
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setShowForm(!showForm)}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
            >
              Configure Odoo
            </Button>
          )}
        </div>
      </div>

      {/* Config form */}
      {showForm && (
        <Card className="bg-white/10 border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base">Odoo Connection</CardTitle>
            <CardDescription className="text-gray-300 text-xs">
              Odoo Community Edition is free &amp; open source. Download at odoo.com. Supports US Chart of
              Accounts, expense tracking, and inventory management. For IRS tax form generation, use the
              Documents tab (PDFiller integration).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {message && (
              <Alert className={message.type === "success" ? "border-green-500/50 bg-green-500/10" : "border-red-500/50 bg-red-500/10"}>
                {message.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                )}
                <AlertDescription className={message.type === "success" ? "text-green-300" : "text-red-300"}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-gray-300 text-xs">Odoo URL</Label>
                <Input
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://mycompany.odoo.com"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-gray-300 text-xs">Database</Label>
                <Input
                  value={form.database}
                  onChange={(e) => setForm((f) => ({ ...f, database: e.target.value }))}
                  placeholder="mycompany"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-gray-300 text-xs">Username / Email</Label>
                <Input
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  placeholder="admin@mycompany.com"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-gray-300 text-xs">API Key</Label>
                <Input
                  type="password"
                  value={form.api_key}
                  onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
                  placeholder="Settings → Technical → API Keys"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 text-sm"
                />
              </div>
            </div>
            <Button
              onClick={handleConnect}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Connect
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-white/10 border border-white/20">
          <TabsTrigger value="overview" className="text-white data-[state=active]:bg-purple-600">
            Overview
          </TabsTrigger>
          <TabsTrigger value="expenses" className="text-white data-[state=active]:bg-purple-600">
            Expenses / Bills
          </TabsTrigger>
          <TabsTrigger value="inventory" className="text-white data-[state=active]:bg-purple-600">
            Inventory
          </TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white/10 border-white/20">
              <CardHeader className="pb-3">
                <CardDescription className="text-gray-400 text-xs">Total Bills</CardDescription>
                <CardTitle className="text-white text-2xl">{expenses.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart3 className="w-5 h-5 text-purple-400" />
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20">
              <CardHeader className="pb-3">
                <CardDescription className="text-gray-400 text-xs">Total Spent</CardDescription>
                <CardTitle className="text-white text-2xl">${totalSpent.toFixed(2)}</CardTitle>
              </CardHeader>
              <CardContent>
                <DollarSign className="w-5 h-5 text-green-400" />
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20">
              <CardHeader className="pb-3">
                <CardDescription className="text-gray-400 text-xs">Products in Stock</CardDescription>
                <CardTitle className="text-white text-2xl">{inStockCount}</CardTitle>
              </CardHeader>
              <CardContent>
                <Package className="w-5 h-5 text-blue-400" />
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20">
              <CardHeader className="pb-3">
                <CardDescription className="text-gray-400 text-xs">Connection</CardDescription>
                <CardTitle className="text-white text-lg">{config?.connected ? "Live" : "Offline"}</CardTitle>
              </CardHeader>
              <CardContent>
                {config?.connected ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Expenses/Bills */}
        <TabsContent value="expenses" className="mt-4">
          <Card className="bg-white/10 border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">Bills &amp; Vendor Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 px-3 text-gray-400 font-medium">Date</th>
                      <th className="text-left py-2 px-3 text-gray-400 font-medium">Reference</th>
                      <th className="text-left py-2 px-3 text-gray-400 font-medium">Vendor</th>
                      <th className="text-right py-2 px-3 text-gray-400 font-medium">Amount</th>
                      <th className="text-center py-2 px-3 text-gray-400 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-2 px-3 text-gray-300">{exp.date}</td>
                        <td className="py-2 px-3 text-white font-mono text-xs">{exp.name}</td>
                        <td className="py-2 px-3 text-gray-300">{exp.partner_name}</td>
                        <td className="py-2 px-3 text-right text-white">${exp.total_amount.toFixed(2)}</td>
                        <td className="py-2 px-3 text-center">
                          <Badge className={PAYMENT_STATE_COLORS[exp.payment_state]}>
                            {exp.payment_state.replace("_", " ")}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory */}
        <TabsContent value="inventory" className="mt-4">
          <Card className="bg-white/10 border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">Product Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 px-3 text-gray-400 font-medium">Product Name</th>
                      <th className="text-left py-2 px-3 text-gray-400 font-medium">Category</th>
                      <th className="text-right py-2 px-3 text-gray-400 font-medium">On Hand</th>
                      <th className="text-right py-2 px-3 text-gray-400 font-medium">Forecasted</th>
                      <th className="text-right py-2 px-3 text-gray-400 font-medium">List Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-2 px-3 text-white">{p.name}</td>
                        <td className="py-2 px-3 text-gray-300">{p.categ_id[1]}</td>
                        <td className="py-2 px-3 text-right">
                          <span className={p.qty_available > 0 ? "text-green-400" : "text-red-400"}>
                            {p.qty_available}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right text-gray-300">{p.virtual_available}</td>
                        <td className="py-2 px-3 text-right text-white">${p.list_price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
