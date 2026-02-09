import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Shield, LogOut, Check, X, Trash2, 
  Eye, Filter, Star, MessageSquare, Package 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useAllReviews, useUpdateReviewStatus, useDeleteReview, useAllProducts } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const statusFilters = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

  const { data: isAdmin, isLoading: adminLoading, refetch: refetchAdmin } = useIsAdmin();
  const { data: reviews, isLoading: reviewsLoading } = useAllReviews(statusFilter);
  const { data: products } = useAllProducts();
  const updateStatus = useUpdateReviewStatus();
  const deleteReview = useDeleteReview();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        refetchAdmin();
      }
    );

    return () => subscription.unsubscribe();
  }, [refetchAdmin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast({ title: "Logged in successfully" });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logged out" });
  };

  const handleApprove = (id: string) => {
    updateStatus.mutate(
      { id, status: "approved" },
      {
        onSuccess: () => toast({ title: "Review approved" }),
        onError: () => toast({ title: "Failed to approve", variant: "destructive" }),
      }
    );
  };

  const handleReject = (id: string) => {
    updateStatus.mutate(
      { id, status: "rejected" },
      {
        onSuccess: () => toast({ title: "Review rejected" }),
        onError: () => toast({ title: "Failed to reject", variant: "destructive" }),
      }
    );
  };

  const handleDelete = () => {
    if (!reviewToDelete) return;
    deleteReview.mutate(reviewToDelete, {
      onSuccess: () => {
        toast({ title: "Review deleted" });
        setDeleteDialogOpen(false);
        setReviewToDelete(null);
      },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  };

  // Login screen
  if (!user) {
    return (
      <div className="min-h-screen gradient-dark-surface flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-xl border border-border bg-card p-8"
        >
          <div className="mb-8 text-center">
            <Shield size={48} className="mx-auto mb-4 text-steel-shine" />
            <h1 className="font-serif text-2xl font-bold gradient-steel-text">
              Admin Login
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to access the admin dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isLoggingIn}
              className="w-full gradient-steel text-primary-foreground"
            >
              {isLoggingIn ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Loading admin check
  if (adminLoading) {
    return (
      <div className="min-h-screen gradient-dark-surface flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="mx-auto mb-4 h-12 w-12 rounded-full" />
          <Skeleton className="mx-auto h-6 w-48" />
        </div>
      </div>
    );
  }

  // Not an admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen gradient-dark-surface flex items-center justify-center px-6">
        <div className="text-center">
          <Shield size={64} className="mx-auto mb-6 text-danger" />
          <h1 className="mb-4 font-serif text-2xl font-bold text-foreground">
            Access Denied
          </h1>
          <p className="mb-8 text-muted-foreground">
            You don't have permission to access this page.
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={handleLogout}>
              <LogOut size={16} className="mr-2" />
              Logout
            </Button>
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen gradient-dark-surface">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Shield size={24} className="text-steel-shine" />
            <h1 className="font-serif text-xl font-bold gradient-steel-text">
              Admin Dashboard
            </h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut size={16} className="mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="reviews" className="space-y-8">
          <TabsList className="bg-secondary">
            <TabsTrigger value="reviews" className="gap-2">
              <MessageSquare size={16} />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package size={16} />
              Products
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="space-y-6">
            {/* Status Filters */}
            <div className="flex items-center gap-3">
              <Filter size={16} className="text-muted-foreground" />
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    statusFilter === filter.value
                      ? "gradient-steel text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Reviews List */}
            {reviewsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
              </div>
            ) : reviews && reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border bg-card p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              review.status === "approved"
                                ? "bg-success/20 text-success"
                                : review.status === "rejected"
                                ? "bg-danger/20 text-danger"
                                : "bg-warning/20 text-warning"
                            }`}
                          >
                            {review.status}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {review.category}
                          </span>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                className={
                                  i < review.rating
                                    ? "fill-steel-shine text-steel-shine"
                                    : "text-muted"
                                }
                              />
                            ))}
                          </div>
                        </div>
                        <h3 className="mb-1 font-serif text-lg font-semibold text-card-foreground">
                          {review.title}
                        </h3>
                        <p className="mb-2 text-sm text-muted-foreground">
                          {review.excerpt}
                        </p>
                        {review.reviewer_name && (
                          <p className="text-xs text-muted-foreground">
                            by {review.reviewer_name} ({review.reviewer_email})
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/reviews/${review.slug}`)}
                        >
                          <Eye size={14} />
                        </Button>
                        {review.status !== "approved" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(review.id)}
                            className="text-success hover:bg-success/10"
                          >
                            <Check size={14} />
                          </Button>
                        )}
                        {review.status !== "rejected" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(review.id)}
                            className="text-warning hover:bg-warning/10"
                          >
                            <X size={14} />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReviewToDelete(review.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-danger hover:bg-danger/10"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-12 text-center">
                <MessageSquare size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
                <p className="text-muted-foreground">No reviews found</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            {products && products.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-xl border border-border bg-card p-6"
                  >
                    <h3 className="mb-2 font-serif text-lg font-semibold text-card-foreground">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star size={14} className="fill-steel-shine text-steel-shine" />
                      <span>{Number(product.average_rating).toFixed(1)}</span>
                      <span>•</span>
                      <span>{product.review_count} reviews</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-12 text-center">
                <Package size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
                <p className="text-muted-foreground">No products yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
