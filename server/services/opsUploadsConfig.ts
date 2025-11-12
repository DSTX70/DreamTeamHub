import { db } from "../db";
import { sql } from "drizzle-orm";

export type EffectiveUploads = {
  enabled: boolean;
  allowlist: string; // Legacy: comma-separated file extensions
  allowed_types?: string[]; // New: array of MIME types
  maxSizeMB: number;
  visibleTo: 'owner' | 'pod' | 'approvers' | 'org';
  list_page_size?: number; // Optional pagination setting
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
    allowed_types: Array.isArray(v.allowed_types) ? v.allowed_types : undefined,
    maxSizeMB: typeof v.max_mb === 'number' ? v.max_mb : (typeof v.max_file_mb === 'number' ? v.max_file_mb : undefined),
    visibleTo: v.visible_to,
    list_page_size: typeof v.list_page_size === 'number' ? v.list_page_size : undefined
  } as Partial<EffectiveUploads>;
}

export async function saveDbUploads(patch: Partial<EffectiveUploads>, userId: string) {
  const rows = await db.execute(
    sql`select value from ops_settings where key = 'uploads' limit 1`
  );
  
  const current = rows.rows.length ? rows.rows[0].value as any : {};
  const next: any = {
    enabled: typeof patch.enabled === 'boolean' ? patch.enabled : (typeof current.enabled === 'boolean' ? current.enabled : DEFAULTS.enabled),
    allowlist: typeof patch.allowlist === 'string' ? patch.allowlist : (current.allowlist || DEFAULTS.allowlist),
    max_mb: typeof patch.maxSizeMB === 'number' ? patch.maxSizeMB : (typeof current.max_mb === 'number' ? current.max_mb : DEFAULTS.maxSizeMB),
    visible_to: patch.visibleTo || current.visible_to || DEFAULTS.visibleTo
  };
  
  // Store allowed_types if provided
  if (Array.isArray(patch.allowed_types)) {
    next.allowed_types = patch.allowed_types;
  } else if (current.allowed_types) {
    next.allowed_types = current.allowed_types;
  }
  
  // Store list_page_size if provided
  if (typeof patch.list_page_size === 'number') {
    next.list_page_size = patch.list_page_size;
  } else if (typeof current.list_page_size === 'number') {
    next.list_page_size = current.list_page_size;
  }
  
  await db.execute(
    sql`insert into ops_settings(key, value, locked, updated_by, updated_at)
        values ('uploads', ${JSON.stringify(next)}::jsonb, false, ${userId}, now())
        on conflict(key) do update set value = ${JSON.stringify(next)}::jsonb, updated_by = ${userId}, updated_at = now()`
  );
}

export async function getEffectiveUploadsConfig() {
  const dbConfig = await getDbUploads();
  const effective: EffectiveUploads = {
    enabled: dbConfig.enabled ?? DEFAULTS.enabled,
    allowlist: dbConfig.allowlist ?? DEFAULTS.allowlist,
    maxSizeMB: clamp(Number(dbConfig.maxSizeMB ?? DEFAULTS.maxSizeMB), 1, 200),
    visibleTo: (dbConfig.visibleTo as any) ?? DEFAULTS.visibleTo
  };
  
  // Include allowed_types if present
  if (Array.isArray(dbConfig.allowed_types) && dbConfig.allowed_types.length > 0) {
    effective.allowed_types = dbConfig.allowed_types;
  }
  
  // Include list_page_size if present
  if (typeof dbConfig.list_page_size === 'number') {
    effective.list_page_size = dbConfig.list_page_size;
  }
  
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
  
  // Support both max_file_mb and maxSizeMB
  if ('max_file_mb' in patch) {
    const n = Number(patch.max_file_mb);
    if (!Number.isFinite(n)) throw new Error('invalid_max_file_mb');
    p.maxSizeMB = Math.max(1, Math.min(200, n));
  } else if ('maxSizeMB' in patch) {
    const n = Number(patch.maxSizeMB);
    if (!Number.isFinite(n)) throw new Error('invalid_maxSizeMB');
    p.maxSizeMB = Math.max(1, Math.min(200, n));
  }
  
  if ('visibleTo' in patch) {
    const v = String(patch.visibleTo);
    if (!validVisibleTo(v)) throw new Error('invalid_visibleTo');
    p.visibleTo = v as any;
  }
  
  // Handle allowed_types array (MIME types)
  if ('allowed_types' in patch) {
    if (!Array.isArray(patch.allowed_types)) {
      throw new Error('allowed_types must be an array');
    }
    // Validate MIME types
    const types = patch.allowed_types.map((t: any) => String(t).trim().toLowerCase()).filter(Boolean);
    for (const type of types) {
      if (!/^[a-z0-9]+\/[a-z0-9\-\+\.]+$/i.test(type)) {
        throw new Error(`Invalid MIME type: ${type}`);
      }
    }
    p.allowed_types = types;
  }
  
  // Handle list_page_size
  if ('list_page_size' in patch) {
    const n = Number(patch.list_page_size);
    if (!Number.isFinite(n) || n < 1) throw new Error('invalid_list_page_size');
    p.list_page_size = Math.max(1, Math.min(500, n));
  }
  
  await saveDbUploads(p, userId);
  return getEffectiveUploadsConfig();
}
