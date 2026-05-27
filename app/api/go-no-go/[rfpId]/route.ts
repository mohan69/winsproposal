export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { calculateGoNoGoScore } from "@/lib/templates";

// GET existing assessment
export async function GET(request: Request, { params }: { params: { rfpId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any)?.id;

    const rfp = await prisma.rfpUpload.findFirst({ where: { id: params.rfpId, userId } });
    if (!rfp) return NextResponse.json({ error: "RFP not found" }, { status: 404 });

    const assessment = await prisma.goNoGoAssessment.findUnique({
      where: { rfpId: params.rfpId },
    });

    return NextResponse.json(assessment);
  } catch (err: any) {
    console.error("Go/No-Go GET error:", err);
    return NextResponse.json({ error: "Failed to fetch assessment" }, { status: 500 });
  }
}

// CREATE or UPDATE assessment
export async function POST(request: Request, { params }: { params: { rfpId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any)?.id;

    const rfp = await prisma.rfpUpload.findFirst({ where: { id: params.rfpId, userId } });
    if (!rfp) return NextResponse.json({ error: "RFP not found" }, { status: 404 });

    const body = await request.json();
    const { responses, notes, industry } = body ?? {};

    if (!Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json({ error: "Responses array is required" }, { status: 400 });
    }

    const rfpIndustry = industry || (rfp.extractedData as any)?.industry || "General";
    const score = calculateGoNoGoScore(responses, rfpIndustry);

    const assessment = await prisma.goNoGoAssessment.upsert({
      where: { rfpId: params.rfpId },
      update: {
        responses,
        totalScore: score.totalScore,
        maxScore: score.maxScore,
        recommendation: score.recommendation,
        notes: notes || null,
      },
      create: {
        rfpId: params.rfpId,
        userId,
        responses,
        totalScore: score.totalScore,
        maxScore: score.maxScore,
        recommendation: score.recommendation,
        notes: notes || null,
      },
    });

    return NextResponse.json({ ...assessment, percentage: score.percentage });
  } catch (err: any) {
    console.error("Go/No-Go POST error:", err);
    return NextResponse.json({ error: "Failed to save assessment" }, { status: 500 });
  }
}
