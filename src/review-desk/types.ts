export type ReviewImage = {
  id: string;
  label: string;
  url: string;
  path: string;
  isFinal?: boolean;
};

export type ProductReview = {
  id: string;
  slug: string;
  branch: string;
  prNumber: number | null;
  prUrl: string | null;
  notionUrl: string | null;
  name: string;
  asin: string;
  amazonUrl: string;
  category: string | null;
  status: string;
  rating: number | null;
  title: string;
  body: string;
  images: ReviewImage[];
  textOnly: boolean;
  markdownPath: string;
  markdown: string;
};

export type ReviewFields = {
  rating: number | null;
  title: string;
  body: string;
  imageCount: number;
  textOnly: boolean;
};

export type Completeness = {
  rating: boolean;
  title: boolean;
  body: boolean;
  images: boolean;
  complete: boolean;
};

export type FillStepKey = "headline" | "photos" | "body";

export type FillStepState = "pending" | "filling" | "verifying" | "done" | "failed";

export type FillStepProgress = {
  key: FillStepKey;
  label: string;
  state: FillStepState;
  detail: string;
};

export type FillProgress = {
  target: "amazon" | "site" | "rehearsal";
  product: string;
  asin: string;
  steps: FillStepProgress[];
  current: FillStepKey | null;
  state: "idle" | "running" | "awaiting_human_submit" | "failed";
  message: string;
};
