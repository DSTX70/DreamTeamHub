// server/middleware/rateLimit.ts
import type { Request, Response, NextFunction } from "express";

type RateLimitStore = Map<string, { count: number; resetAt: number }>;

const store: RateLimitStore = new Map();

// Cleanup expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store.entries()) {
    if (now > val.resetAt) {
      store.delete(key);
    }
  }
}, 60000);

/**
 * Simple per-IP/key/path rate limiter
 * @param maxRequests Maximum requests per window (default 30)
 * @param windowMs Window duration in ms (default 60000 = 1 minute)
 */
export function rateLimit(maxRequests = 30, windowMs = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const apiKey = req.headers["x-api-key"] as string;
    const path = req.path;
    
    // Create composite key: IP + path (or API key if present)
    const key = apiKey ? `${apiKey}:${path}` : `${ip}:${path}`;
    
    const now = Date.now();
    const entry = store.get(key);
    
    if (!entry || now > entry.resetAt) {
      // New window
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    
    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfter.toString());
      return res.status(429).json({ 
        error: "Too many requests", 
        retryAfter 
      });
    }
    
    entry.count++;
    next();
  };
}
