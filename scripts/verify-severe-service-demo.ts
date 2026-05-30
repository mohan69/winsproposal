import fs from "node:fs/promises";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import * as mammoth from "mammoth";
import { buildEngineeringArtifact, renderArtifactForPdf } from "../lib/engineering-artifacts";
import { ensureSevereServiceSections, formatSevereServiceTemplateMetadata, inferRfpIntelligence } from "../lib/severe-service-intelligence";
import { getBestVisualizationType } from "../lib/visualization-service";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const legacyExportStrings = [
  "Client Requirement",
  "System Package",
  "Technical Interfaces",
  "Controls and QA",
  "Integrated Offer",
  "Process Input",
  "Engineering → Procurement → Fabrication",
  "Engineering -> Procurement -> Fabrication",
  "Generated from RFP intelligence and engineering review rules",
  "Pfd Style Flow | structured artifact table",
  "Pid Style Control Loop | structured artifact table",
  "Datasheet Summary - TBE Matrix",
];

const requiredExportStrings: Record<string, string[]> = {
  Hydrogen: [
    "Hydrogen Service System Topology",
    "P&ID-lite Control Loop",
    "Valve Package Schematic",
    "Material Traceability / MDR Workflow",
    "Proposal-stage technical drawing",
    "Not for construction",
  ],
  LNG: [
    "Compressor Recycle / Anti-Surge Architecture",
    "P&ID-lite Anti-Surge Control Loop",
    "Valve Package Schematic",
    "Acoustic / Noise Review Flow",
    "Proposal-stage technical drawing",
    "Not for construction",
  ],
};

const requiredBusinessExportStrings = [
  "Executive ROI Impact Summary",
  "RFP Extraction Intelligence",
  "Bid / No-Bid Scoring",
  "Commercial Summary",
];

