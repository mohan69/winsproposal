import { inferRfpIntelligence, parseProposalTemplateMetadata, SEVERE_SERVICE_DISCLAIMER } from "@/lib/severe-service-intelligence";
import {
  buildDrawingPackages,
  drawingPackageToStructuredText,
  PROPOSAL_STAGE_DRAWING_DISCLAIMER,
  renderDrawingPackageHtml,
  type DrawingPackage,
} from "@/lib/drawing-intelligence";

export type EngineeringArtifactType =
  | "datasheet_summary"
  | "calculation_summary"
  | "drawing_package"
  | "pfd_style_flow"
  | "pid_style_control_loop"
  | "valve_assembly_architecture"
  | "actuator_accessory_block"
  | "material_compatibility_matrix"
  | "inspection_test_plan"
  | "tbe_matrix"
  | "deviation_register"
  | "risk_register"
  | "qa_dossier_workflow"
  | "delivery_schedule"
  | "compliance_matrix"
  | "kpi_dashboard"
  | "scope_breakdown";

export type ArtifactTable = {
  columns: string[];
  rows: string[][];
  layout?: "table" | "compact";
  title?: string;
};

export type ArtifactVisual = {
  title: string;
  layoutType: string;
  nodes: string[];
  edges?: Array<[string, string]>;
};

export type ProposalVisualSpec = {
  title: string;
  visualLabel: string;
  nodes: string[];
  primary?: string;
  support?: string[];
  annotations?: string[];
  style: "pfd" | "control_loop" | "workflow" | "risk_tree" | "gantt";
};

export type EngineeringArtifact = {
  artifactType: EngineeringArtifactType;
  applicationType: string;
  title: string;
  sourceRfpReferences: string[];
  renderedLayoutType: string;
  tables?: ArtifactTable[];
  bullets?: string[];
  visuals?: ArtifactVisual[];
  drawingPackages?: DrawingPackage[];
  disclaimer?: string;
};

const TITLE_ACRONYMS = new Set([
  "API",
  "ASME",
  "DOCX",
  "FAT",
  "IEC",
  "ISA",
  "ITP",
  "KPI",
  "MDR",
  "MTC",
  "NACE",
  "NDE",
  "PDF",
  "PFD",
  "PID",
  "PMI",
  "QAP",
  "QA",
  "QC",
  "TBE",
]);

export function formatArtifactTitle(title: string) {
  return title
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (/^qa\/qc$/i.test(word)) return "QA/QC";
      if (/^p&id$/i.test(word)) return "P&ID";
      const normalized = word.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (TITLE_ACRONYMS.has(normalized)) return normalized;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function clean(value: unknown, fallback = "TBD") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeFieldKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function field(item: any, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value);
  }
  const entries = Object.entries(item ?? {});
  for (const key of keys) {
    const normalized = normalizeFieldKey(key);
    const match = entries.find(([candidate, value]) => (
      normalizeFieldKey(candidate) === normalized &&
      value !== undefined &&
      value !== null &&
      String(value).trim()
    ));
    if (match) return String(match[1]);
  }
  return fallback;
}

function processField(process: any, keys: string[], fallback = "TBD") {
  return clean(field(process, keys), fallback);
}

function applicationProcessFallback(applicationId: string, fieldName: string) {
  const values: Record<string, Record<string, string>> = {
    "hydrogen-process-control": {
      fluid: "Hydrogen-rich process gas",
      inletPressure: "48 barg",
      outletPressure: "18 barg",
      temperature: "60°C",
      leakageClass: "Class V requested for selected tags",
      serviceConcerns: "Hydrogen compatibility, high-integrity sealing, traceability, process safety",
    },
    "lng-compressor-recycle": {
      fluid: "Natural gas rich LNG process gas",
      inletPressure: "92 barg normal / 108 barg design",
      outletPressure: "34 barg normal",
      temperature: "-28°C to 45°C",
      flowCases: "Normal recycle, startup bypass, compressor trip",
      leakageClass: "Class IV minimum; tighter class subject to final engineering review",
      responseRequirement: "Fast stroke for anti-surge duty",
    },
  };
  return values[applicationId]?.[fieldName] ?? "TBD";
}

function appProcessField(process: any, applicationId: string, keys: string[], fallbackKey: string) {
  const canonical = applicationProcessFallback(applicationId, fallbackKey);
  const canonicalKeys = ["fluid", "inletPressure", "outletPressure", "temperature", "leakageClass"];
  if (
    (applicationId === "hydrogen-process-control" || applicationId === "lng-compressor-recycle") &&
    canonicalKeys.includes(fallbackKey) &&
    canonical !== "TBD"
  ) {
    return canonical;
  }
  return processField(process, keys, canonical);
}

function lineItems(extractedData: any) {
  const items = Array.isArray(extractedData?.lineItems) ? extractedData.lineItems : [];
  const intelligence = inferRfpIntelligence(extractedData);
  if (items.length) return items;
  if (intelligence.applicationId === "hydrogen-process-control") {
    return [
      { item: "HV-H2-3101A/B/C/D", description: "Hydrogen isolation/control valve assemblies", quantity: "4", service: "Hydrogen export header", specifications: "Class per RFP" },
      { item: "FV-H2-3150A/B", description: "Hydrogen flow control valves", quantity: "2", service: "Process flow control", specifications: "IEC 60534 / ISA 75.01 awareness" },
      { item: "PV-H2-3190", description: "Hydrogen pressure control valve", quantity: "1", service: "Export header pressure control", specifications: "Leakage class per RFP" },
      { item: "DOC-H2", description: "Traceability and MDR dossier", quantity: "1", service: "Documentation", specifications: "Material and inspection records" },
    ];
  }
  if (intelligence.applicationId === "lng-compressor-recycle") {
    return [
      { item: "XV-CRV-9101A/B/C", description: "LNG compressor recycle control valves", quantity: "3", service: "Compressor recycle / anti-surge", specifications: "Fast response, severe-service trim" },
      { item: "ASP-9101A/B/C", description: "Anti-surge actuator and accessory package", quantity: "3", service: "Fast-response actuator package", specifications: "Positioner, solenoid, volume booster as required" },
      { item: "DOC-9101", description: "Engineering, inspection, and documentation package", quantity: "1", service: "Documentation", specifications: "Datasheets, ITP, calculations, certificates" },
    ];
  }
  return [];
}

