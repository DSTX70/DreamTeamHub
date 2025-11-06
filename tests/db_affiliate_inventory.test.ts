// Minimal smoke tests — requires DATABASE_URL and tables created
import 'dotenv/config';
import { affiliateDao } from "../server/db/affiliateDao";
import { inventoryDao } from "../server/db/inventoryDao";

describe("DB-backed DAOs", () => {
  it("records a click + attribution (smoke)", async () => {
    await affiliateDao.recordClick({ code: "AFFTEST", source: "jest", ua: "ua", ip: "127.0.0.1" });
    await affiliateDao.recordAttribution({ orderId: "TEST-O1", orderTotal: 12.34, code: "AFFTEST" });
    const rep = await affiliateDao.getReport({ commissionRate: 0.1 });
    expect(Array.isArray(rep.items)).toBe(true);
  });

  it("lists products (smoke)", async () => {
    const prods = await inventoryDao.listProducts();
    expect(Array.isArray(prods)).toBe(true);
  });
});
