export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { calculateWinScore } from "@/lib/win-score";
import { generateProposalHtml, generateSimplifiedProposalHtml, generateUltraMinimalProposalHtml } from "@/lib/pdf-template";
import { PdfRenderError, renderHtmlToPdf } from "@/lib/pdf-renderer";
import { getBestVisualizationType } from "@/lib/visualization-service";
import { buildEngineeringArtifact } from "@/lib/engineering-artifacts";
import { getDrawingExportKey, renderDrawingPackagePng } from "@/lib/export-diagram-renderer";
import { getHydrogenSectionContentOverride, getHydrogenTbeData, inferRfpIntelligence, parseProposalTemplateMetadata } from "@/lib/severe-service-intelligence";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const proposal = await prisma.proposal.findUnique({
      where: { id: params?.id, userId: (session.user as any)?.id },
      include: {
        sections: { orderBy: { orderIndex: "asc" } },
        complianceChecklist: true,
        user: { select: { companyName: true, organizationId: true, organization: { select: { name: true, logoUrl: true, brandColor: true } } } },
      },
    });

    if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    const proposalTitle = proposal.title;
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

    // Calculate win score
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

    const templateMetadata = parseProposalTemplateMetadata(proposal.templateType);
    const intelligence = inferRfpIntelligence(extractedData ?? {});
    const hydrogenExport = intelligence.applicationId === "hydrogen-process-control"
      || /hydrogen/i.test(`${proposal.title} ${proposal.templateType} ${proposal.industry} ${templateMetadata.application}`);
    const exportTbeData = hydrogenExport ? getHydrogenTbeData(extractedData, tbeData) : tbeData;
    const exportSections = proposal.sections.map((section) => ({
      ...section,
      content: hydrogenExport ? getHydrogenSectionContentOverride(section.sectionTitle, extractedData) ?? section.content : section.content,
    }));

    const drawingImageData: Record<string, string> = {};
    if (includeDiagrams) {
      for (const section of exportSections) {
        let artifact: ReturnType<typeof buildEngineeringArtifact> = null;
        try {
          artifact = buildEngineeringArtifact({
            sectionTitle: section.sectionTitle,
            sectionId: section.id,
            proposalId: proposal.id,
            templateType: proposal.templateType,
            extractedData,
          });
        } catch (error: any) {
          console.warn(`PDF artifact fallback for proposal ${proposal.id}, section "${section.sectionTitle}": ${error?.message ?? error}`);
          continue;
        }
        for (const drawing of artifact?.drawingPackages ?? []) {
          try {
            const png = await renderDrawingPackagePng(drawing);
            if (png?.dataUri) drawingImageData[getDrawingExportKey(drawing)] = png.dataUri;
          } catch (error: any) {
            console.warn(`PDF diagram PNG fallback for section "${section.sectionTitle}", drawing "${drawing.title}": ${error?.message ?? error}`);
          }
        }
      }
    }

    const htmlData = {
      proposalId: proposal.id,
      title: proposal.title,
      industry: proposal.industry,
      templateType: proposal.templateType,
      status: proposal.status,
      createdAt: proposal.createdAt.toISOString(),
      sections: exportSections.map((s) => ({
        id: s.id,
        sectionTitle: s.sectionTitle,
        content: s.content,
        sourceType: s.sourceType,
        visualizationType: getBestVisualizationType(s.sectionTitle, s.content, {
          templateType: proposal.templateType,
          industry: proposal.industry,
        }),
      })),
      winScore: scoreResult.total,
      companyName: proposal.user?.companyName ?? undefined,
      vaultSectionsUsed: proposal.vaultSectionsUsed,
      vaultDocumentsUsed: proposal.vaultDocumentsUsed,
      orgName: (proposal.user as any)?.organization?.name ?? undefined,
      orgLogoUrl: (proposal.user as any)?.organization?.logoUrl ?? undefined,
      brandColor: (proposal.user as any)?.organization?.brandColor ?? undefined,
      includeDiagrams,
      complianceItems: checklist ?? undefined,
      tbeData: exportTbeData ?? undefined,
      extractedData,
      drawingImageData,
    };

    // Generate HTML. If embedded PNGs make the payload too large, use the same
    // text/table diagram fallback that DOCX uses.
    let html = generateProposalHtml(htmlData);
    let pdfMode: "rich" | "text-fallback" | "minimal-fallback" | "ultra-minimal-fallback" = "rich";
    if (html.length > 2_500_000 && Object.keys(drawingImageData).length > 0) {
      console.warn(`PDF export HTML payload ${html.length} bytes; retrying with drawing text fallbacks.`);
      html = generateProposalHtml({ ...htmlData, drawingImageData: {} });
      pdfMode = "text-fallback";
    }

    const footerTemplate = `<div style="width:100%;font-size:8px;color:#6b7280;display:flex;justify-content:space-between;gap:12px;padding:0 21mm;font-family:Arial,Helvetica,sans-serif;"><span>${proposalTitle.length > 45 ? proposalTitle.substring(0, 45) + "..." : proposalTitle}</span><span>Proposal-stage engineering estimate</span><span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
    const attempts = [
      { mode: pdfMode, html },
      { mode: "text-fallback" as const, html: generateProposalHtml({ ...htmlData, drawingImageData: {} }) },
      { mode: "minimal-fallback" as const, html: generateSimplifiedProposalHtml({ ...htmlData, drawingImageData: {}, tbeData: undefined }) },
      { mode: "ultra-minimal-fallback" as const, html: generateUltraMinimalProposalHtml({ ...htmlData, drawingImageData: {}, tbeData: undefined }) },
    ].filter((attempt, index, list) => list.findIndex((item) => item.mode === attempt.mode) === index);

    const failures: string[] = [];
    for (const attempt of attempts) {
      try {
        console.info(`Starting PDF render for proposal ${proposal.id}; mode=${attempt.mode}; includeDiagrams=${includeDiagrams}; htmlBytes=${Buffer.byteLength(attempt.html, "utf8")}`);
        const allowPdfLibFallback = attempt.mode === "ultra-minimal-fallback";
        const result = await renderHtmlToPdf({
          stage: `proposal-${attempt.mode}`,
          html: attempt.html,
          footerTemplate,
          baseUrl: process.env.NEXTAUTH_URL || "",
          disablePdfLibFallback: !allowPdfLibFallback,
        });
        console.info(`PDF render succeeded for proposal ${proposal.id}; attempt=${attempt.mode}; renderer=${result.renderer}; stage=${result.stage}; bytes=${result.pdfBuffer.length}`);
        const filename = `${proposal.title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50)}_Proposal.pdf`;
        return new NextResponse(result.pdfBuffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "X-PDF-Render-Attempt": attempt.mode,
            "X-PDF-Renderer": result.renderer,
            "X-PDF-Renderer-Stage": result.stage,
          },
        });
      } catch (error: any) {
        const safeReason = error instanceof PdfRenderError ? error.safeReason : error?.message ?? "Unknown renderer error.";
        failures.push(`${attempt.mode}: ${safeReason}`);
        console.error(`PDF render attempt failed for proposal ${proposal.id}; mode=${attempt.mode}; reason=${safeReason}`);
      }
    }

    return NextResponse.json({
      error: "PDF export failed after image and text fallback attempts.",
      stages: failures,
    }, { status: 500 });
  } catch (error: any) {
    console.error("PDF export error:", error?.message, error?.stack);
    return NextResponse.json({ error: error?.message ?? "Failed to export PDF" }, { status: 500 });
  }
}
