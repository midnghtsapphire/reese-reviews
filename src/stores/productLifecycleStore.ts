// ============================================================
// PRODUCT LIFECYCLE STORE
// Reese Reviews — Freedom Angel Corps / Rocky Mountain Rentals
// Tracks products from Amazon order through resale/rental
// All Rights Reserved — Audrey Evans / GlowStar Labs
// ============================================================

const STORAGE_KEY = "reese-product-lifecycle";

// ─── STAGE TYPES ─────────────────────────────────────────────

export type LifecycleStage =
  | "ORDERED"
  | "SHIPPED"
  | "RECEIVED"
  | "REVIEWED"
  | "TRANSFERRED"
  | "LISTED"
  | "SOLD";

export const LIFECYCLE_STAGES: LifecycleStage[] = [
  "ORDERED",
  "SHIPPED",
  "RECEIVED",
  "REVIEWED",
  "TRANSFERRED",
  "LISTED",
  "SOLD",
];

export const STAGE_LABELS: Record<LifecycleStage, string> = {
  ORDERED: "Ordered",
  SHIPPED: "Shipped",
  RECEIVED: "Received",
  REVIEWED: "Reviewed",
  TRANSFERRED: "Transferred",
  LISTED: "Listed",
  SOLD: "Sold",
};

export const STAGE_COLORS: Record<LifecycleStage, string> = {
  ORDERED: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  SHIPPED: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  RECEIVED: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  REVIEWED: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  TRANSFERRED: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  LISTED: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  SOLD: "bg-green-500/20 text-green-300 border-green-500/40",
};

// Brand colors
export const BRAND = {
  hailstormAmber: "#FF6B2B",
  revvelGold: "#FFB347",
  clawCrimson: "#E63946",
  stormVolt: "#FFD93D",
};

// ─── MARKETPLACE PLATFORMS ───────────────────────────────────

export type MarketplacePlatform =
  | "facebook_marketplace"
  | "craigslist"
  | "offerup"
  | "ebay"
  | "poshmark"
  | "mercari"
  | "letgo"
  | "nextdoor"
  | "instagram"
  | "other";

export const PLATFORM_LABELS: Record<MarketplacePlatform, string> = {
  facebook_marketplace: "Facebook Marketplace",
  craigslist: "Craigslist",
  offerup: "OfferUp",
  ebay: "eBay",
  poshmark: "Poshmark",
  mercari: "Mercari",
  letgo: "Letgo",
  nextdoor: "Nextdoor",
  instagram: "Instagram",
  other: "Other",
};

export const DEFAULT_LISTING_PLATFORMS: MarketplacePlatform[] = [
  "facebook_marketplace",
  "craigslist",
  "offerup",
];

export type ListingStatus = "pending" | "active" | "paused" | "sold" | "expired";

export interface PlatformListing {
  platform: MarketplacePlatform;
  status: ListingStatus;
  listing_url?: string;
  listed_date?: string;
  listing_price: number;
  views?: number;
  inquiries?: number;
  notes?: string;
}

// ─── PAYMENT METHODS ─────────────────────────────────────────

export type PaymentMethod =
  | "cash"
  | "venmo"
  | "zelle"
  | "paypal"
  | "cashapp"
  | "apple_pay"
  | "google_pay"
  | "check"
  | "bank_transfer"
  | "credit_card"
  | "other";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  venmo: "Venmo",
  zelle: "Zelle",
  paypal: "PayPal",
  cashapp: "Cash App",
  apple_pay: "Apple Pay",
  google_pay: "Google Pay",
  check: "Check",
  bank_transfer: "Bank Transfer",
  credit_card: "Credit Card",
  other: "Other",
};

// ─── SALE PLATFORMS ──────────────────────────────────────────

export type SalePlatform =
  | "facebook_marketplace"
  | "craigslist"
  | "offerup"
  | "ebay"
  | "poshmark"
  | "mercari"
  | "instagram"
  | "in_person"
  | "boutique"
  | "rocky_mountain_rentals"
  | "other";

