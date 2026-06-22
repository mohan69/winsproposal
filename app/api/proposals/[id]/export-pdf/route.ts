export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { calculateWinScore } from "@/lib/win-score";
import { generateProposalHtml } from "@/lib/pdf-template";
import { getBestVisualizationType } from "@/lib/visualization-service";
import { buildEngineeringArtifact } from "@/lib/engineering-artifacts";
import { getDrawingExportKey, renderDrawingPackagePng } from "@/lib/export-diagram-renderer";

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

    const drawingImageData: Record<string, string> = {};
    if (includeDiagrams) {
      for (const section of proposal.sections) {
        const artifact = buildEngineeringArtifact({
          sectionTitle: section.sectionTitle,
          sectionId: section.id,
          proposalId: proposal.id,
          templateType: proposal.templateType,
          extractedData,
        });
        for (const drawing of artifact?.drawingPackages ?? []) {
          try {
            const png = await renderDrawingPackagePng(drawing);
            if (png?.dataUri) drawingImageData[getDrawingExportKey(drawing)] = png.dataUri;
          } catch (error: any) {
            console.warn(`PDF diagram PNG fallback for ${drawing.title}: ${error?.message ?? error}`);
          }
        }
      }
    }

    // Generate HTML
    const html = generateProposalHtml({
      proposalId: proposal.id,
      title: proposal.title,
      industry: proposal.industry,
      templateType: proposal.templateType,
      status: proposal.status,
      createdAt: proposal.createdAt.toISOString(),
      sections: proposal.sections.map((s) => ({
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
      tbeData: tbeData ?? undefined,
      extractedData,
      drawingImageData,
    });

    // Step 1: Create PDF request
    const createResponse = await fetch("https://apps.abacus.ai/api/createConvertHtmlToPdfRequest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        html_content: html,
        pdf_options: {
          format: "A4",
          print_background: true,
          margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
          display_header_footer: true,
          header_template: '<div></div>',
          footer_template: `<div style="width:100%;font-size:8px;color:#6b7280;display:flex;justify-content:space-between;gap:12px;padding:0 21mm;font-family:Arial,Helvetica,sans-serif;"><span>${proposal.title.length > 45 ? proposal.title.substring(0, 45) + "…" : proposal.title}</span><span>Proposal-stage engineering estimate</span><span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
        },
        base_url: process.env.NEXTAUTH_URL || "",
      }),
    });

    if (!createResponse.ok) {
      console.error("PDF create error:", await createResponse.text());
      return NextResponse.json({ error: "Failed to create PDF request" }, { status: 500 });
    }

    const { request_id } = await createResponse.json();
    if (!request_id) return NextResponse.json({ error: "No request ID" }, { status: 500 });

    // Step 2: Poll for status
    let attempts = 0;
    const maxAttempts = 120;

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
        console.error("PDF generation failed:", statusResult);
        return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
      }

      attempts++;
    }

    return NextResponse.json({ error: "PDF generation timed out" }, { status: 500 });
  } catch (error: any) {
    console.error("PDF export error:", error?.message, error?.stack);
    return NextResponse.json({ error: error?.message ?? "Failed to export PDF" }, { status: 500 });
  }
}
