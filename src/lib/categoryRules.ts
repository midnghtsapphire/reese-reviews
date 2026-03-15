// ============================================================
// CATEGORY RULES ENGINE
// Auto-maps Amazon product categories to Reese Reviews site
// categories using keyword rules, ASIN patterns, Amazon
// category strings, and user-defined custom rules.
// ============================================================

const RULES_STORAGE_KEY = "reese-category-rules";

// ─── SITE CATEGORIES (expanded from reviewStore) ────────────

export type SiteCategory =
  | "tech"
  | "food-restaurants"
  | "products"
  | "entertainment"
  | "services"
  | "home-garden"
  | "beauty-health"
  | "automotive"
  | "books-media"
  | "sports-outdoors";

export interface SiteCategoryMeta {
  value: SiteCategory;
  label: string;
  icon: string;
  description: string;
}

export const SITE_CATEGORIES: SiteCategoryMeta[] = [
  { value: "tech", label: "Tech", icon: "💻", description: "Phones, laptops, software, smart devices, cables, and accessories" },
  { value: "food-restaurants", label: "Food & Restaurants", icon: "🍽️", description: "Kitchen gadgets, food products, restaurant visits, snacks" },
  { value: "products", label: "Products", icon: "📦", description: "General consumer products, home goods, everyday items" },
  { value: "entertainment", label: "Entertainment", icon: "🎬", description: "Movies, shows, games, books, music, and live events" },
  { value: "services", label: "Services", icon: "🛠️", description: "Subscriptions, apps, customer service, SaaS" },
  { value: "home-garden", label: "Home & Garden", icon: "🏡", description: "Furniture, decor, garden tools, outdoor living" },
  { value: "beauty-health", label: "Beauty & Health", icon: "💄", description: "Skincare, makeup, supplements, wellness, fitness" },
  { value: "automotive", label: "Automotive", icon: "🚗", description: "Car accessories, tools, detailing, parts" },
  { value: "books-media", label: "Books & Media", icon: "📚", description: "Books, e-readers, audiobooks, magazines, media players" },
  { value: "sports-outdoors", label: "Sports & Outdoors", icon: "⚽", description: "Sports gear, camping, hiking, fitness equipment" },
];

// ─── CONFIDENCE LEVELS ──────────────────────────────────────

export type ConfidenceLevel = "high" | "medium" | "low";

export interface CategoryMatch {
  category: SiteCategory;
  confidence: ConfidenceLevel;
  matchedRule: string;
  score: number; // 0-100
}

// ─── RULE TYPES ─────────────────────────────────────────────

export type RuleType = "keyword" | "amazon-category" | "asin-prefix" | "custom";

export interface CategoryRule {
  id: string;
  type: RuleType;
  pattern: string; // keyword, category string, or ASIN prefix
  targetCategory: SiteCategory;
  priority: number; // higher = checked first
  enabled: boolean;
  createdAt: string;
}

// ─── DEFAULT KEYWORD RULES ──────────────────────────────────

