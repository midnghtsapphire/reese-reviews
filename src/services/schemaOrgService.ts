// ============================================================
// SCHEMA.ORG JSON-LD SERVICE
// Generates structured data for reviews, products, organization,
// breadcrumbs, and other Schema.org types for rich results
// ============================================================

import type { ReviewData } from "@/lib/reviewStore";

const SITE_URL = "https://reesereviews.com";
const ORG_NAME = "Reese Reviews";
const ORG_LOGO = `${SITE_URL}/logo.png`;

// ─── REVIEW SCHEMA ─────────────────────────────────────────

/**
 * Generate Schema.org Review + Product JSON-LD for a review page.
 * Combines Review, Product, and AggregateRating schemas.
 */
export function generateReviewSchema(review: ReviewData): object {
  const reviewSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Review",
    name: review.title,
    reviewBody: review.excerpt || review.content,
    datePublished: review.published_at || review.created_at,
    dateModified: review.updated_at || review.published_at || review.created_at,
    author: {
      "@type": "Person",
      name: review.author_name || "Reese Reviews Team",
    },
    publisher: {
      "@type": "Organization",
      name: ORG_NAME,
      logo: {
        "@type": "ImageObject",
        url: ORG_LOGO,
      },
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating.toString(),
      bestRating: "5",
      worstRating: "1",
    },
    url: `${SITE_URL}/reviews/${review.slug}`,
  };

  if (review.image_url) {
    reviewSchema.image = review.image_url;
  }

  // Add pros/cons as structured data
  if (review.pros && review.pros.length > 0) {
    reviewSchema.positiveNotes = {
      "@type": "ItemList",
      itemListElement: review.pros.map((pro, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: pro,
      })),
    };
  }

  if (review.cons && review.cons.length > 0) {
    reviewSchema.negativeNotes = {
      "@type": "ItemList",
      itemListElement: review.cons.map((con, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: con,
      })),
    };
  }

  return reviewSchema;
}

/**
 * Generate Schema.org Product JSON-LD with review rating.
 */
export function generateProductSchema(review: ReviewData): object {
  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: review.product_name || review.title,
    description: review.excerpt || review.content?.slice(0, 300),
    category: review.category,
    url: `${SITE_URL}/reviews/${review.slug}`,
    review: {
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating.toString(),
        bestRating: "5",
        worstRating: "1",
      },
      author: {
        "@type": "Person",
        name: review.author_name || "Reese Reviews Team",
      },
      datePublished: review.published_at || review.created_at,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: review.rating.toString(),
      bestRating: "5",
      worstRating: "1",
      reviewCount: "1",
      ratingCount: "1",
    },
  };

  if (review.image_url) {
    productSchema.image = review.image_url;
  }

  if (review.price) {
    productSchema.offers = {
      "@type": "Offer",
      price: review.price.toString(),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: review.affiliate_url || `${SITE_URL}/reviews/${review.slug}`,
    };
  }

  if (review.brand) {
    productSchema.brand = {
      "@type": "Brand",
      name: review.brand,
    };
  }

  return productSchema;
}

// ─── ORGANIZATION SCHEMA ───────────────────────────────────

/**
 * Generate Schema.org Organization JSON-LD for the business entity.
 */
export function generateOrganizationSchema(): object {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORG_NAME,
    url: SITE_URL,
    logo: ORG_LOGO,
    description:
      "Reese Reviews provides honest, in-depth product reviews to help consumers make informed purchasing decisions.",
    foundingDate: "2024",
    sameAs: [
      "https://www.facebook.com/reesereviews",
      "https://www.instagram.com/reesereviews",
      "https://twitter.com/reesereviews",
      "https://www.youtube.com/@reesereviews",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: `${SITE_URL}/contact`,
      availableLanguage: "English",
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "US",
    },
  };
}

// ─── WEBSITE SCHEMA ────────────────────────────────────────

/**
 * Generate Schema.org WebSite JSON-LD with search action.
 */
export function generateWebSiteSchema(): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: ORG_NAME,
    url: SITE_URL,
    description: "Honest, in-depth product reviews you can trust",
    publisher: {
      "@type": "Organization",
      name: ORG_NAME,
      logo: {
        "@type": "ImageObject",
        url: ORG_LOGO,
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/reviews?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// ─── BREADCRUMB SCHEMA ─────────────────────────────────────

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * Generate Schema.org BreadcrumbList JSON-LD.
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

/**
 * Generate breadcrumb items for a review page.
 */
export function getReviewBreadcrumbs(review: ReviewData): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [
    { name: "Home", url: "/" },
    { name: "Reviews", url: "/reviews" },
  ];

  if (review.category) {
    crumbs.push({
      name: formatCategoryName(review.category),
      url: `/categories?category=${review.category}`,
    });
  }

  crumbs.push({
    name: review.title,
    url: `/reviews/${review.slug}`,
  });

  return crumbs;
}

/**
 * Generate breadcrumb items for a category page.
 */
export function getCategoryBreadcrumbs(categoryName: string, categorySlug: string): BreadcrumbItem[] {
  return [
    { name: "Home", url: "/" },
    { name: "Categories", url: "/categories" },
    { name: categoryName, url: `/categories?category=${categorySlug}` },
  ];
}

// ─── ARTICLE SCHEMA (for blog posts) ──────────────────────

/**
 * Generate Schema.org Article JSON-LD for blog posts.
 */
export function generateArticleSchema(article: {
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  author?: string;
  published_at: string;
  updated_at?: string;
  image_url?: string;
  tags?: string[];
}): object {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    author: {
      "@type": "Person",
      name: article.author || "Reese Reviews Team",
    },
    publisher: {
      "@type": "Organization",
      name: ORG_NAME,
      logo: {
        "@type": "ImageObject",
        url: ORG_LOGO,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${article.slug}`,
    },
    url: `${SITE_URL}/blog/${article.slug}`,
  };

  if (article.image_url) {
    schema.image = article.image_url;
  }

  if (article.tags && article.tags.length > 0) {
    schema.keywords = article.tags.join(", ");
  }

  return schema;
}

// ─── FAQ SCHEMA ────────────────────────────────────────────

/**
 * Generate Schema.org FAQPage JSON-LD.
 */
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

// ─── COLLECTION PAGE SCHEMA ────────────────────────────────

/**
 * Generate Schema.org CollectionPage JSON-LD for review listing pages.
 */
export function generateCollectionPageSchema(
  title: string,
  description: string,
  url: string,
  itemCount: number
): object {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: url.startsWith("http") ? url : `${SITE_URL}${url}`,
    numberOfItems: itemCount,
    publisher: {
      "@type": "Organization",
      name: ORG_NAME,
    },
  };
}

// ─── JSON-LD INJECTION HELPER ──────────────────────────────

/**
 * Serialize one or more schema objects into a JSON-LD script tag string.
 * For use with dangerouslySetInnerHTML or Helmet.
 */
export function serializeJsonLd(...schemas: object[]): string {
  if (schemas.length === 1) {
    return JSON.stringify(schemas[0]);
  }
  // Use @graph for multiple schemas
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": schemas.map((s) => {
      const copy = { ...s } as Record<string, unknown>;
      delete copy["@context"];
      return copy;
    }),
  });
}

// ─── UTILITIES ─────────────────────────────────────────────

function formatCategoryName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
