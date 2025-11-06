import { inventoryDao } from "../db/inventoryDao";

type LowStockPayload = { kind: "low-stock"; sku: string; stock: number; threshold: number; at: string };
export type Notifier = (p: LowStockPayload) => Promise<void> | void;

type Opts = {
  intervalMs?: number;
  notifiers?: Notifier[];
  throttleMs?: number; // optional cooldown per sku
};

let timer: NodeJS.Timeout | null = null;
const lastSeen = new Map<string, number>(); // key: sku:stock -> ts

function shouldNotify(key: string, throttleMs?: number) {
  const now = Date.now();
  const prev = lastSeen.get(key) || 0;
  if (throttleMs && now - prev < throttleMs) return false;
  lastSeen.set(key, now);
  return true;
}

export function startLowStockSchedulerDB(opts: Opts = {}) {
  const interval = Math.max(10_000, opts.intervalMs ?? 60_000);

  const scan = async () => {
    const lows = await inventoryDao.getLowStock();
    for (const it of lows as any[]) {
      await inventoryDao.recordLowEvent(it.sku);
      const key = `${it.sku}:${it.stock}`;
      if (!shouldNotify(key, opts.throttleMs)) continue;
      const payload: LowStockPayload = { kind: "low-stock", sku: it.sku, stock: Number(it.stock), threshold: Number(it.threshold), at: new Date().toISOString() };
      for (const notify of opts.notifiers || []) {
        try { await notify(payload); } catch (e) { console.error("Notifier failed:", e); }
      }
    }
  };

  scan().catch(console.error);
  if (timer) clearInterval(timer);
  timer = setInterval(() => { scan().catch(console.error); }, interval);

  return { stop() { if (timer) clearInterval(timer); timer = null; }, scan };
}
