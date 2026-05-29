import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const outDir = path.resolve("demo-assets/imi-cci-rfps");
const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const disclaimer =
  "Demo-safe fictional RFP package created for WinsProposal. Customer names are fictional industry-style accounts and do not represent official documents, endorsements, trademarks, or partnerships.";

const rfps = [
  {
    file: "IMI_CCI_STYLE_RFP_LNG_Compressor_Recycle_Valve_Package",
    title: "LNG Compressor Recycle Valve Package",
    customer: "Aurora Gulf LNG Export Terminal",
    industry: "LNG / Gas Processing",
    project: "Train 4 Reliability and Anti-Surge Modernization",
    issueDate: "29 May 2026",
    dueDate: "19 June 2026",
    bidValue: "Estimated package value: INR 28.5 Cr",
    buyerProfile:
      "Aurora Gulf LNG Export Terminal is a fictional global LNG operator profile used to represent a mature, high-reliability process owner with rigorous engineering, documentation, and inspection expectations.",
    background:
      "The project covers replacement and upgrade of compressor recycle / anti-surge control valves serving LNG refrigerant and feed-gas compression systems. The package is safety and availability critical. The purchaser requires a technically compliant proposal that demonstrates severe-service application understanding, fast response capability, acoustic risk awareness, actuator/accessory readiness, and clear inspection deliverables.",
    scope: [
      "Design, manufacture, test, document, preserve, and deliver severe-service compressor recycle control valves.",
      "Provide actuator and control accessory packages suitable for anti-surge service.",
      "Provide preliminary valve sizing basis, severe-service risk narrative, acoustic/noise assumptions, and engineering validation checklist.",
      "Provide compliance matrix and technical bid evaluation responses by line item.",
      "Provide QA/QC documentation, test certificates, inspection records, and final manufacturing data book.",
    ],
    lineItems: [
      ["XV-CRV-9101A/B/C", "Compressor recycle control valve", "3", "NPS 10 x 12, ASME 900", "Fast-acting gas recycle, high pressure drop"],
      ["ASP-9101A/B/C", "Anti-surge accessory package", "3", "Pneumatic accessories", "Positioner, solenoids, boosters, limit switches, airset"],
      ["DOC-9101", "Engineering and QA dossier", "1 lot", "MDR package", "Datasheets, calculations summary, ITP, QAP, certificates"],
    ],
    process: [
      ["Fluid", "Natural gas rich LNG process gas"],
      ["Inlet pressure", "92 barg normal, 108 barg design"],
      ["Outlet pressure", "34 barg normal"],
      ["Temperature", "-28 C to 45 C"],
      ["Flow cases", "Normal recycle, startup bypass, compressor trip"],
      ["Required response", "Fast stroke for anti-surge duty; supplier to state assumptions"],
      ["Leakage class", "Class IV minimum; tighter class subject to final engineering review"],
    ],
    technical: [
      "Valve shall be suitable for severe-service gas pressure letdown with potential choked-flow and high aerodynamic noise.",
      "Supplier shall propose multi-stage or multi-path severe-service trim where required by final validated sizing.",
      "Supplier shall identify outlet velocity, acoustic fatigue, trim exit velocity, and vibration risk assumptions.",
      "Actuator shall be sized for fail action, trip condition, shutoff pressure, instrument air pressure, and response requirements.",
      "Accessory package shall include smart positioner, solenoid arrangement, airset, limit switches, tubing, and boosters or quick exhaust devices where validated.",
      "Supplier shall clearly separate proposal-stage indicative engineering from final certified sizing/design.",
    ],
    compliance: [
      "ISA 75.01 / IEC 60534 awareness for control valve sizing.",
      "ASME B16.34 for pressure-temperature considerations.",
      "Project anti-surge control philosophy and compressor OEM interface requirements.",
      "Project noise specification and acoustic fatigue review requirements.",
      "Client inspection and manufacturing data record requirements.",
    ],
    inspection: [
      "Hydrostatic shell test.",
      "Seat leakage test.",
      "Functional stroke test with actuator/accessory package.",
      "Accessory loop check and fail-action demonstration.",
      "PMI for pressure-retaining components.",
      "Client witness points for pressure test, functional test, and final inspection.",
    ],
    deviations: [
      "Final acoustic guarantee requires confirmed flow cases, gas composition, pipe geometry, and project noise limit.",
      "Final Cv/Kv, trim model, and stage count require company-approved sizing tools.",
      "Final actuator response claim requires confirmed instrument air pressure and anti-surge control philosophy.",
    ],
    tbe: [
      ["Material", "Pressure boundary material shall match LNG low-temperature line class and ASME pressure-temperature basis."],
      ["Trim", "Severe-service multi-stage low-noise trim expected; final selection by validated sizing."],
      ["Actuator", "Fast-response pneumatic actuator; supplier to define response assumptions."],
      ["Accessories", "Smart positioner, solenoids, limit switches, booster/quick exhaust if required."],
      ["Testing", "Hydrotest, seat leakage, functional stroke, accessory loop check, witness inspection."],
      ["Documentation", "Datasheet, GA, ITP, QAP, MTCs, test certificates, deviation register, O&M manual."],
    ],
    evaluation: [
      ["Technical compliance", "40%"],
      ["Severe-service application understanding", "20%"],
      ["Delivery and inspection readiness", "15%"],
      ["Documentation quality", "10%"],
      ["Commercial value", "15%"],
    ],
    review: [
      "Confirm compressor anti-surge response requirement and trip cases.",
      "Confirm gas composition, molecular weight, compressibility, and maximum/minimum temperatures.",
      "Confirm outlet pipe geometry, allowable sound pressure level, and acoustic fatigue criteria.",
      "Confirm fail action, instrument air pressure, and solenoid logic.",
      "Confirm whether final proposal requires guaranteed noise or response time.",
    ],
  },
  {
    file: "IMI_CCI_STYLE_RFP_Refinery_Severe_Service_Control_Valve_Package",
    title: "Refinery Severe-Service Control Valve Package",
    customer: "NorthStar Refining and Petrochemicals Complex",
    industry: "Refinery / Petrochemical",
    project: "Resid Hydroprocessing Unit Control Valve Replacement",
    issueDate: "29 May 2026",
    dueDate: "24 June 2026",
    bidValue: "Estimated package value: INR 21.8 Cr",
    buyerProfile:
      "NorthStar Refining and Petrochemicals Complex is a fictional refinery major profile used to represent a sophisticated process owner with strong QA/QC, NACE, inspection, and technical bid evaluation expectations.",
    background:
      "The purchaser seeks severe-service control valves for high differential pressure refinery liquid services with potential cavitation, flashing, erosion, corrosion, and sour-service exposure. The package must include a strong proposal-stage engineering narrative, material compatibility notes, deviation handling, and a complete inspection/testing plan.",
    scope: [
      "Supply severe-service refinery control valves with tag-wise technical compliance.",
      "Provide cavitation/flashing/choked-flow narrative and preliminary engineering review checklist.",
      "Provide NACE MR0175 / ISO 15156 applicability matrix by tag where sour service is confirmed.",
      "Provide QA/QC, hydrotest, PMI, material certificate, and deviation register documentation.",
      "Support technical bid evaluation with material, trim, pressure class, actuator, testing, inspection, and engineering comments.",
    ],
    lineItems: [
      ["FV-RFU-2201A/B", "High-dP refinery letdown control valve", "2", "NPS 6, ASME 600", "Potential cavitation"],
      ["LV-RFU-2240A/B/C", "Sour hydrocarbon level control valve", "3", "NPS 4, ASME 600", "NACE applicability to be confirmed"],
      ["PV-RFU-2288", "Flashing service pressure control valve", "1", "NPS 3, ASME 900", "Flashing/erosion risk"],
      ["DOC-RFU", "QA/QC and engineering dossier", "1 lot", "MDR package", "Compliance, deviations, ITP, certificates"],
    ],
    process: [
      ["Fluid", "Sour hydrocarbon / refinery process liquid"],
      ["Inlet pressure", "76 barg"],
      ["Outlet pressure", "22 barg"],
      ["Temperature", "180 C"],
      ["Vapor pressure", "To be confirmed by supplier clarification"],
      ["Service concerns", "Cavitation, flashing, erosion/corrosion, sour-service material restrictions"],
      ["Leakage class", "Class IV/V by tag"],
    ],
    technical: [
      "Supplier shall classify each tag for cavitation, flashing, erosion, corrosion, sour-service, noise, and vibration risk.",
      "Supplier shall recommend anti-cavitation trim or flashing-resistant configuration where applicable.",
      "Supplier shall identify missing fluid properties required for final sizing and shall not claim certified final Cv/Kv without complete data.",
      "Supplier shall state pressure class, body material, trim material, hardfacing, packing, bolting, and NACE assumptions.",
      "Supplier shall include deviation handling for material substitutions, trim alternatives, testing exceptions, and documentation assumptions.",
      "Supplier shall include engineering validation checklist for final sizing, material selection, leakage class, and inspection scope.",
    ],
    compliance: [
      "ISA 75.01 / IEC 60534 for control valve sizing awareness.",
      "NACE MR0175 / ISO 15156 for sour-service material requirements where applicable.",
      "ASME B16.34 for pressure-temperature considerations.",
      "Project hydrotest, seat leakage, PMI, NDE, and material traceability requirements.",
      "Client QA/QC procedure and manufacturing data record requirements.",
    ],
    inspection: [
      "Hydrostatic shell test and seat leakage test.",
      "PMI for pressure-retaining and trim components where specified.",
      "NDE per line class or project inspection category.",
      "MTC review and traceability verification.",
      "Client witness point for hydrotest and final inspection.",
      "Final data book with approved deviation register.",
    ],
    deviations: [
      "Vapor pressure and fluid properties are incomplete for final cavitation/flashing validation.",
      "Sour-service tag list and NACE environmental limits require client confirmation.",
      "Hardfacing and exotic metallurgy shall be priced subject to validated erosion/corrosion basis.",
    ],
    tbe: [
      ["Material", "Supplier to map material by tag with NACE note where applicable."],
      ["Trim", "Anti-cavitation or flashing-resistant trim to be proposed based on validated conditions."],
      ["Pressure class", "ASME class to match refinery line class and ASME B16.34 review."],
      ["Actuator", "Actuator sized for shutoff, fail action, leakage class, and site instrument air."],
      ["Testing", "Hydrotest, seat leakage, PMI, NDE where required, and witness points."],
      ["Deviation", "All exceptions to be listed with technical, commercial, and schedule impact."],
    ],
    evaluation: [
      ["Technical compliance", "35%"],
      ["Severe-service risk response", "25%"],
      ["QA/QC and documentation", "15%"],
      ["Delivery", "10%"],
      ["Commercial value", "15%"],
    ],
    review: [
      "Confirm vapor pressure, density, viscosity, critical pressure, and maximum/minimum flow cases.",
      "Confirm NACE sour-service tags, H2S partial pressure, chlorides, pH, and material limits.",
      "Confirm whether service is cavitating, flashing, or clean liquid pressure letdown.",
      "Confirm leakage class by tag and shutoff pressure.",
      "Confirm client acceptance process for technical deviations.",
    ],
  },
  {
    file: "IMI_CCI_STYLE_RFP_Hydrogen_Process_Control_Valve_Package",
    title: "Hydrogen Process Control Valve Package",
    customer: "Helios Green Hydrogen and Ammonia Hub",
    industry: "Hydrogen / Energy Transition",
    project: "Hydrogen Purification and Export Header Control Valve Package",
    issueDate: "29 May 2026",
    dueDate: "28 June 2026",
    bidValue: "Estimated package value: INR 16.4 Cr",
    buyerProfile:
      "Helios Green Hydrogen and Ammonia Hub is a fictional energy-transition owner profile used to represent a renowned-style hydrogen project with strict material compatibility, traceability, safety, and documentation expectations.",
    background:
      "The project requires hydrogen-compatible process control valves for purification, compression interface, and export header control. The purchaser requires evidence-based proposal responses for material compatibility, high-integrity sealing, leakage class, hazardous area accessories, documentation traceability, and engineering validation.",
    scope: [
      "Supply hydrogen-compatible control valves and accessory packages.",
      "Provide material compatibility notes covering pressure boundary, trim, packing, gaskets, bolting, and accessories.",
      "Provide leakage class and high-integrity sealing proposal-stage narrative.",
      "Provide traceability dossier, inspection/testing plan, and compliance matrix.",
      "Provide clarification list for hydrogen composition, contaminants, pressure cases, area classification, and final leakage class.",
    ],
    lineItems: [
      ["HV-H2-3101A/B/C/D", "Hydrogen pressure control valve", "4", "NPS 3, ASME 600", "Hydrogen-rich process gas"],
      ["FV-H2-3150A/B", "Hydrogen flow control valve", "2", "NPS 2, ASME 600", "High-integrity sealing"],
      ["PV-H2-3190", "Export header control valve", "1", "NPS 4, ASME 900", "Pressure letdown/noise review"],
      ["DOC-H2", "Traceability and compliance dossier", "1 lot", "MDR package", "MTC, PMI, leakage, certificates"],
    ],
    process: [
      ["Fluid", "Hydrogen-rich process gas"],
      ["Inlet pressure", "48 barg"],
      ["Outlet pressure", "18 barg"],
      ["Temperature", "60 C"],
      ["Leakage class", "Class V requested for selected tags"],
      ["Service concerns", "Hydrogen compatibility, high-integrity sealing, traceability, process safety"],
      ["Area classification", "Hazardous area certificates required where applicable"],
    ],
    technical: [
      "Supplier shall provide hydrogen compatibility narrative for all wetted and pressure-retaining components.",
      "Supplier shall state assumptions for embrittlement susceptibility, packing, gasket, bolting, and trim material selection.",
      "Supplier shall provide leakage class feasibility comments and identify tags requiring special sealing options.",
      "Supplier shall check gas pressure letdown, outlet velocity, choked-flow risk, and aerodynamic noise assumptions.",
      "Supplier shall provide hazardous area accessory certificate list where positioners, solenoids, or switches are included.",
      "Supplier shall clearly state final design and sizing require qualified engineering validation.",
    ],
    compliance: [
      "ISA 75.01 / IEC 60534 control valve sizing awareness.",
      "ASME B16.34 pressure-temperature considerations.",
      "Project hydrogen material compatibility specification.",
      "Project traceability, hazardous-area accessory, and documentation procedures.",
      "Client process safety and reliability requirements.",
    ],
    inspection: [
      "Pressure test per project basis.",
      "Seat leakage test by tag.",
      "PMI and material traceability verification.",
      "Packing/sealing documentation review.",
      "Accessory certificate review.",
      "Final traceability dossier.",
    ],
    deviations: [
      "Final material compatibility requires client material restriction list and hydrogen purity/contaminant data.",
      "Final leakage class claim requires confirmed shutoff pressure, temperature, trim design, and acceptance criteria.",
      "Noise guarantee requires final flow cases and outlet piping details.",
    ],
    tbe: [
      ["Material", "Hydrogen-compatible material note required for all wetted components."],
      ["Trim", "Trim to balance pressure letdown, leakage class, and hydrogen compatibility."],
      ["Sealing", "High-integrity packing/gasket proposal required by tag."],
      ["Actuator", "Actuator sized for fail action, shutoff pressure, leakage class, and safety requirements."],
      ["Accessories", "Hazardous-area certificates required for positioner, solenoid, and switches."],
      ["Documentation", "Traceability dossier, MTCs, PMI, leakage evidence, and certificates."],
    ],
    evaluation: [
      ["Hydrogen compatibility", "30%"],
      ["Technical compliance", "25%"],
      ["Traceability and documentation", "20%"],
      ["Delivery", "10%"],
      ["Commercial value", "15%"],
    ],
    review: [
      "Confirm hydrogen purity, contaminants, moisture, and operating envelope.",
      "Confirm material restriction list and embrittlement screening criteria.",
      "Confirm leakage class by tag and test acceptance standard.",
      "Confirm hazardous area classification and accessory certificate requirements.",
      "Confirm final traceability dossier format.",
    ],
  },
  {
    file: "IMI_CCI_STYLE_RFP_Steam_Conditioning_Valve_Package",
    title: "Steam Conditioning Valve Package",
    customer: "Meridian Combined Cycle Power and Utilities",
    industry: "Power / Utilities",
    project: "Steam Header Pressure Letdown and Desuperheating Upgrade",
    issueDate: "29 May 2026",
    dueDate: "03 July 2026",
    bidValue: "Estimated package value: INR 24.2 Cr",
    buyerProfile:
      "Meridian Combined Cycle Power and Utilities is a fictional power-sector owner profile used to represent a rigorous utility customer with high expectations for thermal performance, noise attenuation, testing, and documentation.",
    background:
      "The purchaser requires steam conditioning valves for pressure letdown and temperature control across startup, bypass, and continuous operation. The package must address desuperheating, spray water conditions, noise attenuation, thermal cycling, actuator/control accessory requirements, and inspection/testing deliverables.",
    scope: [
      "Supply steam conditioning valves and spray water control accessories.",
      "Provide proposal-stage steam sizing, thermal balance assumptions, and noise/thermal cycling risk narrative.",
      "Provide actuator and control accessory selection basis.",
      "Provide compliance matrix, TBE responses, QA/QC plan, and manufacturing data record.",
      "Provide list of engineering clarifications needed for final validated design.",
    ],
    lineItems: [
      ["PCV-SC-4101A/B", "Steam conditioning valve", "2", "NPS 8 x 12, ASME 1500/600", "Pressure letdown and desuperheating"],
      ["TCV-SW-4101A/B", "Spray water control valve", "2", "NPS 2, ASME 900", "Spray water regulation"],
      ["ACC-SC-4101", "Actuator and accessory package", "1 lot", "Pneumatic control", "Positioner, solenoid, airset, switches"],
      ["DOC-SC", "Engineering and QA dossier", "1 lot", "MDR package", "Datasheets, assumptions, ITP, certificates"],
    ],
    process: [
      ["Fluid", "Superheated steam"],
      ["Inlet pressure", "125 barg"],
      ["Outlet pressure", "42 barg"],
      ["Inlet temperature", "520 C"],
      ["Outlet temperature target", "290 C"],
      ["Spray water pressure", "70 barg"],
      ["Duty", "Startup, bypass, and continuous conditioning cases"],
    ],
    technical: [
      "Supplier shall propose severe-service steam pressure letdown trim with staged pressure reduction and noise attenuation.",
      "Supplier shall provide desuperheating narrative including spray water pressure, quality, atomization assumptions, and outlet temperature margin.",
      "Supplier shall identify choked-flow, acoustic fatigue, thermal cycling, vibration, and downstream piping risk assumptions.",
      "Supplier shall provide actuator/accessory basis for control stability, fail action, instrument air, and functional testing.",
      "Supplier shall identify final process data required for certified sizing, thermal balance, and acoustic guarantee.",
      "Supplier shall separate proposal-stage indicative engineering from final validated design.",
    ],
    compliance: [
      "ISA 75.01 / IEC 60534 sizing awareness.",
      "ASME B16.34 pressure-temperature considerations.",
      "Project steam conditioning and noise specifications.",
      "Project inspection, hydrotest, seat leakage, and functional test requirements.",
      "Client manufacturing data record and final documentation procedure.",
    ],
    inspection: [
      "Hydrostatic shell test.",
      "Seat leakage test.",
      "Functional test of actuator/accessory package.",
      "Spray water component inspection.",
      "Material certificates and dimensional inspection.",
      "Client witness points for pressure test and final inspection.",
    ],
    deviations: [
      "Noise guarantee requires final flow cases, outlet pipe geometry, and project noise criteria.",
      "Desuperheating performance requires confirmed spray water pressure, temperature, quality, and control philosophy.",
      "Final Cv/Kv and spray water demand require validated steam sizing and heat balance.",
    ],
    tbe: [
      ["Material", "High-temperature pressure boundary material per ASME and thermal cycling review."],
      ["Trim", "Staged severe-service steam trim with low-noise design basis."],
      ["Spray", "Desuperheating arrangement to be defined by heat balance and spray water data."],
      ["Actuator", "Pneumatic actuator/accessories sized for fail action and stable control."],
      ["Testing", "Hydrotest, seat leakage, functional testing, and witness points."],
      ["Documentation", "Datasheets, GA, assumptions, ITP/QAP, certificates, and deviations."],
    ],
    evaluation: [
      ["Steam conditioning technical response", "30%"],
      ["Noise and thermal risk handling", "20%"],
      ["Compliance and inspection readiness", "20%"],
      ["Delivery", "10%"],
      ["Commercial value", "20%"],
    ],
    review: [
      "Confirm steam flow cases for startup, bypass, and continuous operation.",
      "Confirm spray water pressure, temperature, quality, and turndown.",
      "Confirm outlet temperature target and minimum superheat margin.",
      "Confirm project noise limits and outlet piping geometry.",
      "Confirm actuator fail action and control accessory requirements.",
    ],
  },
];

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function list(items) {
  return `<ul>${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
}

function table(headers, rows) {
  return `<table><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
}

