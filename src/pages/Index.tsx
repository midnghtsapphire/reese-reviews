import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturedReviews from "@/components/FeaturedReviews";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen gradient-dark-surface">
      <Navbar />
      <HeroSection />
      <FeaturedReviews />
      <AboutSection />
      <Footer />
    </div>
  );
};

export default Index;
