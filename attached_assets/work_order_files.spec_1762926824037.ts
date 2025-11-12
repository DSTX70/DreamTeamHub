
/**
 * @file tests/work_order_files.spec.ts
 * Minimal route test for GET /api/work-orders/:woId/files
 * Assumes supertest + jest environment and an Express app import.
 */
import request from 'supertest';
import { app } from '../app'; // <-- adjust to your express export
import { pool } from '../db'; // <-- adjust to your DB helper

describe('GET /api/work-orders/:woId/files', () => {
  const woId = 'WO-001';
  beforeAll(async () => {
    // seed: ensure view exists and link WI#7 to WO-001 in test DB
    await pool.query(`UPDATE work_items SET work_order_id = $1 WHERE id = 7`, [woId]);
  });

  it('returns ok with files array', async () => {
    const res = await request(app).get(`/api/work-orders/${woId}/files`).expect(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('work_order_id', woId);
    expect(Array.isArray(res.body.files)).toBe(true);
  });
});
