import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const IDS = ["2","3","4","11","12","14","22","24"];
const read = (p) => { try { return fs.readFileSync(p, "utf8"); } catch { return null; } };
const exists = (p) => { try { fs.accessSync(p); return true; } catch { return false; } };
const j = (p) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; } };
const writeJson = (p, o) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(o, null, 2), "utf8"); };

/* ---------- helpers ---------- */
const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1);
const top = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]);
function lum(hex) {
  const n = parseInt(hex, 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function sat(hex) {
  const n = parseInt(hex, 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  return mx === 0 ? 0 : (mx - mn) / mx;
}
const FONT_STYLE_WORDS = /\s+(Medium|Light|Bold|Regular|Semibold|SemiBold|Italic|Black|Thin|ExtraBold|Condensed)$/i;
const cleanFont = (f) => f.replace(FONT_STYLE_WORDS, "").trim();

/* ---------- 1. source scan ---------- */
function walk(dir, acc = []) {
  if (!exists(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".next" || e.name.startsWith("_")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.tsx?$/.test(e.name)) acc.push(p);
  }
  return acc;
}
const srcFiles = ["app", "components", "lib", "hooks"].flatMap((d) => walk(path.join(ROOT, d)));
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, "/");

const importers = { "template-series": [], "template-catalog": [], "lib/catalog": [], "template-assets": [] };
for (const f of srcFiles) {
  const t = read(f) || "";
  if (/template-series/.test(t)) importers["template-series"].push(rel(f));
  if (/template-catalog/.test(t)) importers["template-catalog"].push(rel(f));
  if (/from\s+["']@\/lib\/catalog["']/.test(t)) importers["lib/catalog"].push(rel(f));
  if (/template-assets/.test(t)) importers["template-assets"].push(rel(f));
}

/* ---------- 2. renderer coverage ---------- */
const renderIdx = read(path.join(ROOT, "components/render/index.tsx")) || "";
const mapBlock = (renderIdx.match(/MAP[^=]*=\s*\{([\s\S]*?)\}/) || [, ""])[1];
const rendererKeys = [...mapBlock.matchAll(/["'](\d+)["']\s*:/g)].map((m) => m[1]);

/* ---------- 3. catalogs ---------- */
const legacySrc = read(path.join(ROOT, "lib/catalog.ts")) || "";
const legacyIds = [...legacySrc.matchAll(/\bid:\s*"([^"]+)"/g)].map((m) => m[1]);
const catSrc = read(path.join(ROOT, "lib/template-catalog.ts")) || "";
let catalog = [];
try {
  const s = catSrc.indexOf("export const TEMPLATE_CATALOG");
  const a = catSrc.indexOf("[", s);
  let depth = 0, end = -1;
  for (let i = a; i < catSrc.length; i++) {
    if (catSrc[i] === "[") depth++;
    else if (catSrc[i] === "]") { depth--; if (depth === 0) { end = i; break; } }
  }
  catalog = JSON.parse(catSrc.slice(a, end + 1));
} catch (e) { catalog = []; }

const storeSrc = read(path.join(ROOT, "lib/store.tsx")) || "";
const storeTemplateIds = [...new Set([...storeSrc.matchAll(/template:\s*"([^"]+)"/g)].map((m) => m[1]))];

/* ---------- 4. truncation + rule violations ---------- */
const tsSrc = read(path.join(ROOT, "lib/template-series.ts"));
let truncated = false, truncTail = "";
if (tsSrc === null) truncated = true;
else {
  truncTail = tsSrc.trim().slice(-120);
  const open = (tsSrc.match(/[\{\[\(]/g) || []).length;
  const close = (tsSrc.match(/[\}\]\)]/g) || []).length;
  truncated = open !== close || !/[;}\]]\s*$/.test(tsSrc.trim());
}
const editorPath = path.join(ROOT, "app/(app)/editor/[id]/page.tsx");
const editorSrc = read(editorPath) || "";
const violations = [];
editorSrc.split(/\r?\n/).forEach((line, i) => {
  if (/accent:\s*[a-zA-Z]/.test(line) || /Template\s*&\s*Colors/.test(line) || /updateDoc\([^)]*\{\s*font:/.test(line)) {
    violations.push({ file: rel(editorPath), line: i + 1, code: line.trim().slice(0, 160) });
  }
});

/* ---------- 5. design extraction from OOXML ---------- */
function harvest(id) {
  const dir = path.join(ROOT, "_farnavi", "_xml", id);
  const doc = read(path.join(dir, "document.xml")) || "";
  const sty = read(path.join(dir, "styles.xml")) || "";
  const thm = read(path.join(dir, "theme1.xml")) || "";
  const all = doc + "\n" + sty;
  const review = [];
  if (!doc) { review.push("document.xml missing — extraction skipped"); }

  const ink = new Map(), fill = new Map(), draw = new Map();
  for (const m of all.matchAll(/<w:color\b[^>]*w:val="([0-9A-Fa-f]{6})"/g)) bump(ink, m[1].toUpperCase());
  for (const m of all.matchAll(/<w:shd\b[^>]*w:fill="([0-9A-Fa-f]{6})"/g)) bump(fill, m[1].toUpperCase());
  for (const m of doc.matchAll(/<a:srgbClr\b[^>]*val="([0-9A-Fa-f]{6})"/g)) bump(draw, m[1].toUpperCase());
  for (const [k, v] of draw) ink.set(k, (ink.get(k) || 0) + v);

  const fonts = new Map();
  for (const m of all.matchAll(/<w:rFonts\b[^>]*>/g)) {
    for (const a of m[0].matchAll(/w:(?:ascii|hAnsi|cs)="([^"]+)"/g)) bump(fonts, cleanFont(a[1]));
  }
  const themeFonts = [...thm.matchAll(/<a:latin\b[^>]*typeface="([^"]+)"/g)].map((m) => cleanFont(m[1])).filter(Boolean);

  const sizes = new Map();
  for (const m of all.matchAll(/<w:sz\b[^>]*w:val="(\d+)"/g)) bump(sizes, Number(m[1]) / 2);

  const pgMar = (doc.match(/<w:pgMar\b[^>]*>/) || [""])[0];
  const attr = (s, k) => { const m = s.match(new RegExp('w:' + k + '="(-?\\d+)"')); return m ? Number(m[1]) : null; };
  const twip2in = (v) => (v === null ? null : Math.round((v / 1440) * 100) / 100);
  const margins = { top: twip2in(attr(pgMar, "top")), bottom: twip2in(attr(pgMar, "bottom")), left: twip2in(attr(pgMar, "left")), right: twip2in(attr(pgMar, "right")) };

  const pgSz = (doc.match(/<w:pgSz\b[^>]*>/) || [""])[0];
  const wmm = attr(pgSz, "w") ? Math.round((attr(pgSz, "w") / 1440) * 25.4 * 10) / 10 : null;
  const hmm = attr(pgSz, "h") ? Math.round((attr(pgSz, "h") / 1440) * 25.4 * 10) / 10 : null;

  const colsTag = (doc.match(/<w:cols\b[^>]*>/) || [""])[0];
  const docxCols = attr(colsTag, "num") || 1;
  const textboxes = (doc.match(/<wps:txbx|<v:textbox/g) || []).length;
  const blips = (doc.match(/<a:blip\b/g) || []).length;

  const meta = j(path.join(ROOT, "public", "templates", id, "meta.json")) || {};
  const metaAccents = (meta.accents || []).map((h) => h.replace("#", "").toUpperCase());
  const isThemeDefault = metaAccents.slice(0, 3).join(",") === "4472C4,ED7D31,A5A5A5" || metaAccents.includes("4472C4");

  const colored = top(ink).filter(([h]) => sat(h) > 0.18);
  const coloredFill = top(fill).filter(([h]) => sat(h) > 0.10);
  const neutrals = top(ink).filter(([h]) => sat(h) <= 0.18);

  let accent = colored.length ? colored[0][0] : (coloredFill.length ? coloredFill[0][0] : null);
  let accentSource = colored.length ? "docx-text" : (coloredFill.length ? "docx-fill" : "none");
  if (!accent && metaAccents.length && !isThemeDefault) { accent = metaAccents[0]; accentSource = "meta.accents"; }
  if (!accent) review.push("NO reliable accent color found (meta.accents is the Office default theme) — manual pixel sampling required");
  if (accentSource === "meta.accents") review.push("accent came from meta.json, verify against preview PNG");

  const deepCand = [...colored, ...coloredFill].filter(([h]) => accent && lum(h) < lum(accent)).sort((a, b) => lum(a[0]) - lum(b[0]));
  const tintCand = [...coloredFill, ...colored].filter(([h]) => lum(h) > 0.80).sort((a, b) => lum(b[0]) - lum(a[0]));
  const deep = deepCand.length ? deepCand[0][0] : (metaAccents[2] && !isThemeDefault ? metaAccents[2] : accent);
  const tint = tintCand.length ? tintCand[0][0] : (metaAccents[1] && !isThemeDefault ? metaAccents[1] : null);

  const darkNeutral = neutrals.filter(([h]) => lum(h) < 0.35);
  const midNeutral = neutrals.filter(([h]) => lum(h) >= 0.35 && lum(h) < 0.7);
  const inkColor = darkNeutral.length ? darkNeutral[0][0] : "111111";
  const mutedColor = midNeutral.length ? midNeutral[0][0] : "555555";
  if (!darkNeutral.length) review.push("ink color defaulted to #111111 (document uses auto color)");
  if (!midNeutral.length) review.push("muted color defaulted to #555555");

  const fontList = top(fonts).map(([f]) => f);
  const heading = (meta.fonts && meta.fonts.heading) || fontList[0] || themeFonts[0] || null;
  const body = (meta.fonts && meta.fonts.body) || fontList[0] || themeFonts[1] || heading;
  if (!heading) review.push("no font detected");
  if (fontList.length && heading && !fontList.includes(heading)) review.push("meta heading font '" + heading + "' not present in docx rFonts (" + fontList.slice(0, 5).join(", ") + ")");

  const szTop = top(sizes);
  const bodyPt = szTop.length ? szTop[0][0] : null;
  const namePt = szTop.length ? Math.max(...szTop.map(([v]) => v)) : null;
  const minorPt = szTop.length ? Math.min(...szTop.map(([v]) => v)) : null;
  const titleCand = szTop.filter(([v]) => bodyPt !== null && v > bodyPt).sort((a, b) => b[1] - a[1]);
  const sectionPt = titleCand.length ? titleCand[0][0] : bodyPt;

  const confidence = {
    colors: accentSource === "docx-text" ? "high" : (accentSource === "none" ? "none" : "medium"),
    fonts: fontList.length ? "high" : "low",
    typeScale: "heuristic"
  };
  if (textboxes > 0 && docxCols === 1 && (meta.columns === 2 || textboxes > 15)) {
    review.push("layout ambiguous: docxCols=1 but " + textboxes + " text boxes (meta.columns=" + meta.columns + ") — verify visually");
  }

  return {
    id, source: "docx:resume-1p-a4.docx", extractedAt: new Date().toISOString(),
    colors: {
      accent: accent ? "#" + accent : null,
      deep: deep ? "#" + deep : null,
      tint: tint ? "#" + tint : null,
      ink: "#" + inkColor, muted: "#" + mutedColor,
      rule: tint ? "#" + tint : "#" + inkColor, page: "#FFFFFF"
    },
    accentSource,
    palette: { text: top(ink).slice(0, 12).map(([hex, n]) => ({ hex: "#" + hex, n })), fill: top(fill).slice(0, 12).map(([hex, n]) => ({ hex: "#" + hex, n })) },
    fonts: { heading, body, all: fontList, theme: themeFonts },
    typeScale: { name: namePt, sectionTitle: sectionPt, body: bodyPt, minor: minorPt },
    margins, pageSize: { w: wmm, h: hmm, unit: "mm" },
    columns: meta.columns || docxCols, docxCols, textboxes,
    photo: !!meta.photo || blips > 0, blips,
    confidence, needsReview: review
  };
}

const designs = {};
for (const id of IDS) {
  const d = harvest(id);
  designs[id] = d;
  writeJson(path.join(ROOT, "public", "templates", id, "design.json"), d);
}

/* ---------- 6. aggregate locked-design map ---------- */
const aggPath = path.join(ROOT, "lib", "template-design.json");
const prev = read(aggPath);
if (prev) writeJson(path.join(ROOT, "_farnavi", "backups", "template-design.before-chunk01.json"), JSON.parse(prev));
const agg = { _comment: "GENERATED by CHUNK 01 from real DOCX + meta.json. READ-ONLY. Never the UI palette." };
for (const id of IDS) {
  const d = designs[id];
  agg[id] = {
    accent: d.colors.accent, deep: d.colors.deep, tint: d.colors.tint,
    ink: d.colors.ink, muted: d.colors.muted, rule: d.colors.rule, page: d.colors.page,
    heading: d.fonts.heading, body: d.fonts.body,
    margins: d.margins, pageSize: d.pageSize, columns: d.columns, photo: d.photo,
    typeScale: d.typeScale, confidence: d.confidence, needsReview: d.needsReview
  };
}
writeJson(aggPath, agg);

/* ---------- 7. assets + fonts ---------- */
const pkg = j(path.join(ROOT, "package.json")) || {};
const installed = Object.keys(pkg.dependencies || {}).filter((k) => k.startsWith("@fontsource/"))
  .map((k) => k.replace("@fontsource/", "").replace(/-/g, " ").toLowerCase());
const needed = new Set();
for (const id of IDS) (designs[id].fonts.all || []).forEach((f) => needed.add(f));
const missingFonts = [...needed].filter((f) => !installed.includes(f.toLowerCase()));

const assets = IDS.map((id) => {
  const dir = path.join(ROOT, "public", "templates", id);
  const files = exists(dir) ? fs.readdirSync(dir) : [];
  return {
    id,
    meta: files.includes("meta.json"),
    gdocs: files.includes("gdocs.json"),
    design: files.includes("design.json"),
    previews: files.filter((f) => f.startsWith("preview-")).length,
    docx: files.filter((f) => f.endsWith(".docx")).length,
    pdf: files.filter((f) => f.endsWith(".pdf")).length
  };
});

/* ---------- 8. reports ---------- */
const audit = {
  generatedAt: new Date().toISOString(), root: ROOT, package: pkg.name,
  counts: { sourceFiles: srcFiles.length, series: IDS.length },
  rendererKeys, missingRenderers: IDS.filter((i) => !rendererKeys.includes(i)),
  catalogIds: catalog.map((c) => c.id), legacyCatalogIds: legacyIds, storeTemplateIds,
  idMismatch: storeTemplateIds.filter((t) => !IDS.includes(t)),
  templateSeriesTruncated: truncated, templateSeriesTail: truncTail,
  hardRule0Violations: violations, importers, assets, missingFonts,
  designs: Object.fromEntries(IDS.map((i) => [i, { accent: designs[i].colors.accent, accentSource: designs[i].accentSource, heading: designs[i].fonts.heading, body: designs[i].fonts.body, confidence: designs[i].confidence, needsReview: designs[i].needsReview }]))
};
writeJson(path.join(ROOT, "_farnavi", "audit.json"), audit);

const L = [];
L.push("# FARNAVI — CHUNK 01 AUDIT", "", "Generated: " + audit.generatedAt, "");
L.push("## 1. Renderer coverage");
L.push("- Registered renderers: " + (rendererKeys.join(", ") || "(none)"));
L.push("- Missing renderers: " + (audit.missingRenderers.join(", ") || "(none)"), "");
L.push("## 2. Catalog identity");
L.push("- template-catalog ids: " + audit.catalogIds.join(", "));
L.push("- legacy catalog ids: " + audit.legacyCatalogIds.join(", "));
L.push("- ids used by store: " + audit.storeTemplateIds.join(", "));
L.push("- MISMATCHED ids (store -> not a real series): " + (audit.idMismatch.join(", ") || "(none)"), "");
L.push("## 3. Build blockers");
L.push("- lib/template-series.ts truncated: " + truncated);
L.push("- tail: `" + truncTail + "`", "");
L.push("## 4. HARD RULE 0 violations (template colors/fonts editable)");
if (!violations.length) L.push("- none");
violations.forEach((v) => L.push("- " + v.file + ":" + v.line + "  `" + v.code + "`"));
L.push("", "## 5. Extracted locked design");
L.push("| series | accent | source | heading | body | color confidence | review |");
L.push("|---|---|---|---|---|---|---|");
for (const id of IDS) {
  const d = audit.designs[id];
  L.push("| " + id + " | " + (d.accent || "—") + " | " + d.accentSource + " | " + (d.heading || "—") + " | " + (d.body || "—") + " | " + d.confidence.colors + " | " + (d.needsReview.length || 0) + " |");
}
L.push("", "## 6. Assets");
L.push("| series | meta | gdocs | design | previews | docx | pdf |");
L.push("|---|---|---|---|---|---|---|");
assets.forEach((a) => L.push("| " + a.id + " | " + a.meta + " | " + a.gdocs + " | " + a.design + " | " + a.previews + " | " + a.docx + " | " + a.pdf + " |"));
L.push("", "## 7. Fonts not installed via @fontsource");
L.push(missingFonts.length ? missingFonts.map((f) => "- " + f).join("\n") : "- none");
L.push("", "## 8. Open review items");
for (const id of IDS) designs[id].needsReview.forEach((r) => L.push("- [" + id + "] " + r));
L.push("", "## 9. Importers");
for (const k of Object.keys(importers)) L.push("- **" + k + "**: " + (importers[k].join(", ") || "(none)"));
fs.writeFileSync(path.join(ROOT, "_farnavi", "AUDIT.md"), L.join("\n"), "utf8");
console.log("[inspect] audit.json + AUDIT.md + 8 design.json + lib/template-design.json written");
console.log("[inspect] missing renderers: " + audit.missingRenderers.join(", "));
console.log("[inspect] store id mismatch: " + (audit.idMismatch.join(", ") || "none"));
console.log("[inspect] hard-rule-0 violations: " + violations.length);