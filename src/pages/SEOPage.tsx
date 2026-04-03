import SEOHead from "@/components/SEOHead";
import SEODashboard from "@/components/seo/SEODashboard";

export default function SEOPage() {
  return (
    <>
      <SEOHead
        title="SEO / SEM / Marketing | Reese Reviews"
        description="Monitor SEO health, manage meta tags, track backlinks, and schedule social media content."
        keywords="SEO dashboard, meta tags, backlinks, content scheduling, social media marketing"
      />
      <div className="min-h-screen gradient-dark-surface pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SEODashboard />
        </div>
      </div>
    </>
  );
}
