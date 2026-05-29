export const SEVERE_SERVICE_DISCLAIMER =
  "Preliminary proposal-stage engineering estimate. Final sizing/design must be validated by qualified engineers using company-approved tools and standards.";

export type SevereServiceApplicationId =
  | "lng-compressor-recycle"
  | "hydrogen-process-control"
  | "refinery-severe-service"
  | "steam-conditioning"
  | "severe-service-control-valve";

export type RfpIntelligence = {
  isSevereServiceValve: boolean;
  applicationId: SevereServiceApplicationId;
  industryLabel: string;
  equipmentCategory: string;
  valveType: string;
  application: string;
  serviceType: string;
  packageType: string;
  templateName: string;
  confidence: "high" | "medium" | "low";
  keywords: string[];
  standardsDetected: string[];
  keyRisks: string[];
  recommendedSections: string[];
  recommendedVisuals: string[];
  recommendedEngineeringOutputs: string[];
  vaultTerms: string[];
  tbeTags: string[];
  complianceItems: Array<{ id: string; label: string; standard: string }>;
};

export const SEVERE_SERVICE_SECTION_SPECS = [
  ["Executive Summary", "Management-ready summary of customer scope, severe-service response, differentiators, compliance confidence, and bid value drivers."],
  ["Project Background / Opportunity Context", "Project context, process objective, reliability drivers, customer pain points, and proposal opportunity framing."],
  ["Scope of Supply / Line Items", "Tag-wise scope, quantities, accessories, documentation scope, exclusions, assumptions, and package boundaries."],
  ["Process Conditions / Service Conditions", "Extracted process conditions, service envelope, fluid phase, pressures, temperature, leakage class, and missing data."],
  ["Technical Specification Response", "Structured response to technical requirements, standards, materials, leakage, actuator, accessory, documentation, and delivery clauses."],
  ["Engineering Basis", "Application classification, severe-service basis, dependency map, standards awareness, engineering review inputs, and governance."],
  ["Preliminary Engineering Calculation Summary", "Proposal-stage calculation summary, pressure-drop severity, indicative Cv/Kv placeholder, risk flags, assumptions, and validation checklist."],
  ["Valve Configuration / Trim / Actuator / Accessories", "Preliminary valve configuration, severe-service trim basis, actuator/accessory package, fail action, controls, and instrumentation notes."],
  ["Datasheet Summary", "Proposal-stage datasheet table for each tag or line item with service, conditions, class, leakage, configuration, accessories, documents, and review status."],
  ["Compliance Matrix", "Clause and standards coverage matrix with compliance status, evidence, deviation status, and responsible review owner."],
  ["Technical Bid Evaluation Summary", "TBE-style technical response across material, trim, pressure class, actuator, accessories, testing, inspection, documents, deviations, and comments."],
  ["Inspection and Testing Plan", "ITP stages, hydrotest, seat leakage, functional stroke, PMI/NDE where applicable, accessory checks, witness/hold points, and final inspection."],
  ["QA/QC and Documentation Plan", "Quality gates, material traceability, certificates, MDR/data book, calculation package, drawing review, release governance, and dossier workflow."],
  ["Drawings and Technical Visuals", "Proposal-grade visual set including process topology, valve package architecture, control loop, dependency map, risk tree, ITP workflow, schedule, and KPI dashboard."],
  ["Deviations / Clarifications", "Clarification register, possible deviations, missing data, assumptions, client questions, impacts, and approval path."],
  ["Risk Assessment", "Severe-service risk register covering choked-flow/cavitation/flashing/noise, material compatibility, actuator response, inspection, schedule, and compliance risks."],
  ["Project Timeline & Delivery", "Execution schedule from drawing review through engineering validation, procurement, manufacturing, inspection, testing, dispatch, and document handover."],
  ["Executive Dashboard Snapshot", "Management KPI snapshot covering bid value, turnaround reduction, content reuse, compliance coverage, engineering hours saved, TBE completion, approvals, risk, and win probability."],
] as const;

