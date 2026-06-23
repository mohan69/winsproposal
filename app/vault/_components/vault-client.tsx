"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Archive, Upload, Search, FileText, Trash2, Edit2, Check, X,
  ChevronDown, ChevronUp, Loader2, AlertCircle, Tag, Calendar, Image as ImageIcon,
  Clock, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const DOCUMENT_TYPES = [
  "RFQ / Tender Document",
  "Customer Technical Specification",
  "Customer Commercial Terms",
  "Bid Instructions",
  "Approved Vendor List",
  "Project Datasheet",
  "Line List",
  "Valve Schedule",
  "Control Valve Datasheet",
  "Severe Service Datasheet",
  "Actuator Datasheet",
  "Positioner / Accessories Datasheet",
  "Instrument Datasheet",
  "Valve Sizing Calculation",
  "Noise Calculation",
  "Cavitation / Flashing Analysis",
  "Material Specification",
  "Trim / Seat / Plug Details",
  "ITP / QAP",
  "Test Procedure",
  "Painting / Coating Specification",
  "Welding / NDE Specification",
  "GA Drawing",
  "Sectional Drawing",
  "Assembly Drawing",
  "Hook-up Drawing",
  "P&ID",
  "Process Flow Diagram",
  "Instrument Loop Diagram",
  "Past Proposal",
  "Price List",
  "Cost Sheet",
  "Discount Policy",
  "Delivery Schedule",
  "Payment Terms",
  "Warranty Terms",
  "Deviation / Exception List",
  "Compliance Matrix",
  "Technical Clarification",
  "Commercial Clarification",
  "ISO Certificate",
  "PED / CE Certificate",
  "ATEX / SIL Certificate",
  "Material Test Certificate",
  "Hydro Test Certificate",
  "Calibration Certificate",
  "Inspection Report",
  "Third Party Inspection Document",
  "Case Study",
  "Installed Base Reference",
  "Competitor Document",
  "Product Brochure",
  "Product Manual",
  "Application Note",
  "Troubleshooting Note",
  "Lessons Learned",
  "Product Image / Photo",
  "Architecture Drawing",
  "Other",
] as const;

const DOCUMENT_TYPE_GROUPS: { label: string; items: string[] }[] = [
  { label: "Bid & Tender", items: ["RFQ / Tender Document", "Customer Technical Specification", "Customer Commercial Terms", "Bid Instructions", "Approved Vendor List"] },
  { label: "Datasheets & Schedules", items: ["Project Datasheet", "Line List", "Valve Schedule", "Control Valve Datasheet", "Severe Service Datasheet", "Actuator Datasheet", "Positioner / Accessories Datasheet", "Instrument Datasheet"] },
  { label: "Calculations & Analysis", items: ["Valve Sizing Calculation", "Noise Calculation", "Cavitation / Flashing Analysis"] },
  { label: "Specifications", items: ["Material Specification", "Trim / Seat / Plug Details", "ITP / QAP", "Test Procedure", "Painting / Coating Specification", "Welding / NDE Specification"] },
  { label: "Drawings", items: ["GA Drawing", "Sectional Drawing", "Assembly Drawing", "Hook-up Drawing", "P&ID", "Process Flow Diagram", "Instrument Loop Diagram"] },
  { label: "Commercial", items: ["Past Proposal", "Price List", "Cost Sheet", "Discount Policy", "Delivery Schedule", "Payment Terms", "Warranty Terms", "Deviation / Exception List"] },
  { label: "Compliance & Quality", items: ["Compliance Matrix", "Technical Clarification", "Commercial Clarification", "ISO Certificate", "PED / CE Certificate", "ATEX / SIL Certificate", "Material Test Certificate", "Hydro Test Certificate", "Calibration Certificate"] },
  { label: "Inspection", items: ["Inspection Report", "Third Party Inspection Document"] },
  { label: "Reference", items: ["Case Study", "Installed Base Reference", "Competitor Document", "Product Brochure", "Product Manual", "Application Note", "Troubleshooting Note", "Lessons Learned"] },
  { label: "Other", items: ["Product Image / Photo", "Architecture Drawing", "Other"] },
];

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "svg", "webp"];

interface VaultDoc {
  id: string;
  filename: string;
  fileType: string;
  documentType: string | null;
  industry: string;
  tags: string[];
  status: string;
  errorReason: string | null;
  extractedSectionsCount: number;
  uploadedAt: string;
  cloudStoragePath: string | null;
  isPublic: boolean;
  sections: VaultSection[];
}

interface VaultSection {
  id: string;
  sectionTitle: string;
  content: string;
  sectionType: string | null;
  industryTags: string[];
}

