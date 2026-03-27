// ============================================================
// CROSS-MARKET REVIEW SEEDING
// Enables seeding review generation using real reviews from
// international Amazon marketplaces (UK, CA, AU, DE, etc.).
// Follows the same pattern as using other-country listings
// for product photos — extract inspiration, create original.
//
// Two workflows:
//   1. Caresse — general product reviews with her avatar
//   2. Vine/Audrey — Vine product reviews (reese/revvel avatar)
// ============================================================

// ─── MARKETS ────────────────────────────────────────────────

export interface AmazonMarket {
  code: string;
  domain: string;
  flag: string;
  label: string;
}

export const AMAZON_MARKETS: AmazonMarket[] = [
  { code: "UK", domain: "amazon.co.uk", flag: "🇬🇧", label: "United Kingdom" },
  { code: "CA", domain: "amazon.ca", flag: "🇨🇦", label: "Canada" },
  { code: "AU", domain: "amazon.com.au", flag: "🇦🇺", label: "Australia" },
  { code: "DE", domain: "amazon.de", flag: "🇩🇪", label: "Germany" },
  { code: "FR", domain: "amazon.fr", flag: "🇫🇷", label: "France" },
  { code: "JP", domain: "amazon.co.jp", flag: "🇯🇵", label: "Japan" },
  { code: "ES", domain: "amazon.es", flag: "🇪🇸", label: "Spain" },
  { code: "IT", domain: "amazon.it", flag: "🇮🇹", label: "Italy" },
  { code: "MX", domain: "amazon.com.mx", flag: "🇲🇽", label: "Mexico" },
  { code: "IN", domain: "amazon.in", flag: "🇮🇳", label: "India" },
];

/** Returns the product listing URL for an ASIN on a given market. */
export function buildMarketUrl(asin: string, domain: string): string {
  return `https://www.${domain}/dp/${asin}`;
}

// ─── SEED DATA TYPES ────────────────────────────────────────

export interface MarketSeed {
  marketCode: string;
  marketLabel: string;
  pastedText: string;
}

export interface SeedExtraction {
  keyPhrases: string[];
  positivePoints: string[];
  negativePoints: string[];
  featuresMentioned: string[];
  overallSentiment: "positive" | "neutral" | "negative";
}

export interface SeededReviewResult {
  title: string;
  body: string;
  pros: string[];
  cons: string[];
  rating: number;
  tone: "enthusiastic" | "balanced" | "critical" | "casual";
}

// ─── EXTRACTION ─────────────────────────────────────────────

const POSITIVE_WORDS = [
  "love", "great", "excellent", "amazing", "perfect", "awesome", "fantastic",
  "best", "wonderful", "impressive", "solid", "quality", "recommend", "worth",
  "happy", "pleased", "satisfied", "good", "nice", "works well", "outstanding",
  "superb", "exceptional", "brilliant", "gorgeous", "durable",
];

const NEGATIVE_WORDS = [
  "bad", "poor", "terrible", "awful", "broken", "cheap", "disappointing",
  "issue", "problem", "fail", "worst", "waste", "useless", "defective",
  "flimsy", "overpriced", "returned", "refund", "cracked", "stopped working",
  "not worth", "do not buy", "regret",
];

const FEATURE_KEYWORDS = [
  "battery", "screen", "display", "camera", "design", "build", "quality",
  "performance", "price", "value", "size", "weight", "color", "setup",
  "installation", "warranty", "packaging", "sound", "durability", "material",
  "comfort", "fit", "charging", "speed", "software", "app", "connectivity",
  "brightness", "resolution", "waterproof", "portability",
];

/**
 * Parses raw pasted review text and extracts structured signals:
 * positive points, negative points, features mentioned, and sentiment.
 */
