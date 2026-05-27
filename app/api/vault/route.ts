export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request?.url ?? "");
    const search = searchParams?.get("search") ?? "";
    const userId = (session?.user as any)?.id;

    const where: any = { userId };
    if (search) {
      where.OR = [
        { filename: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: [search] } },
        { sections: { some: { content: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const documents = await prisma.vaultDocument.findMany({
      where,
      include: { sections: true },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json(documents ?? []);
  } catch (error: any) {
    console.error("Vault fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { filename, fileType, cloudStoragePath, isPublic, documentType } = body ?? {};
    if (!filename || !fileType) {
      return NextResponse.json({ error: "filename and fileType are required" }, { status: 400 });
    }

    const userId = (session?.user as any)?.id;
    const document = await prisma.vaultDocument.create({
      data: {
        userId,
        filename,
        fileType,
        cloudStoragePath: cloudStoragePath ?? null,
        isPublic: isPublic ?? false,
        documentType: documentType ?? null,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error: any) {
    console.error("Vault create error:", error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}
