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
    const { sectionId, sectionTitle, content } = body ?? {};
    if (!sectionId) return NextResponse.json({ error: "sectionId is required" }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });
    const sectionAccess = await prisma.vaultSection.findFirst({
      where: {
        id: sectionId,
        documentId: params.id,
        document: {
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

    const section = await prisma.vaultSection.update({
      where: { id: sectionId },
      data: {
        ...(sectionTitle !== undefined ? { sectionTitle } : {}),
        ...(content !== undefined ? { content } : {}),
      },
    });
    return NextResponse.json(section);
  } catch (error: any) {
    console.error("Section update error:", error);
    return NextResponse.json({ error: "Failed to update section" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any)?.id;

    const { searchParams } = new URL(request?.url ?? "");
    const sectionId = searchParams?.get("sectionId");
    if (!sectionId) return NextResponse.json({ error: "sectionId required" }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });
    const sectionAccess = await prisma.vaultSection.findFirst({
      where: {
        id: sectionId,
        documentId: params.id,
        document: {
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

    await prisma.vaultSection.delete({ where: { id: sectionId } });

    const count = await prisma.vaultSection.count({ where: { documentId: params?.id } });
    await prisma.vaultDocument.update({
      where: { id: params?.id },
      data: { extractedSectionsCount: count },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Section delete error:", error);
    return NextResponse.json({ error: "Failed to delete section" }, { status: 500 });
  }
}
