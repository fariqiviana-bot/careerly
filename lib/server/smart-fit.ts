export interface SmartFitInput {
  content: Record<string, any>;
  seriesId: string;
  pageSize: "A4" | "Letter";
  targetPages: 1 | 2 | 3;
}

export interface SmartFitResult {
  targetPages: 1 | 2 | 3;
  recommendedPages: 1 | 2 | 3;
  estimatedFillPercent: number;
  status: "balanced" | "tightened" | "expanded" | "overflow-warning";
  summary: string;
  settings: {
    pageSize: "A4" | "Letter";
    pageCount: 1 | 2 | 3;
    fontSize: number;
    lineHeight: number;
    sectionSpacing: number;
    pageMargin: number;
  };
  metrics: {
    wordCount: number;
    roleCount: number;
    bulletCount: number;
    skillCount: number;
  };
}

const TWO_COL_SERIES = new Set(["2", "3", "4", "22", "24"]);

function countWords(text: string): number {
  return (text || "").trim().split(/\s+/).filter(Boolean).length;
}

export function computeSmartPageFit(input: SmartFitInput): SmartFitResult {
  const c = input.content || {};
  const isTwoCol = TWO_COL_SERIES.has(String(input.seriesId || "11"));
  const isLetter = input.pageSize === "Letter";
  const targetPages = input.targetPages;

  const experience: any[] = Array.isArray(c.experience)
    ? c.experience.filter((e) => !e?.hidden)
    : [];
  const education: any[] = Array.isArray(c.education) ? c.education : [];
  const skills: string[] = Array.isArray(c.skills) ? c.skills : [];
  const techSkills: string[] = Array.isArray(c.technicalSkills) ? c.technicalSkills : [];
  const certs: any[] = Array.isArray(c.certifications) ? c.certifications : [];

  let bulletCount = 0;
  let expWords = 0;
  for (const e of experience) {
    const bl: string[] =
      Array.isArray(e.bullets) && e.bullets.length > 0
        ? e.bullets
        : String(e.description || "")
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean);
    bulletCount += bl.length;
    expWords += countWords(`${e.role || ""} ${e.company || ""} ${e.overview || ""} ${bl.join(" ")}`);
  }

  const summaryWords = countWords(String(c.summary || ""));
  const skillCount = skills.length + techSkills.length;
  const wordCount = summaryWords + expWords + education.length * 14 + skillCount * 2 + certs.length * 10;

  // Effective capacity per page (Letter is ~6% shorter vertically than A4; 2-column holds slightly more sidebar items)
  const baseCapacityPerPage = (isTwoCol ? 540 : 490) * (isLetter ? 0.94 : 1.0);
  const effectiveLoad = wordCount + experience.length * 22 + bulletCount * 6;
  const rawFillRatio = effectiveLoad / (baseCapacityPerPage * targetPages);
  const estimatedFillPercent = Math.round(rawFillRatio * 100);

  const recommendedPages: 1 | 2 | 3 =
    effectiveLoad <= baseCapacityPerPage * 1.15
      ? 1
      : effectiveLoad <= baseCapacityPerPage * 2.15
      ? 2
      : 3;

  let fontSize = 10;
  let lineHeight = 1.35;
  let sectionSpacing = 14;
  let pageMargin = 0.48;
  let status: SmartFitResult["status"] = "balanced";
  let summary = "";

  if (rawFillRatio > 1.25) {
    // Heavy overflow: tighten to safe ATS minimums & suggest adding a page
    fontSize = 9.1;
    lineHeight = 1.22;
    sectionSpacing = 9;
    pageMargin = 0.36;
    status = "overflow-warning";
    summary = `Content is dense (~${estimatedFillPercent}% of ${targetPages}P). Tightened spacing to safe minimums; consider switching to ${recommendedPages}P for optimal breathing room.`;
  } else if (rawFillRatio > 1.02) {
    // Mild spill (2-6 lines): gently compact within ±8% so it fits cleanly on targetPages
    fontSize = 9.5;
    lineHeight = 1.26;
    sectionSpacing = 11;
    pageMargin = 0.4;
    status = "tightened";
    summary = `Prevented spillover onto page ${targetPages + 1} by tightening font to 9.5pt, line height to 1.26, and margins to 0.40 in.`;
  } else if (rawFillRatio < 0.68) {
    // Sparse content: expand slightly so the page looks balanced and intentional
    fontSize = 10.5;
    lineHeight = 1.44;
    sectionSpacing = 17;
    pageMargin = 0.56;
    status = "expanded";
    summary = `Expanded typography to 10.5pt and line spacing to 1.44 so your ${targetPages}-page layout feels well-balanced.`;
  } else {
    fontSize = 10;
    lineHeight = 1.35;
    sectionSpacing = 14;
    pageMargin = 0.46;
    status = "balanced";
    summary = `Balanced fit for ${targetPages} page(s) (${estimatedFillPercent}% page fill) with standard 10pt typography.`;
  }

  return {
    targetPages,
    recommendedPages,
    estimatedFillPercent,
    status,
    summary,
    settings: {
      pageSize: input.pageSize,
      pageCount: targetPages,
      fontSize,
      lineHeight,
      sectionSpacing,
      pageMargin,
    },
    metrics: {
      wordCount,
      roleCount: experience.length,
      bulletCount,
      skillCount,
    },
  };
}