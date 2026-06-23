export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any)?.id;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const documentType = searchParams.get("documentType") ?? "";

    const where: any = { userId };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: [search] } },
      ];
    }
    if (documentType) {
      where.documentType = documentType;
    }

    const entries = await prisma.vaultTextEntry.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(entries);
  } catch (err: any) {
    console.error("Vault text entries GET error:", err);
    return NextResponse.json({ error: "Failed to fetch text entries" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any)?.id;

    const body = await request.json();
    const { title, content, documentType, tags, industry } = body ?? {};
    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const entry = await prisma.vaultTextEntry.create({
      data: {
        userId,
        title: title.trim(),
        content: content.trim(),
        documentType: documentType ?? null,
        tags: Array.isArray(tags) ? tags.filter(Boolean) : [],
        industry: ["Valves", "Pumps", "EPC", "General"].includes(industry) ? industry : "General",
      },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (err: any) {
    console.error("Vault text entry create error:", err);
    return NextResponse.json({ error: "Failed to create text entry" }, { status: 500 });
  }
}
