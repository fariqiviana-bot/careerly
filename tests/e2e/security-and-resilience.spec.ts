import { test, expect, type Page, type BrowserContext } from "@playwright/test";
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

function buildMinimalEmptyPdfBuffer(): Buffer {
  // Valid PDF 1.4 with a blank 1-page canvas (zero text streams — simulates scanned/image-only PDF)
  const pdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj
4 0 obj << /Length 0 >> stream
endstream endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000202 00000 n 
trailer << /Size 5 /Root 1 0 R >>
startxref
251
%%EOF`;
  return Buffer.from(pdf, "ascii");
}

async function buildZipBombDocxBuffer(): Promise<Buffer> {
  // Tiny compressed .docx (< 50KB) whose word/document.xml inflates to ~16MB
  const chunk = "A".repeat(1024);
  const hugeParagraph = `<w:p><w:r><w:t>${chunk.repeat(16000)}</w:t></w:r></w:p>`;
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`
  );
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${hugeParagraph}</w:body></w:document>`
  );
  return await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });
}

async function buildMessyDocxBuffer(): Promise<Buffer> {
  // Resume with no email, Unicode, emojis, and messy spacing
  const lines = [
    "Soren Al-Mansoor — Bio-Data Lead 🚀",
    "Zurich, Switzerland | +41 44 555 0199",
    "SUMMARY   EXPERIENCE",
    "Built multi-omics pipelines   Senior Scientist @ Helvetia Genomics (2021-Present)",
    "• Processed 2M+ café & clinical samples with 99.8% QC accuracy",
    "EDUCATION: ETH Zürich — M.Sc. Computational Biology (2020)",
  ];
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const body = lines.map((l) => `<w:p><w:r><w:t>${esc(l)}</w:t></w:r></w:p>`).join("");
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`
  );
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`
  );
  return await zip.generateAsync({ type: "nodebuffer" });
}

test.describe("Backend Security, IDOR, Malformed Files, DOCX XML Integrity & Lifecycle Resilience", () => {
  test.setTimeout(120_000);

  test("1. IDOR & Cross-User Authorization: User B & Incognito cannot read, modify, hijack, delete, duplicate, print, or scrape User A private data", async ({
    browser,
  }) => {
    const ts = Date.now();
    const emailA = `sec_a_${ts}@farnavi.test`;
    const emailB = `sec_b_${ts}@farnavi.test`;
    const pass = "FarnaviPass123!";
    const secretPhone = "+1 (999) 555-7331";
    const secretNote = `TOP_SECRET_MARKER_${ts}`;
    const docIdA = `private-resume-${ts}`;

    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await registerViaUi(pageA, "Victim User A", emailA, pass);

    // User A creates a PRIVATE resume (type: "resume", NOT a public website)
    const createDocRes = await pageA.request.post("/api/documents", {
      data: {
        id: docIdA,
        title: "Private Executive CV",
        type: "resume",
        seriesId: "14",
        content: {
          name: "Victim User A",
          role: "Chief Security Officer",
          email: emailA,
          phone: secretPhone,
          summary: secretNote,
          experience: [
            { id: "e1", role: "CSO", company: "VaultCorp", period: "2023-Present", bullets: [secretNote] },
          ],
        },
      },
    });
    expect(createDocRes.ok()).toBeTruthy();

    // User A creates a version snapshot
    const verRes = await pageA.request.post(`/api/documents/${docIdA}/versions`, {
      data: {
        label: "Confidential V1",
        seriesId: "14",
        content: { name: "Victim User A", summary: secretNote },
      },
    });
    expect(verRes.ok()).toBeTruthy();
    const verJson = await verRes.json();
    const verIdA = verJson?.version?.id;
    expect(verIdA).toBeTruthy();

    // User A creates a tracker job & interview
    const trRes = await pageA.request.post("/api/tracker", {
      data: { title: "Director", company: "SecretCo", status: "applied", notes: secretNote },
    });
    expect(trRes.ok()).toBeTruthy();
    const trJson = await trRes.json();
    const trackerIdA = trJson?.job?.id || trJson?.item?.id || trJson?.id;

    const intRes = await pageA.request.post("/api/interviews", {
      data: { title: "Director", company: "SecretCo", seniority: "Senior", mode: "Basic" },
    });
    expect(intRes.ok()).toBeTruthy();
    const intJson = await intRes.json();
    const interviewIdA = intJson?.interview?.id || intJson?.item?.id || intJson?.id;

    // --- ATTACKER: User B in completely separate context ---
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await registerViaUi(pageB, "Attacker User B", emailB, pass);

    // 1a. Direct GET / PATCH / DELETE / Duplicate / Upsert Hijack on User A's document
    const bGet = await pageB.request.get(`/api/documents/${docIdA}`);
    expect([401, 403, 404], `IDOR: User B GET /api/documents/[id] returned ${bGet.status()}`).toContain(bGet.status());

    const bPatch = await pageB.request.patch(`/api/documents/${docIdA}`, {
      data: { title: "HIJACKED BY B", content: { name: "HACKED" } },
    });
    expect([401, 403, 404], `IDOR: User B PATCH /api/documents/[id] returned ${bPatch.status()}`).toContain(
      bPatch.status()
    );

    const bUpsert = await pageB.request.post("/api/documents", {
      data: { id: docIdA, title: "UPSERT HIJACK", seriesId: "14", content: { name: "HACKED" } },
    });
    expect([401, 403, 404], `IDOR: User B POST /api/documents upsert hijack returned ${bUpsert.status()}`).toContain(
      bUpsert.status()
    );

    const bDel = await pageB.request.delete(`/api/documents/${docIdA}`);
    expect([401, 403, 404], `IDOR: User B DELETE /api/documents/[id] returned ${bDel.status()}`).toContain(
      bDel.status()
    );

    const bDup = await pageB.request.post(`/api/documents/${docIdA}/duplicate`);
    expect([401, 403, 404], `IDOR: User B duplicate returned ${bDup.status()}`).toContain(bDup.status());

    // 1b. Versions & Share endpoints IDOR
    const bVerGet = await pageB.request.get(`/api/documents/${docIdA}/versions`);
    if (bVerGet.ok()) {
      const bVerBody = await bVerGet.text();
      expect(bVerBody, "IDOR: User B read User A versions!").not.toContain(secretNote);
      expect(bVerBody, "IDOR: User B saw User A version ID!").not.toContain(verIdA);
    }

    const bVerPost = await pageB.request.post(`/api/documents/${docIdA}/versions`, {
      data: { label: "Injected", seriesId: "14", content: {} },
    });
    expect([401, 403, 404], `IDOR: User B POST versions returned ${bVerPost.status()}`).toContain(bVerPost.status());

    const bVerRestore = await pageB.request.post(`/api/documents/${docIdA}/versions/${verIdA}/restore`);
    expect([401, 403, 404], `IDOR: User B restore version returned ${bVerRestore.status()}`).toContain(
      bVerRestore.status()
    );

    const bSharePost = await pageB.request.post(`/api/documents/${docIdA}/share`, {
      data: { active: true, showContact: true },
    });
    expect([401, 403, 404], `IDOR: User B created share link for User A doc (${bSharePost.status()})`).toContain(
      bSharePost.status()
    );

    // 1c. Public /api/cv/[slug] MUST NOT leak private non-website resumes by document ID!
    const publicCvById = await pageB.request.get(`/api/cv/${docIdA}`);
    expect(
      publicCvById.status(),
      `CRITICAL LEAK: /api/cv/${docIdA} exposed a PRIVATE resume (type="resume") publicly!`
    ).toBe(404);
    const publicShareById = await pageB.request.get(`/api/share/${docIdA}`);
    expect(
      publicShareById.status(),
      `CRITICAL LEAK: /api/share/${docIdA} exposed a PRIVATE resume via direct docId fallback!`
    ).toBe(404);

    // 1d. Tracker & Interview IDOR
    if (trackerIdA) {
      const bTrPatch = await pageB.request.patch(`/api/tracker/${trackerIdA}`, { data: { status: "rejected" } });
      expect([401, 403, 404], `IDOR: User B patched User A tracker (${bTrPatch.status()})`).toContain(bTrPatch.status());
      const bTrDel = await pageB.request.delete(`/api/tracker/${trackerIdA}`);
      expect([401, 403, 404], `IDOR: User B deleted User A tracker (${bTrDel.status()})`).toContain(bTrDel.status());
    }
    if (interviewIdA) {
      const bIntPatch = await pageB.request.patch(`/api/interviews/${interviewIdA}`, { data: { title: "Hacked Interview" } });
      expect([401, 403, 404], `IDOR: User B patched User A interview (${bIntPatch.status()})`).toContain(
        bIntPatch.status()
      );
      const bIntDel = await pageB.request.delete(`/api/interviews/${interviewIdA}`);
      expect([401, 403, 404], `IDOR: User B deleted User A interview (${bIntDel.status()})`).toContain(
        bIntDel.status()
      );
    }

    // 1e. /print/[id] accessed by User B and unauthenticated Incognito must NOT render User A's private resume
    await pageB.goto(`/print/${docIdA}?autoprint=0`, { waitUntil: "networkidle" });
    await pageB.waitForTimeout(400);
    const printBodyB = await pageB.locator("body").innerText();
    expect(printBodyB, "IDOR: User B saw User A's secret on /print/[id]!").not.toContain(secretNote);
    expect(printBodyB, "IDOR: User B saw User A's phone on /print/[id]!").not.toContain(secretPhone);

    const ctxAnon = await browser.newContext();
    const pageAnon = await ctxAnon.newPage();
    await pageAnon.goto(`/print/${docIdA}?autoprint=0`, { waitUntil: "networkidle" });
    await pageAnon.waitForTimeout(400);
    const printBodyAnon = await pageAnon.locator("body").innerText();
    expect(printBodyAnon, "IDOR: Anonymous visitor saw User A's secret on /print/[id]!").not.toContain(secretNote);

    // 1f. Verify User A's document is completely intact and still owned by User A!
    const aVerify = await pageA.request.get(`/api/documents/${docIdA}`);
    expect(aVerify.ok(), "User A lost access to own document after User B's attack!").toBeTruthy();
    const aDoc = (await aVerify.json())?.document;
    expect(aDoc?.title).toBe("Private Executive CV");
    expect(aDoc?.content?.summary).toBe(secretNote);

    await Promise.all([ctxA.close(), ctxB.close(), ctxAnon.close()]);
  });

  test("2. Privacy Redaction Server-Side Check & Stored XSS Defense (/api/share, /cv/[slug], /print/[id])", async ({
    browser,
  }) => {
    const ts = Date.now();
    const email = `xss_${ts}@farnavi.test`;
    const secretPhone = "+1 (888) 555-4242";
    const xssName = `Alex <img src=x onerror="window.__xss=1"> Mercer`;
    const xssJsUrl = `javascript:window.__xss=1`;
    const docId = `xss-share-${ts}`;
    const slug = `xss-site-${ts}`;

    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await registerViaUi(page, "XSS Tester", email, "FarnaviPass123!");

    const createRes = await page.request.post("/api/documents", {
      data: {
        id: docId,
        title: "XSS & Privacy Test",
        type: "website",
        slug,
        seriesId: "14",
        content: {
          name: xssName,
          role: `Engineer <script>window.__xss=1</script>`,
          email,
          phone: secretPhone,
          website: xssJsUrl,
          linkedin: xssJsUrl,
          summary: `Safe text <svg onload="window.__xss=1"> end`,
          experience: [
            {
              id: "x1",
              role: "Lead",
              company: "SafeLabs",
              period: "2024 - Present",
              bullets: [`Delivered <img src=x onerror="window.__xss=1"> pipeline`],
            },
          ],
        },
      },
    });
    expect(createRes.ok()).toBeTruthy();

    // Create share link and enable all privacy redaction flags dynamically
    const initShareRes = await page.request.post(`/api/documents/${docId}/share`, {
      data: { active: true, showContact: false },
    });
    expect(initShareRes.ok(), `Share creation failed: ${initShareRes.status()}`).toBeTruthy();
    const shareJson = await initShareRes.json();
    const shareObj = shareJson?.share || shareJson?.shareLink || shareJson;
    const token = shareObj?.token;
    expect(token, `No token returned from /api/documents/${docId}/share`).toBeTruthy();

    // Check raw JSON response from public /api/share/[token] — phone & email must be redacted SERVER-SIDE
    const ctxAnon = await browser.newContext();
    const pageAnon = await ctxAnon.newPage();
    const pubShareRes = await pageAnon.request.get(`/api/share/${encodeURIComponent(token)}`);
    expect(pubShareRes.ok()).toBeTruthy();
    const rawShareBody = await pubShareRes.text();
    expect(rawShareBody, "PRIVACY LEAK: Raw phone leaked in /api/share/[token] JSON!").not.toContain(secretPhone);
    expect(rawShareBody, "PRIVACY LEAK: Raw email leaked in /api/share/[token] JSON!").not.toContain(email);

    // Check XSS execution on /editor/[id], /print/[id], and /cv/[slug]
    for (const [label, p, url] of [
      ["Editor", page, `/editor/${docId}`],
      ["Print", page, `/print/${docId}?autoprint=0`],
      ["Public /cv/[slug]", pageAnon, `/cv/${slug}`],
    ] as const) {
      await p.goto(url, { waitUntil: "networkidle" });
      await p.waitForTimeout(400);
      const xssFired = await p.evaluate(() => Boolean((window as any).__xss));
      expect(xssFired, `CRITICAL XSS executed on ${label} (${url})!`).toBe(false);

      const dangerousLinks = await p.locator('a[href^="javascript:" i]').count();
      expect(dangerousLinks, `XSS: Active javascript: href rendered on ${label} (${url})!`).toBe(0);
    }

    await Promise.all([ctx.close(), ctxAnon.close()]);
  });

  test("3. Auth Hardening: Case-insensitive duplicate email blocked, forged cookie rejected, Logout revokes session server-side", async ({
    browser,
  }) => {
    const ts = Date.now();
    const lowerEmail = `auth_hard_${ts}@farnavi.test`;
    const upperEmail = `AUTH_HARD_${ts}@FARNAVI.TEST`;
    const pass = "FarnaviPass123!";

    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await registerViaUi(page, "Auth User", lowerEmail, pass);

    // Create a private doc so we can verify cookie replay cannot read it
    const docId = `auth-doc-${ts}`;
    const cRes = await page.request.post("/api/documents", {
      data: { id: docId, title: "Auth Protected", seriesId: "14", content: { name: "Auth User" } },
    });
    expect(cRes.ok()).toBeTruthy();

    // Capture live session cookie BEFORE logout
    const cookiesBefore = await ctx.cookies();
    const cookieHeader = cookiesBefore.map((c) => `${c.name}=${c.value}`).join("; ");
    expect(cookieHeader.length).toBeGreaterThan(5);

    // 3a. Case-insensitive duplicate registration must return 409
    const dupReg = await page.request.post("/api/auth/register", {
      data: { name: "Dup User", email: upperEmail, password: pass },
    });
    expect(dupReg.status(), `Case-insensitive duplicate email allowed (${dupReg.status()})!`).toBe(409);

    // 3b. Logout must revoke the session token in DB
    const logoutRes = await page.request.post("/api/auth/logout");
    expect(logoutRes.ok()).toBeTruthy();

    // Replay the captured pre-logout cookie from a fresh context
    const ctxReplay = await browser.newContext();
    const replayMe = await ctxReplay.request.get("/api/auth/me", {
      headers: { Cookie: cookieHeader },
    });
    const replayMeJson = await replayMe.json().catch(() => ({}));
    expect(
      replayMeJson?.user || null,
      "SESSION FIXATION: Old session cookie still authenticated after /api/auth/logout!"
    ).toBeNull();

    const replayDoc = await ctxReplay.request.get(`/api/documents/${docId}`, {
      headers: { Cookie: cookieHeader },
    });
    expect(
      [401, 403, 404],
      `REVOKED COOKIE LEAK: Replayed cookie read private doc (${replayDoc.status()})!`
    ).toContain(replayDoc.status());

    // 3c. Forged random session cookie must not authenticate
    const forgedMe = await ctxReplay.request.get("/api/auth/me", {
      headers: { Cookie: "farnavi_session=forged_invalid_token_12345; session=forged" },
    });
    const forgedJson = await forgedMe.json().catch(() => ({}));
    expect(forgedJson?.user || null, "Forged cookie returned a user!").toBeNull();

    await Promise.all([ctx.close(), ctxReplay.close()]);
  });

  test("4. Malicious & Malformed File Uploads (/api/import/parse): Fake PDF/DOCX, blank scanned PDF, Zip Bomb, >10MB file, messy Unicode DOCX", async ({
    browser,
  }) => {
    const ts = Date.now();
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await registerViaUi(page, "Upload Guard", `upload_${ts}@farnavi.test`, "FarnaviPass123!");

    const postFile = async (name: string, mimeType: string, buffer: Buffer) => {
      const t0 = Date.now();
      const res = await page.request.post("/api/import/parse", {
        multipart: { file: { name, mimeType, buffer } },
      });
      return { status: res.status(), body: await res.text(), ms: Date.now() - t0 };
    };

    // 4a. Fake PDF (PNG magic bytes renamed to .pdf) -> graceful 4xx, never 500
    const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    const fakePdf = await postFile("fake-photo.pdf", "application/pdf", pngBytes);
    console.log(`[Upload Fake PDF] status=${fakePdf.status} (${fakePdf.ms}ms)`);
    expect(fakePdf.status, `Fake PDF caused server 500: ${fakePdf.body}`).toBeLessThan(500);
    expect(fakePdf.status, "Fake PDF should be rejected with 4xx").toBeGreaterThanOrEqual(400);

    // 4b. Corrupt DOCX (random bytes renamed to .docx) -> graceful 4xx, never 500
    const fakeDocx = await postFile(
      "corrupt.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      Buffer.from("NOT_A_ZIP_FILE_AT_ALL_1234567890")
    );
    console.log(`[Upload Corrupt DOCX] status=${fakeDocx.status} (${fakeDocx.ms}ms)`);
    expect(fakeDocx.status, `Corrupt DOCX caused server 500: ${fakeDocx.body}`).toBeLessThan(500);
    expect(fakeDocx.status, "Corrupt DOCX should be rejected with 4xx").toBeGreaterThanOrEqual(400);

    // 4c. Scanned / Image-only PDF (valid PDF structure, 0 selectable text) -> never 500, must reject with clear error
    const blankPdf = await postFile("scanned-only.pdf", "application/pdf", buildMinimalEmptyPdfBuffer());
    console.log(`[Upload Scanned PDF] status=${blankPdf.status} (${blankPdf.ms}ms)`);
    expect(blankPdf.status, `Scanned PDF caused server 500: ${blankPdf.body}`).toBeLessThan(500);
    expect(blankPdf.status, "Image-only PDF with zero text should return 4xx warning/error").toBeGreaterThanOrEqual(400);

    // 4d. Zip Bomb DOCX (tiny compressed file inflating to ~16MB XML) -> must NOT OOM/500 and must finish quickly
    const bombBuf = await buildZipBombDocxBuffer();
    const bombRes = await postFile(
      "zip-bomb.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      bombBuf
    );
    console.log(`[Upload Zip Bomb DOCX] compressed=${bombBuf.length}B | status=${bombRes.status} (${bombRes.ms}ms)`);
    expect(bombRes.status, `Zip bomb DOCX crashed server (500): ${bombRes.body}`).toBeLessThan(500);
    expect(bombRes.status, "Zip bomb DOCX (>10MB inflated XML) should be rejected with 4xx").toBeGreaterThanOrEqual(400);
    expect(bombRes.ms, "Zip bomb took too long to reject").toBeLessThan(8_000);

    // 4e. Oversized >10MB file -> must return 400 or 413, never 500
    const hugeBuf = Buffer.alloc(10 * 1024 * 1024 + 2048, 0x41);
    const hugeRes = await postFile("huge.txt", "text/plain", hugeBuf);
    console.log(`[Upload >10MB] status=${hugeRes.status} (${hugeRes.ms}ms)`);
    expect([400, 413], `Oversized file expected 400/413, got ${hugeRes.status}`).toContain(hugeRes.status);

    // 4f. Messy 2-column / no-email / Unicode DOCX -> must succeed (200) cleanly without crashing
    const messyRes = await postFile(
      "messy-unicode.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      await buildMessyDocxBuffer()
    );
    console.log(`[Upload Messy Unicode DOCX] status=${messyRes.status} (${messyRes.ms}ms)`);
    expect(messyRes.status, `Messy Unicode DOCX failed: ${messyRes.body}`).toBe(200);

    await ctx.close();
  });

  test("5. DOCX XML Integrity (Control Chars, XML Tags, Emojis) & Empty-Resume Export Safety", async ({ browser }) => {
    const ts = Date.now();
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await registerViaUi(page, "DOCX XML Tester", `xml_${ts}@farnavi.test`, "FarnaviPass123!");

    // 5a. Hostile XML characters + illegal XML 1.0 control chars + emojis
    const hostileName = `Viana \x00\x0B\x1F <w:t>O'Fariqi</w:t> ]]> & "Co" 🚀`;
    const hostileBullet = `Cut latency 40% & improved <tag> "R&D" 'core' ]]> \x00\x08\x0C\x1F café — 100%`;

    for (const [seriesId, mode] of [["14", "visual"], ["24", "visual"], ["14", "ats"]] as const) {
      const docxRes = await page.request.post("/api/export/docx", {
        data: {
          seriesId,
          kind: "resume",
          mode,
          pageSize: "A4",
          pageCount: 1,
          content: {
            fullName: hostileName,
            name: hostileName,
            profession: `VP of R&D <script> & "Ops"`,
            role: `VP of R&D <script> & "Ops"`,
            email: `xml_${ts}@farnavi.test`,
            phone: "+1 555 0100",
            location: "Tehran / Zurich",
            summary: hostileBullet,
            professionalSkills: ["C++ & Rust", "<XML> Parsing", "100% QA 🚀"],
            skills: ["C++ & Rust", "<XML> Parsing", "100% QA 🚀"],
            experience: [
              {
                id: "xml-e1",
                role: `Lead <w:p> Engineer & Architect`,
                company: `Bio & Tech "Labs" ]]>`,
                period: "2023 - Present",
                bullets: [hostileBullet],
              },
            ],
            education: [{ id: "xml-ed1", degree: `M.S. Bio & CS`, school: `Uni <A> & "B"`, period: "2020" }],
          },
        },
      });
      expect(docxRes.status(), `[Series ${seriesId}] Hostile DOCX export failed (${docxRes.status()})`).toBe(200);
      const docxBuf = Buffer.from(await docxRes.body());
      const zip = await JSZip.loadAsync(docxBuf);
      const docXmlFile = zip.file("word/document.xml");
      expect(docXmlFile, `[Series ${seriesId}] Missing word/document.xml`).toBeTruthy();
      const docXml = await docXmlFile!.async("string");

      // Zero illegal XML 1.0 control characters (Microsoft Word refuses to open files containing these!)
      expect(
        /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(docXml),
        `[Series ${seriesId}] CORRUPT DOCX: Illegal XML control char found in word/document.xml!`
      ).toBe(false);

      // Strict browser XML parser check (exact standard XML 1.0 well-formedness)
      const xmlParseError = await page.evaluate((xml) => {
        const parsed = new DOMParser().parseFromString(xml, "application/xml");
        const err = parsed.querySelector("parsererror");
        return err ? (err.textContent || "XML parse error").slice(0, 300) : null;
      }, docXml);
      expect(xmlParseError, `[Series ${seriesId}] CORRUPT DOCX XML: ${xmlParseError}`).toBeNull();
    }

    // 5b. Minimal / Nearly-Empty Resume across DOCX, ZIP Bundle, TXT, and Print PDF (zero 500s)
    const emptyDocId = `empty-doc-${ts}`;
    const emptyContent = {
      name: "Solo Minimalist",
      fullName: "Solo Minimalist",
      role: "",
      email: "",
      phone: "",
      summary: "",
      skills: [],
      experience: [],
      education: [],
      certifications: [],
    };
    const createEmpty = await page.request.post("/api/documents", {
      data: { id: emptyDocId, title: "Empty CV", seriesId: "14", content: emptyContent },
    });
    expect(createEmpty.ok()).toBeTruthy();

    const emptyDocx = await page.request.post("/api/export/docx", {
      data: { seriesId: "14", kind: "resume", mode: "visual", pageSize: "A4", pageCount: 1, content: emptyContent },
    });
    expect(emptyDocx.status(), "Empty resume DOCX returned non-200").toBe(200);

    const emptyBundle = await page.request.post("/api/export/bundle", {
      data: { seriesId: "14", pageSize: "A4", pageCount: 1, content: emptyContent },
    });
    expect(emptyBundle.status(), "Empty resume ZIP bundle returned non-200").toBe(200);

    const emptyTxt = await page.request.post("/api/export/txt", {
      data: { content: emptyContent },
    });
    expect(emptyTxt.status(), "Empty resume TXT returned non-200").toBe(200);

    const printErrors: string[] = [];
    page.on("pageerror", (e) => printErrors.push(e.message));
    await page.addInitScript(() => {
      window.print = () => {};
    });
    await page.goto(`/print/${emptyDocId}?autoprint=0`, { waitUntil: "networkidle" });
    const emptyPdf = await page.pdf({ format: "A4", printBackground: true });
    expect(emptyPdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(printErrors, `Empty resume /print crashed: ${printErrors.join(" | ")}`).toEqual([]);

    await ctx.close();
  });

  test("6. Data Lifecycle: Version Restore vs Autosave, Cascade Delete (/cv & /share -> 404), Rapid Duplicate & Offline/Online Recovery", async ({
    browser,
  }) => {
    const ts = Date.now();
    const email = `life_${ts}@farnavi.test`;
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const runtimeErrors: string[] = [];
    page.on("pageerror", (e) => runtimeErrors.push(e.message));
    await registerViaUi(page, "Lifecycle User", email, "FarnaviPass123!");

    const docId = `life-doc-${ts}`;
    const slug = `life-slug-${ts}`;
    const roleV1 = `V1 Original Role ${ts}`;
    const roleV2 = `V2 Modified Role ${ts}`;

    const cRes = await page.request.post("/api/documents", {
      data: {
        id: docId,
        title: "Lifecycle CV",
        type: "website",
        slug,
        seriesId: "14",
        content: {
          name: "Lifecycle User",
          role: roleV1,
          email,
          summary: "Initial version summary",
          experience: [],
        },
      },
    });
    expect(cRes.ok()).toBeTruthy();

    // Create explicit Version 1 snapshot
    const v1Res = await page.request.post(`/api/documents/${docId}/versions`, {
      data: {
        label: "Milestone V1",
        seriesId: "14",
        content: { name: "Lifecycle User", role: roleV1, email, summary: "Initial version summary", experience: [] },
      },
    });
    expect(v1Res.ok()).toBeTruthy();
    const v1Id = (await v1Res.json())?.version?.id;
    expect(v1Id).toBeTruthy();

    // Open in editor, modify role to V2, wait for autosave
    await page.goto(`/editor/${docId}`, { waitUntil: "networkidle" });
    const roleInput = page.getByPlaceholder("e.g. Senior Product Designer, Registered Nurse").first();
    await expect(roleInput).toBeVisible({ timeout: 10_000 });
    await roleInput.fill(roleV2);
    await page.waitForTimeout(1800);

    // Trigger Version Restore via UI History panel if available, else via API
    const historyBtn = page.getByRole("button", { name: /History|Versions/i }).first();
    if (await historyBtn.isVisible().catch(() => false)) {
      await historyBtn.click();
      await page.waitForTimeout(500);
      const milestoneRow = page.locator("div").filter({ hasText: /Milestone V1/i }).filter({ has: page.getByRole("button", { name: /Restore/i }) }).last();
      const restoreBtn = milestoneRow.getByRole("button", { name: /Restore/i }).first();
      if (await restoreBtn.isVisible().catch(() => false)) {
        await restoreBtn.click();
      } else {
        const rApi = await page.request.post(`/api/documents/${docId}/versions/${v1Id}/restore`);
        expect(rApi.ok()).toBeTruthy();
        await page.reload({ waitUntil: "networkidle" });
      }
    } else {
      const rApi = await page.request.post(`/api/documents/${docId}/versions/${v1Id}/restore`);
      expect(rApi.ok()).toBeTruthy();
      await page.reload({ waitUntil: "networkidle" });
    }

    // Wait 3 full seconds so any stale Autosave timer would fire if buggy!
    await page.waitForTimeout(3000);

    const afterRestoreDb = await (await page.request.get(`/api/documents/${docId}`)).json();
    expect(
      afterRestoreDb?.document?.content?.role,
      "AUTOSAVE RACE BUG: Restored version was overwritten by stale autosave!"
    ).toBe(roleV1);

    // 6b. Rapid parallel duplicate (3 concurrent clicks) -> zero 500s, 3 distinct IDs
    const dupResults = await Promise.all([
      page.request.post(`/api/documents/${docId}/duplicate`),
      page.request.post(`/api/documents/${docId}/duplicate`),
      page.request.post(`/api/documents/${docId}/duplicate`),
    ]);
    const dupIds = new Set<string>();
    for (const r of dupResults) {
      expect(r.status(), `Concurrent duplicate returned ${r.status()}`).toBeLessThan(500);
      if (r.ok()) {
        const j = await r.json();
        const newId = j?.document?.id;
        if (newId) dupIds.add(newId);
      }
    }
    expect(dupIds.size, "Concurrent duplicate did not produce distinct documents").toBe(3);

    // 6c. Offline -> Edit -> Online recovery (must not crash & must sync once network returns)
    const offlineRole = `Recovered Online Role ${ts}`;
    await page.goto(`/editor/${docId}`, { waitUntil: "networkidle" });
    await ctx.setOffline(true);
    await page.getByPlaceholder("e.g. Senior Product Designer, Registered Nurse").first().fill(offlineRole);
    await page.waitForTimeout(1600);
    expect(runtimeErrors, `Editor crashed while offline: ${runtimeErrors.join(" | ")}`).toEqual([]);

    await ctx.setOffline(false);
    await page.waitForTimeout(3000);
    const afterOnlineDb = await (await page.request.get(`/api/documents/${docId}`)).json();
    expect(
      afterOnlineDb?.document?.content?.role,
      "NETWORK RESILIENCE GAP: Edit made while offline was NOT retried/saved after reconnecting!"
    ).toBe(offlineRole);

    // 6d. Cascade Delete: Create share link, verify /cv/[slug] & /share/[token] are 200, delete doc, verify BOTH are 404
    const shRes = await page.request.post(`/api/documents/${docId}/share`, { data: { active: true, showContact: true } });
    expect(shRes.ok()).toBeTruthy();
    const shJson = await shRes.json();
    const shareToken = (shJson?.share || shJson?.shareLink || shJson)?.token;
    expect(shareToken).toBeTruthy();

    expect((await page.request.get(`/api/cv/${slug}`)).status()).toBe(200);
    expect((await page.request.get(`/api/share/${shareToken}`)).status()).toBe(200);

    const delRes = await page.request.delete(`/api/documents/${docId}`);
    expect(delRes.ok()).toBeTruthy();

    expect((await page.request.get(`/api/documents/${docId}`)).status(), "Deleted doc still readable!").toBe(404);
    expect((await page.request.get(`/api/cv/${slug}`)).status(), "ORPHAN LEAK: /api/cv/[slug] still live after delete!").toBe(
      404
    );
    expect(
      (await page.request.get(`/api/share/${shareToken}`)).status(),
      "ORPHAN LEAK: /api/share/[token] still live after delete!"
    ).toBe(404);

    await ctx.close();
  });
});
