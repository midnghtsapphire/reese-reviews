import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
  hoverRating?: number;
  onHover?: (rating: number) => void;
  showLabel?: boolean;
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = 16,
  interactive = false,
  onRate,
  hoverRating = 0,
  onHover,
  showLabel = false,
}: StarRatingProps) {
  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-1" role="img" aria-label={`${rating} out of ${maxRating} stars`}>
      {Array.from({ length: maxRating }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= displayRating;

        if (interactive) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => onRate?.(starValue)}
              onMouseEnter={() => onHover?.(starValue)}
              onMouseLeave={() => onHover?.(0)}
              className="p-0.5 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2"
              aria-label={`Rate ${starValue} star${starValue !== 1 ? "s" : ""}`}
            >
              <Star
                size={size}
                className={isFilled ? "fill-steel-shine text-steel-shine" : "text-muted"}
              />
            </button>
          );
        }

        return (
          <Star
            key={i}
            size={size}
            className={isFilled ? "fill-steel-shine text-steel-shine" : "text-muted"}
            aria-hidden="true"
          />
        );
      })}
      {showLabel && rating > 0 && (
        <span className="ml-1 text-sm text-muted-foreground">
          {rating}/{maxRating}
        </span>
      )}
    </div>
  );
}
