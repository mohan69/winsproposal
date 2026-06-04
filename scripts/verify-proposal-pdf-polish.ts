import fs from "node:fs/promises";
import path from "node:path";
import { formatArtifactTitle } from "../lib/engineering-artifacts";
import { generateProposalHtml } from "../lib/pdf-template";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function assertIncludes(haystack: string, needle: string, context: string) {
  assert(haystack.includes(needle), `${context}: missing ${needle}`);
}

function assertNotIncludes(haystack: string, needle: string, context: string) {
  assert(!haystack.includes(needle), `${context}: should not include ${needle}`);
}

const templateType = "Hydrogen Process Control Valve Proposal | Application: Hydrogen Process Control / Export Header Control | Industry: Severe-Service Control Valves | Package Type: Severe-Service Control Valve Proposal";
const sections = [
  { id: "roi", sectionTitle: "Executive ROI Impact Summary", content: "WinsProposal converts severe-service proposal work into a managed revenue workflow by combining RFP extraction, reusable knowledge, compliance mapping, TBE response automation, drawing intelligence, and export-ready governance evidence. For this hydrogen control valve package, the demo productivity model indicates a reduction in first-pass proposal cycle time from 5.0 days to 2.8 days, engineering effort reduction from 64 hours to 36 hours, and compliance review effort reduction from 14 hours to 6 hours. Estimated annual productivity savings are shown as INR 34-42 lakh based on the demo baseline. These figures are indicative proposal-stage estimates and should be validated against the customer's actual baseline.", sourceType: "generated" },
  { id: "exec", sectionTitle: "Executive Summary", content: "Hydrogen severe-service proposal summary with customer requirement, delivery confidence, risk reduction, commercial value, and win theme.", sourceType: "generated" },
  { id: "background", sectionTitle: "Project Background / Opportunity Context", content: "Hydrogen hub project, process criticality, severe service valve requirement, compliance standards, OEM/EPC evaluation, and bid opportunity.", sourceType: "generated" },
  { id: "scope", sectionTitle: "Scope of Supply / Line Items", content: "RFP scope, valve package, actuator accessories, documentation, inspection, testing, and delivery.", sourceType: "generated" },
  { id: "technical", sectionTitle: "Technical Specification Response", content: "Technical compliance, material compatibility, standards awareness, TBE response, and exceptions.", sourceType: "generated" },
  { id: "bid", sectionTitle: "Bid / No-Bid Scoring", content: "Bid Readiness Score: 78%. Recommendation: Bid with engineering and commercial validation.", sourceType: "generated" },
  { id: "commercial", sectionTitle: "Commercial Summary", content: "Line Item | Qty | Indicative Commercial Basis | Optional Compliance / Testing Costs | Delivery Basis\nHV-H2-3101A/B/C/D | 4 | Demo placeholder / subject to final sizing and material validation | PMI, leakage testing, MDR support where applicable | 14-16 weeks after drawing approval\nFV-H2-3150A/B | 2 | Demo placeholder / subject to final sizing and material validation | PMI, leakage testing, MDR support where applicable | 14-16 weeks after drawing approval\nPV-H2-3190 | 1 | Demo placeholder / subject to final sizing and noise review | Noise review, leakage testing, MDR support where applicable | 16-18 weeks after drawing approval\nDOC-H2 MDR Dossier | 1 lot | Documentation package basis | Included with final MDR/data book; witness/hold point support optional | With final dispatch\nProposal validity: 60 days from bid due date.\nFinal pricing is demo placeholder only and requires customer-specific commercial validation.", sourceType: "generated" },
  { id: "timeline", sectionTitle: "Project Timeline & Delivery", content: "Milestone | Indicative Timeline | Dependency / Note\nDrawing submission | 4 weeks from PO / technical clearance | Subject to final process data and tag details\nEngineering validation | 1-2 weeks after final process data | Sizing, trim, materials, actuator, and accessory validation\nManufacturing lead time | 12-14 weeks after drawing approval | Subject to long-lead trims/materials/accessories\nInspection and testing | 2 weeks | Hydrotest, seat leakage, functional stroke, PMI/NDE where applicable\nShipping readiness | 3 weeks after test clearance | Subject to release note and documentation acceptance\nFinal MDR/data book | With dispatch / post-final inspection | Includes MTC, PMI, test records, certificates, and deviation register", sourceType: "generated" },
  { id: "drawings", sectionTitle: "Drawings and Technical Visuals", content: "Hydrogen service topology, P&ID-lite control loop, valve package schematic, material traceability workflow, and inspection dossier workflow.", sourceType: "generated" },
];

while (sections.length < 22) {
  sections.push({
    id: `demo-${sections.length + 1}`,
    sectionTitle: `Demo Proposal Section ${sections.length + 1}`,
    content: "Proposal-stage customer demo content with engineering validation required.",
    sourceType: "generated",
  });
}

