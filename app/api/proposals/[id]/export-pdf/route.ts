export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { calculateWinScore } from "@/lib/win-score";
import { generateFallbackProposalHtml, generateProposalHtml } from "@/lib/pdf-template";
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
    let pdfMode: "rich" | "text-fallback" | "minimal-fallback" = "rich";
    if (html.length > 2_500_000 && Object.keys(drawingImageData).length > 0) {
      console.warn(`PDF export HTML payload ${html.length} bytes; retrying with drawing text fallbacks.`);
      html = generateProposalHtml({ ...htmlData, drawingImageData: {} });
      pdfMode = "text-fallback";
    }

    async function createPdfRequest(htmlContent: string) {
      return fetch("https://apps.abacus.ai/api/createConvertHtmlToPdfRequest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deployment_token: process.env.ABACUSAI_API_KEY,
          html_content: htmlContent,
          pdf_options: {
            format: "A4",
            print_background: true,
            margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
            display_header_footer: true,
            header_template: '<div></div>',
            footer_template: `<div style="width:100%;font-size:8px;color:#6b7280;display:flex;justify-content:space-between;gap:12px;padding:0 21mm;font-family:Arial,Helvetica,sans-serif;"><span>${proposalTitle.length > 45 ? proposalTitle.substring(0, 45) + "…" : proposalTitle}</span><span>Proposal-stage engineering estimate</span><span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
          },
          base_url: process.env.NEXTAUTH_URL || "",
        }),
      });
    }

    // Step 1: Create PDF request
    let createResponse = await createPdfRequest(html);

    if (!createResponse.ok) {
      const errorText = await createResponse.text().catch(() => "");
      console.error(`PDF create error for proposal ${proposal.id}, mode ${pdfMode}: ${createResponse.status} ${errorText}`);
      if (Object.keys(drawingImageData).length > 0) {
        console.warn(`Retrying PDF create for proposal ${proposal.id} with drawing text fallbacks.`);
        html = generateProposalHtml({ ...htmlData, drawingImageData: {} });
        pdfMode = "text-fallback";
        createResponse = await createPdfRequest(html);
      }
      if (!createResponse.ok) {
        console.error(`PDF create text fallback error for proposal ${proposal.id}: ${createResponse.status} ${await createResponse.text().catch(() => "")}`);
        console.warn(`Retrying PDF create for proposal ${proposal.id} with minimal text/table fallback.`);
        html = generateFallbackProposalHtml({ ...htmlData, drawingImageData: {} });
        pdfMode = "minimal-fallback";
        createResponse = await createPdfRequest(html);
      }
      if (!createResponse.ok) {
        console.error(`PDF create minimal fallback error for proposal ${proposal.id}: ${createResponse.status} ${await createResponse.text().catch(() => "")}`);
        return NextResponse.json({ error: "PDF export failed after image and text fallback attempts." }, { status: 500 });
      }
    }

    let { request_id } = await createResponse.json();
    if (!request_id) return NextResponse.json({ error: "No request ID" }, { status: 500 });

    // Step 2: Poll for status
    let attempts = 0;
    const maxAttempts = 120;
    let conversionFallbackStarted = false;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const statusResponse = await fetch("https://apps.abacus.ai/api/getConvertHtmlToPdfStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id, deployment_token: process.env.ABACUSAI_API_KEY }),
      });

      const statusResult = await statusResponse.json();
      const status = statusResult?.status || "FAILED";

      if (status === "SUCCESS") {
        const result = statusResult?.result;
        if (result?.result) {
          const pdfBuffer = Buffer.from(result.result, "base64");
          const filename = `${proposal.title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50)}_Proposal.pdf`;
          return new NextResponse(pdfBuffer, {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="${filename}"`,
            },
          });
        }
        return NextResponse.json({ error: "PDF generated but no data" }, { status: 500 });
      } else if (status === "FAILED") {
        console.error(`PDF generation failed for proposal ${proposal.id}, mode ${pdfMode}:`, statusResult);
        if (!conversionFallbackStarted && Object.keys(drawingImageData).length > 0) {
          conversionFallbackStarted = true;
          console.warn(`Restarting PDF conversion for proposal ${proposal.id} with drawing text fallbacks.`);
          html = generateProposalHtml({ ...htmlData, drawingImageData: {} });
          pdfMode = "text-fallback";
          const fallbackCreateResponse = await createPdfRequest(html);
          if (fallbackCreateResponse.ok) {
            const fallbackCreate = await fallbackCreateResponse.json();
            request_id = fallbackCreate?.request_id;
            if (request_id) {
              attempts = 0;
              continue;
            }
          } else {
            console.error(`PDF fallback create error for proposal ${proposal.id}: ${fallbackCreateResponse.status} ${await fallbackCreateResponse.text().catch(() => "")}`);
          }
        }
        if (pdfMode !== "minimal-fallback") {
          console.warn(`Restarting PDF conversion for proposal ${proposal.id} with minimal text/table fallback.`);
          html = generateFallbackProposalHtml({ ...htmlData, drawingImageData: {} });
          pdfMode = "minimal-fallback";
          const minimalCreateResponse = await createPdfRequest(html);
          if (minimalCreateResponse.ok) {
            const minimalCreate = await minimalCreateResponse.json();
            request_id = minimalCreate?.request_id;
            if (request_id) {
              attempts = 0;
              continue;
            }
          } else {
            console.error(`PDF minimal fallback create error for proposal ${proposal.id}: ${minimalCreateResponse.status} ${await minimalCreateResponse.text().catch(() => "")}`);
          }
        }
        return NextResponse.json({ error: "PDF export failed after image and text fallback attempts." }, { status: 500 });
      }

      attempts++;
    }

    return NextResponse.json({ error: "PDF export failed after image and text fallback attempts." }, { status: 500 });
  } catch (error: any) {
    console.error("PDF export error:", error?.message, error?.stack);
    return NextResponse.json({ error: error?.message ?? "Failed to export PDF" }, { status: 500 });
  }
}
