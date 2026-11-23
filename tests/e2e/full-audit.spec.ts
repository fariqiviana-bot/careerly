import { test, expect } from "@playwright/test";
import fs from "fs";
import JSZip from "jszip";

type Severity = "P0" | "P1" | "P2";
interface BugItem {
  severity: Severity;
  area: string;
  target: string;
  detail: string;
}

const bugs: BugItem[] = [];
const addBug = (severity: Severity, area: string, target: string, detail: string) => {
  bugs.push({ severity, area, target, detail });
};

const EXPECTED_PERSONAS: Record<string, { seriesId: string; expectedName: string }> = {
  "Executive":     { seriesId: "2",  expectedName: "JENNIFER DAVIS" },
  "Elegant":       { seriesId: "3",  expectedName: "JAMES SMITH" },
  "Double Column": { seriesId: "4",  expectedName: "OLIVIA ANDERSON" },
  "Ivy League":    { seriesId: "11", expectedName: "BLAKE TRUMAN" },
  "Single Column": { seriesId: "12", expectedName: "JONAH ROMANO" },
  "Minimal":       { seriesId: "14", expectedName: "JACKSON CALDWELL" },
  "Photo Column":  { seriesId: "22", expectedName: "THEO FINCH" },
  "Modern":        { seriesId: "24", expectedName: "FLORENCE NIGHTINGALE" },
};

const APP_PAGES = [
  "/",
  "/documents",
  "/templates",
  "/checker",
  "/jobs",
  "/tracker",
  "/interviews",
  "/auto-apply",
  "/ai",
  "/ai/career-map",
  "/ai/linkedin",
  "/tools",
  "/settings",
  "/pricing",
  "/help",
  "/login",
  "/cv/viana-fariqi",
];

