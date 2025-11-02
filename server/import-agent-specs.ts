import { db } from "./db";
import { agentSpecs } from "@shared/schema";
import { promises as fs } from "fs";
import path from "path";

interface AgentSpecJSON {
  name: string;
  handle: string;
  role: string;
  pods: string;
  purpose: string;
  autonomy_level: string;
  inputs: string[];
  outputs: string[];
  tools: {
    allowed_endpoints: string[];
    connectors: string[];
  };
  guardrails: string[];
  task_templates: Array<{
    name: string;
    desc: string;
    inputs: string[];
    outputs: string[];
    requires_approval: boolean;
  }>;
  run_caps: {
    token_limit: number;
    time_limit_sec: number;
    budget_limit_usd: number;
  };
  approvals: {
    required_for: string[];
    approver_roles: string[];
  };
  memory_policy: {
    remember: string[];
    forget: string[];
  };
  telemetry: {
    emit: string[];
    level: string;
  };
  created_at: string;
}

function mapAutonomyLevel(level: string): number {
  switch (level) {
    case "L0": return 0;
    case "L1": return 1;
    case "L2": return 2;
    case "L3": return 3;
    default: return 1; // Default to L1
  }
}

function buildSystemPrompt(spec: AgentSpecJSON): string {
  return `You are ${spec.name} (${spec.handle}), ${spec.role}.

PURPOSE: ${spec.purpose}

PODS: ${spec.pods}

GUARDRAILS:
${spec.guardrails.map(g => `- ${g}`).join('\n')}

INPUTS: ${spec.inputs.join(', ')}
OUTPUTS: ${spec.outputs.join(', ')}

AUTONOMY LEVEL: ${spec.autonomy_level}
${getAutonomyDescription(spec.autonomy_level)}

RUNTIME CAPS:
- Token Limit: ${spec.run_caps.token_limit.toLocaleString()}
- Time Limit: ${spec.run_caps.time_limit_sec}s
- Budget Limit: $${spec.run_caps.budget_limit_usd}

MEMORY POLICY:
- Remember: ${spec.memory_policy.remember.join(', ')}
- Forget: ${spec.memory_policy.forget.join(', ')}`;
}

function getAutonomyDescription(level: string): string {
  switch (level) {
    case "L0": return "Read-only, drafts only. Human must approve everything.";
    case "L1": return "Can transform/draft/export; cannot post decisions or spend budget without sign-off.";
    case "L2": return "Can run scoped workflows end-to-end; posts Mirror-Backs automatically.";
    case "L3": return "Can spawn/coordinate other agents; high scrutiny.";
    default: return "";
  }
}

async function importAgentSpecs() {
  const extractedDir = path.join(process.cwd(), "attached_assets", "extracted");
  const files = await fs.readdir(extractedDir);
  
  // Filter for JSON files only
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  console.log(`Found ${jsonFiles.length} agent spec files to import...`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const file of jsonFiles) {
    const filePath = path.join(extractedDir, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const spec: AgentSpecJSON = JSON.parse(content);
    
    // Clean the handle (remove @ if present)
    const handle = spec.handle.startsWith('@') ? spec.handle.substring(1) : spec.handle;
    
    try {
      // Check if already exists
      const existing = await db.query.agentSpecs.findFirst({
        where: (specs, { eq }) => eq(specs.handle, handle)
      });
      
      if (existing) {
        console.log(`  ⊘ Skipping ${handle} (already exists)`);
        skipped++;
        continue;
      }
      
      // Convert task templates to instruction blocks
      const instructionBlocks = spec.task_templates.map(t => 
        `${t.name}: ${t.desc} (Approval: ${t.requires_approval ? 'Required' : 'Not Required'})`
      );
      
      // Build policies object
      const policies = {
        approvals: spec.approvals,
        run_caps: spec.run_caps,
        memory_policy: spec.memory_policy,
        telemetry: spec.telemetry,
        task_templates: spec.task_templates
      };
      
      // Insert the agent spec
      await db.insert(agentSpecs).values({
        handle: handle,
        title: spec.name,
        pod: spec.pods.split('—')[0].trim(), // Take first pod if multiple
        threadId: null,
        systemPrompt: buildSystemPrompt(spec),
        instructionBlocks: instructionBlocks,
        tools: spec.tools.allowed_endpoints,
        policies: policies,
        autonomyLevel: mapAutonomyLevel(spec.autonomy_level)
      });
      
      console.log(`  ✓ Imported ${handle} (${spec.autonomy_level})`);
      imported++;
    } catch (error) {
      console.error(`  ✗ Error importing ${handle}:`, error);
    }
  }
  
  console.log(`\n✅ Import complete: ${imported} imported, ${skipped} skipped`);
  process.exit(0);
}

importAgentSpecs().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