const DEFAULT_KEYWORD_RULES: Omit<CategoryRule, "id" | "createdAt">[] = [
  // Tech
  { type: "keyword", pattern: "phone", targetCategory: "tech", priority: 90, enabled: true },
  { type: "keyword", pattern: "laptop", targetCategory: "tech", priority: 90, enabled: true },
  { type: "keyword", pattern: "tablet", targetCategory: "tech", priority: 90, enabled: true },
  { type: "keyword", pattern: "computer", targetCategory: "tech", priority: 90, enabled: true },
  { type: "keyword", pattern: "monitor", targetCategory: "tech", priority: 85, enabled: true },
  { type: "keyword", pattern: "keyboard", targetCategory: "tech", priority: 85, enabled: true },
  { type: "keyword", pattern: "mouse", targetCategory: "tech", priority: 80, enabled: true },
  { type: "keyword", pattern: "headphone", targetCategory: "tech", priority: 90, enabled: true },
  { type: "keyword", pattern: "earbuds", targetCategory: "tech", priority: 90, enabled: true },
  { type: "keyword", pattern: "earbud", targetCategory: "tech", priority: 90, enabled: true },
  { type: "keyword", pattern: "wireless", targetCategory: "tech", priority: 60, enabled: true },
  { type: "keyword", pattern: "bluetooth", targetCategory: "tech", priority: 75, enabled: true },
  { type: "keyword", pattern: "usb", targetCategory: "tech", priority: 75, enabled: true },
  { type: "keyword", pattern: "usb-c", targetCategory: "tech", priority: 80, enabled: true },
  { type: "keyword", pattern: "charger", targetCategory: "tech", priority: 75, enabled: true },
  { type: "keyword", pattern: "charging", targetCategory: "tech", priority: 70, enabled: true },
  { type: "keyword", pattern: "cable", targetCategory: "tech", priority: 70, enabled: true },
  { type: "keyword", pattern: "hub", targetCategory: "tech", priority: 70, enabled: true },
  { type: "keyword", pattern: "adapter", targetCategory: "tech", priority: 70, enabled: true },
  { type: "keyword", pattern: "ssd", targetCategory: "tech", priority: 90, enabled: true },
  { type: "keyword", pattern: "hard drive", targetCategory: "tech", priority: 90, enabled: true },
  { type: "keyword", pattern: "speaker", targetCategory: "tech", priority: 80, enabled: true },
  { type: "keyword", pattern: "smart home", targetCategory: "tech", priority: 85, enabled: true },
  { type: "keyword", pattern: "alexa", targetCategory: "tech", priority: 85, enabled: true },
  { type: "keyword", pattern: "echo", targetCategory: "tech", priority: 75, enabled: true },
  { type: "keyword", pattern: "ring doorbell", targetCategory: "tech", priority: 90, enabled: true },
  { type: "keyword", pattern: "doorbell", targetCategory: "tech", priority: 80, enabled: true },
  { type: "keyword", pattern: "camera", targetCategory: "tech", priority: 75, enabled: true },
  { type: "keyword", pattern: "webcam", targetCategory: "tech", priority: 85, enabled: true },
  { type: "keyword", pattern: "router", targetCategory: "tech", priority: 85, enabled: true },
  { type: "keyword", pattern: "wifi", targetCategory: "tech", priority: 70, enabled: true },
  { type: "keyword", pattern: "printer", targetCategory: "tech", priority: 80, enabled: true },
  { type: "keyword", pattern: "projector", targetCategory: "tech", priority: 80, enabled: true },
  { type: "keyword", pattern: "drone", targetCategory: "tech", priority: 85, enabled: true },
  { type: "keyword", pattern: "smartwatch", targetCategory: "tech", priority: 90, enabled: true },
  { type: "keyword", pattern: "watch", targetCategory: "tech", priority: 40, enabled: true },
  { type: "keyword", pattern: "power bank", targetCategory: "tech", priority: 85, enabled: true },
  { type: "keyword", pattern: "anker", targetCategory: "tech", priority: 70, enabled: true },

  // Food & Restaurants
  { type: "keyword", pattern: "kitchen", targetCategory: "food-restaurants", priority: 70, enabled: true },
  { type: "keyword", pattern: "blender", targetCategory: "food-restaurants", priority: 80, enabled: true },
  { type: "keyword", pattern: "air fryer", targetCategory: "food-restaurants", priority: 85, enabled: true },
  { type: "keyword", pattern: "instant pot", targetCategory: "food-restaurants", priority: 85, enabled: true },
  { type: "keyword", pattern: "coffee maker", targetCategory: "food-restaurants", priority: 85, enabled: true },
  { type: "keyword", pattern: "coffee", targetCategory: "food-restaurants", priority: 60, enabled: true },
  { type: "keyword", pattern: "ice cream", targetCategory: "food-restaurants", priority: 80, enabled: true },
  { type: "keyword", pattern: "creami", targetCategory: "food-restaurants", priority: 85, enabled: true },
  { type: "keyword", pattern: "ninja", targetCategory: "food-restaurants", priority: 60, enabled: true },
  { type: "keyword", pattern: "cookware", targetCategory: "food-restaurants", priority: 80, enabled: true },
  { type: "keyword", pattern: "pan", targetCategory: "food-restaurants", priority: 50, enabled: true },
  { type: "keyword", pattern: "pot", targetCategory: "food-restaurants", priority: 50, enabled: true },
  { type: "keyword", pattern: "knife", targetCategory: "food-restaurants", priority: 60, enabled: true },
  { type: "keyword", pattern: "food", targetCategory: "food-restaurants", priority: 70, enabled: true },
  { type: "keyword", pattern: "snack", targetCategory: "food-restaurants", priority: 75, enabled: true },
  { type: "keyword", pattern: "grill", targetCategory: "food-restaurants", priority: 75, enabled: true },
  { type: "keyword", pattern: "oven", targetCategory: "food-restaurants", priority: 70, enabled: true },
  { type: "keyword", pattern: "microwave", targetCategory: "food-restaurants", priority: 75, enabled: true },
  { type: "keyword", pattern: "toaster", targetCategory: "food-restaurants", priority: 80, enabled: true },

  // Home & Garden
  { type: "keyword", pattern: "furniture", targetCategory: "home-garden", priority: 85, enabled: true },
  { type: "keyword", pattern: "desk", targetCategory: "home-garden", priority: 75, enabled: true },
  { type: "keyword", pattern: "standing desk", targetCategory: "home-garden", priority: 80, enabled: true },
  { type: "keyword", pattern: "chair", targetCategory: "home-garden", priority: 75, enabled: true },
  { type: "keyword", pattern: "lamp", targetCategory: "home-garden", priority: 75, enabled: true },
  { type: "keyword", pattern: "light", targetCategory: "home-garden", priority: 50, enabled: true },
  { type: "keyword", pattern: "curtain", targetCategory: "home-garden", priority: 80, enabled: true },
  { type: "keyword", pattern: "rug", targetCategory: "home-garden", priority: 80, enabled: true },
  { type: "keyword", pattern: "pillow", targetCategory: "home-garden", priority: 75, enabled: true },
  { type: "keyword", pattern: "bedding", targetCategory: "home-garden", priority: 80, enabled: true },
  { type: "keyword", pattern: "mattress", targetCategory: "home-garden", priority: 85, enabled: true },
  { type: "keyword", pattern: "garden", targetCategory: "home-garden", priority: 80, enabled: true },
  { type: "keyword", pattern: "plant", targetCategory: "home-garden", priority: 70, enabled: true },
  { type: "keyword", pattern: "vacuum", targetCategory: "home-garden", priority: 80, enabled: true },
  { type: "keyword", pattern: "cleaning", targetCategory: "home-garden", priority: 65, enabled: true },
  { type: "keyword", pattern: "organizer", targetCategory: "home-garden", priority: 70, enabled: true },
  { type: "keyword", pattern: "storage", targetCategory: "home-garden", priority: 65, enabled: true },
  { type: "keyword", pattern: "shelf", targetCategory: "home-garden", priority: 75, enabled: true },
  { type: "keyword", pattern: "decor", targetCategory: "home-garden", priority: 75, enabled: true },

  // Beauty & Health
  { type: "keyword", pattern: "skincare", targetCategory: "beauty-health", priority: 90, enabled: true },
  { type: "keyword", pattern: "moisturizer", targetCategory: "beauty-health", priority: 85, enabled: true },
  { type: "keyword", pattern: "serum", targetCategory: "beauty-health", priority: 85, enabled: true },
  { type: "keyword", pattern: "sunscreen", targetCategory: "beauty-health", priority: 85, enabled: true },
  { type: "keyword", pattern: "makeup", targetCategory: "beauty-health", priority: 90, enabled: true },
  { type: "keyword", pattern: "lipstick", targetCategory: "beauty-health", priority: 85, enabled: true },
  { type: "keyword", pattern: "mascara", targetCategory: "beauty-health", priority: 85, enabled: true },
  { type: "keyword", pattern: "shampoo", targetCategory: "beauty-health", priority: 85, enabled: true },
  { type: "keyword", pattern: "conditioner", targetCategory: "beauty-health", priority: 80, enabled: true },
  { type: "keyword", pattern: "hair", targetCategory: "beauty-health", priority: 60, enabled: true },
  { type: "keyword", pattern: "vitamin", targetCategory: "beauty-health", priority: 80, enabled: true },
  { type: "keyword", pattern: "supplement", targetCategory: "beauty-health", priority: 80, enabled: true },
  { type: "keyword", pattern: "protein", targetCategory: "beauty-health", priority: 65, enabled: true },
  { type: "keyword", pattern: "wellness", targetCategory: "beauty-health", priority: 75, enabled: true },
  { type: "keyword", pattern: "essential oil", targetCategory: "beauty-health", priority: 80, enabled: true },
  { type: "keyword", pattern: "diffuser", targetCategory: "beauty-health", priority: 70, enabled: true },
  { type: "keyword", pattern: "massage", targetCategory: "beauty-health", priority: 75, enabled: true },
  { type: "keyword", pattern: "toothbrush", targetCategory: "beauty-health", priority: 80, enabled: true },

  // Automotive
  { type: "keyword", pattern: "car", targetCategory: "automotive", priority: 60, enabled: true },
  { type: "keyword", pattern: "vehicle", targetCategory: "automotive", priority: 70, enabled: true },
  { type: "keyword", pattern: "dash cam", targetCategory: "automotive", priority: 85, enabled: true },
  { type: "keyword", pattern: "dashcam", targetCategory: "automotive", priority: 85, enabled: true },
  { type: "keyword", pattern: "car mount", targetCategory: "automotive", priority: 85, enabled: true },
  { type: "keyword", pattern: "tire", targetCategory: "automotive", priority: 80, enabled: true },
  { type: "keyword", pattern: "detailing", targetCategory: "automotive", priority: 80, enabled: true },
  { type: "keyword", pattern: "car wash", targetCategory: "automotive", priority: 80, enabled: true },
  { type: "keyword", pattern: "car seat", targetCategory: "automotive", priority: 75, enabled: true },
  { type: "keyword", pattern: "windshield", targetCategory: "automotive", priority: 80, enabled: true },

  // Books & Media
  { type: "keyword", pattern: "kindle", targetCategory: "books-media", priority: 90, enabled: true },
  { type: "keyword", pattern: "paperwhite", targetCategory: "books-media", priority: 90, enabled: true },
  { type: "keyword", pattern: "e-reader", targetCategory: "books-media", priority: 90, enabled: true },
  { type: "keyword", pattern: "book", targetCategory: "books-media", priority: 70, enabled: true },
  { type: "keyword", pattern: "audiobook", targetCategory: "books-media", priority: 85, enabled: true },
  { type: "keyword", pattern: "audible", targetCategory: "books-media", priority: 85, enabled: true },
  { type: "keyword", pattern: "streaming", targetCategory: "books-media", priority: 60, enabled: true },
  { type: "keyword", pattern: "dvd", targetCategory: "books-media", priority: 75, enabled: true },
  { type: "keyword", pattern: "blu-ray", targetCategory: "books-media", priority: 75, enabled: true },

  // Entertainment
  { type: "keyword", pattern: "game", targetCategory: "entertainment", priority: 65, enabled: true },
  { type: "keyword", pattern: "gaming", targetCategory: "entertainment", priority: 80, enabled: true },
  { type: "keyword", pattern: "console", targetCategory: "entertainment", priority: 80, enabled: true },
  { type: "keyword", pattern: "playstation", targetCategory: "entertainment", priority: 85, enabled: true },
  { type: "keyword", pattern: "xbox", targetCategory: "entertainment", priority: 85, enabled: true },
  { type: "keyword", pattern: "nintendo", targetCategory: "entertainment", priority: 85, enabled: true },
  { type: "keyword", pattern: "board game", targetCategory: "entertainment", priority: 85, enabled: true },
  { type: "keyword", pattern: "puzzle", targetCategory: "entertainment", priority: 70, enabled: true },
  { type: "keyword", pattern: "toy", targetCategory: "entertainment", priority: 65, enabled: true },
  { type: "keyword", pattern: "lego", targetCategory: "entertainment", priority: 80, enabled: true },
  { type: "keyword", pattern: "vr", targetCategory: "entertainment", priority: 80, enabled: true },
  { type: "keyword", pattern: "headset", targetCategory: "entertainment", priority: 60, enabled: true },

  // Sports & Outdoors
  { type: "keyword", pattern: "fitness", targetCategory: "sports-outdoors", priority: 80, enabled: true },
  { type: "keyword", pattern: "yoga", targetCategory: "sports-outdoors", priority: 80, enabled: true },
  { type: "keyword", pattern: "dumbbell", targetCategory: "sports-outdoors", priority: 85, enabled: true },
  { type: "keyword", pattern: "weight", targetCategory: "sports-outdoors", priority: 55, enabled: true },
  { type: "keyword", pattern: "treadmill", targetCategory: "sports-outdoors", priority: 90, enabled: true },
  { type: "keyword", pattern: "bike", targetCategory: "sports-outdoors", priority: 75, enabled: true },
  { type: "keyword", pattern: "bicycle", targetCategory: "sports-outdoors", priority: 80, enabled: true },
  { type: "keyword", pattern: "camping", targetCategory: "sports-outdoors", priority: 85, enabled: true },
  { type: "keyword", pattern: "tent", targetCategory: "sports-outdoors", priority: 85, enabled: true },
  { type: "keyword", pattern: "hiking", targetCategory: "sports-outdoors", priority: 85, enabled: true },
  { type: "keyword", pattern: "backpack", targetCategory: "sports-outdoors", priority: 65, enabled: true },
  { type: "keyword", pattern: "water bottle", targetCategory: "sports-outdoors", priority: 60, enabled: true },
  { type: "keyword", pattern: "tumbler", targetCategory: "products", priority: 65, enabled: true },
  { type: "keyword", pattern: "stanley", targetCategory: "products", priority: 60, enabled: true },

  // Services
  { type: "keyword", pattern: "subscription", targetCategory: "services", priority: 80, enabled: true },
  { type: "keyword", pattern: "membership", targetCategory: "services", priority: 80, enabled: true },
  { type: "keyword", pattern: "app", targetCategory: "services", priority: 50, enabled: true },
  { type: "keyword", pattern: "software", targetCategory: "services", priority: 65, enabled: true },
  { type: "keyword", pattern: "saas", targetCategory: "services", priority: 80, enabled: true },
  { type: "keyword", pattern: "warranty", targetCategory: "services", priority: 75, enabled: true },
  { type: "keyword", pattern: "insurance", targetCategory: "services", priority: 80, enabled: true },
];

