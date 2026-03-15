import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, FileText, Star, Layout, Tag, Save, Plus, Trash2, Edit3,
  ChevronDown, ChevronUp, X, RotateCcw, Check, AlertCircle, Image,
} from "lucide-react";
import { useSiteContent } from "@/hooks/useSiteContent";
import {
  getAllReviews, addReview, updateReview, deleteReview,
  initializeReviewsIfNeeded,
} from "@/lib/reviewStoreAdmin";
import { ReviewData, ReviewCategory, CATEGORIES } from "@/lib/reviewStore";

/* ─── Shared glassmorphism card style ─── */
const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(20px) saturate(150%)",
  WebkitBackdropFilter: "blur(20px) saturate(150%)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
};

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.9)",
  backdropFilter: "blur(8px)",
};

const btnPrimary: React.CSSProperties = {
  background: "linear-gradient(135deg, #FF6B2B 0%, #E63946 100%)",
  color: "#fff",
  boxShadow: "0 4px 16px rgba(255,107,43,0.25)",
};

const btnSecondary: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.7)",
};

/* ─── Tab definitions ─── */
type AdminTab = "site" | "reviews" | "categories";

const TABS: { id: AdminTab; label: string; icon: typeof Settings }[] = [
  { id: "site", label: "Site Content", icon: Layout },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "categories", label: "Categories", icon: Tag },
];

/* ─── Toast notification ─── */
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 rounded-xl px-5 py-3"
      style={{
        background: "rgba(34,197,94,0.15)",
        border: "1px solid rgba(34,197,94,0.3)",
        backdropFilter: "blur(16px)",
      }}
    >
      <Check size={16} style={{ color: "#22c55e" }} />
      <span className="text-sm font-medium" style={{ color: "#22c55e" }}>
        {message}
      </span>
    </motion.div>
  );
}

/* ─── Empty review template ─── */
function emptyReview(): Omit<ReviewData, "id" | "slug" | "created_at" | "updated_at"> {
  return {
    title: "",
    category: "products" as ReviewCategory,
    rating: 5,
    excerpt: "",
    content: "",
    pros: [""],
    cons: [""],
    verdict: "",
    image_url: "",
    product_name: "",
    product_link: "",
    affiliate_tag: "meetaudreyeva-20",
    reviewer_name: "Reese",
    reviewer_email: "",
    is_featured: false,
    status: "approved",
    published_at: new Date().toISOString(),
  };
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN ADMIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
const Admin = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("site");
  const [toast, setToast] = useState("");

  const showToast = useCallback((msg: string) => setToast(msg), []);

  return (
    <main
      id="main-content"
      className="min-h-screen pt-24 pb-16"
      style={{ background: "#0d0d0d" }}
    >
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                background: "linear-gradient(135deg, rgba(255,107,43,0.15), rgba(230,57,70,0.15))",
                border: "1px solid rgba(255,107,43,0.2)",
              }}
            >
              <Settings size={20} style={{ color: "#FF6B2B" }} />
            </div>
            <div>
              <h1
                className="font-serif text-3xl font-bold"
                style={{
                  background: "linear-gradient(135deg, #FF6B2B 0%, #FFB347 50%, #E63946 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Admin Panel
              </h1>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                Edit all site content without touching code
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tab bar */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-medium transition-all"
              style={
                activeTab === tab.id
                  ? {
                      background: "linear-gradient(135deg, rgba(255,107,43,0.15), rgba(230,57,70,0.12))",
                      border: "1px solid rgba(255,107,43,0.3)",
                      color: "#FF6B2B",
                    }
                  : {
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.5)",
                    }
              }
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === "site" && (
            <motion.div key="site" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SiteContentEditor showToast={showToast} />
            </motion.div>
          )}
          {activeTab === "reviews" && (
            <motion.div key="reviews" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ReviewsEditor showToast={showToast} />
            </motion.div>
          )}
          {activeTab === "categories" && (
            <motion.div key="categories" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CategoriesEditor showToast={showToast} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast} onClose={() => setToast("")} />}
      </AnimatePresence>
    </main>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   SITE CONTENT EDITOR
   ═══════════════════════════════════════════════════════════════════ */
