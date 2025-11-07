import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

type Crumb = { label: string; href?: string };

const roleColors: Record<string, { bg: string; text: string; border: string }> = {
  ops_viewer: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
  ops_editor: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
  ops_admin: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300" },
};

function RoleChip({ role }: { role: string }) {
  const colors = roleColors[role] || roleColors.ops_viewer;
  return (
    <Badge
      variant="outline"
      className={`${colors.bg} ${colors.text} ${colors.border} text-[10px] px-1.5 py-0 h-5`}
      data-testid={`badge-role-${role}`}
    >
      {role}
    </Badge>
  );
}

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-40 text-muted-foreground">
      <path d="M9 18l6-6-6-6" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default function Breadcrumbs({ items, roles }: { items: Crumb[]; roles?: string[] }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <nav className="flex items-center gap-2 text-sm" data-testid="breadcrumbs-nav">
        {items.map((crumb, i) => (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && <Chevron />}
            {crumb.href ? (
              <Link href={crumb.href} className="text-muted-foreground hover:text-foreground transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium">{crumb.label}</span>
            )}
          </div>
        ))}
      </nav>
      {roles && roles.length > 0 && (
        <div className="flex items-center gap-1" data-testid="breadcrumbs-roles">
          {roles.slice(0, 3).map((role) => (
            <RoleChip key={role} role={role} />
          ))}
          {roles.length > 3 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
              +{roles.length - 3}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
