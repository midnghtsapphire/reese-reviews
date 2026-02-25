import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageSquare, Send, CheckCircle, AlertCircle } from "lucide-react";
import SEOHead from "@/components/SEOHead";

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const Contact = () => {
  const [form, setForm] = useState<ContactForm>({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    // Simulate sending — in production this connects to Supabase or email API
    setTimeout(() => {
      try {
        const messages = JSON.parse(localStorage.getItem("reese-contact-messages") || "[]");
        messages.push({ ...form, timestamp: new Date().toISOString() });
        localStorage.setItem("reese-contact-messages", JSON.stringify(messages));
        setStatus("sent");
        setForm({ name: "", email: "", subject: "", message: "" });
      } catch {
        setStatus("error");
      }
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <main id="main-content" className="min-h-screen pt-24 pb-16">
      <SEOHead
        title="Contact"
        description="Get in touch with Reese Reviews — business inquiries, review requests, collaboration opportunities, or just say hi."
        keywords="contact reese reviews, business inquiry, review request, collaboration"
      />
      <div className="container mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <h1 className="font-serif text-4xl font-bold gradient-steel-text md:text-5xl">Get in Touch</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Business inquiries, review requests, or just want to say hi? Drop a message.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-5">
          {/* Contact info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="glass-card rounded-xl p-6">
              <Mail size={24} className="mb-3 text-steel-shine" />
              <h3 className="font-serif text-lg font-semibold text-foreground">Email</h3>
              <a href="mailto:hello@reesereviews.com" className="mt-1 block text-sm text-muted-foreground hover:text-foreground transition-colors">
                hello@reesereviews.com
              </a>
            </div>

            <div className="glass-card rounded-xl p-6">
              <MessageSquare size={24} className="mb-3 text-steel-shine" />
              <h3 className="font-serif text-lg font-semibold text-foreground">What I'm Open To</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>• Product review requests</li>
                <li>• Brand collaborations</li>
                <li>• Affiliate partnerships</li>
                <li>• Accessibility consulting</li>
                <li>• General feedback</li>
                <li>• Just saying hi!</li>
              </ul>
            </div>

            <div className="glass-card rounded-xl p-6">
              <h3 className="font-serif text-lg font-semibold text-foreground">Response Time</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                I typically respond within 24–48 hours. For urgent business inquiries, please include
                "URGENT" in the subject line.
              </p>
            </div>
          </motion.div>

          {/* Contact form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3"
          >
            <form onSubmit={handleSubmit} className="glass-card-strong rounded-2xl p-8 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-medium text-foreground">
                    Name <span className="text-danger" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className="w-full rounded-lg glass-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
                    Email <span className="text-danger" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="w-full rounded-lg glass-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="mb-2 block text-sm font-medium text-foreground">
                  Subject <span className="text-danger" aria-hidden="true">*</span>
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  value={form.subject}
                  onChange={handleChange}
                  className="w-full rounded-lg glass-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select a topic</option>
                  <option value="review-request">Product Review Request</option>
                  <option value="collaboration">Brand Collaboration</option>
                  <option value="affiliate">Affiliate Partnership</option>
                  <option value="accessibility">Accessibility Feedback</option>
                  <option value="general">General Inquiry</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="mb-2 block text-sm font-medium text-foreground">
                  Message <span className="text-danger" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={form.message}
                  onChange={handleChange}
                  className="w-full resize-none rounded-lg glass-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Tell me what's on your mind..."
                />
              </div>

              <button
                type="submit"
                disabled={status === "sending"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg gradient-steel px-8 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50"
              >
                {status === "sending" ? (
                  "Sending..."
                ) : (
                  <>
                    Send Message <Send size={16} />
                  </>
                )}
              </button>

              {status === "sent" && (
                <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-4 text-sm text-green-400" role="alert">
                  <CheckCircle size={18} />
                  Message sent! I'll get back to you soon.
                </div>
              )}
              {status === "error" && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-sm text-red-400" role="alert">
                  <AlertCircle size={18} />
                  Something went wrong. Please try again or email directly.
                </div>
              )}
            </form>
          </motion.div>
        </div>
      </div>
    </main>
  );
};

export default Contact;
