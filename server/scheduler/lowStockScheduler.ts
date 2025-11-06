import { InventoryStore } from "../storage/inventoryStore";

type Opts = { intervalMs?: number; onNotify?: (payload: { sku: string; stock: number; threshold: number }) => void };

let timer: NodeJS.Timeout | null = null;

export function startLowStockScheduler(opts: Opts = {}) {
  const interval = Math.max(10_000, opts.intervalMs ?? 60_000);
  const store = InventoryStore.get();

  const scan = () => {
    const lows = store.getLowStock();
    for (const it of lows) {
      store.recordLowEvent(it.sku);
      // TODO: wire notifications here (email/slack/webhook)
      if (opts.onNotify) opts.onNotify({ sku: it.sku, stock: it.stock, threshold: it.threshold });
    }
  };

  // kick immediately then loop
  scan();
  if (timer) clearInterval(timer);
  timer = setInterval(scan, interval);
  return { stop() { if (timer) clearInterval(timer); timer = null; } };
}
