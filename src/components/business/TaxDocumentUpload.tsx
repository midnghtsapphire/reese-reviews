// ============================================================
// Portable Tax Module — designed for reuse across ReeseReviews,
// TruthSlayer, and other apps.
//
// TAX DOCUMENT UPLOAD
// Upload W-2s, 1099-NEC/MISC/K/DIV/INT, SSA-1099 via photo or
// PDF. Simulates OCR extraction with a user-confirmation flow
// before persisting document metadata and linking to an income
// source. All state is stored via taxStore (localStorage).
// ============================================================

import React, { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  FileText,
  Camera,
  CheckCircle2,
  XCircle,
  Trash2,
  Eye,
  AlertCircle,
  Loader2,
  FilePlus,
} from "lucide-react";
import {
  getTaxDocuments,
  addTaxDocument,
  updateTaxDocument,
  deleteTaxDocument,
  getPersons,
  genId,
  currentTaxYear,
} from "@/stores/taxStore";
import type { TaxDocument, DocumentType, TaxPerson } from "@/stores/taxStore";

// ─── BRAND COLORS ────────────────────────────────────────────
const BRAND = {
  amber:   "#FF6B2B",
  gold:    "#FFB347",
  crimson: "#E63946",
  volt:    "#FFD93D",
};

// ─── DOCUMENT TYPE CONFIG ────────────────────────────────────

interface DocTypeConfig {
  label: string;
  description: string;
  fields: Array<{ key: string; label: string; placeholder: string; required: boolean }>;
  color: string;
}

