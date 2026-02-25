import HeroSection from "@/components/HeroSection";
import FeaturedReviews from "@/components/FeaturedReviews";
import CategoriesPreview from "@/components/CategoriesPreview";
import SEOHead from "@/components/SEOHead";

const Index = () => {
  return (
    <main id="main-content">
      <SEOHead />
      <HeroSection />
      <FeaturedReviews />
      <CategoriesPreview />
    </main>
  );
};

export default Index;