function StatusBadge({ status, errorReason }: { status: string; errorReason?: string | null }) {
  const config: Record<string, { color: string; icon: any; label: string }> = {
    uploaded: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: Clock, label: "Uploaded" },
    parsing: { color: "bg-amber-100 text-amber-700 border-amber-200", icon: Loader2, label: "Parsing" },
    parsed: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2, label: "Parsed" },
    parse_failed: { color: "bg-rose-100 text-rose-700 border-rose-200", icon: AlertTriangle, label: "Parse Failed" },
    indexed: { color: "bg-violet-100 text-violet-700 border-violet-200", icon: CheckCircle2, label: "Indexed" },
  };
  const c = config[status] ?? { color: "bg-gray-100 text-gray-700 border-gray-200", icon: AlertCircle, label: status };
  const Icon = c.icon;
  return (
    <span title={errorReason ?? ""} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${c.color}`}>
      <Icon className={`w-3 h-3 ${status === "parsing" ? "animate-spin" : ""}`} />
      {c.label}
    </span>
  );
}

export function VaultClient() {
  const [documents, setDocuments] = useState<VaultDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [editingDoc, setEditingDoc] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [sectionEditValues, setSectionEditValues] = useState<any>({});
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; docId?: string } | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>("");
  const [searchDocType, setSearchDocType] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<any>(null);

  const fetchDocuments = useCallback(async (q: string = "", dt: string = "") => {
    try {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      if (dt) params.set("documentType", dt);
      const res = await fetch(`/api/vault${params.toString() ? `?${params.toString()}` : ""}`);
      const data = await res.json().catch(() => []);
      setDocuments(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  function handleSearchChange(val: string) {
    setSearch(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchDocuments(val, searchDocType), 400);
  }

  function handleDocTypeFilterChange(val: string) {
    const dt = val === "all" ? "" : val;
    setSearchDocType(dt);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchDocuments(search, dt), 400);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e?.target?.files?.[0];
    if (!file) return;
    const ext = file?.name?.split(".")?.pop()?.toLowerCase() ?? "";
    const allSupported = ["pdf", "docx", "txt", ...IMAGE_EXTENSIONS];
    if (!allSupported.includes(ext)) {
      toast.error("Excel/CSV parsing is not yet supported. Supported: PDF, DOCX, TXT, JPG, PNG, SVG, WebP");
      return;
    }
    const isImage = IMAGE_EXTENSIONS.includes(ext);
    if ((file?.size ?? 0) > 20 * 1024 * 1024) {
      toast.error("File size must be under 20MB");
      return;
    }

    setUploading(true);
    try {
      // Get presigned URL
      const presignedRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type || "application/octet-stream", isPublic: false }),
      });
      const presignedData = await presignedRes.json().catch(() => ({}));
      if (!presignedRes?.ok) throw new Error(presignedData?.error ?? "Failed to get upload URL");

        // Upload directly to cloud storage
        const uploadUrl = presignedData?.uploadUrl ?? "";
        const cloud_storage_path = presignedData?.cloud_storage_path ?? "";
        const uploadHeaders: Record<string, string> = {
          "Content-Type": file.type || "application/octet-stream",
          ...(presignedData?.uploadHeaders ?? {}),
        };
      if (uploadUrl?.includes("content-disposition")) {
        uploadHeaders["Content-Disposition"] = "attachment";
      }
      const storageRes = await fetch(uploadUrl, { method: "PUT", body: file, headers: uploadHeaders });
      if (!storageRes?.ok) throw new Error("Failed to upload file to storage");

      // Create vault document record
      const createRes = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          fileType: ext,
          cloudStoragePath: cloud_storage_path,
          isPublic: isImage,
          documentType: selectedDocType || null,
        }),
      });
      const doc = await createRes.json().catch(() => ({}));
      if (!createRes?.ok) throw new Error(doc?.error ?? "Failed to save document");

      if (isImage) {
        // Images don't need AI processing
        toast.success("Image uploaded successfully!");
        setSelectedDocType("");
        fetchDocuments(search, searchDocType);
      } else {
        toast.success("File uploaded! Processing with AI...");
        setUploading(false);
        setProcessing(doc?.id ?? null);
        fetchDocuments(search, searchDocType);

        // Process with AI
        const formData = new FormData();
        formData.append("file", file);
        formData.append("documentId", doc?.id ?? "");
        const processRes = await fetch("/api/vault/process", { method: "POST", body: formData });
        const processData = await processRes.json().catch(() => ({}));
        if (!processRes?.ok) {
          // Document record already saved with status; show the error
          const errorMsg = processData?.error ?? "AI processing failed";
          if (processData?.detail) {
            toast.warning(processData.detail);
          } else {
            toast.warning(errorMsg);
          }
          fetchDocuments(search, searchDocType);
          return;
        }

        toast.success(`Document processed! ${processData?.extractedSectionsCount ?? 0} sections extracted.`);
        fetchDocuments(search, searchDocType);
      }
      } catch (err: any) {
        const message = err?.message ?? "Upload failed";
        if (message?.toLowerCase()?.includes("scanned") || message?.toLowerCase()?.includes("ocr")) {
          toast.error("Scanned PDF detected: OCR is not supported. Upload a text-based PDF or add knowledge manually via Text Entries.");
        } else if (message?.toLowerCase()?.includes("unsupported")) {
          toast.error(message);
        } else if (message?.toLowerCase()?.includes("empty") || message?.toLowerCase()?.includes("no sections")) {
          toast.warning("Document uploaded but no text could be extracted. Try a different format or use Text Entries.");
        } else {
          toast.error(message);
        }
        // Fetch docs again to show updated status
        fetchDocuments(search, searchDocType);
      } finally {
      setUploading(false);
      setProcessing(null);
      if (fileInputRef?.current) fileInputRef.current.value = "";
    }
  }

  async function handleDeleteDoc(id: string) {
    try {
      const res = await fetch(`/api/vault/${id}`, { method: "DELETE" });
      if (!res?.ok) throw new Error("Delete failed");
      toast.success("Document deleted");
      setDocuments((prev: VaultDoc[]) => (prev ?? [])?.filter((d: VaultDoc) => d?.id !== id));
    } catch { toast.error("Failed to delete document"); }
    setDeleteTarget(null);
  }

  async function handleDeleteSection(docId: string, sectionId: string) {
    try {
      const res = await fetch(`/api/vault/${docId}/sections?sectionId=${sectionId}`, { method: "DELETE" });
      if (!res?.ok) throw new Error("Delete failed");
      toast.success("Section deleted");
      fetchDocuments(search);
    } catch { toast.error("Failed to delete section"); }
    setDeleteTarget(null);
  }

  async function handleSaveDocEdit(id: string) {
    try {
      const res = await fetch(`/api/vault/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });
      if (!res?.ok) throw new Error("Update failed");
      toast.success("Document updated");
      fetchDocuments(search);
      setEditingDoc(null);
    } catch { toast.error("Failed to update"); }
  }

  async function handleSaveSectionEdit(docId: string, sectionId: string) {
    try {
      const res = await fetch(`/api/vault/${docId}/sections`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId, ...sectionEditValues }),
      });
      if (!res?.ok) throw new Error("Update failed");
      toast.success("Section updated");
      fetchDocuments(search);
      setEditingSection(null);
    } catch { toast.error("Failed to update section"); }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search documents, tags, content..." value={search ?? ""} onChange={(e: any) => handleSearchChange(e?.target?.value ?? "")} className="pl-10" />
        </div>
        <div className="flex items-center gap-2">
          <Select value={searchDocType} onValueChange={handleDocTypeFilterChange}>
            <SelectTrigger className="w-52 h-9">
              <SelectValue placeholder="Filter by type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {DOCUMENT_TYPE_GROUPS.map((group) => (
                <SelectGroup key={group.label}>
                  <SelectLabel className="text-xs font-semibold text-muted-foreground px-2 py-1">{group.label}</SelectLabel>
                  {group.items.map((dt) => (
                    <SelectItem key={dt} value={dt}>{dt}</SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedDocType} onValueChange={setSelectedDocType}>
            <SelectTrigger className="w-48 h-9">
              <SelectValue placeholder="Document type..." />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPE_GROUPS.map((group) => (
                <SelectGroup key={group.label}>
                  <SelectLabel className="text-xs font-semibold text-muted-foreground px-2 py-1">{group.label}</SelectLabel>
                  {group.items.map((dt) => (
                    <SelectItem key={dt} value={dt}>{dt}</SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.svg,.webp" className="hidden" onChange={handleUpload} />
          <Button onClick={() => fileInputRef?.current?.click?.()} disabled={uploading || !!processing}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            {uploading ? "Uploading..." : processing ? "Processing..." : "Upload"}
          </Button>
        </div>
      </div>

      {processing && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-sm text-blue-800">AI is analyzing your document and extracting sections...</span>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (documents?.length ?? 0) === 0 ? (
        <Card className="shadow-md border-0">
          <CardContent className="p-12 text-center">
            <Archive className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold mb-2">No Documents Yet</h3>
            <p className="text-muted-foreground mb-4">Upload past proposals, technical specs, or datasheets to build your knowledge vault.</p>
            <Button onClick={() => fileInputRef?.current?.click?.()}>
              <Upload className="w-4 h-4 mr-2" /> Upload Your First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {documents?.map((doc: VaultDoc) => (
            <Card key={doc?.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {IMAGE_EXTENSIONS.includes(doc?.fileType ?? "") ? (
                        <ImageIcon className="w-4 h-4 text-violet-500 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                      )}
                      <span className="font-medium truncate">{doc?.filename}</span>
                      <StatusBadge status={doc?.status ?? "uploaded"} errorReason={doc?.errorReason} />
                      <Badge variant="secondary" className="text-xs">{doc?.industry}</Badge>
                      {doc?.documentType && <Badge variant="outline" className="text-xs bg-violet-50 text-violet-700 border-violet-200">{doc.documentType}</Badge>}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(doc?.uploadedAt ?? "").toLocaleDateString()}
                      </span>
                    </div>
                    {editingDoc === doc?.id ? (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-16">Industry:</span>
                          <Select value={editValues?.industry ?? doc?.industry} onValueChange={(v: string) => setEditValues((p: any) => ({ ...(p ?? {}), industry: v }))}>
                            <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Valves">Valves</SelectItem>
                              <SelectItem value="Pumps">Pumps</SelectItem>
                              <SelectItem value="EPC">EPC</SelectItem>
                              <SelectItem value="General">General</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-16">Tags:</span>
                          <Input value={(editValues?.tags ?? doc?.tags ?? [])?.join(", ")} onChange={(e: any) => setEditValues((p: any) => ({ ...(p ?? {}), tags: (e?.target?.value ?? "")?.split(",")?.map((t: string) => t?.trim())?.filter(Boolean) }))} className="h-8" placeholder="tag1, tag2, tag3" />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSaveDocEdit(doc?.id)}><Check className="w-3 h-3 mr-1" /> Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingDoc(null)}><X className="w-3 h-3 mr-1" /> Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {(doc?.tags ?? [])?.map((tag: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs"><Tag className="w-3 h-3 mr-1" />{tag}</Badge>
                          ))}
                          <span className="text-xs text-muted-foreground">{doc?.extractedSectionsCount ?? 0} sections</span>
                        </div>
                        {doc?.status === "parse_failed" && doc?.errorReason && (
                          <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                            <AlertTriangle className="w-3 h-3" />
                            {doc.errorReason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingDoc(doc?.id); setEditValues({ industry: doc?.industry, tags: [...(doc?.tags ?? [])] }); }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget({ type: "doc", id: doc?.id })}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setExpandedDoc(expandedDoc === doc?.id ? null : doc?.id)}>
                      {expandedDoc === doc?.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {expandedDoc === doc?.id && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    {(doc?.sections?.length ?? 0) === 0 ? (
                      <p className="text-sm text-muted-foreground">No sections extracted yet.</p>
                    ) : (
                      doc?.sections?.map((sec: VaultSection) => (
                        <div key={sec?.id} className="bg-muted/50 rounded-lg p-3">
                          {editingSection === sec?.id ? (
                            <div className="space-y-2">
                              <Input value={sectionEditValues?.sectionTitle ?? sec?.sectionTitle} onChange={(e: any) => setSectionEditValues((p: any) => ({ ...(p ?? {}), sectionTitle: e?.target?.value ?? "" }))} className="h-8 font-medium" />
                              <Textarea value={sectionEditValues?.content ?? sec?.content} onChange={(e: any) => setSectionEditValues((p: any) => ({ ...(p ?? {}), content: e?.target?.value ?? "" }))} rows={6} />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleSaveSectionEdit(doc?.id, sec?.id)}><Check className="w-3 h-3 mr-1" /> Save</Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingSection(null)}><X className="w-3 h-3 mr-1" /> Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{sec?.sectionTitle}</span>
                                  {sec?.sectionType && <Badge variant="outline" className="text-xs">{sec?.sectionType}</Badge>}
                                </div>
                                <div className="flex gap-1">
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditingSection(sec?.id); setSectionEditValues({ sectionTitle: sec?.sectionTitle, content: sec?.content }); }}>
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => setDeleteTarget({ type: "section", id: sec?.id, docId: doc?.id })}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{(sec?.content ?? "")?.substring(0, 500)}{(sec?.content?.length ?? 0) > 500 ? "..." : ""}</p>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "doc" ? "This will permanently delete the document and all its sections." : "This will permanently delete this section."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => {
              if (deleteTarget?.type === "doc") handleDeleteDoc(deleteTarget?.id);
              else if (deleteTarget?.type === "section" && deleteTarget?.docId) handleDeleteSection(deleteTarget.docId, deleteTarget.id);
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
