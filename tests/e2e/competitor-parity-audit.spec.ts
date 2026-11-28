import fs from "fs";
﻿import { test, expect, type Page } from "@playwright/test";
import JSZip from "jszip";

async function registerViaUi(page: Page, name: string, email: string, password: string) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Create Account/i }).first().click();
  await page.getByPlaceholder("Sara Mohammadi").fill(name);
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("At least 6 characters").fill(password);
  await page.locator("form").getByRole("button", { name: /^Create Account$/i }).click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 15_000 });
}

test.describe("Competitor Parity Audit (Rezi / Teal / FlowCV / SaaS Production Standards)", () => {
  test.setTimeout(120_000);

  test("1. Export Parity & Strict ATS DOCX: visibility, sectionOrder, customLabels, zero tables/textboxes/headers & Unicode names", async ({
    request,
  }) => {
    const hiddenCertMarker = "HIDDEN_CERT_SECRET_9911";
    const hiddenLangMarker = "HIDDEN_LANG_SECRET_9922";
    const unicodeName = "José François Łukasz";
    const customEduLabel = "Academic Credentials";
    const customExpLabel = "Leadership Track Record";

    const content = {
      name: unicodeName,
      role: "Principal Systems Architect",
      email: "jose.lukasz@farnavi.test",
      phone: "+1 (415) 555-8181",
      location: "Zürich, Switzerland",
      summary: "Built fault-tolerant payment rails handling 2.4M TPS with 99.995% availability.",
      experience: [
        {
          id: "e1",
          role: "Principal Architect",
          company: "Helvetia Cloud",
          location: "Zürich",
          period: "2022 - Present",
          bullets: [
            "Reduced p99 API latency by 47% across 18 microservices serving 4.2M active users.",
            "Led migration of 140 TB financial ledger to PostgreSQL with zero downtime.",
          ],
        },
      ],
      education: [
        {
          id: "ed1",
          degree: "M.Sc. Computer Science",
          school: "ETH Zürich",
          period: "2016 - 2018",
        },
      ],
      skills: ["Distributed Systems", "PostgreSQL", "Zero-Trust Architecture"],
      technicalSkills: ["TypeScript", "Go", "Kubernetes"],
      certifications: [{ name: hiddenCertMarker, issuer: "Secret Org", date: "2025" }],
      languages: [hiddenLangMarker],
      coverLetter: {
        recipientName: "Hiring Committee",
        companyName: "Helvetia FinTech",
        body: "I am excited to contribute my distributed systems background to Helvetia FinTech.",
      },
      references: [
        {
          name: "Dr. Elena Vance",
          role: "VP Engineering",
          company: "Helvetia Cloud",
          email: "elena.vance@helvetia.test",
        },
      ],
    };

    const layoutOpts = {
      visibility: { certifications: false, languages: false },
      sectionOrder: ["education", "skills", "experience", "summary"],
      customLabels: {
        education: customEduLabel,
        experience: customExpLabel,
      },
    };

    // 1a. ATS DOCX (Rezi / Workday strict single-column audit)
    const atsRes = await request.post("/api/export/docx", {
      data: {
        seriesId: "14",
        kind: "resume",
        mode: "ats",
        pageSize: "Letter",
        content,
        ...layoutOpts,
      },
    });
    expect(atsRes.status()).toBe(200);
    const dispAts = atsRes.headers()["content-disposition"] || "";
    expect(dispAts).toContain("filename*=");

    const atsBuf = Buffer.from(await atsRes.body());
    expect(atsBuf.length, "ATS DOCX exceeds Greenhouse 2.5MB portal limit").toBeLessThan(2.5 * 1024 * 1024);

    const atsZip = await JSZip.loadAsync(atsBuf);
    const atsXml = await atsZip.file("word/document.xml")!.async("string");

    // Strict ATS structural assertions: zero tables, zero text boxes, zero header/footer files
    expect(atsXml, "ATS DOCX must NOT contain <w:tbl> tables!").not.toContain("<w:tbl");
    expect(atsXml, "ATS DOCX must NOT contain <w:txbxContent> textboxes!").not.toContain("txbxContent");
    const headerFooters = Object.keys(atsZip.files).filter((n) => /^word\/(header|footer)\d*\.xml$/i.test(n));
    expect(headerFooters, "ATS DOCX must not trap contact info in header/footer XML").toEqual([]);

    // Unicode + visibility + custom labels + exact section order
    expect(atsXml).toContain(unicodeName.toUpperCase());
    expect(atsXml, "Bullet glyph corrupted to ? in ATS DOCX!").toContain("\u2022  ");
    expect(atsXml, "Em-dash separator corrupted to ? in ATS DOCX!").toContain(" \u2014 ");
    expect(atsXml, "Middle-dot skill separator corrupted to ? in ATS DOCX!").toContain(" \u00B7 ");
    expect(atsXml, "Found corrupted ? placeholder in ATS DOCX XML!").not.toContain(">?  <");
    expect(atsXml, "Hidden certifications leaked into ATS DOCX!").not.toContain(hiddenCertMarker);
    expect(atsXml, "Hidden languages leaked into ATS DOCX!").not.toContain(hiddenLangMarker);

    const idxEdu = atsXml.indexOf(customEduLabel.toUpperCase());
    const idxSkills = atsXml.indexOf("SKILLS");
    const idxExp = atsXml.indexOf(customExpLabel.toUpperCase());
    const idxSummary = atsXml.indexOf("PROFESSIONAL SUMMARY");
    expect(idxEdu, "Custom Education label missing in ATS DOCX").toBeGreaterThan(-1);
    expect(idxSkills).toBeGreaterThan(idxEdu);
    expect(idxExp, "Custom Experience label missing in ATS DOCX").toBeGreaterThan(idxSkills);
    expect(idxSummary).toBeGreaterThan(idxExp);

    // 1b. Visual DOCX must also never leak hidden sections
    const visRes = await request.post("/api/export/docx", {
      data: { seriesId: "24", kind: "resume", mode: "visual", pageSize: "A4", content, ...layoutOpts },
    });
    expect(visRes.status()).toBe(200);
    const visZip = await JSZip.loadAsync(Buffer.from(await visRes.body()));
    const visXml = await visZip.file("word/document.xml")!.async("string");
    expect(visXml, "Hidden certifications leaked into Visual DOCX!").not.toContain(hiddenCertMarker);
    expect(visXml, "Hidden languages leaked into Visual DOCX!").not.toContain(hiddenLangMarker);

    // 1c. Plain Text Export must match visibility, customLabels & sectionOrder
    const txtRes = await request.post("/api/export/txt", {
      data: { content, ...layoutOpts },
    });
    expect(txtRes.status()).toBe(200);
    const txt = await txtRes.text();
    expect(txt).toContain(unicodeName.toUpperCase());
    expect(txt, "Hidden certifications leaked into TXT!").not.toContain(hiddenCertMarker);
    expect(txt, "Hidden languages leaked into TXT!").not.toContain(hiddenLangMarker);
    expect(txt.indexOf(customEduLabel.toUpperCase())).toBeGreaterThan(-1);
    expect(txt.indexOf(customExpLabel.toUpperCase())).toBeGreaterThan(txt.indexOf(customEduLabel.toUpperCase()));

    // 1d. Complete ZIP Bundle: verify zero hidden leaks + clean Cover Letter & References
    const bundleRes = await request.post("/api/export/bundle", {
      data: { seriesId: "14", pageSize: "A4", pageCount: 1, content, ...layoutOpts },
    });
    expect(bundleRes.status()).toBe(200);
    const bundleZip = await JSZip.loadAsync(Buffer.from(await bundleRes.body()));
    const txtEntry = Object.keys(bundleZip.files).find((k) => k.endsWith("_ATS_Plain_Text.txt"));
    expect(txtEntry).toBeTruthy();
    const bundleTxt = await bundleZip.file(txtEntry!)!.async("string");
    expect(bundleTxt).not.toContain(hiddenCertMarker);
    expect(bundleTxt).not.toContain(hiddenLangMarker);
  });

  test("2. Master Profile Isolation, Persistence & Security (Teal Parity): Strict user boundary + SVG/DoS guards", async ({
    browser,
  }) => {
    const ts = Date.now();
    const secretMasterText = `MASTER_CAREER_VAULT_SECRET_${ts}`;

    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await registerViaUi(pageA, "Master Owner A", `mp_a_${ts}@farnavi.test`, "FarnaviPass123!");

    const putA = await pageA.request.put("/api/master-profile", {
      data: {
        contact: { name: "Master Owner A", email: `mp_a_${ts}@farnavi.test` },
        summary: secretMasterText,
        skills: ["Genomics", "Bioinformatics", "Python"],
      },
    });
    expect(putA.status()).toBe(200);

    // Reload persistence check
    const getA = await pageA.request.get("/api/master-profile");
    expect(getA.status()).toBe(200);
    const jsonA = await getA.json();
    expect(jsonA?.profile?.summary).toBe(secretMasterText);
    expect(jsonA?.profile?.skills).toContain("Genomics");

    // Security: SVG XSS in contact.photo rejected with 400
    const svgUri = `data:image/svg+xml;base64,${Buffer.from("<svg onload=alert(1)></svg>").toString("base64")}`;
    const svgPut = await pageA.request.put("/api/master-profile", {
      data: { contact: { name: "Master Owner A", photo: svgUri } },
    });
    expect(svgPut.status(), "Master Profile accepted SVG XSS data URI!").toBe(400);

    // Security: DoS 200 experience items rejected with 400
    const dosExp = Array.from({ length: 200 }, (_, i) => ({ id: `m${i}`, role: `R${i}` }));
    const dosPut = await pageA.request.put("/api/master-profile", {
      data: { experience: dosExp },
    });
    expect(dosPut.status()).toBe(400);

    // Strict isolation: User B must NEVER see User A's master profile
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await registerViaUi(pageB, "Master Stranger B", `mp_b_${ts}@farnavi.test`, "FarnaviPass123!");
    const getB = await pageB.request.get("/api/master-profile");
    expect(getB.status()).toBe(200);
    expect(await getB.text(), "CRITICAL LEAK: User B read User A's Master Profile!").not.toContain(secretMasterText);

    await Promise.all([ctxA.close(), ctxB.close()]);
  });

  test("3. Orphan Reference Cleanup & Cross-User Link Guard: Deleting linked resume detaches Tracker & Interviews cleanly", async ({
    browser,
  }) => {
    const ts = Date.now();
    const docId = `linked-doc-${ts}`;

    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await registerViaUi(pageA, "Link Owner A", `link_a_${ts}@farnavi.test`, "FarnaviPass123!");

    const createDoc = await pageA.request.post("/api/documents", {
      data: { id: docId, title: "Linked Target Resume", seriesId: "14", content: { name: "Link Owner A" } },
    });
    expect(createDoc.status()).toBe(201);

    // Link resume to both Tracker and Interview
    const trRes = await pageA.request.post("/api/tracker", {
      data: { title: "Staff Scientist", company: "BioCore", status: "applied", resumeId: docId, coverId: docId },
    });
    expect(trRes.status()).toBe(201);
    const trId = (await trRes.json()).item.id;

    const intRes = await pageA.request.post("/api/interviews", {
      data: { title: "Staff Scientist", company: "BioCore", resumeId: docId },
    });
    expect(intRes.status()).toBe(201);
    const intId = (await intRes.json()).item.id;

    // User B tries to link User A's docId to User B's tracker -> must be blocked with 403
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await registerViaUi(pageB, "Link Attacker B", `link_b_${ts}@farnavi.test`, "FarnaviPass123!");
    const hijackLink = await pageB.request.post("/api/tracker", {
      data: { title: "Hijack Job", company: "EvilCo", resumeId: docId },
    });
    expect(hijackLink.status(), "User B was allowed to link User A's resumeId!").toBe(403);

    // User A deletes the linked document -> must return 200 and detach resumeId/coverId cleanly
    const delRes = await pageA.request.delete(`/api/documents/${docId}`);
    expect(delRes.status()).toBe(200);

    const trList = await (await pageA.request.get("/api/tracker")).json();
    const trItem = (trList.items || []).find((x: any) => x.id === trId);
    expect(trItem).toBeTruthy();
    expect(trItem.resumeId, "Dangling resumeId remained in Tracker after document delete!").toBeNull();
    expect(trItem.coverId, "Dangling coverId remained in Tracker after document delete!").toBeNull();

    const intList = await (await pageA.request.get("/api/interviews")).json();
    const intItem = (intList.items || []).find((x: any) => x.id === intId);
    expect(intItem).toBeTruthy();
    expect(intItem.resumeId, "Dangling resumeId remained in Interview after document delete!").toBeNull();

    await Promise.all([ctxA.close(), ctxB.close()]);
  });

  test("4. Analyzer Honesty & Auto-Fit Numerical Safety (Rezi / Resume Worded / Enhancv Parity)", async ({ request }) => {
    // Tier 1: Empty / stub resume MUST score <= 30 ("Needs Work") and low parseRate
    const emptyRes = await request.post("/api/analyze", {
      data: { content: { name: "Test", experience: [], skills: [] } },
    });
    expect(emptyRes.status()).toBe(200);
    const emptyJson = await emptyRes.json();
    const emptyScore = Number(emptyJson.overallScore ?? -1);
    expect(emptyScore, `Empty resume scored too high (${emptyScore})`).toBeLessThanOrEqual(30);
    expect(emptyJson.grade).toBe("Needs Work");
    expect(Number(emptyJson?.atsView?.parseRate ?? 100)).toBeLessThanOrEqual(55);

    // Tier 2: Placeholder-filled template MUST score <= 55
    const placeholderRes = await request.post("/api/analyze", {
      data: {
        content: {
          name: "Your Name",
          role: "Your Profession",
          email: "youremail@gmail.com",
          phone: "555-555-5555",
          location: "City, State",
          summary: "Write 3 sentences summarizing your background and experience.",
          experience: [
            {
              id: "p1",
              role: "Job Title",
              company: "Company Name",
              period: "2022 - Present",
              bullets: ["Responsible for daily tasks", "Worked on team goals"],
            },
          ],
          skills: ["Communication", "Leadership"],
        },
      },
    });
    expect(placeholderRes.status()).toBe(200);
    const placeholderScore = Number((await placeholderRes.json()).overallScore ?? -1);
    expect(placeholderScore, `Unedited placeholder resume scored too high (${placeholderScore})`).toBeLessThanOrEqual(55);

    // Tier 3: Mediocre resume (0% metrics, weak duty verbs, pronouns, passive voice) -> 45..72
    const mediocreRes = await request.post("/api/analyze", {
      data: {
        content: {
          name: "Alex Mercer",
          role: "Operations Coordinator",
          email: "alex.mercer@example.org",
          phone: "+1 (312) 555-8412",
          location: "Chicago, IL",
          summary: "Hardworking team player looking for growth opportunities in operations.",
          experience: [
            {
              id: "m1",
              role: "Operations Coordinator",
              company: "Midwest Logistics",
              period: "Jan 2022 - Present",
              bullets: [
                "I was responsible for handling daily office tasks and updating internal folders.",
                "Helped with incoming customer emails and worked on weekly spreadsheets.",
                "Assisted team members with general scheduling and routine administrative duties.",
              ],
            },
          ],
          education: [{ degree: "B.A. Business", school: "DePaul University", period: "2017 - 2021" }],
          skills: ["Scheduling", "Spreadsheets", "Email"],
        },
      },
    });
    expect(mediocreRes.status()).toBe(200);
    const mediocreScore = Number((await mediocreRes.json()).overallScore ?? -1);
    expect(mediocreScore, `Mediocre resume scored outside realistic 45-72 band (${mediocreScore})`).toBeGreaterThanOrEqual(45);
    expect(mediocreScore, `Mediocre resume scored too generously (${mediocreScore})`).toBeLessThanOrEqual(72);

    // Tier 4: Strong quantified resume -> >= 85 + Job Description Match honesty
    const strongContent = {
      name: "Dr. Aria Rostami",
      role: "Senior Computational Biologist",
      email: "aria.rostami@biotech.io",
      phone: "+1 (617) 555-3910",
      location: "Boston, MA",
      linkedin: "linkedin.com/in/ariarostami",
      summary:
        "Computational biologist with 8+ years leading multi-omics pipelines and cloud bioinformatics platforms, reducing variant-calling turnaround by 62%, saving $180K annually in compute spend, and authoring 11 peer-reviewed genomics publications.",
      experience: [
        {
          id: "1",
          role: "Senior Computational Biologist",
          company: "Helix Labs",
          period: "Jan 2021 - Present",
          bullets: [
            "Architected RNA-seq pipeline processing 12,000+ samples with 99.4% clinical concordance.",
            "Reduced AWS cloud compute costs by $180K/year through Nextflow spot orchestration.",
            "Mentored 6 bioinformatics engineers across 3 FDA regulatory submissions.",
          ],
        },
        {
          id: "2",
          role: "Bioinformatics Scientist",
          company: "Genoma Research",
          period: "May 2018 - Dec 2020",
          bullets: [
            "Developed Python and PyTorch biomarker classifier achieving 0.94 AUC across 4 cohorts.",
            "Automated QC reporting for 450+ clinical exomes per quarter, cutting manual review by 70%.",
          ],
        },
      ],
      education: [{ degree: "Ph.D. Bioinformatics", school: "MIT", period: "2014 - 2018" }],
      skills: ["Python", "R", "Nextflow", "PyTorch", "Genomics", "RNA-seq", "Biostatistics", "AWS"],
    };

    const strongRes = await request.post("/api/analyze", {
      data: {
        content: strongContent,
        jobTitle: "Senior Bioinformatics Scientist",
        jobDescription: "Seeking Senior Bioinformatics Scientist with Python, AWS, PyTorch, Nextflow, RNA-seq, and Biostatistics for clinical genomics pipelines.",
      },
    });
    expect(strongRes.status()).toBe(200);
    const strongJson = await strongRes.json();
    const strongScore = Number(strongJson.overallScore ?? -1);
    const matchedJdScore = Number(strongJson?.jobMatch?.matchScore ?? -1);

    const unrelatedJdRes = await request.post("/api/analyze", {
      data: {
        content: strongContent,
        jobTitle: "Senior Tax Accountant",
        jobDescription: "Looking for CPA with GAAP, QuickBooks, SAP, Payroll, Excel, SQL, and Corporate Tax Audit experience.",
      },
    });
    expect(unrelatedJdRes.status()).toBe(200);
    const unrelatedJdScore = Number((await unrelatedJdRes.json())?.jobMatch?.matchScore ?? 100);

    console.log(`[Analyzer Calibration] empty=${emptyScore} | placeholder=${placeholderScore} | mediocre=${mediocreScore} | strong=${strongScore} | jdMatch=${matchedJdScore}% | jdMismatch=${unrelatedJdScore}%`);
    expect(strongScore, `Strong resume scored too low (${strongScore})`).toBeGreaterThanOrEqual(85);
    expect(strongScore).toBeGreaterThan(mediocreScore + 15);
    expect(mediocreScore).toBeGreaterThan(emptyScore + 15);
    expect(matchedJdScore, "Matching JD score too low").toBeGreaterThanOrEqual(75);
    expect(unrelatedJdScore, "Unrelated JD score too high").toBeLessThanOrEqual(35);

    // False-positive boundary check: substrings 'r', 'go', 'ai' inside normal words must NOT match R / Go / AI
    const boundaryRes = await request.post("/api/analyze", {
      data: {
        content: {
          name: "Jordan Lee",
          role: "Retail Store Manager",
          summary: "Focused on product goals, daily details, and retail customer care.",
          skills: ["Retail Operations", "Store Scheduling"],
        },
        jobTitle: "Backend AI Systems Engineer",
        jobDescription: "Must have hands-on production experience in R, Go, AI, Kubernetes, and Terraform.",
      },
    });
    expect(boundaryRes.status()).toBe(200);
    const boundaryJson = await boundaryRes.json();
    const matchedBoundaryHard: string[] = boundaryJson?.jobMatch?.matchedHard || [];
    expect(matchedBoundaryHard, `False-positive substring match detected: ${matchedBoundaryHard.join(", ")}`).not.toContain("R");
    expect(matchedBoundaryHard, `False-positive substring match detected: ${matchedBoundaryHard.join(", ")}`).not.toContain("Go");
    expect(matchedBoundaryHard, `False-positive substring match detected: ${matchedBoundaryHard.join(", ")}`).not.toContain("AI");
    expect(Number(boundaryJson?.jobMatch?.matchScore ?? 100)).toBeLessThanOrEqual(15);

    // Malformed JSON -> 400 (never 500)
    const badJson = await request.post("/api/analyze", {
      headers: { "Content-Type": "application/json" },
      data: "{not-valid-json",
    });
    expect(badJson.status()).toBe(400);

    // Auto-fit numerical sanity across empty and dense resumes on both A4 & Letter
    const denseExp = Array.from({ length: 12 }, (_, i) => ({
      id: `d${i}`,
      role: `Lead Engineer ${i}`,
      company: `Enterprise ${i}`,
      period: "2020 - 2024",
      bullets: Array.from({ length: 5 }, (_, b) => `Delivered measurable platform impact #${b} increasing throughput by 35%.`),
    }));

    for (const [label, content, pageSize] of [
      ["empty-A4", { name: "Minimal" }, "A4"],
      ["dense-Letter", { name: "Dense User", summary: "Summary ".repeat(40), experience: denseExp }, "Letter"],
    ] as const) {
      const fitRes = await request.post("/api/editor/auto-fit", {
        data: { content, seriesId: "14", pageSize, targetPages: 1 },
      });
      expect(fitRes.status(), `Auto-fit failed on ${label}`).toBe(200);
      const fitJson = await fitRes.json();

      const checkNums = (obj: any, path = "") => {
        if (typeof obj === "number") {
          expect(Number.isFinite(obj), `Non-finite auto-fit value at ${path}`).toBe(true);
          expect(obj, `Negative auto-fit value at ${path}`).toBeGreaterThanOrEqual(0);
        } else if (obj && typeof obj === "object") {
          for (const [k, v] of Object.entries(obj)) checkNums(v, `${path}.${k}`);
        }
      };
      checkNums(fitJson);

      const fsVal = fitJson?.settings?.fontSize ?? fitJson?.recommended?.fontSize ?? fitJson?.fontSize;
      if (typeof fsVal === "number") {
        expect(fsVal, `Unreadable fontSize (${fsVal}) on ${label}`).toBeGreaterThanOrEqual(7.5);
        expect(fsVal, `Oversized fontSize (${fsVal}) on ${label}`).toBeLessThanOrEqual(14);
      }
    }
  });

  test("5. Production Security Headers & HttpOnly Cookie Enforcement", async ({ browser }) => {
    const ts = Date.now();
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    const homeRes = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(homeRes).toBeTruthy();
    const h = homeRes!.headers();
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBe("SAMEORIGIN");
    expect(h["referrer-policy"]).toBeTruthy();
    expect(h["permissions-policy"]).toBeTruthy();

    await registerViaUi(page, "Cookie Auditor", `cookie_${ts}@farnavi.test`, "FarnaviPass123!");

    // Browser JS must NEVER be able to read farnavi_session via document.cookie (HttpOnly)
    const jsCookies = await page.evaluate(() => document.cookie);
    expect(jsCookies, "CRITICAL: farnavi_session cookie is readable by JS (missing HttpOnly)!").not.toContain(
      "farnavi_session"
    );

    const browserCookies = await ctx.cookies();
    const sessCookie = browserCookies.find((c) => c.name === "farnavi_session");
    expect(sessCookie, "Session cookie not set").toBeTruthy();
    expect(sessCookie!.httpOnly).toBe(true);
    expect(sessCookie!.sameSite).toBe("Lax");

    await ctx.close();
  });

  test("6. Brute-Force Rate Limiting on /api/auth/login: 11th failed attempt returns 429 with Retry-After without locking other users", async ({
    browser,
  }) => {
    const ts = Date.now();
    const victimEmail = `rl_victim_${ts}@farnavi.test`;
    const innocentEmail = `rl_innocent_${ts}@farnavi.test`;
    const validPass = "FarnaviPass123!";

    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await registerViaUi(page, "Victim User", victimEmail, validPass);
    await page.request.post("/api/auth/logout");

    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    await registerViaUi(page2, "Innocent User", innocentEmail, validPass);
    await page2.request.post("/api/auth/logout");

    // 10 failed attempts -> 401
    for (let i = 1; i <= 10; i++) {
      const r = await page.request.post("/api/auth/login", {
        data: { email: victimEmail, password: `WrongPass_${i}!` },
      });
      expect(r.status(), `Attempt #${i} expected 401`).toBe(401);
    }

    // 11th attempt -> 429 Too Many Requests + Retry-After header
    const blocked = await page.request.post("/api/auth/login", {
      data: { email: victimEmail, password: "WrongPass_11!" },
    });
    expect(blocked.status(), "Brute-force 11th attempt was NOT rate-limited with 429!").toBe(429);
    expect(Number(blocked.headers()["retry-after"] || 0)).toBeGreaterThan(0);

    // Collateral check: Innocent user can still log in cleanly with 200
    const innocentLogin = await page2.request.post("/api/auth/login", {
      data: { email: innocentEmail, password: validPass },
    });
    expect(innocentLogin.status(), "Rate limiter locked out an unrelated user!").toBe(200);

    await Promise.all([ctx.close(), ctx2.close()]);
  });

  test("7. UI-to-API Export Parity: Clean single Word + Vector PDF (no duplicate ATS-Safe Word button) honoring visibility, order & labels", async ({
    browser,
  }) => {
    const ts = Date.now();
    const docId14 = `ui-export-s14-${ts}`;
    const docId24 = `ui-export-s24-${ts}`;
    const hiddenCert = "UI_HIDDEN_CERT_SECRET_5544";
    const hiddenLang = "UI_HIDDEN_LANG_SECRET_5566";
    const customEdu = "Academic Honors";
    const customExp = "Career Milestones";

    const ctx = await browser.newContext({ acceptDownloads: true });
    const page = await ctx.newPage();
    await registerViaUi(page, "Export Telemetry User", `exp_ui_${ts}@farnavi.test`, "FarnaviPass123!");

    const sharedPayload = {
      name: "Clara Lindholm",
      role: "Principal Product Engineer",
      email: "clara.lindholm@farnavi.test",
      phone: "+1 (206) 555-7171",
      location: "Seattle, WA",
      summary: "Led end-to-end cloud architecture across 5 global regions with 99.99% uptime.",
      experience: [
        {
          id: "exp-1",
          role: "Principal Engineer",
          company: "Nordic Cloud",
          period: "Jan 2022 - Present",
          bullets: ["Cut P95 checkout latency by 51% across 3.4M weekly sessions."],
        },
      ],
      education: [
        { id: "edu-1", degree: "M.S. Distributed Systems", school: "KTH Stockholm", period: "2015 - 2017" },
      ],
      skills: ["Distributed Systems", "TypeScript", "PostgreSQL"],
      certifications: [{ name: hiddenCert, issuer: "Private Board", date: "2025" }],
      languages: [hiddenLang],
    };

    const r14 = await page.request.post("/api/documents", {
      data: {
        id: docId14,
        title: "UI Export Parity ATS",
        seriesId: "14",
        content: sharedPayload,
        visibility: { certifications: false, languages: false },
        sectionOrder: ["education", "skills", "experience", "summary"],
        customLabels: { education: customEdu, experience: customExp },
      },
    });
    expect(r14.status()).toBe(201);

    const r24 = await page.request.post("/api/documents", {
      data: {
        id: docId24,
        title: "UI Export Parity 2Col",
        seriesId: "24",
        content: sharedPayload,
        visibility: { certifications: false, languages: false },
      },
    });
    expect(r24.status()).toBe(201);

    // Part A: Series 14 (Single-Column) -> ONE Word + ONE PDF (no duplicate ATS-Safe Word button)
    await page.goto(`/editor/${docId14}`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Download \/ Export/i }).click();
    await expect(page.getByRole("button", { name: /Download ATS-Safe Word/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Download True Word/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Download Live Vector PDF/i })).toBeVisible();

    const [visDl] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /Download True Word/i }).click(),
    ]);
    const visZip = await JSZip.loadAsync(fs.readFileSync((await visDl.path())!));
    const visXml = await visZip.file("word/document.xml")!.async("string");
    const visText = visXml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    expect(visText.toUpperCase()).toContain("CLARA LINDHOLM");
    expect(visText).not.toContain("TECHNICAL:");
    expect((visText.match(/PostgreSQL/g) || []).length).toBe(1);
    expect(visXml).not.toContain(hiddenCert);
    expect(visXml).not.toContain(hiddenLang);

    const [zipDl] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /Full Application Bundle/i }).click(),
    ]);
    const bundleZip = await JSZip.loadAsync(fs.readFileSync((await zipDl.path())!));
    const txtFile = Object.keys(bundleZip.files).find((k) => k.endsWith("_ATS_Plain_Text.txt"));
    expect(txtFile).toBeTruthy();
    const bundleTxt = await bundleZip.file(txtFile!)!.async("string");
    expect(bundleTxt).not.toContain(hiddenCert);
    expect(bundleTxt).not.toContain(hiddenLang);
    expect(bundleTxt.indexOf(customEdu.toUpperCase())).toBeGreaterThan(-1);
    expect(bundleTxt.indexOf(customExp.toUpperCase())).toBeGreaterThan(bundleTxt.indexOf(customEdu.toUpperCase()));

    const [txtDl] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /Download Plain Text/i }).click(),
    ]);
    const txtContent = fs.readFileSync((await txtDl.path())!, "utf8");
    expect(txtContent).not.toContain(hiddenCert);
    expect(txtContent).not.toContain(hiddenLang);
    expect(txtContent.indexOf(customEdu.toUpperCase())).toBeGreaterThan(-1);

    // Part B: Series 24 (Two-Column) -> ONE Word + ONE PDF (no ATS-Safe Word button)
    await page.goto(`/editor/${docId24}`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Download \/ Export/i }).click();
    await expect(page.getByRole("button", { name: /Download ATS-Safe Word/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Download True Word/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Download Live Vector PDF/i })).toBeVisible();

    await ctx.close();
  });

  test("8. Customer-Complaint Audit: All 8 Templates Zero-Overflow A4 Geometry, Required Sections, Hub Identity & Crash Resilience", async ({
    browser,
  }) => {
    const ts = Date.now();
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
    const page = await ctx.newPage();
    const runtimeErrors: string[] = [];
    page.on("pageerror", (e) => runtimeErrors.push(e.message));

    // A. Inspect ALL 8 calibrated starter templates for REAL customer complaints:
    //    1) Zero overflow outside A4 sheet bounds (scrollOverflow <= 2px, clippedBottom === 0, clippedRight === 0)
    //    2) Exact original persona & every core section visibly rendered
    //    3) Export modal matches exact template & has NO duplicate ATS-Safe Word button
    const templates = [
      { id: "doc-executive",     seriesId: "2",  label: "Executive",     name: "JENNIFER DAVIS",       sections: ["SKILLS", "EDUCATION", "PROFESSIONAL SUMMARY", "PROFESSIONAL EXPERIENCE"] },
      { id: "doc-elegant",       seriesId: "3",  label: "Elegant",       name: "JAMES SMITH",          sections: ["CONTACT", "SKILLS", "EDUCATION", "SUMMARY", "EXPERIENCE"] },
      { id: "doc-contemporary",  seriesId: "4",  label: "Double Column", name: "OLIVIA ANDERSON",      sections: ["SKILLS", "EDUCATION", "CERTIFICATION", "SUMMARY", "EXPERIENCE"] },
      { id: "doc-ivy-league",    seriesId: "11", label: "Ivy League",    name: "BLAKE TRUMAN",         sections: ["PROFESSIONAL SUMMARY", "PROFESSIONAL EXPERIENCE", "EDUCATION"] },
      { id: "doc-single-column", seriesId: "12", label: "Single Column", name: "JONAH ROMANO",         sections: ["PROFESSIONAL SUMMARY", "EXPERIENCE", "EDUCATION"] },
      { id: "doc-minimal",       seriesId: "14", label: "Minimal",       name: "JACKSON CALDWELL",     sections: ["PROFESSIONAL PROFILE", "PROFESSIONAL EXPERIENCE", "SKILLS", "PROFESSIONAL DEVELOPMENT"] },
      { id: "doc-photo-column",  seriesId: "22", label: "Photo Column",  name: "THEO FINCH",           sections: ["CONTACT", "SUMMARY", "SKILLS", "EDUCATION", "EXPERIENCE"] },
      { id: "doc-modern",        seriesId: "24", label: "Modern",        name: "FLORENCE NIGHTINGALE", sections: ["EDUCATION", "CERTIFICATION", "SUMMARY", "PROFESSIONAL EXPERIENCE"] },
    ];

    const auditCtx = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
    const auditPage = await auditCtx.newPage();
    auditPage.on("pageerror", (e) => runtimeErrors.push(e.message));
    const auditReg = await auditPage.request.post("/api/auth/register", {
      data: { name: "Template Auditor", email: `audit8_${ts}@farnavi.test`, password: "FarnaviPass123!" },
    });
    expect(auditReg.status()).toBe(201);
    try {
    for (const t of templates) {
      const docId = `${t.id}-audit-${ts}`;
      const cr = await auditPage.request.post("/api/documents", {
        data: { id: docId, title: `${t.label} Resume`, seriesId: t.seriesId, activeTab: "resume", content: {}, settings: { pageSize: "A4", pageCount: 1 } },
      });
      expect(cr.ok(), `Failed to seed isolated doc for Series ${t.seriesId}`).toBeTruthy();
      await auditPage.goto(`/editor/${docId}`, { waitUntil: "domcontentloaded" });
      await expect(auditPage.locator('div[style*="794px"][style*="1123px"]').first()).toBeVisible({ timeout: 15000 });
      await auditPage.evaluate(() => document.fonts.ready);
      await expect(auditPage.locator("body")).not.toContainText("Application error");
      await expect(auditPage.getByRole("button", { name: /Download \/ Export/i })).toBeVisible();

      const geom = await auditPage.evaluate((expectedName) => {
        const allDivs = Array.from(document.querySelectorAll("div"));
        const sheet =
          allDivs.find((el) => {
            const st = el.getAttribute("style") || "";
            return (/width:\s*(595|595\.28|595\.32|210mm|793|794)/i.test(st) && /height:\s*(841|842|297mm|1122|1123)/i.test(st));
          }) ||
          allDivs.find((el) => {
            const cs = getComputedStyle(el);
            const w = parseFloat(cs.width);
            const h = parseFloat(cs.height);
            return w >= 780 && w <= 810 && h >= 1100 && h <= 1140 && (el.innerText || "").toUpperCase().includes(expectedName.split(" ")[0]);
          });
        if (!sheet) return { found: false, text: "", scrollOverflowY: 999, scrollOverflowX: 999, clippedBottom: 999, clippedRight: 999 };
        const sr = sheet.getBoundingClientRect();
        const scale = sr.width / 793.7 || 1;
        let clippedBottom = 0;
        let clippedRight = 0;
        const walker = document.createTreeWalker(sheet, NodeFilter.SHOW_ELEMENT);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const el = node as HTMLElement;
          if (el.children.length > 0 && !["P", "LI", "H1", "H2", "H3", "SPAN"].includes(el.tagName)) continue;
          if (!(el.innerText || "").trim()) continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if ((r.bottom - sr.bottom) / scale > 3) clippedBottom++;
          if ((r.right - sr.right) / scale > 3) clippedRight++;
        }
        return {
          found: true,
          text: (sheet.innerText || "").toUpperCase(),
          scrollOverflowY: Math.round(sheet.scrollHeight - sheet.clientHeight),
          scrollOverflowX: Math.round(sheet.scrollWidth - sheet.clientWidth),
          clippedBottom,
          clippedRight,
        };
      }, t.name);

      expect(geom.found, `Series ${t.seriesId} A4 sheet not found`).toBe(true);
      expect(geom.scrollOverflowY, `Series ${t.seriesId} (${t.label}) overflows vertically`).toBeLessThanOrEqual(2);
      expect(geom.scrollOverflowX, `Series ${t.seriesId} (${t.label}) overflows horizontally`).toBeLessThanOrEqual(2);
      expect(geom.clippedBottom, `Series ${t.seriesId} (${t.label}) clips content past A4 bottom`).toBe(0);
      expect(geom.clippedRight, `Series ${t.seriesId} (${t.label}) clips content past A4 right`).toBe(0);
      expect(geom.text, `Series ${t.seriesId} missing original persona ${t.name}`).toContain(t.name);
      for (const sec of t.sections) {
        expect(geom.text, `Series ${t.seriesId} (${t.label}) missing required section "${sec}"`).toContain(sec);
      }

      await auditPage.getByRole("button", { name: /Download \/ Export/i }).click();
      await expect(auditPage.getByText(new RegExp(`Export & Download.*${t.label}`, "i"))).toBeVisible();
      await expect(auditPage.getByRole("button", { name: /Download ATS-Safe Word/i })).toHaveCount(0);
      await expect(auditPage.getByRole("button", { name: /Download True Word/i })).toBeVisible();
      await expect(auditPage.getByRole("button", { name: /Download Live Vector PDF/i })).toBeVisible();
      await auditPage.keyboard.press("Escape");
    }
    } finally {
      await auditCtx.close();
    }

    // B. Isolated user: corrupted legacy DB doc (fontSize: 0, missing coverLetter/areasOfExpertise) + anti-resurrection
    await registerViaUi(page, "Legacy Crash Guard", `legacy_${ts}@farnavi.test`, "FarnaviPass123!");
    const legacyId = `legacy-corrupt-${ts}`;
    const cr = await page.request.post("/api/documents", {
      data: {
        id: legacyId,
        title: "Corrupted Legacy Executive",
        seriesId: "2",
        content: { name: "Legacy Executive", role: "VP Operations" },
        settings: { pageSize: "A4", pageCount: 1, fontSize: 0, lineHeight: 1.15 },
      },
    });
    expect(cr.status()).toBe(201);
    await page.goto(`/editor/${legacyId}`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("button", { name: /Download \/ Export/i })).toBeVisible();

    const delRes = await page.request.delete(`/api/documents/${legacyId}`);
    expect([200, 204]).toContain(delRes.status());
    await page.goto("about:blank");
    await page.waitForTimeout(300);
    const checkGone = await page.request.get(`/api/documents/${legacyId}`);
    expect(checkGone.status()).toBe(404);

    expect(runtimeErrors, `Client-side errors encountered: ${runtimeErrors.join(" | ")}`).toEqual([]);
    await ctx.close();
  });
});
