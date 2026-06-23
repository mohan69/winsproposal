export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session?.user as any)?.id;
    const userEmail = (session?.user as any)?.email;
    console.log(`[RFP GET] userId=${userId} email=${userEmail}`);
    const rfps = await prisma.rfpUpload.findMany({
      where: { userId },
      orderBy: { uploadedAt: "desc" },
    });
    return NextResponse.json(rfps ?? []);
  } catch (error: any) {
    console.error("[RFP GET] Error:", error?.message, error?.stack);
    return NextResponse.json({ error: "Failed to fetch RFPs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session?.user as any)?.id;
    const userEmail = (session?.user as any)?.email;
    const body = await request.json();
    const { filename, fileType, cloudStoragePath, isPublic } = body ?? {};
    console.log(`[RFP POST] userId=${userId} email=${userEmail} filename=${filename} fileType=${fileType} hasStorage=${!!cloudStoragePath}`);
    const rfp = await prisma.rfpUpload.create({
      data: {
        userId,
        filename: filename ?? "document",
        fileType: fileType ?? "pdf",
        cloudStoragePath: cloudStoragePath ?? null,
        isPublic: isPublic ?? false,
      },
    });
    console.log(`[RFP POST] Created rfpId=${rfp.id}`);
    return NextResponse.json(rfp, { status: 201 });
  } catch (error: any) {
    console.error("[RFP POST] Error:", error?.message, error?.stack);
    return NextResponse.json({ error: "Failed to create RFP" }, { status: 500 });
  }
}
