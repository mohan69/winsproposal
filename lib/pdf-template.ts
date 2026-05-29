/**
 * HTML template for PDF export of proposals
 */

import { getBestVisualizationType, type VisualizationType } from "@/lib/visualization-service";
import { parseProposalTemplateMetadata } from "@/lib/severe-service-intelligence";
import { buildEngineeringArtifact, renderArtifactForPdf } from "@/lib/engineering-artifacts";

interface PdfSection {
  sectionTitle: string;
  content: string;
  sourceType: string;
  diagramSvgUrl?: string; // mermaid.ink URL for the diagram
  visualizationType?: VisualizationType;
  id?: string;
}

interface TbeData {
  lineItems: string[];
  tags: string[];
  cells: Record<string, string>; // key: "lineItemIndex-tag"
}

interface CompliancePdfItem {
  id?: string;
  label?: string;
  standard?: string;
  checked?: boolean;
}

interface PdfData {
  title: string;
  industry: string;
  templateType: string;
  status: string;
  createdAt: string;
  sections: PdfSection[];
  winScore: number;
  companyName?: string;
  vaultSectionsUsed: number;
  vaultDocumentsUsed: number;
  orgName?: string;
  orgLogoUrl?: string;
  brandColor?: string;
  includeDiagrams?: boolean;
  complianceItems?: CompliancePdfItem[];
  tbeData?: TbeData;
  extractedData?: any;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(value: unknown): string {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function sanitizeHexColor(value: unknown, fallback = "#1a365d"): string {
  const color = String(value ?? "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : fallback;
}

function sanitizeImageUrl(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? raw : "";
  } catch {
    return "";
  }
}

function markdownToHtml(text: string): string {
  if (!text) return "";
  let html = escapeHtml(text)
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Headers within content
    .replace(/^### (.+)$/gm, '<h4 style="font-size:13px;font-weight:700;margin:12px 0 6px;color:#1a365d;">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="font-size:14px;font-weight:700;margin:14px 0 8px;color:#1a365d;">$1</h3>')
    // Bullet points
    .replace(/^[\-•] (.+)$/gm, '<li style="margin:2px 0;padding-left:4px;">$1</li>')
    // Numbered lists
    .replace(/^\d+\.\s(.+)$/gm, '<li style="margin:2px 0;padding-left:4px;">$1</li>')
    // Tables
    .replace(/\|(.+?)\|/g, (match) => {
      const cells = match.split("|").filter(Boolean).map((c) => c.trim());
      if (cells.every((c) => /^[\-:]+$/.test(c))) return ""; // separator row
      const isHeader = cells.some((c) => /^\*\*/.test(c));
      const tag = isHeader ? "th" : "td";
      const cellStyle = isHeader
        ? 'style="background:#f0f4f8;padding:8px 12px;text-align:left;font-weight:600;font-size:11px;border:1px solid #d1d5db;"'
        : 'style="padding:8px 12px;text-align:left;font-size:11px;border:1px solid #d1d5db;"';
      return `<tr>${cells.map((c) => `<${tag} ${cellStyle}>${c.replace(/\*\*/g, "")}</${tag}>`).join("")}</tr>`;
    });

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li[^>]*>.*?<\/li>\n?)+/g, (match) =>
    `<ul style="margin:8px 0;padding-left:20px;">${match}</ul>`
  );

  // Wrap consecutive <tr> in <table>
  html = html.replace(/(<tr>.*?<\/tr>\n?)+/g, (match) =>
    `<table style="width:100%;border-collapse:collapse;margin:10px 0;font-size:11px;">${match}</table>`
  );

  // Paragraphs (lines not already wrapped)
  html = html
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '<div style="height:6px;"></div>';
      if (
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<table") ||
        trimmed.startsWith("<li") ||
        trimmed.startsWith("<tr") ||
        trimmed.startsWith("<div")
      )
        return trimmed;
      return `<p style="margin:4px 0;line-height:1.6;">${trimmed}</p>`;
    })
    .join("\n");

  return html;
}

