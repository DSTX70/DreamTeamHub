import cron from 'node-cron';
import { storage } from './storage';
import { startLowStockSchedulerDB } from './scheduler/lowStockScheduler.db';
import { startWeeklyDigest } from './scheduler/weeklyDigest';
import { webhookNotifier } from './notifiers/webhook';
import { emailNotifier } from './notifiers/email';

/**
 * Nightly Agent Goldens Snapshot
 * Creates a complete snapshot of all agents and their specifications
 * Runs every night at 2:00 AM server time
 */
async function createNightlyGoldenSnapshot() {
  console.log('[Cron] Starting nightly agent golden snapshot...');
  const startTime = Date.now();

  try {
    // Fetch all current agents and specs
    const agents = await storage.getAgents({});
    const agentSpecs = await storage.getAgentSpecs();

    // Calculate payload size (rough estimate in MB)
    const payloadSize = JSON.stringify({ agents, agentSpecs }).length / (1024 * 1024);
    const MAX_SIZE_MB = 50; // PostgreSQL JSONB safe limit

    if (payloadSize > MAX_SIZE_MB) {
      console.warn(`[Cron] ⚠️  Snapshot payload too large (${payloadSize.toFixed(2)} MB > ${MAX_SIZE_MB} MB)`);
      console.log('[Cron] Consider implementing compression or pagination for large datasets');
      return;
    }

    // Create the snapshot
    const golden = await storage.createAgentGolden({
      snapshotDate: new Date(),
      agentCount: agents.length,
      agentData: agents,
      agentSpecsData: agentSpecs,
      metadata: {
        triggeredBy: 'cron',
        duration: Date.now() - startTime,
        checksum: `${agents.length}-${agentSpecs.length}-${Date.now()}`,
        payloadSizeMB: parseFloat(payloadSize.toFixed(2))
      }
    });

    console.log(`[Cron] ✅ Golden snapshot created: ${agents.length} agents, ${agentSpecs.length} specs (ID: ${golden.id})`);
    console.log(`[Cron] Payload size: ${payloadSize.toFixed(2)} MB, Duration: ${golden.metadata?.duration}ms`);
  } catch (error) {
    console.error('[Cron] ❌ Failed to create golden snapshot:', error);
  }
}

/**
 * Initialize all cron jobs
 */
export function initializeCronJobs() {
  // Run every night at 2:00 AM
  // Cron pattern: minute hour day month weekday
  // '0 2 * * *' = At 02:00 every day
  cron.schedule('0 2 * * *', createNightlyGoldenSnapshot, {
    timezone: 'America/Los_Angeles' // Adjust timezone as needed
  });

  console.log('[Cron] 🕐 Nightly agent golden snapshot scheduled for 2:00 AM');

  // Start DB-backed low-stock inventory scheduler with webhook + email notifiers
  const notifiers = [
    // Webhook notifier (Slack-compatible)
    process.env.SLACK_WEBHOOK_URL ? webhookNotifier({ url: process.env.SLACK_WEBHOOK_URL }) : null,
    // Email notifier (optional, requires SMTP config)
    process.env.SMTP_HOST ? emailNotifier({
      enabled: true,
      from: process.env.MAIL_FROM || 'noreply@dreamteamhub.app',
      to: process.env.EMAIL_TO || 'ops@dreamteamhub.app',
      transport: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: {
          user: process.env.SMTP_USER!,
          pass: process.env.SMTP_PASS!
        }
      }
    }) : null
  ].filter(Boolean) as any[];
  
  startLowStockSchedulerDB({ 
    intervalMs: 60_000,
    notifiers,
    throttleMs: 300_000 // 5min cooldown between duplicate alerts for same SKU+stock level
  });
  console.log(`[Cron] 📦 DB-backed low-stock scheduler started (60s interval, ${notifiers.length} notifier(s))`);

  // Start weekly digest scheduler
  startWeeklyDigest();

  // Optional: Run on startup for testing (disabled by default)
  // Uncomment the line below to create a snapshot when the server starts
  // createNightlyGoldenSnapshot().catch(console.error);
}
