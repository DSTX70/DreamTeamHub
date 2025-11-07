import React from "react";
import { Link } from "react-router-dom";

type Crumb = { label: string; href?: string };

const roleColors: Record<string, string> = {
  ops_viewer: "bg-gray-100 text-gray-700 border-gray-200",
  ops_editor: "bg-blue-100 text-blue-700 border-blue-200",
  ops_admin:  "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const Chip: React.FC<{ role: string }> = ({ role }) => (
  <span className={`text-[10px] px-1 py-0.5 rounded border ${roleColors[role] || "bg-gray-100 text-gray-700 border-gray-200"}`}>{role}</span>
);

const Chevron: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-60">
    <path d="M9 18l6-6-6-6" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const Breadcrumbs: React.FC<{ items: Crumb[]; roles?: string[] }> = ({ items, roles }) => {
  return (
    <div className="flex items-center justify-between">
      <nav className="flex items-center gap-2 text-sm">
        {items.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Chevron />}
            {c.href ? (
              <Link to={c.href} className="text-gray-700 hover:underline">{c.label}</Link>
            ) : (
              <span className="text-gray-900">{c.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>
      {roles && roles.length > 0 && (
        <div className="flex items-center gap-1">
          {roles.slice(0,3).map(r => <Chip key={r} role={r} />)}
          {roles.length > 3 && <span className="text-[10px] px-1 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">+{roles.length-3}</span>}
        </div>
      )}
    </div>
  );
};

export default Breadcrumbs;
