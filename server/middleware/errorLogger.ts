import type { Request, Response, NextFunction } from "express";
import { logError } from "../ops/logger";
export function errorLogger(err: any, _req: Request, res: Response, _next: NextFunction){
  try{ logError(err?.message || String(err), { stack: String(err?.stack||"") }); }catch{}
  res.status(500).json({ error: "Internal error" });
}
