// ============================================================
// AMAZON INTEGRATION STORE
// Handles Amazon orders, SP-API connection, and review drafts
// In production: connects to Amazon SP-API via backend proxy
// ============================================================

import type { AmazonOrder } from "./businessTypes";

const STORAGE_KEY = "reese-amazon-orders";
const AMAZON_CONFIG_KEY = "reese-amazon-config";

export interface AmazonConfig {
  seller_id: string;
  marketplace_id: string;
  refresh_token: string;
  affiliate_tag: string;
  connected: boolean;
  last_synced?: string;
}

// ─── DEMO DATA ───────────────────────────────────────────────

export const DEMO_AMAZON_ORDERS: AmazonOrder[] = [
  {
    id: "amz-001",
    amazon_order_id: "114-2847391-0293847",
    asin: "B09JQMJHXY",
    product_name: "Anker Soundcore Life Q30 Wireless Headphones",
    category: "tech",
    image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
    purchase_date: "2025-12-15",
    price: 79.99,
    quantity: 1,
    status: "delivered",
    review_status: "published",
    review_id: "best-wireless-earbuds-everyday",
    affiliate_link: "https://amazon.com/dp/B09JQMJHXY?tag=reesereviews-20",
    source: "purchased",
  },
  {
    id: "amz-002",
    amazon_order_id: "114-9283746-1029384",
    asin: "B0BDHX8Z63",
    product_name: "Ninja Creami Ice Cream Maker",
    category: "food-restaurants",
    image_url: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400",
    purchase_date: "2026-01-08",
    price: 199.99,
    quantity: 1,
    status: "delivered",
    review_status: "draft",
    source: "purchased",
  },
  {
    id: "amz-003",
    amazon_order_id: "114-3847261-9182736",
    asin: "B0C2QWXYZ1",
    product_name: "Ring Video Doorbell 4",
    category: "tech",
    image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    purchase_date: "2026-01-22",
    price: 149.99,
    quantity: 1,
    status: "delivered",
    review_status: "not_reviewed",
    source: "purchased",
  },
  {
    id: "amz-004",
    amazon_order_id: "114-7261839-4728361",
    asin: "B0BW2JQXYZ",
    product_name: "Stanley Quencher H2.0 Tumbler 40oz",
    category: "products",
    image_url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400",
    purchase_date: "2026-02-01",
    price: 45.00,
    quantity: 1,
    status: "delivered",
    review_status: "not_reviewed",
    source: "purchased",
  },
  {
    id: "amz-005",
    amazon_order_id: "114-8374619-2837461",
    asin: "B0BXYZ1234",
    product_name: "Kindle Paperwhite 11th Gen",
    category: "entertainment",
    image_url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
    purchase_date: "2026-02-10",
    price: 139.99,
    quantity: 1,
    status: "delivered",
    review_status: "not_reviewed",
    source: "purchased",
  },
];

// ─── STORAGE HELPERS ─────────────────────────────────────────

export function getAmazonOrders(): AmazonOrder[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEMO_AMAZON_ORDERS;
}

export function saveAmazonOrders(orders: AmazonOrder[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export function getAmazonConfig(): AmazonConfig | null {
  try {
    const stored = localStorage.getItem(AMAZON_CONFIG_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

export function saveAmazonConfig(config: AmazonConfig): void {
  localStorage.setItem(AMAZON_CONFIG_KEY, JSON.stringify(config));
}

// ─── ORDER QUERIES ───────────────────────────────────────────

export function getUnreviewedOrders(): AmazonOrder[] {
  return getAmazonOrders().filter((o) => o.review_status === "not_reviewed" && o.status === "delivered");
}

export function getDraftOrders(): AmazonOrder[] {
  return getAmazonOrders().filter((o) => o.review_status === "draft");
}

export function getReviewedOrders(): AmazonOrder[] {
  return getAmazonOrders().filter((o) => o.review_status === "published");
}

export function getOrderById(id: string): AmazonOrder | undefined {
  return getAmazonOrders().find((o) => o.id === id);
}

export function updateOrderReviewStatus(
  orderId: string,
  status: AmazonOrder["review_status"],
  reviewId?: string
): void {
  const orders = getAmazonOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx !== -1) {
    orders[idx].review_status = status;
    if (reviewId) orders[idx].review_id = reviewId;
    saveAmazonOrders(orders);
  }
}

// ─── AUTO-DRAFT GENERATION ───────────────────────────────────

export function generateReviewDraft(order: AmazonOrder): string {
  const categoryMap: Record<string, string> = {
    tech: "tech gadget",
    "food-restaurants": "kitchen product",
    products: "everyday product",
    entertainment: "entertainment item",
    services: "service",
  };
  const type = categoryMap[order.category] || "product";

  return `I recently purchased the ${order.product_name} on ${new Date(order.purchase_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} and have been using it for a while now.

[DESCRIBE YOUR FIRST IMPRESSIONS HERE]

The ${order.product_name} is a ${type} that [DESCRIBE WHAT IT DOES]. After using it regularly, here's what I found:

[ADD YOUR DETAILED EXPERIENCE HERE]

Overall, I think this is [GREAT/GOOD/AVERAGE/DISAPPOINTING] for the price of $${order.price.toFixed(2)}.

[ADD YOUR FINAL THOUGHTS AND RECOMMENDATION HERE]`;
}

// ─── AMAZON SP-API SIMULATION ────────────────────────────────
// In production, this calls your backend proxy which handles
// Amazon SP-API auth (LWA tokens, AWS SigV4 signing)

export async function syncAmazonOrders(config: AmazonConfig): Promise<AmazonOrder[]> {
  // Simulate API call delay
  await new Promise((r) => setTimeout(r, 1500));

  // In production:
  // const response = await fetch('/api/amazon/orders', {
  //   headers: { 'Authorization': `Bearer ${config.refresh_token}` }
  // });
  // return response.json();

  // For now, return demo data with updated sync time
  const orders = getAmazonOrders();
  const updatedConfig = { ...config, last_synced: new Date().toISOString(), connected: true };
  saveAmazonConfig(updatedConfig);
  return orders;
}

export function getAmazonAffiliateLink(asin: string, tag: string): string {
  return `https://www.amazon.com/dp/${asin}?tag=${tag}`;
}