// ─── DEFAULT AMAZON CATEGORY RULES ──────────────────────────

const DEFAULT_AMAZON_CATEGORY_RULES: Omit<CategoryRule, "id" | "createdAt">[] = [
  { type: "amazon-category", pattern: "electronics", targetCategory: "tech", priority: 80, enabled: true },
  { type: "amazon-category", pattern: "computers", targetCategory: "tech", priority: 85, enabled: true },
  { type: "amazon-category", pattern: "cell phones", targetCategory: "tech", priority: 85, enabled: true },
  { type: "amazon-category", pattern: "camera", targetCategory: "tech", priority: 80, enabled: true },
  { type: "amazon-category", pattern: "home audio", targetCategory: "tech", priority: 80, enabled: true },
  { type: "amazon-category", pattern: "smart home", targetCategory: "tech", priority: 85, enabled: true },
  { type: "amazon-category", pattern: "kitchen", targetCategory: "food-restaurants", priority: 75, enabled: true },
  { type: "amazon-category", pattern: "grocery", targetCategory: "food-restaurants", priority: 90, enabled: true },
  { type: "amazon-category", pattern: "gourmet food", targetCategory: "food-restaurants", priority: 90, enabled: true },
  { type: "amazon-category", pattern: "home", targetCategory: "home-garden", priority: 60, enabled: true },
  { type: "amazon-category", pattern: "garden", targetCategory: "home-garden", priority: 80, enabled: true },
  { type: "amazon-category", pattern: "furniture", targetCategory: "home-garden", priority: 85, enabled: true },
  { type: "amazon-category", pattern: "patio", targetCategory: "home-garden", priority: 80, enabled: true },
  { type: "amazon-category", pattern: "beauty", targetCategory: "beauty-health", priority: 85, enabled: true },
  { type: "amazon-category", pattern: "health", targetCategory: "beauty-health", priority: 80, enabled: true },
  { type: "amazon-category", pattern: "personal care", targetCategory: "beauty-health", priority: 85, enabled: true },
  { type: "amazon-category", pattern: "automotive", targetCategory: "automotive", priority: 90, enabled: true },
  { type: "amazon-category", pattern: "books", targetCategory: "books-media", priority: 90, enabled: true },
  { type: "amazon-category", pattern: "kindle", targetCategory: "books-media", priority: 90, enabled: true },
  { type: "amazon-category", pattern: "movies", targetCategory: "entertainment", priority: 85, enabled: true },
  { type: "amazon-category", pattern: "music", targetCategory: "entertainment", priority: 80, enabled: true },
  { type: "amazon-category", pattern: "video games", targetCategory: "entertainment", priority: 90, enabled: true },
  { type: "amazon-category", pattern: "toys", targetCategory: "entertainment", priority: 75, enabled: true },
  { type: "amazon-category", pattern: "sports", targetCategory: "sports-outdoors", priority: 85, enabled: true },
  { type: "amazon-category", pattern: "outdoors", targetCategory: "sports-outdoors", priority: 85, enabled: true },
  { type: "amazon-category", pattern: "fitness", targetCategory: "sports-outdoors", priority: 85, enabled: true },
  { type: "amazon-category", pattern: "clothing", targetCategory: "products", priority: 60, enabled: true },
  { type: "amazon-category", pattern: "shoes", targetCategory: "products", priority: 60, enabled: true },
  { type: "amazon-category", pattern: "office", targetCategory: "products", priority: 55, enabled: true },
  { type: "amazon-category", pattern: "pet", targetCategory: "products", priority: 60, enabled: true },
  { type: "amazon-category", pattern: "baby", targetCategory: "products", priority: 60, enabled: true },
  { type: "amazon-category", pattern: "tools", targetCategory: "home-garden", priority: 70, enabled: true },
  { type: "amazon-category", pattern: "industrial", targetCategory: "products", priority: 50, enabled: true },
  { type: "amazon-category", pattern: "software", targetCategory: "services", priority: 80, enabled: true },
  { type: "amazon-category", pattern: "subscription", targetCategory: "services", priority: 85, enabled: true },
  { type: "amazon-category", pattern: "tech", targetCategory: "tech", priority: 85, enabled: true },
  { type: "amazon-category", pattern: "food-restaurants", targetCategory: "food-restaurants", priority: 85, enabled: true },
  { type: "amazon-category", pattern: "entertainment", targetCategory: "entertainment", priority: 85, enabled: true },
  { type: "amazon-category", pattern: "services", targetCategory: "services", priority: 85, enabled: true },
  { type: "amazon-category", pattern: "products", targetCategory: "products", priority: 50, enabled: true },
];

