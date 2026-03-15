import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, AlertCircle, CheckCircle2, DollarSign, TrendingUp, FileText } from "lucide-react";
import {
  getETVRecords,
  get1099Forms,
  getCapitalEvents,
  getDonations,
  calculateTaxPeriodSummary,
  generateETVSummaryCSV,
  generateCapitalGainsCSV,
  generateDonationCSV,
  generate1099ReconciliationReport,
  reconcile1099,
} from "@/lib/taxStore";
import type { TaxPeriodSummary } from "@/lib/taxTypes";

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

export function TaxDashboard() {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedPeriod, setSelectedPeriod] = useState<"year" | "quarter" | "month">("year");
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(1);

  const etvRecords = getETVRecords().filter((r) => r.tax_year === selectedYear);
  const forms1099 = get1099Forms().filter((f) => f.tax_year === selectedYear);
  const capitalEvents = getCapitalEvents().filter((e) => e.tax_year === selectedYear);
  const donations = getDonations().filter((d) => d.tax_year === selectedYear);

  let summary: TaxPeriodSummary;
  if (selectedPeriod === "quarter") {
    summary = calculateTaxPeriodSummary(selectedYear, selectedQuarter);
  } else if (selectedPeriod === "month") {
    summary = calculateTaxPeriodSummary(selectedYear, undefined, selectedMonth);
  } else {
    summary = calculateTaxPeriodSummary(selectedYear);
  }

  // Prepare chart data
  const etvByMonth = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const total = etvRecords
      .filter((r) => new Date(r.received_date).getMonth() + 1 === month)
      .reduce((sum, r) => sum + r.etv_amount, 0);
    return { month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i], etv: total };
  });

  const capitalGainsByType = [
    { name: "Short-term Gains", value: summary.short_term_gains, fill: COLORS[2] },
    { name: "Short-term Losses", value: Math.abs(summary.short_term_losses), fill: COLORS[4] },
    { name: "Long-term Gains", value: summary.long_term_gains, fill: COLORS[0] },
    { name: "Long-term Losses", value: Math.abs(summary.long_term_losses), fill: COLORS[3] },
  ].filter((item) => item.value !== 0);

  const handleDownloadCSV = (type: "etv" | "capital" | "donations" | "1099") => {
    let csv = "";
    let filename = "";

    switch (type) {
      case "etv":
        csv = generateETVSummaryCSV(selectedYear);
        filename = `Vine_ETV_${selectedYear}.csv`;
        break;
      case "capital":
        csv = generateCapitalGainsCSV(selectedYear);
        filename = `Capital_Gains_${selectedYear}.csv`;
        break;
      case "donations":
        csv = generateDonationCSV(selectedYear);
        filename = `Donations_${selectedYear}.csv`;
        break;
      case "1099":
        csv = generate1099ReconciliationReport(selectedYear);
        filename = `1099_Reconciliation_${selectedYear}.txt`;
        break;
    }

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  const handleReconcile1099 = () => {
    if (forms1099.length > 0) {
      reconcile1099(forms1099[0]);
      alert("1099 reconciliation complete");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Tax Dashboard</h2>
          <p className="text-gray-600">Track Vine income, capital gains, and tax deductions</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg"
          >
            {[2025, 2026].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Period Selection */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-transparent">
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex gap-2">
              <Button
                variant={selectedPeriod === "year" ? "default" : "outline"}
                onClick={() => setSelectedPeriod("year")}
              >
                Full Year
              </Button>
              <Button
                variant={selectedPeriod === "quarter" ? "default" : "outline"}
                onClick={() => setSelectedPeriod("quarter")}
              >
                Quarter
              </Button>
              <Button
                variant={selectedPeriod === "month" ? "default" : "outline"}
                onClick={() => setSelectedPeriod("month")}
              >
                Month
              </Button>
            </div>

            {selectedPeriod === "quarter" && (
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                className="px-3 py-2 border rounded-lg"
              >
                {[1, 2, 3, 4].map((q) => (
                  <option key={q} value={q}>
                    Q{q}
                  </option>
                ))}
              </select>
            )}

            {selectedPeriod === "month" && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2 border rounded-lg"
              >
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                  <option key={i} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Vine ETV Income</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">${summary.total_etv_vine.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">{summary.vine_items_completed} completed reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Capital Gains/Losses</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className={`text-2xl font-bold ${summary.net_capital_gain_loss >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${summary.net_capital_gain_loss.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">{capitalEvents.length} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Charitable Donations</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">${summary.charitable_donations.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">{summary.donation_count} donations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Net Income</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className={`text-2xl font-bold ${summary.net_income >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${summary.net_income.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">After deductions</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="etv" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="etv">ETV Income</TabsTrigger>
          <TabsTrigger value="capital">Capital Gains</TabsTrigger>
          <TabsTrigger value="donations">Donations</TabsTrigger>
          <TabsTrigger value="1099">1099 Reconciliation</TabsTrigger>
        </TabsList>

        {/* ETV Tab */}
        <TabsContent value="etv" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vine ETV by Month</CardTitle>
              <CardDescription>Estimated Tax Value reported to IRS</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={etvByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Bar dataKey="etv" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ETV Items ({etvRecords.length})</CardTitle>
              <CardDescription>All Vine items received</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {etvRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{record.product_name}</p>
                      <p className="text-sm text-gray-600">{record.asin}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${record.etv_amount.toFixed(2)}</p>
                      <Badge variant={record.review_status === "completed" ? "default" : "secondary"}>
                        {record.review_status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={() => handleDownloadCSV("etv")} className="w-full mt-4">
                <Download className="mr-2 h-4 w-4" />
                Download ETV Report (CSV)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Capital Gains Tab */}
        <TabsContent value="capital" className="space-y-4">
          {capitalGainsByType.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Capital Gains & Losses</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={capitalGainsByType} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: $${value.toFixed(2)}`} outerRadius={80} fill="#8884d8" dataKey="value">
                      {capitalGainsByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No capital gains or losses recorded for this period</AlertDescription>
            </Alert>
          )}

          {capitalEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Transactions ({capitalEvents.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {capitalEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{event.product_name}</p>
                        <p className="text-sm text-gray-600">
                          {event.event_type} • {event.long_term ? "Long-term" : "Short-term"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${event.gain_loss >= 0 ? "text-green-600" : "text-red-600"}`}>
                          ${event.gain_loss.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={() => handleDownloadCSV("capital")} className="w-full mt-4">
                  <Download className="mr-2 h-4 w-4" />
                  Download Capital Gains Report (CSV)
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Donations Tab */}
        <TabsContent value="donations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Charitable Donations & Capital Contributions</CardTitle>
              <CardDescription>Items donated to rental company or charities (tax deductible)</CardDescription>
            </CardHeader>
            <CardContent>
              {donations.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {donations.map((donation) => (
                    <div key={donation.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{donation.product_name}</p>
                        <Badge variant={donation.tax_deductible ? "default" : "secondary"}>
                          {donation.tax_deductible ? "Deductible" : "Non-deductible"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>
                          <p>Cost Basis: ${donation.acquisition_cost.toFixed(2)}</p>
                          <p>FMV: ${donation.fair_market_value.toFixed(2)}</p>
                        </div>
                        <div>
                          <p>Recipient: {donation.recipient}</p>
                          <p>Date: {new Date(donation.donation_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {donation.form_8283_required && (
                        <Alert className="mt-2 border-amber-200 bg-amber-50">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-amber-800">Form 8283 required (FMV &gt; $5,000)</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No donations recorded for this period</AlertDescription>
                </Alert>
              )}
              {donations.length > 0 && (
                <Button onClick={() => handleDownloadCSV("donations")} className="w-full mt-4">
                  <Download className="mr-2 h-4 w-4" />
                  Download Donations Report (CSV)
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 1099 Reconciliation Tab */}
        <TabsContent value="1099" className="space-y-4">
          {forms1099.length > 0 ? (
            forms1099.map((form) => (
              <Card key={form.id} className={form.filing_status === "discrepancy" ? "border-red-200" : "border-green-200"}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>1099-NEC from {form.payer_name}</span>
                    <Badge variant={form.filing_status === "reconciled" ? "default" : form.filing_status === "discrepancy" ? "destructive" : "secondary"}>
                      {form.filing_status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Amazon Reported (Box 1a)</p>
                      <p className="text-2xl font-bold">${form.box_1a_etv_vine.toFixed(2)}</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">App Calculated</p>
                      <p className="text-2xl font-bold">${form.app_total_etv.toFixed(2)}</p>
                    </div>
                  </div>

                  {form.discrepancy_amount !== 0 && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        Discrepancy: ${form.discrepancy_amount.toFixed(2)} — {form.discrepancy_notes}
                      </AlertDescription>
                    </Alert>
                  )}

                  {form.discrepancy_amount === 0 && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">Perfect match! No discrepancies found.</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={handleReconcile1099} variant="outline" className="flex-1">
                      <FileText className="mr-2 h-4 w-4" />
                      Reconcile
                    </Button>
                    <Button onClick={() => handleDownloadCSV("1099")} variant="outline" className="flex-1">
                      <Download className="mr-2 h-4 w-4" />
                      Download Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No 1099 forms received yet. They typically arrive in January.</AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
