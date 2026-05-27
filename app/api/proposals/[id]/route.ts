export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const proposal = await prisma.proposal.findUnique({
      where: { id: params?.id, userId: (session?.user as any)?.id },
      include: {
        sections: { orderBy: { orderIndex: "asc" } },
        rfp: true,
        complianceChecklist: true,
      },
    });

    if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    return NextResponse.json(proposal);
  } catch (error: any) {
    console.error("Proposal fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch proposal" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { status, title } = body ?? {};

    const proposal = await prisma.proposal.update({
      where: { id: params?.id, userId: (session?.user as any)?.id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(title !== undefined ? { title } : {}),
      },
      include: { sections: { orderBy: { orderIndex: "asc" } } },
    });

    return NextResponse.json(proposal);
  } catch (error: any) {
    console.error("Proposal update error:", error);
    return NextResponse.json({ error: "Failed to update proposal" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.proposal.delete({ where: { id: params?.id, userId: (session?.user as any)?.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Proposal delete error:", error);
    return NextResponse.json({ error: "Failed to delete proposal" }, { status: 500 });
  }
}
