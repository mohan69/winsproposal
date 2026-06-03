export type VisualizationType =
  | "architecture"
  | "process_flow"
  | "workflow"
  | "compliance_flow"
  | "kpi_dashboard"
  | "tbe_matrix"
  | "risk_tree"
  | "value_chain"
  | "proposal_lifecycle"
  | "engineering_dependency"
  | "flowchart"
  | "sequence"
  | "gantt"
  | "pfd";

export interface VisualizationContext {
  title: string;
  industry?: string;
  templateType?: string;
  subType?: string;
  sectionTitle?: string;
  content: string;
}

export interface GeneratedVisualization {
  type: VisualizationType;
  title: string;
  mermaidCode: string;
  imageUrl: string;
}

export const VISUALIZATION_TYPES: Array<{
  id: VisualizationType;
  label: string;
  exportLabel: string;
  description: string;
}> = [
  {
    id: "architecture",
    label: "Architecture",
    exportLabel: "Architecture Diagram",
    description: "System, package, subsystem, interface, and integration architecture.",
  },
  {
    id: "process_flow",
    label: "Process Flow",
    exportLabel: "Process Flow Diagram",
    description: "EPC, manufacturing, test, commissioning, and handover process flows.",
  },
  {
    id: "workflow",
    label: "Workflow",
    exportLabel: "Workflow Diagram",
    description: "Commercial, engineering, procurement, QA/QC, and review workflows.",
  },
  {
    id: "compliance_flow",
    label: "Compliance",
    exportLabel: "Compliance Flow",
    description: "Standards, inspection, test, deviation, and approval compliance paths.",
  },
  {
    id: "kpi_dashboard",
    label: "KPI Dashboard",
    exportLabel: "KPI Dashboard Visual",
    description: "Executive metrics, throughput, turnaround, bid value, compliance, and effort reduction.",
  },
  {
    id: "tbe_matrix",
    label: "TBE Matrix",
    exportLabel: "Technical Bid Evaluation Matrix",
    description: "Line-item, tag, compliance, deviation, and response comparison views.",
  },
  {
    id: "risk_tree",
    label: "Risk Tree",
    exportLabel: "Risk and Deviation Decision Tree",
    description: "Risk flags, deviation decisions, mitigation paths, and approval outcomes.",
  },
  {
    id: "value_chain",
    label: "Value Chain",
    exportLabel: "Proposal Value Chain",
    description: "Scope, value drivers, differentiators, execution promise, and customer outcomes.",
  },
  {
    id: "proposal_lifecycle",
    label: "Lifecycle",
    exportLabel: "Proposal Lifecycle",
    description: "RFP intake through technical review, approval, export, and submission.",
  },
  {
    id: "gantt",
    label: "Schedule",
    exportLabel: "Project Schedule Gantt",
    description: "Project, proposal, engineering, procurement, inspection, and submission timelines.",
  },
  {
    id: "engineering_dependency",
    label: "Dependencies",
    exportLabel: "Engineering Dependency Flow",
    description: "Data, drawings, vendor inputs, approvals, and downstream dependencies.",
  },
];

const TYPE_TO_PROMPT: Record<VisualizationType, string> = {
  architecture: "an architecture diagram showing systems, packages, subsystems, external interfaces, controls, and integration boundaries",
  process_flow: "a process flow diagram showing the industrial process, engineering sequence, inspection points, outputs, and handoffs",
  workflow: "a workflow diagram showing roles, reviews, decisions, document submissions, and approvals",
  compliance_flow: "a compliance flow showing applicable standards, document evidence, inspection gates, deviations, and approval closure",
  kpi_dashboard: "a KPI dashboard-style Mermaid flow or quadrant showing bid value, turnaround, compliance coverage, vault reuse, and engineering effort metrics",
  tbe_matrix: "a technical bid evaluation matrix-style Mermaid diagram showing line items, evaluation tags, compliance status, deviations, and response evidence",
  risk_tree: "a risk and deviation decision tree showing risk identification, impact, mitigation, approval, and closure outcomes",
  value_chain: "a proposal value chain visual showing customer scope, technical fit, compliance confidence, delivery assurance, and business value",
  proposal_lifecycle: "a proposal lifecycle diagram from RFP intake through bid/no-bid, technical response, compliance review, approval, export, and submission",
  engineering_dependency: "an engineering dependency flow showing inputs, datasheets, drawings, vendor data, calculations, reviews, and deliverables",
  flowchart: "a flowchart showing the process flow, decision points, and key steps",
  sequence: "a sequence diagram showing interactions between stakeholders, systems, or departments",
  gantt: "a Gantt chart showing the project timeline, milestones, and phases",
  pfd: "a process flow diagram showing manufacturing or engineering flow with equipment, inputs, outputs, and connections",
};

