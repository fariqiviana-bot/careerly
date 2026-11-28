import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

test.use({ viewport: { width: 1440, height: 1200 } });
const ALL_SERIES = ["2", "3", "4", "11", "12", "14", "22", "24"] as const;

const DENSE_CUSTOMER_CONTENT = {
  name: "Dr. Maximilian Featherstone-Houghton",
  role: "Principal Computational Genomics & Distributed Systems Architect",
  email: "maximilian.featherstone.houghton@international-biogenomics-institute.org",
  phone: "+44 20 7946 0958",
  location: "Cambridge, United Kingdom",
  linkedin: "https://www.linkedin.com/in/maximilian-featherstone-houghton-phd-computational-genomics",
  summary:
    "Seasoned computational biologist and distributed systems architect with 12+ years leading multi-center NGS pipelines, regulatory-grade bioinformatics platforms, and cloud-native clinical analytics across Europe and North America.",
  skills: [
    "Python",
    "Nextflow",
    "Rust",
    "Kubernetes",
    "PostgreSQL",
    "Variant Calling",
    "Single-Cell RNA-seq",
    "Clinical Genomics",
    "ISO 13485",
    "AWS Architecture",
  ],
  technicalSkills: ["PyTorch", "C++20", "Terraform", "GraphQL", "Docker", "Apache Spark"],
  experience: [
    {
      id: "e1",
      role: "Principal Bioinformatics Lead #1",
      company: "European Genomics Lab 1",
      location: "Cambridge, UK",
      period: "2022 - Present",
      bullets: [
        "Architected high-throughput WGS pipeline processing 14,500+ patient samples per quarter with 99.98% reproducibility.",
        "Reduced AWS compute expenditure by 47% ($1.2M/yr) via spot-fleet orchestration and Parquet indexing.",
      ],
    },
    {
      id: "e2",
      role: "Staff Systems Architect #2",
      company: "Nordic Proteomics Lab 2",
      location: "Stockholm, SE",
      period: "2020 - 2022",
      bullets: [
        "Led cross-functional compliance audits across 6 international hospital networks under GDPR and ISO 27001.",
        "Built zero-downtime clinical variant query engine serving 2,800 clinicians.",
      ],
    },
    {
      id: "e3",
      role: "Senior Genomics Engineer #3",
      company: "Zurich Molecular Lab 3",
      location: "Zurich, CH",
      period: "2018 - 2020",
      bullets: [
        "Automated RNA-seq QC workflows cutting analyst turnaround time from 18 hours to 45 minutes.",
      ],
    },
  ],
  education: [
    {
      id: "ed1",
      degree: "Ph.D. in Computational Biology & Bioinformatics",
      school: "University of Cambridge",
      location: "Cambridge, UK",
      period: "2012 - 2016",
    },
    {
      id: "ed2",
      degree: "M.Sc. in Molecular Genetics & Data Science",
      school: "ETH Zurich",
      location: "Zurich, Switzerland",
      period: "2010 - 2012",
    },
  ],
  certifications: [
    { name: "AWS Certified Solutions Architect - Professional", issuer: "Amazon Web Services", date: "2024" },
    { name: "Certified Clinical Genomics Bioinformatician", issuer: "EBMG", date: "2023" },
  ],
};