export function classifySectionArtifactType(sectionTitle: string): EngineeringArtifactType | null {
  const title = sectionTitle.toLowerCase();
  if (/datasheet/.test(title)) return "datasheet_summary";
  if (/calculation|sizing/.test(title)) return "calculation_summary";
  if (/drawings|technical visuals/.test(title)) return "drawing_package";
  if (/scope|line items/.test(title)) return "scope_breakdown";
  if (/technical specification/.test(title)) return "tbe_matrix";
  if (/valve configuration|trim|actuator|accessor/.test(title)) return "valve_assembly_architecture";
  if (/compliance matrix/.test(title)) return "compliance_matrix";
  if (/technical bid evaluation|\btbe\b/.test(title)) return "tbe_matrix";
  if (/inspection|testing/.test(title)) return "inspection_test_plan";
  if (/qa\/qc|qa-qc|documentation plan/.test(title)) return "qa_dossier_workflow";
  if (/deviation|clarification/.test(title)) return "deviation_register";
  if (/risk/.test(title)) return "risk_register";
  if (/timeline|delivery/.test(title)) return "delivery_schedule";
  if (/dashboard|kpi/.test(title)) return "kpi_dashboard";
  return null;
}

function buildDatasheet(extractedData: any): ArtifactTable[] {
  const intelligence = inferRfpIntelligence(extractedData);
  const process = extractedData?.processConditions ?? {};
  const items = lineItems(extractedData);
  if (intelligence.applicationId === "lng-compressor-recycle") {
    const rows: Array<Record<string, string>> = items.map((item: any) => {
      const tag = clean(field(item, ["tag", "item", "ref", "lineItem"]));
      const itemText = clean(field(item, ["description", "itemDescription"], tag));
      const qty = clean(field(item, ["quantity", "qty"]));
      const specs = clean(field(item, ["sizeClass", "size", "pressureClass", "class", "specifications"]), "Per RFP / engineer validation");
      const service = clean(field(item, ["service", "application"]), "Compressor recycle / anti-surge");
      const isDoc = /doc/i.test(tag);
      const isAccessory = /^asp/i.test(tag);
      return {
        tag,
        itemText,
        qty,
        specs,
        service,
        flowCases: isDoc ? "N/A" : appProcessField(process, intelligence.applicationId, ["flowCases", "flowCase", "flow"], "flowCases"),
        response: isDoc ? "N/A" : clean(field(item, ["responseRequirement"]), applicationProcessFallback(intelligence.applicationId, "responseRequirement")),
        configuration: isDoc ? "N/A" : isAccessory ? "Actuator/accessory package" : "Severe-service recycle control valve with validated trim",
        accessories: isDoc ? "N/A" : isAccessory ? "Positioner, solenoid, booster, filter regulator, limit switches as specified" : "Matched actuator and accessories per anti-surge response basis",
        documentation: isDoc ? "Engineering dossier, datasheets, ITP, test certificates" : "Datasheet, GA drawing, calculation summary, ITP, certificates",
        status: "Proposal-stage; final engineering review required",
      };
    });
    return [{
      title: "Line Item Summary",
      layout: "compact",
      columns: ["Tag / Ref", "Item", "Qty", "Size / Class", "Service"],
      rows: rows.map((row) => [row.tag, row.itemText, row.qty, row.specs, row.service]),
    }, {
      title: "Engineering Review Summary",
      layout: "compact",
      columns: ["Tag / Ref", "Flow Cases", "Response Requirement", "Valve Configuration", "Accessory Package", "Documentation", "Review Status"],
      rows: rows.map((row) => [row.tag, row.flowCases, row.response, row.configuration, row.accessories, row.documentation, row.status]),
    }];
  }
  const rows: Array<Record<string, string>> = items.map((item: any) => {
    const tag = clean(field(item, ["tag", "item", "ref", "lineItem"]));
    const itemText = clean(field(item, ["description", "itemDescription"], tag));
    const qty = clean(field(item, ["quantity", "qty"]));
    const isDoc = /doc/i.test(tag);
    return {
      tag,
      itemText,
      qty,
      specs: clean(field(item, ["sizeClass", "size", "pressureClass", "class", "specifications"]), "Per RFP / engineer validation"),
      service: clean(field(item, ["service", "application"]), intelligence.serviceType),
      fluid: clean(field(item, ["fluid"]) || field(process, ["fluid", "serviceFluid", "service"]), applicationProcessFallback(intelligence.applicationId, "fluid")),
      inlet: isDoc ? "N/A" : appProcessField(process, intelligence.applicationId, ["inletPressure", "upstreamPressure", "p1"], "inletPressure"),
      outlet: isDoc ? "N/A" : appProcessField(process, intelligence.applicationId, ["outletPressure", "downstreamPressure", "p2"], "outletPressure"),
      temperature: isDoc ? "N/A" : appProcessField(process, intelligence.applicationId, ["temperature", "operatingTemperature", "temp"], "temperature"),
      leakage: isDoc ? "N/A" : appProcessField(process, intelligence.applicationId, ["leakageClass"], "leakageClass"),
      configuration: isDoc ? "N/A" : clean(field(item, ["valveConfiguration"]), intelligence.applicationId === "hydrogen-process-control" ? "Hydrogen-compatible control valve; sealing reviewed" : "Severe-service control valve"),
      accessories: isDoc ? "N/A" : clean(field(item, ["accessories"]), "Positioner, solenoid, airset/filter regulator, limit switches as specified"),
      documentation: isDoc ? "Traceability dossier / MDR" : "Datasheet, GA drawing, material certificates, test records",
      status: "Proposal-stage; final engineering review required",
    };
  });
  return [{
    title: "Line Item Summary",
    layout: "compact",
    columns: ["Tag / Ref", "Item", "Qty", "Size / Class", "Service"],
    rows: rows.map((row) => [row.tag, row.itemText, row.qty, row.specs, row.service]),
  }, {
    title: "Process and Engineering Review Summary",
    layout: "compact",
    columns: ["Tag / Ref", "Fluid", "Inlet Pressure", "Outlet Pressure", "Temperature", "Leakage Class", "Valve Configuration"],
    rows: rows.map((row) => [row.tag, row.fluid, row.inlet, row.outlet, row.temperature, row.leakage, row.configuration]),
  }, {
    title: "Accessories, Documentation, and Review Status",
    layout: "compact",
    columns: ["Tag / Ref", "Actuator / Accessories", "Documentation", "Review Status"],
    rows: rows.map((row) => [row.tag, row.accessories, row.documentation, row.status]),
  }];
}

