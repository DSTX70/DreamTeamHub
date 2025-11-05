// Simple seed script for current schema
import { db } from "../db";
import { brands, knowledgeLinks } from "@shared/schema";

async function seedBrands() {
  console.log("Seeding brands...");
  
  const imaginationBrands = [
    { name: "dreamshitter.com", slug: "dreamshitter", businessUnit: "IMAGINATION", products: 12, projects: 4, dueThisWeek: 3 },
    { name: "OUAS (Children's Books)", slug: "ouas", businessUnit: "IMAGINATION", products: 6, projects: 5, dueThisWeek: 2 },
    { name: "SparkBooks (Adult)", slug: "sparkbooks", businessUnit: "IMAGINATION", products: 10, projects: 3, dueThisWeek: 1 },
    { name: "Studio DS Creative", slug: "studio-ds", businessUnit: "IMAGINATION", products: 1, projects: 1, dueThisWeek: 0 },
    { name: "Live Stage Projects", slug: "live-stage", businessUnit: "IMAGINATION", products: 1, projects: 2, dueThisWeek: 1 },
    { name: "TV/Film Projects", slug: "tv-film", businessUnit: "IMAGINATION", products: 0, projects: 1, dueThisWeek: 0 },
    { name: "Business Projects", slug: "business-projects", businessUnit: "IMAGINATION", products: 0, projects: 2, dueThisWeek: 0 },
    { name: "Memoirs of a Geisha (MOAG)", slug: "moag", businessUnit: "IMAGINATION", products: 0, projects: 1, dueThisWeek: 0 },
  ];

  const innovationBrands = [
    { name: "Dream Team Hub", slug: "dream-team-hub", businessUnit: "INNOVATION", products: 5, projects: 8, dueThisWeek: 2 },
    { name: "SymbiosoAi", slug: "symbiosoai", businessUnit: "INNOVATION", products: 3, projects: 4, dueThisWeek: 1 },
    { name: "iCadence", slug: "icadence", businessUnit: "INNOVATION", products: 2, projects: 3, dueThisWeek: 0 },
    { name: "Parallax Translate", slug: "parallax-translate", businessUnit: "INNOVATION", products: 1, projects: 2, dueThisWeek: 1 },
    { name: "Gigster Garage", slug: "gigster-garage", businessUnit: "INNOVATION", products: 0, projects: 1, dueThisWeek: 0 },
  ];

  const impactBrands = [
    { name: "Fab Card Co.", slug: "fab-card-co", businessUnit: "IMPACT", products: 5, projects: 3, dueThisWeek: 1 },
    { name: "The Fabulous Brand Company", slug: "fabulous-brand", businessUnit: "IMPACT", products: 2, projects: 4, dueThisWeek: 2 },
    { name: "GlobalCollabs", slug: "globalcollabs", businessUnit: "IMPACT", products: 1, projects: 2, dueThisWeek: 0 },
  ];

  const allBrands = [...imaginationBrands, ...innovationBrands, ...impactBrands];
  
  for (const brand of allBrands) {
    await db.insert(brands).values(brand).onConflictDoNothing();
  }
  
  console.log(`✓ Seeded ${allBrands.length} brands`);
}

async function seedKnowledgeLinks() {
  console.log("Seeding knowledge links...");
  
  const links = [
    { label: "IMAGINATION — Knowledge Base (Read)", role: "read", businessUnit: "IMAGINATION", driveFolderId: "FOLDER_READ_IMG_123" },
    { label: "IMAGINATION — Drafts (Write)", role: "draft", businessUnit: "IMAGINATION", driveFolderId: "FOLDER_DRAFT_IMG_123" },
    { label: "IMAGINATION — Publish (Gated)", role: "publish", businessUnit: "IMAGINATION", driveFolderId: "FOLDER_PUBLISH_IMG_123" },
    { label: "INNOVATION — Knowledge Base (Read)", role: "read", businessUnit: "INNOVATION", driveFolderId: "FOLDER_READ_INN_123" },
    { label: "INNOVATION — Drafts (Write)", role: "draft", businessUnit: "INNOVATION", driveFolderId: "FOLDER_DRAFT_INN_123" },
    { label: "INNOVATION — Publish (Gated)", role: "publish", businessUnit: "INNOVATION", driveFolderId: "FOLDER_PUBLISH_INN_123" },
    { label: "IMPACT — Knowledge Base (Read)", role: "read", businessUnit: "IMPACT", driveFolderId: "FOLDER_READ_IMP_123" },
    { label: "IMPACT — Drafts (Write)", role: "draft", businessUnit: "IMPACT", driveFolderId: "FOLDER_DRAFT_IMP_123" },
    { label: "IMPACT — Publish (Gated)", role: "publish", businessUnit: "IMPACT", driveFolderId: "FOLDER_PUBLISH_IMP_123" },
  ];

  for (const link of links) {
    await db.insert(knowledgeLinks).values(link).onConflictDoNothing();
  }
  
  console.log(`✓ Seeded ${links.length} knowledge links`);
}

async function main() {
  try {
    await seedBrands();
    await seedKnowledgeLinks();
    console.log("\n✅ All seeds completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
  process.exit(0);
}

main();
