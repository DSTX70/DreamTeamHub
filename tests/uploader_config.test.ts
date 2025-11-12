/**
 * Uploader Configuration Validation Tests
 * Tests config validation, RBAC enforcement, and edge cases
 */

import request from "supertest";
import app from "../server/index";
import { db } from "../server/db";
import { opsSettings } from "../shared/schema";
import { eq } from "drizzle-orm";

describe("Uploader Configuration API", () => {
  describe("GET /api/ops/uploader/config", () => {
    it("returns config with backend, effective settings, and locked flags", async () => {
      const res = await request(app)
        .get("/api/ops/uploader/config")
        .set("x-role", "ops_viewer"); // Simulate authenticated user

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("backend");
      expect(res.body).toHaveProperty("effective");
      expect(res.body.effective).toHaveProperty("allowlist");
      expect(res.body.effective).toHaveProperty("maxSizeMB");
      expect(res.body.effective).toHaveProperty("enabled");
      expect(res.body).toHaveProperty("locked");
    });

    it("merges env vars with database settings correctly", async () => {
      const res = await request(app)
        .get("/api/ops/uploader/config")
        .set("x-role", "ops_viewer");

      expect(res.status).toBe(200);
      // Backend should be locked to env value
      expect(res.body.locked.backend).toBe(true);
      // Effective settings should have sensible defaults or DB values
      expect(res.body.effective.maxSizeMB).toBeGreaterThan(0);
      expect(res.body.effective.maxSizeMB).toBeLessThanOrEqual(200);
    });
  });

  describe("POST /api/ops/uploader/config - Validation", () => {
    it("rejects requests without ops_admin role", async () => {
      const res = await request(app)
        .post("/api/ops/uploader/config")
        .set("x-role", "ops_viewer") // Not ops_admin
        .send({ maxSizeMB: 50 });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain("ops_admin");
    });

    it("accepts valid config from ops_admin", async () => {
      const res = await request(app)
        .post("/api/ops/uploader/config")
        .set("x-role", "ops_admin")
        .send({
          maxSizeMB: 75,
          allowlist: "image/png,image/jpeg,application/pdf",
          enabled: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("clamps maxSizeMB below minimum (1 MB) automatically", async () => {
      const res = await request(app)
        .post("/api/ops/uploader/config")
        .set("x-role", "ops_admin")
        .send({ maxSizeMB: 0 });

      expect(res.status).toBe(200); // Accepts but clamps

      const config = await request(app)
        .get("/api/ops/uploader/config")
        .set("x-role", "ops_admin");

      expect(config.body.effective.maxSizeMB).toBe(1); // Clamped to minimum
    });

    it("clamps maxSizeMB above maximum (200 MB) automatically", async () => {
      const res = await request(app)
        .post("/api/ops/uploader/config")
        .set("x-role", "ops_admin")
        .send({ maxSizeMB: 250 });

      expect(res.status).toBe(200); // Accepts but clamps

      const config = await request(app)
        .get("/api/ops/uploader/config")
        .set("x-role", "ops_admin");

      expect(config.body.effective.maxSizeMB).toBe(200); // Clamped to maximum
    });

    it("clamps maxSizeMB to valid range automatically", async () => {
      const res = await request(app)
        .post("/api/ops/uploader/config")
        .set("x-role", "ops_admin")
        .send({ maxSizeMB: 150 }); // Within range

      expect(res.status).toBe(200);

      // Verify it was saved
      const config = await request(app)
        .get("/api/ops/uploader/config")
        .set("x-role", "ops_admin");

      expect(config.body.effective.maxSizeMB).toBe(150);
    });

    it("rejects invalid allowlist format (contains slash)", async () => {
      const res = await request(app)
        .post("/api/ops/uploader/config")
        .set("x-role", "ops_admin")
        .send({ allowlist: "image/png,image/jpeg" }); // Invalid: contains '/'

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/allowlist/i);
    });

    it("accepts valid comma-separated allowlist (lowercase alphanumeric)", async () => {
      const res = await request(app)
        .post("/api/ops/uploader/config")
        .set("x-role", "ops_admin")
        .send({ allowlist: "png,jpeg,pdf,csv,json,webp" }); // Valid format

      expect(res.status).toBe(200);
    });

    it("accepts allowlist with extra whitespace and uppercase (normalized)", async () => {
      const res = await request(app)
        .post("/api/ops/uploader/config")
        .set("x-role", "ops_admin")
        .send({ allowlist: " PNG , JPEG , PDF " });

      expect(res.status).toBe(200);

      const config = await request(app)
        .get("/api/ops/uploader/config")
        .set("x-role", "ops_admin");

      // Should be normalized to lowercase, comma-separated without extra spaces
      expect(config.body.effective.allowlist).toBe("png,jpeg,pdf");
    });

    it("rejects empty allowlist", async () => {
      const res = await request(app)
        .post("/api/ops/uploader/config")
        .set("x-role", "ops_admin")
        .send({ allowlist: "" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/allowlist|empty/i);
    });

    it("rejects allowlist with special characters (except allowed)", async () => {
      const res = await request(app)
        .post("/api/ops/uploader/config")
        .set("x-role", "ops_admin")
        .send({ allowlist: "png,jpeg@test,pdf" }); // '@' not allowed

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/allowlist/i);
    });

    it("accepts allowlist with allowed special chars (.-_)", async () => {
      const res = await request(app)
        .post("/api/ops/uploader/config")
        .set("x-role", "ops_admin")
        .send({ allowlist: "image.png,file-name,test_file" }); // .-_ are allowed

      expect(res.status).toBe(200);
    });

    it("rejects allowlist exceeding 200 characters", async () => {
      const longList = "a".repeat(201); // 201 characters
      const res = await request(app)
        .post("/api/ops/uploader/config")
        .set("x-role", "ops_admin")
        .send({ allowlist: longList });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/allowlist/i);
    });

    it("accepts enabled toggle", async () => {
      const resDisable = await request(app)
        .post("/api/ops/uploader/config")
        .set("x-role", "ops_admin")
        .send({ enabled: false });

      expect(resDisable.status).toBe(200);

      const configDisabled = await request(app)
        .get("/api/ops/uploader/config")
        .set("x-role", "ops_admin");

      expect(configDisabled.body.effective.enabled).toBe(false);

      // Re-enable
      const resEnable = await request(app)
        .post("/api/ops/uploader/config")
        .set("x-role", "ops_admin")
        .send({ enabled: true });

      expect(resEnable.status).toBe(200);
    });

    it("rejects malformed JSON", async () => {
      const res = await request(app)
        .post("/api/ops/uploader/config")
        .set("x-role", "ops_admin")
        .set("Content-Type", "application/json")
        .send("{ invalid json");

      expect(res.status).toBe(400);
    });

    it("rejects unexpected fields gracefully", async () => {
      const res = await request(app)
        .post("/api/ops/uploader/config")
        .set("x-role", "ops_admin")
        .send({
          maxSizeMB: 50,
          hackerField: "malicious",
          anotherBadField: true,
        });

      // Should succeed but ignore unknown fields
      expect(res.status).toBe(200);
    });
  });

  describe("Audit Trail Verification", () => {
    it("creates audit record when config is updated", async () => {
      const uniqueSize = 42; // Unique value to identify this test
      
      await request(app)
        .post("/api/ops/uploader/config")
        .set("x-role", "ops_admin")
        .send({ maxSizeMB: uniqueSize });

      // Query audit table to verify trigger worked
      const audit = await db.execute(`
        SELECT * FROM ops_settings_audit 
        WHERE setting_key = 'uploader' 
        ORDER BY changed_at DESC 
        LIMIT 1
      `);

      expect(audit.rows.length).toBeGreaterThan(0);
      const latestAudit = audit.rows[0] as any;
      expect(latestAudit.changed_by).toBeDefined();
      expect(latestAudit.changed_at).toBeDefined();
      
      const newValue = JSON.parse(latestAudit.new_value);
      expect(newValue.maxSizeMB).toBe(uniqueSize);
    });

    it("captures user ID in audit trail", async () => {
      await request(app)
        .post("/api/ops/uploader/config")
        .set("x-role", "ops_admin")
        .send({ enabled: false });

      const audit = await db.execute(`
        SELECT * FROM ops_settings_audit 
        WHERE setting_key = 'uploader' 
        ORDER BY changed_at DESC 
        LIMIT 1
      `);

      const latestAudit = audit.rows[0] as any;
      expect(latestAudit.changed_by).toBeTruthy();
      expect(typeof latestAudit.changed_by).toBe("string");
    });
  });

  describe("Edge Cases", () => {
    it("handles missing optional fields with defaults", async () => {
      const res = await request(app)
        .post("/api/ops/uploader/config")
        .set("x-role", "ops_admin")
        .send({}); // Empty body

      expect(res.status).toBe(200);
    });

    it("handles partial updates without overwriting other settings", async () => {
      // Set initial config
      await request(app)
        .post("/api/ops/uploader/config")
        .set("x-role", "ops_admin")
        .send({
          maxSizeMB: 100,
          allowlist: "png,jpeg",
          enabled: true,
        });

      // Update only maxSizeMB
      await request(app)
        .post("/api/ops/uploader/config")
        .set("x-role", "ops_admin")
        .send({ maxSizeMB: 80 });

      const config = await request(app)
        .get("/api/ops/uploader/config")
        .set("x-role", "ops_admin");

      expect(config.body.effective.maxSizeMB).toBe(80);
      // Other settings should remain
      expect(config.body.effective.allowlist).toContain("png");
      expect(config.body.effective.enabled).toBe(true);
    });

    it("handles concurrent updates gracefully", async () => {
      // Simulate two admins updating at the same time
      const updates = [
        request(app)
          .post("/api/ops/uploader/config")
          .set("x-role", "ops_admin")
          .send({ maxSizeMB: 90 }),
        request(app)
          .post("/api/ops/uploader/config")
          .set("x-role", "ops_admin")
          .send({ maxSizeMB: 95 }),
      ];

      const results = await Promise.all(updates);
      expect(results.every((r) => r.status === 200)).toBe(true);

      // Final value should be one of the two
      const config = await request(app)
        .get("/api/ops/uploader/config")
        .set("x-role", "ops_admin");

      expect([90, 95]).toContain(config.body.effective.maxSizeMB);
    });
  });
});