test.describe.serial("Farnavi Master Full-Site & Backend Audit", () => {
  test.setTimeout(240_000);

  // =========================================================================
  // PART 1: SITE-WIDE PAGE CRAWLER (17 App Routes)
  // =========================================================================
  test("Audit 1: Crawl all 17 app pages (JS errors, HTTP 4xx/5xx, broken images, bad text)", async ({ page }) => {
    for (const route of APP_PAGES) {
      const pageErrors: string[] = [];
      const consoleErrors: string[] = [];
      const badResponses: string[] = [];

      const onPageError = (e: Error) => pageErrors.push(e.message);
      const onConsole = (m: any) => { if (m.type() === "error") consoleErrors.push(m.text()); };
      const onResp = (r: any) => {
        if (r.status() >= 400) badResponses.push(`${r.status()} ${new URL(r.url()).pathname}`);
      };

      page.on("pageerror", onPageError);
      page.on("console", onConsole);
      page.on("response", onResp);

      try {
        const resp = await page.goto(route, { waitUntil: "domcontentloaded", timeout: 35_000 });
        if (!resp || resp.status() >= 400) {
          addBug("P0", "Site Crawler", route, `Page returned HTTP ${resp?.status() ?? "NO_RESPONSE"}`);
        }
        await page.waitForTimeout(600);

        const bodyText = await page.locator("body").innerText().catch(() => "");
        if (bodyText.trim().length < 20) {
          addBug("P0", "Site Crawler", route, "Page rendered almost empty body (< 20 chars)");
        }
        for (const bad of ["Application error", "Unhandled Runtime Error", "Invalid Date", "NaN"]) {
          if (bodyText.includes(bad)) {
            addBug("P1", "Site Crawler", route, `Visible bad text on page: "${bad}"`);
          }
        }

        const brokenImgs = await page.evaluate(() => {
          return Array.from(document.querySelectorAll("img"))
            .filter((img) => img.complete && img.naturalWidth === 0)
            .map((img) => img.getAttribute("src") || "(no-src)");
        });
        if (brokenImgs.length > 0) {
          addBug("P1", "Broken Images", route, `Broken <img> sources: ${brokenImgs.slice(0, 5).join(", ")}`);
        }

        for (const err of pageErrors) addBug("P0", "JS Runtime Error", route, err);
        for (const err of consoleErrors) addBug("P1", "Console Error", route, err);
        for (const br of badResponses) addBug("P1", "Failed Network Request", route, br);
      } catch (e: any) {
        addBug("P0", "Site Crawler", route, `Navigation/Timeout crash: ${e?.message}`);
      } finally {
        page.off("pageerror", onPageError);
        page.off("console", onConsole);
        page.off("response", onResp);
      }
    }
  });

  // =========================================================================
  // PART 2: REAL USER JOURNEY + RELOAD PERSISTENCE + ALL 4 EXPORTS ON ALL 8 TEMPLATES
  // =========================================================================
  test("Audit 2: All 8 templates (/templates -> Studio -> Reload persistence -> DOCX/ZIP/TXT/PDF exports)", async ({ page, request }) => {
    const createdDocIds: string[] = [];

    for (const [cardName, meta] of Object.entries(EXPECTED_PERSONAS)) {
      const target = `${cardName} (Series ${meta.seriesId})`;
      const routeErrors: string[] = [];
      const onPageErr = (e: Error) => routeErrors.push(`PAGEERROR: ${e.message}`);
      const onResp = (r: any) => {
        if (r.status() >= 400) routeErrors.push(`HTTP ${r.status()} ${new URL(r.url()).pathname}`);
      };
      page.on("pageerror", onPageErr);
      page.on("response", onResp);

      try {
        // 1. Open /templates and click exact template card
        await page.goto("/templates", { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(350);

        const card = page
          .locator("div.grid > div.group")
          .filter({ has: page.locator("span.font-semibold", { hasText: new RegExp(`^${cardName}$`) }) })
          .first();

        if ((await card.count()) === 0) {
          addBug("P0", "Templates Catalog", target, "Template card not found on /templates");
          continue;
        }

        await card.locator("[role='button']").first().click();
        await page.waitForTimeout(300);

        // Verify static Word & PDF links inside template modal return HTTP 200
        const staticLinks = await page.locator("[role='dialog'] a[download]").evaluateAll((els) =>
          els.map((a) => a.getAttribute("href") || "")
        );
        if (staticLinks.length === 0) {
          addBug("P1", "Static Template Files", target, "No static .docx/.pdf download links found in /templates modal");
        }
        for (const href of staticLinks) {
          const r = await request.head(href);
          if (!r.ok()) addBug("P1", "Static Template Files", target, `Static file ${href} returned HTTP ${r.status()}`);
        }

        // 2. Click "Edit ... Live in Studio"
        await page.getByRole("button", { name: /Live in Studio/i }).click();
        await page.waitForURL(/\/editor\/[^?]+/, { timeout: 15_000 });
        await page.waitForTimeout(1200);

        const editorUrl = page.url();
        const docId = editorUrl.split("/editor/")[1]?.split("?")[0] || "";
        if (docId && !docId.startsWith("doc-executive")) createdDocIds.push(docId);

        // 3. Check template identity actually matches expected persona (catches Series 22->2 & 24->4 bugs!)
        const canvasText = (await page.locator("body").innerText()).toUpperCase();
        const expectedFirst = meta.expectedName.split(" ")[0];
        if (!canvasText.includes(expectedFirst)) {
          addBug(
            "P0",
            "Template Identity Mismatch",
            target,
            `Opened editor did NOT load ${meta.expectedName}! Wrong template series was loaded.`
          );
        }

        // 4. Reload persistence check (verifies DB save survives hard browser reload)
        await page.waitForTimeout(1200);
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.getByRole("button", { name: /Download \/ Export/i }).waitFor({ state: "visible", timeout: 15_000 }).catch(() => {});
        await page.waitForTimeout(400);
        const afterReloadText = (await page.locator("body").innerText()).toUpperCase();
        if (!afterReloadText.includes(expectedFirst)) {
          addBug(
            "P0",
            "Reload Persistence",
            target,
            `After page.reload() on /editor/${docId}, template content for ${meta.expectedName} did not persist!`
          );
        }

        // Check DB record directly
        if (docId) {
          const dbRes = await request.get(`/api/documents/${encodeURIComponent(docId)}`);
          if (!dbRes.ok()) {
            addBug("P0", "DB Persistence", target, `Document ${docId} missing in SQLite after opening in Editor (HTTP ${dbRes.status()})`);
          } else {
            const dbJson = await dbRes.json();
            if (String(dbJson.document?.seriesId) !== meta.seriesId) {
              addBug(
                "P0",
                "DB Series Mismatch",
                target,
                `Saved in SQLite with seriesId="${dbJson.document?.seriesId}" instead of "${meta.seriesId}"`
              );
            }
          }
        }

        // 5. Open Download / Export modal & test ALL 4 REAL UI EXPORT BUTTONS
        await page.getByRole("button", { name: /Download \/ Export/i }).click();
        await page.waitForTimeout(300);

        // 5a. DOCX download
        const dlDocxP = page.waitForEvent("download", { timeout: 10_000 }).catch(() => null);
        await page.getByRole("button", { name: /Download True Word/i }).click();
        const dlDocx = await dlDocxP;
        if (!dlDocx) {
          addBug("P0", "DOCX Export UI", target, "Clicking 'Download True Word (.docx)' triggered NO file download");
        } else {
          const fname = dlDocx.suggestedFilename();
          if (!fname.toUpperCase().includes(expectedFirst)) {
            addBug("P0", "DOCX Export Identity", target, `Downloaded DOCX filename "${fname}" does not match ${meta.expectedName}`);
          }
          const tmpPath = await dlDocx.path();
          if (tmpPath) {
            const buf = fs.readFileSync(tmpPath);
            if (buf.length < 2000) {
              addBug("P0", "DOCX Export Integrity", target, `Downloaded DOCX too small (${buf.length} bytes)`);
            } else {
              try {
                const z = await JSZip.loadAsync(buf);
                if (!z.files["word/document.xml"]) {
                  addBug("P0", "DOCX Export Integrity", target, "Downloaded DOCX missing word/document.xml");
                }
              } catch {
                addBug("P0", "DOCX Export Integrity", target, "Downloaded DOCX is not a valid ZIP/OOXML file");
              }
            }
          }
        }

        // 5b. ZIP bundle download
        const dlZipP = page.waitForEvent("download", { timeout: 10_000 }).catch(() => null);
        await page.getByRole("button", { name: /Full Application Bundle/i }).click();
        const dlZip = await dlZipP;
        if (!dlZip) {
          addBug("P0", "ZIP Export UI", target, "Clicking 'Full Application Bundle (.zip)' triggered NO file download");
        } else {
          const tmpPath = await dlZip.path();
          if (tmpPath) {
            try {
              const z = await JSZip.loadAsync(fs.readFileSync(tmpPath));
              const count = Object.keys(z.files).length;
              if (count < 4) addBug("P1", "ZIP Export Integrity", target, `ZIP bundle only has ${count} files (expected 5)`);
            } catch {
              addBug("P0", "ZIP Export Integrity", target, "Downloaded ZIP bundle is corrupted");
            }
          }
        }

        // 5c. TXT download
        const dlTxtP = page.waitForEvent("download", { timeout: 10_000 }).catch(() => null);
        await page.getByRole("button", { name: /Download Plain Text/i }).click();
        const dlTxt = await dlTxtP;
        if (!dlTxt) {
          addBug("P0", "TXT Export UI", target, "Clicking 'Download Plain Text (.txt)' triggered NO file download");
        }

        // 5d. PDF Vector Print popup
        const popP = page.waitForEvent("popup", { timeout: 10_000 }).catch(() => null);
        await page.getByRole("button", { name: /Download Live Vector PDF/i }).click();
        const pop = await popP;
        if (!pop) {
          addBug("P0", "PDF Export UI", target, "Clicking 'Download Live Vector PDF' did NOT open print popup window");
        } else {
          const popErrs: string[] = [];
          pop.on("pageerror", (e) => popErrs.push(e.message));
          await pop.waitForURL(/\/print\//, { timeout: 15_000 }).catch(() => {});
          await pop.locator(".print-sheet").first().waitFor({ state: "visible", timeout: 15_000 }).catch(() => {});
          const sheets = await pop.locator(".print-sheet").count().catch(() => 0);
          if (sheets === 0) {
            addBug("P0", "PDF Print View", target, `Print popup ${pop.url()} rendered 0 .print-sheet elements`);
          }
          for (const pe of popErrs) addBug("P0", "PDF Print View", target, `Print popup JS error: ${pe}`);
          await pop.close();
        }

        for (const e of routeErrors) {
          addBug("P1", "Editor/Export Network", target, e);
        }
      } catch (err: any) {
        addBug("P0", "Template Journey Crash", target, err?.message || String(err));
      } finally {
        page.off("pageerror", onPageErr);
        page.off("response", onResp);
      }
    }

    // Cleanup temporary docs created during audit
    for (const id of createdDocIds) {
      await request.delete(`/api/documents/${encodeURIComponent(id)}`).catch(() => {});
    }
  });

  // =========================================================================
  // PART 3: BACKEND API CONTRACT & NEGATIVE STRESS AUDIT (ALL 21 API ROUTES)
  // =========================================================================
  test("Audit 3: All 21 backend API routes (Happy Path + Negative/Malformed inputs, zero 500s)", async ({ request }) => {
    const checkNo500 = async (label: string, res: any, allowedStatuses: number[]) => {
      const st = res.status();
      if (st >= 500) {
        const body = (await res.text().catch(() => "")).slice(0, 180);
        addBug("P0", "Backend 500 Crash", label, `Returned HTTP ${st}: ${body}`);
      } else if (!allowedStatuses.includes(st)) {
        const body = (await res.text().catch(() => "")).slice(0, 140);
        addBug("P1", "Backend Contract", label, `Unexpected HTTP ${st} (expected ${allowedStatuses.join("/")}): ${body}`);
      }
    };

    // 1. Documents CRUD + Duplicate + Versions + Restore + Share
    const auditId = `audit_api_${Date.now()}`;
    await checkNo500("GET /api/documents", await request.get("/api/documents"), [200]);

    const createR = await request.post("/api/documents", {
      data: {
        id: auditId,
        title: "Audit API Doc",
        seriesId: "22",
        content: { name: "Audit User", role: "Engineer", summary: "Built APIs.", skills: ["TypeScript"], experience: [], education: [] },
      },
    });
    await checkNo500("POST /api/documents (happy)", createR, [200, 201]);

    await checkNo500("GET /api/documents/[id] (happy)", await request.get(`/api/documents/${auditId}`), [200]);
    await checkNo500("GET /api/documents/nonexistent (negative)", await request.get("/api/documents/does-not-exist-99999"), [404]);

    await checkNo500("PATCH /api/documents/[id] (happy)", await request.patch(`/api/documents/${auditId}`, { data: { title: "Updated Audit" } }), [200]);
    await checkNo500("PATCH /api/documents/nonexistent (negative)", await request.patch("/api/documents/does-not-exist-99999", { data: { title: "X" } }), [404]);

    // Duplicate
    const dupR = await request.post(`/api/documents/${auditId}/duplicate`, { data: {} });
    await checkNo500("POST /api/documents/[id]/duplicate", dupR, [200, 201]);
    let dupId = "";
    if (dupR.ok()) {
      const dj = await dupR.json().catch(() => ({}));
      dupId = dj.document?.id || dj.id || "";
    }
    await checkNo500("POST /api/documents/nonexistent/duplicate (negative)", await request.post("/api/documents/does-not-exist-99999/duplicate", { data: {} }), [404]);

    // Versions + Restore
    const verR = await request.post(`/api/documents/${auditId}/versions`, { data: { label: "Audit Snap", trigger: "manual" } });
    await checkNo500("POST /api/documents/[id]/versions", verR, [200, 201]);
    await checkNo500("GET /api/documents/[id]/versions", await request.get(`/api/documents/${auditId}/versions`), [200]);
    if (verR.ok()) {
      const vj = await verR.json().catch(() => ({}));
      const verId = vj.version?.id || vj.id;
      if (verId) {
        await checkNo500("POST /api/documents/[id]/versions/[verId]/restore", await request.post(`/api/documents/${auditId}/versions/${verId}/restore`), [200]);
      }
    }
    await checkNo500("POST restore nonexistent version (negative)", await request.post(`/api/documents/${auditId}/versions/bad-ver-999/restore`), [404]);

    // Share + Public Token
    const shR = await request.post(`/api/documents/${auditId}/share`, { data: { active: true, showContact: false } });
    await checkNo500("POST /api/documents/[id]/share", shR, [200, 201]);
    await checkNo500("GET /api/documents/[id]/share", await request.get(`/api/documents/${auditId}/share`), [200]);
    if (shR.ok()) {
      const sj = await shR.json().catch(() => ({}));
      if (sj.share?.token) {
        await checkNo500("GET /api/share/[token] (happy)", await request.get(`/api/share/${sj.share.token}`), [200]);
      }
    }
    await checkNo500("GET /api/share/bad-token (negative)", await request.get("/api/share/invalid-token-99999"), [404]);

    // Cleanup docs
    await checkNo500("DELETE /api/documents/[id]", await request.delete(`/api/documents/${auditId}`), [200]);
    if (dupId) await request.delete(`/api/documents/${dupId}`).catch(() => {});
    await checkNo500("DELETE /api/documents/nonexistent (negative)", await request.delete("/api/documents/does-not-exist-99999"), [200, 404]);

    // 2. Master Profile (read-only safe check)
    await checkNo500("GET /api/master-profile", await request.get("/api/master-profile"), [200]);

    // 3. Export APIs (Negative & Edge Cases)
    await checkNo500("POST /api/export/docx (lowercase letter + string pageCount)", await request.post("/api/export/docx", {
      data: { seriesId: "22", kind: "resume", pageSize: "letter", pageCount: "2", content: { name: "Test" } },
    }), [200, 400]);
    await checkNo500("POST /api/export/docx (empty body negative)", await request.post("/api/export/docx", { data: {} }), [400]);
    await checkNo500("POST /api/export/bundle (empty body negative)", await request.post("/api/export/bundle", { data: {} }), [400]);
    await checkNo500("POST /api/export/txt (empty body negative)", await request.post("/api/export/txt", { data: {} }), [200, 400]);

    // 4. Import, Analyze & Auto-Fit
    await checkNo500("POST /api/import/parse (empty negative)", await request.post("/api/import/parse", { data: { text: "" } }), [400]);
    await checkNo500("POST /api/analyze (valid)", await request.post("/api/analyze", { data: { content: { name: "Test", role: "Dev", summary: "Hi", experience: [], education: [], skills: [] } } }), [200]);
    await checkNo500("POST /api/analyze (empty negative)", await request.post("/api/analyze", { data: {} }), [200, 400]);
    await checkNo500("POST /api/editor/auto-fit (valid)", await request.post("/api/editor/auto-fit", {
      data: { seriesId: "14", targetPages: 1, content: { name: "Test", experience: [], education: [], skills: [] } },
    }), [200]);

    // 5. All 7 AI Endpoints (Happy + Fallback, zero 500 crashes)
    await checkNo500("GET /api/ai/status", await request.get("/api/ai/status"), [200]);
    await checkNo500("POST /api/ai/bullet", await request.post("/api/ai/bullet", { data: { bullet: "Managed team", role: "Lead" } }), [200, 400]);
    await checkNo500("POST /api/ai/summary", await request.post("/api/ai/summary", { data: { content: { name: "Test", role: "Designer", skills: ["Figma"] } } }), [200, 400]);
    await checkNo500("POST /api/ai/tailor", await request.post("/api/ai/tailor", { data: { content: { name: "Test", role: "Designer", skills: ["Figma"] }, jobDescription: "Looking for Senior Figma Designer" } }), [200, 400]);
    await checkNo500("POST /api/ai/cover-letter", await request.post("/api/ai/cover-letter", { data: { content: { name: "Test", role: "Designer" }, companyName: "Acme", jobTitle: "Lead Designer" } }), [200, 400]);
    await checkNo500("POST /api/ai/translate", await request.post("/api/ai/translate", { data: { content: { name: "Test", summary: "Hello" }, targetLanguage: "German" } }), [200, 400]);
    await checkNo500("POST /api/ai/chat", await request.post("/api/ai/chat", { data: { message: "How can I improve my resume?", content: { name: "Test" } } }), [200, 400]);
  });

  // =========================================================================
  // CONSOLIDATED MASTER BUG REPORT
  // =========================================================================
  test.afterAll(() => {
    let staticData: any = { silentCatches: [], pageBacking: [] };
    if (fs.existsSync("audit-static.json")) {
      staticData = JSON.parse(fs.readFileSync("audit-static.json", "utf8"));
      for (const sc of staticData.silentCatches || []) {
        addBug("P2", "Silent Catch", `${sc.file}:${sc.line}`, "Empty catch block swallows errors silently");
      }
      for (const pb of staticData.pageBacking || []) {
        if (pb.persistence !== "REAL_API_OR_DB" && !/login|pricing|help|\/page\.tsx$/.test(pb.page)) {
          addBug("P2", "Persistence Gap", pb.page, `Page is ${pb.persistence} (not wired to SQLite/API)`);
        }
      }
    }

    const p0 = bugs.filter((b) => b.severity === "P0");
    const p1 = bugs.filter((b) => b.severity === "P1");
    const p2 = bugs.filter((b) => b.severity === "P2");

    const report = {
      generatedAt: new Date().toISOString(),
      counts: { P0: p0.length, P1: p1.length, P2: p2.length, total: bugs.length },
      P0: p0,
      P1: p1,
      P2: p2,
      pageBacking: staticData.pageBacking,
    };
    fs.writeFileSync("audit-report.json", JSON.stringify(report, null, 2), "utf8");

    console.log("\n======================================================================");
    console.log(`FARNAVI MASTER AUDIT REPORT | P0: ${p0.length} | P1: ${p1.length} | P2: ${p2.length}`);
    console.log("======================================================================");
    for (const [label, list] of [["P0 — CRITICAL (MUST FIX FIRST)", p0], ["P1 — HIGH (ERRORS / BROKEN ASSETS / CONTRACT)", p1], ["P2 — ARCHITECTURE (SILENT CATCHES / NON-DB PAGES)", p2]] as const) {
      console.log(`\n--- ${label} (${list.length}) ---`);
      if (list.length === 0) console.log("  (None)");
      for (const item of list) {
        console.log(`  [${item.area}] ${item.target} -> ${item.detail}`);
      }
    }
    console.log("\nFull JSON saved to: D:\\careerly\\audit-report.json\n");
  });
});