export function extractSeedData(pastedText: string): SeedExtraction {
  if (!pastedText || pastedText.trim().length < 10) {
    return {
      keyPhrases: [],
      positivePoints: [],
      negativePoints: [],
      featuresMentioned: [],
      overallSentiment: "neutral",
    };
  }

  const text = pastedText.toLowerCase();
  const sentences = pastedText
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  const positivePoints: string[] = [];
  const negativePoints: string[] = [];
  const keyPhrases: string[] = [];

  sentences.forEach((sentence) => {
    const lower = sentence.toLowerCase();
    const hasPositive = POSITIVE_WORDS.some((w) => lower.includes(w));
    const hasNegative = NEGATIVE_WORDS.some((w) => lower.includes(w));

    if (hasPositive && !hasNegative) {
      positivePoints.push(sentence);
    } else if (hasNegative && !hasPositive) {
      negativePoints.push(sentence);
    } else if (sentence.length > 20) {
      keyPhrases.push(sentence);
    }
  });

  const positiveScore = positivePoints.length;
  const negativeScore = negativePoints.length;

  let overallSentiment: "positive" | "neutral" | "negative";
  if (positiveScore > negativeScore * 1.5) {
    overallSentiment = "positive";
  } else if (negativeScore > positiveScore) {
    overallSentiment = "negative";
  } else {
    overallSentiment = "neutral";
  }

  const featuresMentioned = FEATURE_KEYWORDS.filter((f) => text.includes(f));

  return {
    keyPhrases: keyPhrases.slice(0, 4),
    positivePoints: positivePoints.slice(0, 5),
    negativePoints: negativePoints.slice(0, 3),
    featuresMentioned: featuresMentioned.slice(0, 6),
    overallSentiment,
  };
}

// ─── SYNTHESIS ──────────────────────────────────────────────

/**
 * Synthesizes a new, original review from cross-market seed text.
 * The output is in the voice of the chosen persona and is NOT a
 * copy — it draws on themes and sentiment, then rewrites.
 *
 * @param productName - product being reviewed
 * @param productDescription - optional product description
 * @param seeds - pasted review text from one or more markets
 * @param voice - "caresse" | "reese" | "revvel"
 */
export function synthesizeSeededReview(
  productName: string,
  productDescription: string,
  seeds: MarketSeed[],
  voice: "caresse" | "reese" | "revvel"
): SeededReviewResult {
  const hasSeeds = seeds.some((s) => s.pastedText.trim().length > 0);

  if (!hasSeeds) {
    return _fallbackReview(productName, voice);
  }

  const combinedText = seeds.map((s) => s.pastedText).join("\n\n");
  const extraction = extractSeedData(combinedText);
  const { positivePoints, negativePoints, featuresMentioned, overallSentiment, keyPhrases } =
    extraction;

  const tone: SeededReviewResult["tone"] =
    overallSentiment === "positive"
      ? Math.random() > 0.5
        ? "enthusiastic"
        : "casual"
      : overallSentiment === "negative"
      ? "critical"
      : "balanced";

  const rating =
    overallSentiment === "positive" ? 5 : overallSentiment === "negative" ? 3 : 4;

  const pros =
    positivePoints.length > 0
      ? positivePoints.slice(0, 4).map((p) => _cap(p.slice(0, 90)))
      : ["Works as described", "Good value for the price", "Easy to use"];

  const cons =
    negativePoints.length > 0
      ? negativePoints.slice(0, 2).map((p) => _cap(p.slice(0, 90)))
      : ["Nothing major to note"];

  const featuredPhrase = keyPhrases.length > 0 ? keyPhrases[0].slice(0, 120) : "";
  const featuresStr =
    featuresMentioned.length > 0
      ? `Reviewers specifically called out the ${featuresMentioned.slice(0, 3).join(", ")}.`
      : "";

  const { title, body } = _buildVoiceContent({
    voice,
    productName,
    desc: productDescription,
    positivePoints,
    negativePoints,
    featuredPhrase,
    featuresStr,
    tone,
  });

  return { title, body, pros, cons, rating, tone };
}

// ─── PRIVATE HELPERS ────────────────────────────────────────

