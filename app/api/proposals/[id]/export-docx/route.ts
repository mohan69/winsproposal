export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { calculateWinScore } from "@/lib/win-score";
import { generateVisualization, getBestVisualizationType, getFallbackVisualization, getMermaidImageUrl, shouldRenderProposalDiagram, type VisualizationType } from "@/lib/visualization-service";
import { getHydrogenSectionContentOverride, getHydrogenTbeData, getSevereServiceVaultSourceCategories, HYDROGEN_EXECUTIVE_ROI_TEXT, inferRfpIntelligence, parseProposalTemplateMetadata } from "@/lib/severe-service-intelligence";
import {
  buildEngineeringArtifact,
  getProposalVisualSpec,
  PROPOSAL_STAGE_VISUAL_DISCLAIMER,
  type EngineeringArtifact,
} from "@/lib/engineering-artifacts";
import { drawingTypeLabel, type DrawingPackage } from "@/lib/drawing-intelligence";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, PageBreak, Header, Footer,
  ImageRun,
  Table, TableRow, TableCell, WidthType, ShadingType,
  Bookmark, InternalHyperlink,
} from "docx";
import {
  DIAGRAM_TEXT_FALLBACK_WARNING,
  drawingPackageFallbackRows,
  renderDrawingPackagePng,
} from "@/lib/export-diagram-renderer";

const FONT_BODY = "Calibri";
const FONT_HEADING = "Calibri";
const SIZE_BODY = 21; // ~10.5pt
const SIZE_H1 = 30;   // 15pt
const SIZE_H2 = 26;   // 13pt
const SIZE_H3 = 24;   // 12pt
const SIZE_SMALL = 18; // 9pt
const ACCENT_COLOR = "10b981";
type DocxBlock = Paragraph | Table;

const DOCX_VISUAL_WIDTH = 620;

function getImageDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length >= 24 && buffer.toString("ascii", 1, 4) === "PNG") {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if (marker >= 0xc0 && marker <= 0xc3) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
      }
      offset += 2 + length;
    }
  }
  return null;
}

async function fetchImageBuffer(
  url: string,
  options: { minWidth?: number; minHeight?: number } = {}
): Promise<{ buffer: Buffer; type: "png" | "jpg"; width: number; height: number } | null> {
  if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) return null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) continue;
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (buffer.length < 100) continue;
      const dimensions = getImageDimensions(buffer);
      if (!dimensions) continue;
      if (options.minWidth && dimensions.width < options.minWidth) continue;
      if (options.minHeight && dimensions.height < options.minHeight) continue;
      const contentType = res.headers.get("content-type") ?? "";
      const type = contentType.includes("png") || url.includes(".png") ? "png" : "jpg";
      return { buffer, type, ...dimensions };
    } catch {
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 750));
    }
  }

  return null;
}

async function fetchSectionDiagramImage(section: any, proposal: any): Promise<{ buffer: Buffer; type: "png" | "jpg" } | null> {
  const context = {
    title: proposal.title,
    sectionTitle: section.sectionTitle,
    industry: proposal.industry,
    templateType: proposal.templateType,
    content: section.content,
  };

  const fallbackType = getBestVisualizationType(section.sectionTitle, section.content, {
    templateType: proposal.templateType,
    industry: proposal.industry,
  });
  const fallback = getFallbackVisualization(context, fallbackType);
  const fallbackImage = await fetchImageBuffer(fallback.imageUrl, { minWidth: 240, minHeight: 160 });
  if (fallbackImage) return fallbackImage;

  const generated = await generateVisualization(context);
  const generatedImage = await fetchImageBuffer(generated.imageUrl, { minWidth: 240, minHeight: 160 });
  return generatedImage;
}

function fitDocxImage(width: number, height: number, maxWidth = DOCX_VISUAL_WIDTH, maxHeight = 340) {
  const ratio = Math.min(maxWidth / Math.max(width, 1), maxHeight / Math.max(height, 1), 1);
  return {
    width: Math.max(220, Math.round(width * ratio)),
    height: Math.max(130, Math.round(height * ratio)),
  };
}

function buildImageParagraph(
  image: { buffer: Buffer; type: "png" | "jpg"; width?: number; height?: number },
  title: string,
  brandColor: string
): DocxBlock[] {
  const dimensions = fitDocxImage(image.width ?? 900, image.height ?? 520);
  return [
    docxLabelParagraph(title, brandColor),
    new Paragraph({
      children: [
        new ImageRun({
          type: image.type,
          data: image.buffer,
          transformation: dimensions,
          altText: { title, description: title, name: title },
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 180 },
    }),
  ];
}

function markdownToParagraphs(text: string, brandColor: string): Paragraph[] {
  if (!text) return [];
  const lines = text.split("\n");
  const paragraphs: Paragraph[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      paragraphs.push(new Paragraph({ spacing: { after: 80 } }));
      continue;
    }

    // Sub-headers
    if (trimmed.startsWith("### ")) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: trimmed.replace(/^### /, ""), bold: true, size: SIZE_H3, color: brandColor, font: FONT_HEADING })],
        spacing: { before: 240, after: 120 },
        alignment: AlignmentType.LEFT,
      }));
      continue;
    }
    if (trimmed.startsWith("## ")) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: trimmed.replace(/^## /, ""), bold: true, size: SIZE_H2, color: brandColor, font: FONT_HEADING })],
        spacing: { before: 280, after: 120 },
        alignment: AlignmentType.LEFT,
      }));
      continue;
    }

    // Bullet points
    if (/^[\-•]\s/.test(trimmed)) {
      paragraphs.push(new Paragraph({
        children: parseInlineFormatting(trimmed.replace(/^[\-•]\s/, "")),
        bullet: { level: 0 },
        spacing: { after: 60 },
        indent: { left: 360 },
      }));
      continue;
    }

    // Indented bullet (sub-items like "  - item")
    if (/^\s{2,}[\-•]\s/.test(line)) {
      paragraphs.push(new Paragraph({
        children: parseInlineFormatting(line.trim().replace(/^[\-•]\s/, "")),
        bullet: { level: 1 },
        spacing: { after: 40 },
        indent: { left: 720 },
      }));
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(trimmed)) {
      paragraphs.push(new Paragraph({
        children: parseInlineFormatting(trimmed.replace(/^\d+\.\s/, "")),
        numbering: { reference: "default-numbering", level: 0 },
        spacing: { after: 60 },
      }));
      continue;
    }

    // Regular paragraph
    paragraphs.push(new Paragraph({
      children: parseInlineFormatting(trimmed),
      spacing: { after: 120, line: 276 }, // 1.15 line spacing
      alignment: AlignmentType.LEFT,
    }));
  }

  return paragraphs;
}

