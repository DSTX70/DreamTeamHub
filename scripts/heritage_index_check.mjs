import fs from "node:fs";
import path from "node:path";

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function list(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function mdTitle(filePath) {
  try {
    const txt = fs.readFileSync(filePath, "utf-8");
    const m = txt.match(/^#\s+(.+)\s*$/m);
    return m?.[1]?.trim() || path.basename(filePath);
  } catch {
    return path.basename(filePath);
  }
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

function main() {
  const args = new Set(process.argv.slice(2));
  const write = args.has("--write");

  const repoRoot = process.cwd();
  const evidenceDir = path.join(repoRoot, "canon", "heritage", "evidence");
  const decisionsDir = path.join(repoRoot, "canon", "heritage", "decisions");

  const evidIndexPath = path.join(evidenceDir, "_EVIDENCE_INDEX.json");
  const dthIndexPath = path.join(repoRoot, "canon", "heritage", "_DECISION_INDEX.json");

  if (!fs.existsSync(evidIndexPath) || !fs.existsSync(dthIndexPath)) {
    console.error("Missing index files:", {
      evidIndexPath: fs.existsSync(evidIndexPath),
      dthIndexPath: fs.existsSync(dthIndexPath),
    });
    process.exit(1);
  }

  const evidIndex = readJson(evidIndexPath);
  const dthIndex = readJson(dthIndexPath);

  const evidFiles = list(evidenceDir)
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .filter((n) => /^EVID-\d{4}\.md$/.test(n));

  const dthFiles = list(decisionsDir)
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .filter((n) => /^DTH-\d{8}-\d{3}\.md$/.test(n));

  const evidFolderIds = evidFiles.map((n) => n.replace(".md", ""));
  const dthFolderIds = dthFiles.map((n) => n.replace(".md", ""));

  const evidIndexIds = (evidIndex.evidence || []).map((e) => e.id || e.evidenceId);
  const dthIndexIds = (dthIndex.decisions || []).map((d) => d.id || d.decisionId);

  const missingEvid = evidFolderIds.filter((id) => !evidIndexIds.includes(id));
  const missingDth = dthFolderIds.filter((id) => !dthIndexIds.includes(id));

  const extraEvid = evidIndexIds.filter((id) => !evidFolderIds.includes(id));
  const extraDth = dthIndexIds.filter((id) => !dthFolderIds.includes(id));

  console.log("=== Heritage Index Check ===");
  console.log("Evidence in folder:", evidFolderIds.length, "Index entries:", evidIndexIds.length);
  console.log("Decisions in folder:", dthFolderIds.length, "Index entries:", dthIndexIds.length);
  console.log("");
  console.log("Missing Evidence Index entries:", missingEvid.length ? missingEvid.join(", ") : "(none)");
  console.log("Missing Decision Index entries:", missingDth.length ? missingDth.join(", ") : "(none)");
  console.log("Extra Evidence Index entries:", extraEvid.length ? extraEvid.join(", ") : "(none)");
  console.log("Extra Decision Index entries:", extraDth.length ? extraDth.join(", ") : "(none)");

  if (!write) return;

  if (missingEvid.length) {
    evidIndex.evidence = evidIndex.evidence || [];
    for (const id of missingEvid) {
      const p = path.join(evidenceDir, `${id}.md`);
      evidIndex.evidence.push({
        id: id,
        title: mdTitle(p),
        file: `${id}.md`,
        tags: [],
        relatedPods: [],
        relatedSkills: [],
        relatedDecisions: [],
      });
    }
    evidIndex.evidence = uniq(evidIndex.evidence.map((e) => JSON.stringify(e))).map((s) => JSON.parse(s));
    fs.writeFileSync(evidIndexPath, JSON.stringify(evidIndex, null, 2) + "\n", "utf-8");
    console.log("\nWrote:", path.relative(repoRoot, evidIndexPath));
  }

  if (missingDth.length) {
    dthIndex.decisions = dthIndex.decisions || [];
    for (const id of missingDth) {
      const p = path.join(decisionsDir, `${id}.md`);
      dthIndex.decisions.push({
        id: id,
        title: mdTitle(p).replace(/^Decision:\s*/i, ""),
        status: "Locked",
        date: "2025-12-26",
        file: `decisions/${id}.md`,
        tags: [],
        relatedPods: [],
        relatedSkills: [],
        relatedEvidence: [],
      });
    }
    dthIndex.decisions = uniq(dthIndex.decisions.map((d) => JSON.stringify(d))).map((s) => JSON.parse(s));
    fs.writeFileSync(dthIndexPath, JSON.stringify(dthIndex, null, 2) + "\n", "utf-8");
    console.log("Wrote:", path.relative(repoRoot, dthIndexPath));
  }
}

main();
