export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { deleteFile } from "@/lib/storage";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { tags, industry, status, errorReason, documentType } = body ?? {};
    const doc = await prisma.vaultDocument.update({
      where: { id: params?.id, userId: (session?.user as any)?.id },
      data: {
        ...(tags !== undefined ? { tags } : {}),
        ...(industry !== undefined ? { industry } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(errorReason !== undefined ? { errorReason } : {}),
        ...(documentType !== undefined ? { documentType } : {}),
      },
      include: { sections: true },
    });
    return NextResponse.json(doc);
  } catch (error: any) {
    console.error("Vault update error:", error);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const doc = await prisma.vaultDocument.findUnique({
      where: { id: params?.id, userId: (session?.user as any)?.id },
    });
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    if (doc?.cloudStoragePath) {
      try { await deleteFile(doc.cloudStoragePath); } catch {}
    }

    await prisma.vaultDocument.delete({ where: { id: params?.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Vault delete error:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