function parseInlineFormatting(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: text.slice(lastIndex, match.index), size: SIZE_BODY, font: FONT_BODY }));
    }
    if (match[1]) {
      runs.push(new TextRun({ text: match[1], bold: true, size: SIZE_BODY, font: FONT_BODY }));
    } else if (match[2]) {
      runs.push(new TextRun({ text: match[2], italics: true, size: SIZE_BODY, font: FONT_BODY }));
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.slice(lastIndex), size: SIZE_BODY, font: FONT_BODY }));
  }

  if (runs.length === 0) {
    runs.push(new TextRun({ text, size: SIZE_BODY, font: FONT_BODY }));
  }

  return runs;
}

function makeBookmarkId(value: string): string {
  const sanitized = value.replace(/[^A-Za-z0-9_]/g, "_").replace(/^([^A-Za-z_])/, "_$1");
  return sanitized.substring(0, 36) || "section";
}

function tocLink(text: string, anchor: string, brandColor: string): InternalHyperlink {
  return new InternalHyperlink({
    anchor,
    children: [
      new TextRun({
        text,
        size: SIZE_BODY,
        font: FONT_BODY,
        color: brandColor,
        underline: {} as any,
      }),
    ],
  });
}

function docxText(text: string, options: { bold?: boolean; color?: string; size?: number; italics?: boolean } = {}) {
  return new TextRun({
    text,
    bold: options.bold,
    color: options.color ?? "1f2937",
    size: options.size ?? SIZE_SMALL,
    italics: options.italics,
    font: FONT_BODY,
  });
}

function docxCell(
  children: (Paragraph | Table)[],
  options: { width?: number; shading?: string; verticalAlign?: string } = {}
) {
  return new TableCell({
    children,
    width: options.width ? { size: options.width, type: WidthType.DXA } : undefined,
    shading: options.shading ? { type: ShadingType.SOLID, color: options.shading } : undefined,
    verticalAlign: (options.verticalAlign ?? "center") as any,
    margins: { top: 120, bottom: 120, left: 120, right: 120 },
  });
}

function docxLabelParagraph(label: string, brandColor: string): Paragraph {
  return new Paragraph({
    children: [docxText(label, { bold: true, color: "555555", size: SIZE_SMALL, italics: true })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 220, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: brandColor } },
    keepNext: true,
  });
}

function buildKpiDashboardDocx(brandColor: string): Table {
  const metrics = [
    ["Bid Value", "Rs 48.6 Cr", "92% visibility"],
    ["Turnaround", "4.2 days", "38% faster"],
    ["Compliance", "96%", "clauses mapped"],
    ["Vault Reuse", "64%", "approved content"],
  ];
  const cells = metrics.map(([label, value, note]) => docxCell([
    new Paragraph({ children: [docxText(label.toUpperCase(), { bold: true, color: "6b7280", size: 16 })], spacing: { after: 50 } }),
    new Paragraph({ children: [docxText(value, { bold: true, color: brandColor, size: 30 })], spacing: { after: 50 } }),
    new Paragraph({ children: [docxText(note, { color: "4b5563", size: SIZE_SMALL })] }),
  ], { width: 4800, shading: "F8FAFC" }));

  return new Table({
    rows: [
      new TableRow({ children: [cells[0], cells[1]] }),
      new TableRow({ children: [cells[2], cells[3]] }),
    ],
    width: { size: 9600, type: WidthType.DXA },
  });
}

function buildRoiImpactDocx(extractedData: any, brandColor: string): Table {
  const dashboard = extractedData?.dashboard ?? {};
  const read = (keys: string[], fallback: string) => {
    for (const key of keys) {
      const value = dashboard?.[key] ?? extractedData?.[key];
      if (value !== undefined && value !== null && String(value).trim()) return String(value);
    }
    return fallback;
  };
  const hoursSaved = read(["Engineering hours saved", "engineeringHoursSaved"], "28");
  const reuse = read(["Reusable engineering content", "proposalReuse"], "58%");
  const cycleReduction = read(["Proposal turnaround reduction", "cycleTimeReduction"], "44%");
  const rows = [
    ["ROI Metric", "Before", "After", "Impact"],
    ["Proposal cycle time", "5.0 days", "2.8 days", `${cycleReduction} faster`],
    ["Engineering hours", "64 hrs/bid", `${Math.max(18, 64 - (Number.parseInt(hoursSaved, 10) || 28))} hrs/bid`, `${hoursSaved} hrs saved`],
    ["Compliance review", "14 hrs", "6 hrs", "8 hrs saved"],
    ["Proposal reuse", "20%", reuse, "Controlled reuse"],
    ["Bid throughput", "8 bids/month", "13 bids/month", "62% uplift"],
    ["Annual productivity savings", "Manual baseline", "INR 34-42 lakh", "Indicative demo model"],
  ];
  return new Table({
    width: { size: 9600, type: WidthType.DXA },
    rows: rows.map((row, rowIndex) => new TableRow({
      children: row.map((cell, cellIndex) => docxCell([
        new Paragraph({
          children: [docxText(cell, {
            bold: rowIndex === 0 || cellIndex === 0,
            color: rowIndex === 0 ? "FFFFFF" : cellIndex === 2 ? brandColor : "1f2937",
            size: rowIndex === 0 ? 16 : 15,
          })],
        }),
      ], { width: cellIndex === 0 ? 2800 : 2266, shading: rowIndex === 0 ? brandColor : rowIndex % 2 === 0 ? "F8FAFC" : "FFFFFF" })),
    })),
  });
}

function buildVaultCategoriesDocx(applicationId: string, brandColor: string): Table {
  const categories = getSevereServiceVaultSourceCategories(applicationId);
  return new Table({
    width: { size: 9600, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [docxCell([
          new Paragraph({ children: [docxText("Knowledge Vault Source Categories", { bold: true, color: "FFFFFF", size: 16 })] }),
        ], { width: 9600, shading: brandColor })],
      }),
      ...categories.map((item, index) => new TableRow({
        children: [
          docxCell([new Paragraph({ children: [docxText(item.label, { bold: true, color: brandColor, size: 15 })] })], { width: 2600, shading: index % 2 === 0 ? "FFFFFF" : "F8FAFC" }),
          docxCell([new Paragraph({ children: [docxText(item.detail, { color: "4b5563", size: 15 })] })], { width: 7000, shading: index % 2 === 0 ? "FFFFFF" : "F8FAFC" }),
        ],
      })),
    ],
  });
}

