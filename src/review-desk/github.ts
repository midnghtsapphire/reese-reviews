import type { ProductReview, ReviewImage } from "./types";
import { parseReviewMarkdown } from "./parseReview";

export const DEFAULT_REPO = "midnghtsapphire/reese-reviews";

const API = "https://api.github.com";

export function githubHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export function githubEditUrl(repo: string, branch: string, path: string): string {
  return `https://github.com/${repo}/edit/${encodeURIComponent(branch)}/${path}`;
}

export function githubUploadUrl(repo: string, branch: string, folder: string): string {
  return `https://github.com/${repo}/upload/${encodeURIComponent(branch)}/${folder}`;
}

export function githubTreeUrl(repo: string, branch: string, folder: string): string {
  return `https://github.com/${repo}/tree/${encodeURIComponent(branch)}/${folder}`;
}

export type GithubPull = {
  number: number;
  title: string;
  html_url: string;
  draft: boolean;
  head: { ref: string };
  labels: { name: string }[];
};

export async function listReviewPulls(
  repo = DEFAULT_REPO,
  token?: string,
): Promise<GithubPull[]> {
  const url = `${API}/repos/${repo}/pulls?state=open&per_page=100`;
  const res = await fetch(url, { headers: githubHeaders(token) });
  if (!res.ok) {
    throw new Error(`Could not list pull requests (${res.status}).`);
  }
  const pulls = (await res.json()) as GithubPull[];
  return pulls.filter((p) => p.head?.ref?.startsWith("review/"));
}

type ContentResponse = {
  name: string;
  path: string;
  sha: string;
  type: "file" | "dir";
  download_url: string | null;
  content?: string;
  encoding?: string;
};

async function getContent(
  repo: string,
  path: string,
  ref: string,
  token?: string,
): Promise<ContentResponse | ContentResponse[] | null> {
  const url = `${API}/repos/${repo}/contents/${path}?ref=${encodeURIComponent(ref)}`;
  const res = await fetch(url, { headers: githubHeaders(token) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Could not read ${path} (${res.status}).`);
  return (await res.json()) as ContentResponse | ContentResponse[];
}

function decodeFile(file: ContentResponse): string {
  if (!file.content) return "";
  const normalized = file.content.replace(/\n/g, "");
  return atob(normalized);
}

export async function loadReviewFromBranch(
  repo: string,
  branch: string,
  pr: GithubPull | null,
  token?: string,
): Promise<ProductReview | null> {
  const treeUrl = `${API}/repos/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
  const treeRes = await fetch(treeUrl, { headers: githubHeaders(token) });
  if (!treeRes.ok) return null;
  const tree = (await treeRes.json()) as {
    tree?: { path: string; type: string }[];
  };
  const mdPath = (tree.tree ?? []).find(
    (item) => item.type === "blob" && /^reviews\/[^/]+\/review\.md$/.test(item.path),
  )?.path;
  if (!mdPath) return null;
  const file = await getContent(repo, mdPath, branch, token);
  if (!file || Array.isArray(file)) return null;
  const raw = decodeFile(file);
  const parsed = parseReviewMarkdown(raw);
  const slug = parsed.slug || mdPath.split("/")[1];
  const imageDir = `reviews/${slug}/images`;
  const listing = await getContent(repo, imageDir, branch, token);
  const images: ReviewImage[] = [];
  if (Array.isArray(listing)) {
    for (const item of listing) {
      if (item.type !== "file") continue;
      if (!/\.(png|jpe?g|webp|gif|svg)$/i.test(item.name)) continue;
      const isFinal = /final/i.test(item.name);
      images.push({
        id: item.sha || item.name,
        label: isFinal ? "Final Review Photo" : item.name,
        url: item.download_url || "",
        path: item.path,
        isFinal,
      });
    }
  }
  return {
    id: pr ? String(pr.number) : slug,
    slug,
    branch,
    prNumber: pr?.number ?? null,
    prUrl: pr?.html_url ?? null,
    notionUrl: parsed.notionUrl || null,
    name: parsed.product || slug,
    asin: parsed.asin,
    amazonUrl: parsed.url || (parsed.asin ? `https://www.amazon.com/dp/${parsed.asin}` : ""),
    category: parsed.category || null,
    status: parsed.status,
    rating: parsed.rating,
    title: parsed.title,
    body: parsed.body,
    images,
    textOnly: parsed.textOnly,
    markdownPath: mdPath,
    markdown: raw,
    orderDate: parsed.orderDate || null,
    priority: parsed.priority || null,
  };
}

export async function commitFile(options: {
  repo: string;
  branch: string;
  path: string;
  content: string;
  message: string;
  token: string;
  binary?: boolean;
}): Promise<void> {
  const existing = await getContent(options.repo, options.path, options.branch, options.token);
  const sha = existing && !Array.isArray(existing) ? existing.sha : undefined;
  const body = {
    message: options.message,
    content: options.binary
      ? options.content
      : btoa(unescape(encodeURIComponent(options.content))),
    branch: options.branch,
    sha,
  };
  const res = await fetch(`${API}/repos/${options.repo}/contents/${options.path}`, {
    method: "PUT",
    headers: {
      ...githubHeaders(options.token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Could not save ${options.path} (${res.status}): ${detail}`);
  }
}

export async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}
