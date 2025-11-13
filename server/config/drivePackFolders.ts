import { PACK_REGISTRY } from "../ai/packRegistry";

export type PackType = string;

export interface PackFolderConfig {
  packType: string;
  driveFolderId: string;
  label: string;
  description: string;
}

// Generate pack folder configurations from PACK_REGISTRY
// Uses the driveFolder field from each pack config to get environment variable name
export const packFolders: PackFolderConfig[] = PACK_REGISTRY
  .filter(pack => pack.driveFolder) // Only include packs with Drive folder configured
  .map(pack => ({
    packType: pack.packType,
    driveFolderId: process.env[pack.driveFolder] || "",
    label: pack.label,
    description: `AI-generated ${pack.label.toLowerCase()} specification`,
  }));

export function getPackFolder(packType: string): string {
  const config = packFolders.find((f) => f.packType === packType);
  if (!config) {
    throw new Error(`Drive folder not configured for pack type: ${packType}`);
  }
  if (!config.driveFolderId) {
    throw new Error(`Drive folder environment variable not set for pack type: ${packType}. Check ${PACK_REGISTRY.find(p => p.packType === packType)?.driveFolder}`);
  }
  return config.driveFolderId;
}
