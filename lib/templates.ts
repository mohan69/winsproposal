export interface TemplateSection {
  title: string;
  description: string;
}

export interface ComplianceItem {
  id: string;
  label: string;
  standard: string;
}

export interface ProposalTemplate {
  id: string;
  name: string;
  industry: "Valves" | "Pumps" | "EPC";
  badge: string;
  description: string;
  sections: TemplateSection[];
  complianceItems: ComplianceItem[];
}

// ── Valve Sub-Types ──
export interface ValveSubType {
  id: string;
  name: string;
  description: string;
  additionalSections: TemplateSection[];
  additionalComplianceItems: ComplianceItem[];
  tbeTags: string[];
}

export const VALVE_SUBTYPES: ValveSubType[] = [
  {
    id: "gate",
    name: "Gate Valve (ON/OFF)",
    description: "Full-bore isolation valves for ON/OFF service. API 600/602/603, wedge or slab gate designs.",
    additionalSections: [
      { title: "Actuator Specifications & Torque Analysis", description: "Actuator type selection, torque calculations, handwheel/gearbox/pneumatic/electric actuator specifications, fail-safe positions" },
      { title: "Fugitive Emission Compliance", description: "ISO 15848-1/2 compliance, stem packing design, emission test results, environmental certifications" },
    ],
    additionalComplianceItems: [
      { id: "v-gate-1", label: "API 607 Fire-Safe", standard: "API 607 - Fire Test for Quarter-Turn/Gate Valves" },
      { id: "v-gate-2", label: "ISO 15848-1 Fugitive Emissions", standard: "ISO 15848-1 - Fugitive Emission Measurement/Test" },
      { id: "v-gate-3", label: "IEC 61508 SIL Rated", standard: "IEC 61508 / IEC 61511 - Safety Integrity Level" },
      { id: "v-gate-4", label: "API 624 Rising Stem", standard: "API 624 - Type Testing of Rising Stem Valves (Fugitive Emissions)" },
    ],
    tbeTags: ["Material", "Pressure Rating", "Size", "End Connection", "Body Type", "Bonnet Type", "Packing", "Testing", "Certification", "Actuator Type", "Torque Requirements", "Fire-Safe Certification", "Fugitive Emissions", "SIL Rating", "Cycle Life"],
  },
  {
    id: "globe",
    name: "Globe Valve (Throttling/ON-OFF)",
    description: "Throttling and ON/OFF service. Linear flow characteristic, plug/disc designs per BS 1873/API 623.",
    additionalSections: [
      { title: "Flow Characteristics & Cv Data", description: "Flow coefficient (Cv/Kv), inherent/installed flow characteristics, pressure drop calculations, trim selection" },
      { title: "Fugitive Emission Compliance", description: "ISO 15848-1/2 compliance, bellows seal options, emission test results" },
    ],
    additionalComplianceItems: [
      { id: "v-globe-1", label: "BS 1873 Compliance", standard: "BS 1873 - Steel Globe/Check Valves for Petroleum" },
      { id: "v-globe-2", label: "ISO 15848-1 Fugitive Emissions", standard: "ISO 15848-1 - Fugitive Emission Measurement/Test" },
      { id: "v-globe-3", label: "API 623 Compliance", standard: "API 623 - Steel Globe Valves" },
    ],
    tbeTags: ["Material", "Pressure Rating", "Size", "End Connection", "Body Type", "Bonnet Type", "Packing", "Testing", "Certification", "Cv/Kv Flow Data", "Trim Type", "Flow Characteristic", "Fugitive Emissions", "Bellows Seal"],
  },
  {
    id: "ball",
    name: "Ball Valve (ON/OFF)",
    description: "Quarter-turn ON/OFF isolation. Floating/trunnion mounted, API 6D/API 608, soft/metal seated.",
    additionalSections: [
      { title: "Actuator Specifications & Torque Analysis", description: "Quarter-turn actuator sizing, torque at breakaway/running/end, pneumatic/electric/hydraulic options, fail-safe action" },
      { title: "Fugitive Emission Compliance", description: "ISO 15848-1/2, API 641 compliance, stem seal and body seal design, emission class rating" },
    ],
    additionalComplianceItems: [
      { id: "v-ball-1", label: "API 6D Pipeline", standard: "API 6D - Pipeline and Piping Valves" },
      { id: "v-ball-2", label: "API 608 Ball Valves", standard: "API 608 - Metal Ball Valves" },
      { id: "v-ball-3", label: "API 607 Fire-Safe", standard: "API 607 - Fire Test for Quarter-Turn Valves" },
      { id: "v-ball-4", label: "API 641 Fugitive Emissions", standard: "API 641 - Type Testing of Quarter-Turn Valves (Fugitive Emissions)" },
      { id: "v-ball-5", label: "ISO 15848-1 Fugitive Emissions", standard: "ISO 15848-1 - Fugitive Emission Measurement/Test" },
    ],
    tbeTags: ["Material", "Pressure Rating", "Size", "End Connection", "Ball Type", "Seat Type", "Seal Material", "Testing", "Certification", "Actuator Type", "Torque Requirements", "Fire-Safe Certification", "Fugitive Emissions", "SIL Rating", "Cycle Life"],
  },
  {
    id: "butterfly",
    name: "Butterfly Valve (ON/OFF / Throttling)",
    description: "Compact quarter-turn for ON/OFF and moderate throttling. Double/triple offset designs per API 609.",
    additionalSections: [
      { title: "Actuator Specifications & Torque Analysis", description: "Quarter-turn actuator sizing for butterfly valves, dynamic torque profile, gearbox selection" },
      { title: "Seat & Disc Design", description: "Offset design (double/triple), seat material selection, bi-directional sealing, zero-leakage class" },
    ],
    additionalComplianceItems: [
      { id: "v-bfly-1", label: "API 609 Compliance", standard: "API 609 - Butterfly Valves" },
      { id: "v-bfly-2", label: "API 607 Fire-Safe", standard: "API 607 - Fire Test for Quarter-Turn Valves" },
      { id: "v-bfly-3", label: "ISO 15848-1 Fugitive Emissions", standard: "ISO 15848-1 - Fugitive Emission Measurement/Test" },
    ],
    tbeTags: ["Material", "Pressure Rating", "Size", "End Connection", "Offset Type", "Disc Material", "Seat Material", "Testing", "Certification", "Actuator Type", "Torque Requirements", "Fire-Safe Certification", "Fugitive Emissions", "Leakage Class"],
  },
  {
    id: "check",
    name: "Check Valve (Non-Return)",
    description: "Prevent backflow. Swing, piston, dual-plate designs per API 594/API 6D/BS 1868.",
    additionalSections: [
      { title: "Flow & Cracking Pressure Analysis", description: "Cracking pressure, full-open pressure, slam prevention design, water hammer mitigation" },
    ],
    additionalComplianceItems: [
      { id: "v-check-1", label: "API 594 Wafer Check", standard: "API 594 - Check Valves: Wafer, Wafer-Lug, Double Flanged" },
      { id: "v-check-2", label: "BS 1868 Swing Check", standard: "BS 1868 - Steel Check Valves" },
    ],
    tbeTags: ["Material", "Pressure Rating", "Size", "End Connection", "Check Type", "Disc/Clapper Material", "Spring Type", "Testing", "Certification", "Cracking Pressure", "Slam Prevention", "Non-Slam Design"],
  },
];

