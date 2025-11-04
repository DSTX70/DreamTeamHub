import basicAuth from "basic-auth";
import CIDR from "ip-cidr";
import requestIp from "request-ip";
import type { Request, Response, NextFunction } from "express";

const parseIPs = (s?: string): string[] =>
  (s || "")
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);

const clientAllowed = (clientIp: string | null, cidrs: string[]): boolean => {
  if (!clientIp) return false;
  const ip = clientIp.startsWith("::ffff:") ? clientIp.slice(7) : clientIp;
  return cidrs.some(c => {
    try {
      const block = new CIDR(c);
      return block.contains(ip);
    } catch { 
      return ip === c; 
    }
  });
};

export function stagingGuard() {
  const enabled = process.env.NODE_ENV === "staging";
  const allowedCidrs = parseIPs(process.env.ALLOWED_IPS); // e.g. "203.0.113.0/24,198.51.100.12"
  const user = process.env.STAGING_USER || "staging";
  const pass = process.env.STAGING_PASSWORD || "";

  return (req: Request, res: Response, next: NextFunction) => {
    if (!enabled) return next();
    
    // Allow health check and assets
    if (req.path === "/healthz" || req.path.startsWith("/assets/")) return next();
    
    // Check IP allowlist
    const clientIp = requestIp.getClientIp(req);
    if (allowedCidrs.length && clientAllowed(clientIp, allowedCidrs)) return next();
    
    // Check basic auth
    const creds = basicAuth(req);
    const ok = creds && creds.name === user && creds.pass === pass;
    
    if (!ok) {
      res.set("WWW-Authenticate", 'Basic realm="Staging"');
      return res.status(401).send("Unauthorized (staging)");
    }
    
    next();
  };
}
