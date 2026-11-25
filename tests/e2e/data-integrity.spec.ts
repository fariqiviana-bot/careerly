import { test, expect, type Page } from "@playwright/test";

async function registerViaUi(page: Page, name: string, email: string, password: string) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Create Account/i }).first().click();
  await page.getByPlaceholder("Sara Mohammadi").fill(name);
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("At least 6 characters").fill(password);
  await page.locator("form").getByRole("button", { name: /^Create Account$/i }).click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 15_000 });
}

async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator("form").locator('button[type="submit"]').click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 15_000 });
}

async function waitForSaved(page: Page) {
  await page.waitForTimeout(1300);
  await page.waitForLoadState("networkidle").catch(() => {});
}

test.describe("Data Integrity, Persistence, Concurrency & Duplicate Isolation", () => {
  test.setTimeout(120_000);

  test("1. Data Schema Independence: 3 experiences + 5 skills survive 2 template switches with F5 reload after each", async ({
    browser,
  }) => {
    const ts = Date.now();
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    await registerViaUi(page, "Schema Tester", `schema_${ts}@farnavi.test`, "FarnaviPass123!");

    const docId = `schema-doc-${ts}`;
    const seedContent = {
      name: "Viana Fariqi",
      firstName: "Viana",
      lastName: "Fariqi",
      role: "Lead Bioinformatics Architect",
      email: `schema_${ts}@farnavi.test`,
      phone: "+1 (415) 555-0192",
      location: "San Francisco, CA",
      summary: "Built genomic pipelines and clinical decision platforms across three high-growth biotech teams.",
      skills: [
        "Genomic Annotation",
        "CRISPR Primer Design",
        "FastAPI Architecture",
        "Statistical Modeling",
        "Clinical Compliance",
      ],
      technicalSkills: ["Python", "TypeScript", "Next.js"],
      experience: [
        {
          id: "exp-1",
          role: "Principal Computational Biologist",
          company: "Niyaman BioLabs",
          location: "Boston, MA",
          period: "2024 - Present",
          bullets: ["Architected 26 modular sequence analysis workflows serving 12,000 researchers."],
        },
        {
          id: "exp-2",
          role: "Senior Bioinformatics Engineer",
          company: "Helix Dynamics",
          location: "Seattle, WA",
          period: "2021 - 2024",
          bullets: ["Reduced whole-genome variant calling latency by 64% using vectorized pipelines."],
        },
        {
          id: "exp-3",
          role: "Molecular Data Analyst",
          company: "Pacific Diagnostics",
          location: "San Diego, CA",
          period: "2019 - 2021",
          bullets: ["Automated QC reporting for 4,500 clinical RNA-seq samples with 99.8% accuracy."],
        },
      ],
      education: [
        {
          id: "edu-1",
          degree: "B.S. in Cellular & Molecular Biology",
          school: "State University",
          period: "2019",
        },
      ],
    };

    const createRes = await page.request.post("/api/documents", {
      data: { id: docId, title: "Schema Independence Resume", seriesId: "3", content: seedContent },
    });
    expect(createRes.ok()).toBeTruthy();

    await page.goto(`/editor/${docId}`, { waitUntil: "networkidle" });

    const assertAllFieldsPresent = async (stage: string) => {
      const bodyText = await page.locator("body").innerText();
      expect(bodyText, `[${stage}] Name missing`).toMatch(/Viana/i);
      expect(bodyText, `[${stage}] Last name missing`).toMatch(/Fariqi/i);
      expect(bodyText, `[${stage}] Job title missing`).toMatch(/Lead Bioinformatics Architect/i);

      for (const expCheck of [
        "Principal Computational Biologist",
        "Niyaman BioLabs",
        "Senior Bioinformatics Engineer",
        "Helix Dynamics",
        "Molecular Data Analyst",
        "Pacific Diagnostics",
      ]) {
        expect(bodyText, `[${stage}] Experience text missing: ${expCheck}`).toContain(expCheck);
      }

      for (const skill of seedContent.skills) {
        expect(bodyText, `[${stage}] Skill missing: ${skill}`).toContain(skill);
      }
    };

    await assertAllFieldsPresent("Initial Series 3");

    // Switch #1 -> Series 14 (index 5 in 8-card grid) + F5 reload
    await page.getByRole("button", { name: /Designer & Layout/i }).click();
    const cards = page.locator("div.grid.grid-cols-2 button:has(img)");
    await expect(cards).toHaveCount(8);

    await cards.nth(5).click();
    await waitForSaved(page);
    await assertAllFieldsPresent("After Switch #1 (before F5)");

    await page.reload({ waitUntil: "networkidle" });
    await assertAllFieldsPresent("After Switch #1 + F5");

    // Switch #2 -> Series 24 (index 7 in 8-card grid) + F5 reload
    await page.getByRole("button", { name: /Designer & Layout/i }).click();
    await expect(cards).toHaveCount(8);

    await cards.nth(7).click();
    await waitForSaved(page);
    await assertAllFieldsPresent("After Switch #2 (before F5)");

    await page.reload({ waitUntil: "networkidle" });
    await assertAllFieldsPresent("After Switch #2 + F5");

    await ctx.close();
  });

  test("2. Real DB Persistence: Edits in Context A appear in brand-new Incognito Context B after login", async ({
    browser,
  }) => {
    const ts = Date.now();
    const email = `db_incog_${ts}@farnavi.test`;
    const pass = "FarnaviPass123!";
    const docId = `db-incog-doc-${ts}`;
    const updatedRole = `Staff Genomics Director ${ts}`;
    const updatedPhone = "+1 (650) 555-8844";

    // Context A: register, create doc, edit via UI, wait for DB autosave
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await registerViaUi(pageA, "DB Persist User", email, pass);

    const createRes = await pageA.request.post("/api/documents", {
      data: {
        id: docId,
        title: "Incognito Persistence CV",
        seriesId: "24",
        content: {
          name: "DB Persist User",
          firstName: "DB",
          lastName: "Persist User",
          role: "Initial Role",
          email,
          phone: "(555) 000-0000",
        },
      },
    });
    expect(createRes.ok()).toBeTruthy();

    await pageA.goto(`/editor/${docId}`, { waitUntil: "networkidle" });
    await pageA.getByPlaceholder("e.g. Senior Product Designer, Registered Nurse").fill(updatedRole);
    const phoneInput = pageA
      .locator("label", { hasText: /^Phone Number$/i })
      .locator("..")
      .locator("..")
      .locator('input:not([type="checkbox"])')
      .first();
    await phoneInput.fill(updatedPhone);
    await waitForSaved(pageA);
    await ctxA.close();

    // Context B: brand-new Incognito context (zero cookies, zero localStorage)
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await loginViaUi(pageB, email, pass);
    await pageB.goto(`/editor/${docId}`, { waitUntil: "networkidle" });

    const bodyText = await pageB.locator("body").innerText();
    expect(bodyText).toContain(updatedRole);
    expect(bodyText).toContain(updatedPhone);

    await ctxB.close();
  });

  test("3. Concurrent Two-Tab Editing: Tab 1 edits Role, Tab 2 edits Phone -> no 500s, no crashes, no white screen", async ({
    browser,
  }) => {
    const ts = Date.now();
    const email = `twotab_${ts}@farnavi.test`;
    const pass = "FarnaviPass123!";
    const docId = `twotab-doc-${ts}`;
    const newRole = `Chief Scientist ${ts}`;
    const newPhone = "+44 20 7946 0958";

    const ctx = await browser.newContext();
    const tab1 = await ctx.newPage();
    const server500s: string[] = [];
    const crashes: string[] = [];

    const attachGuards = (p: Page, label: string) => {
      p.on("pageerror", (e) => crashes.push(`${label}: ${e.message}`));
      p.on("response", (r) => {
        if (r.status() >= 500) server500s.push(`${label}: ${r.status()} ${r.url()}`);
      });
    };
    attachGuards(tab1, "Tab1");

    await registerViaUi(tab1, "Concurrency Tester", email, pass);

    const createRes = await tab1.request.post("/api/documents", {
      data: {
        id: docId,
        title: "Two-Tab Test CV",
        seriesId: "14",
        content: {
          name: "Concurrency Tester",
          firstName: "Concurrency",
          lastName: "Tester",
          role: "Original Role",
          email,
          phone: "(555) 111-2222",
        },
      },
    });
    expect(createRes.ok()).toBeTruthy();

    // Open same document simultaneously in Tab 1 and Tab 2
    await tab1.goto(`/editor/${docId}`, { waitUntil: "networkidle" });
    const tab2 = await ctx.newPage();
    attachGuards(tab2, "Tab2");
    await tab2.goto(`/editor/${docId}`, { waitUntil: "networkidle" });

    // Edit Job Title in Tab 1
    await tab1.getByPlaceholder("e.g. Senior Product Designer, Registered Nurse").fill(newRole);
    // Edit Phone Number in Tab 2
    const phoneInput2 = tab2
      .locator("label", { hasText: /^Phone Number$/i })
      .locator("..")
      .locator("..")
      .locator('input:not([type="checkbox"])')
      .first();
    await phoneInput2.fill(newPhone);

    await Promise.all([waitForSaved(tab1), waitForSaved(tab2)]);

    // Reload both tabs
    await Promise.all([
      tab1.reload({ waitUntil: "networkidle" }),
      tab2.reload({ waitUntil: "networkidle" }),
    ]);

    const t1Text = await tab1.locator("body").innerText();
    const t2Text = await tab2.locator("body").innerText();

    // No white screen, no 500s, no runtime crashes
    expect(server500s, `Server 500 errors: ${server500s.join(" | ")}`).toEqual([]);
    expect(crashes, `Runtime crashes: ${crashes.join(" | ")}`).toEqual([]);
    expect(t1Text.trim().length).toBeGreaterThan(100);
    expect(t2Text.trim().length).toBeGreaterThan(100);
    expect(t1Text).toMatch(/Concurrency/i);
    expect(t2Text).toMatch(/Concurrency/i);

    const roleKept = t1Text.includes(newRole) && t2Text.includes(newRole);
    const phoneKept = t1Text.includes(newPhone) && t2Text.includes(newPhone);
    console.log(
      `[Two-Tab Result] roleKept=${roleKept} | phoneKept=${phoneKept} | strategy=${
        roleKept && phoneKept ? "field-level merge" : "optimistic-lock / last-write"
      }`
    );
    expect(roleKept, "Tab 1 Role edit must persist after concurrent two-tab merge").toBe(true);
    expect(phoneKept, "Tab 2 Phone edit must persist after concurrent two-tab merge").toBe(true);

    await ctx.close();
  });

  test("4. Independent Duplicate: Duplicating in dashboard and editing copy never mutates original", async ({
    browser,
  }) => {
    const ts = Date.now();
    const email = `dup_${ts}@farnavi.test`;
    const pass = "FarnaviPass123!";
    const origDocId = `orig-doc-${ts}`;
    const origTitle = `Master Resume ${ts}`;

    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await registerViaUi(page, "Original Owner", email, pass);

    const createRes = await page.request.post("/api/documents", {
      data: {
        id: origDocId,
        title: origTitle,
        seriesId: "3",
        content: {
          name: "Elena Rostova",
          firstName: "Elena",
          lastName: "Rostova",
          role: "Clinical Trial Manager",
          email,
          phone: "(555) 222-3333",
          experience: [
            {
              id: "orig-exp-1",
              role: "Original Clinical Lead",
              company: "Original Pharma Corp",
              period: "2020 - Present",
              bullets: ["Led Phase III multi-center oncology trials."],
            },
          ],
        },
      },
    });
    expect(createRes.ok()).toBeTruthy();

    // Open Documents hub and Duplicate the original resume via DocCard menu
    await page.goto("/documents", { waitUntil: "networkidle" });
    const origCard = page.locator("div.group").filter({ hasText: origTitle }).first();
    await expect(origCard).toBeVisible({ timeout: 10_000 });

    // Open card dropdown (the icon-only menu button) and click Duplicate
    await origCard.locator('button[aria-haspopup="menu"]').first().click();
    await page.getByRole("menuitem", { name: /^Duplicate$/i }).click();
    await page.waitForTimeout(800);

    // Open the duplicated copy card
    const copyCard = page
      .locator("div.group")
      .filter({ hasText: new RegExp(`${origTitle}.*Copy|Copy.*${origTitle}`, "i") })
      .first();
    await expect(copyCard).toBeVisible({ timeout: 10_000 });

    // Click Edit / open the copy in Studio
    await copyCard.getByRole("button", { name: /Edit|Open/i }).first().click();
    await page.waitForURL(/\/editor\//, { timeout: 15_000 });
    await page.waitForLoadState("networkidle");

    const copyUrl = page.url();
    expect(copyUrl).not.toContain(origDocId);

    // Edit Name & Experience in the duplicated copy
    await page.getByPlaceholder("e.g. Viana").fill("Marcus");
    await page.locator("label", { hasText: /Last Name/i }).locator("..").locator('input:not([type="checkbox"])').fill("Vance");

    // Expand Experience section if collapsed and edit first Job Title
    const expJobInput = page.getByPlaceholder("e.g. Senior Product Designer").first();
    if (!(await expJobInput.isVisible().catch(() => false))) {
      await page.getByRole("button", { name: /Professional Experience/i }).first().click();
    }
    await expJobInput.fill("Modified Copy Role");
    await waitForSaved(page);

    // Reload copy and verify copy kept its own edits
    await page.reload({ waitUntil: "networkidle" });
    const copyTextAfterReload = await page.locator("body").innerText();
    expect(copyTextAfterReload).toMatch(/Marcus/i);
    expect(copyTextAfterReload).toMatch(/Vance/i);
    expect(copyTextAfterReload).toContain("Modified Copy Role");

    // Navigate back to original resume and reload -> verify ZERO changes to original
    await page.goto(`/editor/${origDocId}`, { waitUntil: "networkidle" });
    await page.reload({ waitUntil: "networkidle" });
    const origText = await page.locator("body").innerText();
    expect(origText).toMatch(/Elena/i);
    expect(origText).toMatch(/Rostova/i);
    expect(origText).toContain("Original Clinical Lead");
    expect(origText).not.toContain("Marcus");
    expect(origText).not.toContain("Modified Copy Role");

    await ctx.close();
  });
});
