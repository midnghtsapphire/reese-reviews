// ============================================================
// SURPLUS PRICING ENGINE
// Calculates recommended pricing for Vine products after the
// 6-month holding period. Considers category, ETV, condition,
// and market demand to suggest a fair price (up to 50% off).
// ============================================================

export type ProductCondition = "new" | "like_new" | "good" | "fair" | "worn";
export type DemandLevel = "high" | "medium" | "low";

export interface PricingInput {
  etv: number;
  category: string;
  condition: ProductCondition;
  demandLevel: DemandLevel;
  ageMonths: number;
  originalAmazonPrice?: number;
}

export interface PricingResult {
  suggestedPrice: number;
  minPrice: number;
  maxPrice: number;
  discountPercent: number;
  pricePercentOfETV: number;
  reasoning: string;
  rentalPrice: number;
  rentalDepositPercent: number;
}

const CATEGORY_MULTIPLIERS: Record<string, number> = {
  electronics: 0.75,
  clothing: 0.55,
  beauty: 0.50,
  home: 0.65,
  kitchen: 0.60,
  toys: 0.50,
  books: 0.40,
  sports: 0.60,
  automotive: 0.70,
  tools: 0.75,
  health: 0.45,
  baby: 0.50,
  pet: 0.55,
  garden: 0.60,
  office: 0.60,
  food: 0.30,
  jewelry: 0.65,
  musical: 0.70,
  costumes: 0.55,
  other: 0.55,
};

const CONDITION_MULTIPLIERS: Record<ProductCondition, number> = {
  new: 1.0,
  like_new: 0.90,
  good: 0.75,
  fair: 0.55,
  worn: 0.35,
};

const DEMAND_MULTIPLIERS: Record<DemandLevel, number> = {
  high: 1.15,
  medium: 1.0,
  low: 0.80,
};

/**
 * Calculate surplus pricing for a Vine product.
 * Max discount is 50% off ETV (user's rule).
 * Minimum price is 50% of ETV.
 */
export function calculateSurplusPrice(input: PricingInput): PricingResult {
  const { etv, category, condition, demandLevel, ageMonths, originalAmazonPrice } = input;

  const basePrice = originalAmazonPrice || etv;
  const categoryMult = CATEGORY_MULTIPLIERS[category.toLowerCase()] ?? CATEGORY_MULTIPLIERS.other;
  const conditionMult = CONDITION_MULTIPLIERS[condition];
  const demandMult = DEMAND_MULTIPLIERS[demandLevel];

  // Age depreciation: 2% per month after 6 months, capped at 20%
  const extraMonths = Math.max(0, ageMonths - 6);
  const ageDepreciation = Math.min(0.20, extraMonths * 0.02);

  const rawPrice = basePrice * categoryMult * conditionMult * demandMult * (1 - ageDepreciation);

  // Enforce minimum: 50% of ETV (user's max discount rule)
  const minPrice = etv * 0.50;
  const maxPrice = etv * 0.95;
  const suggestedPrice = Math.max(minPrice, Math.min(maxPrice, rawPrice));

  const discountPercent = Math.round((1 - suggestedPrice / etv) * 100);
  const pricePercentOfETV = Math.round((suggestedPrice / etv) * 100);

  // Rental pricing: ~10-15% of suggested price per rental period (1-2 weeks)
  const rentalPrice = Math.max(5, Math.round(suggestedPrice * 0.12 * 100) / 100);
  const rentalDepositPercent = condition === "new" ? 50 : condition === "like_new" ? 40 : 30;

  const reasoning = buildReasoning(category, condition, demandLevel, ageMonths, discountPercent);

  return {
    suggestedPrice: Math.round(suggestedPrice * 100) / 100,
    minPrice: Math.round(minPrice * 100) / 100,
    maxPrice: Math.round(maxPrice * 100) / 100,
    discountPercent,
    pricePercentOfETV,
    reasoning,
    rentalPrice,
    rentalDepositPercent,
  };
}

function buildReasoning(
  category: string,
  condition: ProductCondition,
  demandLevel: DemandLevel,
  ageMonths: number,
  discountPercent: number
): string {
  const parts: string[] = [];

  parts.push(`${category} products typically retain ${Math.round((CATEGORY_MULTIPLIERS[category.toLowerCase()] ?? 0.55) * 100)}% of value`);

  if (condition !== "new") {
    parts.push(`condition "${condition}" applies ${Math.round(CONDITION_MULTIPLIERS[condition] * 100)}% retention`);
  }

  if (demandLevel === "high") {
    parts.push("high demand adds 15% premium");
  } else if (demandLevel === "low") {
    parts.push("low demand reduces price by 20%");
  }

  if (ageMonths > 6) {
    const extra = ageMonths - 6;
    parts.push(`${extra} months past Vine period (${Math.min(20, extra * 2)}% age depreciation)`);
  }

  parts.push(`final discount: ${discountPercent}% off ETV`);

  return parts.join("; ");
}

/**
 * Get recommended listing platforms based on category and price.
 */
export function getRecommendedPlatforms(
  category: string,
  price: number
): Array<{ platform: string; fit: "excellent" | "good" | "fair" }> {
  const platforms: Array<{ platform: string; fit: "excellent" | "good" | "fair" }> = [];

  if (["clothing", "beauty", "jewelry", "costumes"].includes(category.toLowerCase())) {
    platforms.push({ platform: "Poshmark", fit: "excellent" });
    platforms.push({ platform: "Mercari", fit: "excellent" });
  }

  if (price < 50) {
    platforms.push({ platform: "Facebook Marketplace", fit: "excellent" });
    platforms.push({ platform: "OfferUp", fit: "good" });
  }

  if (price >= 20) {
    platforms.push({ platform: "eBay", fit: "good" });
  }

  if (["electronics", "tools", "automotive"].includes(category.toLowerCase())) {
    platforms.push({ platform: "eBay", fit: "excellent" });
    platforms.push({ platform: "Facebook Marketplace", fit: "good" });
  }

  platforms.push({ platform: "Rocky Mountain Rentals", fit: "good" });
  platforms.push({ platform: "Craigslist", fit: "fair" });

  // Deduplicate by platform name
  const seen = new Set<string>();
  return platforms.filter((p) => {
    if (seen.has(p.platform)) return false;
    seen.add(p.platform);
    return true;
  });
}
