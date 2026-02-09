import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ReviewCard from "./ReviewCard";
import { useFeaturedReviews } from "@/hooks/useReviews";
import { Skeleton } from "@/components/ui/skeleton";

import review1 from "@/assets/review-1.jpg";
import review2 from "@/assets/review-2.jpg";
import review3 from "@/assets/review-3.jpg";

const fallbackImages = [review1, review2, review3];

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

const FeaturedReviews = () => {
  const { data: reviews, isLoading } = useFeaturedReviews();

  return (
    <section id="reviews" className="relative py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-steel-mid">
            Latest
          </span>
          <h2 className="font-serif text-3xl font-bold gradient-steel-text md:text-4xl">
            Featured Reviews
          </h2>
        </motion.div>

        {isLoading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6">
                <Skeleton className="mb-4 aspect-square w-full rounded-lg" />
                <Skeleton className="mb-2 h-4 w-24" />
                <Skeleton className="mb-2 h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : reviews && reviews.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review, i) => (
              <Link key={review.id} to={`/reviews/${review.slug}`}>
                <ReviewCard
                  image={review.image_url || fallbackImages[i % fallbackImages.length]}
                  title={review.title}
                  category={categoryLabels[review.category] || review.category}
                  rating={review.rating}
                  excerpt={review.excerpt}
                  index={i}
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No featured reviews yet.</p>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <Link
            to="/reviews"
            className="inline-flex items-center gap-2 rounded-lg steel-border px-8 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            View All Reviews <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedReviews;
