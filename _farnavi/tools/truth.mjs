import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = process.cwd();
const IDS = ["2","3","4","11","12","14","22","24"];
const TWO_COL_USER = ["2","3","4","22","24"];   // user-confirmed (answer #4)
const ONE_COL_USER = ["11","12","14"];
const read  = p => { try { return fs.readFileSync(p,"utf8"); } catch { return null; } };
const jread = p => { try { return JSON.parse(fs.readFileSync(p,"utf8")); } catch { return null; } };
const wj    = (p,o) => { fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p,JSON.stringify(o,null,2),"utf8"); };
const hex6  = n => "#" + n.toString(16).padStart(6,"0").toUpperCase();
const lum   = n => { const r=((n>>16)&255)/255,g=((n>>8)&255)/255,b=(n&255)/255; return .2126*r+.7152*g+.0722*b; };
const sat   = n => { const r=((n>>16)&255)/255,g=((n>>8)&255)/255,b=(n&255)/255; const mx=Math.max(r,g,b),mn=Math.min(r,g,b); return mx===0?0:(mx-mn)/mx; };
const dist  = (a,b) => Math.sqrt(((a>>16&255)-(b>>16&255))**2 + ((a>>8&255)-(b>>8&255))**2 + ((a&255)-(b&255))**2);
const bump  = (m,k,w=1) => m.set(k,(m.get(k)||0)+w);
const top   = m => [...m.entries()].sort((a,b)=>b[1]-a[1]);

/* ---------------- minimal PNG decoder (8-bit, non-interlaced) ---------------- */
function decodePng(buf){
  if(buf.readUInt32BE(0)!==0x89504E47) throw new Error("not a png");
  let off=8, ih=null, plte=null; const idat=[];
  while(off+8<=buf.length){
    const len=buf.readUInt32BE(off), type=buf.toString("ascii",off+4,off+8);
    const data=buf.subarray(off+8,off+8+len);
    if(type==="IHDR") ih={w:data.readUInt32BE(0),h:data.readUInt32BE(4),depth:data[8],color:data[9],interlace:data[12]};
    else if(type==="PLTE") plte=data;
    else if(type==="IDAT") idat.push(data);
    else if(type==="IEND") break;
    off += 12+len;
  }
  if(!ih) throw new Error("no IHDR");
  if(ih.depth!==8 || ih.interlace!==0) throw new Error("unsupported depth/interlace");
  const ch = ih.color===6?4 : ih.color===2?3 : (ih.color===0||ih.color===3)?1 : 0;
  if(!ch) throw new Error("unsupported color type "+ih.color);
  if(ih.color===3 && !plte) throw new Error("palette missing");
  const raw=zlib.inflateSync(Buffer.concat(idat));
  const stride=ih.w*ch, out=Buffer.alloc(ih.h*stride);
  let p=0;
  for(let y=0;y<ih.h;y++){
    const f=raw[p++]; const line=raw.subarray(p,p+stride); p+=stride;
    const cur=out.subarray(y*stride,(y+1)*stride);
    const prev=y>0?out.subarray((y-1)*stride,y*stride):null;
    for(let x=0;x<stride;x++){
      const a=x>=ch?cur[x-ch]:0, b=prev?prev[x]:0, c=(prev&&x>=ch)?prev[x-ch]:0;
      let v=line[x];
      if(f===1) v+=a; else if(f===2) v+=b; else if(f===3) v+=(a+b)>>1;
      else if(f===4){ const pa=Math.abs(b-c),pb=Math.abs(a-c),pc=Math.abs(a+b-2*c); v += (pa<=pb&&pa<=pc)?a:(pb<=pc?b:c); }
      cur[x]=v&255;
    }
  }
  return {w:ih.w,h:ih.h,ch,color:ih.color,plte,data:out};
}

