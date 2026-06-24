import { prisma } from "@/lib/db";
import { calculateWinScore } from "@/lib/win-score";
import { patchBidNoBidScore } from "@/lib/severe-service-intelligence";

const VAULT_BACKED_SECTION_TITLES = [
  "Scope of Supply / Line Items",
  "Process Conditions / Service Conditions",
  "Technical Specification Response",
  "Datasheet Summary",
  "Compliance Matrix",
  "Technical Bid Evaluation Summary",
  "Inspection and Testing Plan",
  "QA/QC and Documentation Plan",
];

async function refreshProposal(proposalId: string) {
  try {
    console.log(`Refreshing proposal: ${proposalId}`);

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        sections: { orderBy: { orderIndex: "asc" } },
        complianceChecklist: true,
      },
    });

    if (!proposal) {
      console.error(`Proposal not found: ${proposalId}`);
      return { success: false, error: "Proposal not found" };
    }

    console.log(`Original winScore: ${proposal.winScore ?? "N/A"}`);
    console.log(`Sections: ${proposal.sections.length}`);
    console.log(`Vault sections used (stored): ${proposal.vaultSectionsUsed}`);
    console.log(`Vault documents used (stored): ${proposal.vaultDocumentsUsed}`);

    // 1. Recalculate win score
    const checklistItems = (proposal.complianceChecklist?.checklistItems ?? []) as any[];
    const complianceChecked = checklistItems.filter((item: any) => item?.checked).length;
    const complianceTotal = checklistItems.length;

    const scoreResult = calculateWinScore({
      sections: proposal.sections,
      vaultSectionsUsed: proposal.vaultSectionsUsed,
      vaultDocumentsUsed: proposal.vaultDocumentsUsed,
      templateType: proposal.templateType,
      industry: proposal.industry,
      hasCompliance: !!proposal.complianceChecklist,
      complianceChecked,
      complianceTotal,
    });

    const newScore = scoreResult.total;
    console.log(`Recalculated winScore: ${newScore}`);

    // 2. Update sourceType/sourceName for known vault-backed sections
    let vaultSectionCount = 0;
    for (const section of proposal.sections) {
      const isVaultBacked = VAULT_BACKED_SECTION_TITLES.includes(section.sectionTitle);
      if (isVaultBacked) {
        if (section.sourceType !== "vault" || !section.sourceName) {
          await prisma.proposalSection.update({
            where: { id: section.id },
            data: {
              sourceType: "vault",
              sourceName: section.sourceName || "Knowledge Vault",
            },
          });
          console.log(`  Updated section "${section.sectionTitle}": sourceType=vault, sourceName="${section.sourceName || "Knowledge Vault"}"`);
        }
        vaultSectionCount++;
      }
    }

    // 3. Rewrite Bid / No-Bid Scoring section content with correct score
    const bidNoBidSection = proposal.sections.find(
      (s) => s.sectionTitle === "Bid / No-Bid Scoring"
    );

    if (bidNoBidSection) {
      const updatedContent = patchBidNoBidScore(bidNoBidSection.content, newScore);
      if (updatedContent !== bidNoBidSection.content) {
        await prisma.proposalSection.update({
          where: { id: bidNoBidSection.id },
          data: { content: updatedContent },
        });
        console.log(`  Rewrote Bid / No-Bid Scoring content with score ${newScore}/100`);
      } else {
        console.log(`  Bid / No-Bid Scoring section already reflects score ${newScore}/100`);
      }
    }

    // 4. Update proposal-level metadata
    await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        winScore: newScore,
        vaultSectionsUsed: vaultSectionCount,
      },
    });

    console.log(`\n✓ Proposal ${proposalId} refreshed successfully`);
    console.log(`  New winScore: ${newScore}/100`);
    console.log(`  Vault sections: ${vaultSectionCount}`);
    console.log(`  Vault documents: ${proposal.vaultDocumentsUsed}`);

    return { success: true, newScore, vaultSectionCount };
  } catch (error) {
    console.error(`\n✗ Error refreshing proposal ${proposalId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  } finally {
    await prisma.$disconnect();
  }
}

const proposalId = process.argv[2];
if (!proposalId) {
  console.error("Usage: npx tsx scripts/refresh-proposal.ts <proposal-id>");
  process.exit(1);
}

refreshProposal(proposalId)
  .then((result) => {
    if (result.success) {
      console.log(`\nDone. Score: ${result.newScore}/100`);
      process.exit(0);
    } else {
      console.error(`\nFailed: ${result.error}`);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error(`\nUnexpected error:`, error);
    process.exit(1);
  });
