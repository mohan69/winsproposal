export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { PdfRenderError, renderHtmlToPdf } from "@/lib/pdf-renderer";

const HEALTH_CHECK_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    @page { size:A4; margin:18mm; }
    body { font-family:Arial, Helvetica, sans-serif; color:#111827; }
  </style>
</head>
<body>
  <h1>PDF Health Check</h1>
  <p>WinsProposal PDF export test.</p>
</body>
</html>`;

export async function GET() {
  try {
    const result = await renderHtmlToPdf({
      stage: "pdf-health-check",
      html: HEALTH_CHECK_HTML,
      footerTemplate: "<div></div>",
      baseUrl: process.env.NEXTAUTH_URL || "",
      timeoutAttempts: 40,
    });

    return new NextResponse(result.pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="winsproposal-pdf-health-check.pdf"',
        "X-PDF-Renderer": "abacus-html-to-pdf",
        "X-PDF-Renderer-Stage": result.stage,
      },
    });
  } catch (error: any) {
    const safeReason = error instanceof PdfRenderError ? error.safeReason : error?.message ?? "Unknown renderer error.";
    console.error(`PDF health check failed: ${safeReason}`);
    return NextResponse.json({
      ok: false,
      renderer: "abacus-html-to-pdf",
      error: safeReason,
    }, { status: 500 });
  }
}
