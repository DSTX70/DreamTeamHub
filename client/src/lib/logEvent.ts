export type LogOpts = {
  kind: string;
  ownerType?: "BU" | "BRAND" | "PRODUCT" | "PROJECT";
  ownerId?: string;
  message?: string;
  meta?: Record<string, any>;
  actor?: string;
};

/**
 * Fire-and-forget event logger
 * Sends operational events to /api/ops/events
 * Intentionally swallows errors to prevent telemetry from breaking UX
 */
export async function logEvent(opts: LogOpts): Promise<void> {
  try {
    await fetch("/api/ops/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(opts),
      keepalive: true, // Allows request to finish during page unloads
    });
  } catch {
    // Intentionally swallow errors - telemetry must not break UX
  }
}
