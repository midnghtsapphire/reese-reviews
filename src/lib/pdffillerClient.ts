// PDFiller REST API Client
// API docs: https://api.pdffiller.com/v2/
// Uses OAuth 2.0 Bearer token authentication

const PDFFILLER_CONFIG_KEY = "reese-pdffiller-config";

export interface PDFillerConfig {
  access_token: string;
  connected: boolean;
  last_synced?: string;
}

export interface PDFillerDocument {
  id: number;
  name: string;
  created: string;
  updated: string;
  total_pages: number;
  type: string;
  status: "ready" | "pending" | "error";
  fill_request_hash?: string;
}

export interface PDFillerFill {
  id: number;
  document_id: number;
  document_name: string;
  created: string;
  status: "complete" | "pending" | "awaiting_signature";
  download_url?: string;
}

export const DEMO_PDFFILLER_DOCS: PDFillerDocument[] = [
  { id: 101, name: "IRS Schedule C (Form 1040) - Profit or Loss from Business", created: "2026-01-01", updated: "2026-01-01", total_pages: 2, type: "pdf", status: "ready" },
  { id: 102, name: "IRS Form 1099-NEC - Nonemployee Compensation", created: "2026-01-01", updated: "2026-01-15", total_pages: 1, type: "pdf", status: "ready" },
  { id: 103, name: "IRS Form 8829 - Home Office Deduction", created: "2026-01-01", updated: "2026-02-01", total_pages: 2, type: "pdf", status: "ready" },
  { id: 104, name: "IRS Form 4562 - Depreciation and Amortization", created: "2026-01-01", updated: "2026-02-01", total_pages: 2, type: "pdf", status: "ready" },
  { id: 105, name: "IRS Schedule SE - Self-Employment Tax", created: "2026-01-01", updated: "2026-02-10", total_pages: 1, type: "pdf", status: "ready" },
  { id: 106, name: "IRS Form W-9 - Request for Taxpayer Identification", created: "2025-12-01", updated: "2025-12-01", total_pages: 1, type: "pdf", status: "ready" },
  { id: 107, name: "Content Creator Service Agreement Template", created: "2025-11-01", updated: "2026-01-05", total_pages: 4, type: "pdf", status: "ready" },
  { id: 108, name: "Amazon Affiliate Disclosure Template", created: "2025-10-15", updated: "2026-01-10", total_pages: 1, type: "pdf", status: "ready" },
];

export const DEMO_PDFFILLER_FILLS: PDFillerFill[] = [
  { id: 201, document_id: 101, document_name: "IRS Schedule C (Form 1040) - 2025", created: "2026-02-15", status: "complete", download_url: "#" },
  { id: 202, document_id: 102, document_name: "IRS Form 1099-NEC - Amazon 2025", created: "2026-02-01", status: "complete", download_url: "#" },
  { id: 203, document_id: 106, document_name: "W-9 for Reese Reviews LLC", created: "2026-01-20", status: "awaiting_signature" },
];

export function getPDFillerConfig(): PDFillerConfig | null {
  try {
    const stored = localStorage.getItem(PDFFILLER_CONFIG_KEY);
    if (stored) return JSON.parse(stored) as PDFillerConfig;
  } catch {}
  return null;
}

export function savePDFillerConfig(config: PDFillerConfig): void {
  localStorage.setItem(PDFFILLER_CONFIG_KEY, JSON.stringify(config));
}

export function clearPDFillerConfig(): void {
  localStorage.removeItem(PDFFILLER_CONFIG_KEY);
}

const PDFFILLER_BASE = "https://api.pdffiller.com/v2";

async function pdffillerRequest<T>(token: string, path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${PDFFILLER_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `PDFiller API error ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function validatePDFillerToken(token: string): Promise<boolean> {
  try {
    await pdffillerRequest<unknown>(token, "/templates?per_page=1");
    return true;
  } catch {
    return false;
  }
}

export async function fetchPDFillerDocuments(config: PDFillerConfig): Promise<PDFillerDocument[]> {
  const data = await pdffillerRequest<{ items: Array<Record<string, unknown>> }>(
    config.access_token,
    "/templates?per_page=50&order_by=updated_at&order=desc"
  );
  return data.items.map((d) => ({
    id: d.id as number,
    name: d.name as string,
    created: d.created as string,
    updated: d.updated as string,
    total_pages: (d.total_pages as number) ?? 1,
    type: "pdf",
    status: "ready" as const,
  }));
}

export async function fetchPDFillerFills(config: PDFillerConfig): Promise<PDFillerFill[]> {
  const data = await pdffillerRequest<{ items: Array<Record<string, unknown>> }>(
    config.access_token,
    "/fills?per_page=50&order_by=created&order=desc"
  );
  return data.items.map((f) => ({
    id: f.id as number,
    document_id: f.document_id as number,
    document_name: (f.document_name as string) ?? "Document",
    created: f.created as string,
    status: f.status as PDFillerFill["status"],
    download_url: (f.download_url as string) ?? undefined,
  }));
}

export async function createPDFillerFill(config: PDFillerConfig, documentId: number): Promise<PDFillerFill> {
  const data = await pdffillerRequest<Record<string, unknown>>(config.access_token, "/fills", {
    method: "POST",
    body: JSON.stringify({ document_id: documentId }),
  });
  return {
    id: data.id as number,
    document_id: documentId,
    document_name: "New Fill",
    created: new Date().toISOString(),
    status: "pending",
  };
}
