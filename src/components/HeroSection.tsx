import { motion } from "framer-motion";
import reeseLogo from "@/assets/reese-logo.png";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section
      id="home"
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt=""
          className="h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-background/60" />
      </div>

      {/* Decorative circles */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[500px] w-[500px] rounded-full border border-border/20 md:h-[700px] md:w-[700px]" />
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
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
            alt="Reese Reviews logo"
            className="mx-auto w-auto max-w-[280px] drop-shadow-2xl md:max-w-[400px]"
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-lg text-lg font-light leading-relaxed text-muted-foreground md:text-xl"
        >
          From Box to Beautiful. Unfiltered takes on buying, assembling, and
          everything in between.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-10 flex gap-4"
        >
          <a
            href="#reviews"
            className="rounded-lg gradient-steel px-8 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
          >
            Explore Reviews
          </a>
          <a
            href="#about"
            className="rounded-lg steel-border px-8 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            About Me
          </a>
        </motion.div>
      </div>

      {/* Floating steel dots */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-2 w-2 rounded-full bg-steel-mid/40"
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{ y: [0, -12, 0] }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </section>
  );
};

export default HeroSection;
