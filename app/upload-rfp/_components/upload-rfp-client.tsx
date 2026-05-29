"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Upload, FileText, Loader2, CheckCircle, AlertCircle,
  List, ClipboardCheck, Target, FileBarChart, Zap, LayoutTemplate, Building2, Wrench, BrainCircuit, SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { TEMPLATES, VALVE_SUBTYPES, PUMP_SUBTYPES } from "@/lib/templates";
import { inferRfpIntelligence, type RfpIntelligence } from "@/lib/severe-service-intelligence";
import { GoNoGoPanel } from "./go-no-go-panel";

export function UploadRfpClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rfpId, setRfpId] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [fileName, setFileName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("General");
  const [subType, setSubType] = useState<string>("");
  const [rfpIntelligence, setRfpIntelligence] = useState<RfpIntelligence | null>(null);
  const [showAdvancedOverride, setShowAdvancedOverride] = useState(false);
  const [companySize, setCompanySize] = useState<string>("enterprise");

  // Determine which sub-types to show
  const showValveSubTypes = selectedTemplate === "valve-oem";
  const showPumpSubTypes = selectedTemplate === "pump-oem";
  const subTypeOptions = showValveSubTypes ? VALVE_SUBTYPES : showPumpSubTypes ? PUMP_SUBTYPES : [];

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e?.target?.files?.[0];
    if (!file) return;
    const ext = file?.name?.split(".")?.pop()?.toLowerCase() ?? "";
    if (!["pdf", "docx", "txt"].includes(ext)) {
      toast.error("Only PDF, DOCX, and TXT files are supported");
      return;
    }
    if ((file?.size ?? 0) > 20 * 1024 * 1024) {
      toast.error("File size must be under 20MB");
      return;
    }

    setUploading(true);
    setFileName(file?.name ?? "");
    try {
      let cloud_storage_path: string | null = null;

      try {
        // Cloud storage is useful for audit trail, but parsing can still proceed from
        // the selected browser file if storage upload is unavailable in a demo.
        const presignedRes = await fetch("/api/upload/presigned", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, contentType: file.type || "application/octet-stream", isPublic: false }),
        });
        const presignedData = await presignedRes.json().catch(() => ({}));
        if (!presignedRes?.ok) throw new Error(presignedData?.error ?? "Failed to get upload URL");

          // Upload directly to cloud storage
          const uploadUrl = presignedData?.uploadUrl ?? "";
          cloud_storage_path = presignedData?.cloud_storage_path ?? null;
          const uploadHeaders: Record<string, string> = {
            "Content-Type": file.type || "application/octet-stream",
            ...(presignedData?.uploadHeaders ?? {}),
          };
        if (uploadUrl?.includes("content-disposition")) {
          uploadHeaders["Content-Disposition"] = "attachment";
        }
        const uploadRes = await fetch(uploadUrl, { method: "PUT", body: file, headers: uploadHeaders });
        if (!uploadRes?.ok) throw new Error(`Cloud upload failed (${uploadRes?.status})`);
      } catch (storageErr: any) {
        console.warn("Cloud upload skipped; continuing with parser-only RFP upload:", storageErr?.message ?? storageErr);
        cloud_storage_path = null;
      }

      // Create RFP record
      const createRes = await fetch("/api/rfp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, fileType: ext, cloudStoragePath: cloud_storage_path, isPublic: false }),
      });
      const rfp = await createRes.json().catch(() => ({}));
      if (!createRes?.ok) throw new Error("Failed to create RFP record");
      setRfpId(rfp?.id ?? null);

      toast.success("File uploaded! Parsing with AI...");
      setUploading(false);
      setParsing(true);

      // Parse RFP
      const formData = new FormData();
      formData.append("file", file);
      formData.append("rfpId", rfp?.id ?? "");
      const parseRes = await fetch("/api/rfp/parse", { method: "POST", body: formData });
      const parseData = await parseRes.json().catch(() => ({}));
      if (!parseRes?.ok) throw new Error(parseData?.error ?? "Parsing failed");

      setExtractedData(parseData?.extractedData ?? null);
      setRfpIntelligence(inferRfpIntelligence(parseData?.extractedData ?? null));
      toast.success("RFP parsed successfully!");
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setUploading(false);
      setParsing(false);
      if (fileInputRef?.current) fileInputRef.current.value = "";
    }
  }

  async function handleGenerate() {
    if (!rfpId) return;
    setGenerating(true);
    setProgress(0);
    try {
      const response = await fetch("/api/proposals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfpId,
          templateType: showAdvancedOverride ? selectedTemplate : "auto",
          companySize,
          subType: showAdvancedOverride ? (subType || undefined) : undefined,
        }),
      });

      if (!response?.ok) {
        const err = await response?.json().catch(() => ({}));
        throw new Error(err?.error ?? "Generation failed");
      }

      const reader = response?.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let partialRead = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        partialRead += decoder.decode(value, { stream: true });
        const lines = partialRead.split("\n");
        partialRead = lines?.pop() ?? "";

        for (const line of lines) {
          if (line?.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") return;
            try {
              const parsed = JSON.parse(data);
              if (parsed?.status === "processing") {
                setProgress((prev: number) => Math.min((prev ?? 0) + 2, 95));
              } else if (parsed?.status === "completed") {
                const proposalId = parsed?.result?.proposal?.id;
                toast.success("Proposal generated successfully!");
                if (proposalId) router.push(`/proposals/${proposalId}`);
                return;
              } else if (parsed?.status === "error") {
                throw new Error(parsed?.message ?? "Generation failed");
              }
            } catch (parseErr: any) {
              if (parseErr?.message?.includes("Generation failed") || parseErr?.message?.includes("Failed")) throw parseErr;
            }
          }
        }
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Proposal generation failed");
    } finally {
      setGenerating(false);
    }
  }

  const requirements = extractedData?.requirements ?? [];
  const lineItems = extractedData?.lineItems ?? [];
  const compliance = extractedData?.complianceRequirements ?? [];
  const criteria = extractedData?.evaluationCriteria ?? [];

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Upload className="w-7 h-7 text-primary" />
          Upload RFP
        </h1>
        <p className="text-muted-foreground mt-1">Upload an RFP or Material Requisition document. AI will parse it and generate a winning proposal.</p>
      </div>

      {!extractedData ? (
        <Card className="shadow-md border-0">
          <CardContent className="p-8">
            <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer" onClick={() => fileInputRef?.current?.click?.()}>
              <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleUpload} />
              {uploading || parsing ? (
                <>
                  <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                  <p className="font-medium text-lg">{uploading ? "Uploading file..." : "AI is parsing your RFP..."}</p>
                  <p className="text-sm text-muted-foreground mt-1">This may take a minute for large documents</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <p className="font-medium text-lg mb-1">Drop your RFP here or click to browse</p>
                  <p className="text-sm text-muted-foreground">Supports PDF, DOCX, TXT up to 20MB</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Parsed RFP Header */}
          <Card className="shadow-md border-0 bg-emerald-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-emerald-800">{fileName} parsed successfully</p>
                  <p className="text-sm text-emerald-700">{extractedData?.title ?? "RFP"} • {extractedData?.industry ?? "General"}</p>
                </div>
              </div>
              {rfpIntelligence && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <BrainCircuit className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <p className="font-semibold text-emerald-950">RFP Intelligence</p>
                        <Badge variant="outline" className="border-emerald-300 text-emerald-800 capitalize">{rfpIntelligence.confidence} confidence</Badge>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-emerald-700 font-medium">Recommended template</p>
                          <p className="text-emerald-950">{rfpIntelligence.templateName}</p>
                        </div>
                        <div>
                          <p className="text-emerald-700 font-medium">Application</p>
                          <p className="text-emerald-950">{rfpIntelligence.application}</p>
                        </div>
                        <div>
                          <p className="text-emerald-700 font-medium">Valve / service type</p>
                          <p className="text-emerald-950">{rfpIntelligence.valveType}</p>
                        </div>
                        <div>
                          <p className="text-emerald-700 font-medium">Standards detected</p>
                          <p className="text-emerald-950">{rfpIntelligence.standardsDetected.slice(0, 4).join(", ")}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {rfpIntelligence.recommendedEngineeringOutputs.slice(0, 5).map((output) => (
                          <Badge key={output} variant="secondary" className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100">{output}</Badge>
                        ))}
                        <Badge variant="outline" className="border-emerald-300 text-emerald-800">{rfpIntelligence.recommendedSections.length} sections</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {showAdvancedOverride && (
                <div className="rounded-lg border border-emerald-200 bg-white/70 p-3 mb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <LayoutTemplate className="w-4 h-4 text-emerald-700" />
                      <span className="text-sm font-medium text-emerald-800">Template:</span>
                      <Select value={selectedTemplate} onValueChange={(v) => { setSelectedTemplate(v); setSubType(""); }}>
                        <SelectTrigger className="w-[220px] h-9 bg-white border-emerald-200">
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General">General Template</SelectItem>
                          {TEMPLATES.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {subTypeOptions.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-emerald-700" />
                        <span className="text-sm font-medium text-emerald-800">Type:</span>
                        <Select value={subType} onValueChange={setSubType}>
                          <SelectTrigger className="w-[260px] h-9 bg-white border-emerald-200">
                            <SelectValue placeholder={showValveSubTypes ? "Select valve type" : "Select pump type"} />
                          </SelectTrigger>
                          <SelectContent>
                            {subTypeOptions.map((st) => (
                              <SelectItem key={st.id} value={st.id}>
                                {st.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-700" />
                  <span className="text-sm font-medium text-emerald-800">Size:</span>
                  <Select value={companySize} onValueChange={setCompanySize}>
                    <SelectTrigger className="w-[180px] h-9 bg-white border-emerald-200">
                      <SelectValue placeholder="Company size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="startup">Startup</SelectItem>
                      <SelectItem value="sme">SME</SelectItem>
                      <SelectItem value="mid_market">Mid-Market</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="conglomerate">Conglomerate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant="outline" onClick={() => setShowAdvancedOverride((value) => !value)} className="border-emerald-200 text-emerald-800">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  {showAdvancedOverride ? "Hide Override" : "Advanced Override"}
                </Button>
                <Button onClick={handleGenerate} disabled={generating} className="bg-emerald-600 hover:bg-emerald-700 text-white ml-auto">
                  {generating ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating ({progress}%)...</>
                  ) : (
                    <><Zap className="w-4 h-4 mr-2" />Accept & Generate Proposal</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Go/No-Go Assessment */}
          {rfpId && (
            <GoNoGoPanel rfpId={rfpId} industry={extractedData?.industry ?? "General"} />
          )}

          {extractedData?.summary && (
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <h3 className="font-display font-semibold flex items-center gap-2 mb-2"><FileBarChart className="w-4 h-4 text-primary" /> Summary</h3>
                <p className="text-sm text-muted-foreground">{extractedData?.summary}</p>
              </CardContent>
            </Card>
          )}

          {(requirements?.length ?? 0) > 0 && (
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <h3 className="font-display font-semibold flex items-center gap-2 mb-3"><List className="w-4 h-4 text-primary" /> Requirements ({requirements?.length})</h3>
                <div className="space-y-2">
                  {requirements?.map((r: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Badge variant="outline" className="text-xs shrink-0 mt-0.5">{r?.category ?? "general"}</Badge>
                      <span>{r?.description ?? String(r)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {(lineItems?.length ?? 0) > 0 && (
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <h3 className="font-display font-semibold flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-primary" /> Line Items ({lineItems?.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b"><th className="text-left p-2 font-medium">Item</th><th className="text-left p-2 font-medium">Description</th><th className="text-left p-2 font-medium">Qty</th><th className="text-left p-2 font-medium">Specs</th></tr></thead>
                    <tbody>
                      {lineItems?.map((l: any, i: number) => (
                        <tr key={i} className="border-b last:border-0"><td className="p-2">{l?.item}</td><td className="p-2 text-muted-foreground">{l?.description}</td><td className="p-2">{l?.quantity}</td><td className="p-2 text-muted-foreground">{l?.specifications}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {(compliance?.length ?? 0) > 0 && (
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <h3 className="font-display font-semibold flex items-center gap-2 mb-3"><ClipboardCheck className="w-4 h-4 text-primary" /> Compliance Requirements</h3>
                <ul className="space-y-1">
                  {compliance?.map((c: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm"><CheckCircle className="w-3 h-3 text-emerald-500 shrink-0 mt-1" />{c}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {(criteria?.length ?? 0) > 0 && (
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <h3 className="font-display font-semibold flex items-center gap-2 mb-3"><Target className="w-4 h-4 text-primary" /> Evaluation Criteria</h3>
                <ul className="space-y-1">
                  {criteria?.map((c: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm"><span className="text-primary font-mono text-xs mt-0.5">{i + 1}.</span>{c}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
