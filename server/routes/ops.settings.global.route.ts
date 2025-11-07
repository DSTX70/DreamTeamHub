import express, { Request, Response } from "express";
import { readSettings, writeSettings, effectiveSettings } from "../notifiers/settingsStore";

const router = express.Router();

// GET/POST /api/ops/settings/global - Requires ops_admin ONLY
const requireAdmin = (req: Request, res: Response, next: Function) => {
  const user = (req as any).user;
  if (!user || !user.claims) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  // This would normally check user roles from the database
  // For now, using the same logic as ops_auth.route.ts
  const email = user.claims.email || "";
  const isAdmin = ["dustinsparks@mac.com", "admin@example.com"].includes(email);
  
  if (!isAdmin) {
    return res.status(403).json({ error: "Requires ops_admin role" });
  }
  
  next();
};

router.get("/api/ops/settings/global", requireAdmin, async (_req: Request, res: Response) => {
  const s = await effectiveSettings();
  res.json({ 
    settings: {
      hotkeysEnabled: s.hotkeysEnabled,
    }
  });
});

router.post("/api/ops/settings/global", express.json(), requireAdmin, async (req: Request, res: Response) => {
  const body = req.body || {};
  const current = await effectiveSettings();
  
  // Only update global settings, preserve alert settings
  await writeSettings({
    slackWebhookUrl: current.slackWebhookUrl,
    emailEnabled: current.emailEnabled,
    emailFrom: current.emailFrom,
    emailTo: current.emailTo,
    smtpHost: current.smtpHost,
    smtpPort: current.smtpPort,
    smtpUser: current.smtpUser,
    smtpPass: current.smtpPass,
    hotkeysEnabled: body.hotkeysEnabled ?? true, // Update global setting
  });
  
  const s = await effectiveSettings();
  res.json({ ok: true, settings: s });
});

export default router;
