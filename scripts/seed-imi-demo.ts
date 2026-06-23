/**
 * Severe-Service Control Valve Demo Seed Data (IMI-style OEM reference)
 *
 * Usage: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/seed-imi-demo.ts
 *
 * This script populates the Knowledge Vault with demo content for a
 * severe-service control valve proposal demonstration using IMI-style
 * severe-service valve OEM reference data. All entries are synthetic
 * demo content created for proposal-demo purposes only — no confidential
 * IMI proprietary data is included unless explicitly uploaded by the
 * customer under NDA. WinsProposal is the proposal intelligence platform,
 * not the valve OEM.
 *
 * The entries are created under a specified demo user email.
 */

import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";

const prisma = new PrismaClient();

const DEMO_USER_EMAIL = process.env.DEMO_USER_EMAIL || "demo@winsproposal.com";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

const demoEntries = [
  {
    title: "IMI Severe-Service Control Valve Datasheet - PCV-101",
    documentType: "Severe Service Datasheet",
    content: `Tag: PCV-101
Service: Hydrogen compressor discharge pressure control
Valve Type: Severe-service control valve (globe pattern)
Size: 6" x 4"
Pressure Class: ANSI 600
Body Material: ASTM A216 WCB (NACE MR0175 compliant)
Trim Material: 316 SS with Stellite overlay
Seat Leakage Class: Class V (metal seated)
Actuator: Pneumatic diaphragm actuator with positioner
Accessories: I/P positioner, limit switches, solenoid valve, air filter regulator
Fail Action: Fail-closed (FC)
Process Fluid: Hydrogen gas
Inlet Pressure: 85 barg
Outlet Pressure: 55 barg
Operating Temperature: 45°C
Design Standard: ISA 75.01 / IEC 60534
Testing: API 598 hydrotest and seat leakage test
Documentation: MDR with material certificates, test records, and calibration certificates`,
    tags: ["imi", "severe-service", "control-valve", "hydrogen", "datasheet", "PCV-101"],
    industry: "Valves",
  },
  {
    title: "IMI Severe-Service Control Valve Datasheet - PCV-102",
    documentType: "Severe Service Datasheet",
    content: `Tag: PCV-102
Service: Hydrogen recycle control (anti-surge)
Valve Type: Angle pattern severe-service control valve
Size: 8" x 6"
Pressure Class: ANSI 600
Body Material: ASTM A352 LCC
Trim Material: 316 SS with hardfacing
Seat Leakage Class: Class IV
Actuator: Electro-hydraulic actuator
Accessories: Smart positioner, solenoid valve, speed control valve
Fail Action: Fail-as-is (FAI)
Process Fluid: Hydrogen gas
Inlet Pressure: 70 barg
Outlet Pressure: 30 barg
Operating Temperature: 50°C
Special Features: Fast response for anti-surge protection (stroke time < 2 seconds)
Design Standard: ISA 75.01 / IEC 60534, API 6D
Testing: API 598 hydrotest, seat leakage, response time test`,
    tags: ["imi", "severe-service", "anti-surge", "hydrogen", "datasheet", "PCV-102"],
    industry: "Valves",
  },
  {
    title: "IMI Severe-Service Control Valve Datasheet - PCV-103",
    documentType: "Severe Service Datasheet",
    content: `Tag: PCV-103
Service: Export header pressure control
Valve Type: Severe-service globe control valve
Size: 10" x 8"
Pressure Class: ANSI 300
Body Material: ASTM A216 WCB
Trim Material: 316 SS with Stellite 6 overlay
Seat Leakage Class: Class V
Actuator: Pneumatic diaphragm actuator
Accessories: I/P positioner, limit switches, solenoid valve
Fail Action: Fail-open (FO)
Process Fluid: Hydrogen gas
Inlet Pressure: 60 barg
Outlet Pressure: 40 barg
Operating Temperature: 40°C
Design Standard: ISA 75.01 / IEC 60534
Noise Attenuation: Low-noise trim for noise < 85 dBA at 1m
Testing: API 598 hydrotest, seat leakage test, noise measurement`,
    tags: ["imi", "severe-service", "export-header", "hydrogen", "datasheet", "PCV-103"],
    industry: "Valves",
  },
  {
    title: "Hydrogen Compression RFQ Sample - Technical Requirements",
    documentType: "RFQ / Tender Document",
    content: `Project: Hydrogen Compression and Export Facility - Phase II
Client: Refinery & Petrochemical Complex
Location: India
Bid Due Date: 45 days from RFQ issue

SCOPE OF SUPPLY:
- 4 severe-service control valves for hydrogen service
- Electro-hydraulic actuators for anti-surge applications
- Smart positioners with HART communication
- Material traceability per EN 10204 3.2
- Complete MDR including material certificates, inspection records, and test reports

TECHNICAL REQUIREMENTS:
- Valves must comply with ISA 75.01 / IEC 60534 for sizing
- Pressure-temperature ratings per ASME B16.34
- NACE MR0175 / ISO 15156 compliance for sour service materials
- Fugitive emissions per ISO 15848-1 Class BH
- Fire-safe design per API 607 / ISO 10497
- SIL 2 capable actuator/positioner assembly per IEC 61508

COMMERCIAL REQUIREMENTS:
- FOB delivery basis
- Payment: 20% advance, 50% against inspection, 30% against shipping
- Warranty: 24 months from dispatch or 18 months from commissioning
- LD: 0.5% per week up to 5% of order value

DOCUMENTATION:
- Datasheets and GA drawings within 4 weeks of PO
- MDR/final documentation with dispatch
- Third-party inspection by TUV/Lloyd's`,
    tags: ["rfq", "hydrogen", "compression", "severe-service", "technical-requirements"],
    industry: "Valves",
  },
  {
    title: "Past Proposal - Hydrogen Control Valve Package (Reference)",
    documentType: "Past Proposal",
    content: `PROJECT: Hydrogen Compression Facility - Phase I
CLIENT: Major Indian Refinery
SCOPE: 6 severe-service control valves for hydrogen service
VALUE: INR 85,00,000 (approx.)
YEAR: 2024

WIN THEMES:
1. Demonstrated hydrogen application experience with material compatibility documentation
2. Fast-track delivery commitment (10 weeks vs market 14 weeks)
3. Comprehensive MDR package with full traceability
4. NACE MR0175 compliance for all wetted parts
5. ISO 15848-1 fugitive emissions certification

PROPOSAL STRUCTURE:
- Section 1: Executive Summary with project understanding
- Section 2: Technical compliance matrix mapping each RFP clause
- Section 3: Valve datasheets by tag with process conditions
- Section 4: Actuator and accessory specifications
- Section 5: Material traceability plan
- Section 6: ITP and QA/QC plan
- Section 7: Project schedule and delivery milestones
- Section 8: Commercial summary with pricing breakdown
- Section 9: Deviations and clarifications register

OUTCOME: Won. Delivery completed on schedule with zero NCRs.

KEY LESSONS:
- Early engagement with engineering team reduced clarification cycle
- Pre-approved material sources sped up MDR compilation
- Standardized TBE templates reduced proposal effort by 40%`,
    tags: ["past-proposal", "hydrogen", "control-valve", "win-reference", "templates"],
    industry: "Valves",
  },
  {
    title: "Compliance Matrix Template - Severe Service Control Valves",
    documentType: "Compliance Matrix",
    content: `| Clause / Requirement | Standard / Spec | Compliance Status | Evidence Reference | Deviation | Owner |
|---|---|---|---|---|---|
| Control valve sizing | ISA 75.01 / IEC 60534 | Compliant | Sizing calculation sheet | None | Engineering |
| Pressure-temperature rating | ASME B16.34 | Compliant | Datasheet line item | None | Engineering |
| Material compliance (sour service) | NACE MR0175 / ISO 15156 | Compliant | Material certificate | None | QA/QC |
| Fugitive emissions | ISO 15848-1 Class BH | Compliant | Type test certificate | None | QA/QC |
| Fire-safe design | API 607 / ISO 10497 | Compliant | Design verification | None | Engineering |
| SIL capability | IEC 61508 (SIL 2) | Compliant | Certificate | None | Engineering |
| Hydrostatic testing | API 598 | Compliant | Test record | None | QA/QC |
| Seat leakage test | API 598 / FCI 70-2 | Compliant | Test record | None | QA/QC |
| Material traceability | EN 10204 3.2 | Compliant | MTC bundle | None | QA/QC |
| Painting and coating | SSPC-SP6 + epoxy | Compliant | Coating certificate | None | Manufacturing |
| NDE/PMI requirements | Project specification | Review | PMI report pending | PMI scope not finalized | QA/QC |
| MDR/data book compilation | Project specification | In progress | Document register | None | Documentation |
| Delivery schedule | Project milestone | On track | Project schedule | None | Project Management |

NOTES:
- All compliance evidence to be compiled in MDR section 4 (Compliance Evidence)
- Deviations require customer approval before final submission
- Third-party inspection (TUV) to witness hydrotest and seat leakage test`,
    tags: ["compliance-matrix", "template", "severe-service", "control-valve", "tbe"],
    industry: "Valves",
  },
  {
    title: "Delivery Schedule - IMI Severe-Service Control Valve Package",
    documentType: "Delivery Schedule",
    content: `PROJECT: Hydrogen Compression and Export Facility
PACKAGE: Severe-Service Control Valve Package (4 valves)

| Milestone | Duration from PO | Dependencies | Responsible |
|---|---|---|---|
| Drawing submission | 4 weeks | Final process data, tag details | Engineering |
| GA and datasheet approval | 2 weeks | Customer review cycle | Customer / Engineering |
| Engineering validation | 2 weeks | Approved drawings, final sizing | Engineering |
| Long-lead material procurement | 6-8 weeks | PO placement | Procurement |
| Manufacturing: Body casting | 4-6 weeks | Material availability | Manufacturing |
| Manufacturing: Machining | 3-4 weeks | Casting inspection | Manufacturing |
| Manufacturing: Assembly | 2 weeks | All components available | Manufacturing |
| Inspection and Testing: Hydrotest | 1 week | Assembly complete | QA/QC |
| Inspection and Testing: Seat leakage | 3 days | Hydrotest pass | QA/QC |
| Inspection and Testing: Functional | 2 days | Seat leakage pass | QA/QC |
| Inspection and Testing: PMI/NDE | 3 days | - | QA/QC |
| Painting and coating | 1 week | Test clearance | Manufacturing |
| Documentation / MDR compilation | 2 weeks | Throughout project | Documentation |
| Final inspection / release | 3 days | All milestones complete | QA/QC |
| Dispatch | 1 week | Release note | Logistics |

TOTAL LEAD TIME: 14-16 weeks from PO
CRITICAL PATH: Body casting → machining → hydrotest → dispatch
RISK ITEMS:
- Long-lead trims (Stellite overlay): order immediately
- Third-party inspection scheduling: book at PO placement
- MDR compilation: start document collection from day 1`,
    tags: ["delivery-schedule", "timeline", "severe-service", "project-plan"],
    industry: "Valves",
  },
  {
    title: "ISO 9001:2015 Certificate Reference - Quality Management",
    documentType: "ISO Certificate",
    content: `CERTIFICATE REFERENCE: A sample ISO 9001:2015 quality management system certificate.
This entry serves as a placeholder to demonstrate Knowledge Vault certificate storage.

Typical certificate information stored in vault:
- Certificate type: ISO 9001:2015 / ISO 14001:2015 / OHSAS 18001
- Issuing body: TUV / DNV / BSI / Lloyd's Register
- Scope: Design, manufacture, and testing of industrial valves
- Validity period: 3 years from issue date with annual surveillance audits
- Certificate number: Refer to uploaded certificate document

Note: This is a text reference entry. The actual certificate PDF should be uploaded as a document.`,
    tags: ["iso", "certificate", "quality", "reference"],
    industry: "Valves",
  },
  {
    title: "Case Study - Severe-Service Control Valve Replacement Project",
    documentType: "Case Study",
    content: `CLIENT: Major Indian Refinery
LOCATION: Western India
APPLICATION: Refinery severe-service letdown
VALVES: 3 x severe-service angle control valves
SERVICE: High-pressure drop hydrocarbon letdown
INLET PRESSURE: 120 barg
OUTLET PRESSURE: 25 barg
TEMPERATURE: 350°C
FLUID: Hydrocarbon with catalyst fines

CHALLENGE:
Existing valves experienced severe erosion after 6 months due to flashing and catalyst fines in the fluid. The client needed a replacement with:
1. Erosion-resistant trim design
2. Cavitation/flashing mitigation
3. Minimum 24-month service life before trim replacement
4. Quick delivery to minimize plant downtime

SOLUTION:
The proposed severe-service valve package included:
- Tungsten carbide trim for erosion resistance
- Multi-stage pressure letdown trim to eliminate cavitation
- Stellite 6 overlay on seat and body contact areas
- Hardfaced cladding on body internal surfaces
- Flush connections for online maintenance

RESULTS:
- 28 months of continuous service before first trim inspection
- Zero unplanned shutdowns due to valve failure
- 60% reduction in maintenance cost compared to previous valves
- Client ordered additional 5 valves for similar services

KEY TAKEAWAYS:
- Application-specific trim design is critical for severe-service longevity
- Early engagement with process team identifies failure modes before proposal stage
- Case study evidence in Knowledge Vault strengthens proposal credibility`,
    tags: ["case-study", "severe-service", "refinery", "erosion", "letdown", "reference"],
    industry: "Valves",
  },
  {
    title: "Standard Deviation / Exception Register Template",
    documentType: "Deviation / Exception List",
    content: `PROJECT: Hydrogen Compression and Export Facility
CUSTOMER: Refinery & Petrochemical Complex
PACKAGE: Severe-Service Control Valves

| # | RFP Clause | Requirement | Our Position | Deviation Type | Customer Approval |
|---|---|---|---|---|---|
| 1 | Material: ASTM A182 F316 | Requested for trim | Offering 316 SS with Stellite 6 hardfacing for erosion resistance | Technical improvement | Pending |
| 2 | Actuator: Pneumatic | Requested | Electro-hydraulic for anti-surge valves for faster stroke time | Technical improvement | Pending |
| 3 | Documentation: Hard copy sets | 3 hard copy MDR sets | Offering 2 hard copy + 1 digital copy | Minor deviation | Pending |
| 4 | Delivery: 12 weeks | Requested | Offering 14-16 weeks due to long-lead specialty materials | Commercial deviation | Pending |
| 5 | Warranty: 36 months | Requested | Standard 24 months; 36 months available at premium | Commercial deviation | Pending |

NOTES:
- Technical improvements should be framed as value-add, not non-compliance
- All commercial deviations require management approval before submission
- Track customer approval status in proposal review meetings
- Document assumptions and clarifications separately`,
    tags: ["deviation", "exception", "clarification", "register", "template"],
    industry: "Valves",
  },
];

