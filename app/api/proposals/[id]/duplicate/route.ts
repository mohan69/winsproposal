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

    // Fetch the original proposal with all related data
    const original = await prisma.proposal.findUnique({
      where: { id: params?.id, userId },
      include: {
        sections: { orderBy: { orderIndex: "asc" } },
        complianceChecklist: true,
      },
    });

    if (!original) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Create duplicated proposal
    const duplicated = await prisma.proposal.create({
      data: {
        userId,
        rfpId: original.rfpId,
        templateType: original.templateType,
        title: `${original.title} (Copy)`,
        status: "Draft",
        industry: original.industry,
        vaultSectionsUsed: original.vaultSectionsUsed,
        vaultDocumentsUsed: original.vaultDocumentsUsed,
        sections: {
          create: original.sections.map((s) => ({
            sectionTitle: s.sectionTitle,
            content: s.content,
            sourceType: s.sourceType,
            sourceId: s.sourceId,
            orderIndex: s.orderIndex,
          })),
        },
        ...(original.complianceChecklist
          ? {
              complianceChecklist: {
                create: {
                  checklistItems: original.complianceChecklist.checklistItems as any,
                },
              },
            }
          : {}),
      },
      include: {
        sections: { orderBy: { orderIndex: "asc" } },
        complianceChecklist: true,
      },
    });

    return NextResponse.json(duplicated);
  } catch (error: any) {
    console.error("Proposal duplicate error:", error);
    return NextResponse.json({ error: "Failed to duplicate proposal" }, { status: 500 });
  }
}
