import SEOHead from "@/components/SEOHead";
import PaymentsDashboard from "@/components/payments/PaymentsDashboard";

export default function PaymentsPage() {
  return (
    <>
      <SEOHead
        title="Payments & Subscriptions | Reese Reviews"
        description="Manage subscriptions, shopping cart, and bank account linking via Stripe and Plaid."
        keywords="subscriptions, stripe, plaid, payments, bank linking"
        noIndex={true}
      />
      <div className="min-h-screen gradient-dark-surface pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PaymentsDashboard />
        </div>
      </div>
    </>
  );
}
