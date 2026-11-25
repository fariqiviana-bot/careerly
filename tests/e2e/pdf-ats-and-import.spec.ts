import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { extractText } from "unpdf";

async function registerViaUi(page: Page, name: string, email: string, password: string) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Create Account/i }).first().click();
  await page.getByPlaceholder("Sara Mohammadi").fill(name);
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("At least 6 characters").fill(password);
  await page.locator("form").getByRole("button", { name: /^Create Account$/i }).click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 15_000 });
}

async function extractPdfPlainText(pdfBuffer: Buffer): Promise<{ totalPages: number; pages: string[]; fullText: string }> {
  const res: any = await extractText(new Uint8Array(pdfBuffer), { mergePages: false });
  const pages: string[] = Array.isArray(res?.text)
    ? res.text.map((t: any) => String(t ?? ""))
    : [String(res?.text ?? "")];
  return {
    totalPages: Number(res?.totalPages || pages.length || 0),
    pages,
    fullText: pages.join("\n\n--- PAGE BREAK ---\n\n"),
  };
}

async function renderResumeToPdfBuffer(page: Page, docId: string, pageSize: "A4" | "Letter" = "A4") {
  await page.addInitScript(() => {
    window.print = () => {};
  });
  const t0 = Date.now();
  await page.goto(`/print/${encodeURIComponent(docId)}?autoprint=0`, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });
  await page.waitForTimeout(350);

  const pdfBuf = await page.pdf({
    format: pageSize,
    printBackground: true,
    preferCSSPageSize: true,
  });
  const elapsedMs = Date.now() - t0;
  return { pdfBuf, elapsedMs };
}

async function buildRealLegacyDocx(outPath: string) {
  const paragraphs = [
    "Nadia Shirazi",
    "Lead Computational Chemist",
    "nadia.shirazi@proteomics.org | +1 (312) 555-0177 | Chicago, IL",
    "",
    "PROFESSIONAL SUMMARY",
    "Computational chemist with 8 years of experience building molecular docking pipelines and automated assay analytics.",
    "",
    "WORK EXPERIENCE",
    "Principal Computational Chemist | Midwest Therapeutics | Chicago, IL | Jan 2022 - Present",
    "- Designed automated ligand screening pipeline processing 450,000 compounds per week.",
    "- Cut cloud compute cost by 42% through GPU batch scheduling and Python vectorization.",
    "",
    "Senior Cheminformatics Scientist | Lakefront BioLabs | Evanston, IL | Jun 2018 - Dec 2021",
    "- Built QSAR prediction models improving lead hit rate from 14% to 31%.",
    "- Collaborated with wet-lab teams to standardize assay QC reports across 6 therapeutic programs.",
    "",
    "EDUCATION",
    "M.S. in Computational Chemistry - University of Illinois - 2018",
    "",
    "SKILLS",
    "Python, RDKit, PyTorch, Molecular Dynamics, SQL, AWS Batch",
  ];

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const bodyXml = paragraphs
    .map((p) => `<w:p><w:r><w:t xml:space="preserve">${esc(p)}</w:t></w:r></w:p>`)
    .join("");

  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${bodyXml}<w:sectPr/></w:body>
</w:document>`
  );

  const buf = await zip.generateAsync({ type: "nodebuffer" });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buf);
}

async function buildRealLegacyPdf(page: Page, outPath: string) {
  await page.setContent(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, sans-serif; color: #111; margin: 36px; line-height: 1.45; font-size: 11pt; }
    h1 { font-size: 20pt; margin: 0 0 4px 0; }
    .role { font-size: 12pt; color: #333; margin: 0 0 6px 0; }
    .contact { font-size: 10pt; color: #444; margin-bottom: 16px; }
    h2 { font-size: 11.5pt; border-bottom: 1px solid #333; margin: 14px 0 6px 0; padding-bottom: 2px; text-transform: uppercase; }
    .job { margin-bottom: 10px; }
    .job-head { font-weight: bold; }
    ul { margin: 4px 0 0 18px; padding: 0; }
  </style>
</head>
<body>
  <h1>Darius Kamali</h1>
  <div class="role">Senior Molecular Biologist</div>
  <div class="contact">darius.kamali@biogenomics.io | +1 (617) 555-0148 | Boston, MA</div>

  <h2>Professional Summary</h2>
  <p>Molecular biologist specializing in CRISPR assay engineering, NGS library preparation, and automated clinical diagnostics.</p>

  <h2>Professional Experience</h2>
  <div class="job">
    <div class="job-head">Lead Molecular Biologist | Beacon BioLabs | Boston, MA | Mar 2022 - Present</div>
    <ul>
      <li>Engineered multiplexed PCR panels reducing diagnostic turnaround time by 38%.</li>
      <li>Managed validation workflows for 1,200 clinical sequencing runs under CLIA standards.</li>
    </ul>
  </div>
  <div class="job">
    <div class="job-head">Research Associate II | Harbor Diagnostics | Cambridge, MA | Jul 2019 - Feb 2022</div>
    <ul>
      <li>Automated RNA extraction protocols across robotic liquid handlers with 99.4% reproducibility.</li>
      <li>Authored standard operating procedures adopted by 3 partner genomics labs.</li>
    </ul>
  </div>

  <h2>Education</h2>
  <p>B.S. in Molecular Biology — Boston University — 2019</p>

  <h2>Skills</h2>
  <p>CRISPR-Cas9, qPCR, Next-Generation Sequencing, Primer Design, Biostatistics, Python</p>
</body>
</html>`);
  const pdfBuf = await page.pdf({ format: "A4", printBackground: true });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, pdfBuf);
}

