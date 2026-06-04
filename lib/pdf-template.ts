/**
 * HTML template for PDF export of proposals
 */

import { getBestVisualizationType, shouldRenderProposalDiagram, type VisualizationType } from "@/lib/visualization-service";
import { getSevereServiceVaultSourceCategories, inferRfpIntelligence, parseProposalTemplateMetadata } from "@/lib/severe-service-intelligence";
import { buildEngineeringArtifact, formatArtifactTitle, renderArtifactForPdf } from "@/lib/engineering-artifacts";

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
  proposalId?: string;
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

function isDemoImpersonationName(value: unknown): boolean {
  return /(^|\b)(cci severe service solutions|imi cci)(\b|$)/i.test(String(value ?? ""));
}

function getCoverBranding(data: PdfData, templateIndustry: string, severeServiceExport: boolean) {
  const explicitOrgName = String(data.orgName ?? "").trim();
  const safeExplicitOrgName = explicitOrgName && !isDemoImpersonationName(explicitOrgName);
  if (safeExplicitOrgName) {
    return {
      preparedBy: explicitOrgName,
      preparedFor: data.companyName && !isDemoImpersonationName(data.companyName) ? String(data.companyName).trim() : "Customer organization",
      industry: templateIndustry || data.industry,
      customerExample: "",
      status: data.status,
    };
  }
  if (severeServiceExport) {
    return {
      preparedBy: "WinsProposal Demo Engine",
      preparedFor: "Demo Customer / Severe-Service Valve OEM",
      industry: "Severe-Service Control Valves",
      customerExample: "Hydrogen / Energy Transition Project",
      status: "Draft / Demo",
    };
  }
  return {
    preparedBy: data.companyName && !isDemoImpersonationName(data.companyName) ? String(data.companyName).trim() : "WinsProposal Demo Engine",
    preparedFor: "Demo Customer",
    industry: templateIndustry || data.industry,
    customerExample: "",
    status: data.status,
  };
}

function getCoverBidReadinessScore(data: PdfData, severeServiceExport: boolean) {
  const extracted = data.extractedData ?? {};
  const candidates = [
    extracted?.bidReadinessScore,
    extracted?.bidScore,
    extracted?.dashboard?.bidReadinessScore,
    extracted?.dashboard?.["Bid Readiness Score"],
    extracted?.bidNoBidScoring?.finalScore,
    extracted?.bidNoBidScore,
  ];
  for (const candidate of candidates) {
    const numeric = Number.parseInt(String(candidate ?? "").replace(/[^0-9]/g, ""), 10);
    if (Number.isFinite(numeric) && numeric > 0) return Math.min(100, numeric);
  }
  if (severeServiceExport && data.winScore < 60) return 78;
  return Math.max(0, Math.min(100, Math.round(data.winScore || 78)));
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
      return `<p>${trimmed}</p>`;
    })
    .join("\n");

  return html;
}

