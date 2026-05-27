export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { getTbeTagsForTemplate } from "@/lib/templates";

const DEFAULT_TAGS = ["Material", "Pressure Rating", "Size", "End Connection", "Body Type", "Bonnet Type", "Packing", "Testing", "Certification"];

async function callLLM(messages: any[], retries = 2): Promise<string> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch("https://apps.abacus.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages,
          temperature: 0.3,
          max_tokens: 4000,
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`LLM API ${res.status}: ${errText}`);
      }
      const data = await res.json();
      return data?.choices?.[0]?.message?.content ?? "{}";
    } catch (err) {
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
  return "{}";
}

export async function POST(request: Request, { params }: { params: { rfpId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any)?.id;

    const rfp = await prisma.rfpUpload.findFirst({ where: { id: params.rfpId, userId } });
    if (!rfp) return NextResponse.json({ error: "RFP not found" }, { status: 404 });

    const extractedData = rfp?.extractedData as any;
    if (!extractedData) return NextResponse.json({ error: "RFP has not been parsed" }, { status: 400 });

    const lineItems = extractedData?.lineItems ?? [];
    if (lineItems.length === 0) {
      return NextResponse.json({ error: "No line items found in this RFP. TBE generation requires line items from a Material Requisition document." }, { status: 400 });
    }

    // Determine tags based on template and sub-type (from query params)
    const url = new URL(request.url);
    const templateType = url.searchParams.get("templateType") || "";
    const subType = url.searchParams.get("subType") || "";
    const TAGS = (templateType) ? getTbeTagsForTemplate(templateType, subType || undefined) : DEFAULT_TAGS;

    // Get vault context for reference
    const vaultDocs = await prisma.vaultDocument.findMany({
      where: { userId },
      include: { sections: true },
      take: 10,
    });
    const vaultContext = vaultDocs.flatMap((d: any) =>
      (d.sections ?? []).map((s: any) => `[${d.filename}] ${s.sectionTitle}: ${(s.content ?? "").substring(0, 200)}`)
    ).slice(0, 20).join("\n") || "No vault content available.";

    const textEntries = await prisma.vaultTextEntry.findMany({ where: { userId }, take: 10 });
    const textContext = textEntries.map((e: any) => `[${e.title}]: ${(e.content ?? "").substring(0, 200)}`).join("\n") || "";

    // Process in batches of 5 line items
    const BATCH_SIZE = 5;
    const allResponses: any[] = [];
    const totalBatches = Math.ceil(lineItems.length / BATCH_SIZE);

    // Use SSE-like streaming via response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
            const batchStart = batchIdx * BATCH_SIZE;
            const batchItems = lineItems.slice(batchStart, batchStart + BATCH_SIZE);

            const systemMessage = `You are a technical bid evaluation expert specializing in industrial equipment (valves, pumps, EPC). Generate detailed technical compliance responses for Material Requisition line items.

For each line item and each evaluation tag, provide a specific, technical response that:
- References actual industry standards (API, ASME, ISO) where applicable
- Includes specific material grades, pressure ratings, sizes as relevant
- Is professional and assertive ("We offer..." / "Our product complies...")
- Uses vault reference content when available

Respond in JSON format:
{
  "responses": [
    {
      "lineItemIndex": 0,
      "tag": "Material",
      "responseText": "Detailed technical response..."
    }
  ]
}
Respond with raw JSON only.`;

            const userMessage = `Line Items (batch ${batchIdx + 1}/${totalBatches}):
${batchItems.map((item: any, i: number) => {
  const idx = batchStart + i;
  return `Item ${idx}: ${item?.item ?? ""} - ${item?.description ?? ""} (Qty: ${item?.quantity ?? "N/A"}, Specs: ${item?.specifications ?? "N/A"})`;
}).join("\n")}

Evaluation Tags: ${TAGS.join(", ")}

Generate responses for each line item × each tag combination.
Line item indices: ${batchItems.map((_: any, i: number) => batchStart + i).join(", ")}

Vault Reference Material:
${vaultContext}
${textContext ? `\nText Entries:\n${textContext}` : ""}`;

            // Send progress
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "processing", batch: batchIdx + 1, totalBatches, message: `Processing items ${batchStart + 1}-${Math.min(batchStart + BATCH_SIZE, lineItems.length)} of ${lineItems.length}...` })}\n\n`));

            const llmResult = await callLLM([
              { role: "system", content: systemMessage },
              { role: "user", content: userMessage },
            ]);

            let parsed: any;
            try {
              parsed = JSON.parse(llmResult);
            } catch {
              console.error("Failed to parse TBE batch response");
              parsed = { responses: [] };
            }

            const batchResponses = Array.isArray(parsed?.responses) ? parsed.responses : [];

            // Save to database
            for (const resp of batchResponses) {
              if (resp?.lineItemIndex !== undefined && resp?.tag && resp?.responseText) {
                try {
                  const saved = await prisma.tbeResponse.upsert({
                    where: {
                      rfpId_lineItemIndex_tag: {
                        rfpId: params.rfpId,
                        lineItemIndex: resp.lineItemIndex,
                        tag: resp.tag,
                      },
                    },
                    update: { responseText: resp.responseText },
                    create: {
                      rfpId: params.rfpId,
                      lineItemIndex: resp.lineItemIndex,
                      tag: resp.tag,
                      responseText: resp.responseText,
                    },
                  });
                  allResponses.push(saved);
                } catch (dbErr: any) {
                  console.error("TBE save error:", dbErr?.message);
                }
              }
            }
          }

          // Final result
          const finalResponses = await prisma.tbeResponse.findMany({
            where: { rfpId: params.rfpId },
            orderBy: [{ lineItemIndex: "asc" }, { tag: "asc" }],
          });

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "completed", responses: finalResponses, tags: TAGS })}\n\n`));
        } catch (err: any) {
          console.error("TBE generation error:", err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "error", message: err?.message ?? "TBE generation failed" })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("TBE generation error:", error);
    return NextResponse.json({ error: error?.message ?? "Failed to generate TBE" }, { status: 500 });
  }
}
