import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp } from "lucide-react";
import ReviewCard from "./ReviewCard";
import { getFeaturedReviews } from "@/lib/reviewStore";

const FeaturedReviews = () => {
  const reviews = getFeaturedReviews();

  return (
    <section id="reviews" className="relative py-24" aria-labelledby="featured-heading">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <span className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-steel-mid">
            <TrendingUp size={14} /> Trending
          </span>
          <h2
            id="featured-heading"
            className="font-serif text-3xl font-bold gradient-steel-text md:text-4xl"
          >
            Featured Reviews
          </h2>
          <p className="mt-3 text-muted-foreground">
            The latest and most popular reviews, handpicked by Reese
          </p>
        </motion.div>

        {reviews.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review, i) => (
              <Link key={review.id} to={`/reviews/${review.slug}`}>
                <ReviewCard review={review} index={i} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No featured reviews yet. Check back soon!</p>
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
