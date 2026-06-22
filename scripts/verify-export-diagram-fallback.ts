import { buildDrawingPackages } from "../lib/drawing-intelligence";
import { buildEngineeringArtifact, renderArtifactForPdf } from "../lib/engineering-artifacts";
import fs from "node:fs";
import path from "node:path";
import {
  DIAGRAM_TEXT_FALLBACK_WARNING,
  getDrawingExportKey,
  renderDrawingPackageExportHtml,
  renderDrawingPackagePng,
} from "../lib/export-diagram-renderer";
import { ensureSevereServiceSections, getHydrogenTbeData, inferRfpIntelligence } from "../lib/severe-service-intelligence";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function fakePng(width = 900, height = 520, size = 6000) {
  const buffer = Buffer.alloc(size, 0);
  buffer[0] = 0x89;
  buffer.write("PNG", 1, "ascii");
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}

const extractedData = {
  title: "Hydrogen Process Control Valve Package",
  industry: "Valves",
  lineItems: [
    { item: "HV-H2-3101A/B/C/D", tag: "HV-H2-3101A/B/C/D", description: "Hydrogen pressure control valves" },
    { item: "FV-H2-3150A/B", tag: "FV-H2-3150A/B", description: "Hydrogen flow control valves" },
    { item: "PV-H2-3190", tag: "PV-H2-3190", description: "Export header control valve" },
  ],
  requirements: [
    { id: "H2-001", description: "Hydrogen export header severe-service control valve proposal" },
    { id: "H2-002", description: "P&ID-lite control loop with positioner, solenoid, actuator, and feedback" },
  ],
};

const drawings = buildDrawingPackages({
  proposalId: "verify-export-diagram",
  templateType: "Severe-Service Control Valve | Hydrogen Process Control / Export Header Control",
  extractedData,
});

const controlLoop = drawings.find((drawing) => drawing.title === "P&ID-lite Control Loop");
assert(controlLoop, "Expected P&ID-lite Control Loop drawing");

const okFetcher = async () => new Response(fakePng(), {
  status: 200,
  headers: { "content-type": "image/png" },
});
const brokenFetcher = async () => new Response("broken", { status: 500 });

