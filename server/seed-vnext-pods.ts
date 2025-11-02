import { db } from "./db";
import { pods, podAgents } from "../shared/schema";
import fs from "fs";
import path from "path";

interface ManifestPod {
  name: string;
  pillar: string;
  autonomy: string;
  starter_roles: string[];
}

interface Manifest {
  version: string;
  pods: ManifestPod[];
}

async function seedVNextPods() {
  try {
    console.log("🌱 Seeding vNext 2025Q4 pods...");

    // Read the manifest
    const manifestPath = path.join(process.cwd(), "attached_assets", "vNext_2025Q4", "handoff_manifest.json");
    const manifestData = fs.readFileSync(manifestPath, "utf-8");
    const manifest: Manifest = JSON.parse(manifestData);

    console.log(`📦 Found ${manifest.pods.length} pods in manifest`);

    let podsCreated = 0;
    let agentsCreated = 0;

    for (const podData of manifest.pods) {
      console.log(`\n  Creating pod: ${podData.name} (${podData.pillar})`);

      // Insert pod
      const [newPod] = await db
        .insert(pods)
        .values({
          name: podData.name,
          pillar: podData.pillar,
          autonomyLevel: podData.autonomy,
          type: "New",
          priority: "High",
          version: manifest.version,
        })
        .onConflictDoUpdate({
          target: pods.name,
          set: {
            pillar: podData.pillar,
            autonomyLevel: podData.autonomy,
            type: "New",
            priority: "High",
            version: manifest.version,
          },
        })
        .returning();

      podsCreated++;
      console.log(`    ✓ Pod created: ID ${newPod.id}`);

      // Insert starter roles/agents
      for (const roleTitle of podData.starter_roles) {
        // Extract autonomy level from role title (e.g., "Impact Programs Lead (L2)" -> "L2")
        const autonomyMatch = roleTitle.match(/\(L(\d)\)/);
        const autonomyLevel = autonomyMatch ? `L${autonomyMatch[1]}` : podData.autonomy;
        const cleanTitle = roleTitle.replace(/\s*\(L\d\)/, "");

        await db.insert(podAgents).values({
          title: cleanTitle,
          autonomyLevel: autonomyLevel,
          podId: newPod.id,
          status: "active",
        });

        agentsCreated++;
        console.log(`    ✓ Agent: ${cleanTitle} (${autonomyLevel})`);
      }
    }

    console.log("\n✅ Seeding complete!");
    console.log(`   Pods created/updated: ${podsCreated}`);
    console.log(`   Agents created: ${agentsCreated}`);
  } catch (error) {
    console.error("❌ Error seeding pods:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedVNextPods()
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed:", error);
      process.exit(1);
    });
}

export { seedVNextPods };
