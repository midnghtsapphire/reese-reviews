export type ParsedFrontMatter = {
  product: string;
  asin: string;
  url: string;
  rating: number | null;
  title: string;
  status: string;
  slug: string;
  textOnly: boolean;
  category: string;
  notionUrl: string;
  extra: Record<string, string>;
};

export type ParsedReview = ParsedFrontMatter & {
  body: string;
  raw: string;
};

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseScalar(value: string): string | number | boolean | null {
  const v = stripQuotes(value);
  if (v === "" || v === "null" || v === "~") return null;
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+$/.test(v)) return Number(v);
  return v;
}

/** Split YAML-like front matter from the review body. Values are simple scalars. */
export function parseReviewMarkdown(raw: string): ParsedReview {
  const text = raw.replace(/^\uFEFF/, "");
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return {
      product: "",
      asin: "",
      url: "",
      rating: null,
      title: "",
      status: "draft",
      slug: "",
      textOnly: false,
      category: "",
      notionUrl: "",
      extra: {},
      body: text.trim(),
      raw: text,
    };
  }

  const extra: Record<string, string> = {};
  const data: Record<string, string | number | boolean | null> = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = parseScalar(line.slice(idx + 1));
    data[key] = value;
    extra[key] = value === null ? "" : String(value);
  }

  const ratingRaw = data.rating;
  let rating: number | null = null;
  if (typeof ratingRaw === "number" && Number.isInteger(ratingRaw)) {
    rating = ratingRaw;
  } else if (typeof ratingRaw === "string" && /^-?\d+$/.test(ratingRaw)) {
    rating = Number(ratingRaw);
  }

  const textOnly =
    data.text_only === true ||
    data.textOnly === true ||
    data.text_only === "true" ||
    data.textOnly === "true";

  return {
    product: String(data.product ?? data.name ?? ""),
    asin: String(data.asin ?? data.ASIN ?? ""),
    url: String(data.url ?? data.amazon_url ?? ""),
    rating,
    title: String(data.title ?? data.headline ?? ""),
    status: String(data.status ?? "draft"),
    slug: String(data.slug ?? ""),
    textOnly,
    category: String(data.category ?? ""),
    notionUrl: String(data.notion_url ?? data.notionUrl ?? ""),
    extra,
    body: match[2].replace(/^\r?\n/, "").trimEnd(),
    raw: text,
  };
}

export function serializeReviewMarkdown(parsed: {
  product: string;
  asin: string;
  url: string;
  rating: number | null;
  title: string;
  status: string;
  slug: string;
  textOnly: boolean;
  category?: string;
  notionUrl?: string;
  body: string;
}): string {
  const lines = [
    "---",
    `product: ${JSON.stringify(parsed.product)}`,
    `asin: ${JSON.stringify(parsed.asin)}`,
    `url: ${JSON.stringify(parsed.url)}`,
    `rating: ${parsed.rating === null ? "null" : String(parsed.rating)}`,
    `title: ${JSON.stringify(parsed.title)}`,
    `status: ${JSON.stringify(parsed.status)}`,
    `slug: ${JSON.stringify(parsed.slug)}`,
    `text_only: ${parsed.textOnly ? "true" : "false"}`,
  ];
  if (parsed.category) lines.push(`category: ${JSON.stringify(parsed.category)}`);
  if (parsed.notionUrl) lines.push(`notion_url: ${JSON.stringify(parsed.notionUrl)}`);
  lines.push("---", "", parsed.body.trim(), "");
  return lines.join("\n");
}
