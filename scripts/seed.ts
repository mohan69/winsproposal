import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("johndoe123", 12);

  const demoUser = await prisma.user.upsert({
    where: { email: "john@doe.com" },
    update: {},
    create: {
      email: "john@doe.com",
      passwordHash,
      name: "John Doe",
      role: "admin",
      companyName: "WinsProposal",
    },
  });

  // Seed LinkedIn posts
  const linkedInPosts = [
    {
      postText: `Still building proposals from scratch every time an RFP lands?\n\nHere's what I see at most manufacturing companies:\n→ 3-5 days per proposal\n→ Engineers pulled away from core work\n→ Copy-pasting from old proposals (hoping nothing's outdated)\n→ Missing compliance items discovered at the last minute\n\nThe companies winning more deals have stopped doing this manually.\n\nThey've built a "proposal knowledge vault" — a single source of truth for every technical spec, certification, and project reference they've ever submitted.\n\nWhen a new RFP arrives, they match requirements to proven content in minutes, not days.\n\nResult? 60% faster turnaround. Zero compliance gaps. More RFPs responded to.\n\nIf you're in valves, pumps, or EPC, this is the competitive edge you're missing.\n\n#ManufacturingSales #RFPResponse #ProposalAutomation #IndustrialSales #B2BSales`,
      hashtags: ["ManufacturingSales", "RFPResponse", "ProposalAutomation", "IndustrialSales", "B2BSales"],
      topic: "RFP Pain Points",
      suggestedDay: "Monday",
    },
    {
      postText: `"We lost the deal because our proposal was 2 days late."\n\nHeard this from an EPC company last week. They had the best technical solution. The most competitive pricing. 15 years of relevant experience.\n\nBut their proposal team was stretched across 4 other bids.\n\nHere's the math that changed their perspective:\n\n📊 Before automation:\n• 5 days per proposal\n• 8 proposals/month capacity\n• 3 missed deadlines per quarter\n\n📊 After automation:\n• 2 days per proposal\n• 20 proposals/month capacity  \n• Zero missed deadlines\n\nThe ROI isn't just about speed — it's about the deals you're currently leaving on the table.\n\nEvery missed RFP deadline is revenue walking out the door.\n\n#EPC #ProposalManagement #SalesEfficiency #ManufacturingGrowth #WinRate`,
      hashtags: ["EPC", "ProposalManagement", "SalesEfficiency", "ManufacturingGrowth", "WinRate"],
      topic: "Proposal Automation Benefits",
      suggestedDay: "Wednesday",
    },
    {
      postText: `The Technical Bid Evaluation (TBE) is where valve and pump manufacturers win or lose deals.\n\nYet most teams fill TBE sheets manually — line by line, tag by tag.\n\nMaterial? Check the catalog.\nPressure rating? Check the datasheet.\nEnd connection? Check the drawing.\nCertification? Check compliance docs.\n\nFor 200+ line items, this takes DAYS.\n\nWhat if your knowledge vault already had every answer?\n\nImagine uploading an RFP and having AI match each line item to your exact specifications — pulling from your own technical documents, past proposals, and product catalogs.\n\nThat's not science fiction. That's what smart manufacturers are doing right now.\n\nThe TBE used to be your bottleneck. Now it's your competitive advantage.\n\n#ValveManufacturing #PumpManufacturing #TechnicalBid #EngineeringSales #IndustryAutomation`,
      hashtags: ["ValveManufacturing", "PumpManufacturing", "TechnicalBid", "EngineeringSales", "IndustryAutomation"],
      topic: "TBE Automation",
      suggestedDay: "Tuesday",
    },
    {
      postText: `5 signs your proposal process needs an upgrade:\n\n1️⃣ Your best engineers spend 40% of their time on proposals instead of engineering\n\n2️⃣ You have proposal content scattered across 50+ Word docs, PDFs, and email threads\n\n3️⃣ New team members take 6 months to write their first quality proposal\n\n4️⃣ You're submitting the same company profile and certifications differently every time\n\n5️⃣ Your win rate has plateaued despite improving your technical offerings\n\nIf you nodded at 3 or more — you don't have a sales problem. You have a proposal infrastructure problem.\n\nThe fix isn't hiring more people. It's centralizing your institutional knowledge and letting AI do the heavy lifting.\n\nYour engineers should engineer. Your proposals should write themselves.\n\n#SalesLeadership #ManufacturingExcellence #ProcessImprovement #B2BMarketing #GrowthStrategy`,
      hashtags: ["SalesLeadership", "ManufacturingExcellence", "ProcessImprovement", "B2BMarketing", "GrowthStrategy"],
      topic: "Pain Point Awareness",
      suggestedDay: "Thursday",
    },
    {
      postText: `Case study: How a mid-size valve manufacturer 3x'd their RFP response rate\n\n🏭 Company: 200-person valve OEM, specializing in API 600/602 gate and globe valves\n\n❌ The problem:\n• Receiving 25+ RFPs/month\n• Only responding to 8-10 (capacity constraint)\n• Each proposal took the engineering team 4-5 days\n• Win rate: 22%\n\n✅ The transformation:\n1. Built a centralized knowledge vault with all technical specs, certifications, and past proposals\n2. Automated TBE sheet filling using AI-matched specifications\n3. Generated first-draft proposals in hours, not days\n4. Added compliance checklists to catch gaps before submission\n\n📈 Results after 3 months:\n• Responding to 22+ RFPs/month (from 8)\n• Proposal turnaround: 1.5 days (from 4.5)\n• Win rate: 31% (up from 22%)\n• Revenue impact: ₹2.3 Cr additional pipeline\n\nThe best part? Their engineers are back to doing what they love — engineering.\n\n#CaseStudy #ManufacturingROI #SalesTransformation #IndustrialGrowth #ProposalWins`,
      hashtags: ["CaseStudy", "ManufacturingROI", "SalesTransformation", "IndustrialGrowth", "ProposalWins"],
      topic: "Case Study / Social Proof",
      suggestedDay: "Friday",
    },
  ];

  for (const post of linkedInPosts) {
    const text = post.postText;
    await prisma.linkedInPost.upsert({
      where: { id: post.topic.toLowerCase().replace(/[^a-z0-9]/g, "-") },
      update: {},
      create: {
        id: post.topic.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        postText: text,
        hashtags: post.hashtags,
        topic: post.topic,
        characterCount: text.length,
        suggestedDay: post.suggestedDay,
      },
    });
  }

  const demoKnowledgeAssets = [
    {
      title: "Historical Proposal Response - API 600 Gate Valves",
      industry: "Valves" as const,
      tags: ["historical-response", "api-600", "gate-valve", "refinery"],
      content: `We confirm compliance with API 600 latest edition for cast steel gate valves in refinery isolation service. The offered valves include bolted bonnet construction, renewable seat rings, full material traceability, hydrostatic shell and seat testing per API 598, PMI on pressure-retaining components, and final documentation including MTCs, ITP, dimensional records, and test certificates. Deviations, if any, will be recorded in a controlled deviation register and submitted for client approval before manufacturing release.`,
    },
    {
      title: "Technical Clause - API 600 Valve Inspection and Testing",
      industry: "Valves" as const,
      tags: ["technical-clause", "api-600", "inspection", "testing"],
      content: `All API 600 valves shall be inspected against approved drawings, datasheets, and ITP hold points. Mandatory tests include shell hydrotest, high-pressure closure test, low-pressure seat test where applicable, backseat test, visual inspection, marking verification, coating inspection, and final preservation check. Witness and hold points shall be aligned with client inspection requirements before PO acknowledgement.`,
    },
    {
      title: "Valve Specification - Refinery Isolation Service",
      industry: "Valves" as const,
      tags: ["specification", "valve", "refinery", "nace"],
      content: `Body and bonnet materials shall match the line class and fluid service. Sour service applications shall comply with NACE MR0175 / ISO 15156. Trim selection shall consider corrosion, erosion, temperature, pressure class, and shut-off requirement. Stem packing shall support low-emission operation, and fire-safe certification shall be provided for applicable quarter-turn and isolation valve packages.`,
    },
    {
      title: "Pump Technical Specification - API 610 Centrifugal Pump",
      industry: "Pumps" as const,
      tags: ["specification", "api-610", "centrifugal-pump", "npsh"],
      content: `The pump package shall be designed in accordance with API 610 / ISO 13709. The proposal shall include rated flow, rated head, efficiency, NPSHR, NPSHA margin statement, minimum continuous stable flow, preferred operating region, driver rating, seal plan per API 682, coupling, baseplate, testing scope, vibration acceptance limits, and performance guarantee conditions.`,
    },
    {
      title: "Compliance Template - Industrial Proposal Review",
      industry: "EPC" as const,
      tags: ["compliance-template", "proposal-review", "deviation-register"],
      content: `Compliance review shall map every mandatory RFP clause to one of four statuses: compliant, partially compliant, deviation requested, or not applicable. Each deviation shall include clause reference, reason, technical impact, commercial impact, mitigation, and approval status. Final proposal release requires closure of all mandatory compliance items or explicit management approval.`,
    },
    {
      title: "Deviation Example - Pump Seal Plan Alternative",
      industry: "Pumps" as const,
      tags: ["deviation", "api-682", "seal-plan", "pump"],
      content: `Client requested API 682 Plan 53B for all hazardous service pumps. We propose Plan 53A for non-critical clean hydrocarbon service where operating pressure and temperature remain within acceptable limits. The alternative reduces complexity while maintaining seal reliability. Supporting evidence includes seal vendor recommendation, fluid compatibility review, and lifecycle maintenance comparison.`,
    },
    {
      title: "Engineering Workflow Template - EPC Proposal Package",
      industry: "EPC" as const,
      tags: ["engineering-workflow", "epc", "proposal-lifecycle", "dependencies"],
      content: `The EPC proposal workflow begins with RFP intake and bid/no-bid review, followed by engineering basis development, discipline inputs, vendor budgetary offers, construction methodology, HSE review, QA/QC review, commercial consolidation, management approval, and final submission. Key dependencies include P&IDs, line list, equipment datasheets, geotechnical inputs, battery limits, and client standards.`,
    },
    {
      title: "Industrial Automation Workflow - FAT and SAT",
      industry: "EPC" as const,
      tags: ["automation", "fat", "sat", "scada", "plc"],
      content: `Automation proposals shall include control system architecture, PLC/SCADA scope, I/O count assumptions, panel design basis, network topology, cybersecurity boundary, cause-and-effect validation, FAT procedure, SAT procedure, commissioning support, backup strategy, and operator training plan. Deliverables include instrument index, I/O list, loop diagrams, logic narratives, and as-built documentation.`,
    },
  ];

  for (const asset of demoKnowledgeAssets) {
    await prisma.vaultTextEntry.upsert({
      where: { id: asset.title.toLowerCase().replace(/[^a-z0-9]/g, "-") },
      update: {
        content: asset.content,
        tags: asset.tags,
        industry: asset.industry,
      },
      create: {
        id: asset.title.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        userId: demoUser.id,
        title: asset.title,
        content: asset.content,
        tags: asset.tags,
        industry: asset.industry,
      },
    });
  }

  console.log("Seed completed successfully (including LinkedIn posts and demo knowledge assets)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
