import fs from "node:fs";
import path from "node:path";
import { createPdfRenderDiagnostics, renderHtmlToPdf } from "../lib/pdf-renderer";
import { generateProposalHtml, generateSimplifiedProposalHtml, generateUltraMinimalProposalHtml } from "../lib/pdf-template";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const html = `<!DOCTYPE html>
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

const proposalData = {
  proposalId: "pdf-health-proposal",
  title: "Hydrogen Process Control Valve Package",
  industry: "Severe-Service Control Valves",
  templateType: "Severe-Service Control Valve | Hydrogen Process Control / Export Header Control",
  status: "Draft / Demo",
  createdAt: new Date("2026-06-22T00:00:00.000Z").toISOString(),
  sections: [
    {
      id: "exec",
      sectionTitle: "Executive Summary",
      content: "Customer Requirement -> Technical Compliance -> Delivery Confidence -> Risk Reduction -> Commercial Value -> Win Theme",
      sourceType: "generated",
      visualizationType: "value_chain" as const,
    },
    {
      id: "scope",
      sectionTitle: "Scope of Supply / Line Items",
      content: "| Tag | Service | Fluid | Inlet Pressure | Outlet Pressure | Temperature | Validation Note |\n|---|---|---|---|---|---|---|\n| PCV-101 | Hydrogen compressor discharge pressure control | Hydrogen-rich process gas | 85 barg | 55 barg | 45°C | Requires engineering validation for final size/class/material |\n| PCV-102 | Hydrogen recycle control | Hydrogen-rich process gas | 70 barg | 30 barg | 50°C | Requires engineering validation for final size/class/material |",
      sourceType: "generated",
      visualizationType: "process_flow" as const,
    },
    {
      id: "process",
      sectionTitle: "Process Conditions / Service Conditions",
      content: "| Tag / Ref | Fluid / Service | Inlet Pressure | Outlet Pressure | Temperature | Leakage Class | Validation Note |\n|---|---|---|---|---|---|---|\n| PCV-101 | Hydrogen-rich process gas | 85 barg | 55 barg | 45°C | Requires engineering validation | Requires engineering validation |",
      sourceType: "generated",
      visualizationType: "process_flow" as const,
    },
    {
      id: "compliance",
      sectionTitle: "Compliance Matrix",
      content: "- ISA/IEC sizing awareness: final validation required\n- ASME pressure-temperature awareness: final validation required",
      sourceType: "generated",
      visualizationType: "compliance_flow" as const,
    },
    {
      id: "commercial",
      sectionTitle: "Commercial Summary",
      content: "| Tag | Service | Qty | Indicative Commercial Basis | Optional Compliance / Testing Costs | Delivery Basis |\n|---|---|---:|---|---|---|\n| PCV-101 | Hydrogen compressor discharge pressure control | 1 | Demo placeholder / subject to final validation | PMI, leakage testing, MDR support where applicable | 14-16 weeks after drawing approval |\n\nProposal validity: 60 days from bid due date.",
      sourceType: "generated",
      visualizationType: "value_chain" as const,
    },
    {
      id: "drawings",
      sectionTitle: "Drawings and Technical Visuals",
      content: "Proposal-stage technical drawing. Not for construction.",
      sourceType: "generated",
      visualizationType: "engineering_dependency" as const,
    },
  ],
  winScore: 78,
  companyName: "Demo Customer",
  vaultSectionsUsed: 1,
  vaultDocumentsUsed: 1,
  orgName: "WinsProposal Demo Engine",
  brandColor: "#1a365d",
  includeDiagrams: true,
  complianceItems: [
    { label: "Hydrogen material compatibility reviewed", standard: "Project confirmation required", checked: true },
  ],
  tbeData: {
    lineItems: ["PCV-101 - Hydrogen compressor discharge pressure control"],
    tags: ["Material", "Pressure Rating", "Testing"],
    cells: {
      "0-Material": "Requires engineering validation based on final RFP data, approved sizing calculation, line class, material specification, inspection plan, and project standards.",
      "0-Pressure Rating": "Requires engineering validation based on final RFP data, approved sizing calculation, line class, material specification, inspection plan, and project standards.",
      "0-Testing": "Requires engineering validation based on final RFP data, approved sizing calculation, line class, material specification, inspection plan, and project standards.",
    },
  },
  extractedData: {
    title: "Hydrogen Process Control Valve Package",
    lineItems: [{ item: "Hydrogen compressor discharge pressure control", description: "85 barg to 55 barg at 45°C" }],
  },
  drawingImageData: {},
};

async function verifyPdf(stage: string, sourceHtml: string) {
  const diagnostics = createPdfRenderDiagnostics();
  const result = await renderHtmlToPdf({
    stage,
    html: sourceHtml,
    footerTemplate: "<div></div>",
    pollIntervalMs: 1000,
    timeoutAttempts: 60,
    diagnostics,
  });

  assert(result.pdfBuffer.length > 1000, `${stage} PDF should not be empty`);
  assert(result.pdfBuffer.subarray(0, 4).toString("utf8") === "%PDF", `${stage} result should be a PDF`);
  console.log(`${stage} verified (${result.pdfBuffer.length} bytes via ${result.renderer}).`);
  if (!/ultra-minimal|forced-chromium/i.test(stage)) {
    assert(result.renderer === "local-chromium" || result.renderer === "abacus-html-to-pdf", `${stage} should use a full HTML renderer, not pdf-lib`);
  }
}

async function verifyForcedFallbacks() {
  const abacusDiagnostics = createPdfRenderDiagnostics();
  const chromiumResult = await renderHtmlToPdf({
    stage: "script-forced-abacus-failure",
    html,
    footerTemplate: "<div></div>",
    forceAbacusFailure: true,
    diagnostics: abacusDiagnostics,
  });
  assert(chromiumResult.renderer === "local-chromium", "Forced Abacus failure should reach Chromium before pdf-lib");
  assert(abacusDiagnostics.rendererAttempted.includes("local-chromium"), "Forced Abacus failure should attempt Chromium");

  const chromiumDiagnostics = createPdfRenderDiagnostics();
  const pdfLibResult = await renderHtmlToPdf({
    stage: "script-forced-chromium-failure",
    html,
    footerTemplate: "<div></div>",
    forceAbacusFailure: true,
    forceChromiumFailure: true,
    diagnostics: chromiumDiagnostics,
  });
  assert(pdfLibResult.renderer === "pdf-lib", "Forced Chromium failure should return pdf-lib fallback");
  assert(chromiumDiagnostics.pdfLibAttempted, "Forced Chromium failure should attempt pdf-lib");
  assert(pdfLibResult.pdfBuffer.subarray(0, 4).toString("utf8") === "%PDF", "pdf-lib fallback should return a PDF");

  const healthRoute = fs.readFileSync(path.join(process.cwd(), "app", "api", "pdf-health", "route.ts"), "utf8");
  assert(healthRoute.includes('export const runtime = "nodejs"'), "PDF health route must use Node.js runtime");
  assert(healthRoute.includes("debug"), "PDF health route must expose debug JSON mode");
  assert(healthRoute.includes("diagnostics"), "PDF health debug mode must return safe diagnostics");

  const pdfRoute = fs.readFileSync(path.join(process.cwd(), "app", "api", "proposals", "[id]", "export-pdf", "route.ts"), "utf8");
  assert(pdfRoute.includes('export const runtime = "nodejs"'), "Proposal PDF route must use Node.js runtime");
  assert(pdfRoute.includes("renderHtmlToPdf"), "Proposal PDF route must use the shared renderer");
  assert(pdfRoute.includes("disablePdfLibFallback: !allowPdfLibFallback"), "Proposal PDF route must only allow pdf-lib on the final fallback attempt");
  assert(pdfRoute.includes("X-PDF-Render-Attempt"), "Proposal PDF route should report the successful render attempt");

  const pdfRenderer = fs.readFileSync(path.join(process.cwd(), "lib", "pdf-renderer.ts"), "utf8");
  assert(!pdfRenderer.includes("WinsProposal PDF Export Fallback"), "pdf-lib fallback should not title normal exports as PDF Export Fallback");
  assert(pdfRenderer.includes("chromiumExecutablePathError"), "PDF renderer diagnostics should include Chromium executable resolution errors");
  assert(pdfRenderer.includes("packageBinPath"), "PDF renderer should attempt packaged Chromium bin resolution");

  const nextConfig = fs.readFileSync(path.join(process.cwd(), "next.config.js"), "utf8");
  assert(nextConfig.includes("serverComponentsExternalPackages"), "Next config should externalize server-only Chromium package");
  assert(nextConfig.includes("@sparticuz/chromium"), "Next config should reference @sparticuz/chromium");
  assert(nextConfig.includes("outputFileTracingIncludes"), "Next config should include Chromium binary files for traced PDF routes");

  const vercelConfig = fs.readFileSync(path.join(process.cwd(), "vercel.json"), "utf8");
  assert(vercelConfig.includes("node_modules/@sparticuz/chromium/bin/**"), "Vercel config should include Chromium binaries in PDF functions");
  assert(vercelConfig.includes('"memory": 3008'), "Vercel PDF functions should request higher memory for Chromium");
}

async function main() {
  await verifyPdf("script-pdf-health-check", html);
  await verifyPdf("script-proposal-rich-html", generateProposalHtml(proposalData));
  await verifyPdf("script-proposal-text-fallback", generateProposalHtml({ ...proposalData, drawingImageData: {} }));
  await verifyPdf("script-proposal-simplified-fallback", generateSimplifiedProposalHtml({ ...proposalData, drawingImageData: {}, tbeData: undefined }));
  await verifyPdf("script-proposal-ultra-minimal-fallback", generateUltraMinimalProposalHtml({ ...proposalData, drawingImageData: {}, tbeData: undefined }));
  await verifyForcedFallbacks();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