function buildCalculationTables(extractedData: any): ArtifactTable[] {
  const intelligence = inferRfpIntelligence(extractedData);
  const process = extractedData?.processConditions ?? {};
  const processInputs: ArtifactTable = {
    columns: ["Input", "Proposal-Stage Value", "Validation Note"],
    rows: [
      ["Fluid / Service", appProcessField(process, intelligence.applicationId, ["fluid", "serviceFluid", "service"], "fluid"), "Confirm final fluid properties and phase"],
      ["Inlet Pressure", appProcessField(process, intelligence.applicationId, ["inletPressure", "upstreamPressure", "p1"], "inletPressure"), "Final sizing input"],
      ["Outlet Pressure", appProcessField(process, intelligence.applicationId, ["outletPressure", "downstreamPressure", "p2"], "outletPressure"), "Final sizing input"],
      ["Temperature", appProcessField(process, intelligence.applicationId, ["temperature", "operatingTemperature", "temp"], "temperature"), "Confirm min/max cases"],
      ["Leakage Class", appProcessField(process, intelligence.applicationId, ["leakageClass"], "leakageClass"), "Validate class feasibility"],
      ["Indicative Cv/Kv", "Placeholder only", "Not certified final sizing"],
    ],
  };
  const riskRows = intelligence.applicationId === "hydrogen-process-control"
    ? [
        ["Hydrogen compatibility", "High", "Screen wetted materials and seals"],
        ["Embrittlement screening", "Review", "Validate material selection assumptions"],
        ["Leakage class feasibility", "Review", "Confirm trim/seating design"],
        ["Hazardous area accessories", "Review", "Confirm certification basis"],
        ["Traceability dossier completeness", "High", "MTC/MDR workflow required"],
      ]
    : intelligence.applicationId === "lng-compressor-recycle"
      ? [
          ["High pressure drop", "High", "Multi-stage trim/noise review required"],
          ["Choked-flow risk", "High", "Validate with company sizing tool"],
          ["Acoustic fatigue", "High", "Confirm outlet piping/noise data"],
          ["Fast response / anti-surge duty", "High", "Validate actuator dynamics"],
        ["Gas composition / outlet piping data", "Open", "Client clarification required if absent"],
        ]
      : intelligence.keyRisks.map((risk) => [risk, "Review", "Engineer validation required"]);
  return [
    processInputs,
    {
      columns: ["Assumption / Missing Data", "Status", "Action"],
      rows: [
        ["Final process cases", "Requires validation", "Confirm normal/min/max/emergency cases"],
        ["Fluid properties", "Requires validation", "Confirm molecular weight, vapor pressure, density, phase"],
        ["Pressure-temperature rating", "Requires validation", "Check ASME B16.34 and project class"],
        ["Noise/vibration basis", "Requires validation", "Confirm acoustic criteria and piping data"],
      ],
    },
    {
      columns: ["Risk Flag", "Severity", "Proposal Response"],
      rows: riskRows,
    },
    {
      columns: ["Standards Basis", "Proposal-Stage Awareness"],
      rows: [
        ["ISA 75.01 / IEC 60534", "Control valve sizing and severe-service review basis"],
        ["ASME B16.34", "Pressure-temperature and valve rating awareness"],
        ["NACE MR0175 / ISO 15156", "Apply where sour service/material restrictions are relevant"],
        ["Project ITP / test references", "Inspection, hydrotest, leakage, functional testing, and documentation requirements"],
      ],
    },
  ];
}

