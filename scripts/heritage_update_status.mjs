import fs from "node:fs";
import path from "node:path";

function list(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function sortIdsNumeric(ids) {
  return [...ids].sort((a, b) => {
    const na = parseInt(a.replace(/\D/g, ""), 10);
    const nb = parseInt(b.replace(/\D/g, ""), 10);
    return na - nb;
  });
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function main() {
  const repoRoot = process.cwd();
  const evidenceDir = path.join(repoRoot, "canon", "heritage", "evidence");
  const decisionsDir = path.join(repoRoot, "canon", "heritage", "decisions");
  const statusPath = path.join(repoRoot, "canon", "heritage", "STATUS.md");

  const evidFiles = list(evidenceDir)
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .filter((n) => /^EVID-\d{4}\.md$/.test(n));

  const decisionFiles = list(decisionsDir)
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .filter((n) => /^DTH-\d{8}-\d{3}\.md$/.test(n));

  const evidIds = sortIdsNumeric(evidFiles.map((n) => n.replace(".md", "")));
  const dthIds = sortIdsNumeric(decisionFiles.map((n) => n.replace(".md", "")));

  const evidMin = evidIds[0] ?? "(none)";
  const evidMax = evidIds[evidIds.length - 1] ?? "(none)";
  const dthMin = dthIds[0] ?? "(none)";
  const dthMax = dthIds[dthIds.length - 1] ?? "(none)";

  if (!fs.existsSync(statusPath)) {
    console.error("STATUS.md not found at canon/heritage/STATUS.md");
    process.exit(1);
  }

  const raw = fs.readFileSync(statusPath, "utf-8");
  const updatedAt = todayISO();

  const next = raw
    .replace(/updated_at:\s*".*?"/, `updated_at: "${updatedAt}"`)
    .replace(
      /- \*\*Evidence Packs:\*\* .*$/m,
      `- **Evidence Packs:** ${evidIds.length}  _(${evidMin} → ${evidMax})_`
    )
    .replace(
      /- \*\*Locked Decisions:\*\* .*$/m,
      `- **Locked Decisions:** ${dthIds.length}  _(${dthMin} → ${dthMax})_`
    );

  fs.writeFileSync(statusPath, next, "utf-8");
  console.log("Updated:", path.relative(repoRoot, statusPath));
  console.log(`Evidence Packs: ${evidIds.length} (${evidMin} → ${evidMax})`);
  console.log(`Decision Files: ${dthIds.length} (${dthMin} → ${dthMax})`);
}

main();
