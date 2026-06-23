export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { createOpenRouterChatCompletion, getOpenRouterModel } from "@/lib/openrouter";

const MAX_TEXT_CHARS = 120000;

const SUPPORTED_MIME_TYPES: Record<string, string[]> = {
  pdf: ["application/pdf"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  txt: ["text/plain"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  svg: ["image/svg+xml"],
  webp: ["image/webp"],
};

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "svg", "webp"];

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

async function updateDocStatus(documentId: string, status: string, errorReason?: string) {
  const data: any = { status };
  if (errorReason !== undefined) data.errorReason = errorReason;
  await prisma.vaultDocument.update({ where: { id: documentId }, data });
}

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

  if (!content?.trim()) {
    await updateDocStatus(documentId, "parse_failed", "LLM returned empty response - document may be scanned/image-only PDF");
    return NextResponse.json({ error: "AI returned empty response - document may be a scanned PDF without extractable text" }, { status: 400 });
  }

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    await updateDocStatus(documentId, "parse_failed", "Failed to parse AI response as JSON");
    return NextResponse.json({ error: "Failed to parse AI response as JSON" }, { status: 500 });
  }

  const industry = ["Valves", "Pumps", "EPC", "General"].includes(parsed?.industry) ? parsed.industry : "General";
  const tags = Array.isArray(parsed?.tags) ? parsed.tags?.map((t: any) => String(t ?? "")) : [];
  const sections = Array.isArray(parsed?.sections) ? parsed.sections : [];

  if (sections.length === 0) {
    await updateDocStatus(documentId, "parse_failed", "AI analysis produced no sections");
    return NextResponse.json({ error: "No sections could be extracted from this document" }, { status: 400 });
  }

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
      status: "parsed",
      errorReason: null,
    },
    include: { sections: true },
  });

  return NextResponse.json(updatedDoc);
}

