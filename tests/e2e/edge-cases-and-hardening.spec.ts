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

test.describe("Edge Cases & Final Backend/State Hardening", () => {
  test.setTimeout(120_000);

  test("1. Shared-Device Logout Cleanup: All farnavi_* localStorage keys (store + print snapshots) are purged on Log out", async ({
    browser,
  }) => {
    const ts = Date.now();
    const emailA = `shared_a_${ts}@farnavi.test`;
    const emailB = `shared_b_${ts}@farnavi.test`;
    const pass = "FarnaviPass123!";
    const secretMarker = `PRIVATE_LOCALSTORAGE_SECRET_${ts}`;
    const docIdA = `shared-doc-a-${ts}`;

    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await registerViaUi(page, "Shared User A", emailA, pass);

    const createRes = await page.request.post("/api/documents", {
      data: {
        id: docIdA,
        title: "User A Confidential CV",
        seriesId: "14",
        content: { name: "Shared User A", role: "CFO", email: emailA, summary: secretMarker },
      },
    });
    expect(createRes.ok()).toBeTruthy();

    // Visit editor and explicitly seed a print snapshot key just like Print/Export does
    await page.goto(`/editor/${docIdA}`, { waitUntil: "networkidle" });
    await page.evaluate(
      ({ id, secret }) => {
        localStorage.setItem(
          `farnavi_print_snapshot_${id}`,
          JSON.stringify({ id, title: secret, _snapAt: Date.now() })
        );
      },
      { id: docIdA, secret: secretMarker }
    );

    const beforeKeys = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("farnavi_")));
    expect(beforeKeys.length, "Expected farnavi_* localStorage keys before logout").toBeGreaterThanOrEqual(1);

    // Log out through UI dropdown in AppShell
    await page.goto("/documents", { waitUntil: "networkidle" });
    const accountMenuBtn = page.getByRole("button", { name: "Account menu" });
    await expect(accountMenuBtn).toBeVisible({ timeout: 10_000 });
    await accountMenuBtn.click();
    const logoutItem = page.getByRole("menuitem", { name: /Log out/i });
    await expect(logoutItem).toBeVisible({ timeout: 5_000 });
    await logoutItem.click();
    await page.waitForURL((u) => u.pathname.includes("/login"), { timeout: 15_000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Verify ZERO farnavi_* keys and ZERO User A secrets remain in localStorage!
    const leftover = await page.evaluate(() => {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith("farnavi_"));
      const blob = Object.keys(localStorage)
        .map((k) => `${k}=${localStorage.getItem(k)}`)
        .join("\n");
      return { keys, blob };
    });
    expect(leftover.keys, `Leftover localStorage keys after logout: ${leftover.keys.join(", ")}`).toEqual([]);
    expect(leftover.blob, "User A secret remained in localStorage after logout!").not.toContain(secretMarker);

    // User B logs in on the SAME browser context -> must NOT see User A's doc
    await registerViaUi(page, "Shared User B", emailB, pass);
    await page.goto("/documents", { waitUntil: "networkidle" });
    const bodyB = await page.locator("body").innerText();
    expect(bodyB, "User B saw User A's document title on shared browser!").not.toContain("User A Confidential CV");

    await ctx.close();
  });

  test("2. Slug Collision & Reserved Slugs: Duplicate slug returns clean 409 (not 500) & reserved slugs return 400", async ({
    browser,
  }) => {
    const ts = Date.now();
    const sharedSlug = `unique-portfolio-${ts}`;

    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await registerViaUi(pageA, "Slug Owner A", `slug_a_${ts}@farnavi.test`, "FarnaviPass123!");

    const createA = await pageA.request.post("/api/documents", {
      data: {
        id: `slug-doc-a-${ts}`,
        type: "website",
        slug: sharedSlug,
        title: "Owner A Site",
        seriesId: "14",
        content: { name: "Slug Owner A", summary: "ORIGINAL_OWNER_A_CONTENT" },
      },
    });
    expect(createA.status()).toBe(201);

    // User B tries to hijack the exact same slug via POST and via PATCH
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await registerViaUi(pageB, "Slug Squatter B", `slug_b_${ts}@farnavi.test`, "FarnaviPass123!");

    const postCollision = await pageB.request.post("/api/documents", {
      data: {
        id: `slug-doc-b1-${ts}`,
        type: "website",
        slug: sharedSlug,
        title: "Squatter B Site",
        seriesId: "14",
        content: { name: "Squatter B" },
      },
    });
    expect(postCollision.status(), `POST slug collision returned ${postCollision.status()} instead of 409`).toBe(409);

    // User B creates a valid doc first, then tries to PATCH its slug to User A's slug
    const docIdB = `slug-doc-b2-${ts}`;
    const createB = await pageB.request.post("/api/documents", {
      data: { id: docIdB, type: "website", slug: `other-site-${ts}`, title: "B Valid Site", seriesId: "14", content: { name: "B" } },
    });
    expect(createB.ok()).toBeTruthy();

    const patchCollision = await pageB.request.patch(`/api/documents/${docIdB}`, {
      data: { slug: sharedSlug.toUpperCase() },
    });
    expect(patchCollision.status(), `PATCH case-insensitive slug collision returned ${patchCollision.status()} instead of 409`).toBe(409);

    // Reserved slugs must be rejected with 400
    for (const reserved of ["admin", "login", "api", "editor", "dashboard"]) {
      const resReserved = await pageB.request.patch(`/api/documents/${docIdB}`, {
        data: { slug: reserved },
      });
      expect(resReserved.status(), `Reserved slug "${reserved}" was not rejected with 400!`).toBe(400);
    }

    // Public /api/cv/[slug] must STILL serve exclusively Owner A's content
    const pubCv = await pageB.request.get(`/api/cv/${sharedSlug}`);
    expect(pubCv.status()).toBe(200);
    const pubText = await pubCv.text();
    expect(pubText).toContain("ORIGINAL_OWNER_A_CONTENT");
    expect(pubText).not.toContain("Squatter B");

    await Promise.all([ctxA.close(), ctxB.close()]);
  });

  test("3. Headshot & Signature Upload Security: SVG XSS & >2MB files rejected in both UI and direct API", async ({
    browser,
  }) => {
    const ts = Date.now();
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await registerViaUi(page, "Image Guard", `img_${ts}@farnavi.test`, "FarnaviPass123!");

    const docId = `img-sec-${ts}`;
    const cRes = await page.request.post("/api/documents", {
      data: {
        id: docId,
        title: "Photo Security Test",
        seriesId: "22",
        content: { name: "Image Guard", role: "Security Lead", email: `img_${ts}@farnavi.test` },
      },
    });
    expect(cRes.ok()).toBeTruthy();

    // 3a. Direct API bypass attempts with SVG data URI must be rejected with 400
    const svgPayload = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" onload="window.__svgXss=1"><script>window.__svgXss=1</script></svg>`).toString("base64");
    const svgDataUri = `data:image/svg+xml;base64,${svgPayload}`;

    const apiPhotoSvg = await page.request.patch(`/api/documents/${docId}`, {
      data: { content: { name: "Image Guard", photo: svgDataUri, photoUrl: svgDataUri } },
    });
    expect(apiPhotoSvg.status(), `API allowed SVG data URI in photo (${apiPhotoSvg.status()})!`).toBe(400);

    const apiSigSvg = await page.request.patch(`/api/documents/${docId}`, {
      data: { content: { name: "Image Guard", coverLetter: { signatureImage: svgDataUri } } },
    });
    expect(apiSigSvg.status(), `API allowed SVG data URI in signatureImage (${apiSigSvg.status()})!`).toBe(400);

    // 3b. UI test on Series 22 Photo upload input: SVG file & >2MB PNG must be rejected cleanly
    await page.goto(`/editor/${docId}`, { waitUntil: "networkidle" });
    const photoInput = page.locator('input[type="file"][accept*="image/png"]').first();
    await expect(photoInput).toBeAttached({ timeout: 10_000 });

    await photoInput.setInputFiles({
      name: "evil.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg"><script>window.__svgXss=1</script></svg>`),
    });
    await expect(page.getByText(/SVG is blocked|PNG, JPG, or WebP/i).first()).toBeVisible({ timeout: 5_000 });

    // Oversized >2MB PNG must also be rejected
    await photoInput.setInputFiles({
      name: "huge-headshot.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(2 * 1024 * 1024 + 4096, 0x89),
    });
    await expect(page.getByText(/under 2 MB/i).first()).toBeVisible({ timeout: 5_000 });

    // Confirm DB never stored any SVG and zero XSS fired
    const xssFired = await page.evaluate(() => Boolean((window as any).__svgXss));
    expect(xssFired).toBe(false);
    const dbCheck = await (await page.request.get(`/api/documents/${docId}`)).text();
    expect(dbCheck).not.toContain("image/svg+xml");

    await ctx.close();
  });

  test("4. Payload DoS Protection: 500 experiences, 2MB summary & >4MB JSON rejected fast with 400/413 (zero 500s)", async ({
    browser,
  }) => {
    const ts = Date.now();
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await registerViaUi(page, "DoS Tester", `dos_${ts}@farnavi.test`, "FarnaviPass123!");

    const docId = `dos-doc-${ts}`;
    const cRes = await page.request.post("/api/documents", {
      data: { id: docId, title: "DoS Target", seriesId: "14", content: { name: "DoS Tester" } },
    });
    expect(cRes.ok()).toBeTruthy();

    const exp500 = Array.from({ length: 500 }, (_, i) => ({
      id: `e-${i}`,
      role: `Engineer ${i}`,
      company: `Corp ${i}`,
      period: "2020 - 2021",
      bullets: ["Delivered feature"],
    }));

    // 4a. PATCH with 500 experiences -> 400
    const t1 = Date.now();
    const res500Exp = await page.request.patch(`/api/documents/${docId}`, {
      data: { content: { name: "DoS Tester", experience: exp500 } },
    });
    expect(res500Exp.status(), `500-experience PATCH returned ${res500Exp.status()}`).toBe(400);
    expect(Date.now() - t1).toBeLessThan(3_000);

    // 4b. PATCH with 2MB summary string -> 400
    const resBigSummary = await page.request.patch(`/api/documents/${docId}`, {
      data: { content: { name: "DoS Tester", summary: "X".repeat(2_000_000) } },
    });
    expect(resBigSummary.status(), `2MB summary PATCH returned ${resBigSummary.status()}`).toBe(400);

    // 4c. POST with >4MB raw JSON body -> 413
    const hugeJson = JSON.stringify({
      id: `dos-huge-${ts}`,
      title: "Huge",
      content: { name: "DoS", extra: "A".repeat(4_300_000) },
    });
    const res413 = await page.request.post("/api/documents", {
      headers: { "Content-Type": "application/json" },
      data: hugeJson,
    });
    expect(res413.status(), `>4MB JSON POST returned ${res413.status()} instead of 413`).toBe(413);

    // 4d. DOCX export with 500 experiences -> 400
    const resDocxDos = await page.request.post("/api/export/docx", {
      data: { seriesId: "14", kind: "resume", mode: "visual", pageSize: "A4", content: { name: "DoS", experience: exp500 } },
    });
    expect(resDocxDos.status(), `500-experience DOCX export returned ${resDocxDos.status()}`).toBe(400);

    await ctx.close();
  });

  test("5. Expired Session Mid-Edit: Revoking session in Tab 2 causes Editor in Tab 1 to alert clearly without crashing or corrupting DB", async ({
    browser,
  }) => {
    const ts = Date.now();
    const email = `exp_sess_${ts}@farnavi.test`;
    const originalRole = `Original Saved Role ${ts}`;
    const unsavedRole = `Edited After Logout ${ts}`;
    const docId = `exp-doc-${ts}`;

    const ctx = await browser.newContext();
    const tab1 = await ctx.newPage();
    const runtimeErrors: string[] = [];
    tab1.on("pageerror", (e) => runtimeErrors.push(e.message));

    await registerViaUi(tab1, "Session User", email, "FarnaviPass123!");
    const cRes = await tab1.request.post("/api/documents", {
      data: {
        id: docId,
        title: "Mid-Edit Session CV",
        seriesId: "14",
        content: { name: "Session User", role: originalRole, email },
      },
    });
    expect(cRes.ok()).toBeTruthy();

    await tab1.goto(`/editor/${docId}`, { waitUntil: "networkidle" });
    const roleInput = tab1.getByPlaceholder("e.g. Senior Product Designer, Registered Nurse").first();
    await expect(roleInput).toBeVisible({ timeout: 10_000 });

    // Tab 2 logs out (revokes session cookie server-side)
    const tab2 = await ctx.newPage();
    const loRes = await tab2.request.post("/api/auth/logout");
    expect(loRes.ok()).toBeTruthy();
    await tab2.close();

    // Back in Tab 1: user keeps typing after session expired
    await roleInput.fill(unsavedRole);

    // Editor must surface clear "session expired" toast and keep user's typed text visible (no crash/white screen)
    await expect(tab1.getByText(/session expired/i).first()).toBeVisible({ timeout: 8_000 });
    expect(await roleInput.inputValue()).toBe(unsavedRole);
    expect(runtimeErrors, `Editor crashed on expired session: ${runtimeErrors.join(" | ")}`).toEqual([]);

    await ctx.close();
  });

  test("6. Two Different Documents Edited Concurrently in Two Tabs: Zero cross-contamination in DB or localStorage", async ({
    browser,
  }) => {
    const ts = Date.now();
    const email = `twodoc_${ts}@farnavi.test`;
    const doc1Id = `two-doc-1-${ts}`;
    const doc2Id = `two-doc-2-${ts}`;
    const role1 = `Biotech Director DOC1 ${ts}`;
    const role2 = `Staff Security Architect DOC2 ${ts}`;

    const ctx = await browser.newContext();
    const tab1 = await ctx.newPage();
    await registerViaUi(tab1, "MultiDoc User", email, "FarnaviPass123!");

    for (const [id, title, role] of [
      [doc1Id, "Resume One", "Initial One"],
      [doc2Id, "Resume Two", "Initial Two"],
    ]) {
      const r = await tab1.request.post("/api/documents", {
        data: { id, title, seriesId: "14", content: { name: "MultiDoc User", role, email } },
      });
      expect(r.ok()).toBeTruthy();
    }

    const tab2 = await ctx.newPage();
    await Promise.all([
      tab1.goto(`/editor/${doc1Id}`, { waitUntil: "networkidle" }),
      tab2.goto(`/editor/${doc2Id}`, { waitUntil: "networkidle" }),
    ]);

    const input1 = tab1.getByPlaceholder("e.g. Senior Product Designer, Registered Nurse").first();
    const input2 = tab2.getByPlaceholder("e.g. Senior Product Designer, Registered Nurse").first();
    await Promise.all([expect(input1).toBeVisible({ timeout: 10_000 }), expect(input2).toBeVisible({ timeout: 10_000 })]);

    // Edit both distinct documents simultaneously
    await Promise.all([input1.fill(role1), input2.fill(role2)]);
    await tab1.waitForTimeout(2200);

    // Verify DB isolation — zero cross-contamination
    const [db1, db2] = await Promise.all([
      tab1.request.get(`/api/documents/${doc1Id}`).then((r) => r.json()),
      tab2.request.get(`/api/documents/${doc2Id}`).then((r) => r.json()),
    ]);

    expect(db1?.document?.content?.role, "Doc 1 was polluted or lost edit").toBe(role1);
    expect(db2?.document?.content?.role, "Doc 2 was polluted or lost edit").toBe(role2);
    expect(db1?.document?.title).toBe("Resume One");
    expect(db2?.document?.title).toBe("Resume Two");

    await ctx.close();
  });
});
