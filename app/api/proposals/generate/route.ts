export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { TEMPLATES, getFullTemplateWithSubType } from "@/lib/templates";
import {
  SEVERE_SERVICE_DISCLAIMER,
  ensureSevereServiceSections,
  formatSevereServiceTemplateMetadata,
  getSevereServiceSectionSpecs,
  inferRfpIntelligence,
  selectRelevantSevereServiceVaultItems,
} from "@/lib/severe-service-intelligence";
import { buildEngineeringArtifact } from "@/lib/engineering-artifacts";

function formatSectionInstructions(inference: ReturnType<typeof inferRfpIntelligence>, fallback: string) {
  if (!inference.isSevereServiceValve) return fallback;
  const sections = getSevereServiceSectionSpecs();
  return `Use this severe-service control valve proposal section structure. Generate every listed section as a separate JSON entry. Use the RFP content dynamically; do not write generic filler.\n${sections
    .map((section, index) => `${index + 1}. ${section.title} — ${section.description}`)
    .join("\n")}`;
}

function attachDeterministicEngineeringArtifacts(sections: any[], templateType: string, extractedData: any) {
  return (sections ?? []).map((section) => {
    const title = section?.title ?? section?.sectionTitle ?? "";
    if (!["Preliminary Engineering Calculation Summary", "Datasheet Summary", "Drawings and Technical Visuals"].includes(title)) {
      return section;
    }
    const artifact = buildEngineeringArtifact({ sectionTitle: title, templateType, extractedData });
    if (!artifact) return section;
    const intro = title === "Drawings and Technical Visuals"
      ? "This section contains the proposal-grade drawing package generated from the RFP line items, application classification, and engineering review logic."
      : title === "Datasheet Summary"
        ? "This section provides tag-specific proposal-stage datasheet rows extracted from the RFP line items and process conditions."
        : "This section provides structured proposal-stage calculation inputs, assumptions, missing data, risk flags, standards basis, and engineer validation checks.";
    return {
      ...section,
      content: `${intro}\n\n${SEVERE_SERVICE_DISCLAIMER}`,
      sourceType: section?.sourceType === "vault" ? "vault" : "generated",
    };
  });
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    const body = await request.json();
    const { rfpId, templateType, companySize, subType } = body ?? {};
    if (!rfpId) {
      return new Response(JSON.stringify({ error: "rfpId is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const userId = (session?.user as any)?.id;

    // Get RFP data
    const rfp = await prisma.rfpUpload.findUnique({ where: { id: rfpId, userId } });
    if (!rfp) {
      return new Response(JSON.stringify({ error: "RFP not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }

    const extractedData = rfp?.extractedData as any;
    if (!extractedData) {
      return new Response(JSON.stringify({ error: "RFP has not been parsed yet" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    const inference = inferRfpIntelligence(extractedData);

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });
    const orgUsers = currentUser?.organizationId
      ? await prisma.user.findMany({ where: { organizationId: currentUser.organizationId }, select: { id: true } })
      : [];
    const accessibleUserIds = Array.from(new Set([userId, ...orgUsers.map((user) => user.id)]));

    // Get vault documents for matching. Organization-wide vault access is important
    // for demo teams where engineering knowledge is owned by a different persona.
    const vaultDocs = await prisma.vaultDocument.findMany({
      where: { userId: { in: accessibleUserIds } },
      include: { sections: true },
    });

    const allVaultSections = vaultDocs?.flatMap((d: any) =>
      (d?.sections ?? [])?.map((s: any) => ({ ...s, documentFilename: d?.filename, documentIndustry: d?.industry }))
    ) ?? [];

    // Get vault text entries for additional context
    const textEntries = await prisma.vaultTextEntry.findMany({ where: { userId: { in: accessibleUserIds } } });
    const relevantVaultSections = selectRelevantSevereServiceVaultItems(
      allVaultSections.map((section: any) => ({ ...section, title: section.sectionTitle })),
      inference,
      extractedData,
      36
    );
    const relevantTextEntries = selectRelevantSevereServiceVaultItems(textEntries, inference, extractedData, 28);

    // Build the prompt with vault context
    const vaultContext = relevantVaultSections?.map((s: any) =>
      `[Source: ${s?.documentFilename ?? "unknown"} | ID: ${s?.id}]\nTitle: ${s?.sectionTitle ?? ""}\nType: ${s?.sectionType ?? ""}\nContent: ${(s?.content ?? "")?.substring(0, 500)}`
    )?.join("\n\n") ?? "";

    // Add text entries context
    const textEntriesContext = relevantTextEntries?.map((e: any) =>
      `[Text Entry: ${e?.title ?? "untitled"} | ID: ${e?.id} | Industry: ${e?.industry ?? "General"}]\n${(e?.content ?? "")?.substring(0, 500)}`
    )?.join("\n\n") ?? "";

    const rfpSummary = extractedData?.summary ?? "No summary";
    const requirements = (extractedData?.requirements ?? [])?.map((r: any) => `- ${r?.description ?? r}`).join("\n") ?? "";
    const lineItems = (extractedData?.lineItems ?? [])?.map((l: any) => `- ${l?.item ?? ""}: ${l?.description ?? ""} (Qty: ${l?.quantity ?? "N/A"})`).join("\n") ?? "";
    const compliance = (extractedData?.complianceRequirements ?? [])?.join(", ") ?? "";
    const industry = extractedData?.industry ?? "General";

    // Determine template sections (with sub-type enrichment)
    let selectedTemplate = subType
      ? getFullTemplateWithSubType(templateType, subType)
      : TEMPLATES.find((t) => t.id === templateType);
    let sectionInstructions: string;

    if (selectedTemplate) {
      sectionInstructions = `Use the following ${selectedTemplate.name} section structure. Generate content for each section using industry-specific language for the ${selectedTemplate.industry} industry:\n` +
        selectedTemplate.sections.map((s, i) => `${i + 1}. ${s.title} — ${s.description}`).join("\n");
    } else {
      sectionInstructions = `Generate these standard sections:
1. Executive Summary
2. Technical Approach
3. Scope of Work
4. Compliance Matrix
5. Quality Assurance
6. Project Timeline & Delivery
7. Company Qualifications
8. Pricing Framework
9. Terms & Conditions`;
    }
    sectionInstructions = formatSectionInstructions(inference, sectionInstructions);

    // Company size-driven tone & depth
    const companySizeLabels: Record<string, string> = {
      startup: "Startup (1-50 employees)",
      sme: "Small/Medium Enterprise (50-500 employees)",
      mid_market: "Mid-Market Company (500-5,000 employees)",
      enterprise: "Enterprise Corporation (5,000-50,000 employees)",
      conglomerate: "Large Conglomerate (50,000+ employees)",
    };
    const companySizeInstructions: Record<string, string> = {
      startup: "Write concise, direct proposals. Use simple language, focus on value and cost-effectiveness. Keep sections short (1-2 paragraphs). Emphasize agility, innovation, and quick delivery. Avoid excessive formality or corporate jargon.",
      sme: "Write professional but approachable proposals. Use moderate detail (2-3 paragraphs per section). Balance technical depth with readability. Highlight reliability, proven track record, and competitive pricing.",
      mid_market: "Write detailed, structured proposals with professional tone. Include comprehensive technical details (3-4 paragraphs per section). Reference industry standards and certifications. Include project management methodology and risk mitigation.",
      enterprise: "Write highly formal, comprehensive proposals with executive-level language. Include extensive technical depth (4-5 paragraphs per section). Emphasize enterprise-grade quality, global capabilities, regulatory compliance, and scalability. Include detailed governance frameworks.",
      conglomerate: "Write extremely formal, boardroom-ready proposals. Use maximum detail and depth (5+ paragraphs per section). Include comprehensive risk analysis, multi-site coordination plans, global supply chain considerations, and C-suite executive summaries. Reference international standards and multi-jurisdictional compliance.",
    };
    const sizeLabel = companySizeLabels[companySize] || companySizeLabels.enterprise;
    const sizeInstr = companySizeInstructions[companySize] || companySizeInstructions.enterprise;

    const systemMessage = `You are an experienced proposal manager for engineered industrial proposals. Generate a winning proposal that addresses all RFP requirements.

TARGET COMPANY SIZE: ${sizeLabel}
TONE & DEPTH GUIDELINES: ${sizeInstr}

INFERRED PROPOSAL CONTEXT:
- Industry: ${inference.industryLabel}
- Template: ${inference.templateName}
- Application/Subtype: ${inference.application}
- Package Type: ${inference.packageType}
- Valve/Service Type: ${inference.valveType}
- Standards detected: ${inference.standardsDetected.join(", ")}
- Key risk flags: ${inference.keyRisks.join(", ")}
- Recommended engineering outputs: ${inference.recommendedEngineeringOutputs.join(", ")}
- Inference confidence: ${inference.confidence}
- Detection keywords: ${inference.keywords.join(", ") || "none"}

You have access to past proposal sections from the knowledge vault AND reusable text entries. Use them when relevant, and generate new content where no good vault match exists.

Vault matching priority:
1. Exact keyword matches (highest priority)
2. Same industry matches
3. Same section type matches
4. General matches

For each proposal section, specify:
- title: Section title
- content: Full section content (detailed, professional, at least 3-4 paragraphs per section)
- sourceType: "vault" if content is primarily from vault/text entries, "generated" if AI-written

CRITICAL: You MUST generate ALL sections listed above. Do not skip or combine sections. Each section must be a separate entry in the JSON array. For severe-service control valve proposals, generate the complete severe-service section list.
- sourceId: The vault section ID or text entry ID if sourceType is "vault", null otherwise
- sourceName: The source document filename or text entry title if from vault, null otherwise

Engineering safety requirement:
- Include this exact disclaimer in Proposal-Stage Engineering Intelligence and Preliminary Engineering Calculation Summary sections: "${SEVERE_SERVICE_DISCLAIMER}"
- Use careful terms such as "indicative", "proposal-stage", "requires engineer validation", and "not certified final sizing".
- Do not claim certified design, final sizing, or final engineering calculation.

${sectionInstructions}

Respond in JSON format:
{
  "title": "Proposal title",
  "sections": [
    {
      "title": "Section Title",
      "content": "Detailed content...",
      "sourceType": "vault|generated",
      "sourceId": "id or null",
      "sourceName": "filename or null"
    }
  ],
  "vaultSectionsUsed": 0,
  "vaultDocumentsUsed": 0
}
Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`;

    const userMessage = `RFP Title: ${extractedData?.title ?? "Untitled RFP"}

RFP Summary: ${rfpSummary}

Requirements:
${requirements}

Line Items:
${lineItems}

Compliance Requirements: ${compliance}

Extracted RFP JSON:
${JSON.stringify(extractedData).substring(0, 22000)}

Industry: ${inference.industryLabel}
Application/Subtype: ${inference.application}

---
Knowledge Vault Sections Available:
${vaultContext || "No vault document sections available."}

---
Reusable Text Entries Available:
${textEntriesContext || "No text entries available."}

${!vaultContext && !textEntriesContext ? "No vault content available. Generate all content from scratch." : ""}`;

    // Stream the response
    const llmResponse = await fetch("https://apps.abacus.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage },
        ],
        temperature: 0.4,
        max_tokens: 16000,
        stream: true,
        response_format: { type: "json_object" },
      }),
    });

    if (!llmResponse?.ok) {
      const errorText = await llmResponse?.text().catch(() => "");
      return new Response(JSON.stringify({ error: `LLM API failed: ${llmResponse?.status} ${errorText}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = llmResponse?.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        let buffer = "";
        let partialRead = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            partialRead += decoder.decode(value, { stream: true });
            const lines = partialRead.split("\n");
            partialRead = lines?.pop() ?? "";

            for (const line of lines) {
              if (line?.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  // Parse the buffered JSON and save to DB
                  try {
                    const parsed = JSON.parse(buffer);
                    const proposalTitle = parsed?.title ?? extractedData?.title ?? "Untitled Proposal";
                    const templateName = inference.isSevereServiceValve
                      ? formatSevereServiceTemplateMetadata(inference)
                      : selectedTemplate?.name ?? (templateType || "General");
                    const sections = attachDeterministicEngineeringArtifacts(
                      ensureSevereServiceSections(
                        Array.isArray(parsed?.sections) ? parsed.sections : [],
                        inference,
                        extractedData
                      ),
                      templateName,
                      extractedData
                    );
                    const vaultSectionIds = new Set(sections.filter((s: any) => s?.sourceType === "vault" && s?.sourceId).map((s: any) => s.sourceId));
                    const vaultDocumentNames = new Set(sections.filter((s: any) => s?.sourceType === "vault" && s?.sourceName).map((s: any) => s.sourceName));
                    const matchedVaultSectionsUsed = inference.isSevereServiceValve ? Math.min(relevantVaultSections.length + relevantTextEntries.length, 8) : 0;
                    const matchedVaultDocumentsUsed = inference.isSevereServiceValve ? Math.max(1, new Set(relevantVaultSections.map((s: any) => s?.documentFilename ?? s?.sourceName ?? s?.title).filter(Boolean)).size) : 0;

                    const validSizes = ["startup", "sme", "mid_market", "enterprise", "conglomerate"];
                    const proposal = await prisma.proposal.create({
                      data: {
                        userId,
                        rfpId,
                        templateType: templateName,
                        title: proposalTitle,
                        industry: (inference.isSevereServiceValve ? "Valves" : (["Valves", "Pumps", "EPC", "General"].includes(industry) ? industry : "General")) as any,
                        vaultSectionsUsed: vaultSectionIds.size || parsed?.vaultSectionsUsed || matchedVaultSectionsUsed || 0,
                        vaultDocumentsUsed: vaultDocumentNames.size || parsed?.vaultDocumentsUsed || matchedVaultDocumentsUsed || 0,
                        companySize: validSizes.includes(companySize) ? companySize as any : null,
                      },
                    });

                    for (let i = 0; i < (sections?.length ?? 0); i++) {
                      const sec = sections[i];
                      await prisma.proposalSection.create({
                        data: {
                          proposalId: proposal?.id,
                          sectionTitle: sec?.title ?? "Untitled",
                          content: sec?.content ?? "",
                          sourceType: sec?.sourceType === "vault" ? "vault" : "generated",
                          sourceId: sec?.sourceId ?? null,
                          orderIndex: i,
                        },
                      });
                    }

                    // Auto-create compliance checklist if using an industry template
                    if (selectedTemplate || inference.isSevereServiceValve) {
                      const complianceItems = inference.isSevereServiceValve ? inference.complianceItems : selectedTemplate!.complianceItems;
                      const checklistItems = complianceItems.map((item) => ({
                        id: item.id,
                        label: item.label,
                        standard: item.standard,
                        checked: false,
                      }));
                      await prisma.complianceChecklist.create({
                        data: {
                          proposalId: proposal.id,
                          checklistItems,
                        },
                      });
                    }

                    const fullProposal = await prisma.proposal.findUnique({
                      where: { id: proposal?.id },
                      include: {
                        sections: { orderBy: { orderIndex: "asc" } },
                        complianceChecklist: true,
                      },
                    });

                    const finalData = JSON.stringify({
                      status: "completed",
                      result: {
                        proposal: fullProposal,
                        sourceMappings: sections?.filter((s: any) => s?.sourceType === "vault")?.map((s: any) => ({
                          sectionTitle: s?.title,
                          sourceName: s?.sourceName,
                        })) ?? [],
                      },
                    });
                    controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
                  } catch (parseErr: any) {
                    console.error("Parse/save error:", parseErr);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "error", message: "Failed to save proposal" })}\n\n`));
                  }
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  buffer += parsed?.choices?.[0]?.delta?.content ?? "";
                  const progressData = JSON.stringify({ status: "processing", message: "Generating proposal..." });
                  controller.enqueue(encoder.encode(`data: ${progressData}\n\n`));
                } catch {
                  // Skip invalid JSON
                }
              }
            }
          }

          // If we exit loop without [DONE], try to parse buffer anyway
          if (buffer?.trim()) {
            try {
              const parsed = JSON.parse(buffer);
              const proposalTitle = parsed?.title ?? extractedData?.title ?? "Untitled Proposal";
              const templateName = inference.isSevereServiceValve
                ? formatSevereServiceTemplateMetadata(inference)
                : selectedTemplate?.name ?? (templateType || "General");
              const sections = attachDeterministicEngineeringArtifacts(
                ensureSevereServiceSections(
                  Array.isArray(parsed?.sections) ? parsed.sections : [],
                  inference,
                  extractedData
                ),
                templateName,
                extractedData
              );
              const vaultSectionIds = new Set(sections.filter((s: any) => s?.sourceType === "vault" && s?.sourceId).map((s: any) => s.sourceId));
              const vaultDocumentNames = new Set(sections.filter((s: any) => s?.sourceType === "vault" && s?.sourceName).map((s: any) => s.sourceName));
              const matchedVaultSectionsUsed = inference.isSevereServiceValve ? Math.min(relevantVaultSections.length + relevantTextEntries.length, 8) : 0;
              const matchedVaultDocumentsUsed = inference.isSevereServiceValve ? Math.max(1, new Set(relevantVaultSections.map((s: any) => s?.documentFilename ?? s?.sourceName ?? s?.title).filter(Boolean)).size) : 0;
              const validSizes2 = ["startup", "sme", "mid_market", "enterprise", "conglomerate"];
              const proposal = await prisma.proposal.create({
                data: {
                  userId,
                  rfpId,
                  templateType: templateName,
                  title: proposalTitle,
                  industry: (inference.isSevereServiceValve ? "Valves" : (["Valves", "Pumps", "EPC", "General"].includes(industry) ? industry : "General")) as any,
                  vaultSectionsUsed: vaultSectionIds.size || parsed?.vaultSectionsUsed || matchedVaultSectionsUsed || 0,
                  vaultDocumentsUsed: vaultDocumentNames.size || parsed?.vaultDocumentsUsed || matchedVaultDocumentsUsed || 0,
                  companySize: validSizes2.includes(companySize) ? companySize as any : null,
                },
              });

              for (let i = 0; i < (sections?.length ?? 0); i++) {
                const sec = sections[i];
                await prisma.proposalSection.create({
                  data: {
                    proposalId: proposal?.id,
                    sectionTitle: sec?.title ?? "Untitled",
                    content: sec?.content ?? "",
                    sourceType: sec?.sourceType === "vault" ? "vault" : "generated",
                    sourceId: sec?.sourceId ?? null,
                    orderIndex: i,
                  },
                });
              }

              if (selectedTemplate || inference.isSevereServiceValve) {
                const complianceItems = inference.isSevereServiceValve ? inference.complianceItems : selectedTemplate!.complianceItems;
                const checklistItems = complianceItems.map((item) => ({
                  id: item.id, label: item.label, standard: item.standard, checked: false,
                }));
                await prisma.complianceChecklist.create({ data: { proposalId: proposal.id, checklistItems } });
              }

              const fullProposal = await prisma.proposal.findUnique({
                where: { id: proposal?.id },
                include: { sections: { orderBy: { orderIndex: "asc" } }, complianceChecklist: true },
              });

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "completed", result: { proposal: fullProposal, sourceMappings: [] } })}\n\n`));
            } catch {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "error", message: "Failed to parse AI response" })}\n\n`));
            }
          }
        } catch (err: any) {
          console.error("Stream error:", err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "error", message: err?.message ?? "Stream failed" })}\n\n`));
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
    console.error("Proposal generation error:", error);
    return new Response(JSON.stringify({ error: error?.message ?? "Failed to generate proposal" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
