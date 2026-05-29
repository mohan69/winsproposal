import { inferRfpIntelligence, ensureSevereServiceSections } from "../lib/severe-service-intelligence";
import { getBestVisualizationType } from "../lib/visualization-service";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const hydrogenRfp = {
  title: "Hydrogen Process Control Valve Package",
  summary: "Hydrogen export header control valve package with high-integrity sealing, leakage class requirements, material compatibility, traceability dossier, and hazardous area accessories.",
  industry: "Severe-Service Control Valves",
  lineItems: [
    { item: "HV-H2-3101A/B/C/D", description: "Hydrogen isolation and control valve assemblies", quantity: 4, service: "Hydrogen export header", specifications: "ASME B16.34, leakage class IV/V" },
    { item: "FV-H2-3150A/B", description: "Hydrogen flow control valves", quantity: 2, service: "Process control", specifications: "IEC 60534 / ISA 75.01 awareness" },
    { item: "PV-H2-3190", description: "Hydrogen pressure control valve", quantity: 1, service: "Export header pressure control" },
    { item: "DOC-H2", description: "Traceability and MDR dossier", quantity: 1 },
  ],
  processConditions: {
    fluid: "Hydrogen",
    inletPressure: "72 barg",
    outletPressure: "48 barg",
    temperature: "45 C",
    leakageClass: "Class V or project-specified",
  },
  complianceRequirements: ["ASME B16.34", "ISA 75.01 / IEC 60534", "material compatibility", "traceability"],
  engineeringReviewPoints: ["hydrogen compatibility", "embrittlement assumptions", "leakage class", "high-integrity sealing"],
};

const lngRfp = {
  title: "LNG Compressor Recycle Valve Package",
  summary: "Compressor recycle and anti-surge control valve package for LNG service with high pressure drop, fast response, severe-service trim, acoustic fatigue, noise, vibration, actuator and accessories.",
  industry: "Severe-Service Control Valves",
  lineItems: [
    { item: "XV-CRV-9101A/B/C", description: "LNG compressor recycle valves", quantity: 3, service: "Compressor recycle / anti-surge", specifications: "Fast response, severe-service trim" },
    { item: "ASP-9101A/B/C", description: "Anti-surge actuator and accessory package", quantity: 3 },
    { item: "DOC-9101", description: "Inspection, testing, and final documentation package", quantity: 1 },
  ],
  processConditions: {
    fluid: "LNG process gas",
    inletPressure: "95 barg",
    outletPressure: "32 barg",
    temperature: "-35 C",
  },
  complianceRequirements: ["ISA 75.01", "IEC 60534", "ASME B16.34", "noise review", "inspection and test plan"],
  engineeringReviewPoints: ["choked flow", "noise and vibration", "fast actuator response", "compressor protection"],
};

function runChecks() {
  const hydrogen = inferRfpIntelligence(hydrogenRfp);
  assert(hydrogen.application === "Hydrogen Process Control / Export Header Control", `Hydrogen misclassified as ${hydrogen.application}`);
  assert(!/refinery/i.test(hydrogen.application), "Hydrogen classified as refinery");
  const hydrogenSections = ensureSevereServiceSections([], hydrogen, hydrogenRfp);
  const hydrogenTitles = hydrogenSections.map((section: any) => section.title || section.sectionTitle);
  assert(hydrogenTitles.includes("Datasheet Summary"), "Hydrogen missing Datasheet Summary");
  assert(hydrogenTitles.includes("Drawings and Technical Visuals"), "Hydrogen missing Drawings and Technical Visuals");
  assert(hydrogenTitles.includes("Preliminary Engineering Calculation Summary"), "Hydrogen missing Calculation Summary");
  assert(hydrogen.vaultTerms.length > 0, "Hydrogen vault coverage terms missing");

  const lng = inferRfpIntelligence(lngRfp);
  assert(lng.application === "LNG Compressor Recycle / Anti-Surge", `LNG misclassified as ${lng.application}`);
  assert(!/general/i.test(lng.templateName), "LNG template fell back to General");
  const lngSections = ensureSevereServiceSections([], lng, lngRfp);
  assert(lngSections.length > 10, `LNG section count too low: ${lngSections.length}`);
  assert(lng.vaultTerms.length > 0, "LNG vault coverage terms missing");

  const scopeType = getBestVisualizationType("Scope of Supply / Line Items", "XV-CRV-9101A/B/C compressor recycle package", { templateType: lng.templateName });
  const qaType = getBestVisualizationType("QA/QC and Documentation Plan", "MDR dossier, inspection records, release governance", { templateType: lng.templateName });
  const timelineType = getBestVisualizationType("Project Timeline & Delivery", "drawing review, manufacturing, inspection, dispatch", { templateType: lng.templateName });
  const datasheetType = getBestVisualizationType("Datasheet Summary", "tag table with process conditions and leakage class", { templateType: hydrogen.templateName });
  assert(scopeType !== "gantt", `Scope should not be Gantt; got ${scopeType}`);
  assert(qaType !== "gantt", `QA should not be Gantt; got ${qaType}`);
  assert(timelineType === "gantt", `Timeline should be Gantt; got ${timelineType}`);
  assert(datasheetType === "tbe_matrix", `Datasheet should be TBE/matrix visual; got ${datasheetType}`);

  console.log("Severe-service proposal automation checks passed");
  console.log(`Hydrogen: ${hydrogen.templateName} | ${hydrogen.application} | sections=${hydrogenSections.length}`);
  console.log(`LNG: ${lng.templateName} | ${lng.application} | sections=${lngSections.length}`);
}

runChecks();