test.describe("PDF ATS Fidelity, 3-Page Stress Test & Legacy Resume Parser (PDF + DOCX)", () => {
  test.setTimeout(120_000);

  test("1. ATS PDF Export Fidelity (Ctrl+A / Ctrl+C / Notepad Simulation): Real selectable text, no glued words, logical reading order", async ({
    browser,
  }) => {
    const ts = Date.now();
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const email = `ats_pdf_${ts}@farnavi.test`;
    await registerViaUi(page, "ATS PDF Tester", email, "FarnaviPass123!");

    const docId = `ats-pdf-doc-${ts}`;
    const createRes = await page.request.post("/api/documents", {
      data: {
        id: docId,
        title: "ATS PDF Audit Resume",
        seriesId: "14",
        settings: { pageCount: 1, pageSize: "A4" },
        content: {
          name: "Viana Fariqi",
          firstName: "Viana",
          lastName: "Fariqi",
          role: "Senior Bioinformatics Architect",
          email,
          phone: "+1 (415) 555-0192",
          location: "San Francisco, CA",
          summary:
            "Bioinformatics architect delivering reproducible sequence analysis pipelines and high-throughput clinical software.",
          skills: [
            "Genomic Annotation",
            "CRISPR Primer Design",
            "FastAPI Architecture",
            "Statistical Modeling",
            "Clinical Compliance",
          ],
          experience: [
            {
              id: "ats-exp-1",
              role: "Principal Computational Biologist",
              company: "Niyaman BioLabs",
              location: "Boston, MA",
              period: "2024 - Present",
              bullets: [
                "Architected 26 modular sequence analysis workflows serving 12,000 researchers worldwide.",
                "Standardized plasmid annotation outputs across web and desktop pipelines.",
              ],
            },
            {
              id: "ats-exp-2",
              role: "Senior Bioinformatics Engineer",
              company: "Helix Dynamics",
              location: "Seattle, WA",
              period: "2021 - 2024",
              bullets: [
                "Reduced whole-genome variant calling latency by 64 percent using vectorized execution.",
              ],
            },
          ],
          education: [
            {
              id: "ats-edu-1",
              degree: "B.S. in Cellular and Molecular Biology",
              school: "State University",
              period: "2019",
            },
          ],
        },
      },
    });
    expect(createRes.ok()).toBeTruthy();

    const { pdfBuf, elapsedMs } = await renderResumeToPdfBuffer(page, docId, "A4");
    expect(pdfBuf.subarray(0, 5).toString("ascii"), "Output must be a valid binary PDF").toBe("%PDF-");

    const { totalPages, fullText } = await extractPdfPlainText(pdfBuf);

    // Save raw Notepad-equivalent plain text for manual inspection if desired
    fs.mkdirSync("test-results", { recursive: true });
    fs.writeFileSync("test-results/pdf-notepad-paste.txt", fullText, "utf8");
    fs.writeFileSync("test-results/pdf-ats-sample.pdf", pdfBuf);

    console.log(
      `[ATS PDF] pages=${totalPages} | chars=${fullText.length} | buildMs=${elapsedMs}ms`
    );

    // 1) Must be real selectable vector text (NOT an image)
    expect(fullText.trim().length, "Extracted PDF text is too short — possible image-only PDF").toBeGreaterThan(350);
    const wordCount = fullText.trim().split(/\s+/).length;
    expect(wordCount, "Word count too low — text may be rasterized or missing").toBeGreaterThan(50);

    // 2) Must NOT glue adjacent words / names / titles / headings together
    const gluedPatterns = [
      /VianaFariqi/i,
      /SeniorBioinformatics/i,
      /PrincipalComputational/i,
      /NiyamanBioLabs/i,
      /HelixDynamics/i,
      /GenomicAnnotation/i,
      /EXPERIENCEPrincipal/i,
      /SUMMARYBioinformatics/i,
      /PROFILEBioinformatics/i,
    ];
    for (const badRe of gluedPatterns) {
      expect(fullText, `Glued word detected matching ${badRe}`).not.toMatch(badRe);
    }

    // Check no accidental glued non-URL / non-email megawords (> 32 alpha chars)
    const tokens = fullText.split(/\s+/).filter((t) => !t.includes("@") && !t.includes("http") && !t.includes("/"));
    const gluedAlphaTokens = tokens.filter((t) => /^[A-Za-z]{32,}$/.test(t));
    expect(gluedAlphaTokens, `Suspicious glued tokens found: ${gluedAlphaTokens.join(", ")}`).toEqual([]);

    // 2b) Must NOT split words into letter-by-letter spaced tokens (e.g. "V I A N A")
    expect(fullText, "Spaced-out letters detected in PDF text layer").not.toMatch(/\b[A-Za-z]\s[A-Za-z]\s[A-Za-z]\s[A-Za-z]\b/);

    // 2c) Must NOT leak untouched template placeholders into user's PDF
    for (const leaked of ["microsoft office", "adobe photoshop", "course / workshop / class"]) {
      expect(fullText.toLowerCase(), `Template sample leaked into user PDF: ${leaked}`).not.toContain(leaked);
    }

    // 3) Verify key content exists with proper word separation
    for (const phrase of [
      "Viana",
      "Fariqi",
      "Senior Bioinformatics Architect",
      email,
      "Principal Computational Biologist",
      "Niyaman BioLabs",
      "Senior Bioinformatics Engineer",
      "Helix Dynamics",
      "Genomic Annotation",
      "CRISPR Primer Design",
      "Cellular and Molecular Biology",
    ]) {
      expect(fullText.toLowerCase(), `Missing expected text in PDF: ${phrase}`).toContain(phrase.toLowerCase());
    }

    // 4) Logical reading order (top-to-bottom ATS flow)
    const lower = fullText.toLowerCase();
    const posName = lower.indexOf("viana");
    const posSummary = lower.indexOf("reproducible sequence analysis");
    const posExp1 = lower.indexOf("principal computational biologist");
    const posExp2 = lower.indexOf("senior bioinformatics engineer");
    const posEdu = lower.indexOf("cellular and molecular biology");

    expect(posName, "Name should appear near the top").toBeGreaterThanOrEqual(0);
    expect(posSummary, "Summary should follow Name").toBeGreaterThan(posName);
    expect(posExp1, "Experience #1 should follow Summary").toBeGreaterThan(posSummary);
    expect(posExp2, "Experience #2 should follow Experience #1").toBeGreaterThan(posExp1);
    expect(posEdu, "Education should be present in logical flow").toBeGreaterThan(posName);

    await ctx.close();
  });

  test("2. Stress Test: 3-Page Dense Content + Special Chars (% & \" ' /) + Very Long URL -> PDF builds under 8s, zero crashes, zero entity corruption", async ({
    browser,
  }) => {
    const ts = Date.now();
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const server500s: string[] = [];
    const crashes: string[] = [];

    page.on("pageerror", (e) => crashes.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 500) server500s.push(`${r.status()} ${r.url()}`);
    });

    const email = `stress_${ts}@farnavi.test`;
    await registerViaUi(page, "Stress Tester", email, "FarnaviPass123!");

    const longUrl =
      "https://portfolio.farnavi-biotech-example.com/research/genomics/2026/sequence-alignment-and-crispr-design-platform?ref=stress_test&token=abcdef1234567890abcdef1234567890abcdef1234567890&view=full_report";
    const specialSnippet = `R&D 100% "Best-in-Class" 'Core' Pipeline / API & QA 50%`;

    const denseExperience = Array.from({ length: 8 }, (_, idx) => ({
      id: `stress-exp-${idx + 1}`,
      role: `Lead Systems & Bio-Data Engineer #${idx + 1} (${specialSnippet})`,
      company: `Global Genomics & Analytics Group ${idx + 1} / Division "${idx + 1}"`,
      location: "San Francisco, CA / Remote",
      period: `${2017 + idx} - ${2018 + idx}`,
      bullets: [
        `Delivered ${specialSnippet} across distributed compute clusters with 99.9% uptime and zero data loss.`,
        `Authored full technical specification & compliance audit at ${longUrl} for regulatory review.`,
        `Optimized ETL ingestion throughput by ${25 + idx * 5}% while maintaining strict 'zero-trust' / "audit-ready" controls across 14 microservices and 3 regional failover zones.`,
        `Coordinated cross-functional R&D & clinical teams across 4 continents, mentoring 12 engineers on reproducible testing, benchmarking, and automated release pipelines.`,
      ],
    }));

    const docId = `stress-3p-doc-${ts}`;
    const createRes = await page.request.post("/api/documents", {
      data: {
        id: docId,
        title: "3-Page Special-Char Stress Resume",
        seriesId: "14",
        settings: { pageCount: 3, pageSize: "A4" },
        content: {
          name: `Viana "Vi" O'Fariqi`,
          firstName: `Viana "Vi"`,
          lastName: `O'Fariqi`,
          role: `VP of R&D / 100% Cloud & Bio-Compute`,
          email,
          phone: "+1 (415) 555-9900",
          location: "San Francisco, CA",
          website: longUrl,
          linkedin: longUrl,
          summary: `${specialSnippet} — Detailed executive portfolio available at ${longUrl}. Built resilient multi-region systems handling millions of genomic records per day with full traceability, automated verification, and deterministic rendering across every export target.`,
          skills: [
            "R&D Strategy 100%",
            `CI/CD "Zero-Downtime"`,
            "O'Auth / SAML & Security",
            "High-Throughput ETL",
            "TypeScript / Python",
            "Biostatistics & ML",
          ],
          experience: denseExperience,
          education: [
            {
              id: "stress-edu-1",
              degree: `M.S. in Bioinformatics & Systems Biology ("Honors" / 100% Distinction)`,
              school: "Institute of Science & Technology",
              period: "2017",
            },
          ],
        },
      },
    });
    expect(createRes.ok()).toBeTruthy();

    const { pdfBuf, elapsedMs } = await renderResumeToPdfBuffer(page, docId, "A4");
    const { totalPages, fullText } = await extractPdfPlainText(pdfBuf);

    console.log(`[Stress PDF] pages=${totalPages} | chars=${fullText.length} | elapsedMs=${elapsedMs}ms`);

    // 1) Zero server crashes / page errors
    expect(server500s, `Server 500s: ${server500s.join(" | ")}`).toEqual([]);
    expect(crashes, `Page runtime errors: ${crashes.join(" | ")}`).toEqual([]);

    // 2) Must finish under 8 seconds
    expect(elapsedMs, `PDF generation took ${elapsedMs}ms (limit: 8000ms)`).toBeLessThan(8_000);

    // 3) Valid multi-page PDF
    expect(pdfBuf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(totalPages, "Dense 3-page input should produce multi-page PDF").toBeGreaterThanOrEqual(2);

    // 4) Special characters preserved verbatim & NOT corrupted into HTML entities or mojibake
    expect(fullText).toContain("R&D");
    expect(fullText).toContain("100%");
    expect(fullText).toContain(`"Best-in-Class"`);
    expect(fullText).toContain(`'Core'`);
    expect(fullText).toContain("/");
    expect(fullText.replace(/\s+/g, "")).toContain("farnavi-biotech-example.com/research/genomics/2026");

    for (const corruptEntity of ["&amp;", "&quot;", "&#39;", "&#x27;", "&apos;", "&lt;", "&gt;", "\uFFFD"]) {
      expect(fullText, `Corrupted HTML entity or mojibake found: ${corruptEntity}`).not.toContain(corruptEntity);
    }

    await ctx.close();
  });

  test("3. Legacy Resume Parser (Real PDF & Real DOCX Upload): Populates distinct DB fields (name, email, experience) cleanly", async ({
    browser,
  }) => {
    const ts = Date.now();
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const email = `parser_${ts}@farnavi.test`;
    await registerViaUi(page, "Parser Tester", email, "FarnaviPass123!");

    // Build genuine legacy .pdf and .docx fixtures
    const fixtureDir = path.join("test-results", "import-fixtures");
    const pdfFixture = path.join(fixtureDir, `legacy-resume-${ts}.pdf`);
    const docxFixture = path.join(fixtureDir, `legacy-resume-${ts}.docx`);

    const helperPage = await ctx.newPage();
    await buildRealLegacyPdf(helperPage, pdfFixture);
    await helperPage.close();
    await buildRealLegacyDocx(docxFixture);

    const runImportAndVerifyDb = async (opts: {
      label: string;
      filePath: string;
      expectedName: string;
      expectedEmail: string;
      expectedCompanies: string[];
    }) => {
      const docId = `import-${opts.label.toLowerCase()}-${ts}`;
      const createRes = await page.request.post("/api/documents", {
        data: {
          id: docId,
          title: `Import Target ${opts.label}`,
          seriesId: "14",
          content: {
            name: "Blank Placeholder",
            firstName: "Blank",
            lastName: "Placeholder",
            role: "Placeholder Role",
            email: "placeholder@example.com",
            summary: "",
            experience: [],
          },
        },
      });
      expect(createRes.ok()).toBeTruthy();

      await page.goto(`/editor/${docId}`, { waitUntil: "networkidle" });

      // Open Import modal from Studio top bar
      await page.getByRole("button", { name: /^Import$/i }).first().click();

      // Upload real file into the modal's file input
      const fileInput = page.locator('input[type="file"][accept*=".pdf"]').first();
      await expect(fileInput).toBeAttached({ timeout: 10_000 });
      await fileInput.setInputFiles(opts.filePath);

      // Wait for parsed preview & click Apply to Current Resume
      const applyBtn = page.getByRole("button", { name: /Apply to Current Resume/i }).first();
      await expect(applyBtn).toBeVisible({ timeout: 20_000 });
      await applyBtn.click();

      // Wait for DB autosave flush
      await page.waitForTimeout(1600);
      await page.waitForLoadState("networkidle").catch(() => {});

      // Fetch directly from DB API to inspect persisted schema fields
      const dbRes = await page.request.get(`/api/documents/${encodeURIComponent(docId)}`);
      expect(dbRes.ok()).toBeTruthy();
      const dbJson = await dbRes.json();
      const c = dbJson?.document?.content || {};

      console.log(
        `[Import ${opts.label} DB] name="${c.name}" | email="${c.email}" | role="${c.role}" | expCount=${
          Array.isArray(c.experience) ? c.experience.length : 0
        } | summaryLen=${String(c.summary || "").length}`
      );

      // 1) Name populated cleanly in its own field (not empty, not placeholder)
      expect(String(c.name || "").toLowerCase(), `[${opts.label}] DB content.name wrong`).toContain(
        opts.expectedName.toLowerCase()
      );
      expect(String(c.name || "").length, `[${opts.label}] Name swallowed whole resume`).toBeLessThan(60);

      // 2) Email extracted into dedicated content.email field
      expect(String(c.email || "").toLowerCase(), `[${opts.label}] DB content.email wrong`).toBe(
        opts.expectedEmail.toLowerCase()
      );

      // 3) Experience parsed into structured array (>= 2 separate jobs, not dumped into one box)
      expect(Array.isArray(c.experience), `[${opts.label}] DB content.experience must be an array`).toBe(true);
      expect(c.experience.length, `[${opts.label}] Expected at least 2 parsed experiences`).toBeGreaterThanOrEqual(2);

      const expBlob = JSON.stringify(c.experience).toLowerCase();
      for (const comp of opts.expectedCompanies) {
        expect(expBlob, `[${opts.label}] Missing company "${comp}" inside content.experience`).toContain(
          comp.toLowerCase()
        );
      }

      // 4) Summary must NOT swallow the entire resume (no email or all companies dumped into summary)
      const summaryLower = String(c.summary || "").toLowerCase();
      expect(summaryLower, `[${opts.label}] Summary swallowed the email`).not.toContain(
        opts.expectedEmail.toLowerCase()
      );
      expect(String(c.summary || "").length, `[${opts.label}] Summary suspiciously huge (raw dump)`).toBeLessThan(650);
    };

    await runImportAndVerifyDb({
      label: "PDF",
      filePath: pdfFixture,
      expectedName: "Darius Kamali",
      expectedEmail: "darius.kamali@biogenomics.io",
      expectedCompanies: ["Beacon BioLabs", "Harbor Diagnostics"],
    });

    await runImportAndVerifyDb({
      label: "DOCX",
      filePath: docxFixture,
      expectedName: "Nadia Shirazi",
      expectedEmail: "nadia.shirazi@proteomics.org",
      expectedCompanies: ["Midwest Therapeutics", "Lakefront BioLabs"],
    });

    await ctx.close();
  });
});
