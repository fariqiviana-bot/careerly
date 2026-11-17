import fs from "node:fs"; import path from "node:path";
const F=path.join(process.cwd(),"lib","store.tsx"), log=[];
if(!fs.existsSync(F)){ console.log("store.tsx MISSING"); process.exit(0); }
const orig=fs.readFileSync(F,"utf8"), crlf=orig.indexOf("\r\n")>=0;
let t=orig.replace(/\r\n/g,"\n");
log.push("EOL: "+(crlf?"CRLF":"LF"));
const BLOCK=`const VALID_TEMPLATE_IDS: Set<string> = new Set(TEMPLATES.map((t) => t.id));
function normalizeTemplateId(tplId?: string): string {
  if (tplId && VALID_TEMPLATE_IDS.has(tplId)) return tplId;
  const r = resolveTemplate(tplId);
  return r ? r.series : "11";
}
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
if(t.indexOf("series?: string;")>=0) log.push("A doc fields: already applied");
else{ const a="\n  template: string;\n  accent: string;";
  const b="\n  template: string;\n  series?: string;\n  variant?: \"design\" | \"ats\";\n  visibility?: Record<string, boolean>;\n  accent: string;";
  if(t.indexOf(a)>=0){ t=t.replace(a,b); log.push("A doc fields: APPLIED"); } else log.push("A doc fields: ANCHOR NOT FOUND"); }
if(t.indexOf("function normalizeDoc(")>=0) log.push("B normalizeDoc: already applied");
else{ const re=/const VALID_TEMPLATE_IDS = new Set\(TEMPLATES\.map\(\(t\) => t\.id\)\);\s*function normalizeTemplateId\(tplId\?: string\): string \{[\s\S]*?\n\}/;
  if(re.test(t)){ t=t.replace(re,BLOCK); log.push("B normalizeDoc: APPLIED"); } else log.push("B normalizeDoc: ANCHOR NOT FOUND"); }
if(t.indexOf("s.docs.map((d: Doc) => normalizeDoc(d))")>=0) log.push("C hydration: already applied");
else{ const re=/const migrated = s\.docs\.map\([\s\S]*?\);\s*setDocs\(migrated\);/;
  if(re.test(t)){ t=t.replace(re,"const migrated = s.docs.map((d: Doc) => normalizeDoc(d));\n          setDocs(migrated);"); log.push("C hydration: APPLIED"); } else log.push("C hydration: ANCHOR NOT FOUND"); }
if(t!==orig.replace(/\r\n/g,"\n")){ fs.writeFileSync(F,crlf?t.replace(/\n/g,"\r\n"):t,"utf8"); log.push("store.tsx WRITTEN"); } else log.push("store.tsx unchanged");
const checks={"import EDITOR_TEMPLATES":"EDITOR_TEMPLATES as TEMPLATES","Doc.series":"series?: string;",
 "normalizeDoc":"function normalizeDoc(","seeds":"seedDocs.map(normalizeDoc)",
 "hydration":"s.docs.map((d: Doc) => normalizeDoc(d))","key v3":"farnavi_store_v3","Set<string>":"VALID_TEMPLATE_IDS: Set<string>"};
log.push("--- end state ---");
for(const k of Object.keys(checks)) log.push((t.indexOf(checks[k])>=0?"OK   ":"MISS ")+k);
fs.writeFileSync(path.join(process.cwd(),"_farnavi","PATCH-06.md"),"# CHUNK 06\n\n"+log.map(x=>"- "+x).join("\n"),"utf8");
console.log(log.join("\n"));