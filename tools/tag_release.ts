import { execSync } from "node:child_process";

function out(cmd: string, cwd?: string): string {
  return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"], cwd }).toString("utf8").trim();
}
function run(cmd: string, cwd?: string) {
  execSync(cmd, { stdio: "inherit", cwd });
}

function isoStampUTC(): string {
  const iso = new Date().toISOString(); // UTC
  const y = iso.slice(0, 4);
  const m = iso.slice(5, 7);
  const d = iso.slice(8, 10);
  const hh = iso.slice(11, 13);
  const mm = iso.slice(14, 16);
  const ss = iso.slice(17, 19);
  return `${y}${m}${d}_${hh}${mm}${ss}Z`;
}

async function main() {
  const projectKey = (process.env.PROJECT_KEY || "").trim();
  if (!projectKey) throw new Error("PROJECT_KEY is required (e.g., VSuite, BroadcastHub, DreamTeamHub)");

  const remote = process.env.REMOTE || "origin";
  const push = process.env.PUSH_TAG === "1";
  const dryRun = process.env.DRY_RUN === "1";

  const top = out("git rev-parse --show-toplevel");
  const headShort = out("git rev-parse --short HEAD", top);

  const stamp = isoStampUTC();
  const tag = `i3/${projectKey}/r${stamp}`;
  const msg = `i3 release ${projectKey} ${stamp} (${headShort})`;

  // guard
  const exists = (() => {
    try { out(`git rev-parse -q --verify "refs/tags/${tag}"`, top); return true; }
    catch { return false; }
  })();
  if (exists) throw new Error(`Tag already exists: ${tag}`);

  console.log(`\nRepo: ${top}`);
  console.log(`HEAD: ${headShort}`);
  console.log(`TAG:  ${tag}`);
  console.log(`PUSH: ${push ? `yes (${remote})` : "no"}`);
  console.log(`MODE: ${dryRun ? "DRY_RUN" : "LIVE"}`);

  if (dryRun) return;

  run(`git tag -a "${tag}" -m "${msg}"`, top);
  if (push) run(`git push ${remote} "${tag}"`, top);

  console.log(`\n✅ Created${push ? " + pushed" : ""} tag: ${tag}\n`);
}

main().catch((e: any) => {
  console.error("FAIL ❌", e?.message || e);
  process.exit(1);
});
