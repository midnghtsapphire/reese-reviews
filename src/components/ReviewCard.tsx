import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import StarRating from "./StarRating";
import { CATEGORIES, generateAffiliateLink, type ReviewData } from "@/lib/reviewStore";

interface ReviewCardProps {
  review: ReviewData;
  index?: number;
}

const categoryIcons: Record<string, string> = {
  products: "📦",
  "food-restaurants": "🍽️",
  services: "🛠️",
  entertainment: "🎬",
  tech: "💻",
};

export default function ReviewCard({ review, index = 0 }: ReviewCardProps) {
  const catInfo = CATEGORIES.find((c) => c.value === review.category);
  const affiliateUrl = review.product_link
    ? generateAffiliateLink(review.product_link, review.affiliate_tag)
    : "";

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group glass-card rounded-xl overflow-hidden transition-all duration-300 hover:border-steel-mid/30"
    >
      {/* Image area */}
      <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
        {review.image_url ? (
          <img
            src={review.image_url}
            alt={review.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-secondary to-muted">
            <span className="text-5xl" aria-hidden="true">
              {categoryIcons[review.category] || "📝"}
            </span>
          </div>
        )}
        <span className="absolute bottom-3 left-3 category-badge">
          {catInfo?.icon} {catInfo?.label || review.category}
        </span>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="mb-2 flex items-center justify-between">
          <StarRating rating={review.rating} size={14} />
          <time
            dateTime={review.published_at}
            className="text-xs text-muted-foreground"
          >
            {new Date(review.published_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </time>
        </div>

        <h3 className="mb-2 font-serif text-lg font-semibold text-card-foreground line-clamp-2 group-hover:gradient-steel-text transition-all">
          {review.title}
        </h3>

        <p className="mb-4 text-sm leading-relaxed text-muted-foreground line-clamp-2">
          {review.excerpt}
        </p>

        {review.product_name && (
          <p className="mb-3 text-xs text-muted-foreground">
            Reviewing: <span className="font-medium text-foreground/80">{review.product_name}</span>
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-steel-shine">
            Read Review →
          </span>
          {affiliateUrl && (
            <a
              href={affiliateUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="affiliate-link text-xs"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Buy ${review.product_name} (affiliate link)`}
            >
              Buy Now <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
}