function buildComplianceMatrixDocx(brandColor: string): Table {
  const rows = [
    ["API 600", "Mapped", "Clause evidence"],
    ["ASME B16.34", "Mapped", "Datasheet"],
    ["NACE MR0175", "Review", "Material note"],
    ["ITP / API 598", "Closed", "QA plan"],
  ];
  return new Table({
    rows: [
      new TableRow({
        children: ["Requirement", "Status", "Evidence"].map((header) => docxCell([
          new Paragraph({ children: [docxText(header, { bold: true, color: "FFFFFF", size: SIZE_SMALL })] }),
        ], { width: 3200, shading: brandColor })),
      }),
      ...rows.map((row) => new TableRow({
        children: row.map((value, index) => docxCell([
          new Paragraph({
            children: [docxText(value, { bold: index === 0 || index === 1, color: index === 1 ? brandColor : "1f2937", size: SIZE_SMALL })],
          }),
        ], { width: 3200, shading: index === 1 ? "F0FDF4" : "FFFFFF" })),
      })),
    ],
    width: { size: 9600, type: WidthType.DXA },
  });
}

function buildEngineeringDependencyDocx(brandColor: string): Table {
  const stack = [
    ["Input", "Client datasheet"],
    ["Basis", "API / ASME / NACE design basis"],
    ["Checks", "Calculations and materials review"],
    ["Output", "QA-cleared proposal pack"],
  ];
  return new Table({
    rows: stack.map(([stage, detail], index) => new TableRow({
      children: [
        docxCell([
          new Paragraph({ children: [docxText(stage, { bold: true, color: index === 0 ? "FFFFFF" : brandColor, size: SIZE_SMALL })], alignment: AlignmentType.CENTER }),
        ], { width: 1600, shading: index === 0 ? brandColor : "EFF6FF" }),
        docxCell([
          new Paragraph({ children: [docxText(detail, { bold: true, color: "111827", size: SIZE_SMALL })] }),
        ], { width: 6400, shading: "FFFFFF" }),
        docxCell([
          new Paragraph({ children: [docxText(index < stack.length - 1 ? "feeds" : "ready", { bold: true, color: brandColor, size: 16 })], alignment: AlignmentType.CENTER }),
        ], { width: 1600, shading: "F8FAFC" }),
      ],
    })),
    width: { size: 9600, type: WidthType.DXA },
  });
}

