import type { Request, Response } from "express";
import { db } from "../drizzle/db";
import { agents } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function promoteAgent(req: Request, res: Response) {
  const id = String(req.params.id);
  const [row] = await db.select().from(agents).where(eq(agents.id, id));
  if (!row) return res.status(404).json({ error: "agent not found" });
  const next = Math.min(4, (row.nextGate ?? 1) + 1);
  const [updated] = await db.update(agents).set({ nextGate: next }).where(eq(agents.id, id)).returning();
  return res.json({ ok: true, agent: updated });
}
