export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

const LARGE_MODEL = "gemini-2.5-pro";
const SMALL_MODEL = "gpt-4o";
const MAX_TEXT_CHARS = 120000;

const systemPrompt = `You are an expert RFP analyst. Extract all requirements, line items, compliance needs, and evaluation criteria from this RFP/MR document.

Respond in JSON format:
{
  "title": "Brief title for this RFP",
  "industry": "Valves|Pumps|EPC|General",
  "requirements": [{"id": "R1", "description": "...", "category": "technical|commercial|compliance|general"}],
  "lineItems": [{"item": "...", "description": "...", "quantity": "...", "specifications": "..."}],
  "complianceRequirements": ["requirement 1", "requirement 2"],
  "evaluationCriteria": ["criteria 1", "criteria 2"],
  "summary": "Brief summary of the RFP"
}
Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`;

async function callLLM(messages: any[], model: string) {
  const response = await fetch("https://apps.abacus.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 8000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response?.ok) {
    const errorText = await response?.text().catch(() => "");
    throw new Error(`LLM API failed (${model}): ${response?.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content ?? "";
  try {
    return JSON.parse(content);
  } catch {
    throw new Error("Failed to parse AI response as JSON");
  }
}

async function extractTextFromPDF(base64: string, fileName: string): Promise<string> {
  const response = await fetch("https://apps.abacus.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: LARGE_MODEL,
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
    }),
  });

  if (!response?.ok) {
    throw new Error("Text extraction failed");
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any)?.id;

    const formData = await request.formData();
    const file = formData?.get("file") as File | null;
    const rfpId = formData?.get("rfpId") as string | null;
    if (!file || !rfpId) return NextResponse.json({ error: "file and rfpId required" }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });
    const rfp = await prisma.rfpUpload.findFirst({
      where: {
        id: rfpId,
        OR: [
          { userId },
          ...(user?.organizationId ? [{ user: { organizationId: user.organizationId } }] : []),
        ],
      },
      select: { id: true },
    });

    if (!rfp) {
      return NextResponse.json({ error: "RFP not found or access denied" }, { status: 404 });
    }

    const fileName = file?.name ?? "document";
    const fileType = fileName?.split(".")?.pop()?.toLowerCase() ?? "";
    let parsed: any;

    if (fileType === "pdf") {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      // Try sending full PDF to large-context model first
      try {
        console.log(`[RFP Parse] Attempting full PDF analysis with ${LARGE_MODEL}...`);
        const messages = [
          {
            role: "user",
            content: [
              { type: "file", file: { filename: fileName, file_data: `data:application/pdf;base64,${base64}` } },
              { type: "text", text: systemPrompt },
            ],
          },
        ];
        parsed = await callLLM(messages, LARGE_MODEL);
      } catch (err: any) {
        // Fallback: extract text first, then analyze in chunks
        console.log(`[RFP Parse] Full PDF failed, falling back to text extraction + chunked analysis...`);
        const extractedText = await extractTextFromPDF(base64, fileName);
        const truncated = extractedText?.substring(0, MAX_TEXT_CHARS) ?? "";
        const messages = [{ role: "user", content: `${systemPrompt}\n\nHere is the content from the RFP document:\n\n${truncated}` }];
        parsed = await callLLM(messages, SMALL_MODEL);
      }
    } else {
      let textContent = "";
      if (fileType === "docx") {
        const mammoth = require("mammoth");
        const buffer = Buffer.from(await file.arrayBuffer());
        let result: any;
        try { result = await mammoth.extractRawText({ buffer }); } catch { result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() }); }
        textContent = result?.value ?? "";
      } else {
        textContent = await file.text();
      }
      const truncated = textContent?.substring(0, MAX_TEXT_CHARS) ?? "";
      const messages = [{ role: "user", content: `${systemPrompt}\n\nHere is the content from the file:\n\n${truncated}` }];
      parsed = await callLLM(messages, SMALL_MODEL);
    }

    await prisma.rfpUpload.update({
      where: { id: rfpId },
      data: { extractedData: parsed },
    });

    return NextResponse.json({ rfpId, extractedData: parsed });
  } catch (error: any) {
    console.error("RFP parse error:", error);
    return NextResponse.json({ error: `RFP parsing failed: ${error?.message ?? "Unknown error"}` }, { status: 500 });
  }
}
