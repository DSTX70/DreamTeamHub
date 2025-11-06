// app/api/work-orders/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { json } from "@/lib/next/response";
import { db } from "@/drizzle/db";
import { workOrder } from "@/drizzle/schema";
import { desc } from "drizzle-orm";
import { WorkOrderCreateBody } from "@/lib/validators/workOrders";

export async function GET() {
  const rows = await db.select().from(workOrder).orderBy(desc(workOrder.createdAt)).limit(50);
  return json(rows, { status: 200, headers: { "X-Total-Count": String(rows.length) } });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=> ({}));
  const parsed = WorkOrderCreateBody.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.errors.map(e=>e.message).join("; ");
    return json({ error: msg }, 422);
  }
  const b = parsed.data;
  const [row] = await db.insert(workOrder).values({
    title: b.title, owner: b.owner, autonomy: b.autonomy ?? "L1",
    inputs: b.inputs, output: b.output,
    capsRunsPerDay: b.caps?.runsPerDay ?? 100,
    capsUsdPerDay: b.caps?.usdPerDay ?? 2.0,
    kpiSuccessMin: b.kpis?.successMin ?? 90,
    kpiP95Max: b.kpis?.p95Max ?? 3.0,
    playbook: b.playbook, stop: b.stop, status: "draft",
  }).returning();
  return json(row, 201);
}
