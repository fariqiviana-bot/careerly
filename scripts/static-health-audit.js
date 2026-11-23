const fs = require("fs");
const path = require("path");

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".next") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

const silentCatches = [];
const pageBacking = [];

for (const file of [...walk("app"), ...walk("components"), ...walk("lib")]) {
  const src = fs.readFileSync(file, "utf8");
  const lines = src.split(/\r?\n/);

  // Detect empty/silent catch blocks: catch { } or catch (e) { // comment }
  const catchRe = /catch\s*(?:\([^)]*\))?\s*\{\s*(?:\/\/[^\n]*\s*)?\}/g;
  let m;
  while ((m = catchRe.exec(src)) !== null) {
    const lineNo = src.slice(0, m.index).split(/\r?\n/).length;
    silentCatches.push({ file: file.replace(/\\/g, "/"), line: lineNo });
  }

  // Classify every Next.js page.tsx: connected to /api/ or Prisma vs client/local only
  if (file.endsWith("page.tsx")) {
    const rel = file.replace(/\\/g, "/");
    const callsApi = /\/api\/|lib\/api\/|prisma\./.test(src);
    const usesStore = /useStore\(/.test(src);
    pageBacking.push({
      page: rel,
      persistence: callsApi ? "REAL_API_OR_DB" : usesStore ? "CLIENT_STORE_ONLY" : "STATIC_OR_MOCK",
    });
  }
}

fs.writeFileSync(
  "audit-static.json",
  JSON.stringify({ silentCatches, pageBacking }, null, 2),
  "utf8"
);
console.log(`Static scan complete: ${silentCatches.length} silent catch blocks, ${pageBacking.length} pages classified.`);