export const SALE_PLATFORM_LABELS: Record<SalePlatform, string> = {
  facebook_marketplace: "Facebook Marketplace",
  craigslist: "Craigslist",
  offerup: "OfferUp",
  ebay: "eBay",
  poshmark: "Poshmark",
  mercari: "Mercari",
  instagram: "Instagram",
  in_person: "In-Person",
  boutique: "Boutique",
  rocky_mountain_rentals: "Rocky Mountain Rentals",
  other: "Other",
};

// ─── BUYER / RENTER INFO ─────────────────────────────────────

export type TransactionType = "sale" | "rental";

export type ReturnStatus = "not_returned" | "returned_good" | "returned_damaged" | "overdue";

export interface BuyerRenterInfo {
  transaction_type: TransactionType;
  // Contact
  full_name: string;
  phone_number: string;
  social_media_handle: string;       // e.g. @username or profile URL
  social_media_platform: string;     // Instagram, Facebook, etc.
  // Transaction
  amount_paid: number;
  payment_method: PaymentMethod;
  payment_reference?: string;        // Venmo transaction ID, check number, etc.
  transaction_date: string;
  sale_platform: SalePlatform;
  shipping_or_pickup: "shipping" | "pickup" | "delivery";
  tracking_number_out?: string;
  notes?: string;
  // Rental-only fields
  rental_start_date?: string;
  rental_end_date?: string;
  deposit_amount?: number;
  deposit_returned?: boolean;
  return_status?: ReturnStatus;
  condition_on_return?: string;
  rental_company?: string;           // e.g. Rocky Mountain Rentals
}

// ─── STAGE DATA INTERFACES ───────────────────────────────────

export interface StageOrdered {
  asin: string;
  product_name: string;
  order_date: string;
  order_id: string;
  price_paid: number;
  product_images: string[];          // URLs or base64
  description: string;
  ein_registered: boolean;           // Freedom Angel Corps EIN
}

export interface StageShipped {
  carrier: string;
  tracking_number: string;
  estimated_delivery: string;
  shipped_date?: string;
}

export interface StageReceived {
  date_received: string;
  condition_notes: string;
  photos: string[];
}

export interface StageReviewed {
  review_link: string;
  review_status: "draft" | "posted" | "pending";
  review_date?: string;
  review_platform?: string;
  reviewer_notes?: string;
}

export interface StageTransferred {
  transfer_date: string;
  fair_market_value: number;
  transfer_document_ref: string;
  recipient: string;                 // Rocky Mountain Rentals
  transfer_type: "capital_income" | "donation" | "loan";
  notes?: string;
}

export interface StageListed {
  listing_price: number;
  discount_percentage: number;       // Default 30%, editable
  platforms: PlatformListing[];
  listed_date: string;
  listing_title?: string;
  listing_description?: string;
  listing_photos: string[];
}

export interface StageSold {
  buyer_renter: BuyerRenterInfo;
}

// ─── MAIN PRODUCT RECORD ─────────────────────────────────────

export interface ProductLifecycle {
  id: string;
  current_stage: LifecycleStage;
  created_at: string;
  updated_at: string;
  // Stage data — each is optional until that stage is reached
  ordered?: StageOrdered;
  shipped?: StageShipped;
  received?: StageReceived;
  reviewed?: StageReviewed;
  transferred?: StageTransferred;
  listed?: StageListed;
  sold?: StageSold;
  // Meta
  tags: string[];
  is_archived: boolean;
  internal_notes: string;
}

// ─── DEMO DATA ───────────────────────────────────────────────

