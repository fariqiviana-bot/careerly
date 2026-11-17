import fs from "node:fs";
import path from "node:path";
const ROOT = process.cwd();
const F = path.join(ROOT, "lib", "store.tsx");
const log = [];
if (!fs.existsSync(F)) { console.log("store.tsx MISSING"); process.exit(0); }
const orig = fs.readFileSync(F, "utf8");
const crlf = orig.indexOf("\r\n") >= 0;
let t = orig.replace(/\r\n/g, "\n");
log.push("EOL detected: " + (crlf ? "CRLF" : "LF"));

const BLOCK = `const VALID_TEMPLATE_IDS: Set<string> = new Set(TEMPLATES.map((t) => t.id));
/** Confirmed map: legacy ids -> real series (2,3,4,11,12,14,22,24). */
function normalizeTemplateId(tplId?: string): string {
  if (tplId && VALID_TEMPLATE_IDS.has(tplId)) return tplId;
  const r = resolveTemplate(tplId);
  return r ? r.series : "11";
}
/** Single normalizer used by seeds, hydration and addDoc. */
function normalizeDoc(d: Doc): Doc {
  const r = resolveTemplate(d.series ?? d.template);
  const series = r ? r.series : "11";
  const tpl = TEMPLATES.find((x) => x.id === series) ?? TEMPLATES[0];
  return {
    ...d,
    template: series,
    series,
    variant: r ? r.variant : (/ats/i.test(d.template || "") ? "ats" : "design"),
    accent: (r && r.design && r.design.accent) || tpl.accent || d.accent,
    font: (r && r.design && r.design.heading) || tpl.headingFont || d.font,
    secondaryFont: (r && r.design && r.design.body) || tpl.bodyFont || d.secondaryFont,
    settings: { ...defaultSettings(tpl.twoCol), ...(d.settings || {}) },
    visibility: d.visibility ?? {},
    ...(d.type === "website"
      ? { webTemplate: d.webTemplate ?? "editorial", slug: d.slug ?? "viana-fariqi", published: d.published ?? true }
      : {}),
  };
}`;

// A - Doc type fields
if (t.indexOf("series?: string;") >= 0) log.push("A doc fields: already applied");
else {
  const a = "\n  template: string;\n  accent: string;";
  const b = "\n  template: string;\n  series?: string;\n  variant?: \"design\" | \"ats\";\n  visibility?: Record<string, boolean>;\n  accent: string;";
  if (t.indexOf(a) >= 0) { t = t.replace(a, b); log.push("A doc fields: APPLIED"); }
  else log.push("A doc fields: ANCHOR NOT FOUND");
}

// B - normalizeTemplateId + normalizeDoc
if (t.indexOf("function normalizeDoc(") >= 0) log.push("B normalizeDoc: already applied");
else {
  const re = /const VALID_TEMPLATE_IDS = new Set\(TEMPLATES\.map\(\(t\) => t\.id\)\);\s*function normalizeTemplateId\(tplId\?: string\): string \{[\s\S]*?\n\}/;
  if (re.test(t)) { t = t.replace(re, BLOCK); log.push("B normalizeDoc: APPLIED"); }
  else log.push("B normalizeDoc: ANCHOR NOT FOUND");
}

// C - hydration mapper
if (t.indexOf("s.docs.map((d: Doc) => normalizeDoc(d))") >= 0) log.push("C hydration: already applied");
else {
  const re = /const migrated = s\.docs\.map\([\s\S]*?\);\s*setDocs\(migrated\);/;
  if (re.test(t)) {
    t = t.replace(re, "const migrated = s.docs.map((d: Doc) => normalizeDoc(d));\n          setDocs(migrated);");
    log.push("C hydration: APPLIED");
  } else log.push("C hydration: ANCHOR NOT FOUND");
}

const clean = orig.replace(/\r\n/g, "\n");
if (t !== clean) {
  fs.writeFileSync(F, crlf ? t.replace(/\n/g, "\r\n") : t, "utf8");
  log.push("store.tsx WRITTEN (EOL preserved)");
} else log.push("store.tsx unchanged");

const checks = {
  "import EDITOR_TEMPLATES": "EDITOR_TEMPLATES as TEMPLATES",
  "Doc.series field": "series?: string;",
  "normalizeDoc exists": "function normalizeDoc(",
  "seeds normalized": "seedDocs.map(normalizeDoc)",
  "hydration normalized": "s.docs.map((d: Doc) => normalizeDoc(d))",
  "storage key v3": "farnavi_store_v3",
  "Set<string> fix": "VALID_TEMPLATE_IDS: Set<string>"
};
log.push("--- end state ---");
for (const k of Object.keys(checks)) log.push((t.indexOf(checks[k]) >= 0 ? "OK   " : "MISS ") + k);

fs.writeFileSync(path.join(ROOT, "_farnavi", "PATCH-04.md"),
  "# CHUNK 04 PATCH REPORT\n\n" + log.map(x => "- " + x).join("\n") + "\n", "utf8");
console.log(log.join("\n"));