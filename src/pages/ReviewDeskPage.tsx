import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, ImagePlus, Loader2, Upload } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import StarRating from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { checkCompleteness, REVIEW_TITLE_MAX } from "@/review-desk/completeness";
import {
  commitFile,
  DEFAULT_REPO,
  fileToBase64,
  githubEditUrl,
  githubUploadUrl,
  listReviewPulls,
  loadReviewFromBranch,
} from "@/review-desk/github";
import { serializeReviewMarkdown } from "@/review-desk/parseReview";
import { getLocalReviews, getSampleReviews } from "@/review-desk/sample";
import {
  DEFAULT_FIELD_DELAY_SEC,
  initialFillProgress,
  markAwaitingSubmit,
  pickFieldDelaySeconds,
  setFillStep,
  sleep,
} from "@/review-desk/sequentialFill";
import type { FillProgress, ProductReview } from "@/review-desk/types";

const TOKEN_KEY = "review-desk-github-token";

function fieldsOf(review: ProductReview, extraImages = 0) {
  return {
    rating: review.rating,
    title: review.title,
    body: review.body,
    imageCount: review.images.length + extraImages,
    textOnly: review.textOnly,
  };
}

export default function ReviewDeskPage() {
  const [reviews, setReviews] = useState<ProductReview[]>(() => getSampleReviews());
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<"demo" | "local" | "github">("local");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const [fill, setFill] = useState<FillProgress | null>(null);
  const [filling, setFilling] = useState(false);
  const [filledForm, setFilledForm] = useState({ title: "", photos: [] as string[], body: "" });
  const cancelled = useRef(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(TOKEN_KEY);
    if (stored) setToken(stored);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const local = getLocalReviews();
    try {
      const pulls = await listReviewPulls(DEFAULT_REPO, token || undefined);
      if (!pulls.length) {
        setReviews(local.length ? local : getSampleReviews());
        setMode(local.length ? "local" : "demo");
        return;
      }
      const loaded: ProductReview[] = [];
      for (const pull of pulls) {
        const review = await loadReviewFromBranch(DEFAULT_REPO, pull.head.ref, pull, token || undefined);
        if (review) loaded.push(review);
      }
      if (!loaded.length) {
        setReviews(local.length ? local : getSampleReviews());
        setMode(local.length ? "local" : "demo");
        setError("Open review PRs were found, but none had a reviews/<slug>/review.md file yet.");
        return;
      }
      setReviews(loaded);
      setMode("github");
      setIndex(0);
    } catch (err) {
      setReviews(local.length ? local : getSampleReviews());
      setMode(local.length ? "local" : "demo");
      setError(`${err instanceof Error ? err.message : "Could not load review pull requests."} Showing every product imported into this checkout instead.`);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const review = reviews[index];
  const completeness = useMemo(
    () => (review ? checkCompleteness(fieldsOf(review, localFiles.length)) : null),
    [review, localFiles.length],
  );

  useEffect(() => {
    setLocalFiles([]);
    setSaveMessage(null);
    setFill(review ? initialFillProgress(review) : null);
    setFilledForm({ title: "", photos: [], body: "" });
    cancelled.current = true;
    setFilling(false);
  }, [review?.id]);

  const update = (patch: Partial<ProductReview>) => {
    setReviews((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const persistToken = (value: string) => {
    setToken(value);
    if (value) sessionStorage.setItem(TOKEN_KEY, value);
    else sessionStorage.removeItem(TOKEN_KEY);
  };

  const saveToBranch = async () => {
    if (!review || !token) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const markdown = serializeReviewMarkdown({
        product: review.name,
        asin: review.asin,
        url: review.amazonUrl,
        rating: review.rating,
        title: review.title,
        status: completeness?.complete ? "ready-for-proofy" : review.status,
        slug: review.slug,
        textOnly: review.textOnly,
        category: review.category || undefined,
        notionUrl: review.notionUrl || undefined,
        orderDate: review.orderDate || undefined,
        priority: review.priority || undefined,
        body: review.body,
      });
      await commitFile({
        repo: DEFAULT_REPO,
        branch: review.branch,
        path: review.markdownPath,
        content: markdown,
        message: `**Auky:** update ${review.name} from Review Desk — Auky`,
        token,
      });
      for (const file of localFiles) {
        const content = await fileToBase64(file);
        const dest = `reviews/${review.slug}/images/${file.name}`;
        await commitFile({
          repo: DEFAULT_REPO,
          branch: review.branch,
          path: dest,
          content,
          message: `**Auky:** replace image ${file.name} on ${review.name} — Auky`,
          token,
          binary: true,
        });
      }
      setSaveMessage("Saved to the review PR branch.");
      setLocalFiles([]);
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "Could not save to GitHub.");
    } finally {
      setSaving(false);
    }
  };

  const startFill = async () => {
    if (!review) return;
    cancelled.current = false;
    setFilling(true);
    setFilledForm({ title: "", photos: [], body: "" });
    let progress = initialFillProgress(review, "rehearsal");
    setFill(progress);

    progress = setFillStep(progress, "headline", "filling", "Writing the title.");
    setFill(progress);
    if (!cancelled.current) {
      setFilledForm((current) => ({ ...current, title: review.title }));
    }
    progress = setFillStep(progress, "headline", "done", "Title is in.");
    setFill(progress);

    const firstDelay = pickFieldDelaySeconds();
    progress = setFillStep(progress, "photos", "waiting", `Waiting ${firstDelay}s before images.`);
    setFill(progress);
    await sleep(firstDelay * 1000);
    if (cancelled.current) {
      setFilling(false);
      return;
    }
    progress = setFillStep(progress, "photos", "filling", "Adding images.");
    setFill(progress);
    setFilledForm((current) => ({
      ...current,
      photos: review.images.map((image) => image.url),
    }));
    progress = setFillStep(progress, "photos", "done", "Images are in.");
    setFill(progress);

    const secondDelay = pickFieldDelaySeconds();
    progress = setFillStep(progress, "body", "waiting", `Waiting ${secondDelay}s before the review.`);
    setFill(progress);
    await sleep(secondDelay * 1000);
    if (cancelled.current) {
      setFilling(false);
      return;
    }
    progress = setFillStep(progress, "body", "filling", "Writing the review.");
    setFill(progress);
    setFilledForm((current) => ({ ...current, body: review.body }));
    progress = setFillStep(progress, "body", "done", "Review is in.");
    setFill(markAwaitingSubmit(progress));
    setFilling(false);
  };

  if (!review) {
    return (
      <div className="min-h-screen gradient-dark-surface pt-24 pb-16">
        <SEOHead title="Review Desk" description="Walk through each product review." noIndex />
        <div className="container mx-auto px-4 text-center text-muted-foreground">No reviews to show yet.</div>
      </div>
    );
  }

  const uploadUrl = githubUploadUrl(DEFAULT_REPO, review.branch, `reviews/${review.slug}/images`);
  const editUrl = githubEditUrl(DEFAULT_REPO, review.markdownPath.includes("reviews/") ? review.branch : "main", review.markdownPath);
  const canPrev = index > 0;
  const canNext = index < reviews.length - 1;

  return (
    <div className="min-h-screen gradient-dark-surface pt-20 pb-16">
      <SEOHead
        title="Review Desk"
        description="Walk through each product review, edit anything, and fill the form one field at a time."
        noIndex
      />
      <div className="container mx-auto max-w-5xl px-4 sm:px-6">
        <header className="mb-6">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Reese Reviews</p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
            <h1 className="font-serif text-3xl font-bold text-foreground">Review Desk</h1>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {index + 1} of {reviews.length}
              {mode === "github" ? " · Open review PRs" : mode === "local" ? " · Local queue" : " · Demo"}
            </p>
          </div>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
            Everything is prefilled. Edit anything, or replace a generated photo with your own. Nothing is posted to Amazon from here. Press Start and the form is filled title, then images, then the review, with a short pause between each field. You press Submit yourself.
          </p>
        </header>

        {error && (
          <p className="mb-4 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground" role="status">
            {error}
          </p>
        )}

        {reviews.length > 1 && (
          <nav aria-label="Products that need a review" className="mb-4 grid gap-2 sm:grid-cols-2">
            {reviews.map((item, itemIndex) => {
              const itemComplete = checkCompleteness(fieldsOf(item)).complete;
              const selected = itemIndex === index;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setIndex(itemIndex)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    selected
                      ? "border-primary bg-card text-foreground"
                      : "border-border bg-card/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="block font-medium text-foreground">{item.name}</span>
                  <span className="mt-1 block text-xs">
                    {item.asin || "No ASIN"} · {itemComplete ? "Ready" : "Needs fields"}
                    {item.priority === "reviews-to-do" ? " · Reviews to do" : ""}
                    {item.orderDate ? ` · ${item.orderDate}` : ""}
                  </span>
                </button>
              );
            })}
          </nav>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setIndex((i) => i - 1)} disabled={!canPrev}>
            <ChevronLeft size={16} aria-hidden="true" /> Previous
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setIndex((i) => i + 1)} disabled={!canNext}>
            Next <ChevronRight size={16} aria-hidden="true" />
          </Button>
          {review.prUrl && (
            <a
              className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
              href={review.prUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open PR #{review.prNumber} <ExternalLink size={14} aria-hidden="true" />
            </a>
          )}
        </div>


        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm" aria-labelledby="product-heading">
            <h2 id="product-heading" className="font-serif text-2xl font-semibold text-foreground">
              {review.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {review.asin ? (
                <a className="underline-offset-4 hover:underline" href={review.amazonUrl} target="_blank" rel="noreferrer">
                  ASIN {review.asin}
                </a>
              ) : (
                "No ASIN yet"
              )}
              {review.status ? ` · ${review.status}` : ""}
              {review.priority === "reviews-to-do" ? " · Reviews to do" : ""}
              {review.orderDate ? ` · ordered ${review.orderDate}` : ""}
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <Label>Star rating</Label>
                <div className="mt-2">
                  <StarRating
                    rating={review.rating ?? 0}
                    interactive
                    size={28}
                    showLabel
                    onRate={(value) => update({ rating: value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="review-title">Title</Label>
                <Input
                  id="review-title"
                  className="mt-2"
                  maxLength={REVIEW_TITLE_MAX}
                  value={review.title}
                  onChange={(event) => update({ title: event.target.value })}
                />
                <p className="mt-1 text-xs text-muted-foreground">{review.title.length}/{REVIEW_TITLE_MAX}</p>
              </div>

              <div>
                <Label htmlFor="review-body">Review</Label>
                <Textarea
                  id="review-body"
                  className="mt-2 min-h-[180px]"
                  value={review.body}
                  onChange={(event) => update({ body: event.target.value })}
                />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                <Label htmlFor="text-only" className="text-sm">
                  Text-only review (no photos)
                </Label>
                <Switch
                  id="text-only"
                  checked={review.textOnly}
                  onCheckedChange={(checked) => update({ textOnly: checked })}
                />
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-foreground">Images</h3>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {review.images.map((image) => (
                  <figure key={image.id} className="overflow-hidden rounded-lg border border-border bg-secondary/40">
                    <img src={image.url} alt={image.label} className="aspect-square w-full object-contain bg-background" />
                    <figcaption className="px-2 py-1 text-xs text-muted-foreground">{image.label}</figcaption>
                  </figure>
                ))}
                {localFiles.map((file) => (
                  <figure key={file.name} className="overflow-hidden rounded-lg border border-primary/40 bg-secondary/40">
                    <img src={URL.createObjectURL(file)} alt={file.name} className="aspect-square w-full object-contain bg-background" />
                    <figcaption className="px-2 py-1 text-xs text-muted-foreground">Replacement: {file.name}</figcaption>
                  </figure>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent">
                  <ImagePlus size={16} aria-hidden="true" />
                  Replace with my photo
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []);
                      setLocalFiles((current) => [...current, ...files]);
                    }}
                  />
                </label>
                <a
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent"
                  href={uploadUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Upload size={16} aria-hidden="true" />
                  Upload on GitHub
                </a>
                <a
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent"
                  href={editUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Edit review.md on GitHub
                </a>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-xl border border-border bg-card p-5" aria-labelledby="checklist-heading">
              <h2 id="checklist-heading" className="font-semibold text-foreground">
                Ready to go?
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {completeness &&
                  (
                    [
                      ["rating", "Star rating"],
                      ["title", "Title"],
                      ["images", "Image or text-only"],
                      ["body", "Written review"],
                    ] as const
                  ).map(([key, label]) => (
                    <li key={key} className="flex items-center gap-2">
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                          completeness[key]
                            ? "bg-success text-success-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                        aria-hidden="true"
                      >
                        {completeness[key] ? "✓" : "·"}
                      </span>
                      <span className={completeness[key] ? "text-foreground" : "text-muted-foreground"}>
                        {label}
                      </span>
                    </li>
                  ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                CircleCI also runs this check on the review PR. Submit on Amazon stays in your hands.
              </p>
            </section>

            <section className="rounded-xl border border-border bg-card p-5" aria-labelledby="fill-heading">
              <h2 id="fill-heading" className="font-semibold text-foreground">
                Start fill
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                All of the data is already here. Press Start and it fills the form in order: title, pause, images, pause, review. Then you press Submit.
              </p>
              <Button className="mt-4 w-full" onClick={() => void startFill()} disabled={filling || !completeness?.complete}>
                {filling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Filling the next field…
                  </>
                ) : (
                  "Start"
                )}
              </Button>
              {!completeness?.complete && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Start unlocks when the rating, title, review, and photo (or text-only) are filled in.
                </p>
              )}

              {fill && (
                <ol className="mt-4 space-y-2" aria-live="polite">
                  {fill.steps.map((step) => (
                    <li key={step.key} className="rounded-md border border-border px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground">{step.label}</span>
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">{step.state}</span>
                      </div>
                      {step.detail && <p className="mt-1 text-xs text-muted-foreground">{step.detail}</p>}
                    </li>
                  ))}
                </ol>
              )}

              <div className="mt-4 rounded-lg border border-dashed border-border p-3" aria-label="Form being filled">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Form preview</p>
                <p className="mt-2 text-sm">
                  <span className="text-muted-foreground">Title: </span>
                  {filledForm.title || "waiting…"}
                </p>
                <p className="mt-1 text-sm">
                  <span className="text-muted-foreground">Images: </span>
                  {filledForm.photos.length ? `${filledForm.photos.length} added` : "waiting…"}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  <span className="text-muted-foreground">Review: </span>
                  {filledForm.body || "waiting…"}
                </p>
                {fill?.state === "awaiting_human_submit" && (
                  <p className="mt-3 rounded-md bg-secondary px-3 py-2 text-sm text-foreground">
                    Title, images, and review are in. Please press Submit yourself.
                  </p>
                )}
              </div>
            </section>

            {mode === "github" && (
              <section className="rounded-xl border border-border bg-card p-5" aria-labelledby="save-heading">
                <h2 id="save-heading" className="font-semibold text-foreground">
                  Save to the PR
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  A GitHub token stays in this browser tab only and is used to commit your edits to the review branch. Or use the GitHub links above.
                </p>
                <Label htmlFor="gh-token" className="mt-3 block">
                  GitHub token (repo scope)
                </Label>
                <Input
                  id="gh-token"
                  className="mt-2"
                  type="password"
                  autoComplete="off"
                  value={token}
                  onChange={(event) => persistToken(event.target.value)}
                />
                <Button className="mt-3 w-full" variant="secondary" onClick={() => void saveToBranch()} disabled={!token || saving}>
                  {saving ? "Saving…" : "Save edits to the PR branch"}
                </Button>
                {saveMessage && <p className="mt-2 text-sm text-muted-foreground">{saveMessage}</p>}
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