// ─── STORAGE ────────────────────────────────────────────────

function generateRuleId(): string {
  return `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildDefaultRules(): CategoryRule[] {
  const now = new Date().toISOString();
  const allDefaults = [...DEFAULT_KEYWORD_RULES, ...DEFAULT_AMAZON_CATEGORY_RULES];
  return allDefaults.map((r, idx) => ({
    ...r,
    id: `default-${r.type}-${idx}`,
    createdAt: now,
  }));
}

export function getCategoryRules(): CategoryRule[] {
  try {
    const stored = localStorage.getItem(RULES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as CategoryRule[];
      if (parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  const defaults = buildDefaultRules();
  saveCategoryRules(defaults);
  return defaults;
}

export function saveCategoryRules(rules: CategoryRule[]): void {
  localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules));
}

export function addCategoryRule(rule: Omit<CategoryRule, "id" | "createdAt">): CategoryRule {
  const newRule: CategoryRule = {
    ...rule,
    id: generateRuleId(),
    createdAt: new Date().toISOString(),
  };
  const rules = getCategoryRules();
  rules.push(newRule);
  saveCategoryRules(rules);
  return newRule;
}

export function updateCategoryRule(ruleId: string, updates: Partial<CategoryRule>): void {
  const rules = getCategoryRules();
  const idx = rules.findIndex((r) => r.id === ruleId);
  if (idx !== -1) {
    rules[idx] = { ...rules[idx], ...updates };
    saveCategoryRules(rules);
  }
}

export function deleteCategoryRule(ruleId: string): void {
  const rules = getCategoryRules().filter((r) => r.id !== ruleId);
  saveCategoryRules(rules);
}

export function resetToDefaultRules(): CategoryRule[] {
  const defaults = buildDefaultRules();
  saveCategoryRules(defaults);
  return defaults;
}

// ─── MATCHING ENGINE ────────────────────────────────────────

/**
 * Auto-categorize a product based on its name, ASIN, and Amazon category.
 * Returns all matches sorted by score, with the best match first.
 */
export function categorizeProduct(
  productName: string,
  asin: string,
  amazonCategory?: string
): CategoryMatch[] {
  const rules = getCategoryRules().filter((r) => r.enabled);
  const matches: CategoryMatch[] = [];
  const nameLower = productName.toLowerCase();
  const asinUpper = asin.toUpperCase();
  const catLower = (amazonCategory ?? "").toLowerCase();

  // Score accumulator per category
  const categoryScores: Record<string, { total: number; rules: string[]; count: number }> = {};

  for (const rule of rules) {
    let matched = false;
    let ruleScore = rule.priority;

    switch (rule.type) {
      case "keyword": {
        const patternLower = rule.pattern.toLowerCase();
        // Check for whole-word-ish match (surrounded by non-alpha or at boundaries)
        const regex = new RegExp(`\\b${escapeRegex(patternLower)}\\b`, "i");
        if (regex.test(nameLower)) {
          matched = true;
          // Boost score if the keyword is a significant portion of the name
          const ratio = patternLower.length / nameLower.length;
          ruleScore = Math.min(100, rule.priority + Math.round(ratio * 20));
        }
        break;
      }
      case "amazon-category": {
        const patternLower = rule.pattern.toLowerCase();
        if (catLower.includes(patternLower)) {
          matched = true;
          ruleScore = rule.priority;
        }
        break;
      }
      case "asin-prefix": {
        if (asinUpper.startsWith(rule.pattern.toUpperCase())) {
          matched = true;
          ruleScore = rule.priority;
        }
        break;
      }
      case "custom": {
        // Custom rules use the pattern as a regex against the product name
        try {
          const customRegex = new RegExp(rule.pattern, "i");
          if (customRegex.test(nameLower)) {
            matched = true;
            ruleScore = rule.priority;
          }
        } catch {
          // Invalid regex, skip
        }
        break;
      }
    }

    if (matched) {
      const cat = rule.targetCategory;
      if (!categoryScores[cat]) {
        categoryScores[cat] = { total: 0, rules: [], count: 0 };
      }
      categoryScores[cat].total += ruleScore;
      categoryScores[cat].rules.push(`${rule.type}: "${rule.pattern}"`);
      categoryScores[cat].count += 1;
    }
  }

  // Convert accumulated scores to matches
  for (const [cat, data] of Object.entries(categoryScores)) {
    // Average score weighted by count (more matching rules = higher confidence)
    const avgScore = data.total / data.count;
    const countBonus = Math.min(20, data.count * 5);
    const finalScore = Math.min(100, Math.round(avgScore + countBonus));

    const confidence: ConfidenceLevel =
      finalScore >= 75 ? "high" : finalScore >= 50 ? "medium" : "low";

    matches.push({
      category: cat as SiteCategory,
      confidence,
      matchedRule: data.rules.join("; "),
      score: finalScore,
    });
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  // If no matches, return "products" as fallback with low confidence
  if (matches.length === 0) {
    matches.push({
      category: "products",
      confidence: "low",
      matchedRule: "fallback: no rules matched",
      score: 10,
    });
  }

  return matches;
}

/**
 * Get the best category match for a product.
 */
export function getBestCategory(
  productName: string,
  asin: string,
  amazonCategory?: string
): CategoryMatch {
  return categorizeProduct(productName, asin, amazonCategory)[0];
}

// ─── HELPERS ────────────────────────────────────────────────

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Get rules grouped by category for display.
 */
export function getRulesGroupedByCategory(): Record<SiteCategory, CategoryRule[]> {
  const rules = getCategoryRules();
  const grouped: Record<string, CategoryRule[]> = {};
  for (const cat of SITE_CATEGORIES) {
    grouped[cat.value] = [];
  }
  for (const rule of rules) {
    if (!grouped[rule.targetCategory]) {
      grouped[rule.targetCategory] = [];
    }
    grouped[rule.targetCategory].push(rule);
  }
  return grouped as Record<SiteCategory, CategoryRule[]>;
}

/**
 * Get user-created custom rules only.
 */
export function getCustomRules(): CategoryRule[] {
  return getCategoryRules().filter((r) => r.type === "custom" || !r.id.startsWith("default-"));
}