// ── Pump Sub-Types ──
export interface PumpSubType {
  id: string;
  name: string;
  description: string;
  additionalSections: TemplateSection[];
  additionalComplianceItems: ComplianceItem[];
  tbeTags: string[];
}

export const PUMP_SUBTYPES: PumpSubType[] = [
  {
    id: "centrifugal",
    name: "Centrifugal Pump",
    description: "Single/multi-stage centrifugal pumps per API 610. OH, BB, VS types for petroleum and process.",
    additionalSections: [
      { title: "Hydraulic Performance & Curves", description: "Head-capacity curves, efficiency, BEP, operating range, minimum flow protection" },
      { title: "Mechanical Seal & Seal Plan", description: "API 682 seal selection, seal plan (Plan 11/13/21/23/32/53/54), flush system design" },
    ],
    additionalComplianceItems: [
      { id: "p-cent-1", label: "API 682 Mechanical Seals", standard: "API 682 - Pumps Shaft Sealing Systems" },
      { id: "p-cent-2", label: "API 685 Sealless Pumps", standard: "API 685 - Sealless Centrifugal Pumps" },
      { id: "p-cent-3", label: "HI 9.6.1 Rotodynamic Pumps", standard: "HI 9.6.1 - Rotodynamic Pump Guideline" },
    ],
    tbeTags: ["Material", "Pump Type (OH/BB/VS)", "Capacity", "Head", "NPSH Available/Required", "Seal Plan", "Bearing Type", "Coupling Type", "Driver Type", "Performance Guarantee", "Testing", "Certification"],
  },
  {
    id: "positive_displacement",
    name: "Positive Displacement Pump",
    description: "Reciprocating and rotary PD pumps per API 674/675/676. Metering, screw, gear pump types.",
    additionalSections: [
      { title: "Displacement & Flow Characteristics", description: "Pulsation analysis, pulsation dampener sizing, flow accuracy and repeatability, turndown ratio" },
      { title: "Pressure Relief & Safety", description: "Integrated relief valve requirements, maximum allowable working pressure, deadhead protection" },
    ],
    additionalComplianceItems: [
      { id: "p-pd-1", label: "API 674 Reciprocating", standard: "API 674 - Positive Displacement Pumps Reciprocating" },
      { id: "p-pd-2", label: "API 675 Metering", standard: "API 675 - Positive Displacement Pumps Controlled Volume" },
      { id: "p-pd-3", label: "API 676 Rotary", standard: "API 676 - Positive Displacement Pumps Rotary" },
    ],
    tbeTags: ["Material", "Pump Type (Reciprocating/Rotary/Metering)", "Capacity", "Discharge Pressure", "Viscosity Range", "Pulsation Dampener", "Relief Valve", "Seal Type", "Driver Type", "Accuracy/Repeatability", "Testing", "Certification"],
  },
  {
    id: "submersible",
    name: "Submersible Pump",
    description: "Vertical submersible pumps for deep wells, drainage, sewage. Wet-well or dry-well installations.",
    additionalSections: [
      { title: "Installation & Submergence Requirements", description: "Minimum submergence, cable/column pipe specs, guide rail system, auto-coupling" },
      { title: "Motor Protection & VFD Compatibility", description: "Motor protection class (IP68), thermal sensors, VFD suitability, cable sizing" },
    ],
    additionalComplianceItems: [
      { id: "p-sub-1", label: "IEC 60034-5 Motor Protection", standard: "IEC 60034-5 - Degrees of Protection (IP Code)" },
      { id: "p-sub-2", label: "EN 12050 Waste Water", standard: "EN 12050 - Wastewater Lifting Plants" },
    ],
    tbeTags: ["Material", "Pump Type", "Capacity", "Head", "Motor Rating", "Voltage/Frequency", "Cable Type", "IP Rating", "Installation Depth", "Solids Handling", "Testing", "Certification"],
  },
];

