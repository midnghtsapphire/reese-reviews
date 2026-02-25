import { motion } from "framer-motion";
import { Star, Heart, Ear, Eye, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";

const values = [
  {
    icon: Star,
    title: "Honest Reviews",
    description: "Every review is 100% genuine. No paid opinions, no sugarcoating. If something's great, you'll know. If it's not, you'll know that too.",
  },
  {
    icon: Ear,
    title: "Accessibility First",
    description: "As someone who is legally deaf, Reese knows firsthand that accessibility isn't a feature — it's a right. This site is built with that belief at its core.",
  },
  {
    icon: Eye,
    title: "Visual Clarity",
    description: "Clean design, readable text, and thoughtful contrast. Every element is designed to be seen, understood, and enjoyed by everyone.",
  },
  {
    icon: Heart,
    title: "Community Driven",
    description: "Reese Reviews isn't just one voice — it's a platform for everyone to share their honest experiences and help others make better choices.",
  },
];

const About = () => {
  return (
    <main id="main-content" className="min-h-screen pt-24 pb-16">
      <SEOHead
        title="About Reese"
        description="Meet Reese — the honest reviewer behind Reese Reviews. Learn about her mission to make product reviews accessible, genuine, and fun."
        keywords="about reese reviews, reese reviewer, honest reviews, accessible reviews, deaf reviewer"
      />
      <div className="container mx-auto px-6">
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-4xl text-center mb-20"
        >
          <span className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-steel-mid">
            <Sparkles size={14} /> Meet the Reviewer
          </span>
          <h1 className="font-serif text-4xl font-bold gradient-steel-text md:text-5xl lg:text-6xl">
            Hey, I'm Reese
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
            I review everything — from the latest tech gadgets to the best ramen spot downtown.
            My mission is simple: give you the honest truth so you can make better decisions.
            No fluff, no filler, just real talk.
          </p>
        </motion.div>

        {/* Story section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl mb-20"
          aria-labelledby="story-heading"
        >
          <div className="glass-card-strong rounded-2xl p-8 md:p-12">
            <h2 id="story-heading" className="font-serif text-2xl font-bold text-foreground mb-6">
              The Story Behind Reese Reviews
            </h2>
            <div className="space-y-4 text-foreground/85 leading-relaxed">
              <p>
                Reese Reviews started from something really simple — I love trying new things and
                telling people about them. Whether it's a new pair of earbuds, a restaurant I
                stumbled into, or a streaming service I binged for a month, I always had opinions.
                My friends and family were always asking, "Reese, is this worth it?" So I figured,
                why not share it with everyone?
              </p>
              <p>
                As someone who is legally deaf, I experience the world a little differently. That
                perspective shapes every review I write. I notice things others might miss — like
                whether a product has good visual feedback, whether a restaurant's menu is easy to
                read, or whether an app relies too heavily on audio cues. Accessibility isn't just
                a checkbox for me. It's personal.
              </p>
              <p>
                That's also why this website has built-in accessibility modes. The Neurodivergent
                mode uses a high-legibility font and removes all animations. The ECO CODE mode
                strips everything down to save energy. And the No Blue Light mode shifts to warm
                tones for late-night reading. Because everyone deserves a comfortable experience.
              </p>
              <p>
                Every review on this site is my genuine opinion. I don't accept payment for positive
                reviews. Some links are affiliate links (clearly marked), which help support the
                site — but they never influence my ratings or opinions. What you read is what I
                actually think. Period.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Values */}
        <section className="mb-20" aria-labelledby="values-heading">
          <h2 id="values-heading" className="mb-12 text-center font-serif text-3xl font-bold gradient-steel-text">
            What I Stand For
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((val, i) => (
              <motion.div
                key={val.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-xl p-6 text-center"
              >
                <val.icon size={28} className="mx-auto mb-4 text-steel-shine" />
                <h3 className="font-serif text-lg font-semibold text-card-foreground">{val.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{val.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center glass-card-strong rounded-2xl p-10"
        >
          <h2 className="font-serif text-2xl font-bold gradient-steel-text">
            Want to share your own review?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Reese Reviews is a platform for everyone. Submit your honest take on anything.
          </p>
          <Link
            to="/submit"
            className="mt-6 inline-flex items-center gap-2 rounded-lg gradient-steel px-8 py-3 text-sm font-semibold text-primary-foreground"
          >
            Submit a Review <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </main>
  );
};

export default About;