export function normalizeVisualizationType(type?: string | null): VisualizationType {
  const normalized = (type || "").trim() as VisualizationType;
  if (normalized === "pfd") return "process_flow";
  if (normalized === "flowchart") return "workflow";
  if (normalized === "sequence") return "workflow";
  if (VISUALIZATION_TYPES.some((item) => item.id === normalized)) return normalized;
  return "workflow";
}

export function getVisualizationTypeMeta(type: VisualizationType) {
  return VISUALIZATION_TYPES.find((item) => item.id === normalizeVisualizationType(type)) ?? VISUALIZATION_TYPES[0];
}

export function shouldRenderProposalDiagram(sectionTitle: string, content = "") {
  const title = sectionTitle.toLowerCase();
  const text = `${title} ${content.toLowerCase()}`;
  return (
    /executive summary|value proposition|proposal overview/.test(title) ||
    /project background|opportunity context|project context|customer context/.test(title) ||
    /scope of supply|scope of work|line items|supply scope|work breakdown/.test(title) ||
    /technical compliance|technical specification response|technical response|requirement response/.test(title) ||
    /commercial offer|commercial summary|pricing|payment terms|warranty|exclusions/.test(text) ||
    /process conditions|service conditions|operating envelope|process data/.test(title) ||
    /engineering basis|technical basis|severe-service application/.test(title) ||
    /risk assessment|deviation|clarification/.test(title) ||
    /project timeline|delivery schedule|schedule|timeline|gantt/.test(title) ||
    /executive dashboard|dashboard|kpi|metric/.test(title)
  );
}

export function getBestVisualizationType(
  sectionTitle: string,
  content: string,
  metadata: { templateType?: string; industry?: string; subType?: string } = {}
): VisualizationType {
  const title = sectionTitle.toLowerCase();
  const text = content.toLowerCase().substring(0, 1800);
  const context = `${title} ${text} ${(metadata.templateType ?? "").toLowerCase()} ${(metadata.industry ?? "").toLowerCase()} ${(metadata.subType ?? "").toLowerCase()}`;

  if (/executive summary|value proposition|proposal overview/.test(title)) return "value_chain";
  if (/project background|opportunity context|project context|customer context/.test(title)) return "process_flow";
  if (/scope of supply|scope of work|line items|supply scope|work breakdown/.test(title)) return "architecture";
  if (/process conditions|service conditions|operating envelope|process data/.test(title)) return "process_flow";
  if (/technical specification response|technical response|requirement response/.test(title)) return "engineering_dependency";
  if (/technical compliance|technical specification response|technical response|requirement response/.test(title)) return "engineering_dependency";
  if (/commercial offer|commercial summary|pricing|payment terms|warranty|exclusions/.test(title)) return "value_chain";
  if (/engineering basis|technical basis|compressor recycle|anti-surge|severe-service application/.test(title)) return "engineering_dependency";
  if (/preliminary engineering calculation|calculation summary|validation workflow|sizing basis/.test(title)) return "engineering_dependency";
  if (/valve configuration|trim|actuator|accessor|valve assembly/.test(title)) return "architecture";
  if (/datasheet summary|datasheet table|tag summary/.test(title)) return "tbe_matrix";
  if (/inspection|testing|hold point|itp/.test(title)) return "workflow";
  if (/quality assurance|qa\/qc|qa-qc|quality plan|documentation plan/.test(title)) return "workflow";
  if (/documentation|deliverables|data book|mdr|dossier/.test(title)) return "workflow";
  if (/drawings|technical visuals|drawing gallery|p&id|pfd/.test(title)) return "architecture";
  if (/technical deviation|deviation|clarification|risk assessment|risk/.test(title)) return "risk_tree";
  if (/technical evaluation|technical bid evaluation|\btbe\b/.test(title)) return "tbe_matrix";
  if (/project timeline|delivery schedule|schedule|timeline|gantt|delivery/.test(title)) return "gantt";
  if (/compliance matrix|coverage matrix|mandatory clause|clause closure/.test(title)) return "compliance_flow";
  if (/executive dashboard|dashboard|kpi|metric/.test(title)) return "kpi_dashboard";
  if (/dashboard|kpi|metric|throughput|turnaround|bid value|win score|effort reduction|visibility/.test(context)) return "kpi_dashboard";
  if (/technical bid evaluation|\btbe\b|evaluation tag|line item|technical comparison|bid evaluation/.test(context)) return "tbe_matrix";
  if (/compliance matrix|coverage matrix|mandatory clause|clause closure/.test(title)) return "compliance_flow";
  if (/workflow|approval path|approval|owner|reviewer|manager|coordinator|release gate|submit/.test(title)) return "workflow";
  if (/schedule|timeline|delivery|milestone|gantt|project schedule|lead time/.test(context)) return "gantt";
  if (/risk|deviation|exception|waiver|mitigation|impact|decision tree/.test(context)) return "risk_tree";
  if (/technical compliance|engineering basis|technical basis|datasheet|calculation|material|npsh|api 600|api 610|api 682|asme|nace/.test(title)) return "engineering_dependency";
  if (/technical compliance|engineering basis|technical basis|datasheet|calculation|material|npsh|api 600|api 610|api 682|asme|nace/.test(context)) return "engineering_dependency";
  if (/compliance matrix|coverage matrix|mandatory clause|clause closure|standard|inspection|itp|api|iso|certification|qa|qc/.test(context)) return "compliance_flow";
  if (/architecture|interface|integration|system|automation|scada|control|network|valve system|pump system/.test(context)) return "architecture";
  if (/process plant|epc scope|p&id|pfd|process flow|manufacturing|fabrication|construction|commissioning|refinery|petrochemical/.test(context)) return "process_flow";
  if (/pump|valve|skid|package|line class|fluid|hydraulic/.test(context)) return "architecture";
  return "workflow";
}

