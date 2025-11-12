import express from 'express';
import { getConfig, saveConfig } from '../services/config';
export const uploaderAdminBackupRouter = express.Router();
uploaderAdminBackupRouter.get('/config', (_req, res) => res.json(getConfig()));
uploaderAdminBackupRouter.post('/config', (req, res) => {
  const { backend, allowlist, maxMb } = req.body || {};
  const cfg = getConfig();
  if (backend) cfg.backend = backend;
  if (allowlist) cfg.allowlist = String(allowlist);
  if (maxMb) cfg.maxMb = Number(maxMb);
  saveConfig(cfg);
  res.json({ ok: true, cfg });
});
