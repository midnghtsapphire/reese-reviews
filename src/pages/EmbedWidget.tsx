import { useSearchParams } from "react-router-dom";
import { Star } from "lucide-react";
import { useProductReviews, useProduct } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";

const EmbedWidget = () => {
  const [searchParams] = useSearchParams();
  const productSlug = searchParams.get("product");
  const limit = parseInt(searchParams.get("limit") || "3", 10);
  const theme = searchParams.get("theme") || "dark";

  const { data: product } = useProduct(productSlug || "");
  const { data: reviews, isLoading } = useProductReviews(product?.id || "");

  const displayedReviews = reviews?.slice(0, limit) || [];

  const bgClass = theme === "light" ? "bg-white" : "bg-[hsl(220,20%,12%)]";
  const textClass = theme === "light" ? "text-gray-900" : "text-gray-100";
  const mutedClass = theme === "light" ? "text-gray-500" : "text-gray-400";
  const borderClass = theme === "light" ? "border-gray-200" : "border-gray-700";

  if (isLoading) {
    return (
      <div className={`p-4 ${bgClass}`}>
        <Skeleton className="mb-4 h-6 w-48" />
        <div className="space-y-4">
          {[...Array(limit)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={`p-4 text-center ${bgClass} ${mutedClass}`}>
        Product not found
      </div>
    );
  }

  const avgRating = Number(product.average_rating) || 0;

  return (
    <div className={`font-sans ${bgClass} p-4`}>
      {/* Header */}
      <div className="mb-4">
        <h3 className={`text-lg font-semibold ${textClass}`}>{product.name}</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={16}
                className={
                  i < Math.round(avgRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : mutedClass
                }
              />
            ))}
          </div>
          <span className={`text-sm ${mutedClass}`}>
            {avgRating.toFixed(1)} ({product.review_count} reviews)
          </span>
        </div>
      </div>

      {/* Reviews */}
      {displayedReviews.length > 0 ? (
        <div className="space-y-3">
          {displayedReviews.map((review) => (
            <div
              key={review.id}
              className={`rounded-lg border p-3 ${borderClass}`}
            >
              <div className="mb-1 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={
                      i < review.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : mutedClass
                    }
                  />
                ))}
              </div>
              <p className={`text-sm font-medium ${textClass}`}>{review.title}</p>
              <p className={`text-xs ${mutedClass} line-clamp-2`}>{review.excerpt}</p>
              {review.reviewer_name && (
                <p className={`mt-1 text-xs ${mutedClass}`}>— {review.reviewer_name}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className={`text-sm ${mutedClass}`}>No reviews yet</p>
      )}

      {/* Powered by */}
      <div className={`mt-4 text-center text-xs ${mutedClass}`}>
        Powered by{" "}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium hover:underline"
        >
          Reese Reviews
        </a>
      </div>
    </div>
  );
};

export default EmbedWidget;
