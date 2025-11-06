import React from "react";

const colors: Record<string, string> = {
  green: "bg-green-100 text-green-800 border-green-300",
  red: "bg-red-100 text-red-800 border-red-300",
  gray: "bg-gray-100 text-gray-700 border-gray-300",
};

const NotifierBadge: React.FC<{ label: string; active?: boolean; href?: string }> = ({ label, active, href }) => {
  const cls = active ? colors.green : colors.red;
  const inner = (
    <span className={`inline-flex items-center gap-1 px-2 py-1 border rounded-full text-xs ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: active ? "#16a34a" : "#dc2626" }} />
      {label}
    </span>
  );
  return href ? <a href={href}>{inner}</a> : inner;
};

export default NotifierBadge;
