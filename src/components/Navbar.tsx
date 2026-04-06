import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, Zap, LayoutDashboard, Star, Grid3X3, BookOpen, HelpCircle, Info, Mail, Settings } from "lucide-react";
import { Menu, X, LogOut, Settings, BarChart2, Megaphone } from "lucide-react";
import { Menu, X, LogOut, Settings, LayoutDashboard } from "lucide-react";
import {
  Menu, X, LogOut, Zap, LayoutDashboard, Grape, Shield,
  Search, CreditCard, Briefcase, Megaphone, ChevronDown, Music,
  Wand2, Youtube,
} from "lucide-react";
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
const mainLinks = [
  { label: "Dashboard",  href: "/dashboard", icon: LayoutDashboard },
  { label: "Vine AI",    href: "/vine",     icon: Grape },
  { label: "Business",   href: "/business", icon: Briefcase },
];

const moreLinks = [
  { label: "Create Content", href: "/generate",  icon: Zap },
  { label: "Marketing",      href: "/marketing", icon: Megaphone },
  { label: "SEO",            href: "/seo",       icon: Search },
  { label: "Payments",       href: "/payments",  icon: CreditCard },
  { label: "Music Video",    href: "/music-video", icon: Music },
  { label: "Publish Wizard", href: "/publish-wizard", icon: Wand2 },
  { label: "YouTube",        href: "/youtube",   icon: Youtube },
  { label: "Admin",          href: "/admin",     icon: Shield },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
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
    setMoreOpen(false);
  }, [location]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(href);
  };

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
        <ul className="hidden items-center gap-5 md:flex" role="menubar">
          {mainLinks.map(({ label, href, icon: Icon }) => (
            <li key={label} role="none">
              <Link
                to={href}
                role="menuitem"
                className={`flex items-center gap-1.5 text-sm font-medium tracking-wide transition-colors hover:text-foreground ${
                  isActive(href) ? "text-foreground" : "text-muted-foreground"
                }`}
                aria-current={isActive(href) ? "page" : undefined}
              >
                <Icon size={14} />
                {label}
              </Link>
            </li>
          ))}
          {/* More dropdown */}
          <li role="none" className="relative">
            <button
              role="menuitem"
              onClick={() => setMoreOpen(!moreOpen)}
              className="flex items-center gap-1 text-sm font-medium tracking-wide text-muted-foreground transition-colors hover:text-foreground"
              aria-expanded={moreOpen}
            >
              More <ChevronDown size={14} className={`transition-transform ${moreOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {moreOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 top-full mt-2 w-48 rounded-lg glass-nav border border-white/10 shadow-xl py-2"
                >
                  {moreLinks.map(({ label, href, icon: Icon }) => (
                    <Link
                      key={href}
                      to={href}
                      className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-accent ${
                        isActive(href) ? "text-foreground bg-accent/30" : "text-muted-foreground"
                      }`}
                      onClick={() => setMoreOpen(false)}
                    >
                      <Icon size={14} />
                      {label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </li>
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
          {/* Business Dashboard link */}
          <Link
            to="/business"
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors hover:bg-accent md:inline-flex"
            style={{ color: "#a78bfa" }}
            title="Business Dashboard"
            aria-current={location.pathname === "/business" ? "page" : undefined}
          >
            <LayoutDashboard size={15} />
            <span className="hidden lg:inline">Business</span>
          </Link>

          {/* Admin Panel link */}
          <Link
            to="/admin"
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:inline-flex"
            title="Admin Panel"
          >
            <Settings size={15} />
            <span className="hidden lg:inline">Admin</span>
          </Link>

          {/* Business Dashboard link */}
          <Link
            to="/business"
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors hover:bg-accent md:inline-flex"
            style={{ color: "#a78bfa" }}
            title="Business Dashboard"
            aria-current={undefined}
          >
            <BarChart2 size={15} />
            <span className="hidden lg:inline">Business</span>
          </Link>

          {/* Marketing Hub link */}
          <Link
            to="/marketing"
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors hover:bg-accent md:inline-flex"
            style={{ color: "#60a5fa" }}
            title="Marketing Hub"
          >
            <Megaphone size={15} />
            <span className="hidden lg:inline">Marketing</span>
          </Link>

          {/* Create Content CTA */}
          <Link
            to="/vine"
            className="hidden rounded-lg gradient-steel px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105 md:inline-flex items-center gap-1.5"
          >
            <Grape size={14} />
            Vine AI
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
              {[...mainLinks, ...moreLinks].map(({ label, href, icon: Icon }) => (
                <li key={label} role="none">
                  <Link
                    to={href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-accent ${
                      isActive(href) ? "text-foreground bg-accent/50" : "text-muted-foreground"
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
                  className="mt-2 flex items-center justify-center gap-2 rounded-lg steel-border px-4 py-3 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Settings size={16} /> Admin Panel
                </Link>
              </li>
              <li role="none">
                <Link
                  to="/business"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="mt-2 block rounded-lg gradient-steel px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
                >
                  Business Dashboard
                </Link>
              </li>
              <li role="none">
                <Link
                  to="/marketing"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="mt-2 block rounded-lg steel-border px-4 py-3 text-center text-sm font-semibold text-foreground hover:bg-accent"
                  to="/vine"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="mt-2 flex items-center justify-center gap-2 rounded-lg gradient-steel px-4 py-3 text-sm font-semibold text-primary-foreground"
                >
                  <Grape size={15} /> Vine AI Generator
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
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
