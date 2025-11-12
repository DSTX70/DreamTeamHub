import { Pool } from 'pg';

export type EffectiveUploads = {
  enabled: boolean;
  allowlist: string;
  maxMb: number;
  visible_to: 'owner'|'pod'|'approvers'|'org';
};
export type Locked = { backend: boolean };

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const ENV_LOCKED = { backend: !!process.env.UPLOADS_BACKEND };

function envBackend(): 'local'|'drive'|'s3' {
  const b = (process.env.UPLOADS_BACKEND || 'local').toLowerCase();
  if (b === 'drive' || b === 's3') return b;
  return 'local';
}

const DEFAULTS: EffectiveUploads = { enabled:true, allowlist:'json,csv,zip,webp,png,svg,txt,md', maxMb:25, visible_to:'pod' };
function clamp(n:number,min:number,max:number){ return Math.max(min, Math.min(max, n)); }

export async function getDbUploads(): Promise<Partial<EffectiveUploads>> {
  const { rows } = await pool.query('select value from ops_settings where key=$1 limit 1', ['uploads']);
  if (!rows.length) return {};
  const v = rows[0].value || {};
  return {
    enabled: typeof v.enabled === 'boolean' ? v.enabled : undefined,
    allowlist: typeof v.allowlist === 'string' ? v.allowlist : undefined,
    maxMb: typeof v.max_mb === 'number' ? v.max_mb : undefined,
    visible_to: v.visible_to
  } as Partial<EffectiveUploads>;
}

export async function saveDbUploads(patch: Partial<EffectiveUploads>, userId: string){
  const { rows } = await pool.query('select value from ops_settings where key=$1 limit 1', ['uploads']);
  const current = rows.length ? rows[0].value : {};
  const next = {
    enabled: typeof patch.enabled === 'boolean' ? patch.enabled : (typeof current.enabled === 'boolean' ? current.enabled : DEFAULTS.enabled),
    allowlist: typeof patch.allowlist === 'string' ? patch.allowlist : (current.allowlist || DEFAULTS.allowlist),
    max_mb: typeof patch.maxMb === 'number' ? patch.maxMb : (typeof current.max_mb === 'number' ? current.max_mb : DEFAULTS.maxMb),
    visible_to: patch.visible_to || current.visible_to || DEFAULTS.visible_to
  };
  await pool.query('insert into ops_settings(key,value,locked,updated_by,updated_at) values ($1,$2,false,$3,now()) on conflict(key) do update set value=$2, updated_by=$3, updated_at=now()', ['uploads', next, userId]);
}

export async function getEffectiveUploadsConfig(){
  const db = await getDbUploads();
  const effective: EffectiveUploads = {
    enabled: db.enabled ?? DEFAULTS.enabled,
    allowlist: db.allowlist ?? DEFAULTS.allowlist,
    maxMb: clamp(Number(db.maxMb ?? DEFAULTS.maxMb), 1, 200),
    visible_to: (db.visible_to as any) ?? DEFAULTS.visible_to
  };
  const locked: Locked = { backend: ENV_LOCKED.backend };
  const backend = envBackend();
  return { backend, effective, locked };
}

function validAllowlist(s:string){ return /^[a-z0-9,._-]+$/.test(s) && s.length <= 200; }
function validVisibleTo(v:string): v is EffectiveUploads['visible_to']{ return ['owner','pod','approvers','org'].includes(v); }

export async function updateUploadsConfig(patch:any, userId:string){
  const p: Partial<EffectiveUploads> = {};
  if ('enabled' in patch) p.enabled = !!patch.enabled;
  if ('allowlist' in patch) {
    const cleaned = String(patch.allowlist).split(',').map((t:string)=>t.trim().toLowerCase()).filter(Boolean).join(',');
    if (!validAllowlist(cleaned)) throw new Error('invalid_allowlist');
    p.allowlist = cleaned;
  }
  if ('maxMb' in patch) {
    const n = Number(patch.maxMb);
    if (!Number.isFinite(n)) throw new Error('invalid_maxMb');
    p.maxMb = Math.max(1, Math.min(200, n));
  }
  if ('visible_to' in patch) {
    const v = String(patch.visible_to);
    if (!validVisibleTo(v)) throw new Error('invalid_visible_to');
    p.visible_to = v as any;
  }
  await saveDbUploads(p, userId);
  return getEffectiveUploadsConfig();
}