export const DEMO_PRODUCTS: ProductLifecycle[] = [
  {
    id: "plc-001",
    current_stage: "LISTED",
    created_at: "2026-01-10T10:00:00Z",
    updated_at: "2026-03-01T14:30:00Z",
    ordered: {
      asin: "B09G9FPHY6",
      product_name: "Ninja Creami Ice Cream Maker",
      order_date: "2026-01-10",
      order_id: "113-4567890-1234567",
      price_paid: 199.99,
      product_images: [],
      description: "7-in-1 ice cream, sorbet, milkshake and frozen drink maker",
      ein_registered: true,
    },
    shipped: {
      carrier: "UPS",
      tracking_number: "1Z999AA10123456784",
      estimated_delivery: "2026-01-15",
      shipped_date: "2026-01-11",
    },
    received: {
      date_received: "2026-01-14",
      condition_notes: "Arrived in perfect condition, all accessories included.",
      photos: [],
    },
    reviewed: {
      review_link: "https://www.amazon.com/review/R1234567890",
      review_status: "posted",
      review_date: "2026-01-28",
      review_platform: "Amazon",
    },
    transferred: {
      transfer_date: "2026-02-01",
      fair_market_value: 175.00,
      transfer_document_ref: "RMR-CAP-2026-001",
      recipient: "Rocky Mountain Rentals",
      transfer_type: "capital_income",
    },
    listed: {
      listing_price: 139.99,
      discount_percentage: 30,
      platforms: [
        { platform: "facebook_marketplace", status: "active", listed_date: "2026-02-05", listing_price: 139.99 },
        { platform: "craigslist", status: "active", listed_date: "2026-02-05", listing_price: 139.99 },
        { platform: "offerup", status: "active", listed_date: "2026-02-05", listing_price: 139.99 },
      ],
      listed_date: "2026-02-05",
      listing_title: "Ninja Creami Ice Cream Maker — Like New",
      listing_description: "Barely used, all accessories included. Works perfectly.",
      listing_photos: [],
    },
    tags: ["kitchen", "appliance"],
    is_archived: false,
    internal_notes: "High demand item — price firm.",
  },
  {
    id: "plc-002",
    current_stage: "SOLD",
    created_at: "2025-11-20T09:00:00Z",
    updated_at: "2026-02-15T16:00:00Z",
    ordered: {
      asin: "B08N5WRWNW",
      product_name: "Ring Video Doorbell 4",
      order_date: "2025-11-20",
      order_id: "113-9876543-7654321",
      price_paid: 149.99,
      product_images: [],
      description: "Smart video doorbell with color pre-roll and dual-band wifi",
      ein_registered: true,
    },
    shipped: {
      carrier: "USPS",
      tracking_number: "9400111899223456789012",
      estimated_delivery: "2025-11-26",
      shipped_date: "2025-11-21",
    },
    received: {
      date_received: "2025-11-25",
      condition_notes: "Good condition, minor box damage.",
      photos: [],
    },
    reviewed: {
      review_link: "https://www.amazon.com/review/R9876543210",
      review_status: "posted",
      review_date: "2025-12-10",
    },
    transferred: {
      transfer_date: "2025-12-15",
      fair_market_value: 120.00,
      transfer_document_ref: "RMR-CAP-2025-047",
      recipient: "Rocky Mountain Rentals",
      transfer_type: "capital_income",
    },
    listed: {
      listing_price: 104.99,
      discount_percentage: 30,
      platforms: [
        { platform: "facebook_marketplace", status: "sold", listed_date: "2025-12-20", listing_price: 104.99 },
        { platform: "craigslist", status: "expired", listed_date: "2025-12-20", listing_price: 104.99 },
        { platform: "offerup", status: "paused", listed_date: "2025-12-20", listing_price: 104.99 },
      ],
      listed_date: "2025-12-20",
      listing_photos: [],
    },
    sold: {
      buyer_renter: {
        transaction_type: "sale",
        full_name: "Jessica M.",
        phone_number: "720-555-0192",
        social_media_handle: "@jessica.m.home",
        social_media_platform: "Facebook",
        amount_paid: 100.00,
        payment_method: "venmo",
        payment_reference: "@jessica-m-venmo",
        transaction_date: "2026-02-10",
        sale_platform: "facebook_marketplace",
        shipping_or_pickup: "pickup",
        notes: "Buyer picked up at Starbucks on Colfax.",
      },
    },
    tags: ["smart home", "security"],
    is_archived: false,
    internal_notes: "",
  },
  {
    id: "plc-003",
    current_stage: "RECEIVED",
    created_at: "2026-03-01T08:00:00Z",
    updated_at: "2026-03-10T11:00:00Z",
    ordered: {
      asin: "B0BDHD4GQD",
      product_name: "Anker 737 Power Bank 24000mAh",
      order_date: "2026-03-01",
      order_id: "113-1122334-4455667",
      price_paid: 89.99,
      product_images: [],
      description: "140W portable charger with smart display",
      ein_registered: true,
    },
    shipped: {
      carrier: "FedEx",
      tracking_number: "7489023401234567",
      estimated_delivery: "2026-03-07",
      shipped_date: "2026-03-02",
    },
    received: {
      date_received: "2026-03-06",
      condition_notes: "Perfect condition.",
      photos: [],
    },
    tags: ["electronics", "charging"],
    is_archived: false,
    internal_notes: "Needs review before listing.",
  },
];

