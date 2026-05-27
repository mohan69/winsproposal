import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ==================== VAULT DOCUMENTS ====================

const vaultDocuments = [
  // ========== VALVE OEM (3 docs) ==========
  {
    filename: "Gate_Valve_Supply_Proposal_BPCL_Kochi.pdf",
    fileType: "application/pdf",
    documentType: "past_proposal",
    industry: "Valves" as const,
    tags: ["API 600", "ASME B16.34", "Gate Valve", "Petrochemical", "BPCL", "Past Proposal"],
    sections: [
      {
        sectionTitle: "Executive Summary",
        sectionType: "executive_summary",
        industryTags: ["Valves", "Petrochemical", "Gate Valve"],
        content: `## Executive Summary - Gate Valve Supply for BPCL Kochi Refinery Expansion

RightSense Industrial Solutions Private Limited is pleased to submit this proposal for the supply of API 600 Gate Valves for the BPCL Kochi Refinery Integrated Refinery Expansion Project IREP Phase-III. With over 18 years of expertise in valve manufacturing for the Indian petroleum and petrochemical sector, we bring unmatched reliability, quality assurance, and on-time delivery performance.

**Scope Overview:**
- Supply of 340 nos. API 600 Cast Steel Gate Valves in 2 inch to 24 inch size range
- Pressure classes: Class 150, 300, and 600 as per ASME B16.34
- Materials of Construction: ASTM A216 WCB, A351 CF8M SS316, A352 LCB Low-Temperature Carbon Steel
- End Connections: RF Flanged to ASME B16.5, BW to ASME B16.25
- All valves to comply with BPCL Standard Specification BS-VALVES-001 Rev. 4

**Competitive Advantages:**
1. **In-house manufacturing** at our ISO 9001:2015, ISO 14001:2015, and OHSAS 18001 certified Pune facility
2. **API 6D and API 600 Monogram holder** since 2012
3. **Zero-leakage commitment** - all valves undergo shell test at 1.5x and seat test at 1.1x rated pressure per API 598
4. **Proven track record** - supplied 2,800+ valves to BPCL, IOCL, HPCL, ONGC across 15+ refinery projects
5. **Delivery within 14-16 weeks** from confirmed purchase order

**Total Offer Value:** Rs. 8,47,50,000/- (Rupees Eight Crore Forty-Seven Lakh Fifty Thousand Only) inclusive of all applicable taxes, packing, forwarding, and delivery to BPCL Kochi site.

We are confident that our proven expertise, competitive pricing, and unwavering commitment to quality make RightSense the ideal partner for this critical project requirement.`
      },
      {
        sectionTitle: "Technical Specifications",
        sectionType: "technical",
        industryTags: ["Valves", "API 600", "ASME B16.34", "Gate Valve"],
        content: `## Technical Specifications - API 600 Gate Valves

### Design Standards and Codes
- **Design:** API 600 Latest Edition / BS 1414
- **Pressure-Temperature Rating:** ASME B16.34
- **Face-to-Face Dimensions:** ASME B16.10
- **Flange Dimensions:** ASME B16.5 RF and RTJ
- **Butt-Weld Ends:** ASME B16.25
- **Testing:** API 598 / ISO 5208 Rate A
- **Marking:** MSS SP-25
- **Quality System:** ISO 9001:2015, PED 2014/68/EU

### Material Specifications

| Component | Class 150/300 WCB | Class 600 WCB | SS316 Variant |
|-----------|-------------------|---------------|---------------|
| Body | ASTM A216 WCB | ASTM A216 WCB | ASTM A351 CF8M |
| Bonnet | ASTM A216 WCB | ASTM A216 WCB | ASTM A351 CF8M |
| Wedge/Gate | ASTM A216 WCB + 13Cr Overlay | ASTM A216 WCB + Stellite 6 | ASTM A351 CF8M + Stellite 6 |
| Stem | ASTM A182 F6a 13Cr | ASTM A182 F6a 13Cr | ASTM A182 F316 |
| Packing | Graphite Rings Fire-Safe | Graphite Rings Fire-Safe | Graphite Rings Fire-Safe |
| Gasket | SPW SS316 + Graphite | SPW SS316 + Graphite | SPW SS316 + Graphite |
| Bolting | ASTM A193 B7 / A194 2H | ASTM A193 B7M / A194 2HM | ASTM A193 B8M / A194 8M |

### Size and Pressure Range
- **Size Range:** 2 inch DN50 to 24 inch DN600
- **Pressure Classes:** 150, 300, 600
- **Temperature Range:** -29 deg C to 425 deg C (LTCS variant: down to -46 deg C)
- **Valve Type:** Wedge Gate, Flexible Wedge, OS&Y Outside Screw and Yoke
- **Bonnet Type:** Bolted Bonnet standard, Pressure Seal Bonnet Class 600 above 10 inch

### Special Features
- **Fire-Safe Design** as per API 607 / ISO 10497 6th Edition
- **Anti-Static Device** ensuring grounding of ball/wedge to body
- **Backseat Arrangement** for packing replacement under pressure
- **Integral Drain and Vent Plugs** on body cavity
- **Locking Device** provision on handwheel
- **NACE MR0175 / ISO 15156** compliance for sour service where specified

### Quality Control and Testing
- 100% Radiography on body and bonnet castings ASTM E446, Severity Level 2
- PMI Positive Material Identification on all pressure-retaining components
- Hydrostatic Shell Test: 1.5x CWP per API 598
- Hydrostatic Seat Test: 1.1x CWP per API 598
- Low-Pressure Pneumatic Seat Test: 0.6 bar for soft-seated valves
- Hardness Testing per NACE MR0175 for sour service
- Dimensional Inspection Report per ASME B16.10
- Final Visual and Painting Inspection`
      },
      {
        sectionTitle: "Commercial Terms and Pricing",
        sectionType: "commercial",
        industryTags: ["Valves", "Pricing", "Commercial"],
        content: `## Commercial Terms and Pricing

### Price Schedule Ex-Works Pune + Delivery to BPCL Kochi

| Sr. | Description | Size Range | Qty | Unit Price Rs. | Total Rs. |
|-----|-------------|-----------|-----|----------------|-----------|
| 1 | Gate Valve, API 600, Cl.150, WCB, RF | 2 - 6 inch | 120 | 18,500 - 1,45,000 | 78,60,000 |
| 2 | Gate Valve, API 600, Cl.300, WCB, RF | 2 - 12 inch | 95 | 24,000 - 3,85,000 | 1,82,75,000 |
| 3 | Gate Valve, API 600, Cl.600, WCB, RF/BW | 2 - 24 inch | 80 | 45,000 - 8,50,000 | 4,12,00,000 |
| 4 | Gate Valve, API 600, Cl.300, CF8M, RF | 3 - 8 inch | 30 | 42,000 - 2,85,000 | 68,40,000 |
| 5 | Gate Valve, API 600, Cl.150, LCB, RF | 2 - 6 inch | 15 | 28,000 - 1,95,000 | 22,50,000 |
| | **Subtotal** | | **340** | | **7,64,25,000** |
| 6 | Packing and Forwarding 2.5% | | | | 19,10,625 |
| 7 | Transportation to BPCL Kochi | | | | 12,50,000 |
| 8 | Third-Party Inspection Charges | | | | 8,75,000 |
| 9 | GST at 18% | | | | 42,89,375 |
| | **Grand Total** | | | | **Rs. 8,47,50,000** |

### Payment Terms
- 30% Advance against confirmed Purchase Order
- 60% against dispatch / receipt of material at site with inspection clearance
- 10% within 30 days of commissioning or 6 months from dispatch, whichever is earlier

### Delivery Schedule
- Class 150 and 300 Standard sizes 2 to 8 inch: 12 weeks from PO
- Class 600 and large bore 10 to 24 inch: 16 weeks from PO
- SS316 variants: 14 weeks from PO
- Expedited delivery available at 5% premium

### Warranty
- 18 months from date of dispatch or 12 months from date of commissioning, whichever is earlier
- Warranty covers defects in material, workmanship, and design
- Free replacement of defective parts within warranty period

### Validity
- This offer is valid for 90 days from the date of submission
- Prices are firm for deliveries within 6 months; beyond 6 months, subject to raw material price escalation clause`
      },
      {
        sectionTitle: "Quality Assurance and Certifications",
        sectionType: "quality",
        industryTags: ["Valves", "Quality", "Certifications", "API"],
        content: `## Quality Assurance and Certifications

### Manufacturing Facility
Our state-of-the-art manufacturing facility is located in Chakan MIDC, Pune, Maharashtra, spread across 45,000 sq. ft. with the following capabilities:

- **CNC Machining Centers:** 12 nos. Mazak, DMG Mori for precision machining of body, bonnet, and trim components
- **Dedicated Assembly Bay:** 8,000 sq. ft. clean-room environment for final assembly and testing
- **In-house Testing Lab:** Hydrostatic test benches up to 750 bar, pneumatic test capability, cryogenic test facility -196 deg C
- **NDE Facility:** Radiography Co-60, Ultrasonic Testing, Magnetic Particle Inspection, Dye Penetrant Testing
- **Metallurgical Lab:** Spectrometer Spectrolab, Hardness Tester, Impact Testing Machine, Tensile Testing Machine

### Certifications and Approvals
- **ISO 9001:2015** - Quality Management System
- **ISO 14001:2015** - Environmental Management System
- **OHSAS 18001:2007** - Occupational Health and Safety
- **API 6D Monogram** - Pipeline and Piping Valves
- **API 600 Monogram** - Bolted Bonnet Steel Gate Valves
- **PED 2014/68/EU** - European Pressure Equipment Directive Module H
- **ATEX** - For actuated valve assemblies in explosive atmospheres
- **IBR Approved** - Indian Boiler Regulation for steam service valves
- **Approved by:** BPCL, IOCL, HPCL, ONGC, GAIL, Reliance Industries, L&T, Tata Projects

### Third-Party Inspection
All valves are offered for stage-wise and final inspection by Client nominated TPI agency e.g., EIL, LRIS, BV, TUV, SGS. Inspection notification shall be given minimum 5 working days in advance.`
      },
      {
        sectionTitle: "Delivery and Project Execution",
        sectionType: "delivery",
        industryTags: ["Valves", "Delivery", "Logistics"],
        content: `## Delivery and Project Execution Plan

### Manufacturing Timeline

| Phase | Activity | Duration |
|-------|---------|----------|
| Phase 1 | Engineering and Drawing Approval | Week 1-3 |
| Phase 2 | Raw Material Procurement and Incoming Inspection | Week 2-6 |
| Phase 3 | Machining and Fabrication | Week 5-10 |
| Phase 4 | Assembly and Testing | Week 9-13 |
| Phase 5 | Painting, Marking and Final Inspection | Week 12-14 |
| Phase 6 | Packing and Dispatch | Week 14-16 |

### Logistics and Delivery
- **Packing:** Sea-worthy wooden cases with VCI paper wrapping for corrosion protection
- **Transportation:** Dedicated truck transport from Pune to BPCL Kochi approx. 1,500 km
- **Transit Insurance:** Covered at 110% of invoice value Institute Cargo Clauses - All Risks
- **Delivery Point:** BPCL Kochi Refinery, Ambalamugal, Ernakulam, Kerala - 682302
- **Unloading:** Responsibility of the Buyer at site

### Post-Delivery Support
- Site supervision for valve installation guidance 2 man-days included
- Technical support for commissioning assistance
- Spare parts availability guaranteed for 10 years
- Annual Maintenance Contract AMC available at Rs. 3,50,000/year`
      }
    ]
  },
  {
    filename: "Ball_Valve_Series_Technical_Datasheet.pdf",
    fileType: "application/pdf",
    documentType: "technical_datasheet",
    industry: "Valves" as const,
    tags: ["Ball Valve", "API 6D", "Trunnion Mounted", "Floating", "Technical Datasheet"],
    sections: [
      {
        sectionTitle: "Ball Valve Product Range Overview",
        sectionType: "technical",
        industryTags: ["Valves", "Ball Valve", "Product Catalog"],
        content: `## Ball Valve Series - Complete Product Range

RightSense Industrial Solutions manufactures a comprehensive range of ball valves for the oil and gas, petrochemical, refinery, and process industries. Our ball valve portfolio includes:

### Floating Ball Valves RBF Series
- **Size Range:** Half inch DN15 to 12 inch DN300
- **Pressure Class:** 150 to 600
- **Design Standard:** API 6D / BS 5351 / ASME B16.34
- **Body Styles:** Two-Piece, Three-Piece, Side Entry, Top Entry
- **Bore:** Full Bore FB and Reduced Bore RB
- **End Connections:** Flanged RF/RTJ, Butt-Weld, Socket-Weld, Threaded NPT/BSP
- **Materials:** WCB, WCC, LCB, LCC, CF8, CF8M, CF3M, A890 Duplex, Alloy 20, Monel, Inconel
- **Seat Material:** PTFE, RPTFE, Devlon, PEEK, Metal-to-Metal Stellite 6 overlay

### Trunnion Mounted Ball Valves RBT Series
- **Size Range:** 2 inch DN50 to 48 inch DN1200
- **Pressure Class:** 150 to 2500
- **Design Standard:** API 6D / ASME B16.34
- **Body Styles:** Side Entry Bolted, Top Entry, Welded Body
- **Features:** Double Block and Bleed DBB, Anti-Blowout Stem, Emergency Sealant Injection, Cavity Relief
- **Actuation:** Manual Gear/Lever, Pneumatic, Electric, Hydraulic
- **Special Variants:** Cryogenic -196 deg C, High Temperature 550 deg C, Subsea, Underground

### Key Design Features All Series
- **Fire-Safe Design** per API 607 / BS 6755 Part 2
- **Anti-Static Device** per API 6D / BS 5351
- **Blowout-Proof Stem** per API 6D
- **ISO 5211 Actuator Mounting Pad** standard
- **NACE MR0175 / ISO 15156** compliance for sour service
- **SIL 3 Capable** per IEC 61508 with pneumatic/electric actuators
- **Fugitive Emission Tested** per ISO 15848-1 / API 641`
      },
      {
        sectionTitle: "Ball Valve Technical Data and Performance",
        sectionType: "technical",
        industryTags: ["Valves", "Ball Valve", "Performance Data"],
        content: `## Technical Data and Performance Specifications

### Cv Values Full Bore

| Size | Class 150 | Class 300 | Class 600 |
|------|-----------|-----------|----------|
| 2 inch | 160 | 155 | 145 |
| 3 inch | 400 | 385 | 360 |
| 4 inch | 750 | 720 | 680 |
| 6 inch | 1,700 | 1,650 | 1,550 |
| 8 inch | 3,100 | 3,000 | 2,800 |
| 10 inch | 5,000 | 4,800 | 4,500 |
| 12 inch | 7,300 | 7,000 | 6,600 |
| 16 inch | 13,500 | 13,000 | 12,000 |
| 20 inch | 22,000 | 21,000 | 19,500 |
| 24 inch | 32,000 | 30,500 | 28,000 |

### Test Pressures per API 598

| Class | Shell Test bar | Low-Pressure Seat bar | High-Pressure Seat bar |
|-------|---------------|----------------------|----------------------|
| 150 | 30.6 | 0.6 | 20.4 |
| 300 | 79.5 | 0.6 | 53.0 |
| 600 | 159.0 | 0.6 | 106.0 |
| 900 | 238.5 | 0.6 | 159.0 |
| 1500 | 397.5 | 0.6 | 265.0 |
| 2500 | 662.5 | 0.6 | 441.7 |

### Standard Painting Specification
- **External Surface:** Blast cleaning to SA 2.5, Epoxy primer 75 micron DFT + Polyurethane topcoat 75 micron DFT
- **Internal Surface:** One coat rust preventive oil
- **Color:** Grey RAL 7035 standard or customer specified
- **Corrosion Protection:** VCI caps on all openings, VCI paper wrapping during storage`
      }
    ]
  },
  {
    filename: "RightSense_Valve_Capability_Statement.pdf",
    fileType: "application/pdf",
    documentType: "capability_statement",
    industry: "Valves" as const,
    tags: ["Capability Statement", "Company Profile", "Manufacturing", "Valve OEM"],
    sections: [
      {
        sectionTitle: "Company Overview and Manufacturing Capabilities",
        sectionType: "company_profile",
        industryTags: ["Valves", "Company Profile", "Manufacturing"],
        content: `## RightSense Industrial Solutions Pvt. Ltd. - Capability Statement

### Company Overview
Founded in 2006, RightSense Industrial Solutions Pvt. Ltd. is a leading Indian manufacturer and exporter of industrial valves for the oil and gas, petrochemical, refinery, power, and water sectors. Headquartered in Pune, Maharashtra, with manufacturing facilities in Chakan MIDC and Ranjangaon MIDC, we employ over 450 professionals across engineering, manufacturing, quality, and project management functions.

**Annual Turnover:** Rs. 185 Crore FY 2024-25
**Export Revenue:** 35% of turnover Middle East, Southeast Asia, Africa, CIS countries
**Production Capacity:** 15,000+ valves per annum sizes half inch to 48 inch

### Product Portfolio
1. **Gate Valves** - API 600, API 602, BS 1414 2 inch to 48 inch, up to Class 2500
2. **Globe Valves** - API 623, BS 1873 2 inch to 24 inch, up to Class 2500
3. **Check Valves** - API 594, API 6D, BS 1868 2 inch to 48 inch, Swing, Tilting Disc, Dual Plate
4. **Ball Valves** - API 6D, BS 5351 half inch to 48 inch, Floating and Trunnion Mounted
5. **Butterfly Valves** - API 609 2 inch to 72 inch, Double/Triple Offset
6. **Plug Valves** - API 599 2 inch to 24 inch, Lubricated and Non-Lubricated
7. **Actuated Valve Packages** - Pneumatic, Electric, Hydraulic with complete automation

### Manufacturing Infrastructure
- **Total Built-up Area:** 1,20,000 sq. ft. across two facilities
- **CNC Machines:** 28 nos. Mazak, DMG Mori, Doosan
- **Foundry Partnerships:** Approved casting suppliers with traceability from melt to finished product
- **Welding Shop:** ASME IX qualified welders, overlay welding Stellite, Inconel, Monel
- **Surface Treatment:** In-house shot blasting, painting, electroless nickel plating, ENP

### Key Clients Partial List
- **Oil and Gas:** ONGC, Oil India, BPCL, IOCL, HPCL, GAIL, Cairn Oil and Gas
- **Refineries:** Reliance Jamnagar, Nayara Energy, MRPL, CPCL, NRL
- **EPC:** L&T, Tata Projects, TOYO, Technip Energies, Worley, Jacobs
- **Power:** NTPC, NHPC, Adani Power, Tata Power
- **International:** ADNOC UAE, Saudi Aramco KSA, KNPC Kuwait, Petronas Malaysia

### Key Differentiators
- Complete in-house manufacturing from raw casting to finished, tested valve
- Dedicated R&D cell with 6 design engineers using SolidWorks, ANSYS, and CAESAR II
- Average delivery time: 10-16 weeks industry average: 16-24 weeks
- Rejection rate: less than 0.3% industry average: 2-3%
- 98.2% on-time delivery track record over last 3 years`
      }
    ]
  },

  // ========== PUMP OEM (2 docs) ==========
  {
    filename: "Centrifugal_Pump_Proposal_NMMC_WTP.pdf",
    fileType: "application/pdf",
    documentType: "past_proposal",
    industry: "Pumps" as const,
    tags: ["Centrifugal Pump", "API 610", "Water Treatment", "Municipal", "Past Proposal"],
    sections: [
      {
        sectionTitle: "Executive Summary",
        sectionType: "executive_summary",
        industryTags: ["Pumps", "Water Treatment", "Municipal"],
        content: `## Executive Summary - Centrifugal Pump Package for NMMC Water Treatment Plant

RightSense Pumps Division is pleased to present our technical and commercial proposal for the supply, testing, and commissioning of Centrifugal Pump Packages for the Navi Mumbai Municipal Corporation NMMC 120 MLD Water Treatment Plant Expansion Project at Morbe Dam.

**Project Scope:**
- Supply of 8 nos. Horizontal Split Case Centrifugal Pumps Raw Water Intake Pumps
- Supply of 6 nos. End Suction Centrifugal Pumps Distribution Pumps
- Supply of 4 nos. Vertical Turbine Pumps Sump Pumps
- Complete motor-pump packages with base frames, couplings, guards, and accessories
- Installation supervision and commissioning assistance

**Key Highlights:**
- All pumps designed and manufactured in compliance with **IS 1520:2018** Centrifugal Pumps and relevant **API 610** provisions for critical service
- **CPRI-tested motors** IS 12615:2018 with IE3 efficiency class
- **Hydraulic design** using CFD-optimized impellers for maximum efficiency and minimum NPSH requirement
- **5-year comprehensive warranty** on all pump sets
- **Total Project Value:** Rs. 4,85,00,000/- Rupees Four Crore Eighty-Five Lakh Only
- **Delivery:** 12-14 weeks from PO for all pump sets

RightSense has successfully supplied and commissioned 850+ pump sets to municipal water supply projects across Maharashtra, Gujarat, Karnataka, and Andhra Pradesh.`
      },
      {
        sectionTitle: "Technical Specifications - Pump Packages",
        sectionType: "technical",
        industryTags: ["Pumps", "API 610", "Centrifugal", "Technical"],
        content: `## Technical Specifications - Centrifugal Pump Packages

### Raw Water Intake Pumps 8 nos. - Horizontal Split Case

| Parameter | Specification |
|-----------|---------------|
| Type | Horizontal Axially Split Case, Single Stage, Double Suction |
| Design Standard | IS 1520 / API 610 11th Ed. OH2 Type |
| Rated Flow | 1,250 cubic metres per hour each |
| Total Head | 45 metres |
| Speed | 1,480 RPM |
| Efficiency | 86% or higher at BEP |
| NPSH Required | 4.5 m or less |
| Casing Material | Cast Iron IS 210 Grade FG 260 / Ductile Iron IS 1865 Grade 500/7 |
| Impeller Material | Bronze IS 318 Grade LTB-2 |
| Shaft Material | EN 8 IS 1570 with SS 410 sleeve |
| Seal Type | Mechanical Seal John Crane Type 2100 or equivalent |
| Motor | Siemens/ABB/CG, 250 kW, 415V, 3-phase, 50 Hz, TEFC, IE3 |

### Distribution Pumps 6 nos. - End Suction

| Parameter | Specification |
|-----------|---------------|
| Type | End Suction, Back Pull-Out, Single Stage |
| Rated Flow | 450 cubic metres per hour each |
| Total Head | 65 metres |
| Speed | 2,960 RPM |
| Efficiency | 82% or higher at BEP |
| Casing Material | Ductile Iron IS 1865 Grade 500/7 |
| Impeller Material | SS 316 ASTM A351 CF8M |
| Motor | 132 kW, 415V, 3-phase, 50 Hz, TEFC, IE3 |

### Performance Guarantee
- Pump performance within plus or minus 5% of head and plus or minus 3% of flow at rated point
- Pump efficiency shall not be less than guaranteed value minus 3 percentage points
- Vibration levels within ISO 10816 Category C limits
- Noise level 85 dB A or less at 1 metre from pump`
      },
      {
        sectionTitle: "Commercial Offer and Pricing",
        sectionType: "commercial",
        industryTags: ["Pumps", "Pricing", "Commercial"],
        content: `## Commercial Offer and Pricing Schedule

### Price Summary

| Item | Description | Qty | Unit Price Rs. | Total Rs. |
|------|-------------|-----|----------------|-----------|
| 1 | Raw Water Intake Pump Package 1250 m3/hr, 45m | 8 | 32,50,000 | 2,60,00,000 |
| 2 | Distribution Pump Package 450 m3/hr, 65m | 6 | 18,75,000 | 1,12,50,000 |
| 3 | Vertical Turbine Sump Pump 180 m3/hr, 28m | 4 | 6,25,000 | 25,00,000 |
| 4 | Spare Parts Kit 2-year recommended spares | 1 Lot | 12,50,000 | 12,50,000 |
| 5 | Installation Supervision and Commissioning | 1 Lot | 8,50,000 | 8,50,000 |
| | **Subtotal** | | | **4,18,50,000** |
| 6 | Packing, Forwarding and Transportation | | | 14,25,000 |
| 7 | GST at 18% | | | 52,25,000 |
| | **Grand Total Inclusive of all taxes** | | | **Rs. 4,85,00,000** |

### Payment Terms
- 20% Advance with Purchase Order
- 70% against pro-forma invoice before dispatch with inspection clearance
- 10% after successful commissioning or 3 months from delivery, whichever is earlier

### Warranty and After-Sales
- **5-year comprehensive warranty** covering defects in material and workmanship
- **Dedicated service engineer** assigned for Navi Mumbai region
- **24/7 breakdown helpline** with 4-hour response commitment
- **Guaranteed spare parts availability** for 15 years from date of supply
- **Annual Maintenance Contract** available at Rs. 4,50,000/year covers all 18 pump sets`
      }
    ]
  },
  {
    filename: "Quality_Certifications_Summary.pdf",
    fileType: "application/pdf",
    documentType: "certification",
    industry: "Pumps" as const,
    tags: ["ISO 9001", "ISO 14001", "ISO 45001", "Certifications", "Quality"],
    sections: [
      {
        sectionTitle: "Quality Certifications and Management Systems",
        sectionType: "quality",
        industryTags: ["Quality", "Certifications", "ISO"],
        content: `## Quality Certifications and Management Systems Summary

### Active Certifications

**ISO 9001:2015 - Quality Management System**
- Certifying Body: Bureau Veritas India BVQI
- Scope: Design, Manufacture, Assembly, Testing, and Supply of Industrial Valves and Centrifugal Pumps
- Valid Until: March 2027
- Last Surveillance Audit: October 2025 - Zero Non-Conformities

**ISO 14001:2015 - Environmental Management System**
- Certifying Body: Bureau Veritas India
- Scope: Environmental management for manufacturing operations at Chakan and Ranjangaon facilities
- Valid Until: March 2027
- Key Environmental Commitments: Zero Liquid Discharge ZLD, 40% energy from rooftop solar, waste recycling rate over 92%

**ISO 45001:2018 - Occupational Health and Safety Management System**
- Certifying Body: TUV SUD South Asia
- Scope: Occupational health and safety management for all manufacturing, assembly, and testing operations
- Valid Until: June 2027
- Safety Record: 2.8 million man-hours without LTI Lost Time Injury as of March 2026

**API Monogram Licenses**
- API 6D - Pipeline and Pigging Valves
- API 600 - Steel Gate Valves
- API 594 - Check Valves Wafer, Lug and Double Flanged
- Audit Frequency: Annual by API Auditors

**PED 2014/68/EU - Module H Full Quality Assurance**
- Notified Body: Lloyds Register LR, UK
- Scope: Design and manufacture of pressure equipment for European market

**IBR Indian Boiler Regulation Approval**
- Scope: Gate, Globe, and Check valves for steam service
- Approved by: Chief Inspector of Boilers, Maharashtra

### Quality KPIs FY 2025-26
- Customer Complaint Rate: 0.15% target less than 0.5%
- First-Pass Yield: 98.7%
- On-Time Delivery: 98.2%
- Supplier Quality Rating: 96.5% average across approved vendor list
- Internal Rejection Rate: 0.28% target less than 0.5%
- NCR Closure Time: Average 4.2 working days`
      }
    ]
  },

  // ========== EPC (3 docs) ==========
  {
    filename: "Instrumentation_Control_System_Proposal_MRPL.pdf",
    fileType: "application/pdf",
    documentType: "past_proposal",
    industry: "EPC" as const,
    tags: ["Instrumentation", "Control System", "DCS", "Refinery", "MRPL", "Past Proposal"],
    sections: [
      {
        sectionTitle: "Executive Summary",
        sectionType: "executive_summary",
        industryTags: ["EPC", "Instrumentation", "Refinery"],
        content: `## Executive Summary - Instrumentation and Control System for MRPL Refinery Expansion

RightSense Engineering Services Division submits our proposal for the Design, Engineering, Procurement, Installation, and Commissioning DEPIC of the Instrumentation and Control System for Mangalore Refinery and Petrochemicals Limited MRPL Phase-IV Capacity Expansion Project - Crude Distillation Unit CDU-IV and Vacuum Distillation Unit VDU-III.

**Project Overview:**
- **Client:** MRPL ONGC Subsidiary, Mangalore, Karnataka
- **EPC Contractor:** L&T Hydrocarbon Engineering LTHE
- **Scope:** Complete I&C package for CDU-IV 15 MMTPA and VDU-III 7.5 MMTPA
- **Estimated I/O Count:** 8,500+ DI: 2,800, DO: 1,200, AI: 3,100, AO: 1,400
- **DCS Platform:** Honeywell Experion PKS C300 as per MRPL standard
- **SIS Platform:** Honeywell Safety Manager SC SIL 2/3 certified

**Key Deliverables:**
1. Detailed engineering of all instrument and control system disciplines
2. Procurement of field instruments, control valves, DCS/SIS hardware, cables, and accessories
3. Installation of 4,200+ field instruments, 180+ control valves, 85 km of instrument cable
4. Loop checking, pre-commissioning, and hot commissioning support
5. Operator Training Simulator OTS based on Honeywell UniSim

**Project Value:** Rs. 48,50,00,000/- Rupees Forty-Eight Crore Fifty Lakh Only
**Project Duration:** 18 months from Letter of Award

**Our Credentials:**
- Completed 35+ refinery I&C projects across India IOCL, BPCL, HPCL, MRPL, CPCL
- 200+ I&C engineers and technicians
- Honeywell Certified System Integrator CSI partner since 2015
- Zero safety incidents in over 4.5 million man-hours of field execution`
      },
      {
        sectionTitle: "Technical Approach and Methodology",
        sectionType: "technical",
        industryTags: ["EPC", "Instrumentation", "DCS", "Engineering"],
        content: `## Technical Approach and Methodology

### Engineering Phase Months 1-6

**Instrument Index and Specification:**
- Develop complete instrument index estimated 4,200+ instruments based on P&IDs, cause and effect diagrams, and process data sheets
- Prepare instrument data sheets per ISA/ANSI standards for all field instruments including pressure transmitters Rosemount 3051S HART protocol, temperature transmitters Rosemount 3144P RTD/Thermocouple, level transmitters Rosemount 5300 GWR Magnetrol, flow transmitters Micro Motion Coriolis Rosemount 8800 Vortex Orifice plates per ISO 5167, control valves Fisher Masoneilan globe butterfly ball with positioners, safety instrumented devices SIF as per IEC 61511 SIL verification

**DCS/SIS Configuration:**
- Honeywell Experion PKS C300 with redundant controllers and I/O
- Safety Manager SC with SIL 2/SIL 3 certified safety logic solvers
- Network Architecture: Redundant Fault-Tolerant Ethernet FTE backbone
- Operator stations: 12 nos. dual-monitor EWOS in Central Control Room
- Engineering stations: 4 nos. with complete configuration capability
- Historian: Honeywell Uniformance PHD for 10-year data retention

**Control Narrative Development:**
- Regulatory control strategies PID, Cascade, Ratio, Split-Range, Override
- Advanced Process Control APC readiness for DMC controller integration
- Sequence of Events SOE recording with 1ms resolution
- Emergency Shutdown logic development per IEC 61511 and MRPL safety philosophy

### Procurement Phase Months 3-10
- Vendor evaluation and technical bid evaluation for all major instruments
- Factory Acceptance Testing FAT for DCS/SIS hardware at Honeywell Pune
- Expediting and inspection of field instruments through our dedicated QA team

### Installation Phase Months 8-15
- Cable tray and conduit routing 85 km instrument cable, 12 km fiber optic
- Field instrument mounting, tubing, and impulse line installation
- Junction box and marshalling cabinet installation
- Cable termination, megger testing, and continuity checks

### Commissioning Phase Months 14-18
- Point-to-point loop checking 100% of all I/O
- DCS/SIS functional testing with simulated process conditions
- Control valve stroke testing and calibration
- Interlock and ESD logic proving
- Hot commissioning support with 24/7 coverage during initial startup
- Operator training 40 hours classroom + 40 hours on OTS`
      },
      {
        sectionTitle: "Project Schedule and Resources",
        sectionType: "delivery",
        industryTags: ["EPC", "Project Management", "Schedule"],
        content: `## Project Schedule and Resource Deployment

### Milestone Schedule

| Milestone | Target Date Months from LOA |
|-----------|----------------------------|
| Kick-off Meeting and Mobilization | Month 1 |
| 30% Engineering Instrument Index, Specs freeze | Month 3 |
| 60% Engineering Hook-up drawings, Cable schedule | Month 5 |
| 90% Engineering Loop diagrams, Logic narratives | Month 6 |
| DCS/SIS FAT at Honeywell Pune | Month 7 |
| Major Instrument Deliveries Complete | Month 9 |
| Installation Start Field Instruments | Month 8 |
| Installation Complete 75% loops checked | Month 13 |
| Pre-Commissioning Complete | Month 15 |
| Hot Commissioning Support | Month 16-18 |
| Project Close-out and Documentation | Month 18 |

### Manpower Deployment

| Category | Peak Strength |
|----------|---------------|
| Project Manager | 1 |
| Lead Instrument Engineer | 2 |
| DCS/SIS Engineers | 6 |
| Instrument Design Engineers | 8 |
| QA/QC Engineers | 3 |
| Site Supervisors | 12 |
| Instrument Technicians | 45 |
| Cable Jointers and Helpers | 60 |
| **Total Peak Manpower** | **137** |

### Project Management Approach
- **PMI/PMBOK** methodology with Primavera P6 scheduling
- Weekly progress meetings with Client and LTHE
- Monthly progress reports with S-curve tracking
- Dedicated document control using ACONEX / EDMS
- HAZOP and SIL study participation
- Risk register with monthly updates and mitigation tracking`
      }
    ]
  },
  {
    filename: "Project_Execution_Methodology.pdf",
    fileType: "application/pdf",
    documentType: "methodology",
    industry: "EPC" as const,
    tags: ["Project Execution", "Methodology", "PMBOK", "EPC", "Best Practices"],
    sections: [
      {
        sectionTitle: "Project Execution Methodology",
        sectionType: "methodology",
        industryTags: ["EPC", "Project Management", "Methodology"],
        content: `## RightSense Project Execution Methodology

### 1. Project Initiation and Planning

**Kick-off and Mobilization Week 1-2:**
- Project kick-off meeting with client and all stakeholders
- Project Charter development - scope, objectives, deliverables, exclusions
- Project organization chart and RACI matrix
- Communication plan escalation matrix, meeting cadence, reporting
- HSE plan and site-specific risk assessment
- Quality plan project-specific QCP aligned with ISO 9001:2015

**Baseline Schedule Week 2-3:**
- Work Breakdown Structure WBS development
- Primavera P6 scheduling with critical path identification
- Resource loading and levelling
- Cash flow projection and milestone payment schedule
- Earned Value Management EVM baseline setup

### 2. Engineering and Design

**Design Philosophy:**
- Adherence to client Project Design Basis PDB and Engineering Standards
- Use of international codes: IEC 61511, ISA 84, ISA 5.1, IEC 60079, NFPA 70
- CAD tools: AutoCAD, SmartPlant Instrumentation SPI, AVEVA E3D
- Review gates: 30%, 60%, 90%, AFC Approved for Construction

**Document Deliverables:**
- Instrument Index tagged instrument list with all attributes
- Instrument Data Sheets per ISA 20 format
- Control System Architecture drawings
- Logic diagrams Cause and Effect, Safety Logic
- Cable block diagrams and cable schedules
- Junction Box layouts and terminal assignments
- Hook-up drawings process, pneumatic, electrical
- Loop diagrams per ISA 5.4
- Installation typical drawings
- Instrument location plans

### 3. Procurement and Vendor Management

**Key Vendor Partners:**
- DCS/SIS: Honeywell, Yokogawa, ABB, Emerson DeltaV
- Transmitters: Emerson Rosemount, Endress+Hauser, Yokogawa
- Control Valves: Fisher, Masoneilan, Metso Neles
- Analyzers: ABB, Endress+Hauser, Yokogawa
- Cables: Polycab, KEI Industries, Havells

### 4. Construction and Installation

**Quality Checkpoints:**
- Cable insulation resistance megger testing - 100% cables
- Continuity check - 100% pairs
- Hydrostatic testing of impulse lines
- Control valve stroke testing with positioner calibration
- Final walk-down and punch-list clearance

### 5. Commissioning and Handover

**Handover Documentation:**
- As-built drawings all disciplines
- Calibration certificates for all instruments
- Test records loop check, hydrostatic, megger, continuity
- O&M manuals and spare parts recommendations
- Punch-list closure certificate`
      }
    ]
  },
  {
    filename: "HSE_Policy_Compliance_Framework.pdf",
    fileType: "application/pdf",
    documentType: "hse_policy",
    industry: "EPC" as const,
    tags: ["HSE", "Safety", "Health", "Environment", "Compliance", "OHSAS"],
    sections: [
      {
        sectionTitle: "HSE Policy and Compliance Framework",
        sectionType: "hse",
        industryTags: ["EPC", "HSE", "Safety", "Compliance"],
        content: `## Health, Safety and Environment HSE Policy and Compliance Framework

### HSE Policy Statement
RightSense Engineering Services is unconditionally committed to the health and safety of our employees, contractors, clients, and the communities in which we operate. We believe that ALL incidents are preventable, and we target ZERO injuries, ZERO occupational illnesses, and ZERO environmental incidents on every project we execute.

### HSE Management System
Our HSE management system is certified to **ISO 45001:2018** and **ISO 14001:2015**, and is aligned with:
- **OISD Oil Industry Safety Directorate** guidelines for refinery and petrochemical projects
- **NFPA** National Fire Protection Association codes
- **PNGRB** Petroleum and Natural Gas Regulatory Board regulations
- **Factories Act, 1948** and applicable state rules
- **Environment Protection Act, 1986**
- **BOCW Building and Other Construction Workers Act**

### Safety Performance Record

| Metric | FY 2023-24 | FY 2024-25 | FY 2025-26 YTD |
|--------|-----------|-----------|-----------------|
| Man-Hours Worked | 38,50,000 | 42,10,000 | 28,75,000 |
| Lost Time Injuries LTI | 0 | 0 | 0 |
| Recordable Incidents | 1 | 0 | 0 |
| LTIFR per million man-hours | 0.00 | 0.00 | 0.00 |
| Near Miss Reports | 245 | 312 | 198 |
| Safety Training Hours | 18,500 | 22,400 | 15,200 |

### Key HSE Programs

**1. Safety Leadership and Governance**
- Monthly HSE Steering Committee chaired by Managing Director
- Project-level HSE Review meetings weekly
- Behavior-Based Safety BBS program across all sites
- Stop Work Authority SWA for every employee - no disciplinary action for exercising SWA

**2. Hazard Identification and Risk Assessment**
- Job Safety Analysis JSA for all critical activities
- HAZOP study participation for process safety
- Permit to Work PTW system - Hot Work, Confined Space, Height Work, Excavation, Electrical Isolation
- Lock Out Tag Out LOTO procedures

**3. Training and Competency**
- Mandatory 8-hour HSE induction for all new joiners
- Specialized training: Working at Height, Confined Space Entry, First Aid, Fire Fighting
- NEBOSH IGC / IOSH Managing Safely certification for all Site Supervisors and above
- Annual refresher training for all personnel
- Emergency drill conduct: Fire, Toxic Gas Release, Medical Emergency quarterly

**4. Environmental Management**
- Waste management plan segregation, disposal through authorized recyclers
- Air quality monitoring at construction sites
- Water conservation - rainwater harvesting at both manufacturing facilities
- Noise monitoring and hearing conservation program

### HSE Awards and Recognition
- **OISD Safety Award** - Best Safety Performance in Instrumentation Category 2024
- **National Safety Council NSC** - Zero Accident Sword of Honour 2023, 2024
- **BPCL Vendor Safety Award** - Best Contractor Safety Performance, Kochi Refinery 2024
- **CII EHS Excellence Award** - Certificate of Merit 2025`
      }
    ]
  }
];

