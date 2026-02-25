import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import ReviewCard from "@/components/ReviewCard";
import SEOHead from "@/components/SEOHead";
import { getApprovedReviews, CATEGORIES, type ReviewCategory } from "@/lib/reviewStore";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "highest", label: "Highest Rated" },
  { value: "lowest", label: "Lowest Rated" },
];

const Reviews = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ReviewCategory | "all">("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  const allReviews = getApprovedReviews();

  const filteredReviews = useMemo(() => {
    let results = allReviews;

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.excerpt.toLowerCase().includes(q) ||
          r.product_name.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== "all") {
      results = results.filter((r) => r.category === selectedCategory);
    }

    results.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.published_at).getTime() - new Date(b.published_at).getTime();
        case "highest":
          return b.rating - a.rating;
        case "lowest":
          return a.rating - b.rating;
        default:
          return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      }
    });

    return results;
  }, [allReviews, search, selectedCategory, sortBy]);

  return (
    <main id="main-content" className="min-h-screen pt-24 pb-16">
      <SEOHead
        title="All Reviews"
        description="Browse all of Reese's honest reviews on products, food, services, entertainment, and tech."
      />
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="font-serif text-4xl font-bold gradient-steel-text md:text-5xl">
            All Reviews
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Every review, every category — find exactly what you're looking for
          </p>
        </motion.div>

        {/* Search and Filter Bar */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search reviews..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg glass-input py-3 pl-11 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Search reviews"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 rounded-lg steel-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent md:hidden"
            aria-expanded={showFilters}
          >
            <SlidersHorizontal size={16} /> Filters
          </button>

          <div className={`flex flex-wrap gap-3 ${showFilters ? "" : "hidden md:flex"}`}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ReviewCategory | "all")}
              className="rounded-lg glass-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Filter by category"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg glass-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Sort reviews"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count */}
        <p className="mb-6 text-sm text-muted-foreground" role="status" aria-live="polite">
          Showing {filteredReviews.length} review{filteredReviews.length !== 1 ? "s" : ""}
          {search && ` for "${search}"`}
          {selectedCategory !== "all" && ` in ${CATEGORIES.find((c) => c.value === selectedCategory)?.label}`}
        </p>

        {/* Reviews Grid */}
        {filteredReviews.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredReviews.map((review, i) => (
              <Link key={review.id} to={`/reviews/${review.slug}`}>
                <ReviewCard review={review} index={i} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-4xl mb-4" aria-hidden="true">🔍</p>
            <h2 className="font-serif text-xl font-semibold text-foreground">No reviews found</h2>
            <p className="mt-2 text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export default Reviews;