const TEMPLATE_FAMILY: Record<SevereServiceApplicationId, Omit<RfpIntelligence, "isSevereServiceValve" | "confidence" | "keywords" | "standardsDetected" | "recommendedSections">> = {
  "lng-compressor-recycle": {
    applicationId: "lng-compressor-recycle",
    industryLabel: "Severe-Service Control Valves",
    equipmentCategory: "Control Valve Package",
    valveType: "Compressor Recycle / Anti-Surge Control Valve",
    application: "LNG Compressor Recycle / Anti-Surge",
    serviceType: "Fast-response compressor protection and recycle service",
    packageType: "Severe-Service Control Valve Proposal",
    templateName: "LNG Compressor Recycle / Anti-Surge Proposal",
    keyRisks: ["High pressure drop", "Fast response", "Choked-flow review", "Noise and vibration", "Acoustic fatigue", "LNG reliability exposure"],
    recommendedVisuals: ["Compressor recycle architecture", "Fast response control loop", "Severe-service trim decision flow", "Acoustic/noise risk review", "Inspection/test workflow"],
    recommendedEngineeringOutputs: ["Application classification", "Preliminary calculation summary", "Trim/actuator/accessory narrative", "Datasheet summary", "TBE matrix", "Risk/deviation register"],
    vaultTerms: ["lng", "compressor recycle", "anti surge", "fast response", "acoustic fatigue", "severe service trim", "actuator accessory package", "noise"],
    tbeTags: ["compressor-recycle", "anti-surge", "fast-response", "severe-service-trim", "noise", "actuator", "inspection"],
    complianceItems: [
      { id: "ssv-isa-iec", label: "Control valve sizing standard awareness included", standard: "ISA 75.01 / IEC 60534" },
      { id: "lng-fast-response", label: "Compressor recycle/anti-surge response requirements addressed", standard: "Project anti-surge control philosophy" },
      { id: "lng-noise", label: "Noise, vibration, and acoustic fatigue risks reviewed", standard: "Project noise specification / IEC 60534 awareness" },
      { id: "ssv-asme", label: "Pressure-temperature considerations included", standard: "ASME B16.34" },
      { id: "ssv-itp", label: "Inspection and test requirements mapped", standard: "Project ITP / hydrotest / leakage / functional testing" },
    ],
  },
  "hydrogen-process-control": {
    applicationId: "hydrogen-process-control",
    industryLabel: "Severe-Service Control Valves",
    equipmentCategory: "Hydrogen Control Valve Package",
    valveType: "Hydrogen Process / Export Header Control Valve",
    application: "Hydrogen Process Control / Export Header Control",
    serviceType: "Hydrogen process control, high-integrity sealing, and traceability service",
    packageType: "Severe-Service Control Valve Proposal",
    templateName: "Hydrogen Process Control Valve Proposal",
    keyRisks: ["Hydrogen compatibility", "Material compatibility", "Leakage class", "High-integrity sealing", "Traceability", "Process safety"],
    recommendedVisuals: ["Hydrogen service system topology", "Material compatibility flow", "Traceability/dossier workflow", "Control valve/accessory architecture", "Compliance matrix"],
    recommendedEngineeringOutputs: ["Hydrogen compatibility notes", "Leakage/sealing response", "Datasheet summary", "Traceability dossier plan", "TBE matrix", "Validation checklist"],
    vaultTerms: ["hydrogen", "h2", "leakage class", "high integrity sealing", "traceability", "hazardous area accessories", "material compatibility", "embrittlement"],
    tbeTags: ["hydrogen", "leakage-class", "material-compatibility", "traceability", "high-integrity-sealing", "accessories", "documentation"],
    complianceItems: [
      { id: "h2-materials", label: "Hydrogen material compatibility reviewed", standard: "Project material specification / ASME B16.34 awareness" },
      { id: "h2-leakage", label: "Leakage class and high-integrity sealing response included", standard: "Project leakage class / IEC 60534 awareness" },
      { id: "h2-traceability", label: "Material traceability and dossier workflow included", standard: "Project QA/QC and MDR requirements" },
      { id: "ssv-isa-iec", label: "Control valve sizing standard awareness included", standard: "ISA 75.01 / IEC 60534" },
      { id: "ssv-disclaimer", label: "Proposal-stage engineering disclaimer included", standard: "Engineering governance" },
    ],
  },
  "refinery-severe-service": {
    applicationId: "refinery-severe-service",
    industryLabel: "Severe-Service Control Valves",
    equipmentCategory: "Severe-Service Control Valve Package",
    valveType: "Refinery Severe-Service Control Valve",
    application: "Refinery Severe-Service",
    serviceType: "High differential pressure refinery letdown and severe-service control",
    packageType: "Severe-Service Control Valve Proposal",
    templateName: "Refinery Severe-Service Control Valve Proposal",
    keyRisks: ["Cavitation", "Flashing", "High differential pressure", "NACE/sour service", "Erosion/corrosion", "Hydrotest and QA/QC"],
    recommendedVisuals: ["Process letdown flow", "Cavitation/flashing risk tree", "NACE/sour-service compliance flow", "Inspection/test workflow", "Deviation decision tree"],
    recommendedEngineeringOutputs: ["Cavitation/flashing narrative", "NACE applicability notes", "Material/trim response", "Preliminary calculation summary", "TBE matrix"],
    vaultTerms: ["refinery", "cavitation", "flashing", "nace", "sour service", "erosion", "corrosion", "hydrotest", "qa qc"],
    tbeTags: ["refinery", "cavitation", "flashing", "nace", "erosion", "hydrotest", "deviation"],
    complianceItems: [
      { id: "ref-cavitation", label: "Cavitation/flashing risk response included", standard: "ISA 75.01 / IEC 60534 awareness" },
      { id: "ref-nace", label: "Sour-service material restrictions reviewed where applicable", standard: "NACE MR0175 / ISO 15156" },
      { id: "ssv-asme", label: "Pressure-temperature considerations included", standard: "ASME B16.34" },
      { id: "ssv-itp", label: "Hydrotest, leakage, inspection, and QA/QC requirements mapped", standard: "Project ITP / API or project-specific test references" },
      { id: "ssv-disclaimer", label: "Proposal-stage engineering disclaimer included", standard: "Engineering governance" },
    ],
  },
  "steam-conditioning": {
    applicationId: "steam-conditioning",
    industryLabel: "Severe-Service Control Valves",
    equipmentCategory: "Steam Conditioning Valve Package",
    valveType: "Steam Conditioning / Desuperheating Valve",
    application: "Steam Conditioning",
    serviceType: "Steam pressure letdown, temperature control, and desuperheating service",
    packageType: "Severe-Service Control Valve Proposal",
    templateName: "Steam Conditioning Valve Proposal",
    keyRisks: ["Steam pressure letdown", "Desuperheating", "Noise attenuation", "Thermal cycling", "Spray water control", "Actuator/control accessories"],
    recommendedVisuals: ["Steam conditioning arrangement", "Pressure letdown/desuperheating flow", "Thermal cycling review workflow", "Noise attenuation review", "Inspection/test workflow"],
    recommendedEngineeringOutputs: ["Steam conditioning narrative", "Noise/thermal cycling risk review", "Actuator/accessory narrative", "Datasheet summary", "Validation checklist"],
    vaultTerms: ["steam conditioning", "desuperheating", "pressure letdown", "thermal cycling", "noise attenuation", "spray water", "actuator controls"],
    tbeTags: ["steam-conditioning", "desuperheating", "pressure-letdown", "thermal-cycling", "noise", "accessories", "testing"],
    complianceItems: [
      { id: "steam-letdown", label: "Steam letdown and desuperheating response included", standard: "Project steam conditioning specification" },
      { id: "steam-noise", label: "Noise attenuation and thermal cycling risk reviewed", standard: "Project noise specification / severe-service review" },
      { id: "ssv-isa-iec", label: "Control valve sizing standard awareness included", standard: "ISA 75.01 / IEC 60534" },
      { id: "ssv-asme", label: "Pressure-temperature considerations included", standard: "ASME B16.34" },
      { id: "ssv-itp", label: "Inspection and test requirements mapped", standard: "Project ITP / functional testing" },
    ],
  },
  "severe-service-control-valve": {
    applicationId: "severe-service-control-valve",
    industryLabel: "Severe-Service Control Valves",
    equipmentCategory: "Control Valve Package",
    valveType: "Severe-Service Control Valve",
    application: "Severe-Service Control Valve",
    serviceType: "Severe-service flow control",
    packageType: "Severe-Service Control Valve Proposal",
    templateName: "Severe-Service Control Valve Proposal",
    keyRisks: ["High pressure drop", "Choked flow", "Cavitation/flashing", "Noise/vibration", "Materials", "Inspection/testing"],
    recommendedVisuals: ["Severe-service application flow", "Valve package architecture", "Calculation validation workflow", "Compliance matrix", "Risk tree"],
    recommendedEngineeringOutputs: ["Application classification", "Preliminary calculation summary", "Datasheet summary", "Compliance matrix", "TBE matrix", "Risk register"],
    vaultTerms: ["severe service", "control valve", "trim", "actuator", "inspection", "testing", "compliance", "deviation", "documentation"],
    tbeTags: ["severe-service", "control-valve", "trim", "actuator", "inspection", "documentation", "deviation"],
    complianceItems: [
      { id: "ssv-isa-iec", label: "Control valve sizing standard awareness included", standard: "ISA 75.01 / IEC 60534" },
      { id: "ssv-asme", label: "Pressure-temperature considerations included", standard: "ASME B16.34" },
      { id: "ssv-itp", label: "Inspection and test plan requirements mapped", standard: "Project ITP / test references" },
      { id: "ssv-disclaimer", label: "Proposal-stage engineering disclaimer included", standard: "Engineering governance" },
    ],
  },
};

