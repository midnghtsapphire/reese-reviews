import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
}

const SITE_NAME = "Reese Reviews";
const DEFAULT_DESCRIPTION =
  "Reese Reviews Everything — honest, unfiltered reviews on products, food, services, entertainment, and tech. From box to beautiful.";
const DEFAULT_KEYWORDS =
  "reese reviews, product reviews, honest reviews, food reviews, restaurant reviews, tech reviews, entertainment reviews, service reviews, unboxing, reesereviews";
const SITE_URL = "https://reesereviews.com";

export default function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonicalUrl,
  ogImage = "/reese-og.png",
  ogType = "website",
  noIndex = false,
}: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Honest Reviews on Everything`;
  const canonical = canonicalUrl || SITE_URL;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonical} />

      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          url: SITE_URL,
          description: DEFAULT_DESCRIPTION,
          author: {
            "@type": "Person",
            name: "Reese",
          },
          publisher: {
            "@type": "Organization",
            name: "GlowStar Labs",
          },
        })}
      </script>
    </Helmet>
  );
}

export function ReviewSEO({
  title,
  excerpt,
  rating,
  productName,
  slug,
}: {
  title: string;
  excerpt: string;
  rating: number;
  productName: string;
  slug: string;
}) {
  return (
    <Helmet>
      <title>{`${title} | Reese Reviews`}</title>
      <meta name="description" content={excerpt} />
      <link rel="canonical" href={`${SITE_URL}/reviews/${slug}`} />
      <meta property="og:title" content={`${title} | Reese Reviews`} />
      <meta property="og:description" content={excerpt} />
      <meta property="og:type" content="article" />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Review",
          name: title,
          description: excerpt,
          reviewRating: {
            "@type": "Rating",
            ratingValue: rating,
            bestRating: 5,
          },
          itemReviewed: {
            "@type": "Product",
            name: productName || title,
          },
          author: {
            "@type": "Person",
            name: "Reese",
          },
          publisher: {
            "@type": "Organization",
            name: "GlowStar Labs",
          },
        })}
      </script>
    </Helmet>
  );
}
