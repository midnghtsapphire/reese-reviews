import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { addSubscriber } from "@/lib/emailStore";
import { isValidEmail } from "@/lib/emailTypes";

const DEFAULT_NEWSLETTER_INTERESTS = ["new-reviews", "deals"];

const NewsletterSignup = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "duplicate" | "invalid">("idle");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (!isValidEmail(email)) {
      setStatus("invalid");
      return;
    }

    setLoading(true);

    const result = addSubscriber(
      email,
      name || undefined,
      DEFAULT_NEWSLETTER_INTERESTS,
      "home",
      window.location.href
    );

    setLoading(false);

    if (result === null) {
      setStatus("duplicate");
    } else {
      setStatus("success");
      setEmail("");
      setName("");
    }
  };

  return (
    <section
      id="newsletter"
      className="relative py-20 overflow-hidden"
      aria-label="Newsletter signup"
    >
      <div className="absolute inset-0 gradient-dark-surface opacity-80" />
      <div className="relative z-10 container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-xl text-center"
        >
          <div className="mb-4 inline-flex items-center justify-center rounded-full border border-steel-shine/20 p-3">
            <Mail size={22} className="text-steel-shine" aria-hidden="true" />
          </div>

          <h2 className="font-serif text-3xl font-bold gradient-steel-text mb-3">
            Stay in the Loop
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Get honest reviews, exclusive deals, and unboxing highlights delivered straight to your inbox — no spam, ever.
          </p>

          {status === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-2xl p-6 flex flex-col items-center gap-3"
            >
              <CheckCircle2 size={32} className="text-steel-shine" />
              <p className="font-semibold text-foreground">You're on the list!</p>
              <p className="text-sm text-muted-foreground">
                Check your inbox to confirm your subscription.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-3" noValidate>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 rounded-lg glass-input px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-steel-shine/40"
                  aria-label="Your name (optional)"
                  autoComplete="name"
                />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 rounded-lg glass-input px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-steel-shine/40"
                  aria-label="Email address"
                  autoComplete="email"
                />
              </div>

              {(status === "duplicate" || status === "invalid") && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <AlertCircle size={13} aria-hidden="true" />
                  {status === "duplicate"
                    ? "This email is already subscribed."
                    : "Please enter a valid email address."}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-lg gradient-steel px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Subscribing…" : "Subscribe — It's Free"}
              </button>
              <p className="text-xs text-muted-foreground/60">
                Unsubscribe any time. Your data is never shared.
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default NewsletterSignup;
