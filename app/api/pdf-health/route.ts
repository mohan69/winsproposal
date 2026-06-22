export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { createPdfRenderDiagnostics, PdfRenderError, renderHtmlToPdf } from "@/lib/pdf-renderer";

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const debug = searchParams.get("debug") === "1";
  const forceAbacusFailure = searchParams.get("forceAbacusFailure") === "1";
  const forceChromiumFailure = searchParams.get("forceChromiumFailure") === "1";
  const diagnostics = createPdfRenderDiagnostics();
  try {
    const result = await renderHtmlToPdf({
      stage: "pdf-health-check",
      html: HEALTH_CHECK_HTML,
      footerTemplate: "<div></div>",
      baseUrl: process.env.NEXTAUTH_URL || "",
      timeoutAttempts: 40,
      diagnostics,
      forceAbacusFailure,
      forceChromiumFailure,
    });

    if (debug) {
      return NextResponse.json({
        ok: true,
        renderer: result.renderer,
        stage: result.stage,
        bytes: result.pdfBuffer.length,
        diagnostics,
      });
    }

    return new NextResponse(result.pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="winsproposal-pdf-health-check.pdf"',
        "X-PDF-Renderer": result.renderer,
        "X-PDF-Renderer-Stage": result.stage,
      },
    });
  } catch (error: any) {
    const safeReason = error instanceof PdfRenderError ? error.safeReason : error?.message ?? "Unknown renderer error.";
    console.error(`PDF health check failed: ${safeReason}`);
    return NextResponse.json({
      ok: false,
      renderer: diagnostics.finalRenderer ?? "none",
      error: safeReason,
      diagnostics,
    }, { status: 500 });
  }
}
