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
        { title: { contains: search, mode: "insensitive" } },
        { sections: { some: { content: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const proposals = await prisma.proposal.findMany({
      where,
      include: { sections: { orderBy: { orderIndex: "asc" } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(proposals ?? []);
  } catch (error: any) {
    console.error("Proposals fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch proposals" }, { status: 500 });
  }
}
