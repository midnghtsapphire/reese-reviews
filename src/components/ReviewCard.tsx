import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface ReviewCardProps {
  image: string;
  title: string;
  category: string;
  rating: number;
  excerpt: string;
  index: number;
}

const ReviewCard = forwardRef<HTMLElement, ReviewCardProps>(
  ({ image, title, category, rating, excerpt, index }, ref) => {
    return (
      <motion.article
        ref={ref}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, delay: index * 0.15 }}
        className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:steel-glow"
      >
        <div className="relative aspect-square overflow-hidden">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <span className="absolute bottom-4 left-4 rounded-md bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            {category}
          </span>
        </div>

        <div className="p-5">
          <div className="mb-2 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < rating ? "fill-steel-shine text-steel-shine" : "text-muted"}
              />
            ))}
          </div>
          <h3 className="mb-2 font-serif text-lg font-semibold text-card-foreground">
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{excerpt}</p>
        </div>
      </motion.article>
    );
  }
);

ReviewCard.displayName = "ReviewCard";

export default ReviewCard;
