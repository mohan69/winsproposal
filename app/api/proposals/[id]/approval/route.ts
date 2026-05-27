export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session?.user as any)?.id;
    const role = (session?.user as any)?.role;

    const body = await request.json();
    const { action, reason } = body ?? {};

    const proposal = await prisma.proposal.findUnique({ where: { id: params?.id } });
    if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });

    if (action === "submit") {
      // Any user can submit their own proposal for approval
      if (proposal.userId !== userId) {
        return NextResponse.json({ error: "You can only submit your own proposals" }, { status: 403 });
      }
      if (proposal.approvalStatus !== "none" && proposal.approvalStatus !== "rejected") {
        return NextResponse.json({ error: "Proposal is already submitted or approved" }, { status: 400 });
      }
      const updated = await prisma.proposal.update({
        where: { id: params.id },
        data: { approvalStatus: "pending_approval" },
        include: { sections: { orderBy: { orderIndex: "asc" } } },
      });
      return NextResponse.json(updated);
    }

    if (action === "approve" || action === "reject") {
      if (role !== "admin") {
        return NextResponse.json({ error: "Only admins can approve or reject proposals" }, { status: 403 });
      }
      if (proposal.approvalStatus !== "pending_approval") {
        return NextResponse.json({ error: "Proposal is not pending approval" }, { status: 400 });
      }
      const updated = await prisma.proposal.update({
        where: { id: params.id },
        data: {
          approvalStatus: action === "approve" ? "approved" : "rejected",
          approvedById: action === "approve" ? userId : null,
          approvedAt: action === "approve" ? new Date() : null,
          rejectionReason: action === "reject" ? (reason || "No reason provided") : null,
          status: action === "approve" ? "Final" : "Draft",
        },
        include: { sections: { orderBy: { orderIndex: "asc" } } },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Approval error:", error);
    return NextResponse.json({ error: "Failed to process approval" }, { status: 500 });
  }
}
