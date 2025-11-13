import type { LifestylePack } from "./schemas/lifestylePack";
import type { PatentClaimsPack } from "./schemas/patentClaimsPack";
import type { LaunchPlanPack } from "./schemas/launchPlanPack";
import type { WebsiteAuditPack } from "./schemas/websiteAuditPack";
import type { RiskCompliancePack } from "./schemas/riskCompliancePack";
import type { AgentLabAcademyPack } from "./schemas/agentLabAcademyPack";
import type { PackType } from "./packRegistry";
import { storage } from "../storage";
import { db } from "../db/client";
import { workItemPacks } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

async function savePackToDB(
  workItemId: number,
  packType: PackType,
  packData: unknown
): Promise<number> {
  const existingPacks = await db
    .select()
    .from(workItemPacks)
    .where(
      and(
        eq(workItemPacks.workItemId, workItemId),
        eq(workItemPacks.packType, packType)
      )
    )
    .orderBy(desc(workItemPacks.version));

  const nextVersion = existingPacks.length > 0 ? existingPacks[0].version + 1 : 1;

  const [inserted] = await db
    .insert(workItemPacks)
    .values({
      workItemId,
      packType,
      version: nextVersion,
      packData: packData as any,
    })
    .returning();

  return inserted.id;
}

export async function getLatestPack(
  workItemId: number,
  packType: PackType
): Promise<{ id: number; version: number; packData: any; createdAt: Date } | null> {
  const packs = await db
    .select()
    .from(workItemPacks)
    .where(
      and(
        eq(workItemPacks.workItemId, workItemId),
        eq(workItemPacks.packType, packType)
      )
    )
    .orderBy(desc(workItemPacks.version))
    .limit(1);

  return packs.length > 0 ? packs[0] : null;
}

export async function saveLifestylePackArtifacts(
  workItemId: number,
  pack: LifestylePack
): Promise<void> {
  const wi = await storage.getWorkItem(workItemId);
  if (!wi) throw new Error("Work item not found");

  await savePackToDB(workItemId, "lifestyle", pack);

  const packSummary = `

---

## ✨ Lifestyle Pack Generated (${new Date().toLocaleString()})

### Shot Boards (${pack.shot_boards.length})
${pack.shot_boards.map(sb => `
**${sb.shot_id}: ${sb.card_title}** (${sb.collection} - ${sb.sku})
- Scenario: ${sb.scenario}
- Camera: ${sb.camera}
- Framing: ${sb.framing}
- Lighting: ${sb.lighting}
- Casting: ${sb.casting}
- Color Palette: ${sb.color_palette}
${sb.notes ? `- Notes: ${sb.notes}` : ''}
`).join('\n')}

### Export Plan (${pack.export_plan.length} files)
${pack.export_plan.map(ep => `- ${ep.filename} (${ep.width}×${ep.height})${ep.is_primary ? ' [PRIMARY]' : ''}`).join('\n')}

### Alt Text Rows (${pack.alt_text_rows.length})
${pack.alt_text_rows.map(at => `- ${at.filename}: "${at.alt_text}"`).join('\n')}

### SEO Meta Rows (${pack.seo_meta_rows.length})
${pack.seo_meta_rows.map(seo => `- ${seo.filename}: ${seo.meta_title}`).join('\n')}
`;

  await storage.updateWorkItem(workItemId, {
    description: (wi.description || "") + packSummary,
    status: "done",
  });
}

