import { test, expect } from "@playwright/test";
import JSZip from "jszip";

const SAMPLE_RESUME = {
  name: "Sara Mohammadi",
  role: "Senior Product Designer",
  email: "sara@example.com",
  phone: "+98 912 123 4567",
  location: "Tehran, Iran",
  linkedin: "linkedin.com/in/saramohammadi",
  summary:
    "Product designer with 8 years of experience creating user-centered digital products across fintech and e-commerce.",
  skills: ["Product Design", "Design Systems", "UX Research", "Prototyping", "Usability Testing", "Wireframing"],
  technicalSkills: ["Figma", "Adobe XD", "HTML", "CSS"],
  experience: [
    {
      id: "e1",
      role: "Senior Product Designer",
      company: "DigiPlus",
      location: "Tehran, Iran",
      period: "Jan 2021 - Present",
      bullets: [
        "Led a 6-person design team and built a unified design system across 4 products",
        "Increased checkout conversion by 32% through user research and iterative redesign",
      ],
    },
    {
      id: "e2",
      role: "UI/UX Designer",
      company: "Naqsh Studio",
      location: "Tehran, Iran",
      period: "Jun 2018 - Dec 2020",
      bullets: [
        "Designed 20+ mobile and web applications for clients in fintech, retail, and health",
        "Planned and ran usability tests with 100+ participants",
      ],
    },
  ],
  education: [
    {
      id: "ed1",
      degree: "Master of Arts in Interaction Design",
      school: "University of Tehran",
      location: "Tehran, Iran",
      period: "2016 - 2018",
    },
  ],
  coverLetter: {
    date: "November 23, 2026",
    recipientName: "Hiring Manager",
    companyName: "Stripe",
    greeting: "Dear Hiring Manager,",
    openingParagraph: "I am excited to apply for the Senior Product Designer role at Stripe.",
    bodyParagraph: "Across 8 years of product design, I have led cross-functional systems and lifted conversion by 32%.",
    closingParagraph: "Thank you for your time and consideration.",
    signOff: "Sincerely,",
    signatureText: "Sara Mohammadi",
  },
  references: [
    {
      id: "r1",
      name: "Ali Rezaei",
      title: "VP of Product",
      company: "DigiPlus",
      phone: "+98 912 000 1122",
      email: "ali@digiplus.ir",
    },
  ],
};