function getPdfDiagramSteps(type: VisualizationType): string[] {
  const stepMap: Record<VisualizationType, string[]> = {
    value_chain: ["Customer Scope", "Technical Fit", "Compliance Confidence", "Delivery Assurance", "Win Theme"],
    architecture: ["Client Requirement", "System Package", "Technical Interfaces", "Controls and QA", "Integrated Offer"],
    process_flow: ["Process Input", "Engineering", "Procurement", "Fabrication", "Commissioning"],
    workflow: ["RFP Intake", "Owner Assignment", "Technical Review", "Compliance Review", "Final Approval"],
    compliance_flow: ["RFP Clause", "Map Standard", "Attach Evidence", "Resolve Deviation", "Approval Closure"],
    kpi_dashboard: ["Bid Value", "Turnaround", "Compliance", "Vault Reuse", "Executive View"],
    tbe_matrix: ["Line Items", "Evaluation Tags", "Technical Response", "Deviation Status", "TBE Recommendation"],
    risk_tree: ["Risk Flag", "Impact Rating", "Mitigation", "Clarification", "Bid Decision"],
    gantt: ["RFP Review", "Technical Draft", "Compliance Review", "Approval", "Submission"],
    proposal_lifecycle: ["Upload RFP", "Parse Requirements", "Go/No-Go", "Generate Proposal", "Export"],
    engineering_dependency: ["Client Datasheet", "Engineering Basis", "Calculations", "QA Review", "Proposal Pack"],
    flowchart: ["Start", "Review Inputs", "Prepare Response", "Validate", "Submit"],
    sequence: ["Client", "Sales", "Engineering", "QA", "Submission"],
    pfd: ["Input", "Engineering", "Procurement", "Fabrication", "Delivery"],
  };

  return stepMap[type] ?? stepMap.workflow;
}