function getPdfDiagramSteps(type: VisualizationType, sectionTitle = "", content = ""): string[] {
  const title = sectionTitle.toLowerCase();
  const combined = `${title} ${content.toLowerCase()}`;
  if (/executive summary|value proposition|proposal overview/.test(title)) {
    return ["Customer Requirement", "Technical Compliance", "Delivery Confidence", "Risk Reduction", "Commercial Value", "Win Theme"];
  }
  if (/project background|opportunity context|project context|customer context/.test(title)) {
    return ["Hydrogen Hub Project", "Process Criticality", "Severe Service Valve Requirement", "Compliance Standards", "OEM/EPC Evaluation", "Bid Opportunity"];
  }
  if (/scope of supply|scope of work|line items|supply scope|work breakdown/.test(title)) {
    return ["RFP Scope", "Valve Package", "Actuator / Accessories", "Documentation", "Inspection / Testing", "Delivery"];
  }
  if (/technical compliance|technical specification response|technical response|requirement response/.test(title)) {
    return ["Requirement", "Design Selection", "Material Compatibility", "Standards Compliance", "TBE Response", "Exceptions"];
  }
  if (/commercial offer|commercial summary|pricing|payment terms|warranty|exclusions/.test(combined)) {
    return ["Scope", "Cost Drivers", "Delivery Schedule", "Risk Allowance", "Price Justification", "Margin Protection"];
  }
  const stepMap: Record<VisualizationType, string[]> = {
    value_chain: ["Customer Scope", "Technical Fit", "Compliance Confidence", "Delivery Assurance", "Win Theme"],
    architecture: ["Customer Scope", "Package Basis", "Interface Review", "Controls Review", "Proposal Output"],
    process_flow: ["Input Review", "Design Basis", "Supply Planning", "Build Review", "Commissioning Support"],
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
    pfd: ["Input Review", "Design Basis", "Supply Planning", "Build Review", "Delivery Review"],
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
  return formatArtifactTitle(type);
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

function buildExecutiveRoiCoverHtml(data: PdfData, brandColor: string, safeApplication: string) {
  const extracted = data.extractedData ?? {};
  const intelligence = inferRfpIntelligence(extracted);
  const dashboard = extracted?.dashboard ?? {};
  const read = (keys: string[], fallback: string) => {
    for (const key of keys) {
      const value = dashboard?.[key] ?? extracted?.[key];
      if (value !== undefined && value !== null && String(value).trim()) return String(value);
    }
    return fallback;
  };
  const hoursSaved = read(["Engineering hours saved", "engineeringHoursSaved"], intelligence.applicationId === "hydrogen-process-control" ? "28" : "32");
  const reuse = read(["Reusable engineering content", "proposalReuse"], intelligence.applicationId === "hydrogen-process-control" ? "58%" : "64%");
  const cycleReduction = read(["Proposal turnaround reduction", "cycleTimeReduction"], intelligence.applicationId === "hydrogen-process-control" ? "44%" : "50%");
  const roiRows = [
    ["Proposal cycle time", "5.0 days", "2.8 days", `${cycleReduction} faster first-pass proposal`],
    ["Engineering hours saved", "64 hrs/bid", `${Math.max(18, 64 - (Number.parseInt(hoursSaved, 10) || 28))} hrs/bid`, `${hoursSaved} hours avoided`],
    ["Compliance review time saved", "14 hrs", "6 hrs", "8 hours avoided"],
    ["Proposal reuse", "20% ad hoc", reuse, "Controlled knowledge reuse"],
    ["Bid throughput improvement", "8 bids/month", "13 bids/month", "62% higher capacity"],
    ["Estimated annual productivity savings", "Manual baseline", "INR 34-42 lakh", "Engineering/compliance effort equivalent"],
  ];
  return `
  <div class="page roi-page">
    <div class="roi-kicker">Executive ROI Cover</div>
    <h1>Revenue Intelligence Impact</h1>
    <div class="roi-subtitle">${safeApplication || "Severe-service proposal demo"} | Customer-ready productivity view</div>
    <div class="roi-grid">
      ${roiRows.map(([label, before, after, impact]) => `
        <div class="roi-card">
          <div class="roi-label">${escapeHtml(label)}</div>
          <div class="roi-values"><span>${escapeHtml(before)}</span><strong>${escapeHtml(after)}</strong></div>
          <div class="roi-impact">${escapeHtml(impact)}</div>
        </div>
      `).join("")}
    </div>
    <div class="roi-note">
      <strong>Executive readout:</strong> WinsProposal converts severe-service proposal work into a managed revenue workflow by combining RFP extraction, reusable knowledge, compliance mapping, TBE response automation, drawing intelligence, and export-ready governance evidence. For this hydrogen control valve package, the demo productivity model indicates a reduction in first-pass proposal cycle time from 5.0 days to 2.8 days, engineering effort reduction from 64 hours to 36 hours, and compliance review effort reduction from 14 hours to 6 hours.
    </div>
    <div class="roi-disclaimer">Proposal-stage productivity model. These figures are indicative estimates and should be validated against the customer's actual baseline.</div>
  </div>`;
}

function buildPdfDiagramHtml(sectionTitle: string, content: string, brandColor: string, type: VisualizationType): string {
  const steps = getPdfDiagramSteps(type, sectionTitle, content).map(escapeHtml);
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
  const safeTitle = escapeHtml(data.title);
  const safeIndustry = escapeHtml(data.industry);
  const templateMetadata = parseProposalTemplateMetadata(data.templateType);
  const safeTemplateType = escapeHtml(templateMetadata.template);
  const safeApplication = escapeHtml(templateMetadata.application);
  const safePackageType = escapeHtml(templateMetadata.packageType);
  const intelligence = inferRfpIntelligence(data.extractedData ?? {});
  const severeServiceExport = /severe-service|hydrogen|lng|compressor|steam|refinery/i.test(`${data.templateType} ${data.industry} ${templateMetadata.application}`);
  const coverBranding = getCoverBranding(data, templateMetadata.industry, severeServiceExport);
  const safeOrgLogoUrl = coverBranding.preparedBy === "WinsProposal Demo Engine" ? "" : sanitizeImageUrl(data.orgLogoUrl);
  const safePreparedBy = escapeHtml(coverBranding.preparedBy);
  const safePreparedFor = escapeHtml(coverBranding.preparedFor);
  const safeCoverIndustry = escapeHtml(coverBranding.industry);
  const safeCustomerExample = escapeHtml(coverBranding.customerExample);
  const safeStatus = escapeHtml(coverBranding.status);
  const bidReadinessScore = getCoverBidReadinessScore(data, severeServiceExport);
  const bidReadinessColor = bidReadinessScore >= 80 ? "#6ee7b7" : bidReadinessScore >= 60 ? "#fcd34d" : "#fca5a5";
  const vaultCategories = getSevereServiceVaultSourceCategories(intelligence.applicationId);
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
        proposalId: data.proposalId,
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
    ...safeSections.map((s, i) => ({ label: `${i + 1}. ${s.sectionTitle}`, href: `#section-${i + 1}` })),
    ...(safeComplianceItems.length > 0 ? [{ label: `${safeSections.length + 1}. Compliance Checklist`, href: "#compliance-checklist" }] : []),
    ...(safeTbeData ? [{ label: `${safeSections.length + (safeComplianceItems.length > 0 ? 2 : 1)}. Technical Bid Evaluation (TBE)`, href: "#technical-bid-evaluation" }] : []),
  ];
  const tocItems = tocEntries
    .map(
      (entry) =>
        `<a href="${entry.href}" class="toc-link">
          <span>${entry.label}</span>
        </a>`
    )
    .join("");
  const roiCoverHtml = severeServiceExport ? buildExecutiveRoiCoverHtml(data, brandColor, safeApplication) : "";
  const vaultCategoryHtml = severeServiceExport
    ? `<div class="vault-category-grid">
        ${vaultCategories.map((item) => `<div><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.detail)}</span></div>`).join("")}
      </div>`
    : "";

  // Build proposal body as a continuous document. The PDF engine paginates
  // naturally while artifact blocks stay near their section content.
  const sectionPages = safeSections
    .map(
      (s, i) =>
        `<section id="section-${i + 1}" class="proposal-section">
          <div class="section-start-block">
            <div class="section-heading section-heading-block">
              <div class="section-number">${i + 1}</div>
              <h2 class="section-title">${s.sectionTitle}</h2>
              ${s.sourceType === "vault" ? '<span class="source-badge">From Vault</span>' : ''}
            </div>
            <div class="section-intro section-body">
              ${s.contentHtml}
            </div>
            ${s.artifactHtml}
          </div>
          ${data.includeDiagrams !== false && !s.artifactHtml && shouldRenderProposalDiagram(s.sectionTitle, s.content) ? s.diagramHtml : ""}
        </section>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Inter, Helvetica, sans-serif; color: #1f2937; font-size:10.8pt; line-height:1.55; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { width: 210mm; min-height: 297mm; padding: 20mm 21mm 24mm 21mm; position: relative; page-break-after: always; page-break-inside: avoid; overflow: visible; }
    .body-page { height:auto; min-height:297mm; overflow:visible; page-break-after:auto; page-break-inside:auto; }
    .page:last-child { page-break-after: auto; }
    .cover-page { background: linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 50%, ${brandColor}bb 100%); color: white; display: flex; flex-direction: column; justify-content: center; padding: 35mm 30mm; min-height: 297mm; }
    .cover-page .accent-line { width: 80px; height: 4px; background: #10b981; margin-bottom: 30px; }
    .cover-page h1 { font-size: 32px; font-weight: 800; line-height: 1.2; margin-bottom: 16px; }
    .cover-page .subtitle { font-size: 14px; opacity: 0.85; margin-bottom: 40px; line-height: 1.5; }
    .cover-meta { display: flex; gap: 30px; margin-top: auto; padding-top: 40px; border-top: 1px solid rgba(255,255,255,0.2); }
    .cover-meta div { font-size: 11px; }
    .cover-meta .label { opacity: 0.6; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    .roi-page { background:#f8fafc; }
    .roi-kicker { color:${brandColor}; text-transform:uppercase; letter-spacing:.8px; font-size:10px; font-weight:900; }
    .roi-page h1 { color:#0f172a; font-size:28px; margin:8px 0 6px; }
    .roi-subtitle { color:#475569; font-size:12px; margin-bottom:18px; }
    .roi-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .roi-card { background:white; border:1px solid #cbd5e1; border-radius:8px; padding:12px; min-height:90px; }
    .roi-label { color:#64748b; font-size:8.5px; font-weight:900; text-transform:uppercase; letter-spacing:.4px; }
    .roi-values { display:flex; justify-content:space-between; align-items:flex-end; gap:10px; margin-top:8px; }
    .roi-values span { color:#94a3b8; font-size:13px; text-decoration:line-through; }
    .roi-values strong { color:${brandColor}; font-size:18px; }
    .roi-impact { color:#334155; font-size:9.5px; font-weight:700; margin-top:8px; }
    .roi-note { margin-top:18px; background:white; border-left:5px solid ${brandColor}; padding:12px; font-size:11px; line-height:1.55; color:#1f2937; }
    .roi-disclaimer { margin-top:12px; color:#92400e; background:#fffbeb; border:1px solid #fde68a; border-radius:7px; padding:9px; font-size:9px; font-weight:700; }
    .vault-category-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:12px; }
    .vault-category-grid div { background:white; border:1px solid #bbf7d0; border-radius:7px; padding:8px; }
    .vault-category-grid strong { display:block; color:#065f46; font-size:9px; margin-bottom:3px; }
    .vault-category-grid span { display:block; color:#047857; font-size:8.5px; line-height:1.35; }
    .toc-page { }
    .toc-title { font-size: 20px; font-weight: 700; color: ${brandColor}; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 3px solid ${brandColor}; }
    .toc-link { display:block; padding:7px 0; border-bottom:1px dotted #d1d5db; text-decoration:none; color:#374151; font-size:12px; }
    .toc-link span:first-child { max-width:150mm; }
    .section-page { }
    .proposal-section { break-inside:avoid; page-break-inside:avoid; break-before:auto; page-break-before:auto; margin-bottom:28px; padding-bottom:16px; border-bottom:1px solid #e5e7eb; overflow:visible; }
    .section-start-block { break-inside: avoid; page-break-inside: avoid; break-before:auto; page-break-before:auto; }
    .section-heading-block { break-after: avoid; page-break-after: avoid; break-inside: avoid; page-break-inside: avoid; }
    .section-heading { display:flex; align-items:center; gap:10px; margin-bottom:14px; padding-bottom:8px; border-bottom:2px solid ${brandColor}; }
    .section-number { width:26px; height:26px; border-radius:999px; display:inline-flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; background:${brandColor}; color:white; flex:0 0 26px; }
    .section-title { font-size:15px; font-weight:700; letter-spacing:0.2px; color:#0f3440; margin:0; line-height:1.25; }
    .section-body { font-size:10.8pt; line-height:1.55; color:#1f2933; max-width:168mm; }
    .section-body p { margin:0 0 10px 0; max-width:162mm; }
    .source-badge { background:#d1fae5; color:#065f46; font-size:9px; padding:2px 8px; border-radius:10px; white-space:nowrap; }
    .section-intro { break-after: avoid; page-break-after: avoid; orphans: 3; widows: 3; }
    .section-page p { text-align: left; margin: 0 0 10px 0; line-height: 1.55; }
    .section-page ul { text-align: left; }
    .section-page li { text-align: left; }
    .diagram-block { display:block; margin-top: 20px; padding: 14px 12px 16px; border: 1px solid #dbeafe; border-radius: 10px; background: #f8fafc; break-inside: avoid; page-break-inside: avoid; break-before:auto; page-break-before:auto; overflow:visible; }
    .engineering-artifact { display:block; margin: 14px 0 18px; padding: 12px; border: 1px solid #bfdbfe; border-radius: 10px; background: #f8fafc; break-inside: avoid; page-break-inside: avoid; break-before:auto; page-break-before:auto; overflow:visible; }
    .artifact-kicker { font-size: 8.5px; color: #1d4ed8; text-transform: uppercase; font-weight: 800; letter-spacing: .5px; }
    .artifact-title { font-size: 12px; color: #111827; font-weight: 800; margin-top: 2px; break-after: avoid; page-break-after: avoid; }
    .artifact-meta { font-size: 9px; color: #6b7280; margin: 3px 0 8px; }
    .artifact-disclaimer { font-size: 9px; color: #92400e; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 7px 8px; margin: 8px 0; }
    .artifact-table-title { font-size:9.5px; color:#111827; font-weight:800; margin:10px 0 4px; break-after: avoid; page-break-after: avoid; }
    .artifact-table { width:100%; border-collapse:collapse; background:white; font-size:8.5px; margin:8px 0 12px; break-inside: avoid; page-break-inside: avoid; }
    .artifact-table thead { display: table-header-group; break-after: avoid; page-break-after: avoid; }
    .artifact-table tr { break-inside: avoid; page-break-inside: avoid; }
    .artifact-table th { background:#eff6ff; color:#111827; text-align:left; padding:6px; border:1px solid #cbd5e1; font-size:7.8px; }
    .artifact-table td { padding:6px; border:1px solid #d1d5db; vertical-align:top; }
    .artifact-visual-card { display:block; background:white; border:1px solid #d1d5db; border-radius:8px; padding:9px; margin:8px 0; break-inside: avoid; page-break-inside: avoid; break-before:auto; page-break-before:auto; overflow:visible; }
    .artifact-visual-title { font-size:10px; font-weight:800; color:#111827; }
    .artifact-visual-type { font-size:8.5px; color:#6b7280; margin:2px 0 7px; }
    .artifact-node-row { display:flex; flex-wrap:wrap; align-items:center; gap:5px; }
    .artifact-node-wrap { display:flex; align-items:center; gap:5px; }
    .artifact-node { border:1px solid #bfdbfe; background:#f8fafc; border-radius:6px; padding:5px 7px; font-size:8.5px; font-weight:700; color:#1f2937; }
    .artifact-arrow { font-size:12px; font-weight:800; }
    .artifact-diagram { border:1px solid #dbeafe; background:#f8fafc; border-radius:8px; padding:8px; margin-top:5px; break-inside: avoid; page-break-inside: avoid; }
    .artifact-diagram-flow { display:flex; align-items:stretch; gap:5px; flex-wrap:wrap; }
    .artifact-diagram-node { border:1px solid #bfdbfe; background:white; border-radius:7px; padding:7px 8px; font-size:8.5px; font-weight:800; color:#1f2937; min-height:30px; display:flex; align-items:center; justify-content:center; text-align:center; flex:1 1 92px; }
    .artifact-diagram-node.primary { border-color:${brandColor}; background:#eff6ff; color:${brandColor}; }
    .artifact-diagram-arrow { font-size:12px; font-weight:900; align-self:center; flex:0 0 auto; }
    .artifact-diagram-support { display:flex; gap:7px; flex-wrap:wrap; margin-top:7px; padding-top:7px; border-top:1px dashed #cbd5e1; }
    .artifact-diagram-feedback { border:1px dashed; border-radius:999px; background:white; padding:4px 8px; font-size:8px; font-weight:800; }
    .artifact-diagram-annotations { display:grid; grid-template-columns:repeat(2,1fr); gap:4px; margin-top:7px; padding-top:7px; border-top:1px solid #e5e7eb; }
    .artifact-diagram-annotations span { background:white; border-radius:5px; padding:4px 5px; font-size:7.6px; line-height:1.25; color:#4b5563; font-weight:700; }
    .die-card { display:block; background:white; border:1px solid #cbd5e1; border-radius:8px; margin:8px auto 12px; max-width:100%; overflow:visible; break-inside: avoid; page-break-inside: avoid; }
    .die-card + .die-card { break-before: page; page-break-before: always; }
    .die-head { display:flex; justify-content:space-between; gap:10px; padding:8px 10px; background:#f8fafc; border-bottom:1px solid #e2e8f0; }
    .die-kicker { color:${brandColor}; font-size:8px; font-weight:900; text-transform:uppercase; letter-spacing:.35px; }
    .die-title { color:#0f172a; font-size:11px; font-weight:900; margin-top:2px; }
    .die-subtitle { color:#475569; font-size:8.5px; line-height:1.35; margin-top:2px; }
    .die-status { color:#92400e; background:#fffbeb; border:1px solid #fde68a; border-radius:999px; padding:4px 7px; height:max-content; font-size:7.5px; font-weight:800; }
    .die-disclaimer { color:#92400e; background:#fffbeb; border-bottom:1px solid #fde68a; padding:5px 9px; font-size:7.8px; font-weight:700; line-height:1.3; }
    .die-svg { width:100%; height:auto; display:block; background:white; margin:0 auto; overflow:visible; }
    .die-symbol-label { fill:#0f172a; font-size:10px; font-weight:800; text-anchor:middle; }
    .die-symbol-tag { fill:${brandColor}; font-size:9.4px; font-weight:900; text-anchor:middle; }
    .die-connector-label { fill:#475569; font-size:8.6px; font-weight:800; text-anchor:middle; }
    .die-note { fill:#78350f; font-size:7.8px; font-weight:800; }
    .die-title-block-text { fill:#334155; font-size:8px; font-weight:800; }
    .die-meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; padding:8px; background:#f8fafc; border-top:1px solid #e2e8f0; }
    .die-meta-grid div { background:white; border:1px solid #e2e8f0; border-radius:5px; padding:5px 6px; }
    .die-meta-grid strong { display:block; color:#64748b; font-size:7px; text-transform:uppercase; margin-bottom:2px; }
    .die-meta-grid span { display:block; color:#334155; font-size:8px; line-height:1.3; font-weight:700; }
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
    .compliance-summary { margin:0 0 10px; color:#0f4c5c; font-size:12px; font-weight:800; }
    .compliance-disclaimer { margin:0 0 14px; color:#92400e; background:#fffbeb; border:1px solid #fde68a; border-radius:7px; padding:8px 10px; font-size:9.5px; line-height:1.45; font-weight:700; break-inside: avoid; page-break-inside: avoid; }
    .compliance-table { width:100%; border-collapse:collapse; background:white; font-size:10px; break-inside:auto; page-break-inside:auto; }
    .compliance-table thead { display:table-header-group; }
    .compliance-table th { background:${brandColor}; color:white; padding:8px 10px; text-align:left; font-weight:700; border:1px solid #d1d5db; }
    .compliance-table td { padding:8px 10px; border:1px solid #d1d5db; vertical-align:top; line-height:1.45; }
    .compliance-table tr { break-inside:avoid; page-break-inside:avoid; }
    .compliance-status { display:inline-block; color:#065f46; background:#d1fae5; border:1px solid #86efac; border-radius:999px; padding:3px 8px; font-size:8.5px; font-weight:800; line-height:1.25; }
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
    ${!safeOrgLogoUrl ? `<div style="font-size:14px;opacity:0.75;margin-bottom:16px;letter-spacing:1px;text-transform:uppercase;">${safePreparedBy}</div>` : ""}
    <div class="accent-line"></div>
    <h1>${safeTitle}</h1>
    <div class="subtitle">
      ${safeCoverIndustry ? safeCoverIndustry + " Industry" : ""} Technical &amp; Commercial Proposal
      <br/>Prepared by: ${safePreparedBy}
      <br/>Prepared for: ${safePreparedFor}
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:30px;">
      <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:12px 20px;">
        <div style="font-size:9px;opacity:0.7;text-transform:uppercase;letter-spacing:1px;">Bid Readiness Score</div>
        <div style="font-size:28px;font-weight:800;color:${bidReadinessColor};">${bidReadinessScore}%</div>
      </div>
      <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:12px 20px;">
        <div style="font-size:9px;opacity:0.7;text-transform:uppercase;letter-spacing:1px;">Proposal Sections</div>
        <div style="font-size:28px;font-weight:800;">${data.sections.length}</div>
      </div>
      <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:12px 20px;">
        <div style="font-size:9px;opacity:0.7;text-transform:uppercase;letter-spacing:1px;">Vault Sources</div>
        <div style="font-size:28px;font-weight:800;">${data.vaultDocumentsUsed}</div>
      </div>
      <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:12px 20px;">
        <div style="font-size:9px;opacity:0.7;text-transform:uppercase;letter-spacing:1px;">Proposal Status</div>
        <div style="font-size:19px;font-weight:800;line-height:1.2;margin-top:6px;">${safeStatus}</div>
      </div>
    </div>
    <div class="cover-meta">
      <div><div class="label">Date</div>${date}</div>
      <div><div class="label">Template</div>${safeTemplateType}</div>
      ${safeApplication ? `<div><div class="label">Application</div>${safeApplication}</div>` : ""}
      ${safePackageType ? `<div><div class="label">Package</div>${safePackageType}</div>` : ""}
      ${safeCustomerExample ? `<div><div class="label">Customer Example</div>${safeCustomerExample}</div>` : ""}
      <div><div class="label">Industry</div>${safeCoverIndustry || safeIndustry}</div>
    </div>
  </div>

  ${roiCoverHtml}

  <!-- TABLE OF CONTENTS -->
  <div class="page toc-page">
    <div class="toc-title">Table of Contents</div>
    ${tocItems}
    <div style="margin-top:30px;padding:16px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;">
      <div style="font-size:11px;color:#065f46;">
        <strong>Vault Coverage:</strong> ${data.vaultSectionsUsed} of ${data.sections.length} sections sourced from knowledge vault (${data.vaultDocumentsUsed} documents referenced)
      </div>
      ${vaultCategoryHtml}
    </div>

  </div>

  <!-- CONTENT SECTIONS -->
  <div class="page body-page">
    ${sectionPages}
  </div>

  ${safeComplianceItems.length > 0 ? `
  <!-- COMPLIANCE SECTION -->
  <div id="compliance-checklist" class="page section-page">
    <div class="section-heading section-heading-block">
      <div class="section-number">✓</div>
      <h2 class="section-title">Compliance Checklist</h2>
    </div>
    <div class="compliance-summary">${safeComplianceItems.length}/${safeComplianceItems.length} proposal-stage requirements mapped</div>
    <div class="compliance-disclaimer">Final sizing/design must be validated by qualified engineers using company-approved tools and applicable licensed standards before final design release.</div>
    <table class="compliance-table">
      <thead>
        <tr>
          <th>Status</th>
          <th>Requirement</th>
          <th>Review Basis / Validation</th>
        </tr>
      </thead>
      <tbody>
        ${safeComplianceItems.map((item, idx) => {
          const status = item.checked ? "Proposal-Stage Covered" : "Mapped / Engineering Validation Required";
          const validation = item.standard
            ? `${item.standard}. Engineering validation required before final design release.`
            : "Engineering validation required before final design release.";
          return `<tr>
            <td><span class="compliance-status">${status}</span></td>
            <td><strong>${item.label}</strong></td>
            <td>${validation}</td>
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