function drawingVisuals(extractedData: any): ArtifactVisual[] {
  const intelligence = inferRfpIntelligence(extractedData);
  if (intelligence.applicationId === "hydrogen-process-control") {
    return [
      { title: "Hydrogen Service System Topology", layoutType: "PFD-Style Proposal Flow", nodes: ["Hydrogen feed", "Isolation/filtration", "Hydrogen control valve package", "Export header", "Pressure/leakage monitoring", "Process safety review"] },
      { title: "Control Valve + Actuator/Accessory Architecture", layoutType: "Control Loop Architecture", nodes: ["Controller signal", "Positioner", "Solenoid", "Actuator", "Hydrogen control valve", "Limit switches / feedback"] },
      { title: "Material Compatibility and Traceability Workflow", layoutType: "Traceability / MDR Workflow", nodes: ["Material class", "Hydrogen compatibility screen", "MTC review", "PMI/traceability", "MDR dossier release"] },
      { title: "Leakage Class / Sealing Review Flow", layoutType: "Engineering Review Workflow", nodes: ["Leakage class requirement", "Seat/seal selection", "Hydrogen sealing review", "Test plan", "Engineer approval"] },
      { title: "Inspection and Dossier Workflow", layoutType: "Inspection & Test Workflow", nodes: ["ITP", "Material certificates", "Leakage/function tests", "Inspection release", "Final data book"] },
    ];
  }
  if (intelligence.applicationId === "lng-compressor-recycle") {
    return [
      { title: "Compressor Recycle / Anti-Surge Architecture", layoutType: "PFD-Style Proposal Flow", nodes: ["Compressor discharge", "Recycle takeoff", "Fast-response recycle valve", "Suction return", "Anti-surge controller"] },
      { title: "Fast Response Control Loop", layoutType: "Control Loop Architecture", nodes: ["Anti-surge controller", "Positioner", "Volume booster", "Actuator", "Recycle valve", "Feedback"] },
      { title: "Severe-Service Trim Selection Flow", layoutType: "Engineering Review Workflow", nodes: ["Pressure drop", "Choked-flow screen", "Noise/acoustic review", "Trim staging", "Engineer validation"] },
      { title: "Acoustic / Noise Risk Review Flow", layoutType: "Risk / Deviation Decision Tree", nodes: ["Noise limit", "Outlet piping data", "Acoustic fatigue screen", "Mitigation", "Clarification/approval"] },
      { title: "Inspection and Test Workflow", layoutType: "Inspection & Test Workflow", nodes: ["ITP review", "Hydrotest", "Seat leakage", "Functional stroke", "Accessory loop check", "Final release"] },
    ];
  }
  if (intelligence.applicationId === "steam-conditioning") {
    return [
      { title: "Steam Letdown / Desuperheating Arrangement", layoutType: "PFD-Style Proposal Flow", nodes: ["HP steam", "Letdown trim", "Spray water", "Desuperheating zone", "Conditioned steam header"] },
      { title: "Temperature Control Loop", layoutType: "Control Loop Architecture", nodes: ["Temperature transmitter", "Controller", "Spray water valve", "Steam conditioning valve", "Header feedback"] },
      { title: "Noise Attenuation Review Flow", layoutType: "Engineering Review Workflow", nodes: ["Pressure letdown", "Noise limit", "Attenuation trim", "Outlet velocity review", "Validation"] },
      { title: "Thermal Cycling Risk Workflow", layoutType: "Risk / Deviation Decision Tree", nodes: ["Thermal cases", "Material review", "Fatigue screen", "Inspection plan", "Approval"] },
    ];
  }
  return [
    { title: "Process Pressure Letdown Flow", layoutType: "PFD-Style Proposal Flow", nodes: ["High pressure line", "Control valve", "Pressure letdown", "Downstream process", "Review point"] },
    { title: "Cavitation / Flashing Risk Tree", layoutType: "Risk / Deviation Decision Tree", nodes: ["Pressure drop", "Cavitation screen", "Flashing screen", "Trim/material mitigation", "Engineer approval"] },
    { title: "NACE / Material Compliance Workflow", layoutType: "Engineering Review Workflow", nodes: ["Service chemistry", "NACE applicability", "Material selection", "Traceability", "Compliance response"] },
    { title: "Valve / Trim / Accessory Architecture", layoutType: "Valve Assembly / Accessory Architecture", nodes: ["Valve body", "Severe-service trim", "Actuator", "Positioner/accessories", "Final package"] },
  ];
}

