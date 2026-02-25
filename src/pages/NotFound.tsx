import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const NotFound = () => {
  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center">
      <SEOHead title="Page Not Found" noIndex />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 text-center"
      >
        <p className="text-8xl font-bold gradient-steel-text font-serif mb-4">404</p>
        <h1 className="font-serif text-3xl font-bold text-foreground">Page Not Found</h1>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg gradient-steel px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            <Home size={16} /> Go Home
          </Link>
          <Link
            to="/reviews"
            className="inline-flex items-center gap-2 rounded-lg steel-border px-6 py-3 text-sm font-medium text-foreground hover:bg-accent"
          >
            <ArrowLeft size={16} /> Browse Reviews
          </Link>
        </div>
      </motion.div>
    </main>
  );
};

export default NotFound;
