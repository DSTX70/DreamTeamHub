import express, { Request, Response } from "express";
import { readSettings, writeSettings, effectiveSettings } from "../notifiers/settingsStore";
import { webhookNotifier } from "../notifiers/webhook";
import { emailNotifier } from "../notifiers/email";

const router = express.Router();

// GET/POST /api/ops/settings/alerts - Requires ops_editor OR ops_admin
const requireEditorOrAdmin = (req: Request, res: Response, next: Function) => {
  const user = (req as any).user;
  if (!user || !user.claims) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  // This would normally check user roles from the database
  // For now, using the same logic as ops_auth.route.ts
  const email = user.claims.email || "";
  const isEditor = email?.includes("@") && email.split("@")[0].length > 0;
  const isAdmin = ["dustinsparks@mac.com", "admin@example.com"].includes(email);
  
  if (!isEditor && !isAdmin) {
    return res.status(403).json({ error: "Requires ops_editor or ops_admin role" });
  }
  
  next();
};

router.get("/api/ops/settings/alerts", requireEditorOrAdmin, async (_req: Request, res: Response) => {
  const s = await effectiveSettings();
  res.json({ 
    settings: {
      slackWebhookUrl: s.slackWebhookUrl,
      emailEnabled: s.emailEnabled,
      emailFrom: s.emailFrom,
      emailTo: s.emailTo,
      smtpHost: s.smtpHost,
      smtpPort: s.smtpPort,
      smtpUser: s.smtpUser,
      smtpPass: s.smtpPass,
    }
  });
});

router.post("/api/ops/settings/alerts", express.json(), requireEditorOrAdmin, async (req: Request, res: Response) => {
  const body = req.body || {};
  const current = await effectiveSettings();
  
  // Only update alert-related settings, preserve global settings
  await writeSettings({
    slackWebhookUrl: String(body.slackWebhookUrl || ""),
    emailEnabled: !!body.emailEnabled,
    emailFrom: String(body.emailFrom || ""),
    emailTo: String(body.emailTo || ""),
    smtpHost: String(body.smtpHost || ""),
    smtpPort: Number(body.smtpPort || 587),
    smtpUser: String(body.smtpUser || ""),
    smtpPass: String(body.smtpPass || ""),
    hotkeysEnabled: current.hotkeysEnabled, // Preserve global setting
  });
  
  const s = await effectiveSettings();
  res.json({ ok: true, settings: s });
});

router.post("/api/ops/settings/alerts/test-webhook", requireEditorOrAdmin, async (_req: Request, res: Response) => {
  const s = await effectiveSettings();
  const n = webhookNotifier({ url: s.slackWebhookUrl });
  if (!n) return res.status(400).json({ error: "Webhook URL not set" });
  await n({ kind: "low-stock", sku: "TEST-123", stock: 5, threshold: 10, at: new Date().toISOString() });
  res.json({ ok: true });
});

router.post("/api/ops/settings/alerts/test-email", requireEditorOrAdmin, async (_req: Request, res: Response) => {
  const s = await effectiveSettings();
  const n = emailNotifier({
    enabled: s.emailEnabled,
    from: s.emailFrom || process.env.EMAIL_FROM || "",
    to: s.emailTo || process.env.EMAIL_TO || "",
    transport: {
      host: s.smtpHost || process.env.SMTP_HOST,
      port: Number(s.smtpPort || process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user: s.smtpUser || process.env.SMTP_USER, pass: s.smtpPass || process.env.SMTP_PASS }
    }
  });
  if (!n) return res.status(400).json({ error: "Email not enabled or SMTP missing" });
  await n({ kind: "low-stock", sku: "TEST-EMAIL", stock: 7, threshold: 12, at: new Date().toISOString() });
  res.json({ ok: true });
});

export default router;
