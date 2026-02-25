import { Link } from "react-router-dom";
import { Heart, Mail, ExternalLink } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background/50" role="contentinfo">
      <div className="container mx-auto px-6 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="font-serif text-xl font-bold gradient-steel-text">
              Reese Reviews
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              From Box to Beautiful. Honest, unfiltered reviews on everything — products, food,
              services, entertainment, and tech.
            </p>
            <p className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground/60">
              Made with <Heart size={12} className="text-danger" aria-label="love" /> by Reese
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              Explore
            </h4>
            <ul className="space-y-3">
              {[
                { label: "All Reviews", href: "/reviews" },
                { label: "Categories", href: "/categories" },
                { label: "Submit a Review", href: "/submit" },
                { label: "About Reese", href: "/about" },
                { label: "Contact", href: "/contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              Categories
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Products", href: "/categories?cat=products" },
                { label: "Food & Restaurants", href: "/categories?cat=food-restaurants" },
                { label: "Services", href: "/categories?cat=services" },
                { label: "Entertainment", href: "/categories?cat=entertainment" },
                { label: "Tech", href: "/categories?cat=tech" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              Get in Touch
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:hello@reesereviews.com"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Mail size={14} /> hello@reesereviews.com
                </a>
              </li>
              <li>
                <a
                  href="https://reesereviews.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ExternalLink size={14} /> reesereviews.com
                </a>
              </li>
            </ul>
            <div className="mt-6 glass-card rounded-lg p-4">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground/80">Affiliate Disclosure:</strong> Some links on
                this site are affiliate links. We may earn a small commission at no extra cost to you.
                All opinions are genuinely Reese's own.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} Reese Reviews. All Rights Reserved. Audrey Evans / GlowStar Labs.
          </p>
          <p className="text-xs text-muted-foreground/50">
            Built with accessibility at its core — for Reese and the deaf/neurodivergent community.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