const DOC_TYPE_CONFIG: Record<DocumentType, DocTypeConfig> = {
  w2: {
    label: "W-2",
    description: "Wage and Tax Statement",
    color: "bg-blue-600",
    fields: [
      { key: "employer_name",      label: "Employer Name",            placeholder: "Home Depot U.S.A. Inc.",  required: true  },
      { key: "employer_ein",       label: "Employer EIN",             placeholder: "58-0628465",              required: true  },
      { key: "box_1_wages",        label: "Box 1 — Wages",            placeholder: "0.00",                    required: true  },
      { key: "box_2_fed_withheld", label: "Box 2 — Federal Withheld", placeholder: "0.00",                    required: true  },
      { key: "box_3_ss_wages",     label: "Box 3 — SS Wages",         placeholder: "0.00",                    required: false },
      { key: "box_4_ss_withheld",  label: "Box 4 — SS Withheld",      placeholder: "0.00",                    required: false },
      { key: "box_5_medicare",     label: "Box 5 — Medicare Wages",   placeholder: "0.00",                    required: false },
      { key: "box_16_state_wages", label: "Box 16 — State Wages",     placeholder: "0.00",                    required: false },
      { key: "box_17_state_tax",   label: "Box 17 — State Tax",       placeholder: "0.00",                    required: false },
      { key: "tax_year",           label: "Tax Year",                  placeholder: "2025",                    required: true  },
    ],
  },
  "1099_nec": {
    label: "1099-NEC",
    description: "Non-Employee Compensation",
    color: "bg-orange-600",
    fields: [
      { key: "payer_name",         label: "Payer Name",               placeholder: "Amazon.com Services LLC", required: true  },
      { key: "payer_ein",          label: "Payer EIN",                placeholder: "91-1646860",              required: true  },
      { key: "box_1_nec",          label: "Box 1 — NEC Amount",       placeholder: "0.00",                    required: true  },
      { key: "box_4_fed_withheld", label: "Box 4 — Federal Withheld", placeholder: "0.00",                    required: false },
      { key: "tax_year",           label: "Tax Year",                  placeholder: "2025",                    required: true  },
    ],
  },
  "1099_misc": {
    label: "1099-MISC",
    description: "Miscellaneous Income",
    color: "bg-yellow-600",
    fields: [
      { key: "payer_name",         label: "Payer Name",               placeholder: "Payer Name",              required: true  },
      { key: "payer_ein",          label: "Payer EIN",                placeholder: "XX-XXXXXXX",              required: true  },
      { key: "box_3_other_income", label: "Box 3 — Other Income",     placeholder: "0.00",                    required: false },
      { key: "box_1_rents",        label: "Box 1 — Rents",            placeholder: "0.00",                    required: false },
      { key: "box_4_fed_withheld", label: "Box 4 — Federal Withheld", placeholder: "0.00",                    required: false },
      { key: "tax_year",           label: "Tax Year",                  placeholder: "2025",                    required: true  },
    ],
  },
  "1099_k": {
    label: "1099-K",
    description: "Payment Card / Third-Party Network",
    color: "bg-purple-600",
    fields: [
      { key: "payer_name",         label: "Payer / PSE Name",         placeholder: "PayPal / Stripe",         required: true  },
      { key: "payer_ein",          label: "Payer EIN",                placeholder: "XX-XXXXXXX",              required: true  },
      { key: "box_1a_gross",       label: "Box 1a — Gross Amount",    placeholder: "0.00",                    required: true  },
      { key: "box_1b_card",        label: "Box 1b — Card Transactions",placeholder: "0.00",                   required: false },
      { key: "tax_year",           label: "Tax Year",                  placeholder: "2025",                    required: true  },
    ],
  },
  "1099_div": {
    label: "1099-DIV",
    description: "Dividends and Distributions",
    color: "bg-green-600",
    fields: [
      { key: "payer_name",         label: "Payer Name",               placeholder: "Brokerage Name",          required: true  },
      { key: "payer_ein",          label: "Payer EIN",                placeholder: "XX-XXXXXXX",              required: true  },
      { key: "box_1a_ordinary",    label: "Box 1a — Ordinary Divs",   placeholder: "0.00",                    required: true  },
      { key: "box_1b_qualified",   label: "Box 1b — Qualified Divs",  placeholder: "0.00",                    required: false },
      { key: "box_2a_cap_gains",   label: "Box 2a — Total Cap Gains", placeholder: "0.00",                    required: false },
      { key: "tax_year",           label: "Tax Year",                  placeholder: "2025",                    required: true  },
    ],
  },
  "1099_int": {
    label: "1099-INT",
    description: "Interest Income",
    color: "bg-teal-600",
    fields: [
      { key: "payer_name",         label: "Payer Name",               placeholder: "Bank / Credit Union",     required: true  },
      { key: "payer_ein",          label: "Payer EIN",                placeholder: "XX-XXXXXXX",              required: true  },
      { key: "box_1_interest",     label: "Box 1 — Interest Income",  placeholder: "0.00",                    required: true  },
      { key: "box_4_fed_withheld", label: "Box 4 — Federal Withheld", placeholder: "0.00",                    required: false },
      { key: "tax_year",           label: "Tax Year",                  placeholder: "2025",                    required: true  },
    ],
  },
  ssa_1099: {
    label: "SSA-1099",
    description: "Social Security Benefit Statement",
    color: "bg-indigo-600",
    fields: [
      { key: "payer_name",         label: "Payer",                    placeholder: "Social Security Administration", required: true },
      { key: "box_5_net_benefits", label: "Box 5 — Net Benefits",     placeholder: "0.00",                    required: true  },
      { key: "box_6_fed_withheld", label: "Box 6 — Federal Withheld", placeholder: "0.00",                    required: false },
      { key: "tax_year",           label: "Tax Year",                  placeholder: "2025",                    required: true  },
    ],
  },
  receipt: {
    label: "Receipt",
    description: "Business Expense Receipt",
    color: "bg-pink-600",
    fields: [
      { key: "vendor",             label: "Vendor / Merchant",        placeholder: "Staples",                 required: true  },
      { key: "date",               label: "Date",                     placeholder: "2025-01-15",              required: true  },
      { key: "amount",             label: "Total Amount",             placeholder: "0.00",                    required: true  },
      { key: "description",        label: "Description",              placeholder: "Office supplies",         required: false },
    ],
  },
  other: {
    label: "Other",
    description: "Other Tax Document",
    color: "bg-gray-600",
    fields: [
      { key: "description",        label: "Description",              placeholder: "Document description",    required: true  },
      { key: "tax_year",           label: "Tax Year",                  placeholder: "2025",                    required: true  },
    ],
  },
};

