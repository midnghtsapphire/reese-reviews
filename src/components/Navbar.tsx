import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, Settings } from "lucide-react";
import AccessibilityToggle from "./AccessibilityToggle";
import { useAuth } from "@/contexts/AuthContext";
import reeseLogo from "@/assets/reese-logo.png";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Reviews", href: "/reviews" },
  { label: "Categories", href: "/categories" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/faq" },
  { label: "About Reese", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location]);

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "glass-nav shadow-lg" : "bg-transparent"
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto flex items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center gap-3" aria-label="Reese Reviews Home">
          <img src={reeseLogo} alt="" className="h-10 w-auto" aria-hidden="true" />
          <span className="hidden font-serif text-lg font-bold gradient-steel-text sm:inline">
            Reese Reviews
          </span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex" role="menubar">
          {navLinks.map((link) => (
            <li key={link.label} role="none">
              <Link
                to={link.href}
                role="menuitem"
                className={`text-sm font-medium tracking-wide transition-colors hover:text-foreground ${
                  location.pathname === link.href ? "text-foreground" : "text-muted-foreground"
                }`}
                aria-current={location.pathname === link.href ? "page" : undefined}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <AccessibilityToggle />

          {/* Admin Panel link */}
          <Link
            to="/admin"
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors hover:bg-accent md:inline-flex"
            style={{ color: "#FF6B2B" }}
            title="Admin Panel"
          >
            <Settings size={15} />
            <span className="hidden lg:inline">Admin</span>
          </Link>

          <Link
            to="/submit"
            className="hidden rounded-lg gradient-steel px-5 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105 md:inline-flex"
          >
            Submit Review
          </Link>

          {/* Logout button */}
          <button
            onClick={logout}
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:inline-flex"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={15} />
            <span className="hidden lg:inline">Logout</span>
          </button>

          <button
            onClick={() => setOpen(!open)}
            className="rounded-lg p-2 text-foreground md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden glass-nav md:hidden"
            role="menu"
          >
            <ul className="flex flex-col gap-2 px-6 py-6">
              {navLinks.map((link) => (
                <li key={link.label} role="none">
                  <Link
                    to={link.href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className={`block rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-accent ${
                      location.pathname === link.href ? "text-foreground bg-accent/50" : "text-muted-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li role="none">
                <Link
                  to="/submit"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="mt-2 block rounded-lg gradient-steel px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
                >
                  Submit Review
                </Link>
              </li>
              <li role="none">
                <Link
                  to="/admin"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="mt-2 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold"
                  style={{ background: "rgba(255,107,43,0.15)", color: "#FF6B2B", border: "1px solid rgba(255,107,43,0.3)" }}
                >
                  <Settings size={16} /> Admin Panel
                </Link>
              </li>
              <li role="none">
                <Link
                  to="/business"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="mt-2 block rounded-lg px-4 py-3 text-center text-sm font-semibold text-primary-foreground bg-purple-600 hover:bg-purple-700"
                >
                  Business Dashboard
                </Link>
              </li>
              <li role="none">
                <Link
                  to="/marketing"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="mt-2 block rounded-lg px-4 py-3 text-center text-sm font-semibold text-primary-foreground bg-blue-600 hover:bg-blue-700"
                >
                  Marketing Hub
                </Link>
              </li>
              <li role="none">
                <button
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <LogOut size={16} /> Logout
                </button>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
