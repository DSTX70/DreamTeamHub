// server/middleware/rbac.ts
import type { Request, Response, NextFunction } from "express";

/**
 * Simple RBAC guard.
 * - If RBAC_API_KEY is set, require header 'x-api-key' to match.
 * - If JWT is used in your stack, replace this with a proper verifier and role check.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const key = process.env.RBAC_API_KEY;
  if (key) {
    const provided = req.header("x-api-key");
    if (provided !== key) return res.status(403).json({ ok: false, error: "forbidden" });
  }
  // Extend: verify JWT + role claim
  return next();
}
