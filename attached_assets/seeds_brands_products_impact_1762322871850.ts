// seeds_brands_products_impact.ts
// Seeds IMPACT Business Unit brands + key product lines.
// Usage: ts-node seeds_brands_products_impact.ts
// Prereqs: run drizzle_seeds.ts first to create company + IMPACT BU.

import { db } from "./drizzle/db"; // your initialized drizzle db
import { businessUnit, brand, product } from "./drizzle/schema";
import { eq } from "drizzle-orm";

type SeedProduct = { name: string; type?: string; slug: string };
type SeedBrand = { name: string; slug: string; products?: SeedProduct[] };

const impactBrands: SeedBrand[] = [
  { 
    name: "Fab Card Co.", 
    slug: "fab-card-co", 
    products: [
      { name: "ColorCue", slug: "colorcue", type: "card-line" },
      { name: "HeartScript", slug: "heartscript", type: "card-line" },
      { name: "Midnight Express", slug: "midnight-express", type: "card-line" },
      { name: "The Remix Collection", slug: "the-remix-collection", type: "card-line" },
      { name: "Out Loud", slug: "out-loud", type: "card-line" },
    ]
  },
  { name: "The Fabulous Brand Company", slug: "the-fabulous-brand-company", products: [] },
  { name: "GlobalCollabs", slug: "globalcollabs", products: [] },
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

export async function runImpactSeeds() {
  const bu = await db.select().from(businessUnit).where(eq(businessUnit.slug, "impact"));
  if (!bu.length) throw new Error("IMPACT BU not found. Run drizzle_seeds.ts first.");
  const buId = bu[0].id as string;

  for (const b of impactBrands) {
    const bRow = await ensureBrand(buId, b);
    for (const p of (b.products ?? [])) {
      await ensureProduct(bRow.id as string, p);
    }
  }
  console.log("IMPACT brands/products seeded.");
}

if (require.main === module) {
  runImpactSeeds()
    .then(()=>process.exit(0))
    .catch(err=>{ console.error(err); process.exit(1); });
}
