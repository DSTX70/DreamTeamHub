import type { Request, Response, NextFunction } from "express";
import helmet from "helmet";

export function csp() {
  return helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": ["'self'"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"]
      }
    }
  });
}

// Simple scope check: expects req.user.scopes array or token-scoped info
export function requireScopes(...scopes: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const have = (req as any).user?.scopes || [];
    const ok = scopes.every(s => have.includes(s));
    if (!ok) return res.status(403).json({ error: "insufficient scope" });
    next();
  };
}

// Helper to set Retry-After on rate/cap excess
export function retryAfter(res: Response, seconds: number) {
  res.setHeader("Retry-After", String(seconds));
}
