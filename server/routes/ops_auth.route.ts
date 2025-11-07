import { Router, Request, Response } from "express";

const router = Router();

// Simple role assignment logic
// In a real system, this would query a user_roles table
function getUserRoles(userId: string, email: string): string[] {
  const roles: string[] = [];
  
  // Example: Grant roles based on user ID or email
  // You can customize this logic or store roles in the database
  
  // For now, grant all authenticated users at least viewer access
  roles.push("ops_viewer");
  
  // Grant editor to specific users (example)
  // You can add more sophisticated logic here
  if (email?.includes("@") && email.split("@")[0].length > 0) {
    roles.push("ops_editor");
  }
  
  // Grant admin to specific users (example - customize as needed)
  // In production, you'd check against a database table
  const adminEmails = [
    "dustinsparks@mac.com", 
    "admin@example.com"
  ];
  
  if (adminEmails.includes(email)) {
    roles.push("ops_admin");
  }
  
  return roles;
}

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
