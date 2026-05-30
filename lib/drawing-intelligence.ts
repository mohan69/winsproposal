import { inferRfpIntelligence, parseProposalTemplateMetadata, type SevereServiceApplicationId } from "@/lib/severe-service-intelligence";
import { getDrawingSymbolDefinition, type DrawingSymbolInstance, type DrawingSymbolKind } from "@/lib/drawing-symbols";

export type DrawingType =
  | "pfd_style_flow"
  | "pid_lite_control_loop"
  | "valve_package_schematic"
  | "actuator_accessory_schematic"
  | "material_traceability_workflow"
  | "inspection_test_workflow"
  | "risk_review_flow"
  | "delivery_schedule";

export type DrawingReviewStatus =
  | "Generated"
  | "Engineering review required"
  | "Customer clarification required"
  | "Approved for proposal"
  | "Not for construction";

export type DrawingConnector = {
  id: string;
  from: string;
  to: string;
  label?: string;
  lineType: "process" | "instrument" | "pneumatic" | "workflow";
};

export type DrawingAnnotation = {
  id: string;
  x: number;
  y: number;
  label: string;
  targetSymbolId?: string;
};

export type DrawingStandardsAwareness = {
  id: string;
  label: string;
  note: string;
};

export type DrawingTitleBlock = {
  project: string;
  proposalId: string;
  drawingNo: string;
  title: string;
  application: string;
  status: string;
};

export type DrawingRevisionBlock = {
  revision: string;
  date: string;
  description: string;
  by: string;
};

export type DrawingPackage = {
  proposalId: string;
  applicationType: string;
  drawingType: DrawingType;
  title: string;
  subtitle: string;
  disclaimer: string;
  reviewStatus: DrawingReviewStatus[];
  symbols: DrawingSymbolInstance[];
  connectors: DrawingConnector[];
  annotations: DrawingAnnotation[];
  standardsAwareness: DrawingStandardsAwareness[];
  titleBlock: DrawingTitleBlock;
  revisionBlock: DrawingRevisionBlock;
  tagsUsed: string[];
  engineeringReviewNotes: string[];
  exportIncluded: boolean;
};

export const PROPOSAL_STAGE_DRAWING_DISCLAIMER =
  "Proposal-stage technical drawing. Not for construction. Final engineering drawing/design must be validated by qualified engineers using company-approved tools and applicable licensed standards.";

type BuildParams = {
  proposalId?: string;
  templateType?: string | null;
  extractedData?: any;
};

const DEFAULT_REVIEW_STATUS: DrawingReviewStatus[] = ["Generated", "Engineering review required", "Not for construction"];

function clean(value: unknown, fallback = "TBD") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function tagsFromRfp(extractedData: any, fallback: string[]): string[] {
  const items = Array.isArray(extractedData?.lineItems) ? extractedData.lineItems : [];
  const tags = items
    .map((item: any) => item?.tag ?? item?.item ?? item?.ref ?? item?.lineItem)
    .map((tag: unknown) => clean(tag, ""))
    .filter(Boolean);
  return tags.length ? tags : fallback;
}

function sym(id: string, kind: DrawingSymbolKind, label: string, x: number, y: number, options: Partial<DrawingSymbolInstance> = {}): DrawingSymbolInstance {
  return { id, kind, label, x, y, width: options.width ?? 112, height: options.height ?? 54, tag: options.tag, note: options.note };
}

function seq(symbols: DrawingSymbolInstance[], lineType: DrawingConnector["lineType"] = "process"): DrawingConnector[] {
  return symbols.slice(0, -1).map((symbol, index) => ({
    id: `c-${symbol.id}-${symbols[index + 1].id}`,
    from: symbol.id,
    to: symbols[index + 1].id,
    lineType,
  }));
}

function baseStandards(applicationId: SevereServiceApplicationId): DrawingStandardsAwareness[] {
  const common: DrawingStandardsAwareness[] = [
    { id: "isa-iec", label: "ISA 75.01 / IEC 60534 awareness", note: "Sizing and control valve review basis; final validation required." },
    { id: "asme", label: "ASME B16.34 awareness", note: "Pressure-temperature rating review basis; project confirmation required." },
    { id: "itp", label: "Project ITP / QAP / MDR awareness", note: "Inspection, test, and documentation requirements require project validation." },
  ];
  if (applicationId === "hydrogen-process-control" || applicationId === "refinery-severe-service") {
    common.push({ id: "nace", label: "NACE MR0175 / ISO 15156 awareness", note: "Applicable where sour service or material restrictions are confirmed." });
  }
  if (applicationId === "lng-compressor-recycle") {
    common.push({ id: "api-test", label: "API / project-specific test awareness", note: "Functional and leakage test basis requires project confirmation." });
  }
  return common;
}