function render(rfp) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${esc(rfp.title)}</title>
  <style>
    @page { size: A4; margin: 18mm 15mm 18mm 15mm; }
    * { box-sizing: border-box; }
    body { font-family: "Segoe UI", Arial, sans-serif; color: #172033; margin: 0; line-height: 1.45; }
    .cover { min-height: 260mm; display: flex; flex-direction: column; justify-content: space-between; }
    .band { background: #0f4c5c; color: white; padding: 24px 28px; border-radius: 10px; }
    .eyebrow { text-transform: uppercase; letter-spacing: 1.5px; font-size: 11px; opacity: .78; font-weight: 700; }
    h1 { font-size: 34px; line-height: 1.12; margin: 14px 0 10px; }
    h2 { color: #0f4c5c; font-size: 20px; margin: 28px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #d7e7eb; }
    h3 { color: #17394a; font-size: 15px; margin: 18px 0 8px; }
    p { margin: 7px 0; }
    .meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 22px; }
    .meta div, .note, .callout { border: 1px solid #cbdde2; border-radius: 8px; padding: 10px 12px; background: #f7fbfc; }
    .label { font-size: 10px; text-transform: uppercase; letter-spacing: .8px; color: #60727a; font-weight: 700; }
    .value { font-size: 13px; font-weight: 700; margin-top: 3px; }
    .note { font-size: 12px; color: #4b5563; margin-top: 16px; }
    .callout { border-left: 5px solid #0f4c5c; margin: 14px 0; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0 16px; font-size: 11.5px; page-break-inside: avoid; }
    th { background: #0f4c5c; color: white; text-align: left; padding: 8px; border: 1px solid #0f4c5c; }
    td { padding: 8px; border: 1px solid #c8d7dc; vertical-align: top; }
    tr:nth-child(even) td { background: #f8fafb; }
    ul { margin: 8px 0 14px 19px; padding: 0; }
    li { margin: 4px 0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .box { border: 1px solid #d1dbe0; border-radius: 8px; padding: 12px; background: #fbfcfd; page-break-inside: avoid; }
    .footer { font-size: 10px; color: #687782; border-top: 1px solid #d8e3e7; padding-top: 10px; }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>
  <section class="cover">
    <div>
      <div class="band">
        <div class="eyebrow">Request for Proposal - Demo Package</div>
        <h1>${esc(rfp.title)}</h1>
        <p>${esc(rfp.project)}</p>
      </div>
      <div class="meta">
        <div><div class="label">Fictional Customer Profile</div><div class="value">${esc(rfp.customer)}</div></div>
        <div><div class="label">Industry</div><div class="value">${esc(rfp.industry)}</div></div>
        <div><div class="label">Issue Date</div><div class="value">${esc(rfp.issueDate)}</div></div>
        <div><div class="label">Bid Due Date</div><div class="value">${esc(rfp.dueDate)}</div></div>
        <div><div class="label">Commercial Context</div><div class="value">${esc(rfp.bidValue)}</div></div>
        <div><div class="label">Package Type</div><div class="value">Severe-service control valve proposal</div></div>
      </div>
      <div class="note">${esc(disclaimer)}</div>
    </div>
    <div class="footer">WinsProposal upload-ready RFP demo asset. Not for engineering procurement or construction use.</div>
  </section>

  <section class="page-break">
    <h2>1. Purchaser Profile and Project Background</h2>
    <p>${esc(rfp.buyerProfile)}</p>
    <p>${esc(rfp.background)}</p>
    <div class="callout"><strong>Proposal expectation:</strong> Supplier response shall show engineering proposal intelligence: extracted requirements, compliance/TBE readiness, severe-service risk recognition, knowledge reuse, deviations, review owners, and management-ready documentation.</div>

    <h2>2. Scope of Supply</h2>
    ${list(rfp.scope)}

    <h2>3. Line Items</h2>
    ${table(["Tag / Ref.", "Item", "Qty", "Indicative Size / Class", "Service Notes"], rfp.lineItems)}

    <h2>4. Process Conditions</h2>
    ${table(["Input", "Requirement / Value"], rfp.process)}
  </section>

  <section class="page-break">
    <h2>5. Technical Specification</h2>
    ${list(rfp.technical)}

    <h2>6. Compliance Requirements</h2>
    ${list(rfp.compliance)}

    <h2>7. Inspection and Testing Requirements</h2>
    ${list(rfp.inspection)}

    <h2>8. Required Proposal-Stage Engineering Intelligence</h2>
    <div class="grid">
      <div class="box">
        <h3>Engineering Narrative Required</h3>
        ${list([
          "Extract process conditions and classify application/service.",
          "Provide preliminary valve configuration narrative.",
          "Provide severe-service risk assessment.",
          "Provide cavitation/flashing/choked-flow narrative where relevant.",
          "Provide noise/vibration risk narrative.",
          "Provide trim, material, actuator, and accessory notes.",
        ])}
      </div>
      <div class="box">
        <h3>Calculation Summary Required</h3>
        ${list([
          "State process inputs and assumptions.",
          "Classify pressure drop severity.",
          "Provide indicative Cv/Kv placeholder only where safe.",
          "List risk flags and missing data.",
          "List validation checklist and standards awareness.",
          "State that final sizing/design requires engineer validation.",
        ])}
      </div>
    </div>
  </section>

  <section class="page-break">
    <h2>9. Technical Bid Evaluation Template</h2>
    ${table(["Evaluation Tag", "Purchaser Requirement"], rfp.tbe)}

    <h2>10. Evaluation Criteria</h2>
    ${table(["Criterion", "Weight"], rfp.evaluation)}

    <h2>11. Possible Deviations and Clarifications</h2>
    ${list(rfp.deviations)}

    <h2>12. Engineering Review Points</h2>
    ${list(rfp.review)}

    <h2>13. Commercial and Delivery Assumptions</h2>
    ${list([
      "Supplier shall state drawing submission lead time, manufacturing lead time, test duration, and shipping readiness.",
      "Supplier shall identify long-lead materials, special trims, actuator accessories, and inspection hold points that may affect schedule.",
      "Supplier shall provide itemized pricing by line item and list optional compliance or testing costs separately.",
      "Supplier shall include a deviation register with technical, commercial, and schedule impact.",
      "Proposal validity shall be not less than 60 days from bid due date.",
    ])}

    <div class="callout"><strong>Mandatory wording:</strong> Any engineering analysis in the supplier proposal shall clearly state: “Preliminary proposal-stage engineering estimate. Final sizing/design must be validated by qualified engineers using company-approved tools and standards.”</div>
  </section>
</body>
</html>`;
}

await mkdir(outDir, { recursive: true });

for (const rfp of rfps) {
  const htmlPath = path.join(outDir, `${rfp.file}.html`);
  const pdfPath = path.join(outDir, `${rfp.file}.pdf`);
  await writeFile(htmlPath, render(rfp), "utf8");
  const result = spawnSync(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    `--print-to-pdf=${pdfPath}`,
    `file:///${htmlPath.replace(/\\/g, "/")}`,
  ], { encoding: "utf8" });

  if (result.status !== 0) {
    throw new Error(`Chrome PDF render failed for ${rfp.file}: ${result.stderr || result.stdout}`);
  }
  console.log(`Created ${pdfPath}`);
}
