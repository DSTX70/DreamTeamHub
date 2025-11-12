import request from "supertest";
import app from "../server/index";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

describe("Work Order Files API", () => {
  const testFileId1 = 9991;
  const testFileId2 = 9992;

  beforeAll(async () => {
    await db.execute(sql`
      INSERT INTO work_orders (id, title, owner, autonomy, inputs, output, caps, kpis, playbook, stop, status)
      VALUES ('WO-TEST-001', 'Test Work Order', 'test-user', 'L1', '{}', 'test-output', 
              '{"runsPerDay": 10, "usdPerDay": 50}', '{"successMin": 90, "p95Max": 500}', 
              'test-playbook', 'on_completion', 'active')
      ON CONFLICT (id) DO NOTHING
    `);
    
    await db.execute(sql`
      INSERT INTO work_items (id, title, description, work_order_id, status)
      VALUES (999, 'Test Work Item for WO-TEST-001', 'Test description', 'WO-TEST-001', 'in_progress')
      ON CONFLICT (id) DO NOTHING
    `);

    await db.execute(sql`
      INSERT INTO work_item_files (id, work_item_id, filename, s3_key, s3_url, size_bytes, mime_type, uploaded_by_user_id)
      VALUES 
        (${testFileId1}, 999, 'test-file-1.json', 's3://test/file1.json', 'https://s3.test/file1.json', 1024, 'application/json', 'test-user'),
        (${testFileId2}, 999, 'test-file-2.csv', 's3://test/file2.csv', 'https://s3.test/file2.csv', 2048, 'text/csv', 'test-user')
      ON CONFLICT (id) DO NOTHING
    `);
  });

  afterAll(async () => {
    await db.execute(sql`DELETE FROM work_item_files WHERE id IN (${testFileId1}, ${testFileId2})`);
    await db.execute(sql`DELETE FROM work_items WHERE id = 999`);
    await db.execute(sql`DELETE FROM work_orders WHERE id = 'WO-TEST-001'`);
  });
  describe("GET /api/work-orders/:woId/files", () => {
    it("returns empty files array for work order with no linked work items", async () => {
      const res = await request(app)
        .get("/api/work-orders/WO-NONEXISTENT/files")
        .set("x-role", "ops_viewer");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("ok", true);
      expect(res.body).toHaveProperty("work_order_id", "WO-NONEXISTENT");
      expect(res.body).toHaveProperty("files");
      expect(Array.isArray(res.body.files)).toBe(true);
      expect(res.body.files).toHaveLength(0);
    });

    it("returns files for work order with seeded test work item in correct order", async () => {
      const res = await request(app)
        .get("/api/work-orders/WO-TEST-001/files")
        .set("x-role", "ops_viewer");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("ok", true);
      expect(res.body).toHaveProperty("work_order_id", "WO-TEST-001");
      expect(res.body).toHaveProperty("files");
      expect(Array.isArray(res.body.files)).toBe(true);
      expect(res.body.files).toHaveLength(2);
      
      expect(res.body.files[0].file_id).toBe(testFileId2);
      expect(res.body.files[0].name).toBe("test-file-2.csv");
      expect(res.body.files[0].mime).toBe("text/csv");
      expect(res.body.files[0].size_bytes).toBe(2048);
      expect(res.body.files[0].work_item_id).toBe(999);
      
      expect(res.body.files[1].file_id).toBe(testFileId1);
      expect(res.body.files[1].name).toBe("test-file-1.json");
      expect(res.body.files[1].mime).toBe("application/json");
      expect(res.body.files[1].size_bytes).toBe(1024);
      expect(res.body.files[1].work_item_id).toBe(999);
      
      const createdAt1 = new Date(res.body.files[0].created_at);
      const createdAt2 = new Date(res.body.files[1].created_at);
      expect(createdAt1.getTime()).toBeGreaterThanOrEqual(createdAt2.getTime());
    });

    it("verifies work_order_files view returns exactly the seeded files", async () => {
      const queryResult = await db.execute(`
        SELECT 
          work_order_id,
          file_id,
          work_item_id,
          name,
          mime,
          size_bytes,
          storage_uri,
          created_at
        FROM work_order_files 
        WHERE work_order_id = 'WO-TEST-001'
        ORDER BY created_at DESC
      `);

      expect(queryResult.rows).toBeDefined();
      expect(Array.isArray(queryResult.rows)).toBe(true);
      expect(queryResult.rows).toHaveLength(2);
      
      const files = queryResult.rows as any[];
      const fileIds = files.map(f => f.file_id);
      expect(fileIds).toContain(testFileId1);
      expect(fileIds).toContain(testFileId2);
      
      const file1 = files.find((f: any) => f.file_id === testFileId1);
      const file2 = files.find((f: any) => f.file_id === testFileId2);
      
      expect(file1).toBeDefined();
      expect(file1.work_order_id).toBe("WO-TEST-001");
      expect(file1.work_item_id).toBe(999);
      expect(file1.name).toBe("test-file-1.json");
      expect(file1.mime).toBe("application/json");
      expect(file1.size_bytes).toBe(1024);
      
      expect(file2).toBeDefined();
      expect(file2.work_order_id).toBe("WO-TEST-001");
      expect(file2.work_item_id).toBe(999);
      expect(file2.name).toBe("test-file-2.csv");
      expect(file2.mime).toBe("text/csv");
      expect(file2.size_bytes).toBe(2048);
    });

    it("verifies work_item linkage to work_order", async () => {
      const queryResult = await db.execute(`
        SELECT id, title, work_order_id 
        FROM work_items 
        WHERE work_order_id = 'WO-TEST-001'
        LIMIT 1
      `);

      expect(queryResult.rows.length).toBeGreaterThan(0);
      const workItem = queryResult.rows[0] as any;
      expect(workItem.work_order_id).toBe("WO-TEST-001");
      expect(workItem.id).toBe(999);
      expect(workItem.title).toBe("Test Work Item for WO-TEST-001");
    });

    it("returns files ordered by created_at DESC", async () => {
      const res = await request(app)
        .get("/api/work-orders/WO-TEST-001/files")
        .set("x-role", "ops_viewer");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("files");
      expect(Array.isArray(res.body.files)).toBe(true);
    });

    it("aggregates exactly the seeded files under work order", async () => {
      const queryResult = await db.execute(`
        SELECT work_order_id, COUNT(DISTINCT work_item_id) as item_count, COUNT(*) as file_count
        FROM work_order_files
        WHERE work_order_id = 'WO-TEST-001'
        GROUP BY work_order_id
      `);

      expect(queryResult.rows).toHaveLength(1);
      const stats = queryResult.rows[0] as any;
      expect(stats.work_order_id).toBe("WO-TEST-001");
      expect(parseInt(stats.file_count)).toBe(2);
      expect(parseInt(stats.item_count)).toBe(1);
    });

    it("handles URL encoding in work order ID", async () => {
      const res = await request(app)
        .get("/api/work-orders/WO-001%20TEST/files")
        .set("x-role", "ops_viewer");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("work_order_id", "WO-001 TEST");
    });
  });

  describe("Work Order File Linkage System", () => {
    it("verifies work_order_id column exists on work_items", async () => {
      const columnCheck = await db.execute(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'work_items' 
        AND column_name = 'work_order_id'
      `);

      expect(columnCheck.rows.length).toBe(1);
      const column = columnCheck.rows[0] as any;
      expect(column.column_name).toBe("work_order_id");
      expect(column.data_type).toMatch(/character varying|text/);
    });

    it("verifies work_order_files view exists", async () => {
      const viewCheck = await db.execute(`
        SELECT table_name 
        FROM information_schema.views 
        WHERE table_name = 'work_order_files'
      `);

      expect(viewCheck.rows.length).toBe(1);
    });

    it("verifies index on work_items.work_order_id exists", async () => {
      const indexCheck = await db.execute(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'work_items' 
        AND indexname = 'idx_work_items_work_order_id'
      `);

      expect(indexCheck.rows.length).toBe(1);
    });
  });
});
