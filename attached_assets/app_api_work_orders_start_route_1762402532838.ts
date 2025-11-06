// app/api/work-orders/[woId]/start/route.ts
import { NextRequest } from "next/server";
import { db } from "@/drizzle/db";
import { workOrder, workOrderRun } from "@/drizzle/schema";
import { and, eq, gte } from "drizzle-orm";
import { json } from "@/lib/next/response";
import { WorkOrderStartBody } from "@/lib/validators/workOrders";

export async function POST(req: NextRequest, ctx: { params: { woId: string } }) {
  const body = await req.json().catch(()=> ({}));
  const parsed = WorkOrderStartBody.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.errors.map(e=>e.message).join("; ") }, 422);

  const woId = ctx.params.woId;
  const [wo] = await db.select().from(workOrder).where(eq(workOrder.id, woId));
  if (!wo) return json({ error: "work order not found" }, 404);

  // Budget enforcement (today)
  const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
  const runs = await db.select().from(workOrderRun)
    .where(and(eq(workOrderRun.woId, woId), gte(workOrderRun.startedAt, startOfDay)));
  const runsToday = runs.length;
  const costToday = runs.reduce((s, r) => s + Number(r.cost), 0);

  if (runsToday >= wo.capsRunsPerDay) {
    return new Response(JSON.stringify({ error: "runs/day cap reached" }), { status: 429, headers: { "Retry-After": "86400", "content-type":"application/json" }});
  }
  if (costToday >= Number(wo.capsUsdPerDay)) {
    return new Response(JSON.stringify({ error: "budget cap reached" }), { status: 429, headers: { "Retry-After": "86400", "content-type":"application/json" }});
  }

  // Simulate draft-only job
  const ms = Math.floor(400 + Math.random()*1600);
  const cost = Number((0.002 + Math.random()*0.004).toFixed(3));
  const [run] = await db.insert(workOrderRun).values({
    woId, agentName: parsed.data.agent, status: "done", ms, cost, mirror: `Drafts ready → ${wo.output}`
  }).returning();

  return json({ agent: parsed.data.agent, wo_id: woId, status: run.status, ms: run.ms, cost: run.cost,
    started_at: run.startedAt, finished_at: run.finishedAt, mirror: run.mirror }, 201);
}
