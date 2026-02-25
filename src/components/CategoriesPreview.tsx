import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { CATEGORIES, getReviewsByCategory } from "@/lib/reviewStore";

const CategoriesPreview = () => {
  return (
    <section className="py-24" aria-labelledby="categories-heading">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 id="categories-heading" className="font-serif text-3xl font-bold gradient-steel-text md:text-4xl">
            Browse by Category
          </h2>
          <p className="mt-3 text-muted-foreground">
            Find reviews in the area that matters most to you
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {CATEGORIES.map((cat, i) => {
            const count = getReviewsByCategory(cat.value).length;
            return (
              <motion.div
                key={cat.value}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to={`/categories?cat=${cat.value}`}
                  className="group block glass-card rounded-xl p-6 text-center transition-all duration-300 hover:border-steel-mid/30 hover:scale-[1.02]"
                >
                  <span className="mb-3 block text-4xl" aria-hidden="true">{cat.icon}</span>
                  <h3 className="font-serif text-lg font-semibold text-card-foreground">{cat.label}</h3>
                  <p className="mt-2 text-xs text-muted-foreground">{cat.description}</p>
                  <p className="mt-3 text-sm font-medium text-steel-shine">
                    {count} review{count !== 1 ? "s" : ""}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                    Explore <ArrowRight size={12} />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoriesPreview;