// ── Go/No-Go Questions ──
export interface GoNoGoQuestion {
  id: string;
  question: string;
  weight: number;
  industries: string[]; // empty = all industries
}

export const GO_NO_GO_QUESTIONS: GoNoGoQuestion[] = [
  // Universal questions
  { id: "gng-1", question: "Do we have the certifications/approvals required by this RFP?", weight: 3, industries: [] },
  { id: "gng-2", question: "Have we supplied to this client or end-user before?", weight: 2, industries: [] },
  { id: "gng-3", question: "Is the delivery timeline realistic for our current lead times?", weight: 3, industries: [] },
  { id: "gng-4", question: "Does this RFP match our core product/service range?", weight: 3, industries: [] },
  { id: "gng-5", question: "Is the order/project value within our typical deal size?", weight: 2, industries: [] },
  { id: "gng-6", question: "Do we have manufacturing/project capacity to take this on?", weight: 2, industries: [] },
  { id: "gng-7", question: "Are the commercial terms and payment conditions acceptable?", weight: 2, industries: [] },
  { id: "gng-8", question: "Is the competitive landscape favorable (few or weak competitors)?", weight: 1, industries: [] },
  // Valve-specific
  { id: "gng-v1", question: "Do we manufacture the required valve type and size range?", weight: 3, industries: ["Valves"] },
  { id: "gng-v2", question: "Can we meet the metallurgy/material requirements (exotic alloys, sour service)?", weight: 3, industries: ["Valves"] },
  // Pump-specific
  { id: "gng-p1", question: "Do we offer pumps matching the required duty conditions (flow, head, fluid)?", weight: 3, industries: ["Pumps"] },
  { id: "gng-p2", question: "Can we provide the required performance guarantees and test certifications?", weight: 3, industries: ["Pumps"] },
  // EPC-specific
  { id: "gng-e1", question: "Do we have experience executing similar project types and scale?", weight: 3, industries: ["EPC"] },
  { id: "gng-e2", question: "Do we have the required local presence, licenses, and workforce?", weight: 2, industries: ["EPC"] },
];

