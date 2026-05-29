import { PrismaClient, Industry, ProposalStatus, UserRole, CompanySize, ApprovalStatus, SourceType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "Demo@12345";
const DISCLAIMER =
  "Preliminary proposal-stage engineering estimate. Final sizing/design must be validated by qualified engineers using company-approved tools and standards.";

const org = {
  id: "demo-org-cci-severe-service-solutions",
  name: "CCI Severe Service Solutions",
  brandColor: "#0f4c5c",
};

const users = [
  ["demo-user-cci-vp-business-development", "Ananya Rao", "VP Business Development", "vp.business.development", UserRole.admin],
  ["demo-user-cci-proposal-director", "Vikram Menon", "Proposal Director", "proposal.director", UserRole.bid_manager],
  ["demo-user-cci-senior-proposal-engineer", "Meera Krishnan", "Senior Proposal Engineer", "senior.proposal.engineer", UserRole.team_member],
  ["demo-user-cci-valve-application-engineer", "Rohan Iyer", "Valve Application Engineer", "valve.application.engineer", UserRole.team_member],
  ["demo-user-cci-compliance-coordinator", "Priya Nair", "Compliance Coordinator", "compliance.coordinator", UserRole.reviewer],
  ["demo-user-cci-engineering-manager", "Arjun Shah", "Engineering Manager", "engineering.manager", UserRole.reviewer],
] as const;

type RfpSeed = {
  id: string;
  filename: string;
  title: string;
  customer: string;
  ownerId: string;
  bidValue: string;
  dueDate: string;
  winScore: number;
  approvalStatus: ApprovalStatus;
  application: string;
  summary: string;
  processConditions: Record<string, string>;
  requirements: string[];
  compliance: string[];
  inspection: string[];
  delivery: string[];
  commercial: string[];
  deviations: string[];
  reviewPoints: string[];
  intelligence: {
    classification: string;
    configuration: string;
    severeServiceRisk: string;
    cavitationFlashingChoked: string;
    noiseVibration: string;
    trim: string;
    actuator: string;
    materials: string;
    inspection: string;
    checklist: string[];
  };
  calculations: {
    inputs: string[];
    assumptions: string[];
    severity: string;
    cvKv: string;
    riskFlags: string[];
    standards: string[];
    validation: string[];
  };
  dashboard: Record<string, string>;
  lineItems: Array<{ item: string; description: string; quantity: number; tag: string }>;
  tbe: Array<{ lineItemIndex: number; tag: string; responseText: string }>;
  sections: Array<{ title: string; content: string; sourceType?: SourceType }>;
};

function list(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function table(rows: Array<[string, string]>) {
  return rows.map(([a, b]) => `| ${a} | ${b} |`).join("\n");
}

function engineeringContent(seed: RfpSeed) {
  return [
    DISCLAIMER,
    "",
    "## Extracted Process Conditions",
    table(Object.entries(seed.processConditions) as Array<[string, string]>),
    "",
    "## Service / Application Classification",
    seed.intelligence.classification,
    "",
    "## Preliminary Valve Configuration Narrative",
    seed.intelligence.configuration,
    "",
    "## Severe-Service Risk Assessment",
    seed.intelligence.severeServiceRisk,
    "",
    "## Cavitation / Flashing / Choked-Flow Risk Narrative",
    seed.intelligence.cavitationFlashingChoked,
    "",
    "## Noise / Vibration Risk Narrative",
    seed.intelligence.noiseVibration,
    "",
    "## Trim Recommendation Narrative",
    seed.intelligence.trim,
    "",
    "## Actuator / Accessory Narrative",
    seed.intelligence.actuator,
    "",
    "## Material Compatibility Notes",
    seed.intelligence.materials,
    "",
    "## Inspection / Testing Notes",
    seed.intelligence.inspection,
    "",
    "## Engineering Review Checklist",
    list(seed.intelligence.checklist),
  ].join("\n");
}

function calculationContent(seed: RfpSeed) {
  return [
    DISCLAIMER,
    "",
    "## Process Inputs",
    list(seed.calculations.inputs),
    "",
    "## Assumptions",
    list(seed.calculations.assumptions),
    "",
    "## Pressure Drop Severity Classification",
    seed.calculations.severity,
    "",
    "## Preliminary Cv/Kv Placeholder",
    seed.calculations.cvKv,
    "",
    "## Risk Flags",
    list(seed.calculations.riskFlags),
    "",
    "## Engineering Validation Checklist",
    list(seed.calculations.validation),
    "",
    "## Applicable Standards Awareness",
    list(seed.calculations.standards),
  ].join("\n");
}

const rfps: RfpSeed[] = [
  {
    id: "imi-cci-demo-rfp-lng-compressor-recycle",
    filename: "IMI_CCI_STYLE_RFP_LNG_Compressor_Recycle_Valve_Package.pdf",
    title: "LNG Compressor Recycle Valve Package",
    customer: "Coastal LNG Expansion Project",
    ownerId: "demo-user-cci-proposal-director",
    bidValue: "INR 28.5 Cr",
    dueDate: "2026-06-19",
    winScore: 93,
    approvalStatus: ApprovalStatus.approved,
    application: "Compressor recycle / anti-surge severe-service control valve",
    summary:
      "Supply of fast-acting compressor recycle control valves for LNG train reliability, high pressure drop service, anti-surge protection, severe-service trim, low vibration, and documented inspection hold points.",
    processConditions: {
      Fluid: "Natural gas rich LNG process gas",
      "Inlet pressure": "92 barg normal, 108 barg design",
      "Outlet pressure": "34 barg normal",
      Temperature: "-28 C to 45 C",
      "Flow case": "Normal recycle, compressor trip, startup bypass",
      "Response time": "Fast stroke required for anti-surge duty",
      "Leakage class": "Class IV minimum, tighter class subject to final sizing",
    },
    requirements: [
      "Compressor recycle / anti-surge service with fast response requirement.",
      "High pressure drop with severe-service trim and aerodynamic noise control.",
      "Actuator, positioner, solenoids, air volume tank, limit switches, and tubing accessories.",
      "Noise and vibration risk review for LNG process reliability.",
      "Dedicated inspection and test plan with functional stroke testing.",
    ],
    compliance: ["ISA 75.01 / IEC 60534 sizing awareness", "ASME B16.34 pressure-temperature awareness", "Project anti-surge control philosophy", "Client ITP and MDR"],
    inspection: ["Hydrotest", "Seat leakage test", "Functional stroke test", "Accessory loop check", "PMI for pressure parts", "Witness points per approved ITP"],
    delivery: ["GA drawing within 2 weeks of PO", "Critical accessory submittals with proposal", "Expedited manufacturing schedule to support LNG train outage window"],
    commercial: ["Price assumes client datasheet revision A", "Final actuator sizing subject to confirmed fail action and instrument air pressure"],
    deviations: ["Acoustic guarantee requires final process cases and piping geometry", "Final Cv/Kv and trim stage count require engineer-validated sizing"],
    reviewPoints: ["Anti-surge response philosophy", "Noise limit basis", "Fail action and trip case", "Accessory redundancy", "Compressor OEM interface"],
    intelligence: {
      classification: "Severe-service compressor recycle valve, anti-surge protection, high pressure drop gas service, high reliability LNG duty.",
      configuration: "Indicative configuration is an angle or globe-style control valve with severe-service multi-stage pressure reduction trim, robust guided plug, high-capacity pneumatic actuator, smart positioner, solenoid trip arrangement, volume booster or quick exhaust where validated, and accessory package aligned to the anti-surge control philosophy.",
      severeServiceRisk: "High. The package combines large pressure drop, fast dynamic response, compressor protection, LNG reliability exposure, and potential acoustic fatigue risk. Proposal response should elevate this as an engineering-reviewed severe-service item.",
      cavitationFlashingChoked: "Liquid cavitation is not the primary mode for gas recycle service, but choked-flow, high Mach number, and aerodynamic noise risk are material. Final sizing must validate pressure recovery, outlet velocity, trim exit velocity, and acoustic performance.",
      noiseVibration: "Noise and vibration risk is high due to large gas pressure letdown and transient recycle cases. Proposal-stage response should call for acoustic review, low-noise trim, piping support review by client, and confirmation of project noise limits.",
      trim: "Recommend engineered multi-stage or multi-path severe-service trim with controlled pressure drop distribution. Final trim model and stage count require validated process cases and company-approved sizing tools.",
      actuator: "Fast response pneumatic actuator with positioner, fail-safe action, solenoid arrangement, air set, limit switches, volume booster or trip accessories as required by anti-surge response calculations.",
      materials: "Pressure boundary material to match line class and low-temperature design basis. Elastomers, packing, and accessories require compatibility review for LNG process gas and site ambient conditions.",
      inspection: "ITP should include hydrotest, seat leakage, functional stroke, accessory loop verification, PMI, dimensional inspection, and review of response accessories.",
      checklist: ["Confirm anti-surge required stroke time", "Validate all compressor operating cases", "Check outlet velocity and acoustic fatigue exposure", "Confirm fail action and trip accessories", "Obtain piping geometry for final noise validation"],
    },
    calculations: {
      inputs: ["P1 92 barg normal, 108 barg design", "P2 34 barg normal", "Gas composition from LNG process datasheet", "Temperature range -28 C to 45 C", "Normal, startup, and trip recycle cases"],
      assumptions: ["Indicative proposal-stage assessment only", "Compressible gas sizing basis per ISA 75.01 / IEC 60534 awareness", "Noise limit and pipe geometry to be confirmed by client", "Instrument air pressure and fail action to be confirmed"],
      severity: "High pressure drop severe-service gas duty with choked-flow and aerodynamic noise risk likely in upset cases.",
      cvKv: "Indicative Cv/Kv is not certified at proposal stage. Placeholder range should be generated only after validated gas composition, molecular weight, temperature, flow cases, and valve style are confirmed.",
      riskFlags: ["Choked-flow risk", "Acoustic fatigue risk", "Fast-stroke actuator validation", "Accessory response time", "Compressor protection criticality"],
      standards: ["ISA 75.01 / IEC 60534 for control valve sizing", "ASME B16.34 for pressure-temperature considerations", "Project anti-surge and noise specifications", "API / project-specific test references where relevant"],
      validation: ["Run company-approved gas sizing", "Run acoustic/noise prediction", "Validate actuator thrust and stroke time", "Review trim exit velocity and outlet Mach number", "Engineering sign-off before final offer"],
    },
    dashboard: { "Bid value": "INR 28.5 Cr", "Proposal turnaround reduction": "56%", "Reusable engineering content": "68%", "Engineering hours saved": "38", "Compliance coverage": "96%", "TBE completion": "94%", "Approval cycle time": "1.4 days", "Proposal risk score": "Medium-high managed", "Win probability score": "93%" },
    lineItems: [
      { item: "Compressor Recycle Control Valve", description: "Fast acting severe-service gas recycle valve with low-noise trim", quantity: 3, tag: "XV-CRV-9101" },
      { item: "Anti-Surge Accessory Package", description: "Positioner, solenoids, volume accessories, switches, tubing, and air set", quantity: 3, tag: "ASP-9101" },
    ],
    tbe: [
      { lineItemIndex: 0, tag: "Material", responseText: "Pressure boundary material to match LNG line class and low-temperature service; final MOC requires engineer/client datasheet confirmation." },
      { lineItemIndex: 0, tag: "Trim", responseText: "Engineered severe-service multi-stage low-noise trim proposed; final stage count requires validated sizing." },
      { lineItemIndex: 0, tag: "Pressure Class", responseText: "ASME class to match project piping class and ASME B16.34 pressure-temperature review." },
      { lineItemIndex: 0, tag: "Actuator", responseText: "Fast-response pneumatic actuator with accessories subject to anti-surge stroke-time validation." },
      { lineItemIndex: 0, tag: "Accessories", responseText: "Smart positioner, solenoid trip arrangement, filter regulator, limit switches, booster/quick exhaust if validated." },
      { lineItemIndex: 0, tag: "Testing", responseText: "Hydrotest, seat leakage, functional stroke, accessory loop check, and ITP witness points included." },
      { lineItemIndex: 0, tag: "Inspection", responseText: "PMI, dimensional inspection, pressure test review, and final documentation dossier." },
      { lineItemIndex: 0, tag: "Documentation", responseText: "Datasheet, GA, ITP, QAP, material certificates, test certificates, deviation register, and O&M manual." },
      { lineItemIndex: 0, tag: "Deviation", responseText: "Acoustic guarantee and final Cv/Kv subject to confirmed process cases and company-approved sizing." },
      { lineItemIndex: 0, tag: "Engineering Comments", responseText: DISCLAIMER },
    ],
    sections: [
      { title: "Executive Summary", sourceType: SourceType.vault, content: "WinsProposal frames this opportunity as an engineering proposal intelligence workflow for severe-service compressor recycle valves. The offer connects RFP extraction, anti-surge requirements, reusable severe-service narratives, TBE responses, risk/deviation control, and management KPI visibility so the proposal team can respond faster without presenting preliminary engineering as final design." },
      { title: "LNG Compressor Recycle Architecture Diagram", content: "Section-specific visual basis: compressor discharge, recycle path, anti-surge controller, fast-acting recycle valve, actuator accessories, noise control trim, inspection evidence, and engineering validation gates." },
      { title: "Engineering Basis", content: "Engineering dependency map: client datasheet, compressor operating cases, gas composition, pressure letdown, anti-surge response time, actuator sizing, acoustic review, severe-service trim selection, QA review, and final proposal release." },
      { title: "Proposal-Stage Engineering Intelligence", sourceType: SourceType.vault, content: "" },
      { title: "Preliminary Engineering Calculation Summary", content: "" },
      { title: "Compliance Matrix", content: "Compliance coverage maps ISA 75.01 / IEC 60534 sizing awareness, ASME B16.34 pressure-temperature considerations, client anti-surge philosophy, inspection hold points, functional testing, document deliverables, and technical deviation status. Current demo coverage is 96% with open items assigned to engineering validation." },
      { title: "Risk / Deviations", content: "Decision tree covers choked-flow risk, acoustic fatigue risk, fast-response accessory risk, final sizing dependency, and client clarification requirements. Each risk is assigned an owner, mitigation note, and approval path before submission." },
      { title: "Workflow / Approval", content: "Proposal Director owns bid response, Senior Proposal Engineer drafts technical sections, Valve Application Engineer validates preliminary engineering basis, Compliance Coordinator closes matrix/TBE, Engineering Manager approves technical risk, and VP Business Development releases management offer." },
      { title: "Executive Dashboard", content: "" },
    ],
  },
  {
    id: "imi-cci-demo-rfp-refinery-severe-service",
    filename: "IMI_CCI_STYLE_RFP_Refinery_Severe_Service_Control_Valve_Package.pdf",
    title: "Refinery Severe-Service Control Valve Package",
    customer: "Western Refinery Resid Upgrader",
    ownerId: "demo-user-cci-senior-proposal-engineer",
    bidValue: "INR 21.8 Cr",
    dueDate: "2026-06-24",
    winScore: 89,
    approvalStatus: ApprovalStatus.pending_approval,
    application: "High differential pressure refinery control valves with cavitation/flashing risk",
    summary: "Severe-service control valves for refinery letdown and sour hydrocarbon service with cavitation, flashing, erosion/corrosion, NACE applicability, hydrotest, QA/QC, and deviation handling requirements.",
    processConditions: { Fluid: "Sour hydrocarbon / refinery process liquid", "Inlet pressure": "76 barg", "Outlet pressure": "22 barg", Temperature: "180 C", "Vapor pressure": "Requires client confirmation", "Solids/corrosion": "Potential erosion/corrosion service", "Leakage class": "Class IV/V by tag" },
    requirements: ["Cavitation and flashing risk review.", "High differential pressure severe-service trim.", "NACE MR0175 / ISO 15156 applicability by tag.", "Erosion/corrosion material note.", "QA/QC, hydrotest, PMI, NDE, deviation register."],
    compliance: ["ISA 75.01 / IEC 60534", "NACE MR0175 / ISO 15156", "ASME B16.34", "Project hydrotest and ITP requirements"],
    inspection: ["Hydrotest", "Seat leakage", "PMI", "NDE where specified", "MTC review", "Client witness hold points"],
    delivery: ["Tag-wise datasheet review", "Drawing and ITP submission after PO", "Long-lead trim and metallurgy to be flagged"],
    commercial: ["Final material price subject to confirmed NACE and corrosion allowance", "Deviations priced separately where special metallurgy is required"],
    deviations: ["Vapor pressure missing for final cavitation/flashing validation", "Sour-service tag list requires client confirmation"],
    reviewPoints: ["Cavitation index", "Flashing percentage", "NACE tag applicability", "Erosion velocity", "Hardfacing requirement"],
    intelligence: {
      classification: "Severe-service refinery liquid letdown with high differential pressure, potential cavitation/flashing, and sour-service material governance.",
      configuration: "Indicative offer uses globe or angle severe-service control valves with anti-cavitation trim for liquid pressure letdown, hardened trim surfaces where validated, and material selection aligned to NACE and corrosion risk.",
      severeServiceRisk: "High. The service combines high pressure drop, potential phase change, sour-service material restrictions, and refinery reliability consequences.",
      cavitationFlashingChoked: "Cavitation and flashing cannot be finalized without vapor pressure and downstream recovery details. Proposal should classify risk as high and require engineer validation under ISA/IEC sizing workflow.",
      noiseVibration: "Hydrodynamic noise and vibration risk may be significant in high pressure drop liquid service, especially where flashing occurs downstream. Piping layout and outlet velocity should be reviewed.",
      trim: "Anti-cavitation multi-stage trim is recommended for non-flashing liquid cases. Flashing cases may require hardened trim, angle body orientation, and downstream velocity management.",
      actuator: "Pneumatic diaphragm or piston actuator selected by thrust margin, shutoff pressure, leakage class, and fail action. Positioner and airset included; solenoid/accessories by shutdown philosophy.",
      materials: "NACE MR0175 / ISO 15156 applicability must be confirmed. Candidate metallurgy, hardfacing, packing, bolting, and pressure boundary material require sour-service and erosion/corrosion review.",
      inspection: "ITP to include hydrotest, seat leakage, PMI, material certificates, NDE where specified, and NACE compliance evidence where applicable.",
      checklist: ["Confirm vapor pressure and flashing data", "Confirm sour-service tag list", "Validate anti-cavitation versus flashing trim", "Check erosion/corrosion allowance", "Close deviation register before release"],
    },
    calculations: {
      inputs: ["P1 76 barg", "P2 22 barg", "Temperature 180 C", "Fluid sour hydrocarbon", "Vapor pressure pending"],
      assumptions: ["Liquid sizing under ISA 75.01 / IEC 60534 awareness", "NACE applicability subject to client tag list", "Flashing/cavitation cannot be certified without complete fluid properties"],
      severity: "High differential pressure severe-service liquid duty with cavitation/flashing risk requiring engineering validation.",
      cvKv: "Indicative Cv/Kv placeholder only. Not certified final sizing. Final estimate requires flow rate, density, vapor pressure, critical pressure, recovery factor, and valve style.",
      riskFlags: ["Cavitation", "Flashing", "NACE compliance", "Erosion/corrosion", "Hydrotest and QA hold points"],
      standards: ["ISA 75.01 / IEC 60534 for control valve sizing", "NACE MR0175 / ISO 15156 for sour service", "ASME B16.34 for pressure-temperature considerations", "API / project-specific hydrotest references"],
      validation: ["Run liquid sizing and cavitation check", "Confirm flashing regime", "Validate trim selection", "Confirm metallurgy and NACE certificate evidence", "Approve deviations"],
    },
    dashboard: { "Bid value": "INR 21.8 Cr", "Proposal turnaround reduction": "48%", "Reusable engineering content": "63%", "Engineering hours saved": "31", "Compliance coverage": "94%", "TBE completion": "91%", "Approval cycle time": "1.8 days", "Proposal risk score": "Medium managed", "Win probability score": "89%" },
    lineItems: [{ item: "Refinery Severe-Service Control Valve", description: "High-dP liquid letdown valve with anti-cavitation / flashing review", quantity: 8, tag: "FV-RFU-2201" }],
    tbe: [
      { lineItemIndex: 0, tag: "Material", responseText: "Material selection subject to confirmed sour-service and erosion/corrosion basis; NACE MR0175 / ISO 15156 where applicable." },
      { lineItemIndex: 0, tag: "Trim", responseText: "Anti-cavitation or flashing-resistant severe-service trim proposed by tag after validated sizing." },
      { lineItemIndex: 0, tag: "Pressure Class", responseText: "ASME pressure class per refinery line class and ASME B16.34 review." },
      { lineItemIndex: 0, tag: "Actuator", responseText: "Pneumatic actuator sized for shutoff pressure, leakage class, and fail position." },
      { lineItemIndex: 0, tag: "Accessories", responseText: "Smart positioner, airset, limit switches, solenoid if shutdown action is specified." },
      { lineItemIndex: 0, tag: "Testing", responseText: "Hydrotest, seat leakage, PMI, NDE where specified, and client witness points." },
      { lineItemIndex: 0, tag: "Inspection", responseText: "QA/QC dossier with ITP, MTCs, NACE compliance evidence, and test certificates." },
      { lineItemIndex: 0, tag: "Documentation", responseText: "Datasheets, GA drawings, ITP/QAP, calculations summary, deviation log, and O&M manual." },
      { lineItemIndex: 0, tag: "Deviation", responseText: "Final cavitation/flashing and Cv/Kv require complete process properties." },
      { lineItemIndex: 0, tag: "Engineering Comments", responseText: DISCLAIMER },
    ],
    sections: [
      { title: "Executive Summary", sourceType: SourceType.vault, content: "WinsProposal converts a high-risk refinery severe-service valve package into structured proposal intelligence: process condition extraction, NACE/material notes, preliminary severe-service risk assessment, compliance/TBE response control, and management-ready export packs." },
      { title: "Refinery Severe-Service Process Flow", content: "Section-specific visual basis: refinery process inlet, pressure letdown valve, cavitation/flashing risk zone, downstream piping, material review, hydrotest/QA hold points, and deviation closure." },
      { title: "Engineering Basis", content: "Engineering dependency map covers fluid properties, vapor pressure, pressure drop, trim style, material compatibility, NACE evidence, inspection plan, and final engineering sign-off." },
      { title: "Proposal-Stage Engineering Intelligence", sourceType: SourceType.vault, content: "" },
      { title: "Preliminary Engineering Calculation Summary", content: "" },
      { title: "Compliance Matrix", content: "Clause mapping covers ISA/IEC sizing awareness, NACE sour-service applicability, ASME pressure-temperature review, hydrotest scope, PMI/NDE evidence, material certificates, QA/QC deliverables, and deviation handling." },
      { title: "Risk / Deviations", content: "Risk-deviation tree: missing vapor pressure, NACE tag confirmation, cavitation/flashing validation, hardfacing decision, and final client clarification closure." },
      { title: "Workflow / Approval", content: "Proposal Director assigns refinery package; Application Engineer validates pressure-drop regime; Compliance Coordinator closes NACE and ITP evidence; Engineering Manager approves deviations before VP release." },
      { title: "Executive Dashboard", content: "" },
    ],
  },
  {
    id: "imi-cci-demo-rfp-hydrogen-control-valve",
    filename: "IMI_CCI_STYLE_RFP_Hydrogen_Process_Control_Valve_Package.pdf",
    title: "Hydrogen Process Control Valve Package",
    customer: "Green Hydrogen Process Unit",
    ownerId: "demo-user-cci-valve-application-engineer",
    bidValue: "INR 16.4 Cr",
    dueDate: "2026-06-28",
    winScore: 87,
    approvalStatus: ApprovalStatus.pending_approval,
    application: "Hydrogen-compatible process control valves with high-integrity sealing",
    summary: "Hydrogen process control valves requiring material compatibility, leakage class focus, high-integrity sealing, traceability, process safety, reliability, and documentation control.",
    processConditions: { Fluid: "Hydrogen-rich process gas", "Inlet pressure": "48 barg", "Outlet pressure": "18 barg", Temperature: "60 C", "Leakage class": "Class V requested for selected tags", "Service concern": "Hydrogen compatibility and fugitive emissions", "Traceability": "Full material and pressure test dossier" },
    requirements: ["Hydrogen material compatibility review.", "High-integrity sealing and leakage class review.", "Process safety and reliability narrative.", "Documentation and traceability package.", "Accessory compatibility for hazardous area installation."],
    compliance: ["ISA 75.01 / IEC 60534", "ASME B16.34", "Project hydrogen compatibility specification", "Client documentation and traceability procedure"],
    inspection: ["Hydrotest or pneumatic test basis per project", "Seat leakage", "Material traceability", "PMI", "Packing/sealing review"],
    delivery: ["Early material submittal", "Traceability dossier with offer or post-award schedule", "Hazardous area accessory certificates as applicable"],
    commercial: ["Special sealing or fugitive emission options priced per tag", "Final leakage class and packing subject to engineering review"],
    deviations: ["Hydrogen compatibility matrix requires client material restriction list", "Final leakage class acceptance requires pressure/temperature/tag confirmation"],
    reviewPoints: ["Hydrogen embrittlement susceptibility", "Packing and gasket material", "Leakage class feasibility", "Hazardous area certificates", "Traceability scope"],
    intelligence: {
      classification: "Hydrogen process gas control valve package with material compatibility, leakage integrity, and traceability emphasis.",
      configuration: "Indicative configuration uses globe control valves with hydrogen-compatible pressure boundary materials, suitable trim, high-integrity packing/sealing system, pneumatic actuator, smart positioner, and accessory certificates aligned to area classification.",
      severeServiceRisk: "Medium to high. Pressure drop is material, but the dominant proposal risks are hydrogen compatibility, leakage integrity, sealing reliability, documentation traceability, and process safety expectations.",
      cavitationFlashingChoked: "Gas sizing must check choked-flow and outlet velocity. Liquid cavitation/flashing is not applicable unless two-phase or condensate cases are introduced by client.",
      noiseVibration: "Aerodynamic noise may arise from pressure letdown. Proposal should include noise review after final flow cases and piping geometry are provided.",
      trim: "Trim selection should balance control range, leakage class, hydrogen compatibility, and pressure drop. Final trim model requires validated gas sizing and shutoff basis.",
      actuator: "Pneumatic actuator sized for shutoff, fail action, leakage class, and process safety requirements. Accessories should match hazardous area and site instrument air conditions.",
      materials: "Material compatibility requires review for hydrogen exposure, embrittlement susceptibility, packing, gasket, bolting, and pressure boundary traceability.",
      inspection: "Testing and documentation should emphasize material traceability, pressure test records, leakage class evidence, PMI, and certificate package.",
      checklist: ["Confirm hydrogen purity and contaminants", "Review material restriction list", "Validate leakage class by tag", "Confirm packing and gasket compatibility", "Check hazardous area accessory certificates"],
    },
    calculations: {
      inputs: ["Hydrogen-rich gas", "P1 48 barg", "P2 18 barg", "Temperature 60 C", "Class V requested for selected tags"],
      assumptions: ["Proposal-stage gas sizing only", "Hydrogen molecular properties require final confirmation", "Leakage class feasibility subject to shutoff and trim design"],
      severity: "Moderate to high gas pressure letdown with choked-flow/noise check required and high sealing integrity focus.",
      cvKv: "Indicative Cv/Kv requires final flow rate, molecular weight, compressibility, temperature, and pressure cases. Not certified final sizing.",
      riskFlags: ["Hydrogen compatibility", "Leakage class feasibility", "Fugitive emissions", "Traceability", "Choked-flow/noise check"],
      standards: ["ISA 75.01 / IEC 60534 for control valve sizing", "ASME B16.34 for pressure-temperature considerations", "Project hydrogen material compatibility specification", "API / project-specific test references where relevant"],
      validation: ["Validate gas sizing", "Confirm material compatibility", "Confirm packing/sealing system", "Review leakage class feasibility", "Approve traceability dossier"],
    },
    dashboard: { "Bid value": "INR 16.4 Cr", "Proposal turnaround reduction": "44%", "Reusable engineering content": "58%", "Engineering hours saved": "28", "Compliance coverage": "92%", "TBE completion": "90%", "Approval cycle time": "2.0 days", "Proposal risk score": "Medium managed", "Win probability score": "87%" },
    lineItems: [{ item: "Hydrogen Process Control Valve", description: "Hydrogen-compatible high-integrity control valve package", quantity: 10, tag: "HV-H2-3101" }],
    tbe: [
      { lineItemIndex: 0, tag: "Material", responseText: "Hydrogen-compatible materials to be finalized against client material restriction list and pressure-temperature basis." },
      { lineItemIndex: 0, tag: "Trim", responseText: "Control trim selected for gas pressure letdown, rangeability, leakage class, and hydrogen compatibility." },
      { lineItemIndex: 0, tag: "Pressure Class", responseText: "ASME pressure class per project line class and ASME B16.34 review." },
      { lineItemIndex: 0, tag: "Actuator", responseText: "Pneumatic actuator sized for fail action, shutoff pressure, and leakage class requirements." },
      { lineItemIndex: 0, tag: "Accessories", responseText: "Smart positioner and hazardous-area accessory certificates where required." },
      { lineItemIndex: 0, tag: "Testing", responseText: "Pressure test, seat leakage, PMI, and sealing/packing documentation per project requirements." },
      { lineItemIndex: 0, tag: "Inspection", responseText: "Traceability-focused inspection with material certificates and pressure test records." },
      { lineItemIndex: 0, tag: "Documentation", responseText: "Datasheet, GA, MTCs, certificates, test records, sealing notes, and deviation register." },
      { lineItemIndex: 0, tag: "Deviation", responseText: "Final leakage class and material compatibility are subject to complete process and client material requirements." },
      { lineItemIndex: 0, tag: "Engineering Comments", responseText: DISCLAIMER },
    ],
    sections: [
      { title: "Executive Summary", sourceType: SourceType.vault, content: "WinsProposal positions the hydrogen valve package around engineering proposal intelligence: material compatibility capture, leakage-class concern tracking, traceability evidence, preliminary gas sizing awareness, and reusable hydrogen narratives for senior proposal review." },
      { title: "Hydrogen Control Valve System Topology", content: "Section-specific visual basis: hydrogen process source, control valve station, actuator/accessory set, sealing boundary, traceability evidence, safety review, and final engineering validation." },
      { title: "Engineering Basis", content: "Engineering dependency map covers hydrogen composition, pressure/temperature, material restrictions, leakage class, packing/gasket compatibility, hazardous area accessories, test evidence, and final sign-off." },
      { title: "Proposal-Stage Engineering Intelligence", sourceType: SourceType.vault, content: "" },
      { title: "Preliminary Engineering Calculation Summary", content: "" },
      { title: "Compliance Matrix", content: "Compliance matrix includes hydrogen compatibility notes, ASME pressure-temperature awareness, ISA/IEC sizing basis, leakage class evidence, traceability dossier, hazardous area accessories, and documentation readiness." },
      { title: "Risk / Deviations", content: "Risk-deviation tree: material restriction list pending, leakage class feasibility, packing/gasket confirmation, traceability scope, accessory certification, and final engineer validation." },
      { title: "Workflow / Approval", content: "Application Engineer owns hydrogen compatibility review; Senior Proposal Engineer drafts technical response; Compliance Coordinator maps certificates; Engineering Manager reviews high-integrity sealing risk; VP Business Development receives KPI summary." },
      { title: "Executive Dashboard", content: "" },
    ],
  },
  {
    id: "imi-cci-demo-rfp-steam-conditioning",
    filename: "IMI_CCI_STYLE_RFP_Steam_Conditioning_Valve_Package.pdf",
    title: "Steam Conditioning Valve Package",
    customer: "Combined Cycle Power and Utilities Upgrade",
    ownerId: "demo-user-cci-proposal-director",
    bidValue: "INR 24.2 Cr",
    dueDate: "2026-07-03",
    winScore: 91,
    approvalStatus: ApprovalStatus.approved,
    application: "Steam pressure letdown, desuperheating, and temperature control",
    summary: "Steam conditioning valves for pressure letdown and temperature control with desuperheating, noise attenuation, thermal cycling, actuator/accessory requirements, testing, and delivery controls.",
    processConditions: { Fluid: "Superheated steam", "Inlet pressure": "125 barg", "Outlet pressure": "42 barg", "Inlet temperature": "520 C", "Outlet temperature target": "290 C", "Spray water pressure": "70 barg", "Duty": "Startup, bypass, and continuous conditioning cases" },
    requirements: ["Steam pressure letdown and temperature control.", "Desuperheating spray water arrangement.", "Noise attenuation and thermal cycling narrative.", "Actuator/control accessories.", "Inspection/testing and documentation package."],
    compliance: ["ISA 75.01 / IEC 60534", "ASME B16.34", "Project steam conditioning specification", "Project-specific test references"],
    inspection: ["Hydrotest", "Seat leakage", "Functional test", "Spray water arrangement review", "Material certificates", "Witness inspection"],
    delivery: ["Thermal design review before release", "GA and control accessory list after PO", "Critical trim and spray components tracked as long-lead"],
    commercial: ["Spray water station scope to be confirmed", "Noise guarantee requires final process cases and piping data"],
    deviations: ["Final acoustic guarantee requires outlet piping and project noise limit", "Desuperheating performance requires spray water quality and pressure confirmation"],
    reviewPoints: ["Steam pressure letdown regime", "Outlet superheat margin", "Spray water atomization", "Thermal cycling fatigue", "Noise attenuation"],
    intelligence: {
      classification: "Severe-service steam conditioning application with pressure letdown, desuperheating, thermal cycling, noise, and accessory integration risk.",
      configuration: "Indicative package uses steam conditioning valve or pressure letdown control valve with integrated or downstream desuperheating arrangement, severe-service trim, spray water control, pneumatic actuator, positioner, and accessories matched to control philosophy.",
      severeServiceRisk: "High. Steam pressure letdown, high temperature, thermal cycling, noise limits, and desuperheating performance make this a specialized engineering proposal item.",
      cavitationFlashingChoked: "Liquid cavitation is not the main steam valve mode, but choked compressible flow is likely. Spray water valve and nozzle selection require separate liquid review.",
      noiseVibration: "High aerodynamic noise risk due to steam pressure letdown. Low-noise trim, staged pressure reduction, piping review, and project noise-limit confirmation are required.",
      trim: "Recommend severe-service steam trim with staged pressure reduction and noise attenuation. Spray water atomization design requires validated thermal balance and pressure data.",
      actuator: "Actuator selected for steam shutoff, control stability, fail action, and accessory response. Positioner, solenoid, airset, boosters, and limit switches per control philosophy.",
      materials: "High-temperature pressure boundary materials, trim hardfacing, packing, gaskets, bolting, and spray water components require pressure-temperature and thermal cycling review.",
      inspection: "Hydrotest, seat leakage, functional checks, material certificates, dimensional inspection, and spray water component documentation should be included.",
      checklist: ["Validate steam and spray water mass balance", "Confirm outlet temperature and superheat margin", "Run noise prediction", "Review thermal cycling duty", "Confirm spray nozzle/station scope"],
    },
    calculations: {
      inputs: ["Steam P1 125 barg", "Steam P2 42 barg", "Inlet temperature 520 C", "Outlet target 290 C", "Spray water pressure 70 barg"],
      assumptions: ["Steam conditioning is proposal-stage only", "Thermal balance and spray water flow require final process cases", "Noise prediction requires outlet pipe data and project limit"],
      severity: "High severity steam pressure letdown with likely choked-flow, high acoustic energy, and thermal cycling exposure.",
      cvKv: "Indicative Cv/Kv and spray water demand require validated steam flow, pressure, temperature, and heat balance. Not certified final sizing.",
      riskFlags: ["Choked steam flow", "High noise", "Thermal cycling", "Desuperheating performance", "Spray water quality/pressure"],
      standards: ["ISA 75.01 / IEC 60534 for control valve sizing", "ASME B16.34 for pressure-temperature considerations", "Project steam conditioning specification", "API / project-specific test references where relevant"],
      validation: ["Run steam sizing", "Run acoustic prediction", "Validate thermal balance", "Confirm spray nozzle arrangement", "Engineering approval before final offer"],
    },
    dashboard: { "Bid value": "INR 24.2 Cr", "Proposal turnaround reduction": "52%", "Reusable engineering content": "66%", "Engineering hours saved": "35", "Compliance coverage": "95%", "TBE completion": "93%", "Approval cycle time": "1.5 days", "Proposal risk score": "Medium-high managed", "Win probability score": "91%" },
    lineItems: [{ item: "Steam Conditioning Valve", description: "Steam pressure letdown and desuperheating package", quantity: 4, tag: "PCV-SC-4101" }],
    tbe: [
      { lineItemIndex: 0, tag: "Material", responseText: "High-temperature pressure boundary and trim materials subject to ASME B16.34 and thermal cycling review." },
      { lineItemIndex: 0, tag: "Trim", responseText: "Staged severe-service steam trim with noise attenuation; final selection requires validated steam sizing." },
      { lineItemIndex: 0, tag: "Pressure Class", responseText: "ASME class per steam line class and pressure-temperature envelope." },
      { lineItemIndex: 0, tag: "Actuator", responseText: "Pneumatic actuator and accessories selected for fail action, shutoff, and control stability." },
      { lineItemIndex: 0, tag: "Accessories", responseText: "Positioner, airset, solenoid, limit switches, and spray water control accessories per control philosophy." },
      { lineItemIndex: 0, tag: "Testing", responseText: "Hydrotest, seat leakage, functional test, accessory checks, and inspection hold points." },
      { lineItemIndex: 0, tag: "Inspection", responseText: "Material certificates, dimensional checks, pressure test records, and spray water component documentation." },
      { lineItemIndex: 0, tag: "Documentation", responseText: "Datasheet, GA, ITP/QAP, calculation summary, acoustic assumptions, and deviation register." },
      { lineItemIndex: 0, tag: "Deviation", responseText: "Noise guarantee and desuperheating performance require final process cases, outlet piping, and spray water data." },
      { lineItemIndex: 0, tag: "Engineering Comments", responseText: DISCLAIMER },
    ],
    sections: [
      { title: "Executive Summary", sourceType: SourceType.vault, content: "WinsProposal demonstrates how steam conditioning proposal work can be transformed into reusable engineering intelligence: pressure letdown requirements, desuperheating assumptions, noise and thermal risk flags, TBE responses, workflow approval, and management KPI evidence." },
      { title: "Steam Conditioning Arrangement", content: "Section-specific visual basis: superheated steam inlet, pressure letdown trim, spray water injection, downstream temperature control, noise attenuation, thermal cycling review, and inspection evidence." },
      { title: "Engineering Basis", content: "Engineering dependency map covers steam flow cases, pressure and temperature letdown, spray water data, heat balance, noise prediction, thermal cycling, actuator/accessory review, and QA release." },
      { title: "Proposal-Stage Engineering Intelligence", sourceType: SourceType.vault, content: "" },
      { title: "Preliminary Engineering Calculation Summary", content: "" },
      { title: "Compliance Matrix", content: "Compliance matrix covers ISA/IEC sizing awareness, ASME pressure-temperature review, steam conditioning specification, hydrotest, seat leakage, functional testing, material certificates, and deviation closure." },
      { title: "Risk / Deviations", content: "Risk-deviation tree: choked steam flow, high noise, thermal cycling, spray water quality, outlet temperature guarantee, and final engineering validation." },
      { title: "Workflow / Approval", content: "Proposal Director leads response; Valve Application Engineer validates steam conditioning assumptions; Senior Proposal Engineer prepares TBE; Compliance Coordinator closes evidence; Engineering Manager approves risk notes; VP releases offer." },
      { title: "Executive Dashboard", content: "" },
    ],
  },
];

const knowledgeAssets = [
  ["Severe-Service Valve Narrative", "Severe-service valve proposals must distinguish preliminary proposal-stage risk assessment from final validated design. The response should explain why pressure drop, phase change, velocity, noise, vibration, erosion, corrosion, and reliability consequences require qualified engineering review before final sizing."],
  ["Compressor Recycle Valve Response", "For compressor recycle service, emphasize fast dynamic response, anti-surge control philosophy alignment, low-noise severe-service trim, actuator/accessory validation, functional stroke testing, and compressor OEM interface closure."],
  ["Anti-Surge Application Response", "Anti-surge applications require validated stroke time, fail action, solenoid logic, accessory capacity, instrument air basis, and trip-case process conditions. Proposal text should avoid claiming final response performance until engineering validation is complete."],
  ["Cavitation Mitigation Response", "Cavitation mitigation begins with confirmed fluid properties and pressure recovery behavior. Proposal response may recommend multi-stage anti-cavitation trim, hardened surfaces, outlet velocity review, and final ISA/IEC sizing validation."],
  ["Noise Reduction Response", "Noise reduction narratives should connect pressure drop staging, low-noise trim, outlet velocity, acoustic fatigue risk, pipe geometry, and project noise limits. Guarantees require final process cases and validated acoustic calculations."],
  ["Multi-Stage Trim Explanation", "Multi-stage trim distributes pressure drop across controlled stages or flow paths to reduce localized energy release, vibration, erosion, and noise. Final trim model and stage count require company-approved sizing tools."],
  ["Steam Conditioning Narrative", "Steam conditioning proposals should cover pressure letdown, desuperheating, spray water conditions, outlet temperature control, thermal cycling, acoustic risk, actuator stability, and validation of heat balance assumptions."],
  ["Hydrogen Compatibility Narrative", "Hydrogen valve proposals should address material compatibility, embrittlement susceptibility, packing and gasket selection, leakage class feasibility, traceability, process safety, and final engineering validation."],
  ["Material Selection Response", "Material selection must map pressure boundary, trim, packing, bolting, gaskets, sour-service or hydrogen restrictions, corrosion/erosion exposure, and pressure-temperature envelope to project datasheets and standards."],
  ["NACE Sour-Service Compliance", "For NACE MR0175 / ISO 15156 applicability, the proposal should request tag-level sour-service confirmation and provide material evidence only after engineering review of environment, material limits, hardness, and certificate scope."],
  ["Valve Sizing Assumptions", "Proposal-stage sizing notes should list process inputs, assumptions, missing values, pressure drop severity, risk flags, standards awareness, and the statement that the estimate is not certified final sizing."],
  ["Actuator/Accessory Selection", "Actuator and accessory response should consider shutoff pressure, fail action, required stroke time, instrument air, solenoids, boosters, positioner, limit switches, area classification, and functional test scope."],
  ["Inspection and Testing Clauses", "Inspection clauses should cover ITP, QAP, hydrotest, seat leakage, PMI, NDE where required, functional tests, material certificates, witness points, and final dossier requirements."],
  ["QA/QC Documentation", "QA/QC response should list datasheets, GA drawings, ITP, QAP, MTCs, test certificates, calibration certificates, NACE or project compliance evidence, deviation log, and O&M manuals."],
  ["Technical Deviation Examples", "A technical deviation should include clause reference, proposed exception, reason, technical impact, commercial impact, mitigation, engineering owner, client clarification status, and approval decision."],
  ["Client Clarification Examples", "Clarifications should request missing process cases, fluid properties, noise limits, piping geometry, NACE applicability, leakage class basis, fail action, instrument air pressure, and inspection hold point expectations."],
] as const;

async function main() {
  if (process.env.ENABLE_IMI_CCI_DEMO_SEED !== "true") {
    throw new Error("Set ENABLE_IMI_CCI_DEMO_SEED=true to run the IMI CCI-style demo seed. This seed is intentionally opt-in.");
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  await seedOrgAndUsers(passwordHash);
  await seedKnowledgeVault();
  await seedRfpsAndProposals();

  console.log("IMI CCI-style demo seed completed.");
  console.log(`Organization: ${org.name}`);
  console.log(`Demo password for all seeded users: ${DEMO_PASSWORD}`);
}

async function seedOrgAndUsers(passwordHash: string) {
  await prisma.organization.upsert({
    where: { id: org.id },
    update: { name: org.name, brandColor: org.brandColor },
    create: { id: org.id, name: org.name, brandColor: org.brandColor, createdById: users[0][0] },
  });

  for (const [id, name, title, emailPrefix, role] of users) {
    await prisma.user.upsert({
      where: { email: `${emailPrefix}@cci-demo.winsproposal.local` },
      update: { name, role, companyName: `${org.name} - ${title}`, organizationId: org.id },
      create: {
        id,
        email: `${emailPrefix}@cci-demo.winsproposal.local`,
        passwordHash,
        name,
        role,
        companyName: `${org.name} - ${title}`,
        organizationId: org.id,
      },
    });
  }
}

async function seedKnowledgeVault() {
  for (const [index, [title, content]] of knowledgeAssets.entries()) {
    await prisma.vaultTextEntry.upsert({
      where: { id: `imi-cci-demo-vault-entry-${index + 1}` },
      update: {
        title,
        content: `${content}\n\n${DISCLAIMER}`,
        tags: ["imi-cci-style-demo", "severe-service", "engineering-proposal-intelligence", title.toLowerCase().replace(/[^a-z0-9]+/g, "-")],
        industry: Industry.Valves,
      },
      create: {
        id: `imi-cci-demo-vault-entry-${index + 1}`,
        userId: "demo-user-cci-engineering-manager",
        title,
        content: `${content}\n\n${DISCLAIMER}`,
        tags: ["imi-cci-style-demo", "severe-service", "engineering-proposal-intelligence", title.toLowerCase().replace(/[^a-z0-9]+/g, "-")],
        industry: Industry.Valves,
      },
    });
  }

  const documentId = "imi-cci-demo-vault-doc-severe-service-knowledge-pack";
  await prisma.vaultDocument.upsert({
    where: { id: documentId },
    update: {
      filename: "IMI_CCI_STYLE_Severe_Service_Proposal_Knowledge_Pack.pdf",
      fileType: "application/pdf",
      documentType: "Demo Knowledge Pack",
      isPublic: true,
      industry: Industry.Valves,
      tags: ["imi-cci-style-demo", "knowledge-vault", "severe-service"],
      extractedSectionsCount: knowledgeAssets.length,
    },
    create: {
      id: documentId,
      userId: "demo-user-cci-engineering-manager",
      filename: "IMI_CCI_STYLE_Severe_Service_Proposal_Knowledge_Pack.pdf",
      fileType: "application/pdf",
      documentType: "Demo Knowledge Pack",
      isPublic: true,
      industry: Industry.Valves,
      tags: ["imi-cci-style-demo", "knowledge-vault", "severe-service"],
      extractedSectionsCount: knowledgeAssets.length,
    },
  });

  for (const [index, [title, content]] of knowledgeAssets.entries()) {
    await prisma.vaultSection.upsert({
      where: { id: `${documentId}-section-${index + 1}` },
      update: {
        sectionTitle: title,
        content: `${content}\n\n${DISCLAIMER}`,
        sectionType: "imi-cci-style-demo",
        industryTags: ["Valves", "severe-service", "control-valves", "engineering-intelligence"],
      },
      create: {
        id: `${documentId}-section-${index + 1}`,
        documentId,
        sectionTitle: title,
        content: `${content}\n\n${DISCLAIMER}`,
        sectionType: "imi-cci-style-demo",
        industryTags: ["Valves", "severe-service", "control-valves", "engineering-intelligence"],
      },
    });
  }
}

async function seedRfpsAndProposals() {
  for (const seed of rfps) {
    const extractedData = {
      title: seed.title,
      customer: seed.customer,
      industry: "Severe-Service Control Valves / Flow Control",
      businessFocus: ["LNG", "Oil & Gas", "Refinery", "Petrochemical", "Power", "Hydrogen", "Process industries", "Severe-service control valves"],
      bidDueDate: seed.dueDate,
      estimatedBidValue: seed.bidValue,
      application: seed.application,
      summary: seed.summary,
      projectBackground: seed.summary,
      technicalSpecifications: seed.requirements,
      processConditions: seed.processConditions,
      complianceRequirements: seed.compliance,
      inspectionTestingRequirements: seed.inspection,
      deliveryRequirements: seed.delivery,
      commercialAssumptions: seed.commercial,
      possibleDeviations: seed.deviations,
      engineeringReviewPoints: seed.reviewPoints,
      dashboardMetrics: seed.dashboard,
      lineItems: seed.lineItems,
      disclaimer: DISCLAIMER,
    };

    await prisma.rfpUpload.upsert({
      where: { id: seed.id },
      update: { filename: seed.filename, fileType: "application/pdf", isPublic: true, extractedData },
      create: {
        id: seed.id,
        userId: seed.ownerId,
        filename: seed.filename,
        fileType: "application/pdf",
        isPublic: true,
        extractedData,
      },
    });

    await prisma.goNoGoAssessment.upsert({
      where: { rfpId: seed.id },
      update: {
        userId: seed.ownerId,
        totalScore: seed.winScore,
        maxScore: 100,
        recommendation: seed.winScore >= 90 ? "Bid - strategic severe-service fit" : "Bid with engineering validation",
        notes: "IMI CCI-style demo assessment for engineering proposal intelligence. Demo-only account, not an official IMI implementation.",
        responses: {
          strategicFit: "High",
          technicalCapability: "High with qualified engineering validation",
          knowledgeReuse: seed.dashboard["Reusable engineering content"],
          complianceCoverage: seed.dashboard["Compliance coverage"],
          riskPosition: seed.dashboard["Proposal risk score"],
        },
      },
      create: {
        id: `${seed.id}-go-no-go`,
        rfpId: seed.id,
        userId: seed.ownerId,
        totalScore: seed.winScore,
        maxScore: 100,
        recommendation: seed.winScore >= 90 ? "Bid - strategic severe-service fit" : "Bid with engineering validation",
        notes: "IMI CCI-style demo assessment for engineering proposal intelligence. Demo-only account, not an official IMI implementation.",
        responses: {
          strategicFit: "High",
          technicalCapability: "High with qualified engineering validation",
          knowledgeReuse: seed.dashboard["Reusable engineering content"],
          complianceCoverage: seed.dashboard["Compliance coverage"],
          riskPosition: seed.dashboard["Proposal risk score"],
        },
      },
    });

    const proposalId = seed.id.replace("rfp", "proposal");
    await prisma.proposal.upsert({
      where: { id: proposalId },
      update: {
        title: `IMI CCI-Style Demo Proposal - ${seed.title}`,
        status: ProposalStatus.Final,
        industry: Industry.Valves,
        templateType: "Valves",
        vaultSectionsUsed: 4,
        vaultDocumentsUsed: 1,
        winScore: seed.winScore,
        companySize: CompanySize.enterprise,
        approvalStatus: seed.approvalStatus,
        approvedById: seed.approvalStatus === ApprovalStatus.approved ? "demo-user-cci-engineering-manager" : null,
        approvedAt: seed.approvalStatus === ApprovalStatus.approved ? new Date("2026-05-29T09:30:00.000Z") : null,
      },
      create: {
        id: proposalId,
        userId: seed.ownerId,
        rfpId: seed.id,
        title: `IMI CCI-Style Demo Proposal - ${seed.title}`,
        status: ProposalStatus.Final,
        industry: Industry.Valves,
        templateType: "Valves",
        vaultSectionsUsed: 4,
        vaultDocumentsUsed: 1,
        winScore: seed.winScore,
        companySize: CompanySize.enterprise,
        approvalStatus: seed.approvalStatus,
        approvedById: seed.approvalStatus === ApprovalStatus.approved ? "demo-user-cci-engineering-manager" : null,
        approvedAt: seed.approvalStatus === ApprovalStatus.approved ? new Date("2026-05-29T09:30:00.000Z") : null,
      },
    });

    const dashboardContent = [
      "Executive KPI dashboard for the dedicated IMI CCI-style demo account.",
      "",
      table(Object.entries(seed.dashboard) as Array<[string, string]>),
      "",
      "Improvement framing: 40-60% proposal turnaround reduction, 50-70% reusable engineering content, 25-40 engineering hours saved per complex bid, 90%+ compliance coverage, and faster approval workflow.",
    ].join("\n");

    const filledSections = seed.sections.map((section) => {
      if (section.title === "Proposal-Stage Engineering Intelligence") return { ...section, content: engineeringContent(seed) };
      if (section.title === "Preliminary Engineering Calculation Summary") return { ...section, content: calculationContent(seed) };
      if (section.title === "Executive Dashboard") return { ...section, content: dashboardContent };
      return section;
    });

    for (const [orderIndex, section] of filledSections.entries()) {
      await prisma.proposalSection.upsert({
        where: { id: `${proposalId}-section-${orderIndex + 1}` },
        update: {
          sectionTitle: section.title,
          content: section.content,
          sourceType: section.sourceType ?? SourceType.generated,
          orderIndex,
        },
        create: {
          id: `${proposalId}-section-${orderIndex + 1}`,
          proposalId,
          sectionTitle: section.title,
          content: section.content,
          sourceType: section.sourceType ?? SourceType.generated,
          orderIndex,
        },
      });
    }

    await prisma.complianceChecklist.upsert({
      where: { proposalId },
      update: {
        checklistItems: [
          ...seed.compliance.map((standard, index) => ({ id: `std-${index + 1}`, label: `${standard} mapped`, standard, checked: true })),
          { id: "disclaimer", label: "Preliminary engineering disclaimer included", standard: "Demo safety", checked: true },
          { id: "final-validation", label: "Final sizing/design marked for qualified engineer validation", standard: "Engineering governance", checked: true },
          { id: "deviations", label: "Deviation and clarification register populated", standard: "Proposal control", checked: true },
        ],
      },
      create: {
        id: `${proposalId}-compliance`,
        proposalId,
        checklistItems: [
          ...seed.compliance.map((standard, index) => ({ id: `std-${index + 1}`, label: `${standard} mapped`, standard, checked: true })),
          { id: "disclaimer", label: "Preliminary engineering disclaimer included", standard: "Demo safety", checked: true },
          { id: "final-validation", label: "Final sizing/design marked for qualified engineer validation", standard: "Engineering governance", checked: true },
          { id: "deviations", label: "Deviation and clarification register populated", standard: "Proposal control", checked: true },
        ],
      },
    });

    for (const item of seed.tbe) {
      await prisma.tbeResponse.upsert({
        where: { rfpId_lineItemIndex_tag: { rfpId: seed.id, lineItemIndex: item.lineItemIndex, tag: item.tag } },
        update: { responseText: item.responseText },
        create: {
          id: `${seed.id}-tbe-${item.lineItemIndex}-${item.tag.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          rfpId: seed.id,
          lineItemIndex: item.lineItemIndex,
          tag: item.tag,
          responseText: item.responseText,
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
