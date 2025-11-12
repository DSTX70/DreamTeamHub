
export type UploaderConfig = {
  backend?: 'local'|'drive'|'s3'|'env';
  max_file_mb?: number;
  allowed_types?: string[];
  list_page_size?: number;
  env_locked?: boolean;
  effective?: { visibleTo?: 'owner'|'pod'|'approvers'|'org' };
};

export async function getConfig(): Promise<UploaderConfig> {
  const res = await fetch('/api/ops/uploader/config', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load config');
  return res.json();
}

export async function saveConfig(body: Partial<UploaderConfig>, opts?: { devRoleHeader?: boolean }) {
  const headers: Record<string,string> = { 'Content-Type':'application/json' };
  if (opts?.devRoleHeader) headers['x-role'] = 'ops_admin';
  const res = await fetch('/api/ops/uploader/config', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to save config');
  return res.json();
}

export type WorkFile = {
  id: string; name: string; mime: string; size_bytes: number;
  visible_to: 'owner'|'pod'|'approvers'|'org';
  created_at: string; storage_uri: string;
  work_item_id?: number;
};

export async function listFiles(workItemId: string|number): Promise<WorkFile[]> {
  const res = await fetch(`/api/workitems/${encodeURIComponent(String(workItemId))}/files`, { credentials:'include' });
  if (!res.ok) throw new Error('Failed to list files');
  return res.json();
}

export async function uploadFile(workItemId: string|number, file: File, visible_to: WorkFile['visible_to']='org') {
  const fd = new FormData();
  fd.set('work_item_id', String(workItemId));
  fd.set('visible_to', visible_to);
  fd.set('file', file);
  const res = await fetch('/api/ops/uploader/upload', { method:'POST', body: fd, credentials:'include' });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

export async function listWorkOrderFiles(woId: string) {
  const res = await fetch(`/api/work-orders/${encodeURIComponent(woId)}/files`, { credentials:'include' });
  if (!res.ok) throw new Error('Failed to list work order files');
  return res.json();
}

export async function getDefaultVisibility(): Promise<'owner'|'pod'|'approvers'|'org'> {
  const cfg = await getConfig();
  const v = (cfg as any)?.effective?.visibleTo ?? 'org';
  const map = { owner:'owner', pod:'pod', approvers:'approvers', org:'org' } as const;
  return (map as any)[String(v)] || 'org';
}