export const GO_NO_GO_OPTIONS = [
  { label: "Yes", score: 5 },
  { label: "Partially", score: 3 },
  { label: "Uncertain", score: 1 },
  { label: "No", score: 0 },
] as const;

export function getGoNoGoQuestionsForIndustry(industry: string): GoNoGoQuestion[] {
  return GO_NO_GO_QUESTIONS.filter(
    (q) => q.industries.length === 0 || q.industries.includes(industry)
  );
}

export function calculateGoNoGoScore(
  responses: { questionId: string; score: number }[],
  industry: string
): { totalScore: number; maxScore: number; percentage: number; recommendation: string } {
  const questions = getGoNoGoQuestionsForIndustry(industry);
  let totalScore = 0;
  let maxScore = 0;

  for (const q of questions) {
    maxScore += 5 * q.weight;
    const resp = responses.find((r) => r.questionId === q.id);
    if (resp) totalScore += resp.score * q.weight;
  }

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  let recommendation = "no_bid";
  if (percentage >= 70) recommendation = "strong_bid";
  else if (percentage >= 40) recommendation = "cautious_bid";

  return { totalScore, maxScore, percentage, recommendation };
}

export function getValveSubTypeById(id: string): ValveSubType | undefined {
  return VALVE_SUBTYPES.find((v) => v.id === id);
}

export function getPumpSubTypeById(id: string): PumpSubType | undefined {
  return PUMP_SUBTYPES.find((p) => p.id === id);
}

export function getTbeTagsForTemplate(templateId: string, subTypeId?: string): string[] {
  const DEFAULT_TAGS = ["Material", "Pressure Rating", "Size", "End Connection", "Body Type", "Bonnet Type", "Packing", "Testing", "Certification"];
  const templateKey = templateId || "";
  const template = TEMPLATES.find((t) => t.id === templateKey || t.name === templateKey || templateKey.startsWith(`${t.name} —`));
  const normalizedTemplateId = template?.id ?? templateKey;
  const inferredSubType = subTypeId || templateKey.split("—")?.[1]?.trim() || "";
  
  if (normalizedTemplateId === "valve-oem" && inferredSubType) {
    const subType = getValveSubTypeById(inferredSubType) ?? VALVE_SUBTYPES.find((v) => v.name === inferredSubType);
    if (subType) return subType.tbeTags;
  }
  if (normalizedTemplateId === "pump-oem" && inferredSubType) {
    const subType = getPumpSubTypeById(inferredSubType) ?? PUMP_SUBTYPES.find((p) => p.name === inferredSubType);
    if (subType) return subType.tbeTags;
  }
  return DEFAULT_TAGS;
}

export function getFullTemplateWithSubType(templateId: string, subTypeId?: string): ProposalTemplate | undefined {
  const base = getTemplateById(templateId);
  if (!base) return undefined;
  if (!subTypeId) return base;

  if (templateId === "valve-oem") {
    const subType = getValveSubTypeById(subTypeId);
    if (subType) {
      return {
        ...base,
        name: `${base.name} — ${subType.name}`,
        sections: [...base.sections, ...subType.additionalSections],
        complianceItems: [...base.complianceItems, ...subType.additionalComplianceItems],
      };
    }
  }
  if (templateId === "pump-oem") {
    const subType = getPumpSubTypeById(subTypeId);
    if (subType) {
      return {
        ...base,
        name: `${base.name} — ${subType.name}`,
        sections: [...base.sections, ...subType.additionalSections],
        complianceItems: [...base.complianceItems, ...subType.additionalComplianceItems],
      };
    }
  }
  return base;
}

