"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Edit2, Check, X, FileText, Database,
  Loader2, Zap, Calendar, Shield, CheckCircle, Table, Copy, Download, Trophy,
  Send, ThumbsUp, ThumbsDown, Clock, GitBranch, FileDown, Network,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TbePanel } from "./tbe-panel";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { EngineeringDrawing } from "@/components/engineering-drawing";
import { VISUALIZATION_TYPES, getBestVisualizationType, getFallbackVisualization, getVisualizationTypeMeta, shouldRenderProposalDiagram, type VisualizationType } from "@/lib/visualization-service";
import { getSevereServiceVaultSourceCategories, inferRfpIntelligence, parseProposalTemplateMetadata } from "@/lib/severe-service-intelligence";
import {
  buildEngineeringArtifact,
  getProposalVisualSpec,
  PROPOSAL_STAGE_VISUAL_DISCLAIMER,
  type EngineeringArtifact,
} from "@/lib/engineering-artifacts";

interface ComplianceItem {
  id: string;
  label: string;
  standard: string;
  checked: boolean;
}

interface ProposalSection {
  id: string;
  sectionTitle: string;
  content: string;
  sourceType: string;
  sourceId: string | null;
  sourceName: string | null;
  orderIndex: number;
}

function EngineeringArtifactBlock({ artifact }: { artifact: EngineeringArtifact }) {
  function renderVisual(visual: NonNullable<EngineeringArtifact["visuals"]>[number]) {
    const spec = getProposalVisualSpec(visual);

    return (
      <div className="printable-artifact-visual rounded-lg border border-blue-100 bg-slate-50 p-3">
        <div className="flex flex-wrap items-stretch gap-2">
          {spec.nodes.map((node, index) => (
            <div key={`${visual.title}-${node}`} className="flex min-w-[120px] flex-1 items-center gap-2">
              <div className={cn(
                "flex min-h-[44px] flex-1 items-center justify-center rounded-md border bg-white px-2 py-2 text-center text-[11px] font-semibold text-slate-800 shadow-sm",
                node === spec.primary && "border-blue-300 bg-blue-50 text-blue-800"
              )}>
                {node}
              </div>
              {index < spec.nodes.length - 1 && <span className="shrink-0 text-sm font-bold text-blue-500">→</span>}
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 border-t border-dashed border-slate-300 pt-3">
          {(spec.support ?? []).map((item) => (
            <span key={item} className="rounded-full border border-dashed border-blue-300 bg-white px-3 py-1 text-[11px] font-semibold text-blue-700">
              {item}
            </span>
          ))}
        </div>
        <div className="mt-3 grid gap-1.5 border-t border-slate-200 pt-3 sm:grid-cols-2">
          {(spec.annotations ?? []).map((item) => (
            <span key={item} className="rounded bg-white px-2 py-1 text-[10px] font-medium text-slate-600">
              {item}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="printable-artifact mt-4 rounded-lg border border-blue-100 bg-slate-50/80 p-4" data-print-artifact="true">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">
            {artifact.artifactType === "drawing_package" ? "Proposal-grade technical visual" : "Proposal-grade engineering artifact"}
          </p>
          <h4 className="font-semibold text-slate-950">{artifact.title}</h4>
          <p className="text-xs text-muted-foreground">
            {artifact.applicationType} | {artifact.renderedLayoutType.replace(/_/g, " ")}
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 bg-white text-blue-700 border-blue-200">
          {artifact.artifactType.replace(/_/g, " ")}
        </Badge>
      </div>
      {artifact.disclaimer && (
        <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {artifact.disclaimer}
        </div>
      )}
      {artifact.artifactType === "drawing_package" && (
        <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {PROPOSAL_STAGE_VISUAL_DISCLAIMER}
        </div>
      )}
      {(artifact.tables ?? []).map((table, tableIndex) => (
        <div key={tableIndex} className="mb-4 overflow-x-auto rounded-md border bg-white">
          {table.title && (
            <div className="border-b bg-white px-3 py-2 text-xs font-semibold text-slate-800">
              {table.title}
            </div>
          )}
          <table className={cn("w-full text-xs", table.layout === "compact" ? "min-w-[640px]" : "min-w-[900px]")}>
            <thead>
              <tr className="bg-slate-100">
                {table.columns.map((column) => (
                  <th key={column} className="border-b px-3 py-2 text-left font-semibold text-slate-700">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b last:border-b-0">
                  {row.map((cell, cellIndex) => (
                    <td key={`${rowIndex}-${cellIndex}`} className="px-3 py-2 align-top text-slate-700">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {(artifact.drawingPackages ?? []).length > 0 && (
        <div className="grid gap-4">
          {artifact.drawingPackages?.map((drawing) => (
            <EngineeringDrawing key={drawing.titleBlock.drawingNo} drawing={drawing} />
          ))}
        </div>
      )}
      {!(artifact.drawingPackages ?? []).length && (artifact.visuals ?? []).length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {artifact.visuals?.map((visual) => (
            <div key={visual.title} className="rounded-md border bg-white p-3">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="font-medium text-sm text-slate-950">{visual.title}</p>
                  <p className="text-xs text-muted-foreground">{getProposalVisualSpec(visual).visualLabel}</p>
                </div>
              </div>
              {renderVisual(visual)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ProposalData {
  id: string;
  title: string;
  status: string;
  industry: string;
  templateType: string;
  vaultSectionsUsed: number;
  vaultDocumentsUsed: number;
  createdAt: string;
  companySize: string | null;
  approvalStatus: string;
  approvedAt: string | null;
  rejectionReason: string | null;
  sections: ProposalSection[];
  rfp: any;
  complianceChecklist: {
    id: string;
    checklistItems: ComplianceItem[];
  } | null;
}

export function ProposalDetailClient({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const { data: session } = useSession() || {};
  const isAdmin = (session?.user as any)?.role === "admin";
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [checklistItems, setChecklistItems] = useState<ComplianceItem[]>([]);
  const [savingChecklist, setSavingChecklist] = useState(false);
  const [activeTab, setActiveTab] = useState<"proposal" | "tbe">("proposal");
  const [duplicating, setDuplicating] = useState(false);
  const [winScore, setWinScore] = useState<{ score: number; breakdown: any } | null>(null);
  const [loadingScore, setLoadingScore] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [diagrams, setDiagrams] = useState<Record<string, { code: string; title: string; type?: VisualizationType }>>({});
  const [diagramLoading, setDiagramLoading] = useState<string | null>(null);
  const [exportingDocx, setExportingDocx] = useState(false);
  const [includeDiagramsInExport, setIncludeDiagramsInExport] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/proposals/${proposalId}`);
        const data = await res.json().catch(() => null);
        if (!res?.ok || !data) throw new Error("Not found");
        setProposal(data);
        if (data?.complianceChecklist?.checklistItems) {
          setChecklistItems(data.complianceChecklist.checklistItems as ComplianceItem[]);
        }
      } catch {
        toast.error("Failed to load proposal");
      } finally {
        setLoading(false);
      }
    }
    if (proposalId) load();
  }, [proposalId]);

  useEffect(() => {
    async function fetchScore() {
      if (!proposal) return;
      setLoadingScore(true);
      try {
        const res = await fetch(`/api/proposals/${proposalId}/win-score`);
        const data = await res.json().catch(() => null);
        if (res?.ok && data) setWinScore(data);
      } catch { /* silent */ } finally { setLoadingScore(false); }
    }
    fetchScore();
  }, [proposal, proposalId]);

  async function handleExportPdf() {
    setExporting(true);
    try {
      const query = includeDiagramsInExport ? "" : "?includeDiagrams=false";
      const res = await fetch(`/api/proposals/${proposalId}/export-pdf${query}`);
      const contentType = res.headers.get("content-type") ?? "";
      if (!res?.ok || !contentType.includes("application/pdf")) {
        const errData = await res.json().catch(() => ({ error: "Export failed" }));
        throw new Error(errData?.error ?? "Failed to generate PDF");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(proposal?.title ?? "proposal").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded!");
    } catch (err: any) {
      console.error("PDF export error:", err);
      toast.error(err?.message ?? "Failed to export PDF. Please try again.");
    } finally { setExporting(false); }
  }

  function getScoreColor(score: number) {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  }
  function getScoreBg(score: number) {
    if (score >= 80) return "bg-emerald-50 border-emerald-200";
    if (score >= 60) return "bg-amber-50 border-amber-200";
    return "bg-red-50 border-red-200";
  }

  async function handleSaveSection(sectionId: string) {
    try {
      const res = await fetch(`/api/proposals/${proposalId}/sections`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId, content: editContent }),
      });
      if (!res?.ok) throw new Error();
      setProposal((prev: ProposalData | null) => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: (prev?.sections ?? [])?.map((s: ProposalSection) =>
            s?.id === sectionId ? { ...s, content: editContent } : s
          ),
        };
      });
      toast.success("Section saved");
      setEditingSection(null);
    } catch {
      toast.error("Failed to save");
    }
  }

  async function handleToggleChecklistItem(itemId: string) {
    const previousItems = [...checklistItems];
    const updated = checklistItems.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    setChecklistItems(updated);
    setSavingChecklist(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/compliance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklistItems: updated }),
      });
      if (!res?.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error ?? "Save failed");
      }
      // Refetch to confirm persistence
      const confirmRes = await fetch(`/api/proposals/${proposalId}/compliance`);
      if (confirmRes?.ok) {
        const saved = await confirmRes.json().catch(() => null);
        if (saved?.checklistItems) {
          setChecklistItems(saved.checklistItems as ComplianceItem[]);
        }
      }
    } catch (err: any) {
      console.error("Compliance save error:", err);
      toast.error(err?.message ?? "Failed to save checklist");
      // Revert to previous state
      setChecklistItems(previousItems);
    } finally {
      setSavingChecklist(false);
    }
  }

  async function handleDuplicate() {
    if (!proposal) return;
    setDuplicating(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/duplicate`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res?.ok || !data?.id) throw new Error();
      toast.success("Proposal duplicated!");
      router.push(`/proposals/${data.id}`);
    } catch {
      toast.error("Failed to duplicate proposal");
    } finally {
      setDuplicating(false);
    }
  }

  async function handleApprovalAction(action: "submit" | "approve" | "reject") {
    setApprovalLoading(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: rejectReason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res?.ok) throw new Error(data?.error ?? "Action failed");
      setProposal(data);
      setShowRejectInput(false);
      setRejectReason("");
      const msgs: Record<string, string> = {
        submit: "Proposal submitted for approval!",
        approve: "Proposal approved!",
        reject: "Proposal rejected.",
      };
      toast.success(msgs[action] ?? "Done");
    } catch (err: any) {
      toast.error(err?.message ?? "Action failed");
    } finally { setApprovalLoading(false); }
  }

  async function handleGenerateDiagram(sectionId: string, diagramType: string) {
    setDiagramLoading(sectionId);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/diagram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId, diagramType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res?.ok) throw new Error(data?.error ?? "Failed");
      setDiagrams((prev) => ({ ...prev, [sectionId]: { code: data.mermaidCode, title: data.title, type: data.visualizationType } }));
      toast.success("Diagram generated!");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to generate diagram");
    } finally {
      setDiagramLoading(null);
    }
  }

  async function handleExportDocx() {
    setExportingDocx(true);
    try {
      const query = includeDiagramsInExport ? "" : "?includeDiagrams=false";
      const res = await fetch(`/api/proposals/${proposalId}/export-docx${query}`);
      const contentType = res.headers.get("content-type") ?? "";
      if (!res?.ok || contentType.includes("application/json")) {
        const errData = await res.json().catch(() => ({ error: "Export failed" }));
        throw new Error(errData?.error ?? "Failed to generate DOCX");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(proposal?.title ?? "proposal").replace(/[^a-zA-Z0-9]/g, "_")}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("DOCX downloaded!");
    } catch (err: any) {
      console.error("DOCX export error:", err);
      toast.error(err?.message ?? "Failed to export DOCX");
    } finally {
      setExportingDocx(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Proposal not found.</p>
        <Button variant="outline" onClick={() => router.push("/proposals")} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Proposals
        </Button>
      </div>
    );
  }

  const vaultSections = proposal?.sections?.filter((s: ProposalSection) => s?.sourceType === "vault") ?? [];
  const checkedCount = checklistItems.filter((i) => i.checked).length;
  const templateMetadata = parseProposalTemplateMetadata(proposal?.templateType);
  const rfpIntelligence = inferRfpIntelligence(proposal?.rfp?.extractedData ?? {});
  const vaultSourceCategories = getSevereServiceVaultSourceCategories(rfpIntelligence.applicationId);
  const displayTemplate = templateMetadata.template || proposal?.templateType || "General";
  const displayApplication = templateMetadata.application;
  const displayIndustry = templateMetadata.industry || proposal?.industry;
  const displayPackageType = templateMetadata.packageType;

  return (
    <div className="proposal-print-root p-4 md:p-8 max-w-[1200px] mx-auto">
      <Button variant="ghost" onClick={() => router.push("/proposals")} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Proposals
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">{proposal?.title}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <Badge variant={proposal?.status === "Final" ? "default" : "secondary"}>
              {proposal?.status}
            </Badge>
            <Badge variant="outline">Industry: {displayIndustry}</Badge>
            {displayApplication && <Badge variant="outline">Application: {displayApplication}</Badge>}
            {displayPackageType && <Badge variant="outline">Package Type: {displayPackageType}</Badge>}
            {proposal?.companySize && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {({ startup: "Startup", sme: "SME", mid_market: "Mid-Market", enterprise: "Enterprise", conglomerate: "Conglomerate" } as Record<string, string>)[proposal.companySize] ?? proposal.companySize}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">Template: {displayTemplate}</span>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(proposal?.createdAt ?? "").toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Win Score badge */}
          {winScore && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-semibold ${getScoreBg(winScore.score)}`}>
              <Trophy className={`w-4 h-4 ${getScoreColor(winScore.score)}`} />
              <span className={getScoreColor(winScore.score)}>{winScore.score}/100</span>
            </div>
          )}
          {loadingScore && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={exporting}
            className="gap-2"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportDocx}
            disabled={exportingDocx}
            className="gap-2"
          >
            {exportingDocx ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            DOCX
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicate}
            disabled={duplicating}
            className="gap-2"
          >
            {duplicating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
            Duplicate
          </Button>
        </div>
      </div>

      <Card className="mb-6 border-slate-200 bg-slate-50/60 shadow-sm">
        <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Network className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-display font-semibold text-sm">Visualization Layer</h3>
              <p className="text-xs text-muted-foreground">
                Preview EPC, valve, pump, compliance, lifecycle, and dependency diagrams. Exports include diagrams only when enabled.
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm whitespace-nowrap">
            <input
              type="checkbox"
              checked={includeDiagramsInExport}
              onChange={(event) => setIncludeDiagramsInExport(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            Include diagrams in PDF/DOCX
          </label>
        </CardContent>
      </Card>

      {/* Vault usage banner */}
      {((proposal?.vaultSectionsUsed ?? 0) > 0 || (vaultSections?.length ?? 0) > 0) && (
        <Card className="mb-6 border-emerald-200 bg-emerald-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-sm text-emerald-800">
                Generated using <strong>{vaultSections?.length ?? proposal?.vaultSectionsUsed ?? 0}</strong> vault sections from <strong>{proposal?.vaultDocumentsUsed ?? 0}</strong> documents
              </span>
            </div>
            {rfpIntelligence.isSevereServiceValve && (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {vaultSourceCategories.map((category) => (
                  <div key={category.label} className="rounded-md border border-emerald-200 bg-white/80 px-3 py-2">
                    <div className="text-xs font-semibold text-emerald-900">{category.label}</div>
                    <div className="mt-0.5 text-xs text-emerald-700">{category.detail}</div>
                  </div>
                ))}
              </div>
            )}
            {/* Knowledge Vault Sources Used */}
            {(() => {
              const sourceNames = [...new Set(vaultSections.map((s: ProposalSection) => s.sourceName).filter(Boolean))] as string[];
              if (sourceNames.length === 0) return null;
              return (
                <div className="mt-4 border-t border-emerald-200 pt-3">
                  <div className="text-xs font-semibold text-emerald-900 mb-2">Knowledge Vault Sources Used</div>
                  <div className="flex flex-wrap gap-1.5">
                    {sourceNames.map((name) => (
                      <span key={name} className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2.5 py-0.5 text-xs text-emerald-800">
                        <Database className="w-3 h-3" />
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Approval Workflow */}
      {proposal?.approvalStatus && proposal.approvalStatus !== "none" && (
        <Card className={`mb-6 shadow-sm ${
          proposal.approvalStatus === "pending_approval" ? "border-amber-200 bg-amber-50" :
          proposal.approvalStatus === "approved" ? "border-emerald-200 bg-emerald-50" :
          "border-red-200 bg-red-50"
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                {proposal.approvalStatus === "pending_approval" && <Clock className="w-5 h-5 text-amber-600" />}
                {proposal.approvalStatus === "approved" && <ThumbsUp className="w-5 h-5 text-emerald-600" />}
                {proposal.approvalStatus === "rejected" && <ThumbsDown className="w-5 h-5 text-red-600" />}
                <span className={`text-sm font-medium ${
                  proposal.approvalStatus === "pending_approval" ? "text-amber-800" :
                  proposal.approvalStatus === "approved" ? "text-emerald-800" : "text-red-800"
                }`}>
                  {proposal.approvalStatus === "pending_approval" && "Pending Admin Approval"}
                  {proposal.approvalStatus === "approved" && `Approved${proposal.approvedAt ? ` on ${new Date(proposal.approvedAt).toLocaleDateString()}` : ""}`}
                  {proposal.approvalStatus === "rejected" && `Rejected${proposal.rejectionReason ? `: ${proposal.rejectionReason}` : ""}`}
                </span>
              </div>
              {isAdmin && proposal.approvalStatus === "pending_approval" && (
                <div className="flex items-center gap-2">
                  {showRejectInput ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Reason (optional)"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="h-8 px-2 text-sm border rounded-md w-48"
                      />
                      <Button size="sm" variant="destructive" onClick={() => handleApprovalAction("reject")} disabled={approvalLoading}>
                        {approvalLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Reject"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowRejectInput(false)}>Cancel</Button>
                    </div>
                  ) : (
                    <>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={() => handleApprovalAction("approve")} disabled={approvalLoading}>
                        {approvalLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ThumbsUp className="w-3 h-3" />} Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-1" onClick={() => setShowRejectInput(true)}>
                        <ThumbsDown className="w-3 h-3" /> Reject
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit for Approval button - show when status is none or rejected */}
      {(proposal?.approvalStatus === "none" || proposal?.approvalStatus === "rejected") && proposal?.status === "Draft" && (
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleApprovalAction("submit")}
            disabled={approvalLoading}
            className="gap-2"
          >
            {approvalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit for Approval
          </Button>
        </div>
      )}

      {/* Compliance Checklist */}
      {checklistItems.length > 0 && (
        <Card className="mb-6 shadow-sm border-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Compliance Checklist
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant={checkedCount === checklistItems.length ? "default" : "secondary"} className="text-xs">
                  {checkedCount}/{checklistItems.length} verified
                </Badge>
                {savingChecklist && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {checklistItems.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleToggleChecklistItem(item.id)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium ${item.checked ? "line-through text-muted-foreground" : ""}`}>
                      {item.label}
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.standard}</p>
                  </div>
                  {item.checked && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation - show TBE tab only when RFP has line items */}
      {proposal?.rfp?.extractedData && (proposal.rfp.extractedData as any)?.lineItems?.length > 0 && (
        <div className="flex border-b border-border mb-6">
          <button
            onClick={() => setActiveTab("proposal")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === "proposal"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <FileText className="w-4 h-4" />
            Proposal Sections
          </button>
          <button
            onClick={() => setActiveTab("tbe")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === "tbe"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <Table className="w-4 h-4" />
            TBE Responses
          </button>
        </div>
      )}

      {/* TBE Panel */}
      {activeTab === "tbe" && proposal?.rfp?.id && (proposal.rfp.extractedData as any)?.lineItems?.length > 0 && (
        <TbePanel
          rfpId={proposal.rfp.id}
          lineItems={(proposal.rfp.extractedData as any)?.lineItems ?? []}
          templateType={proposal.templateType}
        />
      )}

      {/* Sections */}
      {activeTab === "proposal" && <div className="space-y-4">
        {(proposal?.sections ?? [])?.map((section: ProposalSection, idx: number) => (
          (() => {
            const defaultVisualizationType = getBestVisualizationType(section?.sectionTitle ?? "", section?.content ?? "", {
              templateType: proposal?.templateType,
              industry: proposal?.industry,
            });
            const activeVisualizationType = diagrams[section?.id]?.type ?? defaultVisualizationType;
            const artifact = buildEngineeringArtifact({
              sectionTitle: section?.sectionTitle ?? "",
              sectionId: section?.id,
              proposalId: proposal?.id,
              templateType: proposal?.templateType,
              extractedData: proposal?.rfp?.extractedData,
            });
            const showStandardDiagram = !artifact && shouldRenderProposalDiagram(section?.sectionTitle ?? "", section?.content ?? "");

            return (
          <Card key={section?.id} className="proposal-print-section shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">{String(idx + 1).padStart(2, "0")}</span>
                  <h3 className="font-display font-semibold">{section?.sectionTitle}</h3>
                  {section?.sourceType === "vault" ? (
                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                      <Database className="w-3 h-3 mr-1" /> From Vault
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      <Zap className="w-3 h-3 mr-1" /> AI Generated
                    </Badge>
                  )}
                </div>
                {editingSection === section?.id ? (
                  <div className="flex gap-1">
                    <Button size="sm" onClick={() => handleSaveSection(section?.id)}>
                      <Check className="w-3 h-3 mr-1" /> Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingSection(null)}>
                      <X className="w-3 h-3 mr-1" /> Cancel
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => { setEditingSection(section?.id); setEditContent(section?.content ?? ""); }}>
                    <Edit2 className="w-3 h-3 mr-1" /> Edit
                  </Button>
                )}
              </div>
              {editingSection === section?.id ? (
                <Textarea
                  value={editContent ?? ""}
                  onChange={(e: any) => setEditContent(e?.target?.value ?? "")}
                  rows={10}
                  className="font-sans text-sm"
                />
              ) : (
                <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {section?.content}
                </div>
              )}

              {artifact && <EngineeringArtifactBlock artifact={artifact} />}

              {showStandardDiagram && (
                <div className="mt-3 pt-3 border-t flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">
                    Artifact visual: {getVisualizationTypeMeta(activeVisualizationType).label}
                  </span>
                  {VISUALIZATION_TYPES.map((type) => (
                    <Button
                      key={type.id}
                      variant={activeVisualizationType === type.id ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 text-xs gap-1"
                      disabled={diagramLoading === section?.id}
                      onClick={() => handleGenerateDiagram(section?.id, type.id)}
                      title={type.description}
                    >
                      {diagramLoading === section?.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <GitBranch className="w-3 h-3" />
                      )}
                      {type.label}
                    </Button>
                  ))}
                </div>
              )}

              {showStandardDiagram && <div className="printable-diagram-section mt-3">
                {(() => {
                  const fallback = getFallbackVisualization({
                    title: proposal.title,
                    sectionTitle: section.sectionTitle,
                    industry: proposal.industry,
                    templateType: proposal.templateType,
                    content: section.content,
                  }, defaultVisualizationType);
                  const activeDiagram = diagrams[section.id] ?? {
                    code: fallback.mermaidCode,
                    title: fallback.title,
                    type: defaultVisualizationType,
                  };
                  return (
                    <MermaidDiagram
                      chart={activeDiagram.code}
                      title={`${activeDiagram.title} — ${getVisualizationTypeMeta(activeDiagram.type ?? defaultVisualizationType).exportLabel}`}
                    />
                  );
                })()}
              </div>}
            </CardContent>
          </Card>
            );
          })()
        ))}
      </div>}
    </div>
  );
}
