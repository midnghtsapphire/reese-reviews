import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Star } from "lucide-react";
import reeseLogo from "@/assets/reese-logo.png";

const HeroSection = () => {
  return (
    <section
      id="home"
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      aria-label="Welcome to Reese Reviews"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-dark-surface" />

      {/* Decorative circles */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
        <div className="h-[500px] w-[500px] rounded-full border border-border/20 md:h-[700px] md:w-[700px]" />
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
        <div className="h-[400px] w-[400px] rounded-full border border-border/10 md:h-[580px] md:w-[580px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8"
        >
          <img
            src={reeseLogo}
            alt="Reese Reviews — From Box to Beautiful"
            className="mx-auto h-[260px] w-[260px] rounded-full border-4 border-steel-shine/20 object-cover drop-shadow-2xl md:h-[380px] md:w-[380px]"
          />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="sr-only"
        >
          Reese Reviews — Honest Reviews on Products, Food, Services, Entertainment, and Tech
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-lg text-lg font-light leading-relaxed text-muted-foreground md:text-xl"
        >
          From Box to Beautiful. Unfiltered takes on buying, assembling, and
          everything in between.
        </motion.p>

        {/* Quick stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mt-8 flex items-center gap-6"
        >
          <div className="glass-card rounded-xl px-5 py-3 text-center">
            <div className="flex items-center justify-center gap-1 text-steel-shine">
              <Star size={14} className="fill-current" />
              <span className="text-sm font-semibold">5 Categories</span>
            </div>
          </div>
          <div className="glass-card rounded-xl px-5 py-3 text-center">
            <span className="text-sm font-semibold text-steel-shine">100% Honest</span>
          </div>
          <div className="glass-card rounded-xl px-5 py-3 text-center">
            <span className="text-sm font-semibold text-steel-shine">Accessible</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-10 flex flex-wrap justify-center gap-4"
        >
          <Link
            to="/reviews"
            className="inline-flex items-center gap-2 rounded-lg gradient-steel px-8 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
          >
            Explore Reviews <ArrowRight size={16} />
          </Link>
          <Link
            to="/about"
            className="rounded-lg steel-border px-8 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            About Reese
          </Link>
        </motion.div>
      </div>

      {/* Floating dots */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-2 w-2 rounded-full bg-steel-mid/40"
          style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }}
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        />
      ))}
    </section>
  );
};

export default HeroSection;
