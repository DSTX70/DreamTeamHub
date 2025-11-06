import type { Request, Response } from "express";
import express from "express";
import { alertNotifier } from "../services/alert-notifier";

export const router = express.Router();

// Ingest alert events and push to external systems (Slack, webhook, console)
router.post("/api/ops/alert", async (req: Request, res: Response) => {
  const { kind = "info", message = "", source, metadata } = req.body || {};
  
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }
  
  // Validate alert kind
  const validKinds = ["info", "warn", "error", "critical"];
  if (!validKinds.includes(kind)) {
    return res.status(400).json({ 
      error: `Invalid alert kind. Must be one of: ${validKinds.join(", ")}`
    });
  }
  
  try {
    // Send alert to all configured channels (Slack, webhook, console)
    const results = await alertNotifier.notify({
      kind,
      message,
      source: source || "api",
      metadata,
      timestamp: new Date(),
    });
    
    // Check if any notifications failed
    const failures = results.filter(r => !r.success);
    const successes = results.filter(r => r.success);
    
    if (failures.length > 0) {
      // Partial success - return 207 Multi-Status
      return res.status(207).json({
        message: "Alert sent with some failures",
        kind,
        channels: {
          success: successes.map(r => r.channel),
          failed: failures.map(r => ({ channel: r.channel, error: r.error }))
        }
      });
    }
    
    // Full success - maintain backward compatibility with existing tests
    res.send("Alert accepted");
  } catch (error: any) {
    console.error("Error sending alert:", error);
    res.status(500).json({
      error: "Failed to send alert",
      message: error.message || "Unknown error"
    });
  }
});

// Get notification configuration status
router.get("/api/ops/alert/config", async (_req: Request, res: Response) => {
  res.json({
    configured: alertNotifier.isConfigured(),
    channels: alertNotifier.getConfiguredChannels(),
    environment: {
      slack: !!process.env.SLACK_WEBHOOK_URL,
      webhook: !!process.env.ALERT_WEBHOOK_URL,
    }
  });
});
