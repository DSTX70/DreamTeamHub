export type LowStockPayload = { kind: "low-stock"; sku: string; stock: number; threshold: number; at: string };
export type Notifier = (p: LowStockPayload) => Promise<void> | void;