async function waitForSheets(page: any, isLetter: boolean, expectedCount = 1) {
  const sel = isLetter
    ? 'div[style*="816px"][style*="1056px"]'
    : 'div[style*="794px"][style*="1123px"]';
  await expect(page.locator(sel)).toHaveCount(expectedCount, { timeout: 15000 });
  await expect(page.locator(sel).first()).toBeVisible({ timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
}

async function measureGeometry(page: any, isLetter: boolean) {
  return page.evaluate((letterMode: boolean) => {
    const targetW = letterMode ? 816 : 794;
    const sel = letterMode ? 'div[style*="816px"][style*="1056px"]' : 'div[style*="794px"][style*="1123px"]';
    const sheets = Array.from(document.querySelectorAll(sel));
    if (sheets.length === 0) return { found: false, pages: [] as any[] };
    const pages = sheets.map((sheet, idx) => {
      const sr = sheet.getBoundingClientRect();
      const scale = sr.width / targetW || 1;
      const culprits: string[] = [];
      const walker = document.createTreeWalker(sheet, NodeFilter.SHOW_ELEMENT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const el = node as HTMLElement;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const txt = (el.innerText || "").replace(/\s+/g, " ").trim();
        if (!txt) continue;
        const ob = (r.bottom - sr.bottom) / scale;
        const or = (r.right - sr.right) / scale;
        const selfOvX = Math.round(el.scrollWidth - el.clientWidth);
        const cs = getComputedStyle(el);
        const isLeafish = el.children.length === 0 || ["P", "LI", "H1", "H2", "H3", "SPAN", "A"].includes(el.tagName);
        if (or > 3 && isLeafish) culprits.push(`R+${Math.round(or)}px:"${txt.slice(0, 36)}"`);
        if (ob > 3 && isLeafish) culprits.push(`B+${Math.round(ob)}px:"${txt.slice(0, 36)}"`);
        if (selfOvX > 4 && cs.whiteSpace === "nowrap") culprits.push(`NOWRAP+${selfOvX}px:"${txt.slice(0, 36)}"`);
      }
      return {
        p: idx + 1,
        ovY: Math.round(sheet.scrollHeight - sheet.clientHeight),
        ovX: Math.round(sheet.scrollWidth - sheet.clientWidth),
        culprits: culprits.slice(0, 5),
      };
    });
    return { found: true, pages };
  }, isLetter);
}

test.describe("Phase A1.2: Pessimistic Real-Customer Geometry Audit (All 8 Templates, A4 + US Letter + 2P + Cover)", () => {
  test("1. All 8 templates pass zero-overflow & zero-clipping on Dense Real Resume (A4 1P + US Letter 1P), 2P & Cover, plus S22 header non-collision", async ({ page }) => {
    test.setTimeout(120000);
    const ts = Date.now();
    const email = `phase_a12_${ts}@farnavi.test`;

    const reg = await page.request.post(`${BASE}/api/auth/register`, {
      data: { name: "Geometry Auditor", email, password: "FarnaviPass123!" },
    });
    expect(reg.status()).toBe(201);

    // 1. Dense real customer resume on BOTH A4 1P and US Letter 1P across all 8 templates
    for (const sid of ALL_SERIES) {
      for (const pageSize of ["A4", "Letter"] as const) {
        const id = `a12-${pageSize.toLowerCase()}-s${sid}-${ts}`;
        const cr = await page.request.post(`${BASE}/api/documents`, {
          data: {
            id,
            title: `Dense ${pageSize} S${sid}`,
            seriesId: sid,
            content: DENSE_CUSTOMER_CONTENT,
            settings: { pageSize, pageCount: 1 },
          },
        });
        expect(cr.ok(), `Create failed for S${sid} ${pageSize}`).toBeTruthy();

        await page.goto(`${BASE}/editor/${id}`, { waitUntil: "domcontentloaded" });
        await waitForSheets(page, pageSize === "Letter", 1);
        const res = await measureGeometry(page, pageSize === "Letter");
        expect(res.found, `Sheet missing for S${sid} ${pageSize}`).toBe(true);
        for (const pg of res.pages) {
          expect(pg.ovX, `Horizontal overflow on S${sid} ${pageSize} P${pg.p}: ${JSON.stringify(pg.culprits)}`).toBeLessThanOrEqual(2);
          expect(pg.ovY, `Vertical overflow on S${sid} ${pageSize} P${pg.p}: ${JSON.stringify(pg.culprits)}`).toBeLessThanOrEqual(2);
          expect(pg.culprits, `Clipped/nowrap overflow on S${sid} ${pageSize} P${pg.p}`).toEqual([]);
        }

        // Extra check on Series 22: long name must NOT collide with Profession below double rule
        if (sid === "22" && pageSize === "A4") {
          const overlapCheck = await page.evaluate(() => {
            const nameEl = Array.from(document.querySelectorAll("div")).find((el) =>
              (el.innerText || "").trim().toUpperCase() === "DR. MAXIMILIAN FEATHERSTONE-HOUGHTON"
            );
            const profEl = Array.from(document.querySelectorAll("div")).find((el) =>
              (el.innerText || "").trim().toUpperCase().startsWith("PRINCIPAL COMPUTATIONAL GENOMICS")
            );
            if (!nameEl || !profEl) return { ok: false, reason: "elements not found" };
            const nr = nameEl.getBoundingClientRect();
            const pr = profEl.getBoundingClientRect();
            return { ok: nr.bottom < pr.top - 4, nameBottom: Math.round(nr.bottom), profTop: Math.round(pr.top) };
          });
          expect(overlapCheck.ok, `S22 long name collided with profession: ${JSON.stringify(overlapCheck)}`).toBe(true);
        }
      }
    }

    // 2. Verify 2P & Cover Letter headers on S3, S4, S14, S24 have zero overflow with long names
    for (const sid of ["3", "4", "14", "24"] as const) {
      const id2p = `a12-2p-s${sid}-${ts}`;
      await page.request.post(`${BASE}/api/documents`, {
        data: { id: id2p, title: `Dense 2P S${sid}`, seriesId: sid, content: DENSE_CUSTOMER_CONTENT, settings: { pageSize: "A4", pageCount: 2 } },
      });
      await page.goto(`${BASE}/editor/${id2p}`, { waitUntil: "domcontentloaded" });
      await waitForSheets(page, false, 2);
      const r2 = await measureGeometry(page, false);
      expect(r2.found).toBe(true);
      expect(r2.pages.length).toBe(2);
      for (const pg of r2.pages) {
        expect(pg.ovX, `2P ovX on S${sid} P${pg.p}`).toBeLessThanOrEqual(2);
        expect(pg.culprits, `2P culprits on S${sid} P${pg.p}`).toEqual([]);
      }

      const idCov = `a12-cov-s${sid}-${ts}`;
      await page.request.post(`${BASE}/api/documents`, {
        data: { id: idCov, title: `Dense Cov S${sid}`, seriesId: sid, activeTab: "cover", type: "cover", content: DENSE_CUSTOMER_CONTENT, settings: { pageSize: "A4", pageCount: 1 } },
      });
      await page.goto(`${BASE}/editor/${idCov}`, { waitUntil: "domcontentloaded" });
      await waitForSheets(page, false, 1);
      const rc = await measureGeometry(page, false);
      expect(rc.found).toBe(true);
      for (const pg of rc.pages) {
        expect(pg.ovX, `Cover ovX on S${sid}`).toBeLessThanOrEqual(2);
        expect(pg.culprits, `Cover culprits on S${sid}`).toEqual([]);
      }
    }
  });

  test("2. 10-Bullet Heavy Stress Audit (1P & 2P across all 8 templates): zero vertical clipping on Page 1 & Page 2", async ({ page }) => {
    test.setTimeout(120000);
    const ts = Date.now();
    const email = `phase_a12_heavy_${ts}@farnavi.test`;

    const reg = await page.request.post(`${BASE}/api/auth/register`, {
      data: { name: "Heavy Bullet Auditor", email, password: "FarnaviPass123!" },
    });
    expect(reg.status()).toBe(201);

    const heavyBulletsContent = {
      name: "JACKSON CALDWELL",
      role: "SENIOR OPERATIONS MANAGER",
      email: "youremail@mail.com",
      phone: "(555) 555-5555",
      location: "City, State/Province",
      linkedin: "Linkedin.com/name",
      summary:
        "Begin with key accomplishments, leveraging measurable outcomes to showcase the concrete value you deliver across cross-functional teams. Keep this concise, tailored, and grounded in results.",
      skills: ["Time Management", "Critical Thinking", "Leadership", "Problem Solving", "Creativity", "Strategic Execution", "Stakeholder Alignment"],
      technicalSkills: ["Microsoft Office Suite", "SQL & Tableau", "Jira", "Notion"],
      experience: [
        {
          id: "e1",
          role: "SENIOR OPERATIONS LEAD",
          company: "Company Name",
          location: "Location",
          period: "Date - Present",
          bullets: [
            "Focus on accomplishments that demonstrate how you benefited the employer, such as increasing revenue, reducing costs, or improving efficiency. Use strong action verbs like 'spearheaded' or 'implemented' rather than passive terms like 'responsible for.'",
            "Place your most impactful and relevant achievements at the top to grab attention, using specific metrics where possible to show measurable results.",
            "Emphasize results that align with the hiring company's goals, showcasing leadership, innovation, and contributions that drive organizational growth.",
            "Illustrate your ability to lead projects or teams with clear, measurable examples of positive outcomes.",
          ],
        },
        {
          id: "e2",
          role: "OPERATIONS MANAGER",
          company: "Company Name",
          location: "Location",
          period: "Date - Date",
          bullets: [
            "Review the job listing to pinpoint critical skills, qualifications, or keywords highlighted by the employer. Incorporate these terms naturally into your resume to match the role's needs and boost ATS performance.",
            "Emphasize accomplishments that showcase your capability to fulfill the job's requirements, supported by relevant examples. Align your content with the employer's key priorities to improve your chances of selection.",
            "Ensure ATS compatibility by crafting clear, keyword-focused descriptions of your achievements. Provide the resume in Word or PDF format for optimal system readability.",
          ],
        },
        {
          id: "e3",
          role: "PROJECT COORDINATOR",
          company: "Company Name",
          location: "Location",
          period: "Date - Date",
          bullets: [
            "Ensure ATS compatibility by crafting clear, keyword-focused descriptions of your achievements. Provide the resume in Word or PDF format for optimal system readability.",
            "Demonstrate cross-departmental collaboration by quantifying handoff speed improvements and quarterly SLA adherence across regional teams.",
            "Standardized reporting dashboards and onboarding SOPs adopted by 40+ team members within two quarters.",
          ],
        },
      ],
      education: [
        { id: "ed1", degree: "DEGREE TITLE", school: "University Name", location: "Location", period: "Date" },
        { id: "ed2", degree: "COURSE OR PROGRAM", school: "Institution or Platform", location: "Location", period: "Date" },
      ],
    };

    for (const sid of ALL_SERIES) {
      for (const pageCount of [1, 2] as const) {
        const id = `a12-heavy-s${sid}-${pageCount}p-${ts}`;
        const cr = await page.request.post(`${BASE}/api/documents`, {
          data: {
            id,
            title: `Heavy S${sid} ${pageCount}P`,
            seriesId: sid,
            content: heavyBulletsContent,
            settings: { pageSize: "A4", pageCount },
          },
        });
        expect(cr.ok()).toBeTruthy();

        await page.goto(`${BASE}/editor/${id}`, { waitUntil: "domcontentloaded" });
        await waitForSheets(page, false, pageCount);
        const res = await measureGeometry(page, false);
        expect(res.found).toBe(true);
        for (const pg of res.pages) {
          expect(pg.ovY, `Heavy 10-bullet ovY on S${sid} ${pageCount}P P${pg.p}: ${JSON.stringify(pg.culprits)}`).toBeLessThanOrEqual(2);
          expect(pg.ovX, `Heavy 10-bullet ovX on S${sid} ${pageCount}P P${pg.p}: ${JSON.stringify(pg.culprits)}`).toBeLessThanOrEqual(2);
          expect(pg.culprits, `Heavy 10-bullet clipped on S${sid} ${pageCount}P P${pg.p}`).toEqual([]);
        }
      }
    }
  });
});
