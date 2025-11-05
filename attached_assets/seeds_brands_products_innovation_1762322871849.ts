// seeds_brands_products_innovation.ts
// Seeds INNOVATION Business Unit brands (+ optional products placeholders).
// Usage: ts-node seeds_brands_products_innovation.ts
// Prereqs: run drizzle_seeds.ts first to create company + INNOVATION BU.

import { db } from "./drizzle/db"; // your initialized drizzle db
import { businessUnit, brand, product } from "./drizzle/schema";
import { eq } from "drizzle-orm";

type SeedProduct = { name: string; type?: string; slug: string };
type SeedBrand = { name: string; slug: string; products?: SeedProduct[] };

const innovationBrands: SeedBrand[] = [
  { name: "Dream Team Hub", slug: "dream-team-hub", products: [] },
  { name: "SymbiosoAi", slug: "symbiosoai", products: [] },
  { name: "iCadence", slug: "icadence", products: [] },
  { name: "Parallax Translate", slug: "parallax-translate", products: [] },
  { name: "Gigster Garage", slug: "gigster-garage", products: [] },
  { name: "Creator Command Center", slug: "creator-command-center", products: [] },
  { name: "Think Tank Ai", slug: "think-tank-ai", products: [] },
  { name: "vSuite HQ", slug: "vsuite-hq", products: [] },
  { name: "MindOrchestra", slug: "mindorchestra", products: [] },
  { name: "Patent A–E", slug: "patent-a-e", products: [] },
  { name: "GOA Patent", slug: "goa-patent", products: [] },
  { name: "IfWhenAlways", slug: "ifwhenalways", products: [] },
  { name: "Artistic Notations", slug: "artistic-notations", products: [] },
  { name: "RFP/Proposal System", slug: "rfp-proposal-system", products: [] },
  { name: "Loyalty Rewards Program", slug: "loyalty-rewards-program", products: [] },
  { name: "Live Stage Ai / LiveCanvasAi", slug: "live-stage-ai-livecanvasai", products: [] },
];

async function ensureBrand(buId: string, b: SeedBrand) {
  const existing = await db.select().from(brand).where(eq(brand.slug, b.slug));
  if (existing.length) return existing[0];
  const [row] = await db.insert(brand).values({ buId, name: b.name, slug: b.slug }).returning();
  return row;
}

async function ensureProduct(brandId: string, p: SeedProduct) {
  const existing = await db.select().from(product).where(eq(product.slug, p.slug));
  if (existing.length) return existing[0];
  const [row] = await db.insert(product).values({ brandId, name: p.name, type: p.type ?? null, slug: p.slug }).returning();
  return row;
}

export async function runInnovationSeeds() {
  const bu = await db.select().from(businessUnit).where(eq(businessUnit.slug, "innovation"));
  if (!bu.length) throw new Error("INNOVATION BU not found. Run drizzle_seeds.ts first.");
  const buId = bu[0].id as string;

  for (const b of innovationBrands) {
    const bRow = await ensureBrand(buId, b);
    for (const p of (b.products ?? [])) {
      await ensureProduct(bRow.id as string, p);
    }
  }
  console.log("INNOVATION brands/products seeded.");
}

if (require.main === module) {
  runInnovationSeeds()
    .then(()=>process.exit(0))
    .catch(err=>{ console.error(err); process.exit(1); });
}
