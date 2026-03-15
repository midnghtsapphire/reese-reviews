import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  ExternalLink,
  RefreshCw,
  Wifi,
  WifiOff,
  FilePlus,
} from "lucide-react";
import {
  getPDFillerConfig,
  savePDFillerConfig,
  clearPDFillerConfig,
  validatePDFillerToken,
  DEMO_PDFFILLER_DOCS,
  DEMO_PDFFILLER_FILLS,
} from "@/lib/pdffillerClient";
import type { PDFillerConfig, PDFillerDocument, PDFillerFill } from "@/lib/pdffillerClient";

const STATUS_COLORS: Record<PDFillerDocument["status"], string> = {
  ready: "bg-green-600 text-white",
  pending: "bg-yellow-600 text-white",
  error: "bg-red-600 text-white",
};

const FILL_STATUS_COLORS: Record<PDFillerFill["status"], string> = {
  complete: "bg-green-600 text-white",
  pending: "bg-yellow-600 text-white",
  awaiting_signature: "bg-blue-600 text-white",
};

export function PDFillerIntegration() {
  const [config, setConfig] = useState<PDFillerConfig | null>(getPDFillerConfig());
  const [showForm, setShowForm] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fillLoading, setFillLoading] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const docs: PDFillerDocument[] = DEMO_PDFFILLER_DOCS;
  const fills: PDFillerFill[] = DEMO_PDFFILLER_FILLS;

  const handleConnect = async () => {
    if (!tokenInput.trim()) {
      setMessage({ type: "error", text: "Access token is required." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const valid = await validatePDFillerToken(tokenInput.trim());
      if (!valid) {
        setMessage({ type: "error", text: "Token validation failed. Please check your access token." });
        return;
      }
      const newConfig: PDFillerConfig = {
        access_token: tokenInput.trim(),
        connected: true,
        last_synced: new Date().toISOString(),
      };
      savePDFillerConfig(newConfig);
      setConfig(newConfig);
      setShowForm(false);
      setTokenInput("");
      setMessage({ type: "success", text: "Connected to PDFiller!" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Connection failed." });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    clearPDFillerConfig();
    setConfig(null);
    setMessage({ type: "success", text: "Disconnected from PDFiller." });
  };

  const handleFillNow = async (docId: number) => {
    setFillLoading(docId);
    await new Promise((r) => setTimeout(r, 800));
    setFillLoading(null);
    setMessage({ type: "success", text: "Fill created! Open PDFiller to complete it." });
  };

  return (
    <div className="space-y-4">
      {/* Connection banner */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center gap-2">
          {config?.connected ? (
            <Wifi className="w-4 h-4 text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-gray-400" />
          )}
          <span className="text-sm text-gray-300">
            {config?.connected
              ? "Connected to PDFiller"
              : "Not connected — showing demo documents"}
          </span>
        </div>
        <div className="flex gap-2">
          {config?.connected ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDisconnect}
              className="border-white/20 text-gray-300 hover:bg-white/10 text-xs"
            >
              Disconnect
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setShowForm(!showForm)}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
            >
              Connect PDFiller
            </Button>
          )}
        </div>
      </div>

      {/* Config form */}
      {showForm && (
        <Card className="bg-white/10 border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base">PDFiller API Connection</CardTitle>
            <CardDescription className="text-gray-300 text-xs">
              Get your API key at{" "}
              <a
                href="https://app.pdffiller.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300"
              >
                app.pdffiller.com
              </a>{" "}
              → Account → API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {message && (
              <Alert className={message.type === "success" ? "border-green-500/50 bg-green-500/10" : "border-red-500/50 bg-red-500/10"}>
                {message.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                )}
                <AlertDescription className={message.type === "success" ? "text-green-300" : "text-red-300"}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-1">
              <Label className="text-gray-300 text-xs">Access Token</Label>
              <Input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste your PDFiller OAuth2 access token"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 text-sm"
              />
            </div>
            <Button
              onClick={handleConnect}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Connect
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tax note */}
      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200">
        <strong>📋 Tax Forms:</strong> Your PDFiller account includes IRS Schedule C, 1099-NEC, Form 8829
        (Home Office), Schedule SE, and other tax forms. Use these for your annual tax filing.
      </div>

      {message && !showForm && (
        <Alert className={message.type === "success" ? "border-green-500/50 bg-green-500/10" : "border-red-500/50 bg-red-500/10"}>
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-green-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-400" />
          )}
          <AlertDescription className={message.type === "success" ? "text-green-300" : "text-red-300"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="bg-white/10 border border-white/20">
          <TabsTrigger value="documents" className="text-white data-[state=active]:bg-purple-600">
            My Documents
          </TabsTrigger>
          <TabsTrigger value="fills" className="text-white data-[state=active]:bg-purple-600">
            Completed Forms
          </TabsTrigger>
        </TabsList>

        {/* My Documents */}
        <TabsContent value="documents" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {docs.map((doc) => (
              <Card key={doc.id} className="bg-white/10 border-white/20">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                      <CardTitle className="text-white text-sm leading-tight">{doc.name}</CardTitle>
                    </div>
                    <Badge className={STATUS_COLORS[doc.status]}>{doc.status}</Badge>
                  </div>
                  <CardDescription className="text-gray-400 text-xs ml-6">
                    {doc.total_pages} {doc.total_pages === 1 ? "page" : "pages"} · Updated{" "}
                    {new Date(doc.updated).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    <a
                      href="https://app.pdffiller.com"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-gray-300 hover:bg-white/10 text-xs"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Open in PDFiller
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      onClick={() => handleFillNow(doc.id)}
                      disabled={fillLoading === doc.id}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                    >
                      {fillLoading === doc.id ? (
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <FilePlus className="w-3 h-3 mr-1" />
                      )}
                      Fill Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Completed Forms */}
        <TabsContent value="fills" className="mt-4">
          <Card className="bg-white/10 border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">Completed &amp; In-Progress Forms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 px-3 text-gray-400 font-medium">Document</th>
                      <th className="text-left py-2 px-3 text-gray-400 font-medium">Date</th>
                      <th className="text-center py-2 px-3 text-gray-400 font-medium">Status</th>
                      <th className="text-center py-2 px-3 text-gray-400 font-medium">Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fills.map((fill) => (
                      <tr key={fill.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-2 px-3 text-white">{fill.document_name}</td>
                        <td className="py-2 px-3 text-gray-300">
                          {new Date(fill.created).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Badge className={FILL_STATUS_COLORS[fill.status]}>
                            {fill.status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-center">
                          {fill.download_url ? (
                            <a
                              href={fill.download_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-white/20 text-gray-300 hover:bg-white/10 text-xs"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </Button>
                            </a>
                          ) : (
                            <span className="text-gray-500 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
