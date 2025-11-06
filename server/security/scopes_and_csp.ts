import type { Request, Response, NextFunction } from "express";
import helmet from "helmet";

export function csp() {
  const isDev = process.env.NODE_ENV === "development";
  
  if (isDev) {
    // In development, use permissive CSP to allow Vite HMR and inline scripts
    return helmet({
      contentSecurityPolicy: false
    });
  }
  
  // In production, use strict CSP
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

// API token scope mapping - all API tokens have these scopes
const API_TOKEN_SCOPES = [
  "knowledge:draft:write",
  "agents:write",
  "roles:read",
  "roles:write"
];

// Scope check: supports both session auth (req.user.scopes) and API token auth
export function requireScopes(...scopes: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if authenticated via API token (has Authorization header)
    const authHeader = req.headers.authorization;
    const isApiToken = authHeader && authHeader.startsWith('Bearer ');
    
    if (isApiToken) {
      // API token auth: grant all defined API token scopes
      const ok = scopes.every(s => API_TOKEN_SCOPES.includes(s));
      if (!ok) return res.status(403).json({ error: "insufficient scope" });
      return next();
    }
    
    // Session auth: check req.user.scopes
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