function packageOf(params: {
  proposalId: string;
  applicationType: string;
  applicationId: SevereServiceApplicationId;
  drawingType: DrawingType;
  title: string;
  subtitle: string;
  drawingNo: string;
  symbols: DrawingSymbolInstance[];
  connectors?: DrawingConnector[];
  annotations?: DrawingAnnotation[];
  tagsUsed: string[];
  notes: string[];
  standards?: DrawingStandardsAwareness[];
}): DrawingPackage {
  return {
    proposalId: params.proposalId,
    applicationType: params.applicationType,
    drawingType: params.drawingType,
    title: params.title,
    subtitle: params.subtitle,
    disclaimer: PROPOSAL_STAGE_DRAWING_DISCLAIMER,
    reviewStatus: DEFAULT_REVIEW_STATUS,
    symbols: params.symbols,
    connectors: params.connectors ?? seq(params.symbols),
    annotations: params.annotations ?? [],
    standardsAwareness: params.standards ?? baseStandards(params.applicationId),
    titleBlock: {
      project: params.applicationType,
      proposalId: params.proposalId,
      drawingNo: params.drawingNo,
      title: params.title,
      application: params.applicationType,
      status: "Generated - Engineering review required",
    },
    revisionBlock: {
      revision: "P0",
      date: "Proposal stage",
      description: "Generated for proposal review",
      by: "WinsProposal Drawing Intelligence Engine",
    },
    tagsUsed: params.tagsUsed,
    engineeringReviewNotes: params.notes,
    exportIncluded: true,
  };
}