function normalizeText(value: string) {
  return (value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function flattenExtractedData(extractedData: any) {
  return [
    extractedData?.title,
    extractedData?.summary,
    extractedData?.industry,
    JSON.stringify(extractedData?.processConditions ?? {}),
    JSON.stringify(extractedData?.requirements ?? []),
    JSON.stringify(extractedData?.lineItems ?? []),
    JSON.stringify(extractedData?.complianceRequirements ?? []),
    JSON.stringify(extractedData?.technicalSpecifications ?? []),
    JSON.stringify(extractedData?.engineeringReviewPoints ?? []),
    JSON.stringify(extractedData?.inspectionTestingRequirements ?? []),
    JSON.stringify(extractedData?.deliverables ?? []),
  ].filter(Boolean).join(" ");
}

function score(text: string, patterns: RegExp[]) {
  return patterns.reduce((total, pattern) => total + (pattern.test(text) ? 1 : 0), 0);
}

function detectedStandards(text: string) {
  const standards = [
    [/isa\s*75\.?01/i, "ISA 75.01"],
    [/iec\s*60534/i, "IEC 60534"],
    [/nace\s*mr0175/i, "NACE MR0175"],
    [/iso\s*15156/i, "ISO 15156"],
    [/asme\s*b16\.?34/i, "ASME B16.34"],
    [/\bapi\b|hydrotest|seat leakage|itp/i, "API / project-specific test references"],
  ] as const;
  return standards.filter(([pattern]) => pattern.test(text)).map(([, label]) => label);
}

export function inferRfpIntelligence(extractedData: any): RfpIntelligence {
  const raw = flattenExtractedData(extractedData);
  const text = raw.toLowerCase();
  const keywordHits: string[] = [];
  const addHits = (patterns: RegExp[], label: string) => {
    if (patterns.some((pattern) => pattern.test(text))) keywordHits.push(label);
  };

  const hydrogenScore = score(text, [
    /\bhydrogen\b/, /\bh2\b|hv h2|fv h2|pv h2|doc h2|h2[-\s]?\d/i, /export header/, /high[-\s]?integrity sealing/,
    /leakage class/, /traceability|dossier/, /embrittlement/, /material compatibility/, /hazardous area/,
  ]);
  const lngScore = score(text, [
    /\blng\b/, /compressor recycle/, /anti[-\s]?surge/, /\bcrv\b|xv crv|asp[-\s]?\d/i, /fast[-\s]?response|fast[-\s]?acting/,
    /compressor protection|compressor trip/, /acoustic fatigue/, /recycle valve/,
  ]);
  const steamScore = score(text, [
    /steam conditioning/, /desuperheat|desuperheating/, /spray water/, /superheated steam/, /thermal cycling/,
    /steam pressure letdown/, /temperature control/,
  ]);
  const refineryScore = score(text, [
    /refinery/, /cavitation/, /flashing/, /sour service|sour[-\s]?service/, /nace/, /erosion/, /corrosion/, /hydrotest/,
  ]);
  const severeScore = score(text, [
    /severe[-\s]?service/, /control valve/, /trim/, /actuator/, /high[-\s]?pressure drop|high[-\s]?differential/,
    /choked flow|choked/, /noise|vibration/, /isa\s*75\.?01|iec\s*60534|asme\s*b16\.?34/,
  ]);

  addHits([/hydrogen/, /\bh2\b|hv h2|fv h2|pv h2/i, /export header/, /leakage class/, /traceability/], "hydrogen");
  addHits([/\blng\b/, /compressor recycle/, /anti[-\s]?surge/, /fast[-\s]?response/], "lng-compressor-recycle");
  addHits([/steam conditioning/, /desuperheat/, /thermal cycling/], "steam-conditioning");
  addHits([/refinery/, /cavitation/, /flashing/, /nace/, /sour service/], "refinery-severe-service");
  addHits([/severe[-\s]?service/, /control valve/, /trim/, /actuator/, /pressure drop/, /choked/, /noise/], "severe-service-control-valve");

  let applicationId: SevereServiceApplicationId = "severe-service-control-valve";
  if (hydrogenScore >= 2) applicationId = "hydrogen-process-control";
  else if (lngScore >= 2) applicationId = "lng-compressor-recycle";
  else if (steamScore >= 2) applicationId = "steam-conditioning";
  else if (refineryScore >= 2) applicationId = "refinery-severe-service";
  else if (lngScore > 0) applicationId = "lng-compressor-recycle";
  else if (hydrogenScore > 0) applicationId = "hydrogen-process-control";
  else if (steamScore > 0) applicationId = "steam-conditioning";
  else if (refineryScore > 0) applicationId = "refinery-severe-service";

  const totalSignal = hydrogenScore + lngScore + steamScore + refineryScore + severeScore;
  const isSevereServiceValve = totalSignal > 0 || /valve|trim|actuator|iec 60534|isa 75\.?01|asme b16\.?34/.test(text);
  const confidence = totalSignal >= 5 ? "high" : totalSignal >= 2 ? "medium" : "low";
  const template = TEMPLATE_FAMILY[isSevereServiceValve ? applicationId : "severe-service-control-valve"];
  const standards = detectedStandards(raw);

  return {
    ...template,
    isSevereServiceValve,
    confidence,
    keywords: Array.from(new Set(keywordHits)),
    standardsDetected: standards.length ? standards : ["ISA 75.01 / IEC 60534 awareness", "ASME B16.34 awareness", "Project-specific inspection/test references"],
    recommendedSections: SEVERE_SERVICE_SECTION_SPECS.map(([title]) => title),
  };
}

export function formatSevereServiceTemplateMetadata(intelligence: RfpIntelligence) {
  return `${intelligence.templateName} | Application: ${intelligence.application} | Industry: ${intelligence.industryLabel} | Package Type: ${intelligence.packageType}`;
}

export function parseProposalTemplateMetadata(templateType?: string | null) {
  const raw = templateType || "General";
  const parts = raw.split("|").map((part) => part.trim()).filter(Boolean);
  const first = parts[0] || raw;
  const read = (label: string) => {
    const found = parts.find((part) => part.toLowerCase().startsWith(`${label.toLowerCase()}:`));
    return found ? found.slice(found.indexOf(":") + 1).trim() : "";
  };
  return {
    template: first.replace(/^Template:\s*/i, "") || "General",
    application: read("Application"),
    industry: read("Industry"),
    packageType: read("Package Type"),
    raw,
  };
}

export function getSevereServiceSectionSpecs() {
  return SEVERE_SERVICE_SECTION_SPECS.map(([title, description]) => ({ title, description }));
}

function valueFromObject(item: any, keys: string[]) {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value);
  }
  return "";
}

