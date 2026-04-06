// ============================================================
// FILE PARSER UTILITY
// Shared helper for reading CSV, Excel (.xlsx/.xls), and PDF
// files and converting them to a uniform string[][]
// (rows of string cells) that can be fed to any tabular parser.
//
// Usage:
//   import { parseFileToRows, fileToText } from "@/lib/fileParser";
//   const rows = await parseFileToRows(file);
// ============================================================

import readXlsxFile from "read-excel-file/browser";
import * as pdfjs from "pdfjs-dist";

// Use the locally bundled worker — avoids any CDN dependency.
// Vite resolves import.meta.url at build time so the worker file
// is included in the output bundle and served from the same origin.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// ─── TYPES ───────────────────────────────────────────────────

export interface ParseResult {
  /** Rows of string cells — row[0] is the header when present */
  rows: string[][];
  /** "csv" | "excel" | "pdf" | "image" */
  kind: "csv" | "excel" | "pdf" | "image";
  /** Raw text extracted (mainly useful for PDF / CSV) */
  rawText?: string;
}

// ─── HELPERS ─────────────────────────────────────────────────

function isCsv(file: File): boolean {
  return (
    file.type === "text/csv" ||
    file.type === "text/plain" ||
    file.name.endsWith(".csv") ||
    file.name.endsWith(".tsv") ||
    file.name.endsWith(".txt")
  );
}

function isExcel(file: File): boolean {
  return (
    file.name.endsWith(".xlsx") ||
    file.name.endsWith(".xls") ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.type === "application/vnd.ms-excel"
  );
}

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || file.name.endsWith(".pdf");
}

function isImage(file: File): boolean {
  return (
    file.type.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(file.name)
  );
}

/** Read a file as a UTF-8 string */
function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) ?? "");
    reader.onerror = () => reject(new Error("Could not read file as text."));
    reader.readAsText(file);
  });
}

/** Read a file as an ArrayBuffer */
function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) =>
      resolve((e.target?.result as ArrayBuffer) ?? new ArrayBuffer(0));
    reader.onerror = () =>
      reject(new Error("Could not read file as array buffer."));
    reader.readAsArrayBuffer(file);
  });
}

/** Read a file as a data: URL string (for image preview / PDF storage) */
export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) ?? "");
    reader.onerror = () => reject(new Error("Could not read file as data URL."));
    reader.readAsDataURL(file);
  });
}

// ─── CSV PARSER ───────────────────────────────────────────────
// Handles quoted fields, CRLF, and tab-delimited files.
// Exported so callers can reuse it directly without going through parseFileToRows.

export function parseCsvText(text: string, delimiter = ","): string[][] {
  // Auto-detect tab delimiter
  if (delimiter === "," && text.includes("\t") && !text.includes(",")) {
    delimiter = "\t";
  }
  const rows: string[][] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const cols: string[] = [];
    let inQuote = false;
    let cur = "";
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (ch === delimiter && !inQuote) {
        cols.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    cols.push(cur.trim());
    rows.push(cols);
  }
  return rows;
}

// ─── PDF TEXT EXTRACTION ─────────────────────────────────────
// Extracts all text items from every page of a PDF and attempts
// to reconstruct tabular rows by grouping items at similar Y
// coordinates (within a tolerance).

async function extractPdfText(file: File): Promise<{ text: string; rows: string[][] }> {
  const buffer = await readAsArrayBuffer(file);
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;

  const allItems: Array<{ x: number; y: number; page: number; text: string }> = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();

    for (const item of content.items) {
      if (!("str" in item)) continue;
      const str = item.str.trim();
      if (!str) continue;
      // PDF y-coords are bottom-up; flip to top-down for row grouping
      const tx = item.transform[4];
      const ty = viewport.height - item.transform[5];
      allItems.push({ x: tx, y: ty, page: p, text: str });
    }
  }

  // Sort by page → y → x
  allItems.sort((a, b) =>
    a.page !== b.page ? a.page - b.page : a.y !== b.y ? a.y - b.y : a.x - b.x
  );

  // Group items into rows (same y within ±4px tolerance)
  const rowGroups: Array<typeof allItems> = [];
  let currentGroup: typeof allItems = [];
  let lastY = -9999;
  const Y_TOL = 4;

  for (const item of allItems) {
    if (Math.abs(item.y - lastY) > Y_TOL || item.page !== (currentGroup[0]?.page ?? item.page)) {
      if (currentGroup.length) rowGroups.push(currentGroup);
      currentGroup = [item];
      lastY = item.y;
    } else {
      currentGroup.push(item);
      lastY = (lastY + item.y) / 2;
    }
  }
  if (currentGroup.length) rowGroups.push(currentGroup);

  // Build plain text and string[][] rows
  const textLines: string[] = [];
  const rows: string[][] = [];
  for (const group of rowGroups) {
    const cells = group.map((i) => i.text);
    rows.push(cells);
    textLines.push(cells.join("  "));
  }

  return { text: textLines.join("\n"), rows };
}

// ─── MAIN EXPORT ─────────────────────────────────────────────

/**
 * Parse any supported file into a uniform `ParseResult`.
 *
 * - CSV / TXT       → rows via CSV parser
 * - Excel (.xlsx)   → rows via read-excel-file
 * - PDF             → rows via pdfjs text extraction + y-coordinate grouping
 * - Images          → kind:"image", rows:[] (caller shows preview/OCR UI)
 */
export async function parseFileToRows(file: File): Promise<ParseResult> {
  if (isCsv(file)) {
    const text = await readAsText(file);
    return { kind: "csv", rows: parseCsvText(text), rawText: text };
  }

  if (isExcel(file)) {
    const xlRows = await readXlsxFile(file);
    const rows = xlRows.map((row) =>
      row.map((cell) => (cell === null || cell === undefined ? "" : String(cell)))
    );
    return { kind: "excel", rows };
  }

  if (isPdf(file)) {
    const { text, rows } = await extractPdfText(file);
    return { kind: "pdf", rows, rawText: text };
  }

  if (isImage(file)) {
    return { kind: "image", rows: [] };
  }

  // Fallback: try as plain text
  const text = await readAsText(file);
  return { kind: "csv", rows: parseCsvText(text), rawText: text };
}

/**
 * Convert a ParseResult back to a flat CSV string.
 * Useful for feeding parsed Excel/PDF data to an existing text-based parser.
 */
export function rowsToCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
}
