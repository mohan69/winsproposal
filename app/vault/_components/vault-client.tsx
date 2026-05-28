"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Archive, Upload, Search, FileText, Trash2, Edit2, Check, X,
  ChevronDown, ChevronUp, Loader2, AlertCircle, Tag, Calendar, Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const DOCUMENT_TYPES = [
  "Technical Specification",
  "Datasheet",
  "GA Drawing",
  "P&ID",
  "Process Flow Diagram",
  "Architecture Drawing",
  "Product Image/Photo",
  "Past Proposal",
  "Certificate",
  "Other",
] as const;

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "svg", "webp"];

interface VaultDoc {
  id: string;
  filename: string;
  fileType: string;
  documentType: string | null;
  industry: string;
  tags: string[];
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<any>(null);

  const fetchDocuments = useCallback(async (q: string = "") => {
    try {
      const res = await fetch(`/api/vault${q ? `?search=${encodeURIComponent(q)}` : ""}`);
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
    searchTimeout.current = setTimeout(() => fetchDocuments(val), 400);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e?.target?.files?.[0];
    if (!file) return;
    const ext = file?.name?.split(".")?.pop()?.toLowerCase() ?? "";
    const allSupported = ["pdf", "docx", "txt", ...IMAGE_EXTENSIONS];
    if (!allSupported.includes(ext)) {
      toast.error("Supported formats: PDF, DOCX, TXT, JPG, PNG, SVG");
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
        fetchDocuments(search);
      } else {
        toast.success("File uploaded! Processing with AI...");
        setUploading(false);
        setProcessing(doc?.id ?? null);

        // Process with AI
        const formData = new FormData();
        formData.append("file", file);
        formData.append("documentId", doc?.id ?? "");
        const processRes = await fetch("/api/vault/process", { method: "POST", body: formData });
        const processData = await processRes.json().catch(() => ({}));
        if (!processRes?.ok) throw new Error(processData?.error ?? "AI processing failed");

        toast.success(`Document processed! ${processData?.extractedSectionsCount ?? 0} sections extracted.`);
        fetchDocuments(search);
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
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
          <Select value={selectedDocType} onValueChange={setSelectedDocType}>
            <SelectTrigger className="w-48 h-9">
              <SelectValue placeholder="Document type..." />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map((dt) => (
                <SelectItem key={dt} value={dt}>{dt}</SelectItem>
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
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {(doc?.tags ?? [])?.map((tag: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs"><Tag className="w-3 h-3 mr-1" />{tag}</Badge>
                        ))}
                        <span className="text-xs text-muted-foreground">{doc?.extractedSectionsCount ?? 0} sections</span>
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
