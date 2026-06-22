export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { createOpenRouterChatCompletion, getOpenRouterModel } from "@/lib/openrouter";

const MAX_TEXT_CHARS = 120000;

const vaultPrompt = `You are an expert document analyzer specializing in industrial proposals, RFPs, and technical documentation for manufacturing and EPC industries.

Analyze this document and extract all distinct sections. For each section, provide:
1. A clear section title
2. The full content of that section
3. A section type (one of: executive_summary, technical_specs, pricing, compliance, delivery_terms, quality_assurance, scope_of_work, company_profile, references, methodology, safety, environmental, warranty, general)
4. Industry tags relevant to the section

Also determine:
- The overall industry (one of: Valves, Pumps, EPC, General)
- 3-5 relevant tags for the entire document

Respond in JSON format:
{
  "industry": "Valves|Pumps|EPC|General",
  "tags": ["tag1", "tag2"],
  "sections": [
    {
      "title": "Section Title",
      "content": "Full section content...",
      "type": "section_type",
      "industryTags": ["tag1"]
    }
  ]
}
Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`;

async function callLLMWithJSON(messages: any[], model: string) {
  const response = await createOpenRouterChatCompletion({
    model,
    messages,
    temperature: 0.3,
    max_tokens: 8000,
    response_format: { type: "json_object" },
  });

  if (!response?.ok) {
    const errorText = await response?.text().catch(() => "");
    throw new Error(`LLM API failed (${model}): ${response?.status} ${errorText}`);
  }
  return response;
}

async function extractTextFromPDF(base64: string, fileName: string): Promise<string> {
  const response = await createOpenRouterChatCompletion({
    messages: [
      {
        role: "user",
        content: [
          { type: "file", file: { filename: fileName, file_data: `data:application/pdf;base64,${base64}` } },
          { type: "text", text: "Extract ALL text content from this PDF document. Return the complete text content preserving structure with headings and sections. Do not summarize - include everything." },
        ],
      },
    ],
    temperature: 0,
    max_tokens: 16000,
  });

  if (!response?.ok) {
    throw new Error("Text extraction failed");
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

async function processLLMResponse(response: Response, documentId: string) {
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content ?? "";

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Failed to parse AI response as JSON");
  }

  const industry = ["Valves", "Pumps", "EPC", "General"].includes(parsed?.industry) ? parsed.industry : "General";
  const tags = Array.isArray(parsed?.tags) ? parsed.tags?.map((t: any) => String(t ?? "")) : [];
  const sections = Array.isArray(parsed?.sections) ? parsed.sections : [];

  for (const sec of sections) {
    await prisma.vaultSection.create({
      data: {
        documentId,
        sectionTitle: sec?.title ?? "Untitled",
        content: sec?.content ?? "",
        sectionType: sec?.type ?? "general",
        industryTags: Array.isArray(sec?.industryTags) ? sec.industryTags : [],
      },
    });
  }

  const updatedDoc = await prisma.vaultDocument.update({
    where: { id: documentId },
    data: {
      industry: industry as any,
      tags,
      extractedSectionsCount: sections?.length ?? 0,
    },
    include: { sections: true },
  });

  return NextResponse.json(updatedDoc);
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any)?.id;

    const formData = await request.formData();
    const file = formData?.get("file") as File | null;
    const documentId = formData?.get("documentId") as string | null;
    if (!file || !documentId) {
      return NextResponse.json({ error: "file and documentId are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });
    const document = await prisma.vaultDocument.findFirst({
      where: {
        id: documentId,
        OR: [
          { userId },
          ...(user?.organizationId ? [{ user: { organizationId: user.organizationId } }] : []),
        ],
      },
      select: { id: true },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
    }

    const fileName = file?.name ?? "document";
    const fileType = fileName?.split(".")?.pop()?.toLowerCase() ?? "";
    const model = getOpenRouterModel();

    if (fileType === "pdf") {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      // Try sending full PDF to large-context model first
      try {
        console.log(`[Vault Process] Attempting full PDF analysis with OpenRouter model ${model}...`);
        const messages = [
          {
            role: "user",
            content: [
              { type: "file", file: { filename: fileName, file_data: `data:application/pdf;base64,${base64}` } },
              { type: "text", text: vaultPrompt },
            ],
          },
        ];
        const response = await callLLMWithJSON(messages, model);
        return await processLLMResponse(response, documentId);
      } catch (err: any) {
        // Fallback: extract text first, then analyze
        console.log(`[Vault Process] Full PDF failed, falling back to text extraction...`);
        const extractedText = await extractTextFromPDF(base64, fileName);
        const truncated = extractedText?.substring(0, MAX_TEXT_CHARS) ?? "";
        const messages = [{ role: "user", content: `${vaultPrompt}\n\nHere is the content from the document:\n\n${truncated}` }];
        const response = await callLLMWithJSON(messages, model);
        return await processLLMResponse(response, documentId);
      }
    }

    // Handle DOCX and TXT files
    let fileContent = "";
    if (fileType === "docx") {
      const mammoth = require("mammoth");
      const buffer = Buffer.from(await file.arrayBuffer());
      let result: any;
      try {
        result = await mammoth.extractRawText({ buffer });
      } catch {
        const ab = await file.arrayBuffer();
        result = await mammoth.extractRawText({ arrayBuffer: ab });
      }
      fileContent = result?.value ?? "";
    } else {
      fileContent = await file.text();
    }

    if (!fileContent?.trim()) {
      return NextResponse.json({ error: "Could not extract text from file" }, { status: 400 });
    }

    const truncated = fileContent?.substring(0, MAX_TEXT_CHARS) ?? "";
    const messages = [{ role: "user", content: `${vaultPrompt}\n\nHere is the content from the file:\n\n${truncated}` }];
    const response = await callLLMWithJSON(messages, model);
    return await processLLMResponse(response, documentId);
  } catch (error: any) {
    console.error("Vault process error:", error);
    return NextResponse.json({ error: `Processing failed: ${error?.message ?? "Unknown error"}` }, { status: 500 });
  }
}
