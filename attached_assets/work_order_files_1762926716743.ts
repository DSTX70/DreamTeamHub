
import { Router } from 'express';
import type { Request, Response } from 'express';
import { pool } from '../db'; // adjust import to your DB helper

export const workOrderFilesRouter = Router();

// GET /api/work-orders/:woId/files
workOrderFilesRouter.get('/work-orders/:woId/files', async (req: Request, res: Response) => {
  const { woId } = req.params as { woId: string };
  try {
    const { rows } = await pool.query(
      `SELECT * FROM work_order_files WHERE work_order_id = $1 ORDER BY created_at DESC`,
      [woId]
    );
    return res.json({ ok: true, work_order_id: woId, files: rows });
  } catch (e: any) {
    return res.status(500).json({ ok:false, error: e.message });
  }
});

// Optional: POST /api/work-orders/:woId/upload
workOrderFilesRouter.post('/work-orders/:woId/upload', async (req: Request, res: Response) => {
  const { woId } = req.params as { woId: string };
  try {
    const find = await pool.query(
      `SELECT id FROM work_items WHERE work_order_id = $1 AND title ILIKE 'Assets%' ORDER BY id LIMIT 1`,
      [woId]
    );
    let workItemId = find.rows[0]?.id;
    if (!workItemId) {
      const ins = await pool.query(
        `INSERT INTO work_items (title, work_order_id, status) VALUES ($1,$2,$3) RETURNING id`,
        ['Assets', woId, 'open']
      );
      workItemId = ins.rows[0].id;
    }
    (req as any).body = (req as any).body || {};
    (req as any).body.work_item_id = workItemId;
    return res.status(400).json({
      ok:false,
      error:'Hook this to your existing uploader handler or call /api/ops/uploader/upload with work_item_id',
      work_item_id: workItemId
    });
  } catch (e: any) {
    return res.status(500).json({ ok:false, error: e.message });
  }
});