function genericTable(type: EngineeringArtifactType, extractedData: any): ArtifactTable {
  const intelligence = inferRfpIntelligence(extractedData);
  if (type === "scope_breakdown") {
    return {
      columns: ["Package Element", "RFP Basis", "Proposal Response"],
      rows: lineItems(extractedData).map((item: any) => [clean(field(item, ["item", "tag", "ref"])), clean(field(item, ["description", "service"])), "Included / proposal-stage review"]),
    };
  }
  if (type === "compliance_matrix") {
    if (intelligence.applicationId === "hydrogen-process-control") {
      return {
        columns: ["Requirement", "Standard / Basis", "Proposal Response"],
        rows: [
          ["Hydrogen material compatibility", "Project material specification / hydrogen service review", "Screen wetted materials, seals, and trim before final design release"],
          ["Leakage class and high-integrity sealing", "RFP leakage class; ISA 75.01 / IEC 60534 awareness", "Class V requested for selected tags; final feasibility requires engineering validation"],
          ["Traceability / MDR", "Project documentation and QA dossier requirements", "MTC, PMI/traceability, test records, and MDR release included"],
          ["Hazardous-area accessory certificates", "Project area classification / accessory certification basis", "Positioner, solenoid, switches, and accessories to be reviewed against project certification requirements"],
          ["ASME B16.34 awareness", "Pressure-temperature rating awareness", "Pressure class and material rating to be validated during final engineering"],
          ["Proposal-stage engineering disclaimer", "Company-approved sizing/design tools required", SEVERE_SERVICE_DISCLAIMER],
        ],
      };
    }
    if (intelligence.applicationId === "lng-compressor-recycle") {
      return {
        columns: ["Requirement", "Standard / Basis", "Proposal Response"],
        rows: [
          ["Compressor recycle / anti-surge response", "RFP fast-response duty", "Actuator dynamics and accessory package included for final validation"],
          ["Severe-service trim", "ISA 75.01 / IEC 60534 awareness", "Multi-stage / anti-surge trim basis included; final sizing by approved tools required"],
          ["Acoustic/noise risk", "Project noise criteria and outlet piping data", "Noise and acoustic fatigue review flagged for engineering validation"],
          ["Actuator fast response", "Anti-surge control loop requirements", "Positioner, booster, solenoid, and feedback path captured"],
          ["ASME B16.34 awareness", "Pressure-temperature rating awareness", "Pressure class and material rating to be validated during final engineering"],
          ["Inspection/test requirements", "Project ITP, hydrotest, leakage, functional test references", "ITP, hydrotest, seat leakage, stroke, accessory loop check, and final release included"],
        ],
      };
    }
    return { columns: ["Requirement", "Standard / Basis", "Status"], rows: intelligence.complianceItems.map((item) => [item.label, item.standard, "Mapped for review"]) };
  }
  if (type === "tbe_matrix") {
    if (intelligence.applicationId === "hydrogen-process-control") {
      return { columns: ["Evaluation Tag", "Proposal Response", "Engineering Comment"], rows: [
        ["Material compatibility", "Hydrogen-compatible wetted material review included", "Final selection requires hydrogen compatibility and embrittlement screening"],
        ["Trim", "Control valve trim basis captured for proposal-stage review", "Final Cv/trim selection requires approved sizing tools"],
        ["Sealing", "Class V requested for selected tags", "Seat/seal feasibility requires engineer validation"],
        ["Actuator", "Actuator package included per control duty", "Final thrust/speed/accessory sizing required"],
        ["Accessories", "Positioner, solenoid, airset/filter regulator, limit switches as specified", "Confirm hazardous-area certification basis"],
        ["Documentation", "MTC, PMI/traceability, leakage/function tests, MDR data book", "Dossier completeness tracked in QA workflow"],
      ] };
    }
    if (intelligence.applicationId === "lng-compressor-recycle") {
      return { columns: ["Evaluation Tag", "Proposal Response", "Engineering Comment"], rows: [
        ["Material", "Material basis captured for LNG recycle gas service", "Final pressure-temperature rating and compatibility review required"],
        ["Trim", "Severe-service recycle control trim basis included", "Choked-flow/noise validation required"],
        ["Actuator", "Fast-response actuator basis included for anti-surge duty", "Final actuator dynamics and stroke time require validation"],
        ["Accessories", "Positioner, solenoid, booster, filter regulator, limit switches as specified", "Accessory loop to be checked during final engineering"],
        ["Testing", "Hydrotest, seat leakage, functional stroke, accessory loop check", "Witness/hold points to follow project ITP"],
        ["Documentation", "Datasheet, GA drawing, calculation summary, ITP, certificates", "Final MDR/data book included in dossier workflow"],
      ] };
    }
    return { columns: ["Evaluation Tag", "Proposal Response", "Engineering Comment"], rows: intelligence.keyRisks.map((risk) => [risk, "Mapped for proposal-stage review", "Engineer validation required"]) };
  }
  if (type === "inspection_test_plan") {
    return { columns: ["Stage", "Activity", "Evidence"], rows: [["ITP review", "Confirm witness/hold points", "Approved ITP"], ["Material verification", "MTC/PMI/NDE where applicable", "Certificates"], ["Pressure/leakage testing", "Hydrotest and seat leakage", "Test reports"], ["Functional checks", "Stroke/accessory loop checks", "FAT records"], ["Release", "Final inspection and dossier", "MDR/data book"]] };
  }
  if (type === "qa_dossier_workflow") {
    return { columns: ["Dossier Element", "Owner", "Output"], rows: [["Datasheets/GA", "Engineering", "Approved technical package"], ["MTC/traceability", "QA/QC", "Material record"], ["Test certificates", "Inspection", "Release evidence"], ["Deviation register", "Proposal/Engineering", "Approved position"], ["MDR data book", "Document control", "Final dossier"]] };
  }
  if (type === "deviation_register") {
    return { columns: ["Clarification / Deviation", "Reason", "Action"], rows: [["Missing final process cases", "Sizing validation dependency", "Client clarification"], ["Final accessory make/model", "Project preference dependency", "Confirm during technical review"], ["Noise/piping data", "Acoustic validation dependency", "Engineering query"]] };
  }
  if (type === "risk_register") {
    return { columns: ["Risk", "Severity", "Mitigation"], rows: intelligence.keyRisks.map((risk) => [risk, "Review", "Assign owner and validate before final design release"]) };
  }
  if (type === "delivery_schedule") {
    return { columns: ["Phase", "Indicative Sequence", "Output"], rows: [["RFP review", "Week 1", "Clarifications and basis"], ["Engineering validation", "Weeks 1-2", "Datasheet/calculation review"], ["Procurement/manufacturing", "Post-award", "Valve package build"], ["Inspection/testing", "Before dispatch", "ITP and test records"], ["Documentation handover", "Final", "MDR/data book"]] };
  }
  if (type === "kpi_dashboard") {
    return { columns: ["Metric", "Demo Value"], rows: [["Turnaround reduction", "40-60%"], ["Reusable engineering content", "50-70%"], ["Engineering hours saved", "25-40 hours per complex bid"], ["Compliance coverage", "90%+"], ["TBE completion", "High visibility"]] };
  }
  return { columns: ["Artifact", "Proposal-Stage Output"], rows: [[formatArtifactTitle(type), "Proposal-stage engineering visual generated from extracted RFP requirements"]] };
}