function hydrogenPackages(proposalId: string, applicationType: string, extractedData: any): DrawingPackage[] {
  const tags = tagsFromRfp(extractedData, ["HV-H2-3101A/B/C/D", "FV-H2-3150A/B", "PV-H2-3190"]);
  const topologySymbols = [
    sym("h2-feed", "process_source", "Hydrogen feed", 40, 165),
    sym("h2-filtration", "filter_regulator_airset", "Isolation / filtration", 185, 165),
    sym("h2-hv", "severe_service_control_valve", "Pressure control valves", 340, 155, { tag: "HV-H2-3101A/B/C/D", width: 128 }),
    sym("h2-fv", "control_valve", "Flow control valves", 505, 155, { tag: "FV-H2-3150A/B" }),
    sym("h2-pv", "severe_service_control_valve", "Export header control", 650, 155, { tag: "PV-H2-3190" }),
    sym("h2-header", "process_destination", "Export header", 805, 165),
    sym("h2-monitor", "controller", "Leakage / pressure monitoring", 650, 55, { width: 150 }),
  ];
  return [
    packageOf({
      proposalId,
      applicationType,
      applicationId: "hydrogen-process-control",
      drawingType: "pfd_style_flow",
      title: "PFD-style Hydrogen Service System Topology",
      subtitle: "Hydrogen feed, severe-service control valve trains, export header, and monitoring boundary.",
      drawingNo: "DIE-H2-PFD-001",
      symbols: topologySymbols,
      connectors: [
        ...seq(topologySymbols.slice(0, 6), "process"),
        { id: "c-h2-monitor-pv", from: "h2-monitor", to: "h2-pv", label: "monitoring", lineType: "instrument" },
      ],
      annotations: [
        { id: "h2-a1", x: 655, y: 118, label: "Leakage and pressure monitoring shown for proposal review.", targetSymbolId: "h2-monitor" },
        { id: "h2-a2", x: 710, y: 248, label: "Process safety review note: final cause/effect and safeguards by project engineers.", targetSymbolId: "h2-pv" },
      ],
      tagsUsed: tags,
      notes: ["Hydrogen material and sealing assumptions require qualified engineering validation.", "Export header process safety review is a proposal-stage note only."],
    }),
    packageOf({
      proposalId,
      applicationType,
      applicationId: "hydrogen-process-control",
      drawingType: "pid_lite_control_loop",
      title: "P&ID-lite Control Loop",
      subtitle: "Controller signal, positioner, solenoid, actuator, valve, and feedback path.",
      drawingNo: "DIE-H2-LOOP-002",
      symbols: [
        sym("h2-ctrl", "controller", "Controller", 60, 55, { tag: "PIC/FIC" }),
        sym("h2-pos", "positioner", "Positioner", 245, 60),
        sym("h2-sol", "solenoid", "Solenoid", 405, 60),
        sym("h2-act", "actuator", "Actuator", 565, 60),
        sym("h2-valve-loop", "severe_service_control_valve", "Hydrogen control valve", 565, 170, { tag: "HV/FV/PV-H2" }),
        sym("h2-ls", "limit_switch", "Limit switch / feedback", 755, 60),
      ],
      connectors: [
        { id: "h2-i1", from: "h2-ctrl", to: "h2-pos", lineType: "instrument", label: "4-20 mA / digital" },
        { id: "h2-i2", from: "h2-pos", to: "h2-sol", lineType: "instrument" },
        { id: "h2-p1", from: "h2-sol", to: "h2-act", lineType: "pneumatic", label: "instrument air" },
        { id: "h2-m1", from: "h2-act", to: "h2-valve-loop", lineType: "workflow", label: "mechanical link" },
        { id: "h2-f1", from: "h2-valve-loop", to: "h2-ls", lineType: "instrument", label: "feedback" },
      ],
      annotations: [{ id: "h2-cert", x: 565, y: 150, label: "Hazardous area accessory certificate basis requires project validation." }],
      tagsUsed: tags.filter((tag) => /H2/i.test(tag)),
      notes: ["Fail action, stroking, hazardous area certificates, and accessory make/model require final confirmation."],
    }),
    valvePackage(proposalId, applicationType, "hydrogen-process-control", "DIE-H2-PKG-003", "Hydrogen Valve Package Schematic", "Hydrogen valve assembly with sealing, packing, actuator, and accessory review.", tags),
    packageOf({
      proposalId,
      applicationType,
      applicationId: "hydrogen-process-control",
      drawingType: "material_traceability_workflow",
      title: "Material Traceability / MDR Workflow",
      subtitle: "Material class, hydrogen compatibility screen, MTC, PMI, leakage evidence, and MDR release.",
      drawingNo: "DIE-H2-MDR-004",
      symbols: [
        sym("h2-mat", "document_mdr_package", "Material class", 55, 130),
        sym("h2-screen", "inspection_hold_point", "Hydrogen compatibility screen", 220, 130, { width: 140 }),
        sym("h2-mtc", "material_certificate", "MTC", 405, 130),
        sym("h2-pmi", "inspection_hold_point", "PMI / traceability", 555, 130),
        sym("h2-test", "test_report", "Leakage test evidence", 705, 130),
        sym("h2-mdr", "document_mdr_package", "MDR release", 855, 130),
      ],
      connectors: undefined,
      tagsUsed: ["DOC-H2", ...tags.filter((tag) => /H2/i.test(tag)).slice(0, 3)],
      notes: ["MTC, PMI, leakage test evidence, and MDR release are workflow placeholders until project ITP/QAP is validated."],
    }),
    packageOf({
      proposalId,
      applicationType,
      applicationId: "hydrogen-process-control",
      drawingType: "inspection_test_workflow",
      title: "Inspection and Dossier Workflow",
      subtitle: "ITP hold points, material certificates, leakage/function tests, inspection release, and final data book.",
      drawingNo: "DIE-H2-ITP-005",
      symbols: [
        sym("h2-itp", "inspection_hold_point", "ITP hold points", 55, 130),
        sym("h2-cert", "material_certificate", "Material certificates", 220, 130),
        sym("h2-leak", "test_report", "Leakage / function tests", 390, 130, { width: 145 }),
        sym("h2-release", "inspection_hold_point", "Inspection release", 585, 130, { width: 135 }),
        sym("h2-databook", "document_mdr_package", "Final data book", 755, 130),
      ],
      tagsUsed: ["DOC-H2", ...tags.filter((tag) => /H2/i.test(tag)).slice(0, 3)],
      notes: ["Inspection hold points, witness points, and final dossier content require project ITP/QAP confirmation."],
    }),
  ];
}

