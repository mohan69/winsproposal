export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { calculateWinScore } from "@/lib/win-score";
import { generateProposalHtml } from "@/lib/pdf-template";

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
        // Get line item names from RFP extracted data
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

    // Generate Mermaid diagrams for each section
    const sectionDiagramUrls: Record<string, string> = {};

    if (includeDiagrams) {
      function getBestDiagramType(title: string, content: string): string {
        const t = title.toLowerCase();
        const text = content.toLowerCase().substring(0, 800);
        if (/scope|overview|process|methodology|procedure|manufacturing|fabrication|production|assembly|treatment/.test(t) || /process flow|pfd|p&id|manufacturing steps|fabrication/.test(text)) return "pfd";
        if (/schedule|timeline|delivery|milestones?|project plan|implementation/.test(t) || /week \d|phase \d|month \d|delivery schedule|lead time/.test(text)) return "gantt";
        if (/communication|inspection|stakeholder|interface|interaction|handover/.test(t) || /submit|receive|review|approve|notify|respond/.test(text)) return "sequence";
        return "flowchart";
      }

      for (const section of proposal.sections) {
        try {
          const diagramType = getBestDiagramType(section.sectionTitle, section.content);
          const diagramTypeMap: Record<string, string> = {
            flowchart: "a flowchart (graph TD) showing the process flow, decision points, and key steps",
            sequence: "a sequence diagram showing interactions between stakeholders, systems, or departments",
            gantt: "a Gantt chart showing the project timeline, milestones, and phases",
            pfd: "a process flow diagram (graph LR) showing the manufacturing/engineering process flow with equipment, inputs, outputs, and connections",
          };
          const diagramDesc = diagramTypeMap[diagramType] || diagramTypeMap.flowchart;

          const systemPrompt = `You are an expert technical diagram creator. Generate valid Mermaid.js diagram code.
Rules:
- Output ONLY the raw Mermaid diagram code, nothing else
- No markdown code fences, no explanation text
- Use clear, readable labels (not too long)
- Keep node IDs simple (A, B, C)
- Maximum 12 nodes for readability
- CRITICAL: NEVER use parentheses () inside node labels. Use square brackets: A["Label text"]. Replace abbreviations like "(NDT)" with " - NDT".
- Always quote node labels with double quotes inside brackets: A["My Label"]
- NEVER use round brackets () for node shapes.`;

          const userPrompt = `Generate ${diagramDesc} for: ${section.sectionTitle}\nContent: ${section.content.substring(0, 1500)}\nGenerate the Mermaid diagram code now:`;

          const llmRes = await fetch("https://apps.abacus.ai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}` },
            body: JSON.stringify({
              model: "gpt-4o",
              messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
              temperature: 0.3,
              max_tokens: 1500,
            }),
          });

          if (llmRes.ok) {
            const llmData = await llmRes.json();
            let mermaidCode = llmData?.choices?.[0]?.message?.content ?? "";
            mermaidCode = mermaidCode.replace(/```mermaid\n?/gi, "").replace(/```\n?/g, "").trim();
            // Sanitize parentheses
            mermaidCode = mermaidCode.split("\n").map((line: string) => {
              if (/^\s*(graph|subgraph|end|style|classDef|class |linkStyle|%%)/i.test(line)) return line;
              return line.replace(/(\[\"?)(.*?)(\"?\])/g, (_m: string, open: string, content: string, close: string) => {
                const sanitized = content.replace(/\(/g, " - ").replace(/\)/g, "").replace(/\s+-\s+\s*/g, " - ");
                const tOpen = open.endsWith('"') ? open : open + '"';
                const tClose = close.startsWith('"') ? close : '"' + close;
                return `${tOpen}${sanitized}${tClose}`;
              });
            }).join("\n");

            if (mermaidCode) {
              const encoded = Buffer.from(mermaidCode).toString("base64");
              const mBase = 'https://' + 'mermaid' + '.ink';
              const diagramUrl = mBase + '/img/' + encoded + '?type=png&width=700&height=400&bgColor=white';
              // Validate diagram actually renders by fetching it
              try {
                const imgCheck = await fetch(diagramUrl, { signal: AbortSignal.timeout(8000) });
                if (imgCheck.ok) {
                  const buf = await imgCheck.arrayBuffer();
                  if (buf.byteLength > 500) {
                    sectionDiagramUrls[section.id] = diagramUrl;
                  }
                }
              } catch {
                console.log(`Diagram validation failed for ${section.sectionTitle}, skipping`);
              }
            }
          }
        } catch (err) {
          console.error(`PDF diagram generation failed for section ${section.sectionTitle}:`, err);
        }
      }
    }

    // Generate HTML
    const html = generateProposalHtml({
      title: proposal.title,
      industry: proposal.industry,
      templateType: proposal.templateType,
      status: proposal.status,
      createdAt: proposal.createdAt.toISOString(),
      sections: proposal.sections.map((s) => ({
        sectionTitle: s.sectionTitle,
        content: s.content,
        sourceType: s.sourceType,
        diagramSvgUrl: sectionDiagramUrls[s.id] || undefined,
      })),
      winScore: scoreResult.total,
      companyName: proposal.user?.companyName ?? undefined,
      vaultSectionsUsed: proposal.vaultSectionsUsed,
      vaultDocumentsUsed: proposal.vaultDocumentsUsed,
      orgName: (proposal.user as any)?.organization?.name ?? undefined,
      orgLogoUrl: (proposal.user as any)?.organization?.logoUrl ?? undefined,
      brandColor: (proposal.user as any)?.organization?.brandColor ?? undefined,
      tbeData: tbeData ?? undefined,
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
          footer_template: `<div style="width:100%;font-size:8px;color:#6b7280;display:flex;justify-content:space-between;padding:0 22mm;"><span>${proposal.title.length > 45 ? proposal.title.substring(0, 45) + "…" : proposal.title}</span><span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
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
