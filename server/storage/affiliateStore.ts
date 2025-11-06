import { v4 as uuidv4 } from "uuid";

type ClickEvent = {
  id: string;
  ts: number; // epoch ms UTC
  type: "click";
  code: string;
  source?: string;
  ua?: string;
  ip?: string;
  visitorKey: string; // derived from ip+ua (very rough)
};

type AttributionEvent = {
  id: string;
  ts: number;
  type: "attribution";
  code?: string; // may be undefined if no cookie
  orderId: string;
  orderTotal: number;
};

type Event = ClickEvent | AttributionEvent;

type ReportWindow = { fromISO: string; toISO: string; };
type ReportItem = {
  code: string;
  clicks: number;
  uniqueVisitors: number;
  orders: number;
  revenue: number;
  commission: number;
  conversionRate: number;
};

function startOfDayUTC(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function endOfDayUTC(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

function sanitizeCode(code?: string) {
  return (code || "").trim().toUpperCase();
}

function visitorKeyFrom(ip?: string | string[], ua?: string | string[]) {
  const ipStr = Array.isArray(ip) ? ip[0] : (ip || "");
  const uaStr = Array.isArray(ua) ? ua[0] : (ua || "");
  return `${ipStr}|${uaStr}`.slice(0, 256);
}

export class AffiliateStore {
  private static _instance: AffiliateStore;
  static get() {
    if (!this._instance) this._instance = new AffiliateStore();
    return this._instance;
  }

  private events: Event[] = [];

  recordClick(input: { code: string; source?: string; ua?: string | string[]; ip?: string | string[]; }) {
    const evt: ClickEvent = {
      id: uuidv4(),
      ts: Date.now(),
      type: "click",
      code: sanitizeCode(input.code),
      source: input.source,
      ua: Array.isArray(input.ua) ? input.ua[0] : input.ua,
      ip: Array.isArray(input.ip) ? input.ip[0] : input.ip,
      visitorKey: visitorKeyFrom(input.ip, input.ua),
    };
    this.events.push(evt);
  }

  recordAttribution(input: { orderId: string; orderTotal: number; code?: string; }) {
    const evt: AttributionEvent = {
      id: uuidv4(),
      ts: Date.now(),
      type: "attribution",
      code: sanitizeCode(input.code),
      orderId: String(input.orderId),
      orderTotal: Number(input.orderTotal),
    };
    this.events.push(evt);
  }

  listEvents(limit = 100): Event[] {
    return this.events.slice(-limit).reverse();
  }

  getReport(input: { fromISO?: string; toISO?: string; commissionRate: number; }) {
    const now = new Date();
    const from = input.fromISO ? new Date(input.fromISO) : new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30); // default last 30d
    const to = input.toISO ? new Date(input.toISO) : now;

    const window: ReportWindow = {
      fromISO: new Date(startOfDayUTC(from)).toISOString(),
      toISO: new Date(endOfDayUTC(to)).toISOString(),
    };

    const clicksByCode: Record<string, ClickEvent[]> = {};
    const visitorsByCode: Record<string, Set<string>> = {};
    const ordersByCode: Record<string, AttributionEvent[]> = {};

    for (const e of this.events) {
      if (e.ts < new Date(window.fromISO).getTime() || e.ts > new Date(window.toISO).getTime()) continue;
      if (e.type === "click") {
        const c = e.code || "UNKNOWN";
        (clicksByCode[c] ||= []).push(e);
        (visitorsByCode[c] ||= new Set()).add(e.visitorKey);
      } else if (e.type === "attribution") {
        const c = sanitizeCode(e.code) || "UNATTRIBUTED";
        (ordersByCode[c] ||= []).push(e);
      }
    }

    const codes = new Set<string>([...Object.keys(clicksByCode), ...Object.keys(ordersByCode)]);
    const items: ReportItem[] = Array.from(codes).sort().map(code => {
      const clicks = (clicksByCode[code] || []).length;
      const uniqueVisitors = (visitorsByCode[code] || new Set()).size;
      const ordersArr = ordersByCode[code] || [];
      const orders = ordersArr.length;
      const revenue = ordersArr.reduce((s, o) => s + o.orderTotal, 0);
      const commission = revenue * input.commissionRate;
      const conversionRate = clicks ? orders / clicks : 0;
      return { code, clicks, uniqueVisitors, orders, revenue, commission, conversionRate };
    });

    const totals = items.reduce((acc, it) => {
      acc.clicks += it.clicks;
      acc.uniqueVisitors += it.uniqueVisitors;
      acc.orders += it.orders;
      acc.revenue += it.revenue;
      acc.commission += it.commission;
      return acc;
    }, { clicks: 0, uniqueVisitors: 0, orders: 0, revenue: 0, commission: 0 });

    return { items, totals, window };
  }
}
