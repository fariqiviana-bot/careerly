import fs from "fs";
import { PrismaClient } from "@prisma/client";

function loadEnv() {
  if (!fs.existsSync(".env")) return;
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

export default async function globalTeardown() {
  loadEnv();
  const prisma = new PrismaClient();
  try {
    const testUsers = await prisma.user.findMany({
      where: { email: { endsWith: "@farnavi.test" } },
      select: { id: true },
    });
    const testUserIds = testUsers.map((u) => u.id);

    if (testUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
    }

    // Clean any stray test artifacts in demo workspace without touching real user resumes
    const demoEmail = process.env.FARNAVI_DEMO_EMAIL || "fariqiviana@gmail.com";
    for (const email of [demoEmail, "workspace@farnavi.local"]) {
      const u = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (!u) continue;
      await prisma.document.deleteMany({
        where: {
          userId: u.id,
          OR: [
            { id: { startsWith: "qa-" } },
            { id: { startsWith: "qa_" } },
            { id: { startsWith: "doc-mw" } },
            { id: { startsWith: "doc_cv_" } },
          ],
        },
      });
    }

    await prisma.$executeRawUnsafe("VACUUM");
    console.log(`[QA Teardown] Purged ${testUserIds.length} @farnavi.test users and vacuumed SQLite.`);
  } catch (err) {
    console.warn("[QA Teardown] Warning:", err);
  } finally {
    await prisma.$disconnect();
  }
}