function normalizeText(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(value: string) {
  return normalizeText(value.replace(/<[^>]+>/g, " "));
}

function assertNoLegacyExportText(text: string, context: string) {
  const normalized = normalizeText(text);
  for (const legacy of legacyExportStrings) {
    assert(!normalized.includes(legacy), `${context}: legacy fallback text leaked into export: ${legacy}`);
  }
}

function assertRequiredExportText(label: "Hydrogen" | "LNG", text: string, context: string) {
  const normalized = normalizeText(text);
  for (const required of requiredExportStrings[label]) {
    assert(normalized.includes(required), `${context}: required drawing text missing: ${required}`);
  }
}

function assertRequiredBusinessExportText(text: string, context: string) {
  const normalized = normalizeText(text);
  for (const required of requiredBusinessExportStrings) {
    assert(normalized.includes(required), `${context}: required business intelligence section missing: ${required}`);
  }
}

function extractPdfText(filePath: string) {
  const bundledPython = path.join(os.homedir(), ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "python", "python.exe");
  const candidates = [process.env.PYTHON, bundledPython, "python", "py"].filter(Boolean) as string[];
  const script = [
    "import sys",
    "from pypdf import PdfReader",
    "reader = PdfReader(sys.argv[1])",
    "print('\\n'.join(page.extract_text() or '' for page in reader.pages))",
  ].join("\n");
  let lastError: unknown = null;
  for (const candidate of candidates) {
    try {
      return execFileSync(candidate, ["-c", script, filePath], {
        encoding: "utf8",
        maxBuffer: 50 * 1024 * 1024,
      });
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`Unable to extract PDF text for ${filePath}: ${String(lastError)}`);
}

async function extractDocxText(buffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value ?? "";
}

const hydrogenRfp = {
  title: "Hydrogen Process Control Valve Package",
  summary: "Hydrogen process control valves for export header service with material compatibility, high-integrity sealing, leakage class, traceability dossier, and hazardous area accessories.",
  lineItems: [
    { item: "HV-H2-3101A/B/C/D", description: "Hydrogen isolation/control valve assemblies", quantity: 4, service: "Hydrogen export header", specifications: "Class 600, leakage class V" },
    { item: "FV-H2-3150A/B", description: "Hydrogen flow control valves", quantity: 2, service: "Hydrogen process flow control", specifications: "ISA 75.01 / IEC 60534" },
    { item: "PV-H2-3190", description: "Hydrogen pressure control valve", quantity: 1, service: "Export header pressure control" },
    { item: "DOC-H2", description: "Traceability and MDR dossier", quantity: 1 },
  ],
  processConditions: { fluid: "Hydrogen", inletPressure: "48 barg", outletPressure: "18 barg", temperature: "60 C", leakageClass: "Class V" },
  complianceRequirements: ["ASME B16.34", "ISA 75.01 / IEC 60534", "material compatibility", "traceability"],
};

const lngRfp = {
  title: "LNG Compressor Recycle Valve Package",
  summary: "LNG compressor recycle and anti-surge package with high pressure drop, choked-flow risk, acoustic fatigue, fast response duty, severe-service trim, actuator response, and inspection/test clauses.",
  lineItems: [
    { item: "XV-CRV-9101A/B/C", description: "LNG compressor recycle control valves", quantity: 3, service: "Compressor recycle / anti-surge", specifications: "Fast response, severe-service trim" },
    { item: "ASP-9101A/B/C", description: "Anti-surge actuator and accessory package", quantity: 3, service: "Fast-response accessory package" },
    { item: "DOC-9101", description: "Engineering, inspection, and documentation package", quantity: 1 },
  ],
  processConditions: { fluid: "LNG process gas", inletPressure: "95 barg", outletPressure: "32 barg", temperature: "-35 C", flowCases: "normal, recycle, emergency trip" },
  complianceRequirements: ["ISA 75.01", "IEC 60534", "ASME B16.34", "ITP", "noise review"],
};

function validateStatic(label: string, rfp: any) {
  const intel = inferRfpIntelligence(rfp);
  const templateType = formatSevereServiceTemplateMetadata(intel);
  const sections = ensureSevereServiceSections([], intel, rfp);
  const titles = sections.map((section: any) => section.title);
  assert(!/General/i.test(intel.templateName), `${label}: template fell back to General`);
  assert(titles.length >= 22, `${label}: expected 22+ sections`);
  assert(titles.includes("Executive ROI Impact Summary"), `${label}: missing ROI impact summary`);
  assert(titles.includes("RFP Extraction Intelligence"), `${label}: missing RFP extraction intelligence`);
  assert(titles.includes("Bid / No-Bid Scoring"), `${label}: missing bid/no-bid scoring`);
  assert(titles.includes("Commercial Summary"), `${label}: missing commercial summary`);
  assert(titles.includes("Datasheet Summary"), `${label}: missing datasheet summary`);
  assert(titles.includes("Preliminary Engineering Calculation Summary"), `${label}: missing calculation summary`);
  assert(titles.includes("Drawings and Technical Visuals"), `${label}: missing drawing package`);
  assert(intel.vaultTerms.length > 0, `${label}: vault matching terms missing`);
  if (label === "Hydrogen") {
    assert(/Hydrogen Process Control \/ Export Header Control/.test(intel.application), "Hydrogen: wrong application");
    assert(!/refinery/i.test(intel.application), "Hydrogen: incorrectly classified as refinery");
  }
  if (label === "LNG") {
    assert(/LNG Compressor Recycle \/ Anti-Surge/.test(intel.application), "LNG: wrong application");
  }

  const datasheet = buildEngineeringArtifact({ sectionTitle: "Datasheet Summary", templateType, extractedData: rfp });
  const calculation = buildEngineeringArtifact({ sectionTitle: "Preliminary Engineering Calculation Summary", templateType, extractedData: rfp });
  const drawings = buildEngineeringArtifact({ sectionTitle: "Drawings and Technical Visuals", templateType, extractedData: rfp });
  assert(datasheet?.artifactType === "datasheet_summary", `${label}: datasheet artifact missing`);
  if (!datasheet) throw new Error(`${label}: datasheet artifact missing`);
  assert((datasheet.tables?.[0]?.rows.length ?? 0) >= 3, `${label}: datasheet rows are not tag-specific`);
  assert(datasheet.tables?.[0]?.rows.some((row) => /H2|CRV|ASP|DOC/.test(row[0])), `${label}: datasheet tags missing`);
  assert(calculation?.artifactType === "calculation_summary", `${label}: calculation artifact missing`);
  if (!calculation) throw new Error(`${label}: calculation artifact missing`);
  assert((calculation.tables?.length ?? 0) >= 3, `${label}: calculation tables missing`);
  assert(drawings?.artifactType === "drawing_package", `${label}: drawing package missing`);
  if (!drawings) throw new Error(`${label}: drawing package missing`);
  assert((drawings.drawingPackages?.length ?? 0) >= 5, `${label}: drawing intelligence package too small`);
  const drawingTitles = drawings.drawingPackages?.map((drawing) => drawing.title).join(" | ") ?? "";
  const drawingTypes = drawings.drawingPackages?.map((drawing) => drawing.drawingType).join(" | ") ?? "";
  const calculationText = calculation.tables?.flatMap((table) => table.rows.flat()).join(" ") ?? "";
  const drawingExportText = stripHtml(renderArtifactForPdf(drawings));
  assertNoLegacyExportText(drawingExportText, `${label}: static drawing artifact`);
  assertRequiredExportText(label as "Hydrogen" | "LNG", drawingExportText, `${label}: static drawing artifact`);
  assert(/Proposal-stage technical drawing\. Not for construction/.test(drawings.drawingPackages?.[0]?.disclaimer ?? ""), `${label}: drawing disclaimer missing`);
  assert(drawings.drawingPackages?.every((drawing) => drawing.reviewStatus.includes("Engineering review required")), `${label}: default drawing review status missing`);
  assert(drawings.drawingPackages?.some((drawing) => drawing.symbols.some((symbol) => symbol.kind.includes("valve"))), `${label}: valve symbols missing`);
  assert(drawings.drawingPackages?.some((drawing) => drawing.connectors.some((connector) => connector.lineType === "instrument" || connector.lineType === "pneumatic")), `${label}: signal lines missing`);
  if (label === "Hydrogen") {
    assert(/Hydrogen Service System Topology/.test(drawingTitles), "Hydrogen: topology drawing missing");
    assert(/P&ID-lite Control Loop/.test(drawingTitles), "Hydrogen: P&ID-lite control loop missing");
    assert(/Hydrogen Valve Package Schematic/.test(drawingTitles), "Hydrogen: valve package schematic missing");
    assert(/Material Traceability \/ MDR Workflow/.test(drawingTitles), "Hydrogen: MDR workflow missing");
    assert(/Inspection and Dossier Workflow/.test(drawingTitles), "Hydrogen: inspection and dossier workflow missing");
    assert(/pfd_style_flow/.test(drawingTypes) && /pid_lite_control_loop/.test(drawingTypes), "Hydrogen: drawing types missing");
    for (const expected of ["Hydrogen-rich process gas", "48 barg", "18 barg", "60°C", "Class V requested for selected tags"]) {
      assert(calculationText.includes(expected), `Hydrogen: calculation summary missing ${expected}`);
    }
  }
  if (label === "LNG") {
    assert(/Compressor Recycle \/ Anti-Surge Architecture/.test(drawingTitles), "LNG: compressor recycle architecture missing");
    assert(/P&ID-lite Anti-Surge Control Loop/.test(drawingTitles), "LNG: anti-surge loop missing");
    assert(/LNG Valve Package Schematic/.test(drawingTitles), "LNG: valve package schematic missing");
    assert(/Acoustic \/ Noise Review Flow/.test(drawingTitles), "LNG: acoustic/noise flow missing");
    assert(/Inspection and Test Workflow/.test(drawingTitles), "LNG: inspection and test workflow missing");
    for (const expected of ["Natural gas rich LNG process gas", "92 barg normal / 108 barg design", "34 barg normal", "-28°C to 45°C", "Class IV minimum; tighter class subject to final engineering review"]) {
      assert(calculationText.includes(expected), `LNG: calculation summary missing ${expected}`);
    }
  }

  const scopeType = getBestVisualizationType("Scope of Supply / Line Items", "tag package line item tree", { templateType });
  const qaType = getBestVisualizationType("QA/QC and Documentation Plan", "MDR dossier workflow", { templateType });
  const timelineType = getBestVisualizationType("Project Timeline & Delivery", "delivery schedule", { templateType });
  const datasheetType = getBestVisualizationType("Datasheet Summary", "native datasheet table", { templateType });
  assert(scopeType !== "gantt", `${label}: scope visual should not be Gantt`);
  assert(qaType !== "gantt", `${label}: QA visual should not be Gantt`);
  assert(timelineType === "gantt", `${label}: timeline visual should be Gantt`);
  assert(datasheetType === "tbe_matrix", `${label}: datasheet visual should be matrix/table`);
  return { templateType, sections: titles.length, datasheetRows: datasheet.tables?.[0]?.rows.length, drawings: drawings.drawingPackages?.map((drawing) => drawing.title) };
}

async function fetchJson(base: string, cookieRef: { value: string }, pathname: string, opts: RequestInit = {}) {
  const res = await fetch(base + pathname, { ...opts, headers: { ...(opts.headers ?? {}), cookie: cookieRef.value } });
  const setCookie = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const cookie of setCookie) cookieRef.value += `${cookieRef.value ? "; " : ""}${cookie.split(";")[0]}`;
  if (!res.ok) throw new Error(`${pathname} failed: ${res.status} ${await res.text()}`);
  return res;
}

async function runLiveExportCheck() {
  if (process.env.VERIFY_LIVE_EXPORTS !== "true") return null;
  const base = process.env.VERIFY_LIVE_BASE || "http://localhost:3000";
  const email = process.env.VERIFY_LIVE_EMAIL || "proposal.director@cci-demo.winsproposal.local";
  const password = process.env.VERIFY_LIVE_PASSWORD || "Demo@12345";
  const cookie = { value: "" };
  const csrfRes = await fetchJson(base, cookie, "/api/auth/csrf");
  const csrf = await csrfRes.json();
  await fetchJson(base, cookie, "/api/auth/callback/credentials?json=true", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrfToken: csrf.csrfToken, email, password, redirect: "false", json: "true" }),
  });
  const rfpRes = await fetchJson(base, cookie, "/api/rfp");
  const rfps = await rfpRes.json();
  const targets = [
    { label: "Hydrogen", match: /Hydrogen Process Control Valve Package/i },
    { label: "LNG", match: /LNG Compressor Recycle Valve Package/i },
  ];
  const outputDir = path.resolve("tmp_export_review", `verify-severe-service-${Date.now()}`);
  await fs.mkdir(outputDir, { recursive: true });
  const results = [];
  for (const target of targets) {
    const rfp = rfps.find((item: any) => target.match.test(item.extractedData?.title || item.filename || ""));
    assert(rfp, `${target.label}: RFP not found in live environment`);
    const gen = await fetchJson(base, cookie, "/api/proposals/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rfpId: rfp.id, templateType: "auto", companySize: "enterprise" }),
    });
    const reader = gen.body?.getReader();
    assert(reader, `${target.label}: generation stream missing`);
    if (!reader) throw new Error(`${target.label}: generation stream missing`);
    const decoder = new TextDecoder();
    let partial = "";
    let proposal: any = null;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      partial += decoder.decode(value, { stream: true });
      const lines = partial.split("\n");
      partial = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6);
        if (payload === "[DONE]") continue;
        const parsed = JSON.parse(payload);
        if (parsed.status === "completed") proposal = parsed.result.proposal;
        if (parsed.status === "error") throw new Error(parsed.message);
      }
    }
    assert(proposal, `${target.label}: proposal generation did not complete`);
    assert((proposal.sections?.length ?? 0) >= 18, `${target.label}: live proposal sections too low`);
    assert(proposal.vaultSectionsUsed > 0, `${target.label}: live vault coverage is zero`);
    for (const kind of ["pdf", "docx"] as const) {
      const route = kind === "pdf" ? "export-pdf" : "export-docx";
      const res = await fetchJson(base, cookie, `/api/proposals/${proposal.id}/${route}?includeDiagrams=true`);
      const buffer = Buffer.from(await res.arrayBuffer());
      assert(buffer.length > 10000, `${target.label}: ${kind} export too small`);
      const filePath = path.join(outputDir, `${target.label.toLowerCase()}-${proposal.id}.${kind}`);
      await fs.writeFile(filePath, buffer);
      const text = kind === "docx" ? await extractDocxText(buffer) : extractPdfText(filePath);
      assertNoLegacyExportText(text, `${target.label}: ${kind.toUpperCase()} export`);
      assertRequiredExportText(target.label as "Hydrogen" | "LNG", text, `${target.label}: ${kind.toUpperCase()} export`);
      assertRequiredBusinessExportText(text, `${target.label}: ${kind.toUpperCase()} export`);
    }
    results.push({ label: target.label, proposalId: proposal.id, templateType: proposal.templateType, sections: proposal.sections.length, vaultSectionsUsed: proposal.vaultSectionsUsed });
  }
  return { outputDir, results };
}

async function main() {
  const enterpriseSeed = await fs.readFile(path.resolve("scripts/seed-enterprise-demo.ts"), "utf8");
  for (const expectedDemo of [
    "FlowServe Industrial Valves Pvt Ltd",
    "AquaDyn Pumps India Ltd",
    "Zenith EPC Solutions",
    "VectorLoop Industrial Automation Pvt Ltd",
    "Industrial Automation Control System Upgrade",
  ]) {
    assert(enterpriseSeed.includes(expectedDemo), `Enterprise demo seed missing ${expectedDemo}`);
  }
  const staticResults = {
    hydrogen: validateStatic("Hydrogen", hydrogenRfp),
    lng: validateStatic("LNG", lngRfp),
  };
  const liveResults = await runLiveExportCheck();
  console.log(JSON.stringify({ status: "passed", staticResults, liveResults }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
