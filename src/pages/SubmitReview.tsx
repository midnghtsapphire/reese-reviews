import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, ArrowLeft, Send, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useProducts, useProduct } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type ReviewCategory = Database["public"]["Enums"]["review_category"];

const reviewSchema = z.object({
  reviewer_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  reviewer_email: z.string().trim().email("Please enter a valid email"),
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(200),
  excerpt: z.string().trim().min(20, "Summary must be at least 20 characters").max(300),
  content: z.string().trim().min(100, "Review must be at least 100 characters").max(5000),
  rating: z.number().min(1, "Please select a rating").max(5),
  pros: z.string().optional(),
  cons: z.string().optional(),
  product_id: z.string().optional(),
  category: z.string().min(1, "Please select a category"),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

const categories: { value: ReviewCategory; label: string }[] = [
  { value: "home-office", label: "Home Office" },
  { value: "furniture", label: "Furniture" },
  { value: "organization", label: "Organization" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom", label: "Bathroom" },
  { value: "tech", label: "Tech" },
  { value: "decor", label: "Decor" },
  { value: "outdoor", label: "Outdoor" },
];

const SubmitReview = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const productSlug = searchParams.get("product");
  const { data: selectedProduct } = useProduct(productSlug || "");
  const { data: products } = useProducts();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      category: selectedProduct?.category || "",
      product_id: selectedProduct?.id || "",
    },
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      + "-" + Date.now().toString(36);
  };

  const onSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true);
    try {
      const slug = generateSlug(data.title);
      const pros = data.pros?.split("\n").filter(Boolean) || null;
      const cons = data.cons?.split("\n").filter(Boolean) || null;

      const { error } = await supabase.from("reviews").insert({
        title: data.title,
        slug,
        excerpt: data.excerpt,
        content: data.content,
        rating: data.rating,
        category: data.category as ReviewCategory,
        product_id: data.product_id || null,
        reviewer_name: data.reviewer_name,
        reviewer_email: data.reviewer_email,
        pros,
        cons,
        status: "pending",
        is_featured: false,
      });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Review Submitted!",
        description: "Your review has been submitted for moderation.",
      });
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen gradient-dark-surface">
        <Navbar />
        <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-6 pt-28 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <CheckCircle size={80} className="mx-auto mb-6 text-success" />
          </motion.div>
          <h1 className="mb-4 font-serif text-3xl font-bold gradient-steel-text">
            Thank You!
          </h1>
          <p className="mb-8 max-w-md text-muted-foreground">
            Your review has been submitted and is pending moderation. We'll notify you once it's approved.
          </p>
          <div className="flex gap-4">
            <Link to="/">
              <Button variant="outline" className="steel-border">
                Back to Home
              </Button>
            </Link>
            <Link to="/products">
              <Button className="gradient-steel text-primary-foreground">
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-dark-surface">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="container mx-auto max-w-2xl px-6">
          <Link
            to={productSlug ? `/products/${productSlug}` : "/products"}
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h1 className="mb-4 font-serif text-3xl font-bold gradient-steel-text md:text-4xl">
              Write a Review
            </h1>
            <p className="text-muted-foreground">
              Share your experience and help others make informed decisions.
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6 rounded-xl border border-border bg-card p-8"
          >
            {/* Your Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="reviewer_name">Your Name *</Label>
                <Input
                  id="reviewer_name"
                  {...register("reviewer_name")}
                  placeholder="John Doe"
                  className="mt-1"
                />
                {errors.reviewer_name && (
                  <p className="mt-1 text-sm text-danger">{errors.reviewer_name.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="reviewer_email">Your Email *</Label>
                <Input
                  id="reviewer_email"
                  type="email"
                  {...register("reviewer_email")}
                  placeholder="john@example.com"
                  className="mt-1"
                />
                {errors.reviewer_email && (
                  <p className="mt-1 text-sm text-danger">{errors.reviewer_email.message}</p>
                )}
              </div>
            </div>

            {/* Product Selection */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Product (optional)</Label>
                <Select
                  defaultValue={selectedProduct?.id}
                  onValueChange={(value) => setValue("product_id", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category *</Label>
                <Select
                  defaultValue={selectedProduct?.category || ""}
                  onValueChange={(value) => setValue("category", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="mt-1 text-sm text-danger">{errors.category.message}</p>
                )}
              </div>
            </div>

            {/* Rating */}
            <div>
              <Label>Rating *</Label>
              <div className="mt-2 flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setRating(star);
                      setValue("rating", star);
                    }}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      size={28}
                      className={
                        star <= (hoverRating || rating)
                          ? "fill-steel-shine text-steel-shine"
                          : "text-muted"
                      }
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    {rating} / 5
                  </span>
                )}
              </div>
              {errors.rating && (
                <p className="mt-1 text-sm text-danger">{errors.rating.message}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Review Title *</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Give your review a catchy title"
                className="mt-1"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-danger">{errors.title.message}</p>
              )}
            </div>

            {/* Excerpt */}
            <div>
              <Label htmlFor="excerpt">Short Summary *</Label>
              <Textarea
                id="excerpt"
                {...register("excerpt")}
                placeholder="A brief summary of your review (shown in cards)"
                className="mt-1"
                rows={2}
              />
              {errors.excerpt && (
                <p className="mt-1 text-sm text-danger">{errors.excerpt.message}</p>
              )}
            </div>

            {/* Content */}
            <div>
              <Label htmlFor="content">Full Review *</Label>
              <Textarea
                id="content"
                {...register("content")}
                placeholder="Share your detailed experience..."
                className="mt-1"
                rows={6}
              />
              {errors.content && (
                <p className="mt-1 text-sm text-danger">{errors.content.message}</p>
              )}
            </div>

            {/* Pros & Cons */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="pros">Pros (one per line)</Label>
                <Textarea
                  id="pros"
                  {...register("pros")}
                  placeholder="Great build quality&#10;Easy to assemble&#10;Good value"
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="cons">Cons (one per line)</Label>
                <Textarea
                  id="cons"
                  {...register("cons")}
                  placeholder="Instructions unclear&#10;Missing parts&#10;Expensive shipping"
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full gradient-steel text-primary-foreground"
            >
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send size={16} className="mr-2" />
                  Submit Review
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              By submitting, you agree that your review may be published on our site.
              Reviews are moderated before appearing publicly.
            </p>
          </motion.form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SubmitReview;