async function seed() {
  console.log(`Seeding IMI demo data for user: ${DEMO_USER_EMAIL}`);

  // Find or create demo user
  let user = await prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
  if (!user) {
    console.log("Demo user not found. Creating...");
    user = await prisma.user.create({
      data: {
        email: DEMO_USER_EMAIL,
        passwordHash: hashPassword("demo123"),
        name: "IMI Demo User",
        role: "admin",
        companyName: "Severe-Service Valve OEM Demo",
      },
    });
    console.log(`Created demo user: ${user.id}`);
  } else {
    console.log(`Found existing demo user: ${user.id}`);
  }

  // Clear existing entries for this user to allow re-seeding
  const existingCount = await prisma.vaultTextEntry.count({ where: { userId: user.id } });
  if (existingCount > 0) {
    console.log(`Removing ${existingCount} existing text entries for demo user...`);
    await prisma.vaultTextEntry.deleteMany({ where: { userId: user.id } });
  }

  // Create each entry
  for (const entry of demoEntries) {
    const created = await prisma.vaultTextEntry.create({
      data: {
        userId: user.id,
        title: entry.title,
        content: entry.content,
        documentType: entry.documentType,
        tags: entry.tags,
        industry: entry.industry as any,
      },
    });
    console.log(`  Created: ${created.title} (ID: ${created.id})`);
  }

  console.log(`\nDone! Created ${demoEntries.length} text entries for IMI demo.`);
  console.log("These entries are now available for proposal generation retrieval.");
}

seed()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