// ==================== TEXT ENTRIES ====================

const textEntries = [
  {
    title: "Company Overview - RightSense Industrial Solutions",
    tags: ["Company Profile", "About Us", "Overview"],
    industry: "General" as const,
    content: `RightSense Industrial Solutions Pvt. Ltd. is a leading Indian manufacturer, supplier, and project execution partner specializing in industrial valves, centrifugal pumps, and instrumentation and control systems for the oil and gas, refinery, petrochemical, power, and water infrastructure sectors.

Founded in 2006 by a team of experienced engineers from the Indian process industry, RightSense has grown from a small valve trading company to a fully integrated industrial solutions provider with over 450 employees, two manufacturing facilities in Pune, and project execution capability across India and the Middle East.

**Key Facts:**
- **Established:** 2006
- **Headquarters:** Pune, Maharashtra, India
- **Manufacturing Facilities:** Chakan MIDC Valves + Ranjangaon MIDC Pumps
- **Employees:** 450+
- **Annual Revenue:** Rs. 185 Crore FY 2024-25
- **Export Markets:** UAE, Saudi Arabia, Kuwait, Oman, Malaysia, Thailand, Kenya, Nigeria
- **Export Share:** 35% of revenue

**Business Divisions:**
1. **Valve Manufacturing Division** - Gate, Globe, Check, Ball, Butterfly, and Plug valves API 600, API 6D, API 594, BS 1414, BS 1868
2. **Pump Manufacturing Division** - Centrifugal pumps for process and municipal applications API 610, IS 1520
3. **Engineering Services Division** - Instrumentation and Control system design, procurement, installation, and commissioning for refinery, petrochemical, and power projects

**Our Mission:** To empower Indian manufacturing and EPC companies with world-class industrial products and engineering services that enhance safety, reliability, and operational efficiency.

**Our Vision:** To become India's most trusted industrial solutions partner, recognized globally for quality, innovation, and customer excellence.`
  },
  {
    title: "Leadership Team - Senior Engineers",
    tags: ["Team", "Leadership", "Engineers", "Bio"],
    industry: "General" as const,
    content: `## RightSense Leadership and Senior Engineering Team

### Mr. Rajesh Kulkarni - Managing Director and Chief Engineer
**Experience:** 28 years in valve and pump manufacturing
B.Tech Mechanical, IIT Bombay | M.Tech Design Engineering, VJTI Mumbai
Rajesh founded RightSense in 2006 after a distinguished career at Audco India Flowserve and Kirloskar Brothers. He has personally overseen the design and delivery of 50,000+ valves across 200+ refinery and petrochemical projects. Rajesh is an API Voting Member and serves on the Bureau of Indian Standards BIS committee for valve standards. He holds 3 patents in valve stem sealing technology.

### Mr. Suresh Iyer - Vice President, Engineering and R&D
**Experience:** 24 years in process equipment design and FEA analysis
B.E. Mechanical, College of Engineering Pune | M.S. Computational Mechanics, IISc Bangalore
Suresh leads the engineering and R&D function at RightSense. Previously with L&T Valves 16 years, he was instrumental in developing India's first API 6A wellhead valve for ONGC deepwater projects. Suresh specializes in FEA/CFD analysis using ANSYS and has published 12 technical papers in international journals. He manages a team of 18 design engineers.

### Mrs. Priya Deshpande - Vice President, Quality Assurance and Certifications
**Experience:** 22 years in quality management, NDE, and metallurgy
B.E. Metallurgy, VNIT Nagpur | MBA Operations, Symbiosis Pune
Priya oversees all quality systems, certifications, and third-party inspections. She joined RightSense in 2010 after roles at Bharat Forge and Thermax. Under her leadership, RightSense achieved ISO 9001, ISO 14001, ISO 45001, API Monogram, and PED certifications. Priya is a certified Lead Auditor ISO 9001, ISO 14001 and ASNT Level III RT, UT, MT, PT professional.

### Mr. Anand Sharma - General Manager, Projects and Execution EPC Division
**Experience:** 19 years in instrumentation and control system engineering
B.E. Instrumentation, SGSITS Indore | MBA Project Management, NMIMS Mumbai
Anand leads the EPC division project execution from engineering through commissioning. Previously with Tata Consulting Engineers and Jacobs 12 years combined, he has managed I&C packages worth Rs. 500+ Crore across 25+ refinery and petrochemical projects. Anand is a Honeywell Certified System Integrator and PMP-certified professional with expertise in DCS, SIS IEC 61511, and SCADA systems.

### Mr. Vikram Patil - General Manager, Manufacturing Operations
**Experience:** 17 years in CNC machining, welding, and production management
B.E. Production, COEP Pune | Lean Six Sigma Black Belt
Vikram manages both manufacturing facilities with 280+ shop floor personnel. Previously with Kirloskar Oil Engines and Forbes Marshall, he implemented lean manufacturing practices that reduced production cycle time by 35% and improved first-pass yield to 98.7%.`
  },
  {
    title: "Standard Commercial Terms and Conditions",
    tags: ["Commercial", "Terms", "Conditions", "Payment"],
    industry: "General" as const,
    content: `## Standard Commercial Terms and Conditions

### 1. Pricing
- All prices quoted are in Indian Rupees Rs. unless otherwise specified
- Prices are Ex-Works Pune + Packing, Forwarding, Transportation, and applicable GST
- International quotes are in USD/EUR, CIF/FOB as specified
- Prices are valid for 90 days from date of quotation unless otherwise mentioned
- Prices beyond 6 months delivery are subject to raw material price escalation clause linked to LME/SAIL published prices

### 2. Payment Terms Domestic
- **Standard:** 30% Advance with PO, 60% against dispatch with inspection clearance, 10% within 30 days of commissioning or 6 months from dispatch, whichever is earlier
- **Government/PSU Projects:** As per tender terms LC/BG-backed payments accepted
- **Repeat Orders:** Net 30-day credit for customers with established track record
- **Late Payment Interest:** 1.5% per month on overdue amounts

### 3. Payment Terms Export
- 100% Irrevocable Letter of Credit at Sight, or
- 30% TT Advance + 70% against shipping documents
- All bank charges outside India to be borne by the Buyer

### 4. Taxes and Duties
- GST at 18% applicable on all domestic supplies IGST for inter-state, CGST+SGST for intra-state
- Export supplies are zero-rated under GST LUT/Bond based
- Any change in tax rates after quotation date shall be to Buyer's account

### 5. Force Majeure
Neither party shall be liable for delays caused by force majeure events including but not limited to natural disasters, pandemics, government restrictions, wars, strikes, and raw material shortages beyond reasonable control.

### 6. Limitation of Liability
Our total liability under any contract shall not exceed the total contract value. We shall not be liable for any consequential, incidental, or indirect damages including loss of production, loss of profit, or business interruption.

### 7. Jurisdiction and Dispute Resolution
- All disputes shall be resolved through mutual negotiation first
- Failing negotiation, disputes shall be referred to Arbitration under the Arbitration and Conciliation Act, 1996
- Seat of Arbitration: Pune, Maharashtra
- Governing Law: Laws of India`
  },
  {
    title: "Standard Warranty Terms",
    tags: ["Warranty", "Guarantee", "After-Sales"],
    industry: "General" as const,
    content: `## Standard Warranty Terms and After-Sales Support

### Warranty Period
- **Valves:** 18 months from date of dispatch or 12 months from date of commissioning, whichever is earlier
- **Pumps:** 24 months from date of dispatch or 18 months from date of commissioning, whichever is earlier
- **I&C Systems:** 12 months from successful commissioning and handover
- **Extended Warranty:** Available at additional 3-5% of product value per year up to 5 years total

### Warranty Coverage
- Defects in material, workmanship, and design attributable to the Supplier
- Free replacement or repair of defective parts at Supplier's option
- Transportation of defective parts to and from shall be at Supplier's cost during warranty period
- On-site service support for critical failures within 48 hours metro cities / 72 hours other locations

### Warranty Exclusions
- Damage due to improper installation, operation, or maintenance by the Buyer
- Normal wear and tear of consumables packing, gaskets, O-rings, mechanical seal faces
- Damage due to corrosive or abrasive media beyond specified service conditions
- Modification or repair by unauthorized personnel
- Damage due to force majeure events

### After-Sales Support
- **Dedicated Service Team:** 25+ field service engineers across India
- **24/7 Helpline:** +91-20-XXXX-XXXX toll-free for warranty customers
- **Response Time:** 4 hours metro cities, 24 hours other locations
- **Spare Parts Guarantee:** Available for minimum 10 years valves / 15 years pumps from date of supply
- **Annual Maintenance Contract AMC:** Available for comprehensive preventive and breakdown maintenance
- **Remote Diagnostic Support:** For DCS/SIS systems via secure VPN connection
- **Training:** On-site training for customer O&M personnel included with every project`
  },
  {
    title: "Delivery and Logistics Terms",
    tags: ["Delivery", "Logistics", "Shipping", "Packing"],
    industry: "General" as const,
    content: `## Standard Delivery and Logistics Terms

### Packing Standards
- **Domestic Supply:** Industrial-grade wooden cases/pallets with polyethylene wrapping and VCI Vapor Corrosion Inhibitor paper for metallic surfaces
- **Export Supply:** ISPM-15 compliant sea-worthy wooden cases with moisture barrier bags, silica gel desiccant, and VCI protection
- **Special Packing:** Available for hazardous area equipment, fragile instruments, and oversized items
- All packages clearly marked with: PO number, tag number, gross/net weight, handling instructions, THIS SIDE UP orientation

### Delivery Terms
- **Domestic:** Ex-Works Pune Chakan/Ranjangaon + Transportation to site
- **Export:** FOB Mumbai Port / CIF Destination as per Incoterms 2020
- **Partial Shipments:** Permitted unless otherwise specified in PO
- **Delivery Schedule Commitment:** We guarantee 98%+ on-time delivery performance

### Transit Insurance
- Transit insurance included at 110% of invoice value Institute Cargo Clauses - All Risks
- Insurance valid from Supplier works to Buyer nominated delivery point
- Claims processing support provided by our logistics team

### Standard Lead Times
| Product | Standard Size | Lead Time |
|---------|-------------|----------|
| Gate Valves API 600 | 2 to 8 inch, Cl.150-300 | 10-12 weeks |
| Gate Valves API 600 | 10 to 24 inch, Cl.600 | 14-18 weeks |
| Ball Valves Floating | Half inch to 6 inch | 8-10 weeks |
| Ball Valves Trunnion | 8 to 24 inch | 14-20 weeks |
| Centrifugal Pumps IS 1520 | Standard | 10-14 weeks |
| API 610 Process Pumps | All | 16-22 weeks |
| I&C Engineering Package | Complete | 4-6 months |

- **Expedited Delivery:** Available at 5-10% premium with prior confirmation`
  },
  {
    title: "Quality Assurance Process",
    tags: ["Quality", "QA", "QC", "Testing", "Inspection"],
    industry: "General" as const,
    content: `## Quality Assurance Process

### Quality Philosophy
At RightSense, quality is not a department - it is a culture. Every employee, from the shop floor welder to the Managing Director, is responsible for quality. Our goal is simple: Zero Defects, Every Time.

### Incoming Material Quality Control
- All raw materials castings, forgings, bars, plates procured from RightSense Approved Vendor List AVL
- 100% incoming inspection: chemical composition spectrometer, mechanical properties tensile, impact, hardness, dimensional verification
- Material Test Certificates MTC per EN 10204 Type 3.1 - verified against purchase order requirements
- Positive Material Identification PMI on all alloy steel and stainless steel raw materials
- Batch traceability maintained from melt number to finished product

### In-Process Quality Control
- Stage-wise dimensional inspection per approved Inspection Test Plan ITP
- Welding inspection: WPS/PQR qualified per ASME Section IX, welder qualification records maintained
- Non-Destructive Examination NDE: Radiography RT, Ultrasonic Testing UT, Magnetic Particle Inspection MPI, Dye Penetrant Testing DPT
- Surface finish measurement profilometer for sealing surfaces
- Weld overlay thickness and hardness verification for hardfaced components

### Final Inspection and Testing
- **Hydrostatic Testing:** Shell test at 1.5x CWP, Seat test at 1.1x CWP per API 598 for valves
- **Performance Testing:** Flow, head, efficiency, NPSH per ISO 9906 / API 610 for pumps
- **Functional Testing:** Torque measurement, cycle testing, emergency shutoff verification
- **Painting Inspection:** DFT Dry Film Thickness measurement, adhesion test cross-hatch per ASTM D3359
- **Dimensional Inspection:** 100% critical dimensions per GA drawing
- **Visual Inspection:** Surface finish, marking, cleanliness, protective coating

### Documentation Package
- Material Test Certificates MTC per EN 10204 Type 3.1
- NDE reports RT films, UT reports, MPI/DPT reports
- Hydrostatic / Performance test certificates
- Dimensional inspection reports
- PMI reports
- General Arrangement GA drawings as-built
- Operation and Maintenance manual
- Spare parts recommendation list

### Continuous Improvement
- Monthly Quality Review meetings with root cause analysis of all NCRs
- Annual Management Review of quality objectives and KPIs
- Customer feedback analysis and corrective action implementation
- Supplier quality audits annual for critical suppliers
- Internal audits conducted quarterly across all departments`
  },
  {
    title: "Safety Record and HSE Summary",
    tags: ["Safety", "HSE", "Environment", "Record"],
    industry: "General" as const,
    content: `## Safety Record and HSE Summary

### Safety Philosophy
No job is so urgent that it cannot be done safely. At RightSense, safety is our first value - ahead of production, schedule, and cost. Every employee has the authority and responsibility to stop any work they believe is unsafe.

### Cumulative Safety Performance
- **Total Safe Man-Hours:** 4.5 Million+ as of March 2026
- **Lost Time Injury Frequency Rate LTIFR:** 0.00 per million man-hours last 3 years
- **Total Recordable Incident Rate TRIR:** 0.05 industry benchmark: 0.5
- **Near Miss Reporting Rate:** 8.2 per 100 employees per month indicating strong reporting culture
- **HSE Training Hours:** 56,100 hours in FY 2025-26

### HSE Awards and Recognition
- National Safety Council NSC - Zero Accident Sword of Honour 2023, 2024
- OISD Safety Award - Best Safety Performance, Instrumentation Category 2024
- BPCL Vendor Safety Award - Best Contractor Safety, Kochi Refinery 2024
- CII EHS Excellence Award - Certificate of Merit 2025
- IOCL - Certificate of Appreciation for Zero LTI at Gujarat Refinery Project 2025

### HSE Certifications
- ISO 45001:2018 - Occupational Health and Safety Management System
- ISO 14001:2015 - Environmental Management System
- All site supervisors: NEBOSH IGC / IOSH Managing Safely certified
- First Aid trained personnel: Minimum 10% of workforce at every project site

### Environmental Commitment
- Zero Liquid Discharge ZLD at both manufacturing facilities
- 40% of factory energy from rooftop solar 1.2 MW capacity
- Waste recycling rate: 92%+
- Carbon footprint tracking and annual reduction targets
- Tree plantation drives: 5,000+ trees planted in last 3 years`
  },
  {
    title: "Client Testimonials and References",
    tags: ["Testimonials", "References", "Clients", "Track Record"],
    industry: "General" as const,
    content: `## Client Testimonials and Project References

### Testimonials

**Mr. R.K. Gupta, GM Projects, BPCL Kochi Refinery:**
RightSense has been our trusted valve supplier for over 8 years. Their on-time delivery performance, consistent quality, and responsive after-sales support set them apart. We have approved them for all our upcoming expansion projects.

**Mr. Sanjay Mehta, Head of Procurement, L&T Hydrocarbon Engineering:**
We have engaged RightSense for instrumentation and control packages on multiple refinery projects. Their engineering quality, safety record, and project execution capability are excellent. They are one of our preferred I&C contractors.

**Mr. Anil Deshmukh, Chief Engineer, NMMC Water Supply:**
RightSense Pumps Division delivered and commissioned 18 pump sets for our Morbe WTP expansion within the committed timeline. The pumps have been running efficiently for over 2 years with minimal maintenance. Their 24/7 service support gives us confidence.

### Key Project References

| Client | Project | Scope | Value Rs. Cr | Year |
|--------|---------|-------|-------------|------|
| BPCL | Kochi IREP Phase-III | 340 nos. Gate Valves API 600 | 8.47 | 2025 |
| IOCL | Gujarat Refinery Expansion | 520 nos. Ball and Gate Valves | 12.30 | 2024 |
| HPCL | Vizag Refinery VRDMP | 280 nos. Check and Gate Valves | 6.85 | 2024 |
| Reliance | Jamnagar O2C | 180 nos. Trunnion Ball Valves | 15.60 | 2023 |
| ONGC | Mumbai High Offshore | 95 nos. API 6A Wellhead Valves | 4.20 | 2023 |
| NMMC | Morbe WTP 120 MLD | 18 nos. Centrifugal Pump Packages | 4.85 | 2024 |
| PMC Pune | 24/7 Water Supply Scheme | 45 nos. Distribution Pumps | 3.25 | 2024 |
| MRPL | Phase-IV CDU/VDU | I&C System DEPIC | 48.50 | 2025 |
| BPCL | Bina Refinery Expansion | I&C System DEPIC | 32.00 | 2024 |
| L&T | HPCL Barmer Refinery | I&C Package Installation and Commissioning | 22.75 | 2023 |

### Approved Vendor Status
RightSense is on the Approved Vendor List AVL of the following organizations:
- BPCL, IOCL, HPCL, ONGC, GAIL, OIL India, MRPL, CPCL, NRL
- Reliance Industries, Nayara Energy, Cairn Oil and Gas
- L&T, Tata Projects, TOYO, Technip Energies, Worley, Jacobs
- NTPC, NHPC, Adani Power, Tata Power, JSW Energy
- ADNOC UAE, Saudi Aramco KSA, KNPC Kuwait, Petronas Malaysia`
  },
  {
    title: "Proposal Submission Checklist",
    tags: ["Checklist", "Proposal", "Submission", "Onboarding"],
    industry: "General" as const,
    content: `## Proposal Submission Checklist - Quick Reference

Use this checklist before submitting any proposal to ensure completeness and compliance:

### Pre-Submission Checks
- RFP/Tender document thoroughly reviewed by technical and commercial teams
- Pre-bid queries raised and clarifications received from client
- Site visit completed if required by tender
- Compliance matrix prepared against all mandatory requirements
- Technical deviations list prepared and approved by Engineering Head
- All required certifications and approvals are current and valid

### Technical Proposal
- Executive Summary tailored to client specific requirements
- Technical specifications clearly match RFP requirements point-by-point
- All applicable codes and standards referenced correctly
- Material selection justified with corrosion/compatibility analysis
- Quality Control Plan QCP aligned with client inspection requirements
- Project schedule with milestone dates and critical path identified
- Manpower deployment plan with key personnel CVs
- Past project references relevant to this scope
- HSE plan and safety statistics included
- Drawings/datasheets attached GA, P&ID references, instrument specs

### Commercial Proposal
- Price schedule in client required format
- All line items priced no missing items
- Taxes and duties clearly specified
- Payment terms as per tender or clearly state deviations
- Delivery schedule realistic and achievable
- Warranty terms as per tender requirements
- Bank Guarantee / EMD / Bid Bond arranged if required
- Validity period clearly stated

### Documentation and Formatting
- Proposal bound and formatted as per tender instructions
- Page numbering and table of contents included
- All sections cross-referenced properly
- Company seal and authorized signatory on all required pages
- Hard copies and soft copies prepared as required
- Submission envelope marked as per tender instructions
- Courier/submission arranged to reach before deadline

### Final Review
- Reviewed by Department Head Technical
- Reviewed by Finance Head Commercial
- Approved by Managing Director / Authorized Signatory
- Compliance certificate signed`
  },
  {
    title: "Frequently Asked Questions - For New Clients",
    tags: ["FAQ", "Onboarding", "New Client", "Questions"],
    industry: "General" as const,
    content: `## Frequently Asked Questions - New Client Onboarding

**Q1: What industries do you serve?**
We serve oil and gas, refinery, petrochemical, power generation, water and wastewater, pharmaceutical, and general process industries. Our three main verticals are: Valve Manufacturing, Pump Manufacturing, and Instrumentation and Control System Engineering EPC.

**Q2: What is your typical delivery lead time?**
Standard valves 2 to 8 inch, Class 150-300: 10-12 weeks. Large bore/high pressure valves: 14-18 weeks. API 610 pumps: 16-22 weeks. I&C engineering packages: 4-18 months depending on scope. Expedited delivery available at a premium of 5-10%.

**Q3: Do you offer third-party inspection?**
Yes. All our products are offered for stage-wise and final inspection by client-nominated TPI agencies such as EIL, LRIS, Bureau Veritas, TUV, SGS, or any other approved agency. We provide minimum 5 working days advance notice for all inspection calls.

**Q4: What certifications do you hold?**
ISO 9001:2015, ISO 14001:2015, ISO 45001:2018, API 6D Monogram, API 600 Monogram, API 594 Monogram, PED 2014/68/EU Module H, ATEX 2014/34/EU, IBR Approval. We are on the approved vendor list of BPCL, IOCL, HPCL, ONGC, GAIL, Reliance, L&T, Tata Projects, and 30+ other major companies.

**Q5: What is your minimum order quantity?**
There is no minimum order quantity. We welcome orders from single valves to large project packages of 500+ items.

**Q6: Do you provide installation and commissioning support?**
Yes. For pump packages and I&C systems, we provide complete installation supervision and commissioning assistance. For valves, we offer site supervision for installation guidance on request.

**Q7: How do you handle warranty claims?**
Warranty claims are processed within 48 hours of receiving the complaint. For critical failures, our field service team reaches the site within 4 hours metro cities or 24 hours other locations. Defective parts are replaced free of charge during the warranty period.

**Q8: Do you offer customized products?**
Absolutely. Our in-house R&D and design team can engineer valves and pumps to customer-specific requirements including exotic materials Hastelloy, Inconel, Monel, Titanium, special coatings ENP, hard chrome, tungsten carbide, and non-standard sizes or ratings.

**Q9: What are your payment terms for first-time customers?**
For first-time customers, our standard terms are: 30% advance with PO, 60% before dispatch, 10% post-commissioning. We are flexible and can work with LC-backed payments or milestone-based terms for large projects.

**Q10: How can I get a quotation?**
Send your enquiry to sales@rightsense.in with the following details: product specifications size, class, material, end connection, quantity, delivery location, required delivery date, and any project-specific requirements. We will respond with a detailed technical and commercial offer within 2-3 working days.`
  }
];

