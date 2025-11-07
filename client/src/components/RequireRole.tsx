import { useEffect, useState } from "react";
import { useLocation } from "wouter";

interface RequireRoleProps {
  roles: string[];
  children: React.ReactNode;
  redirectTo?: string;
}

export default function RequireRole({ roles, children, redirectTo = "/ops/overview" }: RequireRoleProps) {
  const [userRoles, setUserRoles] = useState<string[] | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const r = await fetch("/api/ops/_auth/ping");
        const j = await r.json();
        setUserRoles(j.roles || []);
      } catch {
        setUserRoles([]);
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    if (userRoles !== null) {
      const hasAccess = roles.some(role => userRoles.includes(role));
      if (!hasAccess) {
        setLocation(redirectTo);
      }
    }
  }, [userRoles, roles, redirectTo, setLocation]);

  // Loading state
  if (userRoles === null) {
    return <div className="p-4 text-muted-foreground">Loading...</div>;
  }

  // Check access
  const hasAccess = roles.some(role => userRoles.includes(role));
  if (!hasAccess) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
