import { db } from "../db";
import { brands, products, projects, type InsertBrand, type InsertProduct } from "@shared/schema";
import { eq } from "drizzle-orm";

// i³ Collective Brand and Product Data
const i3Brands: InsertBrand[] = [
  // IMAGINATION Business Unit
  { name: "dreamshitter.com", slug: "dreamshitter", businessUnit: "IMAGINATION", products: 0, projects: 0, dueThisWeek: 0, description: "Music production and creative content" },
  { name: "OUAS (Children's Books)", slug: "ouas", businessUnit: "IMAGINATION", products: 0, projects: 0, dueThisWeek: 0, description: "Children's book publishing" },
  { name: "SparkBooks (Adult)", slug: "sparkbooks-adult", businessUnit: "IMAGINATION", products: 0, projects: 0, dueThisWeek: 0, description: "Personal growth and spiritual development books" },
  { name: "Studio DS Creative", slug: "studio-ds-creative", businessUnit: "IMAGINATION", products: 0, projects: 0, dueThisWeek: 0, description: "Music, TV/Film, and live stage production" },
  { name: "Business Projects", slug: "business-projects", businessUnit: "IMAGINATION", products: 0, projects: 0, dueThisWeek: 0, description: "Business development initiatives" },
  { name: "Memoirs of a Geisha (MOAG)", slug: "moag", businessUnit: "IMAGINATION", products: 0, projects: 0, dueThisWeek: 0, description: "Special project" },

  // INNOVATION Business Unit
  { name: "Dream Team Hub", slug: "dream-team-hub", businessUnit: "INNOVATION", products: 0, projects: 0, dueThisWeek: 0, description: "Multi-pod orchestration platform" },
  { name: "SymbiosoAi", slug: "symbiosoai", businessUnit: "INNOVATION", products: 0, projects: 0, dueThisWeek: 0, description: "AI collaboration platform" },
  { name: "iCadence", slug: "icadence", businessUnit: "INNOVATION", products: 0, projects: 0, dueThisWeek: 0, description: "Project management system" },
  { name: "Parallax Translate", slug: "parallax-translate", businessUnit: "INNOVATION", products: 0, projects: 0, dueThisWeek: 0, description: "Translation services" },
  { name: "Gigster Garage", slug: "gigster-garage", businessUnit: "INNOVATION", products: 0, projects: 0, dueThisWeek: 0, description: "Freelancer platform" },
  { name: "Creator Command Center", slug: "creator-command-center", businessUnit: "INNOVATION", products: 0, projects: 0, dueThisWeek: 0, description: "Content creator tools" },
  { name: "Think Tank Ai", slug: "think-tank-ai", businessUnit: "INNOVATION", products: 0, projects: 0, dueThisWeek: 0, description: "AI brainstorming platform" },
  { name: "vSuite HQ", slug: "vsuite-hq", businessUnit: "INNOVATION", products: 0, projects: 0, dueThisWeek: 0, description: "Virtual office suite" },
  { name: "MindOrchestra", slug: "mindorchestra", businessUnit: "INNOVATION", products: 0, projects: 0, dueThisWeek: 0, description: "Creative orchestration tools" },
  { name: "Patent Projects", slug: "patent-projects", businessUnit: "INNOVATION", products: 0, projects: 0, dueThisWeek: 0, description: "Patent applications and IP" },
  { name: "IfWhenAlways", slug: "ifwhenalways", businessUnit: "INNOVATION", products: 0, projects: 0, dueThisWeek: 0, description: "Conditional automation platform" },
  { name: "Artistic Notations", slug: "artistic-notations", businessUnit: "INNOVATION", products: 0, projects: 0, dueThisWeek: 0, description: "Creative documentation system" },
  { name: "RFP/Proposal System", slug: "rfp-proposal-system", businessUnit: "INNOVATION", products: 0, projects: 0, dueThisWeek: 0, description: "Proposal management" },
  { name: "Loyalty Rewards Program", slug: "loyalty-rewards", businessUnit: "INNOVATION", products: 0, projects: 0, dueThisWeek: 0, description: "Customer loyalty platform" },
  { name: "Live Stage Ai", slug: "live-stage-ai", businessUnit: "INNOVATION", products: 0, projects: 0, dueThisWeek: 0, description: "AI-powered live performance tools" },

  // IMPACT Business Unit
  { name: "Fab Card Co.", slug: "fab-card-co", businessUnit: "IMPACT", products: 0, projects: 0, dueThisWeek: 0, description: "Creative greeting cards" },
  { name: "The Fabulous Brand Company", slug: "fabulous-brand", businessUnit: "IMPACT", products: 0, projects: 0, dueThisWeek: 0, description: "Brand strategy and development" },
  { name: "GlobalCollabs", slug: "globalcollabs", businessUnit: "IMPACT", products: 0, projects: 0, dueThisWeek: 0, description: "Global collaboration platform" },
];

