import SEOHead from "@/components/SEOHead";
import VineReviewDashboard from "@/components/vine/VineReviewDashboard";

export default function VinePage() {
  return (
    <>
      <SEOHead
        title="Vine Review Auto-Generator | Reese Reviews"
        description="Import Amazon Vine orders, auto-generate authentic reviews with AI, manage your review queue, and create video reviews."
        keywords="amazon vine, review generator, auto review, vine dashboard, AI reviews"
      />
      <div className="min-h-screen gradient-dark-surface pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <VineReviewDashboard />
        </div>
      </div>
    </>
  );
}
