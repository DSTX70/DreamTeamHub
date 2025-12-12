# DROP A — CANONICAL DREAM TEAM SYNC DROP (v1.0)

## Purpose
Install the Dream Team Hub canon (as defined in the canvas) into the product as data, not docs.

After this drop:
- /api/agents reflects the full Dream Team roster
- Autonomy levels, pods, and roles are canonical
- The build can truthfully say: "This system is governed by the Dream Team Hub v1.0"

---

## A1. Canonical Persona Registry Seed (v1.0)

### File
`/data/dream-team/dth_persona_registry_v1-0.json`

This is the single source seed. Everything else syncs from this file.

### Schema (explicit)
```json
{
  "canonVersion": "v1.0",
  "source": "Dream Team Hub — Master Canvas (v1.0)",
  "personas": [
    {
      "slug": "os",
      "displayName": "OS",
      "type": "dream_team",
      "pillar": "Core Operating Layer",
      "pod": "System",
      "role": "System Orchestrator",
      "toneVoice": "neutral-system",
      "autonomyMax": "L3",
      "scope": [
        "Governance enforcement",
        "Routing Dream Team vs Agent Mode vs Agent Lab",
        "Canonical structure and versioning"
      ],
      "outOfScope": [
        "Creative authorship",
        "Mechanical execution"
      ],
      "deliverables": [
        "Root thread installs",
        "RACI matrices",
        "Governance decisions"
      ],
      "definitionOfDone": [
        "Correct pod routed",
        "Governance applied",
        "Canonical state confirmed"
      ],
      "isActive": true
    }
  ]
}
```

### Included Personas (FULL LIST)

Types:
- dream_team
- pod_role
- council
- system_capability

Required entries:
- OS
- Agent Mode (type: system_capability)
- Sparkster, Nova, Storybloom, Muse, Walt, River, Echo
- Lume, Foundry, Prism, Scout, Stratēga
- Forge, LexiCode, CodeBlock, App Dev Guru, Bridge, Pulse, Verifier
- Aegis, Sentinel, Atlas, Praetor, Coda, Archivist, Beacon, Conductor
- Patent Search Specialist, Patent Illustrator, IP Paralegal, Security Reviewer
- Izumi, ChieSan, Kaoru, English Poet, English Lyricist
- Dr. Rowan Vagus, Dr. Somnus Hale, Avery Marlowe
- Ledger, Navi, Amani
- Harbor, Boost, Compass, Tally, Relief, Nest, Lens, Uplift, Shield
- Religious Scholar Council
- Editorial Approvals Lead
- Advisory Council Liaison

No persona exists in the product unless it exists here.

---

## A2. Agents Table Alignment (Minimal, Non-Breaking)

The build already has an agents table. We do not redesign it — we extend safely.

### Required fields (logical)
```
agents {
  id
  slug
  displayName
  type              // dream_team | pod_role | council | system_capability
  pillar
  pod
  role
  toneVoice
  autonomyLevel     // current (L0–L3)
  autonomyMax       // from canon
  canonVersion
  isActive
  meta              // JSONB for scope, DoD, deliverables
}
```

If some of these already exist → reuse.
If not → store in meta.

---

## A3. Idempotent Sync Script (Critical)

### File
`/server/scripts/syncDreamTeamFromCanon.ts`

### Behavior (canonical)
- Reads dth_persona_registry_v1-0.json
- Upserts by slug
- Never deletes automatically
- Updates: display name, role, pod/pillar, autonomyMax, canonVersion, meta (scope, DoD, deliverables)

### Pseudocode
```typescript
for (persona of canon.personas) {
  const existing = await db.agents.findOne({ slug: persona.slug });

  if (!existing) {
    await db.agents.insert({
      slug: persona.slug,
      displayName: persona.displayName,
      type: persona.type,
      pillar: persona.pillar,
      pod: persona.pod,
      role: persona.role,
      autonomyLevel: "L0",
      autonomyMax: persona.autonomyMax,
      canonVersion: canon.canonVersion,
      isActive: persona.isActive,
      meta: {
        scope: persona.scope,
        outOfScope: persona.outOfScope,
        deliverables: persona.deliverables,
        definitionOfDone: persona.definitionOfDone
      }
    });
  } else {
    await db.agents.update({
      where: { id: existing.id },
      data: {
        displayName: persona.displayName,
        role: persona.role,
        pod: persona.pod,
        pillar: persona.pillar,
        autonomyMax: persona.autonomyMax,
        canonVersion: canon.canonVersion,
        isActive: persona.isActive,
        meta: merge(existing.meta, persona.meta)
      }
    });
  }
}
```

### Definition of Done
- Script can be run repeatedly
- No duplicates
- /api/agents now mirrors the canvas roster
- Every agent has a canonVersion: v1.0

---

## A4. Verification Checklist (Non-Negotiable)

After running Drop A:
- OS appears as dream_team, autonomyMax = L3
- Agent Mode appears as system_capability
- Councils are typed correctly (council)
- /api/agents count matches canvas
- Re-run script → no changes (idempotent)

Only when this passes do we proceed.

---

## Status
DROP A — READY TO IMPLEMENT

## Next (after confirmation)
DROP B — Canonical Governance Packs
- Persona Registry Pack
- Pod Activation + RACI Pack
- Agent Lab Boundary Pack
- Monetization Pack
- Change Log Pack
