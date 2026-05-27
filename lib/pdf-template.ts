/**
 * HTML template for PDF export of proposals
 */

interface PdfSection {
  sectionTitle: string;
  content: string;
  sourceType: string;
  diagramSvgUrl?: string; // mermaid.ink URL for the diagram
}

interface TbeData {
  lineItems: string[];
  tags: string[];
  cells: Record<string, string>; // key: "lineItemIndex-tag"
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
  tbeData?: TbeData;
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
  const safeTemplateType = escapeHtml(data.templateType);
  const safeStatus = escapeHtml(data.status);
  const safeOrgLogoUrl = sanitizeImageUrl(data.orgLogoUrl);
  const safeSections = data.sections.map((section) => ({
    ...section,
    sectionTitle: escapeHtml(section.sectionTitle),
    contentHtml: markdownToHtml(section.content),
    diagramSvgUrl: sanitizeImageUrl(section.diagramSvgUrl),
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

  // Build TOC
  const tocItems = safeSections
    .map(
      (s, i) =>
        `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:6px 0;border-bottom:1px dotted #d1d5db;">
          <span style="font-size:12px;color:#374151;">${i + 1}. ${s.sectionTitle}</span>
          <span style="font-size:11px;color:#6b7280;flex-shrink:0;margin-left:8px;">Page ${i + 2}</span>
        </div>`
    )
    .join("");

  // Build section pages — each section gets its own page
  const sectionPages = safeSections
    .map(
      (s, i) =>
        `<div class="page section-page">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid ${brandColor};">
            <div style="background:${brandColor};color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0;">${i + 1}</div>
            <h2 style="font-size:16px;font-weight:700;color:${brandColor};margin:0;">${s.sectionTitle}</h2>
            ${s.sourceType === "vault" ? '<span style="background:#d1fae5;color:#065f46;font-size:9px;padding:2px 8px;border-radius:10px;">From Vault</span>' : ''}
          </div>
          <div style="font-size:11.5px;color:#1f2937;line-height:1.7;">
            ${s.contentHtml}
          </div>
          ${s.diagramSvgUrl ? `
          <div style="margin-top:20px;padding-top:14px;border-top:1px solid #e5e7eb;">
            <div style="font-size:10px;color:#6b7280;margin-bottom:8px;font-style:italic;">${s.sectionTitle} — Process Diagram</div>
            <div style="text-align:center;">
              <img src="${escapeAttr(s.diagramSvgUrl)}" alt="${escapeAttr(s.sectionTitle)} diagram" style="max-width:100%;max-height:280px;object-fit:contain;" />
            </div>
          </div>` : ''}
        </div>`
    )
    .join("");

  const totalPages = data.sections.length + 2; // cover + TOC + sections

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; color: #1f2937; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { width: 210mm; min-height: 297mm; padding: 20mm 22mm 25mm 22mm; position: relative; page-break-after: always; page-break-inside: avoid; overflow: hidden; }
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
    .section-page { }
    .section-page p { text-align: left; margin: 4px 0; line-height: 1.7; }
    .section-page ul { text-align: left; }
    .section-page li { text-align: left; }
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

  <!-- CONTENT SECTIONS — each section is its own page -->
  ${sectionPages}

  ${safeTbeData ? `
  <!-- TBE SECTION -->
  ${safeTbeData.lineItems.map((lineItem, liIdx) => `
  <div class="page section-page">
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
