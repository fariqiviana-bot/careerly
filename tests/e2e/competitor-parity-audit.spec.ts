import { test, expect, type Page } from "@playwright/test";
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

  test("4. Analyzer Honesty & Auto-Fit Numerical Safety (Rezi / Enhancv Parity)", async ({ request }) => {
    const weakRes = await request.post("/api/analyze", {
      data: { content: { name: "Test", experience: [], skills: [] } },
    });
    expect(weakRes.status()).toBe(200);
    const weakJson = await weakRes.json();
    const weakScore = Number(weakJson.score ?? weakJson.overallScore ?? weakJson.totalScore ?? -1);

    const strongRes = await request.post("/api/analyze", {
      data: {
        content: {
          name: "Dr. Aria Rostami",
          role: "Senior Computational Biologist",
          email: "aria.rostami@biotech.io",
          phone: "+1 (617) 555-3910",
          location: "Boston, MA",
          linkedin: "linkedin.com/in/ariarostami",
          summary:
            "Computational biologist with 8+ years leading multi-omics pipelines, reducing variant-calling turnaround by 62% and authoring 11 peer-reviewed papers.",
          experience: [
            {
              id: "1",
              role: "Senior Computational Biologist",
              company: "Helix Labs",
              period: "2021 - Present",
              bullets: [
                "Architected RNA-seq pipeline processing 12,000+ samples with 99.4% concordance.",
                "Reduced cloud compute costs by $180K/year through Nextflow spot orchestration.",
                "Mentored 6 bioinformatics engineers across 3 FDA regulatory submissions.",
              ],
            },
            {
              id: "2",
              role: "Bioinformatics Scientist",
              company: "Genoma Research",
              period: "2018 - 2021",
              bullets: [
                "Developed ML biomarker classifier achieving 0.94 AUC across 4 independent cohorts.",
                "Automated QC reporting for 450+ clinical exomes per quarter.",
              ],
            },
          ],
          education: [{ degree: "Ph.D. Bioinformatics", school: "MIT", period: "2014 - 2018" }],
          skills: ["Python", "R", "Nextflow", "PyTorch", "Genomics", "RNA-seq", "Biostatistics", "AWS"],
        },
      },
    });
    expect(strongRes.status()).toBe(200);
    const strongJson = await strongRes.json();
    const strongScore = Number(strongJson.score ?? strongJson.overallScore ?? strongJson.totalScore ?? -1);

    console.log(`[Analyzer Honesty] weakScore=${weakScore} | strongScore=${strongScore}`);
    expect(weakScore).toBeGreaterThanOrEqual(0);
    expect(strongScore).toBeLessThanOrEqual(100);
    expect(strongScore, "Strong quantified resume did not outscore empty weak resume!").toBeGreaterThan(weakScore + 15);

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

      // Recursively assert all numeric outputs are finite & non-negative
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
});