const complianceItems = [
  { label: "Hydrogen material compatibility reviewed", standard: "Project material specification / hydrogen service review", checked: false },
  { label: "Leakage class basis mapped", standard: "ISA 75.01 / IEC 60534 sizing review awareness", checked: false },
  { label: "Pressure-temperature rating review mapped", standard: "ASME B16.34 pressure-temperature rating review awareness", checked: false },
  { label: "ITP / QAP documentation basis mapped", standard: "Project ITP / QAP / MDR documentation review", checked: false },
  { label: "Accessory certification basis mapped", standard: "Project hazardous-area accessory certificate review", checked: false },
];

const html = generateProposalHtml({
  proposalId: "pdf-polish-check",
  title: "Hydrogen Process Control Valve Package",
  industry: "Valves",
  templateType,
  status: "Draft",
  createdAt: new Date("2026-06-03T00:00:00.000Z").toISOString(),
  sections,
  winScore: 42,
  companyName: "CCI Severe Service Solutions",
  orgName: "",
  vaultSectionsUsed: 5,
  vaultDocumentsUsed: 1,
  includeDiagrams: true,
  complianceItems,
  tbeData: {
    lineItems: ["Hydrogen pressure control valve"],
    tags: ["Material", "Leakage", "Documentation"],
    cells: {
      "0-Material": "Hydrogen material compatibility reviewed at proposal stage.",
      "0-Leakage": "Class V requested for selected tags; engineering validation required.",
      "0-Documentation": "MDR, MTC, PMI, ITP, and QAP evidence mapped.",
    },
  },
  extractedData: {
    title: "Hydrogen Process Control Valve Package",
    bidReadinessScore: 78,
    processConditions: { fluid: "Hydrogen-rich process gas" },
    requirements: complianceItems.map((item, index) => ({ id: `Clause ${index + 1}`, description: item.label })),
  },
});

const tocStart = html.indexOf("Table of Contents");
const tocEnd = html.indexOf("Vault Coverage", tocStart);
const tocHtml = tocStart >= 0 && tocEnd > tocStart ? html.slice(tocStart, tocEnd) : "";

assert(tocHtml.length > 0, "TOC: expected table of contents HTML");
assert(!/Page\s+\d+/i.test(tocHtml), "TOC: exact page numbers should be disabled");
assert(!/>Section</i.test(tocHtml), "TOC: should not show SECTION text");
assertNotIncludes(html, "0/5", "Compliance checklist");
assertNotIncludes(html, "items verified", "Compliance checklist");
assertNotIncludes(html, ">OPEN<", "Compliance checklist");
assertNotIncludes(html, ">OK<", "Compliance checklist");
assertIncludes(html, "5/5 proposal-stage requirements mapped", "Compliance checklist");
assertIncludes(html, "Mapped / Engineering Validation Required", "Compliance checklist");
assertIncludes(html, "Engineering validation required before final design release", "Compliance checklist");
assertNotIncludes(html, "Prepared by CCI Severe Service Solutions", "Cover branding");
assertNotIncludes(html, "CCI Severe Service Solutions</div>", "Cover branding");
assertIncludes(html, "Prepared by: WinsProposal Demo Engine", "Cover branding");
assertIncludes(html, "Prepared for: Demo Customer / Severe-Service Valve OEM", "Cover branding");
assertIncludes(html, "Bid Readiness Score", "Cover score");
assertIncludes(html, "78%", "Cover score");
assertIncludes(html, "Bid Readiness Score: 78%", "Bid score consistency");
assertNotIncludes(html, "Win Score", "Cover score");
assertNotIncludes(html, "42%</div>", "Cover score");
assertNotIncludes(html, "Bid Score 88%", "Bid score consistency");
assertNotIncludes(html, "final bid score 88%", "Bid score consistency");
assertIncludes(html, "Proposal Sections", "Cover score");
assertIncludes(html, "Proposal Status", "Cover score");
assertIncludes(html, "Draft / Demo", "Cover score");
assertIncludes(html, "5.0 days", "Executive ROI metrics");
assertIncludes(html, "2.8 days", "Executive ROI metrics");
assertIncludes(html, "64 hours", "Executive ROI metrics");
assertIncludes(html, "36 hours", "Executive ROI metrics");
assertIncludes(html, "14 hours", "Executive ROI metrics");
assertIncludes(html, "6 hours", "Executive ROI metrics");
assertIncludes(html, "INR 34-42 lakh", "Executive ROI metrics");
for (const badRoiClaim of ["INR 2.1 Cr", "INR 1.5 Cr", "INR 0.8 Cr", "INR 2 Cr", "INR 4 Cr", "INR 2 crore", "INR 4 crore", "₹2 Cr", "₹4 Cr"]) {
  assertNotIncludes(html, badRoiClaim, "Executive ROI narrative");
}
for (const commercialNeedle of ["Proposal validity: 60 days", "HV-H2-3101A/B/C/D", "FV-H2-3150A/B", "PV-H2-3190", "DOC-H2 MDR Dossier"]) {
  assertIncludes(html, commercialNeedle, "Commercial Summary");
}
for (const deliveryNeedle of ["Drawing submission", "Manufacturing lead time", "Inspection and testing", "Shipping readiness"]) {
  assertIncludes(html, deliveryNeedle, "Project Timeline & Delivery");
}
for (const drawingTitle of [
  "PFD-style Hydrogen Service System Topology",
  "P&ID-lite Control Loop",
  "Hydrogen Valve Package Schematic",
  "Material Traceability / MDR Workflow",
  "Inspection and Dossier Workflow",
]) {
  assert(
    html.includes(drawingTitle) || html.includes(drawingTitle.replace(/&/g, "&amp;")),
    `Drawing Intelligence PDF visuals: missing ${drawingTitle}`,
  );
}

