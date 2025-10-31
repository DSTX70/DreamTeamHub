import { storage } from "./storage";
import { readFile } from "fs/promises";
import { join } from "path";

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // Create canonical pods
    console.log("Creating pods...");
    const podNames = [
      "Control Tower",
      "IP & Patent Program",
      "Security",
      "Brand & Assets",
      "Marketing",
      "Finance",
      "Product & Engineering",
    ];

    const createdPods = [];
    for (const name of podNames) {
      const pod = await storage.createPod({
        name,
        charter: `${name} charter and objectives`,
        owners: [],
      });
      createdPods.push(pod);
      console.log(`  ✓ Created pod: ${name}`);
    }

    // Import role cards from JSON
    console.log("\nImporting role cards...");
    const roleCardsPath = join(process.cwd(), "attached_assets/rolecards_seed_1761945908060.json");
    const roleCardsJson = await readFile(roleCardsPath, "utf-8");
    const roleCardsData = JSON.parse(roleCardsJson);

    // Map JSON fields to database schema
    const roleCards = roleCardsData.map((card: any) => ({
      handle: card.handle,
      title: card.title,
      pod: card.pod,
      purpose: card.purpose,
      coreFunctions: card.core_functions || [],
      responsibilities: card.responsibilities || [],
      toneVoice: card.tone_voice || "",
      definitionOfDone: card.definition_of_done || [],
      links: card.links || [],
      tags: card.tags || [],
    }));

    const importedRoles = await storage.bulkCreateRoleCards(roleCards);
    console.log(`  ✓ Imported ${importedRoles.length} role cards`);

    // Create sample persons
    console.log("\nCreating sample persons...");
    const controlTowerPod = createdPods.find(p => p.name === "Control Tower");
    const ipPod = createdPods.find(p => p.name === "IP & Patent Program");
    
    if (controlTowerPod) {
      await storage.createPerson({
        handle: "admin",
        name: "Admin User",
        roles: ["Orchestrator"],
        podId: controlTowerPod.id,
        contact: "admin@dreamteam.io",
      });
      console.log("  ✓ Created admin user");
    }

    if (ipPod) {
      await storage.createPerson({
        handle: "aegis-user",
        name: "IP Counsel",
        roles: ["IP & Patent Counsel"],
        podId: ipPod.id,
        contact: "ip@dreamteam.io",
      });
      console.log("  ✓ Created IP counsel user");
    }

    // Create sample work items
    console.log("\nCreating sample work items...");
    const persons = await storage.getPersons();
    const adminPerson = persons.find(p => p.handle === "admin");

    if (adminPerson && controlTowerPod) {
      await storage.createWorkItem({
        title: "Review Q1 2025 Roadmap",
        description: "Align pod priorities and milestones for Q1",
        podId: controlTowerPod.id,
        ownerId: adminPerson.id,
        status: "in_progress",
        priority: "high",
        dueDate: new Date("2025-01-15"),
        milestone: "Q1 Planning",
        sourceLinks: [],
      });

      await storage.createWorkItem({
        title: "Patent Filing Prep",
        description: "Prepare attorney packet for new invention disclosure",
        podId: ipPod?.id,
        ownerId: adminPerson.id,
        status: "todo",
        priority: "critical",
        dueDate: new Date("2025-01-10"),
        milestone: "Patent Filing",
        sourceLinks: [],
      });

      await storage.createWorkItem({
        title: "Security Audit Q4 2024",
        description: "Complete SOC2 Type II audit requirements",
        podId: createdPods.find(p => p.name === "Security")?.id,
        ownerId: adminPerson.id,
        status: "blocked",
        priority: "high",
        milestone: "Compliance",
        sourceLinks: [],
      });

      console.log("  ✓ Created 3 sample work items");
    }

    // Create sample decision
    console.log("\nCreating sample decision...");
    await storage.createDecision({
      summary: "Adopt Evidence-Grade Documentation Standard",
      rationale: "All critical deliverables must include SHA256 checksums, timestamps, and INDEX.txt manifests to ensure tamper-proof audit trails.",
      approver: "OS (Orchestrator)",
      effectiveAt: new Date("2025-01-01"),
      status: "active",
      links: [],
      podIds: createdPods.map(p => p.id),
      workItemIds: [],
    });
    console.log("  ✓ Created sample decision");

    console.log("\n✅ Database seed completed successfully!");
    console.log(`\nSummary:`);
    console.log(`  - ${createdPods.length} pods`);
    console.log(`  - ${importedRoles.length} role cards`);
    console.log(`  - ${persons.length} persons`);
    console.log(`  - 3 work items`);
    console.log(`  - 1 decision`);

  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
