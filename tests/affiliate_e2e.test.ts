/**
 * Pseudo E2E using supertest.
 * Adjust to your test runner. This serves as a spec for expected behaviors.
 */

import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import affiliateRouter from "../server/routes/affiliate.route";

describe("Affiliate E2E", () => {
  const app = express();
  app.use(cookieParser());
  app.use(affiliateRouter);

  it("records a click and sets cookie", async () => {
    const res = await request(app).get("/api/aff/click?code=AFF123");
    expect(res.status).toBe(200);
    const setCookie = (res.header["set-cookie"]||[]).join(";");
    expect(setCookie).toContain("aff_code=AFF123");
  });

  it("attributes order to cookie affiliate", async () => {
    const agent = request.agent(app);
    // click first to set cookie
    await agent.get("/api/aff/click?code=AFFXYZ");
    const res = await agent.post("/api/aff/attribute").send({ orderId: "O1", orderTotal: 50 });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe("AFFXYZ");
  });

  it("returns report & csv", async () => {
    const res = await request(app).get("/api/ops/aff/report");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);

    const csv = await request(app).get("/api/ops/aff/report.csv");
    expect(csv.status).toBe(200);
    expect(csv.text.split('\n')[0]).toContain("affiliate,clicks,uniqueVisitors,orders");
  });
});