test.describe("Farnavi Full-Stack Automated QA Suite", () => {
  test("1. Documents hub renders cleanly with zero console/network errors and no Invalid Date", async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedResponses: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
    page.on("pageerror", (e) => consoleErrors.push(e.message));
    page.on("response", (r) => { if (r.status() >= 400) failedResponses.push(`${r.status()} ${r.url()}`); });

    await page.goto("/documents", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("My Documents")).toBeVisible();
    await page.waitForTimeout(800);
    await expect(page.locator("body")).not.toContainText("Invalid Date");

    expect(failedResponses, `Failed HTTP responses: ${failedResponses.join(", ")}`).toEqual([]);
    expect(consoleErrors, `Console/Page errors: ${consoleErrors.join(" | ")}`).toEqual([]);
  });

  test("2. Editor studio loads, switches tabs (Analyzer, What ATS Sees, Job Matcher, AI Copilot, Designer) with zero errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.url().includes("/api/") && r.status() >= 500) errors.push(`${r.status()} ${r.url()}`);
    });

    await page.goto("/editor/doc-executive", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: /Content Editor/i })).toBeVisible();

    // Analyzer & Fix
    await page.getByRole("button", { name: /Analyzer & Fix/i }).click();
    await expect(page.getByText(/Resume Health:/i)).toBeVisible();
    await expect(page.getByText(/All 28 Checks Unlocked/i)).toBeVisible();

    // What ATS Sees toggle
    await page.getByRole("button", { name: /What ATS Sees/i }).click();
    await expect(page.getByText(/What ATS Systems See/i)).toBeVisible();
    await page.getByRole("button", { name: /What Recruiters See/i }).click();

    // Job Matcher & AI Tailor Diff
    await page.getByRole("button", { name: /Job Matcher/i }).click();
    await expect(page.getByText(/ATS Match Score/i)).toBeVisible();
    await page.getByRole("button", { name: /Preview AI Tailor Diff/i }).click();
    await expect(page.getByText(/Proposed Tailoring Diff/i)).toBeVisible();

    // AI Copilot Drawer + 3 Summary Options
    await page.getByRole("button", { name: /AI Copilot/i }).click();
    await expect(page.getByText("Farnavi AI Copilot", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /3 Summary Options/i }).click();
    await expect(page.getByText(/3 Tailored Summary Options/i)).toBeVisible();
    await page.getByRole("button", { name: "Close AI Copilot" }).click();

    // Designer sub-tabs
    await page.getByRole("button", { name: /Designer & Layout/i }).click();
    await page.getByRole("button", { name: /Layout & Fit/i }).click();
    await expect(page.getByText(/Smart Page Auto-Fit/i)).toBeVisible();
    await page.getByRole("button", { name: /Rearrange/i }).click();
    await expect(page.getByText(/Drag to Reorder/i)).toBeVisible();
    await page.getByRole("button", { name: /Sign & Photo/i }).click();
    await expect(page.getByText(/Cover Letter Signature/i)).toBeVisible();

    expect(errors, `Runtime errors: ${errors.join(" | ")}`).toEqual([]);
  });

  test("3. Phase 1 DB Persistence: Autosave & Version History API round-trip", async ({ request }) => {
    const testId = `qa_doc_${Date.now()}`;
    const createRes = await request.post("/api/documents", {
      data: { id: testId, title: "QA Persistence Test", seriesId: "14", content: SAMPLE_RESUME },
    });
    expect(createRes.status()).toBe(201);

    const patchRes = await request.patch(`/api/documents/${testId}`, {
      data: { title: "QA Updated Title", headerFooter: { headerText: "Sara QA", footerText: "", pageNumbering: "1/3" } },
    });
    expect(patchRes.ok()).toBeTruthy();

    const snapRes = await request.post(`/api/documents/${testId}/versions`, {
      data: { label: "QA Milestone", trigger: "manual" },
    });
    expect(snapRes.status()).toBe(201);

    const getRes = await request.get(`/api/documents/${testId}`);
    const body = await getRes.json();
    expect(body.document.title).toBe("QA Updated Title");
    expect(body.document.headerFooter.pageNumbering).toBe("1/3");
    expect(body.document.versions.length).toBeGreaterThanOrEqual(2);

    const delRes = await request.delete(`/api/documents/${testId}`);
    expect(delRes.ok()).toBeTruthy();
  });

  test("4. Phase 2 Smart Import strips browser print noise & separates Name / Role cleanly", async ({ request }) => {
    const noisyText = [
      "11/9/2026, 11:25 AM   Sara Mohammadi \u2014 Senior Product Designer Resume",
      "Sara Mohammadi",
      "Senior Product Designer",
      "sara@example.com | +98 912 123 4567 | linkedin.com/in/saramohammadi | Tehran, Iran",
      "SUMMARY",
      "Product designer with 8 years of experience building scalable design systems.",
      "EXPERIENCE",
      "Senior Product Designer  Jan 2021 - Present",
      "DigiPlus, Tehran, Iran",
      "- Built a unied design system for ntech clients",
      "SKILLS",
      "Design: Product Design, UX Design",
      "Tools: Figma, Miro",
      "1 of 2 11/9/2026, 11:25 AM",
      "https://9553c841-bab3-5317-a5ef-2b7d40a1a7c7.lovableproject.com/",
    ].join("\n");

    const res = await request.post("/api/import/parse", {
      data: { text: noisyText, sourceType: "paste" },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.parsed.name).toBe("Sara Mohammadi");
    expect(data.parsed.role).toBe("Senior Product Designer");
    expect(data.parsed.location).toBe("Tehran, Iran");
    expect(data.parsed.experience[0].bullets[0]).toContain("unified");
    expect(data.parsed.experience[0].bullets[0]).toContain("fintech");
    expect(data.parsed.technicalSkills).toContain("Figma");
  });

  test("5. Phase 6 Direct DOCX Injection Fidelity Audit (all 8 1P resumes + 2P Page-Break & Style Lock + Cover & References)", async ({ request }) => {
    const issues: string[] = [];

    // 5a. Audit ALL 8 1-page A4 templates
    for (const sId of ["2", "3", "4", "11", "12", "14", "22", "24"]) {
      const res = await request.post("/api/export/docx", {
        data: {
          seriesId: sId,
          kind: "resume",
          pageSize: "A4",
          pageCount: 1,
          fileName: `QA_Series_${sId}`,
          content: SAMPLE_RESUME,
        },
      });
      expect(res.ok(), `DOCX export HTTP failed for Series ${sId}`).toBeTruthy();

      const buf = await res.body();
      const zip = await JSZip.loadAsync(buf);
      const xml = await zip.files["word/document.xml"].async("string");

      if (!xml.includes("SARA") || !xml.includes("MOHAMMADI")) issues.push(`Series ${sId}: missing injected Name`);
      if (!xml.includes("SENIOR PRODUCT DESIGNER")) issues.push(`Series ${sId}: missing injected Role`);
      if (!xml.includes("DigiPlus")) issues.push(`Series ${sId}: missing injected Company`);
      if (!xml.includes("32%")) issues.push(`Series ${sId}: missing injected Bullet metric`);
      if (!xml.includes("University of Tehran")) issues.push(`Series ${sId}: missing injected Education`);

      if (xml.includes("SARA MOHAMMADI  \u2014  SENIOR PRODUCT DESIGNER")) {
        issues.push(`Series ${sId}: HEADER CORRUPTED (Name & Role merged with em-dash!)`);
      }

      if (sId === "14") {
        const p0 = xml.match(/<w:p(?:>|\s[^>]*[^\/]>)(?:(?!<w:p[\s>\/])[\s\S])*?<\/w:p>/)?.[0] || "";
        const hasTwoTone = p0.includes("SARA ") && p0.includes("8496B0") && p0.includes("MOHAMMADI");
        const hasTabAndRole = /<w:tab\s*\/>/.test(p0.replace(/<w:pPr[\s\S]*?<\/w:pPr>/g, "")) && p0.includes("44546A") && p0.includes("SENIOR PRODUCT DESIGNER");
        if (!hasTwoTone || !hasTabAndRole) {
          issues.push(`Series 14 1P: Header runs broken (hasTwoTone=${hasTwoTone}, hasTabAndRole=${hasTabAndRole})`);
        }
      }

      for (const oldName of ["JENNIFER DAVIS", "JAMES SMITH", "OLIVIA ANDERSON", "BLAKE TRUMAN", "JONAH ROMANO", "JACKSON CALDWELL", "THEO FINCH", "FLORENCE NIGHTINGALE"]) {
        if (xml.includes(oldName)) issues.push(`Series ${sId}: leftover persona name "${oldName}"`);
      }

      for (const tag of ["w:p", "w:r", "w:t"]) {
        const openRe = new RegExp(`<${tag}(?:>|\\s[^>]*[^\\/]> )`.replace(" ", ""), "g");
        const closeRe = new RegExp(`</${tag}>`, "g");
        const openCount = (xml.match(openRe) || []).length;
        const closeCount = (xml.match(closeRe) || []).length;
        if (openCount !== closeCount) {
          issues.push(`Series ${sId}: unbalanced <${tag}> tags (${openCount} vs ${closeCount})`);
        }
      }
    }

    // 5b. Audit 2-page US Letter export on Series 14 (Page 2 pageBreakBefore + exact sz:28/sp:75/#8496B0 + no leftover continuation skills)
    const s14p2Res = await request.post("/api/export/docx", {
      data: { seriesId: "14", kind: "resume", pageSize: "Letter", pageCount: 2, fileName: "QA_S14_2P", content: SAMPLE_RESUME },
    });
    expect(s14p2Res.ok()).toBeTruthy();
    const s14p2Xml = await (await JSZip.loadAsync(await s14p2Res.body())).files["word/document.xml"].async("string");
    const leafPs = [...s14p2Xml.matchAll(/<w:p(?:>|\s[^>]*[^\/]>)(?:(?!<w:p[\s>\/])[\s\S])*?<\/w:p>/g)].map((m) => m[0]);
    const namePs = leafPs.filter((p) => p.includes("SARA") && p.includes("MOHAMMADI"));
    if (namePs.length < 2) {
      issues.push(`Series 14 2P: expected 2 header paragraphs (Page 1 & Page 2), found ${namePs.length}`);
    } else {
      const p2Header = namePs[1];
      if (!p2Header.includes("<w:pageBreakBefore/>")) {
        issues.push("Series 14 2P: Page 2 header missing <w:pageBreakBefore/> (could drift to Page 1!)");
      }
      if (!p2Header.includes('w:val="28"') || !p2Header.includes('w:val="8496B0"')) {
        issues.push("Series 14 2P: Page 2 header lost original 14pt (sz=28) or #8496B0 two-tone styling!");
      }
    }
    if (s14p2Xml.includes("Conflict Management") || s14p2Xml.includes("Data Entry")) {
      issues.push("Series 14 2P: leftover template continuation skill placeholders remain");
    }

    // 5c. Cover Letter & References DOCX
    const clRes = await request.post("/api/export/docx", {
      data: { seriesId: "14", kind: "cover", pageSize: "A4", pageCount: 1, fileName: "QA_CL", content: SAMPLE_RESUME },
    });
    expect(clRes.ok()).toBeTruthy();
    const clXml = await (await JSZip.loadAsync(await clRes.body())).files["word/document.xml"].async("string");
    if (!clXml.includes("Stripe")) issues.push("Cover Letter DOCX: missing target company Stripe");

    const refRes = await request.post("/api/export/docx", {
      data: { seriesId: "14", kind: "references", pageSize: "A4", pageCount: 1, fileName: "QA_Ref", content: SAMPLE_RESUME },
    });
    expect(refRes.ok()).toBeTruthy();
    const refXml = await (await JSZip.loadAsync(await refRes.body())).files["word/document.xml"].async("string");
    if (!refXml.includes("ALI REZAEI")) issues.push("References DOCX: missing injected reference ALI REZAEI");

    expect(issues, `DOCX Fidelity failures:\n${issues.join("\n")}`).toEqual([]);
  });

  test("6. Phase 6 ZIP Bundle, Live Share Privacy Redaction & Combined Vector Print", async ({ request, page }) => {
    const zipRes = await request.post("/api/export/bundle", {
      data: { seriesId: "14", pageSize: "A4", pageCount: 1, fileName: "QA_Bundle", content: SAMPLE_RESUME },
    });
    expect(zipRes.ok()).toBeTruthy();
    const zip = await JSZip.loadAsync(await zipRes.body());
    expect(Object.keys(zip.files).length).toBe(5);

    const docId = `qa_share_${Date.now()}`;
    await request.post("/api/documents", {
      data: { id: docId, title: "QA Shared Resume", seriesId: "11", content: SAMPLE_RESUME },
    });
    const shareRes = await request.post(`/api/documents/${docId}/share`, {
      data: { active: true, showContact: false },
    });
    expect(shareRes.ok()).toBeTruthy();
    const { share } = await shareRes.json();

    await page.goto(`/s/${share.token}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Contact Redacted")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("sara@example.com");

    await page.goto(`/print/${docId}?mode=combined`, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".print-sheet")).toHaveCount(2);

    await request.delete(`/api/documents/${docId}`);
  });

  test("7. All 8 calibrated templates render inside Studio with zero runtime errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

    await page.goto("/editor/doc-executive", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: /Designer & Layout/i })).toBeVisible();
    await page.getByRole("button", { name: /Designer & Layout/i }).click();

    // Click all 8 template preview cards dynamically from the 2-column template grid
    const cards = page.locator("div.grid.grid-cols-2 button:has(img)");
    await expect(cards).toHaveCount(8);

    for (let i = 0; i < 8; i++) {
      await cards.nth(i).click();
      await page.waitForTimeout(150);
    }

    await expect(page.locator("body")).not.toContainText("NaN");
    await expect(page.locator("body")).not.toContainText("Invalid Date");
    expect(errors, `Template switch runtime errors: ${errors.join(" | ")}`).toEqual([]);
  });

  test("8. Series 22 (Photo Column) & Series 24 (Modern) open with exact identity and export DOCX, ZIP, TXT, PDF", async ({ page }) => {
    const targets = [
      { cardName: "Photo Column", expectedFilePrefix: "THEO_FINCH" },
      { cardName: "Modern", expectedFilePrefix: "FLORENCE_NIGHTINGALE" },
    ];

    for (const t of targets) {
      await page.goto("/templates", { waitUntil: "domcontentloaded" });
      const card = page.locator("div.grid > div.group").filter({ hasText: t.cardName }).first();
      await card.locator("[role='button']").first().click();
      await page.getByRole("button", { name: /Live in Studio/i }).click();
      await page.waitForURL(/\/editor\//, { timeout: 15000 });

      await page.getByRole("button", { name: /Download \/ Export/i }).click();

      const dlDocx = page.waitForEvent("download", { timeout: 12000 });
      await page.getByRole("button", { name: /Download True Word/i }).click();
      const docx = await dlDocx;
      expect(docx.suggestedFilename().toUpperCase()).toContain(t.expectedFilePrefix);

      const dlZip = page.waitForEvent("download", { timeout: 12000 });
      await page.getByRole("button", { name: /Full Application Bundle/i }).click();
      const zip = await dlZip;
      expect(zip.suggestedFilename().toUpperCase()).toContain(t.expectedFilePrefix);

      const dlTxt = page.waitForEvent("download", { timeout: 12000 });
      await page.getByRole("button", { name: /Download Plain Text/i }).click();
      const txt = await dlTxt;
      expect(txt.suggestedFilename().toUpperCase()).toContain(t.expectedFilePrefix);

      const popPdf = page.waitForEvent("popup", { timeout: 12000 });
      await page.getByRole("button", { name: /Download Live Vector PDF/i }).click();
      const pdfWin = await popPdf;
      await pdfWin.waitForURL(/\/print\//, { timeout: 12000 });
      await pdfWin.close();
    }
  });
});
