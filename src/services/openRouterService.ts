// ============================================================
// OPENROUTER AI SERVICE
// Handles all LLM calls: review generation, product research,
// star rating analysis, video script writing
// ============================================================

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

async function callOpenRouter(messages: ChatMessage[], model = "google/gemini-2.5-flash-preview"): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key not configured. Set VITE_OPENROUTER_API_KEY in .env");
  }

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://reesereviews.com",
      "X-Title": "Reese Reviews",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.8,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${err}`);
  }

  const data: OpenRouterResponse = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// ─── REVIEW GENERATION ──────────────────────────────────────
export interface GeneratedReviewData {
  title: string;
  body: string;
  rating: number;
  ratingJustification: string;
  pros: string[];
  cons: string[];
}

export async function generateReview(
  productName: string,
  asin: string,
  category: string,
  scrapedContext: string
): Promise<GeneratedReviewData> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a casual Amazon product reviewer. Write reviews that sound natural, authentic, and like a real person wrote them — NOT formal or robotic. Use first person, include personal anecdotes, mention specific details about using the product. Be conversational. Include both positives and negatives for authenticity.

IMPORTANT: Always include this disclosure naturally at the end: "I received this product free through Amazon Vine and am providing my honest opinion."

Respond in VALID JSON only with this exact structure:
{
  "title": "catchy informal title",
  "body": "the full review text (3-5 paragraphs, casual tone)",
  "rating": 4.5,
  "ratingJustification": "why this rating",
  "pros": ["pro 1", "pro 2", "pro 3"],
  "cons": ["con 1", "con 2"]
}`,
    },
    {
      role: "user",
      content: `Write a review for: ${productName} (ASIN: ${asin}, Category: ${category})

Context from existing reviews and research:
${scrapedContext || "No existing reviews found — write based on the product name and category."}

Make it sound like a real person who actually used this product. Be specific about features, include a personal story about using it, and give honest pros and cons.`,
    },
  ];

  const raw = await callOpenRouter(messages);
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const data = JSON.parse(cleaned);
    return {
      title: data.title || `My honest take on ${productName}`,
      body: data.body || "",
      rating: Math.round((data.rating || 4) * 2) / 2, // Round to nearest 0.5
      ratingJustification: data.ratingJustification || "",
      pros: data.pros || [],
      cons: data.cons || [],
    };
  } catch {
    // Fallback: extract what we can
    return {
      title: `My honest take on ${productName}`,
      body: raw,
      rating: 4,
      ratingJustification: "Based on overall product quality",
      pros: ["Good quality", "Works as described"],
      cons: ["Could be improved"],
    };
  }
}

// ─── STAR RATING ALGORITHM ──────────────────────────────────
export interface RatingAnalysis {
  calculatedRating: number;
  confidence: number;
  sentimentScore: number;
  breakdown: {
    amazonAvg: number;
    sentimentAdj: number;
    recencyBias: number;
    finalRating: number;
  };
}

export function calculateStarRating(
  scrapedReviews: Array<{ rating: number; text: string; date: string; helpful: number }>
): RatingAnalysis {
  if (!scrapedReviews.length) {
    return {
      calculatedRating: 4,
      confidence: 0.3,
      sentimentScore: 0.5,
      breakdown: { amazonAvg: 0, sentimentAdj: 0, recencyBias: 0, finalRating: 4 },
    };
  }

  // Weighted average (more helpful reviews count more)
  let totalWeight = 0;
  let weightedSum = 0;
  for (const r of scrapedReviews) {
    const weight = 1 + (r.helpful || 0) * 0.1;
    weightedSum += r.rating * weight;
    totalWeight += weight;
  }
  const amazonAvg = totalWeight > 0 ? weightedSum / totalWeight : 4;

  // Sentiment analysis (simple keyword-based)
  const positiveWords = ["love", "great", "amazing", "excellent", "perfect", "best", "fantastic", "wonderful", "awesome", "recommend"];
  const negativeWords = ["terrible", "awful", "worst", "broken", "waste", "horrible", "disappointing", "cheap", "useless", "defective"];

  let posCount = 0;
  let negCount = 0;
  for (const r of scrapedReviews) {
    const lower = r.text.toLowerCase();
    for (const w of positiveWords) if (lower.includes(w)) posCount++;
    for (const w of negativeWords) if (lower.includes(w)) negCount++;
  }
  const totalSentiment = posCount + negCount || 1;
  const sentimentScore = (posCount - negCount) / totalSentiment; // -1 to 1
  const sentimentAdj = sentimentScore * 0.5; // Max ±0.5 adjustment

  // Recency bias (recent reviews weighted slightly more)
  const now = Date.now();
  let recentSum = 0;
  let recentCount = 0;
  for (const r of scrapedReviews) {
    const age = (now - new Date(r.date).getTime()) / 86400000;
    if (age < 90) {
      recentSum += r.rating;
      recentCount++;
    }
  }
  const recencyBias = recentCount > 0 ? (recentSum / recentCount - amazonAvg) * 0.2 : 0;

  // Final calculation
  let finalRating = amazonAvg + sentimentAdj + recencyBias;
  finalRating = Math.max(1, Math.min(5, finalRating));
  finalRating = Math.round(finalRating * 2) / 2; // Round to nearest 0.5

  const confidence = Math.min(1, scrapedReviews.length / 20);

  return {
    calculatedRating: finalRating,
    confidence,
    sentimentScore,
    breakdown: {
      amazonAvg: Math.round(amazonAvg * 100) / 100,
      sentimentAdj: Math.round(sentimentAdj * 100) / 100,
      recencyBias: Math.round(recencyBias * 100) / 100,
      finalRating,
    },
  };
}

