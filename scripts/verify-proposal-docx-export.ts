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
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { buildDrawingPackages, drawingTypeLabel, type DrawingPackage } from "../lib/drawing-intelligence";
import { ensureSevereServiceSections, HYDROGEN_EXECUTIVE_ROI_TEXT, HYDROGEN_TBE_LINE_ITEMS, HYDROGEN_TBE_TAGS, inferRfpIntelligence } from "../lib/severe-service-intelligence";
import { getBestVisualizationType, getFallbackVisualization, getMermaidImageUrl } from "../lib/visualization-service";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
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

function drawingPackageToMermaidFallback(drawing: DrawingPackage) {
  const nodes = drawing.symbols.slice(0, 8);
  if (nodes.length === 0) return `graph LR\n  A["${drawing.title}"] --> B["Engineering Review Required"]`;
  const lines = ["graph LR"];
  nodes.forEach((symbol, index) => {
    lines.push(`  N${index}["${String(symbol.tag || symbol.label).replace(/"/g, "'")}"]`);
  });
  for (let index = 0; index < nodes.length - 1; index++) lines.push(`  N${index} --> N${index + 1}`);
  return lines.join("\n");
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
  const generatedSections = ensureSevereServiceSections([], inferRfpIntelligence(extractedData), extractedData);
  const sections = [
    ["Executive Summary", "Customer requirement, technical compliance, delivery confidence, risk reduction, commercial value, and win theme."],
    ["Project Background / Opportunity Context", "Hydrogen hub project, process criticality, severe service valve requirement, compliance standards, OEM/EPC evaluation, and bid opportunity."],
    ["Process Conditions", "Hydrogen feed, isolation, filtration, control valve package, export header, pressure monitoring, and process safety review."],
    ["Engineering Basis", "RFP process inputs, proposal-stage assumptions, ISA IEC sizing review, ASME and materials review, risk flags, and qualified engineer validation."],
    ["Commercial Summary", "Scope, cost drivers, delivery schedule, risk allowance, price justification, and margin protection."],
  ];
  const children: Array<Paragraph | Table> = [
    new Paragraph({ children: [new TextRun({ text: "Hydrogen Process Control Valve Package", bold: true, size: 30, color: brandColor })], spacing: { after: 240 } }),
    ...generatedSections.map((section) => new Paragraph({
      children: [new TextRun({ text: `${section.title}\n${section.content}`, size: 20 })],
      spacing: { after: 100 },
    })),
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
    const image = await fetchPng(getMermaidImageUrl(drawingPackageToMermaidFallback(drawing), "png"));
    children.push(new Paragraph({ children: [new TextRun({ text: drawing.title, bold: true, size: 22, color: brandColor })], heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 80 }, keepNext: true }));
    children.push(new Paragraph({ children: [new TextRun({ text: `${drawingTypeLabel(drawing.drawingType)} | ${drawing.reviewStatus.join(" - ")}`, bold: true, size: 18, color: "4b5563" })], spacing: { after: 60 }, keepNext: true }));
    children.push(new Paragraph({ children: [new TextRun({ text: drawing.disclaimer, italics: true, size: 18, color: "92400e" })], spacing: { after: 80 }, keepNext: true }));
    children.push(new Paragraph({
      children: [new ImageRun({
        type: "png",
        data: image.buffer,
        transformation: fit(image.width, image.height, 620, 330),
        altText: { title: drawing.title, description: drawing.subtitle, name: drawing.title },
      })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 180 },
    }));
    children.push(new Paragraph({ children: [new TextRun({ text: `Tags used: ${drawing.tagsUsed.join(", ") || "TBD"}`, bold: true, size: 18 })], spacing: { after: 80 } }));
    children.push(new Paragraph({ children: [new TextRun({ text: `Engineering notes: ${drawing.engineeringReviewNotes.join(" ")}`, size: 18 })], spacing: { after: 120 } }));
  }
  children.push(new Paragraph({ children: [new TextRun({ text: "Appendix A: Detailed Technical Bid Evaluation (TBE)", bold: true, size: 24, color: brandColor })], heading: HeadingLevel.HEADING_1, spacing: { before: 260, after: 100 }, keepNext: true }));
  children.push(new Paragraph({ children: [new TextRun({ text: `${HYDROGEN_TBE_LINE_ITEMS.length} line items × ${HYDROGEN_TBE_TAGS.length} evaluation tags`, size: 18, color: "4b5563" })], spacing: { after: 120 } }));
  for (const lineItem of HYDROGEN_TBE_LINE_ITEMS) {
    children.push(new Paragraph({ children: [new TextRun({ text: lineItem, bold: true, size: 20, color: brandColor })], spacing: { before: 120, after: 60 }, keepNext: true }));
    children.push(new Table({
      width: { size: 9600, type: WidthType.DXA },
      rows: [
        new TableRow({
          children: ["Evaluation Tag", "Response"].map((header) => new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: header, bold: true, color: "FFFFFF", size: 16 })] })],
            shading: { type: ShadingType.SOLID, color: brandColor },
          })),
        }),
        ...HYDROGEN_TBE_TAGS.map((tag) => new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: tag, bold: true, color: brandColor, size: 15 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${tag} response mapped for proposal-stage TBE review.`, size: 15 })] })] }),
          ],
        })),
      ],
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
      headers: {
        default: new (await import("docx")).Header({
          children: [new Paragraph({
            children: [new TextRun({ text: "WinsProposal Demo Engine | Confidential Demo Proposal", size: 16, color: "999999", italics: true })],
            alignment: AlignmentType.RIGHT,
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
  const mediaSizes = await Promise.all(mediaFiles.map(async (name) => ({
    name,
    size: (await zip.file(name)?.async("uint8array"))?.byteLength ?? 0,
  })));
  const nonTrivialMediaFiles = mediaSizes.filter((item) => item.size > 5000);
  const documentXml = await zip.file("word/document.xml")?.async("string");
  const headerXml = (await Promise.all(fileNames.filter((name) => /^word\/header\d+\.xml$/.test(name)).map(async (name) => zip.file(name)?.async("string") ?? ""))).join("\n");
  const footerXml = (await Promise.all(fileNames.filter((name) => /^word\/footer\d+\.xml$/.test(name)).map(async (name) => zip.file(name)?.async("string") ?? ""))).join("\n");
  if (!documentXml) throw new Error("DOCX: missing word/document.xml");
  const xmlText = stripXml(`${documentXml ?? ""}\n${headerXml}\n${footerXml}`);
  const routeSource = await fs.readFile("app/api/proposals/[id]/export-docx/route.ts", "utf8");

  assert(mediaFiles.length > 0, "DOCX: expected embedded files under word/media/");
  assert(mediaFiles.length >= 8, `DOCX: expected at least 8 embedded media files, found ${mediaFiles.length}`);
  assert(nonTrivialMediaFiles.length >= 8, `DOCX: expected at least 8 non-trivial embedded images over 5KB, found ${nonTrivialMediaFiles.length}`);
  assert((documentXml.match(/<w:drawing/g) ?? []).length >= 8, "DOCX: expected at least 8 w:drawing objects");
  assert(!/Page\s+of/i.test(xmlText), "DOCX footer: broken 'Page  of' text should not be present");
  assert(xmlText.includes("Hydrogen Process Control Valve Package | Proposal-stage engineering estimate"), "DOCX footer: clean static footer missing");
  assert(xmlText.includes("WinsProposal Demo Engine | Confidential Demo Proposal"), "DOCX header: neutral demo branding missing");

  for (const title of [
    "Executive Summary",
    "Project Background / Opportunity Context",
    "Process Conditions",
    "Engineering Basis",
    "Commercial Summary",
    "PFD-style Hydrogen Service System Topology",
    "P&ID-lite Control Loop",
    "Hydrogen Valve Package Schematic",
    "Material Traceability / MDR Workflow",
    "Inspection and Dossier Workflow",
    "Appendix A: Detailed Technical Bid Evaluation (TBE)",
  ]) {
    assert(xmlText.includes(title), `DOCX: missing visual title ${title}`);
  }
  assert(xmlText.includes(HYDROGEN_EXECUTIVE_ROI_TEXT), "DOCX: missing exact Hydrogen executive ROI narrative");
  for (const forbidden of ["30% proposal cycle reduction", "20% resource allocation saving", "25% productivity increase", "20% cycle time reduction", "15% engineering hours saved", "25% compliance review reduction", "INR 2.1 Cr", "INR 1.5 Cr", "INR 0.8 Cr", "INR 2 Cr", "INR 4 Cr", "Bid Score 88%", "final bid score 88%", "CCI Severe Service Solutions"]) {
    assert(!xmlText.includes(forbidden), `DOCX: forbidden text present: ${forbidden}`);
  }
  for (const required of [
    "INR 34-42 lakh",
    "Bid Readiness Score 78%",
    "Proposal validity: 60 days",
    "Drawing submission",
    "Manufacturing lead time",
    "Inspection and testing",
    "Shipping readiness",
  ]) {
    assert(xmlText.includes(required), `DOCX: missing required text: ${required}`);
  }
  assert(xmlText.includes(`${HYDROGEN_TBE_LINE_ITEMS.length} line items × ${HYDROGEN_TBE_TAGS.length} evaluation tags`), "DOCX: missing TBE dimensions");
  for (const lineItem of HYDROGEN_TBE_LINE_ITEMS) assert(xmlText.includes(lineItem), `DOCX: missing TBE line item ${lineItem}`);
  for (const tag of HYDROGEN_TBE_TAGS) assert(xmlText.includes(tag), `DOCX: missing TBE tag ${tag}`);
  for (const routeCheck of [
    "new ImageRun",
    "type: \"png\"",
    "fetchDrawingFallbackPng",
    "fetchSectionDiagramImage",
    "shouldRenderProposalDiagram",
    "Proposal-stage engineering estimate",
    "WinsProposal Demo Engine | Confidential Demo Proposal",
    "Appendix A. Detailed Technical Bid Evaluation (TBE)",
    "normalizeHydrogenTbeData",
  ]) {
    assert(routeSource.includes(routeCheck), `DOCX route: missing ${routeCheck}`);
  }
  assert(!routeSource.includes("PageNumber.CURRENT"), "DOCX route: should not use broken PAGE field");
  assert(!routeSource.includes("PageNumber.TOTAL_PAGES"), "DOCX route: should not use broken NUMPAGES field");
  assert(!routeSource.includes("type: \"svg\""), "DOCX route: should not embed SVG-only visuals");

  console.log(JSON.stringify({
    status: "passed",
    checks: {
      mediaFiles: mediaFiles.length,
      nonTrivialMediaFiles: nonTrivialMediaFiles.length,
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