export const TEMPLATES: ProposalTemplate[] = [
  {
    id: "valve-oem",
    name: "Valve OEM Template",
    industry: "Valves",
    badge: "Valves",
    description: "Comprehensive template for valve manufacturers responding to RFPs. Covers API 600/602/603 compliance, material traceability, and quality assurance.",
    sections: [
      { title: "Executive Summary", description: "High-level overview of the proposal, value proposition, and key differentiators" },
      { title: "Company Profile & Manufacturing Capabilities", description: "Manufacturing facilities, capacity, certifications, and industry experience" },
      { title: "Product Specifications & Compliance", description: "API 600/602/603, ASME, PED compliance details and product technical specifications" },
      { title: "Quality Assurance & Testing", description: "NDT, Hydrostatic testing, PMI, and quality control procedures" },
      { title: "Material Traceability & Certification", description: "Material sourcing, mill certificates, heat traceability, and documentation" },
      { title: "Delivery Schedule & Logistics", description: "Production timeline, shipping logistics, and delivery commitments" },
      { title: "Commercial Terms & Pricing", description: "Pricing structure, payment terms, and commercial conditions" },
      { title: "After-Sales Support & Warranty", description: "Warranty terms, spare parts availability, and technical support" },
    ],
    complianceItems: [
      { id: "v1", label: "API 600 Compliance", standard: "API 600 - Steel Gate Valves" },
      { id: "v2", label: "API 602 Compliance", standard: "API 602 - Compact Steel Gate Valves" },
      { id: "v3", label: "API 603 Compliance", standard: "API 603 - Corrosion-Resistant Gate Valves" },
      { id: "v4", label: "ASME B16.34", standard: "ASME B16.34 - Valves Flanged, Threaded, and Welding End" },
      { id: "v5", label: "PED 2014/68/EU", standard: "Pressure Equipment Directive" },
      { id: "v6", label: "NACE MR0175", standard: "NACE MR0175/ISO 15156 - Sour Service" },
    ],
  },
  {
    id: "pump-oem",
    name: "Pump OEM Template",
    industry: "Pumps",
    badge: "Pumps",
    description: "Specialized template for pump manufacturers. Addresses API 610, ISO 5199, performance data, and lifecycle support requirements.",
    sections: [
      { title: "Executive Summary", description: "Proposal overview with key technical and commercial highlights" },
      { title: "Company Profile & Engineering Capabilities", description: "Engineering expertise, R&D facilities, and manufacturing capabilities" },
      { title: "Pump Specifications & Performance Data", description: "API 610, ISO 5199 compliance, performance curves, and NPSH data" },
      { title: "Material Selection & Compatibility", description: "Material specifications, corrosion resistance, and fluid compatibility" },
      { title: "Quality Control & Testing Procedures", description: "Quality management system, testing protocols, and inspection plans" },
      { title: "Installation, Commissioning & Training", description: "Installation support, commissioning procedures, and operator training" },
      { title: "Commercial Offer & Delivery", description: "Pricing, delivery schedule, and commercial terms" },
      { title: "Warranty & Lifecycle Support", description: "Warranty coverage, maintenance programs, and spare parts management" },
    ],
    complianceItems: [
      { id: "p1", label: "API 610 Compliance", standard: "API 610 - Centrifugal Pumps for Petroleum" },
      { id: "p2", label: "ISO 5199 Compliance", standard: "ISO 5199 - Technical Specifications for Centrifugal Pumps" },
      { id: "p3", label: "ATEX Certification", standard: "ATEX Directive 2014/34/EU - Explosive Atmospheres" },
      { id: "p4", label: "Vibration Standards", standard: "ISO 10816 / API 610 Vibration Limits" },
    ],
  },
  {
    id: "epc",
    name: "EPC Template",
    industry: "EPC",
    badge: "EPC",
    description: "Full-scope template for EPC contractors. Covers engineering methodology, procurement strategy, construction execution, and HSE planning.",
    sections: [
      { title: "Executive Summary", description: "Project overview, understanding of scope, and key value propositions" },
      { title: "Project Understanding & Scope", description: "Detailed scope comprehension, assumptions, and exclusions" },
      { title: "Engineering Approach & Methodology", description: "Engineering philosophy, design standards, and technical approach" },
      { title: "Procurement Strategy & Vendor Management", description: "Procurement plan, vendor qualification, and supply chain management" },
      { title: "Construction Execution Plan", description: "Construction methodology, equipment mobilization, and resource planning" },
      { title: "HSE Plan", description: "Health, Safety, and Environment policies, procedures, and targets" },
      { title: "Quality Management System", description: "QMS framework, ITP, and quality assurance procedures" },
      { title: "Project Schedule & Milestones", description: "Master schedule, critical path, and key milestone dates" },
      { title: "Commercial Proposal & Payment Terms", description: "Cost breakdown, payment schedule, and commercial conditions" },
      { title: "Team Qualifications & Past Project References", description: "Key personnel CVs, past project experience, and client references" },
    ],
    complianceItems: [
      { id: "e1", label: "ISO 9001 Compliance", standard: "ISO 9001 - Quality Management System" },
      { id: "e2", label: "ISO 14001 Compliance", standard: "ISO 14001 - Environmental Management System" },
      { id: "e3", label: "ISO 45001 Compliance", standard: "ISO 45001 - Occupational Health & Safety" },
      { id: "e4", label: "OHSAS Standards", standard: "OHSAS 18001 / ISO 45001 - OH&S Management" },
      { id: "e5", label: "Local Regulatory Compliance", standard: "Local regulatory and statutory compliance requirements" },
    ],
  },
  {
    id: "epc-workflow",
    name: "EPC Proposal Workflow Template",
    industry: "EPC",
    badge: "EPC Workflow",
    description: "Demo template for integrated EPC proposal workflows covering RFP intake, engineering review, procurement, construction planning, compliance, and approval gates.",
    sections: [
      { title: "Bid Strategy & Proposal Governance", description: "Bid/no-bid rationale, proposal ownership, review cadence, and approval responsibilities" },
      { title: "Engineering Deliverable Workflow", description: "P&ID review, datasheets, calculations, design basis, and interdisciplinary review dependencies" },
      { title: "Procurement & Vendor Data Workflow", description: "MR issuance, vendor qualification, TBE, deviation tracking, and vendor document review" },
      { title: "Construction & Commissioning Workflow", description: "Construction sequence, pre-commissioning, commissioning, handover, and punch closure" },
      { title: "Compliance & Deviation Register", description: "Mandatory standards, client exceptions, deviations, approvals, and closure evidence" },
      { title: "Proposal Lifecycle & Submission Plan", description: "Internal milestones from RFP receipt through final PDF/DOCX submission" },
    ],
    complianceItems: [
      { id: "ew1", label: "Stage-Gate Approval", standard: "Internal EPC bid governance" },
      { id: "ew2", label: "Discipline Review Complete", standard: "Engineering interdisciplinary review" },
      { id: "ew3", label: "Deviation Register Closed", standard: "Client specification compliance" },
      { id: "ew4", label: "TBE Evidence Attached", standard: "Technical bid evaluation package" },
    ],
  },
  {
    id: "refinery-systems",
    name: "Refinery Systems Template",
    industry: "EPC",
    badge: "Refinery",
    description: "Professional demo template for refinery utilities, process packages, piping systems, valves, pumps, instrumentation, and compliance-heavy proposal responses.",
    sections: [
      { title: "Refinery Scope Understanding", description: "Battery limits, process units, utility interfaces, brownfield constraints, and tie-in assumptions" },
      { title: "Process & Piping Architecture", description: "PFD/P&ID basis, line classes, valve philosophy, pump duties, and equipment interfaces" },
      { title: "API Compliance Matrix", description: "API 600, API 610, API 682, ASME, NACE, hydrotest, NDT, and documentation evidence" },
      { title: "Shutdown, Tie-In & Commissioning Plan", description: "Shutdown window, isolation plan, commissioning sequence, and operational handover" },
      { title: "Risk, HSE & Permit Management", description: "HAZOP inputs, permit-to-work, SIMOPS, and refinery safety controls" },
    ],
    complianceItems: [
      { id: "rs1", label: "API 600 Valve Compliance", standard: "API 600 / ASME B16.34" },
      { id: "rs2", label: "API 610 Pump Compliance", standard: "API 610 centrifugal pumps" },
      { id: "rs3", label: "NACE Sour Service", standard: "NACE MR0175 / ISO 15156" },
      { id: "rs4", label: "Refinery HSE Controls", standard: "Permit-to-work and SIMOPS requirements" },
    ],
  },
  {
    id: "pump-infrastructure",
    name: "Pump Infrastructure Template",
    industry: "Pumps",
    badge: "Pump Infra",
    description: "Demo template for pump station and infrastructure proposals covering hydraulics, NPSH, seal plans, motors, VFDs, testing, and lifecycle support.",
    sections: [
      { title: "Pump Station Design Basis", description: "Flow, head, duty/standby philosophy, fluid data, and operating envelope" },
      { title: "Hydraulic Performance & NPSH Analysis", description: "Pump curves, BEP, NPSHA/NPSHR, minimum flow, and performance guarantees" },
      { title: "Mechanical Seal, Driver & VFD Package", description: "API 682 seal plan, motor selection, coupling, baseplate, and VFD compatibility" },
      { title: "Testing, Inspection & Documentation", description: "Performance test, vibration limits, hydrotest, material records, and final data book" },
      { title: "Installation & Lifecycle Support", description: "Site installation, commissioning, spares, maintenance intervals, and service support" },
    ],
    complianceItems: [
      { id: "pi1", label: "API 610 Performance", standard: "API 610 / ISO 13709" },
      { id: "pi2", label: "API 682 Seal Plan", standard: "API 682 pump sealing systems" },
      { id: "pi3", label: "Vibration Acceptance", standard: "API 610 / ISO 10816" },
      { id: "pi4", label: "Hydraulic Test Evidence", standard: "HI 14.6 / client test procedure" },
    ],
  },
  {
    id: "industrial-automation",
    name: "Industrial Automation Systems Template",
    industry: "EPC",
    badge: "Automation",
    description: "Demo template for control system, SCADA, PLC, instrumentation, cause-and-effect, loop diagram, and FAT/SAT proposal workflows.",
    sections: [
      { title: "Control System Architecture", description: "PLC/SCADA architecture, panels, network topology, redundancy, and cybersecurity boundary" },
      { title: "Instrumentation & Loop Deliverables", description: "Instrument index, I/O list, loop diagrams, cable schedule, and calibration philosophy" },
      { title: "Cause & Effect / Logic Workflow", description: "Control narratives, interlocks, permissives, trip matrix, and validation procedure" },
      { title: "FAT, SAT & Commissioning Plan", description: "Factory acceptance, site acceptance, commissioning, punch closure, and training" },
      { title: "Compliance & Documentation Package", description: "IEC, ISA, client standards, as-built records, backup, and O&M deliverables" },
    ],
    complianceItems: [
      { id: "ia1", label: "IEC 61131 PLC Compliance", standard: "IEC 61131 programmable controllers" },
      { id: "ia2", label: "ISA Instrumentation", standard: "ISA 5.1 / ISA 5.4" },
      { id: "ia3", label: "FAT/SAT Protocol", standard: "Client FAT/SAT acceptance criteria" },
      { id: "ia4", label: "Cybersecurity Boundary", standard: "IEC 62443 aligned controls" },
    ],
  },
];

export function getTemplateById(id: string): ProposalTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function getTemplateByIndustry(industry: string): ProposalTemplate | undefined {
  return TEMPLATES.find((t) => t.industry === industry);
}

export function getComplianceItemsForTemplate(templateId: string): ComplianceItem[] {
  const template = getTemplateById(templateId);
  return template?.complianceItems ?? [];
}
