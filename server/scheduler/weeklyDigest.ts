import { effectiveSettings } from "../notifiers/settingsStore";
import { inventoryDao } from "../db/inventoryDao";
import { db } from "../db/client";
import { sql } from "drizzle-orm";
import nodemailer from "nodemailer";

let timer: NodeJS.Timeout | null = null;
let lastRunKey: string | null = null; // Format: "YYYY-MM-DD-HH"

async function getLowStockWithEmailEnabled() {
  // Get low-stock SKUs where notify_email is true
  const rows = await db.execute(sql`
    SELECT sku, name, stock, threshold
    FROM inventory_products
    WHERE stock <= threshold AND notify_email = true
    ORDER BY sku
  `);
  return rows.rows as any[];
}

async function sendDigest() {
  const settings = await effectiveSettings();
  
  if (!settings.emailEnabled || !settings.emailFrom || !settings.smtpHost) {
    console.log("[WeeklyDigest] Email not configured, skipping digest");
    return;
  }

  const lowStock = await getLowStockWithEmailEnabled();
  
  if (lowStock.length === 0) {
    console.log("[WeeklyDigest] No low-stock items with email notifications enabled");
    return;
  }

  const to = settings.weeklyDigestTo || settings.emailTo;
  if (!to) {
    console.log("[WeeklyDigest] No recipient email configured");
    return;
  }

  // Build email content
  const subject = `Weekly Inventory Digest — ${lowStock.length} Low-Stock SKUs`;
  let text = `Weekly Inventory Low-Stock Summary\n`;
  text += `Generated: ${new Date().toISOString()}\n\n`;
  text += `Total low-stock items: ${lowStock.length}\n\n`;
  text += `SKU                 | Name                    | Stock | Threshold\n`;
  text += `${"─".repeat(70)}\n`;
  
  for (const item of lowStock) {
    const sku = String(item.sku).padEnd(19);
    const name = String(item.name || "").slice(0, 23).padEnd(23);
    const stock = String(item.stock).padStart(5);
    const threshold = String(item.threshold).padStart(9);
    text += `${sku} | ${name} | ${stock} | ${threshold}\n`;
  }

  // Send email
  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: false,
    auth: { 
      user: settings.smtpUser || "", 
      pass: settings.smtpPass || "" 
    }
  });

  await transporter.sendMail({
    from: settings.emailFrom,
    to,
    subject,
    text
  });

  console.log(`[WeeklyDigest] Sent digest to ${to} with ${lowStock.length} low-stock items`);
}

async function checkAndRun() {
  const settings = await effectiveSettings();
  
  if (!settings.weeklyDigestEnabled) {
    return;
  }

  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const currentHour = now.getHours(); // 0-23
  
  // Check if current day and hour match the configured schedule
  if (currentDay !== settings.weeklyDigestDay || currentHour !== settings.weeklyDigestHour) {
    return;
  }

  // Build a key to prevent duplicate runs within the same hour
  const runKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${String(currentHour).padStart(2, "0")}`;
  
  if (runKey === lastRunKey) {
    // Already ran this hour
    return;
  }

  lastRunKey = runKey;
  
  console.log(`[WeeklyDigest] Running weekly digest for day=${currentDay}, hour=${currentHour}`);
  
  try {
    await sendDigest();
  } catch (err) {
    console.error("[WeeklyDigest] Failed to send digest:", err);
  }
}

export function startWeeklyDigest() {
  const interval = 60_000; // Check every minute
  
  checkAndRun().catch(console.error);
  
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    checkAndRun().catch(console.error);
  }, interval);
  
  console.log("[WeeklyDigest] ✅ Weekly digest scheduler started (checks every minute)");
  
  return {
    stop() {
      if (timer) clearInterval(timer);
      timer = null;
      lastRunKey = null;
    }
  };
}
