import React from "react";

const LintRuleCard: React.FC<{ issue: any }> = ({ issue }) => {
  return (
    <div className="border rounded p-2">
      <div className="text-xs text-gray-500">{issue.code} • {issue.level.toUpperCase()}</div>
      <div className="text-sm">{issue.message}</div>
      {issue.path?.length ? <div className="text-xs text-gray-500">Path: {issue.path.join(".")}</div> : null}
      {issue.fix?.description ? <div className="text-xs italic mt-1">Auto-fix: {issue.fix.description}</div> : null}
    </div>
  );
};

export default LintRuleCard;
