import { db } from "./db";
import { pods, agents } from "../shared/schema";
import fs from "fs";
import path from "path";
import yaml from "yaml";

interface ManifestPod {
  name: string;
  pillar: string;
  purpose: string;
  autonomy: string;
}

interface ManifestAgent {
  id: string;
  title: string;
  podName: string;
  pillar: string;
  autonomy: string;
  status: string;
}

interface Manifest {
  version: string;
  pods: ManifestPod[];
  agents_seed: ManifestAgent[];
}

interface ToolConfig {
  tools: { name: string; scopes: string[] }[];
}

interface EvalConfig {
  schedule?: string;
  threshold?: number;
}

// ID mapping for manifest IDs that don't match folder names
const AGENT_ID_MAPPING: Record<string, string> = {
  // Map the duplicate "no underscores" version to the correct "with underscores" folder
  "agent_packaging_prepress_lead": "agent_packaging_pre_press_lead",
};

function loadSkillPackFiles(manifestId: string) {
  // Normalize the ID using the mapping if needed
  const agentId = AGENT_ID_MAPPING[manifestId] || manifestId;
  const agentPath = path.join(process.cwd(), "agents", agentId);
  
  // Validate that the Skill Pack directory exists
  if (!fs.existsSync(agentPath)) {
    console.warn(`    ❌ Skill Pack folder not found: ${agentPath}`);
    return null; // Return null to indicate missing Skill Pack
  }
  
  try {
    // Read and validate prompt.txt (required)
    const promptPath = path.join(agentPath, "prompt.txt");
    if (!fs.existsSync(promptPath)) {
      console.warn(`    ❌ Missing prompt.txt for ${agentId}`);
      return null;
    }
    const promptText = fs.readFileSync(promptPath, "utf-8");

    // Read tools.yaml (required)
    const toolsPath = path.join(agentPath, "tools.yaml");
    if (!fs.existsSync(toolsPath)) {
      console.warn(`    ❌ Missing tools.yaml for ${agentId}`);
      return null;
    }
    const toolsYaml = fs.readFileSync(toolsPath, "utf-8");
    const toolsConfig = yaml.parse(toolsYaml) as ToolConfig;

    // Read eval.yaml (required)
    const evalPath = path.join(agentPath, "eval.yaml");
    if (!fs.existsSync(evalPath)) {
      console.warn(`    ❌ Missing eval.yaml for ${agentId}`);
      return null;
    }
    const evalYaml = fs.readFileSync(evalPath, "utf-8");
    const evalConfig = yaml.parse(evalYaml) as EvalConfig;

    // Validate goldens.csv exists
    const goldensPath = path.join(agentPath, "goldens.csv");
    if (!fs.existsSync(goldensPath)) {
      console.warn(`    ⚠️  Missing goldens.csv for ${agentId} (non-critical)`);
    }

    return {
      skillPackPath: `agents/${agentId}`,
      promptText,
      toolsConfig,
      evalConfig,
      goldensPath: `agents/${agentId}/goldens.csv`,
    };
  } catch (error) {
    console.error(`    ❌ Error loading Skill Pack for ${agentId}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

async function seedAllPodsAndAgents() {
  try {
    console.log("🌱 Seeding ALL pods and agents from vNext 2025Q4 manifest...");

    // Read the manifest from repo root
    const manifestPath = path.join(process.cwd(), "handoff_manifest.json");
    const manifestData = fs.readFileSync(manifestPath, "utf-8");
    const manifest: Manifest = JSON.parse(manifestData);

    console.log(`📦 Found ${manifest.pods.length} pods in manifest`);
    console.log(`🤖 Found ${manifest.agents_seed.length} agents in manifest`);

    let podsCreated = 0;
    let agentsCreated = 0;
    let agentsSkipped = 0;

    // Create/update all pods
    for (const podData of manifest.pods) {
      console.log(`\n  Creating pod: ${podData.name} (${podData.pillar})`);

      await db
        .insert(pods)
        .values({
          name: podData.name,
          pillar: podData.pillar,
          purpose: podData.purpose,
          autonomyLevel: podData.autonomy,
          type: "New",
          priority: "High",
          version: manifest.version,
        })
        .onConflictDoUpdate({
          target: pods.name,
          set: {
            pillar: podData.pillar,
            purpose: podData.purpose,
            autonomyLevel: podData.autonomy,
            type: "New",
            priority: "High",
            version: manifest.version,
          },
        });

      podsCreated++;
      console.log(`    ✓ Pod created/updated`);
    }

    // Get pod IDs for agent association
    const allPods = await db.select().from(pods);
    const podMap = new Map(allPods.map(p => [p.name, p.id]));

    // Create/update all agents with Skill Packs
    for (const agentData of manifest.agents_seed) {
      console.log(`\n  Processing agent: ${agentData.title} (${agentData.id})`);

      // Load Skill Pack files
      const skillPack = loadSkillPackFiles(agentData.id);

      // Skip agents without valid Skill Packs
      if (!skillPack) {
        console.warn(`    ⏭️  SKIPPED - No valid Skill Pack found for ${agentData.id}`);
        agentsSkipped++;
        continue;
      }

      // Find pod ID
      const podId = podMap.get(agentData.podName) || null;
      if (!podId) {
        console.warn(`    ⚠️  Pod not found: ${agentData.podName}`);
      }

      // Determine agent type (Dream Team vs Pod Role)
      const agentType = agentData.id.startsWith("agent_") && 
                        !agentData.id.includes("_lead") && 
                        !agentData.id.includes("_manager") &&
                        !agentData.id.includes("_designer") &&
                        !agentData.id.includes("_producer") &&
                        !agentData.id.includes("_pm") &&
                        !agentData.id.includes("_ops") &&
                        !agentData.id.includes("_desk") &&
                        !agentData.id.includes("_admin") &&
                        !agentData.id.includes("_coordinator") &&
                        !agentData.id.includes("_librarian") &&
                        !agentData.id.includes("_engineer") &&
                        !agentData.id.includes("_steward") &&
                        !agentData.id.includes("_analyst") &&
                        !agentData.id.includes("_owner") &&
                        !agentData.id.includes("_qa")
        ? "dream_team" 
        : "pod_role";

      // Use the mapped ID for database insertion (handles duplicates)
      const dbAgentId = AGENT_ID_MAPPING[agentData.id] || agentData.id;

      await db
        .insert(agents)
        .values({
          id: dbAgentId,
          title: agentData.title,
          type: agentType,
          pillar: agentData.pillar,
          podId: podId,
          podName: agentData.podName,
          autonomyLevel: agentData.autonomy,
          status: agentData.status,
          skillPackPath: skillPack.skillPackPath,
          promptText: skillPack.promptText,
          toolsConfig: skillPack.toolsConfig,
          evalConfig: skillPack.evalConfig,
          goldensPath: skillPack.goldensPath,
        })
        .onConflictDoUpdate({
          target: agents.id,
          set: {
            title: agentData.title,
            type: agentType,
            pillar: agentData.pillar,
            podId: podId,
            podName: agentData.podName,
            autonomyLevel: agentData.autonomy,
            status: agentData.status,
            skillPackPath: skillPack.skillPackPath,
            promptText: skillPack.promptText,
            toolsConfig: skillPack.toolsConfig,
            evalConfig: skillPack.evalConfig,
            goldensPath: skillPack.goldensPath,
          },
        });

      agentsCreated++;
      console.log(`    ✓ Agent created/updated: ${agentData.title}`);
      console.log(`      📦 Skill Pack loaded from ${skillPack.skillPackPath}`);
    }

    console.log("\n✅ Seeding complete!");
    console.log(`   Pods created/updated: ${podsCreated}`);
    console.log(`   Agents created/updated: ${agentsCreated}`);
    console.log(`   Agents skipped (no Skill Pack): ${agentsSkipped}`);
  } catch (error) {
    console.error("❌ Error seeding:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAllPodsAndAgents()
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed:", error);
      process.exit(1);
    });
}

export { seedAllPodsAndAgents };