export async function POST(request: Request) {
  let documentId: string | null = null;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any)?.id;

    const formData = await request.formData();
    const file = formData?.get("file") as File | null;
    documentId = formData?.get("documentId") as string | null;
    if (!file || !documentId) {
      return NextResponse.json({ error: "file and documentId are required" }, { status: 400 });
    }

    const fileName = file?.name ?? "document";
    const fileType = fileName?.split(".")?.pop()?.toLowerCase() ?? "";
    const fileMime = file?.type ?? "";
    const fileSize = file?.size ?? 0;
    const model = getOpenRouterModel();

    console.log(`[Vault Process] Starting parse:`, JSON.stringify({
      fileName,
      fileType,
      fileMime,
      fileSize,
      documentId,
      model,
      userId,
      timestamp: new Date().toISOString(),
    }));

    // Validate extension
    const allSupported = ["pdf", "docx", "txt", ...IMAGE_EXTENSIONS];
    if (!allSupported.includes(fileType)) {
      const msg = `Unsupported file type: .${fileType}. Excel/CSV parsing is not yet supported. Supported: PDF, DOCX, TXT, JPG, PNG, SVG, WebP`;
      console.error(`[Vault Process] ${msg}`, { fileName, fileType });
      await updateDocStatus(documentId, "parse_failed", msg);
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Validate MIME type (if provided)
    const expectedMimes = SUPPORTED_MIME_TYPES[fileType];
    if (fileMime && expectedMimes && !expectedMimes.includes(fileMime)) {
      const msg = `MIME type mismatch for .${fileType}: expected ${expectedMimes.join(", ")}, got "${fileMime}"`;
      console.warn(`[Vault Process] ${msg}`, { fileName, fileMime, fileType });
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
      select: { id: true, cloudStoragePath: true },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
    }

    // Mark as parsing
    await updateDocStatus(documentId, "parsing");

    console.log(`[Vault Process] Storage path:`, document?.cloudStoragePath ?? "none");

    if (IMAGE_EXTENSIONS.includes(fileType)) {
      // Images are not AI-processed; mark as parsed (no sections)
      await updateDocStatus(documentId, "parsed");
      console.log(`[Vault Process] Image file, skipping AI analysis`, { fileName });
      return NextResponse.json({ extractedSectionsCount: 0, message: "Image uploaded. No text extraction needed." });
    }

    if (fileType === "pdf") {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      // Try sending full PDF to large-context model first
      try {
        console.log(`[Vault Process] Attempting full PDF analysis with OpenRouter model ${model}...`, { fileName, fileSize });
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
        console.log(`[Vault Process] Full PDF analysis failed, trying text extraction fallback...`, {
          fileName,
          error: err?.message ?? "Unknown error",
          stack: err?.stack?.substring(0, 500),
        });
        try {
          const extractedText = await extractTextFromPDF(base64, fileName);
          if (!extractedText?.trim()) {
            const msg = "Scanned PDF or image-only PDF - no extractable text found. OCR is not currently supported.";
            console.warn(`[Vault Process] ${msg}`, { fileName });
            await updateDocStatus(documentId, "parse_failed", msg);
            return NextResponse.json({
              error: msg,
              detail: "This appears to be a scanned document. Try uploading a text-based PDF or use the Text Entries tab to add knowledge manually.",
            }, { status: 400 });
          }
          const truncated = extractedText?.substring(0, MAX_TEXT_CHARS) ?? "";
          console.log(`[Vault Process] Text extraction succeeded: ${extractedText.length} chars (truncated to ${truncated.length})`, { fileName });
          const messages = [{ role: "user", content: `${vaultPrompt}\n\nHere is the content from the document:\n\n${truncated}` }];
          const response = await callLLMWithJSON(messages, model);
          return await processLLMResponse(response, documentId);
        } catch (fallbackErr: any) {
          const msg = `Text extraction failed: ${fallbackErr?.message ?? "Unknown error"}`;
          console.error(`[Vault Process] ${msg}`, { fileName, stack: fallbackErr?.stack?.substring(0, 500) });
          await updateDocStatus(documentId, "parse_failed", msg);
          return NextResponse.json({ error: msg }, { status: 500 });
        }
      }
    }

    // Handle DOCX and TXT files
    let fileContent = "";
    if (fileType === "docx") {
      let mammoth: any;
      try {
        mammoth = require("mammoth");
      } catch {
        const msg = "DOCX parser (mammoth) not available";
        console.error(`[Vault Process] ${msg}`);
        await updateDocStatus(documentId, "parse_failed", msg);
        return NextResponse.json({ error: msg }, { status: 500 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      let result: any;
      try {
        result = await mammoth.extractRawText({ buffer });
      } catch (innerErr: any) {
        try {
          const ab = await file.arrayBuffer();
          result = await mammoth.extractRawText({ arrayBuffer: ab });
        } catch (fallbackErr: any) {
          const msg = `DOCX text extraction failed: ${fallbackErr?.message ?? "Unknown error"}`;
          console.error(`[Vault Process] ${msg}`, { fileName, stack: fallbackErr?.stack?.substring(0, 500) });
          await updateDocStatus(documentId, "parse_failed", msg);
          return NextResponse.json({ error: msg }, { status: 500 });
        }
      }
      fileContent = result?.value ?? "";
      console.log(`[Vault Process] DOCX extracted: ${fileContent.length} chars`, { fileName });
    } else {
      fileContent = await file.text();
      console.log(`[Vault Process] TXT read: ${fileContent.length} chars`, { fileName });
    }

    if (!fileContent?.trim()) {
      const msg = "Could not extract text from file - file may be empty or contain only non-text content";
      console.error(`[Vault Process] ${msg}`, { fileName });
      await updateDocStatus(documentId, "parse_failed", msg);
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const truncated = fileContent?.substring(0, MAX_TEXT_CHARS) ?? "";
    console.log(`[Vault Process] Sending to LLM for analysis (${truncated.length} chars)`, { fileName });
    const messages = [{ role: "user", content: `${vaultPrompt}\n\nHere is the content from the file:\n\n${truncated}` }];
    const response = await callLLMWithJSON(messages, model);
    return await processLLMResponse(response, documentId);

  } catch (error: any) {
    const msg = `Processing failed: ${error?.message ?? "Unknown error"}`;
    console.error("[Vault Process] Unhandled error:", {
      message: error?.message,
      stack: error?.stack?.substring(0, 500),
    });
    if (documentId) {
      try { await updateDocStatus(documentId, "parse_failed", msg); } catch (innerErr: any) { console.error("[Vault Process] Failed to update doc status:", innerErr?.message); }
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
