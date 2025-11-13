import type { LifestylePack } from "./schemas/lifestylePack";
import type { PatentClaimsPack } from "./schemas/patentClaimsPack";
import type { LaunchPlanPack } from "./schemas/launchPlanPack";
import { storage } from "../storage";

export async function saveLifestylePackArtifacts(
  workItemId: number,
  pack: LifestylePack
): Promise<void> {
  const notes = `## Lifestyle Pack Generated

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
    description: notes,
    status: "done",
  });
}

export async function savePatentClaimsPack(
  workItemId: number,
  pack: PatentClaimsPack
): Promise<void> {
  const notes = `## Patent Claims Pack Generated

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
    description: notes,
    status: "done",
  });
}

export async function saveLaunchPlanPack(
  workItemId: number,
  pack: LaunchPlanPack
): Promise<void> {
  const notes = `## Launch Plan Pack Generated

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
    description: notes,
    status: "done",
  });
}
