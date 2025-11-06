import express from "express";
import request from "supertest";
import { router as affiliates } from "../server/routes/affiliate.route";

const app = express();
app.use(express.json());
app.use((req, _res, next) => { (req as any).ip = "127.0.0.1"; next(); });
app.use(affiliates);

test("seed codes, attribute orders, and get report", async () => {
  await request(app).post("/api/affiliates/seed").send();

  // Attribute 2 orders, one with a code
  await request(app)
    .post("/api/affiliates/attribute")
    .set("Cookie", "aff_code=PRISM10")
    .send({ orderId: "O1", email: "a@example.com", amount: 10.00 });

  await request(app)
    .post("/api/affiliates/attribute")
    .send({ orderId: "O2", email: "b@example.com", amount: 5.00 });

  const r = await request(app).get("/api/affiliates/report");
  expect(r.status).toBe(200);
  expect(r.body.totals.totalOrders).toBeGreaterThanOrEqual(2);
  // byCode should include PRISM10 and '—'
  expect(Object.keys(r.body.totals.byCode)).toEqual(expect.arrayContaining(["PRISM10","—"]));
});