export function buildEngineeringArtifact(params: {
  sectionTitle: string;
  proposalId?: string;
  sectionId?: string;
  templateType?: string | null;
  extractedData?: any;
}): EngineeringArtifact | null {
  const extractedData = params.extractedData ?? {};
  const intelligence = inferRfpIntelligence(extractedData);
  const meta = parseProposalTemplateMetadata(params.templateType);
  const applicationType = meta.application || intelligence.application;
  if (!intelligence.isSevereServiceValve && !/severe-service|hydrogen|lng|compressor|steam|refinery/i.test(params.templateType ?? "")) return null;
  const artifactType = classifySectionArtifactType(params.sectionTitle);
  if (!artifactType) return null;

  const sourceRefs = lineItems(extractedData).map((item: any) => clean(field(item, ["item", "tag", "ref", "lineItem"]))).filter(Boolean);
  if (artifactType === "datasheet_summary") {
    return {
      artifactType,
      applicationType,
      title: "Proposal-Stage Datasheet Summary",
      sourceRfpReferences: sourceRefs,
      renderedLayoutType: "native_datasheet_table",
      tables: buildDatasheet(extractedData),
      disclaimer: SEVERE_SERVICE_DISCLAIMER,
    };
  }
  if (artifactType === "calculation_summary") {
    return {
      artifactType,
      applicationType,
      title: "Preliminary Engineering Calculation Summary",
      sourceRfpReferences: sourceRefs,
      renderedLayoutType: "calculation_tables",
      tables: buildCalculationTables(extractedData),
      disclaimer: SEVERE_SERVICE_DISCLAIMER,
    };
  }
  if (artifactType === "drawing_package") {
    const drawingPackages = buildDrawingPackages({
      proposalId: params.proposalId,
      templateType: params.templateType,
      extractedData,
    });
    return {
      artifactType,
      applicationType,
      title: "Drawing Package and Technical Visuals",
      sourceRfpReferences: sourceRefs,
      renderedLayoutType: "drawing_intelligence_engine",
      drawingPackages,
      disclaimer: SEVERE_SERVICE_DISCLAIMER,
    };
  }
  return {
    artifactType,
    applicationType,
    title: formatArtifactTitle(artifactType),
    sourceRfpReferences: sourceRefs,
    renderedLayoutType: "structured_artifact_table",
    tables: [genericTable(artifactType, extractedData)],
  };
}

