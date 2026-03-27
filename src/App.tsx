import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "@/components/LoginPage";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Public pages
import Index from "@/pages/Index";
import Reviews from "@/pages/Reviews";
import ReviewDetail from "@/pages/ReviewDetail";
import Categories from "@/pages/Categories";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import FAQ from "@/pages/FAQ";
import Blog from "@/pages/Blog";
import SubmitReview from "@/pages/SubmitReview";

// Private pages (require auth)
import Dashboard from "@/pages/Dashboard";
import Generate from "@/pages/Generate";
import Admin from "@/pages/Admin";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

/** Wraps a route that requires authentication. */
const PrivateRoute = ({ element }: { element: React.ReactElement }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <LoginPage />;
  return element;
};

const AppRoutes = () => (
  <>
    <a href="#main-content" className="skip-link">
      Skip to main content
    </a>
    <Navbar />
    <main id="main-content">
      <Routes>
        {/* ── Public routes ── */}
        <Route path="/" element={<Index />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/reviews/:slug" element={<ReviewDetail />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/submit" element={<SubmitReview />} />

        {/* ── Private routes ── */}
        <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
        <Route path="/generate" element={<PrivateRoute element={<Generate />} />} />
        <Route path="/admin" element={<PrivateRoute element={<Admin />} />} />

        {/* Legacy redirect: old / → /dashboard for bookmarked users */}
        <Route path="/business" element={<Navigate to="/dashboard" replace />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
    <Footer />
  </>
);

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
