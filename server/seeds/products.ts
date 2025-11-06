import { db } from "../db";
import { products, type InsertProduct } from "@shared/schema";

const sampleProducts: InsertProduct[] = [
  // IMAGINATION brands
  { name: "DS Creative Suite", brandId: 1, status: "active", description: "Complete creative content management" },
  { name: "DS Brand Kit", brandId: 1, status: "active", description: "Brand identity toolkit" },
  
  { name: "OUAS Platform", brandId: 2, status: "active", description: "Personalized universe authoring" },
  { name: "OUAS Mobile App", brandId: 2, status: "active", description: "Mobile companion app" },
  
  { name: "SparkBooks Reader", brandId: 3, status: "active", description: "Digital reading platform" },
  { name: "SparkBooks Creator", brandId: 3, status: "active", description: "Book authoring tools" },
  
  // INNOVATION brands
  { name: "DTH Platform", brandId: 9, status: "active", description: "Multi-pod orchestration dashboard" },
  { name: "DTH API", brandId: 9, status: "active", description: "REST API for integrations" },
  
  { name: "SymbiosoAi Core", brandId: 10, status: "active", description: "AI collaboration engine" },
  { name: "SymbiosoAi Studio", brandId: 10, status: "active", description: "Development environment" },
  
  { name: "iCadence Pro", brandId: 11, status: "active", description: "Professional project management" },
  { name: "iCadence Teams", brandId: 11, status: "active", description: "Team collaboration features" },
  
  // IMPACT brands
  { name: "Fab Card Creator", brandId: 14, status: "active", description: "Custom card design tool" },
  { name: "Fab Card Shop", brandId: 14, status: "active", description: "E-commerce platform" },
  
  { name: "Fabulous Brand Studio", brandId: 15, status: "active", description: "Brand strategy platform" },
  { name: "Fabulous Assets", brandId: 15, status: "active", description: "Brand asset library" },
];

export async function seedProducts() {
  console.log("Seeding products...");
  
  for (const product of sampleProducts) {
    await db.insert(products).values(product).onConflictDoNothing();
  }
  
  console.log(`✓ Seeded ${sampleProducts.length} products`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await seedProducts();
  process.exit(0);
}
