import { Router } from 'express';
import { getFccSkuMap, upsertFccSkuMap } from '../lib/fccSkuMap';
import { z } from 'zod';

export const fccSkuMapRouter = Router();

fccSkuMapRouter.get('/fcc/sku-map', async (req, res) => {
  try {
    const brand = String(req.query.brand || 'fcc');
    const items = await getFccSkuMap(brand);
    res.json({ ok: true, items });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

const upsertSchema = z.object({
  brand: z.string().default('fcc'),
  shot_key: z.string(),
  label: z.string(),
  base_key: z.string(),
});

fccSkuMapRouter.post('/fcc/sku-map', async (req, res) => {
  try {
    const params = upsertSchema.parse(req.body);
    await upsertFccSkuMap(params);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(400).json({ ok: false, error: error.message });
  }
});
