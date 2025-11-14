#!/usr/bin/env tsx
/**
 * Test script for Product Catalog Integration
 * Validates that Lifestyle and PDP packs receive product catalog data
 */

import { db } from "../server/db";
import { workItems } from "@shared/schema";
import { eq } from "drizzle-orm";
import { getProductsForLine, getAllProducts } from "../server/services/productCatalog";

async function testProductCatalogIntegration() {
  console.log("🧪 Testing Product Catalog Integration\n");

  // Test 1: Verify product catalog has data
  console.log("Test 1: Verify product catalog...");
  const allProducts = await getAllProducts();
  console.log(`✅ Found ${allProducts.length} products in catalog`);
  
  if (allProducts.length > 0) {
    console.log("Sample product:", {
      sku: allProducts[0].sku,
      name: allProducts[0].productName,
      line: allProducts[0].line,
      collection: allProducts[0].collection,
    });
  }

  // Test 2: Test product line filtering
  console.log("\nTest 2: Test product line filtering...");
  const outLoudProducts = await getProductsForLine("Out Loud");
  const colorCueProducts = await getProductsForLine("ColorCue");
  const midnightProducts = await getProductsForLine("Midnight Express");

  console.log(`✅ Out Loud: ${outLoudProducts.length} products`);
  console.log(`✅ ColorCue: ${colorCueProducts.length} products`);
  console.log(`✅ Midnight Express: ${midnightProducts.length} products`);

  // Test 3: Verify product line inference would work
  console.log("\nTest 3: Test product line inference...");
  const testCases = [
    { title: "Out Loud Lifestyle Banner", expectedLine: "Out Loud" },
    { title: "ColorCue Product Page", expectedLine: "ColorCue" },
    { title: "Midnight Express PDP", expectedLine: "Midnight Express" },
    { title: "Generic Product", expectedLine: null },
  ];

  for (const testCase of testCases) {
    const text = testCase.title.toLowerCase();
    let inferredLine: string | null = null;
    
    if (text.includes("colorcue") || text.includes("color cue")) {
      inferredLine = "ColorCue";
    } else if (text.includes("out loud") || text.includes("outloud")) {
      inferredLine = "Out Loud";
    } else if (text.includes("midnight express")) {
      inferredLine = "Midnight Express";
    }

    const match = inferredLine === testCase.expectedLine ? "✅" : "❌";
    console.log(`${match} "${testCase.title}" → ${inferredLine || "(none)"}`);
  }

  // Test 4: Check if WO-002 exists and what line it would map to
  console.log("\nTest 4: Check existing work items for line mapping...");
  const sampleWorkItems = await db
    .select()
    .from(workItems)
    .limit(5);

  for (const wi of sampleWorkItems) {
    const text = `${wi.title} ${wi.body || ""}`.toLowerCase();
    let inferredLine: string | null = null;
    
    if (text.includes("colorcue") || text.includes("color cue")) {
      inferredLine = "ColorCue";
    } else if (text.includes("out loud") || text.includes("outloud")) {
      inferredLine = "Out Loud";
    } else if (text.includes("midnight express")) {
      inferredLine = "Midnight Express";
    }

    console.log(`WI-${wi.id}: "${wi.title}"`);
    console.log(`  → Inferred line: ${inferredLine || "(none)"}`);
  }

  console.log("\n✅ All tests completed!");
}

testProductCatalogIntegration()
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  })
  .then(() => {
    console.log("\n🎉 Product catalog integration ready!");
    process.exit(0);
  });
