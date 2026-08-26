import { PrismaClient } from "@prisma/client";
import fs from "node:fs";

const p = new PrismaClient();
const n = await p.session.count();
const shops = await p.session.findMany({
  select: { id: true, shop: true, isOnline: true },
});
console.log(JSON.stringify({ sessionCount: n, shops }, null, 2));
await p.$disconnect();

for (const f of ["prisma/dev.sqlite", "dev.sqlite"]) {
  if (fs.existsSync(f)) {
    console.log("db file", f, fs.statSync(f).size);
  }
}
