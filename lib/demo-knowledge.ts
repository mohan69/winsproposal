import type { Industry } from "@prisma/client";

export interface DemoKnowledgeAsset {
  title: string;
  industry: Industry;
  category: string;
  tags: string[];
  content: string;
}

export const DEMO_KNOWLEDGE_ASSETS: DemoKnowledgeAsset[] = [
  {
    title: "Historical Proposal Response - API 600 Gate Valves",
    industry: "Valves",
    category: "Historical Proposal Response",
    tags: ["historical-response", "api-600", "gate-valve", "refinery"],
    content: "We confirm compliance with API 600 latest edition for cast steel gate valves in refinery isolation service. The offered valves include bolted bonnet construction, renewable seat rings, full material traceability, hydrostatic shell and seat testing per API 598, PMI on pressure-retaining components, and final documentation including MTCs, ITP, dimensional records, and test certificates.",
  },
  {
    title: "Technical Clause - API 600 Valve Inspection and Testing",
    industry: "Valves",
    category: "Technical Clause",
    tags: ["technical-clause", "api-600", "inspection", "testing"],
    content: "All API 600 valves shall be inspected against approved drawings, datasheets, and ITP hold points. Mandatory tests include shell hydrotest, high-pressure closure test, low-pressure seat test where applicable, backseat test, visual inspection, marking verification, coating inspection, and final preservation check.",
  },
  {
    title: "Valve Specification - Refinery Isolation Service",
    industry: "Valves",
    category: "Technical Specification",
    tags: ["specification", "valve", "refinery", "nace"],
    content: "Body and bonnet materials shall match the line class and fluid service. Sour service applications shall comply with NACE MR0175 / ISO 15156. Trim selection shall consider corrosion, erosion, temperature, pressure class, and shut-off requirement.",
  },
  {
    title: "Pump Technical Specification - API 610 Centrifugal Pump",
    industry: "Pumps",
    category: "Technical Specification",
    tags: ["specification", "api-610", "centrifugal-pump", "npsh"],
    content: "The pump package shall be designed in accordance with API 610 / ISO 13709. The proposal shall include rated flow, rated head, efficiency, NPSHR, NPSHA margin statement, minimum continuous stable flow, driver rating, API 682 seal plan, and performance guarantee conditions.",
  },
  {
    title: "Compliance Template - Industrial Proposal Review",
    industry: "EPC",
    category: "Compliance Template",
    tags: ["compliance-template", "proposal-review", "deviation-register"],
    content: "Compliance review shall map every mandatory RFP clause to compliant, partially compliant, deviation requested, or not applicable. Each deviation shall include clause reference, reason, technical impact, commercial impact, mitigation, and approval status.",
  },
  {
    title: "Deviation Example - Pump Seal Plan Alternative",
    industry: "Pumps",
    category: "Deviation Example",
    tags: ["deviation", "api-682", "seal-plan", "pump"],
    content: "Client requested API 682 Plan 53B for all hazardous service pumps. We propose Plan 53A for non-critical clean hydrocarbon service where operating pressure and temperature remain within acceptable limits, supported by seal vendor recommendation and lifecycle maintenance comparison.",
  },
  {
    title: "Engineering Workflow Template - EPC Proposal Package",
    industry: "EPC",
    category: "Engineering Workflow",
    tags: ["engineering-workflow", "epc", "proposal-lifecycle", "dependencies"],
    content: "The EPC proposal workflow begins with RFP intake and bid/no-bid review, followed by engineering basis development, discipline inputs, vendor budgetary offers, construction methodology, HSE review, QA/QC review, commercial consolidation, management approval, and final submission.",
  },
  {
    title: "Industrial Automation Workflow - FAT and SAT",
    industry: "EPC",
    category: "Engineering Workflow",
    tags: ["automation", "fat", "sat", "scada", "plc"],
    content: "Automation proposals shall include control system architecture, PLC/SCADA scope, I/O count assumptions, panel design basis, network topology, cybersecurity boundary, cause-and-effect validation, FAT procedure, SAT procedure, commissioning support, backup strategy, and operator training plan.",
  },
];
