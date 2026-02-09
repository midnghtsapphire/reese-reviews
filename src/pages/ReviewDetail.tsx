import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, ArrowLeft, Check, X, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useReview } from "@/hooks/useReviews";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const categoryLabels: Record<string, string> = {
  "home-office": "Home Office",
  furniture: "Furniture",
  organization: "Organization",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  tech: "Tech",
  decor: "Decor",
  outdoor: "Outdoor",
};

const ReviewDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: review, isLoading } = useReview(slug || "");

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-dark-surface">
        <Navbar />
        <div className="container mx-auto px-6 pt-28">
          <Skeleton className="mb-4 h-8 w-48" />
          <Skeleton className="mb-8 h-12 w-3/4" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen gradient-dark-surface">
        <Navbar />
        <div className="container mx-auto px-6 py-32 text-center">
          <h1 className="mb-4 font-serif text-3xl font-bold text-foreground">
            Review Not Found
          </h1>
          <p className="mb-8 text-muted-foreground">
            The review you're looking for doesn't exist.
          </p>
          <Link
            to="/reviews"
            className="inline-flex items-center gap-2 rounded-lg gradient-steel px-6 py-3 text-sm font-medium text-primary-foreground"
          >
            <ArrowLeft size={16} /> Back to Reviews
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-dark-surface">
      <Navbar />

      {/* Header */}
      <section className="border-b border-border pb-12 pt-28">
        <div className="container mx-auto px-6">
          <Link
            to="/reviews"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} /> Back to All Reviews
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="rounded-md bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                {categoryLabels[review.category] || review.category}
              </span>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={
                      i < review.rating
                        ? "fill-steel-shine text-steel-shine"
                        : "text-muted"
                    }
                  />
                ))}
              </div>
              {review.published_at && (
                <span className="text-sm text-muted-foreground">
                  {format(new Date(review.published_at), "MMMM d, yyyy")}
                </span>
              )}
            </div>

            <h1 className="mb-4 font-serif text-3xl font-bold gradient-steel-text md:text-5xl">
              {review.title}
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              {review.excerpt}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2"
            >
              {review.image_url && (
                <div className="mb-8 overflow-hidden rounded-xl">
                  <img
                    src={review.image_url}
                    alt={review.title}
                    className="h-auto w-full object-cover"
                  />
                </div>
              )}

              <div className="prose prose-invert max-w-none">
                {review.content.split("\n\n").map((paragraph, i) => {
                  if (paragraph.startsWith("## ")) {
                    return (
                      <h2
                        key={i}
                        className="mb-4 mt-8 font-serif text-2xl font-bold text-foreground"
                      >
                        {paragraph.replace("## ", "")}
                      </h2>
                    );
                  }
                  return (
                    <p key={i} className="mb-4 leading-relaxed text-muted-foreground">
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            </motion.div>

            {/* Sidebar */}
            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {/* Product Info Card */}
              {review.product_name && (
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="mb-4 font-serif text-lg font-semibold text-card-foreground">
                    Product
                  </h3>
                  <p className="mb-4 font-medium text-foreground">
                    {review.product_name}
                  </p>
                  {review.product_link && (
                    <a
                      href={review.product_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg gradient-steel px-4 py-2 text-sm font-medium text-primary-foreground"
                    >
                      View Product <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              )}

              {/* Pros & Cons */}
              {(review.pros?.length || review.cons?.length) && (
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="mb-4 font-serif text-lg font-semibold text-card-foreground">
                    The Breakdown
                  </h3>

                  {review.pros && review.pros.length > 0 && (
                    <div className="mb-6">
                      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-success">
                        <Check size={16} /> Pros
                      </h4>
                      <ul className="space-y-2">
                        {review.pros.map((pro, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {review.cons && review.cons.length > 0 && (
                    <div>
                      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-danger">
                        <X size={16} /> Cons
                      </h4>
                      <ul className="space-y-2">
                        {review.cons.map((con, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Verdict */}
              {review.verdict && (
                <div className="rounded-xl border border-steel-mid/30 bg-steel-dark/50 p-6">
                  <h3 className="mb-3 font-serif text-lg font-semibold gradient-steel-text">
                    The Verdict
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {review.verdict}
                  </p>
                </div>
              )}
            </motion.aside>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ReviewDetail;
