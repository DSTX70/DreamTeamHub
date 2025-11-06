import React from "react";

const classes: Record<string, string> = {
  ok: "bg-green-100 text-green-800 border-green-300",
  warn: "bg-yellow-100 text-yellow-800 border-yellow-300",
  err: "bg-red-100 text-red-800 border-red-300",
};

const dot = (k: "ok"|"warn"|"err") => (k === "ok" ? "#16a34a" : k === "warn" ? "#f59e0b" : "#dc2626");

const StatusBadge: React.FC<{ label: string; state: "ok"|"warn"|"err"; href?: string }> = ({ label, state, href }) => {
  const inner = (
    <span className={`inline-flex items-center gap-1 px-2 py-1 border rounded-full text-xs ${classes[state]}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dot(state) }} />
      {label}
    </span>
  );
  return href ? <a href={href}>{inner}</a> : inner;
};

export default StatusBadge;
