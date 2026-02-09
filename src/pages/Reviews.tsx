import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Filter, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useReviews } from "@/hooks/useReviews";
import { Skeleton } from "@/components/ui/skeleton";

const categories = [
  { value: "all", label: "All Reviews" },
  { value: "home-office", label: "Home Office" },
  { value: "furniture", label: "Furniture" },
  { value: "organization", label: "Organization" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom", label: "Bathroom" },
  { value: "tech", label: "Tech" },
  { value: "decor", label: "Decor" },
  { value: "outdoor", label: "Outdoor" },
];

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

const Reviews = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { data: reviews, isLoading } = useReviews(selectedCategory);

  return (
    <div className="min-h-screen gradient-dark-surface">
      <Navbar />

      {/* Header */}
      <section className="border-b border-border pb-12 pt-28">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-steel-mid">
              Browse
            </span>
            <h1 className="mb-4 font-serif text-4xl font-bold gradient-steel-text md:text-5xl">
              All Reviews
            </h1>
            <p className="mx-auto max-w-lg text-muted-foreground">
              Unfiltered takes on buying, assembling, and everything in between.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-border py-6">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <Filter size={16} className="shrink-0 text-muted-foreground" />
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  selectedCategory === cat.value
                    ? "gradient-steel text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          {isLoading ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-6">
                  <Skeleton className="mb-4 h-48 w-full rounded-lg" />
                  <Skeleton className="mb-2 h-4 w-24" />
                  <Skeleton className="mb-2 h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : reviews && reviews.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review, i) => (
                <motion.article
                  key={review.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:steel-glow"
                >
                  <Link to={`/reviews/${review.slug}`}>
                    <div className="relative aspect-video overflow-hidden bg-secondary">
                      {review.image_url ? (
                        <img
                          src={review.image_url}
                          alt={review.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="text-4xl opacity-30">📦</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      <span className="absolute bottom-3 left-3 rounded-md bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                        {categoryLabels[review.category] || review.category}
                      </span>
                    </div>

                    <div className="p-5">
                      <div className="mb-2 flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            size={14}
                            className={
                              idx < review.rating
                                ? "fill-steel-shine text-steel-shine"
                                : "text-muted"
                            }
                          />
                        ))}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {review.rating}/5
                        </span>
                      </div>
                      <h2 className="mb-2 font-serif text-lg font-semibold text-card-foreground group-hover:gradient-steel-text transition-all">
                        {review.title}
                      </h2>
                      <p className="mb-4 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                        {review.excerpt}
                      </p>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-steel-shine">
                        Read Review <ArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-lg text-muted-foreground">
                No reviews found in this category yet.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Reviews;
