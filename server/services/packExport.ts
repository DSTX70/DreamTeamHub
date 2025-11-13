import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType } from "docx";
import type { LifestylePack } from "../ai/schemas/lifestylePack";
import type { PatentClaimsPack } from "../ai/schemas/patentClaimsPack";
import type { LaunchPlanPack } from "../ai/schemas/launchPlanPack";
import type { WebsiteAuditPack } from "../ai/schemas/websiteAuditPack";
import type { PackType } from "../ai/packRegistry";

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

async function exportRiskCompliancePackToDOCX(
  workItemId: number,
  version: number,
  pack: any
): Promise<ExportResult> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "Risk & Compliance Pack",
            heading: HeadingLevel.TITLE,
          }),
          new Paragraph({ text: `Work Item: ${workItemId} | Version: ${version}` }),
          new Paragraph({ text: "" }),

          new Paragraph({
            text: "Summary",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({ text: pack.summary?.headline || "N/A" }),
          new Paragraph({ text: `Overall Risk: ${pack.summary?.overall_risk?.toUpperCase() || "N/A"}` }),
          new Paragraph({ text: "" }),

          new Paragraph({
            text: "Key Concerns",
            heading: HeadingLevel.HEADING_2,
          }),
          ...(pack.summary?.key_concerns || []).map((c: string) => new Paragraph({ text: `• ${c}` })),
          new Paragraph({ text: "" }),

          new Paragraph({
            text: "Key Mitigations",
            heading: HeadingLevel.HEADING_2,
          }),
          ...(pack.summary?.key_mitigations || []).map((m: string) => new Paragraph({ text: `• ${m}` })),
          new Paragraph({ text: "" }),

          new Paragraph({
            text: "Risks",
            heading: HeadingLevel.HEADING_1,
          }),
          ...(pack.risks || []).flatMap((r: any) => [
            new Paragraph({
              text: `${r.id} [${r.area} - ${r.severity.toUpperCase()} severity, ${r.likelihood.toUpperCase()} likelihood]`,
              heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph({ text: `Description: ${r.description}` }),
            new Paragraph({ text: `Impact: ${r.impact}` }),
            new Paragraph({ text: `Mitigation (${r.owner_role}, ${r.time_horizon}): ${r.recommendation}` }),
            new Paragraph({ text: "" }),
          ]),

          new Paragraph({
            text: "Controls",
            heading: HeadingLevel.HEADING_1,
          }),
          ...(pack.controls || []).map((c: any) => 
            new Paragraph({ text: `• ${c.id} (${c.category}, ${c.owner_role})${c.required ? ' [REQUIRED]' : ''}: ${c.description}` })
          ),
          new Paragraph({ text: "" }),

          new Paragraph({
            text: "Compliance Notes",
            heading: HeadingLevel.HEADING_1,
          }),
          ...(pack.compliance_notes || []).map((cn: any) => 
            new Paragraph({ text: `• ${cn.regime} [${cn.status.toUpperCase()}]: ${cn.note}` })
          ),
          new Paragraph({ text: "" }),

          ...(pack.open_questions && pack.open_questions.length > 0 ? [
            new Paragraph({
              text: "Open Questions",
              heading: HeadingLevel.HEADING_1,
            }),
            ...(pack.open_questions || []).map((q: string) => new Paragraph({ text: `• ${q}` })),
          ] : []),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return {
    fileName: `WI-${workItemId}_RiskCompliance_v${version}.docx`,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer,
  };
}

async function exportAgentLabAcademyPackToDOCX(
  workItemId: number,
  version: number,
  pack: any
): Promise<ExportResult> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "Agent Lab Academy Pack",
            heading: HeadingLevel.TITLE,
          }),
          new Paragraph({ text: `Work Item: ${workItemId} | Version: ${version}` }),
          new Paragraph({ text: "" }),

          new Paragraph({
            text: "Summary",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({ text: pack.summary?.headline || "N/A" }),
          new Paragraph({ text: `Primary Audience: ${pack.summary?.primary_audience || "N/A"}` }),
          new Paragraph({ text: "" }),

          new Paragraph({
            text: "Key Outcomes",
            heading: HeadingLevel.HEADING_2,
          }),
          ...(pack.summary?.key_outcomes || []).map((o: string) => new Paragraph({ text: `• ${o}` })),
          new Paragraph({ text: "" }),

          new Paragraph({
            text: "Tracks",
            heading: HeadingLevel.HEADING_1,
          }),
          ...(pack.tracks || []).flatMap((t: any) => [
            new Paragraph({
              text: `${t.name} (${t.id})`,
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: `Audience: ${t.audience}` }),
            new Paragraph({ text: `Modules: ${t.modules?.length || 0}` }),
            new Paragraph({ text: `Objectives: ${t.objectives?.join(', ') || 'None'}` }),
            new Paragraph({ text: `Prerequisites: ${t.prerequisites?.length > 0 ? t.prerequisites.join(', ') : 'None'}` }),
            new Paragraph({ text: "" }),
          ]),

          new Paragraph({
            text: "Certifications",
            heading: HeadingLevel.HEADING_1,
          }),
          ...(pack.certifications || []).flatMap((cert: any) => [
            new Paragraph({
              text: `${cert.name} (${cert.level})`,
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: `Target Role: ${cert.target_role}` }),
            new Paragraph({ text: `Required Tracks: ${cert.required_tracks?.join(', ') || 'None'}` }),
            new Paragraph({ text: `Exam Format: ${cert.exam_format}` }),
            new Paragraph({ text: "" }),
          ]),

          new Paragraph({
            text: "Logistics",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({ text: `Cohort Length: ${pack.logistics?.cohort_length_weeks || 0} weeks` }),
          new Paragraph({ text: `Cadence: ${pack.logistics?.cadence || 'N/A'}` }),
          new Paragraph({ text: `Max Seats: ${pack.logistics?.max_seats || 0}` }),
          new Paragraph({ text: `Delivery Model: ${pack.logistics?.delivery_model || 'N/A'}` }),
          new Paragraph({ text: "" }),

          ...(pack.open_questions && pack.open_questions.length > 0 ? [
            new Paragraph({
              text: "Open Questions",
              heading: HeadingLevel.HEADING_1,
            }),
            ...(pack.open_questions || []).map((q: string) => new Paragraph({ text: `• ${q}` })),
          ] : []),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return {
    fileName: `WI-${workItemId}_AgentLabAcademy_v${version}.docx`,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer,
  };
}

/**
 * Generic DOCX exporter that converts any pack structure to formatted Word document
 */
async function exportGenericPackToDOCX(
  workItemId: number,
  packType: string,
  packLabel: string,
  version: number,
  packData: any
): Promise<ExportResult> {
  const children: Paragraph[] = [
    new Paragraph({
      text: packLabel,
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      text: `Work Item: WI-${workItemId} | Version: ${version} | Generated: ${new Date().toLocaleString()}`,
      spacing: { after: 200 },
    }),
  ];

  // Recursively convert pack data to paragraphs
  function addObjectToParagraphs(obj: any, level: number = 2): void {
    if (!obj || typeof obj !== 'object') return;

    Object.entries(obj).forEach(([key, value]) => {
      const headingLevel = Math.min(level, 6) as HeadingLevel;
      const title = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

      if (Array.isArray(value)) {
        children.push(new Paragraph({
          text: title,
          heading: headingLevel,
        }));

        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            children.push(new Paragraph({
              text: `${title} ${index + 1}`,
              heading: Math.min(level + 1, 6) as HeadingLevel,
            }));
            addObjectToParagraphs(item, level + 2);
          } else {
            children.push(new Paragraph({
              text: `• ${String(item)}`,
            }));
          }
        });
        children.push(new Paragraph({ text: "" }));
      } else if (typeof value === 'object' && value !== null) {
        children.push(new Paragraph({
          text: title,
          heading: headingLevel,
        }));
        addObjectToParagraphs(value, level + 1);
      } else {
        children.push(new Paragraph({
          text: `${title}: ${String(value)}`,
        }));
      }
    });
  }

  addObjectToParagraphs(packData);

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return {
    fileName: `WI-${workItemId}_${packType}_v${version}.docx`,
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
    case "risk_compliance":
      results.push(await exportRiskCompliancePackToDOCX(workItemId, version, packData));
      break;
    case "agent_lab_academy":
      results.push(await exportAgentLabAcademyPackToDOCX(workItemId, version, packData));
      break;
    
    // New pack types: Use generic DOCX exporter
    case "agent_governance":
      results.push(await exportGenericPackToDOCX(workItemId, packType, "Agent Governance Pack", version, packData));
      break;
    case "pricing_monetization":
      results.push(await exportGenericPackToDOCX(workItemId, packType, "Pricing & Monetization Pack", version, packData));
      break;
    case "data_stewardship_metrics":
      results.push(await exportGenericPackToDOCX(workItemId, packType, "Data Stewardship & Metrics Pack", version, packData));
      break;
    case "globalcollabs_partnership":
      results.push(await exportGenericPackToDOCX(workItemId, packType, "GlobalCollabs Partnership Pack", version, packData));
      break;
    case "packaging_prepress":
      results.push(await exportGenericPackToDOCX(workItemId, packType, "Packaging & Pre-Press Pack", version, packData));
      break;
    case "product_line_sku_tree":
      results.push(await exportGenericPackToDOCX(workItemId, packType, "Product Line & SKU Tree Pack", version, packData));
      break;
    case "ecom_pdp_aplus_content":
      results.push(await exportGenericPackToDOCX(workItemId, packType, "E-Com PDP & A+ Content Pack", version, packData));
      break;
    case "social_campaign_content_calendar":
      results.push(await exportGenericPackToDOCX(workItemId, packType, "Social Campaign & Content Calendar Pack", version, packData));
      break;
    case "implementation_runbook_sop":
      results.push(await exportGenericPackToDOCX(workItemId, packType, "Implementation Runbook & SOP Pack", version, packData));
      break;
    case "support_playbook_knowledge_base":
      results.push(await exportGenericPackToDOCX(workItemId, packType, "Support Playbook & Knowledge Base Pack", version, packData));
      break;
    case "retail_wholesale_readiness":
      results.push(await exportGenericPackToDOCX(workItemId, packType, "Retail & Wholesale Readiness Pack", version, packData));
      break;
    case "experiment_optimization":
      results.push(await exportGenericPackToDOCX(workItemId, packType, "Experiment & Optimization Pack", version, packData));
      break;
    case "localization_market_expansion":
      results.push(await exportGenericPackToDOCX(workItemId, packType, "Localization & Market Expansion Pack", version, packData));
      break;
    case "customer_journey_lifecycle":
      results.push(await exportGenericPackToDOCX(workItemId, packType, "Customer Journey & Lifecycle Pack", version, packData));
      break;
    
    default:
      throw new Error(`Unsupported pack type: ${packType}`);
  }

  return results;
}
