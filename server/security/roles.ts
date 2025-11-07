/**
 * Centralized role management for ops features
 * In a production system, this would query a user_roles database table
 */

// Simple role assignment logic
// TODO: Replace with database query in production
export function getUserRoles(userId: string, email: string): string[] {
  const roles: string[] = [];
  
  // Grant all authenticated users at least viewer access
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

// Check if user has a specific role
export function hasRole(userId: string, email: string, role: string): boolean {
  const roles = getUserRoles(userId, email);
  return roles.includes(role);
}
