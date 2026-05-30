import { PrismaClient, Industry, ProposalStatus, UserRole, CompanySize, ApprovalStatus, SourceType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "Demo@12345";

type DemoUser = {
  id: string;
  name: string;
  email: string;
  title: string;
  role: UserRole;
  permissions: string[];
  dashboards: string[];
};

type DemoOrg = {
  id: string;
  name: string;
  brandColor: string;
  industry: Industry;
  users: DemoUser[];
};

type DemoRfp = {
  id: string;
  filename: string;
  ownerId: string;
  industry: Industry;
  extractedData: any;
};

type DemoProposal = {
  id: string;
  userId: string;
  rfpId: string;
  title: string;
  industry: Industry;
  templateType: string;
  winScore: number;
  companySize: CompanySize;
  approvalStatus: ApprovalStatus;
  sections: Array<{ id: string; title: string; content: string; sourceType: SourceType }>;
  checklistItems: Array<{ id: string; label: string; standard: string; checked: boolean }>;
  tbeResponses: Array<{ lineItemIndex: number; tag: string; responseText: string }>;
};

const roleBlueprints = [
  {
    title: "VP Business Development",
    role: UserRole.admin,
    permissions: ["organization_admin", "pipeline_dashboard", "approval_release", "commercial_visibility"],
    dashboards: ["Executive bid value", "Proposal throughput", "Win score trend", "Management approvals"],
  },
  {
    title: "Proposal Manager",
    role: UserRole.bid_manager,
    permissions: ["create_rfp", "generate_proposal", "manage_workflow", "submit_for_approval"],
    dashboards: ["Proposal queue", "Compliance completion", "Turnaround SLA", "Owner workload"],
  },
  {
    title: "Proposal Engineer",
    role: UserRole.team_member,
    permissions: ["technical_sections", "tbe_response", "vault_reuse", "diagram_generation"],
    dashboards: ["Engineering actions", "TBE completion", "Vault matches", "Open clarifications"],
  },
  {
    title: "Compliance Coordinator",
    role: UserRole.reviewer,
    permissions: ["compliance_review", "deviation_register", "document_check", "final_review"],
    dashboards: ["Compliance matrix", "Deviation status", "Mandatory clauses", "Export readiness"],
  },
];

const demoOrgs: DemoOrg[] = [
  {
    id: "demo-org-flowserve-industrial-valves",
    name: "FlowServe Industrial Valves Pvt Ltd",
    brandColor: "#2563eb",
    industry: Industry.Valves,
    users: makeUsers("flowserve", ["Aarav Mehta", "Nisha Kapoor", "Rohan Iyer", "Priya Nair"]),
  },
  {
    id: "demo-org-aquadyn-pumps",
    name: "AquaDyn Pumps India Ltd",
    brandColor: "#0891b2",
    industry: Industry.Pumps,
    users: makeUsers("aquadyn", ["Vikram Rao", "Meera Subramanian", "Karthik Menon", "Ananya Kulkarni"]),
  },
  {
    id: "demo-org-zenith-epc",
    name: "Zenith EPC Solutions",
    brandColor: "#b45309",
    industry: Industry.EPC,
    users: makeUsers("zenith", ["Siddharth Shah", "Farah Khan", "Dev Malhotra", "Isha Banerjee"]),
  },
  {
    id: "demo-org-vectorloop-automation",
    name: "VectorLoop Industrial Automation Pvt Ltd",
    brandColor: "#4f46e5",
    industry: Industry.General,
    users: makeUsers("vectorloop", ["Neel Desai", "Ritika Saran", "Arjun Bedi", "Maya George"]),
  },
];

function makeUsers(orgSlug: string, names: string[]): DemoUser[] {
  return roleBlueprints.map((blueprint, index) => ({
    id: `demo-user-${orgSlug}-${blueprint.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
    name: names[index],
    email: `demo.${orgSlug}.${blueprint.title.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@winsproposal.local`,
    title: blueprint.title,
    role: blueprint.role,
    permissions: blueprint.permissions,
    dashboards: blueprint.dashboards,
  }));
}

const rfps: DemoRfp[] = [
  {
    id: "demo-rfp-api-600-refinery-valve-package",
    filename: "DEMO_RFP_API_600_Refinery_Valve_Package.pdf",
    ownerId: "demo-user-flowserve-proposal-manager",
    industry: Industry.Valves,
    extractedData: {
      title: "API 600 Refinery Valve Package",
      customer: "Bharat Refining Complex",
      industry: "Valves",
      bidDueDate: "2026-06-18",
      estimatedBidValue: "INR 18.4 Cr",
      summary: "Supply of cast steel gate, globe, and check valves for crude and vacuum unit refinery revamp with full QA documentation, inspection hold points, and refinery preservation requirements.",
      requirements: [
        { id: "V-REQ-01", description: "API 600 cast steel gate valves, ASME B16.34 pressure-temperature rating, flanged RF/RTJ ends as per line class." },
        { id: "V-REQ-02", description: "Materials to ASTM A216 WCB / A217 WC6 with SS 13Cr or STL trim, NACE MR0175 where sour-service tags are identified." },
        { id: "V-REQ-03", description: "Hydrostatic shell, seat, backseat, visual, dimensional, and PMI testing per API 598 and approved ITP." },
        { id: "V-REQ-04", description: "Complete data book with MTCs, ITP, QAP, GA drawings, pressure test certificates, coating records, and deviation register." },
      ],
      complianceRequirements: ["API 600", "API 598", "ASME B16.34", "ASME B16.5", "NACE MR0175 / ISO 15156", "ISO 9001", "Client inspection hold points"],
      evaluationCriteria: ["Technical compliance 45%", "Delivery 20%", "Commercial value 25%", "Documentation quality 10%"],
      lineItems: [
        { item: "150# WCB Gate Valve", description: "NPS 8 API 600 bolted bonnet gate valve, RF flanged ends, refinery isolation service", quantity: 36, tag: "MOV-GV-150-08" },
        { item: "300# WC6 Gate Valve", description: "NPS 6 API 600 high-temperature gate valve, RTJ ends, steam service", quantity: 18, tag: "GV-STM-300-06" },
        { item: "600# WCB Check Valve", description: "NPS 4 swing check valve with renewable seat rings and bolted cover", quantity: 24, tag: "CV-HCU-600-04" },
      ],
    },
  },
  {
    id: "demo-rfp-municipal-water-pumping-infrastructure",
    filename: "DEMO_RFP_Municipal_Water_Pumping_Infrastructure.pdf",
    ownerId: "demo-user-aquadyn-proposal-manager",
    industry: Industry.Pumps,
    extractedData: {
      title: "Municipal Water Pumping Infrastructure",
      customer: "Narmada Urban Water Authority",
      industry: "Pumps",
      bidDueDate: "2026-06-24",
      estimatedBidValue: "INR 11.8 Cr",
      summary: "Design, supply, testing, and commissioning support for raw water intake and clear-water transfer pump packages for municipal distribution upgrade.",
      requirements: [
        { id: "P-REQ-01", description: "Horizontal split-case and vertical turbine pumps with minimum 78% rated efficiency and NPSH margin greater than 1.2 m." },
        { id: "P-REQ-02", description: "Motors IE3 or better, VFD compatible, IP55, Class F insulation with B temperature rise." },
        { id: "P-REQ-03", description: "Factory performance test, vibration measurement, noise test, coating DFT records, and site commissioning support." },
        { id: "P-REQ-04", description: "Provide hydraulic curves, GA drawings, foundation loads, spares list, O&M manuals, and energy-consumption estimate." },
      ],
      complianceRequirements: ["IS 1520", "ISO 9906 Grade 2B", "Hydraulic Institute guidance", "IEC motor standards", "Municipal QA plan", "Performance guarantee"],
      evaluationCriteria: ["Life-cycle cost 30%", "Hydraulic efficiency 25%", "Delivery 15%", "Service support 15%", "Commercial terms 15%"],
      lineItems: [
        { item: "Raw Water VT Pump", description: "1,250 m3/hr at 46 m head vertical turbine pump with above-ground discharge head", quantity: 4, tag: "RWP-VT-1250" },
        { item: "Clear Water Split Case Pump", description: "900 m3/hr at 72 m head horizontal split-case transfer pump with IE3 motor", quantity: 6, tag: "CWP-HSC-900" },
        { item: "Jockey Pump", description: "120 m3/hr pressure-maintenance pump with VFD panel and instruments", quantity: 2, tag: "JP-VFD-120" },
      ],
    },
  },
  {
    id: "demo-rfp-petrochemical-epc-process-package",
    filename: "DEMO_RFP_Petrochemical_EPC_Process_Package.pdf",
    ownerId: "demo-user-zenith-proposal-manager",
    industry: Industry.EPC,
    extractedData: {
      title: "Petrochemical EPC Process Package",
      customer: "Eastern Petrochemicals Ltd",
      industry: "EPC",
      bidDueDate: "2026-07-02",
      estimatedBidValue: "INR 126 Cr",
      summary: "EPC proposal for process package including detailed engineering, procurement support, modular skid fabrication, erection, pre-commissioning, and commissioning assistance.",
      requirements: [
        { id: "EPC-REQ-01", description: "Process design package from FEED validation through IFC release including PFDs, P&IDs, HMB, line list, equipment datasheets, and HAZOP closeout." },
        { id: "EPC-REQ-02", description: "Multi-discipline engineering covering process, piping, mechanical, electrical, instrumentation, civil, structural, HSE, and QA/QC." },
        { id: "EPC-REQ-03", description: "Procurement support for long-lead equipment, vendor TBE, vendor document review, expediting, and inspection coordination." },
        { id: "EPC-REQ-04", description: "Construction methodology, modularization plan, interface matrix, pre-commissioning check sheets, and handover dossier." },
      ],
      complianceRequirements: ["ASME", "API", "IEC", "NFPA", "OISD", "ISO 9001", "ISO 14001", "ISO 45001", "Client document control procedure"],
      evaluationCriteria: ["Technical methodology 35%", "Project controls 20%", "Schedule certainty 20%", "HSE and QA maturity 15%", "Commercial value 10%"],
      lineItems: [
        { item: "Process Engineering Package", description: "PFD, P&ID, HMB, line list, process datasheets, control narratives, HAZOP action closure", quantity: 1, tag: "PEP-LSTK-01" },
        { item: "Procurement and Vendor TBE", description: "RFQ packages, technical bid evaluations, vendor document review, inspection coordination", quantity: 1, tag: "PROC-TBE-01" },
        { item: "Modular Skid Fabrication", description: "Fabrication, NDT, hydrotest, painting, FAT, packing, and delivery for process skids", quantity: 5, tag: "MOD-SKID-05" },
      ],
    },
  },
  {
    id: "demo-rfp-industrial-automation-control-system-upgrade",
    filename: "DEMO_RFP_Industrial_Automation_Control_System_Upgrade.pdf",
    ownerId: "demo-user-vectorloop-proposal-manager",
    industry: Industry.General,
    extractedData: {
      title: "Industrial Automation Control System Upgrade",
      customer: "Western Chemicals Manufacturing Complex",
      industry: "Industrial Automation",
      bidDueDate: "2026-07-09",
      estimatedBidValue: "INR 9.6 Cr",
      summary: "Automation upgrade package covering PLC/SCADA migration, control panels, instrumentation interfaces, FAT/SAT, cybersecurity review, documentation, training, and phased cutover support.",
      requirements: [
        { id: "IA-REQ-01", description: "PLC and SCADA migration for existing process units with minimal downtime and validated tag database conversion." },
        { id: "IA-REQ-02", description: "Control panels, marshalling cabinets, network switches, power supplies, and operator workstation scope to be listed with exclusions." },
        { id: "IA-REQ-03", description: "FAT, SAT, loop check support, backup/restore procedure, cybersecurity hardening checklist, and training deliverables required." },
        { id: "IA-REQ-04", description: "Commercial offer shall identify delivery assumptions, software license exclusions, warranty basis, and optional AMC support." },
      ],
      complianceRequirements: ["IEC 61131 awareness", "ISA-95 awareness", "IEC 62443 awareness", "Client FAT/SAT procedure", "Project documentation matrix"],
      evaluationCriteria: ["Technical methodology 35%", "Migration risk 25%", "Delivery and site support 20%", "Commercial value 20%"],
      lineItems: [
        { item: "PLC Migration Package", description: "Controller hardware, I/O migration, logic conversion, and engineering workstation configuration", quantity: 1, tag: "PLC-MIG-01" },
        { item: "SCADA Upgrade", description: "HMI graphics, historian interface, alarm rationalization support, and operator workstation setup", quantity: 1, tag: "SCADA-UPG-01" },
        { item: "FAT/SAT and Training", description: "Factory acceptance test, site acceptance support, loop check assistance, and operator training", quantity: 1, tag: "FAT-SAT-TRN" },
      ],
    },
  },
];

const knowledgeAssets = [
  ["Reusable Clause - Executive Summary for Industrial Bids", Industry.General, ["proposal-clause", "executive-summary"], "WinsProposal enables disciplined proposal execution by combining RFP parsing, reusable technical content, compliance verification, TBE response drafting, approval workflows, and export-ready proposal packs. The result is faster turnaround with a stronger audit trail and fewer missed mandatory clauses."],
  ["Engineering Response - API 600 Valve Construction", Industry.Valves, ["engineering-response", "api-600", "valves"], "We confirm compliance with API 600 for cast steel gate valves. Offered construction includes bolted bonnet, outside screw and yoke, renewable seat rings, full bore design, pressure-retaining material traceability, and testing as per API 598 with client witness points incorporated into the ITP."],
  ["Compliance Template - Refinery Valve Package", Industry.Valves, ["compliance-template", "refinery", "nace"], "Each valve tag shall be mapped against API 600, API 598, ASME B16.34, ASME B16.5, material class, trim, end connection, NACE applicability, inspection level, documentation deliverables, and deviation status before final technical submission."],
  ["Deviation Example - Valve Trim Alternative", Industry.Valves, ["deviation", "trim", "stellite"], "Where client datasheet requests full Stellite hard-facing for clean non-erosive service, we propose 13Cr trim with Stellite seat faces only. The deviation reduces lead time while maintaining shut-off performance. Final acceptance remains subject to client process-service review."],
  ["Technical Specification - Municipal Pump Package", Industry.Pumps, ["technical-specification", "pumps", "municipal"], "Pump selection shall meet rated flow and head at the duty point with stable operation across the specified range. Proposal shall include curve, NPSHR, efficiency, motor rating, VFD compatibility, material schedule, seal plan, testing standard, coating system, and guaranteed performance tolerances."],
  ["Engineering Response - Pump Performance Testing", Industry.Pumps, ["engineering-response", "iso-9906", "testing"], "Factory performance testing will be conducted in accordance with ISO 9906 Grade 2B unless otherwise specified. Test records shall include flow, head, power, efficiency, vibration, noise, seal leakage observations, and acceptance comparison against guaranteed duty values."],
  ["Compliance Template - Pump Energy Efficiency", Industry.Pumps, ["compliance-template", "energy", "lcc"], "Life-cycle cost evaluation shall include pump efficiency, motor efficiency, duty hours, expected operating band, maintenance interval, recommended spares, guarantee tolerance, and after-sales service response commitments."],
  ["Technical Specification - EPC Process Package", Industry.EPC, ["technical-specification", "epc", "process"], "The EPC process package shall define design basis, HMB, PFDs, P&IDs, equipment list, line list, instrument index, control philosophy, battery limits, interface register, deliverable matrix, review cycles, HAZOP actions, and IFC release criteria."],
  ["Engineering Response - Vendor Technical Bid Evaluation", Industry.EPC, ["engineering-response", "tbe", "procurement"], "Vendor TBE will compare bidder compliance by clause, datasheet value, inspection requirement, deviation, delivery, critical spares, documentation, and lifecycle risk. Recommendations will distinguish technically acceptable bids from bids requiring clarification or commercial loading."],
  ["Compliance Template - EPC Deviation Register", Industry.EPC, ["compliance-template", "deviation-register"], "Every deviation shall capture RFP clause, discipline owner, proposed exception, technical impact, schedule impact, commercial impact, mitigation, client clarification status, and final approval decision before management release."],
  ["Technical Specification - Automation Migration", Industry.General, ["technical-specification", "automation", "plc", "scada"], "Automation migration proposals shall map PLC/SCADA scope, I/O count assumptions, graphics conversion, network architecture, cabinet scope, cutover constraints, FAT/SAT requirements, cybersecurity checklist, training, and support exclusions."],
  ["Engineering Response - FAT and SAT Automation", Industry.General, ["engineering-response", "automation", "fat", "sat"], "FAT/SAT response shall include test protocol, simulation basis, tag database verification, alarm and interlock test coverage, backup/restore evidence, client witness points, issue log, and final acceptance records."],
  ["Compliance Template - Automation Cybersecurity Review", Industry.General, ["compliance-template", "automation", "cybersecurity"], "Automation cybersecurity review shall capture user roles, network zoning, backup policy, patching assumptions, remote access restrictions, hardening checklist, license exclusions, and client IT approvals required before site deployment."],
  ["Dashboard Snapshot - Pilot KPI Baseline", Industry.General, ["dashboard", "kpi", "pilot"], "Pilot baseline: 8 proposals/month, 4.6 day average turnaround, 63% compliance completion before final review, 72 engineering hours per major bid, INR 42 Cr visible bid pipeline."],
  ["Dashboard Snapshot - Pilot KPI Target", Industry.General, ["dashboard", "kpi", "pilot"], "Pilot target: 22 proposals/month, 1.8 day average turnaround, 94% compliance completion before final review, 38 engineering hours per major bid, INR 156 Cr visible bid pipeline."],
] as const;

const proposals: DemoProposal[] = [
  {
    id: "demo-proposal-api-600-refinery-valve-package",
    userId: "demo-user-flowserve-proposal-manager",
    rfpId: "demo-rfp-api-600-refinery-valve-package",
    title: "Completed Proposal - API 600 Refinery Valve Package",
    industry: Industry.Valves,
    templateType: "Valves",
    winScore: 91,
    companySize: CompanySize.enterprise,
    approvalStatus: ApprovalStatus.approved,
    sections: [
      { id: "demo-sec-valve-exec", title: "Executive Summary", sourceType: SourceType.vault, content: "FlowServe Industrial Valves Pvt Ltd proposes a compliant API 600 valve package for the crude and vacuum unit revamp. The offer covers 78 valves across 150#, 300#, and 600# classes with controlled QA, client witness points, and export-ready documentation." },
      { id: "demo-sec-valve-technical", title: "Technical Compliance and Engineering Basis", sourceType: SourceType.vault, content: "Offered valves comply with API 600, API 598, ASME B16.34, and ASME B16.5. Sour-service tags will follow NACE MR0175 / ISO 15156. Materials, trims, pressure class, end connections, gasket face, painting, and preservation are mapped tag-wise in the compliance matrix." },
      { id: "demo-sec-valve-compliance", title: "Compliance Matrix Summary", sourceType: SourceType.generated, content: "Mandatory clauses reviewed: 42. Fully compliant: 39. Compliant with clarification: 2. Deviation requested: 1. Open commercial assumptions: 0. All inspection and documentation hold points have assigned owners." },
      { id: "demo-sec-valve-dashboard", title: "Executive Dashboard Snapshot", sourceType: SourceType.generated, content: "Bid value visibility: INR 18.4 Cr. Proposal turnaround: 1.6 days versus 4.5 day baseline. Compliance completion: 93%. Vault reuse: 68%. Engineering effort avoided: 31 hours. Approval status: released." },
      { id: "demo-sec-valve-workflow", title: "Workflow and Approval Path", sourceType: SourceType.generated, content: "RFP parsed by Proposal Manager, technical validation by Proposal Engineer, clause closure by Compliance Coordinator, and final approval by VP Business Development. Client clarification log contains two resolved items and one approved technical deviation." },
    ],
    checklistItems: [
      { id: "api600", label: "API 600 valve construction confirmed", standard: "API 600 / ASME B16.34", checked: true },
      { id: "api598", label: "Hydrostatic and seat test scope confirmed", standard: "API 598", checked: true },
      { id: "nace", label: "Sour-service tags mapped for NACE applicability", standard: "NACE MR0175 / ISO 15156", checked: true },
      { id: "docs", label: "MTC, ITP, QAP, GA, and test certificate data book listed", standard: "Client MDR", checked: true },
      { id: "deviation", label: "Deviation register reviewed and approved", standard: "Client commercial instructions", checked: true },
    ],
    tbeResponses: [
      { lineItemIndex: 0, tag: "Material", responseText: "ASTM A216 WCB body/bonnet with 13Cr trim, compliant with line class." },
      { lineItemIndex: 0, tag: "Testing", responseText: "Shell, seat, backseat, visual, dimensional, and PMI testing per API 598 and approved ITP." },
      { lineItemIndex: 1, tag: "Material", responseText: "ASTM A217 WC6 for high-temperature steam service with RTJ flanged ends." },
      { lineItemIndex: 1, tag: "Deviation", responseText: "No technical deviation. Delivery assumes drawing approval within 7 calendar days." },
      { lineItemIndex: 2, tag: "Inspection", responseText: "Client witness hold point included for hydrotest and final inspection." },
    ],
  },
  {
    id: "demo-proposal-municipal-water-pumping-infrastructure",
    userId: "demo-user-aquadyn-proposal-manager",
    rfpId: "demo-rfp-municipal-water-pumping-infrastructure",
    title: "Completed Proposal - Municipal Water Pumping Infrastructure",
    industry: Industry.Pumps,
    templateType: "Pumps",
    winScore: 88,
    companySize: CompanySize.enterprise,
    approvalStatus: ApprovalStatus.pending_approval,
    sections: [
      { id: "demo-sec-pump-exec", title: "Executive Summary", sourceType: SourceType.vault, content: "AquaDyn Pumps India Ltd offers a municipal pumping package optimized for hydraulic efficiency, energy cost reduction, and serviceability. The package covers raw water intake pumps, clear-water transfer pumps, jockey pumps, motors, VFD readiness, tests, spares, and commissioning support." },
      { id: "demo-sec-pump-technical", title: "Hydraulic Selection and Performance Guarantee", sourceType: SourceType.vault, content: "Selections meet rated duty with NPSH margin, preferred operating range coverage, IE3 motor compatibility, and ISO 9906 Grade 2B performance testing. Hydraulic curves, efficiency points, foundation loads, and motor sizing are included in the technical annexure." },
      { id: "demo-sec-pump-compliance", title: "Compliance Matrix Summary", sourceType: SourceType.generated, content: "Mandatory clauses reviewed: 37. Fully compliant: 34. Compliant with clarification: 3. Deviation requested: 0. Energy-consumption and lifecycle-cost assumptions are ready for commercial review." },
      { id: "demo-sec-pump-dashboard", title: "Executive Dashboard Snapshot", sourceType: SourceType.generated, content: "Bid value visibility: INR 11.8 Cr. Proposal turnaround: 1.9 days versus 4.2 day baseline. Compliance completion: 92%. Vault reuse: 64%. Engineering effort avoided: 27 hours. Approval status: pending VP release." },
      { id: "demo-sec-pump-workflow", title: "Workflow and Approval Path", sourceType: SourceType.generated, content: "RFP parsed by Proposal Manager, pump selections validated by Proposal Engineer, compliance checklist closed by Compliance Coordinator, and release pending VP Business Development approval. All TBE rows have first-pass responses." },
    ],
    checklistItems: [
      { id: "iso9906", label: "Performance test standard and grade confirmed", standard: "ISO 9906 Grade 2B", checked: true },
      { id: "npsh", label: "NPSH margin and preferred operating region validated", standard: "Hydraulic selection basis", checked: true },
      { id: "motor", label: "Motor IE3/IP55/Class F requirements included", standard: "IEC / Client specification", checked: true },
      { id: "lcc", label: "Life-cycle energy estimate prepared", standard: "Municipal evaluation criteria", checked: true },
      { id: "commissioning", label: "Commissioning and O&M deliverables listed", standard: "Client handover package", checked: false },
    ],
    tbeResponses: [
      { lineItemIndex: 0, tag: "Hydraulic Duty", responseText: "1,250 m3/hr at 46 m head with NPSH margin greater than 1.2 m at rated duty." },
      { lineItemIndex: 0, tag: "Testing", responseText: "Factory performance test to ISO 9906 Grade 2B with vibration and noise records." },
      { lineItemIndex: 1, tag: "Efficiency", responseText: "Selected duty point efficiency exceeds 78%; final curve submitted with offer annexure." },
      { lineItemIndex: 1, tag: "Motor", responseText: "IE3 motor, IP55 enclosure, Class F insulation with B temperature rise, VFD compatible." },
      { lineItemIndex: 2, tag: "Controls", responseText: "VFD panel, local instrumentation, and pressure-maintenance logic included." },
    ],
  },
  {
    id: "demo-proposal-petrochemical-epc-process-package",
    userId: "demo-user-zenith-proposal-manager",
    rfpId: "demo-rfp-petrochemical-epc-process-package",
    title: "Completed Proposal - Petrochemical EPC Process Package",
    industry: Industry.EPC,
    templateType: "EPC",
    winScore: 84,
    companySize: CompanySize.conglomerate,
    approvalStatus: ApprovalStatus.approved,
    sections: [
      { id: "demo-sec-epc-exec", title: "Executive Summary", sourceType: SourceType.vault, content: "Zenith EPC Solutions proposes a disciplined EPC execution model for the petrochemical process package, covering process validation, multi-discipline engineering, procurement support, vendor TBE, modular fabrication, construction methodology, commissioning assistance, and handover." },
      { id: "demo-sec-epc-method", title: "Engineering and Execution Methodology", sourceType: SourceType.vault, content: "The project will progress from FEED validation through IFC release using controlled deliverable gates. Discipline interfaces, vendor inputs, HAZOP actions, constructability reviews, and document control milestones are managed through a common proposal workflow." },
      { id: "demo-sec-epc-tbe", title: "TBE and Procurement Strategy", sourceType: SourceType.vault, content: "Vendor TBEs compare compliance by datasheet, standards, deviations, delivery, inspection, documentation, and lifecycle risk. Recommendations distinguish technically acceptable offers from offers requiring clarification or commercial loading." },
      { id: "demo-sec-epc-dashboard", title: "Executive Dashboard Snapshot", sourceType: SourceType.generated, content: "Bid value visibility: INR 126 Cr. Proposal turnaround: 2.4 days versus 6.0 day baseline. Compliance completion: 89%. Vault reuse: 61%. Engineering effort avoided: 54 hours. Approval status: released." },
      { id: "demo-sec-epc-workflow", title: "Workflow and Approval Path", sourceType: SourceType.generated, content: "RFP intake and go/no-go completed, discipline owners assigned, vendor TBE examples prepared, compliance register reviewed, construction methodology drafted, and management approval completed with two open assumptions called out in the commercial note." },
    ],
    checklistItems: [
      { id: "feed", label: "FEED validation and IFC deliverable gates defined", standard: "Client engineering procedure", checked: true },
      { id: "disciplines", label: "Process, piping, mechanical, electrical, instrumentation, civil, HSE, and QA inputs mapped", standard: "EPC responsibility matrix", checked: true },
      { id: "vendor-tbe", label: "Vendor TBE method and evaluation fields included", standard: "Procurement procedure", checked: true },
      { id: "hse", label: "HSE, HAZOP, and pre-commissioning requirements covered", standard: "OISD / ISO 45001", checked: true },
      { id: "handover", label: "Handover dossier and document control procedure included", standard: "Client MDR", checked: true },
    ],
    tbeResponses: [
      { lineItemIndex: 0, tag: "Deliverables", responseText: "PFD, P&ID, HMB, equipment list, line list, datasheets, control narratives, and HAZOP closeout included." },
      { lineItemIndex: 0, tag: "Schedule", responseText: "IFC release planned through gated interdisciplinary reviews with client comment cycles." },
      { lineItemIndex: 1, tag: "TBE Method", responseText: "Vendor offers evaluated by datasheet compliance, deviations, delivery, inspection, documentation, and lifecycle risk." },
      { lineItemIndex: 1, tag: "Deviation", responseText: "No base deviation. Vendor deviations will be normalized in the TBE recommendation sheet." },
      { lineItemIndex: 2, tag: "Quality", responseText: "Fabrication includes NDT, hydrotest, painting, FAT, packing, and handover dossier." },
    ],
  },
  {
    id: "demo-proposal-industrial-automation-control-system-upgrade",
    userId: "demo-user-vectorloop-proposal-manager",
    rfpId: "demo-rfp-industrial-automation-control-system-upgrade",
    title: "Completed Proposal - Industrial Automation Control System Upgrade",
    industry: Industry.General,
    templateType: "Industrial Automation",
    winScore: 86,
    companySize: CompanySize.enterprise,
    approvalStatus: ApprovalStatus.pending_approval,
    sections: [
      { id: "demo-sec-auto-exec", title: "Executive Summary", sourceType: SourceType.vault, content: "VectorLoop Industrial Automation Pvt Ltd proposes a controlled PLC/SCADA migration package covering hardware, software engineering, cabinet scope, FAT/SAT, cybersecurity review, training, and phased cutover support for the chemical manufacturing complex." },
      { id: "demo-sec-auto-technical", title: "Automation Migration Methodology", sourceType: SourceType.vault, content: "The approach maps existing I/O, logic, graphics, alarms, historian interfaces, and network dependencies before migration. FAT and SAT gates validate tag conversion, interlocks, alarms, backup/restore, and operator readiness before site cutover." },
      { id: "demo-sec-auto-compliance", title: "Compliance Matrix Summary", sourceType: SourceType.generated, content: "Mandatory clauses reviewed: 31. Fully compliant: 27. Compliant with clarification: 4. Deviation requested: 0. Cybersecurity hardening, software license exclusions, and client IT approvals are flagged for final clarification." },
      { id: "demo-sec-auto-commercial", title: "Commercial Summary", sourceType: SourceType.generated, content: "Pricing placeholder: INR 9.6 Cr subject to final license count, site support days, panel inspection scope, and AMC option. Delivery assumes approved I/O list, panel layout freeze, and client FAT attendance within agreed review windows." },
      { id: "demo-sec-auto-dashboard", title: "Executive Dashboard Snapshot", sourceType: SourceType.generated, content: "Bid value visibility: INR 9.6 Cr. Proposal turnaround: 1.7 days versus 4.3 day baseline. Compliance completion: 91%. Vault reuse: 62%. Engineering effort avoided: 29 hours. Approval status: pending VP release." },
    ],
    checklistItems: [
      { id: "plc-scope", label: "PLC hardware, I/O, logic migration, and workstation scope listed", standard: "Client automation specification", checked: true },
      { id: "scada-scope", label: "SCADA graphics, alarm, historian, and operator workstation scope mapped", standard: "Project HMI procedure", checked: true },
      { id: "fat-sat", label: "FAT, SAT, loop check, and training deliverables included", standard: "Client FAT/SAT procedure", checked: true },
      { id: "cybersecurity", label: "Cybersecurity hardening and access assumptions flagged", standard: "IEC 62443 awareness / client IT policy", checked: false },
      { id: "commercial", label: "Software license exclusions and optional AMC scope clarified", standard: "Commercial review", checked: false },
    ],
    tbeResponses: [
      { lineItemIndex: 0, tag: "PLC Scope", responseText: "Controller hardware, I/O migration, logic conversion, and engineering workstation configuration included subject to final I/O list." },
      { lineItemIndex: 0, tag: "Cutover", responseText: "Phased migration approach assumes client-approved shutdown window and backup/restore test before switchover." },
      { lineItemIndex: 1, tag: "SCADA", responseText: "HMI graphics, historian interface, alarm support, and operator workstation setup included." },
      { lineItemIndex: 1, tag: "Cybersecurity", responseText: "Hardening checklist and access assumptions included for client IT review; final policy exceptions require approval." },
      { lineItemIndex: 2, tag: "Testing", responseText: "FAT, SAT support, loop check assistance, issue log, and operator training deliverables included." },
    ],
  },
];

async function main() {
  if (process.env.ENABLE_ENTERPRISE_DEMO_SEED !== "true") {
    throw new Error("Set ENABLE_ENTERPRISE_DEMO_SEED=true to run the enterprise demo seed. This seed is intentionally opt-in.");
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  for (const org of demoOrgs) {
    await prisma.organization.upsert({
      where: { id: org.id },
      update: { name: org.name, brandColor: org.brandColor },
      create: {
        id: org.id,
        name: org.name,
        brandColor: org.brandColor,
        createdById: org.users[0].id,
      },
    });

    for (const user of org.users) {
      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name,
          role: user.role,
          companyName: `${org.name} - ${user.title}`,
          organizationId: org.id,
        },
        create: {
          id: user.id,
          email: user.email,
          passwordHash,
          name: user.name,
          role: user.role,
          companyName: `${org.name} - ${user.title}`,
          organizationId: org.id,
        },
      });
    }
  }

  await seedKnowledgeVault();
  await seedRfps();
  await seedProposals();

  console.log("Enterprise demo seed completed.");
  console.log(`Demo password for all seeded users: ${DEMO_PASSWORD}`);
}

async function seedKnowledgeVault() {
  const adminUsers = Object.fromEntries(demoOrgs.map((org) => [org.industry, org.users[0].id]));
  for (const [index, [title, industry, tags, content]] of knowledgeAssets.entries()) {
    const userId = adminUsers[industry] ?? demoOrgs[0].users[0].id;
    await prisma.vaultTextEntry.upsert({
      where: { id: `demo-vault-entry-${index + 1}` },
      update: { title, content, tags: [...tags], industry },
      create: {
        id: `demo-vault-entry-${index + 1}`,
        userId,
        title,
        content,
        tags: [...tags],
        industry,
      },
    });
  }

  for (const org of demoOrgs) {
    const documentId = `demo-vault-doc-${org.id.replace("demo-org-", "")}`;
    await prisma.vaultDocument.upsert({
      where: { id: documentId },
      update: {
        filename: `${org.name} - Enterprise Proposal Knowledge Pack.pdf`,
        fileType: "application/pdf",
        documentType: "Demo Knowledge Pack",
        isPublic: true,
        industry: org.industry,
        tags: ["enterprise-demo", "pilot", "knowledge-vault"],
        extractedSectionsCount: 4,
      },
      create: {
        id: documentId,
        userId: org.users[0].id,
        filename: `${org.name} - Enterprise Proposal Knowledge Pack.pdf`,
        fileType: "application/pdf",
        documentType: "Demo Knowledge Pack",
        isPublic: true,
        industry: org.industry,
        tags: ["enterprise-demo", "pilot", "knowledge-vault"],
        extractedSectionsCount: 4,
      },
    });

    const sections = [
      ["Reusable Proposal Clause", "Standard executive summary and value proposition language approved for enterprise bids."],
      ["Engineering Response Library", "Pre-validated technical responses for specifications, test requirements, documentation, and lifecycle support."],
      ["Compliance Review Template", "Mandatory clause mapping format with status, owner, evidence, deviation, and approval fields."],
      ["Deviation Examples", "Approved examples for technical alternatives with risk, mitigation, and commercial impact narrative."],
    ];

    for (const [sectionIndex, [sectionTitle, content]] of sections.entries()) {
      await prisma.vaultSection.upsert({
        where: { id: `${documentId}-section-${sectionIndex + 1}` },
        update: {
          sectionTitle,
          content,
          sectionType: "enterprise-demo",
          industryTags: [org.industry, "pilot", "demo"],
        },
        create: {
          id: `${documentId}-section-${sectionIndex + 1}`,
          documentId,
          sectionTitle,
          content,
          sectionType: "enterprise-demo",
          industryTags: [org.industry, "pilot", "demo"],
        },
      });
    }
  }
}

async function seedRfps() {
  for (const rfp of rfps) {
    await prisma.rfpUpload.upsert({
      where: { id: rfp.id },
      update: {
        filename: rfp.filename,
        fileType: "application/pdf",
        isPublic: true,
        extractedData: rfp.extractedData,
      },
      create: {
        id: rfp.id,
        userId: rfp.ownerId,
        filename: rfp.filename,
        fileType: "application/pdf",
        isPublic: true,
        extractedData: rfp.extractedData,
      },
    });

    await prisma.goNoGoAssessment.upsert({
      where: { rfpId: rfp.id },
      update: {
        userId: rfp.ownerId,
        totalScore: rfp.industry === Industry.EPC ? 78 : 86,
        maxScore: 100,
        recommendation: rfp.industry === Industry.EPC ? "Conditional Bid" : "Bid",
        notes: "Demo assessment: strong technical fit, visible bid value, and manageable compliance risk.",
        responses: {
          strategicFit: "High",
          technicalCapability: "High",
          scheduleRisk: rfp.industry === Industry.EPC ? "Medium" : "Low",
          commercialAttractiveness: "High",
        },
      },
      create: {
        id: `${rfp.id}-go-no-go`,
        rfpId: rfp.id,
        userId: rfp.ownerId,
        totalScore: rfp.industry === Industry.EPC ? 78 : 86,
        maxScore: 100,
        recommendation: rfp.industry === Industry.EPC ? "Conditional Bid" : "Bid",
        notes: "Demo assessment: strong technical fit, visible bid value, and manageable compliance risk.",
        responses: {
          strategicFit: "High",
          technicalCapability: "High",
          scheduleRisk: rfp.industry === Industry.EPC ? "Medium" : "Low",
          commercialAttractiveness: "High",
        },
      },
    });
  }
}

async function seedProposals() {
  for (const proposal of proposals) {
    await prisma.proposal.upsert({
      where: { id: proposal.id },
      update: {
        title: proposal.title,
        status: ProposalStatus.Final,
        industry: proposal.industry,
        templateType: proposal.templateType,
        vaultSectionsUsed: proposal.sections.filter((section) => section.sourceType === SourceType.vault).length,
        vaultDocumentsUsed: 4,
        winScore: proposal.winScore,
        companySize: proposal.companySize,
        approvalStatus: proposal.approvalStatus,
        approvedById: proposal.approvalStatus === ApprovalStatus.approved ? proposal.userId.replace("proposal-manager", "vp-business-development") : null,
        approvedAt: proposal.approvalStatus === ApprovalStatus.approved ? new Date("2026-05-27T10:30:00.000Z") : null,
      },
      create: {
        id: proposal.id,
        userId: proposal.userId,
        rfpId: proposal.rfpId,
        title: proposal.title,
        status: ProposalStatus.Final,
        industry: proposal.industry,
        templateType: proposal.templateType,
        vaultSectionsUsed: proposal.sections.filter((section) => section.sourceType === SourceType.vault).length,
        vaultDocumentsUsed: 4,
        winScore: proposal.winScore,
        companySize: proposal.companySize,
        approvalStatus: proposal.approvalStatus,
        approvedById: proposal.approvalStatus === ApprovalStatus.approved ? proposal.userId.replace("proposal-manager", "vp-business-development") : null,
        approvedAt: proposal.approvalStatus === ApprovalStatus.approved ? new Date("2026-05-27T10:30:00.000Z") : null,
      },
    });

    for (const [orderIndex, section] of proposal.sections.entries()) {
      await prisma.proposalSection.upsert({
        where: { id: section.id },
        update: {
          sectionTitle: section.title,
          content: section.content,
          sourceType: section.sourceType,
          orderIndex,
        },
        create: {
          id: section.id,
          proposalId: proposal.id,
          sectionTitle: section.title,
          content: section.content,
          sourceType: section.sourceType,
          orderIndex,
        },
      });
    }

    await prisma.complianceChecklist.upsert({
      where: { proposalId: proposal.id },
      update: { checklistItems: proposal.checklistItems },
      create: {
        id: `${proposal.id}-compliance`,
        proposalId: proposal.id,
        checklistItems: proposal.checklistItems,
      },
    });

    for (const response of proposal.tbeResponses) {
      await prisma.tbeResponse.upsert({
        where: {
          rfpId_lineItemIndex_tag: {
            rfpId: proposal.rfpId,
            lineItemIndex: response.lineItemIndex,
            tag: response.tag,
          },
        },
        update: { responseText: response.responseText },
        create: {
          id: `${proposal.rfpId}-tbe-${response.lineItemIndex}-${response.tag.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          rfpId: proposal.rfpId,
          lineItemIndex: response.lineItemIndex,
          tag: response.tag,
          responseText: response.responseText,
        },
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
