export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session?.user as any)?.id;
    const role = (session?.user as any)?.role;

    if (role !== "admin") {
      return NextResponse.json({ error: "Only admins can invite team members" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.organizationId) {
      return NextResponse.json({ error: "Create an organization first" }, { status: 400 });
    }

    const body = await request.json();
    const { email, role: inviteRole } = body ?? {};
    if (!email?.trim()) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    // Check if user already in org
    const existingUser = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existingUser?.organizationId === user.organizationId) {
      return NextResponse.json({ error: "User is already a member of this organization" }, { status: 400 });
    }

    // Check for existing pending invite
    const existingInvite = await prisma.teamInvite.findFirst({
      where: { organizationId: user.organizationId, email: email.trim().toLowerCase(), status: "pending" },
    });
    if (existingInvite) {
      return NextResponse.json({ error: "An invite has already been sent to this email" }, { status: 400 });
    }

    const validRoles = ["admin", "bid_manager", "reviewer", "team_member"];
    const assignedRole = validRoles.includes(inviteRole) ? inviteRole : "team_member";

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await prisma.teamInvite.create({
      data: {
        organizationId: user.organizationId,
        email: email.trim().toLowerCase(),
        role: assignedRole as any,
        invitedById: userId,
        token,
        expiresAt,
      },
    });

    // Build invite link
    const baseUrl = process.env.NEXTAUTH_URL || "";
    const inviteLink = `${baseUrl}/invite?token=${token}`;

    // Fetch org name
    const org = await prisma.organization.findUnique({ where: { id: user.organizationId }, select: { name: true } });
    const orgName = org?.name || "the organization";
    const roleLabels: Record<string, string> = { admin: "Admin", bid_manager: "Bid Manager", reviewer: "Reviewer", team_member: "Team Member" };
    const roleLabel = roleLabels[assignedRole] || "Team Member";

    // Send invite email notification
    try {
      const appUrl = process.env.NEXTAUTH_URL || "";
      const appHost = appUrl ? new URL(appUrl).hostname : "winsproposal";

      const htmlBody = `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
          <div style="background:#1a365d;padding:30px;text-align:center;border-radius:8px 8px 0 0;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;">WinsProposal</h1>
            <p style="color:#94a3b8;margin:5px 0 0;font-size:13px;">Team Invitation</p>
          </div>
          <div style="padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
            <h2 style="color:#1a365d;margin:0 0 16px;">You've been invited!</h2>
            <p style="color:#374151;line-height:1.6;margin:0 0 16px;">
              <strong>${user.name || "An administrator"}</strong> has invited you to join
              <strong>${orgName}</strong> on WinsProposal as a <strong>${roleLabel}</strong>.
            </p>
            <p style="color:#374151;line-height:1.6;margin:0 0 24px;">
              WinsProposal is an AI-powered proposal engine for manufacturing and EPC companies.
              Click the button below to accept the invitation and get started.
            </p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${inviteLink}" style="display:inline-block;background:#10b981;color:#ffffff;font-weight:600;font-size:15px;padding:14px 32px;border-radius:6px;text-decoration:none;">
                Accept Invitation
              </a>
            </div>
            <p style="color:#6b7280;font-size:12px;text-align:center;margin:20px 0 0;">
              This invitation expires on ${expiresAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.
              <br/>If the button doesn't work, copy and paste this link: <br/>
              <a href="${inviteLink}" style="color:#3b82f6;word-break:break-all;">${inviteLink}</a>
            </p>
          </div>
        </div>
      `;

      const emailPayload = {
          deployment_token: process.env.ABACUSAI_API_KEY,
          app_id: process.env.WEB_APP_ID,
          notification_id: process.env.NOTIF_ID_TEAM_INVITE,
          subject: `You're invited to join ${orgName} on WinsProposal`,
          body: htmlBody,
          is_html: true,
          recipient_email: email.trim().toLowerCase(),
          sender_email: `noreply@${appHost}`,
          sender_alias: "WinsProposal",
        };

      console.log("[INVITE EMAIL] Sending to:", email.trim().toLowerCase());
      console.log("[INVITE EMAIL] notification_id:", process.env.NOTIF_ID_TEAM_INVITE);
      console.log("[INVITE EMAIL] app_id:", process.env.WEB_APP_ID);

      const emailRes = await fetch("https://apps.abacus.ai/api/sendNotificationEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailPayload),
      });

      const emailResult = await emailRes.json();
      console.log("[INVITE EMAIL] Response status:", emailRes.status);
      console.log("[INVITE EMAIL] Response body:", JSON.stringify(emailResult));

      if (!emailResult.success) {
        if (emailResult.notification_disabled) {
          console.log("[INVITE EMAIL] Notification disabled by user, skipping");
        } else {
          console.error("[INVITE EMAIL] Failed:", emailResult.message || JSON.stringify(emailResult));
        }
      } else {
        console.log("[INVITE EMAIL] Successfully sent to", email.trim().toLowerCase());
      }
    } catch (emailErr) {
      console.error("[INVITE EMAIL] Exception:", emailErr);
      // Continue - invite was created, email is best-effort
    }

    return NextResponse.json({ invite, inviteLink }, { status: 201 });
  } catch (error: any) {
    console.error("Invite create error:", error);
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = (session?.user as any)?.role;
    if (role !== "admin") {
      return NextResponse.json({ error: "Only admins can revoke invites" }, { status: 403 });
    }

    const { searchParams } = new URL(request?.url ?? "");
    const inviteId = searchParams?.get("id");
    if (!inviteId) return NextResponse.json({ error: "Invite ID required" }, { status: 400 });

    await prisma.teamInvite.delete({ where: { id: inviteId } });
    return NextResponse.json({ message: "Invite revoked" });
  } catch (error: any) {
    console.error("Invite delete error:", error);
    return NextResponse.json({ error: "Failed to revoke invite" }, { status: 500 });
  }
}
