import { inferRfpIntelligence, parseProposalTemplateMetadata, SEVERE_SERVICE_DISCLAIMER } from "@/lib/severe-service-intelligence";

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
};

export type ArtifactVisual = {
  title: string;
  layoutType: string;
  nodes: string[];
  edges?: Array<[string, string]>;
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
  disclaimer?: string;
};

function clean(value: unknown, fallback = "TBD") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function field(item: any, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value);
  }
  return fallback;
}

function processField(process: any, keys: string[], fallback = "TBD") {
  return clean(field(process, keys), fallback);
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
  if (/process conditions|service conditions/.test(title)) return "pfd_style_flow";
  if (/technical specification/.test(title)) return "tbe_matrix";
  if (/engineering basis/.test(title)) return "pid_style_control_loop";
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

function buildDatasheet(extractedData: any): ArtifactTable {
  const intelligence = inferRfpIntelligence(extractedData);
  const process = extractedData?.processConditions ?? {};
  const items = lineItems(extractedData);
  if (intelligence.applicationId === "lng-compressor-recycle") {
    return {
      columns: ["Tag / Ref", "Item", "Qty", "Size / Class", "Service", "Flow Cases", "Response Requirement", "Valve Configuration", "Accessory Package", "Documentation", "Review Status"],
      rows: items.map((item: any) => {
        const tag = clean(field(item, ["tag", "item", "ref", "lineItem"]));
        const itemText = clean(field(item, ["description", "itemDescription"], tag));
        const qty = clean(field(item, ["quantity", "qty"]));
        const specs = clean(field(item, ["sizeClass", "size", "pressureClass", "class", "specifications"]), "Per RFP / engineer validation");
        const service = clean(field(item, ["service", "application"]), "Compressor recycle / anti-surge");
        const isDoc = /doc/i.test(tag);
        const isAccessory = /^asp/i.test(tag);
        return [
          tag,
          itemText,
          qty,
          specs,
          service,
          isDoc ? "N/A" : clean(field(process, ["flowCases", "flowCase", "flow"]), "Normal / recycle / trip cases per RFP"),
          isDoc ? "N/A" : clean(field(item, ["responseRequirement"]), "Fast-response anti-surge duty; final actuator dynamics require validation"),
          isDoc ? "N/A" : isAccessory ? "Actuator/accessory package" : "Severe-service recycle control valve with validated trim",
          isDoc ? "N/A" : isAccessory ? "Positioner, solenoid, booster, filter regulator, limit switches as specified" : "Matched actuator and accessories per anti-surge response basis",
          isDoc ? "Engineering dossier, datasheets, ITP, test certificates" : "Datasheet, GA drawing, calculation summary, ITP, certificates",
          "Proposal-stage; final engineering review required",
        ];
      }),
    };
  }
  return {
    columns: ["Tag / Ref", "Item", "Qty", "Size / Class", "Service", "Fluid", "Inlet Pressure", "Outlet Pressure", "Temperature", "Leakage Class", "Valve Configuration", "Actuator / Accessories", "Documentation", "Review Status"],
    rows: items.map((item: any) => {
      const tag = clean(field(item, ["tag", "item", "ref", "lineItem"]));
      const itemText = clean(field(item, ["description", "itemDescription"], tag));
      const qty = clean(field(item, ["quantity", "qty"]));
      const isDoc = /doc/i.test(tag);
      return [
        tag,
        itemText,
        qty,
        clean(field(item, ["sizeClass", "size", "pressureClass", "class", "specifications"]), "Per RFP / engineer validation"),
        clean(field(item, ["service", "application"]), intelligence.serviceType),
        clean(field(item, ["fluid"]) || field(process, ["fluid", "serviceFluid", "service"]), intelligence.applicationId === "hydrogen-process-control" ? "Hydrogen" : "Per RFP"),
        isDoc ? "N/A" : processField(process, ["inletPressure", "upstreamPressure", "p1"]),
        isDoc ? "N/A" : processField(process, ["outletPressure", "downstreamPressure", "p2"]),
        isDoc ? "N/A" : processField(process, ["temperature", "operatingTemperature", "temp"]),
        isDoc ? "N/A" : processField(process, ["leakageClass"], intelligence.applicationId === "hydrogen-process-control" ? "Class per hydrogen service requirement" : "Per RFP"),
        isDoc ? "N/A" : clean(field(item, ["valveConfiguration"]), intelligence.applicationId === "hydrogen-process-control" ? "Hydrogen-compatible control valve; sealing reviewed" : "Severe-service control valve"),
        isDoc ? "N/A" : clean(field(item, ["accessories"]), "Positioner, solenoid, airset/filter regulator, limit switches as specified"),
        isDoc ? "Traceability dossier / MDR" : "Datasheet, GA drawing, material certificates, test records",
        "Proposal-stage; final engineering review required",
      ];
    }),
  };
}

function buildCalculationTables(extractedData: any): ArtifactTable[] {
  const intelligence = inferRfpIntelligence(extractedData);
  const process = extractedData?.processConditions ?? {};
  const processInputs: ArtifactTable = {
    columns: ["Input", "Proposal-Stage Value", "Validation Note"],
    rows: [
      ["Fluid / Service", processField(process, ["fluid", "serviceFluid", "service"], intelligence.serviceType), "Confirm final fluid properties and phase"],
      ["Inlet Pressure", processField(process, ["inletPressure", "upstreamPressure", "p1"]), "Final sizing input"],
      ["Outlet Pressure", processField(process, ["outletPressure", "downstreamPressure", "p2"]), "Final sizing input"],
      ["Temperature", processField(process, ["temperature", "operatingTemperature", "temp"]), "Confirm min/max cases"],
      ["Leakage Class", processField(process, ["leakageClass"], "Per RFP"), "Validate class feasibility"],
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
          ["Gas composition missing", "Open", "Client clarification required if absent"],
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
      { title: "Hydrogen Service System Topology", layoutType: "PFD-style flow", nodes: ["Hydrogen feed", "Isolation/filtration", "Hydrogen control valve package", "Export header", "Pressure/leakage monitoring", "Process safety review"] },
      { title: "Control Valve + Actuator/Accessory Architecture", layoutType: "Control loop architecture", nodes: ["Controller signal", "Positioner", "Solenoid", "Actuator", "Hydrogen control valve", "Limit switches / feedback"] },
      { title: "Material Compatibility and Traceability Workflow", layoutType: "Engineering review workflow", nodes: ["Material class", "Hydrogen compatibility screen", "MTC review", "PMI/traceability", "MDR dossier release"] },
      { title: "Leakage Class / Sealing Review Flow", layoutType: "Engineering review workflow", nodes: ["Leakage class requirement", "Seat/seal selection", "Hydrogen sealing review", "Test plan", "Engineer approval"] },
      { title: "Inspection and Dossier Workflow", layoutType: "QA dossier workflow", nodes: ["ITP", "Material certificates", "Leakage/function tests", "Inspection release", "Final data book"] },
    ];
  }
  if (intelligence.applicationId === "lng-compressor-recycle") {
    return [
      { title: "Compressor Recycle / Anti-Surge Architecture", layoutType: "PFD-style flow", nodes: ["Compressor discharge", "Recycle takeoff", "Fast-response recycle valve", "Suction return", "Anti-surge controller"] },
      { title: "Fast Response Control Loop", layoutType: "Control loop architecture", nodes: ["Anti-surge controller", "Positioner", "Volume booster", "Actuator", "Recycle valve", "Feedback"] },
      { title: "Severe-Service Trim Selection Flow", layoutType: "Engineering review workflow", nodes: ["Pressure drop", "Choked-flow screen", "Noise/acoustic review", "Trim staging", "Engineer validation"] },
      { title: "Acoustic / Noise Risk Review Flow", layoutType: "Risk review workflow", nodes: ["Noise limit", "Outlet piping data", "Acoustic fatigue screen", "Mitigation", "Clarification/approval"] },
      { title: "Inspection and Test Workflow", layoutType: "Inspection/test workflow", nodes: ["ITP review", "Hydrotest", "Seat leakage", "Functional stroke", "Accessory loop check", "Final release"] },
    ];
  }
  if (intelligence.applicationId === "steam-conditioning") {
    return [
      { title: "Steam Letdown / Desuperheating Arrangement", layoutType: "PFD-style flow", nodes: ["HP steam", "Letdown trim", "Spray water", "Desuperheating zone", "Conditioned steam header"] },
      { title: "Temperature Control Loop", layoutType: "Control loop architecture", nodes: ["Temperature transmitter", "Controller", "Spray water valve", "Steam conditioning valve", "Header feedback"] },
      { title: "Noise Attenuation Review Flow", layoutType: "Engineering review workflow", nodes: ["Pressure letdown", "Noise limit", "Attenuation trim", "Outlet velocity review", "Validation"] },
      { title: "Thermal Cycling Risk Workflow", layoutType: "Risk review workflow", nodes: ["Thermal cases", "Material review", "Fatigue screen", "Inspection plan", "Approval"] },
    ];
  }
  return [
    { title: "Process Pressure Letdown Flow", layoutType: "PFD-style flow", nodes: ["High pressure line", "Control valve", "Pressure letdown", "Downstream process", "Review point"] },
    { title: "Cavitation / Flashing Risk Tree", layoutType: "Risk review workflow", nodes: ["Pressure drop", "Cavitation screen", "Flashing screen", "Trim/material mitigation", "Engineer approval"] },
    { title: "NACE / Material Compliance Workflow", layoutType: "Engineering review workflow", nodes: ["Service chemistry", "NACE applicability", "Material selection", "Traceability", "Compliance response"] },
    { title: "Valve / Trim / Accessory Architecture", layoutType: "Control valve package architecture", nodes: ["Valve body", "Severe-service trim", "Actuator", "Positioner/accessories", "Final package"] },
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
    return { columns: ["Requirement", "Standard / Basis", "Status"], rows: intelligence.complianceItems.map((item) => [item.label, item.standard, "Mapped for review"]) };
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
  return { columns: ["Artifact", "Proposal-Stage Output"], rows: [[type.replace(/_/g, " "), "Generated from RFP intelligence and engineering review rules"]] };
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
      tables: [buildDatasheet(extractedData)],
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
    return {
      artifactType,
      applicationType,
      title: "Drawing Package and Technical Visuals",
      sourceRfpReferences: sourceRefs,
      renderedLayoutType: "drawing_gallery",
      visuals: drawingVisuals(extractedData),
      disclaimer: SEVERE_SERVICE_DISCLAIMER,
    };
  }
  return {
    artifactType,
    applicationType,
    title: artifactType.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
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
  for (const bullet of artifact.bullets ?? []) parts.push(`- ${bullet}`);
  return parts.join("\n");
}

export function renderArtifactForPdf(artifact: EngineeringArtifact, brandColor = "#1a365d") {
  const tables = (artifact.tables ?? []).map((table) => `
    <table class="artifact-table">
      <thead><tr>${table.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr></thead>
      <tbody>${table.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
  `).join("");
  const visuals = (artifact.visuals ?? []).map((visual) => `
    <div class="artifact-visual-card">
      <div class="artifact-visual-title">${escapeHtml(visual.title)}</div>
      <div class="artifact-visual-type">${escapeHtml(visual.layoutType)}</div>
      <div class="artifact-node-row">
        ${visual.nodes.map((node, index) => `
          <div class="artifact-node-wrap">
            <div class="artifact-node">${escapeHtml(node)}</div>
            ${index < visual.nodes.length - 1 ? `<div class="artifact-arrow" style="color:${brandColor};">→</div>` : ""}
          </div>
        `).join("")}
      </div>
    </div>
  `).join("");
  return `
    <div class="engineering-artifact">
      <div class="artifact-kicker">Proposal-Grade Engineering Artifact</div>
      <div class="artifact-title">${escapeHtml(artifact.title)}</div>
      <div class="artifact-meta">${escapeHtml(artifact.applicationType)} | ${escapeHtml(artifact.renderedLayoutType.replace(/_/g, " "))}</div>
      ${artifact.disclaimer ? `<div class="artifact-disclaimer">${escapeHtml(artifact.disclaimer)}</div>` : ""}
      ${tables}
      ${visuals}
    </div>
  `;
}
