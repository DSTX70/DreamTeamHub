import type { Request, Response } from "express";
import { db } from "../db";
import { workOrders, workOrderRuns, opsEvent } from "@shared/schema";
import { desc, and, eq, gte } from "drizzle-orm";
import { WorkOrderCreateBody, WorkOrderStartBody } from "../../lib/validators/workOrders";

export async function listWorkOrders(req: Request, res: Response) {
  const rows = await db.select().from(workOrders).orderBy(desc(workOrders.createdAt)).limit(50);
  res.setHeader("X-Total-Count", String(rows.length));
  res.json(rows);
}

export async function createWorkOrder(req: Request, res: Response) {
  const parsed = WorkOrderCreateBody.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.errors.map(e => e.message).join("; ");
    return res.status(422).json({ error: msg });
  }
  
  const b = parsed.data;
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
    playbook: b.playbook ?? "",
    playbookHandle: b.playbookHandle ?? null,
    stop: b.stop ?? "",
    status: "draft",
  }).returning();
  res.status(201).json(row);
}

export async function startWorkOrderRun(req: Request, res: Response) {
  const woId = String(req.params.woId);
  
  const parsed = WorkOrderStartBody.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.errors.map(e => e.message).join("; ");
    return res.status(422).json({ error: msg });
  }
  
  const agentName = parsed.data.agent;

  const [wo] = await db.select().from(workOrders).where(eq(workOrders.id, woId));
  if (!wo) return res.status(404).json({ error: "work order not found" });

  // Budget enforcement (today, UTC)
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const runs = await db.select().from(workOrderRuns)
    .where(and(eq(workOrderRuns.woId, woId), gte(workOrderRuns.startedAt, startOfDay)));
  const runsToday = runs.length;
  const costToday = runs.reduce((s, r) => s + Number(r.cost || 0), 0);

  const caps = wo.caps as { runsPerDay: number; usdPerDay: number };
  if (runsToday >= caps.runsPerDay) {
    // Log RATE_LIMIT_429 event
    const actor = agentName || (req as any).user?.email || (req as any).user?.id || "anonymous";
    await db.insert(opsEvent).values({
      actor,
      kind: "RATE_LIMIT_429",
      ownerType: null,
      ownerId: woId,
      message: `Work order rate limit: runs/day cap reached (${runsToday}/${caps.runsPerDay})`,
      meta: {
        woId,
        woTitle: wo.title,
        agentName,
        reason: "runs_per_day_cap",
        runsToday,
        cap: caps.runsPerDay,
        path: req.path,
      },
    });
    res.setHeader("Retry-After", "86400");
    return res.status(429).json({ error: "runs/day cap reached" });
  }
  if (costToday >= caps.usdPerDay) {
    // Log RATE_LIMIT_429 event
    const actor = agentName || (req as any).user?.email || (req as any).user?.id || "anonymous";
    await db.insert(opsEvent).values({
      actor,
      kind: "RATE_LIMIT_429",
      ownerType: null,
      ownerId: woId,
      message: `Work order rate limit: budget cap reached ($${costToday.toFixed(2)}/$${caps.usdPerDay})`,
      meta: {
        woId,
        woTitle: wo.title,
        agentName,
        reason: "budget_cap",
        costToday,
        cap: caps.usdPerDay,
        path: req.path,
      },
    });
    res.setHeader("Retry-After", "86400");
    return res.status(429).json({ error: "budget cap reached" });
  }

  // Execute work order using real LLM-powered executor
  const { workOrderExecutor } = await import("../services/work-order-executor");
  
  const executionResult = await workOrderExecutor.execute(wo, agentName);
  
  const [run] = await db.insert(workOrderRuns).values({
    woId,
    agentName,
    status: executionResult.status === "success" ? "done" : 
            executionResult.status === "failed" ? "failed" : "partial",
    ms: executionResult.ms,
    cost: executionResult.cost,
    mirror: executionResult.error ? 
            `Error: ${executionResult.error}` : 
            executionResult.output,
    finishedAt: new Date(),
  }).returning();

  // Log WORK_ORDER_START event with actual execution metrics
  const actor = agentName || (req as any).user?.email || (req as any).user?.id || "anonymous";
  const actualCost = Number(executionResult.cost);
  
  await db.insert(opsEvent).values({
    actor,
    kind: "WORK_ORDER_START",
    ownerType: null,
    ownerId: woId,
    message: `Work order executed: ${wo.title} (${executionResult.status})`,
    meta: {
      woId,
      woTitle: wo.title,
      agentName,
      status: run.status,
      ms: run.ms,
      cost: run.cost,
      runsToday: runsToday + 1,
      costToday: costToday + actualCost,
      caps,
      path: req.path,
      executionMetadata: executionResult.metadata,
    },
  });

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
