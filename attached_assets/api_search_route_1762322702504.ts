// api/search.route.ts
// Minimal Express route handler wired to the Drizzle helper.

import type { Request, Response } from "express";
import { universalSearch } from "../drizzle/search";
import { db } from "../drizzle/db"; // your initialized drizzle db

export async function searchRoute(req: Request, res: Response) {
  try {
    const q = String(req.query.q || "").trim();
    if (q.length < 2) return res.status(422).json({ error: "q required (min 2 chars)" });

    const types = req.query.types
      ? String(req.query.types).split(",").map(s=>s.trim()).filter(Boolean)
      : undefined;

    const result = await universalSearch(db, {
      q,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      offset: req.query.offset ? Number(req.query.offset) : 0,
      scope: (req.query.scope as any) || "GLOBAL",
      ownerId: req.query.owner_id ? String(req.query.owner_id) : undefined,
      types: types as any
    });

    res.setHeader("X-Total-Count", String(result.count));
    return res.json(result);
  } catch (e:any) {
    console.error("searchRoute error:", e);
    return res.status(500).json({ error: "search failed" });
  }
}

// Usage in your server:
// import express from "express";
// import { searchRoute } from "./api/search.route";
// const app = express();
// app.get("/api/search", searchRoute);
