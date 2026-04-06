import SEOHead from "@/components/SEOHead";
import AdminPanel from "@/components/admin/AdminPanel";

export default function AdminPanelPage() {
  return (
    <>
      <SEOHead
        title="Admin Panel | Reese Reviews"
        description="Manage site settings, theme customization, users, analytics, and API integrations."
        noIndex={true}
      />
      <div className="min-h-screen gradient-dark-surface pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdminPanel />
        </div>
      </div>
    </>
  );
}