// ─── PRODUCT RESEARCH ───────────────────────────────────────
export async function researchProduct(productName: string, asin: string): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a product research assistant. Given a product name and ASIN, provide a comprehensive summary of what people think about this product. Include common praise, common complaints, typical use cases, and any notable features or issues. Be factual and concise. Format as plain text paragraphs.`,
    },
    {
      role: "user",
      content: `Research this product: "${productName}" (ASIN: ${asin}). Summarize what reviewers typically say about it — the good, the bad, and the notable features. Include typical star ratings and common themes from reviews.`,
    },
  ];

  return callOpenRouter(messages);
}

// ─── VIDEO SCRIPT GENERATION ────────────────────────────────
export async function generateVideoScript(
  productName: string,
  reviewBody: string,
  rating: number,
  pros: string[],
  cons: string[],
  preset?: { label: string; seconds: number; minSlides: number; wordsPerSlide: number; multiSection: boolean }
): Promise<string> {
  const targetSeconds = preset?.seconds ?? 60;
  const multiSection = preset?.multiSection ?? false;
  const approxWords = Math.round(targetSeconds * 2.5); // ~150 words/min speaking pace

  const systemPrompt = multiSection
    ? `You are a professional video content creator. Write a detailed, structured video script for a ${preset?.label ?? "1 minute"} review video (~${approxWords} words when spoken). The script must:
- Have clearly labeled sections separated by double newlines (Introduction, Unboxing, Design, Features, Performance, Pros, Cons, Verdict)
- Start each section with a natural transition phrase
- Include [SHOW PRODUCT] markers at key visual moments
- Sound like a real person talking, not a formal script
- Cover the product thoroughly with specific details
- End with a clear recommendation and star rating
- Target approximately ${approxWords} words total`
    : `You are a casual video reviewer. Write a natural-sounding video review script (~${approxWords} words, about ${preset?.label ?? "1 minute"} when spoken). The script should:
- Start with a hook/greeting
- Mention the product naturally
- Hit the key pros and cons
- Give the star rating
- End with a recommendation
- Sound like a real person talking to camera, NOT a script
- Include [SHOW PRODUCT] markers where product images should appear
- Target approximately ${approxWords} words`;

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: `Write a ${preset?.label ?? "1 minute"} video script for reviewing "${productName}" (${rating} stars).

Review highlights: ${reviewBody.slice(0, multiSection ? 2000 : 500)}

Pros: ${pros.join(", ")}
Cons: ${cons.join(", ")}`,
    },
  ];

  return callOpenRouter(messages);
}

// ─── BULK RESEARCH (simulated web scraping via LLM) ─────────
export async function scrapeProductReviews(
  productName: string,
  asin: string
): Promise<{
  reviews: Array<{ source: string; rating: number; text: string; date: string; helpful: number }>;
  commonPros: string[];
  commonCons: string[];
  averageRating: number;
}> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a product review aggregator. Given a product, generate realistic review data that represents what actual reviewers would say. Return VALID JSON only:
{
  "reviews": [
    {"source": "Amazon", "rating": 5, "text": "review text", "date": "2026-01-15", "helpful": 12},
    {"source": "Reddit", "rating": 4, "text": "review text", "date": "2026-02-01", "helpful": 5}
  ],
  "commonPros": ["pro1", "pro2", "pro3"],
  "commonCons": ["con1", "con2"],
  "averageRating": 4.2
}
Generate 5-8 diverse reviews from different sources (Amazon, Reddit, YouTube comments, blogs).`,
    },
    {
      role: "user",
      content: `Aggregate reviews for: "${productName}" (ASIN: ${asin}). Generate realistic review data from multiple sources.`,
    },
  ];

  const raw = await callOpenRouter(messages);
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      reviews: [],
      commonPros: ["Good quality"],
      commonCons: ["Could be improved"],
      averageRating: 4.0,
    };
  }
}

export { callOpenRouter };
