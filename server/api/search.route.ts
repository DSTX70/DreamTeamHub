import type { Request, Response } from "express";
import { db } from "../db";
import { universalSearch } from "../helpers/universalSearch";

export async function searchHandler(req: Request, res: Response) {
  const q = (req.query.q as string || "").trim();
  
  if (q.length < 2) {
    return res.status(422).json({ error: "q required (min 2 chars)" });
  }

  const limit = Number(req.query.limit || 20);
  const offset = Number(req.query.offset || 0);
  const types = (req.query.types as string || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as any;

  try {
    const result = await universalSearch(db as any, {
      q,
      limit,
      offset,
      types: types.length > 0 ? types : undefined,
    });

    res.setHeader("X-Total-Count", String(result.count));
    res.json({
      ...result,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
}
