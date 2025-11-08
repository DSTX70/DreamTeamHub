// tests/healthz.test.ts
// Skeleton test using supertest (install: npm i -D supertest jest ts-jest @types/jest)
import request from "supertest";
import app from "../server/index"; // adjust path to your app export

describe("/api/healthz", () => {
  it("returns JSON with ok/checks/latencyMs", async () => {
    const res = await request(app).get("/api/healthz");
    expect(res.status).toBeLessThan(600);
    expect(res.body).toHaveProperty("ok");
    expect(res.body).toHaveProperty("checks");
    expect(res.body).toHaveProperty("latencyMs");
  });
});
