/**
 * Client helpers for work order file operations
 */

export interface WorkOrderFile {
  work_order_id: string;
  file_id: number;
  work_item_id: number;
  name: string;
  mime: string | null;
  size_bytes: number;
  storage_uri: string;
  created_at: Date;
}

export interface WorkOrderFilesResponse {
  ok: boolean;
  work_order_id: string;
  files: WorkOrderFile[];
}

export interface UploaderConfig {
  backend: 'local' | 'drive' | 's3';
  effective: {
    enabled: boolean;
    allowlist: string;
    maxSizeMB: number;
    visibleTo: 'owner' | 'pod' | 'approvers' | 'org';
  };
  locked: { backend: boolean };
}

/**
 * List all files for a work order (aggregates across all linked work items)
 */
export async function listWorkOrderFiles(woId: string): Promise<WorkOrderFilesResponse> {
  const res = await fetch(`/api/work-orders/${encodeURIComponent(woId)}/files`, { 
    credentials: 'include' 
  });
  if (!res.ok) throw new Error('Failed to list work order files');
  return res.json();
}

/**
 * Get uploader configuration
 */
export async function getConfig(): Promise<UploaderConfig> {
  const res = await fetch('/api/ops/uploader/config', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to get uploader config');
  return res.json();
}

/**
 * Get default visibility from effective config
 */
export async function getDefaultVisibility(): Promise<'owner' | 'pod' | 'approvers' | 'org'> {
  const cfg = await getConfig();
  const v = cfg?.effective?.visibleTo ?? 'org';
  const map = { owner: 'owner', pod: 'pod', approvers: 'approvers', org: 'org' } as const;
  return (map as any)[String(v)] || 'org';
}
