export type AffiliateReportItem = {
  code: string;
  clicks: number;
  uniqueVisitors: number;
  orders: number;
  revenue: number;
  commission: number;
  conversionRate: number; // 0..1
};

export type AffiliateEvent =
  | { id: string; ts: number; type: "click"; code: string; source?: string }
  | { id: string; ts: number; type: "attribution"; code?: string; orderId: string; orderTotal: number };
