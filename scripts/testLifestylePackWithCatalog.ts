#!/usr/bin/env tsx
/**
 * End-to-end test: Create work item and generate Lifestyle Pack with catalog
 * Validates that SKUs from the catalog are used in the generated pack
 */

import { db } from "../server/db";
import { workItems, workItemPacks } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { runSkill } from "../server/ai/runSkill";
import { getProductsForLine } from "../server/services/productCatalog";
import { LifestylePackSchema } from "../server/ai/schemas/lifestylePack";

async function testLifestylePackWithCatalog() {
  console.log("🧪 Testing Lifestyle Pack Generation with Product Catalog\n");

  // Step 1: Create a test work item for Out Loud
  console.log("Step 1: Creating test work item...");
  const [testWorkItem] = await db
    .insert(workItems)
    .values({
      title: "Out Loud Pride Collection Lifestyle Hero Banners",
      body: "Generate lifestyle banner shot boards for the Out Loud Pride collection. Focus on authentic queer celebration, natural settings, and inclusive casting. We need hero banners for desktop, tablet, and mobile showcasing our Pride greeting cards in real-life scenarios.",
      notes: "Brand: Fab Card Co | Collection: Out Loud | Vibe: Bold, inclusive, authentic",
      status: "in_progress",
      workflowState: "active",
      priority: "medium",
      tags: ["lifestyle", "photography", "out-loud"],
    })
    .returning();

  console.log(`✅ Created work item WI-${testWorkItem.id}: "${testWorkItem.title}"`);

  // Step 2: Fetch Out Loud products from catalog
  console.log("\nStep 2: Fetching Out Loud products from catalog...");
  const outLoudProducts = await getProductsForLine("Out Loud");
  console.log(`✅ Found ${outLoudProducts.length} Out Loud products:`);
  outLoudProducts.forEach((p) => {
    console.log(`   - ${p.sku}: ${p.productName}`);
  });

  // Step 3: Prepare products array for LLM
  const productsForLLM = outLoudProducts.map((p) => ({
    sku: p.sku,
    line: p.line,
    collection: p.collection,
    series: p.series,
    product_name: p.productName,
    variant_name: p.variantName,
    brand_slug: p.brandSlug,
    url_slug: p.urlSlug,
  }));

  // Step 4: Generate Lifestyle Pack using the skill
  console.log("\nStep 3: Generating Lifestyle Pack with catalog injection...");
  const packData = await runSkill({
    skillName: "generateLifestyleBannerPack",
    input: {
      work_item_id: testWorkItem.id.toString(),
      work_item_title: testWorkItem.title,
      work_item_body: testWorkItem.body || "",
      work_item_notes: testWorkItem.notes || "",
      products: productsForLLM,
    },
  });

  console.log(`✅ LLM returned pack data`);

  // Step 5: Validate against schema
  console.log("\nStep 4: Validating pack against schema...");
  const validated = LifestylePackSchema.parse(packData);
  console.log(`✅ Pack validated successfully`);

  // Step 6: Analyze SKU usage
  console.log("\nStep 5: Analyzing SKU usage...");
  const catalogSKUs = new Set(outLoudProducts.map((p) => p.sku));
  const shotBoards = validated.shot_boards || [];
  
  console.log(`Generated ${shotBoards.length} shot board(s):`);
  let allSKUsValid = true;

  for (const shot of shotBoards) {
    const isValid = catalogSKUs.has(shot.sku);
    const icon = isValid ? "✅" : "❌";
    console.log(`${icon} ${shot.shot_id}: ${shot.card_title} (SKU: ${shot.sku})`);
    
    if (!isValid) {
      console.log(`   ⚠️  WARNING: SKU ${shot.sku} not found in catalog!`);
      allSKUsValid = false;
    }
  }

  // Step 7: Save pack to database
  console.log("\nStep 6: Saving pack to database...");
  const [savedPack] = await db
    .insert(workItemPacks)
    .values({
      workItemId: testWorkItem.id,
      packType: "lifestyle",
      packData: validated as any,
      version: 1,
      createdAt: new Date(),
    })
    .returning();

  console.log(`✅ Saved pack version ${savedPack.version} for WI-${testWorkItem.id}`);

  // Final summary
  console.log("\n" + "=".repeat(60));
  if (allSKUsValid) {
    console.log("✅ SUCCESS: All SKUs are from the product catalog!");
    console.log("✅ Product catalog integration working correctly!");
  } else {
    console.log("❌ FAILURE: Some SKUs are not from the catalog");
    console.log("   This indicates the LLM is still inventing SKUs");
  }
  console.log("=".repeat(60));

  return { workItemId: testWorkItem.id, allSKUsValid };
}

testLifestylePackWithCatalog()
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  })
  .then(({ workItemId, allSKUsValid }) => {
    console.log(`\n📝 Test work item: WI-${workItemId}`);
    process.exit(allSKUsValid ? 0 : 1);
  });