function lngPackages(proposalId: string, applicationType: string, extractedData: any): DrawingPackage[] {
  const tags = tagsFromRfp(extractedData, ["XV-CRV-9101A/B/C", "ASP-9101A/B/C"]);
  return [
    packageOf({
      proposalId,
      applicationType,
      applicationId: "lng-compressor-recycle",
      drawingType: "pfd_style_flow",
      title: "PFD-style Compressor Recycle / Anti-Surge Architecture",
      subtitle: "Discharge takeoff, fast-response recycle valves, suction return, and anti-surge controller interface.",
      drawingNo: "DIE-LNG-PFD-001",
      symbols: [
        sym("lng-discharge", "process_source", "Compressor discharge", 50, 165),
        sym("lng-takeoff", "process_source", "Recycle takeoff", 215, 165),
        sym("lng-crv", "severe_service_control_valve", "Recycle valves", 385, 155, { tag: "XV-CRV-9101A/B/C", width: 125 }),
        sym("lng-return", "process_destination", "Suction return", 565, 165),
        sym("lng-asc", "controller", "Anti-surge controller", 385, 55, { width: 145 }),
        sym("lng-oem", "document_mdr_package", "Compressor OEM interface note", 735, 70, { width: 160 }),
      ],
      connectors: [
        { id: "lng-p1", from: "lng-discharge", to: "lng-takeoff", lineType: "process" },
        { id: "lng-p2", from: "lng-takeoff", to: "lng-crv", lineType: "process" },
        { id: "lng-p3", from: "lng-crv", to: "lng-return", lineType: "process" },
        { id: "lng-i1", from: "lng-asc", to: "lng-crv", lineType: "instrument", label: "anti-surge demand" },
        { id: "lng-i2", from: "lng-oem", to: "lng-asc", lineType: "instrument", label: "interface" },
      ],
      annotations: [{ id: "lng-a1", x: 540, y: 250, label: "Final anti-surge response and OEM interface require engineer/OEM validation." }],
      tagsUsed: tags,
      notes: ["Fast stroke time, compressor OEM interface, and final anti-surge control logic require project validation."],
    }),
    packageOf({
      proposalId,
      applicationType,
      applicationId: "lng-compressor-recycle",
      drawingType: "pid_lite_control_loop",
      title: "P&ID-lite Anti-Surge Control Loop",
      subtitle: "Anti-surge controller, positioner, booster, actuator, recycle valve, and feedback path.",
      drawingNo: "DIE-LNG-LOOP-002",
      symbols: [
        sym("lng-loop-asc", "controller", "Anti-surge controller", 55, 60, { width: 145 }),
        sym("lng-loop-pos", "positioner", "Positioner", 240, 60),
        sym("lng-loop-boost", "volume_booster", "Volume booster / quick exhaust", 405, 60, { width: 150 }),
        sym("lng-loop-act", "actuator", "Actuator", 605, 60),
        sym("lng-loop-valve", "severe_service_control_valve", "Recycle valve", 605, 170, { tag: "XV-CRV-9101A/B/C" }),
        sym("lng-loop-fb", "limit_switch", "Feedback", 780, 60),
      ],
      connectors: [
        { id: "lng-l1", from: "lng-loop-asc", to: "lng-loop-pos", lineType: "instrument" },
        { id: "lng-l2", from: "lng-loop-pos", to: "lng-loop-boost", lineType: "pneumatic" },
        { id: "lng-l3", from: "lng-loop-boost", to: "lng-loop-act", lineType: "pneumatic" },
        { id: "lng-l4", from: "lng-loop-act", to: "lng-loop-valve", lineType: "workflow" },
        { id: "lng-l5", from: "lng-loop-valve", to: "lng-loop-fb", lineType: "instrument" },
      ],
      tagsUsed: tags,
      notes: ["Stroke time, actuator dynamics, booster sizing, and feedback signal integrity require final validation."],
    }),
    valvePackage(proposalId, applicationType, "lng-compressor-recycle", "DIE-LNG-PKG-003", "LNG Valve Package Schematic", "Severe-service recycle valve assembly with multi-stage trim and fast-response accessories.", tags, true),
    packageOf({
      proposalId,
      applicationType,
      applicationId: "lng-compressor-recycle",
      drawingType: "risk_review_flow",
      title: "Acoustic / Noise Review Flow",
      subtitle: "Pressure drop, choked-flow screen, outlet piping data, acoustic fatigue review, mitigation, and validation.",
      drawingNo: "DIE-LNG-NOISE-004",
      symbols: [
        sym("lng-dp", "inspection_hold_point", "Pressure drop", 55, 130),
        sym("lng-choked", "inspection_hold_point", "Choked flow screen", 210, 130),
        sym("lng-pipe", "document_mdr_package", "Outlet piping data", 370, 130),
        sym("lng-acoustic", "inspection_hold_point", "Acoustic fatigue review", 535, 130, { width: 140 }),
        sym("lng-mitigate", "severe_service_control_valve", "Mitigation", 720, 125),
        sym("lng-validate", "test_report", "Engineer validation", 855, 130),
      ],
      tagsUsed: tags,
      notes: ["Acoustic output is not final. Outlet piping data and company-approved tools are required for final review."],
    }),
    packageOf({
      proposalId,
      applicationType,
      applicationId: "lng-compressor-recycle",
      drawingType: "inspection_test_workflow",
      title: "Inspection and Test Workflow",
      subtitle: "ITP review, hydrotest, seat leakage, functional stroke, accessory loop check, and final release.",
      drawingNo: "DIE-LNG-ITP-005",
      symbols: [
        sym("lng-itp", "inspection_hold_point", "ITP review", 55, 130),
        sym("lng-hydro", "test_report", "Hydrotest", 220, 130),
        sym("lng-seat", "test_report", "Seat leakage", 375, 130),
        sym("lng-stroke", "inspection_hold_point", "Functional stroke", 535, 130, { width: 130 }),
        sym("lng-loop", "inspection_hold_point", "Accessory loop check", 705, 130, { width: 145 }),
        sym("lng-final", "document_mdr_package", "Final release", 875, 130),
      ],
      tagsUsed: ["DOC-9101", ...tags.filter((tag) => /CRV|ASP/i.test(tag)).slice(0, 3)],
      notes: ["Inspection and test workflow is proposal-stage; final witness/hold points require project ITP validation."],
    }),
  ];
}

