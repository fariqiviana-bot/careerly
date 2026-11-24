import { test, expect } from "@playwright/test";

test.describe("Multi-User Auth & DB Persistence (Tracker, Interviews, /cv/[slug])", () => {
  test.setTimeout(90_000);

  test("1. Register User A -> persist Tracker & Interview across reload -> strict isolation for User B -> re-login User A", async ({ browser }) => {
    const ts = Date.now();
    const emailA = `user_a_${ts}@farnavi.test`;
    const emailB = `user_b_${ts}@farnavi.test`;
    const pass = "FarnaviPass123!";

    // --- User A registers via real /login UI ---
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();

    await pageA.goto("/login", { waitUntil: "domcontentloaded" });
    await pageA.getByRole("button", { name: /Create Account/i }).first().click();
    await pageA.getByPlaceholder("Sara Mohammadi").fill("Alice Tester");
    await pageA.getByPlaceholder("you@example.com").fill(emailA);
    await pageA.getByPlaceholder("At least 6 characters").fill(pass);
    await pageA.locator("form").getByRole("button", { name: /^Create Account$/i }).click();
    await pageA.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 15_000 });

    // Verify /api/auth/me confirms real authenticated session
    const meA = await pageA.request.get("/api/auth/me");
    const meAData = await meA.json();
    expect(meAData.authenticated).toBe(true);
    expect(meAData.user.email).toBe(emailA);

    // Create a Job Tracker entry via API & verify it renders and survives hard reload on /tracker
    const trRes = await pageA.request.post("/api/tracker", {
      data: { title: "Staff Bioinformatician", company: "Genomics Co", status: "applied", salary: "$160k" },
    });
    expect(trRes.status()).toBe(201);

    await pageA.goto("/tracker", { waitUntil: "domcontentloaded" });
    await expect(pageA.getByText("Staff Bioinformatician")).toBeVisible({ timeout: 10_000 });
    await pageA.reload({ waitUntil: "domcontentloaded" });
    await expect(pageA.getByText("Staff Bioinformatician")).toBeVisible({ timeout: 10_000 });

    // Create an Interview session via API & verify it survives hard reload on /interviews
    const intRes = await pageA.request.post("/api/interviews", {
      data: { title: "Lead ML Scientist", company: "DeepBio", seniority: "Senior", mode: "Personalized" },
    });
    expect(intRes.status()).toBe(201);

    await pageA.goto("/interviews", { waitUntil: "domcontentloaded" });
    await expect(pageA.getByText("Lead ML Scientist")).toBeVisible({ timeout: 10_000 });
    await pageA.reload({ waitUntil: "domcontentloaded" });
    await expect(pageA.getByText("Lead ML Scientist")).toBeVisible({ timeout: 10_000 });

    // Logout User A
    const outRes = await pageA.request.post("/api/auth/logout");
    expect(outRes.ok()).toBeTruthy();

    // --- User B registers in a fresh context -> MUST NOT see User A's records ---
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();

    const regB = await pageB.request.post("/api/auth/register", {
      data: { name: "Bob Isolated", email: emailB, password: pass },
    });
    expect(regB.status()).toBe(201);

    const bTracks = await (await pageB.request.get("/api/tracker")).json();
    const bInts = await (await pageB.request.get("/api/interviews")).json();
    expect(bTracks.items).toEqual([]);
    expect(bInts.items).toEqual([]);

    await pageB.goto("/tracker", { waitUntil: "domcontentloaded" });
    await pageB.waitForTimeout(600);
    await expect(pageB.locator("body")).not.toContainText("Staff Bioinformatician");

    // --- Negative auth check: wrong password returns 401 ---
    const badLogin = await pageB.request.post("/api/auth/login", {
      data: { email: emailA, password: "WrongPassword999" },
    });
    expect(badLogin.status()).toBe(401);

    // --- User A signs back in via /login UI -> sees their exact persisted data ---
    await pageA.goto("/login", { waitUntil: "domcontentloaded" });
    await pageA.getByPlaceholder("you@example.com").fill(emailA);
    await pageA.getByPlaceholder("At least 6 characters").fill(pass);
    await pageA.locator("form").getByRole("button", { name: /^Sign In$/i }).click();
    await pageA.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 15_000 });

    await pageA.goto("/tracker", { waitUntil: "domcontentloaded" });
    await expect(pageA.getByText("Staff Bioinformatician")).toBeVisible({ timeout: 10_000 });

    await ctxA.close();
    await ctxB.close();
  });

  test("2. Personal Website /cv/[slug] loads live from DB in a brand-new Incognito browser", async ({ browser, request }) => {
    const slug = `qa-cv-${Date.now()}`;
    const docId = `doc_cv_${Date.now()}`;

    const createRes = await request.post("/api/documents", {
      data: {
        id: docId,
        type: "website",
        slug,
        title: "QA Public Portfolio",
        seriesId: "14",
        content: {
          name: "Dr. Mina Karimi",
          role: "Computational Biologist",
          email: "mina@example.com",
          summary: "Building next-generation genomics pipelines.",
          skills: ["Python", "Next.js", "Bioinformatics"],
          experience: [],
          education: [],
        },
      },
    });
    expect(createRes.status()).toBe(201);

    // Open in completely fresh context (zero localStorage, zero cookies)
    const incognito = await browser.newContext();
    const page = await incognito.newPage();
    await page.goto(`/cv/${slug}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Dr. Mina Karimi")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Computational Biologist")).toBeVisible();

    await incognito.close();
    await request.delete(`/api/documents/${docId}`);
  });
});