// ==================== SEED FUNCTION ====================

async function seedVault() {
  const user = await prisma.user.findFirst({
    where: { email: "mohan@rightsense.in" },
  });

  if (!user) {
    console.error("User mohan@rightsense.in not found! Cannot seed vault.");
    process.exit(1);
  }

  console.log("Seeding vault for user: " + user.name + " (" + user.email + ")");

  // Seed Vault Documents with Sections
  for (const doc of vaultDocuments) {
    const existing = await prisma.vaultDocument.findFirst({
      where: { userId: user.id, filename: doc.filename },
    });

    if (existing) {
      console.log("  [SKIP] Document already exists: " + doc.filename);
      continue;
    }

    const vaultDoc = await prisma.vaultDocument.create({
      data: {
        userId: user.id,
        filename: doc.filename,
        fileType: doc.fileType,
        documentType: doc.documentType,
        industry: doc.industry,
        tags: doc.tags,
        extractedSectionsCount: doc.sections.length,
        isPublic: false,
      },
    });

    for (const section of doc.sections) {
      await prisma.vaultSection.create({
        data: {
          documentId: vaultDoc.id,
          sectionTitle: section.sectionTitle,
          content: section.content,
          sectionType: section.sectionType,
          industryTags: section.industryTags,
        },
      });
    }

    console.log("  [OK] Created document: " + doc.filename + " (" + doc.sections.length + " sections)");
  }

  // Seed Text Entries
  for (const entry of textEntries) {
    const existing = await prisma.vaultTextEntry.findFirst({
      where: { userId: user.id, title: entry.title },
    });

    if (existing) {
      console.log("  [SKIP] Text entry already exists: " + entry.title);
      continue;
    }

    await prisma.vaultTextEntry.create({
      data: {
        userId: user.id,
        title: entry.title,
        content: entry.content,
        tags: entry.tags,
        industry: entry.industry,
      },
    });

    console.log("  [OK] Created text entry: " + entry.title);
  }

  console.log("\nVault seeding complete!");
  console.log("   Documents: " + vaultDocuments.length);
  console.log("   Text Entries: " + textEntries.length);
}

seedVault()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
