export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { calculateWinScore } from "@/lib/win-score";
import { generateVisualization, getBestVisualizationType, getFallbackVisualization, type VisualizationType } from "@/lib/visualization-service";
import { parseProposalTemplateMetadata } from "@/lib/severe-service-intelligence";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, PageBreak, Header, Footer,
  ImageRun, PageNumber, NumberFormat,
  Table, TableRow, TableCell, WidthType, ShadingType,
  Bookmark, InternalHyperlink,
} from "docx";

const FONT_BODY = "Calibri";
const FONT_HEADING = "Calibri";
const SIZE_BODY = 21; // ~10.5pt
const SIZE_H1 = 30;   // 15pt
const SIZE_H2 = 26;   // 13pt
const SIZE_H3 = 24;   // 12pt
const SIZE_SMALL = 18; // 9pt
const ACCENT_COLOR = "10b981";
type DocxBlock = Paragraph | Table;

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

  const generated = await generateVisualization(context);
  const generatedImage = await fetchImageBuffer(generated.imageUrl, { minWidth: 240, minHeight: 160 });
  if (generatedImage) return generatedImage;

  const fallbackType = getBestVisualizationType(section.sectionTitle, section.content, {
    templateType: proposal.templateType,
    industry: proposal.industry,
  });
  const fallback = getFallbackVisualization(context, fallbackType);
  return fetchImageBuffer(fallback.imageUrl, { minWidth: 240, minHeight: 160 });
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

