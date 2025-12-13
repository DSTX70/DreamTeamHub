/**
 * DROP A — Canonical Dream Team Sync Script
 * 
 * This script reads the canonical persona registry (dth_persona_registry_v1-0.json)
 * and syncs it to the agents table via upsert.
 * 
 * Behavior:
 * - Reads dth_persona_registry_v1-0.json
 * - Upserts by slug (using id as slug)
 * - Never deletes automatically
 * - Updates: display name, role, pod/pillar, autonomyMax, canonVersion, meta
 * 
 * Usage: npx tsx server/scripts/syncDreamTeamFromCanon.ts
 */

import { db } from '../db';
import { agents } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { writeCanonSyncEvent } from '../lib/canonSync';
import * as fs from 'fs';
import * as path from 'path';

interface PersonaRegistry {
  canonVersion: string;
  source: string;
  personas: Persona[];
}

interface Persona {
  slug: string;
  displayName: string;
  type: 'dream_team' | 'pod_role' | 'council' | 'system_capability';
  pillar: string;
  pod: string;
  role: string;
  toneVoice: string;
  autonomyMax: string;
  scope: string[];
  outOfScope: string[];
  deliverables: string[];
  definitionOfDone: string[];
  isActive: boolean;
}

async function syncDreamTeamFromCanon() {
  console.log('🚀 DROP A: Canonical Dream Team Sync Starting...\n');

  const registryPath = path.join(process.cwd(), 'data/dream-team/dth_persona_registry_v1-0.json');
  
  if (!fs.existsSync(registryPath)) {
    console.error(`❌ Registry file not found: ${registryPath}`);
    process.exit(1);
  }

  const registryContent = fs.readFileSync(registryPath, 'utf-8');
  const registry: PersonaRegistry = JSON.parse(registryContent);

  console.log(`📖 Loaded registry: ${registry.source}`);
  console.log(`📦 Canon version: ${registry.canonVersion}`);
  console.log(`👥 Personas to sync: ${registry.personas.length}\n`);

  let inserted = 0;
  let updated = 0;
  let unchanged = 0;

  for (const persona of registry.personas) {
    const agentId = `agent_${persona.slug.replace(/-/g, '_')}`;
    
    const existing = await db
      .select()
      .from(agents)
      .where(eq(agents.id, agentId))
      .limit(1);

    const meta = {
      scope: persona.scope,
      outOfScope: persona.outOfScope,
      deliverables: persona.deliverables,
      definitionOfDone: persona.definitionOfDone,
    };

    if (existing.length === 0) {
      await db.insert(agents).values({
        id: agentId,
        slug: persona.slug,
        title: persona.displayName,
        type: persona.type,
        pillar: persona.pillar,
        podName: persona.pod,
        role: persona.role,
        toneVoice: persona.toneVoice,
        autonomyLevel: 'L0',
        autonomyMax: persona.autonomyMax,
        canonVersion: registry.canonVersion,
        isActive: persona.isActive,
        status: persona.isActive ? 'active' : 'inactive',
        meta,
      });
      console.log(`✅ INSERT: ${persona.displayName} (${agentId})`);
      inserted++;
    } else {
      const current = existing[0];
      const needsUpdate = 
        current.slug !== persona.slug ||
        current.title !== persona.displayName ||
        current.type !== persona.type ||
        current.pillar !== persona.pillar ||
        current.podName !== persona.pod ||
        current.role !== persona.role ||
        current.toneVoice !== persona.toneVoice ||
        current.autonomyMax !== persona.autonomyMax ||
        current.canonVersion !== registry.canonVersion ||
        current.isActive !== persona.isActive ||
        JSON.stringify(current.meta) !== JSON.stringify(meta);

      if (needsUpdate) {
        await db
          .update(agents)
          .set({
            slug: persona.slug,
            title: persona.displayName,
            type: persona.type,
            pillar: persona.pillar,
            podName: persona.pod,
            role: persona.role,
            toneVoice: persona.toneVoice,
            autonomyMax: persona.autonomyMax,
            canonVersion: registry.canonVersion,
            isActive: persona.isActive,
            status: persona.isActive ? 'active' : 'inactive',
            meta,
            updatedAt: new Date(),
          })
          .where(eq(agents.id, agentId));
        console.log(`🔄 UPDATE: ${persona.displayName} (${agentId})`);
        updated++;
      } else {
        console.log(`⏭️  SKIP: ${persona.displayName} (${agentId}) - no changes`);
        unchanged++;
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 SYNC COMPLETE');
  console.log('='.repeat(50));
  console.log(`✅ Inserted: ${inserted}`);
  console.log(`🔄 Updated: ${updated}`);
  console.log(`⏭️  Unchanged: ${unchanged}`);
  console.log(`📦 Total personas: ${registry.personas.length}`);
  console.log(`📌 Canon version: ${registry.canonVersion}`);
  console.log('='.repeat(50) + '\n');

  const agentCount = await db.select().from(agents);
  console.log(`🔢 Total agents in database: ${agentCount.length}`);

  const dreamTeam = agentCount.filter(a => a.type === 'dream_team');
  const podRoles = agentCount.filter(a => a.type === 'pod_role');
  const councils = agentCount.filter(a => a.type === 'council');
  const systemCaps = agentCount.filter(a => a.type === 'system_capability');

  console.log(`   - dream_team: ${dreamTeam.length}`);
  console.log(`   - pod_role: ${podRoles.length}`);
  console.log(`   - council: ${councils.length}`);
  console.log(`   - system_capability: ${systemCaps.length}`);

  // Write canon sync event for status tracking
  await writeCanonSyncEvent(db, {
    canonKey: "dream_team_hub",
    canonVersion: registry.canonVersion,
    source: registry.source,
    syncedBy: "syncDreamTeamFromCanon.ts",
  });
  console.log('\n✅ Canon sync event recorded');

  process.exit(0);
}

syncDreamTeamFromCanon().catch((err) => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});
