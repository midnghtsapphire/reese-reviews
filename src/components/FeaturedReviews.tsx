import { motion } from "framer-motion";
import ReviewCard from "./ReviewCard";
import review1 from "@/assets/review-1.jpg";
import review2 from "@/assets/review-2.jpg";
import review3 from "@/assets/review-3.jpg";

const reviews = [
  {
    image: review1,
    title: "The Ultimate Desk Setup",
    category: "Home Office",
    rating: 5,
    excerpt:
      "A full breakdown of my dream desk setup — was it worth the hype? Spoiler: mostly yes.",
  },
  {
    image: review2,
    title: "DIY Bookshelf Assembly",
    category: "Furniture",
    rating: 4,
    excerpt:
      "This 'easy assembly' shelf took 4 hours. Here's what they don't tell you in the instructions.",
  },
  {
    image: review3,
    title: "Bathroom Org Essentials",
    category: "Organization",
    rating: 4,
    excerpt:
      "These storage containers changed my morning routine. Affordable and actually aesthetic.",
  },
];

const FeaturedReviews = () => {
  return (
    <section id="reviews" className="relative py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-steel-mid">
            Latest
          </span>
          <h2 className="font-serif text-3xl font-bold gradient-steel-text md:text-4xl">
            Featured Reviews
          </h2>
        </motion.div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review, i) => (
            <ReviewCard key={review.title} {...review} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedReviews;
