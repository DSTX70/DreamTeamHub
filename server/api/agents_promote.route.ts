import type { Request, Response } from "express";
import { db } from "../db";
import { agents } from "@shared/schema";
import { eq } from "drizzle-orm";
import { AgentPromoteBody, UUID } from "../../lib/validators/agents";

export async function promoteAgent(req: Request, res: Response) {
  const id = String(req.params.id);
  
  // Validate ID is UUID
  const idParsed = UUID.safeParse(id);
  if (!idParsed.success) {
    return res.status(422).json({ error: "invalid UUID" });
  }
  
  // Validate body
  const bodyParsed = AgentPromoteBody.safeParse(req.body);
  if (!bodyParsed.success) {
    const msg = bodyParsed.error.errors.map(e => e.message).join("; ");
    return res.status(422).json({ error: msg });
  }
  
  const [row] = await db.select().from(agents).where(eq(agents.id, id));
  if (!row) return res.status(404).json({ error: "agent not found" });
  
  const { advance, note } = bodyParsed.data;
  const next = Math.min(4, (row.nextGate ?? 1) + (advance || 1));
  
  const [updated] = await db.update(agents)
    .set({ nextGate: next })
    .where(eq(agents.id, id))
    .returning();
    
  return res.json({ 
    ok: true, 
    agent: updated, 
    advanced: advance || 1,
    note: note || undefined 
  });
}
