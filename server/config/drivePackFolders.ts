export type PackType = "lifestyle" | "patent" | "launch" | "website_audit" | "risk_compliance" | "agent_lab_academy";

export interface PackFolderConfig {
  packType: PackType;
  driveFolderId: string;
  label: string;
  description: string;
}

export const packFolders: PackFolderConfig[] = [
  {
    packType: "lifestyle",
    driveFolderId: process.env.DRIVE_LIFESTYLE_PACKS_FOLDER || "",
    label: "Lifestyle Packs",
    description: "AI-generated lifestyle photography shot boards and export plans",
  },
  {
    packType: "patent",
    driveFolderId: process.env.DRIVE_PATENT_PACKS_FOLDER || "",
    label: "Patent Claims Packs",
    description: "AI-generated patent claims specifications",
  },
  {
    packType: "launch",
    driveFolderId: process.env.DRIVE_LAUNCH_PACKS_FOLDER || "",
    label: "Launch Plan Packs",
    description: "AI-generated marketing launch plans and timelines",
  },
  {
    packType: "website_audit",
    driveFolderId: process.env.DRIVE_AUDIT_PACKS_FOLDER || "",
    label: "Website Audit Packs",
    description: "AI-generated website audit findings and recommendations",
  },
  {
    packType: "risk_compliance",
    driveFolderId: process.env.DRIVE_RISK_COMPLIANCE_PACKS_FOLDER || "",
    label: "Risk & Compliance Packs",
    description: "AI-generated risk assessments and compliance guidance",
  },
  {
    packType: "agent_lab_academy",
    driveFolderId: process.env.DRIVE_AGENT_LAB_ACADEMY_PACKS_FOLDER || "",
    label: "Agent Lab Academy Packs",
    description: "AI-generated training programs and certification paths",
  },
];

export function getPackFolder(packType: PackType): string {
  const config = packFolders.find((f) => f.packType === packType);
  if (!config || !config.driveFolderId) {
    throw new Error(`Drive folder not configured for pack type: ${packType}`);
  }
  return config.driveFolderId;
}