export function buildSectionArtifacts(params: {
  sections: Array<{ id?: string; sectionTitle?: string; title?: string }>;
  proposalId?: string;
  templateType?: string | null;
  extractedData?: any;
}) {
  const artifacts: Record<string, EngineeringArtifact> = {};
  for (const section of params.sections ?? []) {
    const sectionTitle = section.sectionTitle ?? section.title ?? "";
    const key = section.id ?? sectionTitle;
    const artifact = buildEngineeringArtifact({
      sectionTitle,
      proposalId: params.proposalId,
      sectionId: section.id,
      templateType: params.templateType,
      extractedData: params.extractedData,
    });
    if (artifact) artifacts[key] = artifact;
  }
  return artifacts;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const PROPOSAL_STAGE_VISUAL_DISCLAIMER =
  PROPOSAL_STAGE_DRAWING_DISCLAIMER;

export function getProposalVisualSpec(visual: ArtifactVisual): ProposalVisualSpec {
  const title = visual.title.toLowerCase();
  if (title.includes("hydrogen service system topology")) {
    return {
      title: visual.title,
      visualLabel: "PFD-Style Proposal Flow",
      style: "pfd",
      nodes: ["Hydrogen Feed", "Isolation / Filtration", "Hydrogen Control Valve Package", "Export Header", "Pressure / Leakage Monitoring", "Process Safety Review"],
      primary: "Hydrogen Control Valve Package",
      support: ["Hydrogen compatibility review", "Leakage class review", "Process safety confirmation"],
      annotations: ["ISA 75.01 / IEC 60534 sizing review awareness", "ASME B16.34 pressure-temperature rating awareness", "Project MDR / traceability review"],
    };
  }
  if (title.includes("control valve + actuator/accessory architecture")) {
    return {
      title: visual.title,
      visualLabel: "Control Loop Architecture",
      style: "control_loop",
      nodes: ["Controller Signal", "Positioner", "Solenoid", "Actuator", "Hydrogen Control Valve", "Limit Switch / Feedback"],
      primary: "Hydrogen Control Valve",
      support: ["Accessory certification review", "Fail action / stroking review", "Project-specific confirmation required"],
      annotations: ["IEC 60534 / ISA 75.01 sizing review basis", "Hazardous-area accessory certificates to be validated", "Final thrust and sealing validation required"],
    };
  }
  if (title.includes("compressor recycle / anti-surge architecture")) {
    return {
      title: visual.title,
      visualLabel: "PFD-Style Proposal Flow",
      style: "pfd",
      nodes: ["Compressor Discharge", "Recycle Takeoff", "Fast-Response Recycle Valve", "Suction Return", "Anti-Surge Controller"],
      primary: "Fast-Response Recycle Valve",
      support: ["High pressure-drop review", "Acoustic / noise screen", "Anti-surge response validation"],
      annotations: ["ISA 75.01 / IEC 60534 control valve sizing review awareness", "ASME B16.34 rating awareness", "Project ITP / functional test confirmation required"],
    };
  }
  if (title.includes("fast response control loop")) {
    return {
      title: visual.title,
      visualLabel: "Control Loop Architecture",
      style: "control_loop",
      nodes: ["Anti-Surge Controller", "Positioner", "Volume Booster / Quick Exhaust", "Actuator", "Recycle Valve", "Feedback"],
      primary: "Recycle Valve",
      support: ["Stroke time validation", "Final actuator dynamics required", "Accessory loop check"],
      annotations: ["Anti-surge duty response to be validated", "IEC 60534 / ISA 75.01 sizing review awareness", "Project functional test requirements awareness"],
    };
  }
  if (title.includes("material compatibility and traceability")) {
    return {
      title: visual.title,
      visualLabel: "Traceability / MDR Workflow",
      style: "workflow",
      nodes: ["Material Class", "Hydrogen Compatibility Screen", "MTC Review", "PMI / Traceability", "MDR Dossier Release"],
      primary: "Hydrogen Compatibility Screen",
      support: ["Material restriction review", "Traceability hold point", "Documentation release"],
      annotations: ["NACE MR0175 / ISO 15156 awareness where sour service restrictions apply", "Project MDR / QAP requirements to be validated"],
    };
  }
  if (title.includes("leakage class / sealing")) {
    return {
      title: visual.title,
      visualLabel: "Engineering Review Workflow",
      style: "workflow",
      nodes: ["Leakage Class Requirement", "Seat / Seal Selection", "Hydrogen Sealing Review", "Test Plan", "Engineer Approval"],
      primary: "Hydrogen Sealing Review",
      support: ["Class feasibility review", "Test basis confirmation"],
      annotations: ["Leakage class feasibility requires final engineering validation", "Project test requirements awareness"],
    };
  }
  if (title.includes("inspection and dossier") || title.includes("inspection and test")) {
    return {
      title: visual.title,
      visualLabel: "Inspection & Test Workflow",
      style: "workflow",
      nodes: visual.nodes.map((node) => clean(node)),
      primary: visual.nodes.find((node) => /leakage|functional|hydrotest/i.test(node)) ?? visual.nodes[0],
      support: ["Witness / hold point review", "Final release dossier"],
      annotations: ["Project ITP / QAP review", "API / project-specific test requirements awareness", "MDR data book confirmation required"],
    };
  }
  if (title.includes("trim selection")) {
    return {
      title: visual.title,
      visualLabel: "Engineering Review Workflow",
      style: "workflow",
      nodes: ["Pressure Drop", "Choked-Flow Screen", "Noise / Acoustic Review", "Trim Staging", "Engineer Validation"],
      primary: "Trim Staging",
      support: ["Company sizing tool validation", "Noise / vibration review"],
      annotations: ["IEC 60534 / ISA 75.01 sizing review awareness", "Final trim selection requires qualified engineer validation"],
    };
  }
  if (title.includes("acoustic") || title.includes("noise")) {
    return {
      title: visual.title,
      visualLabel: "Risk / Deviation Decision Tree",
      style: "risk_tree",
      nodes: ["Noise Limit", "Outlet Piping Data", "Acoustic Fatigue Screen", "Mitigation", "Clarification / Approval"],
      primary: "Acoustic Fatigue Screen",
      support: ["Missing data clarification", "Mitigation review"],
      annotations: ["Project noise criteria and piping data required", "Acoustic output requires company-approved validation tools"],
    };
  }
  if (title.includes("steam letdown")) {
    return {
      title: visual.title,
      visualLabel: "PFD-Style Proposal Flow",
      style: "pfd",
      nodes: ["HP Steam", "Letdown Trim", "Spray Water", "Desuperheating Zone", "Conditioned Steam Header"],
      primary: "Letdown Trim",
      support: ["Thermal cycling review", "Noise attenuation review"],
      annotations: ["ASME B16.34 pressure-temperature awareness", "Project desuperheating and test basis to be confirmed"],
    };
  }
  if (title.includes("temperature control loop")) {
    return {
      title: visual.title,
      visualLabel: "Control Loop Architecture",
      style: "control_loop",
      nodes: ["Temperature Transmitter", "Controller", "Spray Water Valve", "Steam Conditioning Valve", "Header Feedback"],
      primary: "Steam Conditioning Valve",
      support: ["Temperature response review", "Accessory configuration validation"],
      annotations: ["Control response to be validated by qualified engineers", "Project functional test awareness"],
    };
  }
  if (title.includes("thermal cycling")) {
    return {
      title: visual.title,
      visualLabel: "Risk / Deviation Decision Tree",
      style: "risk_tree",
      nodes: ["Thermal Cases", "Material Review", "Fatigue Screen", "Inspection Plan", "Approval"],
      primary: "Fatigue Screen",
      support: ["Thermal cycle assumptions", "Inspection hold points"],
      annotations: ["Final fatigue/material review requires company-approved tools", "Project inspection plan to be validated"],
    };
  }
  if (title.includes("pressure letdown")) {
    return {
      title: visual.title,
      visualLabel: "PFD-Style Proposal Flow",
      style: "pfd",
      nodes: ["High Pressure Line", "Control Valve", "Pressure Letdown", "Downstream Process", "Review Point"],
      primary: "Control Valve",
      support: ["Cavitation / flashing screen", "Material compatibility review"],
      annotations: ["ISA 75.01 / IEC 60534 sizing review awareness", "ASME B16.34 rating awareness"],
    };
  }
  if (title.includes("cavitation") || title.includes("flashing")) {
    return {
      title: visual.title,
      visualLabel: "Risk / Deviation Decision Tree",
      style: "risk_tree",
      nodes: ["Pressure Drop", "Cavitation Screen", "Flashing Screen", "Trim / Material Mitigation", "Engineer Approval"],
      primary: "Trim / Material Mitigation",
      support: ["Process data confirmation", "Severe-service review"],
      annotations: ["IEC 60534 / ISA 75.01 sizing review awareness", "Final mitigation requires engineering validation"],
    };
  }
  if (title.includes("nace") || title.includes("material compliance")) {
    return {
      title: visual.title,
      visualLabel: "Engineering Review Workflow",
      style: "workflow",
      nodes: ["Service Chemistry", "NACE Applicability", "Material Selection", "Traceability", "Compliance Response"],
      primary: "NACE Applicability",
      support: ["Sour-service screening", "Material record review"],
      annotations: ["NACE MR0175 / ISO 15156 awareness where applicable", "Licensed standard / project confirmation required"],
    };
  }
  if (title.includes("valve / trim") || title.includes("accessory architecture")) {
    return {
      title: visual.title,
      visualLabel: "Valve Assembly / Accessory Architecture",
      style: "control_loop",
      nodes: ["Valve Body", "Severe-Service Trim", "Actuator", "Positioner / Accessories", "Final Package"],
      primary: "Severe-Service Trim",
      support: ["Assembly review", "Accessory interface review"],
      annotations: ["Pressure-temperature rating and final trim selection require validation", "Project ITP / QAP awareness"],
    };
  }
  return {
    title: visual.title,
    visualLabel: visual.layoutType || "Proposal-Grade Technical Visual",
    style: "workflow",
    nodes: visual.nodes.map((node) => clean(node)),
    primary: visual.nodes[0],
    support: ["Project-specific confirmation required"],
    annotations: ["Proposal-stage visual only", "Final engineering validation required"],
  };
}

function enhancedDrawingHtml(visual: ArtifactVisual, brandColor: string) {
  const spec = getProposalVisualSpec(visual);
  const node = (label: string) => `<div class="artifact-diagram-node ${label === spec.primary ? "primary" : ""}">${escapeHtml(label)}</div>`;
  const arrow = `<div class="artifact-diagram-arrow" style="color:${brandColor};">→</div>`;
  const badge = (label: string) => `<div class="artifact-diagram-feedback" style="border-color:${brandColor};color:${brandColor};">${escapeHtml(label)}</div>`;
  return `
    <div class="artifact-diagram ${escapeHtml(spec.style)}">
      <div class="artifact-diagram-flow">
        ${spec.nodes.map((item, index) => `${node(item)}${index < spec.nodes.length - 1 ? arrow : ""}`).join("")}
      </div>
      <div class="artifact-diagram-support">
        ${(spec.support ?? []).map(badge).join("")}
      </div>
      <div class="artifact-diagram-annotations">
        ${(spec.annotations ?? []).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
      </div>
    </div>`;
}

export function artifactToMarkdown(artifact: EngineeringArtifact) {
  const parts = [artifact.disclaimer ? artifact.disclaimer : ""].filter(Boolean);
  for (const table of artifact.tables ?? []) {
    parts.push(`| ${table.columns.join(" | ")} |`);
    parts.push(`| ${table.columns.map(() => "---").join(" | ")} |`);
    for (const row of table.rows) parts.push(`| ${row.join(" | ")} |`);
    parts.push("");
  }
  for (const visual of artifact.visuals ?? []) {
    parts.push(`- ${visual.title}: ${visual.layoutType} covering ${visual.nodes.join(" -> ")}`);
  }
  for (const drawing of artifact.drawingPackages ?? []) {
    parts.push(drawingPackageToStructuredText(drawing));
  }
  for (const bullet of artifact.bullets ?? []) parts.push(`- ${bullet}`);
  return parts.join("\n");
}

export function renderArtifactForPdf(artifact: EngineeringArtifact, brandColor = "#1a365d") {
  const tables = (artifact.tables ?? []).map((table) => `
    ${table.title ? `<div class="artifact-table-title">${escapeHtml(table.title)}</div>` : ""}
    <table class="artifact-table">
      <thead><tr>${table.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr></thead>
      <tbody>${table.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
  `).join("");
  const drawingPackages = (artifact.drawingPackages ?? []).map((drawing) => renderDrawingPackageHtml(drawing, brandColor)).join("");
  const visuals = drawingPackages || (artifact.visuals ?? []).map((visual) => {
    const enhanced = enhancedDrawingHtml(visual, brandColor);
    return `
    <div class="artifact-visual-card">
      <div class="artifact-visual-title">${escapeHtml(visual.title)}</div>
      <div class="artifact-visual-type">${escapeHtml(getProposalVisualSpec(visual).visualLabel)}</div>
      ${enhanced}
    </div>
  `;
  }).join("");
  return `
    <div class="engineering-artifact">
      <div class="artifact-kicker">${artifact.artifactType === "drawing_package" ? "Proposal-Grade Technical Visual" : "Proposal-Grade Engineering Artifact"}</div>
      <div class="artifact-title">${escapeHtml(artifact.title)}</div>
      <div class="artifact-meta">${escapeHtml(artifact.applicationType)} | ${escapeHtml(artifact.renderedLayoutType.replace(/_/g, " "))}</div>
      ${artifact.disclaimer ? `<div class="artifact-disclaimer">${escapeHtml(artifact.disclaimer)}</div>` : ""}
      ${artifact.artifactType === "drawing_package" ? `<div class="artifact-disclaimer">${escapeHtml(PROPOSAL_STAGE_VISUAL_DISCLAIMER)}</div>` : ""}
      ${tables}
      ${visuals}
    </div>
  `;
}