// ─── SIMULATED OCR EXTRACTION ────────────────────────────────
// In production, replace this with a real OCR API call.
// The function returns plausible-looking extracted fields so
// users can see the confirmation flow in action.

function simulateOcrExtraction(
  docType: DocumentType,
  fileName: string
): Record<string, string> {
  const year = String(currentTaxYear());
  const base: Record<string, string> = { tax_year: year };

  switch (docType) {
    case "w2":
      return {
        ...base,
        employer_name:      "Extracted from document — please verify",
        employer_ein:       "XX-XXXXXXX",
        box_1_wages:        "0.00",
        box_2_fed_withheld: "0.00",
        box_3_ss_wages:     "0.00",
        box_4_ss_withheld:  "0.00",
        box_5_medicare:     "0.00",
      };
    case "1099_nec":
      return {
        ...base,
        payer_name:         fileName.toLowerCase().includes("amazon") ? "Amazon.com Services LLC" : "Extracted — please verify",
        payer_ein:          fileName.toLowerCase().includes("amazon") ? "91-1646860" : "XX-XXXXXXX",
        box_1_nec:          "0.00",
        box_4_fed_withheld: "0.00",
      };
    case "ssa_1099":
      return {
        ...base,
        payer_name:         "Social Security Administration",
        box_5_net_benefits: "0.00",
        box_6_fed_withheld: "0.00",
      };
    default:
      return { ...base, payer_name: "Extracted — please verify" };
  }
}

// ─── COMPONENT ───────────────────────────────────────────────

interface TaxDocumentUploadProps {
  /** Filter to a specific person; if omitted, shows all persons */
  defaultPersonId?: string;
  taxYear?: number;
  onDocumentAdded?: (doc: TaxDocument) => void;
}

