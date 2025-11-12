// server/middleware/rbac.ts
import type { Request, Response, NextFunction } from "express";
import { getUserRoles } from "../security/roles";

/**
 * Simple RBAC guard for API tokens.
 * - Requires header 'x-api-key' to match DTH_API_TOKEN environment variable.
 * - Returns 401 if DTH_API_TOKEN not configured.
 * - Returns 403 if x-api-key header missing or doesn't match.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const key = process.env.DTH_API_TOKEN;
  
  if (!key) {
    console.error('[requireAdmin] DTH_API_TOKEN not configured in environment');
    return res.status(401).json({ ok: false, error: "RBAC not configured" });
  }
  
  const provided = req.header("x-api-key");
  if (!provided || provided !== key) {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }
  
  return next();
}

/**
 * User-based RBAC guard.
 * - Checks if authenticated user has required operational roles.
 * - Supports ops_viewer, ops_editor, ops_admin roles.
 */
export function requireOpsRole(...requiredRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    const userId = user?.claims?.sub || "";
    const email = user?.claims?.email || "";
    
    const userRoles = getUserRoles(userId, email);
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return res.status(403).json({ 
        ok: false, 
        error: `Requires one of: ${requiredRoles.join(', ')}` 
      });
    }
    
    next();
  };
}
