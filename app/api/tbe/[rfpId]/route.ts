export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET existing TBE responses for an RFP
export async function GET(request: Request, { params }: { params: { rfpId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any)?.id;

    // Verify RFP belongs to user
    const rfp = await prisma.rfpUpload.findFirst({ where: { id: params.rfpId, userId } });
    if (!rfp) return NextResponse.json({ error: "RFP not found" }, { status: 404 });

    const responses = await prisma.tbeResponse.findMany({
      where: { rfpId: params.rfpId },
      orderBy: [{ lineItemIndex: "asc" }, { tag: "asc" }],
    });

    return NextResponse.json({ rfp, responses });
  } catch (err: any) {
    console.error("TBE GET error:", err);
    return NextResponse.json({ error: "Failed to fetch TBE responses" }, { status: 500 });
  }
}

// UPDATE a single TBE response cell
export async function PUT(request: Request, { params }: { params: { rfpId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any)?.id;

    const rfp = await prisma.rfpUpload.findFirst({ where: { id: params.rfpId, userId } });
    if (!rfp) return NextResponse.json({ error: "RFP not found" }, { status: 404 });

    const body = await request.json();
    const { id, responseText } = body ?? {};
    if (!id || responseText === undefined) {
      return NextResponse.json({ error: "id and responseText required" }, { status: 400 });
    }

    const updated = await prisma.tbeResponse.update({
      where: { id },
      data: { responseText },
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("TBE PUT error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