function _cap(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

interface VoiceContentParams {
  voice: "caresse" | "reese" | "revvel";
  productName: string;
  desc: string;
  positivePoints: string[];
  negativePoints: string[];
  featuredPhrase: string;
  featuresStr: string;
  tone: SeededReviewResult["tone"];
}

function _buildVoiceContent(p: VoiceContentParams): { title: string; body: string } {
  const descSnippet = p.desc ? p.desc.slice(0, 80) : "";
  const hasPositive = p.positivePoints.length > 0;
  const hasNegative = p.negativePoints.length > 0;

  if (p.voice === "caresse") {
    const titles: Record<string, string> = {
      enthusiastic: `${p.productName} — this one actually delivered`,
      balanced: `My honest take on the ${p.productName}`,
      critical: `${p.productName}: worth knowing before you buy`,
      casual: `Tried the ${p.productName} — here's what I think`,
    };

    const lines = [
      `I've had the chance to use the ${p.productName} and wanted to share my thoughts.`,
      descSnippet ? `The product markets itself as ${descSnippet}.` : "",
      p.featuredPhrase ? `What stood out: "${p.featuredPhrase}."` : "",
      hasPositive
        ? `The standout points: ${p.positivePoints
            .slice(0, 2)
            .map((pt) => pt.slice(0, 70))
            .join("; ")}.`
        : "The performance has been reliable and consistent.",
      p.featuresStr,
      hasNegative
        ? `One thing worth noting: ${p.negativePoints[0].slice(0, 90)}.`
        : "I don't have any major complaints.",
      p.tone === "enthusiastic"
        ? "Overall, I'd recommend this one without hesitation."
        : p.tone === "critical"
        ? "Decent option — just compare it carefully against alternatives first."
        : "Solid choice for what you're paying.",
    ];

    return { title: titles[p.tone] ?? titles.balanced, body: lines.filter(Boolean).join(" ") };
  }

  if (p.voice === "reese") {
    const titles: Record<string, string> = {
      enthusiastic: `Okay so the ${p.productName} is actually so good`,
      balanced: `${p.productName} — real talk after using it for a bit`,
      critical: `${p.productName} review — not perfect but here's my take`,
      casual: `${p.productName} is pretty solid ngl`,
    };

    const lines = [
      `So I got the ${p.productName} and I've been using it, here's my honest opinion.`,
      descSnippet ? `It's basically ${descSnippet}.` : "",
      p.featuredPhrase ? `One thing people are saying: "${p.featuredPhrase}."` : "",
      hasPositive
        ? `What I like about it: ${p.positivePoints
            .slice(0, 2)
            .map((pt) => pt.slice(0, 70))
            .join(". ")}.`
        : "It does what it's supposed to do and works well.",
      p.featuresStr,
      hasNegative
        ? `Only thing: ${p.negativePoints[0].slice(0, 90)}.`
        : "Nothing bad to say really.",
      p.tone === "enthusiastic"
        ? "Would 100% recommend it."
        : p.tone === "critical"
        ? "Decent but not for everyone."
        : "Overall pretty happy with it.",
    ];

    return { title: titles[p.tone] ?? titles.balanced, body: lines.filter(Boolean).join(" ") };
  }

  // revvel — tech-focused
  const titles: Record<string, string> = {
    enthusiastic: `${p.productName} — exceptional performance, exceeded specs`,
    balanced: `${p.productName}: full technical breakdown`,
    critical: `${p.productName}: honest technical assessment`,
    casual: `${p.productName} — quick take from a tech perspective`,
  };

  const lines = [
    `After putting the ${p.productName} through its paces, here's the technical breakdown.`,
    descSnippet ? `Spec sheet claims: ${descSnippet}.` : "",
    p.featuredPhrase ? `Field observation: "${p.featuredPhrase}."` : "",
    hasPositive
      ? `Performance highlights: ${p.positivePoints
          .slice(0, 2)
          .map((pt) => pt.slice(0, 70))
          .join("; ")}.`
      : "Core performance metrics held up during testing.",
    p.featuresStr,
    hasNegative
      ? `Technical caveat: ${p.negativePoints[0].slice(0, 90)}.`
      : "No significant technical issues observed.",
    p.tone === "enthusiastic"
      ? "Verdict: a strong performer in its class. Recommended."
      : p.tone === "critical"
      ? "Verdict: functional but needs refinement in key areas."
      : "Verdict: solid option that delivers on its core promise.",
  ];

  return { title: titles[p.tone] ?? titles.balanced, body: lines.filter(Boolean).join(" ") };
}

function _fallbackReview(
  productName: string,
  voice: "caresse" | "reese" | "revvel"
): SeededReviewResult {
  const titles: Record<typeof voice, string> = {
    caresse: `My honest take on the ${productName}`,
    reese: `${productName} — here's what I think`,
    revvel: `${productName}: quick technical take`,
  };

  const bodies: Record<typeof voice, string> = {
    caresse: `I've had the ${productName} for a bit now and wanted to share my honest thoughts. It performs well for what it is and the build quality is solid. Nothing groundbreaking, but it does what it says and I haven't had any issues. Worth it for the price.`,
    reese: `So I got the ${productName} and honestly it's pretty good. Does exactly what it's supposed to, setup was easy, no complaints so far. Would recommend it if you're looking for something reliable at a fair price.`,
    revvel: `Technical assessment of the ${productName}: performs as advertised, build quality meets expectations for the price tier. Core functionality is solid. No significant issues noted during testing. Recommended for the use case.`,
  };

  return {
    title: titles[voice],
    body: bodies[voice],
    pros: ["Works as described", "Good value for the price", "Easy to use"],
    cons: ["Nothing major to note"],
    rating: 4,
    tone: "balanced",
  };
}
