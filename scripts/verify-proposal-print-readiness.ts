import fs from "node:fs/promises";
import path from "node:path";
import { generateProposalHtml } from "../lib/pdf-template";
import { getBestVisualizationType, getFallbackVisualization, shouldRenderProposalDiagram } from "../lib/visualization-service";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function assertIncludes(haystack: string, needle: string, context: string) {
  assert(haystack.includes(needle), `${context}: missing ${needle}`);
}

const templateType = "Hydrogen Process Control Valve Proposal | Application: Hydrogen Process Control / Export Header Control | Industry: Severe-Service Control Valves | Package Type: Severe-Service Control Valve Proposal";
const sections = [
  { id: "exec", sectionTitle: "Executive Summary", content: "Hydrogen severe-service proposal summary with customer value and win theme.", sourceType: "generated" },
  { id: "background", sectionTitle: "Project Background / Opportunity Context", content: "Hydrogen hub project, process criticality, OEM/EPC evaluation, and bid opportunity.", sourceType: "generated" },
  { id: "scope", sectionTitle: "Scope of Supply / Line Items", content: "RFP scope, valve package, actuator accessories, documentation, inspection, testing, and delivery.", sourceType: "generated" },
  { id: "commercial", sectionTitle: "Commercial Summary", content: "Pricing placeholder, delivery schedule, warranty, exclusions, risk allowance, and margin protection.", sourceType: "generated" },
];

for (const section of sections) {
  assert(shouldRenderProposalDiagram(section.sectionTitle, section.content), `${section.sectionTitle}: expected printable diagram`);
}

const executiveType = getBestVisualizationType(sections[0].sectionTitle, sections[0].content, { templateType, industry: "Valves" });
const backgroundType = getBestVisualizationType(sections[1].sectionTitle, sections[1].content, { templateType, industry: "Valves" });
assert(executiveType === "value_chain", `Executive Summary: expected value_chain, got ${executiveType}`);
assert(backgroundType === "process_flow", `Project Background: expected process_flow, got ${backgroundType}`);

const executiveDiagram = getFallbackVisualization({
  title: "Hydrogen Process Control Valve Package",
  sectionTitle: sections[0].sectionTitle,
  content: sections[0].content,
  templateType,
  industry: "Valves",
}, executiveType).mermaidCode;

const backgroundDiagram = getFallbackVisualization({
  title: "Hydrogen Process Control Valve Package",
  sectionTitle: sections[1].sectionTitle,
  content: sections[1].content,
  templateType,
  industry: "Valves",
}, backgroundType).mermaidCode;

for (const label of ["Customer Requirement", "Technical Compliance", "Delivery Confidence", "Risk Reduction", "Commercial Value", "Win Theme"]) {
  assertIncludes(executiveDiagram, label, "Executive Summary diagram");
}
for (const label of ["Hydrogen Hub Project", "Process Criticality", "Severe Service Valve Requirement", "Compliance Standards", "OEM EPC Evaluation", "Bid Opportunity"]) {
  assertIncludes(backgroundDiagram, label, "Project Background diagram");
}
assert(executiveDiagram !== backgroundDiagram, "Executive Summary and Project Background diagrams must be different");

const html = generateProposalHtml({
  proposalId: "print-readiness-check",
  title: "Hydrogen Process Control Valve Package",
  industry: "Valves",
  templateType,
  status: "Draft",
  createdAt: new Date("2026-06-03T00:00:00.000Z").toISOString(),
  sections,
  winScore: 88,
  vaultSectionsUsed: 0,
  vaultDocumentsUsed: 0,
  includeDiagrams: true,
  extractedData: {
    title: "Hydrogen Process Control Valve Package",
    summary: "Hydrogen export header severe-service control valves",
    processConditions: { fluid: "Hydrogen-rich process gas" },
  },
});

for (const label of ["Customer Requirement", "Win Theme", "Hydrogen Hub Project", "Severe Service Valve Requirement", "Bid Opportunity", "Margin Protection"]) {
  assertIncludes(html, label, "PDF HTML export");
}
assert(html.indexOf("Customer Requirement") < html.indexOf("Hydrogen Hub Project"), "Executive diagram should render before background diagram");

async function main() {
  const root = process.cwd();
  const [globalsCss, proposalClient, mermaidComponent, drawingComponent] = await Promise.all([
    fs.readFile(path.join(root, "app", "globals.css"), "utf8"),
    fs.readFile(path.join(root, "app", "proposals", "[id]", "_components", "proposal-detail-client.tsx"), "utf8"),
    fs.readFile(path.join(root, "components", "mermaid-diagram.tsx"), "utf8"),
    fs.readFile(path.join(root, "components", "engineering-drawing.tsx"), "utf8"),
  ]);

  for (const sourceCheck of [
    [proposalClient, "proposal-print-root", "proposal root class"],
    [proposalClient, "proposal-print-section", "proposal section class"],
    [proposalClient, "printable-diagram-section", "printable diagram section class"],
    [proposalClient, "printable-artifact", "printable artifact class"],
    [proposalClient, "printable-artifact-visual", "printable artifact visual class"],
    [mermaidComponent, "printable-diagram", "Mermaid printable class"],
    [mermaidComponent, "data-mermaid-ready", "Mermaid readiness marker"],
    [drawingComponent, "printable-artifact-visual", "engineering drawing printable class"],
  ] as const) {
    assertIncludes(sourceCheck[0], sourceCheck[1], sourceCheck[2]);
  }

  for (const cssCheck of [
    "@media print",
    "aside,",
    "nav,",
    "header,",
    ".proposal-print-root button",
    ".proposal-print-section",
    "break-inside: avoid",
    "page-break-inside: avoid",
    ".printable-diagram svg",
    "width: 100%",
    "height: auto",
    "min-height: 180px",
    "overflow: visible",
  ] as const) {
    assertIncludes(globalsCss, cssCheck, "print CSS");
  }

  console.log(JSON.stringify({
    status: "passed",
    checks: {
      executiveType,
      backgroundType,
      executiveLabels: ["Customer Requirement", "Technical Compliance", "Delivery Confidence", "Risk Reduction", "Commercial Value", "Win Theme"],
      backgroundLabels: ["Hydrogen Hub Project", "Process Criticality", "Severe Service Valve Requirement", "Compliance Standards", "OEM/EPC Evaluation", "Bid Opportunity"],
      printableClasses: ["proposal-print-root", "proposal-print-section", "printable-diagram", "printable-artifact", "printable-artifact-visual"],
    },
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
