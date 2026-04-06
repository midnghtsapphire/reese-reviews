// ============================================================
// SCHEMA JSON-LD — React component for injecting structured data
// Renders <script type="application/ld+json"> in the document head
// ============================================================

import { Helmet } from "react-helmet-async";
import { serializeJsonLd } from "@/services/schemaOrgService";

interface SchemaJsonLdProps {
  /** One or more Schema.org objects to render as JSON-LD */
  schemas: object[];
}

/**
 * Inject Schema.org JSON-LD structured data into the page head.
 * Supports multiple schema objects via @graph.
 *
 * Usage:
 * ```tsx
 * <SchemaJsonLd schemas={[reviewSchema, productSchema, breadcrumbSchema]} />
 * ```
 */
export default function SchemaJsonLd({ schemas }: SchemaJsonLdProps) {
  if (!schemas || schemas.length === 0) return null;

  const jsonLd = serializeJsonLd(...schemas);

  return (
    <Helmet>
      <script type="application/ld+json">{jsonLd}</script>
    </Helmet>
  );
}