function formatLineItemRows(extractedData: any) {
  const lineItems = Array.isArray(extractedData?.lineItems) ? extractedData.lineItems : [];
  if (!lineItems.length) return "";
  const process = extractedData?.processConditions ?? {};
  const rows = lineItems.map((item: any) => {
    const tag = valueFromObject(item, ["tag", "item", "ref", "lineItem"]) || "TBD";
    const description = valueFromObject(item, ["description", "itemDescription", "service"]) || "Control valve package item";
    const qty = valueFromObject(item, ["quantity", "qty"]) || "TBD";
    const sizeClass = valueFromObject(item, ["sizeClass", "size", "pressureClass", "class", "specifications"]) || "Requires confirmation";
    const service = valueFromObject(item, ["service", "application"]) || valueFromObject(process, ["service", "fluid"]) || "Requires confirmation";
    const fluid = valueFromObject(item, ["fluid"]) || valueFromObject(process, ["fluid", "serviceFluid"]) || "Per RFP";
    const inlet = valueFromObject(item, ["inletPressure", "p1"]) || valueFromObject(process, ["inletPressure", "upstreamPressure", "p1"]) || "TBD";
    const outlet = valueFromObject(item, ["outletPressure", "p2"]) || valueFromObject(process, ["outletPressure", "downstreamPressure", "p2"]) || "TBD";
    const temperature = valueFromObject(item, ["temperature", "temp"]) || valueFromObject(process, ["temperature", "operatingTemperature"]) || "TBD";
    const leakage = valueFromObject(item, ["leakageClass"]) || valueFromObject(process, ["leakageClass"]) || "Per RFP";
    return `| ${tag} | ${description} | ${qty} | ${sizeClass} | ${service} | ${fluid} | ${inlet} / ${outlet} | ${temperature} | ${leakage} | Proposal-stage review |`;
  });
  return [
    "| Tag / Ref | Item Description | Qty | Size / Class | Service | Fluid | Inlet / Outlet Pressure | Temperature | Leakage Class | Review Status |",
    "|---|---:|---:|---|---|---|---|---|---|---|",
    ...rows,
  ].join("\n");
}