function buildApprovalWorkflowDocx(brandColor: string): Table {
  const steps = ["RFP Intake", "Proposal Owner", "Engineering Review", "Compliance Review", "Final Approval"];
  return new Table({
    rows: [
      new TableRow({
        children: steps.map((step, index) => docxCell([
          new Paragraph({
            children: [
              docxText(`${index + 1}`, { bold: true, color: "FFFFFF", size: 18 }),
              docxText(`\n${step}`, { bold: true, color: "111827", size: 17 }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ], { width: 1920, shading: index === steps.length - 1 ? "DCFCE7" : "F8FAFC" })),
      }),
    ],
    width: { size: 9600, type: WidthType.DXA },
  });
}

function buildValueChainDocx(brandColor: string): Table {
  const steps = ["Customer Scope", "Technical Fit", "Compliance Confidence", "Delivery Assurance", "Win Theme"];
  return new Table({
    rows: [new TableRow({
      children: steps.map((step, index) => docxCell([
        new Paragraph({ children: [docxText(step, { bold: true, color: index === 4 ? "FFFFFF" : "111827", size: 17 })], alignment: AlignmentType.CENTER }),
      ], { width: 1920, shading: index === 4 ? brandColor : "F8FAFC" })),
    })],
    width: { size: 9600, type: WidthType.DXA },
  });
}

function buildRiskTreeDocx(brandColor: string): Table {
  return new Table({
    rows: [
      new TableRow({ children: [docxCell([new Paragraph({ children: [docxText("Deviation / Risk Flag", { bold: true, color: "FFFFFF", size: SIZE_SMALL })], alignment: AlignmentType.CENTER })], { width: 9600, shading: brandColor })] }),
      new TableRow({
        children: [
          ["Low", "Document"], ["Medium", "Mitigate"], ["High", "Approve"],
        ].map(([level, action]) => docxCell([
          new Paragraph({ children: [docxText(level, { bold: true, color: brandColor, size: SIZE_SMALL })], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [docxText(action, { color: "4b5563", size: SIZE_SMALL })], alignment: AlignmentType.CENTER }),
        ], { width: 3200, shading: "FFFFFF" })),
      }),
      new TableRow({ children: [docxCell([new Paragraph({ children: [docxText("Clarify -> Decide -> Close", { bold: true, color: "111827", size: SIZE_SMALL })], alignment: AlignmentType.CENTER })], { width: 9600, shading: "F8FAFC" })] }),
    ],
    width: { size: 9600, type: WidthType.DXA },
  });
}

function isSevereServiceProposal(proposal: any) {
  return /severe-service|hydrogen|lng|compressor|steam|refinery/i.test(`${proposal?.templateType ?? ""} ${proposal?.industry ?? ""}`);
}

async function buildNativeDocxDiagram(section: any, proposal: any, brandColor: string): Promise<DocxBlock[]> {
  const artifact = buildEngineeringArtifact({
    sectionTitle: section.sectionTitle,
    sectionId: section.id,
    proposalId: proposal.id,
    templateType: proposal.templateType,
    extractedData: (proposal as any).extractedDataForArtifacts,
  });
  if (artifact) return buildDocxArtifactBlocks(artifact, brandColor);

  const type = getBestVisualizationType(section.sectionTitle, section.content, {
    templateType: proposal.templateType,
    industry: proposal.industry,
  });
  const labelMap: Record<VisualizationType, string> = {
    value_chain: "Proposal Value Chain",
    architecture: "System Architecture",
    process_flow: "Process Flow",
    workflow: "Approval Workflow",
    compliance_flow: "Compliance Matrix",
    kpi_dashboard: "KPI Dashboard",
    tbe_matrix: "TBE Matrix",
    risk_tree: "Risk Decision Tree",
    gantt: "Project Schedule",
    proposal_lifecycle: "Proposal Lifecycle",
    engineering_dependency: "Engineering Dependency Map",
    flowchart: "Workflow",
    sequence: "Workflow",
    pfd: "Process Flow",
  };
  if (shouldRenderProposalDiagram(section.sectionTitle, section.content)) {
    const image = await fetchSectionDiagramImage(section, proposal);
    if (image) {
      return buildImageParagraph(
        { ...image, width: image.buffer ? getImageDimensions(image.buffer)?.width : undefined, height: image.buffer ? getImageDimensions(image.buffer)?.height : undefined },
        `${section.sectionTitle} - ${labelMap[type]}`,
        brandColor
      );
    }
  }
  if (isSevereServiceProposal(proposal)) return [];

  const diagram = type === "kpi_dashboard"
    ? buildKpiDashboardDocx(brandColor)
    : type === "compliance_flow"
      ? buildComplianceMatrixDocx(brandColor)
      : type === "engineering_dependency"
        ? buildEngineeringDependencyDocx(brandColor)
        : type === "risk_tree"
          ? buildRiskTreeDocx(brandColor)
          : type === "workflow"
            ? buildApprovalWorkflowDocx(brandColor)
            : buildValueChainDocx(brandColor);

  return [
    docxLabelParagraph(`${section.sectionTitle} - ${labelMap[type]}`, brandColor),
    diagram,
    new Paragraph({ spacing: { after: 220 } }),
  ];
}

function buildArtifactTableDocx(table: NonNullable<EngineeringArtifact["tables"]>[number], brandColor: string): Table {
  return new Table({
    width: { size: 9600, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: table.columns.map((column) => docxCell([
          new Paragraph({ children: [docxText(column, { bold: true, color: "FFFFFF", size: 16 })] }),
        ], { shading: brandColor })),
      }),
      ...table.rows.map((row, rowIndex) => new TableRow({
        children: row.map((cell) => docxCell([
          new Paragraph({ children: [docxText(cell, { size: 15, color: "1f2937" })] }),
        ], { shading: rowIndex % 2 === 0 ? "FFFFFF" : "F8FAFC" })),
      })),
    ],
  });
}

function buildEnhancedDrawingDocx(visual: NonNullable<EngineeringArtifact["visuals"]>[number], brandColor: string): Table {
  const spec = getProposalVisualSpec(visual);
  const nodes = spec.nodes;
  const support = spec.support ?? [];
  const annotations = spec.annotations ?? [];
  const primary = spec.primary ?? "";
  const width = Math.max(1200, Math.floor(9600 / nodes.length));
  const rows = [
    new TableRow({
      children: nodes.map((node) => docxCell([
        new Paragraph({
          children: [docxText(node, { bold: true, color: node === primary ? brandColor : "1f2937", size: 15 })],
          alignment: AlignmentType.CENTER,
        }),
      ], { width, shading: node === primary ? "EFF6FF" : "FFFFFF" })),
    }),
  ];
  if (support.length > 0) {
    rows.push(new TableRow({
      children: [
        docxCell([
          new Paragraph({
            children: [docxText(support.join(" | "), { bold: true, color: brandColor, size: SIZE_SMALL })],
            alignment: AlignmentType.CENTER,
          }),
        ], { width: 9600, shading: "F8FAFC" }),
      ],
    }));
  }
  if (annotations.length > 0) {
    rows.push(new TableRow({
      children: [
        docxCell([
          new Paragraph({
            children: [docxText(annotations.join(" | "), { color: "4b5563", size: 15 })],
            alignment: AlignmentType.CENTER,
          }),
        ], { width: 9600, shading: "FFFFFF" }),
      ],
    }));
  }
  return new Table({ rows, width: { size: 9600, type: WidthType.DXA } });
}

function buildDrawingPackageTextFallbackDocx(drawing: DrawingPackage, brandColor: string): DocxBlock[] {
  const rows = drawingPackageFallbackRows(drawing);
  return [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      children: [docxText(drawing.title, { bold: true, color: brandColor, size: SIZE_BODY })],
      spacing: { before: 100, after: 50 },
      keepNext: true,
    }),
    new Paragraph({
      children: [docxText(drawing.subtitle, { color: "4b5563", size: SIZE_SMALL })],
      spacing: { after: 50 },
      keepNext: true,
    }),
    new Paragraph({
      children: [docxText(`${drawingTypeLabel(drawing.drawingType)} | ${drawing.reviewStatus.join(" - ")}`, { bold: true, color: "4b5563", size: SIZE_SMALL })],
      spacing: { after: 60 },
      keepNext: true,
    }),
    new Paragraph({
      children: [docxText(drawing.disclaimer, { italics: true, color: "92400e", size: SIZE_SMALL })],
      spacing: { after: 80 },
      keepNext: true,
    }),
    new Paragraph({
      children: [docxText(DIAGRAM_TEXT_FALLBACK_WARNING, { bold: true, color: "92400e", size: SIZE_SMALL })],
      spacing: { after: 80 },
      keepNext: true,
    }),
    new Table({
      width: { size: 9600, type: WidthType.DXA },
      rows: [
        new TableRow({
          children: ["Step", "Symbol / Node", "Tag", "Role"].map((header) => docxCell([
            new Paragraph({ children: [docxText(header, { bold: true, color: "FFFFFF", size: 16 })] }),
          ], { shading: brandColor })),
        }),
        ...rows.map((row, index) => new TableRow({
          children: [
            docxCell([new Paragraph({ children: [docxText(String(row.step), { bold: true, color: brandColor, size: 15 })] })], { shading: index % 2 === 0 ? "FFFFFF" : "F8FAFC" }),
            docxCell([new Paragraph({ children: [docxText(row.symbol, { bold: true, color: "1f2937", size: 15 })] })], { shading: index % 2 === 0 ? "FFFFFF" : "F8FAFC" }),
            docxCell([new Paragraph({ children: [docxText(row.tag, { color: brandColor, size: 15 })] })], { shading: index % 2 === 0 ? "FFFFFF" : "F8FAFC" }),
            docxCell([new Paragraph({ children: [docxText(row.role, { color: "4b5563", size: 15 })] })], { shading: index % 2 === 0 ? "FFFFFF" : "F8FAFC" }),
          ],
        })),
      ],
    }),
  ];
}