const i3Products: Omit<InsertProduct, 'brandId'>[] = [
  // OUAS Children's Books (brandId will be 2)
  { name: "Holidays Around the World", status: "active", description: "Children's book about global holidays" },
  { name: "Spencer Goes to the Park", status: "active", description: "Adventure story for young readers" },
  { name: "Glitter and Doodot's Grand Adventure", status: "active", description: "Magical adventure tale" },
  { name: "Little Bear Blue", status: "active", description: "Heartwarming children's story" },
  { name: "The League of Virtues: In the Beginning", status: "active", description: "Character-building series" },
  { name: "The League of Virtues: The Mirror Pond", status: "active", description: "Virtue-focused adventure" },

  // SparkBooks Adult (brandId will be 3)
  { name: "God Unbranded", status: "active", description: "Spiritual exploration and personal faith" },
  { name: "Intelligent Event Design", status: "active", description: "Event planning methodology" },
  { name: "From Here to Fabulous", status: "active", description: "Personal transformation guide" },
  { name: "Social Wisdom", status: "active", description: "Modern social dynamics" },
  { name: "Queer Words", status: "active", description: "LGBTQ+ perspectives and stories" },
  { name: "Mary, According to the Gospel", status: "active", description: "Biblical perspectives" },
  { name: "Dear God, I'm an Asshole", status: "active", description: "Honest spiritual journey" },
  { name: "Gaijin, Haole, Foreigner", status: "active", description: "Cross-cultural experiences" },
  { name: "Holidays Adult Book", status: "planning", description: "Adult perspective on celebrations" },
  { name: "New Book Ideas", status: "planning", description: "Upcoming publications in development" },

  // Studio DS Creative (brandId will be 4)
  { name: "Paper Saints and Street Lights", status: "active", description: "Music album" },
  { name: "Live Stage Projects", status: "active", description: "Theater and performance productions" },
  { name: "Art of Alchemy", status: "active", description: "Creative transformation projects" },
  { name: "TV/Film Projects", status: "planning", description: "Video and film productions" },
];

export async function seedI3CollectiveData() {
  console.log("🌱 Seeding i³ Collective brands and products...");

  // Insert brands
  const insertedBrands = await db.insert(brands).values(i3Brands).returning();
  console.log(`✓ Seeded ${insertedBrands.length} brands`);

  // Map brand slugs to IDs
  const brandMap = new Map(insertedBrands.map(b => [b.slug, b.id]));

  // Insert products with correct brand associations
  const productsWithBrands: InsertProduct[] = [
    // OUAS Children's Books
    ...i3Products.slice(0, 6).map(p => ({ ...p, brandId: brandMap.get('ouas')! })),
    // SparkBooks Adult
    ...i3Products.slice(6, 16).map(p => ({ ...p, brandId: brandMap.get('sparkbooks-adult')! })),
    // Studio DS Creative
    ...i3Products.slice(16).map(p => ({ ...p, brandId: brandMap.get('studio-ds-creative')! })),
  ];

  await db.insert(products).values(productsWithBrands);
  console.log(`✓ Seeded ${productsWithBrands.length} products`);

  // Update brand product counts
  for (const brand of insertedBrands) {
    const productCount = productsWithBrands.filter(p => p.brandId === brand.id).length;
    if (productCount > 0) {
      await db.update(brands)
        .set({ products: productCount })
        .where(eq(brands.id, brand.id));
    }
  }

  // Update existing projects to link to correct brands
  await db.update(projects)
    .set({ brandId: brandMap.get('dream-team-hub') })
    .where(eq(projects.id, 4));

  console.log("✅ i³ Collective data seeded successfully!");
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await seedI3CollectiveData();
  process.exit(0);
}
