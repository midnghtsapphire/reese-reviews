import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Clock, Zap, Copy } from "lucide-react";
import {
  getPendingVineReviews,
  getInProgressVineReviews,
  getOverdueVineReviews,
  updateVineReviewStatus,
  generateVineReviewTemplate,
  daysUntilDeadline,
  getVineItems,
} from "@/lib/vineScraperEnhanced";
import type { VineItem } from "@/lib/businessTypes";

export function VineDashboard() {
  const [selectedItem, setSelectedItem] = useState<VineItem | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingReviews, setPendingReviews] = useState<VineItem[]>([]);
  const [inProgressReviews, setInProgressReviews] = useState<VineItem[]>([]);
  const [overdueReviews, setOverdueReviews] = useState<VineItem[]>([]);
  const [allItems, setAllItems] = useState<VineItem[]>([]);

  useEffect(() => {
    loadVineData();
  }, []);

  const loadVineData = async () => {
    try {
      setLoading(true);
      const [pending, inProgress, overdue, all] = await Promise.all([
        getPendingVineReviews(),
        getInProgressVineReviews(),
        getOverdueVineReviews(),
        getVineItems(),
      ]);
      setPendingReviews(pending);
      setInProgressReviews(inProgress);
      setOverdueReviews(overdue);
      setAllItems(all);
    } catch (error) {
      console.error("Error loading Vine data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTemplate = (item: VineItem) => {
    const template = generateVineReviewTemplate(item);
    navigator.clipboard.writeText(template);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const handleMarkCompleted = async (itemId: string) => {
    await updateVineReviewStatus(itemId, "submitted");
    await loadVineData(); // Reload data after update
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-steel-shine border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Vine items...</p>
        </div>
      </div>
    );
  }

  const VineItemCard = ({ item }: { item: VineItem }) => {
    const daysLeft = daysUntilDeadline(item.review_deadline);
    const isUrgent = daysLeft < 7;
    const isOverdue = daysLeft < 0;

    return (
      <div className="p-4 border rounded-lg hover:bg-gray-50 transition">
        <div className="flex gap-4">
          <img src={item.image_url} alt={item.product_name} className="w-20 h-20 object-cover rounded" />
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold">{item.product_name}</h3>
                <p className="text-sm text-gray-600">{item.asin}</p>
              </div>
              <Badge
                variant={
                  isOverdue ? "destructive" : isUrgent ? "secondary" : item.review_status === "submitted" ? "default" : "outline"
                }
              >
                {isOverdue ? "OVERDUE" : isUrgent ? `${daysLeft} days left` : item.review_status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div>
                <p className="text-gray-600">ETV Value</p>
                <p className="font-semibold">${item.estimated_value.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">Deadline</p>
                <p className="font-semibold">{new Date(item.review_deadline).toLocaleDateString()}</p>
              </div>
            </div>

            {item.review_status === "pending" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    handleCopyTemplate(item);
                    setSelectedItem(item);
                  }}
                >
                  <Zap className="mr-1 h-4 w-4" />
                  Generate Template
                </Button>
                <Button size="sm" onClick={() => handleMarkCompleted(item.id)}>
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Mark Completed
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Amazon Vine Dashboard</h2>
        <p className="text-gray-600">Track your Vine reviews and deadlines</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{allItems.length}</div>
            <p className="text-xs text-gray-500 mt-1">Vine items received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Reviews</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-blue-600">{pendingReviews.length}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting your review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-yellow-600">{inProgressReviews.length}</div>
            <p className="text-xs text-gray-500 mt-1">Being reviewed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Overdue</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className={`text-2xl font-bold ${overdueReviews.length > 0 ? "text-red-600" : "text-green-600"}`}>
              {overdueReviews.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Past deadline</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {overdueReviews.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {overdueReviews.length} item{overdueReviews.length !== 1 ? "s" : ""} past deadline. Complete reviews ASAP to maintain Vine eligibility.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pending ({pendingReviews.length})
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            In Progress ({inProgressReviews.length})
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Overdue ({overdueReviews.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Reviews</CardTitle>
              <CardDescription>Items waiting for your review</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingReviews.length > 0 ? (
                pendingReviews.map((item) => <VineItemCard key={item.id} item={item} />)
              ) : (
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>No pending reviews! Great work!</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* In Progress Tab */}
        <TabsContent value="in-progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>In Progress</CardTitle>
              <CardDescription>Items you're currently reviewing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {inProgressReviews.length > 0 ? (
                inProgressReviews.map((item) => <VineItemCard key={item.id} item={item} />)
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No items in progress</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overdue Tab */}
        <TabsContent value="overdue" className="space-y-4">
          {overdueReviews.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                These items are past their review deadline. Complete them immediately to avoid Vine suspension.
              </AlertDescription>
            </Alert>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Overdue Reviews</CardTitle>
              <CardDescription>Items past their deadline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {overdueReviews.length > 0 ? (
                overdueReviews.map((item) => <VineItemCard key={item.id} item={item} />)
              ) : (
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>No overdue items!</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Template */}
      {selectedItem && (
        <Card className="border-steel-shine/20 bg-gradient-to-br from-steel-shine/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Review Template: {selectedItem.product_name}</span>
              <Button
                size="sm"
                onClick={() => handleCopyTemplate(selectedItem)}
                variant={copiedTemplate ? "default" : "outline"}
              >
                <Copy className="mr-1 h-4 w-4" />
                {copiedTemplate ? "Copied!" : "Copy Template"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              readOnly
              value={generateVineReviewTemplate(selectedItem)}
              className="w-full h-64 p-3 border rounded-lg font-mono text-sm bg-white"
            />
            <p className="text-xs text-gray-600 mt-2">
              This template is copied to your clipboard. Paste it into Amazon Vine and customize with your experience.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tax Info */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>💰 Tax Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>ETV (Estimated Tax Value)</strong> is reported to the IRS on Form 1099-NEC as miscellaneous income. Each Vine item's ETV is automatically tracked in the Tax Dashboard.
          </p>
          <p>
            <strong>Completed reviews</strong> count toward your Vine eligibility. Missing deadlines can result in suspension.
          </p>
          <p>
            <strong>Items not reviewed</strong> after 6 months can be donated to your rental company as a capital contribution (tax deductible).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