async function main() {
  const png = await renderDrawingPackagePng(controlLoop!, { fetcher: okFetcher as typeof fetch });
  assert(png?.buffer && png.buffer.length > 5000, "DOCX/PDF diagram PNG render should return a non-trivial PNG");
  assert(png?.dataUri.startsWith("data:image/png;base64,"), "PNG render should expose a data URI for PDF HTML");

  const missing = await renderDrawingPackagePng(controlLoop!, { fetcher: brokenFetcher as typeof fetch });
  assert(missing === null, "Broken diagram renderer should return null instead of throwing");

  const imageHtml = renderDrawingPackageExportHtml(controlLoop!, "#1a365d", png!.dataUri);
  assert(imageHtml.includes("<img"), "PDF diagram HTML should include PNG image when available");
  assert(!imageHtml.includes(DIAGRAM_TEXT_FALLBACK_WARNING), "Image-backed PDF diagram should not show fallback warning");

  const fallbackHtml = renderDrawingPackageExportHtml(controlLoop!, "#1a365d");
  assert(fallbackHtml.includes(DIAGRAM_TEXT_FALLBACK_WARNING), "Broken PDF diagram should include text fallback warning");
  assert(fallbackHtml.includes("P&amp;ID-lite Control Loop") || fallbackHtml.includes("P&ID-lite Control Loop"), "Fallback should keep the drawing title");
  assert(fallbackHtml.includes("Positioner") && fallbackHtml.includes("Actuator"), "Fallback should include control-loop table details");

  const artifact = buildEngineeringArtifact({
    sectionTitle: "Drawings and Technical Visuals",
    proposalId: "verify-export-diagram",
    templateType: "Severe-Service Control Valve | Hydrogen Process Control / Export Header Control",
    extractedData,
  });
  assert(artifact?.drawingPackages?.length, "Expected drawing package artifact");

  const imageMap = { [getDrawingExportKey(controlLoop!)]: png!.dataUri };
  const pdfWithImage = renderArtifactForPdf(artifact!, "#1a365d", imageMap);
  assert(pdfWithImage.includes("<img"), "PDF artifact should use drawing PNG when available");

  const pdfFallback = renderArtifactForPdf(artifact!, "#1a365d", {});
  assert(pdfFallback.includes(DIAGRAM_TEXT_FALLBACK_WARNING), "PDF artifact should fall back when drawing PNG is missing");
  assert(!/Unable to render DOCX drawing PNG/i.test(pdfFallback), "Export fallback should not leak old hard failure text");

  const pdfRouteSource = fs.readFileSync(path.join(process.cwd(), "app", "api", "proposals", "[id]", "export-pdf", "route.ts"), "utf8");
  assert(pdfRouteSource.includes("renderHtmlToPdf"), "PDF route should use the shared PDF renderer");
  assert(pdfRouteSource.includes("generateSimplifiedProposalHtml"), "PDF route should include simplified text/table fallback template");
  assert(pdfRouteSource.includes("generateUltraMinimalProposalHtml"), "PDF route should include ultra-minimal fallback template");
  assert(pdfRouteSource.includes("PDF export failed after image and text fallback attempts."), "PDF route should return the safe final fallback error");
  assert(pdfRouteSource.includes("text-fallback"), "PDF route should retry with drawing text fallbacks");

  const pdfHealthRoute = fs.readFileSync(path.join(process.cwd(), "app", "api", "pdf-health", "route.ts"), "utf8");
  assert(pdfHealthRoute.includes("PDF Health Check"), "PDF health route should render the static health-check HTML");
  assert(pdfHealthRoute.includes("renderHtmlToPdf"), "PDF health route should use the same renderer as proposal export");

  const imiExtractedData = {
    title: "IMI Severe-Service Hydrogen Control Valve RFP",
    industry: "Valves",
    lineItems: [
      { item: "Hydrogen compressor discharge pressure control", description: "85 barg to 55 barg at 45°C", quantity: 1 },
      { item: "Hydrogen recycle control", description: "70 barg to 30 barg at 50°C", quantity: 1 },
      { item: "Export header pressure control", description: "60 barg to 40 barg at 40°C", quantity: 1 },
      { item: "Vent / depressurization control", description: "85 barg to 1.5 barg at 45°C", quantity: 1 },
    ],
    requirements: [
      { id: "R1", description: "Severe-service hydrogen control valve package with proposal-stage sizing validation" },
      { id: "R2", description: "P&ID-lite control loop and drawing package required" },
    ],
  };
  const intelligence = inferRfpIntelligence(imiExtractedData);
  const sections = ensureSevereServiceSections([], intelligence, imiExtractedData);
  const sectionText = sections.map((section) => `${section.title}\n${section.content}`).join("\n");
  for (const required of ["PCV-101", "PCV-102", "PCV-103", "PCV-104", "Hydrogen compressor discharge pressure control", "Hydrogen recycle control", "Export header pressure control", "Vent / depressurization control", "85 barg", "55 barg", "70 barg", "30 barg", "60 barg", "40 barg", "1.5 barg", "45°C", "50°C", "40°C"]) {
    assert(sectionText.includes(required), `Generated severe-service content should preserve ${required}`);
  }
  for (const knownValue of ["85 barg", "55 barg", "70 barg", "30 barg", "60 barg", "40 barg", "1.5 barg", "45°C", "50°C", "40°C"]) {
    const index = sectionText.indexOf(knownValue);
    assert(index >= 0, `Known RFP value missing: ${knownValue}`);
    const nearby = sectionText.slice(Math.max(0, index - 80), index + 120);
    assert(!/Requires engineering validation\s*\|\s*Requires engineering validation/.test(nearby), `Known RFP value should not be replaced by validation placeholder near ${knownValue}`);
  }
  for (const stale of ["HV-H2-3101", "FV-H2-3150", "PV-H2-3190", "48 barg", "18 barg", "60°C", "unparalleled expertise", "preferred partner", "exceeds expectations"]) {
    assert(!sectionText.includes(stale), `Generated severe-service content should not include stale/overclaiming text: ${stale}`);
  }

  const imiDrawings = buildDrawingPackages({
    proposalId: "verify-imi-tags",
    templateType: "Severe-Service Control Valve | Hydrogen Process Control / Export Header Control",
    extractedData: imiExtractedData,
  });
  const imiDrawingText = JSON.stringify(imiDrawings);
  for (const tag of ["PCV-101", "PCV-102", "PCV-103", "PCV-104"]) assert(imiDrawingText.includes(tag), `Drawings should preserve ${tag}`);
  assert(!/HV-H2-3101|FV-H2-3150|PV-H2-3190/.test(imiDrawingText), "Drawings should not use stale H2 demo tags when RFP tags exist");

  const sanitizedTbe = getHydrogenTbeData(imiExtractedData, {
    lineItems: ["bad"],
    tags: ["Material"],
    cells: { "0-Material": "ASTM A216 WCB, Class 150, Class 300, 2 inches, bolted bonnet, API 600, PTFE packing, ISO 9001:2015 certified. We provide flanged end connections. Our globe control valves feature bolted bonnet construction. Our valves undergo rigorous testing." },
  });
  const tbeText = JSON.stringify(sanitizedTbe);
  for (const forbidden of ["ASTM A216", "WCB", "Class 300", "Class 150", "2 inches", "bolted bonnet", "API 600", "PTFE", "ISO 9001", "We provide", "Our globe control valves", "Our valves undergo", "rigorous testing"]) {
    assert(!tbeText.includes(forbidden), `TBE export should not assert unsupported ${forbidden}`);
  }
  assert(tbeText.includes("Requires engineering validation based on final RFP data, approved sizing calculation, line class, material specification, inspection plan, and project standards."), "TBE export should fall back to the required engineering validation language");

  console.log("Export diagram PNG and fallback behavior verified.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
