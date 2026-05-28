export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { calculateWinScore } from "@/lib/win-score";
import { generateVisualization } from "@/lib/visualization-service";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, PageBreak, Header, Footer,
  ImageRun, PageNumber, NumberFormat,
  Table, TableRow, TableCell, WidthType, ShadingType,
} from "docx";

const FONT_BODY = "Calibri";
const FONT_HEADING = "Calibri";
const SIZE_BODY = 21; // ~10.5pt
const SIZE_H1 = 30;   // 15pt
const SIZE_H2 = 26;   // 13pt
const SIZE_H3 = 24;   // 12pt
const SIZE_SMALL = 18; // 9pt
const ACCENT_COLOR = "10b981";

async function fetchImageBuffer(url: string): Promise<{ buffer: Buffer; type: "png" | "jpg" } | null> {
  try {
    if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) return null;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length < 100) return null;
    const contentType = res.headers.get("content-type") ?? "";
    const type = contentType.includes("png") || url.includes(".png") ? "png" : "jpg";
    return { buffer, type };
  } catch {
    return null;
  }
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
    const includeDiagrams = searchParams.get("includeDiagrams") === "true";

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

    // ========== Generate export-safe diagrams for each section ==========
    const sectionDiagramImages: Record<string, ImageRun | null> = {};

    if (includeDiagrams) {
      // Generate Mermaid diagrams and convert to images using mermaid.ink only when explicitly requested.
      for (const section of proposal.sections) {
        try {
          const diagram = await generateVisualization({
            title: proposal.title,
            sectionTitle: section.sectionTitle,
            industry: proposal.industry,
            templateType: proposal.templateType,
            content: section.content,
          });

          const imgData = await fetchImageBuffer(diagram.imageUrl);
          if (imgData && imgData.buffer.length > 500) {
            sectionDiagramImages[section.id] = new ImageRun({
              data: imgData.buffer,
              transformation: { width: 580, height: 330 },
              type: "png",
            });
          }
        } catch (err) {
          console.error(`Diagram generation failed for section ${section.sectionTitle}:`, err);
          // Continue without diagram for this section
        }
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
      children: [new TextRun({ text: `${proposal.industry} \u2022 ${proposal.templateType} Template`, size: 24, color: "666666", font: FONT_BODY })],
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

    // Build manual TOC entries
    proposal.sections.forEach((section, idx) => {
      docChildren.push(new Paragraph({
        children: [
          new TextRun({ text: `${idx + 1}. ${section.sectionTitle}`, size: SIZE_BODY, font: FONT_BODY, color: brandColor }),
        ],
        spacing: { after: 80 },
        border: { bottom: { style: BorderStyle.DOTTED, size: 1, color: "d1d5db" } },
      }));
    });

    let tocIdx = proposal.sections.length + 1;
    if (checklist && checklist.length > 0) {
      docChildren.push(new Paragraph({
        children: [
          new TextRun({ text: `${tocIdx}. Compliance Checklist`, size: SIZE_BODY, font: FONT_BODY, color: brandColor }),
        ],
        spacing: { after: 80 },
        border: { bottom: { style: BorderStyle.DOTTED, size: 1, color: "d1d5db" } },
      }));
      tocIdx++;
    }
    if (tbeData) {
      docChildren.push(new Paragraph({
        children: [
          new TextRun({ text: `${tocIdx}. Technical Bid Evaluation (TBE)`, size: SIZE_BODY, font: FONT_BODY, color: brandColor }),
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
          new TextRun({ text: `${idx + 1}. ${section.sectionTitle}`, bold: true, size: SIZE_H1, color: brandColor, font: FONT_HEADING }),
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

      // Diagram image if available
      const diagramImg = sectionDiagramImages[section.id];
      if (diagramImg) {
        docChildren.push(new Paragraph({ spacing: { before: 200 } }));
        docChildren.push(new Paragraph({
          children: [new TextRun({ text: `${section.sectionTitle} \u2014 Diagram`, bold: true, size: SIZE_SMALL, color: "555555", font: FONT_BODY, italics: true })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }));
        docChildren.push(new Paragraph({
          children: [diagramImg],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }));
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
        children: [new TextRun({ text: "Compliance Checklist", bold: true, size: SIZE_H1, color: brandColor, font: FONT_HEADING })],
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
        children: [new TextRun({ text: "Technical Bid Evaluation (TBE)", bold: true, size: SIZE_H1, color: brandColor, font: FONT_HEADING })],
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