export async function savePatentClaimsPack(
  workItemId: number,
  pack: PatentClaimsPack
): Promise<void> {
  const wi = await storage.getWorkItem(workItemId);
  if (!wi) throw new Error("Work item not found");

  await savePackToDB(workItemId, "patent", pack);

  const packSummary = `

---

## 🧩 Patent Claims Pack Generated (${new Date().toLocaleString()})

**Invention:** ${pack.invention_title}

**Summary:** ${pack.short_summary}

### Independent Claims (${pack.independent_claims.length})
${pack.independent_claims.map(c => `
**Claim ${c.claim_number}**
${c.text}
${c.notes ? `\n_Notes: ${c.notes}_` : ''}
`).join('\n')}

### Dependent Claims (${pack.dependent_claims.length})
${pack.dependent_claims.map(c => `
**Claim ${c.claim_number}** (depends on: ${c.depends_on.join(', ')})
${c.text}
${c.notes ? `\n_Notes: ${c.notes}_` : ''}
`).join('\n')}

${pack.open_questions.length > 0 ? `### Open Questions\n${pack.open_questions.map(q => `- ${q}`).join('\n')}` : ''}
`;

  await storage.updateWorkItem(workItemId, {
    description: (wi.description || "") + packSummary,
    status: "done",
  });
}

export async function saveLaunchPlanPack(
  workItemId: number,
  pack: LaunchPlanPack
): Promise<void> {
  const wi = await storage.getWorkItem(workItemId);
  if (!wi) throw new Error("Work item not found");

  await savePackToDB(workItemId, "launch", pack);

  const packSummary = `

---

## 📣 Launch Plan Pack Generated (${new Date().toLocaleString()})

**Campaign:** ${pack.campaign_name}
**T0 Event:** ${pack.t0_event}

### Timeline (${pack.timeline.length} items)
${pack.timeline.map(t => `- **${t.label}** (${t.owner_role}): Days ${t.start_offset_days} - ${t.end_offset_days}`).join('\n')}

### Channels (${pack.channels.length})
${pack.channels.map(ch => `
**${ch.channel}**
- Objective: ${ch.objective}
- Cadence: ${ch.cadence}
- Key Messages: ${ch.key_messages.join(', ')}
`).join('\n')}

### Assets (${pack.assets.length})
${pack.assets.map(a => `- **${a.asset_id}** (${a.type}): ${a.description} - ${a.owner_role} - Due: Day ${a.needed_by_offset_days}`).join('\n')}

### KPIs (${pack.kpis.length})
${pack.kpis.map(k => `- **${k.metric}**: ${k.target_value} (${k.measurement_window_days} days)`).join('\n')}
`;

  await storage.updateWorkItem(workItemId, {
    description: (wi.description || "") + packSummary,
    status: "done",
  });
}

export async function saveWebsiteAuditPack(
  workItemId: number,
  pack: WebsiteAuditPack
): Promise<void> {
  const wi = await storage.getWorkItem(workItemId);
  if (!wi) throw new Error("Work item not found");

  await savePackToDB(workItemId, "website_audit", pack);

  const packSummary = `

---

## 🔍 Website Audit Pack Generated (${new Date().toLocaleString()})

**Site:** ${pack.site_name} (${pack.environment})
**Base URL:** ${pack.base_url}

### Summary
**${pack.summary.headline}**

**Key Wins:**
${pack.summary.key_wins.map(w => `- ${w}`).join('\n')}

**Key Issues:**
${pack.summary.key_issues.map(i => `- ${i}`).join('\n')}

### Pages Audited (${pack.pages.length})
${pack.pages.map(p => `- [${p.priority.toUpperCase()}] ${p.label}: ${p.url}`).join('\n')}

### Findings (${pack.findings.length})
${pack.findings.map(f => `
**${f.id}** [${f.area} - ${f.severity.toUpperCase()} - Effort: ${f.effort}]
- **Page:** ${f.page_url}
- **Issue:** ${f.description}
- **Fix:** ${f.recommendation}
`).join('\n')}

### Checklists
${pack.checklists.map(cl => `
**${cl.area}**
${cl.items.map(item => `- [${item.status.toUpperCase()}] ${item.label}${item.notes ? ` (${item.notes})` : ''}`).join('\n')}
`).join('\n')}

### Roadmap
${pack.roadmap.map(bucket => `
**${bucket.bucket.replace('_', ' ').toUpperCase()}** (${bucket.finding_ids.length} findings)
${bucket.narrative}
Includes: ${bucket.finding_ids.join(', ') || 'None'}
`).join('\n')}
`;

  await storage.updateWorkItem(workItemId, {
    description: (wi.description || "") + packSummary,
    status: "done",
  });
}

export async function saveRiskCompliancePackArtifacts(
  workItemId: number,
  pack: RiskCompliancePack
): Promise<void> {
  const wi = await storage.getWorkItem(workItemId);
  if (!wi) throw new Error("Work item not found");

  await savePackToDB(workItemId, "risk_compliance", pack);

  const packSummary = `

---

## 🛡️ Risk & Compliance Pack Generated (${new Date().toLocaleString()})

**${pack.summary.headline}**
**Overall Risk:** ${pack.summary.overall_risk.toUpperCase()}

### Key Concerns (${pack.summary.key_concerns.length})
${pack.summary.key_concerns.map(c => `- ${c}`).join('\n')}

### Key Mitigations (${pack.summary.key_mitigations.length})
${pack.summary.key_mitigations.map(m => `- ${m}`).join('\n')}

### Risks (${pack.risks.length})
${pack.risks.map(r => `
**${r.id}** [${r.area} - ${r.severity.toUpperCase()} severity, ${r.likelihood.toUpperCase()} likelihood]
- **Impact:** ${r.impact}
- **Description:** ${r.description}
- **Mitigation (${r.owner_role}, ${r.time_horizon}):** ${r.recommendation}
`).join('\n')}

### Controls (${pack.controls.length})
${pack.controls.map(c => `- **${c.id}** (${c.category}, ${c.owner_role})${c.required ? ' [REQUIRED]' : ''}: ${c.description}`).join('\n')}

### Compliance Notes (${pack.compliance_notes.length})
${pack.compliance_notes.map(cn => `- **${cn.regime}** [${cn.status.toUpperCase()}]: ${cn.note}`).join('\n')}

${pack.open_questions.length > 0 ? `### Open Questions (${pack.open_questions.length})\n${pack.open_questions.map(q => `- ${q}`).join('\n')}` : ''}
`;

  await storage.updateWorkItem(workItemId, {
    description: (wi.description || "") + packSummary,
    status: "done",
  });
}

export async function saveAgentLabAcademyPackArtifacts(
  workItemId: number,
  pack: AgentLabAcademyPack
): Promise<void> {
  const wi = await storage.getWorkItem(workItemId);
  if (!wi) throw new Error("Work item not found");

  await savePackToDB(workItemId, "agent_lab_academy", pack);

  const packSummary = `

---

## 🎓 Agent Lab Academy Pack Generated (${new Date().toLocaleString()})

**${pack.summary.headline}**
**Primary Audience:** ${pack.summary.primary_audience}

### Key Outcomes (${pack.summary.key_outcomes.length})
${pack.summary.key_outcomes.map(o => `- ${o}`).join('\n')}

### Tracks (${pack.tracks.length})
${pack.tracks.map(t => `
**${t.name}** (${t.id})
- **Audience:** ${t.audience}
- **Modules:** ${t.modules.length}
- **Objectives:** ${t.objectives.join(', ')}
- **Prerequisites:** ${t.prerequisites.length > 0 ? t.prerequisites.join(', ') : 'None'}
`).join('\n')}

### Certifications (${pack.certifications.length})
${pack.certifications.map(cert => `
**${cert.name}** (${cert.level})
- **Target Role:** ${cert.target_role}
- **Required Tracks:** ${cert.required_tracks.join(', ')}
- **Exam Format:** ${cert.exam_format}
`).join('\n')}

### Logistics
- **Cohort Length:** ${pack.logistics.cohort_length_weeks} weeks
- **Cadence:** ${pack.logistics.cadence}
- **Max Seats:** ${pack.logistics.max_seats}
- **Delivery Model:** ${pack.logistics.delivery_model}

${pack.open_questions.length > 0 ? `### Open Questions (${pack.open_questions.length})\n${pack.open_questions.map(q => `- ${q}`).join('\n')}` : ''}
`;

  await storage.updateWorkItem(workItemId, {
    description: (wi.description || "") + packSummary,
    status: "done",
  });
}
