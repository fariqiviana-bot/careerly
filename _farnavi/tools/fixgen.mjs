import fs from "node:fs";
import path from "node:path";
const p = path.join(process.cwd(), "_farnavi", "tools", "truth3.mjs");
if (!fs.existsSync(p)) { console.log("truth3.mjs MISSING"); process.exit(0); }
let s = fs.readFileSync(p, "utf8");
const n0 = s.length;
const bad = (s.match(/[^\x00-\x7F]/g) || []).length;
s = s.replace(/[^\x00-\x7F]/g, "-");
const i = s.indexOf('const L=["# CHUNK 03');
if (i > 0) {
  s = s.slice(0, i) + s.slice(i).replace(/\bL\b/g, "RPT");
  console.log("renamed duplicate L -> RPT at offset " + i);
} else if (s.indexOf("const RPT=[") >= 0) {
  console.log("duplicate L already fixed");
} else {
  console.log("WARNING: report array not found - send this line back");
}
fs.writeFileSync(p, s, "utf8");
console.log("non-ascii replaced: " + bad + " | bytes " + n0 + " -> " + s.length);