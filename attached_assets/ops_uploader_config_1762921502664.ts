import express from 'express';
import { getEffectiveUploadsConfig, updateUploadsConfig } from '../services/opsUploadsConfig';

export const opsUploaderConfigRouter = express.Router();

function requireOpsAdmin(req:any,res:any,next:any){
  const role = (req.headers['x-role'] || '').toString();
  if (role !== 'ops_admin') return res.status(403).json({ error: 'forbidden' });
  next();
}

opsUploaderConfigRouter.get('/config', async (_req, res) => {
  try { res.json(await getEffectiveUploadsConfig()); }
  catch(e:any){ res.status(500).json({ error:'config_read_failed', detail:String(e?.message||e) }); }
});

opsUploaderConfigRouter.post('/config', requireOpsAdmin, async (req, res) => {
  try {
    const userId = (req.headers['x-user-id'] || 'ops_admin').toString();
    const cfg = await updateUploadsConfig(req.body || {}, userId);
    res.json({ ok:true, ...cfg });
  } catch(e:any){
    res.status(400).json({ error:'config_update_failed', detail:String(e?.message||e) });
  }
});
