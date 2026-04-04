import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, ThumbsUp, ThumbsDown, Share2 } from "lucide-react";
import StarRating from "@/components/StarRating";
import { ReviewSEO } from "@/components/SEOHead";
import SEOHead from "@/components/SEOHead";
import { getReviewBySlug, generateAffiliateLink, CATEGORIES } from "@/lib/reviewStore";
import { AvatarReviewOverlay } from "@/components/avatar";

const ReviewDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const review = slug ? getReviewBySlug(slug) : undefined;

  if (!review) {
    return (
      <main id="main-content" className="min-h-screen pt-24 pb-16">
        <SEOHead title="Review Not Found" noIndex />
        <div className="container mx-auto px-6 text-center py-20">
          <p className="text-5xl mb-4" aria-hidden="true">📝</p>
          <h1 className="font-serif text-3xl font-bold text-foreground">Review Not Found</h1>
          <p className="mt-3 text-muted-foreground">This review may have been moved or doesn't exist.</p>
          <Link to="/reviews" className="mt-6 inline-flex items-center gap-2 rounded-lg gradient-steel px-6 py-3 text-sm font-semibold text-primary-foreground">
            <ArrowLeft size={16} /> Back to Reviews
          </Link>
        </div>
      </main>
    );
  }

  const catInfo = CATEGORIES.find((c) => c.value === review.category);
  const affiliateUrl = review.product_link ? generateAffiliateLink(review.product_link, review.affiliate_tag) : "";

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: review.title, text: review.excerpt, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <main id="main-content" className="min-h-screen pt-24 pb-16">
      <ReviewSEO
        title={review.title}
        excerpt={review.excerpt}
        rating={review.rating}
        productName={review.product_name}
        slug={review.slug}
      />

      <article className="container mx-auto max-w-4xl px-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link to="/reviews" className="hover:text-foreground">Reviews</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link to={`/categories?cat=${review.category}`} className="hover:text-foreground">{catInfo?.label}</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-foreground font-medium truncate max-w-[200px]">{review.title}</li>
          </ol>
        </nav>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <header className="mb-10">
            <span className="category-badge mb-4 inline-flex">
              {catInfo?.icon} {catInfo?.label}
            </span>
            <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
              {review.title}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              {review.excerpt}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-6">
              <StarRating rating={review.rating} size={20} showLabel />
              <time dateTime={review.published_at} className="text-sm text-muted-foreground">
                {new Date(review.published_at).toLocaleDateString("en-US", {
                  month: "long", day: "numeric", year: "numeric",
                })}
              </time>
              <span className="text-sm text-muted-foreground">By {review.reviewer_name}</span>
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Share this review"
              >
                <Share2 size={14} /> Share
              </button>
            </div>
          </header>

          {/* Image */}
          {review.image_url && (
            <div className="mb-10 overflow-hidden rounded-xl">
              <img src={review.image_url} alt={review.title} className="w-full object-cover" />
            </div>
          )}

          {/* Product info card */}
          {review.product_name && (
            <div className="mb-10 glass-card-strong rounded-xl p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Reviewing
              </h2>
              <p className="font-serif text-xl font-semibold text-foreground">{review.product_name}</p>
              {affiliateUrl && (
                <a
                  href={affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg gradient-steel px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
                >
                  Check Price <ExternalLink size={14} />
                </a>
              )}
              {affiliateUrl && (
                <p className="mt-2 text-[10px] text-muted-foreground/50">
                  Affiliate link — we may earn a commission at no extra cost to you
                </p>
              )}
            </div>
          )}

          {/* Review content */}
          <div className="prose prose-invert max-w-none mb-10">
            {review.content.split("\n").map((paragraph, i) => (
              <p key={i} className="mb-4 text-foreground/90 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Pros and Cons */}
          {(review.pros.length > 0 || review.cons.length > 0) && (
            <div className="mb-10 grid gap-6 md:grid-cols-2">
              {review.pros.length > 0 && (
                <div className="glass-card rounded-xl p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold text-foreground">
                    <ThumbsUp size={18} className="text-green-400" /> Pros
                  </h3>
                  <ul className="space-y-2">
                    {review.pros.map((pro, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                        <span className="mt-1 text-green-400" aria-hidden="true">+</span>
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {review.cons.length > 0 && (
                <div className="glass-card rounded-xl p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold text-foreground">
                    <ThumbsDown size={18} className="text-red-400" /> Cons
                  </h3>
                  <ul className="space-y-2">
                    {review.cons.map((con, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                        <span className="mt-1 text-red-400" aria-hidden="true">−</span>
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Reese's Quick Take — Avatar Overlay */}
          <AvatarReviewOverlay
            reviewTitle={review.title}
            rating={review.rating}
            quickTake={review.verdict || review.excerpt}
          />

          {/* Verdict */}
          {review.verdict && (
            <div className="mb-10 glass-card-strong rounded-xl p-8 text-center">
              <h3 className="font-serif text-xl font-bold gradient-steel-text mb-3">The Verdict</h3>
              <p className="text-lg text-foreground/90 leading-relaxed">{review.verdict}</p>
              <div className="mt-4">
                <StarRating rating={review.rating} size={24} showLabel />
              </div>
            </div>
          )}

          {/* Back link */}
          <div className="mt-12 text-center">
            <Link
              to="/reviews"
              className="inline-flex items-center gap-2 rounded-lg steel-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <ArrowLeft size={16} /> Back to All Reviews
            </Link>
          </div>
        </motion.div>
      </article>
    </main>
  );
};

export default ReviewDetail;
