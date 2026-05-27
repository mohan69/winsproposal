export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session?.user as any)?.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.organizationId) {
      return NextResponse.json({ members: [], invites: [] });
    }

    const members = await prisma.user.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const invites = await prisma.teamInvite.findMany({
      where: { organizationId: user.organizationId, status: "pending" },
      select: { id: true, email: true, role: true, createdAt: true, expiresAt: true, status: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ members, invites });
  } catch (error: any) {
    console.error("Team fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}
