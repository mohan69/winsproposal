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
    const id = params?.id;

    const existing = await prisma.vaultTextEntry.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();
    const { title, content, tags, industry } = body ?? {};

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags.filter(Boolean) : [];
    if (industry !== undefined && ["Valves", "Pumps", "EPC", "General"].includes(industry)) updateData.industry = industry;

    const updated = await prisma.vaultTextEntry.update({ where: { id }, data: updateData });
    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("Vault text entry update error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any)?.id;
    const id = params?.id;

    const existing = await prisma.vaultTextEntry.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.vaultTextEntry.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (err: any) {
    console.error("Vault text entry delete error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
