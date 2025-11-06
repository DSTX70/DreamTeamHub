export type InventoryItem = {
  sku: string;
  name: string;
  stock: number;
  threshold: number;
  updatedAt: string;
};

export type LowStockRow = { sku: string; name: string; stock: number; threshold: number };
