import express, { Request, Response } from "express";
import { inventoryNotifyDao } from "../db/inventoryDao.notify";
import { getUserRoles } from "../security/roles";

export const router = express.Router();

// Require ops_admin for notification settings (more restrictive than general ops_editor)
const requireAdmin = (req: Request, res: Response, next: Function) => {
  const user = (req as any).user;
  if (!user || !user.claims) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  const userId = user.claims.sub;
  const email = user.claims.email || "";
  const roles = getUserRoles(userId, email);
  
  if (!roles.includes("ops_admin")) {
    return res.status(403).json({ error: "Requires ops_admin role" });
  }
  
  next();
};

router.get("/api/ops/inventory/notify", requireAdmin, async (_req: Request, res: Response) => {
  const items = await inventoryNotifyDao.list();
  res.json({ items });
});

router.post("/api/ops/inventory/notify", express.json(), requireAdmin, async (req: Request, res: Response) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  const updates = items.filter((it: any) => 
    it && typeof it.sku === "string" && typeof it.notifySlack === "boolean" && typeof it.notifyEmail === "boolean"
  );
  await inventoryNotifyDao.updateMany(updates);
  res.json({ ok: true });
});

export default router;