function samplePng(file){
  const png=decodePng(fs.readFileSync(file));
  const {w,h,ch,color,plte,data}=png, stride=w*ch, buckets=new Map();
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const i=y*stride+x*ch; let r,g,b;
      if(color===3){ const k=data[i]*3; r=plte[k]; g=plte[k+1]; b=plte[k+2]; }
      else if(ch===1){ r=g=b=data[i]; }
      else { r=data[i]; g=data[i+1]; b=data[i+2]; }
      if(r>247&&g>247&&b>247) continue;
      const key=((r>>3)<<10)|((g>>3)<<5)|(b>>3);
      let s=buckets.get(key);
      if(!s){ s={n:0,exact:new Map(),x0:x,x1:x,y0:y,y1:y}; buckets.set(key,s); }
      s.n++; bump(s.exact,(r<<16)|(g<<8)|b);
      if(x<s.x0)s.x0=x; if(x>s.x1)s.x1=x; if(y<s.y0)s.y0=y; if(y>s.y1)s.y1=y;
    }
  }
  const minN=Math.max(120, Math.round(w*h*0.0003));
  const rows=[];
  for(const s of buckets.values()){
    if(s.n<minN) continue;
    const best=top(s.exact)[0][0];
    const area=(s.x1-s.x0+1)*(s.y1-s.y0+1);
    rows.push({ hex:best, n:s.n, fill:s.n/area, lum:lum(best), sat:sat(best),
      boxMm:{ x:+(s.x0/w*210).toFixed(1), y:+(s.y0/h*297).toFixed(1), w:+((s.x1-s.x0+1)/w*210).toFixed(1), h:+((s.y1-s.y0+1)/h*297).toFixed(1) } });
  }
  rows.sort((a,b)=>b.n-a.n);
  return { w, h, rows };
}

