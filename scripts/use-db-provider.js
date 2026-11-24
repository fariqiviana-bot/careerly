const fs = require("fs");
const mode = process.argv[2];
if (!["sqlite", "postgresql"].includes(mode)) {
  console.error("Usage: node scripts/use-db-provider.js <sqlite|postgresql>");
  process.exit(1);
}
const src = fs.readFileSync("prisma/schema.prisma", "utf8");
const updated = src.replace(/provider\s*=\s*"(sqlite|postgresql)"/, `provider = "${mode}"`);
fs.writeFileSync("prisma/schema.prisma", updated, "utf8");
console.log(`Switched prisma/schema.prisma datasource provider -> ${mode}`);