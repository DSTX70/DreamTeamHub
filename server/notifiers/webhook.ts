import type { LowStockPayload, Notifier } from "./types";

export function webhookNotifier(opts: { url?: string | null }): Notifier | null {
  if (!opts.url) return null;
  return async (p: LowStockPayload) => {
    try {
      await fetch(opts.url!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `LOW STOCK — ${p.sku}: ${p.stock} (thr ${p.threshold})`,
          attachments: [{
            color: p.stock <= p.threshold ? "#E11D48" : "#10B981",
            fields: [
              { title: "SKU", value: p.sku, short: true },
              { title: "Stock", value: String(p.stock), short: true },
              { title: "Threshold", value: String(p.threshold), short: true },
              { title: "At", value: p.at, short: true }
            ]
          }]
        })
      });
    } catch (e) {
      console.error("webhookNotifier failed", e);
    }
  };
}