function getPdfDiagramLabel(type: VisualizationType): string {
  if (type === "kpi_dashboard") return "KPI Dashboard";
  if (type === "tbe_matrix") return "TBE Matrix";
  if (type === "risk_tree") return "Risk Tree";
  if (type === "value_chain") return "Value Chain";
  if (type === "engineering_dependency") return "Engineering Dependency";
  if (type === "compliance_flow") return "Compliance Flow";
  if (type === "process_flow") return "Process Flow";
  return type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildFlowVisual(steps: string[], brandColor: string): string {
  return `<div class="diagram-flow">
    ${steps.map((step, index) => `
      <div class="diagram-step-wrap">
        <div class="diagram-step">
          <div class="diagram-step-no">${index + 1}</div>
          <div class="diagram-step-text">${escapeHtml(step)}</div>
        </div>
        ${index < steps.length - 1 ? `<div class="diagram-arrow" style="color:${brandColor};">→</div>` : ""}
      </div>
    `).join("")}
  </div>`;
}

function buildKpiDashboardVisual(brandColor: string): string {
  const metrics = [
    ["Bid Value", "₹48.6 Cr", "92% visibility"],
    ["Turnaround", "4.2 days", "38% faster"],
    ["Compliance", "96%", "clauses mapped"],
    ["Vault Reuse", "64%", "approved content"],
  ];
  return `<div class="diagram-kpi-grid">
    ${metrics.map(([label, value, note]) => `
      <div class="diagram-kpi-card">
        <div class="diagram-kpi-label">${label}</div>
        <div class="diagram-kpi-value" style="color:${brandColor};">${value}</div>
        <div class="diagram-kpi-bar"><span style="width:${label === "Compliance" ? "96" : label === "Bid Value" ? "92" : label === "Vault Reuse" ? "64" : "78"}%;background:${brandColor};"></span></div>
        <div class="diagram-kpi-note">${note}</div>
      </div>
    `).join("")}
  </div>`;
}

function buildComplianceVisual(brandColor: string): string {
  const rows = [
    ["API 600", "Mapped", "Evidence"],
    ["ASME B16.34", "Mapped", "Datasheet"],
    ["NACE MR0175", "Review", "Material note"],
    ["ITP", "Closed", "QA plan"],
  ];
  return `<table class="diagram-matrix">
    <thead><tr><th>Requirement</th><th>Status</th><th>Proof</th></tr></thead>
    <tbody>${rows.map((row) => `
      <tr>
        <td>${row[0]}</td>
        <td><span class="diagram-status" style="background:${brandColor};">${row[1]}</span></td>
        <td>${row[2]}</td>
      </tr>
    `).join("")}</tbody>
  </table>`;
}

function buildTbeVisual(brandColor: string): string {
  const rows = [
    ["Valve Body", "API 600", "Compliant"],
    ["Seat Leakage", "API 598", "Compliant"],
    ["MOC", "NACE", "Clarify"],
  ];
  return `<table class="diagram-matrix tbe">
    <thead><tr><th>Line Item</th><th>Evaluation Tag</th><th>Decision</th></tr></thead>
    <tbody>${rows.map((row) => `
      <tr>
        <td>${row[0]}</td>
        <td>${row[1]}</td>
        <td><span class="diagram-status" style="background:${brandColor};">${row[2]}</span></td>
      </tr>
    `).join("")}</tbody>
  </table>`;
}

function buildRiskTreeVisual(brandColor: string): string {
  return `<div class="diagram-tree">
    <div class="tree-root" style="border-color:${brandColor};">Deviation / Risk Flag</div>
    <div class="tree-branches">
      <div class="tree-node low">Low<br/><span>Document</span></div>
      <div class="tree-node medium">Medium<br/><span>Mitigate</span></div>
      <div class="tree-node high">High<br/><span>Approve</span></div>
    </div>
    <div class="tree-decision" style="background:${brandColor};">Clarify → Decide → Close</div>
  </div>`;
}

function buildEngineeringVisual(brandColor: string): string {
  return `<div class="diagram-dependency">
    <div class="dep-source">Datasheet</div>
    <div class="dep-stack">
      <div style="border-left-color:${brandColor};">Design Basis</div>
      <div style="border-left-color:${brandColor};">Calculations</div>
      <div style="border-left-color:${brandColor};">Materials / MOC</div>
    </div>
    <div class="dep-output">QA Review<br/>Proposal Pack</div>
  </div>`;
}

function buildGanttVisual(brandColor: string): string {
  const rows = [
    ["RFP Review", "8%", "28%"],
    ["Engineering", "24%", "44%"],
    ["Compliance", "48%", "32%"],
    ["Submission", "78%", "18%"],
  ];
  return `<div class="diagram-gantt">
    ${rows.map(([label, left, width]) => `
      <div class="gantt-row"><span>${label}</span><div><b style="left:${left};width:${width};background:${brandColor};"></b></div></div>
    `).join("")}
  </div>`;
}

function buildPdfDiagramHtml(sectionTitle: string, content: string, brandColor: string, type: VisualizationType): string {
  const steps = getPdfDiagramSteps(type).map(escapeHtml);
  const label = getPdfDiagramLabel(type);
  const visual = type === "kpi_dashboard"
    ? buildKpiDashboardVisual(brandColor)
    : type === "compliance_flow"
      ? buildComplianceVisual(brandColor)
      : type === "tbe_matrix"
        ? buildTbeVisual(brandColor)
        : type === "risk_tree"
          ? buildRiskTreeVisual(brandColor)
          : type === "engineering_dependency"
            ? buildEngineeringVisual(brandColor)
            : type === "gantt"
              ? buildGanttVisual(brandColor)
              : buildFlowVisual(steps, brandColor);

  return `
    <div class="diagram-block diagram-${escapeAttr(type)}">
      <div class="diagram-title">${escapeHtml(sectionTitle)} - ${escapeHtml(label)}</div>
      ${visual}
    </div>`;
}

export function generateProposalHtml(data: PdfData): string {
  const date = new Date(data.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const brandColor = sanitizeHexColor(data.brandColor);
  const displayName = data.orgName || data.companyName || "";
  const safeDisplayName = escapeHtml(displayName);
  const safeTitle = escapeHtml(data.title);
  const safeIndustry = escapeHtml(data.industry);
  const templateMetadata = parseProposalTemplateMetadata(data.templateType);
  const safeTemplateType = escapeHtml(templateMetadata.template);
  const safeApplication = escapeHtml(templateMetadata.application);
  const safePackageType = escapeHtml(templateMetadata.packageType);
  const safeStatus = escapeHtml(data.status);
  const safeOrgLogoUrl = sanitizeImageUrl(data.orgLogoUrl);
  const safeSections = data.sections.map((section) => ({
    ...section,
    sectionTitle: escapeHtml(section.sectionTitle),
    contentHtml: markdownToHtml(section.content),
    diagramSvgUrl: sanitizeImageUrl(section.diagramSvgUrl),
    visualizationType: section.visualizationType ?? getBestVisualizationType(section.sectionTitle, section.content, {
      templateType: data.templateType,
      industry: data.industry,
    }),
    diagramHtml: buildPdfDiagramHtml(
      section.sectionTitle,
      section.content,
      brandColor,
      section.visualizationType ?? getBestVisualizationType(section.sectionTitle, section.content, {
        templateType: data.templateType,
        industry: data.industry,
      })
    ),
    artifactHtml: (() => {
      const artifact = buildEngineeringArtifact({
        sectionTitle: section.sectionTitle,
        sectionId: section.id,
        templateType: data.templateType,
        extractedData: data.extractedData,
      });
      return artifact ? renderArtifactForPdf(artifact, brandColor) : "";
    })(),
  }));
  const safeTbeData = data.tbeData
    ? {
        lineItems: data.tbeData.lineItems.map((item) => escapeHtml(item)),
        tags: data.tbeData.tags.map((tag) => escapeHtml(tag)),
        cells: Object.fromEntries(
          Object.entries(data.tbeData.cells).map(([key, value]) => [key, escapeHtml(value).substring(0, 600)])
        ),
      }
    : null;
  const safeComplianceItems = (data.complianceItems ?? []).map((item) => ({
    label: escapeHtml(item.label ?? ""),
    standard: escapeHtml(item.standard ?? ""),
    checked: !!item.checked,
  }));

  // Build TOC
  const tocEntries = [
    ...safeSections.map((s, i) => ({ label: `${i + 1}. ${s.sectionTitle}`, href: `#section-${i + 1}`, page: i + 3 })),
    ...(safeComplianceItems.length > 0 ? [{ label: `${safeSections.length + 1}. Compliance Checklist`, href: "#compliance-checklist", page: safeSections.length + 3 }] : []),
    ...(safeTbeData ? [{ label: `${safeSections.length + (safeComplianceItems.length > 0 ? 2 : 1)}. Technical Bid Evaluation (TBE)`, href: "#technical-bid-evaluation", page: safeSections.length + (safeComplianceItems.length > 0 ? 4 : 3) }] : []),
  ];
  const tocItems = tocEntries
    .map(
      (entry) =>
        `<a href="${entry.href}" class="toc-link">
          <span>${entry.label}</span>
          <span>Page ${entry.page}</span>
        </a>`
    )
    .join("");

  // Build proposal body as a continuous document. The PDF engine paginates
  // naturally while artifact blocks stay near their section content.
  const sectionPages = safeSections
    .map(
      (s, i) =>
        `<section id="section-${i + 1}" class="proposal-section">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid ${brandColor};">
            <div style="background:${brandColor};color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0;">${i + 1}</div>
            <h2 style="font-size:16px;font-weight:700;color:${brandColor};margin:0;">${s.sectionTitle}</h2>
            ${s.sourceType === "vault" ? '<span style="background:#d1fae5;color:#065f46;font-size:9px;padding:2px 8px;border-radius:10px;">From Vault</span>' : ''}
          </div>
          <div style="font-size:11.5px;color:#1f2937;line-height:1.7;">
            ${s.contentHtml}
          </div>
          ${s.artifactHtml}
          ${data.includeDiagrams !== false ? s.diagramHtml : ""}
        </section>`
    )
    .join("");

  const totalPages = data.sections.length + 2; // cover + TOC + sections
  const complianceCheckedCount = safeComplianceItems.filter((item) => item.checked).length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; color: #1f2937; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { width: 210mm; min-height: 297mm; padding: 20mm 22mm 25mm 22mm; position: relative; page-break-after: always; page-break-inside: avoid; overflow: hidden; }
    .body-page { height:auto; min-height:297mm; overflow:visible; page-break-after:auto; page-break-inside:auto; }
    .page:last-child { page-break-after: auto; }
    .cover-page { background: linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 50%, ${brandColor}bb 100%); color: white; display: flex; flex-direction: column; justify-content: center; padding: 35mm 30mm; min-height: 297mm; }
    .cover-page .accent-line { width: 80px; height: 4px; background: #10b981; margin-bottom: 30px; }
    .cover-page h1 { font-size: 32px; font-weight: 800; line-height: 1.2; margin-bottom: 16px; }
    .cover-page .subtitle { font-size: 14px; opacity: 0.85; margin-bottom: 40px; line-height: 1.5; }
    .cover-meta { display: flex; gap: 30px; margin-top: auto; padding-top: 40px; border-top: 1px solid rgba(255,255,255,0.2); }
    .cover-meta div { font-size: 11px; }
    .cover-meta .label { opacity: 0.6; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    .toc-page { }
    .toc-title { font-size: 20px; font-weight: 700; color: ${brandColor}; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 3px solid ${brandColor}; }
    .toc-link { display:flex; justify-content:space-between; align-items:baseline; padding:6px 0; border-bottom:1px dotted #d1d5db; text-decoration:none; color:#374151; font-size:12px; }
    .toc-link span:last-child { font-size:11px; color:#6b7280; flex-shrink:0; margin-left:8px; }
    .section-page { }
    .proposal-section { break-inside:auto; page-break-inside:auto; margin-bottom:22px; padding-bottom:14px; border-bottom:1px solid #e5e7eb; }
    .section-page p { text-align: left; margin: 4px 0; line-height: 1.7; }
    .section-page ul { text-align: left; }
    .section-page li { text-align: left; }
    .diagram-block { margin-top: 20px; padding: 14px 12px 16px; border: 1px solid #dbeafe; border-radius: 10px; background: #f8fafc; page-break-inside: avoid; }
    .engineering-artifact { margin: 14px 0 18px; padding: 12px; border: 1px solid #bfdbfe; border-radius: 10px; background: #f8fafc; break-inside: avoid; page-break-inside: avoid; }
    .artifact-kicker { font-size: 8.5px; color: #1d4ed8; text-transform: uppercase; font-weight: 800; letter-spacing: .5px; }
    .artifact-title { font-size: 12px; color: #111827; font-weight: 800; margin-top: 2px; }
    .artifact-meta { font-size: 9px; color: #6b7280; margin: 3px 0 8px; }
    .artifact-disclaimer { font-size: 9px; color: #92400e; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 7px 8px; margin: 8px 0; }
    .artifact-table { width:100%; border-collapse:collapse; background:white; font-size:8.5px; margin:8px 0 12px; }
    .artifact-table th { background:#eff6ff; color:#111827; text-align:left; padding:6px; border:1px solid #cbd5e1; font-size:7.8px; }
    .artifact-table td { padding:6px; border:1px solid #d1d5db; vertical-align:top; }
    .artifact-visual-card { background:white; border:1px solid #d1d5db; border-radius:8px; padding:9px; margin:8px 0; break-inside: avoid; page-break-inside: avoid; }
    .artifact-visual-title { font-size:10px; font-weight:800; color:#111827; }
    .artifact-visual-type { font-size:8.5px; color:#6b7280; margin:2px 0 7px; }
    .artifact-node-row { display:flex; flex-wrap:wrap; align-items:center; gap:5px; }
    .artifact-node-wrap { display:flex; align-items:center; gap:5px; }
    .artifact-node { border:1px solid #bfdbfe; background:#f8fafc; border-radius:6px; padding:5px 7px; font-size:8.5px; font-weight:700; color:#1f2937; }
    .artifact-arrow { font-size:12px; font-weight:800; }
    .diagram-title { font-size: 10px; color: #4b5563; margin-bottom: 12px; font-style: italic; }
    .diagram-flow { display: flex; align-items: stretch; justify-content: space-between; gap: 5px; }
    .diagram-step-wrap { display: flex; align-items: center; flex: 1; min-width: 0; }
    .diagram-step { flex: 1; min-height: 64px; border: 1px solid #bfdbfe; border-radius: 8px; background: white; padding: 8px 6px; text-align: center; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06); }
    .diagram-step-no { width: 20px; height: 20px; margin: 0 auto 6px; border-radius: 50%; background: ${brandColor}; color: white; font-size: 10px; line-height: 20px; font-weight: 700; }
    .diagram-step-text { font-size: 9.5px; line-height: 1.25; color: #111827; font-weight: 600; }
    .diagram-arrow { flex: 0 0 16px; text-align: center; font-size: 15px; font-weight: 700; padding: 0 2px; }
    .diagram-kpi-grid { display:grid; grid-template-columns:repeat(2, 1fr); gap:10px; }
    .diagram-kpi-card { background:white; border:1px solid #d1d5db; border-radius:8px; padding:10px; min-height:78px; }
    .diagram-kpi-label { font-size:8.5px; color:#6b7280; text-transform:uppercase; letter-spacing:.6px; }
    .diagram-kpi-value { font-size:18px; font-weight:800; margin-top:3px; }
    .diagram-kpi-bar { height:6px; background:#e5e7eb; border-radius:99px; overflow:hidden; margin:6px 0 4px; }
    .diagram-kpi-bar span { display:block; height:100%; border-radius:99px; }
    .diagram-kpi-note { font-size:9px; color:#4b5563; }
    .diagram-matrix { width:100%; border-collapse:collapse; background:white; font-size:9.5px; border:1px solid #d1d5db; }
    .diagram-matrix th { background:#eef2ff; color:#111827; text-align:left; padding:7px 8px; border:1px solid #d1d5db; font-size:9px; text-transform:uppercase; letter-spacing:.3px; }
    .diagram-matrix td { padding:8px; border:1px solid #d1d5db; color:#1f2937; }
    .diagram-status { display:inline-block; color:white; border-radius:999px; padding:2px 8px; font-size:8.5px; font-weight:700; }
    .diagram-tree { text-align:center; }
    .tree-root { display:inline-block; background:white; border:2px solid; border-radius:8px; padding:9px 18px; font-size:10px; font-weight:800; color:#111827; }
    .tree-branches { display:flex; justify-content:space-around; gap:12px; margin:14px 0; position:relative; }
    .tree-branches:before { content:""; position:absolute; left:12%; right:12%; top:-7px; height:1px; background:#cbd5e1; }
    .tree-node { flex:1; background:white; border:1px solid #d1d5db; border-radius:8px; padding:9px 8px; font-size:10px; font-weight:800; color:#111827; }
    .tree-node span { font-size:8.5px; color:#6b7280; font-weight:600; }
    .tree-node.low { border-top:4px solid #10b981; }
    .tree-node.medium { border-top:4px solid #f59e0b; }
    .tree-node.high { border-top:4px solid #ef4444; }
    .tree-decision { display:inline-block; color:white; border-radius:999px; padding:6px 18px; font-size:9.5px; font-weight:800; }
    .diagram-dependency { display:flex; align-items:center; gap:12px; }
    .dep-source, .dep-output { width:26%; background:white; border:1px solid #bfdbfe; border-radius:8px; padding:16px 10px; text-align:center; font-size:10px; font-weight:800; color:#111827; }
    .dep-stack { flex:1; display:flex; flex-direction:column; gap:7px; }
    .dep-stack div { background:white; border:1px solid #d1d5db; border-left:5px solid; border-radius:6px; padding:7px 9px; font-size:9.5px; font-weight:700; }
    .diagram-gantt { background:white; border:1px solid #d1d5db; border-radius:8px; padding:9px; }
    .gantt-row { display:grid; grid-template-columns:95px 1fr; gap:8px; align-items:center; margin:7px 0; font-size:9.5px; font-weight:700; color:#374151; }
    .gantt-row div { height:13px; background:#e5e7eb; border-radius:99px; position:relative; overflow:hidden; }
    .gantt-row b { position:absolute; top:0; bottom:0; border-radius:99px; }
    .page-footer { display: none; }
  </style>
</head>
<body>
  <!-- COVER PAGE -->
  <div class="page cover-page">
    ${safeOrgLogoUrl ? `<div style="margin-bottom:20px;"><img src="${escapeAttr(safeOrgLogoUrl)}" alt="" style="max-height:50px;max-width:180px;object-fit:contain;filter:brightness(0) invert(1);opacity:0.9;" /></div>` : ""}
    ${safeDisplayName && !safeOrgLogoUrl ? `<div style="font-size:14px;opacity:0.7;margin-bottom:16px;letter-spacing:1px;text-transform:uppercase;">${safeDisplayName}</div>` : ""}
    <div class="accent-line"></div>
    <h1>${safeTitle}</h1>
    <div class="subtitle">
      ${data.industry !== "General" ? safeIndustry + " Industry" : ""} Technical &amp; Commercial Proposal
      ${safeDisplayName ? `<br/>Prepared by ${safeDisplayName}` : ""}
    </div>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:30px;">
      <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:12px 20px;">
        <div style="font-size:9px;opacity:0.6;text-transform:uppercase;letter-spacing:1px;">Win Score</div>
        <div style="font-size:28px;font-weight:800;color:${data.winScore >= 80 ? '#6ee7b7' : data.winScore >= 60 ? '#fcd34d' : '#fca5a5'};">${data.winScore}%</div>
      </div>
      <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:12px 20px;">
        <div style="font-size:9px;opacity:0.6;text-transform:uppercase;letter-spacing:1px;">Sections</div>
        <div style="font-size:28px;font-weight:800;">${data.sections.length}</div>
      </div>
      <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:12px 20px;">
        <div style="font-size:9px;opacity:0.6;text-transform:uppercase;letter-spacing:1px;">Vault Sources</div>
        <div style="font-size:28px;font-weight:800;">${data.vaultDocumentsUsed}</div>
      </div>
    </div>
    <div class="cover-meta">
      <div><div class="label">Date</div>${date}</div>
      <div><div class="label">Template</div>${safeTemplateType}</div>
      ${safeApplication ? `<div><div class="label">Application</div>${safeApplication}</div>` : ""}
      ${safePackageType ? `<div><div class="label">Package</div>${safePackageType}</div>` : ""}
      <div><div class="label">Status</div>${safeStatus}</div>
      <div><div class="label">Industry</div>${safeIndustry}</div>
    </div>
  </div>

  <!-- TABLE OF CONTENTS -->
  <div class="page toc-page">
    <div class="toc-title">Table of Contents</div>
    ${tocItems}
    <div style="margin-top:30px;padding:16px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;">
      <div style="font-size:11px;color:#065f46;">
        <strong>Vault Coverage:</strong> ${data.vaultSectionsUsed} of ${data.sections.length} sections sourced from knowledge vault (${data.vaultDocumentsUsed} documents referenced)
      </div>
    </div>

  </div>

  <!-- CONTENT SECTIONS -->
  <div class="page body-page">
    ${sectionPages}
  </div>

  ${safeComplianceItems.length > 0 ? `
  <!-- COMPLIANCE SECTION -->
  <div id="compliance-checklist" class="page section-page">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid ${brandColor};">
      <div style="background:${brandColor};color:white;padding:4px 12px;border-radius:4px;font-size:11px;font-weight:700;">COMPLIANCE</div>
      <h2 style="font-size:16px;font-weight:700;color:${brandColor};margin:0;">Compliance Checklist</h2>
    </div>
    <div style="margin-bottom:14px;font-size:11px;color:#4b5563;">${complianceCheckedCount}/${safeComplianceItems.length} items verified</div>
    <table style="width:100%;border-collapse:collapse;font-size:10.5px;">
      <thead>
        <tr>
          <th style="background:${brandColor};color:white;padding:8px 10px;text-align:center;font-weight:600;border:1px solid #d1d5db;width:52px;">Status</th>
          <th style="background:${brandColor};color:white;padding:8px 10px;text-align:left;font-weight:600;border:1px solid #d1d5db;">Requirement</th>
          <th style="background:${brandColor};color:white;padding:8px 10px;text-align:left;font-weight:600;border:1px solid #d1d5db;">Standard</th>
        </tr>
      </thead>
      <tbody>
        ${safeComplianceItems.map((item, idx) => {
          const bgColor = idx % 2 === 0 ? "#ffffff" : "#f9fafb";
          return `<tr>
            <td style="padding:7px 10px;border:1px solid #d1d5db;text-align:center;background:${bgColor};font-weight:700;color:${item.checked ? "#047857" : "#9ca3af"};">${item.checked ? "OK" : "OPEN"}</td>
            <td style="padding:7px 10px;border:1px solid #d1d5db;background:${bgColor};font-weight:600;color:#111827;">${item.label}</td>
            <td style="padding:7px 10px;border:1px solid #d1d5db;background:${bgColor};color:#4b5563;line-height:1.5;">${item.standard}</td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>
  </div>
  ` : ""}

  ${safeTbeData ? `
  <!-- TBE SECTION -->
  ${safeTbeData.lineItems.map((lineItem, liIdx) => `
  <div id="${liIdx === 0 ? "technical-bid-evaluation" : `technical-bid-evaluation-${liIdx + 1}`}" class="page section-page">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid ${brandColor};">
      <div style="background:${brandColor};color:white;padding:4px 12px;border-radius:4px;font-size:11px;font-weight:700;">TBE</div>
      <h2 style="font-size:16px;font-weight:700;color:${brandColor};margin:0;">Technical Bid Evaluation — ${lineItem}</h2>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:10.5px;">
      <thead>
        <tr>
          <th style="background:${brandColor};color:white;padding:8px 10px;text-align:left;font-weight:600;border:1px solid #d1d5db;width:120px;">Evaluation Tag</th>
          <th style="background:${brandColor};color:white;padding:8px 10px;text-align:left;font-weight:600;border:1px solid #d1d5db;">Response</th>
        </tr>
      </thead>
      <tbody>
        ${safeTbeData.tags.map((tag, tIdx) => {
          const cellText = safeTbeData.cells[`${liIdx}-${data.tbeData!.tags[tIdx]}`] ?? "—";
          const bgColor = tIdx % 2 === 0 ? "#ffffff" : "#f9fafb";
          return `<tr>
            <td style="padding:7px 10px;border:1px solid #d1d5db;font-weight:600;color:${brandColor};background:${bgColor};vertical-align:top;">${tag}</td>
            <td style="padding:7px 10px;border:1px solid #d1d5db;line-height:1.5;background:${bgColor};vertical-align:top;">${cellText}</td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>
  </div>`).join("")}
  ` : ""}
</body>
</html>`;
}