/* ---------------- run-level DOCX harvest (styles.xml EXCLUDED) ---------------- */
function harvestDocx(id){
  const dir=path.join(ROOT,"_farnavi","_xml",id);
  const doc=read(path.join(dir,"document.xml"))||"";
  const colors=new Map(), samples=new Map(), fills=new Map();
  const fontChars=new Map(), fontMax=new Map(), sizeChars=new Map();
  const lefts=[], widths=[];
  const cleanFont = f => f.replace(/\s*\d+(\.\d+)?\s*pt$/i,"").replace(/\s+(Medium|Light|Bold|Regular|Semibold|SemiBold|Italic|Black|Thin|ExtraBold|Condensed)$/i,"").trim();
  const toPt=(v,u)=> u==="in"?v*72 : u==="mm"?v*72/25.4 : u==="px"?v*0.75 : v;

  for(const m of doc.matchAll(/<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g)){
    const body=m[1];
    const text=[...body.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map(x=>x[1]).join("").trim();
    if(!text) continue;
    const col=(body.match(/<w:color\b[^>]*w:val="([0-9A-Fa-f]{6})"/)||[])[1];
    if(col){ const n=parseInt(col,16); bump(colors,n,text.length); if(!samples.has(n)) samples.set(n,text.slice(0,60)); }
    const rf=(body.match(/<w:rFonts\b[^>]*>/)||[""])[0];
    const fn=(rf.match(/w:(?:ascii|hAnsi)="([^"]+)"/)||[])[1];
    if(fn){ const f=cleanFont(fn); bump(fontChars,f,text.length); }
    const sz=(body.match(/<w:sz\b[^>]*w:val="(\d+)"/)||[])[1];
    if(sz){ const pt=Number(sz)/2; bump(sizeChars,pt,text.length); if(fn){ const f=cleanFont(fn); fontMax.set(f,Math.max(fontMax.get(f)||0,pt)); } }
  }
  for(const m of doc.matchAll(/<a:solidFill>\s*<a:srgbClr\b[^>]*val="([0-9A-Fa-f]{6})"/g)) bump(fills,parseInt(m[1],16));
  for(const m of doc.matchAll(/<v:(?:shape|rect|roundrect)\b[^>]*>/g)){
    const tag=m[0];
    const fc=(tag.match(/fillcolor="#?([0-9A-Fa-f]{6})"/)||[])[1];
    if(fc) bump(fills,parseInt(fc,16),40);
    const st=(tag.match(/style="([^"]*)"/)||[])[1]||"";
    const ml=st.match(/margin-left:\s*(-?[\d.]+)(pt|in|mm|px)/);
    if(ml) lefts.push(toPt(Number(ml[1]),ml[2]));
    const wd=st.match(/width:\s*([\d.]+)(pt|in|mm|px)/);
    if(wd) widths.push(toPt(Number(wd[1]),wd[2]));
  }
  for(const m of doc.matchAll(/<wp:positionH[\s\S]{0,400}?<wp:posOffset>(-?\d+)<\/wp:posOffset>/g)) lefts.push(Number(m[1])/12700);

  const pgMar=(doc.match(/<w:pgMar\b[^>]*>/)||[""])[0];
  const pgSz =(doc.match(/<w:pgSz\b[^>]*>/)||[""])[0];
  const at=(s,k)=>{ const m=s.match(new RegExp('w:'+k+'="(-?\\d+)"')); return m?Number(m[1]):null; };
  const inch=v=>v===null?null:Math.round(v/1440*100)/100;
  const margins={top:inch(at(pgMar,"top")),bottom:inch(at(pgMar,"bottom")),left:inch(at(pgMar,"left")),right:inch(at(pgMar,"right"))};
  const pw=at(pgSz,"w"), ph=at(pgSz,"h");
  const pageSize={ w: pw?+(pw/1440*25.4).toFixed(1):null, h: ph?+(ph/1440*25.4).toFixed(1):null, unit:"mm" };
  const pageWpt = pw ? pw/20 : 595;

  // 1-D clustering of shape left offsets -> column evidence
  const sorted=[...lefts].sort((a,b)=>a-b); const clusters=[];
  for(const v of sorted){
    const last=clusters[clusters.length-1];
    if(!last || v-last.max>24) clusters.push({min:v,max:v,n:1,sum:v});
    else { last.max=v; last.n++; last.sum+=v; }
  }
  const cl=clusters.filter(c=>c.n>=3).map(c=>({ meanPt:+(c.sum/c.n).toFixed(1), n:c.n }));
  let detected=null;
  if(cl.length>=2 && cl[0].meanPt < pageWpt*0.45 && cl[1].meanPt > pageWpt*0.30) detected=2;
  else if(cl.length===1) detected=1;

  const szTop=top(sizeChars);
  const bodyPt=szTop.length?szTop[0][0]:null;
  const namePt=fontMax.size?Math.max(...fontMax.values()):(szTop.length?Math.max(...szTop.map(x=>x[0])):null);
  const titleCand=szTop.filter(x=>bodyPt!==null&&x[0]>bodyPt).sort((a,b)=>b[1]-a[1]);
  const fcTop=top(fontChars);
  let heading=null;
  if(fontMax.size){ heading=[...fontMax.entries()].sort((a,b)=> b[1]-a[1] || (fontChars.get(b[0])||0)-(fontChars.get(a[0])||0))[0][0]; }
  const body = fcTop.length?fcTop[0][0]:heading;

  return { colors, samples, fills, fontChars, fontMax, sizeChars,
    fontList: fcTop.map(x=>x[0]), heading, body,
    typeScale:{ name:namePt, sectionTitle: titleCand.length?titleCand[0][0]:bodyPt, body:bodyPt, minor: szTop.length?Math.min(...szTop.map(x=>x[0])):null },
    margins, pageSize, columnClusters:cl, columnsDetected:detected,
    textboxes:(doc.match(/<wps:txbx|<v:textbox/g)||[]).length,
    leftWidthPt: widths.length?+(widths.sort((a,b)=>a-b)[0]).toFixed(1):null,
    docxOk: !!doc };
}

/* ---------------- role assignment ---------------- */
function pickRoles(png, dx, meta){
  const review=[]; const ev={};
  const docxPool=[...dx.colors.keys(), ...dx.fills.keys()];
  const snap = n => {
    if(!docxPool.length) return { hex:n, src:"png" };
    let best=null,bd=1e9;
    for(const c of docxPool){ const d=dist(n,c); if(d<bd){bd=d;best=c;} }
    return (bd<48) ? { hex:best, src:"png+docx" } : { hex:n, src:"png" };
  };
  let accent=null,tint=null,deep=null,ink=null,muted=null,src="none";

  if(png && png.rows.length){
    const S=png.rows.filter(r=>r.sat>0.16);
    const N=png.rows.filter(r=>r.sat<=0.16);
    const inkCand=S.filter(r=>r.fill<=0.45).sort((a,b)=>b.n-a.n);
    const fillCand=S.filter(r=>r.fill>0.45).sort((a,b)=>b.n-a.n);
    if(inkCand.length){ const s=snap(inkCand[0].hex); accent=s.hex; src=s.src; }
    else if(fillCand.length){ const s=snap(fillCand[0].hex); accent=s.hex; src=s.src+"(fill)"; }
    const dark=fillCand.filter(r=>r.lum<0.45).sort((a,b)=>a.lum-b.lum);
    const light=fillCand.filter(r=>r.lum>0.72).sort((a,b)=>b.lum-a.lum);
    if(dark.length) deep=snap(dark[0].hex).hex;
    if(light.length) tint=snap(light[0].hex).hex;
    const nDark=N.filter(r=>r.lum<0.35).sort((a,b)=>b.n-a.n);
    const nMid =N.filter(r=>r.lum>=0.35&&r.lum<0.72).sort((a,b)=>b.n-a.n);
    ink   = nDark.length?snap(nDark[0].hex).hex:null;
    muted = nMid.length ?snap(nMid[0].hex).hex :null;
    ev.pngTop = png.rows.slice(0,10).map(r=>({hex:hex6(r.hex),px:r.n,fill:+r.fill.toFixed(2),lum:+r.lum.toFixed(2),sat:+r.sat.toFixed(2),box:r.boxMm}));
    ev.pngSize = { w:png.w, h:png.h };
  } else {
    review.push("PNG preview unavailable/unsupported — colors from DOCX runs only");
    const c=top(dx.colors).filter(([n])=>sat(n)>0.16);
    const f=top(dx.fills).filter(([n])=>sat(n)>0.10);
    if(c.length){ accent=c[0][0]; src="docx-run"; }
    else if(f.length){ accent=f[0][0]; src="docx-fill"; }
    const nd=top(dx.colors).filter(([n])=>sat(n)<=0.16&&lum(n)<0.35);
    const nm=top(dx.colors).filter(([n])=>sat(n)<=0.16&&lum(n)>=0.35&&lum(n)<0.72);
    ink=nd.length?nd[0][0]:null; muted=nm.length?nm[0][0]:null;
    if(f.length){ const l=f.filter(([n])=>lum(n)>0.72); const d=f.filter(([n])=>lum(n)<0.45); if(l.length)tint=l[0][0]; if(d.length)deep=d[0][0]; }
  }
  if(accent===null){ review.push("NO accent found — manual pixel pick required"); }
  if(!ink){ ink=0x111111; review.push("ink defaulted to #111111"); }
  if(!muted){ muted=0x555555; review.push("muted defaulted to #555555"); }
  if(!deep) deep=accent;
  ev.docxRuns = top(dx.colors).slice(0,10).map(([n,c])=>({hex:hex6(n),chars:c,sample:dx.samples.get(n)||""}));
  ev.docxFills = top(dx.fills).slice(0,8).map(([n,c])=>({hex:hex6(n),weight:c}));
  const confidence = { colors: src.startsWith("png+docx")?"high":(src==="none"?"none":"medium"),
                       fonts: dx.fontList.length?"high":"low", typeScale:"heuristic" };
  return { accent,deep,tint,ink,muted,src,confidence,review,ev };
}

const SUBS = { "Times New Roman":"Tinos", "Calibri":"Carlito", "Cambria":"Caladea", "Arial":"Arimo" };
const out={}; const md=[]; const html=['<!doctype html><meta charset="utf-8"><title>Farnavi — design truth v2</title>',
 '<style>body{font:14px system-ui;margin:24px;background:#f1efe9;color:#2b2f2a}section{background:#fff;border:1px solid #e4e2d8;border-radius:12px;padding:16px;margin:0 0 20px;display:grid;grid-template-columns:320px 1fr;gap:20px}img{width:100%;border:1px solid #ddd}table{border-collapse:collapse;font-size:12px}td,th{border:1px solid #e4e2d8;padding:4px 8px;text-align:left}.chip{display:inline-block;width:16px;height:16px;border-radius:4px;border:1px solid #ccc;vertical-align:-3px;margin-right:6px}h2{margin:0 0 8px;font-size:16px}</style>',
 '<h1>Farnavi — Design Truth v2</h1><p>Compare each preview with the extracted roles. Report any mismatch.</p>'];

for(const id of IDS){
  const meta=jread(path.join(ROOT,"public","templates",id,"meta.json"))||{};
  const dx=harvestDocx(id);
  let png=null, pngErr=null;
  const pf=path.join(ROOT,"public","templates",id,"preview-resume-1p-a4.png");
  try{ png=samplePng(pf); }catch(e){ pngErr=String(e.message||e); }
  const R=pickRoles(png,dx,meta);
  const review=[...R.review];
  if(pngErr) review.push("png decode failed: "+pngErr);

  const columns = TWO_COL_USER.includes(id)?2 : ONE_COL_USER.includes(id)?1 : (dx.columnsDetected ?? meta.columns ?? 1);
  if(dx.columnsDetected && dx.columnsDetected!==columns) review.push("column detection says "+dx.columnsDetected+" but user/meta says "+columns+" — verify");
  if(!dx.docxOk) review.push("document.xml not extracted — run chunk-01 xml step");

  const heading = dx.heading || meta.fonts?.heading || null;
  const body    = dx.body    || meta.fonts?.body    || heading;
  const subs={};
  for(const f of dx.fontList) if(SUBS[f]) subs[f]=SUBS[f];
  if(Object.keys(subs).length) review.push("non-web fonts present, metric-compatible substitutes: "+JSON.stringify(subs));

  const design={
    id, truthVersion:2, extractedAt:new Date().toISOString(),
    sources:{ png: png?("preview-resume-1p-a4.png ("+png.w+"x"+png.h+")"):null, docx:"resume-1p-a4.docx (run-level, styles.xml excluded)" },
    colors:{ accent:R.accent!==null?hex6(R.accent):null, deep:R.deep!==null?hex6(R.deep):null,
             tint:R.tint!==null?hex6(R.tint):null, ink:hex6(R.ink), muted:hex6(R.muted),
             rule:R.tint!==null?hex6(R.tint):hex6(R.ink), page:"#FFFFFF" },
    accentSource:R.src,
    fonts:{ heading, body, all:dx.fontList, substitutes:subs },
    typeScale:dx.typeScale, margins:dx.margins, pageSize:dx.pageSize,
    columns, columnsUserConfirmed:true, columnsDetected:dx.columnsDetected,
    columnEvidence:{ clusters:dx.columnClusters, narrowestShapePt:dx.leftWidthPt, textboxes:dx.textboxes },
    photo: !!meta.photo, pages: meta.pages||[1], sizes: meta.sizes||["a4","letter"],
    tier: meta.tier||"unknown", atsScore: meta.atsScore??null,
    previews: meta.previews||{}, confidence:R.confidence, needsReview:review, evidence:R.ev
  };
  wj(path.join(ROOT,"public","templates",id,"design.json"),design);
  out[id]=design;

  md.push("## series "+id+"  ·  "+(meta.tier||"?")+"  ·  columns="+columns+"  ·  photo="+design.photo);
  md.push("");
  md.push("| role | hex | source | confidence |");
  md.push("|---|---|---|---|");
  md.push("| accent | "+(design.colors.accent||"—")+" | "+R.src+" | "+R.confidence.colors+" |");
  md.push("| deep | "+(design.colors.deep||"—")+" | derived | |");
  md.push("| tint | "+(design.colors.tint||"—")+" | derived | |");
  md.push("| ink | "+design.colors.ink+" | | |");
  md.push("| muted | "+design.colors.muted+" | | |");
  md.push("| heading font | "+(heading||"—")+" | docx runs | "+R.confidence.fonts+" |");
  md.push("| body font | "+(body||"—")+" | docx runs | |");
  md.push("");
  md.push("column clusters (pt): "+JSON.stringify(dx.columnClusters)+" → detected="+dx.columnsDetected);
  if(review.length) md.push("review: "+review.join(" | "));
  md.push("");

  html.push('<section><div><img src="../public/templates/'+id+'/preview-resume-1p-a4.png" alt="series '+id+'"></div><div>');
  html.push('<h2>Series '+id+' — '+(meta.tier||"?")+' — '+columns+' column(s)</h2>');
  html.push('<table><tr><th>role</th><th>color</th><th>value</th></tr>');
  for(const k of ["accent","deep","tint","ink","muted"]){
    const v=design.colors[k];
    html.push('<tr><td>'+k+'</td><td><span class="chip" style="background:'+(v||"transparent")+'"></span></td><td>'+(v||"—")+'</td></tr>');
  }
  html.push('</table><p><b>fonts:</b> '+(heading||"?")+' / '+(body||"?")+' &nbsp; <b>accent source:</b> '+R.src+' &nbsp; <b>confidence:</b> '+R.confidence.colors+'</p>');
  if(R.ev.pngTop){ html.push('<p><b>top pixel colors:</b> '+R.ev.pngTop.slice(0,6).map(r=>'<span class="chip" style="background:'+r.hex+'"></span>'+r.hex+' ('+r.px+'px, fill '+r.fill+')').join(" &nbsp; ")+'</p>'); }
  if(review.length) html.push('<p style="color:#c05b49"><b>review:</b> '+review.join(" · ")+'</p>');
  html.push('</div></section>');
}

/* aggregate for lib/editor/design-tokens.ts (keys unchanged from C01) */
const aggPath=path.join(ROOT,"lib","template-design.json");
const prev=jread(aggPath);
if(prev) wj(path.join(ROOT,"_farnavi","backups","template-design.before-chunk02.json"),prev);
const agg={ _comment:"GENERATED by CHUNK 02 (PNG pixels + run-level DOCX). READ-ONLY. Never the UI palette." };
for(const id of IDS){ const d=out[id];
  agg[id]={ accent:d.colors.accent, deep:d.colors.deep, tint:d.colors.tint, ink:d.colors.ink,
    muted:d.colors.muted, rule:d.colors.rule, page:d.colors.page,
    heading:d.fonts.heading, body:d.fonts.body, margins:d.margins, pageSize:d.pageSize,
    columns:d.columns, photo:d.photo, typeScale:d.typeScale, confidence:d.confidence, needsReview:d.needsReview };
}
wj(aggPath,agg);
fs.writeFileSync(path.join(ROOT,"_farnavi","SWATCHES.md"),"# FARNAVI — DESIGN TRUTH v2\n\n"+md.join("\n"),"utf8");
fs.writeFileSync(path.join(ROOT,"_farnavi","swatches.html"),html.join("\n"),"utf8");

/* catalog sanity (fixes chunk-01 parse bug: use "= [") */
const cat=read(path.join(ROOT,"lib","template-catalog.ts"))||"";
let ids=[];
try{
  const s=cat.indexOf("export const TEMPLATE_CATALOG");
  const a=cat.indexOf("= [",s)+2;
  let depth=0,end=-1;
  for(let i=a;i<cat.length;i++){ if(cat[i]==="[")depth++; else if(cat[i]==="]"){depth--; if(!depth){end=i;break;}} }
  ids=JSON.parse(cat.slice(a,end+1)).map(x=>x.id);
}catch(e){ ids=["PARSE FAILED: "+e.message]; }
const L=["# CHUNK 02 — TRUTH REPORT","",
 "catalog ids (fixed parser): "+ids.join(", "),"",
 "| series | accent | source | conf | heading | body | cols | detected | review |",
 "|---|---|---|---|---|---|---|---|---|"];
for(const id of IDS){ const d=out[id];
  L.push("| "+id+" | "+(d.colors.accent||"—")+" | "+d.accentSource+" | "+d.confidence.colors+" | "+(d.fonts.heading||"—")+" | "+(d.fonts.body||"—")+" | "+d.columns+" | "+d.columnsDetected+" | "+d.needsReview.length+" |");
}
L.push("","Open _farnavi/swatches.html in a browser to verify visually.","");
fs.writeFileSync(path.join(ROOT,"_farnavi","TRUTH-02.md"),L.join("\n"),"utf8");
console.log("[truth] design.json v2 x"+IDS.length+", template-design.json, SWATCHES.md, swatches.html, TRUTH-02.md");
console.log("[truth] catalog ids: "+ids.join(", "));
for(const id of IDS) console.log("  series "+id+": accent="+out[id].colors.accent+" src="+out[id].accentSource+" conf="+out[id].confidence.colors+" cols="+out[id].columns);