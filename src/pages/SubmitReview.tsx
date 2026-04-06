import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, X, CheckCircle, Camera } from "lucide-react";
import StarRating from "@/components/StarRating";
import SEOHead from "@/components/SEOHead";
import { ConfettiCelebration } from "@/components/ConfettiCelebration";
import { submitReview, CATEGORIES, type ReviewCategory } from "@/lib/reviewStore";

interface FormData {
  title: string;
  category: ReviewCategory | "";
  rating: number;
  excerpt: string;
  content: string;
  pros: string;
  cons: string;
  verdict: string;
  product_name: string;
  product_link: string;
  reviewer_name: string;
  reviewer_email: string;
}

const initialForm: FormData = {
  title: "",
  category: "",
  rating: 0,
  excerpt: "",
  content: "",
  pros: "",
  cons: "",
  verdict: "",
  product_name: "",
  product_link: "",
  reviewer_name: "",
  reviewer_email: "",
};

const SubmitReview = () => {
  const [form, setForm] = useState<FormData>(initialForm);
  const [hoverRating, setHoverRating] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [showConfetti, setShowConfetti] = useState(false);
  const [submittedName, setSubmittedName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be under 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.rating === 0) {
      alert("Please select a star rating");
      return;
    }
    if (!form.category) {
      alert("Please select a category");
      return;
    }

    setStatus("submitting");

    try {
      submitReview({
        title: form.title,
        category: form.category as ReviewCategory,
        rating: form.rating,
        excerpt: form.excerpt,
        content: form.content,
        pros: form.pros.split("\n").filter(Boolean),
        cons: form.cons.split("\n").filter(Boolean),
        verdict: form.verdict,
        image_url: imagePreview || "",
        product_name: form.product_name,
        product_link: form.product_link,
        affiliate_tag: "",
        reviewer_name: form.reviewer_name,
        reviewer_email: form.reviewer_email,
      });
      setSubmittedName(form.reviewer_name);
      setStatus("success");
      setShowConfetti(true);
      setForm(initialForm);
      setImagePreview(null);
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <main id="main-content" className="min-h-screen pt-24 pb-16">
        <SEOHead title="Review Submitted" noIndex />
        {showConfetti && (
          <ConfettiCelebration
            reviewerName={submittedName}
            onDismiss={() => {
              setShowConfetti(false);
              setStatus("idle");
            }}
          />
        )}
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto max-w-lg text-center py-20"
          >
            <CheckCircle size={64} className="mx-auto mb-6 text-green-400" />
            <h1 className="font-serif text-3xl font-bold gradient-steel-text">Review Submitted!</h1>
            <p className="mt-4 text-muted-foreground">
              Thanks for sharing your honest take! Your review is pending approval and will appear on the site once reviewed.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-8 rounded-lg gradient-steel px-8 py-3 text-sm font-semibold text-primary-foreground"
            >
              Submit Another Review
            </button>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="min-h-screen pt-24 pb-16">
      <SEOHead
        title="Submit a Review"
        description="Share your honest review on Reese Reviews. Rate products, food, services, entertainment, and tech."
      />
      <div className="container mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <h1 className="font-serif text-4xl font-bold gradient-steel-text md:text-5xl">Submit a Review</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Share your honest experience. Every voice matters here.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-8">
          {/* Basic Info */}
          <section className="glass-card-strong rounded-2xl p-8 space-y-6" aria-labelledby="basic-info">
            <h2 id="basic-info" className="font-serif text-xl font-semibold text-foreground">Basic Info</h2>

            <div>
              <label htmlFor="title" className="mb-2 block text-sm font-medium text-foreground">
                Review Title <span className="text-danger">*</span>
              </label>
              <input
                id="title"
                name="title"
                required
                value={form.title}
                onChange={handleChange}
                className="w-full rounded-lg glass-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g., The Best Wireless Earbuds I've Ever Used"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="category" className="mb-2 block text-sm font-medium text-foreground">
                  Category <span className="text-danger">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  value={form.category}
                  onChange={handleChange}
                  className="w-full rounded-lg glass-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="product_name" className="mb-2 block text-sm font-medium text-foreground">
                  Product/Place Name
                </label>
                <input
                  id="product_name"
                  name="product_name"
                  value={form.product_name}
                  onChange={handleChange}
                  className="w-full rounded-lg glass-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g., SoundCore Pro Buds X3"
                />
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-foreground">
                Rating <span className="text-danger">*</span>
              </label>
              <StarRating
                rating={form.rating}
                size={32}
                interactive
                onRate={(r) => setForm((prev) => ({ ...prev, rating: r }))}
                hoverRating={hoverRating}
                onHover={setHoverRating}
              />
              {form.rating > 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {form.rating === 1 && "Poor"}
                  {form.rating === 2 && "Below Average"}
                  {form.rating === 3 && "Average"}
                  {form.rating === 4 && "Great"}
                  {form.rating === 5 && "Excellent"}
                </p>
              )}
            </div>
          </section>

          {/* Photo Upload */}
          <section className="glass-card-strong rounded-2xl p-8 space-y-6" aria-labelledby="photo-section">
            <h2 id="photo-section" className="font-serif text-xl font-semibold text-foreground">Photo</h2>
            <div className="relative">
              {imagePreview ? (
                <div className="relative overflow-hidden rounded-xl">
                  <img src={imagePreview} alt="Review photo preview" className="w-full max-h-64 object-cover rounded-xl" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-3 right-3 rounded-full bg-background/80 p-2 text-foreground hover:bg-background"
                    aria-label="Remove photo"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-12 text-muted-foreground transition-colors hover:border-steel-mid hover:text-foreground"
                >
                  <Camera size={32} className="mb-3" />
                  <span className="text-sm font-medium">Click to upload a photo</span>
                  <span className="mt-1 text-xs">PNG, JPG, WebP up to 5MB</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageChange}
                className="hidden"
                aria-label="Upload review photo"
              />
            </div>
          </section>

          {/* Review Content */}
          <section className="glass-card-strong rounded-2xl p-8 space-y-6" aria-labelledby="content-section">
            <h2 id="content-section" className="font-serif text-xl font-semibold text-foreground">Your Review</h2>

            <div>
              <label htmlFor="excerpt" className="mb-2 block text-sm font-medium text-foreground">
                Quick Summary <span className="text-danger">*</span>
              </label>
              <textarea
                id="excerpt"
                name="excerpt"
                required
                rows={2}
                value={form.excerpt}
                onChange={handleChange}
                className="w-full resize-none rounded-lg glass-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="One or two sentences that capture your overall take"
              />
            </div>

            <div>
              <label htmlFor="content" className="mb-2 block text-sm font-medium text-foreground">
                Full Review <span className="text-danger">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                required
                rows={8}
                value={form.content}
                onChange={handleChange}
                className="w-full resize-none rounded-lg glass-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Tell the full story — what you liked, what you didn't, and everything in between"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="pros" className="mb-2 block text-sm font-medium text-foreground">
                  Pros <span className="text-xs text-muted-foreground">(one per line)</span>
                </label>
                <textarea
                  id="pros"
                  name="pros"
                  rows={4}
                  value={form.pros}
                  onChange={handleChange}
                  className="w-full resize-none rounded-lg glass-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={"Great sound quality\nLong battery life\nComfortable fit"}
                />
              </div>
              <div>
                <label htmlFor="cons" className="mb-2 block text-sm font-medium text-foreground">
                  Cons <span className="text-xs text-muted-foreground">(one per line)</span>
                </label>
                <textarea
                  id="cons"
                  name="cons"
                  rows={4}
                  value={form.cons}
                  onChange={handleChange}
                  className="w-full resize-none rounded-lg glass-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={"Slightly bulky case\nNo wireless charging"}
                />
              </div>
            </div>

            <div>
              <label htmlFor="verdict" className="mb-2 block text-sm font-medium text-foreground">
                Final Verdict
              </label>
              <textarea
                id="verdict"
                name="verdict"
                rows={2}
                value={form.verdict}
                onChange={handleChange}
                className="w-full resize-none rounded-lg glass-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Your bottom-line recommendation in one or two sentences"
              />
            </div>
          </section>

          {/* Affiliate / Link */}
          <section className="glass-card-strong rounded-2xl p-8 space-y-6" aria-labelledby="link-section">
            <h2 id="link-section" className="font-serif text-xl font-semibold text-foreground">Product Link</h2>
            <p className="text-sm text-muted-foreground">Optional — if there's a link where people can check it out</p>
            <div>
              <label htmlFor="product_link" className="mb-2 block text-sm font-medium text-foreground">
                Product URL
              </label>
              <input
                id="product_link"
                name="product_link"
                type="url"
                value={form.product_link}
                onChange={handleChange}
                className="w-full rounded-lg glass-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="https://..."
              />
            </div>
          </section>

          {/* Reviewer Info */}
          <section className="glass-card-strong rounded-2xl p-8 space-y-6" aria-labelledby="reviewer-section">
            <h2 id="reviewer-section" className="font-serif text-xl font-semibold text-foreground">About You</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="reviewer_name" className="mb-2 block text-sm font-medium text-foreground">
                  Your Name <span className="text-danger">*</span>
                </label>
                <input
                  id="reviewer_name"
                  name="reviewer_name"
                  required
                  value={form.reviewer_name}
                  onChange={handleChange}
                  className="w-full rounded-lg glass-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="reviewer_email" className="mb-2 block text-sm font-medium text-foreground">
                  Email <span className="text-xs text-muted-foreground">(private, for follow-up only)</span>
                </label>
                <input
                  id="reviewer_email"
                  name="reviewer_email"
                  type="email"
                  value={form.reviewer_email}
                  onChange={handleChange}
                  className="w-full rounded-lg glass-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="you@example.com"
                />
              </div>
            </div>
          </section>

          {/* Submit */}
          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full rounded-xl gradient-steel py-4 text-base font-semibold text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-50"
          >
            {status === "submitting" ? "Submitting..." : "Submit Review"}
          </button>

          {status === "error" && (
            <p className="text-center text-sm text-red-400" role="alert">
              Something went wrong. Please try again.
            </p>
          )}
        </form>
      </div>
    </main>
  );
};

export default SubmitReview;
