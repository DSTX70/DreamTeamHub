import fs from "fs";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "ops_settings.json");

export type OpsSettings = {
  slackWebhookUrl?: string;
  emailEnabled?: boolean;
  emailFrom?: string;
  emailTo?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  hotkeysEnabled?: boolean;
  weeklyDigestEnabled?: boolean;
  weeklyDigestDay?: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  weeklyDigestHour?: number; // 0-23
  weeklyDigestTo?: string; // Email override for digest (falls back to emailTo if blank)
};

async function ensureDir() {
  await fs.promises.mkdir(DATA_DIR, { recursive: true });
}

export async function readSettings(): Promise<OpsSettings> {
  try {
    await ensureDir();
    const buf = await fs.promises.readFile(FILE);
    return JSON.parse(String(buf));
  } catch {
    return {};
  }
}

export async function writeSettings(s: OpsSettings) {
  await ensureDir();
  await fs.promises.writeFile(FILE, JSON.stringify(s, null, 2));
}

export async function effectiveSettings(): Promise<Required<OpsSettings>> {
  const disk = await readSettings();
  return {
    slackWebhookUrl: disk.slackWebhookUrl || process.env.SLACK_WEBHOOK_URL || "",
    emailEnabled: disk.emailEnabled ?? false,
    emailFrom: disk.emailFrom || process.env.EMAIL_FROM || "",
    emailTo: disk.emailTo || process.env.EMAIL_TO || "",
    smtpHost: disk.smtpHost || process.env.SMTP_HOST || "",
    smtpPort: Number(disk.smtpPort || process.env.SMTP_PORT || 587),
    smtpUser: disk.smtpUser || process.env.SMTP_USER || "",
    smtpPass: disk.smtpPass || process.env.SMTP_PASS || "",
    hotkeysEnabled: disk.hotkeysEnabled ?? true,
    weeklyDigestEnabled: disk.weeklyDigestEnabled ?? false,
    weeklyDigestDay: disk.weeklyDigestDay ?? 0, // Default to Sunday
    weeklyDigestHour: disk.weeklyDigestHour ?? 9, // Default to 9 AM
    weeklyDigestTo: disk.weeklyDigestTo || "", // Falls back to emailTo in the digest scheduler
  };
}