function valvePackage(
  proposalId: string,
  applicationType: string,
  applicationId: SevereServiceApplicationId,
  drawingNo: string,
  title: string,
  subtitle: string,
  tagsUsed: string[],
  includeBooster = false
) {
  const symbols = [
    sym("pkg-body", "severe_service_control_valve", "Valve body", 95, 175),
    sym("pkg-trim", "severe_service_control_valve", includeBooster ? "Multi-stage trim" : "Trim", 260, 115),
    sym("pkg-seat", "control_valve", "Seat / seal", 260, 235),
    sym("pkg-packing", "control_valve", "Packing", 430, 235),
    sym("pkg-act", "actuator", "Actuator", 430, 115),
    sym("pkg-pos", "positioner", "Positioner", 600, 80),
    sym("pkg-sol", "solenoid", "Solenoid", 745, 80),
    sym("pkg-air", "filter_regulator_airset", "Airset / filter regulator", 600, 220, { width: 140 }),
    sym("pkg-ls", "limit_switch", "Limit switches", 780, 220),
  ];
  if (includeBooster) symbols.splice(7, 0, sym("pkg-boost", "volume_booster", "Booster", 745, 150));
  return packageOf({
    proposalId,
    applicationType,
    applicationId,
    drawingType: "valve_package_schematic",
    title,
    subtitle,
    drawingNo,
    symbols,
    connectors: [
      { id: "pkg-c1", from: "pkg-body", to: "pkg-trim", lineType: "workflow" },
      { id: "pkg-c2", from: "pkg-body", to: "pkg-seat", lineType: "workflow" },
      { id: "pkg-c3", from: "pkg-body", to: "pkg-packing", lineType: "workflow" },
      { id: "pkg-c4", from: "pkg-act", to: "pkg-body", lineType: "workflow" },
      { id: "pkg-c5", from: "pkg-pos", to: "pkg-act", lineType: "pneumatic" },
      { id: "pkg-c6", from: "pkg-sol", to: "pkg-act", lineType: "pneumatic" },
      { id: "pkg-c7", from: "pkg-air", to: "pkg-pos", lineType: "pneumatic" },
      { id: "pkg-c8", from: "pkg-ls", to: "pkg-act", lineType: "instrument" },
      ...(includeBooster ? [{ id: "pkg-c9", from: "pkg-boost", to: "pkg-act", lineType: "pneumatic" as const }] : []),
    ],
    tagsUsed,
    notes: ["Valve body, trim, sealing, packing, actuator, and accessory selections are proposal-stage only."],
  });
}

function refineryPackages(proposalId: string, applicationType: string, extractedData: any): DrawingPackage[] {
  const tags = tagsFromRfp(extractedData, ["REF-CV-1001"]);
  return [
    packageOf({
      proposalId,
      applicationType,
      applicationId: "refinery-severe-service",
      drawingType: "pfd_style_flow",
      title: "Process Letdown PFD-style Flow",
      subtitle: "High-pressure refinery letdown through severe-service control valve package.",
      drawingNo: "DIE-REF-PFD-001",
      symbols: [
        sym("ref-src", "process_source", "High pressure process", 70, 155),
        sym("ref-valve", "severe_service_control_valve", "Letdown control valve", 315, 145, { tag: tags[0] }),
        sym("ref-dst", "process_destination", "Downstream process", 590, 155),
        sym("ref-review", "inspection_hold_point", "Cavitation / flashing review", 435, 55, { width: 150 }),
      ],
      connectors: [
        { id: "ref-p1", from: "ref-src", to: "ref-valve", lineType: "process" },
        { id: "ref-p2", from: "ref-valve", to: "ref-dst", lineType: "process" },
        { id: "ref-i1", from: "ref-review", to: "ref-valve", lineType: "instrument" },
      ],
      tagsUsed: tags,
      notes: ["Cavitation/flashing and metallurgy assumptions require final review."],
    }),
    riskWorkflow(proposalId, applicationType, "refinery-severe-service", "DIE-REF-RISK-002", "Cavitation / Flashing Risk Review", ["Pressure drop", "Cavitation screen", "Flashing screen", "Trim mitigation", "Engineer validation"], tags),
    riskWorkflow(proposalId, applicationType, "refinery-severe-service", "DIE-REF-MAT-003", "NACE / Material Review Workflow", ["Service chemistry", "NACE applicability", "Material selection", "Traceability", "Compliance response"], tags),
    valvePackage(proposalId, applicationType, "refinery-severe-service", "DIE-REF-PKG-004", "Valve / Trim / Accessory Schematic", "Refinery severe-service valve, trim, actuator, and accessory package.", tags),
  ];
}

