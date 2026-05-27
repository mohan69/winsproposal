export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any)?.id;

    const body = await request.json();
    const { sectionId, content, sectionTitle } = body ?? {};
    if (!sectionId) return NextResponse.json({ error: "sectionId is required" }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });
    const sectionAccess = await prisma.proposalSection.findFirst({
      where: {
        id: sectionId,
        proposalId: params.id,
        proposal: {
          OR: [
            { userId },
            ...(user?.organizationId ? [{ user: { organizationId: user.organizationId } }] : []),
          ],
        },
      },
      select: { id: true },
    });

    if (!sectionAccess) {
      return NextResponse.json({ error: "Section not found or access denied" }, { status: 404 });
    }

    const section = await prisma.proposalSection.update({
      where: { id: sectionId },
      data: {
        ...(content !== undefined ? { content } : {}),
        ...(sectionTitle !== undefined ? { sectionTitle } : {}),
      },
    });

    return NextResponse.json(section);
  } catch (error: any) {
    console.error("Section update error:", error);
    return NextResponse.json({ error: "Failed to update section" }, { status: 500 });
  }
}
