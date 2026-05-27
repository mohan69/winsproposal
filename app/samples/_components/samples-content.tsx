"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, ChevronDown, ChevronUp, Database, Shield,
  Zap, Target, Award, ArrowRight, Factory, Gauge, Building,
  GitBranch, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SampleSection {
  title: string;
  content: string;
  sourceType: string;
}

interface SampleProposal {
  id: string;
  title: string;
  industry: string;
  template: string;
  subType: string;
  winScore: number;
  icon: React.ElementType;
  iconColor: string;
  bgGradient: string;
  vaultSections: number;
  vaultDocs: number;
  totalSections: number;
  complianceItems: number;
  complianceChecked: number;
  tbeTags: number;
  goNoGoScore: number;
  goNoGoVerdict: string;
  description: string;
  sections: SampleSection[];
}

const sampleProposals: SampleProposal[] = [
  {
    id: "valve-sample",
    title: "Gate Valve Supply — Aramco GOSP-IV Upgrade",
    industry: "Valves",
    template: "Valve OEM",
    subType: "Gate Valve (ON/OFF)",
    winScore: 87,
    icon: Factory,
    iconColor: "text-blue-600",
    bgGradient: "from-blue-50 to-indigo-50",
    vaultSections: 6,
    vaultDocs: 4,
    totalSections: 10,
    complianceItems: 8,
    complianceChecked: 7,
    tbeTags: 15,
    goNoGoScore: 82,
    goNoGoVerdict: "BID — Strong fit",
    description: "Technical & commercial proposal for API 600 gate valves with ON/OFF-specific depth — actuator torque calculations, fugitive emissions (ISO 15848), fire-safe certification (API 607), SIL rating compliance, and AI-generated process flow diagrams. Generated with Gate Valve sub-type template.",
    sections: [
      {
        title: "Executive Summary",
        content: "We are pleased to submit our technical and commercial proposal for the supply of **API 600 Gate Valves** for the GOSP-IV Gas Oil Separation Plant upgrade project.\n\nWith over 15 years of experience in manufacturing high-performance valves for the oil & gas sector, our company has delivered 5,000+ valves to projects across the Middle East, including previous Aramco facilities.\n\nThis proposal covers the complete scope of supply for 127 gate valves across 4 size ranges (2\"-16\"), fully compliant with ARAMCO Engineering Standards (SAES-L-008) and international codes (API 600, ASME B16.34, NACE MR0175).\n\n**Key Highlights:**\n- Full NACE compliance for sour service\n- Third-party inspection by TUV / Lloyd's Register\n- 12-week delivery from order confirmation\n- 5-year warranty on body and trim\n- Go/No-Go Score: 82/100 — BID recommended",
        sourceType: "vault",
      },
      {
        title: "Technical Specifications",
        content: "**Material Specifications:**\n\n| Parameter | Specification |\n| Body Material | ASTM A216 WCB / A352 LCC |\n| Trim Material | Stellite #6 overlay (13Cr) |\n| Stem Material | AISI 410 (13Cr) |\n| Packing | Graphite with anti-blowout design |\n| Gasket | Spiral wound SS316/Graphite (ASME B16.20) |\n\n**Pressure-Temperature Ratings:**\n\n| Size Range | Class | Max Pressure | Max Temp |\n| 2\"-4\" | 300# | 51.7 bar @ 38°C | 425°C |\n| 6\"-10\" | 300# | 51.7 bar @ 38°C | 425°C |\n| 12\"-16\" | 150# | 19.6 bar @ 38°C | 425°C |\n\n**End Connections:** RF flanged per ASME B16.5\n**Operation:** Handwheel (2\"-6\"), Gear-operated (8\"-16\")\n**Testing:** API 598 hydrostatic shell test + seat test, PMI verification on all wetted parts",
        sourceType: "vault",
      },
      {
        title: "Actuator Specifications (ON/OFF)",
        content: "**Actuator Selection — Gate Valve ON/OFF Service:**\n\nAll gate valves 8\" and above are supplied with pneumatic actuators for remote ON/OFF operation.\n\n**Actuator Details:**\n\n| Parameter | Specification |\n| Type | Double-acting pneumatic (scotch yoke) |\n| Air Supply | 4-7 bar instrument air |\n| Torque Output | 850 Nm @ 6 bar (8\"), 2,400 Nm @ 6 bar (12\"), 4,500 Nm @ 6 bar (16\") |\n| Safety Factor | Minimum 1.5x breakaway torque |\n| Fail-Safe Action | Spring-return to CLOSE (fail-close) |\n| Accessories | Solenoid valve (NAMUR), limit switches (SPDT), IP67 junction box |\n| Handwheel Override | Yes, declutchable manual override |\n\n**Torque Calculation Summary:**\n- 8\" 300# Gate: Breakaway torque 520 Nm, Running torque 380 Nm, Actuator output 850 Nm (SF = 1.63)\n- 12\" 150# Gate: Breakaway torque 1,450 Nm, Running torque 980 Nm, Actuator output 2,400 Nm (SF = 1.65)\n- 16\" 150# Gate: Breakaway torque 2,800 Nm, Running torque 1,950 Nm, Actuator output 4,500 Nm (SF = 1.61)\n\n**Actuator Vendor:** Rotork / AUMA (client approval)\n**Certification:** ATEX Zone 1, SIL2 capable per IEC 61508",
        sourceType: "generated",
      },
      {
        title: "Fugitive Emissions Compliance",
        content: "**Fugitive Emissions Performance — ISO 15848-1:**\n\nAll gate valves in this scope are designed and tested for low fugitive emissions compliance per ISO 15848-1.\n\n**Stem Packing Design:**\n- Packing Type: Low-emission graphite packing with live-loaded Belleville springs\n- Packing Rings: 5-ring configuration with anti-extrusion rings\n- Emission Class: ISO 15848-1 Class BH (≤100 ppmv at 200°C)\n- Test Medium: Helium\n- Endurance: 2,500 mechanical cycles without re-tightening\n\n**Certification:**\n- Type-test certificate per ISO 15848-1 available\n- Individual valve leak test certificate provided\n- Shell test certificate confirms no external leakage\n\n**Environmental Compliance:**\n- Meets EPA Method 21 requirements (< 500 ppmv screening)\n- Compatible with LDAR (Leak Detection and Repair) programs\n- TA Luft compliant design\n\n**Additional Notes:**\n- Emergency packing injection port provided on 8\" and above\n- Stem finish: Ra 0.4 µm for optimal sealing with graphite packing\n- Backseat design provides secondary stem seal when fully open",
        sourceType: "generated",
      },
      {
        title: "Fire-Safe Certification (API 607)",
        content: "**Fire-Safe Design — API 607 / API 6FA:**\n\nAll gate valves are designed to maintain pressure integrity and limited leakage during and after a fire event.\n\n**Fire Test Standards:**\n- API 607 7th Edition — Fire test for quarter-turn and multi-turn valves\n- API 6FA — Fire test for valves (supplementary)\n- BS 6755 Part 2 — Fire type-testing (alternative acceptance)\n\n**Design Features for Fire Safety:**\n- Metal-to-metal backup seat: Provides sealing after soft seat degradation\n- Graphite packing: Maintains stem seal at temperatures exceeding 1,000°C\n- Body-bonnet gasket: Spiral wound graphite (survives fire conditions)\n- Anti-static device: Ensures electrical continuity between stem, ball/wedge, and body\n\n**Fire Test Results (Type Test):**\n| Parameter | Requirement | Actual |\n| External leakage (during fire) | ≤ 400 cc/min | 85 cc/min |\n| Seat leakage (during fire) | Per API 607 Table 2 | Pass |\n| External leakage (after fire) | Zero visible | Pass |\n| Operability (after fire) | Must open/close | Pass — 3 full cycles |\n\n**Certificate:** Third-party fire test certificate from TUV/LCIE available for each valve size range",
        sourceType: "generated",
      },
      {
        title: "Quality Assurance & Testing",
        content: "Our QA/QC program is designed to meet the stringent requirements of ARAMCO and international standards.\n\n**Quality Management System:**\n- ISO 9001:2015 certified manufacturing facility\n- API 6D licensed\n- PED 2014/68/EU Module H certified\n- ASME ‘U' Stamp holder\n\n**Testing Protocol:**\n1. Raw material chemical analysis & mechanical testing\n2. 100% PMI on all wetted parts\n3. Hydrostatic shell test at 1.5x rated pressure\n4. Low-pressure pneumatic seat test\n5. High-pressure seat test per API 598\n6. Functional test — torque measurement\n7. Dimensional inspection per GA drawing\n8. Surface finish verification (Ra 3.2 µm max on seating surfaces)\n9. Fugitive emissions type-test verification per ISO 15848-1\n10. Actuator FAT — stroke time, torque, fail-safe action\n\n**Inspection Hold Points:** Material receipt, machining, assembly, testing, painting, packing\n\n**Third-Party Inspection:** TUV Süd or Lloyd's Register (as per Aramco ITP requirements)",
        sourceType: "vault",
      },
      {
        title: "Compliance Matrix",
        content: "| Requirement | Standard | Compliance |\n| **Body Design** | API 600 | ✅ Fully Compliant |\n| **Pressure Rating** | ASME B16.34 | ✅ Fully Compliant |\n| **Flange Dimensions** | ASME B16.5 | ✅ Fully Compliant |\n| **Sour Service** | NACE MR0175/ISO 15156 | ✅ Fully Compliant |\n| **Fire Safe** | API 607 / BS 6755 Part 2 | ✅ Certified |\n| **Fugitive Emissions** | ISO 15848-1 Class BH | ✅ Type Tested |\n| **Testing** | API 598 | ✅ Fully Compliant |\n| **Material Traceability** | EN 10204 3.2 | ✅ MTR Provided |\n| **SIL Capability** | IEC 61508 (SIL2) | ✅ Actuator Certified |\n| **Painting** | SSPC-SP6 + Epoxy System | ✅ Per SAES-H-001 |",
        sourceType: "vault",
      },
      {
        title: "Manufacturing & Delivery Schedule",
        content: "**Production Timeline (from order confirmation):**\n\n- Week 1-2: Material procurement & incoming inspection\n- Week 3-5: Forging/Casting + heat treatment\n- Week 6-8: CNC machining of body, bonnet, wedge\n- Week 9-10: Assembly, testing, painting\n- Week 11: Third-party inspection & documentation\n- Week 12: Packing & dispatch (FOB factory)\n\n**Delivery Terms:** FOB Factory, Rajkot, India\n**Shipping:** CIF to Ras Tanura port (estimated 3-4 weeks transit)\n\n**Total Lead Time: 12 weeks (manufacturing) + 4 weeks (shipping) = 16 weeks total**\n\nExpediting available for critical path items at additional cost.",
        sourceType: "generated",
      },
      {
        title: "Commercial Offer",
        content: "**Pricing Summary:**\n\n| Item | Size | Qty | Unit Price | Total |\n| Gate Valve API 600 | 2\" 300# | 35 | ₹32,500 | ₹11,37,500 |\n| Gate Valve API 600 | 4\" 300# | 28 | ₹48,000 | ₹13,44,000 |\n| Gate Valve API 600 | 8\" 300# | 22 | ₹1,15,000 | ₹25,30,000 |\n| Gate Valve API 600 | 12\" 150# | 18 | ₹1,85,000 | ₹33,30,000 |\n| Gate Valve API 600 | 16\" 150# | 24 | ₹2,65,000 | ₹63,60,000 |\n\n**Subtotal: ₹1,47,01,500**\n\n**Additional Costs:**\n- Actuators (pneumatic, 8\" and above): ₹18,50,000\n- Third-party inspection: ₹2,50,000\n- Special packing for sea freight: ₹1,80,000\n- Documentation package: Included\n\n**Grand Total: ₹1,69,81,500 (Excl. GST)**\n\n**Validity:** 30 days from date of proposal\n**Payment Terms:** 30% advance, 60% against inspection, 10% against BL",
        sourceType: "generated",
      },
      {
        title: "Project References",
        content: "**Similar Projects Executed:**\n\n1. **ADNOC — Ruwais Refinery Expansion (2023)**\n   - 200+ API 600/602 gate valves, 2\"-24\"\n   - Class 150 to 600, with pneumatic actuators\n   - Third-party: TUV\n   - Delivered on-time, zero NCR\n\n2. **Saudi Aramco — Marjan Field Development (2022)**\n   - 150 gate valves, NACE compliant\n   - Super Duplex trim for seawater injection\n   - ISO 15848-1 fugitive emissions certified\n   - Lloyd's Register inspected\n\n3. **ONGC — Mumbai High North Redevelopment (2021)**\n   - 300+ valves across gate, globe, check\n   - IS 14846 / API 600 dual compliance\n   - Fire-safe tested per API 607\n   - EIL approved vendor\n\n4. **Kuwait Oil Company — Heavy Oil Project (2022)**\n   - High-temperature gate valves (Class 300, 450°C)\n   - Special Stellite 21 trim\n   - SIL2 actuated for safety-critical service\n   - Zero leakage performance",
        sourceType: "vault",
      },
    ],
  },
  {
    id: "pump-sample",
    title: "Centrifugal Pump Package — Reliance Jamnagar Petrochemical",
    industry: "Pumps",
    template: "Pump OEM",
    subType: "Centrifugal Pump",
    winScore: 79,
    icon: Gauge,
    iconColor: "text-purple-600",
    bgGradient: "from-purple-50 to-pink-50",
    vaultSections: 5,
    vaultDocs: 3,
    totalSections: 7,
    complianceItems: 6,
    complianceChecked: 5,
    tbeTags: 13,
    goNoGoScore: 74,
    goNoGoVerdict: "CONDITIONAL — Verify payment terms",
    description: "API 610 centrifugal pump package with sub-type-specific depth — NPSH analysis, hydraulic curve data, API 682 seal plans, vibration limits. Includes Go/No-Go assessment and 13 TBE evaluation tags.",
    sections: [
      {
        title: "Executive Summary",
        content: "We are pleased to present our proposal for the supply of **API 610 Centrifugal Pump Packages** for the Reliance Jamnagar Petrochemical Complex expansion.\n\nOur proposal covers 15 centrifugal pumps across 6 service applications, designed per API 610 11th Edition, Type OH2 and BB1 configurations.\n\n**Key Differentiators:**\n- API 610 11th Edition compliant design\n- Computational Fluid Dynamics (CFD) optimized impellers\n- Cartridge mechanical seal (API 682 Plan 53B)\n- ATEX Zone 1 certified motors\n- Local service centre in Jamnagar for 24/7 support\n- Go/No-Go Score: 74/100 — CONDITIONAL (payment terms to be verified)",
        sourceType: "vault",
      },
      {
        title: "Hydraulic Selection & NPSH Analysis",
        content: "**Pump Selection Summary:**\n\n| Tag | Service | Flow (m³/h) | Head (m) | Type | Material |\n| P-101 A/B | Feed Transfer | 120 | 85 | OH2 | SS316L |\n| P-102 A/B | Reflux | 80 | 65 | OH2 | CS/SS316 |\n| P-201 A/B | Product Transfer | 200 | 110 | BB1 | SS316L |\n| P-202 A/B | Cooling Water | 350 | 45 | OH2 | CS |\n| P-301 A/B | Solvent Circulation | 150 | 95 | OH2 | Duplex SS |\n| P-302 | Emergency Drain | 50 | 30 | OH2 | CS |\n\n**NPSH Analysis (Centrifugal Pump Specific):**\n\n| Tag | NPSHa (m) | NPSHr (m) | Margin | Status |\n| P-101 | 8.5 | 4.2 | 102% | ✅ Acceptable |\n| P-102 | 6.8 | 3.8 | 79% | ✅ Acceptable |\n| P-201 | 12.0 | 5.5 | 118% | ✅ Acceptable |\n| P-202 | 15.2 | 3.0 | 407% | ✅ Excellent |\n| P-301 | 5.2 | 3.5 | 49% | ✅ Acceptable (min 30%) |\n| P-302 | 9.0 | 2.8 | 221% | ✅ Excellent |\n\n**Performance Guarantees:**\n- Rated point efficiency: >78% (weighted average)\n- NPSH required: minimum 30% margin over available\n- Vibration: <4.5 mm/s RMS per API 610\n- Noise: <85 dB(A) at 1m\n- Minimum continuous stable flow: 30% of BEP",
        sourceType: "vault",
      },
      {
        title: "Mechanical Seal & API 682 Compliance",
        content: "**Seal Configuration per API 682 4th Edition:**\n- Type: Cartridge dual mechanical seal\n- Arrangement: Arrangement 3 (dual pressurized)\n- Seal Plan: Plan 53B (pressurized barrier fluid with bladder accumulator)\n\n**Seal Face Materials:**\n- Inboard: Silicon Carbide vs Silicon Carbide\n- Outboard: Carbon vs Silicon Carbide\n- O-rings: FKM (Viton) standard / FFKM for high temperature\n\n**Seal Support System (per pump):**\n- Bladder accumulator with pressure gauge\n- Barrier fluid reservoir (5L capacity)\n- Pressure switches (high/low alarm)\n- Thermometer well on gland\n- All piping in SS316 tubing\n\n**API 682 Compliance Matrix:**\n| Requirement | Compliance |\n| Cartridge design | ✅ Yes — unitized assembly |\n| Arrangement 3 | ✅ Dual pressurized |\n| Plan 53B | ✅ Bladder accumulator |\n| Qualification test | ✅ Per API 682 Annex E |\n| Emission target | ✅ <1000 ppm VOC |\n\n**Seal Vendor:** John Crane / Flowserve (client approval)",
        sourceType: "vault",
      },
      {
        title: "Material of Construction",
        content: "**Wetted Parts Material Selection:**\n\nMaterial selection based on process fluid compatibility analysis per NACE MR0103 and client's material selection guide.\n\n| Component | Standard Service | Corrosive Service |\n| Casing | ASTM A216 WCB | ASTM A351 CF8M (SS316) |\n| Impeller | ASTM A351 CF8M | ASTM A890 Gr 4A (Duplex) |\n| Shaft | AISI 4140 / SS316 | SS316 / Duplex 2205 |\n| Wear Rings | 12% Cr Steel | Duplex SS |\n| Mechanical Seal | SiC/SiC/Viton | SiC/SiC/FFKM |\n\n**Corrosion Allowance:** 3mm on carbon steel components\n**Design Life:** 20 years minimum",
        sourceType: "vault",
      },
      {
        title: "Motor & ATEX Compliance",
        content: "**Motor Specifications:**\n- Voltage: 415V, 3-phase, 50Hz\n- Enclosure: TEFC (IP55)\n- Insulation: Class F, temperature rise Class B\n- Service Factor: 1.15\n- Starting Method: DOL (up to 37kW), VFD (above 37kW)\n\n**ATEX Classification:**\n- Zone 1, Group IIB, Temperature Class T3\n- Certification: II 2 G Ex d IIB T3 Gb\n- Motor: ABB / Siemens ATEX certified\n- Junction box: Ex d flameproof\n\n**Efficiency:** IE3 premium efficiency per IS 12615:2018",
        sourceType: "generated",
      },
      {
        title: "Testing & Inspection",
        content: "**Factory Acceptance Test (FAT) Protocol:**\n\n1. **Hydrostatic Test** — Casing at 1.5x max allowable WP\n2. **Performance Test** — Per API 610 / HI 14.6\n   - 5-point curve (shutoff to 120% BEP)\n   - NPSH test on critical pumps\n   - Mechanical run test (4 hours minimum)\n3. **Vibration Analysis** — Per API 610 Table 6\n4. **Noise Test** — Per ISO 3744\n5. **Material Verification** — 100% PMI on wetted parts\n\n**Documentation Package:**\n- Final data book with all test reports\n- Material Test Certificates (EN 10204 3.2)\n- Performance curves (actual vs predicted)\n- Hydraulic curve overlay at 5 operating points\n- Mechanical seal installation guide\n- O&M manual with exploded parts diagram",
        sourceType: "vault",
      },
      {
        title: "Commercial Terms",
        content: "**Budget Pricing Summary:**\n\n| Tag | Description | Price per Unit | Qty | Total |\n| P-101 A/B | OH2 SS316L | ₹12,50,000 | 2 | ₹25,00,000 |\n| P-102 A/B | OH2 CS/SS316 | ₹8,75,000 | 2 | ₹17,50,000 |\n| P-201 A/B | BB1 SS316L | ₹18,50,000 | 2 | ₹37,00,000 |\n| P-202 A/B | OH2 CS | ₹6,25,000 | 2 | ₹12,50,000 |\n| P-301 A/B | OH2 Duplex | ₹16,00,000 | 2 | ₹32,00,000 |\n| P-302 | OH2 CS | ₹5,50,000 | 1 | ₹5,50,000 |\n\n**Package Total: ₹1,29,50,000 (Excl. GST)**\n\nIncludes: Baseplate, coupling, coupling guard, motor, common baseplate leveling\n\n**Delivery:** 16 weeks from approved GA drawing\n**Warranty:** 18 months from delivery or 12 months from commissioning",
        sourceType: "generated",
      },
    ],
  },
  {
    id: "epc-sample",
    title: "Instrumentation & Control System — HPCL Vizag Refinery",
    industry: "EPC",
    template: "EPC",
    subType: "EPC (Instrumentation)",
    winScore: 72,
    icon: Building,
    iconColor: "text-teal-600",
    bgGradient: "from-teal-50 to-cyan-50",
    vaultSections: 4,
    vaultDocs: 3,
    totalSections: 8,
    complianceItems: 7,
    complianceChecked: 5,
    tbeTags: 12,
    goNoGoScore: 68,
    goNoGoVerdict: "CONDITIONAL — Subcontracting risk",
    description: "Full EPC proposal with risk register, subcontracting strategy, local content plan, OISD compliance mapping, and project execution framework. Includes Go/No-Go assessment and 12 TBE evaluation tags.",
    sections: [
      {
        title: "Executive Summary",
        content: "This proposal presents our comprehensive scope for the **Instrumentation & Control System Package** for HPCL Vizag Refinery's CDU/VDU expansion project.\n\nOur scope covers complete design, procurement, installation, and commissioning of:\n- Distributed Control System (DCS) — Honeywell Experion PKS\n- 650+ field instruments (pressure, temperature, flow, level)\n- 85 control valves with positioners\n- Fire & Gas detection system\n- Complete cabling, cable trays, and junction boxes\n- Loop testing and pre-commissioning\n\n**Project Value: ₹18.5 Cr (all-inclusive)**\n**Go/No-Go Score: 68/100 — CONDITIONAL** (subcontracting capacity to be confirmed)\n\nWe bring 20+ years of instrumentation EPC experience with completed projects for IOCL, BPCL, HPCL, and ONGC refineries.",
        sourceType: "vault",
      },
      {
        title: "Risk Register & Mitigation Plan",
        content: "**Project Risk Assessment (EPC-Specific):**\n\n| # | Risk | Probability | Impact | Mitigation |\n| 1 | Delayed DCS delivery | Medium | High | Pre-order Honeywell hardware at LOI stage |\n| 2 | Site access restrictions | Low | Medium | Coordinate with HPCL for turnaround schedule |\n| 3 | Skilled manpower shortage | Medium | High | Pre-mobilize 50% workforce, tie-up with approved contractor |\n| 4 | Interface conflicts with mechanical | Medium | Medium | Weekly coordination meetings with mech/piping teams |\n| 5 | Monsoon delays (Jun-Sep) | High | Medium | Weatherproof cable routes, indoor termination priority |\n| 6 | Vendor document delays | Medium | Low | Penalty clause in PO, parallel engineering |\n| 7 | Safety incident | Low | Critical | Zero-incident HSE program, daily toolbox talks |\n\n**Risk Contingency Budget:** 5% of project value (₹92.5 lakhs)\n**Risk Review Frequency:** Monthly at PMC level, weekly at site level",
        sourceType: "generated",
      },
      {
        title: "Scope of Work",
        content: "**Detailed Scope Breakdown:**\n\n**1. DCS System (Honeywell Experion PKS)**\n- 2x redundant C300 controllers (2,000 I/O)\n- 4x operator stations with 24\" LED displays\n- 1x engineering station, 1x historian server\n\n**2. Field Instruments (650+ devices)**\n- Pressure transmitters: 180 nos (Yokogawa EJA)\n- Temperature elements: 200 nos (RTD + TC)\n- Flow meters: 85 nos (Orifice + Coriolis + Magnetic)\n- Level transmitters: 95 nos (DP + Radar + Ultrasonic)\n- Safety instruments: 75 nos (SIL2/SIL3 rated)\n\n**3. Control Valves (85 nos)**\n- Globe type: 50 nos, Butterfly: 25 nos, Ball: 10 nos\n- All with HART-enabled positioners\n\n**4. Installation Works**\n- Cable laying: 45,000 meters\n- Cable trays: 3,500 meters\n- JBs and marshalling cabinets: 120 nos",
        sourceType: "vault",
      },
      {
        title: "Subcontracting Strategy",
        content: "**Subcontracting Plan (EPC-Specific):**\n\n| Activity | Subcontractor | Status | Value |\n| Cable laying & tray erection | ABC Electrical (HPCL approved) | Pre-qualified | ₹65 lakhs |\n| DCS FAT support | Honeywell (direct) | OEM | Included in DCS cost |\n| Fire & Gas system supply | Det-Tronics / Honeywell Analytics | Approved vendor | ₹45 lakhs |\n| Painting & insulation of JBs | Local approved contractor | HPCL empaneled | ₹12 lakhs |\n\n**Subcontractor Management:**\n- All subcontractors pre-approved by HPCL\n- Monthly performance review and milestone tracking\n- Safety induction mandatory for all sub-contract personnel\n- Quality audit at key milestones\n- Back-to-back penalty clause for delays\n\n**Local Content:** >70% of installation workforce sourced from Vizag region",
        sourceType: "generated",
      },
      {
        title: "Project Execution Plan",
        content: "**Phase 1: Engineering (Weeks 1-8)**\n- Detailed engineering and instrument datasheets\n- P&ID mark-up and instrument index\n- Cable schedule and routing, Hook-up drawings, MTO\n\n**Phase 2: Procurement (Weeks 4-16)**\n- Long lead items: DCS, control valves, analyzers\n- Bulk instruments: pressure, temperature, flow, level\n\n**Phase 3: Installation (Weeks 12-28)**\n- Cable tray erection, cable pulling and termination\n- Instrument installation, DCS hardware installation\n\n**Phase 4: Commissioning (Weeks 26-32)**\n- Loop checking, DCS configuration and testing\n- Safety system proof testing, PSSR support\n\n**Total Duration: 32 weeks**",
        sourceType: "generated",
      },
      {
        title: "Commercial Summary",
        content: "**Cost Breakdown:**\n\n| Category | Amount (₹ Lakhs) | % of Total |\n| DCS System (Honeywell) | 425.00 | 23% |\n| Field Instruments | 380.00 | 21% |\n| Control Valves | 275.00 | 15% |\n| Cables & Cable Trays | 185.00 | 10% |\n| Installation Labour | 280.00 | 15% |\n| Engineering & PM | 120.00 | 6% |\n| Commissioning | 85.00 | 5% |\n| Contingency (5%) | 100.00 | 5% |\n\n**Total Project Value: ₹18,50,00,000 (Excl. GST)**\n\n**Payment Milestones:**\n1. Advance: 15% against BG\n2. Engineering completion: 10%\n3. Material delivery: 40% (pro-rata)\n4. Installation completion: 25%\n5. Commissioning & handover: 10%",
        sourceType: "vault",
      },
      {
        title: "Project References",
        content: "**Completed Instrumentation EPC Projects:**\n\n1. **IOCL Paradip Refinery — DHDS Unit (2023)**\n   - Value: ₹22 Cr | 800+ instruments | Yokogawa DCS\n   - Completed 2 weeks ahead of schedule, Zero LTI\n\n2. **BPCL Kochi — IREP Phase 2 (2022)**\n   - Value: ₹15 Cr | DCS migration + new instruments\n   - Hot cutover without plant shutdown\n\n3. **ONGC — C2C3 Plant Dahej (2021)**\n   - Value: ₹12 Cr | SIL3 SIS implementation, OISD-163 compliant\n\n4. **HPCL Mumbai — DHDT Revamp (2020)**\n   - Value: ₹8 Cr | Brownfield upgrade, hazardous area instrumentation",
        sourceType: "vault",
      },
      {
        title: "Compliance & Certifications",
        content: "**Company Certifications:**\n- ISO 9001:2015, ISO 14001:2015, ISO 45001:2018\n- OISD approved contractor\n- PESO licensed for hazardous area work\n\n**Design Compliance:**\n- ISA 5.1, IEC 61511, IEC 60079, IS 5571, HPCL GS specifications\n\n**Vendor Approvals:**\n- Honeywell Authorized System Integrator\n- Yokogawa Certified Channel Partner\n- Fisher (Emerson) Approved Installer",
        sourceType: "generated",
      },
    ],
  },
];