function steamPackages(proposalId: string, applicationType: string, extractedData: any): DrawingPackage[] {
  const tags = tagsFromRfp(extractedData, ["ST-CV-1001"]);
  return [
    packageOf({
      proposalId,
      applicationType,
      applicationId: "steam-conditioning",
      drawingType: "pfd_style_flow",
      title: "Steam Letdown / Desuperheating Arrangement",
      subtitle: "Steam pressure letdown, spray water input, and conditioned steam header.",
      drawingNo: "DIE-STM-PFD-001",
      symbols: [
        sym("stm-src", "process_source", "HP steam", 55, 165),
        sym("stm-valve", "severe_service_control_valve", "Steam conditioning valve", 245, 155, { tag: tags[0], width: 150 }),
        sym("stm-water", "control_valve", "Spray water valve", 405, 65),
        sym("stm-zone", "process_destination", "Desuperheating zone", 535, 165),
        sym("stm-header", "process_destination", "Conditioned steam header", 745, 165, { width: 150 }),
      ],
      connectors: [
        { id: "stm-p1", from: "stm-src", to: "stm-valve", lineType: "process" },
        { id: "stm-p2", from: "stm-valve", to: "stm-zone", lineType: "process" },
        { id: "stm-p3", from: "stm-zone", to: "stm-header", lineType: "process" },
        { id: "stm-w1", from: "stm-water", to: "stm-zone", lineType: "process", label: "spray water" },
      ],
      tagsUsed: tags,
      notes: ["Desuperheating arrangement, spray water conditions, and thermal cycling basis require validation."],
    }),
    packageOf({
      proposalId,
      applicationType,
      applicationId: "steam-conditioning",
      drawingType: "pid_lite_control_loop",
      title: "Temperature Control Loop",
      subtitle: "Temperature transmitter/controller, spray water valve, conditioning valve, and header feedback.",
      drawingNo: "DIE-STM-LOOP-002",
      symbols: [
        sym("stm-tt", "controller", "Temperature transmitter", 65, 60, { tag: "TT" }),
        sym("stm-tic", "controller", "Temperature controller", 245, 60, { tag: "TIC" }),
        sym("stm-sw", "control_valve", "Spray water valve", 430, 60),
        sym("stm-cv", "severe_service_control_valve", "Steam conditioning valve", 605, 160, { tag: tags[0], width: 150 }),
        sym("stm-fb", "process_destination", "Header feedback", 790, 60),
      ],
      connectors: undefined,
      tagsUsed: tags,
      notes: ["Temperature response, spray water control, and final control philosophy require engineering validation."],
    }),
    riskWorkflow(proposalId, applicationType, "steam-conditioning", "DIE-STM-NOISE-003", "Noise Attenuation Review", ["Pressure letdown", "Noise limit", "Attenuation trim", "Outlet velocity review", "Validation"], tags),
    riskWorkflow(proposalId, applicationType, "steam-conditioning", "DIE-STM-THERM-004", "Thermal Cycling Review", ["Thermal cases", "Material review", "Fatigue screen", "Inspection plan", "Approval"], tags),
  ];
}

function riskWorkflow(proposalId: string, applicationType: string, applicationId: SevereServiceApplicationId, drawingNo: string, title: string, labels: string[], tagsUsed: string[]) {
  return packageOf({
    proposalId,
    applicationType,
    applicationId,
    drawingType: "risk_review_flow",
    title,
    subtitle: "Proposal-stage engineering review workflow.",
    drawingNo,
    symbols: labels.map((label, index) => sym(`risk-${index}`, index === labels.length - 1 ? "test_report" : "inspection_hold_point", label, 55 + index * 170, 130, { width: index === labels.length - 1 ? 125 : 135 })),
    tagsUsed,
    notes: ["Workflow is a proposal review basis; final engineering disposition requires qualified approval."],
  });
}

