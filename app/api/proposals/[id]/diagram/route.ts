export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any)?.id;
    const proposal = await prisma.proposal.findUnique({
      where: { id: params?.id, userId },
      include: { sections: { orderBy: { orderIndex: "asc" } } },
    });
    if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });

    const body = await request.json();
    const { sectionId, diagramType } = body ?? {};

    // Find specific section or use all
    let contextText = "";
    let diagramTitle = "";
    if (sectionId) {
      const section = proposal.sections.find((s) => s.id === sectionId);
      if (!section) return NextResponse.json({ error: "Section not found" }, { status: 404 });
      contextText = `Section: ${section.sectionTitle}\n${section.content}`;
      diagramTitle = section.sectionTitle;
    } else {
      contextText = proposal.sections.map((s) => `## ${s.sectionTitle}\n${s.content}`).join("\n\n");
      diagramTitle = proposal.title;
    }

    const diagramTypeMap: Record<string, string> = {
      flowchart: "a flowchart (graph TD) showing the process flow, decision points, and key steps",
      sequence: "a sequence diagram showing interactions between stakeholders, systems, or departments",
      gantt: "a Gantt chart showing the project timeline, milestones, and phases",
      pfd: "a process flow diagram (graph LR) showing the manufacturing/engineering process flow with equipment, inputs, outputs, and connections",
    };
    const diagramDesc = diagramTypeMap[diagramType] || diagramTypeMap.flowchart;

    const systemPrompt = `You are an expert technical diagram creator for manufacturing and EPC proposals. Generate valid Mermaid.js diagram code.

Rules:
- Output ONLY the raw Mermaid diagram code, nothing else
- No markdown code fences, no explanation text
- Use clear, readable labels (not too long)
- For flowcharts use graph TD (top-down) or graph LR (left-right)
- Keep node IDs simple (A, B, C or descriptive like input1, process1)
- Use proper Mermaid syntax — test mentally before outputting
- Maximum 15-20 nodes for readability
- Use subgraphs to group related items when appropriate
- For manufacturing/EPC: use appropriate terminology (P&ID, BOM, QA/QC, etc.)
- CRITICAL: NEVER use parentheses () inside node labels/text. Mermaid treats () as shape syntax and it will cause parse errors. Use square brackets for all node shapes: A["Label text"]. Replace abbreviations like "Non-Destructive Testing (NDT)" with "Non-Destructive Testing - NDT" or just "NDT".
- Always quote node labels with double quotes inside brackets: A["My Label"] not A[My Label]
- NEVER use round brackets () for node shapes. Use ["text"] for rectangles, {"text"} for rhombus/diamond, or (["text"]) for stadium shapes ONLY if needed.`;

    const userPrompt = `Based on this proposal content, generate ${diagramDesc}.

Title: ${diagramTitle}
Industry: ${proposal.industry}

Content:
${contextText.substring(0, 3000)}

Generate the Mermaid diagram code now:`;

    const llmResponse = await fetch("https://apps.abacus.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!llmResponse.ok) {
      return NextResponse.json({ error: "Failed to generate diagram" }, { status: 500 });
    }

    const data = await llmResponse.json();
    let mermaidCode = data?.choices?.[0]?.message?.content ?? "";

    // Clean up: remove markdown fences if present
    mermaidCode = mermaidCode.replace(/```mermaid\n?/gi, "").replace(/```\n?/g, "").trim();

    // Sanitize: replace parentheses inside node labels to prevent Mermaid parse errors
    // Mermaid interprets () as shape syntax, so we replace them with dashes or remove them
    mermaidCode = sanitizeMermaidCode(mermaidCode);

    return NextResponse.json({ mermaidCode, title: diagramTitle });
  } catch (error: any) {
    console.error("Diagram generation error:", error);
    return NextResponse.json({ error: "Failed to generate diagram" }, { status: 500 });
  }
}

/**
 * Sanitize Mermaid code to fix common LLM-generated syntax issues.
 * Primarily fixes parentheses inside node labels which Mermaid misinterprets as shape syntax.
 */
function sanitizeMermaidCode(code: string): string {
  // Process line by line
  return code
    .split("\n")
    .map((line) => {
      // Skip lines that are just graph/subgraph declarations, arrows, or styling
      if (/^\s*(graph|subgraph|end|style|classDef|class |linkStyle|%%)/i.test(line)) {
        return line;
      }

      // Fix node definitions: replace parentheses inside bracket-delimited labels
      // Matches patterns like A["text (abbrev) more"] or A[text (abbrev) more]
      // We need to find content inside [...], {"..."}, etc. and replace () within
      return line.replace(
        /(\[\"?)(.*?)(\"?\])/g,
        (_match, open, content, close) => {
          // Replace parentheses with dashes inside the label content
          const sanitized = content.replace(/\(/g, " - ").replace(/\)/g, "").replace(/\s+-\s+\s*/g, " - ");
          // Ensure labels are quoted to avoid further issues
          const trimOpen = open.endsWith('"') ? open : open + '"';
          const trimClose = close.startsWith('"') ? close : '"' + close;
          return `${trimOpen}${sanitized}${trimClose}`;
        }
      );
    })
    .join("\n");
}
