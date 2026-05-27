/**
 * Dynamic Win Score Calculator
 * Scores proposals based on multiple factors:
 * - Vault coverage (sections sourced from vault vs generated)
 * - Section completeness (word count / depth)
 * - RFP requirement matching
 * - Template alignment
 * - Compliance readiness
 */

interface ScoreInput {
  sections: Array<{
    content: string;
    sourceType: string;
    sectionTitle: string;
  }>;
  vaultSectionsUsed: number;
  vaultDocumentsUsed: number;
  templateType: string;
  industry: string;
  hasCompliance: boolean;
  complianceChecked?: number;
  complianceTotal?: number;
  rfpRequirementsCount?: number;
}

export interface ScoreBreakdown {
  total: number;
  vaultCoverage: { score: number; max: number; label: string };
  sectionDepth: { score: number; max: number; label: string };
  templateMatch: { score: number; max: number; label: string };
  complianceReady: { score: number; max: number; label: string };
  contentQuality: { score: number; max: number; label: string };
}

export function calculateWinScore(input: ScoreInput): ScoreBreakdown {
  const {
    sections,
    vaultSectionsUsed,
    vaultDocumentsUsed,
    templateType,
    industry,
    hasCompliance,
    complianceChecked = 0,
    complianceTotal = 0,
  } = input;

  // 1. Vault Coverage (0-30 points)
  // Higher score when more sections are vault-sourced
  const totalSections = sections.length || 1;
  const vaultRatio = vaultSectionsUsed / totalSections;
  const docBonus = Math.min(vaultDocumentsUsed * 2, 10); // up to 10 bonus for doc diversity
  const vaultCoverageScore = Math.round(Math.min(vaultRatio * 20 + docBonus, 30));

  // 2. Section Depth (0-25 points)
  // Based on average word count per section
  const wordCounts = sections.map((s) => (s.content || "").split(/\s+/).length);
  const avgWords = wordCounts.length > 0 ? wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length : 0;
  const shortSections = wordCounts.filter((w) => w < 50).length;
  const depthBase = Math.min(avgWords / 200, 1) * 20; // Full 20 at 200+ avg words
  const shortPenalty = Math.min(shortSections * 2, 10);
  const sectionDepthScore = Math.round(Math.max(depthBase - shortPenalty + (totalSections >= 5 ? 5 : totalSections), 0));

  // 3. Template Match (0-15 points)
  // Industry-specific template scores higher
  let templateScore = 5; // General template baseline
  if (templateType !== "General" && industry !== "General") {
    templateScore = 15; // Full marks for industry-specific
  } else if (templateType !== "General" || industry !== "General") {
    templateScore = 10; // Partial for one match
  }

  // 4. Compliance Readiness (0-15 points)
  let complianceScore = 0;
  if (hasCompliance && complianceTotal > 0) {
    const checkRatio = complianceChecked / complianceTotal;
    complianceScore = Math.round(checkRatio * 12 + 3); // 3 base for having checklist
  } else if (hasCompliance) {
    complianceScore = 3; // Just having a checklist
  }

  // 5. Content Quality (0-15 points)
  // Checks for structural indicators in content
  let qualityScore = 0;
  const allContent = sections.map((s) => s.content).join(" ").toLowerCase();
  // Technical specificity
  if (/\bapi\b|\biso\b|\basme\b|\bastm\b|\bnace\b|\bdin\b/.test(allContent)) qualityScore += 3;
  // Quantitative data
  if (/\b\d+\s*(mm|inch|bar|psi|kg|mpa|°c|°f)\b/i.test(allContent)) qualityScore += 3;
  // Section variety
  const uniqueTitles = new Set(sections.map((s) => s.sectionTitle.toLowerCase().trim()));
  if (uniqueTitles.size >= 6) qualityScore += 4;
  else if (uniqueTitles.size >= 4) qualityScore += 2;
  // Length bonus
  const totalWords = wordCounts.reduce((a, b) => a + b, 0);
  if (totalWords > 2000) qualityScore += 3;
  else if (totalWords > 1000) qualityScore += 2;
  else if (totalWords > 500) qualityScore += 1;
  qualityScore = Math.min(qualityScore, 15);

  const total = Math.min(
    vaultCoverageScore + sectionDepthScore + templateScore + complianceScore + qualityScore,
    100
  );

  return {
    total,
    vaultCoverage: { score: vaultCoverageScore, max: 30, label: "Vault Coverage" },
    sectionDepth: { score: sectionDepthScore, max: 25, label: "Section Depth" },
    templateMatch: { score: templateScore, max: 15, label: "Template Match" },
    complianceReady: { score: complianceScore, max: 15, label: "Compliance" },
    contentQuality: { score: qualityScore, max: 15, label: "Content Quality" },
  };
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (score >= 60) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-red-100 text-red-700 border-red-200";
}
