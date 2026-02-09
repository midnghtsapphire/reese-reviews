import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { Instagram, Youtube, Mail, Code } from "lucide-react";

const Footer = forwardRef<HTMLElement>((_, ref) => {
  return (
    <footer ref={ref} id="contact" className="border-t border-border bg-card py-12">
      <div className="container mx-auto flex flex-col items-center gap-6 px-6 text-center">
        <h3 className="font-serif text-lg font-bold gradient-steel-text">
          Reese Reviews
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          From Box to Beautiful. Follow along for the latest unfiltered product takes.
        </p>

        <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          <Link to="/products" className="hover:text-foreground transition-colors">
            Products
          </Link>
          <Link to="/reviews" className="hover:text-foreground transition-colors">
            Reviews
          </Link>
          <Link to="/submit-review" className="hover:text-foreground transition-colors">
            Submit Review
          </Link>
          <Link to="/embed-code" className="hover:text-foreground transition-colors flex items-center gap-1">
            <Code size={14} />
            Embed Widget
          </Link>
        </div>

        <div className="flex gap-5">
          {[Instagram, Youtube, Mail].map((Icon, i) => (
            <a
              key={i}
              href="#"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Icon size={16} />
            </a>
          ))}
        </div>

        <p className="text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} Reese Reviews. All rights reserved.
        </p>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;
