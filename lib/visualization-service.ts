export type VisualizationType =
  | "architecture"
  | "process_flow"
  | "workflow"
  | "compliance_flow"
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
    id: "proposal_lifecycle",
    label: "Lifecycle",
    exportLabel: "Proposal Lifecycle",
    description: "RFP intake through technical review, approval, export, and submission.",
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
  if (normalized === "gantt") return "proposal_lifecycle";
  if (VISUALIZATION_TYPES.some((item) => item.id === normalized)) return normalized;
  return "workflow";
}

export function getBestVisualizationType(sectionTitle: string, content: string): VisualizationType {
  const title = sectionTitle.toLowerCase();
  const text = content.toLowerCase().substring(0, 1200);

  if (/architecture|interface|integration|system|automation|scada|control|network/.test(title)) return "architecture";
  if (/compliance|standard|deviation|inspection|itp|api|iso|certification|qa|qc/.test(title)) return "compliance_flow";
  if (/schedule|timeline|delivery|milestone|approval|submission|proposal/.test(title)) return "proposal_lifecycle";
  if (/dependency|drawing|datasheet|vendor data|calculation|engineering/.test(title)) return "engineering_dependency";
  if (/process|manufacturing|fabrication|construction|commissioning|pump|valve|piping|p&id|pfd/.test(title)) return "process_flow";
  if (/p&id|hydraulic|npsh|api 600|api 610|api 682|cause and effect|loop diagram/.test(text)) return "engineering_dependency";
  if (/inspection|hydrotest|ndt|material test certificate|deviation|waiver/.test(text)) return "compliance_flow";
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
  const encoded = typeof Buffer !== "undefined"
    ? Buffer.from(code).toString("base64url")
    : btoa(unescape(encodeURIComponent(code))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  const type = format === "svg" ? "svg" : "img";
  return `https://mermaid.ink/${type}/${encoded}?type=${format}&width=900&height=520&bgColor=white`;
}

export function getFallbackVisualization(context: VisualizationContext, type: VisualizationType): GeneratedVisualization {
  const title = context.sectionTitle || context.title || "Proposal Workflow";
  const safeTitle = sanitizeMermaidLabel(title);
  const diagramTitle = VISUALIZATION_TYPES.find((item) => item.id === type)?.exportLabel ?? "Workflow Diagram";

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

  const mermaidCode = sanitizeMermaidCode(templates[type] || templates.workflow);
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
  const type = normalizeVisualizationType(requestedType || getBestVisualizationType(context.sectionTitle || context.title, context.content));

  if (!process.env.ABACUSAI_API_KEY) {
    return getFallbackVisualization(context, type);
  }

  const systemPrompt = `You create export-safe Mermaid diagrams for EPC, valve, pump, and industrial automation proposals.

Rules:
- Output only raw Mermaid code.
- No markdown fences or explanations.
- Prefer graph TD or graph LR unless the requested type clearly needs sequenceDiagram or gantt.
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
