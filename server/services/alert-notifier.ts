/**
 * Alert Notification Service
 * Sends alerts to Slack, custom webhooks, or message queues
 */

export type AlertKind = "info" | "warn" | "error" | "critical";

export interface AlertPayload {
  kind: AlertKind;
  message: string;
  source?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface NotificationResult {
  success: boolean;
  channel?: string;
  error?: string;
}

export class AlertNotifier {
  private slackWebhookUrl: string | null;
  private customWebhookUrl: string | null;
  
  constructor() {
    this.slackWebhookUrl = process.env.SLACK_WEBHOOK_URL || null;
    this.customWebhookUrl = process.env.ALERT_WEBHOOK_URL || null;
  }
  
  /**
   * Send alert to all configured notification channels
   */
  async notify(alert: AlertPayload): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];
    
    // Always log to console
    this.logToConsole(alert);
    results.push({ success: true, channel: "console" });
    
    // Send to Slack if configured
    if (this.slackWebhookUrl) {
      const slackResult = await this.sendToSlack(alert);
      results.push(slackResult);
    }
    
    // Send to custom webhook if configured
    if (this.customWebhookUrl) {
      const webhookResult = await this.sendToWebhook(alert);
      results.push(webhookResult);
    }
    
    return results;
  }
  
  /**
   * Log alert to console with appropriate formatting
   */
  private logToConsole(alert: AlertPayload): void {
    const timestamp = alert.timestamp || new Date();
    const prefix = `[ALERT:${alert.kind.toUpperCase()}]`;
    const logMessage = `${prefix} ${alert.message}`;
    
    switch (alert.kind) {
      case "critical":
      case "error":
        console.error(`🔴 ${timestamp.toISOString()} ${logMessage}`, alert.metadata || {});
        break;
      case "warn":
        console.warn(`🟡 ${timestamp.toISOString()} ${logMessage}`, alert.metadata || {});
        break;
      case "info":
      default:
        console.log(`🔵 ${timestamp.toISOString()} ${logMessage}`, alert.metadata || {});
        break;
    }
  }
  
  /**
   * Send alert to Slack webhook
   */
  private async sendToSlack(alert: AlertPayload): Promise<NotificationResult> {
    if (!this.slackWebhookUrl) {
      return { success: false, channel: "slack", error: "No Slack webhook URL configured" };
    }
    
    try {
      const color = this.getSlackColor(alert.kind);
      const emoji = this.getAlertEmoji(alert.kind);
      
      const slackPayload = {
        attachments: [
          {
            color,
            fallback: `${alert.kind.toUpperCase()}: ${alert.message}`,
            title: `${emoji} ${alert.kind.toUpperCase()} Alert`,
            text: alert.message,
            fields: [
              ...(alert.source ? [{
                title: "Source",
                value: alert.source,
                short: true
              }] : []),
              {
                title: "Timestamp",
                value: (alert.timestamp || new Date()).toISOString(),
                short: true
              },
              ...(alert.metadata ? [{
                title: "Details",
                value: this.formatMetadata(alert.metadata),
                short: false
              }] : [])
            ],
            footer: "Dream Team Hub Alerts",
            ts: Math.floor((alert.timestamp || new Date()).getTime() / 1000)
          }
        ]
      };
      
      const response = await fetch(this.slackWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slackPayload)
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        return {
          success: false,
          channel: "slack",
          error: `Slack webhook error: ${response.status} - ${errorText}`
        };
      }
      
      return { success: true, channel: "slack" };
    } catch (error: any) {
      return {
        success: false,
        channel: "slack",
        error: error.message || "Unknown error sending to Slack"
      };
    }
  }
  
  /**
   * Send alert to custom webhook
   */
  private async sendToWebhook(alert: AlertPayload): Promise<NotificationResult> {
    if (!this.customWebhookUrl) {
      return { success: false, channel: "webhook", error: "No custom webhook URL configured" };
    }
    
    try {
      const payload = {
        alert_kind: alert.kind,
        message: alert.message,
        source: alert.source || "dream-team-hub",
        metadata: alert.metadata,
        timestamp: (alert.timestamp || new Date()).toISOString(),
      };
      
      const response = await fetch(this.customWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'DreamTeamHub-AlertNotifier/1.0'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        return {
          success: false,
          channel: "webhook",
          error: `Webhook error: ${response.status} - ${errorText}`
        };
      }
      
      return { success: true, channel: "webhook" };
    } catch (error: any) {
      return {
        success: false,
        channel: "webhook",
        error: error.message || "Unknown error sending to webhook"
      };
    }
  }
  
  /**
   * Get Slack attachment color based on alert kind
   */
  private getSlackColor(kind: AlertKind): string {
    switch (kind) {
      case "critical":
        return "#8B0000"; // Dark red
      case "error":
        return "#FF0000"; // Red
      case "warn":
        return "#FFA500"; // Orange
      case "info":
      default:
        return "#36A64F"; // Green
    }
  }
  
  /**
   * Get emoji for alert kind
   */
  private getAlertEmoji(kind: AlertKind): string {
    switch (kind) {
      case "critical":
        return "🚨";
      case "error":
        return "❌";
      case "warn":
        return "⚠️";
      case "info":
      default:
        return "ℹ️";
    }
  }
  
  /**
   * Format metadata object for display
   */
  private formatMetadata(metadata: Record<string, any>): string {
    const entries = Object.entries(metadata);
    if (entries.length === 0) return "(none)";
    
    return entries
      .map(([key, value]) => {
        const formattedValue = typeof value === 'object' 
          ? JSON.stringify(value, null, 2) 
          : String(value);
        return `*${key}*: ${formattedValue}`;
      })
      .join('\n');
  }
  
  /**
   * Check if any notification channels are configured
   */
  isConfigured(): boolean {
    return !!(this.slackWebhookUrl || this.customWebhookUrl);
  }
  
  /**
   * Get list of configured channels
   */
  getConfiguredChannels(): string[] {
    const channels = ["console"]; // Console is always available
    
    if (this.slackWebhookUrl) {
      channels.push("slack");
    }
    
    if (this.customWebhookUrl) {
      channels.push("webhook");
    }
    
    return channels;
  }
}

// Singleton instance
export const alertNotifier = new AlertNotifier();
