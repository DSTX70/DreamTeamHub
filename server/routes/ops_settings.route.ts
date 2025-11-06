import express, { Request, Response } from "express";
import { readSettings, writeSettings, effectiveSettings } from "../notifiers/settingsStore";
import { webhookNotifier } from "../notifiers/webhook";
import { emailNotifier } from "../notifiers/email";

export const router = express.Router();

router.get("/api/ops/settings/notifiers", async (_req: Request, res: Response) => {
  const s = await effectiveSettings();
  res.json({ settings: s });
});

router.post("/api/ops/settings/notifiers", express.json(), async (req: Request, res: Response) => {
  const body = req.body || {};
  await writeSettings({
    slackWebhookUrl: String(body.slackWebhookUrl || ""),
    emailEnabled: !!body.emailEnabled,
    emailFrom: String(body.emailFrom || ""),
    emailTo: String(body.emailTo || ""),
    smtpHost: String(body.smtpHost || ""),
    smtpPort: Number(body.smtpPort || 587),
    smtpUser: String(body.smtpUser || ""),
    smtpPass: String(body.smtpPass || ""),
  });
  const s = await effectiveSettings();
  res.json({ ok: true, settings: s });
});

router.post("/api/ops/settings/test-webhook", express.json(), async (_req: Request, res: Response) => {
  const s = await effectiveSettings();
  const n = webhookNotifier({ url: s.slackWebhookUrl });
  if (!n) return res.status(400).json({ error: "Webhook URL not set" });
  await n({ kind: "low-stock", sku: "TEST-123", stock: 5, threshold: 10, at: new Date().toISOString() });
  res.json({ ok: true });
});

router.post("/api/ops/settings/test-email", express.json(), async (_req: Request, res: Response) => {
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
