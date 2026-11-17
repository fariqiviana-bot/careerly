import fs from "node:fs"; import path from "node:path";
const ROOT=process.cwd(), rep=[];
function patch(file,jobs){
  const p=path.join(ROOT,file);
  if(!fs.existsSync(p)){rep.push([file,"FILE MISSING","skip"]);return;}
  let t=fs.readFileSync(p,"utf8");const before=t;
  for(const [name,re,fn] of jobs){
    if(re.test(t)){t=t.replace(re,fn);rep.push([file,name,"applied"]);}
    else rep.push([file,name,"ANCHOR NOT FOUND"]);
  }
  if(t!==before)fs.writeFileSync(p,t,"utf8");
}
const F="lib/store.tsx";
patch(F,[
 ["import EDITOR_TEMPLATES as TEMPLATES",
  /import \{ TEMPLATES \} from "\.\/catalog";/,
  'import { EDITOR_TEMPLATES as TEMPLATES, resolveTemplate } from "./editor/templates";'],
 ["Doc type: add series / variant / visibility",
  /(\n  template: string;\n)(  accent: string;)/,
  '$1  series?: string;\n  variant?: "design" | "ats";\n  visibility?: Record<string, boolean>;\n$2'],
 ["normalizeTemplateId -> series + normalizeDoc",
  /const VALID_TEMPLATE_IDS = new Set\(TEMPLATES\.map\(\(t\) => t\.id\)\);\nfunction normalizeTemplateId\(tplId\?: string\): string \{[\s\S]*?\n\}/,
`const VALID_TEMPLATE_IDS = new Set(TEMPLATES.map((t) => t.id));
/** Confirmed map: legacy ids -> real series (2,3,4,11,12,14,22,24). */
function normalizeTemplateId(tplId?: string): string {
  const r = resolveTemplate(tplId);
  return r ? r.series : "11";
}
/** Single normalizer used by seeds, hydration and addDoc. */
function normalizeDoc(d: Doc): Doc {
  const r = resolveTemplate(d.series ?? d.template);
  const series = r ? r.series : "11";
  const t = TEMPLATES.find((x) => x.id === series) ?? TEMPLATES[0];
  return {
    ...d,
    template: series,
    series,
    variant: r ? r.variant : (/ats/i.test(d.template || "") ? "ats" : "design"),
    accent: (r && r.design && r.design.accent) || t.accent || d.accent,
    font: (r && r.design && r.design.heading) || t.headingFont || d.font,
    secondaryFont: (r && r.design && r.design.body) || t.bodyFont || d.secondaryFont,
    settings: { ...defaultSettings(t.twoCol), ...(d.settings || {}) },
    visibility: d.visibility ?? {},
    ...(d.type === "website"
      ? { webTemplate: d.webTemplate ?? "editorial", slug: d.slug ?? "viana-fariqi", published: d.published ?? true }
      : {}),
  };
}`],
 ["seeds pass through normalizeDoc",
  /const \[docs, setDocs\] = useState<Doc\[\]>\(seedDocs\);/,
  "const [docs, setDocs] = useState<Doc[]>(() => seedDocs.map(normalizeDoc));"],
 ["read v3 -> v2 -> v1",
  /localStorage\.getItem\("farnavi_store_v2"\) \?\? localStorage\.getItem\("farnavi_store"\)/,
  'localStorage.getItem("farnavi_store_v3") ?? localStorage.getItem("farnavi_store_v2") ?? localStorage.getItem("farnavi_store")'],
 ["hydration mapper uses normalizeDoc",
  /const migrated = s\.docs\.map\([\s\S]*?\);\n          setDocs\(migrated\);/,
  "const migrated = s.docs.map((d: Doc) => normalizeDoc(d));\n          setDocs(migrated);"],
 ["write key v3", /"farnavi_store_v2",/, '"farnavi_store_v3",']
]);
const lines=["# CHUNK 03 — PATCH REPORT",""];
for(const [f,n,s] of rep)lines.push("- "+f+" :: "+n+" :: "+s);
fs.writeFileSync(path.join(ROOT,"_farnavi","PATCH-03.md"),lines.join("\n"),"utf8");
console.log("[patch]");for(const [f,n,s] of rep)console.log("  "+s+"  <-  "+n);
const bad=rep.filter(r=>r[2]!=="applied").length;
if(bad)console.log("[patch] WARNING: "+bad+" anchor(s) not applied — send PATCH-03.md back.");