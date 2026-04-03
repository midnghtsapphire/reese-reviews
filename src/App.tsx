import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "@/components/LoginPage";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { lazy, Suspense } from "react";

// ─── Lazy-loaded pages ──────────────────────────────────────
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Generate = lazy(() => import("@/pages/Generate"));
const Index = lazy(() => import("@/pages/Index"));
const About = lazy(() => import("@/pages/About"));
const Reviews = lazy(() => import("@/pages/Reviews"));
const ReviewDetail = lazy(() => import("@/pages/ReviewDetail"));
const Categories = lazy(() => import("@/pages/Categories"));
const Contact = lazy(() => import("@/pages/Contact"));
const SubmitReview = lazy(() => import("@/pages/SubmitReview"));
const Blog = lazy(() => import("@/pages/Blog"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const Business = lazy(() => import("@/pages/Business"));
const Marketing = lazy(() => import("@/pages/Marketing"));
const AdminPage = lazy(() => import("@/pages/Admin"));
const EmailConfirmation = lazy(() => import("@/pages/EmailConfirmation"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// ─── NEW feature pages ──────────────────────────────────────
const VinePage = lazy(() => import("@/pages/VinePage"));
const AdminPanelPage = lazy(() => import("@/pages/AdminPanelPage"));
const SEOPage = lazy(() => import("@/pages/SEOPage"));
const PaymentsPage = lazy(() => import("@/pages/PaymentsPage"));
const MusicVideoPage = lazy(() => import("@/pages/MusicVideoPage"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center gradient-dark-surface">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const AuthenticatedApp = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Core pages */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/generate" element={<Generate />} />
            <Route path="/home" element={<Index />} />

            {/* Public content pages */}
            <Route path="/about" element={<About />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/reviews/:slug" element={<ReviewDetail />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/submit" element={<SubmitReview />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/email-confirmation" element={<EmailConfirmation />} />

            {/* Business & management */}
            <Route path="/business" element={<Business />} />
            <Route path="/marketing" element={<Marketing />} />
            <Route path="/admin-legacy" element={<AdminPage />} />

            {/* NEW feature routes */}
            <Route path="/vine" element={<VinePage />} />
            <Route path="/admin" element={<AdminPanelPage />} />
            <Route path="/seo" element={<SEOPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/music-video" element={<MusicVideoPage />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AccessibilityProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthenticatedApp />
            </BrowserRouter>
          </TooltipProvider>
        </AccessibilityProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
