// Pseudo-test to exercise payouts math (rates override)
import { affiliateRatesDao } from "../server/db/affiliateDao.rates";

describe("payouts math", () => {
  it("computes per-affiliate rates with fallback", async () => {
    // This is a spec placeholder; in real tests, seed a test DB and assert rows.
    expect(typeof affiliateRatesDao.payouts).toBe("function");
  });
});
