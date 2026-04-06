import HeroSection from "@/components/HeroSection";
import FeaturedReviews from "@/components/FeaturedReviews";
import CategoriesPreview from "@/components/CategoriesPreview";
import SEOHead from "@/components/SEOHead";
import SchemaJsonLd from "@/components/seo/SchemaJsonLd";
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
} from "@/services/schemaOrgService";

const Index = () => {
  const orgSchema = generateOrganizationSchema();
  const siteSchema = generateWebSiteSchema();

  return (
    <main id="main-content">
      <SEOHead />
      {/* Schema.org JSON-LD: Organization + WebSite for homepage */}
      <SchemaJsonLd schemas={[orgSchema, siteSchema]} />
      <HeroSection />
      <FeaturedReviews />
      <CategoriesPreview />
    </main>
  );
};

export default Index;
