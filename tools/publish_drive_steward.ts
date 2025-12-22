import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

function reqEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function safeEnv(name: string, fallback: string) {
  return process.env[name] || fallback;
}

function findNewestTar(exportsDir: string): string {
  const entries = fs.readdirSync(exportsDir)
    .filter(f => f.endsWith(".tar.gz"))
    .map(f => ({ f, mtime: fs.statSync(path.join(exportsDir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  if (!entries.length) throw new Error(`No .tar.gz found in ${exportsDir}`);
  return path.join(exportsDir, entries[0].f);
}

async function main() {
  const DRIVE_STEWARD_URL = reqEnv("DRIVE_STEWARD_URL").replace(/\/$/, "");
  const DRIVE_STEWARD_TOKEN = reqEnv("DRIVE_STEWARD_TOKEN");
  const PUBLISH_PATH = safeEnv("DRIVE_STEWARD_PUBLISH_PATH", "/api/exports/publish");

  const EXPORTS_DIR = path.resolve(process.cwd(), "exports");
  const tarPath = findNewestTar(EXPORTS_DIR);

  // Extract MANIFEST.json from tar to upload alongside
  const tmpDir = path.join(EXPORTS_DIR, ".tmp_manifest_extract");
  fs.mkdirSync(tmpDir, { recursive: true });
  execSync(`tar -xzf "${tarPath}" -C "${tmpDir}" "MANIFEST.json"`, { stdio: "inherit" });
  const manifestPath = path.join(tmpDir, "MANIFEST.json");

  const url = `${DRIVE_STEWARD_URL}${PUBLISH_PATH}`;

  // Multipart upload via curl (keeps this repo dependency-light)
  // Server expected fields: bundle + manifest; if your Drive Steward uses different field names, adjust here.
  const cmd = [
    `curl -sS -X POST "${url}"`,
    `-H "Authorization: Bearer ${DRIVE_STEWARD_TOKEN}"`,
    `-F "bundle=@${tarPath}"`,
    `-F "manifest=@${manifestPath}"`,
  ].join(" ");

  console.log(`Publishing to Drive Steward: ${url}`);
  const out = execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] }).toString("utf8");
  console.log(out);
}

main().catch((e: any) => {
  console.error("FAIL ❌", e?.message || e);
  process.exit(1);
});
