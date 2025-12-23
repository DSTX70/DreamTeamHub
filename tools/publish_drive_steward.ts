import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

function reqEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function fetchHistory(urlBase: string, projectKey: string, limit = 25) {
  const url =
    `${urlBase.replace(/\/$/, "")}/api/exports/history?projectKey=${encodeURIComponent(projectKey)}&limit=${limit}`;
  const out = execSync(`curl -sS "${url}"`, { stdio: ["ignore", "pipe", "pipe"] }).toString("utf8");
  try {
    return JSON.parse(out);
  } catch {
    return { ok: false, raw: out };
  }
}

function findNewestTar(exportsDir: string): string {
  const entries = fs.readdirSync(exportsDir)
    .filter(f => f.endsWith(".tar.gz"))
    .map(f => ({ f, mtime: fs.statSync(path.join(exportsDir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  if (!entries.length) throw new Error(`No .tar.gz found in ${exportsDir}`);
  return path.join(exportsDir, entries[0].f);
}

function runCurl(url: string, tarPath: string, token: string, meta: object) {
  const metaJson = JSON.stringify(meta);
  const cmd = [
    `curl -sS -w "\\n__HTTP_CODE__:%{http_code}\\n" -X POST "${url}"`,
    `-H "x-i3-token: ${token}"`,
    `-F "bundle=@${tarPath}"`,
    `-F 'meta=${metaJson}'`,
  ].join(" ");

  const out = execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] }).toString("utf8");
  const m = out.match(/__HTTP_CODE__:(\d{3})\s*$/);
  const code = m ? Number(m[1]) : 0;
  const body = out.replace(/__HTTP_CODE__:\d{3}\s*$/, "").trim();
  return { code, body };
}

async function main() {
  const DRIVE_STEWARD_URL = reqEnv("DRIVE_STEWARD_URL").replace(/\/$/, "");
  const DRIVE_STEWARD_TOKEN = reqEnv("DRIVE_STEWARD_TOKEN");

  const EXPORTS_DIR = path.resolve(process.cwd(), "exports");
  const tarPath = findNewestTar(EXPORTS_DIR);

  // Extract MANIFEST.json from tar to get metadata
  const tmpDir = path.join(EXPORTS_DIR, ".tmp_manifest_extract");
  fs.mkdirSync(tmpDir, { recursive: true });
  execSync(`tar -xzf "${tarPath}" -C "${tmpDir}" "MANIFEST.json"`, { stdio: "inherit" });
  const manifestPath = path.join(tmpDir, "MANIFEST.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  const projectKey = process.env.PROJECT_KEY || manifest.projectKey || "DreamTeamHub";
  const bundleName = path.basename(tarPath);
  const meta = {
    projectKey,
    bundleName,
    version: manifest.version || "0.0.0",
    sha256: manifest.sha256 || "",
    timestamp: manifest.timestamp || new Date().toISOString(),
    releaseHeadSha: manifest.releaseHeadSha || "",
  };

  const override = process.env.DRIVE_STEWARD_PUBLISH_PATH?.trim();

  const candidatePaths = [
    ...(override ? [override] : []),
    "/api/exports/push",
  ];

  let last: { code: number; body: string } | null = null;

  for (const p of candidatePaths) {
    const url = `${DRIVE_STEWARD_URL}${p.startsWith("/") ? "" : "/"}${p}`;
    console.log(`Publishing to Drive Steward: ${url}`);

    last = runCurl(url, tarPath, DRIVE_STEWARD_TOKEN, meta);

    // Success
    if (last.code >= 200 && last.code < 300) {
      console.log(last.body);
      console.log(`✅ Publish succeeded via path: ${p}`);

      // Post-publish verification: ensure SHA is actually in Drive Steward history
      const expectedSha = process.env.EXPECTED_SHA256 || "";

      if (expectedSha) {
        const h = fetchHistory(DRIVE_STEWARD_URL, projectKey, 50);
        const rows = Array.isArray(h?.rows) ? h.rows : [];
        const found = rows.some((r: any) => String(r?.sha256 || "") === expectedSha);
        if (!found) {
          console.error(`FAIL ❌ Publish returned 2xx but history did not include SHA ${expectedSha}`);
          process.exit(1);
        }
        console.log(`Post-verify ✅ history contains SHA ${expectedSha}`);
      } else {
        console.log("Post-verify skipped (set EXPECTED_SHA256 to enforce history inclusion).");
      }

      return;
    }

    // 404 Not found - try next path
    if (last.code === 404) {
      console.log(`Path not found (404): ${p} — trying next path...`);
      continue;
    }

    // Other errors: stop and show response
    console.error(`Publish failed (HTTP ${last.code}) via path: ${p}`);
    console.error(last.body);
    process.exit(1);
  }

  console.error("Publish failed. No candidate endpoint succeeded.");
  if (last) {
    console.error(`Last HTTP ${last.code}`);
    console.error(last.body);
  }
  console.error(
    "If Drive Steward uses a different publish route, set DRIVE_STEWARD_PUBLISH_PATH explicitly."
  );
  process.exit(1);
}

main().catch((e: any) => {
  console.error("FAIL ❌", e?.message || e);
  process.exit(1);
});
