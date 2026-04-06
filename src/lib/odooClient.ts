// Odoo JSON-RPC client
// Odoo Community Edition API docs: https://www.odoo.com/documentation/17.0/developer/reference/external_api.html

const ODOO_CONFIG_KEY = "reese-odoo-config";

export interface OdooConfig {
  url: string;
  database: string;
  username: string;
  api_key: string;
  uid?: number;
  connected: boolean;
  last_synced?: string;
}

export interface OdooExpense {
  id: number;
  name: string;
  date: string;
  total_amount: number;
  account_name: string;
  partner_name: string;
  reference: string;
  move_type: "in_invoice" | "out_invoice" | "in_refund" | "out_refund" | "entry";
  payment_state: "not_paid" | "in_payment" | "paid" | "partial" | "reversed";
  tax_ids: number[];
}

export interface OdooProduct {
  id: number;
  name: string;
  qty_available: number;
  virtual_available: number;
  list_price: number;
  standard_price: number;
  categ_id: [number, string];
  type: "consu" | "service" | "product";
}

export interface OdooTaxReport {
  period: string;
  total_tax_due: number;
  total_base_amount: number;
  lines: Array<{ name: string; base: number; tax: number }>;
}

export const DEMO_ODOO_EXPENSES: OdooExpense[] = [];

export const DEMO_ODOO_PRODUCTS: OdooProduct[] = [];

export function getOdooConfig(): OdooConfig | null {
  try {
    const stored = localStorage.getItem(ODOO_CONFIG_KEY);
    if (stored) return JSON.parse(stored) as OdooConfig;
  } catch {}
  return null;
}

export function saveOdooConfig(config: OdooConfig): void {
  localStorage.setItem(ODOO_CONFIG_KEY, JSON.stringify(config));
}

export function clearOdooConfig(): void {
  localStorage.removeItem(ODOO_CONFIG_KEY);
}

async function odooRpc(
  config: OdooConfig,
  model: string,
  method: string,
  args: unknown[] = [],
  kwargs: Record<string, unknown> = {}
): Promise<unknown> {
  const response = await fetch(`${config.url}/web/dataset/call_kw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      id: Date.now(),
      params: {
        model,
        method,
        args,
        kwargs: {
          context: {},
          ...kwargs,
        },
      },
    }),
    credentials: "include",
  });
  const data = await response.json() as { error?: { data?: { message?: string }; message?: string }; result: unknown };
  if (data.error) throw new Error(data.error.data?.message ?? data.error.message ?? "Odoo API request failed");
  return data.result;
}

export async function connectOdoo(config: OdooConfig): Promise<OdooConfig> {
  const response = await fetch(`${config.url}/web/session/authenticate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: {
        db: config.database,
        login: config.username,
        password: config.api_key,
      },
    }),
    credentials: "include",
  });
  const data = await response.json() as { result?: { uid?: number } };
  if (!data.result?.uid) throw new Error("Authentication failed — check credentials");
  const updated: OdooConfig = { ...config, uid: data.result.uid, connected: true, last_synced: new Date().toISOString() };
  saveOdooConfig(updated);
  return updated;
}

export async function fetchOdooExpenses(config: OdooConfig): Promise<OdooExpense[]> {
  const records = await odooRpc(
    config,
    "account.move",
    "search_read",
    [[["move_type", "in", ["in_invoice", "in_refund"]]]],
    {
      fields: ["name", "invoice_date", "amount_total", "invoice_line_ids", "partner_id", "ref", "move_type", "payment_state"],
      limit: 100,
    }
  ) as Array<Record<string, unknown>>;

  return records.map((r) => ({
    id: r.id as number,
    name: r.name as string,
    date: (r.invoice_date as string) ?? "",
    total_amount: r.amount_total as number,
    account_name: "Expenses",
    partner_name: Array.isArray(r.partner_id) ? (r.partner_id[1] as string) : "",
    reference: (r.ref as string) ?? "",
    move_type: r.move_type as OdooExpense["move_type"],
    payment_state: r.payment_state as OdooExpense["payment_state"],
    tax_ids: [],
  }));
}

export async function fetchOdooInventory(config: OdooConfig): Promise<OdooProduct[]> {
  const records = await odooRpc(
    config,
    "product.product",
    "search_read",
    [[["type", "=", "product"]]],
    {
      fields: ["name", "qty_available", "virtual_available", "list_price", "standard_price", "categ_id", "type"],
      limit: 100,
    }
  ) as Array<Record<string, unknown>>;

  return records.map((r) => ({
    id: r.id as number,
    name: r.name as string,
    qty_available: r.qty_available as number,
    virtual_available: r.virtual_available as number,
    list_price: r.list_price as number,
    standard_price: r.standard_price as number,
    categ_id: r.categ_id as [number, string],
    type: r.type as OdooProduct["type"],
  }));
}
