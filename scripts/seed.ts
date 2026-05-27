import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("johndoe123", 12);

  await prisma.user.upsert({
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

  console.log("Seed completed successfully (including LinkedIn posts)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