export function sanitizeMermaidCode(code: string): string {
  const cleaned = (code || "")
    .replace(/```mermaid\n?/gi, "")
    .replace(/```\n?/g, "")
    .trim();

  return cleaned
    .split("\n")
    .map((line) => {
      if (/^\s*(graph|flowchart|sequenceDiagram|gantt|subgraph|end|style|classDef|class |linkStyle|%%|title|dateFormat|section)/i.test(line)) {
        return line;
      }

      return line.replace(/(\["?)(.*?)(?:"?\])/g, (_match, open, content) => {
        const sanitized = sanitizeMermaidLabel(content);
        return `${open.endsWith('"') ? open : open + '"'}${sanitized}"]`;
      });
    })
    .join("\n");
}

export function sanitizeMermaidLabel(value: string): string {
  return (value || "")
    .replace(/[<>`]/g, "")
    .replace(/\(/g, " - ")
    .replace(/\)/g, "")
    .replace(/\|/g, "-")
    .replace(/\s+-\s+\s*/g, " - ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);
}

export function getMermaidImageUrl(mermaidCode: string, format: "png" | "svg" = "png") {
  const code = sanitizeMermaidCode(mermaidCode);
  const encoded = encodeBase64Url(code);
  const type = format === "svg" ? "svg" : "img";
  return `https://mermaid.ink/${type}/${encoded}?type=${format}&width=900&height=520&bgColor=white`;
}

function encodeBase64Url(value: string): string {
  const base64 = typeof Buffer !== "undefined"
    ? Buffer.from(value, "utf-8").toString("base64")
    : btoa(unescape(encodeURIComponent(value)));

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function getFallbackVisualization(context: VisualizationContext, type: VisualizationType): GeneratedVisualization {
  const title = context.sectionTitle || context.title || "Proposal Workflow";
  const safeTitle = sanitizeMermaidLabel(title);
  const diagramTitle = VISUALIZATION_TYPES.find((item) => item.id === type)?.exportLabel ?? "Workflow Diagram";
  const combined = `${title} ${context.content} ${context.templateType ?? ""} ${context.industry ?? ""}`.toLowerCase();
  const isHydrogen = /hydrogen|\bh2\b|export header|traceability|leakage class/.test(combined);
  const isLng = /lng|compressor recycle|anti[-\s]?surge|\bcrv\b|fast[-\s]?response/.test(combined);
  const isSteam = /steam conditioning|desuperheat|spray water|thermal cycling/.test(combined);
  const isRefinery = /refinery|cavitation|flashing|nace|sour service/.test(combined);
  const sectionSpecific = () => {
    if (/executive summary|value proposition|proposal overview/.test(title.toLowerCase())) {
      return `graph LR
  A["Customer Requirement"] --> B["Technical Compliance"]
  B --> C["Delivery Confidence"]
  C --> D["Risk Reduction"]
  D --> E["Commercial Value"]
  E --> F["Win Theme"]`;
    }
    if (/project background|opportunity context|project context|customer context/.test(title.toLowerCase())) {
      return `graph LR
  A["Hydrogen Hub Project"] --> B["Process Criticality"]
  B --> C["Severe Service Valve Requirement"]
  C --> D["Compliance Standards"]
  D --> E["OEM EPC Evaluation"]
  E --> F["Bid Opportunity"]`;
    }
    if (/scope of supply|scope of work|line items|supply scope|work breakdown/.test(title.toLowerCase())) {
      return `graph LR
  A["RFP Scope"] --> B["Valve Package"]
  B --> C["Actuator Accessories"]
  C --> D["Documentation"]
  D --> E["Inspection Testing"]
  E --> F["Delivery"]`;
    }
    if (/technical compliance|technical specification response|technical response|requirement response/.test(title.toLowerCase())) {
      return `graph LR
  A["Requirement"] --> B["Design Selection"]
  B --> C["Material Compatibility"]
  C --> D["Standards Compliance"]
  D --> E["TBE Response"]
  E --> F["Exceptions"]`;
    }
    if (/commercial offer|commercial summary|pricing|payment terms|warranty|exclusions/.test(title.toLowerCase())) {
      return `graph LR
  A["Scope"] --> B["Cost Drivers"]
  B --> C["Delivery Schedule"]
  C --> D["Risk Allowance"]
  D --> E["Price Justification"]
  E --> F["Margin Protection"]`;
    }
    return "";
  };
  const severeArchitecture = () => {
    if (isHydrogen) return `graph LR
  A["Hydrogen Source"] --> B["Isolation and Strainer"]
  B --> C["Hydrogen Control Valve"]
  C --> D["Export Header"]
  E["Material Compatibility Review"] --> C
  F["Leakage Class and Sealing"] --> C
  G["Traceability Dossier"] --> H["QA Release"]`;
    if (isLng) return `graph LR
  A["Compressor Discharge"] --> B["Recycle Line"]
  B --> C["Anti-Surge Controller"]
  C --> D["Fast Response Actuator"]
  D --> E["Compressor Recycle Valve"]
  E --> F["Compressor Suction"]
  G["Noise and Acoustic Review"] --> E`;
    if (isSteam) return `graph LR
  A["High Pressure Steam"] --> B["Pressure Letdown Trim"]
  B --> C["Desuperheating Zone"]
  D["Spray Water Control"] --> C
  C --> E["Conditioned Steam Header"]
  F["Thermal Cycling Review"] --> B`;
    if (isRefinery) return `graph LR
  A["High Pressure Process Line"] --> B["Severe-Service Trim"]
  B --> C["Pressure Letdown"]
  C --> D["Downstream Process"]
  E["NACE and Materials Review"] --> B
  F["Cavitation and Flashing Review"] --> B`;
    return `graph LR
  A["RFP Requirements"] --> B["Engineering Basis"]
  B --> C["Technical Package"]
  C --> D["Vendor Interfaces"]
  C --> E["Controls and Compliance"]
  D --> F["Integrated Proposal"]`;
  };
  const severeProcessFlow = () => {
    if (isHydrogen) return `graph LR
  A["Hydrogen Feed"] --> B["Filter or Isolation"]
  B --> C["Control Valve Package"]
  C --> D["Export Header"]
  C --> E["Pressure and Leakage Monitoring"]
  E --> F["Process Safety Review"]`;
    if (isLng) return `graph LR
  A["Compressor Discharge"] --> B["Recycle Takeoff"]
  B --> C["Recycle Control Valve"]
  C --> D["Suction Return"]
  E["Anti-Surge Signal"] --> F["Fast Actuator Response"]
  F --> C`;
    if (isSteam) return `graph LR
  A["HP Steam"] --> B["Letdown Valve"]
  B --> C["Desuperheater"]
  D["Spray Water"] --> C
  C --> E["Controlled Temperature Steam"]`;
    if (isRefinery) return `graph LR
  A["Upstream High DP Service"] --> B["Control Valve"]
  B --> C{"Phase Change Risk"}
  C -->|"Cavitation"| D["Trim Mitigation Review"]
  C -->|"Flashing"| E["Material and Velocity Review"]
  D --> F["Technical Response"]`;
    return `graph LR
  A["RFP Intake"] --> B["Technical Review"]
  B --> C["Engineering Inputs"]
  C --> D["QA and Compliance Check"]
  D --> E["Commercial Review"]
  E --> F["Proposal Submission"]`;
  };

  const templates: Record<VisualizationType, string> = {
    architecture: `graph LR
  A["RFP Requirements"] --> B["Engineering Basis"]
  B --> C["Technical Package"]
  C --> D["Vendor Interfaces"]
  C --> E["Controls and Compliance"]
  D --> F["Integrated Proposal"]`,
    process_flow: `graph LR
  A["RFP Intake"] --> B["Technical Review"]
  B --> C["Engineering Inputs"]
  C --> D["QA and Compliance Check"]
  D --> E["Commercial Review"]
  E --> F["Proposal Submission"]`,
    workflow: `graph TD
  A["RFP Received"] --> B{"Bid Fit"}
  B -->|Qualified| C["Assign Owners"]
  C --> D["Draft Response"]
  D --> E["Review and Approve"]
  E --> F["Export and Submit"]`,
    compliance_flow: `graph TD
  A["RFP Clause"] --> B["Map Standard"]
  B --> C["Attach Evidence"]
  C --> D{"Deviation Needed"}
  D -->|No| E["Compliant Response"]
  D -->|Yes| F["Deviation Register"]
  F --> G["Approval Closure"]`,
    kpi_dashboard: `graph LR
  A["Bid Value Visibility"] --> B["Turnaround SLA"]
  A --> C["Compliance Coverage"]
  C --> D["Vault Reuse"]
  B --> E["Engineering Effort Reduction"]
  D --> F["Executive Decision View"]
  E --> F`,
    tbe_matrix: `graph TD
  A["RFP Line Items"] --> B["Evaluation Tags"]
  B --> C["Technical Response"]
  C --> D{"Compliant"}
  D -->|Yes| E["Accepted"]
  D -->|Clarify| F["Deviation or Query"]
  F --> G["TBE Recommendation"]`,
    risk_tree: `graph TD
  A["Risk or Deviation"] --> B{"Impact Level"}
  B -->|Low| C["Document and Proceed"]
  B -->|Medium| D["Mitigation Plan"]
  B -->|High| E["Management Approval"]
  D --> F["Client Clarification"]
  E --> G["Bid Decision"]`,
    value_chain: `graph LR
  A["Customer Scope"] --> B["Technical Fit"]
  B --> C["Compliance Confidence"]
  C --> D["Delivery Assurance"]
  D --> E["Commercial Value"]
  E --> F["Win Theme"]`,
    proposal_lifecycle: `graph LR
  A["Upload RFP"] --> B["Parse Requirements"]
  B --> C["Go No-Go"]
  C --> D["Generate Proposal"]
  D --> E["Compliance Review"]
  E --> F["Approval"]
  F --> G["PDF and DOCX Export"]`,
    engineering_dependency: `graph TD
  A["Client Datasheet"] --> B["Design Basis"]
  B --> C["Calculations"]
  B --> D["Drawings"]
  C --> E["Technical Response"]
  D --> E
  E --> F["QA Review"]`,
    flowchart: `graph TD
  A["Start"] --> B["Review Inputs"]
  B --> C["Prepare Response"]
  C --> D["Validate"]
  D --> E["Submit"]`,
    sequence: `sequenceDiagram
  participant Client
  participant Sales
  participant Engineering
  participant QA
  Client->>Sales: Issue RFP
  Sales->>Engineering: Request technical response
  Engineering->>QA: Submit evidence
  QA-->>Sales: Compliance cleared
  Sales-->>Client: Submit proposal`,
    gantt: `gantt
  title ${safeTitle}
  dateFormat  YYYY-MM-DD
  section Proposal
  RFP Review           :a1, 2026-01-01, 3d
  Technical Response   :a2, after a1, 5d
  Compliance Review    :a3, after a2, 3d
  Final Submission     :a4, after a3, 2d`,
    pfd: `graph LR
  A["Input Requirements"] --> B["Engineering"]
  B --> C["Procurement"]
  C --> D["Fabrication"]
  D --> E["Inspection"]
  E --> F["Delivery"]`,
  };

  const specificTemplate = sectionSpecific();
  let selectedTemplate = specificTemplate || templates[type] || templates.workflow;
  if (!specificTemplate && type === "architecture") selectedTemplate = severeArchitecture();
  if (!specificTemplate && type === "process_flow") selectedTemplate = severeProcessFlow();
  if (!specificTemplate && type === "engineering_dependency" && /calculation|validation|engineering basis|technical specification/.test(combined)) {
    selectedTemplate = `graph TD
  A["RFP Process Inputs"] --> B["Proposal-Stage Assumptions"]
  B --> C["ISA IEC Sizing Review"]
  B --> D["ASME and Materials Review"]
  C --> E["Risk Flags"]
  D --> E
  E --> F["Qualified Engineer Validation"]
  F --> G["Approved Proposal Response"]`;
  }
  if (!specificTemplate && type === "workflow" && /inspection|testing|itp|hold point/.test(combined)) {
    selectedTemplate = `graph LR
  A["ITP Review"] --> B["Material Traceability"]
  B --> C["Hydrotest and Leakage Test"]
  C --> D["Functional Stroke Test"]
  D --> E["Witness or Hold Point"]
  E --> F["Final Inspection Release"]`;
  }
  if (!specificTemplate && type === "workflow" && /qa\/qc|qa-qc|documentation|dossier|mdr|data book/.test(combined)) {
    selectedTemplate = `graph LR
  A["Document Register"] --> B["MTC and Traceability"]
  B --> C["Inspection Records"]
  C --> D["Test Certificates"]
  D --> E["Engineering Review"]
  E --> F["MDR Data Book Release"]`;
  }
  if (!specificTemplate && type === "tbe_matrix" && /datasheet/.test(combined)) {
    selectedTemplate = `graph TD
  A["RFP Tags"] --> B["Datasheet Fields"]
  B --> C["Process Conditions"]
  B --> D["Valve Configuration"]
  B --> E["Actuator Accessories"]
  C --> F["Engineer Review Status"]
  D --> F
  E --> F`;
  }
  if (!specificTemplate && type === "risk_tree" && /deviation|clarification/.test(combined)) {
    selectedTemplate = `graph TD
  A["Open Requirement"] --> B{"Clarification Needed"}
  B -->|"Data Missing"| C["Client Query"]
  B -->|"Exception Needed"| D["Deviation Register"]
  C --> E["Engineering Review"]
  D --> E
  E --> F["Approved Proposal Position"]`;
  }
  const mermaidCode = sanitizeMermaidCode(selectedTemplate);
  return {
    type,
    title: `${safeTitle} - ${diagramTitle}`,
    mermaidCode,
    imageUrl: getMermaidImageUrl(mermaidCode),
  };
}

export async function generateVisualization(
  context: VisualizationContext,
  requestedType?: string | null
): Promise<GeneratedVisualization> {
  const type = normalizeVisualizationType(
    requestedType || getBestVisualizationType(context.sectionTitle || context.title, context.content, {
      templateType: context.templateType,
      industry: context.industry,
      subType: context.subType,
    })
  );

  if (!process.env.ABACUSAI_API_KEY) {
    return getFallbackVisualization(context, type);
  }

  const systemPrompt = `You create export-safe Mermaid diagrams for EPC, valve, pump, and industrial automation proposals.

Rules:
- Output only raw Mermaid code.
- No markdown fences or explanations.
- Use the requested visual form. Use gantt syntax only for schedule/Gantt. Use graph TD/LR for matrix, dashboard, workflow, architecture, risk tree, and value chain visuals.
- Maximum 14 nodes.
- Use concise professional labels.
- Quote every flowchart node label as A["Label"].
- Do not use parentheses in labels. Replace with hyphen notation.
- Do not include HTML, links, scripts, or markdown.
- Use EPC, API, QA/QC, TBE, P&ID, datasheet, inspection, deviation, and commissioning terminology where relevant.`;

  const userPrompt = `Create ${TYPE_TO_PROMPT[type]}.

Proposal: ${context.title}
Section: ${context.sectionTitle || "Overall proposal"}
Industry: ${context.industry || "Industrial"}
Template: ${context.templateType || "General"}

Context:
${context.content.substring(0, 3200)}

Return Mermaid code now.`;

  try {
    const llmResponse = await fetch("https://apps.abacus.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.25,
        max_tokens: 1600,
      }),
    });

    if (!llmResponse.ok) return getFallbackVisualization(context, type);

    const data = await llmResponse.json();
    const mermaidCode = sanitizeMermaidCode(data?.choices?.[0]?.message?.content ?? "");
    if (!mermaidCode) return getFallbackVisualization(context, type);

    return {
      type,
      title: context.sectionTitle || context.title,
      mermaidCode,
      imageUrl: getMermaidImageUrl(mermaidCode),
    };
  } catch (error: any) {
    console.error("Visualization generation failed:", error);
    return getFallbackVisualization(context, type);
  }
}
