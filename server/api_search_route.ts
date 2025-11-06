import { Request, Response } from "express";
import { universalSearch } from "./drizzle_search";

export async function searchRoute(req: Request, res: Response) {
  try {
    const q = req.query.q as string;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const types = req.query.types ? (req.query.types as string).split(',') : undefined;
    
    const { results, total } = await universalSearch({
      q: q.trim(),
      limit,
      offset,
      types,
    });
    
    // Set X-Total-Count header for pagination
    res.setHeader('X-Total-Count', total.toString());
    res.json(results);
  } catch (error: any) {
    console.error('Error in universal search:', error);
    res.status(500).json({ error: error.message || 'Failed to perform search' });
  }
}
