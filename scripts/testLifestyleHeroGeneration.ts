import { db } from "../server/db";
import { workItemPacks } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

console.log("🧪 Testing Lifestyle Hero Generation Endpoint\n");

async function testLifestyleHeroGeneration() {
  try {
    // Find a work item with a Lifestyle Pack
    const packs = await db
      .select()
      .from(workItemPacks)
      .where(eq(workItemPacks.packType, "lifestyle"))
      .orderBy(desc(workItemPacks.createdAt))
      .limit(1);

    if (packs.length === 0) {
      console.log("❌ No Lifestyle Packs found in database");
      console.log("💡 Tip: Generate a Lifestyle Pack first using an existing work item");
      return;
    }

    const pack = packs[0];
    console.log(`✅ Found Lifestyle Pack for Work Item ${pack.workItemId}`);
    console.log(`   Version: ${pack.version}`);
    console.log(`   Created: ${pack.createdAt}`);

    const packData = pack.packData as any;
    if (packData.shot_boards && packData.export_plan) {
      console.log(`   Shot boards: ${packData.shot_boards.length}`);
      console.log(`   Export plan entries: ${packData.export_plan.length}`);
      
      console.log("\n📋 Shot boards:");
      packData.shot_boards.forEach((shot: any) => {
        console.log(`   - ${shot.shot_id}: ${shot.card_title} (${shot.sku})`);
      });
      
      console.log("\n📋 Export plan:");
      packData.export_plan.forEach((entry: any) => {
        console.log(`   - ${entry.shot_id} ${entry.size_label}: ${entry.width}x${entry.height} → ${entry.filename}`);
      });
    }

    console.log("\n🧪 Testing endpoint with dry run...");
    console.log(`POST /api/work-items/${pack.workItemId}/generate-lifestyle-heroes`);
    console.log(`Body: { "dryRun": true }`);
    console.log("\n⚠️  Note: This endpoint requires authentication and proper RBAC roles (ops_admin, design_pod, or admin)");
    console.log("🔧 To test manually:");
    console.log(`   curl -X POST http://localhost:5000/api/work-items/${pack.workItemId}/generate-lifestyle-heroes \\`);
    console.log(`        -H "Content-Type: application/json" \\`);
    console.log(`        -H "Authorization: Bearer YOUR_API_TOKEN" \\`);
    console.log(`        -d '{"dryRun": true}'`);
    
    console.log("\n✅ Test script completed successfully");
    console.log(`📝 Work Item ID for testing: ${pack.workItemId}`);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testLifestyleHeroGeneration();
