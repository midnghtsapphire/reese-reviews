import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, Zap, LayoutDashboard, Star, Grid3X3, BookOpen, HelpCircle, Info, Mail, Settings } from "lucide-react";
import AccessibilityToggle from "./AccessibilityToggle";
import { useAuth } from "@/contexts/AuthContext";
import reeseLogo from "@/assets/reese-logo.png";

const publicLinks = [
  { label: "Reviews",    href: "/reviews",    icon: Star },
  { label: "Categories", href: "/categories", icon: Grid3X3 },
  { label: "Blog",       href: "/blog",       icon: BookOpen },
  { label: "FAQ",        href: "/faq",        icon: HelpCircle },
  { label: "About",      href: "/about",      icon: Info },
  { label: "Contact",    href: "/contact",    icon: Mail },
];

const privateLinks = [
  { label: "Dashboard",      href: "/dashboard", icon: LayoutDashboard },
  { label: "Create Content", href: "/generate",  icon: Zap },
  { label: "Admin",          href: "/admin",     icon: Settings },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();

  const navLinks = isAuthenticated ? privateLinks : publicLinks;

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
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2" aria-label="Reese-Reviews Home">
          {!logoError && (
            <img
              src={reeseLogo}
              alt="Reese-Reviews logo"
              className="h-9 w-auto"
              onError={() => setLogoError(true)}
            />
          )}
          <span className="hidden font-serif text-lg font-bold gradient-steel-text sm:inline">
            Reese-Reviews
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-6 md:flex" role="menubar">
          {navLinks.map(({ label, href, icon: Icon }) => (
            <li key={label} role="none">
              <Link
                to={href}
                role="menuitem"
                className={`flex items-center gap-1.5 text-sm font-medium tracking-wide transition-colors hover:text-foreground ${
                  location.pathname === href ? "text-foreground" : "text-muted-foreground"
                }`}
                aria-current={location.pathname === href ? "page" : undefined}
              >
                <Icon size={14} />
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <AccessibilityToggle />

          {isAuthenticated ? (
            <>
              {/* Create Content CTA (private) */}
              <Link
                to="/generate"
                className="hidden rounded-lg gradient-steel px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105 md:inline-flex items-center gap-1.5"
              >
                <Zap size={14} />
                Create
              </Link>

              {/* Logout */}
              <button
                onClick={logout}
                className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:inline-flex"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut size={15} />
                <span className="hidden lg:inline">Logout</span>
              </button>
            </>
          ) : (
            /* Submit Review CTA (public) */
            <Link
              to="/submit"
              className="hidden rounded-lg gradient-steel px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105 md:inline-flex items-center gap-1.5"
            >
              <Star size={14} />
              Submit Review
            </Link>
          )}

          {/* Mobile hamburger */}
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

      {/* Mobile menu */}
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
              {navLinks.map(({ label, href, icon: Icon }) => (
                <li key={label} role="none">
                  <Link
                    to={href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-accent ${
                      location.pathname === href ? "text-foreground bg-accent/50" : "text-muted-foreground"
                    }`}
                  >
                    <Icon size={15} />
                    {label}
                  </Link>
                </li>
              ))}
              {isAuthenticated ? (
                <>
                  <li role="none">
                    <Link
                      to="/generate"
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className="mt-2 flex items-center justify-center gap-2 rounded-lg gradient-steel px-4 py-3 text-sm font-semibold text-primary-foreground"
                    >
                      <Zap size={15} /> Create Content
                    </Link>
                  </li>
                  <li role="none">
                    <button
                      onClick={() => { setOpen(false); logout(); }}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </li>
                </>
              ) : (
                <li role="none">
                  <Link
                    to="/submit"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="mt-2 flex items-center justify-center gap-2 rounded-lg gradient-steel px-4 py-3 text-sm font-semibold text-primary-foreground"
                  >
                    <Star size={15} /> Submit Review
                  </Link>
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
