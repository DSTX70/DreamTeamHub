import { db } from "@db";
import { sql } from "drizzle-orm";

export type EffectiveUploads = {
  enabled: boolean;
  allowlist: string;
  maxSizeMB: number;
  visibleTo: 'owner' | 'pod' | 'approvers' | 'org';
};

export type Locked = { backend: boolean };

const ENV_LOCKED = { backend: !!process.env.UPLOADS_BACKEND };

function envBackend(): 'local' | 'drive' | 's3' {
  const b = (process.env.UPLOADS_BACKEND || 's3').toLowerCase();
  if (b === 'drive' || b === 'local') return b;
  return 's3';
}

const DEFAULTS: EffectiveUploads = {
  enabled: true,
  allowlist: 'json,csv,zip,webp,png,svg,txt,md,pdf,doc,docx,xls,xlsx,jpg,jpeg',
  maxSizeMB: 25,
  visibleTo: 'pod'
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export async function getDbUploads(): Promise<Partial<EffectiveUploads>> {
  const rows = await db.execute(
    sql`select value from ops_settings where key = 'uploads' limit 1`
  );
  
  if (!rows.rows.length) return {};
  
  const v = rows.rows[0].value as any || {};
  return {
    enabled: typeof v.enabled === 'boolean' ? v.enabled : undefined,
    allowlist: typeof v.allowlist === 'string' ? v.allowlist : undefined,
    maxSizeMB: typeof v.max_mb === 'number' ? v.max_mb : undefined,
    visibleTo: v.visible_to
  } as Partial<EffectiveUploads>;
}

export async function saveDbUploads(patch: Partial<EffectiveUploads>, userId: string) {
  const rows = await db.execute(
    sql`select value from ops_settings where key = 'uploads' limit 1`
  );
  
  const current = rows.rows.length ? rows.rows[0].value as any : {};
  const next = {
    enabled: typeof patch.enabled === 'boolean' ? patch.enabled : (typeof current.enabled === 'boolean' ? current.enabled : DEFAULTS.enabled),
    allowlist: typeof patch.allowlist === 'string' ? patch.allowlist : (current.allowlist || DEFAULTS.allowlist),
    max_mb: typeof patch.maxSizeMB === 'number' ? patch.maxSizeMB : (typeof current.max_mb === 'number' ? current.max_mb : DEFAULTS.maxSizeMB),
    visible_to: patch.visibleTo || current.visible_to || DEFAULTS.visibleTo
  };
  
  await db.execute(
    sql`insert into ops_settings(key, value, locked, updated_by, updated_at)
        values ('uploads', ${JSON.stringify(next)}::jsonb, false, ${userId}, now())
        on conflict(key) do update set value = ${JSON.stringify(next)}::jsonb, updated_by = ${userId}, updated_at = now()`
  );
}

export async function getEffectiveUploadsConfig() {
  const db = await getDbUploads();
  const effective: EffectiveUploads = {
    enabled: db.enabled ?? DEFAULTS.enabled,
    allowlist: db.allowlist ?? DEFAULTS.allowlist,
    maxSizeMB: clamp(Number(db.maxSizeMB ?? DEFAULTS.maxSizeMB), 1, 200),
    visibleTo: (db.visibleTo as any) ?? DEFAULTS.visibleTo
  };
  const locked: Locked = { backend: ENV_LOCKED.backend };
  const backend = envBackend();
  return { backend, effective, locked };
}

function validAllowlist(s: string) {
  return /^[a-z0-9,._-]+$/.test(s) && s.length <= 200;
}

function validVisibleTo(v: string): v is EffectiveUploads['visibleTo'] {
  return ['owner', 'pod', 'approvers', 'org'].includes(v);
}

export async function updateUploadsConfig(patch: any, userId: string) {
  const p: Partial<EffectiveUploads> = {};
  
  if ('enabled' in patch) p.enabled = !!patch.enabled;
  
  if ('allowlist' in patch) {
    const cleaned = String(patch.allowlist)
      .split(',')
      .map((t: string) => t.trim().toLowerCase())
      .filter(Boolean)
      .join(',');
    if (!validAllowlist(cleaned)) throw new Error('invalid_allowlist');
    p.allowlist = cleaned;
  }
  
  if ('maxSizeMB' in patch) {
    const n = Number(patch.maxSizeMB);
    if (!Number.isFinite(n)) throw new Error('invalid_maxSizeMB');
    p.maxSizeMB = Math.max(1, Math.min(200, n));
  }
  
  if ('visibleTo' in patch) {
    const v = String(patch.visibleTo);
    if (!validVisibleTo(v)) throw new Error('invalid_visibleTo');
    p.visibleTo = v as any;
  }
  
  await saveDbUploads(p, userId);
  return getEffectiveUploadsConfig();
}
