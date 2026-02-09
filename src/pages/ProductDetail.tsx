import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, ArrowLeft, ExternalLink, Package, MessageSquarePlus } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useProduct, useProductReviews } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading: productLoading } = useProduct(slug || "");
  const { data: reviews, isLoading: reviewsLoading } = useProductReviews(product?.id || "");

  if (productLoading) {
    return (
      <div className="min-h-screen gradient-dark-surface">
        <Navbar />
        <div className="container mx-auto px-6 pt-28">
          <Skeleton className="mb-8 h-8 w-48" />
          <Skeleton className="mb-4 h-12 w-3/4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen gradient-dark-surface">
        <Navbar />
        <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-6 pt-28 text-center">
          <Package size={64} className="mb-6 text-muted-foreground opacity-30" />
          <h1 className="mb-4 font-serif text-3xl font-bold text-foreground">
            Product Not Found
          </h1>
          <p className="mb-8 text-muted-foreground">
            The product you're looking for doesn't exist.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 rounded-lg gradient-steel px-6 py-3 font-medium text-primary-foreground"
          >
            <ArrowLeft size={16} /> Back to Products
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const avgRating = Number(product.average_rating) || 0;

  return (
    <div className="min-h-screen gradient-dark-surface">
      <Navbar />

      <article className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          {/* Back link */}
          <Link
            to="/products"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} /> Back to Products
          </Link>

          <div className="grid gap-12 lg:grid-cols-3">
            {/* Product Info */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {product.category && (
                  <span className="mb-3 inline-block rounded-md bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground capitalize">
                    {product.category}
                  </span>
                )}
                <h1 className="mb-4 font-serif text-3xl font-bold gradient-steel-text md:text-4xl">
                  {product.name}
                </h1>

                {/* Rating summary */}
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className={
                          i < Math.round(avgRating)
                            ? "fill-steel-shine text-steel-shine"
                            : "text-muted"
                        }
                      />
                    ))}
                  </div>
                  <span className="text-lg font-medium text-foreground">
                    {avgRating.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground">
                    ({product.review_count} {product.review_count === 1 ? 'review' : 'reviews'})
                  </span>
                </div>

                {product.description && (
                  <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
                    {product.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-4">
                  <Link to={`/submit-review?product=${product.slug}`}>
                    <Button className="gradient-steel text-primary-foreground">
                      <MessageSquarePlus size={16} className="mr-2" />
                      Write a Review
                    </Button>
                  </Link>
                  {product.external_link && (
                    <a
                      href={product.external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" className="steel-border">
                        <ExternalLink size={16} className="mr-2" />
                        View Product
                      </Button>
                    </a>
                  )}
                </div>
              </motion.div>

              {/* Reviews section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-16"
              >
                <h2 className="mb-8 font-serif text-2xl font-bold text-foreground">
                  Customer Reviews
                </h2>

                {reviewsLoading ? (
                  <div className="space-y-6">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="rounded-xl border border-border bg-card p-6">
                        <Skeleton className="mb-2 h-4 w-24" />
                        <Skeleton className="mb-4 h-6 w-1/2" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    ))}
                  </div>
                ) : reviews && reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="rounded-xl border border-border bg-card p-6"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={
                                  i < review.rating
                                    ? "fill-steel-shine text-steel-shine"
                                    : "text-muted"
                                }
                              />
                            ))}
                          </div>
                          {review.reviewer_name && (
                            <span className="text-sm text-muted-foreground">
                              by {review.reviewer_name}
                            </span>
                          )}
                        </div>
                        <h3 className="mb-2 font-serif text-lg font-semibold text-card-foreground">
                          {review.title}
                        </h3>
                        <p className="text-muted-foreground">{review.excerpt}</p>
                        <Link
                          to={`/reviews/${review.slug}`}
                          className="mt-4 inline-block text-sm font-medium text-steel-shine hover:underline"
                        >
                          Read full review →
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-card p-12 text-center">
                    <MessageSquarePlus size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
                    <p className="mb-4 text-muted-foreground">
                      No reviews yet. Be the first to review this product!
                    </p>
                    <Link to={`/submit-review?product=${product.slug}`}>
                      <Button className="gradient-steel text-primary-foreground">
                        Write a Review
                      </Button>
                    </Link>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-xl border border-border bg-card p-6">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="mb-6 aspect-square w-full rounded-lg object-cover"
                  />
                ) : (
                  <div className="mb-6 flex aspect-square w-full items-center justify-center rounded-lg bg-secondary">
                    <Package size={64} className="text-muted-foreground opacity-30" />
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Average Rating</span>
                    <span className="font-semibold text-foreground">{avgRating.toFixed(1)} / 5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Reviews</span>
                    <span className="font-semibold text-foreground">{product.review_count}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default ProductDetail;
