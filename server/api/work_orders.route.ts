import type { Request, Response } from "express";
import { db } from "../db";
import { workOrders, workOrderRuns } from "@shared/schema";
import { desc, and, eq, gte } from "drizzle-orm";

export async function listWorkOrders(req: Request, res: Response) {
  const rows = await db.select().from(workOrders).orderBy(desc(workOrders.createdAt)).limit(50);
  res.setHeader("X-Total-Count", String(rows.length));
  res.json(rows);
}

export async function createWorkOrder(req: Request, res: Response) {
  const b = req.body || {};
  const [row] = await db.insert(workOrders).values({
    title: b.title,
    owner: b.owner,
    autonomy: b.autonomy ?? "L1",
    inputs: b.inputs,
    output: b.output,
    caps: {
      runsPerDay: b.caps?.runsPerDay ?? 100,
      usdPerDay: b.caps?.usdPerDay ?? 2.0,
    },
    kpis: {
      successMin: b.kpis?.successMin ?? 90,
      p95Max: b.kpis?.p95Max ?? 3.0,
    },
    playbook: b.playbook,
    stop: b.stop,
    status: "draft",
  }).returning();
  res.status(201).json(row);
}

export async function startWorkOrderRun(req: Request, res: Response) {
  const woId = String(req.params.woId);
  const agentName = String(req.body?.agent || "").trim();
  if (!agentName) return res.status(422).json({ error: "agent required" });

  const [wo] = await db.select().from(workOrders).where(eq(workOrders.id, woId));
  if (!wo) return res.status(404).json({ error: "work order not found" });

  // Budget enforcement (today)
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const runs = await db.select().from(workOrderRuns)
    .where(and(eq(workOrderRuns.woId, woId), gte(workOrderRuns.startedAt, startOfDay)));
  const runsToday = runs.length;
  const costToday = runs.reduce((s, r) => s + Number(r.cost || 0), 0);

  const caps = wo.caps as { runsPerDay: number; usdPerDay: number };
  if (runsToday >= caps.runsPerDay) {
    res.setHeader("Retry-After", "86400");
    return res.status(429).json({ error: "runs/day cap reached" });
  }
  if (costToday >= caps.usdPerDay) {
    res.setHeader("Retry-After", "86400");
    return res.status(429).json({ error: "budget cap reached" });
  }

  // Simulate a draft-only job
  const ms = Math.floor(400 + Math.random() * 1600);
  const cost = (0.002 + Math.random() * 0.004).toFixed(3);

  const [run] = await db.insert(workOrderRuns).values({
    woId,
    agentName,
    status: "done",
    ms,
    cost,
    mirror: `Drafts ready → ${wo.output}`,
    finishedAt: new Date(),
  }).returning();

  res.status(201).json({
    agent: agentName,
    wo_id: woId,
    status: run.status,
    ms: run.ms,
    cost: run.cost,
    started_at: run.startedAt,
    finished_at: run.finishedAt,
    mirror: run.mirror,
  });
}
