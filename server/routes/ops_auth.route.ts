import { Router, Request, Response } from "express";
import { getUserRoles } from "../security/roles";

const router = Router();

// GET /api/ops/_auth/ping - Returns current user's ops roles
router.get("/ping", (req: Request, res: Response) => {
  const user = (req as any).user;
  
  if (!user || !user.claims) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  const userId = user.claims.sub;
  const email = user.claims.email || "";
  
  const roles = getUserRoles(userId, email);
  
  res.json({
    userId,
    email,
    roles,
  });
});

export default router;
