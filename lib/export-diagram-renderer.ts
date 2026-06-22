import { drawingTypeLabel, type DrawingPackage } from "@/lib/drawing-intelligence";
import { getDrawingSymbolDefinition } from "@/lib/drawing-symbols";
import { getMermaidImageUrl } from "@/lib/visualization-service";

export const DIAGRAM_TEXT_FALLBACK_WARNING = "Diagram rendered as text fallback.";

export type ExportDiagramPng = {
  buffer: Buffer;
  dataUri: string;
  width: number;
  height: number;
};

type FetchLike = typeof fetch;

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function getDrawingExportKey(drawing: DrawingPackage) {
  return drawing.titleBlock?.drawingNo || drawing.title;
}

export function getPngDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length >= 24 && buffer.toString("ascii", 1, 4) === "PNG") {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  return null;
}

function mermaidLabel(value: unknown, fallback = "Review") {
  return String(value ?? fallback)
    .replace(/[<>"`|]/g, " ")
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 72) || fallback;
}

export function drawingPackageToMermaidFallback(drawing: DrawingPackage) {
  const symbols = drawing.symbols.slice(0, 10);
  if (symbols.length === 0) {
    return `graph LR\n  A["${mermaidLabel(drawing.title)}"] --> B["Engineering Review Required"]`;
  }

  const lines = ["graph LR"];
  for (const symbol of symbols) {
    lines.push(`  ${symbol.id.replace(/[^A-Za-z0-9_]/g, "_")}["${mermaidLabel(symbol.tag || symbol.label)}"]`);
  }
  const includedIds = new Set(symbols.map((symbol) => symbol.id));
  const connectors = drawing.connectors.filter((connector) => includedIds.has(connector.from) && includedIds.has(connector.to));
  if (connectors.length) {
    for (const connector of connectors) {
      const from = connector.from.replace(/[^A-Za-z0-9_]/g, "_");
      const to = connector.to.replace(/[^A-Za-z0-9_]/g, "_");
      lines.push(`  ${from} --> ${to}`);
    }
  } else {
    for (let index = 0; index < symbols.length - 1; index++) {
      lines.push(`  ${symbols[index].id.replace(/[^A-Za-z0-9_]/g, "_")} --> ${symbols[index + 1].id.replace(/[^A-Za-z0-9_]/g, "_")}`);
    }
  }
  return lines.join("\n");
}

export async function renderDrawingPackagePng(
  drawing: DrawingPackage,
  options: { fetcher?: FetchLike; minBytes?: number } = {}
): Promise<ExportDiagramPng | null> {
  const fetcher = options.fetcher ?? fetch;
  const minBytes = options.minBytes ?? 5000;
  const url = getMermaidImageUrl(drawingPackageToMermaidFallback(drawing), "png");

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetcher(url, { signal: AbortSignal.timeout(15000) } as RequestInit);
      if (!response.ok) continue;
      const buffer = Buffer.from(await response.arrayBuffer());
      const dimensions = getPngDimensions(buffer);
      if (!dimensions || buffer.length < minBytes) continue;
      return {
        buffer,
        dataUri: `data:image/png;base64,${buffer.toString("base64")}`,
        ...dimensions,
      };
    } catch {
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return null;
}

export function drawingPackageFallbackRows(drawing: DrawingPackage) {
  return drawing.symbols.map((symbol, index) => ({
    step: index + 1,
    symbol: symbol.label,
    tag: symbol.tag || "-",
    role: getDrawingSymbolDefinition(symbol.kind).label,
  }));
}

export function renderDrawingPackageFallbackHtml(drawing: DrawingPackage) {
  const rows = drawingPackageFallbackRows(drawing);
  return `
    <div class="diagram-fallback-warning">${escapeHtml(DIAGRAM_TEXT_FALLBACK_WARNING)}</div>
    <table class="diagram-fallback-table">
      <thead><tr><th>Step</th><th>Symbol / Node</th><th>Tag</th><th>Role</th></tr></thead>
      <tbody>
        ${rows.map((row) => `<tr><td>${row.step}</td><td>${escapeHtml(row.symbol)}</td><td>${escapeHtml(row.tag)}</td><td>${escapeHtml(row.role)}</td></tr>`).join("")}
      </tbody>
    </table>
    <div class="diagram-fallback-notes">
      <strong>Flow:</strong> ${escapeHtml(drawing.symbols.map((symbol) => symbol.tag || symbol.label).join(" -> ") || drawing.title)}
    </div>
  `;
}

export function renderDrawingPackageExportHtml(
  drawing: DrawingPackage,
  brandColor = "#1a365d",
  imageDataUri?: string | null
) {
  return `<div class="die-card">
    <div class="die-head">
      <div>
        <div class="die-kicker">${escapeHtml(drawingTypeLabel(drawing.drawingType))}</div>
        <div class="die-title">${escapeHtml(drawing.title)}</div>
        <div class="die-subtitle">${escapeHtml(drawing.subtitle)}</div>
      </div>
      <div class="die-status">${escapeHtml(drawing.reviewStatus.join(" - "))}</div>
    </div>
    <div class="die-disclaimer">${escapeHtml(drawing.disclaimer)}</div>
    ${imageDataUri
      ? `<div class="diagram-image-frame"><img src="${escapeHtml(imageDataUri)}" alt="${escapeHtml(drawing.title)}" /></div>`
      : renderDrawingPackageFallbackHtml(drawing)}
    <div class="die-meta-grid">
      <div><strong>Tags used</strong><span>${escapeHtml(drawing.tagsUsed.join(", ") || "TBD")}</span></div>
      <div><strong>Engineering review notes</strong><span>${escapeHtml(drawing.engineeringReviewNotes.join(" "))}</span></div>
      <div><strong>Standards-awareness notes</strong><span>${escapeHtml(drawing.standardsAwareness.map((item) => item.label).join(" | "))}</span></div>
      <div><strong>Revision</strong><span>${escapeHtml(drawing.revisionBlock.revision)} - ${escapeHtml(drawing.revisionBlock.description)}</span></div>
    </div>
  </div>`;
}

