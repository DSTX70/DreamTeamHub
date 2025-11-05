// seeds_brands_products.ts
// Seeds IMAGINATION Business Unit brands + products to speed up BU pages.
// Usage: ts-node seeds_brands_products.ts
// Prereqs: run drizzle_seeds.ts first to create company + IMAGINATION BU.

import { db } from "./drizzle/db"; // your initialized drizzle db
import { businessUnit, brand, product } from "./drizzle/schema";
import { eq } from "drizzle-orm";

type SeedProduct = { name: string; type?: string; slug: string };
type SeedBrand = { name: string; slug: string; products?: SeedProduct[] };

// -------- IMAGINATION catalog (from your spec) --------
const imaginationBrands: SeedBrand[] = [
  { name: "dreamshitter.com", slug: "dreamshitter", products: [] },

  {
    name: "OUAS (Children’s Books Publishing)",
    slug: "ouas",
    products: [
      // Standalone titles
      { name: "Holidays Around the World", slug: "holidays-around-the-world", type: "children-book" },
      { name: "Spencer Goes to the Park", slug: "spencer-goes-to-the-park", type: "children-book" },

      // Series parent noted in type for clarity
      { name: "Glitter and Doodot’s Grand Adventure", slug: "glitter-and-doodots-grand-adventure", type: "series" },
      { name: "Little Bear Blue", slug: "little-bear-blue", type: "children-book" },

      // The League of Virtues series
      { name: "The League of Virtues — In the Beginning", slug: "league-of-virtues-in-the-beginning", type: "series-book" },
      { name: "The League of Virtues — The Mirror Pond", slug: "league-of-virtues-the-mirror-pond", type: "series-book" },
    ],
  },

  {
    name: "SparkBooks (Adult - Personal Growth)",
    slug: "sparkbooks",
    products: [
      { name: "God Unbranded", slug: "god-unbranded", type: "adult-book" },
      { name: "Intelligent Event Design", slug: "intelligent-event-design", type: "adult-book" },
      { name: "From Here to Fabulous", slug: "from-here-to-fabulous", type: "adult-book" },
      { name: "Social Wisdom", slug: "social-wisdom", type: "adult-book" },
      { name: "Queer Words", slug: "queer-words", type: "adult-book" },
      { name: "Mary, According to the Gospel", slug: "mary-according-to-the-gospel", type: "adult-book" },
      { name: "Dear God, I’m an Asshole", slug: "dear-god-im-an-asshole", type: "adult-book" },
      { name: "Gaijin, Haole, Foreigner", slug: "gaijin-haole-foreigner", type: "adult-book" },
      { name: "Holidays Adult Book", slug: "holidays-adult-book", type: "adult-book" },
      { name: "New Book Ideas", slug: "new-book-ideas", type: "pipeline" },
    ],
  },

  {
    name: "Studio DS Creative (Music)",
    slug: "studio-ds-creative",
    products: [
      { name: "Paper Saints and Street Lights", slug: "paper-saints-and-street-lights", type: "music-project" },
    ],
  },

  { name: "Live Stage Projects", slug: "live-stage-projects", products: [
      { name: "Art of Alchemy", slug: "art-of-alchemy", type: "live-stage" },
    ]
  },

  { name: "TV/Film Projects", slug: "tv-film-projects", products: [] },
  { name: "Business Projects", slug: "business-projects", products: [] },
  { name: "Memoirs of a Geisha (MOAG)", slug: "moag", products: [] },
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

export async function runImaginationSeeds() {
  // Grab the IMAGINATION BU
  const bu = await db.select().from(businessUnit).where(eq(businessUnit.slug, "imagination"));
  if (!bu.length) throw new Error("IMAGINATION BU not found. Run drizzle_seeds.ts first.");
  const buId = bu[0].id as string;

  for (const b of imaginationBrands) {
    const bRow = await ensureBrand(buId, b);
    for (const p of (b.products ?? [])) {
      await ensureProduct(bRow.id as string, p);
    }
  }

  console.log("IMAGINATION brands/products seeded.");
}

// If called directly: ts-node seeds_brands_products.ts
if (require.main === module) {
  runImaginationSeeds()
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1); });
}
