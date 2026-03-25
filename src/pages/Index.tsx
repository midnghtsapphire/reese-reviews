import HeroSection from "@/components/HeroSection";
import FeaturedReviews from "@/components/FeaturedReviews";
import CategoriesPreview from "@/components/CategoriesPreview";
import NewsletterSignup from "@/components/NewsletterSignup";
import SEOHead from "@/components/SEOHead";

const Index = () => {
  return (
    <main id="main-content">
      <SEOHead />
      <HeroSection />
      <FeaturedReviews />
      <CategoriesPreview />
      <NewsletterSignup />
    </main>
  );
};

export default Index;
