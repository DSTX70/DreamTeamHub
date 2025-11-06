import React from "react";

const FormRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-600">{label}</span>
      {children}
    </label>
  );
};

export default FormRow;
