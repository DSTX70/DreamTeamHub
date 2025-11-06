import crypto from "crypto";
import path from "path";
import { s3Put, s3List } from "./s3";
import { makeVariants, DEFAULT_PLAN } from "./transform";

type AllowItem = { sku: string; baseKey: string };
const allowlist = new Map<string, string>(); // sku -> baseKey

export function listAllowlist(): AllowItem[] {
  return Array.from(allowlist.entries()).map(([sku, baseKey]) => ({ sku, baseKey }));
}
export function upsertAllowlist(sku: string, baseKey: string) {
  allowlist.set(sku, baseKey);
}
export function removeAllowlist(sku: string) {
  allowlist.delete(sku);
}
export function ensureAllowedSku(sku: string, baseKey?: string) {
  const expected = allowlist.get(sku);
  if (!expected) throw new Error(`SKU ${sku} not allowlisted`);
  if (baseKey && expected !== baseKey) throw new Error(`Base key mismatch for ${sku} (expected ${expected})`);
}

function sha256(buf: Buffer) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

export async function uploadTransformedSet(input: { sku: string; baseKey: string; filename: string; bytes: Buffer; cacheControl?: string }) {
  const { baseKey, bytes, filename, cacheControl } = input;
  const baseName = path.parse(filename).name;
  const hash = sha256(bytes).slice(0, 8);
  const keyPrefix = `${baseKey}/${baseName}-${hash}`;

  const variants = await makeVariants(bytes, DEFAULT_PLAN);

  let totalBytes = 0;
  const uploaded = [];
  for (const v of variants) {
    const key = `${keyPrefix}-${v.width}.${v.ext}`;
    await s3Put(key, v.buffer, v.contentType, cacheControl);
    uploaded.push({ key, width: v.width, ext: v.ext, size: v.buffer.length });
    totalBytes += v.buffer.length;
  }

  return {
    baseKey,
    original: { filename, sha256: hash },
    uploaded,
    totalBytes
  };
}

export async function listVariants(baseKey: string) {
  const items = await s3List(baseKey);
  // basic parse back width/ext from key
  return items.map(i => {
    const m = i.key.match(/-(\d+)\.(avif|webp|jpg)$/);
    return { key: i.key, size: i.size, width: m ? Number(m[1]) : undefined, ext: m ? m[2] : undefined };
  });
}