function formatProcessConditions(extractedData: any) {
  const conditions = extractedData?.processConditions ?? {};
  const entries = Object.entries(conditions).filter(([, value]) => value !== undefined && value !== null && String(value).trim());
  if (!entries.length) return "Process inputs are partially defined. Final sizing inputs require engineer confirmation before certified design.";
  return entries.map(([key, value]) => `- ${key}: ${String(value)}`).join("\n");
}

function calculationSummary(intelligence: RfpIntelligence, extractedData: any) {
  const process = extractedData?.processConditions ?? {};
  const fluid = valueFromObject(process, ["fluid", "serviceFluid", "service"]) || (intelligence.applicationId === "hydrogen-process-control" ? "Hydrogen service" : "Per RFP");
  const p1 = valueFromObject(process, ["inletPressure", "upstreamPressure", "p1"]) || "TBD";
  const p2 = valueFromObject(process, ["outletPressure", "downstreamPressure", "p2"]) || "TBD";
  const temperature = valueFromObject(process, ["temperature", "operatingTemperature"]) || "TBD";
  const leakage = valueFromObject(process, ["leakageClass"]) || "Per RFP";
  return `${SEVERE_SERVICE_DISCLAIMER}

| Input | Proposal-Stage Value |
|---|---|
| Fluid / service | ${fluid} |
| Inlet pressure | ${p1} |
| Outlet pressure | ${p2} |
| Pressure drop severity | ${intelligence.applicationId === "lng-compressor-recycle" ? "High; fast-response compressor recycle review required" : intelligence.applicationId === "hydrogen-process-control" ? "Moderate to high; validate leakage and material compatibility basis" : "Severe-service review required"} |
| Temperature | ${temperature} |
| Leakage class | ${leakage} |
| Indicative Cv/Kv | Placeholder only; not certified final sizing |

Risk flags: ${intelligence.keyRisks.join(", ")}.

Engineering validation checklist: confirm final process cases, fluid properties, pressure class, valve sizing per ISA 75.01 / IEC 60534, pressure-temperature suitability per ASME B16.34, material restrictions including NACE MR0175 / ISO 15156 where applicable, actuator response/fail action, noise/vibration review, leakage class, inspection/test requirements, and approved company sizing-tool output.`;
}

