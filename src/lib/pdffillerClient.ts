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

export const DEMO_PDFFILLER_DOCS: PDFillerDocument[] = [];

export const DEMO_PDFFILLER_FILLS: PDFillerFill[] = [];

export function getPDFillerConfig(): PDFillerConfig | null {
  try {
    const stored = localStorage.getItem(PDFFILLER_CONFIG_KEY);
    if (stored) return JSON.parse(stored) as PDFillerConfig;
  } catch {
    // noop
  }
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
    throw new Error((err as { message?: string }).message ?? `PDFiller API error ${response.status} ${response.statusText} at ${path}`);
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
