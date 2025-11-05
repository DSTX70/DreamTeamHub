import express from "express";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const WORK_ORDERS_PATH = path.join(DATA_DIR, "work_orders.json");
const RUNS_PATH = path.join(DATA_DIR, "work_order_runs.json");

export const workOrders = express.Router();

function ensureDir() { fs.mkdirSync(DATA_DIR, { recursive: true }); }
function readJSON<T=any>(p: string, fallback: T): T {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return fallback; }
}
function writeJSON(p: string, v: any) {
  ensureDir(); fs.writeFileSync(p, JSON.stringify(v, null, 2));
}

function readAllWOs() { return readJSON<any[]>(WORK_ORDERS_PATH, []); }
function writeAllWOs(rows: any[]) { writeJSON(WORK_ORDERS_PATH, rows); }

function readRuns() { return readJSON<any[]>(RUNS_PATH, []); }
function writeRuns(rows: any[]) { writeJSON(RUNS_PATH, rows); }

// ── staging guard ─────────────────────────────────────────────────────────────
workOrders.use((req, res, next) => {
  if (process.env.NODE_ENV === "staging") {
    const ok = req.headers.authorization?.startsWith("Basic ");
    if (!ok) return res.status(401).json({ error: "staging guard" });
  }
  next();
});

// ── list + create work orders ─────────────────────────────────────────────────
workOrders.get("/", (_req, res) => res.json(readAllWOs()));

workOrders.post("/", express.json(), (req, res) => {
  const b = req.body || {};
  const required = ["title", "owner", "inputs", "output", "autonomy"];
  for (const k of required) if (!b[k]) return res.status(400).json({ error: `Missing ${k}` });

  const row = {
    id: `wo_${Date.now()}`,
    title: b.title,
    owner: b.owner,
    autonomy: b.autonomy,            // L0/L1/L2/L3
    inputs: b.inputs,                // path(s) or query
    output: b.output,                // drafts destination
    caps: b.caps || { runsPerDay: 100, usdPerDay: 2 },
    kpis: b.kpis || { successMin: 90, p95Max: 3.0 },
    playbook: b.playbook || "",
    stop: b.stop || "",
    status: "draft",                 // draft | active | paused
    created_at: new Date().toISOString()
  };
  const all = readAllWOs(); all.unshift(row); writeAllWOs(all);
  res.status(201).json(row);
});

// ── runs: list + start (draft-only simulation) ────────────────────────────────
workOrders.get("/runs", (req, res) => {
  const limit = Math.max(1, Math.min(Number(req.query.limit ?? 50), 200));
  const rows = readRuns().slice(0, limit);
  res.json(rows);
});

/**
 * Start a run for a Work Order (draft-only). No external sends; this simulates
 * a quick job and writes a log with: { agent, wo_id, status, ms, cost }.
 * Body: { agent: string }
 */
workOrders.post("/:woId/start", express.json(), (req, res) => {
  const woId = String(req.params.woId);
  const agent = String(req.body?.agent || "").trim();
  if (!agent) return res.status(400).json({ error: "Missing agent" });

  const wos = readAllWOs();
  const wo = wos.find(w => w.id === woId);
  if (!wo) return res.status(404).json({ error: "Work order not found" });

  // Simulate a tiny "draft-only" job (no external I/O; just a log record)
  const started = Date.now();
  // pretend to do a little work:
  const simulatedMs = Math.floor(400 + Math.random() * 1600);   // 0.4–2.0s
  const simulatedCost = Number((0.002 + Math.random() * 0.004).toFixed(3)); // $0.002–$0.006
  const finished = started + simulatedMs;

  const run = {
    id: `run_${finished}`,
    agent,
    wo_id: woId,
    status: "done",                  // queued | running | done | failed
    ms: simulatedMs,
    cost: simulatedCost,
    started_at: new Date(started).toISOString(),
    finished_at: new Date(finished).toISOString(),
    // Optional mirror-back (draft-only; where drafts *would* land)
    mirror: `Drafts ready (simulated) → ${wo.output}`
  };

  const runs = readRuns();
  runs.unshift(run);
  writeRuns(runs);

  // For convenience, bump WO status to 'active' on first start
  if (wo.status === "draft") {
    wo.status = "active";
    writeAllWOs([wo, ...wos.filter(x => x.id !== woId)]);
  }

  // Minimal return matches the asked shape + extras
  res.status(201).json({
    agent: run.agent,
    wo_id: run.wo_id,
    status: run.status,
    ms: run.ms,
    cost: run.cost,
    started_at: run.started_at,
    finished_at: run.finished_at,
    mirror: run.mirror
  });
});