function drawingGallery(intelligence: RfpIntelligence) {
  return [
    `${SEVERE_SERVICE_DISCLAIMER}`,
    "",
    "Recommended proposal visuals:",
    ...intelligence.recommendedVisuals.map((visual) => `- ${visual}`),
    "- Valve assembly / accessory block diagram",
    "- Engineering validation workflow",
    "- Compliance/TBE matrix",
    "- Project delivery schedule",
  ].join("\n");
}

export function ensureSevereServiceSections(sections: any[], intelligence: RfpIntelligence, extractedData: any) {
  if (!intelligence.isSevereServiceValve) return sections;
  const existing = new Map((sections ?? []).map((section) => [normalizeText(section?.title ?? ""), section]));
  const lineItemRows = formatLineItemRows(extractedData);
  const sectionContent: Record<string, string> = {
    "Executive Summary": `WinsProposal has classified this RFP as ${intelligence.application} and prepared the response as engineering proposal intelligence for severe-service control valves. The proposal response focuses on reducing proposal engineering effort, preserving application knowledge, improving compliance/TBE quality, and giving management a clear technical risk view.\n\n${SEVERE_SERVICE_DISCLAIMER}`,
    "Project Background / Opportunity Context": `The opportunity is aligned to ${intelligence.serviceType}. The proposal should emphasize process reliability, severe-service application knowledge, standards awareness, technical compliance, and controlled deviation handling.`,
    "Scope of Supply / Line Items": lineItemRows || "Tag-wise scope requires confirmation from the RFP line-item schedule. Proposal response should separate valve bodies, trim, actuators, accessories, documentation, inspection, testing, and exclusions.",
    "Process Conditions / Service Conditions": formatProcessConditions(extractedData),
    "Technical Specification Response": `The response should address ${intelligence.valveType}, applicable standards (${intelligence.standardsDetected.join(", ")}), trim/actuator/accessory requirements, documentation, inspection/testing, and all deviations or clarifications required for proposal-stage release.`,
    "Engineering Basis": `Application classification: ${intelligence.application}. Equipment category: ${intelligence.equipmentCategory}. Service type: ${intelligence.serviceType}. Key engineering dependencies include final process data, fluid properties, pressure class, leakage class, material compatibility, actuator response, accessory specification, inspection/testing requirements, and engineering approval.`,
    "Preliminary Engineering Calculation Summary": calculationSummary(intelligence, extractedData),
    "Valve Configuration / Trim / Actuator / Accessories": `Preliminary configuration should be selected for ${intelligence.application} with severe-service trim, actuator, positioner, solenoid, limit switch, airset/filter regulator, tubing/fittings, and fail-action requirements reviewed against the RFP. Final valve style, trim staging, noise treatment, and actuator sizing require engineer validation.`,
    "Datasheet Summary": lineItemRows || `| Tag / Ref | Item Description | Qty | Service | Review Status |\n|---|---:|---:|---|---|\n| TBD | ${intelligence.valveType} | TBD | ${intelligence.serviceType} | Requires RFP tag confirmation |`,
    "Compliance Matrix": intelligence.complianceItems.map((item) => `- ${item.label}: ${item.standard}`).join("\n"),
    "Technical Bid Evaluation Summary": `TBE tags: ${intelligence.tbeTags.join(", ")}.\n\nEvaluate material, trim, pressure class, actuator, accessories, testing, inspection, documentation, deviations, and engineering comments for each line item.`,
    "Inspection and Testing Plan": "Inspection plan should include ITP/QAP review, material traceability, PMI/NDE where applicable, hydrotest, seat leakage test, functional stroke test, accessory checks, witness/hold points, final inspection, release note, and dossier review.",
    "QA/QC and Documentation Plan": "QA/QC plan should govern material certificates, traceability, MDR/data book, inspection records, test certificates, datasheets, GA drawings, calculation summary, deviation register, O&M documents, and final release approvals.",
    "Drawings and Technical Visuals": drawingGallery(intelligence),
    "Deviations / Clarifications": "Clarifications should capture missing process cases, fluid properties, final pressure/temperature cases, leakage class confirmation, accessory make/model preferences, inspection witness points, delivery assumptions, and any commercial/schedule impacts.",
    "Risk Assessment": `Primary proposal-stage risk flags: ${intelligence.keyRisks.join(", ")}. Risks should be assigned owners, mitigation status, evidence, and management approval path where bid exposure is material.`,
    "Project Timeline & Delivery": "Indicative timeline should include RFP review, engineering validation, datasheet/GA drawing issue, client review, procurement, manufacturing, inspection/test, documentation compilation, dispatch, and final technical handover.",
    "Executive Dashboard Snapshot": "Demo KPI snapshot: 40-60% proposal turnaround reduction, 50-70% reusable engineering content, 25-40 engineering hours saved per complex bid, 90%+ compliance coverage, faster approval workflow, TBE completion visibility, proposal risk score, and win probability score.",
  };

  return SEVERE_SERVICE_SECTION_SPECS.map(([title]) => {
    const found = existing.get(normalizeText(title));
    if (found?.content && String(found.content).trim().length > 80) return found;
    return {
      title,
      content: sectionContent[title] ?? `${title} for ${intelligence.application}. ${SEVERE_SERVICE_DISCLAIMER}`,
      sourceType: found?.sourceType === "vault" ? "vault" : "generated",
      sourceId: found?.sourceId ?? null,
      sourceName: found?.sourceName ?? null,
    };
  });
}

export function selectRelevantSevereServiceVaultItems(items: any[], intelligence: RfpIntelligence, extractedData: any, limit: number) {
  const rfpText = normalizeText(flattenExtractedData(extractedData));
  const priorityTerms = [
    ...intelligence.vaultTerms,
    ...intelligence.keywords,
    ...intelligence.tbeTags,
    "severe service",
    "control valve",
    "proposal stage",
    "inspection",
    "testing",
    "compliance",
    "deviation",
    "documentation",
  ].map(normalizeText).filter(Boolean);

  return (items ?? [])
    .map((item) => {
      const haystack = normalizeText(`${item.title ?? item.sectionTitle ?? ""} ${item.content ?? ""} ${(item.tags ?? []).join(" ")} ${item.documentIndustry ?? ""}`);
      let relevanceScore = 0;
      for (const term of priorityTerms) if (term && haystack.includes(term)) relevanceScore += 8;
      for (const word of rfpText.split(" ").filter((w) => w.length > 5).slice(0, 100)) {
        if (haystack.includes(word)) relevanceScore += 1;
      }
      return { ...item, relevanceScore };
    })
    .filter((item) => item.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
}