function buildNativeDocxDiagram(section: any, proposal: any, brandColor: string): DocxBlock[] {
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
    if (proposal.rfpId) {
      const tbeResponses = await prisma.tbeResponse.findMany({
        where: { rfpId: proposal.rfpId },
        orderBy: [{ lineItemIndex: "asc" }, { tag: "asc" }],
      });
      if (tbeResponses.length > 0) {
        const tags = [...new Set(tbeResponses.map((r: any) => r.tag))];
        const maxIdx = Math.max(...tbeResponses.map((r: any) => r.lineItemIndex));
        const rfpData = await prisma.rfpUpload.findUnique({ where: { id: proposal.rfpId }, select: { extractedData: true } });
        const lineItemsData = (rfpData?.extractedData as any)?.lineItems ?? [];
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

    // Company & Date
    docChildren.push(new Paragraph({
      children: [new TextRun({ text: `Prepared by ${companyName}`, size: 22, color: "555555", font: FONT_BODY })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }));
    docChildren.push(new Paragraph({
      children: [new TextRun({ text: createdDate, size: 20, color: "777777", font: FONT_BODY })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }));

    // Win Score box
    const scoreColor = scoreResult.total >= 80 ? ACCENT_COLOR : scoreResult.total >= 60 ? "d97706" : "ef4444";
    docChildren.push(new Paragraph({
      children: [
        new TextRun({ text: "Win Score: ", bold: true, size: 26, color: brandColor, font: FONT_HEADING }),
        new TextRun({ text: `${scoreResult.total}/100`, bold: true, size: 26, color: scoreColor, font: FONT_HEADING }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }));

    // Spacer after score
    docChildren.push(new Paragraph({ spacing: { after: 200 } }));

    docChildren.push(new Paragraph({ children: [new PageBreak()] }));

    // --- TABLE OF CONTENTS (Manual) ---
    docChildren.push(new Paragraph({
      children: [new TextRun({ text: "Table of Contents", bold: true, size: 32, color: brandColor, font: FONT_HEADING })],
      spacing: { after: 100 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: brandColor } },
    }));
    docChildren.push(new Paragraph({ spacing: { after: 200 } }));

    const sectionAnchors = proposal.sections.map((section, idx) => makeBookmarkId(`section_${idx + 1}_${section.id}`));
    const complianceAnchor = makeBookmarkId("section_compliance_checklist");
    const tbeAnchor = makeBookmarkId("section_technical_bid_evaluation");

    // Build linked TOC entries
    proposal.sections.forEach((section, idx) => {
      docChildren.push(new Paragraph({
        children: [
          tocLink(`${idx + 1}. ${section.sectionTitle}`, sectionAnchors[idx], brandColor),
        ],
        spacing: { after: 80 },
        border: { bottom: { style: BorderStyle.DOTTED, size: 1, color: "d1d5db" } },
      }));
    });

    let tocIdx = proposal.sections.length + 1;
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
    if (tbeData) {
      docChildren.push(new Paragraph({
        children: [
          tocLink(`${tocIdx}. Technical Bid Evaluation (TBE)`, tbeAnchor, brandColor),
        ],
        spacing: { after: 80 },
        border: { bottom: { style: BorderStyle.DOTTED, size: 1, color: "d1d5db" } },
      }));
    }

    docChildren.push(new Paragraph({ children: [new PageBreak()] }));

    // --- SECTIONS ---
    proposal.sections.forEach((section, idx) => {
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
      }));

      // Source badge (clean text, no emoji)
      docChildren.push(new Paragraph({
        children: [
          new TextRun({
            text: section.sourceType === "vault" ? "[From Knowledge Vault]" : "[AI Generated]",
            size: SIZE_SMALL,
            color: section.sourceType === "vault" ? ACCENT_COLOR : "3b82f6",
            italics: true,
            font: FONT_BODY,
          }),
        ],
        spacing: { after: 200 },
        alignment: AlignmentType.LEFT,
      }));

      // Section content
      const contentParagraphs = markdownToParagraphs(section.content, brandColor);
      docChildren.push(...contentParagraphs);

      // Native Word visual if enabled. These are section-aware layouts, not repeated screenshots.
      if (includeDiagrams) {
        docChildren.push(...buildNativeDocxDiagram(section, proposal, brandColor));
      }

      // Page break between sections (except last)
      if (idx < proposal.sections.length - 1) {
        docChildren.push(new Paragraph({ children: [new PageBreak()] }));
      }
    });

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
      }));

      const checkedCount = checklist.filter((i: any) => i?.checked).length;
      docChildren.push(new Paragraph({
        children: [new TextRun({ text: `${checkedCount}/${checklist.length} items verified`, size: SIZE_BODY, color: "666666", font: FONT_BODY })],
        spacing: { after: 200 },
      }));

      // Compliance table
      const complianceRows = checklist.map((item: any) =>
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: item?.checked ? "\u2705" : "\u2610", size: SIZE_BODY })], alignment: AlignmentType.CENTER })],
              width: { size: 600, type: WidthType.DXA },
              verticalAlign: "center" as any,
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: item?.label ?? "", bold: true, size: SIZE_BODY, font: FONT_BODY })], spacing: { after: 40 } })],
              width: { size: 4500, type: WidthType.DXA },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: item?.standard ?? "", size: SIZE_SMALL, color: "666666", font: FONT_BODY })], spacing: { after: 40 } })],
              width: { size: 4500, type: WidthType.DXA },
            }),
          ],
        })
      );

      // Header row
      const headerRow = new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "", size: SIZE_SMALL, font: FONT_BODY, bold: true })], alignment: AlignmentType.CENTER })],
            width: { size: 600, type: WidthType.DXA },
            shading: { type: ShadingType.SOLID, color: brandColor },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Requirement", size: SIZE_SMALL, font: FONT_BODY, bold: true, color: "FFFFFF" })] })],
            width: { size: 4500, type: WidthType.DXA },
            shading: { type: ShadingType.SOLID, color: brandColor },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Standard", size: SIZE_SMALL, font: FONT_BODY, bold: true, color: "FFFFFF" })] })],
            width: { size: 4500, type: WidthType.DXA },
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
    if (tbeData) {
      docChildren.push(new Paragraph({ children: [new PageBreak()] }));
      docChildren.push(new Paragraph({
        children: [
          new Bookmark({
            id: tbeAnchor,
            children: [new TextRun({ text: "Technical Bid Evaluation (TBE)", bold: true, size: SIZE_H1, color: brandColor, font: FONT_HEADING })],
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 120 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: brandColor } },
      }));
      docChildren.push(new Paragraph({
        children: [new TextRun({ text: `${tbeData.lineItems.length} line items × ${tbeData.tags.length} evaluation tags`, size: SIZE_BODY, color: "666666", font: FONT_BODY })],
        spacing: { after: 300 },
      }));

      for (let liIdx = 0; liIdx < tbeData.lineItems.length; liIdx++) {
        // Line item sub-heading
        if (liIdx > 0) {
          docChildren.push(new Paragraph({ spacing: { before: 300 } }));
        }
        docChildren.push(new Paragraph({
          children: [new TextRun({ text: `${tbeData.lineItems[liIdx]}`, bold: true, size: SIZE_H2, color: brandColor, font: FONT_HEADING })],
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

        const tbeRows = tbeData.tags.map((tag) => {
          const cellText = tbeData!.cells[`${liIdx}-${tag}`] ?? "—";
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
            pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  ...(logoImage ? [] : [new TextRun({ text: companyName, size: 16, color: "999999", font: FONT_BODY })]),
                  ...(logoImage ? [] : [new TextRun({ text: "  |  ", size: 16, color: "cccccc" })]),
                  new TextRun({ text: logoImage ? companyName + "  |  " : "", size: 16, color: "999999", font: FONT_BODY }),
                  new TextRun({ text: "Confidential", size: 16, color: "999999", italics: true, font: FONT_BODY }),
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
                  new TextRun({ text: proposal.title.substring(0, 40), size: 14, color: "999999", font: FONT_BODY }),
                  new TextRun({ text: "    |    Page ", size: 14, color: "999999", font: FONT_BODY }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 14, color: "555555", bold: true, font: FONT_BODY }),
                  new TextRun({ text: " of ", size: 14, color: "999999", font: FONT_BODY }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 14, color: "555555", bold: true, font: FONT_BODY }),
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
