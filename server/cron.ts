import cron from 'node-cron';
import { storage } from './storage';
import { startLowStockScheduler } from './scheduler/lowStockScheduler';

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

  // Start low-stock inventory scheduler (scans every 60 seconds)
  startLowStockScheduler({ intervalMs: 60_000 });
  console.log('[Cron] 📦 Low-stock inventory scheduler started (60s interval)');

  // Optional: Run on startup for testing (disabled by default)
  // Uncomment the line below to create a snapshot when the server starts
  // createNightlyGoldenSnapshot().catch(console.error);
}