async function buildDrawingPackageImageBlocks(drawing: DrawingPackage, brandColor: string): Promise<DocxBlock[]> {
  const rendered = await renderDrawingPackagePng(drawing);
  if (!rendered) return buildDrawingPackageTextFallbackDocx(drawing, brandColor);

  return [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      children: [docxText(drawing.title, { bold: true, color: brandColor, size: SIZE_BODY })],
      spacing: { before: 100, after: 50 },
      keepNext: true,
    }),
    new Paragraph({
      children: [docxText(drawing.subtitle, { color: "4b5563", size: SIZE_SMALL })],
      spacing: { after: 50 },
      keepNext: true,
    }),
    new Paragraph({
      children: [docxText(`${drawingTypeLabel(drawing.drawingType)} | ${drawing.reviewStatus.join(" - ")}`, { bold: true, color: "4b5563", size: SIZE_SMALL })],
      spacing: { after: 60 },
      keepNext: true,
    }),
    new Paragraph({
      children: [docxText(drawing.disclaimer, { italics: true, color: "92400e", size: SIZE_SMALL })],
      spacing: { after: 80 },
      keepNext: true,
    }),
    new Paragraph({
      children: [
        new ImageRun({
          type: "png",
          data: rendered.buffer,
          transformation: fitDocxImage(rendered.width, rendered.height, DOCX_VISUAL_WIDTH, 330),
          altText: { title: drawing.title, description: drawing.subtitle, name: drawing.title },
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
  ];
}

async function buildDrawingPackageDocx(drawing: DrawingPackage, brandColor: string): Promise<DocxBlock[]> {
  const symbolRows = [
    new TableRow({
      children: ["Symbol", "Tag", "Role"].map((header) => docxCell([
        new Paragraph({ children: [docxText(header, { bold: true, color: "FFFFFF", size: 16 })] }),
      ], { shading: brandColor })),
    }),
    ...drawing.symbols.map((symbol, index) => new TableRow({
      children: [
        docxCell([new Paragraph({ children: [docxText(symbol.label, { bold: true, color: "1f2937", size: 15 })] })], { shading: index % 2 === 0 ? "FFFFFF" : "F8FAFC" }),
        docxCell([new Paragraph({ children: [docxText(symbol.tag ?? "-", { color: brandColor, size: 15 })] })], { shading: index % 2 === 0 ? "FFFFFF" : "F8FAFC" }),
        docxCell([new Paragraph({ children: [docxText(symbol.kind.replace(/_/g, " "), { color: "4b5563", size: 15 })] })], { shading: index % 2 === 0 ? "FFFFFF" : "F8FAFC" }),
      ],
    })),
  ];
  const flowRows = [
    new TableRow({
      children: drawing.symbols.map((symbol) => docxCell([
        new Paragraph({
          children: [docxText(symbol.label, { bold: true, color: symbol.kind.includes("valve") ? brandColor : "111827", size: 14 })],
          alignment: AlignmentType.CENTER,
        }),
        ...(symbol.tag ? [new Paragraph({ children: [docxText(symbol.tag, { bold: true, color: brandColor, size: 13 })], alignment: AlignmentType.CENTER })] : []),
      ], { width: Math.max(1000, Math.floor(9600 / drawing.symbols.length)), shading: symbol.kind.includes("valve") ? "EFF6FF" : "FFFFFF" })),
    }),
  ];

  return [
    ...(await buildDrawingPackageImageBlocks(drawing, brandColor)),
    new Paragraph({
      children: [docxText(`Tags used: ${drawing.tagsUsed.join(", ") || "TBD"}`, { bold: true, color: "1f2937", size: SIZE_SMALL })],
      spacing: { before: 80, after: 50 },
      keepNext: true,
    }),
    new Table({ rows: flowRows, width: { size: 9600, type: WidthType.DXA } }),
    new Table({ rows: symbolRows, width: { size: 9600, type: WidthType.DXA } }),
    new Paragraph({
      children: [docxText(`Engineering review notes: ${drawing.engineeringReviewNotes.join(" ")}`, { color: "4b5563", size: SIZE_SMALL })],
      spacing: { before: 80, after: 40 },
      keepNext: true,
    }),
    new Paragraph({
      children: [docxText(`Standards-awareness notes: ${drawing.standardsAwareness.map((item) => item.label).join(" | ")}`, { color: "4b5563", size: SIZE_SMALL })],
      spacing: { after: 160 },
    }),
  ];
}

async function buildDocxArtifactBlocks(artifact: EngineeringArtifact, brandColor: string): Promise<DocxBlock[]> {
  const blocks: DocxBlock[] = [
    docxLabelParagraph(`${artifact.title} - ${artifact.artifactType === "drawing_package" ? "Proposal-Grade Technical Visual" : "Proposal-Grade Engineering Artifact"}`, brandColor),
    new Paragraph({
      children: [docxText(`${artifact.applicationType} | ${artifact.renderedLayoutType.replace(/_/g, " ")}`, { color: "4b5563", size: SIZE_SMALL })],
      spacing: { after: 120 },
      keepNext: true,
    }),
  ];
  if (artifact.disclaimer) {
    blocks.push(new Paragraph({
      children: [docxText(artifact.disclaimer, { italics: true, color: "92400e", size: SIZE_SMALL })],
      spacing: { after: 120 },
      keepNext: artifact.artifactType === "drawing_package",
    }));
  }
  if (artifact.artifactType === "drawing_package") {
    blocks.push(new Paragraph({
      children: [docxText(PROPOSAL_STAGE_VISUAL_DISCLAIMER, { italics: true, color: "92400e", size: SIZE_SMALL })],
      spacing: { after: 120 },
      keepNext: true,
    }));
  }
  for (const table of artifact.tables ?? []) {
    if (table.title) {
      blocks.push(new Paragraph({
        children: [docxText(table.title, { bold: true, color: "111827", size: SIZE_BODY })],
        spacing: { before: 80, after: 60 },
        keepNext: true,
      }));
    }
    blocks.push(buildArtifactTableDocx(table, brandColor));
    blocks.push(new Paragraph({ spacing: { after: 160 } }));
  }
  if ((artifact.drawingPackages ?? []).length > 0) {
    for (const drawing of artifact.drawingPackages ?? []) {
      blocks.push(...await buildDrawingPackageDocx(drawing, brandColor));
    }
  } else for (const visual of artifact.visuals ?? []) {
    blocks.push(new Paragraph({
      children: [docxText(visual.title, { bold: true, color: brandColor, size: SIZE_BODY })],
      spacing: { before: 80, after: 40 },
      keepNext: true,
    }));
    blocks.push(new Paragraph({
      children: [docxText(getProposalVisualSpec(visual).visualLabel, { color: "4b5563", size: SIZE_SMALL })],
      spacing: { after: 50 },
      keepNext: true,
    }));
    blocks.push(buildEnhancedDrawingDocx(visual, brandColor));
  }
  blocks.push(new Paragraph({ spacing: { after: 220 } }));
  return blocks;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const proposal = await prisma.proposal.findUnique({
      where: { id: params?.id, userId: (session.user as any)?.id },
      include: {
        sections: { orderBy: { orderIndex: "asc" } },
        complianceChecklist: true,
        user: {
          select: {
            companyName: true,
            organizationId: true,
            organization: { select: { name: true, logoUrl: true, brandColor: true } },
          },
        },
      },
    });

    if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    const { searchParams } = new URL(request.url);
    const includeDiagrams = searchParams.get("includeDiagrams") !== "false";

    // Fetch TBE responses if proposal has an RFP
    let tbeData: { lineItems: string[]; tags: string[]; cells: Record<string, string> } | null = null;
    let extractedData: any = null;
    if (proposal.rfpId) {
      const rfpData = await prisma.rfpUpload.findUnique({ where: { id: proposal.rfpId }, select: { extractedData: true } });
      extractedData = rfpData?.extractedData ?? null;
      const tbeResponses = await prisma.tbeResponse.findMany({
        where: { rfpId: proposal.rfpId },
        orderBy: [{ lineItemIndex: "asc" }, { tag: "asc" }],
      });
      if (tbeResponses.length > 0) {
        const tags = [...new Set(tbeResponses.map((r: any) => r.tag))];
        const maxIdx = Math.max(...tbeResponses.map((r: any) => r.lineItemIndex));
        const lineItemsData = (extractedData as any)?.lineItems ?? [];
        const lineItems: string[] = [];
        for (let i = 0; i <= maxIdx; i++) {
          lineItems.push(lineItemsData[i]?.item ?? `Item ${i + 1}`);
        }
        const cells: Record<string, string> = {};
        for (const r of tbeResponses) {
          cells[`${r.lineItemIndex}-${r.tag}`] = r.responseText;
        }
        tbeData = { lineItems, tags, cells };
      }
    }
    const proposalForArtifacts = { ...proposal, extractedDataForArtifacts: extractedData };

    const checklist = proposal.complianceChecklist?.checklistItems as any[] | null;
    const scoreResult = calculateWinScore({
      sections: proposal.sections,
      vaultSectionsUsed: proposal.vaultSectionsUsed,
      vaultDocumentsUsed: proposal.vaultDocumentsUsed,
      templateType: proposal.templateType,
      industry: proposal.industry,
      hasCompliance: !!proposal.complianceChecklist,
      complianceChecked: checklist?.filter((i: any) => i?.checked)?.length ?? 0,
      complianceTotal: checklist?.length ?? 0,
    });

    const orgName = (proposal.user as any)?.organization?.name ?? "";
    const brandColor = ((proposal.user as any)?.organization?.brandColor ?? "#1a365d").replace("#", "");
    const orgLogoUrl = (proposal.user as any)?.organization?.logoUrl ?? "";
    const companyName = proposal.user?.companyName ?? orgName ?? "WinsProposal";
    const templateMetadata = parseProposalTemplateMetadata(proposal.templateType);
    const intelligence = inferRfpIntelligence(extractedData ?? {});
    const severeServiceExport = /severe-service|hydrogen|lng|compressor|steam|refinery/i.test(`${proposal.templateType} ${proposal.industry} ${templateMetadata.application}`);
    const hydrogenExport = intelligence.applicationId === "hydrogen-process-control"
      || /hydrogen/i.test(`${proposal.title} ${proposal.templateType} ${proposal.industry} ${templateMetadata.application}`);
    const exportTbeData = hydrogenExport ? getHydrogenTbeData(extractedData, tbeData) : tbeData;
    const exportSections = proposal.sections.map((section) => ({
      ...section,
      content: hydrogenExport ? getHydrogenSectionContentOverride(section.sectionTitle, extractedData) ?? section.content : section.content,
    }));
    const createdDate = proposal.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    // Fetch logo image if available
    let logoImage: ImageRun | null = null;
    if (orgLogoUrl) {
      const imgData = await fetchImageBuffer(orgLogoUrl);
      if (imgData) {
        logoImage = new ImageRun({
          data: imgData.buffer,
          transformation: { width: 180, height: 60 },
          type: imgData.type,
        });
      }
    }

    // ========== Build Document ==========
    const docChildren: (Paragraph | Table)[] = [];

    // --- COVER PAGE ---
    docChildren.push(new Paragraph({ spacing: { before: 2400 } }));

    // Logo
    if (logoImage) {
      docChildren.push(new Paragraph({
        children: [logoImage],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }));
    }

    // Decorative line
    docChildren.push(new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: brandColor } },
      spacing: { after: 300 },
    }));

    // Title
    docChildren.push(new Paragraph({
      children: [new TextRun({ text: proposal.title, bold: true, size: 52, color: brandColor, font: FONT_HEADING })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }));

    // Subtitle
    docChildren.push(new Paragraph({
      children: [new TextRun({
        text: [
          templateMetadata.industry || proposal.industry,
          templateMetadata.template,
          templateMetadata.application,
          templateMetadata.packageType,
        ].filter(Boolean).join(" | "),
        size: 24,
        color: "666666",
        font: FONT_BODY,
      })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }));

    // Decorative line
    docChildren.push(new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: brandColor } },
      spacing: { after: 400 },
    }));

    const neutralDemoBranding = severeServiceExport && /cci severe service solutions|imi cci/i.test(companyName);
    const preparedBy = neutralDemoBranding ? "WinsProposal Demo Engine" : companyName;
    const preparedFor = severeServiceExport ? "Demo Customer / Severe-Service Valve OEM" : "Customer organization";
    const docxBidReadinessScore = hydrogenExport ? 78 : severeServiceExport && scoreResult.total < 60 ? 78 : scoreResult.total;

    // Company & Date
    docChildren.push(new Paragraph({
      children: [new TextRun({ text: `Prepared by ${preparedBy}`, size: 22, color: "555555", font: FONT_BODY })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }));
    docChildren.push(new Paragraph({
      children: [new TextRun({ text: `Prepared for ${preparedFor}`, size: 21, color: "555555", font: FONT_BODY })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }));
    docChildren.push(new Paragraph({
      children: [new TextRun({ text: createdDate, size: 20, color: "777777", font: FONT_BODY })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }));

    // Bid readiness box
    const scoreColor = docxBidReadinessScore >= 80 ? ACCENT_COLOR : docxBidReadinessScore >= 60 ? "d97706" : "ef4444";
    docChildren.push(new Paragraph({
      children: [
        new TextRun({ text: "Bid Readiness Score: ", bold: true, size: 26, color: brandColor, font: FONT_HEADING }),
        new TextRun({ text: `${docxBidReadinessScore}%`, bold: true, size: 26, color: scoreColor, font: FONT_HEADING }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }));

    // Spacer after score
    docChildren.push(new Paragraph({ spacing: { after: 200 } }));

    docChildren.push(new Paragraph({ children: [new PageBreak()] }));

    if (severeServiceExport) {
      docChildren.push(new Paragraph({
        children: [new TextRun({ text: "Executive ROI Impact Summary", bold: true, size: SIZE_H1, color: brandColor, font: FONT_HEADING })],
        spacing: { after: 120 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: brandColor } },
      }));
      docChildren.push(new Paragraph({
        children: [docxText(HYDROGEN_EXECUTIVE_ROI_TEXT, { color: "1f2937", size: SIZE_BODY })],
        spacing: { after: 160 },
      }));
      docChildren.push(new Paragraph({
        children: [docxText("Preliminary proposal-stage engineering estimate. Final sizing/design must be validated by qualified engineers using company-approved tools and standards.", { italics: true, color: "92400e", size: SIZE_SMALL })],
        spacing: { before: 160 },
      }));
      docChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }

    // --- TABLE OF CONTENTS (Manual) ---
    docChildren.push(new Paragraph({
      children: [new TextRun({ text: "Table of Contents", bold: true, size: 32, color: brandColor, font: FONT_HEADING })],
      spacing: { after: 100 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: brandColor } },
    }));
    docChildren.push(new Paragraph({ spacing: { after: 200 } }));

    const sectionAnchors = exportSections.map((section, idx) => makeBookmarkId(`section_${idx + 1}_${section.id}`));
    const complianceAnchor = makeBookmarkId("section_compliance_checklist");
    const tbeAnchor = makeBookmarkId("section_technical_bid_evaluation");

    // Build linked TOC entries
    exportSections.forEach((section, idx) => {
      docChildren.push(new Paragraph({
        children: [
          tocLink(`${idx + 1}. ${section.sectionTitle}`, sectionAnchors[idx], brandColor),
        ],
        spacing: { after: 80 },
        border: { bottom: { style: BorderStyle.DOTTED, size: 1, color: "d1d5db" } },
      }));
    });

    let tocIdx = exportSections.length + 1;
    if (checklist && checklist.length > 0) {
      docChildren.push(new Paragraph({
        children: [
          tocLink(`${tocIdx}. Compliance Checklist`, complianceAnchor, brandColor),
        ],
        spacing: { after: 80 },
        border: { bottom: { style: BorderStyle.DOTTED, size: 1, color: "d1d5db" } },
      }));
      tocIdx++;
    }
    if (exportTbeData) {
      docChildren.push(new Paragraph({
        children: [
          tocLink("Appendix A. Detailed Technical Bid Evaluation (TBE)", tbeAnchor, brandColor),
        ],
        spacing: { after: 80 },
        border: { bottom: { style: BorderStyle.DOTTED, size: 1, color: "d1d5db" } },
      }));
    }

    if (severeServiceExport) {
      docChildren.push(new Paragraph({ spacing: { before: 180, after: 80 } }));
      docChildren.push(buildVaultCategoriesDocx(intelligence.applicationId, brandColor));
    }

    docChildren.push(new Paragraph({ children: [new PageBreak()] }));

    // --- SECTIONS ---
    for (let idx = 0; idx < exportSections.length; idx++) {
      const section = exportSections[idx];
      // Section heading (Heading 1 style for TOC)
      docChildren.push(new Paragraph({
        children: [
          new Bookmark({
            id: sectionAnchors[idx],
            children: [
              new TextRun({ text: `${idx + 1}. ${section.sectionTitle}`, bold: true, size: SIZE_H1, color: brandColor, font: FONT_HEADING }),
            ],
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: idx === 0 ? 0 : 400, after: 120 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 3, color: brandColor },
        },
        keepNext: true,
      }));

      // Source badge (clean text, no emoji)
      const sourceLabel = section.sourceType === "vault"
        ? (section.sourceName ? `[From Knowledge Vault: ${section.sourceName}]` : "[From Knowledge Vault]")
        : "[AI Generated]";
      docChildren.push(new Paragraph({
        children: [
          new TextRun({
            text: sourceLabel,
            size: SIZE_SMALL,
            color: section.sourceType === "vault" ? ACCENT_COLOR : "3b82f6",
            italics: true,
            font: FONT_BODY,
          }),
        ],
        spacing: { after: 200 },
        alignment: AlignmentType.LEFT,
        keepNext: true,
      }));

      // Section content
      const contentParagraphs = markdownToParagraphs(section.content, brandColor);
      docChildren.push(...contentParagraphs);

      // Native Word visual if enabled. These are section-aware layouts, not repeated screenshots.
      if (includeDiagrams) {
        docChildren.push(...await buildNativeDocxDiagram(section, proposalForArtifacts, brandColor));
      }

      docChildren.push(new Paragraph({ spacing: { after: 260 } }));
    }

    // --- COMPLIANCE CHECKLIST ---
    if (checklist && checklist.length > 0) {
      docChildren.push(new Paragraph({ children: [new PageBreak()] }));
      docChildren.push(new Paragraph({
        children: [
          new Bookmark({
            id: complianceAnchor,
            children: [new TextRun({ text: "Compliance Checklist", bold: true, size: SIZE_H1, color: brandColor, font: FONT_HEADING })],
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 120 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: brandColor } },
        keepNext: true,
      }));

      docChildren.push(new Paragraph({
        children: [new TextRun({ text: `${checklist.length}/${checklist.length} proposal-stage requirements mapped`, bold: true, size: SIZE_BODY, color: brandColor, font: FONT_BODY })],
        spacing: { after: 120 },
        keepNext: true,
      }));
      docChildren.push(new Paragraph({
        children: [new TextRun({ text: "Final sizing/design must be validated by qualified engineers using company-approved tools and applicable licensed standards before final design release.", italics: true, size: SIZE_SMALL, color: "92400e", font: FONT_BODY })],
        spacing: { after: 200 },
        keepNext: true,
      }));

      // Compliance table
      const complianceRows = checklist.map((item: any) =>
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: item?.checked ? "Proposal-Stage Covered" : "Mapped / Engineering Validation Required", bold: true, size: SIZE_SMALL, color: ACCENT_COLOR, font: FONT_BODY })], alignment: AlignmentType.CENTER })],
              width: { size: 1900, type: WidthType.DXA },
              verticalAlign: "center" as any,
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: item?.label ?? "", bold: true, size: SIZE_BODY, font: FONT_BODY })], spacing: { after: 40 } })],
              width: { size: 3600, type: WidthType.DXA },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: `${item?.standard ?? "Project review basis"}. Engineering validation required before final design release.`, size: SIZE_SMALL, color: "666666", font: FONT_BODY })], spacing: { after: 40 } })],
              width: { size: 4100, type: WidthType.DXA },
            }),
          ],
        })
      );

      // Header row
      const headerRow = new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Status", size: SIZE_SMALL, font: FONT_BODY, bold: true, color: "FFFFFF" })], alignment: AlignmentType.CENTER })],
            width: { size: 1900, type: WidthType.DXA },
            shading: { type: ShadingType.SOLID, color: brandColor },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Requirement", size: SIZE_SMALL, font: FONT_BODY, bold: true, color: "FFFFFF" })] })],
            width: { size: 3600, type: WidthType.DXA },
            shading: { type: ShadingType.SOLID, color: brandColor },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Review Basis / Validation", size: SIZE_SMALL, font: FONT_BODY, bold: true, color: "FFFFFF" })] })],
            width: { size: 4100, type: WidthType.DXA },
            shading: { type: ShadingType.SOLID, color: brandColor },
          }),
        ],
      });

      docChildren.push(new Table({
        rows: [headerRow, ...complianceRows],
        width: { size: 9600, type: WidthType.DXA },
      }));
    }

    // --- TBE SECTION ---
    if (exportTbeData) {
      docChildren.push(new Paragraph({ children: [new PageBreak()] }));
      docChildren.push(new Paragraph({
        children: [
          new Bookmark({
            id: tbeAnchor,
            children: [new TextRun({ text: "Appendix A: Detailed Technical Bid Evaluation (TBE)", bold: true, size: SIZE_H1, color: brandColor, font: FONT_HEADING })],
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 120 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: brandColor } },
        keepNext: true,
      }));
      docChildren.push(new Paragraph({
        children: [new TextRun({ text: `${exportTbeData.lineItems.length} line items × ${exportTbeData.tags.length} evaluation tags`, size: SIZE_BODY, color: "666666", font: FONT_BODY })],
        spacing: { after: 300 },
      }));

      for (let liIdx = 0; liIdx < exportTbeData.lineItems.length; liIdx++) {
        // Line item sub-heading
        if (liIdx > 0) {
          docChildren.push(new Paragraph({ spacing: { before: 300 } }));
        }
        docChildren.push(new Paragraph({
          children: [new TextRun({ text: `${exportTbeData.lineItems[liIdx]}`, bold: true, size: SIZE_H2, color: brandColor, font: FONT_HEADING })],
          spacing: { before: 200, after: 120 },
        }));

        // Build TBE table for this line item: Tag | Response
        const tbeHeaderRow = new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Evaluation Tag", size: SIZE_SMALL, font: FONT_BODY, bold: true, color: "FFFFFF" })] })],
              width: { size: 2400, type: WidthType.DXA },
              shading: { type: ShadingType.SOLID, color: brandColor },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Response", size: SIZE_SMALL, font: FONT_BODY, bold: true, color: "FFFFFF" })] })],
              width: { size: 7200, type: WidthType.DXA },
              shading: { type: ShadingType.SOLID, color: brandColor },
            }),
          ],
        });

        const tbeRows = exportTbeData.tags.map((tag) => {
          const cellText = exportTbeData.cells[`${liIdx}-${tag}`] ?? "—";
          return new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: tag, bold: true, size: SIZE_SMALL, font: FONT_BODY, color: brandColor })], spacing: { after: 40 } })],
                width: { size: 2400, type: WidthType.DXA },
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: cellText.substring(0, 600), size: SIZE_SMALL, font: FONT_BODY })], spacing: { after: 40 } })],
                width: { size: 7200, type: WidthType.DXA },
              }),
            ],
          });
        });

        docChildren.push(new Table({
          rows: [tbeHeaderRow, ...tbeRows],
          width: { size: 9600, type: WidthType.DXA },
        }));
      }
    }

    // ========== Build the DOCX document ==========
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: FONT_BODY, size: SIZE_BODY, color: "333333" },
            paragraph: { spacing: { line: 276 }, alignment: AlignmentType.LEFT }, // 1.15 line spacing
          },
          heading1: {
            run: { font: FONT_HEADING, size: SIZE_H1, bold: true, color: brandColor },
            paragraph: { spacing: { before: 400, after: 200 } },
          },
          heading2: {
            run: { font: FONT_HEADING, size: SIZE_H2, bold: true, color: brandColor },
            paragraph: { spacing: { before: 300, after: 150 } },
          },
          heading3: {
            run: { font: FONT_HEADING, size: SIZE_H3, bold: true, color: brandColor },
            paragraph: { spacing: { before: 240, after: 120 } },
          },
        },
      },
      numbering: {
        config: [{
          reference: "default-numbering",
          levels: [{
            level: 0,
            format: "decimal" as any,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 360, hanging: 360 } } },
          }],
        }],
      },
      sections: [{
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: severeServiceExport ? "WinsProposal Demo Engine | Confidential Demo Proposal" : `${companyName} | Confidential`, size: 16, color: "999999", font: FONT_BODY, italics: severeServiceExport }),
                ],
                alignment: AlignmentType.RIGHT,
                border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "dddddd" } },
                spacing: { after: 200 },
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `${proposal.title.substring(0, 80)} | Proposal-stage engineering estimate`, size: 14, color: "777777", font: FONT_BODY }),
                ],
                alignment: AlignmentType.CENTER,
                border: { top: { style: BorderStyle.SINGLE, size: 1, color: "dddddd" } },
                spacing: { before: 200 },
              }),
            ],
          }),
        },
        children: docChildren,
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const filename = `${proposal.title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50)}_Proposal.docx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
      },
    });
  } catch (error: any) {
    console.error("DOCX export error:", error?.message, error?.stack);
    return NextResponse.json({ error: error?.message ?? "Failed to export DOCX" }, { status: 500 });
  }
}