export function buildDrawingPackages(params: BuildParams): DrawingPackage[] {
  const extractedData = params.extractedData ?? {};
  const intelligence = inferRfpIntelligence(extractedData);
  const meta = parseProposalTemplateMetadata(params.templateType);
  const applicationType = meta.application || intelligence.application;
  const proposalId = params.proposalId || "proposal-stage";

  if (intelligence.applicationId === "hydrogen-process-control") return hydrogenPackages(proposalId, applicationType, extractedData);
  if (intelligence.applicationId === "lng-compressor-recycle") return lngPackages(proposalId, applicationType, extractedData);
  if (intelligence.applicationId === "steam-conditioning") return steamPackages(proposalId, applicationType, extractedData);
  if (intelligence.applicationId === "refinery-severe-service") return refineryPackages(proposalId, applicationType, extractedData);
  return refineryPackages(proposalId, applicationType || titleCase(intelligence.applicationId), extractedData);
}

export function drawingTypeLabel(type: DrawingType) {
  const labels: Record<DrawingType, string> = {
    pfd_style_flow: "PFD-style flow",
    pid_lite_control_loop: "P&ID-lite control loop",
    valve_package_schematic: "Valve package schematic",
    actuator_accessory_schematic: "Actuator/accessory schematic",
    material_traceability_workflow: "Material traceability workflow",
    inspection_test_workflow: "Inspection/test workflow",
    risk_review_flow: "Risk review flow",
    delivery_schedule: "Delivery schedule",
  };
  return labels[type];
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function drawingPackageToStructuredText(pkg: DrawingPackage) {
  return [
    `${drawingTypeLabel(pkg.drawingType)}: ${pkg.title}`,
    `Tags used: ${pkg.tagsUsed.join(", ") || "TBD"}`,
    `Review status: ${pkg.reviewStatus.join(" - ")}`,
    `Symbols: ${pkg.symbols.map((symbol) => `${getDrawingSymbolDefinition(symbol.kind).label}${symbol.tag ? ` (${symbol.tag})` : ""}`).join(", ")}`,
    `Engineering review notes: ${pkg.engineeringReviewNotes.join(" ")}`,
    `Standards awareness: ${pkg.standardsAwareness.map((item) => item.label).join(", ")}`,
    pkg.disclaimer,
  ].join("\n");
}

export function renderDrawingPackageHtml(pkg: DrawingPackage, brandColor = "#1a365d") {
  const symbolById = new Map(pkg.symbols.map((symbol) => [symbol.id, symbol]));
  const markerId = `die-arrow-${pkg.titleBlock.drawingNo.replace(/[^a-zA-Z0-9-]/g, "-")}`;
  const connector = (item: DrawingConnector) => {
    const from = symbolById.get(item.from);
    const to = symbolById.get(item.to);
    if (!from || !to) return "";
    const x1 = from.x + (from.width ?? 112) / 2;
    const y1 = from.y + (from.height ?? 54) / 2;
    const x2 = to.x + (to.width ?? 112) / 2;
    const y2 = to.y + (to.height ?? 54) / 2;
    const dashed = item.lineType === "instrument" || item.lineType === "pneumatic" ? "stroke-dasharray=\"7 5\"" : "";
    const color = item.lineType === "process" ? "#111827" : brandColor;
    return `<g>
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${item.lineType === "process" ? 2.4 : 1.8}" ${dashed} marker-end="url(#${markerId})" />
      ${item.label ? `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 7}" class="die-connector-label">${escapeHtml(item.label)}</text>` : ""}
    </g>`;
  };
  const symbol = (item: DrawingSymbolInstance) => {
    const width = item.width ?? 112;
    const height = item.height ?? 54;
    const def = getDrawingSymbolDefinition(item.kind);
    const isValve = item.kind.includes("valve");
    const isController = item.kind === "controller";
    const isDocument = item.kind.includes("document") || item.kind.includes("certificate") || item.kind.includes("report");
    const body = isValve
      ? `<polygon points="${item.x + 8},${item.y + height / 2} ${item.x + width / 2},${item.y + 9} ${item.x + width - 8},${item.y + height / 2} ${item.x + width / 2},${item.y + height - 9}" fill="#fff" stroke="${brandColor}" stroke-width="2"/><line x1="${item.x + width / 2}" y1="${item.y + 9}" x2="${item.x + width / 2}" y2="${item.y + height - 9}" stroke="${brandColor}" stroke-width="1.5"/>`
      : isController
        ? `<circle cx="${item.x + width / 2}" cy="${item.y + height / 2}" r="${Math.min(width, height) / 2 - 4}" fill="#fff" stroke="${brandColor}" stroke-width="2"/>`
        : isDocument
          ? `<path d="M${item.x + 8} ${item.y + 4} H${item.x + width - 18} L${item.x + width - 6} ${item.y + 16} V${item.y + height - 5} H${item.x + 8} Z" fill="#fff" stroke="${brandColor}" stroke-width="1.8"/><path d="M${item.x + width - 18} ${item.y + 4} V${item.y + 16} H${item.x + width - 6}" fill="none" stroke="${brandColor}" stroke-width="1.4"/>`
          : `<rect x="${item.x}" y="${item.y}" width="${width}" height="${height}" rx="4" fill="#fff" stroke="${brandColor}" stroke-width="1.8"/>`;
    return `<g class="die-symbol">
      ${body}
      <text x="${item.x + width / 2}" y="${item.y + height / 2 + (isValve ? 4 : 2)}" class="die-symbol-label">${escapeHtml(item.label)}</text>
      ${item.tag ? `<text x="${item.x + width / 2}" y="${item.y + height + 15}" class="die-symbol-tag">${escapeHtml(item.tag)}</text>` : ""}
      <title>${escapeHtml(def.family)}: ${escapeHtml(def.description)}</title>
    </g>`;
  };
  return `<div class="die-card">
    <div class="die-head">
      <div>
        <div class="die-kicker">${escapeHtml(drawingTypeLabel(pkg.drawingType))}</div>
        <div class="die-title">${escapeHtml(pkg.title)}</div>
        <div class="die-subtitle">${escapeHtml(pkg.subtitle)}</div>
      </div>
      <div class="die-status">${escapeHtml(pkg.reviewStatus.join(" - "))}</div>
    </div>
    <div class="die-disclaimer">${escapeHtml(pkg.disclaimer)}</div>
    <svg class="die-svg" viewBox="0 0 980 330" role="img" aria-label="${escapeHtml(pkg.title)}">
      <defs>
        <marker id="${markerId}" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="${brandColor}" />
        </marker>
      </defs>
      <rect x="12" y="14" width="956" height="240" fill="#fbfdff" stroke="#cbd5e1" stroke-width="1"/>
      ${pkg.connectors.map(connector).join("")}
      ${pkg.symbols.map(symbol).join("")}
      ${pkg.annotations.map((item) => `<g><path d="M${item.x - 10} ${item.y - 12} h220 v36 h-220 z" fill="#fffbeb" stroke="#f59e0b" stroke-width="1"/><text x="${item.x}" y="${item.y + 3}" class="die-note">${escapeHtml(item.label)}</text></g>`).join("")}
      <g class="die-legend">
        <rect x="24" y="262" width="360" height="52" fill="#fff" stroke="#94a3b8"/>
        <text x="34" y="280" class="die-title-block-text">LEGEND</text>
        <line x1="92" y1="276" x2="132" y2="276" stroke="#111827" stroke-width="2.4" marker-end="url(#${markerId})"/>
        <text x="140" y="280" class="die-title-block-text">process line</text>
        <line x1="232" y1="276" x2="272" y2="276" stroke="${brandColor}" stroke-width="1.8" stroke-dasharray="7 5" marker-end="url(#${markerId})"/>
        <text x="280" y="280" class="die-title-block-text">signal line</text>
        <rect x="34" y="290" width="42" height="14" rx="2" fill="#fff" stroke="${brandColor}" stroke-width="1.5"/>
        <text x="84" y="301" class="die-title-block-text">proposal-grade symbol layout</text>
      </g>
      <g class="die-title-block">
        <rect x="650" y="262" width="318" height="52" fill="#fff" stroke="#94a3b8"/>
        <text x="660" y="280" class="die-title-block-text">DWG: ${escapeHtml(pkg.titleBlock.drawingNo)}</text>
        <text x="660" y="296" class="die-title-block-text">REV: ${escapeHtml(pkg.revisionBlock.revision)} | ${escapeHtml(pkg.titleBlock.status)}</text>
      </g>
    </svg>
    <div class="die-meta-grid">
      <div><strong>Tags used</strong><span>${escapeHtml(pkg.tagsUsed.join(", ") || "TBD")}</span></div>
      <div><strong>Engineering review notes</strong><span>${escapeHtml(pkg.engineeringReviewNotes.join(" "))}</span></div>
      <div><strong>Standards-awareness notes</strong><span>${escapeHtml(pkg.standardsAwareness.map((item) => item.label).join(" | "))}</span></div>
      <div><strong>Revision</strong><span>${escapeHtml(pkg.revisionBlock.revision)} - ${escapeHtml(pkg.revisionBlock.description)}</span></div>
    </div>
  </div>`;
}
