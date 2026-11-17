import fs from "node:fs"; import path from "node:path";
const ROOT=process.cwd(), IDS=["2","3","4","11","12","14","22","24"], TWO=["2","3","4","22","24"];
const jread=p=>{try{return JSON.parse(fs.readFileSync(p,"utf8"))}catch{return null}};
const wj=(p,o)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(o,null,2),"utf8")};
const txt=fs.readFileSync(path.join(ROOT,"_farnavi","design-input.txt"),"utf8");
const rows={}, problems=[], unchecked=[];
for(const raw of txt.split(/\r?\n/)){
  const line=raw.trim();
  if(!line||line.startsWith("//")) continue;
  const parts=line.split("|").map(s=>s.trim());
  const id=parts[0];
  if(!IDS.includes(id)){ problems.push("unknown series id: "+id); continue; }
  const o={};
  for(const p of parts.slice(1)){ const i=p.indexOf("="); if(i<0)continue; o[p.slice(0,i).trim()]=p.slice(i+1).trim(); }
  rows[id]=o;
}
const HEX=v=>{
  if(v===undefined) return undefined;
  const s=String(v).trim();
  if(s==="-"||s.toLowerCase()==="none"||s==="") return null;
  if(s.toUpperCase()==="TODO") return "TODO";
  const h=s.replace(/^#/,"").toUpperCase();
  return /^[0-9A-F]{6}$/.test(h) ? "#"+h : "BAD:"+s;
};
for(const id of IDS){
  const o=rows[id];
  if(!o){ problems.push(id+": line missing"); continue; }
  for(const k of ["accent","ink"]){
    const v=HEX(o[k]);
    if(v===undefined) problems.push(id+": "+k+" missing");
    else if(v==="TODO") problems.push(id+": "+k+" is TODO");
    else if(typeof v==="string"&&v.startsWith("BAD:")) problems.push(id+": "+k+" invalid "+v);
    else if(v===null) problems.push(id+": "+k+" cannot be -");
  }
  for(const k of ["deep","tint","muted"]){
    const v=HEX(o[k]);
    if(v==="TODO") problems.push(id+": "+k+" is TODO (fill it or set -)");
    else if(typeof v==="string"&&v.startsWith("BAD:")) problems.push(id+": "+k+" invalid "+v);
  }
  for(const k of ["heading","body"]){
    const v=(o[k]||"").trim();
    if(!v||v.toUpperCase()==="TODO") problems.push(id+": "+k+" font missing");
  }
  if((o.checked||"no").toLowerCase()!=="yes") unchecked.push(id);
}
const status=["# DESIGN LOCK STATUS",""];
if(problems.length){
  status.push("NOT LOCKED. Fix these in _farnavi/design-input.txt:","");
  problems.forEach(p=>status.push("- "+p));
  fs.writeFileSync(path.join(ROOT,"_farnavi","DESIGN-STATUS.md"),status.join("\n"),"utf8");
  console.log("[apply] NOT LOCKED - "+problems.length+" item(s):");
  problems.forEach(p=>console.log("   "+p));
  process.exit(0);
}
const sat=h=>{const n=parseInt(h.slice(1),16),r=((n>>16)&255)/255,g=((n>>8)&255)/255,b=(n&255)/255;
  const mx=Math.max(r,g,b),mn=Math.min(r,g,b);return mx===0?0:(mx-mn)/mx;};
const agg={_comment:"HUMAN-LOCKED template design. READ-ONLY. Never the UI palette."};
const html=['<!doctype html><meta charset="utf-8"><title>Farnavi - locked design</title>',
'<style>body{font:14px system-ui;margin:22px;background:#f1efe9;color:#2b2f2a}section{background:#fff;border:1px solid #e4e2d8;border-radius:12px;padding:14px;margin:0 0 16px;display:grid;grid-template-columns:220px 1fr;gap:16px}img{width:100%;border:1px solid #ddd}td,th{border:1px solid #e4e2d8;padding:4px 8px;font-size:12px;text-align:left}table{border-collapse:collapse}.c{display:inline-block;width:15px;height:15px;border-radius:3px;border:1px solid #bbb;vertical-align:-3px;margin-right:6px}</style>',
'<h1>Farnavi - locked template design</h1>'];
const summary=[];
for(const id of IDS){
  const o=rows[id], meta=jread(path.join(ROOT,"public","templates",id,"meta.json"))||{};
  const C={accent:HEX(o.accent),deep:HEX(o.deep)??null,tint:HEX(o.tint)??null,
           ink:HEX(o.ink),muted:HEX(o.muted)??null};
  C.rule=C.tint||C.ink; C.page="#FFFFFF";
  const vals=Object.values(C).filter(v=>typeof v==="string"&&v.startsWith("#"));
  const mono=vals.every(v=>sat(v)<0.06);
  const heading=o.heading.trim(), body=o.body.trim();
  const checked=(o.checked||"no").toLowerCase()==="yes";
  const d={id,truthVersion:4,lockedBy:checked?"manual":"manual-unverified",
    lockedAt:new Date().toISOString(),colors:C,
    accentKind:C.accent==="#000000"?"ink":"chromatic",isMonochrome:mono,
    fonts:{heading,body,all:[...new Set([heading,body])],substitutes:{}},
    margins:meta.margins||{top:.5,right:.5,bottom:.5,left:.5},
    pageSize:{w:210,h:297,unit:"mm"},columns:TWO.includes(id)?2:1,
    photo:!!meta.photo,pages:meta.pages||[1],sizes:meta.sizes||["a4","letter"],
    tier:meta.tier||"unknown",atsScore:meta.atsScore??null,previews:meta.previews||{},
    confidence:{colors:checked?"manual":"manual-unverified",fonts:checked?"manual":"manual-unverified",typeScale:"pending"},
    needsReview:checked?[]:["line not marked checked=yes"]};
  wj(path.join(ROOT,"public","templates",id,"design.json"),d);
  agg[id]={accent:C.accent,deep:C.deep,tint:C.tint,ink:C.ink,muted:C.muted,rule:C.rule,page:C.page,
    heading,body,margins:d.margins,pageSize:d.pageSize,columns:d.columns,photo:d.photo,
    typeScale:{name:null,sectionTitle:null,body:null,minor:null},
    confidence:d.confidence,needsReview:d.needsReview};
  summary.push("| "+id+" | "+C.accent+" | "+(C.tint||"-")+" | "+(C.muted||"-")+" | "+heading+" / "+body+" | "+d.columns+" | "+(mono?"mono":"color")+" | "+(checked?"verified":"UNVERIFIED")+" |");
  html.push('<section><div><img src="../public/templates/'+id+'/preview-resume-1p-a4.png"></div><div>');
  html.push('<h2 style="font-size:16px;margin:0 0 6px">Series '+id+' - '+d.tier+' - '+d.columns+' col</h2><table>');
  for(const k of ["accent","deep","tint","ink","muted"]) html.push('<tr><td>'+k+'</td><td><span class="c" style="background:'+(C[k]||"transparent")+'"></span>'+(C[k]||"-")+'</td></tr>');
  html.push('<tr><td>fonts</td><td>'+heading+' / '+body+'</td></tr></table>');
  html.push('<p style="font-size:12px">'+(checked?"verified":"NOT verified - flip checked=yes")+'</p></div></section>');
}
wj(path.join(ROOT,"lib","template-design.json"),agg);
fs.writeFileSync(path.join(ROOT,"_farnavi","verify.html"),html.join("\n"),"utf8");
fs.writeFileSync(path.join(ROOT,"_farnavi","DESIGN-STATUS.md"),
 ["# DESIGN LOCKED","",
  "| series | accent | tint | muted | fonts | cols | kind | state |",
  "|---|---|---|---|---|---|---|---|"].concat(summary)
 .concat(["",unchecked.length?("Not yet verified: "+unchecked.join(", ")):"All 8 verified."]).join("\n"),"utf8");
console.log("[apply] LOCKED 8 templates -> design.json v4 + lib/template-design.json + verify.html");
summary.forEach(s=>console.log("  "+s));
if(unchecked.length) console.log("[apply] unverified lines: "+unchecked.join(", "));