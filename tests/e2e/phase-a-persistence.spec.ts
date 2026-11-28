import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

test.describe("Phase A1.1: Real DB Persistence for Hub CRUD (Rename, Pin, Duplicate, Delete) & Base64-Free localStorage", () => {
  test("1. Rename (no content wipe), Pin sort order, Duplicate without opening editor, Delete permanence & localStorage Base64 guard", async ({ page }) => {
    const ts = Date.now();
    const email = `phase_a11_${ts}@farnavi.test`;

    const reg = await page.request.post(`${BASE}/api/auth/register`, {
      data: { name: "Persistence Auditor", email, password: "FarnaviPass123!" },
    });
    expect(reg.status()).toBe(201);

    const docAId = `a11-doc-a-${ts}`;
    const docBId = `a11-doc-b-${ts}`;
    const bigBase64Photo = "data:image/png;base64," + "A".repeat(14000);

    const createA = await page.request.post(`${BASE}/api/documents`, {
      data: {
        id: docAId,
        title: "Alpha Backend Resume",
        seriesId: "22",
        pinned: false,
        content: {
          name: "Clara Lindholm",
          role: "Principal Backend Engineer",
          email: "clara@farnavi.test",
          photoUrl: bigBase64Photo,
          summary: "Distributed systems leader.",
          skills: ["PostgreSQL", "Kubernetes", "Go"],
          experience: [
            {
              id: "e1",
              role: "Staff Engineer",
              company: "Nordic Systems",
              period: "2021 - Present",
              bullets: ["Scaled multi-region API to 120k RPS."],
            },
          ],
        },
      },
    });
    expect(createA.ok()).toBeTruthy();

    const createB = await page.request.post(`${BASE}/api/documents`, {
      data: {
        id: docBId,
        title: "Beta Product Resume",
        seriesId: "11",
        pinned: false,
        content: { name: "Jonas Berg", role: "Product Lead" },
      },
    });
    expect(createB.ok()).toBeTruthy();

    await page.goto(`${BASE}/documents`, { waitUntil: "networkidle" });
    await expect(page.getByText("Alpha Backend Resume")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Beta Product Resume")).toBeVisible();

    const openMenuFor = async (titleText: string) => {
      const card = page.locator("div.group").filter({ hasText: titleText }).first();
      await expect(card).toBeVisible({ timeout: 10000 });
      await card.locator('button[aria-haspopup="menu"]').first().click();
    };

    // 1. RENAME -> verify persistence across F5 AND zero content wipe
    await openMenuFor("Alpha Backend Resume");
    await page.getByRole("menuitem", { name: /^Rename$/i }).click();
    const renameDialog = page.locator('[role="dialog"]').last();
    await renameDialog.locator("input").first().fill("Alpha Renamed Staff CV");
    const patchRenamePromise = page.waitForResponse(
      (r) => r.url().includes(`/api/documents/${docAId}`) && r.request().method() === "PATCH"
    );
    await renameDialog.getByRole("button", { name: /^Save$/i }).click();
    expect((await patchRenamePromise).status()).toBe(200);

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByText("Alpha Renamed Staff CV")).toBeVisible({ timeout: 15000 });

    const getAAfterRename = await page.request.get(`${BASE}/api/documents/${docAId}`);
    expect(getAAfterRename.status()).toBe(200);
    const docAData = (await getAAfterRename.json()).document;
    expect(docAData.title).toBe("Alpha Renamed Staff CV");
    expect(docAData.seriesId).toBe("22");
    expect(docAData.content.skills).toContain("PostgreSQL");
    expect(docAData.content.experience[0].company).toBe("Nordic Systems");

    // 2. PIN -> reload -> verify DB pinned=true & sorted ahead of Beta
    await openMenuFor("Alpha Renamed Staff CV");
    const patchPinPromise = page.waitForResponse(
      (r) => r.url().includes(`/api/documents/${docAId}`) && r.request().method() === "PATCH"
    );
    await page.getByRole("menuitem", { name: /^Pin$/i }).click();
    expect((await patchPinPromise).status()).toBe(200);

    await page.reload({ waitUntil: "networkidle" });
    const getAAfterPin = await page.request.get(`${BASE}/api/documents/${docAId}`);
    expect((await getAAfterPin.json()).document.pinned).toBe(true);
    const bodyText = await page.locator("main").innerText();
    expect(bodyText.indexOf("Alpha Renamed Staff CV")).toBeGreaterThan(-1);
    expect(bodyText.indexOf("Beta Product Resume")).toBeGreaterThan(-1);
    expect(bodyText.indexOf("Alpha Renamed Staff CV")).toBeLessThan(bodyText.indexOf("Beta Product Resume"));

    // 3. DUPLICATE -> reload WITHOUT opening editor -> verify copy persists in DB
    await openMenuFor("Alpha Renamed Staff CV");
    const dupPromise = page.waitForResponse(
      (r) => r.url().includes(`/api/documents/${docAId}/duplicate`) && r.request().method() === "POST"
    );
    await page.getByRole("menuitem", { name: /^Duplicate$/i }).click();
    const dupRes = await dupPromise;
    expect(dupRes.status()).toBe(201);
    const copyDoc = (await dupRes.json()).document;
    expect(copyDoc.id).not.toBe(docAId);
    expect(copyDoc.title).toBe("Alpha Renamed Staff CV (Copy)");

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByText("Alpha Renamed Staff CV (Copy)")).toBeVisible({ timeout: 15000 });

    // 4. DELETE copy -> reload -> verify permanent removal & 404 in DB
    await openMenuFor("Alpha Renamed Staff CV (Copy)");
    await page.getByRole("menuitem", { name: /^Delete$/i }).click();
    const delPromise = page.waitForResponse(
      (r) => r.url().includes(`/api/documents/${copyDoc.id}`) && r.request().method() === "DELETE"
    );
    await page.locator('[role="alertdialog"], [role="dialog"]').last().getByRole("button", { name: /Delete|Confirm/i }).click();
    expect((await delPromise).status()).toBe(200);

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByText("Alpha Renamed Staff CV (Copy)")).toHaveCount(0);
    const getDeleted = await page.request.get(`${BASE}/api/documents/${copyDoc.id}`);
    expect(getDeleted.status()).toBe(404);

    // 5. Verify Base64 photo bloat stripped from localStorage while DB preserves full photo
    const lsRaw = await page.evaluate(() => {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("farnavi_") && !k.includes("print_snapshot")) {
          return localStorage.getItem(k) || "";
        }
      }
      return "";
    });
    expect(lsRaw).not.toContain("A".repeat(200));
    const getAPhoto = await page.request.get(`${BASE}/api/documents/${docAId}`);
    expect((await getAPhoto.json()).document.content.photoUrl).toBe(bigBase64Photo);
  });
});
