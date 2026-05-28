export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { generateVisualization } from "@/lib/visualization-service";

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

    const visualization = await generateVisualization({
      title: proposal.title,
      sectionTitle: diagramTitle,
      industry: proposal.industry,
      templateType: proposal.templateType,
      content: contextText,
    }, diagramType);

    return NextResponse.json({
      mermaidCode: visualization.mermaidCode,
      title: visualization.title,
      visualizationType: visualization.type,
      imageUrl: visualization.imageUrl,
    });
  } catch (error: any) {
    console.error("Diagram generation error:", error);
    return NextResponse.json({ error: "Failed to generate diagram" }, { status: 500 });
  }
}
