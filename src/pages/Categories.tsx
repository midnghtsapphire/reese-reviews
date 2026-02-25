import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import ReviewCard from "@/components/ReviewCard";
import SEOHead from "@/components/SEOHead";
import { CATEGORIES, getReviewsByCategory, getApprovedReviews, type ReviewCategory } from "@/lib/reviewStore";

const Categories = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const catParam = searchParams.get("cat") as ReviewCategory | null;
  const [selected, setSelected] = useState<ReviewCategory | null>(catParam);

  useEffect(() => {
    const cp = searchParams.get("cat") as ReviewCategory | null;
    setSelected(cp);
  }, [searchParams]);

  const handleSelect = (cat: ReviewCategory | null) => {
    setSelected(cat);
    if (cat) {
      setSearchParams({ cat });
    } else {
      setSearchParams({});
    }
  };

  const reviews = useMemo(() => {
    if (selected) return getReviewsByCategory(selected);
    return getApprovedReviews();
  }, [selected]);

  const selectedInfo = selected ? CATEGORIES.find((c) => c.value === selected) : null;

  return (
    <main id="main-content" className="min-h-screen pt-24 pb-16">
      <SEOHead
        title={selectedInfo ? `${selectedInfo.label} Reviews` : "Categories"}
        description={
          selectedInfo
            ? `Browse Reese's reviews in ${selectedInfo.label} — ${selectedInfo.description}`
            : "Browse reviews by category: Products, Food & Restaurants, Services, Entertainment, and Tech."
        }
      />
      <div className="container mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <h1 className="font-serif text-4xl font-bold gradient-steel-text md:text-5xl">
            {selectedInfo ? selectedInfo.label : "Categories"}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            {selectedInfo ? selectedInfo.description : "Explore reviews organized by what matters to you"}
          </p>
        </motion.div>

        {/* Category tabs */}
        <div className="mb-10 flex flex-wrap gap-3" role="tablist" aria-label="Review categories">
          <button
            role="tab"
            aria-selected={!selected}
            onClick={() => handleSelect(null)}
            className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
              !selected
                ? "gradient-steel text-primary-foreground"
                : "glass-card text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({getApprovedReviews().length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = getReviewsByCategory(cat.value).length;
            return (
              <button
                key={cat.value}
                role="tab"
                aria-selected={selected === cat.value}
                onClick={() => handleSelect(cat.value)}
                className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                  selected === cat.value
                    ? "gradient-steel text-primary-foreground"
                    : "glass-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat.icon} {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Reviews grid */}
        {reviews.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3" role="tabpanel">
            {reviews.map((review, i) => (
              <Link key={review.id} to={`/reviews/${review.slug}`}>
                <ReviewCard review={review} index={i} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center" role="tabpanel">
            <p className="text-4xl mb-4" aria-hidden="true">{selectedInfo?.icon || "📂"}</p>
            <h2 className="font-serif text-xl font-semibold text-foreground">
              No reviews in {selectedInfo?.label || "this category"} yet
            </h2>
            <p className="mt-2 text-muted-foreground">Check back soon or submit the first one!</p>
            <Link
              to="/submit"
              className="mt-6 inline-flex rounded-lg gradient-steel px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              Submit a Review
            </Link>
          </div>
        )}
      </div>
    </main>
  );
};

export default Categories;
