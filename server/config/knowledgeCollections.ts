export type CollectionType = "lifestyle_packs" | "patent_packs" | "launch_packs" | "website_audit_packs";

export interface KnowledgeCollectionConfig {
  collection: CollectionType;
  driveFolderId: string;
  label: string;
  description: string;
}

export const knowledgeCollections: KnowledgeCollectionConfig[] = [
  {
    collection: "lifestyle_packs",
    driveFolderId: process.env.DRIVE_LIFESTYLE_PACKS_FOLDER || "",
    label: "Lifestyle Packs",
    description: "Indexed lifestyle photography shot boards and export plans",
  },
  {
    collection: "patent_packs",
    driveFolderId: process.env.DRIVE_PATENT_PACKS_FOLDER || "",
    label: "Patent Claims Packs",
    description: "Indexed patent claims specifications",
  },
  {
    collection: "launch_packs",
    driveFolderId: process.env.DRIVE_LAUNCH_PACKS_FOLDER || "",
    label: "Launch Plan Packs",
    description: "Indexed marketing launch plans and timelines",
  },
  {
    collection: "website_audit_packs",
    driveFolderId: process.env.DRIVE_AUDIT_PACKS_FOLDER || "",
    label: "Website Audit Packs",
    description: "Indexed website audit findings and recommendations",
  },
];

export function getCollectionFolder(collection: CollectionType): string {
  const config = knowledgeCollections.find((c) => c.collection === collection);
  if (!config || !config.driveFolderId) {
    throw new Error(`Drive folder not configured for collection: ${collection}`);
  }
  return config.driveFolderId;
}

export function getCollectionConfig(collection: CollectionType): KnowledgeCollectionConfig {
  const config = knowledgeCollections.find((c) => c.collection === collection);
  if (!config) {
    throw new Error(`Unknown collection: ${collection}`);
  }
  return config;
}
