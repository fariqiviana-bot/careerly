import fs from "node:fs";
import path from "node:path";
const ROOT=process.cwd();
const report=[];
function patch(file, jobs){
  const p=path.join(ROOT,file);
  if(!fs.existsSync(p)){ report.push([file,"MISSING",0]); return; }
  let t=fs.readFileSync(p,"utf8"); const before=t; let n=0;
  for(const [name,re,rep] of jobs){
    if(re.test(t)){ t=t.replace(re,rep); n++; report.push([file,name,"applied"]); }
    else report.push([file,name,"anchor not found (skipped)"]);
  }
  if(t!==before) fs.writeFileSync(p,t,"utf8");
}

/* 1. build blocker: Tpl type is missing fileCount (8 tsc errors) */
patch("lib/template-catalog.ts",[
  ["add fileCount?: number to Tpl",
   /hasCover:\s*boolean;\s*hasReferences:\s*boolean\s*\};/,
   "hasCover: boolean; hasReferences: boolean; fileCount?: number };"]
]);

/* 2. HARD RULE 0 — only the 3 real violations (website-design controls are legitimate) */
const locked = '<div className="rounded-xl border border-border bg-muted/40 p-3 text-xs"><div className="mb-1 flex items-center gap-1.5 font-medium"><Lock className="h-3 w-3" />Template typography — locked</div><div className="text-muted-foreground">{doc.font}{doc.secondaryFont && doc.secondaryFont !== doc.font ? " + " + doc.secondaryFont : ""} · font &amp; color controls arrive with the Design panel.</div></div>';
patch("app/(app)/editor/[id]/page.tsx",[
  ["rename tab: Template & Colors -> Template", /Template & Colors/, "Template"],
  ["stop writing accent on template switch", /\{ template: t\.id, accent: t\.accent \}/, "{ template: t.id }"],
  ["remove template font picker", /<Field label="Font"><Select value=\{doc\.font\}[\s\S]*?<\/Field>/, locked]
]);

const lines=["# CHUNK 02 — PATCH REPORT",""];
for(const [f,n,s] of report) lines.push("- "+f+" :: "+n+" :: "+s);
fs.writeFileSync(path.join(ROOT,"_farnavi","PATCH-02.md"),lines.join("\n"),"utf8");
console.log("[patch]");
for(const [f,n,s] of report) console.log("  "+s+"  <-  "+n);