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
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { organization: true } });
    if (!user?.organizationId || !user?.organization) {
      return NextResponse.json(null);
    }
    return NextResponse.json(user.organization);
  } catch (error: any) {
    console.error("Org fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch organization" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session?.user as any)?.id;
    const role = (session?.user as any)?.role;

    // Check if user already has an org
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.organizationId) {
      return NextResponse.json({ error: "You already belong to an organization" }, { status: 400 });
    }

    const body = await request.json();
    const { name, brandColor } = body ?? {};
    if (!name?.trim()) return NextResponse.json({ error: "Organization name is required" }, { status: 400 });

    const org = await prisma.organization.create({
      data: {
        name: name.trim(),
        brandColor: brandColor || null,
        createdById: userId,
      },
    });

    // Link user to org and make them admin
    await prisma.user.update({
      where: { id: userId },
      data: { organizationId: org.id, role: "admin" },
    });

    return NextResponse.json(org, { status: 201 });
  } catch (error: any) {
    console.error("Org create error:", error);
    return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session?.user as any)?.id;
    const role = (session?.user as any)?.role;

    if (role !== "admin") {
      return NextResponse.json({ error: "Only admins can update organization settings" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, brandColor, logoUrl } = body ?? {};
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (brandColor !== undefined) updateData.brandColor = brandColor;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;

    const org = await prisma.organization.update({
      where: { id: user.organizationId },
      data: updateData,
    });

    return NextResponse.json(org);
  } catch (error: any) {
    console.error("Org update error:", error);
    return NextResponse.json({ error: "Failed to update organization" }, { status: 500 });
  }
}
