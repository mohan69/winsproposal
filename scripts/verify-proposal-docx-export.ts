import fs from "node:fs/promises";
import JSZip from "jszip";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { buildDrawingPackages, drawingTypeLabel, type DrawingPackage } from "../lib/drawing-intelligence";
import { getBestVisualizationType, getFallbackVisualization } from "../lib/visualization-service";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function xmlEscape(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getImageDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length >= 24 && buffer.toString("ascii", 1, 4) === "PNG") {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  return null;
}

async function fetchPng(url: string): Promise<{ buffer: Buffer; width: number; height: number }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  assert(res.ok, `Image fetch failed: ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const dimensions = getImageDimensions(buffer);
  if (!dimensions) throw new Error(`Fetched image is not a PNG: ${url}`);
  return { buffer, width: dimensions.width, height: dimensions.height };
}

function fit(width: number, height: number, maxWidth = 620, maxHeight = 340) {
  const ratio = Math.min(maxWidth / Math.max(width, 1), maxHeight / Math.max(height, 1), 1);
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}

function drawingSvg(drawing: DrawingPackage, brandColor: string) {
  const symbolById = new Map(drawing.symbols.map((symbol) => [symbol.id, symbol]));
  const markerId = `verify-${drawing.titleBlock.drawingNo.replace(/[^a-zA-Z0-9-]/g, "-")}`;
  const connectors = drawing.connectors.map((item) => {
    const from = symbolById.get(item.from);
    const to = symbolById.get(item.to);
    if (!from || !to) return "";
    const x1 = from.x + (from.width ?? 112) / 2;
    const y1 = from.y + (from.height ?? 54) / 2;
    const x2 = to.x + (to.width ?? 112) / 2;
    const y2 = to.y + (to.height ?? 54) / 2;
    const dashed = item.lineType === "instrument" || item.lineType === "pneumatic" ? `stroke-dasharray="7 5"` : "";
    const color = item.lineType === "process" ? "#111827" : brandColor;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2" ${dashed} marker-end="url(#${markerId})"/>`;
  }).join("");
  const symbols = drawing.symbols.map((item) => {
    const width = item.width ?? 112;
    const height = item.height ?? 54;
    const isValve = item.kind.includes("valve");
    const body = isValve
      ? `<polygon points="${item.x + 8},${item.y + height / 2} ${item.x + width / 2},${item.y + 9} ${item.x + width - 8},${item.y + height / 2} ${item.x + width / 2},${item.y + height - 9}" fill="#fff" stroke="${brandColor}" stroke-width="2"/>`
      : `<rect x="${item.x}" y="${item.y}" width="${width}" height="${height}" rx="4" fill="#fff" stroke="${brandColor}" stroke-width="1.8"/>`;
    return `${body}<text x="${item.x + width / 2}" y="${item.y + height / 2 + 3}" class="label">${xmlEscape(item.label)}</text>${item.tag ? `<text x="${item.x + width / 2}" y="${item.y + height + 15}" class="tag">${xmlEscape(item.tag)}</text>` : ""}`;
  }).join("");
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="980" height="360" viewBox="0 0 980 360">
  <defs><marker id="${markerId}" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="${brandColor}"/></marker></defs>
  <style>text{font-family:Arial,Helvetica,sans-serif}.title{fill:#0f172a;font-size:18px;font-weight:800}.sub{fill:#475569;font-size:11px;font-weight:700}.label{fill:#0f172a;font-size:9px;font-weight:800;text-anchor:middle}.tag{fill:${brandColor};font-size:8.5px;font-weight:900;text-anchor:middle}.meta{fill:#334155;font-size:8px;font-weight:800}</style>
  <rect width="980" height="360" fill="#fff"/>
  <rect x="16" y="14" width="948" height="46" fill="#f8fafc" stroke="#cbd5e1"/>
  <text x="28" y="38" class="title">${xmlEscape(drawing.title)}</text>
  <text x="620" y="34" class="sub">${xmlEscape(drawingTypeLabel(drawing.drawingType))}</text>
  <text x="620" y="51" class="sub">${xmlEscape(drawing.reviewStatus.join(" - "))}</text>
  <rect x="16" y="72" width="948" height="212" fill="#fbfdff" stroke="#cbd5e1"/>
  ${connectors}
  ${symbols}
  <rect x="16" y="296" width="948" height="44" fill="#fff" stroke="#94a3b8"/>
  <text x="28" y="316" class="meta">Tags: ${xmlEscape(drawing.tagsUsed.join(", ") || "TBD")}</text>
  <text x="28" y="332" class="meta">Proposal-stage technical drawing. Not for construction. Final validation required.</text>
</svg>`, "utf8");
}

async function buildVerificationDocx() {
  const brandColor = "1a365d";
  const templateType = "Hydrogen Process Control Valve Proposal | Application: Hydrogen Process Control / Export Header Control | Industry: Severe-Service Control Valves | Package Type: Severe-Service Control Valve Proposal";
  const extractedData = {
    title: "Hydrogen Process Control Valve Package",
    processConditions: { fluid: "Hydrogen-rich process gas", inletPressure: "48 barg", outletPressure: "18 barg", temperature: "60°C" },
    requirements: [
      { id: "H2-001", description: "Hydrogen pressure control valves HV-H2-3101A/B/C/D" },
      { id: "H2-002", description: "P&ID-lite control loop with positioner, solenoid, actuator, and feedback" },
      { id: "H2-003", description: "Material traceability, MTC, PMI, leakage test evidence, and MDR release" },
    ],
  };
  const sections = [
    ["Executive Summary", "Customer requirement, technical compliance, delivery confidence, risk reduction, commercial value, and win theme."],
    ["Project Background / Opportunity Context", "Hydrogen hub project, process criticality, severe service valve requirement, compliance standards, OEM/EPC evaluation, and bid opportunity."],
    ["Process Conditions", "Hydrogen feed, isolation, filtration, control valve package, export header, pressure monitoring, and process safety review."],
    ["Engineering Basis", "RFP process inputs, proposal-stage assumptions, ISA IEC sizing review, ASME and materials review, risk flags, and qualified engineer validation."],
    ["Commercial Summary", "Scope, cost drivers, delivery schedule, risk allowance, price justification, and margin protection."],
  ];
  const children: Paragraph[] = [
    new Paragraph({ children: [new TextRun({ text: "Hydrogen Process Control Valve Package", bold: true, size: 30, color: brandColor })], spacing: { after: 240 } }),
  ];
  for (const [sectionTitle, content] of sections) {
    const type = getBestVisualizationType(sectionTitle, content, { templateType, industry: "Severe-Service Control Valves" });
    const visual = getFallbackVisualization({ title: "Hydrogen Process Control Valve Package", sectionTitle, content, templateType, industry: "Severe-Service Control Valves" }, type);
    const image = await fetchPng(visual.imageUrl);
    children.push(new Paragraph({ children: [new TextRun({ text: `${sectionTitle} - ${visual.title.split(" - ").pop()}`, bold: true, size: 22, color: brandColor })], heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 100 }, keepNext: true }));
    children.push(new Paragraph({ children: [new ImageRun({ type: "png", data: image.buffer, transformation: fit(image.width, image.height), altText: { title: sectionTitle, description: visual.title, name: sectionTitle } })], alignment: AlignmentType.CENTER, spacing: { after: 180 } }));
  }
  const drawings = buildDrawingPackages({ proposalId: "docx-verify", templateType, extractedData });
  for (const drawing of drawings) {
    children.push(new Paragraph({ children: [new TextRun({ text: drawing.title, bold: true, size: 22, color: brandColor })], heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 80 }, keepNext: true }));
    children.push(new Paragraph({ children: [new TextRun({ text: drawing.disclaimer, italics: true, size: 18, color: "92400e" })], spacing: { after: 80 }, keepNext: true }));
    children.push(new Paragraph({
      children: [new ImageRun({
        type: "svg",
        data: drawingSvg(drawing, brandColor),
        fallback: { type: "png", data: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=", "base64") },
        transformation: { width: 620, height: 228 },
        altText: { title: drawing.title, description: drawing.subtitle, name: drawing.title },
      })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 180 },
    }));
  }
  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            children: [new TextRun({ text: "Hydrogen Process Control Valve Package | Proposal-stage engineering estimate", size: 14, color: "777777" })],
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 1, color: "dddddd" } },
          })],
        }),
      },
      children,
    }],
  });
  return Packer.toBuffer(doc);
}

async function main() {
  const buffer = await buildVerificationDocx();
  const zip = await JSZip.loadAsync(buffer);
  const fileNames = Object.keys(zip.files);
  const mediaFiles = fileNames.filter((name) => /^word\/media\//.test(name));
  const documentXml = await zip.file("word/document.xml")?.async("string");
  const footerXml = (await Promise.all(fileNames.filter((name) => /^word\/footer\d+\.xml$/.test(name)).map(async (name) => zip.file(name)?.async("string") ?? ""))).join("\n");
  if (!documentXml) throw new Error("DOCX: missing word/document.xml");
  const xmlText = stripXml(`${documentXml ?? ""}\n${footerXml}`);
  const routeSource = await fs.readFile("app/api/proposals/[id]/export-docx/route.ts", "utf8");

  assert(mediaFiles.length > 0, "DOCX: expected embedded files under word/media/");
  assert(mediaFiles.length >= 8, `DOCX: expected at least 8 embedded media files, found ${mediaFiles.length}`);
  assert((documentXml.match(/<w:drawing/g) ?? []).length >= 8, "DOCX: expected at least 8 w:drawing objects");
  assert(!/Page\s+of/i.test(xmlText), "DOCX footer: broken 'Page  of' text should not be present");
  assert(xmlText.includes("Hydrogen Process Control Valve Package | Proposal-stage engineering estimate"), "DOCX footer: clean static footer missing");

  for (const title of [
    "PFD-style Hydrogen Service System Topology",
    "P&ID-lite Control Loop",
    "Hydrogen Valve Package Schematic",
    "Material Traceability / MDR Workflow",
    "Inspection and Dossier Workflow",
  ]) {
    assert(xmlText.includes(title), `DOCX: missing visual title ${title}`);
  }
  for (const routeCheck of [
    "new ImageRun",
    "buildDrawingPackageSvg",
    "fetchSectionDiagramImage",
    "shouldRenderProposalDiagram",
    "Proposal-stage engineering estimate",
  ]) {
    assert(routeSource.includes(routeCheck), `DOCX route: missing ${routeCheck}`);
  }
  assert(!routeSource.includes("PageNumber.CURRENT"), "DOCX route: should not use broken PAGE field");
  assert(!routeSource.includes("PageNumber.TOTAL_PAGES"), "DOCX route: should not use broken NUMPAGES field");

  console.log(JSON.stringify({
    status: "passed",
    checks: {
      mediaFiles: mediaFiles.length,
      drawingObjects: (documentXml.match(/<w:drawing/g) ?? []).length,
      footer: "clean static footer",
      drawingTitles: [
        "PFD-style Hydrogen Service System Topology",
        "P&ID-lite Control Loop",
        "Hydrogen Valve Package Schematic",
        "Material Traceability / MDR Workflow",
        "Inspection and Dossier Workflow",
      ],
    },
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