function SiteContentEditor({ showToast }: { showToast: (m: string) => void }) {
  const { content, update } = useSiteContent();
  const [form, setForm] = useState(content);
  const [expandedSection, setExpandedSection] = useState<string | null>("hero");

  useEffect(() => {
    setForm(content);
  }, [content]);

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const save = () => {
    update(form);
    showToast("Site content saved!");
  };

  const sections = [
    {
      id: "hero",
      title: "Hero Section",
      icon: Layout,
      fields: [
        { key: "heroTitle", label: "Hero Title", type: "text" },
        { key: "heroSubtitle", label: "Hero Subtitle", type: "text" },
        { key: "heroTagline", label: "Hero Tagline", type: "textarea" },
      ],
    },
    {
      id: "about",
      title: "About Page",
      icon: FileText,
      fields: [
        { key: "aboutTitle", label: "About Title", type: "text" },
        { key: "aboutSubtitle", label: "About Subtitle", type: "text" },
        { key: "aboutStory", label: "About Story", type: "textarea-lg" },
      ],
    },
    {
      id: "footer",
      title: "Footer",
      icon: Layout,
      fields: [
        { key: "footerBrand", label: "Brand Name", type: "text" },
        { key: "footerDescription", label: "Footer Description", type: "textarea" },
        { key: "footerDisclosure", label: "Affiliate Disclosure", type: "textarea" },
      ],
    },
  ];

  const toggleSection = (id: string) =>
    setExpandedSection((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div key={section.id} className="rounded-2xl overflow-hidden" style={glassCard}>
          <button
            onClick={() => toggleSection(section.id)}
            className="flex w-full items-center justify-between px-6 py-4 text-left"
          >
            <div className="flex items-center gap-3">
              <section.icon size={18} style={{ color: "#FFB347" }} />
              <span className="font-semibold text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
                {section.title}
              </span>
            </div>
            {expandedSection === section.id ? (
              <ChevronUp size={18} style={{ color: "rgba(255,255,255,0.4)" }} />
            ) : (
              <ChevronDown size={18} style={{ color: "rgba(255,255,255,0.4)" }} />
            )}
          </button>
          <AnimatePresence>
            {expandedSection === section.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 space-y-4">
                  {section.fields.map((field) => (
                    <div key={field.key}>
                      <label
                        className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                        style={{ color: "rgba(255,255,255,0.45)" }}
                      >
                        {field.label}
                      </label>
                      {field.type === "text" ? (
                        <input
                          type="text"
                          value={(form as Record<string, unknown>)[field.key] as string}
                          onChange={(e) => set(field.key, e.target.value)}
                          className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-orange-500/30"
                          style={inputStyle}
                        />
                      ) : (
                        <textarea
                          value={(form as Record<string, unknown>)[field.key] as string}
                          onChange={(e) => set(field.key, e.target.value)}
                          rows={field.type === "textarea-lg" ? 10 : 3}
                          className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all resize-y focus:ring-2 focus:ring-orange-500/30"
                          style={inputStyle}
                        />
                      )}
                    </div>
                  ))}

                  {/* About Values editor */}
                  {section.id === "about" && (
                    <div>
                      <label
                        className="block text-xs font-semibold uppercase tracking-wider mb-2"
                        style={{ color: "rgba(255,255,255,0.45)" }}
                      >
                        Values
                      </label>
                      <div className="space-y-3">
                        {form.aboutValues.map((val, i) => (
                          <div
                            key={i}
                            className="rounded-xl p-4 space-y-2"
                            style={{
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.06)",
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium" style={{ color: "rgba(255,179,71,0.7)" }}>
                                Value {i + 1}
                              </span>
                              {form.aboutValues.length > 1 && (
                                <button
                                  onClick={() => {
                                    const vals = [...form.aboutValues];
                                    vals.splice(i, 1);
                                    setForm((f) => ({ ...f, aboutValues: vals }));
                                  }}
                                  className="p-1 rounded hover:bg-red-500/10"
                                >
                                  <Trash2 size={14} style={{ color: "#E63946" }} />
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              placeholder="Title"
                              value={val.title}
                              onChange={(e) => {
                                const vals = [...form.aboutValues];
                                vals[i] = { ...vals[i], title: e.target.value };
                                setForm((f) => ({ ...f, aboutValues: vals }));
                              }}
                              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                              style={inputStyle}
                            />
                            <textarea
                              placeholder="Description"
                              value={val.description}
                              onChange={(e) => {
                                const vals = [...form.aboutValues];
                                vals[i] = { ...vals[i], description: e.target.value };
                                setForm((f) => ({ ...f, aboutValues: vals }));
                              }}
                              rows={2}
                              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y"
                              style={inputStyle}
                            />
                          </div>
                        ))}
                        <button
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              aboutValues: [...f.aboutValues, { title: "", description: "" }],
                            }))
                          }
                          className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors hover:bg-white/5"
                          style={{ color: "#FF6B2B" }}
                        >
                          <Plus size={14} /> Add Value
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {/* Save button */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={save}
          className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={btnPrimary}
        >
          <Save size={16} /> Save All Changes
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   REVIEWS EDITOR
   ═══════════════════════════════════════════════════════════════════ */
function ReviewsEditor({ showToast }: { showToast: (m: string) => void }) {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newReview, setNewReview] = useState(emptyReview());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const refresh = useCallback(() => {
    initializeReviewsIfNeeded();
    setReviews(getAllReviews());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("reviews-updated", refresh);
    return () => window.removeEventListener("reviews-updated", refresh);
  }, [refresh]);

  const handleAdd = () => {
    if (!newReview.title.trim()) return;
    addReview(newReview);
    setNewReview(emptyReview());
    setShowNew(false);
    refresh();
    showToast("Review added!");
  };

  const handleUpdate = (id: string, updates: Partial<ReviewData>) => {
    updateReview(id, updates);
    refresh();
    setEditingId(null);
    showToast("Review updated!");
  };

  const handleDelete = (id: string) => {
    deleteReview(id);
    refresh();
    setConfirmDelete(null);
    showToast("Review deleted!");
  };

  return (
    <div className="space-y-4">
      {/* Add new review button */}
      <div className="flex justify-between items-center">
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
          {reviews.length} review{reviews.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setShowNew(!showNew)}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02]"
          style={btnPrimary}
        >
          <Plus size={16} /> New Review
        </button>
      </div>

      {/* New review form */}
      <AnimatePresence>
        {showNew && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <ReviewForm
              review={newReview}
              onChange={setNewReview}
              onSave={handleAdd}
              onCancel={() => {
                setShowNew(false);
                setNewReview(emptyReview());
              }}
              saveLabel="Add Review"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review list */}
      <div className="space-y-3">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-2xl overflow-hidden" style={glassCard}>
            {editingId === review.id ? (
              <ReviewForm
                review={review}
                onChange={() => {}}
                onSave={(updated) => handleUpdate(review.id, updated)}
                onCancel={() => setEditingId(null)}
                saveLabel="Save Changes"
                isEdit
              />
            ) : (
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                      style={{
                        background: review.status === "approved" ? "rgba(34,197,94,0.12)" : "rgba(255,179,71,0.12)",
                        color: review.status === "approved" ? "#22c55e" : "#FFB347",
                      }}
                    >
                      {review.status}
                    </span>
                    {review.is_featured && (
                      <Star size={12} style={{ color: "#FFB347" }} className="fill-current" />
                    )}
                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {review.category}
                    </span>
                  </div>
                  <h3
                    className="text-sm font-semibold truncate"
                    style={{ color: "rgba(255,255,255,0.85)" }}
                  >
                    {review.title}
                  </h3>
                  <p className="text-xs truncate mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {review.product_name} — ★ {review.rating}/5
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setEditingId(review.id)}
                    className="rounded-lg p-2 transition-colors hover:bg-white/5"
                    title="Edit"
                  >
                    <Edit3 size={16} style={{ color: "#FFB347" }} />
                  </button>
                  {confirmDelete === review.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium"
                        style={{ background: "rgba(230,57,70,0.15)", color: "#E63946" }}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="rounded-lg p-1.5 hover:bg-white/5"
                      >
                        <X size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(review.id)}
                      className="rounded-lg p-2 transition-colors hover:bg-red-500/10"
                      title="Delete"
                    >
                      <Trash2 size={16} style={{ color: "#E63946" }} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Review Form (shared for new & edit) ─── */
function ReviewForm({
  review,
  onChange,
  onSave,
  onCancel,
  saveLabel,
  isEdit = false,
}: {
  review: Partial<ReviewData>;
  onChange: (r: any) => void;
  onSave: (r: any) => void;
  onCancel: () => void;
  saveLabel: string;
  isEdit?: boolean;
}) {
  const [form, setForm] = useState<any>({ ...review });

  const set = (key: string, val: any) => {
    setForm((f: any) => {
      const updated = { ...f, [key]: val };
      if (!isEdit) onChange(updated);
      return updated;
    });
  };

  const handleListChange = (key: string, idx: number, val: string) => {
    const list = [...(form[key] || [])];
    list[idx] = val;
    set(key, list);
  };

  const addListItem = (key: string) => {
    set(key, [...(form[key] || []), ""]);
  };

  const removeListItem = (key: string, idx: number) => {
    const list = [...(form[key] || [])];
    list.splice(idx, 1);
    set(key, list);
  };

  return (
    <div className="px-6 py-5 space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Title */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            Review Title *
          </label>
          <input
            type="text"
            value={form.title || ""}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g., The Best Wireless Earbuds for Everyday Use"
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500/30"
            style={inputStyle}
          />
        </div>

        {/* Product Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            Product Name
          </label>
          <input
            type="text"
            value={form.product_name || ""}
            onChange={(e) => set("product_name", e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500/30"
            style={inputStyle}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            Category
          </label>
          <select
            value={form.category || "products"}
            onChange={(e) => set("category", e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500/30"
            style={inputStyle}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value} style={{ background: "#1a1a1a" }}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            Rating (1-5)
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => set("rating", n)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  size={24}
                  style={{
                    color: n <= (form.rating || 5) ? "#FFB347" : "rgba(255,255,255,0.15)",
                    fill: n <= (form.rating || 5) ? "#FFB347" : "transparent",
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            Status
          </label>
          <select
            value={form.status || "approved"}
            onChange={(e) => set("status", e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500/30"
            style={inputStyle}
          >
            <option value="approved" style={{ background: "#1a1a1a" }}>Approved</option>
            <option value="pending" style={{ background: "#1a1a1a" }}>Pending</option>
            <option value="rejected" style={{ background: "#1a1a1a" }}>Rejected</option>
          </select>
        </div>

        {/* Featured */}
        <div className="flex items-center gap-3 md:col-span-2">
          <button
            type="button"
            onClick={() => set("is_featured", !form.is_featured)}
            className="flex h-6 w-11 items-center rounded-full p-0.5 transition-colors"
            style={{
              background: form.is_featured ? "#FF6B2B" : "rgba(255,255,255,0.1)",
            }}
          >
            <div
              className="h-5 w-5 rounded-full bg-white transition-transform"
              style={{
                transform: form.is_featured ? "translateX(20px)" : "translateX(0)",
              }}
            />
          </button>
          <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
            Featured Review
          </span>
        </div>

        {/* Excerpt */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            Excerpt (short summary)
          </label>
          <textarea
            value={form.excerpt || ""}
            onChange={(e) => set("excerpt", e.target.value)}
            rows={2}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-y focus:ring-2 focus:ring-orange-500/30"
            style={inputStyle}
          />
        </div>

        {/* Full Content */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            Full Review Content
          </label>
          <textarea
            value={form.content || ""}
            onChange={(e) => set("content", e.target.value)}
            rows={6}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-y focus:ring-2 focus:ring-orange-500/30"
            style={inputStyle}
          />
        </div>

        {/* Pros */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            Pros
          </label>
          <div className="space-y-2">
            {(form.pros || [""]).map((pro: string, i: number) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={pro}
                  onChange={(e) => handleListChange("pros", i, e.target.value)}
                  placeholder={`Pro ${i + 1}`}
                  className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                  style={inputStyle}
                />
                {(form.pros || []).length > 1 && (
                  <button onClick={() => removeListItem("pros", i)} className="p-1 hover:bg-red-500/10 rounded">
                    <X size={14} style={{ color: "#E63946" }} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => addListItem("pros")}
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: "#22c55e" }}
            >
              <Plus size={12} /> Add Pro
            </button>
          </div>
        </div>

        {/* Cons */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            Cons
          </label>
          <div className="space-y-2">
            {(form.cons || [""]).map((con: string, i: number) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={con}
                  onChange={(e) => handleListChange("cons", i, e.target.value)}
                  placeholder={`Con ${i + 1}`}
                  className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                  style={inputStyle}
                />
                {(form.cons || []).length > 1 && (
                  <button onClick={() => removeListItem("cons", i)} className="p-1 hover:bg-red-500/10 rounded">
                    <X size={14} style={{ color: "#E63946" }} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => addListItem("cons")}
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: "#E63946" }}
            >
              <Plus size={12} /> Add Con
            </button>
          </div>
        </div>

        {/* Verdict */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            Verdict
          </label>
          <textarea
            value={form.verdict || ""}
            onChange={(e) => set("verdict", e.target.value)}
            rows={2}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-y focus:ring-2 focus:ring-orange-500/30"
            style={inputStyle}
          />
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            Image URL
          </label>
          <input
            type="text"
            value={form.image_url || ""}
            onChange={(e) => set("image_url", e.target.value)}
            placeholder="https://..."
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500/30"
            style={inputStyle}
          />
        </div>

        {/* Product Link */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            Product Link
          </label>
          <input
            type="text"
            value={form.product_link || ""}
            onChange={(e) => set("product_link", e.target.value)}
            placeholder="https://amazon.com/..."
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500/30"
            style={inputStyle}
          />
        </div>

        {/* Affiliate Tag */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            Affiliate Tag
          </label>
          <input
            type="text"
            value={form.affiliate_tag || ""}
            onChange={(e) => set("affiliate_tag", e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500/30"
            style={inputStyle}
          />
        </div>

        {/* Reviewer Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            Reviewer Name
          </label>
          <input
            type="text"
            value={form.reviewer_name || ""}
            onChange={(e) => set("reviewer_name", e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500/30"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onCancel}
          className="rounded-xl px-5 py-2.5 text-sm font-medium transition-colors hover:bg-white/5"
          style={btnSecondary}
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(form)}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02]"
          style={btnPrimary}
        >
          <Save size={16} /> {saveLabel}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CATEGORIES EDITOR
   ═══════════════════════════════════════════════════════════════════ */
function CategoriesEditor({ showToast }: { showToast: (m: string) => void }) {
  const { content, update } = useSiteContent();
  const [cats, setCats] = useState(content.categories);

  useEffect(() => {
    setCats(content.categories);
  }, [content]);

  const save = () => {
    update({ categories: cats });
    showToast("Categories saved!");
  };

  const updateCat = (idx: number, key: string, val: string) => {
    const updated = [...cats];
    updated[idx] = { ...updated[idx], [key]: val };
    setCats(updated);
  };

  const addCat = () => {
    setCats([...cats, { value: "", label: "", icon: "📌", description: "" }]);
  };

  const removeCat = (idx: number) => {
    const updated = [...cats];
    updated.splice(idx, 1);
    setCats(updated);
  };

  return (
    <div className="space-y-4">
      {cats.map((cat, i) => (
        <div key={i} className="rounded-2xl p-5" style={glassCard}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,179,71,0.7)" }}>
              Category {i + 1}
            </span>
            {cats.length > 1 && (
              <button
                onClick={() => removeCat(i)}
                className="rounded-lg p-1.5 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={14} style={{ color: "#E63946" }} />
              </button>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                Label
              </label>
              <input
                type="text"
                value={cat.label}
                onChange={(e) => updateCat(i, "label", e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                Value (slug)
              </label>
              <input
                type="text"
                value={cat.value}
                onChange={(e) => updateCat(i, "value", e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                Icon (emoji)
              </label>
              <input
                type="text"
                value={cat.icon}
                onChange={(e) => updateCat(i, "icon", e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                Description
              </label>
              <input
                type="text"
                value={cat.description}
                onChange={(e) => updateCat(i, "description", e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-between pt-2">
        <button
          onClick={addCat}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors hover:bg-white/5"
          style={{ color: "#FF6B2B", border: "1px solid rgba(255,107,43,0.2)" }}
        >
          <Plus size={16} /> Add Category
        </button>
        <button
          onClick={save}
          className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02]"
          style={btnPrimary}
        >
          <Save size={16} /> Save Categories
        </button>
      </div>
    </div>
  );
}

export default Admin;
