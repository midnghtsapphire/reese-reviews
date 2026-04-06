// ============================================================
// REVIEW SCHEMA WRAPPER — Adds all Schema.org markup to review pages
// Combines Review, Product, Breadcrumb, and Organization schemas
// ============================================================

import SchemaJsonLd from "./SchemaJsonLd";
import {
  generateReviewSchema,
  generateProductSchema,
  generateBreadcrumbSchema,
  getReviewBreadcrumbs,
  generateOrganizationSchema,
} from "@/services/schemaOrgService";
import type { ReviewData } from "@/lib/reviewStore";

interface ReviewSchemaWrapperProps {
  review: ReviewData;
}

/**
 * Wraps a review page with complete Schema.org structured data:
 * - Review schema with rating, pros/cons
 * - Product schema with aggregate rating and offers
 * - BreadcrumbList for navigation
 * - Organization for the publisher
 */
export default function ReviewSchemaWrapper({ review }: ReviewSchemaWrapperProps) {
  const reviewSchema = generateReviewSchema(review);
  const productSchema = generateProductSchema(review);
  const breadcrumbs = getReviewBreadcrumbs(review);
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
  const orgSchema = generateOrganizationSchema();

  return (
    <SchemaJsonLd
      schemas={[reviewSchema, productSchema, breadcrumbSchema, orgSchema]}
    />
  );
}
