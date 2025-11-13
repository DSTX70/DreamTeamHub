import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType } from "docx";
import type { LifestylePack } from "../ai/schemas/lifestylePack";
import type { PatentClaimsPack } from "../ai/schemas/patentClaimsPack";
import type { LaunchPlanPack } from "../ai/schemas/launchPlanPack";
import type { WebsiteAuditPack } from "../ai/schemas/websiteAuditPack";
import type { PackType } from "../ai/persistence";

export interface ExportResult {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

export async function exportLifestylePackToDOCX(
  workItemId: number,
  version: number,
  pack: LifestylePack
): Promise<ExportResult> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "Lifestyle Pack",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: `Work Item: WI-${workItemId} | Version: ${version} | Generated: ${new Date().toLocaleString()}`,
            spacing: { after: 200 },
          }),
          
          new Paragraph({
            text: "Shot Boards",
            heading: HeadingLevel.HEADING_2,
          }),
          
          ...pack.shot_boards.flatMap((sb) => [
            new Paragraph({
              text: `${sb.shot_id}: ${sb.card_title}`,
              heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph({ text: `Collection: ${sb.collection} | SKU: ${sb.sku}` }),
            new Paragraph({ text: `Scenario: ${sb.scenario}` }),
            new Paragraph({ text: `Camera: ${sb.camera}` }),
            new Paragraph({ text: `Framing: ${sb.framing}` }),
            new Paragraph({ text: `Lighting: ${sb.lighting}` }),
            new Paragraph({ text: `Casting: ${sb.casting}` }),
            new Paragraph({ text: `Color Palette: ${sb.color_palette}` }),
            ...(sb.notes ? [new Paragraph({ text: `Notes: ${sb.notes}` })] : []),
            new Paragraph({ text: "" }),
          ]),

          new Paragraph({
            text: "Export Plan",
            heading: HeadingLevel.HEADING_2,
          }),
          
          ...pack.export_plan.map((ep) => 
            new Paragraph({
              text: `• ${ep.filename} (${ep.width}×${ep.height})${ep.is_primary ? " [PRIMARY]" : ""}`,
            })
          ),
          new Paragraph({ text: "" }),

          new Paragraph({
            text: "Alt Text Rows",
            heading: HeadingLevel.HEADING_2,
          }),
          
          ...pack.alt_text_rows.map((at) => 
            new Paragraph({ text: `• ${at.filename}: "${at.alt_text}"` })
          ),
          new Paragraph({ text: "" }),

          new Paragraph({
            text: "SEO Meta Rows",
            heading: HeadingLevel.HEADING_2,
          }),
          
          ...pack.seo_meta_rows.map((seo) => 
            new Paragraph({ text: `• ${seo.filename}: ${seo.meta_title}` })
          ),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return {
    fileName: `WI-${workItemId}_LifestylePack_v${version}.docx`,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer,
  };
}

export async function exportLifestylePackToCSV(
  workItemId: number,
  version: number,
  pack: LifestylePack
): Promise<ExportResult> {
  const headers = [
    "shot_id",
    "card_title",
    "collection",
    "sku",
    "scenario",
    "camera",
    "framing",
    "lighting",
    "casting",
    "color_palette",
    "notes"
  ];
  
  const rows = pack.shot_boards.map(sb => [
    sb.shot_id,
    sb.card_title,
    sb.collection,
    sb.sku,
    sb.scenario,
    sb.camera,
    sb.framing,
    sb.lighting,
    sb.casting,
    sb.color_palette,
    sb.notes || ""
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  return {
    fileName: `WI-${workItemId}_LifestylePack_v${version}.csv`,
    mimeType: "text/csv",
    buffer: Buffer.from(csvContent, "utf8"),
  };
}

export async function exportPatentPackToDOCX(
  workItemId: number,
  version: number,
  pack: PatentClaimsPack
): Promise<ExportResult> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "Patent Claims Pack",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: `Work Item: WI-${workItemId} | Version: ${version} | Generated: ${new Date().toLocaleString()}`,
            spacing: { after: 200 },
          }),
          
          new Paragraph({
            text: pack.invention_title,
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: pack.short_summary,
            spacing: { after: 200 },
          }),

          new Paragraph({
            text: "Independent Claims",
            heading: HeadingLevel.HEADING_2,
          }),
          
          ...pack.independent_claims.flatMap((c) => [
            new Paragraph({
              text: `Claim ${c.claim_number}`,
              heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph({ text: c.text }),
            ...(c.notes ? [new Paragraph({ text: `Notes: ${c.notes}`, italics: true })] : []),
            new Paragraph({ text: "" }),
          ]),

          new Paragraph({
            text: "Dependent Claims",
            heading: HeadingLevel.HEADING_2,
          }),
          
          ...pack.dependent_claims.flatMap((c) => [
            new Paragraph({
              text: `Claim ${c.claim_number} (depends on: ${c.depends_on.join(", ")})`,
              heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph({ text: c.text }),
            ...(c.notes ? [new Paragraph({ text: `Notes: ${c.notes}`, italics: true })] : []),
            new Paragraph({ text: "" }),
          ]),

          ...(pack.open_questions.length > 0 ? [
            new Paragraph({
              text: "Open Questions",
              heading: HeadingLevel.HEADING_2,
            }),
            ...pack.open_questions.map(q => new Paragraph({ text: `• ${q}` })),
          ] : []),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return {
    fileName: `WI-${workItemId}_PatentPack_v${version}.docx`,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer,
  };
}

export async function exportLaunchPlanPackToDOCX(
  workItemId: number,
  version: number,
  pack: LaunchPlanPack
): Promise<ExportResult> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "Launch Plan Pack",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: `Work Item: WI-${workItemId} | Version: ${version} | Generated: ${new Date().toLocaleString()}`,
            spacing: { after: 200 },
          }),
          
          new Paragraph({
            text: pack.campaign_name,
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: `T0 Event: ${pack.t0_event}`,
            spacing: { after: 200 },
          }),

          new Paragraph({
            text: "Timeline",
            heading: HeadingLevel.HEADING_2,
          }),
          
          ...pack.timeline.map((t) => 
            new Paragraph({
              text: `• ${t.label} (${t.owner_role}): Days ${t.start_offset_days} - ${t.end_offset_days}`,
            })
          ),
          new Paragraph({ text: "" }),

          new Paragraph({
            text: "Channels",
            heading: HeadingLevel.HEADING_2,
          }),
          
          ...pack.channels.flatMap((ch) => [
            new Paragraph({
              text: ch.channel,
              heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph({ text: `Objective: ${ch.objective}` }),
            new Paragraph({ text: `Cadence: ${ch.cadence}` }),
            new Paragraph({ text: `Key Messages: ${ch.key_messages.join(", ")}` }),
            new Paragraph({ text: "" }),
          ]),

          new Paragraph({
            text: "Assets",
            heading: HeadingLevel.HEADING_2,
          }),
          
          ...pack.assets.map((a) => 
            new Paragraph({
              text: `• ${a.asset_id} (${a.type}): ${a.description} - ${a.owner_role} - Due: Day ${a.needed_by_offset_days}`,
            })
          ),
          new Paragraph({ text: "" }),

          new Paragraph({
            text: "KPIs",
            heading: HeadingLevel.HEADING_2,
          }),
          
          ...pack.kpis.map((k) => 
            new Paragraph({
              text: `• ${k.metric}: ${k.target_value} (${k.measurement_window_days} days)`,
            })
          ),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return {
    fileName: `WI-${workItemId}_LaunchPlan_v${version}.docx`,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer,
  };
}

export async function exportWebsiteAuditPackToDOCX(
  workItemId: number,
  version: number,
  pack: WebsiteAuditPack
): Promise<ExportResult> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "Website Audit Pack",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: `Work Item: WI-${workItemId} | Version: ${version} | Generated: ${new Date().toLocaleString()}`,
            spacing: { after: 200 },
          }),
          
          new Paragraph({
            text: `${pack.site_name} (${pack.environment})`,
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: `Base URL: ${pack.base_url}`,
            spacing: { after: 200 },
          }),

          new Paragraph({
            text: "Summary",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: pack.summary.headline,
            bold: true,
          }),
          new Paragraph({ text: "" }),
          
          new Paragraph({ text: "Key Wins:", bold: true }),
          ...pack.summary.key_wins.map((w) => new Paragraph({ text: `• ${w}` })),
          new Paragraph({ text: "" }),
          
          new Paragraph({ text: "Key Issues:", bold: true }),
          ...pack.summary.key_issues.map((i) => new Paragraph({ text: `• ${i}` })),
          new Paragraph({ text: "" }),

          new Paragraph({
            text: "Pages Audited",
            heading: HeadingLevel.HEADING_2,
          }),
          
          ...pack.pages.map((p) => 
            new Paragraph({
              text: `• [${p.priority.toUpperCase()}] ${p.label}: ${p.url}`,
            })
          ),
          new Paragraph({ text: "" }),

          new Paragraph({
            text: "Findings",
            heading: HeadingLevel.HEADING_2,
          }),
          
          ...pack.findings.flatMap((f) => [
            new Paragraph({
              text: `${f.id} [${f.area} - ${f.severity.toUpperCase()} - Effort: ${f.effort}]`,
              heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph({ text: `Page: ${f.page_url}` }),
            new Paragraph({ text: `Issue: ${f.description}` }),
            new Paragraph({ text: `Fix: ${f.recommendation}` }),
            new Paragraph({ text: "" }),
          ]),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return {
    fileName: `WI-${workItemId}_WebsiteAudit_v${version}.docx`,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer,
  };
}

export async function exportPackToFiles(
  workItemId: number,
  packType: PackType,
  version: number,
  packData: any
): Promise<ExportResult[]> {
  const results: ExportResult[] = [];

  switch (packType) {
    case "lifestyle":
      results.push(await exportLifestylePackToDOCX(workItemId, version, packData));
      results.push(await exportLifestylePackToCSV(workItemId, version, packData));
      break;
    case "patent":
      results.push(await exportPatentPackToDOCX(workItemId, version, packData));
      break;
    case "launch":
      results.push(await exportLaunchPlanPackToDOCX(workItemId, version, packData));
      break;
    case "website_audit":
      results.push(await exportWebsiteAuditPackToDOCX(workItemId, version, packData));
      break;
    default:
      throw new Error(`Unsupported pack type: ${packType}`);
  }

  return results;
}
