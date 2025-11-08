// smoke.ts
/**
 * Ops/Health/LLM Smoke Script
 * Node >=18 (global fetch). Run with: npx tsx smoke.ts
 *
 * Env:
 *   API_BASE (default http://localhost:3000)
 *   API_KEY  (x-api-key for admin/RBAC)
 *   FAMILY   (gpt|claude|gemini) default gpt
 */

type Json = any;

const API_BASE = process.env.API_BASE || "http://localhost:3000";
const API_KEY = process.env.API_KEY || "";
const FAMILY = (process.env.FAMILY || "gpt") as "gpt"|"claude"|"gemini";

function url(p: string) { return `${API_BASE}${p}`; }

async function j<T=Json>(res: Response): Promise<T> {
  const txt = await res.text();
  try { return JSON.parse(txt) as T; } catch { throw new Error(`Expected JSON, got: ${txt.slice(0,200)}`); }
}

function assert(cond: any, msg: string) {
  if (!cond) throw new Error(`ASSERT: ${msg}`);
}

function hdrs(json=true) {
  const h: Record<string,string> = {};
  if (json) h["Content-Type"] = "application/json";
  if (API_KEY) h["x-api-key"] = API_KEY;
  return h;
}

function log(step: string, extra: Record<string,any> = {}) {
  const t = new Date().toISOString();
  console.log(`[${t}] ${step}`, Object.keys(extra).length ? extra : "");
}

async function main() {
  // 1) healthz (readiness)
  log("GET /api/healthz");
  let r = await fetch(url("/api/healthz"), { method: "GET" });
  const health = await j(r);
  assert("ok" in health && "checks" in health && "latencyMs" in health, "health payload shape");
  log("healthz", { status: r.status, ok: health.ok, latencyMs: health.latencyMs });

  // 2) livez
  log("GET /api/healthz/livez");
  r = await fetch(url("/api/healthz/livez"), { method: "GET" });
  const livez = await j(r);
  assert(r.status === 200 && livez.ok === true, "livez ok");
  log("livez", { status: r.status });

  // 3) deploy mark + last
  log("POST /api/admin/deploy/mark");
  r = await fetch(url("/api/admin/deploy/mark"), {
    method: "POST",
    headers: hdrs(true),
    body: JSON.stringify({ sha: process.env.SHA || "deadbeef", tag: process.env.TAG || "v0.0.1", actor: process.env.ACTOR || "smoke" }),
  });
  const mark = await j(r);
  assert(mark.ok === true, "deploy mark ok");
  log("deploy mark ok");

  log("GET /api/admin/deploy/last");
  r = await fetch(url("/api/admin/deploy/last"), { headers: hdrs(false) });
  const last = await j(r);
  assert(last.lastDeploy && last.lastDeploy.ts, "has lastDeploy");
  log("last deploy", { label: last.lastDeploy.tag || (last.lastDeploy.sha || "").slice(0,7) });

  // 4) metrics (after a few requests above, histogram should have samples)
  log("GET /metrics");
  r = await fetch(url("/metrics"));
  const text = await r.text();
  assert(r.status === 200 && text.includes("http_request_duration_seconds"), "metrics available");
  log("metrics ok");

  // 5) LLM presets DB: create one, list, augment
  log("POST /api/llm/presets-db create");
  r = await fetch(url("/api/llm/presets-db"), {
    method: "POST",
    headers: hdrs(true),
    body: JSON.stringify({
      family: FAMILY,
      label: `Smoke ${FAMILY} ${Date.now()}`,
      augmentLines: ["Return JSON only. No extra text."],
      tips: ["Short and schema-first"]
    })
  });
  const createPreset = await j(r);
  assert(createPreset.ok === true && createPreset.preset?.id != null, "preset created");
  const presetId = createPreset.preset.id;
  log("preset created", { id: presetId });

  log("GET /api/llm/presets-db");
  r = await fetch(url("/api/llm/presets-db"), { headers: hdrs(false) });
  const listPresets = await j(r);
  assert(Array.isArray(listPresets.presets), "presets list");
  log("presets count", { count: listPresets.presets.length });

  log("POST /api/llm/augment");
  r = await fetch(url("/api/llm/augment"), { method: "POST", headers: hdrs(true), body: JSON.stringify({ family: FAMILY, prompt: "You are a helpful assistant." }) });
  const aug = await j(r);
  assert(typeof aug.augmented === "string" && aug.augmented.includes("Return JSON only"), "augmented prompt includes line");
  log("augment ok");

  // 6) Ops logs: emit (Redis-backed) and REST since
  log("POST /api/ops/logs/emit");
  r = await fetch(url("/api/ops/logs/emit"), {
    method: "POST",
    headers: hdrs(true),
    body: JSON.stringify({ id: String(Date.now()), ts: new Date().toISOString(), level: "info", kind: "deploy", owner: "smoke", msg: "deploy test event" })
  });
  const emit = await j(r);
  assert(emit.ok === true, "emit ok");
  log("emit ok");

  log("GET /api/ops/logs/rest?since=15m");
  r = await fetch(url("/api/ops/logs/rest?since=15m"), { headers: hdrs(false) });
  const restLogs = await j(r);
  assert(Array.isArray(restLogs.events), "rest logs returns events array");
  log("rest logs ok", { sample: restLogs.events.slice(-1)[0] });

  console.log("\n✅ Smoke finished without assertion failures.");
}

main().catch((e) => {
  console.error("\n❌ Smoke failed:", e);
  process.exit(1);
});
