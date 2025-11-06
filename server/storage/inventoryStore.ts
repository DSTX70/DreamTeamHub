type Product = {
  sku: string;
  name: string;
  stock: number;
  threshold: number;
  updatedAt: string; // ISO
};

type LowStockEvent = {
  id: string;
  ts: number;
  type: "low-stock";
  sku: string;
  stock: number;
  threshold: number;
};

function isoNow() { return new Date().toISOString(); }

const seedProducts: Product[] = [
  { sku: "CARD-CC-HELLO-001", name: "ColorCue — Hello Mint", stock: 42, threshold: 10, updatedAt: isoNow() },
  { sku: "CARD-RMX-GROOVE-002", name: "Remix — Groove Grid", stock: 8, threshold: 12, updatedAt: isoNow() },
  { sku: "CARD-HS-LOVE-003", name: "HeartScript — Love Note", stock: 15, threshold: 10, updatedAt: isoNow() },
  { sku: "CARD-ME-NYE-004", name: "Midnight Express — NYE Foil", stock: 3, threshold: 8, updatedAt: isoNow() },
];

let _id = 0;
function nextId() { _id += 1; return String(_id); }

export class InventoryStore {
  private static _instance: InventoryStore;
  static get() { return (this._instance ??= new InventoryStore()); }

  private products: Map<string, Product> = new Map(seedProducts.map(p => [p.sku, { ...p }]));
  private events: LowStockEvent[] = [];

  listProducts(): Product[] {
    return Array.from(this.products.values()).sort((a,b)=>a.sku.localeCompare(b.sku));
  }

  setThreshold(sku: string, threshold: number) {
    const p = this.products.get(sku);
    if (!p) return;
    p.threshold = threshold;
    p.updatedAt = isoNow();
    this.products.set(sku, p);
  }

  setStock(sku: string, stock: number) {
    const p = this.products.get(sku);
    if (!p) return;
    p.stock = stock;
    p.updatedAt = isoNow();
    this.products.set(sku, p);
  }

  getLowStock() {
    return this.listProducts()
      .filter(p => p.stock <= p.threshold)
      .map(p => ({ sku: p.sku, name: p.name, stock: p.stock, threshold: p.threshold }));
  }

  recordLowEvent(sku: string) {
    const p = this.products.get(sku);
    if (!p) return;
    const evt: LowStockEvent = {
      id: nextId(),
      ts: Date.now(),
      type: "low-stock",
      sku,
      stock: p.stock,
      threshold: p.threshold,
    };
    // de-dup consecutive for same sku if last event is also low-stock with same stock
    const last = this.events[this.events.length - 1];
    if (!last || !(last.type === "low-stock" && last.sku === sku && last.stock === p.stock)) {
      this.events.push(evt);
    }
  }

  listEvents(limit = 100) {
    return this.events.slice(-limit).reverse();
  }
}