const acronymChecks: Array<[string, string]> = [
  ["tbe_matrix", "TBE Matrix"],
  ["qa_dossier_workflow", "QA Dossier Workflow"],
  ["kpi_dashboard", "KPI Dashboard"],
  ["mdr package", "MDR Package"],
  ["itp qap mtc pmi nde fat asme isa iec nace", "ITP QAP MTC PMI NDE FAT ASME ISA IEC NACE"],
];
for (const [input, expected] of acronymChecks) {
  assert(formatArtifactTitle(input) === expected, `formatArtifactTitle(${input}): expected ${expected}, got ${formatArtifactTitle(input)}`);
}

for (const label of ["Customer Requirement", "Technical Compliance", "Delivery Confidence", "Risk Reduction", "Commercial Value", "Win Theme"]) {
  assertIncludes(html, label, "Executive Summary diagram");
}
for (const label of ["Hydrogen Hub Project", "Process Criticality", "Severe Service Valve Requirement", "Compliance Standards", "OEM/EPC Evaluation", "Bid Opportunity"]) {
  assertIncludes(html, label, "Project Background diagram");
}
assert(html.indexOf("Customer Requirement") < html.indexOf("Hydrogen Hub Project"), "Executive and background diagrams should be different and ordered");

for (const cssCheck of [
  "font-family: Arial, Inter, Helvetica, sans-serif",
  ".proposal-section { break-inside:avoid; page-break-inside:avoid;",
  "margin-bottom:28px",
  ".section-heading { display:flex",
  ".section-number { width:26px",
  ".section-title { font-size:15px",
  ".section-body { font-size:10.8pt",
  ".section-body p { margin:0 0 10px 0",
  ".compliance-table",
  ".die-card { display:block; background:white; border:1px solid #cbd5e1; border-radius:8px; margin:8px auto 12px;",
  ".die-card + .die-card { break-before: page; page-break-before: always; }",
  ".die-svg { width:100%; height:auto; display:block; background:white; margin:0 auto; overflow:visible; }",
  ".die-symbol-label { fill:#0f172a; font-size:10px;",
  "break-inside: avoid",
  "page-break-inside: avoid",
] as const) {
  assertIncludes(html, cssCheck, "PDF CSS");
}

async function main() {
  const root = process.cwd();
  const [pdfTemplate, docxRoute, pdfRoute] = await Promise.all([
    fs.readFile(path.join(root, "lib", "pdf-template.ts"), "utf8"),
    fs.readFile(path.join(root, "app", "api", "proposals", "[id]", "export-docx", "route.ts"), "utf8"),
    fs.readFile(path.join(root, "app", "api", "proposals", "[id]", "export-pdf", "route.ts"), "utf8"),
  ]);

  assertIncludes(pdfTemplate, "getCoverBranding", "PDF template");
  assertIncludes(pdfTemplate, "WinsProposal Demo Engine", "PDF template");
  assertIncludes(docxRoute, "proposal-stage requirements mapped", "DOCX export");
  assertIncludes(docxRoute, "Bid Readiness Score", "DOCX export");
  assertIncludes(pdfRoute, "Proposal-stage engineering estimate", "PDF footer");

  console.log(JSON.stringify({
    status: "passed",
    checks: {
      tocPageNumbers: "disabled",
      compliance: "proposal-stage mapped",
      coverBranding: "neutral demo branding",
      coverScore: "bid readiness score",
      acronyms: acronymChecks.map(([, expected]) => expected),
      diagrams: ["Executive Summary Win Theme", "Project Background Hydrogen Hub"],
      drawings: ["Hydrogen topology", "Hydrogen P&ID-lite", "Hydrogen valve package", "MDR workflow", "Inspection workflow"],
      css: "professional section formatting present",
    },
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
