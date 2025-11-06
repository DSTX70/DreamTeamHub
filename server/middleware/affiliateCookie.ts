// server/middleware/affiliateCookie.ts
import type { Request, Response, NextFunction } from "express";

/** Captures ?aff=CODE into aff_code cookie (30 days). */
export function captureAffiliateFromQuery(req: Request, res: Response, next: NextFunction) {
  const aff = String((req.query?.aff as string) || "").trim();
  if (aff) {
    res.cookie("aff_code", aff.toUpperCase(), { httpOnly: true, sameSite: "lax", maxAge: 1000*60*60*24*30 });
  }
  next();
}

/** Reads cookie or explicit body.affCode */
export function resolveAffiliateCode(req: Request): string {
  const code = (req.cookies?.aff_code || (req.body?.affCode || "")).toString().toUpperCase();
  return code || "";
}
