import { Request, Response } from "express";
import { db } from "../db";
import { roleCards, agents } from "@shared/schema";
import { sql, eq } from "drizzle-orm";
import { z } from "zod";

const CoverageQuery = z.object({
  threshold: z.coerce.number().int().min(1).max(50).default(3),
});

export async function getRoleCoverage(req: Request, res: Response) {
  const parsed = CoverageQuery.safeParse(req.query);
  if (!parsed.success) {
    return res.status(422).json({
      error: parsed.error.errors.map(e => e.message).join("; ")
    });
  }

  const { threshold } = parsed.data;

  // Note: agents.id matches roleCards.handle for Dream Team agents
  // We count how many agents exist with IDs matching each role handle
  const rows = await db.execute<{
    role_handle: string;
    role_name: string;
    agent_count: string;
  }>(sql`
    SELECT 
      r.handle as role_handle,
      r.title as role_name,
      COUNT(CASE WHEN a.id IS NOT NULL THEN 1 END) as agent_count
    FROM role_cards r
    LEFT JOIN agents a ON a.id = r.handle
    GROUP BY r.handle, r.title
    ORDER BY r.title
  `);

  const withNum = rows.map(d => ({
    ...d,
    agent_count: Number(d.agent_count)
  }));

  const unstaffed = withNum.filter(d => d.agent_count === 0);
  const over = withNum.filter(d => d.agent_count >= threshold);

  res.setHeader("X-Total-Count", String(withNum.length));
  res.json({ unstaffed, over, all: withNum });
}

export async function getAgentsByRole(req: Request, res: Response) {
  const roleHandle = req.query.role_handle as string;
  
  if (!roleHandle) {
    return res.status(422).json({ error: "role_handle required" });
  }

  const agentList = await db.select()
    .from(agents)
    .where(eq(agents.id, roleHandle));

  res.setHeader("X-Total-Count", String(agentList.length));
  res.json({ agents: agentList });
}
