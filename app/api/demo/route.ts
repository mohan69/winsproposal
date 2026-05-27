export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, company, industry, rfpsPerMonth, message } = body ?? {};

    if (!name || !email || !company) {
      return NextResponse.json({ error: "Name, email, and company are required" }, { status: 400 });
    }

    await prisma.demoRequest.create({
      data: {
        name: name ?? "",
        email: email ?? "",
        company: company ?? "",
        industry: industry ?? null,
        rfpsPerMonth: rfpsPerMonth ?? null,
        message: message ?? null,
      },
    });

    // Send email notification
    try {
      const appUrl = process.env.NEXTAUTH_URL ?? "";
      let appName = "WinsProposal";
      try { appName = new URL(appUrl).hostname?.split(".")?.[0] ?? "WinsProposal"; } catch {}

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a365d; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
            New WinsProposal Demo Request from ${name}
          </h2>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Name:</strong> ${name}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p style="margin: 10px 0;"><strong>Company:</strong> ${company}</p>
            <p style="margin: 10px 0;"><strong>Industry:</strong> ${industry ?? "Not specified"}</p>
            <p style="margin: 10px 0;"><strong>RFPs/Month:</strong> ${rfpsPerMonth ?? "Not specified"}</p>
            ${message ? `<p style="margin: 10px 0;"><strong>Message:</strong></p><div style="background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #10b981;">${message}</div>` : ""}
          </div>
          <p style="color: #666; font-size: 12px;">Submitted at: ${new Date().toLocaleString()}</p>
        </div>
      `;

      await fetch("https://apps.abacus.ai/api/sendNotificationEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deployment_token: process.env.ABACUSAI_API_KEY,
          app_id: process.env.WEB_APP_ID,
          notification_id: process.env.NOTIF_ID_DEMO_REQUEST_SUBMISSION,
          subject: `New WinsProposal Demo Request from ${company}`,
          body: htmlBody,
          is_html: true,
          recipient_email: "mohan@rightsense.in",
          sender_email: appUrl ? `noreply@${new URL(appUrl).hostname}` : undefined,
          sender_alias: appName,
        }),
      });
    } catch (emailError: any) {
      console.error("Email notification failed:", emailError);
    }

    return NextResponse.json({ success: true, message: "Demo request submitted" });
  } catch (error: any) {
    console.error("Demo submission error:", error);
    return NextResponse.json({ error: "Failed to submit demo request" }, { status: 500 });
  }
}