// ─── STORE FUNCTIONS ─────────────────────────────────────────

export function getProducts(): ProductLifecycle[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as ProductLifecycle[]) : DEMO_PRODUCTS;
  } catch {
    return DEMO_PRODUCTS;
  }
}

export function saveProducts(products: ProductLifecycle[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

export function addProduct(product: Omit<ProductLifecycle, "id" | "created_at" | "updated_at">): ProductLifecycle {
  const products = getProducts();
  const now = new Date().toISOString();
  const newProduct: ProductLifecycle = {
    ...product,
    id: `plc-${Date.now()}`,
    created_at: now,
    updated_at: now,
  };
  saveProducts([newProduct, ...products]);
  return newProduct;
}

export function updateProduct(id: string, updates: Partial<ProductLifecycle>): void {
  const products = getProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx !== -1) {
    products[idx] = {
      ...products[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveProducts(products);
  }
}

export function deleteProduct(id: string): void {
  saveProducts(getProducts().filter((p) => p.id !== id));
}

export function advanceStage(id: string): void {
  const products = getProducts();
  const product = products.find((p) => p.id === id);
  if (!product) return;
  const currentIdx = LIFECYCLE_STAGES.indexOf(product.current_stage);
  if (currentIdx < LIFECYCLE_STAGES.length - 1) {
    updateProduct(id, { current_stage: LIFECYCLE_STAGES[currentIdx + 1] });
  }
}

// ─── FILTERING & SEARCH ──────────────────────────────────────

export function filterProducts(
  products: ProductLifecycle[],
  opts: {
    stage?: LifecycleStage | "ALL";
    search?: string;
    showArchived?: boolean;
  }
): ProductLifecycle[] {
  let result = [...products];

  if (!opts.showArchived) {
    result = result.filter((p) => !p.is_archived);
  }

  if (opts.stage && opts.stage !== "ALL") {
    result = result.filter((p) => p.current_stage === opts.stage);
  }

  if (opts.search && opts.search.trim()) {
    const q = opts.search.toLowerCase();
    result = result.filter((p) => {
      const name = p.ordered?.product_name?.toLowerCase() ?? "";
      const asin = p.ordered?.asin?.toLowerCase() ?? "";
      const orderId = p.ordered?.order_id?.toLowerCase() ?? "";
      const tags = p.tags.join(" ").toLowerCase();
      return name.includes(q) || asin.includes(q) || orderId.includes(q) || tags.includes(q);
    });
  }

  return result;
}

// ─── BULK OPERATIONS ─────────────────────────────────────────

export function bulkArchive(ids: string[]): void {
  const products = getProducts();
  const updated = products.map((p) =>
    ids.includes(p.id) ? { ...p, is_archived: true, updated_at: new Date().toISOString() } : p
  );
  saveProducts(updated);
}

export function bulkDelete(ids: string[]): void {
  saveProducts(getProducts().filter((p) => !ids.includes(p.id)));
}

export function bulkAdvanceStage(ids: string[]): void {
  ids.forEach((id) => advanceStage(id));
}

// ─── CSV EXPORT ──────────────────────────────────────────────

export function exportToCSV(products: ProductLifecycle[]): string {
  const headers = [
    "ID",
    "Stage",
    "Product Name",
    "ASIN",
    "Order ID",
    "Order Date",
    "Price Paid",
    "Carrier",
    "Tracking",
    "Date Received",
    "Review Status",
    "Review Link",
    "Transfer Date",
    "Fair Market Value",
    "Transfer Doc Ref",
    "Listing Price",
    "Discount %",
    "FB Marketplace Status",
    "Craigslist Status",
    "OfferUp Status",
    "Transaction Type",
    "Buyer/Renter Name",
    "Buyer Phone",
    "Buyer Social",
    "Amount Paid",
    "Payment Method",
    "Sale Date",
    "Sale Platform",
    "Pickup/Shipping",
    "Rental Start",
    "Rental End",
    "Deposit Amount",
    "Deposit Returned",
    "Return Status",
    "Condition on Return",
    "Tags",
    "Internal Notes",
    "Created At",
  ];

  const escape = (v: string | number | boolean | undefined | null) => {
    if (v === undefined || v === null) return "";
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const rows = products.map((p) => {
    const br = p.sold?.buyer_renter;
    const fbPlatform = p.listed?.platforms.find((pl) => pl.platform === "facebook_marketplace");
    const clPlatform = p.listed?.platforms.find((pl) => pl.platform === "craigslist");
    const ouPlatform = p.listed?.platforms.find((pl) => pl.platform === "offerup");

    return [
      escape(p.id),
      escape(p.current_stage),
      escape(p.ordered?.product_name),
      escape(p.ordered?.asin),
      escape(p.ordered?.order_id),
      escape(p.ordered?.order_date),
      escape(p.ordered?.price_paid),
      escape(p.shipped?.carrier),
      escape(p.shipped?.tracking_number),
      escape(p.received?.date_received),
      escape(p.reviewed?.review_status),
      escape(p.reviewed?.review_link),
      escape(p.transferred?.transfer_date),
      escape(p.transferred?.fair_market_value),
      escape(p.transferred?.transfer_document_ref),
      escape(p.listed?.listing_price),
      escape(p.listed?.discount_percentage),
      escape(fbPlatform?.status),
      escape(clPlatform?.status),
      escape(ouPlatform?.status),
      escape(br?.transaction_type),
      escape(br?.full_name),
      escape(br?.phone_number),
      escape(br ? `${br.social_media_platform}: ${br.social_media_handle}` : ""),
      escape(br?.amount_paid),
      escape(br?.payment_method),
      escape(br?.transaction_date),
      escape(br?.sale_platform),
      escape(br?.shipping_or_pickup),
      escape(br?.rental_start_date),
      escape(br?.rental_end_date),
      escape(br?.deposit_amount),
      escape(br?.deposit_returned),
      escape(br?.return_status),
      escape(br?.condition_on_return),
      escape(p.tags.join("; ")),
      escape(p.internal_notes),
      escape(p.created_at),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

// ─── LISTING PRICE CALCULATOR ────────────────────────────────

export function calcListingPrice(amazonPrice: number, discountPct: number): number {
  return Math.round(amazonPrice * (1 - discountPct / 100) * 100) / 100;
}

// ─── SUMMARY STATS ───────────────────────────────────────────

export interface LifecycleSummary {
  total: number;
  by_stage: Record<LifecycleStage, number>;
  total_ordered_value: number;
  total_sold_value: number;
  total_rental_income: number;
  total_listed_value: number;
  avg_discount_pct: number;
}

export function getLifecycleSummary(products: ProductLifecycle[]): LifecycleSummary {
  const by_stage = LIFECYCLE_STAGES.reduce(
    (acc, s) => ({ ...acc, [s]: 0 }),
    {} as Record<LifecycleStage, number>
  );

  let total_ordered_value = 0;
  let total_sold_value = 0;
  let total_rental_income = 0;
  let total_listed_value = 0;
  let discount_sum = 0;
  let discount_count = 0;

  for (const p of products) {
    if (!p.is_archived) by_stage[p.current_stage]++;
    total_ordered_value += p.ordered?.price_paid ?? 0;
    if (p.sold?.buyer_renter) {
      const br = p.sold.buyer_renter;
      if (br.transaction_type === "sale") total_sold_value += br.amount_paid;
      else total_rental_income += br.amount_paid;
    }
    if (p.listed) {
      total_listed_value += p.listed.listing_price;
      discount_sum += p.listed.discount_percentage;
      discount_count++;
    }
  }

  return {
    total: products.filter((p) => !p.is_archived).length,
    by_stage,
    total_ordered_value,
    total_sold_value,
    total_rental_income,
    total_listed_value,
    avg_discount_pct: discount_count > 0 ? Math.round(discount_sum / discount_count) : 30,
  };
}

// ─── SOLD EVENT HELPERS ──────────────────────────────────────

/**
 * Mark a product as SOLD and record the full buyer/transaction info.
 * Sets current_stage to "SOLD" and stores StageSold data.
 */
export function markSold(id: string, buyerInfo: BuyerRenterInfo): void {
  updateProduct(id, {
    current_stage: "SOLD",
    sold: { buyer_renter: buyerInfo },
  });
}

/**
 * Mark a product as rented out (SOLD stage, rental transaction_type).
 */
export function markRented(id: string, rentalInfo: BuyerRenterInfo): void {
  const info: BuyerRenterInfo = { ...rentalInfo, transaction_type: "rental" };
  updateProduct(id, {
    current_stage: "SOLD",
    sold: { buyer_renter: info },
  });
}

/**
 * Get all products that have been sold (SOLD stage with transaction_type === "sale").
 */
export function getSoldProducts(): ProductLifecycle[] {
  return getProducts().filter(
    (p) => p.current_stage === "SOLD" && p.sold?.buyer_renter?.transaction_type === "sale"
  );
}

/**
 * Get all products that are rented out (SOLD stage with transaction_type === "rental").
 */
export function getRentedProducts(): ProductLifecycle[] {
  return getProducts().filter(
    (p) => p.current_stage === "SOLD" && p.sold?.buyer_renter?.transaction_type === "rental"
  );
}

/**
 * Calculate total revenue from sales for a given period (ISO date strings).
 */
export function getSalesRevenue(fromDate?: string, toDate?: string): number {
  return getSoldProducts()
    .filter((p) => {
      const saleDate = p.sold?.buyer_renter?.sale_date;
      // If a date filter is active but this item has no date, exclude it
      if (!saleDate && (fromDate || toDate)) return false;
      if (!saleDate) return true;
      if (fromDate && saleDate < fromDate) return false;
      if (toDate && saleDate > toDate) return false;
      return true;
    })
    .reduce((sum, p) => sum + (p.sold?.buyer_renter?.amount_paid ?? 0), 0);
}

/**
 * Calculate total rental income for a given period.
 */
export function getRentalIncome(fromDate?: string, toDate?: string): number {
  return getRentedProducts()
    .filter((p) => {
      const saleDate = p.sold?.buyer_renter?.sale_date;
      // If a date filter is active but this item has no date, exclude it
      if (!saleDate && (fromDate || toDate)) return false;
      if (!saleDate) return true;
      if (fromDate && saleDate < fromDate) return false;
      if (toDate && saleDate > toDate) return false;
      return true;
    })
    .reduce((sum, p) => sum + (p.sold?.buyer_renter?.amount_paid ?? 0), 0);
}