export function SamplesContent() {
  const [expandedSample, setExpandedSample] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero */}
      <div className="bg-[#1a365d] text-white py-16 md:py-20">
        <div className="max-w-[1100px] mx-auto px-4 md:px-8 text-center">
          <Badge className="mb-4 bg-white/10 text-white border-white/20">Sample Proposals</Badge>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Sub-Type Specific Proposals. Not Generic Templates.
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            See the difference between a generic "valve proposal" and a Gate Valve proposal with actuator torque calculations, fugitive emissions data, fire-safe certification, and AI-generated process diagrams. Each sample includes Go/No-Go scoring and industry-specific TBE tags.
          </p>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-12">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
          {[
            { icon: FileText, label: "Total Sections", value: "25" },
            { icon: Database, label: "Vault-Sourced", value: "15" },
            { icon: Layers, label: "TBE Tags Generated", value: "40" },
            { icon: Target, label: "Go/No-Go Scored", value: "3/3" },
            { icon: Shield, label: "Compliance Items", value: "21" },
          ].map((stat) => (
            <Card key={stat.label} className="shadow-sm">
              <CardContent className="p-4 text-center">
                <stat.icon className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sample Proposals */}
        <div className="space-y-6">
          {sampleProposals.map((sample) => {
            const isExpanded = expandedSample === sample.id;
            const scoreColor = sample.winScore >= 80 ? "text-emerald-600" : sample.winScore >= 60 ? "text-amber-600" : "text-red-600";

            return (
              <Card key={sample.id} className="shadow-md overflow-hidden">
                <CardContent className="p-0">
                  {/* Header */}
                  <div className={cn("p-5 md:p-6 bg-gradient-to-r", sample.bgGradient)}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={cn("w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0", sample.iconColor)}>
                          <sample.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="font-display text-lg font-bold">{sample.title}</h2>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="secondary" className="text-xs">{sample.industry}</Badge>
                            <Badge variant="outline" className="text-xs">
                              <GitBranch className="w-3 h-3 mr-1" />
                              {sample.subType}
                            </Badge>
                            <Badge className="text-[10px] bg-rose-100 text-rose-700 border-rose-200">
                              <Target className="w-3 h-3 mr-1" />
                              Go/No-Go: {sample.goNoGoScore}/100 — {sample.goNoGoVerdict}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 max-w-xl">{sample.description}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={cn("text-3xl font-bold", scoreColor)}>{sample.winScore}%</div>
                        <div className="text-xs text-muted-foreground">Win Score</div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex items-center gap-4 mt-4 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <FileText className="w-3.5 h-3.5" /> {sample.totalSections} sections
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Database className="w-3.5 h-3.5" /> {sample.vaultSections} from vault
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Layers className="w-3.5 h-3.5" /> {sample.tbeTags} TBE tags
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Shield className="w-3.5 h-3.5" /> {sample.complianceChecked}/{sample.complianceItems} compliance
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedSample(isExpanded ? null : sample.id)}
                        className="ml-auto gap-1"
                      >
                        {isExpanded ? "Collapse" : "View All Sections"}
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Sections */}
                  {isExpanded && (
                    <div className="p-5 md:p-6 space-y-3 border-t">
                      {sample.sections.map((sec, i) => {
                        const secKey = `${sample.id}-${i}`;
                        const isSectionExpanded = expandedSection === secKey;

                        return (
                          <div key={secKey} className="border rounded-lg overflow-hidden">
                            <button
                              onClick={() => setExpandedSection(isSectionExpanded ? null : secKey)}
                              className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                                  {i + 1}
                                </div>
                                <span className="font-medium text-sm">{sec.title}</span>
                                {sec.sourceType === "vault" && (
                                  <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700">Vault</Badge>
                                )}
                              </div>
                              {isSectionExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            {isSectionExpanded && (
                              <div className="px-4 pb-4 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed border-t bg-muted/20">
                                <div className="pt-3">{sec.content}</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center bg-[#1a365d] rounded-2xl p-8 md:p-12 text-white">
          <Award className="w-10 h-10 mx-auto mb-4 text-emerald-400" />
          <h2 className="font-display text-2xl font-bold mb-3">Ready to Generate Your Own?</h2>
          <p className="text-white/70 mb-6 max-w-lg mx-auto">
            Upload your RFP, select your product sub-type, and get a Go/No-Go scored proposal with this level of technical depth — in under an hour.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/demo">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Book a Demo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" className="bg-white/20 border border-white/30 text-white hover:bg-white/30">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}