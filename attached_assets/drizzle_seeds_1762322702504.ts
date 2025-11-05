// drizzle/seeds.ts
// Seed company and 3 Business Units. Run once in a scripts/seeds step.

import { db } from "./db"; // your drizzle db instance
import { company, businessUnit } from "./schema";
import { eq } from "drizzle-orm";

async function ensureCompany(name: string) {
  const existing = await db.select().from(company).where(eq(company.name, name));
  if (existing.length) return existing[0];
  const [row] = await db.insert(company).values({ name }).returning();
  return row;
}

async function ensureBU(companyId: string, name: string, slug: string) {
  const existing = await db.select().from(businessUnit).where(eq(businessUnit.slug, slug));
  if (existing.length) return existing[0];
  const [row] = await db.insert(businessUnit).values({ companyId, name, slug }).returning();
  return row;
}

export async function runSeeds() {
  const co = await ensureCompany("i³ Collective");
  await ensureBU(co.id, "IMAGINATION", "imagination");
  await ensureBU(co.id, "INNOVATION", "innovation");
  await ensureBU(co.id, "IMPACT", "impact");
  console.log("Seeds complete: company + 3 BUs");
}

// If called directly (node drizzle/seeds.ts)
if (require.main === module) {
  runSeeds().then(()=>process.exit(0)).catch(e=>{ console.error(e); process.exit(1); });
}
