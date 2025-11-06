// api/work_orders.db.route.ts
// Postgres-backed Work Orders with caps + Retry-After.
import { db } from "../drizzle/db";
import { workOrder, workOrderRun } from "../drizzle/schema";
import { desc, and, eq, gte } from "drizzle-orm";

export async function listWorkOrders(req, res) {
  const rows = await db.select().from(workOrder).orderBy(desc(workOrder.createdAt)).limit(50);
  res.setHeader("X-Total-Count", String(rows.length));
  res.json(rows);
}

export async function createWorkOrder(req, res) {
  const b = req.body || {};
  const [row] = await db.insert(workOrder).values({
    title: b.title, owner: b.owner, autonomy: b.autonomy ?? "L1",
    inputs: b.inputs, output: b.output,
    capsRunsPerDay: b.caps?.runsPerDay ?? 100,
    capsUsdPerDay: b.caps?.usdPerDay ?? "2.000",
    kpiSuccessMin: b.kpis?.successMin ?? 90,
    kpiP95Max: b.kpis?.p95Max ?? "3.00",
    playbook: b.playbook, stop: b.stop, status: "draft",
  }).returning();
  res.status(201).json(row);
}

export async function startWorkOrderRun(req, res) {
  const woId = String(req.params.woId);
  const agentName = String(req.body?.agent || "").trim();
  if (!agentName) return res.status(422).json({ error: "agent required" });

  const [wo] = await db.select().from(workOrder).where(eq(workOrder.id, woId));
  if (!wo) return res.status(404).json({ error: "work order not found" });

  // Budget enforcement (today)
  const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
  const runs = await db.select().from(workOrderRun)
    .where(and(eq(workOrderRun.woId, woId), gte(workOrderRun.startedAt, startOfDay)));
  const runsToday = runs.length;
  const costToday = runs.reduce((s, r) => s + Number(r.cost), 0);

  if (runsToday >= wo.capsRunsPerDay) {
    res.setHeader("Retry-After", "86400");
    return res.status(429).json({ error: "runs/day cap reached" });
  }
  if (costToday >= Number(wo.capsUsdPerDay)) {
    res.setHeader("Retry-After", "86400");
    return res.status(429).json({ error: "budget cap reached" });
  }

  // Simulate a draft-only job
  const ms = Math.floor(400 + Math.random()*1600);
  const cost = Number((0.002 + Math.random()*0.004).toFixed(3));

  const [run] = await db.insert(workOrderRun).values({
    woId, agentName, status: "done", ms, cost, mirror: `Drafts ready → ${wo.output}`
  }).returning();

  res.status(201).json({
    agent: agentName, wo_id: woId, status: run.status, ms: run.ms, cost: run.cost,
    started_at: run.startedAt, finished_at: run.finishedAt, mirror: run.mirror
  });
}
