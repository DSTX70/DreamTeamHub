import { eq, desc } from "drizzle-orm";
import { canonSyncEvents, type InsertCanonSyncEvent } from "@shared/schema";

export type CanonSyncStatus = "synced" | "stale" | "unknown";

export type CanonStatusResponse = {
  canonKey: string;
  canonVersion: string;
  source: string;
  lastSyncedAt: string | null;
  status: CanonSyncStatus;
};

const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function getLatestCanonStatus(
  db: any,
  canonKey: string
): Promise<CanonStatusResponse> {
  const rows = await db
    .select()
    .from(canonSyncEvents)
    .where(eq(canonSyncEvents.canonKey, canonKey))
    .orderBy(desc(canonSyncEvents.syncedAt))
    .limit(1);

  if (rows.length === 0) {
    return {
      canonKey,
      canonVersion: "unknown",
      source: "unknown",
      lastSyncedAt: null,
      status: "unknown",
    };
  }

  const latest = rows[0];
  const syncedAt = latest.syncedAt ? new Date(latest.syncedAt).getTime() : 0;
  const isStale = Date.now() - syncedAt > STALE_THRESHOLD_MS;

  return {
    canonKey,
    canonVersion: latest.canonVersion,
    source: latest.source ?? "unknown",
    lastSyncedAt: latest.syncedAt ? latest.syncedAt.toISOString() : null,
    status: isStale ? "stale" : "synced",
  };
}

export async function writeCanonSyncEvent(
  db: any,
  event: InsertCanonSyncEvent
): Promise<void> {
  await db.insert(canonSyncEvents).values(event);
}
