// ============================================================
// LOGIN PAGE ROUTE
// Standalone route for /login — redirects to /dashboard if already authed.
// ============================================================

import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoginPage from "@/components/LoginPage";

const LoginPageRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-dark-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginPage />;
};

export default LoginPageRoute;
