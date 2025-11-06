import { Request, Response } from "express";
import { db } from "../db";
import { playbooks, insertPlaybookSchema } from "@shared/schema";
import { like, eq } from "drizzle-orm";
import { z } from "zod";

const PlaybookBody = z.object({
  handle: z.string().min(3).max(100).regex(/^[a-z0-9_-]+$/i, "alphanumeric/underscore/hyphen only"),
  title: z.string().min(3).max(160),
  bodyMd: z.string().min(10),
});

export async function listPlaybooks(req: Request, res: Response) {
  const query = (req.query.query as string || "").trim();
  
  const rows = query
    ? await db.select().from(playbooks).where(like(playbooks.title, `%${query}%`))
    : await db.select().from(playbooks).orderBy(playbooks.createdAt).limit(50);

  res.setHeader("X-Total-Count", String(rows.length));
  res.json(rows);
}

export async function createOrUpdatePlaybook(req: Request, res: Response) {
  const parsed = PlaybookBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      error: parsed.error.errors.map(e => e.message).join("; ")
    });
  }

  const { handle, title, bodyMd } = parsed.data;

  const [existing] = await db.select().from(playbooks).where(eq(playbooks.handle, handle));

  let row;
  if (existing) {
    [row] = await db.update(playbooks)
      .set({ title, bodyMd })
      .where(eq(playbooks.handle, handle))
      .returning();
  } else {
    [row] = await db.insert(playbooks)
      .values({ handle, title, bodyMd })
      .returning();
  }

  res.status(existing ? 200 : 201).json(row);
}

export async function getPlaybookByHandle(req: Request, res: Response) {
  const handle = req.params.handle;

  const [playbook] = await db.select()
    .from(playbooks)
    .where(eq(playbooks.handle, handle));

  if (!playbook) {
    return res.status(404).json({ error: "not found" });
  }

  res.json(playbook);
}