export function TaxDocumentUpload({
  defaultPersonId,
  taxYear = currentTaxYear(),
  onDocumentAdded,
}: TaxDocumentUploadProps) {
  const persons = getPersons();
  const [selectedPersonId, setSelectedPersonId] = useState<string>(
    defaultPersonId ?? persons[0]?.id ?? ""
  );
  const [documents, setDocuments] = useState<TaxDocument[]>(() =>
    getTaxDocuments(undefined, taxYear)
  );

  // Upload flow state
  const [uploadStep, setUploadStep] = useState<"idle" | "extracting" | "confirm" | "done">("idle");
  const [pendingDocType, setPendingDocType] = useState<DocumentType>("w2");
  const [pendingFileName, setPendingFileName] = useState("");
  const [pendingFileSize, setPendingFileSize] = useState(0);
  const [pendingMime, setPendingMime] = useState("application/pdf");
  const [pendingDataUrl, setPendingDataUrl] = useState<string | undefined>(undefined);
  const [extractedFields, setExtractedFields] = useState<Record<string, string>>({});
  const [confirmNotes, setConfirmNotes] = useState("");
  const [previewDoc, setPreviewDoc] = useState<TaxDocument | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Refresh documents list ──────────────────────────────────
  const refreshDocs = useCallback(() => {
    setDocuments(getTaxDocuments(undefined, taxYear));
  }, [taxYear]);

  // ── Handle file selection ───────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingFileName(file.name);
    setPendingFileSize(file.size);
    setPendingMime(file.type);
    setUploadStep("extracting");

    // Read file as data URL for preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPendingDataUrl(dataUrl);

      // Simulate OCR delay
      setTimeout(() => {
        const fields = simulateOcrExtraction(pendingDocType, file.name);
        setExtractedFields(fields);
        setUploadStep("confirm");
      }, 1200);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Confirm and save document ───────────────────────────────
  const handleConfirm = () => {
    const doc = addTaxDocument({
      person_id: selectedPersonId,
      tax_year: taxYear,
      document_type: pendingDocType,
      file_name: pendingFileName,
      file_data_url: pendingDataUrl,
      file_size_bytes: pendingFileSize,
      mime_type: pendingMime,
      extracted_fields: extractedFields,
      confirmed: true,
      notes: confirmNotes,
    });

    refreshDocs();
    onDocumentAdded?.(doc);
    setUploadStep("done");

    setTimeout(() => {
      setUploadStep("idle");
      setConfirmNotes("");
      setPendingDataUrl(undefined);
    }, 2000);
  };

  // ── Cancel upload ───────────────────────────────────────────
  const handleCancel = () => {
    setUploadStep("idle");
    setPendingDataUrl(undefined);
    setExtractedFields({});
    setConfirmNotes("");
  };

  // ── Delete document ─────────────────────────────────────────
  const handleDelete = (id: string) => {
    deleteTaxDocument(id);
    refreshDocs();
    if (previewDoc?.id === id) setPreviewDoc(null);
  };

  // ── Filter docs for display ─────────────────────────────────
  const displayDocs = selectedPersonId
    ? documents.filter((d) => d.person_id === selectedPersonId)
    : documents;

  const personName = (id: string) =>
    persons.find((p) => p.id === id)?.name ?? "Unknown";

  // ─── RENDER ──────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="p-2 rounded-lg"
          style={{ background: `${BRAND.amber}22`, border: `1px solid ${BRAND.amber}44` }}
        >
          <Upload className="w-5 h-5" style={{ color: BRAND.amber }} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Tax Document Upload</h3>
          <p className="text-sm text-gray-400">
            Upload W-2s, 1099s, SSA-1099 — fields are extracted and confirmed before saving
          </p>
        </div>
      </div>

      {/* Person Selector */}
      <div className="flex flex-wrap gap-2">
        {persons.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPersonId(p.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedPersonId === p.id
                ? "text-black"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
            style={
              selectedPersonId === p.id
                ? { background: BRAND.amber, color: "#000" }
                : {}
            }
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Upload Panel */}
      {uploadStep === "idle" && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-base">Upload New Document</CardTitle>
            <CardDescription className="text-gray-400">
              Select document type, then choose a file (PDF, JPG, PNG)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Document type selector */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {(Object.keys(DOC_TYPE_CONFIG) as DocumentType[]).map((type) => {
                const cfg = DOC_TYPE_CONFIG[type];
                return (
                  <button
                    key={type}
                    onClick={() => setPendingDocType(type)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      pendingDocType === type
                        ? "border-orange-400 bg-orange-500/20"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className={`text-xs font-bold text-white mb-1`}>{cfg.label}</div>
                    <div className="text-xs text-gray-400 leading-tight">{cfg.description}</div>
                  </button>
                );
              })}
            </div>

            {/* File drop zone */}
            <div
              className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-orange-400/50 hover:bg-white/5 transition-all"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file && fileInputRef.current) {
                  const dt = new DataTransfer();
                  dt.items.add(file);
                  fileInputRef.current.files = dt.files;
                  fileInputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
                }
              }}
            >
              <div className="flex flex-col items-center gap-3">
                <div
                  className="p-4 rounded-full"
                  style={{ background: `${BRAND.amber}22` }}
                >
                  <FilePlus className="w-8 h-8" style={{ color: BRAND.amber }} />
                </div>
                <div>
                  <p className="text-white font-medium">
                    Drop your {DOC_TYPE_CONFIG[pendingDocType].label} here
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    or click to browse — PDF, JPG, PNG supported
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-gray-400 border-white/20">
                    <Camera className="w-3 h-3 mr-1" /> Photo
                  </Badge>
                  <Badge variant="outline" className="text-gray-400 border-white/20">
                    <FileText className="w-3 h-3 mr-1" /> PDF
                  </Badge>
                </div>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </CardContent>
        </Card>
      )}

      {/* Extracting */}
      {uploadStep === "extracting" && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-12 flex flex-col items-center gap-4">
            <Loader2
              className="w-10 h-10 animate-spin"
              style={{ color: BRAND.amber }}
            />
            <p className="text-white font-medium">Extracting fields from document…</p>
            <p className="text-gray-400 text-sm">{pendingFileName}</p>
          </CardContent>
        </Card>
      )}

      {/* Confirm extracted fields */}
      {uploadStep === "confirm" && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" style={{ color: BRAND.volt }} />
              <CardTitle className="text-white text-base">
                Confirm Extracted Fields — {DOC_TYPE_CONFIG[pendingDocType].label}
              </CardTitle>
            </div>
            <CardDescription className="text-gray-400">
              Review and correct the extracted values before saving. File:{" "}
              <span className="text-white">{pendingFileName}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File preview (image only) */}
            {pendingDataUrl && pendingMime.startsWith("image/") && (
              <div className="rounded-lg overflow-hidden border border-white/10 max-h-48">
                <img
                  src={pendingDataUrl}
                  alt="Document preview"
                  className="w-full object-contain max-h-48"
                />
              </div>
            )}

            {/* Extracted fields form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DOC_TYPE_CONFIG[pendingDocType].fields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <Label className="text-gray-300 text-xs">
                    {field.label}
                    {field.required && (
                      <span className="text-red-400 ml-1">*</span>
                    )}
                  </Label>
                  <Input
                    value={extractedFields[field.key] ?? ""}
                    onChange={(e) =>
                      setExtractedFields((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 text-sm"
                  />
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label className="text-gray-300 text-xs">Notes (optional)</Label>
              <Input
                value={confirmNotes}
                onChange={(e) => setConfirmNotes(e.target.value)}
                placeholder="Any notes about this document…"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleConfirm}
                className="flex-1 text-black font-bold"
                style={{ background: BRAND.amber }}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirm & Save
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                className="border-white/20 text-gray-300 hover:bg-white/10"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Done */}
      {uploadStep === "done" && (
        <Card className="bg-green-900/20 border-green-500/30">
          <CardContent className="py-8 flex flex-col items-center gap-3">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
            <p className="text-green-300 font-medium">Document saved successfully!</p>
          </CardContent>
        </Card>
      )}

      {/* Document Library */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base">
              Uploaded Documents
              <Badge className="ml-2 bg-white/10 text-gray-300">{displayDocs.length}</Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {displayDocs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No documents uploaded yet for {taxYear}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayDocs.map((doc) => {
                const cfg = DOC_TYPE_CONFIG[doc.document_type];
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge className={`${cfg.color} text-white text-xs shrink-0`}>
                        {cfg.label}
                      </Badge>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {doc.file_name}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {personName(doc.person_id)} ·{" "}
                          {doc.extracted_fields.payer_name ||
                            doc.extracted_fields.employer_name ||
                            doc.extracted_fields.vendor ||
                            "—"}{" "}
                          · {new Date(doc.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {doc.confirmed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-400" />
                      )}
                      <button
                        onClick={() => setPreviewDoc(previewDoc?.id === doc.id ? null : doc)}
                        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1 rounded hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inline Preview Panel */}
      {previewDoc && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base">
                Document Preview — {DOC_TYPE_CONFIG[previewDoc.document_type].label}
              </CardTitle>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {previewDoc.file_data_url && previewDoc.mime_type.startsWith("image/") && (
              <div className="rounded-lg overflow-hidden border border-white/10">
                <img
                  src={previewDoc.file_data_url}
                  alt="Document"
                  className="w-full object-contain max-h-64"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(previewDoc.extracted_fields).map(([k, v]) => (
                <div key={k} className="space-y-0.5">
                  <p className="text-gray-400 text-xs capitalize">
                    {k.replace(/_/g, " ")}
                  </p>
                  <p className="text-white text-sm font-medium">{v || "—"}</p>
                </div>
              ))}
            </div>
            {previewDoc.notes && (
              <p className="text-gray-400 text-sm border-t border-white/10 pt-3">
                Notes: {previewDoc.notes}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default TaxDocumentUpload;
