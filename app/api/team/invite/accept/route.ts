export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Please log in first" }, { status: 401 });
    const userId = (session?.user as any)?.id;

    const body = await request.json();
    const { token } = body ?? {};
    if (!token) return NextResponse.json({ error: "Token is required" }, { status: 400 });

    const invite = await prisma.teamInvite.findUnique({ where: { token }, include: { organization: true } });
    if (!invite) return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
    if (invite.status !== "pending") return NextResponse.json({ error: "This invite has already been used" }, { status: 400 });
    if (new Date() > invite.expiresAt) {
      await prisma.teamInvite.update({ where: { id: invite.id }, data: { status: "expired" } });
      return NextResponse.json({ error: "This invite has expired" }, { status: 400 });
    }

    // Check if user email matches invite
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.email?.toLowerCase() !== invite.email?.toLowerCase()) {
      return NextResponse.json({ error: `This invite was sent to ${invite.email}. Please log in with that email.` }, { status: 403 });
    }

    if (user?.organizationId) {
      return NextResponse.json({ error: "You already belong to an organization" }, { status: 400 });
    }

    // Accept invite
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { organizationId: invite.organizationId, role: invite.role },
      }),
      prisma.teamInvite.update({
        where: { id: invite.id },
        data: { status: "accepted" },
      }),
    ]);

    return NextResponse.json({
      message: "Successfully joined the organization!",
      organizationName: invite.organization?.name,
    });
  } catch (error: any) {
    console.error("Invite accept error:", error);
    return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 });
  }
}
