import { motion } from "framer-motion";
import { Package, Wrench, Sparkles } from "lucide-react";

const features = [
  {
    icon: Package,
    title: "Honest Unboxings",
    desc: "No sponsorship bias — just real first impressions straight out of the box.",
  },
  {
    icon: Wrench,
    title: "Assembly Reality",
    desc: "I time every build so you know exactly what you're getting into.",
  },
  {
    icon: Sparkles,
    title: "Final Verdict",
    desc: "Beautiful or bust? Every review ends with a clear, no-fluff recommendation.",
  },
];

const AboutSection = () => {
  return (
    <section id="about" className="relative border-t border-border py-24">
      <div className="container mx-auto px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-steel-mid">
              About
            </span>
            <h2 className="mb-6 font-serif text-3xl font-bold gradient-steel-text md:text-4xl">
              Why Reese Reviews?
            </h2>
            <p className="mb-8 max-w-md leading-relaxed text-muted-foreground">
              I'm Reese — and I believe everyone deserves to know what they're
              really buying before they buy it. I put products through the
              real-life test so you don't have to gamble on your next purchase.
            </p>

            <div className="space-y-6">
              {features.map((feat, i) => (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <feat.icon size={18} className="text-steel-shine" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-semibold text-foreground">
                      {feat.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{feat.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 gap-6"
          >
            {[
              { num: "120+", label: "Products Reviewed" },
              { num: "50K+", label: "Monthly Readers" },
              { num: "4.8", label: "Avg. Rating Given" },
              { num: "98%", label: "Honest Verdicts" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="flex flex-col items-center rounded-xl border border-border bg-card p-8 text-center steel-glow"
              >
                <span className="mb-2 font-serif text-3xl font-bold gradient-steel-text">
                  {stat.num}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
