import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
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
const PublishWizardPage = lazy(() => import("@/pages/PublishWizardPage"));
const YouTubeManagerPage = lazy(() => import("@/pages/YouTubeManagerPage"));

// ─── Team C: Marketing Hub & Social Calendar ────────────────
const MarketingHub = lazy(() => import("@/pages/MarketingHub"));

// ─── Auth pages ─────────────────────────────────────────────
const LoginPageRoute = lazy(() => import("@/pages/LoginPageRoute"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center gradient-dark-surface">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// ─── Layout wrapper for authenticated pages ─────────────────

const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <a href="#main-content" className="skip-link">
      Skip to main content
    </a>
    <Navbar />
    <main id="main-content">{children}</main>
    <Footer />
  </>
);

// ─── Public layout (no navbar/footer) ───────────────────────

const PublicLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <a href="#main-content" className="skip-link">
      Skip to main content
    </a>
    <Navbar />
    <main id="main-content">{children}</main>
    <Footer />
  </>
);

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ─── Auth routes (no layout) ─────────────────── */}
        <Route path="/login" element={<LoginPageRoute />} />
        <Route path="/email-confirmation" element={<EmailConfirmation />} />

        {/* ─── Public content pages ────────────────────── */}
        <Route path="/home" element={<PublicLayout><Index /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
        <Route path="/reviews" element={<PublicLayout><Reviews /></PublicLayout>} />
        <Route path="/reviews/:slug" element={<PublicLayout><ReviewDetail /></PublicLayout>} />
        <Route path="/categories" element={<PublicLayout><Categories /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
        <Route path="/submit" element={<PublicLayout><SubmitReview /></PublicLayout>} />
        <Route path="/blog" element={<PublicLayout><Blog /></PublicLayout>} />
        <Route path="/faq" element={<PublicLayout><FAQ /></PublicLayout>} />

        {/* ─── Protected dashboard routes ──────────────── */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout><Dashboard /></AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/generate"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout><Generate /></AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/business"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout><Business /></AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketing"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout><Marketing /></AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vine"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout><VinePage /></AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/seo"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout><SEOPage /></AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout><PaymentsPage /></AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/music-video"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout><MusicVideoPage /></AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout><ProfilePage /></AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        {/* ─── Team C: Marketing Hub ─────────────────── */}
        <Route
          path="/marketing-hub"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout><MarketingHub /></AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        {/* ─── Team B: Publishing Wizard & YouTube ────── */}
        <Route
          path="/publish-wizard"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout><PublishWizardPage /></AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/youtube"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout><YouTubeManagerPage /></AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        {/* ─── Admin-only routes ───────────────────────── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AuthenticatedLayout><AdminPanelPage /></AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-legacy"
          element={
            <ProtectedRoute requireAdmin>
              <AuthenticatedLayout><AdminPage /></AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        {/* ─── 404 ─────────────────────────────────────── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
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
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </AccessibilityProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
