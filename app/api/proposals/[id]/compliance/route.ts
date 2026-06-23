export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session?.user as any)?.id;
    console.log(`[Compliance GET] userId=${userId} proposalId=${params?.id}`);

    const checklist = await prisma.complianceChecklist.findUnique({
      where: { proposalId: params?.id },
    });
    return NextResponse.json(checklist);
  } catch (err: any) {
    console.error("[Compliance GET] Error:", err?.message, err?.stack);
    return NextResponse.json({ error: "Failed to fetch compliance checklist" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { checklistItems } = body ?? {};
    if (!checklistItems) return NextResponse.json({ error: "checklistItems required" }, { status: 400 });

    // Verify proposal belongs to user
    const userId = (session.user as any)?.id;
    const proposal = await prisma.proposal.findUnique({
      where: { id: params?.id, userId },
      select: { id: true },
    });
    if (!proposal) return NextResponse.json({ error: "Proposal not found or access denied" }, { status: 404 });

    const checklist = await prisma.complianceChecklist.upsert({
      where: { proposalId: params?.id },
      update: { checklistItems },
      create: {
        proposalId: params?.id,
        checklistItems,
      },
    });
    console.log("Compliance saved for proposal:", params?.id, "items:", (checklistItems as any[])?.length);
    return NextResponse.json(checklist);
  } catch (err: any) {
    console.error("Compliance PUT error:", err?.message, err?.stack);
    return NextResponse.json({ error: err?.message ?? "Failed to save" }, { status: 500 });
  }
}
