/** Pseudo tests for inventory thresholds & low-stock */
import express from "express";
import request from "supertest";
import invRouter from "../server/routes/inventory.route";
import { InventoryStore } from "../server/storage/inventoryStore";

describe("Inventory low-stock + thresholds", () => {
  const app = express();
  app.use(invRouter);

  it("lists seeded products", async () => {
    const res = await request(app).get("/api/ops/inventory/thresholds");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it("updates thresholds and triggers low-stock", async () => {
    const res = await request(app).post("/api/ops/inventory/thresholds").send({ items: [{ sku: "CARD-CC-HELLO-001", threshold: 1000 }] });
    expect(res.status).toBe(200);
    const lows = await request(app).get("/api/ops/inventory/low-stock");
    expect(lows.body.items.find((x:any)=>x.sku==="CARD-CC-HELLO-001")).toBeTruthy();
  });

  it("recount updates stock", async () => {
    const res = await request(app).post("/api/ops/inventory/recount").send({ items: [{ sku: "CARD-CC-HELLO-001", stock: 5 }] });
    expect(res.status).toBe(200);
    const list = await request(app).get("/api/ops/inventory/thresholds");
    const row = list.body.items.find((x:any)=>x.sku==="CARD-CC-HELLO-001");
    expect(row.stock).toBe(5);
  });
});
